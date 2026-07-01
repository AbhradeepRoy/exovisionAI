import { useState, useEffect } from "react";
import { EstimatedParameters, PlanetClass } from "../types";

interface OrbitalVisualizerProps {
  parameters: EstimatedParameters;
  starName: string;
  isMultiPlanetSystem?: boolean;
  detectedPlanets?: EstimatedParameters[];
}

export function OrbitalVisualizer({
  parameters,
  starName,
  isMultiPlanetSystem = false,
  detectedPlanets = []
}: OrbitalVisualizerProps) {
  const [angle, setAngle] = useState(0);

  // Fallback to primary parameters if detectedPlanets is empty
  const planetsList = detectedPlanets && detectedPlanets.length > 0 ? detectedPlanets : [parameters];
  
  // Interactive selected planet in the sidebar comparison
  const [selectedPlanetIdx, setSelectedPlanetIdx] = useState(0);

  // If parameters change (e.g. user loads a different target), reset the selected planet index
  useEffect(() => {
    setSelectedPlanetIdx(0);
  }, [parameters.orbitalPeriod]);

  // Master frame animation loop
  useEffect(() => {
    let animationFrameId: number;
    const update = () => {
      setAngle((prev) => (prev + 0.3) % 360);
      animationFrameId = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const activePlanet = planetsList[selectedPlanetIdx] || planetsList[0] || parameters;

  // Star size configuration
  const starRadiusPx = Math.max(18, Math.min(36, activePlanet.starRadius * 22));

  // Determine star color based on temperature
  let starColor = "#f59e0b"; // Golden/G-type
  let starGlow = "rgba(245, 158, 11, 0.4)";
  if (activePlanet.starMass > 1.1) {
    starColor = "#60a5fa"; // Blue hot
    starGlow = "rgba(96, 165, 250, 0.4)";
  } else if (activePlanet.starMass < 0.6) {
    starColor = "#ef4444"; // Cool red M-dwarf
    starGlow = "rgba(239, 68, 68, 0.4)";
  }

  // Planet scale comparison data for the active selected planet
  const scaleComparison = [
    { name: "Earth", radius: 1.0, color: "bg-blue-400" },
    { name: "Neptune", radius: 3.88, color: "bg-indigo-500" },
    { name: "Jupiter", radius: 11.2, color: "bg-amber-600" },
    {
      name: `Planet ${String.fromCharCode(98 + selectedPlanetIdx)}`,
      radius: activePlanet.planetRadius,
      color: "bg-neon-cyan border-2 border-white/45 animate-pulse",
      special: true
    },
  ];

  // Helper to get distinct color gradients for each planet
  const getPlanetGradient = (idx: number) => {
    if (idx === 0) return { stop1: "#22d3ee", stop2: "#0891b2", stop3: "#024e60", glow: "rgba(6, 182, 212, 0.6)" };
    if (idx === 1) return { stop1: "#fb923c", stop2: "#ea580c", stop3: "#7c2d12", glow: "rgba(249, 115, 22, 0.6)" };
    return { stop1: "#c084fc", stop2: "#9333ea", stop3: "#581c87", glow: "rgba(168, 85, 247, 0.6)" };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-xl">
      {/* Dynamic Solar System Projection */}
      <div className="flex flex-col items-center justify-center bg-[#05060a] rounded-lg p-4 relative min-h-[310px] overflow-hidden border border-slate-800">
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            {isMultiPlanetSystem || planetsList.length > 1 ? "Multi-Planet Keplerian Model" : "Single-Planet Orbit Model"}
          </h4>
        </div>

        <svg viewBox="0 0 300 300" className="w-full max-w-[260px] h-auto">
          <defs>
            <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={starColor} stopOpacity="1" />
              <stop offset="35%" stopColor={starColor} stopOpacity="0.7" />
              <stop offset="100%" stopColor={starColor} stopOpacity="0" />
            </radialGradient>
            
            {planetsList.map((_, idx) => {
              const grad = getPlanetGradient(idx);
              return (
                <radialGradient key={idx} id={`planetShadow-${idx}`} cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor={grad.stop1} />
                  <stop offset="40%" stopColor={grad.stop2} />
                  <stop offset="100%" stopColor={grad.stop3} />
                </radialGradient>
              );
            })}
          </defs>

          {/* Render individual orbit rings for all detected planets */}
          {planetsList.map((planet, idx) => {
            const orbitRadius = planetsList.length === 1 ? 105 : 65 + idx * 38;
            return (
              <ellipse
                key={idx}
                cx="150"
                cy="150"
                rx={orbitRadius}
                ry={orbitRadius * 0.45}
                className="fill-none stroke-slate-800 stroke-1"
                strokeDasharray="3,5"
              />
            );
          })}

          {/* Habitable Zone shaded rings centered around star */}
          <ellipse
            cx="150"
            cy="150"
            rx="95"
            ry="42.75"
            className="fill-none stroke-emerald-500/10 stroke-[10]"
            strokeOpacity="0.18"
          />

          {/* Central Host Star */}
          <circle cx="150" cy="150" r={starRadiusPx + 15} fill="url(#starGlow)" />
          <circle cx="150" cy="150" r={starRadiusPx} fill={starColor} />

          {/* Render Planets on their respective orbits */}
          {planetsList.map((planet, idx) => {
            const orbitRadius = planetsList.length === 1 ? 105 : 65 + idx * 38;
            const grad = getPlanetGradient(idx);
            
            // Speed based on physical period
            const speedMultiplier = Math.max(0.4, Math.min(5, 12 / planet.orbitalPeriod));
            // Angular position starting with distinct offset phases to avoid overlap
            const startPhaseOffset = idx * 115;
            const radians = (((angle * speedMultiplier) + startPhaseOffset) * Math.PI) / 180;
            
            const pX = 150 + Math.cos(radians) * orbitRadius;
            const pY = 150 + Math.sin(radians) * (orbitRadius * 0.45);
            const pRadius = Math.max(3.5, Math.min(10, planet.planetRadius * 1.3));

            return (
              <g key={idx}>
                {pY < 150 ? (
                  // Behind the star
                  <circle
                    cx={pX}
                    cy={pY}
                    r={pRadius}
                    fill={`url(#planetShadow-${idx})`}
                  />
                ) : (
                  // In front of the star (occulting)
                  <circle
                    cx={pX}
                    cy={pY}
                    r={pRadius}
                    fill={`url(#planetShadow-${idx})`}
                    style={{ filter: `drop-shadow(0px 0px 4px ${grad.stop1})` }}
                  />
                )}
                {/* Visual Label overlay for Multi-Planet Identification */}
                {planetsList.length > 1 && (
                  <text
                    x={pX}
                    y={pY - pRadius - 4}
                    textAnchor="middle"
                    className="fill-slate-400 font-mono text-[8px] font-semibold"
                  >
                    {String.fromCharCode(98 + idx)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Render central star core *again* on top of "behind" planets but under "front" planets */}
          {planetsList.some((_, idx) => {
            const speedMultiplier = Math.max(0.4, Math.min(5, 12 / _.orbitalPeriod));
            const startPhaseOffset = idx * 115;
            const radians = (((angle * speedMultiplier) + startPhaseOffset) * Math.PI) / 180;
            const pY = 150 + Math.sin(radians) * ((planetsList.length === 1 ? 105 : 65 + idx * 38) * 0.45);
            return pY < 150;
          }) && (
            <circle cx="150" cy="150" r={starRadiusPx} fill={starColor} />
          )}
        </svg>

        {/* Orbit State overlay */}
        <div className="absolute bottom-3 right-3 text-right">
          <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">
            Active Simulation
          </div>
          <div className="text-[11px] font-sans text-neon-cyan font-semibold uppercase tracking-wider">
            {planetsList.length > 1 ? `${planetsList.length} Planets Detected` : "1 Planet Detected"}
          </div>
        </div>
      </div>

      {/* Exoplanet Dimension Scales / Tab Selector */}
      <div className="flex flex-col justify-between bg-[#05060a] rounded-lg p-5 border border-slate-800">
        <div>
          <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
            Multi-Planet System Parameters
          </h4>

          {/* Multi-planet selector buttons */}
          {planetsList.length > 1 && (
            <div className="flex gap-1.5 mb-3.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {planetsList.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPlanetIdx(idx)}
                  className={`flex-1 text-center py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
                    selectedPlanetIdx === idx
                      ? "bg-slate-800 text-neon-cyan border border-neon-cyan/20 font-semibold"
                      : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  Planet {starName} {String.fromCharCode(98 + idx)}
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-300 mb-4 font-sans leading-relaxed">
            The selected candidate <strong className="text-neon-cyan">{starName} {String.fromCharCode(98 + selectedPlanetIdx)}</strong> has a physical radius of <strong className="text-neon-cyan">{activePlanet.planetRadius} R⊕</strong>, 
            classified as a <strong className="text-star-gold">{activePlanet.planetClass}</strong> orbiting in the system.
          </p>
        </div>

        {/* Scaled Circle Comparison list */}
        <div className="flex items-end justify-around h-[110px] pb-2 border-b border-slate-800">
          {scaleComparison.map((item, idx) => {
            const visualHeight = Math.max(8, Math.min(75, Math.sqrt(item.radius) * 20));
            return (
              <div key={idx} className="flex flex-col items-center justify-end gap-1.5 text-center h-full">
                <div
                  className={`${item.color} rounded-full transition-all duration-500`}
                  style={{
                    width: `${visualHeight}px`,
                    height: `${visualHeight}px`,
                  }}
                />
                <span className={`text-[9px] font-mono ${item.special ? "text-neon-cyan font-semibold" : "text-slate-400"}`}>
                  {item.name}
                  <span className="block text-[8px] text-slate-500">
                    {item.radius.toFixed(2)} R⊕
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        {/* Parameters Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-mono">
          <div className="bg-slate-900/40 rounded p-2 border border-slate-800">
            <span className="text-slate-500 block text-[9px]">PERIOD:</span>
            <span className="text-slate-100 font-semibold text-xs">{activePlanet.orbitalPeriod} Days</span>
          </div>
          <div className="bg-slate-900/40 rounded p-2 border border-slate-800">
            <span className="text-slate-500 block text-[9px]">SEMI-MAJOR AXIS:</span>
            <span className="text-slate-100 font-semibold text-xs">{activePlanet.semiMajorAxis} AU</span>
          </div>
          <div className="bg-slate-900/40 rounded p-2 border border-slate-800">
            <span className="text-slate-500 block text-[9px]">EQ. TEMPERATURE:</span>
            <span className="text-slate-100 font-semibold text-xs">{activePlanet.equilibriumTemp} K</span>
          </div>
          <div className="bg-slate-900/40 rounded p-2 border border-slate-800">
            <span className="text-slate-500 block text-[9px]">CLASSIFICATION:</span>
            <span className="text-star-gold font-bold text-xs">{activePlanet.planetClass}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
