import type * as Leaflet from 'leaflet'

// Satellite basemap for all platform maps — Esri "World Imagery": free to use
// with attribution, needs no API key. Note the tile path is {z}/{y}/{x}
// (y before x), unlike the OSM {z}/{x}/{y} order.
export const SATELLITE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
export const SATELLITE_ATTRIB =
  'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
// Thin place / road label overlay drawn on top of the imagery so wards and roads
// stay readable.
export const SATELLITE_LABELS_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'

// Add the satellite basemap (+ optional labels) to a Leaflet map in one call, so
// every map on the platform uses the same imagery consistently.
export function addSatelliteBasemap(L: typeof Leaflet, map: Leaflet.Map, withLabels = true): void {
  L.tileLayer(SATELLITE_URL, { attribution: SATELLITE_ATTRIB, maxZoom: 19 }).addTo(map)
  if (withLabels) {
    L.tileLayer(SATELLITE_LABELS_URL, { maxZoom: 19 }).addTo(map)
  }
}
