// 定时清理过期上传文件
import fs from 'fs';
import path from 'path';
import { config } from './config.js';

// 默认文件有效期 5 分钟（300 秒）
const MAX_AGE_SECONDS = parseInt(process.env.FILE_MAX_AGE_SECONDS || '300', 10);
const CLEAN_INTERVAL_MS = 60_000; // 每分钟扫描一次

let intervalId: NodeJS.Timeout | null = null;

/** 启动定时清理 */
export function startFileCleaner() {
  if (intervalId) return;
  // 立即执行一次，然后定时
  cleanExpiredFiles();
  intervalId = setInterval(cleanExpiredFiles, CLEAN_INTERVAL_MS);
  console.log(`🧹 文件清理已启动：超过 ${MAX_AGE_SECONDS} 秒的文件将被删除`);
}

/** 停止清理（用于优雅退出） */
export function stopFileCleaner() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function cleanExpiredFiles() {
  const dir = config.fileStoragePath;
  if (!fs.existsSync(dir)) return;

  const now = Date.now();
  const maxAgeMs = MAX_AGE_SECONDS * 1000;

  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isFile() && (now - stat.mtimeMs) > maxAgeMs) {
        fs.unlinkSync(fullPath);
        // 日志可根据需要开启
        // console.log(`[清理] 已删除过期文件: ${file}`);
      }
    } catch (err) {
      // 文件可能已被删除或正在使用，忽略错误
    }
  });
}