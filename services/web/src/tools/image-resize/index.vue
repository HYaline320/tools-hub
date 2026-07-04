<template>
  <div>
    <h2>图片缩放</h2>
    <form @submit.prevent="handleSubmit">
      <div>
        <label>宽度：<input v-model.number="width" type="number" /></label>
      </div>
      <div>
        <label>高度：<input v-model.number="height" type="number" /></label>
      </div>
      <div>
        <input type="file" @change="onFileChange" accept="image/*" />
      </div>
      <button type="submit">开始缩放</button>
    </form>
    <div v-if="result">
      <p>{{ result.message }}</p>
      <!-- 实际可展示下载链接 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { executeTool } from '../../api/client';

const width = ref(100);
const height = ref(100);
const selectedFile = ref<File | null>(null);
const result = ref<any>(null);

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0];
  }
}

async function handleSubmit() {
  if (!selectedFile.value) {
    alert('请选择文件');
    return;
  }
  const files = selectedFile.value ? [selectedFile.value] : [];
  try {
    const response = await executeTool('image-resize', { width: width.value, height: height.value }, files);
    result.value = response.data;
  } catch (err) {
    console.error(err);
    alert('处理失败');
  }
}
</script>