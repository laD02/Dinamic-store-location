interface LocationFormHeaderProps {
  visibility: string;
  onBack: () => void;
}

export default function LocationFormHeader({ visibility, onBack }: LocationFormHeaderProps) {
  return (
    <s-stack direction="inline" justifyContent="space-between" paddingBlock="large">
      <s-stack direction="inline" gap="small-100" alignItems="center">
        <s-box>
          <s-button variant="tertiary" onClick={onBack} icon="arrow-left"></s-button>
        </s-box>
        <text style={{ fontSize: 16, fontWeight: 600 }}>Add Location</text>
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
    </s-stack>
  );
}
