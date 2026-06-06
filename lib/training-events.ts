// Sample upcoming training sessions for the public training calendar.
// These are illustrative events representing the programme UVIWATA is building.
// They do NOT reflect confirmed schedules — dates and details are subject to change.

export interface TrainingEvent {
  id: string
  title_en: string
  title_sw: string
  date: string          // ISO date string e.g. "2026-07-15"
  time_en: string       // e.g. "9:00 AM – 1:00 PM"
  time_sw: string
  category_en: string
  category_sw: string
  location_en: string
  location_sw: string
  description_en: string
  description_sw: string
}

export const TRAINING_EVENTS: TrainingEvent[] = [
  {
    id: 'trn-001',
    title_en: 'Child Safeguarding & Protection Fundamentals',
    title_sw: 'Misingi ya Ulinzi na Usalama wa Mtoto',
    date: '2026-07-08',
    time_en: '9:00 AM – 1:00 PM',
    time_sw: '9:00 asubuhi – 1:00 mchana',
    category_en: 'Safeguarding',
    category_sw: 'Ulinzi wa Mtoto',
    location_en: 'Kinondoni Community Hall, Dar es Salaam',
    location_sw: 'Ukumbi wa Jamii Kinondoni, Dar es Salaam',
    description_en:
      'An introduction to child safeguarding obligations for daycare owners and caregivers — covering mandatory reporting, safe environments, and the UVIWATA Code of Conduct.',
    description_sw:
      'Utangulizi wa wajibu wa ulinzi wa mtoto kwa wamiliki wa vituo na walezi — unashughulikia taarifa za lazima, mazingira salama, na Kanuni ya Maadili ya UVIWATA.',
  },
  {
    id: 'trn-002',
    title_en: 'Quality Improvement: Using the UVIWATA Rubric',
    title_sw: 'Uboreshaji wa Ubora: Kutumia Rubric ya UVIWATA',
    date: '2026-07-22',
    time_en: '9:00 AM – 3:00 PM',
    time_sw: '9:00 asubuhi – 3:00 alasiri',
    category_en: 'Quality Improvement',
    category_sw: 'Uboreshaji wa Ubora',
    location_en: 'Ilala District Office, Dar es Salaam',
    location_sw: 'Ofisi ya Wilaya Ilala, Dar es Salaam',
    description_en:
      'Hands-on workshop: understand the 5-domain quality rubric, conduct a self-assessment, and build a six-month improvement plan for your centre.',
    description_sw:
      'Warsha ya vitendo: elewa rubric ya ubora ya vikoa 5, fanya tathmini ya kujitegemea, na jenga mpango wa uboreshaji wa miezi sita kwa kituo chako.',
  },
  {
    id: 'trn-003',
    title_en: 'Nutrition & Infant Feeding in Group Care',
    title_sw: 'Lishe na Ulishaji wa Watoto Wadogo katika Huduma ya Kikundi',
    date: '2026-08-05',
    time_en: '9:00 AM – 12:00 PM',
    time_sw: '9:00 asubuhi – 12:00 mchana',
    category_en: 'Nutrition',
    category_sw: 'Lishe',
    location_en: 'Temeke Municipal Hall, Dar es Salaam',
    location_sw: 'Ukumbi wa Manispaa Temeke, Dar es Salaam',
    description_en:
      'Evidence-based guidance on age-appropriate feeding, meal planning on a limited budget, and responsive feeding practices aligned with the WHO Nurturing Care Framework.',
    description_sw:
      'Mwongozo wa uthibitisho kuhusu ulishaji unaofaa kwa umri, mipango ya chakula kwa bajeti ndogo, na mazoea ya ulishaji wa kuguswa yaliyoanganishwa na Mfumo wa Malezi Tunzi wa WHO.',
  },
  {
    id: 'trn-004',
    title_en: 'Business Management for Daycare Owners',
    title_sw: 'Usimamizi wa Biashara kwa Wamiliki wa Vituo vya Malezi',
    date: '2026-08-19',
    time_en: '9:00 AM – 4:00 PM',
    time_sw: '9:00 asubuhi – 4:00 jioni',
    category_en: 'Business Management',
    category_sw: 'Usimamizi wa Biashara',
    location_en: 'Ubungo Community Centre, Dar es Salaam',
    location_sw: 'Kituo cha Jamii Ubungo, Dar es Salaam',
    description_en:
      'A full-day practical session on running a sustainable daycare business: fee-setting, record-keeping, parent communication, and understanding your registration requirements.',
    description_sw:
      'Kipindi cha siku mzima cha vitendo kuhusu kuendesha biashara endelevu ya malezi: kuweka ada, kuhifadhi rekodi, mawasiliano na wazazi, na kuelewa mahitaji yako ya usajili.',
  },
  {
    id: 'trn-005',
    title_en: 'Disability Inclusion in Early Childhood Settings',
    title_sw: 'Ujumuishaji wa Ulemavu katika Mazingira ya Utoto wa Mapema',
    date: '2026-09-09',
    time_en: '9:00 AM – 1:00 PM',
    time_sw: '9:00 asubuhi – 1:00 mchana',
    category_en: 'Disability Inclusion',
    category_sw: 'Ujumuishaji wa Ulemavu',
    location_en: 'Kigamboni District Office, Dar es Salaam',
    location_sw: 'Ofisi ya Wilaya Kigamboni, Dar es Salaam',
    description_en:
      'Practical strategies for welcoming children with disabilities or developmental delays — adapting activities, communicating with families, and navigating referral pathways.',
    description_sw:
      'Mikakati ya vitendo ya kukaribisha watoto wenye ulemavu au ucheleweshaji wa maendeleo — kubadilisha shughuli, kuwasiliana na familia, na kupitia njia za kuelekeza.',
  },
  {
    id: 'trn-006',
    title_en: 'Financial Literacy & Record-Keeping for Centre Operators',
    title_sw: 'Elimu ya Fedha na Kuhifadhi Rekodi kwa Waendeshaji wa Vituo',
    date: '2026-09-23',
    time_en: '9:00 AM – 2:00 PM',
    time_sw: '9:00 asubuhi – 2:00 alasiri',
    location_en: 'Kariakoo Community Hall, Dar es Salaam',
    location_sw: 'Ukumbi wa Jamii Kariakoo, Dar es Salaam',
    category_en: 'Financial Literacy',
    category_sw: 'Elimu ya Fedha',
    description_en:
      'Understand basic bookkeeping, separate personal and business finances, set realistic fees, and keep records that satisfy both parents and regulatory inspectors.',
    description_sw:
      'Elewa uhasibu wa msingi, tenganisha fedha za kibinafsi na biashara, weka ada za kweli, na hifadhi rekodi zinazoridhisha wazazi na wakaguzi wa udhibiti.',
  },
]
