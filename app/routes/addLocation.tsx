import { ActionFunctionArgs, Form, LoaderFunctionArgs, redirect, useNavigate, useNavigation, useSubmit } from "react-router";
import styles from "../css/addLocation.module.css"
import { useRef, useState } from "react";
import prisma from "app/db.server";

export async function loader({request}:LoaderFunctionArgs) {
    return { };
}

export async function action({request}: ActionFunctionArgs) {
    const formData = await request.formData();
    const contract: Record<string, string[]> = {};
    const urls = formData.getAll("contract") as string[];

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
            storeName: formData.get("storeName")?.toString() ?? "",
            address: formData.get("address")?.toString() ?? "",
            city: formData.get("city")?.toString() ?? "",
            state: formData.get("state")?.toString() ?? "",
            code: formData.get("code")?.toString() ?? "",
            phone: formData.get("phone")?.toString() ?? "",
            image: formData.get("image")?.toString() ?? "",
            directions: formData.get("directions")?.toString() ?? "",
            contract, // đây là object chứa arrays
            source: formData.get('source')?.toString() ?? "",
            visibility: formData.get('visibility')?.toString() ?? "",
            time:{
                mondayOpen: formData.get('monday-open')?.toString() ?? "",
                mondayClose: formData.get('monday-close')?.toString() ?? "",
                tuesdayOpen: formData.get('tuesday-open')?.toString() ?? "",
                tuesdayClose: formData.get('tuesday-close')?.toString() ?? "",
                fridayOpen: formData.get('friday-open')?.toString() ?? "",
                fridayClose: formData.get('friday-close')?.toString() ?? "",
                thursdayOpen: formData.get('thursday-open')?.toString() ?? "",
                thursdayClose: formData.get('thursday-close')?.toString() ?? "",
                wednesdayOpen: formData.get('wednesday-open')?.toString() ?? "",
                wednesdayClose: formData.get('wednesday-close')?.toString() ?? "",
                satudayOpen: formData.get('satuday-open')?.toString() ?? "",
                satudayClose: formData.get('satuday-close')?.toString() ?? "",
                sundayOpen: formData.get('sunday-open')?.toString() ?? "",
                sundayClose: formData.get('sunday-close')?.toString() ?? "",
            },
        },
    });
    return redirect("/app")
}

export default function AddLocation () {
    const submit = useSubmit();
    const navigate = useNavigate();
    const [click, setClick] = useState(false)
    const [countSocial, setCountSocial] = useState([{},{}]);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState(false)
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting" || navigation.state === "loading";
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
                        type="submit"
                        onClick={() => handleSubmit()}
                        loading={isSubmitting}
                    >
                        Save
                    </s-button>

                    <s-button
                        tone="critical"
                        commandFor="delete-modal"
                    >
                        Delete
                    </s-button>
                    <s-modal id="delete-modal" heading="Delete Location">
                        <s-text>
                        Are you sure you want to delete the location? This action cannot be undone.
                        </s-text>

                        <s-button
                            slot="secondary-actions"
                            variant="secondary"
                            commandFor="delete-modal"
                            command="--hide"
                        >
                            Cancel
                        </s-button>

                        <s-button
                            slot="primary-action"
                            variant="primary"
                            tone="critical"
                            commandFor="delete-modal"
                            command="--hide"
                            onClick={() => navigate('/app')}
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
                    data-save-bar
                    onSubmit={(e) => {
                        e.preventDefault(); // prevent default submit
                        handleSubmit();     // dùng hàm validate + submit chung
                    }}
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
                                    />
                                </s-box>
                                <s-box>
                                    <s-text-field 
                                        label="Address"
                                        name = "address"
                                        error={error === true ? "Address line 1 is required" : ""}
                                        required
                                    />
                                </s-box>
                                <s-stack direction="inline" justifyContent="space-between" gap="small-100">
                                
                                    <s-box>
                                        <s-text-field 
                                            label="City"
                                            name="city"
                                            error={ error === true ? "City is required" : ""}
                                            required
                                        />
                                    </s-box>
                                
                                    <s-box>
                                        <s-select label="State" name="state" error={error === true ? "State is required" : ""}>
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
                                        />
                                    </s-box>
                                </s-stack>
                                <s-stack direction="inline" justifyContent="space-between" gap="small-100">
                                
                                    <s-box>
                                        <s-text-field 
                                            label="Phone Number"
                                            name="phone"
                                        />
                                    </s-box>
                                    
                                    <s-box>
                                        <s-text-field 
                                            label="Website"
                                            name="url"
                                        />
                                    </s-box>
                                </s-stack>
                                
                                <s-text-area 
                                    label="Direction"
                                    name="directions"
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
                                                />
                                            </s-box>
                                            <s-button icon="delete" onClick={() => handleRemove(index)}></s-button>
                                        </s-stack>
                                    ))
                                }
                                
                            </s-stack>
                        </s-stack>
                        <s-stack background="base" padding="small" borderRadius="large-100" borderStyle="solid" borderColor="subdued">
                            <s-box>
                                <s-text type="strong">Hours of Operation</s-text>
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
                        <s-stack background="base" padding="small-200" borderRadius="large-100" borderStyle="solid" borderColor="subdued">
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
                                                    onClick={ (e)=> {
                                                        e.stopPropagation();
                                                        setPreview(null) 
                                                    }}
                                                >
                                                    <s-icon type="x"/>
                                                </s-clickable>
                                            </s-box>
                                            {/* <i 
                                                className="fa-solid fa-ban" 
                                                onClick={ (e)=> {
                                                    e.stopPropagation();
                                                    setPreview(null) 
                                                }}
                                            /> */}
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
                                
                                <s-box inlineSize="48%">We support .gif, .jpg, .png, and .svg files up to 3MB</s-box>
                            </s-stack>
                        </s-stack>
                    </s-stack>
                    {/* <div className={styles.shared}>
                         
                    </div> */}
                </Form>
                <img src="/place2.jpg" alt="demo" className={styles.boxImage}/>
            </s-stack>
        </s-page>
    );
}