import { useEffect, useRef, useState } from "react"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

export function useReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null)
  const reducedMotion = usePrefersReducedMotion()
  const [visible, setVisible] = useState(reducedMotion)

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true)
      return
    }
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [reducedMotion, threshold])

  return { ref, visible }
}
