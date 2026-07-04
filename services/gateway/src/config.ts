// 生命周期：R（服务启动时加载一次，提供全局配置）
import dotenv from 'dotenv';
dotenv.config(); // 本地开发时加载 .env 文件

export const config = {
  port: parseInt(process.env.GATEWAY_PORT || '3000', 10),
  fileStoragePath: process.env.FILE_STORAGE_PATH || './uploads',
  // 未来可添加对象存储配置等
};