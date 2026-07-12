import { useEffect, useState } from "react"
import api from "@/lib/api"
import { isProtectedMediaUrl, resolveMediaUrl } from "@/lib/upload"

function toApiPath(resolved: string): string {
  const base = (api.defaults.baseURL || "").replace(/\/$/, "")
  if (resolved.startsWith(base)) {
    return resolved.slice(base.length) || "/"
  }
  if (resolved.startsWith("/api/")) {
    return resolved.slice("/api".length)
  }
  return resolved
}

/** Charge une URL média protégée (JWT) en object URL pour CSS background / img. */
export function useProtectedMediaUrl(src: string | null | undefined): string | null {
  const [displaySrc, setDisplaySrc] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false

    const load = async () => {
      setDisplaySrc(null)
      if (!src) return

      const resolved = resolveMediaUrl(src)
      if (!resolved) return

      if (!isProtectedMediaUrl(src)) {
        if (!cancelled) setDisplaySrc(resolved)
        return
      }

      try {
        const { data } = await api.get<Blob>(toApiPath(resolved), { responseType: "blob" })
        objectUrl = URL.createObjectURL(data)
        if (!cancelled) setDisplaySrc(objectUrl)
      } catch {
        if (!cancelled) setDisplaySrc(null)
      }
    }

    void load()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src])

  return displaySrc
}
