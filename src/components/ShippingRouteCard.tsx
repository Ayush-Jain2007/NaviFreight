import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import { 
  ChevronDown, 
  MapPin, 
  ArrowRight, 
  Ship, 
  Clock, 
  Navigation, 
  Layers, 
  Maximize2, 
  Minimize2, 
  Compass, 
  Anchor, 
  Eye, 
  Play, 
  Pause,
  AlertTriangle,
  Info,
  RotateCcw,
  Wind,
  Waves,
  CheckCircle2,
  X
} from 'lucide-react';
import { Port } from '../types';
import { PORTS_DATABASE } from '../data/maritimeData';

interface ShippingRouteCardProps {
  commodity?: string;
  onCommodityChange?: (val: string) => void;
  selectedRouteKey?: string;
  onRouteChange?: (routeKey: string) => void;
  onSelectPort?: (port: Port) => void;
}

// Port coordinates with accurate maritime bathymetry and berths
interface PortGeo {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  draft: string;
  maxDraftNum: number;
  maxLOA: string;
  berthType: string;
  turnaroundHrs: number;
  handlingRate: string;
  isEastCoastIndia: boolean;
}

const ALL_PORTS: Record<string, PortGeo> = {
  paradip: {
    id: 'paradip',
    name: 'Paradip Port',
    country: 'India',
    lat: 20.2644,
    lng: 86.6713,
    draft: '14.5m – 16.0m',
    maxDraftNum: 16.0,
    maxLOA: '260m (Capesize outer)',
    berthType: 'Mechanized Iron Ore & Deep Coal Berths',
    turnaroundHrs: 46.2,
    handlingRate: '50,000 MT/day mechanized',
    isEastCoastIndia: true,
  },
  vizag: {
    id: 'vizag_outer',
    name: 'Visakhapatnam Outer Harbour',
    country: 'India',
    lat: 17.6868,
    lng: 83.2185,
    draft: '18.5m (Deep Capesize)',
    maxDraftNum: 18.5,
    maxLOA: '300m',
    berthType: 'OB-I & OB-II Specialized Ore Berths',
    turnaroundHrs: 48.0,
    handlingRate: '70,000 MT/day conveyor',
    isEastCoastIndia: true,
  },
  dhamra: {
    id: 'dhamra',
    name: 'Dhamra Port',
    country: 'India',
    lat: 20.8030,
    lng: 86.9630,
    draft: '18.5m (Deep Draft)',
    maxDraftNum: 18.5,
    maxLOA: '310m (Fully laden Capesize)',
    berthType: 'Fully Automated Conveyor Terminal',
    turnaroundHrs: 41.5,
    handlingRate: '80,000 MT/day automated',
    isEastCoastIndia: true,
  },
  haldia: {
    id: 'haldia',
    name: 'Haldia Dock Complex',
    country: 'India',
    lat: 22.0257,
    lng: 88.0583,
    draft: '7.5m – 8.5m (Tidal Riverine)',
    maxDraftNum: 8.5,
    maxLOA: '230m (Lock Entrance)',
    berthType: 'Lock-gated Finger Berths (Handymax)',
    turnaroundHrs: 64.0,
    handlingRate: '22,000 MT/day grab cranes',
    isEastCoastIndia: true,
  },
  gangavaram: {
    id: 'gangavaram',
    name: 'Gangavaram Port',
    country: 'India',
    lat: 17.6190,
    lng: 83.2380,
    draft: '19.5m (Ultra Deep)',
    maxDraftNum: 19.5,
    maxLOA: '320m (Baby-Cape / Capesize)',
    berthType: 'Deepwater Multipurpose & Coal Berths',
    turnaroundHrs: 44.0,
    handlingRate: '65,000 MT/day',
    isEastCoastIndia: true,
  },
  kamarajar: {
    id: 'kamarajar',
    name: 'Kamarajar (Ennore)',
    country: 'India',
    lat: 13.2570,
    lng: 80.3340,
    draft: '15.5m (Panamax/Baby-Cape)',
    maxDraftNum: 15.5,
    maxLOA: '265m',
    berthType: 'Mechanized Coal Berth 1 & 2',
    turnaroundHrs: 45.0,
    handlingRate: '45,000 MT/day',
    isEastCoastIndia: true,
  },
  hedland: {
    id: 'hedland',
    name: 'Port Hedland',
    country: 'Australia',
    lat: -20.3167,
    lng: 118.5760,
    draft: '19.8m',
    maxDraftNum: 19.8,
    maxLOA: '330m',
    berthType: 'World Top Bulk Iron Ore Terminal (BHP/FMG)',
    turnaroundHrs: 32.0,
    handlingRate: '120,000 MT/day car dumpers',
    isEastCoastIndia: false,
  },
  newcastle: {
    id: 'newcastle',
    name: 'Port of Newcastle',
    country: 'Australia',
    lat: -32.9267,
    lng: 151.7817,
    draft: '15.2m',
    maxDraftNum: 15.2,
    maxLOA: '300m',
    berthType: 'PWCS / NCIG Global Coal Terminals',
    turnaroundHrs: 38.0,
    handlingRate: '85,000 MT/day loader',
    isEastCoastIndia: false,
  },
  dalrymple_bay: {
    id: 'dalrymple_bay',
    name: 'Dalrymple Bay (Hay Point)',
    country: 'Australia',
    lat: -21.2840,
    lng: 149.3000,
    draft: '19.5m',
    maxDraftNum: 19.5,
    maxLOA: '320m',
    berthType: 'Offshore Deepwater Coking Coal Jetties',
    turnaroundHrs: 36.0,
    handlingRate: '90,000 MT/day',
    isEastCoastIndia: false,
  },
  richards_bay: {
    id: 'richards_bay',
    name: 'Richards Bay',
    country: 'South Africa',
    lat: -28.8000,
    lng: 32.0500,
    draft: '17.5m',
    maxDraftNum: 17.5,
    maxLOA: '300m',
    berthType: 'RBCT World Coal Terminal',
    turnaroundHrs: 44.0,
    handlingRate: '75,000 MT/day',
    isEastCoastIndia: false,
  },
  singapore: {
    id: 'singapore',
    name: 'Singapore Anchorage',
    country: 'Singapore',
    lat: 1.2500,
    lng: 103.8200,
    draft: '20.5m',
    maxDraftNum: 20.5,
    maxLOA: '400m',
    berthType: 'Global Bunker Fueling & Supply Hub',
    turnaroundHrs: 18.0,
    handlingRate: 'Bunkering 1,500 MT/hr',
    isEastCoastIndia: false,
  },
};

// Strategic maritime chokepoints and navigational straits
interface MaritimeChokepoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  depth: string;
  advisory: string;
  type: 'strait' | 'channel' | 'pilot';
}

