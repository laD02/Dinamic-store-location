import { ActionFunctionArgs, Form, LoaderFunctionArgs, useFetcher, useNavigate} from "react-router";
import { useEffect, useRef, useState } from "react";
import prisma from "app/db.server";
import { SaveBar, useAppBridge } from '@shopify/app-bridge-react';
import { getLatLngFromAddress } from "app/utils/geocode.server";
import { authenticate } from "../shopify.server";

export async function loader({request}:LoaderFunctionArgs) {
    const filter = await prisma.attribute.findMany()
    return filter;
}

export async function action({request}: ActionFunctionArgs) {
    const formData = await request.formData();
    const contract: Record<string, string[]> = {};
    const urls = formData.getAll("contract") as string[];
    const address = formData.get("address")?.toString() ?? "";
    const location = await getLatLngFromAddress(address);
    const tagsString = formData.get("tags")?.toString() ?? "";
    const tags = tagsString ? JSON.parse(tagsString) : [];
    const { session } = await authenticate.admin(request);
    const shop = session?.shop;
    
    urls.forEach((url) => {
        const lower = url.toLowerCase();
        if (lower.includes("facebook")) {
        if (!contract.facebook) contract.facebook = [];
        contract.facebook.push(url);
        } else if (lower.includes("youtube")) {
        if (!contract.youtube) contract.youtube = [];
        contract.youtube.push(url);
        } else if (lower.includes("linkedin")) {
        if (!contract.linkedin) contract.linkedin = [];
        contract.linkedin.push(url);
        } else {
        // fallback cho social khác
        const key = "other";
        if (!contract[key]) contract[key] = [];
        contract[key].push(url);
        }
    });

    await prisma.store.create({
        data: {
            shop,
            storeName: formData.get("storeName")?.toString() ?? "",
            address: formData.get("address")?.toString() ?? "",
            city: formData.get("city")?.toString() ?? "",
            state: formData.get("state")?.toString() ?? "",
            code: formData.get("code")?.toString() ?? "",
            phone: formData.get("phone")?.toString() ?? "",
            image: formData.get("image")?.toString() ?? "",
            directions: formData.get("directions")?.toString() ?? "",
            contract, // đây là object chứa arrays
            source: formData.get('source')?.toString() ?? "Manual",
            visibility: formData.get('visibility')?.toString() ?? "",
            time:{
                mondayOpen: formData.get('Monday-open')?.toString() ?? "",
                mondayClose: formData.get('Monday-close')?.toString() ?? "",
                tuesdayOpen: formData.get('Tuesday-open')?.toString() ?? "",
                tuesdayClose: formData.get('Tuesday-close')?.toString() ?? "",
                fridayOpen: formData.get('Friday-open')?.toString() ?? "",
                fridayClose: formData.get('Friday-close')?.toString() ?? "",
                thursdayOpen: formData.get('Thursday-open')?.toString() ?? "",
                thursdayClose: formData.get('Thursday-close')?.toString() ?? "",
                wednesdayOpen: formData.get('Wednesday-open')?.toString() ?? "",
                wednesdayClose: formData.get('Wednesday-close')?.toString() ?? "",
                saturdayOpen: formData.get('Saturday-open')?.toString() ?? "",
                saturdayClose: formData.get('Saturday-close')?.toString() ?? "",
                sundayOpen: formData.get('Sunday-open')?.toString() ?? "",
                sundayClose: formData.get('Sunday-close')?.toString() ?? "",
            },
            tags,
            lat: location?.lat ?? null,
            lng: location?.lng ?? null,
        },
    });
    return {ok: true}
}

