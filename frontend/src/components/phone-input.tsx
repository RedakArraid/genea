import { useTranslation } from "react-i18next"
import type { CountryCode } from "libphonenumber-js"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PHONE_COUNTRIES } from "@/lib/phone"

interface PhoneInputProps {
  id?: string
  country: CountryCode
  onCountryChange: (code: CountryCode) => void
  value: string
  onChange: (value: string) => void
  required?: boolean
  label?: string
}

export function PhoneInput({
  id = "phone",
  country,
  onCountryChange,
  value,
  onChange,
  required,
  label,
}: PhoneInputProps) {
  const { t } = useTranslation("auth")
  const dial = PHONE_COUNTRIES.find((c) => c.code === country)?.dial || "+225"

  return (
    <div className="flex flex-col gap-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="flex gap-2">
        <Select value={country} onValueChange={(v) => v && onCountryChange(v as CountryCode)}>
          <SelectTrigger className="w-[130px] shrink-0">
            <SelectValue>{dial}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PHONE_COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.dial} {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id={id}
          type="tel"
          inputMode="tel"
          placeholder={country === "CI" ? "07XXXXXXXX" : t("register.phonePlaceholder")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="flex-1"
        />
      </div>
    </div>
  )
}
