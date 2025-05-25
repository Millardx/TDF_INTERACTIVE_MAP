import React, { useState } from 'react';
import axios from 'axios';
import styles from './styles/AudioUpload.module.scss';
import icons from "../../../assets/for_landingPage/Icons";

import UseToast from '../utility/AlertComponent/UseToast';
import { API_URL } from '/src/config';

const AudioUpload = ({ audioId, currentTitle, onClose, language}) => {
  const [isSaving, setIsSaving] = useState(false);

  // toast alert pop up
  const mountToast = UseToast();

  const [title, setTitle] = useState(currentTitle || ''); // Title of the audio
  const [audioFile, setAudioFile] = useState(null); // Selected audio file
  const [message, setMessage] = useState(''); // Error or informational messages
  const [englishFile, setEnglishFile] = useState(null);
  const [filipinoFile, setFilipinoFile] = useState(null);


  // Handler for file input change
  const handleFileChange = (e) => {
    setAudioFile(e.target.files[0]); // Set the selected file
  };

  // Handler for updating existing audio record
  // const handleUpdate = async (e) => {
  //   e.preventDefault();

  //   if (!audioId) return; // No action if there's no audio ID
  //   if (!audioFile) {
  //     mountToast("Please select an audio file to upload.", "error"); // Alert if no file is selected
  //     console.log("error");
  //     return; // Stop execution if no file is selected
  //   }

  //         // Allowed audio file extensions
  //     const allowedExtensions = ['.mp3', '.wav', '.m4a'];
      
  //     // Check if the file extension is in the allowed list
  //     const fileExtension = audioFile.name.split('.').pop().toLowerCase();
  //     if (!allowedExtensions.includes(`.${fileExtension}`)) {
  //       mountToast("Unsupported audio format. Only mp3, wav, m4a are allowed.", "error");
  //       return; // Stop execution if the file extension is not allowed
  //     }

  //   const formData = new FormData();
  //   formData.append('title', title);
  //   if (audioFile) formData.append('audio', audioFile);

  //   try {
  //     await axios.put(`${API_URL}/api/audio/update/${audioId}`, formData, {
  //       headers: { 'Content-Type': 'multipart/form-data' },
  //     });
  //     mountToast("Audio updated successfully!", "success");
  //     onClose(); // Close the modal
  //   } catch (error) {
  //     console.error('Error updating audio:', error);
  //     mountToast("Error updating audio, please try again.", "error"); // Show error message
  //   }
  // };

  //new Hnadler for 2 audio Fil and Eng
  const handleUpdate = async (e) => {
    e.preventDefault();
  
    if (!audioId) return;
  
    // Ensure required file is selected based on language
    if (language === 'english' && !englishFile) {
      return mountToast("Please select an English audio file.", "error");
    }
    if (language === 'filipino' && !filipinoFile) {
      return mountToast("Please select a Filipino audio file.", "error");
    }
  
    // Validate extension
    const allowedExtensions = ['.mp3', '.wav', '.m4a'];
    const checkExtension = (file) => allowedExtensions.includes(`.${file.name.split('.').pop().toLowerCase()}`);
  
    if (language === 'english' && englishFile && !checkExtension(englishFile)) {
      return mountToast("Invalid English audio format. Only mp3, wav, m4a are allowed.", "error");
    }
  
    if (language === 'filipino' && filipinoFile && !checkExtension(filipinoFile)) {
      return mountToast("Invalid Filipino audio format. Only mp3, wav, m4a are allowed.", "error");
    }
  
    const formData = new FormData();
    formData.append('title', title);
  
    // Only include the relevant file
    if (language === 'english' && englishFile) {
      formData.append('englishAudio', englishFile);
    }
  
    if (language === 'filipino' && filipinoFile) {
      formData.append('filipinoAudio', filipinoFile);
    }

    //function guard
    if (isSaving) return;    // break execution if already loading
    
    setIsSaving(true);
  
    try {
      

      await axios.put(`${API_URL}/api/audio/update/${audioId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
  
      mountToast(`${language === 'english' ? 'English' : 'Filipino'} audio updated successfully!`, "success");
      onClose(); // Close the modal
    } catch (error) {
      console.error('Update error:', error);
      mountToast("Error updating audio. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };
  
  

  // Handler to close the modal
  const handleClose = () => {
    setTitle(''); // Reset title
    setAudioFile(null); // Clear file selection
    setMessage(''); // Clear messages
    onClose(); // Trigger the onClose function to close the modal
  };

  return (
    <>
      <div className={styles.modalContent}>
        <span className={styles.close} onClick={handleClose}>
          <img src={icons.close} alt="close" />
        </span>

        <div className={styles.header}>
          <span className = { styles.txtTitle}>
            UPLOAD AUDIO FILE
          </span>
        </div>

        <form className = { styles.form }>
          <div className = { styles.audioTitleCont}>
            <label className = { styles.txtSubTitle }>Audio Title: </label>
            <input
              type="text"
              value={title}
              disabled
            />
          </div>
          
          {/* English Audio Upload */}
          {language === 'english' && (
            <label className={styles.customLabel}>
              <button className={styles.browseBtn}>Browse File</button>
              <span className={styles.fileName}>
                {englishFile ? englishFile.name : "No English audio file selected"}
              </span>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setEnglishFile(e.target.files[0])}
              />
            </label>
          )}

        {/* Filipino Audio Upload */}
        {language === 'filipino' && (
          <label className={styles.customLabel}>
            <button className={styles.browseBtn}>Browse File</button>
            <span className={styles.fileName}>
              {filipinoFile ? filipinoFile.name : "No Filipino audio file selected"}
            </span>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFilipinoFile(e.target.files[0])}
            />
          </label>
        )}

          <div className = { styles.btns }>
            <button 
              className = { `${styles.saveBtn} ${styles.txtTitle}` }
              type="submit" 
              onClick={handleUpdate}
            >
              {isSaving ? (
                <>
                  <span className = { styles.loadingSpinner }></span>
                </>
              ) : (
                'Save'
              )}
            </button>
            <button 
              className = { `${styles.cancelBtn} ${styles.txtTitle}` } 
              type="button" 
              onClick={handleClose}
            >
              Cancel
            </button>
          </div>
          
          {message && <p>{message}</p>} {/* Display message if exists */}
        </form>
      </div>
    </>
  );
  
};

export default AudioUpload;
