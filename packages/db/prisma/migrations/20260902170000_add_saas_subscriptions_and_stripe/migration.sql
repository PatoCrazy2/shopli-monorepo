-- CreateEnum (Safe check if not exists)
DO $$ BEGIN
    CREATE TYPE "SubscriptionPlan" AS ENUM ('ARRANQUE', 'CRECIMIENTO', 'MULTISUCURSAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum (Safe check if not exists)
DO $$ BEGIN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'GRACE_PERIOD', 'PAST_DUE', 'CANCELED', 'UNPAID');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable Empresa (Pure DDL, without arbitrary business updates)
ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "plan" "SubscriptionPlan" NOT NULL DEFAULT 'CRECIMIENTO',
ADD COLUMN IF NOT EXISTS "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3) DEFAULT (CURRENT_TIMESTAMP + INTERVAL '14 days'),
ADD COLUMN IF NOT EXISTS "gracePeriodEndsAt" TIMESTAMP(3) DEFAULT (CURRENT_TIMESTAMP + INTERVAL '17 days'),
ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT,
ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT,
ADD COLUMN IF NOT EXISTS "stripeSubscriptionItemId" TEXT,
ADD COLUMN IF NOT EXISTS "stripePriceId" TEXT,
ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3);

-- CreateTable StripeWebhookEvent
CREATE TABLE IF NOT EXISTS "StripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Empresa_stripeCustomerId_key" ON "Empresa"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Empresa_stripeSubscriptionId_key" ON "Empresa"("stripeSubscriptionId");
