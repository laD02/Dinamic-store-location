import { ActionFunctionArgs, Form, LoaderFunctionArgs, redirect, useFetcher, useLoaderData, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import prisma from "app/db.server";
import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "app/utils/upload.server";
import { SocialPlatform, validateSocialUrl } from "app/utils/socialValidation";
import { validateWebsiteUrl } from "app/utils/websiteValidation";
import { validatePhoneNumber } from "app/utils/phoneValidation";
import EditLocationHeader from "app/component/addLocation/EditLocationHeader";
import LocationInfoSection from "app/component/addLocation/LocationInfoSection";
import TagsSection from "app/component/addLocation/TagsSection";
import HoursOfOperationSection from "app/component/addLocation/HoursOfOperationSection";
import SocialMediaSection from "app/component/addLocation/SocialMediaSection";
import LocationSidebar from "app/component/addLocation/LocationSidebar";

export async function loader({ params }: LoaderFunctionArgs) {
    const { id } = params;
    const store = await prisma.store.findUnique({
        where: { id },
    });
    const googleMapsApiKey = process.env.GOOGLE_MAP_KEY || "";
    return { store, googleMapsApiKey };
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
    const { store, googleMapsApiKey } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const shopify = useAppBridge()
    const [visibility, setVisibility] = useState("visible");
    const [countSocial, setCountSocial] = useState<SocialMedia[]>([]);
    const [socialResetKey, setSocialResetKey] = useState(0);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const initialFormRef = useRef<FormData | null>(null);
    const initialSocialRef = useRef<SocialMedia[]>([]);
    const isDiscardingRef = useRef(false);
    const initialHoursRef = useRef<typeof dayStatus | null>(null);
    const initialVisibilityRef = useRef<string>("visible");
    const initialImageRef = useRef<string | null>(null);
    const initialTagsRef = useRef<string[]>([]);
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
        state: "",
        code: "",
        url: "",
        lat: "",
        lon: ""
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
    const lastProcessedDataRef = useRef<any>(null);

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
                lat: store.lat?.toString() || "",
                lon: store.lng?.toString() || "",
            };

            setPreviewData(initialData);
            setCoordinates({
                lat: initialData.lat,
                lon: initialData.lon
            });
            initialPreviewRef.current = initialData;

            // Load hours
            const loadedDayStatus = days.reduce((acc, day) => {
                const key = day.toLowerCase();
                const time = (store.time as any) || {};
                const openValue = time[`${key}Open`] || "";
                const closeValue = time[`${key}Close`] || "";

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
            const loadedTags = store.tags
                ? (Array.isArray(store.tags) ? store.tags as string[] : JSON.parse(store.tags as string))
                : [];
            const filteredTags = loadedTags.filter((t: string) => t && t.trim() !== "");
            setTags(filteredTags);
            initialTagsRef.current = [...filteredTags];

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

                // Coordinates may not be in form elements, they are in hidden inputs updated by state
                // But tags are in a hidden input too.

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
                if (key.endsWith("-open") || key.endsWith("-close") || key === "image" || key === "contract" || key === "tags") continue;
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

            // Check tags
            if (!dirty) {
                if (JSON.stringify(tags) !== JSON.stringify(initialTagsRef.current)) {
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
    }, [hourSchedules, imageBase64, countSocial, visibility, tags, isInitialized]);

    // Save success
    useEffect(() => {
        if (fetcher.data?.ok && fetcher.data !== lastProcessedDataRef.current && formRef.current) {
            lastProcessedDataRef.current = fetcher.data;
            initialFormRef.current = new FormData(formRef.current);
            initialHoursRef.current = JSON.parse(JSON.stringify(dayStatus));
            initialSocialRef.current = JSON.parse(JSON.stringify(countSocial));
            initialVisibilityRef.current = visibility;
            initialImageRef.current = imageBase64;
            initialTagsRef.current = [...tags];
            initialHourSchedulesRef.current = JSON.parse(JSON.stringify(hourSchedules));
            setHourErrors({});
            setPhoneError("");

            shopify.toast.show('Store updated successfully!')
            shopify.saveBar.hide("location-edit-bar");
        }
    }, [fetcher.data, dayStatus, countSocial, visibility, imageBase64, tags, hourSchedules]);

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

    const callPhone = (phone: string) => {
        window.top!.location.href = `tel:${phone}`;
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
            lat: store?.lat?.toString() || "",
            lon: store?.lng?.toString() || ""
        });

        setPreview(initialImageRef.current);
        setImageBase64(initialImageRef.current);
        setVisibility(initialVisibilityRef.current);
        setCountSocial(JSON.parse(JSON.stringify(initialSocialRef.current)));
        setSocialResetKey(prev => prev + 1);
        setHourSchedules(JSON.parse(JSON.stringify(initialHourSchedulesRef.current)));
        setTags([...initialTagsRef.current]);

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
                <button onClick={() => handleDiscard()} disabled={isSaving}>
                    Discard
                </button>
            </SaveBar>

            <EditLocationHeader
                storeName={store.storeName}
                storeId={store.id}
                visibility={visibility}
                onBack={() => {
                    handleDiscard();
                    requestAnimationFrame(() => navigate('/app/allLocations'));
                }}
                onDelete={handleDelete}
            />

            <Form method="post" ref={formRef}>
                {days.map(day => (
                    <div key={day} style={{ display: 'none' }}>
                        <input type="hidden" name={`${day}-open`} value={dayStatus[day].valueOpen} />
                        <input type="hidden" name={`${day}-close`} value={dayStatus[day].valueClose} />
                    </div>
                ))}
                <input type="hidden" name="lat" value={coordinates.lat} />
                <input type="hidden" name="lon" value={coordinates.lon} />
                <input type="hidden" name="tags" value={JSON.stringify(tags.filter(t => t.trim() !== ""))} />

                <s-query-container>
                    <s-grid
                        gridTemplateColumns="@container (inline-size > 768px) 2fr 1fr, 1fr"
                        gap="base"
                    >
                        <s-grid-item>
                            <s-stack>
                                <input type="hidden" name="visibility" value={visibility} />
                                <s-stack gap="base">
                                    <LocationInfoSection
                                        googleMapsApiKey={googleMapsApiKey}
                                        fieldErrors={fieldErrors}
                                        phoneError={phoneError}
                                        websiteError={websiteError}
                                        formRef={formRef}
                                        previewData={previewData}
                                        defaultValues={{
                                            storeName: store.storeName || "",
                                            address: store.address || "",
                                            city: store.city || "",
                                            region: store.region || "",
                                            code: store.code || "",
                                            phone: store.phone || "",
                                            url: store.url || "",
                                        }}
                                        onPreviewChange={(data) => setPreviewData(prev => ({ ...prev, ...data }))}
                                        onClearFieldError={(field) => setFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next; })}
                                        onPhoneErrorChange={setPhoneError}
                                        onWebsiteErrorChange={setWebsiteError}
                                        onAddressValidChange={setIsAddressValid}
                                        onAddressChanged={() => setIsAddressChanged(true)}
                                        onCoordinatesChange={(lat, lon) => setCoordinates({ lat, lon })}
                                        checkDirty={checkDirty}
                                    />

                                    <HoursOfOperationSection
                                        hourSchedules={hourSchedules}
                                        hourErrors={hourErrors}
                                        onAdd={handleAddHourSchedule}
                                        onRemove={handleRemoveHourSchedule}
                                        onUpdate={handleUpdateHourSchedule}
                                        onClearError={(index) => setHourErrors(prev => { const next = { ...prev }; delete next[index]; return next; })}
                                    />
                                    <SocialMediaSection
                                        countSocial={countSocial}
                                        socialErrors={socialErrors}
                                        socialResetKey={socialResetKey}
                                        onAdd={handleAdd}
                                        onRemove={handleRemove}
                                        onChange={(id, field, value) => {
                                            setCountSocial(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
                                        }}
                                        onClearError={(id) => setSocialErrors(prev => { const next = { ...prev }; delete next[id]; return next; })}
                                        onValidatePlatform={validateSocialMedia}
                                        setSocialErrors={setSocialErrors}
                                    />
                                    <TagsSection
                                        tags={tags}
                                        onTagsChange={setTags}
                                        checkDirty={checkDirty}
                                    />
                                </s-stack>
                            </s-stack>
                        </s-grid-item>

                        <s-grid-item>
                            <LocationSidebar
                                visibility={visibility}
                                onVisibilityChange={setVisibility}
                                preview={preview}
                                imageBase64={imageBase64}
                                onImageChange={(base64, previewUrl) => {
                                    setImageBase64(base64);
                                    setPreview(previewUrl);
                                }}
                                previewData={previewData}
                                countSocial={countSocial}
                                dayStatus={dayStatus}
                                days={days}
                                coordinates={coordinates}
                                onCallPhone={callPhone}
                                tags={tags}
                            />
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