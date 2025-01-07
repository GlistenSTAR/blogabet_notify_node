let isActive = false;
let intervalId = '';

chrome.commands.onCommand.addListener(async (command) => {
  let tab;
  await chrome.tabs.query(
    { active: true, currentWindow: true },
    async (tabs) => {
      tab = tabs[0];
      if (command === '_execute_action') {
        isActive = !isActive;
        if (isActive) {
          chrome.action.setBadgeText({ tabId: tab.id, text: 'O' });
          await getNewEmail(tab.id);
        } else {
          try {
            chrome.action.setBadgeText({ tabId: tab.id, text: '' });
            clearInterval(intervalId);
          } catch (err) {
            console.log(err);
          }
        }
      }
    }
  );
});

chrome.action.onClicked.addListener(async (tab) => {
  isActive = !isActive;
  if (isActive) {
    chrome.action.setBadgeText({ tabId: tab.id, text: 'O' });
    await getNewEmail(tab.id);
  } else {
    try {
      chrome.action.setBadgeText({ tabId: tab.id, text: '' });
      clearInterval(intervalId);
    } catch (err) {
      console.log(err);
    }
  }
});

const getNewEmail = async (tabId) => {
  await chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: (intervalId) => {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const delay = (milliseconds) => {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
      }

      let old_url = '',
        url,
        base_xpath,
        title,
        new_date,
        old_date,
        caption;

      const extractUrl = async () => {
        const emailElements = document.querySelectorAll('.zA');

        const email = emailElements[0];
        const fieldTd = email.querySelector('td:nth-child(5) span');
        const captionTd = email.querySelector('td:nth-child(6) .y6 span');
        new_date = email.querySelector('td:nth-child(9) span').innerText.trim();
        console.log(new_date)
        if (new_date != old_date) {

          if (fieldTd && (fieldTd.innerText.includes('Blogabet') || fieldTd.innerText.includes('Glisten STAR')) && captionTd) {
            email.click();
            await delay(1000);

            try {
              const emailLinkButton = Array.from(
                document.querySelectorAll('a')
              ).find((el) => el.textContent.includes('View pick'));

              var url = '';
              if (emailLinkButton) {
                url = emailLinkButton.getAttribute('href');
              } else {
                console.log('No element containing the keyword was found.');
              }
            } catch (error) {
              console.error('Failed to extract email content:', error);
            }

            const backButton = document.querySelector(
              "[aria-label='Back to Inbox']"
            );
            if (backButton) backButton.click();
          }


          try {
            url = url.match(urlRegex)[0];
          } catch (err) { }

          title = fieldTd.innerText;
          caption = captionTd.innerText;

          console.log(new_date, url, title, caption);

          try {
            if (title == 'Blogabet' || title == 'Ferhat Ücöz' || title == 'Glisten STAR') {
              if (url != old_url) {
                old_date = new_date
                old_url = url;

                console.log(url);
                chrome.storage.sync.get(['proxy'], (items) => {
                  console.log({
                    url: url,
                    caption: caption,
                    proxy: items.proxy,
                  });
                  fetch('http://127.0.0.1:5000/api/blogabet', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      url: url,
                      caption: caption,
                      proxy: items.proxy,
                    }),
                  })
                    .then((response) => response.json())
                    .then((data) => {
                      console.log('send api', data);
                    })
                    .catch((error) => {
                      console.error('Error making Fetch POST request:', error);
                    });
                });
              }
            }
          } catch (err) {
            console.log(err);
          }
        };
      }

      intervalId = setInterval(extractUrl, 1000);
    },
    args: [intervalId],
  });
};
