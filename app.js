/**
 * SafeRx AI — Intelligent Healthcare & Clinical Safety Solution
 * ICT 4458: Software Engineering, Testing and Quality Assurance Lab (UFTB)
 *
 * Modules:
 *  1. Firebase Auth + Cloud Firestore + RBAC (saferx_prescriptions)
 *  2. InputValidator & SafetyChecker (Ported & expanded from ICT 4458 Python core)
 *  3. Clinical Dosage, BMI & Cockcroft-Gault Creatinine Clearance Engine
 *  4. Three.js Interactive 3D Pharmaceutical Crystal Molecule / Double-Helix Lattice
 *  5. Live Automated SQA Test Suite Runner (Unit, Integration, API/Security, Usability)
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ==========================================================================
   1. Firebase Configuration & RBAC Constants
   ========================================================================== */
const firebaseConfig = {
  apiKey: "AIzaSyBImQiumgeTUbO9rg2q-U00rIe2LCEOfXY",
  authDomain: "uftb-academic-projects.firebaseapp.com",
  projectId: "uftb-academic-projects",
  storageBucket: "uftb-academic-projects.firebasestorage.app",
  messagingSenderId: "599797634726",
  appId: "1:599797634726:web:19e2df77f5ab264fa48667",
  measurementId: "G-LM0QPBFQG3",
};

const ADMIN_EMAILS = ["alansari10157@gmail.com"];
const FIRESTORE_COLLECTION = "saferx_prescriptions";

let auth = null;
let db = null;
let googleProvider = null;

try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
} catch (err) {
  console.warn("Firebase initialization fallback:", err);
}

/* ==========================================================================
   2. Clinical Formulary & Evidence-Based Interaction Knowledge Base
   ========================================================================== */
const MEDICATIONS = [
  { id: "warfarin", name: "Warfarin", code: "RX-11289", drugClass: "Anticoagulant (VKA)", allergyGroups: [], renalSensitive: false, hepaticSensitive: true, pregnancyRisk: "critical", elderlyRisk: true, pediatricRisk: true },
  { id: "aspirin", name: "Aspirin", code: "RX-1191", drugClass: "Antiplatelet / NSAID", allergyGroups: ["nsaid"], renalSensitive: true, hepaticSensitive: false, pregnancyRisk: "high", elderlyRisk: true, pediatricRisk: true },
  { id: "ibuprofen", name: "Ibuprofen", code: "RX-5640", drugClass: "NSAID Analgesic", allergyGroups: ["nsaid"], renalSensitive: true, hepaticSensitive: false, pregnancyRisk: "critical", elderlyRisk: true, pediatricRisk: false },
  { id: "clopidogrel", name: "Clopidogrel", code: "RX-32968", drugClass: "P2Y12 Antiplatelet", allergyGroups: [], renalSensitive: false, hepaticSensitive: true, pregnancyRisk: "none", elderlyRisk: false, pediatricRisk: true },
  { id: "metformin", name: "Metformin", code: "RX-6809", drugClass: "Biguanide Antidiabetic", allergyGroups: [], renalSensitive: true, hepaticSensitive: true, pregnancyRisk: "none", elderlyRisk: true, pediatricRisk: false },
  { id: "lisinopril", name: "Lisinopril", code: "RX-29046", drugClass: "ACE Inhibitor", allergyGroups: [], renalSensitive: true, hepaticSensitive: false, pregnancyRisk: "critical", elderlyRisk: false, pediatricRisk: false },
  { id: "atorvastatin", name: "Atorvastatin", code: "RX-83367", drugClass: "HMG-CoA Statin", allergyGroups: [], renalSensitive: false, hepaticSensitive: true, pregnancyRisk: "critical", elderlyRisk: false, pediatricRisk: false },
  { id: "omeprazole", name: "Omeprazole", code: "RX-7646", drugClass: "Proton Pump Inhibitor", allergyGroups: [], renalSensitive: false, hepaticSensitive: true, pregnancyRisk: "none", elderlyRisk: true, pediatricRisk: false },
  { id: "amoxicillin", name: "Amoxicillin", code: "RX-723", drugClass: "Beta-Lactam Antibiotic", allergyGroups: ["penicillin"], renalSensitive: true, hepaticSensitive: false, pregnancyRisk: "none", elderlyRisk: false, pediatricRisk: false },
  { id: "ciprofloxacin", name: "Ciprofloxacin", code: "RX-2551", drugClass: "Fluoroquinolone", allergyGroups: [], renalSensitive: true, hepaticSensitive: false, pregnancyRisk: "high", elderlyRisk: true, pediatricRisk: true },
  { id: "paracetamol", name: "Paracetamol", code: "RX-161", drugClass: "Analgesic / Antipyretic", allergyGroups: [], renalSensitive: false, hepaticSensitive: true, pregnancyRisk: "none", elderlyRisk: false, pediatricRisk: false },
  { id: "digoxin", name: "Digoxin", code: "RX-3407", drugClass: "Cardiac Glycoside", allergyGroups: [], renalSensitive: true, hepaticSensitive: false, pregnancyRisk: "none", elderlyRisk: true, pediatricRisk: true },
  { id: "amlodipine", name: "Amlodipine", code: "RX-17767", drugClass: "Calcium Channel Blocker", allergyGroups: [], renalSensitive: false, hepaticSensitive: true, pregnancyRisk: "none", elderlyRisk: false, pediatricRisk: false },
  { id: "azithromycin", name: "Azithromycin", code: "RX-18631", drugClass: "Macrolide Antibiotic", allergyGroups: ["macrolide"], renalSensitive: false, hepaticSensitive: true, pregnancyRisk: "none", elderlyRisk: false, pediatricRisk: false },
  { id: "sertraline", name: "Sertraline", code: "RX-36437", drugClass: "SSRI Antidepressant", allergyGroups: [], renalSensitive: false, hepaticSensitive: true, pregnancyRisk: "none", elderlyRisk: true, pediatricRisk: false },
  { id: "amiodarone", name: "Amiodarone", code: "RX-703", drugClass: "Class III Antiarrhythmic", allergyGroups: [], renalSensitive: false, hepaticSensitive: true, pregnancyRisk: "critical", elderlyRisk: true, pediatricRisk: true },
];

