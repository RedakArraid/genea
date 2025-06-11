# 🎯 DISTANCE VERTICALE DOUBLÉE - Enfants de mariage

## ✅ MODIFICATION APPLIQUÉE

La distance verticale entre les couples et leurs enfants a été **doublée** de `200px` à `400px`.

## 📏 AVANT / APRÈS

### Avant (200px) :
```
père ——————— mère
       |
       | (200px)
       |
   enfant 1    enfant 2
```

### Maintenant (400px) :
```
père ——————— mère
       |
       |
       | (400px)
       |
       |
   enfant 1    enfant 2
```

## 🔧 FICHIERS MODIFIÉS

- **Fichier** : `frontend/src/utils/marriageChildrenUtils.js`
- **Fonctions mises à jour** :
  - `calculateChildrenPositions()` : ligne 76
  - `calculateNewChildPosition()` : ligne 149

## 🚀 POUR VOIR LE CHANGEMENT

### Option 1 : Nouveaux enfants
1. Créer un nouveau couple (mariage)
2. Ajouter des enfants
3. **Résultat** : Enfants placés plus bas automatiquement ✨

### Option 2 : Repositionner les enfants existants
1. Ouvrir un arbre avec des couples et enfants
2. Cliquer sur le bouton **"Enfants"** (repositionnement automatique)
3. **Résultat** : Tous les enfants repositionnés avec la nouvelle distance ✨

### Option 3 : Repositionnement manuel par couple
1. Clic droit sur un lien de mariage (rouge)
2. Menu contextuel → **"Repositionner les enfants"**
3. **Résultat** : Enfants de ce couple repositionnés avec plus d'espace ✨

## 🎨 RÉSULTAT VISUEL

L'arbre sera maintenant **plus aéré** avec :
- ✅ **Plus d'espace** entre générations
- ✅ **Meilleure lisibilité** des liens familiaux
- ✅ **Moins de chevauchement** entre les éléments
- ✅ **Structure plus claire** visuellement

## 📐 AJUSTEMENTS POSSIBLES

Si vous voulez modifier encore la distance, dans `marriageChildrenUtils.js` :

```javascript
// Ligne 76 et 149, changer la valeur :
const verticalOffset = 400; // Votre valeur préférée
```

**Suggestions** :
- `300px` = Distance modérée
- `400px` = Distance actuelle (doublée)  
- `500px` = Distance très importante
- `600px` = Distance maximale pour grands écrans

## ✅ CHANGEMENT ACTIF

La modification est **immédiatement active** ! 

Rechargez la page frontend et testez le repositionnement des enfants pour voir la nouvelle distance en action ! 🚀

---

**Les enfants auront maintenant beaucoup plus d'espace pour respirer ! 😌**
