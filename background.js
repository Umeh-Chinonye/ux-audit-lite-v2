console.log("[BACKGROUND] Service worker starting");

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[BACKGROUND] received message from popup:", request);
  if (request.action === "runAudit") {
    // We'll respond asynchronously
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error("[BACKGROUND] chrome.tabs.query error:", chrome.runtime.lastError);
        sendResponse({success: false, error: chrome.runtime.lastError.message});
        return;
      }
      if (!tabs[0]) {
        console.log("[BACKGROUND] no active tab");
        sendResponse({success: false, error: "No active tab found"});
        return;
      }
      const tab = tabs[0];
      if (
        !tab.url ||
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://")
      ) {
        console.log("[BACKGROUND] invalid tab URL:", tab.url);
        sendResponse({success: false, error: "Cannot audit this page"});
        return;
      }

      console.log("[BACKGROUND] forwarding request to content script in tab:", tab.id);
      // Forward the request to the content script in the active tab with retries
      sendMessageWithRetry(tab.id, {action: "runAudit"}, sendResponse, 3, 500);
    });
    // Return true to indicate we will respond asynchronously
    return true;
  }
  // For other messages, we don't handle them
  return false;
});

// Helper function to send a message to the content script with retries
function sendMessageWithRetry(tabId, message, sendResponse, maxRetries, retryDelay) {
  let attempt = 0;
  const attemptSend = () => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        attempt++;
        if (attempt < maxRetries) {
          console.log(`[BACKGROUND] Attempt ${attempt} failed to send message to content script: ${chrome.runtime.lastError.message}. Retrying in ${retryDelay}ms...`);
          setTimeout(attemptSend, retryDelay);
          return;
        } else {
          console.error("[BACKGROUND] Failed to send message to content script after", maxRetries, "attempts:", chrome.runtime.lastError);
          sendResponse({success: false, error: chrome.runtime.lastError.message});
          return;
        }
      }
      console.log("[BACKGROUND] received response from content script:", response);
      // Forward the response back to the popup
      sendResponse(response);
    });
  };
  attemptSend();
}

// Optional: Handle installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("UX Audit Lite V2 installed");
});