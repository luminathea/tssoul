/**
 * PersistenceSystem - somunia v10 永続化システム
 *
 * somuniaの全状態をディスクに保存・復元する。
 * 自動保存、手動保存、バックアップローテーション。
 * データは100GBになっても構わないという設計思想。
 */
import { EventBus } from '../core/EventBus';
import { Tick } from '../types';
export interface PersistenceConfig {
    /** データ保存先ディレクトリ */
    dataDir: string;
    /** 自動保存間隔（ティック） */
    autoSaveInterval: number;
    /** バックアップ数 */
    maxBackups: number;
    /** 圧縮するか */
    compress: boolean;
}
export declare class PersistenceSystem {
    private config;
    private modules;
    private lastSaveTick;
    private events;
    constructor(config?: Partial<PersistenceConfig>, events?: EventBus);
    /**
     * 保存対象のモジュールを登録
     */
    registerModule(name: string, module: {
        toJSON: () => object;
        fromJSON: (data: any) => void;
    }): void;
    /**
     * 全状態を保存
     */
    save(tick: Tick, day: number): Promise<boolean>;
    /**
     * 状態を復元
     */
    load(): Promise<boolean>;
    /**
     * 自動保存チェック
     */
    checkAutoSave(tick: Tick, day: number): boolean;
    /**
     * 特定モジュールのデータを個別に保存
     */
    saveModuleData(moduleName: string, data: any, filename: string): boolean;
    /**
     * 特定モジュールのデータを読み込み
     */
    loadModuleData(moduleName: string, filename: string): any | null;
    /**
     * バックアップローテーション
     */
    private rotateBackups;
    /**
     * ディレクトリの確保
     */
    private ensureDirectories;
    /**
     * ストレージ使用量を取得
     */
    getStorageSize(): number;
}
//# sourceMappingURL=PersistenceSystem.d.ts.map