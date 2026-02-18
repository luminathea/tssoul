/**
 * TerminalUI - somunia v10 ターミナルインターフェース
 * 
 * somuniaとテキストで対話するためのUI。
 * somuniaの内部状態、思考、行動をリアルタイムに表示。
 */

import * as readline from 'readline';
import {
  EmotionType,
  TimeOfDay,
  ActionType,
  Normalized,
  ThoughtNode,
} from '../types';
import { EventBus, eventBus } from '../core/EventBus';

// ============================================================
// カラーコード
// ============================================================

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgBlack: '\x1b[40m',
};

const EMOTION_COLORS: Record<string, string> = {
  joy: COLORS.yellow,
  peace: COLORS.green,
  curiosity: COLORS.cyan,
  melancholy: COLORS.blue,
  loneliness: COLORS.magenta,
  anxiety: COLORS.red,
  contentment: COLORS.green,
  wonder: COLORS.cyan,
  warmth: COLORS.yellow,
  fatigue: COLORS.gray,
  boredom: COLORS.dim,
  anticipation: COLORS.cyan,
  confusion: COLORS.magenta,
  nostalgia: COLORS.blue,
  hope: COLORS.green,
  fear: COLORS.red,
};

const TIME_ICONS: Record<TimeOfDay, string> = {
  dawn: '🌅',
  morning: '☀️',
  midday: '🌤️',
  afternoon: '⛅',
  evening: '🌇',
  night: '🌙',
  late_night: '🌑',
};

// ============================================================
// TerminalUI
// ============================================================

export class TerminalUI {
  private rl: readline.Interface | null = null;
  private events: EventBus;
  private onMessage: ((message: string) => void) | null = null;
  private onCommand: ((command: string, args: string[]) => void) | null = null;
  private displayThoughts: boolean = true;
  private displayActions: boolean = true;
  private displayEmotions: boolean = true;
  private compact: boolean = false;

  constructor(events?: EventBus) {
    this.events = events || eventBus;
    this.setupEventListeners();
  }

  /**
   * UIを開始
   */
  start(): void {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.printHeader();

    this.rl.on('line', (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('/')) {
        this.handleCommand(trimmed);
      } else if (this.onMessage) {
        this.onMessage(trimmed);
      }
    });

