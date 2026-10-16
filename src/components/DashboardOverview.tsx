import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Ship, 
  Anchor, 
  Layers, 
  Info, 
  ChevronDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Sparkles,
  X,
  ExternalLink
} from 'lucide-react';
import { FreightChart } from './FreightChart';
import { ShippingRouteCard } from './ShippingRouteCard';
import { RecentShipment } from '../types';

export const DASHBOARD_ROUTES = [
  { key: 'hedland_paradip', label: 'Route: Australia → Paradip Port (14.5m)', port: 'Paradip Port', rate: 25.4, delta: '↓ 3.0%', favorableWindow: 'Q1 2026' },
  { key: 'hedland_vizag', label: 'Route: Australia → Visakhapatnam Outer (18.5m)', port: 'Visakhapatnam Outer', rate: 22.8, delta: '↓ 4.5%', favorableWindow: 'Feb – Apr 2026' },
  { key: 'hedland_dhamra', label: 'Route: Australia → Dhamra Port (18.5m)', port: 'Dhamra Port', rate: 21.5, delta: '↓ 5.2%', favorableWindow: 'Immediate Q1' },
  { key: 'hedland_gangavaram', label: 'Route: Australia → Gangavaram Port (19.5m)', port: 'Gangavaram Port', rate: 23.2, delta: '↓ 2.8%', favorableWindow: 'Mar – May 2026' },
  { key: 'hedland_haldia', label: 'Route: Australia → Haldia Dock (8.5m Tidal)', port: 'Haldia Dock', rate: 34.8, delta: '↑ 1.5%', favorableWindow: 'Spring Tide Windows' },
  { key: 'hedland_kamarajar', label: 'Route: Australia → Kamarajar (Ennore 15.5m)', port: 'Kamarajar (Ennore)', rate: 26.2, delta: '↓ 1.9%', favorableWindow: 'Q1 – Q2 2026' },
  { key: 'newcastle_vizag', label: 'Route: Newcastle → Visakhapatnam (Coking Coal)', port: 'Visakhapatnam', rate: 28.4, delta: '↑ 2.1%', favorableWindow: 'Mid Q2 2026' },
  { key: 'newcastle_dhamra', label: 'Route: Newcastle → Dhamra Port (Capesize)', port: 'Dhamra Port', rate: 27.2, delta: '↓ 1.0%', favorableWindow: 'Q1 2026' },
  { key: 'newcastle_kamarajar', label: 'Route: Newcastle → Kamarajar (Ennore)', port: 'Kamarajar (Ennore)', rate: 27.8, delta: '↓ 0.8%', favorableWindow: 'Q2 2026' },
  { key: 'richardsbay_dhamra', label: 'Route: Richards Bay → Dhamra (Thermal Coal)', port: 'Dhamra Port', rate: 27.5, delta: '↑ 3.2%', favorableWindow: 'Pre-Monsoon Restock' },
  { key: 'richardsbay_gangavaram', label: 'Route: Richards Bay → Gangavaram Port', port: 'Gangavaram Port', rate: 28.1, delta: '↑ 2.4%', favorableWindow: 'Mar – Apr 2026' },
  { key: 'richardsbay_paradip', label: 'Route: Richards Bay → Paradip Port', port: 'Paradip Port', rate: 28.9, delta: '↑ 2.6%', favorableWindow: 'Mar 2026' },
  { key: 'dalrymple_haldia', label: 'Route: Dalrymple Bay → Haldia Dock (Met Coal)', port: 'Haldia Dock', rate: 36.2, delta: '↑ 4.0%', favorableWindow: 'High Tide Laycan' },
  { key: 'dalrymple_paradip', label: 'Route: Dalrymple Bay → Paradip Port', port: 'Paradip Port', rate: 29.4, delta: '↑ 1.8%', favorableWindow: 'Apr 2026' },
];

