import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  apiErrorMessage,
  assignQrCode,
  createMemorial,
  fetchMemorials,
  fetchQrCodes,
  generateQrBatch,
  setQrStatus,
  unassignQrCode,
} from '@/lib/api'
import type { MemorialCreatePayload, QRStatus } from '@/lib/types'

export const queryKeys = {
  memorials: (params?: { search?: string }) =>
    ['admin', 'memorials', params?.search ?? ''] as const,
  qrCodes: (params?: { status?: QRStatus }) =>
    ['admin', 'qr-codes', params?.status ?? 'all'] as const,
}

export function useMemorials(search?: string) {
  return useQuery({
    queryKey: queryKeys.memorials({ search }),
    queryFn: () => fetchMemorials({ search, limit: 200 }),
    staleTime: 15_000,
  })
}

export function useQrCodes(status?: QRStatus) {
  return useQuery({
    queryKey: queryKeys.qrCodes({ status }),
    queryFn: () => fetchQrCodes({ status, limit: 500 }),
    staleTime: 15_000,
  })
}

function useAdminMutation<TVariables, T>(
  mutationFn: (variables: TVariables) => Promise<T>,
  options: { success: (value: T) => string; invalidate?: string[][] },
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (value) => {
      toast.success(options.success(value))
      for (const key of options.invalidate ?? []) {
        void queryClient.invalidateQueries({ queryKey: key })
      }
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error))
    },
  })
}

const ADMIN_KEYS = [
  ['admin', 'memorials'],
  ['admin', 'qr-codes'],
]

export function useCreateMemorial() {
  return useAdminMutation(
    (payload: MemorialCreatePayload) => createMemorial(payload),
    {
      success: (memorial) => `Memorial created → /memorials/${memorial.slug}`,
      invalidate: ADMIN_KEYS,
    },
  )
}

export function useGenerateBatch() {
  return useAdminMutation((quantity: number) => generateQrBatch(quantity), {
    success: (batch) => `Generated ${batch.generated} QR plate${batch.generated === 1 ? '' : 's'}`,
    invalidate: ADMIN_KEYS,
  })
}

export function useAssignQrCode() {
  return useAdminMutation(
    (args: { codeIdentifier: string; memorialId: string; force?: boolean }) =>
      assignQrCode(args.codeIdentifier, args.memorialId, args.force),
    {
      success: (plate) => `Plate ${plate.code_identifier} bound to ${plate.deceased_name ?? 'memorial'}`,
      invalidate: ADMIN_KEYS,
    },
  )
}

export function useUnassignQrCode() {
  return useAdminMutation((codeIdentifier: string) => unassignQrCode(codeIdentifier), {
    success: (plate) => `Plate ${plate.code_identifier} returned to inventory`,
    invalidate: ADMIN_KEYS,
  })
}

export function useSetQrStatus() {
  return useAdminMutation(
    (args: { codeIdentifier: string; status: QRStatus }) =>
      setQrStatus(args.codeIdentifier, args.status),
    {
      success: (plate) => `Plate ${plate.code_identifier} marked ${plate.status}`,
      invalidate: ADMIN_KEYS,
    },
  )
}
