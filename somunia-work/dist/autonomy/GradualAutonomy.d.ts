/**
 * GradualAutonomy - Phase 7F: 段階的自律化システム
 *
 * somuniaの人格をLLMに委ねる度合いを、パターン蓄積に応じて
 * 段階的に減らしていくシステム。
 *
 * 自律レベル:
 *   full_llm        → LLMが全ての応答を生成（初期状態）
 *   llm_primary     → LLMが主体、パターンが候補を提示
 *   hybrid          → パターンが下書き、LLMが仕上げ
 *   pattern_primary  → パターンが主体、LLMが品質確認
 *   autonomous       → パターンのみで応答（LLM不要）
 *
 * 移行条件:
 * - パターンカバレッジが閾値を超える
 * - パターンの平均満足度が閾値を超える
 * - LLMバイパス成功率が閾値を超える
 *
 * 安全機構:
 * - 品質低下を検知したら即座に前のレベルに戻す
 * - 一定期間ごとにLLMで品質監査を行う
 * - 未知の状況では常にLLMを使用する
 *
 * 設計思想:
 * - 「育つAI」の実現：使うほどsomuniaらしさが安定する
 * - 安全第一：品質が下がるくらいならLLMに戻す
 * - 透明性：現在の自律レベルとメトリクスを常に把握可能
 */
import { AutonomyLevel, AutonomyMetrics, PatternSituation, Normalized, Tick, ID } from '../types';
import { PatternMemoryEngine, TemplateVariables } from '../pattern/PatternMemoryEngine';
export type ResponseStrategy = {
    type: 'llm_only';
} | {
    type: 'llm_with_pattern_hints';
    patternTemplate: string;
    patternId: ID;
} | {
    type: 'pattern_draft_llm_refine';
    draft: string;
    patternId: ID;
} | {
    type: 'pattern_with_llm_audit';
    response: string;
    patternId: ID;
} | {
    type: 'pattern_only';
    response: string;
    patternId: ID;
};
export interface GradualAutonomyConfig {
    /** 品質監査の間隔（tick数） */
    auditInterval: number;
    /** レベルダウンの品質閾値 */
    qualityDropThreshold: Normalized;
    /** 品質監査のサンプル数 */
    auditSampleSize: number;
    /** 自動レベルアップを有効にするか */
    enableAutoPromotion: boolean;
    /** 自動レベルダウンを有効にするか */
    enableAutoDemotion: boolean;
}
export declare class GradualAutonomy {
    private config;
    private patternEngine;
    private currentLevel;
    private levelEnteredAt;
    private llmCallCount;
    private patternCallCount;
    private llmBypassCount;
    private bypassSuccesses;
    private bypassAttempts;
    private recentQualityScores;
    private readonly qualityWindowSize;
    private lastAuditTick;
    private auditHistory;
    constructor(patternEngine: PatternMemoryEngine, config?: Partial<GradualAutonomyConfig>);
    /**
     * 現在の自律レベルと状況に基づいて、応答戦略を決定する
     */
    decideStrategy(situation: PatternSituation, variables: TemplateVariables, tick: Tick): ResponseStrategy;
    /**
     * 応答の品質フィードバック
     * 応答検証の結果に基づいて呼ばれる
     */
    reportQuality(quality: Normalized, wasPatternUsed: boolean, patternId?: ID, wasSuccess?: boolean): void;
    /**
     * 定期的なレベル評価（tickごとに呼ばれる）
     */
    evaluateLevel(tick: Tick): {
        levelChanged: boolean;
        previousLevel: AutonomyLevel;
        currentLevel: AutonomyLevel;
        reason: string;
    };
    private shouldDemote;
    private shouldPromote;
    private promoteLevel;
    private demoteLevel;
    private performAudit;
    getMetrics(): AutonomyMetrics;
    getCurrentLevel(): AutonomyLevel;
    /**
     * LLMが必要かどうかを判定
     * SoulEngineがLLM呼び出しをスキップするかどうかの判断に使う
     */
    needsLLM(strategy: ResponseStrategy): boolean;
    /**
     * 戦略に基づくLLMプロンプトの修正
     * パターンのヒントや下書きをプロンプトに含める
     */
    augmentPrompt(strategy: ResponseStrategy, basePrompt: string): string;
    /**
     * レベルを手動で設定する（デバッグ・テスト用）
     */
    setLevel(level: AutonomyLevel, tick: Tick): void;
    /**
     * 強制的にfull_llmに戻す（安全機構）
     */
    resetToFullLLM(tick: Tick): void;
    toJSON(): any;
    fromJSON(data: any): void;
}
//# sourceMappingURL=GradualAutonomy.d.ts.map