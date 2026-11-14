import { defineConfig } from "vitest/config";

// Tests run against their own throwaway database (<db>_test), recreated, migrated and seeded for every run
// (test/globalSetup.ts). They never touch dev data and never race a running dev worker.
export default defineConfig({
  test: {
    globalSetup: ["./test/globalSetup.ts"],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
