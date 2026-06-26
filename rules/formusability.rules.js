(() => {
  const UXAudit = window.UXAudit || {};

  UXAudit.Rules = UXAudit.Rules || {};

  // Form usability rules (placeholder – can be expanded with signals like missing placeholder,
  // missing required indicator, missing fieldset for radios/checkboxes, etc.)
  UXAudit.Rules.formusability = [];

  window.UXAudit = UXAudit;
})();