"use strict";
/**
 * PersistenceV3 - Phase 8 Pre: SQLiteバックエンド永続化システム
 *
 * PersistenceV2と同じインターフェースを提供しつつ、
 * バックエンドをSQLiteに切り替える。
 *
 * 既存モジュールとの互換性:
 * - registerModule() → 同じ
 * - save() → SQLiteに保存
 * - load() → SQLiteから読み込み
 * - checkAutoSave() → 同じ
 *
 * 新機能:
 * - 正規化テーブルを持つモジュールは個別テーブルに保存
 * - その他のモジュールはmodule_statesテーブルにBLOB保存
 * - 全文検索対応
 * - マイグレーション自動検出（state.json → SQLite）
 *
 * 設計方針:
 * - 段階的移行：モジュールを1つずつ正規化テーブルに移行できる
 * - 既存コードの変更を最小限に
 * - SoulEngineのregisterModuleの仕組みはそのまま使える
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistenceV3 = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const EventBus_1 = require("../core/EventBus");
const DatabaseManager_1 = require("./DatabaseManager");
const JsonToSqliteMigrator_1 = require("./JsonToSqliteMigrator");
const DEFAULT_V3_CONFIG = {
    dataDir: './somunia-data',
    autoSaveInterval: 60,
    maxBackups: 5,
    verbose: false,
    autoMigrate: true,
};
// ============================================================
// PersistenceV3
// ============================================================
class PersistenceV3 {
    config;
    db;
    events;
    modules = new Map();
    normalizedAdapters = new Map();
    lastSaveTick = 0;
    moduleChecksums = new Map();
    saveCount = 0;
    loadCount = 0;
    totalSaveDuration = 0;
    constructor(config = {}, events) {
        this.config = { ...DEFAULT_V3_CONFIG, ...config };
        this.events = events || EventBus_1.eventBus;
        // ディレクトリ確保
        if (!fs.existsSync(this.config.dataDir)) {
            fs.mkdirSync(this.config.dataDir, { recursive: true });
        }
        // データベース初期化
        const dbPath = path.join(this.config.dataDir, 'somunia.db');
        this.db = new DatabaseManager_1.DatabaseManager({
            dbPath,
            walMode: true,
            verbose: this.config.verbose,
            maxBackups: this.config.maxBackups,
            ...(this.config.dbConfig || {}),
        });
        // state.jsonからの自動マイグレーション
        if (this.config.autoMigrate) {
            this.checkAndMigrate();
        }
        console.log('[PersistenceV3] ✓ 初期化完了（SQLiteバックエンド）');
    }
    // ============================================================
    // マイグレーション
    // ============================================================
    checkAndMigrate() {
        const stateJsonPath = path.join(this.config.dataDir, 'state.json');
        const migrationMarker = path.join(this.config.dataDir, '.migrated_to_sqlite');
        // まだマイグレーションしていない場合のみ実行
        if (fs.existsSync(stateJsonPath) && !fs.existsSync(migrationMarker)) {
            console.log('[PersistenceV3] state.jsonを検出。SQLiteへマイグレーションを実行します...');
            const migrator = new JsonToSqliteMigrator_1.JsonToSqliteMigrator(this.db);
            const stats = migrator.migrate(stateJsonPath);
            if (stats.errors === 0) {
                // マイグレーション成功マーカーを置く
                fs.writeFileSync(migrationMarker, JSON.stringify({
                    migratedAt: new Date().toISOString(),
                    stats,
                    sourceFile: stateJsonPath,
                }, null, 2));
                // state.jsonをバックアップ
                const backupPath = stateJsonPath + '.backup';
                fs.copyFileSync(stateJsonPath, backupPath);
                console.log(`[PersistenceV3] マイグレーション完了。元ファイルを${backupPath}にバックアップしました。`);
            }
            else {
                console.warn(`[PersistenceV3] マイグレーション完了（エラー ${stats.errors}件）。state.jsonは保持します。`);
            }
        }
    }
    // ============================================================
    // モジュール登録（PersistenceV2互換）
    // ============================================================
    /**
     * モジュールを登録する（既存互換）
     * 全てのモジュールはtoJSON/fromJSONを持つ。
     */
    registerModule(name, module) {
        this.modules.set(name, module);
    }
    /**
     * 正規化テーブルアダプターを登録する（新API）
     * saveToDB/loadFromDBを持つモジュールは個別テーブルに直接保存/読み込みされる。
     */
    registerNormalizedAdapter(name, adapter) {
        this.normalizedAdapters.set(name, adapter);
    }
    // ============================================================
    // 保存
    // ============================================================
    async save(tick, day) {
        const startTime = Date.now();
        try {
            let dirtyCount = 0;
            this.db.transaction(() => {
                // 1. 正規化テーブルを持つモジュールの保存
                for (const [name, adapter] of this.normalizedAdapters.entries()) {
                    try {
                        adapter.saveToDB(this.db);
                        dirtyCount++;
                    }
                    catch (err) {
                        console.error(`[PersistenceV3] 正規化保存失敗 (${name}):`, err);
                    }
                }
                // 2. 残りのモジュールはBLOB保存
                for (const [name, module] of this.modules.entries()) {
                    // 正規化アダプターがあるモジュールはスキップ
                    if (this.normalizedAdapters.has(name))
                        continue;
                    try {
                        const moduleData = module.toJSON();
                        const json = JSON.stringify(moduleData);
                        const checksum = this.simpleChecksum(json);
                        // 変更がある場合のみ保存
                        if (checksum !== this.moduleChecksums.get(name)) {
                            this.db.saveModuleState(name, moduleData);
                            this.moduleChecksums.set(name, checksum);
                            dirtyCount++;
                        }
                    }
                    catch (err) {
                        console.error(`[PersistenceV3] BLOB保存失敗 (${name}):`, err);
                    }
                }
                // 3. システム状態を保存
                this.db.setSystemState('lastSave', {
                    tick,
                    day,
                    timestamp: new Date().toISOString(),
                    moduleCount: this.modules.size,
                    dirtyCount,
                });
            });
            const duration = Date.now() - startTime;
            this.lastSaveTick = tick;
            this.saveCount++;
            this.totalSaveDuration += duration;
            this.events.emitSync({
                type: 'state_saved',
                timestamp: tick,
                data: { duration, dirtyModules: dirtyCount },
            });
            return true;
        }
        catch (err) {
            console.error('[PersistenceV3] 保存失敗:', err);
            return false;
        }
    }
    // ============================================================
    // 読み込み
    // ============================================================
    async load() {
        try {
            let loadedCount = 0;
            // 1. 正規化テーブルを持つモジュールの読み込み
            for (const [name, adapter] of this.normalizedAdapters.entries()) {
                try {
                    adapter.loadFromDB(this.db);
                    loadedCount++;
                }
                catch (err) {
                    console.error(`[PersistenceV3] 正規化読み込み失敗 (${name}):`, err);
                }
            }
            // 2. BLOB保存されたモジュールの読み込み
            for (const [name, module] of this.modules.entries()) {
                if (this.normalizedAdapters.has(name))
                    continue;
                try {
                    const data = this.db.loadModuleState(name);
                    if (data) {
                        module.fromJSON(data);
                        loadedCount++;
                    }
                }
                catch (err) {
                    console.error(`[PersistenceV3] BLOB読み込み失敗 (${name}):`, err);
                }
            }
            this.loadCount++;
            console.log(`[PersistenceV3] ✓ ${loadedCount}モジュール読み込み完了`);
            this.events.emitSync({
                type: 'state_loaded',
                timestamp: 0,
                data: { loadedModules: loadedCount },
            });
            return loadedCount > 0;
        }
        catch (err) {
            console.error('[PersistenceV3] 読み込み失敗:', err);
            return false;
        }
    }
    // ============================================================
    // 自動保存
    // ============================================================
    checkAutoSave(tick, day) {
        if (tick - this.lastSaveTick >= this.config.autoSaveInterval) {
            this.save(tick, day).catch(err => {
                console.error('[PersistenceV3] 自動保存失敗:', err);
            });
            return true;
        }
        return false;
    }
    // ============================================================
    // データベースアクセス
    // ============================================================
    /** ストレージサイズを取得（PersistenceV2互換） */
    getStorageSize() {
        return this.db.getStats().dbSizeBytes;
    }
    /** DatabaseManagerへの直接アクセス */
    getDatabase() {
        return this.db;
    }
    // ============================================================
    // PersistenceV2互換メソッド
    // ============================================================
    /** モジュール固有データの保存（PersistenceV2互換） */
    saveModuleData(moduleName, data, _filename) {
        try {
            this.db.saveModuleState(`${moduleName}:${_filename}`, data);
            return true;
        }
        catch {
            return false;
        }
    }
    /** モジュール固有データの読み込み（PersistenceV2互換） */
    loadModuleData(moduleName, _filename) {
        return this.db.loadModuleState(`${moduleName}:${_filename}`);
    }
    // ============================================================
    // 統計
    // ============================================================
    getStats() {
        return {
            saveCount: this.saveCount,
            loadCount: this.loadCount,
            avgSaveDuration: this.saveCount > 0 ? this.totalSaveDuration / this.saveCount : 0,
            moduleCount: this.modules.size,
            normalizedModuleCount: this.normalizedAdapters.size,
            blobModuleCount: this.modules.size - this.normalizedAdapters.size,
            dbStats: this.db.getStats(),
        };
    }
    getStorageInfo() {
        const dbStats = this.db.getStats();
        const totalSize = dbStats.dbSizeBytes;
        const backupDir = path.join(this.config.dataDir, 'backups');
        let backupCount = 0;
        try {
            backupCount = fs.readdirSync(backupDir)
                .filter(f => f.endsWith('.db')).length;
        }
        catch { /* no backup dir */ }
        return {
            totalSize,
            formattedSize: this.formatBytes(totalSize),
            moduleCount: this.modules.size,
            backupCount,
            stats: {
                totalSaves: this.saveCount,
                totalErrors: 0,
                averageSaveDuration: this.saveCount > 0 ? this.totalSaveDuration / this.saveCount : 0,
                crashRecoveries: 0,
                incrementalSaves: this.saveCount,
                fullSaves: 0,
            },
        };
    }
    // ============================================================
    // バックアップ
    // ============================================================
    backup() {
        return this.db.backup();
    }
    // ============================================================
    // 最適化 & メンテナンス
    // ============================================================
    optimize() {
        this.db.optimize();
    }
    integrityCheck() {
        return this.db.integrityCheck();
    }
    // ============================================================
    // エクスポート/インポート（PersistenceV2互換）
    // ============================================================
    exportAll() {
        try {
            const data = {};
            for (const [name, module] of this.modules.entries()) {
                try {
                    data[name] = module.toJSON();
                }
                catch { /* skip */ }
            }
            return { data };
        }
        catch {
            return null;
        }
    }
    importAll(exportData) {
        try {
            let count = 0;
            for (const [name, module] of this.modules.entries()) {
                if (exportData.data[name]) {
                    try {
                        module.fromJSON(exportData.data[name]);
                        count++;
                    }
                    catch { /* skip */ }
                }
            }
            return count > 0;
        }
        catch {
            return false;
        }
    }
    // ============================================================
    // クリーンアップ
    // ============================================================
    close() {
        this.db.close();
    }
    // ============================================================
    // ユーティリティ
    // ============================================================
    simpleChecksum(data) {
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return Math.abs(hash).toString(36);
    }
    formatBytes(bytes) {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024)
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
}
exports.PersistenceV3 = PersistenceV3;
//# sourceMappingURL=PersistenceV3.js.map