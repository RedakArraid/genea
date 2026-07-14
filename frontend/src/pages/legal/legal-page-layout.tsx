import type { ReactNode } from "react"
import { Link } from "react-router-dom"

interface LegalPageLayoutProps {
  title: string
  updatedAt: string
  children: ReactNode
}

/** Mise en page commune aux documents légaux (CGU, CGV, confidentialité, cookies, mentions légales). */
export function LegalPageLayout({ title, updatedAt, children }: LegalPageLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <nav className="mb-8 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <Link to="/legal/mentions-legales" className="hover:text-foreground hover:underline">
          Mentions légales
        </Link>
        <Link to="/legal/cgu" className="hover:text-foreground hover:underline">
          CGU
        </Link>
        <Link to="/legal/cgv" className="hover:text-foreground hover:underline">
          CGV
        </Link>
        <Link to="/legal/confidentialite" className="hover:text-foreground hover:underline">
          Confidentialité
        </Link>
        <Link to="/legal/cookies" className="hover:text-foreground hover:underline">
          Cookies
        </Link>
      </nav>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Dernière mise à jour : {updatedAt}</p>
      <div className="legal-content mt-10 flex flex-col gap-6 text-sm leading-relaxed text-foreground [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:flex [&_ol]:flex-col [&_ol]:gap-1 [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_strong]:text-foreground [&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline">
        {children}
      </div>
    </div>
  )
}
