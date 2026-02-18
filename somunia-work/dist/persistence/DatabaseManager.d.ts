/**
 * DatabaseManager - Phase 8 Pre: SQLiteデータベース管理
 *
 * somuniaの全データをSQLiteで永続化する基盤。
 *
 * 設計方針:
 * - 頻繁に検索・成長するデータ → 正規化テーブル（ノード、記憶、会話）
 * - モジュール全体として読み書きするデータ → JSON BLOBテーブル
 * - 既存のJSON永続化からのマイグレーション対応
 * - WAL mode + PRAGMA最適化で高速化
 *
 * テーブル分類:
 * [正規化] assoc_nodes, assoc_edges, episodic_memories, semantic_memories,
 *          procedural_memories, concept_relations, visitors, visitor_facts,
 *          visitor_topics, visitor_emotions, visitor_special_memories,
 *          conversations, messages, visit_records, response_patterns,
 *          pattern_situations, diary_entries, diary_events, creative_works,
 *          dreams, dream_fragments, learning_sessions, self_modifications,
 *          habits, emotion_history
 *
 * [BLOB]   module_states（残りのモジュール全て）
 */
import Database from 'better-sqlite3';
export interface DatabaseConfig {
    /** データベースファイルのパス */
    dbPath: string;
    /** WAL modeを使用するか */
    walMode: boolean;
    /** 詳細ログ */
    verbose: boolean;
    /** バックアップ世代数 */
    maxBackups: number;
}
export declare class DatabaseManager {
    private db;
    private config;
    private initialized;
    constructor(config?: Partial<DatabaseConfig>);
    private configurePragmas;
    private initializeSchema;
    private getCurrentSchemaVersion;
    private getSchemas;
    transaction<T>(fn: () => T): T;
    run(sql: string, ...params: any[]): Database.RunResult;
    get<T = any>(sql: string, ...params: any[]): T | undefined;
    all<T = any>(sql: string, ...params: any[]): T[];
    /** ノードを追加または更新 */
    upsertNode(node: {
        id: string;
        type: string;
        label: string;
        activation?: number;
        lastActivated?: number;
        createdAt?: number;
        useCount?: number;
        emotionalColor?: string | null;
        meta?: Record<string, any>;
    }): void;
    /** エッジを追加または更新 */
    upsertEdge(edge: {
        fromId: string;
        toId: string;
        weight: number;
        relation: string;
        lastUsed?: number;
        useCount?: number;
    }): void;
    /** ノードIDで隣接ノードを取得 */
    getAdjacentNodes(nodeId: string, minWeight?: number): Array<{
        node_id: string;
        label: string;
        type: string;
        weight: number;
        relation: string;
        activation: number;
        emotional_color: string | null;
    }>;
    /** ラベルでノード検索 */
    findNodeByLabel(label: string): any | undefined;
    /** タイプでノード一覧取得 */
    getNodesByType(type: string): any[];
    /** 活性度上位のノードを取得 */
    getActiveNodes(limit?: number): any[];
    /** 全ノード数 */
    getNodeCount(): number;
    /** 全エッジ数 */
    getEdgeCount(): number;
    saveEpisodicMemory(memory: {
        id: string;
        content: string;
        summary?: string;
        timestamp: number;
        duration?: number;
        emotionalTags?: string[];
        emotionalIntensity?: number;
        importance?: number;
        relatedMemories?: string[];
        relatedConcepts?: string[];
        recallCount?: number;
        lastRecalled?: number | null;
        retentionStrength?: number;
    }): void;
    /** 重要度順にエピソード記憶を取得 */
    getEpisodicMemories(limit?: number, minImportance?: number): any[];
    /** テキスト検索でエピソード記憶を検索 */
    searchEpisodicMemories(query: string, limit?: number): any[];
    saveSemanticMemory(memory: {
        id: string;
        concept: string;
        definition?: string;
        source?: string;
        learnedAt?: number;
        comprehension?: number;
        interestLevel?: number;
        useCount?: number;
        lastUsed?: number | null;
        relations?: Array<{
            concept: string;
            relationType: string;
            strength: number;
        }>;
    }): void;
    /** 概念検索 */
    searchConcepts(query: string, limit?: number): any[];
    saveVisitor(visitor: {
        id: string;
        name?: string | null;
        nickname?: string | null;
        callName?: string | null;
        firstVisitAt: number;
        lastVisitAt: number;
        visitCount?: number;
        communicationStyle?: any;
        isCurrent?: boolean;
    }): void;
    /** 訪問者のfactを追加 */
    addVisitorFact(visitorId: string, fact: {
        category: string;
        content: string;
        confidence?: number;
        learnedAt: number;
        source?: string;
    }): void;
    /** 現在の訪問者を取得 */
    getCurrentVisitor(): any | undefined;
    /** 訪問者のfactを全取得 */
    getVisitorFacts(visitorId: string): any[];
    saveConversation(conv: {
        id: string;
        visitorId?: string | null;
        startedAt: number;
        endedAt?: number | null;
        mood?: string;
        topics?: string[];
        messageCount?: number;
        avgSatisfaction?: number;
        summary?: string | null;
    }): void;
    saveMessage(msg: {
        id: string;
        conversationId: string;
        speaker: string;
        content: string;
        timestamp: number;
        emotionalContext?: string | null;
        thoughtBefore?: string | null;
        emotionDuring?: string | null;
        satisfactionAfter?: number | null;
    }): void;
    /** 会話内のメッセージを取得 */
    getConversationMessages(conversationId: string): any[];
    /** メッセージ全文検索 */
    searchMessages(query: string, limit?: number): any[];
    /** 最近の会話を取得 */
    getRecentConversations(limit?: number): any[];
    saveResponsePattern(pattern: {
        id: string;
        template: string;
        successCount?: number;
        useCount?: number;
        avgSatisfaction?: number;
        lastUsed?: number;
        origin?: string;
        emotionTags?: string[];
        situation?: {
            intents?: string[];
            emotions?: string[];
            depths?: string[];
            timeOfDay?: string[];
            relationshipPhases?: string[];
            keywords?: string[];
        };
    }): void;
    /** 全パターンを取得 */
    getAllPatterns(): any[];
    saveDiaryEntry(entry: {
        id: string;
        date: string;
        content: string;
        mood?: string;
        moodIntensity?: number;
        weather?: string | null;
        dayNumber?: number;
        createdAt: number;
        events?: Array<{
            time: string;
            description: string;
            significance?: number;
            emotion?: string | null;
        }>;
    }): void;
    saveCreativeWork(work: {
        id: string;
        type: string;
        title?: string;
        content: string;
        createdAt: number;
        emotionAtCreation?: string | null;
        inspiration?: string | null;
        qualitySelfRating?: number | null;
        tags?: string[];
    }): void;
    recordEmotionSnapshot(snapshot: {
        tick: number;
        dominantEmotion: string;
        valence: number;
        arousal: number;
        emotionVector: Record<string, number>;
        trigger?: string | null;
    }): void;
    /** 最近の感情推移 */
    getEmotionHistory(limit?: number): any[];
    saveModuleState(moduleName: string, state: any): void;
    loadModuleState(moduleName: string): any | null;
    /** 全モジュール状態のリストを取得 */
    listModuleStates(): Array<{
        module_name: string;
        size_bytes: number;
        updated_at: string;
    }>;
    setSystemState(key: string, value: any): void;
    getSystemState(key: string): any | null;
    saveProceduralMemory(memory: {
        id: string;
        skill: string;
        steps?: string[];
        proficiency?: number;
        practiceCount?: number;
        lastExecuted?: number | null;
        automatization?: number;
    }): void;
    saveHabit(habit: {
        id: string;
        name: string;
        description?: string;
        triggerType?: string;
        triggerCondition?: any;
        actions?: string[];
        frequency?: number;
        strength?: number;
        lastExecuted?: number | null;
        executionCount?: number;
        satisfactionAvg?: number;
        active?: boolean;
    }): void;
    saveDream(dream: {
        id: string;
        phase: string;
        content?: string;
        themes?: string[];
        emotionalTone?: string | null;
        vividness?: number;
        startedAt: number;
        endedAt?: number | null;
        memoriesConsolidated?: number;
        fragments?: Array<{
            content: string;
            type?: string;
            emotion?: string | null;
            sourceMemoryId?: string | null;
        }>;
    }): void;
    saveLearningSession(session: {
        id: string;
        topic: string;
        source?: string;
        contentSummary?: string;
        learnedAt: number;
        comprehension?: number;
        interestLevel?: number;
        conceptsLearned?: string[];
        relatedSearches?: string[];
    }): void;
    saveSelfModification(mod: {
        id: string;
        type: string;
        beforeState?: string;
        afterState?: string;
        reason?: string;
        trigger?: string;
        impact?: number;
        timestamp: number;
        reverted?: boolean;
    }): void;
    getStats(): {
        nodeCount: number;
        edgeCount: number;
        episodicCount: number;
        semanticCount: number;
        proceduralCount: number;
        visitorCount: number;
        conversationCount: number;
        messageCount: number;
        patternCount: number;
        diaryCount: number;
        creativeCount: number;
        dreamCount: number;
        dbSizeBytes: number;
    };
    backup(): string | null;
    private simpleHash;
    /** データベースの最適化 */
    optimize(): void;
    /** データベースの整合性チェック */
    integrityCheck(): boolean;
    /** データベースを閉じる */
    close(): void;
    /** 生データベースアクセス（上級者向け） */
    getDatabase(): Database.Database;
    isInitialized(): boolean;
}
//# sourceMappingURL=DatabaseManager.d.ts.map