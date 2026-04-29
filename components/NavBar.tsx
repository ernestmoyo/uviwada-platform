'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useI18n } from '@/lib/i18n'
import { canSeeFieldApp, useSession } from '@/lib/use-session'

const NAV_ITEMS = [
  { id: 'home', sw: 'Nyumbani', en: 'Home' },
  { id: 'about', sw: 'Kuhusu', en: 'About' },
  { id: 'services', sw: 'Huduma', en: 'Services' },
  { id: 'dashboard', sw: 'Takwimu', en: 'Dashboard' },
  { id: 'map', sw: 'Ramani', en: 'Map' },
  { id: 'field-app', sw: 'App ya Uwandani', en: 'Field App' },
  { id: 'contact', sw: 'Wasiliana', en: 'Contact' }
] as const

export function NavBar() {
  const { lang } = useI18n()
  const pathname = usePathname()
  const { role } = useSession()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState<string>('home')

  const isHome = pathname === '/'
  const showFieldApp = canSeeFieldApp(role)
  const visibleNavItems = NAV_ITEMS.filter((item) => item.id !== 'field-app' || showFieldApp)

  // On the homepage we use bare hash anchors so the browser smooth-scrolls.
  // On any other route we use `/#section` so Next.js navigates back home
  // first and then jumps to the section.
  const sectionHref = (id: string) => (isHome ? `#${id}` : `/#${id}`)

  useEffect(() => {
    if (!isHome) {
      setScrolled(true)
      return
    }
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
  }, [isHome])

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar">
      <div className="container nav-inner">
        <Link href="/" className="logo" onClick={() => setOpen(false)}>
          <Image src="/logo.svg" alt="UVIWADA - Mtoto Kwanza" width={140} height={44} className="logo-img" priority />
        </Link>
        <button className="menu-btn" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          <span />
          <span />
          <span />
        </button>
        <ul className={`nav-links ${open ? 'open' : ''}`}>
          {visibleNavItems.map((item) => (
            <li key={item.id}>
              <Link
                href={sectionHref(item.id)}
                className={isHome && activeId === item.id ? 'active' : ''}
                onClick={() => setOpen(false)}
              >
                {lang === 'sw' ? item.sw : item.en}
              </Link>
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
