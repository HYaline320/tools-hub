// 生命周期：R（每个请求调用，负责查找工具、执行、返回结果）
import { IToolHandler, ToolResult } from '@tools-hub/tool-sdk';
import { getToolHandler } from '@tools-hub/tools-backend';
import { FileRef } from '@tools-hub/tool-sdk';

/**
 * 执行指定工具
 * @param toolName - 工具名
 * @param params - 原始参数（会交给工具自己的 validate）
 * @param files - 已上传的文件引用数组
 * @returns 工具执行结果
 */
export async function runTool(
  toolName: string,
  params: any,
  files: FileRef[]
): Promise<ToolResult> {
  const handler: IToolHandler | undefined = getToolHandler(toolName);
  if (!handler) {
    throw new Error(`工具 "${toolName}" 不存在`);
  }

  // 1. 参数校验
  const validParams = await handler.validate(params);

  // 2. 执行工具
  const result = await handler.execute(validParams, files);
  return result;
}