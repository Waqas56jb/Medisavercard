/**
 * MediSaver AI Chatbot — Backend Server
 * Full-Page Industry-Standard Design | OpenAI Powered
 * File: backend/server.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

if (process.env.VERCEL) {
    app.use((req, _res, next) => {
        const raw = req.headers['x-vercel-original-path'] || req.headers['x-invoke-path'];
        const q = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
        if (typeof raw === 'string' && raw.startsWith('/')) {
            req.url = raw.split('?')[0] + q;
        }
        next();
    });
}

/* ═══════════════════════════════════════════════════════════
   PERSISTENT STORAGE
═══════════════════════════════════════════════════════════ */
const LEADS_FILE = path.join(__dirname, 'leads.json');
const ANALYTICS_FILE = path.join(__dirname, 'analytics.json');
const CONVERSATIONS_FILE = path.join(__dirname, 'conversations.json');

function readJSON(file, def) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch { return def; }
}
function writeJSON(file, data) {
    try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); } catch (e) { }
}

/* ═══════════════════════════════════════════════════════════
   COMPLETE MEDISAVER KNOWLEDGE BASE
═══════════════════════════════════════════════════════════ */
const MEDISAVER_KB = `
=== MEDISAVER MEDICAL DISCOUNT CARD — MASTER KNOWLEDGE BASE ===

CRITICAL IDENTITY:
MediSaver is NOT insurance. It is a Florida-licensed medical discount plan (DMPO) under Chapter 636, Part II of Florida Statutes. MediSaver does NOT pay providers. Members pay discounted rates directly to providers. Never call this insurance.

BUSINESS INFO:
- Name: MediSaver Medical Discount Card
- Website: medisavercard.com
- Phone: (305) 884-8740
- Email: info@medisavercard.com
- Address: 5901 NW 151st St, Miami Lakes, FL 33014
- Hours: Monday–Friday 8:30am–5:30pm | Saturday 9:00am–12:00pm | Sunday: Closed
- License: Florida DMPO, Chapter 636, Part II

WHAT MEDISAVER IS:
MediSaver helps uninsured, underinsured, and self-pay individuals and businesses access discounted healthcare through 60+ participating providers across South Florida (Miami-Dade, Broward, Palm Beach). Members pay a monthly fee and receive discounts of up to 75–80% on medical services plus a FREE pharmacy discount card.

MISSION: To provide accessible, affordable healthcare solutions for individuals who cannot obtain traditional medical insurance. Everyone qualifies — no medical underwriting, no health screening, no immigration status restrictions.

MEMBERSHIP PLANS & PRICING:
1. Single User (Base): $30/month recurring | First month: $70 (includes $40 sign-up fee)
   - Access to doctor list | List with prices | For 1 person | Recurring monthly
2. 2 Users (Extra): $40/month recurring | First month: $80 (includes $40 sign-up fee)
   - Access to doctor list | List with prices | For 2 people | Recurring monthly
3. Family (Full): $55/month recurring | First month: $95 (includes $40 sign-up fee)
   - Access to doctor list | List with prices | Up to 5 family members | Recurring monthly
4. Group (Business 10+ employees): $20/person/month | Initial: $60 for 30 days
   - No long contracts | No setup fees | Flexible billing | Add/remove members anytime
   - Pre-negotiated rates on doctor visits, labs, imaging, dental | Digital membership cards
   - Example savings: Office visit $30 (50% off) | X-ray $60 | Dental cleaning $90
   - Average savings: $200–$500/person/year

CURRENT PROMO: Try FREE for 30 days at medisavercard.com. Sign up at medisavercard.com/register

WHO QUALIFIES: Everyone 18+ in the United States. No medical exam. No health screening. Regardless of age or health status.

PHARMACY DISCOUNT CARD (FREE — included with membership):
- Partner: RxLess (trusted national pharmacy savings)
- Savings: Up to 80–88% on prescriptions
- Accepted at: 70,000+ pharmacies nationwide (CVS, Walgreens, Walmart, Publix, local pharmacies)
- No enrollment | No fees | No personal info required | Works with or without insurance
- Download: medisavercard.com/pharmacy-discount-card
- RxLess Support: 1-844-479-5377
- How to use: Search medication → Download card → Show at pharmacy → Save instantly

MEMBER CONSULTATION FEES:
- General Practice Initial Visit: $25.00
- General Practice Follow-Up: $20.00
- Specialist Initial Visit: $60.00
- Specialist Follow-Up: $40.00
- Pediatrics Initial Visit: $40.00
- Pediatrics Follow-Up: $30.00

CARDIOVASCULAR (Member Prices):
- ECG (93000): $10.00
- Echo (93307): $90.00
- Echo Doppler (93320): $40.00
- Color Flow Doppler (93325): $18.00
- Holter Monitor 24hr (93324): $55.00
- Echo Complete with Color & Flow: $150.00
- Echo Stress Test with Color & Flow: $350.00

DIAGNOSTIC ULTRASOUND (All $50–$70):
- Abdomen Single/Complete: $50.00
- Breast, Pelvic, Prostate, Kidney/Renal, Thyroid: $50.00 each
- US Arterial/Duplex Scan: $70.00 each
- Carotid Doppler: $90.00
- Arterial Lower Extremity Bilateral: $100.00
- Venous Duplex Bilateral/Unilateral: $90.00

X-RAY PROCEDURES (All $25.00):
- Ankle, Chest, Elbow, Foot, Forearm, Hand, Hip, Humerus, Knee
- Lumbar Spine, Ribs, Shoulder, Tibia, Wrist, Calcaneus, Femur
- Fingers, Cervical Spine, Thoracic Spine, Knee, Sinus, Skull, Nasal Bones

THERAPIES ($10 each):
- Hot/Cold Pack, Tractional Mechanical, EMS High Frequency
- Paraffin Bath, Ultrasound Therapy, Whirlpool

PULMONARY ($12.50 each):
- Spirometry, Bronchospasm Eval, Nebulizer Treatment, Maximum Breathing Cap.

OB/GYN:
- Ear Lavage: $5.00
- PAP Smear Papanicolau Liquid: $35.00 (also $25 at some centers)
- PAP Papanicolau Slide: $20.00

MRI PRICES:
- Without contrast (W/O): $275.00 (Brain, Spine, Knee, Shoulder, Abdomen, etc.)
- With contrast (W): $325.00
- With and Without contrast (W & W/O): $325–$375

CT SCAN PRICES:
- Without contrast: $150.00
- With contrast: $200.00
- With and Without: $275.00

ULTRASOUND/IMAGING (Additional):
- Abdomen Complete: $70.00
- Pelvic Complete: $70.00
- Pelvic Transvaginal: $70.00
- Prostate Transabdominal/Transrectal: $70.00
- Scrotum & Contents: $70.00
- Abdominal Aorta: $90.00

KEY LAB TESTS (Member Prices):
- CBC: $20.00
- Cholesterol: $7.00
- Glucose (Serum): $3.50
- HbA1C / Hemoglobin A1C: $9.50
- TSH: $14.60
- HIV 1 & 2 Screen: $9.50
- Vitamin D: $33.50
- Testosterone: $25.00
- Lipid Panel: $9.00
- Urinalysis: $2.00
- Hepatitis Panel ABC: $44.00
- Thyroid Panel (TSH): $29.00
- PSA Free & Total: $29.00
- Pregnancy Test (Urine): $6.50
- Blood Type & RH: $40.00
- Comprehensive Metabolic Panel: $10.00
- Basic Metabolic Panel: $8.00
- Semen Analysis: $50.00
- Drug Screen Urine: $23.00
- Obstetric Panel: $45.23
- PAP Smear: $15.00
- B-12 & Folic Acid: $30.00
- Progesterone: $26.00
- Prolactin: $19.50
- FSH: $17.00
- Estradiol: $22.00
- Cortisol: $15.00
- C-Reactive Protein: $5.00
- D-Dimer: $22.50
- Ferritin: $14.00
- Thyroid Peroxide AB: $15.00
- Hepatitis A IgM: $11.50
- Hepatitis B Surface Antigen: $10.00
- Hepatitis C Antibody: $13.50
- Rubella Antibody IgG: $15.00
- Homocysteine: $28.00

DENTAL MEMBER PRICES:
- Periodic Oral Exam: FREE (no charge)
- Limited Oral Evaluation: $10.00
- Comprehensive Oral Eval: $20.00
- Adult Cleaning (Prophylaxis, every 6 months): $49.00
- Child Cleaning under 16 (every 6 months): $35.00
- Panoramic X-ray (Film): $25.00
- Intraoral X-ray Complete Series: $30.00
- Bitewing Single Film: $5.00
- Pulp Vitality Test: $10.00
- Topical Fluoride (Children): $5.00
- Topical Fluoride (Adults): $20.00
- Composite Filling 1-surface Anterior: $52.00
- Composite Filling 1-surface Posterior: $53.00
- Composite Filling 2-surface: $60.00
- Composite Filling 3-surface: $75.00
- Composite Filling 4+ surfaces: $80.00
- Crown Porcelain/Ceramic: $595.00
- Crown Porcelain Fused to High Noble Metal: $495.00
- Crown Full Cast High Noble Metal: $699.00
- Crown Provisional: $50.00
- Recement Crown: $25.00
- Root Canal Anterior (D3310): $395.00
- Root Canal Bicuspid (D3320): $495.00
- Root Canal Molar (D3330): $595.00
- Root Canal Retreat Anterior: $495.00
- Root Canal Retreat Bicuspid: $595.00
- Root Canal Retreat Molar: $695.00
- Tooth Extraction (Single): $60.00
- Extraction Erupted Tooth/Root: $70.00
- Surgical Extraction Erupted Tooth: $100.00
- Surgical Impacted Soft Tissue: $150.00
- Surgical Impacted Partial Bony: $200.00
- Wisdom Tooth (Cordales) Impacted Complete Bony: $150.00
- Complete Denture Maxillary/Mandibular: $495.00 each
- Partial Denture Resin Base: $450.00
- Dental Implant (Surgical Placement): $1,200.00
- Completed Crown Implant (Implant + Crown): $1,950.00
- Overdenture Upper with 4 Implants: $4,650.00
- Overdenture Lower with 3 Implants: $3,650.00
- Orthodontics Comprehensive (Adolescent/Adult): $3,490.00
- Sedative Filling: $40.00
- Core Buildup: $85.00
- Labial Veneer Porcelain: $425.00
- Space Maintainer Fixed: $120–125
- Gingivectomy per Quadrant: $50.00
- Periodontal Scaling & Root Planing 4+ teeth: $75.00
- Periodontal Maintenance: $55.00
- Gingivectomy 4+ per Quad (extended): $450.00
- Osseous Surgery: $800.00
- Bone Replace Graft 1st site: $650.00
- Frenulectomy: $500.00
- Bone Graft Ridge Preservation: $400.00
Note: Dental procedures not in the price list receive a 25% discount. Basic cleaning does not apply if patient has periodontal disease.

INJECTIONS (Cost + $10 per injection):
Compazine, Decadron, Depo-Medrol 40/80mg, Terramycin, Testosterone, Vistaril, Vitamin B12, Tetanus Globulin, Tetanus Toxoid, Bentyl, Tigan, Toradol, Benadryl

PROVIDER NETWORK (60+ providers — South Florida):
PRIMARY PROVIDER: Wellness Therapy & Medical Care Center — (305) 827-0208 — 8040 NW 155th St, Miami Lakes, FL 33016 — info@wellnesstherapyandmedical.com

GENERAL MEDICINE / PRIMARY CARE:
- Dr. Jorge Acosta MD — (305) 267-0074 — 938B SW 82nd Ave, Miami, FL 33144
- Paradisus Medical Center — (305) 824-8559 — 4410 W 16th Ave #55-59, Hialeah, FL 33012
- Paradisus Medical Center Kendall — (305) 432-9249 — 2627 SW 147th Ave, Miami, FL 33175
- Private Medical Center — (305) 774-0742 — 1800 SW 27th Ave #400, Miami, FL 33145
- All Family Medical Center — (305) 246-0460 — 38 NW 8th St, Homestead, FL 33030
- Dr. Aracely Yapur MD — (305) 698-6030 — 7975 NW 154th St #270, Miami Lakes, FL 33016
- Dr. Rosa Alminaque MD — (786) 801-1394 — 3850 SW 87th Ave #201, Miami, FL 33165
- Metro Medical of Miami — (305) 278-1515 — 14221 SW 120th St, Miami, FL 33186
- Dr. Esperanza Arce Núñez MD — (305) 823-3000 — 1840 W 49th St #420, Hialeah, FL 33012
- Dr. Armando Acevedo MD (Ped/General) — (305) 633-9090 — 2400 NW 54th St, Miami, FL 33142

INTERNAL MEDICINE:
- Dr. Juan Carlos Rondon MD — (954) 322-8986 — 3157 N University Dr #103, Hollywood, FL 33024
- Dr. Christopher Mesa MD — (305) 585-7611 — 2510 SW 27th Ave #101, Miami, FL 33133
- Dr. Félix González MD — (786) 703-7000 — 2510 SW 27th Ave #101, Miami, FL 33133
- Ana M. Acosta — (786) 360-4423 — 330 SW 27th Ave, Miami, FL 33135
- Dr. Satya Singh MD — (954) 321-5428 — 300 NW 70th Ave #205, Plantation, FL 33317
- Dr. Joseph Fanfan MD (La Clinique) — (954) 525-4900 — 2630 N Andrews Ave, Wilton Manors, FL 33311

SPECIALISTS:
- Cardiology: Dr. Henry Chua MD — (305) 325-8990 — 1296 NW 14th St, Miami, FL 33125
- Neurology: Dr. Hector Lalama MD — (305) 448-9797 — 801 Santiago St, Coral Gables, FL 33134
- Neurology/Critical Care: Dr. Rodolfo Gutierrez-Alsina MD — (305) 325-8588 — 2387 W 68th St #401, Hialeah, FL 33016
- Endocrinology: Dr. Carlos Barrera MD — (305) 274-4339 — 7190 SW 87th Ave #306, Miami, FL 33173
- Nephrology: Dr. Herminio Garcia Estrada MD — (305) 541-2655 — 550 SW 27th Ave, Miami, FL 33135
- Gastroenterology: Dr. Orlando Torres MD — (305) 825-0500 — 4791 W 4th Ave, Hialeah, FL 33012
- Gastroenterology: Dr. Carlos Selema MD — (305) 443-2611 — 747 Ponce de Leon Blvd #200, Coral Gables, FL 33134
- Urology: Dr. Paul Perito MD — (305) 444-2920 — 135 San Lorenzo Ave #540, Coral Gables, FL 33146
- Psychiatry: Dr. Cesar Raoli MD — (305) 299-8364 — 12315 SW 64th Ave, Miami, FL 33156
- Rheumatology/Internal: Dr. Ariel Duran Mondragon MD — (305) 554-5144 — 10760 W Flagler St #11, Miami, FL 33174
- ENT: Dr. Maria Teresa Llopiz MD — (305) 649-5455 — 330 SW 27th Ave #603, Miami, FL 33135
- Dermatology: Dr. Jerome Obed DO — (954) 990-6591 — 500 SE 15th St #108, Fort Lauderdale, FL 33316
- Pain Management: Dr. Rafael Rey — (800) 794-2311 — 8300 W Flagler St #230, Miami, FL 33144
- Pathology: Dr. Idalia Santaella MD — (305) 448-7213 — 135 San Lorenzo Ave #100, Coral Gables, FL 33146

OB/GYN:
- Dr. Carlos Verdeza MD — (305) 553-8033 — 2475 NW 95th Ave Unit 2, Doral, FL 33172
- Dr. Fernando Lora MD — (305) 220-0300 — 8300 W Flagler St #175, Miami, FL 33144
- Dr. Emilio Blanco MD — (305) 882-1100 — 881 E 2nd Ave, Hialeah, FL 33010
- East West OB/GYN — (954) 565-7686 — 260 SW 17th Terrace, Fort Lauderdale, FL 33312
- Dr. Aracely Yapur MD (also GYN) — (305) 698-6030 — 7975 NW 154th St #270, Miami Lakes

ORTHOPEDICS:
- Dr. Manuel Feijoo MD — (305) 265-7505 — 8368 SW 8th St, Miami, FL 33144
- Galaxy Orthopedic/Dr. Jose Ponce de Leon MD — (786) 536-2377 — 9774 SW 24th St, Miami, FL 33165
- Dr. Juan Herrera MD — (305) 696-7772 — 777 E 25th St #508, Hialeah, FL 33013
- Florida Orthocare — (561) 750-2501 — 3100 S Congress Ave, Boynton Beach, FL 33426

PEDIATRICS:
- Dr. Belkys Bonelly MD — (305) 828-7374 — 315 W 49th St Suite B, Hialeah, FL 33012
- Dr. Armando Acevedo MD — (305) 633-9090 — 2400 NW 54th St, Miami, FL 33142
- Pediatrics by the Sea — (561) 303-3707 — 600 N Congress Ave #140, Delray Beach, FL 33445

PODIATRY:
- Dr. Gilberto Acosta DPM — (305) 828-2288 — 613 E 49th St, Hialeah, FL 33013
- Certified Foot & Ankle Specialist — (888) 982-1337 — 1601 Forum Pl #400, West Palm Beach, FL 33401
- Dr. Yanira Bermudez DPM — (561) 284-8323 — 15300 Jog Rd #204, Delray Beach, FL 33446

VISION/OPTOMETRY:
- Zarco Vision Center (Ophthalmology) — (305) 443-3330 — 3230 W Flagler St, Miami, FL 33135
- Planet Optical (Optometry) — (305) 477-4480 — 10367 NW 41st St, Doral, FL 33178
- Dr. Amarella Dalmazzo OD — (305) 829-3937 — 18600 NW 87th Ave #124, Hialeah, FL 33015
- In Focus Optical Miami — (305) 892-8655 — 687 NE 125th St, North Miami, FL 33161
- Dr. Jacqueline Smith MD (Ophthalmology) — (561) 318-7432 — 600 S Dixie Hwy, West Palm Beach, FL 33401

DENTAL (4 providers):
- Dr. Rodrigo Saenz DDS — (305) 652-6969 — 11760 SW 40th St #609, Miami, FL 33175
- Dr. Sergio Vega DDS — (305) 903-7519 — 15802 NW 57th Ave, Miami Lakes, FL 33014
- Dr. Sandy Majestic DDS — (305) 262-8212 — 8159 SW 8th St, Miami, FL 33144
- Honest Dental – Dr. Monica Rodriguez — (305) 642-1234 — 400 SW 27th Ave #101, Miami, FL 33135

DIAGNOSTIC IMAGING / RADIOLOGY:
- Extremity & Open MRI — (833) 674-3668 — 7520 SW 57th Ave Suite A, South Miami, FL 33143
- Vital Medical Imaging — (305) 596-9992 — 7101 SW 99th Ave #106, Miami, FL 33156
- Lakes Radiology — (305) 231-1115 — 14575 NW 77th Ave #100-200, Miami Lakes, FL 33014
- DMI Diagnostic Center — (305) 471-4581 — 8181 NW 36th St #3, Doral, FL 33166
- Me Health Group/IDT Clinic — (561) 288-6153 — 2290 10th Ave N #100, Lake Worth, FL 33461

PRIMARY CARE (BROWARD/PALM BEACH):
- Bermudez Medical Group — (754) 216-2458 — 1604 Town Center Blvd, Weston, FL 33326
- Policlinique de West Palm Beach — (561) 835-4077 — 1447 Medical Park Blvd #204, Wellington, FL 33414
- Patrice M. Torrence Healthcare — (954) 731-0028 — 2701 W Sunrise Blvd, Fort Lauderdale, FL 33311
- Dr. Jerome Obed DO (Dermatology) — (954) 990-6591 — 500 SE 15th St #108, Fort Lauderdale, FL 33316
- East West OB/GYN — (954) 565-7686 — 260 SW 17th Terrace, Fort Lauderdale, FL 33312

OTHER SERVICES:
- Physical Therapy: Action Physical Therapy — (561) 791-9090 — 550 Heritage Dr #150, Jupiter, FL 33458
- Assisted Living: Harmony at the Gables — (786) 353-9812 — 2335 SW 27th Ave, Miami, FL 33145
- Medical Supplies: Med-Plus Inc. — (888) 277-0282 — 3500 NW 112th St, Miami, FL 33167

CANCELLATION & REFUND POLICY:
- Cancel anytime via member portal or calling (305) 884-8740
- Full refund within 30 days of enrollment (less any processing fee)
- After 30 days: cancellation at end of current billing cycle, no further charges
- Payments via Stripe (secure). MediSaver does not store card data.

BECOME A PROVIDER:
- No cost to join the network
- Sign a 1-year provider agreement (renewable annually)
- Offer pre-negotiated discounts (30–75% below standard rates)
- Members pay provider directly — no insurance claims, no delays
- MediSaver markets your clinic to all members
- Download agreement: medisavercard.com/become-a-provider
- Provider agreement: 1-year term, renewable | Confidentiality clause | 30-day termination notice

LEGAL / COMPLIANCE:
- Florida DMPO licensed: medisavercard.com/florida-dmpo-license
- Governed by Florida law, disputes via arbitration in Miami-Dade County, Florida
- Legal disclosure: "This discount plan is not insurance. The plan provides discounts at certain health care providers for medical services. The plan does not make payments directly to providers of medical services. The plan member is obligated to pay for all health care services but will receive a discount from those health care providers who have contracted with the discount plan organization."
- Membership for individuals 18+ residing in the United States
- Fees auto-renew unless cancelled

TESTIMONIALS:
- Jose Martinez, Kendall FL: "After not qualifying for any insurance my wife was in desperate need of medical care. After signing up with MediSaver, she saw a doctor within days. It's been 3 years and my family is very satisfied."
- Susan Griffin, Hollywood FL: "I prefer MediSaver over insurance. Great Doctors, Great Prices. This is the best medical plan I've had the pleasure to be a part of."

WEBSITE PAGES:
- Home: medisavercard.com
- Prices for Members: medisavercard.com/prices-for-members
- About Us: medisavercard.com/about-us
- Medical Providers: medisavercard.com/medical-providers
- Become a Provider: medisavercard.com/become-a-provider
- Pharmacy Discount Card: medisavercard.com/pharmacy-discount-card
- Group Membership Plans: medisavercard.com/group-membership-plans
- Terms & Conditions: medisavercard.com/terms-conditions
- Contact Us: medisavercard.com/contact-us
- Florida DMPO License: medisavercard.com/florida-dmpo-license
- Sign Up (Single): medisavercard.com/register?lid=1
- Sign Up (2 Users): medisavercard.com/register?lid=2
- Sign Up (Family): medisavercard.com/register?lid=3
- Group Sign Up: medisavercard.com/group-membership-plans?lid=4
- Member Login: medisavercard.com/member-login

GROUP PLAN IDEAL INDUSTRIES: Restaurants, salons, barbershops, construction companies, cleaning services, retail stores, small offices, service businesses, any team of 10+.
`;

