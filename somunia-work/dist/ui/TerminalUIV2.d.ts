/**
 * TerminalUIV2 - Phase 6C: 強化版ターミナルUI
 *
 * リアルタイムダッシュボード、ライブステータスバー、
 * インスペクタモード、会話モードを備えた本格UI。
 *
 * 表示モード:
 * - dashboard: 全モジュール統計のライブ表示
 * - conversation: somuniaとの対話に集中
 * - observer: 思考・行動・感情のストリーム観察
 * - inspector: 特定モジュールの詳細表示
 *
 * 新機能:
 * - ANSIカラー＋Unicodeアイコンによるリッチ表示
 * - ステータスバーの定期自動更新
 * - コマンド補完（Tab）
 * - 出力フィルタリング（ノイズ除去）
 * - ログファイル出力
 */
import { EmotionType, TimeOfDay, ActionType, Normalized, ThoughtNode } from '../types';
import { EventBus } from '../core/EventBus';
type DisplayMode = 'conversation' | 'observer' | 'dashboard' | 'inspector';
/** UI設定 */
export interface TerminalUIV2Config {
    /** 表示モード */
    mode: DisplayMode;
    /** ステータスバー更新間隔（ms） */
    statusBarInterval: number;
    /** ログファイルパス（nullなら無効） */
    logFile: string | null;
    /** 思考表示 */
    showThoughts: boolean;
    /** 行動表示 */
    showActions: boolean;
    /** 感情変化表示 */
    showEmotions: boolean;
    /** 夢表示 */
    showDreams: boolean;
    /** 学習表示 */
    showLearning: boolean;
    /** コンパクト表示 */
    compact: boolean;
    /** 表示の最大バッファ行数 */
    maxBufferLines: number;
}
export declare class TerminalUIV2 {
    private rl;
    private events;
    private config;
    private onMessage;
    private onCommand;
    private statusBarTimer;
    private logStream;
    private outputBuffer;
    private latestStatus;
    private displayStats;
    constructor(config?: Partial<TerminalUIV2Config>, events?: EventBus);
    start(): void;
    stop(): void;
    setMessageHandler(handler: (message: string) => void): void;
    setCommandHandler(handler: (command: string, args: string[]) => void): void;
    showSpeech(content: string): void;
    showThought(thought: ThoughtNode): void;
    showAction(action: ActionType, description?: string): void;
    showEmotionChange(emotion: EmotionType, intensity: Normalized): void;
    showStatusBar(data: {
        timeOfDay: TimeOfDay;
        hour: number;
        day: number;
        emotion: EmotionType;
        energy: Normalized;
        action: string;
        weather: string;
        tick?: number;
    }): void;
    showSystem(message: string): void;
    showDiary(title: string, content: string): void;
    showDream(content: string): void;
    showLearning(topic: string, summary: string): void;
    /**
     * Phase 6C: ダッシュボードデータの表示
     */
    showDashboard(data: {
        modules: {
            name: string;
            status: string;
            detail: string;
        }[];
        uptime: string;
        storage: string;
        tick: number;
        day: number;
    }): void;
    /**
     * Phase 6C: Wikipedia API ステータス表示
     */
    showWikiStatus(status: {
        isOnline: boolean;
        totalRequests: number;
        successCount: number;
        cacheHits: number;
        cachedArticles: number;
        lastError: string | null;
    }): void;
    /**
     * Phase 6C: 永続化ステータス表示
     */
    showPersistenceStatus(info: {
        formattedSize: string;
        moduleCount: number;
        backupCount: number;
        stats: {
            totalSaves: number;
            totalErrors: number;
            averageSaveDuration: number;
            crashRecoveries: number;
            incrementalSaves: number;
            fullSaves: number;
        };
    }): void;
    /**
     * Phase 6C: テスト結果表示
     */
    showTestResults(results: {
        suiteName: string;
        passed: number;
        failed: number;
        skipped: number;
        duration: number;
        failures: {
            name: string;
            error: string;
        }[];
    }[]): void;
    private println;
    private printHeader;
    private printModeInfo;
    private makeBar;
    private startStatusBar;
    private stopStatusBar;
    private handleCommand;
    private switchMode;
    private showHelp;
    private showUIStats;
    private setupEventListeners;
}
export {};
//# sourceMappingURL=TerminalUIV2.d.ts.map