import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios';
import Confirmation from '../utility/ConfirmationComponent/Confirmation'

import UseToast from '../utility/AlertComponent/UseToast';

import styles from './styles/AboutUsEdit.module.scss'
import icons from '../../../assets/for_landingPage/Icons'
import { API_URL } from '/src/config';

import useLoading from '../utility/PageLoaderComponent/useLoading';
import LoadingAnim from '../utility/PageLoaderComponent/LoadingAnim';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Snow theme


export default function AboutUsEdit ({ setCurrentModal, currentModal, handleClickOutside }) {
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isLoading, setIsLoading] = useLoading(false);
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    const [openSection, setOpenSection] = useState('historicalBackground');


    // toast alert pop up
    const mountToast = UseToast();
    
    const [aboutUsData, setAboutUsData] = useState({
        historicalBackground: '',
        vision: '',
        mission: '',
        goal: '',
        objectives: '',
        image: '',
    });
    const [selectedImage, setSelectedImage] = useState(null); // New state for storing the selected image file
    const [previewImage, setPreviewImage] = useState(null);   // State to store the image preview URL

    const fetchAboutUsData = async () => {

        if (isFirstLoad) setIsLoading(true);

        try {
            const response = await axios.get(`${API_URL}/api/aboutus`);
            setAboutUsData(response.data);
        } catch (error) {
            console.error("Error fetching About Us data:", error);
        } finally {
            setIsLoading(false);
            setIsFirstLoad(false);    // Mark that first load is done
        }
    };
    useEffect(() => {
        if (currentModal === 'aboutUsEdit') {
            fetchAboutUsData();
        }
    }, [currentModal]); // Empty dependency array means this runs only once, when the component mounts
    

    const handleChangeDetails = (name, value) => {
        setAboutUsData(prev => ({ ...prev, [name]: value }));
    };
    

    const handleSaveDetails = async () => {
        // Check if any field is empty
        const { historicalBackground, vision, mission, goal, objectives } = aboutUsData;
        if (!historicalBackground || !vision || !mission || !goal || !objectives) {
            mountToast("Please fill in all fields before saving!", "error");
            return;
        }

        if (isSaving) return;        // function guard
        setIsSaving(true);
    
        try {
            const response = await axios.put(`${API_URL}/api/aboutus`, aboutUsData);
            
            mountToast("Information was updated successfully!", "success");
            setCurrentModal("aboutUs");  // Close modal after saving
            fetchAboutUsData();
        } catch (error) {
            // Check if the error is specifically due to no changes detected (status 400)
            if (error.response && error.response.status === 400 && 
                error.response.data.message === 'No changes detected in the data.') {
                mountToast("No changes detected. Details was not updated.", "error");
                setCurrentModal("aboutUsEdit");  // Close modal after saving
            } else {
                mountToast(`Error saving About Us data: ${error}`, 'error');
            }
        } finally {
            setIsSaving(false);
        }
    };

    // new for the ReactQuill 6-7-25
    const renderAccordion = (label, fieldName) => {
        const isOpen = openSection === fieldName;
      
        return (
          <div className={styles.accordionItem} key={fieldName}>
            <div
              className={styles.accordionHeader}
              onClick={() =>
                setOpenSection(isOpen ? null : fieldName)
              }
            >
              <span className={styles.txtTitle}>{label}</span>
              <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}>
                ▼
              </span>
            </div>
      
            {isOpen && (
              <ReactQuill
                theme="snow"
                value={aboutUsData[fieldName]}
                onChange={(value) => handleChangeDetails(fieldName, value)}
                className={styles.quillEditor}
                placeholder="Place information here..."
                modules={{
                  toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    [{ align: [] }], // ⬅️ Add this line for alignment
                    ['clean']
                  ]
                }}
              />
            )}
          </div>
        );
      };
      
      
    
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file); 
            setPreviewImage(URL.createObjectURL(file)); // Set preview URL
        }
    };

    const handleUpdateImage = async () => {
        if (!selectedImage) {
            mountToast("Please select an image first.", "error");
            return;
        }

        if (isSaving) return;        // function guard
        setIsSaving(true);

        const formData = new FormData();
        formData.append('image', selectedImage);

        try {
            const response = await axios.put(`${API_URL}/api/aboutus/image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            mountToast("Image updated successfully!", "success");
            fetchAboutUsData();
            setSelectedImage(null); // Clear the selected image after upload
            setPreviewImage(null); // Clear blob image preview
            setCurrentModal("aboutUs"); 
        } catch (error) {
            mountToast(`Error updating image: ${error}`, 'error');
            setCurrentModal("aboutUsEdit");  // Close modal after saving
        } finally {
            setIsSaving(false);
        }
    };

    const handleArchiveImage = async () => {
        if(isDeleting) return;      // function guard
        setIsDeleting(true);

        try {
            const response = await axios.put(`${API_URL}/api/archive/aboutUs`, {
                imagePath: aboutUsData.image, // Pass the image path from your state
            });
    
            if (response.status === 200) {
                mountToast('AboutUs image archived successfully.', 'success');
                fetchAboutUsData(); // Refresh the data
                setDeleteModalVisible(false);
                setCurrentModal("aboutUs");  // Close modal after saving
            }
        } catch (error) {
            // console.error('Error archiving AboutUs image:', error);
            mountToast('Failed to archive image. Please try again.', 'error');
            setCurrentModal("aboutUsEdit");  // Close modal after saving
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(function() {
        if (currentModal) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [currentModal]);

    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    const confirmAndDelete = () => {
        setConfirmDelete(true);
    }

    useEffect(() => {
        if (confirmDelete) {
            handleArchiveImage();
            setConfirmDelete(false);
        }
    }, [confirmDelete, selectedImage]);

    const cancelBtn = () => {
        setDeleteModalVisible(false);
    };


    return (
        <>
            <AnimatePresence>
                {currentModal === 'aboutUsEdit' && (
                    <div className = { styles.holder }>
                        <motion.div
                            className = { styles.editContainer }
                            id = "aboutUsEdit"
                            initial = {{ opacity: 0 }}
                            animate = {{ opacity: 1 }}
                            exit = {{ opacity: 0 }}
                            transition = {{ duration: 0.2, ease: 'easeInOut' }}
                        >
                            {isLoading ? (
                                <LoadingAnim message="Loading content..." target="loadModal"/>
                            ) : (
                                <div className = { styles.editingSection }>
                                    <div className = { styles.close } onClick = { function() { setCurrentModal("aboutUs"); }}>
                                        <img src = { icons.close } alt = "Close" />
                                    </div>
                                    
                                    <div className = { styles.header }>
                                        <span className = { styles.txtTitle }>About Us</span>
                                    </div>

                                    <div className = { styles.content }>
                                        {/* Show the preview if available, else show the stored image or placeholder */}
                                        {previewImage ? (
                                            <div className = { styles.preview }>
                                                <img src={previewImage} alt="Preview" className={styles.imgPreview} />

                                                <div className = { styles.overlay }>
                                                    <button className = { `${ styles.txtTitle} ${ styles.uploadBtn }` }>Upload Image</button>
                                                </div>

                                                <input
                                                    type="file"
                                                    onChange={handleImageChange}
                                                    accept="image/*"
                                                />
                                            </div>
                                        ) : aboutUsData.image ? (
                                            <div className = { styles.uploaded }>
                                                <img 
                                                    src={`${aboutUsData.image}`} 
                                                    alt="About Us" 
                                                    className={styles.imgPreview} 
                                                />

                                                <div className = { styles.overlay }>
                                                    <button className = { `${ styles.txtTitle} ${ styles.uploadBtn }` }>
                                                        Upload Image
                                                        <input
                                                            type="file"
                                                            onChange={handleImageChange}
                                                            accept="image/*"
                                                        />
                                                    </button>

                                                    <button 
                                                        className = { `${ styles.txtTitle} ${ styles.deleteBtn }` } 
                                                        //onClick={() => {setDeleteModalVisible(true); setSelectedImage(aboutUsData.image);} } //handleDeleteImage
                                                        //onClick={handleDeleteImage}
                                                        onClick={() => {setDeleteModalVisible(true);}}
                                                    >
                                                        Delete Image
                                                    </button>

                                                </div>
                                            </div>
                                        ) : (
                                            <div className = { styles.noImg }>
                                                <div className = { styles.overlay }>
                                                    <button className = { `${ styles.txtTitle} ${ styles.uploadBtn }` }>Upload Image</button>
                                                </div>

                                                <input
                                                    type="file"
                                                    onChange={handleImageChange}
                                                    accept="image/*"
                                                />

                                                <span className={styles.txtTitle}>No Image Uploaded</span>
                                            </div>
                                        )}

                                        <button className = { styles.saveBtn }>
                                            <span className = { styles.txtTitle } onClick = {() => { handleUpdateImage(aboutUsData.image); }}>
                                                {isSaving ? (
                                                    <>
                                                        <span className = { styles.loadingSpinner }></span>
                                                    </>
                                                ) : (
                                                    'Save Image'
                                                )}
                                            </span>
                                        </button>
                                        

                                        {renderAccordion("Historical Background", "historicalBackground")}
                                        {renderAccordion("Vision", "vision")}
                                        {renderAccordion("Mission", "mission")}
                                        {renderAccordion("Goal", "goal")}
                                        {renderAccordion("Objectives", "objectives")}

                                    </div>
                                </div>
                            )}

                        </motion.div>

                        <motion.button 
                            className = { styles.saveBtn }
                            initial = {{opacity: 0}}
                            animate = {{opacity: 1}}
                            exit = {{opacity: 0}}
                            transition = {{ duration: 0.3, ease: "easeInOut"}}
                        >
                            <span className = { styles.txtTitle } onClick = {() => { handleSaveDetails(); }}>
                                {isSaving ? (
                                    <>
                                        <span className = { styles.loadingSpinner }></span>
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </span>
                        </motion.button>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {/* Delete Modal */}
                {deleteModalVisible && (
                    <motion.div 
                        className={styles.confirmDltContainer}
                        id = "aboutUsEdit"
                        initial = {{opacity: 0}}
                        animate = {{opacity: 1}}
                        exit = {{opacity: 0}}
                        transition = {{duration: 0.2, ease: "easeInOut"}}
                    >
                        <Confirmation 
                            setConfirmDelete = { confirmAndDelete }
                            onCancel = { cancelBtn }
                            isDeleting = { isDeleting }
                        />
                   </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

