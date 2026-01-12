import { ActionFunctionArgs, Form, LoaderFunctionArgs, redirect, useActionData, useFetcher, useLoaderData, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import prisma from "app/db.server";
import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { getLatLngFromAddress } from "app/utils/geocode.server";
import { uploadImageToCloudinary } from "app/utils/upload.server";
import { stateList } from "app/utils/state";
import styles from "../css/addLocation.module.css";

export async function loader({ params }: LoaderFunctionArgs) {
    const { id } = params;
    const filter = await prisma.attribute.findMany()
    const store = await prisma.store.findUnique({
        where: { id },
    });

    return { store, filter };
}

export async function action({ request, params }: ActionFunctionArgs) {
    const formData = await request.formData();
    const urls = formData.getAll("contract") as string[];
    const actionType = formData.get('actionType')
    const { id } = params;
    const contract: Record<string, string[]> = {};
    const imageBase64 = formData.get("image")?.toString() ?? "";
    const address = formData.get("address")?.toString() ?? ""
    const location = await getLatLngFromAddress(address)
    const tagsString = formData.get("tags")?.toString() ?? "";
    const tags = tagsString ? JSON.parse(tagsString) : [];

    let imageUrl = "";
    if (imageBase64) {
        const uploadedUrl = await uploadImageToCloudinary(imageBase64);
        imageUrl = uploadedUrl ?? "";
    }

    if (actionType === "deleteId") {
        const id = formData.get("id") as string;
        await prisma.store.delete({ where: { id } });
        return redirect("/app/allLocation?message=deleted");
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

    await prisma.store.update({
        where: { id },
        data: {
            storeName: formData.get("storeName")?.toString() ?? "",
            address: formData.get("address")?.toString() ?? "",
            city: formData.get("city")?.toString() ?? "",
            state: formData.get("state")?.toString() ?? "",
            code: formData.get("code")?.toString() ?? "",
            phone: formData.get("phone")?.toString() ?? "",
            image: imageUrl,
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

    return { ok: true };
}

type SocialMedia = {
    id: string;
    platform: string;
    url: string;
};

export default function EditLocation() {
    const fetcher = useFetcher()
    const { store, filter } = useLoaderData()
    const navigate = useNavigate();
    const shopify = useAppBridge()
    const [visibility, setVisibility] = useState("visible");
    const [countSocial, setCountSocial] = useState<SocialMedia[]>([]);
    const [socialResetKey, setSocialResetKey] = useState(0);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState(false)
    const initialFormRef = useRef<FormData | null>(null);
    const initialSocialRef = useRef<SocialMedia[]>([]);
    const isDiscardingRef = useRef(false);
    const initialHoursRef = useRef<typeof dayStatus | null>(null);
    const initialVisibilityRef = useRef<string>("visible");
    const initialImageRef = useRef<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
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
            acc[day] = { disabled: false, valueOpen: "9:00", valueClose: "17:00" };
            return acc;
        }, {} as Record<string, { disabled: boolean; valueOpen: string; valueClose: string }>)
    );

    const initialPreviewRef = useRef<typeof previewData | null>(null);

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

    // Load data từ store vào state
    useEffect(() => {
        if (store && !dataLoaded) {
            setVisibility(store.visibility || "visible");
            setPreview(store.image || null);
            setImageBase64(store.image || null);

            const initialData = {
                storeName: store.storeName || "",
                address: store.address || "",
                phone: store.phone || "",
                city: store.city || "",
                state: store.state || "",
                code: store.code || "",
            };

            setPreviewData(initialData);
            initialPreviewRef.current = initialData;

            // Load hours
            const loadedDayStatus = days.reduce((acc, day) => {
                const key = day.toLowerCase();
                const openValue = store.time?.[`${key}Open`] || "";
                const closeValue = store.time?.[`${key}Close`] || "";

                acc[day] = {
                    disabled: !openValue || !closeValue || (openValue === "close" && closeValue === "close"),
                    valueOpen: openValue || "9:00",
                    valueClose: closeValue || "17:00"
                };
                return acc;
            }, {} as Record<string, { disabled: boolean; valueOpen: string; valueClose: string }>);

            setDayStatus(loadedDayStatus);

            // Load social media
            const existingSocials: SocialMedia[] = [];
            Object.entries(store.contract || {}).forEach(([platform, urls]: [string, any]) => {
                urls.forEach((url: string) => {
                    existingSocials.push({
                        id: crypto.randomUUID(),
                        platform: platform,
                        url: url
                    });
                });
            });

            setCountSocial(existingSocials);
            initialSocialRef.current = JSON.parse(JSON.stringify(existingSocials));
            initialVisibilityRef.current = store.visibility || "visible";
            initialImageRef.current = store.image || null;

            setDataLoaded(true);
        }
    }, [store, dataLoaded]);

    // Initialize sau khi data loaded
    useEffect(() => {
        if (isInitialized || !formRef.current || !dataLoaded) return;

        requestAnimationFrame(() => {
            if (formRef.current) {
                initialFormRef.current = new FormData(formRef.current);
                initialHoursRef.current = JSON.parse(JSON.stringify(dayStatus));
                setIsInitialized(true);
            }
        });
    }, [dataLoaded, isInitialized, dayStatus]);

    // Debounced dirty check
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
            if (!dirty) {
                if (JSON.stringify(countSocial) !== JSON.stringify(initialSocialRef.current)) {
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
                shopify.saveBar.show("location-edit-bar");
            } else {
                shopify.saveBar.hide("location-edit-bar");
            }
        }, 150);
    };

    // Gọi checkDirty khi state thay đổi
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

            shopify.toast.show('Store updated successfully!')
            shopify.saveBar.hide("location-edit-bar");
        }
    }, [fetcher.data]);

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

    const handleAdd = () => {
        const newItem: SocialMedia = {
            id: crypto.randomUUID(),
            platform: "linkedin",
            url: ""
        };
        setCountSocial([...countSocial, newItem]);
    }

    const handleRemove = (id: string) => {
        setCountSocial(prev => prev.filter(item => item.id !== id));
    }

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

    const handleSubmit = () => {
        if (!formRef.current) return;

        const requiredFields = ["storeName", "address", "city", "code"];
        const emptyFields = requiredFields.filter((name) => {
            const el = formRef.current!.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement;
            return !el?.value?.trim();
        });

        if (emptyFields.length > 0) {
            setError(true);
            return;
        }

        setError(false);

        // Normalize hours
        setDayStatus(prev => {
            const updated = { ...prev };
            days.forEach(day => {
                const openValue = prev[day].valueOpen;
                const closeValue = prev[day].valueClose;
                if (!openValue || !closeValue || openValue === "close" || closeValue === "close") {
                    updated[day] = {
                        disabled: true,
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

        if (initialPreviewRef.current) {
            setPreviewData({ ...initialPreviewRef.current });
        }

        setError(false);

        requestAnimationFrame(() => {
            shopify.saveBar.hide("location-edit-bar");
            isDiscardingRef.current = false;
        });
    };

    const handleDelete = (id: string) => {
        const formData = new FormData()
        formData.append("actionType", "deleteId");
        formData.append("id", id);
        fetcher.submit(formData, { method: "post" });
    }

    if (!store) return <div>Loading...</div>;

    return (
        <s-page heading="Dynamic Store Locator">
            <SaveBar id="location-edit-bar">
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
                    <s-text type="strong">Location Editor</s-text>
                    <s-box>
                        <s-box>
                            {
                                visibility === "visible" ?
                                    <s-badge tone="success">
                                        <s-stack direction="inline" alignItems="center">
                                            <s-icon type="eye-check-mark" />
                                            visible
                                        </s-stack>
                                    </s-badge>
                                    :
                                    <s-badge>
                                        <s-stack direction="inline" alignItems="center">
                                            <s-icon type="hide" tone="info" />
                                            hidden
                                        </s-stack>
                                    </s-badge>
                            }
                        </s-box>
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
                                            <s-paragraph >Customize your location information</s-paragraph>
                                        </s-stack>
                                        <s-stack padding="small" gap="small-200">
                                            <s-box>
                                                <s-text-field
                                                    label="Location Name"
                                                    name="storeName"
                                                    error={error === true ? "Location name is required" : ""}
                                                    required
                                                    defaultValue={store.storeName || ""}
                                                    onInput={(e: any) => {
                                                        setPreviewData(prev => ({
                                                            ...prev,
                                                            storeName: e.target.value
                                                        }));
                                                        checkDirty();
                                                    }}
                                                />
                                            </s-box>
                                            <s-box>
                                                <s-text-field
                                                    label="Address"
                                                    name="address"
                                                    error={error === true ? "Address line 1 is required" : ""}
                                                    required
                                                    defaultValue={store.address || ""}
                                                    onInput={(e: any) => {
                                                        setPreviewData(prev => ({
                                                            ...prev,
                                                            address: e.target.value
                                                        }));
                                                        checkDirty();
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
                                                        error={error === true ? "City is required" : ""}
                                                        required
                                                        defaultValue={store.city || ""}
                                                        onInput={(e: any) => {
                                                            setPreviewData(prev => ({
                                                                ...prev,
                                                                city: e.target.value
                                                            }));
                                                            checkDirty();
                                                        }}
                                                    />
                                                </s-grid-item>

                                                <s-grid-item >
                                                    <s-text-field
                                                        label="Zip Code"
                                                        name="code"
                                                        error={error === true ? "Zip code is required" : ""}
                                                        required
                                                        defaultValue={store.code || ""}
                                                        onInput={(e: any) => {
                                                            setPreviewData(prev => ({
                                                                ...prev,
                                                                code: e.target.value
                                                            }));
                                                            checkDirty();
                                                        }}
                                                    />
                                                </s-grid-item>
                                            </s-grid>
                                            <s-grid
                                                gridTemplateColumns="@container (inline-size > 768px) 1fr 1fr, 1fr"
                                                gap="base"
                                            >
                                                <s-grid-item >
                                                    <s-text-field
                                                        label="Phone Number"
                                                        name="phone"
                                                        defaultValue={store.phone || ""}
                                                        onInput={(e: any) => {
                                                            setPreviewData(prev => ({
                                                                ...prev,
                                                                phone: e.target.value
                                                            }));
                                                            checkDirty();
                                                        }}
                                                    />
                                                </s-grid-item>

                                                <s-grid-item >
                                                    <s-text-field
                                                        label="Website"
                                                        name="url"
                                                        defaultValue={store.url || ""}
                                                        onInput={checkDirty}
                                                    />
                                                </s-grid-item>
                                            </s-grid>

                                            <s-text-area
                                                label="Direction"
                                                name="directions"
                                                defaultValue={store.directions || ""}
                                                onInput={checkDirty}
                                            />
                                        </s-stack>
                                    </s-section>

                                    <s-section>
                                        <s-box>
                                            <s-heading>Hours of Operation</s-heading>
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
                                                        <tr key={item}>
                                                            <td>{item}</td>
                                                            <td>
                                                                <s-text-field
                                                                    name={`${item}-open`}
                                                                    value={dayStatus[item].valueOpen}
                                                                    readOnly={dayStatus[item].disabled}
                                                                    onInput={(e: any) => {
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
                                                                    onInput={(e: any) => {
                                                                        setDayStatus(prev => ({
                                                                            ...prev,
                                                                            [item]: { ...prev[item], valueClose: e.target.value }
                                                                        }))
                                                                    }}
                                                                />
                                                            </td>
                                                            <td>
                                                                <s-button icon="clock" variant="tertiary" onClick={() => handleClickDay(item)}></s-button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </s-stack>
                                    </s-section>
                                    <s-section>
                                        <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                                            <s-stack>
                                                <s-heading>Social Media</s-heading>
                                                <s-paragraph>Customize your location information</s-paragraph>
                                            </s-stack>
                                            <s-button icon="plus-circle" onClick={() => handleAdd()}>Add Social Media</s-button>
                                        </s-stack>
                                        <s-stack paddingBlock="small-200" paddingInlineStart="small" gap="small-400">
                                            {
                                                countSocial.map((item) => (
                                                    <s-stack
                                                        direction="inline"
                                                        justifyContent="start"
                                                        gap="small-200"
                                                        alignItems="center"
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
                                            <img src={preview || '/shop.png'} alt="Store" />
                                        </div>

                                        <div className={styles.storeInfo}>
                                            <h3 className={styles.storeName}>{previewData.storeName || ''}</h3>
                                            <div className={styles.contactRow}>
                                                <i className="fa-solid fa-location-dot" ></i>
                                                <span className={styles.storeAddress}> {previewData.address || ''}, {previewData.city || ''}, {previewData.code || ''}</span>
                                            </div>
                                            <div className={styles.contactRow}>
                                                <i className="fa-solid fa-phone" ></i>
                                                <span>{previewData.phone || ''}</span>
                                            </div>

                                            <div className={styles.contactRow}>
                                                <i className="fa-solid fa-clock"></i>
                                                <table>
                                                    <tbody>
                                                        {days.map(day => {
                                                            const status = dayStatus[day];
                                                            if (status.disabled ||
                                                                !status.valueOpen ||
                                                                !status.valueClose ||
                                                                status.valueOpen === "close" ||
                                                                status.valueClose === "close") {
                                                                return null;
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
        </s-page>
    );
}