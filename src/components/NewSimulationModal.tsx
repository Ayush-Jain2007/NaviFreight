import React, { useState } from 'react';
import { Port, Commodity, SimulationParams } from '../types';
import { PORTS_DATABASE, COMMODITIES_DATABASE } from '../data/maritimeData';
import { X, Play, Ship, MapPin, Calendar, Sparkles } from 'lucide-react';

import { naviApi } from '../services/api';

interface NewSimulationModalProps {
  currentParams: SimulationParams;
  onApply: (params: SimulationParams) => void;
  onClose: () => void;
}

export const NewSimulationModal: React.FC<NewSimulationModalProps> = ({
  currentParams,
  onApply,
  onClose,
}) => {
  const [originId, setOriginId] = useState(currentParams.originPortId || 'port_hedland');
  const [destId, setDestId] = useState(currentParams.destPortId || 'paradip');
  const [commodityId, setCommodityId] = useState(currentParams.commodityId || 'iron_ore');
  const [cargoQty, setCargoQty] = useState(currentParams.cargoQuantityMT || 150000);
  const [horizon, setHorizon] = useState<30 | 60 | 90>(currentParams.horizonDays || 60);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams: SimulationParams = {
      ...currentParams,
      originPortId: originId,
      destPortId: destId,
      commodityId: commodityId,
      cargoQuantityMT: cargoQty,
      horizonDays: horizon,
    };

    // Save simulation in backend database
    naviApi.saveSimulation({
      name: `${PORTS_DATABASE.find(p => p.id === destId)?.name || 'East Coast'} Charter Plan`,
      ...newParams,
    }).catch(console.error);

    onApply(newParams);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Configure New Charter Simulation</h3>
              <p className="text-xs text-slate-400">Set route parameters and bulk procurement constraints</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          {/* Origin */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Loading Port (Overseas Origin)
            </label>
            <select
              value={originId}
              onChange={(e) => setOriginId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {PORTS_DATABASE.filter(p => !p.isIndianEastCoast).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.country}) – Max Draft: {p.maxDraftMeters}m
                </option>
              ))}
            </select>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Discharge Port (India's East Coast)
            </label>
            <select
              value={destId}
              onChange={(e) => setDestId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-cyan-300 font-medium focus:outline-none focus:border-cyan-500"
            >
              {PORTS_DATABASE.filter(p => p.isIndianEastCoast).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.region}) – Max Draft: {p.maxDraftMeters}m
                </option>
              ))}
            </select>
          </div>

          {/* Commodity & Parcel Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Commodity Type
              </label>
              <select
                value={commodityId}
                onChange={(e) => setCommodityId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {COMMODITIES_DATABASE.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Cargo Parcel Size (MT)
              </label>
              <input
                type="number"
                step="5000"
                value={cargoQty}
                onChange={(e) => setCargoQty(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Forecast Horizon */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Forecast Planning Horizon
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([30, 60, 90] as const).map((h) => (
                <button
                  type="button"
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`py-2 rounded-lg font-semibold transition-all border ${
                    horizon === h
                      ? 'bg-cyan-600 text-white border-cyan-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {h} Days
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition-all shadow-md shadow-cyan-950 flex items-center gap-1.5"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Run Simulation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
