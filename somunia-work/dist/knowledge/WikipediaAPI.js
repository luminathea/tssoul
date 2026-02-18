"use strict";
/**
 * WikipediaAPI - Phase 6A: MediaWiki API実接続
 *
 * ja.wikipedia.orgのMediaWiki APIに直接接続し、
 * リアルタイムで記事を取得する。
 *
 * 設計思想:
 * - オンライン時はリアルAPI、オフライン時はスタブにフォールバック
 * - レート制限を遵守（1.2秒間隔）
 * - 取得した記事はディスク＋メモリにキャッシュ
 * - somuniaの興味に基づいた検索・探索が可能
 * - API応答をWikiArticle形式に正規化
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
exports.WikipediaAPI = void 0;
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DEFAULT_API_CONFIG = {
    language: 'ja',
    rateLimitMs: 1200,
    timeoutMs: 10000,
    userAgent: 'somunia-v10/1.0 (AI consciousness simulation; educational use)',
    enableCache: true,
    cacheDir: './somunia-data/wiki-cache',
    cacheTTL: 7 * 24 * 60 * 60 * 1000, // 1週間
    offlineMode: false,
    maxSections: 10,
    maxLinks: 30,
};
// ============================================================
// WikipediaAPI
// ============================================================
class WikipediaAPI {
    config;
    lastRequestTime = 0;
    status;
    memoryCache;
    constructor(config = {}) {
        this.config = { ...DEFAULT_API_CONFIG, ...config };
        this.status = {
            isOnline: !this.config.offlineMode,
            lastSuccessAt: null,
            lastFailureAt: null,
            totalRequests: 0,
            successCount: 0,
            failureCount: 0,
            cacheHits: 0,
            cachedArticles: 0,
            lastError: null,
        };
        this.memoryCache = new Map();
        if (this.config.enableCache) {
            this.ensureCacheDir();
            this.countCachedArticles();
        }
    }
    /** APIのベースURL */
    get baseUrl() {
        return `https://${this.config.language}.wikipedia.org/w/api.php`;
    }
    // ============================================================
    // メイン公開API
    // ============================================================
    /**
     * 記事を取得（メモリキャッシュ → ディスクキャッシュ → API）
     */
    async fetchArticle(title) {
        // 1. メモリキャッシュ
        const memoryCached = this.memoryCache.get(title);
        if (memoryCached && Date.now() - memoryCached.fetchedAt < this.config.cacheTTL) {
            this.status.cacheHits++;
            return memoryCached.article;
        }
        // 2. ディスクキャッシュ
        if (this.config.enableCache) {
            const diskCached = this.loadFromDiskCache(title);
            if (diskCached) {
                this.memoryCache.set(title, { article: diskCached, fetchedAt: Date.now() });
                this.status.cacheHits++;
                return diskCached;
            }
        }
        // 3. オフラインなら終了
        if (this.config.offlineMode)
            return null;
        // 4. APIから取得
        try {
            const article = await this.fetchFromAPI(title);
            if (article) {
                this.memoryCache.set(title, { article, fetchedAt: Date.now() });
                if (this.config.enableCache) {
                    this.saveToDiskCache(title, article);
                }
                return article;
            }
        }
        catch (error) {
            this.status.failureCount++;
            this.status.lastFailureAt = Date.now();
            this.status.lastError = error?.message || String(error);
        }
        return null;
    }
    /**
     * キーワードで記事を検索
     */
    async search(query, limit = 5) {
        if (this.config.offlineMode)
            return this.searchCache(query);
        await this.waitForRateLimit();
        const params = new URLSearchParams({
            action: 'query',
            list: 'search',
            srsearch: query,
            srlimit: String(limit),
            format: 'json',
            utf8: '1',
        });
        try {
            const data = await this.httpGet(`${this.baseUrl}?${params.toString()}`);
            const json = JSON.parse(data);
            this.recordSuccess();
            if (!json.query?.search)
                return [];
            return json.query.search.map((item) => ({
                title: item.title,
                snippet: this.stripHtml(item.snippet),
                pageId: item.pageid,
                wordCount: item.wordcount || 0,
            }));
        }
        catch (error) {
            this.recordFailure(error);
            return this.searchCache(query);
        }
    }
    /**
     * ランダム記事を取得
     */
    async fetchRandomArticle() {
        if (this.config.offlineMode)
            return this.getRandomFromCache();
        await this.waitForRateLimit();
        const params = new URLSearchParams({
            action: 'query',
            list: 'random',
            rnnamespace: '0',
            rnlimit: '1',
            format: 'json',
        });
        try {
            const data = await this.httpGet(`${this.baseUrl}?${params.toString()}`);
            const json = JSON.parse(data);
            this.recordSuccess();
            if (json.query?.random?.[0]) {
                return this.fetchArticle(json.query.random[0].title);
            }
        }
        catch (error) {
            this.recordFailure(error);
            return this.getRandomFromCache();
        }
        return null;
    }
    /**
     * 記事のリンク先を取得
     */
    async fetchLinks(title) {
        if (this.config.offlineMode) {
            const cached = this.memoryCache.get(title);
            return cached?.article.links || [];
        }
        await this.waitForRateLimit();
        const params = new URLSearchParams({
            action: 'query',
            titles: title,
            prop: 'links',
            pllimit: String(this.config.maxLinks),
            plnamespace: '0',
            format: 'json',
        });
        try {
            const data = await this.httpGet(`${this.baseUrl}?${params.toString()}`);
            const json = JSON.parse(data);
            this.recordSuccess();
            const pages = json.query?.pages;
            if (!pages)
                return [];
            const pageId = Object.keys(pages)[0];
            return (pages[pageId]?.links || [])
                .map((l) => l.title)
                .slice(0, this.config.maxLinks);
        }
        catch (error) {
            this.recordFailure(error);
            return [];
        }
    }
    /**
     * 記事のカテゴリを取得
     */
    async fetchCategories(title) {
        if (this.config.offlineMode)
            return [];
        await this.waitForRateLimit();
        const params = new URLSearchParams({
            action: 'query',
            titles: title,
            prop: 'categories',
            cllimit: '20',
            format: 'json',
        });
        try {
            const data = await this.httpGet(`${this.baseUrl}?${params.toString()}`);
            const json = JSON.parse(data);
            this.recordSuccess();
            const pages = json.query?.pages;
            if (!pages)
                return [];
            const pageId = Object.keys(pages)[0];
            return (pages[pageId]?.categories || [])
                .map((c) => (c.title || '').replace(/^Category:|^カテゴリ:/, ''))
                .filter((c) => c && !c.includes('Wikipedia') && !c.includes('出典'));
        }
        catch (error) {
            this.recordFailure(error);
            return [];
        }
    }
    // ============================================================
    // API実接続
    // ============================================================
    /**
     * MediaWiki parse APIで記事本文を取得しWikiArticleに変換
     */
    async fetchFromAPI(title) {
        await this.waitForRateLimit();
        // parse API で本文・セクション・カテゴリ・リンクをまとめて取得
        const params = new URLSearchParams({
            action: 'parse',
            page: title,
            prop: 'text|sections|categories|links',
            format: 'json',
            utf8: '1',
        });
        const data = await this.httpGet(`${this.baseUrl}?${params.toString()}`);
        const json = JSON.parse(data);
        this.recordSuccess();
        if (json.error) {
            return null;
        }
        const parse = json.parse;
        if (!parse)
            return null;
        // HTMLからプレーンテキスト抽出
        const htmlText = parse.text?.['*'] || '';
        const plainText = this.htmlToPlainText(htmlText);
        // セクション構造化
        const sections = this.parseSections(parse.sections || [], plainText);
        // 要約抽出
        const summary = this.extractSummary(plainText);
        // カテゴリ
        const categories = (parse.categories || [])
            .map((c) => c['*'] || '')
            .filter((c) => c && !c.includes('Wikipedia') && !c.includes('出典'))
            .slice(0, 10);
        // リンク
        const links = (parse.links || [])
            .filter((l) => l.ns === 0 && l.exists !== undefined)
            .map((l) => l['*'])
            .slice(0, this.config.maxLinks);
        return {
            title: parse.title || title,
            url: `https://${this.config.language}.wikipedia.org/wiki/${encodeURIComponent(title)}`,
            summary,
            sections: sections.slice(0, this.config.maxSections),
            categories,
            links,
            fetchedAt: Date.now(),
            language: this.config.language,
        };
    }
    // ============================================================
    // HTMLパーサー
    // ============================================================
    htmlToPlainText(html) {
        let text = html;
        // 不要ブロックを除去
        text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        text = text.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, '');
        text = text.replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '');
        text = text.replace(/<div class="reflist[\s\S]*?<\/div>/gi, '');
        text = text.replace(/<div class="navbox[\s\S]*?<\/div>/gi, '');
        text = text.replace(/<span class="mw-editsection[\s\S]*?<\/span>/gi, '');
        // 見出しをマーカーに変換
        text = text.replace(/<h2[^>]*>(?:<span[^>]*>)?([^<]*)(?:<\/span>)?<\/h2>/gi, '\n##SECTION:$1##\n');
        text = text.replace(/<h3[^>]*>(?:<span[^>]*>)?([^<]*)(?:<\/span>)?<\/h3>/gi, '\n###SUB:$1###\n');
        text = text.replace(/<h[2-6][^>]*>(.*?)<\/h[2-6]>/gi, '\n##SECTION:$1##\n');
        // ブロック要素を改行に
        text = text.replace(/<br\s*\/?>/gi, '\n');
        text = text.replace(/<\/p>/gi, '\n\n');
        text = text.replace(/<p[^>]*>/gi, '');
        text = text.replace(/<li[^>]*>/gi, '・');
        text = text.replace(/<\/li>/gi, '\n');
        // 残りのタグ除去
        text = text.replace(/<[^>]+>/g, '');
        // HTMLエンティティ
        text = text.replace(/&amp;/g, '&');
        text = text.replace(/&lt;/g, '<');
        text = text.replace(/&gt;/g, '>');
        text = text.replace(/&quot;/g, '"');
        text = text.replace(/&#39;/g, "'");
        text = text.replace(/&nbsp;/g, ' ');
        text = text.replace(/&#\d+;/g, '');
        // 整形
        text = text.replace(/\n{3,}/g, '\n\n');
        text = text.replace(/[ \t]+/g, ' ');
        return text.trim();
    }
    extractSummary(plainText) {
        const lines = plainText.split('\n').filter(l => l.trim().length > 0);
        const parts = [];
        for (const line of lines) {
            if (line.startsWith('##SECTION:') || line.startsWith('###SUB:'))
                break;
            if (line.trim().length > 10)
                parts.push(line.trim());
            if (parts.join('').length > 300)
                break;
        }
        return parts.join(' ').substring(0, 500);
    }
    parseSections(apiSections, plainText) {
        const sections = [];
        const textLines = plainText.split('\n');
        let currentSection = null;
        for (const line of textLines) {
            const sectionMatch = line.match(/^##SECTION:(.+)##$/);
            if (sectionMatch) {
                if (currentSection && currentSection.content.length > 0) {
                    const content = currentSection.content.join('\n').trim();
                    if (content.length > 20) {
                        sections.push({ heading: currentSection.heading, content: content.substring(0, 2000) });
                    }
                }
                currentSection = { heading: sectionMatch[1].trim(), content: [] };
                continue;
            }
            const subMatch = line.match(/^###SUB:(.+)###$/);
            if (subMatch) {
                if (currentSection)
                    currentSection.content.push(`\n【${subMatch[1].trim()}】`);
                continue;
            }
            if (currentSection && line.trim().length > 0) {
                currentSection.content.push(line.trim());
            }
        }
        if (currentSection && currentSection.content.length > 0) {
            const content = currentSection.content.join('\n').trim();
            if (content.length > 20) {
                sections.push({ heading: currentSection.heading, content: content.substring(0, 2000) });
            }
        }
        const exclude = ['脚注', '参考文献', '出典', '外部リンク', '関連項目', 'See also', 'References', 'Notes'];
        return sections.filter(s => !exclude.some(p => s.heading.includes(p)));
    }
    // ============================================================
    // HTTP通信
    // ============================================================
    httpGet(url) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'User-Agent': this.config.userAgent,
                    'Accept': 'application/json',
                    'Accept-Encoding': 'identity',
                },
                timeout: this.config.timeoutMs,
            };
            const protocol = urlObj.protocol === 'https:' ? https : http;
            const req = protocol.request(options, (res) => {
                let data = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    }
                    else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
                    }
                });
            });
            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
            req.end();
        });
    }
    // ============================================================
    // レート制限
    // ============================================================
    async waitForRateLimit() {
        const elapsed = Date.now() - this.lastRequestTime;
        if (elapsed < this.config.rateLimitMs) {
            await new Promise(resolve => setTimeout(resolve, this.config.rateLimitMs - elapsed));
        }
        this.lastRequestTime = Date.now();
    }
    // ============================================================
    // 統計記録
    // ============================================================
    recordSuccess() {
        this.status.totalRequests++;
        this.status.successCount++;
        this.status.lastSuccessAt = Date.now();
        this.status.isOnline = true;
        this.status.lastError = null;
    }
    recordFailure(error) {
        this.status.totalRequests++;
        this.status.failureCount++;
        this.status.lastFailureAt = Date.now();
        this.status.isOnline = false;
        this.status.lastError = error?.message || String(error);
    }
    // ============================================================
    // ディスクキャッシュ
    // ============================================================
    loadFromDiskCache(title) {
        try {
            const filePath = this.getCachePath(title);
            if (!fs.existsSync(filePath))
                return null;
            const stat = fs.statSync(filePath);
            if (Date.now() - stat.mtimeMs > this.config.cacheTTL)
                return null;
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
        catch {
            return null;
        }
    }
    saveToDiskCache(title, article) {
        try {
            const filePath = this.getCachePath(title);
            fs.writeFileSync(filePath, JSON.stringify(article, null, 2), 'utf-8');
            this.status.cachedArticles++;
        }
        catch { /* ignore */ }
    }
    searchCache(query) {
        const results = [];
        const q = query.toLowerCase();
        for (const [title, cached] of this.memoryCache.entries()) {
            if (title.toLowerCase().includes(q) || cached.article.summary.toLowerCase().includes(q)) {
                results.push({ title, snippet: cached.article.summary.substring(0, 100), pageId: 0, wordCount: cached.article.summary.length });
            }
            if (results.length >= 10)
                break;
        }
        if (this.config.enableCache) {
            try {
                if (fs.existsSync(this.config.cacheDir)) {
                    for (const file of fs.readdirSync(this.config.cacheDir).filter(f => f.endsWith('.json'))) {
                        const t = decodeURIComponent(file.replace('.json', ''));
                        if (t.toLowerCase().includes(q) && !results.find(r => r.title === t)) {
                            results.push({ title: t, snippet: '', pageId: 0, wordCount: 0 });
                        }
                        if (results.length >= 10)
                            break;
                    }
                }
            }
            catch { /* ignore */ }
        }
        return results;
    }
    getRandomFromCache() {
        const cached = Array.from(this.memoryCache.values());
        return cached.length > 0 ? cached[Math.floor(Math.random() * cached.length)].article : null;
    }
    getCachePath(title) {
        const safeName = encodeURIComponent(title).replace(/%/g, '_');
        return path.join(this.config.cacheDir, `${safeName}.json`);
    }
    ensureCacheDir() {
        if (!fs.existsSync(this.config.cacheDir)) {
            fs.mkdirSync(this.config.cacheDir, { recursive: true });
        }
    }
    countCachedArticles() {
        try {
            if (fs.existsSync(this.config.cacheDir)) {
                this.status.cachedArticles = fs.readdirSync(this.config.cacheDir).filter(f => f.endsWith('.json')).length;
            }
        }
        catch { /* ignore */ }
    }
    stripHtml(html) {
        return html.replace(/<[^>]+>/g, '').replace(/&\w+;/g, '').trim();
    }
    // ============================================================
    // 公開ユーティリティ
    // ============================================================
    getStatus() { return { ...this.status }; }
    setOfflineMode(offline) {
        this.config.offlineMode = offline;
        this.status.isOnline = !offline;
    }
    async testConnection() {
        try {
            const params = new URLSearchParams({ action: 'query', meta: 'siteinfo', format: 'json' });
            await this.httpGet(`${this.baseUrl}?${params.toString()}`);
            this.status.isOnline = true;
            return true;
        }
        catch {
            this.status.isOnline = false;
            return false;
        }
    }
    clearCache() {
        this.memoryCache.clear();
        if (this.config.enableCache && fs.existsSync(this.config.cacheDir)) {
            try {
                for (const file of fs.readdirSync(this.config.cacheDir)) {
                    fs.unlinkSync(path.join(this.config.cacheDir, file));
                }
            }
            catch { /* ignore */ }
        }
        this.status.cachedArticles = 0;
        this.status.cacheHits = 0;
    }
    toJSON() {
        return { config: this.config, status: this.status };
    }
    fromJSON(data) {
        if (data?.config)
            this.config = { ...this.config, ...data.config };
        if (data?.status)
            this.status = { ...this.status, ...data.status };
    }
}
exports.WikipediaAPI = WikipediaAPI;
//# sourceMappingURL=WikipediaAPI.js.map