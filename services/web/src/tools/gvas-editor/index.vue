<template>
  <div class="gvas-editor">
    <h2>UE GVAS 存档编辑器</h2>

    <div class="controls">
      <label>上传 .sav 文件：</label>
      <input type="file" @change="parseFile" accept=".sav" />
    </div>

    <div v-if="parsing" class="status">解析中...</div>

    <div v-if="jsonContent !== null" class="workspace">
      <div class="mode-switch">
        <button @click="editMode = !editMode">
          {{ editMode ? '切换为树视图' : '切换为编辑模式' }}
        </button>
      </div>

      <!-- 树视图 -->
      <div v-if="!editMode" class="json-viewer">
        <JsonTreeNode name="root" :value="jsonContent" :depth="0" />
      </div>

      <!-- 编辑模式 -->
      <textarea
        v-else
        v-model="jsonText"
        rows="20"
        placeholder="编辑 JSON 数据"
      />

      <div class="actions">
        <button @click="downloadGvas" :disabled="generating" class="primary-btn">
          {{ generating ? '生成中...' : '生成并下载 .sav' }}
        </button>
      </div>
    </div>

    <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { executeTool } from '../../api/client';
import JsonTreeNode from './JsonTreeNode.vue';

const jsonContent = ref<any>(null);
const jsonText = ref('');
const parsing = ref(false);
const generating = ref(false);
const editMode = ref(false);
const originalFileName = ref('');
const errorMsg = ref('');

watch(jsonContent, (val) => {
  if (val) {
    jsonText.value = JSON.stringify(val, null, 2);
  }
});

async function parseFile(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length) return;
  const file = input.files[0];
  originalFileName.value = file.name;
  parsing.value = true;
  errorMsg.value = '';
  try {
    const response = await executeTool('gvas-editor', { mode: 'parse' }, [file]);
    console.log(response)
    jsonContent.value = response.data.jsonData;
  } catch (err) {
    errorMsg.value = '解析失败';
    console.error(err);
  } finally {
    parsing.value = false;
  }
}

async function downloadGvas() {
  try {
    if (editMode.value) {
      try {
        jsonContent.value = JSON.parse(jsonText.value);
      } catch {
        errorMsg.value = 'JSON 格式无效';
        return;
      }
    }

    generating.value = true;
    errorMsg.value = '';
    const response = await executeTool('gvas-editor', {
      mode: 'generate',
      jsonData: jsonContent.value,
      originalFileName: originalFileName.value,
    }, []);
    console.log(response)
    const fileId = response.downloadFile?.id;
    
    if (fileId) {
      window.open(`/api/files/${fileId}`, '_blank');
    } else {
      errorMsg.value = '生成失败';
    }
  } catch (err) {
    errorMsg.value = '处理错误';
    console.error(err);
  } finally {
    generating.value = false;
  }
}
</script>

<style src="./index.css" scoped></style>