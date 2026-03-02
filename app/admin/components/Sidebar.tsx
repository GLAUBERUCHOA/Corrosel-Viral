'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';

export default function Sidebar() {
    const pathname = usePathname();

    const links = [
        { href: '/admin', icon: 'dashboard', label: 'Painel Geral' },
        { href: '/admin/users', icon: 'people', label: 'UsuÃ¡rios' },
        { href: '/admin/settings', icon: 'tune', label: 'Textos (Modos Iury)' },
        { href: '/admin/image-settings', icon: 'imagesmode', label: 'Imagens (Nichos)' },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex">
            <div className="p-6 border-b border-slate-800">
                <Link href="/admin" className="text-white font-bold text-xl flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                    Lab Admin
                </Link>
            </div>
            <nav className="flex-1 p-4 flex flex-col gap-2">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${isActive
                                ? 'bg-primary/20 text-white'
                                : 'hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                            {link.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-slate-800">
                <LogoutButton />
            </div>
        </aside>
    );
}
