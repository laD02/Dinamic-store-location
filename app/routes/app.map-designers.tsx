// app/routes/app.help-center.tsx
import { ActionFunctionArgs, LoaderFunctionArgs, useFetcher, useLoaderData } from "react-router";
import styles from "../css/mapDesigner.module.css"
import { useEffect, useRef, useState } from "react";
import prisma from "app/db.server";
import 'leaflet/dist/leaflet.css';
import MapGoogle from "../component/map";
import MapDesigner from "../component/mapDesigner";
import { getLatLngFromAddress } from "../utils/geocode.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const stores = await prisma.store.findMany();

  for (const store of stores) {
    if (!store.lat || !store.lng) {
      const location = await getLatLngFromAddress(store.address);
      if (location) {
        await prisma.store.update({
          where: { id: store.id },
          data: { lat: location.lat, lng: location.lng },
        });
      }
    }
  }

  const config = await prisma.style.findFirst()

  return { stores, config }; // hoặc return {}
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const theme = JSON.parse(formData.get("theme") as string);
  const popup = JSON.parse(formData.get("popup") as string);

  // Save / update
  const exist = await prisma.style.findFirst();

  if (!exist) {
    // ✅ create
    await prisma.style.create({
      data: {
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
      },
    });
  } else {
    // ✅ update
    await prisma.style.update({
      where: {
        id: exist.id,
      },
      data: {
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
      },
    });
  }

  return { ok: true };

}

export default function MapDesigners() {
  const fetcher = useFetcher()
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const { stores, config } = useLoaderData<typeof loader>();
  const [searchAddress, setSearchAddress] = useState<string>("")
  const listRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState(() => ({
    primaryColor: "#000",
    secondaryColor: "#000",
    primaryFont: "Roboto",
    secondaryFont: "Open Sans",
  }));
  const [popup, setPopup] = useState(() => ({
    backgroundColor:"#fff",
    color:"#000000",
    iconColor:"#5230f9",
    shadowColor:"#000000",
    transparency:60,
    blur:4,
    anchorx:-2,
    anchory:-2,
    cornerRadius:3
  }));

  useEffect(() => {
    if (config) {
      setTheme({
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        primaryFont: config.primaryFont,
        secondaryFont: config.secondaryFont,
      });

      setPopup({
        backgroundColor: config.backgroundColor,
        color: config.color,
        iconColor: config.iconColor,
        shadowColor: config.shadowColor,
        transparency: config.transparency,
        blur: config.blur,
        anchorx: config.anchorx,
        anchory: config.anchory,
        cornerRadius: config.cornerRadius,
      });
    }
  }, [config]);


  const handleSave = () => {
    const formData = new FormData();
    formData.append("theme", JSON.stringify(theme));
    formData.append("popup", JSON.stringify(popup));

    fetcher.submit(formData, { method: "post" });
  };

  return (
    <s-page heading="Dynamic Store Locator" >
      <div className={styles.boxMap}>
        <div className={styles.boxInfo}>
          <div className={styles.search}>
            <i className="fa-solid fa-magnifying-glass"></i>
            <input 
              type="text" 
              placeholder="Enter Address or Zip code"
              value={searchAddress}
              onChange={(e) => {
                setSearchAddress(e.target.value)
              }}
            />
          </div>
          <div className={styles.attribute}>
            <div className={styles.allTag}>
              <i className="fa-solid fa-bars"></i>
              All Tag
            </div>
            <div className={styles.miles}>
              <select>
                <option value="5">5 miles</option>
                <option value="10">10 miles</option>
                <option value="25">25 miles</option>
                <option value="50">50 miles</option>
                <option value="100">100 miles</option>      
              </select>
            </div>
          </div>
          <div className={styles.information} ref={listRef}>
            {
              stores.map((store: any, index:number) => (
                <div
                  key={store.id || index}
                  className={`${styles.inforItem} ${selectedIndex === index ? styles.click : ""}`}
                  onClick={() => setSelectedIndex(index)}
                  style={{borderColor: theme.secondaryColor}}
                >
                  <h4 style={{color: theme.primaryColor, fontFamily:theme.primaryFont}}>{store.storeName}</h4>
                  <span style={{color: theme.primaryColor, fontFamily: theme.secondaryFont}}>{store.address}, {store.city}, {store.state}, {store.code}<br/></span>
                  <span style={{color: theme.secondaryColor}}>{store.phone}</span>
                </div>
              ))
            }     
          </div>
        </div>

        <div className={styles.map}>
          <MapGoogle 
            stores={stores ?? []} 
            selectedIndex={selectedIndex}  
            searchAddress={searchAddress}
            popupStyle = {popup}
          />
        </div>  
      </div>

      <div>
          <MapDesigner 
            onThemeChange={setTheme}
            onPopupChange={setPopup}
            onSave={handleSave}
            config={{theme, popup}}
          />
      </div>
    </s-page> 
  );
}
