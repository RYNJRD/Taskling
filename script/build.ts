import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

// These are node built-ins + packages that MUST stay external (native modules, etc.)
// Everything else gets bundled so Vercel has a self-contained file.
const nodeBuiltins = [
  "http", "https", "fs", "path", "os", "crypto", "stream", "events",
  "util", "url", "buffer", "net", "tls", "child_process", "cluster",
  "worker_threads", "assert", "querystring", "dns", "readline",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server (local dev bundle)...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];

  // For local dev server: keep node_modules external
  const serverAllowlist = [
    "connect-pg-simple", "date-fns", "drizzle-orm", "drizzle-zod",
    "express", "express-session", "memorystore", "passport", "passport-local",
    "pg", "ws", "zod", "zod-validation-error",
  ];
  const serverExternals = allDeps.filter((dep) => !serverAllowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: { "process.env.NODE_ENV": '"production"' },
    minify: true,
    external: serverExternals,
    logLevel: "info",
    tsconfig: "tsconfig.json",
  });

  // ─── Vercel API bundle ───────────────────────────────────────────────────────
  // Vercel runs api/index.ts but cannot resolve ../server/* at runtime because
  // server/ is not co-located with the function. We pre-bundle api/index.ts
  // into api/index.js with ALL server code inlined so Vercel gets one self-
  // contained file with zero relative-path lookups at runtime.
  console.log("building vercel api bundle...");
  await esbuild({
    entryPoints: ["server/vercel-handler.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "api/index.js",
    define: { "process.env.NODE_ENV": '"production"' },
    // We mark all packages as external for Vercel too.
    // This is safer as Vercel will install the correct platform-specific versions.
    external: serverExternals,
    logLevel: "info",
    tsconfig: "tsconfig.json",
    // Path alias for @shared/*
    alias: {
      "@shared": "./shared",
    },
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
