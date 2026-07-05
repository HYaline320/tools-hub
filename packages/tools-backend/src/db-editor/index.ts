import { BaseToolHandler } from '../base-handler.js';
import { IToolHandler, ToolParams, ToolResult, FileRef } from '@tools-hub/tool-sdk';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { SessionData, TableData } from './types.js';
import { getTables as sqliteGetTables, getTableColumns, getTableData, execUpdate, exportToCSV } from './sqlite-executor.js';
import { parseSqlDump } from './sql-parser.js';
import { generateSqlDump } from './generate-sql.js';
import { generateExcelFile } from './generate-excel.js';
import { simpleQuery } from './simple-query.js';
import { execFile, exec } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);  // 用于接收 stdin 输入



const SESSION_DIR = path.resolve(process.env.FILE_STORAGE_PATH || './uploads', 'sessions');

export class DBEditorHandler extends BaseToolHandler {
  meta = {
    name: 'db-editor',
    category: 'database',
    description: '查看/编辑 SQL 与 SQLite 文件，支持导出与互转',
  };

  validate(params: any): ToolParams {
    if (!params.action) throw new Error('缺少 action 参数');
    const validActions = ['upload', 'listTables', 'getTableData', 'updateCell', 'executeQuery', 'export', 'convert'];
    if (!validActions.includes(params.action)) throw new Error('无效 action');
    return params;
  }

  async execute(params: ToolParams, files: FileRef[]): Promise<ToolResult> {
    switch (params.action) {
      case 'upload': return this.uploadFile(files);
      case 'listTables': return this.listTables(params);
      case 'getTableData': return this.getTableDataAction(params);
      case 'updateCell': return this.updateCell(params);
      case 'executeQuery': return this.executeQueryAction(params);
      case 'export': return this.exportData(params);
      case 'convert': return this.convertFormat(params);
      default: throw new Error('未知 action');
    }
  }

  // ── 上传文件，初始化 session ──
  private async uploadFile(files: FileRef[]): Promise<ToolResult> {
    if (files.length === 0) throw new Error('请上传文件');
    const file = files[0];
    const filePath = await this.getFilePath(file.id);
    const ext = path.extname(file.originalName).toLowerCase();
    const sessionId = uuidv4();
    const session: SessionData = { mode: 'sql', originalFileId: file.id, tables: {} };
    await fs.mkdir(SESSION_DIR, { recursive: true });

    if (ext === '.sql') {
      const content = await fs.readFile(filePath, 'utf-8');
      session.tables = parseSqlDump(content);
      session.mode = 'sql';
    } else if (['.db', '.sqlite', '.sqlite3'].includes(ext)) {
      session.mode = 'sqlite';
      session.dbFilePath = filePath;  // 保留原文件路径
    } else {
      throw new Error('不支持的文件类型，请上传 .sql 或 .sqlite/.db');
    }

    const sessionFile = path.join(SESSION_DIR, `${sessionId}.json`);
    await fs.writeFile(sessionFile, JSON.stringify(session, null, 2));

    return { data: { sessionId } };
  }

  // ── 辅助函数：加载 session ──
  private async loadSession(sessionId: string): Promise<SessionData> {
    const file = path.join(SESSION_DIR, `${sessionId}.json`);
    const raw = await fs.readFile(file, 'utf-8');
    return JSON.parse(raw);
  }
  private async saveSession(sessionId: string, data: SessionData): Promise<void> {
    const file = path.join(SESSION_DIR, `${sessionId}.json`);
    await fs.writeFile(file, JSON.stringify(data, null, 2));
  }

  // ── 获取表列表 ──
  private async listTables(params: ToolParams): Promise<ToolResult> {
  const session = await this.loadSession(params.sessionId);
  try {
    if (session.mode === 'sqlite') {
      const tables = await sqliteGetTables(session.dbFilePath!);
      const result = [];
      for (const t of tables) {
        const cols = await getTableColumns(session.dbFilePath!, t.name);
        result.push({ name: t.name, columns: cols });
      }
      return { data: { tables: result } };
    } else {
      const tables = Object.entries(session.tables).map(([name, tab]) => ({
        name,
        columns: tab.columns,
      }));
      return { data: { tables } };
    }
  } catch (err: any) {
    console.error('[listTables error]', err.message);
    throw new Error(`无法获取表列表: ${err.message}`);
  }
}

