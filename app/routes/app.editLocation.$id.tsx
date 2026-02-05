import { ActionFunctionArgs, Form, LoaderFunctionArgs, redirect, useFetcher, useLoaderData, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import prisma from "app/db.server";
import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "app/utils/upload.server";
import styles from "../css/addLocation.module.css";
import { SocialPlatform, validateSocialUrl } from "app/utils/socialValidation";
import { validateWebsiteUrl } from "app/utils/websiteValidation";
import { daysList, hourClose, hourOpen } from "app/utils/hourOfOperating";
import { validatePhoneNumber } from "app/utils/phoneValidation";
import { AddressAutocomplete } from "app/component/addressAutocomplete";

export async function loader({ params }: LoaderFunctionArgs) {
    const { id } = params;
    const filter = await prisma.attribute.findMany()
    const store = await prisma.store.findUnique({
        where: { id },
    });
    const googleMapsApiKey = process.env.GOOGLE_MAP_KEY || "";
    return { store, filter, googleMapsApiKey };
}

export async function action({ request, params }: ActionFunctionArgs) {
    const formData = await request.formData();
    const urls = formData.getAll("contract") as string[];
    const actionType = formData.get('actionType')
    const { id } = params;
    const contract: Record<string, string[]> = {};
    const imageBase64 = formData.get("image")?.toString() ?? "";
    const tagsString = formData.get("tags")?.toString() ?? "";
    const tags = tagsString ? JSON.parse(tagsString) : [];
    const region = formData.get("region")?.toString() ?? "";
    const lat = formData.get("lat")?.toString() ?? "";
    const lon = formData.get("lon")?.toString() ?? "";

    if (actionType === "deleteId") {
        const deleteId = formData.get("id") as string;

        const store = await prisma.store.findUnique({
            where: { id: deleteId },
            select: { image: true }
        });

        if (store?.image) {
            await deleteImageFromCloudinary(store.image);
        }

        await prisma.store.delete({ where: { id: deleteId } });

        return redirect("/app/allLocation?message=deleted");
    }

    let imageUrl = "";
    if (imageBase64) {
        const oldStore = await prisma.store.findUnique({
            where: { id },
            select: { image: true }
        });

        const uploadedUrl = await uploadImageToCloudinary(imageBase64);
        imageUrl = uploadedUrl ?? "";

        if (oldStore?.image && oldStore.image !== imageUrl) {
            await deleteImageFromCloudinary(oldStore.image);
        }
    } else {
        const oldStore = await prisma.store.findUnique({
            where: { id },
            select: { image: true }
        });
        imageUrl = oldStore?.image ?? "";
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
            region: region,
            state: formData.get("state")?.toString() ?? "",
            code: formData.get("code")?.toString() ?? "",
            phone: formData.get("phone")?.toString() ?? "",
            image: imageUrl,
            url: formData.get("url")?.toString() ?? "",
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
            lat: lat ? parseFloat(lat) : null,  // Convert string to number
            lng: lon ? parseFloat(lon) : null,
        },
    });

    return { ok: true };
}

type SocialMedia = {
    id: string;
    platform: string;
    url: string;
};

type HourSchedule = {
    day: string;
    openTime: string;
    closeTime: string;
};

