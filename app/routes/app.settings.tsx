// app/routes/app.help-center.tsx

import { ActionFunctionArgs, LoaderFunctionArgs, useFetcher, useLoaderData, useLocation, useNavigate, useNavigation } from "react-router";
import styles from "../css/setting.module.css"
import { useState } from "react";
import Display from "app/component/display";
import SearchFilter from "app/component/searchFilter";
import prisma from "app/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const filter = await prisma.attribute.findMany()

  return filter; // hoặc return {}
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const filterRaw = formData.get("filter");
  const deleteFilterRaw = formData.get("deleteFilter");
  const editFilterRaw = formData.get("editFilter")

  if (editFilterRaw) {
    const editfilter = JSON.parse(editFilterRaw as string)

    await prisma.attribute.update({
      where: {id: editfilter.id},
      data: {
        filter: editfilter.filter
      }
    })
  }

  // ✅ Nếu có deleteFilter → XÓA
  if (deleteFilterRaw) {
    const deleteFilter = JSON.parse(deleteFilterRaw as string);

    await prisma.attribute.delete({
      where: { id: deleteFilter },
    });

    return { ok: true, action: "delete" };
  }

  // ✅ Nếu có filter → TẠO
  if (filterRaw) {
    const filter = JSON.parse(filterRaw as string);

    await prisma.attribute.create({
      data: { filter },
    });

    return { ok: true, action: "create" };
  }

  return { ok: false, message: "No action found" };
}


export default function Settings() {
  const fetcher = useFetcher()
  const navigate = useNavigate()
  const listBlock  = ["Display", "Search Filters"]
  const [active, setActive] = useState(0)
  const filter = useLoaderData<typeof loader>()

  const handleDelete = (id: string | number) => {
    const formData = new FormData();
    formData.append("deleteFilter", JSON.stringify(id))
    fetcher.submit(formData, {method: "delete"})
  }

  const handleClick = (index: string | number) => {
    if (index === 2) {
      navigate("/app/plan")
    }
  }

  return (
    <s-page heading="Dynamic Store Locator">
      <s-stack gap="small">
        <h2>Settings</h2>
        <s-stack direction="inline" gap="large">
          {
            listBlock.map((item, index) => (
              <div 
                className={`${styles.itemsBlock} ${active === index && styles.active}`} 
                key={index} 
                onClick={() => {
                  setActive(index)
                  handleClick(index)
                }}
              >
                {item}
              </div>
            ))
          }
        </s-stack>
        {active === 0 && <Display />}
        {active === 1 && <SearchFilter config={filter} handleDelete={handleDelete}/>}
      </s-stack>
    </s-page>
  );
}
