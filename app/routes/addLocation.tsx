import { ActionFunctionArgs, Form, LoaderFunctionArgs, redirect, useNavigate, useSubmit } from "react-router";
import styles from "../css/addLocation.module.css"
import { useRef, useState } from "react";
import prisma from "app/db.server";

export async function loader({request}:LoaderFunctionArgs) {
    return {};
}

export async function action({request}: ActionFunctionArgs) {
    const formData = await request.formData();
    const contract: Record<string, string[]> = {};
    const urls = formData.getAll("contract") as string[];

  urls.forEach((url) => {
    const lower = url.toLowerCase();
    if (lower.includes("facebook")) {
      if (!contract.facebook) contract.facebook = [];
      contract.facebook.push(url);
    } else if (lower.includes("youtube")) {
      if (!contract.youtube) contract.youtube = [];
      contract.youtube.push(url);
    } else if (lower.includes("linkedin")) {
      if (!contract.linkedin) contract.linkedin = [];
      contract.linkedin.push(url);
    } else {
      // fallback cho social khác
      const key = "other";
      if (!contract[key]) contract[key] = [];
      contract[key].push(url);
    }
  });

     await prisma.store.create({
        data: {
            storeName: formData.get("storeName")?.toString() ?? "",
            address: formData.get("address")?.toString() ?? "",
            city: formData.get("city")?.toString() ?? "",
            state: formData.get("state")?.toString() ?? "",
            code: formData.get("code")?.toString() ?? "",
            phone: formData.get("phone")?.toString() ?? "",
            image: formData.get("image")?.toString() ?? "",
            directions: formData.get("directions")?.toString() ?? "",
            contract, // đây là object chứa arrays
            source: formData.get('source')?.toString() ?? "",
            visibility: formData.get('visibility')?.toString() ?? "",
            time:{
                mondayOpen: formData.get('monday-open')?.toString() ?? "",
                mondayClose: formData.get('monday-close')?.toString() ?? "",
                tuesdayOpen: formData.get('tuesday-open')?.toString() ?? "",
                tuesdayClose: formData.get('tuesday-close')?.toString() ?? "",
                fridayOpen: formData.get('friday-open')?.toString() ?? "",
                fridayClose: formData.get('friday-close')?.toString() ?? "",
                thursdayOpen: formData.get('thursday-open')?.toString() ?? "",
                thursdayClose: formData.get('thursday-close')?.toString() ?? "",
                wednesdayOpen: formData.get('wednesday-open')?.toString() ?? "",
                wednesdayClose: formData.get('wednesday-close')?.toString() ?? "",
                satudayOpen: formData.get('satuday-open')?.toString() ?? "",
                satudayClose: formData.get('satuday-close')?.toString() ?? "",
                sundayOpen: formData.get('sunday-open')?.toString() ?? "",
                sundayClose: formData.get('sunday-close')?.toString() ?? "",
            },
        },
    });
    return redirect("/app")
}

