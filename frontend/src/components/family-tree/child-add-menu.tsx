import { useRef, useState } from "react"
import { Baby, ChevronDown, Link2, UserPlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function runAfterMenuClose(action: () => void) {
  queueMicrotask(action)
}

interface ChildAddMenuProps {
  onNewChild: () => void
  onLinkExisting: () => void
  compact?: boolean
  newChildLabel?: string
  linkExistingLabel?: string
}

export function ChildAddMenu({ onNewChild, onLinkExisting, compact = false, newChildLabel, linkExistingLabel }: ChildAddMenuProps) {
  const { t } = useTranslation("tree")
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLSpanElement>(null)

  const handleAction = (action: () => void) => {
    setOpen(false)
    runAfterMenuClose(action)
  }

  return (
    <span ref={anchorRef} className="inline-flex">
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
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
        <DropdownMenuContent
          anchor={anchorRef}
          align={compact ? "center" : "end"}
          side="bottom"
          sideOffset={4}
          positionMethod="fixed"
          collisionAvoidance={{ side: "flip", align: "shift" }}
          positionerClassName="z-[300]"
          className="z-[300] min-w-48"
        >
          <DropdownMenuItem
            data-testid="child-add-new"
            onClick={() => handleAction(onNewChild)}
          >
            <UserPlus className="size-4" />
            {newChildLabel ?? t("relations.newChild")}
          </DropdownMenuItem>
          <DropdownMenuItem
            data-testid="child-add-link-existing"
            onClick={() => handleAction(onLinkExisting)}
          >
            <Link2 className="size-4" />
            {linkExistingLabel ?? t("relations.linkExistingChild")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  )
}
