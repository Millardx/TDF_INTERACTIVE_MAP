
import styles from "./styles/confirmationStyles.module.scss"

export default function ConfirmRestore({ onCancel, setConfirmDelete, isRestoring }) {
    
    return (
        <>
            <div className = { styles.container }>
                <div className = { styles.content }>
                    <span className = { styles.txtTitle }> ARE YOU SURE</span>
                    <p className = { styles.txtSubTitle }>
                        Are you sure you want to restore this item?
                    </p>
                    <div className = { styles.btns}>
                        <div className = { styles.restore }>
                            <button 
                                className = { styles.txtTitle}
                                onClick = { setConfirmDelete }    
                            >
                                {isRestoring ? (
                                    <>
                                        <span className = { styles.loadingSpinner }></span>
                                    </>
                                ) : (
                                    'Restore'
                                )}
                            </button>
                        </div>
                        <div className = { styles.cancel }>
                            <button 
                                className = { styles.txtTitle}
                                onClick ={ onCancel }    
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}