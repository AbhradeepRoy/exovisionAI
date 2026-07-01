# ExoVision AI – System Architecture & Project Specification

An expert AI-powered exoplanet transit detection system designed to analyze noisy stellar light curves, extract periodic signals, perform deep learning ensemble classification, and run astrophysical validation checks to distinguish exoplanetary transits from astrophysical false positives.

---

## 1. System Overview & Core Philosophy

ExoVision AI is built as a scientific, research-grade pipeline capable of processing large-scale photometric datasets (such as NASA Kepler, K2, and TESS). Rather than relying on simple heuristics, ExoVision AI integrates a hybrid approach:
- **Classical Astrophysics Algorithms**: Automated Box-Least-Squares (BLS) periodograms, phase folding, and stellar parameter correlation.
- **Deep Learning Ensembles**: Time-series convolutional networks, sequential memory layers, and self-attention mechanisms.
- **Explainable AI (XAI)**: Visualizing temporal attribution and giving human-readable reasoning for detection results.

---

## 2. Platform Architecture

```
                                  [ Stellar Photometry Input ]
                                       (FITS / CSV format)
                                                │
                                                ▼
                                    [ Preprocessing Engine ]
                             SG Filters, Outlier Sigma-Clipping
                                                │
                                                ▼
                                   [ Periodic Signal Search ]
                                  Box-Least-Squares (BLS)
                                                │
                                                ▼
                                    [ Phase-Folding & Grid ]
                                                │
                          ┌─────────────────────┴─────────────────────┐
                          ▼                                           ▼
             [ Deep Learning Ensemble ]                  [ Stellar & Transit Parameters ]
         CNN + BiLSTM + Transformer Encoder                 Star/Planet radii, period, etc.
                          │                                           │
                          └─────────────────────┬─────────────────────┘
                                                ▼
                                    [ XGBoost Meta-Classifier ]
                                                │
                                                ▼
                                   [ False-Positive Rejection ]
                             Odd-Even depth, Centroid, Secondary Eclipses
                                                │
                                                ▼
                                   [ Explainable AI & Reports ]
                               SHAP, Attention maps, PDF/CSV Reports
```

### Frontend Module
- **Tech Stack**: React 18+, Vite, Tailwind CSS, Lucide icons, Framer Motion.
- **Interactive Visualizers**:
  - Light Curve Explorer (phase-folded vs. raw flux).
  - Diagnostics Hub (orbital trajectory model, noise residual charts).
  - AI Detection UI with floating Signal-to-Noise Ratio (SNR) gauges.
  - Parameter Comparison Panel (Observed vs. Theoretical Transit Depth).

### Backend & AI Inference Services
- **Preprocessing Engine**: Astropy & Lightkurve libraries.
- **Signal Extraction**: Box-Least-Squares (BLS) search, Lomb-Scargle periodograms.
- **Ensemble Inference**:
  1. **1D-CNN**: Extracts spatial/morphological features from individual transit windows.
  2. **BiLSTM**: Models sequence-dependent phase relationships and duration timing.
  3. **Transformer Encoder**: Captures stellar variability and spots using self-attention.
  4. **XGBoost**: Fuses neural features with classical astrophysical parameters to yield a robust probability score.

---

## 3. Core Features & Capabilities

1. **Light Curve Upload & Detrending**: High-pass filtering, robust normalization, and double Savitzky-Golay (SG) noise cancellation.
2. **Interactive Periodogram & Phase-Folding**: Live sliding-phase interpolation to center transit events.
3. **Multi-Planet Diagnostic Hub**: Relativistic orbital trajectory, escape velocity calculation, and Earth reachability/collision severity models.
4. **Signal-to-Noise Ratio (SNR) Quality Assessors**: High-fidelity gauge meters identifying provisional vs. gold-standard candidates with threshold limits.
5. **Observed vs. Theoretical Comparison**: Real-time ratio validation checking stellar radius $R_*$ vs. planet radius $R_p$ to detect grazing eclipsing binaries.
6. **Scientific Reporting**: Dynamic JSON, CSV, and printable report exporter.

