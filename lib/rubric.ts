// Configurable quality rubric — the single, data-driven definition of the
// UVIWATA daycare quality instrument actually used in the field (the same one
// that produced the 234-centre baseline). Pure module: safe on client + server.
//
// Two scored domains:
//   • Careworker capacity — 13 competencies, each scored 1–4.
//   • Infrastructure       — 14 sub-domains, each scored Level 1–4.
// Domain scores roll up to an infrastructure TIER and a formalization pathway.
//
// V2 requirement: "the assessment criteria should be configurable … without
// requiring major system redevelopment." Editing this file reconfigures the
// rubric everywhere (assessment form, dashboard, scoring) — no schema change.

import type { QualityRating } from './types/database'

export type RubricLevel = 1 | 2 | 3 | 4

export interface RubricItem {
  key: string
  en: string
  sw: string
  /** optional helper criteria shown under the item */
  hint_en?: string
}

// ---- 13 careworker-capacity competencies (1–4) ------------------------------
export const CAPACITY_COMPETENCIES: RubricItem[] = [
  { key: 'cap01', en: 'Understanding & assessing child development milestones', sw: 'Kuelewa na kutathmini hatua za ukuaji wa mtoto' },
  { key: 'cap02', en: 'Responsive communication & language development', sw: 'Mawasiliano yanayoitikia na ukuzaji wa lugha' },
  { key: 'cap03', en: 'Child-centred & play-based learning facilitation', sw: 'Ujifunzaji unaomlenga mtoto na unaotumia michezo' },
  { key: 'cap04', en: 'Peer learning & social-emotional development support', sw: 'Ujifunzaji wa wenzao na ukuaji wa kihisia-kijamii' },
  { key: 'cap05', en: 'Supporting individual child needs & inclusion', sw: 'Kusaidia mahitaji ya mtoto mmoja mmoja na ujumuishaji' },
  { key: 'cap06', en: 'Organising learning environment & resource development', sw: 'Kuandaa mazingira ya kujifunzia na rasilimali' },
  { key: 'cap07', en: 'Facilitating experiential learning', sw: 'Kuwezesha ujifunzaji wa vitendo' },
  { key: 'cap08', en: 'Family & parent engagement', sw: 'Ushirikishwaji wa familia na wazazi' },
  { key: 'cap09', en: 'Observation, documentation & child progress monitoring', sw: 'Uchunguzi, kumbukumbu na ufuatiliaji wa maendeleo ya mtoto' },
  { key: 'cap10', en: 'Care for individual child psychosocial needs', sw: 'Kuhudumia mahitaji ya kisaikolojia ya mtoto mmoja mmoja' },
  { key: 'cap11', en: 'Child protection, safety & wellbeing', sw: 'Ulinzi wa mtoto, usalama na ustawi' },
  { key: 'cap12', en: 'Supporting children with disabilities / special needs', sw: 'Kuwasaidia watoto wenye ulemavu / mahitaji maalum' },
  { key: 'cap13', en: 'Reflective practice & continuous improvement', sw: 'Tafakari ya kazi na uboreshaji endelevu' }
]

// ---- 14 infrastructure sub-domains (Level 1–4) ------------------------------
export const INFRA_SUBDOMAINS: RubricItem[] = [
  { key: 'location', en: 'Location & surrounding safety', sw: 'Eneo na usalama wa mazingira', hint_en: 'Acceptable to community, approved by LGA, secure premises' },
  { key: 'building', en: 'Building structure, ventilation & lighting', sw: 'Muundo wa jengo, hewa na mwanga', hint_en: 'Sturdy, well-ventilated, adequate light, no barriers' },
  { key: 'office', en: 'Office space', sw: 'Nafasi ya ofisi', hint_en: 'Space, equipment, filing, privacy, cleanliness' },
  { key: 'indoor', en: 'Indoor space, facilities & equipment', sw: 'Nafasi ya ndani, vifaa na zana', hint_en: 'Safe covered play space, learning corners, visuals' },
  { key: 'outdoor', en: 'Outdoor space, facilities & equipment', sw: 'Nafasi ya nje, vifaa na zana', hint_en: 'Safe, adequate, accessible outdoor play equipment' },
  { key: 'materials', en: 'Play & learning materials', sw: 'Vifaa vya kuchezea na kujifunzia', hint_en: 'Variety, age-appropriate, safe, well organised' },
  { key: 'fencing', en: 'Fence / enclosure & access control', sw: 'Uzio na udhibiti wa kuingia/kutoka', hint_en: 'Encloses children, controlled movement, safe construction' },
  { key: 'sleeping', en: "Children's day sleeping facilities", sw: 'Maeneo ya kulala mchana kwa watoto', hint_en: 'Provision, safe equipment, arrangement' },
  { key: 'records', en: 'Record keeping, privacy & confidentiality', sw: 'Utunzaji kumbukumbu, faragha na usiri', hint_en: 'Registration, incident, visitor, referral, progress records' },
  { key: 'furniture', en: 'Furniture & surroundings', sw: 'Samani na mazingira', hint_en: 'Child-sized seating, shelves, staff furniture' },
  { key: 'toilets', en: 'Toilets & sanitation', sw: 'Vyoo na usafi wa mazingira', hint_en: 'Clean, gender-separated, handwashing, wastewater' },
  { key: 'water', en: 'Safe & clean water', sw: 'Maji safi na salama', hint_en: 'Reliable supply, storage, safe drinking water' },
  { key: 'safety', en: 'Safety & security', sw: 'Usalama na ulinzi', hint_en: 'First aid, communication, emergency prep, supervision' },
  { key: 'nutrition', en: 'Food hygiene & nutrition', sw: 'Usafi wa chakula na lishe', hint_en: 'Designated cook, kitchen facilities, meal planning' }
]

