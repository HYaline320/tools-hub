// ===== 工具契约 SDK =====
// 生命周期：D (开发时类型约束)、B (编译为 .js + .d.ts)、R (被 gateway/tools-backend 引用)

/**
 * 文件引用对象，工具不直接操作本地路径，而是通过 fileId 与文件服务交互
 */
export interface FileRef {
  id: string;                 // 文件唯一 ID
  originalName: string;       // 原始文件名
  mimeType: string;           // MIME 类型
  size?: number;              // 文件大小（可选）
}

/**
 * 工具参数，由各工具自定义验证规则
 */
export interface ToolParams {
  [key: string]: any;
}

/**
 * 工具执行结果
 */
export interface ToolResult {
  /** 返回的结构化数据（如处理结果 JSON） */
  data?: Record<string, any>;
  /** 单个下载文件 */
  downloadFile?: FileRef;
  /** 多个下载文件 */
  downloadFiles?: FileRef[];
  /** 异步任务 ID（如果工具需要异步执行） */
  taskId?: string;
}

/**
 * 工具处理器接口，所有后端工具必须实现此接口
 */
export interface IToolHandler {
  /** 工具元信息，用于前端展示和路由 */
  readonly meta: {
    name: string;
    category: string;
    description: string;
    supportFileTypes?: string[];
  };

  /** 参数校验，返回合法参数或抛出错误 */
  validate(params: any): ToolParams | Promise<ToolParams>;

  /**
   * 执行工具核心逻辑
   * @param params - 已经过验证的参数
   * @param files - 传入的文件引用列表（可能为空）
   * @returns 工具执行结果
   */
  execute(params: ToolParams, files: FileRef[]): Promise<ToolResult>;
}