const puppeteer = require('puppeteer-extra');

// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// puppeteer.use(StealthPlugin());
const proxy_data = require('./proxy.json');
const proxy_rotation = require('./proxyRotation');
const proxyChain = require('proxy-chain');
const delay = require('../helper/delay');

const startBrowser = async (headless = 'new', proxy) => {
  let browser;
  try {
    console.log(`Opening the browser on ${proxy}......`);
    const [host, port] = proxy.split(':');
    const originalUrl = `http://EbRCJFtt:MbsZ2tmF@${host}:${port}`;
    const newUrl = await proxyChain.anonymizeProxy(originalUrl);
    await delay(1000);

    browser = await puppeteer.launch({
      headless: headless,
      defaultViewport: null,
      args: [
        '--disable-setuid-sandbox',
        '--window-size=800,600',
        `--proxy-server=${newUrl}`,
      ],
      ignoreHTTPSErrors: true,
    });
  } catch (err) {
    console.log('Could not create a browser instance => : ', err);
  }
  return browser;
};

module.exports = {
  startBrowser,
};