const MARITIME_CHOKEPOINTS: MaritimeChokepoint[] = [
  {
    id: 'lombok',
    name: 'Lombok Strait',
    lat: -8.5000,
    lng: 115.7000,
    depth: '> 150m (No Draft Constraint)',
    advisory: 'Preferred deepwater corridor for fully-laden Capesize vessels (>18m draft) bypassing shallow Malacca.',
    type: 'strait',
  },
  {
    id: 'malacca',
    name: 'Strait of Malacca (TSS)',
    lat: 1.4500,
    lng: 102.9000,
    depth: '25m (Max Permissible Draft 20.5m UKC)',
    advisory: 'High traffic density TSS. Capesize bulkers with draft >20.5m are restricted by Under Keel Clearance (UKC).',
    type: 'strait',
  },
  {
    id: 'sunda',
    name: 'Sunda Strait',
    lat: -6.0000,
    lng: 105.8000,
    depth: 'Deep (Heavy currents)',
    advisory: 'Secondary passage between Java and Sumatra. Strong volcanic & tidal currents.',
    type: 'strait',
  },
  {
    id: 'six_degree',
    name: 'Six Degree Channel (Great Channel)',
    lat: 6.0000,
    lng: 93.6000,
    depth: '> 1,000m',
    advisory: 'Primary oceanic gateway into the Bay of Bengal between Great Nicobar and Sumatra.',
    type: 'channel',
  },
  {
    id: 'sandheads',
    name: 'Sandheads Pilot Station',
    lat: 21.3500,
    lng: 88.2500,
    depth: '10.5m – 12.0m',
    advisory: 'Compulsory river pilot boarding station for vessels proceeding up the Hooghly river to Haldia / Kolkata.',
    type: 'pilot',
  },
];

// Corridors with realistic IMO maritime tracks that navigate oceans and straits
interface RouteDefinition {
  id: string;
  title: string;
  origin: PortGeo;
  dest: PortGeo;
  distanceKm: string;
  distanceNm: number;
  seaDays: string;
  recommendedClass: string;
  chokepoints: string[];
  waypoints: [number, number][];
}

