import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // redirect trực tiếp server-side
  return redirect("/app/help-center"); // hoặc route bạn muốn hiển thị đầu tiên
};

export default function Index() {
  return null; // Không cần render gì cả
}
