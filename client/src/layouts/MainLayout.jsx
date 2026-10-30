import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Cloud,
  FileText,
  Bot,
  Settings,
  LogOut,
  HardDrive
} from "lucide-react";

export default function MainLayout({ children }) {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-[#0b0f1a] text-white">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white/5 border-r border-white/10 flex flex-col">

        {/* LOGO */}
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold text-blue-400">SmartSphere</h1>
          <p className="text-xs text-gray-400">AI Workspace</p>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">

          {/* DASHBOARD */}
          <NavItem
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            onClick={() => navigate('/dashboard')}
          />

          {/* CLOUD HUB */}
          <NavItem
            icon={<Cloud size={18} />}
            label="CloudHub"
            onClick={() => navigate('/cloudhub')}
          />

          {/* MY STORAGE */}
          <NavItem
            icon={<HardDrive size={18} />}
            label="MyStorage"
            onClick={() => navigate('/mystorage')}
          />

          {/* DOCHUB */}
          <NavItem
            icon={<FileText size={18} />}
            label="DocHub"
            onClick={() => navigate('/dochub')}
          />

          {/* BUDDYBOT */}
          <NavItem
            icon={<Bot size={18} />}
            label="BuddyBot"
            onClick={() => navigate('/buddybot')}
          />

        </nav>

        {/* BOTTOM SECTION */}
        <div className="p-4 border-t border-white/10 space-y-2">

          <NavItem
            icon={<Settings size={18} />}
            label="Settings"
          />

          <NavItem
            icon={<LogOut size={18} />}
            label="Logout"
            className="text-red-400 hover:text-red-300"
            onClick={() => {
              localStorage.removeItem('sphere_token');
              navigate('/auth');
            }}
          />

        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}

// COMPONENT
function NavItem({ icon, label, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition ${className}`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}