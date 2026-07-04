import { useEffect, useState } from "react"
import { getStorageConfig } from "@/lib/upload"
import type { StorageConfig } from "@/types"

const DEFAULT: StorageConfig = {
  enabled: false,
  ready: false,
  limits: { photoMaxMb: 5, documentMaxMb: 20 },
}

let cached: StorageConfig | null = null
let cachePromise: Promise<StorageConfig> | null = null

export function useStorageConfig() {
  const [config, setConfig] = useState<StorageConfig>(cached || DEFAULT)

  useEffect(() => {
    if (cached) {
      setConfig(cached)
      return
    }
    if (!cachePromise) {
      cachePromise = getStorageConfig().then((c) => {
        cached = c
        return c
      })
    }
    cachePromise.then(setConfig).catch(() => setConfig(DEFAULT))
  }, [])

  return config
}

export function photoMaxBytes(config: StorageConfig) {
  return (config.limits?.photoMaxMb ?? 5) * 1024 * 1024
}
