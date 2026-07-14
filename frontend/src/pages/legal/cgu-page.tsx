import { LegalPageLayout } from "./legal-page-layout"

export default function CguPage() {
  return (
    <LegalPageLayout title="Conditions générales d'utilisation" updatedAt="14 juillet 2026">
      <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400">
        <strong>Document en cours de finalisation</strong>, en attente de l'immatriculation définitive de
        SOUBADIGITAL. Il décrit fidèlement le fonctionnement actuel du service à la date ci-dessus.
      </p>

      <section>
        <h2>1. Objet</h2>
        <p>
          Les présentes conditions générales d'utilisation (« CGU ») définissent les règles d'accès et
          d'usage du service <strong>geneamap</strong> (le « Service »), une application de généalogie en
          ligne éditée par SOUBADIGITAL (voir <a href="/legal/mentions-legales">Mentions légales</a>),
          permettant de créer, visualiser, éditer et partager des arbres généalogiques ou des
          organigrammes. Toute création de compte ou utilisation du Service implique l'acceptation sans
          réserve des présentes CGU.
        </p>
      </section>

      <section>
        <h2>2. Inscription et compte</h2>
        <p>
          L'inscription se fait avec un numéro de téléphone (identifiant principal) et un mot de passe ;
          une adresse e-mail peut être ajoutée en complément. La connexion peut également s'effectuer par
          code à usage unique (OTP) envoyé par WhatsApp ou e-mail.
        </p>
        <p>
          L'utilisateur garantit l'exactitude des informations fournies lors de l'inscription et
          s'engage à maintenir la confidentialité de son mot de passe. Le Service est réservé aux
          personnes âgées d'au moins 16 ans ; en dessous de cet âge, la création d'un compte doit être
          effectuée par un représentant légal.
        </p>
      </section>

      <section>
        <h2>3. Description du service</h2>
        <p>Selon le forfait souscrit (voir <a href="/legal/cgv">CGV</a> et la page Tarifs), le Service permet notamment :</p>
        <ul>
          <li>de créer un ou plusieurs arbres généalogiques ou organigrammes d'organisation ;</li>
          <li>d'ajouter des fiches personnes (identité, dates, lieux, biographie, photo) et des relations entre elles ;</li>
          <li>d'inviter des collaborateurs (lecture seule ou édition) sur un arbre ;</li>
          <li>de partager un arbre publiquement en lecture seule ;</li>
          <li>d'exporter et d'importer des données au format GEDCOM, et d'exporter un arbre en PDF ;</li>
          <li>de consulter l'historique des modifications d'une fiche (forfait Patrimoine) ;</li>
          <li>d'activer des « correspondances publiques » (voir article 6).</li>
        </ul>
        <p>
          Le Service évolue régulièrement ; SOUBADIGITAL peut ajouter, modifier ou retirer des
          fonctionnalités, notamment pour des raisons techniques, légales ou de sécurité, sans que cela
          constitue une modification substantielle du Service donnant droit à indemnité.
        </p>
      </section>

      <section>
        <h2>4. Contenu déposé par l'utilisateur</h2>
        <p>
          L'utilisateur reste propriétaire des données et contenus (textes, photos, documents) qu'il
          dépose dans ses arbres (« Contenu »). Il concède à SOUBADIGITAL une licence non exclusive,
          limitée à la durée d'utilisation du Service, nécessaire à l'hébergement, l'affichage, la
          sauvegarde et, le cas échéant, l'export du Contenu, dans le seul but de fournir le Service.
        </p>
        <p>L'utilisateur s'engage à ne pas déposer de Contenu :</p>
        <ul>
          <li>portant atteinte aux droits d'un tiers (droit à l'image, droit d'auteur, vie privée) ;</li>
          <li>illicite, diffamatoire, injurieux, ou contraire à l'ordre public ;</li>
          <li>concernant un tiers vivant sans y être raisonnablement autorisé (voir article 5).</li>
        </ul>
      </section>

      <section>
        <h2>5. Données concernant des tiers (généalogie)</h2>
        <p>
          La nature même d'un arbre généalogique implique de saisir des informations sur des tiers
          (parents, enfants, conjoints, membres de la famille) qui ne sont pas eux-mêmes utilisateurs du
          Service, y compris parfois des personnes mineures ou des personnes vivantes n'ayant pas
          consenti individuellement. L'utilisateur qui saisit ces informations :
        </p>
        <ul>
          <li>agit sous sa seule responsabilité et garantit disposer d'une base légitime pour le faire (lien familial, intérêt légitime de mémoire familiale) ;</li>
          <li>s'engage à limiter les informations saisies sur des tiers vivants à ce qui est raisonnable dans un cadre généalogique privé ou partagé restreint ;</li>
          <li>s'engage à retirer, à la demande de la personne concernée ou de son représentant légal, toute information la concernant si celle-ci s'oppose à son traitement.</li>
        </ul>
        <p>
          SOUBADIGITAL n'effectue aucune vérification a priori de l'exactitude ou de la légitimité des
          données saisies et n'engage pas sa responsabilité à ce titre, sans préjudice de son obligation
          de retrait sur signalement (voir Mentions légales, article 5).
        </p>
      </section>

      <section>
        <h2>6. Partage, visibilité et correspondances publiques</h2>
        <p>
          Chaque arbre a une visibilité définie par son propriétaire : <strong>privé</strong> (accessible
          au seul propriétaire et aux collaborateurs invités), <strong>partagé</strong> (accessible aux
          collaborateurs invités) ou <strong>public</strong> (consultable en lecture seule par toute
          personne disposant du lien). Le propriétaire d'un arbre reste seul décisionnaire de sa
          visibilité et des collaborateurs qu'il invite.
        </p>
        <p>
          La fonctionnalité de <strong>correspondances publiques</strong> (disponible selon le forfait) est
          une fonctionnalité <strong>optionnelle</strong>, activée volontairement par le propriétaire de
          l'arbre (« opt-in »), qui permet de détecter des correspondances potentielles (noms, dates)
          entre son arbre et d'autres arbres ayant également activé cette option. Elle peut être
          désactivée à tout moment depuis les paramètres de l'arbre.
        </p>
      </section>

      <section>
        <h2>7. Arbre de démonstration</h2>
        <p>
          Le Service propose un arbre de démonstration public (« Famille Dupont ») permettant de tester
          les fonctionnalités sans créer son propre arbre. Toute modification apportée par un utilisateur
          connecté à cet arbre de démonstration (ajout de personne, déplacement, lien, photo) est
          automatiquement enregistrée dans une <strong>copie personnelle et privée</strong>, propre à cet
          utilisateur, sans jamais modifier la démonstration publique consultée par les autres visiteurs.
        </p>
      </section>

      <section>
        <h2>8. Disponibilité et maintenance</h2>
        <p>
          SOUBADIGITAL met en œuvre les moyens raisonnables pour assurer l'accessibilité et la continuité
          du Service, sans garantie de disponibilité absolue. Le Service peut être interrompu
          ponctuellement pour maintenance, mise à jour ou en cas de force majeure, sans que cela engage la
          responsabilité de SOUBADIGITAL au-delà des engagements prévus, le cas échéant, dans les CGV pour
          les forfaits payants.
        </p>
      </section>

      <section>
        <h2>9. Suspension et résiliation</h2>
        <p>
          L'utilisateur peut cesser d'utiliser le Service à tout moment et supprimer définitivement son
          compte depuis la page « Mon profil » (suppression immédiate du compte, des arbres dont il est
          propriétaire et de leur contenu). Il peut aussi adresser sa demande à{" "}
          <a href="mailto:contact@geneamap.com">contact@geneamap.com</a> (voir également la{" "}
          <a href="/legal/confidentialite">Politique de confidentialité</a>).
        </p>
        <p>
          SOUBADIGITAL peut suspendre ou résilier, après information préalable sauf urgence (contenu
          manifestement illicite, fraude, atteinte à la sécurité du Service), l'accès d'un utilisateur qui
          ne respecte pas les présentes CGU.
        </p>
      </section>

      <section>
        <h2>10. Responsabilité</h2>
        <p>
          Le Service est fourni « en l'état ». SOUBADIGITAL ne saurait être tenue responsable des dommages
          indirects résultant de l'utilisation du Service, ni de la perte de données résultant d'une
          absence de sauvegarde par l'utilisateur de son propre Contenu (export GEDCOM/PDF recommandé pour
          les forfaits qui y donnent droit), ni d'une interruption du Service imputable à un tiers
          (hébergeur, fournisseur de paiement, réseau).
        </p>
      </section>

      <section>
        <h2>11. Données personnelles</h2>
        <p>
          Le traitement des données personnelles est décrit dans la{" "}
          <a href="/legal/confidentialite">Politique de confidentialité</a>, qui fait partie intégrante
          des présentes CGU.
        </p>
      </section>

      <section>
        <h2>12. Modification des CGU</h2>
        <p>
          SOUBADIGITAL peut modifier les présentes CGU à tout moment, notamment pour refléter une
          évolution du Service ou de la réglementation applicable. La version en vigueur est celle publiée
          sur cette page, avec sa date de mise à jour. En cas de modification substantielle, les
          utilisateurs seront informés par un moyen raisonnable (bannière dans l'application ou e-mail).
        </p>
      </section>

      <section>
        <h2>13. Droit applicable et litiges</h2>
        <p>
          Les présentes CGU sont soumises au droit ivoirien. À défaut de résolution amiable, tout litige
          relatif à leur interprétation ou leur exécution relève de la compétence des juridictions de
          Côte d'Ivoire.
        </p>
      </section>
    </LegalPageLayout>
  )
}
