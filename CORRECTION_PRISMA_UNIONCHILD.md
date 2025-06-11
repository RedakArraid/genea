# 🔧 Instructions pour corriger Prisma - UnionChild

## ❌ PROBLÈME DÉTECTÉ
```
Unknown field `UnionChild` for include statement on model `FamilyTree`
```

## 🎯 SOLUTION SIMPLE

### Étape 1 : Régénérer Prisma
```bash
cd backend
npx prisma generate
```

### Étape 2 : Appliquer les migrations
```bash
npx prisma migrate deploy
```

### Étape 3 : Si nécessaire, créer une nouvelle migration
```bash
npx prisma migrate dev --name fix-union-child
```

### Étape 4 : Redémarrer le serveur
```bash
npm run dev
```

## 🔍 VÉRIFICATION RAPIDE

Si le problème persiste, vérifiez que le schéma contient bien :

```prisma
model FamilyTree {
  // ... autres champs ...
  UnionChild   UnionChild[]
}

model UnionChild {
  // ... champs ...
  FamilyTree    FamilyTree @relation(fields: [treeId], references: [id], onDelete: Cascade)
}
```

## 🚀 ALTERNATIVE RAPIDE

Si Prisma pose encore problème, modifiez temporairement le contrôleur :

**Fichier :** `backend/src/controllers/familyTree.controller.js`

**Ligne 33, remplacer :**
```javascript
include: {
  Person: true,
  NodePosition: true,
  Edge: true,
  UnionChild: {
    include: {
      Child: true
    }
  }
}
```

**Par :**
```javascript
include: {
  Person: true,
  NodePosition: true,
  Edge: true
}
```

**Puis ajouter après la requête :**
```javascript
// Récupérer les UnionChild séparément
const unionChildren = await prisma.unionChild.findMany({
  where: { treeId: id },
  include: { Child: true }
});

tree.UnionChild = unionChildren;
```

## ✅ RÉSULTAT ATTENDU

Après correction, le serveur backend devrait démarrer sans erreur et l'API `/family-trees/:id` devrait retourner les données avec UnionChild inclus.