const ROUTE_DEFINITIONS: Record<string, RouteDefinition> = {
  hedland_paradip: {
    id: 'hedland_paradip',
    title: 'Port Hedland → Paradip Port',
    origin: ALL_PORTS.hedland,
    dest: ALL_PORTS.paradip,
    distanceKm: '8,610 km',
    distanceNm: 4650,
    seaDays: '14.8 – 16.5 days',
    recommendedClass: 'Panamax / Capesize',
    chokepoints: ['Lombok Strait', 'Six Degree Channel', 'Bay of Bengal Deep'],
    waypoints: [
      [-20.3167, 118.5760], // Hedland
      [-17.5000, 117.2000],
      [-12.8000, 116.4000],
      [-8.5000, 115.7000],  // Lombok Strait
      [-5.5000, 113.8000],  // Java Sea
      [-1.8000, 107.5000],  // Karimata Strait
      [1.5000, 104.5000],   // Singapore approach
      [5.8000, 96.5000],    // Malacca exit / Six Degree
      [6.0000, 93.6000],    // Great Channel
      [11.5000, 89.5000],   // Central Bay of Bengal
      [16.8000, 87.8000],
      [20.2644, 86.6713],   // Paradip
    ],
  },
  hedland_vizag: {
    id: 'hedland_vizag',
    title: 'Port Hedland → Visakhapatnam Outer',
    origin: ALL_PORTS.hedland,
    dest: ALL_PORTS.vizag,
    distanceKm: '8,370 km',
    distanceNm: 4520,
    seaDays: '14.2 – 16.0 days',
    recommendedClass: 'Capesize (18.5m Draft Cleared)',
    chokepoints: ['Lombok Strait', 'Six Degree Channel'],
    waypoints: [
      [-20.3167, 118.5760],
      [-15.0000, 116.5000],
      [-8.5000, 115.7000], // Lombok
      [-3.0000, 106.0000],
      [6.0000, 93.6000],  // Six Degree
      [12.5000, 87.2000],
      [15.8000, 84.8000],
      [17.6868, 83.2185], // Visakhapatnam Outer
    ],
  },
  hedland_dhamra: {
    id: 'hedland_dhamra',
    title: 'Port Hedland → Dhamra Port',
    origin: ALL_PORTS.hedland,
    dest: ALL_PORTS.dhamra,
    distanceKm: '8,685 km',
    distanceNm: 4690,
    seaDays: '15.0 – 17.0 days',
    recommendedClass: 'Capesize (Deep Automated)',
    chokepoints: ['Lombok Strait', 'Six Degree Channel'],
    waypoints: [
      [-20.3167, 118.5760],
      [-14.5000, 116.0000],
      [-8.5000, 115.7000],
      [-2.5000, 105.5000],
      [6.0000, 93.6000],
      [14.0000, 88.5000],
      [18.5000, 87.6000],
      [20.8030, 86.9630], // Dhamra
    ],
  },
  hedland_haldia: {
    id: 'hedland_haldia',
    title: 'Port Hedland → Haldia Dock Complex',
    origin: ALL_PORTS.hedland,
    dest: ALL_PORTS.haldia,
    distanceKm: '8,850 km',
    distanceNm: 4780,
    seaDays: '15.8 – 18.2 days',
    recommendedClass: 'Supramax / Handymax (Max 8.5m Draft)',
    chokepoints: ['Lombok Strait', 'Six Degree Channel', 'Sandheads Pilot'],
    waypoints: [
      [-20.3167, 118.5760],
      [-14.0000, 115.0000],
      [-8.5000, 115.7000],
      [0.0000, 102.0000],
      [6.0000, 93.6000],
      [14.0000, 89.0000],
      [18.5000, 88.8000],
      [21.3500, 88.2500], // Sandheads
      [22.0257, 88.0583], // Haldia
    ],
  },
  hedland_gangavaram: {
    id: 'hedland_gangavaram',
    title: 'Port Hedland → Gangavaram Port',
    origin: ALL_PORTS.hedland,
    dest: ALL_PORTS.gangavaram,
    distanceKm: '8,350 km',
    distanceNm: 4510,
    seaDays: '14.0 – 16.0 days',
    recommendedClass: 'Capesize (19.5m Ultra Deep)',
    chokepoints: ['Lombok Strait', 'Six Degree Channel'],
    waypoints: [
      [-20.3167, 118.5760],
      [-14.5000, 116.0000],
      [-8.5000, 115.7000],
      [2.0000, 98.0000],
      [6.0000, 93.6000],
      [13.0000, 86.5000],
      [17.6190, 83.2380], // Gangavaram
    ],
  },
  newcastle_vizag: {
    id: 'newcastle_vizag',
    title: 'Newcastle → Visakhapatnam Outer',
    origin: ALL_PORTS.newcastle,
    dest: ALL_PORTS.vizag,
    distanceKm: '9,480 km',
    distanceNm: 5120,
    seaDays: '16.5 – 19.5 days',
    recommendedClass: 'Panamax / Capesize (Coking Coal)',
    chokepoints: ['Torres Strait / Arafura Sea', 'Six Degree Channel'],
    waypoints: [
      [-32.9267, 151.7817], // Newcastle
      [-26.0000, 153.5000],
      [-18.0000, 149.0000],
      [-10.6000, 142.2000], // Torres Strait
      [-8.5000, 131.0000],  // Arafura
      [-8.5000, 115.7000],  // Lombok
      [6.0000, 93.6000],   // Six Degree
      [13.0000, 86.5000],
      [17.6868, 83.2185],  // Vizag
    ],
  },
  dalrymple_paradip: {
    id: 'dalrymple_paradip',
    title: 'Dalrymple Bay → Paradip Port',
    origin: ALL_PORTS.dalrymple_bay,
    dest: ALL_PORTS.paradip,
    distanceKm: '9,110 km',
    distanceNm: 4920,
    seaDays: '15.8 – 18.5 days',
    recommendedClass: 'Panamax / Capesize',
    chokepoints: ['Torres Strait', 'Six Degree Channel'],
    waypoints: [
      [-21.2840, 149.3000],
      [-14.0000, 146.0000],
      [-10.6000, 142.2000],
      [-8.5000, 125.0000],
      [-8.5000, 115.7000],
      [6.0000, 93.6000],
      [14.5000, 88.5000],
      [20.2644, 86.6713],
    ],
  },
  richardsbay_paradip: {
    id: 'richardsbay_paradip',
    title: 'Richards Bay → Paradip Port',
    origin: ALL_PORTS.richards_bay,
    dest: ALL_PORTS.paradip,
    distanceKm: '9,050 km',
    distanceNm: 4890,
    seaDays: '16.0 – 19.0 days',
    recommendedClass: 'Capesize (Thermal Coal)',
    chokepoints: ['Mozambique Channel', 'South Equatorial Current', 'Sri Lanka Dondra Head'],
    waypoints: [
      [-28.8000, 32.0500], // Richards Bay
      [-24.0000, 38.0000], // Mozambique Channel
      [-16.0000, 44.0000],
      [-8.0000, 52.0000],  // Seychelles Basin
      [0.0000, 68.0000],   // Equator Maldives passage
      [5.5000, 80.5000],   // South of Sri Lanka (Dondra Head)
      [12.0000, 84.5000],  // Bay of Bengal approach
      [17.0000, 86.2000],
      [20.2644, 86.6713],  // Paradip
    ],
  },
  hedland_kamarajar: {
    id: 'hedland_kamarajar',
    title: 'Port Hedland → Kamarajar (Ennore)',
    origin: ALL_PORTS.hedland,
    dest: ALL_PORTS.kamarajar,
    distanceKm: '8,190 km',
    distanceNm: 4420,
    seaDays: '14.0 – 15.5 days',
    recommendedClass: 'Panamax / Baby-Cape (15.5m Max Draft)',
    chokepoints: ['Lombok Strait', 'Six Degree Channel'],
    waypoints: [
      [-20.3167, 118.5760], // Hedland
      [-17.0000, 117.0000],
      [-12.5000, 116.3000],
      [-8.5000, 115.7000],  // Lombok Strait
      [-5.5000, 113.8000],  // Java Sea
      [-1.8000, 107.5000],  // Karimata
      [1.5000, 104.5000],   // Singapore approach
      [5.8000, 96.5000],    // Malacca exit
      [6.0000, 93.6000],    // Great Channel / Six Degree
      [9.5000, 85.0000],    // South Bay of Bengal
      [11.5000, 82.0000],   // Tamil Nadu approach
      [13.2570, 80.3340],   // Kamarajar (Ennore)
    ],
  },
  richardsbay_dhamra: {
    id: 'richardsbay_dhamra',
    title: 'Richards Bay → Dhamra Port',
    origin: ALL_PORTS.richards_bay,
    dest: ALL_PORTS.dhamra,
    distanceKm: '9,170 km',
    distanceNm: 4950,
    seaDays: '16.2 – 19.2 days',
    recommendedClass: 'Capesize (Deep Automated 18.5m)',
    chokepoints: ['Mozambique Channel', 'Sri Lanka Dondra Head', 'Bay of Bengal Deep'],
    waypoints: [
      [-28.8000, 32.0500], // Richards Bay
      [-24.0000, 38.0000], // Mozambique Channel
      [-16.0000, 44.0000],
      [-8.0000, 52.0000],  // Seychelles Basin
      [0.0000, 68.0000],   // Equator passage
      [5.5000, 80.5000],   // South of Sri Lanka (Dondra Head)
      [13.5000, 85.5000],  // Bay of Bengal approach
      [18.5000, 87.6000],
      [20.8030, 86.9630],  // Dhamra
    ],
  },
  richardsbay_gangavaram: {
    id: 'richardsbay_gangavaram',
    title: 'Richards Bay → Gangavaram Port',
    origin: ALL_PORTS.richards_bay,
    dest: ALL_PORTS.gangavaram,
    distanceKm: '8,850 km',
    distanceNm: 4780,
    seaDays: '15.5 – 18.0 days',
    recommendedClass: 'Capesize (19.5m Ultra Deep)',
    chokepoints: ['Mozambique Channel', 'Sri Lanka Dondra Head'],
    waypoints: [
      [-28.8000, 32.0500],
      [-24.0000, 38.0000],
      [-16.0000, 44.0000],
      [-8.0000, 52.0000],
      [0.0000, 68.0000],
      [5.5000, 80.5000],
      [12.5000, 84.0000],
      [17.6190, 83.2380], // Gangavaram
    ],
  },
  newcastle_dhamra: {
    id: 'newcastle_dhamra',
    title: 'Newcastle → Dhamra Port',
    origin: ALL_PORTS.newcastle,
    dest: ALL_PORTS.dhamra,
    distanceKm: '9,630 km',
    distanceNm: 5200,
    seaDays: '17.0 – 19.8 days',
    recommendedClass: 'Capesize / Panamax (Coking Coal)',
    chokepoints: ['Torres Strait', 'Six Degree Channel'],
    waypoints: [
      [-32.9267, 151.7817], // Newcastle
      [-26.0000, 153.5000],
      [-18.0000, 149.0000],
      [-10.6000, 142.2000], // Torres Strait
      [-8.5000, 131.0000],
      [-8.5000, 115.7000],  // Lombok
      [6.0000, 93.6000],   // Six Degree
      [14.0000, 88.5000],
      [18.5000, 87.6000],
      [20.8030, 86.9630],  // Dhamra
    ],
  },
  newcastle_kamarajar: {
    id: 'newcastle_kamarajar',
    title: 'Newcastle → Kamarajar (Ennore)',
    origin: ALL_PORTS.newcastle,
    dest: ALL_PORTS.kamarajar,
    distanceKm: '9,250 km',
    distanceNm: 4995,
    seaDays: '16.0 – 18.8 days',
    recommendedClass: 'Panamax / Baby-Cape',
    chokepoints: ['Torres Strait', 'Six Degree Channel'],
    waypoints: [
      [-32.9267, 151.7817],
      [-26.0000, 153.5000],
      [-18.0000, 149.0000],
      [-10.6000, 142.2000],
      [-8.5000, 131.0000],
      [-8.5000, 115.7000],
      [6.0000, 93.6000],
      [10.0000, 85.0000],
      [13.2570, 80.3340],  // Kamarajar
    ],
  },
  dalrymple_haldia: {
    id: 'dalrymple_haldia',
    title: 'Dalrymple Bay → Haldia Dock Complex',
    origin: ALL_PORTS.dalrymple_bay,
    dest: ALL_PORTS.haldia,
    distanceKm: '9,220 km',
    distanceNm: 4980,
    seaDays: '16.5 – 19.0 days',
    recommendedClass: 'Supramax / Handymax (Max 8.5m River Draft)',
    chokepoints: ['Torres Strait', 'Sandheads Pilot'],
    waypoints: [
      [-21.2840, 149.3000],
      [-14.0000, 146.0000],
      [-10.6000, 142.2000],
      [-8.5000, 125.0000],
      [-8.5000, 115.7000],
      [6.0000, 93.6000],
      [15.0000, 89.0000],
      [21.3500, 88.2500], // Sandheads
      [22.0257, 88.0583], // Haldia
    ],
  },
};

