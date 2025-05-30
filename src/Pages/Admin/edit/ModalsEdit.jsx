import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import ArrowIcon from '../../../assets/actions/Arrow_icon.png';
import styles from '/src/Pages/Admin/edit/styles/ModalsEdit.module.scss'; // Ensure you have proper CSS

import UseToast from '../utility/AlertComponent/UseToast';

import { motion, AnimatePresence } from 'framer-motion'
import icons from '../../../assets/for_landingPage/Icons';
import Confirmation from '../utility/ConfirmationComponent/Confirmation';
import NavBar from './navBar/NavBar';
import '../utility/sliderCustomStyles/sliderStyles.scss';
import { API_URL } from '/src/config';

//loading content
import useLoading from '../utility/PageLoaderComponent/useLoading';
import LoadingAnim from '../utility/PageLoaderComponent/LoadingAnim';

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Quill default theme


const Modal = () => {
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // toast alert pop up
    const mountToast = UseToast();

    const location = useLocation();
    const user = location.state?.user;

    const [modals, setModals] = useState([]); // Store all modals
    const [currentModal, setCurrentModal] = useState(null); // Store selected modal for editing
    const [description, setDescription] = useState('');
    const [technologies, setTechnologies] = useState('');
    const [originalModalImages, setOriginalModalImages] = useState([]); // To store original images
    const [modalImages, setModalImages] = useState([]);
    const [modalImagePreviews, setModalImagePreviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Add for Pagination and UX
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [isOpen, setIsOpen] = useState(false); // Control modal visibility

    const [uploadModalVisible, setUploadModalVisible] = useState(false); // Toggle for upload modal
    const [uploadImagePreviews, setUploadImagePreviews] = useState([]);
    const [updateModalVisible, setUpdateModalVisible] = useState(false); // Toggle for delete modal
    const [updateImageIndex, setUpdateImageIndex] = useState('');
    const [updatePreviewImages, setUpdatePreviewImages] = useState([]);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false); // Toggle for delete modal
    const [deleteFile, setDeleteFile] = useState('');
    const [fileId, setFileId] = useState('')

    const [confirmDelete, setConfirmDelete] = useState(false);

    const confirmAndDelete = () => {
      setConfirmDelete(true);
    }

    useEffect(() => {
      if (confirmDelete && deleteFile && fileId) {
          handleImageArchive(fileId, deleteFile);
          setConfirmDelete(false);
      }
    }, [confirmDelete, deleteFile, fileId]);


  // Fetch all modals on component mount
  useEffect(() => {
    const fetchModals = async () => {
      if (isFirstLoad) setIsLoading(true); // Set loading to true before fetching
      try {
        const response = await axios.get(`${API_URL}/api/modal`);
        setModals(response.data);
      } catch (error) {
        console.error('Error fetching modals:', error);
      } finally {
        setIsLoading(false);        // Set loading to false after fetching
        setIsFirstLoad(false);      // Mark that first load is done
      }
    };
    fetchModals();
  }, []);
      
  // Fetch the latest Data from DB using ID, Updates preview whenever action made.
  const fetchModalData = async () => {
    if (currentModal) {
      if (isFirstLoad) setIsLoading(true);  // Start loading
      try {
        const response = await axios.get(`${API_URL}/api/modal/${currentModal._id}`);
        
        // Set modalImages state with the fetched images
        const fetchedImages = response.data.modalImages;

        // Update modalImages state
        setModalImages(fetchedImages);

        // Update currentModal with latest data
        setCurrentModal(response.data);

        setDescription(response.data.description);

        setTechnologies(response.data.technologies || '');

        // Update image previews based on the fetched images
        const imagePreviews = fetchedImages
          ? fetchedImages.map((img) => `${img}`)
          : [];
        
        setModalImagePreviews(imagePreviews);
      } catch (error) {
        console.error('Error fetching modal images:', error);
      } finally {
        setIsLoading(false);      // End loading
        setIsFirstLoad(false);    // Mark that first load is done
      }
    }
  };

  // Fetch individual modal data for real-time updates
  useEffect(() => {
    if (isOpen) { // Only fetch if the modal is open
      //if (isOpen && currentModal) { // not sure if works
      fetchModalData(); // Call it when currentModal changes
    }
  }, [isOpen]);

  const handleEditClick = (modal) => {
    if (currentModal) {
      // Close the currently open modal
      setCurrentModal(null);
      setIsOpen(false);

      // After closing, open the new modal with a small delay to ensure smooth transitions
      setTimeout(() => {
        setCurrentModal(modal);
        setDescription(modal.description);
        setIsOpen(true);
        fetchModalData(); // Optionally fetch latest data
      }, 300); // Adjust delay as needed for smooth transition
    } else {
      // If no modal is open, open the new modal immediately
      setCurrentModal(modal);
      setDescription(modal.description);
      setTechnologies(modal.technologies);
      setIsOpen(true);
      fetchModalData();
    }
  };

  // Function to handle the close modal action
  const closeModal = () => {
    setIsOpen(false); // Close the modal
    setCurrentModal(null); // Clear modal data
  };

  const cancelBtn = () => {
    setUploadModalVisible(false);
    setUpdateModalVisible(false);
    setDeleteModalVisible(false);
    setUploadImagePreviews([]); // Clear the image previews
    setUpdatePreviewImages([]);
    
    // Optionally, clear modalImages if you don't need them after canceling
    // setModalImages([]);
  };


  const handleUploadFileChange = (e) => {
    const fileArray = Array.from(e.target.files);
    const imageUrls = fileArray.map((file) => URL.createObjectURL(file)); // Create URLs for previews
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    const unsupportedFiles = fileArray.filter(file => !allowedTypes.includes(file.type));

    if (unsupportedFiles.length > 0) {
      mountToast("Unsupported file format. Only JPG, JPEG, and PNG are allowed.", "error");
      return;
    }

    setModalImages(fileArray); // Store actual files for submission
    setUploadImagePreviews(imageUrls); // Generate preview URLs for uploading
  };


      // Handle the upload of new images
      const handleUpload = async () => {
        if (!currentModal) {
          mountToast("No modal selected for uploading images.", "error");
          return;
        }

         // ✅ NEW: Check if images are present
        if (!modalImages || modalImages.length === 0) {
          mountToast("No images uploaded. Please select at least one image.", "warn");
          return;
        }

        //function guard
        if (isSaving) return;    // break execution if already loading

        setIsSaving(true);
      
        try {
          const formData = new FormData();
          modalImages.forEach((image) => {
            formData.append('modalImages', image); // Append each image with the key 'modalImages'
          });
      
          const response = await axios.post(`${API_URL}/api/modal/${currentModal._id}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          console.log('Response:', response);
          if (response.status === 200) {
            mountToast("Images uploaded successfully!", "success");
            console.log('Images uploaded successfully!');
            fetchModalData(); // Fetch updated modal data
            setUploadImagePreviews([]);
            setUploadModalVisible(null); 
            return;
          } else {
            console.error('Unexpected status:', response.status);
            mountToast("Failed to upload images.", "error");
          }
        } catch (error) {
          console.error('Error uploading images:', error);
          mountToast("Error uploading images. Please try again.", "error");
        } finally {
          setIsSaving(false);
        }
      };
      
      const handleUpdateFileChange = (e) => {
        const fileArray = Array.from(e.target.files);
        const imageUrls = fileArray.map((file) => URL.createObjectURL(file)); // Create URLs for previews
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      
        const unsupportedFiles = fileArray.filter(file => !allowedTypes.includes(file.type));
      
        if (unsupportedFiles.length > 0) {
          mountToast("Unsupported file format. Only JPG, JPEG, and PNG are allowed.", "error");
          return;
        }
      
        setModalImages(fileArray); // Store actual files for submission
        setUpdatePreviewImages(imageUrls); // Generate preview URLs for updating
      };
      

    const handleUpdate = async () => {
      if (!currentModal || updateImageIndex === null) {
        mountToast("No modal or image index selected for updating.", "error");
        return;
      }

      //function guard
      if (isSaving) return;    // break execution if already loading

      setIsSaving(true);
      try {
        const formData = new FormData();
        formData.append('title', originalModalImages.title); // Keep the fixed title
        // formData.append('description', description); // Update the description
    
        // Append only the new image for the specific index
        if (modalImages[0]) {
          formData.append('modalImage', modalImages[0]); // Upload the new image
          formData.append('imageIndex', updateImageIndex); // Pass the index of the image to replace
        }
    
        const response = await axios.put(
          `${API_URL}/api/modal/${currentModal._id}/updateImage`, formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
    
        if (response.status === 200) {
          mountToast("Image updated successfully!", "success");
          console.log('Images updated successfully!');
          fetchModalData(); // Fetch updated modal data
          setUpdateModalVisible(null);
          setUpdatePreviewImages([]);
          return;
        } else {
          throw new Error('Failed to update the image');
        }
      } catch (error) {
        console.error('Error updating image:', error);
        mountToast("Error updating the image. Please try again.", "error");
      } finally {
        setIsSaving(false);
      }
    };




  // Archive handler for ModalsEdit.jsx
  const handleImageArchive = async (modalId, imagePath) => {
    //function guard
    if (isDeleting) return;    // break execution if already loading

    setIsDeleting(true);

    try {
      console.log('Archiving modal image...', modalId, imagePath);
      const response = await axios.put(`${API_URL}/api/archive/modal/${modalId}`, { imagePath });
      console.log("API Response:", response);

      if (response.status === 200) {
        setModals((prevModals) =>
          prevModals.map((modal) =>
            modal._id === modalId
              ? {
                  ...modal,
                  modalImages: modal.modalImages.filter((img) => img !== imagePath), // Remove archived image
                  isArchived: true,
                }
              : modal
          )
        );
        console.log('Archiving Success');
        mountToast("Modal image archived successfully", "success");
        fetchModalData(); 
        setDeleteModalVisible(null);
      }
    } catch (error) {
      console.error('Error archiving modal image:', error);
      mountToast("Error archiving modal image. Please try again.", "error");
    } finally {
      setIsDeleting(false);
    }
  };


  // New function to save the description
  const handleDescTech = async () => {
    if (!currentModal) return;

    // Check if there's any change in description or technologies
    if (
      description === currentModal.description &&
      technologies === currentModal.technologies
    ) {
      mountToast("No changes in description or technologies data.", "error");
      return;
    }

    //function guard
    if (isSaving) return;    // break execution if already loading

    setIsSaving(true);
    try {
      const response = await axios.put(`${API_URL}/api/modal/${currentModal._id}/description`, {
        description,
        technologies,
      });

      if (response.status === 200) {
        mountToast("Description and technologies saved successfully!", "success");
        fetchModalData(); // Refresh data after saving
      } else {
        mountToast("Failed to save description and technologies.", "error");
      }
    } catch (error) {
      console.error('Error saving description:', error);
      mountToast("Error saving description. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

    
    const navigate = useNavigate();
    const handleBackClick  = () => {
      navigate(`/map`); // Navigate to the specific card display page
    };
    
    //Settings of Slick Carousel
    const settings = {
      dots: false,
      infinite: false,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
    };

    // Get the root ID and and apply className 
    useEffect(() => {
      const rootDiv = document.getElementById("root");

      // Add or remove className based on current page

      if (location.pathname === "/modal") {
        rootDiv.classList.add(styles.rootDiv);
      } else {
        rootDiv.classList.remove(styles.rootDiv);
      }
    }, [location])

    // resize textarea based on content
    const descriptionRef = useRef(null);
    const technologiesRef = useRef(null);

    const adjustHeight = (ref) => {
      if (ref && ref.current) {
        ref.current.style.height = 'auto'; // Reset height
        ref.current.style.height = `${ref.current.scrollHeight}px`; // Set height to scroll height
      }
    };

    // switch description or technologies
    const [isInfo, setIsInfo] = useState(false);

    const handleInfoBtn = () => {
      setIsInfo(!isInfo);
    }

    //for description
    useEffect(() => {
      if (!isInfo) {
        adjustHeight(descriptionRef);
      }
      
    }, [isInfo, description]);

    //for technologies
    useEffect(() => {
      if (isInfo) {
        adjustHeight(technologiesRef);
      }
    }, [isInfo, description]);

      // Manual text truncate using script - Lorenzo - 04/01/2025
    // Note: Selected font family does not support/include ellipsis unicode
    //       This is important
    function truncateText(text, maxLength) {
      return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    }


  return (
      <>
        {isLoading ? (
            <LoadingAnim message="Loading modals..." />
        ) : (
          <>
            <NavBar /> 
            <div className={styles.modalContainer}>
              <div className={styles.header}>
                <span className = { styles.txtTitle }>EDIT MODAL</span>
              </div>
          
              {isLoading ? (
                <div>{/*Loading...*/}</div>  /* Show loading message when data is being fetched */
              ) : (
                <>
                  <span className = { `${ styles.txtTitle} ${ styles.listHeader }` }>Select Modal</span>
                  <div className={styles.modalsList}>
                    {modals.length > 0 ? (
                      modals.map((modal) => (
                        <div className = { styles.infoContainer } key={modal._id}>
                          <span className = { styles.txtTitle }>{modal.title}</span>
                          <button onClick={() => handleEditClick(modal)}>Edit</button>
                        </div>
                      ))
                    ) : (
                      <p>No modals available</p>  /* Fallback when no modals are fetched */
                    )}
                  </div>
                </>
              )}

              <button 
                className = { `${styles.txtTitle} ${ styles.btnSave }` } 
                onClick = { handleDescTech }
              > 
                {isSaving ? (
                  <>
                      <span className = { styles.loadingSpinner }></span>
                  </>
                ) : (
                    'Save Changes'
                )}
              </button>

              <AnimatePresence>
                {currentModal && (
                    <motion.div 
                      className={styles.modalEditingSection}
                      initial = {{opacity: 0}}
                      animate = {{opacity: 1}}
                      exit = {{opacity: 0}}
                      transition = {{duration: 0.2, ease: "easeInOut"}}
                    >
                      <div className={styles.modal}>
                        <label className = { styles.headerBg }>
                          {/* Modified by Lorenzo @ 05/01/2025 */}
                          <span className = { styles.txtTitle }>
                            { truncateText(currentModal.title, 18) }
                          </span>
                        </label>
                      
                        {/* <button className = { `${ styles.addBtn } ${ styles.onlyIcon }`} type="button" onClick={() => setUploadModalVisible(true)}>
                          <img src = { icons.add } alt = "Add Image Button" />
                        </button>  */}

                        {modalImagePreviews.length > 0 ? (
                          <div className = { styles.uploadedImg }>
                            <div className={styles.imageCarousel}>
                              
                              <Slider {...settings}>
                              {modalImagePreviews.map((image, index) => (
                                  <div key={index} className = { styles.slickSlide }>
                                    <div className = { styles.imageContainer }>
                                      <img
                                        src={image}
                                        alt={`Uploaded preview ${index}`}
                                        className={styles.carouselImage}
                                      />
                                      <div className = { styles.overlay }>
                                        <div className = { styles.btnSet1 }>
                                          <button
                                            className={styles.saveBtn}
                                            type="button"
                                            onClick={() => {
                                              setUpdateModalVisible(true);
                                              setUpdateImageIndex(index); // Store the index of the image to update
                                            }}
                                          >
                                            Update Image
                                          </button>
                                          <button
                                            className={styles.deleteBtn}
                                            onClick={() => {
                                              //setDeleteFile(currentModal.modalImages[index]); // Set the filename to delete
                                              setDeleteFile(currentModal.modalImages[index]); // Set the filename to archive
                                              setFileId(currentModal._id);
                                              setDeleteModalVisible(true); // Open delete modal
                                            }}
                                          >
                                            Delete
                                          </button>
                                        </div>
                                        <div className = { styles.btnSet2 }>
                                          <button className = { `${ styles.txtTitle} ${ styles.uploadBtn }` } onClick={() => setUploadModalVisible(true)}>Add Image</button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </Slider>
                            </div>
                          </div>
                        ) : (
                          <div className = { styles.imageContainer}>
                            <div className = { styles.noImg }>
                              <div className = { styles.overlay }>
                                <button className = { `${ styles.txtTitle} ${ styles.uploadBtn }` } onClick={() => setUploadModalVisible(true)}>Add Image</button>
                              </div>
                              
                              <span className = { styles.txtTitle }>No Image available</span>
                            </div>

                          </div>
                        )}

                        {/* Description and technologies */}
                        <div className = { isInfo ? `${ styles.infoContainer } ${ styles.active }` : styles.infoContainer }>
                          <AnimatePresence mode="wait">
                            {!isInfo && (
                              <motion.div 
                                className = { styles.description }
                                key = {"description"}
                                initial = {{opacity: 0}}
                                animate = {{opacity: 1, transition: {delay: 0.2}}}
                                exit = {{opacity: 0}}
                                transition = {{duration: 0.2,  ease: "easeInOut"}}
                                onAnimationComplete={() => adjustHeight(descriptionRef)}
                              >               
                                {/* <textarea
                                  ref = {descriptionRef}
                                  row = "1"
                                  className = { styles.txtSubTitle } 
                                  style={{ whiteSpace: 'pre-line' }}
                                  value={description}
                                  onInput={() => adjustHeight(descriptionRef)}
                                  onChange={(e) => setDescription(e.target.value)}
                                  placeholder = "Enter description here..."
                                  required
                                />        */}

                                  <ReactQuill
                                    theme="snow"
                                    value={description}
                                    onChange={setDescription}
                                    modules={{
                                      toolbar: [
                                        ['bold', 'italic', 'underline'],
                                        [{ list: 'bullet' }, { list: 'ordered' }],
                                        ['clean']
                                      ]
                                    }}
                                    placeholder="Enter description here..."
                                    className={styles.quillEditor}
                                  />


                                <div className = { styles.line }></div>
                              </motion.div>
                            )}

                            {isInfo && (
                              <motion.div 
                                className = { styles.technologies }
                                style={{ whiteSpace: 'pre-line' }}
                                key = {"technologies"}
                                initial = {{opacity: 0}}
                                animate = {{opacity: 1, transition: {delay: 0.2}}}
                                exit = {{opacity: 0}}
                                transition = {{duration: 0.2, ease: "easeInOut"}}
                                onAnimationComplete={() => adjustHeight(technologiesRef)}
                              >
                                {/* <textarea 
                                  ref = {technologiesRef}
                                  row = "1"
                                  className ={ styles.txtSubTitle }
                                  value = { technologies }
                                  onInput={() => adjustHeight(technologiesRef)}
                                  onChange={(e) => setTechnologies(e.target.value)}
                                  placeholder = "Enter technologies here..."
                                  required 
                                /> */}
                                <ReactQuill
                                  theme="snow"
                                  value={technologies}
                                  onChange={setTechnologies} // ✅ this gives you HTML string directly
                                  modules={{
                                    toolbar: [
                                      ['bold', 'italic', 'underline'],
                                      [{ list: 'bullet' }, { list: 'ordered' }],
                                      ['clean']
                                    ]
                                  }}
                                  placeholder="Enter technologies here..."
                                  className={styles.quillEditor}
                                />


                                <div className = { styles.line }></div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className = { styles.infoBtn }>
                            <ul className = { styles.btns }>
                              <li>
                                <span 
                                  className = { styles.descBtn }
                                  onClick = { isInfo ? handleInfoBtn : undefined }
                                >
                                  DESCRIPTION
                                </span>
                              </li>
                              <li>
                                <span 
                                  className = { styles.techBtn }
                                  onClick = { !isInfo ? handleInfoBtn : undefined }
                                >
                                    TECHNOLOGIES
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Update Modal (single)*/}
            <AnimatePresence>
              {updateModalVisible && (
                <div className = { styles.popUpContainer }>
                  <motion.div 
                    className = { styles.uploadImageContainer }
                    initial = {{opacity: 0}}
                    animate = {{opacity: 1}}
                    exit = {{opacity: 0}}
                    transition = {{duration: 0.2, ease: "easeInOut"}}
                  >
                    <div className = { styles.header }>
                      <span className = { styles.txtTitle }>Update Images</span>
                    </div>

                    <div className = { styles.customLabel }>
                      <button className = { styles.browseBtn }>Browse...</button>
                      <span className = { styles.fileName }>
                        { "Select image replacement" } {/* Add, file name if one, n files selected if multiple */}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg, image/jpg, image/png"
                        onChange={handleUpdateFileChange}
                      />
                    </div>

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
                      <button type="button" className={styles.uploadBtn} onClick={handleUpdate}>
                        {isSaving ? (
                            <>
                                <span className = { styles.loadingSpinner }></span>
                            </>
                        ) : (
                            'Upload'
                        )}
                      </button>
                      <button type="button" className={styles.cancelBtn} onClick={cancelBtn}>Cancel</button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Add image Modal (multiple) */}
            <AnimatePresence>
              {uploadModalVisible && (
                <div className = { styles.popUpContainer }>
                  <motion.div 
                    className = { styles.uploadImageContainer }
                    initial = {{opacity: 0}}
                    animate = {{opacity: 1}}
                    exit = {{opacity: 0}}
                    transition = {{duration: 0.2, ease: "easeInOut"}}
                  >
                      <div className = { styles.header }>
                        <span className = { styles.txtTitle }>Upload New Images</span>
                      </div>

                      <div className = { styles.customLabel }>
                        <button className = { styles.browseBtn }>Browse...</button>
                        <span className = { styles.fileName }>
                          { "Select your image/s" } {/* Add, file name if one, n files selected if multiple */}
                        </span>
                        <input 
                          type="file" 
                          accept="image/jpeg, image/jpg, image/png" 
                          multiple 
                          onChange={handleUploadFileChange} 
                        />
                      </div>

                      {/* Image Carousel for Preview */}
                      <div className = { styles.preview }>
                      <span className = { styles.txtTitle}>Preview Image:</span>
                        <div className={styles.imageCarousel}>
                          <Slider {...settings}>
                            {uploadImagePreviews.map((image, index) => (
                              <div key={index} className="slick-slide">
                                <img
                                  src={image}
                                  alt={`Uploaded preview ${index}`}
                                  className={styles.carouselImage}
                                />
                              </div>
                            ))}
                          </Slider>
                        </div>
                      </div>

                      <div className = { styles.btnContainer }>
                        <button 
                          type="button" 
                          className={styles.uploadBtn} 
                          onClick={handleUpload}
                        >
                          {isSaving ? (
                            <>
                                <span className = { styles.loadingSpinner }></span>
                            </>
                          ) : (
                              'Upload'
                          )}
                        </button>
                        <button type="button" className={styles.cancelBtn} onClick={cancelBtn}>Cancel</button>
                      </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {/* Delete Modal */}
              {deleteModalVisible && (
                <motion.div 
                  className = { styles.popUpContainer }
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
        )}
      </>
  );
};

export default Modal;
