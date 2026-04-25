// 30-item ECCE quality checklist — 6 dimensions × 5 items.
// Items are indicative drafts to be aligned with NMECDP standards
// during the inception phase of the engagement.

import type { QualityDimension, QualityRating } from './types/database'

export interface ChecklistItem {
  code: string
  dimension: QualityDimension
  sw: string
  en: string
}

export const CHECKLIST: ChecklistItem[] = [
  // Infrastructure
  { code: 'inf01', dimension: 'infrastructure', sw: 'Eneo la nje ni salama na limefungwa', en: 'Outdoor area is fenced and safe' },
  { code: 'inf02', dimension: 'infrastructure', sw: 'Choo cha kutosha kwa watoto', en: 'Adequate child-friendly toilets' },
  { code: 'inf03', dimension: 'infrastructure', sw: 'Maji safi yanapatikana', en: 'Clean water available on site' },
  { code: 'inf04', dimension: 'infrastructure', sw: 'Vitanda/sehemu za kupumzika ni safi', en: 'Beds / rest area are clean' },
  { code: 'inf05', dimension: 'infrastructure', sw: 'Umeme/wala mwanga wa kutosha', en: 'Adequate electricity / lighting' },

  // Staffing
  { code: 'stf01', dimension: 'staffing', sw: 'Uwiano wa mlezi:mtoto unafuatwa', en: 'Caregiver:child ratio meets standard' },
  { code: 'stf02', dimension: 'staffing', sw: 'Walezi wamepata mafunzo ya msingi', en: 'Caregivers have basic training' },
  { code: 'stf03', dimension: 'staffing', sw: 'Mhudumu mmoja angalau ana huduma ya kwanza', en: 'At least one first-aid trained staff' },
  { code: 'stf04', dimension: 'staffing', sw: 'Mahudhurio ya wafanyakazi yanafuatiliwa', en: 'Staff attendance is tracked' },
  { code: 'stf05', dimension: 'staffing', sw: 'Mikataba ya wafanyakazi ipo', en: 'Staff contracts in place' },

  // Curriculum
  { code: 'cur01', dimension: 'curriculum', sw: 'Mpango wa kila siku unafuatwa', en: 'Daily activity plan in use' },
  { code: 'cur02', dimension: 'curriculum', sw: 'Kuna vifaa vya kucheza vinavyofaa umri', en: 'Age-appropriate play materials available' },
  { code: 'cur03', dimension: 'curriculum', sw: 'Watoto wanapata muda wa michezo ya nje', en: 'Children get outdoor play time' },
  { code: 'cur04', dimension: 'curriculum', sw: 'Vitabu vya hadithi vinatumika', en: 'Story books are used regularly' },
  { code: 'cur05', dimension: 'curriculum', sw: 'Maendeleo ya mtoto yanaandikwa', en: 'Child development is documented' },

  // Health & Hygiene
  { code: 'hyg01', dimension: 'health_hygiene', sw: 'Watoto wananawa mikono kabla ya chakula', en: 'Children wash hands before meals' },
  { code: 'hyg02', dimension: 'health_hygiene', sw: 'Joto la mtoto hupimwa anapougua', en: 'Temperature checked when child is unwell' },
  { code: 'hyg03', dimension: 'health_hygiene', sw: 'Sanduku la huduma ya kwanza linapatikana', en: 'First aid kit available and stocked' },
  { code: 'hyg04', dimension: 'health_hygiene', sw: 'Uchafu unaondolewa kila siku', en: 'Daily waste is removed properly' },
  { code: 'hyg05', dimension: 'health_hygiene', sw: 'Sebule/madarasa yanapata hewa safi', en: 'Rooms are well ventilated' },

  // Safeguarding
  { code: 'saf01', dimension: 'safeguarding', sw: 'Sera ya ulinzi wa mtoto imewekwa', en: 'Child protection policy displayed' },
  { code: 'saf02', dimension: 'safeguarding', sw: 'Wafanyakazi wamesoma sera hiyo', en: 'Staff have read the policy' },
  { code: 'saf03', dimension: 'safeguarding', sw: 'Utaratibu wa kuripoti matukio upo', en: 'Incident reporting procedure in place' },
  { code: 'saf04', dimension: 'safeguarding', sw: 'Walezi wamechunguzwa kabla ya kuajiriwa', en: 'Staff vetted before hiring' },
  { code: 'saf05', dimension: 'safeguarding', sw: 'Kuna utaratibu wa kuwasili na kuondoka kwa mtoto', en: 'Child drop-off / pick-up procedure exists' },

  // Nutrition
  { code: 'nut01', dimension: 'nutrition', sw: 'Mlo wa watoto umepangwa', en: 'Daily meal plan exists' },
  { code: 'nut02', dimension: 'nutrition', sw: 'Watoto wanapata chakula chenye lishe', en: 'Children receive nutritious meals' },
  { code: 'nut03', dimension: 'nutrition', sw: 'Vifaa vya kupika ni safi', en: 'Cooking utensils are clean' },
  { code: 'nut04', dimension: 'nutrition', sw: 'Maji ya kunywa yanapatikana wakati wote', en: 'Drinking water available throughout the day' },
  { code: 'nut05', dimension: 'nutrition', sw: 'Mzio wa watoto unafahamika', en: 'Child food allergies are documented' }
]

export const DIMENSIONS: Array<{ code: QualityDimension; sw: string; en: string }> = [
  { code: 'infrastructure', sw: 'Miundombinu', en: 'Infrastructure' },
  { code: 'staffing', sw: 'Wafanyakazi', en: 'Staffing' },
  { code: 'curriculum', sw: 'Mtaala', en: 'Curriculum' },
  { code: 'health_hygiene', sw: 'Afya na Usafi', en: 'Health & Hygiene' },
  { code: 'safeguarding', sw: 'Ulinzi wa Mtoto', en: 'Safeguarding' },
  { code: 'nutrition', sw: 'Lishe', en: 'Nutrition' }
]

export function ratingFromScore(passedCount: number, maxCount = 30): QualityRating {
  const pct = (passedCount / maxCount) * 100
  if (pct >= 80) return 'green'
  if (pct >= 60) return 'amber'
  return 'red'
}