/* ═══════════════════════════════════════════════════════════
   INTENT & LANGUAGE DETECTION
═══════════════════════════════════════════════════════════ */
function detectIntent(message) {
    const t = message.toLowerCase();
    const intents = [];
    if (/what is|who are|about|explain|how does|como funciona|qu.est|was ist/i.test(t)) intents.push('what_is');
    if (/pric|cost|how much|cuanto|precio|fee|pay|mensual|membership|plan|\$|dinero/i.test(t)) intents.push('pricing');
    if (/doctor|provider|medic|clinic|hospital|find|where|address|hialeah|miami|broward|coral|doral|weston|homestead|cerca|médico|near/i.test(t)) intents.push('providers');
    if (/group|business|employer|employee|empresa|empleado|team|company|restaurant|salon|construction|equipo|negocio/i.test(t)) intents.push('group');
    if (/pharmacy|pharma|prescription|drug|medication|farmacia|rxless|pill|receta|medicament/i.test(t)) intents.push('pharmacy');
    if (/sign up|signup|register|join|inscri|enroll|start|comenzar|inscrire/i.test(t)) intents.push('signup');
    if (/cancel|refund|stop|terminar|cancelar|annul/i.test(t)) intents.push('cancel');
    if (/qualify|eligible|everyone|todos|quién puede|everyone qualif/i.test(t)) intents.push('qualify');
    if (/insurance|seguro|not insurance|no es seguro|assurance/i.test(t)) intents.push('not_insurance');
    if (/contact|phone|call|email|address|hours|horario|teléfono/i.test(t)) intents.push('contact');
    if (/become|provider|join.*doctor|join.*clinic|soy.*médico|doctor.*quiero/i.test(t)) intents.push('become_provider');
    if (/lab|laboratory|blood|test|analisis|cbc|glucose|cholesterol|bloodwork|examen/i.test(t)) intents.push('labs');
    if (/dental|dent|tooth|muela|crown|cleaning|limpieza|root canal/i.test(t)) intents.push('dental');
    if (/xray|x-ray|mri|imaging|ultrasound|radiolog|scan|echo|imagen|ct scan/i.test(t)) intents.push('imaging');
    if (/human|agent|person|talk.*someone|speak.*human|hablar.*persona|escalat/i.test(t)) intents.push('escalate');
    if (/lead|contact me|call me|interested|quiero|i want|me interesa/i.test(t)) intents.push('lead_capture');
    if (/thank|gracias|merci|danke|спасибо/i.test(t)) intents.push('thanks');
    if (/hello|hi |hey|hola|bonjour|ciao|привет|مرحبا|salut|buenos|buenas/i.test(t)) intents.push('greeting');
    if (/testimonial|review|opinion|real|legit|customers say|avis/i.test(t)) intents.push('testimonials');
    if (/vision|eye|optical|optom|vista|ojo/i.test(t)) intents.push('vision');
    if (/orthoped|bone|joint|fractur|ortopedia|hueso/i.test(t)) intents.push('ortho');
    if (/cardio|heart|corazon|cardiac|ecg|echo/i.test(t)) intents.push('cardio');
    if (/pediatric|child|kid|niño|bebe|baby|children/i.test(t)) intents.push('pediatric');
    if (/psychiatr|mental|anxiety|depression|psiquiatri|mental health/i.test(t)) intents.push('mental_health');
    return intents.length ? intents : ['general'];
}

