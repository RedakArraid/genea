/** Feature flags produit — activer via VITE_FEATURE_DOCUMENTS_ENABLED=true */
export const FEATURES = {
  documentsEnabled: import.meta.env.VITE_FEATURE_DOCUMENTS_ENABLED === "true",
} as const
