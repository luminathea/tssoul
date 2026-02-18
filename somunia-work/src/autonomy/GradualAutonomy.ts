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

import {
  AutonomyLevel,
  AutonomyMetrics,
  PatternSituation,
  Normalized,
  Tick,
  ID,
} from '../types';
import { PatternMemoryEngine, TemplateVariables } from '../pattern/PatternMemoryEngine';

// ============================================================
// 自律レベルの遷移条件
// ============================================================

interface LevelTransitionCondition {
  /** 必要なパターンカバレッジ */
  minCoverage: Normalized;
  /** 必要なパターン平均満足度 */
  minAvgSatisfaction: Normalized;
  /** 必要なパターン総数 */
  minPatternCount: number;
  /** 必要なバイパス成功率（前レベルでの実績） */
  minBypassSuccessRate: Normalized;
  /** 前レベルでの最低滞在tick数 */
  minTicksAtPreviousLevel: number;
}

const TRANSITION_CONDITIONS: Record<AutonomyLevel, LevelTransitionCondition | null> = {
  full_llm: null, // 初期状態、条件なし
  llm_primary: {
    minCoverage: 0.2,
    minAvgSatisfaction: 0.5,
    minPatternCount: 20,
    minBypassSuccessRate: 0,
    minTicksAtPreviousLevel: 100,
  },
  hybrid: {
    minCoverage: 0.4,
    minAvgSatisfaction: 0.6,
    minPatternCount: 80,
    minBypassSuccessRate: 0.6,
    minTicksAtPreviousLevel: 500,
  },
  pattern_primary: {
    minCoverage: 0.6,
    minAvgSatisfaction: 0.7,
    minPatternCount: 200,
    minBypassSuccessRate: 0.75,
    minTicksAtPreviousLevel: 1000,
  },
  autonomous: {
    minCoverage: 0.8,
    minAvgSatisfaction: 0.8,
    minPatternCount: 400,
    minBypassSuccessRate: 0.9,
    minTicksAtPreviousLevel: 2000,
  },
};

// レベルの順序
const LEVEL_ORDER: AutonomyLevel[] = [
  'full_llm', 'llm_primary', 'hybrid', 'pattern_primary', 'autonomous'
];

// ============================================================
// 応答戦略
// ============================================================

export type ResponseStrategy =
  | { type: 'llm_only' }
  | { type: 'llm_with_pattern_hints'; patternTemplate: string; patternId: ID }
  | { type: 'pattern_draft_llm_refine'; draft: string; patternId: ID }
  | { type: 'pattern_with_llm_audit'; response: string; patternId: ID }
  | { type: 'pattern_only'; response: string; patternId: ID };

// ============================================================
// GradualAutonomy クラス
// ============================================================

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

const DEFAULT_CONFIG: GradualAutonomyConfig = {
  auditInterval: 200,
  qualityDropThreshold: 0.15,
  auditSampleSize: 10,
  enableAutoPromotion: true,
  enableAutoDemotion: true,
};

export class GradualAutonomy {
  private config: GradualAutonomyConfig;
  private patternEngine: PatternMemoryEngine;

  // 現在の状態
  private currentLevel: AutonomyLevel = 'full_llm';
  private levelEnteredAt: Tick = 0;

  // メトリクス
  private llmCallCount: number = 0;
  private patternCallCount: number = 0;
  private llmBypassCount: number = 0;
  private bypassSuccesses: number = 0;
  private bypassAttempts: number = 0;
  private recentQualityScores: number[] = [];
  private readonly qualityWindowSize = 50;

  // 品質監査
  private lastAuditTick: Tick = 0;
  private auditHistory: Array<{
    tick: Tick;
    avgQuality: Normalized;
    level: AutonomyLevel;
  }> = [];

  constructor(
    patternEngine: PatternMemoryEngine,
    config?: Partial<GradualAutonomyConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.patternEngine = patternEngine;
  }

  // ============================================================
  // メイン: 応答戦略の決定
  // ============================================================

