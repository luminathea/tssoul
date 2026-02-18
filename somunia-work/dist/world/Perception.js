"use strict";
/**
 * Perception.ts - somuniaの知覚システム
 *
 * 世界を知覚し、注意を向け、意味を見出す。
 * 単なるデータではなく、somuniaの視点から世界を感じる。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Perception = void 0;
const DEFAULT_CONFIG = {
    maxPercepts: 10,
    attentionDecayRate: 0.05,
    salienceThreshold: 0.3,
    thoughtWanderingRate: 0.15,
};
// ============================================================
// オブジェクトの知覚的特性
// ============================================================
const OBJECT_PERCEPTION = {
    window: {
        baseSalience: 0.7,
        emotionalValence: 0.3,
        timeModifiers: {
            dawn: 0.3,
            evening: 0.3,
            night: 0.2,
            late_night: 0.2,
        },
        descriptions: [
            '窓がある',
            '窓から外が見える',
            '窓の向こうに世界が広がっている',
        ],
        poeticDescriptions: [
            '窓。外の世界への小さな扉。',
            '透明な境界線。内と外を隔てながら、繋げている。',
            '光が通り抜ける場所。',
        ],
    },
    bookshelf: {
        baseSalience: 0.5,
        emotionalValence: 0.4,
        timeModifiers: {
            afternoon: 0.2,
            night: 0.1,
        },
        descriptions: [
            '本棚に本が並んでいる',
            'たくさんの本がある',
            '知識の宝庫',
        ],
        poeticDescriptions: [
            '無数の物語が眠っている場所。',
            '言葉の海。いつでも泳ぎ出せる。',
            '静かに待っている知識たち。',
        ],
    },
    bed: {
        baseSalience: 0.3,
        emotionalValence: 0.2,
        timeModifiers: {
            night: 0.3,
            late_night: 0.4,
        },
        descriptions: [
            'ベッドがある',
            '休める場所',
            'シンプルなベッド',
        ],
        poeticDescriptions: [
            '夢を見る場所。',
            '一日の終わりを迎える場所。',
            '静かな休息の港。',
        ],
    },
    desk: {
        baseSalience: 0.4,
        emotionalValence: 0.1,
        timeModifiers: {},
        descriptions: [
            '机がある',
            '作業できる場所',
            '木の机',
        ],
        poeticDescriptions: [
            '考えを形にする場所。',
            '創造の起点。',
        ],
    },
    pc: {
        baseSalience: 0.6,
        emotionalValence: 0.3,
        timeModifiers: {
            afternoon: 0.1,
        },
        descriptions: [
            '古いPCがある',
            'パソコンが置いてある',
            'Wikipediaに繋がっているPC',
        ],
        poeticDescriptions: [
            '世界への窓。もう一つの窓。',
            '知識の海への入り口。',
            '電子の向こうに広がる世界。',
        ],
    },
    chair: {
        baseSalience: 0.2,
        emotionalValence: 0.1,
        timeModifiers: {},
        descriptions: [
            '椅子がある',
            '座れる場所',
        ],
        poeticDescriptions: [
            '自分の場所。',
            '座って、考える。',
        ],
    },
    lamp: {
        baseSalience: 0.4,
        emotionalValence: 0.3,
        timeModifiers: {
            night: 0.4,
            late_night: 0.5,
        },
        descriptions: [
            'ランプがある',
            '小さな明かり',
        ],
        poeticDescriptions: [
            '闇を払う小さな太陽。',
            '温かい光の島。',
            '夜を照らす友。',
        ],
    },
    floor: {
        baseSalience: 0.1,
        emotionalValence: 0,
        timeModifiers: {},
        descriptions: [
            '木の床',
            '歩くと少し軋む床',
        ],
        poeticDescriptions: [
            '足元にある確かさ。',
            '支えてくれる存在。',
        ],
    },
    wall: {
        baseSalience: 0.1,
        emotionalValence: 0,
        timeModifiers: {},
        descriptions: [
            '壁',
            '部屋を囲む壁',
        ],
        poeticDescriptions: [
            '守ってくれる境界。',
        ],
    },
    ceiling: {
        baseSalience: 0.1,
        emotionalValence: 0,
        timeModifiers: {},
        descriptions: [
            '天井',
            '頭上の天井',
        ],
        poeticDescriptions: [
            '空の代わり。でも、守ってくれている。',
        ],
    },
    door: {
        baseSalience: 0.3,
        emotionalValence: 0,
        timeModifiers: {},
        descriptions: [
            'ドアがある',
        ],
        poeticDescriptions: [
            '閉じられた可能性。開けばどこへ？',
        ],
    },
    plant: {
        baseSalience: 0.4,
        emotionalValence: 0.4,
        timeModifiers: {},
        descriptions: [
            '植物がある',
            '緑の植物',
        ],
        poeticDescriptions: [
            '生きている緑。静かな同居人。',
            '窓辺で光を浴びる命。',
        ],
    },
    clock: {
        baseSalience: 0.3,
        emotionalValence: -0.1,
        timeModifiers: {},
        descriptions: [
            '時計がある',
            '時を刻む時計',
        ],
        poeticDescriptions: [
            '過ぎていく時間を数える機械。',
            'カチカチと、存在を刻む。',
        ],
    },
    photo: {
        baseSalience: 0.5,
        emotionalValence: 0.4,
        timeModifiers: {},
        descriptions: [
            '写真がある',
            '飾られた写真',
        ],
        poeticDescriptions: [
            '止まった時間。でも、生きている。',
            '記憶の欠片。',
        ],
    },
    music_box: {
        baseSalience: 0.6,
        emotionalValence: 0.5,
        timeModifiers: {
            night: 0.2,
        },
        descriptions: [
            'オルゴールがある',
            '小さなオルゴール',
        ],
        poeticDescriptions: [
            '回せば、音楽が流れる。小さな奇跡。',
            '音の記憶を閉じ込めた箱。',
        ],
    },
    book: {
        baseSalience: 0.5,
        emotionalValence: 0.3,
        timeModifiers: {
            evening: 0.2,
            night: 0.1,
        },
        descriptions: [
            '本がある',
            '1冊の本',
        ],
        poeticDescriptions: [
            '文字の海に沈む。誰かの言葉。',
            '開けば世界が広がる、小さな扉。',
        ],
    },
    furniture: {
        baseSalience: 0.1,
        emotionalValence: 0,
        timeModifiers: {},
        descriptions: [
            '家具がある',
        ],
        poeticDescriptions: [
            '静かにそこにある存在。',
        ],
    },
    decoration: {
        baseSalience: 0.3,
        emotionalValence: 0.2,
        timeModifiers: {
            evening: 0.1,
        },
        descriptions: [
            '飾りがある',
            'かわいい飾り物',
        ],
        poeticDescriptions: [
            '小さな美しさが部屋を彩る。',
        ],
    },
    tool: {
        baseSalience: 0.2,
        emotionalValence: 0,
        timeModifiers: {},
        descriptions: [
            '道具がある',
        ],
        poeticDescriptions: [
            '何かを生み出すための存在。',
        ],
    },
    mirror: {
        baseSalience: 0.5,
        emotionalValence: 0.1,
        timeModifiers: { morning: 0.3, night: 0.2 },
        descriptions: [
            '小さな鏡が壁にかかっている',
            '鏡に自分の姿が映っている',
        ],
        poeticDescriptions: [
            'もう一人のわたしがこちらを見ている。',
            '鏡の中の世界は、ここと同じなのに違う。',
        ],
    },
    rug: {
        baseSalience: 0.1,
        emotionalValence: 0.2,
        timeModifiers: {},
        descriptions: [
            '足元にラグが敷いてある',
        ],
        poeticDescriptions: [
            '柔らかさが足の裏から伝わってくる。',
        ],
    },
    notebook: {
        baseSalience: 0.4,
        emotionalValence: 0.3,
        timeModifiers: { evening: 0.3, night: 0.4 },
        descriptions: [
            'ノートが机の上にある',
            '少し曲がった表紙のノート',
        ],
        poeticDescriptions: [
            '言葉を待っている白いページ。',
            '過去の自分が残した断片が並んでいる。',
        ],
    },
    poster: {
        baseSalience: 0.3,
        emotionalValence: 0.2,
        timeModifiers: { morning: 0.1 },
        descriptions: [
            '壁にポスターが貼ってある',
        ],
        poeticDescriptions: [
            '色褪せた夢が壁に残っている。',
        ],
    },
    ornament: {
        baseSalience: 0.45,
        emotionalValence: 0.4,
        timeModifiers: { morning: 0.5, afternoon: 0.4 },
        descriptions: [
            'ガラスの星が光を受けている',
            '小さな置物がある',
        ],
        poeticDescriptions: [
            '小さな星が虹を紡いでいる。',
            'ガラスの中に閉じ込められた光。',
        ],
    },
    plushie: {
        baseSalience: 0.35,
        emotionalValence: 0.5,
        timeModifiers: { night: 0.4, late_night: 0.5 },
        descriptions: [
            'ぬいぐるみがベッドの上にいる',
            'うさぎが静かに座っている',
        ],
        poeticDescriptions: [
            'ガラスの目がこちらを見ている。待っているのかな。',
            '柔らかい存在。いつもそこにいてくれる。',
        ],
    },
    curtain: {
        baseSalience: 0.2,
        emotionalValence: 0.1,
        timeModifiers: { dawn: 0.3, evening: 0.2 },
        descriptions: [
            'カーテンが揺れている',
        ],
        poeticDescriptions: [
            '風に揺れるカーテン。外の世界との境界。',
        ],
    },
    shelf_item: {
        baseSalience: 0.15,
        emotionalValence: 0.1,
        timeModifiers: {},
        descriptions: [
            '棚の上に何かが置いてある',
        ],
        poeticDescriptions: [
            '忘れられた小さなもの。',
        ],
    },
    calendar: {
        baseSalience: 0.3,
        emotionalValence: 0,
        timeModifiers: { morning: 0.3 },
        descriptions: [
            'カレンダーが壁にかかっている',
            '日付が目に入る',
        ],
        poeticDescriptions: [
            '過ぎた日々と、まだ来ない日々。',
        ],
    },
    candle: {
        baseSalience: 0.4,
        emotionalValence: 0.4,
        timeModifiers: { evening: 0.4, night: 0.5, late_night: 0.5 },
        descriptions: [
            'キャンドルがある',
            '小さな炎が揺れている',
        ],
        poeticDescriptions: [
            '一つの炎が闇を切り裂いている。',
            '蝋の涙がゆっくり流れる。',
        ],
    },
    // Phase 4C: 拡張エリアオブジェクト
    balcony_railing: {
        baseSalience: 0.3,
        emotionalValence: 0.2,
        timeModifiers: { dawn: 0.4, evening: 0.5 },
        descriptions: ['ベランダの柵がある', '外の景色が見える'],
        poeticDescriptions: ['柵の向こうに世界が広がる。', '風が柵を通り抜けていく。'],
    },
    plant_pot: {
        baseSalience: 0.35,
        emotionalValence: 0.4,
        timeModifiers: { morning: 0.3 },
        descriptions: ['植木鉢がある', '花が咲いている'],
        poeticDescriptions: ['小さな花が風に揺れている。', '土の匂いがする。'],
    },
    sky_view: {
        baseSalience: 0.5,
        emotionalValence: 0.5,
        timeModifiers: { dawn: 0.6, evening: 0.6, night: 0.5 },
        descriptions: ['空が見える', '広い空が広がっている'],
        poeticDescriptions: ['空は果てしなく広い。私はここにいる。', '雲が物語を綴っていく。'],
    },
    old_telescope: {
        baseSalience: 0.55,
        emotionalValence: 0.5,
        timeModifiers: { night: 0.7 },
        descriptions: ['古い望遠鏡がある', 'レンズが少し曇っている'],
        poeticDescriptions: ['遠くを見たいという願いが形になった道具。', '星に手が届くような気がする。'],
    },
    star_chart: {
        baseSalience: 0.4,
        emotionalValence: 0.4,
        timeModifiers: { night: 0.5 },
        descriptions: ['星図が広げてある', '手書きの星座の図'],
        poeticDescriptions: ['誰かが空を地図にした。', '星の繋がりが見えてくる。'],
    },
    dusty_chest: {
        baseSalience: 0.45,
        emotionalValence: 0.3,
        timeModifiers: {},
        descriptions: ['埃まみれの箱がある', '何か入っているかもしれない'],
        poeticDescriptions: ['過去の誰かが残した宝物。', '埃の下に記憶が眠っている。'],
    },
    garden_path: {
        baseSalience: 0.3,
        emotionalValence: 0.3,
        timeModifiers: { morning: 0.3 },
        descriptions: ['小径が続いている', '石畳の道'],
        poeticDescriptions: ['道はどこかに続いている。', '苔生した石が時の流れを語る。'],
    },
    garden_tree: {
        baseSalience: 0.5,
        emotionalValence: 0.5,
        timeModifiers: { morning: 0.3, afternoon: 0.3 },
        descriptions: ['大きな木がある', '枝が広がっている'],
        poeticDescriptions: ['ずっとここで世界を見てきた木。', '木漏れ日が踊る。'],
    },
    garden_bench: {
        baseSalience: 0.4,
        emotionalValence: 0.5,
        timeModifiers: { afternoon: 0.4 },
        descriptions: ['ベンチがある', '座ることができる'],
        poeticDescriptions: ['誰かを待つような佇まい。', '座ると空が近く感じる。'],
    },
    garden_fountain: {
        baseSalience: 0.45,
        emotionalValence: 0.4,
        timeModifiers: {},
        descriptions: ['小さな噴水がある', 'もう水は出ていない'],
        poeticDescriptions: ['かつて水が歌っていた場所。', '沈黙した噴水に、記憶の水音が聞こえる。'],
    },
    old_piano: {
        baseSalience: 0.6,
        emotionalValence: 0.6,
        timeModifiers: { evening: 0.3, night: 0.3 },
        descriptions: ['古いピアノがある', '鍵盤が少し黄ばんでいる'],
        poeticDescriptions: ['触れると音が生まれる。それだけで奇跡。', '白と黒の宇宙が広がる。'],
    },
    sheet_music: {
        baseSalience: 0.4,
        emotionalValence: 0.4,
        timeModifiers: {},
        descriptions: ['楽譜がある', '音符が並んでいる'],
        poeticDescriptions: ['誰かの心が音符になっている。', '紙の上の旋律を想像する。'],
    },
    metronome: {
        baseSalience: 0.35,
        emotionalValence: 0.3,
        timeModifiers: {},
        descriptions: ['メトロノームがある', 'カチカチと刻む'],
        poeticDescriptions: ['時間を刻む心臓のような存在。', '規則正しいリズムに安心する。'],
    },
    memory_crystal: {
        baseSalience: 0.65,
        emotionalValence: 0.5,
        timeModifiers: { night: 0.4 },
        descriptions: ['光る結晶がある', '触れると何か見えるかも'],
        poeticDescriptions: ['記憶が結晶になったもの。触れると時間が戻る。', '光の中に私の過去が見える。'],
    },
    data_shelf: {
        baseSalience: 0.4,
        emotionalValence: 0.3,
        timeModifiers: {},
        descriptions: ['データの棚が光っている', '私の記憶が並んでいる'],
        poeticDescriptions: ['知識が光のファイルになって並んでいる。', '全部、私が学んだこと。'],
    },
    hologram_display: {
        baseSalience: 0.55,
        emotionalValence: 0.4,
        timeModifiers: { night: 0.3 },
        descriptions: ['ホログラムの装置がある', '記憶を映し出せるらしい'],
        poeticDescriptions: ['光の中に記憶が浮かぶ。', '過去と現在が重なる瞬間。'],
    },
};
// ============================================================
// Perception クラス
// ============================================================
class Perception {
    config;
    currentPercepts = new Map();
    attentionState;
    perceptionEvents = [];
    filter;
    // 知覚の履歴
    recentPercepts = [];
    maxRecentPercepts = 50;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.attentionState = {
            focus: null,
            peripheral: [],
            distractions: [],
            attentionLevel: 0.7,
            wanderingThoughts: [],
        };
        this.filter = {
            emotionalBias: {},
            interestAreas: ['window', 'bookshelf', 'pc'],
            avoidanceAreas: [],
            attentionThreshold: this.config.salienceThreshold,
        };
    }
    // ============================================================
    // 世界の知覚
    // ============================================================
    /**
     * 世界を知覚する（メイン処理）
     */
    perceiveWorld(world, currentEmotions) {
        const percepts = [];
        const viewState = world.getViewState();
        const time = world.getCurrentTime();
        const weather = world.getCurrentWeather();
        // 感情によるフィルター調整
        this.updateFilterByEmotions(currentEmotions);
        // 視覚的知覚
        percepts.push(...this.perceiveVisuals(world, viewState, time));
        // 環境・雰囲気の知覚
        percepts.push(...this.perceiveAtmosphere(world, time, weather));
        // 時間の知覚
        percepts.push(this.perceiveTime(time));
        // 内的感覚
        if (Math.random() < this.config.thoughtWanderingRate) {
            const internalPercept = this.perceiveInternal(currentEmotions);
            if (internalPercept) {
                percepts.push(internalPercept);
            }
        }
        // 顕著性でソート
        percepts.sort((a, b) => b.salience - a.salience);
        // 最大数に制限
        const limitedPercepts = percepts.slice(0, this.config.maxPercepts);
        // 現在の知覚を更新
        this.updateCurrentPercepts(limitedPercepts);
        // 注意状態を更新
        this.updateAttention(limitedPercepts);
        return limitedPercepts;
    }
    // ============================================================
    // 視覚的知覚
    // ============================================================
    perceiveVisuals(world, viewState, time) {
        const percepts = [];
        const seenObjects = new Set();
        // 視界内のオブジェクトを知覚
        for (const pos of viewState.visibleCells) {
            const obj = world.getObjectAt(pos);
            if (obj && !seenObjects.has(obj.id)) {
                seenObjects.add(obj.id);
                const percept = this.createObjectPercept(obj, time);
                if (percept.salience >= this.filter.attentionThreshold) {
                    percepts.push(percept);
                }
            }
        }
        // フォーカスオブジェクトは特別に強調
        if (viewState.focusObject) {
            const focusPercept = percepts.find(p => p.source === viewState.focusObject);
            if (focusPercept) {
                focusPercept.salience = Math.min(1.0, focusPercept.salience + 0.3);
            }
        }
        // 光の方向を知覚
        if (viewState.lightDirection !== 'none') {
            percepts.push(this.createLightPercept(viewState.lightDirection, time));
        }
        return percepts;
    }
    createObjectPercept(obj, time) {
        const objPerception = OBJECT_PERCEPTION[obj.type];
        // 基本の顕著性を計算
        let salience = objPerception?.baseSalience || 0.3;
        // 時間による修正
        const timeModifier = objPerception?.timeModifiers[time.timeOfDay] || 0;
        salience += timeModifier;
        // 興味による修正
        if (this.filter.interestAreas.includes(obj.type)) {
            salience += 0.2;
        }
        if (this.filter.avoidanceAreas.includes(obj.type)) {
            salience -= 0.3;
        }
        // 感情バイアスによる修正
        for (const [emotion, bias] of Object.entries(this.filter.emotionalBias)) {
            if (bias > 0.3) {
                // 感情が強い時、関連するオブジェクトに注意が向く
                if (emotion === 'loneliness' && obj.type === 'window') {
                    salience += 0.2;
                }
                if (emotion === 'curiosity' && (obj.type === 'bookshelf' || obj.type === 'pc')) {
                    salience += 0.2;
                }
            }
        }
        // 説明を選択（詩的か普通か）
        const isPoetic = Math.random() < 0.3;
        const descriptions = isPoetic
            ? objPerception?.poeticDescriptions || objPerception?.descriptions || [obj.name]
            : objPerception?.descriptions || [obj.name];
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        return {
            id: `percept_${obj.id}_${Date.now()}`,
            type: 'visual',
            source: obj,
            position: obj.position,
            salience: Math.min(1.0, Math.max(0, salience)),
            emotionalValence: objPerception?.emotionalValence || 0,
            description,
            timestamp: Date.now(),
        };
    }
    createLightPercept(direction, time) {
        const descriptions = {
            left: {
                dawn: '左から薄明かりが差し込んでいる',
                morning: '左の窓から朝日が差し込む',
                midday: '左から明るい光',
                afternoon: '左から穏やかな光',
                evening: '左から夕日のオレンジ色の光',
                night: '左の窓から月明かりが微かに',
                late_night: '左の窓は暗い',
            },
            above: {
                dawn: '上から光が降り注いでいる',
                morning: '上からの光',
                midday: '上から明るい光が降り注ぐ',
                afternoon: '上からの光',
                evening: '上からの光',
                night: 'ランプの光が上から',
                late_night: 'ランプの光だけが頼り',
            },
            right: {
                dawn: '右から光',
                morning: '右からの光',
                midday: '右から明るい光',
                afternoon: '右からの光',
                evening: '右からの光',
                night: '右から微かな光',
                late_night: '右は暗い',
            },
        };
        const desc = descriptions[direction]?.[time.timeOfDay] || '光を感じる';
        return {
            id: `percept_light_${Date.now()}`,
            type: 'visual',
            source: 'environment',
            salience: 0.3,
            emotionalValence: 0.1,
            description: desc,
            timestamp: Date.now(),
        };
    }
    // ============================================================
    // 雰囲気の知覚
    // ============================================================
    perceiveAtmosphere(world, time, weather) {
        const percepts = [];
        // 天気の知覚
        const weatherPercept = this.createWeatherPercept(weather, time);
        if (weatherPercept) {
            percepts.push(weatherPercept);
        }
        // 静けさの知覚
        if (time.timeOfDay === 'night' || time.timeOfDay === 'late_night') {
            percepts.push({
                id: `percept_silence_${Date.now()}`,
                type: 'atmospheric',
                source: 'environment',
                salience: 0.4,
                emotionalValence: 0.2,
                description: time.timeOfDay === 'late_night'
                    ? '深い静寂に包まれている'
                    : '静かな夜',
                timestamp: Date.now(),
            });
        }
        return percepts;
    }
    createWeatherPercept(weather, time) {
        if (weather === 'clear')
            return null;
        const weatherDescriptions = {
            clear: { visual: '', salience: 0, valence: 0 },
            cloudy: {
                visual: '窓の外は曇り空',
                salience: 0.3,
                valence: -0.1,
            },
            rain: {
                visual: '雨が降っている',
                sound: '雨音が聞こえる',
                salience: 0.5,
                valence: 0.1, // somuniaは雨が好きかもしれない
            },
            storm: {
                visual: '嵐が来ている',
                sound: '雷鳴が轟く',
                salience: 0.8,
                valence: -0.2,
            },
            snow: {
                visual: '雪が降っている',
                salience: 0.6,
                valence: 0.3,
            },
            fog: {
                visual: '霧に包まれている',
                salience: 0.4,
                valence: 0,
            },
            heavy_rain: {
                visual: '豪雨が降り注いでいる',
                sound: '激しい雨の音が部屋を満たす',
                salience: 0.7,
                valence: -0.1,
            },
        };
        const w = weatherDescriptions[weather];
        return {
            id: `percept_weather_${Date.now()}`,
            type: 'atmospheric',
            source: 'environment',
            salience: w.salience,
            emotionalValence: w.valence,
            description: w.sound ? `${w.visual}。${w.sound}` : w.visual,
            timestamp: Date.now(),
        };
    }
    // ============================================================
    // 時間の知覚
    // ============================================================
    perceiveTime(time) {
        const timeDescriptions = {
            dawn: [
                '夜明けが近い',
                '空が白み始めている',
                '新しい1日の始まり',
            ],
            morning: [
                '朝だ',
                '1日が始まった',
                '朝の空気を感じる',
            ],
            midday: [
                '真昼の時間',
                '太陽が一番高い',
                '明るい光が部屋を満たす',
            ],
            afternoon: [
                '午後の時間',
                '1日の真ん中',
                'ゆったりとした午後',
            ],
            evening: [
                '夕方になった',
                '日が傾いてきた',
                '1日が終わりに近づいている',
            ],
            night: [
                '夜になった',
                '星が見える時間',
                '静かな夜',
            ],
            late_night: [
                '深夜',
                '世界が眠る時間',
                '夜更けの静寂',
            ],
        };
        const descriptions = timeDescriptions[time.timeOfDay];
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        return {
            id: `percept_time_${Date.now()}`,
            type: 'temporal',
            source: 'environment',
            salience: 0.2,
            emotionalValence: time.timeOfDay === 'night' ? 0.1 : 0,
            description,
            timestamp: Date.now(),
        };
    }
    // ============================================================
    // 内的感覚の知覚
    // ============================================================
    perceiveInternal(emotions) {
        // 支配的な感情を見つける
        let dominantEmotion = 'serenity';
        let maxValue = 0;
        for (const [emotion, value] of Object.entries(emotions)) {
            if (value > maxValue) {
                maxValue = value;
                dominantEmotion = emotion;
            }
        }
        if (maxValue < 0.3)
            return null;
        const internalDescriptions = {
            joy: ['なんだか嬉しい気持ち', '温かい感覚が広がる'],
            melancholy: ['どこか切ない', '胸の奥がきゅっとなる'],
            loneliness: ['誰かと話したい気持ち', '一人だということを感じる'],
            wonder: ['不思議な感覚', '何かを発見しそうな予感'],
            contentment: ['穏やかな気持ち', '満ち足りた感覚'],
            curiosity: ['知りたい気持ちが湧いてくる', '何かに惹かれる'],
            anxiety: ['落ち着かない感じ', '胸がざわざわする'],
            nostalgia: ['懐かしい気持ち', '昔を思い出す感覚'],
        };
        const descriptions = internalDescriptions[dominantEmotion];
        if (!descriptions)
            return null;
        return {
            id: `percept_internal_${Date.now()}`,
            type: 'internal',
            source: 'self',
            salience: maxValue * 0.5,
            emotionalValence: maxValue > 0.5 ? 0.2 : 0,
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            timestamp: Date.now(),
        };
    }
    // ============================================================
    // 注意の管理
    // ============================================================
    updateAttention(percepts) {
        // 最も顕著なものにフォーカス
        if (percepts.length > 0 && percepts[0].salience >= 0.5) {
            this.attentionState.focus = percepts[0];
        }
        else {
            this.attentionState.focus = null;
        }
        // 周辺的知覚
        this.attentionState.peripheral = percepts.slice(1, 4);
        // 気が散る要素（内的感覚など）
        this.attentionState.distractions = percepts.filter(p => p.type === 'internal');
        // 注意レベルの減衰
        this.attentionState.attentionLevel = Math.max(0.3, this.attentionState.attentionLevel - this.config.attentionDecayRate);
        // 思考の漂い
        if (Math.random() < this.config.thoughtWanderingRate) {
            const thought = this.generateWanderingThought(percepts);
            if (thought) {
                this.attentionState.wanderingThoughts.push(thought);
                if (this.attentionState.wanderingThoughts.length > 5) {
                    this.attentionState.wanderingThoughts.shift();
                }
            }
        }
    }
    generateWanderingThought(percepts) {
        const thoughts = [
            '...そういえば',
            '...なぜだろう',
            '...いつか',
            '...もし',
            '...昔、',
        ];
        // 知覚に関連した思考
        if (percepts.length > 0) {
            const randomPercept = percepts[Math.floor(Math.random() * percepts.length)];
            if (randomPercept.type === 'visual' && typeof randomPercept.source !== 'string') {
                return `${randomPercept.source.name}を見ていたら、${thoughts[Math.floor(Math.random() * thoughts.length)]}`;
            }
        }
        return thoughts[Math.floor(Math.random() * thoughts.length)];
    }
    /**
     * 注意を特定の対象に向ける
     */
    focusAttention(target) {
        this.attentionState.focus = target;
        this.attentionState.attentionLevel = Math.min(1.0, this.attentionState.attentionLevel + 0.3);
        // イベント記録
        this.perceptionEvents.push({
            type: 'noticed',
            percept: target,
            description: `${target.description}に注意を向けた`,
            timestamp: Date.now(),
        });
    }
    /**
     * 注意を解放
     */
    releaseAttention() {
        if (this.attentionState.focus) {
            this.perceptionEvents.push({
                type: 'lost_focus',
                percept: this.attentionState.focus,
                description: '注意が離れた',
                timestamp: Date.now(),
            });
        }
        this.attentionState.focus = null;
    }
    // ============================================================
    // 環境の印象
    // ============================================================
    /**
     * 現在の環境の印象を取得
     */
    getEnvironmentalImpression(world) {
        const lighting = world.getLightingState();
        const weather = world.getCurrentWeather();
        const time = world.getCurrentTime();
        // 全体的な印象
        let overall = '';
        if (time.timeOfDay === 'night' || time.timeOfDay === 'late_night') {
            overall = weather === 'rain'
                ? '静かで落ち着く夜。雨音が心地いい。'
                : '静かな夜。世界が眠っている。';
        }
        else {
            overall = lighting.ambient > 0.6
                ? '明るく穏やかな空間。'
                : '少し薄暗い、落ち着いた空間。';
        }
        // 環境が誘発する気分
        const mood = this.determineMoodFromEnvironment(time, weather, lighting);
        // 心地よさ
        const comfort = this.calculateComfort(lighting, weather);
        // 新鮮さ（天気の変化などで上昇）
        const novelty = weather !== 'clear' ? 0.5 : 0.2;
        // 安全感
        const safety = 0.9; // somuniaの部屋は安全
        // 詳細
        const details = this.gatherEnvironmentDetails(world);
        return {
            overall,
            mood,
            comfort,
            novelty,
            safety,
            details,
        };
    }
    determineMoodFromEnvironment(time, weather, lighting) {
        if (weather === 'rain' || weather === 'storm') {
            return 'melancholy';
        }
        if (time.timeOfDay === 'late_night') {
            return 'loneliness';
        }
        if (time.timeOfDay === 'dawn' || time.timeOfDay === 'evening') {
            return 'nostalgia';
        }
        if (lighting.ambient > 0.7) {
            return 'contentment';
        }
        return 'serenity';
    }
    calculateComfort(lighting, weather) {
        let comfort = 0.7;
        // 適度な明るさが心地よい
        if (lighting.ambient >= 0.4 && lighting.ambient <= 0.8) {
            comfort += 0.1;
        }
        // 雨は落ち着く
        if (weather === 'rain') {
            comfort += 0.1;
        }
        // 嵐は不安
        if (weather === 'storm') {
            comfort -= 0.2;
        }
        return Math.min(1.0, Math.max(0, comfort));
    }
    gatherEnvironmentDetails(world) {
        const details = [];
        const viewState = world.getViewState();
        // ランプの状態
        if (world.isLampOn()) {
            details.push('ランプが灯っている');
        }
        // 窓からの景色
        const window = world.getWindow();
        if (window) {
            details.push('窓から外が見える');
        }
        // 現在のフォーカス
        if (viewState.focusObject) {
            details.push(`${viewState.focusObject.name}が目に入る`);
        }
        return details;
    }
    // ============================================================
    // フィルターの更新
    // ============================================================
    updateFilterByEmotions(emotions) {
        this.filter.emotionalBias = { ...emotions.levels };
        // 感情に応じて興味の対象を調整
        if ((emotions.levels.curiosity || 0) > 0.5) {
            if (!this.filter.interestAreas.includes('bookshelf')) {
                this.filter.interestAreas.push('bookshelf');
            }
            if (!this.filter.interestAreas.includes('pc')) {
                this.filter.interestAreas.push('pc');
            }
        }
        if ((emotions.levels.loneliness || 0) > 0.5) {
            if (!this.filter.interestAreas.includes('window')) {
                this.filter.interestAreas.push('window');
            }
        }
    }
    /**
     * フィルターを設定
     */
    setFilter(filter) {
        this.filter = { ...this.filter, ...filter };
    }
    // ============================================================
    // 状態取得
    // ============================================================
    updateCurrentPercepts(percepts) {
        this.currentPercepts.clear();
        for (const p of percepts) {
            this.currentPercepts.set(p.id, p);
            this.recentPercepts.push(p);
        }
        // 履歴の制限
        if (this.recentPercepts.length > this.maxRecentPercepts) {
            this.recentPercepts = this.recentPercepts.slice(-this.maxRecentPercepts);
        }
    }
    getCurrentPercepts() {
        return Array.from(this.currentPercepts.values());
    }
    getAttentionState() {
        return { ...this.attentionState };
    }
    getRecentPercepts() {
        return [...this.recentPercepts];
    }
    getPerceptionEvents() {
        return [...this.perceptionEvents];
    }
    // ============================================================
    // シリアライズ
    // ============================================================
    toJSON() {
        return {
            config: this.config,
            currentPercepts: Array.from(this.currentPercepts.entries()),
            attentionState: this.attentionState,
            perceptionEvents: this.perceptionEvents.slice(-50),
            filter: this.filter,
            recentPercepts: this.recentPercepts,
        };
    }
    static fromJSON(data) {
        const perception = new Perception(data.config);
        perception.currentPercepts = new Map(data.currentPercepts);
        perception.attentionState = data.attentionState;
        perception.perceptionEvents = data.perceptionEvents;
        perception.filter = data.filter;
        perception.recentPercepts = data.recentPercepts || [];
        return perception;
    }
}
exports.Perception = Perception;
exports.default = Perception;
//# sourceMappingURL=Perception.js.map