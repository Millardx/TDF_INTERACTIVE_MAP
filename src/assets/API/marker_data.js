import * as THREE from 'three';
import get from './get';
// import assets from '@assets/Icon.js'
import img from '../images/farm.jpg';
import axios from 'axios'; // Import axios for API calls
import {API_URL} from '/src/config'; // Import the API_URL constant





//let areaPositions = {}; // Declare areaPositions outside the fetch function
const fetchMarkerData = async () => {
  let areaPositions = {};

  try {
    // 🔁 Fetch all needed data at once
    const [cardsResponse, iconsResponse, markersResponse] = await Promise.all([
      axios.get(`${API_URL}/api/cards`),
      axios.get(`${API_URL}/api/markerIcons`),
      axios.get(`${API_URL}/api/markers/markerData`)
    ]);

    const cards = cardsResponse.data;
    const icons = iconsResponse.data;
    const markers = markersResponse.data;

    // ✅ Build an iconMap: { iconName: iconPath }
    const iconMap = {};
    icons.forEach(icon => {
      iconMap[icon.name] = icon.iconPath;
    });

    // ✅ Build areaPositions from markers data
    markers.forEach(marker => {
      areaPositions[marker.areaName] = new THREE.Vector3(
        marker.worldPosition.x,
        marker.worldPosition.y,
        marker.worldPosition.z
      );
    });

    // ✅ Map cards, resolve iconPath using iconMap by card.iconType
    return cards.map(card => {
      const normalizedAreaName = card.areaName.trim();
      const position = areaPositions[normalizedAreaName] || new THREE.Vector3(0, 0, 0);

      const resolvedIcon = iconMap[card.iconType] || '/default-marker.png'; // Fallback if not found

      return {
        position: position,
        icon: resolvedIcon,
        name: card.areaName,
        img: `${card.image}`,
        quickFacts: card.quickFacts,
        modalId: card.modal_id,
      };
    });
  } catch (error) {
    console.error('Error fetching marker data:', error);
    return [];
  }
};


export default fetchMarkerData;