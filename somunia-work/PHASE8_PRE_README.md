# Phase 8 Pre: SQLiteデータベース基盤

## 概要

somuniaの全データ永続化をJSONファイルからSQLiteデータベースに移行。
SemanticBrain（Phase 8本体）に向けた基盤整備。

**バージョン**: v10.8.0
**新規コード**: 2,430行（3ファイル）
**プロジェクト合計**: 48,129行（46ファイル）

## 新規ファイル

| ファイル | 行数 | 役割 |
|---------|------|------|
| `src/persistence/DatabaseManager.ts` | 1,346 | SQLiteデータベース管理・全テーブル定義 |
| `src/persistence/JsonToSqliteMigrator.ts` | 599 | 既存JSON → SQLite自動マイグレーション |
| `src/persistence/PersistenceV3.ts` | 485 | SoulEngine互換の永続化アダプター |

## テーブル構成（28テーブル + 3 FTS）

### 正規化テーブル（個別クエリ対応）

**連想ネットワーク（将来のSemanticBrain基盤）**
- `assoc_nodes` — ノード（概念・感情・人物・場所等）
- `assoc_edges` — ノード間の関連（重み付き有向エッジ）

**記憶システム**
- `episodic_memories` — エピソード記憶（体験の記録）
- `semantic_memories` — 意味記憶（知識・概念）
- `concept_relations` — 概念間の関係
- `procedural_memories` — 手続き記憶（スキル）

**訪問者管理**
- `visitors` — 訪問者プロフィール
- `visitor_facts` — 訪問者について知っている事実
- `visitor_topics` — 話題履歴
- `visitor_emotions` — 感情的結びつき
- `visitor_special_memories` — 特別な思い出
- `visitor_things_to_tell` — 話したいことリスト

**会話**
- `conversations` — 会話セッション
- `messages` — 個別メッセージ（発話・内部状態記録）
- `visit_records` — 訪問記録

**パターン学習**
- `response_patterns` — 応答パターン（テンプレート+状況条件）

**生活・成長**
- `diary_entries` — 日記エントリ
- `diary_events` — 日記内のイベント
- `creative_works` — 創作物（詩・歌）
- `dreams` — 夢の記録
- `dream_fragments` — 夢の断片
- `learning_sessions` — 学習セッション
- `self_modifications` — 自己変容記録
- `habits` — 習慣
- `emotion_history` — 感情推移の時系列記録

**システム**
- `module_states` — モジュール状態（JSON BLOB保存）
- `system_state` — システムキーバリュー
- `schema_version` — スキーマバージョン管理

### 全文検索（FTS5）
- `fts_memories` — 記憶のテキスト検索
- `fts_messages` — メッセージのテキスト検索
- `fts_concepts` — 概念のテキスト検索

## アーキテクチャ

```
既存モジュール（34個）
  │
  │ toJSON() / fromJSON()（互換性維持）
  ↓
PersistenceV3（アダプター）
  │
  ├── 正規化アダプター → DatabaseManager → 個別テーブル
  │   （将来、モジュールごとに段階的に移行可能）
  │
  └── BLOBアダプター → DatabaseManager → module_statesテーブル
      （現時点では全モジュールがこちら）
```

### 自動マイグレーション

初回起動時、`somunia-data/state.json`が存在すると自動的にSQLiteに移行:

1. state.jsonを読み込み
2. 各モジュールのデータを適切なテーブルに分配
3. 成功マーカー（`.migrated_to_sqlite`）を作成
4. state.jsonを`.backup`にバックアップ
5. 以降はSQLiteのみ使用

### データベース最適化

- **WAL mode**: 読み書きの並列性を向上
- **64MB cache**: メモリ上でのクエリ高速化
- **FTS5**: 日本語テキストの全文検索対応
- **インデックス**: 全テーブルの検索頻度の高いカラムにインデックス

## 既存コードへの変更

| ファイル | 変更内容 |
|---------|---------|
| `src/core/SoulEngine.ts` | PersistenceV2 → V3に差し替え |
| `src/index.ts` | V3用設定に更新 |
| `package.json` | better-sqlite3追加、v10.8.0 |

**互換性**: SoulEngineの`registerModule()`と`save()`/`load()`のインターフェースは完全互換。
既存モジュールのコードは一切変更不要。

## なぜSQLiteか

1. **スケーラビリティ**: SemanticBrainのノード数は数万〜数十万になる。JSONでは読み書きが遅くなる
2. **クエリ性能**: 「活性度の高い上位20ノードを取得」がO(1)で可能（インデックス）
3. **全文検索**: 記憶やメッセージから関連情報を高速検索
4. **トランザクション**: WAL modeで書き込み中の読み取りがブロックされない
5. **データ整合性**: 外部キー制約で関連データの一貫性を保証
6. **段階的移行**: 各モジュールを1つずつ正規化テーブルに移行できる

## 次のステップ

この基盤の上に、Phase 8本体でSemanticBrainを構築:

- **Phase 8A**: Gemini APIバックエンド追加
- **Phase 8B**: SemanticBrain基盤（ノード拡張、活性化伝搬改良）
- **Phase 8C**: NeuralLearner（Gemini応答のネットワーク取り込み）
- **Phase 8D**: 正規化アダプター実装（各モジュールのsaveToDB/loadFromDB）

## インストール

```bash
cd somunia-v10.8
npm install
npx tsc
node dist/index.js
```

新規依存: `better-sqlite3`（ネイティブSQLiteバインディング）
※ ビルドにC++コンパイラが必要（node-gypが自動処理）
