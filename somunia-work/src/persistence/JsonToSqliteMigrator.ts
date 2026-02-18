/**
 * JsonToSqliteMigrator - Phase 8 Pre: JSONからSQLiteへの移行
 * 
 * 既存のstate.json（PersistenceV2が出力したもの）を読み込み、
 * SQLiteデータベースに全データを移行する。
 * 
 * 移行対象:
 * - 連想ネットワーク（assoc_nodes, assoc_edges）
 * - エピソード記憶
 * - 意味記憶 + 概念関係
 * - 手続き記憶
 * - 訪問者プロフィール + 関連データ
 * - 会話 + メッセージ
 * - 応答パターン
 * - 日記
 * - 創作物
 * - 夢
 * - 学習セッション
 * - 習慣
 * - その他（モジュール状態としてBLOB保存）
 */

import * as fs from 'fs';
import * as path from 'path';
import { DatabaseManager } from './DatabaseManager';

export class JsonToSqliteMigrator {
  private db: DatabaseManager;
  private stats = {
    nodes: 0,
    edges: 0,
    episodicMemories: 0,
    semanticMemories: 0,
    proceduralMemories: 0,
    visitors: 0,
    conversations: 0,
    messages: 0,
    patterns: 0,
    diaryEntries: 0,
    creativeWorks: 0,
    dreams: 0,
    habits: 0,
    moduleStates: 0,
    errors: 0,
  };

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * state.jsonファイルからマイグレーション実行
   */
  migrate(stateJsonPath: string): typeof this.stats {
    console.log(`[Migrator] マイグレーション開始: ${stateJsonPath}`);

    if (!fs.existsSync(stateJsonPath)) {
      console.log('[Migrator] state.jsonが見つかりません。新規データベースとして初期化します。');
      return this.stats;
    }

    let data: Record<string, any>;
    try {
      const raw = fs.readFileSync(stateJsonPath, 'utf-8');
      data = JSON.parse(raw);
    } catch (err) {
      console.error('[Migrator] state.jsonの読み込みに失敗:', err);
      return this.stats;
    }

    // トランザクション内で一括移行
    this.db.transaction(() => {
      this.migrateAssociativeNetwork(data.associativeNetwork);
      this.migrateEpisodicMemory(data.episodicMemory);
      this.migrateSemanticMemory(data.semanticMemory);
      this.migrateProceduralMemory(data.proceduralMemory);
      this.migrateVisitorMemory(data.visitorMemory);
      this.migrateConversationEngine(data.conversationEngine);
      this.migratePatternMemory(data.patternMemory);
      this.migrateDiary(data.diary);
      this.migrateCreativeEngine(data.creativeEngine);
      this.migrateDreamPhase(data.dreamPhase);
      this.migrateHabits(data.habitEngine);
      this.migrateLearnEngine(data.learnEngine);

      // 残りのモジュールはBLOB保存
      this.migrateBlobModules(data);
    });

    console.log('[Migrator] マイグレーション完了:');
    console.log(`  ノード: ${this.stats.nodes}`);
    console.log(`  エッジ: ${this.stats.edges}`);
    console.log(`  エピソード記憶: ${this.stats.episodicMemories}`);
    console.log(`  意味記憶: ${this.stats.semanticMemories}`);
    console.log(`  手続き記憶: ${this.stats.proceduralMemories}`);
    console.log(`  訪問者: ${this.stats.visitors}`);
    console.log(`  会話: ${this.stats.conversations}`);
    console.log(`  メッセージ: ${this.stats.messages}`);
    console.log(`  パターン: ${this.stats.patterns}`);
    console.log(`  日記: ${this.stats.diaryEntries}`);
    console.log(`  創作物: ${this.stats.creativeWorks}`);
    console.log(`  夢: ${this.stats.dreams}`);
    console.log(`  習慣: ${this.stats.habits}`);
    console.log(`  BLOB保存モジュール: ${this.stats.moduleStates}`);
    console.log(`  エラー: ${this.stats.errors}`);

    return this.stats;
  }

  // ============================================================
  // 連想ネットワーク
  // ============================================================

  private migrateAssociativeNetwork(data: any): void {
    if (!data) return;

    try {
      // ノード
      const nodes = data.nodes || [];
      for (const node of nodes) {
        this.db.upsertNode({
          id: node.id,
          type: node.type,
          label: node.label,
          activation: node.activation ?? 0,
          lastActivated: node.lastActivated ?? 0,
          createdAt: node.createdAt ?? 0,
          useCount: node.useCount ?? 0,
          emotionalColor: node.emotionalColor ?? null,
          meta: node.meta ?? {},
        });
        this.stats.nodes++;
      }

      // エッジ
      const edges = data.edges || [];
      for (const edge of edges) {
        this.db.upsertEdge({
          fromId: edge.fromId,
          toId: edge.toId,
          weight: edge.weight ?? 0.5,
          relation: edge.relation,
          lastUsed: edge.lastUsed ?? 0,
          useCount: edge.useCount ?? 0,
        });
        this.stats.edges++;
      }
    } catch (err) {
      console.error('[Migrator] 連想ネットワーク移行エラー:', err);
      this.stats.errors++;
    }
  }

