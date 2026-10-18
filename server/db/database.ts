import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve database storage directory
const DATA_DIR = path.resolve(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'navifreight.db');

export class DatabaseManager {
  private static instance: DatabaseManager;
  public db: DatabaseSync;

  private constructor() {
    this.db = new DatabaseSync(DB_PATH);
    this.initialize();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private initialize(): void {
    try {
      // 1. Run Schema Migrations
      const schemaPath = path.resolve(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        this.db.exec(schemaSql);
      }

      // 2. Execute seed migrations to ensure all ports and fleet vessels are up to date
      const seedPath = path.resolve(__dirname, 'seed.sql');
      if (fs.existsSync(seedPath)) {
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        this.db.exec(seedSql);
        const checkStmt = this.db.prepare('SELECT COUNT(*) as count FROM ports');
        const row = checkStmt.get() as { count: number } | undefined;
        console.log(`📊 NaviFreight database synced with ${row?.count || 0} commercial ports.`);
      }
    } catch (error) {
      console.error('❌ Database initialization error:', error);
    }
  }

  public query<T = any>(sql: string, params: any[] = []): T[] {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  public get<T = any>(sql: string, params: any[] = []): T | undefined {
    const stmt = this.db.prepare(sql);
    return stmt.get(...params) as T | undefined;
  }

  public run(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number | bigint } {
    const stmt = this.db.prepare(sql);
    return stmt.run(...params);
  }
}

export const dbManager = DatabaseManager.getInstance();
export const db = dbManager.db;
