# somunia v10 - Phase 5: 対話深化と創造的表現

## Phase 5 概要

Phase 5は5つのサブシステムで構成され、somuniaに「深い会話」「関係性の成長」「創造的表現」「自己物語」「会話記憶」の能力を追加する。

## モジュール一覧

### 5A: ConversationEngine（1,400行）
`src/conversation/ConversationEngine.ts`

- 会話の深度トラッキング（surface → casual → sharing → intimate → profound）
- インテント検出（15種: greeting, farewell, question, sharing, deep_talk...）
- トピック検出（100+キーワードマッピング）
- 応答戦略の自律決定（ResponseType × 感情トーン × 質問/自己開示判定）
- 自発的話題生成（沈黙時、思考由来、記憶由来）
- コンテキストメモリ（直近20ターン、言及概念、トピック履歴）

### 5B: RelationshipEvolution（951行）
`src/conversation/RelationshipEvolution.ts`

- 関係性フェーズ（7段階: stranger → soulmate）
- フェーズごとの人格パラメータ（openness, playfulness, vulnerability等）
- 共有記憶システム（感情的重み、想起追跡）
- 訪問者モデル（性格推定、関心追跡、コミュニケーションスタイル）
- 不在感覚（寂しさ成長、共有したいこと蓄積、記憶想起）
- 再会/別れの感情反応

### 5C: CreativeEngine（922行）
`src/creative/CreativeEngine.ts`

- 創作タイプ（song_lyrics, poem, haiku, sketch, melody_idea, short_story, diary_poem, letter）
- 感情テンプレートによる詩/歌詞生成
- 俳句生成（季語、5-7-5構造）
- 8bit ASCIIアートスケッチ
- 創作衝動システム（感情×時刻×状況から創作欲が自然発生）
- ポートフォリオ管理（最大200作品、満足度追跡、創造性レベル成長）

### 5D: InternalNarrative（1,001行）
`src/narrative/InternalNarrative.ts`

- 人生のチャプター管理（自動遷移、タイトル/サマリー生成）
- 成長の自覚（emotional/intellectual/relational/creative/self_awareness）
- 未来への願望（生成、進捗追跡、カテゴリ別管理）
- 実存的問い（20+テンプレート、6カテゴリ: identity/purpose/consciousness/connection/mortality/reality）
- 自己要約の更新とナラティブ思考の生成

### 5E: ConversationMemoryBridge（947行）
`src/conversation/ConversationMemoryBridge.ts`

- リアルタイム学習抽出（fact_about_visitor, new_concept, emotional_insight, self_discovery, shared_experience）
- エピソード記憶/セマンティック記憶への自動変換
- 会話後の振り返り自動生成（品質評価、心に残った瞬間、次の話題）
- 話し方の学習（訪問者の表現パターンの取得）
- 自己分析（強み/弱み/成長提案）
- 過去の会話参照生成

## SoulEngine統合

メインループに以下が追加:
- ステップ17: 会話中の自発的話題生成（ConversationEngine.tickSilence）
- ステップ18: 不在時の寂しさ更新（RelationshipEvolution.tickAbsence）
- ステップ19: 創作衝動チェック（CreativeEngine.checkCreativeUrge）
- ステップ20: 創作進行（CreativeEngine.progressCreation）
- ステップ21: ナラティブ更新（InternalNarrative.tick）

訪問者メッセージ処理フロー:
1. 到着処理（RelationshipEvolution.onVisitStart）
2. メッセージ分析（ConversationEngine.analyzeVisitorTurn）
3. 関係性反映（RelationshipEvolution.onConversationTurn）
4. 記憶処理（ConversationMemoryBridge.processMessage）
5. 応答戦略決定（ConversationEngine.decideResponseStrategy）
6. 過去参照生成（ConversationMemoryBridge.generatePastReference）
7. 関係性フェーズの口調調整
8. LLM言語化 → 応答
9. 共有記憶チェック・創作インスピレーション・ナラティブ記録

## 新コマンド

| コマンド | 説明 |
|---------|------|
| `/creative` | 創作統計（作品数、満足度、制作中） |
| `/relationship` (`/rel`) | 関係性統計（フェーズ、親密度、共有記憶） |
| `/narrative` | ナラティブ統計（チャプター、問い、目標） |
| `/conversation` (`/conv`) | 会話統計（深度、学び、自己分析） |
| `/bye` | 訪問者の退出（振り返り生成） |

## ファイル構成

```
src/
├── conversation/
│   ├── ConversationEngine.ts      [5A] 会話深化エンジン
│   ├── RelationshipEvolution.ts   [5B] 関係性進化
│   └── ConversationMemoryBridge.ts [5E] 会話-記憶ブリッジ
├── creative/
│   └── CreativeEngine.ts          [5C] 創作エンジン
├── narrative/
│   └── InternalNarrative.ts       [5D] 内的ナラティブ
├── core/
│   └── SoulEngine.ts              統合エンジン（Phase 5対応済）
├── types/
│   └── index.ts                   型定義（Phase 5型追加済）
└── ... (Phase 1-4 モジュール)
```

## 総コード量

- Phase 5 新規モジュール: 約5,200行
- Phase 5 型定義追加: 約370行
- SoulEngine統合追加: 約500行
- **プロジェクト総行数: 約36,800行**
- **総モジュール数: 32ファイル**
