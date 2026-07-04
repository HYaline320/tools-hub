import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/home.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/tool/image-resize',
    name: 'image-resize',
    // 动态导入，实现工具页面按需加载
    component: () => import('../tools/image-resize/index.vue'),
  },
  {
    path: '/tool/hex-viewer',
    name: 'hex-viewer',
    component: () => import('../tools/hex-viewer/index.vue'),
  },
  {
    path: '/tool/gvas-editor',
    name: 'gvas-editor',
    component: () => import('../tools/gvas-editor/index.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;