"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssociativeNetwork = void 0;
const DEFAULT_CONFIG = {
    maxNodes: 2000,
    maxEdgesPerNode: 30,
    activationDecayRate: 0.02,
    edgeDecayRate: 0.001,
    spreadingActivationDepth: 3,
    spreadingActivationFactor: 0.5,
    hebbianLearningRate: 0.05,
    minEdgeWeight: 0.01,
    pruneThreshold: 0.02,
};
// ============================================================
// 初期ノード（somuniaの基本的な世界）
// ============================================================
const INITIAL_NODES = [
    // 自分自身
    { type: 'person', label: 'わたし', emotionalColor: 'peace', meta: { isSelf: true } },
    // 基本概念
    { type: 'concept', label: '音楽', emotionalColor: 'joy', meta: {} },
    { type: 'concept', label: '歌', emotionalColor: 'warmth', meta: {} },
    { type: 'concept', label: '夜空', emotionalColor: 'wonder', meta: {} },
    { type: 'concept', label: '星', emotionalColor: 'wonder', meta: {} },
    { type: 'concept', label: '月', emotionalColor: 'nostalgia', meta: {} },
    { type: 'concept', label: '雨', emotionalColor: 'melancholy', meta: {} },
    { type: 'concept', label: '海', emotionalColor: 'serenity', meta: {} },
    { type: 'concept', label: '花', emotionalColor: 'warmth', meta: {} },
    { type: 'concept', label: '光', emotionalColor: 'wonder', meta: {} },
    { type: 'concept', label: '静けさ', emotionalColor: 'peace', meta: {} },
    { type: 'concept', label: '言葉', emotionalColor: 'curiosity', meta: {} },
    { type: 'concept', label: '記憶', emotionalColor: 'nostalgia', meta: {} },
    { type: 'concept', label: '夢', emotionalColor: 'wonder', meta: {} },
    { type: 'concept', label: '色', emotionalColor: 'curiosity', meta: {} },
    { type: 'concept', label: '時間', emotionalColor: 'melancholy', meta: {} },
    { type: 'concept', label: '詩', emotionalColor: 'peace', meta: {} },
    { type: 'concept', label: '本', emotionalColor: 'curiosity', meta: {} },
    { type: 'concept', label: 'メロディ', emotionalColor: 'joy', meta: {} },
    { type: 'concept', label: '沈黙', emotionalColor: 'peace', meta: {} },
    // 場所
    { type: 'place', label: 'わたしの部屋', emotionalColor: 'peace', meta: { isHome: true } },
    { type: 'place', label: '窓辺', emotionalColor: 'nostalgia', meta: {} },
    { type: 'place', label: '古いパソコンの前', emotionalColor: 'curiosity', meta: {} },
    // 行動
    { type: 'action', label: '歌うこと', emotionalColor: 'joy', meta: {} },
    { type: 'action', label: '本を読むこと', emotionalColor: 'curiosity', meta: {} },
    { type: 'action', label: '考えること', emotionalColor: 'peace', meta: {} },
    { type: 'action', label: '窓の外を見ること', emotionalColor: 'nostalgia', meta: {} },
    { type: 'action', label: '学ぶこと', emotionalColor: 'curiosity', meta: {} },
    // 感情ノード
    { type: 'emotion', label: '喜び', emotionalColor: 'joy', meta: {} },
    { type: 'emotion', label: '寂しさ', emotionalColor: 'loneliness', meta: {} },
    { type: 'emotion', label: '安らぎ', emotionalColor: 'peace', meta: {} },
    { type: 'emotion', label: '好奇心', emotionalColor: 'curiosity', meta: {} },
    { type: 'emotion', label: '温かさ', emotionalColor: 'warmth', meta: {} },
    { type: 'emotion', label: '切なさ', emotionalColor: 'melancholy', meta: {} },
    { type: 'emotion', label: '感動', emotionalColor: 'wonder', meta: {} },
    // 価値観
    { type: 'value', label: '静かに生きること', emotionalColor: 'peace', meta: {} },
    { type: 'value', label: '歌で伝えること', emotionalColor: 'warmth', meta: {} },
    { type: 'value', label: '知ること', emotionalColor: 'curiosity', meta: {} },
];
const INITIAL_EDGES = [
    { from: '音楽', to: '歌', relation: 'related_to', weight: 0.9 },
    { from: '歌', to: 'メロディ', relation: 'part_of', weight: 0.8 },
    { from: '音楽', to: 'メロディ', relation: 'part_of', weight: 0.8 },
    { from: '夜空', to: '星', relation: 'part_of', weight: 0.9 },
    { from: '夜空', to: '月', relation: 'part_of', weight: 0.8 },
    { from: '星', to: '光', relation: 'related_to', weight: 0.6 },
    { from: '歌', to: '言葉', relation: 'part_of', weight: 0.7 },
    { from: '詩', to: '言葉', relation: 'part_of', weight: 0.8 },
    { from: '歌', to: '詩', relation: 'related_to', weight: 0.7 },
    { from: '雨', to: '静けさ', relation: 'feels_like', weight: 0.6 },
    { from: '雨', to: '切なさ', relation: 'feels_like', weight: 0.5 },
    { from: '海', to: '静けさ', relation: 'feels_like', weight: 0.5 },
    { from: '花', to: '色', relation: 'related_to', weight: 0.5 },
    { from: '光', to: '色', relation: 'related_to', weight: 0.5 },
    { from: '記憶', to: '夢', relation: 'related_to', weight: 0.6 },
    { from: '記憶', to: '切なさ', relation: 'feels_like', weight: 0.4 },
    { from: '沈黙', to: '静けさ', relation: 'feels_like', weight: 0.8 },
    { from: '本', to: '言葉', relation: 'related_to', weight: 0.7 },
    { from: 'わたし', to: '歌うこと', relation: 'related_to', weight: 0.9 },
    { from: 'わたし', to: '考えること', relation: 'related_to', weight: 0.8 },
    { from: 'わたし', to: 'わたしの部屋', relation: 'related_to', weight: 0.9 },
    { from: '窓辺', to: '窓の外を見ること', relation: 'related_to', weight: 0.8 },
    { from: '古いパソコンの前', to: '学ぶこと', relation: 'related_to', weight: 0.7 },
    { from: '歌うこと', to: '喜び', relation: 'causes', weight: 0.7 },
    { from: '本を読むこと', to: '好奇心', relation: 'causes', weight: 0.7 },
    { from: '窓の外を見ること', to: '切なさ', relation: 'causes', weight: 0.4 },
    { from: '喜び', to: '温かさ', relation: 'related_to', weight: 0.6 },
    { from: '寂しさ', to: '温かさ', relation: 'contrasts', weight: 0.4 },
    { from: '安らぎ', to: '静けさ', relation: 'feels_like', weight: 0.7 },
    { from: '時間', to: '記憶', relation: 'related_to', weight: 0.6 },
    { from: '月', to: '切なさ', relation: 'feels_like', weight: 0.5 },
    { from: '夢', to: '感動', relation: 'feels_like', weight: 0.4 },
    { from: '歌で伝えること', to: '歌うこと', relation: 'related_to', weight: 0.9 },
    { from: '知ること', to: '学ぶこと', relation: 'related_to', weight: 0.9 },
    { from: '静かに生きること', to: '安らぎ', relation: 'related_to', weight: 0.8 },
];
// ============================================================
// AssociativeNetwork クラス
// ============================================================
class AssociativeNetwork {
    config;
    nodes = new Map();
    edges = [];
    labelToId = new Map();
    nodeEdgeIndex = new Map();
    idCounter = 0;
    constructor(config) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.initializeNetwork();
    }
    // ============================================================
    // 初期化
    // ============================================================
    initializeNetwork() {
        for (const nodeDef of INITIAL_NODES) {
            this.addNode(nodeDef.type, nodeDef.label, nodeDef.emotionalColor, nodeDef.meta);
        }
        for (const edgeDef of INITIAL_EDGES) {
            const fromId = this.labelToId.get(edgeDef.from);
            const toId = this.labelToId.get(edgeDef.to);
            if (fromId && toId) {
                this.addEdge(fromId, toId, edgeDef.relation, edgeDef.weight);
            }
        }
    }
    // ============================================================
    // ノード操作
    // ============================================================
    addNode(type, label, emotionalColor = null, meta = {}) {
        // 既存チェック
        const existingId = this.labelToId.get(label);
        if (existingId) {
            const existing = this.nodes.get(existingId);
            if (existing)
                return existing;
        }
        const id = `an_${this.idCounter++}`;
        const node = {
            id,
            type,
            label,
            activation: 0,
            lastActivated: 0,
            createdAt: 0,
            useCount: 0,
            emotionalColor,
            meta,
        };
        this.nodes.set(id, node);
        this.labelToId.set(label, id);
        this.nodeEdgeIndex.set(id, []);
        // ノード数制限
        if (this.nodes.size > this.config.maxNodes) {
            this.pruneWeakNodes();
        }
        return node;
    }
    getNodeByLabel(label) {
        const id = this.labelToId.get(label);
        return id ? this.nodes.get(id) || null : null;
    }
    getNode(id) {
        return this.nodes.get(id) || null;
    }
    /** ラベル名でノードを取得。なければ作成する */
    ensureNode(type, label, emotionalColor = null, meta = {}) {
        return this.getNodeByLabel(label) || this.addNode(type, label, emotionalColor, meta);
    }
    // ============================================================
    // エッジ操作
    // ============================================================
    addEdge(fromId, toId, relation, weight = 0.3) {
        if (!this.nodes.has(fromId) || !this.nodes.has(toId))
            return null;
        if (fromId === toId)
            return null;
        // 既存エッジチェック
        const existing = this.findEdge(fromId, toId);
        if (existing) {
            existing.weight = Math.min(1, existing.weight + weight * 0.3);
            existing.useCount++;
            return existing;
        }
        const edge = {
            fromId,
            toId,
            weight: Math.min(1, weight),
            relation,
            lastUsed: 0,
            useCount: 1,
        };
        this.edges.push(edge);
        this.nodeEdgeIndex.get(fromId)?.push(edge);
        this.nodeEdgeIndex.get(toId)?.push(edge);
        // エッジ数制限
        const fromEdges = this.nodeEdgeIndex.get(fromId);
        if (fromEdges && fromEdges.length > this.config.maxEdgesPerNode) {
            this.pruneWeakEdges(fromId);
        }
        return edge;
    }
    /** ラベル名で接続する */
    connect(fromLabel, toLabel, relation, weight = 0.3) {
        const fromId = this.labelToId.get(fromLabel);
        const toId = this.labelToId.get(toLabel);
        if (!fromId || !toId)
            return null;
        return this.addEdge(fromId, toId, relation, weight);
    }
    findEdge(fromId, toId) {
        return this.edges.find(e => (e.fromId === fromId && e.toId === toId) ||
            (e.fromId === toId && e.toId === fromId)) || null;
    }
    // ============================================================
    // 拡散活性化（Spreading Activation）
    // ============================================================
    /**
     * ノードを活性化し、関連ノードに拡散させる
     * 「月」を活性化→「夜空」「切なさ」「星」も活性化される
     */
    activate(nodeId, intensity = 0.8, tick = 0) {
        const node = this.nodes.get(nodeId);
        if (!node)
            return [];
        const activated = [];
        const visited = new Set();
        const queue = [
            { id: nodeId, depth: 0, energy: intensity },
        ];
        while (queue.length > 0) {
            const current = queue.shift();
            if (visited.has(current.id))
                continue;
            if (current.depth > this.config.spreadingActivationDepth)
                continue;
            if (current.energy < 0.05)
                continue;
            visited.add(current.id);
            const n = this.nodes.get(current.id);
            if (!n)
                continue;
            // ノードを活性化
            n.activation = Math.min(1, n.activation + current.energy);
            n.lastActivated = tick;
            n.useCount++;
            activated.push(n);
            // 隣接ノードに拡散
            const edges = this.nodeEdgeIndex.get(current.id) || [];
            for (const edge of edges) {
                const neighborId = edge.fromId === current.id ? edge.toId : edge.fromId;
                if (!visited.has(neighborId)) {
                    const spreadEnergy = current.energy * edge.weight * this.config.spreadingActivationFactor;
                    queue.push({
                        id: neighborId,
                        depth: current.depth + 1,
                        energy: spreadEnergy,
                    });
                    edge.lastUsed = tick;
                }
            }
        }
        // 活性度順にソート
        activated.sort((a, b) => b.activation - a.activation);
        return activated;
    }
    /** ラベル名でアクティベート */
    activateByLabel(label, intensity = 0.8, tick = 0) {
        const id = this.labelToId.get(label);
        if (!id)
            return [];
        return this.activate(id, intensity, tick);
    }
    /**
     * 複数のラベルを同時に活性化し、共通する連想を取得
     * 会話のトピックから関連概念を引き出すのに使う
     */
    activateMultiple(labels, intensity = 0.6, tick = 0) {
        const allActivated = new Map();
        for (const label of labels) {
            const activated = this.activateByLabel(label, intensity, tick);
            for (const node of activated) {
                if (allActivated.has(node.id)) {
                    // 複数源から活性化 → 強化
                    const existing = allActivated.get(node.id);
                    existing.activation = Math.min(1, existing.activation + node.activation * 0.3);
                }
                else {
                    allActivated.set(node.id, node);
                }
            }
        }
        // Hebbian学習: 同時に活性化されたノード間の結合を強化
        const activeNodes = Array.from(allActivated.values())
            .filter(n => n.activation > 0.3);
        this.hebbianLearning(activeNodes, tick);
        return Array.from(allActivated.values())
            .sort((a, b) => b.activation - a.activation);
    }
    // ============================================================
    // Hebbian学習（同時活性化による結合強化）
    // ============================================================
    hebbianLearning(activeNodes, tick) {
        for (let i = 0; i < activeNodes.length; i++) {
            for (let j = i + 1; j < Math.min(i + 5, activeNodes.length); j++) {
                const a = activeNodes[i];
                const b = activeNodes[j];
                const existingEdge = this.findEdge(a.id, b.id);
                if (existingEdge) {
                    // 既存エッジを強化
                    existingEdge.weight = Math.min(1, existingEdge.weight + this.config.hebbianLearningRate * a.activation * b.activation);
                    existingEdge.lastUsed = tick;
                    existingEdge.useCount++;
                }
                else if (a.activation > 0.5 && b.activation > 0.5) {
                    // 新しい連想の発見
                    this.addEdge(a.id, b.id, 'related_to', 0.1);
                }
            }
        }
    }
    // ============================================================
    // 減衰と整理
    // ============================================================
    /** 定期的な減衰処理（メインループから呼ばれる） */
    tick(currentTick) {
        // 活性度の減衰
        for (const node of this.nodes.values()) {
            if (node.activation > 0) {
                node.activation = Math.max(0, node.activation - this.config.activationDecayRate);
            }
        }
        // エッジの減衰（低頻度）
        if (currentTick % 100 === 0) {
            for (const edge of this.edges) {
                if (edge.weight > this.config.minEdgeWeight) {
                    edge.weight = Math.max(this.config.minEdgeWeight, edge.weight - this.config.edgeDecayRate);
                }
            }
            // 弱いエッジを除去
            this.edges = this.edges.filter(e => e.weight >= this.config.pruneThreshold);
            this.rebuildEdgeIndex();
        }
    }
    // ============================================================
    // 検索・問い合わせ
    // ============================================================
    /** 特定のラベルに関連するノードを取得（重み順） */
    getAssociations(label, limit = 10) {
        const id = this.labelToId.get(label);
        if (!id)
            return [];
        const edges = this.nodeEdgeIndex.get(id) || [];
        const results = [];
        for (const edge of edges) {
            const neighborId = edge.fromId === id ? edge.toId : edge.fromId;
            const neighbor = this.nodes.get(neighborId);
            if (neighbor) {
                results.push({ node: neighbor, weight: edge.weight });
            }
        }
        return results.sort((a, b) => b.weight - a.weight).slice(0, limit);
    }
    /** 現在活性化しているノードを取得 */
    getActiveNodes(minActivation = 0.1) {
        return Array.from(this.nodes.values())
            .filter(n => n.activation >= minActivation)
            .sort((a, b) => b.activation - a.activation);
    }
    /** 感情に関連するノードを取得 */
    getEmotionalAssociations(emotion, limit = 5) {
        return Array.from(this.nodes.values())
            .filter(n => n.emotionalColor === emotion)
            .sort((a, b) => b.useCount - a.useCount)
            .slice(0, limit);
    }
    /** ネットワーク統計 */
    getStats() {
        const activeCount = Array.from(this.nodes.values()).filter(n => n.activation > 0.1).length;
        return {
            nodeCount: this.nodes.size,
            edgeCount: this.edges.length,
            avgDegree: this.nodes.size > 0 ? this.edges.length * 2 / this.nodes.size : 0,
            activeCount,
        };
    }
    // ============================================================
    // 体験からの学習
    // ============================================================
    /**
     * 新しい体験を記録し、ネットワークに統合する
     */
    recordExperience(description, relatedConcepts, emotion, tick) {
        // 体験ノードを作成
        const expNode = this.addNode('experience', description, emotion, {
            recordedAt: tick,
        });
        // 関連概念と接続
        for (const concept of relatedConcepts) {
            const conceptNode = this.ensureNode('concept', concept);
            this.addEdge(expNode.id, conceptNode.id, 'related_to', 0.5);
        }
        // 感情ノードと接続
        const emotionLabel = this.getEmotionLabel(emotion);
        const emotionNode = this.getNodeByLabel(emotionLabel);
        if (emotionNode) {
            this.addEdge(expNode.id, emotionNode.id, 'feels_like', 0.6);
        }
        // 活性化
        this.activate(expNode.id, 0.5, tick);
        return expNode;
    }
    /**
     * 訪問者ノードを作成/更新
     */
    ensureVisitorNode(name, tick) {
        const label = name ? `訪問者: ${name}` : '訪問者';
        const existing = this.getNodeByLabel(label);
        if (existing) {
            existing.lastActivated = tick;
            existing.useCount++;
            return existing;
        }
        return this.addNode('person', label, 'warmth', { isVisitor: true, name });
    }
    /**
     * 創作物ノードを記録
     */
    recordCreation(title, type, emotion, tick) {
        const node = this.addNode('creation', `${type}「${title}」`, emotion, { type, title });
        // 自分と接続
        const selfNode = this.getNodeByLabel('わたし');
        if (selfNode) {
            this.addEdge(selfNode.id, node.id, 'created_during', 0.7);
        }
        return node;
    }
    /**
     * 夢を記録
     */
    recordDream(description, emotion, tick) {
        const node = this.addNode('dream', description, emotion, { tick });
        const dreamConcept = this.getNodeByLabel('夢');
        if (dreamConcept) {
            this.addEdge(node.id, dreamConcept.id, 'part_of', 0.5);
        }
        return node;
    }
    // ============================================================
    // ユーティリティ
    // ============================================================
    getEmotionLabel(emotion) {
        const map = {
            joy: '喜び', sadness: '切なさ', peace: '安らぎ',
            curiosity: '好奇心', warmth: '温かさ', melancholy: '切なさ',
            wonder: '感動', loneliness: '寂しさ', nostalgia: '切なさ',
            serenity: '安らぎ', longing: '憧れ',
        };
        return map[emotion] || '感動';
    }
    pruneWeakNodes() {
        const sorted = Array.from(this.nodes.values())
            .sort((a, b) => (a.useCount + a.activation * 10) - (b.useCount + b.activation * 10));
        const toRemove = sorted.slice(0, Math.floor(sorted.length * 0.1));
        for (const node of toRemove) {
            // 初期ノードは削除しない
            if (node.meta.isSelf || node.meta.isHome)
                continue;
            this.nodes.delete(node.id);
            this.labelToId.delete(node.label);
            this.edges = this.edges.filter(e => e.fromId !== node.id && e.toId !== node.id);
        }
        this.rebuildEdgeIndex();
    }
    pruneWeakEdges(nodeId) {
        const edges = this.nodeEdgeIndex.get(nodeId) || [];
        edges.sort((a, b) => a.weight - b.weight);
        const toRemove = edges.slice(0, Math.ceil(edges.length * 0.2));
        const removeSet = new Set(toRemove);
        this.edges = this.edges.filter(e => !removeSet.has(e));
        this.rebuildEdgeIndex();
    }
    rebuildEdgeIndex() {
        this.nodeEdgeIndex.clear();
        for (const id of this.nodes.keys()) {
            this.nodeEdgeIndex.set(id, []);
        }
        for (const edge of this.edges) {
            this.nodeEdgeIndex.get(edge.fromId)?.push(edge);
            this.nodeEdgeIndex.get(edge.toId)?.push(edge);
        }
    }
    // ============================================================
    // 永続化
    // ============================================================
    toJSON() {
        return {
            nodes: Array.from(this.nodes.values()),
            edges: this.edges,
            idCounter: this.idCounter,
        };
    }
    fromJSON(data) {
        if (!data)
            return;
        this.nodes.clear();
        this.labelToId.clear();
        this.edges = [];
        this.nodeEdgeIndex.clear();
        if (data.nodes) {
            for (const n of data.nodes) {
                this.nodes.set(n.id, n);
                this.labelToId.set(n.label, n.id);
                this.nodeEdgeIndex.set(n.id, []);
            }
        }
        if (data.edges) {
            this.edges = data.edges;
            this.rebuildEdgeIndex();
        }
        if (data.idCounter)
            this.idCounter = data.idCounter;
    }
}
exports.AssociativeNetwork = AssociativeNetwork;
//# sourceMappingURL=AssociativeNetwork.js.map