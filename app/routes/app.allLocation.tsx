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
import { useAppBridge } from '@shopify/app-bridge-react';
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session?.shop;
  const storeData = await prisma.store.findMany({
    where: { shop },
    orderBy: {
      createdAt: 'desc', // mới nhất lên đầu
    },
  });

  return storeData.map((s: any) => ({
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
    return { oks: true };
  }

  return { error: "Unknown action" };
}

export default function AllLocation() {
  const storesData = useLoaderData<Store[]>();
  const [searchTerm, setSearchTerm] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fetcher = useFetcher();
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedVisibility, setSelectedVisibility] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const shopify = useAppBridge()
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    // Lấy width lần đầu
    setWindowWidth(window.innerWidth);

    // Update khi resize
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ Đọc message từ URL - chỉ chạy 1 lần khi mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const message = params.get('message');

    if (message === 'deleted') {
      shopify.toast.show('Store deleted successfully!');

      // Xóa param khỏi URL
      window.history.replaceState({}, '', '/app');
    }
  }, []); // Empty deps - chỉ chạy 1 lần

  // Theo dõi fetcher.data cho các action trong trang này
  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show('Store deleted successfully!');
    }
  }, [fetcher.data]);

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

  // Tính tổng số trang
  const totalPages = Math.ceil(filteredStores.length / itemsPerPage);

  // Tính vị trí bắt đầu và kết thúc
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Lấy chỉ 5 items của trang hiện tại
  const currentStores = filteredStores.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSources, selectedVisibility]);

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

  useEffect(() => {
    // Nếu trang hiện tại không còn item nhưng vẫn còn item ở trang cũ → lùi lại 1 trang
    if (currentPage > 1 && currentStores.length === 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [filteredStores, currentPage, currentStores.length]);


  const allVisibleSelected =
    filteredStores.length > 0 &&
    filteredStores.every(s => selectedIds.has(s.id));

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
    <s-page heading="Store Locator">
      <s-stack direction="inline" justifyContent="space-between" alignItems="center">
        <h2>
          All Locations
        </h2>
        {
          windowWidth > 768
            ?
            <s-stack direction="inline" gap="base">
              <s-tooltip id="export">Export</s-tooltip>
              <s-button variant="secondary" disabled={!hasChecked} icon="export" onClick={handleExport} interestFor="export" ></s-button>
              <s-tooltip id="delete">Delete</s-tooltip>
              <s-button variant="secondary" commandFor="deleteTrash-modal" disabled={!hasChecked} icon="delete" interestFor="delete"></s-button>
              <s-modal id="deleteTrash-modal" heading="Delete Location">
                <s-text>
                  Are you sure you want to delete {selectedIds.size} stores? This action cannot be undone.
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
                  onClick={() => handleDelete()}
                >
                  Delete
                </s-button>
              </s-modal>
              <Link to="/app/addLocation" >
                <s-button variant="primary" icon="plus-circle">Add Product</s-button>
              </Link>
            </s-stack>
            :
            <s-stack direction="inline" justifyContent="end" gap="base">
              <s-button icon="menu-horizontal" commandFor="btn-group"></s-button>
              <s-popover id="btn-group">
                <s-stack direction="block">
                  <s-button variant="tertiary" disabled={!hasChecked} onClick={handleExport} >Export</s-button>
                  <s-button variant="tertiary" commandFor="deleteTrash-modal" disabled={!hasChecked} >Delete</s-button>
                  <s-modal id="deleteTrash-modal" heading="Delete Location">
                    <s-text>
                      Are you sure you want to delete {selectedIds.size} stores? This action cannot be undone.
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
                      onClick={() => handleDelete()}
                    >
                      Delete
                    </s-button>
                  </s-modal>
                </s-stack>
              </s-popover>
              <Link to="/app/addLocation" >
                <s-button variant="primary" icon="plus-circle"></s-button>
              </Link>
            </s-stack>
        }
      </s-stack>

      <s-section padding="none">
        <s-table
        // paginate
        // hasPreviousPage={currentPage > 1}  
        // hasNextPage={currentPage < totalPages}  
        // onPreviousPage={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        // onNextPage={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
        >
          <s-grid slot="filters" gap="small-200" gridTemplateColumns="1fr auto">
            <s-text-field
              label="Search puzzles"
              labelAccessibilityVisibility="exclusive"
              icon="search"
              placeholder="Search by name, city, or address"
              value={searchTerm}
              onInput={(event) => {
                const target = event.target as any;
                setSearchTerm(target.value);
              }}
            />
            <s-button
              icon="sort"
              variant="secondary"
              accessibilityLabel="Sort"
              interestFor="sort-tooltip"
              commandFor="sort-actions"
            />
            <s-tooltip id="sort-tooltip">
              <s-text>Sort</s-text>
            </s-tooltip>
            <s-popover id="sort-actions">
              <s-stack gap="none">
                {/* <s-box padding="small">
                  Source
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
                </s-box> */}
                <s-divider />
                <s-box padding="small">
                  <s-choice-list
                    label="Visibility"
                    name="visi"
                    values={selectedVisibility ? [selectedVisibility] : []}
                    onChange={(e) => {
                      const target = e.currentTarget.values;
                      setSelectedVisibility(target ? target[0] : "")
                    }}
                  >
                    <s-choice value="visible">Visible</s-choice>
                    <s-choice value="hidden">Hidden</s-choice>
                  </s-choice-list>
                  <s-button
                    variant="tertiary"
                    onClick={() => setSelectedVisibility("")}
                  >
                    Clear
                  </s-button>
                </s-box>
              </s-stack>
            </s-popover>
          </s-grid>
          {
            filteredStores.length !== 0 ? (
              <>
                {hasChecked && windowWidth >= 490 && (
                  <s-table-header-row>
                    <s-table-header listSlot="primary">
                      <s-stack direction="inline" gap="small" alignItems="center">
                        <s-checkbox
                          onChange={selectAllVisible}
                          checked={allVisibleSelected}
                        />
                        {checkedRowCount} selected
                      </s-stack>
                    </s-table-header>
                    <s-table-header listSlot="inline"></s-table-header>
                    <s-table-header listSlot="labeled">
                      <s-button onClick={() => updateVisibility("visible")}>
                        Set As Visible
                      </s-button>
                    </s-table-header>
                    <s-table-header listSlot="labeled">
                      <s-button onClick={() => updateVisibility("hidden")}>
                        Set As Hidden
                      </s-button>
                    </s-table-header>
                    <s-table-header listSlot="labeled"></s-table-header>
                  </s-table-header-row>
                )}
                {!hasChecked && (
                  <s-table-header-row>
                    <s-table-header listSlot="primary">
                      <s-stack direction="inline" gap="base">
                        <s-checkbox
                          checked={allVisibleSelected}
                          onChange={selectAllVisible}
                        />
                        StoreName
                      </s-stack>
                    </s-table-header>
                    {/* <s-table-header listSlot="labeled">Address</s-table-header>
                    <s-table-header listSlot="labeled">City</s-table-header> */}
                    <s-table-header listSlot="labeled">Visibility</s-table-header>
                    <s-table-header listSlot="labeled">Created</s-table-header>
                    <s-table-header listSlot="labeled">Update</s-table-header>
                    <s-table-header listSlot="labeled">Actions</s-table-header>
                  </s-table-header-row>
                )}
                <s-table-body>
                  {
                    currentStores.map((store, index) => (
                      <s-table-row key={store.id}>
                        <s-table-cell>
                          <s-stack direction="inline" alignItems="center" gap="base">
                            <s-checkbox
                              checked={selectedIds.has(store.id)}
                              onChange={() => toggleSelect(store.id)}
                            />
                            <s-thumbnail src={store.image || ''} size="small" />
                            <s-link href={`/app/editLocation/${store.id}`}>
                              <s-box>{store.storeName}</s-box>
                              <s-box>{store.address}, {store.city}, {store.state}, {store.code}</s-box>
                            </s-link>
                          </s-stack>
                        </s-table-cell>
                        <s-table-cell>
                          <s-badge tone={store.visibility === "visible" ? "success" : "auto"}>{store.visibility}</s-badge>
                        </s-table-cell>
                        {/* <s-table-cell>
                          <s-badge tone="info">{store.source}</s-badge>
                        </s-table-cell>
                        <s-table-cell>
                          <s-icon type="location"/>
                        </s-table-cell>
                        <s-table-cell>
                          <s-tooltip id={`tags-${index}`}>
                            <s-text>
                              {(Array.isArray(store.tags) ? store.tags : []).join(", ")}
                            </s-text>
                          </s-tooltip>
                          <s-text interestFor={`tags-${index}`}>   
                            <div style={{width:'80px'}}>
                              <s-paragraph lineClamp={1}>
                                {(Array.isArray(store.tags) ? store.tags : []).join(", ")}
                              </s-paragraph>
                            </div>
                          </s-text>
                        </s-table-cell> */}
                        <s-table-cell>{new Date(store.createdAt).toISOString().split("T")[0]}</s-table-cell>
                        <s-table-cell>{new Date(store.updatedAt).toISOString().split("T")[0]}</s-table-cell>
                        <s-table-cell>
                          <s-stack direction="inline" alignItems="center" gap="small">
                            <s-button
                              variant="tertiary"
                              icon="delete"
                              commandFor={`deleteId-modal-${store.id}`}
                            >
                            </s-button>
                            <s-modal id={`deleteId-modal-${store.id}`} heading="Delete Location">
                              <s-text>
                                Are you sure you want to delete this store? This action cannot be undone.
                              </s-text>

                              <s-button
                                slot="secondary-actions"
                                variant="secondary"
                                commandFor={`deleteId-modal-${store.id}`}
                                command="--hide"
                              >
                                Cancel
                              </s-button>

                              <s-button
                                slot="primary-action"
                                variant="primary"
                                tone="critical"
                                commandFor={`deleteId-modal-${store.id}`}
                                command="--hide"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleDeleteTrash(store.id);
                                }}
                              >
                                Delete
                              </s-button>
                            </s-modal>
                            <s-link href={`/app/editLocation/${store.id}`}>Edit</s-link>
                          </s-stack>
                        </s-table-cell>
                      </s-table-row>
                    ))
                  }
                </s-table-body>
              </>
            ) : (
              <>
                <s-table-body>
                  <s-table-row>
                    <s-table-cell >
                      <s-stack alignItems="center" gap="small">
                        <s-icon type="search" size="base" />
                        <h2>No filters found</h2>
                        <s-text color="subdued">
                          Try changing the filters or search term
                        </s-text>
                      </s-stack>
                    </s-table-cell>
                  </s-table-row>
                </s-table-body>
              </>
            )
          }
        </s-table>
        <s-stack
          direction="inline"
          justifyContent="center"
          gap="small-400"
          background="subdued"
          paddingBlock="small-200"
        >
          <s-button
            variant="secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            icon="caret-left"
          >

          </s-button>

          <s-button
            variant="secondary"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(p => p + 1)}
            icon="caret-right"
          >

          </s-button>
        </s-stack>
      </s-section>
    </s-page>
  );
}