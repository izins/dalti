# Guide d'Installation - Projet Dalty



## 📌 Prérequis

Avant de commencer, assure-toi d'avoir installé :
- **[Node.js](https://nodejs.org/fr/)** (idéalement la dernière version LTS)

Tu peux vérifier si c'est bien installé en ouvrant ton terminal et en tapant :
```bash
node -v
npm -v
```

---

## 🚀 1. Installer les dépendances

Ce projet utilise **Vite**, **React** et **TailwindCSS**. Pour télécharger toutes les bibliothèques nécessaires (elles se mettront dans un dossier `node_modules`), ouvre ton terminal dans le dossier du projet et lance la commande suivante :

```bash
npm install
```

*(Cela va installer React, React-DOM, TailwindCSS, Lucide-React pour les icônes, et Leaflet pour la carte géographique)*

---

## 💻 2. Lancer le site (Mode Développement)

Une fois l'installation terminée, tu peux lancer le serveur pour voir le site en direct :

```bash
npm run dev
```

Ton terminal va afficher un lien local (généralement `http://localhost:5173/`).
- Fais un **`Ctrl + Clic`** sur ce lien (ou copie-colle le dans ton navigateur web) pour le voir.
- Dès que tu modifies le code, la page web se mettra à jour automatiquement.

---

## 🛠️ Résumé des commandes

- `npm install` : À exécuter **une seule fois** à la réception du projet pour tout installer.
- `npm run dev` : À exécuter **à chaque fois** que tu veux travailler sur le site pour le démarrer.
- `npm run build` : À utiliser uniquement si tu veux générer le dossier de production pour déployer le site en ligne.

Bon dev ! 🚀
