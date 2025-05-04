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
      const targetAudio = audios.find(a => a._id === fileId);
      const isArchivingEnglish = targetAudio?.englishAudio === audioToDelete;
      const isArchivingFilipino = targetAudio?.filipinoAudio === audioToDelete;
  
      const payload = {};
      if (isArchivingEnglish) payload.englishUrl = audioToDelete;
      if (isArchivingFilipino) payload.filipinoUrl = audioToDelete;
  
      if (Object.keys(payload).length > 0) {
        handleAudioArchive(fileId, payload.englishUrl, payload.filipinoUrl);
      }
  
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


  const handlePlayAudio = async (filePath, audioKey) => {
    if (!filePath) {
      mountToast("Audio file is missing or unavailable.", "error");
      return;
    }
  
    // If same audio is already playing, pause it
    if (playingAudioId === audioKey) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingAudioId(null);
      return;
    }
  
    // Stop any other playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  
    try {
      const response = await axios.get(filePath, { responseType: 'blob' });
  
      if (response.status === 200) {
        const url = URL.createObjectURL(new Blob([response.data]));
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingAudioId(audioKey);
      } else {
        mountToast("Failed to load audio file.", "error");
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      mountToast("Error playing audio. File may be missing or corrupted.", "error");
    }
  };
  
  
  


  const handleAudioArchive = async (audioId, englishUrl, filipinoUrl) => {
    try {
      console.log('📦 Archiving audio...', audioId);
  
      // 🧠 Build payload conditionally
      const payload = {};
      if (englishUrl) payload.englishUrl = englishUrl;
      if (filipinoUrl) payload.filipinoUrl = filipinoUrl;
  
      const response = await axios.put(`${API_URL}/api/archive/audio/${audioId}`, payload);
  
      if (response.status === 200) {
        setAudios((prev) =>
          prev.map((audio) => {
            if (audio._id !== audioId) return audio;
  
            return {
              ...audio,
              audioArchived: false, // not globally archived
              englishAudio: englishUrl ? null : audio.englishAudio,
              filipinoAudio: filipinoUrl ? null : audio.filipinoAudio,
              englishOriginalName: englishUrl ? '' : audio.englishOriginalName,
              filipinoOriginalName: filipinoUrl ? '' : audio.filipinoOriginalName,
            };
          })
        );
  
        mountToast("Audio archived successfully", "success");
        fetchAudios();
        setConfirmDelete(false);
        setAudioToDelete(null);
        setIsDelete(false);
      }
    } catch (error) {
      console.error('❌ Error archiving audio:', error);
      mountToast("Error archiving audio. Please try again.", "error");
    }
  };
  
  
  
  
  {/*<button onClick={() => handleArchiveBtn(audio)}>
    <img className={`${styles.icon} ${styles.update}`} src={icons.archive} alt="Archive Item" />
  </button> */}

  const handleOpenModal = (audioId = null, currentTitle = '', language = 'filipino') => {
    console.log("Opening modal with audioId:", audioId);
    setModalProps({ audioId, currentTitle, language });
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
                  <div className={styles.subRow}>
                    {/* Filipino Button */}
                    <button
                      onClick={() => handlePlayAudio(audio.filipinoAudio, audio._id + '-fil')}
                      className={styles.playBtn}
                    >
                      <img
                        className={`${styles.icon} ${styles.play}`}
                        src={playingAudioId === audio._id + '-fil' ? icons.pause : icons.audio}
                        alt="Filipino Audio"
                      />
                      {playingAudioId === audio._id + '-fil' && <span className={styles.nowPlaying}>Now Playing...</span>}
                    </button>

                    {/* English Button */}
                    <button
                      onClick={() => handlePlayAudio(audio.englishAudio, audio._id + '-eng')}
                      className={styles.playBtn}
                    >
                      <img
                        className={`${styles.icon} ${styles.play}`}
                        src={playingAudioId === audio._id + '-eng' ? icons.pause : icons.audio}
                        alt="English Audio"
                      />
                      {playingAudioId === audio._id + '-eng' && <span className={styles.nowPlaying}>Now Playing...</span>}
                    </button>
                  </div>
                </td>

                <td>{audio.title}</td>

                {/* Modified by lorenzo @ 05/01/2025 */}
                <td className = { styles.fileName }>
                  <div className = { styles.subRow }>
                      {/* Filipino */}
                      <span>
                        <strong>FIL: </strong>{audio.filipinoOriginalName  || 'No Audio Available'}
                      </span>

                      {/* English */}
                      <span>
                        <strong>ENG:</strong> {audio.englishOriginalName || 'No Audio Available'}
                      </span>
                  </div>
                  
                  
                </td>
                {/* Modified by lorenzo @ 05/01/2025 */}
                {/* Milalrd IMplementation of the Dual langauge audio*/}
                <td>
                  <div className={styles.subRow}>
                    {/* Filipino Actions */}
                    <div className={styles.actionBtns}>
                      {audio.filipinoAudio ? (
                        <>
                          {/* Update Filipino */}
                          <button onClick={() => handleOpenModal(audio._id, audio.title, 'filipino')}>
                            <img className={`${styles.icon} ${styles.pencil}`} src={icons.pencil} alt="Edit Filipino Audio" />
                          </button>

                          {/* Archive Filipino */}
                          <button onClick={() => {
                            setFileId(audio._id);
                            setAudioToDelete(audio.filipinoAudio);
                            handleDeleteBtn();
                          }}>
                            <img className={`${styles.icon} ${styles.remove}`} src={icons.remove} alt="Archive Filipino Audio" />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleOpenModal(audio._id, audio.title, 'filipino')}>
                          <img className={`${styles.icon} ${styles.add}`} src={icons.add} alt="Add Filipino Audio" />
                        </button>
                      )}
                    </div>

                    {/* English Actions */}
                    <div className={styles.actionBtns}>
                      {audio.englishAudio ? (
                        <>
                          {/* Update English */}
                          <button onClick={() => handleOpenModal(audio._id, audio.title, 'english')}>
                            <img className={`${styles.icon} ${styles.pencil}`} src={icons.pencil} alt="Edit English Audio" />
                          </button>

                          {/* Archive English */}
                          <button onClick={() => {
                            setFileId(audio._id);
                            setAudioToDelete(audio.englishAudio);
                            handleDeleteBtn();
                          }}>
                            <img className={`${styles.icon} ${styles.remove}`} src={icons.remove} alt="Archive English Audio" />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleOpenModal(audio._id, audio.title, 'english')}>
                          <img className={`${styles.icon} ${styles.add}`} src={icons.add} alt="Add English Audio" />
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
              language={modalProps.language} // ✅ now supported
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
