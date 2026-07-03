// [D/B] 开发时类型约束，编译后产出类型定义，供其他包引用
export interface FileRef {
  id: string;
  originalName: string;
  mimeType: string;
  // 实际路径由文件服务管理，工具层不直接接触
}

export interface ToolParams {
  [key: string]: any;
}

export interface ToolResult {
  data?: Record<string, any>;
  downloadFile?: FileRef;
  downloadFiles?: FileRef[];
  // 异步任务时返回任务ID
  taskId?: string;
}

export interface IToolHandler {
  readonly meta: {
    name: string;
    category: string;
    description: string;
    supportFileTypes?: string[];
  };
  validate(params: any): ToolParams;
  execute(params: ToolParams, files: FileRef[]): Promise<ToolResult>;
}