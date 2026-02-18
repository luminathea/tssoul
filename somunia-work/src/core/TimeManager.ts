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

import {
  TimeState,
  TimeOfDay,
  Timestamp,
  Tick,
  Normalized,
  SoulConfig,
  Weather,
  LightingState,
  LightSource,
  Position,
} from '../types';
import { EventBus, eventBus } from './EventBus';

// ============================================================
// 時間設定
// ============================================================

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

const DEFAULT_TIME_CONFIG: TimeConfig = {
  tickInterval: 1000,
  ticksPerDay: 1440,
  startHour: 8,
  enableLifespan: false,
  timeScale: 1,
};

// ============================================================
// 天気エンジン
// ============================================================

interface WeatherPattern {
  type: Weather;
  duration: number;       // ティック
  transitionTime: number; // 遷移時間（ティック）
  probability: number;    // 次の天気候補の確率
  nextWeather: Weather[];
}

const WEATHER_PATTERNS: Record<Weather, WeatherPattern> = {
  clear:      { type: 'clear',      duration: 300, transitionTime: 30, probability: 0.4, nextWeather: ['cloudy', 'clear'] },
  cloudy:     { type: 'cloudy',     duration: 200, transitionTime: 20, probability: 0.3, nextWeather: ['clear', 'rain', 'cloudy'] },
  rain:       { type: 'rain',       duration: 120, transitionTime: 15, probability: 0.2, nextWeather: ['cloudy', 'heavy_rain', 'clear'] },
  heavy_rain: { type: 'heavy_rain', duration: 60,  transitionTime: 10, probability: 0.05, nextWeather: ['rain', 'storm'] },
  snow:       { type: 'snow',       duration: 180, transitionTime: 25, probability: 0.05, nextWeather: ['cloudy', 'clear'] },
  fog:        { type: 'fog',        duration: 90,  transitionTime: 20, probability: 0.1, nextWeather: ['clear', 'cloudy'] },
  storm:      { type: 'storm',      duration: 40,  transitionTime: 10, probability: 0.02, nextWeather: ['heavy_rain', 'rain'] },
};

// ============================================================
// TimeManager
// ============================================================

export class TimeManager {
  private config: TimeConfig;
  private state: TimeState;
  private weather: Weather = 'clear';
  private weatherTimer: number = 0;
  private weatherTransition: number = 0;
  private previousWeather: Weather = 'clear';
  private running: boolean = false;
  private intervalHandle: NodeJS.Timeout | null = null;
  private tickCallbacks: Array<(tick: Tick) => void | Promise<void>> = [];
  private events: EventBus;

  constructor(config: Partial<TimeConfig> = {}, events?: EventBus) {
    this.config = { ...DEFAULT_TIME_CONFIG, ...config };
    this.events = events || eventBus;

    // 初期状態
    this.state = {
      currentTick: 0,
      simulatedHour: this.config.startHour,
      simulatedDay: 1,
      hour: this.config.startHour,
      dayNumber: 1,
      timeOfDay: this.hourToTimeOfDay(this.config.startHour),
    };

    if (this.config.enableLifespan && this.config.lifespanTicks) {
      this.state.lifespan = {
        totalTicks: this.config.lifespanTicks,
        remainingTicks: this.config.lifespanTicks,
        percentage: 1,
      };
    }

    // 天気の初期タイマー
    this.weatherTimer = WEATHER_PATTERNS[this.weather].duration;
  }

  /**
   * 時間の流れを開始
   */
  start(): void {
    if (this.running) return;
    this.running = true;

    this.intervalHandle = setInterval(async () => {
      await this.tick();
    }, this.config.tickInterval / this.config.timeScale);
  }

