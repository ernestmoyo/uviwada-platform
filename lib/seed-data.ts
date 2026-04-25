import type { QualityRating } from './types/database'

export interface SeedCentre {
  lat: number
  lng: number
  name: string
  ward: string
  district: string
  quality: QualityRating
  children: number
}

// Lifted verbatim from demo-static-backup/app.js:204 — preserves the exact
// member set the panel saw in the submitted prototype. Districts inferred
// from the wards (Vingunguti/Manzese/Tabata/Kariakoo/Ilala → Ilala;
// Kinondoni/Mikocheni → Kinondoni; Temeke/Mbagala/Kurasini → Temeke;
// Kigamboni → Kigamboni).
export const SEED_CENTRES: SeedCentre[] = [
  { lat: -6.845, lng: 39.255, name: 'Mama Amina Daycare', ward: 'Vingunguti', district: 'Ilala', quality: 'green', children: 28 },
  { lat: -6.852, lng: 39.248, name: 'Bright Stars Centre', ward: 'Vingunguti', district: 'Ilala', quality: 'amber', children: 18 },
  { lat: -6.838, lng: 39.261, name: 'Tumaini Daycare', ward: 'Vingunguti', district: 'Ilala', quality: 'green', children: 32 },
  { lat: -6.795, lng: 39.235, name: 'Furaha Kids', ward: 'Manzese', district: 'Ilala', quality: 'green', children: 22 },
  { lat: -6.788, lng: 39.242, name: 'Manzese Community Care', ward: 'Manzese', district: 'Ilala', quality: 'red', children: 35 },
  { lat: -6.801, lng: 39.229, name: 'Neema Daycare', ward: 'Manzese', district: 'Ilala', quality: 'amber', children: 15 },
  { lat: -6.865, lng: 39.295, name: 'Upendo Centre', ward: 'Temeke', district: 'Temeke', quality: 'green', children: 26 },
  { lat: -6.872, lng: 39.288, name: 'Temeke Stars', ward: 'Temeke', district: 'Temeke', quality: 'amber', children: 20 },
  { lat: -6.858, lng: 39.302, name: 'Baraka Daycare', ward: 'Temeke', district: 'Temeke', quality: 'green', children: 24 },
  { lat: -6.89, lng: 39.28, name: 'Mbagala Kids Hub', ward: 'Mbagala', district: 'Temeke', quality: 'red', children: 40 },
  { lat: -6.896, lng: 39.273, name: 'Sunrise Daycare', ward: 'Mbagala', district: 'Temeke', quality: 'amber', children: 19 },
  { lat: -6.884, lng: 39.287, name: 'Amani Centre', ward: 'Mbagala', district: 'Temeke', quality: 'green', children: 30 },
  { lat: -6.818, lng: 39.27, name: 'Kariakoo Little Ones', ward: 'Kariakoo', district: 'Ilala', quality: 'green', children: 16 },
  { lat: -6.823, lng: 39.265, name: 'City Kids Care', ward: 'Kariakoo', district: 'Ilala', quality: 'amber', children: 22 },
  { lat: -6.77, lng: 39.26, name: 'Kinondoni Daycare', ward: 'Kinondoni', district: 'Kinondoni', quality: 'green', children: 25 },
  { lat: -6.765, lng: 39.255, name: 'Bahari Kids', ward: 'Kinondoni', district: 'Kinondoni', quality: 'green', children: 21 },
  { lat: -6.778, lng: 39.268, name: 'Tumaini wa Watoto', ward: 'Kinondoni', district: 'Kinondoni', quality: 'amber', children: 27 },
  { lat: -6.825, lng: 39.25, name: 'Ilala Community Care', ward: 'Ilala', district: 'Ilala', quality: 'green', children: 23 },
  { lat: -6.83, lng: 39.242, name: 'Nyota Daycare', ward: 'Ilala', district: 'Ilala', quality: 'red', children: 38 },
  { lat: -6.85, lng: 39.32, name: 'Kigamboni Stars', ward: 'Kigamboni', district: 'Kigamboni', quality: 'amber', children: 17 },
  { lat: -6.856, lng: 39.315, name: 'Pwani Kids', ward: 'Kigamboni', district: 'Kigamboni', quality: 'green', children: 20 },
  { lat: -6.81, lng: 39.22, name: 'Tabata Daycare', ward: 'Tabata', district: 'Ilala', quality: 'green', children: 29 },
  { lat: -6.78, lng: 39.28, name: 'Mikocheni Little Stars', ward: 'Mikocheni', district: 'Kinondoni', quality: 'green', children: 14 },
  { lat: -6.875, lng: 39.26, name: 'Kurasini Kids', ward: 'Kurasini', district: 'Temeke', quality: 'amber', children: 33 }
]

