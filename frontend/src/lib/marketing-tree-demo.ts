import type { Person, Relationship } from "@/types"

const TREE_ID = "marketing-demo"

/** Sous-ensemble statique Famille Dupont pour l'aperçu hero (sans API). */
export const MARKETING_DEMO_PERSONS: Person[] = [
  { id: "m-jean", firstName: "Jean", lastName: "Dupont", birthDate: "1940-03-15", birthPlace: "Paris", gender: "male", treeId: TREE_ID },
  { id: "m-marie", firstName: "Marie", lastName: "Dupont", birthDate: "1942-06-20", birthPlace: "Lyon", gender: "female", treeId: TREE_ID },
  { id: "m-pierre", firstName: "Pierre", lastName: "Dupont", birthDate: "1970-09-10", birthPlace: "Paris", gender: "male", treeId: TREE_ID },
  { id: "m-sophie", firstName: "Sophie", lastName: "Dupont", birthDate: "1972-12-05", birthPlace: "Marseille", gender: "female", treeId: TREE_ID },
  { id: "m-paul", firstName: "Paul", lastName: "Dupont", birthDate: "1968-04-18", birthPlace: "Paris", gender: "male", treeId: TREE_ID },
  { id: "m-claire", firstName: "Claire", lastName: "Dupont", birthDate: "1971-11-22", birthPlace: "Bordeaux", gender: "female", treeId: TREE_ID },
  { id: "m-lucie", firstName: "Lucie", lastName: "Dupont", birthDate: "2000-02-25", birthPlace: "Paris", gender: "female", treeId: TREE_ID },
  { id: "m-thomas", firstName: "Thomas", lastName: "Dupont", birthDate: "2002-07-30", birthPlace: "Paris", gender: "male", treeId: TREE_ID },
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
]

/** Nœud mis en avant dans l'aperçu hero */
export const MARKETING_HIGHLIGHT_PERSON_ID = "m-pierre"
