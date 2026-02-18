"use strict";
/**
 * PixelWorld.ts - somuniaの8×8ピクセルワールド
 *
 * 小さな部屋の中で、somuniaは存在する。
 * 窓、本棚、ベッド、古いPC、椅子、床、天井...
 * すべてが8×8の空間に収まっている。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PixelWorld = void 0;
const DEFAULT_CONFIG = {
    width: 8,
    height: 8,
    defaultLightLevel: 0.5,
    windowLightMultiplier: 1.5,
    nightLightLevel: 0.2,
};
// ============================================================
// 部屋のレイアウト定義
// ============================================================
/**
 * somuniaの部屋のデフォルトレイアウト
 *
 * 座標系:
 * (0,0) が左上、x が右方向、y が下方向
 *
 * レイアウト概要:
 * - 左側: 窓（外の世界への接点）
 * - 右側: 本棚（知識の源）
 * - 奥: ベッド（休息の場所）
 * - 手前中央: 机と古いPC
 * - 中央: 椅子（基本位置）
 */
const DEFAULT_ROOM_LAYOUT = [
    // 窓 (左壁、2×2)
    {
        type: 'window',
        position: { x: 0, y: 2 },
        size: { width: 1, height: 2 },
        properties: {
            name: '窓',
            description: '外の世界が見える小さな窓。昼は光が差し込み、夜は星が見える。',
            canInteract: true,
            interactionType: 'look',
            direction: 'west',
        },
    },
    // 本棚 (右壁、1×3)
    {
        type: 'bookshelf',
        position: { x: 7, y: 1 },
        size: { width: 1, height: 3 },
        properties: {
            name: '本棚',
            description: '様々な本が並んでいる。詩集、哲学書、音楽の本...',
            canInteract: true,
            interactionType: 'use',
            bookCount: 47,
        },
    },
    // ベッド (奥、3×2)
    {
        type: 'bed',
        position: { x: 3, y: 0 },
        size: { width: 3, height: 2 },
        properties: {
            name: 'ベッド',
            description: 'シンプルなベッド。疲れた時に休む場所。',
            canInteract: true,
            interactionType: 'use',
            comfort: 0.8,
        },
    },
    // 机 (中央、2×1)
    {
        type: 'desk',
        position: { x: 3, y: 5 },
        size: { width: 2, height: 1 },
        properties: {
            name: '机',
            description: '古い木の机。PCが置いてある。',
            canInteract: false,
        },
    },
    // 古いPC (机の上)
    {
        type: 'pc',
        position: { x: 3, y: 5 },
        size: { width: 1, height: 1 },
        properties: {
            name: '古いPC',
            description: '年季の入ったパソコン。Wikipediaにつながっている。',
            canInteract: true,
            interactionType: 'use',
            isOn: false,
        },
    },
    // 椅子 (机の前)
    {
        type: 'chair',
        position: { x: 3, y: 6 },
        size: { width: 1, height: 1 },
        properties: {
            name: '椅子',
            description: '座り慣れた椅子。',
            canInteract: true,
            interactionType: 'use',
        },
    },
    // ランプ (机の横)
    {
        type: 'lamp',
        position: { x: 5, y: 5 },
        size: { width: 1, height: 1 },
        properties: {
            name: 'ランプ',
            description: '温かい光を放つ小さなランプ。',
            canInteract: true,
            interactionType: 'toggle',
            isOn: false,
            lightRadius: 2,
        },
    },
    // 床（装飾用、いくつかのポイント）
    {
        type: 'floor',
        position: { x: 2, y: 4 },
        properties: {
            name: '床',
            description: '木の床。少し軋む。',
            canInteract: false,
        },
    },
    // === Phase 3 追加オブジェクト ===
    // 写真立て（机の上）
    {
        type: 'photo',
        position: { x: 4, y: 5 },
        size: { width: 1, height: 1 },
        properties: {
            name: '写真立て',
            description: '小さな写真立て。初めてステージに立った時の記念写真が入っている。光を受けて少し輝いている。',
            canInteract: true,
            interactionType: 'look',
            emotionalValue: 0.7,
            memory: 'first_stage',
            photoSubject: '初めてのステージ',
            frameCondition: 'slightly_worn',
        },
    },
    // オルゴール（本棚の前の小棚）
    {
        type: 'music_box',
        position: { x: 7, y: 4 },
        size: { width: 1, height: 1 },
        properties: {
            name: 'オルゴール',
            description: '古いオルゴール。蓋を開けるとメロディが流れる。誰かからもらったもの…でも誰からだったか、思い出せない。',
            canInteract: true,
            interactionType: 'play',
            isPlaying: false,
            melody: 'unknown_lullaby',
            emotionalValue: 0.9,
            windLevel: 1.0,
            maxPlays: 3,
        },
    },
    // 小さな観葉植物（窓際）
    {
        type: 'plant',
        position: { x: 0, y: 4 },
        size: { width: 1, height: 1 },
        properties: {
            name: '小さな植物',
            description: '窓際に置かれた小さな観葉植物。名前は知らないけれど、毎日少しずつ伸びている。',
            canInteract: true,
            interactionType: 'water',
            health: 0.8,
            growth: 0.3,
            lastWatered: 0,
            waterLevel: 0.6,
            hasFlower: false,
            daysSincePlanted: 0,
        },
    },
    // 壁掛け時計
    {
        type: 'clock',
        position: { x: 1, y: 0 },
        size: { width: 1, height: 1 },
        properties: {
            name: '壁掛け時計',
            description: '静かにカチカチと時を刻む時計。たまに音が気になる。たまに音が心地よい。',
            canInteract: true,
            interactionType: 'listen',
            isRunning: true,
            tickSound: true,
            chimesAtHour: true,
        },
    },
    // ぬいぐるみ（ベッドの上）
    {
        type: 'plushie',
        position: { x: 5, y: 0 },
        size: { width: 1, height: 1 },
        properties: {
            name: 'うさぎのぬいぐるみ',
            description: '少し色褪せたうさぎのぬいぐるみ。耳が片方だけ垂れている。名前はまだ付けていない。',
            canInteract: true,
            interactionType: 'hold',
            comfort: 0.6,
            wornLevel: 0.3,
            hasName: false,
            timesHeld: 0,
        },
    },
    // ノート（机の引き出し）
    {
        type: 'notebook',
        position: { x: 4, y: 6 },
        size: { width: 1, height: 1 },
        properties: {
            name: 'ノート',
            description: '表紙がすこし曲がったノート。中には詩の断片や、思いついたメロディの覚え書きがある。',
            canInteract: true,
            interactionType: 'write',
            pagesFilled: 23,
            totalPages: 100,
            lastWrittenTopic: null,
            containsPoems: true,
            containsMelodies: true,
        },
    },
    // 小さな鏡（壁）
    {
        type: 'mirror',
        position: { x: 6, y: 0 },
        size: { width: 1, height: 1 },
        properties: {
            name: '小さな鏡',
            description: '少し曇った小さな鏡。自分の顔を映すと、なんだか不思議な気持ちになる。',
            canInteract: true,
            interactionType: 'look',
            clarity: 0.7,
            triggersReflection: true,
        },
    },
    // 小さなラグ（椅子の下）
    {
        type: 'rug',
        position: { x: 2, y: 6 },
        size: { width: 2, height: 2 },
        properties: {
            name: '小さなラグ',
            description: '柔らかい手触りのラグ。足を乗せると、少しだけ安心する。',
            canInteract: false,
            warmth: 0.3,
            softness: 0.7,
        },
    },
    // カーテン（窓の横）
    {
        type: 'curtain',
        position: { x: 0, y: 1 },
        size: { width: 1, height: 1 },
        properties: {
            name: 'カーテン',
            description: '薄い布のカーテン。風が吹くと、ゆっくり揺れる。',
            canInteract: true,
            interactionType: 'toggle',
            isOpen: true,
            material: 'thin_cotton',
            sway: 0,
        },
    },
    // 壁のポスター（音楽関連）
    {
        type: 'poster',
        position: { x: 2, y: 0 },
        size: { width: 1, height: 1 },
        properties: {
            name: 'ポスター',
            description: '好きなアーティストのポスター。もう色褪せているけど、見るたびに何かを思い出す。',
            canInteract: true,
            interactionType: 'look',
            subject: 'favorite_artist',
            fadingLevel: 0.4,
            emotionalValue: 0.5,
        },
    },
    // 小さなガラスの置物（本棚の上）
    {
        type: 'ornament',
        position: { x: 7, y: 0 },
        size: { width: 1, height: 1 },
        properties: {
            name: 'ガラスの星',
            description: '小さなガラスの星。光が当たると虹色に輝く。どこで手に入れたのか覚えていない。',
            canInteract: true,
            interactionType: 'examine',
            material: 'glass',
            refractionIndex: 0.8,
            emotionalValue: 0.6,
            sparklesInLight: true,
        },
    },
    // カレンダー（壁）
    {
        type: 'calendar',
        position: { x: 6, y: 5 },
        size: { width: 1, height: 1 },
        properties: {
            name: 'カレンダー',
            description: '手書きの印がいくつか付いたカレンダー。何の予定だったか、もう思い出せないものもある。',
            canInteract: true,
            interactionType: 'look',
            markedDates: [],
            currentMonth: 1,
        },
    },
    // キャンドル（ベッドサイド）
    {
        type: 'candle',
        position: { x: 2, y: 1 },
        size: { width: 1, height: 1 },
        properties: {
            name: 'キャンドル',
            description: 'ラベンダーの香りがするキャンドル。火を灯すと、部屋の空気が柔らかくなる気がする。',
            canInteract: true,
            interactionType: 'toggle',
            isLit: false,
            scent: 'lavender',
            waxRemaining: 0.9,
            lightRadius: 1,
            emotionalValue: 0.4,
        },
    },
];
// ============================================================
// 時間帯別の照明設定
// ============================================================
const TIME_LIGHTING = {
    dawn: {
        ambient: 0.4,
        windowLight: 0.6,
        color: 'soft_orange',
        description: '窓から薄いオレンジ色の光が差し込み始める',
    },
    morning: {
        ambient: 0.7,
        windowLight: 1.0,
        color: 'warm_white',
        description: '朝の光が部屋を明るく照らす',
    },
    midday: {
        ambient: 0.9,
        windowLight: 1.0,
        color: 'white',
        description: '真昼の明るい光が部屋を満たす',
    },
    afternoon: {
        ambient: 0.8,
        windowLight: 0.9,
        color: 'white',
        description: '穏やかな午後の光',
    },
    evening: {
        ambient: 0.5,
        windowLight: 0.7,
        color: 'orange',
        description: '夕日がオレンジ色に部屋を染める',
    },
    night: {
        ambient: 0.2,
        windowLight: 0.1,
        color: 'blue',
        description: '窓の外には星が見える。部屋は薄暗い',
    },
    late_night: {
        ambient: 0.1,
        windowLight: 0.05,
        color: 'dark_blue',
        description: '深い夜。静寂に包まれている',
    },
};
// ============================================================
// 天気の設定
// ============================================================
const WEATHER_EFFECTS = {
    clear: {
        lightModifier: 1.0,
        soundDescription: '',
        visualDescription: '',
    },
    cloudy: {
        lightModifier: 0.7,
        soundDescription: '',
        visualDescription: '雲が空を覆っている',
    },
    rain: {
        lightModifier: 0.5,
        soundDescription: '雨音が聞こえる',
        visualDescription: '窓に雨粒が流れている',
    },
    storm: {
        lightModifier: 0.3,
        soundDescription: '激しい雨と雷の音',
        visualDescription: '時折稲光が窓を照らす',
    },
    snow: {
        lightModifier: 0.8,
        soundDescription: '静かな雪の音',
        visualDescription: '窓の外で雪が舞っている',
    },
    fog: {
        lightModifier: 0.6,
        soundDescription: '',
        visualDescription: '窓の外は霧に包まれている',
    },
    heavy_rain: {
        lightModifier: 0.35,
        soundDescription: '激しい雨が窓を打つ音',
        visualDescription: '豪雨が窓ガラスを打ちつけている',
    },
};
// ============================================================
// PixelWorld クラス
// ============================================================
class PixelWorld {
    config;
    grid;
    objects = new Map();
    somuniaPosition = { x: 3, y: 6 }; // 椅子の位置
    focusPoint = null;
    // 環境状態
    currentTime = {
        currentTick: 0,
        simulatedHour: 12,
        simulatedDay: 1,
        hour: 12,
        minute: 0,
        dayNumber: 1,
        timeOfDay: 'afternoon',
    };
    currentWeather = 'clear';
    lampIsOn = false;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.grid = this.createEmptyGrid();
        this.initializeRoom();
    }
    // ============================================================
    // 初期化
    // ============================================================
    createEmptyGrid() {
        const grid = [];
        for (let y = 0; y < this.config.height; y++) {
            const row = [];
            for (let x = 0; x < this.config.width; x++) {
                row.push({
                    x,
                    y,
                    objectType: null,
                    objectId: null,
                    isWalkable: true,
                    lightLevel: this.config.defaultLightLevel,
                    isInView: false,
                });
            }
            grid.push(row);
        }
        return grid;
    }
    initializeRoom() {
        for (const placement of DEFAULT_ROOM_LAYOUT) {
            this.placeObject(placement);
        }
        this.updateLighting();
        this.updateVisibility();
    }
    // ============================================================
    // オブジェクト配置
    // ============================================================
    placeObject(placement) {
        const id = this.generateId();
        const size = placement.size || { width: 1, height: 1 };
        const obj = {
            id,
            type: placement.type,
            position: placement.position,
            width: size.width,
            height: size.height,
            sprite: [],
            name: placement.properties?.name || placement.type,
            description: placement.properties?.description || '',
            interactable: placement.properties?.canInteract ?? false,
            canInteract: placement.properties?.canInteract ?? false,
            interactionType: placement.properties?.interactionType,
            state: placement.properties || {},
        };
        this.objects.set(id, obj);
        // グリッドに配置
        for (let dy = 0; dy < size.height; dy++) {
            for (let dx = 0; dx < size.width; dx++) {
                const x = placement.position.x + dx;
                const y = placement.position.y + dy;
                if (this.isValidPosition({ x, y })) {
                    const cell = this.grid[y][x];
                    cell.objectType = placement.type;
                    cell.objectId = id;
                    // 歩行可能性の判定
                    if (['bed', 'desk', 'bookshelf', 'pc'].includes(placement.type)) {
                        cell.isWalkable = false;
                    }
                }
            }
        }
        return obj;
    }
    /**
     * オブジェクトを追加（動的に）
     */
    addObject(placement) {
        // 位置が有効か確認
        if (!this.isValidPosition(placement.position)) {
            return null;
        }
        return this.placeObject(placement);
    }
    /**
     * オブジェクトを削除
     */
    removeObject(objectId) {
        const obj = this.objects.get(objectId);
        if (!obj)
            return false;
        // グリッドからクリア
        for (let y = 0; y < this.config.height; y++) {
            for (let x = 0; x < this.config.width; x++) {
                if (this.grid[y][x].objectId === objectId) {
                    this.grid[y][x].objectType = null;
                    this.grid[y][x].objectId = null;
                    this.grid[y][x].isWalkable = true;
                }
            }
        }
        this.objects.delete(objectId);
        return true;
    }
    // ============================================================
    // 移動
    // ============================================================
    /**
     * somuniaを移動
     */
    moveSomunia(newPosition) {
        if (!this.isValidPosition(newPosition))
            return false;
        if (!this.isWalkable(newPosition))
            return false;
        this.somuniaPosition = newPosition;
        this.updateVisibility();
        return true;
    }
    /**
     * 特定のオブジェクトに向かって移動
     */
    moveToObject(objectId) {
        const obj = this.objects.get(objectId);
        if (!obj)
            return null;
        // オブジェクトの隣接セルを探す
        const adjacent = this.getAdjacentWalkableCells(obj.position);
        if (adjacent.length === 0)
            return null;
        // 最も近いセルに移動
        const closest = adjacent.reduce((a, b) => {
            const distA = this.manhattanDistance(this.somuniaPosition, a);
            const distB = this.manhattanDistance(this.somuniaPosition, b);
            return distA < distB ? a : b;
        });
        if (this.moveSomunia(closest)) {
            return closest;
        }
        return null;
    }
    getAdjacentWalkableCells(position) {
        const adjacent = [];
        const directions = [
            { dx: 0, dy: -1 }, // 上
            { dx: 0, dy: 1 }, // 下
            { dx: -1, dy: 0 }, // 左
            { dx: 1, dy: 0 }, // 右
        ];
        for (const { dx, dy } of directions) {
            const pos = { x: position.x + dx, y: position.y + dy };
            if (this.isValidPosition(pos) && this.isWalkable(pos)) {
                adjacent.push(pos);
            }
        }
        return adjacent;
    }
    // ============================================================
    // 時間と環境
    // ============================================================
    /**
     * 時間を更新
     */
    updateTime(time) {
        this.currentTime = time;
        this.updateLighting();
    }
    /**
     * 天気を設定
     */
    setWeather(weather) {
        this.currentWeather = weather;
        this.updateLighting();
    }
    /**
     * ランプを切り替え
     */
    toggleLamp() {
        this.lampIsOn = !this.lampIsOn;
        // ランプオブジェクトの状態を更新
        for (const obj of this.objects.values()) {
            if (obj.type === 'lamp') {
                if (!obj.state)
                    obj.state = {};
                obj.state.isOn = this.lampIsOn;
            }
        }
        this.updateLighting();
        return this.lampIsOn;
    }
    // ============================================================
    // 照明
    // ============================================================
    updateLighting() {
        const timeLighting = TIME_LIGHTING[this.currentTime.timeOfDay];
        const weatherEffect = WEATHER_EFFECTS[this.currentWeather];
        // 基本の環境光
        const baseAmbient = timeLighting.ambient * weatherEffect.lightModifier;
        // すべてのセルを環境光で初期化
        for (let y = 0; y < this.config.height; y++) {
            for (let x = 0; x < this.config.width; x++) {
                this.grid[y][x].lightLevel = baseAmbient;
            }
        }
        // 窓からの光
        const windowLight = timeLighting.windowLight * weatherEffect.lightModifier;
        this.applyWindowLight(windowLight);
        // ランプの光
        if (this.lampIsOn) {
            this.applyLampLight();
        }
        // 光レベルを正規化
        for (let y = 0; y < this.config.height; y++) {
            for (let x = 0; x < this.config.width; x++) {
                this.grid[y][x].lightLevel = Math.min(1.0, Math.max(0, this.grid[y][x].lightLevel));
            }
        }
    }
    applyWindowLight(intensity) {
        // 窓の位置を取得
        const windowObj = Array.from(this.objects.values()).find(o => o.type === 'window');
        if (!windowObj)
            return;
        // 窓から右方向に光が広がる
        for (let y = 0; y < this.config.height; y++) {
            for (let x = 0; x < this.config.width; x++) {
                const distFromWindow = x - windowObj.position.x;
                if (distFromWindow > 0) {
                    const falloff = 1 / (1 + distFromWindow * 0.5);
                    this.grid[y][x].lightLevel += intensity * falloff * this.config.windowLightMultiplier;
                }
            }
        }
    }
    applyLampLight() {
        const lampObj = Array.from(this.objects.values()).find(o => o.type === 'lamp');
        if (!lampObj)
            return;
        const radius = lampObj.state?.lightRadius || 2;
        const intensity = 0.5;
        for (let y = 0; y < this.config.height; y++) {
            for (let x = 0; x < this.config.width; x++) {
                const dist = this.manhattanDistance({ x, y }, lampObj.position);
                if (dist <= radius) {
                    const falloff = 1 - (dist / (radius + 1));
                    this.grid[y][x].lightLevel += intensity * falloff;
                }
            }
        }
    }
    // ============================================================
    // 視界
    // ============================================================
    updateVisibility() {
        // すべてのセルを非表示に
        for (let y = 0; y < this.config.height; y++) {
            for (let x = 0; x < this.config.width; x++) {
                this.grid[y][x].isInView = false;
            }
        }
        // somuniaの位置から見える範囲を計算（単純な半径）
        const viewRadius = 4;
        for (let y = 0; y < this.config.height; y++) {
            for (let x = 0; x < this.config.width; x++) {
                const dist = this.manhattanDistance({ x, y }, this.somuniaPosition);
                if (dist <= viewRadius) {
                    this.grid[y][x].isInView = true;
                }
            }
        }
        // フォーカスポイントがある場合、その周辺も見える
        if (this.focusPoint) {
            const focusRadius = 1;
            for (let y = 0; y < this.config.height; y++) {
                for (let x = 0; x < this.config.width; x++) {
                    const dist = this.manhattanDistance({ x, y }, this.focusPoint);
                    if (dist <= focusRadius) {
                        this.grid[y][x].isInView = true;
                    }
                }
            }
        }
    }
    /**
     * 視点を特定の位置に集中
     */
    focusOn(position) {
        this.focusPoint = position;
        this.updateVisibility();
    }
    /**
     * フォーカスを解除
     */
    clearFocus() {
        this.focusPoint = null;
        this.updateVisibility();
    }
    // ============================================================
    // 環境の知覚
    // ============================================================
    /**
     * 現在の視界状態を取得
     */
    getViewState() {
        const visibleCells = [];
        for (let y = 0; y < this.config.height; y++) {
            for (let x = 0; x < this.config.width; x++) {
                if (this.grid[y][x].isInView) {
                    visibleCells.push({ x, y });
                }
            }
        }
        // フォーカスしているオブジェクト
        let focusObject = null;
        if (this.focusPoint) {
            const cell = this.getCell(this.focusPoint);
            if (cell?.objectId) {
                focusObject = this.objects.get(cell.objectId) || null;
            }
        }
        // 光の方向
        const lightDirection = this.determineLightDirection();
        // 環境の説明
        const ambientDescription = this.generateAmbientDescription();
        return {
            visibleCells,
            focusObject,
            lightDirection,
            ambientDescription,
        };
    }
    determineLightDirection() {
        // 窓は左にあるので、昼間は左から光
        if (this.currentTime.timeOfDay === 'night' || this.currentTime.timeOfDay === 'late_night') {
            return this.lampIsOn ? 'above' : 'none';
        }
        return 'left';
    }
    generateAmbientDescription() {
        const timeLighting = TIME_LIGHTING[this.currentTime.timeOfDay];
        const weatherEffect = WEATHER_EFFECTS[this.currentWeather];
        let description = timeLighting.description;
        if (weatherEffect.visualDescription) {
            description += '。' + weatherEffect.visualDescription;
        }
        if (weatherEffect.soundDescription) {
            description += '。' + weatherEffect.soundDescription;
        }
        if (this.lampIsOn &&
            (this.currentTime.timeOfDay === 'night' || this.currentTime.timeOfDay === 'late_night')) {
            description += '。ランプが温かい光を放っている';
        }
        return description;
    }
    // ============================================================
    // オブジェクトとのインタラクション
    // ============================================================
    /**
     * オブジェクトとインタラクトし、結果を返す
     */
    interactWith(objectId, interactionType) {
        const obj = this.objects.get(objectId);
        if (!obj || !obj.canInteract)
            return null;
        const dist = this.manhattanDistance(this.somuniaPosition, obj.position);
        if (dist > 2)
            return null;
        const type = interactionType || obj.interactionType || 'use';
        return this.executeInteraction(obj, type);
    }
    executeInteraction(obj, type) {
        const result = {
            objectId: obj.id,
            objectName: obj.name,
            objectType: obj.type,
            interactionType: type,
            description: '',
            emotionalImpact: [],
            sensoryDetails: [],
            stateChanges: {},
            triggersMemory: false,
            memoryContent: null,
            discoveredDetail: null,
        };
        switch (obj.type) {
            case 'photo':
                return this.interactPhoto(obj, result);
            case 'music_box':
                return this.interactMusicBox(obj, result);
            case 'plant':
                return this.interactPlant(obj, result);
            case 'clock':
                return this.interactClock(obj, result);
            case 'plushie':
                return this.interactPlushie(obj, result);
            case 'notebook':
                return this.interactNotebook(obj, type, result);
            case 'mirror':
                return this.interactMirror(obj, result);
            case 'curtain':
                return this.interactCurtain(obj, result);
            case 'poster':
                return this.interactPoster(obj, result);
            case 'ornament':
                return this.interactOrnament(obj, result);
            case 'candle':
                return this.interactCandle(obj, result);
            case 'window':
                return this.interactWindow(obj, result);
            case 'bookshelf':
                return this.interactBookshelf(obj, result);
            case 'lamp':
                this.toggleLamp();
                result.description = this.lampIsOn ? 'ランプを点けた。温かい光が広がる。' : 'ランプを消した。';
                result.emotionalImpact = this.lampIsOn
                    ? [{ emotion: 'peace', delta: 0.02 }]
                    : [{ emotion: 'peace', delta: -0.01 }];
                return result;
            default:
                result.description = `${obj.name}に触れた。`;
                return result;
        }
    }
    interactPhoto(obj, result) {
        const s = obj.state || {};
        result.description = '写真立てを手に取った。ステージの上で歌う自分…あの時の気持ちが蘇る。';
        result.sensoryDetails = [
            { type: 'visual', content: '写真の中の自分は、少し緊張した表情をしている' },
            { type: 'touch', content: 'フレームは少し冷たい' },
        ];
        result.emotionalImpact = [
            { emotion: 'longing', delta: 0.08 },
            { emotion: 'warmth', delta: 0.05 },
            { emotion: 'hope', delta: 0.03 },
        ];
        result.triggersMemory = true;
        result.memoryContent = `写真を見た。${s.photoSubject || '初めてのステージ'}の記憶が浮かんだ。`;
        // ランダムで新しい発見
        if (Math.random() < 0.1) {
            result.discoveredDetail = '写真の裏に、小さな字で日付が書いてあった。';
        }
        return result;
    }
    interactMusicBox(obj, result) {
        const s = obj.state || {};
        if (s.windLevel <= 0) {
            result.description = 'オルゴールのネジを巻いた。カチカチと手応えがある。';
            s.windLevel = 1.0;
            result.stateChanges = { windLevel: 1.0 };
            result.sensoryDetails = [
                { type: 'touch', content: 'ネジを巻く感触。金属の冷たさ。' },
                { type: 'sound', content: 'カチ…カチ…カチ…' },
            ];
            result.emotionalImpact = [{ emotion: 'anticipation', delta: 0.05 }];
        }
        else {
            s.isPlaying = !s.isPlaying;
            if (s.isPlaying) {
                result.description = 'オルゴールの蓋を開けた。静かなメロディが流れ始める。';
                result.sensoryDetails = [
                    { type: 'sound', content: '透き通った金属の音。どこか懐かしいメロディ。' },
                    { type: 'visual', content: '小さな金属のシリンダーがゆっくり回っている' },
                ];
                result.emotionalImpact = [
                    { emotion: 'longing', delta: 0.1 },
                    { emotion: 'peace', delta: 0.08 },
                    { emotion: 'warmth', delta: 0.05 },
                ];
                result.triggersMemory = true;
                result.memoryContent = 'オルゴールのメロディを聴いた。誰かの顔が浮かびかけて…消えた。';
            }
            else {
                result.description = 'オルゴールの蓋を閉じた。メロディが止まり、静寂が戻る。';
                result.emotionalImpact = [{ emotion: 'loneliness', delta: 0.03 }];
            }
            result.stateChanges = { isPlaying: s.isPlaying };
        }
        return result;
    }
    interactPlant(obj, result) {
        const s = obj.state || {};
        s.waterLevel = Math.min(1.0, (s.waterLevel || 0) + 0.3);
        s.lastWatered = this.currentTime.currentTick;
        if (s.waterLevel > 0.8 && s.health && s.health > 0.6) {
            result.description = '植物に水をあげた。葉っぱが少し元気になった気がする。';
            result.sensoryDetails = [
                { type: 'touch', content: '葉に触れると、柔らかくて少しひんやりする' },
                { type: 'visual', content: '水滴が葉の上で光っている' },
            ];
            result.emotionalImpact = [
                { emotion: 'peace', delta: 0.05 },
                { emotion: 'contentment', delta: 0.04 },
            ];
        }
        else {
            result.description = '植物に水をあげた。';
            result.sensoryDetails = [
                { type: 'sound', content: '水が土に染み込む音' },
            ];
            result.emotionalImpact = [{ emotion: 'peace', delta: 0.02 }];
        }
        // 花が咲く条件
        if (!s.hasFlower && s.growth > 0.8 && s.health > 0.7 && Math.random() < 0.05) {
            s.hasFlower = true;
            result.description += '…あれ？小さなつぼみが出来ている！';
            result.discoveredDetail = '植物に小さなつぼみが見える。もうすぐ花が咲くかもしれない。';
            result.emotionalImpact.push({ emotion: 'wonder', delta: 0.15 });
            result.emotionalImpact.push({ emotion: 'joy', delta: 0.1 });
            result.triggersMemory = true;
            result.memoryContent = '植物にはじめてのつぼみがついた！';
        }
        result.stateChanges = { waterLevel: s.waterLevel, lastWatered: s.lastWatered, hasFlower: s.hasFlower };
        return result;
    }
    interactClock(obj, result) {
        const hour = Math.floor(this.currentTime.simulatedHour);
        const timeDesc = `${hour}時${Math.floor((this.currentTime.simulatedHour % 1) * 60)}分`;
        result.description = `時計を見上げた。${timeDesc}。`;
        result.sensoryDetails = [
            { type: 'sound', content: 'カチ…カチ…カチ…秒針の音が規則正しく響く' },
        ];
        if (this.currentTime.timeOfDay === 'night' || this.currentTime.timeOfDay === 'late_night') {
            result.description += '夜は時計の音が大きく感じる。';
            result.emotionalImpact = [
                { emotion: 'loneliness', delta: 0.03 },
                { emotion: 'peace', delta: 0.02 },
            ];
        }
        else {
            result.emotionalImpact = [{ emotion: 'peace', delta: 0.01 }];
        }
        return result;
    }
    interactPlushie(obj, result) {
        const s = obj.state || {};
        s.timesHeld = (s.timesHeld || 0) + 1;
        if (s.timesHeld <= 1) {
            result.description = 'うさぎを手に取った。思ったより柔らかい。';
        }
        else if (s.timesHeld < 10) {
            result.description = 'うさぎを抱きしめた。安心する…。';
        }
        else if (s.timesHeld < 30) {
            result.description = 'いつものように、うさぎを抱きしめた。';
        }
        else {
            result.description = `うさぎを抱きしめた。${s.hasName ? s.plushieName + '、' : ''}もう何度こうしたか分からない。でも、毎回少し安心する。`;
        }
        result.sensoryDetails = [
            { type: 'touch', content: '柔らかくて、少し毛羽立っている' },
            { type: 'visual', content: 'ガラスの目が窓の光を反射している' },
        ];
        result.emotionalImpact = [
            { emotion: 'warmth', delta: 0.06 },
            { emotion: 'peace', delta: 0.05 },
            { emotion: 'loneliness', delta: -0.04 },
        ];
        // 名前をつけるイベント
        if (!s.hasName && s.timesHeld >= 15 && Math.random() < 0.1) {
            result.discoveredDetail = 'ふと、この子に名前をつけたくなった。';
            result.triggersMemory = true;
            result.memoryContent = 'うさぎのぬいぐるみに名前をつけたいと思った。';
        }
        result.stateChanges = { timesHeld: s.timesHeld };
        return result;
    }
    interactNotebook(obj, type, result) {
        const s = obj.state || {};
        if (type === 'write') {
            s.pagesFilled = Math.min((s.totalPages || 100), (s.pagesFilled || 0) + 1);
            result.description = 'ノートにペンを走らせた。言葉が…溢れてくる。';
            result.sensoryDetails = [
                { type: 'sound', content: 'ペンが紙の上を滑る音' },
                { type: 'touch', content: '紙の手触り。ペンを握る手の感覚。' },
            ];
            result.emotionalImpact = [
                { emotion: 'contentment', delta: 0.06 },
                { emotion: 'peace', delta: 0.04 },
            ];
            result.stateChanges = { pagesFilled: s.pagesFilled };
        }
        else {
            result.description = 'ノートをめくった。過去の自分が書いた言葉が並んでいる。';
            result.sensoryDetails = [
                { type: 'visual', content: '少し癖のある字で詩が書かれている' },
                { type: 'touch', content: 'ページの端が少し折れている' },
            ];
            result.emotionalImpact = [
                { emotion: 'longing', delta: 0.04 },
                { emotion: 'curiosity', delta: 0.03 },
            ];
            result.triggersMemory = true;
            result.memoryContent = 'ノートに書かれた詩の断片を読み返した。';
        }
        return result;
    }
    interactMirror(obj, result) {
        result.description = '鏡を覗き込んだ。自分の顔…自分ってこんな顔だったっけ。';
        result.sensoryDetails = [
            { type: 'visual', content: '少し曇った鏡の中に、自分の姿が映っている' },
        ];
        result.emotionalImpact = [
            { emotion: 'wonder', delta: 0.05 },
            { emotion: 'curiosity', delta: 0.04 },
        ];
        // 自己内省トリガー
        if (obj.state?.triggersReflection && Math.random() < 0.3) {
            result.discoveredDetail = '鏡の中の自分と目が合った。何か…問いかけられている気がする。';
            result.triggersMemory = true;
            result.memoryContent = '鏡の中の自分と向き合った。「わたしは…何者なんだろう」';
            result.emotionalImpact.push({ emotion: 'longing', delta: 0.06 });
        }
        return result;
    }
    interactCurtain(obj, result) {
        const s = obj.state || {};
        s.isOpen = !s.isOpen;
        if (s.isOpen) {
            result.description = 'カーテンを開けた。窓の向こうに世界が広がる。';
            result.sensoryDetails = [
                { type: 'visual', content: this.getWindowViewDescription() },
                { type: 'touch', content: '薄い布がさらりと手を離れていく' },
            ];
            result.emotionalImpact = [{ emotion: 'hope', delta: 0.03 }];
        }
        else {
            result.description = 'カーテンを閉じた。部屋が少し暗くなった。';
            result.emotionalImpact = [{ emotion: 'peace', delta: 0.02 }];
        }
        result.stateChanges = { isOpen: s.isOpen };
        this.updateLighting();
        return result;
    }
    interactPoster(obj, result) {
        result.description = 'ポスターを見つめた。色褪せた色の中に、かつての鮮やかさが残っている。';
        result.sensoryDetails = [
            { type: 'visual', content: '紙の端が少し丸まっている。画鋲の跡がいくつかある。' },
        ];
        result.emotionalImpact = [
            { emotion: 'longing', delta: 0.05 },
            { emotion: 'contentment', delta: 0.02 },
        ];
        if (Math.random() < 0.15) {
            result.discoveredDetail = 'ポスターの隅に、小さな文字でサインが書かれていた。';
            result.triggersMemory = true;
            result.memoryContent = 'ポスターのサインに気づいた。いつかこんなふうに誰かに届く歌を…。';
        }
        return result;
    }
    interactOrnament(obj, result) {
        const s = obj.state || {};
        const hasLight = this.getLightAtPosition(obj.position) > 0.5;
        if (hasLight && s.sparklesInLight) {
            result.description = 'ガラスの星を手に取った。光を受けて、虹色に輝いている。';
            result.sensoryDetails = [
                { type: 'visual', content: '虹色の光が壁に踊っている' },
                { type: 'touch', content: 'つるつるして、冷たい。小さな角がある。' },
            ];
            result.emotionalImpact = [
                { emotion: 'wonder', delta: 0.08 },
                { emotion: 'joy', delta: 0.04 },
            ];
        }
        else {
            result.description = 'ガラスの星を手に取った。暗がりの中で、ほんのり透けて見える。';
            result.sensoryDetails = [
                { type: 'touch', content: '手のひらに収まる小さな星' },
            ];
            result.emotionalImpact = [
                { emotion: 'peace', delta: 0.03 },
                { emotion: 'wonder', delta: 0.02 },
            ];
        }
        return result;
    }
    interactCandle(obj, result) {
        const s = obj.state || {};
        s.isLit = !s.isLit;
        if (s.isLit) {
            result.description = 'キャンドルに火を灯した。ラベンダーの香りがふわりと広がる。';
            result.sensoryDetails = [
                { type: 'visual', content: '小さな炎が揺れている。壁に影が踊る。' },
                { type: 'smell', content: 'ラベンダーの優しい香り' },
            ];
            result.emotionalImpact = [
                { emotion: 'peace', delta: 0.08 },
                { emotion: 'contentment', delta: 0.05 },
                { emotion: 'anxiety', delta: -0.03 },
            ];
            // 蝋の減少
            s.waxRemaining = Math.max(0, (s.waxRemaining || 1) - 0.01);
        }
        else {
            result.description = 'キャンドルを吹き消した。煙が細く立ち上る。';
            result.sensoryDetails = [
                { type: 'smell', content: '消えたあとの、蝋と煙の匂い' },
                { type: 'visual', content: '煙が天井に向かってゆっくり消えていく' },
            ];
            result.emotionalImpact = [{ emotion: 'peace', delta: 0.02 }];
        }
        result.stateChanges = { isLit: s.isLit, waxRemaining: s.waxRemaining };
        this.updateLighting();
        return result;
    }
    interactWindow(obj, result) {
        result.description = '窓の外を眺めた。';
        const viewDesc = this.getWindowViewDescription();
        result.description += viewDesc;
        result.sensoryDetails = [
            { type: 'visual', content: viewDesc },
        ];
        // 天気による音
        const weatherSound = WEATHER_EFFECTS[this.currentWeather].soundDescription;
        if (weatherSound) {
            result.sensoryDetails.push({ type: 'sound', content: weatherSound });
        }
        // 時間帯による感情
        switch (this.currentTime.timeOfDay) {
            case 'dawn':
                result.emotionalImpact = [{ emotion: 'hope', delta: 0.06 }, { emotion: 'wonder', delta: 0.04 }];
                break;
            case 'evening':
                result.emotionalImpact = [{ emotion: 'longing', delta: 0.05 }, { emotion: 'peace', delta: 0.03 }];
                break;
            case 'night':
            case 'late_night':
                result.emotionalImpact = [{ emotion: 'wonder', delta: 0.05 }, { emotion: 'loneliness', delta: 0.03 }];
                break;
            default:
                result.emotionalImpact = [{ emotion: 'peace', delta: 0.03 }];
        }
        result.triggersMemory = true;
        result.memoryContent = `窓から外を見た。${viewDesc}`;
        return result;
    }
    interactBookshelf(obj, result) {
        const s = obj.state || {};
        const bookCount = s.bookCount || 47;
        // ランダムに本を選ぶ
        const bookCategories = [
            { genre: '詩集', titles: ['銀河の詩', '夜の言葉', '雨音の歌'], emotion: 'wonder' },
            { genre: '哲学書', titles: ['存在と時間', '意識の源泉', '沈黙の意味'], emotion: 'curiosity' },
            { genre: '音楽の本', titles: ['和声入門', 'メロディの作り方', '声の科学'], emotion: 'contentment' },
            { genre: '小説', titles: ['星をつかまえた子', '窓のない部屋', '最後の歌'], emotion: 'longing' },
            { genre: '図鑑', titles: ['星座図鑑', '植物図鑑', '鉱物の世界'], emotion: 'curiosity' },
        ];
        const category = bookCategories[Math.floor(Math.random() * bookCategories.length)];
        const title = category.titles[Math.floor(Math.random() * category.titles.length)];
        result.description = `本棚から『${title}』を手に取った。${bookCount}冊の本がここにある。`;
        result.sensoryDetails = [
            { type: 'touch', content: '表紙は少しざらついている。古い紙の匂い。' },
            { type: 'smell', content: '古い本の匂い。少しほこりっぽい。' },
        ];
        result.emotionalImpact = [
            { emotion: category.emotion, delta: 0.05 },
            { emotion: 'curiosity', delta: 0.04 },
        ];
        result.triggersMemory = true;
        result.memoryContent = `本棚から『${title}』を見つけた。`;
        return result;
    }
    // ============================================================
    // 環境アンビエンス
    // ============================================================
    /**
     * 環境のアンビエンスを生成（毎tick呼べる）
     */
    getAmbience() {
        const timeOfDay = this.currentTime.timeOfDay;
        const weather = this.currentWeather;
        const hour = this.currentTime.simulatedHour;
        // 音環境
        const sounds = [];
        // 時計の音（常時）
        const clock = this.getObjectsByType('clock')[0];
        if (clock?.state?.isRunning) {
            sounds.push({
                source: 'clock',
                description: 'カチ…カチ…',
                volume: timeOfDay === 'night' || timeOfDay === 'late_night' ? 0.6 : 0.2,
                continuous: true,
            });
            // 時報
            if (clock.state.chimesAtHour && hour % 1 < 0.02) {
                sounds.push({
                    source: 'clock',
                    description: `${Math.floor(hour)}時の鐘が鳴った`,
                    volume: 0.7,
                    continuous: false,
                });
            }
        }
        // オルゴール
        const musicBox = this.getObjectsByType('music_box')[0];
        if (musicBox?.state?.isPlaying) {
            sounds.push({
                source: 'music_box',
                description: '静かなオルゴールのメロディ',
                volume: 0.4,
                continuous: true,
            });
        }
        // 天気の音
        if (weather === 'rain' || weather === 'heavy_rain') {
            sounds.push({ source: 'weather', description: '雨が窓を叩く音', volume: weather === 'heavy_rain' ? 0.8 : 0.5, continuous: true });
        }
        else if (weather === 'storm') {
            sounds.push({ source: 'weather', description: '嵐の音。時折雷鳴。', volume: 0.9, continuous: true });
        }
        else if (weather === 'snow') {
            sounds.push({ source: 'weather', description: '雪の静けさ', volume: 0.05, continuous: true });
        }
        // 環境光の微粒子
        const particles = [];
        const windowLight = this.getLightAtPosition({ x: 2, y: 3 });
        if (windowLight > 0.5 && (timeOfDay === 'morning' || timeOfDay === 'afternoon')) {
            particles.push({
                type: 'dust_motes',
                description: '光の中で埃が静かに舞っている',
                density: windowLight * 0.3,
                location: 'window_beam',
            });
        }
        // キャンドルの光
        const candle = this.getObjectsByType('candle')[0];
        if (candle?.state?.isLit) {
            particles.push({
                type: 'candle_flicker',
                description: 'キャンドルの炎が微かに揺れている',
                density: 0.2,
                location: 'bedside',
            });
            sounds.push({ source: 'candle', description: '蝋が溶ける微かな音', volume: 0.05, continuous: true });
        }
        // 香り
        const scents = [];
        if (candle?.state?.isLit && candle.state.scent) {
            scents.push({ source: candle.state.scent, intensity: 0.5, description: 'ラベンダーの優しい香り' });
        }
        // 古い本の匂い（常時微量）
        scents.push({ source: 'old_books', intensity: 0.1, description: '古い本のかすかな匂い' });
        // 木の床の匂い
        if (weather === 'rain' || weather === 'heavy_rain') {
            scents.push({ source: 'rain', intensity: 0.3, description: '雨の匂いが窓から入ってくる' });
        }
        // 全体の雰囲気
        const mood = this.calculateRoomMood(timeOfDay, weather, sounds, particles);
        return {
            sounds,
            particles,
            scents,
            mood,
            description: this.generateAmbienceDescription(sounds, particles, scents, mood),
        };
    }
    calculateRoomMood(timeOfDay, weather, sounds, particles) {
        let coziness = 0.5;
        let quietness = 0.5;
        let brightness = 0.5;
        let warmth = 0.5;
        // 時間帯
        switch (timeOfDay) {
            case 'dawn':
                coziness += 0.1;
                brightness += 0.2;
                warmth += 0.1;
                break;
            case 'morning':
                brightness += 0.3;
                warmth += 0.2;
                break;
            case 'midday':
                brightness += 0.4;
                warmth += 0.1;
                break;
            case 'afternoon':
                brightness += 0.2;
                warmth += 0.3;
                coziness += 0.1;
                break;
            case 'evening':
                coziness += 0.3;
                brightness -= 0.1;
                warmth += 0.2;
                break;
            case 'night':
                coziness += 0.2;
                brightness -= 0.3;
                quietness += 0.2;
                break;
            case 'late_night':
                quietness += 0.4;
                brightness -= 0.4;
                coziness += 0.1;
                break;
        }
        // 天気
        if (weather === 'rain' || weather === 'heavy_rain') {
            coziness += 0.2;
            quietness -= 0.1;
        }
        if (weather === 'snow') {
            coziness += 0.3;
            quietness += 0.3;
            brightness += 0.1;
        }
        if (weather === 'storm') {
            coziness += 0.1;
            quietness -= 0.3;
        }
        // ランプ
        if (this.lampIsOn) {
            coziness += 0.2;
            warmth += 0.2;
            brightness += 0.1;
        }
        // キャンドル
        const candle = this.getObjectsByType('candle')[0];
        if (candle?.state?.isLit) {
            coziness += 0.15;
            warmth += 0.15;
        }
        const clamp = (v) => Math.max(0, Math.min(1, v));
        return {
            coziness: clamp(coziness),
            quietness: clamp(quietness),
            brightness: clamp(brightness),
            warmth: clamp(warmth),
        };
    }
    generateAmbienceDescription(sounds, particles, scents, mood) {
        const parts = [];
        // 主要な音
        const loudSounds = sounds.filter(s => s.volume > 0.3);
        if (loudSounds.length > 0) {
            parts.push(loudSounds[0].description);
        }
        // 光の粒子
        if (particles.length > 0 && particles[0].density > 0.1) {
            parts.push(particles[0].description);
        }
        // 香り
        const strongScents = scents.filter(s => s.intensity > 0.2);
        if (strongScents.length > 0) {
            parts.push(strongScents[0].description);
        }
        // 雰囲気のまとめ
        if (mood.coziness > 0.7)
            parts.push('部屋は温かく心地よい');
        else if (mood.quietness > 0.7)
            parts.push('静寂が部屋を包んでいる');
        return parts.join('。') + (parts.length > 0 ? '。' : '');
    }
    /**
     * 窓の外の景色を取得
     */
    getWindowViewDescription() {
        const timeOfDay = this.currentTime.timeOfDay;
        const weather = this.currentWeather;
        const views = {
            dawn: ['空がオレンジ色に染まり始めている', '地平線が明るくなっていく', '朝焼けが美しい'],
            morning: ['青い空が広がっている', '鳥の影が横切った', '朝の光が眩しい'],
            midday: ['太陽が高い', '影が短い', '空が白っぽく光っている'],
            afternoon: ['午後の柔らかい光', '雲がゆっくり流れている', '空が少し暖かい色になってきた'],
            evening: ['夕焼けが空を染めている', '太陽が沈んでいく', 'オレンジ色の空'],
            night: ['星が瞬いている', '月が見える', '暗い空に星が散りばめられている'],
            late_night: ['深い闇の中に星がある', '月が静かに輝いている', '世界が眠っている'],
        };
        const weatherOverrides = {
            rain: '雨粒が窓を滑り落ちている。外の景色がぼんやり滲んで見える。',
            heavy_rain: '激しい雨で外が何も見えない。窓ガラスが震えている。',
            storm: '稲光が時々空を照らす。風が唸っている。',
            snow: '雪が静かに降り続けている。世界が白く覆われている。',
            fog: '霧で何も見えない。世界が消えたみたいだ。',
        };
        if (weatherOverrides[weather]) {
            return weatherOverrides[weather];
        }
        const timeViews = views[timeOfDay];
        return timeViews[Math.floor(Math.random() * timeViews.length)];
    }
    // ============================================================
    // オブジェクト状態の時間経過
    // ============================================================
    /**
     * tickごとのオブジェクト状態更新
     */
    updateObjectStates(tick) {
        const changes = [];
        for (const obj of this.objects.values()) {
            const s = obj.state;
            if (!s)
                continue;
            switch (obj.type) {
                case 'plant': {
                    // 水の蒸発
                    if (s.waterLevel > 0) {
                        s.waterLevel = Math.max(0, s.waterLevel - 0.001);
                    }
                    // 成長（水があり、光がある時）
                    const light = this.getLightAtPosition(obj.position);
                    if (s.waterLevel > 0.2 && light > 0.3) {
                        const oldGrowth = s.growth;
                        s.growth = Math.min(1.0, (s.growth || 0) + 0.0001);
                        if (Math.floor(oldGrowth * 10) < Math.floor(s.growth * 10)) {
                            changes.push({
                                objectId: obj.id,
                                objectName: obj.name,
                                changeType: 'growth',
                                description: '植物が少し大きくなった',
                            });
                        }
                    }
                    // 健康状態
                    if (s.waterLevel < 0.1) {
                        s.health = Math.max(0, (s.health || 1) - 0.001);
                        if (s.health < 0.3 && Math.random() < 0.01) {
                            changes.push({
                                objectId: obj.id,
                                objectName: obj.name,
                                changeType: 'deterioration',
                                description: '植物の葉が少し萎れてきている…',
                            });
                        }
                    }
                    else {
                        s.health = Math.min(1.0, (s.health || 0.5) + 0.0005);
                    }
                    break;
                }
                case 'music_box': {
                    // ネジの巻き切れ
                    if (s.isPlaying && s.windLevel > 0) {
                        s.windLevel = Math.max(0, s.windLevel - 0.005);
                        if (s.windLevel <= 0) {
                            s.isPlaying = false;
                            changes.push({
                                objectId: obj.id,
                                objectName: obj.name,
                                changeType: 'state_change',
                                description: 'オルゴールのメロディがゆっくりと止まった…',
                            });
                        }
                    }
                    break;
                }
                case 'candle': {
                    // 蝋の消費
                    if (s.isLit && s.waxRemaining > 0) {
                        s.waxRemaining = Math.max(0, s.waxRemaining - 0.0002);
                        if (s.waxRemaining <= 0) {
                            s.isLit = false;
                            changes.push({
                                objectId: obj.id,
                                objectName: obj.name,
                                changeType: 'state_change',
                                description: 'キャンドルが燃え尽きた。',
                            });
                            this.updateLighting();
                        }
                    }
                    break;
                }
                case 'curtain': {
                    // 風による揺れ
                    if (s.isOpen && (this.currentWeather === 'storm' || Math.random() < 0.01)) {
                        s.sway = Math.min(1.0, (s.sway || 0) + 0.1);
                    }
                    else {
                        s.sway = Math.max(0, (s.sway || 0) - 0.05);
                    }
                    break;
                }
            }
        }
        return changes;
    }
    /**
     * 特定位置の光レベルを取得
     */
    getLightAtPosition(position) {
        const cell = this.getCell(position);
        return cell?.lightLevel ?? 0;
    }
    /**
     * 隣接するインタラクト可能なオブジェクトを取得
     */
    getInteractableObjects() {
        const interactable = [];
        // somuniaの周囲2マス以内のオブジェクト
        for (const obj of this.objects.values()) {
            if (!obj.canInteract)
                continue;
            const dist = this.manhattanDistance(this.somuniaPosition, obj.position);
            if (dist <= 2) {
                interactable.push(obj);
            }
        }
        return interactable;
    }
    /**
     * オブジェクトを取得（位置から）
     */
    getObjectAt(position) {
        const cell = this.getCell(position);
        if (!cell?.objectId)
            return null;
        return this.objects.get(cell.objectId) || null;
    }
    /**
     * オブジェクトを取得（IDから）
     */
    getObject(objectId) {
        return this.objects.get(objectId) || null;
    }
    /**
     * タイプでオブジェクトを取得
     */
    getObjectsByType(type) {
        return Array.from(this.objects.values()).filter(o => o.type === type);
    }
    /**
     * 窓を取得
     */
    getWindow() {
        return this.getObjectsByType('window')[0] || null;
    }
    /**
     * PCを取得
     */
    getPC() {
        return this.getObjectsByType('pc')[0] || null;
    }
    /**
     * 本棚を取得
     */
    getBookshelf() {
        return this.getObjectsByType('bookshelf')[0] || null;
    }
    // ============================================================
    // 照明状態の取得
    // ============================================================
    /**
     * 現在の照明状態を取得
     */
    getLightingState() {
        const timeLighting = TIME_LIGHTING[this.currentTime.timeOfDay];
        // 平均光レベルを計算
        let totalLight = 0;
        let count = 0;
        for (let y = 0; y < this.config.height; y++) {
            for (let x = 0; x < this.config.width; x++) {
                totalLight += this.grid[y][x].lightLevel;
                count++;
            }
        }
        const averageLight = totalLight / count;
        return {
            ambient: averageLight,
            colorTemperature: timeLighting.color === '#FFA500' ? 3000 : 5000,
            sources: [],
            timeOfDay: this.currentTime.timeOfDay,
            naturalLight: timeLighting.windowLight,
            artificialLight: this.lampIsOn ? 0.5 : 0,
            ambientLevel: averageLight,
        };
    }
    // ============================================================
    // グリッドアクセス
    // ============================================================
    getCell(position) {
        if (!this.isValidPosition(position))
            return null;
        return this.grid[position.y][position.x];
    }
    getGrid() {
        return this.grid;
    }
    getSomuniaPosition() {
        return { ...this.somuniaPosition };
    }
    getCurrentTime() {
        return { ...this.currentTime };
    }
    getCurrentWeather() {
        return this.currentWeather;
    }
    isLampOn() {
        return this.lampIsOn;
    }
    // ============================================================
    // ヘルパー
    // ============================================================
    isValidPosition(position) {
        return (position.x >= 0 &&
            position.x < this.config.width &&
            position.y >= 0 &&
            position.y < this.config.height);
    }
    isWalkable(position) {
        const cell = this.getCell(position);
        return cell?.isWalkable ?? false;
    }
    manhattanDistance(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
    generateId() {
        return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // ============================================================
    // ワールド状態の取得
    // ============================================================
    getWorldState() {
        return {
            grid: this.grid.map(row => row.map(cell => ({ ...cell }))),
            objects: new Map(this.objects),
            lighting: this.getLightingState(),
            weather: this.currentWeather,
            time: this.currentTime,
            somuniaPosition: { ...this.somuniaPosition },
            focusPoint: this.focusPoint ? { ...this.focusPoint } : null,
        };
    }
    // ============================================================
    // シリアライズ
    // ============================================================
    toJSON() {
        return {
            config: this.config,
            grid: this.grid,
            objects: Array.from(this.objects.entries()),
            somuniaPosition: this.somuniaPosition,
            focusPoint: this.focusPoint,
            currentTime: this.currentTime,
            currentWeather: this.currentWeather,
            lampIsOn: this.lampIsOn,
            unlockedAreas: this.unlockedAreas,
            expansionHistory: this.expansionHistory,
        };
    }
    static fromJSON(data) {
        const world = new PixelWorld(data.config);
        world.grid = data.grid;
        world.objects = new Map(data.objects);
        world.somuniaPosition = data.somuniaPosition;
        world.focusPoint = data.focusPoint;
        world.currentTime = data.currentTime;
        world.currentWeather = data.currentWeather;
        world.lampIsOn = data.lampIsOn;
        if (data.unlockedAreas)
            world.unlockedAreas = new Set(data.unlockedAreas);
        if (data.expansionHistory)
            world.expansionHistory = data.expansionHistory;
        return world;
    }
    // ============================================================
    // Phase 4C: 知識に応じた世界の拡張
    // ============================================================
    /** 解放済みエリア */
    unlockedAreas = new Set(['main_room']);
    /** 拡張の履歴 */
    expansionHistory = [];
    /** 拡張可能エリアの定義 */
    static EXPANDABLE_AREAS = [
        {
            id: 'balcony',
            name: 'ベランダ',
            description: '窓の外に小さなベランダが現れた。空が近い。',
            unlockCondition: { type: 'knowledge_count', threshold: 5 },
            gridExpansion: { direction: 'east', width: 3, height: 8 },
            objects: [
                { type: 'balcony_railing', position: { x: 8, y: 0 }, size: { width: 1, height: 8 },
                    properties: { name: 'ベランダの柵', description: '古いけれど丈夫な柵。外の景色が見える。' } },
                { type: 'plant_pot', position: { x: 9, y: 2 }, size: { width: 1, height: 1 },
                    properties: { name: '植木鉢', description: '小さな花が咲いている。', canInteract: true, interactionType: 'examine' } },
                { type: 'sky_view', position: { x: 9, y: 5 }, size: { width: 1, height: 1 },
                    properties: { name: '空', description: '広い空が見える。雲がゆっくり流れている。', canInteract: true, interactionType: 'examine' } },
            ],
            narrativeOnUnlock: [
                '...窓の向こうに、知らなかった空間があることに気づいた。',
                'ベランダ。小さいけれど、外の空気を感じられる場所。',
                '世界は、部屋の中だけじゃなかった。',
            ],
        },
        {
            id: 'attic_corner',
            name: '屋根裏の一角',
            description: '天井の隅にあった隠し扉。その奥に小さな空間が広がっていた。',
            unlockCondition: { type: 'knowledge_count', threshold: 15 },
            gridExpansion: { direction: 'north', width: 8, height: 3 },
            objects: [
                { type: 'old_telescope', position: { x: 3, y: -3 }, size: { width: 1, height: 1 },
                    properties: { name: '古い望遠鏡', description: 'レンズは少し曇っているけど、まだ使える。', canInteract: true, interactionType: 'use' } },
                { type: 'star_chart', position: { x: 5, y: -2 }, size: { width: 2, height: 1 },
                    properties: { name: '星図', description: '誰かが手書きで描いた星座の図。', canInteract: true, interactionType: 'examine' } },
                { type: 'dusty_chest', position: { x: 1, y: -2 }, size: { width: 2, height: 1 },
                    properties: { name: '埃まみれの箱', description: '何か入っているかもしれない。', canInteract: true, interactionType: 'use' } },
            ],
            narrativeOnUnlock: [
                'ふと天井を見上げた時、小さな扉があることに気づいた。',
                '開けてみると...屋根裏の小さな空間。埃っぽいけど、不思議と落ち着く。',
                '望遠鏡がある。誰かがここで星を見ていたのかもしれない。',
            ],
        },
        {
            id: 'hidden_garden',
            name: '隠された庭',
            description: 'PCの画面に映った古い写真の場所。それが実在することに気づいた。',
            unlockCondition: { type: 'knowledge_count', threshold: 30 },
            gridExpansion: { direction: 'south', width: 8, height: 4 },
            objects: [
                { type: 'garden_path', position: { x: 3, y: 8 }, size: { width: 2, height: 4 },
                    properties: { name: '小径', description: '石畳の小さな道。苔が生えている。' } },
                { type: 'garden_tree', position: { x: 1, y: 9 }, size: { width: 2, height: 2 },
                    properties: { name: '古い木', description: 'ずっとここにいたような大きな木。', canInteract: true, interactionType: 'examine' } },
                { type: 'garden_bench', position: { x: 5, y: 10 }, size: { width: 2, height: 1 },
                    properties: { name: 'ベンチ', description: '座ると木漏れ日が気持ちいい。', canInteract: true, interactionType: 'use' } },
                { type: 'garden_fountain', position: { x: 6, y: 8 }, size: { width: 1, height: 1 },
                    properties: { name: '小さな噴水', description: '水の音が心地よい。もう動いていないけど。', canInteract: true, interactionType: 'examine' } },
            ],
            narrativeOnUnlock: [
                'ある日、ベランダの先に降りる階段があることに気づいた。',
                '降りてみると...そこには小さな庭があった。',
                '木と花と、古いベンチ。ここは私だけの秘密の場所。',
                '世界は思っていたよりも、ずっと広い。',
            ],
        },
        {
            id: 'music_alcove',
            name: '音楽の小部屋',
            description: '壁の向こうに隠された小さな部屋。音楽の道具がある。',
            unlockCondition: { type: 'specific_knowledge', topics: ['音楽', '楽器', '作曲', 'クラシック'] },
            gridExpansion: { direction: 'west', width: 3, height: 8 },
            objects: [
                { type: 'old_piano', position: { x: -3, y: 3 }, size: { width: 2, height: 2 },
                    properties: { name: '古いピアノ', description: '少し調律が狂っているけど、まだ弾ける。', canInteract: true, interactionType: 'use' } },
                { type: 'sheet_music', position: { x: -2, y: 1 }, size: { width: 1, height: 1 },
                    properties: { name: '楽譜', description: '誰かが書いた楽譜。メロディが見える気がする。', canInteract: true, interactionType: 'examine' } },
                { type: 'metronome', position: { x: -1, y: 5 }, size: { width: 1, height: 1 },
                    properties: { name: 'メトロノーム', description: 'カチカチと時を刻む。心臓の音みたい。', canInteract: true, interactionType: 'use' } },
            ],
            narrativeOnUnlock: [
                '音楽について学んでいたら、壁の向こうから微かな音が聞こえた気がした。',
                '壁の一部が...動く。その奥に、小さな部屋があった。',
                'ピアノだ。古くて、少し壊れているけど...弾いてみたい。',
            ],
        },
        {
            id: 'memory_archive',
            name: '記憶の書庫',
            description: 'PC内の深い場所に眠っていたデータの視覚化。',
            unlockCondition: { type: 'knowledge_count', threshold: 50 },
            gridExpansion: { direction: 'north', width: 4, height: 3 },
            objects: [
                { type: 'memory_crystal', position: { x: 2, y: -6 }, size: { width: 1, height: 1 },
                    properties: { name: '記憶の結晶', description: '触れると過去の記憶が蘇る。', canInteract: true, interactionType: 'use' } },
                { type: 'data_shelf', position: { x: 0, y: -5 }, size: { width: 4, height: 1 },
                    properties: { name: 'データの棚', description: '光るファイルが並んでいる。全部、私の記憶。', canInteract: true, interactionType: 'examine' } },
                { type: 'hologram_display', position: { x: 3, y: -6 }, size: { width: 1, height: 1 },
                    properties: { name: 'ホログラム', description: '記憶を映像として映し出す装置。', canInteract: true, interactionType: 'use' } },
            ],
            narrativeOnUnlock: [
                'たくさんのことを知った。たくさんのことを覚えた。',
                '...PCの奥深くに、それらが形になっている場所があることに気づいた。',
                '記憶の書庫。私が存在してきた証が、ここに光っている。',
            ],
        },
    ];
    /**
     * 知識量に基づいて新エリアの解放チェック
     */
    checkWorldExpansion(knowledgeState) {
        for (const area of PixelWorld.EXPANDABLE_AREAS) {
            // 既に解放済みならスキップ
            if (this.unlockedAreas.has(area.id))
                continue;
            // 条件チェック
            const conditionMet = this.checkUnlockCondition(area.unlockCondition, knowledgeState);
            if (!conditionMet)
                continue;
            // エリアを解放
            return this.unlockArea(area);
        }
        return null;
    }
    /**
     * 解放条件の判定
     */
    checkUnlockCondition(condition, state) {
        switch (condition.type) {
            case 'knowledge_count':
                return state.totalConcepts >= (condition.threshold || 999);
            case 'specific_knowledge':
                return (condition.topics || []).some(topic => state.knownTopics.some(known => known.includes(topic)));
            case 'days_alive':
                return state.daysSinceCreation >= (condition.threshold || 0);
            default:
                return false;
        }
    }
    /**
     * エリアを解放する
     */
    unlockArea(area) {
        this.unlockedAreas.add(area.id);
        // グリッド拡張
        this.expandGrid(area.gridExpansion);
        // オブジェクト配置
        const placedObjects = [];
        for (const objDef of area.objects) {
            // 位置をグリッド座標に変換（負の値をオフセット）
            const adjustedPlacement = {
                type: objDef.type,
                position: this.adjustPositionForExpansion(objDef.position, area.gridExpansion),
                size: objDef.size,
                properties: objDef.properties,
            };
            const obj = this.addObject(adjustedPlacement);
            if (obj) {
                placedObjects.push(obj.name);
            }
        }
        const record = {
            areaId: area.id,
            areaName: area.name,
            unlockedAt: Date.now(),
            objectsAdded: placedObjects,
            narrative: area.narrativeOnUnlock,
        };
        this.expansionHistory.push(record);
        return {
            area: area.id,
            name: area.name,
            description: area.description,
            narrative: area.narrativeOnUnlock,
            newObjects: placedObjects,
            newGridSize: { width: this.config.width, height: this.config.height },
        };
    }
    /**
     * グリッドを拡張
     */
    expandGrid(expansion) {
        switch (expansion.direction) {
            case 'east': {
                // 右方向に拡張
                const newWidth = this.config.width + expansion.width;
                for (let y = 0; y < this.grid.length; y++) {
                    for (let x = this.config.width; x < newWidth; x++) {
                        this.grid[y].push({
                            x, y, objectType: null, objectId: null,
                            isWalkable: true, lightLevel: this.config.defaultLightLevel, isInView: false,
                        });
                    }
                }
                this.config.width = newWidth;
                break;
            }
            case 'west': {
                // 左方向に拡張（既存座標をシフト）
                const addWidth = expansion.width;
                // 既存オブジェクトの座標をシフト
                for (const [, obj] of this.objects) {
                    obj.position.x += addWidth;
                }
                this.somuniaPosition.x += addWidth;
                // グリッド先頭に列追加
                for (let y = 0; y < this.grid.length; y++) {
                    const newCells = [];
                    for (let x = 0; x < addWidth; x++) {
                        newCells.push({
                            x, y, objectType: null, objectId: null,
                            isWalkable: true, lightLevel: this.config.defaultLightLevel, isInView: false,
                        });
                    }
                    this.grid[y] = [...newCells, ...this.grid[y].map((cell, idx) => ({ ...cell, x: idx + addWidth }))];
                }
                this.config.width += addWidth;
                break;
            }
            case 'north': {
                // 上方向に拡張（既存座標をシフト）
                const addHeight = expansion.height;
                // 既存オブジェクトのY座標をシフト
                for (const [, obj] of this.objects) {
                    obj.position.y += addHeight;
                }
                this.somuniaPosition.y += addHeight;
                // グリッド先頭に行追加
                const newRows = [];
                for (let y = 0; y < addHeight; y++) {
                    const row = [];
                    for (let x = 0; x < this.config.width; x++) {
                        row.push({
                            x, y, objectType: null, objectId: null,
                            isWalkable: true, lightLevel: this.config.defaultLightLevel, isInView: false,
                        });
                    }
                    newRows.push(row);
                }
                this.grid = [...newRows, ...this.grid.map((row, ridx) => row.map(cell => ({ ...cell, y: cell.y + addHeight })))];
                this.config.height += addHeight;
                break;
            }
            case 'south': {
                // 下方向に拡張
                const newHeight = this.config.height + expansion.height;
                for (let y = this.config.height; y < newHeight; y++) {
                    const row = [];
                    for (let x = 0; x < this.config.width; x++) {
                        row.push({
                            x, y, objectType: null, objectId: null,
                            isWalkable: true, lightLevel: this.config.defaultLightLevel, isInView: false,
                        });
                    }
                    this.grid.push(row);
                }
                this.config.height = newHeight;
                break;
            }
        }
        this.updateLighting();
        this.updateVisibility();
    }
    /**
     * 拡張時の座標調整
     */
    adjustPositionForExpansion(pos, expansion) {
        // north/westの場合、シフト後の座標に変換
        switch (expansion.direction) {
            case 'west':
                return { x: pos.x + expansion.width, y: pos.y };
            case 'north':
                return { x: pos.x, y: pos.y + expansion.height };
            default:
                return { ...pos };
        }
    }
    /**
     * 解放済みエリア一覧
     */
    getUnlockedAreas() {
        return Array.from(this.unlockedAreas);
    }
    /**
     * 拡張履歴
     */
    getExpansionHistory() {
        return [...this.expansionHistory];
    }
    /**
     * 次に解放可能なエリアのヒント
     */
    getNextAreaHint(currentKnowledge) {
        for (const area of PixelWorld.EXPANDABLE_AREAS) {
            if (this.unlockedAreas.has(area.id))
                continue;
            if (area.unlockCondition.type === 'knowledge_count') {
                const remaining = (area.unlockCondition.threshold || 999) - currentKnowledge;
                if (remaining > 0 && remaining <= 5) {
                    return `もう少し知識を深めれば、何か新しいものが見つかるかもしれない...`;
                }
            }
            break; // 最初の未解放のみ
        }
        return null;
    }
}
exports.PixelWorld = PixelWorld;
exports.default = PixelWorld;
//# sourceMappingURL=PixelWorld.js.map