'use client'

import Image from 'next/image'

import { useI18n } from '@/lib/i18n'

export function Footer() {
  const { lang } = useI18n()
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Image src="/uviwata_logo.png" alt="UVIWATA" width={178} height={100} className="logo-img" style={{ height: 44, width: 'auto' }} />
            <p>
              {lang === 'sw'
                ? 'Chama cha Kitaifa cha Wamiliki wa Vituo vya Malezi Tanzania (UVIWATA). Kuimarisha sekta ya malezi ya watoto kupitia uratibu, uwakilishi na huduma za kidijitali — likianza Dar es Salaam kupitia UVIWADA, mkoa wa mwanzilishi.'
                : 'National Association of Daycare Centre Owners in Tanzania (UVIWATA). Strengthening the childcare sector through coordination, representation and digital services — starting in Dar es Salaam through UVIWADA, the founding region.'}
            </p>
          </div>
          <div className="footer-links">
            <h4>{lang === 'sw' ? 'Viungo' : 'Links'}</h4>
            <a href="#about">{lang === 'sw' ? 'Kuhusu' : 'About'}</a>
            <a href="#services">{lang === 'sw' ? 'Huduma' : 'Services'}</a>
            <a href="#dashboard">{lang === 'sw' ? 'Takwimu' : 'Dashboard'}</a>
            <a href="#contact">{lang === 'sw' ? 'Wasiliana' : 'Contact'}</a>
          </div>
          <div className="footer-links">
            <h4>{lang === 'sw' ? 'Washirika' : 'Partners'}</h4>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.childrenincrossfire.org/wp-content/uploads/2022/08/CIC_logo_color_rgb-1-e1660224305433.png"
              alt="Children in Crossfire"
              className="footer-cic-logo"
            />
            <span>Children in Crossfire</span>
            <span>Conrad N. Hilton Foundation</span>
            <span>{lang === 'sw' ? 'Mpango wa NMECDP' : 'NMECDP Framework'}</span>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 UVIWATA. {lang === 'sw' ? 'Haki zote zimehifadhiwa.' : 'All rights reserved.'}</p>
          <p>
            {lang === 'sw'
              ? 'Jukwaa limetengenezwa na 7Square Group Limited'
              : 'Platform developed by 7Square Group Limited'}
          </p>
        </div>
      </div>
    </footer>
  )
}
