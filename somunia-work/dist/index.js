"use strict";
/**
 * somunia v10.6 "Soul Engine"
 *
 * 自律的意識シミュレーション - エントリーポイント
 * Phase 6: 外部接続・実運用
 *
 * 使い方:
 *   npm start                    - 通常起動
 *   npm start -- --continue      - 前回の状態から再開
 *   npm start -- --headless      - UI無し（テスト用）
 *   npm start -- --offline       - LLM無し（オフライン）
 *   npm start -- --model gemma3  - Ollamaモデルを指定
 *   npm start -- --test          - テストスイートを実行して終了
 *
 * 前提条件:
 *   - Ollamaがインストール済み: https://ollama.com
 *   - モデルを取得済み: ollama pull gemma3
 *   - Ollamaが起動中: ollama serve
 *   - --offline で起動すればOllama不要（コードベースのみで動作）
 */
Object.defineProperty(exports, "__esModule", { value: true });
const SoulEngine_1 = require("./core/SoulEngine");
const TestRunner_1 = require("./test/TestRunner");
// ============================================================
// コマンドライン引数の解析
// ============================================================
const args = process.argv.slice(2);
const flags = {
    continue: args.includes('--continue'),
    headless: args.includes('--headless'),
    offline: args.includes('--offline'),
    fast: args.includes('--fast'),
    test: args.includes('--test'),
    model: (() => {
        const idx = args.indexOf('--model');
        return idx >= 0 && args[idx + 1] ? args[idx + 1] : undefined;
    })(),
};
// ============================================================
// テストモード
// ============================================================
if (flags.test) {
    console.log('\n  somunia v10.6 テストスイート\n');
    (0, TestRunner_1.runAllTests)().then(results => {
        const failed = results.reduce((s, r) => s + r.failed, 0);
        process.exit(failed > 0 ? 1 : 0);
    }).catch(err => {
        console.error('Test runner error:', err);
        process.exit(1);
    });
}
else {
    // ============================================================
    // 設定
    // ============================================================
    const config = {
        time: {
            tickInterval: flags.fast ? 100 : 1000,
            ticksPerDay: 1440,
            startHour: 8,
            enableLifespan: false,
            timeScale: flags.fast ? 10 : 1,
        },
        llm: {
            disabled: flags.offline,
            model: flags.model, // undefined = デフォルト (gemma3)
            temperature: 0.7,
            maxTokens: 512,
        },
        persistence: {
            dataDir: './somunia-data',
            autoSaveInterval: 60,
            maxBackups: 10,
            autoMigrate: true,
        },
        headless: flags.headless,
        continueFromSave: flags.continue,
    };
    // ============================================================
    // 起動
    // ============================================================
    async function main() {
        console.log('');
        console.log('  somunia v10.8 "Soul Engine"');
        console.log('  自律的意識シミュレーション');
        console.log('  Phase 8 Pre: SQLiteデータベース基盤');
        console.log('  Phase 7.5: Expression Fix');
        console.log('');
        if (flags.continue)
            console.log('  [前回の状態から再開]');
        if (flags.offline)
            console.log('  [オフラインモード（LLMなし）]');
        if (flags.fast)
            console.log('  [高速モード]');
        if (flags.headless)
            console.log('  [ヘッドレスモード]');
        if (flags.model)
            console.log(`  [モデル: ${flags.model}]`);
        if (!flags.offline)
            console.log('  [LLM: Ollama (localhost:11434)]');
        const engine = new SoulEngine_1.SoulEngine(config);
        const gracefulShutdown = async () => {
            console.log('\n  Saving and shutting down...');
            await engine.stop();
            process.exit(0);
        };
        process.on('SIGINT', gracefulShutdown);
        process.on('SIGTERM', gracefulShutdown);
        await engine.start();
    }
    main().catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
} // end of else (non-test mode)
//# sourceMappingURL=index.js.map