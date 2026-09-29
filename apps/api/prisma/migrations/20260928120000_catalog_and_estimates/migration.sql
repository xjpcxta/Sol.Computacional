-- CreateTable
CREATE TABLE "TemplateComponent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "functionType" TEXT NOT NULL,
    "complexity" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPf" INTEGER NOT NULL,
    "totalPf" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TemplateComponent_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Estimate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "presetKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scopeBoundary" TEXT NOT NULL,
    "calculationNotes" TEXT NOT NULL,
    "hourlyRate" REAL NOT NULL,
    "hoursPerPf" REAL NOT NULL,
    "riskMargin" REAL NOT NULL,
    "totalPf" INTEGER NOT NULL,
    "estimatedHours" REAL NOT NULL,
    "baseCost" REAL NOT NULL,
    "riskAmount" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Estimate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EstimateItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estimateId" TEXT NOT NULL,
    "templateId" TEXT,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalPf" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EstimateItem_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EstimateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EstimateItemComponent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estimateItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "functionType" TEXT NOT NULL,
    "complexity" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPf" INTEGER NOT NULL,
    "totalPf" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EstimateItemComponent_estimateItemId_fkey" FOREIGN KEY ("estimateItemId") REFERENCES "EstimateItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Preserve every legacy Template aggregate as auditable components. Totals that
-- cannot be represented by the official low/medium/high weights stop the
-- migration instead of being silently changed.
CREATE TABLE "_LegacyTemplateComponentSeed" (
    "templateId" TEXT NOT NULL,
    "functionType" TEXT NOT NULL,
    "complexity" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPf" INTEGER NOT NULL
);

WITH RECURSIVE
"legacy"("templateId", "functionType", "points", "lowWeight", "mediumWeight", "highWeight") AS (
    SELECT "id", 'ALI', "pfAli", 7, 10, 15 FROM "Template" WHERE "pfAli" > 0
    UNION ALL SELECT "id", 'AIE', "pfAie", 5, 7, 10 FROM "Template" WHERE "pfAie" > 0
    UNION ALL SELECT "id", 'EE', "pfEe", 3, 4, 6 FROM "Template" WHERE "pfEe" > 0
    UNION ALL SELECT "id", 'SE', "pfSe", 4, 5, 7 FROM "Template" WHERE "pfSe" > 0
    UNION ALL SELECT "id", 'CE', "pfCe", 3, 4, 6 FROM "Template" WHERE "pfCe" > 0
),
"numbers"("n") AS (
    SELECT 0
    UNION ALL
    SELECT "n" + 1 FROM "numbers"
    WHERE "n" < COALESCE((SELECT MAX("points") FROM "legacy"), 0)
),
"combinations" AS (
    SELECT
        "legacy".*,
        "low"."n" AS "lowCount",
        "medium"."n" AS "mediumCount",
        ("points" - "low"."n" * "lowWeight" - "medium"."n" * "mediumWeight") / "highWeight" AS "highCount",
        ROW_NUMBER() OVER (
            PARTITION BY "templateId", "functionType"
            ORDER BY
                "low"."n" + "medium"."n" + (("points" - "low"."n" * "lowWeight" - "medium"."n" * "mediumWeight") / "highWeight") ASC,
                (("points" - "low"."n" * "lowWeight" - "medium"."n" * "mediumWeight") / "highWeight") DESC,
                "medium"."n" DESC
        ) AS "choiceRank"
    FROM "legacy"
    CROSS JOIN "numbers" AS "low"
    CROSS JOIN "numbers" AS "medium"
    WHERE "points" - "low"."n" * "lowWeight" - "medium"."n" * "mediumWeight" >= 0
      AND ("points" - "low"."n" * "lowWeight" - "medium"."n" * "mediumWeight") % "highWeight" = 0
),
"selected" AS (
    SELECT * FROM "combinations" WHERE "choiceRank" = 1
)
INSERT INTO "_LegacyTemplateComponentSeed" ("templateId", "functionType", "complexity", "quantity", "unitPf")
SELECT "templateId", "functionType", 'low', "lowCount", "lowWeight" FROM "selected" WHERE "lowCount" > 0
UNION ALL
SELECT "templateId", "functionType", 'medium', "mediumCount", "mediumWeight" FROM "selected" WHERE "mediumCount" > 0
UNION ALL
SELECT "templateId", "functionType", 'high', "highCount", "highWeight" FROM "selected" WHERE "highCount" > 0;

