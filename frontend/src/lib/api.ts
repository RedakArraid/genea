import axios from "axios"
import { useAuthStore } from "@/stores/auth-store"

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
  (response) => response,
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
