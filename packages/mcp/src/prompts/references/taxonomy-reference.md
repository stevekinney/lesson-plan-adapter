## Learning Needs Taxonomy

The full set of learning need tags organized by UDL category. The artifact must embed this as a JavaScript constant and render checkboxes for each tag.

### Column 1 — Representation (blue-500 accent): "How students best receive information"

| Tag ID                   | Label                                            |
| ------------------------ | ------------------------------------------------ |
| `visual-supports`        | Needs visual supports (diagrams, charts, images) |
| `audio-preferred`        | Learns best through listening                    |
| `text-read-aloud`        | Needs text read aloud                            |
| `simplified-text`        | Needs simplified or chunked text                 |
| `graphic-organizers`     | Benefits from graphic organizers                 |
| `bilingual-support`      | Needs bilingual or native language support       |
| `concrete-manipulatives` | Needs concrete/hands-on materials                |
| `color-coding`           | Benefits from color-coded materials              |
| `closed-captions`        | Needs captions on video/audio content            |
| `large-print`            | Needs large print or high-contrast materials     |

### Column 2 — Expression (green-500 accent): "How students best show what they know"

| Tag ID                   | Label                                            |
| ------------------------ | ------------------------------------------------ |
| `extended-time`          | Needs extended time on tasks and assessments     |
| `reduced-written-output` | Needs reduced written output                     |
| `verbal-response`        | Can demonstrate learning verbally                |
| `assistive-tech`         | Uses assistive technology (speech-to-text, etc.) |
| `alternative-assessment` | Needs alternative assessment formats             |
| `scribe-needed`          | Needs a scribe or dictation support              |
| `chunked-assignments`    | Needs assignments broken into smaller parts      |
| `word-bank`              | Benefits from word banks or sentence starters    |
| `model-examples`         | Needs model/example responses before starting    |
| `multiple-attempts`      | Benefits from multiple attempts or retakes       |

### Column 3 — Engagement (amber-500 accent): "What supports participation and focus"

| Tag ID                   | Label                                            |
| ------------------------ | ------------------------------------------------ |
| `frequent-breaks`        | Needs frequent breaks                            |
| `movement-needs`         | Needs movement opportunities                     |
| `preferential-seating`   | Benefits from preferential seating               |
| `small-group`            | Works best in small group settings               |
| `behavior-plan`          | Has a behavior intervention plan                 |
| `choice-based`           | Motivated by choice and autonomy                 |
| `sensory-regulation`     | Has sensory regulation needs                     |
| `structured-transitions` | Needs structured transitions between activities  |
| `positive-reinforcement` | Responds well to specific positive reinforcement |
| `reduced-distractions`   | Needs a reduced-distraction environment          |
| `check-ins`              | Benefits from frequent teacher check-ins         |
| `timer-visual`           | Uses visual timers for task pacing               |

### Data Embedding

Embed the taxonomy as a JavaScript constant inside the component:

```javascript
const TAXONOMY = {
  representation: [
    { tag: 'visual-supports', label: 'Needs visual supports (diagrams, charts, images)' },
    { tag: 'audio-preferred', label: 'Learns best through listening' },
    // ... include all 10 representation tags from the table above
  ],
  expression: [
    { tag: 'extended-time', label: 'Needs extended time on tasks and assessments' },
    // ... include all 10 expression tags from the table above
  ],
  engagement: [
    { tag: 'frequent-breaks', label: 'Needs frequent breaks' },
    // ... include all 12 engagement tags from the table above
  ],
};
```

Include every tag from the tables above. Do not omit any.
