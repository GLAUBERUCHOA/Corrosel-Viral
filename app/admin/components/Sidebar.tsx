'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import LogoutButton from './LogoutButton';

export default function Sidebar() {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const links = [
        { href: '/admin', icon: 'dashboard', label: 'Painel Geral' },
        { href: '/admin/users', icon: 'people', label: 'Usuários' },
        { href: '/admin/configuracoes', icon: 'psychology', label: 'Configurar Agentes' },
    ];

    return (
        <>
            {/* Mobile Sidebar overlay */}
            {isMobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Main Sidebar (Desktop & Mobile Drawer) */}
            <aside
                className={`fixed inset-y-0 left-0 bg-slate-900 text-slate-300 w-64 flex flex-col z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shrink-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <Link href="/admin" className="text-white font-bold text-xl flex items-center gap-2" onClick={() => setIsMobileOpen(false)}>
                        <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                        Lab Admin
                    </Link>
                    <button onClick={() => setIsMobileOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMobileOpen(false)}
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

            {/* Mobile Floating Menu Button */}
            {!isMobileOpen && (
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="md:hidden fixed bottom-6 right-6 h-14 w-14 bg-primary text-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.3)] flex items-center justify-center z-30 hover:bg-primary/90 transition-transform active:scale-95"
                    aria-label="Abrir menu"
                >
                    <span className="material-symbols-outlined text-2xl">menu</span>
                </button>
            )}
        </>
    );
}
