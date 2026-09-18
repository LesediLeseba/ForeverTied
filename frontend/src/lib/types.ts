/** API types mirroring the FastAPI Pydantic schemas. */

export type QRStatus = 'unassigned' | 'active' | 'damaged'

export interface Memorial {
  id: string
  deceased_name: string
  slug: string
  dates: string
  biography: string
  photo_url: string | null
  created_at: string
}

export interface MemorialAdmin extends Memorial {
  qr_code_count: number
  active_qr_codes: number
  bound_codes: string[]
}

export interface MemorialListResponse {
  items: MemorialAdmin[]
  total: number
  limit: number
  offset: number
}

export interface QRCode {
  id: string
  code_identifier: string
  status: QRStatus
  memorial_id: string | null
  created_at: string
  scan_url: string
  memorial_slug: string | null
  deceased_name: string | null
}

export interface QRCodeListResponse {
  items: QRCode[]
  total: number
  limit: number
  offset: number
  counts_by_status: Partial<Record<QRStatus, number>>
}

export interface QRBatchResponse {
  generated: number
  quantity_requested: number
  qr_codes: QRCode[]
}

export interface MemorialCreatePayload {
  deceased_name: string
  dates: string
  biography: string
  photo_url?: string | null
}