export const SCORE_LEVELS: Array<{ value: RubricLevel; en: string; sw: string }> = [
  { value: 1, en: 'Level 1 — Below standard', sw: 'Ngazi 1 — Chini ya kiwango' },
  { value: 2, en: 'Level 2 — Emerging', sw: 'Ngazi 2 — Inachipukia' },
  { value: 3, en: 'Level 3 — Functional', sw: 'Ngazi 3 — Inafanya kazi' },
  { value: 4, en: 'Level 4 — Highest standard', sw: 'Ngazi 4 — Kiwango cha juu' }
]

// ---- tier model (thresholds derived empirically from the 234-centre data) ---
// infra_score is the 0–100 composite. Observed bands in the field data:
//   Level 2: 34–49 · Level 3: 50–74 · Level 4: 75–95.
export type RubricTier = 'Level 2' | 'Level 3' | 'Level 4'

export interface TierDef {
  tier: RubricTier
  label: string
  sw: string
  minScore: number // inclusive, on the 0–100 composite
  traffic: QualityRating
  pathway: string
}

export const TIERS: TierDef[] = [
  {
    tier: 'Level 4',
    label: 'Level 4 — Highest Intended Standard',
    sw: 'Ngazi 4 — Kiwango cha Juu Kinacholengwa',
    minScore: 75,
    traffic: 'green',
    pathway: 'Standard pathway: centre may be considered for full registration'
  },
  {
    tier: 'Level 3',
    label: 'Level 3 — Functional Standard',
    sw: 'Ngazi 3 — Kiwango cha Utendaji',
    minScore: 50,
    traffic: 'amber',
    pathway: 'Centre may qualify for operational recognition with continued improvement'
  },
  {
    tier: 'Level 2',
    label: 'Level 2 — Entry-Level / Emerging Standard',
    sw: 'Ngazi 2 — Kiwango cha Mwanzo / Kinachochipukia',
    minScore: 0,
    traffic: 'red',
    pathway: 'Centre may be considered for provisional recognition or conditional support'
  }
]

/** Mean of a set of 1–4 scores (ignores null/blank). Returns null if none. */
export function meanLevel(scores: Array<number | null | undefined>): number | null {
  const xs = scores.filter((s): s is number => typeof s === 'number' && Number.isFinite(s))
  if (!xs.length) return null
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

/** Convert a 1–4 mean to the 0–100 composite used for tiering. */
export function levelToScore(mean1to4: number): number {
  return Math.round(((mean1to4 - 1) / 3) * 100)
}

/** Resolve a tier from the 0–100 composite. */
export function tierForScore(score0to100: number): TierDef {
  return TIERS.find((t) => score0to100 >= t.minScore) ?? TIERS[TIERS.length - 1]
}

/** Resolve a tier directly from a 1–4 infrastructure mean. */
export function tierForInfraMean(mean1to4: number): TierDef {
  return tierForScore(levelToScore(mean1to4))
}

/** Map a stored tier label (any of the long forms) to a traffic light. */
export function tierLabelToTrafficLight(tierLabel: string | null | undefined): QualityRating {
  if (!tierLabel) return 'amber'
  if (tierLabel.includes('Level 4')) return 'green'
  if (tierLabel.includes('Level 3')) return 'amber'
  return 'red'
}

export const RUBRIC_VERSION = '2026.06-baseline'
