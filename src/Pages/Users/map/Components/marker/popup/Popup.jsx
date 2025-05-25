
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, easeInOut } from 'framer-motion'
import styles from './Popup.module.scss';
import icon from '../../../../../../assets/Icon.js';  
import icons from '../../../../../../assets/for_landingPage/Icons.jsx';
import images from '../../../../../../assets/for_landingPage/Images.jsx';
import Time from './Time.jsx';
import Modal from "./modal/Modal.jsx";
import axios from 'axios';
import { API_URL } from '/src/config';


function Popup({ modalId ,marker, onClose, isAdmin=true }) {
  console.log('Popup modalId:', modalId); // Check the received modalId
  const [isOpen, setIsOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  // const noImg = `${API_URL}/uploads/cardsImg/undefined`; //http://127.0.0.1:5000null
  // const noImg2 = `${API_URL}/uploads/cardsImg/null`;
 /* const [isOpen, setIsOpen] = useState(false);
  const onViewFullDetail = (data) =>{
    setIsOpen(!isOpen);
  }
  const onCloseModal = () =>{
    setIsOpen(false);
  } */

  const onViewFullDetail = async () => {
    console.log('Modal ID:', modalId); // Debugging log
    if (!modalId) {
      console.error('No modal ID provided');
      return;
    }
    
    console.log('Fetching URL:', `${API_URL}/api/modal/${modalId}`); // Log the full URL

    try {
      const response = await axios.get(`${API_URL}/api/modal/${modalId}`);
      setModalData(response.data);
      console.log('Modal Data:',response.data);
      setIsOpen(true);
    } catch (error) {
      console.error('Error fetching modal data:', error);
    }
  };

  const onCloseModal = () => {
    setIsOpen(false);
    setModalData(null);
  };

  //Allow the pop up modal to run exit animation before it unmounts
  const [isClosing, setIsClosing] = useState(false);
  const popupRef = useRef();        // For closing card when user clicked outside - Lorenzo - 04/30/2025
  
  // Close carde when user click outside - lorenzo - 04/30/2025
    useEffect(() => {
      function handleClickOutside(event) {
        if (
            popupRef.current && 
            !popupRef.current.contains(event.target) &&
            !isOpen // Prevent card close if full details modal is open
          ) {
          onCloseWithDelay();
        }
      }
    
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

  const onCloseWithDelay = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
  }, 200);
};

// Manual text truncate using script - Lorenzo - 05/01/2025
// Note: Selected font family does not support/include ellipsis unicode
//       This is important
function truncateText(text, maxLength) {
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

console.log("IMAGE: ", marker.img);

  return (
    <>
    <AnimatePresence mode="wait">
      {!isClosing && marker && (
        <motion.div
          key = {marker.name}
          id="popup"
          className={styles.popupContent}
          style={{ position: "absolute", zIndex: 100 }}
          initial = {{opacity: 0}}
          animate = {{opacity: 1}}
          exit = {{opacity: 0}}
          transition = {{duration: 0.2, ease: "easeInOut"}}
          ref={popupRef}    // added by lorenzo @ 04/30/2025
        >
          { /*
            isAdmin && <a href="/administrator">Edit</a>
          */}
          <div className={styles.closeBtn} onClick={onCloseWithDelay}>
              <button>
                  <img src={icons.close} alt="close" />
              </button>
          </div>

          {/* Replaced Code for Fallback when theres no image */}
          {marker.img &&
            marker.img.trim() !== '' &&
            !marker.img.includes('undefined') &&
            !marker.img.includes('null') ? (
              <div className={styles.popupImage}>
                <img
                  src={marker.img}
                  alt={marker.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/fallback-card-image.png'; // optional fallback image
                  }}
                />
              </div>
            ) : (
              <div className={styles.noImg}>
                <span className={styles.txtTitle}>No Image Available</span>
              </div>
            )}

          

          <div className={styles.cont1}>
            {/* <div className={styles.btns}>
              <button>
                <img className = { `${styles.icon} ${styles.location}` } src={icons.location} alt="wayfind" />
              </button>
              <button>
                <img className = { `${styles.icon} ${styles.audio}` } src={icons.audio} alt="speaker" />
              </button>
            </div> */}

            {/* Modified by Lorenzo - 04/30/2025 */}
            <div className = { styles.titleWrapper }>
                  <span className = { `${styles.txtTitle} ${styles.cardTitle}` }>
                    { truncateText(marker.name, 15) }
                  </span>
            </div>

            <div className = { styles.line }></div>

            <p className = { styles.quickFacts } >{marker.quickFacts}</p>

            <div className={styles.fullDeets}>
              <button className={styles.deets} onClick={onViewFullDetail}>
                <p>View Full Details &nbsp; {'>'}</p>
              </button>
            </div>
          </div>

        </motion.div>
      )}
        <Modal 
          isOpen = {isOpen} 
          modalId={modalId} 
          modalData={modalData} 
          onClose={onCloseModal} 
        />
    </AnimatePresence>
    </>
  )
}

export default Popup