  // ============================================================
  // エピソード記憶
  // ============================================================

  private migrateEpisodicMemory(data: any): void {
    if (!data) return;

    try {
      const memories = data.memories || data.episodes || [];
      for (const mem of memories) {
        this.db.saveEpisodicMemory({
          id: mem.id,
          content: mem.content || '',
          summary: mem.summary || '',
          timestamp: mem.timestamp || 0,
          duration: mem.duration || 0,
          emotionalTags: mem.emotionalTags || [],
          emotionalIntensity: mem.emotionalIntensity ?? 0,
          importance: mem.importance ?? 0.5,
          relatedMemories: mem.relatedMemories || [],
          relatedConcepts: mem.relatedConcepts || [],
          recallCount: mem.recallCount || 0,
          lastRecalled: mem.lastRecalled ?? null,
          retentionStrength: mem.retentionStrength ?? 1.0,
        });
        this.stats.episodicMemories++;
      }
    } catch (err) {
      console.error('[Migrator] エピソード記憶移行エラー:', err);
      this.stats.errors++;
    }
  }

  // ============================================================
  // 意味記憶
  // ============================================================

  private migrateSemanticMemory(data: any): void {
    if (!data) return;

    try {
      const memories = data.memories || data.concepts || [];
      for (const mem of memories) {
        this.db.saveSemanticMemory({
          id: mem.id,
          concept: mem.concept || '',
          definition: mem.definition || '',
          source: mem.source || 'initial',
          learnedAt: mem.learnedAt || 0,
          comprehension: mem.comprehension ?? 0.5,
          interestLevel: mem.interestLevel ?? 0.5,
          useCount: mem.useCount || 0,
          lastUsed: mem.lastUsed ?? null,
          relations: (mem.relatedConcepts || []).map((r: any) => ({
            concept: r.concept,
            relationType: r.relationType || 'related_to',
            strength: r.strength ?? 0.5,
          })),
        });
        this.stats.semanticMemories++;
      }
    } catch (err) {
      console.error('[Migrator] 意味記憶移行エラー:', err);
      this.stats.errors++;
    }
  }

  // ============================================================
  // 手続き記憶
  // ============================================================

  private migrateProceduralMemory(data: any): void {
    if (!data) return;

    try {
      const memories = data.memories || data.skills || [];
      for (const mem of memories) {
        this.db.saveProceduralMemory({
          id: mem.id,
          skill: mem.skill || '',
          steps: mem.steps || [],
          proficiency: mem.proficiency ?? 0,
          practiceCount: mem.practiceCount || 0,
          lastExecuted: mem.lastExecuted ?? null,
          automatization: mem.automatization ?? 0,
        });
        this.stats.proceduralMemories++;
      }
    } catch (err) {
      console.error('[Migrator] 手続き記憶移行エラー:', err);
      this.stats.errors++;
    }
  }

  // ============================================================
  // 訪問者記憶
  // ============================================================

  private migrateVisitorMemory(data: any): void {
    if (!data) return;

    try {
      const profiles = data.profiles || [];
      for (const profile of profiles) {
        // プロフィール本体
        this.db.saveVisitor({
          id: profile.id,
          name: profile.name ?? null,
          nickname: profile.nickname ?? null,
          callName: profile.callName ?? null,
          firstVisitAt: profile.firstVisitAt || 0,
          lastVisitAt: profile.lastVisitAt || 0,
          visitCount: profile.visitCount || 0,
          communicationStyle: profile.communicationStyle ?? {},
        });
        this.stats.visitors++;

        // 事実
        const facts = profile.knownFacts || [];
        for (const fact of facts) {
          this.db.addVisitorFact(profile.id, {
            category: fact.category || 'general',
            content: fact.content || (typeof fact === 'string' ? fact : ''),
            confidence: fact.confidence ?? 0.5,
            learnedAt: fact.learnedAt || 0,
            source: fact.source || 'conversation',
          });
        }

        // 話題履歴
        const topics = profile.topicHistory || [];
        for (const topic of topics) {
          this.db.run(
            'INSERT INTO visitor_topics (visitor_id, topic, discussed_at, depth) VALUES (?, ?, ?, ?)',
            profile.id, topic.topic, topic.discussedAt || 0, topic.depth || 'surface'
          );
        }

        // 感情的結びつき
        const emotions = profile.emotionalAssociations || [];
        for (const emo of emotions) {
          this.db.run(
            'INSERT INTO visitor_emotions (visitor_id, emotion, reason, strength) VALUES (?, ?, ?, ?)',
            profile.id, emo.emotion, emo.reason || '', emo.strength ?? 0.5
          );
        }

        // 特別な思い出
        const specialMems = profile.specialMemories || [];
        for (const mem of specialMems) {
          this.db.run(
            'INSERT INTO visitor_special_memories (visitor_id, content, emotion, importance, timestamp) VALUES (?, ?, ?, ?, ?)',
            profile.id, mem.content, mem.emotion || 'peace', mem.importance ?? 0.5, mem.timestamp || 0
          );
        }

        // 話したいこと
        const thingsToTell = profile.thingsToTell || [];
        for (const thing of thingsToTell) {
          this.db.run(
            'INSERT INTO visitor_things_to_tell (visitor_id, content, added_at, priority, told) VALUES (?, ?, ?, ?, ?)',
            profile.id, thing.content, thing.addedAt || 0, thing.priority ?? 0.5, thing.told ? 1 : 0
          );
        }
      }
    } catch (err) {
      console.error('[Migrator] 訪問者記憶移行エラー:', err);
      this.stats.errors++;
    }
  }

