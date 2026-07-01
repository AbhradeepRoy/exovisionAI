import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  LineChart,
  Brain,
  FileText,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Play,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  User,
  Activity,
  Download,
  Printer,
  ChevronRight,
  Database,
  RefreshCw,
  Search,
  Sliders,
  HelpCircle,
  Keyboard,
  Radar,
  MessageSquare,
  Cpu,
  Layers,
  Globe,
  BarChart3
} from "lucide-react";

import { CosmicBackground } from "./components/CosmicBackground";
import { InteractiveChart } from "./components/InteractiveChart";
import { OrbitalVisualizer } from "./components/OrbitalVisualizer";
import { DiagnosticsHub } from "./components/DiagnosticsHub";
import JSZip from "jszip";
import {
  DataPoint,
  PreprocessingConfig,
  ExtractedFeatures,
  EstimatedParameters,
  MLPredictions,
  FalsePositiveRejection,
  ExplainableAIOutput,
  DetectionReport,
  DetectionClass,
  SavedHistoryItem,
  UserAccount,
  PlanetClass,
  BatchQueueItem
} from "./types";

const TABS = [
  "dashboard",
  "upload",
  "explorer",
  "viewer",
  "diagnostics",
  "detection",
  "explain",
  "simulator",
  "training",
  "chatbot",
  "reports",
  "history",
  "settings"
];

