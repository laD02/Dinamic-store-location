import { ActionFunctionArgs, Form, LoaderFunctionArgs, redirect, useActionData, useFetcher, useLoaderData, useNavigate, useNavigation, useSubmit } from "react-router";
import styles from "../css/addLocation.module.css"
import { useEffect, useRef, useState } from "react";
import prisma from "app/db.server";

export async function loader({params}:LoaderFunctionArgs) {
    const {id} = params;
    const store = await prisma.store.findUnique({
        where: { id },
    });

  return store;
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const urls = formData.getAll("contract") as string[];
  const actionType = formData.get('actionType')
  const deleted = JSON.parse(formData.get("deleteContract")?.toString() || "[]") as string[];
  const { id } = params;

  const contract: Record<string, string[]> = {};

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
        mondayOpen: formData.get("monday-open")?.toString() ?? "",
        mondayClose: formData.get("monday-close")?.toString() ?? "",
        tuesdayOpen: formData.get("tuesday-open")?.toString() ?? "",
        tuesdayClose: formData.get("tuesday-close")?.toString() ?? "",
        wednesdayOpen: formData.get("wednesday-open")?.toString() ?? "",
        wednesdayClose: formData.get("wednesday-close")?.toString() ?? "",
        thursdayOpen: formData.get("thursday-open")?.toString() ?? "",
        thursdayClose: formData.get("thursday-close")?.toString() ?? "",
        fridayOpen: formData.get("friday-open")?.toString() ?? "",
        fridayClose: formData.get("friday-close")?.toString() ?? "",
        saturdayOpen: formData.get("saturday-open")?.toString() ?? "",
        saturdayClose: formData.get("saturday-close")?.toString() ?? "",
        sundayOpen: formData.get("sunday-open")?.toString() ?? "",
        sundayClose: formData.get("sunday-close")?.toString() ?? "",
      },
    },
  });

  return {ok: true};
}


