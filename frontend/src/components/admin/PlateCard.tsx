import * as React from 'react'
import { Check, Copy, Download } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { QRCode } from '@/lib/types'

const STATUS_VARIANT: Record<QRCode['status'], 'unassigned' | 'active' | 'damaged'> = {
  unassigned: 'unassigned',
  active: 'active',
  damaged: 'damaged',
}

/**
 * One printable plate: the QR encodes the static resolver URL
 * (`{API_BASE_URL}/q/{code}`) returned by the API as `scan_url`.
 */
export default function PlateCard({ plate }: { plate: QRCode }) {
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const [copied, setCopied] = React.useState(false)

  const scanUrl = React.useMemo(
    () =>
      plate.scan_url.startsWith('http')
        ? plate.scan_url
        : `${window.location.origin}${plate.scan_url}`,
    [plate.scan_url],
  )

  const handleDownload = React.useCallback(() => {
    // qrcode.react renders a <canvas> inside this wrapper.
    const canvas = wrapRef.current?.querySelector('canvas')
    if (!canvas) {
      toast.error('QR image is not ready yet — please try again.')
      return
    }
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = url
    link.download = `memorialcode-plate-${plate.code_identifier}.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
    toast.success(`Downloaded plate ${plate.code_identifier}`)
  }, [plate.code_identifier])

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(scanUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
      toast.success('Scan URL copied to clipboard')
    } catch {
      toast.error('Clipboard unavailable — copy the URL manually.')
    }
  }, [scanUrl])

  return (
    <article
      data-testid="qr-code-card"
      data-code={plate.code_identifier}
      className="flex flex-col rounded-lg border border-line bg-surface p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p
            data-testid="qr-code-identifier"
            className="font-mono text-base font-semibold tracking-[0.18em] text-ink"
          >
            {plate.code_identifier}
          </p>
          <p className="mt-0.5 text-[0.68rem] uppercase tracking-wider text-ink-muted">
            {plate.memorial_slug ? plate.deceased_name : 'Not yet bound'}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[plate.status]} data-testid="qr-code-status">
          {plate.status}
        </Badge>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div ref={wrapRef} className="rounded-md border border-line bg-surface p-2">
          <QRCodeCanvas
            value={scanUrl}
            size={176}
            level="M"
            includeMargin
            fgColor="#1B2A26"
            bgColor="#FFFFFF"
            style={{ width: 88, height: 88 }}
          />
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <Button
            type="button"
            size="sm"
            variant="default"
            data-testid={`qr-download-btn-${plate.code_identifier.toLowerCase()}`}
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" aria-hidden />
            Download PNG
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-testid={`qr-copy-btn-${plate.code_identifier.toLowerCase()}`}
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-4 w-4" aria-hidden />
            ) : (
              <Copy className="h-4 w-4" aria-hidden />
            )}
            {copied ? 'Copied' : 'Copy URL'}
          </Button>
          <p className="truncate text-[0.68rem] text-ink-muted" title={plate.scan_url}>
            {plate.scan_url}
          </p>
        </div>
      </div>
    </article>
  )
}
