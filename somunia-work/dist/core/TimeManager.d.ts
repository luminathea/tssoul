/**
 * TimeManager - somunia v10 時間管理システム
 *
 * シミュレーション内の時間を管理する。
 * 1ティック = 1秒（設定可能）
 * 1日 = 設定されたティック数（デフォルト: 1440 = 24時間×60分）
 *
 * 時間の流れは世界の雰囲気、somuniaの活動リズム、
 * 照明、天気の変化すべてに影響する。
 */
import { TimeState, TimeOfDay, Tick, Normalized, Weather, LightingState } from '../types';
import { EventBus } from './EventBus';
export interface TimeConfig {
    /** ティック間隔（ms） */
    tickInterval: number;
    /** 1日のティック数 */
    ticksPerDay: number;
    /** 開始時刻（時） */
    startHour: number;
    /** 寿命の有効化 */
    enableLifespan: boolean;
    /** 寿命（ティック数） */
    lifespanTicks?: number;
    /** 時間倍率（1=リアルタイム, 60=1分が1秒） */
    timeScale: number;
}
export declare class TimeManager {
    private config;
    private state;
    private weather;
    private weatherTimer;
    private weatherTransition;
    private previousWeather;
    private running;
    private intervalHandle;
    private tickCallbacks;
    private events;
    constructor(config?: Partial<TimeConfig>, events?: EventBus);
    /**
     * 時間の流れを開始
     */
    start(): void;
    /**
     * 時間の流れを停止
     */
    stop(): void;
    /**
     * 1ティック進める
     */
    tick(): Promise<void>;
    /**
     * ティックコールバックを登録
     */
    onTick(callback: (tick: Tick) => void | Promise<void>): void;
    /**
     * 天気の更新
     */
    private updateWeather;
    /**
     * 時刻から時間帯を取得
     */
    private hourToTimeOfDay;
    /**
     * 現在の照明状態を取得
     */
    getLightingState(): LightingState;
    /**
     * 現在の天気を取得
     */
    getWeather(): Weather;
    /**
     * 天気の遷移中かどうか
     */
    isWeatherTransitioning(): boolean;
    /**
     * 天気遷移の進行度 (0-1)
     */
    getWeatherTransitionProgress(): Normalized;
    /**
     * 現在の時間状態を取得
     */
    getState(): TimeState;
    /**
     * 現在の時刻（時）を取得
     */
    getHour(): number;
    /**
     * 現在の時間帯を取得
     */
    getTimeOfDay(): TimeOfDay;
    /**
     * 現在の日を取得
     */
    getDay(): number;
    /**
     * 現在のティックを取得
     */
    getCurrentTick(): Tick;
    /**
     * 睡眠すべき時間帯かどうか
     */
    isSleepTime(): boolean;
    /**
     * 状態の復元
     */
    restoreState(state: TimeState, weather?: Weather): void;
    /**
     * JSON出力
     */
    toJSON(): object;
    /**
     * JSONから復元
     */
    fromJSON(data: any): void;
}
//# sourceMappingURL=TimeManager.d.ts.map