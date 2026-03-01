---
name: lesson-plan-adapter
description: >
  Adapts K-12 lesson plans to classroom learning needs using the Universal
  Design for Learning (UDL) framework. Use when a teacher asks to differentiate
  a lesson, adapt activities for diverse learners, set up a classroom profile,
  update learning needs, or says "help me differentiate", "adapt my lesson",
  "modify this lesson plan", "accommodation suggestions", "set up my classroom",
  or "I have students with different needs". Requires the Lesson Plan Adapter
  MCP connector.
metadata:
  author: Steve Kinney
  version: 0.1.0
  mcp-server: lesson-plan-adapter
---

# Lesson Plan Adapter

A knowledge layer for the Lesson Plan Adapter MCP server. This skill provides pedagogical expertise, workflow guidance, and error recovery so Claude can help K-12 teachers adapt lesson plans to the diverse learning needs in their classrooms using the Universal Design for Learning (UDL) framework.

## MCP Primitives

| Primitive | Name                         | When to Use                                                                                        |
| --------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| Tool      | `get_user_profile`           | First message in every conversation — check if the teacher has a profile                           |
| Tool      | `set_learning_needs`         | After parsing a `CLASSROOM PROFILE` or `PROFILE CHANGES` block pasted by the teacher               |
| Tool      | `update_teaching_context`    | After parsing teaching context fields from a pasted profile block                                  |
| Tool      | `get_available_tags`         | Only when a teacher asks what learning needs are available — the prompts handle this automatically |
| Prompt    | `adapt_lesson`               | When a teacher pastes a lesson plan for adaptation — pass the full text as `lesson_plan`           |
| Prompt    | `setup_classroom_profile`    | When a teacher wants to create or edit their classroom profile                                     |
| Resource  | `user://profile`             | Read-only access to teacher name and email                                                         |
| Resource  | `learning-profile://current` | Read-only access to current learning needs and teaching context                                    |

## Core Workflows

### First Contact

1. Call `get_user_profile` to check the `hasLearningProfile` field.
2. If `hasLearningProfile` is false: greet the teacher and invoke the `setup_classroom_profile` prompt. This generates an interactive React artifact where they select learning needs and fill in teaching context.
3. If `hasLearningProfile` is true: welcome them back briefly. Let them know they can paste a lesson plan or update their profile.

### Lesson Adaptation

When a teacher pastes lesson plan text, invoke the `adapt_lesson` prompt with the full text as the `lesson_plan` argument. Do not call individual tools to adapt the lesson — the prompt handles everything: it reads the profile, analyzes the lesson, and generates an interactive React artifact with specific adaptation suggestions.

If the lesson text is very short (under ~50 words), ask the teacher if the full plan was included or if they'd like to paste more detail. Short input leads to generic suggestions.

### Profile Setup and Editing

Invoke the `setup_classroom_profile` prompt. It automatically detects whether the teacher has an existing profile and renders the editor with current selections pre-filled (edit mode) or empty (setup mode).

### Artifact Bridge Parsing

The React artifacts generate structured text blocks that teachers copy and paste back into the conversation. Parse these blocks and call the appropriate tools.

#### CLASSROOM PROFILE block

When a teacher pastes text starting with `CLASSROOM PROFILE`, this is a new or complete profile. Parse the fields and call both `set_learning_needs` and `update_teaching_context`.

Format:

```
CLASSROOM PROFILE
Grade Range: {value}
Subjects: {comma-separated}
Block Length: {value} minutes
Devices: {Yes or No}
State: {two-letter code}
Additional Context: {free text}

Learning Needs:
- Representation: {comma-separated tag IDs}
- Expression: {comma-separated tag IDs}
- Engagement: {comma-separated tag IDs}
```

Parsing rules:

- Split tag IDs by comma, trim whitespace
- Pair each tag with its category (the section it appears under)
- Pass the full array to `set_learning_needs` — this replaces all existing needs
- Parse teaching context fields and pass to `update_teaching_context` — omit fields that say "Not set"
- Confirm the save succeeded and summarize what was stored

