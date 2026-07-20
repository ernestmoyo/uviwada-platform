'use client'

import type { VisualAid, VisualAidItem } from '@/lib/curriculum'

// Printable teaching aids for an AI lesson plan. Rendered as cut-out cards so a
// careworker can print, cut along the dashed edge, and hold them up to the
// children. Deliberately image-free: a large emoji + label needs no network, no
// image API, and prints cleanly on a mono office printer.

function Card({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div
      style={{
        border: '2px dashed #cbd5e1',
        borderRadius: 10,
        padding: '0.9rem 0.6rem',
        textAlign: 'center',
        background: '#fff',
        breakInside: 'avoid',
        minWidth: wide ? 160 : 110
      }}
    >
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.35rem', lineHeight: 1.25 }}>{children}</div>
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.5rem' }}>{children}</div>
}

function CountingCard({ item }: { item: VisualAidItem }) {
  // label is the numeral; repeat the emoji that many times so the child can count.
  const n = Math.max(0, Math.min(10, parseInt(item.label, 10) || 0))
  return (
    <Card wide>
      <div style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1, color: 'var(--primary-dark, #0F3D6E)' }}>{item.label}</div>
      <div style={{ fontSize: '1.5rem', lineHeight: 1.3, marginTop: '0.3rem', letterSpacing: '0.1rem' }}>
        {Array.from({ length: n }, () => item.emoji).join('')}
      </div>
    </Card>
  )
}

function AidBlock({ aid }: { aid: VisualAid }) {
  const groups = Array.from(new Set(aid.items.map((i) => i.group).filter(Boolean))) as string[]

  let body: React.ReactNode
  if (aid.type === 'counting') {
    body = <Grid>{aid.items.map((i, k) => <CountingCard key={k} item={i} />)}</Grid>
  } else if (aid.type === 'sorting' && groups.length > 0) {
    body = (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(groups.length, 2)}, 1fr)`, gap: '0.75rem', marginTop: '0.5rem' }}>
        {groups.map((g) => (
          <div key={g} style={{ border: '1px solid var(--border, #e2e8f0)', borderRadius: 10, padding: '0.6rem' }}>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', textAlign: 'center', marginBottom: '0.4rem' }}>{g}</div>
            <Grid>
              {aid.items.filter((i) => i.group === g).map((i, k) => (
                <Card key={k}><div style={{ fontSize: '2.2rem', lineHeight: 1 }}>{i.emoji}</div><Label>{i.label}</Label></Card>
              ))}
            </Grid>
          </div>
        ))}
      </div>
    )
  } else if (aid.type === 'storyboard') {
    body = (
      <Grid>
        {aid.items.map((i, k) => (
          <Card key={k} wide>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted, #64748b)' }}>{k + 1}</div>
            <div style={{ fontSize: '2.4rem', lineHeight: 1 }}>{i.emoji}</div>
            <Label>{i.label}</Label>
          </Card>
        ))}
      </Grid>
    )
  } else {
    body = (
      <Grid>
        {aid.items.map((i, k) => (
          <Card key={k}><div style={{ fontSize: '2.6rem', lineHeight: 1 }}>{i.emoji}</div><Label>{i.label}</Label></Card>
        ))}
      </Grid>
    )
  }

  return (
    <section style={{ marginTop: '1rem', breakInside: 'avoid' }}>
      <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{aid.title}</h4>
      <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--muted, #64748b)' }}>{aid.instruction}</p>
      {body}
    </section>
  )
}

export function VisualAids({ aids, lang }: { aids?: VisualAid[]; lang: 'sw' | 'en' }) {
  if (!aids || aids.length === 0) return null
  const sw = lang === 'sw'
  return (
    <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border, #e2e8f0)', paddingTop: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span aria-hidden>✂️</span>{sw ? 'Vifaa vya kuona' : 'Visual aids'}
          </h3>
          <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--muted, #64748b)' }}>
            {sw ? 'Chapisha, kata kwenye mistari, na waoneshe watoto.' : 'Print, cut along the dashed lines, and show the children.'}
          </p>
        </div>
        <button type="button" onClick={() => window.print()} className="btn btn-outline no-print" style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}>
          {sw ? 'Chapisha' : 'Print'}
        </button>
      </div>
      {aids.map((a, i) => <AidBlock key={i} aid={a} />)}
    </div>
  )
}
