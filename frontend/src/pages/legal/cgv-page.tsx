import { LegalPageLayout } from "./legal-page-layout"

export default function CgvPage() {
  return (
    <LegalPageLayout title="Conditions générales de vente" updatedAt="14 juillet 2026">
      <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400">
        <strong>Document en cours de finalisation</strong>, en attente de l'immatriculation définitive de
        SOUBADIGITAL. Les présentes CGV complètent les <a href="/legal/cgu">CGU</a> pour tout achat d'un
        forfait payant.
      </p>

      <section>
        <h2>1. Objet et champ d'application</h2>
        <p>
          Les présentes conditions générales de vente (« CGV ») s'appliquent à tout achat d'un forfait
          payant (« Forfait ») du service geneamap, édité par SOUBADIGITAL (voir{" "}
          <a href="/legal/mentions-legales">Mentions légales</a>), par un utilisateur (« le Client »).
          Elles priment, pour les questions relatives au paiement et à la facturation, sur les{" "}
          <a href="/legal/cgu">CGU</a>.
        </p>
      </section>

      <section>
        <h2>2. Forfaits et tarifs</h2>
        <p>Trois forfaits sont proposés à la date des présentes CGV (détail à jour sur la page Tarifs) :</p>
        <ul>
          <li><strong>Découverte</strong> — gratuit, avec période d'essai de 30 jours ; 1 arbre, jusqu'à 20 personnes.</li>
          <li><strong>Famille</strong> — 24 $ US / an (ou 2,50 $ US / mois) ; 3 arbres, 50 personnes par arbre, export GEDCOM/PDF.</li>
          <li><strong>Patrimoine</strong> — 42 $ US / an (ou 4,50 $ US / mois) ; 5 arbres, 200 personnes par arbre, import/export GEDCOM, historique des modifications.</li>
        </ul>
        <p>
          Les prix sont exprimés et facturés en <strong>dollars américains (USD)</strong>, seule devise de
          règlement effectif via le prestataire de paiement Paystack. Un équivalent indicatif en francs
          CFA (XOF) est affiché à titre informatif sur la base d'un taux de change de référence ; il ne
          constitue pas le montant contractuel facturé.
        </p>
        <p>
          SOUBADIGITAL se réserve le droit de modifier les tarifs à tout moment ; toute modification ne
          s'applique qu'aux nouveaux achats ou renouvellements postérieurs à sa publication, et non aux
          périodes déjà payées.
        </p>
      </section>

      <section>
        <h2>3. Commande et paiement</h2>
        <p>
          La souscription à un Forfait s'effectue depuis la page Tarifs ou le tableau de bord de
          l'utilisateur connecté. Le paiement est traité par le prestataire tiers <strong>Paystack</strong>
          , par carte bancaire ou tout autre moyen qu'il propose. SOUBADIGITAL ne stocke aucune donnée de
          carte bancaire ; seules les informations de transaction (montant, statut, référence) sont
          conservées.
        </p>
        <p>
          La souscription est activée dès confirmation du paiement par Paystack. Un code promotionnel
          peut, le cas échéant, réduire le montant dû ; les codes promotionnels sont soumis à conditions
          d'usage propres (validité, forfaits éligibles, nombre d'utilisations) affichées lors de leur
          application.
        </p>
      </section>

      <section>
        <h2>4. Durée, expiration et renouvellement</h2>
        <p>
          Un Forfait payant est acquis pour une durée fixe (1 an ou 1 mois selon l'option choisie) à
          compter de la date de paiement. <strong>Il n'y a pas de renouvellement ni de prélèvement
          automatique</strong> : à l'expiration de la période payée, le compte repasse automatiquement aux
          droits du forfait Découverte, et l'utilisateur doit effectuer un nouvel achat pour prolonger son
          Forfait. Un rappel peut être envoyé avant l'expiration.
        </p>
      </section>

      <section>
        <h2>5. Droit de rétractation</h2>
        <p>
          Conformément aux règles applicables à la fourniture de contenu numérique non fourni sur un
          support matériel, le Client reconnaît et accepte expressément, en validant son paiement, que
          l'exécution du Forfait <strong>commence immédiatement</strong> dès l'activation des droits
          associés, ce qui emporte renonciation à tout droit de rétractation dès lors que le Forfait a été
          activé et utilisé. Avant toute activation, le Client peut renoncer à sa commande en contactant{" "}
          <a href="mailto:contact@geneamap.com">contact@geneamap.com</a>.
        </p>
      </section>

      <section>
        <h2>6. Remboursement</h2>
        <p>
          Sauf erreur de facturation imputable à SOUBADIGITAL (double débit, montant erroné) ou disposition
          légale impérative contraire, les sommes versées pour un Forfait ne sont pas remboursables, y
          compris en cas de résiliation anticipée à l'initiative du Client ou de non-utilisation du
          Service pendant la période souscrite. Toute réclamation de facturation doit être adressée à{" "}
          <a href="mailto:contact@geneamap.com">contact@geneamap.com</a> dans un délai raisonnable suivant
          la transaction concernée.
        </p>
      </section>

      <section>
        <h2>7. Facture</h2>
        <p>
          Un récapitulatif de transaction est accessible depuis le compte du Client. Une facture détaillée
          peut être demandée à <a href="mailto:contact@geneamap.com">contact@geneamap.com</a>.
        </p>
      </section>

      <section>
        <h2>8. Responsabilité liée au paiement</h2>
        <p>
          SOUBADIGITAL n'est pas responsable des dysfonctionnements, retards ou refus de paiement
          imputables au prestataire Paystack, à l'établissement bancaire du Client ou à des problèmes de
          connectivité. En cas d'échec de paiement, l'activation du Forfait n'a pas lieu.
        </p>
      </section>

      <section>
        <h2>9. Droit applicable et litiges</h2>
        <p>
          Les présentes CGV sont soumises au droit ivoirien. À défaut de résolution amiable dans un délai
          raisonnable après réclamation écrite, tout litige relève de la compétence des juridictions de
          Côte d'Ivoire.
        </p>
      </section>
    </LegalPageLayout>
  )
}
