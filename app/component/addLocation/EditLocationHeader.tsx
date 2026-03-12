import { useNavigate } from "react-router";

interface EditLocationHeaderProps {
  storeName: string;
  storeId: string;
  visibility: string;
  onBack: () => void;
  onDelete: (id: string) => void;
}

export default function EditLocationHeader({
  storeName,
  storeId,
  visibility,
  onBack,
  onDelete,
}: EditLocationHeaderProps) {
  return (
    <s-stack direction="inline" justifyContent="space-between" paddingBlock="large">
      <s-stack direction="inline" gap="small-100" alignItems="center">
        <s-box>
          <s-button
            variant="tertiary"
            onClick={onBack}
            icon="arrow-left"
          />
        </s-box>
        <text style={{ fontSize: 16, fontWeight: 600 }}>{storeName}</text>
        <s-box>
          {visibility === "visible" ? (
            <s-badge tone="success">
              <s-stack direction="inline" alignItems="center">
                <s-icon type="eye-check-mark" />
                Visible
              </s-stack>
            </s-badge>
          ) : (
            <s-badge>
              <s-stack direction="inline" alignItems="center">
                <s-icon type="hide" tone="info" />
                Hidden
              </s-stack>
            </s-badge>
          )}
        </s-box>
      </s-stack>
      <s-stack direction="inline" justifyContent="space-between" gap="small-300">
        <s-button tone="critical" commandFor={`delete-modal-${storeId}`}>
          Delete
        </s-button>
        <s-modal id={`delete-modal-${storeId}`} heading="Delete Location">
          <s-text>
            Are you sure you want to delete this store? This action cannot be undone.
          </s-text>
          <s-button
            slot="secondary-actions"
            variant="secondary"
            commandFor={`delete-modal-${storeId}`}
            command="--hide"
          >
            Cancel
          </s-button>
          <s-button
            slot="primary-action"
            variant="primary"
            tone="critical"
            commandFor={`delete-modal-${storeId}`}
            command="--hide"
            onClick={() => onDelete(storeId)}
          >
            Delete
          </s-button>
        </s-modal>
      </s-stack>
    </s-stack>
  );
}
