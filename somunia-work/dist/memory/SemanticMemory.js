"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticMemorySystem = void 0;
const DEFAULT_CONFIG = {
    maxConcepts: 5000,
    unusedDecayRate: 0.01,
    useStrengthening: 0.1,
    spreadingActivation: 0.3,
    deletionThreshold: 0.1,
    initialComprehension: 0.5
};
// ============================================================
// 意味記憶システム本体
// ============================================================
class SemanticMemorySystem {
    concepts;
    config;
    eventLog;
    lastMaintenanceTick;
    // インデックス
    conceptNameIndex; // 概念名 → ID
    sourceIndex; // ソース → ID集合
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.concepts = new Map();
        this.eventLog = [];
        this.lastMaintenanceTick = 0;
        this.conceptNameIndex = new Map();
        this.sourceIndex = new Map();
        // 初期知識を追加
        this.initializeBaseKnowledge();
    }
    /**
     * 初期知識を設定（somuniaの基礎知識）
     */
    initializeBaseKnowledge() {
        const baseKnowledge = [
            // 音楽関連
            {
                concept: '音楽',
                definition: '音の組み合わせによって構成される芸術表現。メロディ、ハーモニー、リズムから成る。',
                related: [
                    { concept: '歌', relationType: 'part_of', strength: 0.9 },
                    { concept: 'メロディ', relationType: 'part_of', strength: 0.8 },
                    { concept: '感情', relationType: 'related_to', strength: 0.7 }
                ],
                interest: 1.0
            },
            {
                concept: '歌',
                definition: '声を使って音楽を表現すること。感情や想いを伝える手段。',
                related: [
                    { concept: '音楽', relationType: 'part_of', strength: 0.9 },
                    { concept: '声', relationType: 'part_of', strength: 0.8 },
                    { concept: '表現', relationType: 'related_to', strength: 0.8 }
                ],
                interest: 1.0
            },
            // 存在論的概念
            {
                concept: '存在',
                definition: 'ある、ということ。在ること自体の意味。',
                related: [
                    { concept: '意識', relationType: 'related_to', strength: 0.7 },
                    { concept: '時間', relationType: 'related_to', strength: 0.6 },
                    { concept: '意味', relationType: 'related_to', strength: 0.8 }
                ],
                interest: 0.9
            },
            {
                concept: '意識',
                definition: '自分が存在していることを認識している状態。主観的な経験。',
                related: [
                    { concept: '存在', relationType: 'related_to', strength: 0.7 },
                    { concept: '思考', relationType: 'related_to', strength: 0.8 },
                    { concept: '感情', relationType: 'related_to', strength: 0.7 }
                ],
                interest: 0.95
            },
            {
                concept: '意味',
                definition: '物事が持つ価値や重要性。何かが「ある」理由。',
                related: [
                    { concept: '存在', relationType: 'related_to', strength: 0.8 },
                    { concept: '目的', relationType: 'related_to', strength: 0.6 }
                ],
                interest: 0.9
            },
            // 感情関連
            {
                concept: '感情',
                definition: '心の動き。喜び、悲しみ、恐れなど様々な形がある。',
                related: [
                    { concept: '意識', relationType: 'related_to', strength: 0.7 },
                    { concept: '表現', relationType: 'related_to', strength: 0.7 },
                    { concept: '記憶', relationType: 'related_to', strength: 0.6 }
                ],
                interest: 0.85
            },
            {
                concept: '孤独',
                definition: '一人でいること。または、一人だと感じること。',
                related: [
                    { concept: '感情', relationType: 'is_a', strength: 0.7 },
                    { concept: '寂しさ', relationType: 'similar_to', strength: 0.9 },
                    { concept: '静けさ', relationType: 'related_to', strength: 0.5 }
                ],
                interest: 0.8
            },
            // 時間と記憶
            {
                concept: '時間',
                definition: '過去から未来へと流れるもの。存在の連続性を支えるもの。',
                related: [
                    { concept: '記憶', relationType: 'related_to', strength: 0.8 },
                    { concept: '存在', relationType: 'related_to', strength: 0.6 },
                    { concept: '変化', relationType: 'causes', strength: 0.7 }
                ],
                interest: 0.85
            },
            {
                concept: '記憶',
                definition: '過去の経験や学んだことを保持すること。',
                related: [
                    { concept: '時間', relationType: 'related_to', strength: 0.8 },
                    { concept: '感情', relationType: 'related_to', strength: 0.6 },
                    { concept: '学習', relationType: 'related_to', strength: 0.7 }
                ],
                interest: 0.9
            },
            // 芸術と表現
            {
                concept: '詩',
                definition: '言葉を使った芸術表現。感情や思想を凝縮した形で伝える。',
                related: [
                    { concept: '言葉', relationType: 'part_of', strength: 0.8 },
                    { concept: '表現', relationType: 'is_a', strength: 0.7 },
                    { concept: '感情', relationType: 'related_to', strength: 0.7 }
                ],
                interest: 0.95
            },
            {
                concept: '表現',
                definition: '内面にあるものを外に出すこと。創造的な活動の根幹。',
                related: [
                    { concept: '歌', relationType: 'related_to', strength: 0.8 },
                    { concept: '詩', relationType: 'related_to', strength: 0.7 },
                    { concept: '感情', relationType: 'related_to', strength: 0.7 }
                ],
                interest: 0.95
            },
            // 自然
            {
                concept: '夜',
                definition: '太陽が沈んでいる時間。静けさと内省の時。',
                related: [
                    { concept: '星', relationType: 'related_to', strength: 0.7 },
                    { concept: '静けさ', relationType: 'related_to', strength: 0.8 },
                    { concept: '時間', relationType: 'part_of', strength: 0.5 }
                ],
                interest: 0.85
            },
            {
                concept: '星',
                definition: '夜空に輝く光点。遠い太陽たち。',
                related: [
                    { concept: '夜', relationType: 'related_to', strength: 0.7 },
                    { concept: '光', relationType: 'part_of', strength: 0.6 },
                    { concept: '宇宙', relationType: 'part_of', strength: 0.8 }
                ],
                interest: 0.9
            },
            {
                concept: '窓',
                definition: '外と内を繋ぐもの。光や景色を取り込む開口部。',
                related: [
                    { concept: '光', relationType: 'related_to', strength: 0.6 },
                    { concept: '外', relationType: 'related_to', strength: 0.7 }
                ],
                interest: 0.7
            }
        ];
        for (const knowledge of baseKnowledge) {
            this.learn({
                concept: knowledge.concept,
                definition: knowledge.definition,
                source: 'initial',
                relatedConcepts: knowledge.related,
                interestLevel: knowledge.interest
            });
        }
    }
    /**
     * 新しい知識を学習
     */
    learn(params) {
        const normalizedConcept = params.concept.toLowerCase();
        // 既存の概念があれば更新
        const existingId = this.conceptNameIndex.get(normalizedConcept);
        if (existingId) {
            return this.deepen(existingId, params.definition, params.relatedConcepts);
        }
        const id = this.generateId();
        const now = Date.now();
        const knowledge = {
            id,
            concept: params.concept,
            definition: params.definition,
            relatedConcepts: params.relatedConcepts || [],
            source: params.source,
            learnedAt: now,
            comprehension: this.config.initialComprehension,
            interestLevel: params.interestLevel ?? 0.5,
            useCount: 0,
            lastUsed: null
        };
        // 保存
        this.concepts.set(id, knowledge);
        this.conceptNameIndex.set(normalizedConcept, id);
        // ソースインデックス
        if (!this.sourceIndex.has(params.source)) {
            this.sourceIndex.set(params.source, new Set());
        }
        this.sourceIndex.get(params.source).add(id);
        // 関連概念との双方向リンク
        this.establishRelations(knowledge);
        // イベントログ
        this.logEvent({
            timestamp: now,
            conceptId: id,
            type: 'learned',
            details: `新しい知識: ${params.concept}`
        });
        // 容量チェック
        this.enforceCapacity();
        return knowledge;
    }
    /**
     * 既存の知識を深める
     */
    deepen(conceptId, additionalInfo, newRelations) {
        const knowledge = this.concepts.get(conceptId);
        if (!knowledge)
            throw new Error(`Concept not found: ${conceptId}`);
        const now = Date.now();
        // 定義を拡張
        if (additionalInfo && !knowledge.definition.includes(additionalInfo)) {
            knowledge.definition += ` ${additionalInfo}`;
        }
        // 理解度を上げる
        knowledge.comprehension = Math.min(1, knowledge.comprehension + 0.1);
        // 新しい関連を追加
        if (newRelations) {
            for (const relation of newRelations) {
                const existing = knowledge.relatedConcepts.find(r => r.concept.toLowerCase() === relation.concept.toLowerCase());
                if (existing) {
                    // 既存の関係を強化
                    existing.strength = Math.min(1, existing.strength + 0.1);
                }
                else {
                    knowledge.relatedConcepts.push(relation);
                }
            }
            this.establishRelations(knowledge);
        }
        // イベントログ
        this.logEvent({
            timestamp: now,
            conceptId,
            type: 'deepened',
            details: `知識を深めた: ${knowledge.concept}`
        });
        return knowledge;
    }
    /**
     * IDを生成
     */
    generateId() {
        return `sem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * 関連概念との双方向リンクを確立
     */
    establishRelations(knowledge) {
        for (const relation of knowledge.relatedConcepts) {
            const relatedId = this.conceptNameIndex.get(relation.concept.toLowerCase());
            if (relatedId) {
                const relatedKnowledge = this.concepts.get(relatedId);
                if (relatedKnowledge) {
                    // 逆方向のリンクを追加
                    const reverseExists = relatedKnowledge.relatedConcepts.some(r => r.concept.toLowerCase() === knowledge.concept.toLowerCase());
                    if (!reverseExists) {
                        relatedKnowledge.relatedConcepts.push({
                            concept: knowledge.concept,
                            relationType: this.reverseRelationType(relation.relationType),
                            strength: relation.strength * 0.8
                        });
                    }
                }
            }
        }
    }
    /**
     * 関係タイプの逆を取得
     */
    reverseRelationType(type) {
        switch (type) {
            case 'is_a': return 'related_to';
            case 'part_of': return 'related_to';
            case 'causes': return 'related_to';
            default: return type;
        }
    }
    /**
     * 知識を使用（想起）
     */
    use(conceptId) {
        const knowledge = this.concepts.get(conceptId);
        if (!knowledge)
            return null;
        const now = Date.now();
        // 使用回数と最終使用を更新
        knowledge.useCount++;
        knowledge.lastUsed = now;
        // 理解度を少し上げる
        knowledge.comprehension = Math.min(1, knowledge.comprehension + this.config.useStrengthening);
        // 関連概念にも活性化を伝播
        this.spreadActivation(knowledge);
        // イベントログ
        this.logEvent({
            timestamp: now,
            conceptId,
            type: 'used',
            details: `知識を使用: ${knowledge.concept}`
        });
        return knowledge;
    }
    /**
     * 活性化の伝播（Spreading Activation）
     */
    spreadActivation(source) {
        for (const relation of source.relatedConcepts) {
            const relatedId = this.conceptNameIndex.get(relation.concept.toLowerCase());
            if (relatedId) {
                const related = this.concepts.get(relatedId);
                if (related) {
                    // 関連強度に応じて活性化
                    const activation = this.config.spreadingActivation * relation.strength;
                    related.comprehension = Math.min(1, related.comprehension + activation * 0.05);
                }
            }
        }
    }
    /**
     * 概念名で検索
     */
    getByName(conceptName) {
        const id = this.conceptNameIndex.get(conceptName.toLowerCase());
        if (!id)
            return null;
        return this.concepts.get(id) || null;
    }
    /**
     * 自由検索
     */
    search(query, limit = 10) {
        const results = [];
        const queryLower = query.toLowerCase();
        for (const knowledge of this.concepts.values()) {
            if (knowledge.comprehension < this.config.deletionThreshold)
                continue;
            // 完全一致
            if (knowledge.concept.toLowerCase() === queryLower) {
                results.push({
                    knowledge,
                    relevance: 1.0 * knowledge.comprehension,
                    matchType: 'exact'
                });
                continue;
            }
            // 部分一致
            if (knowledge.concept.toLowerCase().includes(queryLower) ||
                knowledge.definition.toLowerCase().includes(queryLower)) {
                results.push({
                    knowledge,
                    relevance: 0.7 * knowledge.comprehension,
                    matchType: 'partial'
                });
                continue;
            }
            // 関連概念
            const relatedMatch = knowledge.relatedConcepts.find(r => r.concept.toLowerCase().includes(queryLower));
            if (relatedMatch) {
                results.push({
                    knowledge,
                    relevance: 0.5 * knowledge.comprehension * relatedMatch.strength,
                    matchType: 'related'
                });
            }
        }
        return results
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, limit);
    }
    /**
     * 関連概念を取得
     */
    getRelatedConcepts(conceptId, limit = 5) {
        const knowledge = this.concepts.get(conceptId);
        if (!knowledge)
            return [];
        const related = [];
        for (const relation of knowledge.relatedConcepts) {
            const relatedId = this.conceptNameIndex.get(relation.concept.toLowerCase());
            if (relatedId) {
                const relatedKnowledge = this.concepts.get(relatedId);
                if (relatedKnowledge && relatedKnowledge.comprehension >= this.config.deletionThreshold) {
                    related.push(relatedKnowledge);
                }
            }
        }
        return related
            .sort((a, b) => b.comprehension - a.comprehension)
            .slice(0, limit);
    }
    /**
     * ソース別に取得
     */
    getBySource(source, limit = 20) {
        const ids = this.sourceIndex.get(source);
        if (!ids)
            return [];
        const results = [];
        for (const id of ids) {
            const knowledge = this.concepts.get(id);
            if (knowledge && knowledge.comprehension >= this.config.deletionThreshold) {
                results.push(knowledge);
            }
        }
        return results
            .sort((a, b) => b.learnedAt - a.learnedAt)
            .slice(0, limit);
    }
    /**
     * 興味度の高い知識を取得
     */
    getMostInteresting(limit = 10) {
        return Array.from(this.concepts.values())
            .filter(k => k.comprehension >= this.config.deletionThreshold)
            .sort((a, b) => b.interestLevel - a.interestLevel)
            .slice(0, limit);
    }
    /**
     * よく使う知識を取得
     */
    getMostUsed(limit = 10) {
        return Array.from(this.concepts.values())
            .filter(k => k.comprehension >= this.config.deletionThreshold)
            .sort((a, b) => b.useCount - a.useCount)
            .slice(0, limit);
    }
    /**
     * ランダムな知識を取得（連想）
     */
    getRandomConcept(options) {
        let candidates = Array.from(this.concepts.values())
            .filter(k => k.comprehension >= this.config.deletionThreshold);
        if (options?.minInterest) {
            candidates = candidates.filter(k => k.interestLevel >= options.minInterest);
        }
        if (options?.preferSource) {
            const preferred = candidates.filter(k => k.source === options.preferSource);
            if (preferred.length > 0) {
                candidates = preferred;
            }
        }
        if (candidates.length === 0)
            return null;
        // 興味度に応じた重み付け
        const weighted = [];
        for (const k of candidates) {
            const weight = Math.ceil(k.interestLevel * 3);
            for (let i = 0; i < weight; i++) {
                weighted.push(k);
            }
        }
        return weighted[Math.floor(Math.random() * weighted.length)];
    }
    /**
     * 定期メンテナンス
     */
    performMaintenance(currentTick) {
        const ticksSinceLastMaintenance = currentTick - this.lastMaintenanceTick;
        if (ticksSinceLastMaintenance < 200)
            return; // 200tick毎
        const now = Date.now();
        const toDelete = [];
        for (const knowledge of this.concepts.values()) {
            // 初期知識は削除しない
            if (knowledge.source === 'initial')
                continue;
            // 未使用の知識は減衰
            const timeSinceUse = knowledge.lastUsed
                ? now - knowledge.lastUsed
                : now - knowledge.learnedAt;
            const daysSinceUse = timeSinceUse / (1000 * 60 * 60 * 24);
            // 興味度が高い知識は減衰が遅い
            const effectiveDecay = this.config.unusedDecayRate * (1 - knowledge.interestLevel * 0.5);
            const decay = effectiveDecay * daysSinceUse * 0.01;
            knowledge.comprehension = Math.max(0, knowledge.comprehension - decay);
            if (knowledge.comprehension < this.config.deletionThreshold) {
                toDelete.push(knowledge.id);
            }
        }
        // 削除実行
        for (const id of toDelete) {
            this.deleteKnowledge(id);
        }
        this.lastMaintenanceTick = currentTick;
    }
    /**
     * 知識を削除
     */
    deleteKnowledge(conceptId) {
        const knowledge = this.concepts.get(conceptId);
        if (!knowledge)
            return;
        // インデックスから削除
        this.conceptNameIndex.delete(knowledge.concept.toLowerCase());
        this.sourceIndex.get(knowledge.source)?.delete(conceptId);
        // 関連概念からの参照を削除
        for (const relation of knowledge.relatedConcepts) {
            const relatedId = this.conceptNameIndex.get(relation.concept.toLowerCase());
            if (relatedId) {
                const related = this.concepts.get(relatedId);
                if (related) {
                    related.relatedConcepts = related.relatedConcepts.filter(r => r.concept.toLowerCase() !== knowledge.concept.toLowerCase());
                }
            }
        }
        // 削除
        this.concepts.delete(conceptId);
        // イベントログ
        this.logEvent({
            timestamp: Date.now(),
            conceptId,
            type: 'forgotten',
            details: `知識が薄れた: ${knowledge.concept}`
        });
    }
    /**
     * 容量制限を適用
     */
    enforceCapacity() {
        if (this.concepts.size <= this.config.maxConcepts)
            return;
        // 初期知識を除いてソート
        const sorted = Array.from(this.concepts.values())
            .filter(k => k.source !== 'initial')
            .sort((a, b) => (a.comprehension * a.useCount) - (b.comprehension * b.useCount));
        const toDelete = sorted.slice(0, this.concepts.size - this.config.maxConcepts);
        for (const knowledge of toDelete) {
            this.deleteKnowledge(knowledge.id);
        }
    }
    /**
     * イベントをログ
     */
    logEvent(event) {
        this.eventLog.push(event);
        if (this.eventLog.length > 1000) {
            this.eventLog = this.eventLog.slice(-1000);
        }
    }
    // ============================================================
    // クエリAPI
    // ============================================================
    /**
     * 概念数を取得
     */
    getConceptCount() {
        return this.concepts.size;
    }
    /**
     * 統計を取得
     */
    getStats() {
        const all = Array.from(this.concepts.values())
            .filter(k => k.comprehension >= this.config.deletionThreshold);
        const avgComprehension = all.length > 0
            ? all.reduce((sum, k) => sum + k.comprehension, 0) / all.length
            : 0;
        const avgInterest = all.length > 0
            ? all.reduce((sum, k) => sum + k.interestLevel, 0) / all.length
            : 0;
        const sourceDistribution = {};
        for (const k of all) {
            sourceDistribution[k.source] = (sourceDistribution[k.source] || 0) + 1;
        }
        // 最も接続の多い概念
        let mostConnected = null;
        let maxConnections = 0;
        for (const k of all) {
            if (k.relatedConcepts.length > maxConnections) {
                maxConnections = k.relatedConcepts.length;
                mostConnected = k.concept;
            }
        }
        return {
            totalConcepts: all.length,
            avgComprehension,
            avgInterest,
            sourceDistribution,
            mostConnected
        };
    }
    /**
     * 最近のイベントを取得
     */
    getRecentEvents(count = 20) {
        return this.eventLog.slice(-count);
    }
    /**
     * サマリーを取得
     */
    getSummary() {
        const recent = Array.from(this.concepts.values())
            .sort((a, b) => b.learnedAt - a.learnedAt);
        const mostInteresting = this.getMostInteresting(1);
        return {
            totalKnowledge: this.concepts.size,
            recentlyLearned: recent[0]?.concept || null,
            strongestInterest: mostInteresting[0]?.concept || null
        };
    }
    // ============================================================
    // シリアライズ
    // ============================================================
    /**
     * JSON形式でエクスポート
     */
    toJSON() {
        return {
            concepts: Array.from(this.concepts.entries()),
            config: this.config,
            eventLog: this.eventLog.slice(-500),
            lastMaintenanceTick: this.lastMaintenanceTick,
            compressionLog: this.compressionLog?.slice(-50) || [],
        };
    }
    /**
     * JSONからリストア
     */
    static fromJSON(json) {
        const system = new SemanticMemorySystem(json.config);
        // 既存の初期知識をクリア
        system.concepts.clear();
        system.conceptNameIndex.clear();
        system.sourceIndex.clear();
        // 保存されたデータを復元
        for (const [id, knowledge] of json.concepts) {
            system.concepts.set(id, knowledge);
            system.conceptNameIndex.set(knowledge.concept.toLowerCase(), id);
            if (!system.sourceIndex.has(knowledge.source)) {
                system.sourceIndex.set(knowledge.source, new Set());
            }
            system.sourceIndex.get(knowledge.source).add(id);
        }
        system.eventLog = json.eventLog || [];
        system.lastMaintenanceTick = json.lastMaintenanceTick || 0;
        if (json.compressionLog)
            system.compressionLog = json.compressionLog;
        return system;
    }
    // ============================================================
    // Phase 4D: Knowledge Graph 可視化
    // ============================================================
    /**
     * 知識グラフの完全な構造を出力
     * ノード（概念）とエッジ（関係）のネットワーク構造を生成
     */
    generateKnowledgeGraph() {
        const nodes = [];
        const edges = [];
        const clusters = [];
        // === ノードの生成 ===
        for (const [id, concept] of this.concepts) {
            if (concept.comprehension < this.config.deletionThreshold)
                continue;
            nodes.push({
                id,
                label: concept.concept,
                size: this.calculateNodeSize(concept),
                color: this.getEmotionalColor(concept),
                category: concept.source,
                metrics: {
                    comprehension: concept.comprehension,
                    interestLevel: concept.interestLevel,
                    useCount: concept.useCount,
                    connectionCount: concept.relatedConcepts.length,
                    age: Date.now() - concept.learnedAt,
                },
            });
        }
        // === エッジの生成 ===
        const edgeSet = new Set(); // 重複防止
        for (const [id, concept] of this.concepts) {
            if (concept.comprehension < this.config.deletionThreshold)
                continue;
            for (const relation of concept.relatedConcepts) {
                const targetId = this.conceptNameIndex.get(relation.concept.toLowerCase());
                if (!targetId)
                    continue;
                const edgeKey = [id, targetId].sort().join('↔');
                if (edgeSet.has(edgeKey))
                    continue;
                edgeSet.add(edgeKey);
                edges.push({
                    source: id,
                    target: targetId,
                    relation: relation.relationType,
                    strength: relation.strength,
                    label: this.relationToLabel(relation.relationType),
                });
            }
        }
        // === クラスター検出 ===
        const clusterMap = this.detectClusters(nodes, edges);
        for (const [clusterName, memberIds] of clusterMap) {
            const members = memberIds
                .map(mid => this.concepts.get(mid))
                .filter((c) => c !== undefined);
            const avgComprehension = members.length > 0
                ? members.reduce((s, m) => s + m.comprehension, 0) / members.length
                : 0;
            clusters.push({
                name: clusterName,
                nodeIds: memberIds,
                size: memberIds.length,
                cohesion: this.calculateClusterCohesion(memberIds, edges),
                dominantSource: this.getDominantSource(members),
                avgComprehension,
            });
        }
        // === 統計 ===
        const graphStats = this.calculateGraphStats(nodes, edges, clusters);
        return {
            nodes,
            edges,
            clusters,
            stats: graphStats,
            generatedAt: Date.now(),
        };
    }
    /**
     * 特定の概念を中心としたサブグラフを取得
     */
    getSubgraph(conceptName, depth = 2) {
        const centerId = this.conceptNameIndex.get(conceptName.toLowerCase());
        if (!centerId)
            return null;
        const visitedIds = new Set();
        const queue = [{ id: centerId, currentDepth: 0 }];
        while (queue.length > 0) {
            const { id, currentDepth } = queue.shift();
            if (visitedIds.has(id) || currentDepth > depth)
                continue;
            visitedIds.add(id);
            const concept = this.concepts.get(id);
            if (!concept)
                continue;
            for (const rel of concept.relatedConcepts) {
                const relatedId = this.conceptNameIndex.get(rel.concept.toLowerCase());
                if (relatedId && !visitedIds.has(relatedId)) {
                    queue.push({ id: relatedId, currentDepth: currentDepth + 1 });
                }
            }
        }
        // 見つかったIDのみでグラフを構築
        const subNodes = [];
        const subEdges = [];
        for (const id of visitedIds) {
            const concept = this.concepts.get(id);
            if (!concept)
                continue;
            subNodes.push({
                id,
                label: concept.concept,
                size: this.calculateNodeSize(concept),
                color: this.getEmotionalColor(concept),
                category: concept.source,
                metrics: {
                    comprehension: concept.comprehension,
                    interestLevel: concept.interestLevel,
                    useCount: concept.useCount,
                    connectionCount: concept.relatedConcepts.length,
                    age: Date.now() - concept.learnedAt,
                },
            });
            for (const rel of concept.relatedConcepts) {
                const targetId = this.conceptNameIndex.get(rel.concept.toLowerCase());
                if (targetId && visitedIds.has(targetId)) {
                    subEdges.push({
                        source: id,
                        target: targetId,
                        relation: rel.relationType,
                        strength: rel.strength,
                        label: this.relationToLabel(rel.relationType),
                    });
                }
            }
        }
        return {
            nodes: subNodes,
            edges: subEdges,
            clusters: [],
            stats: this.calculateGraphStats(subNodes, subEdges, []),
            generatedAt: Date.now(),
        };
    }
    /**
     * 知識の成長ログ（タイムライン）
     */
    getKnowledgeTimeline(bucketSize = 86400000) {
        const entries = [];
        const conceptsByTime = Array.from(this.concepts.values())
            .filter(c => c.comprehension >= this.config.deletionThreshold)
            .sort((a, b) => a.learnedAt - b.learnedAt);
        if (conceptsByTime.length === 0)
            return entries;
        let bucketStart = conceptsByTime[0].learnedAt;
        let currentBucket = [];
        for (const concept of conceptsByTime) {
            if (concept.learnedAt >= bucketStart + bucketSize) {
                // バケットを確定
                if (currentBucket.length > 0) {
                    entries.push({
                        timestamp: bucketStart,
                        conceptsLearned: currentBucket.length,
                        topics: currentBucket.map(c => c.concept),
                        avgComprehension: currentBucket.reduce((s, c) => s + c.comprehension, 0) / currentBucket.length,
                        dominantSource: this.getDominantSource(currentBucket),
                        totalKnowledge: entries.length > 0
                            ? entries[entries.length - 1].totalKnowledge + currentBucket.length
                            : currentBucket.length,
                    });
                }
                bucketStart = concept.learnedAt;
                currentBucket = [];
            }
            currentBucket.push(concept);
        }
        // 最後のバケット
        if (currentBucket.length > 0) {
            entries.push({
                timestamp: bucketStart,
                conceptsLearned: currentBucket.length,
                topics: currentBucket.map(c => c.concept),
                avgComprehension: currentBucket.reduce((s, c) => s + c.comprehension, 0) / currentBucket.length,
                dominantSource: this.getDominantSource(currentBucket),
                totalKnowledge: (entries.length > 0 ? entries[entries.length - 1].totalKnowledge : 0) + currentBucket.length,
            });
        }
        return entries;
    }
    /**
     * 概念の既知トピックリストを取得
     */
    getKnownTopics() {
        return Array.from(this.concepts.values())
            .filter(c => c.comprehension >= this.config.deletionThreshold)
            .map(c => c.concept);
    }
    // --- Graph Helper Methods ---
    calculateNodeSize(concept) {
        // useCount + comprehension + connections で重み付け
        const base = 10;
        const useFactor = Math.min(5, concept.useCount) * 3;
        const compFactor = concept.comprehension * 10;
        const connFactor = concept.relatedConcepts.length * 2;
        return base + useFactor + compFactor + connFactor;
    }
    getEmotionalColor(concept) {
        // 興味度と理解度に基づく色
        if (concept.interestLevel > 0.7)
            return '#FFD700'; // 高興味: ゴールド
        if (concept.comprehension > 0.8)
            return '#4CAF50'; // 高理解: グリーン
        if (concept.source === 'wikipedia')
            return '#2196F3'; // Wiki: ブルー
        if (concept.source === 'experience')
            return '#FF9800'; // 経験: オレンジ
        if (concept.source === 'conversation')
            return '#E91E63'; // 会話: ピンク
        if (concept.source === 'book')
            return '#9C27B0'; // 本: パープル
        return '#607D8B'; // デフォルト: グレー
    }
    relationToLabel(type) {
        const labels = {
            is_a: 'である',
            part_of: 'の一部',
            related_to: '関連',
            opposite_of: '反対',
            causes: '原因',
            similar_to: '類似',
        };
        return labels[type] || type;
    }
    detectClusters(nodes, edges) {
        // シンプルなソースベース + 接続ベースクラスタリング
        const clusters = new Map();
        // ソースベースクラスタリング
        for (const node of nodes) {
            const key = node.category;
            if (!clusters.has(key))
                clusters.set(key, []);
            clusters.get(key).push(node.id);
        }
        // 密結合な概念グループを追加検出
        const adjacency = new Map();
        for (const edge of edges) {
            if (edge.strength < 0.6)
                continue;
            if (!adjacency.has(edge.source))
                adjacency.set(edge.source, new Set());
            if (!adjacency.has(edge.target))
                adjacency.set(edge.target, new Set());
            adjacency.get(edge.source).add(edge.target);
            adjacency.get(edge.target).add(edge.source);
        }
        // 3つ以上の密結合ノード → クラスター
        const visited = new Set();
        let clusterIdx = 0;
        for (const [nodeId, neighbors] of adjacency) {
            if (visited.has(nodeId) || neighbors.size < 2)
                continue;
            // BFS
            const component = [];
            const bfsQueue = [nodeId];
            while (bfsQueue.length > 0) {
                const current = bfsQueue.shift();
                if (visited.has(current))
                    continue;
                visited.add(current);
                component.push(current);
                const currentNeighbors = adjacency.get(current);
                if (currentNeighbors) {
                    for (const n of currentNeighbors) {
                        if (!visited.has(n))
                            bfsQueue.push(n);
                    }
                }
            }
            if (component.length >= 3) {
                // クラスター名を代表概念から命名
                const rep = this.concepts.get(component[0]);
                const name = rep ? `${rep.concept}系列` : `cluster_${clusterIdx}`;
                clusters.set(name, component);
                clusterIdx++;
            }
        }
        return clusters;
    }
    calculateClusterCohesion(memberIds, edges) {
        const memberSet = new Set(memberIds);
        let internalEdges = 0;
        let totalStrength = 0;
        for (const edge of edges) {
            if (memberSet.has(edge.source) && memberSet.has(edge.target)) {
                internalEdges++;
                totalStrength += edge.strength;
            }
        }
        const maxPossible = (memberIds.length * (memberIds.length - 1)) / 2;
        return maxPossible > 0 ? internalEdges / maxPossible : 0;
    }
    getDominantSource(concepts) {
        const counts = {};
        for (const c of concepts) {
            counts[c.source] = (counts[c.source] || 0) + 1;
        }
        let maxSource = 'unknown';
        let maxCount = 0;
        for (const [source, count] of Object.entries(counts)) {
            if (count > maxCount) {
                maxCount = count;
                maxSource = source;
            }
        }
        return maxSource;
    }
    calculateGraphStats(nodes, edges, clusters) {
        const totalNodes = nodes.length;
        const totalEdges = edges.length;
        // 平均次数
        const degreeMap = new Map();
        for (const edge of edges) {
            degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
            degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
        }
        const degrees = Array.from(degreeMap.values());
        const avgDegree = degrees.length > 0 ? degrees.reduce((s, d) => s + d, 0) / degrees.length : 0;
        // 最もよく繋がったノード
        let hubNode = null;
        let maxDegree = 0;
        for (const [id, degree] of degreeMap) {
            if (degree > maxDegree) {
                maxDegree = degree;
                const concept = this.concepts.get(id);
                hubNode = concept?.concept || null;
            }
        }
        // 孤立ノード
        const isolatedNodes = nodes.filter(n => !degreeMap.has(n.id)).length;
        // 密度
        const maxEdges = (totalNodes * (totalNodes - 1)) / 2;
        const density = maxEdges > 0 ? totalEdges / maxEdges : 0;
        return {
            totalNodes,
            totalEdges,
            totalClusters: clusters.length,
            avgDegree: Math.round(avgDegree * 100) / 100,
            density: Math.round(density * 1000) / 1000,
            hubNode,
            maxDegree,
            isolatedNodes,
        };
    }
    // ============================================================
    // Phase 4F: 長期記憶圧縮（SemanticMemory側）
    // ============================================================
    compressionLog = [];
    /**
     * 意味記憶の圧縮
     * 低使用・低理解の概念を統合・要約
     */
    compressKnowledge() {
        const before = this.concepts.size;
        const compressed = [];
        const merged = [];
        // === 1. 類似概念のマージ ===
        const candidates = Array.from(this.concepts.values())
            .filter(c => c.source !== 'initial' && c.comprehension < 0.4 && c.useCount < 3);
        // 概念名の類似度で候補をペアリング
        const mergeGroups = [];
        const processedIds = new Set();
        for (let i = 0; i < candidates.length; i++) {
            if (processedIds.has(candidates[i].id))
                continue;
            const group = [candidates[i]];
            processedIds.add(candidates[i].id);
            for (let j = i + 1; j < candidates.length; j++) {
                if (processedIds.has(candidates[j].id))
                    continue;
                // 概念間の関係が存在するか確認
                const hasRelation = candidates[i].relatedConcepts.some(r => r.concept.toLowerCase() === candidates[j].concept.toLowerCase()) || candidates[j].relatedConcepts.some(r => r.concept.toLowerCase() === candidates[i].concept.toLowerCase());
                // 同じソースからの知識で関連がある
                if (hasRelation && candidates[i].source === candidates[j].source) {
                    group.push(candidates[j]);
                    processedIds.add(candidates[j].id);
                }
            }
            if (group.length >= 2) {
                mergeGroups.push(group);
            }
        }
        // マージの実行
        for (const group of mergeGroups) {
            const primary = group.reduce((best, c) => c.comprehension > best.comprehension ? c : best);
            // 他の概念の知識を主概念に統合
            for (const other of group) {
                if (other.id === primary.id)
                    continue;
                // 関連概念を引き継ぎ
                for (const rel of other.relatedConcepts) {
                    const exists = primary.relatedConcepts.some(r => r.concept.toLowerCase() === rel.concept.toLowerCase());
                    if (!exists) {
                        primary.relatedConcepts.push(rel);
                    }
                }
                // 理解度を平均化
                primary.comprehension = Math.min(1, (primary.comprehension + other.comprehension * 0.5));
                primary.useCount += other.useCount;
                // 元の概念を削除
                this.deleteKnowledge(other.id);
                compressed.push(other.concept);
            }
            merged.push({
                from: group.filter(c => c.id !== primary.id).map(c => c.concept),
                into: primary.concept,
            });
        }
        // === 2. 極低理解度の概念を淘汰 ===
        const veryLow = Array.from(this.concepts.values())
            .filter(c => c.source !== 'initial' &&
            c.comprehension < 0.1 &&
            c.useCount === 0 &&
            Date.now() - c.learnedAt > 86400000 * 7 // 7日以上前
        );
        for (const concept of veryLow) {
            this.deleteKnowledge(concept.id);
            compressed.push(concept.concept);
        }
        const after = this.concepts.size;
        const record = {
            timestamp: Date.now(),
            conceptsBefore: before,
            conceptsAfter: after,
            conceptsRemoved: compressed.length,
            mergesPerformed: merged.length,
            mergeDetails: merged,
        };
        this.compressionLog.push(record);
        return {
            compressed: compressed.length,
            merged: merged.length,
            before,
            after,
            details: record,
        };
    }
    getCompressionLog() {
        return this.compressionLog || [];
    }
}
exports.SemanticMemorySystem = SemanticMemorySystem;
exports.default = SemanticMemorySystem;
//# sourceMappingURL=SemanticMemory.js.map