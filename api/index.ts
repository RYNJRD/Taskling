import express from "express";

// NO top-level imports from our server files here.
// This prevents a crash in those files from killing the whole function 
// before we can catch the error.

const app = express();
app.use(express.json());

let routerLoaded = false;

app.all("*", async (req, res) => {
  try {
    if (!routerLoaded) {
      console.log("[Vercel] Safe-loading server modules...");
      
      // We load these INSIDE the request so we can catch any top-level errors in them
      const { createServer } = await import("http");
      const { registerRoutes } = await import("../server/routes");
      
      const httpServer = createServer(app);
      await registerRoutes(httpServer, app);
      routerLoaded = true;
      
      console.log("[Vercel] Server modules loaded successfully.");
    }
    
    // Pass control to the Express app which now has all routes attached
    return app(req, res);
    
  } catch (err: any) {
    console.error("[Vercel] BOOTSTRAP ERROR:", err);
    return res.status(500).json({
      message: "Taskling failed to load server modules.",
      error: err.message || String(err),
      stack: err.stack,
      tip: "Check environment variables and Firebase paths."
    });
  }
});

export default app;
