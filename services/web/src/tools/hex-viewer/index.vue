<template>
  <div class="tool-page">
    <h2>Hex 文件头查看器</h2>
    <input type="file" @change="handleFile" />
    <div v-if="loading">分析中...</div>
    <div v-if="result">
      <p><strong>文件名：</strong>{{ result.fileName }}</p>
      <p><strong>文件大小：</strong>{{ result.fileSizeFormatted }}（{{ result.fileSize }} 字节）</p>
      <p><strong>MIME 类型：</strong>{{ result.mimeType }}</p>
      <p><strong>识别类型：</strong>{{ result.detectedType }}</p>
      <div>
        <strong>十六进制头部（前 {{ result.sampleLength }} 字节）：</strong>
        <pre>{{ result.hexHeader }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { executeTool } from '../../api/client';

const result = ref<any>(null);
const loading = ref(false);

async function handleFile(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length) return;
  loading.value = true;
  try {
    const response = await executeTool('hex-viewer', {}, [input.files[0]]);
    result.value = response.data; // 网关节构: { success: true, data: { ... } }
  } catch (err) {
    alert('处理失败');
  } finally {
    loading.value = false;
  }
}
</script>