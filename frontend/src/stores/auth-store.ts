import { create } from "zustand"
import { jwtDecode } from "jwt-decode"
import api from "@/lib/api"
import i18n, { SUPPORTED_LOCALES, type Locale } from "@/i18n"
import { getApiErrorPayload, translateApiError } from "@/lib/translate-error"
import type { User } from "@/types"

/** Applique la langue du profil utilisateur (login / checkAuth) */
function syncLocale(user: User | null | undefined) {
  const locale = user?.locale as Locale | undefined
  if (locale && SUPPORTED_LOCALES.includes(locale) && i18n.language?.split("-")[0] !== locale) {
    i18n.changeLanguage(locale)
  }
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  checkAuth: () => Promise<void>
  login: (login: string, password: string) => Promise<{ success: boolean; message?: string }>
  requestOtp: (phone: string, phoneCountry?: string) => Promise<{ success: boolean; message?: string }>
  verifyOtp: (phone: string, code: string, phoneCountry?: string) => Promise<{ success: boolean; message?: string }>
  register: (name: string, phone: string, password: string, email?: string, phoneCountry?: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  updateProfile: (data: Record<string, unknown>) => Promise<{ success: boolean; message?: string }>
  upgradePlan: (plan: import("@/types").PlanId) => Promise<{ success: boolean; message?: string }>
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isAdmin: false,
  isLoading: true,

  checkAuth: async () => {
    set({ isLoading: true })
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        set({ isAuthenticated: false, user: null, isAdmin: false, isLoading: false })
        return
      }

      const decoded = jwtDecode<{ exp: number }>(token)
      if (decoded.exp < Date.now() / 1000) {
        localStorage.removeItem("token")
        set({ isAuthenticated: false, user: null, isAdmin: false, isLoading: false })
        return
      }

      const { data } = await api.get("/auth/me")
      syncLocale(data.user)
      set({
        user: data.user,
        isAuthenticated: true,
        isAdmin: data.user?.role === "ADMIN",
        isLoading: false,
      })
    } catch {
      localStorage.removeItem("token")
      set({ isAuthenticated: false, user: null, isAdmin: false, isLoading: false })
    }
  },

  login: async (login, password) => {
    try {
      const { data } = await api.post("/auth/login", { login, password })
      localStorage.setItem("token", data.token)
      syncLocale(data.user)
      set({ user: data.user, isAuthenticated: true, isAdmin: data.user?.role === "ADMIN" })
      return { success: true }
    } catch (error: unknown) {
      return {
        success: false,
        message: translateApiError(getApiErrorPayload(error), "errors:loginError"),
      }
    }
  },

  requestOtp: async (phone, phoneCountry = "CI") => {
    try {
      const { data } = await api.post("/auth/otp/request", { phone, phoneCountry })
      return { success: true, message: data.message }
    } catch (error: unknown) {
      return {
        success: false,
        message: translateApiError(getApiErrorPayload(error), "errors:otpSendError"),
      }
    }
  },

  verifyOtp: async (phone, code, phoneCountry = "CI") => {
    try {
      const { data } = await api.post("/auth/otp/verify", { phone, code, phoneCountry })
      localStorage.setItem("token", data.token)
      syncLocale(data.user)
      set({ user: data.user, isAuthenticated: true, isAdmin: data.user?.role === "ADMIN" })
      return { success: true }
    } catch (error: unknown) {
      return {
        success: false,
        message: translateApiError(getApiErrorPayload(error), "errors:otpVerifyError"),
      }
    }
  },

  register: async (name, phone, password, email, phoneCountry = "CI") => {
    try {
      const { data } = await api.post("/auth/register", {
        name,
        phone,
        password,
        phoneCountry,
        locale: i18n.language?.split("-")[0] || "fr",
        ...(email?.trim() ? { email: email.trim() } : {}),
      })
      localStorage.setItem("token", data.token)
      syncLocale(data.user)
      set({ user: data.user, isAuthenticated: true, isAdmin: data.user?.role === "ADMIN" })
      return { success: true }
    } catch (error: unknown) {
      return {
        success: false,
        message: translateApiError(getApiErrorPayload(error), "errors:registerError"),
      }
    }
  },

  logout: () => {
    localStorage.removeItem("token")
    set({ user: null, isAuthenticated: false, isAdmin: false, isLoading: false })
  },

  updateProfile: async (profileData) => {
    try {
      const { data } = await api.put("/users/profile", profileData)
      if (data.user?.locale) syncLocale(data.user)
      set({ user: data.user })
      return { success: true, message: data.message }
    } catch (error: unknown) {
      return {
        success: false,
        message: translateApiError(getApiErrorPayload(error), "errors:updateError"),
      }
    }
  },

  upgradePlan: async (plan) => {
    try {
      const { data } = await api.put("/plans/me", { plan })
      set({ user: data.user })
      return { success: true, message: data.message }
    } catch (error: unknown) {
      return {
        success: false,
        message: translateApiError(getApiErrorPayload(error), "errors:planChangeError"),
      }
    }
  },
}))
