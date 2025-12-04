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
  const stores = await prisma.store.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
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
  const [leftWidth, setLeftWidth] = useState<number>(49);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const [theme, setTheme] = useState(defaultTheme);
  const [popup, setPopup] = useState(defaultPopup);

  const savedConfigRef = useRef({
    theme: defaultTheme,
    popup: defaultPopup
  });

  useEffect(() => {
    if (actionData?.ok) {
      shopify.toast.show('Map designer edited successfully!')
    }
  }, [actionData]);

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

      savedConfigRef.current = {
        theme: loadedTheme,
        popup: loadedPopup
      };

      setTheme(loadedTheme);
      setPopup(loadedPopup);
    }
  }, [config]);

  const handleReset = () => {
    setTheme(savedConfigRef.current.theme);
    setPopup(savedConfigRef.current.popup);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Giới hạn từ 30% đến 80%
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
  }, [isResizing]);

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
      <h2>Map Designer</h2>
      <div 
        ref={containerRef}
        style={{ 
          display: 'flex', 
          gap: '0px',
          position: 'relative',
          width: '100%',
          userSelect: isResizing ? 'none' : 'auto'
        }}
      >
        {/* Cột bên trái */}
        <div 
          style={{
            width: `${leftWidth}%`,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative'
          }}
        >
          <s-stack>
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
          </s-stack>  
          
          <s-stack padding="base" background="base" gap="small-500" borderRadius="large-100" borderWidth="small">
            {/* <s-search-field 
              placeholder="Enter Address or Zip code"
              value={searchAddress}
              onInput={(e) => {
                const target = e.target as any;
                setSearchAddress(target.value)
              }}
            /> */}
        
            {/* <div className={styles.information} ref={listRef}> */}
              {/* {
                search.map((store: any, index: number) => ( */}
                  <div
                    // key={store.id || index}
                    // className={`${styles.inforItem} ${selectedIndex === index ? styles.click : ""}`}
                    className={styles.inforItem}
                    // onClick={() => setSelectedIndex(index)}
                    style={{border: `1px solid ${theme.secondaryColor}`}}
                  >
                    <h4 style={{color: theme.primaryColor, fontFamily: theme.primaryFont, whiteSpace: "normal", wordBreak: "break-word"}}>Trường Đại học Sư phạm Thái Nguyên</h4>
                    <p style={{color: theme.primaryColor, fontFamily: theme.secondaryFont}}>20 Lương Ngọc Quyến, Phường Phan Đình Phùng, Thành phố Thái Nguyên, Thái Nguyên, Việt Nam<br/></p>
                    <p style={{color: theme.secondaryColor}}>02083902903</p>
                    <s-stack direction="inline" justifyContent="start" gap="small-500">
                      {/* {
                        (store.tags || []).map((item: any, index: any) => ( */}
                          {/* <s-badge tone="info">
                            <text style={{fontSize:'6px'}}>qkjwnf</text>
                          </s-badge> */}
                        {/* ))
                      } */}
                    </s-stack>
                  </div>
                {/* ))
              }      */}
            {/* </div> */}
          </s-stack>
        </div>

        {/* Thanh kéo resize */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            width: '16px',
            cursor: 'col-resize',
            // background: isResizing ? '#0066ff' : 'transparent',
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
              // width: '4px',
              // height: '40px',
              background: '#ddd',
              borderRadius: '2px',
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* Cột bên phải - Map */}
        <div 
          style={{
            width: `${100 - leftWidth}%`,
            flexShrink: 0
          }}
        >
          <MapGoogle 
            stores={stores ?? []} 
            selectedIndex={selectedIndex}  
            searchAddress={searchAddress}
            popupStyle={popup}
          />
        </div>
      </div>

      <s-stack alignItems="center" paddingBlock="base">
        <s-text>
          Learn more about <s-link href="https://www.h1-apps.com/"> Review section.</s-link>
        </s-text>
      </s-stack>
    </s-page> 
  );
}