'use client';

export default function LogoutButton() {
    const handleLogout = async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        window.location.href = '/admin/login';
    };

    return (
        <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
        >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Sair
        </button>
    );
}