export default function AddLocation () {
    const navigate = useNavigate();
    const fetcher = useFetcher()
    const shopify = useAppBridge()
    const [click, setClick] = useState(false)
    const [countSocial, setCountSocial] = useState([{},{}]);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState(false)
    const initialFormRef = useRef<FormData | null>(null);
    const isDiscardingRef = useRef(false);
    const initialHoursRef = useRef<typeof dayStatus | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const isSaving = fetcher.state === "submitting" || fetcher.state === "loading";

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday','Friday', 'Saturday', 'Sunday'];

    const [dayStatus, setDayStatus] = useState(
        days.reduce((acc, day) => {
        acc[day] = { disabled: false, valueOpen: "9:00", valueClose: "17:00" };
        return acc;
        }, {} as Record<string, { disabled: boolean; valueOpen: string; valueClose: string }>)
    );

    useEffect(() => {
        if (isInitialized || !formRef.current) return;
        
        // Chờ React render xong form
        requestAnimationFrame(() => {
            if (formRef.current) {
                initialFormRef.current = new FormData(formRef.current);
                initialHoursRef.current = JSON.parse(JSON.stringify(dayStatus));
                setIsInitialized(true);
            }
        });
    }, [isInitialized]); 

    const checkDirtyAndToggleSaveBar = () => {
        if (isDiscardingRef.current || !isInitialized) return;
        if (!formRef.current || !initialFormRef.current) return;

        let dirty = false;

        // 1. Check FormData (BỎ hours)
        const current = new FormData(formRef.current);
        for (const [key, value] of current.entries()) {
            if (key.endsWith("-open") || key.endsWith("-close") || key === "image") continue;

            const initialValue = initialFormRef.current.get(key);
            const currentStr = String(value).trim();
            const initialStr = String(initialValue ?? "").trim();
            
            if (currentStr !== initialStr) {
                dirty = true;
                break;
            }
        }

        // 2. ⭐ Check HOURS từ STATE (không đọc từ FormData)
        if (!dirty && initialHoursRef.current) {
            const initialHours = JSON.stringify(initialHoursRef.current);
            const currentHours = JSON.stringify(dayStatus);
            if (currentHours !== initialHours) {
                dirty = true;
            }
        }

        // 3. Check IMAGE
        if (!dirty) {
            const hadInitialImage = initialFormRef.current.get("image");
            const hasCurrentImage = imageBase64;
            
            if (!!hadInitialImage !== !!hasCurrentImage || 
                (hadInitialImage && hasCurrentImage && hadInitialImage !== hasCurrentImage)) {
                dirty = true;
            }
        }

        if (dirty) {
            shopify.saveBar.show("location-save-bar");
        } else {
            shopify.saveBar.hide("location-save-bar");
        }
    };

    const handleClickDay = (day: string) => {
        setDayStatus(prev => {
            const isDisabled = prev[day].disabled;

            return {
                ...prev,
                [day]: {
                    ...prev[day],
                    disabled: !isDisabled,
                    valueOpen: !isDisabled ? "close" : "9:00",
                    valueClose: !isDisabled ? "close" : "17:00",
                }
            };
        });
    };

    useEffect(() => {
        if (!isInitialized) return;
        checkDirtyAndToggleSaveBar();
    }, [dayStatus, isInitialized]);

    // ✅ 3. CHECK DIRTY khi image thay đổi
    useEffect(() => {
        if (!isInitialized) return; // ⭐ Thêm check này
        checkDirtyAndToggleSaveBar();
    }, [imageBase64, isInitialized]);

    useEffect(() => {
        if (fetcher.data?.ok && formRef.current) {
            initialFormRef.current = new FormData(formRef.current);
            initialHoursRef.current = JSON.parse(JSON.stringify(dayStatus));
            shopify.toast.show('Store saved successfully!')
            shopify.saveBar.hide("location-save-bar");
        }
    }, [fetcher.data]);

    const handleVisibilityToggle = () => {
        setClick(prev => {
            const next = !prev;
            setTimeout(checkDirtyAndToggleSaveBar);
            return next;
        });
    };
    const handleAdd = () => {
        const newItem = {};
        setCountSocial([...countSocial, newItem]);
        setTimeout(checkDirtyAndToggleSaveBar);
    }

    const handleRemove = (index: number) => {
        const newArr =  countSocial.filter((_,i) => i !== index)
        setCountSocial(newArr)
        setTimeout(checkDirtyAndToggleSaveBar);
    }

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click(); // Kích hoạt input file
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Hiển thị preview
            const imageUrl = URL.createObjectURL(file);
            setPreview(imageUrl);

            // Đọc file thành base64
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageBase64(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
   

    const handleSubmit = () => {
        if (!formRef.current) return;

        const requiredFields = ["storeName", "address", "city", "state", "code"];
        const emptyFields = requiredFields.filter((name) => {
            const el = formRef.current!.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement;
            return !el?.value?.trim();
        });

        if (emptyFields.length > 0) {
            setError(true);
            return;
        }

        setError(false);
        fetcher.submit(formRef.current, { method: "post" });
    };

    const handleDiscard = () => {
        if (!formRef.current || !initialFormRef.current) return;

        isDiscardingRef.current = true;

        // ✅ Reset về giá trị ban đầu thay vì reset rỗng
        const form = formRef.current;
        
        // Restore từng field về giá trị initial
        for (const [key, value] of initialFormRef.current.entries()) {
            const element = form.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement;
            if (element && key !== "image") {
                element.value = String(value);
            }
        }

        // Reset image
        const initialImage = initialFormRef.current.get("image")?.toString();
        setPreview(initialImage || null);
        setImageBase64(initialImage || null);
        
        // Reset visibility
        const initialVisibility = initialFormRef.current.get("visibility")?.toString();
        setClick(initialVisibility === "visible");
        
        // Reset social media - Đếm số contract URLs ban đầu
        const initialContracts = initialFormRef.current.getAll("contract");
        const initialCount = Math.max(initialContracts.length, 2); // Ít nhất 2
        setCountSocial(Array(initialCount).fill({}));
        
        // Reset hours về initial
        if (initialHoursRef.current) {
            setDayStatus(JSON.parse(JSON.stringify(initialHoursRef.current)));
        }

        setError(false);

        requestAnimationFrame(() => {
            shopify.saveBar.hide("location-save-bar");
            isDiscardingRef.current = false;
        });
    };
    return (
        <s-page heading="Dynamic Store Locator">
            <SaveBar id="location-save-bar">
                <button
                    variant="primary"
                    onClick={() => handleSubmit()}
                    loading={isSaving ? "true" : undefined}
                >
                    Save
                </button>

                <button
                    onClick={() => {
                        handleDiscard()
                    }}
                    disabled = {isSaving}
                >
                    Discard
                </button>
            </SaveBar>
            <s-stack direction="inline" justifyContent="space-between" paddingBlock="large">
                <s-stack direction="inline" gap="small-100" alignItems="center">
                    <s-box>
                        <s-clickable 
                            background="strong" 
                            borderRadius="small-100" 
                            blockSize="50%"
                            onClick={() => navigate(-1)}
                            padding="small-300"
                        >
                            <s-icon type="arrow-left"/>
                        </s-clickable>
                    </s-box>
                    <s-text type="strong">Location Editor</s-text>
                    <s-box>
                        {
                            click ?
                            <s-clickable onClick={handleVisibilityToggle}>
                                <s-badge tone="success">
                                    <s-stack direction="inline" alignItems="center">
                                        <s-icon type="eye-check-mark"/>
                                        visible
                                    </s-stack>
                                </s-badge>
                            </s-clickable>
                            :
                            <s-clickable onClick={handleVisibilityToggle}>
                                <s-badge >
                                    <s-stack direction="inline" alignItems="center">
                                        <s-icon type="eye-check-mark" tone="info"/>
                                        hidden
                                    </s-stack>
                                </s-badge>
                            </s-clickable>
                        }
                    </s-box>
                </s-stack>
            </s-stack>
            
            <s-stack>
                <Form method="post" ref={formRef}>
                <input
                    type="hidden"
                    name="visibility"
                    value={click ? "visible" : "hidden"}
                />
                <s-stack gap="large-100">
                    <s-stack background="base" padding="small-200" borderRadius="large-100" borderStyle="solid" borderColor="subdued">
                        <s-stack padding="small-200">
                            <s-stack direction="inline" justifyContent="space-between">
                                <s-text type="strong">Location Information</s-text>
                                <s-badge tone="info">Manual</s-badge>                               
                            </s-stack>
                            <s-paragraph >Customize your location information</s-paragraph>
                        </s-stack>
                        <s-stack padding="small" gap="small-200">
                            <s-box>
                                <s-text-field 
                                    label="Location Name"
                                    name = "storeName"
                                    error={ error === true ? "Location name is required" : ""}
                                    required       
                                    defaultValue=""   
                                    onInput={checkDirtyAndToggleSaveBar}                       
                                />
                            </s-box>
                            <s-box>
                                <s-text-field 
                                    label="Address"
                                    name = "address"
                                    error={error === true ? "Address line 1 is required" : ""}
                                    required       
                                    defaultValue=""      
                                    onInput={checkDirtyAndToggleSaveBar}                       
                                />
                            </s-box>
                            <s-stack direction="inline" justifyContent="space-between" gap="small-100">
                            
                                <s-box inlineSize="32%">
                                    <s-text-field 
                                        label="City"
                                        name="city"
                                        error={ error === true ? "City is required" : ""}
                                        required
                                        defaultValue=""
                                        onInput={checkDirtyAndToggleSaveBar}
                                    />
                                </s-box>
                            
                                <s-box inlineSize="32%">
                                    <s-select label="State" name="state" required error={error === true ? "State is required" : ""} onChange={checkDirtyAndToggleSaveBar}>
                                        <s-option value="AL">AL</s-option>
                                        <s-option value="AZ">AZ</s-option>
                                        <s-option value="AS">AS</s-option>
                                        <s-option value="AR">AR</s-option>
                                    </s-select>
                                </s-box>
                                
                                <s-box inlineSize="32%">
                                    <s-text-field 
                                        label="Zip Code"
                                        name="code"
                                        error={error === true ? "Zip code is required" : ""}
                                        required
                                        defaultValue=""
                                        onInput={checkDirtyAndToggleSaveBar}
                                    />

                                </s-box>
                            </s-stack>
                            <s-stack direction="inline" justifyContent="space-between" >
                            
                                <s-box inlineSize="49%">
                                    <s-text-field 
                                        label="Phone Number"
                                        name="phone"
                                        defaultValue=""
                                        onInput={checkDirtyAndToggleSaveBar}
                                    />
                                </s-box>
                                
                                <s-box inlineSize="49%">
                                    <s-text-field 
                                        label="Website"
                                        name="url"
                                        defaultValue=""
                                        onInput={checkDirtyAndToggleSaveBar}
                                    />
                                </s-box>
                            </s-stack>
                            
                            <s-text-area 
                                label="Direction"
                                name="directions"
                                defaultValue=""
                                onInput={checkDirtyAndToggleSaveBar}
                            />
                        </s-stack>
                    </s-stack>
                    <s-stack background="base" padding="small-200" borderRadius="large-100" borderStyle="solid" borderColor="subdued">
                        <s-stack padding="small-200">
                            <s-stack direction="inline" justifyContent="space-between">
                                <s-text type="strong">Social Media</s-text>
                                <s-button icon="plus-circle" onClick={() => handleAdd()}>Add Social Media</s-button>
                            </s-stack>
                            <s-paragraph>Customize your location information</s-paragraph>
                        </s-stack>
                        <s-stack paddingBlock="small-200" paddingInlineStart="small">
                            {
                                countSocial.map((item, index) => (
                                    <s-stack direction="inline" justifyContent="start" gap="small-200" alignItems="center" key = {index} >
                                        <s-box inlineSize="33%">
                                            <s-select >
                                                <s-option value="linkedin">LinkedIn</s-option>
                                                <s-option value="youtube">Youtube</s-option>
                                                <s-option value="facebook">Facebook</s-option>
                                            </s-select>
                                        </s-box>
                                        <s-box inlineSize="33%">
                                            <s-text-field 
                                                name="contract"
                                                defaultValue=""
                                                onInput={checkDirtyAndToggleSaveBar}
                                            />
                                        </s-box>
                                        <s-button icon="delete" onClick={() => handleRemove(index)}></s-button>
                                    </s-stack>
                                ))
                            }
                            
                        </s-stack>
                    </s-stack>
                    <s-stack background="base" padding="base" borderRadius="large-100" borderStyle="solid" borderColor="subdued">
                        <s-box>
                            <s-text type="strong">Hours of Operation</s-text>
                        </s-box>
                        <s-stack paddingInline="small">
                            <table>
                                <tbody>
                                    <tr>
                                        <td></td>
                                        <td align="center">Open</td>
                                        <td align="center">Close</td>
                                        <td></td>
                                    </tr>                       
                                    {days.map((item) => (
                                        <tr>
                                            <td>{item}</td>
                                            <td>
                                                <s-text-field
                                                    name={`${item}-open`}
                                                    value={dayStatus[item].valueOpen}
                                                    readOnly={dayStatus[item].disabled}
                                                    onInput={(e: any) =>{
                                                        setDayStatus(prev => ({
                                                        ...prev,
                                                        [item]: { ...prev[item], valueOpen: e.target.value }
                                                        }))
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <s-text-field
                                                    name={`${item}-close`}
                                                    value={dayStatus[item].valueClose}
                                                    readOnly={dayStatus[item].disabled}
                                                    onInput={(e: any) =>{
                                                        setDayStatus(prev => ({
                                                        ...prev,
                                                        [item]: { ...prev[item], valueClose: e.target.value }
                                                        }))
                                                    }}
                                                />
                                            </td>
                                            <td>
                                                <s-button icon="eye-check-mark" variant="tertiary" onClick={() => handleClickDay(item)}></s-button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </s-stack>
                    </s-stack>   
                    <s-stack background="base" padding="base" borderRadius="large-100" borderStyle="solid" borderColor="subdued">
                        <s-box>
                            <s-text type="strong">Add a logo for this location</s-text>                                          
                            <s-paragraph>Customize your location information</s-paragraph>  
                        </s-box>
                        <s-stack direction="inline" justifyContent="space-between" paddingBlock="small-200" alignItems="center" paddingInline="small">
                            <s-stack background="subdued" paddingInline="large-500" borderStyle="dashed" borderWidth="small" borderRadius="large-200" paddingBlock="large-300" alignItems="center" justifyContent="center" direction="block" inlineSize="100%">
                                {preview ? (
                                    <s-stack justifyContent="center" alignItems="center">
                                        <s-box inlineSize="60px" blockSize="60px">
                                            <s-image
                                                src={preview} 
                                                alt="preview" 
                                                objectFit="cover"
                                                loading="lazy"
                                            />
                                        </s-box>
                                        <s-box>
                                            <s-clickable
                                                onClick={ (e)=> {
                                                    e.stopPropagation();
                                                    setPreview(null) 
                                                    setImageBase64(null); 
                                                }}
                                            >
                                                <s-icon type="x"/>
                                            </s-clickable>
                                        </s-box>
                                    </s-stack>
                                        
                                ) : (
                                    <s-stack alignItems="center">
                                        <s-button onClick={() => handleClick()}>Add file</s-button>
                                        <s-paragraph>Accepts .gif, .jpg, .png and .svg</s-paragraph>
                                    </s-stack>          
                                )}
                            </s-stack>
                            <input
                                ref={fileInputRef}
                                id="upload-file"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: "none" }}
                            />
                            <input type="hidden" name="image" value={imageBase64 ?? ""} />
                        </s-stack>
                    </s-stack>
                </s-stack>
                </Form>
            </s-stack>
        </s-page>
    );
}