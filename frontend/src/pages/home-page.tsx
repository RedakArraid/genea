import { Link } from "react-router-dom"
import { ArrowRight, Users, Share2, Search, Shield } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PricingSection } from "@/components/pricing-section"

const features = [
  {
    icon: Users,
    title: "Arbres interactifs",
    description: "Visualisez et organisez votre famille sur un canvas intuitif avec générations et unions.",
  },
  {
    icon: Search,
    title: "Recherche & chronologie",
    description: "Retrouvez n'importe quel membre et parcourez l'histoire familiale année par année.",
  },
  {
    icon: Share2,
    title: "Partage sécurisé",
    description: "Invitez vos proches en lecteur ou co-éditeur, sans compte requis pour explorer la démo.",
  },
  {
    icon: Shield,
    title: "Données protégées",
    description: "Vos arbres vous appartiennent. Authentification sécurisée et contrôle d'accès granulaire.",
  },
]

export default function HomePage() {
  const { isAuthenticated } = useAuthStore()

  return (
    <>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-col gap-6">
          <Badge variant="secondary" className="w-fit">Généalogie moderne</Badge>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            Construisez et explorez votre histoire familiale
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            GeneaIA vous permet de créer des arbres généalogiques interactifs,
            d'ajouter des relations complexes et de visualiser votre lignée en un coup d'œil.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to={isAuthenticated ? "/dashboard" : "/register"} className={cn(buttonVariants({ size: "lg" }))}>
              {isAuthenticated ? "Mes arbres" : "Créer un compte gratuit"}
              <ArrowRight className="ml-2 size-4" />
            </Link>
            <Link to="/demo" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              Voir la démo
            </Link>
          </div>
        </div>
      </section>

      <PricingSection />

      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="mb-2 size-8 text-primary" />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        GeneaIA — Application de généalogie moderne
      </footer>
    </>
  )
}
