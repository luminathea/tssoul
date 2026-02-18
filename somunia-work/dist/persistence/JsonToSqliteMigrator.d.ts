/**
 * JsonToSqliteMigrator - Phase 8 Pre: JSONからSQLiteへの移行
 *
 * 既存のstate.json（PersistenceV2が出力したもの）を読み込み、
 * SQLiteデータベースに全データを移行する。
 *
 * 移行対象:
 * - 連想ネットワーク（assoc_nodes, assoc_edges）
 * - エピソード記憶
 * - 意味記憶 + 概念関係
 * - 手続き記憶
 * - 訪問者プロフィール + 関連データ
 * - 会話 + メッセージ
 * - 応答パターン
 * - 日記
 * - 創作物
 * - 夢
 * - 学習セッション
 * - 習慣
 * - その他（モジュール状態としてBLOB保存）
 */
import { DatabaseManager } from './DatabaseManager';
export declare class JsonToSqliteMigrator {
    private db;
    private stats;
    constructor(db: DatabaseManager);
    /**
     * state.jsonファイルからマイグレーション実行
     */
    migrate(stateJsonPath: string): typeof this.stats;
    private migrateAssociativeNetwork;
    private migrateEpisodicMemory;
    private migrateSemanticMemory;
    private migrateProceduralMemory;
    private migrateVisitorMemory;
    private migrateConversationEngine;
    private migratePatternMemory;
    private migrateDiary;
    private migrateCreativeEngine;
    private migrateDreamPhase;
    private migrateHabits;
    private migrateLearnEngine;
    private migrateBlobModules;
    private generateId;
    getStats(): typeof this.stats;
}
//# sourceMappingURL=JsonToSqliteMigrator.d.ts.map