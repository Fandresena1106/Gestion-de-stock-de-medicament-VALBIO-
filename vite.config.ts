import os from 'os';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import laravel from 'laravel-vite-plugin';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';

/*
|--------------------------------------------------------------------------
| 🔍 Détection automatique de l’adresse IP locale
|--------------------------------------------------------------------------
| Permet d’accéder au Vite server depuis d’autres appareils du réseau :
| téléphone, tablette, autre PC… utile pour tester en mode mobile.
*/
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const localIp = getLocalIp();
const backendPort = 8000;   // Port Laravel
const frontendPort = 5173;  // Port React/Vite

/*
|--------------------------------------------------------------------------
| ⚙️ Configuration principale Vite
|--------------------------------------------------------------------------
*/
export default defineConfig({
    server: {
        /*
        |--------------------------------------------------------------------------
        | 1️⃣ Écoute sur toutes les interfaces
        | Permet l'accès depuis un autre appareil : 192.168.x.x:5173
        |--------------------------------------------------------------------------
        */
        host: '0.0.0.0',
        port: frontendPort,

        /*
        |--------------------------------------------------------------------------
        | 2️⃣ HMR (Hot Module Reloading)
        | Recharge automatique React depuis la bonne IP du réseau local.
        |--------------------------------------------------------------------------
        */
        hmr: {
            host: localIp,
        },

        /*
        |--------------------------------------------------------------------------
        | 3️⃣ CORS pour communication entre Laravel (8000) et Vite (5173)
        |--------------------------------------------------------------------------
        */
        headers: {
            'Access-Control-Allow-Origin': `http://${localIp}:${backendPort}`,
        },
    },

    /*
    |--------------------------------------------------------------------------
    | 🔌 Plugins utilisés par le projet
    |--------------------------------------------------------------------------
    | - laravel : intégration Vite + Laravel + Inertia
    | - react : support JSX/TSX
    | - tailwindcss : build Tailwind natif via Vite
    | - wayfinder : générateur de formulaires Laravel/Inertia
    */
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
        wayfinder({
            formVariants: true,
            autoGenerate: false,
        }),
    ],

    /*
    |--------------------------------------------------------------------------
    | 🧱 Options ESBuild (JSX automatique)
    |--------------------------------------------------------------------------
    */
    esbuild: {
        jsx: 'automatic',
    },
});
