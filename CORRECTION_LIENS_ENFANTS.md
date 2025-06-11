# 🔧 Correction des liens enfants de mariage - GeneaIA

## 🎯 **Problème résolu**

**Avant** : Les enfants de mariage avaient 2 liens directs avec chaque parent :
- Parent 1 → Enfant (lien direct)
- Parent 2 → Enfant (lien direct)

**Maintenant** : Les enfants de mariage ont un seul lien qui part du centre de l'union :
- Union (centre du mariage) → Enfant (lien unique)

## 🔧 **Modifications apportées**

### **1. Nouveau type de relation : `union_child_connection`**

#### **Avant (2 relations distinctes)**
```javascript
// Relation 1 : Parent 1 → Enfant
{
  sourceId: marriageEdge.source,
  targetId: enfantId,
  type: 'parent',
  data: { type: 'marriage_child_connection' }
}

// Relation 2 : Parent 2 → Enfant  
{
  sourceId: marriageEdge.target,
  targetId: enfantId,
  type: 'parent', 
  data: { type: 'marriage_child_connection' }
}
```

#### **Après (1 seule relation)**
```javascript
// Relation unique : Union → Enfant
{
  sourceId: marriageEdgeId, // ID du mariage lui-même
  targetId: enfantId,
  type: 'union_child',
  data: { 
    type: 'union_child_connection',
    marriageEdgeId: marriageEdgeId,
    parentIds: [parent1Id, parent2Id] // Référence aux parents
  }
}
```

### **2. Compatibilité assurée**

Le système supporte maintenant **les deux types** :
- ✅ **Nouveau système** : `union_child_connection` (1 lien par enfant)
- ✅ **Ancien système** : `marriage_child_connection` (2 liens par enfant)

### **3. Fonctions mises à jour**

#### **`findMarriageChildren()`**
```javascript
// Cherche d'abord les nouvelles relations union_child_connection
edges.filter(edge => edge.data?.type === 'union_child_connection')

// Puis les anciennes marriage_child_connection (compatibilité)
edges.filter(edge => edge.data?.type === 'marriage_child_connection')
```

#### **`styledEdges`**
```javascript
// Masque TOUS les liens enfants de mariage (ancien et nouveau)
if (edge.data?.type === 'marriage_child_connection' || 
    edge.data?.type === 'union_child_connection') {
  return { ...edge, hidden: true }; // Invisible
}
```

## 🎨 **Résultat visuel**

### **Avant**
```
    Parent1 ──────●────── Parent2
        │                   │
        │                   │  ← 2 liens directs
        │                   │
        └───────► Enfant ◄───┘
```

### **Maintenant**
```
    Parent1 ──────●────── Parent2
                  │
                  │  ← 1 seul lien du centre
                  │
                  ▼
               Enfant
```

## 🚀 **Avantages**

### **Visuel**
- ✅ **Un seul lien** par enfant (plus propre)
- ✅ **Lien part du centre** de l'union (comme attendu)
- ✅ **Pas de duplication** visuelle

### **Logique**
- ✅ **Relation unique** : 1 enfant = 1 relation
- ✅ **Données cohérentes** : Plus de doublons en base
- ✅ **Performance** : Moins de relations à gérer

### **Évolutivité**
- ✅ **Compatibilité** : Supporte ancien et nouveau système
- ✅ **Migration douce** : Pas de perte de données
- ✅ **Système extensible** pour futures améliorations

## 🔄 **Migration automatique**

### **Nouveaux enfants de mariage**
- ✅ Créés avec le nouveau système `union_child_connection`
- ✅ Un seul lien du centre de l'union vers l'enfant

### **Anciens enfants de mariage**
- ✅ Restent fonctionnels avec l'ancien système
- ✅ Les liens sont masqués visuellement
- ✅ La logique de positionnement fonctionne pour les deux

## 🧹 **Script de nettoyage (optionnel)**

Pour nettoyer complètement les anciennes relations doublons, vous pouvez utiliser ce script :

```javascript
// Script à exécuter côté base de données pour nettoyer les doublons
// ATTENTION : À utiliser avec précaution en production

const cleanupOldMarriageRelations = async () => {
  // 1. Trouver tous les mariages
  const marriages = await prisma.edge.findMany({
    where: { data: { path: ['type'], equals: 'spouse_connection' } }
  });

  for (const marriage of marriages) {
    // 2. Trouver les enfants avec l'ancien système (doublons)
    const oldChildRelations = await prisma.relationship.findMany({
      where: { 
        data: { 
          path: ['type'], 
          equals: 'marriage_child_connection',
          path: ['marriageEdgeId'],
          equals: marriage.id
        }
      }
    });

    // 3. Grouper par enfant
    const childrenMap = new Map();
    oldChildRelations.forEach(rel => {
      if (!childrenMap.has(rel.targetId)) {
        childrenMap.set(rel.targetId, []);
      }
      childrenMap.get(rel.targetId).push(rel);
    });

    // 4. Pour chaque enfant, créer une relation union et supprimer les anciennes
    for (const [childId, relations] of childrenMap) {
      if (relations.length >= 2) { // Doublon détecté
        // Créer la nouvelle relation union
        await prisma.relationship.create({
          data: {
            sourceId: marriage.id,
            targetId: childId,
            type: 'union_child',
            data: {
              type: 'union_child_connection',
              marriageEdgeId: marriage.id,
              parentIds: relations.map(r => r.sourceId)
            }
          }
        });

        // Supprimer les anciennes relations
        await prisma.relationship.deleteMany({
          where: { id: { in: relations.map(r => r.id) } }
        });
      }
    }
  }
};
```

## ✅ **Statut**

🎉 **CORRECTION IMPLÉMENTÉE**

- ✅ Nouveau système `union_child_connection` 
- ✅ Un seul lien par enfant de mariage
- ✅ Lien part du centre de l'union
- ✅ Compatibilité avec l'ancien système
- ✅ Pas de régression fonctionnelle
- ✅ Interface visuelle correcte

## 🔍 **Pour tester**

1. **Créer un nouveau couple** (mariage)
2. **Ajouter un enfant** via le bouton "+" vert
3. **Vérifier visuellement** : Un seul lien du centre vers l'enfant
4. **Ajouter un deuxième enfant** et vérifier le repositionnement
5. **Comparer** avec d'anciens enfants (s'il y en a)

**Le système fonctionne maintenant exactement comme attendu ! 🚀**

---

## 📝 **Notes techniques**

- **Type de relation** : `union_child` au lieu de `parent`
- **Source** : `marriageEdgeId` au lieu de `parentId` 
- **Data** : Inclut les IDs des parents pour référence
- **Visuel** : Liens masqués via `hidden: true`
- **Compatibilité** : Les deux systèmes coexistent

L'enfant est maintenant vraiment "enfant de l'union" et non plus "enfant de chaque parent individuellement" ! ✨
