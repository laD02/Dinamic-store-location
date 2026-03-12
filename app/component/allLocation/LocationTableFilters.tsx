interface LocationTableFiltersProps {
  hasChecked: boolean;
  showSearch: boolean;
  searchTerm: string;
  selectedSources: string[];
  selectedVisibility: string;
  selectedIds: Set<string>;
  onUpdateVisibility: (v: "visible" | "hidden") => void;
  onExport: () => void;
  onDelete: () => void;
  onSearchToggle: (show: boolean) => void;
  onSearchChange: (term: string) => void;
  onSourceChange: (sources: string[]) => void;
  onVisibilityChange: (v: string) => void;
}

export default function LocationTableFilters({
  hasChecked,
  showSearch,
  searchTerm,
  selectedSources,
  selectedIds,
  selectedVisibility,
  onUpdateVisibility,
  onExport,
  onDelete,
  onSearchToggle,
  onSearchChange,
  onSourceChange,
  onVisibilityChange,
}: LocationTableFiltersProps) {
  return (
    <s-grid slot="filters" gap="small-200">
      <s-stack direction="inline" gap="small-200" justifyContent={hasChecked ? "space-between" : undefined}>
        {hasChecked && !showSearch && (
          <s-stack direction="inline" gap="base" justifyContent="space-between" alignItems="center">
            <s-stack direction="inline" gap="small-200" justifyContent="start">
              <s-button onClick={() => onUpdateVisibility("visible")}>Set As Visible</s-button>
              <s-button onClick={() => onUpdateVisibility("hidden")}>Set As Hidden</s-button>
              <s-button commandFor="customer-menu" icon="menu-horizontal"></s-button>
              <s-popover id="customer-menu">
                <s-stack direction="block">
                  <s-button variant="tertiary" onClick={onExport}>Export CSV</s-button>
                  <s-button variant="tertiary" commandFor="deleteTrash-modal" tone="critical">Delete all stores</s-button>
                </s-stack>
              </s-popover>
              <s-modal id="deleteTrash-modal" heading="Delete Location">
                <s-text>Are you sure you want to delete {selectedIds.size} stores? This action cannot be undone.</s-text>
                <s-button slot="secondary-actions" variant="secondary" commandFor="deleteTrash-modal" command="--hide">Cancel</s-button>
                <s-button slot="primary-action" variant="primary" tone="critical" commandFor="deleteTrash-modal" command="--hide" onClick={onDelete}>Delete</s-button>
              </s-modal>
            </s-stack>
          </s-stack>
        )}
        <div style={{ flex: 1 }}>
          <s-stack direction="inline" gap="small-200" justifyContent={showSearch ? "space-between" : "end"}>
            {showSearch ? (
              <div style={{ flex: 1, gap: 8, display: "flex", height: 28 }}>
                <s-search-field
                  placeholder="Search by name, city, or address"
                  value={searchTerm}
                  onInput={(event) => { const target = event.target as any; onSearchChange(target.value); }}
                />
                <s-button variant="tertiary" onClick={() => { onSearchToggle(false); onSearchChange(""); }}>Cancel</s-button>
              </div>
            ) : (
              <s-button icon="search" onClick={() => onSearchToggle(true)}></s-button>
            )}
            <s-button icon="sort" variant="secondary" accessibilityLabel="Sort" interestFor="sort-tooltip" commandFor="sort-actions" />
            <s-tooltip id="sort-tooltip"><s-text>Sort</s-text></s-tooltip>
            <s-popover id="sort-actions">
              <s-stack gap="none">
                <s-box padding="small">
                  Source
                  <s-checkbox
                    label="Manual"
                    checked={selectedSources.includes("Manual")}
                    onChange={(e: any) => {
                      const checked = e.currentTarget.checked;
                      onSourceChange(checked ? [...selectedSources, "Manual"] : selectedSources.filter(s => s !== "Manual"));
                    }}
                  />
                  <s-checkbox
                    label="Shopify B2B"
                    checked={selectedSources.includes("Shopify B2B")}
                    onChange={(e: any) => {
                      const checked = e.currentTarget.checked;
                      onSourceChange(checked ? [...selectedSources, "Shopify B2B"] : selectedSources.filter(s => s !== "Shopify B2B"));
                    }}
                  />
                </s-box>
                <s-divider />
                <s-box padding="small">
                  <s-choice-list
                    label="Visibility"
                    name="visi"
                    values={selectedVisibility ? [selectedVisibility] : []}
                    onChange={(e) => { const target = e.currentTarget.values; onVisibilityChange(target ? target[0] : ""); }}
                  >
                    <s-choice value="visible">Visible</s-choice>
                    <s-choice value="hidden">Hidden</s-choice>
                  </s-choice-list>
                  <s-button variant="tertiary" onClick={() => onVisibilityChange("")}>Clear</s-button>
                </s-box>
              </s-stack>
            </s-popover>
          </s-stack>
        </div>
      </s-stack>
    </s-grid>
  );
}
