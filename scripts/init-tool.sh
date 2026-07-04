#!/bin/bash
# 快速初始化一个新工具的前后端文件
if [ -z "$1" ]; then
  echo "用法: ./scripts/init-tool.sh <tool-name>"
  exit 1
fi

TOOL_NAME=$1
echo "正在创建工具: $TOOL_NAME"

# 后端工具目录
mkdir -p packages/tools-backend/src/$TOOL_NAME
cat > packages/tools-backend/src/$TOOL_NAME/index.ts <<EOF
import { BaseToolHandler } from '../base-handler.js';
import { ToolParams, ToolResult, FileRef } from '@tools-hub/tool-sdk';

export class ${TOOL_NAME^}Handler extends BaseToolHandler {
  meta = {
    name: '$TOOL_NAME',
    category: 'other',
    description: '新工具 $TOOL_NAME',
  };

  validate(params: any): ToolParams {
    return params;
  }

  async execute(params: ToolParams, files: FileRef[]): Promise<ToolResult> {
    // TODO: 实现工具逻辑
    return { data: { info: 'ok' } };
  }
}
EOF

# 注册到 registry.ts（需要手动添加导入和注册，这里仅提示）
echo "请手动将以下内容添加到 packages/tools-backend/src/registry.ts："
echo "import { ${TOOL_NAME^}Handler } from './$TOOL_NAME/index.js';"
echo "const $TOOL_NAME = new ${TOOL_NAME^}Handler();"
echo "toolMap.set(${TOOL_NAME}.meta.name, $TOOL_NAME);"

# 前端工具目录
mkdir -p services/web/src/tools/$TOOL_NAME
cat > services/web/src/tools/$TOOL_NAME/index.vue <<EOF
<template>
  <div>
    <h2>$TOOL_NAME</h2>
    <p>TODO: 实现前端界面</p>
  </div>
</template>

<script setup lang="ts">
</script>
EOF

# 路由添加提示
echo "请手动在 services/web/src/router/index.ts 中添加路由："
echo "{ path: '/tool/$TOOL_NAME', name: '$TOOL_NAME', component: () => import('../tools/$TOOL_NAME/index.vue') }"