import { LegalPageLayout } from "./legal-page-layout"

export default function MentionsLegalesPage() {
  return (
    <LegalPageLayout title="Mentions légales" updatedAt="14 juillet 2026">
      <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400">
        <strong>Document en cours de finalisation.</strong> SOUBADIGITAL est en cours d'immatriculation
        au Registre du Commerce et du Crédit Mobilier (RCCM) de Côte d'Ivoire. Les mentions marquées
        « à compléter » seront mises à jour dès l'obtention du numéro RCCM définitif.
      </p>

      <section>
        <h2>1. Éditeur du site</h2>
        <p>
          Le site et le service <strong>geneamap</strong>, accessible à l'adresse{" "}
          <a href="https://geneamap.com">https://geneamap.com</a>, sont édités par :
        </p>
        <ul>
          <li><strong>SOUBADIGITAL</strong> (société en cours d'immatriculation)</li>
          <li>Forme juridique : à compléter</li>
          <li>Siège social : à compléter (Côte d'Ivoire)</li>
          <li>RCCM : en cours d'attribution</li>
          <li>Numéro de contribuable (NCC) : à compléter</li>
          <li>Représentant légal : à compléter</li>
          <li>Contact : <a href="mailto:contact@geneamap.com">contact@geneamap.com</a></li>
        </ul>
      </section>

      <section>
        <h2>2. Directeur de la publication</h2>
        <p>Le directeur de la publication est le représentant légal de SOUBADIGITAL (à compléter).</p>
      </section>

      <section>
        <h2>3. Hébergement</h2>
        <p>Le service geneamap repose sur les prestataires techniques suivants :</p>
        <ul>
          <li>
            <strong>Hébergement applicatif et base de données</strong> : serveur privé virtuel opéré par
            Contabo GmbH, Aschauer Straße 32a, 81549 Munich, Allemagne — <a href="https://contabo.com">contabo.com</a>.
          </li>
          <li>
            <strong>Stockage des fichiers</strong> (photos, documents, arrière-plans) : Cloudflare R2,
            Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, États-Unis — <a href="https://cloudflare.com">cloudflare.com</a>.
          </li>
          <li>
            <strong>Paiement en ligne</strong> : Paystack (Paystack Payments Ltd / groupe Stripe) — <a href="https://paystack.com">paystack.com</a>.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Propriété intellectuelle</h2>
        <p>
          La structure générale du site, les textes, logos, graphismes, icônes et plus généralement
          l'ensemble des éléments composant le service geneamap (à l'exception des contenus déposés par
          les utilisateurs, voir CGU) sont la propriété de SOUBADIGITAL ou font l'objet d'une autorisation
          d'utilisation. Toute reproduction, représentation, modification ou adaptation, totale ou partielle,
          sans autorisation écrite préalable, est interdite et pourra constituer une contrefaçon.
        </p>
      </section>

      <section>
        <h2>5. Signalement d'un contenu</h2>
        <p>
          Pour signaler un contenu illicite, portant atteinte aux droits d'un tiers, ou une donnée
          personnelle vous concernant publiée sans votre accord, contactez{" "}
          <a href="mailto:contact@geneamap.com">contact@geneamap.com</a> en décrivant précisément le
          contenu concerné et son emplacement (URL de l'arbre, nom de la fiche personne).
        </p>
      </section>

      <section>
        <h2>6. Droit applicable</h2>
        <p>
          Les présentes mentions légales sont soumises au droit ivoirien. Pour le détail des règles
          applicables à l'usage du service et à la protection des données, voir les{" "}
          <a href="/legal/cgu">CGU</a> et la <a href="/legal/confidentialite">Politique de confidentialité</a>.
        </p>
      </section>
    </LegalPageLayout>
  )
}