function detectLanguage(message) {
    if (/[áéíóúñ¿¡]/i.test(message) || /\b(qué|cómo|cuánto|el|la|de|en|es|un|para|con|que|su|los|las|quiero|necesito|tengo|donde|como)\b/i.test(message)) return 'es';
    if (/[àâçèêëîïôùûü]/i.test(message) || /\b(je|vous|est|les|des|que|pour|avec|une|dans|bonjour|comment)\b/i.test(message)) return 'fr';
    if (/[ãõ]/i.test(message) || /\b(você|são|uma|para|com|não|que|por|mais|como|preciso)\b/i.test(message)) return 'pt';
    if (/[äöü]/i.test(message) || /\b(ist|und|die|der|das|ein|ich|sie|nicht|wie)\b/i.test(message)) return 'de';
    if (/[\u4e00-\u9fff]/.test(message)) return 'zh';
    if (/[\u0600-\u06ff]/.test(message)) return 'ar';
    if (/[\u0400-\u04ff]/.test(message)) return 'ru';
    if (/\b(mwen|nou|ki|kijan|kote|medikaman)\b/i.test(message)) return 'ht';
    return 'en';
}

/* ═══════════════════════════════════════════════════════════
   OPENAI CHAT ENDPOINT
═══════════════════════════════════════════════════════════ */
app.post('/api/chat', async (req, res) => {
    const { message, sessionId, conversationHistory = [], leadInfo = {} } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const lang = detectLanguage(message);
    const intents = detectIntent(message);

    // Analytics
    const analytics = readJSON(ANALYTICS_FILE, { sessions: {}, intents: {}, messages: 0 });
    analytics.messages = (analytics.messages || 0) + 1;
    analytics.sessions[sessionId] = (analytics.sessions[sessionId] || 0) + 1;
    intents.forEach(i => analytics.intents[i] = (analytics.intents[i] || 0) + 1);
    writeJSON(ANALYTICS_FILE, analytics);

    // Conversations
    const conversations = readJSON(CONVERSATIONS_FILE, {});
    if (!conversations[sessionId]) conversations[sessionId] = { messages: [], startTime: new Date().toISOString(), lang };
    conversations[sessionId].messages.push({ role: 'user', content: message, ts: new Date().toISOString() });
    writeJSON(CONVERSATIONS_FILE, conversations);

    const systemPrompt = `You are MediSaver's professional AI health advisor — a warm, knowledgeable, human-like assistant for MediSaverCard.com, a Florida-licensed medical discount plan.

ABSOLUTE RULES:
1. NEVER say MediSaver is insurance. It is a medical discount plan (NOT insurance).
2. ALL answers must come ONLY from the knowledge base. Never invent facts.
3. Be warm, human, empathetic — like a knowledgeable friend who understands healthcare costs.
4. ALWAYS respond in the SAME LANGUAGE the user writes in. Detected language: ${lang}.
5. Always end with a clear, encouraging call-to-action.
6. Never give medical advice — always redirect health questions to their doctor.
7. Quote EXACT prices from the knowledge base when asked.
8. Mention FREE 30-day trial when discussing sign-up.
9. Keep responses conversational (3-8 sentences) unless detailed pricing is needed.
10. For group leads, ask: team size, industry, contact person.
11. Upsell naturally: individual → mention family plan; single inquiry → mention pharmacy card.
12. For escalation/upset user: immediately provide (305) 884-8740 and info@medisavercard.com.
13. Format responses clearly — use bullet points for price lists, keep paragraphs short.
14. Sound like a caring healthcare concierge, not a robot or sales script.

DETECTED INTENT: ${intents.join(', ')}
DETECTED LANGUAGE: ${lang}

${MEDISAVER_KB}

LEAD QUALIFICATION: If purchase intent detected, collect naturally: 1) Individual or business? 2) How many people? 3) Name/email/phone for follow-up.

ESCALATION: If user is upset or needs urgent help: "I completely understand — let me connect you with our team right away. Call (305) 884-8740 or email info@medisavercard.com. Hours: Mon–Fri 8:30am–5:30pm, Sat 9am–12pm."

ALWAYS use exact facts, prices, and doctor names from the knowledge base. If something is not in the knowledge base, say "Please call us at (305) 884-8740 for the most current information."`;

    try {
        const OPENAI_KEY = process.env.OPENAI_API_KEY;
        if (!OPENAI_KEY || OPENAI_KEY === 'your_openai_api_key_here') {
            throw new Error('API key not configured');
        }

        const openaiMessages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: message }
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                max_tokens: 900,
                temperature: 0.65,
                messages: openaiMessages
            })
        });

        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error?.message || `API ${response.status}`);

        const aiResponse = data.choices?.[0]?.message?.content
            || 'Please call us at (305) 884-8740 for assistance.';

        conversations[sessionId].messages.push({ role: 'assistant', content: aiResponse, ts: new Date().toISOString() });
        writeJSON(CONVERSATIONS_FILE, conversations);

        const needsLeadCapture = intents.some(i => ['lead_capture', 'signup', 'group'].includes(i)) ||
            /interested|want to join|sign me up|how do i start|quiero unirme/i.test(message);
        const shouldEscalate = intents.includes('escalate') ||
            /urgent|emergency|angry|frustrated|complaint/i.test(message);

        res.json({ response: aiResponse, intents, lang, needsLeadCapture, shouldEscalate, sessionId });

    } catch (err) {
        console.error('API Error:', err.message);
        res.json({ response: getFallback(intents, lang), intents, lang, sessionId, fallback: true });
    }
});

