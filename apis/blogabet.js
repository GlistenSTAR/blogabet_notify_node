const express = require("express");
const router = express.Router();
const dotenv = require('dotenv');
const axios = require('axios');
const Captcha = require("2captcha")
const FormData = require('form-data');

const browserObject = require("./../utils/browser");
const delay = require("./../helper/delay");

const urlPattern = /^(ftp|http|https):\/\/[^ "]+$/;
const isValidURL = (url) => {
  return urlPattern.test(url);
}

dotenv.config();

// anticaptcha
// const ac = require("@antiadmin/anticaptchaofficial");
// ac.setAPIKey(process.env.anticaptchaKey);

// capmonster
// const { RecaptchaV2Task } = require("node-capmonster");


router.get('/', (req, res) => { res.json("test") })

router.post("/", async (req, res) => {
  let browser, page;
  browser = await browserObject.startBrowser("new");
  page = await browser.pages();
  page = page[0];
  await page.setDefaultNavigationTimeout(0);
  try {
    let url = req.body.url
    if (!url || !isValidURL(url)) {
      console.log("input url not specified");
      await startAction();
      return 0
    }

    const startTime = performance.now();
    await page.goto(url);
    await delay(200)

    let sitekey = process.env.siteKey
    let apiToken = process.env.telegramToken;
    let chatId = process.env.telegramChatId

    try {
      await page.waitForSelector('div.g-recaptcha', { timeout: 1000 })
      const solver = new Captcha.Solver(process.env.twocaptchaKey)
      console.log("solving captcha...")
      await solver.recaptcha(sitekey, url)
        .then(async (res) => {
          let token = res.data
          await page.evaluate(
            async (token) => {
              document.getElementById("g-recaptcha-response").innerHTML = token;
            },
            token
          );

          await delay(200)
          await page.evaluate((token) => {
            window.findRecaptchaClients = function () {
              if (typeof (___grecaptcha_cfg) !== 'undefined') {
                return Object.entries(___grecaptcha_cfg.clients).map(([cid, client]) => {
                  const data = { id: cid, version: cid >= 10000 ? 'V3' : 'V2' };
                  const objects = Object.entries(client).filter(([_, value]) => value && typeof value === 'object');

                  objects.forEach(([toplevelKey, toplevel]) => {
                    const found = Object.entries(toplevel).find(([_, value]) => (
                      value && typeof value === 'object' && 'sitekey' in value && 'size' in value
                    ));

                    if (typeof toplevel === 'object' && toplevel instanceof HTMLElement && toplevel['tagName'] === 'DIV') {
                      data.pageurl = toplevel.baseURI;
                    }

                    if (found) {
                      const [sublevelKey, sublevel] = found;

                      data.sitekey = sublevel.sitekey;
                      const callbackKey = data.version === 'V2' ? 'callback' : 'promise-callback';
                      const callback = sublevel[callbackKey];
                      data.topKey = toplevelKey;
                      data.subKey = sublevelKey;
                      if (!callback) {
                        data.callback = null;
                        data.function = null;
                      } else {
                        data.function = callback;
                        const keys = [cid, toplevelKey, sublevelKey, callbackKey].map((key) => `['${key}']`).join('');
                        data.callback = `___grecaptcha_cfg.clients${keys}`;
                      }
                    }
                  });
                  return data;
                });
              }
              return [];
            }

            window.callbackRes = findRecaptchaClients();
            let rTopKey = window.callbackRes[0].topKey
            let rSubKey = window.callbackRes[0].subKey
            window.___grecaptcha_cfg.clients[0][rTopKey][rSubKey]['callback'](token)

          }, token)
        })
        .catch((err) => {
          console.error(err.message)
        })

      // // solve the captcha using anti-captcha
      // let token = await ac.solveRecaptchaV2Proxyless(url, sitekey);
      // if (!token) {
      //   console.log('something went wrong');
      //   return;
      // }

      // solve the captcha using capmonster
      // const client = new RecaptchaV2Task(process.env.capmonsterKey)
      // const task = client.task({
      //   websiteKey: sitekey,
      //   websiteURL: url,
      // })

      // const taskId = await client.createWithTask(task)
      // const result = await client.joinTaskResult(taskId)

      // await page.evaluate(
      //   async (token) => {
      //     document.getElementById("g-recaptcha-response").innerHTML = token;
      //   },
      //   token
      // );

      // await delay(200)
      // await page.evaluate((token) => {
      //   window.findRecaptchaClients = function () {
      //     if (typeof (___grecaptcha_cfg) !== 'undefined') {
      //       return Object.entries(___grecaptcha_cfg.clients).map(([cid, client]) => {
      //         const data = { id: cid, version: cid >= 10000 ? 'V3' : 'V2' };
      //         const objects = Object.entries(client).filter(([_, value]) => value && typeof value === 'object');

      //         objects.forEach(([toplevelKey, toplevel]) => {
      //           const found = Object.entries(toplevel).find(([_, value]) => (
      //             value && typeof value === 'object' && 'sitekey' in value && 'size' in value
      //           ));

      //           if (typeof toplevel === 'object' && toplevel instanceof HTMLElement && toplevel['tagName'] === 'DIV') {
      //             data.pageurl = toplevel.baseURI;
      //           }

      //           if (found) {
      //             const [sublevelKey, sublevel] = found;

      //             data.sitekey = sublevel.sitekey;
      //             const callbackKey = data.version === 'V2' ? 'callback' : 'promise-callback';
      //             const callback = sublevel[callbackKey];
      //             data.topKey = toplevelKey;
      //             data.subKey = sublevelKey;
      //             if (!callback) {
      //               data.callback = null;
      //               data.function = null;
      //             } else {
      //               data.function = callback;
      //               const keys = [cid, toplevelKey, sublevelKey, callbackKey].map((key) => `['${key}']`).join('');
      //               data.callback = `___grecaptcha_cfg.clients${keys}`;
      //             }
      //           }
      //         });
      //         return data;
      //       });
      //     }
      //     return [];
      //   }

      //   window.callbackRes = findRecaptchaClients();
      //   let rTopKey = window.callbackRes[0].topKey
      //   let rSubKey = window.callbackRes[0].subKey
      //   window.___grecaptcha_cfg.clients[0][rTopKey][rSubKey]['callback'](token)

      // }, token)

    } catch (err) { console.log("there is no captcha", err) }

    await delay(2000)
    await page.waitForSelector('div.feed-pick-title')
    let eventName = await page.title();
    eventName = eventName.split(" -")[0]
    let title = await page.$eval('div.feed-pick-title > div.no-padding > h3', h3 => h3.innerText)
    let content1 = '', content2 = '', content3 = '';

    try {
      content1 = await page.$eval('div.pick-line', div => div.innerText)
    } catch (err) { }
    try {
      content2 = await page.$eval('div.sport-line', div => div.innerText)
    } catch (err) {
      try {
        let trs = await page.$$('table.table.combo-table > tbody > tr')
        for (var i = 2; i < trs.length + 1; i++) {
          content2 += await page.$eval(`table.table.combo-table > tbody > tr:nth-child(${i})`, div => div.innerText.trim().replace(/\s{2,}/g, " "))
          content2 = content2 + "\n\n"
        }
      } catch (err) { }
    }
    try {
      content3 = await page.$eval('div.labels', div => div.innerText)
    } catch (err) { }

    // add screenshot for bet
    // const contentBoundingBox = await page.$eval('#feed-list', element => {
    //   const { x, y, width, height } = element.getBoundingClientRect();
    //   return { x, y, width, height };
    // });

    // const screenshot = await page.screenshot({
    //   clip: {
    //     x: contentBoundingBox.x,
    //     y: contentBoundingBox.y,
    //     width: contentBoundingBox.width,
    //     height: contentBoundingBox.height
    //   }
    // });

    // const formData = new FormData();
    // formData.append('chat_id', chatId);
    // formData.append('photo', screenshot, { filename: 'screenshot.png' });
    // formData.append('caption', `${title}\n${content1}\n\n${content2}\n\n${content3}`);

    // try {
    //   await axios.post(`https://api.telegram.org/bot${apiToken}/sendPhoto`, formData, {
    //     headers: formData.getHeaders(),
    //   }).then(() => {
    //     console.log('Image and text message sent via Telegram');
    //   });
    // } catch (err) {
    //   console.log(err)
    // }

    const endTime = performance.now();

    const runningTime = endTime - startTime;
    let json = {
      chat_id: chatId,
      parse_mode: 'html',
      text: `${eventName}\n\n${title}\n${content1}\n\n${content2}\n\n${content3}\n\n\ntime: ${runningTime/1000}s`
    }

    try {
      await axios.post(`https://api.telegram.org/bot${apiToken}/sendMessage`, json)
        .then(() => {
          console.log("Telelgram message sent!")
        })
    } catch (err) {
      console.log("Telegram message failed!")
      console.log(err)
    }
  } catch (err) { console.log("err>>>>>>", err) }

  res.json(1);
});

module.exports = router;