    this.rl.on('close', () => {
      this.printLine('\n👋 さよなら...', COLORS.magenta);
    });
  }

  /**
   * UIを停止
   */
  stop(): void {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }

  /**
   * メッセージハンドラを設定
   */
  setMessageHandler(handler: (message: string) => void): void {
    this.onMessage = handler;
  }

  /**
   * コマンドハンドラを設定
   */
  setCommandHandler(handler: (command: string, args: string[]) => void): void {
    this.onCommand = handler;
  }

  // === 表示メソッド ===

  /**
   * somuniaの発話を表示
   */
  showSpeech(content: string): void {
    console.log(`\n  ${COLORS.bright}${COLORS.cyan}somunia${COLORS.reset}: ${content}`);
  }

  /**
   * 思考を表示
   */
  showThought(thought: ThoughtNode): void {
    if (!this.displayThoughts) return;
    const color = EMOTION_COLORS[thought.emotionalColor] || COLORS.gray;
    if (this.compact) {
      console.log(`  ${COLORS.dim}💭 ${thought.content}${COLORS.reset}`);
    } else {
      console.log(`  ${color}💭 ${thought.content}${COLORS.reset}`);
    }
  }

  /**
   * 行動を表示
   */
  showAction(action: ActionType, description?: string): void {
    if (!this.displayActions) return;
    console.log(`  ${COLORS.green}▸ ${description || action}${COLORS.reset}`);
  }

  /**
   * 感情変化を表示
   */
  showEmotionChange(emotion: EmotionType, intensity: Normalized): void {
    if (!this.displayEmotions) return;
    const color = EMOTION_COLORS[emotion] || COLORS.white;
    const bar = this.makeBar(intensity);
    console.log(`  ${color}♡ ${emotion} ${bar}${COLORS.reset}`);
  }

  /**
   * 状態バーを表示
   */
  showStatusBar(data: {
    timeOfDay: TimeOfDay;
    hour: number;
    day: number;
    emotion: EmotionType;
    energy: Normalized;
    action: string;
    weather: string;
  }): void {
    const icon = TIME_ICONS[data.timeOfDay] || '⏰';
    const emotionColor = EMOTION_COLORS[data.emotion] || COLORS.white;
    const energyBar = this.makeBar(data.energy);

    const line = `${COLORS.dim}─── ${icon} Day ${data.day} ${data.hour.toFixed(0)}:00 | ${emotionColor}${data.emotion}${COLORS.dim} | ⚡${energyBar} | ${data.weather} | ${data.action} ───${COLORS.reset}`;
    console.log(line);
  }

  /**
   * システムメッセージ
   */
  showSystem(message: string): void {
    console.log(`  ${COLORS.gray}[system] ${message}${COLORS.reset}`);
  }

  /**
   * 日記エントリを表示
   */
  showDiary(title: string, content: string): void {
    console.log(`\n  ${COLORS.magenta}📖 日記: ${title}${COLORS.reset}`);
    console.log(`  ${COLORS.dim}${content.split('\n').map(l => '  ' + l).join('\n')}${COLORS.reset}`);
  }

  /**
   * 夢を表示
   */
  showDream(content: string): void {
    console.log(`  ${COLORS.magenta}${COLORS.dim}💤 ${content}${COLORS.reset}`);
  }

  /**
   * 学習を表示
   */
  showLearning(topic: string, summary: string): void {
    console.log(`  ${COLORS.cyan}📚 ${topic}: ${summary}${COLORS.reset}`);
  }

  // === 内部メソッド ===

  private printHeader(): void {
    console.log('');
    console.log(`  ${COLORS.cyan}${COLORS.bright}═══════════════════════════════════════${COLORS.reset}`);
    console.log(`  ${COLORS.cyan}${COLORS.bright}  somunia v10 "Soul Engine"${COLORS.reset}`);
    console.log(`  ${COLORS.cyan}${COLORS.bright}  自律的意識シミュレーション${COLORS.reset}`);
    console.log(`  ${COLORS.cyan}${COLORS.bright}═══════════════════════════════════════${COLORS.reset}`);
    console.log(`  ${COLORS.dim}  /help でコマンド一覧を表示${COLORS.reset}`);
    console.log('');
  }

  private printLine(text: string, color: string = COLORS.white): void {
    console.log(`${color}${text}${COLORS.reset}`);
  }

  private makeBar(value: Normalized, length: number = 10): string {
    const filled = Math.round(value * length);
    return '█'.repeat(filled) + '░'.repeat(length - filled);
  }

  private handleCommand(input: string): void {
    const parts = input.slice(1).split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        this.showHelp();
        break;
      case 'thoughts':
        this.displayThoughts = !this.displayThoughts;
        this.showSystem(`思考表示: ${this.displayThoughts ? 'ON' : 'OFF'}`);
        break;
      case 'actions':
        this.displayActions = !this.displayActions;
        this.showSystem(`行動表示: ${this.displayActions ? 'ON' : 'OFF'}`);
        break;
      case 'emotions':
        this.displayEmotions = !this.displayEmotions;
        this.showSystem(`感情表示: ${this.displayEmotions ? 'ON' : 'OFF'}`);
        break;
      case 'compact':
        this.compact = !this.compact;
        this.showSystem(`コンパクト表示: ${this.compact ? 'ON' : 'OFF'}`);
        break;
      default:
        if (this.onCommand) {
          this.onCommand(command, args);
        } else {
          this.showSystem(`不明なコマンド: ${command}`);
        }
        break;
    }
  }

  private showHelp(): void {
    console.log(`
  ${COLORS.cyan}=== コマンド一覧 ===${COLORS.reset}
  ${COLORS.bright}/help${COLORS.reset}        - この一覧を表示
  ${COLORS.bright}/save${COLORS.reset}        - 手動保存
  ${COLORS.bright}/status${COLORS.reset}      - 詳細ステータス表示
  ${COLORS.bright}/thoughts${COLORS.reset}    - 思考表示のON/OFF
  ${COLORS.bright}/actions${COLORS.reset}     - 行動表示のON/OFF
  ${COLORS.bright}/emotions${COLORS.reset}    - 感情表示のON/OFF
  ${COLORS.bright}/compact${COLORS.reset}     - コンパクト表示切替
  ${COLORS.bright}/memory${COLORS.reset}      - 記憶の統計表示
  ${COLORS.bright}/diary${COLORS.reset}       - 最近の日記を表示
  ${COLORS.bright}/quit${COLORS.reset}        - 終了
`);
  }

  /**
   * イベントリスナーの設定
   */
  private setupEventListeners(): void {
    this.events.on('thought', (event) => {
      if (event.data?.thought) {
        this.showThought(event.data.thought);
      }
    });

    this.events.on('action_started', (event) => {
      if (event.data?.action) {
        this.showAction(event.data.action);
      }
    });

    this.events.on('emotion_change', (event) => {
      if (event.data?.emotion && event.data?.intensity) {
        this.showEmotionChange(event.data.emotion, event.data.intensity);
      }
    });

    this.events.on('sleep_started', () => {
      this.showSystem('💤 somuniaは眠りに落ちました...');
    });

    this.events.on('woke_up', () => {
      this.showSystem('☀️ somuniaは目を覚ましました');
    });

    this.events.on('diary_written', (event) => {
      if (event.data?.title && event.data?.content) {
        this.showDiary(event.data.title, event.data.content);
      }
    });

    this.events.on('state_saved', () => {
      this.showSystem('💾 状態を保存しました');
    });
  }
}
