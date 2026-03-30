// Background service worker — coordinates controls toggle across all YouTube tabs

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleControls') {
    chrome.storage.local.get({ controlsVisible: true }, (data) => {
      const newState = !data.controlsVisible;

      chrome.storage.local.set({ controlsVisible: newState });

      chrome.tabs.query({ url: '*://www.youtube.com/*' }, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'setControlsVisibility',
            visible: newState
          }).catch(() => {});
        });
      });

      sendResponse({ success: true, visible: newState });
    });

    return true;
  } else if (message.action === 'getControlsState') {
    chrome.storage.local.get({ controlsVisible: true }, (data) => {
      sendResponse({ visible: data.controlsVisible });
    });

    return true;
  }
});
