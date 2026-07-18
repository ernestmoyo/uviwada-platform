// Per-domain, per-level (1–4) SHORT descriptors shown at each assessment
// question so the assessor knows exactly what a rating means before assigning it.
//
// CONDENSED from the official DCC Quality Standards rubric
// (upgrade/Final_Rubric_Quality_Standards_part.xlsx). The full instrument scores
// several criteria per domain against a Level 1–4 scale
// (1 No compliance · 2 Basic compliance · 3 Advancing · 4 Best practice); here
// each domain carries one short faithful line per level. Careworker-capacity
// competencies use the instrument's caregiver-confidence ladder (1 lowest–4 highest).
//
// KEEP IN SYNC with mobile/webapp/rubric-levels.js (identical content, plain-JS form).

export interface LevelText {
  en: string
  sw: string
}
export type DomainLevels = Record<1 | 2 | 3 | 4, LevelText>

// Shared careworker-capacity confidence ladder (applies to all 13 competencies).
const CAPACITY: DomainLevels = {
  1: { en: 'Not yet able — needs close guidance', sw: 'Bado hajaweza — anahitaji mwongozo wa karibu' },
  2: { en: 'Emerging — handles the basics with support', sw: 'Inachipukia — hufanya ya msingi kwa msaada' },
  3: { en: 'Competent — does this well on their own', sw: 'Ana uwezo — hufanya vizuri bila msaada' },
  4: { en: 'Highly skilled — consistent, can mentor others', sw: 'Ujuzi wa juu — thabiti, anaweza kufundisha wengine' }
}

