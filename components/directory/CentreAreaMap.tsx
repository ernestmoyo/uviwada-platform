'use client'

import { useEffect, useRef } from 'react'

// Shows an APPROXIMATE area (a soft circle, ~500 m), never an exact pin — to
// honour the consent rule that exact coordinates are not public by default
// (V2 §669). Used on public centre profile pages.
interface Props {
  lat: number
  lng: number
  label: string
}

export function CentreAreaMap({ lat, lng, label }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<unknown>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false
    void (async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !containerRef.current) return
      const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomControl: true }).setView([lat, lng], 14)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18
      }).addTo(map)
      L.circle([lat, lng], {
        radius: 500,
        color: '#1A5FAA',
        weight: 1.5,
        fillColor: '#1A5FAA',
        fillOpacity: 0.15
      })
        .addTo(map)
        .bindPopup(`<strong>${label}</strong><br><span style="font-size:0.8rem;color:#666">Approximate area</span>`)
      mapRef.current = map
    })()
    return () => {
      cancelled = true
      const map = mapRef.current as { remove: () => void } | null
      if (map) map.remove()
      mapRef.current = null
    }
    // mount once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} style={{ height: 280, borderRadius: 12, overflow: 'hidden' }} />
}
