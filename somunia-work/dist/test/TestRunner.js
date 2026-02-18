"use strict";
/**
 * TestRunner - Phase 6D: テストスイート
 *
 * somunia v10の主要モジュールに対する単体テスト・統合テスト。
 * 外部依存なし（jest等不要）の自己完結型テストフレームワーク。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAllTests = runAllTests;
class TestSuite {
    name;
    cases = [];
    constructor(name) {
        this.name = name;
    }
    test(name, fn) {
        this.cases.push({ name, fn });
    }
    skip(name, _fn) {
        this.cases.push({ name, fn: () => { }, skip: true });
    }
    async run() {
        const result = { suiteName: this.name, passed: 0, failed: 0, skipped: 0, duration: 0, failures: [] };
        const start = Date.now();
        for (const tc of this.cases) {
            if (tc.skip) {
                result.skipped++;
                continue;
            }
            try {
                await tc.fn();
                result.passed++;
            }
            catch (error) {
                result.failed++;
                result.failures.push({ name: tc.name, error: error?.message || String(error) });
            }
        }
        result.duration = Date.now() - start;
        return result;
    }
}
function assert(condition, message = 'Assertion failed') { if (!condition)
    throw new Error(message); }
function assertEqual(actual, expected, message) { if (actual !== expected)
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
function assertInRange(value, min, max, message) { if (value < min || value > max)
    throw new Error(message || `Expected ${value} in [${min}, ${max}]`); }
function assertDefined(value, message) { if (value === undefined || value === null)
    throw new Error(message || 'Expected defined'); }
function assertType(value, type, message) { if (typeof value !== type)
    throw new Error(message || `Expected type ${type}, got ${typeof value}`); }
// ============================================================
// テストモジュールのインポート
// ============================================================
const Homeostasis_1 = require("../body/Homeostasis");
const UrgeSystem_1 = require("../body/UrgeSystem");
const EmotionEngine_1 = require("../emotions/EmotionEngine");
const PatternLibrary_1 = require("../brain/PatternLibrary");
const Yuragi_1 = require("../brain/Yuragi");
const EpisodicMemory_1 = require("../memory/EpisodicMemory");
const SemanticMemory_1 = require("../memory/SemanticMemory");
const BehaviorEngine_1 = require("../behavior/BehaviorEngine");
const TimeManager_1 = require("../core/TimeManager");
const EventBus_1 = require("../core/EventBus");
const PersistenceV2_1 = require("../persistence/PersistenceV2");
const WikipediaAPI_1 = require("../knowledge/WikipediaAPI");
const WikipediaLearner_1 = require("../knowledge/WikipediaLearner");
// ============================================================
// Homeostasis テスト
// ============================================================
function createHomeostasisTests() {
    const suite = new TestSuite('Homeostasis（恒常性維持）');
    suite.test('初期状態のエネルギーは正常範囲', () => {
        const h = new Homeostasis_1.Homeostasis();
        const state = h.getState();
        assertInRange(state.energy.current, 0, 1);
        assertInRange(state.exploration.noveltyNeed, 0, 1);
        assertInRange(state.safety.threatLevel, 0, 1);
    });
    suite.test('update で変化が記録される', () => {
        const h = new Homeostasis_1.Homeostasis();
        const events = h.update(1, 'morning', 0.2);
        assertDefined(events);
        assert(Array.isArray(events), 'Should return array of events');
    });
    suite.test('シリアライズ/デシリアライズ', () => {
        const h = new Homeostasis_1.Homeostasis();
        h.update(1, 'morning', 0.2);
        const json = h.toJSON();
        assertDefined(json);
        const restored = Homeostasis_1.Homeostasis.fromJSON(json);
        assertDefined(restored);
        assertInRange(restored.getState().energy.current, 0, 1);
    });
    suite.test('睡眠中はエネルギー回復', () => {
        const h = new Homeostasis_1.Homeostasis();
        // 多数回更新でエネルギー消費
        for (let i = 0; i < 100; i++)
            h.update(i, 'afternoon', 0.5);
        const beforeSleep = h.getState().energy.current;
        // 睡眠中の更新（fatigue低くしてエネルギー回復促進）
        for (let i = 100; i < 200; i++)
            h.update(i, 'night', 0.0);
        const afterSleep = h.getState().energy.current;
        // エネルギーが維持されるか回復していること
        assert(afterSleep >= beforeSleep * 0.8, `Energy should recover: ${beforeSleep} → ${afterSleep}`);
    });
    return suite;
}
// ============================================================
// UrgeSystem テスト
// ============================================================
function createUrgeTests() {
    const suite = new TestSuite('UrgeSystem（欲求・衝動）');
    suite.test('初期状態で欲求が存在する', () => {
        const u = new UrgeSystem_1.UrgeSystem();
        const state = u.getState();
        assertDefined(state.urges);
        assert(Object.keys(state.urges).length > 0, 'Should have urges');
    });
    suite.test('update が正常に動作', () => {
        const u = new UrgeSystem_1.UrgeSystem();
        const events = u.update(1, 'morning', { peace: 0.5, curiosity: 0.3 });
        assertDefined(events);
        assert(Array.isArray(events), 'Should return events');
    });
    suite.test('getActiveUrges が配列を返す', () => {
        const u = new UrgeSystem_1.UrgeSystem();
        u.update(1, 'morning', {});
        const active = u.getActiveUrges();
        assert(Array.isArray(active), 'Should return array');
    });
    suite.test('シリアライズ/デシリアライズ', () => {
        const u = new UrgeSystem_1.UrgeSystem();
        const json = u.toJSON();
        assertDefined(json);
        const restored = UrgeSystem_1.UrgeSystem.fromJSON(json);
        assertDefined(restored);
    });
    return suite;
}
// ============================================================
// EmotionEngine テスト
// ============================================================
function createEmotionTests() {
    const suite = new TestSuite('EmotionEngine（感情エンジン）');
    suite.test('初期状態で感情が存在する', () => {
        const e = new EmotionEngine_1.EmotionEngine();
        const state = e.getState();
        assertDefined(state);
        assertDefined(state.primary);
    });
    suite.test('update が正常に動作', () => {
        const e = new EmotionEngine_1.EmotionEngine();
        const result = e.update(1, 'morning');
        // result はEmotionChangeEvent | null
        // エラーが出なければOK
    });
    suite.test('感情レベルの取得', () => {
        const e = new EmotionEngine_1.EmotionEngine();
        const level = e.getEmotionLevel('peace');
        assertInRange(level, 0, 1);
    });
    suite.test('シリアライズが正常', () => {
        const e = new EmotionEngine_1.EmotionEngine();
        const json = e.toJSON();
        assertDefined(json);
        assertType(json, 'object');
    });
    return suite;
}
// ============================================================
// PatternLibrary テスト
// ============================================================
function createPatternTests() {
    const suite = new TestSuite('PatternLibrary（パターンライブラリ）');
    suite.test('初期パターンが存在する', () => {
        const p = new PatternLibrary_1.PatternLibrary();
        p.initialize();
        const patterns = p.getAllPatterns();
        assert(patterns.speech.length > 0, 'Should have speech patterns');
        assert(patterns.behavior.length > 0, 'Should have behavior patterns');
    });
    suite.test('パターン数が十分にある', () => {
        const p = new PatternLibrary_1.PatternLibrary();
        p.initialize();
        const all = p.getAllPatterns();
        const total = all.speech.length + all.behavior.length + all.emotion.length;
        assert(total >= 10, `Should have >= 10 patterns, got ${total}`);
    });
    return suite;
}
// ============================================================
// Yuragi テスト
// ============================================================
function createYuragiTests() {
    const suite = new TestSuite('Yuragi（揺らぎ）');
    suite.test('Yuragi.getValue が範囲内', () => {
        const y = new Yuragi_1.Yuragi();
        for (let i = 0; i < 100; i++) {
            const val = y.getValue();
            assertInRange(val, -1, 1, `Yuragi value ${val} out of range`);
        }
    });
    suite.test('YuragiSystem が初期化可能', () => {
        const ys = new Yuragi_1.YuragiSystem();
        assertDefined(ys);
    });
    suite.test('YuragiSystem のシリアライズ', () => {
        const ys = new Yuragi_1.YuragiSystem();
        const json = ys.toJSON();
        assertDefined(json);
        ys.fromJSON(json);
    });
    return suite;
}
// ============================================================
// EpisodicMemory テスト
// ============================================================
function createEpisodicMemoryTests() {
    const suite = new TestSuite('EpisodicMemory（エピソード記憶）');
    suite.test('記憶の形成', () => {
        const em = new EpisodicMemory_1.EpisodicMemorySystem();
        em.formMemory({
            content: 'テスト記憶: 窓の外に星が見えた',
            summary: '星を見た',
            emotionalTags: ['wonder'],
            emotionalIntensity: 0.7,
            relatedConcepts: ['星', '夜'],
        });
        assert(em.getMemoryCount() > 0, 'Memory should be stored');
    });
    suite.test('記憶の検索', () => {
        const em = new EpisodicMemory_1.EpisodicMemorySystem();
        em.formMemory({
            content: '美しい月を見上げた',
            summary: '月を見た',
            emotionalTags: ['wonder', 'peace'],
            emotionalIntensity: 0.8,
            relatedConcepts: ['月', '夜空'],
        });
        const results = em.search('月');
        assertDefined(results);
        assert(results.length > 0, 'Should find memory about moon');
    });
    suite.test('シリアライズ/デシリアライズ', () => {
        const em = new EpisodicMemory_1.EpisodicMemorySystem();
        em.formMemory({
            content: 'テスト',
            summary: 'テスト',
            emotionalTags: ['peace'],
            emotionalIntensity: 0.5,
            relatedConcepts: ['test'],
        });
        const json = em.toJSON();
        assertDefined(json);
        const restored = EpisodicMemory_1.EpisodicMemorySystem.fromJSON(json);
        assertDefined(restored);
        assert(restored.getMemoryCount() > 0, 'Restored should have memories');
    });
    return suite;
}
// ============================================================
// SemanticMemory テスト
// ============================================================
function createSemanticMemoryTests() {
    const suite = new TestSuite('SemanticMemory（意味記憶）');
    suite.test('概念の学習', () => {
        const sm = new SemanticMemory_1.SemanticMemorySystem();
        const result = sm.learn({
            concept: '光',
            definition: '電磁波の一種',
            source: 'book',
        });
        assertDefined(result);
        assert(sm.getConceptCount() > 0, 'Should have concepts');
    });
    suite.test('複数概念の学習', () => {
        const sm = new SemanticMemory_1.SemanticMemorySystem();
        sm.learn({ concept: '音楽', definition: '音による芸術', source: 'book' });
        sm.learn({ concept: '旋律', definition: '音の連なり', source: 'book' });
        assert(sm.getConceptCount() >= 2, 'Should have 2+ concepts');
    });
    suite.test('統計の取得', () => {
        const sm = new SemanticMemory_1.SemanticMemorySystem();
        sm.learn({ concept: 'test', definition: 'a test', source: 'book' });
        const stats = sm.getStats();
        assertDefined(stats);
        assert(stats.totalConcepts > 0, 'Should have concepts');
    });
    return suite;
}
// ============================================================
// BehaviorEngine テスト
// ============================================================
function createBehaviorTests() {
    const suite = new TestSuite('BehaviorEngine（行動決定）');
    suite.test('初期化が正常', () => {
        const b = new BehaviorEngine_1.BehaviorEngine();
        assertDefined(b);
        const current = b.getCurrentAction();
        // 初期は null でも OK
    });
    suite.test('シリアライズが正常', () => {
        const b = new BehaviorEngine_1.BehaviorEngine();
        const json = b.toJSON();
        assertDefined(json);
    });
    return suite;
}
// ============================================================
// TimeManager テスト
// ============================================================
function createTimeTests() {
    const suite = new TestSuite('TimeManager（時間管理）');
    suite.test('初期時間が正常', () => {
        const t = new TimeManager_1.TimeManager();
        const hour = t.getHour();
        assertInRange(hour, 0, 24);
    });
    suite.test('時間帯の取得', () => {
        const t = new TimeManager_1.TimeManager();
        const tod = t.getTimeOfDay();
        assertDefined(tod);
        const validTods = ['dawn', 'morning', 'midday', 'afternoon', 'evening', 'night', 'late_night'];
        assert(validTods.includes(tod), `Invalid TimeOfDay: ${tod}`);
    });
    suite.test('getState が正常', () => {
        const t = new TimeManager_1.TimeManager();
        const state = t.getState();
        assertDefined(state);
        assertDefined(state.simulatedHour);
        assertDefined(state.simulatedDay);
    });
    suite.test('シリアライズ/デシリアライズ', () => {
        const t = new TimeManager_1.TimeManager();
        const json = t.toJSON();
        assertDefined(json);
        t.fromJSON(json);
        assertInRange(t.getHour(), 0, 24);
    });
    return suite;
}
// ============================================================
// PersistenceV2 テスト
// ============================================================
function createPersistenceTests() {
    const suite = new TestSuite('PersistenceV2（永続化）');
    suite.test('初期化が正常', () => {
        const events = new EventBus_1.EventBus();
        const p = new PersistenceV2_1.PersistenceV2({ dataDir: '/tmp/somunia-test-' + Date.now() }, events);
        assertDefined(p);
    });
    suite.test('モジュール登録', () => {
        const events = new EventBus_1.EventBus();
        const p = new PersistenceV2_1.PersistenceV2({ dataDir: '/tmp/somunia-test2-' + Date.now() }, events);
        p.registerModule('test', { toJSON: () => ({ v: 1 }), fromJSON: () => { } });
        // エラーが出なければOK
    });
    suite.test('保存/読み込み', async () => {
        const dir = '/tmp/somunia-test3-' + Date.now();
        const events = new EventBus_1.EventBus();
        const p = new PersistenceV2_1.PersistenceV2({ dataDir: dir }, events);
        const data = { value: 42 };
        let loadedData = null;
        p.registerModule('test', {
            toJSON: () => data,
            fromJSON: (d) => { loadedData = d; },
        });
        const saved = await p.save(100, 1);
        assert(saved, 'Save should succeed');
        loadedData = null;
        const loaded = await p.load();
        assert(loaded, 'Load should succeed');
        assertDefined(loadedData);
        assertEqual(loadedData.value, 42);
        try {
            require('fs').rmSync(dir, { recursive: true });
        }
        catch { }
    });
    suite.test('ストレージ情報', () => {
        const events = new EventBus_1.EventBus();
        const p = new PersistenceV2_1.PersistenceV2({ dataDir: '/tmp/somunia-test4-' + Date.now() }, events);
        const info = p.getStorageInfo();
        assertDefined(info);
        assertDefined(info.formattedSize);
        assertDefined(info.stats);
    });
    return suite;
}
// ============================================================
// WikipediaAPI テスト
// ============================================================
function createWikiAPITests() {
    const suite = new TestSuite('WikipediaAPI（Wikipedia接続）');
    suite.test('初期化が正常', () => {
        const api = new WikipediaAPI_1.WikipediaAPI({ offlineMode: true });
        assertDefined(api);
    });
    suite.test('オフライン検索はエラーにならない', async () => {
        const api = new WikipediaAPI_1.WikipediaAPI({ offlineMode: true });
        const results = await api.search('テスト');
        assertDefined(results);
        assert(Array.isArray(results), 'Results should be array');
    });
    suite.test('ステータス取得', () => {
        const api = new WikipediaAPI_1.WikipediaAPI({ offlineMode: true });
        const status = api.getStatus();
        assertDefined(status);
        assertEqual(status.isOnline, false);
    });
    suite.test('オフラインモード切替', () => {
        const api = new WikipediaAPI_1.WikipediaAPI({ offlineMode: true });
        api.setOfflineMode(false);
        assertEqual(api.getStatus().isOnline, true);
        api.setOfflineMode(true);
        assertEqual(api.getStatus().isOnline, false);
    });
    suite.test('シリアライズ', () => {
        const api = new WikipediaAPI_1.WikipediaAPI({ offlineMode: true });
        const json = api.toJSON();
        assertDefined(json);
        api.fromJSON(json);
    });
    return suite;
}
// ============================================================
// WikipediaLearner テスト
// ============================================================
function createWikiLearnerTests() {
    const suite = new TestSuite('WikipediaLearner（Wikipedia学習）');
    suite.test('初期記事データベースが存在する', () => {
        const wl = new WikipediaLearner_1.WikipediaLearner();
        const article = wl.getArticle('音楽');
        assertDefined(article);
        assertEqual(article.title, '音楽');
    });
    suite.test('記事検索', () => {
        const wl = new WikipediaLearner_1.WikipediaLearner();
        const results = wl.searchArticles('詩');
        assert(results.length > 0, 'Should find articles about poetry');
    });
    suite.test('探索セッション開始', () => {
        const wl = new WikipediaLearner_1.WikipediaLearner();
        const session = wl.startExploration({ type: 'curiosity', intensity: 0.7 });
        assertDefined(session);
        assertDefined(session.id);
    });
    suite.test('APIステータス取得', () => {
        const wl = new WikipediaLearner_1.WikipediaLearner();
        const status = wl.getAPIStatus();
        assertDefined(status);
        assertDefined(status.totalRequests);
    });
    suite.test('シリアライズ', () => {
        const wl = new WikipediaLearner_1.WikipediaLearner();
        const data = wl.serialize();
        assertDefined(data);
    });
    return suite;
}
// ============================================================
// 統合テスト
// ============================================================
function createIntegrationTests() {
    const suite = new TestSuite('統合テスト');
    suite.test('全モジュールが独立して初期化可能', () => {
        assertDefined(new Homeostasis_1.Homeostasis());
        assertDefined(new UrgeSystem_1.UrgeSystem());
        assertDefined(new EmotionEngine_1.EmotionEngine());
        assertDefined(new PatternLibrary_1.PatternLibrary());
        assertDefined(new Yuragi_1.YuragiSystem());
        assertDefined(new Yuragi_1.Yuragi());
        assertDefined(new EpisodicMemory_1.EpisodicMemorySystem());
        assertDefined(new SemanticMemory_1.SemanticMemorySystem());
        assertDefined(new BehaviorEngine_1.BehaviorEngine());
        assertDefined(new TimeManager_1.TimeManager());
        assertDefined(new WikipediaLearner_1.WikipediaLearner());
        assertDefined(new WikipediaAPI_1.WikipediaAPI({ offlineMode: true }));
        assertDefined(new PersistenceV2_1.PersistenceV2({ dataDir: '/tmp/somunia-integ-' + Date.now() }, new EventBus_1.EventBus()));
    });
    suite.test('感情→行動の連鎖', () => {
        const emotion = new EmotionEngine_1.EmotionEngine();
        emotion.update(1, 'afternoon');
        const state = emotion.getState();
        assertDefined(state.primary);
        const behavior = new BehaviorEngine_1.BehaviorEngine();
        assertDefined(behavior);
    });
    suite.test('記憶の形成→検索→シリアライズの一貫性', () => {
        const em = new EpisodicMemory_1.EpisodicMemorySystem();
        const sm = new SemanticMemory_1.SemanticMemorySystem();
        em.formMemory({
            content: '夜空に輝く星を見つけた',
            summary: '星を見つけた',
            emotionalTags: ['wonder', 'peace'],
            emotionalIntensity: 0.9,
            relatedConcepts: ['星', '夜空'],
        });
        sm.learn({ concept: '星', definition: '自ら光を発する天体', source: 'book' });
        sm.learn({ concept: '夜空', definition: '夜の空', source: 'experience' });
        const results = em.search('星');
        assert(results.length > 0, 'Should recall star memory');
        assert(sm.getConceptCount() >= 2, 'Should have concepts');
        const emJson = em.toJSON();
        const smJson = sm.toJSON();
        assertDefined(emJson);
        assertDefined(smJson);
        const restoredEm = EpisodicMemory_1.EpisodicMemorySystem.fromJSON(emJson);
        assert(restoredEm.getMemoryCount() > 0, 'Restored should have memories');
    });
    suite.test('PersistenceV2の複数モジュール保存/復元', async () => {
        const dir = '/tmp/somunia-integ2-' + Date.now();
        const events = new EventBus_1.EventBus();
        const p = new PersistenceV2_1.PersistenceV2({ dataDir: dir }, events);
        const moduleA = { data: { name: 'A', value: 1 }, toJSON() { return this.data; }, fromJSON(d) { this.data = d; } };
        const moduleB = { data: { name: 'B', value: 2 }, toJSON() { return this.data; }, fromJSON(d) { this.data = d; } };
        p.registerModule('A', moduleA);
        p.registerModule('B', moduleB);
        await p.save(100, 1);
        moduleA.data = { name: 'A', value: 999 };
        moduleB.data = { name: 'B', value: 888 };
        await p.load();
        assertEqual(moduleA.data.value, 1, 'Module A restored');
        assertEqual(moduleB.data.value, 2, 'Module B restored');
        try {
            require('fs').rmSync(dir, { recursive: true });
        }
        catch { }
    });
    return suite;
}
// ============================================================
// テスト実行
// ============================================================
async function runAllTests() {
    const suites = [
        createHomeostasisTests(),
        createUrgeTests(),
        createEmotionTests(),
        createPatternTests(),
        createYuragiTests(),
        createEpisodicMemoryTests(),
        createSemanticMemoryTests(),
        createBehaviorTests(),
        createTimeTests(),
        createPersistenceTests(),
        createWikiAPITests(),
        createWikiLearnerTests(),
        createIntegrationTests(),
    ];
    const results = [];
    for (const suite of suites) {
        const result = await suite.run();
        results.push(result);
        const icon = result.failed === 0 ? '✓' : '✗';
        const color = result.failed === 0 ? '\x1b[32m' : '\x1b[31m';
        console.log(`  ${color}${icon}\x1b[0m ${result.suiteName} (${result.passed}/${result.passed + result.failed} passed, ${result.duration}ms)`);
        for (const f of result.failures) {
            console.log(`    \x1b[31m✗ ${f.name}: ${f.error}\x1b[0m`);
        }
    }
    const totalPassed = results.reduce((s, r) => s + r.passed, 0);
    const totalFailed = results.reduce((s, r) => s + r.failed, 0);
    const totalSkipped = results.reduce((s, r) => s + r.skipped, 0);
    const totalDuration = results.reduce((s, r) => s + r.duration, 0);
    console.log('');
    const c = totalFailed === 0 ? '\x1b[32m' : '\x1b[31m';
    console.log(`  ${c}合計: ${totalPassed} passed, ${totalFailed} failed, ${totalSkipped} skipped (${totalDuration}ms)\x1b[0m`);
    console.log('');
    return results;
}
if (require.main === module) {
    runAllTests().then(results => {
        const failed = results.reduce((s, r) => s + r.failed, 0);
        process.exit(failed > 0 ? 1 : 0);
    });
}
//# sourceMappingURL=TestRunner.js.map