---

## 4. System Improvements & Drawbacks Mitigation

This section addresses known real-world engineering bottlenecks and outlines the robust, scalable solutions implemented to make ExoVision AI research-grade and ready for observatory deployment.

### 1. DATA LIMITATION & LABEL SHORTAGE
* **Problem**: Astronomical labeled datasets (planet, binary, variable star, noise) are limited and imbalanced.
* **Solution**:
  - Automatically query NASA Kepler, K2, and TESS public archives using `Astroquery` and Kepler Input Catalog (KIC) endpoints.
  - Implement dynamic synthetic transit injection during preprocessing, simulating physical planetary grazing and occultations into real, unlabelled stellar noise curves.
  - Apply class balancing algorithms including SMOTE on tabular properties and focal loss / weighted binary cross-entropy loss functions during DL model training.
  - Train self-supervised temporal encoders (reconstruction loss) on massive unlabeled light curve sets before fine-tuning on labelled target classes.

### 2. HIGH MODEL COMPLEXITY & COMPUTATIONAL COST
* **Problem**: CNN + BiLSTM + Transformer + XGBoost ensemble may be too heavy for training and inference.
* **Solution**:
  - Adopt a switchable micro-modular inference design (providing a lightweight single CNN-only mode for immediate client-side or CPU previews and an advanced "Research Mode" running the full ensemble).
  - Apply knowledge distillation to condense the heavy deep learning ensemble into a single lightweight, highly optimized student model for rapid pipeline sweeps.
  - Implement tensor caching and compile backend models to ONNX formats for accelerated local and server-side CPU/GPU environments.
  - Utilize mixed-precision training (FP16) on server backends to halve the memory footprint and accelerate training loops on Nvidia CUDA devices.

### 3. SLOW BATCH PROCESSING PERFORMANCE
* **Problem**: Processing thousands of light curves sequentially will be slow.
* **Solution**:
  - Offload long-running sweep schedules to a distributed, asynchronous task queue (Celery backed by Redis or RabbitMQ).
  - Leverage multiprocessing pools and high-throughput data processing engines (Ray/Dask) to run preprocessing and periodograms in parallel across multi-core server nodes.
  - Use mini-batch matrix GPU inference for deep learning modules rather than single-target evaluation.
  - Stream large light curve files in chunk-based pipelines, preventing memory leaks and high-memory usage.
  - Cache intermediate BLS and Lomb-Scargle power spectrum scores in persistent databases to avoid recomputations.

### 4. FALSE POSITIVES (VERY CRITICAL ISSUE)
* **Problem**: Binary stars, starspots, and noise can mimic transit signals.
* **Solution**:
  - Implement a highly-disciplined multi-stage validation pipeline:
    * **Stage 1 (BLS Pre-detection)**: Isolates potential periodic signals.
    * **Stage 2 (ML Classifier)**: Assesses transit morphology and sequential phase shapes.
    * **Stage 3 (Astrophysical Checks)**: Enforces physical constraints including odd-even transit depth consistency, secondary eclipse limits, and starspot activity exclusions.
  - Enforce automated centroid shift checks comparing out-of-transit stellar coordinates with in-transit centers to rule out blended background eclipsing binaries.
  - Require an ensemble voting consensus with strict confidence thresholding and clear "rejection zones" for borderline targets.

### 5. LACK OF EXPLAINABILITY
* **Problem**: Deep learning models act as black boxes, limiting trust in astronomical communities.
* **Solution**:
  - Integrate SHAP (SHapley Additive exPlanations) values to identify global and local tabular feature importances (e.g., impact of period, duration, and star mass).
  - Implement Integrated Gradients to trace time-series temporal attributions, highlighting specific ingress, bottom, and egress datapoints that triggered the transit model.
  - Render self-attention weight heatmaps from the Transformer layers to demonstrate what out-of-transit and in-transit intervals are heavily correlated by the network.
  - Provide human-readable, AI-generated reasoning cards alongside all classifications.

