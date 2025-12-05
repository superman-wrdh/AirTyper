import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from "@mediapipe/tasks-vision";

let handLandmarker: HandLandmarker | null = null;
let runningMode: "IMAGE" | "VIDEO" = "VIDEO";

export const initializeHandDetection = async (): Promise<void> => {
  if (handLandmarker) return;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU"
    },
    runningMode: runningMode,
    numHands: 1,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
};

export const detectHands = (video: HTMLVideoElement, timestamp: number): HandLandmarkerResult | null => {
  if (!handLandmarker) return null;
  return handLandmarker.detectForVideo(video, timestamp);
};

// Calculate distance between two 3D points
export const calculateDistance = (p1: {x: number, y: number, z: number}, p2: {x: number, y: number, z: number}) => {
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) +
    Math.pow(p2.y - p1.y, 2) +
    Math.pow(p2.z - p1.z, 2)
  );
};
