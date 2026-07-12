/** Presets et validation de la terminologie des arbres organisation. */

const PRESETS = {
  enterprise: {
    preset: 'enterprise',
    levelTerm: 'Niveau',
    levelAbbrev: 'N',
    levelOrder: 'TOP_HIGH',
    superiorLabel: 'Manager(s)',
    subordinateLabel: 'Équipe',
    addSuperior: '+ Ajouter',
    addSubordinate: '+ Ajouter',
    newSubordinate: 'Nouveau membre',
    linkExistingSubordinate: 'Lier un membre existant',
    asSuperior: 'manager',
    asSubordinate: "membre de l'équipe",
    superiorOf: 'Manager de {{name}}',
    subordinateOf: "Membre de l'équipe de {{name}}",
    roleLabel: 'Poste / Fonction',
    addTitle: 'Ajouter un membre',
  },
  school: {
    preset: 'school',
    levelTerm: 'Niveau',
    levelAbbrev: 'N',
    levelOrder: 'TOP_HIGH',
    superiorLabel: 'Encadrant(s)',
    subordinateLabel: 'Classe',
    addSuperior: '+ Ajouter',
    addSubordinate: '+ Ajouter',
    newSubordinate: 'Nouvel élève',
    linkExistingSubordinate: 'Lier un élève existant',
    asSuperior: 'encadrant',
    asSubordinate: 'élève',
    superiorOf: 'Encadrant de {{name}}',
    subordinateOf: 'Élève de {{name}}',
    roleLabel: 'Rôle / Fonction',
    addTitle: 'Ajouter un membre',
  },
  promo: {
    preset: 'promo',
    levelTerm: 'Vague',
    levelAbbrev: 'V',
    levelOrder: 'TOP_HIGH',
    superiorLabel: 'Responsable(s)',
    subordinateLabel: 'Promotion',
    addSuperior: '+ Ajouter',
    addSubordinate: '+ Ajouter',
    newSubordinate: 'Nouveau membre',
    linkExistingSubordinate: 'Lier un membre existant',
    asSuperior: 'responsable',
    asSubordinate: 'membre',
    superiorOf: 'Responsable de {{name}}',
    subordinateOf: 'Membre de {{name}}',
    roleLabel: 'Poste / Rôle',
    addTitle: 'Ajouter un membre',
  },
  crew: {
    preset: 'crew',
    levelTerm: 'Rang',
    levelAbbrev: 'R',
    levelOrder: 'TOP_HIGH',
    superiorLabel: 'Chef(s)',
    subordinateLabel: 'Équipage',
    addSuperior: '+ Ajouter',
    addSubordinate: '+ Ajouter',
    newSubordinate: 'Nouveau membre',
    linkExistingSubordinate: "Lier un membre existant",
    asSuperior: 'chef',
    asSubordinate: "membre d'équipage",
    superiorOf: 'Chef de {{name}}',
    subordinateOf: "Membre de l'équipage de {{name}}",
    roleLabel: 'Poste / Fonction',
    addTitle: 'Ajouter un membre',
  },
};

const DEFAULT_PRESET = PRESETS.enterprise;

function sanitizeAbbrev(value, fallback = 'N') {
  const s = String(value || '').trim().toUpperCase().slice(0, 3);
  return s || fallback;
}

function sanitizeLabel(value, fallback, maxLen = 48) {
  const s = String(value || '').trim().slice(0, maxLen);
  return s || fallback;
}

function normalizeOrgLexicon(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PRESET };
  const base = PRESETS[raw.preset] || DEFAULT_PRESET;
  const order = raw.levelOrder === 'TOP_LOW' ? 'TOP_LOW' : 'TOP_HIGH';
  return {
    preset: PRESETS[raw.preset] ? raw.preset : 'custom',
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
  };
}

function getOrgLexiconPreset(presetId = 'enterprise') {
  return normalizeOrgLexicon(PRESETS[presetId] || DEFAULT_PRESET);
}

module.exports = {
  PRESETS,
  DEFAULT_PRESET,
  normalizeOrgLexicon,
  getOrgLexiconPreset,
};
