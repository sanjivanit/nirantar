import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Every test file shares one live, persistent database (no per-test
    // transaction isolation) — several tests measure aggregate state
    // (e.g. vendor-records-summary.test.ts's before/after delta) that's
    // only correct if no other file is concurrently inserting into the
    // same company. Vitest parallelizes across files by default, which
    // caused exactly that: an unrelated vendor-import.test.ts insert
    // landed inside another test's before/after window. Running files
    // sequentially is the correct fix for this suite's actual architecture,
    // not a workaround for one flaky test.
    fileParallelism: false,
  },
});
