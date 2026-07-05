<template>
  <div class="image-resize">
    <h2>图片缩放</h2>
    <form @submit.prevent="handleSubmit" class="resize-form">
      <div class="form-row">
        <label class="form-label">
          宽度
          <input v-model.number="width" type="number" class="form-input" placeholder="像素" />
        </label>
        <label class="form-label">
          高度
          <input v-model.number="height" type="number" class="form-input" placeholder="像素" />
        </label>
      </div>
      <div class="file-upload">
        <label class="file-label">
          选择图片
          <input type="file" @change="onFileChange" accept="image/*" class="file-input" />
        </label>
        <span v-if="selectedFile" class="file-name">{{ selectedFile.name }}</span>
      </div>
      <button type="submit" class="primary-btn">开始缩放</button>
    </form>

    <div v-if="result" class="result-message">
      <p>{{ result.message }}</p>
      <!-- 可扩展：展示下载链接 -->
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
  try {
    const response = await executeTool(
      'image-resize',
      { width: width.value, height: height.value },
      [selectedFile.value]
    );
    result.value = response.data;
  } catch (err) {
    console.error(err);
    alert('处理失败');
  }
}
</script>

<style src="./ImageResize.css" scoped></style>