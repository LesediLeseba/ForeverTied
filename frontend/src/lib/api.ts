import axios, { AxiosError } from 'axios'

import type {
  Memorial,
  MemorialAdmin,
  MemorialCreatePayload,
  MemorialListResponse,
  QRBatchResponse,
  QRCode,
  QRCodeListResponse,
  QRStatus,
} from './types'

/**
 * All calls are relative so the browser never touches localhost directly:
 * in dev Vite proxies `/api` and `/q` to FastAPI, in production a reverse
 * proxy does the same job.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
})

export function apiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      const first = detail[0] as { msg?: string } | undefined
      if (first?.msg) return first.msg
    }
    if (error.code === 'ERR_NETWORK') return 'Cannot reach the MemorialCode API.'
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

// --- public ------------------------------------------------------------------

export async function fetchMemorialBySlug(slug: string): Promise<Memorial> {
  const { data } = await http.get<Memorial>(`/api/v1/public/memorials/${slug}`)
  return data
}

// --- admin: memorials --------------------------------------------------------

export async function fetchMemorials(params?: {
  search?: string
  limit?: number
  offset?: number
}): Promise<MemorialListResponse> {
  const { data } = await http.get<MemorialListResponse>('/api/v1/admin/memorials', {
    params,
  })
  return data
}

export async function createMemorial(
  payload: MemorialCreatePayload,
): Promise<MemorialAdmin> {
  const { data } = await http.post<MemorialAdmin>('/api/v1/admin/memorials', payload)
  return data
}

// --- admin: plates -----------------------------------------------------------

export async function fetchQrCodes(params?: {
  status?: QRStatus
  memorialId?: string
  limit?: number
  offset?: number
}): Promise<QRCodeListResponse> {
  const { data } = await http.get<QRCodeListResponse>('/api/v1/admin/qr-codes', {
    params: {
      status: params?.status,
      memorial_id: params?.memorialId,
      limit: params?.limit,
      offset: params?.offset,
    },
  })
  return data
}

export async function generateQrBatch(quantity: number): Promise<QRBatchResponse> {
  const { data } = await http.post<QRBatchResponse>('/api/v1/admin/qr-codes/batch', {
    quantity,
  })
  return data
}

export async function assignQrCode(
  codeIdentifier: string,
  memorialId: string,
  force = false,
): Promise<QRCode> {
  const { data } = await http.patch<QRCode>(
    `/api/v1/admin/qr-codes/${codeIdentifier}/assign`,
    { memorial_id: memorialId, force },
  )
  return data
}

export async function unassignQrCode(codeIdentifier: string): Promise<QRCode> {
  const { data } = await http.patch<QRCode>(
    `/api/v1/admin/qr-codes/${codeIdentifier}/unassign`,
  )
  return data
}

export async function setQrStatus(
  codeIdentifier: string,
  status: QRStatus,
): Promise<QRCode> {
  const { data } = await http.patch<QRCode>(
    `/api/v1/admin/qr-codes/${codeIdentifier}/status`,
    { status },
  )
  return data
}
