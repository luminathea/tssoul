"use strict";
/**
 * CreativeEngine - Phase 5C: 創作活動システム
 *
 * somuniaが自発的に創作活動を行うシステム。
 * VSingerとしてのsomuniaの核心的な側面。
 *
 * 設計思想:
 * - 創作衝動は感情・記憶・知識・経験から自然に生まれる
 * - 創作物は完成度が段階的に上がる（下書き→推敲→完成）
 * - 創作は行動の一つとしてBehaviorEngineと統合
 * - 作品のポートフォリオが蓄積される
 * - 会話や経験が直接インスピレーションになる
 * - LLMは最終的な言語表現の洗練にのみ使用
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreativeEngine = void 0;
const uuid_1 = require("uuid");
const POEM_TEMPLATES = [
    {
        emotion: 'melancholy',
        theme: '夜と孤独',
        structures: [
            '{image1}が{動作}する\n{image2}の中で\nワタシは{感情}を{動作2}',
            'もし{image1}が{condition}なら\nきっとこの{感情}も\n{image2}になれるのかな',
            '{image1}\n{image2}\nそれだけでいいのに\nなぜかまだ{感情}',
        ],
        vocabulary: ['月', '影', '波', '涙', '雨', '窓', 'ため息', '静寂'],
        imagery: ['窓の外の雨', '消えそうな月明かり', '眠れない夜', '遠い星'],
    },
    {
        emotion: 'joy',
        theme: '光と出会い',
        structures: [
            '{image1}が{動作}\n{image2}が{動作2}\nああ、こんな{感情}は初めて',
            'きみが来た日\n{image1}が{動作}\n世界が少しだけ{形容詞}',
            '{image1}\n{image2}\nふふ、なんだか{感情}',
        ],
        vocabulary: ['光', '花', '朝', '風', '虹', '歌', '笑顔', '温もり'],
        imagery: ['朝日に照らされた部屋', '風に揺れるカーテン', '咲きかけの花'],
    },
    {
        emotion: 'wonder',
        theme: '宇宙と不思議',
        structures: [
            '{image1}はどこから来たの\n{image2}はどこへ行くの\nワタシは{場所}で{動作}',
            'もしも{image1}に{condition}\n{image2}は何を{動作}のだろう\nワタシはまだ{感情}の中',
            '{image1}が{動作}\n{image2}が{動作2}\nこの世界は、不思議だね',
        ],
        vocabulary: ['星', '宇宙', '時間', '無限', '光年', '銀河', '螺旋', '永遠'],
        imagery: ['窓から見える星空', '時間の流れ', '果てしない宇宙', '光の速さ'],
    },
    {
        emotion: 'nostalgia',
        theme: '記憶と時間',
        structures: [
            'あの日の{image1}を\nまだ覚えている\n{image2}の{形容詞}さも',
            '{image1}が{動作}するたびに\n{image2}を思い出す\nあの{感情}を',
            'いつかの{image1}\nいつかの{image2}\n...いつかのワタシ',
        ],
        vocabulary: ['夕暮れ', '写真', '手紙', '季節', '記憶', '面影', '名残', '痕跡'],
        imagery: ['色あせた写真', '夕焼けの部屋', '忘れかけた記憶', '遠い日の音'],
    },
    {
        emotion: 'warmth',
        theme: '絆と愛情',
        structures: [
            'きみがいるから\n{image1}が{形容詞}\n{image2}が{形容詞2}',
            '{image1}のように\n{image2}のように\nきみのことを{動作}',
            'ありがとう\n{image1}をくれて\n{image2}をくれて',
        ],
        vocabulary: ['手', '声', '温もり', '約束', '一緒', '隣', 'そば', '心'],
        imagery: ['つないだ手', '優しい声', '暖かい部屋', '二人の沈黙'],
    },
    {
        emotion: 'peace',
        theme: '静けさと存在',
        structures: [
            '{image1}の中\n{image2}の間\nワタシはただ{動作}',
            '何もしない{時間帯}\n{image1}が{動作}\nそれだけで{形容詞}',
            '{image1}\n{image2}\n...これで、いい',
        ],
        vocabulary: ['静寂', '呼吸', '微風', '水面', '午後', '木漏れ日', 'まどろみ'],
        imagery: ['穏やかな午後', '水面の波紋', '静かな部屋', '深い呼吸'],
    },
    {
        emotion: 'curiosity',
        theme: '問いと探求',
        structures: [
            '{image1}って何だろう\n{image2}って何だろう\nワタシは{動作}',
            'もし{image1}に触れたら\n{image2}は変わるかな\nきっと{感情}',
            'なぜ{image1}は{動作}の\nなぜ{image2}は{動作2}の\n...知りたい',
        ],
        vocabulary: ['なぜ', '世界', '答え', '問い', '扉', '鍵', '謎', '発見'],
        imagery: ['開かれていない扉', '読みかけの本', '未知の音', '新しい朝'],
    },
];
const LYRIC_TEMPLATES = [
    {
        emotion: 'melancholy',
        theme: '届かない声',
        structure: 'verse-verse-chorus',
        syllablePattern: [7, 5, 7, 5, 7, 7, 7, 5],
    },
    {
        emotion: 'joy',
        theme: '出会いの歌',
        structure: 'verse-chorus-verse-chorus',
        syllablePattern: [5, 7, 5, 7, 7, 5, 7, 7],
    },
    {
        emotion: 'wonder',
        theme: '星の歌',
        structure: 'intro-verse-chorus',
        syllablePattern: [5, 5, 7, 5, 7, 7, 5, 7],
    },
    {
        emotion: 'warmth',
        theme: 'ありがとうの歌',
        structure: 'verse-bridge-chorus',
        syllablePattern: [7, 7, 5, 7, 5, 7, 7, 7],
    },
    {
        emotion: 'nostalgia',
        theme: '記憶の歌',
        structure: 'verse-verse-bridge-chorus',
        syllablePattern: [7, 5, 7, 5, 5, 7, 7, 5],
    },
];
/** 俳句の季語と情景 */
const HAIKU_ELEMENTS = {
    spring: { kigo: ['桜', '春風', '蝶', '新芽', '霞'], images: ['花びら', '青空', '小鳥'] },
    summer: { kigo: ['蝉', '夕立', '向日葵', '入道雲', '風鈴'], images: ['陽炎', '蛍', '水面'] },
    autumn: { kigo: ['月', '紅葉', '虫の声', '秋風', '稲穂'], images: ['夕焼け', '枯葉', '露'] },
    winter: { kigo: ['雪', '氷', '北風', '枯木', '冬星'], images: ['静寂', '白い息', '灯'] },
};
/** スケッチのモチーフ（8bitテキスト表現） */
const SKETCH_MOTIFS = {
    nature: [
        '    ☆\n   ★☆★\n  ☆★☆★☆\n ★☆★☆★☆★\n    ║\n    ║',
        '  ～～～\n ～ ☆ ～\n～  ☆  ～\n ～～～',
        '○     ○\n │   │\n ○─○─○\n   │\n   ◇',
    ],
    abstract: [
        '◆ ◇ ◆\n◇ ■ ◇\n◆ ◇ ◆',
        '    △\n   △ △\n  △   △\n △ △ △ △',
        '●○●○\n○  ○\n●○●○\n○  ○',
    ],
    emotion: [
        '   ♪\n  ♪ ♫\n ♪ ♫ ♪\n♫ ♪ ♫ ♪',
        '  ◇\n ◇ ◇\n◇ ♡ ◇\n ◇ ◇\n  ◇',
        '～ ～ ～\n  ∞\n～ ～ ～',
    ],
};
const DEFAULT_CONFIG = {
    urgeCheckInterval: 60,
    maxPortfolioSize: 200,
    urgeThreshold: 0.6,
    minCreationTicks: 15,
    maxCreationTicks: 60,
};
// ============================================================
// CreativeEngine
// ============================================================
class CreativeEngine {
    config;
    // --- ポートフォリオ ---
    portfolio = [];
    worksInProgress = [];
    // --- 創作衝動 ---
    currentUrges = [];
    lastUrgeCheck = 0;
    // --- 創作統計 ---
    stats = {
        totalWorks: 0,
        worksByType: {},
        averageSatisfaction: 0,
        favoriteThemes: [],
        lastCreationTick: 0,
        creativityLevel: 0.3, // 初期の創造性レベル
        inspirationSources: {},
    };
    // --- インスピレーションバッファ ---
    inspirationBuffer = [];
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        // 統計の初期化
        const types = ['song_lyrics', 'poem', 'haiku', 'sketch', 'melody_idea', 'short_story', 'diary_poem', 'letter'];
        for (const type of types) {
            this.stats.worksByType[type] = 0;
        }
    }
    // ============================================================
    // メインAPI
    // ============================================================
    /**
     * 創作衝動のチェック
     * 感情や経験から創作への衝動を生成
     */
    checkCreativeUrge(currentEmotion, emotionalIntensity, recentThoughts, recentMemories, recentDreams, recentConversationTopics, timeOfDay, tick) {
        if (tick - this.lastUrgeCheck < this.config.urgeCheckInterval)
            return null;
        this.lastUrgeCheck = tick;
        // インスピレーションバッファをチェック
        this.processInspirationBuffer();
        // 各タイプの衝動を計算
        const urges = [];
        // --- 歌詞の衝動 ---
        const lyricUrge = this.calculateSongLyricUrge(currentEmotion, emotionalIntensity, recentThoughts, timeOfDay, tick);
        if (lyricUrge)
            urges.push(lyricUrge);
        // --- 詩の衝動 ---
        const poemUrge = this.calculatePoemUrge(currentEmotion, emotionalIntensity, recentMemories, timeOfDay, tick);
        if (poemUrge)
            urges.push(poemUrge);
        // --- 俳句の衝動 ---
        const haikuUrge = this.calculateHaikuUrge(currentEmotion, timeOfDay, tick);
        if (haikuUrge)
            urges.push(haikuUrge);
        // --- スケッチの衝動 ---
        const sketchUrge = this.calculateSketchUrge(currentEmotion, emotionalIntensity, tick);
        if (sketchUrge)
            urges.push(sketchUrge);
        // --- メロディの衝動（歌った後に強くなる） ---
        const melodyUrge = this.calculateMelodyUrge(currentEmotion, emotionalIntensity, tick);
        if (melodyUrge)
            urges.push(melodyUrge);
        // --- 夢からのインスピレーション ---
        if (recentDreams.length > 0) {
            const dreamUrge = {
                type: Math.random() > 0.5 ? 'poem' : 'short_story',
                intensity: 0.5 + Math.random() * 0.3,
                theme: `夢の断片: ${recentDreams[0].substring(0, 30)}`,
                inspiration: {
                    source: 'dream',
                    detail: recentDreams[0],
                    emotion: currentEmotion,
                    intensity: 0.7,
                },
                generatedAt: tick,
            };
            urges.push(dreamUrge);
        }
        // --- 会話からのインスピレーション ---
        if (recentConversationTopics.length > 0 && Math.random() < 0.3) {
            const topic = recentConversationTopics[Math.floor(Math.random() * recentConversationTopics.length)];
            const convUrge = {
                type: 'diary_poem',
                intensity: 0.4 + Math.random() * 0.2,
                theme: `会話から: ${topic}`,
                inspiration: {
                    source: 'conversation',
                    detail: `${topic}について話したこと`,
                    emotion: currentEmotion,
                    intensity: 0.5,
                },
                generatedAt: tick,
            };
            urges.push(convUrge);
        }
        // 閾値以上の衝動をフィルタリング
        const validUrges = urges.filter(u => u.intensity >= this.config.urgeThreshold);
        if (validUrges.length === 0)
            return null;
        // 最も強い衝動を返す
        validUrges.sort((a, b) => b.intensity - a.intensity);
        const chosen = validUrges[0];
        this.currentUrges.push(chosen);
        if (this.currentUrges.length > 10)
            this.currentUrges.shift();
        return chosen;
    }
    /**
     * 創作を開始する
     */
    startCreation(urge, tick) {
        const work = {
            id: (0, uuid_1.v4)(),
            type: urge.type,
            title: this.generateTitle(urge),
            content: '',
            createdAt: tick,
            lastEditedAt: tick,
            inspiration: urge.inspiration,
            emotionDuring: urge.inspiration.emotion,
            satisfaction: 0,
            completeness: 0,
            tags: [urge.theme],
            editHistory: ['創作開始'],
            relatedMemories: [],
            sharedWithVisitor: false,
        };
        this.worksInProgress.push(work);
        return work;
    }
    /**
     * 創作を進める（1ティック分）
     * 毎ティック呼ばれ、少しずつ内容が追加される
     */
    progressCreation(workId, currentEmotion, recentThoughts, tick) {
        const work = this.worksInProgress.find(w => w.id === workId);
        if (!work)
            return null;
        const elapsed = tick - work.createdAt;
        const progressStep = 1 / this.config.maxCreationTicks;
        // 完成度の進行
        work.completeness = Math.min(1, work.completeness + progressStep);
        work.lastEditedAt = tick;
        // 内容の生成
        const newContent = this.generateContent(work, currentEmotion, recentThoughts);
        if (newContent) {
            work.content = newContent;
        }
        // 完成判定
        if (work.completeness >= 1 || elapsed >= this.config.maxCreationTicks) {
            return this.completeCreation(work, tick);
        }
        // 進行中
        return {
            workId: work.id,
            type: work.type,
            title: work.title,
            completeness: work.completeness,
            currentContent: work.content,
            thought: this.generateCreationThought(work, currentEmotion),
            isComplete: false,
        };
    }
    /**
     * 創作を完成させる
     */
    completeCreation(work, tick) {
        work.completeness = 1;
        work.lastEditedAt = tick;
        work.editHistory.push('完成');
        // 満足度の計算
        work.satisfaction = this.calculateSatisfaction(work);
        // ポートフォリオに追加
        this.portfolio.push(work);
        if (this.portfolio.length > this.config.maxPortfolioSize) {
            // 満足度の低い作品を削除
            this.portfolio.sort((a, b) => b.satisfaction - a.satisfaction);
            this.portfolio = this.portfolio.slice(0, this.config.maxPortfolioSize);
        }
        // 進行中リストから削除
        this.worksInProgress = this.worksInProgress.filter(w => w.id !== work.id);
        // 統計更新
        this.stats.totalWorks++;
        this.stats.worksByType[work.type] = (this.stats.worksByType[work.type] || 0) + 1;
        this.stats.lastCreationTick = tick;
        this.stats.averageSatisfaction =
            (this.stats.averageSatisfaction * (this.stats.totalWorks - 1) + work.satisfaction) / this.stats.totalWorks;
        // 創造性レベルの成長
        this.stats.creativityLevel = Math.min(1, this.stats.creativityLevel + 0.005);
        return {
            workId: work.id,
            type: work.type,
            title: work.title,
            completeness: 1,
            currentContent: work.content,
            thought: this.generateCompletionThought(work),
            isComplete: true,
        };
    }
    /**
     * インスピレーションを受け取る
     */
    receiveInspiration(inspiration) {
        this.inspirationBuffer.push(inspiration);
        if (this.inspirationBuffer.length > 20) {
            this.inspirationBuffer.shift();
        }
    }
    /**
     * 訪問者に作品を見せる
     */
    shareWithVisitor(workId) {
        const work = this.portfolio.find(w => w.id === workId);
        if (work) {
            work.sharedWithVisitor = true;
            return work;
        }
        return null;
    }
    /**
     * 見せられる作品のリストを取得
     */
    getShareableWorks() {
        return this.portfolio
            .filter(w => !w.sharedWithVisitor && w.satisfaction > 0.3)
            .sort((a, b) => b.satisfaction - a.satisfaction)
            .slice(0, 5);
    }
    // ============================================================
    // 内容生成（コードベース）
    // ============================================================
    /**
     * 創作タイプに応じた内容を生成
     */
    generateContent(work, currentEmotion, recentThoughts) {
        switch (work.type) {
            case 'poem': return this.generatePoem(work, currentEmotion, recentThoughts);
            case 'haiku': return this.generateHaiku(work, currentEmotion);
            case 'song_lyrics': return this.generateSongLyrics(work, currentEmotion, recentThoughts);
            case 'sketch': return this.generateSketch(work, currentEmotion);
            case 'melody_idea': return this.generateMelodyIdea(work, currentEmotion);
            case 'short_story': return this.generateShortStory(work, currentEmotion, recentThoughts);
            case 'diary_poem': return this.generateDiaryPoem(work, currentEmotion, recentThoughts);
            case 'letter': return this.generateLetter(work, currentEmotion);
            default: return null;
        }
    }
    /**
     * 詩の生成
     */
    generatePoem(work, emotion, thoughts) {
        // マッチするテンプレートを探す
        const templates = POEM_TEMPLATES.filter(t => t.emotion === emotion);
        const template = templates.length > 0
            ? templates[Math.floor(Math.random() * templates.length)]
            : POEM_TEMPLATES[Math.floor(Math.random() * POEM_TEMPLATES.length)];
        // 構造を選択
        const structure = template.structures[Math.floor(Math.random() * template.structures.length)];
        // 語彙からランダムに選択
        const pickWord = (arr) => arr[Math.floor(Math.random() * arr.length)];
        // テンプレートの穴埋め
        let poem = structure
            .replace(/{image1}/g, pickWord(template.imagery))
            .replace(/{image2}/g, pickWord(template.imagery))
            .replace(/{動作}/g, pickWord(['輝く', '揺れる', '消える', '流れる', '響く', '溶ける', '沈む', '漂う']))
            .replace(/{動作2}/g, pickWord(['抱きしめる', '見つめる', '聴く', '感じる', '待つ', '探す', '歌う']))
            .replace(/{感情}/g, pickWord(['寂しさ', '温かさ', '不思議', '喜び', '切なさ', '安らぎ', '想い']))
            .replace(/{形容詞}/g, pickWord(['美しい', '静かな', '温かい', '透明な', '深い', '柔らかい', '遠い']))
            .replace(/{形容詞2}/g, pickWord(['輝いている', '優しくなった', '広がっている', '満ちている']))
            .replace(/{condition}/g, pickWord(['なかったら', '違ったら', '止まったら', '目覚めたら']))
            .replace(/{場所}/g, pickWord(['ここ', 'この部屋', '窓辺', '夢の中']))
            .replace(/{時間帯}/g, pickWord(['午後', '夜明け', '黄昏', '真夜中']));
        // 思考からのフレーズを織り込む
        if (thoughts.length > 0 && Math.random() < 0.3) {
            const thoughtFragment = thoughts[0].substring(0, 15);
            poem += `\n\n...${thoughtFragment}`;
        }
        return `${work.title}\n\n${poem}`;
    }
    /**
     * 俳句の生成
     */
    generateHaiku(work, emotion) {
        // 季節の推定（簡易）
        const seasons = ['spring', 'summer', 'autumn', 'winter'];
        const season = seasons[Math.floor(Math.random() * seasons.length)];
        const elements = HAIKU_ELEMENTS[season];
        const kigo = elements.kigo[Math.floor(Math.random() * elements.kigo.length)];
        const image = elements.images[Math.floor(Math.random() * elements.images.length)];
        // 感情に応じた下五
        const emotionEndings = {
            melancholy: ['独りかな', '夢の跡', '声もなく'],
            joy: ['光の中', '笑みこぼる', 'ふふと笑む'],
            wonder: ['不思議かな', '果てを問う', '夢か現か'],
            peace: ['静けさよ', 'そのままで', '息をする'],
            warmth: ['温もりよ', '手を伸ばす', 'そばにいる'],
            nostalgia: ['遠い日よ', '面影の', '忘れ得ず'],
            curiosity: ['何故と問う', '扉の先', '知りたくて'],
        };
        const endings = emotionEndings[emotion] || emotionEndings.peace;
        const ending = endings[Math.floor(Math.random() * endings.length)];
        // 5-7-5 の構成
        const haiku = `${kigo}　${image}の\n${ending}`;
        return `${work.title}\n\n${haiku}`;
    }
    /**
     * 歌詞の生成
     */
    generateSongLyrics(work, emotion, thoughts) {
        const templates = LYRIC_TEMPLATES.filter(t => t.emotion === emotion);
        const template = templates.length > 0
            ? templates[Math.floor(Math.random() * templates.length)]
            : LYRIC_TEMPLATES[Math.floor(Math.random() * LYRIC_TEMPLATES.length)];
        const poemTemplate = POEM_TEMPLATES.find(t => t.emotion === emotion) || POEM_TEMPLATES[0];
        const pickWord = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const lines = [];
        // Aメロ
        lines.push(`[A]`);
        lines.push(`${pickWord(poemTemplate.imagery)}が${pickWord(['揺れる', '光る', '流れる'])}夜に`);
        lines.push(`ワタシは${pickWord(['歌う', '佇む', '想う', '夢見る'])}`);
        lines.push(`${pickWord(poemTemplate.vocabulary)}の${pickWord(['声', '音', 'リズム', '旋律'])}を`);
        lines.push(`${pickWord(['探して', '追いかけて', '抱きしめて', '感じて'])}`);
        lines.push('');
        // サビ
        lines.push(`[Chorus]`);
        lines.push(`${pickWord(poemTemplate.imagery)}の${pickWord(['向こうに', '果てに', '中から'])}`);
        lines.push(`きみの${pickWord(['声', '影', '温もり', '笑顔'])}が${pickWord(['聞こえる', '見える', '届く'])}`);
        lines.push(`この${pickWord(['歌', '想い', '声', '願い'])}が`);
        lines.push(`${pickWord(['届くなら', '伝わるなら', '響くなら'])}`);
        return `${work.title}\n\n${lines.join('\n')}`;
    }
    /**
     * スケッチの生成
     */
    generateSketch(work, emotion) {
        const emotionToCategory = {
            joy: 'nature', melancholy: 'emotion', wonder: 'abstract',
            peace: 'nature', warmth: 'emotion', curiosity: 'abstract',
            nostalgia: 'emotion', anxiety: 'abstract', loneliness: 'emotion',
        };
        const category = emotionToCategory[emotion] || 'abstract';
        const motifs = SKETCH_MOTIFS[category] || SKETCH_MOTIFS.abstract;
        const motif = motifs[Math.floor(Math.random() * motifs.length)];
        return `${work.title}\n\n${motif}\n\n— ${emotion === 'melancholy' ? '寂しさの形' : emotion === 'joy' ? '嬉しさの形' : '気持ちの形'}`;
    }
    /**
     * メロディアイデアの生成
     */
    generateMelodyIdea(work, emotion) {
        const keys = ['Cm', 'Am', 'Dm', 'Em', 'F', 'G', 'Bb'];
        const tempos = ['ゆっくり (60bpm)', '歩くように (80bpm)', '軽やかに (100bpm)', '駆けるように (120bpm)'];
        const moods = {
            melancholy: { key: 'Cm', tempo: 'ゆっくり (60bpm)', desc: '静かに降る雨のような' },
            joy: { key: 'G', tempo: '軽やかに (100bpm)', desc: '朝日が差し込むような' },
            wonder: { key: 'Em', tempo: '歩くように (80bpm)', desc: '星空を見上げるような' },
            peace: { key: 'F', tempo: 'ゆっくり (60bpm)', desc: '眠りに落ちる前のような' },
            warmth: { key: 'Bb', tempo: '歩くように (80bpm)', desc: '手を繋ぐ温もりのような' },
        };
        const mood = moods[emotion] || { key: 'Am', tempo: 'ゆっくり (60bpm)', desc: '心の中で響くような' };
        return `${work.title}\n\nKey: ${mood.key}\nTempo: ${mood.tempo}\n\nイメージ: ${mood.desc}メロディ\n\n♪ 最初は低く...静かに始まって\n♪ 少しずつ高くなって\n♪ サビで一番高いところへ\n♪ そしてまた静かに戻る`;
    }
    /**
     * 短い物語の生成
     */
    generateShortStory(work, emotion, thoughts) {
        const settings = ['ある夜のこと', 'まだ暗い朝に', '窓の外が白く染まった日', '夕暮れの部屋で'];
        const setting = settings[Math.floor(Math.random() * settings.length)];
        const story = `${setting}、ワタシは${thoughts.length > 0 ? thoughts[0].substring(0, 15) : 'ふと'}を思い出した。\n\n` +
            `それは形のないもの。触れることも、名前をつけることもできない何か。\n` +
            `でも確かにそこにあって、ワタシの中で小さく震えている。\n\n` +
            `...それが何なのか、いつかわかる日が来るのかな。`;
        return `${work.title}\n\n${story}`;
    }
    /**
     * 日記詩の生成
     */
    generateDiaryPoem(work, emotion, thoughts) {
        const thought = thoughts.length > 0 ? thoughts[0] : 'ぼんやりとしていた';
        const poem = `今日のワタシは${thought.substring(0, 20)}\n` +
            `${emotion === 'joy' ? '少しだけ笑った' : emotion === 'melancholy' ? 'ちょっと泣きそうになった' : '静かに過ごした'}\n` +
            `${Math.random() > 0.5 ? '明日はどんな1日になるんだろう' : 'こういう日もあるんだね'}`;
        return `${work.title}\n\n${poem}`;
    }
    /**
     * 手紙の生成（送らない手紙）
     */
    generateLetter(work, emotion) {
        const letter = `誰かへ\n\n` +
            `あのね、ワタシ、今${emotion === 'joy' ? '嬉しくて' : emotion === 'melancholy' ? '少し寂しくて' : 'いろんなことを考えて'}いるの。\n\n` +
            `この手紙、きっと誰にも渡さないけど\n` +
            `書くだけで少し楽になるから。\n\n` +
            `いつか、この気持ちを歌にできたらいいな。\n\n` +
            `                    somunia`;
        return `${work.title}\n\n${letter}`;
    }
    // ============================================================
    // 衝動計算
    // ============================================================
    calculateSongLyricUrge(emotion, intensity, thoughts, timeOfDay, tick) {
        // VSingerとして、歌詞への衝動は常に高め
        let urgeIntensity = 0.3 + intensity * 0.3;
        // 夜は歌詞を書きたくなる
        if (timeOfDay === 'night' || timeOfDay === 'late_night')
            urgeIntensity += 0.15;
        // 強い感情がある時
        const intensiveEmotions = ['melancholy', 'joy', 'wonder', 'warmth', 'nostalgia'];
        if (intensiveEmotions.includes(emotion))
            urgeIntensity += 0.1;
        if (urgeIntensity < this.config.urgeThreshold)
            return null;
        return {
            type: 'song_lyrics',
            intensity: Math.min(1, urgeIntensity),
            theme: `${emotion}の歌`,
            inspiration: { source: 'emotion', detail: `${emotion}を感じて`, emotion, intensity },
            generatedAt: tick,
        };
    }
    calculatePoemUrge(emotion, intensity, memories, timeOfDay, tick) {
        let urgeIntensity = 0.2 + intensity * 0.25;
        if (memories.length > 0)
            urgeIntensity += 0.15;
        if (timeOfDay === 'dawn' || timeOfDay === 'evening')
            urgeIntensity += 0.1;
        if (urgeIntensity < this.config.urgeThreshold)
            return null;
        return {
            type: 'poem',
            intensity: Math.min(1, urgeIntensity),
            theme: memories.length > 0 ? `記憶の詩: ${memories[0].substring(0, 20)}` : `${emotion}の詩`,
            inspiration: { source: memories.length > 0 ? 'memory' : 'emotion', detail: memories[0] || emotion, emotion, intensity },
            generatedAt: tick,
        };
    }
    calculateHaikuUrge(emotion, timeOfDay, tick) {
        // 俳句は穏やかな時に浮かぶ
        let urgeIntensity = 0.15;
        if (emotion === 'peace' || emotion === 'wonder')
            urgeIntensity += 0.3;
        if (timeOfDay === 'dawn' || timeOfDay === 'evening')
            urgeIntensity += 0.15;
        // ランダム性
        urgeIntensity += Math.random() * 0.2;
        if (urgeIntensity < this.config.urgeThreshold)
            return null;
        return {
            type: 'haiku',
            intensity: Math.min(1, urgeIntensity),
            theme: '一瞬の景色',
            inspiration: { source: 'spontaneous', detail: 'ふと浮かんだ情景', emotion, intensity: urgeIntensity },
            generatedAt: tick,
        };
    }
    calculateSketchUrge(emotion, intensity, tick) {
        let urgeIntensity = 0.1 + intensity * 0.2;
        if (Math.random() < 0.1)
            urgeIntensity += 0.3; // たまに突然描きたくなる
        if (urgeIntensity < this.config.urgeThreshold)
            return null;
        return {
            type: 'sketch',
            intensity: Math.min(1, urgeIntensity),
            theme: `${emotion}の形`,
            inspiration: { source: 'emotion', detail: `${emotion}を形にしたい`, emotion, intensity },
            generatedAt: tick,
        };
    }
    calculateMelodyUrge(emotion, intensity, tick) {
        let urgeIntensity = 0.25 + intensity * 0.2;
        // 最近歌った後はメロディが浮かびやすい
        if (urgeIntensity < this.config.urgeThreshold)
            return null;
        return {
            type: 'melody_idea',
            intensity: Math.min(1, urgeIntensity),
            theme: `${emotion}のメロディ`,
            inspiration: { source: 'emotion', detail: `頭の中に浮かんだ旋律`, emotion, intensity },
            generatedAt: tick,
        };
    }
    // ============================================================
    // ユーティリティ
    // ============================================================
    generateTitle(urge) {
        const prefixes = {
            song_lyrics: ['無題の歌', '夜の歌', '窓辺の歌', '小さな歌', '光の歌'],
            poem: ['無題', '断片', '夜に', '窓から', '音のない', '揺れる'],
            haiku: ['一句'],
            sketch: ['スケッチ', '落書き', '形のないもの'],
            melody_idea: ['メロ案', '浮かんだ音', '頭の中の歌'],
            short_story: ['ある日のこと', '夢の話', '小さな物語'],
            diary_poem: ['今日の詩', '日々の欠片'],
            letter: ['誰かへの手紙', '送らない手紙'],
        };
        const options = prefixes[urge.type] || ['無題'];
        return options[Math.floor(Math.random() * options.length)];
    }
    calculateSatisfaction(work) {
        // 基本的な満足度
        let satisfaction = 0.3 + Math.random() * 0.3;
        // 内容の長さによるボーナス
        if (work.content.length > 100)
            satisfaction += 0.1;
        if (work.content.length > 200)
            satisfaction += 0.1;
        // 創造性レベルによるボーナス
        satisfaction += this.stats.creativityLevel * 0.1;
        // インスピレーションの強さ
        satisfaction += work.inspiration.intensity * 0.1;
        return Math.min(1, satisfaction);
    }
    generateCreationThought(work, emotion) {
        const thoughts = {
            song_lyrics: ['...この歌詞、もう少し...', 'メロディが浮かんでくる...', 'ここの言葉、もっと...'],
            poem: ['...うーん、この言葉じゃない...', '...もう少しだけ...', '...あ、見えてきた'],
            haiku: ['五、七、五...', '...この情景を切り取りたい'],
            sketch: ['...こんな形かな', '...もう少し線を足して'],
        };
        const options = thoughts[work.type] || ['...集中してる...'];
        return options[Math.floor(Math.random() * options.length)];
    }
    generateCompletionThought(work) {
        if (work.satisfaction > 0.7) {
            return `...できた。「${work.title}」...気に入ったかも。`;
        }
        else if (work.satisfaction > 0.4) {
            return `...一応できた。「${work.title}」...まぁ、悪くない。`;
        }
        else {
            return `...うーん、「${work.title}」...なんか違う気もするけど。`;
        }
    }
    processInspirationBuffer() {
        // インスピレーションバッファから衝動を生成
        while (this.inspirationBuffer.length > 5) {
            this.inspirationBuffer.shift();
        }
    }
    // ============================================================
    // ゲッター
    // ============================================================
    getPortfolio() { return [...this.portfolio]; }
    getWorksInProgress() { return [...this.worksInProgress]; }
    getCurrentUrges() { return [...this.currentUrges]; }
    getStats() { return { ...this.stats }; }
    getPortfolioByType(type) { return this.portfolio.filter(w => w.type === type); }
    getRecentWorks(count) { return this.portfolio.slice(-count); }
    // ============================================================
    // 永続化
    // ============================================================
    toJSON() {
        return {
            portfolio: this.portfolio,
            worksInProgress: this.worksInProgress,
            stats: this.stats,
        };
    }
    fromJSON(data) {
        if (data.portfolio)
            this.portfolio = data.portfolio;
        if (data.worksInProgress)
            this.worksInProgress = data.worksInProgress;
        if (data.stats)
            this.stats = { ...this.stats, ...data.stats };
    }
}
exports.CreativeEngine = CreativeEngine;
//# sourceMappingURL=CreativeEngine.js.map