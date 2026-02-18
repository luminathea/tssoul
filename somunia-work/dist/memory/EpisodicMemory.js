"use strict";
/**
 * EpisodicMemorySystem - エピソード記憶システム
 *
 * somuniaが体験した出来事を記録・保存・想起する
 * 感情的に重要な記憶ほど強く保持される
 *
 * 設計原則:
 * - 記憶は時間とともに減衰（忘却曲線）
 * - 感情的強度が高い記憶は減衰が遅い
 * - 想起するたびに記憶が強化される
 * - 関連する記憶同士がネットワークを形成
 * - 大量の記憶を効率的に管理
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpisodicMemorySystem = void 0;
const DEFAULT_CONFIG = {
    baseForgetRate: 0.05,
    emotionalRetentionBonus: 0.3,
    recallStrengthening: 0.15,
    maxMemories: 10000,
    deletionThreshold: 0.05,
    associationThreshold: 0.4
};
// ============================================================
// エピソード記憶システム本体
// ============================================================
class EpisodicMemorySystem {
    memories;
    config;
    eventLog;
    lastMaintenanceTick;
    // インデックス
    emotionIndex;
    conceptIndex;
    timeIndex; // 日付文字列 → ID
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.memories = new Map();
        this.eventLog = [];
        this.lastMaintenanceTick = 0;
        this.emotionIndex = new Map();
        this.conceptIndex = new Map();
        this.timeIndex = new Map();
    }
    /**
     * 新しい記憶を形成
     */
    formMemory(params) {
        const id = this.generateId();
        const now = Date.now();
        // 感情強度に基づく重要度
        const importance = this.calculateImportance(params.emotionalTags, params.emotionalIntensity);
        const memory = {
            id,
            content: params.content,
            summary: params.summary,
            timestamp: now,
            duration: params.duration || 0,
            emotionalTags: params.emotionalTags,
            emotionalIntensity: params.emotionalIntensity,
            importance,
            relatedMemories: [],
            relatedConcepts: params.relatedConcepts || [],
            recallCount: 0,
            lastRecalled: null,
            retentionStrength: 1.0
        };
        // 保存
        this.memories.set(id, memory);
        // インデックス更新
        this.updateIndices(memory);
        // 関連記憶の探索と紐付け
        this.findAndAssociateMemories(memory);
        // イベントログ
        this.logEvent({
            timestamp: now,
            memoryId: id,
            type: 'formed',
            details: `新しい記憶: ${params.summary.substring(0, 50)}...`
        });
        // 容量チェック
        this.enforceCapacity();
        return memory;
    }
    /**
     * 重要度を計算
     */
    calculateImportance(emotions, intensity) {
        // 特定の感情は記憶に残りやすい
        const emotionWeights = {
            joy: 1.2,
            fear: 1.5,
            wonder: 1.3,
            warmth: 1.2,
            loneliness: 1.1,
            nostalgia: 1.3,
            melancholy: 1.1
        };
        let totalWeight = 0;
        for (const emotion of emotions) {
            totalWeight += emotionWeights[emotion] || 1.0;
        }
        const avgWeight = emotions.length > 0 ? totalWeight / emotions.length : 1.0;
        return Math.min(1, intensity * avgWeight);
    }
    /**
     * IDを生成
     */
    generateId() {
        return `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * インデックスを更新
     */
    updateIndices(memory) {
        // 感情インデックス
        for (const emotion of memory.emotionalTags) {
            if (!this.emotionIndex.has(emotion)) {
                this.emotionIndex.set(emotion, new Set());
            }
            this.emotionIndex.get(emotion).add(memory.id);
        }
        // 概念インデックス
        for (const concept of memory.relatedConcepts) {
            const normalized = concept.toLowerCase();
            if (!this.conceptIndex.has(normalized)) {
                this.conceptIndex.set(normalized, new Set());
            }
            this.conceptIndex.get(normalized).add(memory.id);
        }
        // 時間インデックス
        const dateKey = this.getDateKey(memory.timestamp);
        if (!this.timeIndex.has(dateKey)) {
            this.timeIndex.set(dateKey, new Set());
        }
        this.timeIndex.get(dateKey).add(memory.id);
    }
    /**
     * 日付キーを取得
     */
    getDateKey(timestamp) {
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    /**
     * 関連記憶を探して紐付け
     */
    findAndAssociateMemories(newMemory) {
        const candidates = new Map();
        // 同じ感情タグを持つ記憶
        for (const emotion of newMemory.emotionalTags) {
            const relatedIds = this.emotionIndex.get(emotion);
            if (relatedIds) {
                for (const id of relatedIds) {
                    if (id !== newMemory.id) {
                        candidates.set(id, (candidates.get(id) || 0) + 0.3);
                    }
                }
            }
        }
        // 同じ概念を持つ記憶
        for (const concept of newMemory.relatedConcepts) {
            const relatedIds = this.conceptIndex.get(concept.toLowerCase());
            if (relatedIds) {
                for (const id of relatedIds) {
                    if (id !== newMemory.id) {
                        candidates.set(id, (candidates.get(id) || 0) + 0.5);
                    }
                }
            }
        }
        // 閾値以上の関連度を持つ記憶と紐付け
        for (const [id, score] of candidates) {
            if (score >= this.config.associationThreshold) {
                const relatedMemory = this.memories.get(id);
                if (relatedMemory) {
                    // 双方向に紐付け
                    if (!newMemory.relatedMemories.includes(id)) {
                        newMemory.relatedMemories.push(id);
                    }
                    if (!relatedMemory.relatedMemories.includes(newMemory.id)) {
                        relatedMemory.relatedMemories.push(newMemory.id);
                    }
                }
            }
        }
    }
    /**
     * 記憶を想起
     */
    recall(memoryId) {
        const memory = this.memories.get(memoryId);
        if (!memory)
            return null;
        const now = Date.now();
        // 想起による強化
        memory.retentionStrength = Math.min(1.0, memory.retentionStrength + this.config.recallStrengthening);
        memory.recallCount++;
        memory.lastRecalled = now;
        // イベントログ
        this.logEvent({
            timestamp: now,
            memoryId,
            type: 'recalled',
            details: `記憶を想起: ${memory.summary.substring(0, 30)}...`
        });
        return memory;
    }
    /**
     * 感情で記憶を検索
     */
    searchByEmotion(emotion, limit = 10) {
        const ids = this.emotionIndex.get(emotion);
        if (!ids)
            return [];
        const results = [];
        for (const id of ids) {
            const memory = this.memories.get(id);
            if (memory && memory.retentionStrength >= this.config.deletionThreshold) {
                results.push({
                    memory,
                    relevance: memory.retentionStrength * memory.importance,
                    matchedCriteria: [`emotion:${emotion}`]
                });
            }
        }
        return results
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, limit);
    }
    /**
     * 概念で記憶を検索
     */
    searchByConcept(concept, limit = 10) {
        const normalized = concept.toLowerCase();
        const ids = this.conceptIndex.get(normalized);
        if (!ids)
            return [];
        const results = [];
        for (const id of ids) {
            const memory = this.memories.get(id);
            if (memory && memory.retentionStrength >= this.config.deletionThreshold) {
                results.push({
                    memory,
                    relevance: memory.retentionStrength * memory.importance,
                    matchedCriteria: [`concept:${concept}`]
                });
            }
        }
        return results
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, limit);
    }
    /**
     * 自由検索（内容から）
     */
    search(query, limit = 10) {
        const results = [];
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/);
        for (const memory of this.memories.values()) {
            if (memory.retentionStrength < this.config.deletionThreshold)
                continue;
            let score = 0;
            const matched = [];
            // 内容マッチ
            const contentLower = memory.content.toLowerCase();
            for (const word of queryWords) {
                if (contentLower.includes(word)) {
                    score += 0.3;
                    matched.push(`content:${word}`);
                }
            }
            // サマリーマッチ
            const summaryLower = memory.summary.toLowerCase();
            for (const word of queryWords) {
                if (summaryLower.includes(word)) {
                    score += 0.4;
                    matched.push(`summary:${word}`);
                }
            }
            // 概念マッチ
            for (const concept of memory.relatedConcepts) {
                if (concept.toLowerCase().includes(queryLower)) {
                    score += 0.5;
                    matched.push(`concept:${concept}`);
                }
            }
            if (score > 0) {
                results.push({
                    memory,
                    relevance: score * memory.retentionStrength * memory.importance,
                    matchedCriteria: matched
                });
            }
        }
        return results
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, limit);
    }
    /**
     * 時間範囲で検索
     */
    searchByTimeRange(startTime, endTime, limit = 20) {
        const results = [];
        for (const memory of this.memories.values()) {
            if (memory.timestamp >= startTime && memory.timestamp <= endTime &&
                memory.retentionStrength >= this.config.deletionThreshold) {
                results.push({
                    memory,
                    relevance: memory.retentionStrength * memory.importance,
                    matchedCriteria: ['time_range']
                });
            }
        }
        return results
            .sort((a, b) => b.memory.timestamp - a.memory.timestamp)
            .slice(0, limit);
    }
    /**
     * 関連記憶を取得
     */
    getRelatedMemories(memoryId, limit = 5) {
        const memory = this.memories.get(memoryId);
        if (!memory)
            return [];
        const related = [];
        for (const relatedId of memory.relatedMemories) {
            const relatedMemory = this.memories.get(relatedId);
            if (relatedMemory && relatedMemory.retentionStrength >= this.config.deletionThreshold) {
                related.push(relatedMemory);
            }
        }
        return related
            .sort((a, b) => b.importance - a.importance)
            .slice(0, limit);
    }
    /**
     * ランダムな記憶を想起（懐かしさ、連想）
     */
    recallRandom(options) {
        const candidates = [];
        for (const memory of this.memories.values()) {
            if (memory.retentionStrength < this.config.deletionThreshold)
                continue;
            if (options?.minImportance && memory.importance < options.minImportance)
                continue;
            if (options?.preferEmotion) {
                if (memory.emotionalTags.includes(options.preferEmotion)) {
                    // 感情が一致する場合は重み付け
                    candidates.push(memory, memory, memory);
                }
                else {
                    candidates.push(memory);
                }
            }
            else {
                // 重要度に応じた重み付け
                const weight = Math.ceil(memory.importance * 3);
                for (let i = 0; i < weight; i++) {
                    candidates.push(memory);
                }
            }
        }
        if (candidates.length === 0)
            return null;
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        return this.recall(selected.id);
    }
    /**
     * 定期メンテナンス（忘却処理）
     */
    performMaintenance(currentTick) {
        const ticksSinceLastMaintenance = currentTick - this.lastMaintenanceTick;
        if (ticksSinceLastMaintenance < 100)
            return; // 100tick毎
        const now = Date.now();
        const memoriestoDelete = [];
        for (const memory of this.memories.values()) {
            // 忘却率計算
            const timeSinceRecall = memory.lastRecalled
                ? now - memory.lastRecalled
                : now - memory.timestamp;
            const daysSinceRecall = timeSinceRecall / (1000 * 60 * 60 * 24);
            // 感情的記憶は忘れにくい
            const retentionBonus = memory.emotionalIntensity * this.config.emotionalRetentionBonus;
            const effectiveForgetRate = this.config.baseForgetRate * (1 - retentionBonus);
            // 忘却適用
            const decay = effectiveForgetRate * daysSinceRecall * 0.01;
            memory.retentionStrength = Math.max(0, memory.retentionStrength - decay);
            // 削除対象
            if (memory.retentionStrength < this.config.deletionThreshold) {
                memoriestoDelete.push(memory.id);
            }
        }
        // 削除実行
        for (const id of memoriestoDelete) {
            this.deleteMemory(id);
        }
        this.lastMaintenanceTick = currentTick;
    }
    /**
     * 記憶を削除
     */
    deleteMemory(memoryId) {
        const memory = this.memories.get(memoryId);
        if (!memory)
            return;
        // インデックスから削除
        for (const emotion of memory.emotionalTags) {
            this.emotionIndex.get(emotion)?.delete(memoryId);
        }
        for (const concept of memory.relatedConcepts) {
            this.conceptIndex.get(concept.toLowerCase())?.delete(memoryId);
        }
        const dateKey = this.getDateKey(memory.timestamp);
        this.timeIndex.get(dateKey)?.delete(memoryId);
        // 関連記憶から削除
        for (const relatedId of memory.relatedMemories) {
            const relatedMemory = this.memories.get(relatedId);
            if (relatedMemory) {
                relatedMemory.relatedMemories = relatedMemory.relatedMemories
                    .filter(id => id !== memoryId);
            }
        }
        // メモリ削除
        this.memories.delete(memoryId);
        // イベントログ
        this.logEvent({
            timestamp: Date.now(),
            memoryId,
            type: 'forgotten',
            details: `記憶が薄れた: ${memory.summary.substring(0, 30)}...`
        });
    }
    /**
     * 容量制限を適用
     */
    enforceCapacity() {
        if (this.memories.size <= this.config.maxMemories)
            return;
        // 重要度と保持強度でソート
        const sorted = Array.from(this.memories.values())
            .sort((a, b) => (a.importance * a.retentionStrength) - (b.importance * b.retentionStrength));
        // 最も重要でない記憶を削除
        const toDelete = sorted.slice(0, this.memories.size - this.config.maxMemories);
        for (const memory of toDelete) {
            this.deleteMemory(memory.id);
        }
    }
    /**
     * イベントをログ
     */
    logEvent(event) {
        this.eventLog.push(event);
        // 最大1000件
        if (this.eventLog.length > 1000) {
            this.eventLog = this.eventLog.slice(-1000);
        }
    }
    // ============================================================
    // クエリAPI
    // ============================================================
    /**
     * 記憶を取得
     */
    getMemory(memoryId) {
        return this.memories.get(memoryId) || null;
    }
    /**
     * 記憶数を取得
     */
    getMemoryCount() {
        return this.memories.size;
    }
    /**
     * 最近の記憶を取得
     */
    getRecentMemories(count = 10) {
        return Array.from(this.memories.values())
            .filter(m => m.retentionStrength >= this.config.deletionThreshold)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, count);
    }
    /**
     * 最も重要な記憶を取得
     */
    getMostImportantMemories(count = 10) {
        return Array.from(this.memories.values())
            .filter(m => m.retentionStrength >= this.config.deletionThreshold)
            .sort((a, b) => (b.importance * b.retentionStrength) - (a.importance * a.retentionStrength))
            .slice(0, count);
    }
    /**
     * 最も想起された記憶を取得
     */
    getMostRecalledMemories(count = 10) {
        return Array.from(this.memories.values())
            .filter(m => m.retentionStrength >= this.config.deletionThreshold)
            .sort((a, b) => b.recallCount - a.recallCount)
            .slice(0, count);
    }
    /**
     * 統計を取得
     */
    getStats() {
        const active = Array.from(this.memories.values())
            .filter(m => m.retentionStrength >= this.config.deletionThreshold);
        const avgRetention = active.length > 0
            ? active.reduce((sum, m) => sum + m.retentionStrength, 0) / active.length
            : 0;
        const avgImportance = active.length > 0
            ? active.reduce((sum, m) => sum + m.importance, 0) / active.length
            : 0;
        const sorted = active.sort((a, b) => a.timestamp - b.timestamp);
        const emotionDistribution = {};
        for (const memory of active) {
            for (const emotion of memory.emotionalTags) {
                emotionDistribution[emotion] = (emotionDistribution[emotion] || 0) + 1;
            }
        }
        return {
            totalMemories: this.memories.size,
            activeMemories: active.length,
            avgRetention,
            avgImportance,
            oldestMemory: sorted[0]?.timestamp || null,
            newestMemory: sorted[sorted.length - 1]?.timestamp || null,
            emotionDistribution
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
        const recent = this.getRecentMemories(5);
        const stats = this.getStats();
        let dominantEmotion = null;
        let maxCount = 0;
        for (const [emotion, count] of Object.entries(stats.emotionDistribution)) {
            if (count > maxCount) {
                maxCount = count;
                dominantEmotion = emotion;
            }
        }
        return {
            totalCount: stats.activeMemories,
            recentHighlight: recent[0]?.summary || null,
            dominantEmotion
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
            memories: Array.from(this.memories.entries()),
            config: this.config,
            eventLog: this.eventLog.slice(-500),
            lastMaintenanceTick: this.lastMaintenanceTick
        };
    }
    /**
     * JSONからリストア
     */
    static fromJSON(json) {
        const system = new EpisodicMemorySystem(json.config);
        // メモリを復元
        for (const [id, memory] of json.memories) {
            system.memories.set(id, memory);
            system.updateIndices(memory);
        }
        system.eventLog = json.eventLog || [];
        system.lastMaintenanceTick = json.lastMaintenanceTick || 0;
        return system;
    }
}
exports.EpisodicMemorySystem = EpisodicMemorySystem;
exports.default = EpisodicMemorySystem;
//# sourceMappingURL=EpisodicMemory.js.map