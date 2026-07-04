<template>
  <div class="tool-page">
    <h2>UE GVAS 存档编辑器</h2>
    <div>
      <label>上传 .sav 文件：</label>
      <input type="file" @change="parseFile" accept=".sav" />
    </div>
    <div v-if="parsing">解析中...</div>
    <div v-if="jsonContent !== null">
      <h3>编辑 JSON 数据</h3>
      <textarea v-model="jsonText" rows="20" cols="80" />
      <button @click="downloadGvas" :disabled="generating">
        {{ generating ? '生成中...' : '生成并下载 .sav' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { executeTool } from '../../api/client';
import axios from 'axios';

const jsonContent = ref<any>(null);
const jsonText = ref('');
const parsing = ref(false);
const generating = ref(false);
const originalFileName = ref('');

async function parseFile(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length) return;
  const file = input.files[0];
  originalFileName.value = file.name;
  parsing.value = true;
  try {
    const response = await executeTool('gvas-editor', { mode: 'parse' }, [file]);
    jsonContent.value = response.data.jsonData;
    jsonText.value = JSON.stringify(jsonContent.value, null, 2);
  } catch (err) {
    alert('解析失败');
  } finally {
    parsing.value = false;
  }
}

async function downloadGvas() {
  try {
    const data = JSON.parse(jsonText.value);
    generating.value = true;
    // 将 originalFileName 放入 params
    const response = await executeTool('gvas-editor', {
      mode: 'generate',
      jsonData: data,
      originalFileName: originalFileName.value,   // 通过 params 传递文件名
    }, []);   // 不传文件
    const fileId = response.data?.downloadFile?.id;
    if (fileId) {
      window.open(`/api/files/${fileId}`, '_blank');
    } else {
      alert('生成失败');
    }
  } catch (err) {
    alert('无效的 JSON 或处理错误');
  } finally {
    generating.value = false;
  }
}
</script>