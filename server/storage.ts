import { 
  type Link, 
  type InsertLink, 
  type Click, 
  type InsertClick,
  type ButtonOwnership,
  type InsertButtonOwnership,
  type UpdateLink,
  type UpdateOwnershipVisuals
} from "@shared/schema";
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getSupabaseClient = (): SupabaseClient => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[0];
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials!");
    console.error("   Please set these environment variables in Vercel:");
    console.error("   - SUPABASE_URL");
    console.error("   - SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)");
    throw new Error("Database credentials not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables in your Vercel project settings.");
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

export interface IStorage {
  getCurrentLink(): Promise<Link | undefined>;
  createLink(link: InsertLink): Promise<Link>;
  getRecentClicks(limit?: number): Promise<Click[]>;
  getTotalClickCount(): Promise<number>;
  createClick(click: InsertClick): Promise<Click>;
  
  // Ownership methods
  createOwnership(ownership: InsertButtonOwnership): Promise<ButtonOwnership>;
  getActiveOwnership(): Promise<(ButtonOwnership & { link?: Link }) | undefined>;
  getOwnershipById(id: string): Promise<ButtonOwnership | undefined>;
  updateOwnershipLink(ownershipId: string, linkData: UpdateLink): Promise<Link>;
  updateOwnershipVisuals(ownershipId: string, visuals: UpdateOwnershipVisuals): Promise<ButtonOwnership>;
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