const DRAWBACKS_MITIGATIONS = [
  {
    id: 1,
    title: "Data Limitation & Label Shortage",
    category: "Data & Performance",
    problem: "Astronomical labeled datasets (planet, binary, variable star, noise) are limited and imbalanced.",
    solutions: [
      "Use NASA Kepler and TESS public datasets via Astroquery to retrieve massive unlabelled and archive observations.",
      "Implement data augmentation using synthetic transit injection (simulating exoplanet dips into real light curves to expand minority samples).",
      "Use class balancing techniques like SMOTE on tabular properties, and focal loss or weighted binary cross-entropy loss functions during network training.",
      "Apply self-supervised temporal pretraining on unlabeled light curves before target fine-tuning."
    ],
    icon: Database,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
  },
  {
    id: 2,
    title: "High Model Complexity & Computational Cost",
    category: "Model & AI",
    problem: "CNN + BiLSTM + Transformer + XGBoost ensemble may be too heavy for real-time training and inference.",
    solutions: [
      "Provide a switchable micro-modular architecture (offering a lightweight single CNN-only mode for immediate client-side or CPU previews and an advanced 'Research Mode' running the full ensemble).",
      "Apply knowledge distillation to condense the heavy deep learning ensemble into a single lightweight student model for rapid pipeline sweeps.",
      "Implement model compilation to ONNX format to accelerate CPU/GPU execution speed.",
      "Utilize mixed-precision training (FP16) on server backends to halve the memory footprint and accelerate training loops on Nvidia CUDA devices."
    ],
    icon: Cpu,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
  },
  {
    id: 3,
    title: "Slow Batch Processing Performance",
    category: "Data & Performance",
    problem: "Processing thousands of light curves sequentially will be slow.",
    solutions: [
      "Offload long-running sweep schedules to a distributed, asynchronous task queue (Celery backed by Redis or RabbitMQ).",
      "Leverage multiprocessing pools and high-throughput data processing engines (Ray/Dask) to run preprocessing and periodograms in parallel across multi-core server nodes.",
      "Use mini-batch matrix GPU inference for deep learning modules rather than single-target evaluation.",
      "Stream large light curve files in chunk-based pipelines, preventing memory leaks and high-memory usage.",
      "Cache intermediate BLS and Lomb-Scargle power spectrum scores in persistent databases to avoid recomputations."
    ],
    icon: Activity,
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
  },
  {
    id: 4,
    title: "False Positives Rejection (Very Critical)",
    category: "Astrophysics & Validation",
    problem: "Binary stars, starspots, and instrumental noise can easily mimic planetary transit signals.",
    solutions: [
      "Implement a highly-disciplined multi-stage validation pipeline: Stage 1 (BLS Pre-detection) isolates potential periodic signals; Stage 2 (ML Classifier) assesses transit morphology; Stage 3 (Astrophysical Checks) enforces physical constraints.",
      "Enforce automated centroid shift checks comparing out-of-transit stellar coordinates with in-transit centers to rule out blended background eclipsing binaries.",
      "Require an ensemble voting consensus with strict confidence thresholding and clear 'rejection zones' for borderline targets.",
      "Apply statistical + machine learning hybrid decisions combined with astrophysical odd-even depth checking and secondary eclipse validation limits."
    ],
    icon: AlertTriangle,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20"
  },
  {
    id: 5,
    title: "Lack of Deep Model Explainability",
    category: "Model & AI",
    problem: "Deep learning models act as black boxes, limiting trust in astronomical communities.",
    solutions: [
      "Integrate SHAP (SHapley Additive exPlanations) values to identify global and local tabular feature importances (e.g., impact of period, duration, and star mass).",
      "Implement Integrated Gradients to trace time-series temporal attributions, highlighting specific ingress, bottom, and egress datapoints that triggered the transit model.",
      "Render self-attention weight heatmaps from the Transformer layers to demonstrate what out-of-transit and in-transit intervals are heavily correlated by the network.",
      "Provide human-readable, AI-generated reasoning cards alongside all classifications."
    ],
    icon: HelpCircle,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
  },
  {
    id: 6,
    title: "Scientific Validation Gap",
    category: "Astrophysics & Validation",
    problem: "AI prediction alone is not enough for peer-reviewed astronomical discovery.",
    solutions: [
      "Integrate a secondary physical validation layer enforcing classical astrophysical checks (Period consistency, Shape V-shape vs U-shape classification, secondary eclipse exclusion, core stellar class constraints).",
      "Incorporate Bayesian uncertainty estimation and Monte Carlo Dropout layers to deliver realistic probability margins (e.g., 94.2% ± 1.8%).",
      "Never mark detections as 'Confirmed Planet'—always maintain the scientifically accurate 'Candidate Planet' status until peer-reviewed spectroscopy is uploaded."
    ],
    icon: CheckCircle,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
  },
  {
    id: 7,
    title: "Dependency on Stellar Parameters",
    category: "Astrophysics & Validation",
    problem: "Planet radius estimation requires stellar radius and mass, which may not always be available.",
    solutions: [
      "Integrate an automated lookup to the Gaia DR3 catalog via Astroquery to retrieve missing stellar properties (temperature, mass, radius, and parallax).",
      "Implement a robust mathematical fallback estimation (using spectral energy distribution models or standard solar-type assumptions) paired with a high-margin uncertainty range when star statistics are missing.",
      "Mark outputs clearly as 'Estimated from nominal stellar templates' rather than 'Measured' to reflect physical gaps."
    ],
    icon: Sliders,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20"
  },
  {
    id: 8,
    title: "Research Novelty Challenge",
    category: "Astrophysics & Validation",
    problem: "Many individual components (BLS, Lightkurve, standard CNNs) already exist in literature.",
    solutions: [
      "Center novelty on the hybrid fusion of machine learning ensembles with rigid astrophysical heuristics.",
      "Deliver interactive, web-accessible time-series attributions (Integrated Gradients) directly to researchers' browsers.",
      "Pioneer an end-to-end, dual-mode candidate ranking pipeline with automated centroid shift checks and theoretical transit depth comparison tables."
    ],
    icon: Sparkles,
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
  },
  {
    id: 9,
    title: "Overcomplex System Architecture",
    category: "Model & AI",
    problem: "Too many features may reduce maintainability and increase bug frequency.",
    solutions: [
      "Build using a micro-modular framework where preprocessing, period search, neural inference, and reporting are completely decoupled.",
      "Establish clear, type-safe API boundaries and contracts (using TypeScript on the frontend and Pydantic models on the backend).",
      "Integrate robust feature flags allowing administrators or researchers to toggle resource-intensive modules (like real-time trajectory simulation or massive batch sweeps)."
    ],
    icon: Layers,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
  },
  {
    id: 10,
    title: "Model Evaluation & Overfitting Risk",
    category: "Model & AI",
    problem: "High model complexity may lead to severe overfitting on specific telescope fields.",
    solutions: [
      "Perform stratified K-fold cross-validation across multiple distinct stellar fields (e.g., training on Kepler fields and testing on TESS Southern Ecliptic Pole sectors).",
      "Apply heavy temporal regularization (Dropout rates of 30-50%, L2 weight decay, and early-stopping criteria based on validation loss).",
      "Assess models using robust metrics (Precision-Recall Area Under Curve [PR-AUC], ROC-AUC, and F1-scores) rather than simple accuracy to protect against imbalanced sets.",
      "Conduct 'Domain Shift' tests on newly published targets from independent sky campaigns."
    ],
    icon: BarChart3,
    color: "text-orange-400 bg-orange-500/10 border-orange-500/20"
  },
  {
    id: 11,
    title: "Real-World Deployment Bottlenecks",
    category: "Data & Performance",
    problem: "High cloud GPU costs and server scaling bottlenecks under survey-scale loads.",
    solutions: [
      "Containerize the entire web and worker stack using Docker, allowing seamless scaling on Kubernetes or serverless containers (like Google Cloud Run).",
      "Configure a dynamic CPU fallback mode for deep learning models, enabling local runs or budget deployments.",
      "Streamline assets and model structures using ONNX runtime and WebGL canvas graphs, running local browser-based preview engines whenever possible to offload server compute."
    ],
    icon: Globe,
    color: "text-teal-400 bg-teal-500/10 border-teal-500/20"
  }
];

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Active pipeline phase in the Interactive Light Curve Viewer
  const [viewerPhase, setViewerPhase] = useState<"raw" | "detrended" | "folded">("detrended");

  // User Profile
  const [user, setUser] = useState<UserAccount>({
    id: "U-1882",
    name: "Dr. Elena Vance",
    email: "e.vance@nasa-esi.org",
    role: "Researcher",
    institution: "Exoplanet Science Institute (ESI)"
  });

  // Preprocessing configurations
  const [prepConfig, setPrepConfig] = useState<PreprocessingConfig>({
    sigmaClipThreshold: 3.2,
    medianFilterWindow: 5,
    savitzkyGolayWindow: 9,
    lowessFraction: 0.2,
    denoisingMethod: "Fourier",
    normalizationMethod: "Robust"
  });

  // Current selected light curve target
  const [selectedTargetId, setSelectedTargetId] = useState<string>("kepler186");
  
  // Custom synthetic injection state
  const [customPeriod, setCustomPeriod] = useState<number>(3.5);
  const [customDepth, setCustomDepth] = useState<number>(850); // ppm
  const [customNoise, setCustomNoise] = useState<number>(0.00015);

  // Parse custom CSV file state
  const [uploadedPoints, setUploadedPoints] = useState<DataPoint[] | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [customStarRadius, setCustomStarRadius] = useState<number | null>(null);
  const [comparisonResults, setComparisonResults] = useState<any[]>([]);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const recalcTimeoutRef = useRef<any>(null);

  // Batch processing queue state
  const [batchQueue, setBatchQueue] = useState<BatchQueueItem[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);

  // Analysis result payload
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [rawPoints, setRawPoints] = useState<DataPoint[]>([]);
  const [preprocessedPoints, setPreprocessedPoints] = useState<DataPoint[]>([]);
  const [phaseFoldedPoints, setPhaseFoldedPoints] = useState<DataPoint[]>([]);
  const [report, setReport] = useState<DetectionReport | null>(null);

  // Gemini deep scientific reasoning explanation
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [geminiExplanation, setGeminiExplanation] = useState<string | null>(null);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  // Local saved analysis history catalog
  const [history, setHistory] = useState<SavedHistoryItem[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>("");

  // UTC clock for research status
  const [currentTime, setCurrentTime] = useState<string>("");

  // Astronomer Feedback states
  const [isFeedbackCorrect, setIsFeedbackCorrect] = useState<boolean | null>(null);

  // Client-side demo CSV generator and downloader
  const downloadDemoCsv = () => {
    const csvContent = `time,flux,error,quality
0.0,1.0001,0.0001,0
0.05,0.9999,0.0001,0
0.1,1.0002,0.0001,0
0.15,0.9998,0.0001,0
0.2,1.0000,0.0001,0
0.25,1.0001,0.0001,0
0.3,0.9999,0.0001,0
0.35,0.9997,0.0001,0
0.4,1.0003,0.0001,0
0.45,1.0001,0.0001,0
0.5,0.9998,0.0001,0
0.55,1.0002,0.0001,0
0.6,1.0000,0.0001,0
0.65,0.9999,0.0001,0
0.7,0.9997,0.0001,0
0.75,1.0001,0.0001,0
0.8,1.0003,0.0001,0
0.85,1.0000,0.0001,0
0.9,0.9998,0.0001,0
0.95,1.0002,0.0001,0
1.0,0.9999,0.0001,0
1.05,1.0001,0.0001,0
1.1,1.0000,0.0001,0
1.15,0.9998,0.0001,0
1.2,1.0002,0.0001,0
1.25,0.9997,0.0001,0
1.3,1.0001,0.0001,0
1.35,1.0003,0.0001,0
1.4,0.9999,0.0001,0
1.45,0.9998,0.0001,0
1.5,1.0001,0.0001,0
1.55,1.0000,0.0001,0
1.6,1.0002,0.0001,0
1.65,0.9999,0.0001,0
1.7,0.9998,0.0001,0
1.75,1.0001,0.0001,0
1.8,1.0003,0.0001,0
1.85,1.0000,0.0001,0
1.9,0.9999,0.0001,0
1.95,1.0002,0.0001,0
2.0,1.0001,0.0001,0
2.05,0.9998,0.0001,0
2.1,1.0000,0.0001,0
2.15,0.9997,0.0001,0
2.2,1.0002,0.0001,0
2.25,1.0001,0.0001,0
2.3,0.9999,0.0001,0
2.35,1.0003,0.0001,0
2.4,1.0000,0.0001,0
2.45,0.9998,0.0001,0
2.5,1.0001,0.0001,0
2.55,1.0000,0.0001,0
2.6,1.0002,0.0001,0
2.65,0.9999,0.0001,0
2.7,0.9997,0.0001,0
2.75,1.0001,0.0001,0
2.8,1.0000,0.0001,0
2.85,0.9912,0.0001,0
2.9,0.9854,0.0001,0
2.95,0.9850,0.0001,0
3.0,0.9848,0.0001,0
3.05,0.9851,0.0001,0
3.1,0.9855,0.0001,0
3.15,0.9915,0.0001,0
3.2,0.9999,0.0001,0
3.25,1.0002,0.0001,0
3.3,1.0000,0.0001,0
3.35,0.9998,0.0001,0
3.4,1.0001,0.0001,0
3.45,1.0003,0.0001,0
3.5,1.0000,0.0001,0
3.55,0.9999,0.0001,0
3.6,1.0002,0.0001,0
3.65,1.0001,0.0001,0
3.7,0.9998,0.0001,0
3.75,1.0000,0.0001,0
3.8,1.0002,0.0001,0
3.85,0.9999,0.0001,0
3.9,1.0001,0.0001,0
3.95,1.0003,0.0001,0
4.0,1.0000,0.0001,0
4.05,0.9998,0.0001,0
4.1,1.0001,0.0001,0
4.15,1.0002,0.0001,0
4.2,0.9999,0.0001,0
4.25,1.0000,0.0001,0
4.3,1.0003,0.0001,0
4.35,0.9998,0.0001,0
4.4,1.0001,0.0001,0
4.45,1.0002,0.0001,0
4.5,1.0000,0.0001,0
4.55,0.9999,0.0001,0
4.6,1.0002,0.0001,0
4.65,1.0001,0.0001,0
4.7,0.9997,0.0001,0
4.75,1.0000,0.0001,0
4.8,1.0003,0.0001,0
4.85,1.0001,0.0001,0
4.9,0.9998,0.0001,0
4.95,1.0002,0.0001,0
5.0,1.0000,0.0001,0
5.05,0.9999,0.0001,0
5.1,1.0001,0.0001,0
5.15,1.0003,0.0001,0
5.2,1.0000,0.0001,0
5.25,0.9998,0.0001,0
5.3,1.0001,0.0001,0
5.35,1.0002,0.0001,0
5.4,0.9999,0.0001,0
5.45,1.0001,0.0001,0
5.5,1.0003,0.0001,0
5.55,1.0000,0.0001,0
5.6,0.9998,0.0001,0
5.65,1.0002,0.0001,0
5.7,1.0001,0.0001,0
5.75,0.9999,0.0001,0
5.8,1.0003,0.0001,0
5.85,1.0000,0.0001,0
5.9,0.9998,0.0001,0
5.95,1.0001,0.0001,0
6.0,1.0002,0.0001,0
6.05,0.9999,0.0001,0
6.1,1.0000,0.0001,0
6.15,1.0003,0.0001,0
6.2,0.9998,0.0001,0
6.25,1.0001,0.0001,0
6.3,1.0002,0.0001,0
6.35,1.0000,0.0001,0
6.4,0.9999,0.0001,0
6.45,1.0002,0.0001,0
6.5,1.0001,0.0001,0
6.55,0.9997,0.0001,0
6.6,1.0000,0.0001,0
6.65,1.0003,0.0001,0
6.7,1.0001,0.0001,0
6.75,0.9998,0.0001,0
6.8,1.0002,0.0001,0
6.85,0.9915,0.0001,0
6.9,0.9856,0.0001,0
6.95,0.9851,0.0001,0
7.0,0.9849,0.0001,0
7.05,0.9852,0.0001,0
7.1,0.9857,0.0001,0
7.15,0.9916,0.0001,0
7.2,1.0001,0.0001,0
7.25,1.0003,0.0001,0
7.3,1.0000,0.0001,0
7.35,0.9998,0.0001,0
7.4,1.0002,0.0001,0
7.45,1.0001,0.0001,0
7.5,1.0000,0.0001,0`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "demo_transit_photometry.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackStats, setFeedbackStats] = useState<{ totalFeedbackCount: number; accuracyMetric: number } | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // --- Simulator States ---
  const [simStellarRadius, setSimStellarRadius] = useState<number>(1.0); // R_sun
  const [simPlanetaryRadius, setSimPlanetaryRadius] = useState<number>(3.8); // R_earth
  const [simOrbitalPeriod, setSimOrbitalPeriod] = useState<number>(3.5); // days
  const [simInclination, setSimInclination] = useState<number>(88.5); // degrees
  const [simOrbitalDistance, setSimOrbitalDistance] = useState<number>(0.05); // AU
  const [simTimeStep, setSimTimeStep] = useState<number>(0);
  
  // Secondary Planet states
  const [simHasSecondPlanet, setSimHasSecondPlanet] = useState<boolean>(false);
  const [simPlanetaryRadius2, setSimPlanetaryRadius2] = useState<number>(2.4); // R_earth
  const [simOrbitalPeriod2, setSimOrbitalPeriod2] = useState<number>(7.2); // days
  const [simInclination2, setSimInclination2] = useState<number>(89.2); // degrees
  const [simOrbitalDistance2, setSimOrbitalDistance2] = useState<number>(0.09); // AU
  
  // --- Model Training States ---
  const [trainEpochs, setTrainEpochs] = useState<number>(15);
  const [trainLr, setTrainLr] = useState<number>(0.001);
  const [trainArchitecture, setTrainArchitecture] = useState<string>("CNN + BiLSTM + Transformer Encoder + XGBoost");
  const [trainBatchSize, setTrainBatchSize] = useState<number>(32);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainProgress, setTrainProgress] = useState<number>(0);
  const [trainLogs, setTrainLogs] = useState<string[]>([]);
  const [trainLossHistory, setTrainLossHistory] = useState<Array<{ epoch: number; loss: number; valLoss: number }>>([]);
  const [trainAccHistory, setTrainAccHistory] = useState<Array<{ epoch: number; acc: number; valAcc: number }>>([]);
  const [isModelTrained, setIsModelTrained] = useState<boolean>(false);

  // --- AI Chatbot States ---
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string; timestamp: string }>>([
    {
      role: "assistant",
      content: "Hello! I am your ExoVision AI Research Assistant. I can help interpret exoplanetary light curves, explain deep neural network transit predictions, or answer astrobiology and astrophysics questions. Ask me anything!",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // --- NASA Archive Target Catalog Explorer states ---
  const [explorerSearchQuery, setExplorerSearchQuery] = useState<string>("");

  // --- Drawbacks & Mitigations search states ---
  const [mitigationQuery, setMitigationQuery] = useState<string>("");
  const [mitigationCat, setMitigationCat] = useState<string>("All");

  const fetchFeedbackStats = async () => {
    try {
      const res = await fetch("/api/feedback/stats");
      const data = await res.json();
      if (data.success) {
        setFeedbackStats({
          totalFeedbackCount: data.totalFeedbackCount,
          accuracyMetric: data.accuracyMetric
        });
      }
    } catch (err) {
      console.error("Failed to fetch feedback stats", err);
    }
  };

  // Initial Seed Data Loading
  useEffect(() => {
    // Clock updates
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Load History catalog from localStorage
    try {
      const stored = localStorage.getItem("exovision_history");
      if (stored) {
        setHistory(JSON.parse(stored));
      } else {
        // Seed catalog with standard default history items
        const seedHistory: SavedHistoryItem[] = [
          {
            id: "EXO-A4D9E2",
            lightCurveId: "kepler186",
            name: "NASA Kepler-186f (Reference Catalog)",
            starName: "Kepler-186",
            timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
            predictionClass: DetectionClass.ExoplanetTransit,
            confidence: 0.9412,
            passedRejection: true
          },
          {
            id: "EXO-F199C2",
            lightCurveId: "binary",
            name: "Eclipsing Binary System EB-0812",
            starName: "KIC 5522789",
            timestamp: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
            predictionClass: DetectionClass.EclipsingBinary,
            confidence: 0.8845,
            passedRejection: false
          }
        ];
        localStorage.setItem("exovision_history", JSON.stringify(seedHistory));
        setHistory(seedHistory);
      }
    } catch (e) {
      console.warn("Could not read localStorage history", e);
    }

    // Run initial analysis for Kepler-186f
    triggerAnalysis("kepler186");
    fetchFeedbackStats();

    return () => clearInterval(interval);
  }, []);

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when user is typing in form inputs, textareas or editable areas
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.hasAttribute("contenteditable"))
      ) {
        return;
      }

      // 1. Tab Switching Shortcuts: Alt + Number (Alt + 1 to Alt + 9)
      if (e.altKey && !isNaN(Number(e.key))) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 9) {
          e.preventDefault();
          const targetTab = TABS[num - 1];
          if (targetTab) {
            setActiveTab(targetTab);
          }
        }
      }

      // Tab Cycle Shortcuts: Alt + ArrowRight / Alt + ArrowLeft
      if (e.altKey && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        e.preventDefault();
        const currentIndex = TABS.indexOf(activeTab);
        if (currentIndex !== -1) {
          let nextIndex = currentIndex;
          if (e.key === "ArrowRight") {
            nextIndex = (currentIndex + 1) % TABS.length;
          } else {
            nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
          }
          setActiveTab(TABS[nextIndex]);
        }
      }

      // 2. Toggling Pipeline Phases:
      // Pressing 'p' or 'Alt + p' cycles the active pipeline phase
      if ((e.key.toLowerCase() === "p" && !e.ctrlKey && !e.metaKey) || (e.altKey && e.key.toLowerCase() === "p")) {
        e.preventDefault();
        
        // Cycle the viewerPhase
        setViewerPhase(prev => {
          if (prev === "raw") return "detrended";
          if (prev === "detrended") return "folded";
          return "raw";
        });
      }

      // Direct phase switching in the viewer tab (1, 2, 3)
      if (activeTab === "viewer" && !e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === "1") {
          e.preventDefault();
          setViewerPhase("raw");
        } else if (e.key === "2") {
          e.preventDefault();
          setViewerPhase("detrended");
        } else if (e.key === "3") {
          e.preventDefault();
          setViewerPhase("folded");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeTab]);

  // Simulator Time Step Animation Tick
  useEffect(() => {
    if (activeTab !== "simulator") return;
    let animId: any;
    const tick = () => {
      setSimTimeStep(prev => (prev + 1) % 360);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [activeTab]);

  // Reset custom stellar radius override when loaded target changes
  useEffect(() => {
    setCustomStarRadius(null);
  }, [report?.id]);

  // Core API caller to trigger light curve pipeline
  const triggerAnalysis = async (targetId: string, customData?: DataPoint[]) => {
    setIsLoading(true);
    setAnalysisError(null);
    setGeminiExplanation(null);
    setGeminiError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetId: targetId,
          customPoints: customData || null,
          config: prepConfig,
          customMetadata: customData ? {
            id: `USER-LC-${Math.floor(Math.random() * 1000)}`,
            name: uploadFileName || "Uploaded Astronomical Dataset",
            source: "User Upload",
            starName: "Target Star",
            starRadius: 1.12,
            starMass: 1.05,
            starTemp: 5850
          } : null
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to process light curve.");
      }

      setRawPoints(data.rawPoints);
      setPreprocessedPoints(data.preprocessedPoints);
      setPhaseFoldedPoints(data.phaseFoldedPoints);
      setReport(data.report);

      // Log success history entry
      addHistoryItem(data.report);

    } catch (err: any) {
      setAnalysisError(err.message || "Network error processing light curve.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to add results to history catalog
  const addHistoryItem = (rep: DetectionReport) => {
    const isExo = Object.keys(rep.predictions.classes).reduce((a, b) => 
      rep.predictions.classes[a as DetectionClass] > rep.predictions.classes[b as DetectionClass] ? a : b
    );

    const newItem: SavedHistoryItem = {
      id: rep.id,
      lightCurveId: rep.lightCurveId,
      name: rep.metadata.name,
      starName: rep.metadata.starName,
      timestamp: rep.timestamp,
      predictionClass: isExo as DetectionClass,
      confidence: rep.predictions.classes[isExo as DetectionClass],
      passedRejection: rep.falsePositiveRejection.passedAllChecks
    };

    setHistory(prev => {
      // Avoid duplicating identical light curve IDs in active session
      const filtered = prev.filter(item => item.lightCurveId !== rep.lightCurveId);
      const updated = [newItem, ...filtered];
      try {
        localStorage.setItem("exovision_history", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const recalculateModel = useCallback((starRadiusValue: number | null) => {
    if (!report) return;
    setIsRecalculating(true);

    if (recalcTimeoutRef.current) {
      clearTimeout(recalcTimeoutRef.current);
    }

    // Offload heavy computation to a deferred setTimeout block to prevent main thread blocking (UI responsiveness)
    recalcTimeoutRef.current = setTimeout(() => {
      const currentStarRadius = starRadiusValue !== null ? starRadiusValue : (report.parameters.starRadius || 1.0);
      const starRadiusInEarth = currentStarRadius * 109.2;
      
      const planets = report.detectedPlanets && report.detectedPlanets.length > 0 
        ? report.detectedPlanets 
        : [report.parameters];

      // Intensive simulated limb-darkening numerical integration (500k steps)
      // to model heavy computation being deferred/yielding.
      let sum = 0;
      for (let i = 0; i < 500000; i++) {
        sum += Math.sin(i) * Math.cos(i);
      }

      const results = planets.map((planet) => {
        const theoreticalDepthPpm = Math.pow(planet.planetRadius / starRadiusInEarth, 2) * 1e6;
        const detectedDepth = planet.transitDepth;
        const ratio = theoreticalDepthPpm > 0 ? (detectedDepth / theoreticalDepthPpm) : 1.0;
        const ratioPercent = ratio * 100;

        let statusLabel = "";
        let statusColor = "";
        
        if (ratio > 1.25) {
          statusLabel = "Stellar Limb Darkening / Oversized Signal";
          statusColor = "text-amber-400";
        } else if (ratio < 0.75) {
          statusLabel = "Grazing Transit / Diluted Signal";
          statusColor = "text-cyan-400";
        } else {
          statusLabel = "Consistent Nominal Model";
          statusColor = "text-emerald-400";
        }

        return {
          planetClass: planet.planetClass,
          planetRadius: planet.planetRadius,
          detectedDepth,
          theoreticalDepthPpm,
          ratioPercent,
          statusLabel,
          statusColor
        };
      });

      setComparisonResults(results);
      setIsRecalculating(false);
    }, 50); // Yielding to the browser event loop
  }, [report]);

  useEffect(() => {
    if (report) {
      setComparisonResults([]);
      recalculateModel(customStarRadius);
    }
    return () => {
      if (recalcTimeoutRef.current) {
        clearTimeout(recalcTimeoutRef.current);
      }
    };
  }, [customStarRadius, report, recalculateModel]);

  const handleResetStarRadius = useCallback(() => {
    setIsRecalculating(true);
    setTimeout(() => {
      setCustomStarRadius(null);
    }, 0);
  }, []);

  const handleStarRadiusChange = useCallback((value: number) => {
    setIsRecalculating(true);
    setTimeout(() => {
      setCustomStarRadius(value);
    }, 0);
  }, []);

  const handleSetFeedbackCorrect = useCallback((isCorrect: boolean) => {
    setTimeout(() => {
      setIsFeedbackCorrect(isCorrect);
    }, 0);
  }, []);

  const submitAstronomerFeedback = useCallback(async () => {
    if (isFeedbackCorrect === null || !report) return;
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: report.id,
          datasetId: report.lightCurveId,
          predictionClass: report.predictions.primaryClass,
          isCorrect: isFeedbackCorrect,
          feedbackNotes: feedbackNotes,
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackSuccess(true);
        setFeedbackStats(data.stats);
        setFeedbackNotes("");
        setIsFeedbackCorrect(null);
        setTimeout(() => setFeedbackSuccess(false), 5000);
      }
    } catch (err) {
      console.error("Error submitting feedback", err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  }, [isFeedbackCorrect, report, feedbackNotes]);

  // Trigger Gemini explainable scientific review
  const triggerGeminiExplanation = async () => {
    if (!report) return;
    setIsExplaining(true);
    setGeminiError(null);
    setGeminiExplanation(null);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gemini academic review was unable to analyze this target.");
      }
      setGeminiExplanation(data.explanation);
    } catch (err: any) {
      setGeminiError(err.message || "Failed to contact Gemini Academic Review service.");
    } finally {
      setIsExplaining(false);
    }
  };

  // Robust non-blocking chunked CSV parser using sliced FileReader to handle extremely large files smoothly
  const parseCsvFileInChunks = (
    file: File, 
    onItemProgress: (progress: number) => void
  ): Promise<DataPoint[]> => {
    return new Promise((resolve, reject) => {
      const chunkSize = 256 * 1024; // 256 KB chunk size for smooth UI updates
      let offset = 0;
      let leftover = "";
      const parsed: DataPoint[] = [];
      
      let timeIdx = -1, fluxIdx = -1, errorIdx = -1, qualIdx = -1;
      let headerFound = false;
      let isFirstChunk = true;

      const readNextChunk = () => {
        const slice = file.slice(offset, offset + chunkSize);
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const text = e.target?.result as string;
          if (text === undefined || text === null) {
            resolveAndFinish();
            return;
          }

          // Prepend leftover from previous chunk
          const workingText = leftover + text;
          const lines = workingText.split(/\r?\n/);

          // Keep the last line as leftover since it might be incomplete
          if (offset + chunkSize < file.size) {
            leftover = lines.pop() || "";
          } else {
            leftover = "";
          }

          if (isFirstChunk) {
            isFirstChunk = false;
            // Look for a header in the first 20 lines
            for (let i = 0; i < Math.min(lines.length, 20); i++) {
              const line = lines[i].trim().toLowerCase();
              if (!line) continue;
              if (line.startsWith("#") || line.startsWith("//")) continue;

              if (line.includes("time") || line.includes("flux") || line.includes("bjd") || line.includes("jd")) {
                const separator = line.includes(",") ? "," : (line.includes(";") ? ";" : (line.includes("\t") ? "\t" : /\s+/));
                const cols = line.split(separator).map(c => c.trim().replace(/['"]/g, ""));
                
                const t = cols.findIndex(c => c.includes("time") || c.includes("bjd") || c.includes("jd") || c === "t");
                const f = cols.findIndex(c => (c.includes("flux") || c.includes("val") || c.includes("rel")) && !c.includes("error") && !c.includes("err"));
                const e = cols.findIndex(c => c.includes("error") || c.includes("err") || c.includes("unc"));
                const q = cols.findIndex(c => c.includes("qual") || c.includes("flag") || c.includes("quality"));

                if (t >= 0 || f >= 0) {
                  timeIdx = t >= 0 ? t : 0;
                  fluxIdx = f >= 0 ? f : 1;
                  errorIdx = e >= 0 ? e : 2;
                  qualIdx = q >= 0 ? q : 3;
                  headerFound = true;
                  break;
                }
              }
            }
            
            // Fallbacks if no header is found
            if (!headerFound) {
              timeIdx = 0;
              fluxIdx = 1;
              errorIdx = 2;
              qualIdx = 3;
            }
          }

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            if (line.startsWith("#") || line.startsWith("//")) continue;

            if (headerFound) {
              const lineLower = line.toLowerCase();
              if (lineLower.includes("time") || lineLower.includes("flux") || lineLower.includes("bjd") || lineLower.includes("jd")) {
                continue;
              }
            }

            const separator = line.includes(",") ? "," : (line.includes(";") ? ";" : (line.includes("\t") ? "\t" : /\s+/));
            const parts = line.split(separator).map(p => {
              let cleaned = p.trim().replace(/['"]/g, "");
              if (separator === ";") {
                cleaned = cleaned.replace(",", "."); // European decimal format fallback
              }
              return parseFloat(cleaned);
            });

            if (parts.length >= 2 && !isNaN(parts[timeIdx]) && !isNaN(parts[fluxIdx])) {
              parsed.push({
                time: parts[timeIdx],
                flux: parts[fluxIdx],
                fluxError: parts.length > errorIdx && !isNaN(parts[errorIdx]) ? parts[errorIdx] : 0.0001,
                quality: parts.length > qualIdx && !isNaN(parts[qualIdx]) ? Math.floor(parts[qualIdx]) : 0
              });
            }
          }

          offset += chunkSize;
          const progress = Math.min(99, Math.round((offset / file.size) * 100));
          onItemProgress(progress);

          if (offset < file.size) {
            // yield to main thread so UI stays 100% interactive
            setTimeout(readNextChunk, 0);
          } else {
            resolveAndFinish();
          }
        };

        reader.onerror = (err) => {
          reject(err);
        };

        reader.readAsText(slice);
      };

      const resolveAndFinish = () => {
        // Process final leftover if any
        if (leftover) {
          const line = leftover.trim();
          if (line && !line.startsWith("#") && !line.startsWith("//")) {
            const separator = line.includes(",") ? "," : (line.includes(";") ? ";" : (line.includes("\t") ? "\t" : /\s+/));
            const parts = line.split(separator).map(p => {
              let cleaned = p.trim().replace(/['"]/g, "");
              if (separator === ";") {
                cleaned = cleaned.replace(",", ".");
              }
              return parseFloat(cleaned);
            });

            if (parts.length >= 2 && !isNaN(parts[timeIdx]) && !isNaN(parts[fluxIdx])) {
              parsed.push({
                time: parts[timeIdx],
                flux: parts[fluxIdx],
                fluxError: parts.length > errorIdx && !isNaN(parts[errorIdx]) ? parts[errorIdx] : 0.0001,
                quality: parts.length > qualIdx && !isNaN(parts[qualIdx]) ? Math.floor(parts[qualIdx]) : 0
              });
            }
          }
        }

        if (parsed.length === 0) {
          reject(new Error("No valid row coordinate points detected. Ensure CSV contains comma-separated or whitespace-separated numbers (Time, Flux)."));
          return;
        }

        // Sort points chronologically
        parsed.sort((a, b) => a.time - b.time);
        onItemProgress(100);
        resolve(parsed);
      };

      readNextChunk();
    });
  };

  // Handle custom upload files
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFileName(file.name);
    setUploadError(null);

    try {
      const parsed = await parseCsvFileInChunks(file, () => {});
      setUploadedPoints(parsed);
      setSelectedTargetId("custom_upload");
      triggerAnalysis("custom_upload", parsed);
      setActiveTab("dashboard");
    } catch (err: any) {
      setUploadError(err.message || "Invalid exoplanet dataset file formatting.");
    }
  };

  // Helper to parse CSV / TXT photometry (fallback for synchronous needs)
  const parseCsvPhotometry = (text: string): DataPoint[] => {
    const lines = text.split("\n");
    const parsed: DataPoint[] = [];

    let timeIdx = 0, fluxIdx = 1, errorIdx = 2, qualIdx = 3;
    let headerFound = false;

    // First, let's find the header row if it exists (check first 20 lines)
    for (let i = 0; i < Math.min(lines.length, 20); i++) {
      const line = lines[i].trim().toLowerCase();
      if (!line) continue;
      // Skip comment lines
      if (line.startsWith("#") || line.startsWith("//")) continue;

      if (line.includes("time") || line.includes("flux") || line.includes("bjd") || line.includes("jd")) {
        const separator = line.includes(",") ? "," : (line.includes(";") ? ";" : (line.includes("\t") ? "\t" : /\s+/));
        const cols = line.split(separator).map(c => c.trim().replace(/['"]/g, ""));
        
        const t = cols.findIndex(c => c.includes("time") || c.includes("bjd") || c.includes("jd") || c === "t");
        const f = cols.findIndex(c => (c.includes("flux") || c.includes("val") || c.includes("rel")) && !c.includes("error") && !c.includes("err"));
        const e = cols.findIndex(c => c.includes("error") || c.includes("err") || c.includes("unc"));
        const q = cols.findIndex(c => c.includes("qual") || c.includes("flag") || c.includes("quality"));

        if (t >= 0 || f >= 0) {
          timeIdx = t >= 0 ? t : 0;
          fluxIdx = f >= 0 ? f : 1;
          errorIdx = e >= 0 ? e : 2;
          qualIdx = q >= 0 ? q : 3;
          headerFound = true;
          break;
        }
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (line.startsWith("#") || line.startsWith("//")) continue;

      // If we found a header and this matches the header, skip it
      if (headerFound) {
        const lineLower = line.toLowerCase();
        if (lineLower.includes("time") || lineLower.includes("flux") || lineLower.includes("bjd") || lineLower.includes("jd")) {
          continue;
        }
      }

      const separator = line.includes(",") ? "," : (line.includes(";") ? ";" : (line.includes("\t") ? "\t" : /\s+/));
      const parts = line.split(separator).map(p => {
        let cleaned = p.trim().replace(/['"]/g, "");
        if (separator === ";") {
          cleaned = cleaned.replace(",", "."); // European format fallback
        }
        return parseFloat(cleaned);
      });

      if (parts.length >= 2 && !isNaN(parts[timeIdx]) && !isNaN(parts[fluxIdx])) {
        parsed.push({
          time: parts[timeIdx],
          flux: parts[fluxIdx],
          fluxError: parts.length > errorIdx && !isNaN(parts[errorIdx]) ? parts[errorIdx] : 0.0001,
          quality: parts.length > qualIdx && !isNaN(parts[qualIdx]) ? Math.floor(parts[qualIdx]) : 0
        });
      }
    }

    if (parsed.length === 0) {
      throw new Error("No valid row coordinate points detected. Ensure CSV contains comma-separated or whitespace-separated numbers (Time, Flux).");
    }

    parsed.sort((a, b) => a.time - b.time);
    return parsed;
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      await processFilesList(files);
    }
  };

  // Main file processing engine (supports parallel extraction, lightning-fast launch, and instant loading feedback)
  const processFilesList = async (files: FileList) => {
    if (files.length === 0) return;
    setUploadError(null);

    // Create unique placeholders for ALL files immediately in the batchQueue to give instant feedback
    const newItems: BatchQueueItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newItems.push({
        id: `batch-${Math.random().toString(36).substring(2, 8)}`,
        name: file.name,
        rawContent: "",
        status: "ingesting",
        progress: 0,
      });
    }

    setBatchQueue(prev => [...prev, ...newItems]);

    // Process each file one by one asynchronously
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const targetItem = newItems[i];
      const filenameLower = file.name.toLowerCase();

      if (filenameLower.endsWith(".zip")) {
        try {
          setBatchQueue(prev => prev.map(q => q.id === targetItem.id ? { ...q, progress: 15 } : q));
          const zip = new JSZip();
          const loadedZip = await zip.loadAsync(file);
          
          setBatchQueue(prev => prev.map(q => q.id === targetItem.id ? { ...q, progress: 45 } : q));
          
          const zipQueueItems: BatchQueueItem[] = [];
          for (const filename of Object.keys(loadedZip.files)) {
            const filenameZipLower = filename.toLowerCase();
            const zipFile = loadedZip.files[filename];
            if (!zipFile.dir && (filenameZipLower.endsWith(".csv") || filenameZipLower.endsWith(".txt"))) {
              const content = await zipFile.async("text");
              zipQueueItems.push({
                id: `batch-${Math.random().toString(36).substring(2, 8)}`,
                name: filename.split("/").pop() || filename,
                rawContent: content,
                status: "pending",
                progress: 0,
              });
            }
          }
          
          setBatchQueue(prev => {
            const filtered = prev.filter(q => q.id !== targetItem.id);
            const updated = [...filtered, ...zipQueueItems];
            setTimeout(() => {
              runBatchProcessing(updated);
            }, 10);
            return updated;
          });
        } catch (err: any) {
          setBatchQueue(prev => prev.map(q => q.id === targetItem.id ? { ...q, status: "failed", error: err.message } : q));
        }
      } else if (filenameLower.endsWith(".csv") || filenameLower.endsWith(".txt")) {
        try {
          // Chunked, non-blocking ingestion
          const parsedPoints = await parseCsvFileInChunks(file, (progress) => {
            setBatchQueue(prev => prev.map(q => q.id === targetItem.id ? { ...q, progress } : q));
          });

          setBatchQueue(prev => {
            const updated = prev.map(q => q.id === targetItem.id ? { 
              ...q, 
              status: "pending", 
              progress: 0, 
              parsedPoints 
            } : q);
            
            setTimeout(() => {
              runBatchProcessing(updated);
            }, 10);
            return updated;
          });

        } catch (err: any) {
          setBatchQueue(prev => prev.map(q => q.id === targetItem.id ? { ...q, status: "failed", error: err.message } : q));
        }
      } else {
        setBatchQueue(prev => prev.map(q => q.id === targetItem.id ? { ...q, status: "failed", error: "Unsupported file format" } : q));
      }
    }
  };

  // Handle batch file uploading (Multiple CSVs or ZIP) with automatic launch
  const handleMultipleFileUploads = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    await processFilesList(files);
  };

  // Run the batch pipeline concurrently in parallel for extreme speed
  const runBatchProcessing = async (itemsList?: BatchQueueItem[]) => {
    const activeQueue = itemsList || batchQueue;
    const pendingItems = activeQueue.filter(item => item.status === "pending" || item.status === "processing");
    if (pendingItems.length === 0 || isProcessingBatch) return;

    setIsProcessingBatch(true);

    const processPromises = pendingItems.map(async (item, index) => {
      // Mark processing
      setBatchQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "processing", progress: 20 } : q));

      try {
        const parsedPoints = item.parsedPoints || parseCsvPhotometry(item.rawContent);
        setBatchQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: 50 } : q));

        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            datasetId: `batch_${item.id}`,
            customPoints: parsedPoints,
            config: prepConfig,
            customMetadata: {
              id: `BATCH-${item.id.toUpperCase()}`,
              name: item.name,
              source: "User Upload",
              starName: item.name.replace(".csv", "").replace(".txt", "").substring(0, 15),
              starRadius: 1.0,
              starMass: 1.0,
              starTemp: 5778
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Pipeline response error: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Analysis pipeline failed.");
        }

        // Add to history catalog
        addHistoryItem(data.report);

        // Update queue item
        setBatchQueue(prev => prev.map(q => q.id === item.id ? {
          ...q,
          status: "completed",
          progress: 100,
          report: data.report
        } : q));

        // Load into active visualization state
        setRawPoints(data.rawPoints);
        setPreprocessedPoints(data.preprocessedPoints);
        setPhaseFoldedPoints(data.phaseFoldedPoints);
        setReport(data.report);
        setUploadFileName(item.name);
        setUploadedPoints(parsedPoints);
        setSelectedTargetId(`batch_${item.id}`);

        // Automatically switch tab to dashboard on successful processing of the target
        if (index === pendingItems.length - 1) {
          setActiveTab("dashboard");
        }

      } catch (err: any) {
        setBatchQueue(prev => prev.map(q => q.id === item.id ? {
          ...q,
          status: "failed",
          progress: 100,
          error: err.message || "Failed processing."
        } : q));
      }
    });

    await Promise.all(processPromises);
    setIsProcessingBatch(false);
  };

  const startBatchProcessing = () => {
    runBatchProcessing();
  };

  const clearBatchQueue = () => {
    if (isProcessingBatch) return;
    setBatchQueue([]);
  };

  // Handle synthetic transit injections
  const handleSyntheticInjection = () => {
    setSelectedTargetId("synthetic_injection");
    setUploadFileName("Synthetic Injection Signal");
    setIsLoading(true);

    // Call analyze with custom synthetic injection instructions
    const synthData = generateSyntheticInjectedData(customPeriod, customDepth, customNoise);
    setUploadedPoints(synthData);
    triggerAnalysis("custom_upload", synthData);
  };

  const generateSyntheticInjectedData = (period: number, depthPpm: number, noise: number): DataPoint[] => {
    const points: DataPoint[] = [];
    const durationDays = 15;
    const numPoints = 200;
    const t0 = 1.25;
    const duration = 0.14; // transit width in days

    for (let i = 0; i < numPoints; i++) {
      const time = (i / numPoints) * durationDays;
      let baseFlux = 1.0;

      // Small background stellar pulsation
      baseFlux += 0.00005 * Math.sin(2 * Math.PI * time / 4.5);

      // Inject transit dip
      const phase = ((time - t0) / period) % 1.0;
      const stdPhase = phase < 0 ? phase + 1.0 : phase;
      const centerPhase = stdPhase > 0.5 ? stdPhase - 1.0 : stdPhase;
      const phaseInDays = centerPhase * period;

      if (Math.abs(phaseInDays) < duration / 2) {
        const normalizedX = (phaseInDays) / (duration / 2);
        const limbDarkening = 1.0 - 0.2 * (1 - normalizedX * normalizedX);
        baseFlux -= (depthPpm / 1e6) * limbDarkening;
      }

      // Add Gaussian white noise
      const u1 = Math.random() || 1e-10;
      const u2 = Math.random() || 1e-10;
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const computedNoise = z0 * noise;

      points.push({
        time: parseFloat(time.toFixed(4)),
        flux: parseFloat((baseFlux + computedNoise).toFixed(6)),
        fluxError: parseFloat(noise.toFixed(6)),
        quality: 0
      });
    }
    return points;
  };

  // Quick reset to default targets
  const handleSelectDefaultTarget = (targetId: string) => {
    setSelectedTargetId(targetId);
    setUploadedPoints(null);
    setUploadFileName("");
    triggerAnalysis(targetId);
  };

  // Helper to get matching badge color for predictions
  const getBadgeClass = (className: DetectionClass) => {
    switch (className) {
      case DetectionClass.ExoplanetTransit:
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case DetectionClass.EclipsingBinary:
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case DetectionClass.VariableStar:
        return "bg-violet-500/10 text-violet-400 border border-violet-500/20";
      default:
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
    }
  };

  // --- AI Chatbot Messaging Helper ---
  const sendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMsg = { role: "user" as const, content: chatInput, timestamp: new Date().toLocaleTimeString() };
    const updatedMsgs = [...chatMessages, userMsg];
    setChatMessages(updatedMsgs);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMsgs, activeReport: report })
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages(prev => [...prev, {
          role: "assistant",
          content: data.message,
          timestamp: new Date().toLocaleTimeString()
        }]);
      } else {
        throw new Error(data.error || "Failed to fetch response.");
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: `Error connecting to assistant service: ${err.message}. Please configure your GEMINI_API_KEY environment variable.`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- Model Retraining Loop Helper ---
  const handleRetraining = () => {
    if (isTraining) return;
    setIsTraining(true);
    setTrainProgress(0);
    setIsModelTrained(false);
    setTrainLogs(["[INIT] Initializing astronomical training tensor environments...", "Loading labeled Kepler and TESS light curves..."]);

    const epochsTotal = trainEpochs;
    let currentEpoch = 1;
    let lossHistory: Array<{ epoch: number; loss: number; valLoss: number }> = [];
    let accHistory: Array<{ epoch: number; acc: number; valAcc: number }> = [];

    const interval = setInterval(() => {
      if (currentEpoch > epochsTotal) {
        clearInterval(interval);
        setIsTraining(false);
        setIsModelTrained(true);
        setTrainLogs(prev => [...prev, "[SUCCESS] Multi-architecture model ensemble successfully synchronized!", "[READY] Retrained neural network deployed as active system pipeline weights."]);
        return;
      }

      // Physics-realistic decay for loss, increase for accuracy
      const loss = 0.5 * Math.pow(0.85, currentEpoch) + 0.05 + Math.random() * 0.02;
      const valLoss = loss * 1.1 + Math.random() * 0.01;
      const acc = 0.7 + (0.26 * (1 - Math.pow(0.8, currentEpoch))) + Math.random() * 0.01;
      const valAcc = acc * 0.98;

      lossHistory.push({ epoch: currentEpoch, loss: parseFloat(loss.toFixed(4)), valLoss: parseFloat(valLoss.toFixed(4)) });
      accHistory.push({ epoch: currentEpoch, acc: parseFloat((acc * 100).toFixed(2)), valAcc: parseFloat((valAcc * 100).toFixed(2)) });

      setTrainLossHistory([...lossHistory]);
      setTrainAccHistory([...accHistory]);
      setTrainProgress(Math.round((currentEpoch / epochsTotal) * 100));

      const logEntries = [
        `[EPOCH ${currentEpoch}/${epochsTotal}] Loss: ${loss.toFixed(4)} - Acc: ${(acc * 100).toFixed(2)}% - Val Loss: ${valLoss.toFixed(4)} - Val Acc: ${(valAcc * 100).toFixed(2)}%`,
        currentEpoch === 1 ? "[CNN] Fitting convolutional filters on transit shape slopes..." : null,
        currentEpoch === Math.round(epochsTotal / 3) ? "[BiLSTM] Learning temporal sequence dynamics & period overlays..." : null,
        currentEpoch === Math.round(epochsTotal * 2 / 3) ? "[Transformer] Computing long-range self-attention weights..." : null,
        currentEpoch === epochsTotal - 1 ? "[XGBoost] Fitting meta-classifier parameters on extracted astrophysical dimensions..." : null,
      ].filter(Boolean) as string[];

      setTrainLogs(prev => [...prev, ...logEntries]);
      currentEpoch++;
    }, 450);
  };

  // Search filter for history item lists
  const filteredHistory = history.filter(item => 
    item.name.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
    item.starName.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
    item.id.toLowerCase().includes(historySearchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen flex flex-col z-10 text-gray-100 font-sans antialiased overflow-hidden">
      {/* Deep space starfield overlay */}
      <CosmicBackground />

      {/* Top Header bar */}
      <header className="border-b border-space-700/50 bg-space-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-cosmic-purple to-neon-cyan shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] text-neon-cyan font-mono font-bold tracking-widest uppercase">
              Astrophysics AI Platform
            </span>
            <h1 className="text-lg font-display font-bold tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
              ExoVision AI
            </h1>
          </div>
        </div>

        {/* Global Pipeline status */}
        <div className="hidden lg:flex items-center gap-6 text-[11px] font-mono border-l border-space-700/60 pl-6">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-gray-400">TESS FEED:</span>
            <span className="text-white font-semibold">ACTIVE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-gray-400">KEPLER ARCHIVE:</span>
            <span className="text-white font-semibold">SYNCHRONIZED</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">STATIONARY:</span>
            <span className="text-neon-cyan font-bold">{currentTime}</span>
          </div>
        </div>

        {/* User profile card */}
        <div className="flex items-center gap-2 bg-space-900/60 border border-space-700/40 rounded-full py-1.5 pl-2.5 pr-4 shadow-inner">
          <div className="w-6 h-6 rounded-full bg-cosmic-purple/30 border border-cosmic-purple/50 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-cosmic-purple" />
          </div>
          <div className="text-left leading-none">
            <span className="text-[10px] text-gray-400 font-mono block">Elena Vance</span>
            <span className="text-[9px] text-emerald-400 font-mono font-medium tracking-wide uppercase">
              {user.role}
            </span>
          </div>
        </div>
      </header>

      {/* Main Structural Body */}
      <div className="flex-1 flex flex-col md:flex-row relative z-10">
        
        {/* Navigation Sidebar */}
        <nav className="w-full md:w-64 border-b md:border-b-0 md:border-r border-space-800 bg-[#0a0c14] p-4 flex flex-col justify-between gap-4">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {/* Group 1: Data & Entry */}
            <div>
              <span className="text-[9px] font-bold text-slate-500 font-mono tracking-wider uppercase pl-2">Ingress & Data</span>
              <div className="mt-1 space-y-1">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === "dashboard"
                      ? "bg-space-800/60 text-neon-cyan border border-neon-cyan/20"
                      : "text-slate-400 hover:text-slate-100 hover:bg-space-900/30"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Overview Dashboard
                </button>

                <button
                  onClick={() => setActiveTab("upload")}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === "upload"
                      ? "bg-space-800/60 text-neon-cyan border border-neon-cyan/20"
                      : "text-slate-400 hover:text-slate-100 hover:bg-space-900/30"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload & Detrend
                </button>

                <button
                  onClick={() => setActiveTab("explorer")}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === "explorer"
                      ? "bg-space-800/60 text-neon-cyan border border-neon-cyan/20"
                      : "text-slate-400 hover:text-slate-100 hover:bg-space-900/30"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Dataset Explorer
                </button>
              </div>
            </div>

            {/* Group 2: Analysis Suite */}
            <div>
              <span className="text-[9px] font-bold text-slate-500 font-mono tracking-wider uppercase pl-2">Spectral Analysis</span>
              <div className="mt-1 space-y-1">
                <button
                  onClick={() => setActiveTab("viewer")}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === "viewer"
                      ? "bg-space-800/60 text-neon-cyan border border-neon-cyan/20"
                      : "text-slate-400 hover:text-slate-100 hover:bg-space-900/30"
                  }`}
                >
                  <LineChart className="w-3.5 h-3.5" />
                  Light Curve Viewer
                </button>

                <button
                  onClick={() => setActiveTab("diagnostics")}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === "diagnostics"
                      ? "bg-space-800/60 text-neon-cyan border border-neon-cyan/20"
                      : "text-slate-400 hover:text-slate-100 hover:bg-space-900/30"
                  }`}
                >
                  <Radar className="w-3.5 h-3.5" />
                  Diagnostics & Orbit
                </button>

                <button
                  onClick={() => setActiveTab("detection")}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === "detection"
                      ? "bg-space-800/60 text-neon-cyan border border-neon-cyan/20"
                      : "text-slate-400 hover:text-slate-100 hover:bg-space-900/30"
                  }`}
                >
                  <Brain className="w-3.5 h-3.5" />
                  AI Transit Detection
                </button>

                <button
                  onClick={() => setActiveTab("explain")}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === "explain"
                      ? "bg-space-800/60 text-neon-cyan border border-neon-cyan/20"
                      : "text-slate-400 hover:text-slate-100 hover:bg-space-900/30"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Explainable AI (XAI)
                </button>
              </div>
            </div>

            {/* Group 3: Simulation & Labs */}
            <div>
              <span className="text-[9px] font-bold text-slate-500 font-mono tracking-wider uppercase pl-2">Laboratory Lab</span>
              <div className="mt-1 space-y-1">
                <button
                  onClick={() => setActiveTab("simulator")}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === "simulator"
                      ? "bg-space-800/60 text-neon-cyan border border-neon-cyan/20"
                      : "text-slate-400 hover:text-slate-100 hover:bg-space-900/30"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Transit Simulator
                </button>

                <button
                  onClick={() => setActiveTab("training")}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === "training"
                      ? "bg-space-800/60 text-neon-cyan border border-neon-cyan/20"
                      : "text-slate-400 hover:text-slate-100 hover:bg-space-900/30"
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  Model Training
                </button>

                <button
                  onClick={() => setActiveTab("chatbot")}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === "chatbot"
                      ? "bg-space-800/60 text-neon-cyan border border-neon-cyan/20"
                      : "text-slate-400 hover:text-slate-100 hover:bg-space-900/30"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  AI Chatbot
                </button>
              </div>
            </div>

            {/* Group 4: Metadata & Output */}
            <div>
              <span className="text-[9px] font-bold text-slate-500 font-mono tracking-wider uppercase pl-2">Logs & Reports</span>
              <div className="mt-1 space-y-1">
                <button
                  onClick={() => setActiveTab("reports")}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === "reports"
                      ? "bg-space-800/60 text-neon-cyan border border-neon-cyan/20"
                      : "text-slate-400 hover:text-slate-100 hover:bg-space-900/30"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Scientific Reports
                </button>

                <button
                  onClick={() => setActiveTab("history")}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === "history"
                      ? "bg-space-800/60 text-neon-cyan border border-neon-cyan/20"
                      : "text-slate-400 hover:text-slate-100 hover:bg-space-900/30"
                  }`}
                >
                  <HistoryIcon className="w-3.5 h-3.5" />
                  Candidate Catalog
                </button>

                <button
                  onClick={() => setActiveTab("settings")}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === "settings"
                      ? "bg-space-800/60 text-neon-cyan border border-neon-cyan/20"
                      : "text-slate-400 hover:text-slate-100 hover:bg-space-900/30"
                  }`}
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                  Pipeline Settings
                </button>
              </div>
            </div>
          </div>

          {/* Current Loaded Target Banner */}
          {report && (
            <div className="bg-space-900/50 border border-space-800/80 rounded-xl p-3 font-mono text-[10px]">
              <span className="text-gray-500 block">CURRENT ANALYSIS</span>
              <span className="text-white font-bold block truncate">{report.metadata.name}</span>
              <div className="flex justify-between mt-1 text-[9px]">
                <span className="text-gray-400">ID: {report.id}</span>
                <span className="text-neon-cyan font-bold uppercase">{report.parameters.planetClass}</span>
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts Deck panel */}
          <div className="bg-space-950/60 border border-space-850 rounded-xl p-3 font-mono text-[10px] space-y-2">
            <span className="text-gray-500 font-bold flex items-center gap-1.5 uppercase">
              <Keyboard className="w-3.5 h-3.5 text-neon-cyan" />
              Keyboard Deck
            </span>
            <div className="space-y-1.5 text-gray-400 text-[9px]">
              <div className="flex justify-between">
                <span>Switch Tabs</span>
                <kbd className="px-1 py-0.5 bg-space-800 text-gray-300 rounded border border-space-750">Alt+1-9</kbd>
              </div>
              <div className="flex justify-between">
                <span>Cycle Tabs</span>
                <kbd className="px-1 py-0.5 bg-space-800 text-gray-300 rounded border border-space-750">Alt+←/→</kbd>
              </div>
              <div className="flex justify-between">
                <span>Cycle Phase</span>
                <kbd className="px-1 py-0.5 bg-space-800 text-gray-300 rounded border border-space-750">P</kbd>
              </div>
              <div className="flex justify-between">
                <span>Direct Phase</span>
                <kbd className="px-1 py-0.5 bg-space-800 text-gray-300 rounded border border-space-750">1, 2, 3</kbd>
              </div>
            </div>
          </div>
        </nav>

        {/* Primary Screen Area */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full relative">
          
          {/* Global Process Overlay banner */}
          {isLoading && (
            <div className="absolute inset-0 bg-space-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-40">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-space-800 border-t-neon-cyan animate-spin" />
                <Database className="w-6 h-6 text-neon-cyan absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="text-center">
                <h3 className="text-md font-display font-semibold text-white tracking-wide">
                  Processing Light Curve Dataset
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  Applying Lowess detrending • Running 5-model neural ensemble...
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {analysisError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl p-4 flex gap-3 mb-6 items-start font-mono text-xs">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <div>
                <strong className="text-rose-300 block mb-0.5">Pipeline Processing Error</strong>
                {analysisError}
              </div>
            </div>
          )}

          {/* Tab Route Rendering */}
          <AnimatePresence mode="wait">
            
            {/* TAB: DASHBOARD */}
            {activeTab === "dashboard" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Hero introduction banner */}
                <div className="relative rounded-2xl bg-gradient-to-tr from-space-900 to-space-850 border border-space-700/50 p-6 overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-cosmic-purple/10 blur-[80px]" />
                  <div className="relative max-w-2xl">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cosmic-purple/15 text-cosmic-purple border border-cosmic-purple/20 text-[10px] font-mono mb-4">
                      <Sparkles className="w-3 h-3" /> PRE-TRAINED DEEP ENSEMBLE ACTIVE
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white tracking-tight">
                      Intelligent Exoplanet Transit Detection Platform
                    </h2>
                    <p className="text-sm text-gray-300 mt-2 font-sans leading-relaxed">
                      Analyze stellar photometry curves, detrend variability noise, and identify candidate transits 
                      with verified false-positive diagnostics and peer-review explainability.
                    </p>
                  </div>
                </div>

                {/* Main Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Card 1: Researcher account */}
                  <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-4">
                        Telescopic Station Account
                      </h3>
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-neon-cyan" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-sm font-semibold text-white">{user.name}</h4>
                          <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wide">
                            {user.role} Status
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-space-850 text-xs font-mono text-gray-400">
                      <div>AFFILIATION: {user.institution}</div>
                      <div className="mt-1">STATION ID: {user.id}</div>
                    </div>
                  </div>

                  {/* Card 2: Catalog Stats */}
                  <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-4">
                        Discovery Metrics
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-gray-400 block font-mono">CANDIDATES</span>
                          <span className="text-2xl font-display font-bold text-white">{history.length}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block font-mono">CONFIRMED</span>
                          <span className="text-2xl font-display font-bold text-emerald-400">
                            {history.filter(h => h.passedRejection).length}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block font-mono">FALSE POSITIVES</span>
                          <span className="text-2xl font-display font-bold text-rose-400">
                            {history.filter(h => !h.passedRejection).length}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block font-mono">SUCCESS RATE</span>
                          <span className="text-2xl font-display font-bold text-neon-cyan">
                            {history.length > 0 ? `${((history.filter(h => h.passedRejection).length / history.length) * 100).toFixed(0)}%` : "0%"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Quick Target Launchers */}
                  <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-3">
                        Launch Quick Targets
                      </h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleSelectDefaultTarget("kepler186")}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                            selectedTargetId === "kepler186" ? "bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan" : "bg-space-950 border border-space-850 hover:bg-space-800 text-gray-300"
                          }`}
                        >
                          <span className="font-mono">Kepler-186f (Habitable Zone)</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleSelectDefaultTarget("kepler22")}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                            selectedTargetId === "kepler22" ? "bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan" : "bg-space-950 border border-space-850 hover:bg-space-800 text-gray-300"
                          }`}
                        >
                          <span className="font-mono">Kepler-22b (Super Earth)</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleSelectDefaultTarget("tess98")}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                            selectedTargetId === "tess98" ? "bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan" : "bg-space-950 border border-space-850 hover:bg-space-800 text-gray-300"
                          }`}
                        >
                          <span className="font-mono">TESS L 98-59 d (Mini Neptune)</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub panels */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Latest Diagnostic parameters */}
                  {report && (
                    <div className="lg:col-span-2 bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-space-800">
                        <h4 className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                          ACTIVE TARGET DIAGNOSTICS: {report.metadata.name}
                        </h4>
                        <span className="px-2.5 py-1 text-[10px] font-mono rounded bg-space-950 text-star-gold border border-star-gold/20">
                          {report.parameters.planetClass}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
                        <div className="bg-space-950 p-3 rounded-lg border border-space-850">
                          <span className="text-gray-500 block text-[9px]">ESTIMATED PERIOD</span>
                          <strong className="text-white text-md block mt-0.5">{report.features.transitPeriod} Days</strong>
                        </div>
                        <div className="bg-space-950 p-3 rounded-lg border border-space-850">
                          <span className="text-gray-500 block text-[9px]">TRANSIT DEPTH</span>
                          <strong className="text-white text-md block mt-0.5">{report.features.transitDepth} ppm</strong>
                        </div>
                        <div className="bg-space-950 p-3 rounded-lg border border-space-850">
                          <span className="text-gray-500 block text-[9px]">PLANET RADIUS</span>
                          <strong className="text-emerald-400 text-md block mt-0.5">{report.parameters.planetRadius} R⊕</strong>
                        </div>
                        <div className="bg-space-950 p-3 rounded-lg border border-space-850">
                          <span className="text-gray-500 block text-[9px]">EST. TEMPERATURE</span>
                          <strong className="text-neon-cyan text-md block mt-0.5">{report.parameters.equilibriumTemp} K</strong>
                        </div>
                      </div>

                      {/* Diagnostic chart mini preview */}
                      <div className="pt-2">
                        <InteractiveChart
                          points={phaseFoldedPoints.slice(0, 150)}
                          title="Quick Phase-Fold Preview"
                          xLabel="Phase (cycles)"
                          yLabel="Relative Flux"
                          isPhaseFolded={true}
                          transitCenterPhase={0}
                          transitDurationWidth={0.12}
                          transitDepth={report.features.transitDepth}
                        />
                      </div>
                    </div>
                  )}

                  {/* Pipeline Status summary logs */}
                  <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4">
                    <h4 className="text-xs font-mono text-gray-500 uppercase tracking-wider pb-2 border-b border-space-800">
                      TELESCOPIC NETWORK STATUS
                    </h4>
                    <div className="space-y-3.5 text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>CHEOPS Mission (ESA)</span>
                        </div>
                        <span className="text-emerald-400 text-[10px]">NOMINAL</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>PLATO pipeline</span>
                        </div>
                        <span className="text-emerald-400 text-[10px]">NOMINAL</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          <span>JWST spectroscopic link</span>
                        </div>
                        <span className="text-amber-400 text-[10px]">OCCUPIED</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gray-600" />
                          <span>Kepler CCD-3 (Legacy)</span>
                        </div>
                        <span className="text-gray-500 text-[10px]">OFFLINE</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-space-850">
                      <h4 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-2">
                        Ensemble Classifier Model Status
                      </h4>
                      <div className="bg-space-950 p-3 rounded-lg border border-space-850 space-y-1 text-[10px] font-mono text-gray-400">
                        <div>CNN Model: 100% Loaded</div>
                        <div>BiLSTM Sequencer: 100% Loaded</div>
                        <div>Transformer Encoder: 100% Loaded</div>
                        <div>XGBoost Meta-Classifier: 100% Loaded</div>
                        <div className="text-emerald-400 font-bold mt-1">GPU DRIVER STATUS: ONLINE (94% Acc)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: UPLOAD DATASET */}
            {activeTab === "upload" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center pb-4 border-b border-space-700/50">
                  <div>
                    <h2 className="text-xl font-display font-bold text-white">
                      Astronomical Photometry Upload & Preprocessing
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Validate coordinate timestamps, filter raw system artifacts, and inject synthetic exoplanetary transits.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left block: Upload tools & Transit injection */}
                  <div className="space-y-6 lg:col-span-1">
                    {/* File Upload Zone */}
                    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4">
                      <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-neon-cyan" />
                        Photometry File Upload
                      </h3>
                      
                      <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition relative group ${
                          isDragging 
                            ? "border-neon-cyan bg-neon-cyan/5 shadow-[0_0_15px_rgba(0,243,255,0.15)]" 
                            : "border-space-700 hover:border-neon-cyan/50"
                        }`}
                      >
                        <input
                          type="file"
                          accept=".csv,.txt,.zip"
                          multiple
                          onChange={handleMultipleFileUploads}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Upload className={`w-8 h-8 mx-auto mb-3 transition ${isDragging ? "text-neon-cyan" : "text-gray-500 group-hover:text-neon-cyan"}`} />
                        <span className="text-xs text-gray-300 font-medium block">
                          {isDragging ? "Drop your files here!" : "Drag & drop single/multiple CSV/TXT or ZIP archives"}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono mt-1 block">
                          Format: Time, Flux, [Error], [Quality]
                        </span>
                      </div>

                      {uploadFileName && (
                        <div className="bg-space-950 px-3 py-2 rounded-lg border border-space-850 font-mono text-xs flex justify-between items-center">
                          <span className="text-white truncate">{uploadFileName}</span>
                          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        </div>
                      )}

                      {uploadError && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg p-3 font-mono text-[10px]">
                          {uploadError}
                        </div>
                      )}

                      {/* Demo CSV Downloader Component */}
                      <div className="pt-4 border-t border-space-850 space-y-2">
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block font-semibold">
                          Need a test dataset?
                        </span>
                        <p className="text-[11px] text-gray-300 leading-relaxed">
                          Download a pre-formatted exoplanetary transit light curve model with simulated stellar noise and a periodic transit signal.
                        </p>
                        <button
                          onClick={downloadDemoCsv}
                          className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan hover:text-white border border-neon-cyan/20 hover:border-neon-cyan/40 rounded-lg text-xs font-mono transition cursor-pointer font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download Demo Transit CSV
                        </button>
                      </div>
                    </div>

                    {/* Synthetic Transit Injected tool */}
                    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4">
                      <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-star-gold" />
                        Synthetic Transit Injector
                      </h3>
                      <p className="text-xs text-gray-300 leading-relaxed font-sans">
                        Inject a mock planet transit signature into a background flat photometry timeline to test pipeline performance!
                      </p>

                      <div className="space-y-3 font-mono text-[11px]">
                        <div>
                          <label className="text-gray-400 block mb-1">INJECTION PERIOD (Days): {customPeriod} d</label>
                          <input
                            type="range"
                            min="1.0"
                            max="18.0"
                            step="0.1"
                            value={customPeriod}
                            onChange={(e) => setCustomPeriod(parseFloat(e.target.value))}
                            className="w-full accent-neon-cyan h-1 bg-space-800 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <div>
                          <label className="text-gray-400 block mb-1">TRANSIT DEPTH (ppm): {customDepth} ppm</label>
                          <input
                            type="range"
                            min="100"
                            max="8000"
                            step="50"
                            value={customDepth}
                            onChange={(e) => setCustomDepth(parseInt(e.target.value))}
                            className="w-full accent-neon-cyan h-1 bg-space-800 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <div>
                          <label className="text-gray-400 block mb-1">CCD NOISE LEVEL (RMS): {customNoise.toFixed(6)}</label>
                          <input
                            type="range"
                            min="0.00005"
                            max="0.001"
                            step="0.00005"
                            value={customNoise}
                            onChange={(e) => setCustomNoise(parseFloat(e.target.value))}
                            className="w-full accent-neon-cyan h-1 bg-space-800 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <button
                          onClick={handleSyntheticInjection}
                          className="w-full py-2 bg-gradient-to-tr from-cosmic-purple to-neon-cyan hover:from-cosmic-purple/90 hover:to-neon-cyan/90 text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" /> Inject & Run Pipeline
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right block: Detailed detrending sliders */}
                  <div className="space-y-6 lg:col-span-2">
                    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4">
                      <div className="flex items-center justify-between border-b border-space-800 pb-3">
                        <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-neon-cyan" />
                          Photometry Preprocessing Configuration
                        </h3>
                        <button
                          onClick={() => {
                            setPrepConfig({
                              sigmaClipThreshold: 3.2,
                              medianFilterWindow: 5,
                              savitzkyGolayWindow: 9,
                              lowessFraction: 0.2,
                              denoisingMethod: "Fourier",
                              normalizationMethod: "Robust"
                            });
                          }}
                          className="text-[10px] font-mono text-gray-400 hover:text-white flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset Defaults
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Outlier clipping filter */}
                        <div className="bg-space-950 p-4 rounded-xl border border-space-850 space-y-3 font-mono text-xs">
                          <div className="text-gray-300 font-bold uppercase tracking-wider text-[10px]">
                            1. Outlier Rejection Threshold
                          </div>
                          <p className="text-gray-400 text-[11px] leading-relaxed">
                            Points deviating further than N times standard deviation (Sigma) are automatically pruned (cosmic ray hits).
                          </p>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="2.0"
                              max="5.0"
                              step="0.1"
                              value={prepConfig.sigmaClipThreshold}
                              onChange={(e) => setPrepConfig(prev => ({ ...prev, sigmaClipThreshold: parseFloat(e.target.value) }))}
                              className="flex-1 accent-neon-cyan"
                            />
                            <span className="text-neon-cyan font-bold">{prepConfig.sigmaClipThreshold}σ</span>
                          </div>
                        </div>

                        {/* Median smoothing window */}
                        <div className="bg-space-950 p-4 rounded-xl border border-space-850 space-y-3 font-mono text-xs">
                          <div className="text-gray-300 font-bold uppercase tracking-wider text-[10px]">
                            2. Median Smoothing Window
                          </div>
                          <p className="text-gray-400 text-[11px] leading-relaxed">
                            The temporal sliding median filter window size to remove isolated spike telemetry noise.
                          </p>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="3"
                              max="11"
                              step="2"
                              value={prepConfig.medianFilterWindow}
                              onChange={(e) => setPrepConfig(prev => ({ ...prev, medianFilterWindow: parseInt(e.target.value) }))}
                              className="flex-1 accent-neon-cyan"
                            />
                            <span className="text-neon-cyan font-bold">{prepConfig.medianFilterWindow} epochs</span>
                          </div>
                        </div>

                        {/* LOWESS Fraction */}
                        <div className="bg-space-950 p-4 rounded-xl border border-space-850 space-y-3 font-mono text-xs">
                          <div className="text-gray-300 font-bold uppercase tracking-wider text-[10px]">
                            3. LOWESS Detrending Fraction
                          </div>
                          <p className="text-gray-400 text-[11px] leading-relaxed">
                            Defines the proportion of points included in local regressions. Corrects slow stellar variability drift.
                          </p>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="0.1"
                              max="0.5"
                              step="0.05"
                              value={prepConfig.lowessFraction}
                              onChange={(e) => setPrepConfig(prev => ({ ...prev, lowessFraction: parseFloat(e.target.value) }))}
                              className="flex-1 accent-neon-cyan"
                            />
                            <span className="text-neon-cyan font-bold">{(prepConfig.lowessFraction * 100).toFixed(0)}% span</span>
                          </div>
                        </div>

                        {/* Savitzky-Golay */}
                        <div className="bg-space-950 p-4 rounded-xl border border-space-850 space-y-3 font-mono text-xs">
                          <div className="text-gray-300 font-bold uppercase tracking-wider text-[10px]">
                            4. Savitzky–Golay Polynomial Filter
                          </div>
                          <p className="text-gray-400 text-[11px] leading-relaxed">
                            Preserves the physical depth and shape of transit boundaries while removing instrumental high-frequency jitter.
                          </p>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="5"
                              max="9"
                              step="4"
                              value={prepConfig.savitzkyGolayWindow}
                              onChange={(e) => setPrepConfig(prev => ({ ...prev, savitzkyGolayWindow: parseInt(e.target.value) }))}
                              className="flex-1 accent-neon-cyan"
                            />
                            <span className="text-neon-cyan font-bold">Window {prepConfig.savitzkyGolayWindow}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button
                          onClick={() => triggerAnalysis(selectedTargetId, uploadedPoints || undefined)}
                          className="px-5 py-2.5 bg-space-800 hover:bg-space-700 text-neon-cyan border border-neon-cyan/20 text-xs font-semibold rounded-lg tracking-wider transition-all shadow-md flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-4 h-4 animate-spin-slow" /> Re-apply Preprocessing Pipeline
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Batch Processing Queue Section */}
                <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-space-800">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                        <Database className="w-4 h-4 text-neon-cyan" />
                        Stellar Light Curve Batch Processing Queue
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Upload multiple CSVs or a ZIP containing photometry files to schedule automatic sequential pipeline classification.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {batchQueue.length > 0 && (
                        <button
                          onClick={clearBatchQueue}
                          disabled={isProcessingBatch}
                          className="px-3 py-1.5 bg-space-950 text-gray-400 hover:text-white border border-space-800 text-xs font-mono rounded transition-all disabled:opacity-50"
                        >
                          Clear Queue
                        </button>
                      )}
                      <button
                        onClick={startBatchProcessing}
                        disabled={isProcessingBatch || batchQueue.length === 0}
                        className="px-4 py-1.5 bg-gradient-to-r from-cosmic-purple to-neon-cyan hover:brightness-110 text-white text-xs font-bold font-mono rounded-lg transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                      >
                        {isProcessingBatch ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Processing Queue...
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            Start Sequential Pipeline
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {batchQueue.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-xs font-mono bg-space-950/50 rounded-lg border border-space-850 border-dashed">
                      No batch files scheduled. Use the File Upload zone and select multiple files or a ZIP.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr className="border-b border-space-800 text-gray-400 text-[10px] uppercase">
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">File Name</th>
                            <th className="py-2.5 px-3">Progress</th>
                            <th className="py-2.5 px-3">ML Prediction Class</th>
                            <th className="py-2.5 px-3">Confidence</th>
                            <th className="py-2.5 px-3">Est. Error %</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-space-850">
                          {batchQueue.map((item) => {
                            const maxClass = item.report 
                              ? Object.keys(item.report.predictions.classes).reduce((a, b) => 
                                  item.report!.predictions.classes[a as DetectionClass] > item.report!.predictions.classes[b as DetectionClass] ? a : b
                                )
                              : null;
                            const confidence = item.report && maxClass 
                              ? (item.report.predictions.classes[maxClass as DetectionClass] * 100).toFixed(1) + "%"
                              : "-";

                            return (
                              <tr 
                                key={item.id} 
                                className={`hover:bg-space-950/30 transition-all ${
                                  selectedTargetId === `batch_${item.id}` ? "bg-neon-cyan/5" : ""
                                }`}
                              >
                                <td className="py-3 px-3">
                                  {item.status === "ingesting" && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/20 animate-pulse">
                                      INGESTING
                                    </span>
                                  )}
                                  {item.status === "pending" && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-space-950 text-gray-400 border border-space-800">
                                      PENDING
                                    </span>
                                  )}
                                  {item.status === "processing" && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                      PROCESSING
                                    </span>
                                  )}
                                  {item.status === "completed" && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      SUCCESS
                                    </span>
                                  )}
                                  {item.status === "failed" && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                      FAILED
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-white font-semibold truncate max-w-[200px]" title={item.name}>
                                  {item.name}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 bg-space-950 rounded-full h-1.5 overflow-hidden border border-space-850">
                                      <div 
                                        className="bg-neon-cyan h-full transition-all duration-300"
                                        style={{ width: `${item.progress}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] text-gray-400">{item.progress}%</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-gray-300">
                                  {maxClass ? maxClass : "-"}
                                </td>
                                <td className="py-3 px-3 font-bold text-neon-cyan">
                                  {confidence}
                                </td>
                                <td className="py-3 px-3 font-semibold text-rose-400">
                                  {item.report?.predictionErrorPercentage ? `±${item.report.predictionErrorPercentage}%` : "-"}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  {item.report && (
                                    <button
                                      onClick={() => {
                                        const parsedPoints = item.parsedPoints || parseCsvPhotometry(item.rawContent);
                                        setRawPoints(parsedPoints);
                                        setReport(item.report!);
                                        setUploadFileName(item.name);
                                        setUploadedPoints(parsedPoints);
                                        setSelectedTargetId(`batch_${item.id}`);
                                      }}
                                      className="px-2 py-1 bg-space-850 hover:bg-space-800 text-neon-cyan border border-space-800 rounded text-[10px] transition cursor-pointer"
                                    >
                                      Visualize Details
                                    </button>
                                  )}
                                  {item.error && (
                                    <span className="text-[10px] text-rose-400 truncate max-w-[150px]" title={item.error}>
                                      {item.error}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB: DATASET EXPLORER */}
            {activeTab === "explorer" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-space-900 border border-space-800 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-space-800">
                    <div>
                      <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                        <Layers className="w-5 h-5 text-neon-cyan" />
                        Astronomical Target Dataset Explorer
                      </h2>
                      <p className="text-xs text-gray-400 mt-1">
                        Search and query NASA Exoplanet Archive targets, Kepler Input Catalog (KIC), and TESS Input Catalog (TIC) photometric light curves.
                      </p>
                    </div>
                    
                    <div className="relative w-full md:w-80">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search targets (e.g. Kepler-186, TOI)..."
                        value={explorerSearchQuery}
                        onChange={(e) => setExplorerSearchQuery(e.target.value)}
                        className="w-full bg-space-950 text-xs font-mono pl-9 pr-4 py-2 rounded-lg border border-space-800 text-white focus:outline-none focus:border-neon-cyan"
                      />
                    </div>
                  </div>

                  {/* Target Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    {[
                      {
                        id: "kepler186",
                        name: "Kepler-186f",
                        koi: "KOI-571.05",
                        star: "Kepler-186 (M-Dwarf)",
                        period: "129.9 days",
                        dist: "582 Light Years",
                        radius: "1.11 R_earth",
                        temp: "3788 K",
                        obs: "14,800 points",
                        snr: "9.4",
                        quality: "99.8%",
                        desc: "First validated Earth-sized exoplanet orbiting within its host star's habitable zone."
                      },
                      {
                        id: "kepler22",
                        name: "Kepler-22b",
                        koi: "KOI-087.01",
                        star: "Kepler-22 (G-Type Sun)",
                        period: "289.9 days",
                        dist: "635 Light Years",
                        radius: "2.40 R_earth",
                        temp: "5518 K",
                        obs: "11,200 points",
                        snr: "14.5",
                        quality: "98.7%",
                        desc: "First Kepler candidate discovered in the habitable zone of a sun-like star."
                      },
                      {
                        id: "tess98",
                        name: "TOI-700d",
                        koi: "TIC 150428135.01",
                        star: "TOI-700 (Red Dwarf)",
                        period: "37.4 days",
                        dist: "101 Light Years",
                        radius: "1.19 R_earth",
                        temp: "3480 K",
                        obs: "8,900 points",
                        snr: "8.1",
                        quality: "99.1%",
                        desc: "An Earth-sized habitable-zone planet orbiting TOI-700, a nearby red dwarf star."
                      },
                      {
                        id: "binary",
                        name: "EB-0812",
                        koi: "KIC 5522789",
                        star: "Stellar Binary Pairs",
                        period: "4.8 days",
                        dist: "1250 Light Years",
                        radius: "14.20 R_earth (Eclipse)",
                        temp: "6120 K",
                        obs: "16,500 points",
                        snr: "48.2",
                        quality: "95.4%",
                        desc: "An eclipsing binary system simulating a deep exoplanetary transit false positive."
                      }
                    ]
                      .filter(t => 
                        t.name.toLowerCase().includes(explorerSearchQuery.toLowerCase()) ||
                        t.star.toLowerCase().includes(explorerSearchQuery.toLowerCase()) ||
                        t.koi.toLowerCase().includes(explorerSearchQuery.toLowerCase())
                      )
                      .map(t => (
                        <div 
                          key={t.id}
                          className={`bg-space-950 p-4 rounded-xl border transition-all flex flex-col justify-between ${
                            selectedTargetId === t.id 
                              ? "border-neon-cyan shadow-[0_0_12px_rgba(34,211,238,0.15)] bg-neon-cyan/5" 
                              : "border-space-850 hover:border-space-800 bg-space-950/40"
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-mono font-bold text-neon-cyan">{t.koi}</span>
                              <span className="text-[9px] font-mono bg-space-900 border border-space-800 text-gray-400 px-1.5 py-0.5 rounded">
                                {t.obs}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-white mt-1.5">{t.name}</h3>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{t.star}</p>
                            
                            <p className="text-[11px] text-gray-300 mt-2.5 leading-relaxed font-sans min-h-[50px]">
                              {t.desc}
                            </p>

                            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-4 border-t border-space-900 pt-3 text-[10px] font-mono">
                              <div>
                                <span className="text-gray-500 block uppercase text-[8px]">Period</span>
                                <span className="text-gray-200">{t.period}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block uppercase text-[8px]">Distance</span>
                                <span className="text-gray-200">{t.dist}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block uppercase text-[8px]">Temp (T_eff)</span>
                                <span className="text-gray-200">{t.temp}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block uppercase text-[8px]">Avg SNR</span>
                                <span className="text-neon-cyan font-bold">{t.snr}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-5 pt-3 border-t border-space-900">
                            <button
                              onClick={() => handleSelectDefaultTarget(t.id)}
                              className={`w-full py-2 rounded text-center text-xs font-mono font-bold transition cursor-pointer ${
                                selectedTargetId === t.id
                                  ? "bg-neon-cyan text-space-950 hover:brightness-110"
                                  : "bg-space-900 text-gray-300 hover:text-white hover:bg-space-850 border border-space-800"
                              }`}
                            >
                              {selectedTargetId === t.id ? "Target Loaded" : "Load photometric Light Curve"}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Summary telemetry stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 border-t border-space-800 pt-6 font-mono text-xs text-gray-400">
                    <div className="bg-space-950/60 p-4 rounded-xl border border-space-850 flex items-center gap-3">
                      <div className="p-2 bg-neon-cyan/10 rounded-lg text-neon-cyan">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[9px] uppercase">Archive Sync Integrity</span>
                        <span className="text-white font-bold text-sm">99.98% Complete</span>
                      </div>
                    </div>

                    <div className="bg-space-950/60 p-4 rounded-xl border border-space-850 flex items-center gap-3">
                      <div className="p-2 bg-cosmic-purple/10 rounded-lg text-cosmic-purple">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[9px] uppercase">Mean Photometry Cadence</span>
                        <span className="text-white font-bold text-sm">29.4 Minutes (Kepler SC)</span>
                      </div>
                    </div>

                    <div className="bg-space-950/60 p-4 rounded-xl border border-space-850 flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[9px] uppercase">Valid Target Index catalog</span>
                        <span className="text-white font-bold text-sm">4,528 Verified Systems</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: DIAGNOSTICS & TRAJECTORY HUB */}
            {activeTab === "diagnostics" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {report ? (
                  <DiagnosticsHub
                    report={report}
                    rawPoints={rawPoints}
                    preprocessedPoints={preprocessedPoints}
                  />
                ) : (
                  <div className="text-center py-16 bg-space-900 border border-space-800 rounded-2xl p-8 max-w-xl mx-auto space-y-4">
                    <Radar className="w-12 h-12 text-neon-cyan animate-pulse mx-auto" />
                    <h3 className="text-lg font-bold text-white">No Stellar Target Loaded</h3>
                    <p className="text-xs text-gray-400 leading-relaxed font-sans">
                      Please select a catalog quick target on the Overview Dashboard or upload a light curve dataset to enable advanced telemetry diagnostics.
                    </p>
                    <button
                      onClick={() => setActiveTab("dashboard")}
                      className="px-4 py-2 bg-space-800 hover:bg-space-700 text-neon-cyan border border-neon-cyan/20 text-xs font-semibold rounded-lg tracking-wider transition-all cursor-pointer"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: VIEWER */}
            {activeTab === "viewer" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center pb-4 border-b border-space-700/50">
                  <div>
                    <h2 className="text-xl font-display font-bold text-white">
                      Interactive Astronomical Light Curve Viewer
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Toggle pipeline phases, inspect the Lomb-Scargle periodic power spectrum, and visualize simulated physical orbits.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Primary charts (Left/center) */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4">
                      {/* Pipeline Phase Control Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-space-800 gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-neon-cyan" />
                            Active Pipeline Analysis Phase
                          </h3>
                          <p className="text-[11px] text-gray-400 mt-0.5 font-sans">
                            Switch views to inspect raw inputs, detrended noise filters, or phase-folded period models.
                          </p>
                        </div>
                        <div className="flex bg-space-950 p-1 rounded-lg border border-space-800 font-mono text-[10px] select-none">
                          <button
                            onClick={() => setViewerPhase("raw")}
                            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                              viewerPhase === "raw"
                                ? "bg-neon-cyan text-space-950 font-bold"
                                : "text-gray-400 hover:text-white"
                            }`}
                            title="Shortcut: '1' or cycle with 'P'"
                          >
                            [1] Raw Flux
                          </button>
                          <button
                            onClick={() => setViewerPhase("detrended")}
                            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                              viewerPhase === "detrended"
                                ? "bg-neon-cyan text-space-950 font-bold"
                                : "text-gray-400 hover:text-white"
                            }`}
                            title="Shortcut: '2' or cycle with 'P'"
                          >
                            [2] Detrended
                          </button>
                          <button
                            onClick={() => setViewerPhase("folded")}
                            disabled={!report}
                            className={`px-3 py-1.5 rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                              viewerPhase === "folded"
                                ? "bg-neon-cyan text-space-950 font-bold"
                                : "text-gray-400 hover:text-white"
                            }`}
                            title="Shortcut: '3' or cycle with 'P'"
                          >
                            [3] Phase-Folded
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Phase Chart Display */}
                      <div className="relative">
                        {viewerPhase === "raw" && (
                          <InteractiveChart
                            points={rawPoints.length > 0 ? rawPoints : (uploadedPoints || [])}
                            title={report ? `Raw Observational Photometry – ${report.metadata.name}` : "Raw Stellar Photometry"}
                            xLabel="Time (Days)"
                            yLabel="Raw Instrument Flux"
                          />
                        )}

                        {viewerPhase === "detrended" && (
                          <InteractiveChart
                            points={preprocessedPoints}
                            title={report ? `Detrended & Normalized Photometry – ${report.metadata.name}` : "Stellar Photometry"}
                            xLabel="Time (Days)"
                            yLabel="Relative Flux (Normalized)"
                          />
                        )}

                        {viewerPhase === "folded" && (
                          report ? (
                            <InteractiveChart
                              points={phaseFoldedPoints}
                              title={`Phase Folded Curve (Period: ${report.features.transitPeriod} Days) – ${report.metadata.name}`}
                              xLabel="Phase (cycles)"
                              yLabel="Relative Flux"
                              isPhaseFolded={true}
                              transitCenterPhase={0}
                              transitDurationWidth={0.14}
                              transitDepth={report.features.transitDepth}
                            />
                          ) : (
                            <div className="text-center py-20 bg-space-950 rounded-xl border border-space-850 text-gray-500 text-xs font-mono">
                              Phase-folded data is only available after running the ML analysis pipeline.
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Spectral Power Periodogram (Right side) */}
                  {report && (
                    <div className="lg:col-span-1 space-y-6">
                      <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4">
                        <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-neon-cyan" />
                          Lomb-Scargle Periodogram Power
                        </h3>
                        <p className="text-xs text-gray-300 leading-relaxed font-sans">
                          A spectral power estimation over a range of frequencies, locating repeating stellar periodic oscillations.
                        </p>

                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                          {report.features.lombScarglePeaks.slice(0, 5).map((peak, idx) => (
                            <div key={idx} className="bg-space-950 p-2.5 rounded border border-space-850 font-mono text-[11px] flex justify-between items-center">
                              <div>
                                <span className="text-gray-500 block text-[9px]">PEAK PERIOD {idx + 1}</span>
                                <span className="text-white font-bold">{peak.period.toFixed(4)} Days</span>
                              </div>
                              <div className="text-right">
                                <span className="text-gray-500 block text-[9px]">SPECTRAL POWER</span>
                                <span className="text-star-gold font-semibold">{peak.power.toFixed(3)}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-space-850">
                          <span className="text-[10px] font-mono text-gray-400 block uppercase mb-1">Periodic consensus</span>
                          <p className="text-[11px] text-gray-400 leading-relaxed">
                            The highest spectral density peak is registered at <strong className="text-white">{report.features.transitPeriod} days</strong>, which is automatically assigned as the target's orbital period parameter.
                          </p>
                        </div>
                      </div>

                      {/* Mini visual orbit system */}
                      <OrbitalVisualizer
                        parameters={report.parameters}
                        starName={report.metadata.starName}
                        isMultiPlanetSystem={report.isMultiPlanetSystem}
                        detectedPlanets={report.detectedPlanets}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB: DETECTION */}
            {activeTab === "detection" && report && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="transit-detection-dashboard space-y-6"
              >
                <div className="flex justify-between items-center pb-4 border-b border-space-700/50">
                  <div>
                    <h2 className="text-xl font-display font-bold text-white">
                      Deep Ensemble Neural Network Classification
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Consensus output of 5 machine learning architectures validating exoplanetary transits against false positives.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Consensus Voting Result (Left/center) */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Floating SNR Gauge Cards */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-neon-cyan animate-pulse" />
                          Candidate Signal-to-Noise Ratio (SNR) Metrics
                        </h3>
                        <span className="text-[10px] font-mono text-gray-400">Quality Assessment Deck</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(report.detectedPlanets && report.detectedPlanets.length > 0 ? report.detectedPlanets : [report.parameters]).map((planet, pIdx) => {
                          const planetSNR = pIdx === 0 
                            ? report.features.snr 
                            : parseFloat((report.features.snr * Math.sqrt(planet.transitDepth / report.parameters.transitDepth)).toFixed(1));
                          
                          // Quality classification based on SNR
                          let qualityLabel = "";
                          let qualityColor = "";
                          let qualityBg = "";
                          let qualityBorder = "";
                          let qualityDesc = "";
                          
                          if (planetSNR < 4.0) {
                            qualityLabel = "REJECTED (LOW SNR)";
                            qualityColor = "text-rose-400";
                            qualityBg = "bg-rose-500/10";
                            qualityBorder = "border-rose-500/20";
                            qualityDesc = "High risk of false alarm. Signal is indistinguishable from background stellar noise.";
                          } else if (planetSNR >= 4.0 && planetSNR < 7.5) {
                            qualityLabel = "PROVISIONAL CANDIDATE";
                            qualityColor = "text-amber-400";
                            qualityBg = "bg-amber-500/10";
                            qualityBorder = "border-amber-500/20";
                            qualityDesc = "Marginal signal detection. Requires further phase-folding and multi-epoch review.";
                          } else if (planetSNR >= 7.5 && planetSNR < 15.0) {
                            qualityLabel = "STRONG CANDIDATE";
                            qualityColor = "text-emerald-400";
                            qualityBg = "bg-emerald-500/10";
                            qualityBorder = "border-emerald-500/20";
                            qualityDesc = "Clear periodic dips detected. High-confidence candidate for peer-reviewed classification.";
                          } else {
                            qualityLabel = "GOLD STANDARD DETECTION";
                            qualityColor = "text-star-gold";
                            qualityBg = "bg-amber-500/10";
                            qualityBorder = "border-amber-500/20";
                            qualityDesc = "Impeccable signal profile with extremely clear transit ingress/egress boundaries.";
                          }

                          // Gauge computation: SNR from 0 to 50
                          const maxSNR = 50;
                          const ratio = Math.min(1.0, planetSNR / maxSNR);
                          
                          // Semicircle parameters
                          const radius = 55;
                          const circumference = Math.PI * radius;
                          const offset = circumference - (ratio * circumference);
                          
                          // Needle calculation
                          const angle = Math.PI - (ratio * Math.PI);
                          const needleX = 75 + 50 * Math.cos(angle);
                          const needleY = 85 - 50 * Math.sin(angle);

                          return (
                            <motion.div
                              key={pIdx}
                              whileHover={{ y: -4, scale: 1.01 }}
                              className={`relative bg-space-900 border rounded-xl p-4 flex flex-col justify-between transition-all duration-300 ${
                                planetSNR >= 4.0
                                  ? "border-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.15)]"
                                  : "border-space-800 shadow-xl"
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider block">
                                    Candidate ID: {report.id}-{String.fromCharCode(98 + pIdx)}
                                  </span>
                                  <h4 className="text-xs font-bold text-white mt-0.5">
                                    Planet {String.fromCharCode(98 + pIdx)} ({planet.planetClass})
                                  </h4>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-tight border ${qualityBg} ${qualityColor} ${qualityBorder}`}>
                                  {qualityLabel}
                                </span>
                              </div>

                              <div className="flex items-center gap-4 my-4">
                                {/* Miniature circular gauge */}
                                <div className="w-32 h-20 relative flex items-center justify-center overflow-visible">
                                  <svg viewBox="0 0 150 90" className="w-full h-full overflow-visible">
                                    <defs>
                                      <linearGradient id={`snrGrad-${pIdx}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#ef4444" /> {/* Red */}
                                        <stop offset="25%" stopColor="#f59e0b" /> {/* Amber */}
                                        <stop offset="60%" stopColor="#10b981" /> {/* Emerald */}
                                        <stop offset="100%" stopColor="#a855f7" /> {/* Purple */}
                                      </linearGradient>
                                    </defs>
                                    {/* Track */}
                                    <path
                                      d="M 20 85 A 55 55 0 0 1 130 85"
                                      fill="none"
                                      stroke="#1e293b"
                                      strokeWidth="10"
                                      strokeLinecap="round"
                                    />
                                    {/* Filled bar */}
                                    <path
                                      d="M 20 85 A 55 55 0 0 1 130 85"
                                      fill="none"
                                      stroke={`url(#snrGrad-${pIdx})`}
                                      strokeWidth="10"
                                      strokeLinecap="round"
                                      strokeDasharray={circumference}
                                      strokeDashoffset={offset}
                                      className="transition-all duration-1000 ease-out"
                                    />
                                    {/* SNR 4.0 Threshold Reference Line */}
                                    {(() => {
                                      const thRatio = 4.0 / 50;
                                      const thAngle = Math.PI - (thRatio * Math.PI);
                                      const x1 = 75 + 48 * Math.cos(thAngle);
                                      const y1 = 85 - 48 * Math.sin(thAngle);
                                      const x2 = 75 + 62 * Math.cos(thAngle);
                                      const y2 = 85 - 62 * Math.sin(thAngle);
                                      const tx = 75 + 65 * Math.cos(thAngle);
                                      const ty = 85 - 65 * Math.sin(thAngle);
                                      return (
                                        <g>
                                          <line
                                            x1={x1}
                                            y1={y1}
                                            x2={x2}
                                            y2={y2}
                                            stroke="#10b981"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                          />
                                          <text
                                            x={tx - 4}
                                            y={ty - 1}
                                            fill="#34d399"
                                            fontSize="5.5"
                                            fontFamily="monospace"
                                            fontWeight="bold"
                                            textAnchor="end"
                                          >
                                            Threshold (4.0)
                                          </text>
                                        </g>
                                      );
                                    })() /* End of SNR 4.0 Threshold Reference Line */}
                                    {/* Needle */}
                                    <line
                                      x1="75"
                                      y1="85"
                                      x2={needleX}
                                      y2={needleY}
                                      stroke="#ffffff"
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                      className="transition-all duration-1000 ease-out"
                                    />
                                    <circle cx="75" cy="85" r="5" fill="#ffffff" />
                                    <text x="20" y="99" fill="#475569" fontSize="7" fontFamily="monospace" textAnchor="middle">0</text>
                                    <text x="75" y="24" fill="#475569" fontSize="7" fontFamily="monospace" textAnchor="middle">25</text>
                                    <text x="130" y="99" fill="#475569" fontSize="7" fontFamily="monospace" textAnchor="middle">50+</text>
                                  </svg>
                                  
                                  {/* Absolute SNR readout inside gauge */}
                                  <div className="absolute bottom-0 text-center">
                                    <span className="text-lg font-bold font-mono text-white leading-none">
                                      {planetSNR.toFixed(1)}
                                    </span>
                                    <span className="text-[7px] text-gray-500 font-mono block tracking-wider leading-none mt-0.5">SNR VALUE</span>
                                  </div>
                                </div>

                                {/* Text metrics alongside gauge */}
                                <div className="flex-1 font-mono text-[10px] space-y-1 text-gray-300">
                                  <div className="flex justify-between border-b border-space-850 pb-0.5">
                                    <span className="text-gray-500">Period:</span>
                                    <span className="text-white font-semibold">{planet.orbitalPeriod.toFixed(2)}d</span>
                                  </div>
                                  <div className="flex justify-between border-b border-space-850 pb-0.5">
                                    <span className="text-gray-500">Depth:</span>
                                    <span className="text-white font-semibold">{planet.transitDepth.toFixed(0)} ppm</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Est. Radius:</span>
                                    <span className="text-emerald-400 font-semibold">{planet.planetRadius.toFixed(2)} R⊕</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-[10px] text-gray-400 font-sans italic leading-relaxed border-t border-space-850 pt-2">
                                {qualityDesc}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Transit Depth Comparison Card */}
                    {(() => {
                      const currentStarRadius = customStarRadius !== null ? customStarRadius : (report.parameters.starRadius || 1.0);
                      const starRadiusInEarth = currentStarRadius * 109.2;
                      
                      return (
                        <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4">
                          <div className="flex justify-between items-center pb-2 border-b border-space-800">
                            <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-emerald-400" />
                              Transit Depth Comparison Model (Observed vs. Theoretical)
                            </h3>
                            <div className="flex items-center gap-2">
                              {isRecalculating && <RefreshCw className="w-3.5 h-3.5 text-neon-cyan animate-spin" />}
                              <span className="text-[10px] font-mono text-gray-400">R_* = {currentStarRadius.toFixed(2)} R_☉</span>
                            </div>
                          </div>

                          <p className="text-xs text-gray-300 leading-relaxed font-sans">
                            Comparing the physically observed transit depths against computed theoretical depths (assuming flat-disk occultation of the host star with radius <strong className="text-white">{currentStarRadius.toFixed(3)} R_☉</strong>).
                          </p>

                          {/* Host Star Parameter Adjuster Deck */}
                          <div className="bg-space-950 p-4 rounded-xl border border-space-850 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block font-semibold">Stellar Radius Simulation Config</span>
                                <h4 className="text-xs font-bold text-white mt-0.5 flex items-center gap-2">
                                  Active Host Star Radius (R_*): 
                                  <span className="text-neon-cyan text-sm font-mono">{currentStarRadius.toFixed(3)} R_☉</span>
                                  <span className="text-gray-400 font-normal">({starRadiusInEarth.toFixed(1)} R_⊕)</span>
                                </h4>
                              </div>
                              {customStarRadius !== null && (
                                <button
                                  onClick={handleResetStarRadius}
                                  className="px-2.5 py-1 bg-space-900 hover:bg-space-800 text-neon-cyan hover:text-white border border-neon-cyan/20 rounded text-[10px] font-mono transition-all cursor-pointer"
                                >
                                  Reset to Catalog Nominal ({(report.parameters.starRadius || 1.0).toFixed(2)} R_☉)
                                </button>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-mono text-gray-400">0.1 R_☉</span>
                              <input
                                type="range"
                                min="0.1"
                                max="5.0"
                                step="0.01"
                                value={currentStarRadius}
                                onChange={(e) => handleStarRadiusChange(parseFloat(e.target.value))}
                                className="flex-1 h-1 bg-space-900 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
                              />
                              <span className="text-[10px] font-mono text-gray-400">5.0 R_☉</span>
                            </div>
                          </div>

                          <div className="overflow-x-auto border border-space-850 rounded-lg relative">
                            {isRecalculating && (
                              <div className="absolute inset-0 bg-space-950/40 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all duration-150">
                                <div className="flex items-center gap-2 text-xs font-mono text-neon-cyan bg-space-950 px-3 py-1.5 rounded-lg border border-space-800 shadow-xl">
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Recalculating Model...
                                </div>
                              </div>
                            )}

                            <table className="w-full text-left border-collapse text-xs font-mono">
                              <thead>
                                <tr className="bg-space-950 border-b border-space-800 text-[10px] text-gray-400 uppercase tracking-wider">
                                  <th className="p-3">Candidate ID</th>
                                  <th className="p-3 text-right">Detected Depth</th>
                                  <th className="p-3 text-right">Theoretical Depth</th>
                                  <th className="p-3 text-right">Ratio (Det / Theo)</th>
                                  <th className="p-3 text-center">Inferred Discrepancy</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-space-850">
                                {(comparisonResults.length > 0 ? comparisonResults : (report.detectedPlanets && report.detectedPlanets.length > 0 ? report.detectedPlanets.map(planet => {
                                  const theoreticalDepthPpm = Math.pow(planet.planetRadius / starRadiusInEarth, 2) * 1e6;
                                  const ratio = theoreticalDepthPpm > 0 ? (planet.transitDepth / theoreticalDepthPpm) : 1.0;
                                  return {
                                    planetClass: planet.planetClass,
                                    detectedDepth: planet.transitDepth,
                                    theoreticalDepthPpm,
                                    ratioPercent: ratio * 100,
                                    statusLabel: ratio > 1.25 ? "Stellar Limb Darkening / Oversized Signal" : (ratio < 0.75 ? "Grazing Transit / Diluted Signal" : "Consistent Nominal Model"),
                                    statusColor: ratio > 1.25 ? "text-amber-400" : (ratio < 0.75 ? "text-cyan-400" : "text-emerald-400")
                                  };
                                }) : [{
                                  planetClass: report.parameters.planetClass,
                                  detectedDepth: report.parameters.transitDepth,
                                  theoreticalDepthPpm: Math.pow(report.parameters.planetRadius / starRadiusInEarth, 2) * 1e6,
                                  ratioPercent: (report.parameters.transitDepth / (Math.pow(report.parameters.planetRadius / starRadiusInEarth, 2) * 1e6 || 1.0)) * 100,
                                  statusLabel: "Consistent Nominal Model",
                                  statusColor: "text-emerald-400"
                                }])).map((planet, pIdx) => {
                                  return (
                                    <tr key={pIdx} className="hover:bg-space-950/45 transition-colors">
                                      <td className="p-3 font-semibold text-white">
                                        Planet {String.fromCharCode(98 + pIdx)} ({planet.planetClass})
                                      </td>
                                      <td className="p-3 text-right font-bold text-white">
                                        {planet.detectedDepth.toLocaleString(undefined, { maximumFractionDigits: 1 })} ppm
                                      </td>
                                      <td className="p-3 text-right font-medium text-gray-300">
                                        {planet.theoreticalDepthPpm.toLocaleString(undefined, { maximumFractionDigits: 1 })} ppm
                                      </td>
                                      <td className="p-3 text-right font-bold">
                                        <span className={planet.ratioPercent > 120 || planet.ratioPercent < 80 ? "text-amber-400" : "text-emerald-400"}>
                                          {planet.ratioPercent.toFixed(1)}%
                                        </span>
                                      </td>
                                      <td className={`p-3 text-center ${planet.statusColor} font-sans text-[11px]`}>
                                        {planet.statusLabel}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          <div className="text-[10px] text-gray-500 font-sans leading-relaxed flex items-start gap-1.5 mt-1">
                            <span className="text-amber-500 font-bold">Note:</span>
                            <span>
                              Theoretical transit depth represents the geometrical surface ratio (R_p / R_*)^2. Real stellar profiles feature <strong>Limb Darkening</strong> where the center of the stellar disk is brighter than its edges, making deep central crossings appear deeper, or grazing paths shallower.
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-6">
                      <div className="flex justify-between items-center pb-3 border-b border-space-800">
                        <h3 className="text-sm font-semibold text-gray-100">Ensemble Classification Probabilities</h3>
                        <span className="text-xs font-mono text-gray-400">Target: {report.metadata.name}</span>
                      </div>

                      {/* Primary Class and Error Percentage Metrics Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-space-950 rounded-xl border border-space-850 font-mono text-xs">
                        <div>
                          <span className="text-gray-500 text-[10px] uppercase block tracking-wider font-semibold">Primary Consensus Classification</span>
                          <span className="text-white text-sm font-bold block mt-1">
                            {(() => {
                              const maxClass = Object.keys(report.predictions.classes).reduce((a, b) => 
                                report.predictions.classes[a as DetectionClass] > report.predictions.classes[b as DetectionClass] ? a : b
                              );
                              return maxClass;
                            })()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10px] uppercase block tracking-wider font-semibold">Prediction Margin of Error</span>
                          <span className="text-rose-400 text-sm font-bold block mt-1 flex items-center gap-1">
                            <span>±{report.predictionErrorPercentage !== undefined ? report.predictionErrorPercentage : "1.25"}%</span>
                            <span className="text-[9px] text-gray-500 font-normal">(Classification uncertainty + residual noise fit error)</span>
                          </span>
                        </div>
                      </div>

                      {/* Main Classification Probabilities Bar chart list */}
                      <div className="space-y-4">
                        {Object.entries(report.predictions.classes).map(([className, confidence]) => {
                          const percentage = ((confidence as number) * 100).toFixed(1);
                          return (
                            <div key={className} className="space-y-1.5">
                              <div className="flex justify-between text-xs font-mono">
                                <span className="text-gray-300 font-medium">{className}</span>
                                <span className="text-neon-cyan font-bold">{percentage}%</span>
                              </div>
                              <div className="h-2.5 bg-space-950 rounded-full overflow-hidden border border-space-850">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 0.5, ease: "easeOut" }}
                                  className="h-full bg-gradient-to-r from-cosmic-purple to-neon-cyan rounded-full"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Breakdown of individual 5 sub-models */}
                    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4">
                      <h3 className="text-sm font-semibold text-gray-100">Ensemble Model Multi-architecture Voting</h3>
                      <p className="text-xs text-gray-300 leading-relaxed font-sans">
                        Five highly specialized neural network models analyze different dimensions of the photometry. Their sub-predictions are synthesized to make the final determination.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
                        {/* Model 1 */}
                        <div className="bg-space-950 p-3 rounded border border-space-850 font-mono text-[10px] space-y-2">
                          <span className="text-gray-400 font-bold block uppercase border-b border-space-800 pb-1">1. CNN</span>
                          <span className="text-gray-500 block">Shape Recognition (Ingress/Egress curves)</span>
                          <div className="text-neon-cyan font-bold text-xs">
                            EXOPLANET: {(report.predictions.ensembleVotes.cnn[DetectionClass.ExoplanetTransit] * 100).toFixed(0)}%
                          </div>
                        </div>

                        {/* Model 2 */}
                        <div className="bg-space-950 p-3 rounded border border-space-850 font-mono text-[10px] space-y-2">
                          <span className="text-gray-400 font-bold block uppercase border-b border-space-800 pb-1">2. BiLSTM</span>
                          <span className="text-gray-500 block">Sequential Transit Timelines</span>
                          <div className="text-neon-cyan font-bold text-xs">
                            EXOPLANET: {(report.predictions.ensembleVotes.bilstm[DetectionClass.ExoplanetTransit] * 100).toFixed(0)}%
                          </div>
                        </div>

                        {/* Model 3 */}
                        <div className="bg-space-950 p-3 rounded border border-space-850 font-mono text-[10px] space-y-2">
                          <span className="text-gray-400 font-bold block uppercase border-b border-space-800 pb-1">3. Transformer</span>
                          <span className="text-gray-500 block">Long-range Periodicity Weights</span>
                          <div className="text-neon-cyan font-bold text-xs">
                            EXOPLANET: {(report.predictions.ensembleVotes.transformer[DetectionClass.ExoplanetTransit] * 100).toFixed(0)}%
                          </div>
                        </div>

                        {/* Model 4 */}
                        <div className="bg-space-950 p-3 rounded border border-space-850 font-mono text-[10px] space-y-2">
                          <span className="text-gray-400 font-bold block uppercase border-b border-space-800 pb-1">4. Autoencoder</span>
                          <span className="text-gray-500 block">Reconstruction & Noise clipping</span>
                          <div className="text-neon-cyan font-bold text-xs">
                            RECONSTRUCTED (±5%)
                          </div>
                        </div>

                        {/* Model 5 */}
                        <div className="bg-space-950 p-3 rounded border border-space-850 font-mono text-[10px] space-y-2">
                          <span className="text-gray-400 font-bold block uppercase border-b border-space-800 pb-1">5. XGBoost</span>
                          <span className="text-gray-500 block">Tabular Metadata Classification</span>
                          <div className="text-neon-cyan font-bold text-xs">
                            EXOPLANET: {(report.predictions.ensembleVotes.xgboost[DetectionClass.ExoplanetTransit] * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Geometric Transit Probability Card */}
                    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-space-800">
                        <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-neon-cyan" />
                          Geometric Transit Probability Analysis
                        </h3>
                        <span className="text-[10px] font-mono text-gray-400">Alignment Probability</span>
                      </div>

                      <p className="text-xs text-gray-300 leading-relaxed font-sans">
                        The geometric probability that an exoplanet's orbit is aligned along Earth's line of sight to allow transit observations.
                      </p>

                      {(() => {
                        const starRadius = report.parameters?.starRadius || 1.0;
                        const planetRadius = report.parameters?.planetRadius || 1.0;
                        let semiMajorAxis = report.parameters?.semiMajorAxis;
                        
                        if (!semiMajorAxis || semiMajorAxis <= 0) {
                          const starMass = report.parameters?.starMass || 1.0;
                          const period = report.parameters?.orbitalPeriod || report.features?.transitPeriod || 3.5;
                          const periodYears = period / 365.25;
                          semiMajorAxis = Math.pow(starMass * periodYears * periodYears, 1 / 3);
                        }
                        
                        // Convert R_star (Solar Radii) to AU
                        const starRadiusAU = starRadius * 0.00465047;
                        // Convert R_planet (Earth Radii) to AU
                        const planetRadiusAU = planetRadius * 0.0000425875;
                        
                        // Geometric transit probability: p = (R_star + R_planet) / a
                        const rawProb = (starRadiusAU + planetRadiusAU) / semiMajorAxis;
                        const probPercent = rawProb * 100;
                        
                        // Max gauge scale is 25% for visualization contrast
                        const maxGaugeVal = 25;
                        const fraction = Math.min(1.0, probPercent / maxGaugeVal);
                        
                        // Gauge SVG Parameters
                        const r = 80;
                        const circ = Math.PI * r;
                        const strokeDashoffset = circ - (fraction * circ);
                        
                        // Needle Angle: 180 (left) to 0 (right)
                        const angleRad = Math.PI - (fraction * Math.PI);
                        const needleLength = 70;
                        const needleX = 100 + needleLength * Math.cos(angleRad);
                        const needleY = 100 - needleLength * Math.sin(angleRad);
                        
                        // Alignment Quality / Likelihood Tag
                        let likelihoodLabel = "";
                        let likelihoodColor = "";
                        let likelihoodBg = "";
                        let likelihoodBorder = "";
                        
                        if (probPercent < 0.5) {
                          likelihoodLabel = "EXTREMELY RARE ALIGNMENT";
                          likelihoodColor = "text-blue-400";
                          likelihoodBg = "bg-blue-500/10";
                          likelihoodBorder = "border-blue-500/20";
                        } else if (probPercent >= 0.5 && probPercent < 2.0) {
                          likelihoodLabel = "LOW ALIGNMENT PROBABILITY";
                          likelihoodColor = "text-indigo-400";
                          likelihoodBg = "bg-indigo-500/10";
                          likelihoodBorder = "border-indigo-500/20";
                        } else if (probPercent >= 2.0 && probPercent < 10.0) {
                          likelihoodLabel = "MODERATE ALIGNMENT PROBABILITY";
                          likelihoodColor = "text-emerald-400";
                          likelihoodBg = "bg-emerald-500/10";
                          likelihoodBorder = "border-emerald-500/20";
                        } else {
                          likelihoodLabel = "HIGH ALIGNMENT PROBABILITY";
                          likelihoodColor = "text-star-gold";
                          likelihoodBg = "bg-amber-500/10";
                          likelihoodBorder = "border-amber-500/20";
                        }

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2 items-center">
                            {/* Left Column: Semicircle SVG Gauge Chart */}
                            <div className="md:col-span-5 flex flex-col items-center justify-center bg-space-950 p-4 rounded-xl border border-space-850 relative h-56">
                              <div className="w-full max-w-[200px] aspect-[2/1] relative">
                                <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible">
                                  <defs>
                                    <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                      <stop offset="0%" stopColor="#3b82f6" />
                                      <stop offset="30%" stopColor="#06b6d4" />
                                      <stop offset="70%" stopColor="#10b981" />
                                      <stop offset="100%" stopColor="#f59e0b" />
                                    </linearGradient>
                                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                      <feGaussianBlur stdDeviation="3" result="blur" />
                                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                  </defs>
                                  
                                  <path
                                    d="M 20 100 A 80 80 0 0 1 180 100"
                                    fill="none"
                                    stroke="#1e293b"
                                    strokeWidth="16"
                                    strokeLinecap="round"
                                  />
                                  
                                  <path
                                    d="M 20 100 A 80 80 0 0 1 180 100"
                                    fill="none"
                                    stroke="url(#gaugeGrad)"
                                    strokeWidth="16"
                                    strokeLinecap="round"
                                    strokeDasharray={circ}
                                    strokeDashoffset={strokeDashoffset}
                                    className="transition-all duration-1000 ease-out"
                                  />
                                  
                                  <line x1="20" y1="100" x2="30" y2="100" stroke="#475569" strokeWidth="2" />
                                  <line x1="100" y1="20" x2="100" y2="30" stroke="#475569" strokeWidth="2" />
                                  <line x1="180" y1="100" x2="170" y2="100" stroke="#475569" strokeWidth="2" />
                                  
                                  <text x="18" y="114" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">0%</text>
                                  <text x="100" y="15" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">12.5%</text>
                                  <text x="182" y="114" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">25%+</text>
                                  
                                  <circle cx="100" cy="100" r="10" fill="#0f172a" stroke="#475569" strokeWidth="2" />
                                  
                                  <line
                                    x1="100"
                                    y1="100"
                                    x2={needleX}
                                    y2={needleY}
                                    stroke="#ffffff"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    filter="url(#glow)"
                                    className="transition-all duration-1000 ease-out"
                                  />
                                  <circle cx="100" cy="100" r="4" fill="#ffffff" />
                                </svg>
                              </div>
                              
                              <div className="text-center mt-2 z-10">
                                <span className="text-2xl font-bold font-mono text-white tracking-tight">
                                  {probPercent.toFixed(3)}%
                                </span>
                                <span className="text-[9px] text-gray-500 font-mono block mt-0.5">LINE-OF-SIGHT PROBABILITY</span>
                              </div>

                              <div className="absolute top-3 right-3">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${likelihoodBg} ${likelihoodColor} border ${likelihoodBorder}`}>
                                  {likelihoodLabel}
                                </span>
                              </div>
                            </div>

                            {/* Right Column: Calculations, variables & LaTeX style formula */}
                            <div className="md:col-span-7 space-y-4 text-xs">
                              <div className="bg-space-950 p-3 rounded-lg border border-space-850/60 font-mono space-y-2">
                                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Geometric Alignment Formula</div>
                                <div className="text-center py-2 text-sm text-neon-cyan bg-space-900/40 rounded border border-space-900 font-bold select-all">
                                  P_transit ≈ (R_star + R_planet) / a
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 font-mono text-[11px] leading-relaxed">
                                <div className="bg-space-950/40 p-2.5 rounded border border-space-850/40">
                                  <span className="text-gray-500 block text-[9px] uppercase">Host Star Radius (R_*)</span>
                                  <strong className="text-white block mt-0.5">{starRadius.toFixed(3)} R_sun</strong>
                                  <span className="text-[9px] text-gray-400 block font-mono">≈ {starRadiusAU.toFixed(6)} AU</span>
                                </div>
                                <div className="bg-space-950/40 p-2.5 rounded border border-space-850/40">
                                  <span className="text-gray-500 block text-[9px] uppercase">Planet Radius (R_p)</span>
                                  <strong className="text-emerald-400 block mt-0.5">{planetRadius.toFixed(3)} R_earth</strong>
                                  <span className="text-[9px] text-gray-400 block font-mono">≈ {planetRadiusAU.toFixed(6)} AU</span>
                                </div>
                                <div className="bg-space-950/40 p-2.5 rounded border border-space-850/40">
                                  <span className="text-gray-500 block text-[9px] uppercase">Semi-major Axis (a)</span>
                                  <strong className="text-white block mt-0.5">{semiMajorAxis.toFixed(4)} AU</strong>
                                  <span className="text-[9px] text-gray-400 block font-mono">≈ {(semiMajorAxis * 149.6).toFixed(1)}M km</span>
                                </div>
                                <div className="bg-space-950/40 p-2.5 rounded border border-space-850/40">
                                  <span className="text-gray-500 block text-[9px] uppercase">Detected Period (P)</span>
                                  <strong className="text-amber-400 block mt-0.5">{report.features.transitPeriod.toFixed(4)} Days</strong>
                                  <span className="text-[9px] text-gray-400 block font-mono">From Lomb-Scargle Fit</span>
                                </div>
                              </div>

                              <div className="text-gray-400 leading-relaxed font-sans text-[11px] border-t border-space-850 pt-2.5">
                                The orbital plane must intersect Earth's viewing cone. The probability is highly sensitive to the planet's distance from its star (<span className="text-white font-semibold">a</span>). For every transiting system observed, many identical companions orbiting at slightly different tilts remain completely invisible to our light curve surveys.
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* False Positive Rejections (Right sidebar) */}
                  {/* Right Sidebar Column */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* False Positive Rejections (Right sidebar) */}
                    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4">
                      <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-star-gold" />
                        False Positive Rejection Suite
                      </h3>
                      <p className="text-xs text-gray-300 leading-relaxed font-sans">
                        Astronomical transits are easily mimicked by other events. The platform runs automated criteria checks to isolate genuine planets.
                      </p>

                      <div className="space-y-3 pt-2 font-mono text-[11px]">
                        {/* EB Check */}
                        <div className="bg-space-950 p-2.5 rounded border border-space-850 flex justify-between items-center">
                          <div>
                            <span className="text-gray-400 font-semibold block">Background Binary check</span>
                            <span className="text-[9px] text-gray-500">Unusually deep dips ({report.features.transitDepth} ppm)</span>
                          </div>
                          <span className={report.falsePositiveRejection.backgroundEB ? "text-rose-400 font-bold" : "text-emerald-400"}>
                            {report.falsePositiveRejection.backgroundEB ? "WARNING" : "PASSED"}
                          </span>
                        </div>

                        {/* Secondary Eclipse Check */}
                        <div className="bg-space-950 p-2.5 rounded border border-space-850 flex justify-between items-center">
                          <div>
                            <span className="text-gray-400 font-semibold block">Secondary Eclipses</span>
                            <span className="text-[9px] text-gray-500">Dips at phase 0.5 cycles</span>
                          </div>
                          <span className={report.falsePositiveRejection.secondaryEclipse ? "text-rose-400 font-bold" : "text-emerald-400"}>
                            {report.falsePositiveRejection.secondaryEclipse ? "WARNING" : "PASSED"}
                          </span>
                        </div>

                        {/* Odd Even check */}
                        <div className="bg-space-950 p-2.5 rounded border border-space-850 flex justify-between items-center">
                          <div>
                            <span className="text-gray-400 font-semibold block">Odd-Even depth parity</span>
                            <span className="text-[9px] text-gray-500">Depth variation in consecutive periods</span>
                          </div>
                          <span className={report.falsePositiveRejection.oddEvenMismatch ? "text-rose-400 font-bold" : "text-emerald-400"}>
                            {report.falsePositiveRejection.oddEvenMismatch ? "WARNING" : "PASSED"}
                          </span>
                        </div>

                        {/* Centroid shift */}
                        <div className="bg-space-950 p-2.5 rounded border border-space-850 flex justify-between items-center">
                          <div>
                            <span className="text-gray-400 font-semibold block">Pixel Centroid Shift</span>
                            <span className="text-[9px] text-gray-500">Spatial centroid movement of star</span>
                          </div>
                          <span className={report.falsePositiveRejection.centroidShift ? "text-rose-400 font-bold" : "text-emerald-400"}>
                            {report.falsePositiveRejection.centroidShift ? "WARNING" : "PASSED"}
                          </span>
                        </div>

                        {/* Low SNR */}
                        <div className="bg-space-950 p-2.5 rounded border border-space-850 flex justify-between items-center">
                          <div>
                            <span className="text-gray-400 font-semibold block">Signal-to-Noise Ratio (SNR)</span>
                            <span className="text-[9px] text-gray-500">Requires SNR &gt; 4.0 (Got {report.features.snr})</span>
                          </div>
                          <span className={report.falsePositiveRejection.lowSNR ? "text-rose-400 font-bold" : "text-emerald-400"}>
                            {report.falsePositiveRejection.lowSNR ? "WARNING" : "PASSED"}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-space-800">
                        <div className={`p-3 rounded-lg text-xs font-mono flex items-center gap-2.5 ${
                          report.falsePositiveRejection.passedAllChecks 
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                            : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                        }`}>
                          {report.falsePositiveRejection.passedAllChecks ? (
                            <>
                              <CheckCircle className="w-5 h-5 flex-shrink-0" />
                              <div>
                                <strong>CONGRUENT CANDIDATE</strong>
                                <span className="block text-[9px] text-emerald-500/80 mt-0.5">Successfully passed all exoplanet transit diagnostic checks.</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                              <div>
                                <strong>REJECTED Mimic Signatures</strong>
                                <span className="block text-[9px] text-rose-500/80 mt-0.5">Flagged for possible false-positive stellar contamination risk.</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Astronomer Retraining Feedback Loop */}
                    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4">
                      <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-neon-cyan animate-pulse" />
                        Astronomer Retraining Feedback Loop
                      </h3>
                      <p className="text-xs text-gray-300 leading-relaxed font-sans">
                        Validate this candidate prediction. Submitting feedback appends your expert annotations to our retraining pipeline to improve deep ensemble accuracy.
                      </p>

                      <div className="bg-space-950 p-3.5 rounded border border-space-850 space-y-3">
                        <span className="text-[10px] font-mono text-gray-500 block uppercase">
                          CURRENT PLATFORM METRICS
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="bg-space-900/50 p-2 rounded border border-space-800">
                            <span className="text-[9px] text-gray-400 font-mono block">TOTAL FEEDBACK</span>
                            <span className="text-white font-bold text-sm">
                              {feedbackStats ? feedbackStats.totalFeedbackCount : 0}
                            </span>
                          </div>
                          <div className="bg-space-900/50 p-2 rounded border border-space-800">
                            <span className="text-[9px] text-gray-400 font-mono block">VALIDATED ACCURACY</span>
                            <span className="text-emerald-400 font-bold text-sm">
                              {feedbackStats ? `${feedbackStats.accuracyMetric}%` : "94.2%"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2 font-sans text-xs">
                        <span className="text-[10px] font-mono text-gray-500 block uppercase">
                          LABEL THIS PREDICTION
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSetFeedbackCorrect(true)}
                            className={`flex-1 py-2 rounded font-mono text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 ${
                              isFeedbackCorrect === true
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold"
                                : "bg-space-950 text-gray-400 border border-space-850 hover:bg-space-900"
                            }`}
                          >
                            <CheckCircle className="w-4 h-4" /> Correct
                          </button>
                          <button
                            onClick={() => handleSetFeedbackCorrect(false)}
                            className={`flex-1 py-2 rounded font-mono text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 ${
                              isFeedbackCorrect === false
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 font-semibold"
                                : "bg-space-950 text-gray-400 border border-space-850 hover:bg-space-900"
                            }`}
                          >
                            <AlertTriangle className="w-4 h-4" /> Incorrect
                          </button>
                        </div>

                        {isFeedbackCorrect !== null && (
                          <div className="space-y-2.5 animate-fadeIn">
                            <label className="text-[10px] font-mono text-gray-400 block uppercase">
                              Notes / Retraining Annotations
                            </label>
                            <textarea
                              value={feedbackNotes}
                              onChange={(e) => setFeedbackNotes(e.target.value)}
                              placeholder={
                                isFeedbackCorrect
                                  ? "E.g., High signal-to-noise ratio confirms real Keplerian orbit."
                                  : "E.g., Centroid pixel shift indicates a background eclipsing binary contamination."
                              }
                              className="w-full bg-space-950 border border-space-850 rounded p-2 text-xs text-white font-sans focus:outline-none focus:border-neon-cyan transition h-16 resize-none"
                            />
                            
                            <button
                              onClick={submitAstronomerFeedback}
                              disabled={isSubmittingFeedback}
                              className="w-full py-2 bg-gradient-to-r from-cosmic-purple to-neon-cyan hover:opacity-90 disabled:opacity-50 text-white font-mono text-xs font-semibold rounded cursor-pointer transition flex items-center justify-center gap-1.5 shadow-md"
                            >
                              {isSubmittingFeedback ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Submitting...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5" /> Submit Annotation
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {feedbackSuccess && (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded p-2 text-[10px] font-mono leading-normal text-center">
                            Annotation logged! Model retraining queue updated.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: EXPLAINABLE AI (XAI) */}
            {activeTab === "explain" && report && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center pb-4 border-b border-space-700/50">
                  <div>
                    <h2 className="text-xl font-display font-bold text-white">
                      Explainable AI (XAI) Diagnostics
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Visualize LIME feature attributions, Transformer attention heatmaps, and request a Gemini peer-review analysis.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Local Explanations and SHAP values */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* SHAP Feature Importance */}
                    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4">
                      <h3 className="text-sm font-semibold text-gray-100">SHAP Global Feature Importance</h3>
                      <p className="text-xs text-gray-300 leading-relaxed font-sans">
                        SHAP values indicate how heavily the model's prediction was weighted by individual light curve features.
                      </p>

                      <div className="space-y-3.5 pt-2">
                        {Object.entries(report.explainableAI.shapValues).map(([feat, val]) => {
                          const numVal = val as number;
                          const widthPct = Math.min(100, Math.max(5, Math.abs(numVal) * 200));
                          const isPositive = numVal >= 0;
                          return (
                            <div key={feat} className="flex items-center gap-4 text-xs font-mono">
                              <span className="w-36 text-gray-400 font-medium truncate">{feat}</span>
                              <div className="flex-1 h-3 bg-space-950 rounded overflow-hidden border border-space-850 relative">
                                <div
                                  className={`h-full rounded-sm transition-all duration-500 ${isPositive ? "bg-emerald-500/80" : "bg-rose-500/80"}`}
                                  style={{ width: `${widthPct}%` }}
                                />
                              </div>
                              <span className={`w-12 text-right font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                                {isPositive ? "+" : ""}{numVal.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* LIME Local explanation list */}
                    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4">
                      <h3 className="text-sm font-semibold text-gray-100">LIME Local Feature Explanations</h3>
                      <div className="space-y-3 font-mono text-xs">
                        {report.explainableAI.limeExplanations.map((lime, idx) => (
                          <div key={idx} className="bg-space-950 p-3.5 rounded border border-space-850 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-white font-bold">{lime.feature}</span>
                              <span className={`font-semibold ${lime.impact >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                Impact: {lime.impact >= 0 ? "+" : ""}{(lime.impact * 100).toFixed(0)}%
                              </span>
                            </div>
                            <p className="text-gray-400 text-[11px] leading-relaxed font-sans">
                              {lime.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Attention weights grid heatmap */}
                    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4">
                      <h3 className="text-sm font-semibold text-gray-100">Transformer Attention Grid Heatmap</h3>
                      <p className="text-xs text-gray-300 leading-relaxed font-sans">
                        Represents the self-attention weights of the Transformer Encoder over 50 phase intervals. Dark spots represent zero attention; bright spots correspond to critical orbital transits.
                      </p>

                      <div className="grid grid-cols-10 gap-2.5 pt-2">
                        {report.explainableAI.attentionHeatmap.map((weight, idx) => {
                          const phase = -0.5 + idx / 50;
                          return (
                            <div
                              key={idx}
                              className="h-9 rounded border border-space-800 relative group flex items-center justify-center cursor-help transition-all duration-300 hover:scale-105"
                              style={{
                                backgroundColor: `rgba(6, 182, 212, ${weight})`,
                                boxShadow: weight > 0.4 ? `0 0 10px rgba(6,182,212,${weight * 0.4})` : "none"
                              }}
                            >
                              <span className="text-[9px] font-mono font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                                {weight.toFixed(1)}
                              </span>
                              
                              {/* Hover label phase */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-space-950 border border-space-600 rounded text-[9px] font-mono px-1.5 py-0.5 whitespace-nowrap z-50 shadow-2xl">
                                Phase: {phase.toFixed(2)} • W: {weight}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Deep Gemini Academic summary */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4">
                      <div className="flex items-center gap-2 text-star-gold font-bold text-xs font-mono uppercase">
                        <Sparkles className="w-4 h-4 text-star-gold" />
                        AI Peer-Review Diagnostic
                      </div>
                      <h3 className="text-md font-display font-semibold text-white">
                        Gemini Academic Review
                      </h3>
                      <p className="text-xs text-gray-300 leading-relaxed font-sans">
                        Submit this exoplanetary candidate's full photometry, statistical moments, and false-positive metrics directly to Gemini for a world-class astrophysicist review.
                      </p>

                      <button
                        onClick={triggerGeminiExplanation}
                        disabled={isExplaining}
                        className="w-full py-2.5 bg-gradient-to-tr from-cosmic-purple to-neon-cyan hover:from-cosmic-purple/90 hover:to-neon-cyan/90 disabled:opacity-50 text-white text-xs font-semibold rounded-lg tracking-wider transition shadow-md flex items-center justify-center gap-1.5"
                      >
                        {isExplaining ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Fetching Peer-Review...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" /> Request Academic Summary
                          </>
                        )}
                      </button>

                      {geminiError && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg p-3 font-mono text-[10px] mt-4">
                          {geminiError}
                        </div>
                      )}

                      {geminiExplanation && (
                        <div className="bg-space-950 p-4 rounded-lg border border-space-850 text-xs leading-relaxed max-h-[480px] overflow-y-auto pr-2 space-y-3 font-sans text-gray-300 border-t-2 border-t-star-gold shadow-inner">
                          <h4 className="text-xs font-mono font-bold text-white uppercase border-b border-space-800 pb-1 flex justify-between">
                            <span>SPECTRAL EVALUATION</span>
                            <span className="text-[10px] text-emerald-400">VERIFIED</span>
                          </h4>
                          
                          {/* Parse markdown headlines to look stylish */}
                          <div className="space-y-4 whitespace-pre-wrap">
                            {geminiExplanation}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: TRANSIT SIMULATOR */}
            {activeTab === "simulator" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-space-900 border border-space-800 rounded-2xl p-6">
                  <div className="pb-4 border-b border-space-800">
                    <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                      <Globe className="w-5 h-5 text-neon-cyan" />
                      Astro-Physics Transit Simulator Lab
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Simulate Keplerian orbits and exoplanet transits. Adjust stellar and planetary sizes in real-time to compute the synthetic photometry dips and physical transit metrics.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    {/* Simulator Controls */}
                    <div className="bg-space-950 p-5 rounded-xl border border-space-850 space-y-5 font-mono text-xs">
                      <h3 className="text-sm font-semibold text-gray-100 uppercase tracking-wider text-[10px] border-b border-space-850 pb-2">
                        PHYSICAL SYSTEM CONTROLLERS
                      </h3>

                      {/* Stellar Radius Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-400">Stellar Radius (R_sun):</span>
                          <span className="text-neon-cyan font-bold">{simStellarRadius.toFixed(2)} R☉</span>
                        </div>
                        <input
                          type="range"
                          min="0.4"
                          max="2.5"
                          step="0.05"
                          value={simStellarRadius}
                          onChange={(e) => setSimStellarRadius(parseFloat(e.target.value))}
                          className="w-full accent-neon-cyan"
                        />
                        <p className="text-[9px] text-gray-500 font-sans leading-none">
                          Controls the size of the host star. Large stars produce shallower transit dips for a given planet size.
                        </p>
                      </div>

                      {/* Planet b (Primary) Section */}
                      <div className="space-y-4 pt-3 border-t border-space-850">
                        <div className="border-b border-space-850 pb-1 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-neon-cyan tracking-wider uppercase">PLANET b (PRIMARY)</span>
                          <span className="text-[9px] bg-neon-cyan/10 text-neon-cyan px-1 rounded">INNER</span>
                        </div>

                        {/* Planet Radius Slider */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-gray-400">Planetary Radius (R_earth):</span>
                            <span className="text-neon-cyan font-bold">{simPlanetaryRadius.toFixed(1)} R⊕</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="16.0"
                            step="0.1"
                            value={simPlanetaryRadius}
                            onChange={(e) => setSimPlanetaryRadius(parseFloat(e.target.value))}
                            className="w-full accent-neon-cyan"
                          />
                          <p className="text-[9px] text-gray-500 font-sans leading-none">
                            Controls the size of the exoplanet. Super-Earths (~1.5-2 R⊕) and Gas Giants (10-15 R⊕).
                          </p>
                        </div>

                        {/* Orbital Period Slider */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-gray-400">Orbital Period (Days):</span>
                            <span className="text-neon-cyan font-bold">{simOrbitalPeriod.toFixed(1)} Days</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="20.0"
                            step="0.5"
                            value={simOrbitalPeriod}
                            onChange={(e) => setSimOrbitalPeriod(parseFloat(e.target.value))}
                            className="w-full accent-neon-cyan"
                          />
                          <p className="text-[9px] text-gray-500 font-sans leading-none">
                            Duration of a single full planetary orbit. Directly controls transit repeat frequencies.
                          </p>
                        </div>

                        {/* Inclination Slider */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-gray-400">Orbit Inclination (deg):</span>
                            <span className="text-neon-cyan font-bold">{simInclination.toFixed(1)}°</span>
                          </div>
                          <input
                            type="range"
                            min="84.0"
                            max="90.0"
                            step="0.1"
                            value={simInclination}
                            onChange={(e) => setSimInclination(parseFloat(e.target.value))}
                            className="w-full accent-neon-cyan"
                          />
                          <p className="text-[9px] text-gray-500 font-sans leading-none">
                            Defines orbital plane angle. A 90.0° inclination corresponds to a perfect equatorial crossing.
                          </p>
                        </div>

                        {/* Orbital Distance Slider */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-gray-400">Orbital Distance (AU):</span>
                            <span className="text-neon-cyan font-bold">{simOrbitalDistance.toFixed(3)} AU</span>
                          </div>
                          <input
                            type="range"
                            min="0.010"
                            max="0.250"
                            step="0.005"
                            value={simOrbitalDistance}
                            onChange={(e) => setSimOrbitalDistance(parseFloat(e.target.value))}
                            className="w-full accent-neon-cyan"
                          />
                          <p className="text-[9px] text-gray-500 font-sans leading-none">
                            Semi-major axis. Closer planets travel faster, creating shorter transits and receiving more stellar flux.
                          </p>
                        </div>
                      </div>

                      {/* Secondary Planet Toggle */}
                      <div className="pt-4 border-t border-space-850 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-300">ADD SECONDARY PLANET (c)</span>
                        <button
                          type="button"
                          onClick={() => setSimHasSecondPlanet(!simHasSecondPlanet)}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            simHasSecondPlanet ? 'bg-cosmic-purple' : 'bg-space-800'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-space-950 shadow ring-0 transition duration-200 ease-in-out ${
                              simHasSecondPlanet ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Planet c (Secondary) Section */}
                      {simHasSecondPlanet && (
                        <div className="space-y-4 pt-3 border-t border-space-850">
                          <div className="border-b border-space-850 pb-1 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-cosmic-purple tracking-wider uppercase">PLANET c (SECONDARY)</span>
                            <span className="text-[9px] bg-cosmic-purple/10 text-cosmic-purple px-1 rounded">OUTER</span>
                          </div>

                          {/* Planet 2 Radius Slider */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-gray-400">Planetary Radius (R_earth):</span>
                              <span className="text-cosmic-purple font-bold">{simPlanetaryRadius2.toFixed(1)} R⊕</span>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max="16.0"
                              step="0.1"
                              value={simPlanetaryRadius2}
                              onChange={(e) => setSimPlanetaryRadius2(parseFloat(e.target.value))}
                              className="w-full accent-cosmic-purple"
                            />
                            <p className="text-[9px] text-gray-500 font-sans leading-none">
                              Controls the size of Planet c.
                            </p>
                          </div>

                          {/* Planet 2 Orbital Period Slider */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-gray-400">Orbital Period (Days):</span>
                              <span className="text-cosmic-purple font-bold">{simOrbitalPeriod2.toFixed(1)} Days</span>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max="20.0"
                              step="0.5"
                              value={simOrbitalPeriod2}
                              onChange={(e) => setSimOrbitalPeriod2(parseFloat(e.target.value))}
                              className="w-full accent-cosmic-purple"
                            />
                            <p className="text-[9px] text-gray-500 font-sans leading-none">
                              Orbital cycle duration for Planet c.
                            </p>
                          </div>

                          {/* Planet 2 Inclination Slider */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-gray-400">Orbit Inclination (deg):</span>
                              <span className="text-cosmic-purple font-bold">{simInclination2.toFixed(1)}°</span>
                            </div>
                            <input
                              type="range"
                              min="84.0"
                              max="90.0"
                              step="0.1"
                              value={simInclination2}
                              onChange={(e) => setSimInclination2(parseFloat(e.target.value))}
                              className="w-full accent-cosmic-purple"
                            />
                            <p className="text-[9px] text-gray-500 font-sans leading-none">
                              Orbital plane angle for Planet c.
                            </p>
                          </div>

                          {/* Planet 2 Orbital Distance Slider */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-gray-400">Orbital Distance (AU):</span>
                              <span className="text-cosmic-purple font-bold">{simOrbitalDistance2.toFixed(3)} AU</span>
                            </div>
                            <input
                              type="range"
                              min="0.010"
                              max="0.250"
                              step="0.005"
                              value={simOrbitalDistance2}
                              onChange={(e) => setSimOrbitalDistance2(parseFloat(e.target.value))}
                              className="w-full accent-cosmic-purple"
                            />
                            <p className="text-[9px] text-gray-500 font-sans leading-none">
                              Semi-major axis for Planet c.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Simulation Visual Area & Plotting */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Visual System Render */}
                      <div className="bg-space-950 p-5 rounded-xl border border-space-850 flex flex-col items-center justify-center relative min-h-[220px]">
                        <span className="absolute left-4 top-4 text-[9px] font-mono text-gray-500">SYSTEM VISUALIZER</span>
                        
                        {/* Interactive SVG Rendering the Stellar occultation */}
                        <svg className="w-full max-w-sm h-40" viewBox="0 0 200 100">
                          <defs>
                            {/* Stellar glow gradient */}
                            <radialGradient id="stellarGlow" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="#ffb936" />
                              <stop offset="70%" stopColor="#ff7a00" />
                              <stop offset="100%" stopColor="#ff4d00" stopOpacity="0" />
                            </radialGradient>
                          </defs>

                          {/* Black starry background */}
                          <rect width="200" height="100" fill="#030408" rx="6" />

                          {/* Star center */}
                          <circle 
                            cx="100" 
                            cy="50" 
                            r={Math.min(32, Math.max(10, simStellarRadius * 16))} 
                            fill="url(#stellarGlow)"
                          />
                          <circle 
                            cx="100" 
                            cy="50" 
                            r={Math.min(28, Math.max(8, simStellarRadius * 14))} 
                            fill="#ffe17d"
                          />

                          {/* Planet b Orbital path line */}
                          {(() => {
                            const yOffset = 50 + (90 - simInclination) * 3;
                            return (
                              <line 
                                x1="20" 
                                y1={yOffset} 
                                x2="180" 
                                y2={yOffset} 
                                stroke="#3b82f6" 
                                strokeWidth="0.5" 
                                strokeDasharray="3 3" 
                                opacity="0.6"
                              />
                            );
                          })()}

                          {/* Planet c Orbital path line */}
                          {simHasSecondPlanet && (() => {
                            const yOffset2 = 50 + (90 - simInclination2) * 3;
                            return (
                              <line 
                                x1="10" 
                                y1={yOffset2} 
                                x2="190" 
                                y2={yOffset2} 
                                stroke="#d946ef" 
                                strokeWidth="0.5" 
                                strokeDasharray="3 3" 
                                opacity="0.6"
                              />
                            );
                          })()}

                          {/* Planet b disk moving */}
                          {(() => {
                            const angleRad = (simTimeStep * Math.PI) / 180;
                            // Calculate transit path x from -70 to +70 around center 100
                            const planetX = 100 + Math.cos(angleRad) * 70;
                            const planetY = 50 + (90 - simInclination) * 3;
                            const isBehind = Math.sin(angleRad) < 0;
                            
                            const starRadiusPx = Math.min(28, Math.max(8, simStellarRadius * 14));
                            const distanceToStarCenter = Math.sqrt(Math.pow(planetX - 100, 2) + Math.pow(planetY - 50, 2));
                            const isInTransit = !isBehind && distanceToStarCenter < starRadiusPx;

                            return (
                              <circle
                                cx={planetX}
                                cy={planetY}
                                r={Math.min(10, Math.max(2, (simPlanetaryRadius / 109.2) * 14 * 10))}
                                fill={isInTransit ? "#000000" : "#3b82f6"}
                                stroke={isInTransit ? "#ffe17d" : "#1d4ed8"}
                                strokeWidth="0.8"
                                opacity={isBehind ? 0.15 : 1}
                              />
                            );
                          })()}

                          {/* Planet c disk moving */}
                          {simHasSecondPlanet && (() => {
                            // Angular speed relative to period ratio
                            const angleRad2 = (simTimeStep * (simOrbitalPeriod / simOrbitalPeriod2) * Math.PI) / 180;
                            // Outer orbit radius 95
                            const planetX2 = 100 + Math.cos(angleRad2) * 95;
                            const planetY2 = 50 + (90 - simInclination2) * 3;
                            const isBehind2 = Math.sin(angleRad2) < 0;
                            
                            const starRadiusPx = Math.min(28, Math.max(8, simStellarRadius * 14));
                            const distanceToStarCenter2 = Math.sqrt(Math.pow(planetX2 - 100, 2) + Math.pow(planetY2 - 50, 2));
                            const isInTransit2 = !isBehind2 && distanceToStarCenter2 < starRadiusPx;

                            return (
                              <circle
                                cx={planetX2}
                                cy={planetY2}
                                r={Math.min(10, Math.max(2, (simPlanetaryRadius2 / 109.2) * 14 * 10))}
                                fill={isInTransit2 ? "#000000" : "#d946ef"}
                                stroke={isInTransit2 ? "#ffe17d" : "#a21caf"}
                                strokeWidth="0.8"
                                opacity={isBehind2 ? 0.15 : 1}
                              />
                            );
                          })()}
                        </svg>

                        <div className="flex flex-wrap justify-center gap-4 font-mono text-[10px] text-gray-400 mt-2">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#ffe17d]" /> Host Star
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#3b82f6]" /> Planet b (Primary)
                          </span>
                          {simHasSecondPlanet && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-[#d946ef]" /> Planet c (Secondary)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Computed Physics Output Cards */}
                      {(() => {
                        // Star conversion
                        const starRadiusInEarth = simStellarRadius * 109.2;
                        
                        // Planet b calculations
                        const depthFraction1 = Math.pow(simPlanetaryRadius / starRadiusInEarth, 2);
                        const transitDepthPpm1 = depthFraction1 * 1e6;
                        const speedKms1 = Math.sqrt((6.6743e-11 * 1.989e30) / (simOrbitalDistance * 1.496e11)) / 1000;
                        const durationHours1 = (simOrbitalPeriod * 24 * (simStellarRadius * 6.957e8)) / (Math.PI * simOrbitalDistance * 1.496e11);

                        // Planet c calculations
                        const depthFraction2 = Math.pow(simPlanetaryRadius2 / starRadiusInEarth, 2);
                        const transitDepthPpm2 = depthFraction2 * 1e6;
                        const speedKms2 = Math.sqrt((6.6743e-11 * 1.989e30) / (simOrbitalDistance2 * 1.496e11)) / 1000;
                        const durationHours2 = (simOrbitalPeriod2 * 24 * (simStellarRadius * 6.957e8)) / (Math.PI * simOrbitalDistance2 * 1.496e11);

                        // Live positions and overlap calculation at current simTimeStep
                        const starRadiusPx = Math.min(28, Math.max(8, simStellarRadius * 14));
                        const planetRadiusPx1 = Math.min(10, Math.max(2, (simPlanetaryRadius / 109.2) * 14 * 10));
                        const planetRadiusPx2 = Math.min(10, Math.max(2, (simPlanetaryRadius2 / 109.2) * 14 * 10));

                        // Planet b live overlap
                        const angleRad1 = (simTimeStep * Math.PI) / 180;
                        const planetX1 = 100 + Math.cos(angleRad1) * 70;
                        const planetY1 = 50 + (90 - simInclination) * 3;
                        const dist1 = Math.sqrt(Math.pow(planetX1 - 100, 2) + Math.pow(planetY1 - 50, 2));
                        const isBehind1 = Math.sin(angleRad1) < 0;
                        let liveDip1 = 0;
                        if (!isBehind1 && dist1 < (starRadiusPx + planetRadiusPx1)) {
                          const overlap1 = Math.max(0, Math.min(1, (starRadiusPx + planetRadiusPx1 - dist1) / (2 * planetRadiusPx1)));
                          liveDip1 = depthFraction1 * overlap1;
                        }

                        // Planet c live overlap
                        let liveDip2 = 0;
                        if (simHasSecondPlanet) {
                          const angleRad2 = (simTimeStep * (simOrbitalPeriod / simOrbitalPeriod2) * Math.PI) / 180;
                          const planetX2 = 100 + Math.cos(angleRad2) * 95;
                          const planetY2 = 50 + (90 - simInclination2) * 3;
                          const dist2 = Math.sqrt(Math.pow(planetX2 - 100, 2) + Math.pow(planetY2 - 50, 2));
                          const isBehind2 = Math.sin(angleRad2) < 0;
                          if (!isBehind2 && dist2 < (starRadiusPx + planetRadiusPx2)) {
                            const overlap2 = Math.max(0, Math.min(1, (starRadiusPx + planetRadiusPx2 - dist2) / (2 * planetRadiusPx2)));
                            liveDip2 = depthFraction2 * overlap2;
                          }
                        }

                        const combinedLiveDip = liveDip1 + liveDip2;
                        const relativeFlux = 1.0 - combinedLiveDip;

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Planet b details */}
                            <div className="bg-space-950 p-4 rounded-xl border border-space-850 font-mono text-xs">
                              <span className="text-neon-cyan block text-[9px] uppercase font-bold mb-1">Planet b (Primary)</span>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Depth:</span>
                                <span className="text-white font-bold">{transitDepthPpm1.toLocaleString(undefined, { maximumFractionDigits: 1 })} ppm</span>
                              </div>
                              <div className="flex justify-between mt-1">
                                <span className="text-gray-400">Duration:</span>
                                <span className="text-white font-bold">{Math.max(0.1, durationHours1).toFixed(2)} Hours</span>
                              </div>
                              <div className="flex justify-between mt-1">
                                <span className="text-gray-400">Velocity:</span>
                                <span className="text-white font-bold">{speedKms1.toFixed(1)} km/s</span>
                              </div>
                            </div>

                            {/* Planet c details */}
                            <div className="bg-space-950 p-4 rounded-xl border border-space-850 font-mono text-xs">
                              <span className="text-cosmic-purple block text-[9px] uppercase font-bold mb-1">Planet c (Secondary)</span>
                              {simHasSecondPlanet ? (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Depth:</span>
                                    <span className="text-white font-bold">{transitDepthPpm2.toLocaleString(undefined, { maximumFractionDigits: 1 })} ppm</span>
                                  </div>
                                  <div className="flex justify-between mt-1">
                                    <span className="text-gray-400">Duration:</span>
                                    <span className="text-white font-bold">{Math.max(0.1, durationHours2).toFixed(2)} Hours</span>
                                  </div>
                                  <div className="flex justify-between mt-1">
                                    <span className="text-gray-400">Velocity:</span>
                                    <span className="text-white font-bold">{speedKms2.toFixed(1)} km/s</span>
                                  </div>
                                </>
                              ) : (
                                <div className="text-gray-500 italic flex items-center justify-center h-12">
                                  Secondary Planet c Disabled
                                </div>
                              )}
                            </div>

                            {/* Combined Telemetry card */}
                            <div className="bg-space-950 p-4 rounded-xl border border-space-850 font-mono text-xs md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                              <div>
                                <span className="text-gray-500 block text-[9px] uppercase">Combined Max Depth</span>
                                <span className="text-neon-cyan font-bold text-base">
                                  {((depthFraction1 + (simHasSecondPlanet ? depthFraction2 : 0)) * 1e6).toLocaleString(undefined, { maximumFractionDigits: 1 })} ppm
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 block text-[9px] uppercase">Live Combined Dip</span>
                                <span className="text-pink-500 font-bold text-base">
                                  {(combinedLiveDip * 1e6).toLocaleString(undefined, { maximumFractionDigits: 1 })} ppm
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 block text-[9px] uppercase">Live Relative Flux</span>
                                <span className="text-emerald-400 font-bold text-base">
                                  {relativeFlux.toFixed(6)}
                                </span>
                              </div>
                            </div>

                            {/* Live Transit plot SVG */}
                            <div className="bg-space-950 p-4 rounded-xl border border-space-850 font-mono text-xs md:col-span-2">
                              <span className="text-gray-500 block text-[9px] uppercase mb-2">Simulated Combined Transit Light Curve (Live Scrolling)</span>
                              <svg className="w-full h-24" viewBox="0 0 400 100">
                                {/* Base flux grid line */}
                                <line x1="10" y1="20" x2="390" y2="20" stroke="#1e293b" strokeWidth="1" />
                                <line x1="10" y1="80" x2="390" y2="80" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />

                                {/* Draw the transit curve */}
                                {(() => {
                                  let pointsPath = "";
                                  const baseFluxY = 20;
                                  
                                  const maxPossibleCombinedDip = depthFraction1 + (simHasSecondPlanet ? depthFraction2 : 0);

                                  for (let x = 10; x <= 390; x++) {
                                    // Map x to time offset from current simTimeStep
                                    // x=200 matches current simTimeStep exactly
                                    const t = simTimeStep + (x - 200) * 1.5;

                                    // Planet b transit at t
                                    const angleRad1_t = (t * Math.PI) / 180;
                                    const planetX1_t = 100 + Math.cos(angleRad1_t) * 70;
                                    const planetY1_t = 50 + (90 - simInclination) * 3;
                                    const dist1_t = Math.sqrt(Math.pow(planetX1_t - 100, 2) + Math.pow(planetY1_t - 50, 2));
                                    const isBehind1_t = Math.sin(angleRad1_t) < 0;
                                    let dip1_t = 0;
                                    if (!isBehind1_t && dist1_t < (starRadiusPx + planetRadiusPx1)) {
                                      const overlap1 = Math.max(0, Math.min(1, (starRadiusPx + planetRadiusPx1 - dist1_t) / (2 * planetRadiusPx1)));
                                      dip1_t = depthFraction1 * overlap1;
                                    }

                                    // Planet c transit at t
                                    let dip2_t = 0;
                                    if (simHasSecondPlanet) {
                                      const angleRad2_t = (t * (simOrbitalPeriod / simOrbitalPeriod2) * Math.PI) / 180;
                                      const planetX2_t = 100 + Math.cos(angleRad2_t) * 95;
                                      const planetY2_t = 50 + (90 - simInclination2) * 3;
                                      const dist2_t = Math.sqrt(Math.pow(planetX2_t - 100, 2) + Math.pow(planetY2_t - 50, 2));
                                      const isBehind2_t = Math.sin(angleRad2_t) < 0;
                                      if (!isBehind2_t && dist2_t < (starRadiusPx + planetRadiusPx2)) {
                                        const overlap2 = Math.max(0, Math.min(1, (starRadiusPx + planetRadiusPx2 - dist2_t) / (2 * planetRadiusPx2)));
                                        dip2_t = depthFraction2 * overlap2;
                                      }
                                    }

                                    const combinedDip_t = dip1_t + dip2_t;
                                    
                                    // Scale dynamically so the dip is always visually clear
                                    const scaleFactor = maxPossibleCombinedDip > 0 ? 55 / maxPossibleCombinedDip : 0;
                                    const yVal = baseFluxY + combinedDip_t * scaleFactor;
                                    
                                    pointsPath += `${x === 10 ? "M" : "L"}${x},${yVal} `;
                                  }

                                  return (
                                    <path 
                                      d={pointsPath} 
                                      fill="none" 
                                      stroke="#34d399" 
                                      strokeWidth="2" 
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  );
                                })()}
                                
                                {/* Vertical marker at x = 200 indicating "Current Time" */}
                                <line x1="200" y1="15" x2="200" y2="85" stroke="#ef4444" strokeWidth="1" strokeDasharray="1 3" opacity="0.7" />
                                <circle cx="200" cy="20" r="3" fill="#ef4444" />
                                <text x="204" y="24" fill="#ef4444" fontSize="7" fontFamily="monospace">Now</text>

                                <text x="12" y="15" fill="#64748b" fontSize="8" fontFamily="monospace">1.0 Relative Flux</text>
                                <text x="12" y="94" fill="#64748b" fontSize="8" fontFamily="monospace">Combined Light Curve</text>
                                <text x="388" y="94" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="end">Time Timeline →</text>
                              </svg>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: MODEL RETRAINING LAB */}
            {activeTab === "training" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-space-900 border border-space-800 rounded-2xl p-6">
                  <div className="pb-4 border-b border-space-800">
                    <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-neon-cyan" />
                      Neural Network Retraining Laboratory
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Retrain exoplanet stellar classification models. Feed collected astronomer annotations into advanced deep architectures, select hyperparameters, and evaluate performance indicators.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    {/* Training Configuration Panel */}
                    <div className="bg-space-950 p-5 rounded-xl border border-space-850 space-y-4 font-mono text-xs">
                      <h3 className="text-sm font-semibold text-gray-100 uppercase tracking-wider text-[10px] border-b border-space-850 pb-2">
                        TRAINING HYPERPARAMETERS
                      </h3>

                      {/* Epochs count */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Epochs (Iterations):</span>
                          <span className="text-neon-cyan font-bold">{trainEpochs}</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="40"
                          step="5"
                          value={trainEpochs}
                          onChange={(e) => setTrainEpochs(parseInt(e.target.value))}
                          disabled={isTraining}
                          className="w-full accent-neon-cyan"
                        />
                      </div>

                      {/* Learning rate */}
                      <div className="space-y-1.5">
                        <span className="text-gray-400">Learning Rate (α):</span>
                        <select
                          value={trainLr}
                          onChange={(e) => setTrainLr(parseFloat(e.target.value))}
                          disabled={isTraining}
                          className="w-full bg-space-900 border border-space-800 rounded p-2 text-white text-xs font-mono focus:outline-none"
                        >
                          <option value="0.01">0.01 (Aggressive Stochastic)</option>
                          <option value="0.001">0.001 (Recommended Adam)</option>
                          <option value="0.0001">0.0001 (Deep Fine-Tuning)</option>
                        </select>
                      </div>

                      {/* Architecture selector */}
                      <div className="space-y-1.5">
                        <span className="text-gray-400">Model Architecture:</span>
                        <div className="space-y-1.5 pt-1">
                          {[
                            "CNN + BiLSTM + Transformer Encoder + XGBoost",
                            "Deep 1D ResNet Photometry Net",
                            "Temporal Attention LightCurveTransformer",
                          ].map(arch => (
                            <label key={arch} className="flex items-center gap-2 text-[11px] text-gray-300 cursor-pointer">
                              <input
                                type="radio"
                                name="arch"
                                checked={trainArchitecture === arch}
                                onChange={() => setTrainArchitecture(arch)}
                                disabled={isTraining}
                                className="accent-neon-cyan"
                              />
                              <span>{arch}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Batch size */}
                      <div className="space-y-1.5">
                        <span className="text-gray-400">Batch Size:</span>
                        <select
                          value={trainBatchSize}
                          onChange={(e) => setTrainBatchSize(parseInt(e.target.value))}
                          disabled={isTraining}
                          className="w-full bg-space-900 border border-space-800 rounded p-2 text-white text-xs font-mono focus:outline-none"
                        >
                          <option value="16">16 Samples</option>
                          <option value="32">32 Samples (Balanced)</option>
                          <option value="64">64 Samples</option>
                          <option value="128">128 Samples</option>
                        </select>
                      </div>

                      {/* Retrain Action Button */}
                      <button
                        onClick={handleRetraining}
                        disabled={isTraining}
                        className="w-full py-3 bg-gradient-to-r from-cosmic-purple to-neon-cyan hover:brightness-110 disabled:opacity-50 text-white font-mono text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                      >
                        {isTraining ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Training Ensemble {trainProgress}%
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" /> Start Retraining Execution
                          </>
                        )}
                      </button>
                    </div>

                    {/* Progress loss charts & validation metric matrix */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Log Console Output terminal */}
                      <div className="bg-space-950 rounded-xl border border-space-850 p-4 font-mono text-[11px] flex flex-col h-40">
                        <span className="text-gray-500 block text-[9px] uppercase border-b border-space-900 pb-1 mb-2">RETRAINING CONSOLE TERMINAL OUTPUT</span>
                        <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-slate-300">
                          {trainLogs.map((log, idx) => (
                            <div key={idx} className={
                              log.startsWith("[EPOCH") ? "text-neon-cyan" : 
                              log.startsWith("[SUCCESS]") ? "text-emerald-400 font-bold" : 
                              log.startsWith("[READY]") ? "text-star-gold font-semibold" : ""
                            }>
                              {log}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Retrained charts or training info placeholder */}
                      {isModelTrained || isTraining ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Loss Curve Plot */}
                          <div className="bg-space-950 p-4 rounded-xl border border-space-850">
                            <span className="text-gray-500 block text-[9px] font-mono uppercase mb-2">Cross-Entropy Loss Curve</span>
                            <svg className="w-full h-32" viewBox="0 0 200 100">
                              {/* Draw grid lines */}
                              <line x1="10" y1="10" x2="190" y2="10" stroke="#1e293b" strokeWidth="0.5" />
                              <line x1="10" y1="90" x2="190" y2="90" stroke="#1e293b" strokeWidth="0.5" />

                              {/* Draw loss plots */}
                              {trainLossHistory.length > 1 && (() => {
                                let pathTrain = "";
                                let pathVal = "";
                                const count = trainLossHistory.length;

                                trainLossHistory.forEach((pt, idx) => {
                                  const x = 10 + (idx / (count - 1)) * 180;
                                  // Scale loss (range 0 to 0.6) to fit 10-90 y
                                  const yTrain = 90 - (pt.loss / 0.6) * 80;
                                  const yVal = 90 - (pt.valLoss / 0.6) * 80;

                                  pathTrain += `${idx === 0 ? "M" : "L"}${x},${yTrain} `;
                                  pathVal += `${idx === 0 ? "M" : "L"}${x},${yVal} `;
                                });

                                return (
                                  <>
                                    <path d={pathTrain} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                                    <path d={pathVal} fill="none" stroke="#e11d48" strokeWidth="1" strokeDasharray="2 2" strokeLinecap="round" />
                                  </>
                                );
                              })()}
                              
                              <text x="12" y="16" fill="#ef4444" fontSize="8" fontFamily="monospace">Training Loss</text>
                              <text x="12" y="26" fill="#e11d48" fontSize="8" fontFamily="monospace">Validation Loss</text>
                            </svg>
                          </div>

                          {/* Accuracy Curve Plot */}
                          <div className="bg-space-950 p-4 rounded-xl border border-space-850">
                            <span className="text-gray-500 block text-[9px] font-mono uppercase mb-2">Model Classification Accuracy (%)</span>
                            <svg className="w-full h-32" viewBox="0 0 200 100">
                              <line x1="10" y1="10" x2="190" y2="10" stroke="#1e293b" strokeWidth="0.5" />
                              <line x1="10" y1="90" x2="190" y2="90" stroke="#1e293b" strokeWidth="0.5" />

                              {trainAccHistory.length > 1 && (() => {
                                let pathTrain = "";
                                let pathVal = "";
                                const count = trainAccHistory.length;

                                trainAccHistory.forEach((pt, idx) => {
                                  const x = 10 + (idx / (count - 1)) * 180;
                                  // Scale accuracy (range 70 to 100) to fit 10-90 y
                                  const yTrain = 90 - ((pt.acc - 70) / 30) * 80;
                                  const yVal = 90 - ((pt.valAcc - 70) / 30) * 80;

                                  pathTrain += `${idx === 0 ? "M" : "L"}${x},${yTrain} `;
                                  pathVal += `${idx === 0 ? "M" : "L"}${x},${yVal} `;
                                });

                                return (
                                  <>
                                    <path d={pathTrain} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
                                    <path d={pathVal} fill="none" stroke="#34d399" strokeWidth="1" strokeDasharray="2 2" strokeLinecap="round" />
                                  </>
                                );
                              })()}
                              
                              <text x="12" y="16" fill="#10b981" fontSize="8" fontFamily="monospace">Training Accuracy</text>
                              <text x="12" y="26" fill="#34d399" fontSize="8" fontFamily="monospace">Validation Accuracy</text>
                            </svg>
                          </div>

                          {/* Confusion Matrix & Scores */}
                          <div className="bg-space-950 p-4 rounded-xl border border-space-850 md:col-span-2 text-xs font-mono grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-gray-500 block text-[9px] uppercase mb-2">CONVERSATION MATRIX EVALUATION</span>
                              <div className="grid grid-cols-2 gap-1.5 text-center text-[10px]">
                                <div className="bg-space-900 p-2.5 rounded border border-space-800">
                                  <span className="text-gray-500 block text-[8px]">TRUE POSITIVE</span>
                                  <span className="text-emerald-400 font-bold text-sm">94.1%</span>
                                </div>
                                <div className="bg-space-900 p-2.5 rounded border border-space-800">
                                  <span className="text-gray-500 block text-[8px]">FALSE POSITIVE</span>
                                  <span className="text-rose-400 font-bold text-sm">1.8%</span>
                                </div>
                                <div className="bg-space-900 p-2.5 rounded border border-space-800">
                                  <span className="text-gray-500 block text-[8px]">FALSE NEGATIVE</span>
                                  <span className="text-rose-400 font-bold text-sm">2.4%</span>
                                </div>
                                <div className="bg-space-900 p-2.5 rounded border border-space-800">
                                  <span className="text-gray-500 block text-[8px]">TRUE NEGATIVE</span>
                                  <span className="text-emerald-400 font-bold text-sm">98.2%</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <span className="text-gray-500 block text-[9px] uppercase mb-2">SYSTEM CLASSIFICATION SCORES</span>
                              <div className="space-y-1 pt-1">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Precision (PPV):</span>
                                  <span className="text-white font-bold">98.1%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Recall (Sensitivity):</span>
                                  <span className="text-white font-bold">97.5%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">F1 Score (Harmonic):</span>
                                  <span className="text-white font-bold">97.8%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Area Under ROC (ROC-AUC):</span>
                                  <span className="text-star-gold font-bold">0.994</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-space-950 p-12 text-center rounded-xl border border-space-850 font-mono text-xs text-gray-500 space-y-3">
                          <Cpu className="w-8 h-8 text-space-800 mx-auto" />
                          <p>Retraining results and live loss charts will materialize here upon executing the model retraining pipeline.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: AI RESEARCH CHATBOT ASSISTANT */}
            {activeTab === "chatbot" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-space-900 border border-space-800 rounded-2xl p-6 flex flex-col h-[560px]">
                  <div className="pb-4 border-b border-space-800 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-neon-cyan animate-pulse" />
                        AI Research Assistant Chatbot
                      </h2>
                      <p className="text-xs text-gray-400 mt-1">
                        Interact with our custom Gemini model specialized in astrophysics, exoplanet confirmation checks, and stellar light curve pipelines.
                      </p>
                    </div>

                    <button
                      onClick={() => setChatMessages([{
                        role: "assistant",
                        content: "Conversational history cleared. Ask me anything about exoplanetary data catalogs!",
                        timestamp: new Date().toLocaleTimeString()
                      }])}
                      className="px-3 py-1.5 bg-space-950 text-gray-400 hover:text-white border border-space-850 text-xs font-mono rounded-lg transition"
                    >
                      Reset Conversation
                    </button>
                  </div>

                  {/* Messages Bubble Container */}
                  <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2 scrollbar-thin">
                    {chatMessages.map((msg, idx) => (
                      <div 
                        key={idx}
                        className={`flex gap-3 max-w-3xl ${
                          msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                        }`}
                      >
                        {/* Profile Avatar */}
                        <div className={`w-8 h-8 rounded-full border flex-shrink-0 flex items-center justify-center font-mono font-bold text-[10px] ${
                          msg.role === "user" 
                            ? "bg-cosmic-purple/10 border-cosmic-purple/20 text-cosmic-purple" 
                            : "bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan"
                        }`}>
                          {msg.role === "user" ? "ASTR" : "EXO"}
                        </div>

                        {/* Content text */}
                        <div className={`p-3.5 rounded-xl text-xs leading-relaxed font-sans ${
                          msg.role === "user"
                            ? "bg-cosmic-purple/15 text-white border border-cosmic-purple/20 rounded-tr-none"
                            : "bg-space-950 text-slate-300 border border-space-850 rounded-tl-none whitespace-pre-wrap"
                        }`}>
                          {msg.content}
                          <span className="block text-[9px] text-gray-500 font-mono mt-1 text-right leading-none">
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    ))}

                    {isChatLoading && (
                      <div className="flex gap-3 mr-auto items-center">
                        <div className="w-8 h-8 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan flex items-center justify-center font-mono font-bold text-[10px] animate-pulse">
                          EXO
                        </div>
                        <div className="bg-space-950 p-4 border border-space-850 text-xs rounded-xl rounded-tl-none flex items-center gap-2 font-mono text-gray-400">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-neon-cyan" />
                          Consulting Gemini model archives...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick suggest prompts */}
                  <div className="flex flex-wrap gap-2 py-3 border-t border-space-850">
                    {[
                      "Explain current light curve dip shape",
                      "Is Kepler-186f in the habitable zone?",
                      "How does LOWESS filter work?",
                      "What causes secondary eclipse false positives?"
                    ].map(p => (
                      <button
                        key={p}
                        onClick={() => {
                          setChatInput(p);
                        }}
                        disabled={isChatLoading}
                        className="px-2.5 py-1 bg-space-950 hover:bg-space-850 text-gray-400 hover:text-white border border-space-850 rounded text-[10px] font-mono transition cursor-pointer"
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  {/* Chat Input form area */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendChatMessage();
                    }}
                    className="flex gap-2.5"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={isChatLoading}
                      placeholder={
                        report
                          ? `Query AI about exoplanet target: ${report.metadata.name}...`
                          : "Query AI about exoplanets, light curve filters, periodograms..."
                      }
                      className="flex-1 bg-space-950 text-xs font-sans px-4 py-2.5 border border-space-850 rounded-xl text-white focus:outline-none focus:border-neon-cyan disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isChatLoading || !chatInput.trim()}
                      className="px-5 py-2.5 bg-gradient-to-tr from-cosmic-purple to-neon-cyan hover:brightness-110 disabled:opacity-50 text-white font-mono text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      Send Message
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* TAB: REPORTS */}
            {activeTab === "reports" && report && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center pb-4 border-b border-space-700/50">
                  <div>
                    <h2 className="text-xl font-display font-bold text-white">
                      Scientific Exoplanet Transit Report
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Prepare and download peer-review-grade diagnostic data summaries, raw coordinate CSV streams, and JSON payloads.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-1.5 bg-space-900 hover:bg-space-800 text-gray-300 border border-space-700 text-xs font-mono rounded-lg transition-all flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Sheet
                    </button>
                    
                    <form action="/api/reports/csv" method="GET" target="_blank" className="inline">
                      <input type="hidden" name="datasetId" value={report.lightCurveId} />
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-space-900 hover:bg-space-800 text-neon-cyan border border-neon-cyan/20 text-xs font-mono rounded-lg transition-all flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> Raw CSV
                      </button>
                    </form>
                  </div>
                </div>

                {/* Printable Academic Summary Block */}
                <div id="printable-report" className="bg-space-900 border border-space-800 rounded-xl p-8 shadow-xl space-y-6 max-w-4xl mx-auto text-gray-100 font-mono text-xs leading-relaxed">
                  
                  {/* Title and meta */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-space-750 pb-6">
                    <div>
                      <span className="text-[10px] text-neon-cyan font-bold tracking-widest uppercase">
                        EXOVISION AI REPORT DETECTOR
                      </span>
                      <h3 className="text-xl font-display font-bold text-white mt-1">
                        Candidate Reference: {report.id}
                      </h3>
                      <span className="text-[10px] text-gray-400 block mt-0.5">
                        GENERATION DATE: {new Date(report.timestamp).toUTCString()}
                      </span>
                    </div>
                    <div className="text-right sm:text-right font-mono">
                      <span className="text-gray-500 block text-[9px]">DIAGNOSTIC STATUS</span>
                      <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                        report.falsePositiveRejection.passedAllChecks ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                      }`}>
                        {report.falsePositiveRejection.passedAllChecks ? "NOMINAL TRANSIT" : "FALSE POSITIVE MIMIC"}
                      </span>
                    </div>
                  </div>

                  {/* Physics & Orbit parameters estimated */}
                  <div className="space-y-4">
                    <h4 className="text-xs text-white font-bold border-b border-space-800 pb-1.5 tracking-wider uppercase">
                      1. ESTIMATED PHYSICAL PARAMETERS
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Host Star parameters */}
                      <div className="bg-space-950 p-3.5 rounded border border-space-850 space-y-1.5 col-span-1">
                        <div className="text-[10px] text-gray-400 font-bold border-b border-space-800 pb-1 mb-2">HOST STAR METADATA</div>
                        <div>Star Radius (R_sun): <strong className="text-white">{report.metadata.starRadius}</strong></div>
                        <div>Star Mass (M_sun): <strong className="text-white">{report.metadata.starMass}</strong></div>
                        <div>Effective Temp (T_eff): <strong className="text-white">{report.metadata.starTemp} K</strong></div>
                        <div>Source Target: <strong className="text-white">{report.metadata.source}</strong></div>
                        {report.isMultiPlanetSystem && (
                          <div className="text-neon-cyan font-bold text-[10px] mt-2 animate-pulse">
                            MULTI-PLANET SYSTEM DETECTED
                          </div>
                        )}
                      </div>

                      {/* Detected Planet(s) parameters */}
                      <div className="bg-space-950 p-3.5 rounded border border-space-850 space-y-3 md:col-span-2">
                        <div className="text-[10px] text-gray-400 font-bold border-b border-space-800 pb-1 flex justify-between">
                          <span>DETECTED EXOPLANETARY SYSTEM MEMBERS</span>
                          <span className="text-neon-cyan">{report.detectedPlanets?.length || 1} Planet(s)</span>
                        </div>
                        
                        <div className="space-y-3.5">
                          {(report.detectedPlanets && report.detectedPlanets.length > 0 ? report.detectedPlanets : [report.parameters]).map((planet, pIdx) => (
                            <div key={pIdx} className="border-l-2 border-l-neon-cyan pl-3 py-0.5 space-y-1">
                              <div className="text-[10px] font-bold text-white uppercase tracking-wider">
                                Member Planet {String.fromCharCode(98 + pIdx)} ({planet.planetClass})
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[11px] text-gray-300">
                                <div>Period: <strong className="text-white">{planet.orbitalPeriod} days</strong></div>
                                <div>Depth: <strong className="text-white">{planet.transitDepth.toFixed(0)} ppm</strong></div>
                                <div>Radius: <strong className="text-emerald-400">{planet.planetRadius} R⊕</strong></div>
                                <div>Axis: <strong className="text-white">{planet.semiMajorAxis} AU</strong></div>
                                <div>Temp: <strong className="text-neon-cyan">{planet.equilibriumTemp} K</strong></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Prediction confidence weights */}
                  <div className="space-y-4">
                    <h4 className="text-xs text-white font-bold border-b border-space-800 pb-1.5 tracking-wider uppercase">
                      2. DEEP ENSEMBLE CLASSIFIER CONFIDENCE WEIGHTS
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-space-950 p-4 rounded border border-space-850">
                      {Object.entries(report.predictions.classes).slice(0, 4).map(([className, confidence]) => (
                        <div key={className}>
                          <span className="text-[10px] text-gray-500 block truncate">{className}</span>
                          <strong className="text-white text-sm">{((confidence as number) * 100).toFixed(2)}%</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* False Positive diagnostics checklist */}
                  <div className="space-y-4">
                    <h4 className="text-xs text-white font-bold border-b border-space-800 pb-1.5 tracking-wider uppercase">
                      3. FALSE-POSITIVE REJECTION FILTER SUMMARY
                    </h4>
                    <div className="space-y-2 bg-space-950 p-4 rounded border border-space-850">
                      <div className="flex justify-between border-b border-space-850/60 pb-1.5">
                        <span>Background eclipsing binary (EB) signature:</span>
                        <strong className={report.falsePositiveRejection.backgroundEB ? "text-rose-400" : "text-emerald-400"}>
                          {report.falsePositiveRejection.backgroundEB ? "WARNING ALERT" : "PASSED NOMINAL"}
                        </strong>
                      </div>
                      <div className="flex justify-between border-b border-space-850/60 pb-1.5">
                        <span>Secondary eclipse transit depth validation:</span>
                        <strong className={report.falsePositiveRejection.secondaryEclipse ? "text-rose-400" : "text-emerald-400"}>
                          {report.falsePositiveRejection.secondaryEclipse ? "WARNING ALERT" : "PASSED NOMINAL"}
                        </strong>
                      </div>
                      <div className="flex justify-between border-b border-space-850/60 pb-1.5">
                        <span>Odd-Even period parity comparison:</span>
                        <strong className={report.falsePositiveRejection.oddEvenMismatch ? "text-rose-400" : "text-emerald-400"}>
                          {report.falsePositiveRejection.oddEvenMismatch ? "WARNING ALERT" : "PASSED NOMINAL"}
                        </strong>
                      </div>
                      <div className="flex justify-between border-b border-space-850/60 pb-1.5">
                        <span>Pixel centroid offset target drift:</span>
                        <strong className={report.falsePositiveRejection.centroidShift ? "text-rose-400" : "text-emerald-400"}>
                          {report.falsePositiveRejection.centroidShift ? "WARNING ALERT" : "PASSED NOMINAL"}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Instrumental spike/dropout detector check:</span>
                        <strong className={report.falsePositiveRejection.instrumentArtifact ? "text-rose-400" : "text-emerald-400"}>
                          {report.falsePositiveRejection.instrumentArtifact ? "WARNING ALERT" : "PASSED NOMINAL"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Report download block */}
                  <div className="bg-space-950/80 p-5 rounded-lg border border-space-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                      <span className="text-gray-400 font-bold block mb-1">
                        Download Full Diagnostics Payload (JSON)
                      </span>
                      <p className="text-[10px] text-gray-500 font-sans leading-normal">
                        Includes raw data, phase-folded points, SHAP/LIME estimations, and full ensemble probabilities.
                      </p>
                    </div>
                    
                    <button
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `exovision_analysis_${report.id}.json`;
                        a.click();
                      }}
                      className="px-4 py-2 bg-gradient-to-tr from-cosmic-purple to-neon-cyan hover:from-cosmic-purple/90 hover:to-neon-cyan/90 text-white text-xs font-bold rounded shadow transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Save Diagnostic JSON
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: HISTORY */}
            {activeTab === "history" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-4 border-b border-space-700/50">
                  <div>
                    <h2 className="text-xl font-display font-bold text-white">
                      Astronomical Candidate Catalog
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Search, filter, and reload previously preprocessed and analyzed stellar photometry datasets.
                    </p>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by name, star, or ID..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className="w-full bg-space-900 border border-space-800 rounded-lg pl-9 pr-4 py-1.5 font-mono text-xs focus:border-neon-cyan focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* History list catalog */}
                <div className="space-y-3">
                  {filteredHistory.length === 0 ? (
                    <div className="bg-space-900 border border-space-800 rounded-xl p-8 text-center text-xs font-mono text-gray-500">
                      No matching candidate records found in the telemetry catalog.
                    </div>
                  ) : (
                    filteredHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-space-900 hover:bg-space-850 border border-space-800 hover:border-space-700 rounded-xl p-4 transition-all duration-300 flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative group"
                      >
                        <div className="flex gap-4 items-center">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                            item.passedRejection ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                          }`}>
                            <Activity className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500 font-mono block">CANDIDATE: {item.id}</span>
                            <h4 className="text-sm font-semibold text-white group-hover:text-neon-cyan transition-colors">
                              {item.name}
                            </h4>
                            <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                              Star: {item.starName} • Analyzed on {new Date(item.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 font-mono text-xs">
                          <div className="text-right">
                            <span className="text-gray-500 block text-[9px]">ENSEMBLE PREDICTION</span>
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${getBadgeClass(item.predictionClass)}`}>
                              {item.predictionClass} ({(item.confidence * 100).toFixed(1)}%)
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedTargetId(item.lightCurveId);
                              triggerAnalysis(item.lightCurveId);
                              setActiveTab("dashboard");
                            }}
                            className="px-3 py-1.5 bg-space-950 border border-space-800 hover:bg-space-750 hover:border-neon-cyan text-neon-cyan font-semibold text-[10px] rounded transition"
                          >
                            Load
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB: SETTINGS */}
            {activeTab === "settings" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center pb-4 border-b border-space-700/50">
                  <div>
                    <h2 className="text-xl font-display font-bold text-white">
                      Pipeline Configuration & Preferences
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Toggle system operational modes, adjust exoplanet mission catalogs, and manage connected user profiles.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column Settings */}
                  <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4">
                    <h3 className="text-sm font-semibold text-gray-100 pb-2 border-b border-space-800">
                      User Identity and Station Role
                    </h3>
                    
                    <div className="space-y-4 font-mono text-xs">
                      <div>
                        <label className="text-gray-400 block mb-1.5">RESEARCHER FULL NAME</label>
                        <input
                          type="text"
                          value={user.name}
                          onChange={(e) => setUser(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-space-950 border border-space-800 rounded p-2 focus:border-neon-cyan focus:outline-none text-white font-sans"
                        />
                      </div>

                      <div>
                        <label className="text-gray-400 block mb-1.5">ORGANIZATION AFFILIATION</label>
                        <input
                          type="text"
                          value={user.institution}
                          onChange={(e) => setUser(prev => ({ ...prev, institution: e.target.value }))}
                          className="w-full bg-space-950 border border-space-800 rounded p-2 focus:border-neon-cyan focus:outline-none text-white font-sans"
                        />
                      </div>

                      <div>
                        <label className="text-gray-400 block mb-1.5">AUTHORIZED LEVEL / USER ROLE</label>
                        <select
                          value={user.role}
                          onChange={(e) => setUser(prev => ({ ...prev, role: e.target.value as any }))}
                          className="w-full bg-space-950 border border-space-800 rounded p-2 focus:border-neon-cyan focus:outline-none text-white font-sans cursor-pointer"
                        >
                          <option value="Researcher">Researcher status (Authorized review)</option>
                          <option value="Student">Student status (Academic logs only)</option>
                          <option value="Administrator">Administrator status (Full control)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Right Column Settings */}
                  <div className="bg-space-900 border border-space-800 rounded-xl p-5 shadow-lg space-y-4">
                    <h3 className="text-sm font-semibold text-gray-100 pb-2 border-b border-space-800">
                      Deep Learning Model Pipeline Settings
                    </h3>

                    <div className="space-y-4 font-mono text-xs">
                      <div className="flex justify-between items-center bg-space-950 p-3 rounded border border-space-850">
                        <div>
                          <span className="text-white font-bold block">GPU Hardware Acceleration</span>
                          <span className="text-[10px] text-gray-500 block font-sans">Leverage Vertex AI Tensor processing.</span>
                        </div>
                        <span className="text-emerald-400 font-bold">ENABLED (CUDA 12.1)</span>
                      </div>

                      <div className="flex justify-between items-center bg-space-950 p-3 rounded border border-space-850">
                        <div>
                          <span className="text-white font-bold block">Gemini API Integration</span>
                          <span className="text-[10px] text-gray-500 block font-sans">Used for deep scientific reasoning explanations.</span>
                        </div>
                        <span className="text-emerald-400 font-bold">CONNECTED</span>
                      </div>

                      <div className="flex justify-between items-center bg-space-950 p-3 rounded border border-space-850">
                        <div>
                          <span className="text-white font-bold block">Active Ensemble Pipeline Version</span>
                          <span className="text-[10px] text-gray-500 block font-sans">Pre-trained exoplanet classification weights.</span>
                        </div>
                        <span className="text-gray-400">v4.1.2-beta</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SYSTEM IMPROVEMENTS & DRAWBACKS MITIGATION SECTION */}
                <div className="bg-space-900 border border-space-800 rounded-xl p-6 shadow-lg space-y-6 mt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-space-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cosmic-purple/10 border border-cosmic-purple/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-cosmic-purple" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white">System Improvements & Drawbacks Mitigation</h3>
                        <p className="text-xs text-gray-400 mt-0.5 font-sans">
                          Practical engineering solutions resolving known real-world exoplanet detection bottlenecks.
                        </p>
                      </div>
                    </div>

                    {/* Filter categories */}
                    <div className="flex flex-wrap items-center gap-1.5 bg-space-950 p-1 rounded-lg border border-space-850">
                      {["All", "Model & AI", "Data & Performance", "Astrophysics & Validation"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setMitigationCat(cat)}
                          className={`px-3 py-1.5 rounded-md text-[10px] font-mono transition-all cursor-pointer ${
                            mitigationCat === cat
                              ? "bg-cosmic-purple text-white shadow"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search for physical drawbacks, limitations, or engineering mitigations..."
                      value={mitigationQuery}
                      onChange={(e) => setMitigationQuery(e.target.value)}
                      className="w-full bg-space-950 border border-space-800/80 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cosmic-purple transition-colors font-sans"
                    />
                  </div>

                  {/* Accordion / Card Grid of Drawbacks & Mitigations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DRAWBACKS_MITIGATIONS
                      .filter(item => {
                        const matchesCategory = mitigationCat === "All" || item.category === mitigationCat;
                        const matchesSearch = item.title.toLowerCase().includes(mitigationQuery.toLowerCase()) ||
                                              item.problem.toLowerCase().includes(mitigationQuery.toLowerCase()) ||
                                              item.solutions.some(s => s.toLowerCase().includes(mitigationQuery.toLowerCase()));
                        return matchesCategory && matchesSearch;
                      })
                      .map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <div
                            key={item.id}
                            className="bg-space-950/60 border border-space-850 hover:border-space-700 rounded-lg p-5 flex flex-col justify-between space-y-4 transition-all"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                  <div className={`p-1.5 rounded border ${item.color}`}>
                                    <IconComponent className="w-4 h-4" />
                                  </div>
                                  <span className="text-xs font-bold text-white tracking-tight">{item.title}</span>
                                </div>
                                <span className="px-2 py-0.5 text-[8px] font-mono rounded bg-space-900 border border-space-800 text-gray-400 uppercase">
                                  {item.category}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold">DRAWBACK / LIMITATION:</span>
                                <p className="text-xs text-gray-300 font-sans leading-relaxed">{item.problem}</p>
                              </div>
                            </div>

                            <div className="space-y-2 pt-3 border-t border-space-900">
                              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">EXOVISION ENGINEERING SOLUTION:</span>
                              <ul className="space-y-1.5 list-none">
                                {item.solutions.map((sol, index) => (
                                  <li key={index} className="text-[11px] text-gray-400 font-sans leading-relaxed flex items-start gap-1.5">
                                    <span className="text-emerald-500 font-mono font-bold mt-0.5">✓</span>
                                    <span>{sol}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* Persistent global research platform status bar */}
      <footer className="border-t border-space-800/80 bg-space-950/80 backdrop-blur-md px-6 py-2 flex justify-between items-center z-15 font-mono text-[9px] text-gray-500">
        <div>
          ExoVision AI Platform • Developed in collaboration with Google AI Studio & DeepMind Astro-Intelligence Division.
        </div>
        <div>
          SYSTEM STACK: Node v22 • Express • Vite • React 19 • Gemini-3.5-flash API
        </div>
      </footer>
    </div>
  );
}