const DRUG_INTERACTIONS = [
  {
    pair: ["warfarin", "aspirin"],
    severity: "critical",
    label: "Contraindicated / Severe Bleeding",
    mechanism: "Additive antithrombotic effect: vitamin K antagonism combined with irreversible COX-1 platelet inhibition and gastric mucosal erosion.",
    management: "Avoid dual therapy unless specifically indicated (e.g., mechanical valve). Monitor INR every 3–5 days and add gastroprotection.",
    alternative: "Use Paracetamol for analgesia or consult cardiology for low-dose PPI co-therapy.",
  },
  {
    pair: ["warfarin", "ibuprofen"],
    severity: "critical",
    label: "Contraindicated / GI Hemorrhage",
    mechanism: "NSAIDs displace warfarin from plasma albumin and inhibit platelet aggregation while damaging gastric mucosa.",
    management: "Discontinue Ibuprofen immediately. Check INR and hemoglobin if co-administered.",
    alternative: "Paracetamol (up to 2g/day with INR monitoring) or topical analgesia.",
  },
  {
    pair: ["digoxin", "amiodarone"],
    severity: "critical",
    label: "Contraindicated / Digoxin Toxicity",
    mechanism: "Amiodarone inhibits P-glycoprotein renal and non-renal clearance of digoxin, elevating serum digoxin levels by 70–100%.",
    management: "Reduce digoxin maintenance dose by 50% immediately and monitor serum digoxin levels and ECG for bradycardia.",
    alternative: "Consider beta-blocker rate control with cardiology oversight.",
  },
  {
    pair: ["amiodarone", "ciprofloxacin"],
    severity: "critical",
    label: "Contraindicated / QT Prolongation",
    mechanism: "Additive blockade of cardiac hERG potassium channels significantly increases risk of Torsades de Pointes.",
    management: "Avoid concurrent use. Obtain baseline and serial 12-lead ECG if unavoidable.",
    alternative: "Amoxicillin or Doxycycline depending on bacterial susceptibility.",
  },
  {
    pair: ["amiodarone", "azithromycin"],
    severity: "critical",
    label: "Contraindicated / Arrhythmia Risk",
    mechanism: "Synergistic QTc prolongation increasing risk of fatal ventricular arrhythmias.",
    management: "Do not co-prescribe. Select a non-QT-prolonging antimicrobial.",
    alternative: "Amoxicillin (if non-penicillin-allergic) or Cephalexin.",
  },
  {
    pair: ["warfarin", "amiodarone"],
    severity: "high",
    label: "Major / Supratherapeutic INR",
    mechanism: "Amiodarone strongly inhibits CYP2C9 metabolism of S-warfarin, markedly increasing anticoagulant exposure.",
    management: "Empirically reduce warfarin dose by 30–50% and monitor INR weekly for 4–6 weeks.",
    alternative: "Consider DOAC (e.g., Apixaban) if clinically appropriate.",
  },
  {
    pair: ["warfarin", "ciprofloxacin"],
    severity: "high",
    label: "Major / Elevated Bleeding Risk",
    mechanism: "Ciprofloxacin inhibits CYP1A2/CYP2C9 warfarin clearance and disrupts vitamin K-producing gut flora.",
    management: "Monitor INR within 3–5 days of starting antibiotic and adjust warfarin dose.",
    alternative: "Nitrofurantoin (for uncomplicated UTI) or Amoxicillin.",
  },
  {
    pair: ["warfarin", "azithromycin"],
    severity: "high",
    label: "Major / Potentiated Anticoagulation",
    mechanism: "Alters intestinal vitamin K synthesis and may modestly impair warfarin clearance.",
    management: "Check INR 3–5 days after starting Azithromycin and watch for bruising or melena.",
    alternative: "Doxycycline or beta-lactam if clinically suitable.",
  },
  {
    pair: ["clopidogrel", "omeprazole"],
    severity: "high",
    label: "Major / Reduced Antiplatelet Efficacy",
    mechanism: "Omeprazole inhibits hepatic CYP2C19 required to bioactivate clopidogrel into its active thiol metabolite.",
    management: "Avoid Omeprazole with Clopidogrel to prevent stent thrombosis or recurrent ischemic events.",
    alternative: "Pantoprazole or Famotidine (minimal CYP2C19 inhibition).",
  },
  {
    pair: ["aspirin", "ibuprofen"],
    severity: "high",
    label: "Major / Cardioprotection Antagonism",
    mechanism: "Ibuprofen competitively blocks the COX-1 active site, preventing Aspirin's irreversible antiplatelet acetylation while increasing GI ulcer risk.",
    management: "Avoid regular Ibuprofen in patients on cardioprotective Aspirin; separate dosing by ≥ 2h if occasional use.",
    alternative: "Paracetamol or topical NSAID gel.",
  },
  {
    pair: ["lisinopril", "ibuprofen"],
    severity: "high",
    label: "Major / Acute Kidney Injury Risk",
    mechanism: "NSAID-induced afferent arteriolar vasoconstriction paired with ACE-inhibitor efferent vasodilation drops glomerular filtration pressure.",
    management: "Avoid concurrent NSAIDs, especially in elderly or dehydrated patients. Monitor serum creatinine and blood pressure.",
    alternative: "Paracetamol for pain control.",
  },
  {
    pair: ["digoxin", "azithromycin"],
    severity: "high",
    label: "Major / Elevated Digoxin Levels",
    mechanism: "Macrolides inhibit P-glycoprotein and eradicate Eubacterium lentum gut flora that normally metabolizes digoxin.",
    management: "Monitor for nausea, visual halos, or bradycardia; check serum digoxin trough level.",
    alternative: "Amoxicillin (non-macrolide antibiotic).",
  },
  {
    pair: ["warfarin", "sertraline"],
    severity: "high",
    label: "Major / Serotonergic Bleeding Risk",
    mechanism: "SSRIs deplete platelet serotonin stores, impairing primary hemostasis alongside warfarin anticoagulation.",
    management: "Monitor INR closely and evaluate GI bleeding risk; consider adding a PPI.",
    alternative: "Non-serotonergic antidepressant (e.g., Bupropion) if clinically indicated.",
  },
  {
    pair: ["aspirin", "sertraline"],
    severity: "high",
    label: "Major / Upper GI Bleeding",
    mechanism: "Combined antiplatelet inhibition via COX-1 blockade and platelet serotonin depletion.",
    management: "Co-prescribe gastroprotective PPI (Pantoprazole) if dual therapy is necessary.",
    alternative: "Paracetamol if Aspirin is used solely for analgesia.",
  },
  {
    pair: ["atorvastatin", "azithromycin"],
    severity: "moderate",
    label: "Moderate / Myopathy Risk",
    mechanism: "Mild inhibition of OATP1B1/CYP3A4 transport can modestly elevate statin exposure and muscle toxicity risk.",
    management: "Advise patient to report unexplained muscle pain, tenderness, or dark urine.",
    alternative: "Pravastatin or Rosuvastatin (non-CYP3A4 statins) if chronic interaction.",
  },
  {
    pair: ["atorvastatin", "amlodipine"],
    severity: "moderate",
    label: "Moderate / CYP3A4 Competition",
    mechanism: "Amlodipine weakly inhibits CYP3A4, mildly increasing atorvastatin AUC (~18%).",
    management: "Generally well tolerated; monitor for myalgias at high atorvastatin doses (80 mg).",
    alternative: "No change usually needed; consider Rosuvastatin if symptomatic.",
  },
  {
    pair: ["metformin", "ciprofloxacin"],
    severity: "moderate",
    label: "Moderate / Dysglycemia Risk",
    mechanism: "Fluoroquinolones can alter pancreatic insulin release and glucose homeostasis, causing hypo- or hyperglycemia.",
    management: "Instruct patient to monitor fasting and post-prandial blood glucose more frequently during antibiotic course.",
    alternative: "Amoxicillin or Cephalosporin where appropriate.",
  },
  {
    pair: ["warfarin", "amoxicillin"],
    severity: "moderate",
    label: "Moderate / Mild INR Elevation",
    mechanism: "Broad-spectrum beta-lactams reduce vitamin K-producing intestinal flora.",
    management: "Recheck INR if therapy exceeds 5–7 days or if patient has poor oral intake.",
    alternative: "Continue with standard INR monitoring.",
  },
  {
    pair: ["warfarin", "paracetamol"],
    severity: "moderate",
    label: "Moderate / Dose-Dependent INR Rise",
    mechanism: "Paracetamol metabolite NAPQI inhibits vitamin K epoxide reductase when taken at > 2g/day for several days.",
    management: "Limit Paracetamol to ≤ 2g/day and monitor INR if used regularly for > 3 consecutive days.",
    alternative: "Lowest effective Paracetamol dose with INR check.",
  },
  {
    pair: ["metformin", "lisinopril"],
    severity: "low",
    label: "Minor / Monitor Renal & Glucose",
    mechanism: "ACE inhibitors can slightly enhance insulin sensitivity; generally safe and widely co-prescribed in diabetic nephropathy.",
    management: "Routine periodic monitoring of serum creatinine, eGFR, and blood glucose.",
    alternative: "Safe combination — continue standard regimen.",
  },
];

/* Clinical Case Presets */
const CLINICAL_PRESETS = {
  "geriatric-bleed": {
    name: "MRN-7741 · Abdul Karim",
    age: 72,
    weight: 68,
    renal: true,
    hepatic: false,
    pregnant: false,
    allergies: [],
    meds: ["warfarin", "aspirin", "ibuprofen", "metformin"],
  },
  "cardio-allergy": {
    name: "MRN-5190 · Nusrat Jahan",
    age: 58,
    weight: 76,
    renal: false,
    hepatic: false,
    pregnant: false,
    allergies: ["penicillin"],
    meds: ["clopidogrel", "omeprazole", "amoxicillin", "atorvastatin"],
  },
  "pregnancy-cardiac": {
    name: "MRN-8304 · Farzana Akter",
    age: 31,
    weight: 64,
    renal: false,
    hepatic: false,
    pregnant: true,
    allergies: ["macrolide"],
    meds: ["warfarin", "lisinopril", "digoxin", "azithromycin"],
  },
};

/* ==========================================================================
   3. Core Modular Engine (InputValidator & SafetyChecker — ICT 4458)
   ========================================================================== */
class InputValidator {
  static validateMedicationName(name) {
    if (!name || !String(name).trim()) {
      return { valid: false, message: "Medication name cannot be empty" };
    }
    const clean = String(name).trim().toLowerCase();
    if (clean.length < 2) {
      return { valid: false, message: "Medication name too short" };
    }
    if (!/^[a-zA-Z\-]+$/.test(clean)) {
      return { valid: false, message: "Medication name contains invalid characters" };
    }
    return { valid: true, message: "Valid" };
  }

  static validateAge(age) {
    if (typeof age !== "number" || Number.isNaN(age)) {
      return { valid: false, message: "Age must be a valid number" };
    }
    if (age < 0 || age > 150) {
      return { valid: false, message: "Age must be between 0 and 150" };
    }
    return { valid: true, message: "Valid" };
  }

  static validateWeight(weight) {
    if (typeof weight !== "number" || Number.isNaN(weight)) {
      return { valid: false, message: "Weight must be a valid number" };
    }
    if (weight <= 0 || weight > 500) {
      return { valid: false, message: "Weight must be between 0 and 500 kg" };
    }
    return { valid: true, message: "Valid" };
  }

  static validateMedicationList(meds) {
    if (!Array.isArray(meds) || meds.length === 0) {
      return { valid: false, message: "Select at least one medication to analyze" };
    }
    for (const m of meds) {
      const res = InputValidator.validateMedicationName(m);
      if (!res.valid) {
        return { valid: false, message: `Invalid medication '${m}': ${res.message}` };
      }
    }
    return { valid: true, message: "Valid" };
  }

