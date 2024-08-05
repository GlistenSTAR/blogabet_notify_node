document.getElementById('saveButton').addEventListener('click', () => {
  const proxy = document.getElementById('proxy').value;

  chrome.storage.sync.set({ proxy }, () => {
    alert('profile ID saved.');
  });
});

// Load options when the page is opened
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['proxy'], (items) => {
    document.getElementById('proxy').value = items.proxy || '';
  });
});
