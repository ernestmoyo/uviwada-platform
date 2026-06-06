'use client'

import Link from 'next/link'

import { useI18n } from '@/lib/i18n'

interface ResourceItem {
  title_en: string
  title_sw: string
  description_en: string
  description_sw: string
  url?: string
  comingSoon?: true
}

interface ResourceCategory {
  icon: string
  label_en: string
  label_sw: string
  items: ResourceItem[]
}

const CATEGORIES: ResourceCategory[] = [
  {
    icon: '📋',
    label_en: 'Association Documents',
    label_sw: 'Hati za Chama',
    items: [
      {
        title_en: 'UVIWATA Constitution & By-Laws',
        title_sw: 'Katiba na Sheria Ndogo za UVIWATA',
        description_en: 'The governing constitution and operational by-laws of the association.',
        description_sw: 'Katiba inayosimamia na sheria ndogo za uendeshaji wa chama.',
        comingSoon: true,
      },
      {
        title_en: 'Member Code of Conduct',
        title_sw: 'Kanuni ya Maadili ya Mwanachama',
        description_en: 'Standards of practice all UVIWATA member centres commit to uphold.',
        description_sw: 'Viwango vya mazoea ambavyo vituo vyote vya wanachama wa UVIWATA vimejitolea kudumisha.',
        comingSoon: true,
      },
      {
        title_en: 'Membership Application Form',
        title_sw: 'Fomu ya Maombi ya Uanachama',
        description_en: 'The standard form for centres applying to join UVIWATA.',
        description_sw: 'Fomu ya kawaida kwa vituo vinavyoomba kujiunga na UVIWATA.',
        comingSoon: true,
      },
    ],
  },
  {
    icon: '🛡️',
    label_en: 'Child Protection & Safeguarding',
    label_sw: 'Ulinzi wa Mtoto na Usalama',
    items: [
      {
        title_en: 'UVIWATA Safeguarding Policy (Draft)',
        title_sw: 'Sera ya Ulinzi wa Mtoto ya UVIWATA (Rasimu)',
        description_en: 'A draft safeguarding policy for member centres to adapt and adopt.',
        description_sw: 'Rasimu ya sera ya ulinzi wa mtoto kwa vituo vya wanachama kubadilisha na kupitisha.',
        comingSoon: true,
      },
      {
        title_en: 'Child Protection Reporting Guide',
        title_sw: 'Mwongozo wa Kuripoti Ulinzi wa Mtoto',
        description_en: 'Step-by-step guidance on mandatory reporting obligations under Tanzanian law.',
        description_sw: 'Mwongozo wa hatua kwa hatua kuhusu wajibu wa lazima wa kuripoti chini ya sheria ya Tanzania.',
        comingSoon: true,
      },
    ],
  },
  {
    icon: '⭐',
    label_en: 'Quality Improvement Tools',
    label_sw: 'Zana za Uboreshaji wa Ubora',
    items: [
      {
        title_en: 'UVIWATA Quality Rubric — Self-Assessment Checklist',
        title_sw: 'Rubric ya Ubora ya UVIWATA — Orodha ya Tathmini ya Kujitegemea',
        description_en: 'The 5-domain quality rubric used in all UVIWATA assessments, formatted for self-use by centres.',
        description_sw: 'Rubric ya ubora ya vikoa 5 inayotumiwa katika tathmini zote za UVIWATA, iliyopangwa kwa matumizi ya kujitegemea na vituo.',
        comingSoon: true,
      },
      {
        title_en: 'Centre Improvement Plan Template',
        title_sw: 'Kielezo cha Mpango wa Uboreshaji wa Kituo',
        description_en: 'A structured template to set 90-day and 6-month improvement goals.',
        description_sw: 'Kielezo kilichopangwa kuweka malengo ya uboreshaji wa siku 90 na miezi 6.',
        comingSoon: true,
      },
    ],
  },
  {
    icon: '🎓',
    label_en: 'Training Materials',
    label_sw: 'Nyenzo za Mafunzo',
    items: [
      {
        title_en: 'Caregiver Skills Workbook — Module 1: Safe Environments',
        title_sw: 'Daftari la Ustadi wa Mlezi — Moduli 1: Mazingira Salama',
        description_en: 'A practical workbook for daycare caregivers covering fire safety, first aid basics, and supervision standards.',
        description_sw: 'Daftari la vitendo kwa walezi wa malezi linaloshughulikia usalama wa moto, misingi ya huduma ya kwanza, na viwango vya usimamizi.',
        comingSoon: true,
      },
      {
        title_en: 'Parent Communication Templates',
        title_sw: 'Vielezo vya Mawasiliano na Wazazi',
        description_en: 'Ready-to-use notice templates for centre updates, fees and events — in Swahili and English.',
        description_sw: 'Vielezo vya matangazo tayari kutumika kwa masasisho ya kituo, ada na matukio — kwa Kiswahili na Kiingereza.',
        comingSoon: true,
      },
    ],
  },
  {
    icon: '📜',
    label_en: 'Regulatory Guidance',
    label_sw: 'Mwongozo wa Udhibiti',
    items: [
      {
        title_en: 'Government Guideline for Establishing & Managing Daycare Centres (2020)',
        title_sw: 'Mwongozo wa Serikali wa Kuanzisha na Kusimamia Vituo vya Malezi (2020)',
        description_en:
          'The official Tanzanian government guideline that sets minimum standards for daycare registration, facility requirements, and staffing. Published by the Ministry of Community Development, Gender, Women and Special Groups.',
        description_sw:
          'Mwongozo rasmi wa serikali ya Tanzania unaoweka viwango vya chini vya usajili wa malezi, mahitaji ya kituo, na wafanyakazi. Umechapishwa na Wizara ya Maendeleo ya Jamii, Jinsia, Wanawake na Makundi Maalum.',
        url: 'https://www.jamhuri.go.tz/',
      },
      {
        title_en: 'National Multisectoral ECD Programme (NM-ECDP)',
        title_sw: 'Programu ya Kitaifa ya ECD ya Sekta Mbalimbali (NM-ECDP)',
        description_en:
          'Tanzania\'s national multisectoral programme for early childhood development, coordinating health, nutrition, education and protection interventions for children 0–8.',
        description_sw:
          'Programu ya kitaifa ya Tanzania ya sekta mbalimbali kwa maendeleo ya utoto wa mapema, inayoratibu afya, lishe, elimu na uingiliaji kati wa ulinzi kwa watoto 0–8.',
        url: 'https://www.unesco.org/en/early-childhood-education',
      },
    ],
  },
  {
    icon: '💰',
    label_en: 'Financial Literacy',
    label_sw: 'Elimu ya Fedha',
    items: [
      {
        title_en: 'Fee-Setting Guide for Small Daycare Centres',
        title_sw: 'Mwongozo wa Kuweka Ada kwa Vituo Vidogo vya Malezi',
        description_en: 'A practical guide to calculating a sustainable fee structure based on costs, parent affordability and quality goals.',
        description_sw: 'Mwongozo wa vitendo wa kuhesabu muundo endelevu wa ada kulingana na gharama, uwezo wa wazazi na malengo ya ubora.',
        comingSoon: true,
      },
      {
        title_en: 'Basic Bookkeeping for Centre Operators',
        title_sw: 'Uhasibu wa Msingi kwa Waendeshaji wa Vituo',
        description_en: 'Simple templates and guidance for daily income/expense records, monthly summaries and fee tracking.',
        description_sw: 'Vielezo rahisi na mwongozo wa rekodi za mapato/matumizi ya kila siku, muhtasari wa kila mwezi na ufuatiliaji wa ada.',
        comingSoon: true,
      },
    ],
  },
  {
    icon: '🥕',
    label_en: 'Nutrition & Feeding',
    label_sw: 'Lishe na Ulishaji',
    items: [
      {
        title_en: 'WHO Nurturing Care Framework (2018)',
        title_sw: 'Mfumo wa Malezi Tunzi wa WHO (2018)',
        description_en:
          'The World Health Organization\'s global framework for early childhood development, covering health, nutrition, security & safety, responsive caregiving, and early learning. Foundational to the UVIWATA quality rubric.',
        description_sw:
          'Mfumo wa kimataifa wa Shirika la Afya Duniani (WHO) kwa maendeleo ya utoto wa mapema, unaoshughulikia afya, lishe, usalama, malezi ya kuguswa, na ujifunzaji wa mapema. Msingi wa rubric ya ubora ya UVIWATA.',
        url: 'https://www.who.int/publications/i/item/9789241514064',
      },
      {
        title_en: 'Age-Appropriate Meal Planner for Under-5s',
        title_sw: 'Mpangilio wa Chakula Unaofaa kwa Umri kwa Watoto Chini ya Miaka 5',
        description_en: 'A practical weekly meal planner for group care settings, designed for Tanzanian staple foods and limited budgets.',
        description_sw: 'Mpangilio wa vitendo wa chakula cha kila wiki kwa mazingira ya huduma ya kikundi, ulioprojektwa kwa vyakula vikuu vya Tanzania na bajeti ndogo.',
        comingSoon: true,
      },
    ],
  },
  {
    icon: '♿',
    label_en: 'Disability Inclusion',
    label_sw: 'Ujumuishaji wa Ulemavu',
    items: [
      {
        title_en: 'Inclusive Daycare Practices Guide',
        title_sw: 'Mwongozo wa Mazoea ya Malezi Yanayojumuisha',
        description_en: 'Practical strategies for welcoming and supporting children with disabilities or developmental delays in a daycare setting.',
        description_sw: 'Mikakati ya vitendo ya kukaribisha na kusaidia watoto wenye ulemavu au ucheleweshaji wa maendeleo katika mazingira ya malezi.',
        comingSoon: true,
      },
      {
        title_en: 'Referral Pathways for Children Needing Specialist Support',
        title_sw: 'Njia za Kuelekeza kwa Watoto Wanaohitaji Msaada Maalum',
        description_en: 'A directory of specialist services in Dar es Salaam for children with sensory, motor or developmental needs — with referral guidance.',
        description_sw: 'Orodha ya huduma maalum huko Dar es Salaam kwa watoto wenye mahitaji ya hisia, motor au maendeleo — na mwongozo wa kuelekeza.',
        comingSoon: true,
      },
    ],
  },
]

