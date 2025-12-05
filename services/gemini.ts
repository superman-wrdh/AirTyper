import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelId = "gemini-2.5-flash";

export const generateSmartCompletion = async (currentText: string): Promise<string> => {
  try {
    if (!currentText || currentText.trim().length === 0) return "";

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            text: `You are a helpful autocomplete assistant. 
            The user typed: "${currentText}".
            Provide a natural completion to this sentence or phrase. 
            Return ONLY the completion text, starting with a space if necessary. 
            Do not repeat the original text. Keep it concise (max 10 words).`
          }
        ]
      },
      config: {
        temperature: 0.3,
        maxOutputTokens: 20,
      }
    });

    return response.text || "";

  } catch (error) {
    console.error("Gemini Completion Error:", error);
    return "";
  }
};
