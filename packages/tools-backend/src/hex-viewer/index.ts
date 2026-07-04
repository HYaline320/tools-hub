// 文件路径: packages/tools-backend/src/hex-viewer/index.ts
// 生命周期：R（每次请求时 execute 被调用）

import { BaseToolHandler } from '../base-handler.js';
import { ToolParams, ToolResult, FileRef } from '@tools-hub/tool-sdk';
import { promises as fs } from 'fs';
import { MAGIC_NUMBERS } from './magic-numbers.js';

export class HexViewerHandler extends BaseToolHandler {
  meta = {
    name: 'hex-viewer',
    category: 'file',
    description: '查看文件十六进制头部，自动识别类型与大小',
  };

  validate(params: any): ToolParams {
    // 该工具不需要额外参数
    return {};
  }

  async execute(_params: ToolParams, files: FileRef[]): Promise<ToolResult> {
    if (files.length === 0) {
      throw new Error('请上传一个文件');
    }

    const file = files[0];
    const filePath = await this.getFilePath(file.id);

    // 读取文件内容（最多前 256 字节用于 hex 展示和类型识别）
    const maxHexLen = 256;
    const buffer = Buffer.alloc(maxHexLen, 0);
    const fd = await fs.open(filePath, 'r');
    const { bytesRead } = await fd.read(buffer, 0, maxHexLen, 0);
    await fd.close();

    const actualBuffer = buffer.subarray(0, bytesRead);
    const hexString = actualBuffer.toString('hex').toUpperCase();
    const fileStats = await fs.stat(filePath);

    // 根据魔数识别类型
    const detectedType = this.detectType(hexString);

    return {
      data: {
        fileName: file.originalName,
        fileSize: fileStats.size,
        fileSizeFormatted: this.formatSize(fileStats.size),
        hexHeader: hexString,
        detectedType: detectedType || '未知类型',
        mimeType: file.mimeType || '未知',
        sampleLength: actualBuffer.length,
      },
    };
  }

  /** 根据十六进制字符串匹配魔数表 */
  private detectType(hex: string): string | null {
    for (const entry of MAGIC_NUMBERS) {
      if (hex.startsWith(entry.hex)) {
        return `${entry.type} (${entry.extensions.join(', ')})`;
      }
    }
    // 特殊处理纯文本魔术字符 "GIF89a"
    if (hex.startsWith('474946383961')) return "GIF89a";
    return null;
  }

  /** 文件大小格式化 */
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}