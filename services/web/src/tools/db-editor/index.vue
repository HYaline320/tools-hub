<template>
    <div class="sql-editor">
        <h2>SQL / SQLite 编辑器</h2>

        <!-- 上传文件 -->
        <div v-if="!sessionId">
            <input type="file" @change="handleUpload" accept=".sql,.db,.sqlite,.sqlite3" />
            <p>支持 .sql 转储文件或 .sqlite/.db 数据库文件</p>
        </div>

        <div v-else>
            <p>会话 ID: {{ sessionId }}</p>
            <div class="toolbar">
                <label>表：</label>
                <select v-model="selectedTable" @change="loadTableData">
                    <option disabled value="">请选择</option>
                    <option v-for="t in tables" :key="t.name" :value="t.name">{{ t.name }}</option>
                </select>
                <button @click="exportData('json')">导出 JSON</button>
                <button @click="exportData('csv')">导出 CSV</button>
                <button @click="exportData('excel')">导出 Excel</button>
                <button @click="exportData('sql')">导出 SQL</button>
                <button @click="exportData('sqlite')">导出 SQLite</button>
                <button @click="convertFormat">SQL ↔ SQLite 互转</button>
                <input v-model="queryText" placeholder="SELECT * FROM table WHERE ..." />
                <button @click="executeQuery">查询</button>
            </div>

            <div class="table-wrap">
                <table v-if="columns.length">
                    <thead>
                        <tr>
                            <th v-for="col in columns" :key="col.name">{{ col.name }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, rIdx) in rows" :key="rIdx">
                            <td v-for="(cell, cIdx) in row" :key="cIdx" @dblclick="startEdit(rIdx, cIdx)">
                                <input v-if="editCell?.r === rIdx && editCell?.c === cIdx" v-model="editCell!.value"
                                    @blur="commitEdit(rIdx, cIdx)" @keydown.enter="commitEdit(rIdx, cIdx)" />
                                <span v-else :title="cell">{{ truncate(cell) }}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div v-else>无数据</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { executeTool } from '../../api/client';

const sessionId = ref<string | null>(null);
const tables = ref<any[]>([]);
const selectedTable = ref('');
const columns = ref<any[]>([]);
const rows = ref<string[][]>([]);
const queryText = ref('');
const editCell = ref<{ r: number; c: number; value: string } | null>(null);

function truncate(str: string) {
    return str.length > 30 ? str.substring(0, 30) + '...' : str;
}

async function handleUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    const res = await executeTool('db-editor', { action: 'upload' }, [input.files[0]]);
    sessionId.value = res.data.sessionId;
    await loadTables();
}

async function loadTables() {
    const res = await executeTool('db-editor', { action: 'listTables', sessionId: sessionId.value }, []);
    tables.value = res.data.tables;
}

async function loadTableData() {
    if (!selectedTable.value) return;
    const res = await executeTool('db-editor', {
        action: 'getTableData',
        sessionId: sessionId.value,
        tableName: selectedTable.value,
        limit: 100,
        offset: 0,
    }, []);
    columns.value = res.data.columns;
    rows.value = res.data.rows;
}

function startEdit(r: number, c: number) {
    editCell.value = { r, c, value: rows.value[r][c] };
}

async function commitEdit(r: number, c: number) {
    if (!editCell.value) return;
    const newVal = editCell.value.value;
    editCell.value = null;
    await executeTool('db-editor', {
        action: 'updateCell',
        sessionId: sessionId.value,
        tableName: selectedTable.value,
        rowIndex: r,
        column: columns.value[c].name,
        value: newVal,
    }, []);
    rows.value[r][c] = newVal;
}

async function executeQuery() {
    if (!queryText.value) return;
    const res = await executeTool('db-editor', {
        action: 'executeQuery',
        sessionId: sessionId.value,
        query: queryText.value,
    }, []);
    columns.value = res.data.columns;
    rows.value = res.data.rows;
}

async function exportData(format: string) {
    const res = await executeTool('db-editor', {
        action: 'export',
        sessionId: sessionId.value,
        format,
        tableName: selectedTable.value || undefined,
    }, []);
    if (res.data?.downloadFile) {
        window.open(`/api/files/${res.data.downloadFile.id}`);
    }
}

async function convertFormat() {
    const target = tables.value.length ? (confirm('转为 SQLite？') ? 'sqlite' : 'sql') : 'sqlite';
    await exportData(target);
}
</script>

<style src="./index.css" scoped></style>