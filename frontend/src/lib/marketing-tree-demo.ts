import type { Person, Relationship } from "@/types"

const TREE_ID = "marketing-demo"

/** Famille Dupont — même structure que l'arbre démo public (10 personnes). */
export const MARKETING_DEMO_PERSONS: Person[] = [
  { id: "m-jean", firstName: "Jean", lastName: "Dupont", birthDate: "1940-03-15", birthPlace: "Paris", gender: "male", occupation: "Ingénieur retraité", treeId: TREE_ID },
  { id: "m-marie", firstName: "Marie", lastName: "Dupont", birthDate: "1942-06-20", birthPlace: "Lyon", gender: "female", occupation: "Enseignante retraitée", treeId: TREE_ID },
  { id: "m-pierre", firstName: "Pierre", lastName: "Dupont", birthDate: "1970-09-10", birthPlace: "Paris", gender: "male", occupation: "Médecin", treeId: TREE_ID },
  { id: "m-sophie", firstName: "Sophie", lastName: "Dupont", birthDate: "1972-12-05", birthPlace: "Marseille", gender: "female", occupation: "Architecte", treeId: TREE_ID },
  { id: "m-paul", firstName: "Paul", lastName: "Dupont", birthDate: "1968-04-18", birthPlace: "Paris", gender: "male", occupation: "Avocat", treeId: TREE_ID },
  { id: "m-claire", firstName: "Claire", lastName: "Dupont", birthDate: "1971-11-22", birthPlace: "Bordeaux", gender: "female", occupation: "Journaliste", treeId: TREE_ID },
  { id: "m-lucie", firstName: "Lucie", lastName: "Dupont", birthDate: "2000-02-25", birthPlace: "Paris", gender: "female", occupation: "Étudiante", treeId: TREE_ID },
  { id: "m-thomas", firstName: "Thomas", lastName: "Dupont", birthDate: "2002-07-30", birthPlace: "Paris", gender: "male", occupation: "Étudiant", treeId: TREE_ID },
  { id: "m-emma", firstName: "Emma", lastName: "Dupont", birthDate: "2004-05-12", birthPlace: "Paris", gender: "female", occupation: "Lycéenne", treeId: TREE_ID },
  { id: "m-hugo", firstName: "Hugo", lastName: "Dupont", birthDate: "2006-09-08", birthPlace: "Paris", gender: "male", occupation: "Collégien", treeId: TREE_ID },
]

export const MARKETING_DEMO_RELATIONSHIPS: Relationship[] = [
  { id: "r1", type: "spouse", sourceId: "m-jean", targetId: "m-marie" },
  { id: "r2", type: "parent", sourceId: "m-jean", targetId: "m-pierre" },
  { id: "r3", type: "parent", sourceId: "m-marie", targetId: "m-pierre" },
  { id: "r4", type: "parent", sourceId: "m-jean", targetId: "m-paul" },
  { id: "r5", type: "parent", sourceId: "m-marie", targetId: "m-paul" },
  { id: "r6", type: "spouse", sourceId: "m-pierre", targetId: "m-sophie" },
  { id: "r7", type: "spouse", sourceId: "m-paul", targetId: "m-claire" },
  { id: "r8", type: "parent", sourceId: "m-pierre", targetId: "m-lucie" },
  { id: "r9", type: "parent", sourceId: "m-sophie", targetId: "m-lucie" },
  { id: "r10", type: "parent", sourceId: "m-pierre", targetId: "m-thomas" },
  { id: "r11", type: "parent", sourceId: "m-sophie", targetId: "m-thomas" },
  { id: "r12", type: "parent", sourceId: "m-pierre", targetId: "m-emma" },
  { id: "r13", type: "parent", sourceId: "m-sophie", targetId: "m-emma" },
  { id: "r14", type: "parent", sourceId: "m-pierre", targetId: "m-hugo" },
  { id: "r15", type: "parent", sourceId: "m-sophie", targetId: "m-hugo" },
  { id: "r16", type: "sibling", sourceId: "m-lucie", targetId: "m-thomas" },
  { id: "r17", type: "sibling", sourceId: "m-emma", targetId: "m-hugo" },
]

/** Positions identiques à backend/src/lib/demoTree.js (espacement 56 px entre cartes). */
export const MARKETING_DEMO_POSITIONS: Record<string, { x: number; y: number }> = {
  "m-jean": { x: 400, y: 40 },
  "m-marie": { x: 576, y: 40 },
  "m-pierre": { x: 40, y: 290 },
  "m-sophie": { x: 216, y: 290 },
  "m-paul": { x: 752, y: 290 },
  "m-claire": { x: 928, y: 290 },
  "m-lucie": { x: 40, y: 540 },
  "m-thomas": { x: 216, y: 540 },
  "m-emma": { x: 392, y: 540 },
  "m-hugo": { x: 568, y: 540 },
}

export const MARKETING_HIGHLIGHT_PERSON_ID = "m-pierre"
