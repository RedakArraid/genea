import { LegalPageLayout } from "./legal-page-layout"

export default function ConfidentialitePage() {
  return (
    <LegalPageLayout title="Politique de confidentialité" updatedAt="14 juillet 2026">
      <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400">
        <strong>Document en cours de finalisation</strong>, en attente de l'immatriculation définitive de
        SOUBADIGITAL. Il décrit fidèlement les traitements de données réellement effectués par le service
        à la date ci-dessus.
      </p>

      <section>
        <h2>1. Responsable du traitement</h2>
        <p>
          Le responsable du traitement des données personnelles collectées via geneamap est SOUBADIGITAL
          (voir <a href="/legal/mentions-legales">Mentions légales</a>). Pour toute question relative à
          vos données, contactez <a href="mailto:contact@geneamap.com">contact@geneamap.com</a>.
        </p>
      </section>

      <section>
        <h2>2. Données collectées</h2>
        <h3>2.1 Données de compte</h3>
        <ul>
          <li>Numéro de téléphone (identifiant principal de connexion) ;</li>
          <li>Adresse e-mail (facultative) ;</li>
          <li>Nom ;</li>
          <li>Mot de passe (stocké sous forme hachée, jamais en clair) ;</li>
          <li>Langue préférée, forfait souscrit et statut d'abonnement.</li>
        </ul>
        <h3>2.2 Données saisies dans les arbres généalogiques</h3>
        <p>
          Pour chaque fiche personne créée dans un arbre : prénom, nom, dates et lieux de naissance/décès,
          profession, biographie, genre, photo de profil, et documents joints (actes, images) que
          l'utilisateur choisit de téléverser. Ces données concernent souvent des <strong>tiers</strong>{" "}
          (membres de la famille), qui ne sont pas nécessairement utilisateurs du Service — voir l'article
          7 sur leurs droits.
        </p>
        <h3>2.3 Données de paiement</h3>
        <p>
          Pour les forfaits payants : montant, devise, statut et référence de transaction, forfait
          souscrit. Les données de carte bancaire ne transitent jamais par les serveurs de geneamap : elles
          sont traitées directement par le prestataire de paiement Paystack.
        </p>
        <h3>2.4 Données techniques</h3>
        <p>
          Adresse IP et journaux techniques (logs serveur) à des fins de sécurité et de diagnostic ;
          jeton de connexion (JWT) stocké dans le navigateur de l'utilisateur (voir{" "}
          <a href="/legal/cookies">Politique de cookies</a>).
        </p>
      </section>

      <section>
        <h2>3. Finalités du traitement</h2>
        <ul>
          <li>Création et gestion du compte utilisateur, authentification (mot de passe ou code à usage unique par WhatsApp/e-mail) ;</li>
          <li>Fourniture des fonctionnalités du Service (arbres, partage, export, historique) ;</li>
          <li>Traitement des paiements et gestion des forfaits ;</li>
          <li>Support et réponse aux demandes des utilisateurs ;</li>
          <li>Sécurité, prévention de la fraude et des abus, journalisation technique ;</li>
          <li>Mise en relation optionnelle entre arbres via les correspondances publiques (uniquement si activée volontairement par le propriétaire de l'arbre).</li>
        </ul>
      </section>

      <section>
        <h2>4. Base légale</h2>
        <p>
          Les traitements reposent sur l'exécution du contrat liant l'utilisateur à SOUBADIGITAL
          (fourniture du Service souscrit), sur le consentement de l'utilisateur pour les fonctionnalités
          optionnelles (correspondances publiques, notifications), et sur l'intérêt légitime de
          SOUBADIGITAL pour la sécurité et l'amélioration du Service.
        </p>
      </section>

      <section>
        <h2>5. Destinataires et sous-traitants</h2>
        <p>Les données sont partagées avec les prestataires strictement nécessaires au fonctionnement du Service :</p>
        <ul>
          <li><strong>Cloudflare</strong> (stockage objet R2) pour l'hébergement des photos et documents ;</li>
          <li><strong>Paystack</strong> pour le traitement des paiements ;</li>
          <li>un <strong>prestataire d'envoi d'e-mails (SMTP)</strong> pour les e-mails transactionnels (codes de connexion, invitations, notifications) ;</li>
          <li><strong>OpenWA</strong> (service d'envoi WhatsApp) pour l'envoi des codes de connexion par WhatsApp, lorsque ce canal est utilisé ;</li>
          <li><strong>Contabo</strong>, hébergeur du serveur applicatif et de la base de données.</li>
        </ul>
        <p>
          Certains de ces prestataires étant établis hors de Côte d'Ivoire (Cloudflare aux États-Unis,
          Contabo en Allemagne), les données peuvent faire l'objet d'un transfert international,
          nécessaire à la fourniture du Service. SOUBADIGITAL veille à ne recourir qu'à des prestataires
          offrant des garanties de sécurité appropriées. Les données ne sont ni vendues ni utilisées à des
          fins publicitaires par des tiers.
        </p>
      </section>

      <section>
        <h2>6. Durée de conservation</h2>
        <ul>
          <li>Données de compte et d'arbres : conservées tant que le compte est actif ;</li>
          <li>Données de paiement : conservées pendant la durée nécessaire aux obligations comptables et fiscales applicables ;</li>
          <li>Journaux techniques : conservés pour une durée limitée à des fins de sécurité.</li>
        </ul>
      </section>

      <section>
        <h2>7. Vos droits</h2>
        <p>
          Toute personne concernée (utilisateur, ou tiers dont les données figurent dans un arbre) dispose
          d'un droit d'accès, de rectification, d'effacement et d'opposition sur les données la concernant,
          ainsi que d'un droit à la portabilité des données qu'elle a elle-même fournies (via l'export
          GEDCOM/PDF pour les utilisateurs disposant d'un forfait le permettant).
        </p>
        <p>
          Ces droits s'exercent en écrivant à{" "}
          <a href="mailto:contact@geneamap.com">contact@geneamap.com</a>, en précisant votre demande et,
          si nécessaire, l'arbre et la fiche concernés. Vous pouvez également supprimer vous-même votre
          compte à tout moment depuis la page « Mon profil » : cette action efface immédiatement et
          définitivement votre compte, les arbres dont vous êtes propriétaire ainsi que les fiches,
          photos et documents associés. Les arbres où vous n'êtes que collaborateur ne sont pas
          supprimés ; votre accès à ceux-ci est simplement retiré.
        </p>
        <p>
          Vous disposez également du droit d'introduire une réclamation auprès de l'autorité ivoirienne
          compétente en matière de protection des données personnelles.
        </p>
      </section>

      <section>
        <h2>8. Mineurs</h2>
        <p>
          La création d'un compte est réservée aux personnes d'au moins 16 ans (voir{" "}
          <a href="/legal/cgu">CGU</a>). Des personnes mineures peuvent en revanche apparaître comme{" "}
          <em>sujets</em> de fiches dans un arbre généalogique créé par un adulte (parent, tuteur) ; le
          représentant légal d'un mineur peut demander le retrait de ces informations en écrivant à{" "}
          <a href="mailto:contact@geneamap.com">contact@geneamap.com</a>.
        </p>
      </section>

      <section>
        <h2>9. Sécurité</h2>
        <p>
          Les mots de passe sont hachés (bcrypt) et jamais stockés en clair. Les échanges avec le Service
          sont chiffrés (HTTPS). L'accès aux données en administration est restreint aux comptes
          disposant du rôle « administrateur ». Les fichiers (photos, documents) sont servis via un accès
          contrôlé par jeton d'authentification, jamais directement depuis le stockage.
        </p>
      </section>

      <section>
        <h2>10. Cookies</h2>
        <p>
          L'usage des cookies et technologies similaires est décrit dans la{" "}
          <a href="/legal/cookies">Politique de cookies</a>.
        </p>
      </section>

      <section>
        <h2>11. Modification de la présente politique</h2>
        <p>
          Cette politique peut être mise à jour pour refléter une évolution du Service ou de la
          réglementation. La date de dernière mise à jour figure en haut de cette page.
        </p>
      </section>
    </LegalPageLayout>
  )
}
