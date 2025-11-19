// resources/js/components/app-sidebar.tsx
import React, { useEffect, useState } from 'react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid } from 'lucide-react';
import AppLogo from './app-logo';
import { Box, Archive, Truck } from 'lucide-react';

/**
 * Safe helper — récupère l'URL d'une route générée si disponible,
 * sinon retourne une chaîne de secours.
 */
function getRouteUrl(mod: any | null, name: string, fallback: string) {
    if (!mod) return fallback;
    // Wayfinder exporte parfois un objet par défaut ou des exports nommés.
    const candidate = mod[name] ?? (mod.default && mod.default[name]);
    if (!candidate) return fallback;
    try {
        const out = typeof candidate === 'function' ? candidate() : candidate;
        // candidate() peut renvoyer soit { url: "/..." } soit un string
        if (out && typeof out === 'object' && 'url' in out) return out.url;
        if (typeof out === 'string') return out;
        return fallback;
    } catch {
        return fallback;
    }
}

export function AppSidebar() {
    const [routesModule, setRoutesModule] = useState<any | null>(null);

    useEffect(() => {
        let mounted = true;
        // import dynamique — ne bloque pas le rendu initial et évite erreur si module absent
        import('@/routes')
            .then((m) => {
                if (!mounted) return;
                // garde la valeur exportée (soit exports nommés, soit default)
                setRoutesModule(m);
            })
            .catch(() => {
                // silence l'erreur — on utilisera les fallback
                if (mounted) setRoutesModule(null);
            });

        return () => {
            mounted = false;
        };
    }, []);

    // compute hrefs avec fallback
    const dashboardHref = getRouteUrl(routesModule, 'dashboard', '/dashboard');
    const medicamentsHref = getRouteUrl(routesModule, 'medicaments', '/medicaments');
    const entreesHref = getRouteUrl(routesModule, 'entrees', '/entrees');
    const expeditionsHref = getRouteUrl(routesModule, 'expeditions', '/expeditions');

    const mainNavItems: NavItem[] = [
        { title: 'Dashboard', href: dashboardHref, icon: LayoutGrid },
        { title: 'Médicaments', href: medicamentsHref, icon: Box },
        { title: 'Entrées', href: entreesHref, icon: Archive },
        { title: 'Expéditions', href: expeditionsHref, icon: Truck },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
