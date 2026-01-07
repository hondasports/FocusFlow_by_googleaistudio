import { GoogleGenAI, Type } from "@google/genai";
import { MixerConfigResponse } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateMixerConfig = async (prompt: string): Promise<MixerConfigResponse> => {
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const model = "gemini-3-flash-preview";

  const systemInstruction = `
    You are an expert audio engineer and environmental sound designer. 
    Your goal is to configure a procedural sound mixer based on the user's requested mood, task, or environment.
    
    The available sound channels are:
    - 'white': White noise (harsh, full spectrum)
    - 'pink': Pink noise (balanced, soothing)
    - 'brown': Brown noise (deep, rumble)
    - 'rain': Rain drops and texture
    - 'wind': Howling or breezy wind
    - 'fire': Crackling fire
    - 'stream': Flowing water/creek
    - 'waves': Ocean waves
    
    Return a JSON object with:
    1. 'description': A short, evocative phrase describing the vibe (e.g., "Cozy cabin during a storm").
    2. 'settings': An object mapping channel names to volume levels (0.0 to 1.0). Use 0 for muted.
    3. 'moodHex': A generic hex color code that represents the mood (e.g., #1a2b3c for storm, #e67e22 for fire).
    
    Be creative. For "Focus", maybe use Pink noise and Rain. For "Sleep", maybe Brown noise and Waves.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            moodHex: { type: Type.STRING },
            settings: {
              type: Type.OBJECT,
              properties: {
                white: { type: Type.NUMBER },
                pink: { type: Type.NUMBER },
                brown: { type: Type.NUMBER },
                rain: { type: Type.NUMBER },
                wind: { type: Type.NUMBER },
                fire: { type: Type.NUMBER },
                stream: { type: Type.NUMBER },
                waves: { type: Type.NUMBER },
              }
            }
          },
          required: ["description", "settings", "moodHex"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as MixerConfigResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};