import { useEffect, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { GitBranch, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth-store"
import { useFamilyTreeStore } from "@/stores/family-tree-store"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  const { acceptInvite } = useFamilyTreeStore()
  const [status, setStatus] = useState<"idle" | "accepting" | "success" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const [treeId, setTreeId] = useState<string | null>(null)

  const redirectPath = token ? `/invite/${token}` : "/dashboard"
  const loginUrl = `/login?redirect=${encodeURIComponent(redirectPath)}`
  const registerUrl = `/register?redirect=${encodeURIComponent(redirectPath)}`
  const autoAccept = searchParams.get("accept") !== "0"

  useEffect(() => {
    if (authLoading || !isAuthenticated || !token || status !== "idle" || !autoAccept) return

    const run = async () => {
      setStatus("accepting")
      const result = await acceptInvite(token)
      if (result.success && result.treeId) {
        setTreeId(result.treeId)
        setStatus("success")
        toast.success("Invitation acceptée")
        navigate(`/family-tree/${result.treeId}`, { replace: true })
      } else {
        setError(result.message || "Invitation invalide")
        setStatus("error")
      }
    }
    run()
  }, [authLoading, isAuthenticated, token, status, autoAccept, acceptInvite, navigate])

  const handleManualAccept = async () => {
    if (!token) return
    setStatus("accepting")
    setError(null)
    const result = await acceptInvite(token)
    if (result.success && result.treeId) {
      setTreeId(result.treeId)
      setStatus("success")
      toast.success("Invitation acceptée")
      navigate(`/family-tree/${result.treeId}`)
    } else {
      setError(result.message || "Invitation invalide")
      setStatus("error")
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!token) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation invalide</CardTitle>
            <CardDescription>Le lien d'invitation est incomplet.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center bg-muted/30 p-4 py-16">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
              <GitBranch className="size-6" />
            </div>
            <CardTitle>Invitation à un arbre</CardTitle>
            <CardDescription>
              Connectez-vous ou créez un compte avec l'adresse email invitée pour accepter.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link to={loginUrl} className={cn(buttonVariants(), "w-full")}>
              Se connecter
            </Link>
            <Link to={registerUrl} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
              Créer un compte
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "accepting") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Acceptation de l'invitation…</p>
      </div>
    )
  }

  if (status === "success" && treeId) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Invitation acceptée</CardTitle>
            <CardDescription>Redirection vers l'arbre…</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to={`/family-tree/${treeId}`} className={buttonVariants()}>
              Ouvrir l'arbre
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-muted/30 p-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Accepter l'invitation</CardTitle>
          <CardDescription>
            {error || "Vous avez été invité à collaborer sur un arbre généalogique."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {status === "error" && (
            <Button onClick={handleManualAccept}>Réessayer</Button>
          )}
          {status === "idle" && !autoAccept && (
            <Button onClick={handleManualAccept}>Accepter l'invitation</Button>
          )}
          <Link to="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            Retour au tableau de bord
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
