const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const axios = require('axios');
const FormData = require('form-data');
const puppeteer = require('puppeteer-core');

const Captcha = require('2captcha');

const browserObject = require('./../utils/browser');
const delay = require('./../helper/delay');

const urlPattern = /^(ftp|http|https):\/\/[^ "]+$/;
const isValidURL = (url) => {
  return urlPattern.test(url);
};

dotenv.config();

// anticaptcha
// const ac = require("@antiadmin/anticaptchaofficial");
// ac.setAPIKey(process.env.anticaptchaKey);

// capmonster
// const { RecaptchaV2Task } = require("node-capmonster");

router.get('/', (req, res) => {
  res.json('test');
});

router.post('/', async (req, res) => {
  let sitekey = process.env.siteKey;
  let apiToken = process.env.telegramToken;
  let chatId = process.env.telegramChatId;
  let capsoverApiKey = process.env.capsoverApiKey;
  let browser, page;
  let json = {
    chat_id: chatId,
    parse_mode: 'html',
    text: `${req.body.caption}`,
  };
  if (!req.body.caption.startsWith('FREE')) {
    if (
      req.body.caption.startsWith('New pick') ||
      req.body.caption.startsWith('LIVE pick') ||
      req.body.caption.startsWith('New Asian Odds pick') ||
      req.body.caption.startsWith('LIVE Asian Odds pick') ||
      req.body.caption.startsWith('New Combo pick')
    ) {
      try {
        await axios
          .post(`https://api.telegram.org/bot${apiToken}/sendMessage`, json)
          .then(() => {
            console.log('Telelgram message sent!');
          });
      } catch (err) {
        console.log('Telegram message failed!');
        console.log(err);
      }
    }
  }

  console.log(req.body.proxy);

  const ADSPower_API_BASE_URL = 'http://local.adspower.net:50325';
  // const ADSPower_PROFILE_ID = 'kkruhsc';

  try {
    axios
      .get(
        `${ADSPower_API_BASE_URL}/api/v1/browser/start?user_id=${req.body.proxy}`
      )
      .then(async (res) => {
        console.log(res.data);
        if (
          res.data.code === 0 &&
          res.data.data.ws &&
          res.data.data.ws.puppeteer
        ) {
          try {
            const browser = await puppeteer.connect({
              browserWSEndpoint: res.data.data.ws.puppeteer,
              defaultViewport: null,
            });
            page = await browser.newPage();
            await page.setDefaultNavigationTimeout(0);
            try {
              let url = req.body.url;
              console.log(url);
              if (!url || !isValidURL(url)) {
                console.log('input url not specified');
                await startAction();
                return 0;
              }

              const startTime = performance.now();
              await page.goto(url);
              await delay(200);

              try {
                const bot_content = await page.$eval(
                  'body > div.container > div.block > h4',
                  (h4) => h4.innerText
                );
                if (bot_content.startsWith('Anti-bot protection!')) {
                  try {
                    await page.waitForSelector('div.g-recaptcha', {
                      timeout: 1000,
                    });
                  } catch (err) {
                    console.log('reload the broswer.');
                    await page.reload(url);
                    await delay(3000);
                    await page.waitForSelector('div.g-recaptcha', {
                      timeout: 1000,
                    });
                  }
                } else {
                  throw new Error('No captcha!!!');
                }

                console.log('solving captcha...', sitekey, url);

                // solve the captcha using twocaptcha
                // const solver = new Captcha.Solver(process.env.twocaptchaKey)
                // let token;
                // await solver.recaptcha(sitekey, url)
                //   .then(async (res) => {
                //     token = res.data
                //     console.log(token)
                //     await page.evaluate(
                //       async (token) => {
                //         document.getElementById("g-recaptcha-response").innerHTML = token;
                //       },
                //       token
                //     );

                //     await delay(200)
                //     await page.evaluate((token) => {
                //       window.findRecaptchaClients = function () {
                //         if (typeof (___grecaptcha_cfg) !== 'undefined') {
                //           return Object.entries(___grecaptcha_cfg.clients).map(([cid, client]) => {
                //             const data = { id: cid, version: cid >= 10000 ? 'V3' : 'V2' };
                //             const objects = Object.entries(client).filter(([_, value]) => value && typeof value === 'object');

                //             objects.forEach(([toplevelKey, toplevel]) => {
                //               const found = Object.entries(toplevel).find(([_, value]) => (
                //                 value && typeof value === 'object' && 'sitekey' in value && 'size' in value
                //               ));

                //               if (typeof toplevel === 'object' && toplevel instanceof HTMLElement && toplevel['tagName'] === 'DIV') {
                //                 data.pageurl = toplevel.baseURI;
                //               }

                //               if (found) {
                //                 const [sublevelKey, sublevel] = found;

                //                 data.sitekey = sublevel.sitekey;
                //                 const callbackKey = data.version === 'V2' ? 'callback' : 'promise-callback';
                //                 const callback = sublevel[callbackKey];
                //                 data.topKey = toplevelKey;
                //                 data.subKey = sublevelKey;
                //                 if (!callback) {
                //                   data.callback = null;
                //                   data.function = null;
                //                 } else {
                //                   data.function = callback;
                //                   const keys = [cid, toplevelKey, sublevelKey, callbackKey].map((key) => `['${key}']`).join('');
                //                   data.callback = `___grecaptcha_cfg.clients${keys}`;
                //                 }
                //               }
                //             });
                //             return data;
                //           });
                //         }
                //         return [];
                //       }

                //       window.callbackRes = findRecaptchaClients();
                //       let rTopKey = window.callbackRes[0].topKey
                //       let rSubKey = window.callbackRes[0].subKey
                //       window.___grecaptcha_cfg.clients[0][rTopKey][rSubKey]['callback'](token)

                //     }, token)
                //   })
                //   .catch((err) => {
                //     console.error(err.message)
                //   })

                // solve captcah using capsolver
                async function createTask() {
                  try {
                    const response = await axios.post(
                      'https://api.capsolver.com/createTask',
                      {
                        clientKey: capsoverApiKey,
                        task: {
                          type: 'NoCaptchaTaskProxyless',
                          websiteURL: url,
                          websiteKey: sitekey,
                        },
                      }
                    );

                    if (response.data.errorId !== 0) {
                      throw new Error(
                        `Error: ${response.data.errorDescription}`
                      );
                    }

                    return response.data.taskId;
                  } catch (error) {
                    console.error(`Failed to create task: ${error.message}`);
                    process.exit(1);
                  }
                }

                async function getTaskResult(taskId) {
                  while (true) {
                    try {
                      const response = await axios.post(
                        'https://api.capsolver.com/getTaskResult',
                        {
                          clientKey: capsoverApiKey,
                          taskId: taskId,
                        }
                      );

                      if (response.data.errorId !== 0) {
                        throw new Error(
                          `Error: ${response.data.errorDescription}`
                        );
                      }

                      if (response.data.status === 'ready') {
                        return response.data.solution.gRecaptchaResponse;
                      }
                    } catch (error) {
                      console.error(
                        `Error getting task result: ${error.message}`
                      );
                    }

                    // Wait for 5 seconds before checking again
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                  }
                }

                const taskId = await createTask();
                console.log(`Task ID: ${taskId}`);

                const token = await getTaskResult(taskId);

                await page.evaluate(async (token) => {
                  document.getElementById('g-recaptcha-response').innerHTML =
                    token;
                }, token);

                await delay(200);
                await page.evaluate((token) => {
                  window.findRecaptchaClients = function () {
                    if (typeof ___grecaptcha_cfg !== 'undefined') {
                      return Object.entries(___grecaptcha_cfg.clients).map(
                        ([cid, client]) => {
                          const data = {
                            id: cid,
                            version: cid >= 10000 ? 'V3' : 'V2',
                          };
                          const objects = Object.entries(client).filter(
                            ([_, value]) => value && typeof value === 'object'
                          );

                          objects.forEach(([toplevelKey, toplevel]) => {
                            const found = Object.entries(toplevel).find(
                              ([_, value]) =>
                                value &&
                                typeof value === 'object' &&
                                'sitekey' in value &&
                                'size' in value
                            );

                            if (
                              typeof toplevel === 'object' &&
                              toplevel instanceof HTMLElement &&
                              toplevel['tagName'] === 'DIV'
                            ) {
                              data.pageurl = toplevel.baseURI;
                            }

                            if (found) {
                              const [sublevelKey, sublevel] = found;

                              data.sitekey = sublevel.sitekey;
                              const callbackKey =
                                data.version === 'V2'
                                  ? 'callback'
                                  : 'promise-callback';
                              const callback = sublevel[callbackKey];
                              data.topKey = toplevelKey;
                              data.subKey = sublevelKey;
                              if (!callback) {
                                data.callback = null;
                                data.function = null;
                              } else {
                                data.function = callback;
                                const keys = [
                                  cid,
                                  toplevelKey,
                                  sublevelKey,
                                  callbackKey,
                                ]
                                  .map((key) => `['${key}']`)
                                  .join('');
                                data.callback = `___grecaptcha_cfg.clients${keys}`;
                              }
                            }
                          });
                          return data;
                        }
                      );
                    }
                    return [];
                  };

                  window.callbackRes = findRecaptchaClients();
                  let rTopKey = window.callbackRes[0].topKey;
                  let rSubKey = window.callbackRes[0].subKey;
                  window.___grecaptcha_cfg.clients[0][rTopKey][rSubKey][
                    'callback'
                  ](token);
                }, token);

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
                // let token = result.gRecaptchaResponse;

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
              } catch (err) {
                console.log('there is no captcha', err);
              }

              await delay(2000);
              await page.waitForSelector('div.feed-pick-title');
              let eventName = await page.title();
              eventName = eventName.split(' -')[0];
              let title = await page.$eval(
                'div.feed-pick-title > div.no-padding > h3',
                (h3) => h3.innerText
              );
              let content1 = '',
                content2 = '',
                content3 = '';

              try {
                content1 = await page.$eval(
                  'div.pick-line',
                  (div) => div.innerText
                );
              } catch (err) {}
              try {
                content2 = await page.$eval(
                  'div.sport-line',
                  (div) => div.innerText
                );
                content2 = content2.split(':')[0].replace('/ Kick off', '');
                eventName = eventName + ' for' + content2;
              } catch (err) {
                try {
                  let trs = await page.$$(
                    'table.table.combo-table > tbody > tr'
                  );
                  for (var i = 2; i < trs.length + 1; i++) {
                    content2 += await page.$eval(
                      `table.table.combo-table > tbody > tr:nth-child(${i})`,
                      (div) => div.innerText.trim().replace(/\s{2,}/g, ' ')
                    );
                    content2 = content2 + '\n';
                  }
                } catch (err) {}
              }
              try {
                content3 = await page.$eval(
                  'div.labels',
                  (div) => div.innerText
                );
                content3 = content3.replace('LIVE Bet365 i', 'Bet365');
                content3 = content3.replace('Bet365 i', 'Bet365');
                content3 = content3.replace(' i', '');
                console.log(content3);
                content3 = content3.replace(' ', '\n');
              } catch (err) {}

              page.close();

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
              let json1 = {
                chat_id: chatId,
                parse_mode: 'html',
                text: `Solving captcha time: ${runningTime / 1000}s`,
              };

              try {
                await axios
                  .post(
                    `https://api.telegram.org/bot${apiToken}/sendMessage`,
                    json1
                  )
                  .then(() => {
                    console.log('Telelgram message sent!');
                  });
              } catch (err) {
                console.log('Telegram message failed!');
                console.log(err);
              }

              let json = {
                chat_id: chatId,
                parse_mode: 'html',
                text: `${eventName}\n${title}\n${content1}\n${content3}`,
              };

              try {
                await axios
                  .post(
                    `https://api.telegram.org/bot${apiToken}/sendMessage`,
                    json
                  )
                  .then(() => {
                    console.log('Telelgram message sent!');
                  });
              } catch (err) {
                console.log('Telegram message failed!');
                console.log(err);
              }
            } catch (err) {
              console.log('err>>>>>>', err);
              console.log('broswer is not working, check proxy server');
              broswer.close();
            }
          } catch (err) {
            console.log(err.message);
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (error) {
    console.error('Error launching Puppeteer:', error);
  }

  res.json(1);
});

module.exports = router;
