(() => {
  const UXAudit = window.UXAudit || {};

  UXAudit.Rules = UXAudit.Rules || {};

  UXAudit.Rules.hierarchy = [
    {
      id: 'h1Count',
      type: 'visualHierarchy',
      weight: 3,
      severity: 'high',
      value: signals => Math.abs(signals.h1Count - 1),
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
        const h1s = Array.from(document.querySelectorAll('h1'))
          .filter(el => window.UXAudit.SignalCollector.isVisible(el));
        if (h1s.length === 0) {
          return 'Missing H1 heading';
        }
        if (h1s.length > 1) {
          const texts = h1s.map(el => `"${el.textContent.trim()}"`);
          return `Multiple H1 headings: ${texts.join(', ')}`;
        }
        // Exactly one H1
        const text = h1s[0].textContent.trim();
        return `H1 heading: "${text}"`;
      },
      impact: (pageType, value) => {
        if (value === 0) return '';
        const impacts = {
          'Marketing Website': 'Users and search engines lack a clear primary heading, harming accessibility and SEO.',
          'SaaS Landing Page': 'Assistive technology users may struggle to identify the main topic of the page.',
          'Portfolio': 'Screen reader users get confused about the primary focus of the portfolio.',
          'Blog': 'Readers lose a clear indication of the article or blog’s main title.',
          'Documentation': 'Users navigating documentation lack a clear top-level heading for the topic.',
          'Dashboard': 'Users monitoring dashboards lack a clear primary heading for the view.',
          'E-commerce': 'Shoppers and SEO lack a clear primary product or page heading.',
          'Authentication Flow': 'Users authenticating lack a clear indication of the form’s purpose.',
          'Unknown': 'Page lacks a clear top-level heading structure.'
        };
        return impacts[pageType] || impacts['Unknown'];
      },
      recommendation: 'Use exactly one H1 element to define the page\'s main topic or purpose.',
      getElements: signals => {
        const h1s = Array.from(document.querySelectorAll('h1'))
          .filter(el => window.UXAudit.SignalCollector.isVisible(el));
        if (h1s.length === 0) return []; // nothing to highlight? maybe highlight body
        if (h1s.length === 1) return []; // optimal
        return h1s.slice(1); // highlight extra H1s
      }
    },
    {
      id: 'headingOrderSkips',
      type: 'visualHierarchy',
      weight: 1,
      severity: 'low',
      value: signals => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .filter(el => window.UXAudit.SignalCollector.isVisible(el));
        let skips = 0;
        let prevLevel = 0;
        headings.forEach(h => {
          const level = parseInt(h.tagName.substring(1));
          if (prevLevel > 0 && level > prevLevel + 1) {
            skips += (level - prevLevel - 1);
          }
          prevLevel = level;
        });
        return skips;
      },
      baseline: {
        'Marketing Website': 0,
        'SaaS Landing Page': 0,
        'Portfolio': 0,
        'Blog': 0,
        'Documentation': 0,
        'Dashboard': 1,
        'E-commerce': 0,
        'Authentication Flow': 0,
        'Unknown': 0
      },
      observation: value => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .filter(el => window.UXAudit.SignalCollector.isVisible(el));
        const skipInfo = [];
        let prevLevel = 0;
        headings.forEach(h => {
          const level = parseInt(h.tagName.substring(1));
          if (prevLevel > 0 && level > prevLevel + 1) {
            skipInfo.push(`${h.tagName}: "${h.textContent.trim()}" (skipped from H${prevLevel} to H${level})`);
          }
          prevLevel = level;
        });
        if (skipInfo.length === 0) return 'No heading level skips';
        return `Heading level skips: ${skipInfo.join('; ')}`;
      },
      impact: (pageType, value) => {
        if (value === 0) return '';
        const impacts = {
          'Marketing Website': 'Heading structure is confusing for screen reader users, making navigation harder.',
          'SaaS Landing Page': 'Users may miss the hierarchical relationship between sections.',
          'Portfolio': 'The portfolio’s sections relationships are unclear for assistive tech.',
          'Blog': 'Readers using screen readers may find the article structure awkward.',
          'Documentation': 'Users following technical docs may miss subsection relationships.',
          'Dashboard': 'Operators may find the layout of information confusing.',
          'E-commerce': 'Shoppers may struggle to understand product categorization.',
          'Authentication Flow': 'Low impact on core task, but affects screen reader navigation.',
          'Unknown': 'Heading hierarchy skips levels, causing potential confusion.'
        };
        return impacts[pageType] || impacts['Unknown'];
      },
      recommendation: 'Use sequential heading levels (e.g., H2 after H1, H3 after H2) to maintain a clear outline.',
      getElements: signals => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .filter(el => window.UXAudit.SignalCollector.isVisible(el));
        const els = [];
        let prevLevel = 0;
        headings.forEach(h => {
          const level = parseInt(h.tagName.substring(1));
          if (prevLevel > 0 && level > prevLevel + 1) {
            els.push(h);
          }
          prevLevel = level;
        });
        return els;
      }
    }
  ];

  window.UXAudit = UXAudit;
})();