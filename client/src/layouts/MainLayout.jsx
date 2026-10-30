import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Cloud,
  FileText,
  Bot,
  Settings,
  LogOut,
  HardDrive,
  ExternalLink,
  Globe
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

          {/* AI ASSISTANT */}
          <NavItem
            icon={<Bot size={18} />}
            label="AI Assistant"
            onClick={() => navigate('/buddybot')}
          />

        </nav>

        {/* BOTTOM SECTION */}
        <div className="p-4 border-t border-white/10 space-y-2">

          {/* DEVELOPER PORTFOLIO LINK */}
          <a
            href="https://ialksng.me"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 text-blue-300 hover:text-white border border-blue-500/30 transition text-sm font-medium group"
          >
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-blue-400 group-hover:rotate-12 transition-transform" />
              <span>ialksng</span>
            </div>
            <ExternalLink size={13} className="text-gray-400 group-hover:text-white transition-colors" />
          </a>

          <NavItem
            icon={<Settings size={18} />}
            label="Settings"
            onClick={() => navigate('/settings')}
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