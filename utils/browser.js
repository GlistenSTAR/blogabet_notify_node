const puppeteer = require("puppeteer-extra");

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const startBrowser = async (headless = "new") => {
  let browser;
  try {
    console.log("Opening the browser......");
    browser = await puppeteer.launch({
      headless: headless,
      defaultViewport: null,
      args: [
        "--disable-setuid-sandbox",
        "--window-size=800,600",
      ],
      ignoreHTTPSErrors: true,
    });
  } catch (err) {
    console.log("Could not create a browser instance => : ", err);
  }
  return browser;
};

module.exports = {
  startBrowser,
};