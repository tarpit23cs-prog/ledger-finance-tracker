import Sidebar from "./Sidebar";

export default function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="container">{children}</div>
      </main>
    </div>
  );
}
