const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { createPublicClient, http } = require('viem');
const { base } = require('viem/chains');

// Vercel runtime configuration - use Node.js instead of Edge
exports.config = {
  runtime: 'nodejs20.x'
};

// Transaction verification utilities
const BASE_MAINNET_RPC = process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org";
const OWNER_WALLET = (process.env.OWNER_WALLET_ADDRESS || "0x31F02Ed2c900A157C851786B43772F86151C7E34").toLowerCase();
const REQUIRED_AMOUNT = BigInt(10000000000000);

const publicClient = createPublicClient({
  chain: base,
  transport: http(BASE_MAINNET_RPC),
});

function isValidTxHash(hash) {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchTransactionWithRetry(txHash, maxRetries = 20, baseDelay = 2000) {
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const [receipt, transaction] = await Promise.all([
        publicClient.getTransactionReceipt({ hash: txHash }),
        publicClient.getTransaction({ hash: txHash }),
      ]);

      console.log(`✓ Transaction found after ${attempt + 1} attempt(s)`);
      return { receipt, transaction };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorMessage = lastError.message.toLowerCase();
      
      const isRetryableError = 
        errorMessage.includes("not found") ||
        errorMessage.includes("not available") ||
        errorMessage.includes("could not find") ||
        errorMessage.includes("transaction not found") ||
        errorMessage.includes("receipt not found") ||
        errorMessage.includes("not be processed");

      if (!isRetryableError || attempt === maxRetries - 1) {
        throw lastError;
      }

      const delay = baseDelay * Math.pow(1.2, attempt);
      const remainingTime = Math.round((maxRetries - attempt - 1) * delay / 1000);
      console.log(`⏳ Waiting for blockchain to index transaction... (${attempt + 1}/${maxRetries}, ~${remainingTime}s remaining)`);
      await sleep(delay);
    }
  }

  throw lastError || new Error("Failed to fetch transaction after retries");
}

