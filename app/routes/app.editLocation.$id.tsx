import { ActionFunctionArgs, Form, LoaderFunctionArgs, redirect, useActionData, useFetcher, useLoaderData, useNavigate, useNavigation, useSubmit } from "react-router";
import styles from "../css/addLocation.module.css"
import { useEffect, useRef, useState } from "react";
import prisma from "app/db.server";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getLatLngFromAddress } from "app/utils/geocode.server";

export async function loader({params}:LoaderFunctionArgs) {
    const {id} = params;
    const filter = await prisma.attribute.findMany()
    const store = await prisma.store.findUnique({
        where: { id },
    });

  return {store, filter};
}

export async function action({ request, params }: ActionFunctionArgs) {
    const formData = await request.formData();
    const urls = formData.getAll("contract") as string[];
    const actionType = formData.get('actionType')
    const deleted = JSON.parse(formData.get("deleteContract")?.toString() || "[]") as string[];
    const { id } = params;
    const contract: Record<string, string[]> = {};
    const address = formData.get("address")?.toString() ?? ""
    const location = await getLatLngFromAddress(address)
    const tagsString = formData.get("tags")?.toString() ?? "";
    const tags = tagsString ? JSON.parse(tagsString) : [];

  // ✅ gom social, bỏ qua những cái nằm trong deleteContract
    urls.forEach((url, idx) => {
        const lower = url.toLowerCase();
        let key = "";

        if (lower.includes("facebook")) key = "facebook";
        else if (lower.includes("youtube")) key = "youtube";
        else if (lower.includes("linkedin")) key = "linkedin";
        else key = "other";

        const contractId = `${key}-${idx}`;
        if (deleted.includes(contractId)) return; // ✅ bỏ qua

        if (!contract[key]) contract[key] = [];
        contract[key].push(url);
    });

    if (actionType === "deleteId") {
        const id = formData.get("id") as string;
        await prisma.store.delete({ where: { id } });
        return redirect("/app?message=deleted");
    }

  // ✅ Cập nhật vào database
    await prisma.store.update({
        where: { id },
        data: {
            storeName: formData.get("storeName")?.toString() ?? "",
            address: formData.get("address")?.toString() ?? "",
            city: formData.get("city")?.toString() ?? "",
            state: formData.get("state")?.toString() ?? "",
            code: formData.get("code")?.toString() ?? "",
            phone: formData.get("phone")?.toString() ?? "",
            image: formData.get("image")?.toString() ?? "",
            directions: formData.get("directions")?.toString() ?? "",
            contract,
            source: formData.get("source")?.toString() ?? "Manual",
            visibility: formData.get("visibility")?.toString() ?? "",
            time: {
                mondayOpen: formData.get("Monday-open")?.toString() ?? "",
                mondayClose: formData.get("Monday-close")?.toString() ?? "",
                tuesdayOpen: formData.get("Tuesday-open")?.toString() ?? "",
                tuesdayClose: formData.get("Tuesday-close")?.toString() ?? "",
                wednesdayOpen: formData.get("Wednesday-open")?.toString() ?? "",
                wednesdayClose: formData.get("Wednesday-close")?.toString() ?? "",
                thursdayOpen: formData.get("Thursday-open")?.toString() ?? "",
                thursdayClose: formData.get("Thursday-close")?.toString() ?? "",
                fridayOpen: formData.get("Friday-open")?.toString() ?? "",
                fridayClose: formData.get("Friday-close")?.toString() ?? "",
                saturdayOpen: formData.get("Saturday-open")?.toString() ?? "",
                saturdayClose: formData.get("Saturday-close")?.toString() ?? "",
                sundayOpen: formData.get("Sunday-open")?.toString() ?? "",
                sundayClose: formData.get("Sunday-close")?.toString() ?? "",
            },
            tags,
            lat: location?.lat ?? null,
            lng: location?.lng ?? null,
        },
    });

    return {ok: true};
}


