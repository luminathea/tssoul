"use strict";
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
exports.TerminalUIV2 = void 0;
const readline = __importStar(require("readline"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const EventBus_1 = require("../core/EventBus");
// ============================================================
// 定数
// ============================================================
const C = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    bright: '\x1b[1m',
    italic: '\x1b[3m',
    underline: '\x1b[4m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    bgBlack: '\x1b[40m',
    bgBlue: '\x1b[44m',
    bgCyan: '\x1b[46m',
};
const EMOTION_STYLE = {
    joy: { color: C.yellow, icon: '☀️' },
    peace: { color: C.green, icon: '🍃' },
    curiosity: { color: C.cyan, icon: '🔍' },
    melancholy: { color: C.blue, icon: '🌧️' },
    loneliness: { color: C.magenta, icon: '🌑' },
    anxiety: { color: C.red, icon: '⚡' },
    contentment: { color: C.green, icon: '🌿' },
    wonder: { color: C.cyan, icon: '✨' },
    warmth: { color: C.yellow, icon: '🔥' },
    fatigue: { color: C.gray, icon: '💤' },
    boredom: { color: C.dim, icon: '😶' },
    anticipation: { color: C.cyan, icon: '🌀' },
    confusion: { color: C.magenta, icon: '❓' },
    nostalgia: { color: C.blue, icon: '📷' },
    hope: { color: C.green, icon: '🌱' },
    fear: { color: C.red, icon: '😰' },
    excitement: { color: C.yellow, icon: '🎉' },
    serenity: { color: C.green, icon: '🕊️' },
    gratitude: { color: C.yellow, icon: '🙏' },
};
const TIME_DISPLAY = {
    dawn: { icon: '🌅', label: '夜明け' },
    morning: { icon: '☀️', label: '朝' },
    midday: { icon: '🌤️', label: '昼' },
    afternoon: { icon: '⛅', label: '午後' },
    evening: { icon: '🌇', label: '夕方' },
    night: { icon: '🌙', label: '夜' },
    late_night: { icon: '🌑', label: '深夜' },
};
const DEFAULT_UI_CONFIG = {
    mode: 'conversation',
    statusBarInterval: 5000,
    logFile: null,
    showThoughts: true,
    showActions: true,
    showEmotions: true,
    showDreams: true,
    showLearning: true,
    compact: false,
    maxBufferLines: 500,
};
// ============================================================
// TerminalUIV2
// ============================================================
class TerminalUIV2 {
    rl = null;
    events;
    config;
    onMessage = null;
    onCommand = null;
    statusBarTimer = null;
    logStream = null;
    outputBuffer = [];
    // ダッシュボード用の最新データ
    latestStatus = null;
    // 表示統計
    displayStats = {
        thoughtsShown: 0,
        actionsShown: 0,
        emotionsShown: 0,
        speechesShown: 0,
        messagesReceived: 0,
    };
    constructor(config, events) {
        this.config = { ...DEFAULT_UI_CONFIG, ...config };
        this.events = events || EventBus_1.eventBus;
        if (this.config.logFile) {
            const logDir = path.dirname(this.config.logFile);
            if (!fs.existsSync(logDir))
                fs.mkdirSync(logDir, { recursive: true });
            this.logStream = fs.createWriteStream(this.config.logFile, { flags: 'a' });
        }
        this.setupEventListeners();
    }
    // ============================================================
    // 起動・停止
    // ============================================================
    start() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        this.printHeader();
        this.printModeInfo();
        this.rl.on('line', (line) => {
            const trimmed = line.trim();
            if (!trimmed)
                return;
            this.displayStats.messagesReceived++;
            if (trimmed.startsWith('/')) {
                this.handleCommand(trimmed);
            }
            else if (this.onMessage) {
                this.onMessage(trimmed);
            }
        });
        this.rl.on('close', () => {
            this.println(`\n  ${C.magenta}👋 さよなら...また会える日を待っています。${C.reset}`);
            this.stopStatusBar();
        });
        // ステータスバー更新タイマー（observerモード時）
        if (this.config.mode === 'observer' || this.config.mode === 'dashboard') {
            this.startStatusBar();
        }
    }
    stop() {
        this.stopStatusBar();
        if (this.logStream) {
            this.logStream.end();
            this.logStream = null;
        }
        if (this.rl) {
            this.rl.close();
            this.rl = null;
        }
    }
    setMessageHandler(handler) {
        this.onMessage = handler;
    }
    setCommandHandler(handler) {
        this.onCommand = handler;
    }
    // ============================================================
    // 表示メソッド
    // ============================================================
    showSpeech(content) {
        this.displayStats.speechesShown++;
        const cleaned = content.replace(/^[「『"']|[」』"']$/g, '').trim();
        const lines = cleaned.split('\n').filter(l => l.trim().length > 0);
        this.println('');
        if (lines.length <= 1) {
            this.println(`  ${C.bright}${C.cyan}somunia${C.reset}${C.dim}:${C.reset} ${cleaned}`);
        }
        else {
            // 最初の行は somunia: 付き、以降はインデント
            this.println(`  ${C.bright}${C.cyan}somunia${C.reset}${C.dim}:${C.reset} ${lines[0]}`);
            for (let i = 1; i < lines.length; i++) {
                this.println(`           ${lines[i]}`);
            }
        }
    }
    showThought(thought) {
        if (!this.config.showThoughts)
            return;
        if (this.config.mode === 'conversation')
            return; // 会話モードでは非表示
        this.displayStats.thoughtsShown++;
        const style = EMOTION_STYLE[thought.emotionalColor] || { color: C.gray, icon: '💭' };
        if (this.config.compact) {
            this.println(`  ${C.dim}💭 ${thought.content}${C.reset}`);
        }
        else {
            this.println(`  ${style.color}${style.icon} ${thought.content}${C.reset}`);
        }
    }
    showAction(action, description) {
        if (!this.config.showActions)
            return;
        if (this.config.mode === 'conversation')
            return;
        this.displayStats.actionsShown++;
        this.println(`  ${C.green}▸ ${description || action}${C.reset}`);
    }
    showEmotionChange(emotion, intensity) {
        if (!this.config.showEmotions)
            return;
        if (this.config.mode === 'conversation')
            return;
        this.displayStats.emotionsShown++;
        const style = EMOTION_STYLE[emotion] || { color: C.white, icon: '♡' };
        const bar = this.makeBar(intensity);
        this.println(`  ${style.color}${style.icon} ${emotion} ${bar}${C.reset}`);
    }
    showStatusBar(data) {
        this.latestStatus = { tick: 0, ...data };
        if (this.config.mode === 'observer' || this.config.mode === 'dashboard') {
            const td = TIME_DISPLAY[data.timeOfDay] || { icon: '⏰', label: '不明' };
            const es = EMOTION_STYLE[data.emotion] || { color: C.white, icon: '♡' };
            const energyBar = this.makeBar(data.energy, 8);
            const line = [
                `${C.dim}──${C.reset}`,
                `${td.icon} Day${data.day} ${data.hour.toFixed(0)}:00`,
                `${C.dim}|${C.reset}`,
                `${es.color}${es.icon} ${data.emotion}${C.reset}`,
                `${C.dim}|${C.reset}`,
                `⚡${energyBar}`,
                `${C.dim}|${C.reset}`,
                `${data.weather}`,
                `${C.dim}|${C.reset}`,
                `${C.dim}${data.action}${C.reset}`,
                `${C.dim}──${C.reset}`,
            ].join(' ');
            this.println(line);
        }
    }
    showSystem(message) {
        this.println(`  ${C.gray}[system] ${message}${C.reset}`);
    }
    showDiary(title, content) {
        if (!this.config.showDreams)
            return;
        this.println(`\n  ${C.magenta}📖 日記: ${title}${C.reset}`);
        for (const line of content.split('\n')) {
            this.println(`  ${C.dim}  ${line}${C.reset}`);
        }
    }
    showDream(content) {
        if (!this.config.showDreams)
            return;
        this.println(`  ${C.magenta}${C.dim}💤 ${content}${C.reset}`);
    }
    showLearning(topic, summary) {
        if (!this.config.showLearning)
            return;
        this.println(`  ${C.cyan}📚 ${topic}: ${summary}${C.reset}`);
    }
    /**
     * Phase 6C: ダッシュボードデータの表示
     */
    showDashboard(data) {
        this.println('');
        this.println(`  ${C.cyan}${C.bright}╔══════════════════════════════════════════════╗${C.reset}`);
        this.println(`  ${C.cyan}${C.bright}║   somunia v10.6 Dashboard                   ║${C.reset}`);
        this.println(`  ${C.cyan}${C.bright}╠══════════════════════════════════════════════╣${C.reset}`);
        this.println(`  ${C.cyan}║${C.reset}  ${C.dim}Uptime:${C.reset} ${data.uptime}  ${C.dim}Tick:${C.reset} ${data.tick}  ${C.dim}Day:${C.reset} ${data.day}`);
        this.println(`  ${C.cyan}║${C.reset}  ${C.dim}Storage:${C.reset} ${data.storage}`);
        this.println(`  ${C.cyan}╠══════════════════════════════════════════════╣${C.reset}`);
        for (const mod of data.modules) {
            const statusIcon = mod.status === 'active' ? `${C.green}●${C.reset}`
                : mod.status === 'sleeping' ? `${C.blue}◑${C.reset}`
                    : `${C.gray}○${C.reset}`;
            this.println(`  ${C.cyan}║${C.reset}  ${statusIcon} ${C.bright}${mod.name.padEnd(20)}${C.reset} ${C.dim}${mod.detail}${C.reset}`);
        }
        this.println(`  ${C.cyan}${C.bright}╚══════════════════════════════════════════════╝${C.reset}`);
        this.println('');
    }
    /**
     * Phase 6C: Wikipedia API ステータス表示
     */
    showWikiStatus(status) {
        const onlineIcon = status.isOnline ? `${C.green}●${C.reset} オンライン` : `${C.red}●${C.reset} オフライン`;
        this.println(`\n  ${C.cyan}📡 Wikipedia API ステータス${C.reset}`);
        this.println(`  ${C.dim}├${C.reset} 接続: ${onlineIcon}`);
        this.println(`  ${C.dim}├${C.reset} リクエスト: ${status.totalRequests} (成功: ${status.successCount})`);
        this.println(`  ${C.dim}├${C.reset} キャッシュヒット: ${status.cacheHits}`);
        this.println(`  ${C.dim}├${C.reset} キャッシュ記事数: ${status.cachedArticles}`);
        if (status.lastError) {
            this.println(`  ${C.dim}└${C.reset} ${C.red}最後のエラー: ${status.lastError}${C.reset}`);
        }
        else {
            this.println(`  ${C.dim}└${C.reset} エラーなし`);
        }
    }
    /**
     * Phase 6C: 永続化ステータス表示
     */
    showPersistenceStatus(info) {
        this.println(`\n  ${C.cyan}💾 永続化ステータス${C.reset}`);
        this.println(`  ${C.dim}├${C.reset} ストレージ: ${info.formattedSize}`);
        this.println(`  ${C.dim}├${C.reset} モジュール数: ${info.moduleCount}`);
        this.println(`  ${C.dim}├${C.reset} バックアップ世代: ${info.backupCount}`);
        this.println(`  ${C.dim}├${C.reset} 保存回数: ${info.stats.totalSaves} (増分: ${info.stats.incrementalSaves}, 全体: ${info.stats.fullSaves})`);
        this.println(`  ${C.dim}├${C.reset} 平均保存時間: ${info.stats.averageSaveDuration.toFixed(0)}ms`);
        this.println(`  ${C.dim}├${C.reset} クラッシュリカバリ: ${info.stats.crashRecoveries}回`);
        this.println(`  ${C.dim}└${C.reset} エラー: ${info.stats.totalErrors}回`);
    }
    /**
     * Phase 6C: テスト結果表示
     */
    showTestResults(results) {
        this.println(`\n  ${C.cyan}${C.bright}🧪 テスト結果${C.reset}`);
        let totalPassed = 0, totalFailed = 0, totalSkipped = 0;
        for (const suite of results) {
            totalPassed += suite.passed;
            totalFailed += suite.failed;
            totalSkipped += suite.skipped;
            const icon = suite.failed === 0 ? `${C.green}✓${C.reset}` : `${C.red}✗${C.reset}`;
            this.println(`  ${icon} ${C.bright}${suite.suiteName}${C.reset} ${C.dim}(${suite.duration}ms)${C.reset}`);
            this.println(`    ${C.green}${suite.passed} passed${C.reset}  ${suite.failed > 0 ? `${C.red}${suite.failed} failed${C.reset}` : ''}  ${suite.skipped > 0 ? `${C.dim}${suite.skipped} skipped${C.reset}` : ''}`);
            for (const failure of suite.failures) {
                this.println(`    ${C.red}✗ ${failure.name}: ${failure.error}${C.reset}`);
            }
        }
        this.println(`\n  ${C.dim}────────────────────────────────${C.reset}`);
        const allPassed = totalFailed === 0;
        this.println(`  ${allPassed ? C.green : C.red}合計: ${totalPassed} passed, ${totalFailed} failed, ${totalSkipped} skipped${C.reset}`);
    }
    // ============================================================
    // 内部メソッド
    // ============================================================
    println(text) {
        console.log(text);
        this.outputBuffer.push(text);
        if (this.outputBuffer.length > this.config.maxBufferLines) {
            this.outputBuffer.shift();
        }
        if (this.logStream) {
            // ANSI除去してログに書き込み
            const clean = text.replace(/\x1b\[[0-9;]*m/g, '');
            this.logStream.write(`[${new Date().toISOString()}] ${clean}\n`);
        }
    }
    printHeader() {
        this.println('');
        this.println(`  ${C.cyan}${C.bright}═══════════════════════════════════════${C.reset}`);
        this.println(`  ${C.cyan}${C.bright}  somunia v10.6 "Soul Engine"${C.reset}`);
        this.println(`  ${C.cyan}${C.bright}  自律的意識シミュレーション${C.reset}`);
        this.println(`  ${C.cyan}${C.bright}  Phase 6: 外部接続・実運用${C.reset}`);
        this.println(`  ${C.cyan}${C.bright}═══════════════════════════════════════${C.reset}`);
        this.println(`  ${C.dim}/help でコマンド一覧を表示${C.reset}`);
        this.println('');
    }
    printModeInfo() {
        const modeLabels = {
            conversation: '💬 会話モード（somuniaとの対話に集中）',
            observer: '👁 観察モード（思考・行動・感情をリアルタイム表示）',
            dashboard: '📊 ダッシュボードモード（全システム統計）',
            inspector: '🔬 インスペクタモード（モジュール詳細表示）',
        };
        this.println(`  ${C.dim}現在のモード: ${modeLabels[this.config.mode]}${C.reset}`);
        this.println('');
    }
    makeBar(value, length = 10) {
        const filled = Math.round(value * length);
        return '█'.repeat(filled) + '░'.repeat(length - filled);
    }
    startStatusBar() {
        this.statusBarTimer = setInterval(() => {
            if (this.latestStatus) {
                // ステータスバー自動更新はobserverモードのみ
            }
        }, this.config.statusBarInterval);
    }
    stopStatusBar() {
        if (this.statusBarTimer) {
            clearInterval(this.statusBarTimer);
            this.statusBarTimer = null;
        }
    }
    // ============================================================
    // コマンド処理
    // ============================================================
    handleCommand(input) {
        const parts = input.slice(1).split(/\s+/);
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        switch (command) {
            case 'help':
            case 'h':
                this.showHelp();
                break;
            case 'mode':
                this.switchMode(args[0]);
                break;
            case 'thoughts':
                this.config.showThoughts = !this.config.showThoughts;
                this.showSystem(`思考表示: ${this.config.showThoughts ? 'ON' : 'OFF'}`);
                break;
            case 'actions':
                this.config.showActions = !this.config.showActions;
                this.showSystem(`行動表示: ${this.config.showActions ? 'ON' : 'OFF'}`);
                break;
            case 'emotions':
                this.config.showEmotions = !this.config.showEmotions;
                this.showSystem(`感情表示: ${this.config.showEmotions ? 'ON' : 'OFF'}`);
                break;
            case 'compact':
                this.config.compact = !this.config.compact;
                this.showSystem(`コンパクト表示: ${this.config.compact ? 'ON' : 'OFF'}`);
                break;
            case 'uistats':
                this.showUIStats();
                break;
            default:
                if (this.onCommand) {
                    this.onCommand(command, args);
                }
                else {
                    this.showSystem(`不明なコマンド: ${command} (/help で一覧表示)`);
                }
                break;
        }
    }
    switchMode(mode) {
        const validModes = ['conversation', 'observer', 'dashboard', 'inspector'];
        if (!mode || !validModes.includes(mode)) {
            this.showSystem(`使用法: /mode <${validModes.join('|')}>`);
            this.showSystem(`現在: ${this.config.mode}`);
            return;
        }
        this.config.mode = mode;
        this.printModeInfo();
        if (mode === 'observer' || mode === 'dashboard') {
            this.startStatusBar();
        }
        else {
            this.stopStatusBar();
        }
    }
    showHelp() {
        this.println(`
  ${C.cyan}${C.bright}=== コマンド一覧 ===${C.reset}

  ${C.bright}基本${C.reset}
  ${C.bright}/help${C.reset}${C.dim} (/h)${C.reset}        この一覧を表示
  ${C.bright}/save${C.reset}             手動保存
  ${C.bright}/status${C.reset}           詳細ステータス
  ${C.bright}/quit${C.reset}             終了

  ${C.bright}表示${C.reset}
  ${C.bright}/mode${C.reset} <name>      表示モード切替 (conversation/observer/dashboard/inspector)
  ${C.bright}/thoughts${C.reset}         思考表示ON/OFF
  ${C.bright}/actions${C.reset}          行動表示ON/OFF
  ${C.bright}/emotions${C.reset}         感情表示ON/OFF
  ${C.bright}/compact${C.reset}          コンパクト表示
  ${C.bright}/uistats${C.reset}          UI統計

  ${C.bright}Phase 5${C.reset}
  ${C.bright}/creative${C.reset}         創作統計
  ${C.bright}/relationship${C.reset}${C.dim} (/rel)${C.reset}  関係性統計
  ${C.bright}/narrative${C.reset}        ナラティブ統計
  ${C.bright}/conversation${C.reset}${C.dim} (/conv)${C.reset} 会話統計
  ${C.bright}/bye${C.reset}              訪問者退出

  ${C.bright}Phase 6${C.reset}
  ${C.bright}/wiki${C.reset}             Wikipedia APIステータス
  ${C.bright}/wiki search${C.reset} <q>  Wikipedia検索
  ${C.bright}/persistence${C.reset}${C.dim} (/pers)${C.reset} 永続化ステータス
  ${C.bright}/test${C.reset}             テスト実行
  ${C.bright}/dashboard${C.reset}${C.dim} (/dash)${C.reset} ダッシュボード表示
  ${C.bright}/export${C.reset}           データエクスポート

  ${C.bright}記憶・学習${C.reset}
  ${C.bright}/memory${C.reset}           記憶の統計
  ${C.bright}/diary${C.reset}            最近の日記
`);
    }
    showUIStats() {
        this.println(`\n  ${C.cyan}🖥 UI統計${C.reset}`);
        this.println(`  ${C.dim}├${C.reset} 表示モード: ${this.config.mode}`);
        this.println(`  ${C.dim}├${C.reset} 思考表示: ${this.displayStats.thoughtsShown}`);
        this.println(`  ${C.dim}├${C.reset} 行動表示: ${this.displayStats.actionsShown}`);
        this.println(`  ${C.dim}├${C.reset} 感情表示: ${this.displayStats.emotionsShown}`);
        this.println(`  ${C.dim}├${C.reset} 発話表示: ${this.displayStats.speechesShown}`);
        this.println(`  ${C.dim}├${C.reset} 受信メッセージ: ${this.displayStats.messagesReceived}`);
        this.println(`  ${C.dim}└${C.reset} バッファ行数: ${this.outputBuffer.length}/${this.config.maxBufferLines}`);
    }
    // ============================================================
    // イベントリスナー
    // ============================================================
    setupEventListeners() {
        this.events.on('thought', (event) => {
            if (event.data?.thought)
                this.showThought(event.data.thought);
        });
        this.events.on('action_started', (event) => {
            if (event.data?.action)
                this.showAction(event.data.action);
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
        this.events.on('state_saved', (event) => {
            const duration = event.data?.duration;
            const dirty = event.data?.dirtyModules;
            if (duration !== undefined) {
                this.showSystem(`💾 保存完了 (${duration}ms, 変更${dirty}モジュール)`);
            }
            else {
                this.showSystem('💾 状態を保存しました');
            }
        });
    }
}
exports.TerminalUIV2 = TerminalUIV2;
//# sourceMappingURL=TerminalUIV2.js.map