/**
 * Visitor - somunia v10 訪問者システム
 *
 * 訪問者（ユーザー）との関係性を管理する。
 * somuniaは「自分の世界に訪問者が来る」という構造。
 *
 * 応答の決定はコードで行い、LLMは言語化のみ。
 */
import { VisitorState, Relationship, Conversation, Message, EmotionType, Tick } from '../types';
import { EventBus } from '../core/EventBus';
export declare class Visitor {
    private state;
    private events;
    constructor(events?: EventBus);
    /**
     * 訪問者が到着する
     */
    arrive(name?: string, tick?: Tick): void;
    /**
     * 訪問者が去る
     */
    depart(tick?: Tick): void;
    /**
     * 訪問者のメッセージを受け取る
     */
    receiveMessage(content: string, tick?: Tick): Message;
    /**
     * 応答パターンを決定する（コードで決定）
     */
    decideResponse(understanding: {
        intent: string;
        topics: string[];
        emotions: EmotionType[];
    }, currentEmotion: EmotionType): {
        seed: string;
        emotionalReaction: EmotionType;
        pattern: string;
    };
    /**
     * somuniaの応答を記録
     */
    recordResponse(content: string, emotionDuring: EmotionType, thoughtBefore: string, tick?: Tick): Message;
    /**
     * 全体的な感情を検出
     */
    private detectOverallFeeling;
    getState(): VisitorState;
    isPresent(): boolean;
    getRelationship(): Relationship;
    getName(): string | null;
    getConversation(): Conversation | null;
    toJSON(): object;
    fromJSON(data: any): void;
}
//# sourceMappingURL=Visitor.d.ts.map