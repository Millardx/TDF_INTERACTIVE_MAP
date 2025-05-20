// Actuall loading animation
import React from 'react';
import styles from './styles/loadingAnimStyles.module.scss';

export default function LoadingAnim({ message = "Loading..." }) {
    return (
        <div className={styles.loaderWrapper}>
            <div className={styles.loader}></div>
            <p className={styles.message}>{message}</p>
        </div>
    );
}