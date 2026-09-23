-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "subscribed" BOOLEAN NOT NULL DEFAULT true,
    "filledReadinessForm" BOOLEAN NOT NULL DEFAULT false,
    "filledMaturityTest" BOOLEAN NOT NULL DEFAULT false,
    "settingsDescription" TEXT NOT NULL DEFAULT '',
    "settingsBatch" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyLoginEmail" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "CompanyLoginEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadinessLevel" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "year" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReadinessLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaturityAnswer" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "dimensionId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "comment" TEXT NOT NULL DEFAULT '',
    "dontUnderstand" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MaturityAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideProgress" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "metric" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "bulletIndex" INTEGER NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "GuideProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminEmail" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "number" INTEGER NOT NULL,
    "startDate" TEXT,
    "endDate" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("number")
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

-- CreateIndex
CREATE UNIQUE INDEX "AdminEmail_email_key" ON "AdminEmail"("email");

-- AddForeignKey
ALTER TABLE "CompanyLoginEmail" ADD CONSTRAINT "CompanyLoginEmail_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessLevel" ADD CONSTRAINT "ReadinessLevel_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaturityAnswer" ADD CONSTRAINT "MaturityAnswer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideProgress" ADD CONSTRAINT "GuideProgress_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
