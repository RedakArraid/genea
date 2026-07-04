import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth-store"
import { getPlanById } from "@/lib/plans"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function ProfilePage() {
  const { user, updateProfile } = useAuthStore()
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const currentPlan = getPlanById(user?.plan || "SOLO")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const payload: Record<string, string> = { name, email }
    if (newPassword) {
      payload.currentPassword = currentPassword
      payload.newPassword = newPassword
    }
    const result = await updateProfile(payload)
    setLoading(false)
    if (result.success) {
      toast.success(result.message || "Profil mis à jour")
      setCurrentPassword("")
      setNewPassword("")
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Mon profil</CardTitle>
          <CardDescription>Gérez vos informations personnelles</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {user?.createdAt && (
              <p className="text-sm text-muted-foreground">
                Membre depuis le {new Date(user.createdAt).toLocaleDateString("fr-FR")}
              </p>
            )}
            <Separator />
            <p className="text-sm font-medium">Changer le mot de passe</p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="current">Mot de passe actuel</Label>
              <Input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new">Nouveau mot de passe</Label>
              <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Abonnement</CardTitle>
          <CardDescription>Votre forfait actuel</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">{currentPlan.name}</span>
            <Badge variant="secondary">{currentPlan.priceLabel}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Comparez les forfaits et changez d'offre depuis la page publique Tarifs.
          </p>
          <Link to="/pricing" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            Gérer mon forfait
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
