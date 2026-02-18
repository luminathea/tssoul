/**
 * ProceduralMemorySystem - 手続き記憶システム
 *
 * somuniaが習得したスキルや習慣を管理する
 * 練習により習熟度が上がり、自動化される
 *
 * 設計原則:
 * - スキルは練習により習熟
 * - 習熟度が上がると自動化（無意識に実行可能）
 * - 使わないスキルは徐々に錆びる
 * - 関連スキル間で転移が起こる
 */
import { ProceduralMemory, Normalized, Timestamp, Tick, ID, ActionType } from '../types';
export interface ProceduralMemoryConfig {
    maxSkills: number;
    practiceGain: number;
    rustRate: number;
    automatizationThreshold: number;
    transferRate: number;
    deletionThreshold: number;
}
export type SkillCategory = 'expression' | 'physical' | 'cognitive' | 'social' | 'creative' | 'technical';
export interface SkillExecutionEvent {
    timestamp: Timestamp;
    skillId: ID;
    type: 'practiced' | 'automatic' | 'struggled' | 'rusted' | 'transferred';
    success: boolean;
    details: string;
}
export declare class ProceduralMemorySystem {
    private skills;
    private config;
    private eventLog;
    private lastMaintenanceTick;
    private skillNameIndex;
    private categoryIndex;
    private actionIndex;
    constructor(config?: Partial<ProceduralMemoryConfig>);
    /**
     * 基本スキルを初期化
     */
    private initializeBaseSkills;
    /**
     * 新しいスキルを学習
     */
    learnSkill(params: {
        skill: string;
        steps: string[];
        initialProficiency?: Normalized;
        category?: SkillCategory;
        relatedActions?: ActionType[];
    }): ProceduralMemory;
    /**
     * IDを生成
     */
    private generateId;
    /**
     * スキルを練習（実行）
     */
    practice(skillName: string): {
        skill: ProceduralMemory;
        execution: SkillExecution;
        event: SkillExecutionEvent;
    } | null;
    /**
     * スキルを実行
     */
    private executeSkill;
    /**
     * 学習の転移
     */
    private transferLearning;
    /**
     * アクションに関連するスキルを実行
     */
    practiceByAction(action: ActionType): Array<{
        skill: ProceduralMemory;
        execution: SkillExecution;
    }>;
    /**
     * 定期メンテナンス（錆び付き処理）
     */
    performMaintenance(currentTick: Tick): void;
    /**
     * スキルを削除
     */
    private deleteSkill;
    /**
     * 容量制限を適用
     */
    private enforceCapacity;
    /**
     * 履歴をトリミング
     */
    private trimHistory;
    /**
     * スキルを名前で取得
     */
    getSkill(skillName: string): ProceduralMemory | null;
    /**
     * スキル数を取得
     */
    getSkillCount(): number;
    /**
     * カテゴリでスキルを取得
     */
    getSkillsByCategory(category: SkillCategory): ProceduralMemory[];
    /**
     * 習熟度の高いスキルを取得
     */
    getMostProficientSkills(limit?: number): ProceduralMemory[];
    /**
     * 自動化されたスキルを取得
     */
    getAutomaticSkills(): ProceduralMemory[];
    /**
     * 練習が必要なスキルを取得
     */
    getSkillsNeedingPractice(limit?: number): ProceduralMemory[];
    /**
     * アクションに必要なスキルを確認
     */
    canPerformAction(action: ActionType): {
        canPerform: boolean;
        requiredSkills: ProceduralMemory[];
        overallProficiency: Normalized;
    };
    /**
     * 統計を取得
     */
    getStats(): {
        totalSkills: number;
        automaticSkills: number;
        avgProficiency: Normalized;
        mostPracticed: string | null;
        categoryDistribution: Record<SkillCategory, number>;
    };
    /**
     * 最近のイベントを取得
     */
    getRecentEvents(count?: number): SkillExecutionEvent[];
    /**
     * サマリーを取得
     */
    getSummary(): {
        totalSkills: number;
        mastered: string[];
        needsPractice: string[];
    };
    /**
     * JSON形式でエクスポート
     */
    toJSON(): object;
    /**
     * JSONからリストア
     */
    static fromJSON(json: any): ProceduralMemorySystem;
}
interface SkillExecution {
    success: boolean;
    automatic: boolean;
    struggled: boolean;
    details: string;
}
export default ProceduralMemorySystem;
//# sourceMappingURL=ProceduralMemory.d.ts.map