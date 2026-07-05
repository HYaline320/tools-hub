// packages/tools-backend/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 测试环境为 Node
    environment: 'node',
    // 支持 ts 路径别名（如有）
    include: ['src/**/*.test.ts'],
  },
});