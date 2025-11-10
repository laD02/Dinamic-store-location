// app/routes/app.help-center.tsx
import { ActionFunctionArgs, Link, LoaderFunctionArgs, useFetcher, useLoaderData } from "react-router";
import styles from "../css/allLocation.module.css"
import { useState } from "react";
import prisma from "app/db.server";
import { Store } from "@prisma/client";
import { exportStoresToCSV } from "../utils/exportCSV";

export async function loader({ request }: LoaderFunctionArgs) {
  const storeData = await prisma.store.findMany();
  const serialized = storeData.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return serialized;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "deleteId") {
    const id = formData.get("id") as string;
    await prisma.store.delete({
      where: {id}
    })
    return {success: true}
  }

  if (actionType === "delete") {
    const ids = formData.getAll("ids") as string[];
    await prisma.store.deleteMany({
      where: { id: { in: ids } },
    });
    return { success: true };
  }

  if (actionType === "updateVisibility") {
    const visibility = formData.get("visibility") as string;
    const selectedIds = JSON.parse(formData.get("selectedIds") as string);

    if (!["visible", "hidden"].includes(visibility)) {
      return { error: "Invalid visibility value" };
    }

    if (selectedIds.length > 0) {
      await prisma.store.updateMany({
        where: { id: { in: selectedIds } },
        data: { visibility },
      });
    }

    return { success: true };
  }

  return { error: "Unknown action" };
}

