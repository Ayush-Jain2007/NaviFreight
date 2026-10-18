import React, { useEffect, useRef, useState, useMemo } from 'react';
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
  X,
  ShieldAlert
} from 'lucide-react';
import { Port } from '../types';
import { PORTS_DATABASE } from '../data/maritimeData';

interface ShippingRouteCardProps {
  commodity?: string;
  onCommodityChange?: (val: string) => void;
  selectedRouteKey?: string;
  onRouteChange?: (routeKey: string) => void;
  selectedDestPortId?: string;
  selectedOriginPortId?: string;
  onSelectPort?: (port: Port) => void;
  onNavigateTab?: (tab: string) => void;
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
  // 🇺🇸 UNITED STATES PORTS
  norfolk: {
    id: 'norfolk',
    name: 'Norfolk / Hampton Roads',
    country: 'United States',
    lat: 36.8508,
    lng: -76.2859,
    draft: '15.5m (Lamberts Point)',
    maxDraftNum: 15.5,
    maxLOA: '290m (Capesize Pier 6)',
    berthType: 'Norfolk Southern Pier 6 Coal Terminal',
    turnaroundHrs: 36.0,
    handlingRate: '65,000 MT/day car dumpers',
    isEastCoastIndia: false,
  },
  baltimore: {
    id: 'baltimore',
    name: 'Port of Baltimore (Curtis Bay)',
    country: 'United States',
    lat: 39.2200,
    lng: -76.5800,
    draft: '15.2m',
    maxDraftNum: 15.2,
    maxLOA: '290m',
    berthType: 'Consol Marine Terminal & CSX Pier',
    turnaroundHrs: 38.0,
    handlingRate: '60,000 MT/day',
    isEastCoastIndia: false,
  },
  new_orleans: {
    id: 'new_orleans',
    name: 'Port of New Orleans / Mississippi',
    country: 'United States',
    lat: 29.9511,
    lng: -90.0715,
    draft: '14.5m',
    maxDraftNum: 14.5,
    maxLOA: '260m',
    berthType: 'Midwest Grain & Petcoke Terminals',
    turnaroundHrs: 40.0,
    handlingRate: '55,000 MT/day',
    isEastCoastIndia: false,
  },
  houston: {
    id: 'houston',
    name: 'Port of Houston (US Gulf)',
    country: 'United States',
    lat: 29.7604,
    lng: -95.3698,
    draft: '14.0m',
    maxDraftNum: 14.0,
    maxLOA: '270m',
    berthType: 'Bulk Materials Handling Plant / Petchem Hub',
    turnaroundHrs: 36.0,
    handlingRate: '60,000 MT/day',
    isEastCoastIndia: false,
  },
  los_angeles: {
    id: 'los_angeles',
    name: 'Port of Los Angeles / Long Beach',
    country: 'United States',
    lat: 33.7430,
    lng: -118.2673,
    draft: '16.2m',
    maxDraftNum: 16.2,
    maxLOA: '365m',
    berthType: 'Pacific Gateway Bulk & Container Terminal',
    turnaroundHrs: 30.0,
    handlingRate: '75,000 MT/day',
    isEastCoastIndia: false,
  },
  // 🇺🇦 UKRAINE BLACK SEA PORTS
  odesa: {
    id: 'odesa',
    name: 'Port of Odesa',
    country: 'Ukraine',
    lat: 46.4846,
    lng: 30.7431,
    draft: '14.0m',
    maxDraftNum: 14.0,
    maxLOA: '270m',
    berthType: 'Black Sea Grain & Iron Ore Terminal',
    turnaroundHrs: 38.0,
    handlingRate: '50,000 MT/day',
    isEastCoastIndia: false,
  },
  pivdennyi: {
    id: 'pivdennyi',
    name: 'Port of Pivdennyi (Yuzhny)',
    country: 'Ukraine',
    lat: 46.6028,
    lng: 31.0211,
    draft: '18.5m – 20.0m (Deep Capesize)',
    maxDraftNum: 18.5,
    maxLOA: '320m',
    berthType: 'TIS Deepwater Iron Ore Pellet & Grain Terminal',
    turnaroundHrs: 32.0,
    handlingRate: '85,000 MT/day conveyor',
    isEastCoastIndia: false,
  },
  chornomorsk: {
    id: 'chornomorsk',
    name: 'Port of Chornomorsk',
    country: 'Ukraine',
    lat: 46.3014,
    lng: 30.6572,
    draft: '14.5m',
    maxDraftNum: 14.5,
    maxLOA: '260m',
    berthType: 'Specialized Grain & Rail Ferry Bulk Jetties',
    turnaroundHrs: 36.0,
    handlingRate: '45,000 MT/day',
    isEastCoastIndia: false,
  },
  mykolaiv: {
    id: 'mykolaiv',
    name: 'Port of Mykolaiv',
    country: 'Ukraine',
    lat: 46.9467,
    lng: 31.9833,
    draft: '11.2m',
    maxDraftNum: 11.2,
    maxLOA: '220m',
    berthType: 'Dnipro-Bug Estuary Agri Bulk Port',
    turnaroundHrs: 44.0,
    handlingRate: '35,000 MT/day',
    isEastCoastIndia: false,
  },
  // 🇮🇳 ADDITIONAL INDIAN PORTS
  chennai: {
    id: 'chennai',
    name: 'Chennai Port',
    country: 'India',
    lat: 13.0827,
    lng: 80.2707,
    draft: '14.0m',
    maxDraftNum: 14.0,
    maxLOA: '245m',
    berthType: 'Deepwater Multi-cargo & Container Berths',
    turnaroundHrs: 42.0,
    handlingRate: '38,000 MT/day',
    isEastCoastIndia: true,
  },
  tuticorin: {
    id: 'tuticorin',
    name: 'V.O. Chidambaranar Port (Tuticorin)',
    country: 'India',
    lat: 8.7642,
    lng: 78.1348,
    draft: '14.2m',
    maxDraftNum: 14.2,
    maxLOA: '230m',
    berthType: 'Thermal Coal & Bulk Berths',
    turnaroundHrs: 39.5,
    handlingRate: '35,000 MT/day',
    isEastCoastIndia: true,
  },
  krishnapatnam: {
    id: 'krishnapatnam',
    name: 'Krishnapatnam Port',
    country: 'India',
    lat: 14.2500,
    lng: 80.1167,
    draft: '18.0m (Deepwater Capesize)',
    maxDraftNum: 18.0,
    maxLOA: '310m',
    berthType: 'Modern Automated Coal & Ore Berths',
    turnaroundHrs: 38.0,
    handlingRate: '60,000 MT/day',
    isEastCoastIndia: true,
  },
  kakinada: {
    id: 'kakinada',
    name: 'Kakinada Deep Water Port',
    country: 'India',
    lat: 16.9891,
    lng: 82.2875,
    draft: '14.0m',
    maxDraftNum: 14.0,
    maxLOA: '230m',
    berthType: 'Agri Bulk & Multi-Purpose Berths',
    turnaroundHrs: 45.0,
    handlingRate: '32,000 MT/day',
    isEastCoastIndia: true,
  },
  gopalpur: {
    id: 'gopalpur',
    name: 'Gopalpur Port',
    country: 'India',
    lat: 19.3000,
    lng: 84.9667,
    draft: '14.5m',
    maxDraftNum: 14.5,
    maxLOA: '225m',
    berthType: 'All-Weather Mineral Sand & Ore Berth',
    turnaroundHrs: 43.0,
    handlingRate: '30,000 MT/day',
    isEastCoastIndia: true,
  },
  kandla: {
    id: 'kandla',
    name: 'Deendayal Port (Kandla)',
    country: 'India',
    lat: 23.0033,
    lng: 70.2189,
    draft: '13.0m',
    maxDraftNum: 13.0,
    maxLOA: '225m',
    berthType: 'Cargo Jetty & Fertilizer Berths',
    turnaroundHrs: 44.0,
    handlingRate: '48,000 MT/day',
    isEastCoastIndia: false,
  },
  mundra: {
    id: 'mundra',
    name: 'Mundra Port',
    country: 'India',
    lat: 22.7388,
    lng: 69.7042,
    draft: '17.5m (Deep Capesize)',
    maxDraftNum: 17.5,
    maxLOA: '350m',
    berthType: 'Dedicated Mechanized Coal & Bulk Terminal',
    turnaroundHrs: 29.5,
    handlingRate: '85,000 MT/day',
    isEastCoastIndia: false,
  },
  jnpt: {
    id: 'jnpt',
    name: 'Jawaharlal Nehru Port (JNPT)',
    country: 'India',
    lat: 18.9500,
    lng: 72.9500,
    draft: '15.0m',
    maxDraftNum: 15.0,
    maxLOA: '350m',
    berthType: 'Shallow Water & Multi-purpose Bulk Berth',
    turnaroundHrs: 28.0,
    handlingRate: '70,000 MT/day',
    isEastCoastIndia: false,
  },
  mumbai: {
    id: 'mumbai',
    name: 'Mumbai Port Trust',
    country: 'India',
    lat: 18.9388,
    lng: 72.8550,
    draft: '12.0m',
    maxDraftNum: 12.0,
    maxLOA: '225m',
    berthType: 'Natural Deepwater Harbour & Wet Docks',
    turnaroundHrs: 54.0,
    handlingRate: '34,000 MT/day',
    isEastCoastIndia: false,
  },
  mormugao: {
    id: 'mormugao',
    name: 'Mormugao Port (Goa)',
    country: 'India',
    lat: 15.4167,
    lng: 73.8000,
    draft: '14.5m',
    maxDraftNum: 14.5,
    maxLOA: '230m',
    berthType: 'Prime Mechanized Iron Ore Exporting Terminal',
    turnaroundHrs: 42.0,
    handlingRate: '40,000 MT/day',
    isEastCoastIndia: false,
  },
  mangalore: {
    id: 'mangalore',
    name: 'New Mangalore Port',
    country: 'India',
    lat: 12.9242,
    lng: 74.8197,
    draft: '15.1m',
    maxDraftNum: 15.1,
    maxLOA: '250m',
    berthType: 'Deepwater Mechanized Ore & Coal Berth',
    turnaroundHrs: 38.5,
    handlingRate: '42,000 MT/day',
    isEastCoastIndia: false,
  },
  cochin: {
    id: 'cochin',
    name: 'Cochin Port / Vallarpadam',
    country: 'India',
    lat: 9.9667,
    lng: 76.2667,
    draft: '14.5m',
    maxDraftNum: 14.5,
    maxLOA: '320m',
    berthType: 'International Transshipment Terminal',
    turnaroundHrs: 35.0,
    handlingRate: '45,000 MT/day',
    isEastCoastIndia: false,
  },
  pipavav: {
    id: 'pipavav',
    name: 'Port Pipavav',
    country: 'India',
    lat: 20.9167,
    lng: 71.5000,
    draft: '14.5m',
    maxDraftNum: 14.5,
    maxLOA: '245m',
    berthType: 'APM Terminals Sheltered Berths',
    turnaroundHrs: 33.0,
    handlingRate: '38,000 MT/day',
    isEastCoastIndia: false,
  },
  hazira: {
    id: 'hazira',
    name: 'Hazira Port',
    country: 'India',
    lat: 21.0967,
    lng: 72.6467,
    draft: '14.5m',
    maxDraftNum: 14.5,
    maxLOA: '240m',
    berthType: 'All-Weather Deep Draft Bulk Terminal',
    turnaroundHrs: 34.0,
    handlingRate: '40,000 MT/day',
    isEastCoastIndia: false,
  },
  kolkata: {
    id: 'kolkata',
    name: 'Kolkata Port (SMP Port)',
    country: 'India',
    lat: 22.5444,
    lng: 88.3184,
    draft: '7.2m (Tidal Riverine)',
    maxDraftNum: 7.2,
    maxLOA: '172m',
    berthType: 'Tidal Riverine Lock Docks',
    turnaroundHrs: 68.0,
    handlingRate: '18,000 MT/day',
    isEastCoastIndia: true,
  },
  karaikal: {
    id: 'karaikal',
    name: 'Karaikal Port',
    country: 'India',
    lat: 10.8333,
    lng: 79.8500,
    draft: '14.5m',
    maxDraftNum: 14.5,
    maxLOA: '230m',
    berthType: 'Private All-Weather Deepwater Jetties',
    turnaroundHrs: 40.0,
    handlingRate: '30,000 MT/day',
    isEastCoastIndia: true,
  },
  vizag_inner: {
    id: 'vizag_inner',
    name: 'Visakhapatnam Inner Harbour',
    country: 'India',
    lat: 17.6950,
    lng: 83.2900,
    draft: '11.5m',
    maxDraftNum: 11.5,
    maxLOA: '195m',
    berthType: 'Inner Channel Handysize/Supramax Berths',
    turnaroundHrs: 52.5,
    handlingRate: '28,000 MT/day',
    isEastCoastIndia: true,
  },
  vizag_outer: {
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
  {
    id: 'bosporus',
    name: 'Bosporus Strait (Istanbul)',
    lat: 41.1500,
    lng: 29.0500,
    depth: '36m – 124m (Max LOA 300m / Daylight Bulker Transit)',
    advisory: 'Critical Turkish Straits chokepoint connecting Ukraine Black Sea ports to the Mediterranean. Convoy pilotage mandatory.',
    type: 'strait',
  },
  {
    id: 'dardanelles',
    name: 'Dardanelles Strait (Çanakkale)',
    lat: 40.1500,
    lng: 26.4000,
    depth: '55m – 100m',
    advisory: 'Gateway connecting Sea of Marmara to Aegean Sea. Standard westbound corridor for Ukrainian grain & ore carriers.',
    type: 'strait',
  },
  {
    id: 'suez',
    name: 'Suez Canal (Port Said / Port Tewfik)',
    lat: 30.5000,
    lng: 32.3500,
    depth: '24m (Max Draft 20.1m / Capesize-Suezmax)',
    advisory: 'Vital trans-oceanic gateway linking the Mediterranean and Red Sea, reducing US/Ukraine voyage distance to India by ~5,000 nm.',
    type: 'channel',
  },
  {
    id: 'babelmandeb',
    name: 'Bab-el-Mandeb Strait',
    lat: 12.6000,
    lng: 43.3000,
    depth: '180m',
    advisory: 'Strategic bottleneck connecting southern Red Sea to Gulf of Aden and Arabian Sea. Maritime security transit corridor.',
    type: 'strait',
  },
  {
    id: 'gibraltar',
    name: 'Strait of Gibraltar',
    lat: 35.9800,
    lng: -5.6000,
    depth: '300m – 900m',
    advisory: 'Primary deepwater gateway between North Atlantic and Mediterranean Sea. High-density Traffic Separation Scheme (TSS).',
    type: 'strait',
  },
  {
    id: 'dondra_head',
    name: 'Dondra Head TSS (Sri Lanka)',
    lat: 5.8000,
    lng: 80.5500,
    depth: '> 1,000m (Deep Oceanic)',
    advisory: 'Southern Sri Lanka deepwater TSS corridor connecting Arabian Sea and Bay of Bengal shipping lanes.',
    type: 'channel',
  },
  {
    id: 'florida_strait',
    name: 'Straits of Florida',
    lat: 24.5000,
    lng: -80.5000,
    depth: '600m (Gulf Stream corridor)',
    advisory: 'Navigational passage connecting US Gulf ports (Houston, New Orleans) around Florida Keys into the Atlantic Ocean.',
    type: 'strait',
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
  // ==========================================
  // 🇺🇸 UNITED STATES → INDIA SHIPPING ROUTES
  // ==========================================
  norfolk_paradip: {
    id: 'norfolk_paradip',
    title: 'Norfolk (US East Coast) → Paradip Port',
    origin: ALL_PORTS.norfolk,
    dest: ALL_PORTS.paradip,
    distanceKm: '15,650 km',
    distanceNm: 8450,
    seaDays: '27.0 – 30.0 days',
    recommendedClass: 'Panamax / Capesize (Appalachian Met Coal)',
    chokepoints: ['Strait of Gibraltar', 'Suez Canal', 'Bab-el-Mandeb', 'Dondra Head TSS'],
    waypoints: [
      [36.8508, -76.2859], // Norfolk Lamberts Point
      [36.9500, -75.9000], // Chesapeake Bay exit
      [36.5000, -68.0000], // West Atlantic
      [36.0000, -45.0000], // Mid North Atlantic
      [35.5000, -25.0000], // Azores South passage
      [35.9000, -10.0000], // Iberian approach
      [35.9800, -5.6000],  // Strait of Gibraltar
      [36.8000, 2.0000],   // Alboran / Western Med
      [37.2000, 11.5000],  // Strait of Sicily
      [35.5000, 16.5000],  // South of Malta
      [33.8000, 26.0000],  // Eastern Mediterranean
      [31.5000, 32.2500],  // Port Said approach
      [31.2500, 32.3200],  // Suez North Entrance
      [30.4000, 32.4000],  // Great Bitter Lake
      [29.9000, 32.5500],  // Suez South / Port Tewfik
      [28.0000, 33.4000],  // Gulf of Suez
      [25.0000, 36.0000],  // Northern Red Sea
      [20.0000, 38.8000],  // Central Red Sea
      [15.5000, 41.8000],  // Southern Red Sea
      [12.6000, 43.3000],  // Bab-el-Mandeb Strait
      [12.2000, 47.5000],  // Gulf of Aden
      [12.5000, 52.5000],  // Guardafui Channel
      [11.5000, 62.0000],  // Arabian Sea Crossing
      [8.0000, 74.0000],   // South of Cape Comorin
      [5.8000, 80.5500],   // Dondra Head TSS (Sri Lanka)
      [7.5000, 82.5000],   // Southeast Sri Lanka
      [14.0000, 85.0000],  // Bay of Bengal Deep
      [18.5000, 86.2000],  // Odisha offshore corridor
      [20.2644, 86.6713],  // Paradip Port
    ],
  },
  norfolk_vizag: {
    id: 'norfolk_vizag',
    title: 'Norfolk (US East Coast) → Visakhapatnam Outer',
    origin: ALL_PORTS.norfolk,
    dest: ALL_PORTS.vizag,
    distanceKm: '15,410 km',
    distanceNm: 8320,
    seaDays: '26.5 – 29.5 days',
    recommendedClass: 'Capesize (18.5m Deep Draft Cleared)',
    chokepoints: ['Strait of Gibraltar', 'Suez Canal', 'Bab-el-Mandeb', 'Dondra Head TSS'],
    waypoints: [
      [36.8508, -76.2859], // Norfolk
      [36.9500, -75.9000],
      [36.0000, -45.0000],
      [35.9800, -5.6000],  // Gibraltar
      [37.2000, 11.5000],  // Sicily
      [33.8000, 26.0000],  // Med
      [31.2500, 32.3200],  // Suez North
      [29.9000, 32.5500],  // Suez South
      [20.0000, 38.8000],  // Red Sea
      [12.6000, 43.3000],  // Bab-el-Mandeb
      [12.2000, 47.5000],  // Gulf of Aden
      [11.5000, 62.0000],  // Arabian Sea
      [5.8000, 80.5500],   // Dondra Head
      [11.0000, 83.0000],  // Andhra corridor
      [15.5000, 83.8000],
      [17.6868, 83.2185],  // Visakhapatnam Outer
    ],
  },
  norfolk_dhamra: {
    id: 'norfolk_dhamra',
    title: 'Norfolk (US East Coast) → Dhamra Port',
    origin: ALL_PORTS.norfolk,
    dest: ALL_PORTS.dhamra,
    distanceKm: '15,720 km',
    distanceNm: 8490,
    seaDays: '27.2 – 30.2 days',
    recommendedClass: 'Capesize (Deep Automated Terminal)',
    chokepoints: ['Strait of Gibraltar', 'Suez Canal', 'Bab-el-Mandeb', 'Dondra Head TSS'],
    waypoints: [
      [36.8508, -76.2859],
      [36.9500, -75.9000],
      [36.0000, -45.0000],
      [35.9800, -5.6000],  // Gibraltar
      [37.2000, 11.5000],  // Sicily
      [31.2500, 32.3200],  // Suez North
      [29.9000, 32.5500],  // Suez South
      [12.6000, 43.3000],  // Bab-el-Mandeb
      [11.5000, 62.0000],  // Arabian Sea
      [5.8000, 80.5500],   // Dondra Head
      [14.0000, 85.0000],  // Bay of Bengal
      [18.5000, 87.6000],
      [20.8030, 86.9630],  // Dhamra Port
    ],
  },
  baltimore_vizag: {
    id: 'baltimore_vizag',
    title: 'Baltimore (Curtis Bay) → Visakhapatnam Outer',
    origin: ALL_PORTS.baltimore,
    dest: ALL_PORTS.vizag,
    distanceKm: '15,560 km',
    distanceNm: 8400,
    seaDays: '27.0 – 30.0 days',
    recommendedClass: 'Panamax / Capesize (Met Coal)',
    chokepoints: ['Strait of Gibraltar', 'Suez Canal', 'Bab-el-Mandeb', 'Dondra Head TSS'],
    waypoints: [
      [39.2200, -76.5800], // Baltimore Curtis Bay
      [38.0000, -76.2500], // Chesapeake Bay Southbound
      [36.9500, -75.9000], // Cape Henry exit
      [36.0000, -45.0000],
      [35.9800, -5.6000],  // Gibraltar
      [37.2000, 11.5000],  // Sicily
      [31.2500, 32.3200],  // Suez
      [29.9000, 32.5500],
      [12.6000, 43.3000],  // Bab-el-Mandeb
      [11.5000, 62.0000],  // Arabian Sea
      [5.8000, 80.5500],   // Dondra Head
      [14.0000, 83.5000],
      [17.6868, 83.2185],  // Vizag
    ],
  },
  houston_paradip: {
    id: 'houston_paradip',
    title: 'Houston (US Gulf) → Paradip Port',
    origin: ALL_PORTS.houston,
    dest: ALL_PORTS.paradip,
    distanceKm: '17,130 km',
    distanceNm: 9250,
    seaDays: '29.5 – 33.0 days',
    recommendedClass: 'Panamax / Supramax (Petcoke & Bulks)',
    chokepoints: ['Straits of Florida', 'Strait of Gibraltar', 'Suez Canal', 'Bab-el-Mandeb'],
    waypoints: [
      [29.7604, -95.3698], // Houston
      [29.3500, -94.7500], // Galveston Bay exit
      [27.0000, -90.0000], // Central Gulf of Mexico
      [25.0000, -84.0000], // Florida shelf
      [24.5000, -80.5000], // Straits of Florida
      [28.0000, -74.0000], // Bahamas North / Atlantic
      [33.0000, -60.0000], // Sargasso Sea
      [35.5000, -40.0000], // North Atlantic eastbound
      [35.9000, -10.0000], // Approach Gibraltar
      [35.9800, -5.6000],  // Gibraltar
      [37.2000, 11.5000],  // Med
      [31.2500, 32.3200],  // Suez North
      [29.9000, 32.5500],  // Suez South
      [12.6000, 43.3000],  // Bab-el-Mandeb
      [11.5000, 62.0000],  // Arabian Sea
      [5.8000, 80.5500],   // Dondra Head
      [14.0000, 85.0000],  // Bay of Bengal
      [20.2644, 86.6713],  // Paradip Port
    ],
  },
  neworleans_paradip: {
    id: 'neworleans_paradip',
    title: 'New Orleans (Mississippi) → Paradip Port',
    origin: ALL_PORTS.new_orleans,
    dest: ALL_PORTS.paradip,
    distanceKm: '16,890 km',
    distanceNm: 9120,
    seaDays: '29.0 – 32.5 days',
    recommendedClass: 'Panamax (Midwest Grain & Petcoke)',
    chokepoints: ['Straits of Florida', 'Strait of Gibraltar', 'Suez Canal', 'Bab-el-Mandeb'],
    waypoints: [
      [29.9511, -90.0715], // New Orleans
      [28.9000, -89.4000], // Mississippi River Southwest Pass
      [26.5000, -86.5000], // Gulf of Mexico
      [24.5000, -80.5000], // Straits of Florida
      [28.0000, -74.0000], // Atlantic
      [34.0000, -50.0000],
      [35.9800, -5.6000],  // Gibraltar
      [37.2000, 11.5000],  // Med
      [31.2500, 32.3200],  // Suez North
      [29.9000, 32.5500],  // Suez South
      [12.6000, 43.3000],  // Bab-el-Mandeb
      [11.5000, 62.0000],  // Arabian Sea
      [5.8000, 80.5500],   // Dondra Head
      [14.0000, 85.0000],  // Bay of Bengal
      [20.2644, 86.6713],  // Paradip
    ],
  },

  // ==========================================
  // 🇺🇦 UKRAINE BLACK SEA → INDIA SHIPPING ROUTES
  // ==========================================
  odesa_paradip: {
    id: 'odesa_paradip',
    title: 'Odesa (Black Sea) → Paradip Port',
    origin: ALL_PORTS.odesa,
    dest: ALL_PORTS.paradip,
    distanceKm: '9,170 km',
    distanceNm: 4950,
    seaDays: '15.8 – 17.5 days',
    recommendedClass: 'Panamax / Supramax (Grain & Agri Bulks)',
    chokepoints: ['Bosporus Strait', 'Dardanelles Strait', 'Suez Canal', 'Bab-el-Mandeb', 'Dondra Head TSS'],
    waypoints: [
      [46.4846, 30.7431], // Port of Odesa
      [45.0000, 31.0000], // Black Sea southwest
      [43.5000, 30.2000], // Offshore Romania / Bulgaria
      [42.0000, 29.5000], // Approach Turkish Straits
      [41.2500, 29.1200], // Bosporus Northern Entrance
      [41.0500, 29.0200], // Bosporus Strait (Istanbul)
      [40.7500, 28.0000], // Sea of Marmara
      [40.5000, 27.2000],
      [40.1500, 26.4000], // Dardanelles Strait (Çanakkale)
      [38.5000, 25.5000], // Aegean Sea southbound
      [36.5000, 26.0000], // Sea of Crete
      [34.5000, 27.5000], // Southeast Mediterranean
      [32.5000, 31.0000], // Nile Delta offshore
      [31.2500, 32.3200], // Suez Canal North (Port Said)
      [30.4000, 32.4000], // Great Bitter Lake
      [29.9000, 32.5500], // Suez Canal South (Port Tewfik)
      [28.0000, 33.4000], // Gulf of Suez
      [25.0000, 36.0000], // Red Sea
      [20.0000, 38.8000],
      [15.5000, 41.8000],
      [12.6000, 43.3000], // Bab-el-Mandeb Strait
      [12.2000, 47.5000], // Gulf of Aden
      [12.5000, 52.5000], // Socotra passage
      [11.5000, 62.0000], // Arabian Sea
      [8.0000, 74.0000],  // Southwest of India
      [5.8000, 80.5500],  // Dondra Head TSS (Sri Lanka)
      [7.5000, 82.5000],
      [14.0000, 85.0000], // Bay of Bengal
      [18.5000, 86.2000],
      [20.2644, 86.6713], // Paradip Port
    ],
  },
  odesa_vizag: {
    id: 'odesa_vizag',
    title: 'Odesa (Black Sea) → Visakhapatnam Outer',
    origin: ALL_PORTS.odesa,
    dest: ALL_PORTS.vizag,
    distanceKm: '8,930 km',
    distanceNm: 4820,
    seaDays: '15.5 – 17.0 days',
    recommendedClass: 'Panamax (Ukrainian Steel & Agricultural Cargo)',
    chokepoints: ['Bosporus Strait', 'Dardanelles Strait', 'Suez Canal', 'Bab-el-Mandeb'],
    waypoints: [
      [46.4846, 30.7431], // Odesa
      [43.5000, 30.2000], // Black Sea
      [41.1500, 29.0500], // Bosporus
      [40.1500, 26.4000], // Dardanelles
      [36.5000, 26.0000], // Aegean
      [31.2500, 32.3200], // Suez North
      [29.9000, 32.5500], // Suez South
      [12.6000, 43.3000], // Bab-el-Mandeb
      [11.5000, 62.0000], // Arabian Sea
      [5.8000, 80.5500],  // Dondra Head
      [12.0000, 83.2000], // Andhra approach
      [17.6868, 83.2185], // Visakhapatnam Outer
    ],
  },
  pivdennyi_dhamra: {
    id: 'pivdennyi_dhamra',
    title: 'Pivdennyi (Yuzhny) → Dhamra Port',
    origin: ALL_PORTS.pivdennyi,
    dest: ALL_PORTS.dhamra,
    distanceKm: '9,300 km',
    distanceNm: 5020,
    seaDays: '16.0 – 17.8 days',
    recommendedClass: 'Capesize (Ferrexpo 18.5m Iron Ore Pellets)',
    chokepoints: ['Bosporus Strait', 'Dardanelles Strait', 'Suez Canal', 'Bab-el-Mandeb', 'Dondra Head TSS'],
    waypoints: [
      [46.6028, 31.0211], // Pivdennyi (Yuzhny) TIS Terminal
      [45.2000, 31.2000],
      [43.5000, 30.2000], // Black Sea
      [41.1500, 29.0500], // Bosporus
      [40.7500, 28.0000], // Marmara
      [40.1500, 26.4000], // Dardanelles
      [36.5000, 26.0000], // Aegean
      [31.2500, 32.3200], // Suez North
      [29.9000, 32.5500], // Suez South
      [20.0000, 38.8000], // Red Sea
      [12.6000, 43.3000], // Bab-el-Mandeb
      [12.2000, 47.5000], // Gulf of Aden
      [11.5000, 62.0000], // Arabian Sea
      [5.8000, 80.5500],  // Dondra Head
      [14.0000, 85.0000], // Bay of Bengal
      [18.5000, 87.6000],
      [20.8030, 86.9630], // Dhamra Port
    ],
  },
  pivdennyi_paradip: {
    id: 'pivdennyi_paradip',
    title: 'Pivdennyi (Yuzhny) → Paradip Port',
    origin: ALL_PORTS.pivdennyi,
    dest: ALL_PORTS.paradip,
    distanceKm: '9,220 km',
    distanceNm: 4980,
    seaDays: '15.9 – 17.6 days',
    recommendedClass: 'Capesize / Panamax (Deep Draft Pellets)',
    chokepoints: ['Bosporus Strait', 'Dardanelles Strait', 'Suez Canal', 'Bab-el-Mandeb'],
    waypoints: [
      [46.6028, 31.0211], // Pivdennyi
      [43.5000, 30.2000], // Black Sea
      [41.1500, 29.0500], // Bosporus
      [40.1500, 26.4000], // Dardanelles
      [36.5000, 26.0000], // Aegean
      [31.2500, 32.3200], // Suez North
      [29.9000, 32.5500], // Suez South
      [12.6000, 43.3000], // Bab-el-Mandeb
      [11.5000, 62.0000], // Arabian Sea
      [5.8000, 80.5500],  // Dondra Head
      [14.0000, 85.0000], // Bay of Bengal
      [20.2644, 86.6713], // Paradip Port
    ],
  },
  chornomorsk_vizag: {
    id: 'chornomorsk_vizag',
    title: 'Chornomorsk → Visakhapatnam Inner',
    origin: ALL_PORTS.chornomorsk,
    dest: ALL_PORTS.vizag,
    distanceKm: '8,980 km',
    distanceNm: 4850,
    seaDays: '15.6 – 17.2 days',
    recommendedClass: 'Supramax / Panamax (Agri & Fertilizer)',
    chokepoints: ['Bosporus Strait', 'Dardanelles Strait', 'Suez Canal', 'Bab-el-Mandeb'],
    waypoints: [
      [46.3014, 30.6572], // Chornomorsk
      [43.5000, 30.2000],
      [41.1500, 29.0500], // Bosporus
      [40.1500, 26.4000], // Dardanelles
      [36.5000, 26.0000],
      [31.2500, 32.3200], // Suez North
      [29.9000, 32.5500], // Suez South
      [12.6000, 43.3000], // Bab-el-Mandeb
      [11.5000, 62.0000], // Arabian Sea
      [5.8000, 80.5500],  // Dondra Head
      [12.0000, 83.2000],
      [17.6868, 83.2185], // Visakhapatnam
    ],
  },
};

// Calculate Haversine distance in nautical miles along great-circle segments
function haversineNM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateTotalDistanceNM(points: [number, number][]): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += haversineNM(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
  }
  return Math.round(total);
}

// Dynamically generate realistic maritime geodesic routing from ANY origin to ANY Indian port
function computeMaritimeRoute(origin: PortGeo, dest: PortGeo): RouteDefinition {
  const key = `${origin.id}_${dest.id}`;
  if (ROUTE_DEFINITIONS[key]) {
    return ROUTE_DEFINITIONS[key];
  }
  if (dest.id === 'vizag' && ROUTE_DEFINITIONS[`${origin.id}_vizag_outer`]) {
    return ROUTE_DEFINITIONS[`${origin.id}_vizag_outer`];
  }
  if (dest.id === 'vizag_outer' && ROUTE_DEFINITIONS[`${origin.id}_vizag`]) {
    return ROUTE_DEFINITIONS[`${origin.id}_vizag`];
  }

  const waypoints: [number, number][] = [];
  const chokepoints: string[] = [];

  const isWestCoast = !dest.isEastCoastIndia;

  // 1. ORIGIN SEGMENT
  if (origin.id === 'hedland') {
    waypoints.push([origin.lat, origin.lng], [-16.0, 116.5], [-8.5, 115.7]);
    chokepoints.push('Lombok Strait');
    waypoints.push([-2.5, 106.0], [6.0, 93.6]);
    chokepoints.push('Six Degree Channel (Great Channel)');
  } else if (origin.id === 'newcastle' || origin.id === 'dalrymple_bay') {
    waypoints.push([origin.lat, origin.lng]);
    if (origin.id === 'newcastle') {
      waypoints.push([-26.0, 153.5], [-18.0, 149.0]);
    }
    waypoints.push([-10.6, 142.2]);
    chokepoints.push('Torres Strait / Arafura Sea');
    waypoints.push([-8.5, 126.0], [-8.5, 115.7], [6.0, 93.6]);
    chokepoints.push('Six Degree Channel (Great Channel)');
  } else if (origin.id === 'singapore') {
    waypoints.push([origin.lat, origin.lng], [2.5, 101.5]);
    chokepoints.push('Strait of Malacca (TSS)');
    waypoints.push([5.8, 96.5], [6.0, 93.6]);
    chokepoints.push('Six Degree Channel (Great Channel)');
  } else if (['norfolk', 'baltimore'].includes(origin.id)) {
    waypoints.push([origin.lat, origin.lng], [37.5, -65.0], [36.0, -30.0], [35.95, -5.6]);
    chokepoints.push('Strait of Gibraltar');
    waypoints.push([37.0, 5.0], [35.5, 18.0], [31.25, 32.32], [29.9, 32.55]);
    chokepoints.push('Suez Canal');
    waypoints.push([24.0, 37.0], [18.0, 40.0], [12.6, 43.3]);
    chokepoints.push('Bab-el-Mandeb Strait');
    waypoints.push([12.0, 52.0], [12.0, 58.0]);
  } else if (['houston', 'new_orleans'].includes(origin.id)) {
    waypoints.push([origin.lat, origin.lng]);
    if (origin.id === 'new_orleans') waypoints.push([28.5, -89.5]);
    waypoints.push([25.0, -85.0], [24.5, -80.5]);
    chokepoints.push('Straits of Florida');
    waypoints.push([28.0, -75.0], [34.0, -45.0], [35.95, -5.6]);
    chokepoints.push('Strait of Gibraltar');
    waypoints.push([37.0, 5.0], [35.5, 18.0], [31.25, 32.32], [29.9, 32.55]);
    chokepoints.push('Suez Canal');
    waypoints.push([24.0, 37.0], [18.0, 40.0], [12.6, 43.3]);
    chokepoints.push('Bab-el-Mandeb Strait');
    waypoints.push([12.0, 52.0], [12.0, 58.0]);
  } else if (['odesa', 'pivdennyi', 'chornomorsk'].includes(origin.id)) {
    waypoints.push([origin.lat, origin.lng], [43.5, 30.5], [41.15, 29.05]);
    chokepoints.push('Bosporus Strait (Istanbul)');
    waypoints.push([40.15, 26.4]);
    chokepoints.push('Dardanelles Strait (Çanakkale)');
    waypoints.push([36.5, 26.0], [31.25, 32.32], [29.9, 32.55]);
    chokepoints.push('Suez Canal');
    waypoints.push([24.0, 37.0], [18.0, 40.0], [12.6, 43.3]);
    chokepoints.push('Bab-el-Mandeb Strait');
    waypoints.push([12.0, 52.0], [12.0, 58.0]);
  } else if (origin.id === 'richards_bay') {
    waypoints.push([origin.lat, origin.lng], [-22.0, 37.0], [-14.0, 44.0]);
    chokepoints.push('Mozambique Channel');
    waypoints.push([-4.0, 52.0], [2.0, 62.0]);
  } else {
    waypoints.push([origin.lat, origin.lng], [6.0, 93.6]);
  }

  // 2. INDIAN APPROACH CORRIDOR
  const isAustraliaOrSingapore = ['hedland', 'newcastle', 'dalrymple_bay', 'singapore'].includes(origin.id);
  const isAtlanticOrMed = ['norfolk', 'baltimore', 'houston', 'new_orleans', 'odesa', 'pivdennyi', 'chornomorsk'].includes(origin.id);
  const isSouthAfrica = origin.id === 'richards_bay';

  if (isAustraliaOrSingapore) {
    if (isWestCoast) {
      waypoints.push([5.8, 80.55]);
      chokepoints.push('Dondra Head TSS (Sri Lanka)');
      waypoints.push([7.2, 76.5]);
      if (dest.id === 'cochin') {
        // Direct entry
      } else if (dest.id === 'mangalore') {
        waypoints.push([10.0, 75.3]);
      } else if (dest.id === 'mormugao') {
        waypoints.push([10.0, 75.3], [13.0, 74.0]);
      } else if (dest.id === 'jnpt' || dest.id === 'mumbai') {
        waypoints.push([10.0, 75.3], [14.0, 73.0], [17.5, 72.2]);
      } else if (dest.id === 'hazira') {
        waypoints.push([10.0, 75.3], [15.0, 72.5], [19.5, 72.0]);
      } else if (dest.id === 'pipavav') {
        waypoints.push([10.0, 75.3], [15.0, 72.5], [20.0, 71.6]);
      } else if (dest.id === 'mundra' || dest.id === 'kandla') {
        waypoints.push([10.0, 75.3], [16.0, 71.5], [20.5, 69.4], [22.4, 69.0]);
        chokepoints.push('Gulf of Kutch Deepwater Channel');
      } else {
        waypoints.push([10.0, 75.3], [15.0, 72.5]);
      }
    } else {
      // East Coast from Australia/Singapore
      if (dest.id === 'tuticorin') {
        waypoints.push([5.8, 80.55]);
        chokepoints.push('Dondra Head TSS (Sri Lanka)');
        waypoints.push([7.8, 78.5]);
      } else if (['chennai', 'kamarajar', 'krishnapatnam', 'karaikal'].includes(dest.id)) {
        waypoints.push([8.5, 87.0], [11.5, 82.5]);
      } else if (['kakinada', 'gangavaram', 'vizag', 'vizag_outer', 'vizag_inner'].includes(dest.id)) {
        waypoints.push([10.5, 88.0], [14.5, 85.0]);
      } else if (dest.id === 'gopalpur') {
        waypoints.push([11.5, 88.5], [16.5, 86.5]);
      } else if (['paradip', 'dhamra'].includes(dest.id)) {
        waypoints.push([11.5, 89.5], [16.8, 87.8]);
      } else if (['haldia', 'kolkata'].includes(dest.id)) {
        waypoints.push([12.0, 89.0], [17.5, 88.5], [21.35, 88.25]);
        chokepoints.push('Sandheads Pilot Station');
      } else {
        waypoints.push([11.5, 87.0]);
      }
    }
  } else if (isAtlanticOrMed) {
    if (isWestCoast) {
      if (dest.id === 'mundra' || dest.id === 'kandla') {
        waypoints.push([17.0, 62.5], [21.0, 67.5], [22.4, 69.0]);
        chokepoints.push('Gulf of Kutch Deepwater Channel');
      } else if (dest.id === 'pipavav' || dest.id === 'hazira') {
        waypoints.push([16.5, 64.0], [19.5, 69.5]);
      } else if (dest.id === 'jnpt' || dest.id === 'mumbai') {
        waypoints.push([16.0, 64.5], [18.2, 70.5]);
      } else if (dest.id === 'mormugao') {
        waypoints.push([14.5, 65.5], [15.2, 71.5]);
      } else if (dest.id === 'mangalore') {
        waypoints.push([13.0, 66.5], [12.8, 72.5]);
      } else if (dest.id === 'cochin') {
        waypoints.push([11.5, 67.5], [10.2, 73.5]);
      } else {
        waypoints.push([15.0, 66.0]);
      }
    } else {
      // East Coast from Atlantic/Med (around Sri Lanka)
      waypoints.push([9.5, 68.0], [6.5, 76.0], [5.8, 80.55]);
      chokepoints.push('Dondra Head TSS (Sri Lanka)');
      if (dest.id === 'tuticorin') {
        waypoints.push([7.8, 78.5]);
      } else if (['chennai', 'kamarajar', 'krishnapatnam', 'karaikal'].includes(dest.id)) {
        waypoints.push([9.0, 83.5], [12.0, 82.0]);
      } else if (['kakinada', 'gangavaram', 'vizag', 'vizag_outer', 'vizag_inner'].includes(dest.id)) {
        waypoints.push([10.5, 84.5], [15.0, 84.5]);
      } else if (dest.id === 'gopalpur') {
        waypoints.push([11.0, 85.0], [16.5, 85.8]);
      } else if (['paradip', 'dhamra'].includes(dest.id)) {
        waypoints.push([11.5, 85.5], [17.5, 86.8]);
      } else if (['haldia', 'kolkata'].includes(dest.id)) {
        waypoints.push([12.0, 86.0], [18.0, 87.5], [21.35, 88.25]);
        chokepoints.push('Sandheads Pilot Station');
      } else {
        waypoints.push([12.0, 85.0]);
      }
    }
  } else if (isSouthAfrica) {
    if (isWestCoast) {
      waypoints.push([7.5, 68.0]);
      if (dest.id === 'cochin' || dest.id === 'mangalore') {
        // Direct
      } else if (dest.id === 'mormugao' || dest.id === 'jnpt' || dest.id === 'mumbai') {
        waypoints.push([14.0, 71.5]);
      } else {
        waypoints.push([16.0, 70.5], [21.0, 68.5]);
      }
    } else {
      waypoints.push([3.5, 73.0], [5.8, 80.55]);
      chokepoints.push('Dondra Head TSS (Sri Lanka)');
      if (dest.id === 'tuticorin') {
        waypoints.push([7.8, 78.5]);
      } else if (['chennai', 'kamarajar', 'krishnapatnam'].includes(dest.id)) {
        waypoints.push([9.5, 83.5]);
      } else if (['vizag', 'vizag_outer', 'gangavaram', 'kakinada'].includes(dest.id)) {
        waypoints.push([12.5, 85.0]);
      } else if (['paradip', 'dhamra', 'gopalpur'].includes(dest.id)) {
        waypoints.push([14.0, 86.5]);
      } else {
        waypoints.push([15.0, 87.0], [21.35, 88.25]);
        chokepoints.push('Sandheads Pilot Station');
      }
    }
  }

  // Final destination port point
  waypoints.push([dest.lat, dest.lng]);

  const distanceNm = calculateTotalDistanceNM(waypoints);
  const distanceKm = `${Math.round(distanceNm * 1.852).toLocaleString()} km`;
  const speedKnots = dest.maxDraftNum >= 17.5 ? 12.6 : 13.2;
  const seaDaysLow = (distanceNm / (speedKnots * 24)).toFixed(1);
  const seaDaysHigh = (parseFloat(seaDaysLow) * 1.12).toFixed(1);
  const seaDays = `${seaDaysLow} – ${seaDaysHigh} days`;

  let recommendedClass = 'Panamax / Kamsarmax (82k)';
  if (dest.maxDraftNum >= 17.5) {
    recommendedClass = 'Capesize (Deepwater Cleared)';
  } else if (dest.maxDraftNum <= 8.5) {
    recommendedClass = 'Handysize / Riverine (Lock-Gated)';
  } else if (dest.maxDraftNum < 12.0) {
    recommendedClass = 'Supramax / Handymax (Max Draft Cleared)';
  }

  return {
    id: `${origin.id}_${dest.id}`,
    title: `${origin.name} → ${dest.name}`,
    origin,
    dest,
    distanceKm,
    distanceNm,
    seaDays,
    recommendedClass,
    chokepoints: Array.from(new Set(chokepoints)),
    waypoints,
  };
}

export const ShippingRouteCard: React.FC<ShippingRouteCardProps> = ({
  commodity = 'Iron Ore',
  selectedRouteKey: externalRouteKey,
  onRouteChange,
  selectedDestPortId: externalDestPortId,
  selectedOriginPortId: externalOriginPortId,
  onSelectPort,
  onNavigateTab,
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
  const [selectedOriginPortId, setSelectedOriginPortId] = useState<string>(() => {
    if (externalRouteKey && ROUTE_DEFINITIONS[externalRouteKey]) {
      return ROUTE_DEFINITIONS[externalRouteKey].origin.id;
    }
    return externalOriginPortId || 'hedland';
  });
  const [selectedDestPortId, setSelectedDestPortId] = useState<string>(() => {
    if (externalDestPortId) {
      return externalDestPortId === 'vizag' ? 'vizag_outer' : externalDestPortId;
    }
    if (externalRouteKey && ROUTE_DEFINITIONS[externalRouteKey]) {
      return ROUTE_DEFINITIONS[externalRouteKey].dest.id;
    }
    return 'paradip';
  });
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

  // Origin and destination port objects
  const activeOriginGeo: PortGeo = ALL_PORTS[selectedOriginPortId] || ALL_PORTS.hedland;
  const activeDestGeo: PortGeo = ALL_PORTS[selectedDestPortId] || ALL_PORTS.paradip;

  const activeRoute: RouteDefinition = useMemo(() => {
    if (ROUTE_DEFINITIONS[selectedRouteKey] &&
        ROUTE_DEFINITIONS[selectedRouteKey].origin.id === activeOriginGeo.id &&
        (ROUTE_DEFINITIONS[selectedRouteKey].dest.id === activeDestGeo.id ||
         (activeDestGeo.id === 'vizag' && ROUTE_DEFINITIONS[selectedRouteKey].dest.id === 'vizag_outer'))) {
      return ROUTE_DEFINITIONS[selectedRouteKey];
    }
    return computeMaritimeRoute(activeOriginGeo, activeDestGeo);
  }, [selectedRouteKey, activeOriginGeo, activeDestGeo]);

  // Handler to select an Indian destination port (via dropdown or clicking map pin)
  const handleSelectDestPort = (destId: string) => {
    const normalizedDestId = destId === 'vizag' ? 'vizag_outer' : destId;
    setSelectedDestPortId(normalizedDestId);

    const matchingKey = `${selectedOriginPortId}_${normalizedDestId}`;
    if (ROUTE_DEFINITIONS[matchingKey]) {
      setSelectedRouteKey(matchingKey);
      onRouteChange?.(matchingKey);
    } else {
      setSelectedRouteKey(`${selectedOriginPortId}_${normalizedDestId}`);
    }

    const matchingPortObj = PORTS_DATABASE.find(p => p.id === normalizedDestId || p.id === destId);
    if (matchingPortObj && onSelectPort) {
      onSelectPort(matchingPortObj);
    }

    setVesselProgress(0.08);

    const targetRoute = computeMaritimeRoute(activeOriginGeo, ALL_PORTS[normalizedDestId] || ALL_PORTS.paradip);
    if (mapInstanceRef.current && targetRoute?.waypoints) {
      mapInstanceRef.current.invalidateSize();
      const bounds = L.latLngBounds(targetRoute.waypoints);
      mapInstanceRef.current.fitBounds(bounds, { padding: isFullscreen ? [70, 70] : [35, 35] });
    }
  };

  // Handler to select an origin overseas port
  const handleSelectOriginPort = (originId: string) => {
    setSelectedOriginPortId(originId);
    const matchingKey = `${originId}_${selectedDestPortId}`;
    if (ROUTE_DEFINITIONS[matchingKey]) {
      setSelectedRouteKey(matchingKey);
      onRouteChange?.(matchingKey);
    } else {
      setSelectedRouteKey(`${originId}_${selectedDestPortId}`);
    }
    setVesselProgress(0.08);

    const targetRoute = computeMaritimeRoute(ALL_PORTS[originId] || ALL_PORTS.hedland, activeDestGeo);
    if (mapInstanceRef.current && targetRoute?.waypoints) {
      mapInstanceRef.current.invalidateSize();
      const bounds = L.latLngBounds(targetRoute.waypoints);
      mapInstanceRef.current.fitBounds(bounds, { padding: isFullscreen ? [70, 70] : [35, 35] });
    }
  };

  const handleRouteChange = (key: string) => {
    setSelectedRouteKey(key);
    onRouteChange?.(key);
    const predefined = ROUTE_DEFINITIONS[key];
    if (predefined) {
      setSelectedOriginPortId(predefined.origin.id);
      setSelectedDestPortId(predefined.dest.id);
      const matchingPortObj = PORTS_DATABASE.find(p => p.id === predefined.dest.id);
      if (matchingPortObj && onSelectPort) {
        onSelectPort(matchingPortObj);
      }
    }
    setVesselProgress(0.08);
    if (mapInstanceRef.current && predefined?.waypoints) {
      mapInstanceRef.current.invalidateSize();
      const bounds = L.latLngBounds(predefined.waypoints);
      mapInstanceRef.current.fitBounds(bounds, { padding: isFullscreen ? [70, 70] : [35, 35] });
    }
  };

  // Sync external selected destination port prop
  useEffect(() => {
    if (externalDestPortId) {
      const normalized = externalDestPortId === 'vizag' ? 'vizag_outer' : externalDestPortId;
      if (normalized !== selectedDestPortId && ALL_PORTS[normalized]) {
        setSelectedDestPortId(normalized);
      }
    }
  }, [externalDestPortId]);

  // Sync external selected route prop
  useEffect(() => {
    if (externalRouteKey && ROUTE_DEFINITIONS[externalRouteKey]) {
      handleRouteChange(externalRouteKey);
    }
  }, [externalRouteKey]);

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

  // Prevent background scroll when in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = prevOverflow;
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
      const isDest = activeRoute.dest.id === port.id || (activeRoute.dest.id === 'vizag_outer' && port.id === 'vizag') || (activeRoute.dest.id === 'vizag' && port.id === 'vizag_outer');
      const isIndia = port.country === 'India';

      // Color coding: Blue for origin, Emerald for active destination, Amber for all Indian ports, Slate for overseas
      const markerColor = isDest ? '#10b981' : isOrigin ? '#38bdf8' : isIndia ? '#f59e0b' : '#64748b';
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
        if (port.country === 'India') {
          handleSelectDestPort(port.id);
        } else {
          handleSelectOriginPort(port.id);
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
  }, [activeRoute, showChokepoints, showWeatherOverlay]);

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
      key="shipping-map-root"
      className={`transition-all duration-200 flex flex-col justify-between ${
        isFullscreen
          ? 'fixed inset-0 z-[999999] w-screen h-screen bg-slate-950 text-white p-3 sm:p-5 m-0 rounded-none border-none overflow-hidden'
          : 'bg-white rounded-xl border border-slate-200 shadow-2xs p-4 h-full relative'
      }`}
      style={isFullscreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
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
              <span>Shipping Route to {activeRoute.dest.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </h3>

            {/* Satellite Live Badge */}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              NASA / MAXAR SATELLITE
            </span>

            {/* Transit Telemetry */}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 font-bold border border-blue-500/30 hidden md:inline-flex items-center gap-1">
              <Ship className="w-3 h-3 text-cyan-400" />
              13.2 kts • {activeRoute.distanceNm.toLocaleString()} nm Corridor
            </span>
          </div>

          <p className={`text-[11px] mt-0.5 ${isFullscreen ? 'text-slate-400' : 'text-slate-500'}`}>
            Photorealistic satellite Earth imagery with geodesic maritime routing, chokepoints &amp; bathymetry
          </p>
        </div>

        {/* Route Dropdown, Indian Port Dropdown, Commodity Dropdown & Fullscreen Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Destination Port of India Selector */}
          <div className="relative">
            <select
              value={selectedDestPortId}
              onChange={(e) => handleSelectDestPort(e.target.value)}
              className={`text-xs font-bold rounded-lg px-2.5 py-1.5 pr-7 appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs ${
                isFullscreen
                  ? 'bg-slate-900 border border-emerald-500/70 text-emerald-300'
                  : 'bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold'
              }`}
              title="Select Indian Destination Port"
            >
              <optgroup label="🇮🇳 India — East Coast Major Ports (14)">
                <option value="paradip">Paradip Port (Odisha • 14.5m)</option>
                <option value="dhamra">Dhamra Port (Odisha • 18.0m Deep Capesize)</option>
                <option value="vizag_outer">Visakhapatnam Outer (Andhra • 18.5m Capesize)</option>
                <option value="vizag_inner">Visakhapatnam Inner (Andhra • 11.5m Supramax)</option>
                <option value="gangavaram">Gangavaram Port (Andhra • 19.5m Ultra Deep)</option>
                <option value="gopalpur">Gopalpur Port (Odisha • 14.5m)</option>
                <option value="haldia">Haldia Dock Complex (West Bengal • 8.5m Tidal)</option>
                <option value="kolkata">Kolkata / SMP Port (West Bengal • 7.2m Riverine)</option>
                <option value="kakinada">Kakinada Deep Water (Andhra • 14.0m)</option>
                <option value="krishnapatnam">Krishnapatnam Port (Andhra • 18.0m Capesize)</option>
                <option value="kamarajar">Kamarajar / Ennore (Tamil Nadu • 15.5m)</option>
                <option value="chennai">Chennai Port (Tamil Nadu • 14.0m)</option>
                <option value="karaikal">Karaikal Port (Puducherry • 14.5m)</option>
                <option value="tuticorin">V.O. Chidambaranar / Tuticorin (Tamil Nadu • 14.2m)</option>
              </optgroup>
              <optgroup label="🇮🇳 India — West Coast Major Ports (9)">
                <option value="mundra">Mundra Port (Gujarat • 17.5m Deep Capesize)</option>
                <option value="kandla">Deendayal / Kandla (Gujarat • 13.0m)</option>
                <option value="jnpt">Jawaharlal Nehru Port / JNPT (Maharashtra • 15.0m)</option>
                <option value="mumbai">Mumbai Port Trust (Maharashtra • 12.0m)</option>
                <option value="mormugao">Mormugao Port (Goa • 14.5m Iron Ore)</option>
                <option value="mangalore">New Mangalore Port (Karnataka • 15.1m)</option>
                <option value="cochin">Cochin / Vallarpadam (Kerala • 14.5m)</option>
                <option value="pipavav">Port Pipavav (Gujarat • 14.5m)</option>
                <option value="hazira">Hazira Port (Gujarat • 14.5m)</option>
              </optgroup>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-emerald-600 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

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
              title="Select Origin Corridor / Preset Route"
            >
              <optgroup label="🇺🇸 United States → India Shipping Corridors">
                <option value="norfolk_paradip">Norfolk (US East Coast) → Paradip Port (Met Coal)</option>
                <option value="norfolk_vizag">Norfolk (US East Coast) → Visakhapatnam Outer (18.5m)</option>
                <option value="norfolk_dhamra">Norfolk (US East Coast) → Dhamra Port (Deep Capesize)</option>
                <option value="baltimore_vizag">Baltimore (Curtis Bay) → Visakhapatnam Outer</option>
                <option value="houston_paradip">Houston (US Gulf) → Paradip Port (Petcoke/Bulks)</option>
                <option value="neworleans_paradip">New Orleans (Mississippi) → Paradip Port (Grain)</option>
              </optgroup>
              <optgroup label="🇺🇦 Ukraine (Black Sea) → India Shipping Corridors">
                <option value="odesa_paradip">Odesa (Black Sea) → Paradip Port (Grain &amp; Agri)</option>
                <option value="odesa_vizag">Odesa (Black Sea) → Visakhapatnam Outer (Steel/Agri)</option>
                <option value="pivdennyi_dhamra">Pivdennyi (Yuzhny) → Dhamra Port (Ferrexpo Ore Pellets)</option>
                <option value="pivdennyi_paradip">Pivdennyi (Yuzhny) → Paradip Port (Deep Capesize)</option>
                <option value="chornomorsk_vizag">Chornomorsk → Visakhapatnam Inner</option>
              </optgroup>
              <optgroup label="🇦🇺 Australia → India Shipping Corridors">
                <option value="hedland_paradip">Port Hedland → Paradip Port (14.5m Iron Ore)</option>
                <option value="hedland_vizag">Port Hedland → Visakhapatnam Outer (18.5m)</option>
                <option value="hedland_dhamra">Port Hedland → Dhamra Port (18.5m)</option>
                <option value="hedland_gangavaram">Port Hedland → Gangavaram Port (19.5m)</option>
                <option value="hedland_haldia">Port Hedland → Haldia Dock (8.5m Tidal)</option>
                <option value="hedland_kamarajar">Port Hedland → Kamarajar (Ennore 15.5m)</option>
                <option value="newcastle_vizag">Newcastle → Visakhapatnam (Coking Coal)</option>
                <option value="newcastle_dhamra">Newcastle → Dhamra Port (Capesize)</option>
                <option value="newcastle_kamarajar">Newcastle → Kamarajar (Ennore)</option>
                <option value="dalrymple_haldia">Dalrymple Bay → Haldia Dock (Met Coal)</option>
                <option value="dalrymple_paradip">Dalrymple Bay → Paradip Port</option>
              </optgroup>
              <optgroup label="🇿🇦 South Africa → India Shipping Corridors">
                <option value="richardsbay_dhamra">Richards Bay → Dhamra Port (Thermal Coal)</option>
                <option value="richardsbay_gangavaram">Richards Bay → Gangavaram Port</option>
                <option value="richardsbay_paradip">Richards Bay → Paradip Port</option>
              </optgroup>
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
            ? 'border-slate-700 bg-slate-900' 
            : 'min-h-[320px] sm:min-h-[380px] border-slate-800 bg-slate-900'
        }`}
        style={isFullscreen ? { flex: '1 1 auto', minHeight: 'calc(100vh - 220px)' } : undefined}
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
                {activePortInfo.country === 'India' && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                    {activePortInfo.isEastCoastIndia ? '🇮🇳 East Coast Discharge Port' : '🇮🇳 West Coast Discharge Port'}
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

            {activePortInfo.country === 'India' && (
              <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between flex-wrap gap-2">
                <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Indian Terminal: <strong>{activePortInfo.isEastCoastIndia ? 'East Coast Corridor' : 'West Coast Corridor'}</strong></span>
                </div>
                {activeRoute.dest.id === activePortInfo.id || (activeRoute.dest.id === 'vizag_outer' && activePortInfo.id === 'vizag') ? (
                  <span className="px-3 py-1 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 text-[11px] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Active Destination Selected</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleSelectDestPort(activePortInfo.id)}
                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                  >
                    <Anchor className="w-3.5 h-3.5" />
                    <span>Select as Route Destination ⚓</span>
                  </button>
                )}
              </div>
            )}
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

            {onNavigateTab && (
              <div className="mt-2.5 pt-2 border-t border-amber-800/60 flex items-center justify-between">
                <span className="text-[11px] text-amber-300/80">Experiencing weather disruption or need emergency refuge?</span>
                <button
                  onClick={() => onNavigateTab('safety')}
                  className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Safety &amp; Recovery Hub</span>
                </button>
              </div>
            )}
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
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('safety')}
              className="text-rose-600 font-bold hover:underline flex items-center gap-1 cursor-pointer mr-2"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>Safety Command</span>
            </button>
          )}
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

  return (
    <>
      {isFullscreen && (
        <div 
          key="shipping-map-placeholder"
          className="bg-slate-900/60 rounded-xl border border-slate-800 p-8 text-center text-slate-400 flex flex-col items-center justify-center min-h-[380px]"
        >
          <Navigation className="w-8 h-8 text-cyan-400 animate-pulse mb-2" />
          <p className="font-bold text-white text-sm">Satellite Map is Active in Fullscreen Mode</p>
          <p className="text-xs text-slate-400 mt-1">Press ESC or click Exit Fullscreen to return.</p>
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="mt-3 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer border border-slate-700 transition-colors"
          >
            Exit Fullscreen
          </button>
        </div>
      )}
      {mapContent}
    </>
  );
};