export default function ResourcesPage() {
  const { lang } = useI18n()
  const sw = lang === 'sw'

  return (
    <main style={{ background: 'var(--bg-alt)', minHeight: '100vh' }}>
      {/* Dark header — matches /directory and /quality chrome */}
      <header style={{ background: 'var(--primary-dark)', color: '#fff', padding: '1.4rem 0' }}>
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span
              style={{
                background: '#fff',
                borderRadius: 10,
                padding: '0.5rem 0.7rem',
                display: 'inline-flex',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/uviwata_logo.png"
                alt="UVIWATA — Mtoto Kwanza"
                style={{ height: 40, width: 'auto', display: 'block' }}
              />
            </span>
            <div>
              <div
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  opacity: 0.75,
                }}
              >
                {sw ? 'UVIWATA · Maktaba ya Rasilimali' : 'UVIWATA · Resource Library'}
              </div>
              <h1 style={{ fontSize: '1.6rem', margin: '0.25rem 0 0' }}>
                {sw ? 'Maktaba ya Rasilimali' : 'Resource Library'}
              </h1>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', opacity: 0.85 }}>
                {sw
                  ? 'Hati, miongozo na zana za vitendo kwa wanachama wa UVIWATA.'
                  : 'Documents, guidelines and practical tools for UVIWATA members.'}
              </p>
            </div>
          </div>
          <Link
            href="/"
            style={{
              color: '#fff',
              fontSize: '0.85rem',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.4)',
              padding: '0.45rem 0.9rem',
              borderRadius: 8,
            }}
          >
            ← {sw ? 'Nyumbani' : 'Home'}
          </Link>
        </div>
      </header>

      <section style={{ padding: '1.75rem 0 4rem' }}>
        <div className="container">
          {/* Growing library notice */}
          <div className="res-notice">
            <span className="res-notice-icon" aria-hidden>📚</span>
            <div>
              <strong>{sw ? 'Maktaba inayokua' : 'A growing library'}</strong>
              <p>
                {sw
                  ? 'Maktaba hii inaongeza hati mpya kadri UVIWATA inavyokua. Vitu vilivyoandikwa "Inakuja" viko katika maandalizi — wanachama waliosajiliwa wataarifiwa vinapowekwa.'
                  : 'This library adds new documents as UVIWATA grows. Items marked "Coming soon" are in preparation — registered members will be notified when they become available.'}
              </p>
            </div>
          </div>

          {/* Category sections */}
          <div className="res-categories">
            {CATEGORIES.map((cat) => (
              <div className="res-category" key={cat.label_en}>
                <div className="res-cat-header">
                  <span className="res-cat-icon" aria-hidden>{cat.icon}</span>
                  <h2 className="res-cat-title">{sw ? cat.label_sw : cat.label_en}</h2>
                </div>
                <div className="res-items">
                  {cat.items.map((item) => (
                    <div className="res-item" key={item.title_en}>
                      <div className="res-item-body">
                        <div className="res-item-title-row">
                          <h3 className="res-item-title">{sw ? item.title_sw : item.title_en}</h3>
                          {item.comingSoon && (
                            <span className="res-coming-tag">
                              {sw ? 'Inakuja' : 'Coming soon'}
                            </span>
                          )}
                        </div>
                        <p className="res-item-desc">{sw ? item.description_sw : item.description_en}</p>
                      </div>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="res-item-link"
                        >
                          {sw ? 'Fungua ↗' : 'Open ↗'}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <p className="res-footer-note">
            {sw
              ? 'Je, una hati unayotaka kuona hapa? Wasiliana nasi kupitia sehemu ya Wasiliana kwenye ukurasa wa nyumbani.'
              : 'Have a document you would like to see here? Reach us via the Contact section on the homepage.'}
          </p>
        </div>
      </section>
    </main>
  )
}
