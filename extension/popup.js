// popup.js
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'newEmail') {
      document.getElementById('sender').textContent = 'From: ' + message.sender;
      document.getElementById('content').textContent = 'Content: ' + message.content;
    }
  });
  