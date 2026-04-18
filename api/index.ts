import { app, setupApp } from "../server/index";

let initialized = false;

export default async function handler(req: any, res: any) {
  try {
    if (!initialized) {
      await setupApp().catch(err => {
        console.error("[Vercel] setupApp failed:", err);
        throw err;
      });
      initialized = true;
    }
    return app(req, res);
  } catch (err: any) {
    console.error("[Vercel] Emergency catch:", err);
    if (!res.headersSent) {
      res.status(500).json({ 
        message: "The Taskling server encountered a critical error during startup.",
        error: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
      });
    }
  }
}

