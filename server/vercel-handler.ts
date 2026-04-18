import express from "express";
import { createServer } from "http";

// We use dynamic imports for everything that might crash at boot (like routes or DB)
// this ensures the handler itself loads correctly.
export default async function handler(req: any, res: any) {
  try {
    console.log(`[Vercel] Handler called for ${req.method} ${req.url}`);
    
    // 1. Dynamic import of dependencies to trap boot errors
    let registerRoutes;
    try {
      const routesMod = await import("./routes");
      registerRoutes = routesMod.registerRoutes;
    } catch (importErr: any) {
      console.error("[Vercel] BOOTSTRAP ERROR (Import failed):", importErr);
      return res.status(500).json({
        message: "Taskling failed to load server modules. This usually indicates a deployment issue.",
        error: importErr.message || String(importErr),
        stack: importErr.stack,
        phase: "bootstrap_import"
      });
    }

    // 2. Initialize Express inside the handler
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // 3. Register routes
    try {
      const httpServer = createServer(app);
      await registerRoutes(httpServer, app);
    } catch (regErr: any) {
      console.error("[Vercel] BOOTSTRAP ERROR (Route registration failed):", regErr);
      return res.status(500).json({
        message: "Taskling failed to register server routes.",
        error: regErr.message || String(regErr),
        stack: regErr.stack,
        phase: "bootstrap_routes"
      });
    }

    // 4. Handle request
    return app(req, res);

  } catch (err: any) {
    console.error("[Vercel] CRITICAL RUNTIME ERROR:", err);
    if (!res.headersSent) {
      return res.status(500).json({
        message: "Taskling encountered a critical runtime error.",
        error: err.message || String(err),
        stack: err.stack,
        phase: "unhandled_exception"
      });
    }
  }
}
