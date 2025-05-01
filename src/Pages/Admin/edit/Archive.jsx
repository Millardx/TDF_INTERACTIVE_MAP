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

export default function Archive() {
    const [archives, setArchives] = useState([]);

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

    const fetchArchives = async (limit) => {
        try {
            const response = await axios.get(`${API_URL}/api/archive/archivesData?limit=${limit}`); // Pass limit as query param
            setArchives(response.data);
            setOriginalItems(response.data);                            // get all data - Lorenzo @ 04/30/2025
            setCurrentItems(response.data.slice(0, logsPerPage));       // get filtered items - Lorenzo @04/30/2025
        } catch (error) {
            mountToast('Error fetching archives', 'error');
            console.error('Error fetching archives:', error);
        }
    };

    useEffect(() => {
        fetchArchives(fetchLimit); // Fetch archives with the current limit
    }, [fetchLimit]); // Re-run when fetchLimit changes
  
        // Delete handler
        const handleDelete = async (archiveId) => {
            try {
                const response = await axios.delete(`${API_URL}/api/delete/archive/${archiveId}`);
                mountToast(response.data.message, 'success');
                fetchArchives(fetchLimit);
                setConfirmDelete(false);
                setItemToDelete(null);
                setIsDelete(false);
                fetchArchives(fetchLimit);

                // Update UI by filtering out the deleted item
                setArchives((prev) => prev.filter((archive) => archive._id !== archiveId));
            } catch (error) {
                console.error('Error deleting archive entry:', error);
                mountToast('Error deleting archive entry', 'error');
            }
        };
        

        // Restore handler
        const handleRestore = async (archiveId, type) => {
            try {
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

                // Make the API call to restore the archive
                const response = await axios.put(endpoint);
                mountToast(response.data.message, 'success');

                // Close the confirmation modal and reset states
                setConfirmRestore(false);
                setItemToRestore(null);
                setItemId(null);
                setIsRestore(false);

                // Fetch and update the list of archives
                fetchArchives(fetchLimit);

                // Update UI by filtering out the restored item
                setArchives((prev) => prev.filter((archive) => archive._id !== archiveId));
            } catch (error) {
                console.error('Error restoring archive entry:', error);
                mountToast('Error restoring archive entry', 'error');
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
                            <th>Data</th>
                            <th>Date&Time</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {archives.length > 0 ? (
                            currentItems.map((archive) => {
                                const isDocument = archive.originalCollection === 'User'; // Check if it's a document (User)
                                const isMarkerIcon = archive.originalCollection === 'MarkerIcon'; // Check if it's a MarkerIcon

                                const dataToDisplay = isDocument ? (
                                    <ul className={styles.noBullets}>
                                    <li><strong>Name:</strong> {archive.data.name || 'N/A'}</li>
                                    <li><strong>Email:</strong> {archive.data.email || 'N/A'}</li>
                                    <li><strong>Role:</strong> {archive.data.role || 'N/A'}</li>
                                </ul>
                                ) : isMarkerIcon ? (
                                // For MarkerIcon, display name and iconPath
                                <ul className={styles.noBullets}>
                                    <li><strong>Name:</strong> {archive.data.name || 'N/A'}</li>
                                    <li><strong>File:</strong> {archive.data.iconPath || 'N/A'}</li>
                                </ul>
                                ) : (
                                    archive.data[archive.fieldName] // For fields, show the file name
                                );

                                return (
                                <tr key={archive._id}>
                                        <td>{archive.originalCollection}</td>
                                        <td>{archive.fieldName}</td>
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
                    />
                </motion.div>
            )}
            </AnimatePresence>  
        </>
    );
}
