import { useState , useEffect } from 'react'
import styles from "./styles/markerModalStyles.module.scss"
import marker from "../../../assets/icon/Icons";
import icons from "../../../assets/for_landingPage/Icons";
import axios from 'axios';
import UseToast from '../utility/AlertComponent/UseToast';
import {API_URL } from '/src/config';

export default function MarkerModal({ onClose ,markerData }) {
    const mountToast = UseToast();
    const [isMarker, setMarker] = useState(null);
    const [areaName, setAreaName] = useState(markerData?.areaName || "");
    const [iconType, setIconType] = useState(markerData?.iconType || ""); 
    const [isAreaNameEdited, setIsAreaNameEdited] = useState(false);
    const [isIconTypeEdited, setIsIconTypeEdited] = useState(false);

    const [markerIcons, setMarkerIcons] = useState([]);        // Fetch icon types from API
    // Fetch marker icons from the database
    const fetchMarkerIcons = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/markerIcons`);
            setMarkerIcons(response.data); // Store fetched marker icons
        } catch (error) {
            console.error("Error fetching marker icons:", error);
            mountToast("Error fetching marker icons", "error");
        }
    };

    // Fetch marker icons when component mounts
    //Added Millard 4-28
    useEffect(() => {
        fetchMarkerIcons();
    }, []); // 🔥 Fetch marker icons only once when component mounts
    
    // 🔥 New useEffect that waits for markerIcons + markerData to be ready
    useEffect(() => {
        if (markerData?.iconType && markerIcons.length > 0) {
            const selectedMarker = markerIcons.find((icon) => icon.name === markerData.iconType);
            setMarker(
                selectedMarker ? `${API_URL}/uploads/icons/${selectedMarker.iconPath}` : ""
            );
        }
    }, [markerIcons, markerData]);
    
    

    


  // Handle changes to areaName or iconType
  useEffect(() => {
    setIsAreaNameEdited(areaName !== markerData?.areaName);
    setIsIconTypeEdited(iconType !== markerData?.iconType);
}, [areaName, iconType, markerData]);
  
const handleIconTypeChange = (e) => {
    const selectedType = e.target.value;
    setIconType(selectedType); // Update selected icon type
    const selectedMarker = markerIcons.find((icon) => icon.name === selectedType);
    setMarker(
        selectedMarker ? `${API_URL}/uploads/icons/${selectedMarker.iconPath}` : ""
    ); // Dynamically set the corresponding marker icon
};


    const handleSave = async (e) => {
        e.preventDefault();
          // Check if no changes have been made
          if (!isAreaNameEdited && !isIconTypeEdited) {
            mountToast('No changes detected for Marker Name or Icon Type', 'warn');
            return;
        }
        try {
            const response = await axios.put(`${API_URL}/api/markers/${markerData._id}`, {
                areaName,
                iconType,
            });

            mountToast(response.data.message, 'success');
            fetchMarkerIcons(); // Refetch markers to update UI
            onClose(); // Close modal
        } catch (error) {
            console.error('Error updating marker:', error);
            mountToast('Error updating marker', 'error');
        }
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <>
            <div className={styles.modalContent}>
                <span className={styles.close} onClick={handleClose}> 
                    <img src={icons.close} alt="close" />
                </span>

                <div className={styles.header}>
                    <span className = { styles.txtTitle}>
                        EDIT MARKER
                    </span>
                </div>

                <form className = { styles.form }>
                    <div className = { styles.editContent }>
                        <label className = { styles.txtSubTitle }>Marker Name</label>
                        <input 
                            type="text"
                            value={areaName}
                            onChange={(e) => setAreaName(e.target.value)}
                            required
                        />
                     <div className={styles.iconType}>
                            <div className={styles.section1}>
                                <label className={styles.txtSubTitle}>Icon Type</label>
                                <select value={iconType} onChange={handleIconTypeChange}>
                                    {/*<option value="">Select an Icon</option>*/}
                                    {markerIcons.map((icon) => (
                                        <option key={icon._id} value={icon.name}>
                                            {icon.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.section2}>
                                {isMarker ? (
                                    <img className={styles.marker} src={isMarker} alt="Icon Preview" />
                                ) : (
                                    <span>No icon selected</span> // Placeholder if no icon is selected
                                )}
                            </div>
                        </div>
                    </div>

                    <div className = { styles.btns }>
                        <button 
                            className = { `${styles.saveBtn} ${styles.txtTitle}` }
                            type="submit" 
                            onClick={handleSave}
                            // onClick={handleUpdate}
                        >
                            Save
                        </button>
                        <button 
                            className = { `${styles.cancelBtn} ${styles.txtTitle}` } 
                            type="button" 
                            onClick={handleClose}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </>
    )
} 