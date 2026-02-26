Load project context for this workspace.

$ARGUMENTS

<context>
$(cd ~/Developer/ember-os && npx tsx scripts/context-snapshot.ts --project nourish 2>/dev/null)
</context>

You are working in the **Nourish** project. The context above shows current tasks, metrics, strategy, and recent decisions for this project.

This project is managed by Ember OS (Jake Clarke's AI Chief of Staff). Key things:
- Project context lives in context/ (founder, strategy, processes, people, decisions, lessons)
- Do NOT commit or push — the Ember orchestrator handles git operations
- Stay within task scope and follow existing patterns

If arguments were provided above, focus your attention on that topic.
