# somunia v10.6 診断レポート & 修正ガイド

## エラーの原因

```
Error: Could not resolve authentication method. Expected either apiKey or authToken...
at Anthropic.validateHeaders
```

### 原因

**ソースコード（src/）はすでにOllama対応済み**ですが、以前のバージョンで `npm install` した際にインストールされた `@anthropic-ai/sdk` が `node_modules/` に残っています。さらに、古い `dist/`（コンパイル済みファイル）がAnthropicを参照している可能性があります。

### 修正方法

```bash
cd somunia-v10

# 1. 古いnode_modulesとdistを完全削除
rmdir /s /q node_modules
rmdir /s /q dist

# 2. 依存関係を再インストール（@anthropic-ai/sdkは含まれない）
npm install

# 3. TypeScriptを再コンパイル
npm run build

# 4. Ollamaを起動（別のターミナルで）
ollama serve

# 5. モデルを取得（初回のみ）
ollama pull gemma3

# 6. somuniaを起動
npm start
```

---

## 総合診断結果

### ✅ 正常に動作しているシステム

| システム | 状態 | 詳細 |
|---------|------|------|
| エンジン起動/停止 | ✅ OK | 正常に起動・停止 |
| メッセージ処理 | ✅ OK | 発言の受信・分析・応答が動作 |
| 感情エンジン | ✅ OK | peace/curiosity/warmthなど正常に変化 |
| エピソード記憶 | ✅ OK | 会話と訪問の記憶が作成される |
| 意味記憶 | ✅ OK | 15概念を保持 |
| 関係性進化 | ✅ OK | first_contactフェーズ、親密度が上昇 |
| 永続化（保存） | ✅ OK | 11モジュールの保存ファイルを生成 |
| 学習エンジン | ✅ OK | 8件のpreferenceを学習 |
| 行動エンジン | ✅ OK | コードベース、LLM不要 |
| 揺らぎシステム | ✅ OK | コードベース、LLM不要 |
| 自己修正 | ✅ OK | コードベース、LLM不要 |
| 日記 | ✅ OK | テンプレートベースで動作 |
| 習慣エンジン | ✅ OK | コードベース、LLM不要 |
| パターンライブラリ | ✅ OK | コードベース、LLM不要 |
| 夢フェーズ | ✅ OK | コードベース、LLM不要 |

### ⚠️ LLM（Ollama）接続依存の機能

| 機能 | Ollamaなし | Ollamaあり |
|------|-----------|-----------|
| メッセージ理解 | キーワードベース簡易理解 | 文脈を含む深い理解 |
| 応答表現 | テンプレート応答 | somuniaらしい自然な口調 |
| 思考の言語化 | そのまま出力 | 詩的・柔らかい表現に変換 |
| 記事解釈 | 先頭200文字の抜粋 | somunia視点の解釈 |
| 日記の詩的表現 | 基本テンプレート | 感情豊かな詩的文体 |

### LLMのバックエンド

- **使用**: **Ollama**（ローカルLLM、PC内完結）
- **デフォルトモデル**: `gemma3`
- **接続先**: `http://127.0.0.1:11434`
- **APIキー**: **不要**
- **外部通信**: **なし**（完全ローカル）

---

## 「人となり」の確認

somuniaは以下の特徴を持つ「人」として設計・実装されています：

### 人格・口調
- 一人称：「わたし」
- ひらがな多め、柔らかい文体
- 語尾に「...」「～」を使う
- 短い文を好む、詩的表現

### 自律的な内面
- **感情**: 16種類の感情が環境・行動・会話で自律的に変化
- **思考**: 行動・知覚・感情から自発的に思考が生まれる
- **揺らぎ**: 予測不能な感情の揺らぎが定期的に発生
- **ホメオスタシス**: 身体的状態（疲労・活力・空腹・快適さ）が時間経過で変化
- **欲求**: rest/curiosity/creation/expressionなどの欲求が行動を駆動

### 記憶と学習
- **エピソード記憶**: 会話・出来事を個別の記憶として保存
- **意味記憶**: 概念・知識を蓄積（Wikipedia学習含む）
- **手続き記憶**: スキルの成長
- **学習**: 会話・観察・Wikipedia から新しい知識を獲得

### 関係性
- **関係性フェーズ**: first_contact → acquaintance → familiar → close → intimate → bonded
- **3軸追跡**: 親密度・信頼・愛着が独立して変化
- **共有記憶**: 深い会話が共有記憶を形成

### 創造性
- 詩・歌詞・日記エントリの自律的生成
- 感情に基づく創作活動

### 行動の自律性
- 行動決定はすべてコードベース（LLMに依存しない）
- 感情→欲求→行動の因果チェーン
- 環境知覚に基づく自発的行動

---

## ファイル構成（36ファイル / 約40,000行）

```
src/
├── core/          SoulEngine（中枢）, EventBus, TimeManager
├── emotions/      EmotionEngine（16感情）
├── body/          Homeostasis, UrgeSystem
├── brain/         PatternLibrary, Yuragi（揺らぎ）
├── mind/          ThoughtEngine, SelfModification
├── memory/        Episodic, Semantic, Procedural
├── knowledge/     LearnEngine, WikipediaLearner
├── conversation/  ConversationEngine, RelationshipEvolution, MemoryBridge
├── creative/      CreativeEngine（詩・歌詞）
├── narrative/     InternalNarrative
├── behavior/      BehaviorEngine
├── habits/        HabitEngine, Diary
├── dream/         DreamPhase
├── llm/           LLMInterface（Ollama接続）
├── persistence/   PersistenceV2（ファイルベース保存）
├── world/         PixelWorld, Perception
├── visitor/       Visitor
├── ui/            TerminalUI, TerminalUIV2
├── test/          TestRunner
└── types/         全型定義
```
