import express, { type Request, Response, NextFunction } from "express";
import { storage } from "../server/storage";
import { insertLinkSchema, insertClickSchema } from "../shared/schema";
import { fromZodError } from "zod-validation-error";
import { verifyETHPayment } from "../server/contract-utils";
import { appEvents } from "../server/events";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

const getBaseUrl = () => {
  return process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';
};

const svgToPng = async (svg: string): Promise<Buffer | string> => {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const { stdout } = await execAsync(`echo '${svg.replace(/'/g, "'\\''")}' | convert svg:- png:-`, {
      encoding: 'buffer',
      maxBuffer: 10 * 1024 * 1024
    });
    
    return stdout;
  } catch (error) {
    console.error('Error converting SVG to PNG:', error);
    return svg;
  }
};

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

app.get("/api/frame/redirect", async (req, res) => {
  try {
    const link = await storage.getCurrentLink();
    
    if (!link) {
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
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <rect width="1200" height="630" fill="url(#bg)"/>
      
      <text x="600" y="180" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="white" text-anchor="middle">
        Mystery Link Button
      </text>
      
      <circle cx="600" cy="380" r="100" fill="#60a5fa" opacity="0.3" filter="url(#glow)"/>
      <circle cx="600" cy="380" r="80" fill="#60a5fa" opacity="0.5"/>
      <circle cx="600" cy="380" r="60" fill="#93c5fd"/>
      
      <text x="600" y="395" font-family="monospace" font-size="48" font-weight="bold" fill="white" text-anchor="middle">
        ${hasLink ? '🔗' : '❓'}
      </text>
      
      <text x="600" y="520" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle" opacity="0.9">
        ${hasLink ? 'Click to open the link!' : 'No link set yet'}
      </text>
    </svg>
  `;

  const png = await svgToPng(svg);
  
  if (Buffer.isBuffer(png)) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.send(png);
  } else {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.send(svg);
  }
});

app.post("/api/frame/action", async (req, res) => {
  console.log('Frame action received');
  
  const baseUrl = getBaseUrl();
  const link = await storage.getCurrentLink();
  
  if (!link) {
    return res.status(200).json({
      message: "No link available"
    });
  }

  return res.status(200).json({
    message: "Link clicked",
    url: link.url
  });
});

app.get("/api/base-url", async (req, res) => {
  res.json({ baseUrl: getBaseUrl() });
});

app.get("/api/current-link", async (req, res) => {
  try {
    const link = await storage.getCurrentLink();
    
    if (!link) {
      return res.status(404).json({ message: "No link found" });
    }
    
    res.json(link);
  } catch (error) {
    console.error('Error fetching current link:', error);
    res.status(500).json({ message: "Failed to fetch link" });
  }
});

app.post("/api/links", async (req, res) => {
  try {
    const validationResult = insertLinkSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const readableError = fromZodError(validationResult.error);
      return res.status(400).json({ 
        message: readableError.message 
      });
    }

    const linkData = validationResult.data;
    
    if (linkData.txHash) {
      const isValid = await verifyETHPayment(linkData.txHash);
      
      if (!isValid) {
        return res.status(400).json({ 
          message: "Invalid payment transaction" 
        });
      }
    }

    const link = await storage.createLink(linkData);
    appEvents.emitLinkCreated(link);
    
    res.status(201).json(link);
  } catch (error) {
    console.error('Error creating link:', error);
    res.status(500).json({ message: "Failed to create link" });
  }
});

app.get("/api/recent-clicks", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const clicks = await storage.getRecentClicks(limit);
    res.json(clicks);
  } catch (error) {
    console.error('Error fetching clicks:', error);
    res.status(500).json({ message: "Failed to fetch clicks" });
  }
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

export default app;
