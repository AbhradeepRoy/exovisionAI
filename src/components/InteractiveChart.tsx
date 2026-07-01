import React, { useState, useMemo, useRef } from "react";
import { DataPoint } from "../types";

interface InteractiveChartProps {
  points: DataPoint[];
  title: string;
  xLabel: string;
  yLabel: string;
  isPhaseFolded?: boolean;
  transitCenterPhase?: number;
  transitDurationWidth?: number; // width in phase units
  transitDepth?: number; // ppm
}

export function InteractiveChart({
  points,
  title,
  xLabel,
  yLabel,
  isPhaseFolded = false,
  transitCenterPhase = 0,
  transitDurationWidth = 0.15,
  transitDepth = 0
}: InteractiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number } | null>(null);
  const [yMinZoom, setYMinZoom] = useState<number | null>(null);
  const [yMaxZoom, setYMaxZoom] = useState<number | null>(null);

  // Compute boundaries
  const bounds = useMemo(() => {
    if (points.length === 0) return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    
    const xs = points.map(p => p.time);
    const ys = points.map(p => p.flux);
    
    let xMin = Math.min(...xs);
    let xMax = Math.max(...xs);
    let yMin = Math.min(...ys);
    let yMax = Math.max(...ys);

    // Expand margin slightly
    const xSpan = xMax - xMin || 1;
    xMin -= xSpan * 0.05;
    xMax += xSpan * 0.05;

    const ySpan = yMax - yMin || 1;
    yMin -= ySpan * 0.1;
    yMax += ySpan * 0.1;

    return { xMin, xMax, yMin, yMax };
  }, [points]);

  const yMinVal = yMinZoom !== null ? yMinZoom : bounds.yMin;
  const yMaxVal = yMaxZoom !== null ? yMaxZoom : bounds.yMax;

  // Set default zooms to easily see transit depths (e.g. 0.99 to 1.01 relative flux range)
  const resetZoom = () => {
    setYMinZoom(null);
    setYMaxZoom(null);
  };

  const zoomToTransit = () => {
    // Zoom tightly around 1.0 to see small planetary dips
    if (points.length > 0) {
      const ys = points.map(p => p.flux);
      const minVal = Math.min(...ys);
      setYMinZoom(Math.max(0.85, minVal - 0.001));
      setYMaxZoom(1.005);
    }
  };

  // Dimensions
  const width = 800;
  const height = 350;
  const paddingLeft = 65;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Project data points to screen coordinates
  const projectX = (x: number) => {
    const range = bounds.xMax - bounds.xMin || 1;
    return paddingLeft + ((x - bounds.xMin) / range) * chartWidth;
  };

  const projectY = (y: number) => {
    const range = yMaxVal - yMinVal || 1;
    return paddingTop + chartHeight - ((y - yMinVal) / range) * chartHeight;
  };

  // Unproject screen coordinate back to data space (for mouse tracking)
  const unprojectX = (screenX: number) => {
    const relativeX = screenX - paddingLeft;
    const range = bounds.xMax - bounds.xMin || 1;
    return bounds.xMin + (relativeX / chartWidth) * range;
  };

  // Hover detection
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xMouse = e.clientX - rect.left;
    const yMouse = e.clientY - rect.top;

    // Scale back to SVG coordinate space
    const svgX = (xMouse / rect.width) * width;
    const svgY = (yMouse / rect.height) * height;

    const dataX = unprojectX(svgX);

    // Find closest point on X coordinate
    let closest: DataPoint | null = null;
    let minDistance = Infinity;

    for (const p of points) {
      const distance = Math.abs(p.time - dataX);
      if (distance < minDistance) {
        minDistance = distance;
        closest = p;
      }
    }

    if (closest) {
      setHoveredPoint(closest);
      setMouseCoords({ x: projectX(closest.time), y: projectY(closest.flux) });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setMouseCoords(null);
  };

  // Generate model fit line overlay for phase-folded curves
  const modelFitPath = useMemo(() => {
    if (!isPhaseFolded || points.length === 0 || transitDepth === 0) return null;
    const sortedPoints = [...points].sort((a, b) => a.time - b.time);
    
    // Create an ideal transit path
    const fitCoords: Array<{ x: number; y: number }> = [];
    const step = 0.005;
    for (let phase = -0.55; phase <= 0.55; phase += step) {
      let flux = 1.0;
      const halfDuration = transitDurationWidth / 2;
      
      if (Math.abs(phase - transitCenterPhase) < halfDuration) {
        const dist = (phase - transitCenterPhase) / halfDuration; // -1 to 1
        // Smooth quadratic limb darkening profile
        const profile = 1.0 - 0.2 * (1 - dist * dist);
        flux -= (transitDepth / 1e6) * profile;
      }
      
      fitCoords.push({ x: phase, y: flux });
    }

    return fitCoords
      .map((c, i) => `${i === 0 ? "M" : "L"} ${projectX(c.x)} ${projectY(c.y)}`)
      .join(" ");
  }, [isPhaseFolded, bounds, yMinVal, yMaxVal, transitDepth, transitDurationWidth, transitCenterPhase]);

  // Generate SVG Gridlines & Ticks
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = (bounds.xMax - bounds.xMin) / 6;
    for (let i = 0; i <= 6; i++) {
      ticks.push(bounds.xMin + i * step);
    }
    return ticks;
  }, [bounds]);

  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = (yMaxVal - yMinVal) / 5;
    for (let i = 0; i <= 5; i++) {
      ticks.push(yMinVal + i * step);
    }
    return ticks;
  }, [yMinVal, yMaxVal]);

  return (
    <div ref={containerRef} className="w-full bg-space-900 border border-space-700/60 rounded-xl p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
        <div>
          <h3 className="text-md font-display font-semibold text-gray-100 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-neon-cyan animate-pulse" />
            {title}
          </h3>
          <p className="text-xs text-gray-400 font-mono">
            {points.length} observed epochs • Range: {bounds.xMin.toFixed(2)} to {bounds.xMax.toFixed(2)} d
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={zoomToTransit}
            className="px-2.5 py-1 text-xs font-mono font-medium rounded bg-space-850 hover:bg-space-700 text-neon-cyan border border-neon-cyan/20 transition"
            title="Focus y-axis around transit level"
          >
            🔍 Zoom Transit
          </button>
          <button
            onClick={resetZoom}
            className="px-2.5 py-1 text-xs font-mono font-medium rounded bg-space-850 hover:bg-space-700 text-gray-300 border border-space-700 transition"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="relative overflow-visible">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Background definitions */}
          <defs>
            <linearGradient id="transitHaze" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="fitHaze" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines (Horizontal) */}
          {yTicks.map((yVal, i) => (
            <line
              key={`gl-y-${i}`}
              x1={paddingLeft}
              y1={projectY(yVal)}
              x2={width - paddingRight}
              y2={projectY(yVal)}
              className="stroke-space-800/80 stroke-1"
              strokeDasharray="2,4"
            />
          ))}

          {/* Grid lines (Vertical) */}
          {xTicks.map((xVal, i) => (
            <line
              key={`gl-x-${i}`}
              x1={projectX(xVal)}
              y1={paddingTop}
              x2={projectX(xVal)}
              y2={paddingTop + chartHeight}
              className="stroke-space-800/80 stroke-1"
              strokeDasharray="2,4"
            />
          ))}

          {/* Transit region shader (If Phase Folded) */}
          {isPhaseFolded && (
            <rect
              x={projectX(-transitDurationWidth / 2)}
              y={paddingTop}
              width={projectX(transitDurationWidth / 2) - projectX(-transitDurationWidth / 2)}
              height={chartHeight}
              fill="url(#transitHaze)"
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="3,3"
              strokeOpacity="0.3"
            />
          )}

          {/* X axis line */}
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight}
            className="stroke-space-700 stroke-1"
          />

          {/* Y axis line */}
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={paddingTop + chartHeight}
            className="stroke-space-700 stroke-1"
          />

          {/* Axis Ticks Text (X) */}
          {xTicks.map((xVal, i) => (
            <g key={`t-x-${i}`}>
              <line
                x1={projectX(xVal)}
                y1={paddingTop + chartHeight}
                x2={projectX(xVal)}
                y2={paddingTop + chartHeight + 4}
                className="stroke-space-700 stroke-1"
              />
              <text
                x={projectX(xVal)}
                y={paddingTop + chartHeight + 16}
                textAnchor="middle"
                className="fill-gray-400 font-mono text-[10px]"
              >
                {xVal.toFixed(isPhaseFolded ? 2 : 1)}
              </text>
            </g>
          ))}

          {/* Axis Ticks Text (Y) */}
          {yTicks.map((yVal, i) => (
            <g key={`t-y-${i}`}>
              <line
                x1={paddingLeft - 4}
                y1={projectY(yVal)}
                x2={paddingLeft}
                y2={projectY(yVal)}
                className="stroke-space-700 stroke-1"
              />
              <text
                x={paddingLeft - 8}
                y={projectY(yVal) + 3}
                textAnchor="end"
                className="fill-gray-400 font-mono text-[10px]"
              >
                {yVal.toFixed(4)}
              </text>
            </g>
          ))}

          {/* Data Points (Scatter Plot) */}
          {points.map((p, i) => {
            const cx = projectX(p.time);
            const cy = projectY(p.flux);

            // Hide points outside the y-bound zoom
            if (p.flux < yMinVal || p.flux > yMaxVal) return null;

            return (
              <g key={`dp-${i}`}>
                {/* Optional error bars */}
                {p.fluxError > 0 && (
                  <line
                    x1={cx}
                    y1={projectY(p.flux - p.fluxError)}
                    x2={cx}
                    y2={projectY(p.flux + p.fluxError)}
                    className="stroke-space-600/40 stroke-[0.75]"
                  />
                )}
                {/* Core point */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isPhaseFolded ? 2 : 1.7}
                  className={`${p.quality > 0 ? "fill-rose-500" : "fill-neon-cyan/70 hover:fill-neon-cyan"}`}
                />
              </g>
            );
          })}

          {/* Fitted Transit model path overlay */}
          {isPhaseFolded && modelFitPath && (
            <path
              d={modelFitPath}
              className="stroke-star-gold fill-none stroke-[2] drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]"
            />
          )}

          {/* Vertical alignment line for hovered point */}
          {mouseCoords && hoveredPoint && (
            <g>
              <line
                x1={mouseCoords.x}
                y1={paddingTop}
                x2={mouseCoords.x}
                y2={paddingTop + chartHeight}
                className="stroke-rose-400/40 stroke-1"
                strokeDasharray="4,4"
              />
              <circle
                cx={mouseCoords.x}
                cy={mouseCoords.y}
                r={5}
                className="fill-none stroke-rose-400 stroke-1 animate-ping"
              />
              <circle
                cx={mouseCoords.x}
                cy={mouseCoords.y}
                r={4}
                className="fill-rose-400 stroke-white stroke-1"
              />
            </g>
          )}

          {/* Chart Axis labels */}
          <text
            x={paddingLeft + chartWidth / 2}
            y={height - 5}
            textAnchor="middle"
            className="fill-gray-300 font-sans font-medium text-xs tracking-wide"
          >
            {xLabel}
          </text>

          <text
            transform={`rotate(-90 ${15} ${paddingTop + chartHeight / 2})`}
            x={15}
            y={paddingTop + chartHeight / 2}
            textAnchor="middle"
            className="fill-gray-300 font-sans font-medium text-xs tracking-wide"
          >
            {yLabel}
          </text>
        </svg>

        {/* Floating Tooltip inside container */}
        {hoveredPoint && mouseCoords && (
          <div
            className="absolute bg-space-950/95 border border-space-600 rounded-lg p-2.5 shadow-2xl font-mono text-[11px] pointer-events-none z-35 backdrop-blur-sm"
            style={{
              left: `${(mouseCoords.x / width) * 100}%`,
              top: `${(mouseCoords.y / height) * 100 - 30}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="text-gray-400 border-b border-space-700 pb-1 mb-1 font-sans font-semibold">
              Observation Datapoint
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">{isPhaseFolded ? "Phase folded:" : "Time (Epoch):"}</span>
              <span className="text-neon-cyan font-bold">
                {hoveredPoint.time.toFixed(5)} {isPhaseFolded ? "cycles" : "days"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">Relative Flux:</span>
              <span className="text-white font-semibold">
                {hoveredPoint.flux.toFixed(6)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">Deviation:</span>
              <span className="text-gray-300">
                {((1.0 - hoveredPoint.flux) * 1e6).toFixed(1)} ppm
              </span>
            </div>
            {hoveredPoint.fluxError > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Flux Error:</span>
                <span className="text-gray-400">
                  ±{hoveredPoint.fluxError.toFixed(6)}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">Quality Flag:</span>
              <span className={hoveredPoint.quality > 0 ? "text-rose-400 font-bold" : "text-emerald-400"}>
                {hoveredPoint.quality} {hoveredPoint.quality > 0 ? "(DEGRADED)" : "(NOMINAL)"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
