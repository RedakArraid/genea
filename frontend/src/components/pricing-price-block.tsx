import { useTranslation } from "react-i18next"
import type { BillingInterval } from "@/lib/billing-api"
import type { PlanId } from "@/lib/plans"
import {
  formatAmountDual,
  formatDualPrice,
  getAnnualSavingsPercent,
  getPlanIntervals,
  getPlanPrice,
  getPlanById,
  getPlanPriceXof,
  isFreePlan,
  isMonthlyPlanDisplay,
  normalizeBillingInterval,
} from "@/lib/plans"
import { cn } from "@/lib/utils"

interface PlanPriceBlockProps {
  planId: PlanId
  interval?: BillingInterval
  amountUsd?: number
  strikethroughUsd?: number
  className?: string
  showBothIntervals?: boolean
}

function DualIntervalPrices({ planId, className }: { planId: PlanId; className?: string }) {
  const { t, i18n } = useTranslation("billing")
  const locale = i18n.language

  return (
    <div className={cn("space-y-2", className)}>
      <div>
        <p className="text-2xl font-semibold text-foreground">{formatDualPrice(planId, "yearly", locale)}</p>
        <p className="text-xs text-muted-foreground">{t("pricing.perYear")}</p>
      </div>
      <div>
        <p className="text-lg font-semibold text-foreground">{formatDualPrice(planId, "monthly", locale)}</p>
        <p className="text-xs text-muted-foreground">{t("pricing.perMonth")}</p>
      </div>
    </div>
  )
}

export function PlanPriceBlock({
  planId,
  interval = "yearly",
  amountUsd,
  strikethroughUsd,
  className,
  showBothIntervals = false,
}: PlanPriceBlockProps) {
  const { t, i18n } = useTranslation("billing")
  const locale = i18n.language
  const plan = getPlanById(planId)
  const isFree = isFreePlan(planId)
  const resolvedInterval = normalizeBillingInterval(planId, interval)
  const resolvedAmount = amountUsd ?? getPlanPrice(plan, resolvedInterval)
  const priceNote = t(`plans.${planId}.priceNote`, { defaultValue: "" })

  if (showBothIntervals && getPlanIntervals(planId).length > 1) {
    return <DualIntervalPrices planId={planId} className={className} />
  }

  return (
    <div className={cn("space-y-1", className)}>
      {isFree ? (
        <>
          <p className="text-2xl font-semibold text-foreground">{t("pricing.free")}</p>
          <p className="text-sm text-muted-foreground">{t("pricing.trialDays")}</p>
        </>
      ) : (
        <>
          <p className="text-2xl font-semibold text-foreground">
            {formatAmountDual(resolvedAmount, getPlanPriceXof(planId, resolvedInterval), locale)}
            {strikethroughUsd != null && strikethroughUsd > resolvedAmount && (
              <span className="ml-2 text-sm font-normal text-muted-foreground line-through">
                {formatDualPrice(planId, resolvedInterval, locale)}
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {isMonthlyPlanDisplay(planId, resolvedInterval)
              ? t("pricing.perMonth")
              : t("pricing.perYear")}
          </p>
          {!isFree && resolvedInterval === "yearly" && getAnnualSavingsPercent(planId) != null && (
            <p className="text-xs font-medium text-primary">
              {t("pricing.annualSavings", { percent: getAnnualSavingsPercent(planId) })}
            </p>
          )}
          {priceNote ? (
            <p className="text-xs text-muted-foreground">{priceNote}</p>
          ) : null}
        </>
      )}
    </div>
  )
}

export function PricingTariffSummary({ className }: { className?: string }) {
  const { t, i18n } = useTranslation("billing")
  const locale = i18n.language

  return (
    <div className={cn("rounded-lg border bg-muted/25 p-4 text-sm", className)}>
      <p className="mb-2 font-medium text-foreground">{t("pricing.tariffSummaryTitle")}</p>
      <ul className="space-y-1.5 text-muted-foreground">
        <li>
          <span className="font-medium text-foreground">{t("plans.SOLO.name")}</span>
          {" : "}
          {t("pricing.tariffDiscovery")}
        </li>
        <li>
          <span className="font-medium text-foreground">{t("plans.FAMILY.name")}</span>
          {" : "}
          {t("pricing.tariffFamily", {
            yearlyPrice: formatDualPrice("FAMILY", "yearly", locale),
            monthlyPrice: formatDualPrice("FAMILY", "monthly", locale),
          })}
        </li>
        <li>
          <span className="font-medium text-foreground">{t("plans.PATRIMONY.name")}</span>
          {" : "}
          {t("pricing.tariffPatrimony", {
            yearlyPrice: formatDualPrice("PATRIMONY", "yearly", locale),
            monthlyPrice: formatDualPrice("PATRIMONY", "monthly", locale),
          })}
        </li>
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">{t("pricing.tariffPaymentNote")}</p>
    </div>
  )
}
