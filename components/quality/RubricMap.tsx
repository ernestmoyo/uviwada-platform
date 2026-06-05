'use client'

import { useEffect, useRef } from 'react'
import type * as Leaflet from 'leaflet'

export interface RubricMapPoint {
  name: string
  lat: number
  lng: number
  council: string | null
  tier: string | null
  traffic: 'green' | 'amber' | 'red'
}

const COLOURS = { green: '#22c55e', amber: '#f59e0b', red: '#ef4444' }

export function RubricMap({ points }: { points: RubricMapPoint[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<unknown>(null)
  const layerRef = useRef<unknown>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false
    void (async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !containerRef.current) return
      const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomControl: true }).setView([-6.82, 39.22], 11)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18
      }).addTo(map)
      mapRef.current = map
      renderPoints(L, map)
    })()
    return () => {
      cancelled = true
      const map = mapRef.current as { remove: () => void } | null
      if (map) map.remove()
      mapRef.current = null
      layerRef.current = null
    }
    // mount once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // re-render markers when the filtered points change
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const map = mapRef.current
      if (!map) return
      const L = (await import('leaflet')).default
      if (cancelled) return
      renderPoints(L, map)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points])

  function renderPoints(L: typeof Leaflet, map: unknown) {
    if (layerRef.current) (map as { removeLayer: (l: unknown) => void }).removeLayer(layerRef.current)
    const group = L.layerGroup()
    points.forEach((p) => {
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: 6,
        fillColor: COLOURS[p.traffic],
        color: '#fff',
        weight: 1.5,
        fillOpacity: 0.85
      })
      marker.bindPopup(
        `<div style="font-family:Inter,sans-serif;min-width:170px"><strong>${p.name}</strong><br>` +
          `<span style="color:#666;font-size:0.8rem">${p.council ?? ''}</span><br>` +
          `<span style="font-size:0.8rem">${p.tier ?? 'Tier pending'}</span></div>`
      )
      marker.addTo(group)
    })
    group.addTo(map as Parameters<typeof group.addTo>[0])
    layerRef.current = group
  }

  return <div id="mapView" ref={containerRef} style={{ height: 460 }} />
}
