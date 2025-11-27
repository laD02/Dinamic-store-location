import { GoogleMap, Marker, OverlayView, useJsApiLoader } from "@react-google-maps/api";
import { useState, useEffect, useRef } from "react";
import styles from "../css/mapDesigner.module.css"
import { useLoaderData } from "react-router";

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
  backgroundColor:string,
  color:string,
  iconColor:string,
  shadowColor:string,
  transparency:number,
  blur:number,
  anchorx:number,
  anchory:number,
  cornerRadius:number
}

export default function MapGoogle({
  stores,
  selectedIndex,
  searchAddress,
  popupStyle,
}: {
  stores: Store[];
  selectedIndex: number | null;
  searchAddress: string;
  popupStyle: PopupStyle;
}) {
  const [selected, setSelected] = useState<Store | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: stores[0]?.lat ?? 10.762622,
    lng: stores[0]?.lng ?? 106.660172,
  });

  const {googleMapsApiKey} = useLoaderData()
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

  useEffect(() => {
    if (mapLoaded && stores[0]?.lat != null && stores[0]?.lng != null) {
      const firstStore = stores[0];
      const newCenter = { lat: firstStore.lat!, lng: firstStore.lng! };
      mapRef.current?.panTo(newCenter);
      mapRef.current?.setZoom(16);
      setCenter(newCenter);
      setSelected(firstStore); // InfoWindow hiển thị
    }
  }, [mapLoaded, stores]);

  // Khi click store trong danh sách → pan tới store đó
  useEffect(() => {
    if (
      selectedIndex !== null &&
      stores[selectedIndex]?.lat != null &&
      stores[selectedIndex]?.lng != null &&
      mapRef.current
    ) {
      const s = stores[selectedIndex];
      const newCenter = { lat: s.lat!, lng: s.lng! };
      mapRef.current.panTo(newCenter);
      mapRef.current.setZoom(16);
      setCenter(newCenter);
      setSelected(s);
    }
  }, [selectedIndex, stores]);

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
    <div style={{ width: "100%", height: "500px" }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={16}
        onLoad={onLoad}
      >
        {stores.map((store) => {
          if (!store.lat || !store.lng) return null;
          const lat = Number(store.lat);
          const lng = Number(store.lng);
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker
              key={store.id}
              position={{ lat, lng }}
              onClick={() => {
                setSelected(store);
                if (store.lat && store.lng) {
                  const newCenter = { lat: store.lat, lng: store.lng };
                  setCenter(newCenter);
                  mapRef.current?.panTo(newCenter);
                }
              }}
            />
          );
        })}

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
                boxShadow: `${popupStyle.anchorx}px ${popupStyle.anchory}px ${popupStyle.blur}px ${hexToRgba(popupStyle.shadowColor, popupStyle.transparency / 100)}`
              }}
            >
              {
                selected.image &&
                <img 
                  src={selected.image}
                />
              }  
              <h3>{selected.storeName}</h3>
              <p>{selected.address}, {selected.city}, {selected.state}, {selected.code}</p>
              <span>
                <i className="fa-solid fa-phone" style={{color: popupStyle.iconColor}}></i>
                {selected.phone}
              </span>       
            </div>
          </OverlayView>
        )}
      </GoogleMap>
    </div>
  );
}
