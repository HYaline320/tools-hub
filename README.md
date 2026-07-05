# tools-hub
工具集

# dev阶段
## 重新编译后端包
pnpm -F @tools-hub/tool-sdk -F @tools-hub/tools-backend build
## 启动网关
pnpm -F @tools-hub/gateway dev
## 启动前端
pnpm -F @tools-hub/web dev

# 本地首页
http://localhost:5173

pnpm approve-builds