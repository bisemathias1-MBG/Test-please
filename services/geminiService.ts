import { GoogleGenAI } from "@google/genai";
import { Gender } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to map gender to voice configuration
const getVoiceForGender = (gender: Gender): string => {
  switch (gender) {
    case Gender.HOMME:
    case Gender.TRANSEXUEL:
      return 'Fenrir'; // Deep male voice
    case Gender.FEMME:
    case Gender.TRANSEXUELLE:
      return 'Kore'; // Soft female voice
    case Gender.COUPLE:
      return 'Puck'; // Neutral/Androgynous
    default:
      return 'Puck';
  }
};

export const generateProfileAudio = async (text: string, gender: Gender): Promise<string | null> => {
  try {
    const voiceName = getVoiceForGender(gender);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: {
        parts: [{ text: text }]
      },
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName
            }
          }
        }
      }
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return audioData || null;

  } catch (error) {
    console.error("Error generating audio:", error);
    return null;
  }
};

export interface LocationResult {
    address: string;
    mapUrl?: string;
}

export const resolveLocation = async (query: string, lat?: number, lng?: number): Promise<LocationResult | null> => {
    try {
        let prompt = `What is the official city and country name for: "${query}"?`;
        
        // If coordinates are provided, use them for retrieval config
        let toolConfig = {};
        if (lat && lng) {
            prompt = "What is the city and country located at these coordinates?";
            toolConfig = {
                retrievalConfig: {
                    latLng: { latitude: lat, longitude: lng }
                }
            };
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: toolConfig
            }
        });

        const text = response.text || "";
        
        // Extract Maps URI from grounding chunks
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        let mapUrl = undefined;
        
        if (groundingChunks) {
            // Look for a map URI in the chunks
            for (const chunk of groundingChunks) {
                if (chunk.web?.uri?.includes("google.com/maps")) {
                    mapUrl = chunk.web.uri;
                    break;
                }
            }
        }

        // Simple cleanup of the text response to be used as the address display
        // Gemini usually answers "The city is X". We just want "X".
        // For this demo, we'll use the full text but trim it, or fallback to the query if empty.
        const cleanAddress = text.replace(/The city is |The location is /i, '').trim();

        return {
            address: cleanAddress || query,
            mapUrl: mapUrl
        };

    } catch (error) {
        console.error("Error resolving location:", error);
        return null;
    }
};