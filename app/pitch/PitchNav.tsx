'use client'

import { useEffect, useState } from 'react'

import styles from './pitch.module.css'

interface PitchNavProps {
  total: number
}

export function PitchNav({ total }: PitchNavProps) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    function onScroll() {
      const slides = document.querySelectorAll<HTMLElement>('[data-slide]')
      let current = 0
      const trigger = window.scrollY + window.innerHeight / 2
      slides.forEach((s, i) => {
        if (s.offsetTop <= trigger) current = i
      })
      setActive(current)
    }
    function onKey(e: KeyboardEvent) {
      const slides = document.querySelectorAll<HTMLElement>('[data-slide]')
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        const next = Math.min(active + 1, slides.length - 1)
        slides[next]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        const prev = Math.max(active - 1, 0)
        slides[prev]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else if (e.key === 'Home') {
        slides[0]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else if (e.key === 'End') {
        slides[slides.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('keydown', onKey)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('keydown', onKey)
    }
  }, [active])

  function jump(i: number) {
    const slides = document.querySelectorAll<HTMLElement>('[data-slide]')
    slides[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <div className={styles.cornerLogos}>
        <img src="/logo.svg" alt="UVIWADA" />
        <span className={styles.divider} />
        <strong style={{ fontSize: '0.85rem', color: '#fff', letterSpacing: '0.05em' }}>7Square</strong>
      </div>
      <div className={styles.slideNumber}>
        {String(active + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
      <nav className={styles.nav} aria-label="Slide navigation">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            className={`${styles.navDot} ${i === active ? styles.active : ''}`}
            onClick={() => jump(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </nav>
    </>
  )
}
