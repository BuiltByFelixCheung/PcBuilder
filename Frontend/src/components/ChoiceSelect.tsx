import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const emptyChoice = "__blank__";

type Choice = { value: string; label: string };

export function ChoiceSelect({
  label,
  ariaLabel,
  value,
  blankLabel,
  showBlank,
  options,
  onValueChange,
}: Readonly<{
  label: string;
  ariaLabel: string;
  value: string;
  blankLabel?: string;
  showBlank: boolean;
  options: readonly Choice[];
  onValueChange: (value: string) => void;
}>) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger aria-label={ariaLabel} className="w-full">
        <SelectValue placeholder={blankLabel ?? ""} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          {showBlank ? (
            <SelectItem value={emptyChoice}>{blankLabel ?? ""}</SelectItem>
          ) : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
