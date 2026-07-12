import type { LevelOrder, OrgLexiconConfig, OrgLexiconPreset } from "../types"

export type { LevelOrder, OrgLexiconConfig, OrgLexiconPreset }

export const ORG_LEXICON_PRESETS: Record<Exclude<OrgLexiconPreset, "custom">, OrgLexiconConfig> = {
  enterprise: {
    preset: "enterprise",
    levelTerm: "Niveau",
    levelAbbrev: "N",
    levelOrder: "TOP_HIGH",
    superiorLabel: "Manager(s)",
    subordinateLabel: "Équipe",
    addSuperior: "+ Ajouter",
    addSubordinate: "+ Ajouter",
    newSubordinate: "Nouveau membre",
    linkExistingSubordinate: "Lier un membre existant",
    asSuperior: "manager",
    asSubordinate: "membre de l'équipe",
    superiorOf: "Manager de {{name}}",
    subordinateOf: "Membre de l'équipe de {{name}}",
    roleLabel: "Poste / Fonction",
    addTitle: "Ajouter un membre",
  },
  school: {
    preset: "school",
    levelTerm: "Niveau",
    levelAbbrev: "N",
    levelOrder: "TOP_HIGH",
    superiorLabel: "Encadrant(s)",
    subordinateLabel: "Classe",
    addSuperior: "+ Ajouter",
    addSubordinate: "+ Ajouter",
    newSubordinate: "Nouvel élève",
    linkExistingSubordinate: "Lier un élève existant",
    asSuperior: "encadrant",
    asSubordinate: "élève",
    superiorOf: "Encadrant de {{name}}",
    subordinateOf: "Élève de {{name}}",
    roleLabel: "Rôle / Fonction",
    addTitle: "Ajouter un membre",
  },
  promo: {
    preset: "promo",
    levelTerm: "Vague",
    levelAbbrev: "V",
    levelOrder: "TOP_HIGH",
    superiorLabel: "Responsable(s)",
    subordinateLabel: "Promotion",
    addSuperior: "+ Ajouter",
    addSubordinate: "+ Ajouter",
    newSubordinate: "Nouveau membre",
    linkExistingSubordinate: "Lier un membre existant",
    asSuperior: "responsable",
    asSubordinate: "membre",
    superiorOf: "Responsable de {{name}}",
    subordinateOf: "Membre de {{name}}",
    roleLabel: "Poste / Rôle",
    addTitle: "Ajouter un membre",
  },
  crew: {
    preset: "crew",
    levelTerm: "Rang",
    levelAbbrev: "R",
    levelOrder: "TOP_HIGH",
    superiorLabel: "Chef(s)",
    subordinateLabel: "Équipage",
    addSuperior: "+ Ajouter",
    addSubordinate: "+ Ajouter",
    newSubordinate: "Nouveau membre",
    linkExistingSubordinate: "Lier un membre existant",
    asSuperior: "chef",
    asSubordinate: "membre d'équipage",
    superiorOf: "Chef de {{name}}",
    subordinateOf: "Membre de l'équipage de {{name}}",
    roleLabel: "Poste / Fonction",
    addTitle: "Ajouter un membre",
  },
}

const DEFAULT = ORG_LEXICON_PRESETS.enterprise

function sanitizeAbbrev(value: unknown, fallback = "N"): string {
  const s = String(value ?? "").trim().toUpperCase().slice(0, 3)
  return s || fallback
}

function sanitizeLabel(value: unknown, fallback: string, maxLen = 48): string {
  const s = String(value ?? "").trim().slice(0, maxLen)
  return s || fallback
}

export function normalizeOrgLexicon(raw?: Partial<OrgLexiconConfig> | null): OrgLexiconConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT }
  const base =
    raw.preset && raw.preset !== "custom" && ORG_LEXICON_PRESETS[raw.preset as Exclude<OrgLexiconPreset, "custom">]
      ? ORG_LEXICON_PRESETS[raw.preset as Exclude<OrgLexiconPreset, "custom">]
      : DEFAULT
  const order: LevelOrder = raw.levelOrder === "TOP_LOW" ? "TOP_LOW" : "TOP_HIGH"
  return {
    preset: raw.preset && (raw.preset === "custom" || ORG_LEXICON_PRESETS[raw.preset as Exclude<OrgLexiconPreset, "custom">])
      ? raw.preset
      : "custom",
    levelTerm: sanitizeLabel(raw.levelTerm, base.levelTerm, 24),
    levelAbbrev: sanitizeAbbrev(raw.levelAbbrev, base.levelAbbrev),
    levelOrder: order,
    superiorLabel: sanitizeLabel(raw.superiorLabel, base.superiorLabel),
    subordinateLabel: sanitizeLabel(raw.subordinateLabel, base.subordinateLabel),
    addSuperior: sanitizeLabel(raw.addSuperior, base.addSuperior, 32),
    addSubordinate: sanitizeLabel(raw.addSubordinate, base.addSubordinate, 32),
    newSubordinate: sanitizeLabel(raw.newSubordinate, base.newSubordinate),
    linkExistingSubordinate: sanitizeLabel(raw.linkExistingSubordinate, base.linkExistingSubordinate),
    asSuperior: sanitizeLabel(raw.asSuperior, base.asSuperior, 32),
    asSubordinate: sanitizeLabel(raw.asSubordinate, base.asSubordinate, 32),
    superiorOf: sanitizeLabel(raw.superiorOf, base.superiorOf, 64),
    subordinateOf: sanitizeLabel(raw.subordinateOf, base.subordinateOf, 64),
    roleLabel: sanitizeLabel(raw.roleLabel, base.roleLabel),
    addTitle: sanitizeLabel(raw.addTitle, base.addTitle),
  }
}

export function resolveOrgLexicon(tree?: { orgLexicon?: Partial<OrgLexiconConfig> | null } | null): OrgLexiconConfig {
  return normalizeOrgLexicon(tree?.orgLexicon as Partial<OrgLexiconConfig> | null)
}

export function applyTemplate(template: string, name: string): string {
  return template.replace(/\{\{name\}\}/g, name)
}

export function getPresetLexicon(preset: Exclude<OrgLexiconPreset, "custom">): OrgLexiconConfig {
  return { ...ORG_LEXICON_PRESETS[preset] }
}
