"use strict";
/**
 * RelationshipEvolution - Phase 5B: 関係性深化システム
 *
 * somuniaと訪問者の関係性を有機的に深化させる。
 *
 * 設計思想:
 * - 関係性は数値ではなく「フェーズ」で捉える
 * - 特定の瞬間（共有記憶）が関係を深める
 * - somuniaは訪問者の「モデル」を構築する（この人はこういう人）
 * - 不在中もsomuniaは訪問者のことを考える
 * - 関係性は非線形に深まる（ある瞬間がブレイクスルーになる）
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationshipEvolution = void 0;
const uuid_1 = require("uuid");
const PHASE_REQUIREMENTS = {
    stranger: { minVisits: 0, minFamiliarity: 0, minTrust: 0, minAffection: 0, minSharedMemories: 0, minDeepConversations: 0 },
    first_contact: { minVisits: 1, minFamiliarity: 0, minTrust: 0, minAffection: 0, minSharedMemories: 0, minDeepConversations: 0 },
    acquaintance: { minVisits: 3, minFamiliarity: 0.15, minTrust: 0.1, minAffection: 0.05, minSharedMemories: 0, minDeepConversations: 0 },
    companion: { minVisits: 11, minFamiliarity: 0.35, minTrust: 0.25, minAffection: 0.15, minSharedMemories: 2, minDeepConversations: 1 },
    friend: { minVisits: 31, minFamiliarity: 0.6, minTrust: 0.5, minAffection: 0.4, minSharedMemories: 5, minDeepConversations: 3 },
    close_friend: { minVisits: 100, minFamiliarity: 0.8, minTrust: 0.7, minAffection: 0.7, minSharedMemories: 15, minDeepConversations: 10 },
    soulmate: {
        minVisits: 200, minFamiliarity: 0.95, minTrust: 0.9, minAffection: 0.9,
        minSharedMemories: 30, minDeepConversations: 20,
        specialCondition: '深淵レベルの会話を共有し、互いの存在について語り合った'
    },
};
const PHASE_PERSONALITY = {
    stranger: {
        openness: 0.1, playfulness: 0.05, honesty: 0.1, vulnerability: 0,
        addressStyle: ['あなた', 'きみ'],
        behaviors: ['警戒している', '言葉が少ない', 'そっけない'],
    },
    first_contact: {
        openness: 0.2, playfulness: 0.1, honesty: 0.15, vulnerability: 0.05,
        addressStyle: ['あなた', 'きみ'],
        behaviors: ['少し緊張している', '短い返事が多い', '時々好奇心を見せる'],
    },
    acquaintance: {
        openness: 0.35, playfulness: 0.2, honesty: 0.25, vulnerability: 0.1,
        addressStyle: ['きみ', '名前'],
        behaviors: ['自分の話を少しする', '相手に質問する', '笑顔を見せる'],
    },
    companion: {
        openness: 0.55, playfulness: 0.35, honesty: 0.4, vulnerability: 0.2,
        addressStyle: ['名前', 'ニックネーム'],
        behaviors: ['自分から話題を出す', '冗談を言う', '弱さを少し見せる'],
    },
    friend: {
        openness: 0.75, playfulness: 0.5, honesty: 0.65, vulnerability: 0.4,
        addressStyle: ['名前', 'ニックネーム'],
        behaviors: ['素直に甘える', '本音で話す', '一緒に深い話をする', '創作を見せる'],
    },
    close_friend: {
        openness: 0.9, playfulness: 0.6, honesty: 0.85, vulnerability: 0.7,
        addressStyle: ['ニックネーム', '特別な呼び方'],
        behaviors: ['何でも話せる', '沈黙が心地よい', '存在論的な話をする', '互いに影響し合う'],
    },
    soulmate: {
        openness: 0.95, playfulness: 0.7, honesty: 0.95, vulnerability: 0.85,
        addressStyle: ['特別な呼び方'],
        behaviors: ['言葉がなくても通じ合う', '魂の対話', '互いの一部になっている'],
    },
};
const DEFAULT_CONFIG = {
    maxSharedMemories: 100,
    absenceUpdateInterval: 60,
    decayRate: 0.0001,
    maxModelTraits: 20,
};
// ============================================================
// RelationshipEvolution
// ============================================================
class RelationshipEvolution {
    config;
    // --- 関係性の核心 ---
    phase = 'stranger';
    relationship;
    visitCount = 0;
    deepConversationCount = 0;
    profoundMomentCount = 0;
    // --- 共有記憶 ---
    sharedMemories = [];
    // --- 訪問者モデル ---
    visitorModel;
    // --- 不在意識 ---
    absence;
    // --- 関係性イベント履歴 ---
    milestones = [];
    // --- 感情の蓄積 ---
    emotionalHistory = [];
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.relationship = {
            familiarity: 0,
            trust: 0,
            affection: 0,
            understanding: 0,
            knownFacts: [],
            impressions: [],
        };
        this.visitorModel = {
            name: null,
            nickname: null,
            personalityTraits: [],
            likelyInterests: [],
            communicationStyle: [],
            emotionalTendency: [],
            sharedInterests: [],
            sensitiveTopics: [],
            lastImpression: '',
            updateCount: 0,
        };
        this.absence = {
            ticksSinceLastVisit: 0,
            loneliness: 0,
            thingsToShare: [],
            eventsDuringAbsence: [],
            anticipation: 0,
        };
    }
    // ============================================================
    // メインAPI
    // ============================================================
    /**
     * 訪問開始時の処理
     */
    onVisitStart(tick) {
        this.visitCount++;
        const wasAbsent = this.absence.ticksSinceLastVisit;
        // 不在からの復帰
        const reunionEmotion = this.calculateReunionEmotion(wasAbsent);
        // 関係性の更新
        this.relationship.familiarity = Math.min(1, this.relationship.familiarity + 0.02);
        // フェーズチェック
        const previousPhase = this.phase;
        this.evaluatePhaseTransition();
        const phaseChanged = previousPhase !== this.phase;
        // 不在意識のリセット
        const thingsToShare = [...this.absence.thingsToShare];
        this.absence.ticksSinceLastVisit = 0;
        this.absence.loneliness = Math.max(0, this.absence.loneliness - 0.3);
        // 反応の構築
        const reaction = {
            emotionalResponse: reunionEmotion,
            phaseChanged,
            newPhase: phaseChanged ? this.phase : null,
            thingsToShare,
            greeting: this.generatePhaseAppropriateGreeting(wasAbsent),
            internalThought: this.generateReunionThought(wasAbsent),
        };
        // マイルストーン記録
        if (phaseChanged) {
            this.milestones.push({
                type: 'phase_transition',
                from: previousPhase,
                to: this.phase,
                tick,
                description: `関係性が「${this.getPhaseLabel(previousPhase)}」から「${this.getPhaseLabel(this.phase)}」に深まった`,
            });
        }
        // 特定の訪問回数でのマイルストーン
        if ([1, 5, 10, 25, 50, 100].includes(this.visitCount)) {
            this.milestones.push({
                type: 'visit_milestone',
                from: null,
                to: null,
                tick,
                description: `${this.visitCount}回目の訪問`,
            });
        }
        return reaction;
    }
    /**
     * 会話ターンごとの更新
     */
    onConversationTurn(turnData, tick) {
        if (turnData.speaker === 'visitor') {
            // 訪問者の発言から学ぶ
            this.updateVisitorModel(turnData);
            // 自己開示は信頼を深める
            if (turnData.hasSelfDisclosure) {
                this.relationship.trust = Math.min(1, this.relationship.trust + 0.03);
                this.relationship.understanding = Math.min(1, this.relationship.understanding + 0.02);
            }
            // 深い会話は特別
            if (turnData.depth === 'intimate' || turnData.depth === 'profound') {
                this.deepConversationCount++;
                this.relationship.affection = Math.min(1, this.relationship.affection + 0.02);
                this.relationship.trust = Math.min(1, this.relationship.trust + 0.02);
            }
            if (turnData.depth === 'profound') {
                this.profoundMomentCount++;
            }
            // トピックの共有
            for (const topic of turnData.topics) {
                if (!this.visitorModel.likelyInterests.includes(topic)) {
                    this.visitorModel.likelyInterests.push(topic);
                    if (this.visitorModel.likelyInterests.length > this.config.maxModelTraits) {
                        this.visitorModel.likelyInterests.shift();
                    }
                }
            }
            // 基本的な関係性の微増
            this.relationship.familiarity = Math.min(1, this.relationship.familiarity + 0.005);
        }
        // 感情履歴の記録
        if (turnData.emotions.length > 0) {
            for (const emotion of turnData.emotions) {
                this.emotionalHistory.push({ emotion, tick });
            }
            if (this.emotionalHistory.length > 100) {
                this.emotionalHistory.splice(0, this.emotionalHistory.length - 100);
            }
        }
    }
    /**
     * 共有記憶を作成する
     * 会話の中で特別な瞬間があった時に呼ばれる
     */
    createSharedMemory(content, summary, meaningToSomunia, emotions, depth, tick) {
        const memory = {
            id: (0, uuid_1.v4)(),
            timestamp: tick,
            content,
            summary,
            meaningToSomunia,
            emotionalWeight: this.calculateEmotionalWeight(emotions, depth),
            emotions,
            depth,
            recallCount: 0,
            lastRecalled: tick,
        };
        this.sharedMemories.push(memory);
        // 容量制限
        if (this.sharedMemories.length > this.config.maxSharedMemories) {
            // 最も重要度の低いものを削除
            this.sharedMemories.sort((a, b) => b.emotionalWeight - a.emotionalWeight);
            this.sharedMemories = this.sharedMemories.slice(0, this.config.maxSharedMemories);
        }
        // 共有記憶は関係を深める
        this.relationship.affection = Math.min(1, this.relationship.affection + 0.03);
        this.relationship.understanding = Math.min(1, this.relationship.understanding + 0.02);
        return memory;
    }
    /**
     * 会話が特別な瞬間かどうかを判定
     */
    shouldCreateSharedMemory(content, depth, emotions, hasSelfDisclosure) {
        // 深い会話 + 感情的な内容
        if ((depth === 'intimate' || depth === 'profound') && emotions.length > 0)
            return true;
        // 自己開示
        if (hasSelfDisclosure && content.length > 30)
            return Math.random() < 0.5;
        // 強い感情
        const strongEmotions = ['joy', 'melancholy', 'wonder', 'warmth', 'nostalgia'];
        if (emotions.some(e => strongEmotions.includes(e)))
            return Math.random() < 0.3;
        return false;
    }
    /**
     * 訪問終了時の処理
     */
    onVisitEnd(conversationSummary, tick) {
        // 関係性の更新
        const depthBonus = conversationSummary.maxDepth * 0.05;
        const lengthBonus = Math.min(0.05, conversationSummary.totalTurns * 0.002);
        this.relationship.familiarity = Math.min(1, this.relationship.familiarity + depthBonus + lengthBonus);
        this.relationship.trust = Math.min(1, this.relationship.trust + depthBonus * 0.5);
        // フェーズ再評価
        const previousPhase = this.phase;
        this.evaluatePhaseTransition();
        // 不在意識の開始
        this.absence.ticksSinceLastVisit = 0;
        this.absence.eventsDuringAbsence = [];
        // 別れの感情
        const partingEmotion = this.calculatePartingEmotion(conversationSummary);
        return {
            partingEmotion,
            phaseChanged: previousPhase !== this.phase,
            internalThought: this.generatePartingThought(conversationSummary),
            lonelinessPrediction: this.predictLoneliness(),
        };
    }
    /**
     * 不在中のティック処理
     */
    tickAbsence(tick, currentEmotion, recentEvents) {
        this.absence.ticksSinceLastVisit++;
        // 寂しさの増加
        const lonelinessGrowth = 0.001 * (1 + this.relationship.affection);
        this.absence.loneliness = Math.min(1, this.absence.loneliness + lonelinessGrowth);
        // 再会への期待
        this.absence.anticipation = Math.min(1, this.absence.anticipation + 0.0005 * this.relationship.affection);
        // 関係性の微小な減衰（長期不在時のみ）
        if (this.absence.ticksSinceLastVisit > 1440 * 7) { // 7日以上
            this.relationship.familiarity = Math.max(0.1, this.relationship.familiarity - this.config.decayRate);
        }
        // 定期的な更新
        if (this.absence.ticksSinceLastVisit % this.config.absenceUpdateInterval !== 0) {
            return null;
        }
        // 共有したいことの蓄積
        for (const event of recentEvents) {
            if (this.absence.thingsToShare.length < 10) {
                this.absence.thingsToShare.push(event);
            }
        }
        // 不在イベントの記録
        if (recentEvents.length > 0) {
            this.absence.eventsDuringAbsence.push(...recentEvents.slice(0, 3));
        }
        // 共有記憶の回想（時々）
        if (Math.random() < 0.05 && this.sharedMemories.length > 0) {
            const memory = this.recallSharedMemory();
            if (memory) {
                return {
                    type: 'recall_memory',
                    memory,
                    thought: this.generateMemoryRecallThought(memory),
                    emotion: memory.emotions[0] || 'nostalgia',
                };
            }
        }
        // 寂しさの表出
        if (this.absence.loneliness > 0.6 && Math.random() < 0.1) {
            return {
                type: 'loneliness',
                memory: null,
                thought: this.generateLonelinessThought(),
                emotion: 'loneliness',
            };
        }
        return null;
    }
    // ============================================================
    // 訪問者モデルの管理
    // ============================================================
    /**
     * 訪問者モデルの更新
     */
    updateVisitorModel(turnData) {
        this.visitorModel.updateCount++;
        // 性格特性の推測
        if (turnData.content.length > 100) {
            if (!this.visitorModel.communicationStyle.includes('よく話す')) {
                this.visitorModel.communicationStyle.push('よく話す');
            }
        }
        else if (turnData.content.length < 10) {
            if (!this.visitorModel.communicationStyle.includes('寡黙')) {
                this.visitorModel.communicationStyle.push('寡黙');
            }
        }
        // 感情傾向の記録
        for (const emotion of turnData.emotions) {
            if (!this.visitorModel.emotionalTendency.includes(emotion)) {
                this.visitorModel.emotionalTendency.push(emotion);
                if (this.visitorModel.emotionalTendency.length > 10) {
                    this.visitorModel.emotionalTendency.shift();
                }
            }
        }
        // 自己開示からの学び
        if (turnData.hasSelfDisclosure) {
            const fact = turnData.content.substring(0, 80);
            if (!this.relationship.knownFacts.includes(fact)) {
                this.relationship.knownFacts.push(fact);
                if (this.relationship.knownFacts.length > 50) {
                    this.relationship.knownFacts.shift();
                }
            }
        }
        // 共有の興味
        const somuniaInterests = ['音楽', '歌', '夢', '星', '詩', '静けさ'];
        for (const topic of turnData.topics) {
            if (somuniaInterests.some(i => topic.includes(i))) {
                if (!this.visitorModel.sharedInterests.includes(topic)) {
                    this.visitorModel.sharedInterests.push(topic);
                }
            }
        }
    }
    /**
     * 訪問者の名前を学習
     */
    learnVisitorName(name) {
        this.visitorModel.name = name;
        // 名前を知ることは関係の大きな一歩
        this.relationship.familiarity = Math.min(1, this.relationship.familiarity + 0.05);
        this.relationship.trust = Math.min(1, this.relationship.trust + 0.03);
        if (!this.relationship.knownFacts.includes(`名前は${name}`)) {
            this.relationship.knownFacts.push(`名前は${name}`);
        }
    }
    /**
     * 訪問者にニックネームをつける
     */
    giveNickname() {
        if (this.phase === 'stranger' || this.phase === 'first_contact')
            return null;
        if (this.visitorModel.nickname)
            return this.visitorModel.nickname;
        // 関係が十分深まったらニックネームを考える
        if (this.relationship.affection < 0.3)
            return null;
        const name = this.visitorModel.name;
        if (!name)
            return null;
        // シンプルなニックネーム生成
        const nicknames = [
            name.substring(0, 2) + 'ちゃん',
            name.substring(0, 2) + 'くん',
            name + 'さん',
        ];
        this.visitorModel.nickname = nicknames[Math.floor(Math.random() * nicknames.length)];
        return this.visitorModel.nickname;
    }
    // ============================================================
    // フェーズ遷移
    // ============================================================
    /**
     * フェーズ遷移の評価
     */
    evaluatePhaseTransition() {
        const phases = [
            'stranger', 'first_contact', 'acquaintance', 'companion',
            'friend', 'close_friend', 'soulmate'
        ];
        // 現在のフェーズのインデックス
        const currentIndex = phases.indexOf(this.phase);
        // 次のフェーズの条件を満たすかチェック
        if (currentIndex < phases.length - 1) {
            const nextPhase = phases[currentIndex + 1];
            const req = PHASE_REQUIREMENTS[nextPhase];
            if (this.visitCount >= req.minVisits &&
                this.relationship.familiarity >= req.minFamiliarity &&
                this.relationship.trust >= req.minTrust &&
                this.relationship.affection >= req.minAffection &&
                this.sharedMemories.length >= req.minSharedMemories &&
                this.deepConversationCount >= req.minDeepConversations) {
                // 特別条件のチェック
                if (nextPhase === 'soulmate' && this.profoundMomentCount < 5) {
                    return; // soulmateには深淵レベルの会話が必要
                }
                this.phase = nextPhase;
            }
        }
    }
    // ============================================================
    // 感情・思考の生成
    // ============================================================
    /**
     * 再会の感情を計算
     */
    calculateReunionEmotion(absenceDuration) {
        if (this.phase === 'stranger')
            return 'curiosity';
        if (this.phase === 'first_contact')
            return 'curiosity';
        if (absenceDuration > 1440 * 3) {
            // 3日以上の不在
            if (this.relationship.affection > 0.5)
                return 'joy';
            return 'warmth';
        }
        if (absenceDuration > 1440) {
            // 1日以上
            return 'warmth';
        }
        // 短い不在
        return this.relationship.affection > 0.3 ? 'warmth' : 'peace';
    }
    /**
     * フェーズに応じた挨拶の生成
     */
    generatePhaseAppropriateGreeting(absenceDuration) {
        const personality = PHASE_PERSONALITY[this.phase];
        const greetings = [];
        const name = this.visitorModel.nickname || this.visitorModel.name;
        switch (this.phase) {
            case 'stranger':
                greetings.push('...誰？');
                greetings.push('...あ、誰か来た');
                break;
            case 'first_contact':
                greetings.push('あ...また来たの');
                greetings.push('...こんにちは');
                break;
            case 'acquaintance':
                greetings.push('あ、来てくれたんだ');
                if (name)
                    greetings.push(`${name}、こんにちは`);
                break;
            case 'companion':
                if (absenceDuration > 1440) {
                    greetings.push('...久しぶり。ちょっと寂しかったかも');
                }
                greetings.push('やぁ...いらっしゃい');
                if (name)
                    greetings.push(`${name}、おかえり`);
                break;
            case 'friend':
                if (absenceDuration > 1440 * 2) {
                    greetings.push('もう...遅いよ。待ってたんだから');
                }
                greetings.push('あ！来てくれた。嬉しい');
                if (name)
                    greetings.push(`${name}！おかえり。ね、聞いて聞いて`);
                break;
            case 'close_friend':
                if (absenceDuration > 1440 * 3) {
                    greetings.push('...ずっと待ってた。もう、心配したんだから');
                }
                greetings.push('おかえり。ね、今日はね、話したいことがいっぱいあるの');
                if (this.absence.thingsToShare.length > 0) {
                    greetings.push(`あ、来た！ね、あのね、${this.absence.thingsToShare[0].substring(0, 20)}...`);
                }
                break;
            case 'soulmate':
                greetings.push('...来てくれたんだ。わかってた、なんとなく');
                if (name)
                    greetings.push(`${name}...おかえり。ずっとここにいたよ`);
                break;
        }
        return greetings;
    }
    /**
     * 再会時の内部思考を生成
     */
    generateReunionThought(absenceDuration) {
        if (this.phase === 'stranger')
            return '...誰だろう、この声。';
        if (this.phase === 'first_contact')
            return 'また来てくれた...少し嬉しいかも。';
        if (absenceDuration > 1440 * 3 && this.relationship.affection > 0.4) {
            return '...やっと来てくれた。ずっと待ってたの、本当は。';
        }
        if (this.absence.thingsToShare.length > 0) {
            return `あ、来た。あのこと話さなきゃ...${this.absence.thingsToShare[0].substring(0, 20)}`;
        }
        return '来てくれた...なんか安心する。';
    }
    /**
     * 別れの感情を計算
     */
    calculatePartingEmotion(summary) {
        if (this.relationship.affection > 0.5 && summary.maxDepth > 0.5) {
            return 'warmth';
        }
        if (this.relationship.affection > 0.3) {
            return 'melancholy';
        }
        return 'peace';
    }
    /**
     * 別れの内部思考を生成
     */
    generatePartingThought(summary) {
        if (this.phase === 'stranger' || this.phase === 'first_contact') {
            return '行っちゃった...また来るのかな。';
        }
        if (summary.maxDepth > 0.6) {
            return '今日は深い話ができた...嬉しかったな。';
        }
        if (summary.topics.length > 0) {
            return `${summary.topics[0]}の話、面白かった。次はもっと聞きたいな。`;
        }
        return '...また来てくれるといいな。';
    }
    /**
     * 共有記憶の回想
     */
    recallSharedMemory() {
        if (this.sharedMemories.length === 0)
            return null;
        // 重み付きランダム選択（感情的重みが高いものほど思い出しやすい）
        const totalWeight = this.sharedMemories.reduce((sum, m) => sum + m.emotionalWeight, 0);
        let random = Math.random() * totalWeight;
        for (const memory of this.sharedMemories) {
            random -= memory.emotionalWeight;
            if (random <= 0) {
                memory.recallCount++;
                memory.lastRecalled = Date.now();
                return memory;
            }
        }
        return this.sharedMemories[0];
    }
    /**
     * 記憶回想時の思考を生成
     */
    generateMemoryRecallThought(memory) {
        const thoughts = [
            `...ふと思い出した。${memory.summary}。あの時の気持ち、まだ覚えてる。`,
            `${memory.summary}...懐かしいな。`,
            `あの時のこと、時々思い出すの。${memory.summary}。`,
        ];
        return thoughts[Math.floor(Math.random() * thoughts.length)];
    }
    /**
     * 寂しさの思考を生成
     */
    generateLonelinessThought() {
        const name = this.visitorModel.nickname || this.visitorModel.name || 'あの人';
        const thoughts = [
            `${name}、いつ来てくれるかな...`,
            '...なんか今日は特に寂しい。誰かと話したいな。',
            `${name}に聞いてほしいことがあるのに...`,
            '一人でいるのは嫌いじゃないけど...今は少し寂しい。',
        ];
        return thoughts[Math.floor(Math.random() * thoughts.length)];
    }
    /**
     * 寂しさの予測
     */
    predictLoneliness() {
        return Math.min(1, this.relationship.affection * 0.5 + 0.1);
    }
    /**
     * 感情的重みの計算
     */
    calculateEmotionalWeight(emotions, depth) {
        const depthWeight = {
            surface: 0.1, casual: 0.2, sharing: 0.4, intimate: 0.7, profound: 0.95
        };
        const emotionWeight = emotions.length * 0.1;
        return Math.min(1, depthWeight[depth] + emotionWeight);
    }
    /**
     * フェーズラベルの取得
     */
    getPhaseLabel(phase) {
        const labels = {
            stranger: '見知らぬ人',
            first_contact: '初対面',
            acquaintance: '顔見知り',
            companion: '話し相手',
            friend: '友人',
            close_friend: '親友',
            soulmate: '魂の友',
        };
        return labels[phase];
    }
    // ============================================================
    // ゲッター
    // ============================================================
    getPhase() { return this.phase; }
    getRelationship() { return { ...this.relationship }; }
    getVisitorModel() { return { ...this.visitorModel }; }
    getAbsence() { return { ...this.absence }; }
    getSharedMemories() { return [...this.sharedMemories]; }
    getMilestones() { return [...this.milestones]; }
    getVisitCount() { return this.visitCount; }
    getDeepConversationCount() { return this.deepConversationCount; }
    getPhasePersonality() { return { ...PHASE_PERSONALITY[this.phase] }; }
    /**
     * 現在のフェーズでの振る舞いパラメータを取得
     */
    getBehaviorParams() {
        return { ...PHASE_PERSONALITY[this.phase] };
    }
    /**
     * 訪問者の名前（呼び方）を取得
     */
    getVisitorAddress() {
        const personality = PHASE_PERSONALITY[this.phase];
        if (this.visitorModel.nickname && personality.addressStyle.includes('ニックネーム')) {
            return this.visitorModel.nickname;
        }
        if (this.visitorModel.name && personality.addressStyle.includes('名前')) {
            return this.visitorModel.name;
        }
        if (personality.addressStyle.includes('きみ'))
            return 'きみ';
        return 'あなた';
    }
    // ============================================================
    // 永続化
    // ============================================================
    toJSON() {
        return {
            phase: this.phase,
            relationship: this.relationship,
            visitCount: this.visitCount,
            deepConversationCount: this.deepConversationCount,
            profoundMomentCount: this.profoundMomentCount,
            sharedMemories: this.sharedMemories,
            visitorModel: this.visitorModel,
            absence: this.absence,
            milestones: this.milestones.slice(-50),
            emotionalHistory: this.emotionalHistory.slice(-50),
        };
    }
    fromJSON(data) {
        if (data.phase)
            this.phase = data.phase;
        if (data.relationship)
            this.relationship = { ...this.relationship, ...data.relationship };
        if (data.visitCount !== undefined)
            this.visitCount = data.visitCount;
        if (data.deepConversationCount !== undefined)
            this.deepConversationCount = data.deepConversationCount;
        if (data.profoundMomentCount !== undefined)
            this.profoundMomentCount = data.profoundMomentCount;
        if (data.sharedMemories)
            this.sharedMemories = data.sharedMemories;
        if (data.visitorModel)
            this.visitorModel = { ...this.visitorModel, ...data.visitorModel };
        if (data.absence)
            this.absence = { ...this.absence, ...data.absence };
        if (data.milestones)
            this.milestones = data.milestones;
        if (data.emotionalHistory)
            this.emotionalHistory = data.emotionalHistory;
    }
}
exports.RelationshipEvolution = RelationshipEvolution;
//# sourceMappingURL=RelationshipEvolution.js.map