async function verifyETHPayment(txHash) {
  try {
    if (!isValidTxHash(txHash)) {
      return { isValid: false, error: "Invalid transaction hash format" };
    }

    const { receipt, transaction } = await fetchTransactionWithRetry(txHash);

    if (receipt.status !== "success") {
      return { isValid: false, error: "Transaction failed on blockchain" };
    }

    const recipientAddress = transaction.to?.toLowerCase();
    const amount = transaction.value;

    if (recipientAddress !== OWNER_WALLET) {
      return { 
        isValid: false, 
        error: `Payment must be sent to ${OWNER_WALLET}, but was sent to ${recipientAddress}` 
      };
    }

    if (amount < REQUIRED_AMOUNT) {
      return { 
        isValid: false, 
        error: `Insufficient payment amount. Required: 0.00001 ETH, sent: ${Number(amount) / 1e18} ETH` 
      };
    }

    return {
      isValid: true,
      from: transaction.from,
      to: recipientAddress,
      amount,
    };
  } catch (error) {
    console.error("Error verifying transaction:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to verify transaction";
    
    if (errorMessage.toLowerCase().includes("not found")) {
      return { 
        isValid: false, 
        error: "Transaction not found on Base Mainnet blockchain after waiting up to 60 seconds. Please check:\n\n1. Is your wallet connected to Base Mainnet (Chain ID: 8453)?\n2. Has the transaction been confirmed on the blockchain?\n3. Did you copy the correct transaction hash?\n\nVerify your transaction at: https://basescan.org/tx/[your-tx-hash]\n\nIf the transaction just happened, please wait a minute and try again." 
      };
    }
    
    return { 
      isValid: false, 
      error: errorMessage
    };
  }
}

const storage = (() => {
  const getSupabaseClient = () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Database credentials not configured");
    }
    
    return createClient(supabaseUrl, supabaseKey);
  };

  const mapLink = (data) => {
    // Ensure timestamp is in proper ISO format for JavaScript Date parsing
    let createdAt = data.created_at;
    
    // If it's already a Date object or timestamp, convert to ISO string
    if (createdAt instanceof Date) {
      createdAt = createdAt.toISOString();
    } else if (typeof createdAt === 'string') {
      // Parse and re-format to ensure consistent ISO format
      const date = new Date(createdAt);
      if (!isNaN(date.getTime())) {
        createdAt = date.toISOString();
      }
    }
    
    return {
      id: data.id,
      url: data.url,
      submittedBy: data.submitted_by,
      submitterUsername: data.submitter_username,
      submitterPfpUrl: data.submitter_pfp_url,
      txHash: data.tx_hash,
      createdAt: createdAt,
    };
  };

  const mapClick = (data) => {
    // Ensure timestamp is in proper ISO format for JavaScript Date parsing
    let clickedAt = data.clicked_at;
    
    // If it's already a Date object or timestamp, convert to ISO string
    if (clickedAt instanceof Date) {
      clickedAt = clickedAt.toISOString();
    } else if (typeof clickedAt === 'string') {
      // Parse and re-format to ensure consistent ISO format
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
  };

  const mapOwnership = (data) => {
    const formatTimestamp = (timestamp) => {
      if (timestamp instanceof Date) {
        return timestamp.toISOString();
      } else if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
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
      createdAt: formatTimestamp(data.created_at),
    };
  };

  return {
    async getCurrentLink() {
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

        return data ? mapLink(data) : undefined;
      } catch (error) {
        console.error("Error fetching current link:", error);
        return undefined;
      }
    },

    async createLink(insertLink) {
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
          throw new Error(`Failed to create link: ${error.message}`);
        }

        return mapLink(data);
      } catch (error) {
        throw error;
      }
    },

    async getRecentClicks(limit = 50) {
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

        return data ? data.map(mapClick) : [];
      } catch (error) {
        console.error("Error fetching clicks:", error);
        return [];
      }
    },

    async createClick(insertClick) {
      try {
        const supabase = getSupabaseClient();
        const { data, error} = await supabase
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
          throw new Error(`Failed to create click: ${error.message}`);
        }

        return mapClick(data);
      } catch (error) {
        throw error;
      }
    },

    async createOwnership(insertOwnership) {
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
          throw new Error(`Failed to create ownership: ${error.message}`);
        }

        return mapOwnership(data);
      } catch (error) {
        throw error;
      }
    },

    async getActiveOwnership() {
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

        const ownership = mapOwnership(data);

        const { data: linkData } = await supabase
          .from('links')
          .select('*')
          .eq('ownership_id', ownership.id)
          .single();

        return {
          ...ownership,
          link: linkData ? mapLink(linkData) : undefined
        };
      } catch (error) {
        console.error("Error fetching active ownership:", error);
        return undefined;
      }
    },

    async getOwnershipById(id) {
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

        return data ? mapOwnership(data) : undefined;
      } catch (error) {
        console.error("Error fetching ownership by id:", error);
        return undefined;
      }
    },

    async updateOwnershipLink(ownershipId, linkData) {
      try {
        const supabase = getSupabaseClient();
        
        const { data: existingLink } = await supabase
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

          return mapLink(updatedLink);
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

          return mapLink(newLink);
        }
      } catch (error) {
        throw error;
      }
    }
  };
})();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const getBaseUrl = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:5000';
};

app.get("/api/base-url", async (req, res) => {
  try {
    const baseUrl = getBaseUrl();
    res.json({ baseUrl });
  } catch (error) {
    console.error("Error fetching base URL:", error);
    res.status(500).json({ error: "Failed to fetch base URL" });
  }
});

app.get("/api/current-link", async (req, res) => {
  try {
    const link = await storage.getCurrentLink();
    
    if (!link) {
      return res.status(404).json({ error: "No link available yet" });
    }

    res.json(link);
  } catch (error) {
    console.error("Error fetching current link:", error);
    res.status(500).json({ error: "Failed to fetch current link" });
  }
});

app.get("/api/recent-clicks", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const clicks = await storage.getRecentClicks(limit);
    res.json(clicks);
  } catch (error) {
    console.error("Error fetching clicks:", error);
    res.status(500).json({ error: "Failed to fetch clicks" });
  }
});

