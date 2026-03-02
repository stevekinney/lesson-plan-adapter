Generate a single React artifact that serves as the teacher's classroom profile setup interface. Do not include any explanatory prose before or after the artifact. The artifact IS the entire response.

{existingNeeds}

{existingContext}

## Profile Setup

Build a self-contained interactive React component using Tailwind utility classes. All state is managed via `useState` — no external data fetching, no `window.storage`, no API calls.

### Mode Detection

- If existing needs are provided above, this is **edit mode**: pre-check those tags, show "Copy Changes" as primary and "Copy Full Profile" as secondary action.
- Otherwise, this is **setup mode**: all checkboxes unchecked, show "Copy Profile" button.

### Layout Structure

1. **Header** with title (mode-dependent) and subtitle explaining the purpose
2. **Learning Needs Grid** organized by UDL category (three columns on desktop, stacked on mobile) — see the Taxonomy Reference below for the complete tag list
3. **Teaching Context Section** with optional fields for grade range, subjects, block length, devices, state, additional context, teaching priorities, and known constraints
4. **Live Summary Panel** showing real-time count and natural language description of selected needs
5. **Copy Button(s)** using the clipboard fallback pattern — see the Onboarding Artifact Specification reference below for exact copy formats and UI details
