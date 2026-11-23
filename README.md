# SafeRx AI — Intelligent Healthcare & Clinical Prescription Safety

> **Live Deployment:** [https://uftb-saferx-ai.vercel.app](https://uftb-saferx-ai.vercel.app)  
> **Course:** Software Engineering, Testing and Quality Assurance Lab (`ICT 4458`)  
> **Institution:** University of Frontier Technology, Bangladesh (UFTB)  
> **Author:** Rayhanul Islam

---

## Disclaimer

SafeRx AI is an **educational software engineering and clinical safety simulation project**. It does **not** provide licensed medical advice and must **not** be used for real-world clinical decision-making.

---

## Overview

SafeRx AI transforms the modular Python `ICT 4458` medication safety checker into a production-deployed, interactive web platform featuring:

- **Multi-Drug Interaction & Prescription Safety Engine:** Screens 16 real clinical medications (Warfarin, Aspirin, Ibuprofen, Clopidogrel, Metformin, Lisinopril, Atorvastatin, Omeprazole, Amoxicillin, Ciprofloxacin, Paracetamol, Digoxin, Amlodipine, Azithromycin, Sertraline, Amiodarone) across 20+ clinical drug-drug interaction rules with mechanism, management advice, and safer alternatives.
- **Patient Safety Flags & Case Presets:** Allergy cross-reactivity screening (Penicillin, NSAIDs, Sulfa, Macrolides), pediatric/geriatric Beers Criteria alerts, pregnancy contraindications, renal/hepatic impairment warnings, and 3 one-click clinical case presets.
- **Clinical Dosage, BMI & Cockcroft-Gault CrCl Calculator:** Live estimation of Body Mass Index, Creatinine Clearance (`mL/min`), CKD stage, and renal/weight-adjusted safe dosing ranges.
- **Firebase Auth, Cloud Firestore & RBAC:** Google Sign-In, Email/Password authentication, and Guest Clinical Preview. Signed-in clinicians persist prescription audits to Cloud Firestore (`saferx_prescriptions`), while the Chief Pharmacist / Admin role unlocks Approve, Flag, and Delete governance controls.
- **Interactive 3D Pharmaceutical Crystal Lattice (Three.js):** Real-time WebGL rotating double-helix and benzene-emerald crystal molecular viewport with drag-to-orbit, hover parallax, and `prefers-reduced-motion` support.
- **Live SQA Test Suite Dashboard:** Executes 20 live assertions across Unit (`InputValidator`), Integration (`SafetyChecker`), API/Security (XSS sanitization, RBAC, CrCl math), and Usability/Accessibility checks.

---

## Architecture

```text
saferx-ai/
├── index.html       # Semantic WCAG-accessible clinical workspace & custom SVG branding
├── styles.css       # Biotech Emerald-Pearl & Swiss Clinical Crystal glassmorphism tokens
├── app.js           # Firebase Auth/Firestore, SafetyChecker, InputValidator, CrCl, Three.js, SQA Suite
├── assets/
│   └── bg.jpg       # Sunlit alabaster frosted crystal glass molecular backdrop
└── README.md
```

Original `ICT 4458` Python modular architecture preserved in the web engine:
- `models.py` → Typed clinical structures (`Medication`, `PatientProfile`, `SafetyAlert`, `RiskLevel`)
- `validation.py` → `InputValidator` boundary checks and XSS input sanitization
- `safety_checker.py` → `SafetyChecker` interaction, allergy, and contraindication pipeline
- `tests/` → `test_validation.py` & `test_safety_checker.py` mirrored in the live SQA Test Runner

---

## Local Verification & Deployment

```bash
# Syntax check
node --check app.js

# Deploy to Vercel
npx vercel --prod --yes --name uftb-saferx-ai
```