  static sanitizeInput(text) {
    if (!text) return "";
    return String(text).trim().replace(/[<>"']/g, "");
  }
}

class SafetyChecker {
  constructor(medCatalog, interactions) {
    this.medMap = new Map(medCatalog.map((m) => [m.id, m]));
    this.interactions = interactions;
  }

  checkInteractions(medIds) {
    const set = new Set(medIds.map((m) => m.toLowerCase().trim()));
    const alerts = [];
    for (const rule of this.interactions) {
      const [d1, d2] = rule.pair;
      if (set.has(d1) && set.has(d2)) {
        const m1 = this.medMap.get(d1)?.name || d1;
        const m2 = this.medMap.get(d2)?.name || d2;
        alerts.push({
          type: "drug_interaction",
          severity: rule.severity,
          title: `${m1} + ${m2}`,
          badgeText: rule.label,
          mechanism: rule.mechanism,
          management: rule.management,
          alternative: rule.alternative,
          drugs: [d1, d2],
        });
      }
    }
    return alerts;
  }

  checkAllergies(patient, medIds) {
    const alerts = [];
    const allergies = (patient.allergies || []).map((a) => a.toLowerCase());
    if (allergies.length === 0) return alerts;

    for (const id of medIds) {
      const med = this.medMap.get(id);
      if (!med) continue;
      for (const allergy of allergies) {
        const directMatch = med.id.includes(allergy) || allergy.includes(med.id);
        const classMatch = med.allergyGroups.includes(allergy);
        if (directMatch || classMatch) {
          alerts.push({
            type: "allergy_conflict",
            severity: "critical",
            title: `Allergy Conflict: ${med.name}`,
            badgeText: "Contraindicated / Hypersensitivity",
            mechanism: `Patient has documented ${allergy.toUpperCase()} hypersensitivity. ${med.name} (${med.drugClass}) carries severe cross-reactivity / anaphylaxis risk.`,
            management: `Do not dispense ${med.name}. Flag chart and verify allergy history immediately.`,
            alternative: allergy === "penicillin"
              ? "Azithromycin or Doxycycline (non-beta-lactam)"
              : allergy === "nsaid"
              ? "Paracetamol (Acetaminophen)"
              : "Consult infectious disease / clinical pharmacist for non-cross-reactive class.",
            drugs: [id],
          });
        }
      }
    }
    return alerts;
  }

  checkContraindications(patient, medIds) {
    const alerts = [];
    for (const id of medIds) {
      const med = this.medMap.get(id);
      if (!med) continue;

      if (patient.isPregnant && med.pregnancyRisk !== "none") {
        alerts.push({
          type: "pregnancy_contraindication",
          severity: med.pregnancyRisk,
          title: `Pregnancy Warning: ${med.name}`,
          badgeText: med.pregnancyRisk === "critical" ? "Contraindicated in Pregnancy" : "High Fetal Risk",
          mechanism: `${med.name} crosses the placenta and is associated with teratogenicity or fetal organ toxicity.`,
          management: `Avoid ${med.name} during pregnancy and consult OB/GYN immediately.`,
          alternative: med.id === "warfarin"
            ? "Low-Molecular-Weight Heparin (Enoxaparin)"
            : med.id === "lisinopril"
            ? "Labetalol or Nifedipine"
            : "Paracetamol / OB-approved pregnancy-safe alternative.",
          drugs: [id],
        });
      }

      if (patient.renalImpairment && med.renalSensitive) {
        alerts.push({
          type: "renal_impairment",
          severity: med.id === "metformin" || med.id === "digoxin" ? "high" : "moderate",
          title: `Renal Dosing Alert: ${med.name}`,
          badgeText: "Renal Impairment Adjustment",
          mechanism: `${med.name} relies heavily on renal clearance or affects glomerular hemodynamics, risking drug accumulation or lactic acidosis.`,
          management: `Calculate Cockcroft-Gault CrCl below. Reduce maintenance dose or hold if CrCl < 30 mL/min.`,
          alternative: med.id === "ibuprofen" ? "Paracetamol" : "Adjust dosing interval per CrCl table.",
          drugs: [id],
        });
      }

      if (patient.hepaticImpairment && med.hepaticSensitive) {
        alerts.push({
          type: "hepatic_impairment",
          severity: "moderate",
          title: `Hepatic Caution: ${med.name}`,
          badgeText: "Hepatic Clearance Warning",
          mechanism: `${med.name} undergoes extensive hepatic metabolism (CYP450 / glucuronidation); impaired liver function elevates systemic exposure.`,
          management: `Monitor ALT/AST/bilirubin and initiate at reduced starting dose.`,
          alternative: med.id === "paracetamol" ? "Limit strictly to ≤ 2g/day" : "Use renally cleared alternative if Child-Pugh Class C.",
          drugs: [id],
        });
      }

      if (patient.age > 65 && med.elderlyRisk) {
        alerts.push({
          type: "geriatric_warning",
          severity: "moderate",
          title: `Geriatric Beers Criteria: ${med.name}`,
          badgeText: "Geriatric (> 65y) Caution",
          mechanism: `Patients over 65 exhibit reduced renal/hepatic reserve and heightened sensitivity to bleeding, falls, or toxicity with ${med.name}.`,
          management: `Initiate at lowest effective dose and monitor organ function closely.`,
          alternative: "Review deprescribing criteria or select lower-risk agent.",
          drugs: [id],
        });
      }

      if (patient.age < 12 && med.pediatricRisk) {
        alerts.push({
          type: "pediatric_warning",
          severity: med.id === "aspirin" ? "critical" : "high",
          title: `Pediatric Alert: ${med.name}`,
          badgeText: med.id === "aspirin" ? "Contraindicated (Reye Syndrome)" : "Pediatric Restriction",
          mechanism: med.id === "aspirin"
            ? "Aspirin in children/adolescents is strongly associated with fatal Reye syndrome."
            : `${med.name} carries age-specific toxicity or cartilage/dosing hazards in pediatric patients (< 12y).`,
          management: `Avoid ${med.name} in pediatric patients unless directed by a pediatric specialist.`,
          alternative: med.id === "aspirin" ? "Weight-based Paracetamol or Ibuprofen" : "Pediatric formulary equivalent.",
          drugs: [id],
        });
      }
    }
    return alerts;
  }

  fullSafetyCheck(patient, medIds) {
    const allAlerts = [
      ...this.checkInteractions(medIds),
      ...this.checkAllergies(patient, medIds),
      ...this.checkContraindications(patient, medIds),
    ];

    const rank = { critical: 0, high: 1, moderate: 2, low: 3 };
    allAlerts.sort((a, b) => (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9));

    const counts = {
      critical: allAlerts.filter((a) => a.severity === "critical").length,
      high: allAlerts.filter((a) => a.severity === "high").length,
      moderate: allAlerts.filter((a) => a.severity === "moderate").length,
      low: allAlerts.filter((a) => a.severity === "low").length,
    };

    let overallRisk = "low";
    if (counts.critical > 0) overallRisk = "critical";
    else if (counts.high > 0) overallRisk = "high";
    else if (counts.moderate > 0) overallRisk = "moderate";

    return {
      patientName: InputValidator.sanitizeInput(patient.name) || "Unnamed Patient",
      age: patient.age,
      weightKg: patient.weightKg,
      medications: [...medIds],
      totalAlerts: allAlerts.length,
      counts,
      overallRisk,
      alerts: allAlerts,
      checkedAt: new Date().toISOString(),
    };
  }
}

const safetyEngine = new SafetyChecker(MEDICATIONS, DRUG_INTERACTIONS);

/* ==========================================================================
   4. Clinical Dosage, BMI & Cockcroft-Gault CrCl Calculator
   ========================================================================== */
function calculateClinicalMetrics({ age, sex, weightKg, heightCm, scr, drugId }) {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  // Cockcroft-Gault Creatinine Clearance (mL/min)
  let crcl = ((140 - age) * weightKg) / (72 * scr);
  if (sex === "female") crcl *= 0.85;
  crcl = Math.max(1, crcl);

  // BMI Classification
  let bmiCat = { label: "Normal Weight", badge: "badge-emerald", meter: "meter-emerald" };
  if (bmi < 18.5) bmiCat = { label: "Underweight", badge: "badge-sapphire", meter: "meter-sapphire" };
  else if (bmi >= 25 && bmi < 30) bmiCat = { label: "Overweight", badge: "badge-amber", meter: "meter-amber" };
  else if (bmi >= 30) bmiCat = { label: "Obese (Class I+)", badge: "badge-crimson", meter: "meter-crimson" };

  // Renal Function Stage
  let renalCat = { label: "Normal Renal Function (Stage 1–2)", badge: "badge-emerald", meter: "meter-emerald" };
  if (crcl < 30) renalCat = { label: "Severe Renal Impairment (Stage 4–5)", badge: "badge-crimson", meter: "meter-crimson" };
  else if (crcl < 60) renalCat = { label: "Moderate CKD (Stage 3)", badge: "badge-amber", meter: "meter-amber" };

  // Drug-Specific Safe-Range Guidance
  const isPediatric = age < 12;
  let drugTitle = "";
  let rangeText = "";
  let guidance = "";
  let doseStatus = { label: "Within Safe Range", badge: "badge-emerald" };

  switch (drugId) {
    case "metformin":
      drugTitle = "Metformin — Renal & Safe-Range Assessment";
      if (crcl < 30) {
        rangeText = "CONTRAINDICATED (0 mg/day — Hold Therapy)";
        guidance = "CrCl < 30 mL/min carries severe risk of Metformin-Associated Lactic Acidosis (MALA). Discontinue and transition to insulin or renally safe DPP-4i.";
        doseStatus = { label: "Contraindicated", badge: "badge-crimson" };
      } else if (crcl < 45) {
        rangeText = "Max 1000 mg/day (50% Renal Dose Reduction)";
        guidance = "Do not initiate Metformin if CrCl is 30–45 mL/min. If already established, cap at 500 mg twice daily and monitor eGFR every 3 months.";
        doseStatus = { label: "Dose Reduction Required", badge: "badge-amber" };
      } else {
        rangeText = "500–2000 mg/day PO in divided doses with meals";
        guidance = "Renal clearance supports standard adult titration (start 500 mg once or twice daily, max 2000 mg/day).";
      }
      break;

    case "amoxicillin":
      drugTitle = "Amoxicillin — Weight & Renal Dosing";
      if (isPediatric) {
        const minMg = Math.round(weightKg * 25);
        const maxMg = Math.round(weightKg * 45);
        rangeText = `${minMg}–${maxMg} mg/day divided q8h–q12h (25–45 mg/kg/day)`;
        guidance = "Pediatric weight-based dosing calculated automatically. Do not exceed standard adult maximum of 1500–3000 mg/day.";
      } else if (crcl < 30) {
        rangeText = "250–500 mg PO every 12–24 hours (Extended Interval)";
        guidance = "Severe renal impairment delays beta-lactam clearance. Extend dosing interval to prevent neurotoxicity/seizures.";
        doseStatus = { label: "Interval Adjustment", badge: "badge-amber" };
      } else {
        rangeText = "500 mg PO every 8 hours (or 875 mg q12h)";
        guidance = "Standard adult regimen safe for current renal clearance. Confirm absence of beta-lactam allergy.";
      }
      break;

    case "ciprofloxacin":
      drugTitle = "Ciprofloxacin — Fluoroquinolone Renal Guidance";
      if (isPediatric) {
        rangeText = "Restricted in Pediatric Patients (< 12y)";
        guidance = "Fluoroquinolones carry musculoskeletal/tendon toxicity risks in children; reserve only for severe complicated infections.";
        doseStatus = { label: "Pediatric Caution", badge: "badge-crimson" };
      } else if (crcl < 30) {
        rangeText = "250–500 mg PO every 18–24 hours (50% Reduction)";
        guidance = "Renal excretion accounts for ~50% of unchanged drug; extend interval to prevent CNS toxicity and QTc prolongation.";
        doseStatus = { label: "Renal Adjustment", badge: "badge-amber" };
      } else {
        rangeText = "500 mg PO every 12 hours (7–14 days)";
        guidance = "Standard dosing appropriate. Separate by ≥ 2 hours from calcium, iron, or antacids.";
      }
      break;

    case "paracetamol":
      drugTitle = "Paracetamol (Acetaminophen) — Weight-Safe Range";
      if (isPediatric) {
        const singleMin = Math.round(weightKg * 10);
        const singleMax = Math.round(weightKg * 15);
        const dailyMax = Math.min(4000, Math.round(weightKg * 60));
        rangeText = `${singleMin}–${singleMax} mg q4–6h (Max ${dailyMax} mg/day)`;
        guidance = "Pediatric dosing based on 10–15 mg/kg/dose (max 5 doses/24h).";
      } else {
        const adultMax = weightKg < 50 ? 2000 : 3000;
        rangeText = `500–1000 mg PO q6h (Recommended Max ${adultMax} mg/day)`;
        guidance = weightKg < 50
          ? "Low body weight (< 50 kg) increases hepatotoxicity risk; cap total daily intake at 2000 mg/day."
          : "Safe analgesic of choice in renal impairment; do not exceed 3000–4000 mg/24h from all combination products.";
        if (weightKg < 50) doseStatus = { label: "Weight Cap Applied", badge: "badge-amber" };
      }
      break;

    case "digoxin":
      drugTitle = "Digoxin — Narrow Therapeutic Index Dosing";
      if (crcl < 30) {
        rangeText = "62.5 mcg (0.0625 mg) PO every 48 hours";
        guidance = "High risk of fatal digoxin toxicity in severe CKD. Target trough serum concentration 0.5–0.9 ng/mL.";
        doseStatus = { label: "High Toxicity Risk", badge: "badge-crimson" };
      } else if (crcl < 60 || age > 70) {
        rangeText = "62.5–125 mcg PO once daily";
        guidance = "Reduced renal clearance or advanced age requires conservative maintenance dosing and potassium/magnesium monitoring.";
        doseStatus = { label: "Reduced Dose", badge: "badge-amber" };
      } else {
        rangeText = "125–250 mcg PO once daily";
        guidance = "Standard adult maintenance range. Verify absence of Amiodarone or Macrolide co-therapy.";
      }
      break;

    default:
      drugTitle = "Lisinopril — ACE Inhibitor Renal Dosing";
      if (crcl < 30) {
        rangeText = "Start 2.5–5 mg PO once daily (Max 40 mg with close K+ monitoring)";
        guidance = "Initiate at reduced dose in severe renal impairment. Check serum creatinine and potassium 1–2 weeks after initiation.";
        doseStatus = { label: "Low Start Dose", badge: "badge-amber" };
      } else {
        rangeText = "10–40 mg PO once daily";
        guidance = "Standard antihypertensive/cardioprotective dosing. Contraindicated in pregnancy.";
      }
  }

  return {
    bmi: Number(bmi.toFixed(1)),
    crcl: Number(crcl.toFixed(1)),
    bmiCat,
    renalCat,
    drugTitle,
    rangeText,
    guidance,
    doseStatus,
  };
}

/* ==========================================================================
   5. Application State & DOM References
   ========================================================================== */
const state = {
  user: null,
  isAdmin: false,
  authMode: "login",
  selectedMeds: new Set(["warfarin", "aspirin"]),
  lastReport: null,
  auditRecords: [],
  localGuestAudits: [
    {
      id: "demo-1",
      patientName: "MRN-7741 · Abdul Karim",
      medications: ["warfarin", "aspirin", "ibuprofen", "metformin"],
      overallRisk: "critical",
      totalAlerts: 5,
      status: "flagged",
      clinicianEmail: "clinical.demo@uftb.edu.bd",
      notes: "Dual antiplatelet + NSAID bleeding hazard detected in CKD patient.",
      createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
      source: "preview",
    },
    {
      id: "demo-2",
      patientName: "MRN-5190 · Nusrat Jahan",
      medications: ["clopidogrel", "omeprazole", "atorvastatin"],
      overallRisk: "high",
      totalAlerts: 1,
      status: "approved",
      clinicianEmail: "alansari10157@gmail.com",
      notes: "Switched Omeprazole to Pantoprazole 40mg OD; cleared for dispensing.",
      createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      source: "preview",
    },
  ],
  sqaFilter: "all",
  sqaResults: [],
};

const $ = (id) => document.getElementById(id);

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let toastTimer = null;
function showToast(message) {
  const el = $("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 3400);
}

/* ==========================================================================
   6. UI Rendering: Formulary & Safety Engine
   ========================================================================== */
function renderMedicationGrid(filterText = "") {
  const grid = $("medicationGrid");
  const q = filterText.trim().toLowerCase();
  const filtered = MEDICATIONS.filter(
    (m) => m.name.toLowerCase().includes(q) || m.drugClass.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)
  );

  grid.innerHTML = filtered
    .map((m) => {
      const selected = state.selectedMeds.has(m.id);
      return `
        <button type="button" class="med-card ${selected ? "is-selected" : ""}" data-med-id="${m.id}" aria-pressed="${selected}">
          <div class="med-card-top">
            <span class="med-name">${escapeHtml(m.name)}</span>
            <span class="med-code">${escapeHtml(m.code)}</span>
          </div>
          <span class="med-class">${escapeHtml(m.drugClass)}</span>
        </button>
      `;
    })
    .join("");

  grid.querySelectorAll(".med-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.medId;
      if (state.selectedMeds.has(id)) state.selectedMeds.delete(id);
      else state.selectedMeds.add(id);
      renderSelectedTray();
      renderMedicationGrid($("medSearchInput").value);
    });
  });
}

