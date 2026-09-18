import * as React from 'react'
import { Link2, Loader2, RotateCcw, TriangleAlert } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState, PageHeader } from '@/pages/admin/shared'
import {
  useAssignQrCode,
  useMemorials,
  useQrCodes,
  useSetQrStatus,
  useUnassignQrCode,
} from '@/hooks/useAdminData'
import type { QRCode } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const STATUS_VARIANT = {
  unassigned: 'unassigned',
  active: 'active',
  damaged: 'damaged',
} as const

/** Admin tab 3 — bind unassigned plates to memorials. */
export default function InventoryPage() {
  const [selectedCode, setSelectedCode] = React.useState<string>('')
  const [selectedMemorial, setSelectedMemorial] = React.useState<string>('')
  const [damageTarget, setDamageTarget] = React.useState<QRCode | null>(null)

  const platesQuery = useQrCodes()
  const memorialsQuery = useMemorials()
  const assign = useAssignQrCode()
  const unassign = useUnassignQrCode()
  const setStatus = useSetQrStatus()

  const plates = platesQuery.data?.items ?? []
  const memorials = memorialsQuery.data?.items ?? []
  const unassignedPlates = plates.filter((plate) => plate.status === 'unassigned')

  const handleAssign = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedCode || !selectedMemorial) return

    assign.mutate(
      { codeIdentifier: selectedCode, memorialId: selectedMemorial },
      {
        onSuccess: () => {
          setSelectedCode('')
          setSelectedMemorial('')
        },
      },
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inventory"
        description="Bind a physical plate to its memorial. Binding flips the plate to active, which is what makes a scan resolve to a page."
      />

      <Card data-testid="assignment-card">
        <CardHeader>
          <CardTitle>Assign a plate</CardTitle>
          <CardDescription>
            Choose an unassigned plate and the memorial it belongs to. The plate
            stays printable — only the record behind it changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleAssign}
            className="grid gap-5 lg:grid-cols-[1fr_1.4fr_auto] lg:items-end"
          >
            <div className="space-y-2">
              <Label htmlFor="plate-select">Plate code</Label>
              <Select
                value={selectedCode}
                onValueChange={setSelectedCode}
                disabled={unassignedPlates.length === 0}
              >
                <SelectTrigger id="plate-select" data-testid="assign-plate-select">
                  <SelectValue
                    placeholder={
                      unassignedPlates.length === 0
                        ? 'No unassigned plates'
                        : 'Select an unassigned plate'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {unassignedPlates.map((plate) => (
                    <SelectItem
                      key={plate.id}
                      value={plate.code_identifier}
                      data-testid={`assign-plate-option-${plate.code_identifier.toLowerCase()}`}
                    >
                      {plate.code_identifier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memorial-select">Memorial</Label>
              <Select
                value={selectedMemorial}
                onValueChange={setSelectedMemorial}
                disabled={memorials.length === 0}
              >
                <SelectTrigger id="memorial-select" data-testid="assign-memorial-select">
                  <SelectValue
                    placeholder={
                      memorials.length === 0 ? 'No memorials yet' : 'Select a memorial'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {memorials.map((memorial) => (
                    <SelectItem
                      key={memorial.id}
                      value={memorial.id}
                      data-testid={`assign-memorial-option-${memorial.slug}`}
                    >
                      {memorial.deceased_name} · {memorial.slug}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              data-testid="assign-plate-btn"
              disabled={!selectedCode || !selectedMemorial || assign.isPending}
            >
              {assign.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Link2 className="h-4 w-4" aria-hidden />
              )}
              Bind plate
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card data-testid="inventory-table-card">
        <CardHeader>
          <CardTitle>Plate inventory</CardTitle>
          <CardDescription>
            Every plate in the system, newest first, with its current binding.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {platesQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : plates.length === 0 ? (
            <EmptyState
              title="Inventory is empty"
              description="Generate a batch on the QR Plates tab to start binding plates."
            />
          ) : (
            <Table data-testid="inventory-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Plate code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Memorial</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plates.map((plate) => {
                  const code = plate.code_identifier.toLowerCase()
                  return (
                    <TableRow key={plate.id} data-testid="qr-code-row" data-code={plate.code_identifier}>
                      <TableCell>
                        <span className="font-mono text-sm font-semibold tracking-[0.15em] text-ink">
                          {plate.code_identifier}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={STATUS_VARIANT[plate.status]}
                          data-testid={`qr-row-status-${code}`}
                        >
                          {plate.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {plate.memorial_slug ? (
                          <span className="text-ink">
                            {plate.deceased_name}
                            <span className="block text-xs text-ink-muted">
                              /memorials/{plate.memorial_slug}
                            </span>
                          </span>
                        ) : (
                          <span className="text-ink-muted">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-ink-muted">
                        {formatDate(plate.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            data-testid={`unassign-btn-${code}`}
                            disabled={plate.memorial_id === null || unassign.isPending}
                            onClick={() => unassign.mutate(plate.code_identifier)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                            Unassign
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            data-testid={`mark-damaged-btn-${code}`}
                            disabled={plate.status === 'damaged'}
                            onClick={() => setDamageTarget(plate)}
                          >
                            <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
                            Damaged
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Destructive action gets an explicit confirmation dialog */}
      <Dialog
        open={damageTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDamageTarget(null)
        }}
      >
        <DialogContent data-testid="damage-confirm-dialog">
          <DialogHeader>
            <DialogTitle>Retire this plate?</DialogTitle>
            <DialogDescription>
              Marking a plate as damaged stops it resolving to a memorial. Any
              existing binding is released, so a replacement plate can be issued
              and bound to the same person.
            </DialogDescription>
          </DialogHeader>

          {damageTarget && (
            <div className="rounded-lg border border-line bg-bone p-4">
              <p className="font-mono text-lg font-semibold tracking-[0.18em] text-ink">
                {damageTarget.code_identifier}
              </p>
              <Separator className="my-3" />
              <p className="text-sm text-ink-muted">
                {damageTarget.memorial_slug
                  ? `Currently bound to ${damageTarget.deceased_name} (/memorials/${damageTarget.memorial_slug})`
                  : 'Currently unassigned'}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-testid="damage-cancel-btn"
              onClick={() => setDamageTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              data-testid="damage-confirm-btn"
              disabled={setStatus.isPending || !damageTarget}
              onClick={() => {
                if (!damageTarget) return
                setStatus.mutate(
                  { codeIdentifier: damageTarget.code_identifier, status: 'damaged' },
                  { onSuccess: () => setDamageTarget(null) },
                )
              }}
            >
              {setStatus.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <TriangleAlert className="h-4 w-4" aria-hidden />
              )}
              Mark as damaged
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
