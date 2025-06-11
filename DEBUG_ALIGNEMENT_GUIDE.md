# 🔍 DEBUG - Alignement des générations avec analyse détaillée

## 🎯 NOUVEL ALGORITHME DE DEBUG

J'ai créé un algorithme de debug ultra-détaillé qui va analyser exactement ce qui se passe avec vos relations familiales et pourquoi les enfants se retrouvent sur la même ligne que les parents.

## 🧪 COMMENT TESTER MAINTENANT

### 1. **Ouvrir la console de debug**
- Appuyez sur **F12** pour ouvrir les outils développeur
- Allez dans l'onglet **Console**

### 2. **Créer un arbre test**
- **Parent** : Ajoutez une personne (ex: "Papa")
- **Enfant** : Clic droit sur Papa → "Ajouter un enfant" → "Pierre"
- **Conjoint** : Clic droit sur Papa → "Ajouter un conjoint" → "Maman"

### 3. **Cliquer "Aligner"**
- Cliquez sur le bouton **"Aligner"** dans la barre d'outils
- **Regardez la console** - vous verrez une analyse complète !

## 📊 CE QUE VOUS VERREZ DANS LA CONSOLE

### Analyse des arêtes :
```
=== DEBUG ALIGNEMENT ===
Nœuds: [
  {id: "abc123", name: "Papa"},
  {id: "def456", name: "Pierre"}, 
  {id: "ghi789", name: "Maman"}
]

Arêtes:
  abc123 → def456 (type: parent_child_connection)
  abc123 → ghi789 (type: spouse_connection)
```

### Structure familiale détectée :
```
👨‍👩‍👧‍👦 Structure familiale détectée:
  Parents avec enfants: 1
    Papa a pour enfant(s): Pierre
  
  Couples mariés: 1
    Couple: Papa ↔ Maman
```

### Attribution des niveaux :
```
🌳 Nœuds racines (sans parents):
  Papa
  Maman

✅ Papa → niveau 0 (source: nœud racine)
💑 Conjoint Maman → même niveau 0  
✅ Pierre → niveau 1 (source: enfant de Papa)
```

### Répartition finale :
```
📊 Répartition par génération:
  Génération 0: Papa, Maman
  Génération 1: Pierre

🎯 Positionnement génération 0 à y=150
   Papa: x=300, y=150
   Maman: x=500, y=150

🎯 Positionnement génération 1 à y=550  
   Pierre: x=400, y=550
```

## 🔍 DIAGNOSTIC DU PROBLÈME

Avec cette analyse, nous pourrons voir :

### 1. **Si les arêtes sont correctes**
- Les relations parent-enfant sont-elles bien `parent_child_connection` ?
- La direction est-elle correcte (parent → enfant) ?

### 2. **Si les niveaux sont bien assignés**
- Les parents sont-ils au niveau 0 ?
- Les enfants sont-ils au niveau 1 ?
- Y a-t-il des conflits de niveau ?

### 3. **Si les positions sont correctes**
- Les Y sont-ils différents entre générations ?
- L'espacement vertical est-il de 400px ?

## 🚨 PROBLÈMES POSSIBLES À IDENTIFIER

### Problème 1 : Direction des arêtes inversée
```
❌ Mauvais: def456 → abc123 (enfant → parent)
✅ Correct: abc123 → def456 (parent → enfant)
```

### Problème 2 : Type d'arête incorrect
```
❌ Mauvais: spouse_connection au lieu de parent_child_connection
✅ Correct: parent_child_connection pour parent-enfant
```

### Problème 3 : Conflit de niveau
```
⚠️ CONFLIT: Pierre déjà niveau 0, maintenant 1
→ Résolution: Pierre = niveau 0
```

## 🎯 ACTIONS SELON LE DIAGNOSTIC

### Si tout semble correct dans la console :
→ Le problème est dans l'application des positions

### Si les arêtes sont mal orientées :
→ Le problème est dans la création des relations

### Si les niveaux sont incorrects :
→ L'algorithme a un bug de logique

## 📋 INSTRUCTIONS PRÉCISES

1. **Testez avec un arbre simple** (1 parent + 1 enfant)
2. **Copiez-collez** les messages de la console ici
3. **Décrivez** ce que vous voyez visuellement
4. Je pourrai alors **identifier précisément** le problème !

## ✅ RÉSULTAT ATTENDU

Après le clic sur "Aligner", vous devriez voir :
- **Papa et Maman** sur la ligne du haut (y=150)
- **Pierre** sur la ligne du bas (y=550) 
- **Console pleine** d'informations de debug

**Maintenant testez et envoyez-moi ce que dit la console ! 🔍**
