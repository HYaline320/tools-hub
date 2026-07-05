<template>
  <div class="tool-list">
    <h2>可用工具</h2>

    <div v-if="loading" class="status">加载中...</div>

    <div v-else-if="tools.length === 0" class="empty">
      暂无可用工具
    </div>

    <div v-else class="cards">
      <div v-for="tool in tools" :key="tool.name" class="tool-card">
        <router-link :to="`/tool/${tool.name}`" class="tool-link">
          <span class="tool-name">{{ tool.name }}</span>
          <span class="tool-desc">{{ tool.description }}</span>
          <span class="tool-category">{{ tool.category }}</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchTools } from '../api/client';

interface ToolMeta {
  name: string;
  description: string;
  category: string;
}

const tools = ref<ToolMeta[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    tools.value = await fetchTools();
  } finally {
    loading.value = false;
  }
});
</script>

<style src="./ToolList.css" scoped></style>