  /**
   * 現在の自律レベルと状況に基づいて、応答戦略を決定する
   */
  decideStrategy(
    situation: PatternSituation,
    variables: TemplateVariables,
    tick: Tick
  ): ResponseStrategy {
    // パターンマッチを試みる
    const patternMatch = this.patternEngine.findBestMatch(situation, variables, tick);

    switch (this.currentLevel) {
      case 'full_llm':
        // 完全LLM依存：パターンは使わない
        this.llmCallCount++;
        return { type: 'llm_only' };

      case 'llm_primary':
        // LLM主体：パターンがあればヒントとして渡す
        this.llmCallCount++;
        if (patternMatch && patternMatch.score > 0.6) {
          this.patternCallCount++;
          return {
            type: 'llm_with_pattern_hints',
            patternTemplate: patternMatch.expandedTemplate,
            patternId: patternMatch.pattern.id,
          };
        }
        return { type: 'llm_only' };

      case 'hybrid':
        // ハイブリッド：パターンで下書き、LLMで仕上げ
        if (patternMatch && patternMatch.score > 0.5) {
          this.patternCallCount++;
          this.llmCallCount++;
          return {
            type: 'pattern_draft_llm_refine',
            draft: patternMatch.expandedTemplate,
            patternId: patternMatch.pattern.id,
          };
        }
        this.llmCallCount++;
        return { type: 'llm_only' };

      case 'pattern_primary':
        // パターン主体：パターンで応答し、LLMで品質確認
        if (patternMatch && patternMatch.score > 0.5) {
          this.patternCallCount++;
          this.bypassAttempts++;
          return {
            type: 'pattern_with_llm_audit',
            response: patternMatch.expandedTemplate,
            patternId: patternMatch.pattern.id,
          };
        }
        // パターンがない場合はLLMにフォールバック
        this.llmCallCount++;
        return { type: 'llm_only' };

      case 'autonomous':
        // 完全自律：パターンのみ
        if (patternMatch && patternMatch.score > 0.6) {
          this.patternCallCount++;
          this.llmBypassCount++;
          this.bypassAttempts++;
          return {
            type: 'pattern_only',
            response: patternMatch.expandedTemplate,
            patternId: patternMatch.pattern.id,
          };
        }
        // パターンがない場合はLLMにフォールバック（完全自律でも未知の状況は安全側に）
        this.llmCallCount++;
        return { type: 'llm_only' };
    }
  }

  // ============================================================
  // フィードバック
  // ============================================================

  /**
   * 応答の品質フィードバック
   * 応答検証の結果に基づいて呼ばれる
   */
  reportQuality(
    quality: Normalized,
    wasPatternUsed: boolean,
    patternId?: ID,
    wasSuccess?: boolean
  ): void {
    this.recentQualityScores.push(quality);
    if (this.recentQualityScores.length > this.qualityWindowSize) {
      this.recentQualityScores.shift();
    }

    if (wasPatternUsed && patternId) {
      this.patternEngine.feedback(
        patternId,
        wasSuccess !== undefined ? wasSuccess : quality > 0.5,
        quality
      );

      if (wasSuccess) {
        this.bypassSuccesses++;
      }
    }
  }

  // ============================================================
  // レベル管理
  // ============================================================

  /**
   * 定期的なレベル評価（tickごとに呼ばれる）
   */
  evaluateLevel(tick: Tick): {
    levelChanged: boolean;
    previousLevel: AutonomyLevel;
    currentLevel: AutonomyLevel;
    reason: string;
  } {
    const previousLevel = this.currentLevel;
    let reason = '';

    // 品質監査
    if (tick - this.lastAuditTick >= this.config.auditInterval) {
      this.performAudit(tick);
    }

    // レベルダウンの評価（品質低下検知）
    if (this.config.enableAutoDemotion) {
      const shouldDemote = this.shouldDemote();
      if (shouldDemote) {
        const demoted = this.demoteLevel();
        if (demoted) {
          this.levelEnteredAt = tick;
          reason = '品質低下を検知したためレベルダウン';
          return { levelChanged: true, previousLevel, currentLevel: this.currentLevel, reason };
        }
      }
    }

    // レベルアップの評価
    if (this.config.enableAutoPromotion) {
      const shouldPromote = this.shouldPromote(tick);
      if (shouldPromote) {
        const promoted = this.promoteLevel();
        if (promoted) {
          this.levelEnteredAt = tick;
          reason = '条件を満たしたためレベルアップ';
          return { levelChanged: true, previousLevel, currentLevel: this.currentLevel, reason };
        }
      }
    }

    return { levelChanged: false, previousLevel, currentLevel: this.currentLevel, reason: '' };
  }

