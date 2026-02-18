/**
 * VisitorMemorySystem - Phase 7C: 訪問者記憶システム
 *
 * somuniaが訪問者を「ちゃんと覚える」ためのシステム。
 *
 * 以前の問題:
 * - 名前を聞いても忘れていた
 * - 過去の会話内容を参照しなかった
 * - 「この人に話したいこと」が蓄積されなかった
 *
 * 解決:
 * 1. 名前検出（自己紹介パターンマッチング）
 * 2. 訪問者ごとのプロファイル（永続保存）
 * 3. 会話からの情報自動抽出
 * 4. 関連記憶の検索と表面化
 * 5. 「話したいこと」リストの管理
 */
import { VisitorProfile, VisitorFact, VisitorContext7, EmotionType, ConversationDepth, RelationshipPhase, Normalized, Tick, ID } from '../types';
export interface VisitorMemoryConfig {
    maxProfiles: number;
    maxFactsPerVisitor: number;
    maxSpecialMemories: number;
    maxThingsToTell: number;
    maxTopicHistory: number;
}
export declare class VisitorMemorySystem {
    private config;
    private profiles;
    private currentVisitorId;
    private defaultVisitorId;
    constructor(config?: Partial<VisitorMemoryConfig>);
    onVisitorArrival(visitorId?: ID): VisitorProfile;
    onVisitorDeparture(summary?: {
        topics: string[];
        depth: ConversationDepth;
        impression: EmotionType;
        memorable?: string;
    }): void;
    processMessage(message: string, emotions: EmotionType[], topics: string[], depth: ConversationDepth, tick: Tick): {
        extractedName: string | null;
        extractedFacts: VisitorFact[];
        hasNameIntroduction: boolean;
    };
    private detectName;
    private extractFacts;
    private similar;
    private addFact;
    private updateComStyle;
    generateVisitorContext(currentTopics: string[], currentMessage: string, relationshipPhase: RelationshipPhase): VisitorContext7 | null;
    addThingToTell(content: string, priority?: Normalized): void;
    private addThingToProfile;
    getUntoldThings(): string[];
    getCurrentVisitorName(): string | null;
    getCurrentVisitorCallName(): string;
    getCurrentProfile(): VisitorProfile | null;
    isVisitorPresent(): boolean;
    private selectRelevantFacts;
    private getRecentTopics;
    private describeTimeSince;
    private createProfile;
    toJSON(): any;
    fromJSON(data: any): void;
}
//# sourceMappingURL=VisitorMemorySystem.d.ts.map