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
import { EventBus } from '../core/EventBus';
import { DatabaseManager, DatabaseConfig } from './DatabaseManager';
import { Tick } from '../types';
export interface PersistenceV3Config {
    /** データ保存先ディレクトリ */
    dataDir: string;
    /** 自動保存間隔（ティック） */
    autoSaveInterval: number;
    /** バックアップ世代数 */
    maxBackups: number;
    /** 詳細ログ */
    verbose: boolean;
    /** 自動マイグレーション */
    autoMigrate: boolean;
    /** データベース設定 */
    dbConfig?: Partial<DatabaseConfig>;
}
/** モジュール登録用インターフェース */
interface RegisteredModule {
    toJSON: () => object;
    fromJSON: (data: any) => void;
}
/**
 * 正規化テーブルを持つモジュールのアダプター
 * toJSON/fromJSON に加えて、saveToDB/loadFromDB を持つ
 */
export interface NormalizedModuleAdapter {
    /** SQLiteに個別テーブルとして保存 */
    saveToDB: (db: DatabaseManager) => void;
    /** SQLiteの個別テーブルから読み込み */
    loadFromDB: (db: DatabaseManager) => void;
}
export declare class PersistenceV3 {
    private config;
    private db;
    private events;
    private modules;
    private normalizedAdapters;
    private lastSaveTick;
    private moduleChecksums;
    private saveCount;
    private loadCount;
    private totalSaveDuration;
    constructor(config?: Partial<PersistenceV3Config>, events?: EventBus);
    private checkAndMigrate;
    /**
     * モジュールを登録する（既存互換）
     * 全てのモジュールはtoJSON/fromJSONを持つ。
     */
    registerModule(name: string, module: RegisteredModule): void;
    /**
     * 正規化テーブルアダプターを登録する（新API）
     * saveToDB/loadFromDBを持つモジュールは個別テーブルに直接保存/読み込みされる。
     */
    registerNormalizedAdapter(name: string, adapter: NormalizedModuleAdapter): void;
    save(tick: Tick, day: number): Promise<boolean>;
    load(): Promise<boolean>;
    checkAutoSave(tick: Tick, day: number): boolean;
    /** ストレージサイズを取得（PersistenceV2互換） */
    getStorageSize(): number;
    /** DatabaseManagerへの直接アクセス */
    getDatabase(): DatabaseManager;
    /** モジュール固有データの保存（PersistenceV2互換） */
    saveModuleData(moduleName: string, data: any, _filename: string): boolean;
    /** モジュール固有データの読み込み（PersistenceV2互換） */
    loadModuleData(moduleName: string, _filename: string): any | null;
    getStats(): {
        saveCount: number;
        loadCount: number;
        avgSaveDuration: number;
        moduleCount: number;
        normalizedModuleCount: number;
        blobModuleCount: number;
        dbStats: ReturnType<DatabaseManager['getStats']>;
    };
    getStorageInfo(): {
        totalSize: number;
        formattedSize: string;
        moduleCount: number;
        backupCount: number;
        stats: {
            totalSaves: number;
            totalErrors: number;
            averageSaveDuration: number;
            crashRecoveries: number;
            incrementalSaves: number;
            fullSaves: number;
        };
    };
    backup(): string | null;
    optimize(): void;
    integrityCheck(): boolean;
    exportAll(): {
        data: Record<string, any>;
    } | null;
    importAll(exportData: {
        data: Record<string, any>;
    }): boolean;
    close(): void;
    private simpleChecksum;
    private formatBytes;
}
export {};
//# sourceMappingURL=PersistenceV3.d.ts.map