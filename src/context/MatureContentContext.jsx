import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { RESTRICTED_TAG_IDS } from '../data/constants'

const MatureContentContext = createContext(null)

export function MatureContentProvider({ children }) {
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [restrictedTags, setRestrictedTags] = useState([])

  const confirmAge = useCallback((confirmed) => {
    setAgeConfirmed(confirmed)

    if (!confirmed) setRestrictedTags([])
  }, [])

  const toggleRestrictedTag = useCallback((tagId) => {
    if (!RESTRICTED_TAG_IDS.includes(tagId)) return
    setRestrictedTags((current) =>
      current.includes(tagId) ? current.filter((t) => t !== tagId) : [...current, tagId],
    )
  }, [])

  const clearRestricted = useCallback(() => {
    setAgeConfirmed(false)
    setRestrictedTags([])
  }, [])

  const value = useMemo(
    () => ({
      ageConfirmed,
      restrictedTags,
      confirmAge,
      toggleRestrictedTag,
      clearRestricted,

      includeRestricted: ageConfirmed && restrictedTags.length > 0,
    }),
    [ageConfirmed, restrictedTags, confirmAge, toggleRestrictedTag, clearRestricted],
  )

  return <MatureContentContext.Provider value={value}>{children}</MatureContentContext.Provider>
}

export function useMatureContent() {
  const context = useContext(MatureContentContext)
  if (!context) {
    throw new Error('useMatureContent must be used inside <MatureContentProvider>')
  }
  return context
}

export default MatureContentContext
