'use client'

import { useEffect, useRef } from 'react'

import { addSatelliteBasemap } from '@/lib/map-tiles'

// National coverage map: all 31 Tanzania regions, with regions that have live
// assessment data highlighted and the rest shown as "coming soon". Mirrors the
// proven WardMap Leaflet pattern (dynamic import, mount-once, cleanup).

interface RegionMapProps {
  /** Region names that have live data (highlighted). */
  liveRegions: string[]
  height?: number
}

const LIVE_FILL = '#1A5FAA'
const SOON_FILL = '#cbd5e1'

export function RegionMap({ liveRegions, height = 440 }: RegionMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<unknown>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false
    const live = new Set(liveRegions)

    void (async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !containerRef.current) return

      const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomControl: true }).setView([-6.4, 35.0], 5)
      addSatelliteBasemap(L, map)

      try {
        const res = await fetch('/tz_regions.geojson')
        if (res.ok) {
          const geojson = await res.json()
          const layer = L.geoJSON(geojson, {
            style: (feature) => {
              const name = (feature?.properties?.name as string) || ''
              const isLive = live.has(name)
              return {
                color: isLive ? '#0F3D6E' : '#94a3b8',
                weight: isLive ? 2 : 0.8,
                fillColor: isLive ? LIVE_FILL : SOON_FILL,
                fillOpacity: isLive ? 0.65 : 0.18
              }
            },
            onEachFeature: (feature, lyr) => {
              const name = (feature.properties as { name?: string })?.name ?? ''
              const isLive = live.has(name)
              lyr.bindTooltip(`${name}${isLive ? '' : ' — coming soon'}`, { sticky: true })
            }
          }).addTo(map)
          try { map.fitBounds(layer.getBounds(), { padding: [10, 10] }) } catch { /* keep default view */ }
        }
      } catch {
        // geojson optional
      }

      mapRef.current = map
    })()

    return () => {
      cancelled = true
      const map = mapRef.current as { remove: () => void } | null
      if (map) { map.remove(); mapRef.current = null }
    }
    // Mount once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} style={{ height, width: '100%', borderRadius: 12, overflow: 'hidden' }} />
}
