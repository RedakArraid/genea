import { useEffect, useState } from "react"
import api from "@/lib/api"
import { isProtectedMediaUrl, resolveMediaUrl } from "@/lib/upload"
import { cn } from "@/lib/utils"

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

interface AuthenticatedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string | null | undefined
  fallback?: React.ReactNode
}

export function AuthenticatedImage({
  src,
  fallback = null,
  className,
  alt = "",
  onError,
  ...props
}: AuthenticatedImageProps) {
  const [displaySrc, setDisplaySrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false

    const load = async () => {
      setFailed(false)
      setDisplaySrc(null)
      if (!src) return

      const resolved = resolveMediaUrl(src)
      if (!resolved) return

      if (!isProtectedMediaUrl(resolved)) {
        setDisplaySrc(resolved)
        return
      }

      try {
        const { data } = await api.get(toApiPath(resolved), { responseType: "blob" })
        objectUrl = URL.createObjectURL(data)
        if (!cancelled) setDisplaySrc(objectUrl)
      } catch {
        if (!cancelled) setFailed(true)
      }
    }

    void load()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src])

  if (failed || !displaySrc) {
    return fallback ? <>{fallback}</> : null
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={cn(className)}
      onError={(e) => {
        setFailed(true)
        onError?.(e)
      }}
      {...props}
    />
  )
}
