import { TableData } from './types.js';

export function simpleQuery(
  tables: Record<string, TableData>,
  query: string
): { columns: string[]; rows: string[][] } {
  // 只支持 SELECT * FROM table WHERE col = 'val' 或不带 WHERE
  const match = query.match(/SELECT\s+\*\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i);
  if (!match) throw new Error('仅支持 SELECT * FROM table WHERE col=value 格式');
  const tableName = match[1];
  const whereClause = match[2]?.trim();

  const table = tables[tableName];
  if (!table) throw new Error(`表 ${tableName} 不存在`);

  let rows = table.rows;
  if (whereClause) {
    const condMatch = whereClause.match(/(\w+)\s*=\s*'([^']+)'/);
    if (!condMatch) throw new Error('WHERE 条件格式需为 col=\'value\'');
    const colName = condMatch[1];
    const value = condMatch[2];
    const colIndex = table.columns.findIndex(c => c.name === colName);
    if (colIndex === -1) throw new Error(`列 ${colName} 不存在`);
    rows = rows.filter(row => row[colIndex] === value);
  }

  return {
    columns: table.columns.map(c => c.name),
    rows,
  };
}