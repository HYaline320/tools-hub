// 生命周期：R
import { TableData, ColumnDef } from './types.js';

export function parseSqlDump(sqlContent: string): Record<string, TableData> {
  const tables: Record<string, TableData> = {};

  // 提取所有 CREATE TABLE 语句（简单正则，假设标准格式）
  const createRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?(\w+)[`"]?\s*\(([\s\S]+?)\);/gi;
  const insertRegex = /INSERT\s+INTO\s+[`"]?(\w+)[`"]?\s+VALUES\s*\(([^)]+)\);/gi;

  // 先解析表结构
  let match;
  while ((match = createRegex.exec(sqlContent)) !== null) {
    const tableName = match[1];
    const columnsDef = match[2];
    const colDefs: ColumnDef[] = [];
    const colParts = columnsDef.split(',');
    for (const part of colParts) {
      const trimmed = part.trim();
      if (trimmed === '') continue;
      // 简单提取列名和类型（忽略约束）
      const colMatch = trimmed.match(/[`"]?(\w+)[`"]?\s+(\w+)/);
      if (colMatch) {
        colDefs.push({ name: colMatch[1], type: colMatch[2] });
      }
    }
    tables[tableName] = { columns: colDefs, rows: [] };
  }

  // 解析 INSERT 语句
  while ((match = insertRegex.exec(sqlContent)) !== null) {
    const tableName = match[1];
    const valuesStr = match[2];
    if (!tables[tableName]) continue; // 忽略未定义的表
    // 分割值（简单用逗号分隔，不处理引号内逗号）
    const values = valuesStr.split(',').map(v => v.trim().replace(/^'|'$/g, '').replace(/^"|"$/g, ''));
    tables[tableName].rows.push(values);
  }

  return tables;
}