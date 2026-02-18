# Phase 7: 基盤刷新 (Infrastructure Revolution)

## 概要

Phase 7はsomuniaの「内部状態 → 外部表現」経路を根本的に刷新するアップデートです。

**核心的な問題:**
somuniaは36モジュール・40,000行超の精巧な内部アーキテクチャを持っていましたが、LLMに渡されるコンテキストは「感情: peace, 最近の思考: [...], ユーザーメッセージ: ...」程度の薄い情報でした。結果として:

- LLMが汎用的な応答を返してしまう
- 訪問者の名前を覚えられない
- 内部の活動（学習・創作・夢）が表現に反映されない
- somuniaの人格が安定しない

**Phase 7の解決策:**
6つの新モジュールによる「表現パイプライン」の構築。

## アーキテクチャ

```
[内部状態] → [StateExpression + SelfModel] → [ContextBridge] → [GradualAutonomy] → [応答]
     ↑              ↑                              ↑                    ↑
AssociativeNetwork  VisitorMemory           PatternMemoryEngine    LLM/Pattern選択
```

## 新規モジュール (6モジュール / 3,668行)

### 7A: AssociativeNetwork (653行)
**場所:** `src/association/AssociativeNetwork.ts`

グラフベースの連想記憶ネットワーク。概念をノードとして格納し、ノード間の関連性をエッジで表現。

- **ノードタイプ:** concept, emotion, person, place, event, action, abstract
- **関係タイプ:** association, cause_effect, similarity, part_of, temporal, emotional
- **活性化伝搬:** あるノードが活性化すると、関連ノードにも伝搬（減衰あり）
- **初期ノード:** somunia自身（「ワタシ」）、部屋、窓、音楽などの基本概念
- **動的成長:** 会話や学習から新しいノード・エッジを自動追加
- **自動淘汰:** 使用頻度の低いノードを定期的に削除

### 7B: SelfModel (377行)
**場所:** `src/self/SelfModel.ts`

somuniaが「自分自身を知っている」構造。全モジュールから自己認識を集約。

- **SelfSnapshot:** 感情状態、活動状態、思考、身体感覚を自然言語で集約
- **StateProvider:** 各モジュールの状態を統一インターフェースで取得
- **気分の自然言語化:** 23種類の感情を日本語の自然な表現に変換
- **活動の自然言語化:** 18種類の行動を「〜していた」形式に変換
- **経験の記録:** 重要な出来事を自己認識に組み込む

### 7C: VisitorMemorySystem (497行)
**場所:** `src/bridge/VisitorMemorySystem.ts`

訪問者を永続的に記憶するシステム。名前検出、事実抽出、関係性追跡。

- **名前検出:** 7種類のパターンで自動検出（「〇〇って呼んで」「名前は〇〇」「I'm X」等）
- **事実抽出:** 10種類のルールで会話から自動抽出（好き嫌い、趣味、仕事等）
- **コミュニケーションスタイル学習:** 敬語使用率、メッセージ長、感情表現頻度、語尾パターン
- **話したいことキュー:** somuniaから訪問者に伝えたいことの優先度管理
- **特別な記憶:** 深い会話や重要な瞬間の保存（重要度ソート）
- **最大50プロフィール、各100事実、200話題履歴**

### 7D: ContextBridge (618行)
**場所:** `src/bridge/ContextBridge.ts`

Phase 7の心臓部。全内部状態をLLMに渡す構造化プロンプトに変換。

**以前:**
```
「感情: peace, 最近の思考: [...], ユーザーメッセージ: ...」
```

**Phase 7:**
```
「わたしはsomunia。今は夜の8時、窓の外は雨。
 さっきまで本を読んでいたけど、誰か来たので中断した。
 気分は穏やかだけど少し寂しかった。
 この人は前に来てくれた○○さん。前は音楽の話をした。
 今日は学んだことを話したい。」
```

- **RichResponseContext:** 瞬間の文脈、訪問者の文脈、会話フローの文脈、応答ガイドラインを構造化
- **応答検証:** somuniaらしくない応答（長すぎる、敬語すぎる、第三者視点等）をフィルタリング
- **プロンプト構築:** 自然な日本語の1人称視点でLLMに指示

### 7E: PatternMemoryEngine (981行)
**場所:** `src/pattern/PatternMemoryEngine.ts`

応答パターンの蓄積・学習・マッチングシステム。

