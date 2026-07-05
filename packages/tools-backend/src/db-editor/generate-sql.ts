import { TableData } from './types.js';

export function generateSqlDump(tables: Record<string, TableData>): string {
  let sql = '';
  for (const [name, table] of Object.entries(tables)) {
    // CREATE TABLE
    sql += `CREATE TABLE ${name} (\n`;
    const colDefs = table.columns.map(c => `  ${c.name} ${c.type}`).join(',\n');
    sql += colDefs + '\n);\n\n';

    // INSERTs
    for (const row of table.rows) {
      const values = row.map(v => `'${v}'`).join(', ');
      sql += `INSERT INTO ${name} VALUES (${values});\n`;
    }
    sql += '\n';
  }
  return sql;
}