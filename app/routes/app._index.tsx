// app/routes/app.help-center.tsx
import {
  ActionFunctionArgs,
  Link,
  LoaderFunctionArgs,
  useFetcher,
  useLoaderData,
} from "react-router";
import { useEffect, useState, useMemo } from "react";
import prisma from "app/db.server";
import { Store } from "@prisma/client";
import { exportStoresToCSV } from "../utils/exportCSV";

export async function loader({ request }: LoaderFunctionArgs) {
  const storeData = await prisma.store.findMany();

  return storeData.map(s => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "deleteId") {
    const id = formData.get("id") as string;
    await prisma.store.delete({ where: { id } });
    return { success: true };
  }

  if (actionType === "delete") {
    const ids = formData.getAll("ids") as string[];
    await prisma.store.deleteMany({ where: { id: { in: ids } } });
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
  const [searchTerm, setSearchTerm] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fetcher = useFetcher();

  const [clickSource, setClickSource] = useState(false);
  const [clickVisi, setClickVisi] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedVisibility, setSelectedVisibility] = useState<string>("");

  useEffect(() => {
    setStores(storesData);
  }, [storesData]);

  useEffect(() => {
    setSelectedIds(prev => {
      const newSet = new Set<string>();
      stores.forEach(s => {
        if (prev.has(s.id)) newSet.add(s.id);
      });
      return newSet;
    });
  }, [stores]);

  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const matchesSearch =
        store.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.address.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSource =
        selectedSources.length === 0 || selectedSources.includes(store.source);

      const matchesVisibility =
        !selectedVisibility ||
        store.visibility.toLowerCase() === selectedVisibility.toLowerCase();

      return matchesSearch && matchesSource && matchesVisibility;
    });
  }, [stores, searchTerm, selectedSources, selectedVisibility]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    const allSelected = filteredStores.every(s => selectedIds.has(s.id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredStores.forEach(s => {
        allSelected ? next.delete(s.id) : next.add(s.id);
      });
      return next;
    });
  };

  const allVisibleSelected =
    filteredStores.length > 0 && filteredStores.every(s => selectedIds.has(s.id));

  const hasChecked = selectedIds.size > 0;
  const checkedRowCount = selectedIds.size;

  const handleDeleteTrash = (id: string) => {
    setStores(prev => prev.filter(s => s.id !== id));
    const formData = new FormData();
    formData.append("actionType", "deleteId");
    formData.append("id", id);
    fetcher.submit(formData, { method: "post" });
  };

  const handleDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return alert("No stores selected");
    if (!confirm(`Delete ${ids.length} store(s)?`)) return;

    setStores(prev => prev.filter(s => !ids.includes(s.id)));
    setSelectedIds(new Set());

    const formData = new FormData();
    formData.append("actionType", "delete");
    ids.forEach(id => formData.append("ids", id));
    fetcher.submit(formData, { method: "post" });
  };

  const updateVisibility = (visibility: "visible" | "hidden") => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setStores(prev =>
      prev.map(s => (ids.includes(s.id) ? { ...s, visibility } : s))
    );

    fetcher.submit(
      {
        actionType: "updateVisibility",
        visibility,
        selectedIds: JSON.stringify(ids),
      },
      { method: "post" }
    );
  };

  const handleExport = () => {
    const selectedStoreList = stores.filter(s => selectedIds.has(s.id));
    const selectedIdList = Array.from(selectedIds);
    exportStoresToCSV(selectedStoreList, selectedIdList);
  };

  return (
    <s-page heading="Dynamic Store Locator">
      <s-stack direction="inline" justifyContent="space-between" paddingBlockStart="large-100" paddingBlockEnd="large-200">
        <s-heading>
          All Locations
        </s-heading>
        <s-stack direction="inline" gap="base">
            <s-button variant="secondary" disabled={!hasChecked} icon="export" onClick={handleExport} >Export</s-button> 
            <s-button variant="secondary" disabled={!hasChecked} icon="delete" onClick={handleDelete}>Delete</s-button>
            <Link to="/addLocation" >
              <s-button variant="primary" icon="plus-circle">Add Product</s-button>
            </Link>
        </s-stack>
      </s-stack>

      <s-stack background="base" padding="small-100" borderRadius="large-100" >
        <s-stack paddingBlockEnd="small-100">
          <s-search-field
            label="Search"
            labelAccessibilityVisibility="exclusive"
            placeholder="Search by name, city, or address"
            value={searchTerm}
            onInput={(event) => {
              const target = event.target as any;
              setSearchTerm(target.value);
            }}
          />
        </s-stack>
        <s-divider />

        <s-stack direction="inline" paddingBlockStart="small-100" paddingBlockEnd="small-100" gap="small">
       
          <s-stack display={clickSource ? "auto" : "none"}>
            <s-stack direction="inline" alignItems="center" background="base" borderWidth="small" borderStyle="dashed" borderRadius="large-200" gap="small-100">
              <s-button 
                variant="tertiary"
                commandFor="source"
              >
                <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                  {selectedSources.length > 0 ? selectedSources.join(", ") : "Source"} 
                    <s-text>
                      <s-clickable
                        blockSize="1%"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedSources([]);
                          setClickSource(false);
                          
                        }}
                        >
                        <s-icon type="x" size="small"/>
                      </s-clickable>
                    </s-text>   
                </s-stack>
              </s-button>
              
              <s-popover id="source">
                <s-stack direction="block" padding="small-100">
                  {["Manual", "Faire", "National Retailer", "Shopify B2B"].map((src, index) => (
                    <s-checkbox 
                      key={index}
                      label={src}
                      value={src}
                      checked={selectedSources.includes(src)}
                      onChange={e => {
                        const target = e.target as HTMLInputElement;
                        const val = target.value;
                        setSelectedSources(prev =>
                          target.checked ? [...prev, val] : prev.filter(v => v !== val)
                        );
                      }}
                    />
                  ))}
                  
                </s-stack>
              </s-popover>
            </s-stack>
          </s-stack>
       
          <s-stack display={clickVisi ? "auto" : "none"} direction="inline" alignItems="center" background="base" borderWidth="small" borderStyle="dashed" borderRadius="large-200" gap="small-100">
            <s-button 
              variant="tertiary"
              commandFor="visibility"
            >
              <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                {selectedVisibility || "Visibility"}
                  <s-text>
                    <s-clickable
                      blockSize="1%"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedVisibility("");
                        setClickVisi(false);
                      }}
                      >
                      <s-icon type="x" size="small"/>
                    </s-clickable>
                  </s-text>   
              </s-stack>
            </s-button>

            <s-popover id="visibility">
              <s-stack direction="block" padding="small-100">
                <s-choice-list 
                  name= "visi"
                  onChange={(e) => {
                      const target = e.currentTarget.values;                     
                      setSelectedVisibility(target ? target[0] : "")
                    }}
                >
                  <s-choice value="visible">Visiable</s-choice>
                  <s-choice value="hidden">Hidden</s-choice>
                </s-choice-list>
              </s-stack>
            </s-popover>
          </s-stack>

          <s-stack direction="inline" alignItems="center" background="base" borderWidth="small" borderStyle="dashed" borderRadius="large-200" gap="small-100">
            <s-button 
              variant="tertiary"
              commandFor="add-filter"
            >
              <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                Add filter
                <s-icon type="plus" size="small"/>
              </s-stack>
            </s-button>

            <s-popover id="add-filter">
              <s-stack direction="block" padding="small-100">
                <s-box display={clickSource ? "none" : "auto"}>
                  <s-button
                    variant="tertiary"
                    onClick={() => {
                      setClickSource(true);
                      // setClickShow(true);
                      // setShow(false);
                    }}
                  >
                    Source
                  </s-button>
                </s-box>
                <s-box display={clickVisi ? "none" : "auto"}>
                  <s-button
                    variant="tertiary"
                    onClick={() => {
                    setClickVisi(true);
                    // setClickShowVisi(true);
                    // setShow(false);
                  }}
                  >
                    Visibility
                  </s-button>
                </s-box>
                <s-box>
                  <s-button
                    variant="tertiary"
                  >
                    Tags
                  </s-button>
                </s-box>
              </s-stack>
            </s-popover>  
          </s-stack>
        </s-stack>
        <s-divider />

        {hasChecked && (
          <>
            <s-stack paddingInlineStart="small-100" paddingBlock="small-300" direction="inline" justifyContent="space-between" alignItems="center">
              <s-stack direction="inline" gap="large-300">
                <s-checkbox 
                  onChange={selectAllVisible}
                  checked={checkedRowCount === stores.length}
                />
                <s-stack>
                  {checkedRowCount} selected
                </s-stack>
              </s-stack>
              
              <s-stack direction="inline" justifyContent="space-between" gap="small">
                <s-button onClick={() => updateVisibility("visible")}>
                  Set As Visible
                </s-button>
                <s-button onClick={() => updateVisibility("hidden")}>
                  Set As Hidden
                </s-button>
                <s-button>Add Tags</s-button>
              </s-stack>
            </s-stack>
            <s-divider />
          </>
        )}

          <s-table paginate hasPreviousPage hasNextPage>     
            {!hasChecked && (
              <s-table-header-row>
                <s-table-header listSlot="primary">
                  <s-checkbox 
                    checked={allVisibleSelected}
                    onChange={selectAllVisible}
                  />
                </s-table-header>
                <s-table-header listSlot="kicker">No</s-table-header>
                <s-table-header listSlot="inline">Store Name</s-table-header>
                <s-table-header listSlot="labeled">Source</s-table-header>
                <s-table-header listSlot="labeled">Map Maker</s-table-header>
                <s-table-header listSlot="labeled">Visibility</s-table-header>
                <s-table-header listSlot="labeled">Added</s-table-header>
                <s-table-header listSlot="labeled">Update</s-table-header>
                <s-table-header listSlot="labeled"></s-table-header>
                <s-table-header listSlot="labeled"></s-table-header>
              </s-table-header-row> 
            )}

            <s-table-body>     
              {
                filteredStores.map((store, index) => (
                    <s-table-row>
                      <s-table-cell>
                        <s-checkbox 
                          checked={selectedIds.has(store.id)}
                          onChange={() => toggleSelect(store.id)}
                        />
                      </s-table-cell>
                      <s-table-cell>{index + 1}</s-table-cell>
                      <s-table-cell>
                        <s-link href={`/editLocation/${store.id}`}>  
                          <s-box>{store.storeName}</s-box>
                          <s-box>{store.address}, {store.city}, {store.state}, {store.code}</s-box>
                        </s-link>
                      </s-table-cell>
                      <s-table-cell>{store.source}</s-table-cell>
                      <s-table-cell>
                        <s-icon type="location"/>
                      </s-table-cell>
                      <s-table-cell>{store.visibility}</s-table-cell>
                      <s-table-cell>{new Date(store.createdAt).toISOString().split("T")[0]}</s-table-cell>
                      <s-table-cell>{new Date(store.updatedAt).toISOString().split("T")[0]}</s-table-cell>
                      <s-table-cell>
                        <s-clickable
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteTrash(store.id);
                          }}
                        >
                          <s-icon type="delete"></s-icon>
                        </s-clickable>
                      </s-table-cell>
                      <s-table-cell>
                        <s-link href={`/editLocation/${store.id}`}>Edit</s-link>
                      </s-table-cell>
                    </s-table-row> 
                  // </s-clickable>
                ))
              }
            </s-table-body>
          </s-table>

        {/* <div className={styles.footerTb}>
          <i className="fa-solid fa-chevron-left"></i>
          <div>
            <span>1</span> - <span>{filteredStores.length}</span> of{" "}
            <span>{stores.length}</span>
          </div>
          <i className="fa-solid fa-chevron-right"></i>
        </div> */}
      </s-stack>
    </s-page>
  );
}