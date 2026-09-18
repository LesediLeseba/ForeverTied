import * as React from 'react'
import { ExternalLink, Loader2, Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState, PageHeader } from '@/pages/admin/shared'
import { useCreateMemorial, useMemorials } from '@/hooks/useAdminData'
import { apiErrorMessage } from '@/lib/api'
import { formatDate } from '@/lib/utils'

const EMPTY_FORM = {
  deceased_name: '',
  dates: '',
  biography: '',
  photo_url: '',
}

/** Admin tab 2 — memorial creator + management table. */
export default function MemorialsPage() {
  const [form, setForm] = React.useState(EMPTY_FORM)
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const memorialsQuery = useMemorials(debouncedSearch || undefined)
  const createMemorial = useCreateMemorial()

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const update =
    (field: keyof typeof EMPTY_FORM) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }))
      setErrors((current) => ({ ...current, [field]: '' }))
    }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.deceased_name.trim()) next.deceased_name = 'Required'
    if (!form.dates.trim()) next.dates = 'Required'
    if (!form.biography.trim()) next.biography = 'Required'
    if (
      form.photo_url.trim() &&
      !/^(https?:\/\/|data:)/i.test(form.photo_url.trim())
    ) {
      next.photo_url = 'Use a full http(s) URL'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    createMemorial.mutate(
      {
        deceased_name: form.deceased_name.trim(),
        dates: form.dates.trim(),
        biography: form.biography.trim(),
        photo_url: form.photo_url.trim() || null,
      },
      { onSuccess: () => setForm(EMPTY_FORM) },
    )
  }

  const rows = memorialsQuery.data?.items ?? []

  return (
    <div className="space-y-8">
      <PageHeader
        title="Memorials"
        description="Create the digital memorial page for a deceased person. The slug is generated automatically from the name and birth year."
      />

      <Card data-testid="memorial-form-card">
        <CardHeader>
          <CardTitle>Create a memorial</CardTitle>
          <CardDescription>
            Media is referenced by direct image URL — paste an Unsplash link or the
            funeral home&rsquo;s hosted photograph.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="deceased-name">Full name</Label>
                <Input
                  id="deceased-name"
                  data-testid="memorial-name-input"
                  placeholder="Nomvula Grace Dlamini"
                  value={form.deceased_name}
                  onChange={update('deceased_name')}
                />
                {errors.deceased_name && (
                  <p className="text-xs font-medium text-[#8C3B2A]">
                    {errors.deceased_name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="memorial-dates">Dates</Label>
                <Input
                  id="memorial-dates"
                  data-testid="memorial-dates-input"
                  placeholder="1948 - 2026"
                  value={form.dates}
                  onChange={update('dates')}
                />
                {errors.dates && (
                  <p className="text-xs font-medium text-[#8C3B2A]">
                    {errors.dates}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memorial-photo">Photo URL</Label>
              <Input
                id="memorial-photo"
                data-testid="memorial-photo-input"
                type="url"
                placeholder="https://images.unsplash.com/photo-1498757581981-8ddb3c0b9b07"
                value={form.photo_url}
                onChange={update('photo_url')}
              />
              {errors.photo_url ? (
                <p className="text-xs font-medium text-[#8C3B2A]">{errors.photo_url}</p>
              ) : (
                <p className="text-xs text-ink-muted">
                  Optional — a neutral placeholder is shown when left blank.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="memorial-biography">Biography</Label>
              <Textarea
                id="memorial-biography"
                data-testid="memorial-biography-input"
                rows={7}
                placeholder="Separate paragraphs with a blank line. Families can send more memories later."
                value={form.biography}
                onChange={update('biography')}
              />
              {errors.biography && (
                <p className="text-xs font-medium text-[#8C3B2A]">{errors.biography}</p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Button
                type="submit"
                data-testid="create-memorial-btn"
                disabled={createMemorial.isPending}
              >
                {createMemorial.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Plus className="h-4 w-4" aria-hidden />
                )}
                Create memorial
              </Button>
              <Button
                type="button"
                variant="ghost"
                data-testid="reset-memorial-form-btn"
                onClick={() => {
                  setForm(EMPTY_FORM)
                  setErrors({})
                }}
              >
                Clear
              </Button>
              {createMemorial.isError && (
                <p role="alert" className="text-sm font-medium text-[#8C3B2A]">
                  {apiErrorMessage(createMemorial.error)}
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card data-testid="memorial-table-card">
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Memorials</CardTitle>
            <CardDescription>
              {memorialsQuery.data?.total ?? 0} records in the database.
            </CardDescription>
          </div>
          <div className="relative w-full max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
              aria-hidden
            />
            <Input
              data-testid="memorial-search-input"
              className="pl-9"
              placeholder="Search name or slug"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent>
          {memorialsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              title="No memorials found"
              description="Create the first memorial with the form above, or adjust your search."
            />
          ) : (
            <Table data-testid="memorial-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Plates</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((memorial) => (
                  <TableRow key={memorial.id} data-testid="memorial-row">
                    <TableCell className="font-medium text-ink">
                      {memorial.deceased_name}
                    </TableCell>
                    <TableCell className="text-ink-muted">{memorial.dates}</TableCell>
                    <TableCell>
                      <code className="rounded bg-secondary/50 px-1.5 py-0.5 text-xs text-ink">
                        {memorial.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span data-testid="memorial-plate-count">
                        {memorial.active_qr_codes}/{memorial.qr_code_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-ink-muted">
                      {formatDate(memorial.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        to={`/memorials/${memorial.slug}`}
                        data-testid={`memorial-view-link-${memorial.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-secondary/50"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        View page
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
