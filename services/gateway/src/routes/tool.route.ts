// 生命周期：R（定义路由和处理逻辑）
import { Router, Request, Response, NextFunction } from 'express';
import { upload, extractFileRefs } from '../middleware/upload.js';
import { runTool } from '../tool-runner.js';
import { AppError } from '../middleware/error-handler.js';

const router :Router = Router();

/**
 * POST /api/tools/:toolName/execute
 * 接收 multipart/form-data：字段 params (JSON 字符串) 和可选的 files
 */
router.post(
  '/:toolName/execute',
  upload.array('files', 10),  // 最多10个文件
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { toolName } = req.params;
      let params: any = {};
      if (req.body.params) {
        try {
          params = JSON.parse(req.body.params);
        } catch {
          throw new AppError(400, '参数格式错误，params 需为 JSON 字符串');
        }
      }

      const fileRefs = extractFileRefs(req);
      const result = await runTool(toolName, params, fileRefs);

      // 如果结果包含下载文件，目前简单返回 JSON 文件引用，实际可改为流式下载
      res.json({
        success: true,
        data: result.data,                  // 业务数据，直接赋值，前端通过 response.data 获取
        downloadFile: result.downloadFile,  // 下载文件引用（若有）
        taskId: result.taskId,              // 异步任务ID（若有）
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;