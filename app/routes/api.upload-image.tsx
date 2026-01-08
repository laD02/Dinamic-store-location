// app/routes/api.upload-image.tsx
import { ActionFunctionArgs, } from "react-router";
import { uploadImageToCloudinary } from "app/utils/upload.server";

export async function action({ request }: ActionFunctionArgs) {
    try {
        const formData = await request.formData();
        const imageBase64 = formData.get("image")?.toString();

        if (!imageBase64) {
            return { error: "No image provided" };
        }

        if (!imageBase64.startsWith('data:image/')) {
            return { error: "Invalid image format" };
        }

        const imageUrl = await uploadImageToCloudinary(imageBase64);

        if (!imageUrl) {
            return { error: "Upload failed" };
        }

        return { success: true, imageUrl };

    } catch (error) {
        console.error('Upload error:', error);
        return { error: "Upload failed" };
    }
}