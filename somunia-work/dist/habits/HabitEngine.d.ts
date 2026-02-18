/**
 * HabitEngine.ts - somuniaの習慣エンジン
 *
 * 時間帯ごとのルーティンを形成・管理する。
 * 繰り返される行動パターンが習慣として定着し、
 * 自然な日常のリズムを生み出す。
 */
import { ActionType, TimeOfDay, EmotionType, WorldTime } from '../types';
/** 習慣の状態 */
export type HabitState = 'forming' | 'established' | 'strong' | 'automatic' | 'weakening' | 'dormant';
/** 習慣の定義 */
export interface Habit {
    id: string;
    name: string;
    action: ActionType;
    preferredTime: TimeOfDay;
    hourRange?: {
        start: number;
        end: number;
    };
    strength: number;
    state: HabitState;
    frequency: HabitFrequency;
    executionHistory: HabitExecution[];
    triggerHabit?: string;
    followUpHabit?: string;
    emotionalBonus: Partial<Record<EmotionType, number>>;
    requiredMood?: EmotionType[];
    isCore: boolean;
    personalMeaning?: string;
    totalExecutions: number;
    streak: number;
    longestStreak: number;
    lastExecuted?: number;
    createdAt: number;
}
/** 習慣の頻度 */
export interface HabitFrequency {
    type: 'daily' | 'weekly' | 'contextual';
    timesPerDay?: number;
    daysOfWeek?: number[];
    contextTrigger?: string;
}
/** 習慣の実行記録 */
export interface HabitExecution {
    timestamp: number;
    dayNumber: number;
    hour: number;
    completed: boolean;
    satisfaction: number;
    duration?: number;
    notes?: string;
}
/** ルーティンブロック */
export interface RoutineBlock {
    timeOfDay: TimeOfDay;
    startHour: number;
    endHour: number;
    habits: string[];
    flexibility: number;
    isOptional: boolean;
}
/** 習慣の提案 */
export interface HabitSuggestion {
    habitId: string;
    reason: string;
    urgency: number;
    estimatedSatisfaction: number;
}
/** 習慣エンジンの統計 */
export interface HabitStats {
    totalHabits: number;
    automaticHabits: number;
    averageStrength: number;
    currentDayCompletion: number;
    overallConsistency: number;
    mostConsistentHabit?: string;
    needsAttention: string[];
}
export interface HabitEngineConfig {
    formingThreshold: number;
    establishedThreshold: number;
    strongThreshold: number;
    executionStrengthGain: number;
    missedStrengthLoss: number;
    streakBonus: number;
    weakeningThreshold: number;
    dormantThreshold: number;
    maxHabits: number;
    maxHistoryPerHabit: number;
}
export declare class HabitEngine {
    private habits;
    private routineBlocks;
    private config;
    private todayExecuted;
    private currentDayNumber;
    constructor(config?: Partial<HabitEngineConfig>);
    private initializeCoreHabits;
    private initializeRoutineBlocks;
    private getHabitIdsByTime;
    /**
     * 新しい日を開始
     */
    startNewDay(dayNumber: number): void;
    /**
     * 1日の終わりの処理
     */
    private processEndOfDay;
    /**
     * 習慣を実行
     */
    executeHabit(habitId: string, worldTime: WorldTime, satisfaction?: number, duration?: number): boolean;
    /**
     * 習慣を強化
     */
    private strengthenHabit;
    /**
     * 習慣を弱体化
     */
    private weakenHabit;
    /**
     * 習慣の状態を更新
     */
    private updateHabitState;
    /**
     * 現在の時間に適した習慣を提案
     */
    suggestHabits(worldTime: WorldTime, currentEmotions: Partial<Record<EmotionType, number>>): HabitSuggestion[];
    /**
     * 自動実行すべき習慣を取得
     */
    getAutomaticHabits(worldTime: WorldTime): Habit[];
    private calculateUrgency;
    private estimateSatisfaction;
    private generateSuggestionReason;
    /**
     * 新しい習慣を作成
     */
    createHabit(name: string, action: ActionType, preferredTime: TimeOfDay, options?: {
        hourRange?: {
            start: number;
            end: number;
        };
        frequency?: HabitFrequency;
        emotionalBonus?: Partial<Record<EmotionType, number>>;
        personalMeaning?: string;
    }): Habit;
    /**
     * 習慣を削除
     */
    removeHabit(habitId: string): boolean;
    /**
     * 習慣を連鎖させる
     */
    chainHabits(beforeHabitId: string, afterHabitId: string): boolean;
    /**
     * 連鎖の後続習慣を取得
     */
    getFollowUpHabit(habitId: string): Habit | null;
    /**
     * 現在のルーティンブロックを取得
     */
    getCurrentRoutineBlock(worldTime: WorldTime): RoutineBlock | null;
    /**
     * ルーティンブロックの達成率を取得
     */
    getBlockCompletion(timeOfDay: TimeOfDay): number;
    /**
     * 今日のルーティン全体の達成率
     */
    getTodayCompletion(): number;
    getHabit(id: string): Habit | null;
    getHabitByName(name: string): Habit | null;
    getAllHabits(): Habit[];
    getHabitsByTime(timeOfDay: TimeOfDay): Habit[];
    getCoreHabits(): Habit[];
    private findHabitByName;
    private getTodayExecutionCount;
    getStats(): HabitStats;
    private generateId;
    toJSON(): object;
    static fromJSON(data: any): HabitEngine;
}
export default HabitEngine;
//# sourceMappingURL=HabitEngine.d.ts.map