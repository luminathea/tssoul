# Phase 7.5: Expression Fix（緊急修正）

## 概要

Phase 7.5はPhase 7の「表現パイプライン」に存在した深刻な問題を修正するアップデートです。

**Phase 7の問題:**
Phase 7で構築したContextBridge → LLM → 応答のパイプラインは骨格としては正しかったが、
実際の会話では以下の致命的な問題があった：

1. **毎回「わたしは…somunia」と自己紹介する** — LLMがプロンプトの状況記述を復唱
2. **内部メッセージがユーザーに漏れる** — 「口調を柔らかく、修正が必要」が表示される
3. **質問に答えない** — LLMが内部の状況記述と応答を混同
4. **会話深度が上がらない** — 意図分析・訪問者情報蓄積が機能不全
5. **満足度31%** — 上記全ての複合

**Phase 7.5の解決策:**
4つのサブフェーズによる「表現品質」の根本改善。

## アーキテクチャ

```
[内部状態] → [ContextBridge]         → [LLMInterface]       → [ExpressionFilter] → [応答]
               ↓                        ↓                      ↓
            buildSeparatedPrompt()   callOllama(user, system) filter()
            system: 人格・状況設定    system/user分離送信       復唱検出
            user: 訪問者の発言+指示                             AI口調除去
                                                              内部漏れ防止
                                                              反復防止
                                                              フォールバック生成
```

## サブフェーズ詳細

### 7.5A: プロンプト構造の根本改修

**ContextBridge.buildSeparatedPrompt()**

プロンプトを「system」と「user」の2つに明確分離：

**Before (Phase 7):**
```
一つのプロンプトに全情報を混在:
「わたしはsomunia。今は夜8時、窓の外は雨。さっき本を読んでいた。
  気分は穏やか。この人は○○さん。
  訪問者が言ったこと: こんにちは
  口調: ひらがな多め…
  発話のみ出力してください。」

→ LLMが「わたしはsomunia。今は…」を応答として復唱
```

**After (Phase 7.5):**
```
system: 「あなたはsomunia。静かで内省的なVSingerの少女。
  【口調】一人称「わたし」、ひらがな多め…
  【今の状態】夜の8時。穏やかな気分。
  【この訪問者のこと】○○さん。2回目の訪問。」

user: 「訪問者: こんにちは
  上記の訪問者に対する返事を1～3文で書いてください。」

→ LLMはsystemを「自分の設定」として内面化し、userに対して自然に応答
```

### 7.5B: LLM構造化レスポンス

**LLMInterface.expressResponseStructured()**

応答テキストだけでなく、メタデータも取得する二段構え：

1. **まず分離プロンプトで直接応答** — テキスト応答を優先（信頼性が高い）
2. テキスト応答が成功 → 簡易メタデータ推論で補完
3. テキスト応答が失敗 → JSON形式の構造化応答にフォールバック

メタデータ：
- `detectedEmotion`: LLMが応答に込めた感情
- `detectedTopics`: 話題のキーワード
- `confidence`: 応答の確信度

**LLMInterface.expressResponseWithSeparatedPrompt()**

Ollamaに system/user を正しく分離送信する新メソッド：
```
callOllama(userPrompt, systemPrompt)
  → Ollama Chat API の messages[0] = { role: 'system', content: systemPrompt }
  → Ollama Chat API の messages[1] = { role: 'user', content: userPrompt }
```

### 7.5C: 応答検証の実用化

**ContextBridge.validateResponse() + generateValidFallback()**

**Before (Phase 7):**
```
validation.suggestion = '口調を柔らかく、somuniaらしい表現に修正が必要'
→ この内部メッセージがそのままユーザーに表示されていた
```

**After (Phase 7.5):**
```
validation.suggestion = 'ふふ...ありがとう。うれしいな'
→ 感情・文脈に基づく自然なフォールバック応答を生成
→ 内部メッセージは絶対にユーザーに到達しない
```

### 7.5D: ExpressionFilter（反復応答防止）

**新規モジュール: `src/expression/ExpressionFilter.ts` (694行)**

LLMの応答を最終段階でフィルタリングする安全網：

