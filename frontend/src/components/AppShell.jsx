import { useState } from "react";
import Sidebar from "./Sidebar";

export default function AppShell({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="app-shell">
            {/* Mobile Header */}
            <header className="mobile-header">
                <button
                    className="mobile-menu-btn"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open navigation"
                    aria-expanded={sidebarOpen}
                >
                    ☰
                </button>

                <div className="mobile-brand">
                    <div className="sidebar-brand-mark">L</div>
                    <span>Ledger</span>
                </div>
            </header>

            <Sidebar
                isOpen={sidebarOpen}
                onClose={closeSidebar}
            />

            {/* Mobile overlay */}
            {sidebarOpen && (
                <button
                    className="sidebar-overlay"
                    onClick={closeSidebar}
                    aria-label="Close navigation"
                />
            )}

            <main className="main-content">
                <div className="container">{children}</div>
            </main>
        </div>
    );
}