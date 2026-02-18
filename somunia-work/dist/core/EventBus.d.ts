/**
 * EventBus - somunia v10 イベントバス
 *
 * 全モジュール間の通信を担うイベントシステム。
 * 各モジュールは直接参照せず、EventBusを介して疎結合に通信する。
 * これにより、モジュールの追加・削除が容易になる。
 */
import { SoulEvent, SoulEventType } from '../types';
export type EventHandler = (event: SoulEvent) => void | Promise<void>;
export interface EventSubscription {
    id: string;
    eventType: SoulEventType | '*';
    handler: EventHandler;
    priority: number;
    once: boolean;
}
export interface EventLog {
    event: SoulEvent;
    handlerCount: number;
    processingTime: number;
}
export declare class EventBus {
    private subscriptions;
    private wildcardSubscriptions;
    private eventLog;
    private maxLogSize;
    private nextId;
    private paused;
    private eventQueue;
    /**
     * イベントを購読
     */
    on(eventType: SoulEventType | '*', handler: EventHandler, priority?: number): string;
    /**
     * 一度だけのイベント購読
     */
    once(eventType: SoulEventType | '*', handler: EventHandler, priority?: number): string;
    /**
     * 購読を解除
     */
    off(subscriptionId: string): boolean;
    /**
     * イベントを発火
     */
    emit(event: SoulEvent): Promise<void>;
    /**
     * 同期的にイベントを発火（非同期ハンドラも呼ぶが待たない）
     */
    emitSync(event: SoulEvent): void;
    /**
     * イベント処理を一時停止
     */
    pause(): void;
    /**
     * イベント処理を再開（キューに溜まったイベントも処理）
     */
    resume(): Promise<void>;
    /**
     * 特定イベントタイプのハンドラ数を取得
     */
    listenerCount(eventType: SoulEventType): number;
    /**
     * 最近のイベントログを取得
     */
    getRecentEvents(count?: number): EventLog[];
    /**
     * 特定イベントの最近のログを取得
     */
    getEventsByType(eventType: SoulEventType, count?: number): EventLog[];
    /**
     * すべての購読を解除
     */
    clear(): void;
    /**
     * デバッグ情報
     */
    getDebugInfo(): {
        subscriptionCount: number;
        wildcardCount: number;
        queueLength: number;
        recentEventCount: number;
        isPaused: boolean;
    };
}
export declare const eventBus: EventBus;
//# sourceMappingURL=EventBus.d.ts.map