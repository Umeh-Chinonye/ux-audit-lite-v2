console.log("[UXAUDIT] SignalCollector loading");

(() => {
  const UXAudit = window.UXAudit || {};

  function isVisible(el) {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0' &&
           el.offsetWidth > 0 &&
           el.offsetHeight > 0;
  }

  function getVisibleElements(selector) {
    return Array.from(document.querySelectorAll(selector)).filter(isVisible);
  }

  UXAudit.SignalCollector = {
    collect() {
      const signals = {};

      // Structural signals
      signals.headingCount = getVisibleElements('h1, h2, h3, h4, h5, h6').length;
      signals.h1Count = getVisibleElements('h1').length;
      signals.sectionCount = getVisibleElements('section, article, nav, aside').length;
      signals.layoutDepth = this.computeLayoutDepth();
      signals.landmarkCount = getVisibleElements('header, footer, main, nav, [role="banner"], [role="contentinfo"], [role="main"], [role="navigation"]').length;
      signals.contentSectionCount = getVisibleElements('article, section.post, .post').length;
      signals.codePreCount = getVisibleElements('pre, code').length;

      // Interaction signals
      signals.formFieldCount = getVisibleElements('input, textarea, select').length;
      signals.labeledFieldCount = this.countLabeledFields();
      signals.requiredFieldCount = getVisibleElements('input[required], textarea[required], select[required]').length;
      signals.clickHandlerCount = getVisibleElements('[onclick]').length;
      signals.focusableCount = this.countFocusable();
      signals.tabindexPresence = getVisibleElements('[tabindex]').length;
      signals.emailPasswordInputs = getVisibleElements('input[type="email"], input[type="password"]').length;
      signals.navHeaderCount = getVisibleElements('nav, header').length;
      // New interaction signals
      signals.interactionMissingName = this.countInteractionMissingName();
      signals.fauxClickableCount = this.countFauxClickable();

      // Accessibility signals
      signals.imageCount = getVisibleElements('img').length;
      signals.imageMissingAlt = getVisibleElements('img:not([alt]), img[alt=""]').length;
      signals.inputMissingLabel = signals.formFieldCount - signals.labeledFieldCount; // derived
      signals.languageDeclared = document.documentElement.lang ? 1 : 0;
      signals.ariaAttributeCount = document.querySelectorAll(
        '[aria-label], [aria-labelledby], [aria-describedby], [role], [aria-hidden], [aria-live], [aria-pressed], [aria-checked], [aria-selected], [aria-expanded], [aria-controls], [aria-details]'
      ).length;

      // Visual density signals
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const viewportArea = viewportWidth * viewportHeight;
      const visibleEls = getVisibleElements('*');
      signals.visibleElementCount = visibleEls.length;
      signals.ctaCount = getVisibleElements('a[href], button, input[type="button"], input[type="submit"]').length;
      signals.ctaDensity = viewportArea > 0 ? (signals.ctaCount / viewportArea) * 10000 : 0; // per 10000 px2
      signals.textNodeCount = this.countVisibleTextNodes();
      signals.textDensity = viewportArea > 0 ? (signals.textNodeCount / viewportArea) * 10000 : 0;
      signals.elementClustering = this.computeAverageElementDistance(visibleEls);
      signals.widgetOrCardCount = getVisibleElements('.widget, .card').length;
      signals.priceElementsCount = getVisibleElements('[class*="price"], [id*="price"]').length;
      signals.cartOrCheckoutCount = getVisibleElements('[class*="cart"], [id*="cart"], [class*="checkout"]').length;

      return signals;
    },

    isVisible(el) {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' &&
             style.visibility !== 'hidden' &&
             style.opacity !== '0' &&
             el.offsetWidth > 0 &&
             el.offsetHeight > 0;
    },

    computeLayoutDepth() {
      const sectioningEls = getVisibleElements('section, article, nav, aside, body');
      let maxDepth = 0;
      sectioningEls.forEach(el => {
        let depth = 0;
        let parent = el.parentElement;
        while (parent && parent !== document.body) {
          if (parent.matches('section, article, nav, aside')) depth++;
          parent = parent.parentElement;
        }
        if (depth > maxDepth) maxDepth = depth;
      });
      return maxDepth;
    },

    countLabeledFields() {
      const fields = getVisibleElements('input, textarea, select');
      let count = 0;
      fields.forEach(field => {
        const id = field.id;
        let labeled = false;
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) labeled = true;
        }
        if (!labeled) {
          if (field.getAttribute('aria-label')?.trim() !== '' ||
              field.getAttribute('aria-labelledby')?.trim() !== '') {
            labeled = true;
          }
        }
        if (!labeled) {
          if (field.closest('label')) labeled = true;
        }
        if (labeled) count++;
      });
      return count;
    },

    countFocusable() {
      const focusableSelectors = [
        'input', 'select', 'textarea', 'button', 'a[href]',
        '[tabindex]:not([tabindex="-1"])', '[contenteditable]'
      ];
      const set = new Set();
      focusableSelectors.forEach(sel => {
        getVisibleElements(sel).forEach(el => set.add(el));
      });
      return set.size;
    },

    countVisibleTextNodes() {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      let count = 0;
      let node;
      while (node = walker.nextNode()) {
        const parent = node.parentElement;
        if (parent && isVisible(parent)) {
          const text = node.nodeValue.trim();
          if (text.length > 0) count++;
        }
      }
      return count;
    },

    computeAverageElementDistance(elements) {
      if (elements.length < 2) return 0;
      const sample = elements.slice(0, Math.min(10, elements.length));
      let totalDist = 0;
      let pairs = 0;
      for (let i = 0; i < sample.length; i++) {
        const rect1 = sample[i].getBoundingClientRect();
        const cx1 = rect1.left + rect1.width / 2;
        const cy1 = rect1.top + rect1.height / 2;
        for (let j = i + 1; j < sample.length; j++) {
          const rect2 = sample[j].getBoundingClientRect();
          const cx2 = rect2.left + rect2.width / 2;
          const cy2 = rect2.top + rect2.height / 2;
          const dist = Math.sqrt(Math.pow(cx2 - cx1, 2) + Math.pow(cy2 - cy1, 2));
          totalDist += dist;
          pairs++;
        }
      }
      return pairs > 0 ? totalDist / pairs : 0;
    },

    // New interaction signal calculations
    countInteractionMissingName() {
      const interactives = getVisibleElements('button, a, input[type="button"], input[type="submit"], input[type="reset"]');
      let count = 0;
      interactives.forEach(el => {
        let hasName = false;
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledby = el.getAttribute('aria-labelledby');
        const innerText = el.textContent.trim();
        if (ariaLabel && ariaLabel.trim() !== '') hasName = true;
        if (ariaLabelledby && ariaLabelledby.trim() !== '') hasName = true;
        if (innerText.length > 0) hasName = true;
        if (el.tagName === 'INPUT') {
          const value = el.value.trim();
          const placeholder = el.getAttribute('placeholder')?.trim() || '';
          if (value.length > 0 || placeholder.length > 0) hasName = true;
        }
        if (!hasName) count++;
      });
      return count;
    },

    countFauxClickable() {
      const faux = getVisibleElements('div[onclick], span[onclick], p[onclick], li[onclick], ' +
                                    'div[style*="cursor: pointer"], span[style*="cursor: pointer"], p[style*="cursor: pointer"], li[style*="cursor: pointer"], ' +
                                    'div[style*="cursor:hand"], span[style*="cursor:hand"], p[style*="cursor:hand"], li[style*="cursor:hand"]');
      let count = 0;
      faux.forEach(el => {
        // If it has an onclick handler or cursor:pointer, it should be a button or link
        if (el.tagName !== 'BUTTON' && el.tagName !== 'A' &&
            !(el.tagName === 'INPUT' && ['button', 'submit', 'reset'].includes(el.type))) {
          count++;
        }
      });
      return count;
    },

    /**
     * Generate a simple CSS selector for an element.
     * @param {Element} el
     * @returns {string} CSS selector string
     */
    getSelector(el) {
      if (!el || !el.tagName) return '';
      let selector = el.tagName.toLowerCase();
      if (el.id) {
        selector += '#' + el.id;
      } else if (el.className && typeof el.className === 'string') {
        // Take the first class if there are multiple
        const cls = el.className.split(/\s+/)[0];
        if (cls) {
          selector += '.' + cls;
        }
      }
      return selector;
    }
  };

  window.UXAudit = UXAudit;
  console.log("[UXAUDIT] SignalCollector loaded");
})();