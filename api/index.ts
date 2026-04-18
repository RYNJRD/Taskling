import express from "express";
import { createServer } from "http";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let isRoutesRegistered = false;

// Native Vercel Handler
export default async function handler(req: any, res: any) {
  try {
    if (!isRoutesRegistered) {
      console.log("[Vercel] Dynamically loading server routes...");
      
      // We load our routes dynamically to catch configuration errors 
      // instead of letting Vercel kill the function silently.
      const { registerRoutes } = await import("../server/routes");
      
      const httpServer = createServer(app);
      await registerRoutes(httpServer, app);
      isRoutesRegistered = true;
      
      console.log("[Vercel] Server routes registered.");
    }

    // Now that routes are attached to 'app', we let Express handle the request
    return app(req, res);
    
  } catch (err: any) {
    console.error("[Vercel] RUNTIME ERROR:", err);
    res.setHeader("Content-Type", "application/json");
    return res.status(500).json({
      message: "Taskling encountered a runtime error.",
      error: err.message || String(err),
      stack: err.stack
    });
  }
}
