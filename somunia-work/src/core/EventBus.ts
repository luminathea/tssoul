/**
 * EventBus - somunia v10 イベントバス
 * 
 * 全モジュール間の通信を担うイベントシステム。
 * 各モジュールは直接参照せず、EventBusを介して疎結合に通信する。
 * これにより、モジュールの追加・削除が容易になる。
 */

import { SoulEvent, SoulEventType, Timestamp } from '../types';

// ============================================================
// 型定義
// ============================================================

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

// ============================================================
// EventBus
// ============================================================

export class EventBus {
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private wildcardSubscriptions: EventSubscription[] = [];
  private eventLog: EventLog[] = [];
  private maxLogSize: number = 1000;
  private nextId: number = 0;
  private paused: boolean = false;
  private eventQueue: SoulEvent[] = [];

  /**
   * イベントを購読
   */
  on(eventType: SoulEventType | '*', handler: EventHandler, priority: number = 0): string {
    const id = `sub_${this.nextId++}`;
    const subscription: EventSubscription = {
      id,
      eventType,
      handler,
      priority,
      once: false,
    };

    if (eventType === '*') {
      this.wildcardSubscriptions.push(subscription);
      this.wildcardSubscriptions.sort((a, b) => b.priority - a.priority);
    } else {
      const subs = this.subscriptions.get(eventType) || [];
      subs.push(subscription);
      subs.sort((a, b) => b.priority - a.priority);
      this.subscriptions.set(eventType, subs);
    }

    return id;
  }

  /**
   * 一度だけのイベント購読
   */
  once(eventType: SoulEventType | '*', handler: EventHandler, priority: number = 0): string {
    const id = `sub_${this.nextId++}`;
    const subscription: EventSubscription = {
      id,
      eventType,
      handler,
      priority,
      once: true,
    };

    if (eventType === '*') {
      this.wildcardSubscriptions.push(subscription);
    } else {
      const subs = this.subscriptions.get(eventType) || [];
      subs.push(subscription);
      this.subscriptions.set(eventType, subs);
    }

    return id;
  }

  /**
   * 購読を解除
   */
  off(subscriptionId: string): boolean {
    // ワイルドカードから探す
    const wcIdx = this.wildcardSubscriptions.findIndex(s => s.id === subscriptionId);
    if (wcIdx >= 0) {
      this.wildcardSubscriptions.splice(wcIdx, 1);
      return true;
    }

    // 通常の購読から探す
    for (const [type, subs] of this.subscriptions.entries()) {
      const idx = subs.findIndex(s => s.id === subscriptionId);
      if (idx >= 0) {
        subs.splice(idx, 1);
        if (subs.length === 0) {
          this.subscriptions.delete(type);
        }
        return true;
      }
    }

    return false;
  }

  /**
   * イベントを発火
   */
  async emit(event: SoulEvent): Promise<void> {
    if (this.paused) {
      this.eventQueue.push(event);
      return;
    }

    const startTime = Date.now();
    let handlerCount = 0;

    // 特定イベントのハンドラ
    const subs = this.subscriptions.get(event.type) || [];
    const toRemove: string[] = [];

    for (const sub of subs) {
      try {
        await sub.handler(event);
        handlerCount++;
        if (sub.once) {
          toRemove.push(sub.id);
        }
      } catch (error) {
        console.error(`[EventBus] Error in handler for ${event.type}:`, error);
      }
    }

    // ワイルドカードハンドラ
    const wcToRemove: string[] = [];
    for (const sub of this.wildcardSubscriptions) {
      try {
        await sub.handler(event);
        handlerCount++;
        if (sub.once) {
          wcToRemove.push(sub.id);
        }
      } catch (error) {
        console.error(`[EventBus] Error in wildcard handler:`, error);
      }
    }

    // once購読を削除
    for (const id of toRemove) {
      this.off(id);
    }
    for (const id of wcToRemove) {
      this.off(id);
    }

    // ログ記録
    const processingTime = Date.now() - startTime;
    this.eventLog.push({ event, handlerCount, processingTime });

    // ログサイズ制限
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize / 2);
    }
  }

  /**
   * 同期的にイベントを発火（非同期ハンドラも呼ぶが待たない）
   */
  emitSync(event: SoulEvent): void {
    if (this.paused) {
      this.eventQueue.push(event);
      return;
    }

    const subs = this.subscriptions.get(event.type) || [];
    for (const sub of subs) {
      try {
        sub.handler(event);
      } catch (error) {
        console.error(`[EventBus] Sync error in handler for ${event.type}:`, error);
      }
    }

    for (const sub of this.wildcardSubscriptions) {
      try {
        sub.handler(event);
      } catch (error) {
        console.error(`[EventBus] Sync error in wildcard handler:`, error);
      }
    }
  }

  /**
   * イベント処理を一時停止
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * イベント処理を再開（キューに溜まったイベントも処理）
   */
  async resume(): Promise<void> {
    this.paused = false;
    const queued = [...this.eventQueue];
    this.eventQueue = [];
    for (const event of queued) {
      await this.emit(event);
    }
  }

  /**
   * 特定イベントタイプのハンドラ数を取得
   */
  listenerCount(eventType: SoulEventType): number {
    const subs = this.subscriptions.get(eventType) || [];
    return subs.length + this.wildcardSubscriptions.length;
  }

  /**
   * 最近のイベントログを取得
   */
  getRecentEvents(count: number = 50): EventLog[] {
    return this.eventLog.slice(-count);
  }

  /**
   * 特定イベントの最近のログを取得
   */
  getEventsByType(eventType: SoulEventType, count: number = 20): EventLog[] {
    return this.eventLog
      .filter(log => log.event.type === eventType)
      .slice(-count);
  }

  /**
   * すべての購読を解除
   */
  clear(): void {
    this.subscriptions.clear();
    this.wildcardSubscriptions = [];
    this.eventLog = [];
    this.eventQueue = [];
  }

  /**
   * デバッグ情報
   */
  getDebugInfo(): {
    subscriptionCount: number;
    wildcardCount: number;
    queueLength: number;
    recentEventCount: number;
    isPaused: boolean;
  } {
    let count = 0;
    for (const subs of this.subscriptions.values()) {
      count += subs.length;
    }

    return {
      subscriptionCount: count,
      wildcardCount: this.wildcardSubscriptions.length,
      queueLength: this.eventQueue.length,
      recentEventCount: this.eventLog.length,
      isPaused: this.paused,
    };
  }
}

// シングルトン
export const eventBus = new EventBus();
