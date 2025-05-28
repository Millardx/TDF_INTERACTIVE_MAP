import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import styles from "./StartingModal.module.scss";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import icons from './guideIcons/Icons'
const StartingModal = () => {

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showClose, setShowClose] = useState(false);
  const [hasShownClose, setHasShownClose] = useState(false);

  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    swipe: true, // Enable swipe gestures
    touchMove: true, // Allow touch gestures
    draggable: true, // Enable mouse dragging for desktop
    afterChange: (index) => {
      setCurrentSlide(index);

      if (index === 1 && !hasShownClose) {
        // Only show with delay the first time reaching slide 1
        setTimeout(() => {
          setShowClose(true);
          setHasShownClose(true); // Mark as shown permanently
        }, 500);
      } else if (hasShownClose) {
        // Already shown before, keep it visible
        setShowClose(true);
      } else {
        // Not yet reached slide 1, hide it
        setShowClose(false);
      }
    }
  };


  // Millard UPdate code Panelist Suggestions:
  //Old Code : 
  // const [isClose, setIsClose] = useState(false);
  // const handleClose = () =>{
  //   setIsClose(true);
  // }

  //new Code Millard Add: 
  const [isClose, setIsClose] = useState(true); // default to hidden

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('tdfHasSeenTutorial');
    if (!hasSeenTutorial) {
      setIsClose(false); // Show only if not seen
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('tdfHasSeenTutorial', 'true');
    setIsClose(true);
  };

  return (
    <>
    {!isClose &&(
        <div id="startingModal">
          <div className={styles.container}>

            <button onClick={handleClose} className={styles.close}>
              {showClose && (
                'Finish'
              )}
            </button>

            <Slider {...settings}>
              {/* First Slide: Instructions */}
              <div className={styles.content}>
                <div className={styles.textCont}>
                  <h1>TDF - Interactive Map</h1>
                  <hr />
                  <div className={styles.controls}>
                    <h2>Select:</h2>
                    <p>Left click or Touch.</p>
                  </div>
                  <div className={styles.controls}>
                    <h2>Zoom:</h2>
                    <p>Mouse Scroll or Pinch.</p>
                  </div>
                  <div className={styles.controls}>
                    <h2>Find path:</h2>
                      <p>Select Pathfinding Tab</p>
                      <div className={`${styles.guideImg} ${styles.horizontalIcon}`}><img src={icons.pathfinding} alt="pathfinding" /></div>
                  </div>
                  <div className={styles.controls}>
                    <h2>Find more infos:</h2>
                    <p>Select navigation menu</p>
                    <div className={styles.guideImg}><img src={icons.navigation} alt="navigation" /></div>
                  </div>
                </div>
              </div>

              {/* Second Slide: Feedback Reminder */}
              <div className={styles.content}>
                <div className={styles.textCont}>
                  <h1>Feedback Reminder</h1>
                  <hr />
                  <p className={styles.txtSubtitle}>
                    Your feedback is valuable! Please let us know your thoughts about
                    the TDF Interactive Map.
                  </p>
                  <div className={styles.feedbackGuide}>
                    <p>
                    Go to navigation menu
                    </p>
                   <div className={styles.guideImg}><img src={icons.navigation} alt="navigation" /></div> 
                   <p>and click on the feedback button</p>
                    <div className={`${styles.guideImg} ${styles.horizontalIcon}`}><img src={icons.feedback} alt="feedback" /></div>
                  </div>
                </div>
              </div>
            </Slider>
          </div>
        </div>
    )}
    </>
  );
};

export default StartingModal;
