import React from 'react';
import { 
  Anchor, 
  TrendingUp, 
  Ship, 
  Sliders, 
  MapPin, 
  FileText, 
  Presentation, 
  Activity, 
  PlusCircle, 
  Fuel, 
  Clock, 
  Sparkles 
} from 'lucide-react';

export type NavTab = 
  | 'dashboard' 
  | 'forecast' 
  | 'chartering' 
  | 'scenarios' 
  | 'ports';

interface HeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenNewSimulation: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenNewSimulation,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-xl">
      {/* Top Maritime Market Intelligence Ticker */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-1.5 text-xs text-slate-300 flex items-center justify-between overflow-x-auto gap-4">
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200">LIVE MARITIME FEEDS:</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Baltic Dry Index (BDI):</span>
            <span className="font-mono font-medium text-emerald-400">1,842 (+1.4%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Fuel className="w-3.5 h-3.5 text-amber-400" />
            <span>VLSFO Singapore:</span>
            <span className="font-mono font-medium text-amber-300">$624 / MT</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>East Coast Turnaround:</span>
            <span className="font-mono font-medium text-slate-200">49.5 hrs (MoPSW FY25)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Anchor className="w-3.5 h-3.5 text-teal-400" />
            <span>Paradip Anchorage:</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
              Normal (1.4d wait)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-slate-400 text-[11px]">
          <span>Decision Support System</span>
          <span className="text-slate-600">•</span>
          <span className="text-cyan-400 font-medium">India's East Coast Bulk Focus</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-900/40 border border-cyan-400/30">
              <Ship className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                  NAVIFREIGHT
                </span>
                <span className="hidden md:inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                  MARITIME INTELLIGENCE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Intelligent Freight Forecasting & Vessel Optimization
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Dashboard Overview
            </button>

            <button
              onClick={() => onTabChange('forecast')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'forecast'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Freight Forecast
            </button>

            <button
              onClick={() => onTabChange('chartering')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'chartering'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Ship className="w-3.5 h-3.5" />
              Vessel Chartering
            </button>

            <button
              onClick={() => onTabChange('scenarios')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'scenarios'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Scenario Stress-Testing
            </button>

            <button
              onClick={() => onTabChange('ports')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'ports'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              East Coast Ports
            </button>
          </nav>

          {/* Action Area */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenNewSimulation}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-900/30 transition-all border border-cyan-400/30 active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              New Simulation
            </button>
          </div>
        </div>

        {/* Mobile Submenu Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-2 border-t border-slate-800/80 scrollbar-none">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-3 py-1.5 rounded-md text-xs whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onTabChange('forecast')}
            className={`px-3 py-1.5 rounded-md text-xs whitespace-nowrap ${
              activeTab === 'forecast' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
            }`}
          >
            Freight Forecast
          </button>
          <button
            onClick={() => onTabChange('chartering')}
            className={`px-3 py-1.5 rounded-md text-xs whitespace-nowrap ${
              activeTab === 'chartering' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
            }`}
          >
            Vessel Chartering
          </button>
          <button
            onClick={() => onTabChange('scenarios')}
            className={`px-3 py-1.5 rounded-md text-xs whitespace-nowrap ${
              activeTab === 'scenarios' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
            }`}
          >
            Scenarios & Cost
          </button>
          <button
            onClick={() => onTabChange('ports')}
            className={`px-3 py-1.5 rounded-md text-xs whitespace-nowrap ${
              activeTab === 'ports' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
            }`}
          >
            East Coast Ports
          </button>
        </div>
      </div>
    </header>
  );
};
