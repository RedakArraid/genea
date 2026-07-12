-- Droit de gérer les collaborateurs (délégation propriétaire)
ALTER TABLE "TreeCollaborator" ADD COLUMN IF NOT EXISTS "canManageCollaborators" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TreeInvite" ADD COLUMN IF NOT EXISTS "canManageCollaborators" BOOLEAN NOT NULL DEFAULT false;
