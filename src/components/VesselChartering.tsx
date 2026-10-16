import React, { useState, useEffect } from 'react';
import { 
  Ship, 
  Search, 
  Calendar, 
  Anchor, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Scale, 
  Lightbulb, 
  ArrowRight, 
  ChevronRight, 
  ChevronDown,
  Layers,
  Sparkles,
  Info,
  Loader2
} from 'lucide-react';
import { Vessel, Port, Commodity, SimulationParams } from '../types';
import { VESSELS_DATABASE, PORTS_DATABASE, COMMODITIES_DATABASE } from '../data/maritimeData';
import { naviApi, CharteringEvaluationResponse } from '../services/api';

interface VesselCharteringProps {
  simulationParams: SimulationParams;
  onUpdateParams: (params: Partial<SimulationParams>) => void;
  onOpenCompareModal: (vessels: Vessel[]) => void;
}

export const VesselChartering: React.FC<VesselCharteringProps> = ({
  simulationParams,
  onUpdateParams,
  onOpenCompareModal,
}) => {
  // Mode switcher between Screenshot 3 (Class View) and Screenshot 4 (Detailed Vessel View)
  const [viewMode, setViewMode] = useState<'classView' | 'detailedView'>('classView');

  const [backendEval, setBackendEval] = useState<CharteringEvaluationResponse | null>(null);
  const [loadingEval, setLoadingEval] = useState(false);

  // Form Filters
  const [commodity, setCommodity] = useState('Iron Ore');
  const [cargoQty, setCargoQty] = useState(150000);
  const [loadingPort, setLoadingPort] = useState('Port Hedland (Australia)');
  const [dischargePort, setDischargePort] = useState('Paradip (India)');
  const [laycanWindow, setLaycanWindow] = useState('10 Feb 2026 – 25 Feb 2026');
  const [maxDraft, setMaxDraft] = useState('15.0');
  const [priority, setPriority] = useState('Lowest Total Cost');

  // Selected row in Class View
  const [selectedClass, setSelectedClass] = useState('Panamax');

  // Selected vessel in Detailed View
  const [selectedVesselId, setSelectedVesselId] = useState('vessel_1');

  const originMap: Record<string, string> = {
    'Port Hedland (Australia)': 'port_hedland',
    'Newcastle (Australia)': 'newcastle',
  };
  const destMap: Record<string, string> = {
    'Paradip (India)': 'paradip',
    'Visakhapatnam (India)': 'vizag_outer',
    'Dhamra (India)': 'dhamra',
  };
  const commodityMap: Record<string, string> = {
    'Iron Ore': 'iron_ore',
    'Coking Coal': 'coking_coal',
    'Thermal Coal': 'thermal_coal',
  };

  const handleSearchVessels = () => {
    setLoadingEval(true);
    const originPortId = originMap[loadingPort] || 'port_hedland';
    const destPortId = destMap[dischargePort] || 'paradip';
    const commodityId = commodityMap[commodity] || 'iron_ore';

    naviApi.evaluateChartering({
      originPortId,
      destPortId,
      commodityId,
      cargoQuantityMT: cargoQty,
      bunkerPriceUSD: simulationParams.bunkerPricePerMT,
      congestionDays: simulationParams.portCongestionDays,
      marketVolatilityShock: simulationParams.marketVolatilityShock,
    }).then((res) => {
      if (res) setBackendEval(res);
      setLoadingEval(false);
    }).catch(() => {
      setLoadingEval(false);
    });
  };

  useEffect(() => {
    handleSearchVessels();
  }, [loadingPort, dischargePort, commodity]);

  // Detailed vessels dataset matching Screenshot 4
  const detailedVessels = [
    {
      id: 'vessel_1',
      name: 'MV Ocean Star',
      vesselClass: 'Supramax',
      dwt: 56000,
      draft: 12.5,
      freightCostRange: '$ 28 – 32',
      arrivalWindow: '18 Jun – 22 Jun',
      score: 82,
      scoreColor: 'text-emerald-600 border-emerald-500',
      status: 'Available',
      statusBadge: 'bg-emerald-100 text-emerald-800',
      loa: 190,
      beam: 32.2,
      charterType: 'Time Charter / Voyage Charter',
    },
    {
      id: 'vessel_2',
      name: 'MV Blue Horizon',
      vesselClass: 'Panamax',
      dwt: 76000,
      draft: 14.8,
      freightCostRange: '$ 32 – 36',
      arrivalWindow: '20 Jun – 26 Jun',
      score: 91,
      scoreColor: 'text-emerald-600 border-emerald-600',
      status: 'Best Match',
      statusBadge: 'bg-emerald-600 text-white font-bold',
      loa: 229,
      beam: 32.2,
      charterType: 'Time Charter / Voyage Charter',
    },
    {
      id: 'vessel_3',
      name: 'MV Iron Leader',
      vesselClass: 'Capesize',
      dwt: 180000,
      draft: 17.2,
      freightCostRange: '$ 38 – 44',
      arrivalWindow: '24 Jun – 30 Jun',
      score: 74,
      scoreColor: 'text-amber-500 border-amber-500',
      status: 'Limited',
      statusBadge: 'bg-amber-100 text-amber-800',
      loa: 289,
      beam: 45.0,
      charterType: 'Voyage Charter (Subject to Port)',
    },
    {
      id: 'vessel_4',
      name: 'MV Global Trader',
      vesselClass: 'Handysize',
      dwt: 32000,
      draft: 10.6,
      freightCostRange: '$ 26 – 30',
      arrivalWindow: '16 Jun – 21 Jun',
      score: 68,
      scoreColor: 'text-rose-500 border-rose-500',
      status: 'Not Suitable',
      statusBadge: 'bg-rose-100 text-rose-800',
      loa: 178,
      beam: 28.0,
      charterType: 'Time Charter',
    },
  ];

  const activeDetailedVessel = detailedVessels.find(v => v.id === selectedVesselId) || detailedVessels[1];

  return (
    <div className="space-y-6">
      {/* View Switcher Bar (Allows seamlessly switching between Screenshot 3 and Screenshot 4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 px-2">Prototype View:</span>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('classView')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'classView'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Class Comparison View (Image 3)
            </button>
            <button
              onClick={() => setViewMode('detailedView')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'detailedView'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vessel Comparison Detail View (Image 4)
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Sample Data • Conceptual Prototype</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: Class-Level Comparison View (Image 3: NaviFreight_Vessel_Chartering.png) */}
      {/* ========================================================================= */}
      {viewMode === 'classView' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Filter Criteria Row (Matches Screenshot 3) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Commodity</label>
                <select
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800"
                >
                  <option value="Iron Ore">Iron Ore</option>
                  <option value="Coking Coal">Coking Coal</option>
                  <option value="Thermal Coal">Thermal Coal</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cargo Quantity (tons)</label>
                <input
                  type="text"
                  value={cargoQty.toLocaleString()}
                  onChange={(e) => setCargoQty(Number(e.target.value.replace(/,/g, '')) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Loading Port (Origin)</label>
                <select
                  value={loadingPort}
                  onChange={(e) => setLoadingPort(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800"
                >
                  <option value="Port Hedland (Australia)">Port Hedland (Australia)</option>
                  <option value="Newcastle (Australia)">Newcastle (Australia)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Discharge Port (Destination)</label>
                <select
                  value={dischargePort}
                  onChange={(e) => setDischargePort(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800"
                >
                  <option value="Paradip (India)">Paradip (India)</option>
                  <option value="Visakhapatnam (India)">Visakhapatnam (India)</option>
                  <option value="Dhamra (India)">Dhamra (India)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Laycan Window</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{laycanWindow}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Max Draft at Discharge Port (m)</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 font-mono">
                  ≈ {maxDraft}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800"
                >
                  <option value="Lowest Total Cost">Lowest Total Cost</option>
                  <option value="Highest Feasibility">Highest Feasibility</option>
                  <option value="Fastest Delivery">Fastest Delivery</option>
                </select>
              </div>

                <button
                  type="button"
                  onClick={handleSearchVessels}
                  className="w-full bg-[#0d2a4a] hover:bg-[#12365e] text-white font-bold rounded-lg py-2.5 px-4 text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {loadingEval ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>{loadingEval ? 'Evaluating...' : 'Search Vessels'}</span>
                </button>
            </div>
          </div>

          {/* Available Vessels Table + Vessel Comparison (Screenshot 3 Middle) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Available Vessels Table (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <div className="mb-3">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Available Vessels</h3>
                <p className="text-xs text-slate-500">Based on current market availability and provided constraints</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                      <th className="py-2.5 px-2 w-8"></th>
                      <th className="py-2.5 px-3">Vessel Class</th>
                      <th className="py-2.5 px-3">Capacity (DWT)</th>
                      <th className="py-2.5 px-1 text-center" colSpan={3}>
                        Typical Dimensions (m)
                        <div className="flex justify-around text-[9.5px] text-slate-400 font-normal">
                          <span>LOA</span>
                          <span>Beam</span>
                          <span>Draft</span>
                        </div>
                      </th>
                      <th className="py-2.5 px-3">Est. Freight (USD/ton)</th>
                      <th className="py-2.5 px-3">Est. Voyage Cost</th>
                      <th className="py-2.5 px-3">Arrival Window</th>
                      <th className="py-2.5 px-3 text-right">Suitability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Handysize */}
                    <tr
                      onClick={() => setSelectedClass('Handysize')}
                      className={`cursor-pointer transition-colors ${selectedClass === 'Handysize' ? 'bg-blue-50/40' : 'hover:bg-slate-50'}`}
                    >
                      <td className="py-3 px-2 text-center">
                        <input
                          type="radio"
                          name="vClass"
                          checked={selectedClass === 'Handysize'}
                          onChange={() => setSelectedClass('Handysize')}
                          className="text-blue-600"
                        />
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">Handysize</td>
                      <td className="py-3 px-3 font-mono text-slate-600">10,000 – 40,000</td>
                      <td className="py-3 px-1 text-center font-mono text-slate-600">180</td>
                      <td className="py-3 px-1 text-center font-mono text-slate-600">28</td>
                      <td className="py-3 px-1 text-center font-mono text-slate-600">10–12</td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-800">$ 32 – 38</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">$ 4.8 M</td>
                      <td className="py-3 px-3 text-slate-600 text-[11px]">8 – 10 Mar 2026</td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700">
                          Not Suitable
                        </span>
                      </td>
                    </tr>

                    {/* Supramax */}
                    <tr
                      onClick={() => setSelectedClass('Supramax')}
                      className={`cursor-pointer transition-colors ${selectedClass === 'Supramax' ? 'bg-blue-50/40' : 'hover:bg-slate-50'}`}
                    >
                      <td className="py-3 px-2 text-center">
                        <input
                          type="radio"
                          name="vClass"
                          checked={selectedClass === 'Supramax'}
                          onChange={() => setSelectedClass('Supramax')}
                          className="text-blue-600"
                        />
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">Supramax</td>
                      <td className="py-3 px-3 font-mono text-slate-600">40,000 – 60,000</td>
                      <td className="py-3 px-1 text-center font-mono text-slate-600">190</td>
                      <td className="py-3 px-1 text-center font-mono text-slate-600">32</td>
                      <td className="py-3 px-1 text-center font-mono text-slate-600">12–14</td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-800">$ 28 – 34</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">$ 4.5 M</td>
                      <td className="py-3 px-3 text-slate-600 text-[11px]">12 – 16 Mar 2026</td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700">
                          Conditional
                        </span>
                      </td>
                    </tr>

                    {/* Panamax (Selected) */}
                    <tr
                      onClick={() => setSelectedClass('Panamax')}
                      className="cursor-pointer bg-emerald-50/50 border-l-3 border-l-emerald-600 transition-colors"
                    >
                      <td className="py-3 px-2 text-center">
                        <input
                          type="radio"
                          name="vClass"
                          checked={selectedClass === 'Panamax'}
                          onChange={() => setSelectedClass('Panamax')}
                          className="text-emerald-600 accent-emerald-600"
                        />
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-1">
                        <span>Panamax</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">60,000 – 85,000</td>
                      <td className="py-3 px-1 text-center font-mono font-semibold text-slate-800">225</td>
                      <td className="py-3 px-1 text-center font-mono font-semibold text-slate-800">32</td>
                      <td className="py-3 px-1 text-center font-mono font-semibold text-slate-800">14–15</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-800">$ 24 – 30</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-900">$ 4.2 M</td>
                      <td className="py-3 px-3 font-mono text-slate-800 font-semibold text-[11px]">15 – 18 Mar 2026</td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-200 text-emerald-900 border border-emerald-300">
                          Most Suitable
                        </span>
                      </td>
                    </tr>

                    {/* Capesize */}
                    <tr
                      onClick={() => setSelectedClass('Capesize')}
                      className={`cursor-pointer transition-colors ${selectedClass === 'Capesize' ? 'bg-blue-50/40' : 'hover:bg-slate-50'}`}
                    >
                      <td className="py-3 px-2 text-center">
                        <input
                          type="radio"
                          name="vClass"
                          checked={selectedClass === 'Capesize'}
                          onChange={() => setSelectedClass('Capesize')}
                          className="text-blue-600"
                        />
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">Capesize</td>
                      <td className="py-3 px-3 font-mono text-slate-600">100,000 – 180,000</td>
                      <td className="py-3 px-1 text-center font-mono text-slate-600">292</td>
                      <td className="py-3 px-1 text-center font-mono text-slate-600">45</td>
                      <td className="py-3 px-1 text-center font-mono text-slate-600">18–20</td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-800">$ 22 – 28</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">$ 4.1 M</td>
                      <td className="py-3 px-3 text-slate-600 text-[11px]">18 – 22 Mar 2026</td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700">
                          Subject to Port
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Vessel Comparison Radar / Bars (5 cols) (Matches Screenshot 3) */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Vessel Comparison</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Compare by:</span>
                    <select className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold text-slate-700">
                      <option>Suitability Score</option>
                      <option>Cost Efficiency</option>
                    </select>
                  </div>
                </div>

                {/* 3 Vessel Class Cards Side by Side */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {/* Supramax */}
                  <div className="border border-slate-200 rounded-lg p-2.5 text-center bg-slate-50/50">
                    <div className="font-bold text-xs text-slate-800">Supramax</div>
                    <div className="text-[10px] text-slate-500 font-mono">50,000 DWT</div>
                    <div className="text-[10px] text-slate-400">Draft: 12-14 m</div>
                  </div>

                  {/* Panamax (Highlighted) */}
                  <div className="border-2 border-emerald-500 rounded-lg p-2.5 text-center bg-emerald-50/40 relative shadow-xs">
                    <div className="font-bold text-xs text-emerald-800">Panamax</div>
                    <div className="text-[10px] text-emerald-700 font-mono font-bold">75,000 DWT</div>
                    <div className="text-[10px] text-emerald-600">Draft: 14-15 m</div>
                  </div>

                  {/* Capesize */}
                  <div className="border border-slate-200 rounded-lg p-2.5 text-center bg-slate-50/50">
                    <div className="font-bold text-xs text-slate-800">Capesize</div>
                    <div className="text-[10px] text-slate-500 font-mono">150,000 DWT</div>
                    <div className="text-[10px] text-slate-400">Draft: 18-20 m</div>
                  </div>
                </div>

                {/* 4 Comparison Attribute Bars */}
                <div className="space-y-3 text-xs">
                  {/* Port Compatibility */}
                  <div>
                    <span className="text-slate-600 font-medium text-[11px] block mb-1">Port Compatibility</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-2 rounded bg-slate-200 overflow-hidden">
                        <div className="bg-slate-500 h-full" style={{ width: '70%' }}></div>
                      </div>
                      <div className="h-2 rounded bg-emerald-100 overflow-hidden">
                        <div className="bg-emerald-600 h-full" style={{ width: '90%' }}></div>
                      </div>
                      <div className="h-2 rounded bg-slate-200 overflow-hidden">
                        <div className="bg-slate-400 h-full" style={{ width: '40%' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Cargo Suitability */}
                  <div>
                    <span className="text-slate-600 font-medium text-[11px] block mb-1">Cargo Suitability</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-2 rounded bg-slate-200 overflow-hidden">
                        <div className="bg-slate-500 h-full" style={{ width: '80%' }}></div>
                      </div>
                      <div className="h-2 rounded bg-emerald-100 overflow-hidden">
                        <div className="bg-emerald-600 h-full" style={{ width: '90%' }}></div>
                      </div>
                      <div className="h-2 rounded bg-slate-200 overflow-hidden">
                        <div className="bg-slate-500 h-full" style={{ width: '95%' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Estimated Cost */}
                  <div>
                    <span className="text-slate-600 font-medium text-[11px] block mb-1">Estimated Cost</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-2 rounded bg-slate-200 overflow-hidden">
                        <div className="bg-slate-500 h-full" style={{ width: '65%' }}></div>
                      </div>
                      <div className="h-2 rounded bg-emerald-100 overflow-hidden">
                        <div className="bg-emerald-600 h-full" style={{ width: '85%' }}></div>
                      </div>
                      <div className="h-2 rounded bg-slate-200 overflow-hidden">
                        <div className="bg-slate-500 h-full" style={{ width: '90%' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Availability */}
                  <div>
                    <span className="text-slate-600 font-medium text-[11px] block mb-1">Availability</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-2 rounded bg-slate-200 overflow-hidden">
                        <div className="bg-slate-500 h-full" style={{ width: '75%' }}></div>
                      </div>
                      <div className="h-2 rounded bg-emerald-100 overflow-hidden">
                        <div className="bg-emerald-600 h-full" style={{ width: '80%' }}></div>
                      </div>
                      <div className="h-2 rounded bg-slate-200 overflow-hidden">
                        <div className="bg-slate-400 h-full" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom 3 Cards: Shipping Route + Key Port Constraints + Recommended Option (Screenshot 3 Bottom) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Shipping Route Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-2.5">Shipping Route</h4>
                <div className="rounded-xl relative overflow-hidden h-32 border border-slate-800 shadow-inner bg-slate-950 flex flex-col justify-between p-2.5">
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-75"
                    style={{
                      backgroundImage: `url('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/8/12')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/70" />

                  <div className="relative z-10 flex items-center justify-between text-[10px]">
                    <span className="font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      SATELLITE CORRIDOR
                    </span>
                    <span className="text-cyan-300 font-mono text-[9px] font-semibold">
                      Via Lombok Strait
                    </span>
                  </div>

                  <div className="relative z-10 flex items-center justify-between gap-1.5 px-0.5">
                    <div className="bg-slate-900/90 border border-cyan-500/40 px-2 py-1 rounded text-[10px] text-white">
                      <span className="text-[8px] text-cyan-400 block font-semibold">ORIGIN</span>
                      <span className="font-bold">Port Hedland</span>
                    </div>

                    <div className="flex-1 flex flex-col items-center">
                      <span className="text-[9px] text-cyan-300 font-mono font-bold">~4,650 nm</span>
                      <div className="w-full flex items-center gap-1 my-0.5">
                        <div className="h-0.5 flex-1 bg-cyan-500/40"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></div>
                        <div className="h-0.5 flex-1 bg-cyan-500/40"></div>
                      </div>
                      <span className="text-[8px] text-slate-300">14–18 Days</span>
                    </div>

                    <div className="bg-slate-900/90 border border-emerald-500/40 px-2 py-1 rounded text-[10px] text-white">
                      <span className="text-[8px] text-emerald-400 block font-semibold">DEST</span>
                      <span className="font-bold">Paradip Port</span>
                    </div>
                  </div>

                  <div className="relative z-10 flex items-center justify-between text-[9px] text-slate-300">
                    <span>14.5m Draft Permissible</span>
                    <span className="text-cyan-300 font-semibold">Deepwater Approach</span>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Distance (approx.)</span>
                    <span className="font-bold font-mono text-slate-800">4,500 – 5,000 nm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Voyage Time</span>
                    <span className="font-bold font-mono text-slate-800">14 – 18 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Major Route</span>
                    <span className="font-medium text-slate-800">Australia → East Coast India</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Port Constraints Card (Paradip) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-2">Key Port Constraints ({backendEval?.port?.name || dischargePort})</h4>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Max Draft</span>
                    <span className="font-bold font-mono text-slate-900">{backendEval?.port ? `${backendEval.port.max_draft_meters} m` : '14.5 m'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Max LOA</span>
                    <span className="font-bold font-mono text-slate-900">{backendEval?.port ? `${backendEval.port.max_loa_meters} m` : '300 m'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Max Beam</span>
                    <span className="font-bold font-mono text-slate-900">{backendEval?.port ? `${backendEval.port.max_beam_meters} m` : '50 m'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Berth Availability</span>
                    <span className="text-slate-700">{backendEval?.port ? `${backendEval.port.berth_count} Active Berths (${backendEval.port.congestion_status})` : 'Limited (vessel dependent)'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Cargo Handling Rate</span>
                    <span className="font-mono text-slate-800">{backendEval?.port ? `${backendEval.port.handling_rate_tpd.toLocaleString()} tons/day` : '20,000 – 25,000 tons/day'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Suitable Vessel Types</span>
                    <span className="font-bold text-emerald-700">{backendEval?.bestMatch?.vessel?.vesselClass || 'Supramax / Panamax'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Option Card (Screenshot 3) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Recommended Option</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Recommended
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900">
                  {backendEval?.bestMatch ? `${backendEval.bestMatch.vessel.name} (${backendEval.bestMatch.vessel.vesselClass})` : 'Panamax'}
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 mt-2">
                  <div className="flex justify-between">
                    <span>Capacity:</span>
                    <span className="font-bold font-mono text-slate-900">{backendEval?.bestMatch ? `${backendEval.bestMatch.vessel.dwt.toLocaleString()} DWT` : '60,000 – 85,000 DWT'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Freight Rate:</span>
                    <span className="font-bold font-mono text-emerald-700">{backendEval?.bestMatch ? `$ ${backendEval.bestMatch.estFreightRateUSD.toFixed(2)} / ton` : '$ 24 – 30 / ton'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Total Cost:</span>
                    <span className="font-bold font-mono text-slate-900">{backendEval?.bestMatch ? `$ ${(backendEval.bestMatch.estFreightRateUSD * cargoQty / 1e6).toFixed(2)} Million` : '$ 4.2 Million'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Arrival:</span>
                    <span className="font-bold text-slate-800">{backendEval?.bestMatch?.arrivalWindow || '15 – 18 Mar 2026'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setViewMode('detailedView')}
                className="w-full mt-4 bg-[#0d2a4a] hover:bg-[#12365e] text-white font-bold rounded-lg py-2.5 px-3 text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <span>View Detailed Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: Detailed Vessel Comparison (Image 4: NaviFreight_Vessel_Comparison_Detail.png) */}
      {/* ========================================================================= */}
      {viewMode === 'detailedView' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Filter Bar (Screenshot 4) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cargo Quantity (tonnes)</label>
                <input
                  type="text"
                  value="100,000"
                  readOnly
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Loading Port</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800">
                  <option>Port Hedland (Australia)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Discharge Port</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800">
                  <option>Paradip (India)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Laycan Window</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>10 Jun 2025 – 25 Jun 2025</span>
                </div>
              </div>

              <div>
                <button
                  className="w-full bg-[#0d2a4a] hover:bg-[#12365e] text-white font-bold rounded-lg py-2.5 px-4 text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content: Left Available Vessels Table + Right Detail Audit Panel (Screenshot 4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Available Vessels Table (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Ship className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Available Vessels <span className="font-normal text-xs text-slate-500">(Filtered Results)</span>
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">Showing 4 of 18 vessels</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                        <th className="py-2.5 px-3">Vessel Name</th>
                        <th className="py-2.5 px-3">Vessel Class</th>
                        <th className="py-2.5 px-3">DWT (tonnes)</th>
                        <th className="py-2.5 px-3">Draft (m)</th>
                        <th className="py-2.5 px-3">Est. Freight Cost (USD/ton)</th>
                        <th className="py-2.5 px-3">Arrival Window</th>
                        <th className="py-2.5 px-3 text-center">Suitability Score</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                        <th className="py-2.5 px-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailedVessels.map((v) => {
                        const isSelected = v.id === selectedVesselId;
                        return (
                          <tr
                            key={v.id}
                            onClick={() => setSelectedVesselId(v.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-50/70 border-l-3 border-l-blue-600'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-3 px-3 font-bold text-slate-900">
                              {v.name}
                            </td>
                            <td className="py-3 px-3 text-slate-600 font-medium">
                              {v.vesselClass}
                            </td>
                            <td className="py-3 px-3 font-mono font-medium text-slate-800">
                              {v.dwt.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-700">
                              {v.draft}
                            </td>
                            <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                              {v.freightCostRange}
                            </td>
                            <td className="py-3 px-3 text-slate-600 text-[11px]">
                              {v.arrivalWindow}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {/* Circular Score Ring Gauge (Screenshot 4) */}
                              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-emerald-500 font-bold font-mono text-xs text-slate-900">
                                {v.score}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold ${v.statusBadge}`}>
                                {v.status}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-slate-400">
                              <ChevronRight className="w-4 h-4" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Row in Left Section: Recommended Route + Why This Matters? (Screenshot 4) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Recommended Route Map & Specs (8 cols) */}
                <div className="md:col-span-8 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs sm:text-sm mb-2.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Recommended Route</span>
                  </div>

                  <div className="rounded-xl relative overflow-hidden h-32 border border-slate-800 shadow-inner bg-slate-950 flex flex-col justify-between p-3 mb-3">
                    <div 
                      className="absolute inset-0 bg-cover bg-center opacity-75"
                      style={{
                        backgroundImage: `url('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/8/12')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/70" />

                    <div className="relative z-10 flex items-center justify-between text-[10px]">
                      <span className="font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        OPTIMAL SATELLITE TRACK
                      </span>
                      <span className="text-cyan-300 font-mono text-[10px] font-semibold">
                        Lombok Strait Deepwater Channel
                      </span>
                    </div>

                    <div className="relative z-10 flex items-center justify-between gap-2 px-1">
                      <div className="bg-slate-900/90 border border-cyan-500/40 px-2.5 py-1.5 rounded-lg text-[11px] text-white">
                        <span className="text-[9px] text-cyan-400 block font-semibold">ORIGIN</span>
                        <span className="font-bold">Port Hedland (WA)</span>
                      </div>

                      <div className="flex-1 flex flex-col items-center">
                        <span className="text-[10px] text-cyan-300 font-mono font-bold">~ 4,650 nm</span>
                        <div className="w-full flex items-center gap-1 my-0.5">
                          <div className="h-0.5 flex-1 bg-cyan-500/40"></div>
                          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
                          <div className="h-0.5 flex-1 bg-cyan-500/40"></div>
                        </div>
                        <span className="text-[9px] text-slate-300">14.8 – 16.5 Days</span>
                      </div>

                      <div className="bg-slate-900/90 border border-emerald-500/40 px-2.5 py-1.5 rounded-lg text-[11px] text-white">
                        <span className="text-[9px] text-emerald-400 block font-semibold">DESTINATION</span>
                        <span className="font-bold">Paradip Port (India)</span>
                      </div>
                    </div>

                    <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-300">
                      <span>Under Keel Clearance: 2.1m (Safe)</span>
                      <span className="text-emerald-400 font-semibold font-mono">100% Port Feasibility</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Distance (approx.)</span>
                      <span className="font-bold font-mono text-slate-800">5,800 nm</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Estimated Voyage Time</span>
                      <span className="font-bold font-mono text-slate-800">18 – 22 days</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Primary Cargo</span>
                      <span className="font-bold text-slate-800">Iron Ore / Coal</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Recommended Vessel Class</span>
                      <span className="font-bold text-emerald-700">Panamax</span>
                    </div>
                  </div>
                </div>

                {/* Why This Matters? Card (4 cols) */}
                <div className="md:col-span-4 bg-[#f0f9ff] border border-blue-200/80 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-blue-900 text-xs mb-2">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                      <span>Why This Matters?</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Choosing the right vessel at the right time reduces freight costs, avoids port congestion and ensures timely delivery of raw materials to support India's steel production.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Detailed Audit Panel (4 cols) (Exact Replica of Screenshot 4) */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{activeDetailedVessel.name}</h3>
                  <div className="text-xs text-slate-500">
                    {activeDetailedVessel.vesselClass} | {activeDetailedVessel.dwt.toLocaleString()} DWT
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-600 text-white shadow-2xs">
                  {activeDetailedVessel.status}
                </span>
              </div>

              {/* Photorealistic Maritime Bulk Carrier Technical Profile Card */}
              <div className="rounded-xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 h-44 relative p-4 flex flex-col justify-between shadow-md">
                {/* Background Blueprint Grid */}
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Top Badge: AIS Telemetry & Class */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-mono text-[11px] font-bold text-cyan-300">
                      IMO 9642817 • CALLSIGN 9V8432
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    FLAG: PANAMA
                  </span>
                </div>

                {/* Center Ship Technical Profile Blueprint */}
                <div className="relative z-10 flex items-center justify-center py-2">
                  <div className="w-full max-w-[340px] bg-slate-950/80 border border-cyan-500/30 rounded-lg p-2.5 backdrop-blur-md">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 pb-1.5 border-b border-slate-800">
                      <span className="text-cyan-400 font-bold">{activeDetailedVessel.name.toUpperCase()}</span>
                      <span className="text-emerald-400 font-bold">{activeDetailedVessel.vesselClass} (GEARED)</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 text-[10px]">
                      <div>
                        <span className="text-slate-500 block">DRAFT (LADEN)</span>
                        <span className="font-bold text-white font-mono">{activeDetailedVessel.draft} m</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">LOA / BEAM</span>
                        <span className="font-bold text-white font-mono">{activeDetailedVessel.loa}m / {activeDetailedVessel.beam}m</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">SPEED / CONSUMPTION</span>
                        <span className="font-bold text-cyan-300 font-mono">13.5 kts / 28 MT</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Status Bar */}
                <div className="relative z-10 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    100% Paradip East Coast Constraint Cleared
                  </span>
                  <span className="font-mono text-slate-300">
                    Eco-Design VLSFO
                  </span>
                </div>
              </div>

              {/* Key Specifications (Screenshot 4) */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                  Key Specifications
                </h4>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Deadweight (DWT)</span>
                    <span className="font-bold font-mono text-slate-900">{activeDetailedVessel.dwt.toLocaleString()} tonnes</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Length Overall (LOA)</span>
                    <span className="font-bold font-mono text-slate-900">{activeDetailedVessel.loa} m</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Beam</span>
                    <span className="font-bold font-mono text-slate-900">{activeDetailedVessel.beam} m</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Draft (max)</span>
                    <span className="font-bold font-mono text-slate-900">{activeDetailedVessel.draft} m</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Charter Type</span>
                    <span className="font-medium text-slate-800">{activeDetailedVessel.charterType}</span>
                  </div>
                </div>
              </div>

              {/* Suitability Comparison Horizontal Bars (Screenshot 4) */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                  Suitability Comparison
                </h4>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-medium text-slate-600">Supramax</span>
                      <span className="font-bold font-mono text-slate-800">82%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-teal-500" style={{ width: '82%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-bold text-emerald-800">Panamax</span>
                      <span className="font-bold font-mono text-emerald-800">91%</span>
                    </div>
                    <div className="h-2 rounded-full bg-emerald-100 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-600" style={{ width: '91%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-medium text-slate-600">Capesize</span>
                      <span className="font-bold font-mono text-slate-800">74%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: '74%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-medium text-slate-600">Handysize</span>
                      <span className="font-bold font-mono text-slate-800">68%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-orange-500" style={{ width: '68%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
