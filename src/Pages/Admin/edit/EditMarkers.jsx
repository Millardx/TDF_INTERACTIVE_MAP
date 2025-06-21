import React, { useState, useEffect, useRef } from 'react';

import UseToast from '../utility/AlertComponent/UseToast';
import NavBar from './navBar/NavBar';
import Confirmation from '../utility/ConfirmationComponent/Confirmation';
import MarkerModal from './MarkerModal';
import axios from 'axios';
import styles from './styles/editMarkersStyles.module.scss'
import icons from "../../../assets/for_landingPage/Icons";
import { motion, AnimatePresence } from 'framer-motion'
import MarkerUpload from './MarkerUpload';
import { API_URL } from '/src/config';
import PaginationControls from '../utility/PaginationComponent/PaginationControls';

//marker icon data
import markerData from '../../Users/map/Components/addMarker/markerData';

//loading content
import useLoading from '../utility/PageLoaderComponent/useLoading';
import LoadingAnim from '../utility/PageLoaderComponent/LoadingAnim';

export default function EditMarkers() {
    // toast alert pop up
    const mountToast = UseToast();
    // For loading
    const [isIconLoaded, setIsIconLoaded] = useState(false);
    const [isMarkerLoaded, setIsMarkerLoaded] = useState(false);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [isLoading, setIsLoading] = useLoading(true);
    const [isDeleting, setIsDeleting] = useState(false);     

    const [showUploadMarker, setShowUploadMarker] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [iconToDelete, setIconToDelete] = useState(null);     // targets icon to delete
    const [isMarker, setIsMarker] = useState(null);
    const [isDelete, setIsDelete] = useState(false); // Confirmation Modal 
    const [markers, setMarkers] = useState([]); // State for fetched markers
    const [currentMarkers, setCurrentMarkers] = useState([]);
    const [filteredMarkers, setFilteredMarkers] = useState([]);
    const [logsPerPage, setLogsPerPage] = useState(5);
    const [selectedMarkerId, setSelectedMarkerId] = useState(null);
    
    const [markerIcons, setMarkerIcons] = useState([]);  

    const [markersRef, setMarkersRef] = useState([]); // Full unsliced list 6-7-25

    const [deleteMessage, setDeleteMessage] = useState(null); // dynamic error message 6-21-2025


    // Fetch MarkerIcons
    const fetchMarkerIcons = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/markerIcons`);
            setMarkerIcons(response.data);
        } catch (error) {
            console.error('Error fetching marker icons:', error);
            mountToast('Error fetching marker icons:', 'error');
            // Add toast notification here if needed
        } finally {
            setIsIconLoaded(true);
        }
    };

    // Fetch data on component mount and keep it updated on changes
    useEffect(() => {
        setSelectedMarkerId(null); //Reset Selected ID
        fetchMarkerIcons();
    }, []);

    const handleIconArchive = async (markerId, iconPath , name) => {
        //function guard
        if (isDeleting) return;    // break execution if already loading

        setIsDeleting(true);

        try {
          console.log('Archiving marker icon...', markerId, name,  iconPath);
      
          const response = await axios.put(
            `${API_URL}/api/archive/markerIcon/${markerId}`,
            { iconPath , name}
          );
      
          console.log("API Response:", response);
      
          if (response.status === 200) {
            setMarkerIcons((prevIcons) =>
              prevIcons.map((icon) =>
                icon._id === markerId
                  ? { ...icon, iconPath: null, isArchived: true }
                  : icon
              )
            );
            console.log('Marker Icon archived successfully');
            mountToast("Marker icon archived successfully", "success");
            setIsDeleteIcon(false);
            setIsDelete(false);
            setIconToDelete(null);
            fetchMarkerIcons();
          }
        } catch (error) {
          console.error('Error archiving marker icon:', error);
          mountToast("Error archiving marker icon. Please try again.", "error");
          setIconToDelete(null);
        } finally {
            setIsDeleting(false);
        }
    };
      


    // icon delete
    const [isEditIcon, setIsEditIcon] = useState(false);
    const [isDeleteIcon, setIsDeleteIcon] = useState(false);

    const handleIconDelete = () => {
        setIsDeleteIcon(!isDeleteIcon);
    }
    

    const fetchMarkers = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/markers/markerData`);
        const sortedMarkers = response.data;
    
        setMarkersRef(sortedMarkers); // Full list (unfiltered)
        setMarkers(sortedMarkers);    // For backup / direct access
        setFilteredMarkers(sortedMarkers); // Initially unfiltered
        setCurrentMarkers(sortedMarkers.slice(0, logsPerPage)); // First page
      } catch (error) {
        console.error('Error fetching markers:', error);
        mountToast('Error fetching markers', 'error');
      } finally {
        setIsMarkerLoaded(true);
      }
    };
    
    
    useEffect(() => {
        fetchMarkers();
    }, [logsPerPage]);
    

    const handleDeleteBtn = () => {
        setIsDeleting(false);
        setIsDelete(!isDelete);
        setIsMarker(null);
        setIconToDelete(null);
        setDeleteMessage(null);
    }

    const confirmAndDelete = () => {
        setConfirmDelete(true);
    }

    useEffect(() => {
        if (confirmDelete) {
            if (isMarker) {
                handleConfirmDelete(isMarker); 
            } else if (iconToDelete) {
                handleIconArchive(iconToDelete.id, iconToDelete.path, iconToDelete.name);
            }
            
            setConfirmDelete(false);
        }
    }, [confirmDelete, isMarker, iconToDelete]);
    
    {/*handle delete for the Markers*/}
    const handleConfirmDelete = async (markerId) => {
        //function guard
        if (isDeleting) return;    // break execution if already loading

        setIsDeleting(true);

        try {
          const response = await axios.delete(`${API_URL}/api/markers/${markerId}`);
          setMarkers(markers.filter(marker => marker._id !== confirmDelete)); // Remove the deleted marker from the list
          mountToast('Marker and related documents deleted successfully', 'success');
          setIsDelete(false);
          setConfirmDelete(false);
          fetchMarkers();
        } catch (error) {
          console.error('Error deleting marker:', error);
          mountToast('Error deleting marker', 'error');
          setIsDelete(false);
        } finally {
            setIsDeleting(false);
        }
    };
      
    const handleOpenModal = (marker) => {
        setShowUploadModal(true);
        setSelectedMarker(marker);
        
    };

    const handleCloseModal = () => {
        setShowUploadModal(false);
        fetchMarkers();
        setIsEditIcon(false);   // ✅ Reset edit/delete modes
        setIsDeleteIcon(false);
    };

    const [selectedMarker, setSelectedMarker] = useState(null);
    const handleUpdate = (updatedMarker) => {
        // Logic to update markers in the parent state or refetch them
        console.log('Updated Marker:', updatedMarker);
        handleCloseModal();
    };

    // Open modal for add or edit
    const handleUploadMarker = (id = null) => {
        setSelectedMarkerId(id); // Set markerId or null for new
        setShowUploadMarker(true);
    };

    useEffect(() => {
        const rootDiv = document.getElementById("root");
    
        // Add or remove className based on current page
    
        if (location.pathname === "/markers") {
          rootDiv.classList.add(styles.rootDiv);
        } else {
          rootDiv.classList.remove(styles.rootDiv);
        }
    }, [location])

    // pagination 
    // Updated for Integration of Sorted Newest - Olders 6-7-25
    const handleFilterChange = (searchTerm, limit, currentPage) => {
        const filtered = markersRef.filter((marker) =>
          [marker.areaName, marker.iconType]
            .map((value) => value?.toString().toLowerCase())
            .some((value) => value?.includes(searchTerm.toLowerCase()))
        );
      
        setLogsPerPage(limit);
        setFilteredMarkers(filtered);
      
        const offset = currentPage * limit;
        setCurrentMarkers(filtered.slice(offset, offset + limit));
      };
      

      const handlePaginationChange = (currentPage) => {
        const offset = currentPage * logsPerPage;
        setCurrentMarkers(filteredMarkers.slice(offset, offset + logsPerPage));
      };
      

    // stop loading if both are fully loaded 
    useEffect(() => {

        if (isFirstLoad) setIsLoading(true);    // Start loading

        if (isIconLoaded && isMarkerLoaded) {
            setIsLoading(false);
            setIsFirstLoad(false);    // Mark that first load is done
        }
    }, [isIconLoaded, isMarkerLoaded]);

    return (
        <>
            {isLoading ? (
                <LoadingAnim message="Loading map markers..." />
            ) : (
                <>
                    <NavBar />

                    <div className={styles.markerContainer}>
                        <div className={styles.header}>
                            <span className={styles.txtTitle}>Edit Markers</span>
                        </div>

                        <span className={`${styles.txtTitle} ${styles.listHeader}`}>Marker Icon List</span>

                        <div className = { styles.listCont }>
                            <div className = { styles.btns }>
                                <button 
                                    className = { `${styles.txtTitle} ${styles.addBtn}`}
                                    onClick={() => {
                                        setSelectedMarkerId(null);
                                        setIsEditIcon(false);        // ✅ Hide edit
                                        setIsDeleteIcon(false);      // ✅ Hide delete
                                        setShowUploadMarker(true);
                                      }}
                                      
                                >Add
                                </button>

                                <button 
                                    className = { !isEditIcon ? `${styles.txtTitle} ${styles.editBtn}` : `${styles.txtTitle} ${styles.cancelBtn}` }
                                    onClick = {() => {setIsEditIcon(!isEditIcon); setIsDeleteIcon(false); } }
                                >
                                    { !isEditIcon ? "Edit" : "Cancel"}
                                </button>

                                <button 
                                    className = { !isDeleteIcon ? `${styles.txtTitle} ${styles.deleteBtn}` : `${styles.txtTitle} ${styles.cancelBtn}` }
                                    onClick = {() => { handleIconDelete(); setIsEditIcon(false); } }
                                >
                                    { !isDeleteIcon ? "Delete" : "Cancel" }
                                </button>
                            </div>
                            
                            {/* modified by Lorenzo @ 05/19/2025 */}
                            <div className={styles.iconListWrapper}>
                                <div className={styles.iconList}>
                                    {markerIcons.map((iconData) => (
                                    <div key={iconData._id} className={styles.marker}>
                                        <img 
                                        src={`${iconData.iconPath}`} 
                                        alt={iconData.name} 
                                        className={styles.icon} 
                                        />
                                            {isDeleteIcon && (
                                                <div 
                                                className={styles.iconOverlay}
                                                onClick={() => {
                                                    // setSelectedMarkerId(iconData._id);
                                                    // Trigger the archiving when the delete icon is clicked
                                                    setIconToDelete({
                                                        id: iconData._id,
                                                        path: iconData.iconPath,
                                                        name: iconData.name,
                                                    });

                                                    setIsDelete(true);      // Open the modal

                                                    setDeleteMessage('Deleting this icon will leave other markers with no icon display. Delete this icon?')
                                                    
                                                }}
                                            >
                                                    <img src={icons.minus} alt="Delete Icon" />
                                                </div>
                                            )}
                                            {isEditIcon && (
                                                <div
                                                    className = { `${styles.iconOverlay} ${styles.editIcon}` }
                                                    onClick = {() => {setShowUploadMarker(true);
                                                        setSelectedMarkerId(iconData._id);
                                                        setIsEditIcon(false);  
                                                        }}
                                                >
                                                    <div className = { styles.bg }>
                                                        <img src={icons.pen} alt="Edit Icon" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        
                                    ))}
                                </div>
                            </div>
                        </div>

                        <span className={`${styles.txtTitle} ${styles.listHeader}`}>Marker List</span> <br></br>

                        <div className={styles.tblWrapper}>

                            <PaginationControls
                                data={filteredMarkers}
                                rowsPerPageOptions={[5, 10, 15, 20]}
                                onFilterChange={handleFilterChange}
                                onPaginationChange={handlePaginationChange}
                            />

                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Icon Type</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentMarkers.length > 0 ? (
                                        currentMarkers.map((marker) => (
                                            <tr key={marker._id}>
                                                <td>{marker.areaName}</td>
                                                <td>{marker.iconType}</td>
                                                <td>
                                                    <div className={styles.actionBtns}>
                                                        <button onClick={() => { handleOpenModal(marker); }}>
                                                            <img
                                                                className={`${styles.icon} ${styles.update}`}
                                                                src={icons.pencil}
                                                                alt="Update Item"
                                                            />
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                    handleDeleteBtn(); 
                                                                    setIsMarker(marker._id);
                                                                    setDeleteMessage('Contents will be deleted and will not be restorable. Delete this marker?')
                                                                }}
                                                            >
                                                            <img
                                                                className={`${styles.icon} ${styles.delete}`}
                                                                src={icons.remove}
                                                                alt="Delete Item"
                                                            />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3">No markers available</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Edit Marker Container */}
                    <AnimatePresence>
                    {showUploadModal && (
                        <motion.div 
                            className={styles.modal}
                            initial = {{opacity: 0}}
                            animate = {{opacity: 1}}
                            exit = {{opacity: 0}}
                            transition = {{duration: 0.2, ease: "easeInOut"}}   
                        >
                        <div className={styles.modalContent}>
                            <MarkerModal 
                                onClose={ handleCloseModal }
                                markerData={selectedMarker}
                                onUpdate={handleUpdate}
                            />
                        </div>
                        </motion.div>
                    )}
                    </AnimatePresence>

                    {/* Upload Marker Icon */}
                    <AnimatePresence>
                    {showUploadMarker && (
                        <motion.div
                            className={styles.modal}
                            initial = {{opacity: 0}}
                            animate = {{opacity: 1}}
                            exit = {{opacity: 0}}
                            transition = {{duration: 0.2, ease: "easeInOut"}} 
                        >
                            <div className = { styles.modalContent }>
                                <MarkerUpload 
                                    markerId={selectedMarkerId}
                                    onClose = {() => setShowUploadMarker(false)}
                                    onRefresh={fetchMarkerIcons} 
                                />
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>


                    {/* Confirmation Modal */}
                    <AnimatePresence>
                    {isDelete && (
                        <motion.div 
                            className = { styles.confirmation }
                            initial = {{opacity: 0}}
                            animate = {{opacity: 1}}
                            exit = {{opacity: 0}}
                            transition = {{duration: 0.2, ease: "easeInOut"}}
                        >
                            <Confirmation 
                                onCancel = {() => handleDeleteBtn()}
                                setConfirmDelete={ confirmAndDelete }
                                isDeleting={ isDeleting }
                                deleteMessage = { deleteMessage }
                            />
                        </motion.div>
                    )}
                    </AnimatePresence>  
                </>
            )}
        </>
    )
}