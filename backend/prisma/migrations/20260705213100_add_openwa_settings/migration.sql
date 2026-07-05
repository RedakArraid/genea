-- OpenWA settings singleton (admin UI)

CREATE TABLE IF NOT EXISTS "OpenWaSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "baseUrl" TEXT,
    "apiKey" TEXT,
    "sessionId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpenWaSetting_pkey" PRIMARY KEY ("id")
);
