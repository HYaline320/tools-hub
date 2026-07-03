# 阶段1: 构建 [B]
FROM node:24.11.0-slim AS builder
WORKDIR /app
COPY services/web/package.json services/web/pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY services/web/ ./
RUN pnpm run build

# 阶段2: 运行时 [R]
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY services/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]