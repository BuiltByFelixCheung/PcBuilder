import {
  useContext,
  useEffect,
  useRef,
  useState,
  type RefObject,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useMatch, useNavigate, useParams } from "react-router-dom";
import { parseApiError } from "@/api/errors.ts";
import { AuthContext } from "@/auth/auth-context.ts";
import { usePcBuild } from "@/builds";
import {
  builderHref,
  builderViewHref,
  type CatalogProductType,
  type PcBuildContextValue,
} from "@/builds/types";
import {
  createPcBuild,
  pcBuildKeys,
  toPcBuildDraft,
  toPcBuildFields,
  updatePcBuild,
  workspaceToDraft,
  type CompatibilityCheckResult,
  type CompatibilityIssue,
  type PcBuildDetail,
  type PcBuildDraft,
  type PcBuildFields,
  type PcBuildPart,
} from "@/api/builds";
import { PageStatus } from "@/components/PageStatus.tsx";
import { usePcBuildCompatibility } from "@/hooks/use-pc-build-compatibility";
import { usePcBuildDetail } from "@/hooks/use-pc-build-detail";
import { useChassisById } from "@/hooks/use-chassis";
import { useMotherboard } from "@/hooks/use-motherboards";
import { useCpu } from "@/hooks/use-cpus";
import { useMemory } from "@/hooks/use-memories";
import { useGraphicsCard } from "@/hooks/use-graphics-cards";
import { usePsu } from "@/hooks/use-psus";
import { useCpuCooler } from "@/hooks/use-cpu-coolers";
import { useChassisFan } from "@/hooks/use-chassis-fans";
import { useStorageDrive } from "@/hooks/use-storage-drives";
import { useWiredNetworkAdapter } from "@/hooks/use-wired-network-adapters";
import { useWirelessNetworkAdapter } from "@/hooks/use-wireless-network-adapters";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type NamedPart = {
  id: string;
  name: string;
  manufacturerName?: string;
};

type PartQuery = {
  data?: NamedPart;
  isPending: boolean;
  isError: boolean;
};

type CompatibilityQuery = {
  data?: CompatibilityCheckResult;
  isPending: boolean;
  isError: boolean;
  error: unknown;
};

type DisplayedBuild = PcBuildDraft & Pick<PcBuildDetail, "name" | "description">;

