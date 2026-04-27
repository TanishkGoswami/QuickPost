// sync-to-hub/index.ts
// Supabase Edge Function to sync all table data to the Hub project (getaipilot)
// Deploy: supabase functions deploy sync-to-hub
// Trigger: POST https://<your-project>.supabase.co/functions/v1/sync-to-hub

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
// Table definitions (order matters — parent tables first for FK constraints)
// ──────────────────────────────────────────────────────────────────────────────

const TABLES_TO_SYNC = [
  "users",         // 1. Parent table (no FK deps)
  "social_tokens", // 2. References users
  "broadcasts",    // 3. References users
];

// ──────────────────────────────────────────────────────────────────────────────
// Chunk helper — upserts in batches to avoid request size limits
// ──────────────────────────────────────────────────────────────────────────────

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
  sourceClient: ReturnType<typeof createClient>,
  hubClient: ReturnType<typeof createClient>,
  tableName: string
): Promise<SyncTableResult> {
  console.log(`[sync-to-hub] Syncing table: ${tableName}`);

  // ── Fetch all rows from source ──────────────────────────────────────────────
  let { data: rows, error: fetchError } = await sourceClient
    .from(tableName)
    .select("*");

  if (fetchError) {
    console.error(`[sync-to-hub] ERROR fetching ${tableName}:`, fetchError.message);
    return {
      table: tableName,
      rowsFetched: 0,
      rowsUpserted: 0,
      status: "error",
      error: `Fetch error: ${fetchError.message}`,
    };
  }

  if (!rows || rows.length === 0) {
    console.log(`[sync-to-hub] Table ${tableName} is empty — skipping.`);
    return {
      table: tableName,
      rowsFetched: 0,
      rowsUpserted: 0,
      status: "success",
    };
  }

  // ── Inject Auth Metadata for Users ──────────────────────────────────────────
  if (tableName === "users") {
    try {
      console.log(`[sync-to-hub] Injecting auth metadata into users payload...`);
      let allAuthUsers: any[] = [];
      let page = 1;
      
      while (true) {
        const { data: authData, error: authError } = await sourceClient.auth.admin.listUsers({ page, perPage: 1000 });
        if (authError) {
          console.warn(`[sync-to-hub] Failed to fetch auth users page ${page}:`, authError.message);
          break;
        }
        if (!authData || !authData.users || authData.users.length === 0) break;
        
        allAuthUsers.push(...authData.users);
        if (authData.users.length < 1000) break;
        page++;
      }

      const authMap = new Map();
      for (const u of allAuthUsers) {
        authMap.set(u.id, u.user_metadata || {});
      }
      
      // Merge metadata into rows
      rows = rows.map(row => {
        const meta = authMap.get(row.id);
        if (meta) {
          return {
            ...row,
            plan: row.plan || meta.plan || "Free",
            subscription_status: row.subscription_status || meta.subscription_status || "active",
          };
        }
        return row;
      });
      console.log(`[sync-to-hub] ✅ Injected auth metadata for ${allAuthUsers.length} users.`);
    } catch (err) {
      console.warn(`[sync-to-hub] Exception while fetching auth users:`, err);
    }
  }

  // ── Upsert to Hub in chunks ─────────────────────────────────────────────────
  const chunks = chunkArray(rows, CHUNK_SIZE);
  let totalUpserted = 0;

  for (const chunk of chunks) {
    const { error: upsertError, count } = await hubClient
      .from(tableName)
      .upsert(chunk, {
        onConflict: "id",         // All tables have a UUID primary key `id`
        ignoreDuplicates: false,   // Update existing rows with new data
      })
      .select("id");              // Only fetch count — not full rows

    if (upsertError) {
      console.error(`[sync-to-hub] ERROR upserting into ${tableName}:`, upsertError.message);
      return {
        table: tableName,
        rowsFetched: rows.length,
        rowsUpserted: totalUpserted,
        status: "error",
        error: `Upsert error: ${upsertError.message}`,
      };
    }

    totalUpserted += chunk.length;
    console.log(`[sync-to-hub] ${tableName}: upserted chunk of ${chunk.length} rows`);
  }

  console.log(`[sync-to-hub] ${tableName}: ✅ ${rows.length} rows synced`);

  return {
    table: tableName,
    rowsFetched: rows.length,
    rowsUpserted: totalUpserted,
    status: "success",
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Handler
// ──────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // ── CORS Preflight ──────────────────────────────────────────────────────────
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

  // ── Only allow POST ─────────────────────────────────────────────────────────
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Validate required environment secrets ───────────────────────────────────
  const SOURCE_URL = Deno.env.get("SUPABASE_URL");
  const SOURCE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const HUB_URL = Deno.env.get("HUB_SUPABASE_URL");
  const HUB_SERVICE_KEY = Deno.env.get("HUB_SUPABASE_SERVICE_ROLE_KEY");

  if (!SOURCE_URL || !SOURCE_SERVICE_KEY || !HUB_URL || !HUB_SERVICE_KEY) {
    return new Response(
      JSON.stringify({
        error: "Missing environment variables. Set: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HUB_SUPABASE_URL, HUB_SUPABASE_SERVICE_ROLE_KEY",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── Build Supabase clients ──────────────────────────────────────────────────
  const sourceClient = createClient(SOURCE_URL, SOURCE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const hubClient = createClient(HUB_URL, HUB_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // ── Sync tables sequentially (maintain FK order) ────────────────────────────
  console.log("[sync-to-hub] 🚀 Starting data sync to Hub...");

  const tableResults: SyncTableResult[] = [];

  for (const table of TABLES_TO_SYNC) {
    const result = await syncTable(sourceClient, hubClient, table);
    tableResults.push(result);

    // Stop if a parent table fails (child rows would fail FK constraint anyway)
    if (result.status === "error" && (table === "users")) {
      console.error(`[sync-to-hub] Critical table '${table}' failed — aborting sync.`);
      break;
    }
  }

  // ── Build summary ───────────────────────────────────────────────────────────
  const succeeded = tableResults.filter((r) => r.status === "success").length;
  const failed = tableResults.filter((r) => r.status === "error").length;
  const total_rows_synced = tableResults.reduce((acc, r) => acc + r.rowsUpserted, 0);

  const result: SyncResult = {
    success: failed === 0,
    timestamp: new Date().toISOString(),
    tables: tableResults,
    summary: {
      total_tables: tableResults.length,
      succeeded,
      failed,
      total_rows_synced,
    },
  };

  console.log(`[sync-to-hub] ✅ Sync complete. ${succeeded} tables OK, ${failed} failed. ${total_rows_synced} rows synced.`);

  return new Response(JSON.stringify(result, null, 2), {
    status: failed > 0 ? 207 : 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
