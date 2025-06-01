# 🎯 Test du Menu Contextuel sur les Liens de Conjoints

## Fonctionnalités Ajoutées

### ✅ **Menu Contextuel sur les Traits Rouges**
- **Clic droit** sur un trait rouge → Menu contextuel apparaît
- **Clic simple** sur un trait rouge sans enfants → Ajouter enfant directement

### ✅ **Actions Disponibles dans le Menu**
1. **👶 Ajouter un enfant** 
   - Trait bleu part du **centre du trait rouge**
   - Mène vers la carte de l'enfant

2. **🗑️ Supprimer l'union**
   - Supprime la relation de conjoint
   - Confirmation avant suppression
   - Recharge automatique de l'arbre

### ✅ **Interface Améliorée**
- **Survol** des traits rouges → Indicateur visuel
- **Tooltips** informatifs sur les traits
- **Animation** fluide du menu contextuel
- **Points décoratifs** aux extrémités des traits

## Test Manuel

### 1. Créer un Couple
1. Ajouter une personne
2. Lui ajouter un conjoint
3. Observer le **trait rouge horizontal**

### 2. Tester le Menu Contextuel
1. **Clic droit** sur le trait rouge
2. Menu contextuel apparaît avec :
   - Nom des conjoints en en-tête
   - Option "Ajouter un enfant" 👶
   - Option "Supprimer l'union" 🗑️

### 3. Ajouter un Enfant via le Menu
1. Cliquer **"Ajouter un enfant"**
2. Remplir le formulaire
3. Observer :
   - **Trait bleu vertical** part du centre du trait rouge
   - **Enfant apparaît** sous le couple
   - **Recharge automatique** des données

### 4. Supprimer une Union
1. **Clic droit** sur un trait rouge
2. Cliquer **"Supprimer l'union"**
3. Confirmer la suppression
4. Observer :
   - Le **trait rouge disparaît**
   - Les personnes **restent séparées**
   - **Enfants restent** mais avec un seul parent

## Structure Visuelle Attendue

```
    Papa ——————————— Maman
         |           |
         └———————————┘
              |  ← Trait bleu part du centre du trait rouge
         ┌————┼————┐
         |    |    |
      Enfant1 Enfant2 Enfant3
```

## Debug

Si le menu ne s'affiche pas :
1. Vérifier la console pour les erreurs
2. S'assurer que `onDeleteRelationship` est bien passé au composant
3. Vérifier que les relations sont bien chargées dans `relationships`

## Fonctionnalités Techniques

### Composants Créés
- **`UnionLineWithMenu.jsx`** : Trait rouge avec menu contextuel
- **`handleDeleteRelationship`** : Fonction de suppression des relations

### Props Ajoutées
- `onDeleteRelationship` : Callback de suppression de relation
- `spouse1Name` / `spouse2Name` : Noms pour l'affichage
- `unionId` : ID de l'union pour la suppression

### Améliorations Visuelles
- **Survol** : Effet visuel sur les traits
- **Points décoratifs** : Cercles aux extrémités
- **Animations** : Menu fluide avec Framer Motion
- **Tooltips** : Info au survol des traits

Le menu contextuel est maintenant **fonctionnel et intuitif** ! 🎉
