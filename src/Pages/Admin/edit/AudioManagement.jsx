import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import styles from './styles/AudioManagement.module.scss';
import { useLocation, useNavigate } from 'react-router-dom';
import AudioUpload from './AudioUpload';
import AccessBtn from '/src/Pages/Users/landing/signInModule/AccessBtn'; // Import the new AccessBtn component
import PaginationControls from '../utility/PaginationComponent/PaginationControls';

import UseToast from '../utility/AlertComponent/UseToast';

import icons from "../../../assets/for_landingPage/Icons";
import { motion, AnimatePresence } from 'framer-motion'
import NavBar from './navBar/NavBar';
import Confirmation from '../utility/ConfirmationComponent/Confirmation';
import {API_URL } from '/src/config';

const AudioManagement = () => {
  // toast alert pop up
  const mountToast = UseToast();

  const location = useLocation();
  const user = location.state?.user;
  
  const [audiosRef, setAudiosRef] = useState([]);
  const [audios, setAudios] = useState([]);
  const [filteredAudio, setFilteredAudio] = useState([]);
  const [logsPerPage, setLogsPerPage] = useState(5);

  const [playingAudioId, setPlayingAudioId] = useState(null); // Track which audio is currently playing
  const [showUploadModal, setShowUploadModal] = useState(false);
  const navigate = useNavigate();
  const audioRef = useRef(null); // Ref for controlling the audio element

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDelete, setIsDelete] = useState(false); // Confirmation Modal 
  const [audioToDelete, setAudioToDelete] = useState(null);
  const [fileId, setFileId] = useState(null);

  const handleDeleteBtn = () => {
      setIsDelete(!isDelete);
  }

  const confirmAndDelete = () => {
      setConfirmDelete(true);
  }

  useEffect(() => {
    if (confirmDelete && audioToDelete && fileId) {
        handleAudioArchive(fileId, audioToDelete);
        setConfirmDelete(false);
    }
  }, [confirmDelete, audioToDelete, fileId]);

  const [modalProps, setModalProps] = useState({ audioId: null, currentTitle: '' });


  const fetchAudios = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/audio`);
      setAudios(response.data);
      setFilteredAudio(response.data);
      setAudios(response.data.slice(0, logsPerPage));
    } catch (error) {
      console.error('Error fetching audios:', error);
    }
  };

  useEffect(() => {
    fetchAudios();
  }, [logsPerPage]);

  const handlePlayAudio = async (filePath, audioId) => {
    // Stop currently playing audio if different
    if (playingAudioId && playingAudioId !== audioId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingAudioId(null);
    }
  
    // If same audio is clicked again, stop it
    if (playingAudioId === audioId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingAudioId(null);
      return;
    }
  
    try {
      const response = await axios.get(`${API_URL}/uploads/audios/${filePath}`, { responseType: 'blob' });
      
      // Check if the response status is 200 (OK)
      if (response.status === 200) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        setPlayingAudioId(audioId);
  
        // Play the audio file
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      mountToast("No Audio Available or Audio File dont exist!!", "error"); // Alert the user
    }
  };
  

  const [audioToArchive, setAudioToArchive] = useState(null);  // Track the audio to be archived

  const handleAudioArchive = async (audioId, audioFilePath) => {
    try {
      console.log('Archiving audio...', audioId, audioFilePath);
      
      // Send a PUT request to archive the audio file by its ID and file path
      const response = await axios.put(`${API_URL}/api/archive/audio/${audioId}`, { audioFilePath });
      console.log("API Response:", response);
  
      if (response.status === 200) {
        setAudios((prevAudios) =>
          prevAudios.map((audio) =>
            audio._id === audioId
              ? {
                  ...audio,
                  audioArchived: true,  // Mark as archived
                  filePath: null,  // Optionally clear the filePath, or you can leave it if you prefer
                }
              : audio
          )
        );
          console.log('Archive Success');
        mountToast("Audio archived successfully", "success");
        fetchAudios(); // Refresh the audio list after archiving
        setConfirmDelete(false);
        setAudioToDelete(null);
        setIsDelete(false);
      }
    } catch (error) {
      console.error('Error archiving audio:', error);
      mountToast("Error archiving audio. Please try again.", "error");
    }
  };
  
  {/*<button onClick={() => handleArchiveBtn(audio)}>
    <img className={`${styles.icon} ${styles.update}`} src={icons.archive} alt="Archive Item" />
  </button> */}

  const handleOpenModal = (audioId = null, currentTitle = '') => {
    console.log("Opening modal with audioId:", audioId);
    setModalProps({ audioId, currentTitle });
    setShowUploadModal(true);
  };

  const handleCloseModal = () => {
    setShowUploadModal(false);
    fetchAudios(); // Refresh the audio list after upload/update
  };

  // importat. Related to CSS
  // Get the root ID and and apply className 
  useEffect(() => {
    const rootDiv = document.getElementById("root");

    // Add or remove className based on current page

    if (location.pathname === "/audio") {
      rootDiv.classList.add(styles.rootDiv);
    } else {
      rootDiv.classList.remove(styles.rootDiv);
    }
  }, [location])

    // pagination 
    const handleFilterChange = (searchTerm, limit, currentPage) => {
      const filtered = audiosRef.filter((audio) =>
          [audio.title, audio.originalName]
              .map((value) => value?.toString().toLowerCase())
              .some((value) => value?.includes(searchTerm.toLowerCase()))
      );
  
      setLogsPerPage(limit);
      setFilteredAudio(filtered);
  
      const offset = currentPage * limit;
      setAudios(filtered.slice(offset, offset + limit));
    };
  
    const handlePaginationChange = (currentPage) => {
        const offset = currentPage * logsPerPage;
        setAudios(filteredAudio.slice(offset, offset + logsPerPage));
    };
  
 return (
  <>
    <NavBar />

    <div className={styles.audioManagementContainer}>

      <div className={styles.header}>
        <span className = { styles.txtTitle }>Audio Management</span>
      </div>

      <div className = { styles.tblWrapper }>

        <PaginationControls
          data={filteredAudio}
          rowsPerPageOptions={[5, 10, 15, 20]}
          onFilterChange={handleFilterChange}
          onPaginationChange={handlePaginationChange}
        />

        <table className={styles.audioManagementTable}>
          <thead>
            <tr>
              <th></th>
              <th>Title</th>
              <th>File Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {audios.map((audio) => (
              <tr key={audio._id}>
                {/* Modified by lorenzo @ 05/01/2025 */}
                <td>
                  <div className = { styles.subRow }>
                    {/* Filipino */}
                    <button 
                      onClick={() => handlePlayAudio(audio.filePath, audio._id)}
                      className = { styles.playBtn }
                    >
                      <img className = { `${ styles.icon } ${ styles.play}` } src = { icons.audio } alt = "Play Audio" />
                    </button>
                    {/* English */}
                    <button 
                      onClick={() => handlePlayAudio(audio.filePath, audio._id)}
                      className = { styles.playBtn }
                    >
                      <img className = { `${ styles.icon } ${ styles.play}` } src = { icons.audio } alt = "Play Audio" />
                    </button>
                  </div>
                </td>
                <td>{audio.title}</td>

                {/* Modified by lorenzo @ 05/01/2025 */}
                <td className = { styles.fileName }>
                  <div className = { styles.subRow }>
                      {/* Filipino */}
                      <span>
                        <strong>FIL: </strong>{audio.originalName || 'No Audio Available'}
                      </span>

                      {/* English */}
                      <span>
                        <strong>ENG: </strong>{audio.originalName || 'No Audio Available'}
                      </span>
                  </div>
                  
                  
                </td>
                {/* Modified by lorenzo @ 05/01/2025 */}
                <td>
                  <div className = { styles.subRow }>
                      {/* Filipino */}
                      <div className = {styles.actionBtns }>
                        {audio.originalName ? (
                          <>
                            <button onClick={() => handleOpenModal(audio._id, audio.title)}>
                              <img className = { `${ styles.icon } ${ styles.delete}` } src = { icons.pencil } alt = "Delete Item" />
                            </button>
                            {/*<button onClick={() => handleDeleteBtn(audio._id)}> */}
                            <button onClick={() => { setFileId(audio._id); setAudioToDelete(audio.filePath); handleDeleteBtn();}}>
                              <img className = { `${ styles.icon } ${ styles.update }` } src = { icons.remove } alt = "Delete Item" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleOpenModal(audio._id, audio.title)}>
                            <img className = { `${ styles.icon } ${ styles.add}` } src = { icons.add } alt = "Add Audio"/>
                          </button>
                        )}
                      </div>

                        
                      {/* English */}
                      <div className = {styles.actionBtns }>
                        {audio.originalName ? (
                          <>
                            <button onClick={() => handleOpenModal(audio._id, audio.title)}>
                              <img className = { `${ styles.icon } ${ styles.delete}` } src = { icons.pencil } alt = "Delete Item" />
                            </button>
                            {/*<button onClick={() => handleDeleteBtn(audio._id)}> */}
                            <button onClick={() => { setFileId(audio._id); setAudioToDelete(audio.filePath); handleDeleteBtn();}}>
                              <img className = { `${ styles.icon } ${ styles.update }` } src = { icons.remove } alt = "Delete Item" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handleOpenModal(audio._id, audio.title)}>
                            <img className = { `${ styles.icon } ${ styles.add}` } src = { icons.add } alt = "Add Audio"/>
                          </button>
                        )}
                      </div>
                  </div>
      
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Modal for AudioUpload */}
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
            <AudioUpload
              audioId={modalProps.audioId} // Pass audioId
              currentTitle={modalProps.currentTitle} // Pass currentTitle
              onClose={handleCloseModal} // Pass the onClose function to close the modal
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
                setConfirmDelete = { confirmAndDelete }
            />
        </motion.div>
      )}
    </AnimatePresence>  
    
    {/* Audio player */}
    <audio ref={audioRef} hidden />
  </>
 )
}

export default AudioManagement;
