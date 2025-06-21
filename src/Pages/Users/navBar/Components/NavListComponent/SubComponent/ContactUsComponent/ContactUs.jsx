/* 
-- Files where ContactUs is imported --
ContactUsModule.jsx

*/

import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '/src/Pages/Admin/ACMfiles/authContext'
import { useLocation } from 'react-router-dom';
import { React, useState, useEffect } from 'react';
import axios from 'axios';
import UseToast from '../../../../../../Admin/utility/AlertComponent/UseToast.jsx';
import styles from './styles/contactUsStyles.module.scss';
import icons from '../../../../../../../assets/for_landingPage/Icons.jsx';
import { API_URL } from '/src/config';



export default function ContactUs({ setCurrentModal, handleClickOutside, currentModal, nodeRef, ...props }) { // isModalActive is a prop from NavListComponent

    const [isLoading, setIsLoading] = useState(false);      // for loading animation

    // toast alert pop up
    const mountToast = UseToast();
    
    const [contactUsData, setContactUsData] = useState({
        location: '',
        telephone: '',
        email: '',
        facebookPage: '',
    });

    const fetchContactUsData = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/contact`);
            setContactUsData(response.data);
        } catch (error) {
            mountToast("Error fetching Contact Us data:", 'error');
        }
    };

    useEffect(() => {
        if (currentModal === 'contactUs') {
            fetchContactUsData();
        }
    }, [currentModal]);  // Runs once on mount

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

    // for contact info
    const [activeInfo, setActiveInfo] = useState(null);

    function handleContactClick(info) {
        setActiveInfo(info === activeInfo ? null : info);
    }

    // console.log(activeInfo);

    // Handler for user message sent to client email
    const onSubmit = async (event) => {
        event.preventDefault();

        if(isLoading) return;   // Function guard - prevents spam
        setIsLoading(true);     // start loading

        const formData = new FormData(event.target);
    
        formData.append("access_key", "bc61024f-bc8c-407c-8805-b5d73b18ae51"); // using web3forms, replace with the access key for the client email
    
        try {
            const res = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData
                // ✅ No need for headers — FormData sets the correct multipart boundary
            }).then((res) => res.json());

            if (res.success) {
                mountToast("Message sent!", "success");
            } else {
                mountToast("Message not sent!", "error");
            }
        } catch (err) {
            mountToast("Something went wrong!", "error");
            console.error(err);
        } finally {
            setIsLoading(false);
        }

        // const object = Object.fromEntries(formData);
        // const json = JSON.stringify(object);
    
        // const res = await fetch("https://api.web3forms.com/submit", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //     Accept: "application/json"
        //   },
        //   body: json
        // }).then((res) => res.json());
    
        // if (res.success) {
        //     mountToast("Message sent!", "success");
        //     setIsLoading(false);    // stop loading
        // } else {
        //     mountToast("Message not sent!", "error");
        //     setIsLoading(false);    // stop loading
        // }
    };

    return (
        <>
            <AnimatePresence mode="wait">
                {currentModal === 'contactUs' && (
                    <>
                        <motion.div
                            className = { `${ styles.contactUsContainer } ${ props.className }` }
                            id = "contactUs"
                            initial = {{opacity: 0}}
                            animate = {{opacity: 1}}
                            exit = {{opacity: 0}}
                            transition = {{ duration: 0.3, ease: "easeInOut"}}
                        >
                            <div className = { styles.contactUsContent }>
                                <div className = { styles.close } onClick = { function() { setCurrentModal(null); setActiveInfo(null) }}>
                                    <img src = { icons.close } alt = "Close" />
                                </div>

                                <div className = { styles.header }>
                                    <span className = { styles.txtTitle }>Send Inquiries</span>
                                </div>

                                <form className =  { styles.form } onSubmit={onSubmit}>
                                    <label htmlFor = "name">Name</label>
                                    <input 
                                        autoComplete = "off"
                                        name = "name"
                                        type = "text"
                                        maxLength={ 20 }
                                        required
                                    />

                                    <label htmlFor = "email">Email</label>
                                    <input
                                        autoComplete = "off"
                                        name = "email"
                                        type = "email"
                                        required
                                    />

                                    <label htmlFor = "question">Question</label>
                                    <textarea 
                                        name = "question"
                                        maxLength={ 1000 }
                                        required
                                    />

                                    <button className = { styles.submitBtn } type="submit">
                                        {isLoading ? (
                                            <>
                                                <span className = { styles.loadingSpinner }></span>
                                            </>
                                        ) : (
                                            'Submit'
                                        )}
                                    </button>
                                </form>

                               

                                <div className =  { styles.contacts }>
                                    <div className = { styles.info }>
                                        <div className = { styles.containerInfo }>
                                            <small className = { styles.txtSubTitle }>
                                               <img src = { icons.location} alt = "Location" /> {contactUsData.location}
                                            </small> 
                                            <small className = { styles.txtSubTitle }>
                                               <img src = { icons.contact} alt = "Contact Number" /> {contactUsData.telephone}
                                            </small >
                                        </div>
                                        <div className = { styles.containerInfo }>
                                            <small className = { styles.txtSubTitle }>
                                                <img src = { icons.email} alt = "Email" /> {contactUsData.email}
                                            </small> 
                                            <small className = { styles.txtSubTitle }>
                                                <img src = { icons.facebook} alt = "Facebook" /> {contactUsData.facebookPage}
                                            </small>
                                        </div>
                                    </div>

                                    {/* <img onClick = {() => handleContactClick('location')} src = { icons.location} alt = "Location" />
                                    <img onClick = {() => handleContactClick('number')} src = { icons.contact} alt = "Contact Number" />
                                    <img onClick = {() => handleContactClick('email')} src = { icons.email} alt = "Email" />
                                    <img onClick = {() => handleContactClick('facebook')} src = { icons.facebook} alt = "Facebook" /> */}
                                </div>
                                
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
                                <span className = { styles.txtTitle } onClick = { function() { setCurrentModal("contactUsEdit"); } }>Edit Contacts</span>
                            </motion.button>
                        )}
                    </>
                )}
            </AnimatePresence>
        </>
    )
}