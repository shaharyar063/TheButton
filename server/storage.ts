import { type Link, type InsertLink, type Click, type InsertClick } from "@shared/schema";
import pg from "pg";
const { Pool } = pg;

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  return url;
};

let pool: pg.Pool;

const getPool = () => {
  if (!pool) {
    pool = new Pool({ 
      connectionString: getDatabaseUrl(),
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
};

export interface IStorage {
  getCurrentLink(): Promise<Link | undefined>;
  createLink(link: InsertLink): Promise<Link>;
  getRecentClicks(limit?: number): Promise<Click[]>;
  createClick(click: InsertClick): Promise<Click>;
}

export class PostgresStorage implements IStorage {
  async getCurrentLink(): Promise<Link | undefined> {
    try {
      const result = await getPool().query(
        "SELECT * FROM links ORDER BY created_at DESC LIMIT 1"
      );

      if (result.rows.length === 0) {
        return undefined;
      }

      return this.mapLink(result.rows[0]);
    } catch (error) {
      console.error("Error fetching current link:", error);
      return undefined;
    }
  }

  async createLink(insertLink: InsertLink): Promise<Link> {
    try {
      const result = await getPool().query(
        `INSERT INTO links (url, submitted_by, submitter_username, submitter_pfp_url, tx_hash) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [insertLink.url, insertLink.submittedBy, insertLink.submitterUsername, insertLink.submitterPfpUrl, insertLink.txHash]
      );

      return this.mapLink(result.rows[0]);
    } catch (error) {
      console.error("Error creating link:", error);
      throw new Error(`Failed to create link: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getRecentClicks(limit: number = 50): Promise<Click[]> {
    try {
      const result = await getPool().query(
        "SELECT * FROM clicks ORDER BY clicked_at DESC LIMIT $1",
        [limit]
      );

      return result.rows.map(this.mapClick);
    } catch (error) {
      console.error("Error fetching clicks:", error);
      return [];
    }
  }

  async createClick(insertClick: InsertClick): Promise<Click> {
    try {
      const result = await getPool().query(
        `INSERT INTO clicks (link_id, clicked_by, clicker_username, clicker_pfp_url, user_agent) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [insertClick.linkId, insertClick.clickedBy, insertClick.clickerUsername, insertClick.clickerPfpUrl, insertClick.userAgent]
      );

      return this.mapClick(result.rows[0]);
    } catch (error) {
      console.error("Error creating click:", error);
      throw new Error(`Failed to create click: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private mapLink(data: any): Link {
    return {
      id: data.id,
      url: data.url,
      submittedBy: data.submitted_by,
      submitterUsername: data.submitter_username,
      submitterPfpUrl: data.submitter_pfp_url,
      txHash: data.tx_hash,
      createdAt: data.created_at,
    };
  }

  private mapClick(data: any): Click {
    return {
      id: data.id,
      linkId: data.link_id,
      clickedBy: data.clicked_by,
      clickerUsername: data.clicker_username,
      clickerPfpUrl: data.clicker_pfp_url,
      userAgent: data.user_agent,
      clickedAt: data.clicked_at,
    };
  }
}

export const storage = new PostgresStorage();
