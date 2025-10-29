import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLinkSchema, insertClickSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { verifyETHPayment } from "./contract-utils";
import { appEvents } from "./events";

export async function registerRoutes(app: Express): Promise<Server> {
  const getBaseUrl = () => {
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0];
    return domain ? `https://${domain}` : 'http://localhost:5000';
  };

  app.get("/frame", async (req, res) => {
    const baseUrl = getBaseUrl();
    const link = await storage.getCurrentLink();
    
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/frame/image" />
          <meta property="fc:frame:button:1" content="${link ? 'Open App & Reveal' : 'Open App'}" />
          <meta property="fc:frame:button:1:action" content="link" />
          <meta property="fc:frame:button:1:target" content="${baseUrl}" />
          <meta property="og:title" content="Link Reveal - Farcaster Mini App" />
          <meta property="og:description" content="Pay 0.00001 ETH to submit a mystery link that visitors can reveal" />
          <meta property="og:image" content="${baseUrl}/api/frame/image" />
        </head>
        <body>
          <h1>Link Reveal</h1>
          <p>Open the app to reveal the mystery link or submit your own!</p>
        </body>
      </html>
    `);
  });

  app.get("/api/frame/image", async (req, res) => {
    const baseUrl = getBaseUrl();
    res.redirect(`${baseUrl}/favicon.png`);
  });

  app.get("/api/events", (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendEvent = (event: string, data: any) => {
      if (!res.writableEnded) {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    };

    const onLinkCreated = (link: any) => {
      sendEvent('link:created', link);
    };

    const onClickCreated = (click: any) => {
      sendEvent('click:created', click);
    };

    appEvents.on('link:created', onLinkCreated);
    appEvents.on('click:created', onClickCreated);

    const heartbeat = setInterval(() => {
      if (!res.writableEnded) {
        res.write(':heartbeat\n\n');
      }
    }, 30000);

    const cleanup = () => {
      clearInterval(heartbeat);
      appEvents.off('link:created', onLinkCreated);
      appEvents.off('click:created', onClickCreated);
      if (!res.writableEnded) {
        res.end();
      }
    };

    req.on('close', cleanup);
    req.on('error', cleanup);
    res.on('error', cleanup);
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
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
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

  const httpServer = createServer(app);

  return httpServer;
}
