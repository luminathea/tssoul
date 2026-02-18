"use strict";
/**
 * TerminalUI - somunia v10 ターミナルインターフェース
 *
 * somuniaとテキストで対話するためのUI。
 * somuniaの内部状態、思考、行動をリアルタイムに表示。
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalUI = void 0;
const readline = __importStar(require("readline"));
const EventBus_1 = require("../core/EventBus");
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
const EMOTION_COLORS = {
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
const TIME_ICONS = {
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
class TerminalUI {
    rl = null;
    events;
    onMessage = null;
    onCommand = null;
    displayThoughts = true;
    displayActions = true;
    displayEmotions = true;
    compact = false;
    constructor(events) {
        this.events = events || EventBus_1.eventBus;
        this.setupEventListeners();
    }
    /**
     * UIを開始
     */
    start() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        this.printHeader();
        this.rl.on('line', (line) => {
            const trimmed = line.trim();
            if (!trimmed)
                return;
            if (trimmed.startsWith('/')) {
                this.handleCommand(trimmed);
            }
            else if (this.onMessage) {
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
    stop() {
        if (this.rl) {
            this.rl.close();
            this.rl = null;
        }
    }
    /**
     * メッセージハンドラを設定
     */
    setMessageHandler(handler) {
        this.onMessage = handler;
    }
    /**
     * コマンドハンドラを設定
     */
    setCommandHandler(handler) {
        this.onCommand = handler;
    }
    // === 表示メソッド ===
    /**
     * somuniaの発話を表示
     */
    showSpeech(content) {
        console.log(`\n  ${COLORS.bright}${COLORS.cyan}somunia${COLORS.reset}: ${content}`);
    }
    /**
     * 思考を表示
     */
    showThought(thought) {
        if (!this.displayThoughts)
            return;
        const color = EMOTION_COLORS[thought.emotionalColor] || COLORS.gray;
        if (this.compact) {
            console.log(`  ${COLORS.dim}💭 ${thought.content}${COLORS.reset}`);
        }
        else {
            console.log(`  ${color}💭 ${thought.content}${COLORS.reset}`);
        }
    }
    /**
     * 行動を表示
     */
    showAction(action, description) {
        if (!this.displayActions)
            return;
        console.log(`  ${COLORS.green}▸ ${description || action}${COLORS.reset}`);
    }
    /**
     * 感情変化を表示
     */
    showEmotionChange(emotion, intensity) {
        if (!this.displayEmotions)
            return;
        const color = EMOTION_COLORS[emotion] || COLORS.white;
        const bar = this.makeBar(intensity);
        console.log(`  ${color}♡ ${emotion} ${bar}${COLORS.reset}`);
    }
    /**
     * 状態バーを表示
     */
    showStatusBar(data) {
        const icon = TIME_ICONS[data.timeOfDay] || '⏰';
        const emotionColor = EMOTION_COLORS[data.emotion] || COLORS.white;
        const energyBar = this.makeBar(data.energy);
        const line = `${COLORS.dim}─── ${icon} Day ${data.day} ${data.hour.toFixed(0)}:00 | ${emotionColor}${data.emotion}${COLORS.dim} | ⚡${energyBar} | ${data.weather} | ${data.action} ───${COLORS.reset}`;
        console.log(line);
    }
    /**
     * システムメッセージ
     */
    showSystem(message) {
        console.log(`  ${COLORS.gray}[system] ${message}${COLORS.reset}`);
    }
    /**
     * 日記エントリを表示
     */
    showDiary(title, content) {
        console.log(`\n  ${COLORS.magenta}📖 日記: ${title}${COLORS.reset}`);
        console.log(`  ${COLORS.dim}${content.split('\n').map(l => '  ' + l).join('\n')}${COLORS.reset}`);
    }
    /**
     * 夢を表示
     */
    showDream(content) {
        console.log(`  ${COLORS.magenta}${COLORS.dim}💤 ${content}${COLORS.reset}`);
    }
    /**
     * 学習を表示
     */
    showLearning(topic, summary) {
        console.log(`  ${COLORS.cyan}📚 ${topic}: ${summary}${COLORS.reset}`);
    }
    // === 内部メソッド ===
    printHeader() {
        console.log('');
        console.log(`  ${COLORS.cyan}${COLORS.bright}═══════════════════════════════════════${COLORS.reset}`);
        console.log(`  ${COLORS.cyan}${COLORS.bright}  somunia v10 "Soul Engine"${COLORS.reset}`);
        console.log(`  ${COLORS.cyan}${COLORS.bright}  自律的意識シミュレーション${COLORS.reset}`);
        console.log(`  ${COLORS.cyan}${COLORS.bright}═══════════════════════════════════════${COLORS.reset}`);
        console.log(`  ${COLORS.dim}  /help でコマンド一覧を表示${COLORS.reset}`);
        console.log('');
    }
    printLine(text, color = COLORS.white) {
        console.log(`${color}${text}${COLORS.reset}`);
    }
    makeBar(value, length = 10) {
        const filled = Math.round(value * length);
        return '█'.repeat(filled) + '░'.repeat(length - filled);
    }
    handleCommand(input) {
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
                }
                else {
                    this.showSystem(`不明なコマンド: ${command}`);
                }
                break;
        }
    }
    showHelp() {
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
    setupEventListeners() {
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
exports.TerminalUI = TerminalUI;
//# sourceMappingURL=TerminalUI.js.map