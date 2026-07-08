import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{js,ts}'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'server/src/config/plans.js',
        'server/src/config/entitlementPolicy.js',
        'server/src/config/queuePolicy.js',
        'server/src/middleware/entitlements.js',
        'supabase/functions/_shared/deliveryPolicy.ts'
      ],
      thresholds: {
        statements: 75,
        branches: 70,
        functions: 75,
        lines: 75
      }
    }
  }
});
