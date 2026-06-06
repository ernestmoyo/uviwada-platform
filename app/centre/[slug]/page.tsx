import { notFound } from 'next/navigation'

import { CentreProfile } from '@/components/directory/CentreProfile'
import { fetchRubricSnapshot } from '@/lib/rubric-data'
import { findBySlug } from '@/lib/directory'

export const revalidate = 60

interface Params {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params
  const snapshot = await fetchRubricSnapshot()
  const centre = findBySlug(snapshot, slug)
  if (!centre) return { title: 'Centre not found — UVIWATA' }
  return {
    title: `${centre.name} — UVIWATA Daycare Directory`,
    description: `${centre.name}, ${centre.council ?? 'Dar es Salaam'} — assessed daycare centre on the UVIWATA quality rubric.`
  }
}

export default async function CentrePage({ params }: Params) {
  const { slug } = await params
  const snapshot = await fetchRubricSnapshot()
  const centre = findBySlug(snapshot, slug)
  if (!centre) notFound()

  const dc = snapshot.meta.dataCompleteness
  return <CentreProfile centre={centre} verifiedDate={dc.date_to} />
}
