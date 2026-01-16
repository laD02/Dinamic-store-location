import { ActionFunctionArgs, Form, LoaderFunctionArgs, useFetcher, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import prisma from "app/db.server";
import { SaveBar, useAppBridge } from '@shopify/app-bridge-react';
import { getLatLngFromAddress } from "app/utils/geocode.server";
import { authenticate } from "../shopify.server";
import { uploadImageToCloudinary } from "app/utils/upload.server";
import styles from "../css/addLocation.module.css"
import { formatTimeInput, TimeErrors, validateAllTimes, validateTimeFormat } from "app/utils/timeValidation";
import { SocialPlatform, validateSocialUrl } from "app/utils/socialValidation";
import { validateWebsiteUrl } from "app/utils/websiteValidation";

export async function loader({ request }: LoaderFunctionArgs) {
    const filter = await prisma.attribute.findMany()
    return filter;
}

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const contract: Record<string, string[]> = {};
    const urls = formData.getAll("contract") as string[];
    const imageBase64 = formData.get("image")?.toString() ?? "";
    const address = formData.get("address")?.toString() ?? "";
    const location = await getLatLngFromAddress(address);
    const tagsString = formData.get("tags")?.toString() ?? "";
    const tags = tagsString ? JSON.parse(tagsString) : [];
    const { session } = await authenticate.admin(request);
    const shop = session?.shop;

    let imageUrl = "";
    if (imageBase64) {
        const uploadedUrl = await uploadImageToCloudinary(imageBase64);
        imageUrl = uploadedUrl ?? "";
    }

    urls.forEach((url) => {
        const lower = url.toLowerCase();
        if (lower.includes("facebook.com")) {
            if (!contract.facebook) contract.facebook = [];
            contract.facebook.push(url);
        } else if (lower.includes("youtube.com")) {
            if (!contract.youtube) contract.youtube = [];
            contract.youtube.push(url);
        } else if (lower.includes("linkedin.com")) {
            if (!contract.linkedin) contract.linkedin = [];
            contract.linkedin.push(url);
        } else if (lower.includes("instagram.com")) {
            if (!contract.instagram) contract.instagram = [];
            contract.instagram.push(url);
        } else if (lower.includes("x.com")) {
            if (!contract.x) contract.x = [];
            contract.x.push(url);
        } else if (lower.includes("pinterest.com")) {
            if (!contract.pinterest) contract.pinterest = [];
            contract.pinterest.push(url)
        } else if (lower.includes("tiktok.com")) {
            if (!contract.tiktok) contract.tiktok = [];
            contract.tiktok.push(url)
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
            image: imageUrl,
            url: formData.get("url")?.toString() ?? "",
            directions: formData.get("directions")?.toString() ?? "",
            contract,
            source: formData.get('source')?.toString() ?? "Manual",
            visibility: formData.get('visibility')?.toString() ?? "",
            time: {
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
    return { ok: true }
}

type SocialMedia = {
    id: string;
    platform: string;
    url: string;
};

export default function AddLocation() {
    const navigate = useNavigate();
    const fetcher = useFetcher()
    const shopify = useAppBridge()
    const [visibility, setVisibility] = useState("hidden");
    const [countSocial, setCountSocial] = useState<SocialMedia[]>([
        { id: crypto.randomUUID(), platform: "linkedin", url: "" },
        { id: crypto.randomUUID(), platform: "linkedin", url: "" },
    ]);
    const [socialResetKey, setSocialResetKey] = useState(0);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const initialFormRef = useRef<FormData | null>(null);
    const initialSocialRef = useRef<SocialMedia[]>([]);
    const isDiscardingRef = useRef(false);
    const initialHoursRef = useRef<typeof dayStatus | null>(null);
    const initialVisibilityRef = useRef<string>("hidden");
    const initialImageRef = useRef<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [timeErrors, setTimeErrors] = useState<TimeErrors>({});
    const [socialErrors, setSocialErrors] = useState<Record<string, string>>({});
    const [websiteError, setWebsiteError] = useState<string>("");
    const [previewData, setPreviewData] = useState({
        storeName: "",
        address: "",
        phone: "",
        city: "",
        state: "",
        code: "",
    });
    const isSaving = fetcher.state === "submitting" || fetcher.state === "loading";

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const [dayStatus, setDayStatus] = useState(
        days.reduce((acc, day) => {
            acc[day] = { valueOpen: "09:00", valueClose: "17:00" };
            return acc;
        }, {} as Record<string, { valueOpen: string; valueClose: string }>)
    );

    const socialIcons: Record<string, string> = {
        facebook: 'fa-facebook',
        youtube: 'fa-youtube',
        linkedin: 'fa-linkedin',
        instagram: 'fa-square-instagram',
        x: 'fa-square-x-twitter',
        pinterest: 'fa-pinterest',
        tiktok: 'fa-tiktok'
    };

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize
    useEffect(() => {
        if (isInitialized || !formRef.current) return;

        requestAnimationFrame(() => {
            if (formRef.current) {
                initialFormRef.current = new FormData(formRef.current);
                initialHoursRef.current = JSON.parse(JSON.stringify(dayStatus));
                initialSocialRef.current = JSON.parse(JSON.stringify(countSocial));
                initialVisibilityRef.current = "hidden";
                initialImageRef.current = null;
                setIsInitialized(true);
            }
        });
    }, [isInitialized]);

    // Debounced dirty check - CHỈ 1 HÀM DUY NHẤT
    const checkDirty = () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            if (isDiscardingRef.current || !isInitialized || !formRef.current || !initialFormRef.current) return;

            let dirty = false;

            // Check form fields
            const current = new FormData(formRef.current);
            for (const [key, value] of current.entries()) {
                if (key.endsWith("-open") || key.endsWith("-close") || key === "image" || key === "contract") continue;
                const initialValue = initialFormRef.current.get(key);
                if (String(value).trim() !== String(initialValue ?? "").trim()) {
                    dirty = true;
                    break;
                }
            }

            // Check hours
            if (!dirty && initialHoursRef.current) {
                if (JSON.stringify(dayStatus) !== JSON.stringify(initialHoursRef.current)) {
                    dirty = true;
                }
            }

            // Check image
            if (!dirty) {
                if (imageBase64 !== initialImageRef.current) {
                    dirty = true;
                }
            }

            // Check social
            // Check social - so sánh theo nội dung thực (platform, url), không so sánh id
            if (!dirty) {
                const currentSocial = countSocial.map(s => ({ platform: s.platform, url: s.url }));
                const initialSocial = initialSocialRef.current.map(s => ({ platform: s.platform, url: s.url }));
                if (JSON.stringify(currentSocial) !== JSON.stringify(initialSocial)) {
                    dirty = true;
                }
            }

            // Check visibility
            if (!dirty) {
                if (visibility !== initialVisibilityRef.current) {
                    dirty = true;
                }
            }

            if (dirty) {
                shopify.saveBar.show("location-save-bar");
            } else {
                shopify.saveBar.hide("location-save-bar");
            }
        }, 150); // 150ms debounce
    };

    // GỌI checkDirty khi có thay đổi
    useEffect(() => {
        if (!isInitialized) return;
        checkDirty();
    }, [dayStatus, imageBase64, countSocial, visibility, isInitialized]);

    // Save success
    useEffect(() => {
        if (fetcher.data?.ok && formRef.current) {
            initialFormRef.current = new FormData(formRef.current);
            initialHoursRef.current = JSON.parse(JSON.stringify(dayStatus));
            initialSocialRef.current = JSON.parse(JSON.stringify(countSocial));
            initialVisibilityRef.current = visibility;
            initialImageRef.current = imageBase64;

            shopify.toast.show('Store saved successfully!')
            shopify.saveBar.hide("location-save-bar");
        }
    }, [fetcher.data]);

    const handleClickDay = (day: string) => {
        setDayStatus(prev => {
            // const isDisabled = prev[day].disabled;
            return {
                ...prev,
                [day]: {
                    ...prev[day],
                    valueOpen: '',
                    valueClose: '',
                }
            };
        });
    };

    const handleTimeOpenChange = (day: string, value: string) => {
        const formatted = formatTimeInput(value);

        setDayStatus(prev => ({
            ...prev,
            [day]: { ...prev[day], valueOpen: formatted }
        }));

        if (validateTimeFormat(formatted)) {
            clearTimeError(day, "open");
        }
    };

    const handleTimeCloseChange = (day: string, value: string) => {
        const formatted = formatTimeInput(value);

        setDayStatus(prev => ({
            ...prev,
            [day]: { ...prev[day], valueClose: formatted }
        }));

        if (validateTimeFormat(formatted)) {
            clearTimeError(day, "close");
        }
    };

    const handleAdd = () => {
        const newItem: SocialMedia = {
            id: crypto.randomUUID(),
            platform: "linkedin",
            url: ""
        };
        setCountSocial([...countSocial, newItem]);
    };

    const handleRemove = (id: string) => {
        setCountSocial(prev => prev.filter(item => item.id !== id));
    };

    const validateSocialMedia = (
        id: string,
        url: string,
        platform: SocialPlatform
    ) => {
        if (!url.trim()) {
            setSocialErrors(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            return;
        }

        const validation = validateSocialUrl(url, platform);

        if (!validation.isValid) {
            setSocialErrors(prev => ({
                ...prev,
                [id]: validation.message || "Invalid URL"
            }));
        } else {
            setSocialErrors(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }
    };

    const validateWebsite = (url: string) => {
        if (!url.trim()) {
            setWebsiteError("");
            return;
        }

        const validation = validateWebsiteUrl(url);

        if (!validation.isValid) {
            setWebsiteError(validation.message || "Invalid URL");
        } else {
            setWebsiteError("");
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setPreview(imageUrl);

            const reader = new FileReader();
            reader.onloadend = () => {
                setImageBase64(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearTimeError = (day: string, type: "open" | "close") => {
        setTimeErrors(prev => {
            if (!prev[day]?.[type]) return prev;

            const next = { ...prev };
            delete next[day][type];

            if (Object.keys(next[day]).length === 0) {
                delete next[day];
            }

            return next;
        });
    };

    const handleSubmit = () => {
        if (!formRef.current) return;

        const newErrors: Record<string, string> = {};
        const requiredFields = ["storeName", "address", "city", "code"];
        requiredFields.forEach((name) => {
            const el = formRef.current!.elements.namedItem(name) as HTMLInputElement;
            if (!el?.value?.trim()) {
                newErrors[name] = "Please fill in this field";
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            return;
        }

        // Validate website
        const websiteField = formRef.current.elements.namedItem('url') as HTMLInputElement;
        if (websiteField?.value?.trim()) {
            const websiteValidation = validateWebsiteUrl(websiteField.value);
            if (!websiteValidation.isValid) {
                setWebsiteError(websiteValidation.message || 'Invalid URL');
                return;
            }
        }

        // Validate all times
        const allTimeErrors = validateAllTimes(dayStatus, days);
        if (Object.keys(allTimeErrors).length > 0) {
            setTimeErrors(allTimeErrors);
            return;
        }

        // THÊM PHẦN NÀY - Validate social media
        const socialValidationErrors: Record<string, string> = {};
        countSocial.forEach(item => {
            const validation = validateSocialUrl(item.url, item.platform as SocialPlatform);
            if (!validation.isValid) {
                socialValidationErrors[item.id] = validation.message || 'Invalid URL';
            }
        });

        if (Object.keys(socialValidationErrors).length > 0) {
            setSocialErrors(socialValidationErrors);
            return;
        }

        // Normalize hours
        setDayStatus(prev => {
            const updated = { ...prev };
            days.forEach(day => {
                const openValue = prev[day].valueOpen;
                const closeValue = prev[day].valueClose;
                if (!openValue || !closeValue || openValue === "" || closeValue === "") {
                    updated[day] = {
                        valueOpen: "close",
                        valueClose: "close"
                    };
                }
            });
            return updated;
        });

        setTimeout(() => {
            if (formRef.current) {
                fetcher.submit(formRef.current, { method: "post" });
            }
        }, 0);
    };

    const handleDiscard = () => {
        if (!formRef.current || !initialFormRef.current) return;

        isDiscardingRef.current = true;

        const form = formRef.current;
        for (const [key, value] of initialFormRef.current.entries()) {
            const element = form.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement;
            if (element && key !== "image") {
                element.value = String(value);
            }
        }

        setPreview(initialImageRef.current);
        setImageBase64(initialImageRef.current);
        setVisibility(initialVisibilityRef.current);
        setCountSocial(JSON.parse(JSON.stringify(initialSocialRef.current)));
        setSocialResetKey(prev => prev + 1);

        if (initialHoursRef.current) {
            setDayStatus(JSON.parse(JSON.stringify(initialHoursRef.current)));
        }

        setPreviewData({
            storeName: "",
            address: "",
            phone: "",
            city: "",
            state: "",
            code: "",
        });

        setTimeErrors({});
        setSocialErrors({}); // THÊM DÒNG NÀY
        setWebsiteError("");

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
                    disabled={isSaving}
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
                            onClick={() => navigate('/app/allLocation')}
                            padding="small-300"
                        >
                            <s-icon type="arrow-left" />
                        </s-clickable>
                    </s-box>
                    <text style={{ fontSize: 16, fontWeight: 600 }}>Add Location</text>
                    <s-box>
                        {
                            visibility === "visible" ?
                                <s-badge tone="success">
                                    <s-stack direction="inline" alignItems="center">
                                        <s-icon type="eye-check-mark" />
                                        Visible
                                    </s-stack>
                                </s-badge>
                                :
                                <s-badge>
                                    <s-stack direction="inline" alignItems="center">
                                        <s-icon type="hide" tone="info" />
                                        Hidden
                                    </s-stack>
                                </s-badge>
                        }
                    </s-box>
                </s-stack>
            </s-stack>

            <Form method="post" ref={formRef}>
                <s-query-container>
                    <s-grid
                        gridTemplateColumns="@container (inline-size > 768px) 2fr 1fr, 1fr"
                        gap="base"
                    >
                        <s-grid-item>
                            <s-stack>
                                <input
                                    type="hidden"
                                    name="visibility"
                                    value={visibility}
                                />
                                <s-stack gap="base">
                                    <s-section>
                                        <s-stack>
                                            <s-stack direction="inline" justifyContent="space-between">
                                                <s-heading>Location Information</s-heading>
                                            </s-stack>
                                        </s-stack>
                                        <s-stack paddingBlockStart="small" gap="small-200">
                                            <s-box>
                                                <s-text-field
                                                    label="Location Name"
                                                    name="storeName"
                                                    error={fieldErrors.storeName}
                                                    required
                                                    defaultValue=""
                                                    onInput={(e: any) => {
                                                        const value = e.target.value;
                                                        setPreviewData(prev => ({ ...prev, storeName: value }));

                                                        if (value.trim()) {
                                                            setFieldErrors(prev => {
                                                                const next = { ...prev };
                                                                delete next.storeName;
                                                                return next;
                                                            });
                                                        }
                                                        checkDirty()
                                                    }}
                                                />
                                            </s-box>
                                            <s-box>
                                                <s-text-field
                                                    label="Address"
                                                    name="address"
                                                    error={fieldErrors.address}
                                                    required
                                                    defaultValue=""
                                                    onInput={(e: any) => {
                                                        const value = e.target.value;
                                                        setPreviewData(prev => ({ ...prev, address: value }));

                                                        if (value.trim()) {
                                                            setFieldErrors(prev => {
                                                                const next = { ...prev };
                                                                delete next.address;
                                                                return next;
                                                            });
                                                        }
                                                    }}
                                                />
                                            </s-box>
                                            <s-grid
                                                gridTemplateColumns="@container (inline-size > 768px) 1fr 1fr, 1fr"
                                                gap="base"
                                            >
                                                <s-grid-item>
                                                    <s-text-field
                                                        label="City"
                                                        name="city"
                                                        error={fieldErrors.city}
                                                        required
                                                        defaultValue=""
                                                        onInput={(e: any) => {
                                                            const value = e.target.value;
                                                            setPreviewData(prev => ({ ...prev, city: value }));

                                                            if (value.trim()) {
                                                                setFieldErrors(prev => {
                                                                    const next = { ...prev };
                                                                    delete next.city;
                                                                    return next;
                                                                });
                                                            }
                                                        }}
                                                    />
                                                </s-grid-item>

                                                <s-grid-item>
                                                    <s-text-field
                                                        label="Zip Code"
                                                        name="code"
                                                        error={fieldErrors.code}
                                                        required
                                                        defaultValue=""
                                                        onInput={(e: any) => {
                                                            const value = e.target.value;
                                                            setPreviewData(prev => ({ ...prev, code: value }));

                                                            if (value.trim()) {
                                                                setFieldErrors(prev => {
                                                                    const next = { ...prev };
                                                                    delete next.code;
                                                                    return next;
                                                                });
                                                            }
                                                        }}
                                                    />

                                                </s-grid-item>
                                            </s-grid>
                                            <s-grid
                                                gridTemplateColumns="@container (inline-size > 768px) 1fr 1fr, 1fr"
                                                gap="base"
                                            >
                                                <s-grid-item>
                                                    <s-text-field
                                                        label="Phone Number"
                                                        name="phone"
                                                        defaultValue=""
                                                        onInput={(e: any) => {
                                                            setPreviewData(prev => ({
                                                                ...prev,
                                                                phone: e.target.value
                                                            }));
                                                            checkDirty();
                                                        }}
                                                    />
                                                </s-grid-item>

                                                <s-grid-item>
                                                    <s-text-field
                                                        label="Website"
                                                        name="url"
                                                        defaultValue=""
                                                        error={websiteError}
                                                        onInput={(e: any) => {
                                                            checkDirty();
                                                        }}
                                                        onBlur={(e: any) => {
                                                            validateWebsite(e.target.value);
                                                        }}
                                                    />
                                                </s-grid-item>
                                            </s-grid>

                                            <s-text-area
                                                label="Direction"
                                                name="directions"
                                                defaultValue=""
                                                onInput={checkDirty}
                                            />
                                        </s-stack>
                                    </s-section>

                                    <s-section>
                                        <s-box>
                                            <s-heading>Hours of Operation</s-heading>
                                        </s-box>
                                        <s-stack>
                                            <table>
                                                <tbody>
                                                    <tr>
                                                        <td></td>
                                                        <td align="center">Open</td>
                                                        <td align="center">Close</td>
                                                        <td></td>
                                                    </tr>
                                                    {days.map((item) => (
                                                        <tr key={item}>
                                                            <td style={{ verticalAlign: "top" }}>{item}</td>
                                                            <td style={{ verticalAlign: "top" }}>
                                                                <s-text-field
                                                                    name={`${item}-open`}
                                                                    value={dayStatus[item].valueOpen}
                                                                    error={timeErrors[item]?.open}
                                                                    placeholder="HH:MM"
                                                                    readOnly={dayStatus[item].valueOpen === "close"}
                                                                    onInput={(e: any) => handleTimeOpenChange(item, e.target.value)}
                                                                />
                                                            </td>
                                                            <td style={{ verticalAlign: "top" }}>
                                                                <s-text-field
                                                                    name={`${item}-close`}
                                                                    value={dayStatus[item].valueClose}
                                                                    error={timeErrors[item]?.close}
                                                                    placeholder="HH:MM"
                                                                    readOnly={dayStatus[item].valueClose === "close"}
                                                                    onInput={(e: any) => handleTimeCloseChange(item, e.target.value)}
                                                                />
                                                            </td>
                                                            <td style={{ verticalAlign: "top" }}>
                                                                <s-button icon="edit" variant="tertiary" onClick={() => handleClickDay(item)}></s-button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </s-stack>
                                    </s-section>
                                    <s-section >
                                        <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                                            <s-stack >
                                                <s-heading>Social Media</s-heading>
                                            </s-stack>
                                            <s-button icon="plus-circle" onClick={() => handleAdd()}>Add Social Media</s-button>
                                        </s-stack>
                                        <s-stack paddingBlockStart="small-200" gap="small-400">
                                            {
                                                countSocial.map((item) => (
                                                    <s-stack
                                                        direction="inline"
                                                        justifyContent="start"
                                                        gap="small-200"
                                                        alignItems="start"
                                                        key={`${socialResetKey}-${item.id}`}
                                                    >
                                                        <s-box inlineSize="33%">
                                                            <s-select
                                                                value={item.platform}
                                                                onChange={(e: any) => {
                                                                    setCountSocial(prev =>
                                                                        prev.map(social =>
                                                                            social.id === item.id
                                                                                ? { ...social, platform: e.target.value }
                                                                                : social
                                                                        )
                                                                    );
                                                                    if (item.url.trim()) {
                                                                        validateSocialMedia(item.id, item.url, e.target.value as SocialPlatform);
                                                                    }
                                                                }}
                                                            >
                                                                <s-option value="linkedin">LinkedIn</s-option>
                                                                <s-option value="youtube">Youtube</s-option>
                                                                <s-option value="facebook">Facebook</s-option>
                                                                <s-option value="instagram">Instagram</s-option>
                                                                <s-option value="x">X</s-option>
                                                                <s-option value="pinterest">Pinterest</s-option>
                                                                <s-option value="tiktok">Tiktok</s-option>
                                                            </s-select>
                                                        </s-box>
                                                        <s-box inlineSize="33%">
                                                            <s-text-field
                                                                name="contract"
                                                                placeholder={`https://www.${item.platform}.com/`}
                                                                error={socialErrors[item.id]}
                                                                value={item.url}
                                                                onInput={(e: any) => {
                                                                    setCountSocial(prev =>
                                                                        prev.map(social =>
                                                                            social.id === item.id
                                                                                ? { ...social, url: e.target.value }
                                                                                : social
                                                                        )
                                                                    );
                                                                }}
                                                                onBlur={(e: any) => {
                                                                    const url = e.target.value;
                                                                    if (url.trim()) {
                                                                        validateSocialMedia(item.id, url, item.platform as SocialPlatform);
                                                                    }
                                                                }}
                                                            />
                                                        </s-box>
                                                        <s-button
                                                            icon="delete"
                                                            onClick={() => handleRemove(item.id)}
                                                        />
                                                    </s-stack>
                                                ))
                                            }
                                        </s-stack>
                                    </s-section>
                                </s-stack>
                            </s-stack>
                        </s-grid-item>

                        <s-grid-item>
                            <s-grid
                                gridTemplateColumns="@container (inline-size > 768px) 1fr, 1fr 1fr"
                                gap="base"
                            >
                                <s-grid-item>
                                    <s-stack gap="base">
                                        <s-section heading="Visibility">
                                            <s-select
                                                value={visibility}
                                                onChange={(e: any) => {
                                                    setVisibility(e.target.value);
                                                }}
                                            >
                                                <s-option value="hidden">Hidden</s-option>
                                                <s-option value="visible">Visible</s-option>
                                            </s-select>
                                        </s-section>

                                        <s-section>
                                            <s-box>
                                                <s-heading>Add a logo for this location</s-heading>
                                                <s-paragraph>Customize your location information</s-paragraph>
                                            </s-box>
                                            <s-stack direction="inline" justifyContent="space-between" paddingBlockStart="small-200" alignItems="center">
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
                                                                    onClick={(e: any) => {
                                                                        e.stopPropagation?.();
                                                                        setPreview(null)
                                                                        setImageBase64(null);
                                                                    }}
                                                                >
                                                                    <s-icon type="x" />
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
                                        </s-section>
                                    </s-stack>
                                </s-grid-item>

                                <s-grid-item>
                                    <div className={styles.boxOverlay}>
                                        <div className={styles.overlayImageContainer}>
                                            <img src={preview || "/shop.png"} alt="Store" />
                                        </div>

                                        <div className={styles.storeInfo}>
                                            <h3 className={styles.storeName}>{previewData.storeName || 'Apple Park'}</h3>
                                            <div className={styles.contactRow}>
                                                <i className="fa-solid fa-location-dot" ></i>
                                                <span className={styles.storeAddress}> {previewData.address || 'Apple Park Way'}, {previewData.city || 'Cupertino'}, {previewData.code || '95014'}</span>
                                            </div>
                                            <div className={styles.contactRow}>
                                                <i className="fa-solid fa-phone" ></i>
                                                <span>{previewData.phone || '+1 408-996-1010'}</span>
                                            </div>

                                            <div className={styles.contactRow}>
                                                <i className="fa-solid fa-clock"></i>
                                                <table>
                                                    <tbody>
                                                        {days.map(day => {
                                                            const status = dayStatus[day];
                                                            if (
                                                                !status.valueOpen ||
                                                                !status.valueClose ||
                                                                status.valueOpen === "close" ||
                                                                status.valueClose === "close") {
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
                                                                    <td>{status.valueOpen} - {status.valueClose}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className={styles.socialIcons}>
                                                {countSocial
                                                    .map(item => {
                                                        const iconClass = socialIcons[item.platform];
                                                        return (
                                                            <a href={item.url} target="_blank" key={item.id}>
                                                                <i
                                                                    className={`fa-brands ${iconClass}`}
                                                                />
                                                            </a>
                                                        );
                                                    })
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </s-grid-item>
                            </s-grid>
                        </s-grid-item>
                    </s-grid>
                </s-query-container>
            </Form>

            <s-stack alignItems="center" paddingBlock="large">
                <s-text>
                    Learn more about <span style={{ color: 'blue' }}><s-link href="">Location section</s-link></span>
                </s-text>
            </s-stack>
        </s-page>
    );
}