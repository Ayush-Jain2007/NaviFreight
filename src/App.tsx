import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardOverview } from './components/DashboardOverview';
import { FreightForecast } from './components/FreightForecast';
import { VesselChartering } from './components/VesselChartering';
import { ScenarioOptimizer } from './components/ScenarioOptimizer';
import { PortIntelligence } from './components/PortIntelligence';
import { ShippingRouteCard } from './components/ShippingRouteCard';
import { MaritimeSafetyRecovery } from './components/MaritimeSafetyRecovery';
import { VesselStudio } from './components/VesselStudio';
import { VesselComparisonModal } from './components/VesselComparisonModal';
import { NewSimulationModal } from './components/NewSimulationModal';
import { AuthenticationPage } from './components/AuthenticationPage';
import { SimulationParams, Vessel } from './types';
import { PORTS_DATABASE, COMMODITIES_DATABASE } from './data/maritimeData';
import { Ship, Compass, RefreshCw, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { naviApi, DecisionBrief, MarketFeed } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNewSimModalOpen, setIsNewSimModalOpen] = useState(false);
  const [compareVessels, setCompareVessels] = useState<Vessel[] | null>(null);

  const [reports, setReports] = useState<DecisionBrief[]>([]);
  const [marketFeeds, setMarketFeeds] = useState<MarketFeed[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);

  useEffect(() => {
    naviApi.checkHealth().then((ok) => setIsBackendConnected(ok)).catch(() => setIsBackendConnected(false));
    naviApi.getReports().then((reps) => {
      if (reps && reps.length > 0) setReports(reps);
    }).catch(console.error);
    naviApi.getMarketFeeds().then((feeds) => {
      if (feeds && feeds.length > 0) setMarketFeeds(feeds);
    }).catch(console.error);
  }, [activeTab]);

  const [simulationParams, setSimulationParams] = useState<SimulationParams>({
    originPortId: 'port_hedland',
    destPortId: 'paradip',
    commodityId: 'iron_ore',
    cargoQuantityMT: 150000,
    targetArrivalDate: '18 Mar 2026',
    horizonDays: 60,
    bunkerPricePerMT: 624,
    portCongestionDays: 1.5,
    marketVolatilityShock: 0,
  });

  const [dateRangeText, setDateRangeText] = useState('Jan 2025 – Dec 2026');

  const handleUpdateParams = (newParams: Partial<SimulationParams>) => {
    setSimulationParams(prev => ({
      ...prev,
      ...newParams,
    }));
  };

  const activeDestPort = PORTS_DATABASE.find(p => p.id === simulationParams.destPortId) || PORTS_DATABASE[0];
  const activeCommodity = COMMODITIES_DATABASE.find(c => c.id === simulationParams.commodityId) || COMMODITIES_DATABASE[0];

  // Dynamic Page Title & Subtitle matching the prototype screens
  const getHeaderMeta = () => {
    switch (activeTab) {
      case 'overview':
        return {
          title: 'Dashboard Overview',
          subtitle: "Freight forecasting and vessel optimization for bulk cargo procurement to India's East Coast",
        };
      case 'forecast':
        return {
          title: 'Freight Rate Forecast',
          subtitle: 'Predict future freight rates based on historical data and market indicators',
        };
      case 'chartering':
        return {
          title: 'Vessel Chartering & Suitability',
          subtitle: 'Compare available vessels based on cargo, port constraints and estimated freight cost',
        };
      case 'studio':
        return {
          title: '3D Vessel & Fleet Studio',
          subtitle: 'Photorealistic WebGL maritime digital twin, dynamic wave displacement ocean, and hydrostatic draft simulation',
        };
      case 'ports':
        return {
          title: 'Port Intelligence',
          subtitle: "Navigational constraints, berth specifications, and MoPSW benchmarks for India's East Coast",
        };
      case 'procurement':
        return {
          title: 'Procurement Plan & Scenario Testing',
          subtitle: 'Stress-test freight rates, bunker fuel spikes, and port congestion demurrage risks',
        };
      case 'routes':
        return {
          title: 'Route & Port Analysis',
          subtitle: "Nautical routes, chokepoints, and voyage time analytics from US, Ukraine, Australia & Global Hubs to India",
        };
      case 'safety':
        return {
          title: 'Maritime Safety & Recovery Command Center',
          subtitle: 'Emergency SOS reporting, fleet safety tracking, cargo disruption recovery, and port clearance coordination',
        };
      case 'reports':
        return {
          title: 'Reports & Decision Briefs',
          subtitle: 'Exportable procurement briefs, commercial chartering summaries, and audit logs',
        };
      case 'settings':
        return {
          title: 'Settings & Data Feeds',
          subtitle: 'Configure data proxies, prediction horizons, and port trust authoritative records',
        };
      case 'auth':
        return {
          title: 'Maritime Identity & Authentication Portal',
          subtitle: 'Firebase authentication, corporate session credentials, and procurement role permissions',
        };
      default:
        return {
          title: 'Dashboard Overview',
          subtitle: "Freight forecasting and vessel optimization for bulk cargo procurement to India's East Coast",
        };
    }
  };

  const headerMeta = getHeaderMeta();

  return (
    <div className="min-h-screen bg-[#f4f7fa] text-slate-800 flex font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Left Dark Sidebar (Matches all 4 Prototype Screenshots) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar (Matches Prototype Screenshots) */}
        <TopBar
          title={headerMeta.title}
          subtitle={headerMeta.subtitle}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          dateRangeText={dateRangeText}
          onDateRangeChange={setDateRangeText}
          onNavigateTab={(tab) => setActiveTab(tab as NavTab)}
          onOpenAuth={() => {
            setActiveTab('auth');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* Dynamic Screen Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1600px] w-full mx-auto">
          {activeTab === 'overview' && (
            <DashboardOverview
              onNavigateTab={(tab) => setActiveTab(tab as NavTab)}
            />
          )}

          {activeTab === 'forecast' && (
            <FreightForecast
              simulationParams={simulationParams}
              onUpdateParams={handleUpdateParams}
              onNavigateTab={(tab) => setActiveTab(tab as NavTab)}
            />
          )}

          {activeTab === 'chartering' && (
            <VesselChartering
              simulationParams={simulationParams}
              onUpdateParams={handleUpdateParams}
              onOpenCompareModal={(vessels) => setCompareVessels(vessels)}
              onNavigateTab={(tab) => setActiveTab(tab as NavTab)}
            />
          )}

          {activeTab === 'studio' && (
            <VesselStudio
              simulationParams={simulationParams}
              onUpdateParams={handleUpdateParams}
              onNavigateTab={(tab) => setActiveTab(tab as NavTab)}
            />
          )}

          {activeTab === 'ports' && (
            <PortIntelligence onNavigateTab={(tab) => setActiveTab(tab as NavTab)} />
          )}

          {activeTab === 'procurement' && (
            <ScenarioOptimizer
              simulationParams={simulationParams}
              onUpdateParams={handleUpdateParams}
            />
          )}

          {activeTab === 'routes' && (
            <div className="space-y-6">
              {/* Main Interactive Map Card */}
              <ShippingRouteCard
                selectedDestPortId={simulationParams.destPortId}
                onSelectPort={(port) => handleUpdateParams({ destPortId: port.id })}
                onNavigateTab={(tab) => setActiveTab(tab as NavTab)}
              />

              {/* Maritime Corridors & Fleet AIS Telemetry */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Active AIS Fleet Tracking (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4 text-blue-600" />
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        Live Bulk Carrier Fleet Telemetry (AIS Tracking)
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                        3 Vessels In Transit
                      </span>
                      <button
                        onClick={() => setActiveTab('safety')}
                        className="text-[10px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2.5 py-0.5 rounded-md border border-rose-200 cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <ShieldAlert className="w-3 h-3 text-rose-600" />
                        <span>Safety Command</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                          <th className="py-2 px-3">Vessel</th>
                          <th className="py-2 px-3">Class</th>
                          <th className="py-2 px-3">Speed / Course</th>
                          <th className="py-2 px-3">Destination</th>
                          <th className="py-2 px-3">Est. Arrival</th>
                          <th className="py-2 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">MV Blue Horizon</td>
                          <td className="py-2.5 px-3 text-slate-600">Panamax (76k)</td>
                          <td className="py-2.5 px-3 font-mono text-slate-800">13.2 kts • 318° NW</td>
                          <td className="py-2.5 px-3 font-medium text-blue-700">Paradip</td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">18 Mar 2026</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                              Laden
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">MV Iron Leader</td>
                          <td className="py-2.5 px-3 text-slate-600">Capesize (180k)</td>
                          <td className="py-2.5 px-3 font-mono text-slate-800">12.6 kts • 325° NW</td>
                          <td className="py-2.5 px-3 font-medium text-emerald-700">Visakhapatnam (Outer)</td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">25 Feb 2026</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              En Route
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">MV Global Pioneer</td>
                          <td className="py-2.5 px-3 text-slate-600">Panamax (82k)</td>
                          <td className="py-2.5 px-3 font-mono text-slate-800">13.0 kts • 310° NW</td>
                          <td className="py-2.5 px-3 font-medium text-blue-700">Dhamra Port</td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">22 Jan 2026</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                              Sunda Transit
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Navigational Chokepoints & Corridor Intelligence (5 cols) */}
                <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Navigational Chokepoint Advisory
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">Lombok Strait (Indonesia)</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Unrestricted water depth (&gt;150m) ideal for fully laden Capesize ore carriers avoiding Malacca shallow bars (20.5m limit).
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">Six Degree Channel (Great Channel)</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          Clear Water
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Wide oceanic entry corridor between Great Nicobar and Sumatra into the Bay of Bengal, avoiding pre-monsoon coastal squalls.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">Sandheads (Hooghly Approaches)</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                          Draft Restricted (8.5m)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Vessels bound for Haldia must take river pilots at Sandheads. Tidal window governs entry over Auckland and Balari river bars.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'safety' && (
            <MaritimeSafetyRecovery
              onNavigateTab={(tab) => setActiveTab(tab as NavTab)}
            />
          )}

          {activeTab === 'reports' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Maritime Intelligence Reports</h3>
                  <p className="text-xs text-slate-500">
                    Generated decision briefs, chronological backtest reports, and port clearance certificates.
                  </p>
                </div>
                <button
                  onClick={() => naviApi.getReports().then(reps => setReports(reps))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Briefs</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {reports.map((report) => (
                  <div key={report.id} className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-colors">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-blue-100 text-blue-700">
                          {report.status}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          report.riskLevel === 'Low' ? 'bg-emerald-100 text-emerald-800' :
                          report.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {report.riskLevel} Risk
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug mb-1">{report.title}</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mb-2">{report.keyFindings}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700">{report.optimalVesselName}</span>
                      <span className="font-mono font-bold text-blue-700">
                        ${report.freightRatePerTon ? report.freightRatePerTon.toFixed(1) : '25.4'}/t
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">System Preferences & Data Controls</h3>
                  <p className="text-xs text-slate-500">
                    Controls before scale: transparent proxy series, prediction intervals (±20%), and vessel registry integrations.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    isBackendConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    {isBackendConnected ? 'Backend Connected (:3001)' : 'Offline Cache Mode'}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                {marketFeeds.map((feed) => (
                  <div key={feed.key} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                    <div>
                      <span className="text-slate-800 font-semibold block">{feed.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Source: {feed.source}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {feed.value.toLocaleString()} {feed.unit}
                    </span>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-700 font-medium">Forecast Confidence Band:</span>
                  <span className="font-mono font-bold text-slate-800">±20% Prediction Interval</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-medium">Port Constraint Engine:</span>
                  <span className="font-bold text-emerald-700">Authoritative Port Trust Records (Active)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'auth' && (
            <AuthenticationPage
              onNavigateTab={(tab) => {
                setActiveTab(tab as NavTab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onClose={() => {
                setActiveTab('overview');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </main>
      </div>

      {/* Modal Dialogs */}
      {compareVessels && (
        <VesselComparisonModal
          vessels={compareVessels}
          destPort={activeDestPort}
          commodity={activeCommodity}
          cargoQuantityMT={simulationParams.cargoQuantityMT}
          onClose={() => setCompareVessels(null)}
        />
      )}

      {isNewSimModalOpen && (
        <NewSimulationModal
          currentParams={simulationParams}
          onApply={(newP) => {
            setSimulationParams(newP);
            setActiveTab('chartering');
          }}
          onClose={() => setIsNewSimModalOpen(false)}
        />
      )}
    </div>
  );
}
