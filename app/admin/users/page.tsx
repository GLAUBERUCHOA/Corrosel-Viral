'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type User = { id: string, name: string, email: string, role: string, createdAt: string };

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('ADMIN');
    const [isSaving, setIsSaving] = useState(false);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (data.success && data.users) {
                setUsers(data.users);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const openCreateModal = () => {
        setEditingUser(null);
        setName('');
        setEmail('');
        setPassword('');
        setRole('ADMIN');
        setIsModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setName(user.name);
        setEmail(user.email);
        setPassword(''); // Password reset is optional on edit
        setRole(user.role);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir permanentemente este usuÃ¡rio?')) return;
        try {
            const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== id));
            } else {
                const data = await res.json();
                alert(data.error || 'Erro ao excluir usuÃ¡rio.');
            }
        } catch (err) {
            alert('Erro de conexÃ£o.');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const endpoint = '/api/admin/users';
            const method = editingUser ? 'PUT' : 'POST';
            const payload = { id: editingUser?.id, name, email, password, role };

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setIsModalOpen(false);
                loadUsers();
            } else {
                alert(data.error || 'Erro ao salvar usuÃ¡rio.');
            }
        } catch (err) {
            alert('Erro de conexÃ£o ao salvar.');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredUsers = users.filter((u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar - Duplicada por simplicidade, ideal seria componente separado logo */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex">
                <div className="p-6 border-b border-slate-800">
                    <Link href="/admin" className="text-white font-bold text-xl flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                        Lab Admin
                    </Link>
                </div>
                <nav className="flex-1 p-4 flex flex-col gap-2">
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[20px]">dashboard</span>
                        Dashboard
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/20 text-white font-medium">
                        <span className="material-symbols-outlined text-[20px]">people</span>
                        UsuÃ¡rios
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[20px]">tune</span>
                        Modos do Iury
                    </Link>
                </nav>
            </aside>

            <main className="flex-1 overflow-auto bg-slate-50 dark:bg-background-dark p-8 relative">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">UsuÃ¡rios do Sistema</h1>
                        <p className="text-slate-500 dark:text-slate-400">Gerencie quem tem acesso Ã  plataforma.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full sm:w-64">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                            <input
                                type="text"
                                placeholder="Buscar usuÃ¡rios..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none transition-shadow text-sm text-slate-700 dark:text-slate-200"
                            />
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium shadow-md flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Novo UsuÃ¡rio
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-surface-darker text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-border-dark">
                            <tr>
                                <th className="px-6 py-4">Nome</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Acesso</th>
                                <th className="px-6 py-4 text-right">AÃ§Ãµes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                            {isLoading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Carregando usuÃ¡rios...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Nenhum usuÃ¡rio encontrado.</td></tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-surface-darker transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{u.name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{u.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                {u.role === 'ADMIN' ? 'Administrador' : 'Colaborador'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(u)}
                                                className="p-1.5 text-slate-400 hover:text-primary transition-colors hover:bg-primary/10 rounded"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(u.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors hover:bg-red-500/10 rounded"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-surface-darker rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-border-dark flex justify-between items-center">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {editingUser ? 'Editar UsuÃ¡rio' : 'Novo UsuÃ¡rio'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                                    <input
                                        type="text" required value={name} onChange={(e) => setName(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail de Acesso</label>
                                    <input
                                        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha {editingUser && <span className="text-xs text-slate-400 font-normal">(Deixe em branco para nÃ£o alterar)</span>}</label>
                                    <input
                                        type="password" required={!editingUser} value={password} onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button" onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 font-medium rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit" disabled={isSaving}
                                        className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 flex items-center gap-2"
                                    >
                                        {isSaving && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                                        {isSaving ? 'Salvando...' : 'Salvar UsuÃ¡rio'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
