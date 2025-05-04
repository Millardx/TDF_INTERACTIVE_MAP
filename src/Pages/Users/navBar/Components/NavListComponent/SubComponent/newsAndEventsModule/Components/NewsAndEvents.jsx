import React, { useEffect, useState} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Slider from 'react-slick'; // slick carousel
import styles from './styles/newsAndEventsStyles.module.scss';
import icons from '../../../../../../../../assets/for_landingPage/Icons.jsx';
import { useAuth } from '/src/Pages/Admin/ACMfiles/authContext'
import { useLocation } from 'react-router-dom';
import '../../../../../../../Admin/utility/sliderCustomStyles/sliderStyles.scss';
import { API_URL } from '/src/config';



export default function NewsAndEvents({ setCurrentModal, handleClickOutside, currentModal, nodeRef, ...props }) {
    const [images, setImages] = React.useState([]);
    const [headers , setHeaders] = useState([]);
    const [description , setDescription] = useState ([]);

    const location = useLocation();
    const { user: authUser } = useAuth();
    const user = location.state?.user || authUser;

    // Fetch images from the backend when the modal opens
    useEffect(() => {
        const fetchImages = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/images`);
                setImages(response.data[0].images); // Assuming only one document
                setHeaders(response.data[0].newsHeader || [] );
                setDescription(response.data[0].description || []);
            } catch (error) {
                console.error("Error fetching images", error);
            }
        };

        if (currentModal === 'newsAndEvents') {
            fetchImages();
        }
    }, [currentModal]); // Refetch images when modal is opened

    // closes the modal box if the user clicked outside (anywhere in the screen except the modal box)
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

    // Slider settings for slick carousel
    const settings = {
        dots: true,
        infinite: images.length > 1,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
    };

    return (
        <>
            <AnimatePresence mode = "wait">
                {currentModal === 'newsAndEvents' && (
                    <>
                        <motion.div
                            className={ styles.newsAndEventContainer }
                            id="newsAndEvents"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <div className={styles.newsAndEventContent}>
                                <div className={styles.close} onClick={() => setCurrentModal(null)}>
                                    <img src={icons.close} alt="Close" />
                                </div>
                                <div className = { styles.header }>
                                    <span className={styles.txtTitle}>News and Events</span>
                                </div>
                                    {images.length > 0 ? (
                                        <>
                                            <div className={styles.imageSlider}>
                                                <Slider {...settings}>
                                                    {images.map((image, index) => (
                                                        <>
                                                            <div key={index} className ={styles.slickSlide}>
                                                                <img src={`${image}`} 
                                                                alt={`Slide ${index}`} 
                                                                className ={styles.carouselImg}/>
                                                            </div>
                                                            <div className = { styles.news }>
                                                                <span className = { styles.txtTitle }>{headers[index] || "News Header" }</span>
                                                                <p className = { styles.txtSubTitle }>{description[index] || "No news description provided"}</p>
                                                            </div>
                                                        </>
                                                    ))}
                                                </Slider>
                                            </div> 
                                        </>
                                    ) : (
                                        <>
                                            <div className = { styles.noImg }>
                                                <span className = { styles.txtTitle }>No Image Available</span>
                                            </div>
                                            <div className = { styles.news }>
                                                <span className = { styles.txtTitle }>News Header</span>
                                                <p className = { styles.txtSubTitle }>No news or upcoming even just yet... </p>
                                            </div>
                                        </>
                                    )}
                                
                            </div>
                        </motion.div>
                        {/* Edit button */}

                        {(user?.role === "staff" || user?.role === "admin") && (
                            <motion.button 
                            className = { styles.editBtn }
                            initial = {{opacity: 0}}
                            animate = {{opacity: 1}}
                            exit = {{opacity: 0}}
                            transition = {{ duration: 0.3, ease: "easeInOut"}}
                            >
                                <span className = { styles.txtTitle } onClick = { function() { setCurrentModal("editNewsEvent"); } }>Edit Content</span>
                            </motion.button>
                        )}
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
