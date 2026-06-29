(() => {
  const UXAudit = window.UXAudit || {};

  UXAudit.Rules = UXAudit.Rules || {};

  UXAudit.Rules.interaction = [
    {
      id: 'interactionMissingName',
      type: 'interaction',
      weight: 3,
      severity: 'high',
      value: signals => signals.interactionMissingName,
      baseline: {
        'Marketing Website': 0,
        'SaaS Landing Page': 0,
        'Portfolio': 0,
        'Blog': 0,
        'Documentation': 0,
        'Dashboard': 0,
        'E-commerce': 0,
        'Authentication Flow': 0,
        'Unknown': 0
      },
      observation: value => {
        const interactives = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"], input[type="reset"]'))
          .filter(el => window.UXAudit.SignalCollector.isVisible(el));
        const unnamed = interactives.filter(el => {
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
          return !hasName;
        });
        if (unnamed.length === 0) return 'All interactive elements have accessible names';
        const details = unnamed.map(el => {
          const tag = el.tagName.toLowerCase();
          const text = el.textContent.trim();
          const aria = el.getAttribute('aria-label') || '';
          const label = aria ? `aria-label="${aria}"` : (text ? `text="${text}"` : '(no visible text or aria-label)');
          return `<${tag} ${label}>`;
        });
        return `${unnamed.length} interactive element${unnamed.length !== 1 ? 's' : ''} lacking accessible name: ${details.join(', ')}`;
      },
      impact: (pageType, value) => {
        if (value === 0) return '';
        const impacts = {
          'Marketing Website': 'Users cannot understand the purpose of buttons or links, leading to confusion and lost conversions.',
          'SaaS Landing Page': 'Potential users cannot determine what action a button will take, reducing sign‑up conversions.',
          'Portfolio': 'Visitors may be unsure how to interact with portfolio items, causing frustration.',
          'Blog': 'Readers may be unable to identify clickable elements, decreasing engagement.',
          'Documentation': 'Users following guides may miss interactive examples or navigation aids.',
          'Dashboard': 'Operators may be unable to trigger essential actions, impairing usability.',
          'E-commerce': 'Shoppers cannot tell what buttons do, increasing cart abandonment.',
          'Authentication Flow': 'Users cannot log in or register because form controls lack accessible names.',
          'Unknown': 'Users unable to understand the purpose of interactive elements, leading to frustration.'
        };
        return impacts[pageType] || impacts['Unknown'];
      },
      recommendation: 'Provide an accessible name via text content, aria-label, aria-labelledby, or (for inputs) value or placeholder.',
      getElements: signals => {
        const interactives = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"], input[type="reset"]'))
          .filter(el => window.UXAudit.SignalCollector.isVisible(el));
        return interactives.filter(el => {
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
          return !hasName;
        });
      }
    },
    {
      id: 'fauxClickableCount',
      type: 'interaction',
      weight: 2,
      severity: 'medium',
      value: signals => signals.fauxClickableCount,
      baseline: {
        'Marketing Website': 0,
        'SaaS Landing Page': 0,
        'Portfolio': 0,
        'Blog': 0,
        'Documentation': 0,
        'Dashboard': 0,
        'E-commerce': 0,
        'Authentication Flow': 0,
        'Unknown': 0
      },
      observation: value => {
        const selectors = [
          'div[onclick]', 'span[onclick]', 'p[onclick]', 'li[onclick]',
          'div[style*="cursor: pointer"]', 'span[style*="cursor: pointer"]',
          'p[style*="cursor: pointer"]', 'li[style*="cursor: pointer"]',
          'div[style*="cursor:hand"]', 'span[style*="cursor:hand"]',
          'p[style*="cursor:hand"]', 'li[style*="cursor:hand"]'
        ];
        const elements = [];
        selectors.forEach(sel => {
          Array.from(document.querySelectorAll(sel))
            .filter(el => window.UXAudit.SignalCollector.isVisible(el))
            .forEach(el => {
              if (el.tagName !== 'BUTTON' && el.tagName !== 'A' &&
                  !(el.tagName !(el.tagName === 'INPUT' && ['button', 'submit', 'reset'].includes(el.type )) )) {?s
r
}});};

}}
```
      impact: (pageType, value) => {
        if (value === 0) return '';
        const impacts = {
          'Marketing Website': 'Users may attempt to interact with non‑interactive elements, causing confusion.',
          'SaaS Landing Page': 'Potential customers may miss real calls‑to‑action due to misleading affordances.',
          'Portfolio': 'Visitors may try to activate decorative elements, leading to frustration.',
          'Blog': 'Readers may be confused about what is clickable, reducing engagement.',
          'Documentation': 'Users following guides may miss actual interactive examples.',
          'Dashboard': 'Operators may attempt to trigger non‑functional controls, impairing workflow.',
          'E-commerce': 'Shoppers may be misled about where to click, increasing bounce rate.',
          'Authentication Flow': 'Users may try to activate non‑interactive elements, hindering login/registration.',
          'Unknown': 'Elements with click‑like appearance but no native interaction cause uncertainty.'
        };
        return impacts[pageType] || impacts['Unknown'];
      },
      recommendation: 'Use a button or link for clickable actions, or ensure proper keyboard accessibility and ARIA role.',
      getElements: signals => {
        const selectors = [
          'div[onclick]', 'span[onclick]', 'p[onclick]', 'li[onclick]',
          'div[style*="cursor: pointer"]', 'span[style*="cursor: pointer"]',
          'p[style*="cursor: pointer"]', 'li[style*="cursor: pointer"]',
          'div[style*="cursor:hand"]', 'span[style*="cursor:hand"]',
          'p[style*="cursor:hand"]', 'li[style*="cursor:hand"]'
        ];
        const elements = [];
        selectors.forEach(sel => {
          Array.from(document.querySelectorAll(sel))
            .filter(el => window.UXAudit.SignalCollector.isVisible(el))
            .forEach(el => {
              if (el.tagName !== 'BUTTON' && el.tagName !== 'A' &&
                  !(el.tagName === 'INPUT' && ['button', 'submit', 'reset'].includes(el.type))) {
                elements.push(el);
              }
            });
        });
        return elements;
      }
    }
  ];

  window.UXAudit = UXAudit;
})();