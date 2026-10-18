import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Ship, 
  Box, 
  Droplet, 
  Waves, 
  Grid, 
  Maximize2, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Package, 
  Sun, 
  Sunset, 
  Moon, 
  Info, 
  AlertTriangle 
} from 'lucide-react';

export type Vessel3DType = 'bulk_carrier' | 'container_ship' | 'oil_tanker';
export type VesselSizeType = 'panamax' | 'capesize' | 'supramax';
export type EnvironmentMode = 'ocean' | 'grid';
export type LightingMode = 'day' | 'sunset' | 'night';
export type CameraPreset = 'perspective' | 'bow' | 'port' | 'starboard' | 'stern' | 'top' | 'bridge';

export interface VesselStudio3DProps {
  initialVesselType?: Vessel3DType;
  initialSize?: VesselSizeType;
  initialEnvMode?: EnvironmentMode;
  initialCargoLoad?: number;
  initialDestPortName?: string;
  initialPortDraftLimit?: number;
  onVesselChange?: (type: Vessel3DType, size: VesselSizeType) => void;
  onCargoLoadChange?: (load: number) => void;
}

export const VesselStudio3D: React.FC<VesselStudio3DProps> = ({
  initialVesselType = 'bulk_carrier',
  initialSize = 'panamax',
  initialEnvMode = 'ocean',
  initialCargoLoad = 100,
  initialDestPortName = 'Paradip Port',
  initialPortDraftLimit = 14.5,
  onVesselChange,
  onCargoLoadChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Studio Interactive States
  const [vesselType, setVesselType] = useState<Vessel3DType>(initialVesselType);
  const [vesselSize, setVesselSize] = useState<VesselSizeType>(initialSize);
  const [envMode, setEnvMode] = useState<EnvironmentMode>(initialEnvMode);
  const [cargoLoad, setCargoLoad] = useState<number>(initialCargoLoad);
  const [hatchesSealed, setHatchesSealed] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<CameraPreset>('perspective');
  const [lighting, setLighting] = useState<LightingMode>('day');
  const [overlayWireframe, setOverlayWireframe] = useState<boolean>(false);
  const [overlayBounds, setOverlayBounds] = useState<boolean>(false);
  const [overlayDimensions, setOverlayDimensions] = useState<boolean>(true);
  const [controlsMinimized, setControlsMinimized] = useState<boolean>(false);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  // References to Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const vesselGroupRef = useRef<THREE.Group | null>(null);
  const oceanMeshRef = useRef<THREE.Mesh | null>(null);
  const oceanOrigPositionsRef = useRef<Float32Array | null>(null);
  const oceanTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const wakeGroupRef = useRef<THREE.Group | null>(null);
  const dimensionsGroupRef = useRef<THREE.Group | null>(null);
  const boundsHelperRef = useRef<THREE.BoxHelper | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const navLightsRef = useRef<THREE.Group | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const animFrameIdRef = useRef<number | null>(null);

  // Vessel Metadata Specs
  const specs = React.useMemo(() => {
    if (vesselType === 'bulk_carrier') {
      if (vesselSize === 'panamax') {
        const draft = 8.5 + (cargoLoad / 100) * 5.7; // up to 14.20m
        return {
          title: 'MV Blue Horizon (Panamax Bulk)',
          subtitle: 'Standard Neopanamax Gearless Bulk Carrier',
          loa: '225m',
          beam: '32.26m',
          draft: draft.toFixed(2) + 'm',
          draftVal: draft,
          dwt: '76,000 MT'
        };
      } else if (vesselSize === 'capesize') {
        const draft = 9.8 + (cargoLoad / 100) * 8.4; // up to 18.20m
        return {
          title: 'MV Iron Leader (Capesize Bulk)',
          subtitle: 'Standard Newcastlemax Gearless Bulk Carrier',
          loa: '292m',
          beam: '45.0m',
          draft: draft.toFixed(2) + 'm',
          draftVal: draft,
          dwt: '180,000 MT'
        };
      } else {
        const draft = 7.2 + (cargoLoad / 100) * 5.6; // up to 12.80m
        return {
          title: 'MV Queen Mary (Supramax Bulk)',
          subtitle: 'Geared Supramax Bulk Carrier (4 Deck Cranes)',
          loa: '190m',
          beam: '32.2m',
          draft: draft.toFixed(2) + 'm',
          draftVal: draft,
          dwt: '58,000 MT'
        };
      }
    } else if (vesselType === 'container_ship') {
      const draft = 9.0 + (cargoLoad / 100) * 6.5; // up to 15.50m
      return {
        title: 'MV Pacific Sentinel (Container)',
        subtitle: 'Post-Panamax Cellular Container Carrier (14,500 TEU)',
        loa: '366m',
        beam: '51.2m',
        draft: draft.toFixed(2) + 'm',
        draftVal: draft,
        dwt: '145,000 MT'
      };
    } else {
      const draft = 11.5 + (cargoLoad / 100) * 10.0; // up to 21.50m
      return {
        title: 'MV Ocean Pioneer (VLCC Tanker)',
        subtitle: 'Double-Hull Very Large Crude Carrier (2M Bbls)',
        loa: '333m',
        beam: '60.0m',
        draft: draft.toFixed(2) + 'm',
        draftVal: draft,
        dwt: '300,000 MT'
      };
    }
  }, [vesselType, vesselSize, cargoLoad]);

  // Port Clearance Calculation (Paradip Port Default 14.5m limit)
  const portLimit = initialPortDraftLimit;
  const clearance = portLimit - specs.draftVal;
  const clearanceText = clearance >= 0 ? `+${clearance.toFixed(1)}m` : `${clearance.toFixed(1)}m`;
  const isPortSafe = clearance >= 0.8;
  const isPortConditional = clearance >= 0 && clearance < 0.8;

  // Create Procedural Chevron Wave Texture for Ocean Surface
  const createOceanChevronTexture = useCallback((): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Deep ocean blue backdrop
    ctx.fillStyle = '#06172d';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle rhythmic tile grid lines
    ctx.strokeStyle = '#082240';
    ctx.lineWidth = 1;
    const cellSize = 64;
    for (let x = 0; x <= 512; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Repeating chevron wake/wave ripples « / v in each cell
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.32)';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let x = 0; x < 512; x += cellSize) {
      for (let y = 0; y < 512; y += cellSize) {
        const cx = x + cellSize / 2;
        const cy = y + cellSize / 2;

        // Primary chevron
        ctx.beginPath();
        ctx.moveTo(cx - 9, cy + 6);
        ctx.lineTo(cx, cy - 6);
        ctx.lineTo(cx + 9, cy + 6);
        ctx.stroke();

        // Secondary subtle echo chevron
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy + 12);
        ctx.lineTo(cx, cy + 3);
        ctx.lineTo(cx + 5, cy + 12);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 12);
    return texture;
  }, []);

  // Procedural Vessel Geometry Builder
  const buildVesselGeometry = useCallback((
    type: Vessel3DType, 
    size: VesselSizeType, 
    loadRatio: number, 
    wireframe: boolean,
    sealedHatches: boolean
  ): THREE.Group => {
    const group = new THREE.Group();
    group.name = 'vessel_root';

    // Length, beam, depth scaled by size/type
    let length = 68;
    let beam = 11.5;
    let depth = 8.5;

    if (type === 'bulk_carrier') {
      if (size === 'panamax') {
        length = 68;
        beam = 11.2;
        depth = 8.4;
      } else if (size === 'capesize') {
        length = 84;
        beam = 14.2;
        depth = 9.8;
      } else {
        length = 58;
        beam = 10.4;
        depth = 7.8;
      }
    } else if (type === 'container_ship') {
      length = 86;
      beam = 13.8;
      depth = 9.2;
    } else {
      length = 82;
      beam = 15.5;
      depth = 10.0;
    }

    // Material definitions
    const hullRedMat = new THREE.MeshStandardMaterial({
      color: 0x881337, // Anti-fouling red lower hull
      roughness: 0.35,
      metalness: 0.2,
      wireframe
    });

    const hullDarkMat = new THREE.MeshStandardMaterial({
      color: type === 'container_ship' ? 0x0f4c5c : 0x1e293b, // Dark charcoal slate
      roughness: 0.4,
      metalness: 0.25,
      wireframe
    });

    const bootToppingMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Amber/yellow waterline stripe
      roughness: 0.3,
      metalness: 0.4,
      wireframe
    });

    const deckMat = new THREE.MeshStandardMaterial({
      color: type === 'oil_tanker' ? 0x7c2d12 : 0x334155,
      roughness: 0.55,
      metalness: 0.15,
      wireframe
    });

    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25,
      metalness: 0.1,
      wireframe
    });

    const hatchCoverMat = new THREE.MeshStandardMaterial({
      color: 0x9a3412, // Rust/reddish-brown hatch covers
      roughness: 0.5,
      metalness: 0.25,
      wireframe
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.8,
      wireframe
    });

    const bronzeMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.3,
      metalness: 0.8,
      wireframe
    });

    // 1. Lower Hull (Red below waterline)
    const lowerHullGeo = new THREE.BoxGeometry(length, depth * 0.46, beam);
    const lowerHull = new THREE.Mesh(lowerHullGeo, hullRedMat);
    lowerHull.position.y = depth * 0.23;
    lowerHull.castShadow = true;
    lowerHull.receiveShadow = true;
    group.add(lowerHull);

    // Bulbous Bow
    const bulbousGeo = new THREE.SphereGeometry(beam * 0.32, 16, 16);
    bulbousGeo.scale(2.4, 1.0, 0.85);
    const bulbous = new THREE.Mesh(bulbousGeo, hullRedMat);
    bulbous.position.set(length * 0.51, depth * 0.18, 0);
    bulbous.castShadow = true;
    group.add(bulbous);

    // 2. Waterline Boot-Topping Stripe (Yellow/Amber line)
    const stripeGeo = new THREE.BoxGeometry(length * 1.002, 0.35, beam * 1.005);
    const stripe = new THREE.Mesh(stripeGeo, bootToppingMat);
    stripe.position.y = depth * 0.48;
    group.add(stripe);

    // 3. Upper Hull (Dark Charcoal Topsides)
    const upperHullGeo = new THREE.BoxGeometry(length * 0.98, depth * 0.52, beam);
    const upperHull = new THREE.Mesh(upperHullGeo, hullDarkMat);
    upperHull.position.y = depth * 0.74;
    upperHull.castShadow = true;
    upperHull.receiveShadow = true;
    group.add(upperHull);

    // 4. Main Deck
    const deckGeo = new THREE.BoxGeometry(length * 0.94, 0.3, beam * 0.96);
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = depth;
    deck.receiveShadow = true;
    group.add(deck);

    // Forecastle Breakwater
    const breakwaterGeo = new THREE.BoxGeometry(0.8, 1.4, beam * 0.65);
    const breakwater = new THREE.Mesh(breakwaterGeo, whiteMat);
    breakwater.position.set(length * 0.43, depth + 0.7, 0);
    breakwater.rotation.y = Math.PI / 4;
    group.add(breakwater);

    // 5. Cargo Holds & Hatches
    if (type === 'bulk_carrier') {
      const hatchCount = size === 'capesize' ? 7 : 5;
      const hatchSpan = (length * 0.62) / hatchCount;
      const startX = -length * 0.22;

      for (let i = 0; i < hatchCount; i++) {
        const xPos = startX + i * hatchSpan;

        // Coaming
        const coamingGeo = new THREE.BoxGeometry(hatchSpan * 0.76, 0.8, beam * 0.72);
        const coaming = new THREE.Mesh(coamingGeo, hullDarkMat);
        coaming.position.set(xPos, depth + 0.4, 0);
        coaming.castShadow = true;
        group.add(coaming);

        // Hatch Cover
        const coverGeo = new THREE.BoxGeometry(hatchSpan * 0.72, 0.35, beam * 0.68);
        const cover = new THREE.Mesh(coverGeo, hatchCoverMat);
        const coverZOffset = !sealedHatches && (i % 2 === 1) ? beam * 0.38 : 0;
        cover.position.set(xPos, depth + 0.85, coverZOffset);
        cover.castShadow = true;
        group.add(cover);

        // Dark iron ore inside hold if opened
        if (!sealedHatches) {
          const oreGeo = new THREE.BoxGeometry(hatchSpan * 0.68, 0.25, beam * 0.6);
          const oreMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.95 });
          const ore = new THREE.Mesh(oreGeo, oreMat);
          ore.position.set(xPos, depth + 0.3, 0);
          group.add(ore);
        }
      }

      // If Supramax, add 4 electro-hydraulic cranes
      if (size === 'supramax') {
        for (let c = 0; c < 4; c++) {
          const craneX = -length * 0.24 + c * (length * 0.17);
          const pedGeo = new THREE.CylinderGeometry(0.7, 0.85, 2.2, 12);
          const ped = new THREE.Mesh(pedGeo, whiteMat);
          ped.position.set(craneX, depth + 1.1, 0);
          group.add(ped);

          const jibGeo = new THREE.CylinderGeometry(0.18, 0.22, 6.5, 8);
          jibGeo.rotateZ(Math.PI / 3);
          const jib = new THREE.Mesh(jibGeo, hatchCoverMat);
          jib.position.set(craneX + 2.4, depth + 4.2, 0);
          group.add(jib);
        }
      }
    } else if (type === 'container_ship') {
      const colors = [0x0284c7, 0x15803d, 0xea580c, 0x1e3a8a, 0xe11d48, 0xca8a04];
      const bayCount = 8;
      const baySpan = (length * 0.64) / bayCount;
      const tiers = Math.max(1, Math.round(5 * loadRatio));

      for (let b = 0; b < bayCount; b++) {
        const bayX = -length * 0.22 + b * baySpan;
        for (let row = -2; row <= 2; row++) {
          const rowZ = row * (beam * 0.17);
          for (let t = 0; t < tiers; t++) {
            const col = colors[(b * 2 + row + t + 10) % colors.length];
            const boxGeo = new THREE.BoxGeometry(baySpan * 0.88, 1.2, beam * 0.15);
            const boxMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, wireframe });
            const box = new THREE.Mesh(boxGeo, boxMat);
            box.position.set(bayX, depth + 0.6 + t * 1.22, rowZ);
            box.castShadow = true;
            group.add(box);
          }
        }
      }
    } else {
      // Oil Tanker Manifolds & Catwalk
      const catwalkGeo = new THREE.BoxGeometry(length * 0.7, 0.4, 1.4);
      const catwalk = new THREE.Mesh(catwalkGeo, whiteMat);
      catwalk.position.set(0, depth + 1.2, 0);
      group.add(catwalk);

      const manifoldGeo = new THREE.BoxGeometry(4.2, 2.0, beam * 0.82);
      const manifold = new THREE.Mesh(manifoldGeo, hatchCoverMat);
      manifold.position.set(0, depth + 1.0, 0);
      group.add(manifold);
    }

    // 6. Superstructure & Bridge Block at Stern
    const bridgeX = -length * 0.38;
    const superstructureHeight = 8.5;

    const deckhouseGeo = new THREE.BoxGeometry(length * 0.15, superstructureHeight, beam * 0.74);
    const deckhouse = new THREE.Mesh(deckhouseGeo, whiteMat);
    deckhouse.position.set(bridgeX, depth + superstructureHeight * 0.5, 0);
    deckhouse.castShadow = true;
    deckhouse.receiveShadow = true;
    group.add(deckhouse);

    const wheelhouseGeo = new THREE.BoxGeometry(length * 0.11, 2.2, beam * 0.86);
    const wheelhouse = new THREE.Mesh(wheelhouseGeo, whiteMat);
    wheelhouse.position.set(bridgeX + 0.4, depth + superstructureHeight + 1.1, 0);
    wheelhouse.castShadow = true;
    group.add(wheelhouse);

    const glassGeo = new THREE.BoxGeometry(length * 0.10, 0.9, beam * 0.87);
    const bridgeGlass = new THREE.Mesh(glassGeo, glassMat);
    bridgeGlass.position.set(bridgeX + 0.5, depth + superstructureHeight + 1.2, 0);
    group.add(bridgeGlass);

    const mastGeo = new THREE.CylinderGeometry(0.2, 0.35, 5.5, 8);
    const mast = new THREE.Mesh(mastGeo, whiteMat);
    mast.position.set(bridgeX, depth + superstructureHeight + 4.8, 0);
    group.add(mast);

    const radarGeo = new THREE.BoxGeometry(0.3, 0.2, 3.2);
    const radar = new THREE.Mesh(radarGeo, hatchCoverMat);
    radar.position.set(bridgeX, depth + superstructureHeight + 6.5, 0);
    radar.name = 'radar_scanner';
    group.add(radar);

    const funnelGeo = new THREE.CylinderGeometry(1.2, 1.5, 5.8, 16);
    funnelGeo.scale(1.3, 1.0, 0.9);
    const funnelMat = new THREE.MeshStandardMaterial({ color: 0x0f2942, roughness: 0.35, wireframe });
    const funnel = new THREE.Mesh(funnelGeo, funnelMat);
    funnel.position.set(bridgeX - length * 0.05, depth + superstructureHeight + 1.4, 0);
    funnel.castShadow = true;
    group.add(funnel);

    // 7. Stern Screw Propeller & Rudder
    const propGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.35, 4);
    propGeo.rotateZ(Math.PI / 2);
    const propeller = new THREE.Mesh(propGeo, bronzeMat);
    propeller.position.set(-length * 0.49, depth * 0.2, 0);
    propeller.name = 'propeller';
    group.add(propeller);

    const rudderGeo = new THREE.BoxGeometry(2.0, depth * 0.45, 0.35);
    const rudder = new THREE.Mesh(rudderGeo, hullRedMat);
    rudder.position.set(-length * 0.48, depth * 0.25, 0);
    group.add(rudder);

    // Hydrostatic Draft Immersion
    const waterlineDisplacementY = -depth * 0.48 - (loadRatio * 1.8);
    group.position.y = waterlineDisplacementY;

    return group;
  }, []);

  // Build Light Blue Dimension Brackets & Guidelines
  const buildDimensionLines = useCallback((length: number, beam: number, depth: number): THREE.Group => {
    const group = new THREE.Group();
    group.name = 'dimension_guides';

    const guideMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65
    });

    // Bow spray guides
    const bowLeft = [
      new THREE.Vector3(length * 0.5, 0, 0),
      new THREE.Vector3(length * 0.35, 0, beam * 0.9)
    ];
    const bowLeftGeo = new THREE.BufferGeometry().setFromPoints(bowLeft);
    group.add(new THREE.Line(bowLeftGeo, guideMat));

    const bowRight = [
      new THREE.Vector3(length * 0.5, 0, 0),
      new THREE.Vector3(length * 0.35, 0, -beam * 0.9)
    ];
    const bowRightGeo = new THREE.BufferGeometry().setFromPoints(bowRight);
    group.add(new THREE.Line(bowRightGeo, guideMat));

    // Midship beam indicator lines
    const beamLine = [
      new THREE.Vector3(0, depth + 1.5, -beam * 0.7),
      new THREE.Vector3(0, depth + 1.5, beam * 0.7)
    ];
    const beamGeo = new THREE.BufferGeometry().setFromPoints(beamLine);
    group.add(new THREE.Line(beamGeo, guideMat));

    // Stern wake guides
    const sternLeft = [
      new THREE.Vector3(-length * 0.48, 0, beam * 0.4),
      new THREE.Vector3(-length * 0.75, 0, beam * 0.9)
    ];
    const sternLeftGeo = new THREE.BufferGeometry().setFromPoints(sternLeft);
    group.add(new THREE.Line(sternLeftGeo, guideMat));

    const sternRight = [
      new THREE.Vector3(-length * 0.48, 0, -beam * 0.4),
      new THREE.Vector3(-length * 0.75, 0, -beam * 0.9)
    ];
    const sternRightGeo = new THREE.BufferGeometry().setFromPoints(sternRight);
    group.add(new THREE.Line(sternRightGeo, guideMat));

    return group;
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x061426);
    scene.fog = new THREE.FogExp2(0x071e3d, 0.0035);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, width / height, 1, 1000);
    camera.position.set(52, 28, 52);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 + 0.02;
    controls.minDistance = 18;
    controls.maxDistance = 220;
    controls.target.set(0, 3.5, 0);
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.7);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x071e3d, 0.75);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const sunLight = new THREE.DirectionalLight(0xfff8ee, 2.2);
    sunLight.position.set(65, 80, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 240;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 40;
    sunLight.shadow.camera.bottom = -40;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Navigation lights for Night mode
    const navLights = new THREE.Group();
    const portLight = new THREE.PointLight(0xef4444, 0, 15);
    portLight.position.set(-25, 14, 6);
    navLights.add(portLight);

    const stbLight = new THREE.PointLight(0x10b981, 0, 15);
    stbLight.position.set(-25, 14, -6);
    navLights.add(stbLight);

    const mastLight = new THREE.PointLight(0xffffff, 0, 25);
    mastLight.position.set(-25, 18, 0);
    navLights.add(mastLight);

    scene.add(navLights);
    navLightsRef.current = navLights;

    // Ocean Water Plane
    const oceanGeo = new THREE.PlaneGeometry(320, 320, 64, 64);
    oceanGeo.rotateX(-Math.PI / 2);
    oceanOrigPositionsRef.current = new Float32Array(oceanGeo.attributes.position.array);

    const chevronTex = createOceanChevronTexture();
    oceanTextureRef.current = chevronTex;

    const oceanMat = new THREE.MeshStandardMaterial({
      map: chevronTex,
      color: 0x0e3a68,
      roughness: 0.18,
      metalness: 0.28,
      transparent: true,
      opacity: 0.95
    });

    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.position.y = 0;
    oceanMesh.receiveShadow = true;
    scene.add(oceanMesh);
    oceanMeshRef.current = oceanMesh;

    // Wake and bow wave foam streaks
    const wakeGroup = new THREE.Group();

    // Bow wave spray streaks (two white diagonal streaks)
    const bowStreakMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });

    const bowStreakGeo = new THREE.PlaneGeometry(16, 2.2);
    bowStreakGeo.rotateX(-Math.PI / 2);
    bowStreakGeo.rotateY(Math.PI / 5);

    const bowLeftStreak = new THREE.Mesh(bowStreakGeo, bowStreakMat);
    bowLeftStreak.position.set(36, 0.06, 7);
    wakeGroup.add(bowLeftStreak);

    const bowRightGeo = new THREE.PlaneGeometry(16, 2.2);
    bowRightGeo.rotateX(-Math.PI / 2);
    bowRightGeo.rotateY(-Math.PI / 5);

    const bowRightStreak = new THREE.Mesh(bowRightGeo, bowStreakMat);
    bowRightStreak.position.set(36, 0.06, -7);
    wakeGroup.add(bowRightStreak);

    // Stern trailing wake strip
    const sternWakeGeo = new THREE.PlaneGeometry(28, 8);
    sternWakeGeo.rotateX(-Math.PI / 2);
    const sternWakeMat = new THREE.MeshBasicMaterial({
      color: 0xdbeafe,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide
    });
    const sternWake = new THREE.Mesh(sternWakeGeo, sternWakeMat);
    sternWake.position.set(-46, 0.05, 0);
    wakeGroup.add(sternWake);

    scene.add(wakeGroup);
    wakeGroupRef.current = wakeGroup;

    // Studio Grid Helper (shown in Studio Grid mode)
    const grid = new THREE.GridHelper(180, 36, 0x06b6d4, 0x1e293b);
    grid.position.y = 0;
    grid.visible = false;
    scene.add(grid);
    gridHelperRef.current = grid;

    // Vessel Group
    const vessel = buildVesselGeometry(vesselType, vesselSize, cargoLoad / 100, overlayWireframe, hatchesSealed);
    scene.add(vessel);
    vesselGroupRef.current = vessel;

    // Dimension Guidelines
    const dims = buildDimensionLines(68, 11.5, 8.5);
    dims.visible = overlayDimensions;
    scene.add(dims);
    dimensionsGroupRef.current = dims;

    // Bounds Box Helper
    const bounds = new THREE.BoxHelper(vessel, 0x06b6d4);
    bounds.visible = overlayBounds;
    scene.add(bounds);
    boundsHelperRef.current = bounds;

    // Animation Loop (~60 FPS)
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const elapsedTime = clockRef.current.getElapsedTime();

      // 1. Water surface wave displacement & texture offset
      if (oceanMeshRef.current && oceanOrigPositionsRef.current && envMode === 'ocean') {
        const positions = oceanMeshRef.current.geometry.attributes.position;
        const orig = oceanOrigPositionsRef.current;

        for (let i = 0; i < positions.count; i++) {
          const x = orig[i * 3];
          const z = orig[i * 3 + 2];

          // Multi-harmonic wave function
          const waveHeight = 
            Math.sin(x * 0.08 + elapsedTime * 1.5) * 0.45 +
            Math.cos(z * 0.06 + elapsedTime * 1.2) * 0.35 +
            Math.sin((x + z) * 0.04 + elapsedTime * 0.9) * 0.25;

          positions.setY(i, waveHeight);
        }
        positions.needsUpdate = true;

        if (Math.floor(elapsedTime * 15) % 2 === 0) {
          oceanMeshRef.current.geometry.computeVertexNormals();
        }

        // Texture gliding
        if (oceanTextureRef.current) {
          oceanTextureRef.current.offset.y += 0.0008;
        }
      }

      // 2. Vessel Buoyant Heave & Gentle Pitch
      if (vesselGroupRef.current && envMode === 'ocean') {
        const heave = Math.sin(elapsedTime * 1.4) * 0.12;
        const pitch = Math.cos(elapsedTime * 1.1) * 0.008;
        const roll = Math.sin(elapsedTime * 0.9) * 0.006;

        const baseDisplacementY = -8.5 * 0.48 - ((cargoLoad / 100) * 1.8);
        vesselGroupRef.current.position.y = baseDisplacementY + heave;
        vesselGroupRef.current.rotation.z = pitch;
        vesselGroupRef.current.rotation.x = roll;

        // Rotating radar scanner
        const radar = vesselGroupRef.current.getObjectByName('radar_scanner');
        if (radar) {
          radar.rotation.y += 0.055;
        }

        // Spinning screw propeller
        const propeller = vesselGroupRef.current.getObjectByName('propeller');
        if (propeller) {
          propeller.rotation.x += 0.15;
        }

        // Update bounds helper if visible
        if (boundsHelperRef.current && overlayBounds) {
          boundsHelperRef.current.update();
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      renderer.dispose();
      container.innerHTML = '';
    };
  }, []);

  // Update Vessel Geometry on Type, Size, Load, Wireframe, or Hatches Change
  useEffect(() => {
    if (!sceneRef.current) return;

    if (vesselGroupRef.current) {
      sceneRef.current.remove(vesselGroupRef.current);
      vesselGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          m.geometry.dispose();
        }
      });
    }

    const newVessel = buildVesselGeometry(vesselType, vesselSize, cargoLoad / 100, overlayWireframe, hatchesSealed);
    sceneRef.current.add(newVessel);
    vesselGroupRef.current = newVessel;

    // Update Bounds Helper
    if (boundsHelperRef.current) {
      sceneRef.current.remove(boundsHelperRef.current);
      const newBounds = new THREE.BoxHelper(newVessel, 0x06b6d4);
      newBounds.visible = overlayBounds;
      sceneRef.current.add(newBounds);
      boundsHelperRef.current = newBounds;
    }

    // Update Dimension Lines
    if (dimensionsGroupRef.current) {
      sceneRef.current.remove(dimensionsGroupRef.current);
      const l = vesselSize === 'capesize' ? 84 : vesselSize === 'panamax' ? 68 : 58;
      const b = vesselSize === 'capesize' ? 14.2 : vesselSize === 'panamax' ? 11.2 : 10.4;
      const newDims = buildDimensionLines(l, b, 8.5);
      newDims.visible = overlayDimensions;
      sceneRef.current.add(newDims);
      dimensionsGroupRef.current = newDims;
    }
  }, [vesselType, vesselSize, cargoLoad, overlayWireframe, hatchesSealed, buildVesselGeometry, buildDimensionLines]);

  // Update Overlays Visibility
  useEffect(() => {
    if (boundsHelperRef.current) boundsHelperRef.current.visible = overlayBounds;
    if (dimensionsGroupRef.current) dimensionsGroupRef.current.visible = overlayDimensions;
  }, [overlayBounds, overlayDimensions]);

  // Update Environment Mode (Ocean Voyage vs Studio Grid)
  useEffect(() => {
    if (oceanMeshRef.current) oceanMeshRef.current.visible = envMode === 'ocean';
    if (wakeGroupRef.current) wakeGroupRef.current.visible = envMode === 'ocean';
    if (gridHelperRef.current) gridHelperRef.current.visible = envMode === 'grid';

    if (sceneRef.current) {
      if (envMode === 'grid') {
        sceneRef.current.background = new THREE.Color(0x060c18);
        sceneRef.current.fog = new THREE.FogExp2(0x0a1428, 0.004);
      } else {
        sceneRef.current.background = new THREE.Color(0x061426);
        sceneRef.current.fog = new THREE.FogExp2(0x071e3d, 0.0035);
      }
    }
  }, [envMode]);

  // Update Lighting Mode (Day / Sunset / Night)
  useEffect(() => {
    if (!sunLightRef.current || !hemiLightRef.current || !ambientLightRef.current || !sceneRef.current) return;

    if (lighting === 'day') {
      sunLightRef.current.color.setHex(0xfff8ee);
      sunLightRef.current.intensity = 2.2;
      sunLightRef.current.position.set(65, 80, 50);

      hemiLightRef.current.color.setHex(0x7dd3fc);
      hemiLightRef.current.groundColor.setHex(0x071e3d);
      hemiLightRef.current.intensity = 0.75;

      ambientLightRef.current.color.setHex(0xdbeafe);
      ambientLightRef.current.intensity = 0.7;

      sceneRef.current.background = new THREE.Color(0x061426);
      sceneRef.current.fog = new THREE.FogExp2(0x071e3d, 0.0035);

      if (navLightsRef.current) {
        navLightsRef.current.traverse((c) => {
          if ((c as THREE.PointLight).isPointLight) (c as THREE.PointLight).intensity = 0;
        });
      }
    } else if (lighting === 'sunset') {
      sunLightRef.current.color.setHex(0xf97316);
      sunLightRef.current.intensity = 2.6;
      sunLightRef.current.position.set(85, 22, 45);

      hemiLightRef.current.color.setHex(0xfb923c);
      hemiLightRef.current.groundColor.setHex(0x1e1b4b);
      hemiLightRef.current.intensity = 0.65;

      ambientLightRef.current.color.setHex(0xf59e0b);
      ambientLightRef.current.intensity = 0.55;

      sceneRef.current.background = new THREE.Color(0x190c1f);
      sceneRef.current.fog = new THREE.FogExp2(0x221124, 0.004);

      if (navLightsRef.current) {
        navLightsRef.current.traverse((c) => {
          if ((c as THREE.PointLight).isPointLight) (c as THREE.PointLight).intensity = 1.2;
        });
      }
    } else {
      // Night
      sunLightRef.current.color.setHex(0x94a3b8);
      sunLightRef.current.intensity = 0.45;
      sunLightRef.current.position.set(50, 60, 40);

      hemiLightRef.current.color.setHex(0x38bdf8);
      hemiLightRef.current.groundColor.setHex(0x020617);
      hemiLightRef.current.intensity = 0.3;

      ambientLightRef.current.color.setHex(0x1e293b);
      ambientLightRef.current.intensity = 0.25;

      sceneRef.current.background = new THREE.Color(0x020617);
      sceneRef.current.fog = new THREE.FogExp2(0x050c18, 0.0045);

      if (navLightsRef.current) {
        navLightsRef.current.traverse((c) => {
          if ((c as THREE.PointLight).isPointLight) (c as THREE.PointLight).intensity = 3.5;
        });
      }
    }
  }, [lighting]);

  // Handle Camera Presets
  const handleSetCameraPreset = (preset: CameraPreset) => {
    setActiveView(preset);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    controls.target.set(0, 3.0, 0);

    switch (preset) {
      case 'perspective':
        camera.position.set(50, 26, 48);
        break;
      case 'bow':
        camera.position.set(70, 12, 0);
        controls.target.set(15, 2, 0);
        break;
      case 'port':
        camera.position.set(0, 14, 66);
        break;
      case 'starboard':
        camera.position.set(0, 14, -66);
        break;
      case 'stern':
        camera.position.set(-68, 16, 0);
        controls.target.set(-10, 2, 0);
        break;
      case 'top':
        camera.position.set(0, 85, 0.1);
        break;
      case 'bridge':
        camera.position.set(-26, 17, 16);
        controls.target.set(-20, 8, 0);
        break;
    }
    controls.update();
  };

  const handleFitModel = () => {
    handleSetCameraPreset('perspective');
  };

  const handleResetView = () => {
    handleSetCameraPreset('perspective');
  };

  const handleVesselTypeSelect = (type: Vessel3DType) => {
    setVesselType(type);
    onVesselChange?.(type, vesselSize);
  };

  const handleVesselSizeSelect = (size: VesselSizeType) => {
    setVesselSize(size);
    onVesselChange?.(vesselType, size);
  };

  const handleLoadSlider = (val: number) => {
    setCargoLoad(val);
    onCargoLoadChange?.(val);
  };

  return (
    <div className="flex flex-col w-full bg-[#040b16] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-sans select-none">
      {/* ========================================================================= */}
      {/* 1. TOP STUDIO HEADER BAR (Matches Photograph Header) */}
      {/* ========================================================================= */}
      <div className="bg-[#050e1d] border-b border-slate-800/80 px-4 py-3 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3">
        {/* Left: Studio Title & Vessel Type Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <Ship className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              NaviFreight 3D Vessel Digital Twin Studio
            </h1>
          </div>

          <div className="flex items-center gap-1.5 bg-[#08172c] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleVesselTypeSelect('bulk_carrier')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                vesselType === 'bulk_carrier'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Ship className="w-3.5 h-3.5" />
              <span>Bulk Carrier</span>
            </button>

            <button
              onClick={() => handleVesselTypeSelect('container_ship')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                vesselType === 'container_ship'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-emerald-400" />
              <span>Container Ship</span>
            </button>

            <button
              onClick={() => handleVesselTypeSelect('oil_tanker')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                vesselType === 'oil_tanker'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Droplet className="w-3.5 h-3.5 text-amber-400" />
              <span>Oil Tanker</span>
            </button>
          </div>
        </div>

        {/* Right: SIZE Pills + Mode Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-between xl:justify-end">
          {/* SIZE selector */}
          <div className="flex items-center gap-1.5 bg-[#08172c] px-2.5 py-1 rounded-xl border border-slate-800">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wide mr-1">
              SIZE:
            </span>
            {(['panamax', 'capesize', 'supramax'] as VesselSizeType[]).map((sz) => (
              <button
                key={sz}
                onClick={() => handleVesselSizeSelect(sz)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  vesselSize === sz
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>

          {/* Mode Toggles */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setEnvMode('ocean')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                envMode === 'ocean'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-[#08172c] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span>Ocean Voyage</span>
            </button>

            <button
              onClick={() => setEnvMode('grid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                envMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-[#08172c] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Studio Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN 3D VIEWPORT WITH FLOATING HUD CARDS (Matches Photograph Viewport) */}
      {/* ========================================================================= */}
      <div className="relative w-full h-[540px] sm:h-[620px] lg:h-[720px] overflow-hidden bg-gradient-to-b from-[#061426] via-[#051121] to-[#040c18]">
        {/* WebGL Canvas Container */}
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* WebGL Not Supported Fallback */}
        {!webglSupported && (
          <div className="absolute inset-0 bg-[#061426] flex items-center justify-center p-6 text-center text-white z-50">
            <div className="max-w-md bg-slate-900/90 border border-slate-800 p-6 rounded-2xl">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <h3 className="text-base font-bold">WebGL Hardware Acceleration Required</h3>
              <p className="text-xs text-slate-400 mt-2">
                Please enable hardware acceleration in your browser settings to inspect the Three.js 3D vessel studio.
              </p>
            </div>
          </div>
        )}

        {/* TOP-LEFT FLOATING HUD CARDS (Matches Photograph Top Left) */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto max-w-sm">
          {/* Card 1: Vessel Identity */}
          <div className="bg-[#071325]/85 backdrop-blur-md border border-slate-700/60 rounded-xl p-3 shadow-xl">
            <div className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="font-bold text-white text-xs sm:text-sm tracking-tight leading-snug">
                {specs.title}
              </div>
            </div>
            <div className="text-[11px] text-cyan-300/80 font-medium mt-0.5 pl-6">
              {specs.subtitle}
            </div>
          </div>

          {/* Card 2: Vessel Dimensions */}
          <div className="bg-[#071325]/85 backdrop-blur-md border border-slate-700/60 rounded-lg px-3 py-1.5 shadow-md self-start text-xs font-mono text-slate-300">
            <span>LOA: <strong>{specs.loa}</strong></span>
            <span className="mx-1.5 text-slate-500">•</span>
            <span>Beam: <strong>{specs.beam}</strong></span>
            <span className="mx-1.5 text-slate-500">•</span>
            <span>Draft: <strong className="text-amber-400">{specs.draft}</strong></span>
          </div>

          {/* Card 3: Port Limit Warning Alert Box */}
          <div className={`backdrop-blur-md border rounded-xl p-3 shadow-xl self-start max-w-xs ${
            isPortSafe
              ? 'bg-[#042416]/85 border-emerald-500/50 text-emerald-200'
              : isPortConditional
              ? 'bg-[#2b1704]/90 border-amber-500/60 text-amber-200'
              : 'bg-[#2d070b]/90 border-rose-500/60 text-rose-200'
          }`}>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {initialDestPortName}: {isPortSafe ? 'Safe Clearance' : isPortConditional ? 'Conditional' : 'Restricted'}
              </span>
            </div>
            <div className="text-[11px] text-amber-200/90 font-mono mt-0.5">
              Port Limit: {portLimit.toFixed(1)}m Draft • Clearance: {clearanceText}
            </div>
          </div>
        </div>

        {/* TOP-RIGHT FLOATING BUTTONS (Matches Photograph Top Right) */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleFitModel}
            className="bg-[#071325]/85 hover:bg-[#0c1f38] backdrop-blur-md border border-slate-700/70 hover:border-slate-500 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg cursor-pointer transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fit Model</span>
          </button>

          <button
            onClick={handleResetView}
            className="bg-[#071325]/85 hover:bg-[#0c1f38] backdrop-blur-md border border-slate-700/70 hover:border-slate-500 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg cursor-pointer transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reset View</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 3. BOTTOM FLOATING CONTROLS DOCK (Matches Photograph Bottom Dock) */}
        {/* ========================================================================= */}
        <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col items-center pointer-events-auto">
          {/* Centered Minimize/Expand Pill Toggle */}
          <button
            onClick={() => setControlsMinimized(!controlsMinimized)}
            className="mb-2 bg-[#071325]/90 hover:bg-[#0c1f38] backdrop-blur-md border border-slate-700/70 text-slate-300 hover:text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            {controlsMinimized ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Expand Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                <span>Minimize Controls (Full Screen Model)</span>
              </>
            )}
          </button>

          {/* Expanded Control Dock Card */}
          {!controlsMinimized && (
            <div className="w-full max-w-5xl bg-[#061224]/92 backdrop-blur-xl border border-slate-700/70 rounded-2xl p-4 shadow-2xl space-y-3.5 animate-fadeIn">
              {/* Row 1: Cargo Loading Slider + Sealed Hatches Toggle */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-xl">
                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider shrink-0">
                    CARGO LOADING:
                  </span>
                  <div className="flex items-center gap-2.5 flex-1">
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={cargoLoad}
                      onChange={(e) => handleLoadSlider(Number(e.target.value))}
                      className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <span className="text-xs font-mono font-black text-cyan-400 w-10 shrink-0">
                      {cargoLoad}%
                    </span>
                  </div>
                </div>

                {/* Hatches Sealed / Open Button */}
                <button
                  onClick={() => setHatchesSealed(!hatchesSealed)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                    hatchesSealed
                      ? 'bg-[#08172c] hover:bg-[#0c223f] border-slate-700 text-slate-200'
                      : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500 text-amber-300'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{hatchesSealed ? 'Hatches Sealed' : 'Hatches Open'}</span>
                </button>
              </div>

              {/* Row 2: View Presets & Overlays */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                {/* Left: View Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mr-1">
                    VIEW:
                  </span>
                  {[
                    { id: 'perspective', label: '3/4 Perspective' },
                    { id: 'bow', label: 'Bow Front' },
                    { id: 'port', label: 'Port Side' },
                    { id: 'starboard', label: 'Starboard' },
                    { id: 'stern', label: 'Stern Aft' },
                    { id: 'top', label: 'Top Plan' },
                    { id: 'bridge', label: 'Bridge Deck' },
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleSetCameraPreset(v.id as CameraPreset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        activeView === v.id
                          ? 'bg-[#0e2c4f] border border-cyan-400 text-cyan-300 shadow-xs'
                          : 'bg-[#08172c] border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>

                {/* Right: Overlays */}
                <div className="flex items-center gap-1.5 self-end lg:self-auto">
                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mr-1">
                    OVERLAYS:
                  </span>
                  <button
                    onClick={() => setOverlayWireframe(!overlayWireframe)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                      overlayWireframe
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-xs'
                        : 'bg-[#08172c] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Wireframe
                  </button>

                  <button
                    onClick={() => setOverlayBounds(!overlayBounds)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                      overlayBounds
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-xs'
                        : 'bg-[#08172c] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Bounds
                  </button>

                  <button
                    onClick={() => setOverlayDimensions(!overlayDimensions)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                      overlayDimensions
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-xs'
                        : 'bg-[#08172c] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Dimensions
                  </button>
                </div>
              </div>

              {/* Row 3: Lighting Modes */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mr-1">
                  LIGHTING:
                </span>
                <button
                  onClick={() => setLighting('day')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    lighting === 'day'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-[#08172c] border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Day</span>
                </button>

                <button
                  onClick={() => setLighting('sunset')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    lighting === 'sunset'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-[#08172c] border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Sunset className="w-3.5 h-3.5" />
                  <span>Sunset</span>
                </button>

                <button
                  onClick={() => setLighting('night')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    lighting === 'night'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-[#08172c] border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Night</span>
                </button>
              </div>

              {/* Subtext Note Matching Photo */}
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-1">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>
                  Full 3D digital twin simulation with PBR lighting and hydrodynamic kinematics. Illustrative volumetric loading simulation.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