CREATE TABLE "_LegacyTemplateMigrationValidation" (
    "invalidCount" INTEGER NOT NULL CHECK ("invalidCount" = 0)
);

WITH "legacy"("templateId", "functionType", "points") AS (
    SELECT "id", 'ALI', "pfAli" FROM "Template" WHERE "pfAli" > 0
    UNION ALL SELECT "id", 'AIE', "pfAie" FROM "Template" WHERE "pfAie" > 0
    UNION ALL SELECT "id", 'EE', "pfEe" FROM "Template" WHERE "pfEe" > 0
    UNION ALL SELECT "id", 'SE', "pfSe" FROM "Template" WHERE "pfSe" > 0
    UNION ALL SELECT "id", 'CE', "pfCe" FROM "Template" WHERE "pfCe" > 0
)
INSERT INTO "_LegacyTemplateMigrationValidation" ("invalidCount")
SELECT COUNT(*)
FROM "legacy"
LEFT JOIN "_LegacyTemplateComponentSeed" AS "seed"
  ON "seed"."templateId" = "legacy"."templateId"
 AND "seed"."functionType" = "legacy"."functionType"
WHERE "seed"."templateId" IS NULL;

INSERT INTO "TemplateComponent" (
    "id", "templateId", "name", "description", "functionType", "complexity",
    "quantity", "unitPf", "totalPf", "createdAt", "updatedAt"
)
SELECT
    'legacy-' || "templateId" || '-' || LOWER("functionType") || '-' || "complexity",
    "templateId",
    'Componente legado ' || "functionType" || ' (' || "complexity" || ')',
    'Componente migrado a partir do total funcional preservado no cadastro legado.',
    "functionType",
    "complexity",
    "quantity",
    "unitPf",
    "quantity" * "unitPf",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "_LegacyTemplateComponentSeed";

-- A legacy row with no points remains visible for catalog repair, but cannot
-- accidentally gain points during migration.
INSERT INTO "TemplateComponent" (
    "id", "templateId", "name", "description", "functionType", "complexity",
    "quantity", "unitPf", "totalPf", "createdAt", "updatedAt"
)
SELECT
    'legacy-' || "id" || '-empty',
    "id",
    'Componente legado pendente de revisão',
    'Cadastro legado sem pontos funcionais; revise este componente antes de estimar.',
    'ALI',
    'low',
    0,
    7,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Template"
WHERE "pfAli" + "pfAie" + "pfEe" + "pfSe" + "pfCe" = 0;

DROP TABLE "_LegacyTemplateMigrationValidation";
DROP TABLE "_LegacyTemplateComponentSeed";

-- The preflight migration has made duplicate names deterministic and unique.
CREATE UNIQUE INDEX "Template_name_key" ON "Template"("name");

-- CreateIndex
CREATE INDEX "TemplateComponent_templateId_idx" ON "TemplateComponent"("templateId");

-- CreateIndex
CREATE INDEX "Estimate_userId_createdAt_idx" ON "Estimate"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Estimate_userId_status_sentAt_idx" ON "Estimate"("userId", "status", "sentAt");

-- CreateIndex
CREATE INDEX "EstimateItem_estimateId_idx" ON "EstimateItem"("estimateId");

-- CreateIndex
CREATE INDEX "EstimateItem_templateId_idx" ON "EstimateItem"("templateId");

-- CreateIndex
CREATE INDEX "EstimateItemComponent_estimateItemId_idx" ON "EstimateItemComponent"("estimateItemId");
