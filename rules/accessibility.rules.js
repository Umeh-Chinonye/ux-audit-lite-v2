(() => {
  const UXAudit = window.UXAudit || {};

  // Ensure namespace for rules
  UXAudit.Rules = UXAudit.Rules || {};

  UXAudit.Rules.accessibility = [
    {
      id: 'imageMissingAlt',
      type: 'accessibility',
      weight: 3,
      severity: 'high',
      value: signals => signals.imageMissingAlt,
      baseline: {
        'Marketing Website': 0,
        'SaaS Landing Page': 0,
        'Portfolio': 0,
        'Blog': 0,
        'Documentation': 0,
        'Dashboard': 2,
        'E-commerce': 0,
        'Authentication Flow': 0,
        'Unknown': 0
      },
      observation: value => {
        const plural = value !== 1 ? 's' : '';
        return `${value} image${plural} missing alternative text`;
      },
      impact: (pageType, value) => {
        if (value === 0) return '';
        const impacts = {
          'Marketing Website': 'Users relying on screen readers cannot understand the purpose of informative images, which likely convey key value propositions or feature illustrations.',
          'SaaS Landing Page': 'Screen reader users miss important visual context about features or benefits, reducing comprehension of the product offering.',
          'Portfolio': 'Potential clients or employers using assistive technology cannot perceive the work being showcased.',
          'Blog': 'Readers using screen readers miss visual context that supports article content.',
          'Documentation': 'Users following guides may miss important diagrams or screenshots, impairing understanding.',
          'Dashboard': 'Operators monitoring critical info may miss visual alerts or data visualizations.',
          'E-commerce': 'Shoppers with visual impairments cannot see product details, affecting purchase decisions.',
          'Authentication Flow': 'Users may not understand the purpose of decorative images, but impact on core task is low.',
          'Unknown': 'Users relying on screen readers miss visual information.'
        };
        return impacts[pageType] || impacts['Unknown'];
      },
      recommendation: 'Add descriptive alt text that conveys the image\'s information or function (e.g., alt="Team collaborating in modern office").',
      getElements: signals => {
        return Array.from(document.querySelectorAll('img:not([alt]), img[alt=""]'))
          .filter(el => window.UXAudit.SignalCollector.isVisible(el));
      }
    },
    {
      id: 'inputMissingLabel',
      type: 'accessibility',
      weight: 3,
      severity: 'high',
      value: signals => signals.inputMissingLabel,
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
        const plural = value !== 1 ? 's' : '';
        return `${value} form field${plural} missing accessible label`;
      },
      impact: (pageType, value) => {
        if (value === 0) return '';
        const impacts = {
          'Marketing Website': 'Users cannot understand what information to enter, leading to form abandonment.',
          'SaaS Landing Page': 'Potential users cannot complete sign-up, directly impacting conversion.',
          'Portfolio': 'Contact or commission forms become unusable for some users.',
          'Blog': 'Comment or newsletter forms inaccessible, reducing engagement.',
          'Documentation': 'Users cannot provide feedback or ask questions, impairing community.',
          'Dashboard': 'Operators may be unable to adjust settings or submit data.',
          'E-commerce': 'Shoppers cannot complete purchase, causing lost sales.',
          'Authentication Flow': 'Users cannot log in or register, blocking core functionality.',
          'Unknown': 'Users unable to complete forms, leading to frustration and abandonment.'
        };
        return impacts[pageType] || impacts['Unknown'];
      },
      recommendation: 'Associate a label element using the "for" attribute, or provide aria-label/aria-labelledby.',
      getElements: signals => {
        const fields = Array.from(document.querySelectorAll('input, textarea, select'))
          .filter(el => window.UXAudit.SignalCollector.isVisible(el));
        return fields.filter(field => {
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
          return !labeled;
        });
      }
    },
    {
      id: 'languageDeclared',
      type: 'accessibility',
      weight: 2,
      severity: 'medium',
      value: signals => signals.languageDeclared === 0 ? 1 : 0,
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
      observation: () => 'HTML element missing language attribute',
      impact: (pageType, value) => {
        if (value === 0) return '';
        const impacts = {
          'Marketing Website': 'Screen readers may default to an incorrect language, causing pronunciation issues.',
          'SaaS Landing Page': 'Users relying on assistive tech may experience incorrect language rendering.',
          'Portfolio': 'International visitors may not have content announced in their preferred language.',
          'Blog': 'Readers using screen readers may hear content in the wrong language.',
          'Documentation': 'Users following guides may encounter incorrect pronunciation of technical terms.',
          'Dashboard': 'Operators monitoring interfaces may hear incorrect language cues.',
          'E-commerce': 'Shoppers may experience product descriptions in an unintended language.',
          'Authentication Flow': 'Users may struggle to understand form labels or buttons.',
          'Unknown': 'Assistive technologies cannot determine the correct language for content.'
        };
        return impacts[pageType] || impacts['Unknown'];
      },
      recommendation: 'Add a lang attribute to the html element (e.g., lang="en").',
      getElements: signals => {
        return document.documentElement.lang ? [] : [document.documentElement];
      }
    }
  ];

  window.UXAudit = UXAudit;
})();