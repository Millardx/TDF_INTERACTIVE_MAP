/*
-- Files where SignIn is imported --
Option.jsx
*/

import { Link , useNavigate } from "react-router-dom";
import React, { useState } from 'react';
import { login } from '/src/Pages/Admin/ACMfiles/authService';
import { useUser } from '/src/Pages/Admin/ACMfiles/UserContext';

import styles from './styles/signInStyles.module.scss';
import icons from '../../../../../../assets/for_landingPage/Icons.jsx';
import { jwtDecode } from 'jwt-decode'; // Correctly import jwtDecode

import UseToast from "../../../../../Admin/utility/AlertComponent/UseToast.jsx";

import { useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion'

// Added by Lorenzo @ 05/18/2025
import 'bootstrap-icons/font/bootstrap-icons.css';
import TogglePassword from "../../../../../Admin/utility/PasswordComponent/TogglePassword.jsx";

// import axios from 'axios'


export default function SignIn ({ handleBtnClick, isBtnClicked, handleUser }) {
    // for password visibility toggle
    const { inputType, iconClass, toggleVisibility } = TogglePassword();

    // added by lorenzo @ 05/18/2025
    const [isLoading, setIsLoading] = useState(false);      // for loading animation


    const { login: setUser } = useUser();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const [error, setError] = useState('');

    // toast alert pop up
    const mountToast = UseToast();

    // Modified by lorenzo @ 05/18/2025
    const handleSubmit = async (e) => {
        e.preventDefault();

        if(isLoading) return;   // Function guard - prevents spam

        setIsLoading(true);     // start loading

        try {
            const userData = { email, password };
            const response = await login(userData);

            localStorage.setItem('user', JSON.stringify(response));
            localStorage.setItem('token', response.token);
            setUser(response);

            // Now you can navigate based on the user role
            if (response.role === 'admin' || response.role === 'staff') {
                console.log(response.role ,'Logged In!')
                navigate('/map', { state: { user: response } }); // Pass user object for admin and staff
            } else if (response.role === 'guest') {
                navigate('/map'); // Guest just navigates without passing user
            }
        } catch (error) {
            mountToast("Failed to login!", "error");
            setIsLoading(false);    // stop loading
        } finally {
            setIsLoading(false);    // stop loading
        }
    };

    return (
        <>
            <AnimatePresence>
                {isBtnClicked && (
                    <motion.div 
                        className = { `${ styles.signInContent }` }
                        initial = {{opacity: 0}}
                        animate = {{opacity: 1}}
                        exit = {{opacity: 0, transition: {delay: 0}}}
                        transition = {{duration: 0.3, delay: 0.2, ease: "easeInOut"}}
                    >
                        <div className = { styles.return } onClick = { handleBtnClick }>
                            <img src = { icons.arrow } alt = "Close" />
                        </div>

                        <span className = { styles.txtTitle }>Sign in</span>

                        <form className = { styles.form } onSubmit = { handleSubmit } >
                            <label htmlFor = "email">Email</label>
                            <input 
                                autoComplete = "off"
                                name = "email"
                                type = "email"
                                required
                                onChange = {(e) => setEmail(e.target.value)}
                            />

                            <label htmlFor = "password">
                                Password
                                <div className = { styles.passToolTip }> 
                                    <i className="bi bi-question-circle"></i>
                                    <small className =  { styles.toolTipText }>
                                        Password should be 8 characters long and have
                                        at least 1 number, uppercase, lowercase
                                        and special character 
                                    </small>
                                </div>
                            </label>
                            <div className = { styles.passWrapper }>
                                <input
                                    autoComplete = "off"
                                    name = "password"
                                    type = { inputType }
                                    required
                                    onChange = {(e) => setPassword(e.target.value)}
                                />

                                <i 
                                    className={ iconClass }
                                    onClick={ toggleVisibility }
                                ></i>
                            </div>
                            
                            {/* Change button names into general names */}
                            <button 
                                className = { `${styles.button } ${styles.submitBtn } ${styles.loading}` } 
                                type = "submit"    
                                disabled = { isLoading }
                            >
                                {isLoading ? (
                                    <>
                                        <span className = { styles.loadingSpinner }></span>
                                    </>
                                ) : (
                                    'Sign in'
                                )}
                            </button>
                        </form>
                    </motion.div>   
                )}
            </AnimatePresence>
        </>
    )
}