/**
 * ExoVision AI – Shared TypeScript Interfaces & Types
 */

export interface DataPoint {
  time: number;
  flux: number;
  fluxError: number;
  quality: number; // 0 is good, >0 indicates issues
}

export enum PlanetClass {
  EarthLike = "Earth-like",
  SuperEarth = "Super Earth",
  MiniNeptune = "Mini Neptune",
  GasGiant = "Gas Giant",
}

export enum DetectionClass {
  ExoplanetTransit = "Exoplanet Transit",
  EclipsingBinary = "Eclipsing Binary",
  VariableStar = "Variable Star",
  StarspotActivity = "Starspot Activity",
  DetectorArtifact = "Detector Artifact",
  BlendedSource = "Blended Source",
  UnknownAnomaly = "Unknown Anomaly",
}

export type UserRole = "Researcher" | "Administrator" | "Student";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  institution: string;
}

export interface LightCurveMetadata {
  id: string;
  name: string;
  source: "NASA Kepler" | "TESS" | "User Upload";
  starName: string;
  starRadius: number; // Solar Radii
  starMass: number;   // Solar Masses
  starTemp: number;   // Kelvin
  keplerId?: string;
  tessId?: string;
}

export interface PreprocessingConfig {
  sigmaClipThreshold: number;
  medianFilterWindow: number;
  savitzkyGolayWindow: number;
  lowessFraction: number;
  denoisingMethod: "Wavelet" | "Autoencoder" | "Fourier" | "PCA" | "None";
  normalizationMethod: "Min-Max" | "Z-score" | "Robust";
}

export interface ExtractedFeatures {
  transitDepth: number; // ppm
  transitDuration: number; // hours
  transitPeriod: number; // days
  ingressTime: number; // hours
  egressTime: number; // hours
  snr: number;
  fluxMean: number;
  fluxVariance: number;
  fluxStdDev: number;
  skewness: number;
  kurtosis: number;
  mad: number; // Median Absolute Deviation
  transitSymmetry: number; // 0 to 1
  lombScarglePeaks: Array<{ period: number; power: number }>;
  blsFeatures: {
    bestPeriod: number;
    bestDepth: number;
    bestDuration: number;
    power: number;
  };
}

export interface EstimatedParameters {
  transitDepth: number;      // ppm
  transitDuration: number;   // hours
  orbitalPeriod: number;     // days
  planetRadius: number;      // Earth Radii (R_earth)
  semiMajorAxis: number;     // Astronomical Units (AU)
  equilibriumTemp: number;   // Kelvin (K)
  starRadius: number;        // Solar Radii (R_sun)
  starMass: number;          // Solar Masses (M_sun)
  planetClass: PlanetClass;
}

export interface ExplainableAIOutput {
  shapValues: Record<string, number>; // Feature name -> importance value
  limeExplanations: Array<{ feature: string; impact: number; description: string }>;
  integratedGradients: Array<{ time: number; gradient: number }>; // For highlighting transit regions
  attentionHeatmap: number[]; // Weights for long range temporal dependencies (e.g. 50 grid points)
  decisionReasoning: string;
  reasoningSummary: string;
}

export interface FalsePositiveRejection {
  backgroundEB: boolean;
  backgroundEBConfidence: number;
  secondaryEclipse: boolean;
  secondaryEclipseConfidence: number;
  oddEvenMismatch: boolean;
  oddEvenMismatchConfidence: number;
  centroidShift: boolean;
  centroidShiftConfidence: number;
  instrumentArtifact: boolean;
  instrumentArtifactConfidence: number;
  blendingContamination: boolean;
  blendingContaminationConfidence: number;
  variableStar: boolean;
  variableStarConfidence: number;
  transitInconsistency: boolean;
  transitInconsistencyConfidence: number;
  lowSNR: boolean;
  lowSNRConfidence: number;
  passedAllChecks: boolean;
}

export interface MLPredictions {
  classes: Record<DetectionClass, number>; // Class -> Confidence (0 to 1)
  ensembleVotes: {
    cnn: Record<DetectionClass, number>;
    bilstm: Record<DetectionClass, number>;
    transformer: Record<DetectionClass, number>;
    autoencoder: Record<DetectionClass, number>;
    xgboost: Record<DetectionClass, number>;
  };
}

export interface DetectionReport {
  id: string;
  lightCurveId: string;
  timestamp: string;
  metadata: LightCurveMetadata;
  features: ExtractedFeatures;
  predictions: MLPredictions;
  parameters: EstimatedParameters;
  falsePositiveRejection: FalsePositiveRejection;
  explainableAI: ExplainableAIOutput;
  downloadToken: string;
  isMultiPlanetSystem?: boolean;
  detectedPlanets?: EstimatedParameters[];
  minuteDipDetection?: MinuteDipDetectionResult;
  telescopeCameraErrors?: TelescopeDiagnostics;
  noiseCancellation?: NoiseCancellationResult;
  trajectoryTracing?: ExoplanetTrajectory;
  predictionErrorPercentage?: number;
}

export interface MinuteDipDetectionResult {
  hasMinuteDips: boolean;
  dipsDetectedCount: number;
  averageDipDepthPpm: number;
  shallowestDipDepthPpm: number;
  snrImprovement: number;
  method: string;
}

export interface TelescopeDiagnostics {
  hasErrors: boolean;
  deadPixelsCount: number;
  cosmicRaySpikesCount: number;
  strayLightContaminationLevel: number; // 0 to 1
  sensorDriftPercentage: number;       // 0 to 100
  shutterJitterMs: number;
  hotPixelsCount: number;
  unmaskedFlags: string[];
}

export interface NoiseCancellationResult {
  activeFilters: string[];
  preFilterRmsNoisePpm: number;
  postFilterRpmNoisePpm: number;
  noiseReductionRatio: number;
  powerSpectralDensityReductionDb: number;
}

export interface ExoplanetTrajectory {
  starDistanceLy: number;
  averageOrbitalVelocityKms: number;
  escapeVelocityKms: number;
  interstellarTravelYears: number;
  bindingEnergyIndex: number;
  earthReachabilityChance: number;
  trajectoryPathPoints: Array<{ x: number; y: number; z: number; phase: number }>;
}

export interface SavedHistoryItem {
  id: string;
  lightCurveId: string;
  name: string;
  starName: string;
  timestamp: string;
  predictionClass: DetectionClass;
  confidence: number;
  passedRejection: boolean;
}

export interface BatchQueueItem {
  id: string;
  name: string;
  rawContent: string;
  status: "ingesting" | "pending" | "processing" | "completed" | "failed";
  progress: number;
  report?: DetectionReport;
  error?: string;
  parsedPoints?: DataPoint[];
}
