import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Slider from 'react-slick';
import styles from './styles/EditNewsEvent.module.scss';
import icons from '../../../assets/for_landingPage/Icons'
import { motion, AnimatePresence } from 'framer-motion'
import Confirmation from '../utility/ConfirmationComponent/Confirmation';

import UseToast from '../utility/AlertComponent/UseToast';
import { API_URL } from '/src/config';

export default function NewsEventImage({ setCurrentModal, currentModal, handleClickOutside}) { // setCurrentModal, currentModal, handleClickOutside
    // toast alert pop up
    const mountToast = UseToast();
    
    const [imageFile, setImageFile] = useState([]); // For adding new images
    const [newImageFile, setNewImageFile] = useState(null); // For updating an existing image
    const [images, setImages] = useState([]); // Holds the list of images
    const [selectedImageFilename, setSelectedImageFilename] = useState(null); // Store the filename of the selected image
    const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false); // State for add image modal
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

    const [imagePreviews, setImagePreviews] = useState([]);

    const [uploadImagePreviews, setUploadImagePreviews] = useState([]); // Preview for adding images
    const [updatePreviewImages, setUpdatePreviewImages] = useState([]); // Preview for updating images

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    const confirmAndDelete = () => {
        setConfirmDelete(true);
    }

    useEffect(() => {
        if (confirmDelete && selectedImageFilename) {
            //handleDelete();
            handleArchive();
            setConfirmDelete(false);
        }
    }, [confirmDelete, selectedImageFilename]);

    // Fetch images from the single document
    // Fetch images from the single document
    const fetchnewsEvent = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/images`);
            const document = response.data[0]; // Assuming there's only one document

        // Set the images array
        const fetchedImages = document.images || [];
        const fetchedHeaders = document.newsHeader || [];
        const fetchedDescriptions = document.description || [];

        // Set the images, headers, and descriptions into state
        setImages(fetchedImages);
        setImageHeaders(fetchedHeaders);
        setImageDescriptions(fetchedDescriptions);

           // Store initial values for comparison
            setInitialHeaders(fetchedHeaders);
            setInitialDescriptions(fetchedDescriptions);


            // Generate image preview URLs based on the fetched images
            const imagePreviews = fetchedImages.map((img) => `${API_URL}/uploads/images/${img}`);

            // Set state to hold the preview URLs for the slider
            setImagePreviews(imagePreviews);
        } catch (error) {
            console.error("Error fetching images", error);
        }
    };

    // Handle file change for adding new images with preview
    const handleAddFileChange = (e) => {
        const fileArray = Array.from(e.target.files);
        const imageUrls = fileArray.map((file) => URL.createObjectURL(file)); // Create URLs for previews

        const unsupportedFiles = fileArray.filter(file => !allowedTypes.includes(file.type));

        if (unsupportedFiles.length > 0) {
            mountToast("Unsupported file format. Only JPG, JPEG, and PNG are allowed!", "error");
            return;
        }

        setImageFile(fileArray); // Store actual files for submission
        setUploadImagePreviews(imageUrls); // Generate preview URLs for uploading
    };

    // Handle file change for updating an existing image with preview
    const handleUpdateFileChange = (e) => {
        const fileArray = Array.from(e.target.files);
        const imageUrls = fileArray.map((file) => URL.createObjectURL(file)); // Create URLs for previews

        const unsupportedFiles = fileArray.filter(file => !allowedTypes.includes(file.type));

        if (unsupportedFiles.length > 0) {
            mountToast("Unsupported file format. Only JPG, JPEG, and PNG are allowed!", "error");
            return;
        }

        setNewImageFile(fileArray[0]); // Only one file for update
        setUpdatePreviewImages(imageUrls); // Generate preview URLs for updating
    };

    // Handle adding new images (POST)
    const handleUpload = async () => {
        const formData = new FormData();
        imageFile.forEach(file => {
            formData.append('images', file); // Name should match what's expected by the server
        });
    
        try {
            const response = await axios.post(`${API_URL}/api/images`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
    
            if (response.status === 200 || response.status === 201) {
                mountToast("Uploaded successfully!", "success");
                fetchnewsEvent(); // Refresh image list after successful upload
            }
    
            // Reset states after successful upload
            setUploadImagePreviews([]);
            setIsAddImageModalOpen(false); // Close the add image modal
            setUpdatePreviewImages([]);
            setIsUpdateModalOpen(false);
        } catch (error) {
            console.error("Error uploading images:", error);
            mountToast("Error uploading images. Please try again.", "error");
        }
    };
    

    // Handle updating a specific image (PUT)
    const handleUpdate = async () => {
        if (!newImageFile || !selectedImageFilename) {
            console.error("Missing file or filename");
            return;
        }
    
        const formData = new FormData();
        formData.append('image', newImageFile); // Append the selected file for update
    
        // Use only the filename for the PUT request
        const filename = selectedImageFilename.split('/').pop(); // Get only the filename
    
        try {
            const response = await axios.put(`${API_URL}/api/images/uploads/images/${filename}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
    
            // Update the images array in the frontend
            setImages(response.data.images);
            setSelectedImageFilename(null); // Reset after update
            setNewImageFile(null); // Clear the file input
            mountToast("Update successfully!", "success");
            fetchnewsEvent();
            setUpdatePreviewImages([]);
            setIsUpdateModalOpen(false);
        } catch (error) {
            console.error("Error updating image:", error);
        }
    };

    // Handle deleting an image (DELETE)
    const handleDelete = async () => {
        const filename = selectedImageFilename.split('/').pop(); // Get only the filename from the full path

        try {
            if (selectedImageFilename) {
                const response = await axios.delete(`${API_URL}/api/images/uploads/images/${filename}`);
                    if (response.status === 200) {
                        mountToast("Image deleted successfully!", "success");
                        fetchnewsEvent(); // Refresh image list after successful deletion
                        setDeleteModalVisible(null);
                    }
                }
        } catch (error) {
            console.error('Error deleting image:', error);
            mountToast("Error deleting image. Please try again.", "error");
        }
    };

            // Handle archiving an image or the entire newsEvent document (PUT)
