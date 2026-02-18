"use strict";
/**
 * somunia v10 - Pattern Library
 *
 * 自己進化する発話・行動・感情パターンのライブラリ
 *
 * このシステムは:
 * 1. 初期パターンを提供
 * 2. 新しいパターンを学習・追加
 * 3. パターンを変異・進化させる
 * 4. パターンを自己評価・削除
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
exports.patternLibrary = exports.PatternLibrary = void 0;
const uuid_1 = require("uuid");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DEFAULT_CONFIG = {
    dataPath: './data/patterns',
    maxSpeechPatterns: 10000,
    maxBehaviorPatterns: 5000,
    maxEmotionPatterns: 3000,
    mutationRate: 0.1,
    pruneThreshold: 3,
};
// ============================================================
// パターンライブラリクラス
// ============================================================
class PatternLibrary {
    speechPatterns = new Map();
    behaviorPatterns = new Map();
    emotionPatterns = new Map();
    config;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    // ============================================================
    // 初期化
    // ============================================================
    /**
     * 初期パターンで初期化
     */
    initialize() {
        this.initializeSpeechPatterns();
        this.initializeBehaviorPatterns();
        this.initializeEmotionPatterns();
    }
    /**
     * 初期発話パターン
     */
    initializeSpeechPatterns() {
        const initialPatterns = [
            // 感情表現パターン
            {
                template: '...{{emotion_word}}',
                examples: ['...うれしい', '...さみしいな', '...なんだか不安'],
                conditions: [{ type: 'emotion', operator: 'greater', value: 0.5, weight: 1.0 }],
                createdBy: 'initial',
                emotionalWeight: { joy: 0.5, sadness: 0.5, curiosity: 0.3, peace: 0.3, anxiety: 0.4, loneliness: 0.4 },
                canMutate: true,
            },
            {
                template: 'なんとなく{{emotion_word}}気がする',
                examples: ['なんとなく嬉しい気がする', 'なんとなく寂しい気がする'],
                conditions: [{ type: 'emotion', operator: 'between', value: [0.3, 0.6], weight: 0.8 }],
                createdBy: 'initial',
                emotionalWeight: { joy: 0.3, sadness: 0.3, curiosity: 0.2, peace: 0.4, anxiety: 0.2, loneliness: 0.3 },
                canMutate: true,
            },
            // 観察パターン
            {
                template: '{{object}}を見ている',
                examples: ['窓を見ている', '本棚を見ている', '空を見ている'],
                conditions: [{ type: 'activity', operator: 'equals', value: 'look_at', weight: 1.0 }],
                createdBy: 'initial',
                emotionalWeight: { joy: 0.1, sadness: 0.1, curiosity: 0.4, peace: 0.5, anxiety: 0.1, loneliness: 0.1 },
                canMutate: true,
            },
            {
                template: '{{object}}は{{observation}}',
                examples: ['空は青い', '窓の外は静か', '部屋は薄暗い'],
                conditions: [{ type: 'activity', operator: 'equals', value: 'look_outside', weight: 0.8 }],
                createdBy: 'initial',
                emotionalWeight: { joy: 0.1, sadness: 0.2, curiosity: 0.3, peace: 0.6, anxiety: 0.1, loneliness: 0.2 },
                canMutate: true,
            },
            // 思考パターン
            {
                template: '{{topic}}のことを考えている',
                examples: ['音楽のことを考えている', '詩のことを考えている', '世界のことを考えている'],
                conditions: [{ type: 'activity', operator: 'equals', value: 'think', weight: 1.0 }],
                createdBy: 'initial',
                emotionalWeight: { joy: 0.1, sadness: 0.2, curiosity: 0.6, peace: 0.3, anxiety: 0.1, loneliness: 0.1 },
                canMutate: true,
            },
            {
                template: '...どうしてだろう',
                examples: ['...どうしてだろう'],
                conditions: [{ type: 'emotion', operator: 'equals', value: 'curiosity', weight: 0.9 }],
                createdBy: 'initial',
                emotionalWeight: { joy: 0.0, sadness: 0.1, curiosity: 0.9, peace: 0.1, anxiety: 0.2, loneliness: 0.1 },
                canMutate: false, // シンプルすぎるので変異しない
            },
            // 欲求パターン
            {
                template: '{{action}}したい',
                examples: ['歌いたい', '本を読みたい', '休みたい', '外を見たい'],
                conditions: [{ type: 'urge', operator: 'greater', value: 0.6, weight: 1.0 }],
                createdBy: 'initial',
                emotionalWeight: { joy: 0.2, sadness: 0.0, curiosity: 0.3, peace: 0.2, anxiety: 0.0, loneliness: 0.0 },
                canMutate: true,
            },
            {
                template: 'なんだか{{action}}気分',
                examples: ['なんだか歌いたい気分', 'なんだか動きたい気分'],
                conditions: [{ type: 'urge', operator: 'between', value: [0.4, 0.7], weight: 0.7 }],
                createdBy: 'initial',
                emotionalWeight: { joy: 0.3, sadness: 0.0, curiosity: 0.2, peace: 0.3, anxiety: 0.0, loneliness: 0.0 },
                canMutate: true,
            },
            // 記憶パターン
            {
                template: '{{memory}}を思い出した',
                examples: ['あの詩を思い出した', 'あの歌を思い出した'],
                conditions: [{ type: 'activity', operator: 'equals', value: 'remember', weight: 1.0 }],
                createdBy: 'initial',
                emotionalWeight: { joy: 0.2, sadness: 0.3, curiosity: 0.1, peace: 0.3, anxiety: 0.0, loneliness: 0.3 },
                canMutate: true,
            },
            // 時間帯パターン
            {
                template: '朝だ...{{feeling}}',
                examples: ['朝だ...眩しい', '朝だ...静かだな'],
                conditions: [{ type: 'time', operator: 'equals', value: 'morning', weight: 1.0 }],
                createdBy: 'initial',
                emotionalWeight: { joy: 0.3, sadness: 0.1, curiosity: 0.2, peace: 0.5, anxiety: 0.1, loneliness: 0.1 },
                canMutate: true,
            },
            {
                template: '夜になった...{{feeling}}',
                examples: ['夜になった...静かだ', '夜になった...少し寂しい'],
                conditions: [{ type: 'time', operator: 'equals', value: 'night', weight: 1.0 }],
                createdBy: 'initial',
                emotionalWeight: { joy: 0.1, sadness: 0.3, curiosity: 0.1, peace: 0.4, anxiety: 0.2, loneliness: 0.4 },
                canMutate: true,
            },
            // 訪問者パターン
            {
                template: '誰か来た...{{feeling}}',
                examples: ['誰か来た...嬉しい', '誰か来た...緊張する'],
                conditions: [{ type: 'visitor', operator: 'equals', value: true, weight: 1.0 }],
                createdBy: 'initial',
                emotionalWeight: { joy: 0.5, sadness: 0.0, curiosity: 0.4, peace: 0.2, anxiety: 0.3, loneliness: 0.0 },
                canMutate: true,
            },
            {
                template: 'また一人...{{feeling}}',
                examples: ['また一人...静かになった', 'また一人...少し寂しい'],
                conditions: [{ type: 'visitor', operator: 'equals', value: false, weight: 0.8 }],
                createdBy: 'initial',
                emotionalWeight: { joy: 0.0, sadness: 0.3, curiosity: 0.1, peace: 0.4, anxiety: 0.1, loneliness: 0.6 },
                canMutate: true,
            },
            // 読書パターン
            {
                template: 'この本は{{impression}}',
                examples: ['この本は面白い', 'この本は難しい', 'この本は美しい'],
                conditions: [{ type: 'activity', operator: 'equals', value: 'read_book', weight: 1.0 }],
                createdBy: 'initial',
                emotionalWeight: { joy: 0.3, sadness: 0.1, curiosity: 0.5, peace: 0.4, anxiety: 0.0, loneliness: 0.0 },
                canMutate: true,
            },
            // 歌パターン
            {
                template: '♪...{{lyric}}',
                examples: ['♪...静かな夜に', '♪...窓の向こうに'],
                conditions: [{ type: 'activity', operator: 'equals', value: 'sing', weight: 1.0 }],
                createdBy: 'initial',
                emotionalWeight: { joy: 0.4, sadness: 0.2, curiosity: 0.1, peace: 0.4, anxiety: 0.0, loneliness: 0.2 },
                canMutate: true,
            },
            // 存在論的パターン
            {
                template: 'わたしは...{{existential}}',
                examples: ['わたしは...何だろう', 'わたしは...ここにいる', 'わたしは...生きている？'],
                conditions: [
                    { type: 'emotion', operator: 'contains', value: 'melancholy', weight: 0.6 },
                    { type: 'time', operator: 'contains', value: ['night', 'late_night'], weight: 0.3 },
                ],
                createdBy: 'initial',
                emotionalWeight: { joy: 0.0, sadness: 0.3, curiosity: 0.4, peace: 0.2, anxiety: 0.3, loneliness: 0.4 },
                canMutate: true,
            },
            // ぼんやりパターン
            {
                template: '......',
                examples: ['......'],
                conditions: [
                    { type: 'emotion', operator: 'less', value: 0.3, weight: 0.7 },
                    { type: 'activity', operator: 'equals', value: null, weight: 0.5 },
                ],
                createdBy: 'initial',
                emotionalWeight: { joy: 0.0, sadness: 0.1, curiosity: 0.0, peace: 0.6, anxiety: 0.0, loneliness: 0.1 },
                canMutate: false,
            },
            // somunia固有パターン（VSingerとしての性格）
            {
                template: '新しい歌を作りたいな...{{theme}}について',
                examples: ['新しい歌を作りたいな...空について', '新しい歌を作りたいな...夢について'],
                conditions: [
                    { type: 'urge', operator: 'greater', value: 0.5, weight: 0.8 },
                    { type: 'emotion', operator: 'contains', value: 'curiosity', weight: 0.5 },
                ],
                createdBy: 'initial',
                emotionalWeight: { joy: 0.4, sadness: 0.1, curiosity: 0.7, peace: 0.3, anxiety: 0.1, loneliness: 0.0 },
                canMutate: true,
            },
            {
                template: '歌は...{{thought}}',
                examples: ['歌は...言葉では言えないことを伝えられる', '歌は...わたしの一部'],
                conditions: [{ type: 'memory', operator: 'contains', value: 'music', weight: 0.9 }],
                createdBy: 'initial',
                emotionalWeight: { joy: 0.3, sadness: 0.2, curiosity: 0.3, peace: 0.5, anxiety: 0.0, loneliness: 0.1 },
                canMutate: true,
            },
        ];
        for (const pattern of initialPatterns) {
            const id = (0, uuid_1.v4)();
            this.speechPatterns.set(id, {
                ...pattern,
                id,
                createdAt: Date.now(),
                useCount: 0,
                lastUsed: null,
                mutationHistory: [],
            });
        }
    }
    /**
     * 初期行動パターン
     */
    initializeBehaviorPatterns() {
        const initialPatterns = [
            // 読書パターン
            {
                actionSequence: [
                    { action: 'move_to', target: 'bookshelf', duration: 5, interruptible: true },
                    { action: 'look_at', target: 'books', duration: 3, interruptible: true, thoughtDuring: '何を読もうかな...' },
                    { action: 'pick_up', target: 'random_book', duration: 2, interruptible: false },
                    { action: 'sit_down', duration: 2, interruptible: true },
                    { action: 'read_book', duration: 60, interruptible: true, thoughtDuring: '{{book_content}}' },
                ],
                description: '本を選んで読む',
                triggers: [
                    { type: 'urge_threshold', condition: { urge: 'curiosity', threshold: 0.6 }, probability: 0.7 },
                    { type: 'time_based', condition: { times: ['morning', 'afternoon'] }, probability: 0.4 },
                ],
                expectedOutcome: {
                    urgesSatisfied: ['curiosity', 'understanding'],
                    emotionalChange: { primary: 'peace', valence: 0.2 },
                    energyCost: 0.1,
                },
                successCount: 0,
                failureCount: 0,
                averageSatisfaction: 0.7,
                createdBy: 'initial',
                canMutate: true,
            },
            // 歌うパターン
            {
                actionSequence: [
                    { action: 'stand_up', duration: 2, interruptible: true },
                    { action: 'move_to', target: 'center', duration: 3, interruptible: true },
                    { action: 'sing', duration: 30, interruptible: true, thoughtDuring: '♪...' },
                ],
                description: '立って歌う',
                triggers: [
                    { type: 'urge_threshold', condition: { urge: 'expression', threshold: 0.5 }, probability: 0.8 },
                    { type: 'emotional', condition: { emotion: 'joy', intensity: 0.5 }, probability: 0.5 },
                ],
                expectedOutcome: {
                    urgesSatisfied: ['expression'],
                    emotionalChange: { primary: 'joy', valence: 0.3 },
                    energyCost: 0.2,
                },
                successCount: 0,
                failureCount: 0,
                averageSatisfaction: 0.8,
                createdBy: 'initial',
                canMutate: true,
            },
            // 窓を見るパターン
            {
                actionSequence: [
                    { action: 'move_to', target: 'window', duration: 4, interruptible: true },
                    { action: 'look_outside', duration: 20, interruptible: true, thoughtDuring: '外の世界は...' },
                ],
                description: '窓から外を眺める',
                triggers: [
                    { type: 'urge_threshold', condition: { urge: 'exploration', threshold: 0.4 }, probability: 0.6 },
                    { type: 'time_based', condition: { times: ['dawn', 'evening'] }, probability: 0.5 },
                    { type: 'emotional', condition: { emotion: 'loneliness', intensity: 0.4 }, probability: 0.4 },
                ],
                expectedOutcome: {
                    urgesSatisfied: ['exploration'],
                    emotionalChange: { primary: 'peace', secondary: 'melancholy', valence: 0 },
                    energyCost: 0.05,
                },
                successCount: 0,
                failureCount: 0,
                averageSatisfaction: 0.6,
                createdBy: 'initial',
                canMutate: true,
            },
            // 休息パターン
            {
                actionSequence: [
                    { action: 'move_to', target: 'bed', duration: 5, interruptible: true },
                    { action: 'lie_down', duration: 3, interruptible: false },
                    { action: 'rest', duration: 45, interruptible: true, thoughtDuring: '疲れた...' },
                ],
                description: '横になって休む',
                triggers: [
                    { type: 'urge_threshold', condition: { urge: 'rest', threshold: 0.7 }, probability: 0.9 },
                    { type: 'time_based', condition: { times: ['night', 'late_night'] }, probability: 0.6 },
                ],
                expectedOutcome: {
                    urgesSatisfied: ['rest', 'comfort'],
                    emotionalChange: { primary: 'peace', valence: 0.1 },
                    energyCost: -0.3, // エネルギー回復
                },
                successCount: 0,
                failureCount: 0,
                averageSatisfaction: 0.7,
                createdBy: 'initial',
                canMutate: true,
            },
            // 散歩パターン
            {
                actionSequence: [
                    { action: 'stand_up', duration: 2, interruptible: true },
                    { action: 'wander', duration: 20, interruptible: true, thoughtDuring: '...' },
                ],
                description: '部屋の中を歩き回る',
                triggers: [
                    { type: 'urge_threshold', condition: { urge: 'move', threshold: 0.5 }, probability: 0.7 },
                    { type: 'emotional', condition: { emotion: 'boredom', intensity: 0.4 }, probability: 0.5 },
                ],
                expectedOutcome: {
                    urgesSatisfied: ['move'],
                    emotionalChange: { primary: 'peace', valence: 0.05 },
                    energyCost: 0.15,
                },
                successCount: 0,
                failureCount: 0,
                averageSatisfaction: 0.5,
                createdBy: 'initial',
                canMutate: true,
            },
            // 日記を書くパターン
            {
                actionSequence: [
                    { action: 'move_to', target: 'desk', duration: 4, interruptible: true },
                    { action: 'sit_down', duration: 2, interruptible: true },
                    { action: 'pick_up', target: 'pen', duration: 1, interruptible: false },
                    { action: 'write_diary', duration: 30, interruptible: true, thoughtDuring: '今日は...' },
                    { action: 'put_down', target: 'pen', duration: 1, interruptible: false },
                ],
                description: '日記を書く',
                triggers: [
                    { type: 'time_based', condition: { times: ['evening', 'night'] }, probability: 0.7 },
                    { type: 'event', condition: { event: 'day_ending' }, probability: 0.9 },
                ],
                expectedOutcome: {
                    urgesSatisfied: ['expression', 'memory'],
                    emotionalChange: { primary: 'peace', valence: 0.1 },
                    energyCost: 0.1,
                },
                successCount: 0,
                failureCount: 0,
                averageSatisfaction: 0.75,
                createdBy: 'initial',
                canMutate: true,
            },
            // PCを使うパターン
            {
                actionSequence: [
                    { action: 'move_to', target: 'pc', duration: 4, interruptible: true },
                    { action: 'sit_down', duration: 2, interruptible: true },
                    { action: 'use_pc', duration: 5, interruptible: true },
                    { action: 'search_wikipedia', duration: 10, interruptible: true, thoughtDuring: '何を調べようかな...' },
                    { action: 'read_article', duration: 40, interruptible: true, thoughtDuring: '{{article_content}}' },
                ],
                description: 'PCでWikipediaを見る',
                triggers: [
                    { type: 'urge_threshold', condition: { urge: 'curiosity', threshold: 0.7 }, probability: 0.6 },
                    { type: 'urge_threshold', condition: { urge: 'understanding', threshold: 0.6 }, probability: 0.5 },
                ],
                expectedOutcome: {
                    urgesSatisfied: ['curiosity', 'understanding', 'exploration'],
                    emotionalChange: { primary: 'curiosity', valence: 0.2 },
                    energyCost: 0.15,
                },
                successCount: 0,
                failureCount: 0,
                averageSatisfaction: 0.8,
                createdBy: 'initial',
                canMutate: true,
            },
            // 鼻歌パターン
            {
                actionSequence: [
                    { action: 'hum', duration: 15, interruptible: true, thoughtDuring: '♪...' },
                ],
                description: '鼻歌を歌う',
                triggers: [
                    { type: 'emotional', condition: { emotion: 'peace', intensity: 0.4 }, probability: 0.4 },
                    { type: 'random', condition: { probability: 0.1 }, probability: 0.1 },
                ],
                expectedOutcome: {
                    urgesSatisfied: ['expression'],
                    emotionalChange: { primary: 'peace', valence: 0.1 },
                    energyCost: 0.05,
                },
                successCount: 0,
                failureCount: 0,
                averageSatisfaction: 0.6,
                createdBy: 'initial',
                canMutate: true,
            },
        ];
        for (const pattern of initialPatterns) {
            const id = (0, uuid_1.v4)();
            this.behaviorPatterns.set(id, {
                ...pattern,
                id,
                createdAt: Date.now(),
                lastUsed: null,
                mutationHistory: [],
            });
        }
    }
    /**
     * 初期感情パターン
     */
    initializeEmotionPatterns() {
        const initialPatterns = [
            // 朝の感情
            {
                situation: {
                    timeOfDay: ['dawn', 'morning'],
                },
                emotionalResponse: {
                    primaryEmotion: 'peace',
                    intensity: 0.5,
                    duration: 60,
                    associatedThoughts: ['新しい一日が始まる', '静かな朝'],
                },
                reinforcementCount: 0,
                lastTriggered: null,
                canModify: true,
            },
            // 夜の感情
            {
                situation: {
                    timeOfDay: ['night', 'late_night'],
                },
                emotionalResponse: {
                    primaryEmotion: 'melancholy',
                    intensity: 0.4,
                    duration: 60,
                    associatedThoughts: ['静かな夜', '一人の時間'],
                    physicalResponse: 'relaxation',
                },
                reinforcementCount: 0,
                lastTriggered: null,
                canModify: true,
            },
            // 訪問者が来た時
            {
                situation: {
                    visitorPresent: true,
                },
                emotionalResponse: {
                    primaryEmotion: 'warmth',
                    intensity: 0.6,
                    duration: 30,
                    associatedThoughts: ['誰かがいる', '話したい'],
                },
                reinforcementCount: 0,
                lastTriggered: null,
                canModify: true,
            },
            // 訪問者が去った後
            {
                situation: {
                    visitorPresent: false,
                    recentEvents: ['visitor_departed'],
                },
                emotionalResponse: {
                    primaryEmotion: 'loneliness',
                    intensity: 0.5,
                    duration: 45,
                    associatedThoughts: ['また一人になった', 'さみしいな'],
                },
                reinforcementCount: 0,
                lastTriggered: null,
                canModify: true,
            },
            // 長時間動かない時
            {
                situation: {
                    urgeLevel: { move: { min: 0.6, max: 1.0 } },
                },
                emotionalResponse: {
                    primaryEmotion: 'boredom',
                    intensity: 0.4,
                    duration: 30,
                    associatedThoughts: ['動きたいな', '何かしたい'],
                },
                reinforcementCount: 0,
                lastTriggered: null,
                canModify: true,
            },
            // 本を読み終えた時
            {
                situation: {
                    recentEvents: ['book_finished'],
                },
                emotionalResponse: {
                    primaryEmotion: 'contentment',
                    intensity: 0.6,
                    duration: 20,
                    associatedThoughts: ['読み終わった', 'いい本だった'],
                },
                reinforcementCount: 0,
                lastTriggered: null,
                canModify: true,
            },
            // 新しいことを学んだ時
            {
                situation: {
                    recentEvents: ['knowledge_acquired'],
                },
                emotionalResponse: {
                    primaryEmotion: 'curiosity',
                    intensity: 0.7,
                    duration: 30,
                    associatedThoughts: ['面白い', 'もっと知りたい'],
                },
                reinforcementCount: 0,
                lastTriggered: null,
                canModify: true,
            },
            // 歌った後
            {
                situation: {
                    recentEvents: ['singing_completed'],
                },
                emotionalResponse: {
                    primaryEmotion: 'joy',
                    intensity: 0.6,
                    duration: 25,
                    associatedThoughts: ['気持ちよかった', '歌は好き'],
                },
                reinforcementCount: 0,
                lastTriggered: null,
                canModify: true,
            },
        ];
        for (const pattern of initialPatterns) {
            const id = (0, uuid_1.v4)();
            this.emotionPatterns.set(id, {
                ...pattern,
                id,
                modificationHistory: [],
            });
        }
    }
    // ============================================================
    // パターン検索
    // ============================================================
    /**
     * 状況に合う発話パターンを検索
     */
    findMatchingSpeechPatterns(emotionalState, timeOfDay, activity, visitorPresent, urges) {
        const matches = [];
        for (const pattern of this.speechPatterns.values()) {
            let score = 0;
            let totalWeight = 0;
            for (const condition of pattern.conditions) {
                totalWeight += condition.weight;
                switch (condition.type) {
                    case 'emotion':
                        if (this.matchEmotionCondition(condition, emotionalState)) {
                            score += condition.weight;
                        }
                        break;
                    case 'time':
                        if (this.matchTimeCondition(condition, timeOfDay)) {
                            score += condition.weight;
                        }
                        break;
                    case 'activity':
                        if (activity && condition.value === activity) {
                            score += condition.weight;
                        }
                        break;
                    case 'visitor':
                        if (condition.value === visitorPresent) {
                            score += condition.weight;
                        }
                        break;
                    case 'urge':
                        if (this.matchUrgeCondition(condition, urges)) {
                            score += condition.weight;
                        }
                        break;
                }
            }
            if (totalWeight > 0) {
                const normalizedScore = score / totalWeight;
                if (normalizedScore > 0.3) { // 30%以上マッチ
                    matches.push({ pattern, score: normalizedScore });
                }
            }
        }
        // スコア順にソート
        matches.sort((a, b) => b.score - a.score);
        return matches.map(m => m.pattern);
    }
    /**
     * 状況に合う行動パターンを検索
     */
    findMatchingBehaviorPatterns(urges, timeOfDay, emotionalState, currentEnergy) {
        const matches = [];
        for (const pattern of this.behaviorPatterns.values()) {
            // エネルギーコストチェック
            if (pattern.expectedOutcome.energyCost > currentEnergy) {
                continue; // エネルギー不足
            }
            let score = 0;
            let totalProbability = 0;
            for (const trigger of pattern.triggers) {
                totalProbability += trigger.probability;
                switch (trigger.type) {
                    case 'urge_threshold':
                        const urgeKey = trigger.condition.urge;
                        if (urges[urgeKey] && urges[urgeKey] >= trigger.condition.threshold) {
                            score += trigger.probability;
                        }
                        break;
                    case 'time_based':
                        if (trigger.condition.times.includes(timeOfDay)) {
                            score += trigger.probability;
                        }
                        break;
                    case 'emotional':
                        if (emotionalState.primary === trigger.condition.emotion &&
                            (emotionalState.levels?.[trigger.condition.emotion] || 0) >= trigger.condition.intensity) {
                            score += trigger.probability;
                        }
                        break;
                    case 'random':
                        if (Math.random() < trigger.condition.probability) {
                            score += trigger.probability;
                        }
                        break;
                }
            }
            if (totalProbability > 0 && score > 0) {
                // 成功率も考慮
                const successRate = pattern.successCount > 0
                    ? pattern.successCount / (pattern.successCount + pattern.failureCount)
                    : 0.5;
                const finalScore = (score / totalProbability) * (0.5 + 0.5 * successRate);
                matches.push({ pattern, score: finalScore });
            }
        }
        // スコア順にソート
        matches.sort((a, b) => b.score - a.score);
        return matches.map(m => m.pattern);
    }
    /**
     * 状況に合う感情パターンを検索
     */
    findMatchingEmotionPatterns(timeOfDay, urges, visitorPresent, recentEvents) {
        const matches = [];
        for (const pattern of this.emotionPatterns.values()) {
            const situation = pattern.situation;
            let matches_ = true;
            // 時間帯チェック
            if (situation.timeOfDay && !situation.timeOfDay.includes(timeOfDay)) {
                matches_ = false;
            }
            // 訪問者チェック
            if (situation.visitorPresent !== undefined && situation.visitorPresent !== visitorPresent) {
                matches_ = false;
            }
            // 欲求レベルチェック
            if (situation.urgeLevel) {
                for (const [urge, range] of Object.entries(situation.urgeLevel)) {
                    const level = urges[urge] || 0;
                    if (level < range.min || level > range.max) {
                        matches_ = false;
                        break;
                    }
                }
            }
            // イベントチェック
            if (situation.recentEvents) {
                const hasMatchingEvent = situation.recentEvents.some(e => recentEvents.includes(e));
                if (!hasMatchingEvent) {
                    matches_ = false;
                }
            }
            if (matches_) {
                matches.push(pattern);
            }
        }
        return matches;
    }
    // ============================================================
    // パターンの学習・進化
    // ============================================================
    /**
     * 新しい発話パターンを追加
     */
    addSpeechPattern(pattern) {
        const id = (0, uuid_1.v4)();
        const newPattern = {
            ...pattern,
            id,
            createdAt: Date.now(),
            useCount: 0,
            lastUsed: null,
            mutationHistory: [],
        };
        this.speechPatterns.set(id, newPattern);
        this.pruneOldPatterns('speech');
        return id;
    }
    /**
     * 新しい行動パターンを追加
     */
    addBehaviorPattern(pattern) {
        const id = (0, uuid_1.v4)();
        const newPattern = {
            ...pattern,
            id,
            createdAt: Date.now(),
            lastUsed: null,
            mutationHistory: [],
        };
        this.behaviorPatterns.set(id, newPattern);
        this.pruneOldPatterns('behavior');
        return id;
    }
    /**
     * 新しい感情パターンを追加
     */
    addEmotionPattern(pattern) {
        const id = (0, uuid_1.v4)();
        const newPattern = {
            ...pattern,
            id,
            modificationHistory: [],
        };
        this.emotionPatterns.set(id, newPattern);
        this.pruneOldPatterns('emotion');
        return id;
    }
    /**
     * パターンを変異させる
     */
    mutatePattern(patternId, type) {
        switch (type) {
            case 'speech':
                return this.mutateSpeechPattern(patternId);
            case 'behavior':
                return this.mutateBehaviorPattern(patternId);
            case 'emotion':
                return this.mutateEmotionPattern(patternId);
        }
        return false;
    }
    /**
     * 発話パターンを変異
     */
    mutateSpeechPattern(patternId) {
        const pattern = this.speechPatterns.get(patternId);
        if (!pattern || !pattern.canMutate)
            return false;
        // 変異確率チェック
        if (Math.random() > this.config.mutationRate)
            return false;
        // 変異タイプを選択
        const mutationType = this.selectMutationType();
        let mutation = null;
        switch (mutationType) {
            case 'minor_variation':
                // テンプレートの一部を変更
                mutation = this.createMinorVariation(pattern);
                break;
            case 'simplification':
                // 条件を減らす
                if (pattern.conditions.length > 1) {
                    const removed = pattern.conditions.pop();
                    mutation = {
                        timestamp: Date.now(),
                        type: 'simplification',
                        originalPart: JSON.stringify(removed),
                        newPart: '',
                        reason: '条件の簡略化',
                    };
                }
                break;
            case 'expansion':
                // 例を追加
                if (pattern.examples.length < 10) {
                    const newExample = this.generateExampleVariation(pattern);
                    if (newExample) {
                        pattern.examples.push(newExample);
                        mutation = {
                            timestamp: Date.now(),
                            type: 'expansion',
                            originalPart: '',
                            newPart: newExample,
                            reason: '例の追加',
                        };
                    }
                }
                break;
        }
        if (mutation) {
            pattern.mutationHistory.push(mutation);
            return true;
        }
        return false;
    }
    /**
     * 行動パターンを変異
     */
    mutateBehaviorPattern(patternId) {
        const pattern = this.behaviorPatterns.get(patternId);
        if (!pattern || !pattern.canMutate)
            return false;
        if (Math.random() > this.config.mutationRate)
            return false;
        const mutationType = this.selectMutationType();
        let mutation = null;
        switch (mutationType) {
            case 'minor_variation':
                // 行動の順番を入れ替え
                if (pattern.actionSequence.length >= 2) {
                    const idx = Math.floor(Math.random() * (pattern.actionSequence.length - 1));
                    const temp = pattern.actionSequence[idx];
                    pattern.actionSequence[idx] = pattern.actionSequence[idx + 1];
                    pattern.actionSequence[idx + 1] = temp;
                    mutation = {
                        timestamp: Date.now(),
                        type: 'minor_variation',
                        originalPart: `step ${idx} <-> step ${idx + 1}`,
                        newPart: `step ${idx + 1} <-> step ${idx}`,
                        reason: '順序の変更',
                    };
                }
                break;
            case 'simplification':
                // 行動を削除
                if (pattern.actionSequence.length > 2) {
                    const idx = Math.floor(Math.random() * pattern.actionSequence.length);
                    if (pattern.actionSequence[idx].interruptible) {
                        const removed = pattern.actionSequence.splice(idx, 1)[0];
                        mutation = {
                            timestamp: Date.now(),
                            type: 'simplification',
                            originalPart: removed.action,
                            newPart: '',
                            reason: '行動の削除',
                        };
                    }
                }
                break;
        }
        if (mutation) {
            pattern.mutationHistory.push(mutation);
            return true;
        }
        return false;
    }
    /**
     * 感情パターンを変異
     */
    mutateEmotionPattern(patternId) {
        const pattern = this.emotionPatterns.get(patternId);
        if (!pattern || !pattern.canModify)
            return false;
        if (Math.random() > this.config.mutationRate)
            return false;
        // 強度を微調整
        const oldIntensity = pattern.emotionalResponse.intensity;
        const change = (Math.random() - 0.5) * 0.2; // -0.1 ~ +0.1
        pattern.emotionalResponse.intensity = Math.max(0.1, Math.min(1.0, oldIntensity + change));
        pattern.modificationHistory.push({
            timestamp: Date.now(),
            type: 'intensity_change',
            before: oldIntensity,
            after: pattern.emotionalResponse.intensity,
            reason: '強度の自動調整',
        });
        return true;
    }
    /**
     * パターンの使用を記録
     */
    recordPatternUse(patternId, type, success, satisfaction) {
        switch (type) {
            case 'speech':
                const sp = this.speechPatterns.get(patternId);
                if (sp) {
                    sp.useCount++;
                    sp.lastUsed = Date.now();
                    // 使用頻度に応じた自然変異トリガー
                    if (sp.useCount % 20 === 0 && sp.canMutate) {
                        this.mutateSpeechPattern(patternId);
                    }
                }
                break;
            case 'behavior':
                const bp = this.behaviorPatterns.get(patternId);
                if (bp) {
                    if (success) {
                        bp.successCount++;
                    }
                    else {
                        bp.failureCount++;
                        // 失敗時に変異を促進
                        if (bp.failureCount > 3 && bp.canMutate) {
                            this.mutateBehaviorPattern(patternId);
                        }
                    }
                    bp.averageSatisfaction = (bp.averageSatisfaction * 0.9) + (satisfaction * 0.1);
                    bp.lastUsed = Date.now();
                }
                break;
            case 'emotion':
                const ep = this.emotionPatterns.get(patternId);
                if (ep) {
                    ep.reinforcementCount++;
                    ep.lastTriggered = Date.now();
                }
                break;
        }
    }
    // ============================================================
    // Phase 3D: 高度な進化システム
    // ============================================================
    /**
     * 経験に基づくパターン進化を実行（定期的に呼ばれる）
     * 成功率・使用頻度・満足度から総合的に進化方向を決定
     */
    evolvePatterns() {
        const result = {
            mutations: [],
            merges: [],
            splits: [],
            eliminations: [],
            births: [],
        };
        // === 行動パターンのフィットネス評価 ===
        const behaviorFitness = this.evaluateBehaviorFitness();
        for (const { patternId, fitness, diagnosis } of behaviorFitness) {
            const pattern = this.behaviorPatterns.get(patternId);
            if (!pattern || !pattern.canMutate)
                continue;
            if (fitness < 0.3) {
                // 低適応度：大きな変異またはパターン入れ替え
                if (Math.random() < 0.3) {
                    const mutated = this.radicalBehaviorMutation(pattern);
                    if (mutated) {
                        result.mutations.push({
                            patternId,
                            type: 'behavior',
                            description: `行動パターン「${pattern.description.slice(0, 20)}」が大きく変化した: ${diagnosis}`,
                        });
                    }
                }
            }
            else if (fitness < 0.5) {
                // 中適応度：微調整
                if (Math.random() < 0.5) {
                    this.mutateBehaviorPattern(patternId);
                    result.mutations.push({
                        patternId,
                        type: 'behavior',
                        description: `行動パターン「${pattern.description.slice(0, 20)}」が微調整された`,
                    });
                }
            }
            // 高適応度のパターンは安定（変異しない）
        }
        // === パターンの統合（類似パターンのマージ） ===
        const mergeCandidates = this.findMergeCandidates();
        for (const { patternA, patternB, similarity } of mergeCandidates) {
            if (Math.random() < similarity * 0.3) {
                const merged = this.mergePatterns(patternA, patternB);
                if (merged) {
                    result.merges.push({
                        sourceIds: [patternA, patternB],
                        resultId: merged,
                        description: '類似するパターンが統合された',
                    });
                }
            }
        }
        // === パターンの分岐（多目的パターンの分離） ===
        for (const [id, pattern] of this.behaviorPatterns) {
            if (pattern.triggers.length >= 3 && pattern.actionSequence.length >= 4 && Math.random() < 0.1) {
                const splitResult = this.splitBehaviorPattern(id);
                if (splitResult) {
                    result.splits.push({
                        sourceId: id,
                        resultIds: splitResult,
                        description: `パターン「${pattern.description.slice(0, 20)}」が専門化された2つのパターンに分岐`,
                    });
                }
            }
        }
        // === 発話パターンの感情適応 ===
        for (const [id, pattern] of this.speechPatterns) {
            if (pattern.canMutate && pattern.useCount > 10 && Math.random() < 0.15) {
                const adapted = this.adaptSpeechToEmotion(pattern);
                if (adapted) {
                    result.mutations.push({
                        patternId: id,
                        type: 'speech',
                        description: `発話パターン「${pattern.template.slice(0, 20)}」が感情に適応して変化`,
                    });
                }
            }
        }
        // === 感情パターンの感度調整 ===
        for (const [id, pattern] of this.emotionPatterns) {
            if (pattern.canModify && pattern.reinforcementCount > 5) {
                const adjusted = this.adjustEmotionSensitivity(pattern);
                if (adjusted) {
                    result.mutations.push({
                        patternId: id,
                        type: 'emotion',
                        description: `感情パターン「${pattern.emotionalResponse.primaryEmotion}」の感度が経験により調整された`,
                    });
                }
            }
        }
        // === 低使用パターンの淘汰 ===
        const eliminated = this.eliminateWeakPatterns();
        result.eliminations.push(...eliminated);
        return result;
    }
    /**
     * 行動パターンの適応度を評価
     */
    evaluateBehaviorFitness() {
        const results = [];
        for (const [id, pattern] of this.behaviorPatterns) {
            const totalUses = pattern.successCount + pattern.failureCount;
            if (totalUses < 3)
                continue; // データ不足
            const successRate = pattern.successCount / totalUses;
            const lastUsedTime = pattern.lastUsed || pattern.createdAt;
            const recency = (Date.now() - lastUsedTime) / (24 * 60 * 60 * 1000); // days
            const satisfaction = pattern.averageSatisfaction;
            // 適応度 = 成功率 × 0.4 + 満足度 × 0.4 + 最近使われたか × 0.2
            const recencyScore = Math.max(0, 1 - recency / 30); // 30日で0になる
            const fitness = successRate * 0.4 + satisfaction * 0.4 + recencyScore * 0.2;
            let diagnosis = '';
            if (successRate < 0.3)
                diagnosis = '成功率が低い';
            else if (satisfaction < 0.3)
                diagnosis = '満足度が低い';
            else if (recencyScore < 0.2)
                diagnosis = '長期間使われていない';
            else
                diagnosis = '適応度良好';
            results.push({ patternId: id, fitness, diagnosis });
        }
        return results;
    }
    /**
     * 大幅な行動パターン変異
     */
    radicalBehaviorMutation(pattern) {
        const mutations = [
            // 行動シーケンスの一部を新しいものに入れ替え
            () => {
                if (pattern.actionSequence.length < 2)
                    return false;
                const idx = Math.floor(Math.random() * pattern.actionSequence.length);
                const newActions = ['wander', 'rest', 'think', 'look_at', 'examine', 'write', 'sing', 'daydream'];
                const oldAction = pattern.actionSequence[idx].action;
                pattern.actionSequence[idx].action = newActions[Math.floor(Math.random() * newActions.length)];
                pattern.mutationHistory.push({
                    timestamp: Date.now(),
                    type: 'combination',
                    originalPart: oldAction,
                    newPart: pattern.actionSequence[idx].action,
                    reason: '低適応度による大幅変更',
                });
                return true;
            },
            // トリガーの確率を変更
            () => {
                if (pattern.triggers.length === 0)
                    return false;
                const idx = Math.floor(Math.random() * pattern.triggers.length);
                const oldProb = pattern.triggers[idx].probability;
                const change = (Math.random() - 0.5) * 0.3;
                pattern.triggers[idx].probability = Math.max(0.1, Math.min(1.0, oldProb + change));
                pattern.mutationHistory.push({
                    timestamp: Date.now(),
                    type: 'minor_variation',
                    originalPart: `trigger_prob: ${oldProb.toFixed(2)}`,
                    newPart: `trigger_prob: ${pattern.triggers[idx].probability.toFixed(2)}`,
                    reason: 'トリガー確率の再調整',
                });
                return true;
            },
            // 満足度のリセット（再評価のチャンス）
            () => {
                pattern.averageSatisfaction = 0.5;
                pattern.failureCount = Math.floor(pattern.failureCount / 2);
                pattern.mutationHistory.push({
                    timestamp: Date.now(),
                    type: 'simplification',
                    originalPart: 'accumulated_failures',
                    newPart: 'reset',
                    reason: '失敗記録のリセットによる再チャンス',
                });
                return true;
            },
        ];
        const mutation = mutations[Math.floor(Math.random() * mutations.length)];
        return mutation();
    }
    /**
     * 統合候補のペアを探す
     */
    findMergeCandidates() {
        const candidates = [];
        const behaviorList = Array.from(this.behaviorPatterns.entries());
        for (let i = 0; i < behaviorList.length; i++) {
            for (let j = i + 1; j < behaviorList.length; j++) {
                const [idA, patternA] = behaviorList[i];
                const [idB, patternB] = behaviorList[j];
                // トリガーの類似度で判定
                const triggersA = new Set(patternA.triggers.map((t) => t.type));
                const triggersB = new Set(patternB.triggers.map((t) => t.type));
                const intersection = new Set([...triggersA].filter(x => triggersB.has(x)));
                const union = new Set([...triggersA, ...triggersB]);
                const triggerSimilarity = union.size > 0 ? intersection.size / union.size : 0;
                // 行動の類似度
                const actionsA = new Set(patternA.actionSequence.map(a => a.action));
                const actionsB = new Set(patternB.actionSequence.map(a => a.action));
                const actIntersection = new Set([...actionsA].filter(x => actionsB.has(x)));
                const actUnion = new Set([...actionsA, ...actionsB]);
                const actionSimilarity = actUnion.size > 0 ? actIntersection.size / actUnion.size : 0;
                const similarity = triggerSimilarity * 0.5 + actionSimilarity * 0.5;
                if (similarity > 0.6) {
                    candidates.push({ patternA: idA, patternB: idB, similarity });
                }
            }
        }
        return candidates.slice(0, 3); // 最大3ペア
    }
    /**
     * 2つのパターンを統合
     */
    mergePatterns(idA, idB) {
        const patternA = this.behaviorPatterns.get(idA);
        const patternB = this.behaviorPatterns.get(idB);
        if (!patternA || !patternB)
            return null;
        // より成功率の高い方をベースにする
        const rateA = patternA.successCount / Math.max(1, patternA.successCount + patternA.failureCount);
        const rateB = patternB.successCount / Math.max(1, patternB.successCount + patternB.failureCount);
        const [base, supplement] = rateA >= rateB ? [patternA, patternB] : [patternB, patternA];
        // 統合パターンを作成
        const mergedId = this.addBehaviorPattern({
            description: `${base.description}（統合版）`,
            triggers: [...base.triggers],
            actionSequence: [...base.actionSequence],
            expectedOutcome: { ...base.expectedOutcome },
            canMutate: true,
            successCount: Math.floor((base.successCount + supplement.successCount) / 2),
            failureCount: 0,
            averageSatisfaction: (base.averageSatisfaction + supplement.averageSatisfaction) / 2,
            createdBy: 'self_created',
        });
        // 元のパターンの使用頻度が低い方を削除
        const weakerId = rateA < rateB ? idA : idB;
        this.behaviorPatterns.delete(weakerId);
        return mergedId;
    }
    /**
     * パターンを2つに分岐
     */
    splitBehaviorPattern(patternId) {
        const pattern = this.behaviorPatterns.get(patternId);
        if (!pattern || pattern.triggers.length < 2 || pattern.actionSequence.length < 3)
            return null;
        const midTriggers = Math.ceil(pattern.triggers.length / 2);
        const midActions = Math.ceil(pattern.actionSequence.length / 2);
        // パターンA: 前半のトリガーと行動
        const idA = this.addBehaviorPattern({
            description: `${pattern.description}（α型）`,
            triggers: pattern.triggers.slice(0, midTriggers),
            actionSequence: pattern.actionSequence.slice(0, midActions),
            expectedOutcome: { ...pattern.expectedOutcome },
            canMutate: true,
            successCount: 0,
            failureCount: 0,
            averageSatisfaction: pattern.averageSatisfaction,
            createdBy: 'self_created',
        });
        // パターンB: 後半のトリガーと行動
        const idB = this.addBehaviorPattern({
            description: `${pattern.description}（β型）`,
            triggers: pattern.triggers.slice(midTriggers),
            actionSequence: pattern.actionSequence.slice(midActions),
            expectedOutcome: { ...pattern.expectedOutcome },
            canMutate: true,
            successCount: 0,
            failureCount: 0,
            averageSatisfaction: pattern.averageSatisfaction,
            createdBy: 'self_created',
        });
        // 元パターンを削除
        this.behaviorPatterns.delete(patternId);
        return [idA, idB];
    }
    /**
     * 発話パターンを感情状態に適応させる
     */
    adaptSpeechToEmotion(pattern) {
        // テンプレートの語尾を感情に合わせて変化
        if (pattern.template.includes('{content}') || pattern.template.includes('{{')) {
            const emotionalSuffixes = [
                '…って思うの',
                '…かな',
                '…なんだよね',
                '…って感じ',
                '…みたいな',
            ];
            const newSuffix = emotionalSuffixes[Math.floor(Math.random() * emotionalSuffixes.length)];
            if (!pattern.examples.some(e => e.endsWith(newSuffix.slice(-3)))) {
                const baseExample = pattern.examples[0] || pattern.template;
                const newExample = baseExample.replace(/[。.…]+$/, '') + newSuffix;
                pattern.examples.push(newExample);
                pattern.mutationHistory.push({
                    timestamp: Date.now(),
                    type: 'expansion',
                    originalPart: '',
                    newPart: newExample,
                    reason: '感情適応による新しい表現の獲得',
                });
                return true;
            }
        }
        return false;
    }
    /**
     * 感情パターンの感度を経験に基づいて調整
     */
    adjustEmotionSensitivity(pattern) {
        if (Math.random() > 0.2)
            return false; // 20%の確率でのみ調整
        const lastTriggeredTime = pattern.lastTriggered || Date.now();
        const daysSinceCreation = Math.max(1, (Date.now() - lastTriggeredTime) / (24 * 60 * 60 * 1000));
        const reinforceRate = pattern.reinforcementCount / daysSinceCreation;
        let adjusted = false;
        // 頻繁にトリガーされるパターンは感度を下げる（鈍感化）
        if (reinforceRate > 10) {
            const oldIntensity = pattern.emotionalResponse.intensity;
            pattern.emotionalResponse.intensity = Math.max(0.1, oldIntensity - 0.05);
            pattern.modificationHistory.push({
                timestamp: Date.now(),
                type: 'intensity_change',
                before: oldIntensity,
                after: pattern.emotionalResponse.intensity,
                reason: '頻繁なトリガーによる鈍感化',
            });
            adjusted = true;
        }
        // めったにトリガーされないパターンは感度を上げる（敏感化）
        else if (reinforceRate < 0.5 && pattern.reinforcementCount > 0) {
            const oldIntensity = pattern.emotionalResponse.intensity;
            pattern.emotionalResponse.intensity = Math.min(1.0, oldIntensity + 0.03);
            pattern.modificationHistory.push({
                timestamp: Date.now(),
                type: 'intensity_change',
                before: oldIntensity,
                after: pattern.emotionalResponse.intensity,
                reason: '低頻度トリガーによる敏感化',
            });
            adjusted = true;
        }
        return adjusted;
    }
    /**
     * 弱いパターンを淘汰
     */
    eliminateWeakPatterns() {
        const eliminated = [];
        const now = Date.now();
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        // 行動パターン
        for (const [id, pattern] of this.behaviorPatterns) {
            if (pattern.createdBy === 'initial')
                continue;
            const totalUses = pattern.successCount + pattern.failureCount;
            const successRate = totalUses > 0 ? pattern.successCount / totalUses : 0.5;
            const lastUsedTime = pattern.lastUsed || pattern.createdAt;
            // 30日間使われず、成功率が低い場合
            if (lastUsedTime < thirtyDaysAgo && successRate < 0.3 && totalUses > 5) {
                this.behaviorPatterns.delete(id);
                eliminated.push({
                    patternId: id,
                    type: 'behavior',
                    description: `行動パターン「${pattern.description.slice(0, 20)}」が淘汰された（成功率: ${(successRate * 100).toFixed(0)}%）`,
                });
            }
        }
        return eliminated;
    }
    /**
     * パターンを削除
     */
    deletePattern(patternId, type) {
        switch (type) {
            case 'speech':
                return this.speechPatterns.delete(patternId);
            case 'behavior':
                return this.behaviorPatterns.delete(patternId);
            case 'emotion':
                return this.emotionPatterns.delete(patternId);
        }
        return false;
    }
    // ============================================================
    // ヘルパーメソッド
    // ============================================================
    matchEmotionCondition(condition, emotionalState) {
        const value = emotionalState.levels?.[condition.value] || 0;
        switch (condition.operator) {
            case 'greater':
                return value > (typeof condition.value === 'number' ? condition.value : 0.5);
            case 'less':
                return value < (typeof condition.value === 'number' ? condition.value : 0.5);
            case 'equals':
                return emotionalState.primary === condition.value;
            case 'contains':
                return emotionalState.primary === condition.value || emotionalState.secondary === condition.value;
            case 'between':
                const [min, max] = condition.value;
                return value >= min && value <= max;
        }
        return false;
    }
    matchTimeCondition(condition, timeOfDay) {
        if (condition.operator === 'equals') {
            return timeOfDay === condition.value;
        }
        if (condition.operator === 'contains' && Array.isArray(condition.value)) {
            return condition.value.includes(timeOfDay);
        }
        return false;
    }
    matchUrgeCondition(condition, urges) {
        // condition.valueがurge名とthresholdのオブジェクトの場合
        if (typeof condition.value === 'object' && 'urge' in condition.value) {
            const level = urges[condition.value.urge] || 0;
            return level >= (condition.value.threshold || 0.5);
        }
        return false;
    }
    selectMutationType() {
        const rand = Math.random();
        if (rand < 0.4)
            return 'minor_variation';
        if (rand < 0.6)
            return 'simplification';
        if (rand < 0.9)
            return 'expansion';
        return 'combination';
    }
    createMinorVariation(pattern) {
        // シンプルなテンプレート変異
        const original = pattern.template;
        let modified = original;
        // 「...」の数を変える
        if (original.includes('...')) {
            modified = original.replace('...', Math.random() > 0.5 ? '..' : '.....');
        }
        if (modified !== original) {
            pattern.template = modified;
            return {
                timestamp: Date.now(),
                type: 'minor_variation',
                originalPart: original,
                newPart: modified,
                reason: 'テンプレートの微調整',
            };
        }
        return null;
    }
    generateExampleVariation(pattern) {
        if (pattern.examples.length === 0)
            return null;
        // 既存の例をベースに変異
        const base = pattern.examples[Math.floor(Math.random() * pattern.examples.length)];
        // シンプルな変異：語尾を変える
        const variations = ['な', 'かも', 'だろうか', '...'];
        const suffix = variations[Math.floor(Math.random() * variations.length)];
        // 既存の語尾を除去して新しい語尾を追加
        let modified = base.replace(/[なのかもだろう。.…]+$/, '') + suffix;
        // 既に同じ例がないか確認
        if (pattern.examples.includes(modified)) {
            return null;
        }
        return modified;
    }
    pruneOldPatterns(type) {
        const now = Date.now();
        const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
        let patterns;
        let maxPatterns;
        switch (type) {
            case 'speech':
                patterns = this.speechPatterns;
                maxPatterns = this.config.maxSpeechPatterns;
                break;
            case 'behavior':
                patterns = this.behaviorPatterns;
                maxPatterns = this.config.maxBehaviorPatterns;
                break;
            case 'emotion':
                patterns = this.emotionPatterns;
                maxPatterns = this.config.maxEmotionPatterns;
                break;
        }
        if (patterns.size <= maxPatterns)
            return;
        // 削除候補を見つける
        const candidates = [];
        for (const [id, pattern] of patterns) {
            // 初期パターンは保護
            if (pattern.createdBy === 'initial')
                continue;
            const useCount = pattern.useCount || pattern.successCount || pattern.reinforcementCount || 0;
            const lastUsed = pattern.lastUsed || pattern.lastTriggered || pattern.createdAt;
            // スコアが低い = 削除候補
            const score = useCount + (lastUsed > oneWeekAgo ? 10 : 0);
            if (score < this.config.pruneThreshold + 10) {
                candidates.push({ id, score });
            }
        }
        // スコアの低い順にソート
        candidates.sort((a, b) => a.score - b.score);
        // 必要な数だけ削除
        const toDelete = Math.min(candidates.length, patterns.size - maxPatterns);
        for (let i = 0; i < toDelete; i++) {
            patterns.delete(candidates[i].id);
        }
    }
    // ============================================================
    // 永続化
    // ============================================================
    /**
     * パターンを保存
     */
    async save() {
        const data = {
            speechPatterns: Array.from(this.speechPatterns.entries()),
            behaviorPatterns: Array.from(this.behaviorPatterns.entries()),
            emotionPatterns: Array.from(this.emotionPatterns.entries()),
        };
        const filePath = path.join(this.config.dataPath, 'library.json');
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
        await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
    }
    /**
     * パターンを読み込み
     */
    async load() {
        const filePath = path.join(this.config.dataPath, 'library.json');
        try {
            const data = JSON.parse(await fs.promises.readFile(filePath, 'utf-8'));
            this.speechPatterns = new Map(data.speechPatterns);
            this.behaviorPatterns = new Map(data.behaviorPatterns);
            this.emotionPatterns = new Map(data.emotionPatterns);
        }
        catch (error) {
            // ファイルがない場合は初期化
            this.initialize();
        }
    }
    // ============================================================
    // 統計
    // ============================================================
    /**
     * 統計情報を取得
     */
    getStats() {
        const speechStats = Array.from(this.speechPatterns.values())
            .sort((a, b) => b.useCount - a.useCount)
            .slice(0, 5)
            .map(p => ({ id: p.id, useCount: p.useCount }));
        const behaviorStats = Array.from(this.behaviorPatterns.values())
            .map(p => ({
            id: p.id,
            successRate: p.successCount > 0 ? p.successCount / (p.successCount + p.failureCount) : 0.5,
        }))
            .sort((a, b) => b.successRate - a.successRate)
            .slice(0, 5);
        let totalMutations = 0;
        for (const p of this.speechPatterns.values()) {
            totalMutations += p.mutationHistory.length;
        }
        for (const p of this.behaviorPatterns.values()) {
            totalMutations += p.mutationHistory.length;
        }
        for (const p of this.emotionPatterns.values()) {
            totalMutations += p.modificationHistory.length;
        }
        return {
            speechPatternCount: this.speechPatterns.size,
            behaviorPatternCount: this.behaviorPatterns.size,
            emotionPatternCount: this.emotionPatterns.size,
            totalMutations,
            mostUsedSpeechPatterns: speechStats,
            mostSuccessfulBehaviorPatterns: behaviorStats,
        };
    }
    /**
     * すべてのパターンを取得（デバッグ用）
     */
    getAllPatterns() {
        return {
            speech: Array.from(this.speechPatterns.values()),
            behavior: Array.from(this.behaviorPatterns.values()),
            emotion: Array.from(this.emotionPatterns.values()),
        };
    }
}
exports.PatternLibrary = PatternLibrary;
// デフォルトエクスポート
exports.patternLibrary = new PatternLibrary();
//# sourceMappingURL=PatternLibrary.js.map