app.post("/api/links", async (req, res) => {
  try {
    const { url, txHash, submittedBy, submitterUsername, submitterPfpUrl } = req.body;

    // Basic validation
    if (!url || !txHash || !submittedBy) {
      return res.status(400).json({ 
        error: "Missing required fields: url, txHash, and submittedBy are required" 
      });
    }

    // Validate transaction hash format
    if (!isValidTxHash(txHash)) {
      return res.status(400).json({ 
        error: "Invalid transaction hash format. Must be 66 characters starting with 0x" 
      });
    }

    // STEP 1: Check if transaction has already been used (before blockchain verification)
    console.log(`🔍 Checking if transaction ${txHash} has already been used...`);
    const supabase = storage.getCurrentLink.__proto__.constructor.name === 'AsyncFunction' 
      ? (() => {
          const supabaseUrl = process.env.SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
          if (!supabaseUrl || !supabaseKey) throw new Error("Database not configured");
          return createClient(supabaseUrl, supabaseKey);
        })()
      : null;
    
    if (supabase) {
      const { data: existingLink, error: checkError } = await supabase
        .from('links')
        .select('id, tx_hash')
        .eq('tx_hash', txHash)
        .maybeSingle();
      
      if (existingLink) {
        console.log(`❌ Transaction ${txHash} has already been used`);
        return res.status(400).json({ 
          error: "This transaction has already been used to submit a link. Each transaction can only be used once." 
        });
      }
      console.log(`✓ Transaction is new and hasn't been used before`);
    }

    // STEP 2: Verify the payment on blockchain
    console.log(`🔗 Verifying transaction on Base Mainnet blockchain: ${txHash}`);
    console.log(`⏳ This may take up to 60 seconds if the transaction is very recent...`);
    
    const verification = await verifyETHPayment(txHash);
    
    if (!verification.isValid) {
      console.error(`❌ Transaction verification failed: ${verification.error}`);
      return res.status(400).json({ 
        error: verification.error || "Transaction verification failed" 
      });
    }

    // STEP 3: Verify sender matches the claimed submitter
    if (verification.from?.toLowerCase() !== submittedBy.toLowerCase()) {
      console.error(`❌ Submitter address mismatch: claimed ${submittedBy}, actual ${verification.from}`);
      return res.status(400).json({ 
        error: "Submitter address does not match transaction sender. Please ensure you're submitting with the same wallet that sent the payment." 
      });
    }

    console.log(`✅ Transaction verified successfully from ${verification.from}`);
    console.log(`💾 Saving link to database...`);
    
    // STEP 4: Save to database
    const link = await storage.createLink({
      url,
      txHash,
      submittedBy,
      submitterUsername,
      submitterPfpUrl
    });
    
    console.log(`✅ Link created successfully with ID: ${link.id}`);
    res.status(201).json(link);
  } catch (error) {
    console.error("❌ Error creating link:", error);
    
    // Handle duplicate transaction error (database constraint)
    if (error instanceof Error && (
      error.message.includes("duplicate key") || 
      error.message.includes("unique constraint") ||
      error.message.includes("tx_hash")
    )) {
      return res.status(400).json({ 
        error: "This transaction has already been used to submit a link. Each transaction can only be used once." 
      });
    }
    
    // Handle other errors
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to create link. Please try again." 
    });
  }
});

app.post("/api/clicks", async (req, res) => {
  try {
    const clickData = {
      ...req.body,
      userAgent: req.headers["user-agent"] || null,
    };

    const click = await storage.createClick(clickData);
    res.status(201).json(click);
  } catch (error) {
    console.error("Error creating click:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to create click" 
    });
  }
});

app.post("/api/ownerships", async (req, res) => {
  try {
    const { ownerAddress, txHash, durationSeconds = 3600 } = req.body;

    if (!ownerAddress || !txHash) {
      return res.status(400).json({ error: "Owner address and transaction hash required" });
    }

    console.log(`Verifying ownership transaction: ${txHash}`);
    const verification = await verifyETHPayment(txHash);
    
    if (!verification.isValid) {
      console.error(`Ownership transaction verification failed: ${verification.error}`);
      return res.status(400).json({ 
        error: verification.error || "Transaction verification failed" 
      });
    }

    if (verification.from?.toLowerCase() !== ownerAddress.toLowerCase()) {
      console.error(`Owner address mismatch: claimed ${ownerAddress}, actual ${verification.from}`);
      return res.status(400).json({ 
        error: "Owner address does not match transaction sender" 
      });
    }

    console.log(`Ownership transaction verified successfully from ${verification.from}`);
    const ownership = await storage.createOwnership({
      ownerAddress,
      txHash,
      durationSeconds
    });
    res.status(201).json(ownership);
  } catch (error) {
    console.error("Error creating ownership:", error);
    
    if (error instanceof Error && (
      error.message.includes("duplicate key") || 
      error.message.includes("unique constraint") ||
      error.message.includes("tx_hash")
    )) {
      return res.status(400).json({ 
        error: "This transaction has already been used to purchase ownership" 
      });
    }
    
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to create ownership" 
    });
  }
});

