import { GoogleMap, OverlayView, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { useState, useEffect, useRef, useMemo } from "react";
import styles from "../css/mapDesigner.module.css"
import { useLoaderData } from "react-router";
import { getOpenStatus } from "app/utils/timeUtils";

type Store = {
  id: string;
  storeName: string;
  lat: number | null;
  lng: number | null;
  address: string;
  city: string;
  state: string;
  code: string;
  phone: string | null;
  image: string | null;
  url?: string | null;
  directions?: string | null;
  contract?: any;
  source?: string | null;
  visibility?: string | null;
  time?: any;
  createdAt?: Date;
  updatedAt?: Date;
};

interface PopupStyle {
  backgroundColor: string,
  color: string,
  iconColor: string,
  shadowColor: string,
  transparency: number,
  blur: number,
  anchorx: number,
  anchory: number,
  cornerRadius: number
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Mock store for preview
const previewStore: Store = {
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
  time: null,
};

export default function MapGoogle({
  stores,
  selectedIndex,
  searchAddress,
  popupStyle,
  mapStyle,
  markerIcon
}: {
  stores: Store[];
  selectedIndex: number | null;
  searchAddress: string;
  popupStyle: PopupStyle;
  mapStyle?: string;
  markerIcon?: string | null;
}) {
  const [selected, setSelected] = useState<Store | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const currentStores = useMemo(() => {
    const validStores = stores?.filter(s => s.lat != null && s.lng != null) ?? [];
    return [previewStore, ...validStores];
  }, [stores]);

  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: currentStores[0]?.lat ?? 37.3346,
    lng: currentStores[0]?.lng ?? -122.0090,
  });

  const { googleMapsApiKey } = useLoaderData()
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: googleMapsApiKey || '',
    libraries: ["places"],
  });

  const onLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    setMapLoaded(true)
  };

  const panToStoreWithOffset = (lat: number, lng: number, zoom?: number) => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const center = new google.maps.LatLng(lat, lng);

    if (zoom) map.setZoom(zoom);

    // Perform initial pan to marker
    map.panTo(center);

    // After a short delay (or immediately if possible), adjust for popup height
    // Since we are using react-google-maps/api, we can use the map object directly.
    setTimeout(() => {
      const projection = map.getProjection();
      if (projection) {
        const markerPixel = projection.fromLatLngToPoint(center);
        if (markerPixel) {
          const scale = Math.pow(2, map.getZoom()!);
          // The overlay is ~400px tall and offset 44px above the marker.
          // To put the OVERLAY perfectly in the middle of a 750px tall map container,
          // the camera needs to shift up by approximately 300 pixels.
          const offsetPx = 300 / scale;
          const targetPoint = new google.maps.Point(
            markerPixel.x,
            markerPixel.y - offsetPx
          );
          const targetLatLng = projection.fromPointToLatLng(targetPoint);
          if (targetLatLng) {
            map.panTo(targetLatLng);
            setCenter({ lat: targetLatLng.lat(), lng: targetLatLng.lng() });
          }
        }
      }
    }, 200);
  };

  useEffect(() => {
    if (mapLoaded && currentStores[0]?.lat != null && currentStores[0]?.lng != null) {
      const firstStore = currentStores[0];
      panToStoreWithOffset(firstStore.lat!, firstStore.lng!, 16);
      setSelected(firstStore); // InfoWindow hiển thị
    }
  }, [mapLoaded, currentStores]);

  // Khi click store trong danh sách → pan tới store đó
  useEffect(() => {
    if (
      selectedIndex !== null &&
      currentStores[selectedIndex]?.lat != null &&
      currentStores[selectedIndex]?.lng != null &&
      mapRef.current
    ) {
      const s = currentStores[selectedIndex];
      panToStoreWithOffset(s.lat!, s.lng!, 16);
      setSelected(s);
    }
  }, [selectedIndex, currentStores]);

  useEffect(() => {
    if (!mapLoaded || !searchAddress.trim()) return;

    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: searchAddress }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const loc = results[0].geometry.location;
        const newCenter = { lat: loc.lat(), lng: loc.lng() };
        mapRef.current?.panTo(newCenter);
        mapRef.current?.setZoom(14);
        setCenter(newCenter);
      }
    });
  }, [searchAddress, mapLoaded]);



  if (loadError) return <p>❌ Lỗi khi tải Google Maps API</p>;
  if (!isLoaded) return <p>⏳ Đang tải bản đồ...</p>;

  return (
    <s-stack inlineSize="100%" blockSize="100%">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%", borderRadius: '12px' }}
        center={center}
        zoom={16}
        onLoad={onLoad}
        options={{
          styles: mapStyle ? JSON.parse(mapStyle) : []
        }}
      >
        {currentStores.map((store) => (
          <MarkerF
            key={`${store.id}-${markerIcon || 'default'}`}
            position={{ lat: Number(store.lat), lng: Number(store.lng) }}
            icon={markerIcon && typeof markerIcon === 'string' && markerIcon.trim().length > 0 ? {
              url: markerIcon,
              scaledSize: new google.maps.Size(40, 40)
            } : undefined}
            onClick={() => {
              setSelected(store);
              panToStoreWithOffset(Number(store.lat), Number(store.lng));
            }}
          />
        ))}

        {selected && selected.lat && selected.lng && (
          <OverlayView
            position={{ lat: selected.lat, lng: selected.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div
              className={styles.boxOverlay}
              style={{
                backgroundColor: popupStyle.backgroundColor,
                color: popupStyle.color,
                borderRadius: popupStyle.cornerRadius,
                boxShadow: `${popupStyle.anchorx}px ${popupStyle.anchory}px ${popupStyle.blur}px ${hexToRgba(popupStyle.shadowColor, popupStyle.transparency / 100)}`,
                transform: 'translate(-50%, calc(-100% - 44px))'
              }}
            >
              <div className={styles.overlayImageContainer}>
                <img src="/shop.png" alt="Store" />
              </div>

              <div className={styles.storeInfo}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h3 className={styles.storeName} style={{ margin: 0 }}>Apple Park</h3>
                </div>
                <div className={styles.contactRow}>
                  <i className="fa-solid fa-location-dot" style={{ color: popupStyle.iconColor }}></i>
                  <span className={styles.storeAddress}>1 Apple Park Way, Cupertino, CA 95014, USA</span>
                </div>
                <div className={styles.contactRow}>
                  <i className="fa-solid fa-phone" style={{ color: popupStyle.iconColor }}></i>
                  <span>+1 408-996-1010</span>
                </div>
                <div className={styles.contactRow}>
                  <i className="fa-solid fa-earth-americas" style={{ color: popupStyle.iconColor }}></i>
                  <span className={styles.storeAddress}>http://example.com/</span>
                </div>
                <div className={styles.contactRow}>
                  <i className="fa-solid fa-clock" style={{ color: popupStyle.iconColor }}></i>
                  <table>
                    <tbody>
                      {days.map(day => {
                        const time = selected.time || {};
                        const lowerDay = day.toLowerCase();
                        const valueOpen = time[`${lowerDay}Open`];
                        const valueClose = time[`${lowerDay}Close`];

                        if (
                          !valueOpen ||
                          !valueClose ||
                          valueOpen === "close" ||
                          valueClose === "close") {
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
                            <td>{valueOpen} - {valueClose}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className={styles.socialIcons}>
                  <a href="#" className={styles.linkedin}>
                    <i className="fa-brands fa-linkedin"></i>
                  </a>
                  <a href="#" className={styles.youtube}>
                    <i className="fa-brands fa-youtube"></i>
                  </a>
                  <a href="#" className={styles.facebook}>
                    <i className="fa-brands fa-facebook"></i>
                  </a>
                </div>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className={styles.directionButton}
                  style={{
                    backgroundColor: popupStyle.iconColor, // Main color for button background
                    color: '#ffffff' // White text for contrast
                  }}
                >
                  <i className="fa-solid fa-diamond-turn-right"></i>
                  Get Direction
                </a>
              </div>
            </div>
          </OverlayView>
        )}
      </GoogleMap>
    </s-stack>
  );
}
