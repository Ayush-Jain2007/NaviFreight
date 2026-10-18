import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Radio, 
  Navigation, 
  RotateCcw, 
  Plus, 
  Minus, 
  AlertTriangle, 
  ChevronRight, 
  PhoneCall, 
  CheckCircle2, 
  Ship, 
  Anchor,
  Compass
} from 'lucide-react';
import { PORTS_DATABASE } from '../data/maritimeData';

export interface BayOfBengalSafetyMapProps {
  onOpenIncident?: (incidentId: string) => void;
  onNavigateTab?: (tab: string) => void;
}

type MapLayerType = 'dark' | 'ocean' | 'satellite';

export const BayOfBengalSafetyMap: React.FC<BayOfBengalSafetyMapProps> = ({
  onOpenIncident,
  onNavigateTab
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const vectorLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('dark');
  const [selectedCorridor, setSelectedCorridor] = useState<string>('all');

  // Reliable Esri High-Res Tiles (100% Free, NO API Key Required, Zero Watermark)
  const TILE_CONFIG: Record<MapLayerType, { base: string; labels: string; attribution: string }> = {
    dark: {
      base: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri, DeLorme, NAVTEQ'
    },
    ocean: {
      base: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
      labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri, GEBCO, NOAA'
    },
    satellite: {
      base: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri, Maxar, Earthstar Geographics'
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    if (mapInstanceRef.current) return;

    // Centered to encompass all Indian East & West Coast ports & Bay of Bengal
    const map = L.map(container, {
      center: [16.0, 82.0],
      zoom: 5.5,
      zoomControl: false,
      attributionControl: false,
      minZoom: 4,
      maxZoom: 14,
      zoomSnap: 0.25,
      zoomDelta: 0.5
    });

    // Base Tile Layer
    const baseTile = L.tileLayer(TILE_CONFIG[activeLayer].base, {
      maxZoom: 16,
    }).addTo(map);
    tileLayerRef.current = baseTile;

    // Labels Reference Overlay Layer
    const labelsTile = L.tileLayer(TILE_CONFIG[activeLayer].labels, {
      maxZoom: 16,
      opacity: 0.92
    }).addTo(map);
    labelsLayerRef.current = labelsTile;

    vectorLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // ResizeObserver to ensure map tiles immediately render correctly
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 120);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Base Map Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current);
    }

    const cfg = TILE_CONFIG[activeLayer];
    const newBase = L.tileLayer(cfg.base, {
      maxZoom: 16
    }).addTo(map);
    tileLayerRef.current = newBase;

    const newLabels = L.tileLayer(cfg.labels, {
      maxZoom: 16,
      opacity: 0.92
    }).addTo(map);
    labelsLayerRef.current = newLabels;

    map.invalidateSize();
  }, [activeLayer]);

  // Render Maritime Corridors, Vessels, Ports, and Geo Labels
  useEffect(() => {
    const map = mapInstanceRef.current;
    const vectors = vectorLayerRef.current;
    if (!map || !vectors) return;

    vectors.clearLayers();

    // ==========================================
    // 1. CORRIDOR ROUTES (Polylines)
    // ==========================================

    // Route A: MV Horizon / Paradip Inbound (Gold & Cyan Dashed)
    if (selectedCorridor === 'all' || selectedCorridor === 'horizon') {
      const horizonPath: [number, number][] = [
        [10.5, 91.2],
        [13.2, 88.6],
        [16.8, 87.2],
        [19.2, 86.8], // MV Horizon
        [20.2644, 86.6713] // Paradip Port
      ];

      // Gold Corridor Glow & Line
      L.polyline(horizonPath, {
        color: '#f59e0b',
        weight: 5,
        opacity: 0.25,
        lineCap: 'round'
      }).addTo(vectors);

      L.polyline(horizonPath, {
        color: '#f59e0b',
        weight: 2.2,
        opacity: 0.9,
        dashArray: '7, 5',
        lineCap: 'round'
      }).addTo(vectors);

      // Branch to deepwater Six Degree Channel
      L.polyline([[19.2, 86.8], [15.5, 85.0], [13.2, 83.8]], {
        color: '#38bdf8',
        weight: 2,
        opacity: 0.85,
        dashArray: '6, 6'
      }).addTo(vectors);
    }

    // Route B: MV Leader Distress Route (Red Glowing & Alternate Cyan)
    if (selectedCorridor === 'all' || selectedCorridor === 'leader') {
      const leaderDistressPath: [number, number][] = [
        [9.5, 93.2],
        [11.8, 89.0],
        [14.4, 84.5], // MV Leader Distress Location
        [17.6868, 83.2185] // Visakhapatnam Port
      ];

      // Red Distress Glow & Line
      L.polyline(leaderDistressPath, {
        color: '#ef4444',
        weight: 6,
        opacity: 0.35,
        lineCap: 'round'
      }).addTo(vectors);

      L.polyline(leaderDistressPath, {
        color: '#ef4444',
        weight: 2.5,
        opacity: 0.95,
        dashArray: '8, 6',
        lineCap: 'round'
      }).addTo(vectors);

      // Alternate Diversion Corridor to Chennai
      const diversionPath: [number, number][] = [
        [14.4, 84.5],
        [13.8, 82.5],
        [13.0827, 80.2707] // Chennai Port
      ];

      L.polyline(diversionPath, {
        color: '#06b6d4',
        weight: 2.2,
        opacity: 0.85,
        dashArray: '6, 6'
      }).addTo(vectors);
    }

    // Route C: MV Queen Mary / Vizag Coastal Approach (Teal/Cyan Dashed)
    if (selectedCorridor === 'all' || selectedCorridor === 'queen_mary') {
      const queenMaryPath: [number, number][] = [
        [13.5, 85.8],
        [15.8, 84.2],
        [17.2, 83.6], // MV Queen Mary
        [17.6868, 83.2185] // Visakhapatnam Harbour
      ];

      L.polyline(queenMaryPath, {
        color: '#06b6d4',
        weight: 5,
        opacity: 0.25,
        lineCap: 'round'
      }).addTo(vectors);

      L.polyline(queenMaryPath, {
        color: '#22d3ee',
        weight: 2.2,
        opacity: 0.9,
        dashArray: '6, 5',
        lineCap: 'round'
      }).addTo(vectors);
    }

    // ==========================================
    // 2. ALL LISTED PORTS (Indian East & West Coasts + Regional Hubs)
    // ==========================================
    const allListedPorts = [
      ...PORTS_DATABASE.filter(p => p.country === 'India').map(p => ({
        id: p.id,
        name: p.name
          .replace(' Port Trust', '')
          .replace(' Port', '')
          .replace(' Dock Complex', ' Dock')
          .replace(' (Syama Prasad Mookerjee Port)', '')
          .replace(' / Nhava Sheva', '')
          .replace(' / Vallarpadam', ''),
        fullName: p.name,
        region: p.region,
        lat: p.latitude,
        lng: p.longitude,
        draft: p.maxDraftMeters,
        loa: p.maxLOAMeters,
        beam: p.maxBeamMeters,
        berths: p.berthCount,
        handlingRate: p.handlingRateTPD,
        congestion: p.congestionStatus,
        isEast: p.isIndianEastCoast
      })),
      {
        id: 'port_blair',
        name: 'Port Blair (Andaman)',
        fullName: 'Port Blair Deepwater Anchorage',
        region: 'Andaman & Nicobar Islands',
        lat: 11.6667,
        lng: 92.7333,
        draft: 12.5,
        loa: 220,
        beam: 32.0,
        berths: 4,
        handlingRate: 20000,
        congestion: 'Low' as const,
        isEast: true
      },
      {
        id: 'trincomalee',
        name: 'Trincomalee',
        fullName: 'Trincomalee Deepwater Harbour',
        region: 'Sri Lanka (Refuge Port)',
        lat: 8.5874,
        lng: 81.2152,
        draft: 16.0,
        loa: 280,
        beam: 42.0,
        berths: 6,
        handlingRate: 35000,
        congestion: 'Low' as const,
        isEast: true
      },
      {
        id: 'colombo',
        name: 'Colombo',
        fullName: 'Port of Colombo',
        region: 'Sri Lanka (Western Basin)',
        lat: 6.9497,
        lng: 79.8433,
        draft: 15.5,
        loa: 350,
        beam: 48.0,
        berths: 14,
        handlingRate: 50000,
        congestion: 'Normal' as const,
        isEast: false
      }
    ];

    allListedPorts.forEach((p) => {
      const isDeepWater = p.draft >= 16.0;
      const isShallow = p.draft < 13.0;
      const dotColor = isDeepWater ? '#10b981' : isShallow ? '#f59e0b' : '#06b6d4';
      const borderColor = isDeepWater ? 'rgba(16, 185, 129, 0.7)' : isShallow ? 'rgba(245, 158, 11, 0.7)' : 'rgba(6, 182, 212, 0.6)';
      const textColor = isDeepWater ? '#6ee7b7' : isShallow ? '#fcd34d' : '#38bdf8';

      const portIcon = L.divIcon({
        className: 'port-label-pin',
        html: `
          <div style="display: flex; align-items: center; gap: 4px; transform: translate(-8px, -12px); cursor: pointer;" title="${p.fullName} (Max Draft: ${p.draft}m)">
            <div style="width: 7px; height: 7px; border-radius: 50%; background: ${dotColor}; box-shadow: 0 0 7px ${dotColor};"></div>
            <div style="
              background: rgba(6, 25, 45, 0.94);
              border: 1px solid ${borderColor};
              color: ${textColor};
              font-family: monospace;
              font-size: 9.5px;
              font-weight: 700;
              padding: 1.5px 6px;
              border-radius: 5px;
              white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.7);
            ">
              ${p.name} (${p.draft}m)
            </div>
          </div>
        `,
        iconSize: [130, 22]
      });

      const marker = L.marker([p.lat, p.lng], { icon: portIcon }).addTo(vectors);

      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 210px; padding: 4px; color: #0f172a;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 2px;">
            <strong style="font-size: 13px; color: #0f2942;">${p.fullName}</strong>
            <span style="font-size: 9px; font-weight: 700; font-family: monospace; padding: 1px 5px; border-radius: 4px; background: ${p.isEast ? '#e0f2fe; color: #0369a1;' : '#ede9fe; color: #6d28d9;'}">
              ${p.isEast ? 'EAST COAST' : 'WEST COAST'}
            </span>
          </div>
          <div style="font-size: 10.5px; color: #64748b; margin-bottom: 8px;">${p.region}</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 10.5px; border-top: 1px solid #e2e8f0; padding-top: 6px; margin-bottom: 6px;">
            <div><span style="color: #64748b;">Max Draft:</span> <strong style="color: #0284c7;">${p.draft} m</strong></div>
            <div><span style="color: #64748b;">Max LOA:</span> <strong>${p.loa || 230} m</strong></div>
            <div><span style="color: #64748b;">Active Berths:</span> <strong>${p.berths || 8}</strong></div>
            <div><span style="color: #64748b;">Handling:</span> <strong>${(p.handlingRate || 35000).toLocaleString()} t/d</strong></div>
          </div>
          <div style="padding: 4px 6px; border-radius: 5px; font-size: 10px; font-weight: 700; text-align: center; background: ${p.draft >= 17 ? '#dcfce7; color: #166534;' : p.draft >= 14 ? '#e0f2fe; color: #0369a1;' : '#fef3c7; color: #92400e;'}">
            ${p.draft >= 17 ? '✓ Deepwater Capesize Capable (>17m)' : p.draft >= 14 ? '✓ Panamax / Kamsarmax Berth (14–16m)' : '⚠ Draft Constrained (Handysize / Lighterage)'}
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);
    });

    // ==========================================
    // 3. TRACKED VESSELS WITH STATUS BADGES
    // ==========================================

    // Vessel 1: MV Horizon (Off Odisha, with Warning Badge & Amber Border)
    if (selectedCorridor === 'all' || selectedCorridor === 'horizon') {
      const horizonIcon = L.divIcon({
        className: 'vessel-marker-horizon',
        html: `
          <div style="
            display: flex; 
            align-items: center; 
            gap: 6px; 
            transform: translate(-50%, -50%);
            background: rgba(10, 20, 36, 0.94);
            border: 1.5px solid #f59e0b;
            box-shadow: 0 0 16px rgba(245, 158, 11, 0.4), 0 4px 12px rgba(0,0,0,0.8);
            border-radius: 8px;
            padding: 4px 10px;
            color: #ffffff;
            cursor: pointer;
            white-space: nowrap;
          ">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; box-shadow: 0 0 6px #f59e0b;"></div>
            <span style="font-weight: 800; font-size: 11px; letter-spacing: 0.3px;">MV Horizon</span>
            <div style="
              width: 18px; 
              height: 18px; 
              border-radius: 50%; 
              background: #ef4444; 
              border: 1.5px solid #ffffff; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              box-shadow: 0 0 8px #ef4444;
            ">
              <span style="font-size: 10px; font-weight: 900; line-height: 1;">!</span>
            </div>
          </div>
        `,
        iconSize: [140, 32]
      });

      const m = L.marker([19.2, 86.8], { icon: horizonIcon }).addTo(vectors);
      m.on('click', () => onOpenIncident?.('INC-2026-088'));
    }

    // Vessel 2: MV Queen Mary (Off Vizag, Dark Teal with Green Dot)
    if (selectedCorridor === 'all' || selectedCorridor === 'queen_mary') {
      const queenMaryIcon = L.divIcon({
        className: 'vessel-marker-queen-mary',
        html: `
          <div style="
            display: flex; 
            align-items: center; 
            gap: 6px; 
            transform: translate(-50%, -50%);
            background: rgba(4, 25, 40, 0.94);
            border: 1.5px solid #06b6d4;
            box-shadow: 0 0 14px rgba(6, 182, 212, 0.35), 0 4px 12px rgba(0,0,0,0.8);
            border-radius: 8px;
            padding: 4px 10px;
            color: #ffffff;
            cursor: pointer;
            white-space: nowrap;
          ">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 6px #10b981;"></div>
            <div style="display: flex; flex-col; line-height: 1.1;">
              <span style="font-weight: 800; font-size: 11px;">MV Queen</span>
              <span style="font-weight: 800; font-size: 11px;">Mary</span>
            </div>
          </div>
        `,
        iconSize: [130, 32]
      });

      L.marker([17.2, 83.6], { icon: queenMaryIcon }).addTo(vectors);
    }

    // Vessel 3: MV Leader (Central Bay of Bengal, Red Border with Red Beacon & Pulsating Ring)
    if (selectedCorridor === 'all' || selectedCorridor === 'leader') {
      const leaderIcon = L.divIcon({
        className: 'vessel-marker-leader',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%); cursor: pointer;">
            <!-- Radar Beacon Pulsing Ring -->
            <div style="
              position: absolute;
              width: 54px;
              height: 54px;
              border-radius: 50%;
              border: 2px solid #ef4444;
              background: rgba(239, 68, 68, 0.18);
              animation: leader-pulse 1.8s infinite;
              pointer-events: none;
            "></div>

            <!-- Vessel Identity Card -->
            <div style="
              position: relative;
              z-index: 10;
              display: flex; 
              align-items: center; 
              gap: 6px; 
              background: rgba(20, 6, 10, 0.95);
              border: 1.5px solid #ef4444;
              box-shadow: 0 0 20px rgba(239, 68, 68, 0.6), 0 4px 12px rgba(0,0,0,0.85);
              border-radius: 8px;
              padding: 4px 10px;
              color: #ffffff;
              white-space: nowrap;
            ">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: #ef4444; box-shadow: 0 0 8px #ef4444;"></div>
              <span style="font-weight: 800; font-size: 11px;">MV</span>
              <div style="
                width: 22px; 
                height: 22px; 
                border-radius: 50%; 
                background: #ef4444; 
                border: 2px solid #ffffff; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                box-shadow: 0 0 12px #ef4444;
              ">
                <span style="font-size: 12px; font-weight: 900; line-height: 1;">!</span>
              </div>
              <span style="font-weight: 800; font-size: 11px;">Leader</span>
            </div>
          </div>
        `,
        iconSize: [160, 40]
      });

      const m = L.marker([14.4, 84.5], { icon: leaderIcon }).addTo(vectors);
      m.on('click', () => onOpenIncident?.('INC-2026-092'));
    }

    // ==========================================
    // 4. GEOGRAPHIC CITY & LANDMARK LABELS
    // ==========================================
    const geoLabels = [
      { text: 'Akola', lat: 20.7002, lng: 77.0082 },
      { text: 'Bhubaneswar', lat: 20.2961, lng: 85.8245 },
      { text: 'Kashinagara', lat: 18.8000, lng: 83.9000 },
      { text: 'Warangal', lat: 17.9689, lng: 79.5941 },
      { text: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
      { text: 'Vijayawada', lat: 16.5062, lng: 80.6480 },
      { text: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
      { text: 'Bay of Bengal', lat: 14.5, lng: 89.2 }
    ];

    geoLabels.forEach((label) => {
      const isOcean = label.text === 'Bay of Bengal';
      const labelIcon = L.divIcon({
        className: 'geo-map-label',
        html: `
          <div style="
            color: ${isOcean ? 'rgba(148, 163, 184, 0.45)' : 'rgba(148, 163, 184, 0.65)'};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: ${isOcean ? '13px' : '11px'};
            font-weight: ${isOcean ? '700' : '600'};
            font-style: ${isOcean ? 'italic' : 'normal'};
            letter-spacing: ${isOcean ? '1.5px' : '0.2px'};
            pointer-events: none;
            white-space: nowrap;
            transform: translate(-50%, -50%);
            text-shadow: 0 1px 4px rgba(0,0,0,0.8);
          ">
            ${label.text}
          </div>
        `,
        iconSize: [100, 20]
      });

      L.marker([label.lat, label.lng], { icon: labelIcon }).addTo(vectors);
    });
  }, [selectedCorridor, onOpenIncident]);

  const handleResetMap = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([16.0, 82.0], 5.5, { animate: true });
  };

  const handleZoomIn = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomOut();
  };

  return (
    <div className="bg-[#050e1c] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-sans select-none flex flex-col">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR (Matches Photograph Header) */}
      {/* ========================================================================= */}
      <div className="p-4 bg-[#050e1d] border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
            Live Bay of Bengal Safety &amp; Distress Plotter
          </h2>
        </div>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab('routes')}
            className="text-cyan-400 hover:text-cyan-300 font-bold text-xs sm:text-sm flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Full Intelligence View</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. FILTER & CONTROLS TOOLBAR (Matches Photograph Toolbar) */}
      {/* ========================================================================= */}
      <div className="px-4 py-2.5 bg-[#071325] border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left: Corridor Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Navigation className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="relative flex-1 sm:w-72">
            <select
              value={selectedCorridor}
              onChange={(e) => setSelectedCorridor(e.target.value)}
              className="w-full bg-[#091a32] border border-slate-700/80 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="all">🌐 All Active Corridors (4 Tracked Vessels)</option>
              <option value="leader">🚨 MV Iron Leader (Distress / Derated)</option>
              <option value="horizon">⚠️ MV Blue Horizon (Paradip Inbound)</option>
              <option value="queen_mary">🟢 MV Queen Mary (Vizag Approach)</option>
            </select>
          </div>
        </div>

        {/* Right: Map Style Pills + Reset */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center gap-1 bg-[#091a32] p-1 rounded-xl border border-slate-800">
            {(['dark', 'ocean', 'satellite'] as MapLayerType[]).map((layer) => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  activeLayer === layer
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {layer}
              </button>
            ))}
          </div>

          <button
            onClick={handleResetMap}
            title="Reset Map View"
            className="w-8 h-8 rounded-xl bg-[#091a32] hover:bg-[#0f2444] border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shadow-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAP CANVAS & FLOATING OVERLAYS (Matches Photograph Map Area) */}
      {/* ========================================================================= */}
      <div className="relative w-full h-[420px] sm:h-[480px] lg:h-[540px] bg-[#061426] overflow-hidden">
        {/* Leaflet Map DOM Element */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Top-Right Incident Badge */}
        <div className="absolute top-4 right-4 z-10 pointer-events-none">
          <div className="bg-[#071527]/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold text-white">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>4 Tracked • 26 Listed Ports • 2 Incident Zones</span>
          </div>
        </div>

        {/* Bottom-Right Zoom Controls */}
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5 pointer-events-auto">
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-lg bg-[#071527]/90 hover:bg-[#0d223d] border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center cursor-pointer shadow-lg transition-colors"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-lg bg-[#071527]/90 hover:bg-[#0d223d] border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center cursor-pointer shadow-lg transition-colors"
          >
            <Minus className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM HOTLINE / CONTACT BAR (Matches Photograph Footer) */}
      {/* ========================================================================= */}
      <div className="p-3.5 bg-[#050e1d] border-t border-slate-800/80">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Col 1: MRCC CHENNAI */}
          <div className="p-3 rounded-xl bg-[#071527]/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              MRCC CHENNAI
            </span>
            <span className="text-sm font-mono font-black text-emerald-400 mt-1 block">
              VHF Ch 16 / DSC
            </span>
          </div>

          {/* Col 2: PORT BLAIR MRCC */}
          <div className="p-3 rounded-xl bg-[#071527]/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              PORT BLAIR MRCC
            </span>
            <span className="text-sm font-mono font-black text-cyan-400 mt-1 block">
              +91 3192 245 530
            </span>
          </div>

          {/* Col 3: COAST GUARD HOTLINE */}
          <div className="p-3 rounded-xl bg-[#071527]/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              COAST GUARD HOTLINE
            </span>
            <span className="text-sm font-mono font-black text-rose-500 mt-1 block">
              Toll Free: 1554
            </span>
          </div>
        </div>
      </div>

      {/* Custom Global CSS Keyframes for the Leader Pulsing Ring */}
      <style>{`
        @keyframes leader-pulse {
          0% {
            transform: scale(0.6);
            opacity: 1;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
