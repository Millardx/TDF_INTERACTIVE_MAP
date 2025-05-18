import { useCallback } from 'react';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

export default function ValidatePassword(mountToast) {
    
    const isPasswordValid = useCallback((password, user = null) => {
        if (!password) return false;

        const isValid = passwordRegex.test(password);

        if (!isValid) {
        mountToast(
            'Password should be 8 characters long and have at least 1 number, uppercase, lowercase and special character ',
            'error'
        );
        }

        return isValid;
    }, [mountToast]);

    return { isPasswordValid };

};