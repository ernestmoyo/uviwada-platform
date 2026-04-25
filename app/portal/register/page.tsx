import { Footer } from '@/components/Footer'
import { NavBar } from '@/components/NavBar'
import { RegisterForm } from '@/components/RegisterForm'
import { TopBar } from '@/components/TopBar'

export const dynamic = 'force-dynamic'

export default function RegisterPage() {
  return (
    <>
      <TopBar />
      <NavBar />
      <main className="section">
        <div className="container" style={{ maxWidth: '760px' }}>
          <div className="section-header">
            <span className="section-tag">UVIWADA</span>
            <h2>Sajili Kituo Chako · Register Your Centre</h2>
            <p className="section-desc">
              Jaza fomu hii ili kujiunga na UVIWADA. Utaingia moja kwa moja kwenye portal yako baada ya kujisajili. ·
              Fill in this form to join UVIWADA. You will be signed in to your portal immediately after submission.
            </p>
          </div>
          <div className="portal-form-card">
            <RegisterForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