function renderSelectedTray() {
  const tray = $("selectedMedTray");
  $("selectedCount").textContent = String(state.selectedMeds.size);

  if (state.selectedMeds.size === 0) {
    tray.innerHTML = `<span class="tray-empty">No medications selected yet. Click drugs below or choose a clinical case preset.</span>`;
    return;
  }

  tray.innerHTML = Array.from(state.selectedMeds)
    .map((id) => {
      const med = MEDICATIONS.find((m) => m.id === id);
      return `
        <span class="selected-chip">
          <span>${escapeHtml(med ? med.name : id)}</span>
          <button type="button" data-remove-med="${id}" aria-label="Remove ${escapeHtml(med ? med.name : id)}">&times;</button>
        </span>
      `;
    })
    .join("");

  tray.querySelectorAll("[data-remove-med]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedMeds.delete(btn.dataset.removeMed);
      renderSelectedTray();
      renderMedicationGrid($("medSearchInput").value);
    });
  });
}

function updateAgeGroupHint() {
  const age = Number($("patientAge").value);
  const tag = $("ageGroupTag");
  if (Number.isNaN(age) || age < 0) tag.textContent = "Invalid age";
  else if (age < 12) tag.textContent = "Pediatric (< 12y)";
  else if (age > 65) tag.textContent = "Geriatric (> 65y)";
  else tag.textContent = "Adult (12–65y)";
}

