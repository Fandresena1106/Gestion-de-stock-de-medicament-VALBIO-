# CVB_Health APP

**Généré automatiquement** le 2025-11-19 06:37:21.

## Description
Application web pour la gestion de medicament du departement sante(Health Team) du centre VALBIO Ranomafana
Effectuer durant le Stage du 05 Octobre au 28 novembre 2025.
Moyens utiliser:Ordinateur Portable ASUS avec une Systeme d'exploittation Manjaro Linux
Moyens Logiciels: VS code,XAMPP sous Linux
Technologie: 
 -Frontend:React.js(Typescript".tsx")  et Taulwind CSS pour les style.
 -Backend: PHP Laravel
 -Pont:Inertia.js permet de connecter PHP avec le front React
 -SGBD:Mysql


## Statistiques du projet
- 5 modèles de données (User, Medicament, Entree, Expedition, DetailExpedition)
- 6 contrôleurs principaux
- 48 composants React/TypeScript
- 25 composants UI (shadcn/ui)
- 23 composants personnalisés
- Base de données relationnelle complète

##  Fonctionnalités

 # Gestion des Médicaments

   - Catalogue complet des médicaments
   - Informations détaillées (nom, dosage, forme pharmaceutique, catégorie)
   - Recherche et filtrage avancés

 # Gestion des Entrées de Stock

   - Enregistrement des réceptions de médicaments
   - Validation des quantités
   - Historique complet des entrées
   - Mise à jour automatique des stocks


 # Gestion des Expéditions

   - Gestion des détails par ligne d'expédition
   - Gestion des destinations
   - Notes et observations
   - Déduction automatique des stocks
   - Recherche et filtrage par village

 # Dashboard et Rapports

   - Vue d'ensemble en temps réel du stock
   - Graphiques de mouvements
   - Alertes de rupture de stock
   - Médicaments proches de l'expiration


##  Technologies utilisées
 # Backend

   - Laravel 12.34.0 - Framework PHP moderne et élégant
   - PHP 8.1+ - Langage de programmation
   - MySQL - Base de données relationnelle
   - Eloquent ORM - Mapping objet-relationnel
   - Inertia.js - Liaison seamless Laravel-React

 # Frontend

   - React 18.x - Bibliothèque JavaScript pour l'UI
   - TypeScript 5.x - Typage statique pour JavaScript
   - Vite - Build tool ultra-rapide
   - Inertia.js - SPA sans API
   - shadcn/ui - Collection de composants UI modernes
   - Radix UI - Composants accessibles et headless
   - Tailwind CSS - Framework CSS utility-first
   - Lucide React - Bibliothèque d'icônes


## Outils de développement

 - Composer - Gestionnaire de dépendances PHP
  - NPM - Gestionnaire de dépendances Node.js
 - TypeScript Compiler - Compilation TypeScript
 - ESLint - Linter JavaScript/TypeScript
 - Prettier - Formateur de code

## Architecture Générale
┌─────────────────────┐
│   React (TypeScript)│  Interface utilisateur
│   + shadcn/ui       │  Composants réutilisables
│   + Radix UI        │  Accessibilité
└──────────┬──────────┘
           │ Inertia.js (pas de REST API)
           ▼
┌─────────────────────┐
│  Laravel 12.34      │  Logique métier
│  + Eloquent ORM     │  Gestion des données
│  + Controllers      │  Traitement des requêtes
└──────────┬──────────┘
           │ Eloquent ORM
           ▼
┌─────────────────────┐
│      MySQL          │  Stockage persistant
│  (Base de données)  │
└─────────────────────┘


## Prérequis
 # Logiciels requis
   - PHP >= 8.4.1
   - Composer >= 2.8.12
   - Node.js >= 18.x
   - NPM >= 9.x 
   - MySQL >= 12.0.2

## Extensions nécessaires :
   - PDO
   - pdo_mysql
   - mbstring
   - openssl
   - tokenizer
   - xml
   - ctype
   - json
   - bcmath
   - fileinfo
   - bcmath
   - ctype
   - libxml
## Installation

   - `composer install` # Installer les dépendances PHP
   - `cp .env.example .env` # Copier le fichier d'environnement
   - `php artisan key:generate` # Générer la clé d'application
   - `npm install` # Installer les dépendances Node.js

## Démarrage
  
   - `php artisan serve` # Le backend sera accessible sur http://localhost:8000
   - `npm run dev` # Le dev server Vite démarre

## Authentification 
 Email: admin@health.com
 Password: password  