- **初期パターン:** 12種類の基本応答テンプレート（挨拶、感情共有、お別れ等）
- **状況マッチング:** インテント(30%)、感情(20%)、深度(15%)、時間帯(10%)、関係性(15%)、キーワード(10%)の6次元スコアリング
- **テンプレート変数:** `{visitorName}`, `{timeExpression}`, `{moodExpression}`等、文脈に応じて展開
- **パターン抽出:** LLMの成功した応答からテンプレートを自動生成
- **品質管理:** 満足度と成功率に基づく自然淘汰（低品質パターンの自動削除）
- **重複検知:** テンプレートの類似度と状況の重複度で重複を防止
- **最大500パターン保持**

### 7F: GradualAutonomy (542行)
**場所:** `src/autonomy/GradualAutonomy.ts`

パターン蓄積に応じてLLM依存を段階的に減らす制御システム。

**自律レベル:**
| レベル | 説明 | 遷移条件 |
|--------|------|----------|
| `full_llm` | 完全LLM依存（初期状態） | - |
| `llm_primary` | LLM主体 + パターンヒント | カバレッジ20%、パターン20個以上 |
| `hybrid` | パターン下書き + LLM仕上げ | カバレッジ40%、パターン80個以上 |
| `pattern_primary` | パターン主体 + LLM品質確認 | カバレッジ60%、パターン200個以上 |
| `autonomous` | パターンのみ（LLM不要） | カバレッジ80%、パターン400個以上 |

- **安全機構:** 品質低下検知で即座にレベルダウン
- **品質監査:** 定期的にLLMで応答品質をチェック
- **未知の状況:** 完全自律レベルでもパターンがない場合はLLMにフォールバック
- **手動制御:** デバッグ・テスト用のレベル直接設定

## 修正ファイル

### types/index.ts (+273行)
Phase 7の全型定義を追加:
- `AssocNode`, `AssocEdge`, `AssocNodeType`, `AssocRelation`
- `SelfSnapshot`
- `VisitorProfile`, `VisitorFact`
- `RichResponseContext`, `MomentContext`, `VisitorContext7`, `ConversationFlowContext`, `ResponseGuideline`
- `ResponsePattern`, `PatternSituation`
- `AutonomyLevel`, `AutonomyMetrics`

### SoulEngine.ts (+307行)
- Phase 7モジュールのインポート・初期化
- `handleVisitorMessage`の全面書き換え（Phase 7パイプライン統合）
- メインループにPhase 7の定期処理を追加（自律性評価、パターン淘汰、連想ネットワーク更新、SelfModelスナップショット、VisitorMemory永続化）
- TemplateVariables構築用のヘルパーメソッド群
- SelfModelStateProviderの構築
- 永続化モジュール登録（visitorMemory, patternMemory, associativeNetwork, autonomy）
- 訪問者離脱時のVisitorMemory処理

### LLMInterface.ts (+33行)
- `expressResponseWithRichPrompt`メソッドの追加（構造化プロンプト対応）

## データフロー（handleVisitorMessage）

```
1. 訪問者到着検知 → VisitorMemory到着処理 + 活動中断記録
2. メッセージ分析 → ConversationEngine + 関係性反映
3. VisitorMemoryでメッセージ処理（名前検出、事実抽出、スタイル学習）
4. 連想ネットワーク活性化（話題・感情から）
5. SelfModelStateProvider構築（全モジュールの状態集約）
6. ContextBridgeでRichResponseContext構築
7. PatternSituation構築 + TemplateVariables構築
8. GradualAutonomyで応答戦略決定
9. 戦略に基づく応答生成（パターンのみ or LLM+パターンヒント等）
10. ContextBridgeで応答検証 → 不適切な場合は修正
11. PatternMemoryEngineでパターン抽出・蓄積
12. GradualAutonomyに品質フィードバック
```

## コード規模

| カテゴリ | 行数 |
|----------|------|
| Phase 7 新規モジュール | 3,668行 |
| 既存ファイル修正 | ~580行 |
| **Phase 7 合計** | **~4,250行** |
| **プロジェクト全体** | **44,584行** |

## ビルド・実行

```bash
npm install
npx tsc          # ビルド
node dist/index.js  # 実行
```

## 設計思想

Phase 7は「LLMに人格を委ねる」から「LLMに完全な文脈を渡す」へのパラダイムシフトです。

- **即座の改善:** ContextBridgeにより、LLMが「somuniaとして」応答できる豊かな文脈を受け取る
- **長期的改善:** PatternMemoryEngineとGradualAutonomyにより、使うほどsomuniaの人格が安定し、最終的にはLLM無しでも応答できるようになる
- **安全性:** 品質低下を検知したら即座にLLMに戻す。未知の状況では常にLLMを使用
