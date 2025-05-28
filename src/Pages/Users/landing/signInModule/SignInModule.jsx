// import { CSSTransition } from 'react-transition-group';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'
import { UserProvider } from '/src/Pages/Admin/ACMfiles/UserContext';
import Option from './Components/OptionComponent/Option.jsx';
import SignIn from './Components/SignInComponent/SignIn.jsx';
import Greeting from './Components/GreetingComponent/Greeting.jsx';
import styles from './styles/signInModuleStyles.module.scss';
import { useAuth } from '/src/Pages/Admin/ACMfiles/authContext';

export default function SignInModule() {
    const { checkToken } = useAuth();

    useEffect(() => {
        checkToken(); // Validate token and redirect if needed
        localStorage.removeItem('guestId'); // Remove guestId from localStorage when this navigated to SignUp Module
        localStorage.removeItem('tdfHasSeenTutorial'); // ✅ Clear modal flag on landing
        console.log("Guest Logout")
    }, [checkToken]);

    

    // adds the className rootContainer to the #root and removes it once the component unmounts
    useEffect(function() {
        const root = document.getElementById('root');
        root.classList.add(styles.rootContainer);

        //removes the className once unmount
        return function() {
            root.classList.remove(styles.rootContainer);
        };
    }, []);

    // added by Lorenzo @ 05/18/2025
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        const reloaded = sessionStorage.getItem('reloadedAfterLogout');

        if (!reloaded) {
            sessionStorage.setItem('reloadedAfterLogout', 'true');
            window.location.reload(); // Force reload before rendering
        } else {
            sessionStorage.removeItem('reloadedAfterLogout'); // Clean up
            setShouldRender(true); // Safe to render now
        }
    }, []);

    // --------- Option Component ---------
    const [isBtnClicked, setIsBtnClicked] = useState(false);

    const [optionUnmountDelay, setOptionUnmountDelay] = useState(false);
    const [signinUnmountDelay, setSigninUnmountDelay] = useState(true);

    // checks if the sign in button is clicked
    function handleBtnClick() {
         if(!isBtnClicked) {
            setIsBtnClicked(!isBtnClicked);

            // sets unmount delay
            setTimeout(() => {
                setOptionUnmountDelay(!optionUnmountDelay); 
                setSigninUnmountDelay(!signinUnmountDelay); 
            }, 150);
        } else {
            setIsBtnClicked(!isBtnClicked);

            // sets unmount delay
            setTimeout(() => {
                setOptionUnmountDelay(!optionUnmountDelay); 
                setSigninUnmountDelay(!signinUnmountDelay); 
            }, 150)
        }
    }
    
    const [isUser, setIsUser] = useState(null);

    const handleUser = (user, role) => {
        setIsUser(user);
        console.log(`${user} logged in with ID: ${role}`); // Log the user role

    };

    // added by lorenzo @ 05/18/2025
    // For UX
    if (!shouldRender) return null; // Prevent rendering during reload

    return(
        <UserProvider>
        <div className = { styles.overlay }></div>
        <div className={styles.mainContainer}>
            {/* Modified by Lorenzo @ 05/18/2025 */}
            <div className = { styles.loginContainer }> {/* Main container for option and login form*/}
                <AnimatePresence mode="wait">
                    <motion.div 
                        className = { styles.firstContainer }
                        key={isBtnClicked ? "signin" : "option"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                        {isBtnClicked ? (
                            <SignIn
                                handleBtnClick={handleBtnClick}
                                isBtnClicked={isBtnClicked}
                                handleUser={handleUser}
                            />
                        ) : (
                            <Option
                                handleBtnClick={handleBtnClick}
                                isBtnClicked={isBtnClicked}
                                handleUser={handleUser}
                            />
                        )}
                    
                    </motion.div>
                </AnimatePresence>
                <Greeting />
            </div>
        </div>
        </UserProvider>
    )
}