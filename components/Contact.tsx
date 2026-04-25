'use client'

import { useI18n } from '@/lib/i18n'

export function Contact() {
  const { lang } = useI18n()
  return (
    <section className="section section-alt" id="contact">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">{lang === 'sw' ? 'Wasiliana Nasi' : 'Contact Us'}</span>
          <h2>{lang === 'sw' ? 'Wasiliana na UVIWADA' : 'Get in Touch with UVIWADA'}</h2>
        </div>
        <div className="contact-grid">
          <div className="contact-info">
            <div className="contact-item">
              <span className="contact-icon">📍</span>
              <div>
                <strong>UVIWADA Office, Magomeni Mapipa</strong>
                <p>Plot No. 46, Suna Ward, Kinondoni, Dar es Salaam</p>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon">📧</span>
              <div>
                <strong>uviwadatz@gmail.com</strong>
                <p>{lang === 'sw' ? 'Barua pepe rasmi' : 'Official email'}</p>
              </div>
            </div>
            <div className="contact-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://www.childrenincrossfire.org/wp-content/uploads/2022/08/CIC_logo_color_rgb-1-e1660224305433.png"
                alt="Children in Crossfire"
                className="contact-cic-logo"
              />
              <div>
                <strong>{lang === 'sw' ? 'Ushirikiano wa Kimkakati' : 'Strategic Partnership'}</strong>
                <p>Children in Crossfire (CiC) — Dar Urban ECCE Programme</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
