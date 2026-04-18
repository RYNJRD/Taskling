import express from "express";
import { createServer } from "http";
// Standard imports are required so esbuild can BUNDLE them into the single file.
// Dynamic imports ('await import(...)') stay external and fail in Vercel.
import { registerRoutes } from "./routes";

/**
 * Resilient Vercel Handler
 * All app logic (routes, db, services) is bundled into this file by esbuild.
 */
export default async function handler(req: any, res: any) {
  try {
    console.log(`[Vercel] Handler processing ${req.method} ${req.url}`);
    
    // Create Express app instance inside the handler for a clean scope
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Initialize routes
    try {
      const httpServer = createServer(app);
      await registerRoutes(httpServer, app);
    } catch (regErr: any) {
      console.error("[Vercel] ROUTE_REGISTRATION_FAILED:", regErr);
      return res.status(500).json({
        message: "Failed to initialize server routes.",
        error: regErr.message || String(regErr),
        stack: regErr.stack,
        phase: "routes_init"
      });
    }

    // Delegate handling to Express
    return app(req, res);

  } catch (err: any) {
    console.error("[Vercel] CRITICAL_HANDLER_ERROR:", err);
    if (!res.headersSent) {
      return res.status(500).json({
        message: "Taskling encountered a critical error.",
        error: err.message || String(err),
        stack: err.stack,
        phase: "unhandled"
      });
    }
  }
}
