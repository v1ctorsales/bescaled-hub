-- The first reporting period is now "10/2026" (was "09/2026"): move existing rows.
UPDATE "ReadinessLevel" SET "year" = '10/2026' WHERE "year" = '09/2026';
