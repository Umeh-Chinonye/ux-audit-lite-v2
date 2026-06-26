console.log("[UXAUDIT] contentScript loading");

// Only run if we are in a proper extension context (content scripts have access to // chrome.runtime.
// In particular, content scripts do NOT have access to chrome.runtime unless the extension
// has given them access via the "externally_connectable" flag or they are part of the extension.
// However, content scripts injected via content_scripts DO have access to chrome.runtime.
// We'll check for chrome.runtime to be safe.
if (!window.chrome || !window.chrome.runtime) {
  console.warn("[UXAUDIT] Content script running in non-extension context. Aborting initialization.");
  // Avoid setting up listeners that would fail.
} else {
  // Check if we have already set up the listener to avoid duplicates on reload
  if (window.UXAuditContentScriptListenerSetUp) {
    console.log("[UXAUDIT] Content script listener already set up. Skipping.");
  } else {
    (() => {
      try {
        // Ensure UXAudit is defined
        if (!window.UXAudit || !window.UXAudit.Core) {
          // Actually, we want to check for UXAudit.Core
          // Let's fix the condition: if (!window.UXAudit || !window.UXAudit.Core)
          if (!window.UXAudit || !window.UXAudit.Core) {
            console.error("[UXAUDIT] UXAudit or UXAudit.Core not defined. Check that dependencies loaded.");
            // Still set up the listener so we can report errors
            window.UXAudit = window.UXAudit || {};
            window.UXAudit.Core = window.UXAudit.Core || {};
          }

          chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log("[UXAUDIT] contentScript received message:", request);
            if (request.action !== "runAudit") {
              console.log("[UXAUDIT] Not runAudit action, ignoring");
              return false;
            }

            try {
              console.log("[UXAUDIT] Starting audit...");
              // Ensure the audit engine exists
              if (!window.UXAudit.Core.AuditEngine) {
                throw new Error("AuditEngine not available");
              }
              const auditResult = window.UXAudit.Core.AuditEngine.runAudit();
              console.log("[UXAUDIT] Audit completed, sending response");

              sendResponse({
                success: true,
                report: auditResult
              });

            } catch (e) {
              console.error("[UXAUDIT] Audit error:", e);
              sendResponse({
                success: false,
                error: e.message || String(e)
              });
            }

            return true;
          });

          console.log("[UXAUDIT] Content script ready");
          // Mark that we have set up the listener
          window.UXAuditContentScriptListenerSetUp = true;
        } catch (e) {
          console.error("[UXAUDIT] Failed to initialize content script:", e);
        }
      })();
    }
  }