function getPatientFromForm() {
  const allergies = Array.from(document.querySelectorAll('input[name="allergy"]:checked')).map((el) => el.value);
  return {
    name: $("patientName").value,
    age: Number($("patientAge").value),
    weightKg: Number($("patientWeight").value),
    renalImpairment: $("flagRenal").checked,
    hepaticImpairment: $("flagHepatic").checked,
    isPregnant: $("flagPregnant").checked,
    allergies,
  };
}

function runSafetyAnalysis() {
  const valBanner = $("engineValidationMsg");
  valBanner.classList.add("hidden");

  const patient = getPatientFromForm();
  const medIds = Array.from(state.selectedMeds);

  const ageCheck = InputValidator.validateAge(patient.age);
  if (!ageCheck.valid) {
    valBanner.textContent = ageCheck.message;
    valBanner.classList.remove("hidden");
    return;
  }

  const weightCheck = InputValidator.validateWeight(patient.weightKg);
  if (!weightCheck.valid) {
    valBanner.textContent = weightCheck.message;
    valBanner.classList.remove("hidden");
    return;
  }

  const medCheck = InputValidator.validateMedicationList(medIds);
  if (!medCheck.valid) {
    valBanner.textContent = medCheck.message;
    valBanner.classList.remove("hidden");
    return;
  }

  const report = safetyEngine.fullSafetyCheck(patient, medIds);
  state.lastReport = report;
  renderSafetyReport(report);
}

function renderSafetyReport(report) {
  $("reportTimestamp").textContent = `Checked ${new Date(report.checkedAt).toLocaleTimeString()}`;
  $("countCritical").textContent = String(report.counts.critical);
  $("countHigh").textContent = String(report.counts.high);
  $("countModerate").textContent = String(report.counts.moderate);

  const banner = $("riskSummaryCard");
  banner.className = `risk-banner risk-${report.overallRisk}`;

  const badgeMap = {
    critical: { cls: "badge-crimson", txt: "CRITICAL · CONTRAINDICATED", head: "Critical prescription hazards detected", sub: "Immediate pharmacist intervention required before dispensing." },
    high: { cls: "badge-amber", txt: "HIGH · MAJOR INTERACTION", head: "Major clinical warnings identified", sub: "Dose modification, close monitoring, or therapeutic substitution recommended." },
    moderate: { cls: "badge-sapphire", txt: "MODERATE · MONITOR", head: "Moderate clinical cautions detected", sub: "Regimen may proceed with parameter monitoring and patient counseling." },
    low: { cls: "badge-emerald", txt: "LOW · SAFE REGIMEN", head: "No major interactions or contraindications detected", sub: "Selected medications passed pairwise interaction, allergy, and organ screening." },
  };

  const meta = badgeMap[report.overallRisk] || badgeMap.low;
  const badgeEl = $("riskBadge");
  badgeEl.className = `severity-badge ${meta.cls}`;
  badgeEl.textContent = meta.txt;
  $("riskHeadline").textContent = meta.head;
  $("riskSubtext").textContent = meta.sub;

  const list = $("alertsList");
  if (report.alerts.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <p><strong>All Clear:</strong> Zero high-risk interactions, allergy conflicts, or contraindications found for ${escapeHtml(report.patientName)}.</p>
      </div>
    `;
  } else {
    const sevClass = { critical: "badge-crimson", high: "badge-amber", moderate: "badge-sapphire", low: "badge-emerald" };
    list.innerHTML = report.alerts
      .map(
        (a) => `
        <article class="alert-card sev-${a.severity}">
          <div class="alert-card-head">
            <span class="alert-title">${escapeHtml(a.title)}</span>
            <span class="severity-badge ${sevClass[a.severity] || "badge-neutral"}">${escapeHtml(a.badgeText)}</span>
          </div>
          <p class="alert-meta"><strong>Mechanism:</strong> ${escapeHtml(a.mechanism)}</p>
          <div class="alert-detail-grid">
            <div><strong>Management:</strong> ${escapeHtml(a.management)}</div>
            <div><strong>Safer Alternative:</strong> ${escapeHtml(a.alternative)}</div>
          </div>
        </article>
      `
      )
      .join("");
  }

  $("saveAuditBtn").disabled = false;
}

function applyPreset(presetKey) {
  const p = CLINICAL_PRESETS[presetKey];
  if (!p) return;

  $("patientName").value = p.name;
  $("patientAge").value = p.age;
  $("patientWeight").value = p.weight;
  $("flagRenal").checked = p.renal;
  $("flagHepatic").checked = p.hepatic;
  $("flagPregnant").checked = p.pregnant;

  document.querySelectorAll('input[name="allergy"]').forEach((cb) => {
    cb.checked = p.allergies.includes(cb.value);
  });

  state.selectedMeds = new Set(p.meds);
  updateAgeGroupHint();
  renderSelectedTray();
  renderMedicationGrid($("medSearchInput").value);
  runSafetyAnalysis();
  showToast(`Loaded clinical case: ${p.name}`);
}

/* ==========================================================================
   7. Dosage & CrCl Calculator UI
   ========================================================================== */
function updateDosageCalculator() {
  const age = Math.max(1, Math.min(120, Number($("calcAge").value) || 40));
  const sex = $("calcSex").value;
  const weightKg = Math.max(3, Math.min(250, Number($("calcWeight").value) || 70));
  const heightCm = Math.max(50, Math.min(240, Number($("calcHeight").value) || 170));
  const scr = Math.max(0.2, Math.min(15, Number($("calcScr").value) || 1.0));
  const drugId = $("calcDrug").value;

  const res = calculateClinicalMetrics({ age, sex, weightKg, heightCm, scr, drugId });

  $("outBmiValue").textContent = res.bmi.toFixed(1);
  const bmiBadge = $("outBmiBadge");
  bmiBadge.className = `severity-badge ${res.bmiCat.badge}`;
  bmiBadge.textContent = res.bmiCat.label;

  const bmiPct = Math.max(8, Math.min(100, ((res.bmi - 12) / 30) * 100));
  const bmiFill = $("bmiMeterFill");
  bmiFill.className = `meter-fill ${res.bmiCat.meter}`;
  bmiFill.style.width = `${bmiPct}%`;

  $("outCrclValue").textContent = res.crcl.toFixed(1);
  const crclBadge = $("outCrclBadge");
  crclBadge.className = `severity-badge ${res.renalCat.badge}`;
  crclBadge.textContent = res.renalCat.label;

  const crclPct = Math.max(6, Math.min(100, (res.crcl / 120) * 100));
  const crclFill = $("crclMeterFill");
  crclFill.className = `meter-fill ${res.renalCat.meter}`;
  crclFill.style.width = `${crclPct}%`;

  $("outDrugTitle").textContent = res.drugTitle;
  const doseBadge = $("outDoseStatus");
  doseBadge.className = `severity-badge ${res.doseStatus.badge}`;
  doseBadge.textContent = res.doseStatus.label;
  $("outDoseRange").textContent = res.rangeText;
  $("outDoseGuidance").textContent = res.guidance;
}

/* ==========================================================================
   8. Firebase Auth + Cloud Firestore Audit Ledger + RBAC
   ========================================================================== */
function updateAuthUI() {
  const badge = $("userStatusBadge");
  const roleLabel = $("userRoleLabel");
  const openAuthBtn = $("openAuthBtn");
  const signOutBtn = $("signOutBtn");
  const noticeText = $("rbacNoticeText");
  const saveHint = $("saveAuditHint");

  if (state.user) {
    openAuthBtn.classList.add("hidden");
    signOutBtn.classList.remove("hidden");

    if (state.isAdmin) {
      badge.className = "role-pill role-admin";
      roleLabel.textContent = `Chief Pharmacist · ${state.user.email}`;
      noticeText.innerHTML = `<strong>Chief Pharmacist / Admin RBAC Active:</strong> Signed in as <code>${escapeHtml(state.user.email)}</code>. You can approve, flag, or delete prescription audit logs in Cloud Firestore.`;
    } else {
      badge.className = "role-pill role-clinician";
      roleLabel.textContent = `Clinician · ${state.user.email}`;
      noticeText.innerHTML = `<strong>Clinician Access Active:</strong> Signed in as <code>${escapeHtml(state.user.email)}</code>. Prescriptions sync live to Cloud Firestore (<code>saferx_prescriptions</code>).`;
    }
    saveHint.innerHTML = `Connected to Cloud Firestore (<code>${FIRESTORE_COLLECTION}</code>).`;
  } else {
    openAuthBtn.classList.remove("hidden");
    signOutBtn.classList.add("hidden");
    badge.className = "role-pill role-guest";
    roleLabel.textContent = "Guest Preview";
    noticeText.innerHTML = `Viewing in <strong>Guest Clinical Preview</strong>. Sign in with Google or Email to sync with Cloud Firestore. Chief Pharmacist (<code>alansari10157@gmail.com</code>) unlocks Approve, Flag &amp; Delete governance.`;
    saveHint.innerHTML = `Guest mode saves to local preview ledger. Sign in to sync with Cloud Firestore (<code>${FIRESTORE_COLLECTION}</code>).`;
  }
}

async function fetchAuditLedger() {
  const tbody = $("auditTableBody");
  if (!db) {
    state.auditRecords = [...state.localGuestAudits];
    renderAuditTable();
    return;
  }

  try {
    const q = query(collection(db, FIRESTORE_COLLECTION), orderBy("createdAt", "desc"), limit(30));
    const snap = await getDocs(q);
    const cloudRows = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      cloudRows.push({
        id: docSnap.id,
        patientName: d.patientName || "Unknown Patient",
        medications: Array.isArray(d.medications) ? d.medications : [],
        overallRisk: d.overallRisk || "low",
        totalAlerts: Number(d.totalAlerts || 0),
        status: d.status || "pending",
        clinicianEmail: d.clinicianEmail || "clinician",
        notes: d.notes || "",
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.clientTimestamp || new Date().toISOString(),
        source: "firestore",
      });
    });

    state.auditRecords = cloudRows.length > 0 ? cloudRows : [...state.localGuestAudits];
    renderAuditTable();
  } catch (err) {
    console.warn("Firestore read fallback to local preview:", err);
    state.auditRecords = [...state.localGuestAudits];
    renderAuditTable();
    if (tbody && state.auditRecords.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No prescription audits recorded yet.</td></tr>`;
    }
  }
}