export const ShippingRouteCard: React.FC<ShippingRouteCardProps> = ({
  commodity = 'Iron Ore',
  selectedRouteKey: externalRouteKey,
  onRouteChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayersRef = useRef<{
    outerGlow?: L.Polyline;
    mainRoute?: L.Polyline;
    markersLayer?: L.LayerGroup;
    vesselMarker?: L.Marker;
    weatherLayer?: L.LayerGroup;
  }>({});
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);

  const [selectedCommodity, setSelectedCommodity] = useState(commodity);
  const [selectedRouteKey, setSelectedRouteKey] = useState<string>(externalRouteKey || 'hedland_paradip');
  const [mapMode, setMapMode] = useState<'satellite_hybrid' | 'satellite_pure' | 'ocean' | 'dark'>('satellite_hybrid');
  const [showLabels, setShowLabels] = useState(true);
  const [showWeatherOverlay, setShowWeatherOverlay] = useState(false);
  const [showChokepoints, setShowChokepoints] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState<1 | 3 | 8>(1);
  const [vesselProgress, setVesselProgress] = useState(0.45); // 0 to 1 along waypoint path
  const [activePortInfo, setActivePortInfo] = useState<PortGeo | null>(null);
  const [activeChokepointInfo, setActiveChokepointInfo] = useState<MaritimeChokepoint | null>(null);

  // Sync external selected route prop
  useEffect(() => {
    if (externalRouteKey && ROUTE_DEFINITIONS[externalRouteKey]) {
      setSelectedRouteKey(externalRouteKey);
      setVesselProgress(0.08);
      const targetRoute = ROUTE_DEFINITIONS[externalRouteKey];
      if (mapInstanceRef.current && targetRoute?.waypoints) {
        mapInstanceRef.current.invalidateSize();
        const bounds = L.latLngBounds(targetRoute.waypoints);
        mapInstanceRef.current.fitBounds(bounds, { padding: isFullscreen ? [70, 70] : [35, 35] });
      }
    }
  }, [externalRouteKey, isFullscreen]);

  const handleRouteChange = (key: string) => {
    setSelectedRouteKey(key);
    onRouteChange?.(key);
    setVesselProgress(0.08);
    const targetRoute = ROUTE_DEFINITIONS[key];
    if (mapInstanceRef.current && targetRoute?.waypoints) {
      mapInstanceRef.current.invalidateSize();
      const bounds = L.latLngBounds(targetRoute.waypoints);
      mapInstanceRef.current.fitBounds(bounds, { padding: isFullscreen ? [70, 70] : [35, 35] });
    }
  };

  const activeRoute = ROUTE_DEFINITIONS[selectedRouteKey] || ROUTE_DEFINITIONS.hedland_paradip;

  // High-Resolution Tile Layers
  const tileConfig = {
    // Esri World Imagery: 2026 High-Res Maxar, Earthstar, NASA satellite photography
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    // Crisp reference labels overlay (boundaries, oceans, straits, capitals, ports)
    labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    // NOAA / GEBCO World Ocean Basemap with detailed bathymetric ocean depth contours
    ocean: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
    // High-contrast Nautical Dark AIS
    dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  };

  // Prevent background scroll and iOS bounce when in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      const prevOverflow = document.body.style.overflow;
      const prevPosition = document.body.style.position;
      const prevWidth = document.body.style.width;
      const prevHeight = document.body.style.height;

      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';

      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.position = prevPosition;
        document.body.style.width = prevWidth;
        document.body.style.height = prevHeight;
      };
    }
  }, [isFullscreen]);

  // Compute interpolated vessel position along polyline
  const currentVesselPosition = useMemo(() => {
    const pts = activeRoute.waypoints;
    if (!pts || pts.length < 2) return pts[0] || [0, 0];

    const totalSegments = pts.length - 1;
    const scaledProgress = Math.max(0, Math.min(1, vesselProgress)) * totalSegments;
    const segIdx = Math.floor(scaledProgress);
    const frac = scaledProgress - segIdx;

    if (segIdx >= totalSegments) return pts[pts.length - 1];

    const p1 = pts[segIdx];
    const p2 = pts[segIdx + 1];

    const lat = p1[0] + (p2[0] - p1[0]) * frac;
    const lng = p1[1] + (p2[1] - p1[1]) * frac;

    // Calculate heading angle in degrees
    const dLat = p2[0] - p1[0];
    const dLng = p2[1] - p1[1];
    const headingDeg = (Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360;

    return { lat, lng, headingDeg };
  }, [activeRoute, vesselProgress]);

  // Animation ticker for moving vessel
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setVesselProgress((prev) => {
        const next = prev + (0.003 * simSpeed);
        return next > 0.98 ? 0.05 : next;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isPlaying, simSpeed]);

  // Initialize or Re-center Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [5.0, 96.0], // Centered over Bay of Bengal and Indian Ocean
        zoom: 4,
        minZoom: 2,
        maxZoom: 18,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 100,
        zoomControl: false,
        attributionControl: false,
        bounceAtZoomLimits: false,
      });

      // Bottom Right Zoom Control
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Base Satellite Tile Layer
      const baseTileUrl = mapMode === 'ocean' ? tileConfig.ocean : mapMode === 'dark' ? tileConfig.dark : tileConfig.satellite;
      const tileLayer = L.tileLayer(baseTileUrl, {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c', 'd'],
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      // Labels Overlay Layer (for Satellite Hybrid)
      if (mapMode === 'satellite_hybrid' && showLabels) {
        labelsLayerRef.current = L.tileLayer(tileConfig.labels, {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c', 'd'],
          opacity: 0.9,
        }).addTo(map);
      }

      mapInstanceRef.current = map;
    }

    // Set initial bounds
    const map = mapInstanceRef.current;
    if (map && activeRoute?.waypoints) {
      const bounds = L.latLngBounds(activeRoute.waypoints);
      map.fitBounds(bounds, { padding: isFullscreen ? [70, 70] : [35, 35] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Base & Label Layers when mode or label toggle changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    let baseTileUrl = tileConfig.satellite;
    let isDark = false;

    if (mapMode === 'ocean') {
      baseTileUrl = tileConfig.ocean;
    } else if (mapMode === 'dark') {
      baseTileUrl = tileConfig.dark;
      isDark = true;
    } else {
      baseTileUrl = tileConfig.satellite;
    }

    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(baseTileUrl);
    }

    // Handle reference labels layer
    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current);
      labelsLayerRef.current = null;
    }

    if (mapMode === 'satellite_hybrid' && showLabels) {
      labelsLayerRef.current = L.tileLayer(tileConfig.labels, {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c', 'd'],
        opacity: 0.92,
      }).addTo(map);
    }
  }, [mapMode, showLabels]);

  // Robust ResizeObserver for iOS, orientation changes, fullscreen transitions
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const triggerResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };

    // Use modern ResizeObserver
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        triggerResize();
      });
      resizeObserver.observe(container);
    }

    // Also handle window resize and orientationchange
    window.addEventListener('resize', triggerResize);
    window.addEventListener('orientationchange', triggerResize);

    // Staggered triggers for CSS transition & iOS Safari dynamic address bars
    const t1 = setTimeout(triggerResize, 60);
    const t2 = setTimeout(triggerResize, 250);
    const t3 = setTimeout(() => {
      triggerResize();
      if (mapInstanceRef.current && activeRoute?.waypoints) {
        const bounds = L.latLngBounds(activeRoute.waypoints);
        mapInstanceRef.current.fitBounds(bounds, { padding: isFullscreen ? [65, 65] : [35, 35] });
      }
    }, 450);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', triggerResize);
      window.removeEventListener('orientationchange', triggerResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, selectedRouteKey]);

  // Render Markers, Polylines, Chokepoints, Weather
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean up previous route layers
    if (routeLayersRef.current.outerGlow) map.removeLayer(routeLayersRef.current.outerGlow);
    if (routeLayersRef.current.mainRoute) map.removeLayer(routeLayersRef.current.mainRoute);
    if (routeLayersRef.current.markersLayer) map.removeLayer(routeLayersRef.current.markersLayer);
    if (routeLayersRef.current.weatherLayer) map.removeLayer(routeLayersRef.current.weatherLayer);

    const markersLayer = L.layerGroup().addTo(map);
    routeLayersRef.current.markersLayer = markersLayer;

    // 1. Draw glowing realistic geodesic shipping lane
    const outerGlow = L.polyline(activeRoute.waypoints, {
      color: '#0284c7',
      weight: 7,
      opacity: 0.45,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    const mainRoute = L.polyline(activeRoute.waypoints, {
      color: '#ffffff',
      weight: 2.8,
      opacity: 0.95,
      dashArray: '8, 6',
      lineCap: 'round',
    }).addTo(map);

    routeLayersRef.current.outerGlow = outerGlow;
    routeLayersRef.current.mainRoute = mainRoute;

    // 2. Render all relevant ports with custom realistic markers
    Object.values(ALL_PORTS).forEach((port) => {
      const isOrigin = activeRoute.origin.id === port.id;
      const isDest = activeRoute.dest.id === port.id;
      const isEastCoast = port.isEastCoastIndia;

      // Color coding: Blue for origin, Emerald for destination, Orange for other East Coast ports, Slate for overseas
      const markerColor = isDest ? '#10b981' : isOrigin ? '#38bdf8' : isEastCoast ? '#f59e0b' : '#64748b';
      const pulseRing = isDest || isOrigin;

      const portIcon = L.divIcon({
        className: 'custom-marine-pin',
        html: `
          <div style="position: relative; display: flex; align-items: center; cursor: pointer; transform: translate(-8px, -8px);">
            ${pulseRing ? `
              <div style="
                position: absolute;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: ${markerColor}33;
                animation: marine-pulse 2s infinite;
                top: -6px;
                left: -6px;
                pointer-events: none;
              "></div>
            ` : ''}
            <div style="
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: ${markerColor};
              border: 2.5px solid #ffffff;
              box-shadow: 0 0 12px ${markerColor}, 0 2px 6px rgba(0,0,0,0.8);
              flex-shrink: 0;
            "></div>
            <div style="
              margin-left: 6px;
              background: rgba(10, 20, 38, 0.92);
              color: #f8fafc;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 11px;
              font-weight: 700;
              padding: 2.5px 7px;
              border-radius: 5px;
              border: 1px solid ${markerColor}66;
              white-space: nowrap;
              box-shadow: 0 4px 10px rgba(0,0,0,0.6);
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              <span>${port.name}</span>
              <span style="color: ${markerColor}; font-size: 9.5px; opacity: 0.9;">(${port.draft})</span>
            </div>
          </div>
        `,
        iconSize: [140, 24],
        iconAnchor: [8, 8],
      });

      const marker = L.marker([port.lat, port.lng], { icon: portIcon, zIndexOffset: isDest || isOrigin ? 500 : 100 });
      marker.on('click', () => {
        setActivePortInfo(port);
        setActiveChokepointInfo(null);
        if (port.isEastCoastIndia) {
          const matched = Object.values(ROUTE_DEFINITIONS).find((r) => r.dest.id === port.id);
          if (matched) {
            handleRouteChange(matched.id);
          }
        }
      });
      markersLayer.addLayer(marker);
    });

    // 3. Render strategic maritime chokepoints if enabled
    if (showChokepoints) {
      MARITIME_CHOKEPOINTS.forEach((cp) => {
        const cpIcon = L.divIcon({
          className: 'custom-chokepoint-pin',
          html: `
            <div style="position: relative; cursor: pointer; display: flex; align-items: center; gap: 4px;">
              <div style="
                width: 10px;
                height: 10px;
                background: #f97316;
                border: 2px solid #ffffff;
                transform: rotate(45deg);
                box-shadow: 0 0 8px #f97316;
              "></div>
              <div style="
                background: rgba(15, 23, 42, 0.88);
                color: #fed7aa;
                font-size: 9.5px;
                font-weight: 600;
                padding: 1.5px 5px;
                border-radius: 3px;
                border: 1px solid rgba(249, 115, 22, 0.5);
                white-space: nowrap;
              ">
                ⚡ ${cp.name}
              </div>
            </div>
          `,
          iconSize: [110, 20],
          iconAnchor: [5, 5],
        });

        const cpMarker = L.marker([cp.lat, cp.lng], { icon: cpIcon, zIndexOffset: 250 });
        cpMarker.on('click', () => {
          setActiveChokepointInfo(cp);
          setActivePortInfo(null);
        });
        markersLayer.addLayer(cpMarker);
      });
    }

    // 4. Render Weather / Swell Indicators if enabled
    if (showWeatherOverlay) {
      const weatherLayer = L.layerGroup().addTo(map);
      routeLayersRef.current.weatherLayer = weatherLayer;

      // Realistic monsoon ocean swell nodes
      const swellNodes = [
        { lat: 14.0, lng: 88.0, desc: 'Bay of Bengal Central: 1.6m Swell, Beaufort 3, Favorable' },
        { lat: 1.0, lng: 94.0, desc: 'Equatorial Passage: 1.4m Swell, Light Breeze, 13.2 kts' },
        { lat: -14.0, lng: 114.0, desc: 'NW Australia Shelf: 1.8m Swell, Trade Winds' },
      ];

      swellNodes.forEach((node) => {
        const swellIcon = L.divIcon({
          className: 'custom-swell-icon',
          html: `
            <div style="
              background: rgba(8, 47, 73, 0.9);
              color: #7dd3fc;
              border: 1px solid #0284c7;
              padding: 3px 8px;
              border-radius: 6px;
              font-size: 10px;
              display: flex;
              align-items: center;
              gap: 4px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.5);
              white-space: nowrap;
            ">
              <span>🌊</span>
              <span>${node.desc}</span>
            </div>
          `,
          iconSize: [220, 24],
        });
        weatherLayer.addLayer(L.marker([node.lat, node.lng], { icon: swellIcon }));
      });
    }

    // Auto-fit bounds
    const bounds = L.latLngBounds(activeRoute.waypoints);
    map.fitBounds(bounds, { padding: isFullscreen ? [70, 70] : [35, 35] });
  }, [selectedRouteKey, showChokepoints, showWeatherOverlay]);

  // Update Moving Vessel Marker position along route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const pos = currentVesselPosition;
    if (!pos || typeof pos !== 'object' || !('lat' in pos)) return;

    const vesselHtml = `
      <div style="
        position: relative;
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <!-- Pulse Radar Waves -->
        <div style="
          position: absolute;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(56, 189, 248, 0.25);
          animation: marine-pulse 1.8s infinite;
        "></div>
        <!-- Vessel Icon with Heading Rotation -->
        <div style="
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #0284c7;
          border: 2px solid #ffffff;
          box-shadow: 0 0 10px #38bdf8, 0 3px 8px rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${pos.headingDeg}deg);
          transition: transform 0.2s ease-out;
        ">
          <div style="
            width: 0; 
            height: 0; 
            border-left: 4.5px solid transparent;
            border-right: 4.5px solid transparent;
            border-bottom: 9px solid #ffffff;
            margin-top: -1px;
          "></div>
        </div>
      </div>
    `;

    const shipIcon = L.divIcon({
      className: 'custom-ship-marker',
      html: vesselHtml,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    if (routeLayersRef.current.vesselMarker) {
      routeLayersRef.current.vesselMarker.setLatLng([pos.lat, pos.lng]);
      routeLayersRef.current.vesselMarker.setIcon(shipIcon);
    } else {
      const vMarker = L.marker([pos.lat, pos.lng], { icon: shipIcon, zIndexOffset: 1000 }).addTo(map);
      vMarker.on('click', () => {
        setActivePortInfo({
          id: 'vessel_telemetry',
          name: 'MV Blue Horizon (Panamax Carrier)',
          country: 'In Transit',
          lat: pos.lat,
          lng: pos.lng,
          draft: '14.2m (Laden with 75,000 MT)',
          maxDraftNum: 14.5,
          maxLOA: '225m',
          berthType: `En Route to ${activeRoute.dest.name}`,
          turnaroundHrs: 0,
          handlingRate: `Speed: 13.2 kts • Course: ${Math.round(pos.headingDeg)}° • ETA: ${activeRoute.seaDays}`,
          isEastCoastIndia: false,
        });
      });
      routeLayersRef.current.vesselMarker = vMarker;
    }
  }, [currentVesselPosition, activeRoute]);

  // Center on active route
  const handleCenterRoute = () => {
    if (mapInstanceRef.current && activeRoute?.waypoints) {
      mapInstanceRef.current.invalidateSize();
      const bounds = L.latLngBounds(activeRoute.waypoints);
      mapInstanceRef.current.fitBounds(bounds, { padding: isFullscreen ? [70, 70] : [40, 40] });
    }
  };

  // Content for the Map Card
  const mapContent = (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between ${
        isFullscreen
          ? 'fixed inset-0 z-[99999] w-full h-full bg-slate-950 text-white p-3 sm:p-5 m-0 rounded-none border-none overflow-hidden'
          : 'p-4 h-full relative'
      }`}
      style={isFullscreen ? {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: 'max(14px, env(safe-area-inset-top))',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(14px, env(safe-area-inset-left))',
        paddingRight: 'max(14px, env(safe-area-inset-right))',
      } : undefined}
    >
      {/* Top Header Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5 shrink-0">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-bold text-sm sm:text-base tracking-tight flex items-center gap-1.5 ${isFullscreen ? 'text-white' : 'text-slate-900'}`}>
              <Navigation className="w-4 h-4 text-cyan-500" />
              <span>Shipping Route to East Coast India</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </h3>

            {/* Satellite Live Badge */}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              NASA / MAXAR SATELLITE
            </span>

            {/* Transit Telemetry */}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 font-bold border border-blue-500/30 hidden md:inline-flex items-center gap-1">
              <Ship className="w-3 h-3 text-cyan-400" />
              13.2 kts • 4,650 nm Corridor
            </span>
          </div>

          <p className={`text-[11px] mt-0.5 ${isFullscreen ? 'text-slate-400' : 'text-slate-500'}`}>
            Photorealistic satellite Earth imagery with geodesic maritime routing, chokepoints & bathymetry
          </p>
        </div>

        {/* Route Dropdown, Commodity Dropdown & Fullscreen Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Corridor Selection Dropdown */}
          <div className="relative">
            <select
              value={selectedRouteKey}
              onChange={(e) => handleRouteChange(e.target.value)}
              className={`text-xs font-bold rounded-lg px-2.5 py-1.5 pr-7 appearance-none focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs ${
                isFullscreen
                  ? 'bg-slate-900 border border-slate-700 text-white'
                  : 'bg-slate-50 border border-slate-200 text-slate-800'
              }`}
            >
              <option value="hedland_paradip">Port Hedland → Paradip Port (14.5m)</option>
              <option value="hedland_vizag">Port Hedland → Visakhapatnam Outer (18.5m)</option>
              <option value="hedland_dhamra">Port Hedland → Dhamra Port (18.5m)</option>
              <option value="hedland_gangavaram">Port Hedland → Gangavaram Port (19.5m)</option>
              <option value="hedland_haldia">Port Hedland → Haldia Dock (8.5m Tidal)</option>
              <option value="hedland_kamarajar">Port Hedland → Kamarajar (Ennore 15.5m)</option>
              <option value="newcastle_vizag">Newcastle → Visakhapatnam (Coking Coal)</option>
              <option value="newcastle_dhamra">Newcastle → Dhamra Port (Capesize)</option>
              <option value="newcastle_kamarajar">Newcastle → Kamarajar (Ennore)</option>
              <option value="richardsbay_dhamra">Richards Bay → Dhamra Port (Thermal Coal)</option>
              <option value="richardsbay_gangavaram">Richards Bay → Gangavaram Port</option>
              <option value="richardsbay_paradip">Richards Bay → Paradip Port</option>
              <option value="dalrymple_haldia">Dalrymple Bay → Haldia Dock (Met Coal)</option>
              <option value="dalrymple_paradip">Dalrymple Bay → Paradip Port</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Commodity Dropdown */}
          <div className="relative">
            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 pr-7 appearance-none focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs ${
                isFullscreen
                  ? 'bg-slate-900 border border-slate-700 text-slate-200'
                  : 'bg-slate-50 border border-slate-200 text-slate-700'
              }`}
            >
              <option value="Iron Ore">Commodity: Iron Ore</option>
              <option value="Coking Coal">Commodity: Coking Coal</option>
              <option value="Thermal Coal">Commodity: Thermal Coal</option>
              <option value="Bauxite">Commodity: Bauxite</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Exit Fullscreen Button (Prominent in Fullscreen) */}
          {isFullscreen ? (
            <button
              onClick={() => setIsFullscreen(false)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer transition-all active:scale-95 border border-rose-400"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Fullscreen</span>
            </button>
          ) : (
            <button
              onClick={() => setIsFullscreen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
              title="View Map in Full Screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Full Screen</span>
            </button>
          )}
        </div>
      </div>

      {/* Layer Switcher & Map Tooling Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1 text-xs shrink-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-[11px] font-semibold mr-1 ${isFullscreen ? 'text-slate-400' : 'text-slate-500'}`}>
            Base Layer:
          </span>

          {/* Satellite Hybrid (Default) */}
          <button
            onClick={() => setMapMode('satellite_hybrid')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 border cursor-pointer ${
              mapMode === 'satellite_hybrid'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : isFullscreen
                ? 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Satellite Hybrid (Real Earth)</span>
          </button>

          {/* Satellite Pure */}
          <button
            onClick={() => setMapMode('satellite_pure')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 border cursor-pointer ${
              mapMode === 'satellite_pure'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : isFullscreen
                ? 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Pure Orbital</span>
          </button>

          {/* Ocean Hydrography */}
          <button
            onClick={() => setMapMode('ocean')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 border cursor-pointer ${
              mapMode === 'ocean'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : isFullscreen
                ? 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span>Ocean Bathymetry</span>
          </button>

          {/* Nautical Dark */}
          <button
            onClick={() => setMapMode('dark')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 border cursor-pointer ${
              mapMode === 'dark'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : isFullscreen
                ? 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Nautical AIS Dark</span>
          </button>
        </div>

        {/* Feature Toggles & Telemetry Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Chokepoints */}
          <button
            onClick={() => setShowChokepoints(!showChokepoints)}
            className={`text-[11px] px-2 py-1 rounded border font-semibold cursor-pointer transition-colors ${
              showChokepoints
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : isFullscreen
                ? 'bg-slate-900 text-slate-400 border-slate-700'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
          >
            ⚡ Straits & Chokepoints
          </button>

          {/* Toggle Weather */}
          <button
            onClick={() => setShowWeatherOverlay(!showWeatherOverlay)}
            className={`text-[11px] px-2 py-1 rounded border font-semibold cursor-pointer transition-colors ${
              showWeatherOverlay
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : isFullscreen
                ? 'bg-slate-900 text-slate-400 border-slate-700'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
          >
            🌊 Sea Swell / Weather
          </button>

          {/* Center Route Button */}
          <button
            onClick={handleCenterRoute}
            className={`text-[11px] px-2 py-1 rounded border font-semibold cursor-pointer flex items-center gap-1 ${
              isFullscreen
                ? 'text-slate-200 hover:text-white bg-slate-900 border-slate-700 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Center Corridor</span>
          </button>

          {/* Play/Pause Vessel Sim */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isPlaying
                ? 'text-emerald-400 bg-emerald-950/40 border-emerald-600/40'
                : 'text-slate-400 bg-slate-800 border-slate-700'
            }`}
            title={isPlaying ? 'Pause Vessel Tracking' : 'Resume Vessel Tracking'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Satellite Map Viewport (Interactive Leaflet Canvas) */}
      <div 
        className={`relative rounded-xl overflow-hidden flex-1 border shadow-inner w-full min-w-0 ${
          isFullscreen 
            ? 'h-[calc(100%-150px)] border-slate-700 bg-black' 
            : 'min-h-[320px] sm:min-h-[380px] border-slate-800 bg-black'
        }`}
      >
        {/* Leaflet Map DOM Element with touch-action for iOS Safari */}
        <div 
          ref={mapContainerRef} 
          className="w-full h-full absolute inset-0 z-0 touch-pan-x touch-pan-y" 
          style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
        />

        {/* Floating Key Route Highlights Box (Screenshot 1 Authentic Glassmorphism) */}
        <div className="absolute top-3 left-3 z-[400] bg-[#0a182c]/92 border border-slate-700/80 rounded-xl p-3 text-white text-xs backdrop-blur-md max-w-[230px] space-y-2.5 shadow-2xl pointer-events-auto">
          <div className="font-bold text-slate-100 text-[11px] uppercase tracking-wider pb-1 border-b border-slate-700/60 flex items-center justify-between">
            <span>Key Route Highlights</span>
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block leading-tight">Origin Hub</span>
              <span className="font-semibold text-slate-100 text-[11.5px] leading-tight">
                {activeRoute.origin.name}, {activeRoute.origin.country}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block leading-tight">Destination</span>
              <span className="font-semibold text-emerald-300 text-[11.5px] leading-tight">
                {activeRoute.dest.name} ({activeRoute.dest.draft})
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Ship className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block leading-tight">Distance (approx.)</span>
              <span className="font-semibold text-slate-100 text-[11px] leading-tight font-mono">
                {activeRoute.distanceKm} (~{activeRoute.distanceNm.toLocaleString()} nm)
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block leading-tight">Estimated Sea Days</span>
              <span className="font-semibold text-slate-100 text-[11px] leading-tight font-mono">
                {activeRoute.seaDays} @ 13.0 kts
              </span>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-700/50 flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Class Match:</span>
            <span className="font-bold text-cyan-300">{activeRoute.recommendedClass}</span>
          </div>
        </div>

        {/* Floating Quick Action Overlay on Right side of map */}
        <div className="absolute top-3 right-3 z-[400] flex flex-col gap-1.5 pointer-events-auto">
          {/* Zoom In & Out fallback buttons for touch */}
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 rounded-lg bg-slate-900/90 text-cyan-400 hover:text-white border border-slate-700 flex items-center justify-center font-bold text-lg shadow-lg backdrop-blur-md cursor-pointer active:scale-95"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 rounded-lg bg-slate-900/90 text-cyan-400 hover:text-white border border-slate-700 flex items-center justify-center font-bold text-lg shadow-lg backdrop-blur-md cursor-pointer active:scale-95"
            title="Zoom Out"
          >
            −
          </button>
          <button
            onClick={handleCenterRoute}
            className="w-8 h-8 rounded-lg bg-slate-900/90 text-cyan-400 hover:text-white border border-slate-700 flex items-center justify-center shadow-lg backdrop-blur-md cursor-pointer active:scale-95"
            title="Fit Entire Shipping Lane"
          >
            <Compass className="w-4 h-4" />
          </button>
          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="w-8 h-8 rounded-lg bg-rose-600 text-white border border-rose-400 flex items-center justify-center shadow-lg cursor-pointer active:scale-95"
              title="Close Fullscreen"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Port Detailed Inspection Drawer (Glassmorphism Popup) */}
        {activePortInfo && (
          <div className="absolute bottom-3 left-3 right-3 z-[450] bg-[#0c1a2e]/96 border border-cyan-500/60 rounded-xl p-3 sm:p-4 text-white text-xs shadow-2xl backdrop-blur-md animate-fadeIn">
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <Anchor className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-100 text-sm leading-tight">
                    {activePortInfo.name}
                  </h4>
                  <span className="text-[11px] text-cyan-300">
                    {activePortInfo.country} • Max Permissible Draft: <strong>{activePortInfo.draft}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activePortInfo.isEastCoastIndia && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                    East Coast Discharge Port
                  </span>
                )}
                <button
                  onClick={() => setActivePortInfo(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2.5 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Berth Facilities:</span>
                <span className="font-medium text-slate-200">{activePortInfo.berthType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Handling Throughput:</span>
                <span className="font-medium text-slate-200">{activePortInfo.handlingRate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Max Vessel Length (LOA):</span>
                <span className="font-medium text-slate-200 font-mono">{activePortInfo.maxLOA}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Avg Turnaround:</span>
                <span className="font-medium text-emerald-400 font-mono">
                  {activePortInfo.turnaroundHrs > 0 ? `${activePortInfo.turnaroundHrs} hours` : 'Continuous'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Live Chokepoint Inspection Drawer */}
        {activeChokepointInfo && (
          <div className="absolute bottom-3 left-3 right-3 z-[450] bg-[#1a120b]/96 border border-amber-500/60 rounded-xl p-3 sm:p-4 text-white text-xs shadow-2xl backdrop-blur-md animate-fadeIn">
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-amber-800/60">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-200 text-sm leading-tight">
                    {activeChokepointInfo.name}
                  </h4>
                  <span className="text-[11px] text-amber-300">
                    Depth: {activeChokepointInfo.depth}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveChokepointInfo(null)}
                className="text-amber-400 hover:text-white p-1 rounded-md hover:bg-amber-950/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2 text-[11.5px] text-slate-200 leading-relaxed">
              <span className="font-bold text-amber-400">Navigational Advisory: </span>
              {activeChokepointInfo.advisory}
            </div>
          </div>
        )}
      </div>

      {/* Route Quick Telemetry & Status Bar */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 shrink-0">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium text-slate-800">Satellite Imagery:</span>
            <span className="text-slate-600">Esri World Imagery (Maxar / NASA Earthstar)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-medium text-slate-800">Monsoon Window:</span>
            <span className="text-slate-600">Calm Seas • Favorable 1.6m Swell</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Ship className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium text-slate-800">Underway:</span>
            <span className="text-slate-600 font-mono">13.2 kts SOG • Laden</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-2">
          <span>Click any port or strait for navigational limits.</span>
          {!isFullscreen && (
            <button
              onClick={() => setIsFullscreen(true)}
              className="text-blue-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Expand Full Screen ↗
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Render via React Portal if fullscreen so it completely breaks out of any parent CSS transforms/grid constraints
  if (isFullscreen) {
    return (
      <>
        {/* Render placeholder in normal document flow so layout doesn't jump */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 text-center text-slate-400 flex flex-col items-center justify-center min-h-[380px]">
          <Navigation className="w-8 h-8 text-cyan-400 animate-pulse mb-2" />
          <p className="font-bold text-white text-sm">Satellite Map is Active in Fullscreen Mode</p>
          <p className="text-xs text-slate-400 mt-1">Press ESC or click Exit Fullscreen to return.</p>
          <button
            onClick={() => setIsFullscreen(false)}
            className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer border border-slate-700"
          >
            Exit Fullscreen
          </button>
        </div>
        {createPortal(mapContent, document.body)}
      </>
    );
  }

  return mapContent;
};
