
import { GoogleGenAI } from "@google/genai";
import { AspectRatio } from "../types";

// In a real production app, these calls would happen on a Node.js server to protect the API Key.
// For this SPA demo, we use process.env.API_KEY as per the instructions.
const getGenAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("Missing API Key. Please ensure it is configured.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateImage = async (
  prompt: string, 
  aspectRatio: AspectRatio = AspectRatio.SQUARE,
  baseImage?: string // Expecting a Data URL: data:image/png;base64,...
): Promise<string> => {
  const ai = getGenAI();
  const model = 'gemini-2.5-flash-image';

  try {
    const parts: any[] = [{ text: prompt }];
    
    if (baseImage) {
      // Dynamically extract the MIME type from the Data URL (e.g., image/jpeg, image/png)
      const mimeTypeMatch = baseImage.match(/data:([^;]+);base64/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
      
      // Extract only the base64 data part
      const cleanBase64 = baseImage.split(',').pop() || baseImage;
      
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType
        }
      });
    }

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        }
      }
    });

    // Find the image part in the response
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      for (const part of candidates[0].content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("The model did not return an image. Please try a more descriptive prompt.");
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    
    // Provide more user-friendly error messages for common API issues
    if (error.message?.includes('INVALID_ARGUMENT')) {
      throw new Error("Gemini couldn't process the uploaded image. Try a smaller file or a different format (JPG/PNG).");
    }
    
    throw error;
  }
};
