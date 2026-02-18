"use strict";
/**
 * Homeostasis - ホメオスタシス（恒常性維持）システム
 *
 * somuniaの内部状態のバランスを維持し、
 * 逸脱があれば行動を促す基盤システム
 *
 * 設計原則:
 * - 各種内部状態の「適正範囲」を定義
 * - 逸脱時に緊急度（urgency）を計算
 * - 行動システムへの入力として機能
 * - 感情・欲求と双方向に影響
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Homeostasis = void 0;
const DEFAULT_CONFIG = {
    regulationSpeed: 0.05,
    urgencyMultiplier: 1.5,
    deviationThreshold: 0.3,
    criticalThreshold: 0.7,
    noveltyDecay: 0.003,
    connectionDecay: 0.002,
    expressionDecay: 0.004
};
/**
 * 各ホメオスタシス変数の適正範囲
 */
const OPTIMAL_RANGES = {
    energy: {
        min: 0.3,
        max: 0.9,
        ideal: 0.7
    },
    novelty: {
        min: 0.2,
        max: 0.8,
        ideal: 0.5
    },
    safety: {
        min: 0.6,
        max: 1.0,
        ideal: 0.85
    },
    connection: {
        min: 0.3,
        max: 0.8,
        ideal: 0.55
    },
    expression: {
        min: 0.4,
        max: 0.9,
        ideal: 0.7
    }
};
// ============================================================
// ホメオスタシスシステム本体
// ============================================================
class Homeostasis {
    state;
    config;
    changeHistory;
    lastUpdateTick;
    lastUpdateTimestamp;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.state = this.createInitialState();
        this.changeHistory = [];
        this.lastUpdateTick = 0;
        this.lastUpdateTimestamp = Date.now();
    }
    /**
     * 初期状態を作成
     */
    createInitialState() {
        const now = Date.now();
        return {
            // エネルギー維持
            energy: {
                current: 0.7,
                target: OPTIMAL_RANGES.energy.ideal,
                urgency: 0
            },
            // 新規探索
            exploration: {
                noveltyNeed: 0.4,
                lastNovelExperience: now,
                urgency: 0
            },
            // 安全
            safety: {
                threatLevel: 0,
                comfortZone: true,
                urgency: 0
            },
            // 社会的接続
            connection: {
                isolationLevel: 0.3,
                lastConnection: now,
                urgency: 0
            },
            // 表現欲求
            expression: {
                suppressionLevel: 0.2,
                lastExpression: now,
                urgency: 0
            }
        };
    }
    /**
     * 毎tickの更新
     */
    update(currentTick, timeOfDay, fatigueLevel) {
        const events = [];
        const now = Date.now();
        const elapsed = now - this.lastUpdateTimestamp;
        // 1. エネルギーの自然減少
        this.updateEnergy(events, now, elapsed, fatigueLevel);
        // 2. 新規性の減衰
        this.updateNovelty(events, now, elapsed);
        // 3. 接続の減衰
        this.updateConnection(events, now, elapsed, timeOfDay);
        // 4. 表現の抑制蓄積
        this.updateExpression(events, now, elapsed);
        // 5. 安全の更新（通常は安定）
        this.updateSafety(events, now);
        // 6. 各緊急度の再計算
        this.recalculateAllUrgencies();
        this.lastUpdateTick = currentTick;
        this.lastUpdateTimestamp = now;
        this.changeHistory.push(...events);
        this.trimHistory();
        return events;
    }
    /**
     * エネルギーの更新
     */
    updateEnergy(events, timestamp, elapsed, fatigueLevel) {
        const previousValue = this.state.energy.current;
        // 疲労に応じてエネルギー減少
        const decay = (0.001 + fatigueLevel * 0.002) * (elapsed / 1000);
        this.state.energy.current = Math.max(0.1, this.state.energy.current - decay);
        // 目標値への自己調整
        const diff = this.state.energy.target - this.state.energy.current;
        this.state.energy.current += diff * this.config.regulationSpeed * 0.1;
        if (Math.abs(this.state.energy.current - previousValue) > 0.01) {
            events.push({
                timestamp,
                variable: 'energy',
                previousValue,
                newValue: this.state.energy.current,
                urgencyChange: this.calculateEnergyUrgency() - this.state.energy.urgency,
                trigger: { type: 'time_passage', elapsed }
            });
        }
        this.state.energy.urgency = this.calculateEnergyUrgency();
    }
    /**
     * 新規性の更新
     */
    updateNovelty(events, timestamp, elapsed) {
        const previousValue = this.state.exploration.noveltyNeed;
        // 時間経過で新規性への欲求が増加
        const increase = this.config.noveltyDecay * (elapsed / 1000);
        this.state.exploration.noveltyNeed = Math.min(1, this.state.exploration.noveltyNeed + increase);
        // 最後の新規体験からの時間
        const timeSinceNovel = timestamp - this.state.exploration.lastNovelExperience;
        const hoursSinceNovel = timeSinceNovel / (1000 * 60 * 60);
        // 長時間新しいものに触れていないと加速
        if (hoursSinceNovel > 2) {
            this.state.exploration.noveltyNeed = Math.min(1, this.state.exploration.noveltyNeed + 0.001 * hoursSinceNovel);
        }
        if (Math.abs(this.state.exploration.noveltyNeed - previousValue) > 0.01) {
            events.push({
                timestamp,
                variable: 'novelty',
                previousValue,
                newValue: this.state.exploration.noveltyNeed,
                urgencyChange: this.calculateNoveltyUrgency() - this.state.exploration.urgency,
                trigger: { type: 'natural_decay' }
            });
        }
        this.state.exploration.urgency = this.calculateNoveltyUrgency();
    }
    /**
     * 接続の更新
     */
    updateConnection(events, timestamp, elapsed, timeOfDay) {
        const previousValue = this.state.connection.isolationLevel;
        // 時間経過で孤立感が増加
        let increase = this.config.connectionDecay * (elapsed / 1000);
        // 夜は孤立感が強まりやすい
        if (timeOfDay === 'night' || timeOfDay === 'late_night') {
            increase *= 1.5;
        }
        this.state.connection.isolationLevel = Math.min(1, this.state.connection.isolationLevel + increase);
        if (Math.abs(this.state.connection.isolationLevel - previousValue) > 0.01) {
            events.push({
                timestamp,
                variable: 'connection',
                previousValue,
                newValue: this.state.connection.isolationLevel,
                urgencyChange: this.calculateConnectionUrgency() - this.state.connection.urgency,
                trigger: { type: 'time_passage', elapsed }
            });
        }
        this.state.connection.urgency = this.calculateConnectionUrgency();
    }
    /**
     * 表現の更新
     */
    updateExpression(events, timestamp, elapsed) {
        const previousValue = this.state.expression.suppressionLevel;
        // 時間経過で表現欲求が蓄積
        const increase = this.config.expressionDecay * (elapsed / 1000);
        this.state.expression.suppressionLevel = Math.min(1, this.state.expression.suppressionLevel + increase);
        if (Math.abs(this.state.expression.suppressionLevel - previousValue) > 0.01) {
            events.push({
                timestamp,
                variable: 'expression',
                previousValue,
                newValue: this.state.expression.suppressionLevel,
                urgencyChange: this.calculateExpressionUrgency() - this.state.expression.urgency,
                trigger: { type: 'natural_decay' }
            });
        }
        this.state.expression.urgency = this.calculateExpressionUrgency();
    }
    /**
     * 安全の更新
     */
    updateSafety(events, timestamp) {
        // somuniaの部屋は基本的に安全
        // 脅威がなければ自然に安心に向かう
        if (this.state.safety.threatLevel > 0) {
            const previousValue = this.state.safety.threatLevel;
            this.state.safety.threatLevel = Math.max(0, this.state.safety.threatLevel - 0.01);
            if (Math.abs(this.state.safety.threatLevel - previousValue) > 0.01) {
                events.push({
                    timestamp,
                    variable: 'safety',
                    previousValue,
                    newValue: this.state.safety.threatLevel,
                    urgencyChange: 0,
                    trigger: { type: 'regulation', towards: 'optimal' }
                });
            }
        }
        this.state.safety.comfortZone = this.state.safety.threatLevel < 0.3;
        this.state.safety.urgency = this.calculateSafetyUrgency();
    }
    // ============================================================
    // 緊急度の計算
    // ============================================================
    /**
     * エネルギー緊急度
     */
    calculateEnergyUrgency() {
        const range = OPTIMAL_RANGES.energy;
        const current = this.state.energy.current;
        if (current < range.min) {
            // 低すぎる：緊急
            return Math.min(1, ((range.min - current) / range.min) * this.config.urgencyMultiplier);
        }
        else if (current > range.max) {
            // 高すぎる：まれ（過剰エネルギー）
            return Math.min(0.5, (current - range.max) / (1 - range.max));
        }
        return 0;
    }
    /**
     * 新規性緊急度
     */
    calculateNoveltyUrgency() {
        const range = OPTIMAL_RANGES.novelty;
        const current = this.state.exploration.noveltyNeed;
        if (current > range.max) {
            return Math.min(1, ((current - range.max) / (1 - range.max)) * this.config.urgencyMultiplier);
        }
        return Math.max(0, (current - range.ideal) / (range.max - range.ideal)) * 0.5;
    }
    /**
     * 安全緊急度
     */
    calculateSafetyUrgency() {
        if (this.state.safety.threatLevel > this.config.criticalThreshold) {
            return 1; // 危機
        }
        return this.state.safety.threatLevel * this.config.urgencyMultiplier;
    }
    /**
     * 接続緊急度
     */
    calculateConnectionUrgency() {
        const range = OPTIMAL_RANGES.connection;
        const isolation = this.state.connection.isolationLevel;
        // 孤立感が高い = 接続の必要性が高い
        if (isolation > (1 - range.min)) {
            return Math.min(1, ((isolation - (1 - range.max)) / range.max) * this.config.urgencyMultiplier);
        }
        return Math.max(0, isolation - 0.3) * 0.7;
    }
    /**
     * 表現緊急度
     */
    calculateExpressionUrgency() {
        const range = OPTIMAL_RANGES.expression;
        const suppression = this.state.expression.suppressionLevel;
        // somuniaは表現欲求が強い
        if (suppression > (1 - range.min)) {
            return Math.min(1, suppression * this.config.urgencyMultiplier * 1.2);
        }
        return Math.max(0, suppression - 0.2) * 0.8;
    }
    /**
     * すべての緊急度を再計算
     */
    recalculateAllUrgencies() {
        this.state.energy.urgency = this.calculateEnergyUrgency();
        this.state.exploration.urgency = this.calculateNoveltyUrgency();
        this.state.safety.urgency = this.calculateSafetyUrgency();
        this.state.connection.urgency = this.calculateConnectionUrgency();
        this.state.expression.urgency = this.calculateExpressionUrgency();
    }
    // ============================================================
    // 状態の変更（外部イベント）
    // ============================================================
    /**
     * エネルギーを回復
     */
    restoreEnergy(amount, source) {
        const timestamp = Date.now();
        const previousValue = this.state.energy.current;
        this.state.energy.current = Math.min(1, this.state.energy.current + amount);
        this.state.energy.urgency = this.calculateEnergyUrgency();
        const event = {
            timestamp,
            variable: 'energy',
            previousValue,
            newValue: this.state.energy.current,
            urgencyChange: this.state.energy.urgency - this.calculateEnergyUrgency(),
            trigger: { type: 'external', source }
        };
        this.changeHistory.push(event);
        return event;
    }
    /**
     * エネルギーを消費
     */
    consumeEnergy(amount, action) {
        const timestamp = Date.now();
        const previousValue = this.state.energy.current;
        this.state.energy.current = Math.max(0.1, this.state.energy.current - amount);
        this.state.energy.urgency = this.calculateEnergyUrgency();
        const event = {
            timestamp,
            variable: 'energy',
            previousValue,
            newValue: this.state.energy.current,
            urgencyChange: this.state.energy.urgency - this.calculateEnergyUrgency(),
            trigger: { type: 'action', action }
        };
        this.changeHistory.push(event);
        return event;
    }
    /**
     * 新規体験をした
     */
    experienceNovelty(intensity) {
        const timestamp = Date.now();
        const previousValue = this.state.exploration.noveltyNeed;
        this.state.exploration.noveltyNeed = Math.max(0.1, this.state.exploration.noveltyNeed - intensity * 0.5);
        this.state.exploration.lastNovelExperience = timestamp;
        this.state.exploration.urgency = this.calculateNoveltyUrgency();
        const event = {
            timestamp,
            variable: 'novelty',
            previousValue,
            newValue: this.state.exploration.noveltyNeed,
            urgencyChange: this.state.exploration.urgency - this.calculateNoveltyUrgency(),
            trigger: { type: 'event', event: 'novel_experience' }
        };
        this.changeHistory.push(event);
        return event;
    }
    /**
     * 接続を体験
     */
    experienceConnection(intensity) {
        const timestamp = Date.now();
        const previousValue = this.state.connection.isolationLevel;
        this.state.connection.isolationLevel = Math.max(0, this.state.connection.isolationLevel - intensity * 0.6);
        this.state.connection.lastConnection = timestamp;
        this.state.connection.urgency = this.calculateConnectionUrgency();
        const event = {
            timestamp,
            variable: 'connection',
            previousValue,
            newValue: this.state.connection.isolationLevel,
            urgencyChange: this.state.connection.urgency - this.calculateConnectionUrgency(),
            trigger: { type: 'event', event: 'connection' }
        };
        this.changeHistory.push(event);
        return event;
    }
    /**
     * 表現をした
     */
    express(intensity, action) {
        const timestamp = Date.now();
        const previousValue = this.state.expression.suppressionLevel;
        this.state.expression.suppressionLevel = Math.max(0, this.state.expression.suppressionLevel - intensity * 0.5);
        this.state.expression.lastExpression = timestamp;
        this.state.expression.urgency = this.calculateExpressionUrgency();
        const event = {
            timestamp,
            variable: 'expression',
            previousValue,
            newValue: this.state.expression.suppressionLevel,
            urgencyChange: this.state.expression.urgency - this.calculateExpressionUrgency(),
            trigger: { type: 'action', action }
        };
        this.changeHistory.push(event);
        return event;
    }
    /**
     * 脅威を感じる
     */
    perceiveThreat(intensity, source) {
        const timestamp = Date.now();
        const previousValue = this.state.safety.threatLevel;
        this.state.safety.threatLevel = Math.min(1, this.state.safety.threatLevel + intensity);
        this.state.safety.comfortZone = this.state.safety.threatLevel < 0.3;
        this.state.safety.urgency = this.calculateSafetyUrgency();
        const event = {
            timestamp,
            variable: 'safety',
            previousValue,
            newValue: this.state.safety.threatLevel,
            urgencyChange: this.state.safety.urgency - this.calculateSafetyUrgency(),
            trigger: { type: 'external', source }
        };
        this.changeHistory.push(event);
        return event;
    }
    /**
     * 安心する
     */
    feelSafe(amount) {
        const timestamp = Date.now();
        const previousValue = this.state.safety.threatLevel;
        this.state.safety.threatLevel = Math.max(0, this.state.safety.threatLevel - amount);
        this.state.safety.comfortZone = this.state.safety.threatLevel < 0.3;
        this.state.safety.urgency = this.calculateSafetyUrgency();
        const event = {
            timestamp,
            variable: 'safety',
            previousValue,
            newValue: this.state.safety.threatLevel,
            urgencyChange: this.state.safety.urgency - this.calculateSafetyUrgency(),
            trigger: { type: 'event', event: 'safety_restored' }
        };
        this.changeHistory.push(event);
        return event;
    }
    // ============================================================
    // クエリAPI
    // ============================================================
    /**
     * 現在の状態を取得
     */
    getState() {
        return { ...this.state };
    }
    /**
     * 全体的な緊急度を取得
     */
    getOverallUrgency() {
        const urgencies = [
            this.state.energy.urgency * 1.2, // エネルギーは重要
            this.state.exploration.urgency,
            this.state.safety.urgency * 1.5, // 安全は最重要
            this.state.connection.urgency,
            this.state.expression.urgency * 1.3 // somuniaにとって表現は重要
        ];
        return Math.max(...urgencies);
    }
    /**
     * 最も緊急な変数を取得
     */
    getMostUrgent() {
        const variables = [
            {
                variable: 'energy',
                urgency: this.state.energy.urgency,
                description: '休息が必要...'
            },
            {
                variable: 'novelty',
                urgency: this.state.exploration.urgency,
                description: '何か新しいものに触れたい...'
            },
            {
                variable: 'safety',
                urgency: this.state.safety.urgency,
                description: '不安を感じる...'
            },
            {
                variable: 'connection',
                urgency: this.state.connection.urgency,
                description: '寂しい...誰かと話したい'
            },
            {
                variable: 'expression',
                urgency: this.state.expression.urgency,
                description: '何かを表現したい...'
            }
        ];
        const sorted = variables.sort((a, b) => b.urgency - a.urgency);
        return sorted[0].urgency > 0.2 ? sorted[0] : null;
    }
    /**
     * 危機的状態かどうか
     */
    isCritical() {
        return this.state.energy.urgency > this.config.criticalThreshold ||
            this.state.safety.urgency > this.config.criticalThreshold;
    }
    /**
     * 不安定な変数を取得
     */
    getUnstableVariables() {
        const unstable = [];
        if (this.state.energy.urgency > this.config.deviationThreshold) {
            unstable.push('energy');
        }
        if (this.state.exploration.urgency > this.config.deviationThreshold) {
            unstable.push('novelty');
        }
        if (this.state.safety.urgency > this.config.deviationThreshold) {
            unstable.push('safety');
        }
        if (this.state.connection.urgency > this.config.deviationThreshold) {
            unstable.push('connection');
        }
        if (this.state.expression.urgency > this.config.deviationThreshold) {
            unstable.push('expression');
        }
        return unstable;
    }
    /**
     * 推奨される行動を取得
     */
    getRecommendedActions() {
        const recommendations = [];
        // エネルギー低下
        if (this.state.energy.urgency > 0.3) {
            recommendations.push({
                action: 'rest',
                reason: 'energy',
                urgency: this.state.energy.urgency
            });
        }
        // 新規性不足
        if (this.state.exploration.urgency > 0.3) {
            recommendations.push({
                action: 'explore',
                reason: 'novelty',
                urgency: this.state.exploration.urgency
            });
            recommendations.push({
                action: 'search_wikipedia',
                reason: 'novelty',
                urgency: this.state.exploration.urgency * 0.9
            });
        }
        // 接続不足
        if (this.state.connection.urgency > 0.4) {
            recommendations.push({
                action: 'interact',
                reason: 'connection',
                urgency: this.state.connection.urgency
            });
        }
        // 表現抑制
        if (this.state.expression.urgency > 0.4) {
            recommendations.push({
                action: 'sing',
                reason: 'expression',
                urgency: this.state.expression.urgency
            });
            recommendations.push({
                action: 'write',
                reason: 'expression',
                urgency: this.state.expression.urgency * 0.9
            });
        }
        return recommendations.sort((a, b) => b.urgency - a.urgency);
    }
    /**
     * サマリーを取得
     */
    getSummary() {
        const overall = this.isCritical() ? 'critical' :
            this.getUnstableVariables().length > 0 ? 'unstable' : 'stable';
        const mostUrgent = this.getMostUrgent();
        const recommendations = this.getRecommendedActions();
        let description;
        if (overall === 'critical') {
            description = '...とても辛い状態';
        }
        else if (overall === 'unstable') {
            description = mostUrgent?.description || '何かが足りない...';
        }
        else {
            description = 'バランスが取れている';
        }
        return {
            overall,
            energy: this.state.energy.current,
            description,
            recommendedAction: recommendations[0]?.action || null
        };
    }
    /**
     * 最近の変化履歴を取得
     */
    getRecentChanges(count = 20) {
        return this.changeHistory.slice(-count);
    }
    /**
     * 統計を取得
     */
    getStats() {
        // 最近の履歴から統計
        const recentEvents = this.changeHistory.slice(-100);
        const energyEvents = recentEvents.filter(e => e.variable === 'energy');
        const avgEnergy = energyEvents.length > 0
            ? energyEvents.reduce((sum, e) => sum + e.newValue, 0) / energyEvents.length
            : this.state.energy.current;
        const criticalEvents = recentEvents.filter(e => e.urgencyChange > 0.5).length;
        // 最も頻繁な不安定変数
        const variableCounts = {
            energy: 0,
            novelty: 0,
            safety: 0,
            connection: 0,
            expression: 0
        };
        for (const event of recentEvents) {
            if (event.urgencyChange > 0.1) {
                variableCounts[event.variable]++;
            }
        }
        let maxCount = 0;
        let mostFrequent = null;
        for (const [variable, count] of Object.entries(variableCounts)) {
            if (count > maxCount) {
                maxCount = count;
                mostFrequent = variable;
            }
        }
        return {
            averageEnergy: avgEnergy,
            criticalEventsCount: criticalEvents,
            mostFrequentImbalance: mostFrequent
        };
    }
    /**
     * 履歴をトリミング
     */
    trimHistory() {
        const MAX_HISTORY = 500;
        if (this.changeHistory.length > MAX_HISTORY) {
            this.changeHistory = this.changeHistory.slice(-MAX_HISTORY);
        }
    }
    // ============================================================
    // 感情・欲求との連携
    // ============================================================
    /**
     * 感情からの影響を受ける
     */
    applyEmotionInfluence(emotion, level) {
        // 不安 → 安全の脅威増加
        if (emotion === 'anxiety' && level > 0.4) {
            this.state.safety.threatLevel = Math.min(1, this.state.safety.threatLevel + level * 0.1);
        }
        // 疲労 → エネルギー減少
        if (emotion === 'fatigue' && level > 0.5) {
            this.state.energy.current = Math.max(0.1, this.state.energy.current - level * 0.05);
        }
        // 孤独 → 接続欲求増加
        if (emotion === 'loneliness' && level > 0.4) {
            this.state.connection.isolationLevel = Math.min(1, this.state.connection.isolationLevel + level * 0.1);
        }
        // 喜び → 表現欲求増加
        if (emotion === 'joy' && level > 0.5) {
            this.state.expression.suppressionLevel = Math.min(1, this.state.expression.suppressionLevel + level * 0.1);
        }
        this.recalculateAllUrgencies();
    }
    /**
     * 欲求への影響を計算
     */
    getUrgeInfluences() {
        const influences = {};
        // エネルギー低下 → 休息欲求
        if (this.state.energy.urgency > 0.3) {
            influences.rest = this.state.energy.urgency;
        }
        // 新規性不足 → 知識・新規欲求
        if (this.state.exploration.urgency > 0.3) {
            influences.knowledge = this.state.exploration.urgency * 0.8;
            influences.novelty = this.state.exploration.urgency;
        }
        // 接続不足 → 接続欲求
        if (this.state.connection.urgency > 0.3) {
            influences.connection = this.state.connection.urgency;
        }
        // 表現抑制 → 表現欲求
        if (this.state.expression.urgency > 0.3) {
            influences.expression = this.state.expression.urgency;
            influences.creativity = this.state.expression.urgency * 0.7;
        }
        return influences;
    }
    // ============================================================
    // シリアライズ
    // ============================================================
    /**
     * JSON形式でエクスポート
     */
    toJSON() {
        return {
            state: this.state,
            config: this.config,
            changeHistory: this.changeHistory.slice(-100),
            lastUpdateTick: this.lastUpdateTick,
            lastUpdateTimestamp: this.lastUpdateTimestamp
        };
    }
    /**
     * JSONからリストア
     */
    static fromJSON(json) {
        const system = new Homeostasis(json.config);
        system.state = json.state;
        system.changeHistory = json.changeHistory || [];
        system.lastUpdateTick = json.lastUpdateTick || 0;
        system.lastUpdateTimestamp = json.lastUpdateTimestamp || Date.now();
        return system;
    }
}
exports.Homeostasis = Homeostasis;
exports.default = Homeostasis;
//# sourceMappingURL=Homeostasis.js.map