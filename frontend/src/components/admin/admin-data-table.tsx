import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"

interface AdminDataTableProps {
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  page?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  loading?: boolean
  children: React.ReactNode
  filters?: React.ReactNode
}

export function AdminDataTable({
  search,
  onSearchChange,
  searchPlaceholder,
  page = 1,
  totalPages = 1,
  onPageChange,
  loading,
  children,
  filters,
}: AdminDataTableProps) {
  const { t } = useTranslation("admin")

  return (
    <div className="space-y-4">
      {(onSearchChange || filters) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {onSearchChange && (
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={searchPlaceholder ?? t("common.searchPlaceholder")}
                value={search ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}
          {filters}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        children
      )}

      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("common.pagination", { page, totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
