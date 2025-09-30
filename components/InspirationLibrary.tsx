import React, { useState } from 'react';
import type { PromptCategory, PromptBlock } from '../types';

interface InspirationLibraryProps {
    isOpen: boolean;
    onClose: () => void;
    onExecutePrompt: (prompt: string) => void;
    t: (key: string, ...args: any[]) => any;
}

// 简化的灵感库数据
const INSPIRATION_CATEGORIES: PromptCategory[] = [
    {
        id: 'transform',
        name: '风格转换',
        icon: '🎨',
        color: '#3b82f6',
        blocks: [
            { id: 'anime_to_real', name: '动漫转真人', icon: '👤', value: '生成一张在Comiket上cosplay这张插画的女孩的高度详细照片' },
            { id: 'any_to_real', name: '风格转写实', icon: '📸', value: '将这个插图变成逼真版本' },
            { id: 'pro_photography', name: '专业摄影', icon: '📷', value: '将照片转换成专业摄影作品' },
            { id: 'lighting_ref', name: '灯光参考', icon: '💡', value: '原图换成参考图打光，专业摄影' },
            { id: 'pose_ref', name: '姿势参考', icon: '🤸', value: '人物准确换成姿势图的姿势' },
            { id: 'expression_ref', name: '表情参考', icon: '😊', value: '人物换成新图片的表情' },
        ]
    },
    {
        id: 'figures',
        name: '手办模型',
        icon: '🎭',
        color: '#10b981',
        blocks: [
            { id: 'to_figure', name: '变成手办', icon: '🏺', value: '将这张照片变成一个人物手办' },
            { id: 'to_funko', name: 'Funko Pop', icon: '🎪', value: '将照片转换成Funko Pop风格' },
            { id: 'to_lego', name: '乐高风格', icon: '🧱', value: '将照片转换成乐高小人仔风格' },
            { id: 'to_barbie', name: '芭比娃娃', icon: '💄', value: '将照片转换成芭比娃娃风格' },
            { id: 'to_gundam', name: '高达模型', icon: '🤖', value: '将照片转换成高达模型风格' },
            { id: 'to_knit', name: '针织娃娃', icon: '🧶', value: '转换成手工针织娃娃风格' },
        ]
    },
    {
        id: 'creative',
        name: '创意特效',
        icon: '✨',
        color: '#f59e0b',
        blocks: [
            { id: 'combine_objects', name: '组合对象', icon: '🔗', value: '把它们组合起来' },
            { id: 'high_res', name: '高清修复', icon: '🔍', value: '将此图片增强为高分辨率' },
            { id: 'line_art', name: '转线稿', icon: '✏️', value: '变成线稿手绘图' },
            { id: 'color_palette', name: '调色板上色', icon: '🎨', value: '准确使用色卡上色' },
            { id: 'virtual_reality', name: '虚实融合', icon: '🌐', value: '在图中加上虚拟现实元素' },
            { id: 'cyber_baby', name: '子女生成器', icon: '👶', value: '生成图中两人物所生孩子的样子' },
        ]
    },
    {
        id: 'design',
        name: '设计应用',
        icon: '🎯',
        color: '#8b5cf6',
        blocks: [
            { id: 'architecture_model', name: '建筑模型', icon: '🏗️', value: '将照片转换成建筑模型' },
            { id: 'character_sheet', name: '角色设定', icon: '📋', value: '生成人物的角色设定' },
            { id: 'product_to_reality', name: '设计转实物', icon: '🛍️', value: '将设计图转换成实物效果' },
            { id: 'packaging_mockup', name: '包装样机', icon: '📦', value: '创建产品包装样机' },
            { id: 'to_keychain', name: '钥匙扣', icon: '🔑', value: '转换成钥匙扣样式' },
            { id: 'virtual_makeup', name: '虚拟试妆', icon: '💋', value: '为人物添加虚拟妆容' },
        ]
    },
    // 新增：调色
    {
        id: 'color_grade',
        name: '调色',
        icon: '🪄',
        color: '#f59e0b',
        blocks: [
            { id: 'dream_soft_glow', name: '梦幻朦胧滤镜', icon: '✨', value: '不改变画面中人物细节和构图，添加梦幻朦胧感，环境变为晴天，人物周围有朦胧的蝴蝶和花瓣飞舞，还有柔和的光线笼罩。' },
            { id: 'leica_bw', name: '徕卡黑白滤镜', icon: '🖤', value: '人物不变，将照片生成徕卡黑白的滤镜风格' },
            { id: 'wkw_cinematic', name: '王家卫风格滤镜', icon: '🎞️', value: '人物不变，将照片参数调整：杰作，RAW照片，王家卫风格，电影剧照，浓郁而温暖的琥珀色与钨丝灯色调（没有钨丝灯），戏剧性的明暗对比光线，具有深邃暗部的强烈对比度和柔和而发光的高光，强烈的胶片颗粒质感，忧郁、内省而怀旧的氛围，使用35mm柯达Vision3胶片拍摄' },
            { id: 'sunset_light', name: '夕阳光', icon: '🌇', value: '将画面光影改为夕阳' },
            { id: 'dappled_light', name: '斑驳光', icon: '🌿', value: '将画面光影改为光影斑驳' },
        ]
    },
    // 新增：人像美化
    {
        id: 'portrait_beautify',
        name: '人像美化',
        icon: '👤',
        color: '#ec4899',
        blocks: [
            { id: 'remove_acne', name: '去痘', icon: '🫧', value: '保持人物不变，去痘' },
            { id: 'reduce_shine', name: '去油光', icon: '💡', value: '保持人物不变，去脸部油反光（注意画面比例）' },
            { id: 'remove_beard', name: '去胡须', icon: '🪒', value: '保持人物不变，去胡须' },
        ]
    },
    // 新增：换发型
    {
        id: 'hairstyle_change',
        name: '换发型',
        icon: '💇‍♀️',
        color: '#eab308',
        blocks: [
            { id: 'french_bangs', name: '法式刘海', icon: '✂️', value: '改变发型为法式刘海微卷长发：锁骨到胸口的长度，带空气感的法式刘海，发尾自然外翘，整体慵懒随性。' },
            { id: 'clavicle_bob', name: '锁骨短发', icon: '💇', value: '改变发型为锁骨短发：齐锁骨的直发或内扣，微微外翻更显俏皮，搭配轻薄刘海清爽减龄。' },
            { id: 'wolf_cut', name: '狼尾发', icon: '🐺', value: '改变发型为狼尾发：后颈部分留长到锁骨向外微翘，前方发型自然蓬松微卷。' },
        ]
    },
    // 新增：证件照
    {
        id: 'id_photo',
        name: '证件照',
        icon: '🪪',
        color: '#3b82f6',
        blocks: [
            { id: 'campus_style_id', name: '校园风', icon: '🏫', value: '生成图中人物身穿校园风服装的证件照' },
            { id: 'strict_id_blue_bg', name: '强制证件照', icon: '📷', value: '基于图片中人物为主的证件照，展示腰部以上，照片居中、正面拍摄、蓝色背景。' },
        ]
    }
];

