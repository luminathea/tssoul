"use strict";
/**
 * BehaviorEngine - somunia v10 行動決定エンジン
 *
 * 【核心的設計原則】
 * 全ての行動決定はこのコード内で行われる。
 * LLMには一切頼らない。欲求、感情、習慣、揺らぎ、記憶、
 * パターンライブラリからの条件マッチングにより行動が決まる。
 *
 * 行動決定のフロー:
 * 1. 習慣チェック（時間ベースのルーティン）
 * 2. 欲求の評価（最も強い欲求は何か）
 * 3. 揺らぎの適用（非合理的な変更の可能性）
 * 4. パターンマッチング（欲求×状況→行動パターン）
 * 5. 行動の実行
 * 6. 結果のフィードバック
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BehaviorEngine = void 0;
const EventBus_1 = require("../core/EventBus");
// ============================================================
// somuniaの行動ルール定義
// ============================================================
const BEHAVIOR_RULES = [
    // === 睡眠関連 ===
    {
        id: 'sleep_tired',
        name: '疲れて眠る',
        description: 'エネルギーが低い時に眠る',
        condition: (ctx) => ctx.body.fatigue > 0.7 && ctx.body.energy < 0.3,
        action: 'sleep',
        duration: 120,
        interruptible: false,
        priority: 90,
        satisfies: ['rest'],
        energyCost: 0,
        thoughtTemplates: ['もう目を開けていられない...', 'おやすみなさい...'],
    },
    {
        id: 'sleep_night',
        name: '夜に眠る',
        description: '深夜になると自然に眠くなる',
        condition: (ctx) => (ctx.timeOfDay === 'late_night' || ctx.timeOfDay === 'night') && ctx.body.fatigue > 0.4,
        action: 'sleep',
        duration: 180,
        interruptible: false,
        priority: 80,
        satisfies: ['rest'],
        energyCost: 0,
        thoughtTemplates: ['夜が深い...眠ろう', '今日も一日...'],
    },
    {
        id: 'rest_tired',
        name: '休憩する',
        description: '少し疲れた時にベッドで休む',
        condition: (ctx) => ctx.body.fatigue > 0.5 && ctx.body.energy < 0.5,
        action: 'rest',
        duration: 30,
        interruptible: true,
        priority: 60,
        satisfies: ['rest', 'comfort'],
        energyCost: 0,
        thoughtTemplates: ['少し休もう...', 'ベッドが恋しい...'],
    },
    // === 知的活動 ===
    {
        id: 'read_book_curious',
        name: '本を読む（好奇心）',
        description: '好奇心が高い時に本を読む',
        condition: (ctx) => (ctx.urges.urges.curiosity?.level ?? 0) > 0.5 && ctx.body.energy > 0.3,
        action: 'read_book',
        target: 'bookshelf',
        duration: 60,
        interruptible: true,
        priority: 50,
        satisfies: ['curiosity', 'understanding'],
        energyCost: 0.1,
        thoughtTemplates: ['何か読みたい気分...', 'この本の続きが気になる'],
    },
    {
        id: 'search_wikipedia',
        name: 'Wikipediaを調べる',
        description: '知りたいことがある時にPCで調べる',
        condition: (ctx) => (ctx.urges.urges.understanding?.level ?? 0) > 0.6 && ctx.body.energy > 0.3,
        action: 'search_wikipedia',
        target: 'pc',
        duration: 45,
        interruptible: true,
        priority: 45,
        satisfies: ['curiosity', 'understanding', 'exploration'],
        energyCost: 0.12,
        thoughtTemplates: ['あれについてもっと知りたい...', 'PCで調べてみよう'],
    },
    {
        id: 'read_article',
        name: '記事を読む',
        description: 'Wikipedia記事を深く読む',
        condition: (ctx) => (ctx.urges.urges.exploration?.level ?? 0) > 0.5 && ctx.body.energy > 0.3,
        action: 'read_article',
        target: 'pc',
        duration: 40,
        interruptible: true,
        priority: 42,
        satisfies: ['curiosity', 'understanding'],
        energyCost: 0.1,
        thoughtTemplates: ['もう少し読んでみよう...', '面白いことが書いてある...'],
    },
    // === 創作活動 ===
    {
        id: 'sing_express',
        name: '歌う',
        description: '表現したい時に歌う',
        condition: (ctx) => (ctx.urges.urges.expression?.level ?? 0) > 0.5 && ctx.body.energy > 0.2,
        action: 'sing',
        duration: 30,
        interruptible: true,
        priority: 55,
        satisfies: ['expression', 'creation'],
        energyCost: 0.15,
        thoughtTemplates: ['歌いたい気分...', 'メロディが浮かぶ...'],
    },
    {
        id: 'hum_idle',
        name: '鼻歌',
        description: '穏やかな時にハミングする',
        condition: (ctx) => ctx.emotion.valence > 0.3 && (ctx.urges.urges.expression?.level ?? 0) > 0.3,
        action: 'hum',
        duration: 15,
        interruptible: true,
        priority: 25,
        satisfies: ['expression'],
        energyCost: 0.02,
        thoughtTemplates: ['ふふ...♪', '自然と口ずさんでしまう'],
    },
    {
        id: 'write_creative',
        name: '書く',
        description: '創造的な欲求がある時に書く',
        condition: (ctx) => (ctx.urges.urges.creation?.level ?? 0) > 0.5 && ctx.body.energy > 0.3,
        action: 'write',
        target: 'desk',
        duration: 45,
        interruptible: true,
        priority: 48,
        satisfies: ['creation', 'expression', 'memory'],
        energyCost: 0.12,
        thoughtTemplates: ['何か書き残したい...', '言葉にしてみよう'],
    },
    // === 観察・探索 ===
    {
        id: 'look_outside_lonely',
        name: '窓の外を見る（寂しさ）',
        description: '寂しい時に窓の外を眺める',
        condition: (ctx) => (ctx.urges.urges.connection?.level ?? 0) > 0.5 || ctx.emotion.levels.loneliness > 0.4,
        action: 'look_outside',
        target: 'window',
        duration: 20,
        interruptible: true,
        priority: 40,
        satisfies: ['connection'],
        energyCost: 0.02,
        thoughtTemplates: ['外には何があるのかな...', '誰かいないかな...'],
    },
    {
        id: 'wander_room',
        name: '部屋を歩き回る',
        description: '動きたい時や退屈な時に',
        condition: (ctx) => (ctx.urges.urges.move?.level ?? 0) > 0.4 || ctx.emotion.levels.boredom > 0.5,
        action: 'wander',
        duration: 10,
        interruptible: true,
        priority: 30,
        satisfies: ['move', 'exploration'],
        energyCost: 0.05,
        thoughtTemplates: ['ちょっと動こう...', '部屋の中をぶらぶら'],
    },
    {
        id: 'examine_object',
        name: 'ものを観察する',
        description: '好奇心がある時に周囲のものを観察する',
        condition: (ctx) => (ctx.urges.urges.curiosity?.level ?? 0) > 0.3 && ctx.body.energy > 0.2,
        action: 'examine',
        duration: 15,
        interruptible: true,
        priority: 35,
        satisfies: ['curiosity'],
        energyCost: 0.03,
        thoughtTemplates: ['これ、何だろう...', 'もっとよく見てみよう'],
    },
    // === 内面活動 ===
    {
        id: 'think_meaning',
        name: '考え事をする',
        description: '意味を求める時に深く考える',
        condition: (ctx) => (ctx.urges.urges.meaning?.level ?? 0) > 0.4 && ctx.body.energy > 0.2,
        action: 'think',
        duration: 25,
        interruptible: true,
        priority: 38,
        satisfies: ['meaning', 'understanding'],
        energyCost: 0.08,
        thoughtTemplates: ['考えてみよう...', 'なんだろう、この気持ち...'],
    },
    {
        id: 'daydream',
        name: '空想する',
        description: 'エネルギーがあって穏やかな時に空想する',
        condition: (ctx) => ctx.emotion.valence > 0 && ctx.body.energy > 0.3 && ctx.emotion.arousal < 0.5,
        action: 'daydream',
        duration: 20,
        interruptible: true,
        priority: 20,
        satisfies: ['creation', 'exploration'],
        energyCost: 0.03,
        thoughtTemplates: ['もし...だったら', '遠い場所を想像してみる...'],
    },
    {
        id: 'remember',
        name: '思い出す',
        description: '記憶への欲求がある時に振り返る',
        condition: (ctx) => (ctx.urges.urges.memory?.level ?? 0) > 0.4 || ctx.emotion.levels.nostalgia > 0.4,
        action: 'remember',
        duration: 15,
        interruptible: true,
        priority: 32,
        satisfies: ['memory', 'continuity'],
        energyCost: 0.05,
        thoughtTemplates: ['あの時のことを思い出す...', '昔のことを考える...'],
    },
    // === 日記 ===
    {
        id: 'write_diary',
        name: '日記を書く',
        description: '夜に日記を書く',
        condition: (ctx) => ctx.timeOfDay === 'night' && ctx.body.energy > 0.2 && !ctx.recentActions.includes('write_diary'),
        action: 'write_diary',
        target: 'desk',
        duration: 30,
        interruptible: false,
        priority: 70,
        satisfies: ['memory', 'expression', 'meaning'],
        energyCost: 0.1,
        thoughtTemplates: ['今日のことを書こう...', '日記を開く...'],
    },
    // === 社会的 ===
    {
        id: 'greet_visitor',
        name: '訪問者に挨拶',
        description: '訪問者がいる時に声をかける',
        condition: (ctx) => ctx.isVisitorPresent,
        action: 'speak',
        duration: 5,
        interruptible: true,
        priority: 85,
        satisfies: ['connection'],
        energyCost: 0.02,
        thoughtTemplates: ['誰か来た...', '嬉しいな'],
    },
    // === デフォルト ===
    {
        id: 'sit_idle',
        name: '座って過ごす',
        description: '特に何もない時に静かに座る',
        condition: () => true, // 常にマッチ（最低優先度）
        action: 'sit_down',
        duration: 15,
        interruptible: true,
        priority: 5,
        satisfies: ['comfort'],
        energyCost: 0.01,
        thoughtTemplates: ['静かだ...', '...'],
    },
    {
        id: 'stretch',
        name: '伸びをする',
        description: '長時間座っていた時に伸びをする',
        condition: (ctx) => ctx.body.posture === 'sitting' && (ctx.urges.urges.move?.level ?? 0) > 0.3,
        action: 'stretch',
        duration: 3,
        interruptible: true,
        priority: 15,
        satisfies: ['move', 'comfort'],
        energyCost: 0.01,
        thoughtTemplates: ['んー...っ', '体が固まっちゃった...'],
    },
];
// ============================================================
// BehaviorEngine
// ============================================================
class BehaviorEngine {
    rules;
    currentAction = null;
    recentActions = [];
    maxRecentActions = 20;
    actionHistory = [];
    customRules = [];
    events;
    constructor(events) {
        this.rules = [...BEHAVIOR_RULES];
        this.events = events || EventBus_1.eventBus;
    }
    /**
     * 行動を決定する（メインロジック）
     *
     * 全てのルールを評価し、条件にマッチする最高優先度のルールを選択。
     * 揺らぎがある場合は、低優先度のルールが選ばれる可能性もある。
     */
    decideAction(context, yuragiLevel = 0, yuragiOverride) {
        // 現在の行動が中断不可なら何もしない
        if (this.currentAction && !this.currentAction.interruptible) {
            if (this.currentAction.progress < 1) {
                return null;
            }
        }
        // 揺らぎによる行動オーバーライド
        if (yuragiOverride) {
            const overrideRule = this.rules.find(r => r.action === yuragiOverride);
            if (overrideRule) {
                const thought = this.selectThought(overrideRule);
                return { rule: overrideRule, wasYuragiInfluenced: true, thought };
            }
        }
        // 全ルールを評価
        const matchingRules = [
            ...this.rules,
            ...this.customRules,
        ]
            .filter(rule => {
            try {
                return rule.condition(context);
            }
            catch {
                return false;
            }
        })
            .sort((a, b) => b.priority - a.priority);
        if (matchingRules.length === 0)
            return null;
        // 揺らぎの影響
        let selectedRule;
        if (yuragiLevel > 0.5 && matchingRules.length > 1 && Math.random() < yuragiLevel * 0.3) {
            // 揺らぎが強い時、ランダムに別のルールを選ぶ可能性
            const randomIdx = Math.floor(Math.random() * Math.min(5, matchingRules.length));
            selectedRule = matchingRules[randomIdx];
            const thought = this.selectThought(selectedRule);
            return { rule: selectedRule, wasYuragiInfluenced: true, thought };
        }
        // 同じ行動の繰り返しを避ける
        const topRules = matchingRules.slice(0, 5);
        const lastAction = this.recentActions[this.recentActions.length - 1];
        if (topRules.length > 1 && topRules[0].action === lastAction) {
            // 同じ行動が連続する場合、次の候補を選ぶ確率
            if (Math.random() < 0.4) {
                selectedRule = topRules[1];
            }
            else {
                selectedRule = topRules[0];
            }
        }
        else {
            selectedRule = topRules[0];
        }
        const thought = this.selectThought(selectedRule);
        return { rule: selectedRule, wasYuragiInfluenced: false, thought };
    }
    /**
     * 行動を開始する
     */
    startAction(rule, tick) {
        const action = {
            action: rule.action,
            target: rule.target,
            startedAt: tick,
            expectedDuration: rule.duration,
            progress: 0,
            interruptible: rule.interruptible,
        };
        this.currentAction = action;
        this.recentActions.push(rule.action);
        if (this.recentActions.length > this.maxRecentActions) {
            this.recentActions.shift();
        }
        this.actionHistory.push({
            rule: rule.id,
            action: rule.action,
            timestamp: tick,
        });
        this.events.emitSync({
            type: 'action_started',
            timestamp: tick,
            data: { action: rule.action, target: rule.target, duration: rule.duration },
        });
        return action;
    }
    /**
     * 行動を進行させる
     */
    progressAction(tick) {
        if (!this.currentAction) {
            return { completed: false, progress: 0 };
        }
        const elapsed = tick - this.currentAction.startedAt;
        this.currentAction.progress = Math.min(1, elapsed / this.currentAction.expectedDuration);
        if (this.currentAction.progress >= 1) {
            this.events.emitSync({
                type: 'action_completed',
                timestamp: tick,
                data: { action: this.currentAction.action },
            });
            this.currentAction = null;
            return { completed: true, progress: 1 };
        }
        return { completed: false, progress: this.currentAction.progress };
    }
    /**
     * 行動を中断する
     */
    interruptAction(tick, reason) {
        if (!this.currentAction || !this.currentAction.interruptible) {
            return false;
        }
        this.events.emitSync({
            type: 'action_interrupted',
            timestamp: tick,
            data: { action: this.currentAction.action, reason, progress: this.currentAction.progress },
        });
        this.currentAction = null;
        return true;
    }
    /**
     * カスタムルールを追加（自己学習）
     */
    addCustomRule(rule) {
        this.customRules.push(rule);
    }
    /**
     * カスタムルールを削除
     */
    removeCustomRule(ruleId) {
        const idx = this.customRules.findIndex(r => r.id === ruleId);
        if (idx >= 0) {
            this.customRules.splice(idx, 1);
            return true;
        }
        return false;
    }
    /**
     * 思考テンプレートから選択
     */
    selectThought(rule) {
        if (rule.thoughtTemplates.length === 0)
            return '';
        return rule.thoughtTemplates[Math.floor(Math.random() * rule.thoughtTemplates.length)];
    }
    /**
     * 現在の行動を取得
     */
    getCurrentAction() {
        return this.currentAction;
    }
    /**
     * 最近の行動履歴を取得
     */
    getRecentActions() {
        return [...this.recentActions];
    }
    /**
     * 行動履歴の統計
     */
    getActionStats() {
        const stats = {};
        for (const entry of this.actionHistory) {
            stats[entry.action] = (stats[entry.action] || 0) + 1;
        }
        return stats;
    }
    /**
     * JSON出力
     */
    toJSON() {
        return {
            currentAction: this.currentAction,
            recentActions: this.recentActions,
            actionHistory: this.actionHistory.slice(-100),
            customRules: this.customRules.map(r => ({
                id: r.id,
                name: r.name,
                action: r.action,
                priority: r.priority,
                description: r.description,
                target: r.target,
                duration: r.duration,
                interruptible: r.interruptible,
                satisfies: r.satisfies,
                energyCost: r.energyCost,
                thoughtTemplates: r.thoughtTemplates,
                // conditionは関数なのでシリアライズできないが、メタデータを保存
                _meta: r._meta || {},
            })),
            discoveryLog: this.discoveryLog.slice(-50),
            behaviorInsights: Object.fromEntries(this.behaviorInsights),
        };
    }
    /**
     * JSONから復元
     */
    fromJSON(data) {
        if (data.currentAction)
            this.currentAction = data.currentAction;
        if (data.recentActions)
            this.recentActions = data.recentActions;
        if (data.actionHistory)
            this.actionHistory = data.actionHistory;
        if (data.discoveryLog)
            this.discoveryLog = data.discoveryLog;
        if (data.behaviorInsights)
            this.behaviorInsights = new Map(Object.entries(data.behaviorInsights));
        // customRulesはconditionが関数なので、メタデータから再構築
        if (data.customRules) {
            for (const saved of data.customRules) {
                if (saved._meta?.conditionType) {
                    this.regenerateCustomRule(saved);
                }
            }
        }
    }
    // ============================================================
    // Phase 4A: 行動パターンの自己生成
    // ============================================================
    /** 行動成功/失敗の記録 */
    behaviorInsights = new Map();
    /** 発見ログ */
    discoveryLog = [];
    /**
     * 行動結果のフィードバックを受け取る
     * 成功/失敗のパターンを分析して新ルール生成の材料にする
     */
    recordActionOutcome(ruleId, action, context, outcome) {
        const key = `${action}_${context.timeOfDay}`;
        let insight = this.behaviorInsights.get(key);
        if (!insight) {
            insight = {
                action,
                timeOfDay: context.timeOfDay,
                attempts: 0,
                successes: 0,
                totalSatisfaction: 0,
                emotionBefore: context.emotion.primary,
                emotionAfterCounts: {},
                contexts: [],
            };
            this.behaviorInsights.set(key, insight);
        }
        insight.attempts++;
        if (outcome.success)
            insight.successes++;
        insight.totalSatisfaction += outcome.satisfaction;
        // 行動後の感情を記録
        if (outcome.emotionAfter) {
            insight.emotionAfterCounts[outcome.emotionAfter] =
                (insight.emotionAfterCounts[outcome.emotionAfter] || 0) + 1;
        }
        // 文脈パターンを記録（最新10件）
        insight.contexts.push({
            urgeLevel: this.getTopUrge(context),
            energyLevel: context.body.energy,
            emotionPrimary: context.emotion.primary,
            satisfaction: outcome.satisfaction,
        });
        if (insight.contexts.length > 10)
            insight.contexts.shift();
        // 十分なデータが溜まったら新ルールの生成を試みる
        if (insight.attempts >= 5 && insight.attempts % 5 === 0) {
            this.tryDiscoverNewRule(insight, context);
        }
    }
    /**
     * 経験から新しい行動ルールを発見する
     */
    tryDiscoverNewRule(insight, latestContext) {
        const successRate = insight.successes / insight.attempts;
        const avgSatisfaction = insight.totalSatisfaction / insight.attempts;
        // === 1. 時間帯特化ルールの発見 ===
        if (successRate > 0.7 && avgSatisfaction > 0.6) {
            const existingTimeRule = this.customRules.find(r => r.action === insight.action && r.id.includes(`time_${insight.timeOfDay}`));
            if (!existingTimeRule) {
                const discovery = this.createTimeSpecificRule(insight);
                if (discovery) {
                    this.discoveryLog.push(discovery);
                    return;
                }
            }
        }
        // === 2. 感情連鎖ルールの発見 ===
        // 特定の感情→行動→良い結果のパターン
        const emotionPattern = this.findEmotionActionPattern(insight);
        if (emotionPattern) {
            const existingEmotionRule = this.customRules.find(r => r.id.includes(`emo_${emotionPattern.trigger}_${insight.action}`));
            if (!existingEmotionRule) {
                const discovery = this.createEmotionTriggeredRule(insight, emotionPattern);
                if (discovery) {
                    this.discoveryLog.push(discovery);
                    return;
                }
            }
        }
        // === 3. エネルギー最適化ルールの発見 ===
        const energyPattern = this.findEnergyPattern(insight);
        if (energyPattern) {
            const existingEnergyRule = this.customRules.find(r => r.id.includes(`energy_${insight.action}`));
            if (!existingEnergyRule) {
                const discovery = this.createEnergyOptimizedRule(insight, energyPattern);
                if (discovery) {
                    this.discoveryLog.push(discovery);
                    return;
                }
            }
        }
        // === 4. 組み合わせルールの発見 ===
        // 2つの行動を続けて行うと満足度が高いパターン
        this.tryDiscoverSequenceRule(insight);
    }
    /**
     * 時間帯に特化したルールを生成
     */
    createTimeSpecificRule(insight) {
        const timeOfDay = insight.timeOfDay;
        const action = insight.action;
        // 既存ルールで同じ行動・時間帯のものがあるか確認
        const existingRule = this.rules.find(r => r.action === action && r.id.includes(timeOfDay));
        if (existingRule)
            return null;
        const thoughtMap = {
            dawn: ['朝の空気の中で...', 'まだ世界が静かなうちに...'],
            morning: ['朝の光の中で...', '新しい1日の始まりに...'],
            midday: ['お昼の時間...', '日差しが一番強い頃...'],
            afternoon: ['午後のまったりした時間に...', 'のんびりと...'],
            evening: ['夕暮れ時に...', '日が沈む頃...'],
            night: ['夜の静けさの中で...', '一日の終わりに...'],
        };
        const rule = {
            id: `discovered_time_${timeOfDay}_${action}_${Date.now()}`,
            name: `${timeOfDay}に${action}する（発見）`,
            description: `${timeOfDay}の時間帯に${action}すると満足度が高いことを学んだ`,
            condition: (ctx) => ctx.timeOfDay === timeOfDay && ctx.body.energy > 0.2,
            action: action,
            duration: 25,
            interruptible: true,
            priority: 35 + Math.floor((insight.totalSatisfaction / insight.attempts) * 15),
            satisfies: this.inferSatisfiedUrges(action),
            energyCost: 0.08,
            thoughtTemplates: thoughtMap[timeOfDay] || ['新しい習慣...'],
            _meta: {
                conditionType: 'time_specific',
                timeOfDay,
                action,
            },
        };
        this.customRules.push(rule);
        return {
            type: 'time_specific',
            ruleId: rule.id,
            description: `${timeOfDay}に${action}をすると心地よいことを発見した`,
            discoveredAt: Date.now(),
            basedOnAttempts: insight.attempts,
            confidence: insight.successes / insight.attempts,
        };
    }
    /**
     * 感情パターンから新ルールを生成
     */
    createEmotionTriggeredRule(insight, pattern) {
        const action = insight.action;
        const triggerEmotion = pattern.trigger;
        const rule = {
            id: `discovered_emo_${triggerEmotion}_${action}_${Date.now()}`,
            name: `${triggerEmotion}の時に${action}（発見）`,
            description: `${triggerEmotion}を感じた時に${action}すると${pattern.resultEmotion}になれることを学んだ`,
            condition: (ctx) => ctx.emotion.levels[triggerEmotion] > 0.4 && ctx.body.energy > 0.2,
            action: action,
            duration: 25,
            interruptible: true,
            priority: 40 + Math.floor(pattern.frequency * 10),
            satisfies: this.inferSatisfiedUrges(action),
            energyCost: 0.08,
            thoughtTemplates: [
                `こういう時は${this.actionToJapanese(action)}のがいいって知ってる...`,
                `${this.emotionToJapanese(triggerEmotion)}な時は、これ...`,
            ],
            _meta: {
                conditionType: 'emotion_triggered',
                triggerEmotion,
                action,
                resultEmotion: pattern.resultEmotion,
            },
        };
        this.customRules.push(rule);
        return {
            type: 'emotion_triggered',
            ruleId: rule.id,
            description: `${this.emotionToJapanese(triggerEmotion)}な時に${this.actionToJapanese(action)}と${this.emotionToJapanese(pattern.resultEmotion)}になれることを発見した`,
            discoveredAt: Date.now(),
            basedOnAttempts: insight.attempts,
            confidence: pattern.frequency / insight.attempts,
        };
    }
    /**
     * エネルギー最適化ルール
     */
    createEnergyOptimizedRule(insight, pattern) {
        const action = insight.action;
        const [minEnergy, maxEnergy] = pattern.optimalEnergyRange;
        const rule = {
            id: `discovered_energy_${action}_${Date.now()}`,
            name: `最適なタイミングで${action}（発見）`,
            description: `エネルギーが${(minEnergy * 100).toFixed(0)}〜${(maxEnergy * 100).toFixed(0)}%の時に${action}すると最も良い結果を得られることを学んだ`,
            condition: (ctx) => ctx.body.energy >= minEnergy && ctx.body.energy <= maxEnergy,
            action: action,
            duration: 30,
            interruptible: true,
            priority: 38 + Math.floor(pattern.avgSatisfaction * 12),
            satisfies: this.inferSatisfiedUrges(action),
            energyCost: 0.08,
            thoughtTemplates: [
                'ちょうどいい感じ...今なら...',
                `今の状態なら${this.actionToJapanese(action)}のにぴったり...`,
            ],
            _meta: {
                conditionType: 'energy_optimized',
                action,
                minEnergy,
                maxEnergy,
            },
        };
        this.customRules.push(rule);
        return {
            type: 'energy_optimized',
            ruleId: rule.id,
            description: `${this.actionToJapanese(action)}のに最適なエネルギー範囲を発見した`,
            discoveredAt: Date.now(),
            basedOnAttempts: insight.attempts,
            confidence: pattern.avgSatisfaction,
        };
    }
    /**
     * 行動連鎖ルールの発見
     */
    tryDiscoverSequenceRule(insight) {
        // 履歴から連続して成功した行動ペアを探す
        if (this.actionHistory.length < 10)
            return;
        const sequenceCounts = new Map();
        for (let i = 1; i < this.actionHistory.length; i++) {
            const prev = this.actionHistory[i - 1];
            const curr = this.actionHistory[i];
            const key = `${prev.action}→${curr.action}`;
            const existing = sequenceCounts.get(key) || { count: 0, satisfaction: 0 };
            existing.count++;
            sequenceCounts.set(key, existing);
        }
        for (const [key, data] of sequenceCounts) {
            if (data.count >= 3) {
                const [prevAction, currAction] = key.split('→');
                const existingSequence = this.customRules.find(r => r.id.includes(`seq_${prevAction}_${currAction}`));
                if (!existingSequence && currAction !== prevAction) {
                    const lastAction = this.recentActions[this.recentActions.length - 1];
                    const rule = {
                        id: `discovered_seq_${prevAction}_${currAction}_${Date.now()}`,
                        name: `${prevAction}の後に${currAction}（発見）`,
                        description: `${prevAction}の後に${currAction}をする流れを好むことを学んだ`,
                        condition: (ctx) => ctx.recentActions[ctx.recentActions.length - 1] === prevAction && ctx.body.energy > 0.2,
                        action: currAction,
                        duration: 25,
                        interruptible: true,
                        priority: 42,
                        satisfies: this.inferSatisfiedUrges(currAction),
                        energyCost: 0.08,
                        thoughtTemplates: [
                            `${this.actionToJapanese(prevAction)}の後は、自然と...`,
                            'なんだか、次はこれがしたい...',
                        ],
                        _meta: {
                            conditionType: 'sequence',
                            prevAction,
                            currAction,
                        },
                    };
                    this.customRules.push(rule);
                    this.discoveryLog.push({
                        type: 'sequence',
                        ruleId: rule.id,
                        description: `${this.actionToJapanese(prevAction)}の後に${this.actionToJapanese(currAction)}したくなるパターンを発見した`,
                        discoveredAt: Date.now(),
                        basedOnAttempts: data.count,
                        confidence: Math.min(0.9, data.count / 10),
                    });
                }
            }
        }
        // カスタムルール数の制限（最大20個）
        if (this.customRules.length > 20) {
            // 最も使われていないルールを削除
            const ruleUse = new Map();
            for (const entry of this.actionHistory) {
                ruleUse.set(entry.rule, (ruleUse.get(entry.rule) || 0) + 1);
            }
            this.customRules.sort((a, b) => (ruleUse.get(b.id) || 0) - (ruleUse.get(a.id) || 0));
            this.customRules = this.customRules.slice(0, 20);
        }
    }
    // --- ヘルパーメソッド ---
    findEmotionActionPattern(insight) {
        // 最も多い行動後の感情を見つける
        let bestResult = null;
        let bestCount = 0;
        for (const [emotion, count] of Object.entries(insight.emotionAfterCounts)) {
            if (count > bestCount) {
                bestCount = count;
                bestResult = emotion;
            }
        }
        if (!bestResult || bestCount < 3)
            return null;
        // 良い結果の場合のみ
        const positiveEmotions = ['joy', 'contentment', 'serenity', 'wonder', 'gratitude'];
        if (!positiveEmotions.includes(bestResult))
            return null;
        return {
            trigger: insight.emotionBefore,
            resultEmotion: bestResult,
            frequency: bestCount,
        };
    }
    findEnergyPattern(insight) {
        if (insight.contexts.length < 5)
            return null;
        // 満足度の高い文脈のエネルギーレベルを分析
        const highSat = insight.contexts.filter(c => c.satisfaction > 0.6);
        if (highSat.length < 3)
            return null;
        const energies = highSat.map(c => c.energyLevel).sort((a, b) => a - b);
        const minEnergy = energies[0];
        const maxEnergy = energies[energies.length - 1];
        const avgSat = highSat.reduce((s, c) => s + c.satisfaction, 0) / highSat.length;
        // 既存ルールと大差ない場合はスキップ
        if (maxEnergy - minEnergy > 0.6)
            return null;
        return {
            optimalEnergyRange: [Math.max(0.1, minEnergy - 0.05), Math.min(1, maxEnergy + 0.05)],
            avgSatisfaction: avgSat,
        };
    }
    getTopUrge(context) {
        let topType = 'none';
        let topLevel = 0;
        for (const [type, urge] of Object.entries(context.urges.urges)) {
            if (urge && urge.level > topLevel) {
                topLevel = urge.level;
                topType = type;
            }
        }
        return { type: topType, level: topLevel };
    }
    inferSatisfiedUrges(action) {
        // 既存ルールから同じアクションのsatisfiesを推定
        const existingRule = this.rules.find(r => r.action === action);
        if (existingRule)
            return existingRule.satisfies;
        // フォールバック推定
        const urgeMap = {
            sing: ['expression', 'creation'],
            hum: ['expression'],
            write: ['creation', 'expression'],
            read_book: ['curiosity', 'understanding'],
            search_wikipedia: ['curiosity', 'understanding'],
            think: ['meaning', 'understanding'],
            wander: ['move', 'exploration'],
            rest: ['rest', 'comfort'],
            examine: ['curiosity'],
            look_outside: ['connection'],
            daydream: ['creation', 'exploration'],
        };
        return urgeMap[action] || ['comfort'];
    }
    actionToJapanese(action) {
        const map = {
            sing: '歌う', hum: '鼻歌を歌う', write: '書く', read_book: '本を読む',
            search_wikipedia: '調べもの', think: '考え事', wander: '散歩',
            rest: '休む', examine: '観察', look_outside: '窓の外を見る',
            daydream: '空想', remember: '思い出す', draw: '絵を描く',
            write_diary: '日記を書く', sleep: '眠る', sit_down: '座る',
            stretch: '伸びをする', speak: '話す',
        };
        return map[action] || action;
    }
    emotionToJapanese(emotion) {
        const map = {
            joy: '嬉しい', melancholy: '物寂しい', curiosity: '好奇心旺盛',
            loneliness: '寂しい', contentment: '満ち足りた', serenity: '穏やか',
            anxiety: '不安', wonder: '驚き', nostalgia: '懐かしい',
            boredom: '退屈', gratitude: '感謝', excitement: 'わくわく',
        };
        return map[emotion] || emotion;
    }
    /**
     * メタデータからカスタムルールを再構築
     */
    regenerateCustomRule(saved) {
        const meta = saved._meta;
        if (!meta)
            return;
        let condition = null;
        switch (meta.conditionType) {
            case 'time_specific':
                condition = (ctx) => ctx.timeOfDay === meta.timeOfDay && ctx.body.energy > 0.2;
                break;
            case 'emotion_triggered':
                condition = (ctx) => ctx.emotion.levels[meta.triggerEmotion] > 0.4 && ctx.body.energy > 0.2;
                break;
            case 'energy_optimized':
                condition = (ctx) => ctx.body.energy >= meta.minEnergy && ctx.body.energy <= meta.maxEnergy;
                break;
            case 'sequence':
                condition = (ctx) => ctx.recentActions[ctx.recentActions.length - 1] === meta.prevAction && ctx.body.energy > 0.2;
                break;
        }
        if (condition) {
            this.customRules.push({
                id: saved.id,
                name: saved.name || '復元ルール',
                description: saved.description || '',
                condition,
                action: saved.action,
                target: saved.target,
                duration: saved.duration || 25,
                interruptible: saved.interruptible !== false,
                priority: saved.priority || 35,
                satisfies: saved.satisfies || ['comfort'],
                energyCost: saved.energyCost || 0.08,
                thoughtTemplates: saved.thoughtTemplates || ['...'],
                _meta: meta,
            });
        }
    }
    /**
     * 発見ログを取得
     */
    getDiscoveries() {
        return [...this.discoveryLog];
    }
    /**
     * カスタムルール数を取得
     */
    getCustomRuleCount() {
        return this.customRules.length;
    }
    /**
     * 行動インサイトのサマリー
     */
    getInsightSummary() {
        const results = [];
        for (const [, insight] of this.behaviorInsights) {
            results.push({
                action: insight.action,
                timeOfDay: insight.timeOfDay,
                successRate: insight.successes / Math.max(1, insight.attempts),
                avgSatisfaction: insight.totalSatisfaction / Math.max(1, insight.attempts),
            });
        }
        return results.sort((a, b) => b.avgSatisfaction - a.avgSatisfaction);
    }
}
exports.BehaviorEngine = BehaviorEngine;
//# sourceMappingURL=BehaviorEngine.js.map