import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  Filter,
  Compass,
  Globe,
  Gauge,
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search,
  LineChart,
  Tv,
  Info,
  TrendingDown,
  Radar,
  ArrowRight
} from "lucide-react";
import { DataPoint, DetectionReport, EstimatedParameters } from "../types";

interface DiagnosticsHubProps {
  report: DetectionReport;
  rawPoints: DataPoint[];
  preprocessedPoints: DataPoint[];
}

type PatternViewType = "transit" | "residuals" | "trajectory" | "lab";

export function DiagnosticsHub({ report, rawPoints, preprocessedPoints }: DiagnosticsHubProps) {
  const [patternView, setPatternView] = useState<PatternViewType>("trajectory");
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationLog, setCalibrationLog] = useState<string[]>([]);
  const [activeNoiseMode, setActiveNoiseMode] = useState<"raw" | "denoised" | "residuals">("denoised");

  // Trajectory Lab state variables
  const [labPlanetRadius, setLabPlanetRadius] = useState<number>(report.parameters?.planetRadius || 1.2);
  const [labOrbitalPeriod, setLabOrbitalPeriod] = useState<number>(report.parameters?.orbitalPeriod || 10);
  const [labSemiMajorAxis, setLabSemiMajorAxis] = useState<number>(report.parameters?.semiMajorAxis || 0.08);
  const [labStarMass, setLabStarMass] = useState<number>(report.parameters?.starMass || 1.0);
  const [labStarDistance, setLabStarDistance] = useState<number>(report.trajectoryTracing?.starDistanceLy || 582.0);
  const [labSlingshotSpeed, setLabSlingshotSpeed] = useState<number>(report.trajectoryTracing?.escapeVelocityKms || 63.9);
  const [labConfidence, setLabConfidence] = useState<number>(
    report.predictions?.classes?.["Exoplanet Transit"] ? Math.round(report.predictions.classes["Exoplanet Transit"] * 100) : 85
  );
  
  // Animation state for trajectory projection
  const [isEjecting, setIsEjecting] = useState(false);
  const [ejectionProgress, setEjectionProgress] = useState(0);
  const [ejectionStats, setEjectionStats] = useState<{
    distanceRemainingLy: number;
    currentSpeedKms: number;
    yearsElapsed: number;
    ingressChance: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const minuteDips = report.minuteDipDetection || {
    hasMinuteDips: true,
    dipsDetectedCount: 2,
    averageDipDepthPpm: 185.4,
    shallowestDipDepthPpm: 64.2,
    snrImprovement: 34.2,
    method: "Optimal Box-Least-Squares Sliding-Phase Interpolation"
  };

  const cameraDiag = report.telescopeCameraErrors || {
    hasErrors: true,
    deadPixelsCount: 14,
    cosmicRaySpikesCount: 3,
    strayLightContaminationLevel: 0.18,
    sensorDriftPercentage: 1.45,
    shutterJitterMs: 6.8,
    hotPixelsCount: 41,
    unmaskedFlags: ["COSMIC_RAY_STRIKE", "SENSOR_THERMAL_DRIFT", "SHUTTER_JITTER_DELAY"]
  };

  const noiseCancel = report.noiseCancellation || {
    activeFilters: ["Double Savitzky-Golay (SG)", "Baseline Trend Correction", "Outlier Sigma-Clipping"],
    preFilterRmsNoisePpm: 480.5,
    postFilterRpmNoisePpm: 135.2,
    noiseReductionRatio: 3.6,
    powerSpectralDensityReductionDb: 11.1
  };

  const trajectory = report.trajectoryTracing || {
    starDistanceLy: 582.0,
    averageOrbitalVelocityKms: 45.2,
    escapeVelocityKms: 63.9,
    interstellarTravelYears: 5820.0,
    bindingEnergyIndex: 0.42,
    earthReachabilityChance: 1.48e-12,
    trajectoryPathPoints: []
  };

  // Run camera sensor recalibration simulation
  const runRecalibration = () => {
    setIsCalibrating(true);
    setCalibrationLog(["Initializing laser guide star telemetry...", "Scanning CCD grid for localized charge traps..."]);
    
    setTimeout(() => {
      setCalibrationLog(prev => [...prev, "Compensating sensor thermal drift (1.45% -> 0.08%)...", "Applying bias-frame mask for hot/dead pixels..."]);
    }, 1000);

    setTimeout(() => {
      setCalibrationLog(prev => [...prev, "Purging cosmic ray transient charges from pixel wells...", "Recalibration complete. Shutter jitter synchronized!"]);
      setTimeout(() => {
        setIsCalibrating(false);
        cameraDiag.hasErrors = false;
        cameraDiag.deadPixelsCount = 0;
        cameraDiag.cosmicRaySpikesCount = 0;
        cameraDiag.shutterJitterMs = 0.2;
        cameraDiag.sensorDriftPercentage = 0.08;
        cameraDiag.unmaskedFlags = [];
      }, 800);
    }, 2000);
  };

  // Trajectory canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let angle = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw background space coordinates
      ctx.strokeStyle = "rgba(99, 102, 241, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 20; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      if (patternView === "trajectory") {
        // --- 3D-Like Trajectory and Velocity vectors ---
        const starRadius = 24;
        const semiMajorX = 120;
        const semiMajorY = 55;
        
        // Draw host star glow
        const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, starRadius * 2);
        glow.addColorStop(0, "#fffbe5");
        glow.addColorStop(0.3, "#fcd34d");
        glow.addColorStop(0.8, "rgba(245, 158, 11, 0.15)");
        glow.addColorStop(1, "rgba(245, 158, 11, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, starRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw star core
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(cx, cy, starRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw orbital path trace
        ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.ellipse(cx, cy, semiMajorX, semiMajorY, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ejection Animation overrides
        if (isEjecting) {
          const t = ejectionProgress;
          // Hyperbolic ejection path moving rightwards and slightly up
          const px = cx + semiMajorX * Math.cos(angle) + t * 240;
          const py = cy + semiMajorY * Math.sin(angle) - t * 120;

          // Draw trailing drift trajectory
          ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx + semiMajorX * Math.cos(angle), cy + semiMajorY * Math.sin(angle));
          ctx.bezierCurveTo(cx + semiMajorX * Math.cos(angle) + 50, cy + semiMajorY * Math.sin(angle) - 20, px - 50, py + 20, px, py);
          ctx.stroke();

          // Draw ejected projectile particle
          ctx.fillStyle = "#c084fc";
          ctx.shadowColor = "#a855f7";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Draw text indicator
          ctx.fillStyle = "#c084fc";
          ctx.font = "9px monospace";
          ctx.fillText("Interstellar Ejection Vector", px + 10, py - 5);

          // Render Earth target in top-right corner
          const ex = canvas.width - 50;
          const ey = 50;
          const earthGlow = ctx.createRadialGradient(ex, ey, 2, ex, ey, 15);
          earthGlow.addColorStop(0, "#93c5fd");
          earthGlow.addColorStop(0.5, "#3b82f6");
          earthGlow.addColorStop(1, "rgba(59, 130, 246, 0)");
          ctx.fillStyle = earthGlow;
          ctx.beginPath();
          ctx.arc(ex, ey, 15, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#60a5fa";
          ctx.font = "bold 9px monospace";
          ctx.fillText("EARTH", ex - 13, ey + 24);
        } else {
          // Regular orbiting planet
          const px = cx + semiMajorX * Math.cos(angle);
          const py = cy + semiMajorY * Math.sin(angle);

          // Draw planet
          ctx.fillStyle = "#22c55e";
          ctx.shadowColor = "#4ade80";
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(px, py, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Draw Velocity vector arrow (tangent to orbit)
          const dx = -semiMajorX * Math.sin(angle);
          const dy = semiMajorY * Math.cos(angle);
          const len = Math.sqrt(dx * dx + dy * dy);
          const vx = (dx / len) * 35;
          const vy = (dy / len) * 35;

          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + vx, py + vy);
          ctx.stroke();

          // Arrowhead
          const arrowAngle = Math.atan2(vy, vx);
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.moveTo(px + vx, py + vy);
          ctx.lineTo(px + vx - 6 * Math.cos(arrowAngle - Math.PI/6), py + vy - 6 * Math.sin(arrowAngle - Math.PI/6));
          ctx.lineTo(px + vx - 6 * Math.cos(arrowAngle + Math.PI/6), py + vy - 6 * Math.sin(arrowAngle + Math.PI/6));
          ctx.fill();

          // Text labels for dynamics
          ctx.fillStyle = "#ef4444";
          ctx.font = "9px monospace";
          ctx.fillText(`v_orbit: ${trajectory.averageOrbitalVelocityKms} km/s`, px + vx + 5, py + vy + 3);

          // Gravity pull vector pointing back to star
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + (cx - px) * 0.25, py + (cy - py) * 0.25);
          ctx.stroke();
          ctx.fillStyle = "#3b82f6";
          ctx.font = "8px monospace";
          ctx.fillText("F_gravity", px + (cx - px) * 0.3 - 10, py + (cy - py) * 0.3);

          angle += 0.015;
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [patternView, isEjecting, ejectionProgress, trajectory]);

  // Handle ejection trajectory simulation button click
  const runEjectionSimulation = () => {
    if (isEjecting) return;
    setIsEjecting(true);
    setEjectionProgress(0);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.02;
      setEjectionProgress(progress);
      
      const distLy = Math.max(0, trajectory.starDistanceLy * (1 - progress));
      const yrs = trajectory.interstellarTravelYears * progress;
      const v_esc = trajectory.escapeVelocityKms * (1 + progress * 0.2);
      const ingress = trajectory.earthReachabilityChance * (1 + progress * 2.5);

      setEjectionStats({
        distanceRemainingLy: parseFloat(distLy.toFixed(2)),
        currentSpeedKms: parseFloat(v_esc.toFixed(1)),
        yearsElapsed: parseFloat(yrs.toFixed(0)),
        ingressChance: ingress
      });

      if (progress >= 1.0) {
        clearInterval(interval);
        setTimeout(() => {
          setIsEjecting(false);
          setEjectionStats(null);
        }, 3000);
      }
    }, 80);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-space-700/50">
        <div>
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Radar className="w-5 h-5 text-neon-cyan animate-pulse" />
            Diagnostics & Interstellar Trajectory Hub
          </h2>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            Trace sub-millimag planetary transits, analyze sensor arrays, apply noise cancellation metrics, and trace system ejection trajectory paths.
          </p>
        </div>
      </div>

      {/* Grid of the 4 core technologies */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Minute Dip Detection */}
        <div className="bg-space-900 border border-space-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono text-gray-500 uppercase">TECHNOLOGY 01</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase">
                ACTIVE
              </span>
            </div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-neon-cyan" />
              Minute Dip Detection
            </h3>
            <p className="text-[11px] text-gray-400 leading-normal">
              Detects sub-millimag planetary grazing drops below TESS/Kepler standard levels.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-space-800 space-y-2 text-[10px] font-mono">
            <div className="flex justify-between text-gray-400">
              <span>Dips Count:</span>
              <strong className="text-white">{minuteDips.dipsDetectedCount}</strong>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Avg Depth:</span>
              <strong className="text-emerald-400">{minuteDips.averageDipDepthPpm} ppm</strong>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Shallowest:</span>
              <strong className="text-white">{minuteDips.shallowestDipDepthPpm} ppm</strong>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>SNR Benefit:</span>
              <strong className="text-neon-cyan">+{minuteDips.snrImprovement}%</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Telescope Camera Diagnostics */}
        <div className={`bg-space-900 border rounded-xl p-4 flex flex-col justify-between transition ${
          cameraDiag.hasErrors ? "border-rose-500/30" : "border-space-800/80"
        }`}>
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono text-gray-500 uppercase">TECHNOLOGY 02</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase ${
                cameraDiag.hasErrors 
                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/20" 
                  : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
              }`}>
                {cameraDiag.hasErrors ? "FLAGGED" : "NOMINAL"}
              </span>
            </div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-rose-400" />
              Telescope Camera Diagnostic
            </h3>
            <p className="text-[11px] text-gray-400 leading-normal">
              Scans raw frames for cosmic ray spikes, unmasked hot pixels, and sensor drift warping.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-space-800 space-y-2 text-[10px] font-mono">
            <div className="flex justify-between text-gray-400">
              <span>Dead Pixels:</span>
              <strong className="text-white">{cameraDiag.deadPixelsCount}</strong>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Cosmic Rays:</span>
              <strong className="text-rose-400">{cameraDiag.cosmicRaySpikesCount}</strong>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Sensor Drift:</span>
              <strong className="text-white">{cameraDiag.sensorDriftPercentage}%</strong>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Shutter Jitter:</span>
              <strong className="text-white">{cameraDiag.shutterJitterMs} ms</strong>
            </div>
          </div>
        </div>

        {/* Card 3: Noise Cancellation */}
        <div className="bg-space-900 border border-space-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono text-gray-500 uppercase">TECHNOLOGY 03</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 uppercase">
                DENOISED
              </span>
            </div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              Noise Cancellation Engine
            </h3>
            <p className="text-[11px] text-gray-400 leading-normal">
              Applies double Savitzky-Golay and baseline whitening filters to isolate transits.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-space-800 space-y-2 text-[10px] font-mono">
            <div className="flex justify-between text-gray-400">
              <span>Pre-Filter RMS:</span>
              <strong className="text-rose-400">{noiseCancel.preFilterRmsNoisePpm} ppm</strong>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Post-Filter RMS:</span>
              <strong className="text-emerald-400">{noiseCancel.postFilterRpmNoisePpm} ppm</strong>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Noise Reduction:</span>
              <strong className="text-indigo-400 font-bold">{noiseCancel.noiseReductionRatio}x ratio</strong>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Power Gain:</span>
              <strong className="text-white">-{noiseCancel.powerSpectralDensityReductionDb} dB</strong>
            </div>
          </div>
        </div>

        {/* Card 4: Relativistic Trajectory Tracing */}
        <div className="bg-space-900 border border-space-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono text-gray-500 uppercase">TECHNOLOGY 04</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/20 uppercase">
                INTERSTELLAR
              </span>
            </div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              Relativistic Trajectory
            </h3>
            <p className="text-[11px] text-gray-400 leading-normal">
              Traces systemic orbits, esc velocity, and predicts collision / reachability chance to Earth.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-space-800 space-y-2 text-[10px] font-mono">
            <div className="flex justify-between text-gray-400">
              <span>System Distance:</span>
              <strong className="text-white">{trajectory.starDistanceLy} LY</strong>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Avg Orbit Vel:</span>
              <strong className="text-emerald-400">{trajectory.averageOrbitalVelocityKms} km/s</strong>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Escape Speed:</span>
              <strong className="text-amber-400">{trajectory.escapeVelocityKms} km/s</strong>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Transit @ 0.1c:</span>
              <strong className="text-white">{trajectory.interstellarTravelYears} yrs</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main interactive panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Interactive workspace: Graphical Detection and Pattern Study */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-space-800">
              <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                <LineChart className="w-4 h-4 text-neon-cyan" />
                Scientific Pattern Study & Trajectory Canvas
              </h3>
              
              <div className="flex bg-space-950 p-1 rounded-lg border border-space-850 gap-1 flex-wrap md:flex-nowrap">
                <button
                  onClick={() => setPatternView("trajectory")}
                  className={`px-3 py-1 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer ${
                    patternView === "trajectory" ? "bg-neon-cyan/20 text-neon-cyan" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Orbital Mechanics
                </button>
                <button
                  onClick={() => setPatternView("transit")}
                  className={`px-3 py-1 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer ${
                    patternView === "transit" ? "bg-neon-cyan/20 text-neon-cyan" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Transit Profiler
                </button>
                <button
                  onClick={() => setPatternView("residuals")}
                  className={`px-3 py-1 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer ${
                    patternView === "residuals" ? "bg-neon-cyan/20 text-neon-cyan" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Noise Residuals
                </button>
                <button
                  onClick={() => setPatternView("lab")}
                  className={`px-3 py-1 text-[10px] font-mono font-bold rounded transition-colors cursor-pointer ${
                    patternView === "lab" ? "bg-neon-cyan/20 text-neon-cyan" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Trajectory Lab
                </button>
              </div>
            </div>

            {/* Simulated Live canvas stage */}
            <div className={`relative bg-space-950 border border-space-850 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-300 ${
              patternView === "lab" ? "min-h-[460px] p-5 block" : "h-[280px]"
            }`}>
              {patternView === "lab" ? (
                <div className="w-full space-y-4 text-left font-sans">
                  {/* Title and brief description */}
                  <div className="flex justify-between items-center border-b border-space-800 pb-2">
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">Workspace Lab</span>
                      <h4 className="text-xs font-semibold text-white">Relativistic Interstellar Trajectory Simulator</h4>
                    </div>
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">
                      v2.0 Beta
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Column: Configurator & Parameters (Sliders) */}
                    <div className="space-y-3 bg-space-900/50 p-3 rounded-lg border border-space-800">
                      <div className="text-[10px] font-mono text-gray-400 font-bold tracking-wider uppercase border-b border-space-850 pb-1 mb-2">
                        Orbital Parameter Configurator
                      </div>

                      {/* Slider 1: Planet Radius */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-gray-400">Planet Radius:</span>
                          <span className="text-neon-cyan font-bold">{labPlanetRadius.toFixed(2)} R⊕</span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="15.0"
                          step="0.1"
                          value={labPlanetRadius}
                          onChange={(e) => setLabPlanetRadius(parseFloat(e.target.value))}
                          className="w-full accent-neon-cyan h-1 bg-space-950 rounded-lg appearance-none cursor-pointer animate-none"
                        />
                      </div>

                      {/* Slider 2: Semi-Major Axis */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-gray-400">Semi-Major Axis:</span>
                          <span className="text-neon-cyan font-bold">{labSemiMajorAxis.toFixed(3)} AU</span>
                        </div>
                        <input
                          type="range"
                          min="0.010"
                          max="2.5"
                          step="0.005"
                          value={labSemiMajorAxis}
                          onChange={(e) => setLabSemiMajorAxis(parseFloat(e.target.value))}
                          className="w-full accent-neon-cyan h-1 bg-space-950 rounded-lg appearance-none cursor-pointer animate-none"
                        />
                      </div>

                      {/* Slider 3: Host Star Mass */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-gray-400">Host Star Mass:</span>
                          <span className="text-emerald-400 font-bold">{labStarMass.toFixed(2)} M☉</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="3.0"
                          step="0.05"
                          value={labStarMass}
                          onChange={(e) => setLabStarMass(parseFloat(e.target.value))}
                          className="w-full accent-emerald-400 h-1 bg-space-950 rounded-lg appearance-none cursor-pointer animate-none"
                        />
                      </div>

                      {/* Slider 4: System Distance */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-gray-400">Stellar System Distance:</span>
                          <span className="text-amber-400 font-bold">{labStarDistance.toFixed(0)} LY</span>
                        </div>
                        <input
                          type="range"
                          min="4.2"
                          max="2500"
                          step="5"
                          value={labStarDistance}
                          onChange={(e) => setLabStarDistance(parseFloat(e.target.value))}
                          className="w-full accent-amber-400 h-1 bg-space-950 rounded-lg appearance-none cursor-pointer animate-none"
                        />
                      </div>

                      {/* Slider 5: Slingshot / Ejection Speed */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-gray-400">Slingshot Ejection Velocity:</span>
                          <span className="text-purple-400 font-bold">{labSlingshotSpeed.toFixed(1)} km/s</span>
                        </div>
                        <input
                          type="range"
                          min="10.0"
                          max="500.0"
                          step="5.0"
                          value={labSlingshotSpeed}
                          onChange={(e) => setLabSlingshotSpeed(parseFloat(e.target.value))}
                          className="w-full accent-purple-400 h-1 bg-space-950 rounded-lg appearance-none cursor-pointer animate-none"
                        />
                      </div>

                      {/* Slider 6: Detection Confidence */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-gray-400">Detection Confidence Level:</span>
                          <span className="text-white font-bold">{labConfidence}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          step="1"
                          value={labConfidence}
                          onChange={(e) => setLabConfidence(parseInt(e.target.value))}
                          className="w-full accent-white h-1 bg-space-950 rounded-lg appearance-none cursor-pointer animate-none"
                        />
                      </div>
                    </div>

                    {/* Right Column: Live Calculations & Prediction Card */}
                    <div className="space-y-3 flex flex-col justify-between">
                      {/* Live Physics Calculations */}
                      <div className="bg-space-900/50 p-3 rounded-lg border border-space-800 space-y-2 font-mono text-[10px]">
                        <div className="text-[10px] text-gray-400 font-bold tracking-wider uppercase border-b border-space-850 pb-1 mb-1">
                          Calculated Physics Metrics
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Orbital velocity:</span>
                          <strong className="text-emerald-400">
                            {(29.78 * Math.sqrt(labStarMass / labSemiMajorAxis)).toFixed(2)} km/s
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Planet escape velocity:</span>
                          <strong className="text-emerald-400">
                            {(11.2 * Math.sqrt(labPlanetRadius)).toFixed(2)} km/s
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Orbital Radius (Distance):</span>
                          <strong className="text-white">
                            {(labSemiMajorAxis * 149.5978707).toFixed(1)} Million km
                          </strong>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-space-850/50">
                          <span className="text-gray-500">Travel time @ 0.1c:</span>
                          <strong className="text-amber-400">{(labStarDistance * 10).toLocaleString()} Years</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Travel time @ Voyager 1 (17km/s):</span>
                          <strong className="text-white">{(labStarDistance * 17647).toLocaleString()} Years</strong>
                        </div>
                      </div>

                      {/* Theoretical Earth Reach / Collision Prediction Card */}
                      <div className="bg-rose-950/20 border border-rose-500/30 rounded-lg p-3.5 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-500 animate-pulse" />
                            Relativistic Ingress Forecast
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                            labConfidence >= 80 
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                              : "bg-gray-500/15 text-gray-400 border border-gray-500/20"
                          }`}>
                            {labConfidence >= 80 ? "HIGH CONFIDENCE CANDIDATE" : "PROVISIONAL STATE"}
                          </span>
                        </div>

                        {/* Calculations for Earth reach / collision probability */}
                        {(() => {
                          const reachProb = (labPlanetRadius * (labSlingshotSpeed / 100) * (labConfidence / 100)) / Math.pow(labStarDistance, 1.8) * 1.48e-10;
                          const equivOdds = reachProb > 0 ? 1 / (reachProb / 100) : 0;
                          
                          let severity = "";
                          let severityColor = "";
                          if (labPlanetRadius < 1.0) {
                            severity = "Atmospheric Searing / Minimal Collision Risk";
                            severityColor = "text-yellow-400";
                          } else if (labPlanetRadius >= 1.0 && labPlanetRadius < 2.0) {
                            severity = "Extinction Level / Planetary Resurfacing Risk";
                            severityColor = "text-orange-400";
                          } else if (labPlanetRadius >= 2.0 && labPlanetRadius < 5.0) {
                            severity = "Continental Shockwave / Mantle Vaporization Risk";
                            severityColor = "text-rose-400 font-bold";
                          } else {
                            severity = "Planetary Shattering / Binary Accretion Collapse";
                            severityColor = "text-rose-500 font-bold animate-pulse";
                          }

                          return (
                            <div className="space-y-2">
                              <div className="flex items-baseline justify-between">
                                <span className="text-[9px] font-mono text-gray-400">Theoretical Ingress Chance:</span>
                                <strong className="text-rose-400 text-sm font-mono tracking-tight font-extrabold">
                                  {reachProb.toExponential(5)}%
                                </strong>
                              </div>
                              <div className="flex items-baseline justify-between border-b border-space-850/50 pb-1.5">
                                <span className="text-[9px] font-mono text-gray-400">Theoretical Odds:</span>
                                <strong className="text-white text-[10px] font-mono">
                                  {equivOdds > 1e12 
                                    ? "1 in " + (equivOdds / 1e12).toFixed(2) + " Trillion" 
                                    : equivOdds > 1e9 
                                    ? "1 in " + (equivOdds / 1e9).toFixed(2) + " Billion" 
                                    : "1 in " + equivOdds.toLocaleString(undefined, { maximumFractionDigits: 0 })
                                  }
                                </strong>
                              </div>
                              <div className="text-[10px] leading-relaxed">
                                <span className="text-gray-400 block text-[9px] font-mono">ESTIMATED COLLISION SEVERITY:</span>
                                <span className={`${severityColor} block mt-0.5 text-[10px]`}>{severity}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : patternView === "trajectory" ? (
                <>
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={280}
                    className="w-full h-full block"
                  />
                  <div className="absolute top-3 left-3 bg-space-900/90 border border-space-800 px-2.5 py-1.5 rounded-md text-[10px] font-mono text-gray-300 pointer-events-none">
                    <span className="text-neon-cyan font-bold block">DYNAMIC KEPLERIAN MODEL</span>
                    <span>Star: {report.metadata.starName}</span>
                    <span className="block mt-0.5">Semi-major axis: {report.parameters.semiMajorAxis} AU</span>
                  </div>
                  
                  {isEjecting && ejectionStats && (
                    <div className="absolute bottom-3 right-3 bg-purple-950/95 border border-purple-800/60 p-2.5 rounded-lg text-[9px] font-mono text-purple-200 w-52 shadow-2xl animate-pulse">
                      <span className="text-purple-400 font-bold block border-b border-purple-800 pb-0.5 mb-1 text-center">
                        RELATIVISTIC PROJECTION LIVE
                      </span>
                      <div className="flex justify-between">
                        <span>Dist to Earth:</span>
                        <span className="text-white font-bold">{ejectionStats.distanceRemainingLy} LY</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Speed:</span>
                        <span className="text-amber-400 font-bold">{ejectionStats.currentSpeedKms} km/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time Elapsed:</span>
                        <span className="text-white font-bold">{ejectionStats.yearsElapsed} yrs</span>
                      </div>
                      <div className="flex justify-between mt-1 border-t border-purple-800/40 pt-1">
                        <span>Reachability:</span>
                        <span className="text-rose-400 font-bold">{ejectionStats.ingressChance.toExponential(4)}%</span>
                      </div>
                    </div>
                  )}
                </>
              ) : patternView === "transit" ? (
                <div className="w-full h-full p-6 flex flex-col justify-between">
                  <div className="space-y-1.5 text-left">
                    <span className="text-[10px] font-mono text-neon-cyan uppercase">TRANSIT GEOMETRY STUDY</span>
                    <h4 className="text-xs font-semibold text-white">Transit Grazing Parameter & Limb Darkening</h4>
                    <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                      Study the ingress and egress slope patterns. A sharp V-shape indicates a high grazing parameter (potential binary star), whereas a flat U-shape proves a complete planetary disk occultation with host star limb-darkening.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 font-mono text-[10px]">
                    <div className="bg-space-900 p-2.5 rounded border border-space-800 text-center">
                      <span className="text-gray-400 block text-[9px]">GRAZING PARAMETER (b)</span>
                      <strong className="text-white text-xs block mt-0.5">
                        {report.falsePositiveRejection.backgroundEB ? "0.88 (HIGH)" : "0.24 (LOW)"}
                      </strong>
                    </div>
                    <div className="bg-space-900 p-2.5 rounded border border-space-800 text-center">
                      <span className="text-gray-400 block text-[9px]">LIMB DARKENING coefficient</span>
                      <strong className="text-emerald-400 text-xs block mt-0.5">0.62 (Quadratic)</strong>
                    </div>
                    <div className="bg-space-900 p-2.5 rounded border border-space-800 text-center">
                      <span className="text-gray-400 block text-[9px]">OCCULTATION RATIO (Rp/Rs)</span>
                      <strong className="text-neon-cyan text-xs block mt-0.5">
                        {(report.parameters.planetRadius * 0.009).toFixed(4)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-center bg-space-900/50 p-2.5 rounded border border-space-800 text-[10px] leading-relaxed text-gray-400 text-left">
                    <Info className="w-4 h-4 text-neon-cyan flex-shrink-0" />
                    <span>
                      The symmetric egress timing profile (<strong>94% matching</strong>) rules out catastrophic planetary disruption or outer system cometary comas, proving a stable solid-surface exoplanetary transit.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full p-6 flex flex-col justify-between text-left">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-indigo-400 uppercase">NOISE REMOVAL RESIDUALS</span>
                    <h4 className="text-xs font-semibold text-white">Pre-whitening Power Spectrum & Residual Noise</h4>
                    <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                      Visualizing the high frequency noise removed during double Savitzky-Golay filtering. Removing this stellar jitter amplifies the transit depth signature, letting us identify tiny sub-millimag transits.
                    </p>
                  </div>

                  {/* Noise RMS progress bar */}
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1 font-mono text-[10px]">
                      <div className="flex justify-between text-gray-400">
                        <span>Original Raw Stellar Jitter:</span>
                        <span className="text-rose-400 font-bold">{noiseCancel.preFilterRmsNoisePpm} ppm</span>
                      </div>
                      <div className="h-2 bg-space-900 rounded-full overflow-hidden border border-space-800">
                        <div className="h-full bg-rose-500" style={{ width: "100%" }} />
                      </div>
                    </div>

                    <div className="space-y-1 font-mono text-[10px]">
                      <div className="flex justify-between text-gray-400">
                        <span>Cleaned Residual Noise:</span>
                        <span className="text-emerald-400 font-bold">{noiseCancel.postFilterRpmNoisePpm} ppm</span>
                      </div>
                      <div className="h-2 bg-space-900 rounded-full overflow-hidden border border-space-800">
                        <div className="h-full bg-emerald-500" style={{ width: `${(noiseCancel.postFilterRpmNoisePpm / noiseCancel.preFilterRmsNoisePpm) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono p-2 rounded text-center">
                    Successfully reduced raw noise by <strong>{noiseCancel.noiseReductionRatio}x</strong>, bringing Lomb-Scargle signal out of background clutter.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right workspace panel: Diagnostics log and reachability predictor */}
        <div className="lg:col-span-1 space-y-6">
          {/* Telescope Hardware diagnostics console */}
          <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4 text-left">
            <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
              <Tv className="w-4 h-4 text-rose-400 animate-pulse" />
              Telescope Diagnostic Console
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed font-sans">
              Analyzes raw CCD arrays to flag bad exposures, thermal drift, and shutter synchronization delays.
            </p>

            <div className="bg-space-950 border border-space-850 p-3 rounded-lg font-mono text-[11px] space-y-2.5 max-h-[140px] overflow-y-auto">
              <div className="text-[10px] text-gray-500 uppercase border-b border-space-850 pb-1">
                HARDWARE STATUS REPORT
              </div>
              
              {cameraDiag.hasErrors ? (
                <div className="text-rose-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> CAMERA ERRORS UNMASKED
                </div>
              ) : (
                <div className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> CCD STATUS NOMINAL
                </div>
              )}

              <div className="space-y-1 text-gray-400 text-[10px]">
                <div>Stray light glare: <strong className="text-white">{(cameraDiag.strayLightContaminationLevel * 100).toFixed(1)}%</strong></div>
                <div>Sensor thermal drift: <strong className="text-white">{cameraDiag.sensorDriftPercentage}% / hr</strong></div>
                <div>Cosmic spike well count: <strong className="text-white">{cameraDiag.cosmicRaySpikesCount} spikes</strong></div>
                <div>Hot pixel pixel wells: <strong className="text-white">{cameraDiag.hotPixelsCount} / CCD</strong></div>
              </div>
            </div>

            {/* Simulated recalibration log */}
            {isCalibrating && (
              <div className="bg-space-950 border border-indigo-500/30 p-2.5 rounded-lg font-mono text-[9px] text-indigo-300 space-y-1 animate-pulse">
                {calibrationLog.map((log, lIdx) => (
                  <div key={lIdx}>&gt; {log}</div>
                ))}
              </div>
            )}

            <button
              onClick={runRecalibration}
              disabled={isCalibrating}
              className="w-full py-2 bg-space-950 border border-space-800 hover:border-indigo-500/30 text-gray-300 hover:text-indigo-300 font-mono text-xs font-semibold rounded cursor-pointer transition flex items-center justify-center gap-1.5"
            >
              {isCalibrating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Recalibrating Sensor...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" /> Re-calibrate Sensor Array
                </>
              )}
            </button>
          </div>

          {/* Special Prediction Technology: Relativistic Ingress and Earth Reachability Forecast */}
          <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4 text-left">
            <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              Interstellar Trajectory Forecast
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed font-sans">
              Calculates systemic escape velocities and models the probability of ejected comets or projectiles from {report.metadata.starName} to reach Earth.
            </p>

            <div className="bg-space-950 border border-space-850 p-3 rounded-lg font-mono text-[10px] space-y-2">
              <div className="flex justify-between border-b border-space-850 pb-1.5 mb-2">
                <span className="text-gray-500 uppercase">DYNAMIC METRIC</span>
                <span className="text-amber-400 font-bold font-mono">VALUE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Star Distance:</span>
                <strong className="text-white">{trajectory.starDistanceLy} Light Years</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">System Orbit Vel:</span>
                <strong className="text-emerald-400">{trajectory.averageOrbitalVelocityKms} km/s</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Escape Velocity:</span>
                <strong className="text-amber-400">{trajectory.escapeVelocityKms} km/s</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Transit @ 0.1c:</span>
                <strong className="text-white">{trajectory.interstellarTravelYears} Years</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gravitational Binding:</span>
                <strong className="text-white">{trajectory.bindingEnergyIndex}</strong>
              </div>
              <div className="flex justify-between border-t border-space-850 pt-1.5 mt-2">
                <span className="text-gray-300 font-bold">Earth Reachability:</span>
                <strong className="text-rose-400 font-bold">{trajectory.earthReachabilityChance.toExponential(4)}%</strong>
              </div>
            </div>

            <button
              onClick={runEjectionSimulation}
              disabled={isEjecting}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/30 text-amber-300 font-mono text-xs font-semibold rounded cursor-pointer transition flex items-center justify-center gap-1.5 shadow-md"
            >
              <Compass className="w-4 h-4 animate-spin-slow" />
              {isEjecting ? "Simulating Ejection..." : "Simulate Interstellar Drift"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
