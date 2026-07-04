// 生命周期：R（服务启动入口，初始化 Express 并监听端口）
import express from 'express';
import cors from 'cors';
import { config } from './config.js'; 
import { existsSync, mkdirSync } from 'fs';
import { errorHandler } from './middleware/error-handler.js';
import { getAllToolMeta } from '@tools-hub/tools-backend';
import fileRouter from './routes/file.route.js';
import toolRouter from './routes/tool.route.js';

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 工具列表 API（方便前端获取所有可用工具）
app.get('/api/tools', (_req, res) => {
  const tools = getAllToolMeta();
  res.json(tools);
});

// 挂载工具执行路由
app.use('/api/tools', toolRouter);
app.use('/api/files', fileRouter);

// 全局错误处理
app.use(errorHandler);

// 确保文件存储目录存在
if (!existsSync(config.fileStoragePath)) {
  mkdirSync(config.fileStoragePath, { recursive: true });
}

// 将绝对路径写入环境变量，供工具层读取（避免工具层再解析相对路径）
process.env.FILE_STORAGE_PATH = config.fileStoragePath;

// 启动服务
app.listen(config.port, () => {
  console.log(`🚀 网关服务已启动：http://localhost:${config.port}`);
  console.log(`📦 已注册工具数：${getAllToolMeta().length}`);
});