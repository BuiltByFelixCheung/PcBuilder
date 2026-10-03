import type { LucideIcon } from "lucide-react";
import { FileUp, Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ManagementActionsProps = {
  hasSelection: boolean;
  deleting?: boolean;
  onEditSelected?: () => void;
  onDeleteSelected: () => void;
  onImport?: () => void;
  showImport?: boolean;
  newItemLabel: string;
  newItemTo?: string;
  onNewItem?: () => void;
};

export function ManagementActions({
  hasSelection,
  deleting = false,
  onEditSelected,
  onDeleteSelected,
  onImport,
  showImport = true,
  newItemLabel,
  newItemTo,
  onNewItem,
}: Readonly<ManagementActionsProps>) {
  const deleteLabel = deleting ? "Deleting…" : "Delete Selected";

  return (
    <TooltipProvider>
      <div className="catalog-results-actions">
        <ManagementButton
          label="Edit Selected"
          icon={Pencil}
          disabled={!hasSelection || !onEditSelected}
          onClick={onEditSelected}
        />
        <ManagementButton
          label={deleteLabel}
          icon={Trash2}
          disabled={!hasSelection || deleting}
          onClick={onDeleteSelected}
        />
        <ManagementButton
          label={newItemLabel}
          icon={Plus}
          to={onNewItem ? undefined : newItemTo}
          onClick={onNewItem}
        />
        {showImport && onImport ? (
          <ManagementButton label="Import" icon={FileUp} onClick={onImport} />
        ) : null}
      </div>
    </TooltipProvider>
  );
}

function ManagementButton({
  label,
  icon: Icon,
  variant = "default",
  disabled = false,
  onClick,
  to,
}: Readonly<{
  label: string;
  icon: LucideIcon;
  variant?: "default" | "destructive";
  disabled?: boolean;
  onClick?: () => void;
  to?: string;
}>) {
  const isMobile = useIsMobile();
  const size = isMobile ? "icon-sm" : "default";
  const ariaLabel = isMobile ? label : undefined;
  const content = (
    <>
      <Icon aria-hidden />
      {isMobile ? null : label}
    </>
  );
  const button = to ? (
    <Button asChild size={size} variant={variant} aria-label={ariaLabel}>
      <Link to={to}>{content}</Link>
    </Button>
  ) : (
    <Button
      type="button"
      size={size}
      variant={variant}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {content}
    </Button>
  );

  if (!isMobile) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {disabled ? <span className="inline-flex">{button}</span> : button}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