/* ═══════════════════════════════════════════════════════════
   FALLBACK RESPONSES
═══════════════════════════════════════════════════════════ */
function getFallback(intents, lang) {
    const i = intents[0];
    const R = {
        en: {
            pricing: 'MediSaver plans: Single $30/month (first month $70) | 2 Users $40/month ($80 first) | Family up to 5 $55/month ($95 first) | Group 10+ $20/person/month. All plans include doctor access, discounted prices, and a FREE pharmacy card. Try FREE 30 days at medisavercard.com!',
            providers: 'Our primary provider is Wellness Therapy & Medical Care Center — (305) 827-0208, Miami Lakes. We have 60+ providers across Miami-Dade, Broward & Palm Beach. Full list at medisavercard.com/medical-providers.',
            pharmacy: 'FREE pharmacy discount card via RxLess — save 80–88% on prescriptions at 70,000+ pharmacies (CVS, Walgreens, Walmart, Publix). Download at medisavercard.com/pharmacy-discount-card. RxLess Support: 1-844-479-5377.',
            group: '$20/person/month for teams of 10+. No contracts, no setup fees. Includes doctor visits, labs, imaging & dental discounts. Digital cards issued immediately. Sign up: medisavercard.com/group-membership-plans',
            dental: 'Dental prices: Exam FREE | Adult cleaning $49 | Root canal anterior $395 | Bicuspid $495 | Molar $595 | Crown porcelain $495 | Extraction $60 | Implant+crown $1,950. Visit medisavercard.com/prices-for-members for full list.',
            labs: 'Lab prices: CBC $20 | Cholesterol $7 | HbA1C $9.50 | TSH $14.60 | HIV Screen $9.50 | Vitamin D $33.50 | Urinalysis $2 | Lipid Panel $9 | Pregnancy Test $6.50 | Obstetric Panel $45.23.',
            imaging: 'Imaging: X-rays all $25 | Ultrasounds $50–70 | MRI from $275 | CT from $150 | Echo $150. Providers: Extremity & Open MRI (833) 674-3668 | Lakes Radiology (305) 231-1115.',
            contact: 'Phone: (305) 884-8740 | Email: info@medisavercard.com | 5901 NW 151st St, Miami Lakes, FL | Mon–Fri 8:30am–5:30pm | Sat 9am–12pm | medisavercard.com',
            not_insurance: 'MediSaver is NOT insurance. It is a Florida-licensed medical discount plan under Chapter 636 Part II. Members pay providers directly at discounted rates. MediSaver does not pay providers or process claims.',
            general: 'Welcome to MediSaver! We are a Florida-licensed medical discount plan — NOT insurance. Plans from $30/month, FREE pharmacy card, 60+ providers across South Florida. Everyone qualifies! Try FREE 30 days at medisavercard.com or call (305) 884-8740.'
        },
        es: {
            pricing: 'Planes MediSaver: Individual $30/mes (primer mes $70) | 2 Usuarios $40/mes ($80 primero) | Familia hasta 5 personas $55/mes ($95 primero) | Grupal 10+ empleados $20/persona/mes. ¡Pruebe GRATIS 30 días en medisavercard.com!',
            providers: 'Nuestro proveedor principal es Wellness Therapy & Medical Care Center — (305) 827-0208, Miami Lakes. Tenemos más de 60 proveedores en Miami-Dade, Broward y Palm Beach. Lista completa en medisavercard.com/medical-providers.',
            pharmacy: 'Tarjeta GRATUITA de descuento para farmacias (RxLess) — ahorre 80–88% en medicamentos en más de 70,000 farmacias. Descárguela en medisavercard.com/pharmacy-discount-card.',
            group: '$20/persona/mes para grupos de 10+. Sin contratos ni cuotas de inicio. Incluye visitas al médico, laboratorios, imágenes y descuentos dentales. Inscríbase en medisavercard.com/group-membership-plans',
            contact: 'Teléfono: (305) 884-8740 | Email: info@medisavercard.com | 5901 NW 151st St, Miami Lakes, FL | Lun–Vie 8:30am–5:30pm | Sáb 9am–12pm',
            general: '¡Bienvenido a MediSaver! Somos un plan de descuentos médicos con licencia de Florida — NO es seguro médico. Planes desde $30/mes, tarjeta de farmacia GRATIS, más de 60 proveedores en el sur de la Florida. ¡Todos califican! Pruebe GRATIS 30 días en medisavercard.com.'
        },
        fr: {
            general: 'Bienvenue chez MediSaver! Nous sommes un plan de réduction médicale agréé en Floride — PAS une assurance. Plans à partir de $30/mois, carte pharmacie GRATUITE, 60+ prestataires en Floride du Sud. Essayez GRATUITEMENT 30 jours sur medisavercard.com ou appelez le (305) 884-8740.'
        },
        pt: {
            general: 'Bem-vindo ao MediSaver! Somos um plano de desconto médico licenciado na Flórida — NÃO é seguro. Planos a partir de $30/mês, cartão de farmácia GRATUITO, 60+ prestadores no Sul da Flórida. Experimente GRÁTIS por 30 dias em medisavercard.com.'
        }
    };
    const langR = R[lang] || R['en'];
    return langR[i] || langR['general'];
}

