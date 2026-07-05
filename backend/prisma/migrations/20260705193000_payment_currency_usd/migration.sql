-- Devise par défaut USD (billing international Paystack)
ALTER TABLE "Payment" ALTER COLUMN "currency" SET DEFAULT 'USD';
