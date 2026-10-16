import React, { useState } from 'react';
import { 
  Sliders, 
  Fuel, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Layers, 
  Download, 
  Ship, 
  CheckCircle, 
  RefreshCw,
  Scale,
  DollarSign,
  Info
} from 'lucide-react';
import { SimulationParams, VesselClass } from '../types';
import { PORTS_DATABASE, COMMODITIES_DATABASE, VESSELS_DATABASE } from '../data/maritimeData';
import { evaluateVesselSuitability, getRouteDistance } from '../utils/freightCalculator';
import { naviApi } from '../services/api';

interface ScenarioOptimizerProps {
  simulationParams: SimulationParams;
  onUpdateParams: (params: Partial<SimulationParams>) => void;
}

export const ScenarioOptimizer: React.FC<ScenarioOptimizerProps> = ({
  simulationParams,
  onUpdateParams,
}) => {
  const [bunkerPrice, setBunkerPrice] = useState(simulationParams.bunkerPricePerMT || 624);
  const [congestionDays, setCongestionDays] = useState(simulationParams.portCongestionDays || 1.5);
  const [volatilityShock, setVolatilityShock] = useState(simulationParams.marketVolatilityShock || 0);
  const [weatherDelayDays, setWeatherDelayDays] = useState(0);

  const originPort = PORTS_DATABASE.find(p => p.id === simulationParams.originPortId) || PORTS_DATABASE[7];
  const destPort = PORTS_DATABASE.find(p => p.id === simulationParams.destPortId) || PORTS_DATABASE[0];
  const commodity = COMMODITIES_DATABASE.find(c => c.id === simulationParams.commodityId) || COMMODITIES_DATABASE[0];
  const distanceNM = getRouteDistance(originPort.id, destPort.id);

  // Baseline evaluation (Standard parameters)
  const baselineEvals = VESSELS_DATABASE.map(v =>
    evaluateVesselSuitability(v, destPort, simulationParams.cargoQuantityMT || 150000, commodity, distanceNM, 624, 1.5, 0)
  );

  // Stressed evaluation (Current slider parameters)
  const stressedEvals = VESSELS_DATABASE.map(v =>
    evaluateVesselSuitability(
      v,
      destPort,
      simulationParams.cargoQuantityMT || 150000,
      commodity,
      distanceNM + weatherDelayDays * 300,
      bunkerPrice,
      congestionDays,
      volatilityShock
    )
  );

  // Find baseline vs stressed best options
  const baselineBest = baselineEvals.find(e => e.status === 'Feasible') || baselineEvals[0];
  const stressedBest = stressedEvals.find(e => e.status === 'Feasible') || stressedEvals[0];

  const deltaCostPerTon = Number((stressedBest.estFreightRateUSD - baselineBest.estFreightRateUSD).toFixed(2));
  const deltaTotalCost = stressedBest.costBreakdown.totalCostUSD - baselineBest.costBreakdown.totalCostUSD;

  // Preset shock triggers
  const applyPreset = (preset: 'bunkerSpike' | 'congestionSurge' | 'cycloneMonsoon' | 'reset') => {
    if (preset === 'bunkerSpike') {
      setBunkerPrice(850);
      setVolatilityShock(12);
    } else if (preset === 'congestionSurge') {
      setCongestionDays(5.5);
      setVolatilityShock(8);
    } else if (preset === 'cycloneMonsoon') {
      setWeatherDelayDays(3);
      setCongestionDays(3.0);
      setBunkerPrice(680);
    } else {
      setBunkerPrice(624);
      setCongestionDays(1.5);
      setVolatilityShock(0);
      setWeatherDelayDays(0);
    }
  };

  const handleExportBrief = () => {
    // Also persist report to backend database
    naviApi.generateReport({
      title: `${destPort.name} Procurement Optimization Brief`,
      routeDescription: `${originPort.name} -> ${destPort.name}`,
      optimalVesselName: `${stressedBest.vessel.name} (${stressedBest.vessel.vesselClass})`,
      cargoQuantityMT: simulationParams.cargoQuantityMT,
      freightRatePerTon: stressedBest.estFreightRateUSD,
      totalCostUSD: stressedBest.costBreakdown.totalCostUSD,
      riskLevel: deltaCostPerTon > 4 ? 'High' : deltaCostPerTon > 2 ? 'Medium' : 'Low',
      keyFindings: `Stress test conditions: Bunker $${bunkerPrice}/MT, ${congestionDays}d waiting. Cost Delta: ${deltaCostPerTon >= 0 ? '+' : ''}$${deltaCostPerTon}/t against baseline.`,
      mopswBenchmarkCompliance: `Discharge verified within port maximum draft of ${destPort.maxDraftMeters}m.`,
    }).catch(console.error);

    const briefText = `NAVIFREIGHT MARITIME SCENARIO OPTIMIZATION BRIEF
==================================================
Date: ${new Date().toLocaleDateString()}
Route: ${originPort.name} -> ${destPort.name}
Commodity: ${commodity.name} (${simulationParams.cargoQuantityMT.toLocaleString()} MT)
Discharge Port Limit: ${destPort.maxDraftMeters}m Draft, ${destPort.maxLOAMeters}m LOA

STRESS CONDITIONS:
- Bunker Fuel Price: $${bunkerPrice} / MT (Baseline $624)
- Port Congestion / Waiting: ${congestionDays} days (Baseline 1.5d)
- Freight Market Volatility: ${volatilityShock >= 0 ? '+' : ''}${volatilityShock}%
- Weather / Monsoon Delay: +${weatherDelayDays} days

OPTIMAL VESSEL RECOMMENDATION:
- Selected Vessel: ${stressedBest.vessel.name} (${stressedBest.vessel.vesselClass})
- Delivered Freight Rate: $${stressedBest.estFreightRateUSD.toFixed(1)} / ton
- Total Delivered Cost: $${(stressedBest.costBreakdown.totalCostUSD / 1000000).toFixed(2)}M
- Cost Delta vs Baseline: ${deltaCostPerTon >= 0 ? '+' : ''}$${deltaCostPerTon} / ton
- Arrival Window: ${stressedBest.arrivalWindow}
- Strategic Explainability: ${stressedBest.whyThisMatches}

Generated by NaviFreight Decision Support System
`;
    const blob = new Blob([briefText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NaviFreight_Scenario_Brief_${destPort.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            STRESS TESTING & COST OPTIMIZER
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Scenario Stress-Testing</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Test rate spikes, bunker fuel surges, port congestion, and monsoon delays to evaluate strategy shifts.
          </p>
        </div>

        <button
          onClick={handleExportBrief}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Scenario Brief</span>
        </button>
      </div>

      {/* Preset Quick Shocks Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>One-Click Disruption Presets:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => applyPreset('bunkerSpike')}
            className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors font-medium"
          >
            Bunker Spike (+36% Fuel)
          </button>

          <button
            onClick={() => applyPreset('congestionSurge')}
            className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-colors font-medium"
          >
            Port Congestion (+4d Demurrage)
          </button>

          <button
            onClick={() => applyPreset('cycloneMonsoon')}
            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors font-medium"
          >
            Bay of Bengal Cyclone Window
          </button>

          <button
            onClick={() => applyPreset('reset')}
            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors font-medium flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* Interactive Controls & Live Impact Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sliders Workbench (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-5">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            Macro Stress Variables
          </h3>

          {/* Bunker Fuel Price Slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-amber-500" />
                VLSFO Bunker Fuel Price ($ / MT)
              </span>
              <span className="font-mono font-bold text-amber-700 text-sm">
                ${bunkerPrice} / MT
              </span>
            </div>
            <input
              type="range"
              min="450"
              max="950"
              step="10"
              value={bunkerPrice}
              onChange={(e) => setBunkerPrice(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>$450 (Depressed)</span>
              <span>$624 (Baseline)</span>
              <span>$950 (Geopolitical Spike)</span>
            </div>
          </div>

          {/* Port Congestion / Waiting Days Slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Port Waiting & Congestion Time (Days)
              </span>
              <span className="font-mono font-bold text-indigo-700 text-sm">
                {congestionDays} days
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              step="0.5"
              value={congestionDays}
              onChange={(e) => setCongestionDays(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>0d (Direct Berth)</span>
              <span>1.5d (Normal)</span>
              <span>8d (High Demurrage Risk)</span>
            </div>
          </div>

          {/* Market Volatility Shock Slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                Market Rate Shock (% shift)
              </span>
              <span className={`font-mono font-bold text-sm ${volatilityShock >= 0 ? 'text-blue-700' : 'text-emerald-700'}`}>
                {volatilityShock >= 0 ? '+' : ''}{volatilityShock}%
              </span>
            </div>
            <input
              type="range"
              min="-25"
              max="35"
              step="5"
              value={volatilityShock}
              onChange={(e) => setVolatilityShock(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>-25% (Oversupply)</span>
              <span>0% (Holdout Model)</span>
              <span>+35% (Commodity Rally)</span>
            </div>
          </div>

          {/* Monsoon Weather Delay Slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
                Monsoon Route Slowdown & Deviations
              </span>
              <span className="font-mono font-bold text-blue-700 text-sm">
                +{weatherDelayDays} days
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="6"
              step="1"
              value={weatherDelayDays}
              onChange={(e) => setWeatherDelayDays(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>0d (Calm Seas)</span>
              <span>+2d (Seasonal Swell)</span>
              <span>+6d (Cyclone Evasion)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Stress Impact Results (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
            <h3 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              Delivered Cost Variance vs Baseline
            </h3>

            {/* Impact Metric Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Stressed Rate / Ton:</span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-sans mt-0.5">
                  ${stressedBest.estFreightRateUSD.toFixed(1)} / t
                </div>
                <div className={`text-[11px] font-semibold mt-1 ${deltaCostPerTon >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {deltaCostPerTon >= 0 ? `▲ +$${deltaCostPerTon}/t` : `▼ -$${Math.abs(deltaCostPerTon)}/t`}
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Total Stressed Voyage Cost:</span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 font-sans mt-0.5">
                  ${(stressedBest.costBreakdown.totalCostUSD / 1000000).toFixed(2)}M
                </div>
                <div className={`text-[11px] font-semibold mt-1 ${deltaTotalCost >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {deltaTotalCost >= 0
                    ? `+$${(deltaTotalCost / 1000).toFixed(0)}k variance`
                    : `-$${Math.abs(deltaTotalCost / 1000).toFixed(0)}k variance`}
                </div>
              </div>
            </div>

            {/* Cost Breakdown Waterfall */}
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="text-slate-600 font-semibold mb-2">Cost Breakdown Under Stress:</div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Base Time-Charter Hire:</span>
                <span className="font-mono font-medium text-slate-800">
                  ${stressedBest.costBreakdown.baseFreightCostUSD.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Bunker Fuel Burn (VLSFO):</span>
                <span className="font-mono font-bold text-amber-700">
                  ${stressedBest.costBreakdown.bunkerCostUSD.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Port Pilotage & Berth Dues:</span>
                <span className="font-mono font-medium text-slate-800">
                  ${stressedBest.costBreakdown.portDuesUSD.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Demurrage & Anchorage Buffer:</span>
                <span className="font-mono font-bold text-indigo-700">
                  ${stressedBest.costBreakdown.waitingDemurrageUSD.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Shift in Recommendation Explainability */}
            <div className="mt-4 p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-slate-700">
              <div className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>Strategy Shift Insights:</span>
              </div>
              <p className="leading-relaxed text-slate-600">
                {bunkerPrice > 750
                  ? 'High bunker prices heavily penalize older Capesizes (38 TPD burn). Modern eco-Panamaxes (24 TPD) gain a $2.10/ton relative cost advantage.'
                  : congestionDays > 3
                  ? 'Elevated port congestion makes demurrage contingency significant ($22,000/day). Self-discharging Supramax or prioritised berth agreements recommended.'
                  : 'Current market parameters remain stable. Panamax parceling remains the most cost-effective and port-compliant solution for Paradip Port.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vessel Fleet Resilience Under Stress Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <h3 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
          <Ship className="w-4 h-4 text-blue-600" />
          Fleet Resilience Ranking Under Stressed Conditions
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Vessel</th>
                <th className="py-2.5 px-3">Class</th>
                <th className="py-2.5 px-3">Baseline $/t</th>
                <th className="py-2.5 px-3">Stressed $/t</th>
                <th className="py-2.5 px-3">Cost Delta</th>
                <th className="py-2.5 px-3">Stressed Total Cost</th>
                <th className="py-2.5 px-3">Suitability Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stressedEvals.map((stEv, idx) => {
                const bEv = baselineEvals[idx];
                const delta = Number((stEv.estFreightRateUSD - bEv.estFreightRateUSD).toFixed(1));

                return (
                  <tr key={stEv.vessel.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{stEv.vessel.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{stEv.vessel.vesselClass}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">${bEv.estFreightRateUSD.toFixed(1)}/t</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">${stEv.estFreightRateUSD.toFixed(1)}/t</td>
                    <td className="py-2.5 px-3 font-mono font-semibold">
                      <span className={delta > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                        {delta > 0 ? `+${delta}` : delta} $/t
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      ${(stEv.costBreakdown.totalCostUSD / 1000000).toFixed(2)}M
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          stEv.status === 'Feasible'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : stEv.status === 'Conditional'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {stEv.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
