export type QualityRating = 'green' | 'amber' | 'red'

export type LicenseStatus = 'fully_licensed' | 'pending' | 'not_applied' | 'expired'

export type UserRole = 'member' | 'secretariat' | 'assessor' | 'cic_staff' | 'admin'

export type OrgScope = 'national' | 'regional'

export interface Organisation {
  id: string
  name: string
  scope: OrgScope
  parent_org_id: string | null
  created_at: string
}

export interface AppUser {
  id: string
  org_id: string
  role: UserRole
  full_name: string
  email: string | null
  phone: string | null
  member_id: string | null
  ward: string | null
}

export interface Member {
  id: string
  org_id: string
  centre_name: string
  owner_user_id: string | null
  ward: string
  district: string
  address: string | null
  lat: number | null
  lng: number | null
  phone: string
  email: string | null
  year_founded: number | null
  children_count: number
  caregiver_count: number
  age_band_0_2: number
  age_band_3_4: number
  age_band_5_6: number
  license_status: LicenseStatus
  license_number: string | null
  license_issue_date: string | null
  license_expiry: string | null
  joined_at: string
  latest_quality: QualityRating | null
  created_at: string
}

export interface Training {
  id: string
  org_id: string
  title_sw: string
  title_en: string
  category: string
  scheduled_at: string
  location: string
  capacity: number
  facilitator: string | null
  materials_url: string | null
  created_at: string
}

export interface TrainingRegistration {
  id: string
  training_id: string
  member_id: string
  status: 'registered' | 'attended' | 'absent'
  certificate_url: string | null
  registered_at: string
}

export interface Assessment {
  id: string
  member_id: string
  assessor_user_id: string | null
  conducted_at: string
  rating: QualityRating
  score_total: number
  score_max: number
  notes: string | null
  follow_up_date: string | null
  photos: string[]
  gps_lat: number | null
  gps_lng: number | null
  source: 'web' | 'apk_synced'
  created_at: string
}

export type QualityDimension =
  | 'infrastructure'
  | 'staffing'
  | 'curriculum'
  | 'health_hygiene'
  | 'safeguarding'
  | 'nutrition'

export interface QualityIndicatorScore {
  id: string
  assessment_id: string
  dimension: QualityDimension
  indicator_code: string
  passed: boolean
}

export interface SafeguardingIncident {
  id: string
  member_id: string
  reporter_user_id: string | null
  occurred_on: string
  child_age_band: '0-2' | '3-4' | '5-6'
  incident_type: 'physical' | 'emotional' | 'neglect' | 'other'
  description: string
  action_taken: string | null
  created_at: string
}

export interface Announcement {
  id: string
  org_id: string
  title_sw: string
  title_en: string
  body_sw: string
  body_en: string
  published_at: string
  author_user_id: string | null
}

export interface MemberDocument {
  id: string
  member_id: string
  kind: 'license' | 'insurance' | 'other'
  title: string
  storage_path: string
  uploaded_at: string
}

export interface Database {
  public: {
    Tables: {
      organisations: { Row: Organisation; Insert: Partial<Organisation>; Update: Partial<Organisation> }
      app_users: { Row: AppUser; Insert: Partial<AppUser>; Update: Partial<AppUser> }
      members: { Row: Member; Insert: Partial<Member>; Update: Partial<Member> }
      trainings: { Row: Training; Insert: Partial<Training>; Update: Partial<Training> }
      training_registrations: {
        Row: TrainingRegistration
        Insert: Partial<TrainingRegistration>
        Update: Partial<TrainingRegistration>
      }
      assessments: { Row: Assessment; Insert: Partial<Assessment>; Update: Partial<Assessment> }
      quality_indicator_scores: {
        Row: QualityIndicatorScore
        Insert: Partial<QualityIndicatorScore>
        Update: Partial<QualityIndicatorScore>
      }
      safeguarding_incidents: {
        Row: SafeguardingIncident
        Insert: Partial<SafeguardingIncident>
        Update: Partial<SafeguardingIncident>
      }
      announcements: { Row: Announcement; Insert: Partial<Announcement>; Update: Partial<Announcement> }
      member_documents: {
        Row: MemberDocument
        Insert: Partial<MemberDocument>
        Update: Partial<MemberDocument>
      }
    }
  }
}
