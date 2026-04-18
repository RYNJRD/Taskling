import express from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let isReady = false;

app.use(async (req, res, next) => {
  if (!isReady) {
    try {
      console.log("[Vercel] Lazy-initializing server routes...");
      // Pass a dummy httpServer, Vercel doesn't use it but our mock/websockets might expect it
      const httpServer = createServer(app);
      await registerRoutes(httpServer, app);
      isReady = true;
    } catch (err: any) {
      console.error("[Vercel] SEVERE INIT ERROR:", err);
      return res.status(500).json({ 
        message: "The Taskling server failed to start on Vercel.",
        error: err.message || String(err),
        stack: err.stack
      });
    }
  }

  
  // Call the actual routing logic ONLY once the router is fully attached
  next();
});

// Since next() continues to evaluating the rest of the Express stack,
// the dynamically added routes inside registerRoutes will handle the current request!

export default app;
