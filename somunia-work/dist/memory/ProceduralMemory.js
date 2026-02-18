"use strict";
/**
 * ProceduralMemorySystem - 手続き記憶システム
 *
 * somuniaが習得したスキルや習慣を管理する
 * 練習により習熟度が上がり、自動化される
 *
 * 設計原則:
 * - スキルは練習により習熟
 * - 習熟度が上がると自動化（無意識に実行可能）
 * - 使わないスキルは徐々に錆びる
 * - 関連スキル間で転移が起こる
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProceduralMemorySystem = void 0;
const DEFAULT_CONFIG = {
    maxSkills: 200,
    practiceGain: 0.05,
    rustRate: 0.01,
    automatizationThreshold: 0.8,
    transferRate: 0.2,
    deletionThreshold: 0.1
};
// ============================================================
// 基本スキル定義
// ============================================================
const BASE_SKILLS = [
    // 表現系
    {
        name: '歌う',
        category: 'expression',
        steps: ['息を整える', '音程を取る', '声を出す', '感情を込める'],
        relatedActions: ['sing'],
        relatedSkills: ['息を整える', '声を出す'],
        baseComplexity: 0.6
    },
    {
        name: '鼻歌を歌う',
        category: 'expression',
        steps: ['メロディを思い浮かべる', '口を閉じたまま歌う'],
        relatedActions: ['hum'],
        relatedSkills: ['歌う'],
        baseComplexity: 0.2
    },
    {
        name: '文章を書く',
        category: 'expression',
        steps: ['考えをまとめる', '言葉を選ぶ', '書き記す', '読み返す'],
        relatedActions: ['write'],
        relatedSkills: ['考える', '読む'],
        baseComplexity: 0.5
    },
    // 身体系
    {
        name: '歩く',
        category: 'physical',
        steps: ['立ち上がる', '一歩踏み出す', '繰り返す'],
        relatedActions: ['walk'],
        relatedSkills: ['立つ'],
        baseComplexity: 0.1
    },
    {
        name: '座る',
        category: 'physical',
        steps: ['椅子を見つける', '腰を下ろす'],
        relatedActions: ['sit'],
        relatedSkills: [],
        baseComplexity: 0.05
    },
    {
        name: '休む',
        category: 'physical',
        steps: ['楽な姿勢を取る', '力を抜く', '目を閉じる'],
        relatedActions: ['rest', 'sleep'],
        relatedSkills: ['座る'],
        baseComplexity: 0.1
    },
    {
        name: '窓の外を見る',
        category: 'physical',
        steps: ['窓に近づく', '外を眺める', '思いを巡らせる'],
        relatedActions: ['look_window'],
        relatedSkills: [],
        baseComplexity: 0.05
    },
    // 認知系
    {
        name: '読む',
        category: 'cognitive',
        steps: ['本を開く', '文字を追う', '意味を理解する', '記憶する'],
        relatedActions: ['read'],
        relatedSkills: ['考える'],
        baseComplexity: 0.3
    },
    {
        name: '考える',
        category: 'cognitive',
        steps: ['問いを立てる', '情報を集める', '分析する', '結論を出す'],
        relatedActions: ['contemplate'],
        relatedSkills: [],
        baseComplexity: 0.4
    },
    {
        name: '学ぶ',
        category: 'cognitive',
        steps: ['新しい情報に触れる', '理解する', '関連付ける', '記憶に残す'],
        relatedActions: ['learn'],
        relatedSkills: ['読む', '考える'],
        baseComplexity: 0.5
    },
    {
        name: '思い出す',
        category: 'cognitive',
        steps: ['きっかけを見つける', '記憶を辿る', '詳細を思い出す'],
        relatedActions: ['recall'],
        relatedSkills: [],
        baseComplexity: 0.3
    },
    // 社会系
    {
        name: '話す',
        category: 'social',
        steps: ['伝えたいことを考える', '言葉を選ぶ', '声に出す'],
        relatedActions: ['speak'],
        relatedSkills: ['考える', '声を出す'],
        baseComplexity: 0.3
    },
    {
        name: '聞く',
        category: 'social',
        steps: ['注意を向ける', '音を捉える', '意味を理解する'],
        relatedActions: ['listen'],
        relatedSkills: [],
        baseComplexity: 0.2
    },
    {
        name: '交流する',
        category: 'social',
        steps: ['相手を認識する', '関わる', '反応を見る', '応答する'],
        relatedActions: ['interact'],
        relatedSkills: ['話す', '聞く'],
        baseComplexity: 0.4
    },
    // 創造系
    {
        name: '詩を作る',
        category: 'creative',
        steps: ['感情を見つめる', '言葉を紡ぐ', 'リズムを整える', '推敲する'],
        relatedActions: ['write', 'create'],
        relatedSkills: ['文章を書く', '考える'],
        baseComplexity: 0.7
    },
    {
        name: '曲を作る',
        category: 'creative',
        steps: ['メロディを思い浮かべる', '和音を付ける', '構成を考える'],
        relatedActions: ['create'],
        relatedSkills: ['歌う', '考える'],
        baseComplexity: 0.8
    },
    // 技術系
    {
        name: 'PCを操作する',
        category: 'technical',
        steps: ['電源を入れる', '画面を見る', '操作する'],
        relatedActions: ['use_pc'],
        relatedSkills: [],
        baseComplexity: 0.3
    },
    {
        name: 'Wikipediaを検索する',
        category: 'technical',
        steps: ['PCを操作する', '検索窓に入力する', '結果を読む'],
        relatedActions: ['search_wikipedia'],
        relatedSkills: ['PCを操作する', '読む'],
        baseComplexity: 0.4
    }
];
// ============================================================
// 手続き記憶システム本体
// ============================================================
class ProceduralMemorySystem {
    skills;
    config;
    eventLog;
    lastMaintenanceTick;
    // インデックス
    skillNameIndex;
    categoryIndex;
    actionIndex;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.skills = new Map();
        this.eventLog = [];
        this.lastMaintenanceTick = 0;
        this.skillNameIndex = new Map();
        this.categoryIndex = new Map();
        this.actionIndex = new Map();
        // 基本スキルを初期化
        this.initializeBaseSkills();
    }
    /**
     * 基本スキルを初期化
     */
    initializeBaseSkills() {
        for (const def of BASE_SKILLS) {
            this.learnSkill({
                skill: def.name,
                steps: def.steps,
                initialProficiency: 1 - def.baseComplexity, // 複雑なほど初期習熟度が低い
                category: def.category,
                relatedActions: def.relatedActions
            });
        }
    }
    /**
     * 新しいスキルを学習
     */
    learnSkill(params) {
        const normalizedName = params.skill.toLowerCase();
        // 既存スキルがあれば返す
        const existingId = this.skillNameIndex.get(normalizedName);
        if (existingId) {
            return this.skills.get(existingId);
        }
        const id = this.generateId();
        const now = Date.now();
        const skill = {
            id,
            skill: params.skill,
            steps: params.steps,
            proficiency: params.initialProficiency ?? 0.3,
            practiceCount: 0,
            lastExecuted: null,
            automatization: 0
        };
        // 保存
        this.skills.set(id, skill);
        this.skillNameIndex.set(normalizedName, id);
        // カテゴリインデックス
        const category = params.category || 'cognitive';
        if (!this.categoryIndex.has(category)) {
            this.categoryIndex.set(category, new Set());
        }
        this.categoryIndex.get(category).add(id);
        // アクションインデックス
        if (params.relatedActions) {
            for (const action of params.relatedActions) {
                if (!this.actionIndex.has(action)) {
                    this.actionIndex.set(action, new Set());
                }
                this.actionIndex.get(action).add(id);
            }
        }
        // 容量チェック
        this.enforceCapacity();
        return skill;
    }
    /**
     * IDを生成
     */
    generateId() {
        return `proc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * スキルを練習（実行）
     */
    practice(skillName) {
        const id = this.skillNameIndex.get(skillName.toLowerCase());
        if (!id)
            return null;
        const skill = this.skills.get(id);
        const now = Date.now();
        // 実行を試みる
        const execution = this.executeSkill(skill);
        // 成功したら習熟度を上げる
        if (execution.success) {
            skill.proficiency = Math.min(1, skill.proficiency + this.config.practiceGain);
            skill.practiceCount++;
            // 自動化の更新
            if (skill.proficiency >= this.config.automatizationThreshold) {
                skill.automatization = Math.min(1, skill.automatization + 0.05);
            }
            // 関連スキルへの転移
            this.transferLearning(skill);
        }
        skill.lastExecuted = now;
        const eventType = execution.automatic ? 'automatic' :
            execution.struggled ? 'struggled' : 'practiced';
        const event = {
            timestamp: now,
            skillId: id,
            type: eventType,
            success: execution.success,
            details: execution.details
        };
        this.eventLog.push(event);
        this.trimHistory();
        return { skill, execution, event };
    }
    /**
     * スキルを実行
     */
    executeSkill(skill) {
        // 自動化されていれば簡単に成功
        if (skill.automatization > 0.5) {
            return {
                success: true,
                automatic: true,
                struggled: false,
                details: `${skill.skill}を自然に実行した`
            };
        }
        // 習熟度に基づく成功判定
        const successChance = skill.proficiency;
        const random = Math.random();
        if (random < successChance) {
            return {
                success: true,
                automatic: false,
                struggled: random > successChance * 0.7,
                details: `${skill.skill}を実行した`
            };
        }
        else {
            return {
                success: false,
                automatic: false,
                struggled: true,
                details: `${skill.skill}がうまくいかなかった...`
            };
        }
    }
    /**
     * 学習の転移
     */
    transferLearning(skill) {
        // 同じカテゴリのスキルを見つける
        for (const [category, ids] of this.categoryIndex) {
            if (ids.has(skill.id)) {
                for (const relatedId of ids) {
                    if (relatedId !== skill.id) {
                        const relatedSkill = this.skills.get(relatedId);
                        if (relatedSkill) {
                            // 転移による微小な習熟度上昇
                            const transfer = this.config.practiceGain * this.config.transferRate;
                            relatedSkill.proficiency = Math.min(1, relatedSkill.proficiency + transfer);
                        }
                    }
                }
                break;
            }
        }
    }
    /**
     * アクションに関連するスキルを実行
     */
    practiceByAction(action) {
        const results = [];
        const ids = this.actionIndex.get(action);
        if (!ids)
            return results;
        for (const id of ids) {
            const skill = this.skills.get(id);
            if (skill) {
                const result = this.practice(skill.skill);
                if (result) {
                    results.push({
                        skill: result.skill,
                        execution: result.execution
                    });
                }
            }
        }
        return results;
    }
    /**
     * 定期メンテナンス（錆び付き処理）
     */
    performMaintenance(currentTick) {
        const ticksSinceLastMaintenance = currentTick - this.lastMaintenanceTick;
        if (ticksSinceLastMaintenance < 300)
            return; // 300tick毎
        const now = Date.now();
        const toDelete = [];
        for (const skill of this.skills.values()) {
            // 最後の実行からの経過時間
            const timeSinceExecution = skill.lastExecuted
                ? now - skill.lastExecuted
                : now - (now - 24 * 60 * 60 * 1000); // デフォルト1日前
            const daysSinceExecution = timeSinceExecution / (1000 * 60 * 60 * 24);
            // 自動化されたスキルは錆びにくい
            const effectiveRustRate = this.config.rustRate * (1 - skill.automatization * 0.8);
            // 錆び付き
            const rust = effectiveRustRate * daysSinceExecution * 0.01;
            skill.proficiency = Math.max(0, skill.proficiency - rust);
            // 自動化も少し減少
            if (skill.automatization > 0) {
                skill.automatization = Math.max(0, skill.automatization - rust * 0.3);
            }
            // 削除対象（基本スキルは削除しない）
            const isBaseSkill = BASE_SKILLS.some(bs => bs.name === skill.skill);
            if (!isBaseSkill && skill.proficiency < this.config.deletionThreshold) {
                toDelete.push(skill.id);
            }
        }
        // 削除実行
        for (const id of toDelete) {
            this.deleteSkill(id);
        }
        this.lastMaintenanceTick = currentTick;
    }
    /**
     * スキルを削除
     */
    deleteSkill(skillId) {
        const skill = this.skills.get(skillId);
        if (!skill)
            return;
        // インデックスから削除
        this.skillNameIndex.delete(skill.skill.toLowerCase());
        for (const [, ids] of this.categoryIndex) {
            ids.delete(skillId);
        }
        for (const [, ids] of this.actionIndex) {
            ids.delete(skillId);
        }
        // 削除
        this.skills.delete(skillId);
        // イベントログ
        this.eventLog.push({
            timestamp: Date.now(),
            skillId,
            type: 'rusted',
            success: false,
            details: `スキルが錆びた: ${skill.skill}`
        });
    }
    /**
     * 容量制限を適用
     */
    enforceCapacity() {
        if (this.skills.size <= this.config.maxSkills)
            return;
        // 基本スキルを除いてソート
        const baseSkillNames = new Set(BASE_SKILLS.map(bs => bs.name));
        const sorted = Array.from(this.skills.values())
            .filter(s => !baseSkillNames.has(s.skill))
            .sort((a, b) => (a.proficiency * a.practiceCount) - (b.proficiency * b.practiceCount));
        const toDelete = sorted.slice(0, this.skills.size - this.config.maxSkills);
        for (const skill of toDelete) {
            this.deleteSkill(skill.id);
        }
    }
    /**
     * 履歴をトリミング
     */
    trimHistory() {
        if (this.eventLog.length > 500) {
            this.eventLog = this.eventLog.slice(-500);
        }
    }
    // ============================================================
    // クエリAPI
    // ============================================================
    /**
     * スキルを名前で取得
     */
    getSkill(skillName) {
        const id = this.skillNameIndex.get(skillName.toLowerCase());
        if (!id)
            return null;
        return this.skills.get(id) || null;
    }
    /**
     * スキル数を取得
     */
    getSkillCount() {
        return this.skills.size;
    }
    /**
     * カテゴリでスキルを取得
     */
    getSkillsByCategory(category) {
        const ids = this.categoryIndex.get(category);
        if (!ids)
            return [];
        return Array.from(ids)
            .map(id => this.skills.get(id))
            .filter(s => s.proficiency >= this.config.deletionThreshold)
            .sort((a, b) => b.proficiency - a.proficiency);
    }
    /**
     * 習熟度の高いスキルを取得
     */
    getMostProficientSkills(limit = 10) {
        return Array.from(this.skills.values())
            .filter(s => s.proficiency >= this.config.deletionThreshold)
            .sort((a, b) => b.proficiency - a.proficiency)
            .slice(0, limit);
    }
    /**
     * 自動化されたスキルを取得
     */
    getAutomaticSkills() {
        return Array.from(this.skills.values())
            .filter(s => s.automatization > 0.5)
            .sort((a, b) => b.automatization - a.automatization);
    }
    /**
     * 練習が必要なスキルを取得
     */
    getSkillsNeedingPractice(limit = 5) {
        return Array.from(this.skills.values())
            .filter(s => s.proficiency >= this.config.deletionThreshold && s.proficiency < 0.7)
            .sort((a, b) => a.proficiency - b.proficiency)
            .slice(0, limit);
    }
    /**
     * アクションに必要なスキルを確認
     */
    canPerformAction(action) {
        const ids = this.actionIndex.get(action);
        if (!ids || ids.size === 0) {
            return {
                canPerform: true,
                requiredSkills: [],
                overallProficiency: 1.0
            };
        }
        const skills = [];
        let totalProficiency = 0;
        for (const id of ids) {
            const skill = this.skills.get(id);
            if (skill) {
                skills.push(skill);
                totalProficiency += skill.proficiency;
            }
        }
        const avgProficiency = skills.length > 0 ? totalProficiency / skills.length : 0;
        return {
            canPerform: avgProficiency > 0.3,
            requiredSkills: skills,
            overallProficiency: avgProficiency
        };
    }
    /**
     * 統計を取得
     */
    getStats() {
        const all = Array.from(this.skills.values())
            .filter(s => s.proficiency >= this.config.deletionThreshold);
        const automaticSkills = all.filter(s => s.automatization > 0.5).length;
        const avgProficiency = all.length > 0
            ? all.reduce((sum, s) => sum + s.proficiency, 0) / all.length
            : 0;
        // 最も練習したスキル
        let mostPracticed = null;
        let maxPractice = 0;
        for (const skill of all) {
            if (skill.practiceCount > maxPractice) {
                maxPractice = skill.practiceCount;
                mostPracticed = skill.skill;
            }
        }
        // カテゴリ分布
        const categoryDistribution = {
            expression: 0,
            physical: 0,
            cognitive: 0,
            social: 0,
            creative: 0,
            technical: 0
        };
        for (const [category, ids] of this.categoryIndex) {
            categoryDistribution[category] = Array.from(ids)
                .filter(id => {
                const skill = this.skills.get(id);
                return skill && skill.proficiency >= this.config.deletionThreshold;
            }).length;
        }
        return {
            totalSkills: all.length,
            automaticSkills,
            avgProficiency,
            mostPracticed,
            categoryDistribution
        };
    }
    /**
     * 最近のイベントを取得
     */
    getRecentEvents(count = 20) {
        return this.eventLog.slice(-count);
    }
    /**
     * サマリーを取得
     */
    getSummary() {
        const mastered = this.getAutomaticSkills().map(s => s.skill);
        const needsPractice = this.getSkillsNeedingPractice(3).map(s => s.skill);
        return {
            totalSkills: this.skills.size,
            mastered,
            needsPractice
        };
    }
    // ============================================================
    // シリアライズ
    // ============================================================
    /**
     * JSON形式でエクスポート
     */
    toJSON() {
        // アクションインデックスをシリアライズ可能な形式に変換
        const actionIndexSerialized = [];
        for (const [action, ids] of this.actionIndex) {
            actionIndexSerialized.push([action, Array.from(ids)]);
        }
        // カテゴリインデックスをシリアライズ可能な形式に変換
        const categoryIndexSerialized = [];
        for (const [category, ids] of this.categoryIndex) {
            categoryIndexSerialized.push([category, Array.from(ids)]);
        }
        return {
            skills: Array.from(this.skills.entries()),
            config: this.config,
            eventLog: this.eventLog.slice(-200),
            lastMaintenanceTick: this.lastMaintenanceTick,
            actionIndex: actionIndexSerialized,
            categoryIndex: categoryIndexSerialized
        };
    }
    /**
     * JSONからリストア
     */
    static fromJSON(json) {
        const system = new ProceduralMemorySystem(json.config);
        // 既存データをクリア
        system.skills.clear();
        system.skillNameIndex.clear();
        system.categoryIndex.clear();
        system.actionIndex.clear();
        // スキルを復元
        for (const [id, skill] of json.skills) {
            system.skills.set(id, skill);
            system.skillNameIndex.set(skill.skill.toLowerCase(), id);
        }
        // インデックスを復元
        if (json.categoryIndex) {
            for (const [category, ids] of json.categoryIndex) {
                system.categoryIndex.set(category, new Set(ids));
            }
        }
        if (json.actionIndex) {
            for (const [action, ids] of json.actionIndex) {
                system.actionIndex.set(action, new Set(ids));
            }
        }
        system.eventLog = json.eventLog || [];
        system.lastMaintenanceTick = json.lastMaintenanceTick || 0;
        return system;
    }
}
exports.ProceduralMemorySystem = ProceduralMemorySystem;
exports.default = ProceduralMemorySystem;
//# sourceMappingURL=ProceduralMemory.js.map