// Overlay script for UX Audit Lite V2
// Highlights problematic elements and shows tooltips on hover
// This script is designed to be injected into a webpage and provides a global API

// Global variable to store the overlay state and highlighted elements
window.uxAuditOverlay = {
    enabled: false,
    highlightedElements: new Map(), // Maps element to {type, description, severity}
    styleElement: null,
    tooltipElement: null,

    // Initialize the overlay
    init() {
        this.createStyleElement();
        this.createTooltipElement();
    },

    // Create a style element for overlay styles
    createStyleElement() {
        this.styleElement = document.createElement('style');
        this.styleElement.textContent = `
            .ux-audit-highlight {
                outline: 2px solid #e74c3c !important;
                outline-offset: -2px !important;
                position: relative !important;
                z-index: 9999 !important;
            }
            .ux-audit-tooltip {
                position: absolute !important;
                background: rgba(0, 0, 0, 0.8) !important;
                color: white !important;
                padding: 4px 8px !important;
                border-radius: 3px !important;
                font-size: 12px !important;
                z-index: 10000 !important;
                pointer-events: none !important;
                max-width: 200px !important;
                line-height: 1.4 !important;
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                top: 100% !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                margin-top: 4px !important;
                opacity: 0 !important;
                transition: opacity 0.2s !important;
            }
            .ux-audit-tooltip.visible {
                opacity: 0.9 !important;
            }
        `;
        document.head.appendChild(this.styleElement);
    },

    // Create the tooltip element
    createTooltipElement() {
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'ux-audit-tooltip';
        document.body.appendChild(this.tooltipElement);
    },

    // Highlight an element with issue data
    highlightElement(element, issueData) {
        if (!element || !(element instanceof Element)) return;

        // Store issue data with element
        this.highlightedElements.set(element, issueData);

        // Add highlight class
        element.classList.add('ux-audit-highlight');

        // Add event listeners for tooltip
        element.addEventListener('mouseenter', this.showTooltip.bind(this, element));
        element.addEventListener('mouseleave', this.hideTooltip.bind(this));
        element.addEventListener('touchstart', this.showTooltip.bind(this, element));
        element.addEventListener('touchend', this.hideTooltip.bind(this));
    },

    // Show tooltip for an element
    showTooltip(element) {
        const issueData = this.highlightedElements.get(element);
        if (!issueData) return;

        this.tooltipElement.textContent = `${issueData.severity.toUpperCase()}: ${issueData.description}`;
        this.tooltipElement.classList.add('visible');

        // Position tooltip
        const rect = element.getBoundingClientRect();
        this.tooltipElement.style.left = `${rect.left + rect.width / 2}px`;
        this.tooltipElement.style.top = `${rect.bottom + window.scrollY}px`;
    },

    // Hide tooltip
    hideTooltip() {
        this.tooltipElement.classList.remove('visible');
    },

    // Remove highlight from an element
    unhighlightElement(element) {
        if (!element || !(element instanceof Element)) return;

        this.highlightedElements.delete(element);
        element.classList.remove('ux-audit-highlight');
        element.removeEventListener('mouseenter', this.showTooltip);
        element.removeEventListener('mouseleave', this.hideTooltip);
        element.removeEventListener('touchstart', this.showTooltip);
        element.removeEventListener('touchend', this.hideTooltip);
    },

    // Clear all highlights
    clearAll() {
        this.highlightedElements.forEach((_, element) => {
            this.unhighlightElement(element);
        });
        this.highlightedElements.clear();
    },

    // Enable the overlay
    enable() {
        if (this.enabled) return;
        this.enabled = true;
        this.init();
    },

    // Disable the overlay
    disable() {
        if (!this.enabled) return;
        this.enabled = false;
        this.clearAll();
        if (this.styleElement) {
            this.styleElement.remove();
            this.styleElement = null;
        }
        if (this.tooltipElement) {
            this.tooltipElement.remove();
            this.tooltipElement = null;
        }
    },

    // Toggle the overlay
    toggle() {
        if (this.enabled) {
            this.disable();
        } else {
            this.enable();
        }
        return this.enabled;
    },

    // Highlight a list of issues
    highlightIssues(issues) {
        if (!this.enabled) this.enable();
        this.clearAll();
        issues.forEach(issue => {
            const element = document.querySelector(issue.element);
            if (element) {
                this.highlightElement(element, {
                    type: issue.type,
                    description: issue.description,
                    severity: issue.severity
                });
            }
        });
    }
};

// Initialize if enabled from storage (for persistence across page reloads)
if (sessionStorage.getItem('uxAuditOverlayEnabled') === 'true') {
    window.uxAuditOverlay.enable();
}

// Expose a way for the content script to communicate via events
// We'll listen for custom events on the window
window.addEventListener('uxAuditOverlayCommand', (event) => {
    const {action, data} = event.detail;
    switch (action) {
        case 'toggle':
            window.uxAuditOverlay.toggle();
            break;
        case 'enable':
            window.uxAuditOverlay.enable();
            break;
        case 'disable':
            window.uxAuditOverlay.disable();
            break;
        case 'highlight':
            window.uxAuditOverlay.highlightIssues(data.issues);
            break;
        case 'clear':
            window.uxAuditOverlay.clearAll();
            break;
    }
});