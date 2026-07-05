import ExcelJS from 'exceljs';
import { TableData } from './types.js';
import path from 'path';
import fs from 'fs/promises';

export async function generateExcelFile(
  tables: Record<string, TableData>,
  outputDir: string,
  fileName: string
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  for (const [tableName, table] of Object.entries(tables)) {
    const sheet = workbook.addWorksheet(tableName);
    sheet.columns = table.columns.map(col => ({ header: col.name, key: col.name }));
    for (const row of table.rows) {
      const rowObj: any = {};
      table.columns.forEach((col, idx) => {
        rowObj[col.name] = row[idx] ?? '';
      });
      sheet.addRow(rowObj);
    }
  }
  const filePath = path.join(outputDir, fileName);
  await workbook.xlsx.writeFile(filePath);
  return filePath;
}