-- UserRole enum and role column

DO $$ BEGIN CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'USER';