  /**
   * 時間の流れを停止
   */
  stop(): void {
    this.running = false;
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  /**
   * 1ティック進める
   */
  async tick(): Promise<void> {
    this.state.currentTick++;

    // 時間更新
    const ticksPerHour = this.config.ticksPerDay / 24;
    this.state.simulatedHour =
      (this.config.startHour + this.state.currentTick / ticksPerHour) % 24;

    // 日の切り替え
    const previousDay = this.state.simulatedDay;
    this.state.simulatedDay = Math.floor(this.state.currentTick / this.config.ticksPerDay) + 1;

    if (this.state.simulatedDay > previousDay) {
      await this.events.emit({
        type: 'day_started',
        timestamp: this.state.currentTick,
        data: { day: this.state.simulatedDay },
      });
    }

    // 時間帯更新
    const previousTimeOfDay = this.state.timeOfDay;
    this.state.timeOfDay = this.hourToTimeOfDay(this.state.simulatedHour);
    
    // エイリアス同期
    this.state.hour = this.state.simulatedHour;
    this.state.dayNumber = this.state.simulatedDay;

    // 日の終了チェック
    if (previousTimeOfDay === 'night' && this.state.timeOfDay === 'late_night') {
      await this.events.emit({
        type: 'day_ended',
        timestamp: this.state.currentTick,
        data: { day: previousDay },
      });
    }

    // 天気更新
    this.updateWeather();

    // 寿命更新
    if (this.state.lifespan) {
      this.state.lifespan.remainingTicks = Math.max(
        0,
        this.state.lifespan.totalTicks - this.state.currentTick
      );
      this.state.lifespan.percentage =
        this.state.lifespan.remainingTicks / this.state.lifespan.totalTicks;
    }

    // ティックコールバック実行
    for (const cb of this.tickCallbacks) {
      try {
        await cb(this.state.currentTick);
      } catch (error) {
        console.error('[TimeManager] Tick callback error:', error);
      }
    }
  }

  /**
   * ティックコールバックを登録
   */
  onTick(callback: (tick: Tick) => void | Promise<void>): void {
    this.tickCallbacks.push(callback);
  }

  /**
   * 天気の更新
   */
  private updateWeather(): void {
    this.weatherTimer--;

    if (this.weatherTimer <= 0) {
      // 天気の遷移
      const pattern = WEATHER_PATTERNS[this.weather];
      this.previousWeather = this.weather;

      // 次の天気をランダムに選択
      const nextOptions = pattern.nextWeather;
      this.weather = nextOptions[Math.floor(Math.random() * nextOptions.length)];
      this.weatherTimer = WEATHER_PATTERNS[this.weather].duration +
        Math.floor(Math.random() * 60 - 30); // ±30ティックの揺らぎ
      this.weatherTransition = pattern.transitionTime;
    }

    if (this.weatherTransition > 0) {
      this.weatherTransition--;
    }
  }

  /**
   * 時刻から時間帯を取得
   */
  private hourToTimeOfDay(hour: number): TimeOfDay {
    if (hour >= 4 && hour < 6)   return 'dawn';
    if (hour >= 6 && hour < 10)  return 'morning';
    if (hour >= 10 && hour < 13) return 'midday';
    if (hour >= 13 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 20) return 'evening';
    if (hour >= 20 && hour < 24) return 'night';
    return 'late_night';
  }

  /**
   * 現在の照明状態を取得
   */
  getLightingState(): LightingState {
    const hour = this.state.simulatedHour;

    // 自然光の計算
    let naturalLight: Normalized;
    if (hour >= 6 && hour <= 18) {
      naturalLight = Math.sin(((hour - 6) / 12) * Math.PI);
    } else {
      naturalLight = 0;
    }

    // 天気による減衰
    const weatherDimming: Record<Weather, number> = {
      clear: 1.0,
      cloudy: 0.7,
      rain: 0.5,
      heavy_rain: 0.3,
      snow: 0.6,
      fog: 0.4,
      storm: 0.2,
    };
    naturalLight *= weatherDimming[this.weather];

    // 色温度（朝夕は暖色、昼は寒色）
    let colorTemperature: number;
    if (hour >= 6 && hour < 8) {
      colorTemperature = 2700; // 暖かい朝焼け
    } else if (hour >= 8 && hour < 16) {
      colorTemperature = 5500; // 昼光
    } else if (hour >= 16 && hour < 20) {
      colorTemperature = 3000; // 夕暮れ
    } else {
      colorTemperature = 2200; // 夜間
    }

    // 室内灯（暗い時に自動点灯）
    const roomLightOn = naturalLight < 0.3;
    const roomLight: LightSource = {
      id: 'room_light',
      position: { x: 4, y: 4 },
      intensity: roomLightOn ? 0.6 : 0,
      color: 220, // 暖色系
      radius: 6,
      isOn: roomLightOn,
    };

    const ambient = Math.max(0.05, naturalLight * 0.8 + (roomLightOn ? 0.4 : 0));

    return {
      ambient: Math.min(1, ambient),
      colorTemperature,
      sources: [roomLight],
      naturalLight,
    };
  }

  /**
   * 現在の天気を取得
   */
  getWeather(): Weather {
    return this.weather;
  }

  /**
   * 天気の遷移中かどうか
   */
  isWeatherTransitioning(): boolean {
    return this.weatherTransition > 0;
  }

  /**
   * 天気遷移の進行度 (0-1)
   */
  getWeatherTransitionProgress(): Normalized {
    if (this.weatherTransition <= 0) return 1;
    const pattern = WEATHER_PATTERNS[this.previousWeather];
    return 1 - (this.weatherTransition / pattern.transitionTime);
  }

  /**
   * 現在の時間状態を取得
   */
  getState(): TimeState {
    return { ...this.state };
  }

  /**
   * 現在の時刻（時）を取得
   */
  getHour(): number {
    return this.state.simulatedHour;
  }

  /**
   * 現在の時間帯を取得
   */
  getTimeOfDay(): TimeOfDay {
    return this.state.timeOfDay;
  }

  /**
   * 現在の日を取得
   */
  getDay(): number {
    return this.state.simulatedDay;
  }

  /**
   * 現在のティックを取得
   */
  getCurrentTick(): Tick {
    return this.state.currentTick;
  }

  /**
   * 睡眠すべき時間帯かどうか
   */
  isSleepTime(): boolean {
    const hour = this.state.simulatedHour;
    return hour >= 23 || hour < 6;
  }

  /**
   * 状態の復元
   */
  restoreState(state: TimeState, weather?: Weather): void {
    this.state = { ...state };
    if (weather) {
      this.weather = weather;
    }
  }

  /**
   * JSON出力
   */
  toJSON(): object {
    return {
      state: this.state,
      weather: this.weather,
      weatherTimer: this.weatherTimer,
      config: this.config,
    };
  }

  /**
   * JSONから復元
   */
  fromJSON(data: any): void {
    if (data.state) this.state = data.state;
    if (data.weather) this.weather = data.weather;
    if (data.weatherTimer) this.weatherTimer = data.weatherTimer;
  }
}
