-- Normalize duplicate legacy names before the catalog adds its unique constraint.
-- Every duplicate receives its own stable UUID prefix; no row is deleted or merged.
UPDATE "Template"
SET "name" = '[legado:' || "id" || '] ' || "name"
WHERE "name" IN (
    SELECT "name"
    FROM "Template"
    GROUP BY "name"
    HAVING COUNT(*) > 1
);
