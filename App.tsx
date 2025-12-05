import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Keyboard, Trash2, Copy, Hand, Sparkles, Loader2 } from 'lucide-react';
import { GlassKeyboard } from './components/GlassKeyboard';
import { initializeHandDetection, detectHands, calculateDistance } from './services/handDetection';
import { generateSmartCompletion } from './services/gemini';

export default function App() {
  const webcamRef = useRef<Webcam>(null);
  const requestRef = useRef<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Hand Tracking State
  const [cursorPos, setCursorPos] = useState<{x: number, y: number} | null>(null);
  const [isPinching, setIsPinching] = useState(false);
  
  // Typing State
  const [typedText, setTypedText] = useState<string>("");
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isShift, setIsShift] = useState(false);
  const lastKeyPressTime = useRef<number>(0);

  // Gemini State
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initializeHandDetection();
      setIsLoaded(true);
    };
    init();
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  const processFrame = useCallback(() => {
    if (
      webcamRef.current && 
      webcamRef.current.video && 
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const startTimeMs = performance.now();
      const results = detectHands(video, startTimeMs);

      if (results && results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        
        // Landmark 8 is Index Finger Tip
        // Landmark 4 is Thumb Tip
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];

        // 1. Update Cursor Position (Mirrored X)
        const screenX = (1 - indexTip.x) * window.innerWidth;
        const screenY = indexTip.y * window.innerHeight;
        
        setCursorPos({ x: screenX, y: screenY });

        // 2. Detect Pinch (Click Interaction)
        const pinchDistance = calculateDistance(indexTip, thumbTip);
        const PINCH_THRESHOLD = 0.06; // Adjusted threshold
        const nowPinching = pinchDistance < PINCH_THRESHOLD;
        
        setIsPinching(nowPinching);

        // 3. Collision Detection with Keyboard (Circle-Rect Intersection)
        // This ensures touching the edge triggers the key
        const CURSOR_RADIUS = 25; // How forgiving the touch is (pixels)
        const keys = document.querySelectorAll('[data-key]');
        let foundKey: string | null = null;
        
        // We iterate through keys to find if our cursor "circle" touches any key "rect"
        for (const el of keys) {
          const rect = el.getBoundingClientRect();
          
          // Expand the hit area of the key by the cursor radius
          // This simulates the cursor having physical size
          const hitLeft = rect.left - CURSOR_RADIUS;
          const hitRight = rect.right + CURSOR_RADIUS;
          const hitTop = rect.top - CURSOR_RADIUS;
          const hitBottom = rect.bottom + CURSOR_RADIUS;

          if (screenX >= hitLeft && screenX <= hitRight &&
              screenY >= hitTop && screenY <= hitBottom) {
             foundKey = el.getAttribute('data-key');
             break; // Found a key
          }
        }
        
        setHoverKey(foundKey);

        // 4. Trigger Click
        if (nowPinching && foundKey && Date.now() - lastKeyPressTime.current > 400) {
          handleKeyPress(foundKey);
          lastKeyPressTime.current = Date.now();
        }
      } else {
        setCursorPos(null);
        setHoverKey(null);
        setIsPinching(false);
      }
    }
    requestRef.current = requestAnimationFrame(processFrame);
  }, [webcamRef, isShift]); // Added isShift dependency if needed, though handleKeyPress is stable

  useEffect(() => {
    if (isLoaded) {
      requestRef.current = requestAnimationFrame(processFrame);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isLoaded, processFrame]);

  const handleKeyPress = (key: string) => {
    setActiveKey(key);
    setTimeout(() => setActiveKey(null), 200);

    if (key === 'SHIFT') {
      setIsShift(prev => !prev);
      return;
    }

    if (key === 'DEL') {
      setTypedText(prev => prev.slice(0, -1));
      return;
    }

    if (key === 'SPACE') {
      setTypedText(prev => prev + ' ');
      return;
    }

    // Normal character handling
    let charToType = key;
    if (key.length === 1 && /[a-zA-Z]/.test(key)) {
      // Toggle logic: If isShift is true, type Uppercase. Else Lowercase.
      // Note: The key detection returns the raw key (which is uppercase in the ID).
      charToType = isShift ? key.toUpperCase() : key.toLowerCase();
    }
    
    setTypedText(prev => prev + charToType);
  };

  const handleMagicComplete = async () => {
    if (!typedText) return;
    setIsThinking(true);
    const completion = await generateSmartCompletion(typedText);
    setTypedText(prev => prev + completion);
    setIsThinking(false);
  };

  const handleClear = () => setTypedText("");
  const handleCopy = () => navigator.clipboard.writeText(typedText);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between py-6 px-4 overflow-hidden">
      
      {/* Background Camera Layer */}
      <div className="fixed inset-0 z-0 bg-black">
        <Webcam
          ref={webcamRef}
          audio={false}
          className="w-full h-full object-cover opacity-60"
          mirrored={true}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: "user",
            width: 1280,
            height: 720
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/80 pointer-events-none" />
      </div>

      {/* Floating Cursor */}
      {cursorPos && (
        <div 
          className="air-cursor rounded-full border-2 shadow-[0_0_20px_rgba(0,243,255,0.6)] flex items-center justify-center transition-all duration-75"
          style={{ 
            left: cursorPos.x, 
            top: cursorPos.y,
            width: isPinching ? '20px' : '40px',
            height: isPinching ? '20px' : '40px',
            borderColor: isPinching ? '#00f3ff' : hoverKey ? '#ffffff' : 'rgba(0, 243, 255, 0.6)',
            backgroundColor: isPinching ? '#00f3ff' : hoverKey ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 243, 255, 0.1)',
            transform: `translate(-50%, -50%) scale(${isPinching ? 0.8 : 1})`
          }}
        >
          {/* Inner dot */}
          <div className={`w-2 h-2 rounded-full transition-colors ${isPinching ? 'bg-white' : 'bg-neon'}`}></div>
          
          {/* Hover Indicator Text above cursor */}
          {hoverKey && !isPinching && (
             <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm whitespace-nowrap border border-white/20">
               {hoverKey === 'SPACE' ? 'SPACE' : hoverKey}
             </div>
          )}
        </div>
      )}

      {/* Top Bar: Output Display */}
      {/* Increased z-index and background opacity to ensure visibility */}
      <div className="relative z-20 w-full max-w-5xl glass-panel rounded-2xl p-6 mb-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/20 mt-8 backdrop-blur-xl bg-slate-900/40">
        <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 text-neon">
            <Keyboard size={24} />
            <span className="text-sm font-bold tracking-[0.2em] uppercase">Gemini AirTyper</span>
          </div>
          <div className="flex gap-3">
             <button onClick={handleCopy} className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/5 text-white/70 hover:text-white" title="Copy">
              <Copy size={18} />
            </button>
            <button onClick={handleClear} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-white/5" title="Clear">
              <Trash2 size={18} />
            </button>
          </div>
        </div>
        
        {/* Main Text Display Area */}
        <div className="min-h-[120px] flex flex-wrap content-start">
           {typedText.length === 0 ? (
             <span className="text-white/30 text-3xl font-light italic">Type something...</span>
           ) : (
             <p className="text-3xl md:text-5xl font-mono font-medium tracking-wide break-all text-white drop-shadow-lg leading-relaxed">
              {typedText}
             </p>
           )}
           <span className="animate-pulse inline-block w-4 h-8 md:h-12 bg-neon ml-2 align-middle rounded-sm shadow-[0_0_10px_#00f3ff]"></span>
        </div>

        <div className="flex justify-between items-end mt-4 pt-4 border-t border-white/10">
           {/* Gemini AI Integration */}
           <button 
              onClick={handleMagicComplete}
              disabled={isThinking || !typedText}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600/60 hover:bg-indigo-500/80 border border-indigo-400/50 text-white shadow-lg shadow-indigo-500/20 transition-all text-sm font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              {isThinking ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              Smart Complete
            </button>

            {!isLoaded && (
               <div className="flex items-center gap-2 text-yellow-400 text-sm animate-pulse font-medium bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20">
                 <Loader2 className="animate-spin" size={14} />
                 Initializing Vision...
               </div>
            )}
        </div>
      </div>

      {/* Instructions Overlay */}
      <div className={`relative z-10 transition-all duration-700 ${typedText ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-3 text-white bg-black/60 px-6 py-3 rounded-full backdrop-blur-md border border-white/15 shadow-xl">
            <Hand size={20} className="text-neon" />
            <span className="font-medium">Pinch index & thumb to type</span>
          </div>
          <p className="text-white/40 text-sm">Hover over keys to select</p>
        </div>
      </div>

      {/* Bottom: Virtual Keyboard */}
      <div className="relative z-10 w-full mt-auto pb-4 md:pb-8 px-2">
        <GlassKeyboard activeKey={activeKey} hoverKey={hoverKey} isShift={isShift} />
      </div>

    </div>
  );
}