// resources/js/utils/routeHelpers.ts

/**
 * Récupère l'URL d'une route index (par exemple medicaments.index ou expeditions.index)
 * de manière sécurisée. Évite les erreurs "undefined" ou "is not a function".
 */
export function extractIndexHref(mod: any | null, fallback: string): string {
    if (!mod) return fallback;

    const candidate = mod.default ?? mod;

    const tryCall = (fn: any) => {
        if (typeof fn === 'function') {
            try {
                const out = fn();
                if (out && typeof out === 'object' && 'url' in out) return out.url;
                if (typeof out === 'string') return out;
            } catch {
                // Ignorer les erreurs de fonction
            }
        }
        return null;
    };

    // On tente plusieurs chemins possibles selon la structure du module
    return (
        tryCall(candidate?.index) ??
        tryCall(mod.index) ??
        fallback
    );
}
