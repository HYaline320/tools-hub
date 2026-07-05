<template>
  <div class="tool-page">
    <h2>Hex 文件头查看器</h2>
    <input type="file" @change="handleFile" />
    <div v-if="loading" class="status">分析中...</div>
    <div v-if="result" class="result-card">
      <p><strong>文件名：</strong>{{ result.fileName }}</p>
      <p><strong>文件大小：</strong>{{ result.fileSizeFormatted }}（{{ result.fileSize }} 字节）</p>
      <p><strong>MIME 类型：</strong>{{ result.mimeType }}</p>
      <p><strong>识别类型：</strong>{{ result.detectedType }}</p>
      <div>
        <strong>十六进制头部（前 {{ result.sampleLength }} 字节）：</strong>
        <pre class="dump">{{ formattedDump }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { executeTool } from '../../api/client';

const result = ref<any>(null);
const loading = ref(false);

// 将 hex 字符串（如 "4D 5A 90 00 ..."）格式化为 hex dump 多行文本
const formattedDump = computed(() => {
  if (!result.value?.hexHeader) return '';
  const hex = result.value.hexHeader.replace(/\s/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }

  const lines: string[] = [];
  lines.push('          Offset Bytes                                           Ascii');
  lines.push('                 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F');
  lines.push('          ------ ----------------------------------------------- -----');

  const bytesPerLine = 16;
  for (let offset = 0; offset < bytes.length; offset += bytesPerLine) {
    const slice = bytes.slice(offset, offset + bytesPerLine);
    const hexPart = slice
      .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
      .join(' ');
    const paddedHex = hexPart.padEnd(47, ' '); // 16*3-1 = 47
    const asciiPart = slice
      .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
      .join('');
    const offsetStr = offset.toString(16).toUpperCase().padStart(16, '0');
    lines.push(`${offsetStr} ${paddedHex} ${asciiPart}`);
  }

  return lines.join('\n');
});

async function handleFile(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length) return;
  loading.value = true;
  try {
    const response = await executeTool('hex-viewer', {}, [input.files[0]]);
    result.value = response.data;
  } catch (err) {
    alert('处理失败');
  } finally {
    loading.value = false;
  }
}
</script>

<style src="./HexViewer.css" scoped></style>