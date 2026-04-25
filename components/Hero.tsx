'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

import { useI18n } from '@/lib/i18n'

interface HeroProps {
  totalMembers: number
  childrenReached: number
}

export function Hero({ totalMembers, childrenReached }: HeroProps) {
  const { lang } = useI18n()
  const statsRef = useRef<HTMLDivElement | null>(null)
  const animatedRef = useRef(false)

  useEffect(() => {
    if (!statsRef.current || animatedRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animatedRef.current) {
            animatedRef.current = true
            animateCounters(entry.target as HTMLElement)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.5 }
    )
    observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="hero" id="home">
      <div className="hero-overlay" />
      <div className="container hero-content">
        <div className="hero-badge">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.childrenincrossfire.org/wp-content/uploads/2022/08/CIC_logo_color_rgb-1-e1660224305433.png"
            alt="Children in Crossfire"
            className="cic-logo-inline"
          />
          <span>
            {lang === 'sw'
              ? 'Kwa ushirikiano na Children in Crossfire'
              : 'In partnership with Children in Crossfire'}
          </span>
        </div>
        <h1>
          {lang === 'sw'
            ? 'Kuimarisha Vituo vya Malezi ya Watoto Dar es Salaam'
            : 'Strengthening Daycare Centres Across Dar es Salaam'}
        </h1>
        <p className="hero-sub">
          {lang === 'sw'
            ? "Jukwaa la kidijitali la UVIWADA linaunganisha, linasaidia na kuinua ubora wa vituo vya malezi katika maeneo ya watu wengi na mapato ya chini."
            : "UVIWADA's digital platform connects, supports and elevates the quality of daycare centres in high-density, low-income areas."}
        </p>
        <div className="hero-actions">
          <a href="#services" className="btn btn-primary">
            {lang === 'sw' ? 'Huduma Zetu' : 'Our Services'}
          </a>
          <Link href="/portal/register" className="btn btn-outline">
            {lang === 'sw' ? 'Jiunge Sasa' : 'Join Now'}
          </Link>
        </div>
        <div className="hero-stats" ref={statsRef}>
          <div className="stat">
            <span className="stat-num" data-count={totalMembers}>
              0
            </span>
            <span>+</span>
            <span className="stat-label">{lang === 'sw' ? 'Vituo vya Wanachama' : 'Member Centres'}</span>
          </div>
          <div className="stat">
            <span className="stat-num" data-count={5}>
              0
            </span>
            <span className="stat-label">{lang === 'sw' ? 'Wilaya za Dar' : 'Dar Districts'}</span>
          </div>
          <div className="stat">
            <span className="stat-num" data-count={childrenReached}>
              0
            </span>
            <span>+</span>
            <span className="stat-label">{lang === 'sw' ? 'Watoto Wanaofaidika' : 'Children Reached'}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function animateCounters(root: HTMLElement) {
  const targets = root.querySelectorAll<HTMLSpanElement>('.stat-num[data-count]')
  targets.forEach((el) => {
    const target = parseInt(el.dataset.count ?? '0', 10)
    const duration = 1500
    let startTime: number | null = null
    function step(timestamp: number) {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      el.textContent = Math.floor(eased * target).toLocaleString()
      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        el.textContent = target.toLocaleString()
      }
    }
    requestAnimationFrame(step)
  })
}
