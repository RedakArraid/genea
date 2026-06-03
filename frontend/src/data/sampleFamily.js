/**
 * Données de test pour créer un arbre comme dans l'image de référence
 * À utiliser pour tester rapidement la vue traditionnelle
 */

// Exemple de données pour reproduire l'arbre de l'image de référence
export const sampleFamilyData = {
  // Génération des grands-parents
  grandparents: [
    {
      firstName: "Bernard",
      lastName: "Martin",
      gender: "male",
      birthDate: "1945-03-15",
      birthPlace: "Paris, France"
    },
    {
      firstName: "Monique", 
      lastName: "Martin",
      gender: "female", 
      birthDate: "1947-07-22",
      birthPlace: "Lyon, France"
    }
  ],
  
  // Génération des parents
  parents: [
    {
      firstName: "Franck",
      lastName: "Martin", 
      gender: "male",
      birthDate: "1970-05-10",
      birthPlace: "Paris, France"
    },
    {
      firstName: "Nathalie",
      lastName: "Martin",
      gender: "female",
      birthDate: "1972-09-18", 
      birthPlace: "Marseille, France"
    },
    {
      firstName: "Karine",
      lastName: "Dubois",
      gender: "female", 
      birthDate: "1968-12-03",
      birthPlace: "Toulouse, France"
    },
    {
      firstName: "Olivier",
      lastName: "Dubois",
      gender: "male",
      birthDate: "1965-11-25",
      birthPlace: "Nice, France"
    }
  ],
  
  // Génération des enfants
  children: [
    {
      firstName: "Alice",
      lastName: "Martin",
      gender: "female",
      birthDate: "1995-04-08",
      birthPlace: "Paris, France"
    },
    {
      firstName: "Tom", 
      lastName: "Martin",
      gender: "male",
      birthDate: "1998-01-12",
      birthPlace: "Paris, France"
    },
    {
      firstName: "Gaëlle",
      lastName: "Dubois", 
      gender: "female",
      birthDate: "1992-08-14",
      birthPlace: "Toulouse, France"
    },
    {
      firstName: "Louise",
      lastName: "Dubois",
      gender: "female", 
      birthDate: "1994-06-30",
      birthPlace: "Nice, France"
    },
    {
      firstName: "Hugo",
      lastName: "Dubois",
      gender: "male",
      birthDate: "1996-10-22", 
      birthPlace: "Nice, France"
    }
  ]
};

// Relations familiales
export const sampleRelationships = [
  // Mariages
  { type: 'spouse', person1: 'Bernard', person2: 'Monique' },
  { type: 'spouse', person1: 'Franck', person2: 'Nathalie' },
  { type: 'spouse', person1: 'Karine', person2: 'Olivier' },
  
  // Relations parent-enfant (grands-parents vers parents)
  { type: 'parent', parent: 'Bernard', child: 'Franck' },
  { type: 'parent', parent: 'Monique', child: 'Franck' },
  { type: 'parent', parent: 'Bernard', child: 'Karine' },
  { type: 'parent', parent: 'Monique', child: 'Karine' },
  
  // Relations parent-enfant (parents vers enfants)
  { type: 'parent', parent: 'Franck', child: 'Alice' },
  { type: 'parent', parent: 'Nathalie', child: 'Alice' },
  { type: 'parent', parent: 'Franck', child: 'Tom' },
  { type: 'parent', parent: 'Nathalie', child: 'Tom' },
  
  { type: 'parent', parent: 'Karine', child: 'Gaëlle' },
  { type: 'parent', parent: 'Olivier', child: 'Gaëlle' },
  { type: 'parent', parent: 'Karine', child: 'Louise' },
  { type: 'parent', parent: 'Olivier', child: 'Louise' },
  { type: 'parent', parent: 'Karine', child: 'Hugo' },
  { type: 'parent', parent: 'Olivier', child: 'Hugo' }
];

/**
 * Instructions pour créer l'arbre de test :
 * 
 * 1. Créer un nouvel arbre dans l'interface
 * 2. Ajouter d'abord Bernard (modifier la personne racine)
 * 3. Ajouter Monique comme conjointe de Bernard
 * 4. Ajouter Franck comme enfant du couple Bernard-Monique
 * 5. Ajouter Nathalie comme conjointe de Franck
 * 6. Ajouter Alice et Tom comme enfants du couple Franck-Nathalie
 * 7. Ajouter Karine comme enfant du couple Bernard-Monique
 * 8. Ajouter Olivier comme conjoint de Karine
 * 9. Ajouter Gaëlle, Louise et Hugo comme enfants du couple Karine-Olivier
 * 
 * Résultat final :
 * 
 *     Bernard ——————— Monique
 *       |               |
 *       └———————————————┘
 *               |
 *       ┌———————┼———————┐
 *       |       |       |
 *     Franck — Nathalie Karine — Olivier
 *       |       |         |       |
 *       └———┬———┘         └———┬———┘
 *           |                 |
 *       ┌───┼───┐         ┌───┼───┬───┐
 *       |   |   |         |   |   |   |
 *     Alice Tom ...     Gaëlle Louise Hugo
 */

export default { sampleFamilyData, sampleRelationships };
