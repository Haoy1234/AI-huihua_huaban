// SiliconFlow Wan2.2 视频生成
export type VideoAspectRatio = '16:9' | '9:16';
export type ImageInput = { href: string; mimeType: string };

const SILICON_FLOW_API_KEY = 'sk-rtddpmojvcashzpwrceinvstfkzilcanzengsykhmerqdouf';

export async function generateVideo(
  prompt: string,
  aspectRatio: VideoAspectRatio,
  numberOfVideos: number,
  onProgress: (msg: string) => void,
  image?: ImageInput
): Promise<{ videoBlob: Blob; mimeType: string }[]> {
  const submit = async (): Promise<string> => {
    onProgress('Submitting video task to Wan2.2...');
    const submitResp = await fetch('https://api.siliconflow.cn/v1/video/submit', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SILICON_FLOW_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        model: image ? 'Wan-AI/Wan2.2-I2V-A14B' : 'Wan-AI/Wan2.2-T2V-A14B',
        prompt,
        aspect_ratio: aspectRatio,
        ...(image ? { image: image.href } : {})
      })
    });
    if (!submitResp.ok) throw new Error(`Wan2.2 submit failed: ${submitResp.status} ${await submitResp.text()}`);
    const text = await submitResp.text();
    let json: any = null; try { json = text ? JSON.parse(text) : null; } catch {}
    const reqId = json?.requestId || json?.request_id || json?.data?.requestId || json?.data?.request_id;
    if (!reqId) throw new Error('Wan2.2 submit response missing requestId');
    return String(reqId);
  };

  const pollStatus = async (requestId: string): Promise<string> => {
    onProgress('Task submitted. Querying status...');
    let attempts = 0;
    while (attempts < 120) {
      const statusResp = await fetch('https://api.siliconflow.cn/v1/video/status', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SILICON_FLOW_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requestId })
      });
      if (!statusResp.ok) throw new Error(`Wan2.2 status failed: ${statusResp.status} ${await statusResp.text()}`);
      const data = await statusResp.json();
      const status = String(data?.status || data?.state || '').toLowerCase();
      const posInfo = (typeof data?.position === 'number') ? ` (pos ${data.position})` : '';
      if (status) onProgress(`Status: ${status}${posInfo}`);

      const extractUrl = (obj: any): string | null => {
        if (!obj || typeof obj !== 'object') return null;
        const direct = obj.video_url || obj.url || obj.uri;
        if (typeof direct === 'string' && direct) return direct;
        // common nests
        const fromResult = extractUrl(obj.result) || extractUrl(obj.output) || extractUrl(obj.data) || extractUrl(obj.response);
        if (fromResult) return fromResult;
        // results array or object with videos
        const results = obj.results || (obj.data && obj.data.results);
        // case: { results: { videos: [{ url }] } }
        if (results && typeof results === 'object' && !Array.isArray(results)) {
          const maybeVideos = (results as any).videos;
          if (Array.isArray(maybeVideos) && maybeVideos.length) {
            const v0 = maybeVideos[0];
            const vu = (v0 && (v0.url || v0.video_url || v0.uri)) as string | undefined;
            if (vu) return vu;
          }
        }
        // array: results[] possibly each has videos[]
        if (Array.isArray(results) && results.length > 0) {
          for (const r of results) {
            // { videos: [{url}] } inside each r
            if (r && typeof r === 'object' && Array.isArray((r as any).videos) && (r as any).videos.length) {
              const v0 = (r as any).videos[0];
              const vu = (v0 && (v0.url || v0.video_url || v0.uri)) as string | undefined;
              if (vu) return vu;
            }
            const u = extractUrl(r);
            if (u) return u;
          }
        }
        return null;
      };

      const url = extractUrl(data);
      if (url) return String(url);
      if (status === 'failed' || status === 'error') throw new Error('Wan2.2 video generation failed');
      await new Promise(r => setTimeout(r, 10000));
      attempts++;
    }
    throw new Error('Wan2.2 video generation timed out');
  };

  const results: { videoBlob: Blob; mimeType: string }[] = [];
  for (let i = 0; i < Math.max(1, numberOfVideos); i++) {
    const requestId = await submit();
    const url = await pollStatus(requestId);
    onProgress('Downloading video...');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
    const videoBlob = await res.blob();
    const mimeType = res.headers.get('Content-Type') || 'video/mp4';
    results.push({ videoBlob, mimeType });
  }
  return results;
}