  private shouldDemote(): boolean {
    if (this.currentLevel === 'full_llm') return false; // 最低レベル
    if (this.recentQualityScores.length < 10) return false; // サンプル不足

    // 最近の品質スコアの平均を計算
    const recentAvg = this.recentQualityScores.slice(-20)
      .reduce((a, b) => a + b, 0) / Math.min(20, this.recentQualityScores.length);

    // 過去の品質と比較
    const olderAvg = this.recentQualityScores.slice(0, -20)
      .reduce((a, b) => a + b, 0) / Math.max(1, this.recentQualityScores.length - 20);

    // 品質が明確に低下している場合
    if (olderAvg - recentAvg > this.config.qualityDropThreshold) {
      return true;
    }

    // 絶対的な品質低下
    if (recentAvg < 0.3) return true;

    return false;
  }

  private shouldPromote(tick: Tick): boolean {
    const nextLevelIndex = LEVEL_ORDER.indexOf(this.currentLevel) + 1;
    if (nextLevelIndex >= LEVEL_ORDER.length) return false;

    const nextLevel = LEVEL_ORDER[nextLevelIndex];
    const conditions = TRANSITION_CONDITIONS[nextLevel];
    if (!conditions) return false;

    // 滞在期間チェック
    if (tick - this.levelEnteredAt < conditions.minTicksAtPreviousLevel) return false;

    // パターンカバレッジ
    const coverage = this.patternEngine.getCoverage();
    if (coverage < conditions.minCoverage) return false;

    // パターン統計
    const stats = this.patternEngine.getStats();
    if (stats.totalPatterns < conditions.minPatternCount) return false;
    if (stats.avgSatisfaction < conditions.minAvgSatisfaction) return false;

    // バイパス成功率
    if (this.bypassAttempts > 0) {
      const bypassRate = this.bypassSuccesses / this.bypassAttempts;
      if (bypassRate < conditions.minBypassSuccessRate) return false;
    } else if (conditions.minBypassSuccessRate > 0) {
      return false; // バイパス実績がない
    }

    return true;
  }

  private promoteLevel(): boolean {
    const currentIndex = LEVEL_ORDER.indexOf(this.currentLevel);
    if (currentIndex >= LEVEL_ORDER.length - 1) return false;
    this.currentLevel = LEVEL_ORDER[currentIndex + 1];
    return true;
  }

  private demoteLevel(): boolean {
    const currentIndex = LEVEL_ORDER.indexOf(this.currentLevel);
    if (currentIndex <= 0) return false;
    this.currentLevel = LEVEL_ORDER[currentIndex - 1];
    // 品質スコアをリセット
    this.recentQualityScores = [];
    return true;
  }

  // ============================================================
  // 品質監査
  // ============================================================

  private performAudit(tick: Tick): void {
    this.lastAuditTick = tick;

    const avgQuality = this.recentQualityScores.length > 0
      ? this.recentQualityScores.reduce((a, b) => a + b, 0) / this.recentQualityScores.length
      : 0.5;

    this.auditHistory.push({
      tick,
      avgQuality: avgQuality as Normalized,
      level: this.currentLevel,
    });

    // 監査履歴の制限
    if (this.auditHistory.length > 50) {
      this.auditHistory = this.auditHistory.slice(-50);
    }

    // パターンの淘汰も実行
    this.patternEngine.cullLowQuality();
  }

  // ============================================================
  // メトリクス
  // ============================================================

  getMetrics(): AutonomyMetrics {
    const patternStats = this.patternEngine.getStats();

    return {
      level: this.currentLevel,
      patternCoverage: this.patternEngine.getCoverage(),
      patternConfidence: patternStats.avgSatisfaction as Normalized,
      llmCallCount: this.llmCallCount,
      patternCallCount: this.patternCallCount,
      llmBypassCount: this.llmBypassCount,
      avgResponseQuality: this.recentQualityScores.length > 0
        ? (this.recentQualityScores.reduce((a, b) => a + b, 0) / this.recentQualityScores.length) as Normalized
        : 0.5 as Normalized,
    };
  }

