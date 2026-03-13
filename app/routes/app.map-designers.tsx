// app/routes/app.help-center.tsx
import { ActionFunctionArgs, Form, LoaderFunctionArgs, useActionData, useFetcher, useLoaderData } from "react-router";
import styles from "../css/mapDesigner.module.css"
import { useEffect, useMemo, useRef, useState } from "react";
import prisma from "app/db.server";
import 'leaflet/dist/leaflet.css';
import MapGoogle from "../component/map";
import MapDesigner from "../component/mapDesigner";
import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "app/utils/upload.server";
import { getOpenStatus } from "app/utils/timeUtils";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session?.shop;
  const stores = await prisma.store.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
  const config = await prisma.style.findFirst({
    where: { shop }
  })
  const googleMapsApiKey = process.env.GOOGLE_MAP_KEY

  return { stores, config, googleMapsApiKey };
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session?.shop;
  const formData = await request.formData();
  const theme = JSON.parse(formData.get("theme") as string);
  const popup = JSON.parse(formData.get("popup") as string);
  const branding = JSON.parse(formData.get("branding") as string);

  const exist = await prisma.style.findFirst({
    where: { shop }
  }) as any;

  let markerIconUrl = branding.markerIcon;
  if (markerIconUrl && markerIconUrl.startsWith("data:image")) {
    // Check if it's a premium marker (has data-style attribute in SVG)
    let isPremiumMarker = false;
    if (markerIconUrl.includes("data:image/svg+xml")) {
      if (markerIconUrl.includes("base64,")) {
        try {
          const base64Data = markerIconUrl.split("base64,")[1];
          const decoded = Buffer.from(base64Data, 'base64').toString();
          isPremiumMarker = decoded.includes("data-style=");
        } catch (e) {
          console.error("Error decoding SVG for premium check:", e);
        }
      } else {
        isPremiumMarker = markerIconUrl.includes("data-style=");
      }
    }

    if (!isPremiumMarker) {
      // New custom icon uploaded (base64)
      if (exist?.markerIcon && exist.markerIcon.includes("cloudinary")) {
        await deleteImageFromCloudinary(exist.markerIcon);
      }
      const uploadedUrl = await uploadImageToCloudinary(markerIconUrl);
      markerIconUrl = uploadedUrl ?? "";
    }
    // If it is premium marker, we keep it as the data URI to preserve metadata
  }

  const data = {
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    primaryFont: theme.primaryFont,
    secondaryFont: theme.secondaryFont,
    backgroundColor: popup.backgroundColor,
    color: popup.color,
    iconColor: popup.iconColor,
    shadowColor: popup.shadowColor,
    transparency: popup.transparency,
    blur: popup.blur,
    anchorx: popup.anchorx,
    anchory: popup.anchory,
    cornerRadius: popup.cornerRadius,
    markerIcon: markerIconUrl,
    mapStyle: branding.mapStyle,
  };

  if (!exist) {
    await prisma.style.create({
      data: {
        shop,
        ...data
      },
    });
  } else {
    await prisma.style.update({
      where: {
        id: exist.id,
      },
      data,
    });
  }

  return { ok: true };
}
const previewStore = {
  id: "mock-apple-park",
  storeName: "Apple Park",
  address: "1 Apple Park Way, Cupertino, CA 95014, USA",
  city: "Cupertino",
  state: "CA",
  code: "95014",
  phone: "+1 408-996-1010",
  lat: 37.3346,
  lng: -122.0090,
  image: null,
  time: {
    mondayOpen: "09:00",
    mondayClose: "17:00",
    tuesdayOpen: "09:00",
    tuesdayClose: "17:00",
    wednesdayOpen: "09:00",
    wednesdayClose: "17:00",
    thursdayOpen: "09:00",
    thursdayClose: "17:00",
    fridayOpen: "09:00",
    fridayClose: "17:00",
    saturdayOpen: "10:00",
    saturdayClose: "16:00",
    sundayOpen: "close",
    sundayClose: "close",
  },
};

