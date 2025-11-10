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
        const newValue = e.target.value
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

        setOpen(!open)
    }

    return (
        <div className={styles.wrapper}>
            <span>Set up custom search filters so customers can more easily sort locations by specific criteria on your map to quickly find the type of location they are looking for. For example, you can set up filters like 'Local Boutique' or 'Wheelchair Accessible'.</span>
            
            <div className={styles.addFilter}>
                <label>Add a filter</label>
                <div className={styles.btnFilter}>
                    <input 
                        className={`${styles.input} ${show && styles.inputError}`}
                        type = "text"
                        value={value}
                        onChange={handleChange}
                    />

                    <button 
                        className={styles.add}
                        onClick={() => handleError()}
                    >
                        <i className="fa-solid fa-plus"></i>
                        Add
                    </button>
                </div>
                {
                    show && 
                    <span className={styles.textError}>
                        <i className="fa-solid fa-circle-exclamation"></i>
                        The filter should not be empty.
                    </span>
                }
            </div>
            {
                config && config.length > 0
                ? 
                    <table className={styles.tableFilter}>
                         <thead>
                            <tr>
                                <th style={{textAlign: "left"}}>Filter</th>
                                <th>Edit</th>
                                <th>Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                config.map((item: any, index: any) => (
                                    <tr key={index}>
                                        <td className={styles.colFilter}>{item.filter}</td>
                                        <td 
                                            className={styles.action} 
                                            onClick={() => {
                                                setOpen(true)
                                                setValueEdit(item.filter)
                                                setEditId(item.id)
                                            }}
                                        >
                                            <i className="fa-solid fa-pen"></i>
                                        </td>
                                        <td className={styles.action} onClick={() => handleDelete(item.id)}><i className="fa-solid fa-trash"></i></td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                :
                    <div className={styles.blockFilter}>
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <h2>No filters found</h2>
                        <span>Try changing the filters or search term</span>
                    </div>
            }
            {
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
            }

        </div>
    )
}