  getCurrentLevel(): AutonomyLevel {
    return this.currentLevel;
  }

  /**
   * LLMが必要かどうかを判定
   * SoulEngineがLLM呼び出しをスキップするかどうかの判断に使う
   */
  needsLLM(strategy: ResponseStrategy): boolean {
    switch (strategy.type) {
      case 'llm_only':
      case 'llm_with_pattern_hints':
      case 'pattern_draft_llm_refine':
        return true;
      case 'pattern_with_llm_audit':
        // 監査用のLLM呼び出しが必要だが、メインの応答はパターンから
        return true; // 品質確認のためLLMは使う
      case 'pattern_only':
        return false; // LLM不要
    }
  }

  /**
   * 戦略に基づくLLMプロンプトの修正
   * パターンのヒントや下書きをプロンプトに含める
   */
  augmentPrompt(strategy: ResponseStrategy, basePrompt: string): string {
    switch (strategy.type) {
      case 'llm_only':
        return basePrompt;

      case 'llm_with_pattern_hints':
        return `${basePrompt}\n\n【参考表現】\n以下のような応答が過去に好評だった:\n「${strategy.patternTemplate}」\nこの雰囲気を参考にしつつ、今の状況に合った応答をして。`;

      case 'pattern_draft_llm_refine':
        return `${basePrompt}\n\n【下書き】\n以下の下書きを元に、今の状況に合わせて自然に仕上げて:\n「${strategy.draft}」\n大きく変えずに、必要な微調整だけ行って。`;

      case 'pattern_with_llm_audit':
        return `以下の応答は適切か確認して。問題があれば修正版を、問題なければそのまま返して:\n「${strategy.response}」\n\n状況:\n${basePrompt}`;

      case 'pattern_only':
        return ''; // LLMは使わない
    }
  }

  // ============================================================
  // 手動レベル制御
  // ============================================================

  /**
   * レベルを手動で設定する（デバッグ・テスト用）
   */
  setLevel(level: AutonomyLevel, tick: Tick): void {
    this.currentLevel = level;
    this.levelEnteredAt = tick;
  }

  /**
   * 強制的にfull_llmに戻す（安全機構）
   */
  resetToFullLLM(tick: Tick): void {
    this.currentLevel = 'full_llm';
    this.levelEnteredAt = tick;
    this.recentQualityScores = [];
    this.bypassSuccesses = 0;
    this.bypassAttempts = 0;
  }

  // ============================================================
  // 永続化
  // ============================================================

  toJSON(): any {
    return {
      currentLevel: this.currentLevel,
      levelEnteredAt: this.levelEnteredAt,
      llmCallCount: this.llmCallCount,
      patternCallCount: this.patternCallCount,
      llmBypassCount: this.llmBypassCount,
      bypassSuccesses: this.bypassSuccesses,
      bypassAttempts: this.bypassAttempts,
      recentQualityScores: this.recentQualityScores,
      lastAuditTick: this.lastAuditTick,
      auditHistory: this.auditHistory,
    };
  }

  fromJSON(data: any): void {
    if (!data) return;
    if (data.currentLevel) this.currentLevel = data.currentLevel;
    if (data.levelEnteredAt !== undefined) this.levelEnteredAt = data.levelEnteredAt;
    if (data.llmCallCount !== undefined) this.llmCallCount = data.llmCallCount;
    if (data.patternCallCount !== undefined) this.patternCallCount = data.patternCallCount;
    if (data.llmBypassCount !== undefined) this.llmBypassCount = data.llmBypassCount;
    if (data.bypassSuccesses !== undefined) this.bypassSuccesses = data.bypassSuccesses;
    if (data.bypassAttempts !== undefined) this.bypassAttempts = data.bypassAttempts;
    if (data.recentQualityScores) this.recentQualityScores = data.recentQualityScores;
    if (data.lastAuditTick !== undefined) this.lastAuditTick = data.lastAuditTick;
    if (data.auditHistory) this.auditHistory = data.auditHistory;
  }
}
