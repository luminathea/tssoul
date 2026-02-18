/**
 * AssociativeNetwork - Phase 7A: 連想ネットワーク
 *
 * somuniaの「連想する力」を実現するグラフ構造。
 * 概念、感情、体験、人物、場所、行動、創作物を
 * ノードとして保持し、エッジで有機的に接続する。
 *
 * 核心機能:
 * - 拡散活性化（Spreading Activation）: あるノードを活性化すると関連ノードも連鎖的に活性化
 * - Hebbian学習: 同時に活性化されるノード間の結合が強化される
 * - 減衰: 使われないエッジは徐々に弱くなる
 * - 自動カテゴリ形成: 類似パターンを持つノードがクラスタ化
 *
 * 結果として「月→夜→星→きれい→歌いたい」のような連想の連鎖が生まれる。
 */
import { AssocNode, AssocEdge, AssocNodeType, AssocRelation, EmotionType, Normalized, Tick, ID } from '../types';
export interface AssociativeNetworkConfig {
    maxNodes: number;
    maxEdgesPerNode: number;
    activationDecayRate: number;
    edgeDecayRate: number;
    spreadingActivationDepth: number;
    spreadingActivationFactor: number;
    hebbianLearningRate: number;
    minEdgeWeight: number;
    pruneThreshold: number;
}
export declare class AssociativeNetwork {
    private config;
    private nodes;
    private edges;
    private labelToId;
    private nodeEdgeIndex;
    private idCounter;
    constructor(config?: Partial<AssociativeNetworkConfig>);
    private initializeNetwork;
    addNode(type: AssocNodeType, label: string, emotionalColor?: EmotionType | null, meta?: Record<string, any>): AssocNode;
    getNodeByLabel(label: string): AssocNode | null;
    getNode(id: ID): AssocNode | null;
    /** ラベル名でノードを取得。なければ作成する */
    ensureNode(type: AssocNodeType, label: string, emotionalColor?: EmotionType | null, meta?: Record<string, any>): AssocNode;
    addEdge(fromId: ID, toId: ID, relation: AssocRelation, weight?: Normalized): AssocEdge | null;
    /** ラベル名で接続する */
    connect(fromLabel: string, toLabel: string, relation: AssocRelation, weight?: Normalized): AssocEdge | null;
    private findEdge;
    /**
     * ノードを活性化し、関連ノードに拡散させる
     * 「月」を活性化→「夜空」「切なさ」「星」も活性化される
     */
    activate(nodeId: ID, intensity?: Normalized, tick?: Tick): AssocNode[];
    /** ラベル名でアクティベート */
    activateByLabel(label: string, intensity?: Normalized, tick?: Tick): AssocNode[];
    /**
     * 複数のラベルを同時に活性化し、共通する連想を取得
     * 会話のトピックから関連概念を引き出すのに使う
     */
    activateMultiple(labels: string[], intensity?: Normalized, tick?: Tick): AssocNode[];
    private hebbianLearning;
    /** 定期的な減衰処理（メインループから呼ばれる） */
    tick(currentTick: Tick): void;
    /** 特定のラベルに関連するノードを取得（重み順） */
    getAssociations(label: string, limit?: number): Array<{
        node: AssocNode;
        weight: number;
    }>;
    /** 現在活性化しているノードを取得 */
    getActiveNodes(minActivation?: Normalized): AssocNode[];
    /** 感情に関連するノードを取得 */
    getEmotionalAssociations(emotion: EmotionType, limit?: number): AssocNode[];
    /** ネットワーク統計 */
    getStats(): {
        nodeCount: number;
        edgeCount: number;
        avgDegree: number;
        activeCount: number;
    };
    /**
     * 新しい体験を記録し、ネットワークに統合する
     */
    recordExperience(description: string, relatedConcepts: string[], emotion: EmotionType, tick: Tick): AssocNode;
    /**
     * 訪問者ノードを作成/更新
     */
    ensureVisitorNode(name: string | null, tick: Tick): AssocNode;
    /**
     * 創作物ノードを記録
     */
    recordCreation(title: string, type: string, emotion: EmotionType, tick: Tick): AssocNode;
    /**
     * 夢を記録
     */
    recordDream(description: string, emotion: EmotionType, tick: Tick): AssocNode;
    private getEmotionLabel;
    private pruneWeakNodes;
    private pruneWeakEdges;
    private rebuildEdgeIndex;
    toJSON(): any;
    fromJSON(data: any): void;
}
//# sourceMappingURL=AssociativeNetwork.d.ts.map