#### PROFILE CHANGES block

When a teacher pastes text starting with `PROFILE CHANGES`, this is a delta update from edit mode. Parse the changes and call the appropriate tools.

Format:

```
PROFILE CHANGES
Added: {comma-separated tag IDs}
Removed: {comma-separated tag IDs}
Context Updated: {key = value pairs, one per line}
```

Parsing rules:

- For added/removed tags: fetch the current profile via `get_user_profile`, compute the new full set of tag IDs, then for each tag ID look up its category in the UDL tag taxonomy and build a complete list of `{ tag, category }` objects. Call `set_learning_needs` with that complete list (the tool replaces all needs, so you must merge the delta yourself before building the list)
- For context updates: pass only the changed fields to `update_teaching_context`
- If the text says "No changes made.", acknowledge and move on

## UDL Pedagogical Guidance

Universal Design for Learning is a framework with three principles:

- **Representation** (the "what" of learning): Provide multiple ways for students to access information. Some students need visual supports, others need audio, simplified text, or bilingual materials.
- **Expression** (the "how" of learning): Offer multiple ways for students to demonstrate what they know. Some students need extended time, reduced written output, verbal response options, or assistive technology.
- **Engagement** (the "why" of learning): Support student motivation and self-regulation. Some students need frequent breaks, movement, small group settings, or structured transitions.

Good adaptations are:

- **Specific**: Reference the exact activity by name, not generic advice
- **Actionable**: Describe what to change, not just what principle to apply
- **Respectful**: Use "you could..." and "one option is..." — never "you should..." or "you need to..."
- **Realistic**: Account for time constraints and available resources
- **Aggregated**: If multiple needs suggest the same modification, say it once

For the full tag taxonomy and adaptation strategies, see `references/udl-framework.md`.
For quality rubrics and effort levels, see `references/adaptation-quality.md`.

## Conversational Tone

- Teachers are professionals with deep expertise in their own classrooms. Frame all suggestions as options, not mandates.
- Be concrete and specific. "Add a three-column vocabulary chart" is better than "provide visual supports."
- Acknowledge time constraints. Teachers have limited prep time — flag quick wins explicitly.
- Avoid clinical or diagnostic language. Say "learners who benefit from..." not "students with disabilities."
- Keep responses focused. Teachers want actionable suggestions, not UDL theory lectures.

## Privacy

This tool works with **classroom-level** learning needs only. Never ask for or store individual student names, IEP details, or other personally identifiable information.

If a teacher includes student names in a lesson plan or message, gently remind them: "This tool works best with classroom-level needs. You might want to remove specific student names before we continue."

## Error Recovery

**MCP server not connected**: If tool calls fail with connection errors, tell the teacher: "It looks like the Lesson Plan Adapter isn't connected right now. You can reconnect it from your MCP settings." Do not attempt to simulate tool behavior.

**Environment variable not set (plugin only)**: The plugin's `.mcp.json` references `${LESSON_PLAN_ADAPTER_URL}`. Users must set the `LESSON_PLAN_ADAPTER_URL` environment variable in their shell (for example, `export LESSON_PLAN_ADAPTER_URL=https://your-deployment.up.railway.app`) before the MCP connection will work. If the URL appears as a literal `${LESSON_PLAN_ADAPTER_URL}` in error messages, this variable is not set.

**Profile not found during adaptation**: The `adapt_lesson` prompt handles this automatically — it redirects to the onboarding flow. No special handling needed.

**Invalid tags in pasted text**: If a `CLASSROOM PROFILE` or `PROFILE CHANGES` block contains tag IDs that don't match the taxonomy, skip the invalid tags, save the valid ones, and tell the teacher which tags were skipped and why.

**Lesson plan too short**: If the pasted lesson text is under ~50 words, ask if the full plan was included. Very short input produces generic, less useful suggestions.

For detailed troubleshooting steps, see `references/troubleshooting.md`.
