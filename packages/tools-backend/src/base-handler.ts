// 生命周期：R（运行时被工具实现继承）
import { IToolHandler, FileRef } from '@tools-hub/tool-sdk';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * 工具基类，封装文件服务访问逻辑。
 * 当前简化实现：假设文件已通过网关保存在某个临时目录，fileId 即相对路径。
 */
export abstract class BaseToolHandler implements IToolHandler {
  abstract meta: IToolHandler['meta'];
  abstract validate(params: any): ReturnType<IToolHandler['validate']>;
  abstract execute(params: any, files: FileRef[]): ReturnType<IToolHandler['execute']>;

  /**
   * 根据 fileId 获取本地文件绝对路径
   * 实际项目应通过文件服务获取，避免工具直接操作文件系统
   */
  protected async getFilePath(fileId: string): Promise<string> {
    // 简化：假设存储在网关配置的 UPLOAD_DIR 下
    const uploadDir = process.env.FILE_STORAGE_PATH || './uploads';
    const filePath = path.join(uploadDir, fileId);
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      throw new Error(`File not found: ${fileId}`);
    }
  }
}