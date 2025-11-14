# HACKATHON-My-Gouvernement

Projet Python, flask, html, css, javascript, json, Jinja 

# Participation

Sihame, Amna, Omema, Tran, Anaïs

# Cahier des Charges Complet – **MyGouvernement.be**  

## *Jeu interactif de gestion budgétaire belge – 159 milliards € à répartir*  

**Version : 1.0 – 14 novembre 2025**

---

## **SOMMAIRE**

1. [Informations Générales](#1-informations-générales)  
2. [Contexte & Objectifs](#2-contexte--objectifs)  
3. [Architecture Technique](#3-architecture-technique)  
4. [Fonctionnalités & Mécaniques](#4-fonctionnalités--mécaniques)  
5. [Structure JSON des API](#5-structure-json-des-api) ← **NOUVEAU**  
6. [Design & UX](#6-design--ux)  
7. [Responsive & Accessibilité](#7-responsive--accessibilité)  
8. [Améliorations Futures](#8-améliorations-futures)  
9. [Livrables & Déploiement](#9-livrables--déploiement)  
10. [Annexes](#10-annexes)

---

## **1. Informations Générales**

| Champ | Détail |
|------|--------|
| **Nom** | MyGouvernement.be |
| **Type** | Jeu web éducatif & ludique |
| **Objectif** | Sensibiliser à la gestion du budget fédéral belge |
| **Public** | Grand public, élèves, étudiants, citoyens |
| **Langue** | Français (BE) |
| **Budget fictif** | **159 000 000 000 €** |
| **Technos** | Flask, HTML5, CSS3, JS (vanilla), Jinja2 |
| **Démo locale** | `http://localhost:5000` |

---

## **2. Contexte & Objectifs**

### **2.1 Contexte**

- Budget fédéral belge 2024 ≈ **159 milliards €**
- Répartition complexe : santé, social, éducation, défense, infrastructures
- **Problème** : faible compréhension citoyenne des priorités budgétaires

### **2.2 Objectifs**

| Type | Objectif |
|------|---------|
| **Pédagogique** | Comprendre les grands postes, contraintes, impacts |
| **Ludique** | Immersion via personnage réactif, humour, surprises |
| **Social** | Favoriser le débat sur les choix politiques |

---

## **3. Architecture Technique**

/
├── app.py                  → Backend Flask
├── templates/
│   ├── accueil.html
│   ├── startbudgeting.html
│   └── index.html          → Jeu principal
├── static/
│   ├── style.css
│   ├── script.js
│   ├── fond-intro.jpg
│   └── *.png (11 GIFs statiques)
└── requirements.txt

### **3.1 Routes Flask**

| Route | Méthode | Fonction |
|-------|--------|---------|
| `/` | GET | Accueil |
| `/startbudgeting` | GET | Intro personnage |
| `/jeu` | GET | Lancer jeu + reset |
| `/api/mode` | POST | Choisir mode |
| `/api/next` | POST | Question suivante |
| `/api/options` | POST | % disponibles |
| `/api/choix` | POST | Valider choix |
| `/api/choix_reste` | POST | Reste → peuple ou ministres |

---

## **4. Fonctionnalités & Mécaniques**

### **4.1 Secteurs (5)**

| Secteur | GIF bas | GIF moyen | GIF haut |
|--------|--------|----------|---------|
| Protection sociale | `low_social.png` | `neutral.png` | `content.png` |
| Santé | `low_sante.png` | `medecin.png` | `medecin.png` |
| Éducation | `low_education.png` | `neutral.png` | `content.png` |
| Défense | `low_defense.png` | `neutral.png` | `content.png` |
| Infrastructure | `low_infra.png` | `neutral.png` | `infraHappy.png` |

### **4.2 Modes de jeu**

```python
MODES = {
    "Écolo": {"bonus": "Défense", "malus": "Infrastructure"},
    "Social": {"bonus": "Protection sociale", "malus": "Éducation"},
    "Équilibré": {}
}

4.3 Questions (20)

10 scénarios narratifs (humour, actualité belge)
10 questions directes
Toujours 2 secteurs proposés

4.4 Événements aléatoires (5)
ÉvénementImpactCrise COVID+10% 
SantéInondations+10% 
InfrastructureGrève sociale+10% 
Protection socialeRéforme 
scolaire–5% 
ÉducationAccord climat UE–5% Défense

Probabilité : 30% par tour
Un seul événement par partie

5. Structure JSON des API (DÉTAILLÉ)
Toutes les réponses API sont en JSON. Voici la structure complète :

POST /api/mode
Requête :
json{ "mode": "Écolo" }
Réponse :
json{
  "mode": "Écolo",
  "info": "La sécurité sociale représente ~30 % du budget belge."
}

POST /api/next
Requête :
json{ "repartition": { "Santé": 20, "Éducation": 15, ... } }
Réponses possibles :
1. Question suivante
json{
  "fin": false,
  "texte": "Santé ou infrastructure : priorité à quoi ?",
  "secteurs": ["Santé", "Infrastructure"],
  "info": "Les infrastructures routières belges sont parmi les plus denses d'Europe.",
  "total": 35
}
2. Événement popup
json{
  "evenement_popup": true,
  "texte": "Crise COVID ! +10 % santé obligatoire.",
  "info": "Le système de santé belge est financé à 77 % par la sécurité sociale."
}
3. Événement appliqué
json{
  "evenement_applique": true,
  "texte": "Crise COVID ! → Santé : +10%",
  "total": 45,
  "repartition": { "Santé": 30, ... },
  "info": "La Belgique dépense 6,1 % de son PIB en éducation."
}
4. Fin de partie
json{
  "fin": true,
  "total": 100,
  "reste": 5,
  "gif": "happy.png",
  "message": "Équilibre parfait. Tu es un maître du compromis !",
  "repartition": { ... },
  "info": "Le budget fédéral belge 2024 est d'environ 159 milliards €.",
  "choix_reste": true
}

POST /api/options
Requête :
json{ "secteur": "Santé" }
Réponse :
json{
  "secteur": "Santé",
  "options": [10, 15, 20],
  "reste": 65
}

POST /api/choix
Requête :
json{
  "secteur": "Santé",
  "pourcentage": 20,
  "repartition": { ... }
}
Réponse :
json{
  "total": 55,
  "gif": "neutral.png",
  "message": "Santé : +20%",
  "secteur": "Santé",
  "pourcentage": 20,
  "repartition": { "Santé": 40, ... },
  "info": "Le système de santé belge est financé à 77 % par la sécurité sociale."
}

POST /api/choix_reste
Requête :
json{ "peuple": true }
Réponse :
json{
  "total": 100,
  "gif": "happy.png",
  "message": "Les 5% ont été redistribués au peuple !",
  "repartition": { ... },
  "peuple": true
}

6. Design & UX
6.1 Personnage central (Marc Dupont)

Taille : 450px (jeu) / 700px (intro)
Réagit en temps réel aux choix
Label : bulle noire translucide

6.2 Pyramide des secteurs (intro)
text SANTÉ
   ÉDUCATION
PROTECTION SOCIALE
   DÉFENSE

INFRASTRUCTURE
6.3 Progression

Barre verte animée
% + reste affiché
Récap en € (format fr-BE)


7. Responsive & Accessibilité
RésolutionComportement>1400pxPanneaux 420px1100–1400pxPanneaux 380px<700pxStack vertical

Contraste : WCAG AA
Navigation clavier : boutons focusables
Texte lisible : font-size: 1.1em+


8. Livrables & Déploiement 
Livrable,Format
Code source,Dossier complet
Documentation,Ce MD
Démo,python app.py
Assets,11 PNG + fond

9. Annexes
Formule de conversion €
jsmontant = Math.round(pct / 100 * 159000000000)
→ montant.toLocaleString('fr-BE') + ' €'
Exemple de question
"C'est Noel ! Les fêtes le sapin ! ... Doit-on mettre plus d'argent dans l'éducation ou la santé ?"
État global (app.py)
pythonrepartition = {s: 0 for s in SECTEURS}
question_index = 0
mode_jeu = "Équilibré"
evenement_declenche = False
evenement_en_attente = None

LivrableFormatCode sourceDossier completDocumentationCe MDDémopython app.pyAssets11 PNG + fond
Déploiement recommandé :

Render, Railway, PythonAnywhere
Ou Docker :

dockerfileFROM python:3.11-slim
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
CMD ["python", "app.py"]

10. Annexes
Formule de conversion €
jsmontant = Math.round(pct / 100 * 159000000000)
→ montant.toLocaleString('fr-BE') + ' €'
Exemple de question
"C'est Noel ! Les fêtes le sapin ! ... Doit-on mettre plus d'argent dans l'éducation ou la santé ?"
État global (app.py)
pythonrepartition = {s: 0 for s in SECTEURS}
question_index = 0
mode_jeu = "Équilibré"
evenement_declenche = False
evenement_en_attente = None

MyGouvernement.be – Parce que gouverner, c’est aussi savoir rire de soi.