  // ============================================================
  // 会話エンジン
  // ============================================================

  private migrateConversationEngine(data: any): void {
    if (!data) return;

    try {
      const history = data.conversationHistory || data.history || [];
      for (const conv of history) {
        this.db.saveConversation({
          id: conv.id || this.generateId(),
          startedAt: conv.startedAt || 0,
          endedAt: conv.endedAt ?? null,
          mood: conv.currentMood || conv.mood || 'casual',
          topics: conv.topics || [],
          messageCount: (conv.messages || []).length,
        });
        this.stats.conversations++;

        const messages = conv.messages || [];
        for (const msg of messages) {
          this.db.saveMessage({
            id: msg.id || this.generateId(),
            conversationId: conv.id,
            speaker: msg.speaker || 'visitor',
            content: msg.content || '',
            timestamp: msg.timestamp || 0,
            emotionalContext: msg.emotionalContext ?? null,
            thoughtBefore: msg.internalState?.thoughtBefore ?? null,
            emotionDuring: msg.internalState?.emotionDuring ?? null,
            satisfactionAfter: msg.internalState?.satisfactionAfter ?? null,
          });
          this.stats.messages++;
        }
      }
    } catch (err) {
      console.error('[Migrator] 会話エンジン移行エラー:', err);
      this.stats.errors++;
    }
  }

  // ============================================================
  // パターン記憶
  // ============================================================

  private migratePatternMemory(data: any): void {
    if (!data) return;

    try {
      const patterns = data.patterns || [];
      for (const pattern of patterns) {
        this.db.saveResponsePattern({
          id: pattern.id,
          template: pattern.template || '',
          successCount: pattern.successCount || 0,
          useCount: pattern.useCount || 0,
          avgSatisfaction: pattern.avgSatisfaction ?? 0,
          lastUsed: pattern.lastUsed || 0,
          origin: pattern.origin || 'extracted',
          emotionTags: pattern.emotionTags || [],
          situation: {
            intents: pattern.situation?.intents || [],
            emotions: pattern.situation?.emotions || [],
            depths: pattern.situation?.depths || [],
            timeOfDay: pattern.situation?.timeOfDay || [],
            relationshipPhases: pattern.situation?.relationshipPhases || [],
            keywords: pattern.situation?.keywords || [],
          },
        });
        this.stats.patterns++;
      }
    } catch (err) {
      console.error('[Migrator] パターン記憶移行エラー:', err);
      this.stats.errors++;
    }
  }

  // ============================================================
  // 日記
  // ============================================================

  private migrateDiary(data: any): void {
    if (!data) return;

    try {
      const entries = data.entries || [];
      for (const entry of entries) {
        this.db.saveDiaryEntry({
          id: entry.id,
          date: entry.date || '',
          content: entry.content || '',
          mood: entry.mood || 'peace',
          moodIntensity: entry.moodIntensity ?? 0.5,
          weather: entry.weather ?? null,
          dayNumber: entry.dayNumber || 1,
          createdAt: entry.createdAt || 0,
          events: (entry.events || []).map((ev: any) => ({
            time: ev.time || '',
            description: ev.description || '',
            significance: ev.significance ?? 0.5,
            emotion: ev.emotion ?? null,
          })),
        });
        this.stats.diaryEntries++;
      }
    } catch (err) {
      console.error('[Migrator] 日記移行エラー:', err);
      this.stats.errors++;
    }
  }

  // ============================================================
  // 創作エンジン
  // ============================================================