export default function EditLocation () {
    const fetcher = useFetcher()
    const {store, filter} = useLoaderData()
    const submit = useSubmit();
    const navigate = useNavigate();
    const [click, setClick] = useState(false)
    const [countSocial, setCountSocial] = useState<{}[]>([]);
    const [preview, setPreview] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [deleteContract, setDeleteContract] = useState<string[]>([]);
    const [error, setError] = useState(false)
    const actionData = useActionData<typeof action>();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const [initialVisibility, setInitialVisibility] = useState<"visible" | "hidden">("hidden");
    const [initialImage, setInitialImage] = useState<string | null>(null);
    const [tags, setTags] = useState<string[]>([])
    const [formData, setFormData] = useState(() => ({
        storeName: "",
        address:  "",
        city:  "",
        state:  "",
        code: "",
        phone: "",
        image: "",
        url: "",
        time: {
          mondayOpen: "",
          mondayClose: "",
          tuesdayOpen: "",
          tuesdayClose: "",
          wednesdayOpen: "",
          wednesdayClose: "",
          thursdayOpen: "",
          thursdayClose: "",
          fridayOpen: "",
          fridayClose: "",
          saturdayOpen: "",
          saturdayClose: "",
          sundayOpen: "",
          sundayClose: "",
        },
        tags: {},
        directions:  "",
        contract:  {} as Record<string, string[]>,
        source:  "",
        visibility:  ""
    }));
    const [formKey, setFormKey] = useState(0);

    let shopify;
    try {
        shopify = useAppBridge();
    } catch (error) {
        console.warn('App Bridge not ready:', error);
        shopify = null;
    }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday','Friday', 'Saturday', 'Sunday'];
    
    const [dayStatus, setDayStatus] = useState(
        days.reduce((acc, day) => {
        acc[day] = { disabled: false, valueOpen: "", valueClose: "" };
        return acc;
        }, {} as Record<string, { disabled: boolean; valueOpen: string; valueClose: string }>)
    );

    const [initialDayStatus, setInitialDayStatus] = useState(
        days.reduce((acc, day) => {
            acc[day] = { disabled: false, valueOpen: "", valueClose: "" };
            return acc;
        }, {} as Record<string, { disabled: boolean; valueOpen: string; valueClose: string }>)
    );

    useEffect(() => {
        if (store && store.time) {
            const loadedDayStatus = days.reduce((acc, day) => {
                const key = day.toLowerCase(); // Monday -> monday
                const openValue = store.time[`${key}Open`] || "";
                const closeValue = store.time[`${key}Close`] || "";
                
                acc[day] = {
                    disabled: openValue === "close" && closeValue === "close",
                    valueOpen: openValue,
                    valueClose: closeValue
                };
                return acc;
            }, {} as Record<string, { disabled: boolean; valueOpen: string; valueClose: string }>);
            
            setDayStatus(loadedDayStatus);
            setInitialDayStatus(loadedDayStatus);
        }
    }, [store]);

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
        
        setTimeout(() => {
            if (!formRef.current) return;
            
            // Tìm input của ngày đó
            const openInput = formRef.current.elements.namedItem(`${day}-open`) as HTMLInputElement;
            const closeInput = formRef.current.elements.namedItem(`${day}-close`) as HTMLInputElement;
            
            // Kiểm tra TẤT CẢ các ngày có trở về giá trị ban đầu không
            const allDaysBackToInitial = days.every(d => {
                const oInput = formRef.current!.elements.namedItem(`${d}-open`) as HTMLInputElement;
                const cInput = formRef.current!.elements.namedItem(`${d}-close`) as HTMLInputElement;
                return oInput?.value === initialDayStatus[d].valueOpen && 
                    cInput?.value === initialDayStatus[d].valueClose;
            });
            
            // Kiểm tra các field khác có thay đổi không
            const visibilityInput = formRef.current.elements.namedItem("visibility") as HTMLInputElement;
            const isVisibilityChanged = visibilityInput?.value !== initialVisibility;
            const isImageChanged = preview !== initialImage;
            
            if (allDaysBackToInitial && !isVisibilityChanged && !isImageChanged) {
                // Nếu TẤT CẢ về ban đầu -> reset form để ẩn save bar
                const fakeEvent = new Event("input", { bubbles: true });
                document.body.dispatchEvent(fakeEvent);
            } else {
                // Còn có thay đổi -> dispatch event để hiện/giữ save bar
                if (openInput) {
                    openInput.dispatchEvent(new Event("input", { bubbles: true }));
                    openInput.dispatchEvent(new Event("change", { bubbles: true }));
                }
                if (closeInput) {
                    closeInput.dispatchEvent(new Event("input", { bubbles: true }));
                    closeInput.dispatchEvent(new Event("change", { bubbles: true }));
                }
            }
        }, 50);
    };

    useEffect(() => {
        if (actionData?.ok && shopify) {
        shopify.toast.show('Store edited successfully!')
        }
    }, [actionData, shopify]);

    useEffect(() => {
        if (store) {
            const val = store.visibility === "visible" ? "visible" : "hidden";
            setClick(store.visibility === "visible");
            setInitialVisibility(val);
            setInitialImage(store.image || null);
        }
    }, [store]);

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
    // Thêm hàm riêng cho social media
    const handleSocialChange = (key: string, index: number, newValue: string) => {
        setFormData(prev => {
            const newContract = { ...prev.contract };
            if (newContract[key]) {
                const newValues = [...newContract[key]];
                newValues[index] = newValue;
                newContract[key] = newValues;
            }
            return { ...prev, contract: newContract };
        });
    };

    useEffect(() => {
        if (store) {
            setClick(store.visibility === "visible");
        }
    }, [store]);

    useEffect(() => {
        if (store) {
            // Reset toàn bộ formData về giá trị trong DB
            setFormData({
            storeName: store.storeName || "",
            address: store.address || "",
            city: store.city || "",
            state: store.state || "",
            code: store.code || "",
            phone: store.phone || "",
            image: store.image || "",
            url: store.url || "",
            time: store.time || {
                mondayOpen: "",
                mondayClose: "",
                tuesdayOpen: "",
                tuesdayClose: "",
                wednesdayOpen: "",
                wednesdayClose: "",
                thursdayOpen: "",
                thursdayClose: "",
                fridayOpen: "",
                fridayClose: "",
                saturdayOpen: "",
                saturdayClose: "",
                sundayOpen: "",
                sundayClose: "",
            },
            tags: store.tags || {},
            directions: store.directions || "",
            contract: store.contract || {},
            source: store.source || "",
            visibility: store.visibility || "",
            });

            // Reset các state phụ khác
            setClick(store.visibility === "visible");
            setCountSocial([]); // bỏ các dòng mới thêm tạm
            setPreview(store.image || null); // nếu có ảnh cũ thì hiện lại
            setImageBase64(store.image || null);
            setDeleteContract([]); // bỏ các dòng bị đánh dấu xóa tạm
            setTags(Array.isArray(store.tags) ? store.tags : []);
        }
    }, [store]);

    const handleDiscard = () => {
    if (!store) return;

    // 1. Khôi phục dayStatus từ store (rất quan trọng!)
    const loadedDayStatus = days.reduce((acc, day) => {
        const key = day.toLowerCase();
        const openValue = store.time[`${key}Open`] || "";
        const closeValue = store.time[`${key}Close`] || "";

        acc[day] = {
            disabled: openValue === "close" && closeValue === "close",
            valueOpen: openValue,
            valueClose: closeValue
        };
        return acc;
    }, {} as Record<string, { disabled: boolean; valueOpen: string; valueClose: string }>);

    setDayStatus(loadedDayStatus);
    setInitialDayStatus(loadedDayStatus);

    // 2. Khôi phục các state khác
    setClick(store.visibility === "visible");
    setPreview(store.image || null);
    setImageBase64(store.image || null);
    setDeleteContract([]);
    setCountSocial([]);
    setTags(Array.isArray(store.tags) ? store.tags : []);
    
    // 3. Khôi phục formData (nếu cần)
    setFormData({
        storeName: store.storeName || "",
        address: store.address || "",
        city: store.city || "",
        state: store.state || "",
        code: store.code || "",
        phone: store.phone || "",
        image: store.image || "",
        url: store.url || "",
        directions: store.directions || "",
        contract: store.contract || {},
        source: store.source || "Manual",
        visibility: store.visibility || "hidden",
        time: { ...store.time },
        tags: {...store.tags}
    });
    setFormKey(prev => prev + 1);


    // 4. QUAN TRỌNG: Không dùng form.reset() nữa!
    // Thay vào đó: dispatch một event giả để Shopify Save Bar biết form đã "sạch"
    setTimeout(() => {
        const fakeEvent = new Event("input", { bubbles: true });
        document.body.dispatchEvent(fakeEvent);
    }, 100);
};
    const handleSubmit = () => {
        const form = formRef.current;
        if (!form) return;

        // Check required fields
        const requiredFields = ["storeName", "address", "city", "state", "code"];
        const emptyFields = requiredFields.filter((name) => {
        const el = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement;
        return !el?.value.trim();
        });

        // Hidden input deleteContract
        let hidden = form.querySelector("input[name='deleteContract']") as HTMLInputElement;
        if (!hidden) {
        hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = "deleteContract";
        form.appendChild(hidden);
        }
        hidden.value = JSON.stringify(deleteContract ?? []);

        if (emptyFields.length > 0) {
            setError(true);
            return;
        }

        setError(false);

        // Submit form
        submit(form, { method: "post" });
    }

    const handleAdd = () => {
        const newItem = {};
        setCountSocial([...countSocial, newItem]);
    }

    const handleRemove = (index: number) => {
        const newArr =  countSocial.filter((_,i) => i !== index)
        setCountSocial(newArr)
    }

    const handleDelete = (id : string) => {
        const formData = new FormData()
        formData.append("actionType", "deleteId");
        formData.append("id", id);
        fetcher.submit(formData, { method: "post" });
    }

    const handleClick = () => {
        fileInputRef.current?.click(); // Kích hoạt input file
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const triggerSaveBar = () => {
        if (!formRef.current) return;
        
        const tagsInput = formRef.current.elements.namedItem("tags") as HTMLInputElement;
        if (tagsInput) {
            tagsInput.dispatchEvent(new Event("input", { bubbles: true }));
            tagsInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
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

    const handleRemoveImage = () => {
        setPreview(null);
        setImageBase64(null);

        // Trigger change event trên input hidden
        if (formRef.current) {
            const input = formRef.current.querySelector<HTMLInputElement>("input[name='image']");
            if (input) {
            input.value = "";
            const event = new Event("change", { bubbles: true });
            input.dispatchEvent(event);
            }
        }
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
                <s-stack direction="inline" justifyContent="space-between" gap="small-300">
                    <s-button
                        tone="critical"
                        commandFor="deleteTrash-modal"
                        >
                        Delete
                    </s-button>
                    <s-modal id="deleteTrash-modal" heading="Delete Location">
                        <s-text>
                            Are you sure you want to delete this store? This action cannot be undone.
                        </s-text>

                        <s-button
                            slot="secondary-actions"
                            variant="secondary"
                            commandFor="deleteTrash-modal"
                            command="--hide"
                        >
                            Cancel
                        </s-button>

                        <s-button
                            slot="primary-action"
                            variant="primary"
                            tone="critical"
                            commandFor="deleteTrash-modal"
                            command="--hide"
                            onClick={() => handleDelete(store.id)}
                        >
                            Delete 
                        </s-button>
                    </s-modal>
                </s-stack>
            </s-stack>

            <s-stack inlineSize="100%">
                <Form 
                    ref={formRef} 
                    className={styles.information} 
                    method="post" 
                    encType="multipart/form-data" 
                    data-save-bar
                    onSubmit={(e) => {
                        e.preventDefault(); // prevent default submit
                        handleSubmit();     // dùng hàm validate + submit chung
                    }}
                    onReset={handleDiscard}
                >
                    <input key={click ? "visible" : "hidden"} type="hidden" name="visibility" value={click ? "visible" : "hidden"} />
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
                                        defaultValue={formData.storeName}
                                    />
                                </s-box>
                                <s-box>
                                    <s-text-field 
                                        label="Address"
                                        name = "address"
                                        error={error === true ? "Address line 1 is required" : ""}
                                        required
                                        defaultValue={formData.address}
                                    />
                                </s-box>
                                <s-stack direction="inline" justifyContent="space-between" >
                                
                                    <s-box inlineSize="32%">
                                        <s-text-field 
                                            label="City"
                                            name="city"
                                            error={ error === true ? "City is required" : ""}
                                            required
                                            defaultValue={formData.city}
                                        />
                                    </s-box>
                                
                                    <s-box inlineSize="32%">
                                        <s-select label="State" name="state" required error={error === true ? "State is required" : ""} value={formData.state}>
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
                                            defaultValue={formData.code}
                                        />
                                    </s-box>
                                </s-stack>
                                <s-stack direction="inline" justifyContent="space-between" >
                                
                                    <s-box inlineSize="49%">
                                        <s-text-field 
                                            label="Phone Number"
                                            name="phone"
                                            defaultValue={formData.phone}
                                        />
                                    </s-box>
                                    
                                    <s-box inlineSize="49%">
                                        <s-text-field 
                                            label="Website"
                                            name="url"
                                            defaultValue={formData.url}
                                        />
                                    </s-box>
                                </s-stack>
                                
                                <s-text-area 
                                    label="Direction"
                                    name="directions"
                                    defaultValue={formData.directions}
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
                                (Object.entries(formData.contract) as [string, string[]][]).flatMap(([key, values]) =>
                                    values.map((value: string, index: number) => {
                                    const isDeleted = deleteContract.includes(`${key}-${index}`);
                                    return (
                                        <s-stack
                                            id={`social-${index}`}
                                            // className={`${styles.socialSection} ${isDeleted ? styles.unShow : ""}`}
                                            direction="inline" justifyContent="start" gap="small-200" alignItems="center"
                                            key={`${key}-${index}`}
                                            display={isDeleted ? "none" : "auto"}
                                        >
                                            <s-box inlineSize="33%">
                                                <s-select value={key}>
                                                    <s-option value="linkedin">LinkedIn</s-option>
                                                    <s-option value="youtube">Youtube</s-option>
                                                    <s-option value="facebook">Facebook</s-option>
                                                </s-select>
                                            </s-box>
                                            <s-box inlineSize="33%">
                                                <s-text-field 
                                                    name="contract"
                                                    defaultValue={value}
                                                    onInput={(e) => {
                                                        const target = e.target as any
                                                        handleSocialChange(key, index, target.value)
                                                    }}
                                                />
                                            </s-box>
                                            <s-button 
                                                icon="delete" 
                                                onClick={() => {
                                                    setDeleteContract((prev) => [...prev, `${key}-${index}`]);
                                                }}
                                            >   
                                            </s-button>
                                        </s-stack>
                                    );
                                    })
                                )
                                }

                                {
                                countSocial.map((item, index) => {
                                    return (
                                    <s-stack
                                        id={`social-${index}`}
                                        direction="inline" justifyContent="start" gap="small-200" alignItems="center"
                                        key={`new-${index}`}
                                    >
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
                                                />
                                            </s-box>
                                            <s-button icon="delete" onClick={() => handleRemove(index)}></s-button>
                                    </s-stack>
                                    );
                                })
                                }
                            </s-stack>
                        </s-stack>
                        <s-stack background="base" padding="base" borderRadius="large-100" borderStyle="solid" borderColor="subdued">
                            <s-box>
                                <s-text type="strong" >Hours of Operation</s-text>
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
                                            // <s-stack
                                            // direction="inline"
                                            // justifyContent="space-between"
                                            // paddingBlockEnd="small-200"
                                            // key={item}
                                            // >
                                            <tr>
                                                <td>{item}</td>
                                                <td>
                                                    <s-text-field
                                                        key={`${item}-open-${formKey}`} 
                                                        name={`${item}-open`}
                                                        value={dayStatus[item].valueOpen}
                                                        defaultValue={store.time[`${item.toLowerCase()}Open`] || ""} // thêm dòng này
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
                                                        name={`${item}-close`}
                                                        key={`${item}-close-${formKey}`} 
                                                        value={dayStatus[item].valueClose}
                                                        defaultValue={store.time[`${item.toLowerCase()}Close`] || ""} // thêm dòng này
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
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
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
                                <input type="hidden" name="image" value={imageBase64 ?? ""} onChange={handleChange}/>
                                {/* <s-box inlineSize="48%">We support .gif, .jpg, .png, and .svg files up to 3MB</s-box> */}
                            </s-stack>
                        </s-stack>
                        <s-stack background="base" padding="base" borderRadius="large-100" borderStyle="solid" borderColor="subdued">
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
                                                    setTags((prev: any) => prev.filter((_: any, i: any) => i !== index))
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
                        </s-stack>
                    </s-stack>   
                </Form>
                {/* <img src="/place2.jpg" alt="demo" className={styles.boxImage}/> */}
            </s-stack>
            <s-stack alignItems="center" paddingBlock="base">
                <s-text>
                ©2025
                <s-link href="https://www.h1-apps.com/"> H1 Web Development.  </s-link>
                All Rights Reserved.
                </s-text>
            </s-stack>
        </s-page>
    );
} 