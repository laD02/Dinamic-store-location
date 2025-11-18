import { useState } from "react"
import styles from "../css/searchFilter.module.css"
import { useFetcher } from "react-router"

export default function SearchFilter ({config, handleDelete}: {config: any, handleDelete:(id: string | number) => void}) {
    const fetcher = useFetcher()
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState("")
    const [show, setShow] = useState(false)
    const [valueEdit, setValueEdit] = useState("")
    const [showEdit, setShowEdit] = useState(false)
    const [editId, setEditId] = useState<string | number>("")

    const handleError = () => {
        if (!value.trim()) {
            setShow(true)
            return
        } 

        const formData = new FormData();
        formData.append("filter", JSON.stringify(value))
        fetcher.submit(formData, {method: "post"})

        setValue("")
    }

     const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.currentTarget.value
        setValue(newValue)

        // Nếu rỗng -> hiện lỗi
       if (show && newValue.trim()) {
            setShow(false)
        }      
    }

    const handleEditFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setValueEdit(newValue)

        // Nếu rỗng -> hiện lỗi
        if (showEdit && newValue.trim()) {
            setShowEdit(false)
        }  
    }

    const handleSaveEdit = () => {
         if (!valueEdit.trim()) { 
            setShowEdit(true)
            return
        } 

        const formData = new FormData();
        formData.append("editFilter", JSON.stringify({
            id: editId,
            filter: valueEdit
        }))
        fetcher.submit(formData, {method: "post"})
        const cancelButton = document.querySelector('#edit-modal [command="--hide"]') as HTMLElement;
        cancelButton?.click();
        setShowEdit(false);
    }

    return (
        <s-stack background="base" padding="base" borderRadius="large" inlineSize="100%" gap="small" borderWidth="base">
            <s-paragraph>Set up custom search filters so customers can more easily sort locations by specific criteria on your map to quickly find the type of location they are looking for. For example, you can set up filters like 'Local Boutique' or 'Wheelchair Accessible'.</s-paragraph>
            
            <s-stack padding="large" >
                <s-text>Add a filter</s-text>
                <s-stack direction="inline" justifyContent="space-between" alignItems="start">
                    <s-box inlineSize="90%">
                        <s-text-field 
                            value={value}
                            onInput= {(e: any)=> handleChange(e)}
                            error={show ? 'The filter should not be empty.' : ''}
                        />
                    </s-box>
                    <s-button 
                        icon="plus"
                        onClick={() => handleError()}
                    >
                        Add
                    </s-button>
                </s-stack>
            </s-stack>
            {
                config && config.length > 0
                ? 
                    <s-table >
                         <s-table-header-row>
                            <s-table-header>Filter</s-table-header>
                            <s-table-header></s-table-header>
                            <s-table-header></s-table-header>
                            <s-table-header></s-table-header>
                            <s-table-header></s-table-header>
                            <s-table-header></s-table-header>
                            <s-table-header></s-table-header>
                            <s-table-header></s-table-header>
                            <s-table-header></s-table-header>
                            <s-table-header></s-table-header>
                            <s-table-header></s-table-header>
                            <s-table-header></s-table-header>
                            <s-table-header>Edit</s-table-header>
                            <s-table-header>Delete</s-table-header>
                        </s-table-header-row>
                        <s-table-body>
                            {
                                config.map((item: any, index: any) => (
                                    <s-table-row key={index}>
                                        <s-table-cell>{item.filter}</s-table-cell>
                                        <s-table-cell></s-table-cell>
                                        <s-table-cell></s-table-cell>
                                        <s-table-cell></s-table-cell>
                                        <s-table-cell></s-table-cell>
                                        <s-table-cell></s-table-cell>
                                        <s-table-cell></s-table-cell>
                                        <s-table-cell></s-table-cell>
                                        <s-table-cell></s-table-cell>
                                        <s-table-cell></s-table-cell>
                                        <s-table-cell></s-table-cell>
                                        <s-table-cell></s-table-cell>
                                        <s-table-cell>
                                            <s-button
                                                commandFor="edit-modal"
                                                variant="tertiary"
                                                onClick={() => {
                                                    setOpen(true)
                                                    setValueEdit(item.filter)
                                                    setEditId(item.id)
                                                }}
                                            >
                                                <i className="fa-solid fa-pen"></i>
                                            </s-button>
                                            <s-modal id="edit-modal" heading="Update Filter" size="large" onAfterHide={ () => setShowEdit(false)} >
                                                <s-stack gap="base">
                                                    <s-text-field
                                                        label="Filer"
                                                        name="name"
                                                        value={valueEdit}
                                                        onInput={(e :any) => handleEditFilter(e)}
                                                        error = {showEdit ? "The filter should not be empty." : ''}
                                                    />
                                                </s-stack>

                                                <s-button
                                                    slot="primary-action"
                                                    variant="primary"
                                                    // commandFor="edit-modal" 
                                                    // command="--hide"
                                                    onClick={() => handleSaveEdit()}
                                                >
                                                    Save
                                                </s-button>
                                                <s-button
                                                    slot="secondary-actions"
                                                    variant="secondary"
                                                    commandFor="edit-modal"
                                                    command="--hide"
                                                >
                                                    Cancel
                                                </s-button>
                                            </s-modal>
                                        </s-table-cell>
                                        <s-table-cell >
                                            <s-button
                                                // onClick={() => handleDelete(item.id)}
                                                variant="tertiary"
                                                commandFor="delete-modal"
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                            </s-button>
                                            <s-modal id="delete-modal" heading="Delete filter?">
                                                <s-stack gap="base">
                                                    <s-text>Are you sure you want to delete ?</s-text>
                                                </s-stack>

                                                <s-button
                                                    slot="primary-action"
                                                    variant="primary"
                                                    tone="critical"
                                                    commandFor="delete-modal"
                                                    command="--hide"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    Delete 
                                                </s-button>
                                                <s-button
                                                    slot="secondary-actions"
                                                    variant="secondary"
                                                    commandFor="delete-modal"
                                                    command="--hide"
                                                >
                                                    Cancel
                                                </s-button>
                                            </s-modal>
                                        </s-table-cell>
                                    </s-table-row>
                                ))
                            }
                        </s-table-body>
                    </s-table>
                :
                    <div className={styles.blockFilter}>
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <h2>No filters found</h2>
                        <s-text color="subdued">Try changing the filters or search term</s-text>
                    </div>
            }
            {/* {
                open &&
                <div className={styles.overlay}>
                    <div className={styles.formEdit}>
                        <div className={styles.title}>
                            <span>Update File</span>
                            <i 
                                className="fa-solid fa-xmark"
                                onClick={() => setOpen(!open)}
                            >
                            </i>
                        </div>
                        <div className={styles.inputEdit}>
                            <label>Filter</label>
                            <input 
                                type="text" 
                                value={valueEdit}
                                onChange={handleEditFilter}
                                className={`${showEdit && styles.inputError}`}
                            />
                            {
                                showEdit && 
                                <span className={styles.textError}>
                                    <i className="fa-solid fa-circle-exclamation"></i>
                                    The filter should not be empty.
                                </span>
                            }
                        </div>
                        <div className={styles.btnEdit}>
                            <button className={styles.btnCancelEdit} onClick={() => setOpen(!open)}>Cancel</button>
                            <button className={styles.btnSaveEdit} onClick={() => handleSaveEdit()}>Save</button>
                        </div>   
                    </div>
                </div>
            } */}
        </s-stack>
    )
}