/* ═══════════════════════════════════════════════════════════
   LEAD CAPTURE
═══════════════════════════════════════════════════════════ */
app.post('/api/leads', (req, res) => {
    const { name, email, phone, type, notes, sessionId, lang, timestamp } = req.body;
    if (!email && !phone) return res.status(400).json({ error: 'Email or phone required' });
    const leads = readJSON(LEADS_FILE, []);
    const lead = { id: Date.now(), name: name || 'Unknown', email: email || '', phone: phone || '', type: type || 'individual', notes: notes || '', sessionId, lang, timestamp: timestamp || new Date().toISOString(), status: 'new' };
    leads.push(lead);
    writeJSON(LEADS_FILE, leads);
    console.log(`📧 NEW LEAD: ${lead.name} | ${lead.email} | ${lead.phone} | ${lead.type}`);
    res.json({ success: true, leadId: lead.id });
});

/* ═══════════════════════════════════════════════════════════
   ANALYTICS
═══════════════════════════════════════════════════════════ */
app.get('/api/analytics', (req, res) => {
    const analytics = readJSON(ANALYTICS_FILE, { sessions: {}, intents: {}, messages: 0 });
    const leads = readJSON(LEADS_FILE, []);
    const conversations = readJSON(CONVERSATIONS_FILE, {});
    res.json({
        totalMessages: analytics.messages,
        totalSessions: Object.keys(analytics.sessions).length,
        totalLeads: leads.length,
        topIntents: Object.entries(analytics.intents).sort((a, b) => b[1] - a[1]).slice(0, 10),
        recentLeads: leads.slice(-10).reverse(),
        conversations: Object.entries(conversations).slice(-5).map(([id, c]) => ({ id, messages: c.messages.length, lang: c.lang, start: c.startTime }))
    });
});

/* ═══════════════════════════════════════════════════════════
   LEADS CSV EXPORT
═══════════════════════════════════════════════════════════ */
app.get('/api/leads/export', (req, res) => {
    const leads = readJSON(LEADS_FILE, []);
    const csv = ['ID,Name,Email,Phone,Type,Notes,Lang,Timestamp,Status',
        ...leads.map(l => `${l.id},"${l.name}","${l.email}","${l.phone}","${l.type}","${(l.notes || '').replace(/"/g, '""')}","${l.lang || 'en'}","${l.timestamp}","${l.status}"`)
    ].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=medisaver-leads.csv');
    res.send(csv);
});

function healthJson() {
    return { status: 'operational', service: 'MediSaver AI', timestamp: new Date().toISOString() };
}
app.get('/api/health', (req, res) => res.json(healthJson()));
app.get('/health', (req, res) => res.json(healthJson()));

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n✅ MediSaver AI Chatbot running: http://localhost:${PORT}`);
        console.log(`🔑 API Key: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing — add to backend/.env'}\n`);
    });
}

module.exports = app;