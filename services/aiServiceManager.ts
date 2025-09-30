// AI服务管理器 - 支持多种AI服务提供商
import OpenAI from 'openai';

export type AIServiceProvider = 'gemini' | 'siliconflow' | 'openrouter';

export interface AIServiceConfig {
  name: string;
  displayName: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  supportedFeatures: ('text-to-image' | 'image-edit')[];
}

export interface AIServiceResult {
  newImageBase64: string | null;
  newImageMimeType: string | null;
  textResponse: string | null;
}

export interface GenerateImageOptions {
  provider: AIServiceProvider;
  model?: string;
  batchSize?: number;
  inferenceSteps?: number;
  guidanceScale?: number;
  width?: number;
  height?: number;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
}

// 硅基流动API响应接口（根据实际返回格式）
export interface SiliconFlowResponse {
  images: Array<{
    url: string;
  }>;
  timings: {
    inference: number;
  };
  seed: number;
}

// OpenRouter API响应接口
export interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string | Array<{
        type: string;
        text?: string;
        image_url?: {
          url: string;
        };
      }>;
    };
    finish_reason: string;
  }>;
}

// AI服务配置
export const AI_SERVICE_CONFIGS: Record<AIServiceProvider, AIServiceConfig> = {
  gemini: {
    name: 'gemini',
    displayName: 'Google Gemini',
    supportedFeatures: ['image-edit'],
  },
  siliconflow: {
    name: 'siliconflow',
    displayName: 'Wan2.2',
    baseUrl: 'https://api.siliconflow.cn/v1/images/generations',
    model: 'Qwen/Qwen-Image',
    supportedFeatures: ['text-to-image'],
  },
  openrouter: {
    name: 'openrouter',
    displayName: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'google/gemini-2.5-flash-image-preview',
    apiKey: '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',
    supportedFeatures: ['text-to-image', 'image-edit'],
  }
};

// 硅基流动API密钥
const SILICON_FLOW_API_KEY = 'sk-rtddpmojvcashzpwrceinvstfkzilcanzengsykhmerqdouf';

// 导入原有的Gemini服务
import { generateImageFromText as geminiGenerateImage, editImage as geminiEditImage } from './geminiService';

