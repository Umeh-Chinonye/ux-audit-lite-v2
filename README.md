# UX Audit Lite V2

> A lightweight, signal-based UX auditor that scans any webpage and generates a clear, structured audit report derived from measurable DOM and computed style signals.

## Table of Contents
- [Product Vision](#product-vision)
- [User Personas](#user-personas)
- [Signal-Based Audit Engine](#signal-based-audit-engine)
- [Signals](#signals)
- [Page Type Classification](#page-type-classification)
- [Severity Model](#severity-model)
- [UX Scoring Methodology](#ux-scoring-methodology)
- [Audit Report Structure](#audit-report-structure)
- [Extension Architecture](#extension-architecture)
- [Overlay System Behavior](#overlay-system-behavior)
- [Dashboard Requirements](#dashboard-requirements)
- [Export System](#export-system)
- [Trust & Audit Experience](#trust--audit-experience)
- [Future Roadmap](#future-roadmap)
  - [AI-Powered Enhancements](#ai-powered-enhancements)
  - [Figma Integration Roadmap](#figma-integration-roadmap)
- [Development Phases](#development-phases)
- [Evidence-Based Auditing Principles](#evidence-based-auditing-principles)

---

## Product Vision

UX Audit Lite V2 aims to elevate the standard of webpage evaluation by moving beyond subjective checklists to a strict signal-based model. Every finding originates from measurable signals extracted from the DOM or computed styles, compared against context-aware thresholds, and classified for impact based on page type. Our vision is to provide audits that are objective, transparent, and actionable—empowering designers, developers, and product teams to make decisions grounded in empirical evidence.

We believe that great UX auditing starts with measurement: what signals does the page emit, how do they deviate from expected norms for its intent, and what is the resulting impact on user experience?

---

## User Personas

### 1. UX Designer
- **Goal**: Validate design decisions with objective data.
- **Needs**: Signal-based findings that tie directly to measurable properties; ability to export for stakeholder reports.
- **Pain Points**: Generic audits that rely on opinion rather than quantifiable metrics.

### 2. Frontend Developer
- **Goal**: Ensure implementation meets measurable accessibility and usability standards.
- **Needs**: Specific signal violations with clear thresholds and locatable evidence.
- **Pain Points**: Wasting time on false positives; difficulty prioritizing fixes without impact context.

### 3. Product Manager
- **Goal**: Understand the UX health of key pages via quantifiable metrics.
- **Needs**: High-level scores derived from signal aggregates; ability to track improvements over time.
- **Pain Points**: Overwhelming detail; lack of a clear, signal-driven health metric.

### 4. Accessibility Specialist
- **Goal**: Identify barriers for users with disabilities through objective signals.
- **Needs**: Deep accessibility analysis with WCAG-aligned signals (labels, alt text, ARIA); evidence-based findings.
- **Pain Points**: Tools that miss contextual accessibility issues or generate noise without signal basis.

---

## Signal-Based Audit Engine

The audit engine operates on a strict signal-based model:

1. **Signal Extraction**: From the DOM and computed styles, we extract four categories of measurable signals:
   - **Structural**: heading hierarchy, section count, layout depth (nesting of sectioning elements), landmark density.
   - **Interaction**: click handlers, form completeness (ratio of labeled fields), focusable elements, tabindex usage.
   - **Accessibility**: labels, alternative text, ARIA attributes, language declarations, role usage.
   - **Visual Density**: element clustering (average nearest-neighbor distance), text density (ratio of visible text nodes to total elements), CTA density (buttons/links per viewport area).

2. **Threshold Violation**: Each signal is compared against a dynamically determined threshold based on the classified page type and its expected norms. A violation occurs when a signal falls outside an acceptable range (e.g., heading count < 1 for a documentation page).

3. **Impact Classification**: Violations are classified for impact (High/Medium/Low) using a matrix that combines signal severity, deviation magnitude, and page type context (e.g., missing alt text on a hero image is High impact on a marketing page but Low on a utility dashboard).

4. **Finding Generation**: A UX finding is generated **only** when:
   - At least one measurable signal exists.
   - A defined threshold violation or anomaly is detected.
   - Impact is classified based on page type context.
   No finding is generated from subjective language without supporting signals.

---

## Signals

Measurable signals are numeric or boolean values extracted from the page:

### Structural Signals
- `headingCount`: total number of heading elements (h1-h6).
- `h1Count`: number of h1 elements.
- `headingOrderSkips`: count of heading level skips (e.g., h1 to h3).
- `sectionCount`: number of sectioning elements (section, article, nav, aside).
- `layoutDepth`: maximum nesting depth of sectioning elements.
- `landmarkCount`: number of ARIA landmarks (header, footer, main, nav, etc.).

### Interaction Signals
- `clickHandlerCount`: total number of elements with `onclick` or `addEventListener('click', ...)` (approximated via attribute presence).
- `formFieldCount`: total number of input, textarea, select elements.
- `labeledFieldCount`: number of form fields with an associated label (via `for` attribute, aria-label, aria-labelledby, or wrapping label).
- `requiredFieldCount`: number of form fields with `required` attribute.
- `validatedFieldCount`: number of form fields with validation attributes (pattern, min, max, etc.).
- `focusableCount`: number of elements that can receive focus (native focusable + `tabindex` not negative).
- `tabindexPresence`: count of elements with explicit `tabindex`.

### Accessibility Signals
- `imageCount`: total img elements.
- `imageMissingAlt`: number of img elements lacking alt text.
- `inputMissingLabel`: number of form fields without an accessible label.
- `ariaAttributeCount`: total number of ARIA attributes present.
- `languageDeclared`: boolean indicating presence of `lang` attribute on html element.
- `roleUsage`: count of elements with explicit ARIA role.

### Visual Density Signals
- `visibleElementCount`: number of elements with computed `display !== none`, `visibility !== hidden`, `opacity > 0`, and non-zero dimensions.
- `textNodeCount`: number of visible text nodes (excluding whitespace-only).
- `ctaCount`: number of buttons and links (a[href]) that are visible.
- `viewportArea`: width × height of the visual viewport.
- `ctaDensity`: ctaCount per 1000px² of viewport area.
- `textDensity`: textNodeCount per 1000px² of viewport area.
- `elementClustering`: average distance between visible element centroids (proxy for density).

Signals are computed once per audit and feed both page type classification and threshold checking.

---

## Page Type Classification

Before any audit, the system classifies the page type and confidence level based on a weighted combination of signals.

**Possible Page Types**:
- `Marketing Website`: high CTA density, prominent hero section, low form count.
- `SaaS Landing Page`: moderate CTA density, feature sections, sign-up form.
- `Portfolio`: low CTA density, high image count, project/gallery sections.
- `Blog`: high text density, many article/post sections, low CTA density outside comments.
- `Documentation`: high heading count, deep heading hierarchy, low CTA density, many code/pre elements.
- `Dashboard`: high interaction density (forms, tables, widgets), moderate heading count, low text density.
- `E-commerce`: high product/image count, price patterns, cart/checkout elements.
- `Authentication Flow`: high form density, low navigation, specific input types (email/password).
- `Unknown`: low confidence or mixed signals.

The classifier returns:
- `type`: string page type.
- `confidence`: 0.0–1.0 reflecting signal clarity.
- `signals`: the raw signal object used for classification.

Page type influences:
- Which signals are evaluated (some categories may be less relevant).
- The thresholds for acceptable signal ranges.
- The impact mapping of violations (e.g., missing alt text is more impactful on Marketing than on Dashboard).

---

## Severity Model

Each signal violation is assigned a severity level based on:
- **Deviation Magnitude**: how far the signal is from the acceptable range (normalized).
- **Signal Criticality**: inherent importance of the signal (e.g., missing alt text on an informative image is more critical than missing placeholder hint).
- **Page Type Context**: amplifies or reduces severity based on the page's intent.

**Levels**:
- **High**: Violation likely blocks or severely hinders core tasks for a significant user segment (e.g., missing form labels on a checkout page).
- **Medium**: Violation causes noticeable friction, confusion, or inefficiency but may not block task completion (e.g., heading level skips on a blog).
- **Low**: Minor deviation offering refinement opportunities (e.g., slight text density variance on a portfolio).

Severity is computed as a function that combines normalized deviation, signal weight, and page type impact factor.

---

## UX Scoring Methodology

The UX Health Score (0–100) is a transparent, evidence-based metric reflecting overall usability and accessibility health relative to page intent.

### Score Calculation
1. **Signal Deviation Points**: For each signal, compute a deviation score:
   - If signal within acceptable range: 0 points.
   - If outside range: points = weight × normalized deviation (capped at max weight).
   - Weights reflect signal importance (e.g., accessibility signals higher weight).
2. **Total Deviation**: Sum of deviation points across all signals.
3. **Baseline Allowance**: Expected noise for the page type (e.g., a marketing page may tolerate 2 missing alt texts due to decorative images).
4. **Score Formula**:  
   `UX Score = max(0, 100 - ( (Total Deviation - Baseline Allowance) / Max Expected Deviation ) * 100 )`  
   Where:
   - `Baseline Allowance`: derived from page type (see table below).
   - `Max Expected Deviation`: upper bound beyond which score plateaus at 0 (Baseline + page-type-specific margin).
5. **Category Scores**: Compute similarly but only for signals belonging to each category (Accessibility, Clarity, etc.).

### Baseline Allowance Table (Examples)
| Page Type          | Baseline Allowance |
|--------------------|--------------------|
| Marketing Website  | 3                  |
| SaaS Landing Page  | 4                  |
| Portfolio          | 2                  |
| Blog               | 2                  |
| Documentation      | 3                  |
| Dashboard          | 5                  |
| E-commerce         | 4                  |
| Authentication Flow| 3                  |
| Unknown            | 3                  |

### Score Transparency
The audit report includes:
- Overall UX Score
- Category Scores
- Breakdown of signal deviations (points per signal)
- Baseline Allowance and Max Expected Deviation used
- List of signals contributing to the score

This ensures users understand *why* a page received its score and can trust the measurement.

---

## Audit Report Structure

The audit engine returns a structured JSON object:

```json
{
  "pageUrl": "https://example.com",
  "timestamp": "2026-06-22T10:30:00Z",
  "pageType": {
    "type": "SaaS Landing Page",
    "confidence": 0.87
  },
  "uxScore": 78,
  "categoryScores": {
    "accessibility": 85,
    "clarity": 72,
    "visualHierarchy": 80,
    "interaction": 75,
    "formUsability": null
  },
  "signalSummary": {
    "totalDeviationPoints": 22,
    "baselineAllowance": 4,
    "maxExpectedDeviation": 14,
    "signalDetails": [  // per-signal deviation
      { "signal": "imageMissingAlt", "value": 2, "threshold": 0, "weight": 3, "points": 6 },
      { "signal": "h1Count", "value": 0, "threshold": 1, "weight": 3, "points": 3 }
      // ... more signals
    ]
  },
  "findings": [
    {
      "id": "finding-1",
      "type": "accessibility",
      "severity": "high",
      "signal": "imageMissingAlt",
      "observation": "2 images missing alternative text",
      "evidence": "imageMissingAlt = 2, threshold <= 0 for SaaS Landing Page",
      "impact": "Users relying on screen readers cannot understand the purpose of informative images, which likely convey key value propositions or feature illustrations on a SaaS landing page.",
      "recommendation": "Add descriptive alt text that conveys the image's information or function (e.g., alt='Dashboard showing analytics').",
      "confidence": 0.95,
      "elements": [  // list of offending element selectors
        "body > section.features > img:nth-child(1)",
        "body > section.features > img:nth-child(3)"
      ],
      "selectorType": "css"
    }
    // ... more findings
  ],
  "positiveSignals": [
    {
      "signal": "languageDeclared",
      "observation": "HTML language attribute present",
      "evidence": "<html lang='en'>",
      "confidence": 0.99
    }
  ]
}
```

Every finding must include:
- **Signal**: the specific signal that violated.
- **Observation**: what was seen (human-readable summary of signal violation).
- **Evidence**: numeric signal value, threshold, and optionally DOM snippets.
- **Impact**: why it matters for this page's intent and users (based on page type context).
- **Recommendation**: actionable fix.
- **Confidence Score**: 0.0–1.0 reflecting signal strength and contextual relevance.
- **Elements**: list of DOM elements responsible (via CSS selector) for traceability.

Positive signals (those within acceptable range) are also reported to reinforce good practices.

---

## Extension Architecture

UX Audit Lite V2 follows a message-passing architecture typical of Chrome Extensions MV3, separating concerns across distinct components:

```
UX Audit Lite V2
├── manifest.json          # Extension metadata and permissions
├── background.js          # Service worker: handles messaging, temporary storage
├── contentScript.js       # In-page auditor: signal extraction, classification, threshold checking
├── overlay.js             # In-page highlighter: visual feedback system
├── popup.html             # Standard browser popup UI
├── popup.js               # Popup logic: triggers audit, displays results
├── popup.css              # Popup styling
└── README.md              # This document
```

### Component Responsibilities

#### Manifest (`manifest.json`)
- Declares MV3, permissions (`activeTab`, `scripting`, `<all_urls>` for content injection), background service worker, content scripts, and default popup.
- No externally accessible web resources for security.

#### Background Script (`background.js`)
- Acts as a message relay between popup and content script.
- Temporarily stores the last audit result (cleared on browser session end).
- Does not perform heavy computation to keep the service worker idle.

#### Content Script (`contentScript.js`)
- **Core Signal-Based Audit Engine**: Runs in the context of the active tab.
- Responsibilities:
  1. Retrieve page DOM and compute `isVisible` filtering.
  2. Extract all measurable signals (structural, interaction, accessibility, visual density).
  3. Execute page type classification using signal values.
  4. For each signal, compare against page-type-specific thresholds to detect violations.
  5. Build structured finding objects with signal-based evidence, impact classification, and recommendations.
  6. Calculate transparent UX score from signal deviations.
  7. Communicate results back to background script via `chrome.runtime.sendMessage`.
- Also handles overlay lifecycle: injection, enabling/disabling, issuing highlight/clear commands.

#### Overlay Script (`overlay.js`)
- Injected by the content script when the overlay is enabled.
- Provides a global `window.uxAuditOverlay` API for:
  - Toggling overlay visibility.
  - Highlighting elements associated with signal violations (outline + tooltip).
  - Clearing highlights.
- Uses sessionStorage to remember enabled state across page reloads within a session.

#### Popup (`popup.html`, `popup.js`, `popup.css`)
- Standard browser action UI.
- Responsibilities:
  - Trigger audit via message to background script.
  - Display loading state, results, and error handling.
  - Render score circle, severity summary, and tabbed details view.
  - Provide overlay toggle button.
  - Handle tab switching and responsive layout.

### Data Flow
1. User clicks extension popup → popup sends `"runAudit"` message to background.
2. Background forwards to active tab's content script.
3. Content script runs signal extraction → classification → threshold checking → builds result.
4. Content script sends result back to background.
5. Background forwards result to popup.
6. Popup updates UI with score, severity counts, and findings.
7. If overlay is enabled, popup sends `"highlightIssues"` with findings; content script ensures overlay is injected/enabled and issues are highlighted.
8. Overlay listens for highlight commands and draws outlines/tooltips.

---

## Overlay System Behavior

The overlay system provides contextual, on-page visualization of signal-based audit findings to bridge the gap between the audit report and the actual page elements.

### Activation
- Toggleable via button in the popup.
- State remembered per-tab per-session using `sessionStorage`.
- When enabled, the overlay script (`overlay.js`) is injected into the page (if not already).

### Highlighting
- For each finding, the associated element selectors are queried.
- If found, the element receives:
  - A 2px solid red outline (`outline: 2px solid #e74c3c`) with negative offset to avoid layout shift.
  - Event listeners for `mouseenter`/`mouseleave` and `touchstart`/`touchend`.
- On hover/touch, a tooltip appears near the element:
  - Semi-transparent black background.
  - White text showing: `[SEVERITY]: [Signal] = [Value] (threshold: [Threshold])` (e.g., `HIGH: imageMissingAlt = 2 (threshold: 0)`).
  - Hidden on hover-out or touch-end.

### Controls
- **Enable/Disable**: Toggle in popup; disabling removes all highlights and event listeners.
- **Persists**: Remains enabled during page navigation within the same tab until toggled off or tab closed.
- **Performance**: Highlighting is limited to elements actually found in the DOM; non-matching selectors are ignored silently.

### Design Principles
- **Non-Intrusive**: Outlines use `outline` (not `border`) to avoid affecting layout or triggering resize events.
- **Accessible**: Tooltips are styled for readability but are not keyboard-focusable (they appear on hover/touch, appropriate for visual debugging).
- **Scoped**: Only highlights elements tied to validated signal violations; no speculative highlighting.

---

## Dashboard Requirements (Popup UI)

The popup serves as the primary audit results dashboard. It must balance information density with clarity and actionability.

### Layout
- **Header**: Extension name and refresh button.
- **Score Card**: Prominent circular UX score with label and textual interpretation (Excellent/Good/Needs Improvement/Poor).
- **Severity Summary**: Horizontal row showing counts of High/Medium/Low signal violations.
- **Tabs**:
  - *Overview*: Shows severity summary, brief textual summary, and signal deviation chart (if space).
  - *Details*: Lists all findings grouped by signal type (Accessibility, Clarity, etc.) in expandable cards.
- **Footer**: Copyright and version.

### Finding Cards
Each finding card in the Details tab displays:
- **Header**: Issue type (capitalized) and severity badge (color-coded).
- **Body**:
  - Observation (signal-based description).
  - Evidence: Monospace-stamped signal value and threshold (e.g., `imageMissingAlt = 2 (threshold: 0)`).
  - Impact: Brief statement of consequence (based on page type).
  - Recommendation: Actionable fix, prefixed with "Suggested fix:" and styled distinctively.
  - Elements: list of selectors (clickable to highlight in overlay? future).
- **Interactivity**: Cards can be expanded/collapsed (current MVP shows all details; future versions may introduce progressive disclosure).

### States
- **Loading**: Shown while audit is in progress.
- **Empty**: "No significant signal deviations found! Great job!" when UX score is high and findings array is empty.
- **Error**: Displayed if audit fails (e.g., scripting blocked, no active tab).

### Interaction
- **Refresh Button**: Re-runs audit on current tab.
- **Overlay Toggle**: Button to enable/disable the on-page highlighter.
- **Tab Switching**: Click to switch between Overview and Details.
- **Responsive**: Fixed width (350px) suitable for popup; content scrolls if overflow.

### Styling
- Modern, clean design using system fonts.
- Color-coded severity indicators (Red for High, Amber for Medium, Green for Low).
- Subtle shadows, rounded corners, and hover states for buttons.
- CSS vars for dynamic score circle gradient.

---

## Export System

Users can export audit results for sharing, archiving, or integration into other tools. Exports are generated client-side and include comprehensive context.

### Supported Formats
1. **PDF** (via browser print-to-PDF or library like jsPDF)
2. **Markdown** (readable, version-control friendly)
3. **JSON** (machine-readable, for ingestion into other systems)

### Export Content
All exports include:
- **Executive Summary**: Page URL, timestamp, UX score, page type classification, brief summary of signal deviations.
- **UX Score**: Overall score and category breakdown.
- **Signal Details**: Full array of signals with values, thresholds, weights, and deviation points.
- **Finding Details**: Full array of findings with signal, observation, evidence, impact, recommendation, confidence, elements.
- **Positive Signals**: List of signals within acceptable range (if any).
- **Methodology Note**: Brief explanation of signal-based scoring and evidence-based approach.
- **Page Context**: URL and timestamp.

### Export Triggers
- A dedicated "Export" button in the popup (future addition, post-MVP).
- Options to select format and whether to include positive signals.
- Exported file named: `ux-audit-[timestamp]-[page-host].ext`

### Technical Approach
- **JSON**: Direct stringification of the audit result object.
- **Markdown**: Templated string built from audit result.
- **PDF**: Generated via `window.print()` targeting a hidden print-friendly view, or using a library for more control.

---

## Trust & Audit Experience

To build user confidence in the audit process, the extension makes its internal stages transparent and provides a sense of progression.

### Audit Progress Stages (Displayed in Popup During Analysis)
1. **Extracting Signals** → Computing structural, interaction, accessibility, and visual density signals from DOM.
2. **Classifying Page Type** → Running signal-based classification algorithm.
3. **Checking Thresholds** → Comparing signals against page-type-specific baselines.
4. **Assessing Impact** → Mapping violations to impact levels using page type context.
5. **Generating Recommendations** → Structuring findings, calculating score.
6. **Audit Complete** → Results ready for display.

These stages are conveyed via a subtle status text below the score or in a dedicated progress area, reassuring the user that the extension is thinking critically rather than applying static rules.

### Signal Transparency
Every finding in the Details tab includes an "Evidence" line showing the exact signal value and threshold that triggered the observation, allowing users to verify the finding themselves.

### Confidence Scoring
Findings include a confidence score (0.0–1.0) visible in detailed view or on hover, indicating the audit's certainty based on signal strength and contextual fit.

### Avoiding Automation Bias
By emphasizing that findings are *signal-based* and *contextual*, the extension encourages users to treat them as starting points for investigation, not absolute verdicts. The explanation of *why* a signal deviation matters (Impact) helps users judge relevance to their specific goals.

---

## Future Roadmap

### AI-Powered Enhancements
The current signal-based engine provides a solid foundation. Future versions may integrate lightweight models to:

1. **Refine Page Type Classification**: Use signal patterns to detect sub-types (e.g., "Portfolio - Photography Focus", "Dashboard - Analytics").
2. **Dynamic Threshold Adjustment**: Learn acceptable signal ranges from a corpus of high-quality pages per type (privacy-preserving, on-device if possible).
3. **Predictive Impact**: Estimate conversion or task success impact of signal deviations using heuristic models.
4. **Explain Like I'm 5**: Option to get plain-language explanations of why a signal deviation matters.

*Implementation Path*: Phase 2 will explore integrating signal-based heuristics or simple ML models (e.g., decision trees) for classification and threshold tuning, falling back to rule-based if unavailable.

### Figma Integration Roadmap
To close the loop between audit and design, we plan:

1. **Export to Figma**: Generate a Figma JSON snippet or plugin-compatible file that imports signal findings as sticky notes or comments on corresponding frames.
2. **Live Sync (Conceptual)**: For designers working in Figma, a plugin could:
   - Fetch the live URL being audited.
   - Display UX Audit Lite V2 signal findings directly in the Figma sidebar.
   - Allow designers to mark findings as "Addressed" in Figma, which could sync back to the extension (requires backend).
3. **Design System Audit**: Specialized mode that checks a page against a published design system (tokens, component usage) by comparing extracted signal patterns (e.g., font usage, color contrast ratios from computed styles).

*Implementation Path*: Phase 1 focuses on reliable export (Markdown/JSON). Phase 2+ explores Figma plugin development or direct API interaction (requires user auth and Figma plugin distribution).

### Export Capabilities (Near-Term)
- Add export buttons to popup (PDF, Markdown, JSON) in V1.
- Ensure exports include all data from the audit result.
- Provide option to include/exclude positive signals.

### Development Phases

#### **MVP (Current)**
- Core signal-based audit engine with structural, interaction, accessibility, and visual density signals.
- Page type classification using signal thresholds.
- Signal deviation points and transparent UX scoring.
- Standard popup UI with score, severity summary, tabbed details.
- Overlay system for on-page highlighting of signal violations (toggleable).
- Background messaging architecture.
- Manifest V3 compliant.
- No AI, no export, no Figma integration.

#### **V1 (Near Future)**
- Add export functionality (PDF/Markdown/JSON) to popup.
- Refine signal thresholds per page type using empirical baselines.
- Enhance overlay with better tooltip positioning and collision avoidance.
- Add audit progress stages display in popup.
- Improve visual density signals (clustering, text density) with more accurate computations.
- Begin exploratory work on signal-based threshold learning (prototype only).

#### **V2 (Future)**
- Integrate lightweight signal-based models for dynamic threshold adjustment and sub-type classification (opt-in, privacy-preserving).
- Add Figma export plugin or direct API integration (sticky notes/comments).
- Introduce UX score trend tracking (requires persistent storage; may use IndexedDB via background or optional cloud sync).
- Add ability to ignore/dismiss specific signal violations (persisted per-site).
- Enhance accessibility audits with more nuanced contrast checking (where possible via computed styles).
- Refine UI: draggable/minimizable/expandable floating panel experiment (may remain popup-only due to Chrome UI constraints).

---

## Evidence-Based Auditing Principles

To ensure the extension provides trustworthy, actionable insights, the following non-negotiable principles guide all audit logic:

1. **No Findings Without Signals**  
   A finding is only generated when a measurable signal (structural, interaction, accessibility, or visual density) exists and violates a defined threshold. Signal matches alone are insufficient without threshold violation.

2. **Context Over Checklists**  
   The audit framework adapts to the classified page type and intent. A missing H1 is critical on a documentation page but may be less so on a pure utility tool.

3. **Explain the 'Why'**  
   Every finding must articulate *why* the signal deviation matters for this specific page, its likely users, and its stated goals (inferred from content and structure).

4. **Prefer Signal Over Noise**  
   It is better to emit fewer, high-confidence signal violations than to flood the user with low-value or speculative issues. Findings with low confidence (<0.5) are suppressed.

5. **Impact-Oriented Severity**  
   Severity reflects potential harm to user experience *in context*, not just signal criticality. A medium-severity signal issue blocking a core conversion path may be treated as high impact.

6. **Validate, Don't Assume**  
   Heuristics (e.g., "button-like div should be a real button") are only applied when supported by multiple signals (e.g., visual styling *and* hover effect *and* click handler).

7. **Transparency Builds Trust**  
   Users must be able to trace a finding back to the signal that caused it, see the threshold violation, and understand how it contributed to the overall score.

By adhering to these principles, UX Audit Lite V2 aims to be a tool that professional teams rely on not just to find problems, but to understand them deeply and fix them effectively.

---
*Version: 0.2.0 (Signal-Based MVP)*  
*Last Updated: 2026-06-22*  
*© 2026 UX Audit Lite V2. All rights reserved.*