import React, { useState, useMemo, useEffect } from 'react';
import { ForecastPoint, Port } from '../types';
import { PORTS_DATABASE } from '../data/maritimeData';
import { getRouteDistance } from '../utils/freightCalculator';

export interface FreightChartProps {
  originId?: string;
  destId?: string;
  selectedRouteKey?: string;
  routeName?: string;
  vesselClass?: string;
  commodityId?: string;
  horizonDays?: 30 | 60 | 90;
  bunkerPriceUSD?: number;
  marketVolatilityShock?: number;
  height?: number;
  data?: ForecastPoint[];
  onRateCalculated?: (rates: {
    currentRate: number;
    forecastRate: number;
    deltaPct: number;
    uncertainty: number;
    targetMonthLabel: string;
    timeSeries: ForecastPoint[];
  }) => void;
}

// Routes dataset aligned with User Specification & Shared HTML
const PREDEFINED_ROUTES: [string, number, number, number][] = [
  ['Australia → Paradip Port (14.5m)', 25, 1.2, 0.00],
  ['Australia → Visakhapatnam Outer (18.5m)', 27, 1.5, 0.05],
  ['Australia → Dhamra Port (18.5m)', 26.5, 1.4, 0.04],
  ['Australia → Gangavaram Port (19.5m)', 28, 1.6, 0.06],
  ['Australia → Haldia Dock (8.5m Tidal)', 31, 1.8, 0.08],
  ['Australia → Kamarajar (Ennore 15.5m)', 29, 1.5, 0.05],
  ['Newcastle → Visakhapatnam (Coking Coal)', 24, 1.3, 0.02],
  ['Newcastle → Dhamra Port (Capesize)', 21, 1.1, 0.01],
  ['Newcastle → Kamarajar (Ennore)', 25.5, 1.4, 0.03],
  ['Richards Bay → Dhamra (Thermal Coal)', 19, 1.2, -0.02],
  ['Richards Bay → Gangavaram Port', 20, 1.2, -0.01],
  ['Richards Bay → Paradip Port', 18.5, 1.1, -0.02],
  ['Dalrymple Bay → Haldia Dock (Met Coal)', 30, 1.7, 0.07],
  ['Dalrymple Bay → Paradip Port', 26, 1.3, 0.03],
  // United States Routes
  ['Norfolk → Paradip Port (Met Coal)', 48.5, 2.4, 0.04],
  ['Norfolk → Visakhapatnam Outer (18.5m)', 47.0, 2.2, 0.03],
  ['Norfolk → Dhamra Port (Capesize)', 49.0, 2.4, 0.05],
  ['Baltimore → Visakhapatnam Outer', 48.0, 2.3, 0.04],
  ['Houston → Paradip Port', 52.0, 2.6, 0.05],
  ['New Orleans → Paradip Port', 50.5, 2.5, 0.04],
  ['Los Angeles → Mundra Port', 54.0, 2.7, 0.05],
  // Ukraine Black Sea Routes
  ['Odesa → Paradip Port (Grain & Agri)', 31.5, 1.8, 0.03],
  ['Odesa → Visakhapatnam Outer', 30.5, 1.7, 0.02],
  ['Pivdennyi → Dhamra Port (Iron Ore Pellets)', 32.5, 1.9, 0.03],
  ['Pivdennyi → Paradip Port', 32.0, 1.8, 0.03],
  ['Chornomorsk → Visakhapatnam Inner', 31.0, 1.7, 0.02],
];

