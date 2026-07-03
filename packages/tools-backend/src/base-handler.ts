import {IToolHandler} from '@tools-hub/tool-sdk';

export abstract class BaseToolHandler implements IToolHandler {
  // 通过 fileId 从文件服务获取文件本地缓存路径
  protected async getFilePath(fileId: string): Promise<string> { ... }
}