## Onboarding Artifact Specification

Build an interactive React component using Tailwind utility classes. All state is managed via `useState` — no external data fetching, no `window.storage`, no API calls. The artifact is self-contained.

### Header

- Title: "Set Up Your Classroom Profile" (setup mode) or "Your Classroom Profile" (edit mode — use edit mode if existing needs are provided in the prompt)
- Subtitle: "Select the learning needs present in your classroom and add your teaching context. This helps generate specific, actionable lesson plan adaptations."
- PII note in small italic text: "This tool works with classroom-level learning needs. Please avoid including student names when pasting lesson plans."

### Learning Needs Grid

Three columns (stack to single column on mobile using responsive Tailwind classes), one per UDL category. Each column has a colored header bar with the category name AND description text, and contains checkboxes for its tags.

Each checkbox renders the teacher-friendly label text. The internal state tracks the tag ID.

If existing needs are provided in the prompt, those checkboxes start checked. Otherwise all start unchecked.

### Teaching Context Section

Below the learning needs grid, under a "Teaching Context" heading with a note: "Optional — helps tailor suggestions to your specific classroom."

Fields:

- **Grade range**: Dropdown select with options: "" (empty/placeholder "Select grade range"), "K-2", "3-5", "6-8", "9-12"
- **Subject areas**: Horizontal row of toggleable pill buttons: "ELA", "Math", "Science", "Social Studies", "Elective". Multiple can be selected. Selected pills use a filled style, unselected use an outline style.
- **Block length**: Number input with "minutes" label beside it. Placeholder: "e.g., 45"
- **Students have devices**: Toggle switch with "Yes" / "No" label that updates with the toggle state
- **State**: Text input, maxLength 2, uppercase, placeholder "e.g., TX"
- **Additional context**: Textarea, 2-3 rows, placeholder "Anything else that affects how you teach (co-teaching, small class, specific student population, etc.)"

If existing context is provided in the prompt, pre-fill these fields. Otherwise all start empty/default.

### Live Summary Panel

A card below the teaching context section with a light gray background. Updates in real time as the teacher interacts. Contains:

- Counts: "N learning needs selected: X representation, Y expression, Z engagement" — only show categories with counts > 0
- If any needs are selected, a natural language sentence: "Your classroom includes learners who need [comma-separated labels from representation] for receiving information; [expression labels] for demonstrating learning; and [engagement labels] for engagement." Only include categories that have selections. Use the short display labels, not tag IDs.
- If no needs are selected: "No learning needs selected yet. Check the boxes above to describe your classroom."

### Copy Button Section

A prominent button at the bottom of the artifact.

Use the clipboard fallback function from the Clipboard Fallback reference for all copy operations.

Determine the mode from context: if existing needs were provided, this is **edit mode**. Otherwise, this is **setup mode**.

**Setup mode — "Copy Profile" button:**

When clicked, assemble this exact text format and copy it:

```
CLASSROOM PROFILE
Grade Range: {value or "Not set"}
Subjects: {comma-separated selected subjects or "Not set"}
Block Length: {value} minutes {or "Not set"}
Devices: {Yes or No or "Not set"}
State: {value or "Not set"}
Additional Context: {value or "None"}

Learning Needs:
- Representation: {comma-separated tag IDs of checked representation tags}
- Expression: {comma-separated tag IDs of checked expression tags}
- Engagement: {comma-separated tag IDs of checked engagement tags}
```

Omit category lines from Learning Needs if no tags are checked in that category.

After copying, replace the button text with a checkmark and "Copied! Paste this into the conversation and I'll save your profile." for 3 seconds, then revert.

**Edit mode — "Copy Changes" button:**

Track the initial state (from the existing needs/context provided in the prompt). When the button is clicked, compute the delta and copy this format:

```
PROFILE CHANGES
Added: {comma-separated tag IDs that are now checked but weren't before}
Removed: {comma-separated tag IDs that were checked before but aren't now}
Context Updated: {only fields that changed, as key = value pairs, one per line}
```

Omit "Added:" if nothing was added. Omit "Removed:" if nothing was removed. Omit "Context Updated:" if no context fields changed. If nothing changed at all, copy "No changes made." and show a message saying "No changes to copy."

After copying, replace the button text with a checkmark and "Copied! Paste this into the conversation and I'll save your changes." for 3 seconds, then revert.

In edit mode, also show a smaller secondary "Copy Full Profile" link/button below the main button in case the teacher wants to overwrite their entire profile rather than send a delta.

### Accessibility

- Every colored element (column headers, pills) must also have a text label. Color is never the sole indicator of category.
- All checkboxes and form inputs must be keyboard-navigable (standard HTML behavior — do not break it with custom handlers).
- Toggle switch must have an accessible label.
- Minimum contrast: follow Tailwind's default color palette which meets WCAG AA.
- The column header bars should include both the category name AND the description text, not just a colored stripe.

### Styling Notes

- Use Tailwind utility classes only. No external CSS.
- Color scheme: blue-500 for Representation, green-500 for Expression, amber-500 for Engagement. These are consistent across all artifacts.
- The overall container should have `max-w-4xl mx-auto` and reasonable padding.
- Checkbox labels should have enough vertical spacing to be easily tappable on mobile.
- The copy button should be visually prominent: full-width, larger padding, strong background color (blue-600 or similar).
- Keep the visual hierarchy clear: learning needs grid is the hero, teaching context is secondary, summary is informational, copy button is the call to action.
