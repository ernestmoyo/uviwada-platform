'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { useI18n } from '@/lib/i18n'

interface HeroProps {
  totalMembers: number
  childrenReached: number
}

export function Hero({ totalMembers, childrenReached }: HeroProps) {
  const { lang } = useI18n()
  const statsRef = useRef<HTMLDivElement | null>(null)
  // Animated values live in React state so re-renders (e.g. language toggle)
  // don't overwrite imperative DOM mutations and reset numbers to 0.
  const [counts, setCounts] = useState({ members: 0, districts: 0, children: 0 })
  const animatedRef = useRef(false)

  useEffect(() => {
    if (!statsRef.current || animatedRef.current) return
    const node = statsRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animatedRef.current) {
            animatedRef.current = true
            animate(totalMembers, 5, childrenReached, setCounts)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.4 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [totalMembers, childrenReached])

  // If the section is already in view on first paint (e.g. very tall viewport
  // or hard refresh) the IO won't fire — kick the animator after a tick.
  useEffect(() => {
    if (animatedRef.current) return
    const t = window.setTimeout(() => {
      if (!animatedRef.current && statsRef.current) {
        const rect = statsRef.current.getBoundingClientRect()
        if (rect.top < window.innerHeight) {
          animatedRef.current = true
          animate(totalMembers, 5, childrenReached, setCounts)
        }
      }
    }, 600)
    return () => window.clearTimeout(t)
  }, [totalMembers, childrenReached])

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
            <span className="stat-num">{counts.members.toLocaleString()}</span>
            <span>+</span>
            <span className="stat-label">{lang === 'sw' ? 'Vituo vya Wanachama' : 'Member Centres'}</span>
          </div>
          <div className="stat">
            <span className="stat-num">{counts.districts}</span>
            <span className="stat-label">{lang === 'sw' ? 'Wilaya za Dar' : 'Dar Districts'}</span>
          </div>
          <div className="stat">
            <span className="stat-num">{counts.children.toLocaleString()}</span>
            <span>+</span>
            <span className="stat-label">{lang === 'sw' ? 'Watoto Wanaofaidika' : 'Children Reached'}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function animate(
  members: number,
  districts: number,
  children: number,
  setCounts: (next: { members: number; districts: number; children: number }) => void
) {
  const duration = 1500
  let start: number | null = null
  function step(ts: number) {
    if (start == null) start = ts
    const progress = Math.min((ts - start) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    setCounts({
      members: Math.floor(eased * members),
      districts: Math.floor(eased * districts),
      children: Math.floor(eased * children)
    })
    if (progress < 1) {
      requestAnimationFrame(step)
    } else {
      setCounts({ members, districts, children })
    }
  }
  requestAnimationFrame(step)
}
