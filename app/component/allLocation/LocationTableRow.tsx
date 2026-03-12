import { UIStore } from "app/component/allLocation/types";

interface LocationTableRowProps {
  store: UIStore;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function LocationTableRow({ store, isSelected, onToggleSelect, onDelete }: LocationTableRowProps) {
  return (
    <s-table-row key={store.id}>
      <s-table-cell>
        <s-stack direction="inline" alignItems="center" gap="base">
          <s-checkbox checked={isSelected} onChange={() => onToggleSelect(store.id)} />
          <s-thumbnail src={store.image || ''} size="small" />
          <s-link href={`/app/editLocation/${store.id}`}>
            <s-box><span style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a1a' }}>{store.storeName}</span></s-box>
            <s-box>{store.address}, {store.city}, {store.region}{store.code ? `, ${store.code}` : ''}</s-box>
          </s-link>
        </s-stack>
      </s-table-cell>
      <s-table-cell>
        <s-badge tone={store.type === "Manual" ? "info" : "caution"}>{store.type}</s-badge>
      </s-table-cell>
      <s-table-cell>
        <s-badge tone={store.visibility === "visible" ? "success" : "auto"}>
          <s-text>{store.visibility === "visible" ? "Visible" : "Hidden"}</s-text>
        </s-badge>
      </s-table-cell>
      <s-table-cell>{new Date(store.createdAt).toISOString().split("T")[0]}</s-table-cell>
      <s-table-cell>{new Date(store.updatedAt).toISOString().split("T")[0]}</s-table-cell>
      <s-table-cell>
        <s-stack direction="inline" alignItems="center" gap="small">
          <s-tooltip id="deleteId">Delete</s-tooltip>
          <s-button variant="tertiary" icon="delete" commandFor={`deleteId-modal-${store.id}`} interestFor="deleteId"></s-button>
          <s-modal id={`deleteId-modal-${store.id}`} heading="Delete Location">
            <s-text>Are you sure you want to delete this store? This action cannot be undone.</s-text>
            <s-button slot="secondary-actions" variant="secondary" commandFor={`deleteId-modal-${store.id}`} command="--hide">Cancel</s-button>
            <s-button
              slot="primary-action"
              variant="primary"
              tone="critical"
              commandFor={`deleteId-modal-${store.id}`}
              command="--hide"
              onClick={(e: any) => { e.stopPropagation(); onDelete(store.id); }}
            >Delete</s-button>
          </s-modal>
          <s-link href={`/app/editLocation/${store.id}`}>
            <s-tooltip id="editId">Edit</s-tooltip>
            <s-button variant="tertiary" icon="edit" interestFor="editId"></s-button>
          </s-link>
        </s-stack>
      </s-table-cell>
    </s-table-row>
  );
}