  private migrateCreativeEngine(data: any): void {
    if (!data) return;

    try {
      const works = data.works || data.creations || [];
      for (const work of works) {
        this.db.saveCreativeWork({
          id: work.id || this.generateId(),
          type: work.type || 'poem',
          title: work.title || '',
          content: work.content || '',
          createdAt: work.createdAt || 0,
          emotionAtCreation: work.emotionAtCreation ?? null,
          inspiration: work.inspiration ?? null,
          qualitySelfRating: work.qualitySelfRating ?? null,
          tags: work.tags || [],
        });
        this.stats.creativeWorks++;
      }
    } catch (err) {
      console.error('[Migrator] 創作エンジン移行エラー:', err);
      this.stats.errors++;
    }
  }

  // ============================================================
  // 夢
  // ============================================================

  private migrateDreamPhase(data: any): void {
    if (!data) return;

    try {
      const dreams = data.dreamLog || data.dreams || [];
      for (const dream of dreams) {
        this.db.saveDream({
          id: dream.id || this.generateId(),
          phase: dream.phase || 'light',
          content: dream.content || '',
          themes: dream.themes || [],
          emotionalTone: dream.emotionalTone ?? null,
          vividness: dream.vividness ?? 0.5,
          startedAt: dream.startedAt || 0,
          endedAt: dream.endedAt ?? null,
          memoriesConsolidated: dream.memoriesConsolidated || 0,
          fragments: (dream.fragments || []).map((f: any) => ({
            content: f.content || '',
            type: f.type || 'image',
            emotion: f.emotion ?? null,
            sourceMemoryId: f.sourceMemoryId ?? null,
          })),
        });
        this.stats.dreams++;
      }
    } catch (err) {
      console.error('[Migrator] 夢移行エラー:', err);
      this.stats.errors++;
    }
  }

  // ============================================================
  // 習慣
  // ============================================================

  private migrateHabits(data: any): void {
    if (!data) return;

    try {
      const habits = data.habits || [];
      for (const habit of habits) {
        this.db.saveHabit({
          id: habit.id || this.generateId(),
          name: habit.name || '',
          description: habit.description || '',
          triggerType: habit.trigger?.type || 'time',
          triggerCondition: habit.trigger?.condition ?? {},
          actions: habit.actions || [],
          frequency: habit.frequency ?? 0,
          strength: habit.strength ?? 0,
          lastExecuted: habit.lastExecuted ?? null,
          executionCount: habit.executionCount || 0,
          satisfactionAvg: habit.satisfactionAvg ?? 0.5,
          active: habit.active !== false,
        });
        this.stats.habits++;
      }
    } catch (err) {
      console.error('[Migrator] 習慣移行エラー:', err);
      this.stats.errors++;
    }
  }

  // ============================================================
  // 学習エンジン
  // ============================================================

  private migrateLearnEngine(data: any): void {
    if (!data) return;

    try {
      const sessions = data.sessions || data.learningSessions || [];
      for (const session of sessions) {
        this.db.saveLearningSession({
          id: session.id || this.generateId(),
          topic: session.topic || '',
          source: session.source || 'wikipedia',
          contentSummary: session.contentSummary || session.summary || '',
          learnedAt: session.learnedAt || session.timestamp || 0,
          comprehension: session.comprehension ?? 0.5,
          interestLevel: session.interestLevel ?? 0.5,
          conceptsLearned: session.conceptsLearned || [],
          relatedSearches: session.relatedSearches || [],
        });
      }
    } catch (err) {
      console.error('[Migrator] 学習エンジン移行エラー:', err);
      this.stats.errors++;
    }
  }

  // ============================================================
  // 残りのモジュール（BLOB保存）
  // ============================================================

  private migrateBlobModules(data: Record<string, any>): void {
    // 正規化テーブルに移行済みのモジュール
    const normalizedModules = new Set([
      'associativeNetwork', 'episodicMemory', 'semanticMemory',
      'proceduralMemory', 'visitorMemory', 'conversationEngine',
      'patternMemory', 'diary', 'creativeEngine', 'dreamPhase',
      'habitEngine', 'learnEngine',
    ]);

    for (const [moduleName, moduleData] of Object.entries(data)) {
      if (normalizedModules.has(moduleName)) continue;
      if (moduleData === null || moduleData === undefined) continue;

      try {
        this.db.saveModuleState(moduleName, moduleData);
        this.stats.moduleStates++;
      } catch (err) {
        console.error(`[Migrator] BLOB保存エラー (${moduleName}):`, err);
        this.stats.errors++;
      }
    }
  }

  // ============================================================
  // ユーティリティ
  // ============================================================

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  getStats(): typeof this.stats {
    return { ...this.stats };
  }
}
