// Canonical list of Tanzania's 31 regions (Mkoa) — the top administrative tier
// and the "Province/Region" filter dimension. Names match the 2022 PHC census
// (NBS). Only regions with assessment data are "live"; the rest are shown as
// "coming soon" so the platform presents the whole country without seeding any
// placeholder centres. Pure module — safe on client + server.

export interface RegionInfo {
  name: string
  /** Has assessment data live today (hint; actual state is derived from data). */
  live: boolean
}

// 26 mainland + 5 Zanzibar. Alphabetical.
export const TZ_REGIONS: RegionInfo[] = [
  { name: 'Arusha', live: false },
  { name: 'Dar es Salaam', live: true },
  { name: 'Dodoma', live: false },
  { name: 'Geita', live: false },
  { name: 'Iringa', live: false },
  { name: 'Kagera', live: false },
  { name: 'Kaskazini Pemba', live: false },
  { name: 'Kaskazini Unguja', live: false },
  { name: 'Katavi', live: false },
  { name: 'Kigoma', live: false },
  { name: 'Kilimanjaro', live: false },
  { name: 'Kusini Pemba', live: false },
  { name: 'Kusini Unguja', live: false },
  { name: 'Lindi', live: false },
  { name: 'Manyara', live: false },
  { name: 'Mara', live: false },
  { name: 'Mbeya', live: false },
  { name: 'Mjini Magharibi', live: false },
  { name: 'Morogoro', live: false },
  { name: 'Mtwara', live: false },
  { name: 'Mwanza', live: false },
  { name: 'Njombe', live: false },
  { name: 'Pwani', live: false },
  { name: 'Rukwa', live: false },
  { name: 'Ruvuma', live: false },
  { name: 'Shinyanga', live: false },
  { name: 'Simiyu', live: false },
  { name: 'Singida', live: false },
  { name: 'Songwe', live: false },
  { name: 'Tabora', live: false },
  { name: 'Tanga', live: false }
]

export interface RegionOption {
  value: string
  label: string
  live: boolean
}

/**
 * Build the ordered Province/Region option list: regions that actually have data
 * (from `dataRegions`) come first, then the rest of the 31 as "(coming soon)".
 * Any data region not in the canonical list is still included (defensive).
 */
export function regionOptions(dataRegions: string[]): RegionOption[] {
  const liveSet = new Set(dataRegions.filter(Boolean))
  const names = new Set<string>([...TZ_REGIONS.map((r) => r.name), ...liveSet])
  return Array.from(names)
    .sort((a, b) => {
      const al = liveSet.has(a), bl = liveSet.has(b)
      if (al !== bl) return al ? -1 : 1
      return a.localeCompare(b)
    })
    .map((name) => ({ value: name, label: liveSet.has(name) ? name : `${name} (coming soon)`, live: liveSet.has(name) }))
}

/** True if a selected region has no data yet (so the UI shows a "coming soon" empty state). */
export function isComingSoonRegion(region: string, dataRegions: string[]): boolean {
  return region !== 'All' && !dataRegions.includes(region)
}
