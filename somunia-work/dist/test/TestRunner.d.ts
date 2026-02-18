/**
 * TestRunner - Phase 6D: テストスイート
 *
 * somunia v10の主要モジュールに対する単体テスト・統合テスト。
 * 外部依存なし（jest等不要）の自己完結型テストフレームワーク。
 */
interface TestSuiteResult {
    suiteName: string;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    failures: {
        name: string;
        error: string;
    }[];
}
export declare function runAllTests(): Promise<TestSuiteResult[]>;
export {};
//# sourceMappingURL=TestRunner.d.ts.map