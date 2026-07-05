import { Baby, ChevronDown, Link2, UserPlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function runAfterMenu(action: () => void) {
  queueMicrotask(action)
}

interface ChildAddMenuProps {
  onNewChild: () => void
  onLinkExisting: () => void
  compact?: boolean
}

export function ChildAddMenu({ onNewChild, onLinkExisting, compact = false }: ChildAddMenuProps) {
  const { t } = useTranslation("tree")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          compact ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              title={t("relations.newChild")}
              data-testid="child-add-menu-compact"
            />
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs"
              data-testid="child-add-menu"
            />
          )
        }
      >
        {compact ? (
          <Baby className="size-3" />
        ) : (
          <>
            {t("relations.addButton")}
            <ChevronDown className="size-3" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[200]">
        <DropdownMenuItem
          data-testid="child-add-new"
          onClick={() => runAfterMenu(onNewChild)}
        >
          <UserPlus className="size-4" />
          {t("relations.newChild")}
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="child-add-link-existing"
          onClick={() => runAfterMenu(onLinkExisting)}
        >
          <Link2 className="size-4" />
          {t("relations.linkExistingChild")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
