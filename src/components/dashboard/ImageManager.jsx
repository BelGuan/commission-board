import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Trash2, Upload } from 'lucide-react'
import { Button } from '../ui/Button'
import { FilterSection } from '../filters/FilterSection'
import { useToast } from '../../context/ToastContext'
import {
  addArtistImage,
  deleteArtistImage,
  reorderArtistImages,
  uploadImage,
} from '../../api/client'

const TITLES = {
  sheet: 'Commission sheet images',
  portfolio: 'Portfolio pieces',
}

export function ImageManager({ kind, artist, onChanged }) {
  const toast = useToast()
  const fileInput = useRef(null)
  const [busy, setBusy] = useState(false)

  const images =
    kind === 'sheet' ? (artist?.sheetImageDetails ?? []) : (artist?.portfolioImageDetails ?? [])

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const { url } = await uploadImage(file)
      await addArtistImage(kind, { url, sortOrder: images.length })
      toast.success('Image added.')
      onChanged?.()
    } catch (error) {
      toast.error(error)
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const remove = async (id) => {
    setBusy(true)
    try {
      await deleteArtistImage(kind, id)
      toast.success('Image removed.')
      onChanged?.()
    } catch (error) {
      toast.error(error)
    } finally {
      setBusy(false)
    }
  }

  const move = async (index, delta) => {
    const next = [...images]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]

    setBusy(true)
    try {
      await reorderArtistImages(kind, next.map((i) => i.id))
      toast.success('Order saved.')
      onChanged?.()
    } catch (error) {
      toast.error(error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <FilterSection title={TITLES[kind]}>
      <div className="space-y-3">
        {images.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((image, index) => (
              <li
                key={image.id}
                className="overflow-hidden rounded-card border border-border bg-surface"
              >
                <img src={image.url} alt="" className="aspect-square w-full object-cover" />
                <div className="flex items-center justify-between gap-1 p-1.5">
                  <div className="flex gap-0.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy || index === 0}
                      onClick={() => move(index, -1)}
                      aria-label="Move earlier"
                    >
                      <ArrowLeft size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy || index === images.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label="Move later"
                    >
                      <ArrowRight size={14} />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => remove(image.id)}
                    aria-label="Delete image"
                    className="text-danger"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-card border border-dashed border-border p-6 text-center text-small text-text-muted">
            Nothing here yet.
          </p>
        )}

        <div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleUpload}
            className="hidden"
            id={`upload-${kind}`}
          />
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
          >
            <Upload size={15} aria-hidden="true" />
            {busy ? 'Working…' : 'Upload an image'}
          </Button>
          <p className="mt-1.5 text-caption text-text-muted">
            JPEG, PNG, WebP or GIF. The server checks the file's actual bytes, not its name.
          </p>
        </div>
      </div>
    </FilterSection>
  )
}

export default ImageManager
