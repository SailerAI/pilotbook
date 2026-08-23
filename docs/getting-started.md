# Getting started

```bash
npx pilotbook init
pb new epic --title "Multi-tenant workspaces"
pb new story --epic EPIC-001 --title "Create a workspace"
pb new task --story US-001 --title "Workspaces schema" --area db
pb brief TASK-001
pb lint
```

Add to CI:

```yaml
- run: npx pilotbook lint --format github
```