### 6. SCIENTIFIC VALIDATION GAP
* **Problem**: AI prediction alone is not enough for peer-reviewed astronomical discovery.
* **Solution**:
  - Integrate a secondary physical validation layer enforcing classical astrophysical checks:
    * Period-radius consistency and Keplerian orbital distance laws.
    * Transit shape classification (detecting flat-bottomed planetary U-shapes vs. pointed eclipsing binary V-shapes).
    * Core thermal and gravity constraint checks based on host star spectral classes.
  - Incorporate Bayesian uncertainty estimation and Monte Carlo Dropout layers to deliver realistic probability margins (e.g., $94.2\% \pm 1.8\%$).
  - Never mark detections as "Confirmed Planet"—always maintain the scientifically accurate "Candidate Planet" status until peer-reviewed spectroscopy is uploaded.

### 7. DEPENDENCY ON ASTROPHYSICAL PARAMETERS
* **Problem**: Planet radius estimation requires stellar radius and mass, which may not always be available.
* **Solution**:
  - Integrate an automated lookup to the Gaia DR3 catalog via Astroquery to retrieve missing stellar properties (temperature, mass, radius, and parallax).
  - Implement a robust mathematical fallback estimation (using spectral energy distribution models or standard solar-type assumptions) paired with a high-margin uncertainty range when star statistics are missing.
  - Mark outputs clearly as "Estimated from nominal stellar templates" rather than "Measured".

### 8. RESEARCH NOVELTY CHALLENGE
* **Problem**: Many components (BLS, Lightkurve, CNNs) already exist.
* **Solution**:
  - Center novelty on the hybrid fusion of machine learning ensembles with rigid astrophysical heuristics.
  - Deliver interactive, web-accessible time-series attributions (Integrated Gradients) directly to researchers' browsers.
  - Pioneer an end-to-end, dual-mode candidate ranking pipeline with automated centroid shift checks and theoretical transit depth comparison tables.

### 9. OVERCOMPLEX SYSTEM ARCHITECTURE
* **Problem**: Too many features may reduce maintainability and increase bugs.
* **Solution**:
  - Build using a micro-modular framework where preprocessing, period search, neural inference, and reporting are completely decoupled.
  - Establish clear, type-safe API boundaries and contracts (using TypeScript on the frontend and Pydantic models on the backend).
  - Integrate robust feature flags allowing administrators or researchers to toggle resource-intensive modules (like real-time trajectory simulation or massive batch sweeps).

### 10. MODEL EVALUATION & OVERFITTING RISK
* **Problem**: High model complexity may lead to overfitting on specific telescope fields.
* **Solution**:
  - Perform stratified K-fold cross-validation across multiple distinct stellar fields (e.g., training on Kepler Kepler-16 fields and testing on TESS Southern Ecliptic Pole sectors).
  - Apply heavy temporal regularization (Dropout rates of 30-50%, L2 weight decay, and early-stopping criteria based on validation loss).
  - Assess models using robust metrics (Precision-Recall Area Under Curve [PR-AUC], ROC-AUC, and F1-scores) rather than simple accuracy to protect against imbalanced sets.
  - Conduct "Domain Shift" tests on newly published targets from independent sky campaigns.

### 11. REAL-WORLD DEPLOYMENT LIMITATIONS
* **Problem**: High cloud GPU costs and server scaling bottlenecks.
* **Solution**:
  - Containerize the entire web and worker stack using Docker, allowing seamless scaling on Kubernetes or serverless containers (like Google Cloud Run).
  - Configure a dynamic CPU fallback mode for deep learning models, enabling local runs or budget deployments.
  - Streamline assets and model structures using ONNX runtime and WebGL canvas graphs, running local browser-based preview engines whenever possible to offload server compute.
