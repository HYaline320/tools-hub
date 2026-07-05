# ===== 构建阶段 =====
FROM node:24.11.0-slim AS builder
WORKDIR /app



# 安装系统依赖
RUN apt-get update && apt-get install -y sqlite3 build-essential python3 && rm -rf /var/lib/apt/lists/*
# 安装 pnpm
RUN npm install -g pnpm

# 复制 monorepo 配置文件
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY tsconfig.base.json ./
COPY packages/tool-sdk/package.json packages/tool-sdk/
COPY packages/tools-backend/package.json packages/tools-backend/
COPY services/gateway/package.json services/gateway/

# 安装依赖（利用缓存）
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY packages/tool-sdk/ packages/tool-sdk/
COPY packages/tools-backend/ packages/tools-backend/
COPY services/gateway/ services/gateway/

# 编译所有必需的包
RUN pnpm run build --filter @tools-hub/tool-sdk --filter @tools-hub/tools-backend --filter @tools-hub/gateway

# ===== 运行阶段 =====
FROM node:24.11.0-slim
WORKDIR /app

# 只复制运行时所需的产物和依赖
COPY --from=builder /app/services/gateway/dist ./dist
COPY --from=builder /app/services/gateway/node_modules ./node_modules
COPY --from=builder /app/packages/tool-sdk/dist ./packages/tool-sdk/dist
COPY --from=builder /app/packages/tools-backend/dist ./packages/tools-backend/dist

# 复制 uesave 二进制
COPY packages/tools-backend/bin/uesave /usr/local/bin/uesave
RUN chmod +x /usr/local/bin/uesave

# 如果工具需要访问本地文件存储，确保目录存在
RUN mkdir -p /data/uploads
ENV FILE_STORAGE_PATH=/data/uploads
ENV UESAVE_PATH=/usr/local/bin/uesave
VOLUME /data/uploads

EXPOSE 3000
CMD ["node", "dist/index.js"]