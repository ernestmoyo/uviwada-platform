# Platform imagery slots

Drop authentic, dignified documentary photos of real Dar es Salaam daycare
centres here (source: the Children in Crossfire baseline report photo library —
Vingunguti, Tandale, Kigogo, Kigamboni, Manzese, Hananasif, Makurumla).
Prefer warm, real, consent-cleared images over stock photography.

Until a file is present, the UI shows a branded gradient fallback — nothing
breaks.

## Expected files

| File | Where it shows | Suggested size | Notes |
|------|----------------|----------------|-------|
| `dar-daycare.jpg` | "Our Approach" section photo band (homepage `#approach`) | 1600×600, landscape | Wide hero-style band; subject lower-left clear for the caption overlay |

## Adding more slots

To add another slot, place the file here and reference it in CSS as
`url('/images/<file>') center/cover, linear-gradient(...)` so the gradient
remains a graceful fallback.

## Consent

Only use images with appropriate consent for public display (V2 §313, §330–341).
Do not publish identifiable children or premises without documented permission.