const handleArchive = async () => {
    const filename = selectedImageFilename.split('/').pop(); // Extract only the filename
    try {
        if (selectedImageFilename) {
            const response = await axios.put(`${API_URL}/api/archive/newsEvent/image/${filename}`);
            if (response.status === 200) {
                mountToast("Image archived successfully!", "success");
                fetchnewsEvent(); // Refresh the list to show updated data
                setDeleteModalVisible(null);
            }
        } else {
            mountToast("No image selected for archiving.", "error");
        }
    } catch (error) {
        console.error('Error archiving image:', error);
        mountToast("Error archiving image. Please try again.", "error");
    }
};

const [imageHeaders, setImageHeaders] = useState([]);
const [imageDescriptions, setImageDescriptions] = useState([]);
const [initialHeaders, setInitialHeaders] = useState([]);
const [initialDescriptions, setInitialDescriptions] = useState([]);

const handleSaveHeaderAndDesc = async () => {
    try {
        // Prepare the data to compare and send
        const updatedData = images.map((image, index) => ({
            filename: image, // Assuming you have a way to uniquely identify images
            newsHeader: imageHeaders[index], // Get the updated header
            description: imageDescriptions[index] // Get the updated description
        }));

        // Compare with initial data to detect changes
        const hasChanges = updatedData.some(({ filename, newsHeader, description }, index) => {
            return (
                newsHeader !== initialHeaders[index] ||
                description !== initialDescriptions[index]
            );
        });

        if (!hasChanges) {
            // Alert the user and exit if no changes
            mountToast("No changes detected to save.", "warn");
            return;
        }

        // Send the updated data to the backend if changes exist
        await axios.put(`${API_URL}/api/images/updateNews`, updatedData);
        mountToast("Changes saved successfully!", "success");

        // Optionally refresh data
        fetchnewsEvent();
    } catch (error) {
        console.error("Error saving changes:", error);
        mountToast("Error saving changes. Please try again.", "error");
    }
};


