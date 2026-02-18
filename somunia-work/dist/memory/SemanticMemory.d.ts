/**
 * SemanticMemorySystem - 意味記憶システム
 *
 * somuniaが学んだ知識・概念を保存・管理する
 * Wikipediaや本から学んだ知識がここに蓄積される
 *
 * 設計原則:
 * - 概念間の関係をネットワークとして表現
 * - 理解度が深まると関連概念も強化される
 * - 興味度が高い概念は想起されやすい
 * - 使用頻度の低い知識は徐々に薄れる
 */
import { SemanticMemory, ConceptRelation, Normalized, Timestamp, Tick, ID } from '../types';
export interface SemanticMemoryConfig {
    maxConcepts: number;
    unusedDecayRate: number;
    useStrengthening: number;
    spreadingActivation: number;
    deletionThreshold: number;
    initialComprehension: number;
}
export interface KnowledgeSearchResult {
    knowledge: SemanticMemory;
    relevance: Normalized;
    matchType: 'exact' | 'partial' | 'related';
}
export interface LearningEvent {
    timestamp: Timestamp;
    conceptId: ID;
    type: 'learned' | 'deepened' | 'connected' | 'forgotten' | 'used';
    details: string;
}
export interface KnowledgeGraphNode {
    id: ID;
    label: string;
    size: number;
    color: string;
    category: string;
    metrics: {
        comprehension: number;
        interestLevel: number;
        useCount: number;
        connectionCount: number;
        age: number;
    };
}
export interface KnowledgeGraphEdge {
    source: ID;
    target: ID;
    relation: string;
    strength: number;
    label: string;
}
export interface KnowledgeCluster {
    name: string;
    nodeIds: ID[];
    size: number;
    cohesion: number;
    dominantSource: string;
    avgComprehension: number;
}
export interface KnowledgeGraphStats {
    totalNodes: number;
    totalEdges: number;
    totalClusters: number;
    avgDegree: number;
    density: number;
    hubNode: string | null;
    maxDegree: number;
    isolatedNodes: number;
}
export interface KnowledgeGraph {
    nodes: KnowledgeGraphNode[];
    edges: KnowledgeGraphEdge[];
    clusters: KnowledgeCluster[];
    stats: KnowledgeGraphStats;
    generatedAt: number;
}
export interface KnowledgeTimelineEntry {
    timestamp: number;
    conceptsLearned: number;
    topics: string[];
    avgComprehension: number;
    dominantSource: string;
    totalKnowledge: number;
}
export interface SemanticCompressionRecord {
    timestamp: number;
    conceptsBefore: number;
    conceptsAfter: number;
    conceptsRemoved: number;
    mergesPerformed: number;
    mergeDetails: Array<{
        from: string[];
        into: string;
    }>;
}
export interface SemanticCompressionResult {
    compressed: number;
    merged: number;
    before: number;
    after: number;
    details: SemanticCompressionRecord;
}
export declare class SemanticMemorySystem {
    private concepts;
    private config;
    private eventLog;
    private lastMaintenanceTick;
    private conceptNameIndex;
    private sourceIndex;
    constructor(config?: Partial<SemanticMemoryConfig>);
    /**
     * 初期知識を設定（somuniaの基礎知識）
     */
    private initializeBaseKnowledge;
    /**
     * 新しい知識を学習
     */
    learn(params: {
        concept: string;
        definition: string;
        source: 'wikipedia' | 'experience' | 'conversation' | 'book' | 'initial';
        relatedConcepts?: ConceptRelation[];
        interestLevel?: Normalized;
    }): SemanticMemory;
    /**
     * 既存の知識を深める
     */
    deepen(conceptId: ID, additionalInfo: string, newRelations?: ConceptRelation[]): SemanticMemory;
    /**
     * IDを生成
     */
    private generateId;
    /**
     * 関連概念との双方向リンクを確立
     */
    private establishRelations;
    /**
     * 関係タイプの逆を取得
     */
    private reverseRelationType;
    /**
     * 知識を使用（想起）
     */
    use(conceptId: ID): SemanticMemory | null;
    /**
     * 活性化の伝播（Spreading Activation）
     */
    private spreadActivation;
    /**
     * 概念名で検索
     */
    getByName(conceptName: string): SemanticMemory | null;
    /**
     * 自由検索
     */
    search(query: string, limit?: number): KnowledgeSearchResult[];
    /**
     * 関連概念を取得
     */
    getRelatedConcepts(conceptId: ID, limit?: number): SemanticMemory[];
    /**
     * ソース別に取得
     */
    getBySource(source: SemanticMemory['source'], limit?: number): SemanticMemory[];
    /**
     * 興味度の高い知識を取得
     */
    getMostInteresting(limit?: number): SemanticMemory[];
    /**
     * よく使う知識を取得
     */
    getMostUsed(limit?: number): SemanticMemory[];
    /**
     * ランダムな知識を取得（連想）
     */
    getRandomConcept(options?: {
        minInterest?: Normalized;
        preferSource?: SemanticMemory['source'];
    }): SemanticMemory | null;
    /**
     * 定期メンテナンス
     */
    performMaintenance(currentTick: Tick): void;
    /**
     * 知識を削除
     */
    private deleteKnowledge;
    /**
     * 容量制限を適用
     */
    private enforceCapacity;
    /**
     * イベントをログ
     */
    private logEvent;
    /**
     * 概念数を取得
     */
    getConceptCount(): number;
    /**
     * 統計を取得
     */
    getStats(): {
        totalConcepts: number;
        avgComprehension: Normalized;
        avgInterest: Normalized;
        sourceDistribution: Record<string, number>;
        mostConnected: string | null;
    };
    /**
     * 最近のイベントを取得
     */
    getRecentEvents(count?: number): LearningEvent[];
    /**
     * サマリーを取得
     */
    getSummary(): {
        totalKnowledge: number;
        recentlyLearned: string | null;
        strongestInterest: string | null;
    };
    /**
     * JSON形式でエクスポート
     */
    toJSON(): object;
    /**
     * JSONからリストア
     */
    static fromJSON(json: any): SemanticMemorySystem;
    /**
     * 知識グラフの完全な構造を出力
     * ノード（概念）とエッジ（関係）のネットワーク構造を生成
     */
    generateKnowledgeGraph(): KnowledgeGraph;
    /**
     * 特定の概念を中心としたサブグラフを取得
     */
    getSubgraph(conceptName: string, depth?: number): KnowledgeGraph | null;
    /**
     * 知識の成長ログ（タイムライン）
     */
    getKnowledgeTimeline(bucketSize?: number): KnowledgeTimelineEntry[];
    /**
     * 概念の既知トピックリストを取得
     */
    getKnownTopics(): string[];
    private calculateNodeSize;
    private getEmotionalColor;
    private relationToLabel;
    private detectClusters;
    private calculateClusterCohesion;
    private getDominantSource;
    private calculateGraphStats;
    private compressionLog;
    /**
     * 意味記憶の圧縮
     * 低使用・低理解の概念を統合・要約
     */
    compressKnowledge(): SemanticCompressionResult;
    getCompressionLog(): SemanticCompressionRecord[];
}
export default SemanticMemorySystem;
//# sourceMappingURL=SemanticMemory.d.ts.map