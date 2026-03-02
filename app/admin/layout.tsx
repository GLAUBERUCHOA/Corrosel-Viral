export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans">
            {children}
        </div>
    );
}