interface DashboardOverviewProps {
  onNavigateTab: (tab: any) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigateTab,
}) => {
  const [selectedRouteKey, setSelectedRouteKey] = useState<string>('hedland_paradip');
  const [activeTooltip, setActiveTooltip] = useState<
    'freight' | 'routes' | 'ports' | 'cargo' | 'forecastChart' | 'vesselComparison' | null
  >(null);

  const activeRouteData = DASHBOARD_ROUTES.find((r) => r.key === selectedRouteKey) || DASHBOARD_ROUTES[0];
  const currentRate = activeRouteData.rate;

  // Dynamically compute chart points matching the selected route's price curve
  const dynamicChartPoints = useMemo(() => {
    const scale = currentRate / 25.4;
    return [
      { label: 'Jan 2024', rate: +(21.5 * scale).toFixed(1), isForecast: false, isBoundary: false },
      { label: 'Feb 2024', rate: +(26.2 * scale).toFixed(1), isForecast: false, isBoundary: false },
      { label: 'Apr 2024', rate: +(22.0 * scale).toFixed(1), isForecast: false, isBoundary: false },
      { label: 'May 2024', rate: +(24.8 * scale).toFixed(1), isForecast: false, isBoundary: false },
      { label: 'Jul 2024', rate: +(31.0 * scale).toFixed(1), isForecast: false, isBoundary: false },
      { label: 'Aug 2024', rate: +(27.5 * scale).toFixed(1), isForecast: false, isBoundary: false },
      { label: 'Oct 2024', rate: +(23.4 * scale).toFixed(1), isForecast: false, isBoundary: false },
      { label: 'Nov 2024', rate: +(21.0 * scale).toFixed(1), isForecast: false, isBoundary: false },
      { label: 'Jan 2025', rate: +currentRate.toFixed(1), isForecast: false, isBoundary: true },
      // Forecast points with realistic confidence bands
      { label: 'Feb 2025', rate: +(25.5 * scale).toFixed(1), lower: +(22.0 * scale).toFixed(1), upper: +(28.5 * scale).toFixed(1), isForecast: true, isBoundary: false },
      { label: 'Apr 2025', rate: +(26.2 * scale).toFixed(1), lower: +(22.5 * scale).toFixed(1), upper: +(29.8 * scale).toFixed(1), isForecast: true, isBoundary: false },
      { label: 'Jul 2025', rate: +(28.5 * scale).toFixed(1), lower: +(23.8 * scale).toFixed(1), upper: +(33.0 * scale).toFixed(1), isForecast: true, isBoundary: false },
      { label: 'Oct 2025', rate: +(29.8 * scale).toFixed(1), lower: +(24.0 * scale).toFixed(1), upper: +(35.0 * scale).toFixed(1), isForecast: true, isBoundary: false },
    ];
  }, [currentRate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.info-popover-panel') && !target.closest('.info-trigger-btn')) {
        setActiveTooltip(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveTooltip(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* 4 Primary Top KPI Cards (Screenshot 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Freight Rate Trend */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between relative">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-medium">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              Freight Rate Trend
              <button
                type="button"
                onClick={() => setActiveTooltip(activeTooltip === 'freight' ? null : 'freight')}
                className={`info-trigger-btn p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer ${
                  activeTooltip === 'freight' ? 'text-blue-600 bg-blue-50 ring-2 ring-blue-500/20' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="View metric details & calculation methodology"
                aria-label="More information about Freight Rate Trend"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </span>
          </div>

          {/* Popover Card 1 */}
          {activeTooltip === 'freight' && (
            <div className="info-popover-panel absolute top-10 left-2 right-2 z-40 bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 text-xs animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Freight Rate Benchmark</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTooltip(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1.5 text-slate-600 leading-relaxed text-[11.5px]">
                <p>
                  <strong className="text-slate-900">Current Spot Rate:</strong> Australia (Port Hedland) to East Coast India (Paradip) Panamax benchmark.
                </p>
                <p>
                  <strong className="text-slate-900">Monthly Trend:</strong> Down 3.0% compared to previous month due to post-holiday bulk tonnage availability in the Indian Ocean.
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] mt-2">
                  <span className="text-slate-400">Baltic C5/P3A Indexed</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTooltip(null);
                      onNavigateTab('forecast');
                    }}
                    className="text-blue-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Open Forecast Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3.5 my-1">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                $ {activeRouteData.rate.toFixed(1)} <span className="text-sm font-semibold text-slate-500">/ton</span>
              </div>
              <div className="text-xs font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                <span>{activeRouteData.delta}</span>
                <span className="text-slate-500 font-normal ml-1">for {activeRouteData.port}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Active Routes */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between relative">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-medium">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              Active Routes
              <button
                type="button"
                onClick={() => setActiveTooltip(activeTooltip === 'routes' ? null : 'routes')}
                className={`info-trigger-btn p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer ${
                  activeTooltip === 'routes' ? 'text-blue-600 bg-blue-50 ring-2 ring-blue-500/20' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="View monitored maritime shipping routes"
                aria-label="More information about Active Routes"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </span>
          </div>

          {/* Popover Card 2 */}
          {activeTooltip === 'routes' && (
            <div className="info-popover-panel absolute top-10 left-2 right-2 z-40 bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 text-xs animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Ship className="w-4 h-4 text-blue-600" />
                  <span>Monitored Shipping Corridors</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTooltip(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1 text-slate-600 text-[11px]">
                <p className="font-semibold text-slate-800 mb-1">6 Active Overseas Bulk Corridors:</p>
                <ul className="space-y-1 text-slate-600 text-[10.5px]">
                  <li>• <strong className="text-slate-800">Port Hedland → Paradip:</strong> ~4,650 nm (Iron Ore)</li>
                  <li>• <strong className="text-slate-800">Newcastle → Dhamra:</strong> ~5,200 nm (Coking Coal)</li>
                  <li>• <strong className="text-slate-800">Port Hedland → Vizag Outer:</strong> ~4,580 nm (Capesize)</li>
                  <li>• <strong className="text-slate-800">Richards Bay → Gangavaram:</strong> ~4,350 nm (Thermal Coal)</li>
                  <li>• <strong className="text-slate-800">Dalrymple Bay → Haldia:</strong> ~4,980 nm (Handysize)</li>
                  <li>• <strong className="text-slate-800">Port Hedland → Ennore:</strong> ~4,420 nm (Bulk Ore)</li>
                </ul>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] mt-2">
                  <span className="text-slate-400">AIS Satellite Telemetry</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTooltip(null);
                      onNavigateTab('chartering');
                    }}
                    className="text-blue-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Analyze Fleet</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3.5 my-1">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                6
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Major overseas routes to East Coast India
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Port Conditions */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between relative">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-medium">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              Port Conditions
              <button
                type="button"
                onClick={() => setActiveTooltip(activeTooltip === 'ports' ? null : 'ports')}
                className={`info-trigger-btn p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer ${
                  activeTooltip === 'ports' ? 'text-blue-600 bg-blue-50 ring-2 ring-blue-500/20' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="View Indian port trust turnaround benchmarks"
                aria-label="More information about Port Conditions"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </span>
          </div>

          {/* Popover Card 3 */}
          {activeTooltip === 'ports' && (
            <div className="info-popover-panel absolute top-10 left-2 right-2 z-40 bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 text-xs animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Anchor className="w-4 h-4 text-teal-600" />
                  <span>MoPSW Port Efficiency Benchmarks</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTooltip(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1.5 text-slate-600 leading-relaxed text-[11px]">
                <p>
                  <strong className="text-slate-900">National Average:</strong> 49.5 hours turnaround across Indian East Coast major port trusts (FY25/26).
                </p>
                <div className="grid grid-cols-2 gap-1.5 py-1 text-[10px]">
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="font-bold text-slate-800 block">Dhamra: 36.8 hrs</span>
                    <span className="text-slate-500">18.0m draft (Lowest wait)</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="font-bold text-slate-800 block">Vizag Outer: 44.0 hrs</span>
                    <span className="text-slate-500">18.5m draft (Capesize)</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="font-bold text-slate-800 block">Paradip: 48.2 hrs</span>
                    <span className="text-slate-500">14.5m draft (Panamax)</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="font-bold text-slate-800 block">Haldia: 64.2 hrs</span>
                    <span className="text-slate-500">8.5m draft (River tide)</span>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-700 font-bold">Status: Normal / Congestion Low</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTooltip(null);
                      onNavigateTab('chartering');
                    }}
                    className="text-blue-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Port Constraints</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3.5 my-1">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 shrink-0">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                Normal
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Average turnaround <strong className="text-slate-800">49.5 hours</strong> (Major Ports*)
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Cargo Requirement */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between relative">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-medium">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              Cargo Requirement
              <button
                type="button"
                onClick={() => setActiveTooltip(activeTooltip === 'cargo' ? null : 'cargo')}
                className={`info-trigger-btn p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer ${
                  activeTooltip === 'cargo' ? 'text-blue-600 bg-blue-50 ring-2 ring-blue-500/20' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="View cargo allocation & laycan window"
                aria-label="More information about Cargo Requirement"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </span>
          </div>

          {/* Popover Card 4 */}
          {activeTooltip === 'cargo' && (
            <div className="info-popover-panel absolute top-10 left-2 right-2 z-40 bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 text-xs animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>Voyage Cargo Allocation</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTooltip(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1.5 text-slate-600 leading-relaxed text-[11px]">
                <p>
                  <strong className="text-slate-900">Target Cargo:</strong> 150,000 Metric Tons of Bulk Iron Ore (Fines) for blast furnace feed.
                </p>
                <p>
                  <strong className="text-slate-900">Target Laycan:</strong> 18 Mar – 24 Mar 2026.
                </p>
                <div className="p-1.5 bg-amber-50/70 border border-amber-200/60 rounded text-[10.5px] text-amber-900">
                  <strong>Logistics Plan:</strong> Direct single shipment via Capesize to deepwater Dhamra/Vizag ($22.50/t), or two Panamax voyages (75k DWT) to Paradip to stay within 14.5m draft limits.
                </div>
                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Target: Q1 Restock</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTooltip(null);
                      onNavigateTab('chartering');
                    }}
                    className="text-blue-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Optimize Charter</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3.5 my-1">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                150,000 <span className="text-sm font-semibold text-slate-500">tons</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Iron Ore (Next Shipment) <span className="font-semibold text-slate-700">Mar 2026</span> (Target Arrival)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Freight Rate Trend & Forecast + Shipping Route (Screenshot 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Freight Rate Trend & Forecast (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm sm:text-base">
                <span>Freight Rate Trend & Forecast</span>
                <button
                  type="button"
                  onClick={() => setActiveTooltip(activeTooltip === 'forecastChart' ? null : 'forecastChart')}
                  className={`info-trigger-btn p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer ${
                    activeTooltip === 'forecastChart' ? 'text-blue-600 bg-blue-50 ring-2 ring-blue-500/20' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="View forecasting methodology & confidence interval"
                  aria-label="More information about Freight Rate Trend & Forecast"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Popover Chart Info */}
              {activeTooltip === 'forecastChart' && (
                <div className="info-popover-panel absolute top-12 left-4 right-4 z-40 bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      Multivariate Forecast Engine
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTooltip(null)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Close"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1.5 text-slate-600 leading-relaxed text-[11px]">
                    <p>
                      <strong className="text-slate-900">Forecasting Model:</strong> Vector Autoregression (VAR) model correlating historical Baltic indices, Singapore bunker swaps, and seasonal Indian East Coast monsoon conditions.
                    </p>
                    <p>
                      <strong className="text-slate-900">Confidence Band:</strong> The shaded area represents a ±20% confidence band (22.5 – 28.5 $/ton) over a 30 to 90 day planning horizon.
                    </p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] mt-2">
                      <span className="text-slate-400">R² = 0.892 • MAPE = 6.8%</span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTooltip(null);
                          onNavigateTab('forecast');
                        }}
                        className="text-blue-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <span>Open Full Studio</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="relative">
                <select
                  value={selectedRouteKey}
                  onChange={(e) => setSelectedRouteKey(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1 pr-7 appearance-none focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs max-w-[260px] sm:max-w-[340px] truncate"
                >
                  {DASHBOARD_ROUTES.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Chart Canvas */}
            <div className="pt-2">
              <FreightChart height={230} data={dynamicChartPoints} />
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Forecast indicates favorable chartering window for {activeRouteData.port} in {activeRouteData.favorableWindow}.</span>
            <button
              onClick={() => onNavigateTab('forecast')}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Open Forecast Studio →
            </button>
          </div>
        </div>

        {/* Right Column: Shipping Route to East Coast India (6 cols) */}
        <div className="lg:col-span-6">
          <ShippingRouteCard 
            selectedRouteKey={selectedRouteKey}
            onRouteChange={setSelectedRouteKey}
          />
        </div>
      </div>

      {/* Bottom Row: Vessel Comparison Table + Recent Plans / Shipments (Screenshot 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vessel Comparison (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs relative">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
              <span>Vessel Comparison</span>
              <button
                type="button"
                onClick={() => setActiveTooltip(activeTooltip === 'vesselComparison' ? null : 'vesselComparison')}
                className={`info-trigger-btn p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer ${
                  activeTooltip === 'vesselComparison' ? 'text-blue-600 bg-blue-50 ring-2 ring-blue-500/20' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="View vessel suitability criteria & port compliance"
                aria-label="More information about Vessel Comparison"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </h3>

            {/* Popover Table Info */}
            {activeTooltip === 'vesselComparison' && (
              <div className="info-popover-panel absolute top-12 left-4 right-4 z-40 bg-white border border-slate-200 rounded-xl shadow-xl p-3.5 text-xs animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Ship className="w-4 h-4 text-blue-600" />
                    Vessel Class Port Constraints Matrix
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTooltip(null)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5 text-slate-600 leading-relaxed text-[11px]">
                  <p>
                    <strong className="text-slate-900">Suitability Scoring:</strong> Calculated dynamically by validating vessel laden draft, Length Overall (LOA), and beam against target East Coast port berth limits.
                  </p>
                  <p>
                    <strong className="text-slate-900">Recommendation:</strong> Panamax (60k–85k DWT) is rated <strong>Most Suitable</strong> for Paradip due to the 14.5m draft restriction. Capesize requires offshore transshipment or lighterage.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] mt-2">
                    <span className="text-slate-400">MoPSW Verified Dimensions</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTooltip(null);
                        onNavigateTab('chartering');
                      }}
                      className="text-blue-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>Fleet Analysis Studio</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => onNavigateTab('chartering')}
              className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              Analyze Fleet →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Vessel Type</th>
                  <th className="py-2.5 px-3">Capacity (DWT)</th>
                  <th className="py-2.5 px-2 text-center" colSpan={3}>
                    Typical Dimensions (m)
                    <div className="flex justify-around text-[10px] text-slate-400 font-normal mt-0.5">
                      <span>LOA</span>
                      <span>Beam</span>
                      <span>Draft</span>
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right">Suitability for East Coast Ports</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Handysize */}
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-800">Handysize</td>
                  <td className="py-3 px-3 font-mono text-slate-600">10,000 – 40,000</td>
                  <td className="py-3 px-2 text-center font-mono text-slate-600">180</td>
                  <td className="py-3 px-2 text-center font-mono text-slate-600">28</td>
                  <td className="py-3 px-2 text-center font-mono text-slate-600">10 – 12</td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-block px-3 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-700">
                      Conditional
                    </span>
                  </td>
                </tr>

                {/* Supramax */}
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-800">Supramax</td>
                  <td className="py-3 px-3 font-mono text-slate-600">40,000 – 60,000</td>
                  <td className="py-3 px-2 text-center font-mono text-slate-600">190</td>
                  <td className="py-3 px-2 text-center font-mono text-slate-600">32</td>
                  <td className="py-3 px-2 text-center font-mono text-slate-600">12 – 14</td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-block px-3 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-700">
                      Suitable
                    </span>
                  </td>
                </tr>

                {/* Panamax */}
                <tr className="hover:bg-slate-50/80 transition-colors bg-emerald-50/30">
                  <td className="py-3 px-3 font-bold text-slate-900">Panamax</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">60,000 – 85,000</td>
                  <td className="py-3 px-2 text-center font-mono font-semibold text-slate-800">225</td>
                  <td className="py-3 px-2 text-center font-mono font-semibold text-slate-800">32</td>
                  <td className="py-3 px-2 text-center font-mono font-semibold text-slate-800">14 – 15</td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-block px-3 py-1 rounded-md text-[11px] font-bold bg-emerald-200 text-emerald-900 border border-emerald-300">
                      Most Suitable
                    </span>
                  </td>
                </tr>

                {/* Capesize */}
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-800">Capesize</td>
                  <td className="py-3 px-3 font-mono text-slate-600">100,000 – 180,000</td>
                  <td className="py-3 px-2 text-center font-mono text-slate-600">292</td>
                  <td className="py-3 px-2 text-center font-mono text-slate-600">45</td>
                  <td className="py-3 px-2 text-center font-mono text-slate-600">18 – 20</td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-block px-3 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700">
                      Port Limits
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Recent Plans / Shipments (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Recent Plans / Shipments
            </h3>
            <button
              onClick={() => onNavigateTab('chartering')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Commodity</th>
                  <th className="py-2.5 px-3">Quantity (tons)</th>
                  <th className="py-2.5 px-3">Origin Port</th>
                  <th className="py-2.5 px-3">Destination Port</th>
                  <th className="py-2.5 px-3">Est. Arrival</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Shipment 1 */}
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-medium text-slate-800">Iron Ore</td>
                  <td className="py-3 px-3 font-mono text-slate-600">150,000</td>
                  <td className="py-3 px-3 text-slate-700">Port Hedland</td>
                  <td className="py-3 px-3 text-slate-900 font-medium">Paradip</td>
                  <td className="py-3 px-3 font-mono text-slate-600">18 Mar 2026</td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-block px-3 py-0.5 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-700">
                      Planned
                    </span>
                  </td>
                </tr>

                {/* Shipment 2 */}
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-medium text-slate-800">Coking Coal</td>
                  <td className="py-3 px-3 font-mono text-slate-600">120,000</td>
                  <td className="py-3 px-3 text-slate-700">Newcastle</td>
                  <td className="py-3 px-3 text-slate-900 font-medium">Visakhapatnam</td>
                  <td className="py-3 px-3 font-mono text-slate-600">05 Feb 2026</td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-block px-3 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-700">
                      In Analysis
                    </span>
                  </td>
                </tr>

                {/* Shipment 3 */}
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-medium text-slate-800">Iron Ore</td>
                  <td className="py-3 px-3 font-mono text-slate-600">180,000</td>
                  <td className="py-3 px-3 text-slate-700">Dampier</td>
                  <td className="py-3 px-3 text-slate-900 font-medium">Dhamra</td>
                  <td className="py-3 px-3 font-mono text-slate-600">22 Jan 2026</td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-block px-3 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                      Confirmed
                    </span>
                  </td>
                </tr>

                {/* Shipment 4 */}
                <tr className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-medium text-slate-800">Iron Ore</td>
                  <td className="py-3 px-3 font-mono text-slate-600">100,000</td>
                  <td className="py-3 px-3 text-slate-700">Port Hedland</td>
                  <td className="py-3 px-3 text-slate-900 font-medium">Haldia</td>
                  <td className="py-3 px-3 font-mono text-slate-600">10 Apr 2026</td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-block px-3 py-0.5 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-700">
                      Planned
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
