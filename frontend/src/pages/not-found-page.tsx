import { Link } from "react-router-dom"
import { buttonVariants } from "@/components/ui/button"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-muted-foreground">Cette page n'existe pas</p>
      <div className="flex gap-2">
        <Link to="/" className={buttonVariants({ variant: "outline" })}>Accueil</Link>
        <Link to="/dashboard" className={buttonVariants()}>Tableau de bord</Link>
      </div>
    </div>
  )
}
