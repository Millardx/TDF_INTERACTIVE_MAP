import React, { useState, useRef, useEffect } from 'react';
import styles from './Pathfinding.module.scss';
import { arrow } from './assets/index';
import { positionGeometry } from 'three/webgpu';

import UseToast from '../../../../Admin/utility/AlertComponent/UseToast';

function Pick({pos, moveArrow, removeLine, cameraPF, togglePathfinding, isPathfindingActive, setCurrentModal}) {

    const [user, setUser] = useState(() => {
        return JSON.parse(localStorage.getItem('user'));
    });

    // toast alert pop up
    const mountToast = UseToast();

    // for closing container when user click outside
    const pathfindingRef = useRef(null);

    const [isPfBtn, setIsPfBtn] = useState(true);
    const [buttonHidden, setButtonHidden] = useState(false);
    const headerRef = useRef(null);
    const modalWrapperRef = useRef(null)
    const [current, setCurrent] = useState(null);
    const [cname, setCname]= useState('Current');
    const [destination, setDestination] = useState(null);
    const [dname, setDname]= useState('Destination');

    // for close button indicator
    const [showTooltip, setShowTooltip] = useState(false);

    // Filter available positions for destination based on current selection
    const getAvailablePositions = (selectionType) => {
        if (selectionType === 'Destination' && current) {
            return pos.filter(p => p.name !== current);
        } else if (selectionType === 'Current' && destination) {
            return pos.filter(p => p.name !== destination);
        }
        return pos;
    };


    useEffect(() =>{
        const container = document.getElementById('container');
        if(container && !modalWrapperRef.current){
            const wrapper = document.createElement('div');
            wrapper.id = 'pfModal-wrapper';
            container.appendChild(wrapper);
            modalWrapperRef.current = wrapper;
            wrapper.addEventListener('click', (e) => toggleModal(e));

            const header = document.createElement('h1');
            header.id = 'header';
            wrapper.appendChild(header);
            headerRef.current = header;
            
            const modal = document.createElement('div');
            modal.id = 'pfModal';
            wrapper.appendChild(modal);

            const itemCont = document.createElement('div');
            itemCont.id = 'items-container';
            modal.appendChild(itemCont);

            const headerText = headerRef.current?.textContent || '';
            const availablePositions = getAvailablePositions(headerText);

            availablePositions.forEach((p) => {
                const item = document.createElement('a');
                item.className = 'items';
                item.href = '#';
                item.dataset.name = p.name;
                item.textContent = p.name;
                item.addEventListener('click', (e) => e.preventDefault());
                itemCont.appendChild(item);

                item.addEventListener('click', (e) => {
                    chosenPath(e.target.dataset.name);
                });
            });

            
        }
        return () =>{
            if(modalWrapperRef.current){
                modalWrapperRef.current.remove();
                modalWrapperRef.current = null;
            }
        }
    }, [pos])

    // To render Pathfinding Modal on the main parent div

    // pathfinding methods
    const handleButtonClick = (type) =>{

        // for close button indicator
        if (type === 'Open') {
            setShowTooltip(true); // Show tooltip immediately

            // Auto-hide after 3 seconds
            setTimeout(() => {
                setShowTooltip(false);
            }, 3000);
        }

        if(type === 'Open'){
            togglePathfinding();
            setButtonHidden(true)
            setTimeout(() => {
                setIsPfBtn(false);
            }, 300)
            // console.log('open modal');
        }
        else if(type === 'Enter'){
            if(!current && !destination) {
                mountToast("Please select your current location and destination", "error");
                return;
            }

            if (!current) {
                mountToast("Please select your current location.", "error");
                return;
            }

            if (!destination) {
                mountToast("Please select your destination.", "error");
                return;
            }
            
            togglePathfinding();
            setButtonHidden(false)
            setTimeout(() => {
                setIsPfBtn(true);
            }, 300)
            moveArrow(current, destination);
            setCname('Current');
            setDname('Destination');
            setCurrent(null);
            setDestination(null);
            // console.log('enter');

            if (user?.role !== "admin" && user?.role !== "staff") {
                mountToast(
                    "We'd love your feedback — help us improve!",
                    "info",
                    {
                        position: "bottom-right",
                        autoClose: 8000,
                        onClick: () => setCurrentModal("submitFeedback")
                    }
                );
            }
            
        }


        else if(type === 'Close'){
            togglePathfinding();
            setButtonHidden(false)
            setTimeout(() => {
                setIsPfBtn(true);
            }, 300)
            console.log('close modal');

        }
    }
    
    const toggleModal = (btn) => {
        choiceHelper(btn);
        const wrapper = document.getElementById('pfModal-wrapper');
        const pfModal = document.getElementById('pfModal');
    
        if (!wrapper.classList.contains("active")) {
            wrapper.classList.add("active");
            pfModal.classList.add("active");
    
            // 🆕 Force re-render dropdown items when modal opens
            setTimeout(() => {
                const itemCont = document.getElementById('items-container');
                if (itemCont) {
                    itemCont.innerHTML = ''; // clear old items
                    const headerText = headerRef.current?.textContent || '';
                    const availablePositions = getAvailablePositions(headerText);
    
                    availablePositions.forEach((p) => {
                        const item = document.createElement('a');
                        item.className = 'items';
                        item.href = '#';
                        item.dataset.name = p.name;
                        item.textContent = p.name;
                        item.addEventListener('click', (e) => e.preventDefault());
                        item.addEventListener('click', (e) => {
                            chosenPath(e.target.dataset.name);
                        });
                        itemCont.appendChild(item);
                    });
                }
            }, 0);
    
        } else {
            wrapper.classList.remove("active");
            pfModal.classList.remove("active");
        }
    };
    
    const choiceHelper = (btn) => {
        headerRef.current.textContent = btn;
        console.log(btn)
    }
    const chosenPath = (choice) =>{
        const header = headerRef.current?.textContent;
        if(header){
            if(header === 'Current'){
                setCurrent(choice);
                setCname(choice);
            }
            else if(header === 'Destination'){
                setDestination(choice);
                setDname(choice);
                
            }
        }
    }

    // close modal when user click outside of pathfinding
    useEffect(() => {
        function handleOutsideClick(event) {
            const modal = document.getElementById('pfModal-wrapper'); // manually created modal

            if (
                pathfindingRef.current &&
                !pathfindingRef.current.contains(event.target) &&
                (!modal || !modal.contains(event.target)) &&
                !isPfBtn // Only run if modal is open
            ) {
                handleButtonClick('Close');
            }
        }

        document.addEventListener('mousedown', handleOutsideClick);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isPfBtn]);


    return (
        <>

            <div id="pathfinding" ref={pathfindingRef}>
                {isPfBtn && 
                    <button 
                        className={`${styles.pfBtn} ${buttonHidden ? styles.hidden : ''}`} 
                        onClick={() => handleButtonClick('Open')}
                    >
                        <p>CvSU-TDF</p>
                        <h1>Search for your path</h1>
                    </button>
                }
                
                <div className={`${styles.pfCont} ${isPathfindingActive ? styles.active : ''}`}>
                    {/* contents */}
                    <div className={styles.tooltipWrapper}>
                        <button className={styles.logo} onClick={() => handleButtonClick('Close')}>
                            <p>INTERACTIVE MAP</p>
                            <h1>CvSU-TDF</h1>
                        </button>

                        <small 
                            className={styles.toolTipText} 
                            style={{ visibility: showTooltip ? 'visible' : 'hidden', opacity: showTooltip ? 1 : 0 }}
                        >
                            Click to close path search.
                        </small>
                    </div>
                    <button className={styles.current}
                        data-id='Current'
                        onClick={()=> toggleModal('Current')}
                    >
                        <span>{cname}</span>
                        <div className={styles.arrow}>
                            <img src={arrow} alt="arrow" />
                        </div>
                    </button>
                    <button className={styles.destination}
                        data-id='Destination'
                        onClick={()=> toggleModal('Destination')}
                    >
                        <span>{dname}</span>
                        <div className={styles.arrow}>
                            <img src={arrow} alt="arrow" />
                        </div>
                    </button>
                    <button 
                        className={styles.enter}
                        onClick={() => handleButtonClick('Enter')}
                    >
                        Enter
                    </button>
                </div>
            </div>
        </>
    )
}

export default Pick