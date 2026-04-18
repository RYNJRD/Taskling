import pg from "pg";
try {
  new pg.Pool({ connectionString: undefined });
  console.log("Success");
} catch (e: any) {
  console.error("Pool error:", e.message);
}
