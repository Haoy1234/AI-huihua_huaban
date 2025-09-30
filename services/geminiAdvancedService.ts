import { generateImageFromText as generateViaManager } from "./aiServiceManager";

export type ImageAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export async function generateImagesAdvanced(
  prompt: string,
  aspectRatio: ImageAspectRatio,
  numberOfImages: number,
  provider: 'openrouter' | 'siliconflow'
): Promise<{ images: { base64: string; mimeType: string }[]; textResponse: string | null; }> {
  const ratioToWH = (r: ImageAspectRatio) => {
    switch(r){
      case '16:9': return { width: 1024, height: 576 };
      case '9:16': return { width: 576, height: 1024 };
      case '4:3': return { width: 1024, height: 768 };
      case '3:4': return { width: 768, height: 1024 };
      case '1:1':
      default: return { width: 1024, height: 1024 };
    }
  };
  const { width, height } = ratioToWH(aspectRatio);

  const images: { base64: string; mimeType: string }[] = [];
  let lastText: string | null = null;

  if (provider === 'siliconflow') {
    for (let i = 0; i < Math.max(1, numberOfImages); i++) {
      const r = await generateViaManager(`${prompt}`, {
        provider: 'siliconflow',
        width, height,
        aspectRatio,
      } as any);
      if (r.newImageBase64 && r.newImageMimeType) images.push({ base64: r.newImageBase64, mimeType: r.newImageMimeType });
      if (r.textResponse) lastText = r.textResponse;
    }
  } else {
    // 文生图（text-to-image）时为 OpenRouter 隐式插入严格比例提示；不改变输入框显示
    const strictHint = `Please generate ONE image with exact aspect ratio ${aspectRatio}. Do not crop the main subject. Return only the image (no text).`;
    for (let i = 0; i < Math.max(1, numberOfImages); i++) {
      const r = await generateViaManager(`${prompt}\n\n${strictHint}`, { provider: 'openrouter' } as any);
      if (r.newImageBase64 && r.newImageMimeType) images.push({ base64: r.newImageBase64, mimeType: r.newImageMimeType });
      if (r.textResponse) lastText = r.textResponse;
    }
  }

  return { images, textResponse: lastText || (images.length ? null : 'The AI did not generate images.') };
}