  // ── 获取表数据（分页） ──
  private async getTableDataAction(params: ToolParams): Promise<ToolResult> {
    const session = await this.loadSession(params.sessionId);
    const tableName = params.tableName;
    const limit = Number(params.limit) || 50;
    const offset = Number(params.offset) || 0;
    if (session.mode === 'sqlite') {
      const cols = await getTableColumns(session.dbFilePath!, tableName);
      const rows = await getTableData(session.dbFilePath!, tableName, limit, offset);
      return { data: { columns: cols, rows } };
    } else {
      const table = session.tables[tableName];
      if (!table) throw new Error('表不存在');
      const rows = table.rows.slice(offset, offset + limit);
      return { data: { columns: table.columns, rows } };
    }
  }

  // ── 单元格更新 ──
  private async updateCell(params: ToolParams): Promise<ToolResult> {
    const session = await this.loadSession(params.sessionId);
    const { tableName, rowIndex, column, value } = params;
    if (session.mode === 'sqlite') {
      // 通过 rowid 更新，前端需要传递行在表中的唯一标识，这里简化用 rowIndex 对应 OFFSET（不严谨，需真实 rowid）
      // 生产环境应基于主键，但演示简化：获取所有列，构造 UPDATE ... WHERE rowid = rowIndex+1（假定 rowid 连续）
      const sql = `UPDATE ${tableName} SET ${column} = '${value}' WHERE rowid = ${rowIndex + 1};`;
      await execUpdate(session.dbFilePath!, sql);
      return { data: { success: true } };
    } else {
      const table = session.tables[tableName];
      if (!table) throw new Error('表不存在');
      const colIdx = table.columns.findIndex(c => c.name === column);
      if (colIdx === -1) throw new Error('列不存在');
      table.rows[rowIndex][colIdx] = value;
      await this.saveSession(params.sessionId, session);
      return { data: { success: true } };
    }
  }