function formatCompatibilityLabel(value: string): string {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function CompatibilityStatus({
  query,
}: Readonly<{ query: CompatibilityQuery }>) {
  if (query.isPending && !query.data) {
    return <p className="catalog-lead">Checking compatibility…</p>;
  }

  if (query.isError) {
    return <p className="catalog-lead">{parseApiError(query.error).message}</p>;
  }

  if (!query.data) {
    return null;
  }

  return (
    <div className="mb-6">
      <h2>Compatibility</h2>
      <p className="catalog-lead">
        {formatCompatibilityLabel(query.data.status)}
      </p>
      {query.data.issues.length === 0 ? (
        <p className="catalog-lead">No issues.</p>
      ) : (
        <ul className="catalog-lead list-disc pl-5">
          {query.data.issues.map((issue, index) => (
            <li key={issueKey(issue, index)}>
              {formatCompatibilityLabel(issue.reason)}
              {issue.rated && issue.executing
                ? ` (${issue.executing} vs ${issue.rated})`
                : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function issueKey(issue: CompatibilityIssue, index: number): string {
  const parts = issue.parts
    .map((part) => part.slot + ":" + (part.partId ?? ""))
    .join("|");
  return issue.reason + "-" + parts + "-" + String(index);
}

const textareaClassName =
  "w-full min-w-0 min-h-24 rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function SaveBuildDialog({
  open,
  name,
  description,
  nameError,
  descriptionError,
  formError,
  isSaving,
  onNameChange,
  onDescriptionChange,
  onCancel,
  onSubmit,
}: Readonly<{
  open: boolean;
  name: string;
  description: string;
  nameError?: string;
  descriptionError?: string;
  formError?: string;
  isSaving: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}>) {
  return (
    <dialog
      className="auth-dialog"
      open={open}
      aria-labelledby="save-build-title"
    >
      <div className="auth-dialog-card">
        <h2 id="save-build-title">Save build</h2>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <FieldGroup>
            {formError ? (
              <p className="form-error" role="alert">
                {formError}
              </p>
            ) : null}
            <Field data-invalid={nameError ? true : undefined}>
              <FieldLabel htmlFor="build-name">Name</FieldLabel>
              <Input
                id="build-name"
                value={name}
                maxLength={100}
                autoComplete="off"
                aria-invalid={nameError ? true : undefined}
                onChange={(event) => onNameChange(event.target.value)}
              />
              <FieldError errors={nameError ? [{ message: nameError }] : []} />
            </Field>
            <Field data-invalid={descriptionError ? true : undefined}>
              <FieldLabel htmlFor="build-description">Description</FieldLabel>
              <textarea
                id="build-description"
                rows={4}
                maxLength={500}
                className={textareaClassName}
                value={description}
                aria-invalid={descriptionError ? true : undefined}
                onChange={(event) => onDescriptionChange(event.target.value)}
              />
              <FieldError
                errors={
                  descriptionError ? [{ message: descriptionError }] : []
                }
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={onCancel}
              >
                Cancel
              </Button>
            </div>
          </FieldGroup>
        </form>
      </div>
    </dialog>
  );
}

function draftHasParts(draft: PcBuildDraft): boolean {
  const selected = [
    draft.chassisId,
    draft.motherboardId,
    draft.cpuId,
    draft.cpuCoolerId,
    draft.ramKitId,
    draft.graphicsCardId,
    draft.psuId,
  ].some(Boolean);
  const extras =
    draft.chassisFans.length +
    draft.storageDevices.length +
    draft.wiredNetworkAdapters.length +
    draft.wirelessNetworkAdapters.length;
  return selected || extras > 0;
}

function isViewRoute(buildId: string | undefined, isEditingSaved: boolean): boolean {
  return Boolean(buildId) && !isEditingSaved;
}

function viewedSavedBuild(
  isViewing: boolean,
  data: PcBuildDetail | undefined,
): PcBuildDetail | undefined {
  if (!isViewing) {
    return undefined;
  }
  return data;
}

function shouldCheckCompatibility(hasParts: boolean, draftReady: boolean): boolean {
  return hasParts && draftReady;
}

function displayedBuild(
  viewed: PcBuildDetail | undefined,
  build: PcBuildContextValue,
): DisplayedBuild {
  if (viewed) {
    return viewed;
  }
  return {
    ...workspaceToDraft(build),
    name: build.name,
    description: build.description,
  };
}

function compatibilityDraft(
  viewed: PcBuildDetail | undefined,
  build: PcBuildContextValue,
): PcBuildDraft {
  if (viewed) {
    return toPcBuildDraft(viewed);
  }
  return workspaceToDraft(build);
}

function isDraftReady(
  isViewing: boolean,
  viewed: PcBuildDetail | undefined,
  buildId: string | undefined,
  sourceId: string | null,
): boolean {
  if (isViewing) {
    return Boolean(viewed);
  }
  return !buildId || sourceId === buildId;
}

function canSaveDraft(
  isViewing: boolean,
  fields: PcBuildFields | undefined,
  compatibility: CompatibilityQuery,
): boolean {
  return (
    !isViewing &&
    Boolean(fields) &&
    !compatibility.isPending &&
    compatibility.data?.status !== "Incompatible"
  );
}

function isSavedBuildOwner(
  userId: string | undefined,
  buildUserId: string | null | undefined,
): boolean {
  return Boolean(userId) && Boolean(buildUserId) && userId === buildUserId;
}

function catalogDetailHref(
  base: string,
  partId: string | undefined,
): string | undefined {
  if (!partId) {
    return undefined;
  }
  return `${base}/${partId}`;
}

function saveFormErrors(
  name: string,
  description: string,
): { nameError?: string; descriptionError?: string } {
  const errors: { nameError?: string; descriptionError?: string } = {};
  if (!name) {
    errors.nameError = "Build name is required.";
  } else if (name.length > 100) {
    errors.nameError = "Build name must be 100 characters or fewer.";
  }
  if (description.length > 500) {
    errors.descriptionError =
      "Build description must be 500 characters or fewer.";
  }
  return errors;
}

function saveFailureMessage(sourceId: string | null, error: unknown): string {
  const parsed = parseApiError(error);
  if (sourceId && parsed.status === 401) {
    return "Builds by guests cannot be updated";
  }
  return parsed.message;
}

function builderPageBlocked(input: {
  buildId: string | undefined;
  isViewing: boolean;
  isEditingSaved: boolean;
  loadError: unknown;
  isLoadError: boolean;
  viewed: PcBuildDetail | undefined;
  savedLoaded: boolean;
  canEditSaved: boolean;
  sourceId: string | null;
}): ReactNode {
  if (input.buildId && input.isLoadError) {
    return <PageStatus>{parseApiError(input.loadError).message}</PageStatus>;
  }
  if (input.isViewing && !input.viewed) {
    return <PageStatus>Loading build…</PageStatus>;
  }
  if (input.isEditingSaved && input.savedLoaded && !input.canEditSaved) {
    return <Navigate to={builderViewHref(input.buildId!)} replace />;
  }
  if (input.isEditingSaved && input.sourceId !== input.buildId) {
    return <PageStatus>Loading build…</PageStatus>;
  }
  return null;
}

function useHydrateSavedBuild(
  isEditingSaved: boolean,
  saved: PcBuildDetail | undefined,
  sourceId: string | null,
  applyDetail: (detail: PcBuildDetail) => void,
  skipHydrateRef: RefObject<boolean>,
) {
  useEffect(() => {
    if (!isEditingSaved) {
      skipHydrateRef.current = false;
      return;
    }
    if (skipHydrateRef.current || !saved) {
      return;
    }
    if (saved.id === sourceId) {
      return;
    }
    applyDetail(saved);
  }, [isEditingSaved, saved, sourceId, applyDetail, skipHydrateRef]);
}

function useSaveBuildDialog(input: {
  fields: PcBuildFields | undefined;
  sourceId: string | null;
  isPublic: boolean;
  workspaceName: string;
  workspaceDescription: string;
  resetBuild: () => void;
  skipHydrateRef: RefObject<boolean>;
}) {
  const {
    fields,
    sourceId,
    isPublic,
    workspaceName,
    workspaceDescription,
    resetBuild,
    skipHydrateRef,
  } = input;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [nameError, setNameError] = useState<string>();
  const [descriptionError, setDescriptionError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  function openSaveDialog() {
    setSaveName(workspaceName);
    setSaveDescription(workspaceDescription);
    setNameError(undefined);
    setDescriptionError(undefined);
    setFormError(undefined);
    setSaveDialogOpen(true);
  }

  async function submitSave() {
    if (!fields) {
      return;
    }
    const name = saveName.trim();
    const description = saveDescription.trim();
    const errors = saveFormErrors(name, description);
    setNameError(errors.nameError);
    setDescriptionError(errors.descriptionError);
    if (errors.nameError || errors.descriptionError) {
      return;
    }
    setFormError(undefined);
    setIsSaving(true);
    try {
      const saved = sourceId
        ? await updatePcBuild({
            id: sourceId,
            ...fields,
            name,
            description,
            isPublic,
          })
        : await createPcBuild({ ...fields, name, description });
      queryClient.setQueryData(pcBuildKeys.detail(saved.id), saved);
      setSaveDialogOpen(false);
      skipHydrateRef.current = true;
      navigate(builderViewHref(saved.id));
      resetBuild();
    } catch (error) {
      setFormError(saveFailureMessage(sourceId, error));
    } finally {
      setIsSaving(false);
    }
  }

  return {
    saveDialogOpen,
    saveName,
    saveDescription,
    nameError,
    descriptionError,
    formError,
    isSaving,
    openSaveDialog,
    submitSave,
    setSaveName,
    setSaveDescription,
    closeSaveDialog: () => setSaveDialogOpen(false),
  };
}

export function BuilderPage() {
  const { buildId } = useParams();
  const isEditingSaved = Boolean(useMatch("/builds/:buildId/edit"));
  const isViewing = isViewRoute(buildId, isEditingSaved);
  const build = usePcBuild();
  const auth = useContext(AuthContext);
  const savedQuery = usePcBuildDetail(buildId);
  const viewed = viewedSavedBuild(isViewing, savedQuery.data);
  const displayed = displayedBuild(viewed, build);
  const chassis = useChassisById(displayed.chassisId);
  const motherboard = useMotherboard(displayed.motherboardId);
  const cpu = useCpu(displayed.cpuId);
  const ram = useMemory(displayed.ramKitId);
  const graphicsCard = useGraphicsCard(displayed.graphicsCardId);
  const psu = usePsu(displayed.psuId);
  const cpuCooler = useCpuCooler(displayed.cpuCoolerId);
  const hasParts = draftHasParts(displayed);
  const skipHydrateRef = useRef(false);
  useHydrateSavedBuild(
    isEditingSaved,
    savedQuery.data,
    build.sourceId,
    build.applyDetail,
    skipHydrateRef,
  );
  const draftReady = isDraftReady(
    isViewing,
    viewed,
    buildId,
    build.sourceId,
  );
  const draft = compatibilityDraft(viewed, build);
  const compatibility = usePcBuildCompatibility(
    draft,
    shouldCheckCompatibility(hasParts, draftReady),
  );
  const fields = toPcBuildFields(draft);
  const canSave = canSaveDraft(isViewing, fields, compatibility);
  const canEditSaved = isSavedBuildOwner(
    auth?.user?.id,
    savedQuery.data?.userId,
  );
  const save = useSaveBuildDialog({
    fields,
    sourceId: build.sourceId,
    isPublic: build.isPublic,
    workspaceName: build.name,
    workspaceDescription: build.description,
    resetBuild: build.resetBuild,
    skipHydrateRef,
  });
  const blocked = builderPageBlocked({
    buildId,
    isViewing,
    isEditingSaved,
    loadError: savedQuery.error,
    isLoadError: savedQuery.isError,
    viewed,
    savedLoaded: Boolean(savedQuery.data),
    canEditSaved,
    sourceId: build.sourceId,
  });
  if (blocked) {
    return blocked;
  }

  return (
    <BuilderWorkspace
      displayed={displayed}
      isViewing={isViewing}
      buildId={buildId}
      canEditSaved={canEditSaved}
      canSave={canSave}
      hasParts={hasParts}
      compatibility={compatibility}
      chassis={chassis}
      motherboard={motherboard}
      cpu={cpu}
      ram={ram}
      graphicsCard={graphicsCard}
      psu={psu}
      cpuCooler={cpuCooler}
      save={save}
      onClear={build.resetBuild}
    />
  );
}

function BuilderWorkspace({
  displayed,
  isViewing,
  buildId,
  canEditSaved,
  canSave,
  hasParts,
  compatibility,
  chassis,
  motherboard,
  cpu,
  ram,
  graphicsCard,
  psu,
  cpuCooler,
  save,
  onClear,
}: Readonly<{
  displayed: DisplayedBuild;
  isViewing: boolean;
  buildId: string | undefined;
  canEditSaved: boolean;
  canSave: boolean;
  hasParts: boolean;
  compatibility: CompatibilityQuery;
  chassis: PartQuery;
  motherboard: PartQuery;
  cpu: PartQuery;
  ram: PartQuery;
  graphicsCard: PartQuery;
  psu: PartQuery;
  cpuCooler: PartQuery;
  save: ReturnType<typeof useSaveBuildDialog>;
  onClear: () => void;
}>) {
  return (
    <section className="catalog-page">
      <SaveBuildDialog
        open={save.saveDialogOpen}
        name={save.saveName}
        description={save.saveDescription}
        nameError={save.nameError}
        descriptionError={save.descriptionError}
        formError={save.formError}
        isSaving={save.isSaving}
        onNameChange={save.setSaveName}
        onDescriptionChange={save.setSaveDescription}
        onCancel={save.closeSaveDialog}
        onSubmit={() => void save.submitSave()}
      />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1>{buildHeading(displayed.name, isViewing)}</h1>
          <p className="catalog-lead">
            {buildLead(displayed.description, isViewing)}
          </p>
        </div>
        <BuilderActions
          isViewing={isViewing}
          canEditSaved={canEditSaved}
          buildId={buildId}
          canSave={canSave}
          hasParts={hasParts}
          onSave={save.openSaveDialog}
          onClear={onClear}
        />
      </div>
      {hasParts ? (
        <CompatibilityStatus query={compatibility} />
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Component</TableHead>
            <TableHead>Selected</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <SingularSlot
            label="Chassis"
            chooseLabel="Choose a chassis"
            catalogHref="/catalog/chassis"
            detailHref={catalogDetailHref(
              "/catalog/chassis",
              displayed.chassisId,
            )}
            productType="chassis"
            partId={displayed.chassisId}
            query={chassis}
            readOnly={isViewing}
          />
          <SingularSlot
            label="Motherboard"
            chooseLabel="Choose a motherboard"
            catalogHref="/catalog/motherboards"
            detailHref={catalogDetailHref(
              "/catalog/motherboards",
              displayed.motherboardId,
            )}
            productType="motherboard"
            partId={displayed.motherboardId}
            query={motherboard}
            readOnly={isViewing}
          />
          <SingularSlot
            label="CPU"
            chooseLabel="Choose a CPU"
            catalogHref="/catalog/cpus"
            detailHref={catalogDetailHref("/catalog/cpus", displayed.cpuId)}
            productType="cpu"
            partId={displayed.cpuId}
            query={cpu}
            readOnly={isViewing}
          />
          <SingularSlot
            label="CPU cooler"
            chooseLabel="Choose a CPU cooler"
            catalogHref="/catalog/cpu-coolers"
            detailHref={catalogDetailHref(
              "/catalog/cpu-coolers",
              displayed.cpuCoolerId,
            )}
            productType="cpucooler"
            partId={displayed.cpuCoolerId}
            query={cpuCooler}
            readOnly={isViewing}
          />
          <SingularSlot
            label="Memory"
            chooseLabel="Choose a memory kit"
            catalogHref="/catalog/memories"
            detailHref={catalogDetailHref(
              "/catalog/memories",
              displayed.ramKitId,
            )}
            productType="ram"
            partId={displayed.ramKitId}
            query={ram}
            readOnly={isViewing}
          />
          <SingularSlot
            label="Graphics card"
            chooseLabel="Choose a graphics card"
            catalogHref="/catalog/graphics-cards"
            detailHref={catalogDetailHref(
              "/catalog/graphics-cards",
              displayed.graphicsCardId,
            )}
            productType="graphicscard"
            partId={displayed.graphicsCardId}
            query={graphicsCard}
            readOnly={isViewing}
          />
          <SingularSlot
            label="Power supply"
            chooseLabel="Choose a PSU"
            catalogHref="/catalog/psus"
            detailHref={catalogDetailHref("/catalog/psus", displayed.psuId)}
            productType="psu"
            partId={displayed.psuId}
            query={psu}
            readOnly={isViewing}
          />
          <SingularSlot
            label="Storage"
            chooseLabel="Choose storage"
            addLabel="Add storage"
            catalogHref="/catalog/storage"
            productType="storagedrive"
            parts={displayed.storageDevices}
            usePart={useStorageDrive}
            detailHref={(id) => `/catalog/storage/${id}`}
            readOnly={isViewing}
          />
          <SingularSlot
            label="Chassis fans"
            chooseLabel="Choose chassis fans"
            addLabel="Add a chassis fan"
            catalogHref="/catalog/chassis-fans"
            productType="chassisfan"
            parts={displayed.chassisFans}
            usePart={useChassisFan}
            detailHref={(id) => `/catalog/chassis-fans/${id}`}
            readOnly={isViewing}
          />
          <SingularSlot
            label="Wired network"
            chooseLabel="Choose a wired adapter"
            addLabel="Add a wired adapter"
            catalogHref="/catalog/wired-network-adapters"
            productType="wirednetworkadapter"
            parts={displayed.wiredNetworkAdapters}
            usePart={useWiredNetworkAdapter}
            detailHref={(id) => `/catalog/wired-network-adapters/${id}`}
            readOnly={isViewing}
          />
          <SingularSlot
            label="Wireless network"
            chooseLabel="Choose a wireless adapter"
            addLabel="Add a wireless adapter"
            catalogHref="/catalog/wireless-network-adapters"
            productType="wirelessnetworkadapter"
            parts={displayed.wirelessNetworkAdapters}
            usePart={useWirelessNetworkAdapter}
            detailHref={(id) => `/catalog/wireless-network-adapters/${id}`}
            readOnly={isViewing}
          />
        </TableBody>
      </Table>
    </section>
  );
}

function buildHeading(name: string, isViewing: boolean): string {
  const trimmed = name.trim();
  if (trimmed) {
    return trimmed;
  }
  return isViewing ? "PC build" : "New build";
}

function buildLead(description: string, isViewing: boolean): string {
  if (!isViewing) {
    return "Choose parts from the catalog, then come back here to review, replace, or remove them.";
  }
  return description || "Saved build.";
}

function BuilderActions({
  isViewing,
  canEditSaved,
  buildId,
  canSave,
  hasParts,
  onSave,
  onClear,
}: Readonly<{
  isViewing: boolean;
  canEditSaved: boolean;
  buildId: string | undefined;
  canSave: boolean;
  hasParts: boolean;
  onSave: () => void;
  onClear: () => void;
}>) {
  if (isViewing) {
    if (!canEditSaved) {
      return <div className="flex flex-wrap gap-2" />;
    }
    return (
      <div className="flex flex-wrap gap-2">
        <Button type="button" asChild>
          <Link to={builderHref(buildId)}>Edit this build</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="default"
        disabled={!canSave}
        onClick={onSave}
      >
        Save build
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={!hasParts}
        onClick={onClear}
      >
        Clear build
      </Button>
    </div>
  );
}

function SingularSlot(
  props: Readonly<
    | {
        label: string;
        chooseLabel: string;
        catalogHref: string;
        detailHref?: string;
        productType: CatalogProductType;
        partId?: string;
        query: PartQuery;
        readOnly?: boolean;
        addLabel?: never;
        parts?: never;
        usePart?: never;
      }
    | {
        label: string;
        chooseLabel: string;
        addLabel: string;
        catalogHref: string;
        productType: CatalogProductType;
        parts: PcBuildPart[];
        usePart: (id: string | undefined) => PartQuery;
        detailHref: (id: string) => string;
        readOnly?: boolean;
        partId?: never;
        query?: never;
      }
  >,
) {
  if ("parts" in props && props.parts) {
    return <MultiSlot {...props} />;
  }

  return (
    <TableRow>
      <TableCell>{props.label}</TableCell>
      <TableCell>
        <SelectedSingularPart
          chooseLabel={props.chooseLabel}
          catalogHref={props.catalogHref}
          detailHref={props.detailHref}
          productType={props.productType}
          partId={props.partId}
          query={props.query}
          readOnly={props.readOnly}
        />
      </TableCell>
    </TableRow>
  );
}

function SelectedSingularPart({
  chooseLabel,
  catalogHref,
  detailHref,
  productType,
  partId,
  query,
  readOnly,
}: Readonly<{
  chooseLabel: string;
  catalogHref: string;
  detailHref?: string;
  productType: CatalogProductType;
  partId?: string;
  query: PartQuery;
  readOnly?: boolean;
}>) {
  const navigate = useNavigate();
  const build = usePcBuild();

  if (!partId) {
    return (
      <ChooseOrNone
        readOnly={readOnly}
        label={chooseLabel}
        href={catalogHref}
      />
    );
  }

  if (query.isPending && !query.data) {
    return <span>Loading…</span>;
  }

  const name = query.data?.name ?? "Unknown part";
  const manufacturer = query.data?.manufacturerName;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        {detailHref ? <Link to={detailHref}>{name}</Link> : <span>{name}</span>}
        {manufacturer ? (
          <p className="catalog-lead mb-0!">{manufacturer}</p>
        ) : null}
        {query.isError ? (
          <p className="catalog-lead mb-0!">Could not load this part.</p>
        ) : null}
      </div>
      {readOnly ? null : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(catalogHref)}
          >
            Change
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => build.removeFromBuild(productType, partId)}
          >
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}

function MultiSlot({
  label,
  chooseLabel,
  addLabel,
  catalogHref,
  productType,
  parts,
  usePart,
  detailHref,
  readOnly,
}: Readonly<{
  label: string;
  chooseLabel: string;
  addLabel: string;
  catalogHref: string;
  productType: CatalogProductType;
  parts: PcBuildPart[];
  usePart: (id: string | undefined) => PartQuery;
  detailHref: (id: string) => string;
  readOnly?: boolean;
}>) {
  const navigate = useNavigate();

  return (
    <TableRow>
      <TableCell>{label}</TableCell>
      <TableCell>
        {parts.length === 0 ? (
          <ChooseOrNone
            readOnly={readOnly}
            label={chooseLabel}
            href={catalogHref}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {parts.map((part) => (
              <SelectedMultiPart
                key={part.partId}
                part={part}
                productType={productType}
                catalogHref={catalogHref}
                detailHref={detailHref(part.partId)}
                usePart={usePart}
                readOnly={readOnly}
              />
            ))}
            {readOnly ? null : (
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(catalogHref)}
                >
                  {addLabel}
                </Button>
              </div>
            )}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

function SelectedMultiPart({
  part,
  productType,
  catalogHref,
  detailHref,
  usePart,
  readOnly,
}: Readonly<{
  part: PcBuildPart;
  productType: CatalogProductType;
  catalogHref: string;
  detailHref: string;
  usePart: (id: string | undefined) => PartQuery;
  readOnly?: boolean;
}>) {
  const navigate = useNavigate();
  const build = usePcBuild();
  const query = usePart(part.partId);
  const name =
    query.data?.name ?? (query.isPending ? "Loading…" : "Unknown part");
  const manufacturer = query.data?.manufacturerName;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <Link to={detailHref}>{name}</Link>
        {manufacturer ? (
          <p className="catalog-lead mb-0!">{manufacturer}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span>Qty {part.quantity}</span>
        {readOnly ? null : (
          <>
            <Button
              type="button"
              variant="outline"
              aria-label={`Decrease ${name} quantity`}
              onClick={() =>
                build.setQuantity(productType, part.partId, part.quantity - 1)
              }
            >
              −
            </Button>
            <Button
              type="button"
              variant="outline"
              aria-label={`Increase ${name} quantity`}
              onClick={() =>
                build.setQuantity(productType, part.partId, part.quantity + 1)
              }
            >
              +
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(catalogHref)}
            >
              Change
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => build.removeFromBuild(productType, part.partId)}
            >
              Remove
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function ChooseOrNone({
  readOnly,
  label,
  href,
}: Readonly<{ readOnly?: boolean; label: string; href: string }>) {
  const navigate = useNavigate();
  if (readOnly) {
    return <span>None</span>;
  }
  return (
    <Button type="button" onClick={() => navigate(href)}>
      {label}
    </Button>
  );
}
