# 构建阶段
FROM node:24.11.0-slim AS builder
WORKDIR /app

RUN npm install -g pnpm

COPY services/web/package.json services/web/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY services/web/ ./
RUN pnpm run build

# 运行阶段
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# 提供 Nginx 配置（代理 API 到网关，网关由 docker-compose 网络连接）
COPY services/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]