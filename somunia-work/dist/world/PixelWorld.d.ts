/**
 * PixelWorld.ts - somuniaの8×8ピクセルワールド
 *
 * 小さな部屋の中で、somuniaは存在する。
 * 窓、本棚、ベッド、古いPC、椅子、床、天井...
 * すべてが8×8の空間に収まっている。
 */
import { Position, WorldObject, WorldObjectType, WorldTime, LightingState, Weather, InteractionType, EmotionType } from '../types';
/** インタラクション結果 */
export interface InteractionResult {
    objectId: string;
    objectName: string;
    objectType: WorldObjectType;
    interactionType: InteractionType;
    description: string;
    emotionalImpact: Array<{
        emotion: EmotionType;
        delta: number;
    }>;
    sensoryDetails: Array<{
        type: 'visual' | 'sound' | 'touch' | 'smell' | 'taste';
        content: string;
    }>;
    stateChanges: Record<string, any>;
    triggersMemory: boolean;
    memoryContent: string | null;
    discoveredDetail: string | null;
}
/** オブジェクトの状態変化 */
export interface ObjectStateChange {
    objectId: string;
    objectName: string;
    changeType: 'growth' | 'deterioration' | 'state_change' | 'discovery';
    description: string;
}
/** 環境アンビエンス */
export interface RoomAmbience {
    sounds: AmbienceSound[];
    particles: AmbienceParticle[];
    scents: AmbienceScent[];
    mood: RoomMood;
    description: string;
}
export interface AmbienceSound {
    source: string;
    description: string;
    volume: number;
    continuous: boolean;
}
export interface AmbienceParticle {
    type: 'dust_motes' | 'candle_flicker' | 'rain_drops' | 'snow_flakes';
    description: string;
    density: number;
    location: string;
}
export interface AmbienceScent {
    source: string;
    intensity: number;
    description: string;
}
export interface RoomMood {
    coziness: number;
    quietness: number;
    brightness: number;
    warmth: number;
}
/** 世界拡張の解放条件 */
export interface AreaUnlockCondition {
    type: 'knowledge_count' | 'specific_knowledge' | 'days_alive';
    threshold: number;
    topics: string[];
}
/** 拡張可能エリアの定義 */
export interface ExpandableArea {
    id: string;
    name: string;
    description: string;
    unlockCondition: {
        type: string;
        threshold?: number;
        topics?: string[];
    };
    gridExpansion: {
        direction: string;
        width: number;
        height: number;
    };
    objects: Array<{
        type: string;
        position: Position;
        size?: {
            width: number;
            height: number;
        };
        properties?: Record<string, any>;
    }>;
    narrativeOnUnlock: string[];
}
/** 拡張実行結果 */
export interface AreaExpansionResult {
    area: string;
    name: string;
    description: string;
    narrative: string[];
    newObjects: string[];
    newGridSize: {
        width: number;
        height: number;
    };
}
/** 拡張記録 */
export interface AreaExpansionRecord {
    areaId: string;
    areaName: string;
    unlockedAt: number;
    objectsAdded: string[];
    narrative: string[];
}
/** ピクセルセルの状態 */
export interface PixelCell {
    x: number;
    y: number;
    objectType: WorldObjectType | null;
    objectId: string | null;
    isWalkable: boolean;
    lightLevel: number;
    isInView: boolean;
}
/** ワールドの状態 */
export interface WorldState {
    grid: PixelCell[][];
    objects: Map<string, WorldObject>;
    lighting: LightingState;
    weather: Weather;
    time: WorldTime;
    somuniaPosition: Position;
    focusPoint: Position | null;
}
/** オブジェクトの配置情報 */
export interface ObjectPlacement {
    type: WorldObjectType;
    position: Position;
    size?: {
        width: number;
        height: number;
    };
    properties?: Record<string, any>;
}
/** 視界の状態 */
export interface ViewState {
    visibleCells: Position[];
    focusObject: WorldObject | null;
    lightDirection: 'left' | 'right' | 'above' | 'none';
    ambientDescription: string;
}
export interface PixelWorldConfig {
    width: number;
    height: number;
    defaultLightLevel: number;
    windowLightMultiplier: number;
    nightLightLevel: number;
}
export declare class PixelWorld {
    private config;
    private grid;
    private objects;
    private somuniaPosition;
    private focusPoint;
    private currentTime;
    private currentWeather;
    private lampIsOn;
    constructor(config?: Partial<PixelWorldConfig>);
    private createEmptyGrid;
    private initializeRoom;
    private placeObject;
    /**
     * オブジェクトを追加（動的に）
     */
    addObject(placement: ObjectPlacement): WorldObject | null;
    /**
     * オブジェクトを削除
     */
    removeObject(objectId: string): boolean;
    /**
     * somuniaを移動
     */
    moveSomunia(newPosition: Position): boolean;
    /**
     * 特定のオブジェクトに向かって移動
     */
    moveToObject(objectId: string): Position | null;
    private getAdjacentWalkableCells;
    /**
     * 時間を更新
     */
    updateTime(time: WorldTime): void;
    /**
     * 天気を設定
     */
    setWeather(weather: Weather): void;
    /**
     * ランプを切り替え
     */
    toggleLamp(): boolean;
    private updateLighting;
    private applyWindowLight;
    private applyLampLight;
    private updateVisibility;
    /**
     * 視点を特定の位置に集中
     */
    focusOn(position: Position): void;
    /**
     * フォーカスを解除
     */
    clearFocus(): void;
    /**
     * 現在の視界状態を取得
     */
    getViewState(): ViewState;
    private determineLightDirection;
    private generateAmbientDescription;
    /**
     * オブジェクトとインタラクトし、結果を返す
     */
    interactWith(objectId: string, interactionType?: InteractionType): InteractionResult | null;
    private executeInteraction;
    private interactPhoto;
    private interactMusicBox;
    private interactPlant;
    private interactClock;
    private interactPlushie;
    private interactNotebook;
    private interactMirror;
    private interactCurtain;
    private interactPoster;
    private interactOrnament;
    private interactCandle;
    private interactWindow;
    private interactBookshelf;
    /**
     * 環境のアンビエンスを生成（毎tick呼べる）
     */
    getAmbience(): RoomAmbience;
    private calculateRoomMood;
    private generateAmbienceDescription;
    /**
     * 窓の外の景色を取得
     */
    private getWindowViewDescription;
    /**
     * tickごとのオブジェクト状態更新
     */
    updateObjectStates(tick: number): ObjectStateChange[];
    /**
     * 特定位置の光レベルを取得
     */
    getLightAtPosition(position: Position): number;
    /**
     * 隣接するインタラクト可能なオブジェクトを取得
     */
    getInteractableObjects(): WorldObject[];
    /**
     * オブジェクトを取得（位置から）
     */
    getObjectAt(position: Position): WorldObject | null;
    /**
     * オブジェクトを取得（IDから）
     */
    getObject(objectId: string): WorldObject | null;
    /**
     * タイプでオブジェクトを取得
     */
    getObjectsByType(type: WorldObjectType): WorldObject[];
    /**
     * 窓を取得
     */
    getWindow(): WorldObject | null;
    /**
     * PCを取得
     */
    getPC(): WorldObject | null;
    /**
     * 本棚を取得
     */
    getBookshelf(): WorldObject | null;
    /**
     * 現在の照明状態を取得
     */
    getLightingState(): LightingState;
    getCell(position: Position): PixelCell | null;
    getGrid(): PixelCell[][];
    getSomuniaPosition(): Position;
    getCurrentTime(): WorldTime;
    getCurrentWeather(): Weather;
    isLampOn(): boolean;
    private isValidPosition;
    private isWalkable;
    private manhattanDistance;
    private generateId;
    getWorldState(): WorldState;
    toJSON(): object;
    static fromJSON(data: any): PixelWorld;
    /** 解放済みエリア */
    private unlockedAreas;
    /** 拡張の履歴 */
    private expansionHistory;
    /** 拡張可能エリアの定義 */
    private static readonly EXPANDABLE_AREAS;
    /**
     * 知識量に基づいて新エリアの解放チェック
     */
    checkWorldExpansion(knowledgeState: {
        totalConcepts: number;
        knownTopics: string[];
        daysSinceCreation: number;
    }): AreaExpansionResult | null;
    /**
     * 解放条件の判定
     */
    private checkUnlockCondition;
    /**
     * エリアを解放する
     */
    private unlockArea;
    /**
     * グリッドを拡張
     */
    private expandGrid;
    /**
     * 拡張時の座標調整
     */
    private adjustPositionForExpansion;
    /**
     * 解放済みエリア一覧
     */
    getUnlockedAreas(): string[];
    /**
     * 拡張履歴
     */
    getExpansionHistory(): AreaExpansionRecord[];
    /**
     * 次に解放可能なエリアのヒント
     */
    getNextAreaHint(currentKnowledge: number): string | null;
}
export default PixelWorld;
//# sourceMappingURL=PixelWorld.d.ts.map