  async getTotalClickCount(): Promise<number> {
    try {
      const supabase = getSupabaseClient();
      const { count, error } = await supabase
        .from('clicks')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error("Error fetching click count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Error fetching click count:", error);
      return 0;
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
    let createdAt = data.created_at;
    
    if (createdAt instanceof Date) {
      createdAt = createdAt.toISOString();
    } else if (typeof createdAt === 'string') {
      const date = new Date(createdAt);
      if (!isNaN(date.getTime())) {
        createdAt = date.toISOString();
      }
    }
    
    return {
      id: data.id,
      ownershipId: data.ownership_id,
      url: data.url,
      submittedBy: data.submitted_by,
      submitterUsername: data.submitter_username,
      submitterPfpUrl: data.submitter_pfp_url,
      txHash: data.tx_hash,
      createdAt: createdAt,
    };
  }

  private mapOwnership(data: any): ButtonOwnership {
    const formatTimestamp = (timestamp: any): Date => {
      if (!timestamp) {
        return timestamp;
      }
      if (timestamp instanceof Date) {
        return timestamp;
      }
      if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      return timestamp;
    };

    return {
      id: data.id,
      ownerAddress: data.owner_address,
      txHash: data.tx_hash,
      startsAt: formatTimestamp(data.starts_at),
      expiresAt: formatTimestamp(data.expires_at),
      durationSeconds: data.duration_seconds,
      buttonColor: data.button_color || null,
      buttonEmoji: data.button_emoji || null,
      buttonImageUrl: data.button_image_url || null,
      createdAt: formatTimestamp(data.created_at),
    };
  }

  private mapClick(data: any): Click {
    let clickedAt = data.clicked_at;
    
    if (clickedAt instanceof Date) {
      clickedAt = clickedAt.toISOString();
    } else if (typeof clickedAt === 'string') {
      const date = new Date(clickedAt);
      if (!isNaN(date.getTime())) {
        clickedAt = date.toISOString();
      }
    }
    
    return {
      id: data.id,
      linkId: data.link_id,
      clickedBy: data.clicked_by,
      clickerUsername: data.clicker_username,
      clickerPfpUrl: data.clicker_pfp_url,
      userAgent: data.user_agent,
      clickedAt: clickedAt,
    };
  }

  async createOwnership(insertOwnership: InsertButtonOwnership): Promise<ButtonOwnership> {
    try {
      const supabase = getSupabaseClient();
      
      const startsAt = new Date();
      const expiresAt = new Date(startsAt.getTime() + insertOwnership.durationSeconds * 1000);
      
      const { data, error } = await supabase
        .from('button_ownerships')
        .insert({
          owner_address: insertOwnership.ownerAddress,
          tx_hash: insertOwnership.txHash,
          duration_seconds: insertOwnership.durationSeconds,
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating ownership:", error);
        throw new Error(`Failed to create ownership: ${error.message}`);
      }

      return this.mapOwnership(data);
    } catch (error) {
      console.error("Error creating ownership:", error);
      throw new Error(`Failed to create ownership: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async getActiveOwnership(): Promise<(ButtonOwnership & { link?: Link }) | undefined> {
    try {
      const supabase = getSupabaseClient();
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('button_ownerships')
        .select('*')
        .gte('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching active ownership:", error);
        return undefined;
      }

      if (!data) {
        return undefined;
      }

      const ownership = this.mapOwnership(data);

      const { data: linkData } = await supabase
        .from('links')
        .select('*')
        .eq('ownership_id', ownership.id)
        .single();

      return {
        ...ownership,
        link: linkData ? this.mapLink(linkData) : undefined
      };
    } catch (error) {
      console.error("Error fetching active ownership:", error);
      return undefined;
    }
  }

  async getOwnershipById(id: string): Promise<ButtonOwnership | undefined> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('button_ownerships')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching ownership by id:", error);
        return undefined;
      }

      return data ? this.mapOwnership(data) : undefined;
    } catch (error) {
      console.error("Error fetching ownership by id:", error);
      return undefined;
    }
  }

  async updateOwnershipLink(ownershipId: string, linkData: UpdateLink): Promise<Link> {
    try {
      const supabase = getSupabaseClient();
      
      const { data: existingLink, error: fetchError } = await supabase
        .from('links')
        .select('*')
        .eq('ownership_id', ownershipId)
        .single();

      if (existingLink) {
        const { data: updatedLink, error: updateError } = await supabase
          .from('links')
          .update({ url: linkData.url })
          .eq('ownership_id', ownershipId)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Failed to update link: ${updateError.message}`);
        }

        return this.mapLink(updatedLink);
      } else {
        const ownership = await this.getOwnershipById(ownershipId);
        if (!ownership) {
          throw new Error("Ownership not found");
        }

        const { data: newLink, error: createError } = await supabase
          .from('links')
          .insert({
            ownership_id: ownershipId,
            url: linkData.url,
            submitted_by: ownership.ownerAddress,
            tx_hash: ownership.txHash,
          })
          .select()
          .single();

        if (createError) {
          throw new Error(`Failed to create link: ${createError.message}`);
        }

        return this.mapLink(newLink);
      }
    } catch (error) {
      console.error("Error updating ownership link:", error);
      throw new Error(`Failed to update ownership link: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async updateOwnershipVisuals(ownershipId: string, visuals: UpdateOwnershipVisuals): Promise<ButtonOwnership> {
    try {
      const supabase = getSupabaseClient();
      
      const updateData: any = {};
      if (visuals.buttonColor !== undefined) {
        updateData.button_color = visuals.buttonColor || null;
      }
      if (visuals.buttonEmoji !== undefined) {
        updateData.button_emoji = visuals.buttonEmoji || null;
      }
      if (visuals.buttonImageUrl !== undefined) {
        updateData.button_image_url = visuals.buttonImageUrl || null;
      }

      const { data, error } = await supabase
        .from('button_ownerships')
        .update(updateData)
        .eq('id', ownershipId)
        .select()
        .single();

      if (error) {
        console.error("Error updating ownership visuals:", error);
        throw new Error(`Failed to update ownership visuals: ${error.message}`);
        }

      return this.mapOwnership(data);
    } catch (error) {
      console.error("Error updating ownership visuals:", error);
      throw error;
    }
  }
}

export const storage = new PostgresStorage();
