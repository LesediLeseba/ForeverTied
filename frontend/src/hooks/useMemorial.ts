import { useQuery } from '@tanstack/react-query'

import { fetchMemorialBySlug } from '@/lib/api'

/** Public memorial lookup used by /memorials/:slug. */
export function useMemorial(slug: string | undefined) {
  return useQuery({
    queryKey: ['public', 'memorial', slug],
    queryFn: () => fetchMemorialBySlug(slug as string),
    enabled: Boolean(slug),
    retry: false,
    staleTime: 60_000,
  })
}
