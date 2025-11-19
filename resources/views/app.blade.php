<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}"
      @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- 
            🌙 Script appliquant le thème sombre dès l'ouverture de la page
            - Évite que la page clignote en clair avant de devenir sombre
            - Si "appearance" = "system", on regarde le thème de l’appareil
        --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                // Utilise le thème système si défini
                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- 
            🎨 Définit manuellement la couleur de fond de <html>
            - Couleur claire par défaut
            - Couleur sombre si classe "dark" appliquée
        --}}
        <style>
            html {
                background-color: oklch(1 0 0); /* blanc */
            }

            html.dark {
                background-color: oklch(0.145 0 0); /* noir */
            }
        </style>

        {{-- 
            🏷️ Titre de la page dynamique
            - Utilise le nom de l'application 
        --}}
        <title inertia>{{ config('app.name', 'Health') }}</title>

        {{-- 
            🔵 Icônes de l'application
            - favicon pour navigateur
            - icône Apple
        --}}
        <link rel="icon" href="/CVBLogo.png" sizes="any">
        <link rel="icon" href="/CVBLogo.png" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/CVBLogo.png">

        {{-- Import optimisé des fonts --}}
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        {{-- 
            🔥 Active le rechargement instantané React (HMR) 
            - Nécessaire pour Vite en développement
        --}}
        @viteReactRefresh

        {{-- 
            📦 Charge les assets de ton frontend React + Inertia
            - app.tsx = fichier principal React
            - Page dynamique selon le composant Inertia en cours
        --}}
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])

        {{-- 
            🧠 Injecte les meta tags et SEO gérés par Inertia
        --}}
        @inertiaHead
    </head>

    <body class="font-sans antialiased">

        {{-- 
            📌 Insertion du contenu de la page Inertia
            - React se monte ici
        --}}
        @inertia
    </body>
</html>
