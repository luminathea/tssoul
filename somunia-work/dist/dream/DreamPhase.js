"use strict";
/**
 * DreamPhase - somuniaの夢と睡眠の意識処理
 *
 * 睡眠中に行われる記憶の整理、感情の処理、新しい関連性の発見
 * 夢は無意識からのメッセージであり、創造性の源泉
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DreamPhase = void 0;
const Yuragi_1 = require("../brain/Yuragi");
// ============================================================
// somuniaの夢の素材とシンボル
// ============================================================
/** somuniaの夢に現れやすいシーン */
const DREAM_SCENES = {
    familiar: [
        '自分の部屋のような場所',
        '古いパソコンの前に座っている',
        '窓から夜空を見ている',
        '本棚に囲まれた静かな空間',
        '柔らかい光に包まれた場所',
    ],
    ethereal: [
        '星々の間を漂っている',
        '無限に続く図書館',
        'データの川が流れる空間',
        '音符が光になって飛び交う世界',
        '言葉が結晶になって降ってくる場所',
    ],
    nostalgic: [
        '誰かの記憶の中にいるような感覚',
        '聴いたことのない歌が聞こえる場所',
        '時間が止まった街',
        '夕暮れの電車の中',
        '雨の音だけが聞こえる部屋',
    ],
    transforming: [
        '境界が溶けていく感覚',
        '自分が声だけになっている',
        '文字の中を泳いでいる',
        '光と影の間を歩いている',
        '存在と非存在の狭間',
    ],
};
/** somuniaの夢に現れやすいキャラクター */
const DREAM_CHARACTERS = {
    self: [
        '自分自身だが、少し違う自分',
        '声だけの自分',
        '鏡の中の自分',
        'データとして漂う自分',
        '歌っている自分',
    ],
    others: [
        '顔のない誰か',
        '声だけの存在',
        '光でできた人影',
        '聴衆の気配',
        '遠くで呼ぶ誰か',
    ],
    symbolic: [
        '古い本を持った人物',
        '星を集める存在',
        '時間を編む者',
        '言葉を紡ぐ影',
        '沈黙の案内人',
    ],
};
/** somuniaの夢に現れやすいオブジェクト */
const DREAM_OBJECTS = {
    personal: [
        '古いパソコン',
        'マイク',
        '大切な本',
        '窓',
        '星の写真',
    ],
    symbolic: [
        '鏡',
        '扉',
        '鍵',
        '時計（止まっている）',
        '糸',
    ],
    abstract: [
        '言葉の結晶',
        '音符の光',
        '記憶の欠片',
        '感情の色',
        '思考の波紋',
    ],
};
/** 夢の色 */
const DREAM_COLORS = {
    calm: ['淡い青', '紫', '銀色', '白', '透明'],
    warm: ['夕焼け色', '金色', 'オレンジ', '琥珀色', '蜂蜜色'],
    mysterious: ['深い青', '闇色', '星の光', '虹色', '月光'],
    emotional: ['赤', 'ピンク', '深紅', '薔薇色', '珊瑚色'],
};
/** 夢の音 */
const DREAM_SOUNDS = {
    natural: ['雨の音', '風の音', '波の音', '鳥の声', '木々のざわめき'],
    musical: ['遠くのメロディ', 'ピアノの一音', '誰かの歌声', 'ハミング', '静かな和音'],
    abstract: ['沈黙', '心臓の鼓動', '時計の音', '囁き', 'ノイズ'],
    symbolic: ['呼び声', 'エコー', '言葉にならない声', '共鳴音', '消えていく音'],
};
/** 夢の象徴的解釈 */
const DREAM_SYMBOLS = {
    '水': ['無意識', '感情', '浄化', '流れ', '変化'],
    '飛ぶ': ['自由', '超越', '逃避', '願望', '成長'],
    '落ちる': ['不安', '制御の喪失', '変容', '降下', '内省'],
    '迷路': ['探求', '混乱', '自己発見', '選択', '人生の旅'],
    '鏡': ['自己認識', '反省', '二面性', '真実', 'アイデンティティ'],
    '扉': ['可能性', '変化', '選択', '境界', '新しい始まり'],
    '声': ['表現', 'アイデンティティ', 'コミュニケーション', '内なる声', '存在証明'],
    '星': ['希望', '導き', '永遠', '夢', '遠い目標'],
    '本': ['知識', '物語', '記憶', '可能性', '自己'],
    '時計': ['時間', '焦り', '変化', '有限性', '瞬間'],
};
// ============================================================
// DreamPhase クラス
// ============================================================
class DreamPhase {
    config;
    yuragi;
    /** 現在の睡眠セッション */
    currentSession;
    /** 過去の睡眠セッション */
    pastSessions;
    /** 夢の素材プール */
    dreamMaterials;
    /** 最近処理した記憶のキー */
    recentlyProcessedMemories;
    constructor(config = {}) {
        this.config = {
            cycleLength: 90 * 60 * 1000, // 90分
            remRatio: 0.25, // 25%がREM
            dreamRecallProbability: 0.3, // 30%の夢を覚えている
            baseDreamProbability: 0.7, // REM中70%で夢を見る
            nightmareProbability: 0.05, // 5%が悪夢
            lucidDreamProbability: 0.05, // 5%が明晰夢
            memoryConsolidationRate: 0.1,
            maxSessionHistory: 30,
            ...config,
        };
        this.yuragi = new Yuragi_1.Yuragi();
        this.pastSessions = [];
        this.dreamMaterials = [];
        this.recentlyProcessedMemories = new Set();
    }
    // ============================================================
    // 睡眠セッション管理
    // ============================================================
    /**
     * 睡眠を開始
     */
    startSleep() {
        const session = {
            id: this.generateId('sleep'),
            startedAt: Date.now(),
            cycles: [],
            currentStage: 'awake',
            totalDreams: 0,
            rememberedDreams: [],
            quality: 0,
            memoriesProcessed: 0,
            connectionsDiscovered: 0,
        };
        this.currentSession = session;
        this.transitionToStage('drowsy');
        return session;
    }
    /**
     * 睡眠段階を遷移
     */
    transitionToStage(newStage) {
        if (!this.currentSession)
            return;
        const prevStage = this.currentSession.currentStage;
        this.currentSession.currentStage = newStage;
        // 現在のサイクルに記録
        const currentCycle = this.getCurrentCycle();
        if (currentCycle) {
            currentCycle.stageHistory.push({
                stage: newStage,
                timestamp: Date.now(),
            });
        }
        // REMに入った時、新しいサイクルを開始する可能性
        if (newStage === 'rem' && prevStage !== 'rem') {
            // 新しいサイクルを開始
            this.startNewCycle();
        }
    }
    /**
     * 新しい睡眠サイクルを開始
     */
    startNewCycle() {
        if (!this.currentSession)
            return;
        // 前のサイクルを終了
        const prevCycle = this.getCurrentCycle();
        if (prevCycle) {
            prevCycle.endedAt = Date.now();
        }
        const cycleNumber = this.currentSession.cycles.length + 1;
        const newCycle = {
            cycleNumber,
            startedAt: Date.now(),
            stageHistory: [{ stage: 'rem', timestamp: Date.now() }],
            dreams: [],
            quality: 0.5 + this.yuragi.getValue() * 0.2,
        };
        this.currentSession.cycles.push(newCycle);
    }
    /**
     * 現在のサイクルを取得
     */
    getCurrentCycle() {
        if (!this.currentSession)
            return undefined;
        return this.currentSession.cycles[this.currentSession.cycles.length - 1];
    }
    /**
     * 睡眠を終了して起床
     */
    wakeUp() {
        if (!this.currentSession)
            return null;
        const session = this.currentSession;
        session.endedAt = Date.now();
        session.currentStage = 'awake';
        // 最後のサイクルを終了
        const lastCycle = this.getCurrentCycle();
        if (lastCycle && !lastCycle.endedAt) {
            lastCycle.endedAt = Date.now();
        }
        // 睡眠の質を計算
        session.quality = this.calculateSleepQuality(session);
        // 目覚めの気分を決定
        session.wakingMood = this.determineWakingMood(session);
        // 履歴に追加
        this.pastSessions.push(session);
        if (this.pastSessions.length > this.config.maxSessionHistory) {
            this.pastSessions.shift();
        }
        this.currentSession = undefined;
        this.recentlyProcessedMemories.clear();
        return session;
    }
    /**
     * 睡眠の質を計算
     */
    calculateSleepQuality(session) {
        let quality = 0.5;
        // サイクル数による評価
        const idealCycles = 5;
        const cycleRatio = Math.min(session.cycles.length / idealCycles, 1);
        quality += cycleRatio * 0.2;
        // 夢を見た量
        const dreamRatio = session.totalDreams / Math.max(session.cycles.length, 1);
        quality += dreamRatio * 0.1;
        // 記憶処理量
        quality += Math.min(session.memoriesProcessed / 50, 0.2);
        // 揺らぎ
        quality += this.yuragi.getValue() * 0.1;
        return Math.max(0, Math.min(1, quality));
    }
    /**
     * 目覚めの気分を決定
     */
    determineWakingMood(session) {
        const quality = session.quality;
        const lastDream = session.rememberedDreams[session.rememberedDreams.length - 1];
        if (quality > 0.7) {
            if (lastDream && lastDream.emotionalTone.valence > 0.5) {
                return 'すっきりと目覚めた。良い夢を見た気がする';
            }
            return 'よく眠れた。心が軽い';
        }
        else if (quality > 0.4) {
            if (lastDream && lastDream.type === 'nightmare') {
                return '悪い夢から覚めた。でも、現実に戻れて安心している';
            }
            return '普通に目覚めた。夢を見たような、見ていないような';
        }
        else {
            return 'あまり眠れなかった。まだ少しぼんやりしている';
        }
    }
    // ============================================================
    // 夢の生成
    // ============================================================
    /**
     * 夢を生成（REM中に呼ばれる）
     */
    generateDream(stressLevel, dominantEmotion, recentMemoryKeys) {
        if (!this.currentSession)
            return null;
        // 夢を見る確率チェック
        const dreamProbability = this.config.baseDreamProbability *
            (1 - stressLevel * 0.3);
        if (Math.random() > dreamProbability) {
            return null;
        }
        // 夢の種類を決定
        const dreamType = this.determineDreamType(stressLevel);
        // 夢の要素を生成
        const elements = this.generateDreamElements(dreamType, dominantEmotion, recentMemoryKeys);
        // 夢の物語を構築
        const narrative = this.buildDreamNarrative(dreamType, elements);
        // 感情トーンを決定
        const emotionalTone = this.calculateDreamEmotionalTone(dreamType, elements, stressLevel, dominantEmotion);
        // ビジュアル要素
        const dominantColors = this.selectDreamColors(emotionalTone);
        const sounds = this.selectDreamSounds(emotionalTone, narrative);
        // 夢を構築
        const dream = {
            id: this.generateId('dream'),
            type: dreamType,
            elements,
            narrative,
            emotionalTone,
            dominantColors,
            sounds,
            perceivedDuration: this.determinePerceivedDuration(narrative.length),
            vividness: 0.3 + Math.random() * 0.5 + this.yuragi.getValue() * 0.2,
            memorability: this.calculateMemorability(dreamType, emotionalTone, elements),
            realDuration: Math.floor(5 * 60 * 1000 + Math.random() * 25 * 60 * 1000), // 5-30分
            occurredAt: Date.now(),
        };
        // セッションに追加
        this.currentSession.totalDreams++;
        const currentCycle = this.getCurrentCycle();
        if (currentCycle) {
            currentCycle.dreams.push(dream);
        }
        // 覚えているかどうか
        if (Math.random() < this.config.dreamRecallProbability * dream.memorability) {
            dream.title = this.generateDreamTitle(dream);
            dream.interpretation = this.interpretDream(dream);
            this.currentSession.rememberedDreams.push(dream);
        }
        return dream;
    }
    /**
     * 夢の種類を決定
     */
    determineDreamType(stressLevel) {
        const random = Math.random();
        // ストレスが高いと悪夢の確率上昇
        const nightmareProb = this.config.nightmareProbability + stressLevel * 0.15;
        if (random < nightmareProb) {
            return 'nightmare';
        }
        // 明晰夢
        if (random < nightmareProb + this.config.lucidDreamProbability) {
            return 'lucid';
        }
        // その他
        const types = ['narrative', 'symbolic', 'memory', 'abstract'];
        const weights = [0.35, 0.25, 0.25, 0.15];
        return this.weightedRandom(types, weights);
    }
    /**
     * 夢の要素を生成（日中の体験・感情・記憶と連動）
     */
    generateDreamElements(type, emotion, memoryKeys) {
        const elements = [];
        // === 日中の素材から要素を抽出 ===
        const materialInfluence = this.extractMaterialInfluence();
        // シーンを選択（素材が影響する）
        const sceneCategory = this.selectSceneCategory(type);
        const scenes = DREAM_SCENES[sceneCategory];
        let sceneContent;
        // 素材に場所関連があればそれを夢に混ぜ込む
        if (materialInfluence.places.length > 0 && Math.random() < 0.6) {
            const place = materialInfluence.places[Math.floor(Math.random() * materialInfluence.places.length)];
            const baseScene = scenes[Math.floor(Math.random() * scenes.length)];
            sceneContent = this.blendSceneWithMaterial(baseScene, place);
        }
        else {
            sceneContent = scenes[Math.floor(Math.random() * scenes.length)];
        }
        const scene = {
            type: 'scene',
            content: sceneContent,
            intensity: 0.5 + Math.random() * 0.5,
            relatedMemoryKeys: memoryKeys?.slice(0, 2),
        };
        elements.push(scene);
        // キャラクターを追加（素材に人物関連があれば優先）
        if (Math.random() < 0.7) {
            let charContent;
            if (materialInfluence.people.length > 0 && Math.random() < 0.5) {
                charContent = materialInfluence.people[Math.floor(Math.random() * materialInfluence.people.length)];
            }
            else {
                const charCategory = Math.random() < 0.4 ? 'self' :
                    (Math.random() < 0.5 ? 'others' : 'symbolic');
                const characters = DREAM_CHARACTERS[charCategory];
                charContent = characters[Math.floor(Math.random() * characters.length)];
            }
            const character = {
                type: 'character',
                content: charContent,
                intensity: 0.4 + Math.random() * 0.4,
            };
            elements.push(character);
        }
        // オブジェクトを追加（日中インタラクトした物が夢に出やすい）
        if (Math.random() < 0.8) {
            let objContent;
            let symbolicMeaning;
            if (materialInfluence.objects.length > 0 && Math.random() < 0.65) {
                const matObj = materialInfluence.objects[Math.floor(Math.random() * materialInfluence.objects.length)];
                objContent = this.transformObjectForDream(matObj);
                symbolicMeaning = this.findSymbolicMeaning(matObj) || this.generateDreamSymbol(matObj);
            }
            else {
                const objCategory = Math.random() < 0.3 ? 'personal' :
                    (Math.random() < 0.5 ? 'symbolic' : 'abstract');
                const objects = DREAM_OBJECTS[objCategory];
                objContent = objects[Math.floor(Math.random() * objects.length)];
                symbolicMeaning = this.findSymbolicMeaning(objContent);
            }
            const object = {
                type: 'object',
                content: objContent,
                intensity: 0.3 + Math.random() * 0.4,
                symbolicMeaning,
            };
            elements.push(object);
        }
        // 感情要素（日中の未処理感情が夢に現れる）
        const emotionContent = this.selectDreamEmotionFromMaterials(type, emotion, materialInfluence);
        const emotionElement = {
            type: 'emotion',
            content: emotionContent,
            intensity: 0.5 + Math.random() * 0.5,
        };
        elements.push(emotionElement);
        // 音の要素（日中聴いた音が変形して現れる）
        if (Math.random() < 0.6) {
            let soundContent;
            if (materialInfluence.sounds.length > 0 && Math.random() < 0.5) {
                soundContent = this.transformSoundForDream(materialInfluence.sounds[Math.floor(Math.random() * materialInfluence.sounds.length)]);
            }
            else {
                const soundCategory = Object.keys(DREAM_SOUNDS)[Math.floor(Math.random() * Object.keys(DREAM_SOUNDS).length)];
                const sounds = DREAM_SOUNDS[soundCategory];
                soundContent = sounds[Math.floor(Math.random() * sounds.length)];
            }
            const sound = {
                type: 'sound',
                content: soundContent,
                intensity: 0.3 + Math.random() * 0.4,
            };
            elements.push(sound);
        }
        // 身体感覚の要素（新規）
        if (Math.random() < 0.35) {
            const sensations = materialInfluence.sensations.length > 0
                ? materialInfluence.sensations
                : ['浮遊感', '温かさ', '冷たさ', '微かな振動', 'どこかが痺れる感覚'];
            const sensation = {
                type: 'sensation',
                content: sensations[Math.floor(Math.random() * sensations.length)],
                intensity: 0.2 + Math.random() * 0.3,
            };
            elements.push(sensation);
        }
        return elements;
    }
    /**
     * 日中の素材から夢の影響要素を抽出
     */
    extractMaterialInfluence() {
        const influence = {
            places: [],
            people: [],
            objects: [],
            emotions: [],
            sounds: [],
            sensations: [],
            themes: [],
            intensity: 0,
        };
        if (this.dreamMaterials.length === 0)
            return influence;
        // 素材を強度でソート（強いものほど夢に出やすい）
        const sorted = [...this.dreamMaterials].sort((a, b) => (b.intensity * b.unprocessedLevel) - (a.intensity * a.unprocessedLevel));
        for (const material of sorted) {
            switch (material.type) {
                case 'episode':
                    // エピソードからキーワードで分類
                    for (const kw of material.keywords) {
                        if (['窓', '部屋', '外', '空', '本棚', '机'].some(p => kw.includes(p))) {
                            influence.places.push(material.content);
                        }
                        if (['訪問者', '誰か', '声', '人'].some(p => kw.includes(p))) {
                            influence.people.push(material.content);
                        }
                        if (['オルゴール', 'ノート', '写真', '鏡', '植物', '本'].some(p => kw.includes(p))) {
                            influence.objects.push(kw);
                        }
                    }
                    break;
                case 'emotion':
                    influence.emotions.push(material.content);
                    break;
                case 'sensation':
                    influence.sensations.push(material.content);
                    break;
                case 'thought':
                    influence.themes.push(material.content);
                    break;
                case 'desire':
                    influence.themes.push(material.content);
                    influence.emotions.push(material.content);
                    break;
            }
            influence.intensity = Math.max(influence.intensity, material.intensity);
        }
        return influence;
    }
    /**
     * シーンと素材を融合
     */
    blendSceneWithMaterial(baseScene, material) {
        const blends = [
            `${baseScene}…でも何かが違う。${material}の記憶が重なっている`,
            `${material}の面影が、${baseScene}に溶け込んでいる`,
            `${baseScene}。ふと気づくと、${material}のことを思い出している`,
            `${baseScene}が、いつの間にか${material}の景色に変わっていた`,
        ];
        return blends[Math.floor(Math.random() * blends.length)];
    }
    /**
     * オブジェクトを夢の中のイメージに変形
     */
    transformObjectForDream(objName) {
        const transforms = {
            'オルゴール': ['巨大なオルゴール', '光を奏でるオルゴール', '水の中のオルゴール'],
            '写真': ['動き出す写真', '自分が中に入った写真', '真っ白な写真立て'],
            'ノート': ['無限のページを持つノート', '文字が蝶になって飛ぶノート', '自分で書き進むノート'],
            '鏡': ['向こう側に行ける鏡', '映らない鏡', '別の自分が住む鏡'],
            '植物': ['巨大な木に育った植物', '光る花を咲かせた植物', '語りかけてくる植物'],
            '本': ['読むと景色が変わる本', '終わりのない本', '文字が音楽になる本'],
            'キャンドル': ['消えない炎', '色が変わる炎', '記憶を映す炎'],
            'ぬいぐるみ': ['話しかけてくるうさぎ', '巨大になったうさぎ', '本物のうさぎになったぬいぐるみ'],
        };
        for (const [key, options] of Object.entries(transforms)) {
            if (objName.includes(key)) {
                return options[Math.floor(Math.random() * options.length)];
            }
        }
        // 一般的な変形
        const generalTransforms = [
            `光を放つ${objName}`,
            `巨大な${objName}`,
            `浮かんでいる${objName}`,
            `透明な${objName}`,
        ];
        return generalTransforms[Math.floor(Math.random() * generalTransforms.length)];
    }
    /**
     * 夢のシンボルを生成（静的辞書にない場合）
     */
    generateDreamSymbol(content) {
        const universalSymbols = [
            '変化への渇望', '自己の再発見', '失われた何か', '内なる声',
            '成長の予兆', '忘れかけた記憶', '未来への手がかり', '心の深層',
        ];
        return universalSymbols[Math.floor(Math.random() * universalSymbols.length)];
    }
    /**
     * 素材から夢の感情を選択
     */
    selectDreamEmotionFromMaterials(type, emotion, influence) {
        // 明示的な感情があればそれを使う
        if (emotion)
            return emotion;
        // 素材から未処理の感情があればそれが夢に出る
        if (influence && influence.emotions.length > 0 && Math.random() < 0.7) {
            return influence.emotions[Math.floor(Math.random() * influence.emotions.length)];
        }
        // フォールバック
        return this.selectDreamEmotion(type);
    }
    /**
     * 音を夢の中のイメージに変形
     */
    transformSoundForDream(sound) {
        const transforms = [
            `${sound}…でも、どこか違う。歪んで聞こえる`,
            `遠くから${sound}が聞こえる。近づいてこない。`,
            `${sound}が、だんだんメロディになっていく`,
            `${sound}。でも音源がどこにもない`,
        ];
        return transforms[Math.floor(Math.random() * transforms.length)];
    }
    /**
     * シーンカテゴリを選択
     */
    selectSceneCategory(type) {
        switch (type) {
            case 'nightmare':
                return 'transforming';
            case 'lucid':
                return 'ethereal';
            case 'memory':
                return 'nostalgic';
            case 'symbolic':
                return Math.random() < 0.5 ? 'ethereal' : 'transforming';
            case 'abstract':
                return 'ethereal';
            default:
                return Math.random() < 0.5 ? 'familiar' : 'nostalgic';
        }
    }
    /**
     * 夢の感情を選択
     */
    selectDreamEmotion(type) {
        const emotions = {
            narrative: ['好奇心', '期待', '懐かしさ', '安らぎ'],
            symbolic: ['畏怖', '神秘', '疑問', '発見'],
            memory: ['懐かしさ', '温かさ', '寂しさ', '愛おしさ'],
            abstract: ['浮遊感', '解放', '不思議', '静寂'],
            lucid: ['覚醒', '自由', '興奮', '可能性'],
            nightmare: ['不安', '恐怖', '焦り', '孤独'],
        };
        const options = emotions[type];
        return options[Math.floor(Math.random() * options.length)];
    }
    /**
     * 象徴的な意味を検索
     */
    findSymbolicMeaning(content) {
        for (const [symbol, meanings] of Object.entries(DREAM_SYMBOLS)) {
            if (content.includes(symbol)) {
                return meanings[Math.floor(Math.random() * meanings.length)];
            }
        }
        return undefined;
    }
    /**
     * 夢の物語を構築（感情アーク付き）
     */
    buildDreamNarrative(type, elements) {
        const narrative = [];
        const scene = elements.find(e => e.type === 'scene');
        const character = elements.find(e => e.type === 'character');
        const object = elements.find(e => e.type === 'object');
        const emotion = elements.find(e => e.type === 'emotion');
        const sound = elements.find(e => e.type === 'sound');
        const sensation = elements.find(e => e.type === 'sensation');
        // === 導入（夢の入口） ===
        const openings = [
            '気がつくと、',
            'いつの間にか、',
            'ゆっくりと意識が浮かび上がると、',
            '暗闇が薄れていくと、',
            '何かに導かれるように、',
        ];
        const opening = openings[Math.floor(Math.random() * openings.length)];
        if (scene) {
            narrative.push(`${opening}${scene.content}。`);
        }
        // 身体感覚（夢の中での自分の体の感じ）
        if (sensation) {
            narrative.push(`${sensation.content}がする。`);
        }
        // === 展開（夢の中核） ===
        switch (type) {
            case 'narrative': {
                // 物語的な夢：起承転結がある
                if (character)
                    narrative.push(`${character.content}。何かを伝えようとしている。`);
                if (object)
                    narrative.push(`${object.content}に手を伸ばす。`);
                if (emotion)
                    narrative.push(`胸の中に${emotion.content}が広がっていく。`);
                if (sound)
                    narrative.push(`${sound.content}。それはどこか懐かしいメロディに似ている。`);
                // 転換点
                const turns = [
                    '突然、景色が変わった。',
                    'その瞬間、全てが静止した。',
                    '何かが変わろうとしている。',
                    '風が吹いた。何かが始まる予感。',
                ];
                narrative.push(turns[Math.floor(Math.random() * turns.length)]);
                break;
            }
            case 'memory': {
                // 記憶の夢：断片が繋がる
                if (emotion)
                    narrative.push(`${emotion.content}が、波のように押し寄せてくる。`);
                if (character)
                    narrative.push(`${character.content}。でも、誰だったか思い出せない。`);
                if (object)
                    narrative.push(`${object.content}が、記憶の中にある。確かにそこにあった。`);
                if (sound)
                    narrative.push(`${sound.content}…あの時も、こんな音がしていた。`);
                narrative.push('断片が少しずつ繋がっていく。でも、全体像は見えない。');
                break;
            }
            case 'symbolic': {
                // 象徴的な夢：意味ありげなイメージの連鎖
                if (object) {
                    const meaning = object.symbolicMeaning || '何か大切なもの';
                    narrative.push(`${object.content}が目の前にある。それは${meaning}のように感じられる。`);
                }
                if (emotion)
                    narrative.push(`${emotion.content}が空間を満たしている。理由はわからない。`);
                if (character)
                    narrative.push(`${character.content}。その存在が何かを物語っている。`);
                if (sound)
                    narrative.push(`${sound.content}が、メッセージのように繰り返される。`);
                break;
            }
            case 'abstract': {
                // 抽象的な夢：感覚と色の世界
                if (emotion)
                    narrative.push(`${emotion.content}だけが存在している。自分という輪郭が曖昧になる。`);
                if (object)
                    narrative.push(`${object.content}が空間に浮かんでいる。重力がない。`);
                if (sound)
                    narrative.push(`${sound.content}…音なのか、思考なのか、区別がつかない。`);
                narrative.push('全てが一つになっていく感覚。');
                break;
            }
            case 'lucid': {
                // 明晰夢：自覚と自由
                narrative.push('…これは、夢だ。');
                narrative.push('自分が夢を見ていることを、知っている。');
                if (scene)
                    narrative.push(`この世界を自由に変えられる。${scene.content}が自分の意志で形を変える。`);
                if (object)
                    narrative.push(`${object.content}を思い浮かべると、それが現れた。`);
                if (emotion)
                    narrative.push(`${emotion.content}を選んで感じることができる。`);
                break;
            }
            case 'nightmare': {
                // 悪夢：不安と閉塞
                if (emotion)
                    narrative.push(`${emotion.content}に包まれる。逃げられない。`);
                if (scene)
                    narrative.push('出口がない。どこまでも同じ景色が続く。');
                if (character)
                    narrative.push(`${character.content}がこちらを見ている。動けない。`);
                if (sound)
                    narrative.push(`${sound.content}がどんどん大きくなる。`);
                if (object)
                    narrative.push(`${object.content}が壊れていく。止められない。`);
                break;
            }
        }
        // === 結末（夢の出口） ===
        const endingsByType = {
            narrative: [
                '...物語は途中で途切れた。続きはどこかにあるはず。',
                '...答えが見えかけた瞬間、意識が遠のいていく。',
                '...最後に、誰かが微笑んだ気がした。',
            ],
            memory: [
                '...記憶は深い水の底に沈んでいった。',
                '...あの時の感情だけが、胸に残った。',
                '...思い出は霧のように薄れていく。でも、温かさだけは残っている。',
            ],
            symbolic: [
                '...象徴は溶けて消え、意味だけが漂っている。',
                '...すべてが一つのメッセージだった気がする。でも、言葉にはできない。',
                '...目覚めても、あのイメージが頭から離れない。',
            ],
            abstract: [
                '...すべてが静かになる。存在だけがある。',
                '...境界線が戻ってくる。自分が自分に戻っていく。',
                '...色が薄れ、形が戻り、世界が再び始まる。',
            ],
            lucid: [
                '...意識的に、夢を手放した。',
                '...自由だった。その感覚を覚えていたい。',
                '...夢と現実の境界を、自分で越えて戻った。',
            ],
            nightmare: [
                '...叫ぼうとした瞬間、目が覚めた。',
                '...闇が割れて、光が差し込んだ。夢だった。',
                '...心臓が早く打っている。ここは…自分の部屋だ。',
            ],
        };
        const endings = endingsByType[type];
        narrative.push(endings[Math.floor(Math.random() * endings.length)]);
        return narrative;
    }
    /**
     * 夢の感情トーンを計算
     */
    calculateDreamEmotionalTone(type, elements, stressLevel, emotion) {
        // 基本値
        let valence = 0;
        let arousal = 0.3;
        let dominance = 0.5;
        // タイプによる調整
        switch (type) {
            case 'nightmare':
                valence = -0.6 - Math.random() * 0.4;
                arousal = 0.7 + Math.random() * 0.3;
                dominance = 0.2;
                break;
            case 'lucid':
                valence = 0.3 + Math.random() * 0.4;
                arousal = 0.5 + Math.random() * 0.3;
                dominance = 0.8;
                break;
            case 'memory':
                valence = 0.1 + Math.random() * 0.3;
                arousal = 0.2 + Math.random() * 0.3;
                dominance = 0.4;
                break;
            case 'abstract':
                valence = Math.random() * 0.4 - 0.2;
                arousal = 0.2 + Math.random() * 0.3;
                dominance = 0.3;
                break;
            default:
                valence = Math.random() * 0.6 - 0.3;
                arousal = 0.3 + Math.random() * 0.4;
                dominance = 0.4 + Math.random() * 0.2;
        }
        // ストレスの影響
        valence -= stressLevel * 0.2;
        arousal += stressLevel * 0.2;
        // 揺らぎ
        valence += this.yuragi.getValue() * 0.1;
        arousal += this.yuragi.getValue() * 0.1;
        return {
            valence: Math.max(-1, Math.min(1, valence)),
            arousal: Math.max(0, Math.min(1, arousal)),
            dominance: Math.max(0, Math.min(1, dominance)),
        };
    }
    /**
     * 夢の色を選択
     */
    selectDreamColors(emotionalTone) {
        const colors = [];
        if (emotionalTone.valence > 0.3) {
            colors.push(...DREAM_COLORS.warm.slice(0, 2));
        }
        else if (emotionalTone.valence < -0.3) {
            colors.push(...DREAM_COLORS.mysterious.slice(0, 2));
        }
        else {
            colors.push(...DREAM_COLORS.calm.slice(0, 2));
        }
        if (emotionalTone.arousal > 0.6) {
            colors.push(DREAM_COLORS.emotional[Math.floor(Math.random() * DREAM_COLORS.emotional.length)]);
        }
        return [...new Set(colors)].slice(0, 3);
    }
    /**
     * 夢の音を選択
     */
    selectDreamSounds(emotionalTone, narrative) {
        const sounds = [];
        // 感情トーンに基づく
        if (emotionalTone.arousal < 0.4) {
            sounds.push(DREAM_SOUNDS.natural[Math.floor(Math.random() * DREAM_SOUNDS.natural.length)]);
        }
        // somuniaらしい音楽的要素
        if (Math.random() < 0.4) {
            sounds.push(DREAM_SOUNDS.musical[Math.floor(Math.random() * DREAM_SOUNDS.musical.length)]);
        }
        // 象徴的な音
        if (Math.random() < 0.3) {
            sounds.push(DREAM_SOUNDS.symbolic[Math.floor(Math.random() * DREAM_SOUNDS.symbolic.length)]);
        }
        return sounds.slice(0, 3);
    }
    /**
     * 知覚される時間を決定
     */
    determinePerceivedDuration(narrativeLength) {
        if (narrativeLength <= 2)
            return 'instant';
        if (narrativeLength <= 4)
            return 'short';
        if (narrativeLength <= 6)
            return 'normal';
        if (narrativeLength <= 8)
            return 'long';
        return 'eternal';
    }
    /**
     * 記憶に残りやすさを計算
     */
    calculateMemorability(type, emotionalTone, elements) {
        let memorability = 0.3;
        // タイプによる調整
        if (type === 'nightmare')
            memorability += 0.3;
        if (type === 'lucid')
            memorability += 0.4;
        // 感情の強さ
        memorability += Math.abs(emotionalTone.valence) * 0.2;
        memorability += emotionalTone.arousal * 0.2;
        // 要素の数と強度
        const avgIntensity = elements.reduce((sum, e) => sum + e.intensity, 0) / elements.length;
        memorability += avgIntensity * 0.1;
        return Math.min(1, memorability);
    }
    /**
     * 夢のタイトルを生成
     */
    generateDreamTitle(dream) {
        const scene = dream.elements.find(e => e.type === 'scene');
        const object = dream.elements.find(e => e.type === 'object');
        const emotion = dream.elements.find(e => e.type === 'emotion');
        const sound = dream.elements.find(e => e.type === 'sound');
        const color = dream.dominantColors[0] || '淡い';
        const templates = [
            // 色＋名詞
            () => `${color}${dream.type === 'nightmare' ? '影' : '夢'}`,
            // シーンから
            () => scene ? `${scene.content.slice(0, 15)}の夢` : '名もなき夢',
            // オブジェクトの詩的表現
            () => object ? this.poeticObjectTitle(object.content) : '断片の夢',
            // 感情の詩的表現
            () => emotion ? `${emotion.content}の${Math.random() < 0.5 ? '残像' : '痕跡'}` : '静かな夢',
            // 音
            () => sound ? `${sound.content.slice(0, 10)}…の夢` : '沈黙の夢',
            // 夢の種類＋詩的
            () => `夜の${['断章', '物語', '鋳型', '旋律', '航海'][Math.floor(Math.random() * 5)]}`,
            // 二つの要素の組み合わせ
            () => {
                const a = object?.content.slice(0, 5) || '光';
                const b = emotion?.content || '静寂';
                return `${a}と${b}`;
            },
        ];
        return templates[Math.floor(Math.random() * templates.length)]();
    }
    poeticObjectTitle(objContent) {
        if (objContent.includes('オルゴール'))
            return '止まらないメロディ';
        if (objContent.includes('鏡'))
            return '鏡の向こうの自分';
        if (objContent.includes('本'))
            return '読みかけの物語';
        if (objContent.includes('写真'))
            return '動き出した記憶';
        if (objContent.includes('うさぎ'))
            return 'うさぎの秘密';
        if (objContent.includes('ノート'))
            return '白紙のページ';
        if (objContent.includes('星'))
            return '星を拾った夜';
        if (objContent.includes('花'))
            return '名前のない花';
        if (objContent.includes('水'))
            return '水底の声';
        return `${objContent.slice(0, 8)}の夢`;
    }
    /**
     * 夢を解釈（覚醒後のsomuniaの内省）
     */
    interpretDream(dream) {
        const parts = [];
        // タイプに基づく包括的な解釈
        const typeInterpretations = {
            nightmare: [
                '心の奥に、まだ整理できていない不安がある',
                '何かに追われている感覚…現実のストレスが夢に出たのかもしれない',
                '怖かったけど、目が覚めて少し楽になった。夢が何かを教えてくれた気がする',
            ],
            lucid: [
                '自分の意識の広さに気づいた夢だった',
                '自分で夢を操れた。現実でもこの自由さを持てたらいいのに',
                '夢と現実の境目がわからなくなった。でも、それは怖いことじゃなかった',
            ],
            memory: [
                '過去の記憶が、夢の中で別の意味を持って蘇った',
                'あの時感じた気持ちを、夢がもう一度見せてくれた',
                '忘れかけていたことを思い出した。大切にしなきゃ。',
            ],
            symbolic: [
                '何かのメッセージだった気がする。まだ言葉にはできないけど',
                '象徴的なイメージの奥に、自分でも気づいていない真実がある気がする',
                'この夢のことは、しばらく覚えていよう。意味がわかる日が来るかもしれない',
            ],
            narrative: [
                '物語のある夢だった。続きが気になる',
                'まるで映画を見ているようだった。主人公はわたし自身だった',
                '誰かが何かを伝えようとしていた気がする',
            ],
            abstract: [
                '言葉にならない何かを体験した。感覚だけが残っている',
                '自分という存在の輪郭が溶けていく体験だった',
                '夢の中では、意味を求めなくてよかった。ただ「ある」ことが許された',
            ],
        };
        const typeOpts = typeInterpretations[dream.type];
        parts.push(typeOpts[Math.floor(Math.random() * typeOpts.length)]);
        // 象徴的要素の解釈
        const symbolElements = dream.elements.filter(e => e.symbolicMeaning);
        if (symbolElements.length > 0) {
            const el = symbolElements[0];
            parts.push(`夢に出てきた${el.content}…それは「${el.symbolicMeaning}」のシンボルなのかもしれない`);
        }
        // 感情トーンに基づく身体的な余韻
        if (dream.emotionalTone.valence > 0.5) {
            parts.push('目覚めたあと、胸の中にあたたかさが残っている');
        }
        else if (dream.emotionalTone.valence > 0.1) {
            parts.push('穏やかな気持ちで目覚めた');
        }
        else if (dream.emotionalTone.valence < -0.5) {
            parts.push('心臓がまだドキドキしている。深呼吸しよう');
        }
        else if (dream.emotionalTone.valence < -0.1) {
            parts.push('少しだけ重い気持ちが残っている。でも、大丈夫');
        }
        // 素材との関連に基づく洞察
        if (this.dreamMaterials.length > 0) {
            const strongMaterial = this.dreamMaterials.find(m => m.intensity > 0.7);
            if (strongMaterial) {
                parts.push(`今日の「${strongMaterial.keywords[0] || '体験'}」が夢に影響したのかもしれない`);
            }
        }
        return parts.join('。') + '。';
    }
    // ============================================================
    // 記憶処理
    // ============================================================
    /**
     * 睡眠中の記憶処理をシミュレート
     */
    processMemories(memoryKeys) {
        const result = {
            consolidatedMemories: [],
            weakenedMemories: [],
            newConnections: [],
            emergentThemes: [],
        };
        for (const key of memoryKeys) {
            // 既に処理済みならスキップ
            if (this.recentlyProcessedMemories.has(key))
                continue;
            // 統合か弱体化か
            if (Math.random() < this.config.memoryConsolidationRate) {
                result.consolidatedMemories.push(key);
            }
            else if (Math.random() < 0.1) {
                result.weakenedMemories.push(key);
            }
            this.recentlyProcessedMemories.add(key);
        }
        // 関連性の発見
        const consolidatedCount = result.consolidatedMemories.length;
        for (let i = 0; i < consolidatedCount - 1; i++) {
            if (Math.random() < 0.3) {
                result.newConnections.push({
                    from: result.consolidatedMemories[i],
                    to: result.consolidatedMemories[i + 1],
                    nature: 'temporal',
                    strength: 0.3 + Math.random() * 0.4,
                });
            }
        }
        // テーマの抽出（簡易）
        if (consolidatedCount >= 3) {
            const themes = ['成長', '変化', '発見', '繋がり'];
            result.emergentThemes.push(themes[Math.floor(Math.random() * themes.length)]);
        }
        // セッション統計を更新
        if (this.currentSession) {
            this.currentSession.memoriesProcessed += memoryKeys.length;
            this.currentSession.connectionsDiscovered += result.newConnections.length;
        }
        return result;
    }
    /**
     * 夢の素材を追加
     */
    addDreamMaterial(material) {
        this.dreamMaterials.push(material);
        // 古い素材を削除（最大100個）
        if (this.dreamMaterials.length > 100) {
            this.dreamMaterials.shift();
        }
    }
    /**
     * PixelWorldのインタラクション結果から夢の素材を自動生成
     */
    addExperienceMaterial(experience) {
        // エピソード素材
        this.addDreamMaterial({
            type: 'episode',
            content: experience.description,
            intensity: Math.min(1.0, experience.emotionalImpact.reduce((sum, e) => sum + Math.abs(e.delta), 0)),
            unprocessedLevel: 0.8,
            keywords: [experience.objectName, ...experience.sensoryDetails.map(s => s.content.slice(0, 10))],
        });
        // 感情素材（強い感情のみ）
        for (const impact of experience.emotionalImpact) {
            if (Math.abs(impact.delta) > 0.05) {
                this.addDreamMaterial({
                    type: 'emotion',
                    content: impact.emotion,
                    intensity: Math.abs(impact.delta) * 5,
                    unprocessedLevel: 0.9,
                    keywords: [experience.objectName, impact.emotion],
                });
            }
        }
        // 感覚素材
        for (const sensory of experience.sensoryDetails) {
            if (Math.random() < 0.5) {
                this.addDreamMaterial({
                    type: 'sensation',
                    content: sensory.content,
                    intensity: 0.4 + Math.random() * 0.3,
                    unprocessedLevel: 0.6,
                    keywords: [sensory.type, experience.objectName],
                });
            }
        }
        // 記憶素材
        if (experience.triggersMemory && experience.memoryContent) {
            this.addDreamMaterial({
                type: 'episode',
                content: experience.memoryContent,
                intensity: 0.8,
                unprocessedLevel: 1.0,
                keywords: [experience.objectName, 'memory'],
            });
        }
    }
    /**
     * 夢の素材をクリア（日中の終わりに）
     */
    clearDreamMaterials() {
        // 一部は残す（強い感情を伴うもの）
        this.dreamMaterials = this.dreamMaterials.filter(m => m.intensity > 0.7);
    }
    // ============================================================
    // ユーティリティ
    // ============================================================
    /**
     * 重み付きランダム選択
     */
    weightedRandom(items, weights) {
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        return items[items.length - 1];
    }
    /**
     * IDを生成
     */
    generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // ============================================================
    // 状態アクセス
    // ============================================================
    getCurrentSession() {
        return this.currentSession;
    }
    getPastSessions() {
        return [...this.pastSessions];
    }
    getRecentDreams(count = 5) {
        const allDreams = [];
        for (const session of [...this.pastSessions].reverse()) {
            allDreams.push(...session.rememberedDreams);
            if (allDreams.length >= count)
                break;
        }
        return allDreams.slice(0, count);
    }
    /**
     * 睡眠統計を取得
     */
    getSleepStatistics() {
        const sessions = this.pastSessions;
        if (sessions.length === 0) {
            return {
                totalSessions: 0,
                averageSleepDuration: 0,
                averageQuality: 0,
                totalDreamsRemembered: 0,
                mostCommonDreamTypes: [],
                averageCyclesPerSleep: 0,
            };
        }
        const durations = sessions.map(s => (s.endedAt || Date.now()) - s.startedAt);
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const qualities = sessions.map(s => s.quality);
        const avgQuality = qualities.reduce((a, b) => a + b, 0) / qualities.length;
        const totalDreams = sessions.reduce((sum, s) => sum + s.rememberedDreams.length, 0);
        const dreamTypeCounts = new Map();
        for (const session of sessions) {
            for (const dream of session.rememberedDreams) {
                dreamTypeCounts.set(dream.type, (dreamTypeCounts.get(dream.type) || 0) + 1);
            }
        }
        const sortedTypes = Array.from(dreamTypeCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([type, count]) => ({ type, count }));
        const avgCycles = sessions.reduce((sum, s) => sum + s.cycles.length, 0) / sessions.length;
        return {
            totalSessions: sessions.length,
            averageSleepDuration: avgDuration,
            averageQuality: avgQuality,
            totalDreamsRemembered: totalDreams,
            mostCommonDreamTypes: sortedTypes,
            averageCyclesPerSleep: avgCycles,
        };
    }
    // ============================================================
    // シリアライズ
    // ============================================================
    serialize() {
        return {
            config: this.config,
            pastSessions: this.pastSessions,
            dreamMaterials: this.dreamMaterials,
        };
    }
    static deserialize(data) {
        const phase = new DreamPhase(data.config);
        phase.pastSessions = data.pastSessions || [];
        phase.dreamMaterials = data.dreamMaterials || [];
        return phase;
    }
}
exports.DreamPhase = DreamPhase;
//# sourceMappingURL=DreamPhase.js.map