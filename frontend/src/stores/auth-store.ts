import { create } from "zustand"
import { jwtDecode } from "jwt-decode"
import api from "@/lib/api"
import type { User } from "@/types"

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  checkAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>
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

  login: async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password })
      localStorage.setItem("token", data.token)
      set({ user: data.user, isAuthenticated: true, isAdmin: data.user?.role === "ADMIN" })
      return { success: true }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erreur de connexion"
      return { success: false, message }
    }
  },

  register: async (name, email, password) => {
    try {
      const { data } = await api.post("/auth/register", { name, email, password })
      localStorage.setItem("token", data.token)
      set({ user: data.user, isAuthenticated: true, isAdmin: data.user?.role === "ADMIN" })
      return { success: true }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erreur d'inscription"
      return { success: false, message }
    }
  },

  logout: () => {
    localStorage.removeItem("token")
    set({ user: null, isAuthenticated: false, isAdmin: false, isLoading: false })
  },

  updateProfile: async (profileData) => {
    try {
      const { data } = await api.put("/users/profile", profileData)
      set({ user: data.user })
      return { success: true, message: data.message }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erreur de mise à jour"
      return { success: false, message }
    }
  },

  upgradePlan: async (plan) => {
    try {
      const { data } = await api.put("/plans/me", { plan })
      set({ user: data.user })
      return { success: true, message: data.message }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Erreur lors du changement de forfait"
      return { success: false, message }
    }
  },
}))