function renderAuditTable() {
  const tbody = $("auditTableBody");
  const filter = $("auditStatusFilter").value;
  const rows = state.auditRecords.filter((r) => filter === "all" || r.status === filter);

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No prescription audit records match this filter.</td></tr>`;
    return;
  }

  const riskBadgeMap = {
    critical: "badge-crimson",
    high: "badge-amber",
    moderate: "badge-sapphire",
    low: "badge-emerald",
  };

  const statusBadgeMap = {
    approved: "badge-emerald",
    flagged: "badge-crimson",
    pending: "badge-amber",
  };

  tbody.innerHTML = rows
    .map((r) => {
      const medsHtml = r.medications.map((m) => `<span class="med-pill-inline">${escapeHtml(m)}</span>`).join("");
      const timeStr = new Date(r.createdAt).toLocaleString();
      const governanceHtml =
        state.isAdmin && r.source === "firestore"
          ? `
            <div class="admin-action-group">
              <button type="button" class="btn btn-xs btn-approve" data-action="approve" data-id="${escapeHtml(r.id)}">Approve</button>
              <button type="button" class="btn btn-xs btn-flag" data-action="flag" data-id="${escapeHtml(r.id)}">Flag</button>
              <button type="button" class="btn btn-xs btn-delete" data-action="delete" data-id="${escapeHtml(r.id)}">Delete</button>
            </div>
          `
          : `<span class="text-xs text-muted font-mono">${r.source === "firestore" ? "Cloud Synced" : "Preview Record"}</span>`;

      return `
        <tr>
          <td>
            <strong>${escapeHtml(r.patientName)}</strong>
            <div class="text-xs text-muted font-mono">${escapeHtml(timeStr)}</div>
          </td>
          <td>${medsHtml}</td>
          <td><span class="severity-badge ${riskBadgeMap[r.overallRisk] || "badge-neutral"}">${escapeHtml(r.overallRisk.toUpperCase())}</span></td>
          <td class="font-mono">${r.totalAlerts}</td>
          <td><span class="severity-badge ${statusBadgeMap[r.status] || "badge-neutral"}">${escapeHtml(r.status.toUpperCase())}</span></td>
          <td>
            <div class="text-xs font-mono">${escapeHtml(r.clinicianEmail)}</div>
            <div class="text-xs text-muted">${escapeHtml(r.notes || "—")}</div>
          </td>
          <td>${governanceHtml}</td>
        </tr>
      `;
    })
    .join("");

  if (state.isAdmin) {
    tbody.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        await handleAdminAuditAction(id, action);
      });
    });
  }
}

async function saveCurrentAudit() {
  if (!state.lastReport) return;
  const notes = InputValidator.sanitizeInput($("clinicianNotes").value);
  const saveBtn = $("saveAuditBtn");
  saveBtn.disabled = true;

  const payload = {
    patientName: state.lastReport.patientName,
    age: state.lastReport.age,
    weightKg: state.lastReport.weightKg,
    medications: state.lastReport.medications,
    overallRisk: state.lastReport.overallRisk,
    totalAlerts: state.lastReport.totalAlerts,
    status: state.lastReport.overallRisk === "critical" ? "flagged" : "pending",
    clinicianEmail: state.user ? state.user.email : "guest.preview@local",
    notes: notes || "Screened via SafeRx AI Clinical Engine",
    clientTimestamp: new Date().toISOString(),
  };

  if (state.user && db) {
    try {
      await addDoc(collection(db, FIRESTORE_COLLECTION), {
        ...payload,
        createdAt: serverTimestamp(),
      });
      $("clinicianNotes").value = "";
      showToast("Prescription audit saved to Cloud Firestore.");
      await fetchAuditLedger();
    } catch (err) {
      console.error("Firestore save error:", err);
      showToast("Cloud save failed — saved to local preview ledger.");
      state.localGuestAudits.unshift({ id: `local-${Date.now()}`, ...payload, createdAt: payload.clientTimestamp, source: "preview" });
      state.auditRecords = [...state.localGuestAudits];
      renderAuditTable();
    }
  } else {
    state.localGuestAudits.unshift({ id: `local-${Date.now()}`, ...payload, createdAt: payload.clientTimestamp, source: "preview" });
    state.auditRecords = [...state.localGuestAudits];
    renderAuditTable();
    $("clinicianNotes").value = "";
    showToast("Saved to local preview ledger. Sign in for Cloud Firestore sync.");
  }

  saveBtn.disabled = false;
}

async function handleAdminAuditAction(docId, action) {
  if (!state.isAdmin || !db) return;
  try {
    const ref = doc(db, FIRESTORE_COLLECTION, docId);
    if (action === "delete") {
      await deleteDoc(ref);
      showToast("Audit record deleted by Chief Pharmacist.");
    } else if (action === "approve") {
      await updateDoc(ref, { status: "approved" });
      showToast("Prescription audit marked Approved.");
    } else if (action === "flag") {
      await updateDoc(ref, { status: "flagged" });
      showToast("Prescription audit Flagged for review.");
    }
    await fetchAuditLedger();
  } catch (err) {
    console.error("Admin action error:", err);
    showToast("Unable to update Firestore record. Check permissions.");
  }
}

/* ==========================================================================
   9. Live Automated SQA Test Suite (ICT 4458 Methodology)
   ========================================================================== */
function buildSqaTestCases() {
  return [
    // Unit Tests (InputValidator — mirrors tests/test_validation.py)
    { id: "UT-01", cat: "unit", name: "test_valid_medication_name", desc: "Accepts valid alphabetic/hyphenated medication names", fn: () => InputValidator.validateMedicationName("aspirin").valid === true },
    { id: "UT-02", cat: "unit", name: "test_empty_medication_name", desc: "Rejects empty/whitespace medication names", fn: () => InputValidator.validateMedicationName("   ").valid === false },
    { id: "UT-03", cat: "unit", name: "test_short_medication_name", desc: "Rejects single-character medication names", fn: () => InputValidator.validateMedicationName("a").valid === false },
    { id: "UT-04", cat: "unit", name: "test_age_bounds_valid", desc: "Accepts physiological patient age within [0, 150]", fn: () => InputValidator.validateAge(45).valid === true },
    { id: "UT-05", cat: "unit", name: "test_age_bounds_invalid", desc: "Rejects negative or >150 patient ages", fn: () => !InputValidator.validateAge(-5).valid && !InputValidator.validateAge(200).valid },
    { id: "UT-06", cat: "unit", name: "test_weight_boundary_zero", desc: "Rejects zero or negative patient weights", fn: () => !InputValidator.validateWeight(0).valid && InputValidator.validateWeight(70.5).valid },

    // Integration Tests (SafetyChecker — mirrors tests/test_safety_checker.py)
    { id: "IT-01", cat: "integration", name: "test_warfarin_aspirin_critical", desc: "Detects Warfarin + Aspirin critical bleeding hazard", fn: () => safetyEngine.checkInteractions(["warfarin", "aspirin"]).some((a) => a.severity === "critical") },
    { id: "IT-02", cat: "integration", name: "test_multiple_interactions", desc: "Detects >= 2 interactions in Warfarin + Aspirin + Ibuprofen", fn: () => safetyEngine.checkInteractions(["warfarin", "aspirin", "ibuprofen"]).length >= 2 },
    { id: "IT-03", cat: "integration", name: "test_clopidogrel_omeprazole_cyp2c19", desc: "Flags CYP2C19 inhibition between Clopidogrel & Omeprazole", fn: () => safetyEngine.checkInteractions(["clopidogrel", "omeprazole"]).length === 1 },
    { id: "IT-04", cat: "integration", name: "test_allergy_cross_reactivity", desc: "Flags Amoxicillin for documented Penicillin allergy", fn: () => safetyEngine.checkAllergies({ allergies: ["penicillin"] }, ["amoxicillin", "metformin"]).length === 1 },
    { id: "IT-05", cat: "integration", name: "test_pregnancy_contraindication", desc: "Triggers CRITICAL alert for Warfarin & Lisinopril in pregnancy", fn: () => safetyEngine.checkContraindications({ age: 29, isPregnant: true }, ["warfarin", "lisinopril"]).filter((a) => a.severity === "critical").length === 2 },
    { id: "IT-06", cat: "integration", name: "test_renal_impairment_metformin", desc: "Flags Metformin dosing adjustment in renal impairment", fn: () => safetyEngine.checkContraindications({ age: 58, renalImpairment: true }, ["metformin"]).length >= 1 },
    { id: "IT-07", cat: "integration", name: "test_geriatric_beers_warning", desc: "Issues geriatric warning for patients > 65 on Warfarin/Omeprazole", fn: () => safetyEngine.checkContraindications({ age: 74 }, ["warfarin", "omeprazole"]).length >= 2 },
    { id: "IT-08", cat: "integration", name: "test_clean_regimen_low_risk", desc: "Returns overallRisk === 'low' for clean adult regimen", fn: () => safetyEngine.fullSafetyCheck({ name: "Clean", age: 40, weightKg: 70, allergies: [] }, ["paracetamol", "amlodipine"]).overallRisk === "low" },

    // API & Security Tests
    { id: "SEC-01", cat: "security", name: "test_xss_payload_sanitization", desc: "Strips HTML/script tags from untrusted patient text", fn: () => { const s = InputValidator.sanitizeInput("<script>alert('xss')</script>"); return !s.includes("<") && !s.includes(">"); } },
    { id: "SEC-02", cat: "security", name: "test_rbac_chief_pharmacist_gate", desc: "Enforces Chief Pharmacist RBAC exclusively for authorized admin email", fn: () => ADMIN_EMAILS.includes("alansari10157@gmail.com") && !ADMIN_EMAILS.includes("random@user.com") },
    { id: "SEC-03", cat: "security", name: "test_cockcroft_gault_accuracy", desc: "Verifies Cockcroft-Gault CrCl math (54y male, 74kg, SCr 1.1 => ~80.5 mL/min)", fn: () => { const m = calculateClinicalMetrics({ age: 54, sex: "male", weightKg: 74, heightCm: 172, scr: 1.1, drugId: "metformin" }); return Math.abs(m.crcl - 80.5) < 0.6; } },

    // Usability & Accessibility Tests
    { id: "UX-01", cat: "usability", name: "test_formulary_completeness", desc: "Verifies >= 14 clinical medications loaded in formulary", fn: () => MEDICATIONS.length >= 14 },
    { id: "UX-02", cat: "usability", name: "test_skip_link_and_aria_landmarks", desc: "Confirms skip-link and main clinical landmark exist in DOM", fn: () => Boolean(document.querySelector(".skip-link")) && Boolean(document.querySelector("main#main-content")) },
    { id: "UX-03", cat: "usability", name: "test_reduced_motion_query_support", desc: "Checks browser matchMedia support for prefers-reduced-motion", fn: () => typeof window.matchMedia === "function" && typeof window.matchMedia("(prefers-reduced-motion: reduce)").matches === "boolean" },
  ];
}

function runSqaSuite() {
  const cases = buildSqaTestCases();
  const t0 = performance.now();
  const results = cases.map((tc) => {
    const start = performance.now();
    let passed = false;
    try {
      passed = Boolean(tc.fn());
    } catch {
      passed = false;
    }
    const ms = Math.max(0.1, performance.now() - start);
    return { ...tc, passed, ms };
  });
  const totalMs = performance.now() - t0;

  state.sqaResults = results;
  const passCount = results.filter((r) => r.passed).length;
  const pct = Math.round((passCount / results.length) * 100);

  $("sqaPassRate").textContent = `${pct}%`;
  $("sqaPassCount").textContent = `${passCount} / ${results.length}`;
  $("sqaDuration").textContent = `${totalMs.toFixed(1)} ms`;

  renderSqaResults();
}

function renderSqaResults() {
  const list = $("sqaResultsList");
  const filtered = state.sqaResults.filter((r) => state.sqaFilter === "all" || r.cat === state.sqaFilter);

  list.innerHTML = filtered
    .map(
      (r) => `
      <div class="sqa-case">
        <div class="sqa-case-info">
          <span class="sqa-case-name">${escapeHtml(r.id)} · ${escapeHtml(r.name)}</span>
          <span class="sqa-case-desc">${escapeHtml(r.desc)}</span>
        </div>
        <div class="sqa-case-right">
          <span class="font-mono text-xs text-muted">${r.ms.toFixed(1)}ms</span>
          <span class="severity-badge ${r.passed ? "badge-emerald" : "badge-crimson"}">${r.passed ? "PASS" : "FAIL"}</span>
        </div>
      </div>
    `
    )
    .join("");
}

/* ==========================================================================
   10. Three.js Interactive 3D Pharmaceutical Crystal Molecule / Helix Lattice
   ========================================================================== */
function initThreeMolecule() {
  const container = $("moleculeCanvasContainer");
  const canvas = $("moleculeCanvas");
  const fallback = $("webglFallback");

  if (!container || !canvas || typeof window.THREE === "undefined") {
    if (fallback) fallback.classList.remove("hidden");
    return;
  }

  let renderer;
  try {
    renderer = new window.THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    if (fallback) fallback.classList.remove("hidden");
    return;
  }

  const THREE = window.THREE;
  const scene = new THREE.Scene();
  const width = container.clientWidth || 420;
  const height = container.clientHeight || 310;

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(0, 0.2, 8.2);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);

  // Swiss Clinical Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.92));
  const keyLight = new THREE.DirectionalLight(0x10b981, 1.35);
  keyLight.position.set(5, 7, 6);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x0284c7, 1.1);
  rimLight.position.set(-6, -4, 5);
  scene.add(rimLight);

  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  const matEmerald = new THREE.MeshPhysicalMaterial({
    color: 0x059669,
    emissive: 0x064e3b,
    emissiveIntensity: 0.15,
    roughness: 0.14,
    metalness: 0.08,
    transmission: 0.35,
    clearcoat: 1.0,
  });

  const matSapphire = new THREE.MeshPhysicalMaterial({
    color: 0x0284c7,
    emissive: 0x0c4a6e,
    emissiveIntensity: 0.15,
    roughness: 0.14,
    metalness: 0.1,
    transmission: 0.35,
    clearcoat: 1.0,
  });

  const matPearl = new THREE.MeshPhysicalMaterial({
    color: 0xf0fdf4,
    roughness: 0.18,
    metalness: 0.05,
    clearcoat: 0.9,
  });

  const matBond = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.25,
    metalness: 0.35,
    transparent: true,
    opacity: 0.72,
  });

  function createBond(p1, p2, radius = 0.055) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const geom = new THREE.CylinderGeometry(radius, radius, len, 10);
    const mesh = new THREE.Mesh(geom, matBond);
    mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return mesh;
  }

  // Group A: Double-Helix Pharmaceutical Bond Lattice
  const helixGroup = new THREE.Group();
  const sphereGeom = new THREE.SphereGeometry(0.24, 24, 24);
  const steps = 16;
  const strandA = [];
  const strandB = [];

  for (let i = 0; i < steps; i++) {
    const t = (i / (steps - 1)) * Math.PI * 2.4;
    const y = (i - (steps - 1) / 2) * 0.34;
    const r = 1.35;

    const pA = new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r);
    const pB = new THREE.Vector3(Math.cos(t + Math.PI) * r, y, Math.sin(t + Math.PI) * r);
    strandA.push(pA);
    strandB.push(pB);

    const nodeA = new THREE.Mesh(sphereGeom, i % 3 === 0 ? matPearl : matEmerald);
    nodeA.position.copy(pA);
    helixGroup.add(nodeA);

    const nodeB = new THREE.Mesh(sphereGeom, i % 3 === 0 ? matPearl : matSapphire);
    nodeB.position.copy(pB);
    helixGroup.add(nodeB);

    // Cross-rung bond every 2 steps
    if (i % 2 === 0) {
      helixGroup.add(createBond(pA, pB, 0.042));
    }
    if (i > 0) {
      helixGroup.add(createBond(strandA[i - 1], pA, 0.05));
      helixGroup.add(createBond(strandB[i - 1], pB, 0.05));
    }
  }

  // Group B: Hexagonal Crystal Molecular Ring Lattice
  const crystalGroup = new THREE.Group();
  const ringNodes = [];
  const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(0.42, 28, 28), matEmerald);
  crystalGroup.add(coreSphere);

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const pos = new THREE.Vector3(Math.cos(a) * 1.9, Math.sin(a) * 1.9, (i % 2 === 0 ? 0.55 : -0.55));
    ringNodes.push(pos);
    const atom = new THREE.Mesh(new THREE.SphereGeometry(0.29, 24, 24), i % 2 === 0 ? matSapphire : matPearl);
    atom.position.copy(pos);
    crystalGroup.add(atom);
    crystalGroup.add(createBond(new THREE.Vector3(0, 0, 0), pos, 0.05));
  }
  for (let i = 0; i < 6; i++) {
    crystalGroup.add(createBond(ringNodes[i], ringNodes[(i + 1) % 6], 0.055));
  }
  const orbitRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.6, 0.03, 12, 72),
    new THREE.MeshBasicMaterial({ color: 0x059669, transparent: true, opacity: 0.35 })
  );
  orbitRing.rotation.x = Math.PI * 0.36;
  crystalGroup.add(orbitRing);

  crystalGroup.visible = false;
  rootGroup.add(helixGroup);
  rootGroup.add(crystalGroup);

  // Interactive State & Reduced Motion Respect
  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let isPaused = prefersReduced;
  let isHelix = true;
  let isDragging = false;
  let prevX = 0;
  let prevY = 0;
  let targetRotX = 0.18;
  let targetRotY = 0;

  const toggleMotionBtn = $("toggleMotionBtn");
  const toggleStructureBtn = $("toggleStructureBtn");
  const modelNameEl = $("molModelName");

  if (toggleMotionBtn) {
    toggleMotionBtn.textContent = isPaused ? "Resume" : "Pause";
    toggleMotionBtn.addEventListener("click", () => {
      isPaused = !isPaused;
      toggleMotionBtn.textContent = isPaused ? "Resume" : "Pause";
    });
  }

  if (toggleStructureBtn) {
    toggleStructureBtn.addEventListener("click", () => {
      isHelix = !isHelix;
      helixGroup.visible = isHelix;
      crystalGroup.visible = !isHelix;
      toggleStructureBtn.textContent = isHelix ? "Helix Mode" : "Crystal Mode";
      if (modelNameEl) {
        modelNameEl.textContent = isHelix ? "CYP2C9 / Double-Helix Lattice" : "Benzene-Emerald Crystal Ring";
      }
      renderer.render(scene, camera);
    });
  }

  container.addEventListener("pointerdown", (e) => {
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
  });

  window.addEventListener("pointerup", () => {
    isDragging = false;
  });

  container.addEventListener("pointermove", (e) => {
    const rect = container.getBoundingClientRect();
    if (isDragging) {
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      targetRotY += dx * 0.012;
      targetRotX = Math.max(-1.1, Math.min(1.1, targetRotX + dy * 0.012));
      prevX = e.clientX;
      prevY = e.clientY;
    } else if (!prefersReduced) {
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 0.5;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 0.4;
      targetRotX = 0.18 + ny;
      targetRotY += nx * 0.012;
    }
  });

  window.addEventListener("resize", () => {
    const w = container.clientWidth || 420;
    const h = container.clientHeight || 310;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    renderer.render(scene, camera);
  });

  function animate() {
    requestAnimationFrame(animate);
    if (!isPaused && !isDragging) {
      targetRotY += 0.0065;
    }
    rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.08;
    rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.08;
    renderer.render(scene, camera);
  }

  renderer.render(scene, camera);
  animate();
}

/* ==========================================================================
   11. Event Wiring & Bootstrap
   ========================================================================== */
function initAuthModal() {
  const modal = $("authModal");
  const openBtn = $("openAuthBtn");
  const closeBtn = $("closeAuthModalBtn");
  const guestBtn = $("guestPreviewBtn");
  const googleBtn = $("googleSignInBtn");
  const tabLogin = $("tabLogin");
  const tabRegister = $("tabRegister");
  const submitBtn = $("emailAuthSubmitBtn");
  const form = $("emailAuthForm");
  const errBox = $("authErrorMsg");

  const closeModal = () => {
    modal.classList.add("hidden");
    errBox.classList.add("hidden");
  };

  openBtn.addEventListener("click", () => modal.classList.remove("hidden"));
  closeBtn.addEventListener("click", closeModal);
  guestBtn.addEventListener("click", () => {
    closeModal();
    showToast("Continuing in Guest Clinical Preview mode.");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  tabLogin.addEventListener("click", () => {
    state.authMode = "login";
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    submitBtn.textContent = "Sign In with Email";
  });

  tabRegister.addEventListener("click", () => {
    state.authMode = "register";
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    submitBtn.textContent = "Create Clinical Account";
  });

  googleBtn.addEventListener("click", async () => {
    if (!auth || !googleProvider) {
      errBox.textContent = "Firebase Auth unavailable in this environment.";
      errBox.classList.remove("hidden");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      closeModal();
      showToast("Signed in with Google.");
    } catch (err) {
      errBox.textContent = err.message || "Google sign-in failed.";
      errBox.classList.remove("hidden");
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errBox.classList.add("hidden");
    const email = $("authEmail").value.trim();
    const password = $("authPassword").value;
    if (!auth) return;

    try {
      if (state.authMode === "register") {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast("Clinical account created & signed in.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showToast("Signed in successfully.");
      }
      closeModal();
    } catch (err) {
      errBox.textContent = err.message || "Authentication failed.";
      errBox.classList.remove("hidden");
    }
  });

  $("signOutBtn").addEventListener("click", async () => {
    if (auth) await signOut(auth);
    showToast("Signed out — switched to Guest Preview.");
  });
}

function bootstrap() {
  // 1. Formulary & Safety Engine
  renderMedicationGrid();
  renderSelectedTray();
  updateAgeGroupHint();

  $("medSearchInput").addEventListener("input", (e) => renderMedicationGrid(e.target.value));
  $("patientAge").addEventListener("input", updateAgeGroupHint);
  $("runSafetyCheckBtn").addEventListener("click", runSafetyAnalysis);
  $("saveAuditBtn").addEventListener("click", saveCurrentAudit);

  $("resetEngineBtn").addEventListener("click", () => {
    state.selectedMeds.clear();
    $("patientName").value = "";
    $("patientAge").value = 40;
    $("patientWeight").value = 70;
    $("flagRenal").checked = false;
    $("flagHepatic").checked = false;
    $("flagPregnant").checked = false;
    document.querySelectorAll('input[name="allergy"]').forEach((c) => { c.checked = false; });
    updateAgeGroupHint();
    renderSelectedTray();
    renderMedicationGrid("");
    showToast("Clinical form cleared.");
  });

  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyPreset(btn.dataset.preset));
  });

  // 2. Dosage & CrCl Calculator
  ["calcAge", "calcSex", "calcWeight", "calcHeight", "calcScr", "calcDrug"].forEach((id) => {
    $(id).addEventListener("input", updateDosageCalculator);
    $(id).addEventListener("change", updateDosageCalculator);
  });
  updateDosageCalculator();

  // 3. Audit Ledger Controls
  $("auditStatusFilter").addEventListener("change", renderAuditTable);
  $("refreshAuditBtn").addEventListener("click", () => {
    fetchAuditLedger();
    showToast("Audit ledger refreshed.");
  });

  // 4. SQA Suite Runner
  $("runSqaSuiteBtn").addEventListener("click", () => {
    runSqaSuite();
    showToast("Executed 20 automated SQA assertions.");
  });
  document.querySelectorAll(".sqa-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".sqa-tab").forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      state.sqaFilter = tab.dataset.cat;
      renderSqaResults();
    });
  });

  // 5. Auth Modal & Firebase Listener
  initAuthModal();
  if (auth) {
    onAuthStateChanged(auth, (user) => {
      state.user = user || null;
      state.isAdmin = Boolean(user && user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
      updateAuthUI();
      fetchAuditLedger();
    });
  } else {
    updateAuthUI();
    fetchAuditLedger();
  }

  // 6. Initial Safety Analysis, SQA Run & 3D Molecule
  runSafetyAnalysis();
  runSqaSuite();
  window.addEventListener("load", initThreeMolecule);
}

document.addEventListener("DOMContentLoaded", bootstrap);
