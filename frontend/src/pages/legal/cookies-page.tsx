import { LegalPageLayout } from "./legal-page-layout"

export default function CookiesPage() {
  return (
    <LegalPageLayout title="Politique de cookies" updatedAt="14 juillet 2026">
      <section>
        <h2>1. Ce que geneamap utilise</h2>
        <p>
          geneamap utilise très peu de traceurs. Il n'y a <strong>aucun cookie publicitaire, ni aucun
          outil d'analyse d'audience ou de suivi tiers</strong> (pas de Google Analytics ni équivalent) à
          la date de cette page.
        </p>
        <h3>1.1 Cookie déposé</h3>
        <ul>
          <li>
            <strong>Préférence d'affichage du menu latéral</strong> — cookie strictement fonctionnel,
            first-party, qui mémorise si le panneau latéral de l'application est ouvert ou replié. Il ne
            contient aucune donnée personnelle et n'est pas utilisé à des fins de suivi.
          </li>
        </ul>
        <h3>1.2 Stockage local du navigateur (localStorage)</h3>
        <p>
          En complément des cookies, l'application utilise le stockage local de votre navigateur (non
          transmis automatiquement au serveur à chaque requête, contrairement à un cookie) pour :
        </p>
        <ul>
          <li>conserver votre <strong>jeton de connexion</strong> (JWT) le temps de votre session, afin de ne pas avoir à vous reconnecter à chaque page ;</li>
          <li>mémoriser votre <strong>langue préférée</strong> (français/anglais).</li>
        </ul>
        <p>
          Ces données sont supprimées si vous vous déconnectez ou si vous videz les données de
          navigation de votre navigateur.
        </p>
      </section>

      <section>
        <h2>2. Base légale</h2>
        <p>
          Le cookie de préférence d'affichage et le stockage local du jeton de connexion sont strictement
          nécessaires au fonctionnement du Service (maintien de la session, préférence d'interface) : ils
          ne sont donc pas soumis à un recueil de consentement préalable.
        </p>
      </section>

      <section>
        <h2>3. Gestion des cookies</h2>
        <p>
          Vous pouvez à tout moment supprimer ou bloquer les cookies via les paramètres de votre
          navigateur. Le blocage du cookie de préférence d'affichage n'empêche pas l'utilisation du
          Service ; il réinitialisera simplement l'état du menu latéral à chaque visite.
        </p>
      </section>

      <section>
        <h2>4. Évolution</h2>
        <p>
          Si geneamap venait à ajouter des cookies de mesure d'audience ou tout autre traceur non
          strictement nécessaire, cette page serait mise à jour au préalable et, le cas échéant, un
          bandeau de consentement serait mis en place.
        </p>
      </section>
    </LegalPageLayout>
  )
}
