// 生命周期：R
import { Router, Request, Response } from 'express';
import path from 'path';
import { existsSync , promises as fs } from 'fs';
import { config } from '../config.js';

const router :Router = Router();

/**
 * GET /api/files/:fileId
 * 根据 fileId 从配置的文件存储目录返回文件流
 */
router.get('/:fileId', async (req: Request, res: Response) => {
  try {
    const fileId = req.params.fileId;
    const filePath = path.resolve(config.fileStoragePath, fileId);
    
    // 安全检查，防止路径穿越
    if (!filePath.startsWith(config.fileStoragePath + path.sep)) {
      return res.status(403).json({ error: '禁止访问' });
    }

    if (!existsSync(filePath)) {
    return res.status(404).json({ error: '文件不存在' });
  }

    await fs.access(filePath);
    res.download(filePath); // 触发浏览器下载
  } catch (err) {
    res.status(405).json({ error: '文件异常' });
  }
});

export default router;