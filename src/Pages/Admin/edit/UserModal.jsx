import React, { useState, useEffect } from 'react';
import styles from '/src/Pages/Admin/edit/styles/UserModal.module.scss';

import UseToast from '../utility/AlertComponent/UseToast';
// import { ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

import icons from "../../../assets/for_landingPage/Icons";
import {API_URL} from '/src/config'; // Import the API_URL constant
import axios from 'axios';


// Added by lorenzo @05/20/2025
import TogglePassword from '../utility/PasswordComponent/TogglePassword';



const UserModal = ({ user, onSave, onClose }) => {
   
    // for password visibility toggle
    const { inputType, iconClass, toggleVisibility } = TogglePassword();
    const mountToast = UseToast();

    const [name, setName] = useState(user ? user.name : '');
    const [email, setEmail] = useState(user ? user.email : '');
    const [password, setPassword] = useState('');  // New password state
    const [role, setRole] = useState(user ? user.role : 'staff');
    const [checkingEmail, setCheckingEmail] = useState(false);



    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setRole(user.role || 'staff');
        }
    }, [user]);

    const checkEmailExists = async () => {
        if (!email.trim()) return false;
        setCheckingEmail(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/users/check-email`, {
                params: {
                    email,
                    excludeId: user?._id
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setCheckingEmail(false);
            return response.data.exists;
        } catch (error) {
            setCheckingEmail(false);
            console.error('Failed to check email:', error);
            mountToast('Failed to check email', 'error');
            return false;
        }
    };
    
    

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        // Validation...
        if (!name.trim()) {
            mountToast('Name is required', 'error');
            return;
        }
    
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
            mountToast('Please enter a valid email', 'error');
            return;
        }
    
        if (!user && !passwordRegex.test(password)) {
            mountToast('Password must be at least 8 characters, include 1 uppercase, 1 lowercase, 1 number, and 1 special character', 'error');
            return;
        }
    
        if (user && password && !passwordRegex.test(password)) {
            mountToast('Password must be at least 8 characters, include 1 uppercase, 1 lowercase, 1 number, and 1 special character', 'error');
            return;
        }
    
        const emailExists = await checkEmailExists();
        if (emailExists) {
            mountToast('Email already exists, please use a different email.', 'error');
            return;
        }
    
        if (user) {
            const changedFields = [];
    
            if (name !== user.name) changedFields.push('Name');
            if (email !== user.email) changedFields.push('Email');
            if (role !== user.role) changedFields.push('Role');
            if (password.trim() !== '') changedFields.push('Password');
    
            if (changedFields.length === 0) {
                mountToast('No changes detected.', 'warn');
                return;
            }
    
            mountToast(`Successfully updated user (${changedFields.join(', ')})`, 'success');
        }
    
        // 🔧 Clean payload builder: only add password if it's filled
        const payload = {
            name,
            email,
            role,
        };
    
        if (password.trim() !== '') {
            payload.password = password;
        }
    
        onSave(payload);
    };
    
    
    

    return (
        <>
            <div className = { styles.modalContent }>
                <button className = { styles.close } onClick = { onClose }>
                    <img src={icons.close} alt="close" />
                </button>
                <div className = { styles.header }>
                    <span className = { styles.txtTitle }>{user ? 'Edit User' : 'Add User'}</span>
                </div>
                <form className ={styles.form} onSubmit={handleSubmit}>
                    <div className = { styles.container1 }>
                        <div className = { styles.subContainer }>
                            <label>Name:</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter Name"
                                required
                            />
                        </div>
                        <div className = { styles.subContainer }>
                            <label>Email:</label>
                            <input
                                type="email"
                                value={email}
                                onBlur={checkEmailExists}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter Email"
                                required
                            />
                        </div>
                        <div className={styles.subContainer}>
                            <label>Password:</label>
                            <div className={styles.passWrapper}>
                                <input
                                    type={ inputType }
                                    value={ password }
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={ user ? "Change password" : "Enter password" }
                                    required={ !user }
                                />
                                <i 
                                    className={ iconClass }
                                    onClick={ toggleVisibility }
                                ></i>
                            </div>
                        </div>
                    </div>
                    <div className = { styles.container2 }>
                        <div className = { styles.subContainer }>
                            <label>Role:</label>
                            <select value={role} onChange={(e) => setRole(e.target.value)}>
                                <option value="staff">Staff</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <button type="submit">Save</button>
                    </div>
                    
                </form>
            </div>

            {/* <ToastContainer /> */}
        </>
    );
};

export default UserModal;