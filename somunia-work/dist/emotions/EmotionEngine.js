"use strict";
/**
 * EmotionEngine - 感情エンジン
 *
 * somuniaの感情状態を管理し、状況に応じて感情を生成・変化させる
 * LLMに依存せず、コードベースで感情の遷移を処理
 *
 * 設計原則:
 * - 感情は複数が同時に存在できる（多重感情）
 * - 感情には慣性（momentum）がある
 * - 環境・行動・記憶から感情が生まれる
 * - 揺らぎによる非合理的な感情変化もある
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmotionEngine = void 0;
const DEFAULT_CONFIG = {
    decayRate: 0.02,
    momentumRetention: 0.95,
    activationThreshold: 0.15,
    primaryThreshold: 0.4,
    maxChangePerTick: 0.15,
    emotionInteractionStrength: 0.3
};
// ============================================================
// 感情間の関係マトリックス
// ============================================================
/**
 * 感情間の関係を定義
 * 正の値: 相互強化
 * 負の値: 相互抑制
 */
const EMOTION_RELATIONS = {
    joy: {
        peace: 0.3,
        contentment: 0.5,
        warmth: 0.4,
        hope: 0.4,
        sadness: -0.4,
        anxiety: -0.5,
        loneliness: -0.3
    },
    peace: {
        contentment: 0.6,
        joy: 0.2,
        anxiety: -0.7,
        fear: -0.5,
        boredom: 0.1
    },
    curiosity: {
        wonder: 0.6,
        anticipation: 0.4,
        boredom: -0.7,
        contentment: -0.2
    },
    melancholy: {
        loneliness: 0.4,
        nostalgia: 0.5,
        peace: 0.1,
        joy: -0.3,
        curiosity: -0.2
    },
    loneliness: {
        melancholy: 0.4,
        anxiety: 0.3,
        warmth: -0.6,
        joy: -0.4
    },
    anxiety: {
        fear: 0.5,
        peace: -0.6,
        contentment: -0.4,
        joy: -0.4
    },
    contentment: {
        peace: 0.5,
        joy: 0.3,
        curiosity: -0.2,
        anxiety: -0.4
    },
    wonder: {
        curiosity: 0.5,
        joy: 0.3,
        boredom: -0.5
    },
    warmth: {
        joy: 0.3,
        peace: 0.3,
        loneliness: -0.6
    },
    fatigue: {
        peace: 0.1,
        curiosity: -0.4,
        anxiety: 0.2
    },
    boredom: {
        curiosity: -0.3,
        peace: -0.2,
        anxiety: 0.2
    },
    anticipation: {
        curiosity: 0.4,
        anxiety: 0.2,
        joy: 0.3
    },
    confusion: {
        anxiety: 0.3,
        curiosity: 0.2,
        peace: -0.3
    },
    nostalgia: {
        melancholy: 0.4,
        warmth: 0.3,
        peace: 0.2
    },
    hope: {
        joy: 0.3,
        anticipation: 0.5,
        anxiety: -0.2,
        fear: -0.3
    },
    fear: {
        anxiety: 0.6,
        peace: -0.6,
        joy: -0.5,
        curiosity: -0.3
    }
};
// ============================================================
// 時間帯と感情の傾向
// ============================================================
const TIME_EMOTION_BIAS = {
    dawn: {
        peace: 0.15,
        hope: 0.1,
        wonder: 0.1,
        fatigue: 0.05
    },
    morning: {
        peace: 0.1,
        curiosity: 0.1,
        anticipation: 0.05
    },
    midday: {
        curiosity: 0.1,
        contentment: 0.05
    },
    afternoon: {
        fatigue: 0.05,
        peace: 0.05
    },
    evening: {
        melancholy: 0.1,
        nostalgia: 0.1,
        peace: 0.1
    },
    night: {
        melancholy: 0.15,
        loneliness: 0.1,
        peace: 0.05
    },
    late_night: {
        loneliness: 0.15,
        anxiety: 0.1,
        melancholy: 0.1,
        wonder: 0.05
    }
};
// ============================================================
// 感情エンジン本体
// ============================================================
class EmotionEngine {
    state;
    config;
    changeHistory;
    patterns;
    lastUpdateTick;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.state = this.createInitialState();
        this.changeHistory = [];
        this.patterns = [];
        this.lastUpdateTick = 0;
    }
    /**
     * 初期状態を作成
     */
    createInitialState() {
        const allEmotions = [
            'joy', 'peace', 'curiosity', 'melancholy', 'loneliness',
            'anxiety', 'contentment', 'wonder', 'warmth', 'fatigue',
            'boredom', 'anticipation', 'confusion', 'nostalgia', 'hope', 'fear'
        ];
        const levels = {};
        const momentum = {};
        for (const emotion of allEmotions) {
            levels[emotion] = 0;
            momentum[emotion] = 0;
        }
        // somuniaの初期状態: 穏やかで少し物思いにふける
        levels.peace = 0.5;
        levels.melancholy = 0.2;
        levels.curiosity = 0.3;
        return {
            primary: 'peace',
            secondary: 'curiosity',
            levels,
            momentum,
            valence: 0.3,
            arousal: 0.3,
            lastSignificantChange: null
        };
    }
    /**
     * 感情パターンを登録
     */
    registerPatterns(patterns) {
        this.patterns = patterns;
    }
    /**
     * 感情パターンを追加
     */
    addPattern(pattern) {
        this.patterns.push(pattern);
    }
    /**
     * 毎tickの更新
     */
    update(currentTick, timeOfDay) {
        const changes = [];
        // 1. 自然な減衰
        this.applyDecay(changes);
        // 2. 慣性による変化
        this.applyMomentum(changes);
        // 3. 時間帯バイアス
        this.applyTimeBias(timeOfDay, changes);
        // 4. 感情間の相互作用
        this.applyEmotionInteractions(changes);
        // 5. 状態の正規化
        this.normalizeState();
        // 6. 主要感情の更新
        this.updatePrimarySecondary();
        // 7. valence/arousalの更新
        this.updateValenceArousal();
        this.lastUpdateTick = currentTick;
        if (changes.length > 0) {
            const event = {
                timestamp: Date.now(),
                trigger: { type: 'decay' },
                changes: changes.filter(c => Math.abs(c.delta) > 0.01)
            };
            this.changeHistory.push(event);
            this.trimHistory();
            return event;
        }
        return null;
    }
    /**
     * 特定の感情を直接変化させる
     */
    changeEmotion(emotion, delta, trigger) {
        const previousLevel = this.state.levels[emotion];
        const clampedDelta = Math.max(-this.config.maxChangePerTick, Math.min(this.config.maxChangePerTick, delta));
        const newLevel = Math.max(0, Math.min(1, previousLevel + clampedDelta));
        this.state.levels[emotion] = newLevel;
        // 慣性を更新
        this.state.momentum[emotion] = clampedDelta * 0.5;
        const change = {
            emotion,
            previousLevel,
            newLevel,
            delta: newLevel - previousLevel
        };
        // 相互作用
        const interactionChanges = this.propagateInteraction(emotion, clampedDelta);
        this.updatePrimarySecondary();
        this.updateValenceArousal();
        const event = {
            timestamp: Date.now(),
            trigger,
            changes: [change, ...interactionChanges]
        };
        // 大きな変化を記録
        if (Math.abs(clampedDelta) > 0.2) {
            this.state.lastSignificantChange = {
                emotion,
                timestamp: Date.now(),
                trigger: this.triggerToString(trigger)
            };
        }
        this.changeHistory.push(event);
        this.trimHistory();
        return event;
    }
    /**
     * 複数の感情を同時に変化させる
     */
    changeEmotions(changes, trigger) {
        const allChanges = [];
        for (const { emotion, delta } of changes) {
            const previousLevel = this.state.levels[emotion];
            const clampedDelta = Math.max(-this.config.maxChangePerTick * 2, // 複数変化時は許容幅を増やす
            Math.min(this.config.maxChangePerTick * 2, delta));
            const newLevel = Math.max(0, Math.min(1, previousLevel + clampedDelta));
            this.state.levels[emotion] = newLevel;
            this.state.momentum[emotion] = clampedDelta * 0.5;
            allChanges.push({
                emotion,
                previousLevel,
                newLevel,
                delta: newLevel - previousLevel
            });
        }
        this.updatePrimarySecondary();
        this.updateValenceArousal();
        const event = {
            timestamp: Date.now(),
            trigger,
            changes: allChanges.filter(c => Math.abs(c.delta) > 0.001)
        };
        this.changeHistory.push(event);
        this.trimHistory();
        return event;
    }
    /**
     * 感情パターンを適用
     */
    applyPattern(pattern) {
        const response = pattern.emotionalResponse;
        const changes = [
            { emotion: response.primaryEmotion, delta: response.intensity }
        ];
        return this.changeEmotions(changes, { type: 'pattern', patternId: pattern.id });
    }
    /**
     * 状況に基づいて感情パターンを検索し適用
     */
    respondToSituation(situation) {
        const matchingPattern = this.findMatchingPattern(situation);
        if (matchingPattern) {
            // パターンの強化回数を増やす（外部で管理）
            return this.applyPattern(matchingPattern);
        }
        return null;
    }
    /**
     * 訪問者イベントへの感情反応
     */
    respondToVisitor(event, familiarity) {
        const changes = [];
        switch (event) {
            case 'arrived':
                changes.push({ emotion: 'warmth', delta: 0.2 + familiarity * 0.2 }, { emotion: 'loneliness', delta: -0.3 }, { emotion: 'anticipation', delta: 0.15 });
                if (familiarity > 0.5) {
                    changes.push({ emotion: 'joy', delta: 0.15 });
                }
                break;
            case 'departed':
                changes.push({ emotion: 'loneliness', delta: 0.15 + familiarity * 0.1 }, { emotion: 'melancholy', delta: 0.1 }, { emotion: 'warmth', delta: -0.2 });
                if (familiarity > 0.7) {
                    changes.push({ emotion: 'nostalgia', delta: 0.1 });
                }
                break;
            case 'message':
                changes.push({ emotion: 'warmth', delta: 0.05 }, { emotion: 'curiosity', delta: 0.05 });
                break;
        }
        return this.changeEmotions(changes, { type: 'visitor', event });
    }
    /**
     * 行動完了時の感情反応
     */
    respondToAction(action, outcome, satisfaction) {
        const changes = [];
        if (outcome === 'completed') {
            changes.push({ emotion: 'contentment', delta: satisfaction * 0.2 }, { emotion: 'joy', delta: satisfaction * 0.1 });
            // 行動タイプ別の感情
            if (action.includes('read') || action.includes('learn')) {
                changes.push({ emotion: 'curiosity', delta: -0.1 + satisfaction * 0.15 });
            }
            if (action.includes('sing') || action.includes('create')) {
                changes.push({ emotion: 'joy', delta: 0.15 });
            }
            if (action.includes('rest') || action.includes('sleep')) {
                changes.push({ emotion: 'peace', delta: 0.2 }, { emotion: 'fatigue', delta: -0.3 });
            }
        }
        else if (outcome === 'failed') {
            changes.push({ emotion: 'confusion', delta: 0.1 }, { emotion: 'anxiety', delta: 0.05 });
        }
        else if (outcome === 'started') {
            changes.push({ emotion: 'anticipation', delta: 0.1 });
        }
        return this.changeEmotions(changes, { type: 'action', action, outcome });
    }
    /**
     * 記憶想起時の感情反応
     */
    respondToMemory(memoryId, emotionalTags, intensity) {
        const changes = [];
        // 記憶の感情タグに基づいて感情を呼び起こす
        for (const tag of emotionalTags) {
            changes.push({
                emotion: tag,
                delta: intensity * 0.3
            });
        }
        // 懐かしさも追加
        if (intensity > 0.3) {
            changes.push({ emotion: 'nostalgia', delta: 0.1 });
        }
        return this.changeEmotions(changes, { type: 'memory', memoryId });
    }
    /**
     * 揺らぎによる感情変化
     */
    applyYuragiEffect(yuragiType, emotionChanges) {
        const changes = [];
        for (const [emotion, delta] of Object.entries(emotionChanges)) {
            changes.push({
                emotion: emotion,
                delta: delta
            });
        }
        return this.changeEmotions(changes, { type: 'yuragi', yuragiType });
    }
    // ============================================================
    // 内部メソッド
    // ============================================================
    /**
     * 自然な減衰を適用
     */
    applyDecay(changes) {
        const baselineEmotions = {
            peace: 0.3, // somuniaは基本的に穏やか
            melancholy: 0.1, // 少しの物思い
            curiosity: 0.2 // 緩やかな好奇心
        };
        for (const emotion of Object.keys(this.state.levels)) {
            const current = this.state.levels[emotion];
            const baseline = baselineEmotions[emotion] || 0;
            // ベースラインに向かって減衰
            const diff = current - baseline;
            if (Math.abs(diff) > 0.01) {
                const decay = diff * this.config.decayRate;
                const previousLevel = current;
                this.state.levels[emotion] = current - decay;
                if (Math.abs(decay) > 0.001) {
                    changes.push({
                        emotion,
                        previousLevel,
                        newLevel: this.state.levels[emotion],
                        delta: -decay
                    });
                }
            }
        }
    }
    /**
     * 慣性による変化を適用
     */
    applyMomentum(changes) {
        for (const emotion of Object.keys(this.state.momentum)) {
            const momentum = this.state.momentum[emotion];
            if (Math.abs(momentum) > 0.001) {
                const previousLevel = this.state.levels[emotion];
                this.state.levels[emotion] = Math.max(0, Math.min(1, previousLevel + momentum * 0.1));
                // 慣性を減衰
                this.state.momentum[emotion] = momentum * this.config.momentumRetention;
                changes.push({
                    emotion,
                    previousLevel,
                    newLevel: this.state.levels[emotion],
                    delta: this.state.levels[emotion] - previousLevel
                });
            }
        }
    }
    /**
     * 時間帯バイアスを適用
     */
    applyTimeBias(timeOfDay, changes) {
        const bias = TIME_EMOTION_BIAS[timeOfDay];
        if (!bias)
            return;
        for (const [emotion, amount] of Object.entries(bias)) {
            const emotionType = emotion;
            const previousLevel = this.state.levels[emotionType];
            // 緩やかにバイアスを適用
            const delta = amount * 0.1;
            this.state.levels[emotionType] = Math.max(0, Math.min(1, previousLevel + delta));
            if (Math.abs(delta) > 0.001) {
                changes.push({
                    emotion: emotionType,
                    previousLevel,
                    newLevel: this.state.levels[emotionType],
                    delta
                });
            }
        }
    }
    /**
     * 感情間の相互作用を適用
     */
    applyEmotionInteractions(changes) {
        const interactions = [];
        for (const emotion of Object.keys(EMOTION_RELATIONS)) {
            const relations = EMOTION_RELATIONS[emotion];
            if (!relations)
                continue;
            const sourceLevel = this.state.levels[emotion];
            if (sourceLevel < this.config.activationThreshold)
                continue;
            for (const [targetEmotion, strength] of Object.entries(relations)) {
                const delta = sourceLevel * strength * this.config.emotionInteractionStrength * 0.01;
                if (Math.abs(delta) > 0.001) {
                    interactions.push({
                        emotion: targetEmotion,
                        delta
                    });
                }
            }
        }
        // 相互作用を適用
        for (const { emotion, delta } of interactions) {
            const previousLevel = this.state.levels[emotion];
            this.state.levels[emotion] = Math.max(0, Math.min(1, previousLevel + delta));
            changes.push({
                emotion,
                previousLevel,
                newLevel: this.state.levels[emotion],
                delta
            });
        }
    }
    /**
     * 感情変化を他の感情に伝播
     */
    propagateInteraction(sourceEmotion, delta) {
        const changes = [];
        const relations = EMOTION_RELATIONS[sourceEmotion];
        if (!relations)
            return changes;
        for (const [targetEmotion, strength] of Object.entries(relations)) {
            const propagatedDelta = delta * strength * this.config.emotionInteractionStrength;
            if (Math.abs(propagatedDelta) > 0.01) {
                const previousLevel = this.state.levels[targetEmotion];
                this.state.levels[targetEmotion] = Math.max(0, Math.min(1, previousLevel + propagatedDelta));
                changes.push({
                    emotion: targetEmotion,
                    previousLevel,
                    newLevel: this.state.levels[targetEmotion],
                    delta: propagatedDelta
                });
            }
        }
        return changes;
    }
    /**
     * 状態を正規化
     */
    normalizeState() {
        for (const emotion of Object.keys(this.state.levels)) {
            this.state.levels[emotion] = Math.max(0, Math.min(1, this.state.levels[emotion]));
        }
    }
    /**
     * 主要・副次感情を更新
     */
    updatePrimarySecondary() {
        const sorted = Object.entries(this.state.levels)
            .sort(([, a], [, b]) => b - a);
        if (sorted.length > 0 && sorted[0][1] >= this.config.primaryThreshold) {
            this.state.primary = sorted[0][0];
        }
        if (sorted.length > 1 && sorted[1][1] >= this.config.activationThreshold) {
            this.state.secondary = sorted[1][0];
        }
        else {
            this.state.secondary = null;
        }
    }
    /**
     * valence/arousalを更新
     */
    updateValenceArousal() {
        // Valence: ポジティブ - ネガティブ
        const positive = (this.state.levels.joy +
            this.state.levels.peace +
            this.state.levels.contentment +
            this.state.levels.warmth +
            this.state.levels.hope) / 5;
        const negative = (this.state.levels.anxiety +
            this.state.levels.loneliness +
            this.state.levels.fear +
            this.state.levels.melancholy) / 4;
        this.state.valence = positive - negative;
        // Arousal: 活性度
        const highArousal = (this.state.levels.curiosity +
            this.state.levels.anxiety +
            this.state.levels.anticipation +
            this.state.levels.wonder +
            this.state.levels.joy) / 5;
        const lowArousal = (this.state.levels.peace +
            this.state.levels.fatigue +
            this.state.levels.contentment) / 3;
        this.state.arousal = (highArousal + (1 - lowArousal)) / 2;
    }
    /**
     * マッチするパターンを検索
     */
    findMatchingPattern(situation) {
        let bestMatch = null;
        let bestScore = 0;
        for (const pattern of this.patterns) {
            const score = this.scoreSituationMatch(pattern.situation, situation);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = pattern;
            }
        }
        return bestScore > 0.3 ? bestMatch : null;
    }
    /**
     * 状況のマッチスコアを計算
     */
    scoreSituationMatch(patternSituation, currentSituation) {
        let score = 0;
        let factors = 0;
        // 時間帯
        if (patternSituation.timeOfDay && currentSituation.timeOfDay) {
            factors++;
            if (patternSituation.timeOfDay.some(t => currentSituation.timeOfDay?.includes(t))) {
                score += 1;
            }
        }
        // 訪問者
        if (patternSituation.visitorPresent !== undefined &&
            currentSituation.visitorPresent !== undefined) {
            factors++;
            if (patternSituation.visitorPresent === currentSituation.visitorPresent) {
                score += 1;
            }
        }
        // 感情状態
        if (patternSituation.emotionalState && currentSituation.emotionalState) {
            factors++;
            const patternEmotions = Object.keys(patternSituation.emotionalState);
            const currentEmotions = Object.keys(currentSituation.emotionalState);
            const overlap = patternEmotions.filter(e => currentEmotions.includes(e));
            if (overlap.length > 0) {
                score += overlap.length / patternEmotions.length;
            }
        }
        return factors > 0 ? score / factors : 0;
    }
    /**
     * トリガーを文字列に変換
     */
    triggerToString(trigger) {
        switch (trigger.type) {
            case 'pattern': return `pattern:${trigger.patternId}`;
            case 'decay': return 'decay';
            case 'time': return `time:${trigger.timeOfDay}`;
            case 'event': return `event:${trigger.eventName}`;
            case 'visitor': return `visitor:${trigger.event}`;
            case 'action': return `action:${trigger.action}:${trigger.outcome}`;
            case 'memory': return `memory:${trigger.memoryId}`;
            case 'yuragi': return `yuragi:${trigger.yuragiType}`;
            case 'urge': return `urge:${trigger.urgeType}`;
            case 'homeostasis': return `homeostasis:${trigger.state}`;
            case 'external': return `external:${trigger.source}`;
            default: return 'unknown';
        }
    }
    /**
     * 履歴をトリミング
     */
    trimHistory() {
        const MAX_HISTORY = 1000;
        if (this.changeHistory.length > MAX_HISTORY) {
            this.changeHistory = this.changeHistory.slice(-MAX_HISTORY);
        }
    }
    // ============================================================
    // 公開API
    // ============================================================
    /**
     * 現在の状態を取得
     */
    getState() {
        return { ...this.state };
    }
    /**
     * 特定の感情レベルを取得
     */
    getEmotionLevel(emotion) {
        return this.state.levels[emotion];
    }
    /**
     * 主要感情を取得
     */
    getPrimaryEmotion() {
        return this.state.primary;
    }
    /**
     * アクティブな感情（閾値以上）を取得
     */
    getActiveEmotions() {
        return Object.entries(this.state.levels)
            .filter(([, level]) => level >= this.config.activationThreshold)
            .map(([emotion, level]) => ({
            emotion: emotion,
            level
        }))
            .sort((a, b) => b.level - a.level);
    }
    /**
     * 感情のサマリーを取得
     */
    getSummary() {
        const description = this.generateDescription();
        return {
            primary: this.state.primary,
            secondary: this.state.secondary,
            valence: this.state.valence,
            arousal: this.state.arousal,
            description
        };
    }
    /**
     * 感情状態の自然言語描写を生成
     */
    generateDescription() {
        const primary = this.state.primary;
        const level = this.state.levels[primary];
        const intensityWord = level > 0.8 ? 'とても' :
            level > 0.6 ? 'かなり' :
                level > 0.4 ? '' :
                    'すこし';
        const emotionWords = {
            joy: '嬉しい',
            peace: '穏やか',
            curiosity: '興味深い',
            melancholy: '物思いにふけっている',
            loneliness: '寂しい',
            anxiety: '不安',
            contentment: '満たされている',
            wonder: '驚きを感じている',
            warmth: '温かい気持ち',
            fatigue: '疲れている',
            boredom: '退屈',
            anticipation: '期待している',
            confusion: '戸惑っている',
            nostalgia: '懐かしい',
            hope: '希望を感じている',
            fear: '恐れを感じている',
            excitement: '興奮している',
            serenity: '静かな安らぎを感じている',
            gratitude: '感謝している',
            frustration: '苛立ちを感じている',
            longing: '憧れている',
            unease: '落ち着かない',
            sadness: '悲しい',
        };
        let description = `${intensityWord}${emotionWords[primary]}`;
        if (this.state.secondary) {
            const secondaryWord = emotionWords[this.state.secondary];
            description += `、そして${secondaryWord}`;
        }
        return description;
    }
    /**
     * 最近の変化履歴を取得
     */
    getRecentChanges(count = 10) {
        return this.changeHistory.slice(-count);
    }
    /**
     * 最後の大きな変化を取得
     */
    getLastSignificantChange() {
        return this.state.lastSignificantChange;
    }
    /**
     * 統計を取得
     */
    getStats() {
        return {
            activeEmotionCount: this.getActiveEmotions().length,
            dominantEmotion: this.state.primary,
            averageValence: this.state.valence,
            averageArousal: this.state.arousal,
            changesSinceLastSave: this.changeHistory.length
        };
    }
    // ============================================================
    // Phase 4B: 感情パターン自己修正
    // ============================================================
    /** 感情トリガーの統計 */
    triggerStats = new Map();
    /** 感情の滞留検知用 */
    stagnationTracker = new Map();
    /** 自己修正の履歴 */
    selfCorrectionLog = [];
    /**
     * 感情トリガーの結果を記録
     * どの状況でどの感情が発生し、その後どうなったかを追跡
     */
    recordTriggerOutcome(triggerType, triggeredEmotion, intensity, outcome) {
        const key = `${triggerType}→${triggeredEmotion}`;
        let stat = this.triggerStats.get(key);
        if (!stat) {
            stat = {
                triggerType,
                emotion: triggeredEmotion,
                occurrences: 0,
                helpfulCount: 0,
                totalIntensity: 0,
                totalDuration: 0,
                actionLeadCount: 0,
                subsequentEmotions: {},
            };
            this.triggerStats.set(key, stat);
        }
        stat.occurrences++;
        if (outcome.wasHelpful)
            stat.helpfulCount++;
        stat.totalIntensity += intensity;
        stat.totalDuration += outcome.durationTicks;
        if (outcome.ledToAction)
            stat.actionLeadCount++;
        if (outcome.subsequentEmotion) {
            stat.subsequentEmotions[outcome.subsequentEmotion] =
                (stat.subsequentEmotions[outcome.subsequentEmotion] || 0) + 1;
        }
    }
    /**
     * 感情の自己修正を実行
     * 蓄積された統計データから感情システムのパラメータを調整
     */
    performSelfCorrection() {
        const corrections = [];
        // === 1. 過敏反応の鈍化 ===
        for (const [key, stat] of this.triggerStats) {
            if (stat.occurrences < 5)
                continue;
            const helpRate = stat.helpfulCount / stat.occurrences;
            const avgIntensity = stat.totalIntensity / stat.occurrences;
            // 役に立たないのに強く反応しすぎているパターン
            if (helpRate < 0.3 && avgIntensity > 0.5) {
                const correction = this.desensitizeEmotion(stat.emotion, avgIntensity);
                if (correction)
                    corrections.push(correction);
            }
            // 行動に全く繋がらない感情パターン
            const actionRate = stat.actionLeadCount / stat.occurrences;
            if (actionRate < 0.1 && stat.occurrences >= 10) {
                const correction = this.reduceIdleEmotion(stat);
                if (correction)
                    corrections.push(correction);
            }
        }
        // === 2. 感情の滞留解消 ===
        for (const [emotion, tracker] of this.stagnationTracker) {
            if (tracker.duration > 100) { // 100ティック以上同じレベル
                const correction = this.breakStagnation(emotion, tracker);
                if (correction)
                    corrections.push(correction);
            }
        }
        // === 3. 感情の多様性確保 ===
        const diversityCorrection = this.ensureEmotionalDiversity();
        if (diversityCorrection)
            corrections.push(diversityCorrection);
        // === 4. 感情間結合の学習的調整 ===
        const couplingCorrections = this.adjustEmotionCouplings();
        corrections.push(...couplingCorrections);
        // === 5. ベースライン感情の適応 ===
        const baselineCorrection = this.adaptBaselineEmotions();
        if (baselineCorrection)
            corrections.push(baselineCorrection);
        // ログに記録
        this.selfCorrectionLog.push(...corrections);
        if (this.selfCorrectionLog.length > 100) {
            this.selfCorrectionLog = this.selfCorrectionLog.slice(-100);
        }
        return corrections;
    }
    /**
     * 滞留検知の更新（毎ティック呼ぶ）
     */
    updateStagnationTracking() {
        for (const emotion of Object.keys(this.state.levels)) {
            const level = this.state.levels[emotion];
            const tracker = this.stagnationTracker.get(emotion);
            if (tracker) {
                if (Math.abs(tracker.level - level) < 0.02) {
                    tracker.duration++;
                }
                else {
                    tracker.level = level;
                    tracker.duration = 0;
                }
            }
            else {
                this.stagnationTracker.set(emotion, { level, duration: 0 });
            }
        }
    }
    /**
     * 過敏な感情を鈍化
     */
    desensitizeEmotion(emotion, currentAvgIntensity) {
        // decayRateを微増（その感情が早く減衰するようにする）
        // 直接decayRateを上げるのではなく、momentumを弱める
        const currentMomentum = this.state.momentum[emotion] || 0;
        if (Math.abs(currentMomentum) > 0.01) {
            this.state.momentum[emotion] = currentMomentum * 0.7; // 慣性を30%カット
        }
        return {
            type: 'desensitize',
            target: emotion,
            description: `${emotion}の反応が過敏なため、慣性を弱めた`,
            adjustment: -0.3,
            reason: `適応率${((1 - currentAvgIntensity) * 100).toFixed(0)}%`,
            timestamp: Date.now(),
        };
    }
    /**
     * 行動に繋がらない感情を弱める
     */
    reduceIdleEmotion(stat) {
        const emotion = stat.emotion;
        const currentLevel = this.state.levels[emotion];
        if (currentLevel > 0.3) {
            // 微かに下げる
            this.state.levels[emotion] = currentLevel * 0.95;
            return {
                type: 'reduce_idle',
                target: emotion,
                description: `${emotion}が行動に繋がっていないため、強度を微減`,
                adjustment: -0.05,
                reason: `行動率${((stat.actionLeadCount / stat.occurrences) * 100).toFixed(0)}%`,
                timestamp: Date.now(),
            };
        }
        return null;
    }
    /**
     * 滞留状態を解消
     */
    breakStagnation(emotion, tracker) {
        // 長時間同じレベルで停滞している感情に揺らぎを与える
        const perturbation = (Math.random() - 0.5) * 0.1;
        const newLevel = Math.max(0, Math.min(1, tracker.level + perturbation));
        this.state.levels[emotion] = newLevel;
        // 慣性にもランダムな変化を加える
        this.state.momentum[emotion] = (this.state.momentum[emotion] || 0) + perturbation * 0.5;
        // トラッカーをリセット
        tracker.duration = 0;
        tracker.level = newLevel;
        return {
            type: 'break_stagnation',
            target: emotion,
            description: `${emotion}が${tracker.duration}ティック停滞していたため、揺らぎを適用`,
            adjustment: perturbation,
            reason: `停滞レベル: ${(tracker.level * 100).toFixed(0)}%`,
            timestamp: Date.now(),
        };
    }
    /**
     * 感情の多様性を確保
     */
    ensureEmotionalDiversity() {
        const activeEmotions = this.getActiveEmotions();
        // 1種類の感情だけが長期間支配的な場合
        if (activeEmotions.length <= 1 && this.changeHistory.length >= 20) {
            const last20 = this.changeHistory.slice(-20);
            const uniqueEmotions = new Set(last20.map(c => {
                // 最大変化の感情を代表とする
                const maxChange = c.changes?.reduce((max, ch) => ch.newLevel > (max?.newLevel || 0) ? ch : max, c.changes[0]);
                return maxChange?.emotion || this.state.primary;
            }));
            if (uniqueEmotions.size <= 2) {
                // somuniaらしい感情を少し活性化
                const dormantEmotions = ['curiosity', 'wonder', 'nostalgia'];
                const toActivate = dormantEmotions[Math.floor(Math.random() * dormantEmotions.length)];
                const currentLevel = this.state.levels[toActivate] || 0;
                if (currentLevel < 0.2) {
                    this.state.levels[toActivate] = currentLevel + 0.15;
                    this.state.momentum[toActivate] = (this.state.momentum[toActivate] || 0) + 0.05;
                    return {
                        type: 'diversity_boost',
                        target: toActivate,
                        description: `感情の多様性が低いため${toActivate}を活性化`,
                        adjustment: 0.15,
                        reason: `アクティブ感情: ${activeEmotions.length}種`,
                        timestamp: Date.now(),
                    };
                }
            }
        }
        return null;
    }
    /**
     * 感情間の結合を経験から調整
     */
    adjustEmotionCouplings() {
        const corrections = [];
        // 後続感情のパターンから結合強度を学習
        for (const [, stat] of this.triggerStats) {
            if (stat.occurrences < 8)
                continue;
            const emotion = stat.emotion;
            for (const [subsequent, count] of Object.entries(stat.subsequentEmotions)) {
                const frequency = count / stat.occurrences;
                if (frequency > 0.5) {
                    // 頻繁に後続する感情間の結合を強化
                    const relations = EMOTION_RELATIONS[emotion];
                    if (relations) {
                        const currentCoupling = relations[subsequent] || 0;
                        const newCoupling = currentCoupling + 0.02 * Math.sign(frequency - 0.5);
                        if (Math.abs(newCoupling - currentCoupling) > 0.01) {
                            // EMOTION_RELATIONSは定数だが、実行時にオーバーライドする
                            if (!this.couplingOverrides)
                                this.couplingOverrides = new Map();
                            const key = `${emotion}→${subsequent}`;
                            this.couplingOverrides.set(key, Math.max(-1, Math.min(1, newCoupling)));
                            corrections.push({
                                type: 'coupling_adjust',
                                target: emotion,
                                description: `${emotion}→${subsequent}の結合を調整 (${(currentCoupling * 100).toFixed(0)}%→${(newCoupling * 100).toFixed(0)}%)`,
                                adjustment: newCoupling - currentCoupling,
                                reason: `後続頻度: ${(frequency * 100).toFixed(0)}%`,
                                timestamp: Date.now(),
                            });
                        }
                    }
                }
            }
        }
        return corrections;
    }
    /**
     * ベースライン感情の適応的調整
     * 長期的な感情パターンに基づいてベースラインを微調整
     */
    adaptBaselineEmotions() {
        if (this.changeHistory.length < 50)
            return null;
        // 最近50件の平均レベルを計算
        const recentAvg = {};
        const emotions = Object.keys(this.state.levels);
        for (const emotion of emotions) {
            const relevantChanges = this.changeHistory
                .filter(c => c.changes?.some(ch => ch.emotion === emotion))
                .slice(-30);
            if (relevantChanges.length > 0) {
                const avgLevel = relevantChanges.reduce((sum, c) => {
                    const change = c.changes?.find(ch => ch.emotion === emotion);
                    return sum + (change?.newLevel || 0);
                }, 0) / relevantChanges.length;
                recentAvg[emotion] = avgLevel;
            }
        }
        // ベースラインと大きく異なる場合、ベースラインをわずかに近づける
        // （ベースラインは applyDecay内のbaselineEmotionsで定義されている）
        // ここではmomentumとlevelの微調整で間接的に対応
        let adjusted = false;
        let description = '';
        for (const [emotion, avg] of Object.entries(recentAvg)) {
            const current = this.state.levels[emotion];
            if (current !== undefined && Math.abs(avg - current) > 0.15) {
                // 平均に向かって微調整
                const direction = avg > current ? 0.02 : -0.02;
                this.state.momentum[emotion] =
                    (this.state.momentum[emotion] || 0) + direction;
                adjusted = true;
                description += `${emotion}のベースラインを調整; `;
            }
        }
        if (adjusted) {
            return {
                type: 'baseline_adapt',
                target: 'serenity', // representative
                description: description.slice(0, -2),
                adjustment: 0.02,
                reason: '長期的感情パターンへの適応',
                timestamp: Date.now(),
            };
        }
        return null;
    }
    /** 結合強度のオーバーライド */
    couplingOverrides = null;
    /**
     * 結合強度を取得（オーバーライド込み）
     */
    getEffectiveCoupling(source, target) {
        if (this.couplingOverrides) {
            const key = `${source}→${target}`;
            const override = this.couplingOverrides.get(key);
            if (override !== undefined)
                return override;
        }
        return EMOTION_RELATIONS[source]?.[target] || 0;
    }
    /**
     * 自己修正ログを取得
     */
    getSelfCorrectionLog(count = 20) {
        return this.selfCorrectionLog.slice(-count);
    }
    /**
     * 感度調整API（SelfModificationから呼ばれる）
     */
    adjustSensitivity(emotion, direction, amount) {
        const factor = direction === 'increase' ? 1 : -1;
        const currentLevel = this.state.levels[emotion];
        this.state.levels[emotion] = Math.max(0, Math.min(1, currentLevel + factor * amount));
        this.selfCorrectionLog.push({
            type: 'external_adjust',
            target: emotion,
            description: `外部から${emotion}の感度を${direction}に調整`,
            adjustment: factor * amount,
            reason: 'SelfModificationからの指示',
            timestamp: Date.now(),
        });
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
            changeHistory: this.changeHistory.slice(-100), // 最新100件のみ保存
            patterns: this.patterns.map(p => p.id),
            lastUpdateTick: this.lastUpdateTick
        };
    }
    /**
     * JSONからリストア
     */
    static fromJSON(json, patterns) {
        const engine = new EmotionEngine(json.config);
        engine.state = json.state;
        engine.changeHistory = json.changeHistory || [];
        engine.patterns = patterns;
        engine.lastUpdateTick = json.lastUpdateTick || 0;
        return engine;
    }
}
exports.EmotionEngine = EmotionEngine;
exports.default = EmotionEngine;
//# sourceMappingURL=EmotionEngine.js.map