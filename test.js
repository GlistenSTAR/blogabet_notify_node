const puppeteer = require('puppeteer-core');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const delay = require('./helper/delay')

// AdsPower API credentials and profile ID
const ADSPower_API_BASE_URL = 'http://local.adspower.net:50325';
const ADSPower_PROFILE_ID = 'kkruhsc';

async function launchPuppeteerWithAdsPower() {
  try {
    axios.get(`${ADSPower_API_BASE_URL}/api/v1/browser/start?user_id=${ADSPower_PROFILE_ID}`).then(async (res) => {
        console.log(res.data);
        if(res.data.code === 0 && res.data.data.ws && res.data.data.ws.puppeteer) {
          try{
            const browser = await puppeteer.connect(
              {browserWSEndpoint: res.data.data.ws.puppeteer, defaultViewport:null});
              page = await browser.pages();
                page = page[0];
              await page.goto('https://www.adspower.io');


              await browser.close();
          } catch(err){
              console.log(err.message);
          }
        }
      }).catch((err) => {
          console.log(err)
      })

    
    await delay(3000000)
  } catch (error) {
    console.error('Error launching Puppeteer:', error);
  }
}

launchPuppeteerWithAdsPower();
