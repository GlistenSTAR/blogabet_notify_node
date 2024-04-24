// content.js
const observer = new MutationObserver(mutationsList => {
    for (let mutation of mutationsList) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        const newEmailIndicator = document.querySelector('.new-email-indicator');
        if (newEmailIndicator) {
          chrome.runtime.sendMessage({ type: 'newEmail' });
          return; // Stop observing after detecting new email
        }
      }
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  