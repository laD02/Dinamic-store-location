import { ActionFunctionArgs, Form, LoaderFunctionArgs, useActionData, useLoaderData, useNavigate, useSubmit } from "react-router";
import styles from "../css/addLocation.module.css"
import { useEffect, useRef, useState } from "react";
import prisma from "app/db.server";
import { useAppBridge } from '@shopify/app-bridge-react';
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
    const submit = useSubmit();
    const navigate = useNavigate();
    const filter = useLoaderData()
    const actionData = useActionData<typeof action>();
    const [click, setClick] = useState(false)
    const [countSocial, setCountSocial] = useState([{},{}]);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState(false)
    const [initialVisibility, setInitialVisibility] = useState<"visible" | "hidden">("hidden");
    const [formKey, setFormKey] = useState(0);
    const [tags, setTags] = useState<string[]>([])

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday','Friday', 'Saturday', 'Sunday'];

    const [dayStatus, setDayStatus] = useState(
        days.reduce((acc, day) => {
        acc[day] = { disabled: false, valueOpen: "9:00", valueClose: "17:00" };
        return acc;
        }, {} as Record<string, { disabled: boolean; valueOpen: string; valueClose: string }>)
    );

    const [initialDayStatus] = useState(
        days.reduce((acc, day) => {
            acc[day] = { disabled: false, valueOpen: "9:00", valueClose: "17:00" };
            return acc;
        }, {} as Record<string, { disabled: boolean; valueOpen: string; valueClose: string }>)
    );

    const handleClickDay = (day: string) => {
        setDayStatus(prev => {
            const isDisabled = prev[day].disabled;
            const willBeDisabled = !isDisabled;
            
            return {
                ...prev,
                [day]: {
                    disabled: willBeDisabled,
                    valueOpen: willBeDisabled ? "close" : "",
                    valueClose: willBeDisabled ? "close" : ""
                }
            };
        });
        
        // Trigger save bar sau khi state update
        setTimeout(() => {
            if (!formRef.current) return;

            const openInput = formRef.current.elements.namedItem(`${day}-open`) as HTMLInputElement;
            const closeInput = formRef.current.elements.namedItem(`${day}-close`) as HTMLInputElement;

            // Luôn dispatch để Save Bar biết có thay đổi
            [openInput, closeInput].forEach(input => {
                if (input) {
                    input.dispatchEvent(new Event("input", { bubbles: true }));
                    input.dispatchEvent(new Event("change", { bubbles: true }));
                }
            });

            // → XÓA TOÀN BỘ ĐOẠN KIỂM TRA allDaysBackToInitial, form.reset() ĐI!
            // → Không cần ẩn Save Bar ở đây → Discard sẽ lo!
        }, 0);
    };
    
    let shopify;
        try {
            shopify = useAppBridge();
        } catch (error) {
            console.warn('App Bridge not ready:', error);
            shopify = null;
        }

    useEffect(() => {
        if (actionData?.ok && shopify) {
        shopify.toast.show('Store saved successfully!')
        }
    }, [actionData, shopify]);
    

    const handleVisibilityToggle = () => {
        const newClick = !click;
        setClick(newClick);

        if (!formRef.current) return;

        const input = formRef.current.elements.namedItem("visibility") as HTMLInputElement;
        if (!input) return;

        const newVisibility = newClick ? "visible" : "hidden";
        input.value = newVisibility;

        // CHỈ THAY ĐỔI ĐOẠN NÀY – XÓA form.reset() ĐI!
        if (newVisibility === initialVisibility) {
            // KHÔNG dùng form.reset() → các ô khác KHÔNG bị mất dữ liệu
            // Thay vào đó: dispatch 1 event "giả" để Shopify re-check form state
            const fakeEvent = new Event("input", { bubbles: true });
            document.body.dispatchEvent(fakeEvent);
            // Hoặc đơn giản hơn: không làm gì cả → Shopify vẫn tự nhận ra (thường đủ)
            return;
        }

        // Nếu khác giá trị ban đầu → dispatch bình thường
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const handleAdd = () => {
        const newItem = {};
        setCountSocial([...countSocial, newItem]);
    }

    const handleRemove = (index: number) => {
        const newArr =  countSocial.filter((_,i) => i !== index)
        setCountSocial(newArr)
    }

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click(); // Kích hoạt input file
    };

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
    const triggerSaveBar = () => {
        if (!formRef.current) return;
        
        const tagsInput = formRef.current.elements.namedItem("tags") as HTMLInputElement;
        if (tagsInput) {
            tagsInput.dispatchEvent(new Event("input", { bubbles: true }));
            tagsInput.dispatchEvent(new Event("change", { bubbles: true }));
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
        submit(formRef.current, { method: "post" });
    };

    return (
        <s-page heading="Dynamic Store Locator">
            <s-stack direction="inline" justifyContent="space-between" paddingBlock="large">
                <s-stack direction="inline" gap="small-100" alignItems="center">
                    <s-box>
                        <s-clickable 
                            background="strong" 
                            borderRadius="small-100" 
                            blockSize="50%"
                            onClick={() => navigate("/app")}
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
                <Form 
                    key={formKey}
                    ref={formRef} 
                    className={styles.information} 
                    method="post" 
                    data-save-bar
                    onSubmit={(e) => {
                        e.preventDefault(); // prevent default submit
                        handleSubmit();     // dùng hàm validate + submit chung
                    }}
                    onReset={() => {
                        setPreview(null)
                        setClick(false)
                        setDayStatus(
                            days.reduce((acc, day) => {
                                acc[day] = { disabled: false, valueOpen: "9:00", valueClose: "17:00" };
                                return acc;
                            }, {} as Record<string, { disabled: boolean; valueOpen: string; valueClose: string }>)
                        );
                        setTags([])
                        setFormKey(prev => prev + 1);
                    }}
                >
                    <input key={click ? "visible" : "hidden"} type="hidden" name="visibility" defaultValue={click ? "visible" : "hidden"} />
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
                                    />
                                </s-box>
                                <s-box>
                                    <s-text-field 
                                        label="Address"
                                        name = "address"
                                        error={error === true ? "Address line 1 is required" : ""}
                                        required       
                                        defaultValue=""                             
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
                                        />
                                    </s-box>
                                
                                    <s-box inlineSize="32%">
                                        <s-select label="State" name="state" required error={error === true ? "State is required" : ""}>
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
                                        />

                                    </s-box>
                                </s-stack>
                                <s-stack direction="inline" justifyContent="space-between" >
                                
                                    <s-box inlineSize="49%">
                                        <s-text-field 
                                            label="Phone Number"
                                            name="phone"
                                            defaultValue=""
                                        />
                                    </s-box>
                                    
                                    <s-box inlineSize="49%">
                                        <s-text-field 
                                            label="Website"
                                            name="url"
                                            defaultValue=""
                                        />
                                    </s-box>
                                </s-stack>
                                
                                <s-text-area 
                                    label="Direction"
                                    name="directions"
                                    defaultValue=""
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
                                                <s-select>
                                                    <s-option value="linkedin">LinkedIn</s-option>
                                                    <s-option value="youtube">Youtube</s-option>
                                                    <s-option value="facebook">Facebook</s-option>
                                                </s-select>
                                            </s-box>
                                            <s-box inlineSize="33%">
                                                <s-text-field 
                                                    name="contract"
                                                    defaultValue=""
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
                                                        key={`${item}-open-${formKey}`} 
                                                        name={`${item}-open`}
                                                        value={dayStatus[item].valueOpen}
                                                        readOnly={dayStatus[item].disabled}
                                                        onChange={(e: any) =>
                                                            setDayStatus(prev => ({
                                                            ...prev,
                                                            [item]: { ...prev[item], valueOpen: e.target.value }
                                                            }))
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <s-text-field
                                                        key={`${item}-close-${formKey}`} 
                                                        name={`${item}-close`}
                                                        value={dayStatus[item].valueClose}
                                                        readOnly={dayStatus[item].disabled}
                                                        onChange={(e: any) =>
                                                            setDayStatus(prev => ({
                                                            ...prev,
                                                            [item]: { ...prev[item], valueClose: e.target.value }
                                                            }))
                                                        }
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
                                
                                {/* <s-box inlineSize="48%">We support .gif, .jpg, .png, and .svg files up to 3MB</s-box> */}
                            </s-stack>
                        </s-stack>
                        {/* <s-stack background="base" padding="base" borderRadius="large-100" borderStyle="solid" borderColor="subdued">
                            <s-stack direction="inline" justifyContent="space-between">
                                <s-box >
                                    <s-text type="strong">Tags</s-text>
                                    <s-paragraph color="subdued">Add tags to help filter your location</s-paragraph>
                                </s-box>
                                <s-stack>
                                    <s-button commandFor="tags" icon="product">Add Tags</s-button>
                                    <s-popover id="tags">
                                        <s-stack direction="block" alignItems="center">
                                            {Object.values(filter).map((item: any, index: number) => {
                                                const label = String(item.filter)
                                                const selected = tags.includes(label)
                                                return (
                                                    <s-button 
                                                        key={index} 
                                                        variant="tertiary" 
                                                        disabled={selected} 
                                                        onClick={() => {
                                                            setTags([...tags, label ])
                                                            setTimeout(() => {
                                                                triggerSaveBar();
                                                            }, 0);
                                                        }}>
                                                        {item.filter}
                                                    </s-button>
                                                )
                                            })}
                                        </s-stack>
                                    </s-popover>
                                </s-stack>
                            </s-stack>
                            <s-stack direction="inline" justifyContent="start" gap="base" paddingBlockStart="small" paddingInline="small">
                                {
                                    tags.map((item: any, index: any) => (
                                        <s-box key={index} background="subdued" borderRadius="small" paddingInlineStart="small-200">
                                            {item}
                                            <s-button 
                                                variant="tertiary" 
                                                onClick={() => {
                                                    setTags(prev => prev.filter((_, i) => i !== index))
                                                    setTimeout(() => {
                                                        triggerSaveBar();
                                                    }, 0);
                                                }}>
                                                <s-icon type="x" size="small"/>
                                            </s-button>
                                        </s-box>
                                    ))
                                }
                            </s-stack>
                            <input type="hidden" name="tags" value={JSON.stringify(tags)} />
                        </s-stack> */}
                    </s-stack>
                    {/* <div className={styles.shared}>
                         
                    </div> */}
                </Form>
                {/* <img src="/place2.jpg" alt="demo" className={styles.boxImage}/> */}
            </s-stack>
        </s-page>
    );
}