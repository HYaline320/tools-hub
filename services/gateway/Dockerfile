# 阶段1: 构建阶段 [B]
FROM node:24.11.0-slim AS builder
WORKDIR /app
# 利用 pnpm workspace 的依赖管理
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY packages/tool-sdk/package.json packages/tool-sdk/
COPY packages/tools-backend/package.json packages/tools-backend/
COPY services/gateway/package.json services/gateway/
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# 拷贝源码并构建
COPY tsconfig.base.json ./
COPY packages/tool-sdk/ packages/tool-sdk/
COPY packages/tools-backend/ packages/tools-backend/
COPY services/gateway/ services/gateway/
RUN pnpm run build --filter @tools-hub/gateway

# 阶段2: 运行阶段 [R]
FROM node:24.11.0-slim
WORKDIR /app
COPY --from=builder /app/services/gateway/dist ./dist
COPY --from=builder /app/services/gateway/node_modules ./node_modules
# 如果有其他包运行时依赖，也需要复制（tool-sdk编译后已在dist内）
EXPOSE 3000
CMD ["node", "dist/index.js"]