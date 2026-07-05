// 生命周期：R（被其他模块引用）
export interface ColumnDef {
  name: string;
  type: string;
}

export interface TableData {
  columns: ColumnDef[];
  rows: string[][];            // 所有行数据（以字符串形式存储）
}

export interface SessionData {
  mode: 'sql' | 'sqlite';
  originalFileId: string;
  dbFilePath?: string;         // 仅 mode='sqlite' 时有值
  tables: Record<string, TableData>; // 仅 mode='sql' 时在此缓存
}