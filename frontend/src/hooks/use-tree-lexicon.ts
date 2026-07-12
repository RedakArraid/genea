import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { isOrganizationTree } from "@/lib/tree-type"
import { applyTemplate, resolveOrgLexicon } from "@/lib/org-lexicon"
import type { FamilyTree, TreeType } from "@/types"

type LexiconTree =
  | Pick<FamilyTree, "treeType" | "orgLexicon">
  | TreeType
  | null
  | undefined

function resolveLexiconTree(tree?: LexiconTree): Pick<FamilyTree, "treeType" | "orgLexicon"> | null | undefined {
  if (typeof tree === "string") return { treeType: tree }
  return tree ?? undefined
}

export function useTreeLexicon(tree?: LexiconTree) {
  const { t } = useTranslation("tree")
  const resolved = resolveLexiconTree(tree)
  const isOrg = isOrganizationTree(resolved ?? undefined)
  const config = useMemo(() => (isOrg ? resolveOrgLexicon(resolved ?? undefined) : null), [isOrg, resolved])

  return useMemo(
    () => ({
      isOrg,
      config,
      levelTerm: config?.levelTerm ?? "Niveau",
      levelAbbrev: config?.levelAbbrev ?? "N",
      levelOrder: config?.levelOrder ?? "TOP_HIGH",
      managers: isOrg && config ? config.superiorLabel : t("relations.parents"),
      team: (count: number) =>
        isOrg && config
          ? `${config.subordinateLabel} (${count})`
          : t("relations.children", { count }),
      addManager: isOrg && config ? config.addSuperior : t("relations.addButton"),
      addTeamMember: isOrg && config ? config.addSubordinate : t("relations.addButton"),
      newTeamMember: isOrg && config ? config.newSubordinate : t("relations.newChild"),
      linkExistingTeamMember:
        isOrg && config ? config.linkExistingSubordinate : t("relations.linkExistingChild"),
      asManager: isOrg && config ? config.asSuperior : t("relations.asParent"),
      asTeamMember: isOrg && config ? config.asSubordinate : t("relations.asChild"),
      managerOf: (name: string) =>
        isOrg && config ? applyTemplate(config.superiorOf, name) : t("dialogs.parentOf", { name }),
      teamMemberOf: (name: string) =>
        isOrg && config ? applyTemplate(config.subordinateOf, name) : t("dialogs.childOf", { name }),
      firstName: isOrg ? t("org.person.firstName") : t("person.firstName"),
      lastName: isOrg ? t("org.person.lastName") : t("person.lastName"),
      firstNameRequired: isOrg ? t("org.person.firstNameRequired") : t("person.firstNameRequired"),
      role: isOrg && config ? config.roleLabel : t("person.occupation"),
      joined: isOrg ? t("org.person.joined") : t("person.birthDate"),
      left: isOrg ? t("org.person.left") : t("person.deathDate"),
      site: isOrg ? t("org.person.site") : t("person.birthPlace"),
      biography: isOrg ? t("org.person.notes") : t("person.biography"),
      addTitle: isOrg && config ? config.addTitle : t("dialogs.addTitle"),
    }),
    [isOrg, config, t]
  )
}
