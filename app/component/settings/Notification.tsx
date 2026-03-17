import { useState, useEffect, useMemo } from "react";
import { useFetcher } from "react-router";
import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";

export default function Notification({ setting }: { setting: any }) {
    const fetcher = useFetcher();
    const testFetcher = useFetcher();
    const shopify = useAppBridge();
    const [dayOfWeek, setDayOfWeek] = useState("Monday");
    const [dayOfMonth, setDayOfMonth] = useState("1");
    const [dailyTime, setDailyTime] = useState("09:00");
    const [weeklyTime, setWeeklyTime] = useState("09:00");
    const [monthlyTime, setMonthlyTime] = useState("09:00");
    const [inAppDaily, setInAppDaily] = useState(false);
    const [inAppWeekly, setInAppWeekly] = useState(false);
    const [inAppMonthly, setInAppMonthly] = useState(false);

    useEffect(() => {
        if (setting) {
            setDayOfWeek(setting.dayOfWeek || "Monday");
            setDayOfMonth(setting.dayOfMonth?.toString() || "1");
            setDailyTime(setting.dailyTime || "09:00");
            setWeeklyTime(setting.weeklyTime || "09:00");
            setMonthlyTime(setting.monthlyTime || "09:00");
            setInAppDaily(setting.inAppDaily || false);
            setInAppWeekly(setting.inAppWeekly || false);
            setInAppMonthly(setting.inAppMonthly || false);
        }
    }, [setting]);

    const initialValues = useMemo(() => ({
        dayOfWeek: setting?.dayOfWeek || "Monday",
        dayOfMonth: setting?.dayOfMonth?.toString() || "1",
        dailyTime: setting?.dailyTime || "09:00",
        weeklyTime: setting?.weeklyTime || "09:00",
        monthlyTime: setting?.monthlyTime || "09:00",
        inAppDaily: setting?.inAppDaily || false,
        inAppWeekly: setting?.inAppWeekly || false,
        inAppMonthly: setting?.inAppMonthly || false,
    }), [setting]);

    const isDirty = useMemo(() => {
        return dayOfWeek !== initialValues.dayOfWeek ||
            dayOfMonth !== initialValues.dayOfMonth ||
            dailyTime !== initialValues.dailyTime ||
            weeklyTime !== initialValues.weeklyTime ||
            monthlyTime !== initialValues.monthlyTime ||
            inAppDaily !== initialValues.inAppDaily ||
            inAppWeekly !== initialValues.inAppWeekly ||
            inAppMonthly !== initialValues.inAppMonthly;
    }, [dayOfWeek, dayOfMonth, dailyTime, weeklyTime, monthlyTime, inAppDaily, inAppWeekly, inAppMonthly, initialValues]);

    useEffect(() => {
        if (isDirty) {
            shopify.saveBar.show("email-settings-save-bar");
        } else {
            shopify.saveBar.hide("email-settings-save-bar");
        }
    }, [isDirty, shopify]);

    const handleSave = () => {
        const formData = new FormData();
        formData.append("dayOfWeek", dayOfWeek);
        formData.append("dayOfMonth", dayOfMonth);
        formData.append("dailyTime", dailyTime);
        formData.append("weeklyTime", weeklyTime);
        formData.append("monthlyTime", monthlyTime);
        formData.append("inAppDaily", inAppDaily.toString());
        formData.append("inAppWeekly", inAppWeekly.toString());
        formData.append("inAppMonthly", inAppMonthly.toString());
        fetcher.submit(formData, { method: "post" });
    };

    const handleDiscard = () => {
        setDayOfWeek(initialValues.dayOfWeek);
        setDayOfMonth(initialValues.dayOfMonth);
        setDailyTime(initialValues.dailyTime);
        setWeeklyTime(initialValues.weeklyTime);
        setMonthlyTime(initialValues.monthlyTime);
        setInAppDaily(initialValues.inAppDaily);
        setInAppWeekly(initialValues.inAppWeekly);
        setInAppMonthly(initialValues.inAppMonthly);
    };

    useEffect(() => {
        if (fetcher.data?.ok && !fetcher.data?.test) {
            shopify.toast.show("Settings saved successfully!");
            shopify.saveBar.hide("email-settings-save-bar");
        }
    }, [fetcher.data, shopify]);

    useEffect(() => {
        if (testFetcher.data?.test) {
            if (testFetcher.data?.ok) {
                shopify.toast.show(`Test notification sent! (${testFetcher.data.sent} sent)`);
            } else {
                shopify.toast.show(testFetcher.data.message || "No notifications enabled.", { isError: true });
            }
        }
    }, [testFetcher.data, shopify]);

    const handleSendTest = () => {
        const formData = new FormData();
        formData.append("_action", "test");
        testFetcher.submit(formData, { method: "post" });
    };

    const isSaving = fetcher.state === "submitting" || fetcher.state === "loading";
    const isTesting = testFetcher.state === "submitting" || testFetcher.state === "loading";

    const timeOptions = useMemo(() => {
        return Array.from({ length: 48 }, (_, i) => {
            const hours = Math.floor(i / 2).toString().padStart(2, '0');
            const minutes = (i % 2 === 0 ? '00' : '30');
            return `${hours}:${minutes}`;
        });
    }, []);

    return (
        <>
            <SaveBar id="email-settings-save-bar">
                <button variant="primary" onClick={handleSave} loading={isSaving ? "true" : undefined}>
                    Save
                </button>
                <button onClick={handleDiscard} disabled={isSaving}>
                    Discard
                </button>
            </SaveBar>
            <s-stack gap="base">
                <s-section>
                    <s-stack gap="base">
                        <s-stack direction="inline" alignItems="center" gap="small-400">
                            <s-icon type="notification"></s-icon>
                            <h2>Notification Settings</h2>
                        </s-stack>

                        <s-text color="subdued">
                            Choose when you want to receive in-app analytics reports.
                        </s-text>

                        <div style={{ border: '1px solid var(--s-color-border-subdued)', borderRadius: '8px', overflow: 'hidden' }}>
                            <s-box padding="base" background="base">
                                <s-stack gap="large">
                                    <s-stack gap="base" direction="block">
                                        <s-heading>Report Frequency</s-heading>
                                        <s-text color="subdued">Select the reports you'd like to receive in your notification center.</s-text>

                                        <s-stack gap="large" direction="block" paddingBlockStart="small">
                                            {/* Daily Report */}
                                            <s-stack gap="base" direction="block">
                                                <s-checkbox
                                                    label="Daily Analytics Summary"
                                                    checked={inAppDaily}
                                                    onChange={(e: any) => setInAppDaily(e.currentTarget.checked)}
                                                />
                                                {inAppDaily && (
                                                    <div style={{ paddingInlineStart: 'var(--s-spacing-large-100)', paddingBlockStart: 'var(--s-spacing-small-200)' }}>
                                                        <s-select
                                                            label="Delivery Time"
                                                            value={dailyTime}
                                                            onChange={(e: any) => setDailyTime(e.currentTarget.value)}
                                                        >
                                                            {timeOptions.map(time => (
                                                                <s-option key={time} value={time}>{time}</s-option>
                                                            ))}
                                                        </s-select>
                                                    </div>
                                                )}
                                            </s-stack>

                                            <s-divider />

                                            {/* Weekly Report */}
                                            <s-stack gap="base" direction="block">
                                                <s-checkbox
                                                    label="Weekly Performance Overview"
                                                    checked={inAppWeekly}
                                                    onChange={(e: any) => setInAppWeekly(e.currentTarget.checked)}
                                                />
                                                {inAppWeekly && (
                                                    <div style={{ paddingInlineStart: 'var(--s-spacing-large-100)', paddingBlockStart: 'var(--s-spacing-small-200)' }}>
                                                        <s-stack direction="inline" gap="small">
                                                            <s-select
                                                                label="Day of week"
                                                                value={dayOfWeek}
                                                                onChange={(e: any) => setDayOfWeek(e.currentTarget.value)}
                                                            >
                                                                <s-option value="Monday">Monday</s-option>
                                                                <s-option value="Tuesday">Tuesday</s-option>
                                                                <s-option value="Wednesday">Wednesday</s-option>
                                                                <s-option value="Thursday">Thursday</s-option>
                                                                <s-option value="Friday">Friday</s-option>
                                                                <s-option value="Saturday">Saturday</s-option>
                                                                <s-option value="Sunday">Sunday</s-option>
                                                            </s-select>
                                                            <s-select
                                                                label="Delivery Time"
                                                                value={weeklyTime}
                                                                onChange={(e: any) => setWeeklyTime(e.currentTarget.value)}
                                                            >
                                                                {timeOptions.map(time => (
                                                                    <s-option key={time} value={time}>{time}</s-option>
                                                                ))}
                                                            </s-select>
                                                        </s-stack>
                                                    </div>
                                                )}
                                            </s-stack>

                                            <s-divider />

                                            {/* Monthly Report */}
                                            <s-stack gap="base" direction="block">
                                                <s-checkbox
                                                    label="Monthly Insights & Trends"
                                                    checked={inAppMonthly}
                                                    onChange={(e: any) => setInAppMonthly(e.currentTarget.checked)}
                                                />
                                                {inAppMonthly && (
                                                    <div style={{ paddingInlineStart: 'var(--s-spacing-large-100)', paddingBlockStart: 'var(--s-spacing-small-200)' }}>
                                                        <s-stack direction="inline" gap="small">
                                                            <s-select
                                                                label="Day of month"
                                                                value={dayOfMonth}
                                                                onChange={(e: any) => setDayOfMonth(e.currentTarget.value)}
                                                            >
                                                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                                    <s-option key={day} value={day.toString()}>{day}</s-option>
                                                                ))}
                                                            </s-select>
                                                            <s-select
                                                                label="Delivery Time"
                                                                value={monthlyTime}
                                                                onChange={(e: any) => setMonthlyTime(e.currentTarget.value)}
                                                            >
                                                                {timeOptions.map(time => (
                                                                    <s-option key={time} value={time}>{time}</s-option>
                                                                ))}
                                                            </s-select>
                                                        </s-stack>
                                                    </div>
                                                )}
                                            </s-stack>
                                        </s-stack>
                                    </s-stack>
                                </s-stack>
                            </s-box>
                        </div>


                    </s-stack>
                </s-section>
            </s-stack>

            {/* <s-stack direction="inline" paddingBlockStart="base">
                <button onClick={handleSendTest} disabled={isTesting}>
                    {isTesting ? "Sending..." : "Send Test Notification"}
                </button>
            </s-stack> */}
        </>
    );
}