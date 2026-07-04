import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
});

/**
 * 获取所有工具元信息
 */
export async function fetchTools() {
  const res = await apiClient.get('/tools');
  return res.data;
}

/**
 * 执行工具
 * @param toolName 工具名
 * @param params 参数对象
 * @param files 文件列表（浏览器 File 对象）
 */
export async function executeTool(toolName: string, params: any, files: File[]) {
  const formData = new FormData();
  formData.append('params', JSON.stringify(params));
  for (const file of files) {
    formData.append('files', file);
  }
  const res = await apiClient.post(`/tools/${toolName}/execute`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}