export default function AllLocation() {
  const storesData = useLoaderData<Store[]>();
  const storeCount = storesData.length;
  const [searchTerm, setSearchTerm] = useState("");
  const [stores, setStores] = useState(storesData);
  const [sellectAll, setSelectAll] = useState(false)
  const [sellectRow, setSellectRow] = useState<boolean[]>(()=> new Array(storesData.length).fill(false))
  const [show, setShow] = useState(false)
  const fetcher = useFetcher();
  const [clickSource, setClickSource] = useState(false)
  const [clickShow, setClickShow] = useState(false)
  const [clickVisi, setClickVisi] = useState(false)
  const [clickShowVisi, setClickShowVisi] = useState(false)
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedVisibility, setSelectedVisibility] = useState<string>("");

  const handleDelete = () => {
    const selectedIds = stores
      .filter((_, index) => sellectRow[index])
      .map((store) => store.id);

    if (selectedIds.length === 0) return alert("No stores selected");
    if (!confirm(`Delete ${selectedIds.length} store(s)?`)) return;

    // Lọc bỏ store đã chọn ngay lập tức
    const newStores = stores.filter((s) => !selectedIds.includes(s.id));
    setStores(newStores);

    // Reset toàn bộ checked ngay lập tức
    setSellectRow(new Array(newStores.length).fill(false));
    setSelectAll(false);

    // Gửi request xóa lên server
    const formData = new FormData();
    formData.append("actionType", "delete");
    selectedIds.forEach((id) => formData.append("ids", id));
    fetcher.submit(formData, { method: "post" });
  };

  const handleDeleteTrash = (id: string) => {
    const formData = new FormData();
    formData.append("actionType", "deleteId")
     formData.append("id", id);
    fetcher.submit(formData, {method: "post"})
  }

  const filteredStores = stores
    .filter((store) => {
      const matchesSearch =
        store.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.address.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSource =
        selectedSources.length === 0 || selectedSources.includes(store.source);

      const matchesVisibility =
        !selectedVisibility ||
        store.visibility.toLowerCase() === selectedVisibility.toLowerCase();

      // ✅ chỉ hiển thị store thỏa cả ba điều kiện
      return matchesSearch && matchesSource && matchesVisibility;
    });

  const handleSellectAll = () => {
    const newValue = !sellectAll
    setSelectAll(newValue)
    setSellectRow (new Array(stores.length).fill(newValue))
  }

  const handleSellectRow = (index: number) => {
    const newChecked = [...sellectRow]
    newChecked[index] = !newChecked[index]
    setSellectRow(newChecked)
    setSelectAll(newChecked.every(Boolean))
  }

  const handleSourceChange = (value: string, checked: boolean) => {
  setSelectedSources((prev) =>
    checked ? [...prev, value] : prev.filter((v) => v !== value)
  );
};

  const hasChecked = sellectRow.some(Boolean);
  const checkedRowCount = sellectRow.filter(Boolean).length

  return (
    <s-page heading="Dynamic Store Locator">
      <div className={styles.header}>
        <div className={styles.title}>All Location</div>
        <div className={styles.boxButton}>
          <div className={`${styles.button} ${hasChecked && styles.open }`} onClick={() => exportStoresToCSV(stores, sellectRow)}>
            <i className="fa-solid fa-arrow-up-from-bracket"></i>
            Export
          </div>
          <div 
            className={`${styles.button} ${hasChecked && styles.open }`}
            onClick={handleDelete}
          >
            <i className="fa-solid fa-trash"></i>
            Delete
          </div>
          <Link to ="/addLocation" className={styles.btnAdd}>
            <div >  
              <i className="fa-solid fa-circle-plus"></i>
              Add Location
            </div>
          </Link>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.search}>
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search by name, city, or address"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} // cập nhật searchTerm
          />
        </div>
        <div className={styles.boxAddFilter}>
          <div className={`${styles.source} ${clickSource && styles.show}`}>
            <button className={styles.addSource} onClick={() => setClickShow(!clickShow)} >
              {selectedSources.length > 0 ? selectedSources.join(", ") : "Source"}
              <i 
                className="fa-solid fa-x" 
                onClick={(e) => {
                  e.stopPropagation(); // tránh toggle dropdown
                  setSelectedSources([]); // reset checkbox đã chọn
                  setClickSource(!clickSource); // nếu muốn đóng dropdown luôn
                }}
              />
            </button>
            <div className={`${styles.selectSource} ${ !clickShow && styles.show}`}>
              <div>
                <input
                type="checkbox"
                value="Manual"
                checked={selectedSources.includes("Manual")}
                onChange={(e) => handleSourceChange(e.target.value, e.target.checked)}
                />
                <label>Manual</label>
              </div>
              <div>
                <input
                type="checkbox"
                value="Faire"
                checked={selectedSources.includes("Faire")}
                onChange={(e) => handleSourceChange(e.target.value, e.target.checked)}
                />
                <label>Faire</label>
              </div>
              <div>
                <input
                type="checkbox"
                value="National Retailer"
                checked={selectedSources.includes("National Retailer")}
                onChange={(e) => handleSourceChange(e.target.value, e.target.checked)}
                />
                <label>National Retailer</label>
              </div>
              <div>
                <input
                type="checkbox"
                value="Shopify B2B"
                checked={selectedSources.includes("Shopify B2B")}
                onChange={(e) => handleSourceChange(e.target.value, e.target.checked)}
                />
                <label>Shopify B2B</label>
              </div>
            </div>
          </div>
          <div className={`${styles.source} ${clickVisi && styles.show}`}>
            <button className={styles.addSource} onClick={() => setClickShowVisi(!clickShowVisi)}>
              {selectedVisibility || "Visibility"}
              <i 
                className="fa-solid fa-x" 
                onClick={(e) => {
                  e.stopPropagation() 
                  setSelectedVisibility("")
                  setClickVisi(!clickVisi)
                }}
                />
            </button>
            <div className={`${styles.selectSource} ${ !clickShowVisi && styles.show}`}>
              <div>
                <input 
                  name="visi" 
                  type="radio"
                  checked={selectedVisibility === "Visible"}
                  onChange={() => setSelectedVisibility("Visible")}
                />
                <label>Visible</label>
              </div>
              <div>
                <input 
                  name="visi" 
                  type="radio"
                  checked={selectedVisibility === "Hidden"}
                  onChange={() => setSelectedVisibility("Hidden")}
                />
                <label>hidden</label>
              </div>
            </div>
          </div>
          <div className={styles.filter}>
            <button 
              className={styles.addFilter}
              onClick={() => {
                setShow(!show)
              }}
            >
              Add filter
            <i className="fa-solid fa-plus"></i>
            </button>
            <div className={`${styles.select} ${show && styles.show}`}>
              <div
                onClick={() => {
                  setClickSource(true);
                  setClickShow(true);
                }}
                className={`${clickSource && styles.unShow}`}
              >
                Source
              </div>
              <div
                onClick={() => {
                  setClickVisi(true);
                  setClickShowVisi(true);
                }}
                className={`${clickVisi && styles.unShow}`}
              >
                Visibility
              </div>
              <div>Tags</div>
            </div>
          </div>
        </div>
      { hasChecked && 
        <div className={styles.titleTb}>
            <div className={styles.boxQuantity} >
              <input type="checkbox" checked ={sellectAll} onChange={() => handleSellectAll()}/>
              <span>{checkedRowCount }</span> 
              <span>selected</span>
            </div>
            <div className={styles.boxBtn}>
              <button
                onClick={() => {
                  const selectedIds = stores
                    .filter((_, i) => sellectRow[i])
                    .map((s) => s.id);

                  if (selectedIds.length === 0) return;

                  // ✅ cập nhật state ngay lập tức
                  const newStores = stores.map((store) =>
                    selectedIds.includes(store.id)
                      ? { ...store, visibility: "visible" }
                      : store
                  );
                  setStores(newStores);

                  // ✅ gửi lên server để đồng bộ DB
                  fetcher.submit(
                    {
                      actionType: "updateVisibility",
                      visibility: "visible",
                      selectedIds: JSON.stringify(selectedIds),
                    },
                    { method: "post" }
                  );
                }}
              >
                Set As Visible
              </button>

              <button
                onClick={() => {
                  const selectedIds = stores
                    .filter((_, i) => sellectRow[i])
                    .map((s) => s.id);

                  if (selectedIds.length === 0) return;

                  // ✅ cập nhật state ngay lập tức
                  const newStores = stores.map((store) =>
                    selectedIds.includes(store.id)
                      ? { ...store, visibility: "hidden" }
                      : store
                  );
                  setStores(newStores);

                  // ✅ gửi lên server để đồng bộ DB
                  fetcher.submit(
                    {
                      actionType: "updateVisibility",
                      visibility: "hidden",
                      selectedIds: JSON.stringify(selectedIds),
                    },
                    { method: "post" }
                  );
                }}
              >
                Set As Hidden
              </button>

              <button>Add Tags</button>
            </div>
          </div>
        }
        <table className={styles.storeTable}>
          {
            !hasChecked &&
              <thead>
                <tr>
                <th><input type="checkbox" checked={sellectAll} onChange={() => handleSellectAll()}/></th>
                <th>No</th>
                <th>Store Name</th>
                <th>Source</th>
                <th>Map Marker</th>
                <th>Tags</th>
                <th>Visibility</th>
                <th>Added</th>
                <th>Updated</th>
                <th></th>
                <th></th>
                </tr>
              </thead> 
          }
          <tbody>
            {filteredStores.map((store:Store, index: number) => (
              <tr onClick={() => handleSellectRow(index)}>
                <td><input type="checkbox" checked= {sellectRow[index]} onChange={() => handleSellectRow(index)}/></td>
                <td>{index + 1}</td>
                <td>
                  <Link to={`/editLocation/${store.id}`} className={styles.link}>
                  {store.storeName}<br />
                  <span >{store.address}, {store.city}, {store.state}, {store.code}</span>
                   </Link>
                </td>
                <td><span >{store.source}</span></td>
                <td>
                  <div >
                    <i className="fa-solid fa-map-marker"></i>
                  </div>
                </td>
                <td></td>
                <td><span >{store.visibility}</span></td>
                <td>{new Date(store.createdAt).toLocaleString()}</td>
                <td>{new Date(store.updatedAt).toLocaleString()}</td>
                <td>
                  <i className="fa-regular fa-trash-can" onClick={() => handleDeleteTrash(store.id)}></i>
                </td>
                <td>
                  <Link to={`/editLocation/${store.id}`}>Edit</Link>
                </td>
              </tr>
            ))}    
          </tbody>
        </table>
        <div className={styles.footerTb}>
            <i className="fa-solid fa-chevron-left"></i>
            <div>
              <span>1</span>
              -
              <span>{storeCount} </span>
              of
              <span> {storeCount}</span>
            </div>
            <i className="fa-solid fa-chevron-right"></i>
        </div>
      </div>
    </s-page>
  );
}