import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import * as THREE from 'three';
import styles from './Markers.module.scss';
import fetchMarkerData from '/src/assets/API/marker_data';
import markerData from '../../../../../assets/API/marker_data';
import Popup from './popup/Popup';
import { motion, AnimatePresence } from 'framer-motion'
import { API_URL } from '/src/config';

// data pipe here
//const markers = fetchMarkerData;
const screenWidth = window.innerWidth;

const Markers = ({ scene, camera, container, moveToMarker, showMarkerNames, setShowMarkerNames, handleCheckboxChange }) => {
  const[hoveredMarker, setHoveredMarker] = useState(null);
  const animationFrameRef = useRef();
  const [selectedMarker, setSelectedMarker] = useState(null);

//Added for Modal Debugging 

const [modals, setModals] = useState([]);
    // Fetch modals from the backend
    useEffect(() => {
      const fetchModals = async () => {
        const response = await axios.get(`${API_URL}/api/modal`);
        setModals(response.data);
      };
      fetchModals();
    }, []);

  //Added for Fetching Updated cards
  const [markers, setMarkers] = useState([]);
  
  useEffect(() => {
    const loadMarkers = async () => {
        const data = await fetchMarkerData(); // Fetch the latest marker data
       // console.log('Markers after fetching:', data); // Check the fetched markers
        setMarkers(data); // Update state with the fetched data
    };
    
    loadMarkers();
}, []);

  const handleHover = (index) =>{
    setHoveredMarker(index);
  }

  const handleExit = () =>{
    setHoveredMarker(null);
  }

  const calculatePosition = useCallback((worldPosition) =>{
    const screenPosition = worldPosition.clone().project(camera);
  
    const halfWidth = container.clientWidth / 2;
    const halfHeight = container.clientHeight / 2;
  
    const x = (screenPosition.x * halfWidth) + halfWidth;
    const y = -(screenPosition.y * halfHeight) + halfHeight;
  
    return { x, y };
  }, [camera, container]);

  // pos updater
  const updateMarkerPositions = useCallback(() => {

    markers.forEach((marker, index) => {
      const { x, y } = calculatePosition(marker.position);
      const markerElement = document.getElementById(`marker-${index}`);
      if (markerElement) {
        markerElement.style.left = `${x}px`;
        markerElement.style.top = `${y}px`;
      }

      const tooltipElement = document.getElementById(`tooltip-${index}`);
      if (tooltipElement) {
        tooltipElement.style.left = `${x}px`;
        tooltipElement.style.top = `${y}px`;
      }
    });
    

    // calculate popup pos
    if (selectedMarker) {
      let isLandscape = window.innerWidth > window.innerHeight;

      let offset = {
        top: isLandscape ? -150 : (window.innerWidth > 666 ? -200 : -250),
        left: isLandscape ? -90 : (window.innerWidth > 666 ? 40 : -150),
      };

      const { x, y } = calculatePosition(selectedMarker.position);
      const popupElement = document.getElementById('popup');
      if (popupElement) {
        popupElement.style.left = `${x + offset.left}px`;
        popupElement.style.top = `${y + offset.top}px`;
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateMarkerPositions);
  }, [markers, calculatePosition, selectedMarker]);

  const handleMarkerCLick = (marker) => {
    //setSelectedMarker(marker); // Set the selected marker
    if(selectedMarker == marker){
      setModalId(marker.modalId); // Set the modalId from the clicked marker
      // console.log('same marker');
      return;
    }
   else{
      setSelectedMarker(null);
      moveToMarker(marker.position, () => {
        setSelectedMarker(marker);  // Display popup after moving to the marker
      });
    }
  }; 

  const handleClosePopup = (marker) =>{
    setSelectedMarker(null);
  }
  // updates marker pos
  useEffect(() => {
    if (scene && camera && container) {
      updateMarkerPositions();
      return () => {
        if(animationFrameRef.current){
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [scene, camera, container, updateMarkerPositions]);

  return (
    <>
      {markers.map((marker, index) => (
        <React.Fragment key={index}>
        <div
          key={index}
          id={`marker-${index}`}
          className={styles.marker}
          style={{ position: 'absolute',}}
          onClick={() => handleMarkerCLick(marker)}
          onMouseEnter={() => handleHover(index)}
          onMouseLeave={handleExit}
        >
          <img src={marker.icon} alt={marker.name} />
        </div>


        {/* Tooltip */}
      {(showMarkerNames || hoveredMarker === index) && (
        <div
          id={`tooltip-${index}`}
          className={styles.tooltip}
          style={{
            position: 'absolute',
            opacity: (showMarkerNames || hoveredMarker === index) ? 1 : 0,
            pointerEvents: 'none',
          }}
        >
          {marker.name}
        </div>
      )}


        </React.Fragment>
      ))}

      <AnimatePresence>
      {selectedMarker && (    
          <Popup
            modalId={selectedMarker.modalId}
            marker={selectedMarker}
            position={calculatePosition(selectedMarker.position)}
            onClose={handleClosePopup}
          />
          
      )}
      </AnimatePresence>
    </>
  );
};

export default Markers;
