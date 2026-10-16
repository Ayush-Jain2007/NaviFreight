import React, { useState } from 'react';
import { ForecastPoint } from '../types';

interface FreightChartProps {
  data?: ForecastPoint[];
  height?: number;
  showForecastOnly?: boolean;
}

export const FreightChart: React.FC<FreightChartProps> = ({
  data,
  height = 240,
}) => {
  const [hoverPoint, setHoverPoint] = useState<any | null>(null);

  // Exact dataset aligned with Prototype Image 1 & 2
  // Jan 2023 to Oct 2025 (Historical and Forecast)
  const defaultChartPoints = [
    { label: 'Jan 2024', rate: 21.5, isForecast: false, isBoundary: false },
    { label: 'Feb 2024', rate: 26.2, isForecast: false, isBoundary: false },
    { label: 'Apr 2024', rate: 22.0, isForecast: false, isBoundary: false },
    { label: 'May 2024', rate: 24.8, isForecast: false, isBoundary: false },
    { label: 'Jul 2024', rate: 31.0, isForecast: false, isBoundary: false },
    { label: 'Aug 2024', rate: 27.5, isForecast: false, isBoundary: false },
    { label: 'Oct 2024', rate: 23.4, isForecast: false, isBoundary: false },
    { label: 'Nov 2024', rate: 21.0, isForecast: false, isBoundary: false },
    { label: 'Jan 2025', rate: 24.8, isForecast: false, isBoundary: true },
    // Forecast points
    { label: 'Feb 2025', rate: 25.5, lower: 22.0, upper: 28.5, isForecast: true, isBoundary: false },
    { label: 'Apr 2025', rate: 26.2, lower: 22.5, upper: 29.8, isForecast: true, isBoundary: false },
    { label: 'Jul 2025', rate: 28.5, lower: 23.8, upper: 33.0, isForecast: true, isBoundary: false },
    { label: 'Oct 2025', rate: 29.8, lower: 24.0, upper: 35.0, isForecast: true, isBoundary: false },
  ];

  const chartPoints = (data && data.length > 0)
    ? data.map((p, idx) => ({
        label: p.label || p.date,
        rate: p.isForecast ? (p.forecast ?? p.historical ?? 25) : (p.historical ?? 25),
        lower: p.lowerConfidence,
        upper: p.upperConfidence,
        isForecast: p.isForecast,
        isBoundary: idx === 8 || (!p.isForecast && Boolean(data[idx + 1]?.isForecast)),
      }))
    : defaultChartPoints;

  const width = 640;
  const padding = { top: 20, right: 30, bottom: 35, left: 35 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const minY = 0;
  const maxY = 50;

  const getX = (idx: number) => padding.left + (idx / (chartPoints.length - 1)) * innerW;
  const getY = (val: number) => padding.top + innerH - (val / maxY) * innerH;

  const boundaryIdx = chartPoints.findIndex(p => p.isBoundary);
  const boundaryX = getX(boundaryIdx);

  // Split into historical and forecast
  const historicalPoints = chartPoints.filter(p => !p.isForecast || p.isBoundary);
  const forecastPoints = chartPoints.filter(p => p.isForecast || p.isBoundary);

  const histPath = historicalPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.rate)}`)
    .join(' ');

  const forecastPath = forecastPoints
    .map((p, i) => {
      const gIdx = boundaryIdx + i;
      return `${i === 0 ? 'M' : 'L'} ${getX(gIdx)} ${getY(p.rate)}`;
    })
    .join(' ');

  // Ribbon polygon
  const upperRibbon = forecastPoints.map((p, i) => `${getX(boundaryIdx + i)},${getY(p.upper || p.rate)}`);
  const lowerRibbon = forecastPoints.slice().reverse().map((p, i) => {
    const revIdx = boundaryIdx + (forecastPoints.length - 1 - i);
    return `${getX(revIdx)},${getY(p.lower || p.rate)}`;
  });
  const ribbonPoly = [...upperRibbon, ...lowerRibbon].join(' ');

  const yTicks = [0, 10, 20, 30, 40, 50];
  const xLabels = ['Jan 2024', 'Apr 2024', 'Jul 2024', 'Oct 2024', 'Jan 2025', 'Apr 2025', 'Jul 2025', 'Oct 2025'];

  return (
    <div className="w-full relative select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible font-sans"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="protoUncertainty" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Y Axis Gridlines */}
        {yTicks.map((val) => (
          <g key={val}>
            <line
              x1={padding.left}
              y1={getY(val)}
              x2={width - padding.right}
              y2={getY(val)}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text
              x={padding.left - 8}
              y={getY(val) + 3}
              textAnchor="end"
              className="text-[10px] fill-slate-400 font-medium font-sans"
            >
              {val}
            </text>
          </g>
        ))}

        {/* Y-Axis Label */}
        <text
          x={-height / 2}
          y={12}
          transform="rotate(-90)"
          textAnchor="middle"
          className="text-[10px] fill-slate-500 font-semibold"
        >
          Freight Rate (USD/ton)
        </text>

        {/* Vertical Forecast Line & Annotation */}
        <line
          x1={boundaryX}
          y1={padding.top}
          x2={boundaryX}
          y2={height - padding.bottom}
          stroke="#475569"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />
        <text
          x={boundaryX + 6}
          y={padding.top + 8}
          className="text-[10px] font-bold fill-slate-700"
        >
          Forecast Period →
        </text>

        {/* Shaded Uncertainty Range Ribbon */}
        {ribbonPoly && (
          <polygon
            points={ribbonPoly}
            fill="url(#protoUncertainty)"
            stroke="none"
          />
        )}

        {/* Historical Line (Solid Blue) */}
        <path
          d={histPath}
          fill="none"
          stroke="#0284c7"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Forecast Line (Dashed Blue) */}
        <path
          d={forecastPath}
          fill="none"
          stroke="#0284c7"
          strokeWidth="2.5"
          strokeDasharray="4 4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {chartPoints.map((p, idx) => {
          const x = getX(idx);
          const y = getY(p.rate);
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r={p.isBoundary ? 3.5 : 2.5}
              fill="#0284c7"
              stroke="#ffffff"
              strokeWidth="1.5"
              className="cursor-pointer hover:r-4 transition-all"
              onMouseEnter={() => setHoverPoint(p)}
              onMouseLeave={() => setHoverPoint(null)}
            />
          );
        })}

        {/* X Axis Labels */}
        {xLabels.map((lbl, idx) => {
          const step = innerW / (xLabels.length - 1);
          const x = padding.left + idx * step;
          return (
            <text
              key={lbl}
              x={x}
              y={height - padding.bottom + 16}
              textAnchor="middle"
              className="text-[9.5px] fill-slate-500 font-medium"
            >
              {lbl}
            </text>
          );
        })}
      </svg>

      {/* Hover Tooltip */}
      {hoverPoint && (
        <div className="absolute top-2 right-4 bg-slate-900 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none">
          <span className="font-semibold">{hoverPoint.label}: </span>
          <span className="text-cyan-300 font-bold">${hoverPoint.rate} / ton</span>
          {hoverPoint.lower && (
            <div className="text-[10px] text-slate-300">
              Range: ${hoverPoint.lower} – ${hoverPoint.upper}
            </div>
          )}
        </div>
      )}

      {/* Legend Matching Prototype */}
      <div className="flex items-center justify-center gap-6 mt-3 pt-2 text-xs text-slate-600 font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 bg-[#0284c7] inline-block"></span>
          <span>Historical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 border-t-2 border-dashed border-[#0284c7] inline-block"></span>
          <span>Forecast</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-3 bg-[#bae6fd] rounded-xs inline-block"></span>
          <span>Uncertainty Range</span>
        </div>
      </div>
    </div>
  );
};