export default function EditLocation() {
    const fetcher = useFetcher()
    const { store, filter, googleMapsApiKey } = useLoaderData()
    const navigate = useNavigate();
    const shopify = useAppBridge()
    const [visibility, setVisibility] = useState("visible");
    const [countSocial, setCountSocial] = useState<SocialMedia[]>([]);
    const [socialResetKey, setSocialResetKey] = useState(0);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const initialFormRef = useRef<FormData | null>(null);
    const initialSocialRef = useRef<SocialMedia[]>([]);
    const isDiscardingRef = useRef(false);
    const initialHoursRef = useRef<typeof dayStatus | null>(null);
    const initialVisibilityRef = useRef<string>("visible");
    const initialImageRef = useRef<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [phoneError, setPhoneError] = useState<string>("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [hourErrors, setHourErrors] = useState<Record<number, string>>({});
    const [socialErrors, setSocialErrors] = useState<Record<string, string>>({});
    const [websiteError, setWebsiteError] = useState<string>("");
    const [dataLoaded, setDataLoaded] = useState(false);
    const [isAddressValid, setIsAddressValid] = useState(false);
    const [isAddressChanged, setIsAddressChanged] = useState(false);
    const [coordinates, setCoordinates] = useState({ lat: "", lon: "" });
    const [previewData, setPreviewData] = useState({
        storeName: "",
        address: "",
        phone: "",
        city: "",
        region: "",
        code: "",
        url: "",
    });
    const isSaving = fetcher.state === "submitting" || fetcher.state === "loading";

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const [dayStatus, setDayStatus] = useState(
        days.reduce((acc, day) => {
            acc[day] = { valueOpen: "09:00", valueClose: "17:00" };
            return acc;
        }, {} as Record<string, { valueOpen: string; valueClose: string }>)
    );

    const [hourSchedules, setHourSchedules] = useState<HourSchedule[]>([
        { day: "All days", openTime: "09:00", closeTime: "17:00" }
    ]);
    const initialHourSchedulesRef = useRef<HourSchedule[]>([]);

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

    // Convert hour schedules to dayStatus format
    useEffect(() => {
        const newDayStatus = { ...dayStatus };

        // Reset all days to empty
        days.forEach(day => {
            newDayStatus[day] = { valueOpen: "", valueClose: "" };
        });

        // Apply schedules
        hourSchedules.forEach(schedule => {
            if (schedule.day === "All days") {
                days.forEach(day => {
                    newDayStatus[day] = {
                        valueOpen: schedule.openTime,
                        valueClose: schedule.closeTime
                    };
                });
            } else if (schedule.day === "Weekdays") {
                const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                weekdays.forEach(day => {
                    newDayStatus[day] = {
                        valueOpen: schedule.openTime,
                        valueClose: schedule.closeTime
                    };
                });
            } else if (schedule.day === "Weekends") {
                const weekends = ['Saturday', 'Sunday'];
                weekends.forEach(day => {
                    newDayStatus[day] = {
                        valueOpen: schedule.openTime,
                        valueClose: schedule.closeTime
                    };
                });
            } else {
                newDayStatus[schedule.day] = {
                    valueOpen: schedule.openTime,
                    valueClose: schedule.closeTime
                };
            }
        });

        setDayStatus(newDayStatus);
    }, [hourSchedules]);

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
                region: store.region || "",
                state: store.state || "",
                code: store.code || "",
                url: store.url || "",
            };

            setPreviewData(initialData);
            initialPreviewRef.current = initialData;

            // Load hours
            const loadedDayStatus = days.reduce((acc, day) => {
                const key = day.toLowerCase();
                const openValue = store.time?.[`${key}Open`] || "";
                const closeValue = store.time?.[`${key}Close`] || "";

                acc[day] = {
                    valueOpen: openValue === "close" ? "" : (openValue || "09:00"),
                    valueClose: closeValue === "close" ? "" : (closeValue || "17:00")
                };
                return acc;
            }, {} as Record<string, { valueOpen: string; valueClose: string }>);

            setDayStatus(loadedDayStatus);

            // Convert từ dayStatus sang hourSchedules
            const schedules: HourSchedule[] = [];
            const processedDays = new Set<string>();

            days.forEach(day => {
                if (processedDays.has(day)) return;

                const currentTime = loadedDayStatus[day];
                if (!currentTime.valueOpen || !currentTime.valueClose) return;

                // Check if all days have same time
                const allSame = days.every(d =>
                    loadedDayStatus[d].valueOpen === currentTime.valueOpen &&
                    loadedDayStatus[d].valueClose === currentTime.valueClose
                );

                if (allSame) {
                    schedules.push({
                        day: "All days",
                        openTime: currentTime.valueOpen,
                        closeTime: currentTime.valueClose
                    });
                    days.forEach(d => processedDays.add(d));
                    return;
                }

                // Check weekdays
                const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                const weekdaysSame = weekdays.every(d =>
                    loadedDayStatus[d].valueOpen === currentTime.valueOpen &&
                    loadedDayStatus[d].valueClose === currentTime.valueClose
                );

                if (weekdaysSame && weekdays.includes(day)) {
                    schedules.push({
                        day: "Weekdays",
                        openTime: currentTime.valueOpen,
                        closeTime: currentTime.valueClose
                    });
                    weekdays.forEach(d => processedDays.add(d));
                    return;
                }

                // Check weekends
                const weekends = ['Saturday', 'Sunday'];
                const weekendsSame = weekends.every(d =>
                    loadedDayStatus[d].valueOpen === currentTime.valueOpen &&
                    loadedDayStatus[d].valueClose === currentTime.valueClose
                );

                if (weekendsSame && weekends.includes(day)) {
                    schedules.push({
                        day: "Weekends",
                        openTime: currentTime.valueOpen,
                        closeTime: currentTime.valueClose
                    });
                    weekends.forEach(d => processedDays.add(d));
                    return;
                }

                // Individual day
                schedules.push({
                    day: day,
                    openTime: currentTime.valueOpen,
                    closeTime: currentTime.valueClose
                });
                processedDays.add(day);
            });

            if (schedules.length === 0) {
                schedules.push({ day: "All days", openTime: "09:00", closeTime: "17:00" });
            }

            setHourSchedules(schedules);
            initialHourSchedulesRef.current = JSON.parse(JSON.stringify(schedules));

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
            setCoordinates({
                lat: store.lat?.toString() || "",
                lon: store.lng?.toString() || ""
            });

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

            // Check hour schedules
            if (!dirty) {
                if (JSON.stringify(hourSchedules) !== JSON.stringify(initialHourSchedulesRef.current)) {
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
                shopify.saveBar.show("location-edit-bar");
            } else {
                shopify.saveBar.hide("location-edit-bar");
            }
        }, 150);
    };

    useEffect(() => {
        if (!isInitialized) return;
        checkDirty();
    }, [hourSchedules, imageBase64, countSocial, visibility, isInitialized]);

    // Save success
    useEffect(() => {
        if (fetcher.data?.ok && formRef.current) {
            initialFormRef.current = new FormData(formRef.current);
            initialHoursRef.current = JSON.parse(JSON.stringify(dayStatus));
            initialSocialRef.current = JSON.parse(JSON.stringify(countSocial));
            initialVisibilityRef.current = visibility;
            initialImageRef.current = imageBase64;
            initialHourSchedulesRef.current = JSON.parse(JSON.stringify(hourSchedules));
            setHourErrors({});
            setPhoneError("");

            shopify.toast.show('Store updated successfully!')
            shopify.saveBar.hide("location-edit-bar");
        }
    }, [fetcher.data]);

    const handleAddHourSchedule = () => {
        setHourSchedules([...hourSchedules, {
            day: "Monday",
            openTime: "09:00",
            closeTime: "17:00"
        }]);
    };

    const handleRemoveHourSchedule = (index: number) => {
        setHourSchedules(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateHourSchedule = (index: number, field: keyof HourSchedule, value: string) => {
        setHourSchedules(prev => prev.map((schedule, i) =>
            i === index ? { ...schedule, [field]: value } : schedule
        ));
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

        const newErrors: Record<string, string> = {};
        const requiredFields = ["storeName", "address", "city", "region", "phone"];
        requiredFields.forEach((name) => {
            const el = formRef.current!.elements.namedItem(name) as HTMLInputElement;
            if (!el?.value?.trim()) {
                newErrors[name] = "Please fill in this field";
            }
        });

        if (isAddressChanged && !isAddressValid) {
            newErrors.address = "We couldn’t find this address on the map.Please check the address or select a valid location from suggestions.";
        }

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            return;
        }

        const phoneField = formRef.current.elements.namedItem('phone') as HTMLInputElement;
        if (phoneField?.value?.trim()) {
            const phoneValidation = validatePhoneNumber(phoneField.value);
            if (!phoneValidation.isValid) {
                setPhoneError(phoneValidation.message || 'Invalid phone number');
                return;
            }
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

        const newHourErrors: Record<number, string> = {};
        hourSchedules.forEach((schedule, index) => {
            if (schedule.openTime && schedule.closeTime &&
                schedule.openTime !== "close" && schedule.closeTime !== "close") {
                if (schedule.openTime >= schedule.closeTime) {
                    newHourErrors[index] = "Opening time must be before closing time";
                }
            }
        });

        if (Object.keys(newHourErrors).length > 0) {
            setHourErrors(newHourErrors);
            return;
        }

        // Validate social media
        const socialValidationErrors: Record<string, string> = {};
        countSocial.forEach(item => {
            if (item.url.trim()) {
                const validation = validateSocialUrl(item.url, item.platform as SocialPlatform);
                if (!validation.isValid) {
                    socialValidationErrors[item.id] = validation.message || 'Invalid URL';
                }
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

        setCoordinates({
            lat: store.lat?.toString() || "",
            lon: store.lng?.toString() || ""
        });

        setPreview(initialImageRef.current);
        setImageBase64(initialImageRef.current);
        setVisibility(initialVisibilityRef.current);
        setCountSocial(JSON.parse(JSON.stringify(initialSocialRef.current)));
        setSocialResetKey(prev => prev + 1);
        setHourSchedules(JSON.parse(JSON.stringify(initialHourSchedulesRef.current)));

        if (initialHoursRef.current) {
            setDayStatus(JSON.parse(JSON.stringify(initialHoursRef.current)));
        }

        if (initialPreviewRef.current) {
            setPreviewData({ ...initialPreviewRef.current });
        }

        setIsAddressValid(true);
        setIsAddressChanged(false);

        setPhoneError("");
        setSocialErrors({});
        setWebsiteError("");
        setHourErrors({});
        setFieldErrors({});

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
                        <s-button
                            variant="tertiary"
                            onClick={() => {
                                handleDiscard();
                                requestAnimationFrame(() => {
                                    navigate('/app/allLocation');
                                });
                            }}
                            icon="arrow-left"
                        >
                        </s-button>
                    </s-box>
                    <text style={{ fontSize: 16, fontWeight: 600 }}>{store.storeName}</text>
                    <s-box>
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
                {days.map(day => (
                    <div key={day} style={{ display: 'none' }}>
                        <input type="hidden" name={`${day}-open`} value={dayStatus[day].valueOpen} />
                        <input type="hidden" name={`${day}-close`} value={dayStatus[day].valueClose} />
                    </div>
                ))}

                <input type="hidden" name="lat" value={coordinates.lat} />
                <input type="hidden" name="lon" value={coordinates.lon} />

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
                                        <s-stack paddingBlockStart="small-200" gap="small-200">
                                            <s-box>
                                                <s-text-field
                                                    label="Location Name"
                                                    name="storeName"
                                                    error={fieldErrors.storeName}
                                                    required
                                                    defaultValue={store.storeName || ""}
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
                                                <AddressAutocomplete
                                                    defaultValue={store.address || ""}
                                                    error={fieldErrors.address}
                                                    checkDirty={checkDirty}
                                                    googleMapsApiKey={googleMapsApiKey}
                                                    onValidationChange={(isValid) => {
                                                        setIsAddressValid(isValid); // CẬP NHẬT TRẠNG THÁI
                                                        setIsAddressChanged(true);

                                                        // XÓA LỖI NẾU HỢP LỆ
                                                        if (isValid) {
                                                            setFieldErrors(prev => {
                                                                const next = { ...prev };
                                                                delete next.address;
                                                                return next;
                                                            });
                                                        }
                                                    }}
                                                    onAddressChange={(value) => {
                                                        setPreviewData(prev => ({ ...prev, address: value }));
                                                        setIsAddressChanged(true);

                                                        if (value.trim()) {
                                                            setFieldErrors(prev => {
                                                                const next = { ...prev };
                                                                delete next.address;
                                                                return next;
                                                            });
                                                        }
                                                        checkDirty();
                                                    }}
                                                    onSelect={(data) => {
                                                        setIsAddressChanged(true);
                                                        // Update form fields
                                                        setCoordinates({
                                                            lat: data.lat,
                                                            lon: data.lon
                                                        });
                                                        if (formRef.current) {
                                                            // KHÔNG CẬP NHẬT addressField nữa, để AddressAutocomplete tự quản lý
                                                            // const addressField = formRef.current.elements.namedItem('address') as HTMLInputElement;
                                                            const cityField = formRef.current.elements.namedItem('city') as HTMLInputElement;
                                                            const codeField = formRef.current.elements.namedItem('code') as HTMLInputElement;
                                                            const regionField = formRef.current.elements.namedItem('region') as HTMLInputElement;
                                                            const latField = formRef.current.elements.namedItem('lat') as HTMLInputElement;
                                                            const lonField = formRef.current.elements.namedItem('lon') as HTMLInputElement;

                                                            // if (addressField) addressField.value = data.address; // BỎ DÒNG NÀY
                                                            if (cityField) cityField.value = data.city;
                                                            if (codeField) codeField.value = data.code;
                                                            if (regionField) regionField.value = data.region;
                                                            if (latField) latField.value = data.lat;
                                                            if (lonField) lonField.value = data.lon;

                                                            // Update preview với address từ input hiện tại
                                                            setPreviewData(prev => ({
                                                                ...prev,
                                                                // address sẽ được cập nhật qua onAddressChange
                                                                address: data.address,
                                                                city: data.city,
                                                                code: data.code,
                                                                region: data.region,
                                                            }));

                                                            // Clear errors
                                                            setFieldErrors(prev => {
                                                                const next = { ...prev };
                                                                delete next.address;
                                                                delete next.city;
                                                                delete next.region;
                                                                return next;
                                                            });
                                                        }
                                                    }}
                                                />
                                            </s-box>
                                            <s-grid
                                                gridTemplateColumns="@container (inline-size > 768px) 1fr 1fr 1fr, 1fr"
                                                gap="base"
                                            >
                                                <s-grid-item>
                                                    <s-text-field
                                                        label="City"
                                                        name="city"
                                                        error={fieldErrors.city}
                                                        required
                                                        defaultValue={store.city || ""}
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
                                                            checkDirty()
                                                        }}
                                                    />
                                                </s-grid-item>

                                                <s-grid-item>
                                                    <s-text-field
                                                        label="Country"
                                                        name="region"
                                                        error={fieldErrors.region}
                                                        required
                                                        defaultValue={store.region || ""}
                                                        onInput={(e: any) => {
                                                            const value = e.target.value;
                                                            setPreviewData(prev => ({ ...prev, region: value }));

                                                            if (value.trim()) {
                                                                setFieldErrors(prev => {
                                                                    const next = { ...prev };
                                                                    delete next.region;
                                                                    return next;
                                                                });
                                                            }
                                                            checkDirty()
                                                        }}
                                                    />
                                                </s-grid-item>

                                                <s-grid-item>
                                                    <s-text-field
                                                        label="Zip Code"
                                                        name="code"
                                                        defaultValue={store.code || ""}
                                                        onInput={(e: any) => {
                                                            const value = e.target.value;
                                                            setPreviewData(prev => ({ ...prev, code: value }));
                                                            checkDirty()
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
                                                        required
                                                        defaultValue={store.phone || ""}
                                                        error={fieldErrors.phone || phoneError}
                                                        onInput={(e: any) => {
                                                            const value = e.target.value;
                                                            setPreviewData(prev => ({
                                                                ...prev,
                                                                phone: value
                                                            }));
                                                            checkDirty();

                                                            // Clear both required and format errors
                                                            if (value.trim()) {
                                                                setFieldErrors(prev => {
                                                                    const next = { ...prev };
                                                                    delete next.phone;
                                                                    return next;
                                                                });

                                                                const validation = validatePhoneNumber(value);
                                                                if (validation.isValid) {
                                                                    setPhoneError("");
                                                                }
                                                            } else {
                                                                setPhoneError("");
                                                            }
                                                        }}
                                                    />
                                                </s-grid-item>

                                                <s-grid-item>
                                                    <s-text-field
                                                        label="Website"
                                                        name="url"
                                                        placeholder="http://example.com/"
                                                        defaultValue={store.url || ""}
                                                        error={websiteError}
                                                        onInput={(e: any) => {
                                                            const value = e.target.value;
                                                            checkDirty();
                                                            setPreviewData(prev => ({
                                                                ...prev,
                                                                url: value
                                                            }));

                                                            // Clear error when user types
                                                            if (!value.trim()) {
                                                                setWebsiteError("");
                                                                return;
                                                            }

                                                            const validation = validateWebsiteUrl(value);
                                                            if (validation.isValid) {
                                                                setWebsiteError("");
                                                            }
                                                        }}
                                                    />
                                                </s-grid-item>
                                            </s-grid>
                                        </s-stack>
                                    </s-section>

                                    <s-section>
                                        <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                                            <s-heading>Hours of Operation</s-heading>
                                            <s-button icon="plus-circle" onClick={handleAddHourSchedule}>
                                                Add Hours
                                            </s-button>
                                        </s-stack>
                                        <s-stack paddingBlockStart="small-200" gap="small-400">
                                            {hourSchedules.map((schedule, index) => (
                                                <s-stack key={index}>
                                                    <s-stack
                                                        direction="inline"
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                        gap="small-200"
                                                    >
                                                        <div style={{ width: "29%" }}>
                                                            <s-select
                                                                value={schedule.day}
                                                                onChange={(e: any) => {
                                                                    handleUpdateHourSchedule(index, 'day', e.target.value);
                                                                }}
                                                            >
                                                                {daysList.map((item) => (
                                                                    <s-option key={item} value={item}>{item}</s-option>
                                                                ))}
                                                            </s-select>
                                                        </div>
                                                        <div style={{ width: "29%" }}>
                                                            <s-select
                                                                value={schedule.openTime}
                                                                onChange={(e: any) => {
                                                                    const newValue = e.target.value;
                                                                    handleUpdateHourSchedule(index, 'openTime', newValue);

                                                                    // Clear error if fixed
                                                                    const updatedSchedule = { ...schedule, openTime: newValue };
                                                                    if (updatedSchedule.openTime && updatedSchedule.closeTime &&
                                                                        updatedSchedule.openTime !== "close" && updatedSchedule.closeTime !== "close") {
                                                                        if (updatedSchedule.openTime < updatedSchedule.closeTime) {
                                                                            setHourErrors(prev => {
                                                                                const next = { ...prev };
                                                                                delete next[index];
                                                                                return next;
                                                                            });
                                                                        }
                                                                    }
                                                                }}
                                                            >
                                                                {hourOpen.map((item) => (
                                                                    <s-option key={item} value={item}>{item}</s-option>
                                                                ))}
                                                            </s-select>
                                                        </div>
                                                        <span>to</span>
                                                        <div style={{ width: "29%" }}>
                                                            <s-select
                                                                value={schedule.closeTime}
                                                                onChange={(e: any) => {
                                                                    const newValue = e.target.value;
                                                                    handleUpdateHourSchedule(index, 'closeTime', newValue);

                                                                    // THÊM LOGIC KIỂM TRA GIỐNG OPENTIME
                                                                    const updatedSchedule = { ...schedule, closeTime: newValue };
                                                                    if (updatedSchedule.openTime && updatedSchedule.closeTime &&
                                                                        updatedSchedule.openTime !== "close" && updatedSchedule.closeTime !== "close") {
                                                                        if (updatedSchedule.openTime < updatedSchedule.closeTime) {
                                                                            setHourErrors(prev => {
                                                                                const next = { ...prev };
                                                                                delete next[index];
                                                                                return next;
                                                                            });
                                                                        }
                                                                    }
                                                                }}
                                                            >
                                                                {hourClose.map((item) => (
                                                                    <s-option key={item} value={item}>{item}</s-option>
                                                                ))}
                                                            </s-select>
                                                        </div>
                                                        <div style={{ marginTop: 2 }}>
                                                            <s-button
                                                                icon="delete"
                                                                onClick={() => handleRemoveHourSchedule(index)}
                                                            />
                                                        </div>
                                                    </s-stack>
                                                    <div>
                                                        {hourErrors[index] && (
                                                            <s-text tone="critical">{hourErrors[index]}</s-text>
                                                        )}
                                                    </div>
                                                </s-stack>
                                            ))}
                                        </s-stack>
                                    </s-section>

                                    <s-section>
                                        <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                                            <s-stack>
                                                <s-heading>Social Media</s-heading>
                                            </s-stack>
                                            <s-button icon="plus-circle" onClick={() => handleAdd()}>Add Social Media</s-button>
                                        </s-stack>
                                        <s-stack paddingBlockStart="small" gap="small-200">
                                            {
                                                countSocial.map((item) => (
                                                    <s-stack
                                                        direction="inline"
                                                        justifyContent="start"
                                                        gap="small-200"
                                                        alignItems="start"
                                                        key={`${socialResetKey}-${item.id}`}
                                                    >
                                                        <div style={{ width: "20%", marginTop: -4 }}>
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
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <s-text-field
                                                                name="contract"
                                                                value={item.url}
                                                                placeholder={`https://www.${item.platform}.com/`}
                                                                error={socialErrors[item.id]}
                                                                onInput={(e: any) => {
                                                                    const value = e.target.value;
                                                                    setCountSocial(prev =>
                                                                        prev.map(social =>
                                                                            social.id === item.id
                                                                                ? { ...social, url: value }
                                                                                : social
                                                                        )
                                                                    );
                                                                    if (value.trim()) {
                                                                        const validation = validateSocialUrl(value, item.platform as SocialPlatform);
                                                                        if (validation.isValid) {
                                                                            // Nếu hợp lệ thì xóa lỗi ngay
                                                                            setSocialErrors(prev => {
                                                                                const next = { ...prev };
                                                                                delete next[item.id];
                                                                                return next;
                                                                            });
                                                                        }
                                                                    } else {
                                                                        // Nếu xóa trống thì cũng xóa lỗi
                                                                        setSocialErrors(prev => {
                                                                            const next = { ...prev };
                                                                            delete next[item.id];
                                                                            return next;
                                                                        });
                                                                    }
                                                                }}
                                                            // onBlur={(e: any) => {
                                                            //     const url = e.target.value;
                                                            //     if (url.trim()) {
                                                            //         validateSocialMedia(item.id, url, item.platform as SocialPlatform);
                                                            //     }
                                                            // }}
                                                            />
                                                        </div>
                                                        <div style={{ marginTop: 2 }}>
                                                            <s-button
                                                                icon="delete"
                                                                onClick={() => handleRemove(item.id)}
                                                            />
                                                        </div>
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
                                            </s-box>
                                            <s-stack direction="inline" justifyContent="space-between" paddingBlockStart="small-200" alignItems="center">
                                                <s-stack background="subdued" paddingInline="large-500" borderStyle="dashed" borderWidth="small" borderRadius="large" paddingBlock="large-300" alignItems="center" justifyContent="center" direction="block" inlineSize="100%">
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
                                                <i className="fa-solid fa-location-dot"></i>
                                                <span className={styles.storeAddress}> {previewData.address || ''}, {previewData.city || ''}, {previewData.region || ''}{previewData.code !== '' ? ', ' + previewData.code : ''}</span>
                                            </div>
                                            <div className={styles.contactRow}>
                                                <i className="fa-solid fa-phone"></i>
                                                <span>{previewData.phone || ''}</span>
                                            </div>

                                            <div className={styles.contactRow}>
                                                <i className="fa-solid fa-earth-americas"></i>
                                                <s-link href={previewData.url}><text style={{ color: '#303030' }}>{previewData.url || 'http://example.com/'}</text></s-link>
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
                                                            <a
                                                                href={item.url}
                                                                target="_blank"
                                                                key={item.id}
                                                                className={styles[item.platform]}
                                                            >
                                                                <i
                                                                    className={`fa-brands ${iconClass}`}
                                                                />
                                                            </a>
                                                        );
                                                    })
                                                }
                                            </div>

                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat || ''},${coordinates.lon || ''}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={styles.directionButton}
                                                style={{
                                                    backgroundColor: 'blue',
                                                    color: '#ffffff'
                                                }}
                                            >
                                                <i className="fa-solid fa-diamond-turn-right"></i>
                                                Get Direction
                                            </a>
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