import express, { type Request, Response, NextFunction, type Express } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { insertLinkSchema, insertClickSchema, insertButtonOwnershipSchema, updateLinkSchema, updateOwnershipVisualsSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { verifyETHPayment } from "./contract-utils";
import { appEvents } from "./events";
import { escapeHtml, isValidHttpUrl } from "./security-utils";

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

export function createExpressApp(): Express {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
        frameSrc: ["'self'"],
      },
    },
  }));

  app.disable('x-powered-by');

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later.",
  });

  app.use('/api/', limiter);

  app.use(express.json({
    limit: '100kb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  const getBaseUrl = () => {
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0];
    return domain ? `https://${domain}` : 'http://localhost:5000';
  };

  app.get("/frame", async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Robots-Tag', 'all');
    
    const baseUrl = getBaseUrl();
    const link = await storage.getCurrentLink();
    
    if (link) {
      const escapedUrl = escapeHtml(link.url);
      const escapedBaseUrl = escapeHtml(baseUrl);
      
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${escapedBaseUrl}/api/frame/image" />
            <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
            <meta property="fc:frame:button:1" content="Open Link" />
            <meta property="fc:frame:button:1:action" content="link" />
            <meta property="fc:frame:button:1:target" content="${escapedUrl}" />
            <meta property="og:title" content="Mystery Link Button" />
            <meta property="og:description" content="Click to open the mystery link!" />
            <meta property="og:image" content="${escapedBaseUrl}/api/frame/image" />
          </head>
          <body>
            <h1>Mystery Link Button</h1>
            <p>This frame contains a mystery link. Click the button in Farcaster to open it!</p>
          </body>
        </html>
      `);
    }
    
    const escapedBaseUrl = escapeHtml(baseUrl);
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${escapedBaseUrl}/api/frame/image" />
          <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
          <meta property="fc:frame:button:1" content="Visit App" />
          <meta property="fc:frame:button:1:action" content="link" />
          <meta property="fc:frame:button:1:target" content="${escapedBaseUrl}" />
          <meta property="og:title" content="Mystery Link Button" />
          <meta property="og:description" content="Be the first to add a mystery link!" />
          <meta property="og:image" content="${escapedBaseUrl}/api/frame/image" />
        </head>
        <body>
          <h1>Mystery Link Button</h1>
          <p>No link available yet. Visit the app to add one!</p>
        </body>
      </html>
    `);
  });

  app.get("/api/frame/redirect", async (req, res) => {
    try {
      const link = await storage.getCurrentLink();
      
      if (!link) {
        return res.redirect(getBaseUrl());
      }

      if (!isValidHttpUrl(link.url)) {
        console.error(`Invalid redirect URL: ${link.url}`);
        return res.redirect(getBaseUrl());
      }

      const clickData = {
        linkId: link.id,
        clickedBy: 'frame-visitor',
        clickerUsername: null,
        clickerPfpUrl: null,
        userAgent: req.headers["user-agent"] || null,
      };

      const validationResult = insertClickSchema.safeParse(clickData);
      
      if (validationResult.success) {
        const click = await storage.createClick(validationResult.data);
        appEvents.emitClickCreated(click);
        console.log(`🔗 Frame redirect click tracked`);
      }

      return res.redirect(link.url);
    } catch (error) {
      console.error('Error in frame redirect:', error);
      return res.redirect(getBaseUrl());
    }
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

  app.post("/api/frame/action", async (req, res) => {
    const baseUrl = getBaseUrl();
    const escapedBaseUrl = escapeHtml(baseUrl);
    
    try {
      const link = await storage.getCurrentLink();
      
      if (!link) {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta property="fc:frame" content="vNext" />
              <meta property="fc:frame:image" content="${escapedBaseUrl}/api/frame/image/nolink" />
              <meta property="fc:frame:button:1" content="Open App to Add Link" />
              <meta property="fc:frame:button:1:action" content="link" />
              <meta property="fc:frame:button:1:target" content="${escapedBaseUrl}" />
            </head>
            <body></body>
          </html>
        `);
      }

      const frameMessage = req.body;
      const buttonIndex = frameMessage?.untrustedData?.buttonIndex || 1;
      let fid = null;
      let username = null;
      let pfpUrl = null;
      let verified = false;
      
      if (frameMessage?.trustedData?.messageBytes) {
        try {
          const messageBytes = frameMessage.trustedData.messageBytes;
          const verifyResponse = await fetch('https://hub.pinata.cloud/v1/validateMessage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream',
            },
            body: Buffer.from(messageBytes, 'base64'),
          });
          
          const verifyData = await verifyResponse.json();
          
          if (verifyData.valid) {
            verified = true;
            fid = verifyData.message?.data?.fid;
            console.log(`✅ Frame message verified for FID: ${fid}`);
          } else {
            console.warn('⚠️ Frame message verification failed, using untrusted data');
          }
        } catch (error) {
          console.error('Error verifying frame message:', error);
        }
      }
      
      if (!verified && frameMessage?.untrustedData?.fid) {
        fid = frameMessage.untrustedData.fid;
        console.warn(`⚠️ Using unverified FID: ${fid}`);
      }
      
      if (fid) {
        try {
          const response = await fetch(`https://fnames.farcaster.xyz/transfers?fid=${fid}`);
          const data = await response.json();
          if (data.transfers && data.transfers.length > 0) {
            username = data.transfers[0].username;
          }
          
          const profileResponse = await fetch(`https://api.warpcast.com/v1/user-by-fid?fid=${fid}`);
          const profileData = await profileResponse.json();
          if (profileData?.result?.user?.pfp?.url) {
            pfpUrl = profileData.result.user.pfp.url;
          }
        } catch (error) {
          console.error('Error fetching Farcaster profile:', error);
        }
      }

      const clickData = {
        linkId: link.id,
        clickedBy: fid ? (verified ? `fid:${fid}` : `fid:${fid}-unverified`) : 'anonymous',
        clickerUsername: username,
        clickerPfpUrl: pfpUrl,
        userAgent: req.headers["user-agent"] || null,
      };

      const validationResult = insertClickSchema.safeParse(clickData);
      
      if (validationResult.success) {
        const click = await storage.createClick(validationResult.data);
        appEvents.emitClickCreated(click);
        console.log(`✨ Frame click recorded: ${username || fid || 'anonymous'} clicked! (verified: ${verified})`);
      }

      if (buttonIndex === 1) {
        if (!isValidHttpUrl(link.url)) {
          console.error(`Invalid redirect URL in frame action: ${link.url}`);
          return res.status(400).send('Invalid URL');
        }
        res.setHeader('Location', link.url);
        return res.status(302).send();
      }

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${escapedBaseUrl}/api/frame/image/success" />
            <meta property="fc:frame:button:1" content="🔗 Open Link" />
            <meta property="fc:frame:button:2" content="🔄 Click Again" />
            <meta property="fc:frame:post_url" content="${escapedBaseUrl}/api/frame/action" />
          </head>
          <body></body>
        </html>
      `);
    } catch (error) {
      console.error('Error handling frame action:', error);
      
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${escapedBaseUrl}/api/frame/image/error" />
            <meta property="fc:frame:button:1" content="Try Again" />
            <meta property="fc:frame:post_url" content="${escapedBaseUrl}/api/frame/action" />
          </head>
          <body></body>
        </html>
      `);
    }
  });

  app.get("/api/frame/image/nolink", async (req, res) => {
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <rect width="1200" height="630" fill="url(#bg)"/>
        
        <text x="600" y="280" font-family="Inter, system-ui, sans-serif" font-size="72" font-weight="700" fill="white" text-anchor="middle">
          📭
        </text>
        
        <text x="600" y="380" font-family="Inter, system-ui, sans-serif" font-size="48" font-weight="700" fill="white" text-anchor="middle">
          No Link Yet
        </text>
        
        <text x="600" y="460" font-family="Inter, system-ui, sans-serif" font-size="32" font-weight="400" fill="white" text-anchor="middle" opacity="0.9">
          Be the first to add a mystery link!
        </text>
      </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'max-age=10');
    res.send(svg);
  });

  app.get("/api/frame/image/success", async (req, res) => {
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#065f46;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#10b981;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <rect width="1200" height="630" fill="url(#bg)"/>
        
        <text x="600" y="280" font-family="Inter, system-ui, sans-serif" font-size="96" font-weight="700" fill="white" text-anchor="middle">
          ✨
        </text>
        
        <text x="600" y="400" font-family="Inter, system-ui, sans-serif" font-size="56" font-weight="700" fill="white" text-anchor="middle">
          Link Revealed!
        </text>
        
        <text x="600" y="490" font-family="Inter, system-ui, sans-serif" font-size="32" font-weight="400" fill="white" text-anchor="middle" opacity="0.9">
          Click below to open the mystery link
        </text>
      </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'max-age=10');
    res.send(svg);
  });

  app.get("/api/frame/image/error", async (req, res) => {
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#991b1b;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#ef4444;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <rect width="1200" height="630" fill="url(#bg)"/>
        
        <text x="600" y="280" font-family="Inter, system-ui, sans-serif" font-size="96" font-weight="700" fill="white" text-anchor="middle">
          ⚠️
        </text>
        
        <text x="600" y="400" font-family="Inter, system-ui, sans-serif" font-size="56" font-weight="700" fill="white" text-anchor="middle">
          Oops!
        </text>
        
        <text x="600" y="490" font-family="Inter, system-ui, sans-serif" font-size="32" font-weight="400" fill="white" text-anchor="middle" opacity="0.9">
          Something went wrong. Try again!
        </text>
      </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'max-age=10');
    res.send(svg);
  });


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

  app.post("/api/links", async (req, res) => {
    try {
      const validationResult = insertLinkSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        return res.status(400).json({ error: errorMessage });
      }

      console.log(`Verifying transaction: ${validationResult.data.txHash}`);
      const verification = await verifyETHPayment(validationResult.data.txHash);
      
      if (!verification.isValid) {
        console.error(`Transaction verification failed: ${verification.error}`);
        return res.status(400).json({ 
          error: verification.error || "Transaction verification failed" 
        });
      }

      if (verification.from?.toLowerCase() !== validationResult.data.submittedBy.toLowerCase()) {
        console.error(`Submitter address mismatch: claimed ${validationResult.data.submittedBy}, actual ${verification.from}`);
        return res.status(400).json({ 
          error: "Submitter address does not match transaction sender" 
        });
      }

      console.log(`Transaction verified successfully from ${verification.from}`);
      const link = await storage.createLink(validationResult.data);
      appEvents.emitLinkCreated(link);
      res.status(201).json(link);
    } catch (error) {
      console.error("Error creating link:", error);
      
      if (error instanceof Error && error.message.includes("duplicate key")) {
        return res.status(400).json({ 
          error: "This transaction has already been used to submit a link" 
        });
      }
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to create link" 
      });
    }
  });

  app.get("/api/recent-clicks", async (req, res) => {
    try {
      const requestedLimit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const limit = Math.min(Math.max(1, requestedLimit), 100);
      const clicks = await storage.getRecentClicks(limit);
      res.json(clicks);
    } catch (error) {
      console.error("Error fetching clicks:", error);
      res.status(500).json({ error: "Failed to fetch clicks" });
    }
  });

  app.post("/api/clicks", async (req, res) => {
    try {
      const clickData = {
        ...req.body,
        userAgent: req.headers["user-agent"] || null,
      };

      const validationResult = insertClickSchema.safeParse(clickData);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        return res.status(400).json({ error: errorMessage });
      }

      const click = await storage.createClick(validationResult.data);
      appEvents.emitClickCreated(click);
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
      const validationResult = insertButtonOwnershipSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        return res.status(400).json({ error: errorMessage });
      }

      console.log(`Verifying ownership transaction: ${validationResult.data.txHash}`);
      const verification = await verifyETHPayment(validationResult.data.txHash);
      
      if (!verification.isValid) {
        console.error(`Ownership transaction verification failed: ${verification.error}`);
        return res.status(400).json({ 
          error: verification.error || "Transaction verification failed" 
        });
      }

      if (verification.from?.toLowerCase() !== validationResult.data.ownerAddress.toLowerCase()) {
        console.error(`Owner address mismatch: claimed ${validationResult.data.ownerAddress}, actual ${verification.from}`);
        return res.status(400).json({ 
          error: "Owner address does not match transaction sender" 
        });
      }

      const paymentWei = verification.amount || BigInt(0);
      const costPerHour = BigInt(10000000000000);
      const hours = Number(paymentWei / costPerHour);
      const durationSeconds = Math.floor(hours * 3600);

      if (durationSeconds < 60) {
        return res.status(400).json({ 
          error: "Payment amount too small. Minimum is 0.00001 ETH for 1 hour." 
        });
      }

      console.log(`Ownership transaction verified: ${hours} hour(s) purchased (${durationSeconds} seconds)`);
      
      const ownershipData = {
        ...validationResult.data,
        durationSeconds: durationSeconds
      };
      
      const ownership = await storage.createOwnership(ownershipData);
      res.status(201).json(ownership);
    } catch (error) {
      console.error("Error creating ownership:", error);
      
      if (error instanceof Error && error.message.includes("duplicate key")) {
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

  app.patch("/api/ownerships/:id/visuals", async (req, res) => {
    try {
      const ownershipId = req.params.id;
      const { ownerAddress } = req.body;
      
      if (!ownerAddress) {
        return res.status(400).json({ error: "Owner address required for verification" });
      }

      const ownership = await storage.getOwnershipById(ownershipId);
      
      if (!ownership) {
        return res.status(404).json({ error: "Ownership not found" });
      }

      if (ownership.ownerAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
        return res.status(403).json({ error: "Only the owner can edit visuals" });
      }

      const now = new Date();
      const expiresAt = new Date(ownership.expiresAt);
      
      if (now >= expiresAt) {
        return res.status(403).json({ error: "Ownership has expired" });
      }

      const validationResult = updateOwnershipVisualsSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        return res.status(400).json({ error: errorMessage });
      }

      const updatedOwnership = await storage.updateOwnershipVisuals(ownershipId, validationResult.data);
      appEvents.emitLinkCreated(updatedOwnership as any);
      res.json(updatedOwnership);
    } catch (error) {
      console.error("Error updating ownership visuals:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to update ownership visuals" 
      });
    }
  });

  app.patch("/api/ownerships/:id/link", async (req, res) => {
    try {
      const ownershipId = req.params.id;
      const { ownerAddress } = req.body;
      
      if (!ownerAddress) {
        return res.status(400).json({ error: "Owner address required for verification" });
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

      const validationResult = updateLinkSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        return res.status(400).json({ error: errorMessage });
      }

      const link = await storage.updateOwnershipLink(ownershipId, validationResult.data);
      res.json(link);
    } catch (error) {
      console.error("Error updating ownership link:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to update ownership link" 
      });
    }
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  return app;
}
