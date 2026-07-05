-- User : téléphone obligatoire, email optionnel
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- Éviter les conflits d'unicité : réaffecter testeur avant test@example.com
UPDATE "User" SET phone = '+2250700000004' WHERE email = 'testeur@geneaia.app';
UPDATE "User" SET phone = '+2250700000010' WHERE email = 'admin@geneaia.app' AND phone IS NULL;
UPDATE "User" SET phone = '+2250700000001' WHERE email = 'test@example.com' AND phone IS NULL;
UPDATE "User" SET phone = '+2250700000002' WHERE email = 'demo@geneaia.app' AND phone IS NULL;
UPDATE "User" SET phone = '+2250700000003'
WHERE phone IS NULL;

ALTER TABLE "User" ALTER COLUMN "phone" SET NOT NULL;

-- OtpCode : indexé par téléphone
ALTER TABLE "OtpCode" ADD COLUMN "phone" TEXT;

UPDATE "OtpCode" o
SET phone = u.phone
FROM "User" u
WHERE o.email IS NOT NULL AND lower(u.email) = lower(o.email);

DELETE FROM "OtpCode" WHERE phone IS NULL;

ALTER TABLE "OtpCode" DROP COLUMN "email";
ALTER TABLE "OtpCode" ALTER COLUMN "phone" SET NOT NULL;

DROP INDEX IF EXISTS "OtpCode_email_purpose_idx";
CREATE INDEX "OtpCode_phone_purpose_idx" ON "OtpCode"("phone", "purpose");
