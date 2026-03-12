import { AddressAutocomplete } from "app/component/addressAutocomplete";
import { validatePhoneNumber } from "app/utils/phoneValidation";
import { validateWebsiteUrl } from "app/utils/websiteValidation";

interface StorePreviewData {
  storeName: string;
  address: string;
  phone: string;
  city: string;
  region: string;
  state: string;
  code: string;
  url: string;
  lat: string;
  lon: string;
}

interface LocationInfoSectionProps {
  googleMapsApiKey: string;
  fieldErrors: Record<string, string>;
  phoneError: string;
  websiteError: string;
  formRef: React.RefObject<HTMLFormElement>;
  previewData: StorePreviewData;
  onPreviewChange: (data: Partial<StorePreviewData>) => void;
  onClearFieldError: (field: string) => void;
  onPhoneErrorChange: (err: string) => void;
  onWebsiteErrorChange: (err: string) => void;
  onAddressValidChange: (isValid: boolean) => void;
  onAddressChanged?: () => void;
  onCoordinatesChange: (lat: string, lon: string) => void;
  checkDirty: () => void;
  defaultValues?: Partial<StorePreviewData>;
}

const tagInputStyles = { display: 'flex', gap: '8px', flexWrap: 'wrap' as const };

export default function LocationInfoSection({
  googleMapsApiKey,
  fieldErrors,
  phoneError,
  websiteError,
  formRef,
  previewData,
  onPreviewChange,
  onClearFieldError,
  onPhoneErrorChange,
  onWebsiteErrorChange,
  onAddressValidChange,
  onAddressChanged,
  onCoordinatesChange,
  checkDirty,
  defaultValues,
}: LocationInfoSectionProps) {
  return (
    <s-section>
      <s-stack>
        <s-stack direction="inline" justifyContent="space-between">
          <s-heading>Location Information</s-heading>
          <s-badge tone="info">Manual</s-badge>
        </s-stack>
      </s-stack>
      <s-stack paddingBlockStart="small" gap="small-200">
        <s-box>
          <s-text-field
            label="Location Name"
            name="storeName"
            error={fieldErrors.storeName}
            required
            defaultValue={defaultValues?.storeName || ""}
            onInput={(e: any) => {
              const value = e.target.value;
              onPreviewChange({ storeName: value });
              if (value.trim()) onClearFieldError('storeName');
              checkDirty();
            }}
          />
        </s-box>
        <s-box>
          <AddressAutocomplete
            defaultValue={defaultValues?.address || ""}
            error={fieldErrors.address}
            checkDirty={checkDirty}
            googleMapsApiKey={googleMapsApiKey}
            onValidationChange={(isValid) => {
              onAddressValidChange(isValid);
              if (isValid) onClearFieldError('address');
            }}
            onAddressChange={(value) => {
              onPreviewChange({ address: value });
              if (value.trim()) {
                onClearFieldError('address');
                onAddressChanged?.();
              }
              checkDirty();
            }}
            onSelect={(data) => {
              if (formRef.current) {
                const cityField = formRef.current.elements.namedItem('city') as HTMLInputElement;
                const codeField = formRef.current.elements.namedItem('code') as HTMLInputElement;
                const regionField = formRef.current.elements.namedItem('region') as HTMLInputElement;
                const latField = formRef.current.elements.namedItem('lat') as HTMLInputElement;
                const lonField = formRef.current.elements.namedItem('lon') as HTMLInputElement;
                if (cityField) cityField.value = data.city;
                if (codeField) codeField.value = data.code;
                if (regionField) regionField.value = data.region;
                if (latField) latField.value = data.lat;
                if (lonField) lonField.value = data.lon;
                onCoordinatesChange(data.lat, data.lon);
                onPreviewChange({
                  address: data.address,
                  city: data.city,
                  code: data.code,
                  region: data.region,
                  lat: data.lat,
                  lon: data.lon,
                });
                onClearFieldError('address');
                onClearFieldError('city');
                onClearFieldError('region');
              }
            }}
          />
        </s-box>
        <s-grid
          gridTemplateColumns="@container (inline-size > 768px) 1fr 1fr 1fr, 1fr"
          gap="base"
        >
          <s-grid-item>
            <s-text-field
              label="City"
              name="city"
              error={fieldErrors.city}
              required
              defaultValue={defaultValues?.city || ""}
              onInput={(e: any) => {
                const value = e.target.value;
                onPreviewChange({ city: value });
                if (value.trim()) onClearFieldError('city');
                checkDirty();
              }}
            />
          </s-grid-item>
          <s-grid-item>
            <s-text-field
              label="Country"
              name="region"
              error={fieldErrors.region}
              required
              defaultValue={defaultValues?.region || ""}
              onInput={(e: any) => {
                const value = e.target.value;
                onPreviewChange({ region: value });
                if (value.trim()) onClearFieldError('region');
                checkDirty();
              }}
            />
          </s-grid-item>
          <s-grid-item>
            <s-text-field
              label="Zip Code"
              name="code"
              defaultValue={defaultValues?.code || ""}
              onInput={(e: any) => {
                onPreviewChange({ code: e.target.value });
                checkDirty();
              }}
            />
          </s-grid-item>
        </s-grid>
        <s-grid
          gridTemplateColumns="@container (inline-size > 768px) 1fr 1fr, 1fr"
          gap="base"
        >
          <s-grid-item>
            <s-text-field
              label="Phone Number"
              name="phone"
              required
              defaultValue={defaultValues?.phone || ""}
              error={fieldErrors.phone || phoneError}
              onInput={(e: any) => {
                const value = e.target.value;
                onPreviewChange({ phone: value });
                checkDirty();
                if (value.trim()) {
                  onClearFieldError('phone');
                  const validation = validatePhoneNumber(value);
                  if (validation.isValid) onPhoneErrorChange("");
                } else {
                  onPhoneErrorChange("");
                }
              }}
            />
          </s-grid-item>
          <s-grid-item>
            <s-text-field
              label="Website"
              name="url"
              defaultValue={defaultValues?.url || ""}
              placeholder="http://example.com/"
              error={websiteError}
              onInput={(e: any) => {
                const value = e.target.value;
                checkDirty();
                onPreviewChange({ url: value });
                if (!value.trim()) {
                  onWebsiteErrorChange("");
                  return;
                }
                const validation = validateWebsiteUrl(value);
                if (validation.isValid) onWebsiteErrorChange("");
              }}
            />
          </s-grid-item>
        </s-grid>
      </s-stack>
    </s-section>
  );
}
