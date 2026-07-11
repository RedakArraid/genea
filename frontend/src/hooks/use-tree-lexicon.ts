import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { isOrganizationTree, type TreeType } from "@/lib/tree-type"

export function useTreeLexicon(treeType?: TreeType) {
  const { t } = useTranslation("tree")
  const isOrg = isOrganizationTree({ treeType })

  return useMemo(
    () => ({
      isOrg,
      managers: isOrg ? t("org.relations.managers") : t("relations.parents"),
      team: (count: number) =>
        isOrg ? t("org.relations.team", { count }) : t("relations.children", { count }),
      addManager: isOrg ? t("org.relations.addManager") : t("relations.addButton"),
      addTeamMember: isOrg ? t("org.relations.addTeamMember") : t("relations.addButton"),
      newTeamMember: isOrg ? t("org.relations.newTeamMember") : t("relations.newChild"),
      linkExistingTeamMember: isOrg ? t("org.relations.linkExistingMember") : t("relations.linkExistingChild"),
      asManager: isOrg ? t("org.relations.asManager") : t("relations.asParent"),
      asTeamMember: isOrg ? t("org.relations.asTeamMember") : t("relations.asChild"),
      managerOf: (name: string) =>
        isOrg ? t("org.dialogs.managerOf", { name }) : t("dialogs.parentOf", { name }),
      teamMemberOf: (name: string) =>
        isOrg ? t("org.dialogs.teamMemberOf", { name }) : t("dialogs.childOf", { name }),
      firstName: isOrg ? t("org.person.firstName") : t("person.firstName"),
      lastName: isOrg ? t("org.person.lastName") : t("person.lastName"),
      firstNameRequired: isOrg ? t("org.person.firstNameRequired") : t("person.firstNameRequired"),
      role: isOrg ? t("org.person.role") : t("person.occupation"),
      joined: isOrg ? t("org.person.joined") : t("person.birthDate"),
      left: isOrg ? t("org.person.left") : t("person.deathDate"),
      site: isOrg ? t("org.person.site") : t("person.birthPlace"),
      biography: isOrg ? t("org.person.notes") : t("person.biography"),
      addTitle: isOrg ? t("org.dialogs.addTitle") : t("dialogs.addTitle"),
    }),
    [isOrg, t],
  )
}
