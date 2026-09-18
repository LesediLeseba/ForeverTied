import * as React from 'react'
import { Loader2, Plus, QrCode } from 'lucide-react'

import PlateCard from '@/components/admin/PlateCard'
import { Badge } from '@/components/ui/badge'
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
import { EmptyState, PageHeader, StatTile } from '@/pages/admin/shared'
import { useGenerateBatch, useQrCodes } from '@/hooks/useAdminData'
import { apiErrorMessage } from '@/lib/api'
import type { QRStatus } from '@/lib/types'

const FILTERS: { value: QRStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All plates' },
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'active', label: 'Active' },
  { value: 'damaged', label: 'Damaged' },
]

/** Admin tab 1 — batch plate generation and the printable QR grid. */
export default function PlatesPage() {
  const [quantity, setQuantity] = React.useState('12')
  const [filter, setFilter] = React.useState<QRStatus | 'all'>('all')
  const [formError, setFormError] = React.useState<string | null>(null)

  const qrQuery = useQrCodes(filter === 'all' ? undefined : filter)
  const generate = useGenerateBatch()

  const plates = qrQuery.data?.items ?? []
  const counts = qrQuery.data?.counts_by_status ?? {}

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const parsed = Number.parseInt(quantity, 10)
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 1000) {
      setFormError('Enter a quantity between 1 and 1000.')
      return
    }
    generate.mutate(parsed)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="QR Plates"
        description="Pre-generate batches of unique plate codes, then print and etch them. Every plate encodes a static resolver URL, so it keeps working even after the memorial behind it is updated."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total plates" value={qrQuery.data?.total ?? 0} testId="stat-total-plates" />
        <StatTile
          label="Unassigned"
          value={counts.unassigned ?? 0}
          testId="stat-unassigned-plates"
        />
        <StatTile
          label="Active"
          value={counts.active ?? 0}
          tone="positive"
          testId="stat-active-plates"
        />
        <StatTile
          label="Damaged"
          value={counts.damaged ?? 0}
          tone="warning"
          testId="stat-damaged-plates"
        />
      </div>

      <Card data-testid="batch-generator-card">
        <CardHeader>
          <CardTitle>Batch generator</CardTitle>
          <CardDescription>
            Generates unique 8-character identifiers and stores them as unassigned
            plates. Bind them to memorials from the Inventory tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* noValidate: surface our own inline error instead of a browser
              tooltip, so validation reads the same in every browser. */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <div className="w-full sm:w-40">
              <Label htmlFor="batch-quantity">Quantity</Label>
              <Input
                id="batch-quantity"
                data-testid="batch-quantity-input"
                type="number"
                min={1}
                max={1000}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>

            <Button
              type="submit"
              data-testid="generate-batch-btn"
              disabled={generate.isPending}
            >
              {generate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Plus className="h-4 w-4" aria-hidden />
              )}
              Generate plates
            </Button>

            {formError && (
              <p
                data-testid="batch-form-error"
                role="alert"
                className="text-sm font-medium text-[#8C3B2A]"
              >
                {formError}
              </p>
            )}
            {generate.isError && (
              <p role="alert" className="text-sm font-medium text-[#8C3B2A]">
                {apiErrorMessage(generate.error)}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card data-testid="plate-grid-card">
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Plate library</CardTitle>
            <CardDescription>
              Download a plate as a 176 px PNG for etching, or copy its scan URL.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                data-testid={`plate-filter-${item.value}`}
                onClick={() => setFilter(item.value)}
                className={
                  item.value === filter
                    ? 'rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-bone'
                    : 'rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink-muted hover:bg-secondary/50'
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {qrQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-44 w-full" />
              ))}
            </div>
          ) : qrQuery.isError ? (
            <EmptyState
              title="Could not load plates"
              description={apiErrorMessage(qrQuery.error, 'The API did not respond.')}
            />
          ) : plates.length === 0 ? (
            <EmptyState
              title="No plates yet"
              description="Generate a batch above to create your first printable QR plates."
              action={
                <Button
                  type="button"
                  data-testid="plate-empty-generate-btn"
                  onClick={() => generate.mutate(12)}
                  disabled={generate.isPending}
                >
                  <QrCode className="h-4 w-4" aria-hidden />
                  Generate 12 plates
                </Button>
              }
            />
          ) : (
            <>
              <div className="mb-4 flex items-center gap-2">
                <Badge variant="outline" data-testid="plate-count-badge">
                  {plates.length} shown
                </Badge>
              </div>
              <div
                data-testid="qr-code-grid"
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
              >
                {plates.map((plate) => (
                  <PlateCard key={plate.id} plate={plate} />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
