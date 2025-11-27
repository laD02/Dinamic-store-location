// app/routes/app.help-center.tsx
import { ActionFunctionArgs, Form, LoaderFunctionArgs, useActionData, useLoaderData } from "react-router";
import styles from "../css/mapDesigner.module.css"
import { useEffect, useMemo, useRef, useState } from "react";
import prisma from "app/db.server";
import 'leaflet/dist/leaflet.css';
import MapGoogle from "../component/map";
import MapDesigner from "../component/mapDesigner";
import { useAppBridge } from "@shopify/app-bridge-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const stores = await prisma.store.findMany();
  const config = await prisma.style.findFirst()
  const googleMapsApiKey = process.env.GOOGLE_MAP_KEY

  return { stores, config, googleMapsApiKey };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const theme = JSON.parse(formData.get("theme") as string);
  const popup = JSON.parse(formData.get("popup") as string);

  const exist = await prisma.style.findFirst();

  if (!exist) {
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
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const { stores, config } = useLoaderData<typeof loader>();
  const [searchAddress, setSearchAddress] = useState<string>("");
  const listRef = useRef<HTMLDivElement>(null);
  const actionData = useActionData<typeof action>();
  const shopify = useAppBridge()

  // Giá trị mặc định
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

  // State hiện tại
  const [theme, setTheme] = useState(defaultTheme);
  const [popup, setPopup] = useState(defaultPopup);

  // Ref để lưu giá trị đã save (từ database)
  const savedConfigRef = useRef({
    theme: defaultTheme,
    popup: defaultPopup
  });

  useEffect(() => {
        if (actionData?.ok) {
          shopify.toast.show('Map designer edited successfully!')
        }
    }, [actionData]);

  // Load config từ database
  useEffect(() => {
    if (config) {
      const loadedTheme = {
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        primaryFont: config.primaryFont,
        secondaryFont: config.secondaryFont,
      };

      const loadedPopup = {
        backgroundColor: config.backgroundColor,
        color: config.color,
        iconColor: config.iconColor,
        shadowColor: config.shadowColor,
        transparency: config.transparency,
        blur: config.blur,
        anchorx: config.anchorx,
        anchory: config.anchory,
        cornerRadius: config.cornerRadius,
      };

      // Lưu vào ref
      savedConfigRef.current = {
        theme: loadedTheme,
        popup: loadedPopup
      };

      // Set state
      setTheme(loadedTheme);
      setPopup(loadedPopup);
    }
  }, [config]);

  // Hàm reset về giá trị đã lưu
  const handleReset = () => {
    setTheme(savedConfigRef.current.theme);
    setPopup(savedConfigRef.current.popup);
  };

  const search = useMemo(() => {
    return stores.filter(stores => {
      const matchesSearch =
      stores.address.toLowerCase().includes(searchAddress.toLowerCase()) ||
      stores.code.toLowerCase().includes(searchAddress.toLowerCase())

      return matchesSearch
    })
  }, [stores, searchAddress])

  return (
    <s-page heading="Dynamic Store Locator" >
      <div className={styles.boxMap}>
        <div className={styles.boxInfo}>
          <s-search-field 
            placeholder="Enter Address or Zip code"
            value={searchAddress}
            onInput={(e) => {
              const target = e.target as any;
              setSearchAddress(target.value)
            }}
          />
          <s-stack direction="inline" justifyContent="space-between" gap="small">
            <s-stack direction="inline" alignItems="center" background="strong" borderRadius="large" paddingInline="small">   
              <s-box>
                <s-icon type="menu" />
              </s-box>
              <s-box>
                <s-text>All Tag</s-text>       
              </s-box>
            </s-stack>
            <s-stack>
              <s-select>
                <s-option value="5">5 miles</s-option>
                <s-option value="10">10 miles</s-option>
                <s-option value="25">25 miles</s-option>
                <s-option value="50">50 miles</s-option>
                <s-option value="100">100 miles</s-option>      
              </s-select>
            </s-stack>
          </s-stack>
          <div className={styles.information} ref={listRef}>
            {
              search.map((store: any, index: number) => (
                <div
                  key={store.id || index}
                  className={`${styles.inforItem} ${selectedIndex === index ? styles.click : ""}`}
                  onClick={() => setSelectedIndex(index)}
                  style={{borderColor: theme.secondaryColor}}
                >
                  <h4 style={{color: theme.primaryColor, fontFamily: theme.primaryFont}}>{store.storeName}</h4>
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
            popupStyle={popup}
          />
        </div>  
      </div>

      <Form 
        method="post" 
        data-save-bar
        onReset={(e) => {
          e.preventDefault();
          handleReset();
        }}
      >
        <MapDesigner 
          onThemeChange={setTheme}
          onPopupChange={setPopup}
          config={{theme, popup}}
        />

        <input type="hidden" name="theme" value={JSON.stringify(theme)}/>
        <input type="hidden" name="popup" value={JSON.stringify(popup)}/>
      </Form>
      <s-stack alignItems="center" paddingBlock="base">
        <p>
          ©2025
          <s-link href="https://www.h1-apps.com/"> H1 Web Development.  </s-link>
          All Rights Reserved.
        </p>
      </s-stack>
    </s-page> 
  );
}