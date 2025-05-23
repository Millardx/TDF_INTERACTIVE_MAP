import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import moment from 'moment';
import { motion, AnimatePresence } from 'framer-motion'

import Confirmation from '../utility/ConfirmationComponent/Confirmation';
import ConfirmRestore from '../utility/ConfirmationComponent/ConfirmRestor';
import PaginationControls from '../utility/PaginationComponent/PaginationControls';         // added by Lorenzo @04/30/2025


import icons from "../../../assets/for_landingPage/Icons";
import NavBar from './navBar/NavBar';
import styles from './styles/archiveStyles.module.scss';

import UseToast from '../utility/AlertComponent/UseToast';
import { API_URL } from '/src/config';
import { useAuth } from '/src/Pages/Admin/ACMfiles/authContext';

//loading content
import useLoading from '../utility/PageLoaderComponent/useLoading';
import LoadingAnim from '../utility/PageLoaderComponent/LoadingAnim';


export default function Archive() {
    const [archives, setArchives] = useState([]);
    const [isLoading, setIsLoading] = useLoading(true);     // For loading
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    //for deletion
    const [itemToDelete, setItemToDelete] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isDelete, setIsDelete] = useState(false);

    //for restoration
    const [itemToRestore, setItemToRestore] = useState(null);
    const [itemId, setItemId] = useState(null);
    const [confirmRestore, setConfirmRestore] = useState(false);
    const [isRestore, setIsRestore] = useState(false);

    //for pagination
    const [OriginalItems, setOriginalItems] = useState([]);
    const [currentItems, setCurrentItems] = useState([]);
    const [logsPerPage, setLogsPerPage] = useState(5);
    
    const mountToast = UseToast();
    const location = useLocation();
    const [fetchLimit, setFetchLimit] = useState(10);

    const { user: authUser } = useAuth();
    

    const token = localStorage.getItem('token');
    let userRole = '';
    if (token) {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        userRole = decoded.role;
    }




    // for deletion
    const handleDeleteBtn = () => {
        setIsDelete(!isDelete);
    }

    const confirmAndDelete = () => {
        setConfirmDelete(true);
    }

    useEffect(() => {
        if (confirmDelete && itemToDelete) {
            handleDelete(itemToDelete); 
            setConfirmDelete(false);
        }
    }, [confirmDelete, itemToDelete]);

    //for restoration
    const handleRestoreBtn = () => {
        setIsRestore(!isRestore);
    }

    const confirmAndRestore = () => {
        setConfirmRestore(true);
    }

    useEffect(() => {
        if (confirmRestore && itemId && itemToRestore) {
            handleRestore(itemId, itemToRestore); 
            setConfirmRestore(false);
        }
    }, [confirmRestore, itemId, itemToRestore]);


    useEffect(() => {
        // Add or remove className based on current page
        const rootDiv = document.getElementById("root");
        if (location.pathname === "/archive") {
          rootDiv.classList.add(styles.rootDiv);
        } else {
          rootDiv.classList.remove(styles.rootDiv);
        }
    }, [location]);

    const filterArchivesByRole = (archivesData) => {
        if (authUser?.role === 'admin') {
            return archivesData; // Admin sees everything
        } else {
            return archivesData.filter((archive) => archive.originalCollection !== 'User');
        }
    };
    

    const fetchArchives = async (limit) => {
        if (isFirstLoad) setIsLoading(true);    // Start loading

        try {
            const response = await axios.get(`${API_URL}/api/archive/archivesData?limit=${limit}`);
            let data = response.data;
    
            // Apply role-based filtering
            data = filterArchivesByRole(data);
    
            setArchives(data);
            setOriginalItems(data);
            setCurrentItems(data.slice(0, logsPerPage));
        } catch (error) {
            mountToast('Error fetching archives', 'error');
            console.error('Error fetching archives:', error);
        } finally {
            setIsLoading(false);
            setIsFirstLoad(false);    // Mark that first load is done
        }
    };
    

    useEffect(() => {
        fetchArchives(fetchLimit); // Fetch archives with the current limit
    }, [fetchLimit]); // Re-run when fetchLimit changes
  
    // Delete handler
    const handleDelete = async (archiveId) => {
        //function guard
        if (isDeleting) return;    // break execution if already loading

        setIsDeleting(true);    // run loading

        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`${API_URL}/api/delete/archive/${archiveId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            mountToast(response.data.message, 'success');
            fetchArchives(fetchLimit);
            setConfirmDelete(false);
            setItemToDelete(null);
            setIsDelete(false);
    
            // Update UI by filtering out the deleted item
            setArchives((prev) => prev.filter((archive) => archive._id !== archiveId));
        } catch (error) {
            console.error('Error deleting archive entry:', error.response?.data || error.message);
            mountToast(error.response?.data?.error || 'Error deleting archive entry', 'error');
        } finally {
            setIsDeleting(false);
        }
    };
        
        

    const handleRestore = async (archiveId, type) => {
        //function guard
        if (isRestoring) return;    // break execution if already loading

        setIsRestoring(true);   // run loading

        try {
            const token = localStorage.getItem('token');
    
            // Determine the correct endpoint based on the type
            let endpoint = '';
            if (type === 'document') {
                endpoint = `${API_URL}/api/restore/user/${archiveId}`;
            } else if (type === 'markerIcon') {
                endpoint = `${API_URL}/api/restore/markerIcon/${archiveId}`;
            } else {
                // Handle other types (e.g., card, audio, etc.)
                endpoint = `${API_URL}/api/restore/${archiveId}`;
            }
    
            // Make the API call to restore the archive with Authorization header
            const response = await axios.put(endpoint, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
    
            mountToast(response.data.message, 'success');
    
            // Close the confirmation modal and reset states
            setConfirmRestore(false);
            setItemToRestore(null);
            setItemId(null);
            setIsRestore(false);
    
            // Refresh the archive list
            fetchArchives(fetchLimit);
    
            // Remove restored item from UI
            setArchives((prev) => prev.filter((archive) => archive._id !== archiveId));
        } catch (error) {
            console.error('Error restoring archive entry:', error.response?.data || error.message);
            mountToast(error.response?.data?.error || 'Error restoring archive entry', 'error');
        } finally {
            setIsRestoring(false);
        }
    };
        

    // Added by Lorenzo @ 05/01/2025
    const handleFilterChange = (searchTerm, limit, currentPage) => {
        const filtered = archives.filter((archive) =>
            [
                archive.originalCollection,                     // e.g., 'User', 'MarkerIcon'
                archive.fieldName,                              // e.g., 'email', 'iconPath'
                ...Object.values(archive.data || {}),           // dynamically includes name, email, role, iconPath, etc.
                archive.archivedAt                              // archive timestamp
            ]
                .map((value) => value?.toString().toLowerCase())
                .some((value) => value?.includes(searchTerm.toLowerCase()))
        );
    
        setLogsPerPage(limit);
        setOriginalItems(filtered);
    
        const offset = currentPage * limit;
        setCurrentItems(filtered.slice(offset, offset + limit));  
    };
    
    const handlePaginationChange = (currentPage) => {
        const offset = currentPage * logsPerPage;
        setCurrentItems(OriginalItems.slice(offset, offset + logsPerPage)); 
    };


    return (
        <>
            {isLoading ? (
                <LoadingAnim message="Loading deleted items..." />
            ) : (
                <>
                    <NavBar />
                    <div className={styles.archiveContainer}>
                        <div className={styles.header}>
                            <span className={styles.txtTitle}>Deleted Items</span>
                        </div>
                        <span className={`${styles.txtTitle} ${styles.archiveHeader}`}>Archive List</span>

                        <PaginationControls
                            data={OriginalItems}
                            rowsPerPageOptions={[5, 10, 15, 20]}
                            onFilterChange={handleFilterChange}
                            onPaginationChange={handlePaginationChange}
                        />

                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Collection Name</th>
                                    <th>Type</th>
                                    <th>Data From:</th>
                                    <th>Date&Time</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {archives.length > 0 ? (
                                    currentItems.map((archive) => {
                                        const isDocument = archive.originalCollection === 'User'; // Check if it's a document (User)
                                        const isMarkerIcon = archive.originalCollection === 'MarkerIcon'; // Check if it's a MarkerIcon
                                        
                                        const typeDisplay = (() => {
                                            if (archive.originalCollection === 'User') return 'Credentials';
                                            if (archive.originalCollection === 'MarkerIcon') return 'Icon Image';
                                            if (archive.originalCollection === 'Modal') return 'Modal Image';
                                            if (archive.originalCollection === 'Cards') return 'Card Image';
                                            if (archive.originalCollection === 'Audio') {
                                            const ext = archive.data.format || 'Audio';
                                            return `Audio (.${ext.toUpperCase()})`;
                                            }
                                            if (archive.originalCollection === 'NewsEvent') return 'News Event Image';
                                            if (archive.originalCollection === 'AboutUs') return 'About Us Image';
                                            return archive.fieldName;
                                        })();
                                        

                                        const dataToDisplay = (() => {
                                            if (isDocument) {
                                                return (
                                                    <ul className={styles.noBullets}>
                                                        <li><strong>Name:</strong> {archive.data.name || 'N/A'}</li>
                                                        <li><strong>Email:</strong> {archive.data.email || 'N/A'}</li>
                                                        <li><strong>Role:</strong> {archive.data.role || 'N/A'}</li>
                                                    </ul>
                                                );
                                            }
                                        
                                            if (isMarkerIcon) {
                                                return (
                                                    <ul className={styles.noBullets}>
                                                        <li><strong>Icon Name:</strong> {archive.data.name || 'N/A'}</li>
                                                    </ul>
                                                );
                                            }
                                        
                                            if (archive.originalCollection === 'NewsEvent') {
                                                return (
                                                    <ul className={styles.noBullets}>
                                                        <li><strong>News Title:</strong> {archive.data.header || 'N/A'}</li>
                                                    </ul>
                                                );
                                            }
                                        
                                            if (archive.originalCollection === 'Modal') {
                                                const area = archive.data.areaName || 'N/A';
                                            
                                                return (
                                                    <ul className={styles.noBullets}>
                                                        <li><strong>Area Name:</strong> {area}</li>
                                                    </ul>
                                                );
                                            }
                                        
                                            if (archive.originalCollection === 'Cards') {
                                                const area = archive.data.areaName || 'N/A';
                                                return (
                                                    <ul className={styles.noBullets}>
                                                        <li><strong>Area Name:</strong> {area}</li>
                                                    </ul>
                                                );
                                            }
                                        
                                            if (archive.originalCollection === 'Audio') {
                                                const area = archive.data.areaName || 'N/A';
                                                const audioName = archive.data.originalName || 'N/A';
                                                return (
                                                    <ul className={styles.noBullets}>
                                                        <li><strong>Area Name:</strong> {area}</li>
                                                        <li><strong>Audio Name:</strong> {audioName}</li>
                                                    </ul>
                                                );
                                            }

                                            if (archive.originalCollection === 'AboutUs') {
                                                return (
                                                    <ul className={styles.noBullets}>
                                                        <li><strong>About Us</strong>  </li>
                                                    </ul>
                                                );
                                            }
                                        
                                            return 'N/A';
                                        })();
                                        
                                        

                                        return (
                                        <tr key={archive._id}>
                                                <td>{archive.originalCollection}</td>
                                                <td>{typeDisplay}</td>
                                                <td>{dataToDisplay}</td>
                                                <td>{moment(archive.archivedAt).format('MMM D, YYYY , h:mm A')}</td> 
                                            <td>
                                                <div className={styles.actionBtns}>
                                                    
                                                    <button
                                                        className={styles.editBtn}
                                                        onClick={() => {
                                                            setItemId(archive._id);
                                                            // Determine the type based on the originalCollection field in the archive
                                                            const restoreType = archive.originalCollection === 'MarkerIcon' ? 'markerIcon' : 
                                                                                (archive.originalCollection === 'User' ? 'document' : 'field');
                                                            setItemToRestore(restoreType);
                                                            handleRestoreBtn();
                                                        }}
                                                        >
                                                            
                                                            <img className={`${styles.icon} ${styles.undo}`} src={icons.undo} alt="Restore Item" />
                                                    </button>
                                                    <button className={styles.delBtn} onClick={() => { handleDeleteBtn(); setItemToDelete(archive._id); }} >
                                                        <img className={`${styles.icon} ${styles.delete}`} src={icons.remove} alt="Delete Item" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5">No archived items found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>


                    {/* Delete Confirmation Modal */}
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
                            />
                        </motion.div>
                    )}
                    </AnimatePresence>
                    
                    {/* Restore Confirmation Modal */}
                    <AnimatePresence>
                    {isRestore && (
                        <motion.div 
                            className = { styles.confirmation }
                            initial = {{opacity: 0}}
                            animate = {{opacity: 1}}
                            exit = {{opacity: 0}}
                            transition = {{duration: 0.2, ease: "easeInOut"}}
                        >
                            <ConfirmRestore 
                                onCancel = {() => handleRestoreBtn()}
                                setConfirmDelete={ confirmAndRestore }
                                isRestoring = { isRestoring }
                            />
                        </motion.div>
                    )}
                    </AnimatePresence>  
                </>
            )}
        </>
    );
}