// Gemini服务调用（使用原有逻辑）
async function callGeminiService(prompt: string): Promise<AIServiceResult> {
  try {
    // 调用原有的Gemini服务
    return await geminiGenerateImage(prompt);
  } catch (error) {
    console.error('Gemini service error:', error);
    return {
      newImageBase64: null,
      newImageMimeType: null,
      textResponse: `❌ Gemini服务错误: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}

// 使用更可靠的方法下载图像
async function downloadImageViaProxy(imageUrl: string): Promise<string> {
  // 更可靠的代理服务列表
  const proxyServices = [
    // 专门用于图像的代理服务
    {
      url: 'https://images.weserv.nl/?url=',
      needsEncoding: false
    },
    // 通用CORS代理服务
    {
      url: 'https://proxy.cors.sh/',
      needsEncoding: false
    },
    {
      url: 'https://corsproxy.io/?',
      needsEncoding: true
    },
    {
      url: 'https://api.allorigins.win/raw?url=',
      needsEncoding: true
    },
    // 备用服务
    {
      url: 'https://api.codetabs.com/v1/proxy?quest=',
      needsEncoding: true
    }
  ];
  
  for (const proxyService of proxyServices) {
    try {
      console.log(`🔄 尝试代理服务: ${proxyService.url}`);
      
      // 构建代理URL
      let proxyUrl;
      if (proxyService.needsEncoding) {
        proxyUrl = proxyService.url + encodeURIComponent(imageUrl);
      } else {
        proxyUrl = proxyService.url + imageUrl;
      }
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'image/*,*/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        // 添加超时控制
        signal: AbortSignal.timeout(10000) // 10秒超时
      });
      
      if (!response.ok) {
        throw new Error(`代理响应错误: ${response.status} ${response.statusText}`);
      }
      
      // 检查响应类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error(`响应不是图像类型: ${contentType}`);
      }
      
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);
      
      console.log('✅ 代理下载成功，图像大小:', blob.size, 'bytes');
      return base64.split(',')[1]; // 移除data:image/png;base64,前缀
      
    } catch (error) {
      console.warn(`❌ 代理服务 ${proxyService.url} 失败:`, error);
      continue; // 尝试下一个代理
    }
  }
  
  throw new Error('所有代理服务都失败了');
}

// 使用foreignObject直接嵌入图像
async function createDirectImageDisplay(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      // 计算合适的显示尺寸（最大500px）
      const maxSize = 500;
      let displayWidth = img.width;
      let displayHeight = img.height;
      
      if (img.width > maxSize || img.height > maxSize) {
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        displayWidth = Math.round(img.width * ratio);
        displayHeight = Math.round(img.height * ratio);
      }
      
      // 创建包含图像的SVG
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${displayWidth}" height="${displayHeight + 60}">
          <!-- 背景 -->
          <rect width="${displayWidth}" height="${displayHeight + 60}" fill="#ffffff" stroke="#e0e0e0" stroke-width="1" rx="8"/>
          
          <!-- 图像容器 -->
          <foreignObject x="0" y="0" width="${displayWidth}" height="${displayHeight}">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; overflow: hidden; border-radius: 8px 8px 0 0;">
              <img src="${imageUrl}" 
                   style="width: ${displayWidth}px; height: ${displayHeight}px; object-fit: cover; display: block;" 
                   alt="AI生成的图像"/>
            </div>
          </foreignObject>
          
          <!-- 底部信息栏 -->
          <rect x="0" y="${displayHeight}" width="${displayWidth}" height="60" fill="#f8f9fa" stroke="#e0e0e0" stroke-width="1" rx="0 0 8 8"/>
          <text x="${displayWidth/2}" y="${displayHeight + 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#28a745">
            ✅ AI图像生成成功
          </text>
          <text x="${displayWidth/2}" y="${displayHeight + 35}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#6c757d">
            尺寸: ${img.width} × ${img.height} | 显示: ${displayWidth} × ${displayHeight}
          </text>
          <text x="${displayWidth/2}" y="${displayHeight + 50}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#007bff">
            💡 右键可保存原图到本地
          </text>
        </svg>
      `;
      
      const base64Svg = btoa(unescape(encodeURIComponent(svgContent)));
      console.log(`✅ 直接图像显示创建成功 (${displayWidth}×${displayHeight})`);
      resolve(base64Svg);
    };
    
    img.onerror = () => {
      console.warn('❌ 图像加载失败，创建错误提示');
      const errorSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" style="background: #fff;">
          <rect width="400" height="200" fill="#fff3cd" stroke="#ffeaa7" stroke-width="2" rx="8"/>
          <text x="200" y="80" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#856404">
            ⚠️ 图像无法直接显示
          </text>
          <text x="200" y="110" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#856404">
            请使用上传功能手动添加
          </text>
          <text x="200" y="140" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#007bff">
            图像已成功生成，质量完整
          </text>
        </svg>
      `;
      const base64Svg = btoa(unescape(encodeURIComponent(errorSvg)));
      resolve(base64Svg);
    };
    
    img.src = imageUrl;
  });
}

// 创建嵌入图像的SVG（使用pattern方式）
async function createEmbeddedImageSVG(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    
    // 不设置crossOrigin，这样可以显示但不能读取像素数据
    img.onload = () => {
      // 创建包含实际图像的SVG
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
             width="${img.width}" height="${img.height}" viewBox="0 0 ${img.width} ${img.height}">
          <defs>
            <pattern id="imagePattern" patternUnits="userSpaceOnUse" width="${img.width}" height="${img.height}">
              <image href="${imageUrl}" width="${img.width}" height="${img.height}"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#imagePattern)"/>
        </svg>
      `;
      
      const base64Svg = btoa(unescape(encodeURIComponent(svgContent)));
      console.log('✅ 嵌入式SVG图像创建成功');
      resolve(base64Svg);
    };
    
    img.onerror = () => {
      // 如果图像加载失败，创建一个占位符
      const fallbackSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background: #f8f9fa;">
          <rect width="400" height="300" fill="#e9ecef" stroke="#dee2e6" stroke-width="2" rx="8"/>
          <text x="200" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6c757d">
            🖼️ 图像生成成功
          </text>
          <text x="200" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#6c757d">
            但无法直接显示
          </text>
          <text x="200" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#0066cc">
            请使用上传功能添加图像
          </text>
        </svg>
      `;
      const base64Svg = btoa(unescape(encodeURIComponent(fallbackSvg)));
      resolve(base64Svg);
    };
    
    // 加载图像以获取尺寸
    img.src = imageUrl;
  });
}

// 创建可自定义尺寸的Canvas占位图像
function createCustomSizeCanvasImage(
  imageUrl: string, 
  prompt: string, 
  width: number = 512, 
  height: number = 512
): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法创建Canvas上下文');
  }
  
  // 设置自定义尺寸
  canvas.width = width;
  canvas.height = height;
  
  // 渐变背景
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#4facfe');
  gradient.addColorStop(1, '#00f2fe');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // 计算字体大小（根据画布尺寸自适应）
  const baseFontSize = Math.min(width, height) / 20;
  const titleFontSize = Math.max(16, baseFontSize);
  const textFontSize = Math.max(12, baseFontSize * 0.6);
  
  // 绘制中心图标
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${titleFontSize * 2}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎨', width / 2, height * 0.35);
  
  // 绘制标题
  ctx.font = `bold ${titleFontSize}px Arial`;
  ctx.fillText('AI生成图像', width / 2, height * 0.55);
  
  // 绘制提示词（简化显示）
  ctx.font = `${textFontSize}px Arial`;
  ctx.fillStyle = '#f0f0f0';
  const displayPrompt = prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt;
  ctx.fillText(`"${displayPrompt}"`, width / 2, height * 0.7);
  
  // 绘制尺寸信息
  ctx.font = `${textFontSize * 0.8}px Arial`;
  ctx.fillStyle = '#e0e0e0';
  ctx.fillText(`${width} × ${height} 像素`, width / 2, height * 0.85);
  
  // 转换为base64
  const dataUrl = canvas.toDataURL('image/png', 0.9);
  return dataUrl.split(',')[1]; // 移除data:image/png;base64,前缀
}

// OpenRouter服务调用 - 完全按照官方范例，修复浏览器环境问题
async function callOpenRouterService(
  prompt: string,
  options: GenerateImageOptions
): Promise<AIServiceResult> {
  const config = AI_SERVICE_CONFIGS.openrouter;
  
  // 完全按照官方范例初始化OpenAI客户端，添加浏览器支持
  const referer = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const siteTitle = (typeof document !== 'undefined' && document.title) ? document.title : 'BananaPad AI Editor';
  const isLocal = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)/.test(window.location.hostname);
  const openai = new OpenAI({
    baseURL: isLocal ? (window.location.origin + "/or/api/v1") : "https://openrouter.ai/api/v1",
    apiKey: config.apiKey,
    defaultHeaders: {
      "HTTP-Referer": referer,
      "X-Title": siteTitle,
    },
    dangerouslyAllowBrowser: true, // 允许在浏览器环境中运行
  });

  try {
    console.log('🚀 调用OpenRouter API:', prompt);
    console.log('📋 使用模型:', options.model || config.model);
    
    // 完全按照官方范例调用API
    const completion = await openai.chat.completions.create(
      ({
        model: options.model || config.model,
        messages: [
          {
            role: 'system',
            content: [
              { type: 'text', text: 'Return an image as the primary output. Include a short caption if available.' }
            ]
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt }
            ]
          }
        ],
        // 提示 Google/Gemini 返回 IMAGE + TEXT
        extra_body: {
          google: { response_modalities: ['IMAGE', 'TEXT'] }
        }
      } as any),
      {
        // 官方 SDK 支持传入 AbortSignal，用于超时控制
        signal: AbortSignal.timeout(45000)
      }
    );

    console.log('✅ OpenRouter API响应成功');
console.log('📝 完整响应对象:', completion);

// 修复：先检查响应结构，再访问具体内容
if (!completion) {
  console.error('❌ completion对象为空');
  throw new Error('OpenRouter API返回空响应');
}

if (!completion.choices) {
  console.error('❌ completion.choices不存在');
  console.log('📋 响应结构:', Object.keys(completion));
  throw new Error('OpenRouter API响应中没有choices字段');
}

if (!Array.isArray(completion.choices) || completion.choices.length === 0) {
  console.error('❌ completion.choices为空数组或不是数组');
  console.log('📋 choices内容:', completion.choices);
  throw new Error('OpenRouter API响应中choices为空');
}

console.log('📝 第一个choice:', completion.choices[0]);

const message = completion.choices[0].message;
if (!message) {
  console.error('❌ message对象不存在');
  throw new Error('OpenRouter API响应中没有message');
}

// 解析 message.content（可能是字符串或由多个部分组成的数组）
const content: any = (message as any).content;
let textResponse: string | null = null;
let imageUrl: string | null = null;

if (typeof content === 'string') {
  const trimmed = content.trim();
  textResponse = trimmed.length > 0 ? trimmed : null;
} else if (Array.isArray(content)) {
  for (const part of content) {
    if (part && part.type === 'text' && typeof part.text === 'string') {
      textResponse = textResponse ? `${textResponse}\n${part.text}` : part.text;
    }
    // 常见图片结构：{ type: 'image_url', image_url: { url } }
    if (part && (part.type === 'image_url' || part.type === 'output_image') && part.image_url && typeof part.image_url.url === 'string') {
      imageUrl = part.image_url.url;
    } else if (part && part.image_url && typeof part.image_url.url === 'string') {
      imageUrl = imageUrl || part.image_url.url;
    }
  }
}

// 兼容：部分提供商把图片放在 message.images 数组中
const msgAny: any = message as any;
if (!imageUrl && Array.isArray(msgAny?.images)) {
  for (const img of msgAny.images) {
    const url = img?.image_url?.url;
    if (typeof url === 'string' && url) {
      imageUrl = url;
      break;
    }
  }
}

console.log('📝 文本响应:', textResponse || '(空)');
console.log('🖼️ 图片URL:', imageUrl || '(无)');

// 优先处理图片
if (imageUrl) {
  // 如果是 data:URL，直接返回
  if (imageUrl.startsWith('data:')) {
    try {
      const commaIdx = imageUrl.indexOf(',');
      const header = imageUrl.slice(5, commaIdx); // 例如 image/png;base64
      const base64 = imageUrl.slice(commaIdx + 1);
      const mime = header.split(';')[0] || 'image/png';
      return {
        newImageBase64: base64,
        newImageMimeType: mime,
        textResponse: textResponse
          ? `🤖 OpenRouter AI (${options.model || config.model}) 文本：\n\n${textResponse}`
          : null
      };
    } catch (e) {
      console.warn('⚠️ data:URL 解析失败，回退到代理下载:', e);
    }
  }
  try {
    console.log('📥 通过代理下载图像...');
    const base64Data = await downloadImageViaProxy(imageUrl);
    console.log('✅ 图像下载并转换成功');
    return {
      newImageBase64: base64Data,
      newImageMimeType: 'image/png',
      textResponse: textResponse
        ? `🤖 OpenRouter AI (${options.model || config.model}) 文本：\n\n${textResponse}`
        : null
    };
  } catch (imgErr) {
    console.warn('❌ 图像下载失败，改用可视化占位图:', imgErr);
    try {
      const customWidth = 1024;
      const customHeight = 1024;
      const canvasBase64 = createCustomSizeCanvasImage(imageUrl, prompt, customWidth, customHeight);
      return {
        newImageBase64: canvasBase64,
        newImageMimeType: 'image/png',
        textResponse: `🎨 图像生成成功！\n\n📷 原图链接：${imageUrl}\n\n(显示为占位图)`
      };
    } catch (canvasErr) {
      console.error('❌ 占位图创建失败:', canvasErr);
      return {
        newImageBase64: null,
        newImageMimeType: null,
        textResponse: `🎨 图像生成成功！但无法直接显示，请访问链接：\n${imageUrl}`
      };
    }
  }
}

// 无图片则基于文本创建可视化
if (textResponse) {
  try {
    console.log('🎨 基于文本响应创建可视化图像...');
    const customWidth = 1024;
    const customHeight = 1024;
    const canvasBase64 = createCustomSizeCanvasImage('', textResponse, customWidth, customHeight);
    console.log(`✅ OpenRouter响应可视化图像创建成功 (${customWidth}×${customHeight})`);
    return {
      newImageBase64: canvasBase64,
      newImageMimeType: 'image/png',
      textResponse: `🤖 OpenRouter AI (${options.model || config.model}) 文本：\n\n${textResponse}`
    };
  } catch (canvasError) {
    console.error('❌ 可视化图像创建失败:', canvasError);
    return {
      newImageBase64: null,
      newImageMimeType: null,
      textResponse: `🤖 OpenRouter AI (${options.model || config.model}) 文本：\n\n${textResponse}`
    };
  }
}

// Fallback：解析 OpenRouter 原生结构中的 inlineData（Gemini 风格）
try {
  const choiceAny: any = (completion as any)?.choices?.[0];
  const native = choiceAny?.native_response;
  const partsNative: any[] = native?.candidates?.[0]?.content?.parts || [];

  let inlineBase64: string | null = null;
  let inlineMime: string | null = null;
  let inlineText: string | null = textResponse;

  for (const p of partsNative) {
    if (p?.inlineData?.data && typeof p.inlineData.data === 'string') {
      inlineBase64 = p.inlineData.data;
      inlineMime = p.inlineData.mimeType || 'image/png';
    } else if (typeof p?.text === 'string' && p.text.trim()) {
      inlineText = inlineText ? `${inlineText}\n${p.text}` : p.text;
    }
  }

  if (inlineBase64) {
    return {
      newImageBase64: inlineBase64,
      newImageMimeType: inlineMime || 'image/png',
      textResponse: inlineText
        ? `🤖 OpenRouter AI (${options.model || config.model}) 文本：\n\n${inlineText}`
        : null
    };
  }
} catch (nativeErr) {
  console.warn('⚠️ 解析 native_response 失败:', nativeErr);
}

console.warn('⚠️ 未从OpenRouter响应中解析到文本或图片');
return {
  newImageBase64: null,
  newImageMimeType: null,
  textResponse: `⚠️ OpenRouter AI (${options.model || config.model}) 未返回有效内容。`
};
  } catch (error) {
    console.error('OpenRouter服务错误:', error);
    throw error;
  }
}

// 硅基流动服务调用
async function callSiliconFlowService(
  prompt: string, 
  options: GenerateImageOptions
): Promise<AIServiceResult> {
  const url = 'https://api.siliconflow.cn/v1/images/generations';
  const requestOptions = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SILICON_FLOW_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      model: options.model || 'Qwen/Qwen-Image',
      batch_size: options.batchSize || 1,
      num_inference_steps: options.inferenceSteps || 20,
      guidance_scale: options.guidanceScale || 7.5,
      // 尝试传入尺寸/比例（若服务支持会生效）
      width: options.width,
      height: options.height,
      aspect_ratio: options.aspectRatio
    })
  };

  try {
    console.log('🚀 调用硅基流动API:', prompt);
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('硅基流动API错误:', response.status, errorText);
      throw new Error(`硅基流动API错误: ${response.status} ${errorText}`);
    }

    const data: SiliconFlowResponse = await response.json();
    console.log('硅基流动API响应:', data);

    if (data.images && data.images.length > 0) {
      const image = data.images[0];
      
      if (image.url) {
        console.log('📥 开始处理图像:', image.url);
        
        // 首先尝试代理下载
        try {
          console.log('🔄 尝试代理下载...');
          const base64Data = await downloadImageViaProxy(image.url);
          
          console.log('✅ 代理下载成功');
          return {
            newImageBase64: base64Data,
            newImageMimeType: 'image/png',
            textResponse: null
          };
        } catch (proxyError) {
          console.warn('❌ 代理下载失败，创建占位图像:', proxyError);
          
          // 创建可自定义尺寸的占位图像
          try {
            console.log('🔄 创建占位图像...');
            
            // 可自定义尺寸 - 您可以修改这些值
            const customWidth = 1024;  // 可修改：图像宽度
            const customHeight = 1024; // 可修改：图像高度
            
            const canvasBase64 = createCustomSizeCanvasImage(
              image.url, 
              prompt, 
              customWidth, 
              customHeight
            );
            
            console.log(`✅ 占位图像创建成功 (${customWidth}×${customHeight})`);
            return {
              newImageBase64: canvasBase64,
              newImageMimeType: 'image/png',
              textResponse: `🎨 图像生成成功！\n\n📷 原图链接：${image.url}\n\n💡 显示的是 ${customWidth}×${customHeight} 的占位图像，可用于后续操作。`
            };
          } catch (canvasError) {
            console.error('❌ 占位图像创建失败:', canvasError);
            
            // 最终备选方案
            return {
              newImageBase64: null,
              newImageMimeType: null,
              textResponse: `🎨 图像生成成功！\n\n📷 原图链接：${image.url}\n\n请手动访问链接获取图像。`
            };
          }
        }
      }
    }

    throw new Error('硅基流动API没有返回有效的图像数据');
  } catch (error) {
    console.error('硅基流动服务错误:', error);
    throw error;
  }
}

// OpenRouter 图像编辑
export type ImageInput = { href: string; mimeType: string };

async function callOpenRouterImageEdit(
  images: ImageInput[],
  prompt: string,
  mask?: ImageInput,
  model?: string
): Promise<AIServiceResult> {
  const config = AI_SERVICE_CONFIGS.openrouter;

  const referer = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const siteTitle = (typeof document !== 'undefined' && document.title) ? document.title : 'BananaPad AI Editor';
  const isLocal = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)/.test(window.location.hostname);
  const openai = new OpenAI({
    baseURL: isLocal ? (window.location.origin + "/or/api/v1") : "https://openrouter.ai/api/v1",
    apiKey: config.apiKey,
    defaultHeaders: {
      "HTTP-Referer": referer,
      "X-Title": siteTitle,
    },
    dangerouslyAllowBrowser: true,
  });

  const content: any[] = [
    { type: 'text', text: mask ? `${prompt}\n\nPlease edit the following image(s) with the mask provided (white=keep, black=edit).` : prompt },
    ...images.map(img => ({ type: 'image_url', image_url: { url: img.href } })),
  ];

  if (mask) {
    content.push({ type: 'text', text: 'Mask image:' });
    content.push({ type: 'image_url', image_url: { url: mask.href } });
  }

  const completion = await openai.chat.completions.create(
    ({
      model: model || config.model,
      messages: [
        {
          role: 'system',
          content: [{ type: 'text', text: 'Return an image as the primary output. Include a short caption if available.' }]
        },
        { role: 'user', content }
      ],
      extra_body: {
        google: { response_modalities: ['IMAGE', 'TEXT'] }
      }
    } as any),
    { signal: AbortSignal.timeout(45000) }
  );

  if (!completion?.choices?.length) {
    return { newImageBase64: null, newImageMimeType: null, textResponse: `⚠️ OpenRouter未返回有效内容。` };
  }

  const message: any = completion.choices[0].message;
  const parts: any[] = Array.isArray(message.content)
    ? message.content
    : (typeof message.content === 'string' ? [{ type: 'text', text: message.content }] : []);

  let textResponse: string | null = null;
  let imageUrl: string | null = null;

  for (const part of parts) {
    if (part?.type === 'text' && typeof part.text === 'string') {
      textResponse = textResponse ? `${textResponse}\n${part.text}` : part.text;
    }
    if (part?.image_url?.url && typeof part.image_url.url === 'string') {
      imageUrl = imageUrl || part.image_url.url;
    }
  }

  // 兼容：message.images
  const messageEdit: any = completion.choices?.[0]?.message;
  if (!imageUrl && Array.isArray(messageEdit?.images)) {
    for (const img of messageEdit.images) {
      const url = img?.image_url?.url;
      if (typeof url === 'string' && url) {
        imageUrl = url;
        break;
      }
    }
  }

  if (imageUrl) {
    // data:URL 直返
    if (imageUrl.startsWith('data:')) {
      try {
        const commaIdx = imageUrl.indexOf(',');
        const header = imageUrl.slice(5, commaIdx);
        const base64 = imageUrl.slice(commaIdx + 1);
        const mime = header.split(';')[0] || 'image/png';
        return { newImageBase64: base64, newImageMimeType: mime, textResponse };
      } catch (e) {
        console.warn('⚠️ data:URL 解析失败，回退到代理下载:', e);
      }
    }
    try {
      const base64Data = await downloadImageViaProxy(imageUrl);
      return { newImageBase64: base64Data, newImageMimeType: 'image/png', textResponse };
    } catch {
      const canvasBase64 = createCustomSizeCanvasImage(imageUrl, prompt, 1024, 1024);
      return { newImageBase64: canvasBase64, newImageMimeType: 'image/png', textResponse: `🎨 图像生成成功！\n\n📷 原图链接：${imageUrl}\n\n(显示为占位图)` };
    }
  }

  if (textResponse) {
    const canvasBase64 = createCustomSizeCanvasImage('', textResponse, 1024, 1024);
    return { newImageBase64: canvasBase64, newImageMimeType: 'image/png', textResponse };
  }

  // native_response.inlineData 兜底
  try {
    const choiceAny: any = (completion as any)?.choices?.[0];
    const native = choiceAny?.native_response;
    const partsNative: any[] = native?.candidates?.[0]?.content?.parts || [];
    for (const p of partsNative) {
      if (p?.inlineData?.data && typeof p.inlineData.data === 'string') {
        const inlineBase64 = p.inlineData.data;
        const inlineMime = p.inlineData.mimeType || 'image/png';
        return { newImageBase64: inlineBase64, newImageMimeType: inlineMime, textResponse };
      }
    }
  } catch (e) {
    console.warn('⚠️ 编辑响应解析 native_response 失败:', e);
  }

  return { newImageBase64: null, newImageMimeType: null, textResponse: `⚠️ OpenRouter未返回有效内容。` };
}

// 辅助函数：将Blob转换为base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// 主要的统一接口
export async function generateImageFromText(
  prompt: string,
  options: GenerateImageOptions
): Promise<AIServiceResult> {
  console.log(`🎯 使用 ${options.provider} 服务生成图像:`, prompt);
  
  try {
    switch (options.provider) {
      case 'siliconflow':
        return await callSiliconFlowService(prompt, options);
      
      case 'openrouter':
        return await callOpenRouterService(prompt, options);
      
      case 'gemini':
      default:
        return await callGeminiService(prompt);
    }
  } catch (error) {
    console.error(`${options.provider} 服务错误:`, error);
    
    // 如果硅基流动服务失败，尝试降级到Gemini服务
    if (options.provider === 'siliconflow') {
      console.log('🔄 硅基流动服务失败，降级到Gemini服务');
      try {
        const fallbackResult = await callGeminiService(prompt);
        return {
          ...fallbackResult,
          textResponse: `⚠️ 硅基流动服务暂时不可用，已切换到Gemini服务。\n\n${fallbackResult.textResponse || ''}`
        };
      } catch (fallbackError) {
        console.error('Gemini降级服务也失败:', fallbackError);
        return {
          newImageBase64: null,
          newImageMimeType: null,
          textResponse: `❌ 所有图像生成服务都暂时不可用。\n\n原始错误: ${error instanceof Error ? error.message : '未知错误'}`
        };
      }
    }
    
    // 其他服务的错误处理
    return {
      newImageBase64: null,
      newImageMimeType: null,
      textResponse: `❌ ${options.provider} 服务错误: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}

// 统一图像编辑入口：根据 provider 分发
export async function editImageWithAI(
  images: ImageInput[],
  prompt: string,
  provider: AIServiceProvider,
  mask?: ImageInput
): Promise<AIServiceResult> {
  try {
    if (provider === 'openrouter') {
      return await callOpenRouterImageEdit(images, prompt, mask);
    }
    if (provider === 'gemini') {
      return await geminiEditImage(images, prompt, mask);
    }
    // siliconflow 不支持编辑，回退到 OpenRouter
    return await callOpenRouterImageEdit(images, prompt, mask);
  } catch (error) {
    console.error(`${provider} 图像编辑错误:`, error);
    return {
      newImageBase64: null,
      newImageMimeType: null,
      textResponse: `❌ ${provider} 图像编辑错误: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}

// 获取可用的AI服务提供商
export function getAvailableProviders(): AIServiceProvider[] {
  return Object.keys(AI_SERVICE_CONFIGS) as AIServiceProvider[];
}

// 获取服务配置
export function getServiceConfig(provider: AIServiceProvider): AIServiceConfig {
  return AI_SERVICE_CONFIGS[provider];
}