export default function MapDesigners() {
  const fetcher = useFetcher()
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const { stores, config } = useLoaderData<typeof loader>();
  const [searchAddress, setSearchAddress] = useState<string>("");
  const shopify = useAppBridge()
  const [leftWidth, setLeftWidth] = useState<number>(49);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSaving = fetcher.state === "submitting" || fetcher.state === "loading";
  const SAVE_BAR_ID = "map-designer-save-bar";
  const [closePickerTrigger, setClosePickerTrigger] = useState(false);

  const defaultTheme = {
    primaryColor: "#000",
    secondaryColor: "#000",
    primaryFont: "Roboto",
    secondaryFont: "Open Sans",
  };

  const defaultPopup = {
    backgroundColor: "#fff",
    color: "#000000",
    iconColor: "#5230f9",
    shadowColor: "#000000",
    transparency: 60,
    blur: 4,
    anchorx: -2,
    anchory: -2,
    cornerRadius: 3
  };

  const defaultBranding = {
    markerIcon: null,
    mapStyle: "[]"
  };

  const [theme, setTheme] = useState(defaultTheme);
  const [popup, setPopup] = useState(defaultPopup);
  const [branding, setBranding] = useState(defaultBranding);

  const savedConfigRef = useRef({
    theme: defaultTheme,
    popup: defaultPopup,
    branding: defaultBranding
  });

  // Detect screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Trigger map resize when switching layout
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 150);

    return () => clearTimeout(timer);
  }, [isMobile]);

  useEffect(() => {
    if (fetcher.data?.ok) {
      shopify.toast.show("Map designer saved!");
      shopify.saveBar.hide(SAVE_BAR_ID);

      savedConfigRef.current = {
        theme,
        popup,
        branding,
      };
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (config) {
      const cfg = config as any;
      const loadedTheme = {
        primaryColor: cfg.primaryColor,
        secondaryColor: cfg.secondaryColor,
        primaryFont: cfg.primaryFont,
        secondaryFont: cfg.secondaryFont,
      };

      const loadedPopup = {
        backgroundColor: cfg.backgroundColor,
        color: cfg.color,
        iconColor: cfg.iconColor,
        shadowColor: cfg.shadowColor,
        transparency: cfg.transparency,
        blur: cfg.blur,
        anchorx: cfg.anchorx,
        anchory: cfg.anchory,
        cornerRadius: cfg.cornerRadius,
      };

      const loadedBranding = {
        markerIcon: cfg.markerIcon,
        mapStyle: cfg.mapStyle || "[]",
      };

      savedConfigRef.current = {
        theme: loadedTheme,
        popup: loadedPopup,
        branding: loadedBranding
      };

      setTheme(loadedTheme);
      setPopup(loadedPopup);
      setBranding(loadedBranding);
    }
  }, [config]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isMobile) {
      setIsResizing(true);
      e.preventDefault();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current || isMobile) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      if (newWidth >= 30 && newWidth <= 70) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isMobile]);

  const search = useMemo(() => {
    return stores.filter(stores => {
      const matchesSearch =
        stores.address.toLowerCase().includes(searchAddress.toLowerCase()) ||
        stores.code.toLowerCase().includes(searchAddress.toLowerCase())

      return matchesSearch
    })
  }, [stores, searchAddress])

  const handleSave = () => {
    setClosePickerTrigger(prev => !prev);
    fetcher.submit(
      {
        theme: JSON.stringify(theme),
        popup: JSON.stringify(popup),
        branding: JSON.stringify(branding),
      },
      { method: "post" }
    );
  };

  const handleDiscard = () => {
    setClosePickerTrigger(prev => !prev);
    setTheme(savedConfigRef.current.theme);
    setPopup(savedConfigRef.current.popup);
    setBranding(savedConfigRef.current.branding);
    shopify.saveBar.hide(SAVE_BAR_ID);
  };

  const isConfigChanged = (
    nextTheme: typeof theme,
    nextPopup: typeof popup,
    nextBranding: typeof branding
  ) => {
    return (
      JSON.stringify(nextTheme) !== JSON.stringify(savedConfigRef.current.theme) ||
      JSON.stringify(nextPopup) !== JSON.stringify(savedConfigRef.current.popup) ||
      JSON.stringify(nextBranding) !== JSON.stringify(savedConfigRef.current.branding)
    );
  };

  return (
    <s-page heading="Store Locator" >
      <SaveBar id={SAVE_BAR_ID}>
        <button
          variant="primary"
          loading={isSaving ? "true" : undefined}
          onClick={handleSave}
        >
          Save
        </button>

        <button disabled={isSaving} onClick={handleDiscard}>
          Discard
        </button>
      </SaveBar>

      <s-stack direction="inline" alignItems="center" gap="small-400">
        <s-icon type="theme-edit"></s-icon>
        <h2>Map Designer</h2>
      </s-stack>

      <div
        ref={containerRef}
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '16px' : '0px',
          position: 'relative',
          width: '100%',
          userSelect: isResizing ? 'none' : 'auto'
        }}
      >
        {/* Left Column - Designer */}
        <div
          style={{
            width: isMobile ? '100%' : `${leftWidth}%`,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative'
          }}
        >
          <MapDesigner
            config={{ theme, popup, branding }}
            onClosePickerRequest={closePickerTrigger}
            onThemeChange={(v) => {
              setTheme(v);
              if (isConfigChanged(v, popup, branding)) {
                shopify.saveBar.show(SAVE_BAR_ID);
              } else {
                shopify.saveBar.hide(SAVE_BAR_ID);
              }
            }}
            onPopupChange={(v) => {
              setPopup(v);
              if (isConfigChanged(theme, v, branding)) {
                shopify.saveBar.show(SAVE_BAR_ID);
              } else {
                shopify.saveBar.hide(SAVE_BAR_ID);
              }
            }}
            onBrandingChange={(v) => {
              setBranding(v);
              if (isConfigChanged(theme, popup, v)) {
                shopify.saveBar.show(SAVE_BAR_ID);
              } else {
                shopify.saveBar.hide(SAVE_BAR_ID);
              }
            }}
          />

          <input type="hidden" name="theme" value={JSON.stringify(theme)} />
          <input type="hidden" name="popup" value={JSON.stringify(popup)} />
          <input type="hidden" name="branding" value={JSON.stringify(branding)} />
        </div>

        {/* Resize Handle - Desktop Only */}
        {!isMobile && (
          <div
            onMouseDown={handleMouseDown}
            style={{
              width: '16px',
              cursor: 'col-resize',
              transition: isResizing ? 'none' : 'background 0.2s',
              position: 'relative',
              flexShrink: 0
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#ddd',
                borderRadius: '2px',
                pointerEvents: 'none'
              }}
            />
          </div>
        )}

        {/* Right Column - Info Item + Map */}
        <div
          style={{
            width: isMobile ? '100%' : `${100 - leftWidth}%`,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            minHeight: isMobile ? '500px' : 'auto'
          }}
        >
          {/* Info Item - Always on top */}
          <div style={{ flexShrink: 0 }}>
            <s-section>
              <s-stack
                gap="small-500"
              >
                <div
                  className={styles.storeItem}
                  style={{
                    borderColor: theme.secondaryColor,
                  }}
                >
                  <div className={styles.storeItemHeader}>
                    <h4 className={styles.storeItemName} style={{
                      color: theme.primaryColor,
                      fontFamily: theme.primaryFont,
                    }}>
                      Apple Park
                    </h4>
                  </div>

                  <div className={styles.storeItemDetails}>
                    <div className={`${styles.storeItemRow} ${styles.addressRow}`} style={{ color: theme.primaryColor }}>
                      <i className="fa-solid fa-location-dot"></i>
                      <span style={{
                        fontFamily: theme.secondaryFont
                      }}>
                        1 Apple Park Way, Cupertino, CA 95014, USA
                      </span>
                    </div>

                    <div className={`${styles.storeItemRow} ${styles.phoneRow}`} style={{ color: theme.secondaryColor }}>
                      <i className="fa-solid fa-phone"></i>
                      <span style={{
                        fontFamily: theme.secondaryFont
                      }}>
                        +1 408-996-1010
                      </span>
                    </div>
                  </div>
                </div>
              </s-stack>
            </s-section>
          </div>

          {/* Map - Below info item */}
          <div style={{
            height: isMobile ? '600px' : '750px',
            minHeight: isMobile ? '600px' : '750px',
            flex: isMobile ? '0 0 auto' : 1,
            width: '100%',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <MapGoogle
              key={isMobile ? 'mobile-map' : 'desktop-map'}
              stores={stores ?? []}
              selectedIndex={selectedIndex}
              searchAddress={searchAddress}
              popupStyle={popup}
              mapStyle={branding.mapStyle}
              markerIcon={branding.markerIcon}
            />
          </div>
        </div>
      </div>

      <s-stack alignItems="center" paddingBlock="large-200">
        <s-text>
          Learn more about <span style={{ color: 'blue' }}><s-link href="">Map Designers section</s-link></span>
        </s-text>
      </s-stack>
    </s-page>
  );
}