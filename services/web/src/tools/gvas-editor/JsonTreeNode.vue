<template>
  <div class="json-node" :style="{ paddingLeft: depth * 16 + 'px' }">
    <!-- 可折叠的复合类型 -->
    <div v-if="isExpandable" class="node-header" @click="toggle">
      <span class="arrow" :class="{ expanded: isOpen }">▶</span>
      <span class="key">{{ name }}</span>
      <span class="summary">{{ summary }}</span>
    </div>

    <!-- 展开后的子节点 -->
    <div v-if="isOpen && isExpandable" class="node-children">
      <JsonTreeNode
        v-for="(child, key) in children"
        :key="key"
        :name="Array.isArray(value) ? `[${key}]` : String(key)"
        :value="child"
        :depth="depth + 1"
      />
    </div>

    <!-- 基本类型值 -->
    <div v-if="!isExpandable" class="node-leaf">
      <span class="key">{{ name }}</span>
      <span class="separator">:</span>
      <span :class="valueClass">{{ displayValue }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  name: string;
  value: any;
  depth: number;
}>();

const isOpen = ref(true); // 默认全部展开

const isExpandable = computed(() => {
  return props.value !== null && typeof props.value === 'object';
});

const children = computed(() => {
  if (!isExpandable.value) return {};
  return Array.isArray(props.value)
    ? props.value.reduce((acc: any, item: any, idx: number) => {
        acc[idx] = item;
        return acc;
      }, {})
    : props.value;
});

const summary = computed(() => {
  if (!isExpandable.value) return '';
  return Array.isArray(props.value)
    ? `Array(${props.value.length})`
    : `Object(${Object.keys(props.value).length})`;
});

const displayValue = computed(() => {
  if (props.value === null) return 'null';
  if (typeof props.value === 'string') return `"${props.value}"`;
  return String(props.value);
});

const valueClass = computed(() => {
  const t = typeof props.value;
  if (props.value === null) return 'value-null';
  if (t === 'boolean') return 'value-boolean';
  if (t === 'number') return 'value-number';
  if (t === 'string') return 'value-string';
  return '';
});

function toggle() {
  isOpen.value = !isOpen.value;
}
</script>

<style src="./JsonTreeNode.css" scoped></style>