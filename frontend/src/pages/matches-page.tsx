import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const MOCK_MATCHES = [
  { id: "m1", tree: "Famille Martin", owner: "Jean Martin", region: "Bretagne", shared: 3, confidence: 94, via: "Jean-Pierre — 1902" },
  { id: "m2", tree: "Arbre Lefevre", owner: "Marie Lefevre", region: "Hauts-de-France", shared: 2, confidence: 81, via: "Marie-Louise — 1928" },
  { id: "m3", tree: "Lignée Picard", owner: "Pierre Picard", region: "Île-de-France", shared: 1, confidence: 68, via: "Pierre — 1954" },
  { id: "m4", tree: "Famille Roussel", owner: "Sophie Roussel", region: "Normandie", shared: 1, confidence: 42, via: "Yvonne — 1934" },
  { id: "m5", tree: "Branche Auvergnate", owner: "Laurent Pradel", region: "Auvergne", shared: 2, confidence: 65, via: "Camille — 1960" },
]

export default function MatchesPage() {
  const { t } = useTranslation("tree")
  const [privacyEnabled, setPrivacyEnabled] = useState(true)

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("matches.kicker")}</p>
          <h1 className="text-2xl font-bold">{t("matches.title")}</h1>
          <p className="mt-1 max-w-lg text-muted-foreground">
            {t("matches.subtitle")}
          </p>
        </div>
        <Button variant="outline" onClick={() => setPrivacyEnabled(!privacyEnabled)}>
          {t("matches.privacy")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {MOCK_MATCHES.map((m) => (
          <Card key={m.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{m.tree}</CardTitle>
                <Badge variant={m.confidence > 80 ? "default" : m.confidence > 60 ? "secondary" : "outline"}>
                  {m.confidence}%
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{m.owner} · {m.region}</p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm">
                <span><strong>{m.shared}</strong> {t("matches.sharedPersons")}</span>
                <span className="text-muted-foreground">{t("matches.via", { name: m.via })}</span>
              </div>
              <Button className="mt-4 w-full" variant="outline" size="sm">
                {t("matches.examine")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {t("matches.demoNotice")}
      </p>
    </div>
  )
}
