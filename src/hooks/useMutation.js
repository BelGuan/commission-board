import { useCallback, useState } from 'react'
import { useToast } from '../context/ToastContext'

export function useMutation(fn, { successMessage, onSuccess } = {}) {
  const toast = useToast()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  const mutate = useCallback(
    async (...args) => {
      setPending(true)
      setError(null)
      try {
        const result = await fn(...args)
        if (successMessage) toast.success(successMessage)
        await onSuccess?.(result)
        return result
      } catch (caught) {

        setError(caught)
        toast.error(caught)
        return undefined
      } finally {
        setPending(false)
      }
    },
    [fn, successMessage, onSuccess, toast],
  )

  return { mutate, pending, error }
}

export default useMutation
