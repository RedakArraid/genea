-- Payment.amount: centimes USD (anciennes valeurs en dollars entiers)
UPDATE "Payment" SET amount = amount * 100 WHERE amount > 0 AND amount <= 500;

-- Retirer CINETPAY (provider retiré du code)
UPDATE "Payment" SET provider = 'PAYSTACK' WHERE provider::text = 'CINETPAY';

ALTER TYPE "PaymentProvider" RENAME TO "PaymentProvider_old";
CREATE TYPE "PaymentProvider" AS ENUM ('PAYSTACK');
ALTER TABLE "Payment"
  ALTER COLUMN provider TYPE "PaymentProvider"
  USING provider::text::"PaymentProvider";
DROP TYPE "PaymentProvider_old";
