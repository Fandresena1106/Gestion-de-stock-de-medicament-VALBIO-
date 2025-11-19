import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    const { name, quote } = usePage<SharedData>().props;
    const bgImage = "/image/bg9.jpeg";

     return (
        <div
            className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${bgImage}')` }}
        >
            {/* Overlay sombre section droite : toujours présent */}
            <div className="pointer-events-none absolute right-0 top-0 h-full w-full lg:w-1/2"
                style={{background: "rgba(0,0,0,0.60)", zIndex: 10}} />

            {/* Section gauche */}
            <div className="relative hidden h-full flex-col p-10 text-white lg:flex">
                <div className="absolute inset-0 bg-black/60" />
                <Link
                    href={home()}
                    className="relative z-20 flex items-center text-lg font-medium gap-3"
                >
                    <img
                        src="/image/CVBLogo.png"
                        alt="HealthStock"
                        className="h-10 sm:h-12"
                    />
                    {name}
                </Link>
                {quote && (
                    <div className="relative z-20 mt-auto">
                        <blockquote className="space-y-2">
                            <p className="text-lg">
                                &ldquo;{quote.message}&rdquo;
                            </p>
                            <footer className="text-sm text-neutral-300">
                                {quote.author}
                            </footer>
                        </blockquote>
                    </div>
                )}
            </div>

            {/* Section droite */}
            <div className="relative w-full lg:p-8 flex items-center justify-center">
                {/* Le formulaire est toujours au-dessus de l'overlay */}
                <div className="relative z-20 mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center lg:hidden"
                    >
                        <img
                        src="/image/CVBLogo.png"
                        alt="HealthStock"
                        className="h-10 sm:h-12"
                    />
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-xl font-medium text-white">{title}</h1>
                        <p className="text-sm text-balance text-neutral-300">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}