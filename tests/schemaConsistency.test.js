import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const migrationsDirectory = resolve(root, 'supabase', 'migrations');

describe('database user-table consistency', () => {
  it('creates public.users before dependent migrations', () => {
    const migrations = readdirSync(migrationsDirectory)
      .filter((name) => name.endsWith('.sql'))
      .sort();

    expect(migrations[0]).toBe('202602120001_create_users.sql');
    const bootstrap = readFileSync(
      resolve(migrationsDirectory, migrations[0]),
      'utf8',
    );
    expect(bootstrap).toMatch(/create table if not exists public\.users/i);
  });

  it('does not create or query public.profiles', () => {
    const migrationSql = readdirSync(migrationsDirectory)
      .filter((name) => name.endsWith('.sql'))
      .map((name) => readFileSync(resolve(migrationsDirectory, name), 'utf8'))
      .join('\n');
    const autoDmService = readFileSync(
      resolve(root, 'server', 'src', 'services', 'autodm.js'),
      'utf8',
    );

    expect(migrationSql).not.toMatch(/\bpublic\.profiles\b/i);
    expect(autoDmService).not.toMatch(/\.from\(['"]profiles['"]\)/i);
  });

  it('keeps plan fields on public.users', () => {
    const planMigration = readFileSync(
      resolve(migrationsDirectory, '202604290002_add_plan_to_users.sql'),
      'utf8',
    );
    expect(planMigration).toMatch(/alter table public\.users/i);
    expect(planMigration).toMatch(/subscription_status/i);
    expect(planMigration).toMatch(/hub_user_id/i);
  });

  it('tracks the broadcasts table with the canonical user foreign key', () => {
    const broadcastsMigration = readFileSync(
      resolve(migrationsDirectory, '202602120002_create_broadcasts.sql'),
      'utf8',
    );
    expect(broadcastsMigration).toMatch(
      /references public\.users\(id\) on delete cascade/i,
    );
    expect(broadcastsMigration).toMatch(/selected_channels jsonb/i);
    expect(broadcastsMigration).toMatch(/platform_data jsonb/i);
    expect(broadcastsMigration).toMatch(/scheduled_for timestamptz/i);
    expect(broadcastsMigration).toMatch(/enable row level security/i);
  });
});
