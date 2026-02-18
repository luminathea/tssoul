/**
 * Perception.ts - somuniaの知覚システム
 *
 * 世界を知覚し、注意を向け、意味を見出す。
 * 単なるデータではなく、somuniaの視点から世界を感じる。
 */
import { Position, WorldObject, WorldObjectType, EmotionType, EmotionState } from '../types';
import { PixelWorld } from './PixelWorld';
/** 知覚されたもの */
export interface Percept {
    id: string;
    type: PerceptType;
    source: WorldObject | string;
    position?: Position;
    salience: number;
    emotionalValence: number;
    description: string;
    timestamp: number;
}
/** 知覚の種類 */
export type PerceptType = 'visual' | 'auditory' | 'temporal' | 'atmospheric' | 'internal';
/** 注意の状態 */
export interface AttentionState {
    focus: Percept | null;
    peripheral: Percept[];
    distractions: Percept[];
    attentionLevel: number;
    wanderingThoughts: string[];
}
/** 環境の印象 */
export interface EnvironmentalImpression {
    overall: string;
    mood: EmotionType;
    comfort: number;
    novelty: number;
    safety: number;
    details: string[];
}
/** 知覚のフィルター設定 */
export interface PerceptionFilter {
    emotionalBias: Partial<Record<EmotionType, number>>;
    interestAreas: WorldObjectType[];
    avoidanceAreas: WorldObjectType[];
    attentionThreshold: number;
}
/** 知覚イベント */
export interface PerceptionEvent {
    type: 'noticed' | 'lost_focus' | 'distracted' | 'realized';
    percept?: Percept;
    description: string;
    timestamp: number;
}
export interface PerceptionConfig {
    maxPercepts: number;
    attentionDecayRate: number;
    salienceThreshold: number;
    thoughtWanderingRate: number;
}
export declare class Perception {
    private config;
    private currentPercepts;
    private attentionState;
    private perceptionEvents;
    private filter;
    private recentPercepts;
    private maxRecentPercepts;
    constructor(config?: Partial<PerceptionConfig>);
    /**
     * 世界を知覚する（メイン処理）
     */
    perceiveWorld(world: PixelWorld, currentEmotions: EmotionState): Percept[];
    private perceiveVisuals;
    private createObjectPercept;
    private createLightPercept;
    private perceiveAtmosphere;
    private createWeatherPercept;
    private perceiveTime;
    private perceiveInternal;
    private updateAttention;
    private generateWanderingThought;
    /**
     * 注意を特定の対象に向ける
     */
    focusAttention(target: Percept): void;
    /**
     * 注意を解放
     */
    releaseAttention(): void;
    /**
     * 現在の環境の印象を取得
     */
    getEnvironmentalImpression(world: PixelWorld): EnvironmentalImpression;
    private determineMoodFromEnvironment;
    private calculateComfort;
    private gatherEnvironmentDetails;
    private updateFilterByEmotions;
    /**
     * フィルターを設定
     */
    setFilter(filter: Partial<PerceptionFilter>): void;
    private updateCurrentPercepts;
    getCurrentPercepts(): Percept[];
    getAttentionState(): AttentionState;
    getRecentPercepts(): Percept[];
    getPerceptionEvents(): PerceptionEvent[];
    toJSON(): object;
    static fromJSON(data: any): Perception;
}
export default Perception;
//# sourceMappingURL=Perception.d.ts.map