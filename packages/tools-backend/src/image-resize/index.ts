
export class ImageResizeHandler implements IToolHandler {
  meta = { name: 'image-resize', category: 'image', description: '...' };
  validate(params: any): ToolParams { return params; }
  async execute(params: ToolParams, files: FileRef[]): Promise<ToolResult> {
    // 使用 sharp 处理图片，返回新文件引用
  }
}