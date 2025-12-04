// app/routes/app.help-center.tsx

import { LoaderFunctionArgs } from "react-router";
import styles from "../css/helpCenter.module.css"
import { useState } from "react";
import { openSupportEmail } from "app/utils/emailHelper";


export async function loader({ request }: LoaderFunctionArgs) {
  return {}; // hoặc return {}
}

export default function HelpCenter() {
  const [index, setIndex] = useState<number | null>(null)
  return (
    <s-page heading="Dynamic Store Locator"> 
      <h2>Help Center</h2>
      <div className={styles.boxWrapper}>
        <div className={styles.boxLeft}>
          <h2>Frequently Asked Questions</h2>
          <div className={`${styles.toggle1} ${ index === 0 && styles.open}` } onClick={() => setIndex(index === 0 ? null : 0)}>          
              <p className={styles.titleContent}>How do i get a Googgle Maps a API key?</p>
              <p className={styles.content}>You’ll need to set up a Google Cloud Console account in order to set up an API key. Please follow our step-by-step instruction guide<s-link href="https://www.h1-apps.com/articles/how-to-setup-a-google-maps-api-key">HERE</s-link>.</p>
          </div>
          <div className={`${styles.toggle1} ${ index === 1 && styles.open}` } onClick={() => setIndex(index === 1 ?null : 1)}>          
              <p className={styles.titleContent}>My Google Maps API Key isn’t working - how do I fix it?</p>
              <p className={styles.content}> The most common reason your API key isn't working is due to billing not being enabled. To enable billing on your project, log into your Google Cloud Console account and go to ‘Billing Account Management’. Follow the prompts from there to activate billing or add a card on file. For more detailed steps or other troubleshooting methods, please refer to our article <s-link href="https://www.h1-apps.com/articles/troubleshoot-common-problems-with-google-maps-api-keys">HERE</s-link>Additionally, please feel free to reach out to our support team by chatting or emailing us using the prompts to the right on this screen</p>
          </div>
          <div className={`${styles.toggle1} ${ index === 2 && styles.open}` } onClick={() => setIndex(index === 2 ? null : 2)}>          
              <p className={styles.titleContent}>How does the Faire Integration work?</p>
              <p className={styles.content}> You can only integrate Faire if you have a <b>brand</b> account. Regular retailer purchasing accounts will not integrate with the app correctly. Once you connect your account in the Integrations section of the app, the sync will automatically start. Depending on how many retailers you have in Faire, it can take some time to fully sync. During the initial sync, the last 6 months worth of customers/orders will be automatically synced. You can update this date range and re-sync if you’d like a different date range. Only Faire retailers that have a publicly available brick-and-mortar address on Google will be pulled into your Dynamic Store Locator account. If our software is not able to identify a brick-and-mortar address on Google for the retailer in question, they will not be added to your locations list. The reason for this is that we pull over the shipping address from Faire and we want to ensure we are not pulling retailer home addresses, fulfillment centers, etc. You can also set the app to automatically sync your Faire locations every 24 hours. Only new retailers will be added during automatic syncs.</p>
          </div>
          <div className={`${styles.toggle1} ${ index === 3 && styles.open}` } onClick={() => setIndex(index === 3 ? null : 3)}>          
              <p className={styles.titleContent}>How does the Shopify B2B integration work?</p>
              <p className={styles.content}> We offer two options when it comes to integration with Shopify B2B. We understand that some companies operate B2B sales on the same store as their B2C sales, and others operate from two separate stores, or an expansion account within their Shopify Plus account. If your B2B customers are in the same store where you want your store locator map to show, select that option on the Shopify B2B section in the integrations tab. If your B2B customers are in another store, you will need to go into that Shopify account and load the Dynamic Store Locator app there. You can keep the app on the FREE plan on that store. Then, navigate to the Shopify B2B section in the integrations tab and underneath the blue header, you’ll need to click to display your unique API key, then copy it. Navigate back to the original store where you want your store locator to display and in the Shopify B2B section in the integrations tab, select the second checkbox that says “My B2B customers are in another Shopify account” and input your ‘myshopify.com’ URL and API key there. That will pull over your customers from the other Shopify account. During the initial sync, the last 30 days worth of customers/orders will be automatically synced. You can update this date range and re-sync if you’d like a different date range. Shopify only allows up to 90 days of orders to be accessed through their API so that will be the max amount of time you can sync. Only Shopify B2B retailers that have a publicly available brick-and-mortar address on Google will be pulled into your Dynamic Store Locator account. If our software is not able to identify a brick-and-mortar address on Google for the retailer in question, they will not be added to your locations list. The reason for this is that we pull over the shipping address from Shopify B2B and we want to ensure we are not pulling retailer home addresses, fulfillment centers, etc. </p>
          </div>
          <div className={`${styles.toggle1} ${ index === 4 && styles.open}` } onClick={() => setIndex(index === 4 ? null : 4)}>          
              <p className={styles.titleContent}>Can I edit the major retailer locations?</p>
              <p className={styles.content}> Yes, you can control the major retailer locations that show at the state level. Once a major retailer is toggled "on", you can edit the locations to show only in specific states. You can also tag locations and add a custom message, but that will apply to all locations that display on your map for that retailer. Major retailer location information such as address, phone number or URL cannot be edited.</p>
          </div>
          <div className={`${styles.toggle1} ${ index === 5 && styles.open}` } onClick={() => setIndex(index === 5 ? null : 5)}>          
              <p className={styles.titleContent}>How can I get an export of all my locations?</p>
              <p className={styles.content}> If you go to the All Locations tab, you can click the Export button to export all Faire, Shopify B2B and manual locations from your map. Major retailer locations cannot be exported.</p>
          </div>
          <div className={`${styles.toggle1} ${ index === 6 && styles.open}` } onClick={() => setIndex(index === 6 ? null : 6)}>          
              <p className={styles.titleContent}>When I sync or upload locations, does it overwrite existing information?</p>
              <p className={styles.content}> No. When you resync your location database with Faire or Shopify B2B, only new retailer listings will be added to your database. Any updates you made to existing listings including updating information, hiding retailers, etc. will remain intact. Again, keep in mind that only retailers that have a publicly available brick-and-mortar address on Google will be pulled into your Dynamic Store Locator account. If our software is not able to identify a brick-and-mortar address on Google for the retailer in question, they will not be added to your locations list.</p>
          </div>
          <div className={`${styles.toggle1} ${ index === 7 && styles.open}` } onClick={() => setIndex(index === 7 ? null : 7)}>          
              <p className={styles.titleContent}>What if I don’t want to sync all my customers and only want specific locations?</p>
              <p className={styles.content}> If our software is not able to identify a brick-and-mortar address on Google for the retailer in question, they will not be added to your locations list. You can also choose to only sync Faire or Shopify B2B customers who have ordered within a specific time range. Additionally, you can manually hide locations from your map in the ‘All Locations’ list. However, if you initiate a re-sync, those settings will be lost. You cannot select specific national retailer locations at this time. If a retailer is toggled on, all locations for that retailer will be synced.</p>
          </div>
          <div className={`${styles.toggle1} ${ index === 8 && styles.open}` } onClick={() => setIndex(index === 8 ? null : 8)}>          
              <p className={styles.titleContent}>How do I add tags to a location?</p>
              <p className={styles.content}> You can add tags in one of two ways. You can bulk tag locations on the ‘All Locations’ page by checking off the locations you wish to tag and then checking off the tags you wish to apply after clicking the ‘Add Tags’ button. Or, you can go into individual locations and add tags at the bottom of the location’s listing. You must first add new tags in the settings before they are accessible to tag locations. </p>
          </div>
          <div className={`${styles.toggle1} ${ index === 9 && styles.open}` } onClick={() => setIndex(index === 9 ? null : 9)}>          
              <p className={styles.titleContent}>How do I hide or display specific locations?</p>
              <p className={styles.content}> You can control a location’s visibility in one of two ways. You can bulk edit locations on the ‘All Locations’ page by checking off the locations you wish to edit and then clicking ‘Set as Visible’ or ‘Set as Hidden’. Or, you can go into individual locations and click the ‘Visible’ icon next to the Location Editor header to change it to hidden, and vice versa.</p>
          </div>
          <div className={`${styles.toggle1} ${ index === 10 && styles.open}` } onClick={() => setIndex(index === 10 ? null : 10)}>          
              <p className={styles.titleContent}>How does the initial sync work?</p>
              <p className={styles.content}> The initial sync for Faire and Shopify B2B occur once the integration is enabled. For Shopify B2B, it will automatically sync customers who have ordered in the last 30-days. For Faire, it will automatically sync customers who have ordered in the last 6 months. You can update that time window in the integration settings and re-sync if you wish. Again, keep in mind that only retailers that have a publicly available brick-and-mortar address on Google will be pulled into your Dynamic Store Locator account. If our software is not able to identify a brick-and-mortar address on Google for the retailer in question, they will not be added to your locations list.</p>
          </div>
          <div className={`${styles.toggle1} ${ index === 11 && styles.open}` } onClick={() => setIndex(index === 11 ? null : 11)}>          
              <p className={styles.titleContent}>How often does the Auto-Sync run?</p>
              <p className={styles.content}> If you set the app to 'Sync Automatically' for Faire or Shopify B2B in the sync settings, the app will sync new retailers automatically every 24 hours. Existing listings will not be updated so any data you have updated in the app will stay intact. Listings are not deleted through the sync. Any old or archived listings will need to be manually deleted or hidden from the map.</p>
          </div>
          <div className={`${styles.toggle1} ${ index === 12 && styles.open}` } onClick={() => setIndex(index === 12 ? null : 12)}>          
              <p className={styles.titleContent}>I don’t see a national retailer I want to show on my map - will there be more?</p>
              <p className={styles.content}> Yes! We are actively adding new retailers. Please <s-link href="https://www.h1-apps.com/request-a-retailer">CLICK HERE</s-link> to submit a retailer that you’d like to see included and we’ll add it to our list.</p>
          </div>
           <div className={`${styles.toggle1} ${ index === 13 && styles.open}` } onClick={() => setIndex(index === 13 ? null : 13)}>          
              <p className={styles.titleContent}>Do you show international locations?</p>
              <p className={styles.content}> Any international locations manually added or added through the Shopify B2B or Faire sync will show on the map. At this time national retailer locations outside the United States will not show on the map.</p>
          </div>
        </div>
        <div className={styles.boxRight}>
          {/* <div className={styles.helpChat}>
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
          </div> */}
          <div className={styles.helpEmail}>
            <div>
              <s-icon type="email"/>
            </div>
            <div>
              <h2 className={styles.titleBox}>Email us</h2>
              <p>Click the button below to send us an email with your issue or question.</p>
              <s-button icon="email" onClick={openSupportEmail}>
                Email us
              </s-button>
            </div>
          </div>
        </div>
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
