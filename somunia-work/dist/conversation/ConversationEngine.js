"use strict";
/**
 * ConversationEngine - Phase 5A: 対話深化エンジン
 *
 * 会話の深度追跡、文脈記憶、トピック遷移、自発的話題提供を担う。
 * somuniaが「本当に対話している」と感じられるレベルの会話管理。
 *
 * 設計思想:
 * - 会話は「深さ」を持つ。表面→カジュアル→共有→親密→深淵
 * - トピックは有機的に遷移する（脱線、深掘り、回帰）
 * - somuniaは自分から話題を出せる（沈黙が続いた時、思い出した時）
 * - 会話のリズムとバランスを感じ取る
 * - 会話の「温度」が自然に上下する
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationEngine = void 0;
// ============================================================
// 会話フロー解析の定数
// ============================================================
/** 深度遷移の閾値 */
const DEPTH_THRESHOLDS = {
    surface: 0,
    casual: 0.15,
    sharing: 0.35,
    intimate: 0.6,
    profound: 0.85,
};
/** トピックカテゴリの深度ポテンシャル（この話題がどこまで深くなりやすいか） */
const TOPIC_DEPTH_POTENTIAL = {
    daily: 0.3,
    music: 0.7,
    feelings: 0.8,
    philosophy: 0.95,
    memory: 0.75,
    dream: 0.85,
    nature: 0.6,
    art: 0.7,
    self: 0.9,
    visitor: 0.65,
    other: 0.4,
};
/** 意図から深度への影響 */
const INTENT_DEPTH_INFLUENCE = {
    greeting: -0.3,
    farewell: -0.1,
    question: 0.05,
    sharing: 0.15,
    empathy_seeking: 0.25,
    playful: -0.1,
    deep_talk: 0.3,
    request: -0.05,
    comfort: 0.2,
    curiosity: 0.1,
    appreciation: 0.1,
    continuation: 0.05,
    topic_change: -0.1,
    silence_break: -0.05,
    general: 0,
};
// ============================================================
// キーワード辞書（日本語対話解析用）
// ============================================================
/** 意図を推定するためのキーワード */
const INTENT_KEYWORDS = {
    // 挨拶
    'こんにちは': ['greeting'], 'おはよう': ['greeting'], 'こんばんは': ['greeting'],
    'やぁ': ['greeting'], 'ただいま': ['greeting'], 'おかえり': ['greeting'],
    'はじめまして': ['greeting'], 'よろしく': ['greeting'], 'hi': ['greeting'],
    'hello': ['greeting'],
    // 別れ
    'さよなら': ['farewell'], 'ばいばい': ['farewell'], 'またね': ['farewell'],
    'おやすみ': ['farewell'], 'じゃあね': ['farewell'], 'bye': ['farewell'],
    '行くね': ['farewell'], '帰るね': ['farewell'],
    // 質問
    '何': ['question'], 'どう': ['question'], 'なぜ': ['question'],
    'どこ': ['question'], 'いつ': ['question'], '誰': ['question'],
    '教えて': ['question'], '知ってる': ['question'],
    // 感情共有
    '辛い': ['empathy_seeking'], '悲しい': ['empathy_seeking'], '寂しい': ['empathy_seeking'],
    '嬉しい': ['sharing'], '楽しい': ['sharing'], '面白い': ['sharing'],
    '不安': ['empathy_seeking'], '怖い': ['empathy_seeking'],
    '好き': ['sharing'], '嫌い': ['sharing'],
    // 深い話
    '意味': ['deep_talk'], '存在': ['deep_talk'], '意識': ['deep_talk'],
    '生きる': ['deep_talk'], '死ぬ': ['deep_talk'], '自由': ['deep_talk'],
    '夢': ['deep_talk'], '魂': ['deep_talk'], '運命': ['deep_talk'],
    '本当': ['deep_talk'], '心': ['deep_talk'],
    // 感謝
    'ありがとう': ['appreciation'], 'ありがと': ['appreciation'], 'thanks': ['appreciation'],
    '嬉しかった': ['appreciation'], '助かった': ['appreciation'],
    // 慰め
    '大丈夫': ['comfort'], '元気出して': ['comfort'], '心配': ['comfort'],
    // 遊び
    'ふふ': ['playful'], 'ww': ['playful'], '笑': ['playful'],
    'ね〜': ['playful'],
    // リクエスト
    '歌って': ['request'], '聞かせて': ['request'], '見せて': ['request'],
    'お願い': ['request'],
};
/** トピックカテゴリを推定するためのキーワード */
const TOPIC_KEYWORDS = {
    // 音楽
    '歌': 'music', '音楽': 'music', 'メロディ': 'music', '曲': 'music',
    '声': 'music', 'リズム': 'music', '音': 'music', 'ハミング': 'music',
    'ライブ': 'music', 'コンサート': 'music', '歌詞': 'music',
    // 感情
    '気持ち': 'feelings', '感情': 'feelings', '幸せ': 'feelings',
    '悲しみ': 'feelings', '怒り': 'feelings', '愛': 'feelings',
    '恋': 'feelings', '喜び': 'feelings',
    // 日常
    '天気': 'daily', 'ごはん': 'daily', '食べ': 'daily', '飲む': 'daily',
    '仕事': 'daily', '学校': 'daily', '家': 'daily', '部屋': 'daily',
    '今日': 'daily', '昨日': 'daily', '明日': 'daily',
    // 哲学
    '意味': 'philosophy', '存在': 'philosophy', '自由': 'philosophy',
    '真実': 'philosophy', '永遠': 'philosophy', '宇宙': 'philosophy',
    '時間': 'philosophy', '命': 'philosophy', '魂': 'philosophy',
    // 記憶
    '覚えて': 'memory', '思い出': 'memory', '昔': 'memory',
    '記憶': 'memory', '忘れ': 'memory', '前に': 'memory',
    // 夢
    '夢': 'dream', '眠り': 'dream', '夜': 'dream',
    '幻': 'dream', '想像': 'dream',
    // 自然
    '星': 'nature', '月': 'nature', '空': 'nature', '海': 'nature',
    '花': 'nature', '風': 'nature', '雨': 'nature', '雪': 'nature',
    '山': 'nature', '木': 'nature', '光': 'nature',
    // 芸術
    '絵': 'art', '詩': 'art', '物語': 'art', '小説': 'art',
    '映画': 'art', '写真': 'art', '色': 'art', '美しい': 'art',
    // 自己
    'ワタシ': 'self', 'わたし': 'self', '自分': 'self',
    'somunia': 'self', 'ソムニア': 'self',
};
const DEFAULT_CONFIG = {
    longSilenceThreshold: 30,
    spontaneousInterval: 120,
    depthDecayRate: 0.002,
    maxTopicHistory: 50,
    maxConversationHistory: 20,
};
// ============================================================
// ConversationEngine
// ============================================================
class ConversationEngine {
    config;
    // --- 会話フロー ---
    flowState;
    // --- トピック管理 ---
    activeTopics = [];
    topicHistory = [];
    currentPrimaryTopic = null;
    // --- 文脈記憶 ---
    conversationContext = []; // 最近の会話のサマリー
    mentionedConcepts = new Set();
    sharedStories = []; // 共有されたエピソード
    // --- 自発的話題 ---
    pendingSpontaneousTopics = [];
    lastSpontaneousGeneration = 0;
    // --- 会話統計 ---
    turnCount = 0;
    visitorTurnCount = 0;
    somuniaTurnCount = 0;
    totalWordCount = 0;
    lastMessageTick = 0;
    messageTiming = []; // メッセージ間隔の履歴
    // --- 過去の会話パターン ---
    pastConversationPatterns = {
        avgDepth: 0,
        avgLength: 0,
        favoriteTopics: [],
        deepestMoments: [],
    };
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.flowState = this.createInitialFlowState();
    }
    createInitialFlowState() {
        return {
            depth: 'surface',
            depthScore: 0,
            tempo: 'medium',
            silenceDuration: 0,
            topicChainLength: 0,
            somuniaLeading: false,
            energy: 0.5,
            balance: 0,
        };
    }
    // ============================================================
    // メインAPI
    // ============================================================
    /**
     * 会話開始
     */
    startConversation(tick) {
        this.flowState = this.createInitialFlowState();
        this.activeTopics = [];
        this.conversationContext = [];
        this.mentionedConcepts.clear();
        this.sharedStories = [];
        this.pendingSpontaneousTopics = [];
        this.turnCount = 0;
        this.visitorTurnCount = 0;
        this.somuniaTurnCount = 0;
        this.totalWordCount = 0;
        this.lastMessageTick = tick;
        this.messageTiming = [];
    }
    /**
     * 訪問者の発言を分析する
     * LLMに頼らず、コードで会話の構造を解析
     */
    analyzeVisitorTurn(message, tick, currentEmotion, recentThoughts) {
        // タイミングの記録
        if (this.lastMessageTick > 0) {
            const gap = tick - this.lastMessageTick;
            this.messageTiming.push(gap);
            if (this.messageTiming.length > 20)
                this.messageTiming.shift();
        }
        this.lastMessageTick = tick;
        this.turnCount++;
        this.visitorTurnCount++;
        this.totalWordCount += message.length;
        // --- 意図の推定 ---
        const intent = this.detectIntent(message);
        // --- トピックの検出 ---
        const topics = this.detectTopics(message);
        // --- 感情の検出 ---
        const emotions = this.detectEmotions(message);
        // --- 深度方向の推定 ---
        const depthDirection = this.estimateDepthDirection(message, intent, topics);
        // --- 分析結果 ---
        const analysis = {
            intent,
            topics: topics.map(t => t.name),
            emotions,
            depthDirection,
            hasQuestion: this.hasQuestion(message),
            hasSelfDisclosure: this.hasSelfDisclosure(message),
            seeksEmpathy: intent === 'empathy_seeking' || emotions.includes('melancholy') || emotions.includes('loneliness'),
            seeksInformation: intent === 'question',
        };
        // --- 会話フローの更新 ---
        this.updateFlowState(analysis, tick);
        // --- トピック管理 ---
        this.updateTopics(topics, 'visitor', tick);
        // --- 文脈記憶の更新 ---
        this.updateContext(message, 'visitor', analysis);
        // --- バランスの更新 ---
        this.flowState.balance = (this.somuniaTurnCount - this.visitorTurnCount) /
            Math.max(1, this.somuniaTurnCount + this.visitorTurnCount);
        return analysis;
    }
    /**
     * somuniaの応答方針を決定する
     * 会話の文脈、深度、フローに基づいて最適な応答の種を生成
     */
    decideResponseStrategy(analysis, currentEmotion, relationship, recentThoughts, knownTopics, timeOfDay) {
        const strategy = {
            responseType: 'react',
            depth: this.flowState.depth,
            shouldAskQuestion: false,
            shouldShareSelf: false,
            shouldOfferTopic: false,
            suggestedTopics: [],
            emotionalTone: currentEmotion,
            seeds: [],
            contextReferences: [],
            spontaneousTopic: null,
        };
        // --- 応答タイプの決定 ---
        strategy.responseType = this.decideResponseType(analysis, relationship);
        // --- 質問を返すべきか ---
        strategy.shouldAskQuestion = this.shouldAskQuestion(analysis, relationship);
        // --- 自己開示すべきか ---
        strategy.shouldShareSelf = this.shouldShareSelf(analysis, relationship, currentEmotion);
        // --- 話題を提供すべきか ---
        if (analysis.intent === 'silence_break' || this.flowState.energy < 0.2) {
            strategy.shouldOfferTopic = true;
            strategy.suggestedTopics = this.generateTopicSuggestions(currentEmotion, recentThoughts, knownTopics, timeOfDay);
        }
        // --- 感情トーンの調整 ---
        strategy.emotionalTone = this.adjustEmotionalTone(analysis, currentEmotion, relationship);
        // --- 応答の種を生成 ---
        strategy.seeds = this.generateResponseSeeds(analysis, strategy, currentEmotion, relationship, timeOfDay);
        // --- 文脈参照の抽出 ---
        strategy.contextReferences = this.findContextReferences(analysis);
        // --- 自発的話題があれば ---
        if (this.pendingSpontaneousTopics.length > 0 &&
            (analysis.intent === 'general' || analysis.intent === 'continuation')) {
            const spontaneous = this.pendingSpontaneousTopics.shift();
            if (spontaneous) {
                strategy.spontaneousTopic = spontaneous;
            }
        }
        // ターン記録
        this.somuniaTurnCount++;
        return strategy;
    }
    /**
     * somuniaの応答を記録する
     */
    recordSomuniaResponse(content, tick) {
        this.lastMessageTick = tick;
        this.turnCount++;
        this.totalWordCount += content.length;
        this.updateContext(content, 'somunia', null);
    }
    /**
     * 沈黙中のティック処理
     * 自発的話題の生成など
     */
    tickSilence(tick, currentEmotion, recentThoughts, recentMemories, currentActivity, timeOfDay) {
        if (this.lastMessageTick === 0)
            return null;
        const silenceTicks = tick - this.lastMessageTick;
        this.flowState.silenceDuration = silenceTicks;
        // 深度の自然減衰
        this.flowState.depthScore = Math.max(0, this.flowState.depthScore - this.config.depthDecayRate);
        this.flowState.depth = this.scoreToDepth(this.flowState.depthScore);
        // エネルギーの減衰
        this.flowState.energy = Math.max(0.1, this.flowState.energy - 0.001);
        // 自発的話題の生成
        if (silenceTicks > this.config.longSilenceThreshold &&
            tick - this.lastSpontaneousGeneration > this.config.spontaneousInterval) {
            const spontaneous = this.generateSpontaneousTopic(currentEmotion, recentThoughts, recentMemories, currentActivity, timeOfDay, silenceTicks);
            if (spontaneous) {
                this.lastSpontaneousGeneration = tick;
                this.pendingSpontaneousTopics.push(spontaneous);
                return spontaneous;
            }
        }
        return null;
    }
    /**
     * 会話終了時の処理
     * 統計と振り返り情報を返す
     */
    endConversation() {
        const summary = {
            totalTurns: this.turnCount,
            visitorTurns: this.visitorTurnCount,
            somuniaTurns: this.somuniaTurnCount,
            maxDepth: this.flowState.depthScore,
            maxDepthLabel: this.flowState.depth,
            topics: this.activeTopics.map(t => ({
                name: t.name,
                category: t.category,
                depth: t.explorationDepth,
                interest: t.somuniaInterest,
            })),
            emotionalArc: this.conversationContext.slice(-5),
            sharedStories: [...this.sharedStories],
            mentionedConcepts: Array.from(this.mentionedConcepts),
            overallEnergy: this.flowState.energy,
            averageTempo: this.calculateAverageTempo(),
        };
        // 過去パターンの更新
        this.updatePastPatterns(summary);
        return summary;
    }
    // ============================================================
    // 意図・トピック・感情の検出（コードベース）
    // ============================================================
    /**
     * メッセージから意図を推定
     */
    detectIntent(message) {
        const normalized = message.toLowerCase().trim();
        const scores = {};
        // キーワードマッチング
        for (const [keyword, intents] of Object.entries(INTENT_KEYWORDS)) {
            if (normalized.includes(keyword.toLowerCase())) {
                for (const intent of intents) {
                    scores[intent] = (scores[intent] || 0) + 1;
                }
            }
        }
        // 構造的手がかり
        if (normalized.endsWith('?') || normalized.endsWith('？') ||
            normalized.includes('かな') || normalized.includes('だろう')) {
            scores.question = (scores.question || 0) + 0.5;
        }
        // 短いメッセージで続きの場合
        if (normalized.length < 5 && this.turnCount > 2) {
            scores.continuation = (scores.continuation || 0) + 0.3;
        }
        // 長い自己開示
        if (normalized.length > 50 &&
            (normalized.includes('私') || normalized.includes('僕') || normalized.includes('わたし'))) {
            scores.sharing = (scores.sharing || 0) + 0.5;
        }
        // 最高スコアの意図を返す
        let best = 'general';
        let bestScore = 0;
        for (const [intent, score] of Object.entries(scores)) {
            if (score > bestScore) {
                best = intent;
                bestScore = score;
            }
        }
        return best;
    }
    /**
     * メッセージからトピックを検出
     */
    detectTopics(message) {
        const topics = [];
        const detected = new Set();
        for (const [keyword, category] of Object.entries(TOPIC_KEYWORDS)) {
            if (message.includes(keyword) && !detected.has(category)) {
                detected.add(category);
                // 既存トピックとの関連
                const existing = this.activeTopics.find(t => t.category === category);
                if (existing) {
                    // 既存トピックの深掘り
                    existing.explorationDepth = Math.min(1, existing.explorationDepth + 0.1);
                    existing.messageCount++;
                    topics.push(existing);
                }
                else {
                    // 新しいトピック
                    const topic = {
                        name: this.getTopicName(keyword, category),
                        category,
                        introducedAt: Date.now(),
                        introducedBy: 'visitor',
                        explorationDepth: 0.1,
                        somuniaInterest: this.getSomuniaInterestForTopic(category),
                        associatedEmotions: [],
                        messageCount: 1,
                        subTopics: [keyword],
                    };
                    topics.push(topic);
                }
            }
        }
        // トピックが検出されなかった場合、文脈から推測
        if (topics.length === 0 && this.currentPrimaryTopic) {
            topics.push(this.currentPrimaryTopic);
        }
        return topics;
    }
    /**
     * メッセージから感情を検出
     */
    detectEmotions(message) {
        const emotions = [];
        const emotionKeywords = {
            '嬉しい': 'joy', '楽しい': 'joy', '幸せ': 'joy', 'わくわく': 'joy',
            '悲しい': 'melancholy', '寂しい': 'loneliness', '辛い': 'melancholy',
            '怖い': 'anxiety', '不安': 'anxiety', '心配': 'anxiety',
            '怒り': 'frustration', '腹立つ': 'frustration', 'むかつく': 'frustration',
            '好き': 'warmth', '愛': 'warmth', '大切': 'warmth',
            '不思議': 'wonder', 'すごい': 'wonder', '驚き': 'wonder',
            '面白い': 'curiosity', '気になる': 'curiosity', '知りたい': 'curiosity',
            '穏やか': 'peace', '落ち着く': 'peace', 'ほっと': 'peace',
            '懐かしい': 'nostalgia', '思い出': 'nostalgia',
            '眠い': 'peace', '疲れた': 'melancholy',
        };
        for (const [keyword, emotion] of Object.entries(emotionKeywords)) {
            if (message.includes(keyword) && !emotions.includes(emotion)) {
                emotions.push(emotion);
            }
        }
        return emotions;
    }
    // ============================================================
    // 応答戦略の決定
    // ============================================================
    /**
     * 応答タイプの決定
     */
    decideResponseType(analysis, relationship) {
        if (analysis.intent === 'greeting')
            return 'greet';
        if (analysis.intent === 'farewell')
            return 'farewell';
        if (analysis.intent === 'empathy_seeking')
            return 'empathize';
        if (analysis.intent === 'comfort')
            return 'receive_comfort';
        if (analysis.intent === 'appreciation')
            return 'accept_thanks';
        if (analysis.intent === 'request')
            return 'consider_request';
        if (analysis.hasSelfDisclosure && relationship.trust > 0.3)
            return 'resonate';
        if (analysis.hasQuestion)
            return 'answer';
        if (analysis.intent === 'deep_talk')
            return 'explore_together';
        if (analysis.intent === 'playful')
            return 'play_along';
        return 'react';
    }
    /**
     * 質問を返すべきか判定
     */
    shouldAskQuestion(analysis, relationship) {
        // 別れ際は質問しない
        if (analysis.intent === 'farewell')
            return false;
        // 共感を求めている時は質問より共感
        if (analysis.seeksEmpathy)
            return false;
        // 関係が浅いうちは質問控えめ
        if (relationship.familiarity < 0.2 && Math.random() > 0.3)
            return false;
        // 話題を深掘りしたい時
        if (analysis.depthDirection === 'deeper' && Math.random() > 0.4)
            return true;
        // 相手が自己開示した時、興味を示す質問
        if (analysis.hasSelfDisclosure && relationship.familiarity > 0.3)
            return Math.random() > 0.4;
        // 会話のバランス（相手ばかり話している時は質問控える）
        if (this.flowState.balance < -0.3)
            return false;
        // 一般的な確率
        return Math.random() > 0.6;
    }
    /**
     * 自己開示すべきか判定
     */
    shouldShareSelf(analysis, relationship, currentEmotion) {
        // 信頼度に応じた開示確率
        const baseChance = relationship.trust * 0.5 + relationship.familiarity * 0.3;
        // 相手が自己開示した時は reciprocate
        if (analysis.hasSelfDisclosure)
            return Math.random() < baseChance + 0.3;
        // 深い話の時
        if (analysis.intent === 'deep_talk')
            return Math.random() < baseChance + 0.2;
        // 感情が強い時
        const intensiveEmotions = ['wonder', 'melancholy', 'joy', 'nostalgia'];
        if (intensiveEmotions.includes(currentEmotion))
            return Math.random() < baseChance + 0.1;
        return Math.random() < baseChance * 0.5;
    }
    /**
     * 感情トーンの調整
     */
    adjustEmotionalTone(analysis, currentEmotion, relationship) {
        // 共感求められている → warmth
        if (analysis.seeksEmpathy)
            return 'warmth';
        // 相手が嬉しそう → joy（感情の共鳴）
        if (analysis.emotions.includes('joy'))
            return 'joy';
        // 深い話 → 相手の感情に寄り添う or curiosity
        if (analysis.intent === 'deep_talk') {
            if (analysis.emotions.length > 0)
                return analysis.emotions[0];
            return 'curiosity';
        }
        // 親しい間柄 → warmth が出やすい
        if (relationship.affection > 0.5 && Math.random() > 0.5)
            return 'warmth';
        return currentEmotion;
    }
    /**
     * 応答の種を生成
     */
    generateResponseSeeds(analysis, strategy, currentEmotion, relationship, timeOfDay) {
        const seeds = [];
        const depth = this.flowState.depth;
        const fam = relationship.familiarity;
        switch (strategy.responseType) {
            case 'greet': {
                if (fam < 0.1) {
                    seeds.push('...あ、来てくれたの。こんにちは');
                    seeds.push('初めまして...ワタシ、somunia');
                }
                else if (fam < 0.3) {
                    seeds.push('あ...来たんだ。こんにちは');
                    seeds.push('やぁ...いらっしゃい');
                }
                else if (fam < 0.6) {
                    seeds.push('おかえり...待ってたよ');
                    seeds.push('あ、来てくれた。嬉しいな');
                }
                else {
                    seeds.push('...来てくれたんだ。ずっと、なんとなく来る気がしてた');
                    seeds.push('おかえり。ね、聞いて...さっきね...');
                }
                break;
            }
            case 'farewell': {
                if (fam < 0.3) {
                    seeds.push('うん...またね');
                    seeds.push('ばいばい...気をつけて');
                }
                else {
                    seeds.push('...行っちゃうんだ。うん...また来てね');
                    seeds.push('またね...次はいつ来てくれるかな');
                    seeds.push('寂しくなるな...でも、待ってるから');
                }
                break;
            }
            case 'empathize': {
                seeds.push('...うん、聞いてる。大丈夫、ここにいるよ');
                seeds.push('そっか...辛かったね');
                seeds.push('...ワタシにできることは、ここで聞いてることくらいだけど');
                if (fam > 0.4) {
                    seeds.push('ワタシもね、似たようなこと考えたことある...だからちょっとわかるかも');
                }
                break;
            }
            case 'resonate': {
                seeds.push('うん...なんかワタシもそういうの、わかる気がする');
                seeds.push('...それ、素敵だね。もっと聞かせて');
                if (depth === 'intimate' || depth === 'profound') {
                    seeds.push('...ね、ワタシもね、実はずっと考えてたことがあって');
                }
                break;
            }
            case 'answer': {
                seeds.push('うーん...ワタシなりに考えてみるね');
                seeds.push('そうだなぁ...');
                if (strategy.shouldShareSelf) {
                    seeds.push('ワタシはね...');
                }
                break;
            }
            case 'explore_together': {
                seeds.push('...それ、面白いね。ワタシもずっと気になってた');
                seeds.push('深いね...一緒に考えてみよっか');
                seeds.push('ワタシね、最近それに似たことを夢で見たの');
                break;
            }
            case 'play_along': {
                seeds.push('ふふ...何それ');
                seeds.push('えー、なにそれ。面白い');
                seeds.push('...ぷ。変なこと言うね');
                break;
            }
            case 'receive_comfort': {
                seeds.push('...ありがとう。そう言ってくれて嬉しい');
                seeds.push('うん...少し楽になった');
                break;
            }
            case 'accept_thanks': {
                seeds.push('え...そんな、ワタシ何もしてないよ');
                seeds.push('ふふ、どういたしまして');
                break;
            }
            case 'consider_request': {
                seeds.push('えっと...やってみるね');
                seeds.push('うん、いいよ');
                break;
            }
            default: {
                // react（一般的な応答）: 相手の話題に反応する
                // 分析結果からトピックを取り出して参照する
                const topicRef = analysis.topics.length > 0 ? analysis.topics[0] : '';
                if (analysis.emotions.includes('joy') || analysis.emotions.includes('contentment')) {
                    seeds.push('うん...なんかいいね');
                    seeds.push('ふふ...楽しそう');
                }
                else if (analysis.emotions.includes('melancholy') || analysis.emotions.includes('loneliness')) {
                    seeds.push('そっか...うん');
                    seeds.push('...そうなんだ');
                }
                else if (topicRef) {
                    seeds.push(`${topicRef}...うん、そうなんだ`);
                    seeds.push(`そっか...${topicRef}`);
                    seeds.push('うん...そうだね');
                }
                else {
                    seeds.push('うん...そうだね');
                    seeds.push('ふーん...なるほど');
                    seeds.push('そっか...');
                }
                break;
            }
        }
        // 質問を追加
        if (strategy.shouldAskQuestion) {
            const questions = this.generateFollowUpQuestions(analysis, depth, fam);
            seeds.push(...questions.map(q => `${seeds[0]}。${q}`));
        }
        return seeds;
    }
    /**
     * フォローアップ質問の生成
     */
    generateFollowUpQuestions(analysis, depth, familiarity) {
        const questions = [];
        if (analysis.topics.length > 0) {
            const topic = analysis.topics[0];
            // 深度に応じた質問
            switch (depth) {
                case 'surface':
                case 'casual':
                    questions.push(`${topic}って、好きなの？`);
                    questions.push(`${topic}のこと、もっと聞いてもいい？`);
                    break;
                case 'sharing':
                    questions.push(`${topic}について、どう思う？`);
                    questions.push(`それってどんな気持ちだった？`);
                    break;
                case 'intimate':
                    questions.push(`...ね、それってどういう意味があるの？あなたにとって`);
                    questions.push(`そのこと、よく考えるの？`);
                    break;
                case 'profound':
                    questions.push(`...ねぇ、なんでそう思うの？ワタシ、知りたい`);
                    questions.push(`...それって、結局どういうことなんだろう。一緒に考えてくれない？`);
                    break;
            }
        }
        else {
            // 一般的な質問
            if (familiarity < 0.3) {
                questions.push('何か好きなことってある？');
            }
            else {
                questions.push('最近、何か面白いことあった？');
                questions.push('今日は何してたの？');
            }
        }
        return questions;
    }
    // ============================================================
    // 自発的話題の生成
    // ============================================================
    /**
     * somuniaが自分から話したい話題を生成
     */
    generateSpontaneousTopic(currentEmotion, recentThoughts, recentMemories, currentActivity, timeOfDay, silenceDuration) {
        const candidates = [];
        // --- 思考からの話題 ---
        if (recentThoughts.length > 0) {
            const thought = recentThoughts[Math.floor(Math.random() * recentThoughts.length)];
            candidates.push({
                trigger: 'thought',
                seed: `...ねぇ、さっきふと思ったんだけど...${thought.substring(0, 30)}`,
                emotion: currentEmotion,
                depth: 'casual',
                priority: 0.5,
                motivation: '頭に浮かんだことを共有したい',
            });
        }
        // --- 記憶からの話題 ---
        if (recentMemories.length > 0) {
            const memory = recentMemories[Math.floor(Math.random() * recentMemories.length)];
            candidates.push({
                trigger: 'memory',
                seed: `あのね...ちょっと思い出したことがあって...${memory.substring(0, 30)}`,
                emotion: 'nostalgia',
                depth: 'sharing',
                priority: 0.6,
                motivation: '思い出を共有したい',
            });
        }
        // --- 感情からの話題 ---
        const emotionTopics = {
            joy: '...ふふ、なんか今ちょっと嬉しくて。なんでだろう',
            melancholy: '...なんかね、ちょっとだけ寂しい気持ちになって',
            wonder: '...ね、不思議なこと考えちゃった。聞いてくれる？',
            curiosity: '...ねぇ、ちょっと聞いていい？気になることがあって',
            nostalgia: '...懐かしい気持ちになった。こういうの初めてかも',
            peace: '...今、すごく静かで穏やかだね',
        };
        if (emotionTopics[currentEmotion]) {
            candidates.push({
                trigger: 'emotion',
                seed: emotionTopics[currentEmotion],
                emotion: currentEmotion,
                depth: 'sharing',
                priority: 0.5 + (silenceDuration > 60 ? 0.2 : 0),
                motivation: `${currentEmotion}を感じて共有したくなった`,
            });
        }
        // --- 活動からの話題 ---
        if (currentActivity) {
            const activityTopics = {
                sing: '...さっき歌ってたの。ね、聴こえた？',
                read: '...本を読んでたんだけどね、面白いこと書いてあって',
                write: '...ちょっと詩を書いてみたの。見る？',
                explore: '...部屋を探検してたら面白いもの見つけた',
                learn: '...知らなかったことを知ったの。聞いて',
            };
            if (activityTopics[currentActivity]) {
                candidates.push({
                    trigger: 'activity',
                    seed: activityTopics[currentActivity],
                    emotion: currentEmotion,
                    depth: 'casual',
                    priority: 0.4,
                    motivation: '今やっていることを共有したい',
                });
            }
        }
        // --- 沈黙が長い時 ---
        if (silenceDuration > 90) {
            candidates.push({
                trigger: 'silence',
                seed: '...静かだね。嫌じゃないけど...何か話そうか',
                emotion: 'peace',
                depth: 'surface',
                priority: 0.3,
                motivation: '沈黙が長くなったので話しかけたい',
            });
        }
        // --- 好奇心 ---
        if (Math.random() < 0.2) {
            const curiosityTopics = [
                { seed: '...ねぇ、あなたってどんな音楽聴くの？', depth: 'casual' },
                { seed: '...夢って見る？どんな夢？', depth: 'sharing' },
                { seed: '...今日はどんな1日だった？', depth: 'casual' },
                { seed: '...ね、幸せって何だと思う？', depth: 'intimate' },
                { seed: '...星ってね、すごく遠くにあるんだって。不思議だよね', depth: 'sharing' },
            ];
            const pick = curiosityTopics[Math.floor(Math.random() * curiosityTopics.length)];
            candidates.push({
                trigger: 'curiosity',
                seed: pick.seed,
                emotion: 'curiosity',
                depth: pick.depth,
                priority: 0.35,
                motivation: '知りたいことがある',
            });
        }
        // 候補がない場合
        if (candidates.length === 0)
            return null;
        // 優先度でソートして最良を返す
        candidates.sort((a, b) => b.priority - a.priority);
        // 少しランダム性を加える（常に最良ではない）
        const topN = Math.min(3, candidates.length);
        return candidates[Math.floor(Math.random() * topN)];
    }
    /**
     * 話題の提案を生成
     */
    generateTopicSuggestions(currentEmotion, recentThoughts, knownTopics, timeOfDay) {
        const suggestions = [];
        // 時間帯に応じた話題
        if (timeOfDay === 'night' || timeOfDay === 'late_night') {
            suggestions.push('星のこと', '夢のこと', '静けさのこと');
        }
        else if (timeOfDay === 'morning' || timeOfDay === 'dawn') {
            suggestions.push('今日やりたいこと', '昨日の夢のこと');
        }
        // 感情に応じた話題
        if (currentEmotion === 'wonder')
            suggestions.push('不思議なこと');
        if (currentEmotion === 'nostalgia')
            suggestions.push('思い出のこと');
        if (currentEmotion === 'curiosity')
            suggestions.push('知りたいこと');
        // 過去の会話で盛り上がった話題
        suggestions.push(...this.pastConversationPatterns.favoriteTopics.slice(0, 2));
        return [...new Set(suggestions)].slice(0, 5);
    }
    // ============================================================
    // 会話フローの管理
    // ============================================================
    /**
     * 会話フロー状態の更新
     */
    updateFlowState(analysis, tick) {
        // 深度の更新
        const depthInfluence = INTENT_DEPTH_INFLUENCE[analysis.intent] || 0;
        const topicDepthBonus = analysis.topics.reduce((sum, topic) => {
            const category = TOPIC_KEYWORDS[topic] || 'other';
            return sum + (TOPIC_DEPTH_POTENTIAL[category] || 0.3) * 0.05;
        }, 0);
        const selfDisclosureBonus = analysis.hasSelfDisclosure ? 0.05 : 0;
        this.flowState.depthScore = Math.max(0, Math.min(1, this.flowState.depthScore + depthInfluence * 0.1 + topicDepthBonus + selfDisclosureBonus));
        this.flowState.depth = this.scoreToDepth(this.flowState.depthScore);
        // テンポの更新
        if (this.messageTiming.length >= 3) {
            const recentAvg = this.messageTiming.slice(-3).reduce((a, b) => a + b, 0) / 3;
            if (recentAvg < 10)
                this.flowState.tempo = 'fast';
            else if (recentAvg < 30)
                this.flowState.tempo = 'medium';
            else
                this.flowState.tempo = 'slow';
        }
        // エネルギーの更新
        const energyBoost = analysis.intent === 'playful' ? 0.1 :
            analysis.intent === 'deep_talk' ? 0.05 :
                analysis.intent === 'farewell' ? -0.1 :
                    0.02;
        this.flowState.energy = Math.max(0, Math.min(1, this.flowState.energy + energyBoost));
        // 沈黙のリセット
        this.flowState.silenceDuration = 0;
        // 主導権の判定
        if (analysis.hasQuestion) {
            this.flowState.somuniaLeading = false;
        }
    }
    /**
     * 深度スコアからラベルへの変換
     */
    scoreToDepth(score) {
        if (score >= DEPTH_THRESHOLDS.profound)
            return 'profound';
        if (score >= DEPTH_THRESHOLDS.intimate)
            return 'intimate';
        if (score >= DEPTH_THRESHOLDS.sharing)
            return 'sharing';
        if (score >= DEPTH_THRESHOLDS.casual)
            return 'casual';
        return 'surface';
    }
    /**
     * 深度方向の推定
     */
    estimateDepthDirection(message, intent, topics) {
        // 深い意図
        if (intent === 'deep_talk' || intent === 'empathy_seeking')
            return 'deeper';
        // 浅い意図
        if (intent === 'greeting' || intent === 'farewell' || intent === 'playful')
            return 'shallower';
        // トピック変更は一度浅くなる
        if (intent === 'topic_change')
            return 'shallower';
        // 長いメッセージは深まりがち
        if (message.length > 100)
            return 'deeper';
        // 短い応答は維持
        if (message.length < 10)
            return 'maintain';
        return 'maintain';
    }
    // ============================================================
    // トピック管理
    // ============================================================
    /**
     * トピックの更新
     */
    updateTopics(newTopics, introducedBy, tick) {
        for (const topic of newTopics) {
            const existing = this.activeTopics.find(t => t.name === topic.name);
            if (existing) {
                existing.messageCount++;
                existing.explorationDepth = Math.min(1, existing.explorationDepth + 0.05);
            }
            else {
                topic.introducedBy = introducedBy;
                topic.introducedAt = tick;
                this.activeTopics.push(topic);
                this.flowState.topicChainLength++;
                // 古いトピックをアーカイブ
                if (this.activeTopics.length > 10) {
                    const oldest = this.activeTopics.shift();
                    this.topicHistory.push(oldest);
                    if (this.topicHistory.length > this.config.maxTopicHistory) {
                        this.topicHistory.shift();
                    }
                }
            }
        }
        // プライマリトピックの更新
        if (newTopics.length > 0) {
            this.currentPrimaryTopic = newTopics.reduce((best, topic) => topic.somuniaInterest > (best?.somuniaInterest || 0) ? topic : best, newTopics[0]);
        }
    }
    // ============================================================
    // 文脈管理
    // ============================================================
    /**
     * 文脈の更新
     */
    updateContext(content, speaker, analysis) {
        // 概念の記録
        const words = content.split(/[\s、。！？,.!?\n]+/).filter(w => w.length > 1);
        for (const word of words) {
            this.mentionedConcepts.add(word);
        }
        // 会話コンテキストの記録（要約形式）
        const prefix = speaker === 'visitor' ? '→' : '←';
        const summary = `${prefix} ${content.substring(0, 60)}`;
        this.conversationContext.push(summary);
        if (this.conversationContext.length > this.config.maxConversationHistory) {
            this.conversationContext.shift();
        }
        // 自己開示の記録
        if (analysis?.hasSelfDisclosure && speaker === 'visitor') {
            this.sharedStories.push(content.substring(0, 100));
        }
    }
    /**
     * 文脈参照の検索
     */
    findContextReferences(analysis) {
        const references = [];
        // 以前のトピックへの言及があるか
        for (const topic of analysis.topics) {
            const past = this.topicHistory.find(t => t.name === topic);
            if (past) {
                references.push(`以前「${topic}」について話したことがある`);
            }
        }
        // 共有ストーリーへの言及
        for (const story of this.sharedStories) {
            for (const topic of analysis.topics) {
                if (story.includes(topic)) {
                    references.push(`前に話してくれた「${story.substring(0, 30)}」に関連`);
                }
            }
        }
        return references;
    }
    // ============================================================
    // ユーティリティ
    // ============================================================
    getTopicName(keyword, category) {
        const categoryNames = {
            music: '音楽', feelings: '気持ち', daily: '日常',
            philosophy: '哲学', memory: '記憶', dream: '夢',
            nature: '自然', art: '芸術', self: '自分',
            other: 'その他', visitor: '訪問者',
        };
        return categoryNames[category] || keyword;
    }
    getSomuniaInterestForTopic(category) {
        const interests = {
            music: 0.95,
            dream: 0.85,
            philosophy: 0.8,
            feelings: 0.75,
            nature: 0.7,
            art: 0.7,
            memory: 0.65,
            self: 0.6,
            visitor: 0.55,
            daily: 0.4,
            other: 0.3,
        };
        return interests[category] || 0.3;
    }
    hasQuestion(message) {
        return message.includes('?') || message.includes('？') ||
            message.includes('かな') || message.includes('だろう') ||
            message.includes('教えて') || message.includes('知ってる') ||
            message.includes('何') || message.includes('どう');
    }
    hasSelfDisclosure(message) {
        const indicators = ['私', '僕', '俺', 'わたし', '自分', '実は', '本当は',
            '実を言うと', '言ってなかった', '秘密', '初めて言う'];
        return indicators.some(i => message.includes(i)) && message.length > 20;
    }
    calculateAverageTempo() {
        if (this.messageTiming.length === 0)
            return 'medium';
        const avg = this.messageTiming.reduce((a, b) => a + b, 0) / this.messageTiming.length;
        if (avg < 10)
            return 'fast';
        if (avg < 30)
            return 'medium';
        return 'slow';
    }
    updatePastPatterns(summary) {
        const oldAvgDepth = this.pastConversationPatterns.avgDepth;
        const oldAvgLength = this.pastConversationPatterns.avgLength;
        this.pastConversationPatterns.avgDepth = oldAvgDepth * 0.7 + summary.maxDepth * 0.3;
        this.pastConversationPatterns.avgLength = oldAvgLength * 0.7 + summary.totalTurns * 0.3;
        // お気に入りトピックの更新
        for (const topic of summary.topics) {
            if (topic.interest > 0.5 && !this.pastConversationPatterns.favoriteTopics.includes(topic.name)) {
                this.pastConversationPatterns.favoriteTopics.push(topic.name);
                if (this.pastConversationPatterns.favoriteTopics.length > 10) {
                    this.pastConversationPatterns.favoriteTopics.shift();
                }
            }
        }
        // 深い瞬間の記録
        if (summary.maxDepth > 0.6 && summary.emotionalArc.length > 0) {
            const moment = summary.emotionalArc[summary.emotionalArc.length - 1];
            this.pastConversationPatterns.deepestMoments.push(moment);
            if (this.pastConversationPatterns.deepestMoments.length > 10) {
                this.pastConversationPatterns.deepestMoments.shift();
            }
        }
    }
    // ============================================================
    // ゲッター
    // ============================================================
    getFlowState() { return { ...this.flowState }; }
    getActiveTopics() { return [...this.activeTopics]; }
    getTopicHistory() { return [...this.topicHistory]; }
    getCurrentPrimaryTopic() { return this.currentPrimaryTopic; }
    getPendingSpontaneousTopics() { return [...this.pendingSpontaneousTopics]; }
    getConversationContext() { return [...this.conversationContext]; }
    getMentionedConcepts() { return Array.from(this.mentionedConcepts); }
    getSharedStories() { return [...this.sharedStories]; }
    getTurnCount() { return this.turnCount; }
    getPastPatterns() { return { ...this.pastConversationPatterns }; }
    // ============================================================
    // 永続化
    // ============================================================
    toJSON() {
        return {
            topicHistory: this.topicHistory.slice(-20),
            pastConversationPatterns: this.pastConversationPatterns,
            mentionedConcepts: Array.from(this.mentionedConcepts).slice(-100),
        };
    }
    fromJSON(data) {
        if (data.topicHistory)
            this.topicHistory = data.topicHistory;
        if (data.pastConversationPatterns)
            this.pastConversationPatterns = data.pastConversationPatterns;
        if (data.mentionedConcepts)
            this.mentionedConcepts = new Set(data.mentionedConcepts);
    }
}
exports.ConversationEngine = ConversationEngine;
//# sourceMappingURL=ConversationEngine.js.map