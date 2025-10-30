import { type Link, type InsertLink, type Click, type InsertClick } from "@shared/schema";
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getSupabaseClient = (): SupabaseClient => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[0];
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) environment variables are required");
  }
  
  return createClient(supabaseUrl, supabaseKey);
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
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching current link:", error);
        return undefined;
      }

      return data ? this.mapLink(data) : undefined;
    } catch (error) {
      console.error("Error fetching current link:", error);
      return undefined;
    }
  }

  async createLink(insertLink: InsertLink): Promise<Link> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('links')
        .insert({
          url: insertLink.url,
          submitted_by: insertLink.submittedBy,
          submitter_username: insertLink.submitterUsername,
          submitter_pfp_url: insertLink.submitterPfpUrl,
          tx_hash: insertLink.txHash
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating link:", error);
        throw new Error(`Failed to create link: ${error.message}`);
      }

      return this.mapLink(data);
    } catch (error) {
      console.error("Error creating link:", error);
      throw new Error(`Failed to create link: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getRecentClicks(limit: number = 50): Promise<Click[]> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('clicks')
        .select('*')
        .order('clicked_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching clicks:", error);
        return [];
      }

      return data ? data.map(this.mapClick) : [];
    } catch (error) {
      console.error("Error fetching clicks:", error);
      return [];
    }
  }

  async createClick(insertClick: InsertClick): Promise<Click> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('clicks')
        .insert({
          link_id: insertClick.linkId,
          clicked_by: insertClick.clickedBy,
          clicker_username: insertClick.clickerUsername,
          clicker_pfp_url: insertClick.clickerPfpUrl,
          user_agent: insertClick.userAgent
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating click:", error);
        throw new Error(`Failed to create click: ${error.message}`);
      }

      return this.mapClick(data);
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
