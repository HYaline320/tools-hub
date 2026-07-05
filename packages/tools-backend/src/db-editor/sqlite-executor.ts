// 生命周期：R
import { execFile } from 'child_process';
import { promisify } from 'util';
import { ColumnDef } from './types.js';


const execFileAsync = promisify(execFile);

// 强制使用绝对路径，避免 PATH 问题
const SQLITE3_BIN = process.env.SQLITE3_PATH || '/usr/bin/sqlite3';

export async function sqliteExec(dbPath: string, command: string): Promise<string> {
  const args = [
    dbPath,
    '-separator', ',',
    '-cmd', command,
    '-cmd', '.quit',
    '-batch'
  ];

  console.log(`[sqlite3] 执行命令: ${SQLITE3_BIN} ${args.join(' ')}`);

  try {
    const { stdout } = await execFileAsync(SQLITE3_BIN, args, {
      encoding: 'utf-8',
      maxBuffer: 100 * 1024 * 1024,
      timeout: 10000,
    });
    return stdout;
  } catch (err: any) {
    // sqlite3 with -cmd often exits with code 1 despite valid output
    if (err.stdout && err.stdout.trim()) {
      console.log('[sqlite3] 使用 stdout from error (exit code non-zero)');
      return err.stdout;
    }
    // 如果 stdout 也为空，则抛出错误
    console.error(`[sqlite3 错误] stderr: ${err.stderr}`);
    console.error(`[sqlite3 错误] message: ${err.message}`);
    throw new Error(`sqlite3 执行失败: ${err.stderr || err.message}`);
  }
}
// 替换原来的 getTables 和 getTableColumns
export async function getTablesWithColumns(dbPath: string): Promise<{ name: string; columns: ColumnDef[] }[]> {
  // 1. 获取所有表名和建表语句
  const tablesOutput = await sqliteExec(dbPath,
    `SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name;`
  );

  // 解析 CSV 输出：每行 "表名","CREATE TABLE ..."
  const lines = tablesOutput.trim().split('\n').filter(Boolean);
  const tables: { name: string; sql: string }[] = [];

  for (const line of lines) {
    // csv 格式，简单解析（不处理引号内逗号）
    const match = line.match(/^"?([^"]+)"?,"?([^"]*)"?$/);
    if (match) {
      tables.push({ name: match[1], sql: match[2] || '' });
    }
  }

  // 2. 对每个表，用 PRAGMA 获取列信息，但合并到单次调用
  let pragmaCommands = '';
  for (const t of tables) {
    pragmaCommands += `.mode csv\n.header off\nPRAGMA table_info(${t.name});\n`;
  }
  pragmaCommands += '.quit';

  const pragmaOutput = await sqliteExec(dbPath, pragmaCommands);

  // 解析 pragma 输出：每个表的 PRAGMA 结果用空行或连续行分隔
  const result: { name: string; columns: ColumnDef[] }[] = [];
  let tableIdx = 0;
  const allLines = pragmaOutput.trim().split('\n').filter(Boolean);

  // 每个 PRAGMA 返回的行数等于列数，连续的行属于当前表
  let currentColumns: ColumnDef[] = [];
  let currentTable = tables[tableIdx]?.name;
  let rowCount = 0;

  for (const line of allLines) {
    if (!currentTable) break;

    const parts = line.split(',');
    if (parts.length >= 3) {
      const colName = parts[1].replace(/"/g, '');
      const colType = parts[2].replace(/"/g, '');
      currentColumns.push({ name: colName, type: colType });
      rowCount++;
    }

    // 当收集的列数达到某个表的列数时（不知道列数，只能按顺序假设下一个表开始）
    // 简单处理：每当 PRAGMA 输出完毕，由调用者计算
  }

  // 更稳健的方法：分别解析每个 PRAGMA 块，通过查询前已知列数？还是保持原有简洁？

  // 由于难以可靠分割，退回优化：仍然循环表，但用单个子进程通过 -cmd 串联所有 PRAGMA
  // 这里提供另一种方式：使用 .print 分隔符
  return optimizeWithBatchedPragma(dbPath, tables);
}

// 备用方案：保留循环但使用 execFile 的单次调用 (利用 -cmd 多次)
async function optimizeWithBatchedPragma(dbPath: string, tables: { name: string }[]): Promise<{ name: string; columns: ColumnDef[] }[]> {
  // 构建包含所有 PRAGMA 的 -cmd 参数，并用 .print 标记分隔
  let cmdStr = '.mode csv\n.header off\n';
  for (const t of tables) {
    cmdStr += `.print MARKER_${t.name}\n`;
    cmdStr += `PRAGMA table_info(${t.name});\n`;
  }
  cmdStr += '.quit';

  const output = await sqliteExec(dbPath, cmdStr);

  // 按 MARKER_ 分割
  const sections = output.split(/MARKER_(\w+)/);
  const result: { name: string; columns: ColumnDef[] }[] = [];

  for (let i = 1; i < sections.length; i += 2) {
    const tableName = sections[i];
    const data = sections[i + 1]?.trim();
    const columns: ColumnDef[] = [];
    if (data) {
      for (const line of data.split('\n').filter(Boolean)) {
        const parts = line.split(',');
        if (parts.length >= 3) {
          columns.push({ name: parts[1].replace(/"/g, ''), type: parts[2].replace(/"/g, '') });
        }
      }
    }
    result.push({ name: tableName, columns });
  }

  return result;
}

// 修改原来的 getTables 和 getTableColumns 不再单独导出，直接导出优化后的函数

export async function getTables(dbPath: string): Promise<{ name: string; sql: string }[]> {
  //TODO:太慢，优化
  try {
    const output = await sqliteExec(dbPath, '.tables');
    const names = output.trim().split(/\s+/).filter(Boolean);
    const result = [];
    for (const name of names) {
      try {
        const schema = await sqliteExec(dbPath, `.schema ${name}`);
        result.push({ name, sql: schema.trim() });
      } catch (e) {
        console.warn(`无法获取表 ${name} 的结构:`, e);
        result.push({ name, sql: '' });
      }
    }
    return result;
  } catch (err: any) {
    console.error('[getTables 错误]', err.message);
    throw err;
  }
}

// 其他函数（getTableColumns, getTableData, execUpdate, exportToCSV）保持不变，只需确认它们也包含 try-catch

export async function getTableColumns(dbPath: string, tableName: string): Promise<ColumnDef[]> {
  const raw = await sqliteExec(dbPath, `PRAGMA table_info(${tableName});`);
  const lines = raw.trim().split('\n');
  const cols: ColumnDef[] = [];
  for (const line of lines) {
    const parts = line.split(',');
    if (parts.length >= 3) {
      cols.push({ name: parts[1], type: parts[2] });
    }
  }
  return cols;
}

export async function getTableData(dbPath: string, table: string, limit: number, offset: number): Promise<string[][]> {
  const sql = `SELECT * FROM ${table} LIMIT ${limit} OFFSET ${offset};`;
  const out = await sqliteExec(dbPath, `-header -csv ${sql}`);
  const lines = out.trim().split('\n');
  // 第一行是列名，跳过
  return lines.slice(1).map(line => line.split(',').map(cell => cell.replace(/^"|"$/g, '')));
}

export async function execUpdate(dbPath: string, sql: string): Promise<number> {
  const out = await sqliteExec(dbPath, sql);
  // sqlite3 在成功时不输出内容，我们通过 echo "changes" 获取影响行数（另一种方式）
  // 简化：返回 1 表示成功
  return 1;
}

export async function exportToCSV(dbPath: string, table?: string): Promise<string> {
  const cmd = table
    ? `.mode csv\n.header on\nSELECT * FROM ${table};`
    : `.dump`;  // 整个数据库 dump
  if (table) {
    return await sqliteExec(dbPath, cmd);
  } else {
    // 导出全库 dump 使用 .dump
    const { stdout } = await execFileAsync(SQLITE3_BIN, [dbPath, '.dump'], { encoding: 'utf-8', maxBuffer: 100 * 1024 * 1024 });
    return stdout;
  }
}