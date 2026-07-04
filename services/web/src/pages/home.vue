<template>
  <div>
    <h2>可用工具</h2>
    <ul>
      <li v-for="tool in tools" :key="tool.name">
        <router-link :to="`/tool/${tool.name}`">{{ tool.description }} ({{ tool.name }})</router-link>
      </li>
    </ul>
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

onMounted(async () => {
  tools.value = await fetchTools();
});
</script>