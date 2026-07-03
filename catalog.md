# 目录

```tetx
tools-hub/
├── .gitignore                     # [R] 忽略 node_modules、构建产物、环境变量
├── .dockerignore                  # [B] 构建 Docker 镜像时忽略无关文件
├── pnpm-workspace.yaml            # [D] 声明 monorepo 工作区包
├── package.json                   # [D/B] 根包配置，scripts 用于批量操作
├── tsconfig.base.json             # [D] 共享 TypeScript 编译选项
├── docker-compose.yml             # [R] 编排所有服务（网关、前端等）
├── .env.example                   # [D] 本地开发环境变量示例
│
├── packages/                      # 共享库，不单独部署
│   ├── tool-sdk/                  # 工具抽象接口定义（纯类型与接口）
│   │   ├── package.json           # [D/B] 包名 @tools-hub/tool-sdk
│   │   ├── tsconfig.json          # [D] 继承 base，输出类型声明
│   │   └── src/
│   │       └── index.ts           # [D/B] 导出 IToolHandler, ToolParams, ToolResult 等
│   │
│   └── tools-backend/             # 所有后端工具的实现集合（一个工具一个子目录）
│       ├── package.json           # [D] 依赖 tool-sdk
│       ├── tsconfig.json
│       └── src/
│           ├── registry.ts        # [R] 工具注册表，自动扫描并加载所有工具
│           ├── base-handler.ts    # [R] 基类，提供文件获取等辅助方法
│           ├── image-resize/      # [R] 示例工具：图片尺寸修改
│           │   ├── index.ts       # 实现 IToolHandler
│           │   └── __tests__/     # [D] 单元测试
│           ├── pdf-merge/
│           └── ...                # 将来添加更多工具
│
├── services/                      # 独立部署的服务
│   ├── gateway/                   # BFF 网关（Node 服务）
│   │   ├── package.json           # [D/B] 启动脚本、依赖
│   │   ├── tsconfig.json
│   │   ├── Dockerfile             # [B] 构建网关镜像
│   │   └── src/
│   │       ├── index.ts           # [R] 应用入口，创建 Express/Koa 实例
│   │       ├── routes/
│   │       │   └── tool.route.ts  # [R] 统一工具执行 API：POST /api/tools/:name/execute
│   │       ├── middleware/
│   │       │   ├── error-handler.ts  # [R] 全局错误处理
│   │       │   └── upload.ts         # [R] 文件上传中间件
│   │       ├── tool-runner.ts     # [R] 核心调度：根据 toolName 获取 Handler 并执行
│   │       └── config.ts          # [R] 读取环境变量，提供配置单例
│   │
│   └── web/                       # 前端静态资源服务（或独立部署）
│       ├── package.json           # [D/B] 包含 build & preview 脚本
│       ├── tsconfig.json
│       ├── vite.config.ts         # [D/B] 构建配置
│       ├── index.html             # [R] 入口 HTML
│       ├── Dockerfile             # [B] 前端镜像（多阶段构建，最终用 nginx）
│       └── src/
│           ├── main.ts            # [R] 应用入口
│           ├── App.vue            # [R] 根组件
│           ├── router/
│           │   └── index.ts       # [R] 路由，工具页面通过动态导入
│           ├── pages/
│           │   └── home.vue       # [R] 工具导航首页
│           ├── tools/             # 每个前端工具一个目录
│           │   ├── image-resize/
│           │   │   └── index.vue  # [R] 该工具的操作界面
│           │   └── pdf-merge/
│           └── api/
│               └── client.ts      # [R] 封装与网关的 HTTP 通信
│
└── scripts/                       # 开发/构建辅助脚本
    └── init-tool.sh               # [D] 快速生成一个新工具的前后端骨架
```