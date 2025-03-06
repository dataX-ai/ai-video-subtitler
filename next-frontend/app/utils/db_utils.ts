import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function initializeDatabase() {
    if (db) return db;
    
    // Use the mounted database directory from Docker
    const dbPath = path.join('/app/database', 'database.sqlite');
    
    // Ensure the database directory exists
    const dbDir = path.dirname(dbPath);
    
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Create tables if they don't exist
    await db.exec(`
        CREATE TABLE IF NOT EXISTS ratelimit (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT NOT NULL,
            count INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(ip)
        );
    `);

    return db;
}

export async function closeDatabase() {
    if (db) {
        await db.close();
        db = null;
    }
}

// Video related functions
export async function insertVideo(id: string, title: string, url: string) {
    const db = await initializeDatabase();
    return db.run(
        'INSERT INTO videos (id, title, url) VALUES (?, ?, ?)',
        [id, title, url]
    );
}

export async function getVideo(id: string) {
    const db = await initializeDatabase();
    return db.get('SELECT * FROM videos WHERE id = ?', [id]);
}

export async function getAllVideos() {
    const db = await initializeDatabase();
    return db.all('SELECT * FROM videos ORDER BY created_at DESC');
}

// Subtitle related functions
export async function insertSubtitles(videoId: string, subtitles: Array<{ content: string, timestamp: number }>) {
    const db = await initializeDatabase();
    const stmt = await db.prepare(
        'INSERT INTO subtitles (video_id, content, timestamp) VALUES (?, ?, ?)'
    );
    
    for (const subtitle of subtitles) {
        await stmt.run(videoId, subtitle.content, subtitle.timestamp);
    }
    
    await stmt.finalize();
}

export async function getSubtitles(videoId: string) {
    const db = await initializeDatabase();
    return db.all(
        'SELECT * FROM subtitles WHERE video_id = ? ORDER BY timestamp',
        [videoId]
    );
}

// Rate limit related functions
export async function incrementRateLimit(ip: string) {
    const db = await initializeDatabase();
    return db.run(`
        INSERT INTO ratelimit (ip, count) 
        VALUES (?, 1)
        ON CONFLICT(ip) 
        DO UPDATE SET 
            count = count + 1,
            created_at = CURRENT_TIMESTAMP
    `, [ip]);
}

export async function getRateLimit(ip: string) {
    const db = await initializeDatabase();
    return db.get('SELECT * FROM ratelimit WHERE ip = ?', [ip]);
}

export async function resetRateLimit(ip: string) {
    const db = await initializeDatabase();
    return db.run('DELETE FROM ratelimit WHERE ip = ?', [ip]);
} 