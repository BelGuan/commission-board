import { useState } from 'react'
import { Lightbox } from '../../common/Lightbox'
import { EmptyState } from '../../common/EmptyState'

export function PortfolioTab({ artist }) {
  const [openIndex, setOpenIndex] = useState(-1)
  const images = artist.portfolioImages ?? []

  if (!images.length) {
    return (
      <EmptyState
        title="No portfolio pieces yet"
        description="This artist is leading with their commission sheet. Check the Reviews tab for finished work clients have described."
      />
    )
  }

  return (
    <>
      <div className="columns-2 gap-4 md:columns-3 [&>*]:mb-4">
        {images.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => setOpenIndex(index)}
            aria-label={`Open portfolio image ${index + 1} of ${images.length}`}
            className="block w-full break-inside-avoid overflow-hidden rounded-card border border-border bg-surface-muted transition-shadow hover:shadow-lift"
          >
            <img
              src={src}
              alt={`Portfolio piece ${index + 1} by ${artist.displayName}`}
              loading="lazy"
              className="w-full transition-transform duration-500 hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      <Lightbox
        images={images}
        index={openIndex}
        onIndexChange={setOpenIndex}
        onClose={() => setOpenIndex(-1)}
        caption={`Portfolio — ${artist.displayName}`}
      />
    </>
  )
}

export default PortfolioTab
