// app/routes/app.help-center.tsx

import { LoaderFunctionArgs } from "react-router";
import styles from "../css/helpCenter.module.css"
import { useState } from "react";


export async function loader({ request }: LoaderFunctionArgs) {
  return {}; // hoặc return {}
}

export default function HelpCenter() {
  const [index, setIndex] = useState<number | null>(null)
  return (
    <s-page heading="Dynamic Store Locator"> 
      <h2 >Help Center</h2>
      <div className={styles.boxWrapper}>
        <div className={styles.boxLeft}>
          <h2>Frequently Asked Questions</h2>
          <div className={`${styles.toggle1} ${ index === 0 && styles.open}` } onClick={() => setIndex(index === 0 ? null : 0)}>          
              <p className={styles.titleContent}>How do i get a Googgle Maps a API key?</p>
              <p className={styles.content}>  step-by-step intruction guide You will need to set up a Google Cloud Console account t set up an order APi key. Please follow our step-by-step intruction guideYou will need to set up a Google Cloud Console account t set up an order APi key. Please follow our step-by-step intruction guideYou will need to set up a Google Cloud Console account t set up an order APi key. Please follow our step-by-step intruction guideYou will need to set up a Google Cloud Console account t set up an order APi key. Please follow our step-by-step intruction guideYou will need to set up a Google Cloud Console account t set up an order APi key. Please follow our step-by-step intruction guideYou will need to set up a Google Cloud Console account t set up an order APi key. Please follow our step-by-step intruction guideYou will need to set up a Google Cloud Console account t set up an order APi key. Please follow our step-by-step intruction guideYou will need to set up a Google Cloud Console account t set up an order APi key. Please follow our step-by-step intruction guideYou will need to set up a Google Cloud Console account t set up an order APi key. Please follow our step-by-step intruction guide<a href="https://www.h1-apps.com/articles/how-to-setup-a-google-maps-api-key">HERE</a>.</p>
          </div>
          <div className={`${styles.toggle1} ${ index === 1 && styles.open}` } onClick={() => setIndex(index === 1 ?null : 1)}>          
              <p className={styles.titleContent}>How do i get a Googgle Maps a API key?</p>
              <p className={styles.content}> You will need to set up a Google Cloud Console account t set up an order APi key. Please follow our step-by-step intruction guide.You will need to set up a Google Cloud Console account t set up an order APi key. Please follow our step-by-step intruction guideYou will need to set up a Google Cloud Console account t set up an order APi key. Please follow our step-by-step intruction guideYou will need to set up a Google Cloud Console account t set up an order APi key. Please follow our step-by-step intruction guide <a href="https://www.h1-apps.com/articles/how-to-setup-a-google-maps-api-key">HERE</a>.</p>
          </div>
          <div className={`${styles.toggle1} ${ index === 2 && styles.open}` } onClick={() => setIndex(index === 2 ? null : 2)}>          
              <p className={styles.titleContent}>How do i get a Googgle Maps a API key?</p>
              <p className={styles.content}> You will need to set up a Google Cloud Console account t set up an order APi key. Please follow our step-by-step intruction guide <a href="https://www.h1-apps.com/articles/how-to-setup-a-google-maps-api-key">HERE</a>.</p>
          </div>
          <div className={`${styles.toggle1} ${ index === 3 && styles.open}` } onClick={() => setIndex(index === 3 ? null : 3)}>          
              <p className={styles.titleContent}>How do i get a Googgle Maps a API key?</p>
              <p className={styles.content}> You will need to set up a Google Cloud Console account t set up an order APi key. Please follow our step-by-step intruction guide <a href="https://www.h1-apps.com/articles/how-to-setup-a-google-maps-api-key">HERE</a>.</p>
          </div>
          <div className={`${styles.toggle1} ${ index === 4 && styles.open}` } onClick={() => setIndex(index === 4 ? null : 4)}>          
              <p className={styles.titleContent}>How do i get a Googgle Maps a API key?</p>
              <p className={styles.content}> You will need to set up a Google Cloud Console account t set up an order APi key. Please follow our step-by-step intruction guide <a href="https://www.h1-apps.com/articles/how-to-setup-a-google-maps-api-key">HERE</a>.</p>
          </div>
        </div>
        <div className={styles.boxRight}>
          <div className={styles.helpChat}>
            <div>
              <s-icon type="chat"/>
            </div>
            <div>
              <h2 className={styles.titleBox}>Chat with us</h2>
              <p>Submit your request using our support widget and someone will be in touch shortly!</p>
              <s-button icon="chat">
                Open chat
              </s-button>
            </div>
          </div>
          <div className={styles.helpEmail}>
            <div>
              <s-icon type="email"/>
            </div>
            <div>
              <h2 className={styles.titleBox}>Email us</h2>
              <p>Click the button below to send us an email with your issue or question.</p>
              <s-button icon="email">
                Email us
              </s-button>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.footer}>
        <p>
          ©2025
          <a href="https://www.h1-apps.com/">H1 Web Development.  </a>
          All Rights Reserved.
        </p>
      </div>
      {/* <div className={styles.message} onClick={() => setIcon(icon === false ? true : false)}>    
        <div>
          skjdfnkwjf
        </div>
        {icon ? <i className="fa-regular fa-message"></i> : <i className="fa-solid fa-chevron-down"></i>}            
      </div> */}
    </s-page>
  );
}
