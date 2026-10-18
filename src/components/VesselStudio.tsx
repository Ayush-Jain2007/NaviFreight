import React, { useState } from 'react';
import { VesselStudio3D, Vessel3DType, VesselSizeType } from './VesselStudio3D';
import { VESSELS_DATABASE, PORTS_DATABASE } from '../data/maritimeData';
import { SimulationParams } from '../types';
import { 
  Ship, 
  Scale, 
  Box, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  Anchor
} from 'lucide-react';

interface VesselStudioProps {
  simulationParams: SimulationParams;
  onUpdateParams?: (params: Partial<SimulationParams>) => void;
  onNavigateTab?: (tab: string) => void;
}

export const VesselStudio: React.FC<VesselStudioProps> = ({
  simulationParams,
  onUpdateParams,
  onNavigateTab,
}) => {
  const [selectedVesselId, setSelectedVesselId] = useState<string>('vessel_2'); // Default: MV Blue Horizon (Panamax)
  const [cargoLoadPercent, setCargoLoadPercent] = useState<number>(100);
  const [selectedDestPortId, setSelectedDestPortId] = useState<string>(simulationParams.destPortId || 'paradip');
  const [showEngineeringDossier, setShowEngineeringDossier] = useState<boolean>(true);

  const activeVessel = VESSELS_DATABASE.find(v => v.id === selectedVesselId) || VESSELS_DATABASE[1];
  const destPort = PORTS_DATABASE.find(p => p.id === selectedDestPortId) || PORTS_DATABASE[0];

  const get3DTypeFromClass = (vClass: string): Vessel3DType => {
    if (vClass.toLowerCase().includes('tanker')) return 'oil_tanker';
    if (vClass.toLowerCase().includes('container')) return 'container_ship';
    return 'bulk_carrier';
  };

  const getSizeFromClass = (vClass: string): VesselSizeType => {
    const lower = vClass.toLowerCase();
    if (lower.includes('cape')) return 'capesize';
    if (lower.includes('supra') || lower.includes('handy')) return 'supramax';
    return 'panamax';
  };

  const [active3DType, setActive3DType] = useState<Vessel3DType>(get3DTypeFromClass(activeVessel.vesselClass));
  const [activeSize, setActiveSize] = useState<VesselSizeType>(getSizeFromClass(activeVessel.vesselClass));

  const handleStudioVesselChange = (type: Vessel3DType, size: VesselSizeType) => {
    setActive3DType(type);
    setActiveSize(size);

    // Sync corresponding vessel from database if matching
    if (type === 'bulk_carrier') {
      if (size === 'panamax') setSelectedVesselId('vessel_2');
      else if (size === 'capesize') setSelectedVesselId('vessel_3');
      else setSelectedVesselId('vessel_6');
    } else if (type === 'container_ship') {
      setSelectedVesselId('vessel_4');
    } else {
      setSelectedVesselId('vessel_1');
    }
  };

  const currentDraft = (
    activeVessel.draftMeters * 0.58 + 
    (cargoLoadPercent / 100) * (activeVessel.draftMeters * 0.42)
  );

  const ukcClearance = destPort.maxDraftMeters - currentDraft;
  const isDraftFeasible = ukcClearance >= 0.5;

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. PHOTOREALISTIC 3D VESSEL DIGITAL TWIN STUDIO (Exact Photograph Layout) */}
      {/* ========================================================================= */}
      <VesselStudio3D
        initialVesselType={active3DType}
        initialSize={activeSize}
        initialEnvMode="ocean"
        initialCargoLoad={cargoLoadPercent}
        initialDestPortName={destPort.name}
        initialPortDraftLimit={destPort.maxDraftMeters}
        onVesselChange={handleStudioVesselChange}
        onCargoLoadChange={setCargoLoadPercent}
      />

      {/* ========================================================================= */}
      {/* 2. SUPPLEMENTARY ENGINEERING DOSSIER & PORT FEASIBILITY (Collapsible)   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
        {/* Toggle Bar */}
        <div 
          onClick={() => setShowEngineeringDossier(!showEngineeringDossier)}
          className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 cursor-pointer border-b border-slate-200 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Naval Architecture Profile &amp; Port Draft Clearance Feasibility
              </h3>
              <p className="text-[11px] text-slate-500">
                Authoritative hydrodynamic envelope vs. Indian East &amp; West coast draft constraints
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-800">
              {showEngineeringDossier ? 'Hide Dossier' : 'Show Dossier'}
            </span>
            {showEngineeringDossier ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </div>
        </div>

        {showEngineeringDossier && (
          <div className="p-5 space-y-6 animate-fadeIn">
            {/* Top Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Length Overall</span>
                <span className="text-base font-black text-slate-900 font-mono">{activeVessel.lengthMeters} m</span>
                <span className="text-[10px] text-slate-500 block">Per AIS Record</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Beam (Width)</span>
                <span className="text-base font-black text-slate-900 font-mono">{activeVessel.beamMeters} m</span>
                <span className="text-[10px] text-slate-500 block">Panamax Limit 32.3m</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Scantling Draft</span>
                <span className="text-base font-black text-amber-600 font-mono">{currentDraft.toFixed(2)} m</span>
                <span className="text-[10px] text-slate-500 block">{cargoLoadPercent}% Laden</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Deadweight (DWT)</span>
                <span className="text-base font-black text-slate-900 font-mono">{activeVessel.dwt.toLocaleString()} t</span>
                <span className="text-[10px] text-slate-500 block">Summer Capacity</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cruising Speed</span>
                <span className="text-base font-black text-slate-900 font-mono">{activeVessel.speedKnots} kts</span>
                <span className="text-[10px] text-slate-500 block">Eco-Speed VLSFO</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Daily Bunker</span>
                <span className="text-base font-black text-slate-900 font-mono">{activeVessel.fuelConsumptionTonsPerDay} MT/d</span>
                <span className="text-[10px] text-slate-500 block">VLSFO @ Sea</span>
              </div>
            </div>

            {/* Port Feasibility Matrix against Indian Ports */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Anchor className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Under-Keel Clearance (UKC) vs. Indian Destination Ports
                  </h4>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  Current Draft: <strong className="text-slate-900">{currentDraft.toFixed(2)}m</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {PORTS_DATABASE.filter(p => p.country === 'India').slice(0, 6).map((port) => {
                  const portUkc = port.maxDraftMeters - currentDraft;
                  const isSafe = portUkc >= 1.0;
                  const isTight = portUkc >= 0 && portUkc < 1.0;
                  const isRestricted = portUkc < 0;

                  return (
                    <div 
                      key={port.id}
                      onClick={() => {
                        setSelectedDestPortId(port.id);
                        onUpdateParams?.({ destPortId: port.id });
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        selectedDestPortId === port.id
                          ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-slate-900">{port.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isSafe ? 'bg-emerald-100 text-emerald-800' :
                          isTight ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isSafe ? 'Safe Entry' : isTight ? 'Tidal Window' : 'Draft Restricted'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono pt-1 border-t border-slate-200/60">
                        <span>Max Port Draft: <strong>{port.maxDraftMeters.toFixed(1)}m</strong></span>
                        <span>
                          UKC: <strong className={portUkc >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                            {portUkc >= 0 ? `+${portUkc.toFixed(2)}m` : `${portUkc.toFixed(2)}m`}
                          </strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fleet Roster Selector */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ship className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Select Fleet Vessel Digital Twin
                  </h4>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('chartering')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Charter in Vessel Chartering</span>
                    <span>→</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {VESSELS_DATABASE.map((v) => {
                  const isSelected = v.id === selectedVesselId;
                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        setSelectedVesselId(v.id);
                        setActive3DType(get3DTypeFromClass(v.vesselClass));
                        setActiveSize(getSizeFromClass(v.vesselClass));
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-500'
                          : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900">{v.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {v.vesselClass} • {v.dwt.toLocaleString()} DWT
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isSelected ? 'Inspecting' : 'Inspect'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
