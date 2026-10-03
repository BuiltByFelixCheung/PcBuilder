import { useState } from "react";
import { toOptionalNumber } from "@/api/helper";
import { Input } from "@/components/ui/input";

export function DecimalInput({
  id,
  label,
  value,
  min = 0,
  placeholder,
  onValue,
}: Readonly<{
  id?: string;
  label?: string;
  value: number | null | undefined;
  min?: number;
  placeholder?: string;
  onValue: (value: number | null) => void;
}>) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value == null ? "" : String(value));
  return (
    <Input
      id={id}
      aria-label={label}
      type="number"
      inputMode="decimal"
      min={min}
      step="any"
      placeholder={placeholder}
      value={shown}
      onChange={(event) => {
        const next = event.target.value;
        setDraft(next);
        onValue(toOptionalNumber(next));
      }}
      onBlur={() => setDraft(null)}
    />
  );
}
