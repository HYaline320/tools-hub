// 生命周期：R（请求到达时，处理 multipart 文件上传）
import multer from 'multer';
import path from 'path';
import { config } from '../config.js';
import { FileRef } from '@tools-hub/tool-sdk';
import { Request } from 'express';

// 使用 multer 保存文件到配置的目录，文件名使用时间戳+随机数避免冲突
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.fileStoragePath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({ storage });

/**
 * 从 Express 请求对象中提取 FileRef 数组（供后续工具使用）
 */
export function extractFileRefs(req: Request): FileRef[] {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) return [];
  return files.map(f => ({
    id: f.filename,                     // 本地上传时，id 即保存的文件名
    originalName: f.originalname,
    mimeType: f.mimetype,
    size: f.size,
  }));
}