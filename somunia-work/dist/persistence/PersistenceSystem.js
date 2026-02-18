"use strict";
/**
 * PersistenceSystem - somunia v10 永続化システム
 *
 * somuniaの全状態をディスクに保存・復元する。
 * 自動保存、手動保存、バックアップローテーション。
 * データは100GBになっても構わないという設計思想。
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistenceSystem = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const EventBus_1 = require("../core/EventBus");
const DEFAULT_CONFIG = {
    dataDir: './somunia-data',
    autoSaveInterval: 60,
    maxBackups: 10,
    compress: false,
};
// ============================================================
// PersistenceSystem
// ============================================================
class PersistenceSystem {
    config;
    modules = new Map();
    lastSaveTick = 0;
    events;
    constructor(config = {}, events) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.events = events || EventBus_1.eventBus;
        this.ensureDirectories();
    }
    /**
     * 保存対象のモジュールを登録
     */
    registerModule(name, module) {
        this.modules.set(name, module);
    }
    /**
     * 全状態を保存
     */
    async save(tick, day) {
        try {
            const data = {};
            const moduleNames = [];
            for (const [name, module] of this.modules.entries()) {
                try {
                    data[name] = module.toJSON();
                    moduleNames.push(name);
                }
                catch (error) {
                    console.error(`[Persistence] Failed to serialize module ${name}:`, error);
                }
            }
            // マニフェスト
            const manifest = {
                version: '10.0.0',
                savedAt: new Date().toISOString(),
                tick,
                day,
                modules: moduleNames,
                size: 0,
            };
            // バックアップローテーション
            this.rotateBackups();
            // 保存
            const stateJson = JSON.stringify(data, null, 2);
            manifest.size = stateJson.length;
            const statePath = path.join(this.config.dataDir, 'state.json');
            const manifestPath = path.join(this.config.dataDir, 'manifest.json');
            fs.writeFileSync(statePath, stateJson, 'utf-8');
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
            this.lastSaveTick = tick;
            this.events.emitSync({
                type: 'state_saved',
                timestamp: tick,
                data: { manifest },
            });
            return true;
        }
        catch (error) {
            console.error('[Persistence] Save failed:', error);
            return false;
        }
    }
    /**
     * 状態を復元
     */
    async load() {
        try {
            const statePath = path.join(this.config.dataDir, 'state.json');
            const manifestPath = path.join(this.config.dataDir, 'manifest.json');
            if (!fs.existsSync(statePath)) {
                console.log('[Persistence] No saved state found.');
                return false;
            }
            const stateJson = fs.readFileSync(statePath, 'utf-8');
            const data = JSON.parse(stateJson);
            let manifest = null;
            if (fs.existsSync(manifestPath)) {
                manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
            }
            // 各モジュールに復元
            let loadedCount = 0;
            for (const [name, module] of this.modules.entries()) {
                if (data[name]) {
                    try {
                        module.fromJSON(data[name]);
                        loadedCount++;
                    }
                    catch (error) {
                        console.error(`[Persistence] Failed to restore module ${name}:`, error);
                    }
                }
            }
            if (manifest) {
                this.lastSaveTick = manifest.tick;
                this.events.emitSync({
                    type: 'state_loaded',
                    timestamp: manifest.tick,
                    data: { manifest, loadedModules: loadedCount },
                });
            }
            console.log(`[Persistence] Loaded ${loadedCount} modules from save.`);
            return true;
        }
        catch (error) {
            console.error('[Persistence] Load failed:', error);
            return false;
        }
    }
    /**
     * 自動保存チェック
     */
    checkAutoSave(tick, day) {
        if (tick - this.lastSaveTick >= this.config.autoSaveInterval) {
            this.save(tick, day).catch(err => {
                console.error('[Persistence] Auto-save failed:', err);
            });
            return true;
        }
        return false;
    }
    /**
     * 特定モジュールのデータを個別に保存
     */
    saveModuleData(moduleName, data, filename) {
        try {
            const dir = path.join(this.config.dataDir, moduleName);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const filePath = path.join(dir, filename);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
            return true;
        }
        catch (error) {
            console.error(`[Persistence] Failed to save module data ${moduleName}/${filename}:`, error);
            return false;
        }
    }
    /**
     * 特定モジュールのデータを読み込み
     */
    loadModuleData(moduleName, filename) {
        try {
            const filePath = path.join(this.config.dataDir, moduleName, filename);
            if (!fs.existsSync(filePath))
                return null;
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
        catch {
            return null;
        }
    }
    /**
     * バックアップローテーション
     */
    rotateBackups() {
        try {
            const backupDir = path.join(this.config.dataDir, 'backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            const statePath = path.join(this.config.dataDir, 'state.json');
            if (fs.existsSync(statePath)) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupPath = path.join(backupDir, `state-${timestamp}.json`);
                fs.copyFileSync(statePath, backupPath);
            }
            // 古いバックアップを削除
            const backups = fs.readdirSync(backupDir)
                .filter(f => f.startsWith('state-'))
                .sort()
                .reverse();
            for (let i = this.config.maxBackups; i < backups.length; i++) {
                fs.unlinkSync(path.join(backupDir, backups[i]));
            }
        }
        catch (error) {
            console.error('[Persistence] Backup rotation failed:', error);
        }
    }
    /**
     * ディレクトリの確保
     */
    ensureDirectories() {
        const dirs = [
            this.config.dataDir,
            path.join(this.config.dataDir, 'backups'),
            path.join(this.config.dataDir, 'knowledge'),
            path.join(this.config.dataDir, 'patterns'),
            path.join(this.config.dataDir, 'diary'),
            path.join(this.config.dataDir, 'memories'),
            path.join(this.config.dataDir, 'dreams'),
            path.join(this.config.dataDir, 'self'),
        ];
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }
    /**
     * ストレージ使用量を取得
     */
    getStorageSize() {
        let total = 0;
        const walk = (dir) => {
            if (!fs.existsSync(dir))
                return;
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    walk(fullPath);
                }
                else {
                    total += fs.statSync(fullPath).size;
                }
            }
        };
        walk(this.config.dataDir);
        return total;
    }
}
exports.PersistenceSystem = PersistenceSystem;
//# sourceMappingURL=PersistenceSystem.js.map