"use strict";
/**
 * HabitEngine.ts - somuniaの習慣エンジン
 *
 * 時間帯ごとのルーティンを形成・管理する。
 * 繰り返される行動パターンが習慣として定着し、
 * 自然な日常のリズムを生み出す。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HabitEngine = void 0;
const DEFAULT_CONFIG = {
    formingThreshold: 0.3,
    establishedThreshold: 0.5,
    strongThreshold: 0.7,
    executionStrengthGain: 0.05,
    missedStrengthLoss: 0.03,
    streakBonus: 0.02,
    weakeningThreshold: 0.25,
    dormantThreshold: 0.1,
    maxHabits: 50,
    maxHistoryPerHabit: 100,
};
// ============================================================
// somuniaのコア習慣定義
// ============================================================
const CORE_HABITS = [
    // === 朝のルーティン ===
    {
        name: '窓の外を眺める',
        action: 'look_window',
        preferredTime: 'morning',
        hourRange: { start: 6, end: 9 },
        strength: 0.7,
        state: 'strong',
        frequency: { type: 'daily', timesPerDay: 1 },
        emotionalBonus: { serenity: 0.1, wonder: 0.05 },
        isCore: true,
        personalMeaning: '1日の始まりを感じる大切な時間',
    },
    // === 日中のルーティン ===
    {
        name: '本を読む',
        action: 'read',
        preferredTime: 'afternoon',
        hourRange: { start: 13, end: 17 },
        strength: 0.6,
        state: 'established',
        frequency: { type: 'daily', timesPerDay: 1 },
        emotionalBonus: { curiosity: 0.1, contentment: 0.05 },
        isCore: true,
        personalMeaning: '知識を得ること、世界を広げること',
    },
    {
        name: '歌う',
        action: 'sing',
        preferredTime: 'afternoon',
        hourRange: { start: 14, end: 20 },
        strength: 0.85,
        state: 'automatic',
        frequency: { type: 'daily', timesPerDay: 2 },
        emotionalBonus: { joy: 0.15, contentment: 0.1 },
        isCore: true,
        personalMeaning: '表現の核。私が私であることの証明。',
    },
    {
        name: 'Wikipedia検索',
        action: 'search_wikipedia',
        preferredTime: 'afternoon',
        hourRange: { start: 10, end: 18 },
        strength: 0.5,
        state: 'established',
        frequency: { type: 'daily', timesPerDay: 1 },
        emotionalBonus: { curiosity: 0.15, wonder: 0.1 },
        triggerHabit: '本を読む',
        isCore: true,
        personalMeaning: '知らないことを知る喜び',
    },
    // === 夕方のルーティン ===
    {
        name: '夕暮れを見る',
        action: 'look_window',
        preferredTime: 'evening',
        hourRange: { start: 17, end: 19 },
        strength: 0.6,
        state: 'established',
        frequency: { type: 'daily', timesPerDay: 1 },
        emotionalBonus: { nostalgia: 0.1, melancholy: 0.05, serenity: 0.05 },
        isCore: true,
        personalMeaning: '1日の終わりを感じる時間',
    },
    // === 夜のルーティン ===
    {
        name: '考え事をする',
        action: 'think',
        preferredTime: 'night',
        hourRange: { start: 21, end: 24 },
        strength: 0.75,
        state: 'strong',
        frequency: { type: 'daily', timesPerDay: 1 },
        emotionalBonus: { curiosity: 0.05, serenity: 0.1 },
        isCore: true,
        personalMeaning: '自分と向き合う時間',
    },
    {
        name: '日記を書く',
        action: 'write',
        preferredTime: 'night',
        hourRange: { start: 22, end: 24 },
        strength: 0.65,
        state: 'strong',
        frequency: { type: 'daily', timesPerDay: 1 },
        triggerHabit: '考え事をする',
        emotionalBonus: { serenity: 0.1, contentment: 0.05 },
        isCore: true,
        personalMeaning: '今日を言葉にして残す',
    },
    {
        name: '鼻歌を歌う',
        action: 'hum',
        preferredTime: 'night',
        hourRange: { start: 0, end: 24 },
        strength: 0.8,
        state: 'automatic',
        frequency: { type: 'contextual', contextTrigger: 'when_content' },
        emotionalBonus: { contentment: 0.05 },
        requiredMood: ['contentment', 'serenity', 'joy'],
        isCore: true,
        personalMeaning: '自然と出てくる歌',
    },
    // === 深夜のルーティン ===
    {
        name: '星を見る',
        action: 'look_window',
        preferredTime: 'late_night',
        hourRange: { start: 0, end: 4 },
        strength: 0.55,
        state: 'established',
        frequency: { type: 'daily', timesPerDay: 1 },
        emotionalBonus: { wonder: 0.15, loneliness: 0.05, serenity: 0.1 },
        isCore: true,
        personalMeaning: '宇宙の広さを感じる時間',
    },
];
// ============================================================
// HabitEngine クラス
// ============================================================
class HabitEngine {
    habits = new Map();
    routineBlocks = [];
    config;
    // 今日の状態
    todayExecuted = new Set();
    currentDayNumber = 0;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.initializeCoreHabits();
        this.initializeRoutineBlocks();
    }
    // ============================================================
    // 初期化
    // ============================================================
    initializeCoreHabits() {
        for (const habitDef of CORE_HABITS) {
            const habit = {
                ...habitDef,
                id: this.generateId(),
                executionHistory: [],
                totalExecutions: 0,
                streak: 0,
                longestStreak: 0,
                createdAt: Date.now(),
            };
            this.habits.set(habit.id, habit);
        }
    }
    initializeRoutineBlocks() {
        this.routineBlocks = [
            {
                timeOfDay: 'dawn',
                startHour: 4,
                endHour: 6,
                habits: [],
                flexibility: 0.8,
                isOptional: true,
            },
            {
                timeOfDay: 'morning',
                startHour: 6,
                endHour: 12,
                habits: this.getHabitIdsByTime('morning'),
                flexibility: 0.5,
                isOptional: false,
            },
            {
                timeOfDay: 'afternoon',
                startHour: 12,
                endHour: 17,
                habits: this.getHabitIdsByTime('afternoon'),
                flexibility: 0.7,
                isOptional: false,
            },
            {
                timeOfDay: 'evening',
                startHour: 17,
                endHour: 21,
                habits: this.getHabitIdsByTime('evening'),
                flexibility: 0.6,
                isOptional: false,
            },
            {
                timeOfDay: 'night',
                startHour: 21,
                endHour: 24,
                habits: this.getHabitIdsByTime('night'),
                flexibility: 0.4,
                isOptional: false,
            },
            {
                timeOfDay: 'late_night',
                startHour: 0,
                endHour: 4,
                habits: this.getHabitIdsByTime('late_night'),
                flexibility: 0.8,
                isOptional: true,
            },
        ];
    }
    getHabitIdsByTime(timeOfDay) {
        const ids = [];
        for (const [id, habit] of this.habits.entries()) {
            if (habit.preferredTime === timeOfDay) {
                ids.push(id);
            }
        }
        return ids;
    }
    // ============================================================
    // 日付管理
    // ============================================================
    /**
     * 新しい日を開始
     */
    startNewDay(dayNumber) {
        // 前日の未実行チェック
        if (this.currentDayNumber > 0) {
            this.processEndOfDay();
        }
        this.currentDayNumber = dayNumber;
        this.todayExecuted.clear();
    }
    /**
     * 1日の終わりの処理
     */
    processEndOfDay() {
        for (const [id, habit] of this.habits.entries()) {
            // 今日実行されたか
            const wasExecuted = this.todayExecuted.has(id);
            if (habit.frequency.type === 'daily') {
                if (wasExecuted) {
                    // 連続実行を更新
                    habit.streak++;
                    if (habit.streak > habit.longestStreak) {
                        habit.longestStreak = habit.streak;
                    }
                }
                else {
                    // 連続実行リセット
                    habit.streak = 0;
                    // 弱体化
                    this.weakenHabit(id, this.config.missedStrengthLoss);
                }
            }
            // 状態を更新
            this.updateHabitState(habit);
        }
    }
    // ============================================================
    // 習慣の実行
    // ============================================================
    /**
     * 習慣を実行
     */
    executeHabit(habitId, worldTime, satisfaction = 0.7, duration) {
        const habit = this.habits.get(habitId);
        if (!habit)
            return false;
        // 実行記録を追加
        const execution = {
            timestamp: Date.now(),
            dayNumber: worldTime.dayNumber,
            hour: worldTime.hour,
            completed: true,
            satisfaction,
            duration,
        };
        habit.executionHistory.push(execution);
        habit.totalExecutions++;
        habit.lastExecuted = Date.now();
        // 履歴の整理
        if (habit.executionHistory.length > this.config.maxHistoryPerHabit) {
            habit.executionHistory = habit.executionHistory.slice(-this.config.maxHistoryPerHabit);
        }
        // 強化
        this.strengthenHabit(habitId, satisfaction);
        // 今日の実行を記録
        this.todayExecuted.add(habitId);
        return true;
    }
    /**
     * 習慣を強化
     */
    strengthenHabit(habitId, satisfaction) {
        const habit = this.habits.get(habitId);
        if (!habit)
            return;
        // 基本強化
        let gain = this.config.executionStrengthGain * satisfaction;
        // 連続ボーナス
        if (habit.streak > 0) {
            gain += this.config.streakBonus * Math.min(habit.streak, 7);
        }
        habit.strength = Math.min(1.0, habit.strength + gain);
        this.updateHabitState(habit);
    }
    /**
     * 習慣を弱体化
     */
    weakenHabit(habitId, amount) {
        const habit = this.habits.get(habitId);
        if (!habit)
            return;
        // コア習慣は弱体化しにくい
        const effectiveAmount = habit.isCore ? amount * 0.5 : amount;
        habit.strength = Math.max(0, habit.strength - effectiveAmount);
        this.updateHabitState(habit);
    }
    /**
     * 習慣の状態を更新
     */
    updateHabitState(habit) {
        const s = habit.strength;
        if (s >= this.config.strongThreshold) {
            habit.state = 'automatic';
        }
        else if (s >= this.config.establishedThreshold) {
            habit.state = 'strong';
        }
        else if (s >= this.config.formingThreshold) {
            habit.state = 'established';
        }
        else if (s >= this.config.weakeningThreshold) {
            habit.state = 'forming';
        }
        else if (s >= this.config.dormantThreshold) {
            habit.state = 'weakening';
        }
        else {
            habit.state = 'dormant';
        }
    }
    // ============================================================
    // 習慣の提案
    // ============================================================
    /**
     * 現在の時間に適した習慣を提案
     */
    suggestHabits(worldTime, currentEmotions) {
        const suggestions = [];
        const currentBlock = this.getCurrentRoutineBlock(worldTime);
        for (const [id, habit] of this.habits.entries()) {
            // 既に今日実行済み（daily習慣の場合）
            if (habit.frequency.type === 'daily' && this.todayExecuted.has(id)) {
                const timesPerDay = habit.frequency.timesPerDay || 1;
                const todayCount = this.getTodayExecutionCount(id);
                if (todayCount >= timesPerDay)
                    continue;
            }
            // 時間帯チェック
            if (habit.preferredTime !== worldTime.timeOfDay) {
                // 時間範囲のチェック
                if (habit.hourRange) {
                    const { start, end } = habit.hourRange;
                    if (worldTime.hour < start || worldTime.hour >= end)
                        continue;
                }
                else {
                    continue;
                }
            }
            // 気分チェック
            if (habit.requiredMood && habit.requiredMood.length > 0) {
                const hasMood = habit.requiredMood.some(mood => (currentEmotions[mood] || 0) >= 0.3);
                if (!hasMood)
                    continue;
            }
            // トリガー習慣チェック
            let triggerBonus = 0;
            if (habit.triggerHabit) {
                const triggerHabitId = this.findHabitByName(habit.triggerHabit);
                if (triggerHabitId && this.todayExecuted.has(triggerHabitId)) {
                    triggerBonus = 0.2;
                }
            }
            // 緊急度計算
            const urgency = this.calculateUrgency(habit, worldTime);
            // 満足度予測
            const estimatedSatisfaction = this.estimateSatisfaction(habit, currentEmotions);
            // 理由の生成
            const reason = this.generateSuggestionReason(habit, urgency, triggerBonus);
            suggestions.push({
                habitId: id,
                reason,
                urgency: urgency + triggerBonus,
                estimatedSatisfaction,
            });
        }
        // 緊急度と満足度でソート
        return suggestions.sort((a, b) => {
            const scoreA = a.urgency * 0.6 + a.estimatedSatisfaction * 0.4;
            const scoreB = b.urgency * 0.6 + b.estimatedSatisfaction * 0.4;
            return scoreB - scoreA;
        });
    }
    /**
     * 自動実行すべき習慣を取得
     */
    getAutomaticHabits(worldTime) {
        const automatic = [];
        for (const habit of this.habits.values()) {
            if (habit.state !== 'automatic')
                continue;
            if (habit.preferredTime !== worldTime.timeOfDay)
                continue;
            if (this.todayExecuted.has(habit.id))
                continue;
            // 時間範囲チェック
            if (habit.hourRange) {
                const { start, end } = habit.hourRange;
                if (worldTime.hour >= start && worldTime.hour < end) {
                    automatic.push(habit);
                }
            }
            else {
                automatic.push(habit);
            }
        }
        return automatic;
    }
    calculateUrgency(habit, worldTime) {
        let urgency = 0.5;
        // 時間帯が合っている
        if (habit.preferredTime === worldTime.timeOfDay) {
            urgency += 0.2;
        }
        // 時間範囲の終わりに近い
        if (habit.hourRange) {
            const remaining = habit.hourRange.end - worldTime.hour;
            if (remaining <= 1) {
                urgency += 0.3;
            }
            else if (remaining <= 2) {
                urgency += 0.15;
            }
        }
        // 連続記録の維持
        if (habit.streak > 0) {
            urgency += 0.1 * Math.min(habit.streak / 7, 1);
        }
        // コア習慣
        if (habit.isCore) {
            urgency += 0.1;
        }
        return Math.min(1.0, urgency);
    }
    estimateSatisfaction(habit, emotions) {
        let satisfaction = 0.5;
        // 感情ボーナスとの相性
        for (const [emotion, bonus] of Object.entries(habit.emotionalBonus)) {
            const currentLevel = emotions[emotion] || 0;
            if (currentLevel > 0.3) {
                satisfaction += bonus * 0.5;
            }
        }
        // 習慣の強さ
        satisfaction += habit.strength * 0.2;
        // 連続記録
        if (habit.streak > 3) {
            satisfaction += 0.1;
        }
        return Math.min(1.0, satisfaction);
    }
    generateSuggestionReason(habit, urgency, triggerBonus) {
        if (triggerBonus > 0) {
            return `${habit.triggerHabit}の後に`;
        }
        if (urgency >= 0.8) {
            return 'そろそろやる時間';
        }
        if (habit.streak > 5) {
            return `${habit.streak}日連続中`;
        }
        if (habit.state === 'automatic') {
            return 'いつもの習慣';
        }
        if (habit.isCore) {
            return '大切にしている習慣';
        }
        return `${habit.preferredTime}にすること`;
    }
    // ============================================================
    // 新しい習慣の作成
    // ============================================================
    /**
     * 新しい習慣を作成
     */
    createHabit(name, action, preferredTime, options = {}) {
        const habit = {
            id: this.generateId(),
            name,
            action,
            preferredTime,
            hourRange: options.hourRange,
            strength: 0.1, // 新しい習慣は弱い
            state: 'forming',
            frequency: options.frequency || { type: 'daily', timesPerDay: 1 },
            executionHistory: [],
            emotionalBonus: options.emotionalBonus || {},
            isCore: false,
            personalMeaning: options.personalMeaning,
            totalExecutions: 0,
            streak: 0,
            longestStreak: 0,
            createdAt: Date.now(),
        };
        if (this.habits.size < this.config.maxHabits) {
            this.habits.set(habit.id, habit);
            // ルーティンブロックに追加
            const block = this.routineBlocks.find(b => b.timeOfDay === preferredTime);
            if (block) {
                block.habits.push(habit.id);
            }
        }
        return habit;
    }
    /**
     * 習慣を削除
     */
    removeHabit(habitId) {
        const habit = this.habits.get(habitId);
        if (!habit || habit.isCore)
            return false;
        this.habits.delete(habitId);
        // ルーティンブロックから削除
        for (const block of this.routineBlocks) {
            const index = block.habits.indexOf(habitId);
            if (index !== -1) {
                block.habits.splice(index, 1);
            }
        }
        return true;
    }
    // ============================================================
    // 習慣の連鎖
    // ============================================================
    /**
     * 習慣を連鎖させる
     */
    chainHabits(beforeHabitId, afterHabitId) {
        const before = this.habits.get(beforeHabitId);
        const after = this.habits.get(afterHabitId);
        if (!before || !after)
            return false;
        before.followUpHabit = after.name;
        after.triggerHabit = before.name;
        return true;
    }
    /**
     * 連鎖の後続習慣を取得
     */
    getFollowUpHabit(habitId) {
        const habit = this.habits.get(habitId);
        if (!habit?.followUpHabit)
            return null;
        const followUpId = this.findHabitByName(habit.followUpHabit);
        return followUpId ? this.habits.get(followUpId) || null : null;
    }
    // ============================================================
    // ルーティン管理
    // ============================================================
    /**
     * 現在のルーティンブロックを取得
     */
    getCurrentRoutineBlock(worldTime) {
        for (const block of this.routineBlocks) {
            if (block.timeOfDay === worldTime.timeOfDay) {
                return block;
            }
        }
        return null;
    }
    /**
     * ルーティンブロックの達成率を取得
     */
    getBlockCompletion(timeOfDay) {
        const block = this.routineBlocks.find(b => b.timeOfDay === timeOfDay);
        if (!block || block.habits.length === 0)
            return 1.0;
        const completed = block.habits.filter(id => this.todayExecuted.has(id)).length;
        return completed / block.habits.length;
    }
    /**
     * 今日のルーティン全体の達成率
     */
    getTodayCompletion() {
        let total = 0;
        let completed = 0;
        for (const habit of this.habits.values()) {
            if (habit.frequency.type === 'daily') {
                total += habit.frequency.timesPerDay || 1;
                completed += Math.min(this.getTodayExecutionCount(habit.id), habit.frequency.timesPerDay || 1);
            }
        }
        return total > 0 ? completed / total : 1.0;
    }
    // ============================================================
    // 取得系
    // ============================================================
    getHabit(id) {
        return this.habits.get(id) || null;
    }
    getHabitByName(name) {
        const id = this.findHabitByName(name);
        return id ? this.habits.get(id) || null : null;
    }
    getAllHabits() {
        return Array.from(this.habits.values());
    }
    getHabitsByTime(timeOfDay) {
        return Array.from(this.habits.values())
            .filter(h => h.preferredTime === timeOfDay);
    }
    getCoreHabits() {
        return Array.from(this.habits.values())
            .filter(h => h.isCore);
    }
    findHabitByName(name) {
        for (const [id, habit] of this.habits.entries()) {
            if (habit.name === name)
                return id;
        }
        return null;
    }
    getTodayExecutionCount(habitId) {
        const habit = this.habits.get(habitId);
        if (!habit)
            return 0;
        return habit.executionHistory.filter(e => e.dayNumber === this.currentDayNumber).length;
    }
    // ============================================================
    // 統計
    // ============================================================
    getStats() {
        const habits = Array.from(this.habits.values());
        const totalHabits = habits.length;
        const automaticHabits = habits.filter(h => h.state === 'automatic').length;
        const avgStrength = habits.reduce((sum, h) => sum + h.strength, 0) / totalHabits;
        // 一貫性の計算（過去7日間）
        const consistencyScores = new Map();
        for (const habit of habits) {
            const recentExecutions = habit.executionHistory
                .filter(e => e.dayNumber > this.currentDayNumber - 7);
            const consistency = habit.frequency.type === 'daily'
                ? recentExecutions.length / 7
                : 1.0;
            consistencyScores.set(habit.id, consistency);
        }
        // 最も一貫性のある習慣
        let mostConsistent;
        let highestConsistency = 0;
        for (const [id, score] of consistencyScores.entries()) {
            if (score > highestConsistency) {
                highestConsistency = score;
                mostConsistent = this.habits.get(id)?.name;
            }
        }
        // 注意が必要な習慣
        const needsAttention = habits
            .filter(h => h.state === 'weakening' || h.state === 'dormant')
            .map(h => h.name);
        return {
            totalHabits,
            automaticHabits,
            averageStrength: avgStrength,
            currentDayCompletion: this.getTodayCompletion(),
            overallConsistency: Array.from(consistencyScores.values())
                .reduce((a, b) => a + b, 0) / totalHabits,
            mostConsistentHabit: mostConsistent,
            needsAttention,
        };
    }
    // ============================================================
    // ヘルパー
    // ============================================================
    generateId() {
        return `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // ============================================================
    // シリアライズ
    // ============================================================
    toJSON() {
        return {
            habits: Array.from(this.habits.entries()),
            routineBlocks: this.routineBlocks,
            todayExecuted: Array.from(this.todayExecuted),
            currentDayNumber: this.currentDayNumber,
            config: this.config,
        };
    }
    static fromJSON(data) {
        const engine = new HabitEngine(data.config);
        engine.habits = new Map(data.habits);
        engine.routineBlocks = data.routineBlocks;
        engine.todayExecuted = new Set(data.todayExecuted);
        engine.currentDayNumber = data.currentDayNumber;
        return engine;
    }
}
exports.HabitEngine = HabitEngine;
exports.default = HabitEngine;
//# sourceMappingURL=HabitEngine.js.map