app.get("/api/ownerships/current", async (req, res) => {
  try {
    const ownership = await storage.getActiveOwnership();
    
    if (!ownership) {
      return res.status(404).json({ error: "No active ownership" });
    }

    const now = new Date();
    const expiresAt = new Date(ownership.expiresAt);
    const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

    res.json({
      ...ownership,
      remainingSeconds
    });
  } catch (error) {
    console.error("Error fetching active ownership:", error);
    res.status(500).json({ error: "Failed to fetch active ownership" });
  }
});

app.patch("/api/ownerships/:id/link", async (req, res) => {
  try {
    const ownershipId = req.params.id;
    const { ownerAddress, url } = req.body;
    
    if (!ownerAddress) {
      return res.status(400).json({ error: "Owner address required for verification" });
    }

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const ownership = await storage.getOwnershipById(ownershipId);
    
    if (!ownership) {
      return res.status(404).json({ error: "Ownership not found" });
    }

    if (ownership.ownerAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
      return res.status(403).json({ error: "Only the owner can edit the link" });
    }

    const now = new Date();
    const expiresAt = new Date(ownership.expiresAt);
    
    if (now >= expiresAt) {
      return res.status(403).json({ error: "Ownership has expired" });
    }

    const link = await storage.updateOwnershipLink(ownershipId, { url });
    res.json(link);
  } catch (error) {
    console.error("Error updating ownership link:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to update ownership link" 
    });
  }
});

app.get("/frame", async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Robots-Tag', 'all');
  
  const baseUrl = getBaseUrl();
  const link = await storage.getCurrentLink();
  
  if (link) {
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/frame/image" />
          <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
          <meta property="fc:frame:button:1" content="Open Link" />
          <meta property="fc:frame:button:1:action" content="link" />
          <meta property="fc:frame:button:1:target" content="${link.url}" />
          <meta property="og:title" content="Mystery Link Button" />
          <meta property="og:description" content="Click to open the mystery link!" />
          <meta property="og:image" content="${baseUrl}/api/frame/image" />
        </head>
        <body>
          <h1>Mystery Link Button</h1>
          <p>This frame contains a mystery link. Click the button in Farcaster to open it!</p>
        </body>
      </html>
    `);
  }
  
  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${baseUrl}/api/frame/image" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
        <meta property="fc:frame:button:1" content="Visit App" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="${baseUrl}" />
        <meta property="og:title" content="Mystery Link Button" />
        <meta property="og:description" content="Be the first to add a mystery link!" />
        <meta property="og:image" content="${baseUrl}/api/frame/image" />
      </head>
      <body>
        <h1>Mystery Link Button</h1>
        <p>No link available yet. Visit the app to add one!</p>
      </body>
    </html>
  `);
});

app.get("/api/frame/image", async (req, res) => {
  const link = await storage.getCurrentLink();
  const hasLink = !!link;
  
  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="button" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#60a5fa;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-opacity="0.4"/>
        </filter>
      </defs>
      
      <rect width="1200" height="630" fill="url(#bg)"/>
      
      <text x="600" y="140" font-family="Inter, system-ui, sans-serif" font-size="56" font-weight="700" fill="white" text-anchor="middle">
        Mystery Link Button
      </text>
      
      <circle cx="600" cy="350" r="120" fill="url(#button)" filter="url(#shadow)"/>
      
      <text x="600" y="360" font-family="Inter, system-ui, sans-serif" font-size="48" font-weight="700" fill="white" text-anchor="middle">
        ${hasLink ? '🔗' : '📭'}
      </text>
      
      <text x="600" y="540" font-family="Inter, system-ui, sans-serif" font-size="36" font-weight="600" fill="white" text-anchor="middle" opacity="0.9">
        ${hasLink ? 'Click to open the link!' : 'No link available yet'}
      </text>
    </svg>
  `;
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'max-age=10');
  res.send(svg);
});

app.use((err, req, res, next) => {
  console.error('Express error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

module.exports = app;
