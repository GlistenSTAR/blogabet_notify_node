// background.js
let lastEmail = '';

async function checkForNewEmails() {
  const latestEmail = "";

  if (latestEmail !== lastEmail) {
    
    chrome.action.setBadgeText({ text: 'New' });

    // Extract sender and email content
    const sender = doc.querySelector('.message-list-item-from').textContent.trim();
    const content = latestEmail;

    // Store last email for comparison
    lastEmail = latestEmail;

    // Send a message to the popup with sender and content
    chrome.runtime.sendMessage({ type: 'newEmail', sender, content });
  }
}

setInterval(checkForNewEmails, 1000);
