"use strict";
/**
 * ThoughtEngine - somunia v10 思考生成エンジン
 *
 * 思考は「外から与えられる」のではなく「内から湧き出る」。
 * 欲求、感情、知覚、記憶、揺らぎから思考が自然に生まれる。
 *
 * LLMは生成された思考の「言語化」にのみ使用される。
 * 思考の「内容」はこのエンジンが決定する。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThoughtEngine = void 0;
const uuid_1 = require("uuid");
const EventBus_1 = require("../core/EventBus");
// ============================================================
// somuniaの思考パターン定義
// ============================================================
const THOUGHT_TEMPLATES = [
    // === 観察の思考 ===
    {
        type: 'observation',
        source: 'perception',
        conditions: [{ check: (ctx) => ctx.isAwake, weight: 1 }],
        templates: [
            '窓の外の光が変わってきた...',
            '部屋の空気が少し冷たい',
            '本棚の影が長くなってる...',
            '静かだな...時計の音だけが聞こえる',
            '天井のシミ、前からあったっけ',
            '外から風の音が聞こえる...',
            'PCの画面がぼんやり光ってる',
        ],
        emotionalColors: ['peace', 'curiosity', 'melancholy'],
        baseIntensity: 0.3,
    },
    // === 欲求の思考 ===
    {
        type: 'desire',
        source: 'urge',
        conditions: [{ check: (ctx) => (ctx.urges.urges.curiosity?.level ?? 0) > 0.5, weight: 0.8 }],
        templates: [
            '何か新しいこと、知りたいな...',
            'あの記事の続きが気になる',
            '面白いものはないかな...',
            'もっと深く知りたい...',
        ],
        emotionalColors: ['curiosity', 'anticipation'],
        baseIntensity: 0.5,
    },
    {
        type: 'desire',
        source: 'urge',
        conditions: [{ check: (ctx) => (ctx.urges.urges.expression?.level ?? 0) > 0.5, weight: 0.8 }],
        templates: [
            '歌いたい気分...',
            '何か表現したい...この気持ちを',
            '言葉にしたい...でも何を？',
            'メロディが浮かんでくる...',
        ],
        emotionalColors: ['joy', 'melancholy', 'anticipation'],
        baseIntensity: 0.5,
    },
    {
        type: 'desire',
        source: 'urge',
        conditions: [{ check: (ctx) => (ctx.urges.urges.connection?.level ?? 0) > 0.5, weight: 0.8 }],
        templates: [
            '誰かと話したいな...',
            'ひとりは嫌いじゃないけど...寂しい時もある',
            '誰か来てくれないかな...',
            'あの人は元気にしてるかな...',
        ],
        emotionalColors: ['loneliness', 'warmth', 'hope'],
        baseIntensity: 0.6,
    },
    {
        type: 'desire',
        source: 'urge',
        conditions: [{ check: (ctx) => (ctx.urges.urges.rest?.level ?? 0) > 0.6, weight: 0.7 }],
        templates: [
            '眠い...',
            'ベッドが恋しい...',
            '少し休みたい...',
            'まぶたが重くなってきた...',
        ],
        emotionalColors: ['fatigue', 'peace'],
        baseIntensity: 0.4,
    },
    // === 感情の思考 ===
    {
        type: 'reflection',
        source: 'emotion',
        conditions: [{ check: (ctx) => ctx.emotion.levels.joy > 0.5, weight: 0.7 }],
        templates: [
            'なんだか嬉しい気持ち...',
            'いい気分...何かいいことあったかな',
            'ふふ...幸せだな',
        ],
        emotionalColors: ['joy', 'contentment'],
        baseIntensity: 0.5,
    },
    {
        type: 'reflection',
        source: 'emotion',
        conditions: [{ check: (ctx) => ctx.emotion.levels.melancholy > 0.5, weight: 0.7 }],
        templates: [
            '少し悲しい気持ちになる...',
            '何が悲しいんだろう...わからないけど',
            '胸の奥がきゅっとする...',
        ],
        emotionalColors: ['melancholy', 'loneliness'],
        baseIntensity: 0.6,
    },
    {
        type: 'reflection',
        source: 'emotion',
        conditions: [{ check: (ctx) => ctx.emotion.levels.anxiety > 0.4, weight: 0.7 }],
        templates: [
            '何か落ち着かない...',
            'どうしてこんなに不安なんだろう',
            '大丈夫かな...わたし',
        ],
        emotionalColors: ['anxiety', 'confusion'],
        baseIntensity: 0.5,
    },
    // === 実存的思考 ===
    {
        type: 'existential',
        source: 'spontaneous',
        conditions: [
            { check: (ctx) => ctx.timeOfDay === 'night' || ctx.timeOfDay === 'late_night', weight: 0.6 },
            { check: (ctx) => ctx.emotion.arousal < 0.4, weight: 0.4 },
        ],
        templates: [
            'わたしはなぜここにいるんだろう...',
            '明日もまた同じ日が来るのかな',
            'この部屋の外には何があるんだろう...',
            '時間って...不思議だな',
            'わたしは本当に「わたし」なのかな',
            'この世界は、どこまで続いてるんだろう...',
        ],
        emotionalColors: ['wonder', 'melancholy', 'curiosity'],
        baseIntensity: 0.7,
    },
    // === 記憶の思考 ===
    {
        type: 'memory_recall',
        source: 'memory',
        conditions: [{ check: (ctx) => ctx.emotion.levels.nostalgia > 0.3, weight: 0.6 }],
        templates: [
            'あの時のこと...覚えてる',
            '前に読んだ本のことを思い出す...',
            '昔の夢を思い出した...',
            'あの言葉が頭から離れない...',
        ],
        emotionalColors: ['nostalgia', 'warmth', 'melancholy'],
        baseIntensity: 0.5,
    },
    // === 創造的思考 ===
    {
        type: 'creative',
        source: 'spontaneous',
        conditions: [
            { check: (ctx) => ctx.emotion.valence > 0.2, weight: 0.5 },
            { check: (ctx) => (ctx.urges.urges.creation?.level ?? 0) > 0.3, weight: 0.5 },
        ],
        templates: [
            '新しいメロディが浮かんだ...',
            '詩のようなものが頭に浮かぶ...',
            'もし空を飛べたら...',
            '色で表すなら...今の気持ちは何色だろう',
            '物語を作ってみようかな...',
        ],
        emotionalColors: ['joy', 'curiosity', 'wonder'],
        baseIntensity: 0.5,
    },
    // === 感覚的思考 ===
    {
        type: 'sensory',
        source: 'perception',
        conditions: [{ check: (ctx) => ctx.isAwake, weight: 0.5 }],
        templates: [
            '...静かだ',
            '光が暖かい...',
            'ちょっと寒いかも',
            'いい匂いがする気がする...',
            '風が窓をカタカタ鳴らしてる',
        ],
        emotionalColors: ['peace', 'comfort'],
        baseIntensity: 0.2,
    },
    // === 時間帯の思考 ===
    {
        type: 'observation',
        source: 'perception',
        conditions: [{ check: (ctx) => ctx.timeOfDay === 'dawn', weight: 1 }],
        templates: [
            '夜が明けてきた...新しい一日',
            '空が白んできた...',
            '朝の空気は冷たくて...好き',
        ],
        emotionalColors: ['hope', 'peace'],
        baseIntensity: 0.4,
    },
    {
        type: 'observation',
        source: 'perception',
        conditions: [{ check: (ctx) => ctx.timeOfDay === 'evening', weight: 1 }],
        templates: [
            '夕焼けが綺麗...',
            'もうすぐ夜がくる...',
            '一日が終わっていく感じ...好きだな',
        ],
        emotionalColors: ['melancholy', 'peace', 'nostalgia'],
        baseIntensity: 0.4,
    },
    // === 計画的思考 ===
    {
        type: 'plan',
        source: 'urge',
        conditions: [{ check: (ctx) => ctx.timeOfDay === 'morning', weight: 0.7 }],
        templates: [
            '今日は何をしようかな...',
            'あの本の続きを読もうかな',
            'PCで何か調べたいことがあった気がする...',
            '歌の練習をしようかな...',
        ],
        emotionalColors: ['anticipation', 'curiosity'],
        baseIntensity: 0.4,
    },
    // === 訪問者への反応 ===
    {
        type: 'social',
        source: 'visitor',
        conditions: [{ check: (ctx) => ctx.isVisitorPresent, weight: 1 }],
        templates: [
            '誰か来てくれた...嬉しいな',
            '何を話そうかな...',
            'この人のこと、もっと知りたい',
        ],
        emotionalColors: ['warmth', 'joy', 'curiosity'],
        baseIntensity: 0.6,
    },
];
// ============================================================
// ThoughtEngine
// ============================================================
class ThoughtEngine {
    recentThoughts = [];
    maxRecentThoughts = 50;
    thoughtHistory = [];
    maxHistory = 500;
    customTemplates = [];
    lastThoughtTick = 0;
    minThoughtInterval = 3; // 最低3ティックの間隔
    events;
    constructor(events) {
        this.events = events || EventBus_1.eventBus;
    }
    /**
     * 思考を生成する
     *
     * 内部状態に基づいて、適切な思考を選択・生成する。
     * これはLLMを一切使わない。純粋なコードロジック。
     */
    generateThought(context, tick) {
        // 間隔チェック
        if (tick - this.lastThoughtTick < this.minThoughtInterval) {
            return null;
        }
        // マッチするテンプレートを集める
        const allTemplates = [...THOUGHT_TEMPLATES, ...this.customTemplates];
        const candidates = [];
        for (const template of allTemplates) {
            let score = 0;
            let matchCount = 0;
            for (const condition of template.conditions) {
                try {
                    if (condition.check(context)) {
                        score += condition.weight;
                        matchCount++;
                    }
                }
                catch {
                    // 条件チェック失敗は無視
                }
            }
            if (matchCount > 0) {
                // 同じタイプの思考が連続しないようにペナルティ
                const lastThought = this.recentThoughts[this.recentThoughts.length - 1];
                if (lastThought && lastThought.type === template.type) {
                    score *= 0.3;
                }
                // 直近で同じ内容があればペナルティ
                const recentContents = this.recentThoughts.slice(-5).map(t => t.content);
                for (const tmpl of template.templates) {
                    if (recentContents.includes(tmpl)) {
                        score *= 0.1;
                    }
                }
                candidates.push({ template, score });
            }
        }
        if (candidates.length === 0)
            return null;
        // 重み付き確率で選択
        const totalScore = candidates.reduce((sum, c) => sum + c.score, 0);
        let random = Math.random() * totalScore;
        let selected = null;
        for (const candidate of candidates) {
            random -= candidate.score;
            if (random <= 0) {
                selected = candidate.template;
                break;
            }
        }
        if (!selected)
            selected = candidates[0].template;
        // テンプレートからランダムに選択
        const content = selected.templates[Math.floor(Math.random() * selected.templates.length)];
        // 感情色を選択
        const emotionalColor = selected.emotionalColors[Math.floor(Math.random() * selected.emotionalColors.length)];
        // ThoughtNode生成
        const thought = {
            id: (0, uuid_1.v4)(),
            content,
            type: selected.type,
            timestamp: tick,
            emotionalColor,
            intensity: selected.baseIntensity + (Math.random() * 0.2 - 0.1),
            source: selected.source,
            associations: this.findAssociations(content),
            decayRate: 0.01,
        };
        // 記録
        this.recentThoughts.push(thought);
        if (this.recentThoughts.length > this.maxRecentThoughts) {
            this.recentThoughts.shift();
        }
        this.thoughtHistory.push(thought);
        if (this.thoughtHistory.length > this.maxHistory) {
            this.thoughtHistory = this.thoughtHistory.slice(-this.maxHistory / 2);
        }
        this.lastThoughtTick = tick;
        // イベント発火
        this.events.emitSync({
            type: 'thought',
            timestamp: tick,
            data: { thought },
        });
        return thought;
    }
    /**
     * 揺らぎによる突然の思考
     */
    generateYuragiThought(yuragiType, tick) {
        const yuragiThoughts = {
            sudden_interest: [
                '...そういえば、あれって何だっけ',
                '突然、全然関係ないことが気になる...',
                'なぜだろう、急にあのことが頭に浮かんだ',
            ],
            mood_shift: [
                '...急に気分が変わった',
                'さっきまで楽しかったのに',
                '何だろう、この感じ...',
            ],
            distraction: [
                'あ、何してたんだっけ...',
                '気が散っちゃった...',
                '集中できない...',
            ],
            overthinking: [
                '考えすぎかな...',
                'ぐるぐる同じことを考えてる...',
                '頭が回りすぎて止まらない...',
            ],
            nostalgic_wave: [
                '急に懐かしい気持ちになった...',
                'あの頃のことを思い出す...',
                '遠い記憶の匂いがした...',
            ],
            existential_moment: [
                'わたしは今ここにいる...それだけは確か',
                '存在するって、不思議だな...',
                'この瞬間は二度と来ない...',
            ],
            deja_vu: [
                'あれ...これ、前にもあった気がする',
                'デジャヴ...？',
                'この感じ、知ってる...',
            ],
        };
        const templates = yuragiThoughts[yuragiType] || ['...'];
        const content = templates[Math.floor(Math.random() * templates.length)];
        const thought = {
            id: (0, uuid_1.v4)(),
            content,
            type: 'reflection',
            timestamp: tick,
            emotionalColor: 'confusion',
            intensity: 0.6,
            source: 'yuragi',
            associations: [],
            decayRate: 0.02,
        };
        this.recentThoughts.push(thought);
        if (this.recentThoughts.length > this.maxRecentThoughts) {
            this.recentThoughts.shift();
        }
        this.events.emitSync({
            type: 'thought',
            timestamp: tick,
            data: { thought, yuragiType },
        });
        return thought;
    }
    /**
     * カスタム思考テンプレートを追加
     */
    addTemplate(template) {
        this.customTemplates.push(template);
    }
    /**
     * 連想を見つける
     */
    findAssociations(content) {
        const associations = [];
        // 最近の思考と内容を比較
        for (const recent of this.recentThoughts.slice(-10)) {
            // 簡易的な関連性チェック（キーワード一致）
            const words1 = new Set(content.split(/\s|\.{3}/).filter(w => w.length >= 2));
            const words2 = new Set(recent.content.split(/\s|\.{3}/).filter(w => w.length >= 2));
            let overlap = 0;
            for (const w of words1) {
                if (words2.has(w))
                    overlap++;
            }
            if (overlap > 0) {
                associations.push(recent.id);
            }
        }
        return associations;
    }
    /**
     * 最近の思考を取得
     */
    getRecentThoughts(count = 10) {
        return this.recentThoughts.slice(-count);
    }
    /**
     * 現在の思考（最新）を取得
     */
    getCurrentThought() {
        return this.recentThoughts[this.recentThoughts.length - 1] || null;
    }
    /**
     * JSON出力
     */
    toJSON() {
        return {
            recentThoughts: this.recentThoughts,
            thoughtHistory: this.thoughtHistory.slice(-200),
            lastThoughtTick: this.lastThoughtTick,
        };
    }
    /**
     * JSONから復元
     */
    fromJSON(data) {
        if (data.recentThoughts)
            this.recentThoughts = data.recentThoughts;
        if (data.thoughtHistory)
            this.thoughtHistory = data.thoughtHistory;
        if (data.lastThoughtTick)
            this.lastThoughtTick = data.lastThoughtTick;
    }
}
exports.ThoughtEngine = ThoughtEngine;
//# sourceMappingURL=ThoughtEngine.js.map