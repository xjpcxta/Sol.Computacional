-- Extend catalog entries with an explicit calculation basis.
ALTER TABLE "Template"
ADD COLUMN "calculationBasis" TEXT NOT NULL DEFAULT 'function-points';

CREATE TABLE "TemplateServiceActivity" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedHours" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TemplateServiceActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TemplateServiceActivity_templateId_idx"
ON "TemplateServiceActivity"("templateId");

ALTER TABLE "TemplateServiceActivity"
ADD CONSTRAINT "TemplateServiceActivity_templateId_fkey"
FOREIGN KEY ("templateId") REFERENCES "Template"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Store individual and singleton global commercial parameters.
ALTER TABLE "CostProfile"
ADD COLUMN "profitMarkup" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE TABLE "GlobalCostProfile" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 150,
    "hoursPerPf" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "riskMargin" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "profitMarkup" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GlobalCostProfile_pkey" PRIMARY KEY ("id")
);

-- Snapshot every commercial input and result on new estimates.
ALTER TABLE "Estimate"
ADD COLUMN "profitMarkup" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "pricingSource" TEXT NOT NULL DEFAULT 'user',
ADD COLUMN "functionPointHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "serviceHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "profitAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Preserve the historical relationship: all existing estimated hours came from PF.
UPDATE "Estimate" SET "functionPointHours" = "estimatedHours";

ALTER TABLE "EstimateItem"
ADD COLUMN "calculationBasis" TEXT NOT NULL DEFAULT 'function-points',
ADD COLUMN "serviceHours" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE TABLE "EstimateItemServiceActivity" (
    "id" TEXT NOT NULL,
    "estimateItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedHours" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EstimateItemServiceActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EstimateItemServiceActivity_estimateItemId_idx"
ON "EstimateItemServiceActivity"("estimateItemId");

ALTER TABLE "EstimateItemServiceActivity"
ADD CONSTRAINT "EstimateItemServiceActivity_estimateItemId_fkey"
FOREIGN KEY ("estimateItemId") REFERENCES "EstimateItem"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
