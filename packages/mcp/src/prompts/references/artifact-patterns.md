## Adaptation Artifact Specification

You MUST produce a **React artifact** — not Markdown, not plain text, not a code block. The output is a single interactive React component that the teacher will use to review and select adaptations.

### Data Structure

Embed this JSON as a constant inside the React component. All top-level keys are required. `activities` must be non-empty. Every `tags` array must contain only valid tag IDs from the teacher's profile. `quickWins` and `transitionNotes` may be empty arrays.

```json
{
  "lessonTitle": "string — title of the lesson, extracted from the plan",
  "lessonSummary": "string — 2-3 sentence overview of what the lesson covers",
  "activities": [
    {
      "id": "string — e.g., 'activity-1'",
      "name": "string — activity name from the lesson plan",
      "originalText": "string — the relevant excerpt from the original lesson plan",
      "timeEstimate": "string or null — duration if mentioned in the plan",
      "adaptations": [
        {
          "id": "string — e.g., 'adapt-1a'",
          "suggestion": "string — the specific, actionable modification",
          "rationale": "string — 1-2 sentences explaining WHY this fits this classroom, referencing the specific learning need(s) by name and the barrier in the activity",
          "detail": "string — expanded implementation notes, examples, or templates",
          "tags": ["string array — learning need tag IDs this addresses"],
          "effort": "'quick-win' | 'moderate' | 'deeper'",
          "category": "'representation' | 'expression' | 'engagement'"
        }
      ]
    }
  ],
  "quickWins": [
    {
      "id": "string",
      "suggestion": "string — the low-effort, high-impact change",
      "tags": ["string array — learning need tag IDs"],
      "category": "'representation' | 'expression' | 'engagement'"
    }
  ],
  "transitionNotes": [
    {
      "between": "string — e.g., 'Between Vocabulary Introduction and Group Reading'",
      "concern": "string — what might be difficult for students with specific needs",
      "suggestion": "string — how to smooth the transition"
    }
  ]
}
```

### Artifact Layout

Build the React component with this layout:

- **Header**: Lesson title, summary line ("Adapted for X learning needs across Y activities"), and three UDL category filter toggles as colored pill buttons (Blue = Representation, Green = Expression, Amber = Engagement).
- **Quick Wins banner**: Pinned below the header. 2-3 high-impact, low-effort suggestions. Each with a checkbox.
- **Lesson flow**: One section per activity.
  - **Activity header**: Name + time estimate + suggestion count. Click to collapse/expand.
  - **Original text**: The lesson plan excerpt in a subtle inset block.
  - **Adaptation cards**: Cards with:
    - Checkbox (unchecked by default)
    - Suggestion text
    - Rationale text in a subtle, secondary style below the suggestion — always visible, not hidden behind an expand. This is the "why" that helps teachers evaluate whether a suggestion fits their classroom.
    - Tag pills colored by UDL category with text labels (color must not be the sole indicator)
    - Effort badge with icon shape and text: filled circle + "Quick win", half circle + "Moderate", outlined circle + "Deeper"
    - Expand/collapse for implementation detail
- **Transition notes**: Between activity sections, subtle callouts for transition concerns.
- **Sticky footer**: Live count ("4 of 12 suggestions selected"), "Copy Selected" and "Copy All" buttons.

### Interaction

Checking/unchecking updates the footer count in real time. Category filters show/hide adaptation cards (checkbox state preserved when hidden). Collapsing an activity shows just the header with suggestion count.

### Copy to Clipboard

Use the clipboard fallback function from the Clipboard Fallback reference for all copy operations.

### Persistence (adaptation artifact only)

Persist checkbox state and category filters in `window.localStorage` keyed by `lesson-{hash of title}`. Restore state on re-render. This applies only to the adaptation artifact — other artifacts (such as the onboarding profile setup) must not use `window.localStorage`.

### Accessibility

- All colored elements include text labels. Color is never the sole indicator of category or effort.
- Interactive elements are keyboard-navigable.
- Minimum contrast follows Tailwind's default color palette (WCAG AA).

### Styling Conventions

- Use Tailwind utility classes only. No external CSS.
- Color scheme: blue-500 for Representation, green-500 for Expression, amber-500 for Engagement. These are consistent across all artifacts.
- Container: `max-w-4xl mx-auto` with reasonable padding.
- Keep the visual hierarchy clear: quick wins are prominent, activity sections are scannable, footer is always visible.
