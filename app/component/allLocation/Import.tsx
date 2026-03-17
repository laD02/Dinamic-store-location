// app/component/allLocation/Import.tsx
import { useAppBridge } from '@shopify/app-bridge-react';
import { useState, useEffect } from 'react';
import { useFetcher } from 'react-router';

interface ImportProps {
    level?: string;
}

export default function Import({ level }: ImportProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importResult, setImportResult] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const fetcher = useFetcher();
    const shopify = useAppBridge();

    const handleDownloadTemplate = () => {
        const headers = [
            "Store Name",
            "Address",
            "City",
            "Zip Code",
            "Country",
            "Phone",
            "Website",
            "Visibility",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
        ];

        const exampleRow = [
            "Downtown Store",
            "123 Main Street",
            "New York",
            "10001",
            "United States",
            "+1 408-996-1010",
            "https://example.com",
            "Hidden",
            "Close",
            "09:00 - 17:00",
            "09:00 - 17:00",
            "09:00 - 17:00",
            "09:00 - 17:00",
            "09:00 - 17:00",
            "Close",
        ];

        const rows = [headers, exampleRow];

        const csvContent = rows
            .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `stores_template_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileSelect = (event: any) => {
        const files = event.target?.files || event.detail?.files;
        if (files && files.length > 0) {
            const file = files[0];

            // Kiểm tra extension file
            const fileName = file.name.toLowerCase();
            const isCSV = fileName.endsWith('.csv');

            if (!isCSV) {
                setImportResult({
                    type: 'error',
                    message: 'The file is not in the correct format. Please download the template and use the correct format.'
                });
                setSelectedFile(null);
                return;
            }

            setSelectedFile(file);
            setImportResult(null);
        }
    };

    const handleDrop = (event: any) => {
        event.preventDefault();
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];

            // Kiểm tra extension file
            const fileName = file.name.toLowerCase();
            const isCSV = fileName.endsWith('.csv');

            if (!isCSV) {
                setImportResult({
                    type: 'error',
                    message: 'The file is not in the correct format. Please download the template and use the correct format.'
                });
                setSelectedFile(null);
                return;
            }

            setSelectedFile(file);
            setImportResult(null);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setImportResult(null);
    };

    const handleModalClose = () => {
        setSelectedFile(null);
        setImportResult(null);
    };

    const handleImport = async () => {
        if (!selectedFile) return;

        setImportResult(null);

        const formData = new FormData();
        formData.append('actionType', 'import');
        formData.append('file', selectedFile);

        fetcher.submit(formData, {
            method: 'post',
            encType: 'multipart/form-data'
        });
    };

    // Lắng nghe sự kiện đóng modal
    useEffect(() => {
        const modal = document.getElementById('btnImport');
        if (modal) {
            modal.addEventListener('close', handleModalClose);
            modal.addEventListener('hide', handleModalClose);
        }

        return () => {
            if (modal) {
                modal.removeEventListener('close', handleModalClose);
                modal.removeEventListener('hide', handleModalClose);
            }
        };
    }, []);

    useEffect(() => {
        if (fetcher.data?.success) {
            const message = fetcher.data.message || `Successfully imported ${fetcher.data.count} locations`;
            shopify.toast.show(message);

            // Đóng modal và reset state
            // Đóng modal bằng cách trigger hidden button
            const closeBtn = document.getElementById('close-import-modal-btn');
            closeBtn?.click();

            // Reset sau khi đóng modal
            setTimeout(() => {
                setSelectedFile(null);
                setImportResult(null);
            }, 100);
        }

        if (fetcher.data?.error) {
            // Không đóng modal - chỉ hiển thị lỗi inline
            setImportResult({ type: 'error', message: fetcher.data.error });
            setSelectedFile(null);
        }
    }, [fetcher.data, shopify]);

    return (
        <>
            <s-button icon="import" commandFor="btnImport" disabled={level === 'basic'}>
                Import
            </s-button>
            <div style={{ display: "none" }}>
                <s-button
                    id="close-import-modal-btn"
                    commandFor="btnImport"
                    command="--hide"
                ></s-button>
            </div>
            <s-modal id="btnImport" heading="Bulk Import Your Locations">

                <s-stack gap="base">
                    <s-stack gap="small-200">
                        <s-heading>Download the template</s-heading>
                        <s-paragraph>Download the .csv template below to add in your locations all in one shot!.</s-paragraph>
                        <s-button icon="file" onClick={handleDownloadTemplate}>
                            Download the .csv Template
                        </s-button>
                    </s-stack>
                    <s-divider />
                    <s-stack gap="small-200">
                        <s-heading>Upload Your List</s-heading>
                        <s-paragraph>
                            When your list is ready, select or drag/drop your template below to upload your locations to Store Locator
                        </s-paragraph>

                        {/* Hiển thị kết quả import ngay dưới phần upload */}
                        {importResult && (
                            <s-banner
                                tone={importResult.type === 'success' ? 'success' : 'critical'}
                            >
                                <s-paragraph>{importResult.message}</s-paragraph>
                            </s-banner>
                        )}

                        {!selectedFile ? (
                            <s-drop-zone
                                accessibilityLabel="Upload CSV file"
                                accept=".csv"
                                onChange={handleFileSelect}
                                onInput={handleDrop}
                            />
                        ) : (
                            <s-stack gap="small-200">
                                <s-banner>
                                    <s-stack gap="small-100">
                                        <s-paragraph>
                                            <strong>{selectedFile.name}</strong>
                                        </s-paragraph>
                                        <s-paragraph>
                                            Size: {(selectedFile.size / 1024).toFixed(2)} KB
                                        </s-paragraph>
                                    </s-stack>
                                </s-banner>
                                <s-button
                                    icon="delete"
                                    variant="secondary"
                                    onClick={handleRemoveFile}
                                >
                                    Remove File
                                </s-button>
                            </s-stack>
                        )}
                    </s-stack>
                </s-stack>

                <s-button
                    slot="primary-action"
                    variant="primary"
                    disabled={!selectedFile || fetcher.state === 'submitting'}
                    onClick={handleImport}
                    loading={fetcher.state === 'submitting'}
                >
                    Import Location List
                </s-button>
            </s-modal>
        </>
    );
}