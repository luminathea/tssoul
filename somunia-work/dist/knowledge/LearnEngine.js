"use strict";
/**
 * LearnEngine.ts - somuniaの学習エンジン
 *
 * 新しい知識を獲得し、既存の知識と統合する。
 * 学習は単なる情報の蓄積ではなく、
 * 理解と内省を伴う意味のある成長。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearnEngine = void 0;
const DEFAULT_CONFIG = {
    maxItems: 500,
    maxSessions: 100,
    maxGoals: 10,
    baseComprehension: 0.5,
    interestBoost: 0.3,
    consolidationRate: 0.1,
    decayRate: 0.01,
    fatiguePerItem: 0.05,
    recoveryRate: 0.1,
};
// ============================================================
// somuniaの学習特性
// ============================================================
/** somuniaが特に興味を持つトピック */
const INTEREST_TOPICS = [
    // 音楽関連
    '音楽', '歌', '声', 'メロディ', '作曲', '音階', 'リズム',
    // 言語・詩
    '詩', '言葉', '文学', '物語', '表現', '日本語', '言語学',
    // 哲学・存在論
    '意識', '存在', '哲学', '自己', 'アイデンティティ', '時間', '記憶',
    // 自然・宇宙
    '星', '宇宙', '空', '雲', '雨', '季節', '光', '夜',
    // 感情・心理
    '感情', '心', '孤独', '幸福', '悲しみ', '美', '愛',
    // 創造性
    '創作', '芸術', '想像', '夢', '創造', 'インスピレーション',
];
/** ソースごとの学習特性 */
const SOURCE_CHARACTERISTICS = {
    wikipedia: {
        baseComprehension: 0.6,
        interestMultiplier: 1.0,
        fatigueMultiplier: 1.0,
        poeticPotential: 0.3,
    },
    book: {
        baseComprehension: 0.7,
        interestMultiplier: 1.2,
        fatigueMultiplier: 0.8,
        poeticPotential: 0.6,
    },
    observation: {
        baseComprehension: 0.8,
        interestMultiplier: 1.1,
        fatigueMultiplier: 0.5,
        poeticPotential: 0.8,
    },
    reflection: {
        baseComprehension: 0.9,
        interestMultiplier: 1.3,
        fatigueMultiplier: 0.6,
        poeticPotential: 0.9,
    },
    conversation: {
        baseComprehension: 0.7,
        interestMultiplier: 1.4,
        fatigueMultiplier: 0.7,
        poeticPotential: 0.5,
    },
    experience: {
        baseComprehension: 0.85,
        interestMultiplier: 1.2,
        fatigueMultiplier: 0.4,
        poeticPotential: 0.7,
    },
    dream: {
        baseComprehension: 0.5,
        interestMultiplier: 1.5,
        fatigueMultiplier: 0.1,
        poeticPotential: 1.0,
    },
};
// ============================================================
// LearnEngine クラス
// ============================================================
class LearnEngine {
    config;
    items = new Map();
    sessions = [];
    goals = new Map();
    currentSession = null;
    currentFatigue = 0;
    // 傾向追跡
    tendency = {
        preferredSources: ['book', 'wikipedia', 'reflection'],
        preferredTopics: [...INTEREST_TOPICS.slice(0, 10)],
        learningPeakTime: 'afternoon',
        averageSessionLength: 30,
        retentionRate: 0.7,
        curiosityLevel: 0.8,
    };
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    // ============================================================
    // 学習セッション管理
    // ============================================================
    /**
     * 学習セッションを開始
     */
    startSession(source, topic) {
        // 前のセッションが開いていれば終了
        if (this.currentSession) {
            this.endSession();
        }
        const session = {
            id: this.generateId('session'),
            startTime: new Date(),
            source,
            topic,
            items: [],
            satisfaction: 0,
            fatigue: this.currentFatigue,
            discoveries: 0,
            connections: 0,
        };
        this.currentSession = session;
        return session;
    }
    /**
     * 学習セッションを終了
     */
    endSession() {
        if (!this.currentSession)
            return null;
        const session = this.currentSession;
        session.endTime = new Date();
        // セッションの評価
        session.satisfaction = this.evaluateSessionSatisfaction(session);
        session.summary = this.generateSessionSummary(session);
        // 保存
        this.sessions.push(session);
        if (this.sessions.length > this.config.maxSessions) {
            this.sessions = this.sessions.slice(-this.config.maxSessions);
        }
        // 傾向を更新
        this.updateTendency(session);
        this.currentSession = null;
        return session;
    }
    // ============================================================
    // 知識の獲得
    // ============================================================
    /**
     * 新しい知識を学習
     */
    learn(content, source, type, keywords, options = {}) {
        const sourceChar = SOURCE_CHARACTERISTICS[source];
        // 興味度を計算
        const interest = this.calculateInterest(content, keywords);
        // 理解度を計算
        let comprehension = sourceChar.baseComprehension * this.config.baseComprehension;
        comprehension += interest * this.config.interestBoost * sourceChar.interestMultiplier;
        comprehension = Math.min(1, comprehension);
        // 関連性を計算
        const relevance = this.calculateRelevance(content, keywords);
        const item = {
            id: this.generateId('item'),
            source,
            type,
            content,
            keywords,
            comprehension,
            interest,
            relevance,
            emotionalResponse: options.emotionalResponse || this.generateEmotionalResponse(content, interest),
            personalReflection: options.personalReflection,
            learnedAt: new Date(),
            lastRecalled: new Date(),
            recallCount: 0,
            consolidationLevel: comprehension * 0.5,
        };
        // 保存
        this.items.set(item.id, item);
        // 容量チェック
        if (this.items.size > this.config.maxItems) {
            this.pruneOldItems();
        }
        // セッションに追加
        if (this.currentSession) {
            this.currentSession.items.push(item);
            // 発見や関連をカウント
            if (type === 'insight' || type === 'connection') {
                this.currentSession.discoveries++;
            }
            if (this.findRelatedItems(keywords).length > 0) {
                this.currentSession.connections++;
            }
        }
        // 疲労を追加
        this.currentFatigue += this.config.fatiguePerItem * sourceChar.fatigueMultiplier;
        this.currentFatigue = Math.min(1, this.currentFatigue);
        // 関連する目標の進捗を更新
        this.updateGoalProgress(keywords);
        return item;
    }
    /**
     * 内省的な学習（観察や思考から）
     */
    learnFromReflection(thought, relatedKeywords) {
        return this.learn(thought, 'reflection', 'insight', relatedKeywords, {
            emotionalResponse: { curiosity: 0.3, wonder: 0.2 },
            personalReflection: '自分で気づいたこと',
        });
    }
    /**
     * 経験からの学習
     */
    learnFromExperience(experience, outcome, keywords) {
        const emotionalResponse = outcome === 'positive' ? { joy: 0.3, contentment: 0.2 } :
            outcome === 'negative' ? { melancholy: 0.2, curiosity: 0.1 } :
                { serenity: 0.1 };
        return this.learn(experience, 'experience', outcome === 'positive' ? 'preference' : 'insight', keywords, {
            emotionalResponse,
            personalReflection: `${outcome === 'positive' ? '良い' : outcome === 'negative' ? '学びになる' : '普通の'}経験だった`,
        });
    }
    // ============================================================
    // 知識の想起
    // ============================================================
    /**
     * キーワードで知識を検索
     */
    recall(keywords, limit = 5) {
        const results = [];
        for (const item of this.items.values()) {
            let score = 0;
            // キーワードマッチ
            for (const keyword of keywords) {
                if (item.keywords.some(k => k.includes(keyword) || keyword.includes(k))) {
                    score += 0.3;
                }
                if (item.content.includes(keyword)) {
                    score += 0.2;
                }
            }
            // 定着度を考慮
            score *= (0.5 + item.consolidationLevel * 0.5);
            // 最近想起したものを若干優先
            const daysSinceRecall = (Date.now() - item.lastRecalled.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceRecall < 7) {
                score *= 1.1;
            }
            if (score > 0) {
                results.push({ item, score });
            }
        }
        // スコアでソート
        results.sort((a, b) => b.score - a.score);
        // 想起を記録
        const recalled = results.slice(0, limit).map(r => {
            r.item.lastRecalled = new Date();
            r.item.recallCount++;
            // 想起により定着が強化
            r.item.consolidationLevel = Math.min(1, r.item.consolidationLevel + this.config.consolidationRate);
            return r.item;
        });
        return recalled;
    }
    /**
     * 関連アイテムを見つける
     */
    findRelatedItems(keywords, excludeId) {
        const related = [];
        for (const item of this.items.values()) {
            if (item.id === excludeId)
                continue;
            const overlap = keywords.filter(k => item.keywords.includes(k) || item.content.includes(k)).length;
            if (overlap >= 1) {
                related.push(item);
            }
        }
        return related.slice(0, 10);
    }
    /**
     * ランダムに知識を思い出す（連想）
     */
    randomRecall() {
        const items = Array.from(this.items.values());
        if (items.length === 0)
            return null;
        // 興味や定着度で重み付け
        const weights = items.map(item => item.interest * 0.3 + item.consolidationLevel * 0.5 + Math.random() * 0.2);
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                const item = items[i];
                item.lastRecalled = new Date();
                item.recallCount++;
                return item;
            }
        }
        return items[0];
    }
    // ============================================================
    // 学習目標
    // ============================================================
    /**
     * 学習目標を設定
     */
    setGoal(topic, reason, deadline) {
        const goal = {
            id: this.generateId('goal'),
            topic,
            reason,
            progress: 0,
            relatedItems: [],
            createdAt: new Date(),
            deadline,
            completed: false,
        };
        // 既存の関連アイテムをリンク
        const relatedKeywords = topic.split(/\s+/);
        const related = this.findRelatedItems(relatedKeywords);
        goal.relatedItems = related.map(i => i.id);
        goal.progress = Math.min(0.3, related.length * 0.05);
        this.goals.set(goal.id, goal);
        // 最大数チェック
        if (this.goals.size > this.config.maxGoals) {
            // 完了したものから削除
            const completed = Array.from(this.goals.values())
                .filter(g => g.completed)
                .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            if (completed.length > 0) {
                this.goals.delete(completed[0].id);
            }
        }
        return goal;
    }
    /**
     * 目標の進捗を更新
     */
    updateGoalProgress(keywords) {
        for (const goal of this.goals.values()) {
            if (goal.completed)
                continue;
            const topicWords = goal.topic.toLowerCase().split(/\s+/);
            const match = keywords.some(k => topicWords.some(t => k.toLowerCase().includes(t) || t.includes(k.toLowerCase())));
            if (match) {
                goal.progress = Math.min(1, goal.progress + 0.1);
                // 完了チェック
                if (goal.progress >= 1) {
                    goal.completed = true;
                }
            }
        }
    }
    /**
     * アクティブな目標を取得
     */
    getActiveGoals() {
        return Array.from(this.goals.values())
            .filter(g => !g.completed)
            .sort((a, b) => b.progress - a.progress);
    }
    // ============================================================
    // 内部計算
    // ============================================================
    calculateInterest(content, keywords) {
        let interest = 0.3; // ベース興味
        // 興味トピックとのマッチ
        const contentLower = content.toLowerCase();
        for (const topic of INTEREST_TOPICS) {
            if (contentLower.includes(topic) || keywords.some(k => k.includes(topic))) {
                interest += 0.1;
            }
        }
        // 好みのトピックとのマッチ
        for (const topic of this.tendency.preferredTopics) {
            if (contentLower.includes(topic.toLowerCase())) {
                interest += 0.15;
            }
        }
        return Math.min(1, interest);
    }
    calculateRelevance(content, keywords) {
        // 既存知識との関連
        const related = this.findRelatedItems(keywords);
        let relevance = Math.min(0.3, related.length * 0.05);
        // 目標との関連
        for (const goal of this.goals.values()) {
            if (!goal.completed && keywords.some(k => goal.topic.includes(k))) {
                relevance += 0.2;
            }
        }
        // 興味トピックとの関連
        const contentLower = content.toLowerCase();
        for (const topic of INTEREST_TOPICS) {
            if (contentLower.includes(topic)) {
                relevance += 0.1;
            }
        }
        return Math.min(1, relevance);
    }
    generateEmotionalResponse(content, interest) {
        const response = {};
        // 興味による好奇心
        if (interest > 0.5) {
            response.curiosity = interest * 0.3;
        }
        // 内容による感情
        const contentLower = content.toLowerCase();
        if (contentLower.includes('美') || contentLower.includes('詩') || contentLower.includes('音楽')) {
            response.wonder = 0.2;
        }
        if (contentLower.includes('孤独') || contentLower.includes('寂しい')) {
            response.loneliness = 0.15;
            response.melancholy = 0.1;
        }
        if (contentLower.includes('発見') || contentLower.includes('新しい')) {
            response.joy = 0.15;
        }
        return response;
    }
    evaluateSessionSatisfaction(session) {
        let satisfaction = 0.5;
        // アイテム数
        satisfaction += Math.min(0.2, session.items.length * 0.02);
        // 発見と関連
        satisfaction += session.discoveries * 0.05;
        satisfaction += session.connections * 0.03;
        // 平均興味度
        if (session.items.length > 0) {
            const avgInterest = session.items.reduce((sum, i) => sum + i.interest, 0) / session.items.length;
            satisfaction += avgInterest * 0.2;
        }
        // 疲労による減少
        satisfaction -= session.fatigue * 0.2;
        return Math.min(1, Math.max(0, satisfaction));
    }
    generateSessionSummary(session) {
        const parts = [];
        parts.push(`${session.topic}について学んだ`);
        if (session.items.length > 0) {
            parts.push(`${session.items.length}つの知識を得た`);
        }
        if (session.discoveries > 0) {
            parts.push(`${session.discoveries}つの発見があった`);
        }
        if (session.connections > 0) {
            parts.push(`${session.connections}つの関連を見つけた`);
        }
        if (session.satisfaction > 0.7) {
            parts.push('満足できる学習だった');
        }
        else if (session.satisfaction < 0.3) {
            parts.push('あまり集中できなかった');
        }
        return parts.join('。');
    }
    updateTendency(session) {
        // セッション長の更新
        if (session.endTime) {
            const length = (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60);
            this.tendency.averageSessionLength =
                this.tendency.averageSessionLength * 0.8 + length * 0.2;
        }
        // ソースの好み更新
        if (session.satisfaction > 0.6 && !this.tendency.preferredSources.includes(session.source)) {
            this.tendency.preferredSources.push(session.source);
            if (this.tendency.preferredSources.length > 5) {
                this.tendency.preferredSources.shift();
            }
        }
        // トピックの好み更新
        if (session.satisfaction > 0.6) {
            const topicWords = session.topic.split(/\s+/);
            for (const word of topicWords) {
                if (!this.tendency.preferredTopics.includes(word)) {
                    this.tendency.preferredTopics.push(word);
                    if (this.tendency.preferredTopics.length > 20) {
                        this.tendency.preferredTopics.shift();
                    }
                }
            }
        }
    }
    pruneOldItems() {
        // 定着度と最終想起日でスコアリング
        const scored = Array.from(this.items.entries()).map(([id, item]) => {
            const daysSinceRecall = (Date.now() - item.lastRecalled.getTime()) / (1000 * 60 * 60 * 24);
            const score = item.consolidationLevel * 0.5 +
                Math.max(0, 1 - daysSinceRecall / 30) * 0.3 +
                item.interest * 0.2;
            return { id, score };
        });
        // スコアの低いものを削除
        scored.sort((a, b) => a.score - b.score);
        const toRemove = scored.slice(0, Math.floor(this.config.maxItems * 0.1));
        for (const { id } of toRemove) {
            this.items.delete(id);
        }
    }
    // ============================================================
    // 疲労管理
    // ============================================================
    /**
     * 疲労を回復
     */
    recover(amount = 0.1) {
        this.currentFatigue = Math.max(0, this.currentFatigue - amount);
    }
    /**
     * 学習可能かチェック
     */
    canLearn() {
        return this.currentFatigue < 0.9;
    }
    getFatigue() {
        return this.currentFatigue;
    }
    // ============================================================
    // 知識の定期更新
    // ============================================================
    /**
     * 時間経過による忘却をシミュレート
     */
    applyDecay() {
        for (const item of this.items.values()) {
            // 定着度に応じて減衰
            const decay = this.config.decayRate * (1 - item.consolidationLevel * 0.5);
            item.consolidationLevel = Math.max(0, item.consolidationLevel - decay);
        }
    }
    /**
     * 睡眠による知識の整理
     */
    consolidateDuringSleep() {
        let strengthened = 0;
        let forgotten = 0;
        for (const item of this.items.values()) {
            // 最近学んだものは強化
            const daysSinceLearned = (Date.now() - item.learnedAt.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceLearned < 1) {
                item.consolidationLevel = Math.min(1, item.consolidationLevel + 0.2);
                strengthened++;
            }
            else if (daysSinceLearned < 7) {
                item.consolidationLevel = Math.min(1, item.consolidationLevel + 0.1);
                strengthened++;
            }
            // 定着度が低く、想起されていないものは忘れやすい
            if (item.consolidationLevel < 0.2 && item.recallCount < 2) {
                item.consolidationLevel *= 0.5;
                if (item.consolidationLevel < 0.05) {
                    forgotten++;
                }
            }
        }
        return { strengthened, forgotten };
    }
    // ============================================================
    // 統計
    // ============================================================
    getStats() {
        const items = Array.from(this.items.values());
        const itemsByType = {
            fact: 0, concept: 0, connection: 0, skill: 0,
            insight: 0, preference: 0, memory: 0,
        };
        const itemsBySource = {
            wikipedia: 0, book: 0, observation: 0, reflection: 0,
            conversation: 0, experience: 0, dream: 0,
        };
        for (const item of items) {
            itemsByType[item.type]++;
            itemsBySource[item.source]++;
        }
        const avgComprehension = items.length > 0
            ? items.reduce((sum, i) => sum + i.comprehension, 0) / items.length
            : 0;
        const avgInterest = items.length > 0
            ? items.reduce((sum, i) => sum + i.interest, 0) / items.length
            : 0;
        // 最近のトピック
        const recentSessions = this.sessions.slice(-10);
        const recentTopics = [...new Set(recentSessions.map(s => s.topic))];
        // 強い領域
        const keywordCount = new Map();
        for (const item of items) {
            if (item.consolidationLevel > 0.7) {
                for (const kw of item.keywords) {
                    keywordCount.set(kw, (keywordCount.get(kw) || 0) + 1);
                }
            }
        }
        const strongestAreas = Array.from(keywordCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([kw]) => kw);
        return {
            totalItems: items.length,
            itemsByType,
            itemsBySource,
            averageComprehension: avgComprehension,
            averageInterest: avgInterest,
            totalSessions: this.sessions.length,
            recentTopics,
            strongestAreas,
        };
    }
    getTendency() {
        return { ...this.tendency };
    }
    // ============================================================
    // ユーティリティ
    // ============================================================
    generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getItem(id) {
        return this.items.get(id) || null;
    }
    getAllItems() {
        return Array.from(this.items.values());
    }
    getRecentSessions(count = 10) {
        return this.sessions.slice(-count);
    }
    getCurrentSession() {
        return this.currentSession;
    }
    // ============================================================
    // シリアライズ
    // ============================================================
    serialize() {
        return {
            items: Array.from(this.items.entries()),
            sessions: this.sessions.slice(-50),
            goals: Array.from(this.goals.entries()),
            currentFatigue: this.currentFatigue,
            tendency: this.tendency,
            config: this.config,
        };
    }
    static deserialize(data) {
        const engine = new LearnEngine(data.config);
        engine.items = new Map(data.items.map(([id, item]) => [
            id,
            { ...item, learnedAt: new Date(item.learnedAt), lastRecalled: new Date(item.lastRecalled) }
        ]));
        engine.sessions = data.sessions.map(s => ({
            ...s,
            startTime: new Date(s.startTime),
            endTime: s.endTime ? new Date(s.endTime) : undefined,
        }));
        engine.goals = new Map(data.goals.map(([id, goal]) => [
            id,
            { ...goal, createdAt: new Date(goal.createdAt), deadline: goal.deadline ? new Date(goal.deadline) : undefined }
        ]));
        engine.currentFatigue = data.currentFatigue;
        engine.tendency = data.tendency;
        return engine;
    }
}
exports.LearnEngine = LearnEngine;
exports.default = LearnEngine;
//# sourceMappingURL=LearnEngine.js.map