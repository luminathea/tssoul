"use strict";
/**
 * DatabaseManager - Phase 8 Pre: SQLiteデータベース管理
 *
 * somuniaの全データをSQLiteで永続化する基盤。
 *
 * 設計方針:
 * - 頻繁に検索・成長するデータ → 正規化テーブル（ノード、記憶、会話）
 * - モジュール全体として読み書きするデータ → JSON BLOBテーブル
 * - 既存のJSON永続化からのマイグレーション対応
 * - WAL mode + PRAGMA最適化で高速化
 *
 * テーブル分類:
 * [正規化] assoc_nodes, assoc_edges, episodic_memories, semantic_memories,
 *          procedural_memories, concept_relations, visitors, visitor_facts,
 *          visitor_topics, visitor_emotions, visitor_special_memories,
 *          conversations, messages, visit_records, response_patterns,
 *          pattern_situations, diary_entries, diary_events, creative_works,
 *          dreams, dream_fragments, learning_sessions, self_modifications,
 *          habits, emotion_history
 *
 * [BLOB]   module_states（残りのモジュール全て）
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseManager = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const DEFAULT_DB_CONFIG = {
    dbPath: './somunia-data/somunia.db',
    walMode: true,
    verbose: false,
    maxBackups: 5,
};
// ============================================================
// DatabaseManager
// ============================================================
class DatabaseManager {
    db;
    config;
    initialized = false;
    constructor(config = {}) {
        this.config = { ...DEFAULT_DB_CONFIG, ...config };
        // ディレクトリ確保
        const dir = path.dirname(this.config.dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        // データベース接続
        this.db = new better_sqlite3_1.default(this.config.dbPath, {
            verbose: this.config.verbose ? (msg) => console.log(`[DB] ${msg}`) : undefined,
        });
        // PRAGMA設定
        this.configurePragmas();
        // スキーマ初期化
        this.initializeSchema();
        this.initialized = true;
        console.log(`[DatabaseManager] ✓ 初期化完了 (${this.config.dbPath})`);
    }
    // ============================================================
    // PRAGMA設定
    // ============================================================
    configurePragmas() {
        if (this.config.walMode) {
            this.db.pragma('journal_mode = WAL');
        }
        this.db.pragma('synchronous = NORMAL');
        this.db.pragma('cache_size = -64000'); // 64MB cache
        this.db.pragma('foreign_keys = ON');
        this.db.pragma('temp_store = MEMORY');
        this.db.pragma('mmap_size = 268435456'); // 256MB mmap
    }
    // ============================================================
    // スキーマ定義
    // ============================================================
    initializeSchema() {
        const migrations = this.getSchemas();
        // マイグレーションバージョン管理テーブル
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        description TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
        const currentVersion = this.getCurrentSchemaVersion();
        // 未適用のマイグレーションを実行
        for (const migration of migrations) {
            if (migration.version > currentVersion) {
                console.log(`[DatabaseManager] マイグレーション適用: v${migration.version} - ${migration.description}`);
                const applyMigration = this.db.transaction(() => {
                    for (const sql of migration.up) {
                        this.db.exec(sql);
                    }
                    this.db.prepare('INSERT INTO schema_version (version, description) VALUES (?, ?)').run(migration.version, migration.description);
                });
                applyMigration();
            }
        }
    }
    getCurrentSchemaVersion() {
        try {
            const row = this.db.prepare('SELECT MAX(version) as version FROM schema_version').get();
            return row?.version ?? 0;
        }
        catch {
            return 0;
        }
    }
    getSchemas() {
        return [
            // ============================================================
            // v1: 基本テーブル群
            // ============================================================
            {
                version: 1,
                description: '基本テーブル群の作成',
                up: [
                    // --- 連想ネットワーク（将来のSemanticBrain基盤） ---
                    `CREATE TABLE IF NOT EXISTS assoc_nodes (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            label TEXT NOT NULL,
            activation REAL NOT NULL DEFAULT 0.0,
            last_activated INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL DEFAULT 0,
            use_count INTEGER NOT NULL DEFAULT 0,
            emotional_color TEXT,
            meta TEXT NOT NULL DEFAULT '{}',
            UNIQUE(type, label)
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_assoc_nodes_type ON assoc_nodes(type)`,
                    `CREATE INDEX IF NOT EXISTS idx_assoc_nodes_label ON assoc_nodes(label)`,
                    `CREATE INDEX IF NOT EXISTS idx_assoc_nodes_activation ON assoc_nodes(activation DESC)`,
                    `CREATE INDEX IF NOT EXISTS idx_assoc_nodes_emotional ON assoc_nodes(emotional_color)`,
                    `CREATE TABLE IF NOT EXISTS assoc_edges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_id TEXT NOT NULL,
            to_id TEXT NOT NULL,
            weight REAL NOT NULL DEFAULT 0.5,
            relation TEXT NOT NULL,
            last_used INTEGER NOT NULL DEFAULT 0,
            use_count INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (from_id) REFERENCES assoc_nodes(id) ON DELETE CASCADE,
            FOREIGN KEY (to_id) REFERENCES assoc_nodes(id) ON DELETE CASCADE,
            UNIQUE(from_id, to_id, relation)
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_assoc_edges_from ON assoc_edges(from_id)`,
                    `CREATE INDEX IF NOT EXISTS idx_assoc_edges_to ON assoc_edges(to_id)`,
                    `CREATE INDEX IF NOT EXISTS idx_assoc_edges_weight ON assoc_edges(weight DESC)`,
                    `CREATE INDEX IF NOT EXISTS idx_assoc_edges_relation ON assoc_edges(relation)`,
                    // --- エピソード記憶 ---
                    `CREATE TABLE IF NOT EXISTS episodic_memories (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            summary TEXT NOT NULL DEFAULT '',
            timestamp INTEGER NOT NULL,
            duration INTEGER NOT NULL DEFAULT 0,
            emotional_tags TEXT NOT NULL DEFAULT '[]',
            emotional_intensity REAL NOT NULL DEFAULT 0.0,
            importance REAL NOT NULL DEFAULT 0.5,
            related_memories TEXT NOT NULL DEFAULT '[]',
            related_concepts TEXT NOT NULL DEFAULT '[]',
            recall_count INTEGER NOT NULL DEFAULT 0,
            last_recalled INTEGER,
            retention_strength REAL NOT NULL DEFAULT 1.0
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_episodic_timestamp ON episodic_memories(timestamp DESC)`,
                    `CREATE INDEX IF NOT EXISTS idx_episodic_importance ON episodic_memories(importance DESC)`,
                    `CREATE INDEX IF NOT EXISTS idx_episodic_retention ON episodic_memories(retention_strength)`,
                    // --- 意味記憶 ---
                    `CREATE TABLE IF NOT EXISTS semantic_memories (
            id TEXT PRIMARY KEY,
            concept TEXT NOT NULL UNIQUE,
            definition TEXT NOT NULL DEFAULT '',
            source TEXT NOT NULL DEFAULT 'initial',
            learned_at INTEGER NOT NULL DEFAULT 0,
            comprehension REAL NOT NULL DEFAULT 0.5,
            interest_level REAL NOT NULL DEFAULT 0.5,
            use_count INTEGER NOT NULL DEFAULT 0,
            last_used INTEGER
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_semantic_concept ON semantic_memories(concept)`,
                    `CREATE INDEX IF NOT EXISTS idx_semantic_source ON semantic_memories(source)`,
                    `CREATE INDEX IF NOT EXISTS idx_semantic_interest ON semantic_memories(interest_level DESC)`,
                    // --- 概念関係 ---
                    `CREATE TABLE IF NOT EXISTS concept_relations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            memory_id TEXT NOT NULL,
            related_concept TEXT NOT NULL,
            relation_type TEXT NOT NULL,
            strength REAL NOT NULL DEFAULT 0.5,
            FOREIGN KEY (memory_id) REFERENCES semantic_memories(id) ON DELETE CASCADE
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_concept_rel_memory ON concept_relations(memory_id)`,
                    // --- 手続き記憶 ---
                    `CREATE TABLE IF NOT EXISTS procedural_memories (
            id TEXT PRIMARY KEY,
            skill TEXT NOT NULL UNIQUE,
            steps TEXT NOT NULL DEFAULT '[]',
            proficiency REAL NOT NULL DEFAULT 0.0,
            practice_count INTEGER NOT NULL DEFAULT 0,
            last_executed INTEGER,
            automatization REAL NOT NULL DEFAULT 0.0
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_procedural_skill ON procedural_memories(skill)`,
                    `CREATE INDEX IF NOT EXISTS idx_procedural_proficiency ON procedural_memories(proficiency DESC)`,
                    // --- 訪問者プロフィール ---
                    `CREATE TABLE IF NOT EXISTS visitors (
            id TEXT PRIMARY KEY,
            name TEXT,
            nickname TEXT,
            call_name TEXT,
            first_visit_at INTEGER NOT NULL,
            last_visit_at INTEGER NOT NULL,
            visit_count INTEGER NOT NULL DEFAULT 0,
            communication_style TEXT NOT NULL DEFAULT '{}',
            is_current INTEGER NOT NULL DEFAULT 0
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_visitors_name ON visitors(name)`,
                    `CREATE INDEX IF NOT EXISTS idx_visitors_last_visit ON visitors(last_visit_at DESC)`,
                    `CREATE INDEX IF NOT EXISTS idx_visitors_current ON visitors(is_current)`,
                    // --- 訪問者に関する事実 ---
                    `CREATE TABLE IF NOT EXISTS visitor_facts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            visitor_id TEXT NOT NULL,
            category TEXT NOT NULL,
            content TEXT NOT NULL,
            confidence REAL NOT NULL DEFAULT 0.5,
            learned_at INTEGER NOT NULL,
            source TEXT NOT NULL DEFAULT 'conversation',
            FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_visitor_facts_visitor ON visitor_facts(visitor_id)`,
                    `CREATE INDEX IF NOT EXISTS idx_visitor_facts_category ON visitor_facts(category)`,
                    // --- 訪問者との話題履歴 ---
                    `CREATE TABLE IF NOT EXISTS visitor_topics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            visitor_id TEXT NOT NULL,
            topic TEXT NOT NULL,
            discussed_at INTEGER NOT NULL,
            depth TEXT NOT NULL DEFAULT 'surface',
            FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_visitor_topics_visitor ON visitor_topics(visitor_id)`,
                    // --- 訪問者との感情的な結びつき ---
                    `CREATE TABLE IF NOT EXISTS visitor_emotions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            visitor_id TEXT NOT NULL,
            emotion TEXT NOT NULL,
            reason TEXT NOT NULL DEFAULT '',
            strength REAL NOT NULL DEFAULT 0.5,
            FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_visitor_emotions_visitor ON visitor_emotions(visitor_id)`,
                    // --- 訪問者との特別な思い出 ---
                    `CREATE TABLE IF NOT EXISTS visitor_special_memories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            visitor_id TEXT NOT NULL,
            content TEXT NOT NULL,
            emotion TEXT NOT NULL,
            importance REAL NOT NULL DEFAULT 0.5,
            timestamp INTEGER NOT NULL,
            FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_visitor_memories_visitor ON visitor_special_memories(visitor_id)`,
                    // --- 訪問者に話したいこと ---
                    `CREATE TABLE IF NOT EXISTS visitor_things_to_tell (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            visitor_id TEXT NOT NULL,
            content TEXT NOT NULL,
            added_at INTEGER NOT NULL,
            priority REAL NOT NULL DEFAULT 0.5,
            told INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_visitor_tell_visitor ON visitor_things_to_tell(visitor_id)`,
                    // --- 会話 ---
                    `CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            visitor_id TEXT,
            started_at INTEGER NOT NULL,
            ended_at INTEGER,
            mood TEXT NOT NULL DEFAULT 'casual',
            topics TEXT NOT NULL DEFAULT '[]',
            message_count INTEGER NOT NULL DEFAULT 0,
            avg_satisfaction REAL NOT NULL DEFAULT 0.0,
            summary TEXT,
            FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE SET NULL
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_conversations_visitor ON conversations(visitor_id)`,
                    `CREATE INDEX IF NOT EXISTS idx_conversations_started ON conversations(started_at DESC)`,
                    // --- メッセージ ---
                    `CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            speaker TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            emotional_context TEXT,
            thought_before TEXT,
            emotion_during TEXT,
            satisfaction_after REAL,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)`,
                    `CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC)`,
                    `CREATE INDEX IF NOT EXISTS idx_messages_speaker ON messages(speaker)`,
                    // --- 訪問記録 ---
                    `CREATE TABLE IF NOT EXISTS visit_records (
            id TEXT PRIMARY KEY,
            visitor_id TEXT,
            started_at INTEGER NOT NULL,
            ended_at INTEGER NOT NULL,
            message_count INTEGER NOT NULL DEFAULT 0,
            highlights TEXT NOT NULL DEFAULT '[]',
            overall_feeling TEXT NOT NULL DEFAULT 'peace',
            FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE SET NULL
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_visit_records_visitor ON visit_records(visitor_id)`,
                    `CREATE INDEX IF NOT EXISTS idx_visit_records_time ON visit_records(started_at DESC)`,
                    // --- 応答パターン ---
                    `CREATE TABLE IF NOT EXISTS response_patterns (
            id TEXT PRIMARY KEY,
            template TEXT NOT NULL,
            success_count INTEGER NOT NULL DEFAULT 0,
            use_count INTEGER NOT NULL DEFAULT 0,
            avg_satisfaction REAL NOT NULL DEFAULT 0.0,
            last_used INTEGER NOT NULL DEFAULT 0,
            origin TEXT NOT NULL DEFAULT 'extracted',
            emotion_tags TEXT NOT NULL DEFAULT '[]',
            situation_intents TEXT NOT NULL DEFAULT '[]',
            situation_emotions TEXT NOT NULL DEFAULT '[]',
            situation_depths TEXT NOT NULL DEFAULT '[]',
            situation_times TEXT NOT NULL DEFAULT '[]',
            situation_phases TEXT NOT NULL DEFAULT '[]',
            situation_keywords TEXT NOT NULL DEFAULT '[]'
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_patterns_origin ON response_patterns(origin)`,
                    `CREATE INDEX IF NOT EXISTS idx_patterns_satisfaction ON response_patterns(avg_satisfaction DESC)`,
                    `CREATE INDEX IF NOT EXISTS idx_patterns_use ON response_patterns(use_count DESC)`,
                    // --- 日記 ---
                    `CREATE TABLE IF NOT EXISTS diary_entries (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            content TEXT NOT NULL,
            mood TEXT NOT NULL DEFAULT 'peace',
            mood_intensity REAL NOT NULL DEFAULT 0.5,
            weather TEXT,
            day_number INTEGER NOT NULL DEFAULT 1,
            created_at INTEGER NOT NULL
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_diary_date ON diary_entries(date)`,
                    `CREATE INDEX IF NOT EXISTS idx_diary_day ON diary_entries(day_number DESC)`,
                    // --- 日記イベント ---
                    `CREATE TABLE IF NOT EXISTS diary_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_id TEXT NOT NULL,
            time TEXT NOT NULL,
            description TEXT NOT NULL,
            significance REAL NOT NULL DEFAULT 0.5,
            emotion TEXT,
            FOREIGN KEY (entry_id) REFERENCES diary_entries(id) ON DELETE CASCADE
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_diary_events_entry ON diary_events(entry_id)`,
                    // --- 創作物 ---
                    `CREATE TABLE IF NOT EXISTS creative_works (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            title TEXT NOT NULL DEFAULT '',
            content TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            emotion_at_creation TEXT,
            inspiration TEXT,
            quality_self_rating REAL,
            tags TEXT NOT NULL DEFAULT '[]'
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_creative_type ON creative_works(type)`,
                    `CREATE INDEX IF NOT EXISTS idx_creative_created ON creative_works(created_at DESC)`,
                    // --- 夢 ---
                    `CREATE TABLE IF NOT EXISTS dreams (
            id TEXT PRIMARY KEY,
            phase TEXT NOT NULL,
            content TEXT NOT NULL DEFAULT '',
            themes TEXT NOT NULL DEFAULT '[]',
            emotional_tone TEXT,
            vividness REAL NOT NULL DEFAULT 0.5,
            started_at INTEGER NOT NULL,
            ended_at INTEGER,
            memories_consolidated INTEGER NOT NULL DEFAULT 0
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_dreams_started ON dreams(started_at DESC)`,
                    // --- 夢の断片 ---
                    `CREATE TABLE IF NOT EXISTS dream_fragments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dream_id TEXT NOT NULL,
            content TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'image',
            emotion TEXT,
            source_memory_id TEXT,
            FOREIGN KEY (dream_id) REFERENCES dreams(id) ON DELETE CASCADE
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_dream_fragments_dream ON dream_fragments(dream_id)`,
                    // --- 学習セッション ---
                    `CREATE TABLE IF NOT EXISTS learning_sessions (
            id TEXT PRIMARY KEY,
            topic TEXT NOT NULL,
            source TEXT NOT NULL DEFAULT 'wikipedia',
            content_summary TEXT NOT NULL DEFAULT '',
            learned_at INTEGER NOT NULL,
            comprehension REAL NOT NULL DEFAULT 0.5,
            interest_level REAL NOT NULL DEFAULT 0.5,
            concepts_learned TEXT NOT NULL DEFAULT '[]',
            related_searches TEXT NOT NULL DEFAULT '[]'
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_learning_topic ON learning_sessions(topic)`,
                    `CREATE INDEX IF NOT EXISTS idx_learning_source ON learning_sessions(source)`,
                    // --- 自己変容記録 ---
                    `CREATE TABLE IF NOT EXISTS self_modifications (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            before_state TEXT NOT NULL DEFAULT '',
            after_state TEXT NOT NULL DEFAULT '',
            reason TEXT NOT NULL DEFAULT '',
            trigger TEXT NOT NULL DEFAULT '',
            impact REAL NOT NULL DEFAULT 0.0,
            timestamp INTEGER NOT NULL,
            reverted INTEGER NOT NULL DEFAULT 0
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_self_mod_type ON self_modifications(type)`,
                    `CREATE INDEX IF NOT EXISTS idx_self_mod_time ON self_modifications(timestamp DESC)`,
                    // --- 習慣 ---
                    `CREATE TABLE IF NOT EXISTS habits (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            trigger_type TEXT NOT NULL DEFAULT 'time',
            trigger_condition TEXT NOT NULL DEFAULT '{}',
            actions TEXT NOT NULL DEFAULT '[]',
            frequency REAL NOT NULL DEFAULT 0.0,
            strength REAL NOT NULL DEFAULT 0.0,
            last_executed INTEGER,
            execution_count INTEGER NOT NULL DEFAULT 0,
            satisfaction_avg REAL NOT NULL DEFAULT 0.5,
            active INTEGER NOT NULL DEFAULT 1
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_habits_active ON habits(active)`,
                    `CREATE INDEX IF NOT EXISTS idx_habits_strength ON habits(strength DESC)`,
                    // --- 感情履歴 ---
                    `CREATE TABLE IF NOT EXISTS emotion_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tick INTEGER NOT NULL,
            dominant_emotion TEXT NOT NULL,
            valence REAL NOT NULL DEFAULT 0.0,
            arousal REAL NOT NULL DEFAULT 0.5,
            emotion_vector TEXT NOT NULL DEFAULT '{}',
            trigger TEXT,
            timestamp TEXT NOT NULL DEFAULT (datetime('now'))
          )`,
                    `CREATE INDEX IF NOT EXISTS idx_emotion_tick ON emotion_history(tick DESC)`,
                    `CREATE INDEX IF NOT EXISTS idx_emotion_dominant ON emotion_history(dominant_emotion)`,
                    // --- モジュール状態（JSONブロブ保存） ---
                    `CREATE TABLE IF NOT EXISTS module_states (
            module_name TEXT PRIMARY KEY,
            state TEXT NOT NULL DEFAULT '{}',
            checksum TEXT NOT NULL DEFAULT '',
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            size_bytes INTEGER NOT NULL DEFAULT 0
          )`,
                    // --- システム状態 ---
                    `CREATE TABLE IF NOT EXISTS system_state (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
          )`,
                    // --- 全文検索用FTS5テーブル ---
                    `CREATE VIRTUAL TABLE IF NOT EXISTS fts_memories USING fts5(
            memory_id,
            content,
            summary,
            type,
            tokenize='unicode61'
          )`,
                    `CREATE VIRTUAL TABLE IF NOT EXISTS fts_messages USING fts5(
            message_id,
            content,
            speaker,
            tokenize='unicode61'
          )`,
                    `CREATE VIRTUAL TABLE IF NOT EXISTS fts_concepts USING fts5(
            concept,
            definition,
            tokenize='unicode61'
          )`,
                ],
            },
        ];
    }
    // ============================================================
    // トランザクション
    // ============================================================
    transaction(fn) {
        return this.db.transaction(fn)();
    }
    // ============================================================
    // 汎用クエリメソッド
    // ============================================================
    run(sql, ...params) {
        return this.db.prepare(sql).run(...params);
    }
    get(sql, ...params) {
        return this.db.prepare(sql).get(...params);
    }
    all(sql, ...params) {
        return this.db.prepare(sql).all(...params);
    }
    // ============================================================
    // 連想ネットワーク操作
    // ============================================================
    /** ノードを追加または更新 */
    upsertNode(node) {
        this.db.prepare(`
      INSERT INTO assoc_nodes (id, type, label, activation, last_activated, created_at, use_count, emotional_color, meta)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        activation = excluded.activation,
        last_activated = excluded.last_activated,
        use_count = excluded.use_count,
        emotional_color = excluded.emotional_color,
        meta = excluded.meta
    `).run(node.id, node.type, node.label, node.activation ?? 0, node.lastActivated ?? 0, node.createdAt ?? 0, node.useCount ?? 0, node.emotionalColor ?? null, JSON.stringify(node.meta ?? {}));
    }
    /** エッジを追加または更新 */
    upsertEdge(edge) {
        this.db.prepare(`
      INSERT INTO assoc_edges (from_id, to_id, weight, relation, last_used, use_count)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(from_id, to_id, relation) DO UPDATE SET
        weight = excluded.weight,
        last_used = excluded.last_used,
        use_count = excluded.use_count
    `).run(edge.fromId, edge.toId, edge.weight, edge.relation, edge.lastUsed ?? 0, edge.useCount ?? 0);
    }
    /** ノードIDで隣接ノードを取得 */
    getAdjacentNodes(nodeId, minWeight = 0.01) {
        return this.all(`
      SELECT n.id as node_id, n.label, n.type, e.weight, e.relation, n.activation, n.emotional_color
      FROM assoc_edges e
      JOIN assoc_nodes n ON (
        CASE WHEN e.from_id = ? THEN e.to_id ELSE e.from_id END = n.id
      )
      WHERE (e.from_id = ? OR e.to_id = ?) AND e.weight >= ?
      ORDER BY e.weight DESC
    `, nodeId, nodeId, nodeId, minWeight);
    }
    /** ラベルでノード検索 */
    findNodeByLabel(label) {
        return this.get('SELECT * FROM assoc_nodes WHERE label = ?', label);
    }
    /** タイプでノード一覧取得 */
    getNodesByType(type) {
        return this.all('SELECT * FROM assoc_nodes WHERE type = ?', type);
    }
    /** 活性度上位のノードを取得 */
    getActiveNodes(limit = 20) {
        return this.all('SELECT * FROM assoc_nodes WHERE activation > 0.01 ORDER BY activation DESC LIMIT ?', limit);
    }
    /** 全ノード数 */
    getNodeCount() {
        const row = this.get('SELECT COUNT(*) as count FROM assoc_nodes');
        return row?.count ?? 0;
    }
    /** 全エッジ数 */
    getEdgeCount() {
        const row = this.get('SELECT COUNT(*) as count FROM assoc_edges');
        return row?.count ?? 0;
    }
    // ============================================================
    // エピソード記憶操作
    // ============================================================
    saveEpisodicMemory(memory) {
        this.db.prepare(`
      INSERT OR REPLACE INTO episodic_memories
      (id, content, summary, timestamp, duration, emotional_tags, emotional_intensity,
       importance, related_memories, related_concepts, recall_count, last_recalled, retention_strength)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(memory.id, memory.content, memory.summary ?? '', memory.timestamp, memory.duration ?? 0, JSON.stringify(memory.emotionalTags ?? []), memory.emotionalIntensity ?? 0, memory.importance ?? 0.5, JSON.stringify(memory.relatedMemories ?? []), JSON.stringify(memory.relatedConcepts ?? []), memory.recallCount ?? 0, memory.lastRecalled ?? null, memory.retentionStrength ?? 1.0);
        // FTS更新
        this.db.prepare(`
      INSERT OR REPLACE INTO fts_memories (memory_id, content, summary, type)
      VALUES (?, ?, ?, 'episodic')
    `).run(memory.id, memory.content, memory.summary ?? '');
    }
    /** 重要度順にエピソード記憶を取得 */
    getEpisodicMemories(limit = 50, minImportance = 0) {
        return this.all('SELECT * FROM episodic_memories WHERE importance >= ? ORDER BY importance DESC, timestamp DESC LIMIT ?', minImportance, limit);
    }
    /** テキスト検索でエピソード記憶を検索 */
    searchEpisodicMemories(query, limit = 10) {
        return this.all(`
      SELECT em.* FROM episodic_memories em
      JOIN fts_memories fts ON em.id = fts.memory_id
      WHERE fts_memories MATCH ?
      ORDER BY rank
      LIMIT ?
    `, query, limit);
    }
    // ============================================================
    // 意味記憶操作
    // ============================================================
    saveSemanticMemory(memory) {
        this.db.prepare(`
      INSERT OR REPLACE INTO semantic_memories
      (id, concept, definition, source, learned_at, comprehension, interest_level, use_count, last_used)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(memory.id, memory.concept, memory.definition ?? '', memory.source ?? 'initial', memory.learnedAt ?? 0, memory.comprehension ?? 0.5, memory.interestLevel ?? 0.5, memory.useCount ?? 0, memory.lastUsed ?? null);
        // 概念関係の保存
        if (memory.relations && memory.relations.length > 0) {
            this.db.prepare('DELETE FROM concept_relations WHERE memory_id = ?').run(memory.id);
            const insertRel = this.db.prepare('INSERT INTO concept_relations (memory_id, related_concept, relation_type, strength) VALUES (?, ?, ?, ?)');
            for (const rel of memory.relations) {
                insertRel.run(memory.id, rel.concept, rel.relationType, rel.strength);
            }
        }
        // FTS更新
        this.db.prepare(`
      INSERT OR REPLACE INTO fts_concepts (concept, definition)
      VALUES (?, ?)
    `).run(memory.concept, memory.definition ?? '');
    }
    /** 概念検索 */
    searchConcepts(query, limit = 10) {
        return this.all(`
      SELECT sm.* FROM semantic_memories sm
      JOIN fts_concepts fts ON sm.concept = fts.concept
      WHERE fts_concepts MATCH ?
      ORDER BY rank
      LIMIT ?
    `, query, limit);
    }
    // ============================================================
    // 訪問者操作
    // ============================================================
    saveVisitor(visitor) {
        this.db.prepare(`
      INSERT OR REPLACE INTO visitors
      (id, name, nickname, call_name, first_visit_at, last_visit_at, visit_count, communication_style, is_current)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(visitor.id, visitor.name ?? null, visitor.nickname ?? null, visitor.callName ?? null, visitor.firstVisitAt, visitor.lastVisitAt, visitor.visitCount ?? 0, JSON.stringify(visitor.communicationStyle ?? {}), visitor.isCurrent ? 1 : 0);
    }
    /** 訪問者のfactを追加 */
    addVisitorFact(visitorId, fact) {
        this.db.prepare(`
      INSERT INTO visitor_facts (visitor_id, category, content, confidence, learned_at, source)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(visitorId, fact.category, fact.content, fact.confidence ?? 0.5, fact.learnedAt, fact.source ?? 'conversation');
    }
    /** 現在の訪問者を取得 */
    getCurrentVisitor() {
        return this.get('SELECT * FROM visitors WHERE is_current = 1');
    }
    /** 訪問者のfactを全取得 */
    getVisitorFacts(visitorId) {
        return this.all('SELECT * FROM visitor_facts WHERE visitor_id = ? ORDER BY learned_at DESC', visitorId);
    }
    // ============================================================
    // 会話・メッセージ操作
    // ============================================================
    saveConversation(conv) {
        this.db.prepare(`
      INSERT OR REPLACE INTO conversations
      (id, visitor_id, started_at, ended_at, mood, topics, message_count, avg_satisfaction, summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(conv.id, conv.visitorId ?? null, conv.startedAt, conv.endedAt ?? null, conv.mood ?? 'casual', JSON.stringify(conv.topics ?? []), conv.messageCount ?? 0, conv.avgSatisfaction ?? 0, conv.summary ?? null);
    }
    saveMessage(msg) {
        this.db.prepare(`
      INSERT OR REPLACE INTO messages
      (id, conversation_id, speaker, content, timestamp, emotional_context,
       thought_before, emotion_during, satisfaction_after)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(msg.id, msg.conversationId, msg.speaker, msg.content, msg.timestamp, msg.emotionalContext ?? null, msg.thoughtBefore ?? null, msg.emotionDuring ?? null, msg.satisfactionAfter ?? null);
        // FTS更新
        this.db.prepare(`
      INSERT OR REPLACE INTO fts_messages (message_id, content, speaker)
      VALUES (?, ?, ?)
    `).run(msg.id, msg.content, msg.speaker);
    }
    /** 会話内のメッセージを取得 */
    getConversationMessages(conversationId) {
        return this.all('SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC', conversationId);
    }
    /** メッセージ全文検索 */
    searchMessages(query, limit = 20) {
        return this.all(`
      SELECT m.* FROM messages m
      JOIN fts_messages fts ON m.id = fts.message_id
      WHERE fts_messages MATCH ?
      ORDER BY rank
      LIMIT ?
    `, query, limit);
    }
    /** 最近の会話を取得 */
    getRecentConversations(limit = 10) {
        return this.all('SELECT * FROM conversations ORDER BY started_at DESC LIMIT ?', limit);
    }
    // ============================================================
    // 応答パターン操作
    // ============================================================
    saveResponsePattern(pattern) {
        const sit = pattern.situation ?? {};
        this.db.prepare(`
      INSERT OR REPLACE INTO response_patterns
      (id, template, success_count, use_count, avg_satisfaction, last_used, origin,
       emotion_tags, situation_intents, situation_emotions, situation_depths,
       situation_times, situation_phases, situation_keywords)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(pattern.id, pattern.template, pattern.successCount ?? 0, pattern.useCount ?? 0, pattern.avgSatisfaction ?? 0, pattern.lastUsed ?? 0, pattern.origin ?? 'extracted', JSON.stringify(pattern.emotionTags ?? []), JSON.stringify(sit.intents ?? []), JSON.stringify(sit.emotions ?? []), JSON.stringify(sit.depths ?? []), JSON.stringify(sit.timeOfDay ?? []), JSON.stringify(sit.relationshipPhases ?? []), JSON.stringify(sit.keywords ?? []));
    }
    /** 全パターンを取得 */
    getAllPatterns() {
        return this.all('SELECT * FROM response_patterns ORDER BY avg_satisfaction DESC');
    }
    // ============================================================
    // 日記操作
    // ============================================================
    saveDiaryEntry(entry) {
        this.db.prepare(`
      INSERT OR REPLACE INTO diary_entries
      (id, date, content, mood, mood_intensity, weather, day_number, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(entry.id, entry.date, entry.content, entry.mood ?? 'peace', entry.moodIntensity ?? 0.5, entry.weather ?? null, entry.dayNumber ?? 1, entry.createdAt);
        if (entry.events && entry.events.length > 0) {
            this.db.prepare('DELETE FROM diary_events WHERE entry_id = ?').run(entry.id);
            const insertEvent = this.db.prepare('INSERT INTO diary_events (entry_id, time, description, significance, emotion) VALUES (?, ?, ?, ?, ?)');
            for (const ev of entry.events) {
                insertEvent.run(entry.id, ev.time, ev.description, ev.significance ?? 0.5, ev.emotion ?? null);
            }
        }
    }
    // ============================================================
    // 創作物操作
    // ============================================================
    saveCreativeWork(work) {
        this.db.prepare(`
      INSERT OR REPLACE INTO creative_works
      (id, type, title, content, created_at, emotion_at_creation, inspiration, quality_self_rating, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(work.id, work.type, work.title ?? '', work.content, work.createdAt, work.emotionAtCreation ?? null, work.inspiration ?? null, work.qualitySelfRating ?? null, JSON.stringify(work.tags ?? []));
    }
    // ============================================================
    // 感情履歴操作
    // ============================================================
    recordEmotionSnapshot(snapshot) {
        this.db.prepare(`
      INSERT INTO emotion_history (tick, dominant_emotion, valence, arousal, emotion_vector, trigger)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(snapshot.tick, snapshot.dominantEmotion, snapshot.valence, snapshot.arousal, JSON.stringify(snapshot.emotionVector), snapshot.trigger ?? null);
    }
    /** 最近の感情推移 */
    getEmotionHistory(limit = 100) {
        return this.all('SELECT * FROM emotion_history ORDER BY tick DESC LIMIT ?', limit);
    }
    // ============================================================
    // モジュール状態（JSONブロブ）操作
    // ============================================================
    saveModuleState(moduleName, state) {
        const json = JSON.stringify(state);
        const checksum = this.simpleHash(json);
        this.db.prepare(`
      INSERT OR REPLACE INTO module_states (module_name, state, checksum, updated_at, size_bytes)
      VALUES (?, ?, ?, datetime('now'), ?)
    `).run(moduleName, json, checksum, json.length);
    }
    loadModuleState(moduleName) {
        const row = this.get('SELECT state FROM module_states WHERE module_name = ?', moduleName);
        if (!row)
            return null;
        try {
            return JSON.parse(row.state);
        }
        catch {
            return null;
        }
    }
    /** 全モジュール状態のリストを取得 */
    listModuleStates() {
        return this.all('SELECT module_name, size_bytes, updated_at FROM module_states ORDER BY module_name');
    }
    // ============================================================
    // システム状態操作
    // ============================================================
    setSystemState(key, value) {
        this.db.prepare(`
      INSERT OR REPLACE INTO system_state (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
    `).run(key, JSON.stringify(value));
    }
    getSystemState(key) {
        const row = this.get('SELECT value FROM system_state WHERE key = ?', key);
        if (!row)
            return null;
        try {
            return JSON.parse(row.value);
        }
        catch {
            return null;
        }
    }
    // ============================================================
    // 手続き記憶操作
    // ============================================================
    saveProceduralMemory(memory) {
        this.db.prepare(`
      INSERT OR REPLACE INTO procedural_memories
      (id, skill, steps, proficiency, practice_count, last_executed, automatization)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(memory.id, memory.skill, JSON.stringify(memory.steps ?? []), memory.proficiency ?? 0, memory.practiceCount ?? 0, memory.lastExecuted ?? null, memory.automatization ?? 0);
    }
    // ============================================================
    // 習慣操作
    // ============================================================
    saveHabit(habit) {
        this.db.prepare(`
      INSERT OR REPLACE INTO habits
      (id, name, description, trigger_type, trigger_condition, actions, frequency,
       strength, last_executed, execution_count, satisfaction_avg, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(habit.id, habit.name, habit.description ?? '', habit.triggerType ?? 'time', JSON.stringify(habit.triggerCondition ?? {}), JSON.stringify(habit.actions ?? []), habit.frequency ?? 0, habit.strength ?? 0, habit.lastExecuted ?? null, habit.executionCount ?? 0, habit.satisfactionAvg ?? 0.5, habit.active !== false ? 1 : 0);
    }
    // ============================================================
    // 夢操作
    // ============================================================
    saveDream(dream) {
        this.db.prepare(`
      INSERT OR REPLACE INTO dreams
      (id, phase, content, themes, emotional_tone, vividness, started_at, ended_at, memories_consolidated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(dream.id, dream.phase, dream.content ?? '', JSON.stringify(dream.themes ?? []), dream.emotionalTone ?? null, dream.vividness ?? 0.5, dream.startedAt, dream.endedAt ?? null, dream.memoriesConsolidated ?? 0);
        if (dream.fragments && dream.fragments.length > 0) {
            this.db.prepare('DELETE FROM dream_fragments WHERE dream_id = ?').run(dream.id);
            const insertFrag = this.db.prepare('INSERT INTO dream_fragments (dream_id, content, type, emotion, source_memory_id) VALUES (?, ?, ?, ?, ?)');
            for (const frag of dream.fragments) {
                insertFrag.run(dream.id, frag.content, frag.type ?? 'image', frag.emotion ?? null, frag.sourceMemoryId ?? null);
            }
        }
    }
    // ============================================================
    // 学習セッション操作
    // ============================================================
    saveLearningSession(session) {
        this.db.prepare(`
      INSERT OR REPLACE INTO learning_sessions
      (id, topic, source, content_summary, learned_at, comprehension, interest_level, concepts_learned, related_searches)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(session.id, session.topic, session.source ?? 'wikipedia', session.contentSummary ?? '', session.learnedAt, session.comprehension ?? 0.5, session.interestLevel ?? 0.5, JSON.stringify(session.conceptsLearned ?? []), JSON.stringify(session.relatedSearches ?? []));
    }
    // ============================================================
    // 自己変容記録操作
    // ============================================================
    saveSelfModification(mod) {
        this.db.prepare(`
      INSERT OR REPLACE INTO self_modifications
      (id, type, before_state, after_state, reason, trigger, impact, timestamp, reverted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(mod.id, mod.type, mod.beforeState ?? '', mod.afterState ?? '', mod.reason ?? '', mod.trigger ?? '', mod.impact ?? 0, mod.timestamp, mod.reverted ? 1 : 0);
    }
    // ============================================================
    // 統計情報
    // ============================================================
    getStats() {
        const count = (table) => {
            const row = this.get(`SELECT COUNT(*) as c FROM ${table}`);
            return row?.c ?? 0;
        };
        let dbSize = 0;
        try {
            dbSize = fs.statSync(this.config.dbPath).size;
        }
        catch { /* file might not exist yet */ }
        return {
            nodeCount: count('assoc_nodes'),
            edgeCount: count('assoc_edges'),
            episodicCount: count('episodic_memories'),
            semanticCount: count('semantic_memories'),
            proceduralCount: count('procedural_memories'),
            visitorCount: count('visitors'),
            conversationCount: count('conversations'),
            messageCount: count('messages'),
            patternCount: count('response_patterns'),
            diaryCount: count('diary_entries'),
            creativeCount: count('creative_works'),
            dreamCount: count('dreams'),
            dbSizeBytes: dbSize,
        };
    }
    // ============================================================
    // バックアップ
    // ============================================================
    backup() {
        try {
            const backupDir = path.join(path.dirname(this.config.dbPath), 'backups');
            if (!fs.existsSync(backupDir))
                fs.mkdirSync(backupDir, { recursive: true });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(backupDir, `somunia-${timestamp}.db`);
            this.db.backup(backupPath);
            // 古いバックアップの削除
            const backups = fs.readdirSync(backupDir)
                .filter(f => f.startsWith('somunia-') && f.endsWith('.db'))
                .sort()
                .reverse();
            for (let i = this.config.maxBackups; i < backups.length; i++) {
                fs.unlinkSync(path.join(backupDir, backups[i]));
            }
            console.log(`[DatabaseManager] バックアップ完了: ${backupPath}`);
            return backupPath;
        }
        catch (err) {
            console.error('[DatabaseManager] バックアップ失敗:', err);
            return null;
        }
    }
    // ============================================================
    // ユーティリティ
    // ============================================================
    simpleHash(data) {
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return Math.abs(hash).toString(36);
    }
    /** データベースの最適化 */
    optimize() {
        this.db.pragma('optimize');
        this.db.exec('ANALYZE');
        console.log('[DatabaseManager] 最適化完了');
    }
    /** データベースの整合性チェック */
    integrityCheck() {
        const result = this.db.pragma('integrity_check');
        const ok = result.length === 1 && result[0].integrity_check === 'ok';
        if (!ok) {
            console.error('[DatabaseManager] 整合性チェック失敗:', result);
        }
        return ok;
    }
    /** データベースを閉じる */
    close() {
        if (this.db) {
            this.db.close();
            console.log('[DatabaseManager] データベース接続を閉じました');
        }
    }
    /** 生データベースアクセス（上級者向け） */
    getDatabase() {
        return this.db;
    }
    isInitialized() {
        return this.initialized;
    }
}
exports.DatabaseManager = DatabaseManager;
//# sourceMappingURL=DatabaseManager.js.map