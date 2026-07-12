import axios from "axios"
import { useAuthStore } from "@/stores/auth-store"
import { setPendingDemoFork } from "@/lib/demo-fork-signal"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const locale = localStorage.getItem("geneamap_locale")
    ?? localStorage.getItem("geneamap_locale")
  if (locale) {
    config.headers["Accept-Language"] = locale
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    const forkTreeId = response.data?.demoForkTreeId
    if (typeof forkTreeId === "string") {
      setPendingDemoFork(forkTreeId)
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = !!localStorage.getItem("token")
      localStorage.removeItem("token")
      if (hadToken) {
        useAuthStore.getState().logout()
      }
    }
    return Promise.reject(error)
  }
)

export default api
