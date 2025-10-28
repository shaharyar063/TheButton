import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLinkSchema, insertClickSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { verifyUSDCPayment } from "./contract-utils";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const verification = await verifyUSDCPayment(validationResult.data.txHash);
      
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