// Deterministic PRNG from user's HTML specification
function rng(s: number) {
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const START = { y: 2024, m: 0 };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const label = (k: number) => {
  const t = START.m + k;
  return `${MON[t % 12]} ${START.y + Math.floor(t / 12)}`;
};

export const FreightChart: React.FC<FreightChartProps> = ({
  originId = 'port_hedland',
  destId = 'paradip',
  selectedRouteKey,
  routeName,
  vesselClass = 'Panamax',
  commodityId = 'iron_ore',
  horizonDays = 30,
  bunkerPriceUSD = 624,
  marketVolatilityShock = 0,
  height = 250,
  data,
  onRateCalculated,
}) => {
  const [hoverPoint, setHoverPoint] = useState<{
    label: string;
    rate: number;
    isForecast: boolean;
    uncertainty?: number;
  } | null>(null);

  // 1. Resolve Route Configuration & Parameters
  const routeConfig = useMemo(() => {
    // A. Direct key-to-route lookup if selectedRouteKey is given
    const keyToPredefinedMap: Record<string, string> = {
      australia_east_coast: 'Australia → Paradip Port (14.5m)',
      hedland_paradip: 'Australia → Paradip Port (14.5m)',
      hedland_vizag: 'Australia → Visakhapatnam Outer (18.5m)',
      hedland_dhamra: 'Australia → Dhamra Port (18.5m)',
      hedland_gangavaram: 'Australia → Gangavaram Port (19.5m)',
      hedland_haldia: 'Australia → Haldia Dock (8.5m Tidal)',
      hedland_kamarajar: 'Australia → Kamarajar (Ennore 15.5m)',
      newcastle_vizag: 'Newcastle → Visakhapatnam (Coking Coal)',
      newcastle_dhamra: 'Newcastle → Dhamra Port (Capesize)',
      newcastle_kamarajar: 'Newcastle → Kamarajar (Ennore)',
      richardsbay_dhamra: 'Richards Bay → Dhamra (Thermal Coal)',
      richardsbay_gangavaram: 'Richards Bay → Gangavaram Port',
      richardsbay_paradip: 'Richards Bay → Paradip Port',
      dalrymple_haldia: 'Dalrymple Bay → Haldia Dock (Met Coal)',
      dalrymple_paradip: 'Dalrymple Bay → Paradip Port',
      norfolk_paradip: 'Norfolk → Paradip Port (Met Coal)',
      norfolk_vizag: 'Norfolk → Visakhapatnam Outer (18.5m)',
      norfolk_dhamra: 'Norfolk → Dhamra Port (Capesize)',
      baltimore_vizag: 'Baltimore → Visakhapatnam Outer',
      houston_paradip: 'Houston → Paradip Port',
      neworleans_paradip: 'New Orleans → Paradip Port',
      losangeles_mundra: 'Los Angeles → Mundra Port',
      odesa_paradip: 'Odesa → Paradip Port (Grain & Agri)',
      odesa_vizag: 'Odesa → Visakhapatnam Outer',
      pivdennyi_dhamra: 'Pivdennyi → Dhamra Port (Iron Ore Pellets)',
      pivdennyi_paradip: 'Pivdennyi → Paradip Port',
      chornomorsk_vizag: 'Chornomorsk → Visakhapatnam Inner',
    };

    const targetRouteName = (selectedRouteKey && keyToPredefinedMap[selectedRouteKey]) || routeName;

    // B. Check if targetRouteName matches any in PREDEFINED_ROUTES
    if (targetRouteName) {
      const clean = targetRouteName.replace(/^Route:\s*/i, '').trim().toLowerCase();
      const byName = PREDEFINED_ROUTES.find(([name]) => {
        const n = name.toLowerCase();
        return clean.includes(n) || n.includes(clean);
      });
      if (byName) {
        return {
          name: byName[0],
          base: byName[1],
          vol: byName[2],
          drift: byName[3],
          index: PREDEFINED_ROUTES.indexOf(byName),
        };
      }
    }

    // C. Fallback to matching originId and destId against PORTS_DATABASE
    const originPort = PORTS_DATABASE.find(p => p.id === originId) || PORTS_DATABASE[0];
    const destPort = PORTS_DATABASE.find(p => p.id === destId) || PORTS_DATABASE[1];
    const originCountry = originPort.country;

    const matched = PREDEFINED_ROUTES.find(([name]) => {
      const lower = name.toLowerCase();
      if ((originId === 'newcastle' || originPort.id === 'newcastle') && lower.includes('newcastle')) {
        if ((destId.includes('vizag') || destPort.id.includes('vizag')) && lower.includes('visakhapatnam')) return true;
        if ((destId === 'dhamra' || destPort.id === 'dhamra') && lower.includes('dhamra')) return true;
        if ((destId === 'kamarajar' || destPort.id === 'kamarajar') && lower.includes('kamarajar')) return true;
      }
      if ((originId === 'dalrymple_bay' || originPort.id === 'dalrymple_bay') && lower.includes('dalrymple')) {
        if ((destId === 'haldia' || destPort.id === 'haldia') && lower.includes('haldia')) return true;
        if ((destId === 'paradip' || destPort.id === 'paradip') && lower.includes('paradip')) return true;
      }
      if ((originId === 'richards_bay' || originPort.id === 'richards_bay') && lower.includes('richards bay')) {
        if ((destId === 'dhamra' || destPort.id === 'dhamra') && lower.includes('dhamra')) return true;
        if ((destId === 'gangavaram' || destPort.id === 'gangavaram') && lower.includes('gangavaram')) return true;
        if ((destId === 'paradip' || destPort.id === 'paradip') && lower.includes('paradip')) return true;
      }
      if ((originId === 'norfolk' || originPort.id === 'norfolk') && lower.includes('norfolk')) {
        if ((destId === 'paradip' || destPort.id === 'paradip') && lower.includes('paradip')) return true;
        if ((destId.includes('vizag') || destPort.id.includes('vizag')) && lower.includes('visakhapatnam')) return true;
        if ((destId === 'dhamra' || destPort.id === 'dhamra') && lower.includes('dhamra')) return true;
      }
      if ((originId === 'baltimore' || originPort.id === 'baltimore') && lower.includes('baltimore')) {
        if ((destId.includes('vizag') || destPort.id.includes('vizag')) && lower.includes('visakhapatnam')) return true;
      }
      if ((originId === 'houston' || originPort.id === 'houston') && lower.includes('houston')) {
        if ((destId === 'paradip' || destPort.id === 'paradip') && lower.includes('paradip')) return true;
      }
      if ((originId === 'new_orleans' || originPort.id === 'new_orleans') && (lower.includes('new orleans') || lower.includes('neworleans'))) {
        if ((destId === 'paradip' || destPort.id === 'paradip') && lower.includes('paradip')) return true;
      }
      if ((originId === 'los_angeles' || originPort.id === 'los_angeles') && lower.includes('los angeles')) {
        if (destId === 'mundra' || destPort.id === 'mundra') return true;
      }
      if ((originId === 'odesa' || originPort.id === 'odesa') && lower.includes('odesa')) {
        if ((destId === 'paradip' || destPort.id === 'paradip') && lower.includes('paradip')) return true;
        if ((destId.includes('vizag') || destPort.id.includes('vizag')) && lower.includes('visakhapatnam')) return true;
      }
      if ((originId === 'pivdennyi' || originPort.id === 'pivdennyi') && lower.includes('pivdennyi')) {
        if ((destId === 'dhamra' || destPort.id === 'dhamra') && lower.includes('dhamra')) return true;
        if ((destId === 'paradip' || destPort.id === 'paradip') && lower.includes('paradip')) return true;
      }
      if ((originId === 'chornomorsk' || originPort.id === 'chornomorsk') && lower.includes('chornomorsk')) {
        if ((destId.includes('vizag') || destPort.id.includes('vizag')) && lower.includes('visakhapatnam')) return true;
      }
      if ((originCountry === 'Australia' || originId === 'port_hedland') && lower.includes('australia')) {
        if ((destId === 'paradip' || destPort.id === 'paradip') && lower.includes('paradip')) return true;
        if ((destId.includes('vizag') || destPort.id.includes('vizag')) && lower.includes('visakhapatnam')) return true;
        if ((destId === 'dhamra' || destPort.id === 'dhamra') && lower.includes('dhamra')) return true;
        if ((destId === 'gangavaram' || destPort.id === 'gangavaram') && lower.includes('gangavaram')) return true;
        if ((destId === 'haldia' || destPort.id === 'haldia') && lower.includes('haldia')) return true;
        if ((destId === 'kamarajar' || destPort.id === 'kamarajar') && lower.includes('kamarajar')) return true;
      }
      return false;
    });

    if (matched) {
      return {
        name: matched[0],
        base: matched[1],
        vol: matched[2],
        drift: matched[3],
        index: PREDEFINED_ROUTES.indexOf(matched),
      };
    }

    // Dynamic generation for ANY origin and destination among 50 ports
    const dist = getRouteDistance(originId, destId);
    let baseRate = Number((dist * 0.0051 + 1.2).toFixed(1));

    // Adjust for vessel class
    if (vesselClass === 'Capesize') baseRate = Math.round(baseRate * 0.88 * 10) / 10;
    if (vesselClass === 'Supramax') baseRate = Math.round(baseRate * 1.15 * 10) / 10;
    if (vesselClass === 'Handysize') baseRate = Math.round(baseRate * 1.25 * 10) / 10;

    const vol = Number((baseRate * 0.052).toFixed(2));
    const drift = 0.03;
    const hash = (originId + '_' + destId).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

    return {
      name: `${originPort.name} → ${destPort.name}`,
      base: baseRate,
      vol,
      drift,
      index: hash % 50,
    };
  }, [originId, destId, selectedRouteKey, routeName, vesselClass]);

  // 2. Generate Historical and Forecast Series based on HTML Specification
  const HIST_MONTHS = 34; // Jan 2024 through Oct 2026 as historical (34 months matching shared HTML, current real-time)
  const FC_MONTHS = 6;    // 6 forward forecast months through Apr 2027 matching shared HTML

  const chartData = useMemo(() => {
    // Apply bunker and volatility sensitivity adjustments
    const bunkerDelta = (bunkerPriceUSD - 620) * 0.012;
    const volFactor = 1 + marketVolatilityShock / 100;

    const adjustedBase = Math.max(8, routeConfig.base + bunkerDelta);
    const adjustedVol = Math.max(0.6, routeConfig.vol * volFactor);

    const r = rng(1000 + routeConfig.index * 77);
    const hist: number[] = [];
    const fc: { v: number; w: number }[] = [];

    let v = adjustedBase;
    for (let k = 0; k < HIST_MONTHS; k++) {
      v += routeConfig.drift + (r() - 0.5) * adjustedVol * 2 + Math.sin(k / 4 + routeConfig.index) * 0.25;
      v = Math.max(6, v);
      hist.push(+v.toFixed(2));
    }

    for (let k = 1; k <= FC_MONTHS; k++) {
      v += routeConfig.drift;
      fc.push({
        v: +v.toFixed(2),
        w: +(adjustedVol * 1.2 * Math.sqrt(k)).toFixed(2),
      });
    }

    return {
      name: routeConfig.name,
      hist,
      fc,
    };
  }, [routeConfig, HIST_MONTHS, FC_MONTHS, bunkerPriceUSD, marketVolatilityShock]);

  // Notify parent of newly computed latest and forecasted rates
  useEffect(() => {
    if (!onRateCalculated) return;
    const cur = chartData.hist[chartData.hist.length - 1]; // Oct 2026
    const targetIdx = horizonDays === 30 ? 0 : horizonDays === 60 ? 1 : 2; // Nov 2026, Dec 2026, Jan 2027
    const targetObj = chartData.fc[targetIdx] || chartData.fc[chartData.fc.length - 1];
    const targetRate = targetObj.v;
    const ch = Number((((targetRate - cur) / cur) * 100).toFixed(1));
    const targetMonth = label(HIST_MONTHS + targetIdx);

    // Build ForecastPoint array for backwards compatibility
    const timeSeries: ForecastPoint[] = [
      ...chartData.hist.map((val, idx) => ({
        date: label(idx),
        label: label(idx),
        historical: val,
        rateUSD: val,
        isForecast: false,
      })),
      ...chartData.fc.map((f, idx) => ({
        date: label(HIST_MONTHS + idx),
        label: label(HIST_MONTHS + idx),
        forecast: f.v,
        rateUSD: f.v,
        lowerConfidence: +(f.v - f.w).toFixed(2),
        upperConfidence: +(f.v + f.w).toFixed(2),
        isForecast: true,
      })),
    ];

    onRateCalculated({
      currentRate: cur,
      forecastRate: targetRate,
      deltaPct: ch,
      uncertainty: targetObj.w,
      targetMonthLabel: targetMonth,
      timeSeries,
    });
  }, [chartData, HIST_MONTHS, FC_MONTHS, horizonDays]);

  // 3. SVG Layout Coordinates exactly according to HTML specification
  const W = 680;
  const H = height;
  const L = 42;
  const R = 15;
  const T = 15;
  const B = 28;
  const n = HIST_MONTHS + FC_MONTHS;

  const allValues = [...chartData.hist, ...chartData.fc.map(f => f.v + f.w)];
  const top = Math.max(40, Math.ceil(Math.max(...allValues) / 10) * 10);

  const x = (k: number) => L + ((W - L - R) * k) / (n - 1);
  const y = (val: number) => T + (H - T - B) * (1 - val / top);

  const lastHistIdx = HIST_MONTHS - 1;

  // Confidence Range Ribbon Polygon Points
  const upPoints = chartData.fc.map((f, j) => `${x(lastHistIdx + 1 + j)},${y(f.v + f.w)}`);
  const loPoints = chartData.fc.map((f, j) => `${x(lastHistIdx + 1 + j)},${y(Math.max(0, f.v - f.w))}`).reverse();
  const ribbonPoints = `${x(lastHistIdx)},${y(chartData.hist[lastHistIdx])} ${upPoints.join(' ')} ${loPoints.join(' ')}`;

  // Polyline strings
  const histPointsStr = chartData.hist.map((v, k) => `${x(k)},${y(v)}`).join(' ');
  const fcPointsStr = `${x(lastHistIdx)},${y(chartData.hist[lastHistIdx])} ` +
    chartData.fc.map((f, j) => `${x(lastHistIdx + 1 + j)},${y(f.v)}`).join(' ');

  // Grid tick values (every 10 units)
  const gridTicks: number[] = [];
  for (let g = 0; g <= top; g += 10) {
    gridTicks.push(g);
  }

  // Current and Forecast summary metrics
  const cur = chartData.hist[chartData.hist.length - 1];
  const end = chartData.fc[chartData.fc.length - 1].v;
  const ch = ((end - cur) / cur) * 100;
  const lastMonthLabel = label(HIST_MONTHS + FC_MONTHS - 1);

  return (
    <div className="w-full relative select-none">
      {/* Top Meta Header Matching User HTML Specification */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 mb-2 px-1">
        <div>
          <span>Route: </span>
          <strong className="text-slate-800 font-semibold">{chartData.name}</strong>
        </div>
        <div>
          <span>Latest </span>
          <strong className="text-slate-900 font-mono font-bold">${cur.toFixed(2)}</strong>
          <span> · {lastMonthLabel} forecast </span>
          <strong className="text-[#e07b24] font-mono font-bold">${end.toFixed(2)}</strong>
          <span className={`ml-1 font-bold ${ch >= 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
            ({ch >= 0 ? '+' : ''}{ch.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Main Responsive SVG Chart Matching HTML Specification */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Freight rate trend and forecast for ${chartData.name}`}
        className="w-full h-auto overflow-visible font-sans"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Horizontal Gridlines and Y-Axis Ticks */}
        {gridTicks.map((g) => (
          <g key={g}>
            <line
              x1={L}
              x2={W - R}
              y1={y(g)}
              y2={y(g)}
              stroke="#e3e8ee"
              strokeWidth="1"
            />
            <text
              x={L - 6}
              y={y(g) + 3.5}
              textAnchor="end"
              className="text-[10px] fill-slate-400 font-medium font-mono"
            >
              {g}
            </text>
          </g>
        ))}

        {/* Y-Axis Label Rotated -90deg */}
        <text
          transform={`translate(12 ${(H - B) / 2}) rotate(-90)`}
          textAnchor="middle"
          className="text-[10px] fill-slate-500 font-semibold tracking-wide"
        >
          Freight Rate (USD/ton)
        </text>

        {/* Vertical Separator Line for Forecast Period */}
        <line
          x1={x(lastHistIdx)}
          x2={x(lastHistIdx)}
          y1={T}
          y2={H - B}
          stroke="#64748b"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />
        <text
          x={x(lastHistIdx) + 6}
          y={T + 12}
          className="text-[10px] font-bold fill-slate-700"
        >
          Forecast Period →
        </text>

        {/* Forecast Range Band (Soft Orange Translucent Fill) */}
        <polygon
          points={ribbonPoints}
          fill="rgba(224, 123, 36, 0.16)"
        />

        {/* Historical Line: Solid Blue (#1a7db5, width 2.2) */}
        <polyline
          fill="none"
          stroke="#1a7db5"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={histPointsStr}
        />

        {/* Forecast Line: Dashed Orange (#e07b24, stroke-dasharray 6 4, width 2.2) */}
        <polyline
          fill="none"
          stroke="#e07b24"
          strokeWidth="2.2"
          strokeDasharray="6 4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={fcPointsStr}
        />

        {/* Historical Data Circles (#1a7db5, r=2.6) with HTML Tooltip */}
        {chartData.hist.map((v, k) => (
          <circle
            key={`hist-${k}`}
            cx={x(k)}
            cy={y(v)}
            r={2.8}
            fill="#1a7db5"
            stroke="#ffffff"
            strokeWidth="1.5"
            className="cursor-pointer transition-all hover:r-4"
            onMouseEnter={() => setHoverPoint({
              label: label(k),
              rate: v,
              isForecast: false,
            })}
            onMouseLeave={() => setHoverPoint(null)}
          >
            <title>{`${label(k)}: $${v.toFixed(2)}/ton (historical)`}</title>
          </circle>
        ))}

        {/* Forecast Data Circles (#e07b24, r=2.6) with HTML Tooltip */}
        {chartData.fc.map((f, j) => {
          const k = lastHistIdx + 1 + j;
          return (
            <circle
              key={`fc-${j}`}
              cx={x(k)}
              cy={y(f.v)}
              r={2.8}
              fill="#e07b24"
              stroke="#ffffff"
              strokeWidth="1.5"
              className="cursor-pointer transition-all hover:r-4"
              onMouseEnter={() => setHoverPoint({
                label: label(k),
                rate: f.v,
                isForecast: true,
                uncertainty: f.w,
              })}
              onMouseLeave={() => setHoverPoint(null)}
            >
              <title>{`${label(k)}: $${f.v.toFixed(2)}/ton (forecast, ±${f.w.toFixed(2)})`}</title>
            </circle>
          );
        })}

        {/* X-Axis Monthly Labels at 3-Month Steps */}
        {Array.from({ length: n }).map((_, k) => {
          if (k % 3 !== 0 && k !== n - 1) return null;
          return (
            <text
              key={`xlabel-${k}`}
              x={x(k)}
              y={H - 10}
              textAnchor="middle"
              className="text-[9.5px] fill-slate-500 font-medium font-sans"
            >
              {label(k)}
            </text>
          );
        })}
      </svg>

      {/* Interactive Tooltip Card */}
      {hoverPoint && (
        <div className="absolute top-8 right-6 z-20 bg-slate-900/95 border border-slate-700 text-white text-[11px] px-3 py-2 rounded-lg shadow-xl backdrop-blur-md pointer-events-none">
          <div className="font-semibold text-slate-200">{hoverPoint.label}</div>
          <div className="text-base font-extrabold font-mono mt-0.5">
            <span className={hoverPoint.isForecast ? 'text-[#f0a05a]' : 'text-[#4fb0e6]'}>
              ${hoverPoint.rate.toFixed(2)}
            </span>
            <span className="text-slate-400 text-xs font-normal"> / ton</span>
          </div>
          {hoverPoint.isForecast && hoverPoint.uncertainty && (
            <div className="text-[10px] text-amber-300/90 font-mono mt-0.5">
              Range: ${(hoverPoint.rate - hoverPoint.uncertainty).toFixed(2)} – ${(hoverPoint.rate + hoverPoint.uncertainty).toFixed(2)} (±${hoverPoint.uncertainty.toFixed(2)})
            </div>
          )}
        </div>
      )}

      {/* Legend Matching User HTML Specification */}
      <div className="flex items-center justify-center gap-6 mt-3 pt-2 text-xs text-slate-600 font-medium">
        <span className="flex items-center gap-1.5">
          <i className="inline-block w-5 h-0 border-t-[3px] border-[#1a7db5] align-middle"></i>
          <span>Historical</span>
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block w-5 h-0 border-t-[3px] border-dashed border-[#e07b24] align-middle"></i>
          <span>Forecast</span>
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block w-4 h-2.5 bg-[rgba(224,123,36,0.22)] rounded-xs align-middle"></i>
          <span>Forecast range</span>
        </span>
      </div>
    </div>
  );
};
