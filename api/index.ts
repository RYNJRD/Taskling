let initialized = false;
let app: any;
let setupApp: any;

export default async function handler(req: any, res: any) {
  try {
    if (!initialized) {
      console.log("[Vercel] Lazy-loading server...");
      const serverModule = await import("../server/index");
      app = serverModule.app;
      setupApp = serverModule.setupApp;

      await setupApp().catch((err: any) => {
        console.error("[Vercel] setupApp failed:", err);
        throw err;
      });
      initialized = true;
    }
    return app(req, res);
  } catch (err: any) {
    console.error("[Vercel] EMERGENCY CRASH:", err);
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json");
      res.status(500).send(JSON.stringify({ 
        message: "The Taskling server encountered a critical error during execution.",
        error: err.message || String(err),
        stack: err.stack,
        phase: initialized ? "execution" : "initialization"
      }, null, 2));
    }
  }
}


