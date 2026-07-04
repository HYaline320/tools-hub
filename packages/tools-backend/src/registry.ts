// 生命周期：R（网关启动时加载，提供工具名到 Handler 的映射）
import { IToolHandler } from '@tools-hub/tool-sdk';
import { ImageResizeHandler } from './image-resize/index.js';
import { HexViewerHandler } from './hex-viewer/index.js';
import { GvasEditorHandler } from './gvas-editor/index.js';

/**
 * 工具注册表，目前手动注册，未来可改为自动扫描目录。
 * 每个工具实例化一次并缓存。
 */
const toolMap: Map<string, IToolHandler> = new Map();

// 注册示例工具
const imageResize = new ImageResizeHandler();
toolMap.set(imageResize.meta.name, imageResize);

// 在原有实例化代码后添加
const hexViewer = new HexViewerHandler();
toolMap.set(hexViewer.meta.name, hexViewer);

const gvasEditor = new GvasEditorHandler();
toolMap.set(gvasEditor.meta.name, gvasEditor);

/**
 * 获取所有注册工具的元信息（用于前端工具列表）
 */
export function getAllToolMeta(): IToolHandler['meta'][] {
  return Array.from(toolMap.values()).map(h => h.meta);
}

/**
 * 根据工具名获取 Handler 实例
 */
export function getToolHandler(name: string): IToolHandler | undefined {
  return toolMap.get(name);
}