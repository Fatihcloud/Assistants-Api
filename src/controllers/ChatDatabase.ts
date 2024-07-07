import Database from 'better-sqlite3';

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Thread {
  thread_id: string;
}

export class ChatDatabase {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initDb();
  }

  private initDb() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        thread_id TEXT,
        role TEXT,
        content TEXT
      )`;
    this.db.prepare(createTableQuery).run();
  }

  public saveMessage(threadId: string, message: Message) {
    const insertQuery = 'INSERT INTO messages (thread_id, role, content) VALUES (?, ?, ?)';
    try {
      this.db.prepare(insertQuery).run(threadId, message.role, message.content);
    } catch (error) {
      console.error('Error saving message to database:', error);
    }
  }

  public loadMessages(threadId: string): Message[] {
    const selectQuery = 'SELECT role, content FROM messages WHERE thread_id = ? ORDER BY id ASC';
    try {
      const rows = this.db.prepare(selectQuery).all(threadId);
      return rows as Message[];
    } catch (error) {
      console.error('Error loading messages from database:', error);
      return [];
    }
  }

  public getAllThreadIds(): string[] {
    const selectQuery = 'SELECT DISTINCT thread_id FROM messages ORDER BY thread_id ASC';
    try {
      const rows = this.db.prepare(selectQuery).all() as Thread[];
      return rows.map(row => row.thread_id);
    } catch (error) {
      console.error('Error getting thread IDs from database:', error);
      return [];
    }
  }
}
