import { type Link, type InsertLink, type Click, type InsertClick } from "@shared/schema";
import { neon } from '@neondatabase/serverless';

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  return url;
};

let sqlClient: ReturnType<typeof neon> | null = null;

const getSqlClient = () => {
  if (!sqlClient) {
    sqlClient = neon(getDatabaseUrl());
  }
  return sqlClient;
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
      const sql = getSqlClient();
      const result = await sql`SELECT * FROM links ORDER BY created_at DESC LIMIT 1` as any[];

      if (result.length === 0) {
        return undefined;
      }

      return this.mapLink(result[0]);
    } catch (error) {
      console.error("Error fetching current link:", error);
      return undefined;
    }
  }

  async createLink(insertLink: InsertLink): Promise<Link> {
    try {
      const sql = getSqlClient();
      const result = await sql`
        INSERT INTO links (url, submitted_by, submitter_username, submitter_pfp_url, tx_hash) 
        VALUES (${insertLink.url}, ${insertLink.submittedBy}, ${insertLink.submitterUsername}, ${insertLink.submitterPfpUrl}, ${insertLink.txHash}) 
        RETURNING *
      ` as any[];

      return this.mapLink(result[0]);
    } catch (error) {
      console.error("Error creating link:", error);
      throw new Error(`Failed to create link: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getRecentClicks(limit: number = 50): Promise<Click[]> {
    try {
      const sql = getSqlClient();
      const result = await sql`SELECT * FROM clicks ORDER BY clicked_at DESC LIMIT ${limit}` as any[];

      return result.map(this.mapClick);
    } catch (error) {
      console.error("Error fetching clicks:", error);
      return [];
    }
  }

  async createClick(insertClick: InsertClick): Promise<Click> {
    try {
      const sql = getSqlClient();
      const result = await sql`
        INSERT INTO clicks (link_id, clicked_by, clicker_username, clicker_pfp_url, user_agent) 
        VALUES (${insertClick.linkId}, ${insertClick.clickedBy}, ${insertClick.clickerUsername}, ${insertClick.clickerPfpUrl}, ${insertClick.userAgent}) 
        RETURNING *
      ` as any[];

      return this.mapClick(result[0]);
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
