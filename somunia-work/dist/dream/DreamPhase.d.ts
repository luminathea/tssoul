/**
 * DreamPhase - somuniaの夢と睡眠の意識処理
 *
 * 睡眠中に行われる記憶の整理、感情の処理、新しい関連性の発見
 * 夢は無意識からのメッセージであり、創造性の源泉
 */
/** 睡眠段階 */
export type SleepStage = 'awake' | 'drowsy' | 'light' | 'deep' | 'rem';
/** 夢の種類 */
export type DreamType = 'narrative' | 'symbolic' | 'memory' | 'abstract' | 'lucid' | 'nightmare';
/** 夢の要素 */
export interface DreamElement {
    /** 要素の種類 */
    type: 'scene' | 'character' | 'object' | 'emotion' | 'sound' | 'sensation';
    /** 内容 */
    content: string;
    /** 強度 */
    intensity: number;
    /** 関連する記憶のキー */
    relatedMemoryKeys?: string[];
    /** 象徴的な意味 */
    symbolicMeaning?: string;
}
/** 夢 */
export interface Dream {
    /** 夢のID */
    id: string;
    /** 夢の種類 */
    type: DreamType;
    /** 夢のタイトル（覚醒後に付けられる） */
    title?: string;
    /** 夢の要素 */
    elements: DreamElement[];
    /** 夢の流れ（シーンの連続） */
    narrative: string[];
    /** 全体的な感情トーン */
    emotionalTone: {
        valence: number;
        arousal: number;
        dominance: number;
    };
    /** 印象に残った色 */
    dominantColors: string[];
    /** 聞こえた音 */
    sounds: string[];
    /** 夢の中の時間感覚 */
    perceivedDuration: 'instant' | 'short' | 'normal' | 'long' | 'eternal';
    /** 鮮明度 */
    vividness: number;
    /** 記憶に残る確率 */
    memorability: number;
    /** 実際の時間（ミリ秒） */
    realDuration: number;
    /** 発生時刻 */
    occurredAt: number;
    /** 覚醒後の解釈 */
    interpretation?: string;
}
/** 睡眠サイクル */
export interface SleepCycle {
    /** サイクル番号 */
    cycleNumber: number;
    /** 開始時刻 */
    startedAt: number;
    /** 終了時刻 */
    endedAt?: number;
    /** 段階の遷移履歴 */
    stageHistory: {
        stage: SleepStage;
        timestamp: number;
    }[];
    /** このサイクルで見た夢 */
    dreams: Dream[];
    /** サイクルの質 */
    quality: number;
}
/** 睡眠セッション */
export interface SleepSession {
    /** セッションID */
    id: string;
    /** 開始時刻 */
    startedAt: number;
    /** 終了時刻 */
    endedAt?: number;
    /** 睡眠サイクル */
    cycles: SleepCycle[];
    /** 現在の段階 */
    currentStage: SleepStage;
    /** 総夢数 */
    totalDreams: number;
    /** 覚醒時に覚えている夢 */
    rememberedDreams: Dream[];
    /** 睡眠の質 */
    quality: number;
    /** 処理された記憶数 */
    memoriesProcessed: number;
    /** 発見された関連性 */
    connectionsDiscovered: number;
    /** 目覚めの気分 */
    wakingMood?: string;
}
/** 記憶処理の結果 */
export interface MemoryProcessingResult {
    /** 統合された記憶のキー */
    consolidatedMemories: string[];
    /** 弱められた記憶のキー */
    weakenedMemories: string[];
    /** 発見された新しい関連性 */
    newConnections: {
        from: string;
        to: string;
        nature: string;
        strength: number;
    }[];
    /** 浮かび上がったテーマ */
    emergentThemes: string[];
}
/** 夢の素材（日中の記憶から） */
export interface DreamMaterial {
    /** 素材の種類 */
    type: 'episode' | 'emotion' | 'thought' | 'sensation' | 'desire';
    /** 内容 */
    content: string;
    /** 強度（夢に現れやすさ） */
    intensity: number;
    /** 未処理度（高いほど夢に現れやすい） */
    unprocessedLevel: number;
    /** 関連キーワード */
    keywords: string[];
}
/** 夢の素材からの影響 */
export interface DreamMaterialInfluence {
    places: string[];
    people: string[];
    objects: string[];
    emotions: string[];
    sounds: string[];
    sensations: string[];
    themes: string[];
    intensity: number;
}
/** 設定 */
export interface DreamPhaseConfig {
    /** 1サイクルの長さ（ミリ秒） */
    cycleLength: number;
    /** REMの割合 */
    remRatio: number;
    /** 夢を覚えている確率 */
    dreamRecallProbability: number;
    /** 基本夢生成確率（REM中） */
    baseDreamProbability: number;
    /** 悪夢確率（ストレス時） */
    nightmareProbability: number;
    /** 明晰夢確率 */
    lucidDreamProbability: number;
    /** 記憶統合率 */
    memoryConsolidationRate: number;
    /** 最大保存セッション数 */
    maxSessionHistory: number;
}
export declare class DreamPhase {
    private config;
    private yuragi;
    /** 現在の睡眠セッション */
    private currentSession?;
    /** 過去の睡眠セッション */
    private pastSessions;
    /** 夢の素材プール */
    private dreamMaterials;
    /** 最近処理した記憶のキー */
    private recentlyProcessedMemories;
    constructor(config?: Partial<DreamPhaseConfig>);
    /**
     * 睡眠を開始
     */
    startSleep(): SleepSession;
    /**
     * 睡眠段階を遷移
     */
    transitionToStage(newStage: SleepStage): void;
    /**
     * 新しい睡眠サイクルを開始
     */
    private startNewCycle;
    /**
     * 現在のサイクルを取得
     */
    private getCurrentCycle;
    /**
     * 睡眠を終了して起床
     */
    wakeUp(): SleepSession | null;
    /**
     * 睡眠の質を計算
     */
    private calculateSleepQuality;
    /**
     * 目覚めの気分を決定
     */
    private determineWakingMood;
    /**
     * 夢を生成（REM中に呼ばれる）
     */
    generateDream(stressLevel: number, dominantEmotion?: string, recentMemoryKeys?: string[]): Dream | null;
    /**
     * 夢の種類を決定
     */
    private determineDreamType;
    /**
     * 夢の要素を生成（日中の体験・感情・記憶と連動）
     */
    private generateDreamElements;
    /**
     * 日中の素材から夢の影響要素を抽出
     */
    private extractMaterialInfluence;
    /**
     * シーンと素材を融合
     */
    private blendSceneWithMaterial;
    /**
     * オブジェクトを夢の中のイメージに変形
     */
    private transformObjectForDream;
    /**
     * 夢のシンボルを生成（静的辞書にない場合）
     */
    private generateDreamSymbol;
    /**
     * 素材から夢の感情を選択
     */
    private selectDreamEmotionFromMaterials;
    /**
     * 音を夢の中のイメージに変形
     */
    private transformSoundForDream;
    /**
     * シーンカテゴリを選択
     */
    private selectSceneCategory;
    /**
     * 夢の感情を選択
     */
    private selectDreamEmotion;
    /**
     * 象徴的な意味を検索
     */
    private findSymbolicMeaning;
    /**
     * 夢の物語を構築（感情アーク付き）
     */
    private buildDreamNarrative;
    /**
     * 夢の感情トーンを計算
     */
    private calculateDreamEmotionalTone;
    /**
     * 夢の色を選択
     */
    private selectDreamColors;
    /**
     * 夢の音を選択
     */
    private selectDreamSounds;
    /**
     * 知覚される時間を決定
     */
    private determinePerceivedDuration;
    /**
     * 記憶に残りやすさを計算
     */
    private calculateMemorability;
    /**
     * 夢のタイトルを生成
     */
    private generateDreamTitle;
    private poeticObjectTitle;
    /**
     * 夢を解釈（覚醒後のsomuniaの内省）
     */
    private interpretDream;
    /**
     * 睡眠中の記憶処理をシミュレート
     */
    processMemories(memoryKeys: string[]): MemoryProcessingResult;
    /**
     * 夢の素材を追加
     */
    addDreamMaterial(material: DreamMaterial): void;
    /**
     * PixelWorldのインタラクション結果から夢の素材を自動生成
     */
    addExperienceMaterial(experience: {
        objectName: string;
        description: string;
        emotionalImpact: Array<{
            emotion: string;
            delta: number;
        }>;
        sensoryDetails: Array<{
            type: string;
            content: string;
        }>;
        triggersMemory: boolean;
        memoryContent: string | null;
    }): void;
    /**
     * 夢の素材をクリア（日中の終わりに）
     */
    clearDreamMaterials(): void;
    /**
     * 重み付きランダム選択
     */
    private weightedRandom;
    /**
     * IDを生成
     */
    private generateId;
    getCurrentSession(): SleepSession | undefined;
    getPastSessions(): SleepSession[];
    getRecentDreams(count?: number): Dream[];
    /**
     * 睡眠統計を取得
     */
    getSleepStatistics(): {
        totalSessions: number;
        averageSleepDuration: number;
        averageQuality: number;
        totalDreamsRemembered: number;
        mostCommonDreamTypes: {
            type: DreamType;
            count: number;
        }[];
        averageCyclesPerSleep: number;
    };
    serialize(): object;
    static deserialize(data: any): DreamPhase;
}
//# sourceMappingURL=DreamPhase.d.ts.map