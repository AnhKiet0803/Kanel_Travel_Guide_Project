import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Loads a paged list from the admin API.
 * fetcher(params) must return { items, total }. Changing `params` reloads automatically; call reload() to refresh manually.
 * `fetcher` must be a stable function (declared outside the component) and `params` a plain object.
 * If requests overlap, only the result of the latest one is used.
 */
export function usePagedList(fetcher, params) {
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState({ id: '', items: [], total: 0, data: null, error: '' })
  const latest = useRef(0)
  const key = JSON.stringify(params)
  const id = `${key}#${version}`

  useEffect(() => {
    const ticket = ++latest.current
    const settle = (patch) => {
      if (latest.current === ticket) {
        setResult({ id: `${key}#${version}`, items: [], total: 0, data: null, error: '', ...patch })
      }
    }
    fetcher(JSON.parse(key))
      .then((data) => settle({ items: data?.items ?? [], total: data?.total ?? 0, data }))
      .catch((error) => settle({ error: error.message }))
  }, [fetcher, key, version])

  const reload = useCallback(() => setVersion((value) => value + 1), [])
  // Loading while the current result does not belong to the latest request; the old list stays visible meanwhile.
  const loading = result.id !== id
  // `data` is the raw API response (for extra fields such as unreadCount).
  return { items: result.items, total: result.total, data: result.data, loading, error: loading ? '' : result.error, reload }
}
