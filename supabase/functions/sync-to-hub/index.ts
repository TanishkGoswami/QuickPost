// sync-to-hub/index.ts
// Supabase Edge Function to sync all table data to the Hub project (getaipilot)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface SyncTableResult {
  table: string;
  rowsFetched: number;
  rowsUpserted: number;
  status: "success" | "error";
  error?: string;
}

interface SyncResult {
  success: boolean;
  timestamp: string;
  tables: SyncTableResult[];
  summary: {
    total_tables: number;
    succeeded: number;
    failed: number;
    total_rows_synced: number;
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Table definitions
// ──────────────────────────────────────────────────────────────────────────────

const TABLES_TO_SYNC = [
  "users",         // 1. Parent table
  "payments",      // 2. Subscription/Plan data
  "social_tokens", // 3. References users
  "broadcasts",    // 4. References users
];

const CHUNK_SIZE = 500;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ──────────────────────────────────────────────────────────────────────────────
// Sync a single table
// ──────────────────────────────────────────────────────────────────────────────

async function syncTable(
  sourceClient: any,
  hubClient: any,
  tableName: string
): Promise<SyncTableResult> {
  console.log(`[sync-to-hub] 🔄 Processing table: ${tableName}`);

  // ── Fetch all rows from source ──────────────────────────────────────────────
  // Note: For very large tables, we'd use pagination here.
  const { data: rows, error: fetchError } = await sourceClient
    .from(tableName)
    .select("*");

  if (fetchError) {
    console.error(`[sync-to-hub] ❌ Fetch Error (${tableName}):`, fetchError.message);
    return {
      table: tableName,
      rowsFetched: 0,
      rowsUpserted: 0,
      status: "error",
      error: `Fetch failed: ${fetchError.message}`,
    };
  }

  const rowCount = rows?.length || 0;
  console.log(`[sync-to-hub] 📥 Fetched ${rowCount} rows from source '${tableName}'`);

  if (rowCount === 0) {
    return {
      table: tableName,
      rowsFetched: 0,
      rowsUpserted: 0,
      status: "success",
    };
  }

  let finalRows = rows;

  // ── Inject Auth Metadata for Users ──────────────────────────────────────────
  if (tableName === "users") {
    try {
      console.log(`[sync-to-hub] 👤 Injecting auth metadata...`);
      const { data: authData, error: authError } = await sourceClient.auth.admin.listUsers();
      
      if (authError) {
        console.warn(`[sync-to-hub] ⚠️ Could not fetch auth users:`, authError.message);
      } else {
        const authMap = new Map();
        authData.users.forEach((u: any) => authMap.set(u.id, u.user_metadata || {}));
        
        finalRows = rows.map((row: any) => {
          const meta = authMap.get(row.id) || {};
          return {
            ...row,
            plan: row.plan || meta.plan || "Free",
            subscription_status: row.subscription_status || meta.subscription_status || "active",
          };
        });
        console.log(`[sync-to-hub] ✅ Merged auth metadata for ${authData.users.length} users.`);
      }
    } catch (err) {
      console.warn(`[sync-to-hub] ⚠️ Auth injection exception:`, err);
    }
  }

  // ── Upsert to Hub ───────────────────────────────────────────────────────────
  const chunks = chunkArray(finalRows, CHUNK_SIZE);
  let totalUpserted = 0;

  for (const [index, chunk] of chunks.entries()) {
    const { error: upsertError } = await hubClient
      .from(tableName)
      .upsert(chunk, { onConflict: "id" });

    if (upsertError) {
      console.error(`[sync-to-hub] ❌ Upsert Error (${tableName}, chunk ${index + 1}):`, upsertError.message);
      console.error(`[sync-to-hub] 💡 Tip: Check if '${tableName}' in Hub has all columns present in Source.`);
      return {
        table: tableName,
        rowsFetched: rowCount,
        rowsUpserted: totalUpserted,
        status: "error",
        error: `Upsert failed: ${upsertError.message}`,
      };
    }

    totalUpserted += chunk.length;
    console.log(`[sync-to-hub] 📤 ${tableName}: Upserted chunk ${index + 1}/${chunks.length}`);
  }

  return {
    table: tableName,
    rowsFetched: rowCount,
    rowsUpserted: totalUpserted,
    status: "success",
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Handler
// ──────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const SOURCE_URL = Deno.env.get("SUPABASE_URL")!;
    const SOURCE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const HUB_URL = Deno.env.get("HUB_SUPABASE_URL");
    const HUB_KEY = Deno.env.get("HUB_SUPABASE_SERVICE_ROLE_KEY");

    if (!HUB_URL || !HUB_KEY) {
      throw new Error("Missing HUB_SUPABASE_URL or HUB_SUPABASE_SERVICE_ROLE_KEY secrets.");
    }

    const sourceClient = createClient(SOURCE_URL, SOURCE_KEY, { auth: { persistSession: false } });
    const hubClient = createClient(HUB_URL, HUB_KEY, { auth: { persistSession: false } });

    console.log("[sync-to-hub] 🚀 Starting Sync...");
    const tableResults: SyncTableResult[] = [];

    for (const table of TABLES_TO_SYNC) {
      const result = await syncTable(sourceClient, hubClient, table);
      tableResults.push(result);
      if (result.status === "error" && table === "users") break;
    }

    const failed = tableResults.filter(r => r.status === "error").length;
    const summary = {
      total_tables: tableResults.length,
      succeeded: tableResults.filter(r => r.status === "success").length,
      failed,
      total_rows_synced: tableResults.reduce((acc, r) => acc + r.rowsUpserted, 0),
    };

    const responseData = {
      success: failed === 0,
      timestamp: new Date().toISOString(),
      tables: tableResults,
      summary,
    };

    console.log(`[sync-to-hub] ✨ Finished. Synced ${summary.total_rows_synced} rows across ${summary.succeeded} tables.`);

    return new Response(JSON.stringify(responseData, null, 2), {
      status: failed > 0 ? 207 : 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (err: any) {
    console.error("[sync-to-hub] 💥 Critical Function Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