export default function EditLocation () {
    const fetcher = useFetcher()
    const store = useLoaderData()
    const submit = useSubmit();
    const navigate = useNavigate();
    const [click, setClick] = useState(false)
    const [countSocial, setCountSocial] = useState<{}[]>([]);
    const [preview, setPreview] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [deleteContract, setDeleteContract] = useState<string[]>([]);
    const [error, setError] = useState(false)
    const [showBanner, setShowBanner] = useState(false);
    const actionData = useActionData<typeof action>();
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
          satudayOpen: "",
          satudayClose: "",
          sundayOpen: "",
          sundayClose: "",
        },
        directions:  "",
        contract:  {} as Record<string, string[]>,
        source:  "",
        visibility:  ""
    }));

    useEffect(() => {
        if (actionData?.ok) {
            setShowBanner(true);
            
            // Tự động ẩn sau 5 giây
            const timer = setTimeout(() => {
                setShowBanner(false);
            }, 3000);

            // Cleanup timer khi component unmount
            return () => clearTimeout(timer);
        }
    }, [actionData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
        }
    }, [store]);

    const handleDiscard = () => {
        if (!store) return;

        // Reset formData về store
        setFormData({
            ...store,
            time: { ...store.time },
            contract: { ...store.contract },
        });

        // Reset state phụ
        setPreview(store.image || null);
        setImageBase64(store.image || null);
        setDeleteContract([]);
        setCountSocial([]);
        setClick(store.visibility === "visible");
        setError(false);
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
                            <s-clickable onClick={() => setClick(!click)}>
                                <s-badge tone="success">
                                    <s-stack direction="inline" alignItems="center">
                                        <s-icon type="eye-check-mark"/>
                                        visible
                                    </s-stack>
                                </s-badge>
                            </s-clickable>
                            :
                            <s-clickable onClick={() => setClick(!click)}>
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

            <s-stack>
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
                    <input type="hidden" name="visibility" value={click ? "visible" : "hidden"} />
                    <s-stack gap="large-100">
                        <s-stack background="base" padding="small-200" borderRadius="large-100" borderStyle="solid" borderColor="subdued">
                            <s-stack padding="small-200">
                                <s-stack direction="inline" justifyContent="space-between">
                                    <s-text type="strong">Location Information</s-text>
                                    <s-badge tone="info">Manual</s-badge>                               
                                </s-stack>
                                <s-paragraph >Customize your location information</s-paragraph>
                            </s-stack>
                            <s-stack padding="small-200" gap="small-200">
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
                                <s-stack direction="inline" justifyContent="space-between" gap="small-100">
                                
                                    <s-box>
                                        <s-text-field 
                                            label="City"
                                            name="city"
                                            error={ error === true ? "City is required" : ""}
                                            required
                                            defaultValue={formData.city}
                                        />
                                    </s-box>
                                
                                    <s-box>
                                        <s-select label="State" name="state" error={error === true ? "State is required" : ""} value={formData.state}>
                                            <s-option value="AL">AL</s-option>
                                            <s-option value="AZ">AZ</s-option>
                                            <s-option value="AS">AS</s-option>
                                            <s-option value="AR">AR</s-option>
                                        </s-select>
                                    </s-box>
                                    
                                    <s-box>
                                        <s-text-field 
                                            label="Zip Code"
                                            name="code"
                                            error={error === true ? "Zip code is required" : ""}
                                            required
                                            defaultValue={formData.code}
                                        />
                                    </s-box>
                                </s-stack>
                                <s-stack direction="inline" justifyContent="space-between" gap="small-100">
                                
                                    <s-box>
                                        <s-text-field 
                                            label="Phone Number"
                                            name="phone"
                                            defaultValue={formData.phone}
                                        />
                                    </s-box>
                                    
                                    <s-box>
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
                            <s-stack paddingBlock="small-200" paddingInlineStart="small-200">
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
                            <s-stack direction="inline" justifyContent="space-around">
                                <s-box>Open</s-box>
                                <s-box>Close</s-box>
                            </s-stack>
                            {
                                ['Monday', 'Tuesday', 'Wednesday', 'Thursday','Friday', 'Satuday', 'Sunday'].map((item, index) => (
                                    <s-stack direction="inline" justifyContent="space-between" paddingBlockEnd="small-200" key={index}>
                                        <s-box inlineSize="10%">{item}</s-box>
                                        <s-box>
                                            <s-text-field name={`${item}-open`}/>
                                        </s-box>
                                        <s-box>
                                            <s-text-field name={`${item}-close`}/>
                                        </s-box>
                                        <s-box>
                                            <s-clickable>
                                                <s-icon type="eye-check-mark"/>
                                            </s-clickable>
                                        </s-box>
                                    </s-stack>
                                ))
                            }
                        </s-stack>   
                        <s-stack background="base" padding="base" borderRadius="large-100" borderStyle="solid" borderColor="subdued">
                            <s-box>
                                <s-text type="strong">Add a logo for this location</s-text>                                          
                                <s-paragraph>Customize your location information</s-paragraph>  
                            </s-box>
                            <s-stack direction="inline" justifyContent="space-between" paddingBlock="small-200" alignItems="center" >
                                <s-stack background="subdued" paddingInline="large-500" borderStyle="dashed" borderWidth="small" borderRadius="large-200" paddingBlock="large-300" alignItems="center" justifyContent="center" direction="block" inlineSize="48%">

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
                                <s-box inlineSize="48%">We support .gif, .jpg, .png, and .svg files up to 3MB</s-box>
                            </s-stack>
                        </s-stack>
                    </s-stack>
                    {/* <div className={styles.shared}>
                         
                    </div> */}
                </Form>
                <img src="/place2.jpg" alt="demo" className={styles.boxImage}/>
            </s-stack>
            {showBanner && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 1000,
                    minWidth: '400px',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    <s-banner 
                        heading="Store edited successfully" 
                        tone="success" 
                        dismissible={true}
                        onDismiss={() => setShowBanner(false)}
                    >
                        Your store has been edited!
                    </s-banner>
                </div>
            )}
            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </s-page>
    );
} 