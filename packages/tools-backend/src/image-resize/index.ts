// 生命周期：R（作为工具被网关调用）
import { BaseToolHandler } from '../base-handler.js';
import { ToolParams, ToolResult, FileRef } from '@tools-hub/tool-sdk';
// 实际引入 sharp 等库，此处仅模拟
// import sharp from 'sharp';

export class ImageResizeHandler extends BaseToolHandler {
  meta = {
    name: 'image-resize',
    category: 'image',
    description: '修改图片尺寸',
    supportFileTypes: ['image/png', 'image/jpeg', 'image/webp'],
  };

  validate(params: any): ToolParams {
    if (!params.width || !params.height) {
      throw new Error('缺少 width 或 height 参数');
    }
    const w = parseInt(params.width, 10);
    const h = parseInt(params.height, 10);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      throw new Error('宽高必须为正整数');
    }
    return { width: w, height: h };
  }

  async execute(params: ToolParams, files: FileRef[]): Promise<ToolResult> {
    if (files.length === 0) {
      throw new Error('请上传一张图片');
    }
    const file = files[0];
    const inputPath = await this.getFilePath(file.id);

    // 模拟处理：此处使用 sharp 进行实际缩放
    // const outputBuffer = await sharp(inputPath)
    //   .resize(params.width, params.height)
    //   .toBuffer();

    // 简化返回：假设处理后的文件 ID 为原 ID + '-resized'
    const newFile: FileRef = {
      id: `${file.id}-resized`,
      originalName: `resized-${file.originalName}`,
      mimeType: file.mimeType,
    };

    return {
      downloadFile: newFile,
      data: { message: '图片缩放完成', width: params.width, height: params.height },
    };
  }
}