import { toast, Slide } from 'react-toastify';


// added by lorenzo - 05/01/2025
const MAX_TOASTS = 2;   // define max message to accomodate

const UseToast = () => {

    const mountToast = (message, type, customOptions = {}) => {

        // added by lorenzo - 05/01/2025
        if (toast.toastCount >= MAX_TOASTS) return;     // terminate execution if request exceeds limit

        const toastSettings = {
            position: "top-center",
            autoClose: 2500,
            hideProgressBar: false,
            newestOnTop: true,
            closeOnClick: true,
            pauseOnFocusLoss: true,
            draggable: true,
            pauseOnHover: true,
            theme: "light",
            progress: null,
            transition: Slide,
            ...customOptions        // submit feedback reminder specific properties
        }

        switch (type) {
            case "success":
                toast.success(message, toastSettings);
                break;
            case "error":
                toast.error(message, toastSettings);
                break;
            case "warn":
                toast.warn(message, toastSettings);
                break;
            case "info":
                toast.info(message, toastSettings);
                break;
            default:
                toast.success(message, toastSettings);
        }
    };

    return mountToast;
}

export default UseToast;