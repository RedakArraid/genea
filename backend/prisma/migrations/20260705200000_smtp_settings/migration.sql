-- SMTP settings singleton (admin UI)

CREATE TABLE IF NOT EXISTS "SmtpSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "host" TEXT,
    "port" INTEGER NOT NULL DEFAULT 587,
    "secure" BOOLEAN NOT NULL DEFAULT false,
    "user" TEXT,
    "pass" TEXT,
    "from" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmtpSetting_pkey" PRIMARY KEY ("id")
);
