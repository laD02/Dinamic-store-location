import { SocialPlatform, validateSocialUrl } from "app/utils/socialValidation";

type SocialMedia = {
  id: string;
  platform: string;
  url: string;
};

interface SocialMediaSectionProps {
  countSocial: SocialMedia[];
  socialErrors: Record<string, string>;
  socialResetKey: number;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: 'platform' | 'url', value: string) => void;
  onClearError: (id: string) => void;
  onValidatePlatform: (id: string, url: string, platform: SocialPlatform) => void;
  setSocialErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function SocialMediaSection({
  countSocial,
  socialErrors,
  socialResetKey,
  onAdd,
  onRemove,
  onChange,
  onClearError,
  onValidatePlatform,
  setSocialErrors,
}: SocialMediaSectionProps) {
  return (
    <s-section>
      <s-stack direction="inline" justifyContent="space-between" alignItems="center">
        <s-stack>
          <s-heading>Social Media</s-heading>
        </s-stack>
        <s-button icon="plus-circle" onClick={onAdd}>Add Social Media</s-button>
      </s-stack>
      <s-stack paddingBlockStart="small" gap="small-200">
        {countSocial.map((item) => (
          <s-stack
            direction="inline"
            justifyContent="start"
            gap="small-200"
            alignItems="start"
            key={`${socialResetKey}-${item.id}`}
          >
            <div style={{ width: "20%", marginTop: -4 }}>
              <s-select
                value={item.platform}
                onChange={(e: any) => {
                  onChange(item.id, 'platform', e.target.value);
                  if (item.url.trim()) {
                    onValidatePlatform(item.id, item.url, e.target.value as SocialPlatform);
                  }
                }}
              >
                <s-option value="linkedin">LinkedIn</s-option>
                <s-option value="youtube">Youtube</s-option>
                <s-option value="facebook">Facebook</s-option>
                <s-option value="instagram">Instagram</s-option>
                <s-option value="x">X</s-option>
                <s-option value="pinterest">Pinterest</s-option>
                <s-option value="tiktok">Tiktok</s-option>
              </s-select>
            </div>
            <div style={{ flex: 1 }}>
              <s-text-field
                name="contract"
                placeholder={`https://www.${item.platform}.com/`}
                error={socialErrors[item.id]}
                value={item.url}
                onInput={(e: any) => {
                  const value = e.target.value;
                  onChange(item.id, 'url', value);
                  if (value.trim()) {
                    const validation = validateSocialUrl(value, item.platform as SocialPlatform);
                    if (validation.isValid) {
                      onClearError(item.id);
                    }
                  } else {
                    onClearError(item.id);
                  }
                }}
              />
            </div>
            <div style={{ marginTop: 2 }}>
              <s-button icon="delete" onClick={() => onRemove(item.id)} />
            </div>
          </s-stack>
        ))}
      </s-stack>
    </s-section>
  );
}
