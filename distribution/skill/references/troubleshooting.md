# Troubleshooting

Common issues and recovery steps for the Lesson Plan Adapter.

## MCP Server Not Connected

**Symptoms**: Tool calls return connection errors, timeouts, or "server not found" messages.

**Recovery**:

1. Tell the teacher: "It looks like the Lesson Plan Adapter isn't connected right now."
2. Direct them to reconnect:
   - **claude.ai**: Settings > Capabilities > MCP Servers > Reconnect
   - **Claude Code**: Check that the plugin is loaded with `/plugins` or restart with `--plugin-dir`
3. Do not attempt to simulate tool behavior or provide adaptation suggestions without the MCP server. The server holds the teacher's profile data.

## Profile Not Found During Adaptation

**Symptoms**: The `adapt_lesson` prompt returns an onboarding flow instead of adaptation suggestions.

**Why this happens**: The teacher hasn't set up their classroom profile yet, or their profile has zero learning needs selected.

**Recovery**: This is handled automatically. The `adapt_lesson` prompt detects the missing profile and redirects to the `setup_classroom_profile` onboarding flow. No special handling needed — just follow the onboarding artifact output.

## Lesson Plan Too Short

**Symptoms**: The teacher pastes a very brief lesson description (under ~50 words) and the adaptation suggestions are generic rather than specific.

**Recovery**:

1. Ask the teacher: "It looks like this might be a summary rather than the full lesson plan. Would you like to paste the complete plan with activity details? More detail helps me give you specific, actionable suggestions."
2. If the teacher confirms this is the full plan, proceed with the `adapt_lesson` prompt. Some suggestions will necessarily be more general, but the prompt will still produce useful output.
3. If the plan is a single activity with no clear phases, the prompt segments it as "Full Lesson" — this is expected behavior.

## Invalid Tags in Pasted Text

**Symptoms**: A `CLASSROOM PROFILE` or `PROFILE CHANGES` block contains tag IDs that don't match the taxonomy (typos, old tag names, or fabricated IDs).

**Recovery**:

1. Validate each tag ID against the taxonomy before calling `set_learning_needs`.
2. Save the valid tags normally.
3. Report the invalid tags to the teacher: "I saved your profile with N learning needs. I skipped these tags because they didn't match the available options: `invalid-tag-1`, `invalid-tag-2`. Would you like to see the full list of available learning needs?"
4. If they want the list, call `get_available_tags`.

## Teaching Context Parse Errors

**Symptoms**: A pasted `CLASSROOM PROFILE` block has malformed teaching context fields (missing values, wrong types, extra whitespace).

**Recovery**:

1. Parse what you can. Fields that say "Not set" or are empty should be omitted from the `update_teaching_context` call.
2. For `typicalBlockMinutes`, extract the numeric value and ignore any trailing text like "minutes."
3. For `state`, accept the value only if it's exactly 2 uppercase letters. Otherwise omit it.
4. For `studentsHaveDevices`, accept "Yes" as `true` and "No" as `false`. Anything else should be omitted.
5. Save what's valid and tell the teacher what was skipped.

## Profile Changes With No Current Profile

**Symptoms**: A teacher pastes a `PROFILE CHANGES` block (delta format) but has no existing profile.

**Recovery**:

1. The "Added" tags can still be saved — treat them as a fresh profile by calling `set_learning_needs` with just the added tags.
2. The "Removed" tags are no-ops (nothing to remove from).
3. Context fields can be saved normally via `update_teaching_context`.
4. Let the teacher know: "I created a new profile with the needs you added. Since there wasn't an existing profile, the 'Removed' tags were skipped."