export const InspirationLibrary: React.FC<InspirationLibraryProps> = ({ 
    isOpen,
    onClose,
    onExecutePrompt,
    t
}) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('transform');
    const currentCategory = INSPIRATION_CATEGORIES.find(cat => cat.id === selectedCategory) || INSPIRATION_CATEGORIES[0];

    const handleExecutePrompt = (prompt: string) => {
        console.log('执行提示词:', prompt);
        onExecutePrompt(prompt);
        onClose();
    };

    // 如果没有打开，不显示任何内容
    if (!isOpen) {
        return null;
    }

    // 使用与设置面板相同的定位方式
    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
        >
            <div 
                style={{
                    width: '800px',
                    height: '600px',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    position: 'relative'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* 标题栏 */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 24px',
                    borderBottom: '1px solid #374151',
                    backgroundColor: '#111827'
                }}>
                    <h2 style={{
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: '600',
                        margin: 0
                    }}>
                        🎨 灵感库
                    </h2>
                <button
                    onClick={onClose}
                    style={{
                            background: 'none',
                            border: 'none',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            fontSize: '18px',
                            padding: '4px'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* 主内容区 */}
                <div style={{ display: 'flex', height: 'calc(100% - 65px)' }}>
                    {/* 左侧分类 */}
                    <div style={{
                        width: '200px',
                        backgroundColor: '#111827',
                        borderRight: '1px solid #374151',
                        padding: '16px 0'
                    }}>
                        {INSPIRATION_CATEGORIES.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    border: 'none',
                                    backgroundColor: selectedCategory === category.id ? '#374151' : 'transparent',
                                    color: selectedCategory === category.id ? 'white' : '#9ca3af',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    textAlign: 'left'
                                }}
                            >
                                <span style={{ fontSize: '16px' }}>{category.icon}</span>
                                <span>{category.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* 右侧功能块 */}
                    <div style={{
                        flex: 1,
                        padding: '24px',
                        backgroundColor: '#1f2937',
                        overflowY: 'auto'
                    }}>
                        <h3 style={{
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '600',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span>{currentCategory.icon}</span>
                            {currentCategory.name}
                        </h3>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                            gap: '16px'
                        }}>
                            {currentCategory.blocks.map((block) => (
                                <button
                                    key={block.id}
                                    onClick={() => handleExecutePrompt(block.value)}
                                    style={{
                                        padding: '16px 8px',
                                        backgroundColor: '#374151',
                                        border: '1px solid #4b5563',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        color: 'white',
                                        minHeight: '100px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.backgroundColor = '#4b5563';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.backgroundColor = '#374151';
                                    }}
                                >
                                    <div style={{ fontSize: '24px' }}>
                                        {block.icon}
                                    </div>
                                    <div style={{ 
                                        fontSize: '12px',
                                        lineHeight: '1.2'
                                    }}>
                                        {block.name}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};