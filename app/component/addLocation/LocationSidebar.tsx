import { useRef } from "react";
import styles from "app/css/addLocation.module.css";

type SocialMedia = {
  id: string;
  platform: string;
  url: string;
};

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

interface LocationSidebarProps {
  visibility: string;
  onVisibilityChange: (v: string) => void;
  preview: string | null;
  imageBase64: string | null;
  onImageChange?: (base64: string | null, previewUrl: string | null) => void;
  previewData: StorePreviewData;
  countSocial: SocialMedia[];
  dayStatus: Record<string, { valueOpen: string; valueClose: string }>;
  days: string[];
  tags: string[];
  onCallPhone?: (phone: string) => void;
  coordinates?: { lat: string; lon: string };
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  onFileClick?: () => void;
  onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove?: () => void;
}

const socialIcons: Record<string, string> = {
  facebook: 'fa-facebook',
  youtube: 'fa-youtube',
  linkedin: 'fa-linkedin',
  instagram: 'fa-square-instagram',
  x: 'fa-square-x-twitter',
  pinterest: 'fa-pinterest',
  tiktok: 'fa-tiktok'
};

export default function LocationSidebar({
  visibility,
  onVisibilityChange,
  preview,
  imageBase64,
  onImageChange,
  previewData,
  countSocial,
  dayStatus,
  days,
  tags,
  onCallPhone: providedOnCallPhone,
  coordinates: providedCoordinates,
  fileInputRef: providedFileInputRef,
  onFileClick,
  onFileChange: providedOnFileChange,
  onImageRemove,
}: LocationSidebarProps) {
  const internalFileInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = providedFileInputRef || internalFileInputRef;

  const handleClick = () => {
    if (onFileClick) {
      onFileClick();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (providedOnFileChange) {
      providedOnFileChange(e);
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageChange?.(reader.result as string, imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const callPhone = (phone: string) => {
    if (providedOnCallPhone) {
      providedOnCallPhone(phone);
    } else {
      window.top!.location.href = `tel:${phone}`;
    }
  };

  return (
    <s-grid
      gridTemplateColumns="@container (inline-size > 768px) 1fr, 1fr 1fr"
      gap="base"
    >
      <s-grid-item>
        <s-stack gap="base">
          <s-section heading="Visibility">
            <s-select
              value={visibility}
              onChange={(e: any) => onVisibilityChange(e.target.value)}
            >
              <s-option value="hidden">Hidden</s-option>
              <s-option value="visible">Visible</s-option>
            </s-select>
          </s-section>

          <s-section>
            <s-box>
              <s-heading>Add a logo for this location</s-heading>
            </s-box>
            <s-stack direction="inline" justifyContent="space-between" paddingBlockStart="small-200" alignItems="center">
              <s-stack
                background="subdued"
                paddingInline="large-500"
                borderStyle="dashed"
                borderWidth="small"
                borderRadius="large"
                paddingBlock="large-300"
                alignItems="center"
                justifyContent="center"
                direction="block"
                inlineSize="100%"
              >
                {preview ? (
                  <s-stack justifyContent="center" alignItems="center">
                    <s-box inlineSize="60px" blockSize="60px">
                      <s-image src={preview} alt="preview" objectFit="cover" loading="lazy" />
                    </s-box>
                    <s-box>
                      <s-clickable
                        onClick={(e: any) => {
                          e.stopPropagation?.();
                          if (onImageRemove) {
                            onImageRemove();
                          } else {
                            onImageChange?.(null, null);
                          }
                        }}
                      >
                        <s-icon type="x" />
                      </s-clickable>
                    </s-box>
                  </s-stack>
                ) : (
                  <s-stack alignItems="center">
                    <s-button onClick={handleClick}>Add file</s-button>
                    <s-paragraph>Accepts .gif, .jpg, .png and .svg</s-paragraph>
                  </s-stack>
                )}
              </s-stack>
              <input
                ref={fileInputRef as any}
                id="upload-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <input type="hidden" name="image" value={imageBase64 ?? ""} />
            </s-stack>
          </s-section>
        </s-stack>
      </s-grid-item>

      <s-grid-item>
        <div className={styles.boxOverlay}>
          <div className={styles.overlayImageContainer}>
            <img src={preview || "/shop.png"} alt="Store" />
          </div>
          <div className={styles.storeInfo}>

            <h3 className={styles.storeName}>{previewData.storeName || 'Downtown Store'}</h3>
            <div className={styles.contactRow}>
              <i className="fa-solid fa-location-dot"></i>
              <span className={styles.storeAddress}>
                {previewData.address || '123 Main Street'}, {previewData.city || 'New York'}, {previewData.region || 'United States'}, {previewData.code || '10001'}
              </span>
            </div>
            <div className={styles.contactRow}>
              <i className="fa-solid fa-phone"></i>
              <a
                onClick={() => callPhone(previewData.phone || '+1 408-996-1010')}
                style={{ cursor: "pointer", textDecoration: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
              >
                {previewData.phone || "+1 408-996-1010"}
              </a>
            </div>
            <div className={styles.contactRow}>
              <i className="fa-solid fa-earth-americas"></i>
              <s-link href={previewData.url || ''}>
                <text style={{ color: '#303030' }}>{previewData.url || 'http://example.com/'}</text>
              </s-link>
            </div>
            <div className={styles.contactRow}>
              <i className="fa-solid fa-clock"></i>
              <table>
                <tbody>
                  {days.map(day => {
                    const status = dayStatus[day];
                    if (!status.valueOpen || !status.valueClose ||
                      status.valueOpen === "close" || status.valueClose === "close") {
                      return (
                        <tr key={day}>
                          <td>{day}</td>
                          <td>Close</td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={day}>
                        <td>{day}</td>
                        <td>{status.valueOpen} - {status.valueClose}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.socialIcons}>
              {countSocial.map(item => {
                const iconClass = socialIcons[item.platform];
                return (
                  <a href={item.url} target="_blank" key={item.id} className={styles[item.platform]} rel="noreferrer">
                    <i className={`fa-brands ${iconClass}`} />
                  </a>
                );
              })}
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${providedCoordinates?.lat || previewData.lat || ''},${providedCoordinates?.lon || previewData.lon || ''}`}
              target="_blank"
              rel="noreferrer"
              className={styles.directionButton}
              style={{ backgroundColor: 'blue', color: '#ffffff' }}
            >
              <i className="fa-solid fa-diamond-turn-right"></i>
              Get Direction
            </a>
          </div>
        </div>
      </s-grid-item>
    </s-grid>
  );
}
