-- CreateTable
CREATE TABLE "Company" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "subscribed" BOOLEAN NOT NULL DEFAULT true,
    "filledReadinessForm" BOOLEAN NOT NULL DEFAULT false,
    "filledMaturityTest" BOOLEAN NOT NULL DEFAULT false,
    "settingsDescription" TEXT NOT NULL DEFAULT '',
    "settingsBatch" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CompanyLoginEmail" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    CONSTRAINT "CompanyLoginEmail_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReadinessLevel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "year" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ReadinessLevel_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaturityAnswer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "dimensionId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "comment" TEXT NOT NULL DEFAULT '',
    "dontUnderstand" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "MaturityAnswer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GuideProgress" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "metric" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "bulletIndex" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "GuideProgress_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CompanyLoginEmail_companyId_idx" ON "CompanyLoginEmail"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyLoginEmail_companyId_position_key" ON "CompanyLoginEmail"("companyId", "position");

-- CreateIndex
CREATE INDEX "ReadinessLevel_companyId_idx" ON "ReadinessLevel"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadinessLevel_companyId_year_metric_key" ON "ReadinessLevel"("companyId", "year", "metric");

-- CreateIndex
CREATE INDEX "MaturityAnswer_companyId_idx" ON "MaturityAnswer"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "MaturityAnswer_companyId_dimensionId_stageId_key" ON "MaturityAnswer"("companyId", "dimensionId", "stageId");

-- CreateIndex
CREATE INDEX "GuideProgress_companyId_idx" ON "GuideProgress"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "GuideProgress_companyId_metric_level_bulletIndex_key" ON "GuideProgress"("companyId", "metric", "level", "bulletIndex");