export const RUBRIC_LEVELS: Record<string, DomainLevels> = {
  // ---- 13 careworker-capacity competencies (confidence ladder) ----
  cap01: CAPACITY, cap02: CAPACITY, cap03: CAPACITY, cap04: CAPACITY, cap05: CAPACITY,
  cap06: CAPACITY, cap07: CAPACITY, cap08: CAPACITY, cap09: CAPACITY, cap10: CAPACITY,
  cap11: CAPACITY, cap12: CAPACITY, cap13: CAPACITY,

  // ---- 14 infrastructure sub-domains (domain-specific compliance) ----
  location: {
    1: { en: 'Unapproved; several surrounding hazards', sw: 'Haijaidhinishwa; hatari kadhaa za mazingira' },
    2: { en: 'Recognized but unapproved; 1–3 hazards nearby', sw: 'Inatambulika lakini haijaidhinishwa; hatari 1–3' },
    3: { en: 'LGA-approved; one preventable hazard', sw: 'Imeidhinishwa na Halmashauri; hatari moja inayozuilika' },
    4: { en: 'LGA-approved, stand-alone; secure, no hazards', sw: 'Imeidhinishwa, jengo lake; salama, hakuna hatari' }
  },
  building: {
    1: { en: 'Unsafe structure; poor light/air; not CwD-accessible', sw: 'Jengo si salama; hewa/mwanga hafifu; halifikiki kwa walemavu' },
    2: { en: 'Some damage but usable; limited air and light', sw: 'Uharibifu kiasi lakini latumika; hewa na mwanga hafifu' },
    3: { en: 'Generally sturdy, ventilated; few barriers', sw: 'Kwa ujumla imara, ina hewa; vizuizi vichache' },
    4: { en: 'Strong, well-lit and ventilated; barrier-free', sw: 'Imara, mwanga na hewa ya kutosha; bila vizuizi' }
  },
  office: {
    1: { en: 'No office space or equipment', sw: 'Hakuna ofisi wala vifaa' },
    2: { en: 'Basic space; limited equipment and filing', sw: 'Nafasi ya msingi; vifaa na mafaili machache' },
    3: { en: 'Functional office; adequate filing and privacy', sw: 'Ofisi inayofanya kazi; mafaili na faragha ya kutosha' },
    4: { en: 'Well-equipped, private and organized office', sw: 'Ofisi yenye vifaa, faragha na mpangilio mzuri' }
  },
  indoor: {
    1: { en: 'No or unsafe play space; no learning corners', sw: 'Hakuna/haisalama nafasi ya kuchezea; hakuna pembe za kujifunzia' },
    2: { en: 'Cramped play space; few, disorganized corners', sw: 'Nafasi finyu; pembe chache zisizopangwa' },
    3: { en: 'Safe, covered play area; some learning corners', sw: 'Nafasi salama, imefunikwa; pembe kadhaa za kujifunzia' },
    4: { en: 'Spacious, covered; 4+ organized inclusive corners', sw: 'Nafasi kubwa, imefunikwa; pembe 4+ zilizopangwa na jumuishi' }
  },
  outdoor: {
    1: { en: 'No outdoor space or accessible equipment', sw: 'Hakuna nafasi ya nje wala vifaa vinavyofikika' },
    2: { en: 'Limited, poorly maintained; unsafe equipment', sw: 'Finyu, haitunzwi vyema; vifaa si salama' },
    3: { en: 'Safe but limited space; adequate equipment', sw: 'Salama lakini finyu; vifaa vya kutosha' },
    4: { en: 'Ample, safe space; varied inclusive equipment', sw: 'Nafasi pana, salama; vifaa vingi na jumuishi' }
  },
  materials: {
    1: { en: 'No materials, or unsafe and not age-appropriate', sw: 'Hakuna vifaa, au si salama wala si vya umri sahihi' },
    2: { en: 'Few materials; limited variety and inclusion', sw: 'Vifaa vichache; aina finyu na si jumuishi' },
    3: { en: 'Adequate variety; mostly safe, organized, used', sw: 'Aina za kutosha; kwa kiasi kikubwa salama na hutumika' },
    4: { en: 'Wide, inclusive, safe range; well-organized', sw: 'Aina nyingi, jumuishi, salama; zimepangwa vyema' }
  },
  fencing: {
    1: { en: 'No fence; unsafe; movement uncontrolled', sw: 'Hakuna uzio; si salama; kuingia/kutoka hakudhibitiwi' },
    2: { en: 'Fence in disrepair; weak materials; weak oversight', sw: 'Uzio umeharibika; vifaa dhaifu; usimamizi hafifu' },
    3: { en: 'Basic control; acceptable materials; person inconsistent', sw: 'Udhibiti wa msingi; vifaa vinavyokubalika; msimamizi si thabiti' },
    4: { en: 'Sturdy fence; strong materials; managed access', sw: 'Uzio imara; vifaa vikali; kuingia/kutoka kunasimamiwa' }
  },
  sleeping: {
    1: { en: 'No rest time, materials, or arrangement', sw: 'Hakuna muda wa kupumzika, vifaa wala mpangilio' },
    2: { en: 'Irregular rest; few unsafe materials; overcrowded', sw: 'Mapumziko yasiyo ya kawaida; vifaa vichache visivyo salama; msongamano' },
    3: { en: 'Regular rest; adequate clean materials; minor gaps', sw: 'Mapumziko ya kawaida; vifaa safi vya kutosha; mapungufu madogo' },
    4: { en: 'Structured rest; safe equipment; proper spacing', sw: 'Mapumziko yaliyopangwa; vifaa salama; nafasi ya kutosha' }
  },
  records: {
    1: { en: 'No registration or child records kept', sw: 'Hakuna usajili wala kumbukumbu za watoto' },
    2: { en: 'Few records; incomplete or end-of-term only', sw: 'Kumbukumbu chache; pungufu au za mwisho wa muhula tu' },
    3: { en: 'Most registers kept but inconsistent/not shared', sw: 'Rejista nyingi zipo lakini si thabiti/hazishirikishwi' },
    4: { en: 'Complete registers; consistent, shared with parents', sw: 'Rejista kamili; thabiti, zinashirikishwa kwa wazazi' }
  },
  furniture: {
    1: { en: 'Bare floor; no child chairs or shelves', sw: 'Sakafu wazi; hakuna viti vya watoto wala rafu' },
    2: { en: 'Mat only; few unsafe items; no shelves', sw: 'Mkeka tu; vifaa vichache visivyo salama; hakuna rafu' },
    3: { en: 'Covered floor, some chairs/shelves; insufficient', sw: 'Sakafu imefunikwa, viti/rafu kadhaa; hazitoshi' },
    4: { en: 'Child-sized chairs and shelves; sufficient, safe', sw: 'Viti vya saizi ya watoto na rafu; vya kutosha, salama' }
  },
  toilets: {
    1: { en: 'No toilet; no handwashing', sw: 'Hakuna choo; hakuna unawaji mikono' },
    2: { en: 'Some toilets, not gender-separated; no soap', sw: 'Vyoo vipo, havijatenganishwa kijinsia; hakuna sabuni' },
    3: { en: 'Clean, gender-separated toilets; handwashing with soap', sw: 'Vyoo safi, vimetenganishwa kijinsia; unawaji kwa sabuni' },
    4: { en: 'Clean, accessible for all; meets ratios; full sanitation', sw: 'Safi, vinafikika kwa wote; vinakidhi uwiano; usafi kamili' }
  },
  water: {
    1: { en: 'No reliable safe water or storage', sw: 'Hakuna maji salama ya uhakika wala hifadhi' },
    2: { en: 'Unreliable source; poor storage and containers', sw: 'Chanzo kisicho cha uhakika; hifadhi na vyombo hafifu' },
    3: { en: 'Reliable nearby; adequate storage; safe containers', sw: 'Ya uhakika karibu; hifadhi ya kutosha; vyombo salama' },
    4: { en: 'Always available; large backup; containers each room', sw: 'Yapo wakati wote; hifadhi kubwa; vyombo kila chumba' }
  },
  safety: {
    1: { en: 'No first aid, plan, or supervision; unsafe', sw: 'Hakuna huduma ya kwanza, mpango wala usimamizi; si salama' },
    2: { en: 'Basic first aid; irregular supervision; hazards remain', sw: 'Huduma ya kwanza ya msingi; usimamizi hafifu; hatari zipo' },
    3: { en: 'First aid and trained staff; supervised; mostly safe', sw: 'Huduma ya kwanza na wafanyakazi waliofunzwa; usimamizi; salama kwa kiasi kikubwa' },
    4: { en: 'Full first aid, practiced plan, safeguarding; hazard-free', sw: 'Huduma kamili, mpango unaofanyiwa mazoezi, ulinzi; bila hatari' }
  },
  nutrition: {
    1: { en: 'Any cook; no kitchen or meal plan', sw: 'Mpishi yeyote; hakuna jiko wala mpango wa milo' },
    2: { en: 'Occasional cook; open kitchen; irregular meals', sw: 'Mpishi wa mara kwa mara; jiko wazi; milo isiyo ya kawaida' },
    3: { en: 'Designated cook; safe kitchen; structured meals', sw: 'Mpishi maalum; jiko salama; milo iliyopangwa' },
    4: { en: 'Trained cook; proper kitchen; balanced, supervised meals', sw: 'Mpishi aliyefunzwa; jiko bora; milo kamili, inayosimamiwa' }
  }
}
