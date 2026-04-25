'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

import { useI18n } from '@/lib/i18n'

const NAV_ITEMS = [
  { href: '#home', sw: 'Nyumbani', en: 'Home' },
  { href: '#about', sw: 'Kuhusu', en: 'About' },
  { href: '#services', sw: 'Huduma', en: 'Services' },
  { href: '#dashboard', sw: 'Takwimu', en: 'Dashboard' },
  { href: '#map', sw: 'Ramani', en: 'Map' },
  { href: '#field-app', sw: 'App ya Uwandani', en: 'Field App' },
  { href: '#contact', sw: 'Wasiliana', en: 'Contact' }
] as const

export function NavBar() {
  const { lang } = useI18n()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState<string>('home')

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 50)
      const scrollPos = window.scrollY + 120
      const sections = document.querySelectorAll<HTMLElement>('section[id]')
      let current = 'home'
      sections.forEach((sec) => {
        const top = sec.offsetTop
        const bottom = top + sec.offsetHeight
        if (scrollPos >= top && scrollPos < bottom) {
          current = sec.id
        }
      })
      setActiveId(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar">
      <div className="container nav-inner">
        <Link href="#home" className="logo" onClick={() => setOpen(false)}>
          <Image src="/logo.svg" alt="UVIWADA - Mtoto Kwanza" width={140} height={44} className="logo-img" priority />
        </Link>
        <button className="menu-btn" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          <span />
          <span />
          <span />
        </button>
        <ul className={`nav-links ${open ? 'open' : ''}`}>
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={activeId === item.href.slice(1) ? 'active' : ''}
                onClick={() => setOpen(false)}
              >
                {lang === 'sw' ? item.sw : item.en}
              </a>
            </li>
          ))}
          <li>
            <Link href="/login" className="btn-nav" onClick={() => setOpen(false)}>
              {lang === 'sw' ? 'Ingia Portalini' : 'Sign in'}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}
