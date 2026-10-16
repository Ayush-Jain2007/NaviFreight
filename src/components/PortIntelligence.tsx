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
  Info
} from 'lucide-react';
import { Port } from '../types';
import { PORTS_DATABASE, NATIONAL_PORT_STATS } from '../data/maritimeData';

export const PortIntelligence: React.FC = () => {
  const [selectedPortId, setSelectedPortId] = useState<string>('paradip');

  const eastCoastPorts = PORTS_DATABASE.filter(p => p.isIndianEastCoast);
  const activePort = PORTS_DATABASE.find(p => p.id === selectedPortId) || eastCoastPorts[0];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <MapPin className="w-4 h-4" />
          INDIA'S EAST COAST MARITIME GATEWAYS
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">East Coast Port Intelligence & Benchmarks</h1>
        <p className="text-sm text-slate-300 mt-0.5">
          Authoritative navigational constraints, draft limits, handling equipment throughput, and MoPSW national statistics.
        </p>
      </div>

      {/* Official MoPSW National Context Cards (Slide 2 & Slide 6) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: National Cargo Growth */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Indian Port Cargo Handled</span>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/40">
              2020–25
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">1,594</span>
            <span className="text-xs text-slate-400">Million Tonnes (FY25)</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 font-medium">
            ▲ +27.5% volume expansion from 1,250 Mt in 2020-21
          </div>

          {/* Mini Bar Chart */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-end justify-between gap-1.5 h-16">
            {NATIONAL_PORT_STATS.handledYears.map((item) => (
              <div key={item.year} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-cyan-600/80 hover:bg-cyan-500 rounded-t transition-all"
                  style={{ height: `${((item.volumeMt - 1100) / 600) * 100}%` }}
                ></div>
                <span className="text-[9px] font-mono text-slate-400">{item.year.slice(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Metric 2: Major Port Cargo Mix (Slide 2) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Major-Port Cargo Mix</span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/40">
                FY2024–25
              </span>
            </div>

            <div className="space-y-2 mt-2">
              {NATIONAL_PORT_STATS.cargoMixMajorPorts.map((mix) => (
                <div key={mix.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 text-[11px] truncate max-w-[170px]">{mix.name}</span>
                    <span className="font-mono font-bold text-slate-200">{mix.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${mix.percentage}%`, backgroundColor: mix.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 mt-2">
            Official major-port data: POL 29.8%, containers 22.6%, coal 21.8%, other ≈25.8%.
          </div>
        </div>

        {/* Metric 3: Vessel Turnaround Efficiency (Slide 6) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Average Vessel Turnaround</span>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/40">
                MoPSW Official
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400 font-mono">49.5</span>
              <span className="text-xs text-slate-400">hours (FY2024–25)</span>
            </div>

            <div className="mt-2 text-[11px] text-cyan-300">
              Dramatic turnaround reduction from <strong>96.0 hrs</strong> in FY2014-15!
            </div>

            {/* Visual comparison bars */}
            <div className="mt-4 space-y-2">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                  <span>FY 2014–15</span>
                  <span className="font-mono">96.0 h</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden">
                  <div className="bg-slate-600 h-full rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-emerald-400 mb-0.5">
                  <span>FY 2024–25 (Historic Milestone)</span>
                  <span className="font-mono font-bold">49.5 h (-48.4%)</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '51.5%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 mt-2">
            Source: Ministry of Ports, Shipping and Waterways (MoPSW) / PIB, 13 May 2025.
          </div>
        </div>
      </div>

      {/* East Coast Port Selector & Deep Dive Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Port List (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl space-y-2">
          <h3 className="font-bold text-slate-100 text-sm mb-3 flex items-center gap-2">
            <Anchor className="w-4 h-4 text-cyan-400" />
            Select East Coast Gateway
          </h3>

          <div className="space-y-1.5">
            {eastCoastPorts.map((p) => {
              const isSelected = p.id === activePort.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPortId(p.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500/50 shadow-md text-white'
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.maxDraftMeters >= 18 && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                            Cape
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{p.region}</div>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-cyan-300">
                      {p.maxDraftMeters}m draft
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
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
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <span>{activePort.region}</span>
                <span>•</span>
                <span>{activePort.berthCount} Mechanized Berths</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                {activePort.name}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Anchorage Status: {activePort.congestionStatus}
              </span>
            </div>
          </div>

          {/* Port Engineering Constraints Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Max Permissible Draft:</span>
              <span className="text-xl font-mono font-extrabold text-cyan-300 mt-0.5 block">
                {activePort.maxDraftMeters} m
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {activePort.maxDraftMeters >= 18 ? 'Capesize Friendly' : activePort.maxDraftMeters >= 14 ? 'Panamax Max' : 'Handy/Shallow'}
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Max Length Overall (LOA):</span>
              <span className="text-xl font-mono font-extrabold text-white mt-0.5 block">
                {activePort.maxLOAMeters} m
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Berth face envelope</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Discharge Handling Rate:</span>
              <span className="text-xl font-mono font-extrabold text-emerald-300 mt-0.5 block">
                {activePort.handlingRateTPD.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Tonnes per day (TPD)</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Avg Turnaround Time:</span>
              <span className="text-xl font-mono font-extrabold text-indigo-300 mt-0.5 block">
                {activePort.averageTurnaroundHours} hrs
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">MoPSW benchmark</span>
            </div>
          </div>

          {/* Operational Notes & Recommendations */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" />
              Navigational & Cargo Operations Intelligence
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activePort.notes}
            </p>
          </div>

          {/* Key Commodities Handled */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2">Key Cargo Handled:</div>
            <div className="flex flex-wrap gap-2">
              {activePort.keyCommodities.map((cmd) => (
                <span
                  key={cmd}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-200 border border-slate-700 font-medium"
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
