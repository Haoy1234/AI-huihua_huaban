import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { generateImageFromText as generateViaManager, editImageWithAI, type AIServiceProvider } from './aiServiceManager';

const API_KEY = process.env.API_KEY;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null as any;

type ImageInput = {
    href: string;
    mimeType: string;
};

export async function editImage(
  images: ImageInput[], 
  prompt: string,
  mask?: ImageInput
): Promise<{ newImageBase64: string | null; newImageMimeType: string | null; textResponse: string | null; }> {
  // 无 Gemini Key 时，直接降级到 OpenRouter
  if (!API_KEY || !ai) {
    const r = await editImageWithAI(images, prompt, 'openrouter' as AIServiceProvider, mask);
    return r;
  }
  
  const imageParts = images.map(image => {
    const dataUrlParts = image.href.split(',');
    const base64Data = dataUrlParts.length > 1 ? dataUrlParts[1] : dataUrlParts[0];
    return {
      inlineData: {
        data: base64Data,
        mimeType: image.mimeType,
      },
    };
  });

  const maskPart = mask ? {
    inlineData: {
      data: mask.href.split(',')[1],
      mimeType: mask.mimeType,
    },
  } : null;

  const textPart = { text: prompt };

  // For inpainting with a mask, the API expects a specific order: prompt, then image, then mask.
  // For other edits, the order is less strict. This ensures the mask is applied correctly.
  const parts = maskPart
    ? [textPart, ...imageParts, maskPart]
    : [...imageParts, textPart];

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: parts,
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    let newImageBase64: string | null = null;
    let newImageMimeType: string | null = null;
    let textResponse: string | null = null;

    if (response.candidates && response.candidates.length > 0 && response.candidates[0].content) {
      const parts = response.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData) {
          newImageBase64 = part.inlineData.data;
          newImageMimeType = part.inlineData.mimeType;
        } else if (part.text) {
          textResponse = part.text;
        }
      }
    } else {
        textResponse = "The AI response was blocked or did not contain content.";
        if (response.candidates && response.candidates.length > 0 && response.candidates[0].finishReason) {
            textResponse += ` (Reason: ${response.candidates[0].finishReason})`;
        }
    }
    
    if (!newImageBase64) {
        // Fallback or error if no image is generated
        console.warn("API response did not contain an image part.", response);
        textResponse = textResponse || "The AI did not generate a new image. Please try a different prompt.";
    }

    return { newImageBase64, newImageMimeType, textResponse };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // 降级到 OpenRouter 编辑
    try {
      const r = await editImageWithAI(images, prompt, 'openrouter' as AIServiceProvider, mask);
      return r;
    } catch (e) {
      return { newImageBase64: null, newImageMimeType: null, textResponse: error instanceof Error ? error.message : 'Gemini edit failed.' };
    }
  }
}

export async function generateImageFromText(prompt: string): Promise<{ newImageBase64: string | null; newImageMimeType: string | null; textResponse: string | null; }> {
  // 无 Gemini Key 时，直接用 OpenRouter 生成
  if (!API_KEY || !ai) {
    const r = await generateViaManager(prompt, { provider: 'openrouter' });
    return { newImageBase64: r.newImageBase64, newImageMimeType: r.newImageMimeType, textResponse: r.textResponse };
  }

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: { numberOfImages: 1, outputMimeType: 'image/png' },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const image = response.generatedImages[0];
      return { newImageBase64: image.image.imageBytes, newImageMimeType: 'image/png', textResponse: null };
    } else {
      return { newImageBase64: null, newImageMimeType: null, textResponse: "The AI did not generate an image. Please try a different prompt." };
    }
  } catch (error) {
    console.error("Error calling Gemini API for text-to-image:", error);
    // 降级到 OpenRouter 生图
    try {
      const r = await generateViaManager(prompt, { provider: 'openrouter' });
      return { newImageBase64: r.newImageBase64, newImageMimeType: r.newImageMimeType, textResponse: r.textResponse };
    } catch (e) {
      return { newImageBase64: null, newImageMimeType: null, textResponse: error instanceof Error ? error.message : 'Gemini generation failed.' };
    }
  }
}