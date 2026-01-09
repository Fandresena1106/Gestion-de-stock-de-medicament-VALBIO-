// 🟦 Importation du fichier CSS global de ton application
import '../css/app.css';

// 🟦 Importation des outils Inertia pour créer l'application React + Laravel
import { createInertiaApp } from '@inertiajs/react';

// 🟦 Permet à Vite de charger automatiquement les composants/pages
//    selon leur chemin (ex: pages/Dashboard.tsx)
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

// 🟦 React 18 root renderer
import { createRoot } from 'react-dom/client';

// 🟦 Fonction qui applique automatiquement le thème (clair/sombre)
import { initializeTheme } from './hooks/use-appearance';

// 🟦 Récupération du nom de l'application depuis .env
const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// 🟩 Création de l'application Inertia + React
createInertiaApp({
    
    // 🟡 Définit comment afficher le titre des pages
    // Exemple : "Dashboard - CVB_Health"
    title: (title) => (title ? `${title} - ${appName}` : appName),

    // 🟡 Permet de charger dynamiquement chaque page React
    // Quand Laravel envoie "Dashboard", il charge "./pages/Dashboard.tsx"
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),

    // 🟡 Fonction d'initialisation de l'application React
    setup({ el, App, props }) {

        // ⚛️ Création du "root" React (React 18)
        const root = createRoot(el);

        // ⚛️ Rendu de l’application React + Inertia
        root.render(<App {...props} />);
    },

    // 🟡 Configuration de la barre de progression Inertia (chargement)
    progress: {
        color: '#4B5563', // Gris
    },
});

// 🟩 Applique automatiquement le thème clair/sombre
// sur la base des paramètres utilisateurs ou système
initializeTheme();
