/**
 * TerminalUI - somunia v10 ターミナルインターフェース
 *
 * somuniaとテキストで対話するためのUI。
 * somuniaの内部状態、思考、行動をリアルタイムに表示。
 */
import { EmotionType, TimeOfDay, ActionType, Normalized, ThoughtNode } from '../types';
import { EventBus } from '../core/EventBus';
export declare class TerminalUI {
    private rl;
    private events;
    private onMessage;
    private onCommand;
    private displayThoughts;
    private displayActions;
    private displayEmotions;
    private compact;
    constructor(events?: EventBus);
    /**
     * UIを開始
     */
    start(): void;
    /**
     * UIを停止
     */
    stop(): void;
    /**
     * メッセージハンドラを設定
     */
    setMessageHandler(handler: (message: string) => void): void;
    /**
     * コマンドハンドラを設定
     */
    setCommandHandler(handler: (command: string, args: string[]) => void): void;
    /**
     * somuniaの発話を表示
     */
    showSpeech(content: string): void;
    /**
     * 思考を表示
     */
    showThought(thought: ThoughtNode): void;
    /**
     * 行動を表示
     */
    showAction(action: ActionType, description?: string): void;
    /**
     * 感情変化を表示
     */
    showEmotionChange(emotion: EmotionType, intensity: Normalized): void;
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
    }): void;
    /**
     * システムメッセージ
     */
    showSystem(message: string): void;
    /**
     * 日記エントリを表示
     */
    showDiary(title: string, content: string): void;
    /**
     * 夢を表示
     */
    showDream(content: string): void;
    /**
     * 学習を表示
     */
    showLearning(topic: string, summary: string): void;
    private printHeader;
    private printLine;
    private makeBar;
    private handleCommand;
    private showHelp;
    /**
     * イベントリスナーの設定
     */
    private setupEventListeners;
}
//# sourceMappingURL=TerminalUI.d.ts.map