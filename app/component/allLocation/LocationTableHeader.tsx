interface LocationTableHeaderProps {
  hasChecked: boolean;
  allVisibleSelected: boolean;
  checkedRowCount: number;
  onSelectAll: () => void;
}

export default function LocationTableHeader({
  hasChecked,
  allVisibleSelected,
  checkedRowCount,
  onSelectAll,
}: LocationTableHeaderProps) {
  if (!hasChecked) {
    return (
      <s-table-header-row>
        <s-table-header listSlot="primary">
          <s-stack direction="inline" gap="base">
            <s-checkbox checked={allVisibleSelected} onChange={onSelectAll} />
            StoreName
          </s-stack>
        </s-table-header>
        <s-table-header listSlot="labeled">Source</s-table-header>
        <s-table-header listSlot="labeled">Visibility</s-table-header>
        <s-table-header listSlot="labeled">Created</s-table-header>
        <s-table-header listSlot="labeled">Update</s-table-header>
        <s-table-header listSlot="labeled">Actions</s-table-header>
      </s-table-header-row>
    );
  }

  return (
    <s-table-header-row>
      <s-table-header listSlot="primary">
        <s-stack direction="inline" gap="base">
          <s-checkbox checked={allVisibleSelected} onChange={onSelectAll} />
          {checkedRowCount} selected
        </s-stack>
      </s-table-header>
      <s-table-header listSlot="labeled"></s-table-header>
      <s-table-header listSlot="labeled"></s-table-header>
      <s-table-header listSlot="labeled"></s-table-header>
      <s-table-header listSlot="labeled"></s-table-header>
      <s-table-header listSlot="labeled"></s-table-header>
    </s-table-header-row>
  );
}
