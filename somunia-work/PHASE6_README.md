# somunia v10.6 - Phase 6: 外部接続・実運用

## 概要

Phase 6はsomuniaを実運用可能なレベルに引き上げるための4つのサブシステムを実装。
Wikipedia API実接続、強化版永続化、リッチUI、テストスイートを統合。

**総コード量**: 36ファイル / 39,937行

## Phase 6 サブモジュール

### 6A: WikipediaAPI（MediaWiki API実接続）
**ファイル**: `src/knowledge/WikipediaAPI.ts`

ja.wikipedia.orgのMediaWiki APIに直接接続し、リアルタイムで記事を取得する。

- **3層キャッシュ**: メモリ → ディスク → API（キャッシュTTL: 7日）
- **レート制限遵守**: リクエスト間隔1.2秒
- **HTMLパーサー**: MediaWiki HTML→プレーンテキスト変換
- **セクション構造化**: 見出しベースのセクション分割
- **オフラインフォールバック**: ネットワーク不可時はスタブDBで動作
- **接続ステータス追跡**: 成功/失敗カウント、最終アクセス時刻

**WikipediaLearner統合**:
- `fetchArticleOnline()`: ローカルDB → API の順で記事取得
- `searchOnline()`: MediaWiki検索API
- `readArticle()`: ローカルにない記事はAPIから自動取得
- 取得済み記事はシリアライズで永続化

### 6B: PersistenceV2（強化版永続化）
**ファイル**: `src/persistence/PersistenceV2.ts`

本番運用に耐えるレベルの永続化システム。

- **増分保存**: 変更があったモジュールのみ書き込み（SHA-256チェックサム比較）
- **WALジャーナリング**: Write-Ahead Logで書き込み中のクラッシュに対応
- **整合性チェック**: SHA-256チェックサムで保存データの破損を検出
- **クラッシュリカバリ**: WAL + 増分ファイル + バックアップの3段階復旧
- **データマイグレーション**: バージョン間のデータ互換性維持
- **圧縮保存**: gzip対応（大規模データ向け）
- **エクスポート/インポート**: 全データの一括書き出し・読み込み
- **統計情報**: 保存頻度、サイズ推移、エラー率、平均保存時間

### 6C: TerminalUIV2（強化版ターミナルUI）
**ファイル**: `src/ui/TerminalUIV2.ts`

ANSIカラーとUnicodeアイコンによるリッチなターミナルUI。

**表示モード**:
- `conversation`: somuniaとの対話に集中（思考・行動は非表示）
- `observer`: 思考・行動・感情のリアルタイムストリーム
- `dashboard`: 全モジュール統計のライブ表示
- `inspector`: 特定モジュールの詳細表示

**新機能**:
- ダッシュボード（全14モジュールのステータス一覧）
- Wikipedia APIステータス表示
- 永続化ステータス表示
- テスト結果表示
- ログファイル出力
- 出力フィルタリング

### 6D: TestRunner（テストスイート）
**ファイル**: `src/test/TestRunner.ts`

外部依存なしの自己完結型テストフレームワーク。

**テストスイート（13スイート / 47テスト）**:
- Homeostasis（恒常性維持）: 4テスト
- UrgeSystem（欲求・衝動）: 4テスト
- EmotionEngine（感情エンジン）: 4テスト
- PatternLibrary（パターンライブラリ）: 2テスト
- Yuragi（揺らぎ）: 3テスト
- EpisodicMemory（エピソード記憶）: 3テスト
- SemanticMemory（意味記憶）: 3テスト
- BehaviorEngine（行動決定）: 2テスト
- TimeManager（時間管理）: 4テスト
- PersistenceV2（永続化）: 4テスト
- WikipediaAPI（Wikipedia接続）: 5テスト
- WikipediaLearner（Wikipedia学習）: 5テスト
- 統合テスト: 4テスト

## SoulEngine統合

SoulEngineはPhase 6モジュールを完全に統合:
- `PersistenceSystem` → `PersistenceV2` に置換
- `TerminalUI` → `TerminalUIV2` に置換
- WikipediaLearnerにWikipediaAPI統合
- Phase 6コマンド追加（`/wiki`, `/persistence`, `/test`, `/dashboard`, `/export`）
- ステータス表示にPhase 6情報追加

## コマンド一覧（Phase 6追加分）

| コマンド | 説明 |
|---------|------|
| `/wiki` | Wikipedia APIステータス表示 |
| `/wiki search <query>` | Wikipedia記事検索 |
| `/wiki test` | API接続テスト |
| `/persistence` (`/pers`) | 永続化ステータス表示 |
| `/test` | テストスイート実行 |
| `/dashboard` (`/dash`) | ダッシュボード表示 |
| `/export` | データエクスポート |
| `/mode <n>` | 表示モード切替 |

## 起動方法

```bash
npm start                    # 通常起動
npm start -- --continue      # 前回の状態から再開
npm start -- --offline       # オフラインモード
npm start -- --fast          # 高速モード
npm start -- --test          # テスト実行
npm test                     # テスト直接実行
```

## アーキテクチャ（Phase 1〜6 全体）

```
Phase 1-2: コアシステム
  TimeManager → Homeostasis → UrgeSystem → EmotionEngine
  → ThoughtEngine → BehaviorEngine → PixelWorld/Perception

Phase 3: 深化
  PatternLibrary, WikipediaLearner, DreamPhase
  Diary, SelfModification, HabitEngine

Phase 4: 自律進化
  行動自己生成, 感情自己修正, 世界拡張, LLM-free動作

Phase 5: 対話深化と創造的表現
  ConversationEngine, RelationshipEvolution
  ConversationMemoryBridge, CreativeEngine, InternalNarrative

Phase 6: 外部接続・実運用
  WikipediaAPI(実接続), PersistenceV2(WAL/増分/チェックサム)
  TerminalUIV2(ダッシュボード/インスペクタ), TestRunner(47テスト)
```