export default function AddLocation () {
    const submit = useSubmit();
    const navigate = useNavigate();
    const [click, setClick] = useState(false)
    const [countSocial, setCountSocial] = useState([{},{}]);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const handleAdd = () => {
        const newItem = {};
        setCountSocial([...countSocial, newItem]);
    }

    const handleRemove = (index: number) => {
        const newArr =  countSocial.filter((_,i) => i !== index)
        setCountSocial(newArr)
    }

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleClick = () => {
        fileInputRef.current?.click(); // Kích hoạt input file
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Hiển thị preview
            const imageUrl = URL.createObjectURL(file);
            setPreview(imageUrl);

            // Đọc file thành base64
            const reader = new FileReader();
            reader.onloadend = () => {
            setImageBase64(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <s-page heading="Dynamic Store Locator">
            <div className={styles.title}>
                <div className={styles.boxTitle}>
                    <button onClick={() => navigate(-1)} className={styles.btnBack}>
                        <i className="fa-solid fa-arrow-left"></i>
                    </button>
                    <h2>Location Editor</h2>
                    {
                        click 
                        ?
                        <button className={styles.btnVisible} onClick={() => setClick(!click)}>
                            <i className="fa-solid fa-eye"></i>
                            visible
                        </button>
                        :   
                        <button className={styles.btnHidden} onClick={() => setClick(!click)}>
                            <i className="fa-solid fa-eye-slash"></i>
                            hidden
                        </button>
                    }
                </div>
                <div className={styles.boxBtn}>
                    <button 
                        type="button"
                        className={styles.btnSave}
                        onClick={() => {
                            const form = document.getElementById("storeForm") as HTMLFormElement;
                            const requiredFields = ["storeName", "address", "city", "state", "code"];
                            const emptyFields = requiredFields.filter((name) => {
                            const el = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement;
                            return !el.value.trim();
                            });

                            if (emptyFields.length > 0) {
                            alert("Please fill out all required fields: " + emptyFields.join(", "));
                            return; // dừng submit
                            }

                            submit(form, { method: "post" });;
                        }}
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        className={styles.btnDelete}
                        onClick={() => {
                            if (confirm("Are you sure you want to clear all data?")) {
                            const form = document.getElementById("storeForm") as HTMLFormElement;
                            form.reset(); // reset lại tất cả input trong form
                            setCountSocial([{}, {}]); // reset social về mặc định
                            setPreview(null); // xoá ảnh
                            setImageBase64(null);
                            setClick(false); // đưa visibility về hidden
                            }
                        }}
                        >
                        Delete
                    </button>
                </div>
            </div>

            <div className={styles.body}>
                <Form id = "storeForm" className={styles.information} method="post">
                    <input type="hidden" name="visibility" value={click ? "visible" : "hidden"} />
                    <div className={styles.shared}>
                        <div className={styles.titleForm}>
                            <div className={styles.right}>
                                <h4>Location Information</h4>
                                <p className={styles.source}>Manual</p>                               
                            </div>
                            <p>Customize your location information</p>
                        </div>
                        <div className={styles.formLocation}>
                            <label>
                                <div className={styles.sharedForm}>
                                    <div>Location Name</div>
                                    <input 
                                        type ="text"
                                        name = "storeName"
                                        required
                                    />
                                </div>
                            </label>
                            <label>
                                <div className={styles.sharedForm}>
                                    <div>Address 1</div>
                                    <input 
                                        type ="text"
                                        name = "address"
                                        required
                                    />
                                </div>
                            </label>
                             <label>
                                <div className={styles.sharedRow}>
                                    <div className={styles.sharedForm}>
                                        <div>City</div>
                                         <input 
                                            type ="text"
                                            name = "city"
                                            required
                                        />
                                    </div>
                                    <div className={styles.sharedForm}>
                                        <div>State</div>
                                        <select name="state" required>
                                            <option value="AL">AL</option>
                                            <option value="AK">AK</option>
                                            <option value="AS">AS</option>
                                        </select>
                                        
                                    </div>
                                    <div className={styles.sharedForm}>
                                        <div>Zip Code</div>
                                        <input 
                                            type ="text"
                                            name = "code"
                                            required
                                        />
                                    </div>
                                </div>
                            </label>
                            <label>
                                <div className={styles.sharedRow}>
                                    <div className={styles.sharedForm}>
                                        <div>Phone Number</div>
                                        <input 
                                            type ="text"
                                            name = "phone"
                                        />
                                    </div>
                                    <div className={styles.sharedForm}>
                                        <div>Website URL</div>
                                        <input 
                                            type ="text"
                                            name = "url"
                                        />
                                    </div>
                                </div>
                            </label>
                            <label>
                                <div className={styles.sharedForm}>
                                    <div>Derection</div>
                                    <input 
                                        type ="text"
                                        name = "directions"
                                    />
                                </div>
                            </label>
                        </div>
                    </div>
                    <div className={styles.shared}>
                        <div className={styles.titleForm}>
                            <div className={styles.right}>
                                <h4>Social Media</h4>
                                <button type="button" onClick={() => handleAdd()}>
                                    <i className="fa-solid fa-circle-plus"></i>
                                    Add Social Media
                                </button>                              
                            </div>
                            <p>Customize your location information</p>
                        </div>
                        <div className={styles.formSocial}>
                            {
                                countSocial.map((item, index) => (
                                    <div className={styles.socialSection} key = {index}>
                                    <select>
                                        <option value="linkedin">LinkedIn</option>
                                        <option value="youtube">Youtube</option>
                                        <option value="facebook">Facebook</option>
                                    </select>
                                    <input 
                                        type = "text"
                                        name = "contract"
                                    />
                                    <button type="button" onClick={() => handleRemove(index)}>
                                        <i className="fa-regular fa-trash-can"></i>
                                    </button>
                                </div>
                                ))
                            }
                            
                        </div>
                    </div>
                    <div className={styles.shared}>
                        <div className={styles.titleForm}>
                            <div className={styles.right}>
                                <h4>Hours of Operation</h4>                                          
                            </div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Open</th>
                                    <th>Close</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Monday</td>
                                    <td><input type="text" name="monday-open"/></td>
                                    <td><input type="text" name="monday-close"/></td>
                                    <td><i className="fa-solid fa-eye"></i></td>
                                </tr>
                                <tr>
                                    <td>Tuesday</td>
                                    <td><input type="text" name="tuesday-open "/></td>
                                    <td><input type="text" name="tuesday-close"/></td>
                                    <td><i className="fa-solid fa-eye"></i></td>
                                </tr>
                                <tr>
                                    <td>Wednesday</td>
                                    <td><input type="text" name="wednesday-open"/></td>
                                    <td><input type="text" name="wednesday-open"/></td>
                                    <td><i className="fa-solid fa-eye"></i></td>
                                </tr>
                                <tr>
                                    <td>Thursday</td>
                                    <td><input type="text" name="thursday-open"/></td>
                                    <td><input type="text"name="thursday-close"/></td>
                                    <td><i className="fa-solid fa-eye"></i></td>
                                </tr>
                                <tr>
                                    <td>Friday</td>
                                    <td><input type="text" name="friday-open"/></td>
                                    <td><input type="text" name="friday-close"/></td>
                                    <td><i className="fa-solid fa-eye"></i></td>
                                </tr>
                                <tr>
                                    <td>Satuday</td>
                                    <td><input type="text" name="satuday-open"/></td>
                                    <td><input type="text" name="satuday-close"/></td>
                                    <td><i className="fa-solid fa-eye"></i></td>
                                </tr>
                                <tr>
                                    <td>Sunday</td>
                                    <td><input type="text" name="sunday-open"/></td>
                                    <td><input type="text" name="sunday-close"/></td>
                                    <td><i className="fa-solid fa-eye"></i></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className={styles.shared}>
                        <div className={styles.titleForm}>
                            <div className={styles.right}>
                                <h4>Add a logo for this location</h4>                                          
                            </div>
                        </div>
                        <p>Customize your location information</p>
                        <div className={styles.addImage}>
                            <div className={styles.boxAddImage} onClick={() =>  handleClick()}>
                                {preview ? (
                                    <div className={styles.previewBox}>
                                        <img src={preview} alt="preview" className={styles.previewImage} />
                                        <i 
                                            className="fa-solid fa-ban" 
                                            onClick={ (e)=> {
                                                e.stopPropagation();
                                                setPreview(null) 
                                            }}
                                        />
                                    </div>
                                        
                                ) : (
                                    <div>
                                        <button type="button" onClick={() => handleClick()}>Add file</button>
                                        <p>Accepts .gif, .jpg, .png and .svg</p>
                                    </div>          
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                id="upload-file"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: "none" }}
                            />
                            <input type="hidden" name="image" value={imageBase64 ?? ""} />
                            <div>We support .gif, .jpg, .png, and .svg files up to 3MB</div>
                        </div>
                    </div>
                    {/* <div className={styles.shared}>
                         
                    </div> */}
                </Form>
                <img src="/place2.jpg" alt="demo" className={styles.boxImage}/>
            </div>
        </s-page>
    );
}