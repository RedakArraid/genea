import type { Person, Relationship } from "@/types"

const TREE_ID = "marketing-org-demo"

/** Organigramme statique « Kora Digital » — 15 collaborateurs (sans API). */
export const MARKETING_ORG_PERSONS: Person[] = [
  { id: "o-aissata", firstName: "Aïssata", lastName: "Koné", occupation: "Directrice générale", birthDate: "2019-01-15", birthPlace: "Abidjan", treeId: TREE_ID },
  { id: "o-moussa", firstName: "Moussa", lastName: "Diallo", occupation: "Directeur technique", birthDate: "2019-03-01", birthPlace: "Abidjan", treeId: TREE_ID },
  { id: "o-fatoumata", firstName: "Fatoumata", lastName: "Bamba", occupation: "Directrice RH", birthDate: "2019-02-10", birthPlace: "Bamako", treeId: TREE_ID },
  { id: "o-ibrahim", firstName: "Ibrahim", lastName: "Touré", occupation: "Directeur commercial", birthDate: "2019-04-01", birthPlace: "Dakar", treeId: TREE_ID },
  { id: "o-amadou", firstName: "Amadou", lastName: "Keita", occupation: "Lead développement", birthDate: "2020-06-01", birthPlace: "Abidjan", treeId: TREE_ID },
  { id: "o-seydou", firstName: "Seydou", lastName: "Camara", occupation: "Chef de produit", birthDate: "2020-07-15", birthPlace: "Conakry", treeId: TREE_ID },
  { id: "o-nadia", firstName: "Nadia", lastName: "Sanogo", occupation: "Développeuse", birthDate: "2021-01-10", birthPlace: "Ouagadougou", treeId: TREE_ID },
  { id: "o-yao", firstName: "Yao", lastName: "Kouassi", occupation: "Développeur", birthDate: "2021-03-20", birthPlace: "Abidjan", treeId: TREE_ID },
  { id: "o-kadiatou", firstName: "Kadiatou", lastName: "Cissé", occupation: "Développeuse", birthDate: "2022-02-01", birthPlace: "Bamako", treeId: TREE_ID },
  { id: "o-mariam", firstName: "Mariam", lastName: "Ouattara", occupation: "Designer UX", birthDate: "2021-09-01", birthPlace: "Abidjan", treeId: TREE_ID },
  { id: "o-aminata", firstName: "Aminata", lastName: "Traoré", occupation: "Responsable RH", birthDate: "2020-05-01", birthPlace: "Bamako", treeId: TREE_ID },
  { id: "o-fanta", firstName: "Fanta", lastName: "Diabaté", occupation: "Chargée RH", birthDate: "2021-11-01", birthPlace: "Abidjan", treeId: TREE_ID },
  { id: "o-jeanpaul", firstName: "Jean-Paul", lastName: "N'Guessan", occupation: "Chargé RH", birthDate: "2022-04-15", birthPlace: "Abidjan", treeId: TREE_ID },
  { id: "o-salif", firstName: "Salif", lastName: "Konaté", occupation: "Responsable ventes", birthDate: "2020-08-01", birthPlace: "Dakar", treeId: TREE_ID },
  { id: "o-awa", firstName: "Awa", lastName: "Sarr", occupation: "Commerciale", birthDate: "2021-06-01", birthPlace: "Dakar", treeId: TREE_ID },
]

export const MARKETING_ORG_RELATIONSHIPS: Relationship[] = [
  { id: "or1", type: "parent", sourceId: "o-aissata", targetId: "o-moussa" },
  { id: "or2", type: "parent", sourceId: "o-aissata", targetId: "o-fatoumata" },
  { id: "or3", type: "parent", sourceId: "o-aissata", targetId: "o-ibrahim" },
  { id: "or4", type: "parent", sourceId: "o-moussa", targetId: "o-amadou" },
  { id: "or5", type: "parent", sourceId: "o-moussa", targetId: "o-seydou" },
  { id: "or6", type: "parent", sourceId: "o-amadou", targetId: "o-nadia" },
  { id: "or7", type: "parent", sourceId: "o-amadou", targetId: "o-yao" },
  { id: "or8", type: "parent", sourceId: "o-amadou", targetId: "o-kadiatou" },
  { id: "or9", type: "parent", sourceId: "o-seydou", targetId: "o-mariam" },
  { id: "or10", type: "parent", sourceId: "o-fatoumata", targetId: "o-aminata" },
  { id: "or11", type: "parent", sourceId: "o-aminata", targetId: "o-fanta" },
  { id: "or12", type: "parent", sourceId: "o-aminata", targetId: "o-jeanpaul" },
  { id: "or13", type: "parent", sourceId: "o-ibrahim", targetId: "o-salif" },
  { id: "or14", type: "parent", sourceId: "o-salif", targetId: "o-awa" },
]

export const MARKETING_ORG_COMPANY_NAME = "Kora Digital"

export const MARKETING_ORG_HIGHLIGHT_PERSON_ID = "o-amadou"
