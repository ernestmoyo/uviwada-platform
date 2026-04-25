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
            <Image src="/logo.svg" alt="UVIWADA" width={140} height={44} className="logo-img" />
            <p>
              {lang === 'sw'
                ? 'Umoja wa Vituo vya Watoto wa Dar es Salaam. Kuimarisha sekta ya malezi ya watoto kupitia uratibu, uwakilishi na huduma za kidijitali.'
                : 'Daycare Centres Association of Dar es Salaam. Strengthening the childcare sector through coordination, representation and digital services.'}
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
          <p>© 2026 UVIWADA. {lang === 'sw' ? 'Haki zote zimehifadhiwa.' : 'All rights reserved.'}</p>
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