  // ── 执行简单查询 ──
  private async executeQueryAction(params: ToolParams): Promise<ToolResult> {
    const session = await this.loadSession(params.sessionId);
    const query = params.query;
    if (session.mode === 'sqlite') {
      if (!/^\s*SELECT/i.test(query)) throw new Error('仅允许 SELECT 查询');
      const { stdout } = await execFileAsync('sqlite3', [session.dbFilePath!, '-header', '-csv', query], {
        encoding: 'utf-8',
        maxBuffer: 100 * 1024 * 1024,
      });
      const lines: string[] = stdout.trim().split('\n').filter(Boolean);
      const columns = lines[0]?.split(',').map((s: string) => s.replace(/"/g, '')) || [];
      const rows = lines.slice(1).map((line: string) =>
        line.split(',').map((cell: string) => cell.replace(/^"|"$/g, ''))
      );
      return { data: { columns: columns.map((c: string) => ({ name: c, type: 'TEXT' })), rows } };
    } else {
      const result = simpleQuery(session.tables, query);
      return { data: { columns: result.columns.map((c: string) => ({ name: c, type: 'TEXT' })), rows: result.rows } };
    }
  }

  // ── 导出 ──
  private async exportData(params: ToolParams): Promise<ToolResult> {
    const session = await this.loadSession(params.sessionId);
    const format = params.format; // 'csv', 'json', 'excel', 'sql', 'sqlite'
    const table = params.tableName; // 可选，为空导出全部

    if (session.mode === 'sqlite' && format !== 'excel' && format !== 'json' && !params.modified) {
      // 未修改可直接用 CLI 导出
      let output: string;
      if (format === 'sql') {
        output = await exportToCSV(session.dbFilePath!); // .dump
        const filePath = await this.writeTempFile(output, 'dump.sql');
        return { downloadFile: { id: path.basename(filePath), originalName: 'dump.sql', mimeType: 'text/plain' } };
      } else if (format === 'csv') {
        output = await exportToCSV(session.dbFilePath!, table);
        const filePath = await this.writeTempFile(output, 'data.csv');
        return { downloadFile: { id: path.basename(filePath), originalName: 'data.csv', mimeType: 'text/csv' } };
      } else if (format === 'json') {
        const cols = table ? await getTableColumns(session.dbFilePath!, table) : [];
        const rows = table ? await getTableData(session.dbFilePath!, table, 1000000, 0) : [];
        const json = JSON.stringify({ columns: cols, rows }, null, 2);
        const filePath = await this.writeTempFile(json, 'data.json');
        return { downloadFile: { id: path.basename(filePath), originalName: 'data.json', mimeType: 'application/json' } };
      } else if (format === 'sqlite') {
        // 直接返回原文件
        return { downloadFile: { id: session.originalFileId, originalName: 'database.db', mimeType: 'application/octet-stream' } };
      }
    }

    // 其他情况：基于 session.tables 生成文件
    let tables: Record<string, TableData>;
    if (session.mode === 'sqlite') {
      // 需要从数据库重新读取全量数据构建 tables
      const allTables = await sqliteGetTables(session.dbFilePath!);
      tables = {};
      for (const t of allTables) {
        const cols = await getTableColumns(session.dbFilePath!, t.name);
        const rows = await getTableData(session.dbFilePath!, t.name, 1000000, 0);
        tables[t.name] = { columns: cols, rows };
      }
    } else {
      tables = session.tables;
    }

    if (format === 'json') {
      const json = JSON.stringify(tables, null, 2);
      const filePath = await this.writeTempFile(json, 'data.json');
      return { downloadFile: { id: path.basename(filePath), originalName: 'data.json', mimeType: 'application/json' } };
    } else if (format === 'csv') {
      // 简单 CSV 导出（单表）
      const t = tables[table!];
      const header = t.columns.map(c => c.name).join(',');
      const rows = t.rows.map(row => row.map(v => `"${v}"`).join(',')).join('\n');
      const csv = header + '\n' + rows;
      const filePath = await this.writeTempFile(csv, 'data.csv');
      return { downloadFile: { id: path.basename(filePath), originalName: 'data.csv', mimeType: 'text/csv' } };
    } else if (format === 'excel') {
      const fileName = `export-${uuidv4()}.xlsx`;
      const filePath = await generateExcelFile(tables, process.env.FILE_STORAGE_PATH || './uploads', fileName);
      return { downloadFile: { id: fileName, originalName: 'export.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } };
    } else if (format === 'sql') {
      const sql = generateSqlDump(tables);
      const filePath = await this.writeTempFile(sql, 'dump.sql');
      return { downloadFile: { id: path.basename(filePath), originalName: 'dump.sql', mimeType: 'text/plain' } };
    } else if (format === 'sqlite') {
      // 生成 SQLite 文件：使用 sqlite3 CLI 从 JSON 创建
      const tmpDb = path.join(process.env.FILE_STORAGE_PATH || './uploads', `tmp-${uuidv4()}.db`);
      await this.createSqliteFromTables(tables, tmpDb);
      return { downloadFile: { id: path.basename(tmpDb), originalName: 'converted.db', mimeType: 'application/octet-stream' } };
    }
    throw new Error('不支持的导出格式');
  }

  // 转换动作：本质是导出为另一种格式
  private async convertFormat(params: ToolParams): Promise<ToolResult> {
    // 与 export 类似，但指定目标格式，可复用
    params.action = 'export';
    return this.exportData(params);
  }

  // ── 辅助：写临时文件 ──
  private async writeTempFile(content: string, filename: string): Promise<string> {
    const dir = process.env.FILE_STORAGE_PATH || './uploads';
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, content);
    return filePath;
  }


  private async createSqliteFromTables(tables: Record<string, TableData>, dbPath: string): Promise<void> {
    const sql = generateSqlDump(tables);
    const tmpSqlPath = path.join(process.env.FILE_STORAGE_PATH || './uploads', `init-${uuidv4()}.sql`);

    // 将 SQL 写入临时文件
    await fs.writeFile(tmpSqlPath, sql, 'utf-8');

    try {
      // 使用 execFile 执行 sqlite3，通过 -init 参数读取 SQL 文件
      await execFileAsync('sqlite3', [dbPath, '-init', tmpSqlPath, '.quit'], {
        encoding: 'utf-8',
        maxBuffer: 100 * 1024 * 1024,
      });
    } finally {
      // 清理临时文件
      await fs.unlink(tmpSqlPath).catch(() => { });
    }
  }
}