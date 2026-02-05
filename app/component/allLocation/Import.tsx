// app/component/allLocation/Import.tsx
import { useAppBridge } from '@shopify/app-bridge-react';
import { useState, useEffect } from 'react';
import { useFetcher } from 'react-router';

export default function Import() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
        ];

        const rows = [headers];

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
            setSelectedFile(files[0]);
        }
    };

    const handleDrop = (event: any) => {
        event.preventDefault();
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
    };

    const handleModalClose = () => {
        setSelectedFile(null);
    };

    const handleImport = async () => {
        if (!selectedFile) return;

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

    // Reset file sau khi import thành công
    useEffect(() => {
        if (fetcher.data?.success) {
            setSelectedFile(null);
            const message = fetcher.data.message || `Successfully imported ${fetcher.data.count} locations`;
            shopify.toast.show(message);
        }

        if (fetcher.data?.error) {
            shopify.toast.show(fetcher.data.error, { isError: true });
        }
    }, [fetcher.data, shopify]);


    return (
        <>
            <s-button icon="import" commandFor="btnImport">
                Import
            </s-button>
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
                    commandFor="btnImport"
                    command="--hide"
                    disabled={!selectedFile || fetcher.state === 'submitting'}
                    onClick={handleImport}
                >
                    {fetcher.state === 'submitting' ? 'Importing...' : 'Import Location List'}
                </s-button>
            </s-modal>
        </>
    );
}