const handleTextChange = (index, type, value) => {
    if (type === 'header') {
        const updatedHeaders = [...imageHeaders];
        updatedHeaders[index] = value;
        setImageHeaders(updatedHeaders);
    } else if (type === 'description') {
        const updatedDescriptions = [...imageDescriptions];
        updatedDescriptions[index] = value;
        setImageDescriptions(updatedDescriptions);
    }
};

    const cancelBtn = () => {
        setIsAddImageModalOpen(false);
        setIsUpdateModalOpen(false);
        setDeleteModalVisible(false);
        setUploadImagePreviews([]);
        setUpdatePreviewImages([]);
    };

    //Settings of Slick Carousel
    const settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
    };

    // Fetch images when the modal is opened
    useEffect(() => {
        if (currentModal === "editNewsEvent") {
            fetchnewsEvent();
        }
    }, [currentModal]);

    useEffect(function() {
        if (currentModal && (!isAddImageModalOpen || !isUpdateModalOpen  || !deleteModalVisible)) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [currentModal, isAddImageModalOpen, isUpdateModalOpen, deleteModalVisible]);

    return (
        <>
            <AnimatePresence>
                {currentModal === "editNewsEvent" && !isAddImageModalOpen && !isUpdateModalOpen  && !deleteModalVisible && (
                    <>
                        <motion.div 
                            className={styles.editNewsEventContainer}
                            id = "editNewsEvent"
                            initial = {{opacity: 0}}
                            animate = {{opacity: 1}}
                            exit = {{opacity: 0}}
                            transition = {{duration: 0.2, ease: "easeInOut"}}
                        >
                            <div className={styles.modalEditingSection} > {/* id = "editNewsEvents" */}
                                <button className={styles.close} onClick={ function() { setCurrentModal("newsAndEvents"); } }>
                                    <img src={icons.close} alt="close" />
                                </button>

                                <div className = { styles.header }>
                                    <span className = { styles.txtTitle }>
                                        {'Manage News and Events'}
                                    </span>
                                </div>
                    
                                {/* Carousel for existing images */}
                                {images.length > 0 ? (
                                    <>
                                        <div className={styles.imageCarousel}>
                                            <Slider {...settings}>
                                                {imagePreviews.map((image, index) => (
                                                    <>
                                                        <div key={index}>
                                                            <div className = { styles.imageContainer }>
                                                                <img
                                                                    src={image}
                                                                    alt={`Uploaded preview ${index}`}
                                                                    className={styles.carouselImage}
                                                                />
                                                                <div className = { styles.overlay }>
                                                                    <div className = { styles.btnCont1 }>
                                                                        <button
                                                                            className={styles.saveBtn}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSelectedImageFilename(image); // Select image for updating
                                                                                setIsUpdateModalOpen(true);
                                                                            }}
                                                                        >
                                                                            Update Image
                                                                        </button>
                                                                        <button
                                                                            className={styles.closeBtn}
                                                                            onClick={() => {
                                                                                setSelectedImageFilename(image); // Handle delete
                                                                                setDeleteModalVisible(true);
                                                                            }}
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                    <div className = { styles.btnCont2 }>
                                                                        <button className={styles.saveBtn} onClick={() => setIsAddImageModalOpen(true)}>
                                                                            Add Images
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className={styles.news}>
                                                            <textarea
                                                                className={`${styles.txtTitle} ${styles.newsHeader}`}
                                                                placeholder="News header..."
                                                                value={imageHeaders[index] || ""}
                                                                onChange={(e) => handleTextChange(index, 'header', e.target.value)}
                                                            />
                                                            <br />
                                                            <textarea
                                                                className={`${styles.txtSubTitle} ${styles.newsDesc}`}
                                                                placeholder="No current news description..."
                                                                value={imageDescriptions[index] || ""}
                                                                onChange={(e) => handleTextChange(index, 'description', e.target.value)}
                                                            />
                                                        </div>
                                                    </>
                                                ))}
                                            </Slider>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className = { styles.noImg }>
                                            <div className = { styles.overlay }>
                                                <button className={ styles.saveBtn } onClick={() => setIsAddImageModalOpen(true)}>
                                                    Add Images
                                                </button>
                                                
                                            </div>

                                            <span className = { styles.txtTitle }>No image available</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>

                        <motion.button 
                            className = { `${styles.saveBtn} ${styles.main}` }
                            initial = {{opacity: 0}}
                            animate = {{opacity: 1}}
                            exit = {{opacity: 0}}
                            transition = {{ duration: 0.3, ease: "easeInOut"}}
                            onClick={handleSaveHeaderAndDesc}
                            >
                            <span className = { styles.txtTitle } >Save Changes</span>  {/*For saving the newsHeader and Description */}
                        </motion.button>
                    </>
                )}
            </AnimatePresence>

            {/* Add Image Modal */}
            <AnimatePresence>
                {isAddImageModalOpen && (
                    <motion.div 
                        className = { styles.uploadImgContainer }
                        id = "editNewsEvent"
                        initial = {{opacity: 0}}
                        animate = {{opacity: 1}}
                        exit = {{opacity: 0}}
                        transition = {{duration: 0.2, ease: "easeInOut"}}    
                    >
                        <div className={styles.modalContent}>
                            <div className = { styles.header }>
                                <span className = { styles.txtTitle }>
                                    Upload New Image
                                </span>
                            </div>

                            <div className = { styles.customLabel }>
                                <button className = { styles.browseBtn }>Browse...</button>
                                <span className = { styles.fileName }>
                                    Temporary Placeholder
                                </span>
                                <input 
                                    type="file" 
                                    accept="image/jpeg, image/jpg, image/png" 
                                    multiple 
                                    onChange={handleAddFileChange} 
                                />
                            </div>
                            
                            {/* Preview New Images Before Upload */}
                            <span className = { `${styles.txtTitle} ${styles.previewImgHeader}` }>Preview Image:</span>
                            {uploadImagePreviews.length > 0 && (
                                <div className={styles.imageCarousel}>
                                    <Slider {...settings}>
                                        {uploadImagePreviews.map((image, index) => (
                                            <div key={index} className={ styles.slickSlide }>
                                                <img
                                                    src={image}
                                                    alt={`Uploaded preview ${index}`}
                                                    className={styles.carouselImage}
                                                />
                                            </div>
                                        ))}
                                    </Slider>
                                </div>
                            )}

                            <div className = { styles.btnContainer }>
                                <button type="button" className={styles.saveBtn} onClick={handleUpload}>Upload</button>
                                <button type="button" className={styles.closeBtn} onClick={cancelBtn}>Cancel</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

                {/* Update Image Modal */}
            <AnimatePresence>
                {isUpdateModalOpen && (
                    <motion.div 
                        className={styles.updateImgContainer}
                        id = "editNewsEvent"
                        initial = {{opacity: 0}}
                        animate = {{opacity: 1}}
                        exit = {{opacity: 0}}
                        transition = {{duration: 0.2, ease: "easeInOut"}}
                    >
                        <div className={styles.modalContent}>
                            <div className = { styles.header }>
                                <span className = { styles.txtTitle }>
                                    Update Image
                                </span>
                            </div>
                            
                            <div className = { styles.customLabel }>
                                <button className = { styles.browseBtn }>Browse...</button>
                                <span className = { styles.fileName }>
                                    Temporary Placeholder
                                </span>
                                <input 
                                    type="file" 
                                    accept="image/jpeg, image/jpg, image/png" 
                                    onChange={handleUpdateFileChange} 
                                />
                            </div>

                            {/* Preview Update Images */}
                            <span className = { `${styles.txtTitle} ${styles.previewImgHeader}` }>Preview Image:</span>
                            <div className={styles.updatePreview}>
                                {updatePreviewImages.map((image, index) => (
                                    <img
                                        key={index}
                                        src={image}
                                        alt={`Preview ${index}`}
                                        className={styles.previewImage}
                                    />
                                ))}
                            </div>
                            <div className = { styles.btnContainer }>
                                <button type="button" className={styles.saveBtn} onClick={handleUpdate}>Upload</button>
                                <button type="button" className={styles.closeBtn} onClick={cancelBtn}>Cancel</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {/* Delete Modal */}
                {deleteModalVisible && (
                    <motion.div 
                        className={styles.confirmDltContainer}
                        id = "editNewsEvent"
                        initial = {{opacity: 0}}
                        animate = {{opacity: 1}}
                        exit = {{opacity: 0}}
                        transition = {{duration: 0.2, ease: "easeInOut"}}
                    >
                        <Confirmation 
                            setConfirmDelete = { confirmAndDelete }
                            onCancel = { cancelBtn }
                        />
                   </motion.div>
                )}
            </AnimatePresence>
        </>
    );
    
}
