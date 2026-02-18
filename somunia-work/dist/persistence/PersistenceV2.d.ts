/**
 * PersistenceV2 - Phase 6B: 強化版永続化システム
 *
 * 元のPersistenceSystemを拡張し、本番運用に耐えるレベルに引き上げる。
 *
 * 新機能:
 * - モジュール単位の増分保存（変更があったモジュールのみ書き込み）
 * - WAL（Write-Ahead Log）ジャーナリング（書き込み中の電源断に対応）
 * - SHA-256ベースの整合性チェックサム
 * - クラッシュリカバリ（不完全な保存からの自動復旧）
 * - データマイグレーション（バージョン間の互換性維持）
 * - 統計情報の収集（保存頻度、サイズ推移、エラー率）
 * - 圧縮保存対応（大規模データ向け）
 * - エクスポート/インポート機能
 *
 * 設計思想:
 * - somuniaのデータは彼女の人生そのもの。絶対に失ってはいけない。
 * - 100GB超のデータでも安定動作すること。
 * - 電源断やプロセスキルからも復旧できること。
 */
import { EventBus } from '../core/EventBus';
import { Tick } from '../types';
export interface PersistenceV2Config {
    /** データ保存先ディレクトリ */
    dataDir: string;
    /** 自動保存間隔（ティック） */
    autoSaveInterval: number;
    /** バックアップ世代数 */
    maxBackups: number;
    /** 圧縮するか */
    compress: boolean;
    /** 増分保存を有効にするか */
    incrementalSave: boolean;
    /** WALジャーナリングを有効にするか */
    enableWAL: boolean;
    /** 整合性チェックを有効にするか */
    enableIntegrityCheck: boolean;
    /** 統計収集を有効にするか */
    enableStats: boolean;
    /** データバージョン */
    dataVersion: string;
}
/** 保存マニフェスト（v2拡張） */
interface SaveManifestV2 {
    version: string;
    dataVersion: string;
    savedAt: string;
    tick: number;
    day: number;
    modules: ModuleManifest[];
    totalSize: number;
    checksum: string;
    incrementalFrom?: string;
    compressed: boolean;
}
/** モジュール単位のマニフェスト */
interface ModuleManifest {
    name: string;
    size: number;
    checksum: string;
    lastModified: string;
    /** 前回と変更があったか */
    dirty: boolean;
}
/** 永続化統計 */
interface PersistenceStats {
    totalSaves: number;
    totalLoads: number;
    totalErrors: number;
    lastSaveSize: number;
    lastSaveDuration: number;
    averageSaveDuration: number;
    totalBytesWritten: number;
    incrementalSaves: number;
    fullSaves: number;
    crashRecoveries: number;
    integrityFailures: number;
    saveSizeHistory: {
        tick: number;
        size: number;
        timestamp: string;
    }[];
}
/** マイグレーション定義 */
interface Migration {
    fromVersion: string;
    toVersion: string;
    migrate: (data: Record<string, any>) => Record<string, any>;
    description: string;
}
export declare class PersistenceV2 {
    private config;
    private modules;
    private lastSaveTick;
    private events;
    private stats;
    private moduleChecksums;
    private migrations;
    private walPath;
    private isTransactionActive;
    constructor(config?: Partial<PersistenceV2Config>, events?: EventBus);
    registerModule(name: string, module: {
        toJSON: () => object;
        fromJSON: (data: any) => void;
    }): void;
    save(tick: Tick, day: number): Promise<boolean>;
    load(): Promise<boolean>;
    /**
     * モジュール個別ファイルに保存
     */
    private saveModuleFile;
    /**
     * モジュール個別ファイルから復元
     */
    private loadFromModuleFiles;
    private walBegin;
    private walWriteModule;
    private walCommit;
    private walRollback;
    private appendWAL;
    private readWAL;
    private clearWAL;
    /**
     * WALからのクラッシュリカバリ
     */
    private recoverFromWAL;
    private rotateBackups;
    /**
     * バックアップからの復元
     */
    private loadFromBackup;
    private registerMigrations;
    addMigration(migration: Migration): void;
    private migrateData;
    private versionCompare;
    private compressData;
    private decompressData;
    private calculateChecksum;
    checkAutoSave(tick: Tick, day: number): boolean;
    saveModuleData(moduleName: string, data: any, filename: string): boolean;
    loadModuleData(moduleName: string, filename: string): any | null;
    /**
     * 全データをエクスポート用にまとめる
     */
    exportAll(): {
        manifest: SaveManifestV2;
        data: Record<string, any>;
    } | null;
    /**
     * エクスポートデータからインポート
     */
    importAll(exportData: {
        manifest: SaveManifestV2;
        data: Record<string, any>;
    }): boolean;
    private createEmptyStats;
    private updateSaveStats;
    getStats(): PersistenceStats;
    getStorageSize(): number;
    getStorageInfo(): {
        totalSize: number;
        formattedSize: string;
        moduleCount: number;
        backupCount: number;
        stats: PersistenceStats;
    };
    private formatBytes;
    private ensureDirectories;
    private generateId;
}
export {};
//# sourceMappingURL=PersistenceV2.d.ts.map