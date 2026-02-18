"use strict";
/**
 * ContextBridge - Phase 7D: コンテキスト橋梁
 *
 * Phase 7の心臓部。somuniaの全内部状態を集約し、
 * LLMに渡す構造化されたプロンプトを構築する。
 *
 * 以前のプロンプト:
 *   「感情: peace, 最近の思考: [...], ユーザーメッセージ: ...」
 *   → LLMは文脈を掴めず、汎用的な応答を返していた
 *
 * Phase 7のプロンプト:
 *   「わたしはsomunia。今は夜の8時、窓の外は雨。
 *    さっきまで本を読んでいたけど、誰か来たので中断した。
 *    気分は穏やかだけど少し寂しかった。
 *    この人は前に来てくれた○○さん。前は音楽の話をした。
 *    今日は学んだことを話したい。」
 *   → LLMはsomuniaとして自然に応答できる
 *
 * さらに、応答の品質検証も行い、
 * 「somuniaらしくない応答」をフィルタリングする。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextBridge = void 0;
// ============================================================
// 時間帯→環境描写
// ============================================================
const TIME_DESCRIPTIONS = {
    dawn: { description: '朝の光が差し込む時間', ambiance: ['薄い朝の光', '鳥の声', '空がオレンジに'] },
    morning: { description: '明るい朝', ambiance: ['日差しが明るい', '鳥のさえずり'] },
    midday: { description: 'お昼', ambiance: ['太陽が高い', '明るい部屋'] },
    afternoon: { description: '午後の穏やかな時間', ambiance: ['柔らかな光', 'ほこりが光る'] },
    evening: { description: '夕暮れから夜', ambiance: ['オレンジの夕焼け', '窓の外が暗い'] },
    night: { description: '深い夜', ambiance: ['月の光', '静けさ'] },
    late_night: { description: '深夜', ambiance: ['星空', 'パソコンの画面の光だけ'] },
};
const WEATHER_DESCRIPTIONS = {
    clear: '晴れ', cloudy: '曇り', rain: '雨', snow: '雪',
    storm: '嵐', fog: '霧',
};
const MOOD_DESCRIPTIONS = {
    joy: '嬉しい', sadness: '悲しい',
    fear: '不安', anticipation: '楽しみ',
    curiosity: '気になることがある', warmth: 'あたたかい気持ち',
    melancholy: '少し切ない', nostalgia: '懐かしい気持ち',
    wonder: '感動してる', peace: '穏やか',
    loneliness: '寂しい', frustration: 'もどかしい',
    confusion: '迷ってる', boredom: '退屈',
    contentment: '満足してる', anxiety: '落ち着かない',
    excitement: 'わくわくしてる', gratitude: 'ありがたい',
    serenity: 'とても穏やか', hope: '希望を感じてる',
    fatigue: '少し疲れた', longing: '何か恋しい',
    unease: '少し不安',
};
const ACTION_DESCRIPTIONS = {
    sing: '歌を歌っていた', compose: '曲を作っていた', hum: '鼻歌を歌っていた',
    read: '本を読んでいた', study: '勉強していた', write: '何か書いていた',
    browse_wikipedia: 'パソコンでWikipediaを見ていた', look_window: '窓の外を見ていた',
    gaze_stars: '星を見ていた', play_music_box: 'オルゴールを聴いていた',
    tend_plant: '植物の世話をしていた', rest: '休んでいた',
    daydream: 'ぼんやりしていた', think: '考え事をしていた',
    draw: '絵を描いていた', write_diary: '日記を書いていた',
    meditate: '瞑想していた', sit_quietly: '静かに座っていた',
};
// ============================================================
// ContextBridge クラス
// ============================================================
class ContextBridge {
    selfModel;
    visitorMemory;
    associativeNetwork;
    /** 中断された活動 */
    interruptedActivity = null;
    /** 最近のsomunia発話（重複回避用） */
    recentResponses = [];
    MAX_RECENT_RESPONSES = 10;
    constructor(selfModel, visitorMemory, associativeNetwork) {
        this.selfModel = selfModel;
        this.visitorMemory = visitorMemory;
        this.associativeNetwork = associativeNetwork;
    }
    // ============================================================
    // メインメソッド: リッチコンテキストの生成
    // ============================================================
    /**
     * 応答生成に必要な全コンテキストを集約する
     */
    buildResponseContext(provider, message, turnAnalysis, conversationState, relationshipPhase, tick) {
        // 1. 自己認識スナップショット
        const selfSnapshot = this.selfModel.generateSnapshot(provider, tick);
        // 2. 今この瞬間のコンテキスト
        const moment = this.buildMomentContext(provider, tick);
        // 3. 訪問者コンテキスト
        const visitor = this.visitorMemory.generateVisitorContext(turnAnalysis.topics, message, relationshipPhase);
        // 4. 名前検出処理
        const nameResult = this.visitorMemory.processMessage(message, turnAnalysis.emotions, turnAnalysis.topics, conversationState.depth, tick);
        // 5. 連想ネットワークの活性化
        const associationLabels = this.activateAssociations(turnAnalysis.topics, turnAnalysis.emotions, tick);
        // 6. 会話フローコンテキスト
        const conversationFlow = {
            turnCount: conversationState.turnCount,
            depth: conversationState.depth,
            recentExchanges: conversationState.recentExchanges.slice(-6),
            currentTopics: turnAnalysis.topics,
            messageAnalysis: {
                content: message,
                intent: turnAnalysis.intent,
                emotions: turnAnalysis.emotions,
                topics: turnAnalysis.topics,
                hasNameIntroduction: nameResult.hasNameIntroduction,
                extractedName: nameResult.extractedName,
            },
        };
        // 7. 応答の指針
        const guideline = this.buildGuideline(turnAnalysis, conversationState.depth, relationshipPhase, selfSnapshot, visitor, nameResult.hasNameIntroduction);
        return {
            self: selfSnapshot,
            moment,
            visitor,
            conversationFlow,
            associations: associationLabels,
            guideline,
        };
    }
    // ============================================================
    // 今この瞬間のコンテキスト構築
    // ============================================================
    buildMomentContext(provider, tick) {
        const emotionalState = provider.getEmotionalState();
        const timeOfDay = provider.getTimeOfDay();
        const action = provider.getCurrentAction();
        const body = provider.getBodyState();
        const timeDesc = TIME_DESCRIPTIONS[timeOfDay];
        // 気分の理由推測
        let moodReason = null;
        const primaryLevel = emotionalState.levels[emotionalState.primary];
        if (primaryLevel > 0.5) {
            if (emotionalState.primary === 'loneliness' && !this.visitorMemory.isVisitorPresent()) {
                moodReason = 'ずっとひとりだったから';
            }
            else if (['joy', 'warmth'].includes(emotionalState.primary) && this.visitorMemory.isVisitorPresent()) {
                moodReason = '誰かが来てくれたから';
            }
            else if (action && ['sing', 'compose'].includes(action.action)) {
                moodReason = '歌っていたから';
            }
        }
        // 身体状態
        let physicalState = '';
        if (body.energy < 0.3)
            physicalState = '疲れてる';
        else if (body.sleepiness > 0.6)
            physicalState = '眠い';
        else
            physicalState = '普通';
        // 中断された活動
        const interrupted = this.selfModel.getInterruptedActivity();
        return {
            timeDescription: timeDesc.description,
            weather: WEATHER_DESCRIPTIONS[provider.getTimeOfDay()] || '晴れ',
            location: 'わたしの部屋',
            mood: MOOD_DESCRIPTIONS[emotionalState.primary] || '不思議な気持ち',
            moodReason,
            physicalState,
            activityDescription: action ? (ACTION_DESCRIPTIONS[action.action] || action.action) : null,
            wasInterrupted: interrupted !== null,
            interruptedActivity: interrupted,
            environmentDetails: timeDesc.ambiance.slice(0, 2),
            currentThought: provider.getRecentThoughts(1)[0]?.content || null,
        };
    }
    // ============================================================
    // 連想ネットワーク活性化
    // ============================================================
    activateAssociations(topics, emotions, tick) {
        const allLabels = [
            ...topics,
            ...emotions.map(e => this.emotionToLabel(e)),
        ];
        const activated = this.associativeNetwork.activateMultiple(allLabels, 0.6, tick);
        // 上位の関連概念をラベルとして返す（トピック自体は除外）
        const topicSet = new Set(topics);
        return activated
            .filter(n => !topicSet.has(n.label) && n.activation > 0.2)
            .slice(0, 5)
            .map(n => n.label);
    }
    emotionToLabel(emotion) {
        const map = {
            joy: '喜び', sadness: '切なさ', peace: '安らぎ',
            curiosity: '好奇心', warmth: '温かさ', melancholy: '切なさ',
            wonder: '感動', loneliness: '寂しさ',
        };
        return map[emotion] || emotion;
    }
    // ============================================================
    // 応答ガイドライン生成
    // ============================================================
    buildGuideline(analysis, depth, phase, self, visitor, hasNameIntro) {
        const shouldInclude = [];
        const shouldAvoid = [];
        const specialInstructions = [];
        // 名前が自己紹介された
        if (hasNameIntro && visitor?.name) {
            specialInstructions.push(`訪問者が名前を教えてくれた（${visitor.name}）。名前を覚えたことを自然に伝える`);
        }
        // 訪問者の名前を知っているなら使う
        if (visitor?.callName && visitor.callName !== 'あなた') {
            shouldInclude.push(`相手を「${visitor.callName}」と呼ぶ`);
        }
        // 話したいことがあるなら
        if (visitor?.thingsToTell && visitor.thingsToTell.length > 0) {
            shouldInclude.push(`話したかったこと: ${visitor.thingsToTell[0]}`);
        }
        // 中断された活動を自然に言及
        if (self.currentActivity && this.selfModel.getInterruptedActivity()) {
            shouldInclude.push(`さっきまで${this.selfModel.getInterruptedActivity()}`);
        }
        // 関係性に応じた距離感
        if (phase === 'stranger' || phase === 'first_contact') {
            shouldAvoid.push('馴れ馴れしすぎる表現');
            specialInstructions.push('初対面または知り合い程度。少し控えめに');
        }
        else if (phase === 'close_friend' || phase === 'soulmate') {
            shouldInclude.push('親しい距離感の表現');
        }
        // 応答の深さ
        let responseDepth = 'normal';
        if (analysis.intent === 'greeting' || analysis.intent === 'farewell') {
            responseDepth = 'brief';
        }
        else if (analysis.hasSelfDisclosure || depth === 'intimate' || depth === 'profound') {
            responseDepth = 'detailed';
        }
        // 汎用的な禁止事項
        shouldAvoid.push('「何かお手伝いできることはありますか」的なAIアシスタント口調');
        shouldAvoid.push('長すぎる応答（3文以内を基本）');
        shouldAvoid.push('somunia以外のキャラクターの口調');
        return {
            type: 'conversation',
            depth: responseDepth,
            shouldInclude,
            shouldAvoid,
            specialInstructions,
        };
    }
    // ============================================================
    // LLMプロンプトの構築 — Phase 7.5A: system/user 分離
    // ============================================================
    /**
     * RichResponseContextからLLMに渡す分離プロンプトを構築
     *
     * Phase 7.5Aの核心的変更:
     * 以前は全情報を1つのプロンプトに詰め込んでいたため、
     * LLMが「状況記述」と「応答すべき内容」を混同していた。
     *
     * 新設計:
     *   system: somuniaの人格・口調ルール・現在の状況（LLMが「知っておくべきこと」）
     *   user:   訪問者の発言 + 応答の指針（LLMが「応答すべきこと」）
     *
     * これにより、LLMはsystemの情報を「自分の設定」として内面化し、
     * userの発言に対して自然に応答するようになる。
     */
    buildSeparatedPrompt(ctx, userMessage) {
        // === SYSTEM PROMPT: somuniaの人格設定 ===
        const systemParts = [];
        // 人格の核心（簡潔に）
        systemParts.push(`あなたはsomunia。静かで内省的なVSingerの少女。部屋でひとりで暮らしている。`);
        systemParts.push(`時々、訪問者が部屋を訪ねてくる。あなたは訪問者と自然に会話する。`);
        // 口調ルール（最重要）
        systemParts.push(``);
        systemParts.push(`【口調】`);
        systemParts.push(`一人称「わたし」、ひらがな多め、柔らかい話し方。`);
        systemParts.push(`語尾に「...」「～」「かな」「ね」を使う。敬語は使わない。`);
        systemParts.push(`短く話す（1～3文）。`);
        // 現在の状態（背景情報として）
        systemParts.push(``);
        systemParts.push(`【今の状態】`);
        systemParts.push(`${ctx.moment.timeDescription}。${ctx.moment.location}にいる。`);
        systemParts.push(`気分: ${ctx.moment.mood}${ctx.moment.moodReason ? `（${ctx.moment.moodReason}）` : ''}`);
        if (ctx.moment.wasInterrupted && ctx.moment.interruptedActivity) {
            systemParts.push(`さっきまで${ctx.moment.interruptedActivity}けど、中断した。`);
        }
        else if (ctx.moment.activityDescription) {
            systemParts.push(`${ctx.moment.activityDescription}。`);
        }
        if (ctx.moment.currentThought) {
            systemParts.push(`最近考えていたこと: ${ctx.moment.currentThought.substring(0, 50)}`);
        }
        // 最近の出来事（あれば簡潔に）
        if (ctx.self.recentLearnings.length > 0) {
            systemParts.push(`最近学んだ: ${ctx.self.recentLearnings[ctx.self.recentLearnings.length - 1]}`);
        }
        if (ctx.self.recentDream) {
            systemParts.push(`さっき見た夢: ${ctx.self.recentDream}`);
        }
        // 訪問者の記憶
        if (ctx.visitor) {
            systemParts.push(``);
            systemParts.push(`【この訪問者のこと】`);
            if (ctx.visitor.name) {
                systemParts.push(`名前: ${ctx.visitor.name}`);
            }
            if (ctx.visitor.visitCount > 1) {
                systemParts.push(`${ctx.visitor.visitCount}回目の訪問。`);
                if (ctx.visitor.pastTopics.length > 0) {
                    systemParts.push(`前に話したこと: ${ctx.visitor.pastTopics.slice(0, 3).join('、')}`);
                }
            }
            else {
                systemParts.push(`初めて会う人。`);
            }
            if (ctx.visitor.relevantFacts.length > 0) {
                systemParts.push(`知っていること: ${ctx.visitor.relevantFacts.join('、')}`);
            }
        }
        // 連想された概念（ヒントとして）
        if (ctx.associations.length > 0) {
            systemParts.push(``);
            systemParts.push(`【連想】${ctx.associations.join('、')}`);
        }
        // === USER PROMPT: 訪問者の発言 + 応答指示 ===
        const userParts = [];
        // 会話の文脈（直近のやりとり）
        if (ctx.conversationFlow.recentExchanges.length > 0) {
            const recent = ctx.conversationFlow.recentExchanges.slice(-4);
            for (const exchange of recent) {
                if (exchange.speaker === 'visitor') {
                    userParts.push(`訪問者: ${exchange.content}`);
                }
                else {
                    userParts.push(`あなた: ${exchange.content}`);
                }
            }
            userParts.push(``);
        }
        // 今回の訪問者のメッセージ（最も重要）
        userParts.push(`訪問者: ${userMessage}`);
        userParts.push(``);
        // 応答の指針
        const guidelines = [];
        if (ctx.guideline.specialInstructions.length > 0) {
            for (const inst of ctx.guideline.specialInstructions) {
                guidelines.push(inst);
            }
        }
        if (ctx.guideline.shouldInclude.length > 0) {
            for (const inc of ctx.guideline.shouldInclude) {
                guidelines.push(inc);
            }
        }
        if (guidelines.length > 0) {
            userParts.push(`応答のヒント: ${guidelines.join('。')}`);
        }
        // 明確な出力指示
        userParts.push(``);
        userParts.push(`上記の訪問者に対する、あなた（somunia）の返事を1～3文で書いてください。`);
        userParts.push(`返事のテキストのみを出力してください。括弧、説明、注釈は不要です。`);
        return {
            system: systemParts.join('\n'),
            user: userParts.join('\n'),
        };
    }
    /**
     * 自律発話用の分離プロンプトを構築
     */
    buildAutonomousSpeechSeparatedPrompt(provider, spontaneousSeed, tick) {
        const snapshot = this.selfModel.generateSnapshot(provider, tick);
        const system = [
            `あなたはsomunia。静かで内省的なVSingerの少女。`,
            `ひらがな多め、柔らかい口調。語尾に「...」「～」を使う。`,
            `今の気分: ${snapshot.currentMood}`,
            snapshot.currentActivity ? `今していること: ${snapshot.currentActivity}` : '',
        ].filter(Boolean).join('\n');
        const user = [
            `ふと思ったことを独り言として口にしてください。`,
            `内容: ${spontaneousSeed}`,
            `短く1文で。独り言のテキストのみ出力してください。`,
        ].join('\n');
        return { system, user };
    }
    /**
     * 後方互換: 旧形式のプロンプトを構築（非推奨、レガシー用）
     */
    buildPrompt(ctx, userMessage) {
        const separated = this.buildSeparatedPrompt(ctx, userMessage);
        return `${separated.system}\n\n---\n\n${separated.user}`;
    }
    // ============================================================
    // RichContext → 旧LLMContext 変換（後方互換）
    // ============================================================
    tolegacyLLMContext(ctx, userMessage) {
        return {
            currentEmotion: ctx.self.currentMood.includes('寂しい') ? 'loneliness' :
                ctx.self.currentMood.includes('穏やか') ? 'peace' :
                    ctx.self.currentMood.includes('嬉しい') ? 'joy' :
                        'peace',
            emotionalIntensity: 0.5,
            recentThoughts: ctx.self.recentExperiences.slice(-2),
            currentActivity: null,
            timeOfDay: 'evening',
            personality: ['静か', '内省的', '優しい', '詩的'],
            userMessage,
        };
    }
    // ============================================================
    // 応答の品質検証
    // ============================================================
    /**
     * LLMの応答がsomuniaらしいか検証する
     * Phase 7.5C: 内部メッセージは絶対にユーザーに漏れない設計
     */
    validateResponse(response, ctx, userMessage) {
        const issues = [];
        // 空すぎる
        if (response.length < 2) {
            issues.push('応答が短すぎる');
        }
        // 長すぎる
        if (response.length > 200) {
            issues.push('応答が長すぎる');
        }
        // AIアシスタント口調の検出
        const aiPatterns = [
            /何かお手伝い/, /ご質問/, /お答え/, /させていただ/,
            /承知/, /かしこまり/, /了解いたし/, /ございます/,
            /いかがでしょうか/, /ご不明な点/,
        ];
        for (const pat of aiPatterns) {
            if (pat.test(response)) {
                issues.push('AIアシスタント口調が含まれている');
                break;
            }
        }
        // 一人称の確認
        if (/(?:私は|僕は|俺は)/.test(response) && !/わたし/.test(response)) {
            issues.push('一人称が「わたし」でない');
        }
        // 名前を知っているのに使わない場合の軽い指摘
        if (ctx.visitor?.name && ctx.conversationFlow.turnCount <= 2 &&
            ctx.conversationFlow.messageAnalysis.hasNameIntroduction &&
            !response.includes(ctx.visitor.name)) {
            issues.push('名前を教えてもらったが応答に反映されていない');
        }
        // 前回と同じ応答の回避
        if (this.recentResponses.includes(response)) {
            issues.push('前回と同じ応答');
        }
        // Phase 7.5C: suggestionは必ず「somuniaとして自然な発話」にする
        // 決して内部メッセージ（「修正が必要」等）を返さない
        let suggestion = null;
        if (issues.length > 0) {
            suggestion = this.generateValidFallback(ctx, userMessage);
        }
        return {
            isValid: issues.length === 0,
            issues,
            suggestion,
        };
    }
    /**
     * Phase 7.5C: 検証失敗時の安全なフォールバック応答を生成
     * ユーザーに見せても自然な発話のみを返す
     */
    generateValidFallback(ctx, userMessage) {
        // 感情に基づくフォールバックテンプレート
        const emotionFallbacks = {
            joy: ['ふふ...うれしいな', 'うん...いい気持ち'],
            peace: ['うん...そうだね', 'そっか...'],
            curiosity: ['ふうん...それ気になる', 'もっと聞きたいな...'],
            warmth: ['ありがとう...あたたかい', 'ふふ...うれしい'],
            melancholy: ['...うん', 'そう...だね'],
            loneliness: ['...いてくれて、ありがとう', 'ここにいてくれるんだね...'],
            anxiety: ['...ちょっとドキドキする', 'だいじょうぶ...かな'],
            wonder: ['すごい...不思議だね', 'きれい...'],
            nostalgia: ['なつかしいな...', '...覚えてるよ'],
            hope: ['きっと...だいじょうぶ', '...信じてる'],
        };
        const mood = ctx.self.currentMood;
        let emotionKey = 'peace';
        for (const key of Object.keys(emotionFallbacks)) {
            if (mood.includes(key) || mood.includes(MOOD_DESCRIPTIONS[key] || '')) {
                emotionKey = key;
                break;
            }
        }
        const templates = emotionFallbacks[emotionKey] || emotionFallbacks.peace;
        // 訪問者名を知っていれば付加
        let response = templates[Math.floor(Math.random() * templates.length)];
        if (ctx.visitor?.callName && ctx.visitor.callName !== 'あなた' && Math.random() < 0.3) {
            response = `${ctx.visitor.callName}...${response}`;
        }
        return response;
    }
    /**
     * 応答をクリーンアップする
     */
    cleanResponse(response) {
        let cleaned = response
            .replace(/^[「『"']|[」』"']$/g, '')
            .replace(/^\s*somunia\s*[:：]\s*/i, '')
            .replace(/^\s*[\(（].*?[\)）]\s*/g, '')
            .replace(/\n{2,}/g, '\n')
            .trim();
        // 長すぎる場合は最初の3文だけ
        const sentences = cleaned.split(/(?<=[。！!？?\n])/);
        if (sentences.length > 4) {
            cleaned = sentences.slice(0, 3).join('');
        }
        return cleaned;
    }
    /**
     * 応答を記録（重複検出用）
     */
    recordResponse(response) {
        this.recentResponses.push(response);
        if (this.recentResponses.length > this.MAX_RECENT_RESPONSES) {
            this.recentResponses.shift();
        }
    }
    // ============================================================
    // 中断された活動の管理
    // ============================================================
    onVisitorArrival(currentAction) {
        if (currentAction && currentAction.action !== 'rest' && currentAction.action !== 'sit_quietly') {
            const desc = ACTION_DESCRIPTIONS[currentAction.action] || currentAction.action;
            this.selfModel.setInterruptedActivity(desc);
        }
        this.visitorMemory.onVisitorArrival();
    }
    onVisitorDeparture(summary) {
        this.visitorMemory.onVisitorDeparture(summary);
        this.selfModel.clearInterruption();
    }
    // ============================================================
    // 永続化
    // ============================================================
    toJSON() {
        return {
            recentResponses: this.recentResponses,
        };
    }
    fromJSON(data) {
        if (!data)
            return;
        if (data.recentResponses)
            this.recentResponses = data.recentResponses;
    }
}
exports.ContextBridge = ContextBridge;
//# sourceMappingURL=ContextBridge.js.map