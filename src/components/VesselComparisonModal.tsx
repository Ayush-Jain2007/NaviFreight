import React from 'react';
import { Vessel, Port, Commodity } from '../types';
import { PORTS_DATABASE, COMMODITIES_DATABASE } from '../data/maritimeData';
import { evaluateVesselSuitability, getRouteDistance } from '../utils/freightCalculator';
import { X, CheckCircle2, AlertTriangle, XCircle, Ship, Scale, Sparkles } from 'lucide-react';

interface VesselComparisonModalProps {
  vessels: Vessel[];
  destPort: Port;
  commodity: Commodity;
  cargoQuantityMT: number;
  onClose: () => void;
}

export const VesselComparisonModal: React.FC<VesselComparisonModalProps> = ({
  vessels,
  destPort,
  commodity,
  cargoQuantityMT,
  onClose,
}) => {
  if (!vessels || vessels.length === 0) return null;

  const originPort = PORTS_DATABASE[7]; // Default Port Hedland
  const distanceNM = getRouteDistance(originPort.id, destPort.id);

  const evaluations = vessels.map(v =>
    evaluateVesselSuitability(v, destPort, cargoQuantityMT, commodity, distanceNM)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <Scale className="w-4 h-4" />
              SIDE-BY-SIDE VESSEL COMPARISON DETAIL
            </div>
            <h2 className="text-xl font-bold text-white mt-0.5">
              Evaluating Fleet Options for {destPort.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Port Baseline Envelope Reminder */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-300">
              Discharge Constraints: <strong className="text-emerald-300">{destPort.name}</strong> (Max Draft: {destPort.maxDraftMeters}m | Max LOA: {destPort.maxLOAMeters}m | Max Beam: {destPort.maxBeamMeters}m)
            </span>
            <span className="text-slate-400 font-mono">
              Cargo Parcel: {cargoQuantityMT.toLocaleString()} MT {commodity.name}
            </span>
          </div>

          {/* Side-by-Side Vessel Columns */}
          <div className={`grid grid-cols-1 md:grid-cols-${Math.min(vessels.length, 3)} gap-4`}>
            {evaluations.map((ev) => {
              const isBest = ev.score === Math.max(...evaluations.map(e => e.score));

              return (
                <div
                  key={ev.vessel.id}
                  className={`bg-slate-950/80 rounded-xl p-4 border flex flex-col justify-between transition-all ${
                    isBest
                      ? 'border-cyan-500/50 shadow-xl shadow-cyan-950/40 bg-gradient-to-b from-cyan-950/20 to-slate-950/90'
                      : 'border-slate-800'
                  }`}
                >
                  <div>
                    {/* Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                        {ev.vessel.vesselClass}
                      </span>
                      {isBest && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Optimal Fit
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1">{ev.vessel.name}</h3>
                    <div className="text-xs text-slate-400 mb-4">{ev.vessel.flag} Flag • Built {ev.vessel.yearBuilt}</div>

                    {/* Suitability Score */}
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 mb-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-400">Port Feasibility:</span>
                        <span
                          className={`font-semibold ${
                            ev.status === 'Feasible'
                              ? 'text-emerald-400'
                              : ev.status === 'Conditional'
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}
                        >
                          {ev.status} ({ev.score}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            ev.status === 'Feasible' ? 'bg-emerald-500' : ev.status === 'Conditional' ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${ev.score}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Metric Rows */}
                    <div className="space-y-2.5 text-xs text-slate-300">
                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-400">Deadweight:</span>
                        <span className="font-mono font-bold text-white">{ev.vessel.dwt.toLocaleString()} DWT</span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-400">Draft vs Port:</span>
                        <span className={`font-mono font-bold ${ev.draftCheck.passes ? 'text-emerald-300' : 'text-red-400'}`}>
                          {ev.vessel.draftMeters}m ({ev.draftCheck.clearanceM >= 0 ? `+${ev.draftCheck.clearanceM}m` : `${ev.draftCheck.clearanceM}m`})
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-400">LOA × Beam:</span>
                        <span className="font-mono text-slate-200">{ev.vessel.loaMeters}m × {ev.vessel.beamMeters}m</span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-400">Est. Freight Rate:</span>
                        <span className="font-mono font-bold text-cyan-300 text-sm">
                          ${ev.estFreightRateUSD.toFixed(1)} / ton
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-400">Total Delivered Cost:</span>
                        <span className="font-mono font-bold text-white">
                          ${(ev.costBreakdown.totalCostUSD / 1000000).toFixed(2)} M
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-400">Fuel Consumption:</span>
                        <span className="font-mono text-amber-300">{ev.vessel.bunkerConsumptionSeaTPD} TPD VLSFO</span>
                      </div>

                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Arrival Window:</span>
                        <span className="font-mono text-slate-200">{ev.arrivalWindow}</span>
                      </div>
                    </div>
                  </div>

                  {/* Explainability Footnote */}
                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                    {ev.whyThisMatches}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900/95 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
