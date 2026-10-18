import React, { useState } from 'react';
import { 
  MapPin, 
  Anchor, 
  Clock, 
  TrendingUp, 
  Ship, 
  ShieldCheck, 
  CheckCircle2, 
  BarChart3, 
  PieChart as PieIcon, 
  AlertTriangle,
  Info,
  ShieldAlert
} from 'lucide-react';
import { Port } from '../types';
import { PORTS_DATABASE, NATIONAL_PORT_STATS } from '../data/maritimeData';

export interface PortIntelligenceProps {
  onNavigateTab?: (tab: string) => void;
}

export const PortIntelligence: React.FC<PortIntelligenceProps> = ({ onNavigateTab }) => {
  const [selectedPortId, setSelectedPortId] = useState<string>('paradip');
  const [regionFilter, setRegionFilter] = useState<'east' | 'west' | 'australia' | 'us_ukraine' | 'global'>('east');

  const filteredPorts = PORTS_DATABASE.filter(p => {
    if (regionFilter === 'east') return p.country === 'India' && p.isIndianEastCoast;
    if (regionFilter === 'west') return p.country === 'India' && !p.isIndianEastCoast;
    if (regionFilter === 'australia') return p.country === 'Australia';
    if (regionFilter === 'us_ukraine') return p.country === 'United States' || p.country === 'Ukraine';
    return p.country !== 'India' && p.country !== 'Australia' && p.country !== 'United States' && p.country !== 'Ukraine';
  });

  const activePort = PORTS_DATABASE.find(p => p.id === selectedPortId) || filteredPorts[0] || PORTS_DATABASE[0];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
          <MapPin className="w-4 h-4" />
          INDIAN & GLOBAL MARITIME GATEWAYS
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Port Intelligence & Authoritative Benchmarks</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Navigational constraints, draft limits, handling throughput, berth capacity, and MoPSW national port statistics.
        </p>
      </div>

      {/* Contextual Maritime Safety & Disruption Advisory Banner */}
      {onNavigateTab && (
        <div className="bg-gradient-to-r from-slate-900 to-[#0e2238] rounded-xl border border-slate-700/70 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <strong className="text-slate-100 font-bold block">Facing Port Closure, Waiting Demurrage, or Weather Restrictions?</strong>
              <span className="text-slate-300">Evaluate alternative port diversions, draft clearances, and STS lighterage in Safety & Recovery.</span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('safety')}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>Open Safety & Recovery</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Official MoPSW National Context Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: National Cargo Growth */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Indian Port Cargo Handled</span>
            <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold">
              2020–25
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">1,594</span>
            <span className="text-xs text-slate-500">Million Tonnes (FY25)</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-medium">
            ▲ +27.5% volume expansion from 1,250 Mt in 2020-21
          </div>

          {/* Mini Bar Chart */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between gap-1.5 h-16">
            {NATIONAL_PORT_STATS.handledYears.map((item) => (
              <div key={item.year} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-blue-600 hover:bg-blue-700 transition-colors"
                  style={{ height: `${(item.mt / 1600) * 44}px` }}
                  title={`${item.year}: ${item.mt} MT`}
                ></div>
                <span className="text-[9px] font-mono text-slate-400">{item.year.split('-')[0].slice(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Metric 2: Major Port Cargo Mix */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Major-Port Cargo Mix</span>
              <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold">
                FY2024–25
              </span>
            </div>

            <div className="space-y-2 mt-2">
              {NATIONAL_PORT_STATS.cargoMixMajorPorts.map((mix) => (
                <div key={mix.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 text-[11px] truncate max-w-[170px]">{mix.name}</span>
                    <span className="font-mono font-bold text-slate-800">{mix.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${mix.percentage}%`, backgroundColor: mix.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 mt-2">
            Official major-port data: POL 29.8%, containers 22.6%, coal 21.8%, other ≈25.8%.
          </div>
        </div>

        {/* Metric 3: Vessel Turnaround Efficiency */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Average Vessel Turnaround</span>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                MoPSW Official
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600 font-mono">49.5</span>
              <span className="text-xs text-slate-500">hours (FY2024–25)</span>
            </div>

            <div className="mt-2 text-[11px] text-blue-700 font-medium">
              Turnaround reduced from <strong>96.0 hrs</strong> in FY2014-15!
            </div>

            {/* Visual comparison bars */}
            <div className="mt-4 space-y-2">
              <div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                  <span>FY 2014–15</span>
                  <span className="font-mono">96.0 h</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-slate-400 h-full rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-emerald-600 mb-0.5 font-semibold">
                  <span>FY 2024–25 (Record Efficiency)</span>
                  <span className="font-mono font-bold">49.5 h (-48.4%)</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '51.5%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 mt-2">
            Source: Ministry of Ports, Shipping and Waterways (MoPSW) / PIB.
          </div>
        </div>
      </div>

      {/* Port Region Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setRegionFilter('east'); setSelectedPortId('paradip'); }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            regionFilter === 'east'
              ? 'bg-[#0d2a4a] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          🇮🇳 India East Coast ({PORTS_DATABASE.filter(p => p.country === 'India' && p.isIndianEastCoast).length})
        </button>
        <button
          onClick={() => { setRegionFilter('west'); setSelectedPortId('kandla'); }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            regionFilter === 'west'
              ? 'bg-[#0d2a4a] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          🇮🇳 India West Coast ({PORTS_DATABASE.filter(p => p.country === 'India' && !p.isIndianEastCoast).length})
        </button>
        <button
          onClick={() => { setRegionFilter('australia'); setSelectedPortId('port_hedland'); }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            regionFilter === 'australia'
              ? 'bg-[#0d2a4a] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          🇦🇺 Australia & Oceania ({PORTS_DATABASE.filter(p => p.country === 'Australia').length})
        </button>
        <button
          onClick={() => { setRegionFilter('us_ukraine'); setSelectedPortId('norfolk'); }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            regionFilter === 'us_ukraine'
              ? 'bg-[#0d2a4a] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          🇺🇸 🇺🇦 US & Ukraine ({PORTS_DATABASE.filter(p => p.country === 'United States' || p.country === 'Ukraine').length})
        </button>
        <button
          onClick={() => { setRegionFilter('global'); setSelectedPortId('singapore'); }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            regionFilter === 'global'
              ? 'bg-[#0d2a4a] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          🌏 Global Bulks & Hubs ({PORTS_DATABASE.filter(p => p.country !== 'India' && p.country !== 'Australia' && p.country !== 'United States' && p.country !== 'Ukraine').length})
        </button>
      </div>

      {/* Port Selector & Deep Dive Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Port List (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <Anchor className="w-4 h-4 text-blue-600" />
            Select Port ({filteredPorts.length} Gateways)
          </h3>

          <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
            {filteredPorts.map((p) => {
              const isSelected = p.id === activePort.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPortId(p.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-blue-500 shadow-xs text-blue-900'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.maxDraftMeters >= 18 && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">
                            Cape
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{p.region}</div>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-blue-700">
                      {p.maxDraftMeters}m draft
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                    <span>Turnaround: {p.averageTurnaroundHours}h</span>
                    <span>•</span>
                    <span>Discharge: {(p.handlingRateTPD / 1000).toFixed(0)}k T/d</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Port Detail Card (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
                <span>{activePort.region}</span>
                <span>•</span>
                <span>{activePort.berthCount} Mechanized Berths</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                {activePort.name}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Anchorage Status: {activePort.congestionStatus}
              </span>
            </div>
          </div>

          {/* Port Engineering Constraints Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Max Permissible Draft:</span>
              <span className="text-xl font-mono font-extrabold text-blue-700 mt-0.5 block">
                {activePort.maxDraftMeters} m
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {activePort.maxDraftMeters >= 18 ? 'Capesize Friendly' : activePort.maxDraftMeters >= 14 ? 'Panamax Max' : 'Handy/Shallow'}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Max Length Overall (LOA):</span>
              <span className="text-xl font-mono font-extrabold text-slate-900 mt-0.5 block">
                {activePort.maxLOAMeters} m
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">Berth face envelope</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Discharge Handling Rate:</span>
              <span className="text-xl font-mono font-extrabold text-emerald-700 mt-0.5 block">
                {activePort.handlingRateTPD.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">Tonnes per day (TPD)</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Avg Turnaround Time:</span>
              <span className="text-xl font-mono font-extrabold text-indigo-700 mt-0.5 block">
                {activePort.averageTurnaroundHours} hrs
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">Official benchmark</span>
            </div>
          </div>

          {/* Operational Notes & Recommendations */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              Navigational & Cargo Operations Intelligence
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {activePort.notes}
            </p>
          </div>

          {/* Key Commodities Handled */}
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2">Key Cargo Handled:</div>
            <div className="flex flex-wrap gap-2">
              {activePort.keyCommodities.map((cmd) => (
                <span
                  key={cmd}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                >
                  {cmd}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
