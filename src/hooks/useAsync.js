import { useCallback, useEffect, useRef, useState } from 'react'

export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const runIdRef = useRef(0)

  const callback = useCallback(fn, deps)

  const run = useCallback(() => {
    const runId = ++runIdRef.current
    setState((prev) => ({ ...prev, loading: true, error: null }))

    Promise.resolve()
      .then(callback)
      .then((data) => {
        if (runId === runIdRef.current) setState({ data, error: null, loading: false })
      })
      .catch((error) => {
        if (runId === runIdRef.current) setState({ data: null, error, loading: false })
      })
  }, [callback])

  useEffect(() => {
    run()

    return () => {
      runIdRef.current += 1
    }
  }, [run])

  return { ...state, refetch: run }
}

export default useAsync
