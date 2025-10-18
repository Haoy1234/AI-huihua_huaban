import React, { useRef, useState, useEffect } from 'react';

interface CameraCaptureProps {
    onCapture: (blob: Blob, fileName: string) => void;
    onClose: () => void;
    t: (key: string) => string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose, t }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string>('');
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

    useEffect(() => {
        let mounted = true;
        
        const initCamera = async () => {
            if (mounted) {
                await startCamera();
            }
        };
        
        initCamera();
        
        return () => {
            mounted = false;
            stopCamera();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facingMode]);

    const startCamera = async () => {
        try {
            setError('');
            setIsCameraReady(false);
            
            console.log('🎥 开始请求摄像头...');
            
            // 请求摄像头权限
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            });

            console.log('✅ 摄像头流获取成功:', mediaStream.active);
            setStream(mediaStream);

            // video 元素现在始终存在，直接使用
            if (!videoRef.current) {
                console.error('❌ videoRef.current 为 null - 这不应该发生');
                setError('视频元素未准备好，请重试');
                return;
            }

            const video = videoRef.current;
            console.log('📹 video 元素已就绪，设置视频源...');
            
            video.srcObject = mediaStream;
            
            // 立即尝试播放
            try {
                await video.play();
                console.log('▶️ 视频开始播放');
                setIsCameraReady(true);
            } catch (playError) {
                console.warn('自动播放失败，等待用户交互:', playError);
                
                // 如果自动播放失败，添加点击播放
                const playOnInteraction = async () => {
                    try {
                        await video.play();
                        console.log('▶️ 用户交互后视频开始播放');
                        setIsCameraReady(true);
                        document.removeEventListener('click', playOnInteraction);
                    } catch (e) {
                        console.error('播放仍然失败:', e);
                    }
                };
                
                // 添加全局点击监听
                document.addEventListener('click', playOnInteraction, { once: true });
                
                // 2秒后无论如何都显示界面
                setTimeout(() => {
                    console.log('⏰ 超时：直接显示界面');
                    setIsCameraReady(true);
                    document.removeEventListener('click', playOnInteraction);
                }, 2000);
            }
        } catch (err) {
            console.error('摄像头访问错误:', err);
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError') {
                    setError(t('camera.permissionDenied'));
                } else if (err.name === 'NotFoundError') {
                    setError(t('camera.notFound'));
                } else {
                    setError(t('camera.error'));
                }
            }
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // 设置canvas尺寸与视频一致
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 绘制当前视频帧到canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 转换为Blob
        canvas.toBlob((blob) => {
            if (blob) {
                const fileName = `camera_${Date.now()}.png`;
                onCapture(blob, fileName);
                stopCamera();
                onClose();
            }
        }, 'image/png');
    };

    const switchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-neutral-900 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
                {/* 头部 */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-xl font-semibold text-white">
                        📷 {t('camera.title')}
                    </h2>
                    <button
                        onClick={() => { stopCamera(); onClose(); }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                        aria-label={t('camera.close')}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                {/* 视频预览区域 */}
                <div className="relative bg-black aspect-video flex items-center justify-center">
                    {/* 视频元素 - 始终渲染 */}
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-contain"
                        style={{ display: (error || !isCameraReady) ? 'none' : 'block' }}
                    />
                    
                    {/* 拍照参考线 - 只在相机就绪时显示 */}
                    {isCameraReady && !error && (
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-8 border-2 border-white/30 rounded-lg"></div>
                        </div>
                    )}
                    
                    {/* 错误提示遮罩 */}
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                            <div className="text-center p-8">
                                <div className="text-6xl mb-4">⚠️</div>
                                <p className="text-white text-lg mb-4">{error}</p>
                                <button
                                    onClick={startCamera}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    {t('camera.retry')}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* 加载中遮罩 */}
                    {!error && !isCameraReady && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                            <div className="text-center">
                                <div className="animate-spin text-6xl mb-4">⏳</div>
                                <p className="text-white">{t('camera.loading')}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 底部控制按钮 */}
                <div className="p-6 flex items-center justify-center gap-4">
                    {isCameraReady && (
                        <>
                            {/* 切换前后摄像头（移动设备） */}
                            <button
                                onClick={switchCamera}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
                                title={t('camera.switch')}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 2.1l4 4-4 4"/>
                                    <path d="M3 12.2v-2a4 4 0 0 1 4-4h12.8M7 21.9l-4-4 4-4"/>
                                    <path d="M21 11.8v2a4 4 0 0 1-4 4H4.2"/>
                                </svg>
                            </button>

                            {/* 拍照按钮 */}
                            <button
                                onClick={capturePhoto}
                                className="w-16 h-16 bg-white hover:bg-gray-200 rounded-full transition-all transform hover:scale-105 shadow-lg flex items-center justify-center"
                                title={t('camera.capture')}
                            >
                                <div className="w-12 h-12 bg-blue-600 rounded-full"></div>
                            </button>

                            {/* 取消按钮 */}
                            <button
                                onClick={() => { stopCamera(); onClose(); }}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                                {t('camera.cancel')}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* 隐藏的canvas用于捕获图片 */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

