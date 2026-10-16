import React from 'react';
import { 
  Home, 
  BarChart2, 
  Ship, 
  Anchor, 
  ClipboardList, 
  Compass, 
  Sliders, 
  FileText, 
  Database, 
  Settings, 
  User, 
  Waves
} from 'lucide-react';

export type NavTab = 
  | 'overview' 
  | 'forecast' 
  | 'chartering' 
  | 'ports' 
  | 'procurement' 
  | 'routes' 
  | 'reports' 
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  mobileOpen,
  onCloseMobile,
}) => {
  const menuItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Home className="w-4 h-4" /> },
    { id: 'forecast', label: 'Freight Forecast', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'chartering', label: 'Vessel Chartering', icon: <Ship className="w-4 h-4" /> },
    { id: 'ports', label: 'Port Intelligence', icon: <Anchor className="w-4 h-4" /> },
    { id: 'procurement', label: 'Procurement Plan', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'routes', label: 'Route & Analysis', icon: <Compass className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleItemClick = (id: NavTab) => {
    onTabChange(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#081528] text-slate-300 flex flex-col justify-between border-r border-[#152744] transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Logo & Brand Header */}
          <div className="p-5 flex items-center gap-3 border-b border-[#152744]/70">
            <div className="w-9 h-9 rounded-lg bg-cyan-600 flex items-center justify-center text-white shadow-md shadow-cyan-900/40">
              <Ship className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-white text-lg tracking-tight flex items-center gap-1.5">
                NaviFreight
              </div>
              <p className="text-[10px] text-cyan-300/80 font-medium tracking-wide uppercase">
                Maritime Decision Support
              </p>
            </div>
          </div>

          {/* Navigation Menu Links */}
          <nav className="p-3 space-y-1">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Graphic & User Profile (Matches all prototype screenshots) */}
        <div className="p-3 space-y-3">
          {/* Maritime Cargo Ship Card at Bottom */}
          <div className="relative rounded-xl overflow-hidden bg-gradient-to-t from-slate-950 via-slate-900/90 to-blue-950/80 border border-slate-700/60 p-3.5 shadow-lg">
            {/* Background Ship Art Graphic */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]"></div>
            <div className="relative z-10">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2 border border-cyan-500/30">
                <Waves className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-white leading-snug">
                Smarter Freight Decisions for a Stronger Steel Supply Chain
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">
                Optimized for India's East Coast Ports
              </p>
            </div>
          </div>

          {/* User Profile Bar */}
          <div className="p-2.5 rounded-lg bg-[#0d1d36] border border-[#1b3155] flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">User</div>
              <div className="text-[10px] text-slate-400 truncate">Logistics Planner</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
