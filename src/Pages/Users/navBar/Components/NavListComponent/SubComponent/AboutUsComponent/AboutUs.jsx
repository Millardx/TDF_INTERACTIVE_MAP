import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '/src/Pages/Admin/ACMfiles/authContext'
import { useLocation } from 'react-router-dom';
import axios from 'axios';

import styles from './styles/aboutUsStyles.module.scss'
import images from '../../../../../../../assets/for_landingPage/Images.jsx'
import icons from '../../../../../../../assets/for_landingPage/Icons.jsx'
import { API_URL } from '/src/config';

import UseToast from '../../../../../../Admin/utility/AlertComponent/UseToast.jsx';
import useLoading from '../../../../../../Admin/utility/PageLoaderComponent/useLoading.jsx';
import LoadingAnim from '../../../../../../Admin/utility/PageLoaderComponent/LoadingAnim.jsx';

export default function AboutUs({ setCurrentModal, handleClickOutside, currentModal, nodeRef, ...props }) {

    const [isLoading, setIsLoading] = useLoading(false);
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    // toast alert pop up
    const mountToast = UseToast();

    // State to store About Us data
    const [aboutUsData, setAboutUsData] = useState({
        historicalBackground: '',
        vision: '',
        mission: '',
        goal: '',
        objectives: '',
        image: ''
    });

    // Fetch About Us data from the backend
    const fetchAboutUsData = async () => {

        if (isFirstLoad) setIsLoading(true);

        try {
            const response = await axios.get(`${API_URL}/api/aboutus`);
            setAboutUsData(response.data); // Update state with fetched data
        } catch (error) {
            mountToast("Error fetching About Us data:", 'error');
        } finally {
            setIsLoading(false);
            setIsFirstLoad(false);    // Mark that first load is done
        }
    };

    // Fetch data when the AboutUs modal is opened
    useEffect(() => {
        if (currentModal === 'aboutUs') {
            fetchAboutUsData();
        }
    }, [currentModal]);

    const location = useLocation();
    const { user: authUser } = useAuth();
    const user = location.state?.user || authUser;
    

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

    return (
        <>
            <AnimatePresence>
                {currentModal === 'aboutUs' && (
                    <>
                        <motion.div
                            className = { `${ styles.aboutUsContainer } ${ props.className }` }
                            id = "aboutUs"
                            initial = {{opacity: 0}}
                            animate = {{opacity: 1}}
                            exit = {{opacity: 0}}
                            transition = {{ duration: 0.3, ease: "easeInOut"}}
                        >   
                            {isLoading ? (
                                <LoadingAnim message="Loading content..." target="loadModal"/>
                            ) : (
                                <div className = { styles.aboutUsContent }>
                                    <div className = { styles.close } onClick = { function() { setCurrentModal(null); }}>
                                        <img src = { icons.close } alt = "Close" />
                                    </div>

                                    <div className = { styles.header }>
                                        <span className = { styles.txtTitle }>About Us</span>
                                    </div>

                                    <div className = { styles.content }>
                                        {/* <img src = { images.aboutUs } alt = "Extension Services Image" /> */}
                                        {/* Display Image */}
                                        {aboutUsData.image ? (
                                            <img
                                                src={`${aboutUsData.image}`}
                                                alt="About Us"
                                                className={styles.aboutUsImage}
                                            />
                                        ) : (
                                            <div className = { styles.noImg }>
                                                <span className={styles.txtTitle}>No Image Uploaded</span>
                                            </div>
                                        )}

                                        {/* Updated This for Displaying the Quill Content */}
                                        <div className={styles.history}>
                                        <span className={styles.txtTitle}>Historical Background</span>
                                        <div
                                            className={styles.txtSubTitle}
                                            dangerouslySetInnerHTML={{ __html: aboutUsData.historicalBackground }}
                                        ></div>
                                        </div>

                                        <div className={styles.vision}>
                                        <span className={styles.txtTitle}>Vision</span>
                                        <div
                                            className={styles.txtSubTitle}
                                            dangerouslySetInnerHTML={{ __html: aboutUsData.vision }}
                                        ></div>
                                        </div>

                                        <div className={styles.mission}>
                                        <span className={styles.txtTitle}>Mission</span>
                                        <div
                                            className={styles.txtSubTitle}
                                            dangerouslySetInnerHTML={{ __html: aboutUsData.mission }}
                                        ></div>
                                        </div>

                                        <div className={styles.goal}>
                                        <span className={styles.txtTitle}>Goal</span>
                                        <div
                                            className={styles.txtSubTitle}
                                            dangerouslySetInnerHTML={{ __html: aboutUsData.goal }}
                                        ></div>
                                        </div>

                                        <div className={styles.objective}>
                                        <span className={styles.txtTitle}>Objectives</span>
                                        <div
                                            className={styles.txtSubTitle}
                                            dangerouslySetInnerHTML={{ __html: aboutUsData.objectives }}
                                        ></div>
                                        </div>



                                    </div>
                                </div>
                            )}
                        </motion.div>
                        {(user?.role === "staff" || user?.role === "admin") && (
                            <motion.button 
                                className = { styles.editBtn }
                                initial = {{opacity: 0}}
                                animate = {{opacity: 1}}
                                exit = {{opacity: 0}}
                                transition = {{ duration: 0.3, ease: "easeInOut"}}
                            >
                                <span className = { styles.txtTitle } onClick = { function() { setCurrentModal("aboutUsEdit"); } }>Edit Content</span>
                            </motion.button>
                        )}
                    </>
                )}
            </AnimatePresence>
        </>
    )
}