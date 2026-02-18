/**
 * PersistenceSystem - somunia v10 永続化システム
 * 
 * somuniaの全状態をディスクに保存・復元する。
 * 自動保存、手動保存、バックアップローテーション。
 * データは100GBになっても構わないという設計思想。
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventBus, eventBus } from '../core/EventBus';
import { Tick } from '../types';

// ============================================================
// 型定義
// ============================================================

export interface PersistenceConfig {
  /** データ保存先ディレクトリ */
  dataDir: string;
  /** 自動保存間隔（ティック） */
  autoSaveInterval: number;
  /** バックアップ数 */
  maxBackups: number;
  /** 圧縮するか */
  compress: boolean;
}

const DEFAULT_CONFIG: PersistenceConfig = {
  dataDir: './somunia-data',
  autoSaveInterval: 60,
  maxBackups: 10,
  compress: false,
};

interface SaveManifest {
  version: string;
  savedAt: string;
  tick: number;
  day: number;
  modules: string[];
  size: number;
}

// ============================================================
// PersistenceSystem
// ============================================================

export class PersistenceSystem {
  private config: PersistenceConfig;
  private modules: Map<string, { toJSON: () => object; fromJSON: (data: any) => void }> = new Map();
  private lastSaveTick: Tick = 0;
  private events: EventBus;

  constructor(config: Partial<PersistenceConfig> = {}, events?: EventBus) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.events = events || eventBus;
    this.ensureDirectories();
  }

  /**
   * 保存対象のモジュールを登録
   */
  registerModule(name: string, module: { toJSON: () => object; fromJSON: (data: any) => void }): void {
    this.modules.set(name, module);
  }

  /**
   * 全状態を保存
   */
  async save(tick: Tick, day: number): Promise<boolean> {
    try {
      const data: Record<string, any> = {};
      const moduleNames: string[] = [];

      for (const [name, module] of this.modules.entries()) {
        try {
          data[name] = module.toJSON();
          moduleNames.push(name);
        } catch (error) {
          console.error(`[Persistence] Failed to serialize module ${name}:`, error);
        }
      }

      // マニフェスト
      const manifest: SaveManifest = {
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
    } catch (error) {
      console.error('[Persistence] Save failed:', error);
      return false;
    }
  }

  /**
   * 状態を復元
   */
  async load(): Promise<boolean> {
    try {
      const statePath = path.join(this.config.dataDir, 'state.json');
      const manifestPath = path.join(this.config.dataDir, 'manifest.json');

      if (!fs.existsSync(statePath)) {
        console.log('[Persistence] No saved state found.');
        return false;
      }

      const stateJson = fs.readFileSync(statePath, 'utf-8');
      const data = JSON.parse(stateJson);

      let manifest: SaveManifest | null = null;
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
          } catch (error) {
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
    } catch (error) {
      console.error('[Persistence] Load failed:', error);
      return false;
    }
  }

  /**
   * 自動保存チェック
   */
  checkAutoSave(tick: Tick, day: number): boolean {
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
  saveModuleData(moduleName: string, data: any, filename: string): boolean {
    try {
      const dir = path.join(this.config.dataDir, moduleName);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const filePath = path.join(dir, filename);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error(`[Persistence] Failed to save module data ${moduleName}/${filename}:`, error);
      return false;
    }
  }

  /**
   * 特定モジュールのデータを読み込み
   */
  loadModuleData(moduleName: string, filename: string): any | null {
    try {
      const filePath = path.join(this.config.dataDir, moduleName, filename);
      if (!fs.existsSync(filePath)) return null;
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      return null;
    }
  }

  /**
   * バックアップローテーション
   */
  private rotateBackups(): void {
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
    } catch (error) {
      console.error('[Persistence] Backup rotation failed:', error);
    }
  }

  /**
   * ディレクトリの確保
   */
  private ensureDirectories(): void {
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
  getStorageSize(): number {
    let total = 0;
    const walk = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else {
          total += fs.statSync(fullPath).size;
        }
      }
    };
    walk(this.config.dataDir);
    return total;
  }
}
