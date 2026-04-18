import express, { Express } from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";

let cachedApp: Express | null = null;

function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
  });
  console.log(`\${formattedTime} [\${source}] \${message}`);
}

export default async function handler(req: any, res: any) {
  try {
    if (!cachedApp) {
      console.log("[Vercel] Initializing Taskling server...");
      const app = express();
      
      app.use(express.json({
        verify: (req: any, _res, buf) => { req.rawBody = buf; },
      }));
      app.use(express.urlencoded({ extended: false }));

      // Logging middleware
      app.use((req, res, next) => {
        const start = Date.now();
        const path = req.path;
        res.on("finish", () => {
          const duration = Date.now() - start;
          if (path.startsWith("/api")) {
            log(`\${req.method} \${path} \${res.statusCode} in \${duration}ms`);
          }
        });
        next();
      });

      const httpServer = createServer(app);
      await registerRoutes(httpServer, app);
      cachedApp = app;
    }

    return cachedApp(req, res);
  } catch (err: any) {
    console.error("[Vercel] CRITICAL INITIALIZATION ERROR:", err);
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json");
      res.status(500).send(JSON.stringify({ 
        message: "The Taskling server failed to initialize on Vercel.",
        error: err.message || String(err),
        stack: err.stack
      }, null, 2));
    }
  }
}




