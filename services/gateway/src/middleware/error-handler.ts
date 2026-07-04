// 生命周期：R（任何 middleware/route 抛出的错误最终都会到这里）
import { Request, Response, NextFunction } from 'express';

/**
 * 自定义错误类型（可扩展）
 */
export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(`[Error] ${err.message}`, err.stack);

  // 如果是已知的应用错误，返回对应状态码
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // 其他未知错误统一返回 500
  res.status(500).json({
    error: '服务器内部错误',
  });
}