export const QUALITY_COLOURS: Record<QualityRating, string> = {
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444'
}

export const DISTRICT_COLOURS: Record<string, string> = {
  Kinondoni: '#1A5FAA',
  Ilala: '#E67E22',
  Temeke: '#2E86C1',
  Kigamboni: '#5BAA4A',
  Ubungo: '#8E44AD'
}

export const WARDS_BY_DISTRICT: Record<string, string[]> = {
  Kinondoni: ['Kinondoni', 'Mikocheni', 'Magomeni', 'Ndugumbi', 'Mwananyamala'],
  Ilala: ['Ilala', 'Vingunguti', 'Kariakoo', 'Tabata', 'Manzese', 'Buguruni'],
  Temeke: ['Temeke', 'Mbagala', 'Kurasini', 'Chang\'ombe'],
  Kigamboni: ['Kigamboni', 'Kibada', 'Tungi'],
  Ubungo: ['Ubungo', 'Kimara', 'Sinza', 'Kibamba']
}

export const SIX_DIMENSIONS = [
  { code: 'infrastructure', sw: 'Miundombinu', en: 'Infrastructure' },
  { code: 'staffing', sw: 'Wafanyakazi', en: 'Staffing' },
  { code: 'curriculum', sw: 'Mtaala', en: 'Curriculum' },
  { code: 'health_hygiene', sw: 'Afya na Usafi', en: 'Health & Hygiene' },
  { code: 'safeguarding', sw: 'Ulinzi wa Mtoto', en: 'Safeguarding' },
  { code: 'nutrition', sw: 'Lishe', en: 'Nutrition' }
] as const

export const SIX_TRAININGS = [
  { category: 'safeguarding', title_sw: 'Ulinzi wa Mtoto - Mafunzo ya Ufuatiliaji', title_en: 'Child Safeguarding Refresher' },
  { category: 'curriculum', title_sw: 'Misingi ya Mtaala wa Malezi', title_en: 'ECCE Curriculum Basics' },
  { category: 'nutrition', title_sw: 'Lishe ya Watoto Chini ya Miaka 5', title_en: 'Nutrition for Under-5s' },
  { category: 'health_hygiene', title_sw: 'Huduma ya Kwanza na Usafi', title_en: 'First Aid & Hygiene' },
  { category: 'curriculum', title_sw: 'Michezo Inayojumuisha Wote', title_en: 'Inclusive Play' },
  { category: 'staffing', title_sw: 'Ushirikiano na Wazazi', title_en: 'Parent Engagement' }
] as const

export const FALLBACK_DASHBOARD = {
  uviwada: {
    totalMembers: 147,
    activeCentres: 132,
    avgQualityPct: 68,
    trainingsCompleted: 24,
    qualityDistribution: { green: 67, amber: 23, red: 10 },
    membershipGrowth: {
      labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
      data: [82, 89, 95, 104, 112, 118, 128, 139, 147]
    }
  },
  cic: {
    nmecdpTracked: '12/15',
    centresImproved: 67,
    childrenImpacted: 2840,
    donorReports: 4,
    indicators: [
      { label_sw: 'Ufikiaji wa watoto chini ya 6', label_en: 'Access for children under 6', status: 'green' as QualityRating, value: '78%' },
      { label_sw: 'Watoa huduma waliofunzwa', label_en: 'Trained caregivers', status: 'green' as QualityRating, value: '82%' },
      { label_sw: 'Vituo vyenye leseni', label_en: 'Licensed centres', status: 'amber' as QualityRating, value: '54%' },
      { label_sw: 'Uwiano wa mtoto-mlezi', label_en: 'Child-caregiver ratio', status: 'green' as QualityRating, value: '1:12' },
      { label_sw: 'Miundombinu ya WASH', label_en: 'WASH infrastructure', status: 'red' as QualityRating, value: '38%' },
      { label_sw: 'Lishe na afya', label_en: 'Nutrition & health', status: 'amber' as QualityRating, value: '61%' }
    ]
  }
}
