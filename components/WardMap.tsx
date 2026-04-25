'use client'

import { useEffect, useRef } from 'react'

import { useI18n } from '@/lib/i18n'
import { DISTRICT_COLOURS, QUALITY_COLOURS } from '@/lib/seed-data'
import type { PublicCentre } from '@/lib/data'
import type { QualityRating } from '@/lib/types/database'

interface WardMapProps {
  centres: PublicCentre[]
}

const QUALITY_LABELS: Record<QualityRating, { sw: string; en: string }> = {
  green: { sw: 'Ubora Mzuri', en: 'Good Quality' },
  amber: { sw: 'Unahitaji Kuboresha', en: 'Needs Improvement' },
  red: { sw: 'Chini ya Kiwango', en: 'Below Standard' }
}

function buildPopup(c: PublicCentre, lang: 'sw' | 'en'): string {
  const childLabel = lang === 'sw' ? 'Watoto' : 'Children'
  const qualLabel = QUALITY_LABELS[c.quality][lang]
  return (
    `<div style="font-family:Inter,sans-serif;min-width:180px">` +
    `<strong style="font-size:0.95rem">${c.name}</strong><br>` +
    `<span style="color:#666;font-size:0.82rem">${c.ward}</span><br>` +
    `<div style="margin-top:8px;display:flex;align-items:center;gap:6px">` +
    `<span style="width:10px;height:10px;border-radius:50%;background:${QUALITY_COLOURS[c.quality]};display:inline-block"></span>` +
    `<span style="font-size:0.82rem">${qualLabel}</span></div>` +
    `<div style="margin-top:4px;font-size:0.82rem;color:#666">${childLabel}: ${c.children}</div></div>`
  )
}

export function WardMap({ centres }: WardMapProps) {
  const { lang } = useI18n()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<unknown>(null)
  const markersRef = useRef<Array<{ marker: { setPopupContent: (s: string) => void }; data: PublicCentre }>>([])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false

    void (async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !containerRef.current) return

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        zoomControl: true
      }).setView([-6.82, 39.27], 12)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18
      }).addTo(map)

      try {
        const res = await fetch('/dar_wards.geojson')
        if (res.ok) {
          const geojson = await res.json()
          L.geoJSON(geojson, {
            style: (feature) => {
              const dist = (feature?.properties?.dist_name as string) || ''
              const colour = DISTRICT_COLOURS[dist] || '#999'
              return {
                color: colour,
                weight: 1.5,
                fillColor: colour,
                fillOpacity: 0.08,
                dashArray: '3'
              }
            },
            onEachFeature: (feature, layer) => {
              const p = feature.properties as { ward_name?: string; dist_name?: string }
              if (p?.ward_name) {
                layer.bindTooltip(`${p.ward_name} (${p.dist_name ?? ''})`, {
                  sticky: true,
                  className: 'ward-tooltip'
                })
              }
            }
          }).addTo(map)
        }
      } catch {
        // GeoJSON optional — markers still render below
      }

      markersRef.current = []
      centres.forEach((c) => {
        const marker = L.circleMarker([c.lat, c.lng], {
          radius: Math.max(6, Math.min(12, c.children / 3)),
          fillColor: QUALITY_COLOURS[c.quality],
          color: '#fff',
          weight: 2,
          fillOpacity: 0.85
        }).addTo(map)
        marker.bindPopup(buildPopup(c, lang))
        markersRef.current.push({ marker, data: c })
      })

      mapRef.current = map
    })()

    return () => {
      cancelled = true
      const map = mapRef.current as { remove: () => void } | null
      if (map) {
        map.remove()
        mapRef.current = null
      }
      markersRef.current = []
    }
    // Map should mount once; centres are part of the initial seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update popup language without re-mounting
  useEffect(() => {
    markersRef.current.forEach((item) => {
      item.marker.setPopupContent(buildPopup(item.data, lang))
    })
  }, [lang])

  return <div id="mapView" ref={containerRef} />
}