**検出・修正する問題:**
| 問題 | 検出方法 | 対策 |
|------|---------|------|
| プロンプト復唱（「わたしは…somunia」等） | 正規表現パターンマッチ | 復唱部分を除去 |
| AIアシスタント口調（「何かお手伝い」等） | パターンマッチ + 敬語カウント | 該当文除去 + 敬語→カジュアル変換 |
| 内部メッセージ漏れ（「修正が必要」等） | パターンマッチ | 即座にフォールバック |
| 第三者視点（「この人に聞かれた」等） | パターンマッチ | 該当文除去 |
| 前回と同じ応答 | 文字Jaccard係数 | フォールバック |
| 自己紹介の累積繰り返し | カウンター（閾値:3回） | 自己紹介部分を除去 |
| 長すぎる応答 | 文字数チェック | 文境界で短縮 |
| 短すぎる/空の応答 | 文字数チェック | フォールバック |

**フォールバック応答生成:**
intent × emotion の2次元マッチングで、文脈に最も適した応答を選択。
テンプレートは全て「somuniaとして自然な発話」のみで構成。

## データフロー（handleVisitorMessage 改良版）

```
1. 訪問者到着検知 → VisitorMemory到着処理 + ExpressionFilter.resetConversation()
2. メッセージ分析 → ConversationEngine
3. VisitorMemoryでメッセージ処理
4. 連想ネットワーク活性化
5. SelfModelStateProvider構築
6. ContextBridge.buildResponseContext() → RichResponseContext
7. GradualAutonomy.decideStrategy() → 応答戦略

=== Phase 7.5 変更部分 ===
8.  ContextBridge.buildSeparatedPrompt() → {system, user}  ← 7.5A
9.  戦略に基づくプロンプト調整（パターンヒント等の統合）
10. LLM.expressResponseStructured(system, user) → 応答+メタデータ  ← 7.5B
11. ExpressionFilter.filter() → 品質チェック・修正  ← 7.5D
12. ContextBridge.validateResponse() → 二重チェック  ← 7.5C
13. ContextBridge.cleanResponse() → 最終クリーニング
14. ContextBridge.recordResponse() → 重複検出用記録

15. パターン抽出・品質フィードバック
```

## コード規模

| カテゴリ | 行数 |
|----------|------|
| 新規: ExpressionFilter | 694行 |
| 改修: ContextBridge (buildSeparatedPrompt, validateResponse) | +86行 |
| 改修: LLMInterface (構造化レスポンス) | +189行 |
| 改修: SoulEngine (パイプライン統合) | +92行 |
| 改修: types/index.ts (新型定義) | +54行 |
| **Phase 7.5 合計** | **~1,115行** |
| **プロジェクト全体** | **45,701行** |

## ログ問題→修正の対応

| Phase 7のログ問題 | Phase 7.5の修正 |
|---|---|
| 毎回「わたしは…somunia」 | 7.5A: system/user分離で復唱防止 + 7.5D: ExpressionFilterで検出・除去 |
| 「口調を柔らかく、修正が必要」が表示 | 7.5C: validateResponseが自然な発話をフォールバックに使用 |
| 質問に答えず状況を述べる | 7.5A: user部分に訪問者メッセージを明示 + 明確な応答指示 |
| 会話が噛み合わない | 7.5A+7.5B: 分離プロンプト + 構造化レスポンス |
| AI口調（「何かお手伝い」等） | 7.5D: ExpressionFilterが検出・除去・敬語変換 |
| 満足度31% | 7.5全体の改善効果 |

## ビルド・実行

```bash
npm install
npx tsc          # ビルド
node dist/index.js  # 実行
```

## 設計思想

Phase 7.5は「量」ではなく「質」の改善です。

Phase 7が構築した骨格（AssociativeNetwork, SelfModel, VisitorMemory, ContextBridge, PatternMemory, GradualAutonomy）はそのまま活用し、**LLMとの接点**（プロンプト構造とレスポンス処理）のみを精密に改修しています。

核心的な変更は3つ：
1. **分離プロンプト** — LLMが「設定」と「応答対象」を区別できるようにする
2. **多層フィルタリング** — ExpressionFilter + validateResponse の二重安全網
3. **安全なフォールバック** — 何が起きても、ユーザーには自然な発話のみが届く
