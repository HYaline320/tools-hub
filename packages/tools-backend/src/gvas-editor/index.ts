// 文件路径: packages/tools-backend/src/gvas-editor/index.ts
// 生命周期：R

import { BaseToolHandler } from '../base-handler.js';
import { ToolParams, ToolResult, FileRef } from '@tools-hub/tool-sdk';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';  // 生成临时 ID（需安装 uuid 包和 @types/uuid）

const execFileAsync = promisify(execFile);

// uesave 二进制相对于当前文件的位置
// 最终部署时需确保二进制路径正确
const UESAVE_PATH = process.env.UESAVE_PATH || path.resolve(
  __dirname, '..', '..', 'bin', 'uesave'
);

export class GvasEditorHandler extends BaseToolHandler {
  meta = {
    name: 'gvas-editor',
    category: 'game',
    description: '编辑 UE 引擎 GVAS 存档，支持与 JSON 互转（基于 uesave-rs）',
  };

  validate(params: any): ToolParams {
    if (!params.mode || !['parse', 'generate'].includes(params.mode)) {
      throw new Error('参数 mode 必须为 "parse" 或 "generate"');
    }
    if (params.mode === 'generate' && !params.jsonData) {
      throw new Error('生成模式需要提供 jsonData 参数');
    }
    return params;
  }

  async execute(params: ToolParams, files: FileRef[]): Promise<ToolResult> {
    // 确保 uesave 可用
    await this.ensureBinary();

    if (params.mode === 'parse') {
      return this.parseGvas(files);
    } else {
      // 从 params 中获取原始文件名（可能为空）
      const originalName = params.originalFileName || undefined;
      return this.generateGvas(params.jsonData, originalName);
    }
  }

  /** 检查 uesave 二进制是否存在且可执行 */
  private async ensureBinary() {
    try {
      await fs.access(UESAVE_PATH, fs.constants.X_OK);
    } catch {
      throw new Error('uesave 二进制不可用，请检查 packages/tools-backend/bin/uesave');
    }
  }

  /** 解析 .sav 为 JSON */
  private async parseGvas(files: FileRef[]): Promise<ToolResult> {
    if (files.length === 0) throw new Error('请上传一个 .sav 文件');
    const filePath = await this.getFilePath(files[0].id);

    // uesave to-json --input <file>   (输出 JSON 字符串到 stdout)
    const { stdout } = await execFileAsync(UESAVE_PATH, ['to-json', '--input', filePath], {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,  // 50MB 上限
    });

    let jsonData: any;
    try {
      jsonData = JSON.parse(stdout);
    } catch {
      throw new Error('uesave 返回的不是有效 JSON');
    }

    return {
      data: {
        originalFile: files[0].originalName,
        jsonData,
      },
    };
  }

  /** 根据 JSON 生成 .sav 文件，返回下载引用 */
  private async generateGvas(jsonData: any, originalName?: string): Promise<ToolResult> {
    // 将 JSON 写入临时文件
    const tmpDir = process.env.FILE_STORAGE_PATH || './uploads';
    const tmpJsonName = `gvas-input-${uuidv4()}.json`;
    const tmpJsonPath = path.join(tmpDir, tmpJsonName);
    await fs.writeFile(tmpJsonPath, JSON.stringify(jsonData), 'utf-8');

    // 输出文件名
    const outputName = originalName
      ? originalName.replace(/\.sav$/i, '') + '_edited.sav'
      : `edited_${Date.now()}.sav`;
    const outputPath = path.join(tmpDir, outputName);

    try {
      // uesave from-json --input <json-file> --output <sav-file>
      await execFileAsync(UESAVE_PATH, [
        'from-json',
        '--input', tmpJsonPath,
        '--output', outputPath,
      ]);
    } catch (err) {
      // 清理临时 JSON 并抛出
      await fs.unlink(tmpJsonPath).catch(() => { });
      throw new Error('GVAS 生成失败：' + (err as Error).message);
    }

    // 清理临时 JSON 文件
    await fs.unlink(tmpJsonPath).catch(() => { });

    return {
      downloadFile: {
        id: outputName,          // fileId 即文件名
        originalName: outputName,
        mimeType: 'application/octet-stream',
      },
      data: { message: 'GVAS 文件生成成功' },
    };
  }
}