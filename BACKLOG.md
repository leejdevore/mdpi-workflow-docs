# MDPI Workflow Docs — Feature Backlog

## Completed

### Phase 1: Core Swimlane Diagram
- [x] Next.js + React Flow project scaffold
- [x] 6 swimlane lanes (Vendors, PM, Dev Exec, Exec Approval, Ownership, Billing Platform)
- [x] Current State workflow (38 steps, check + ACH payment paths)
- [x] Custom ProcessNode with step type colors, document indicators
- [x] Click-to-expand NodeDetailPanel (description, documents, pain points, improvements, tools)
- [x] SwimlaneBackground, LaneHeaders, CustomEdge
- [x] GitHub repo: leejdevore/mdpi-workflow-docs

### Phase 2: Multiple Workflow Views
- [x] Digitized view (40 steps — same flow, software automation)
- [x] Transformed view (15 steps — APIs, MCP servers, AI agents)
- [x] Tab switching with clean React Flow remounts

### Phase 3: Impact Scoring
- [x] ImpactScore interface (Consistency, Cost, Control — each 1-5)
- [x] Total Change Impact Score (3-15) per step
- [x] Color-coded impact dots on ProcessNode
- [x] Detailed impact assessment in NodeDetailPanel with bar charts

### Phase 4+5: Comparison Modes
- [x] ViewModeSelector (Tabs / Overlay / Slider)
- [x] Overlay: primary view + ghost views at 20% opacity, desaturated
- [x] Slider: draggable divider, clip-path, synced viewport pan/zoom
- [x] View labels, controls, and swap button

### Phase 6: Deployment
- [x] Vercel deployment: https://mdpi-workflow-docs.vercel.app
- [x] GitHub auto-deploy connected

---

## Backlog — Prioritized

### 1. Manual Editing Tools
**Priority: HIGH — Foundation for all interactive features**

- [ ] Toolbar with standard workflow shapes (process, decision, document, data, start/end, manual operation, subprocess)
- [ ] Add node: click toolbar shape → click canvas to place
- [ ] Edit node: double-click to open inline editor (title, description, actor, step type, documents, impact scores)
- [ ] Delete node: select + delete key, with confirmation
- [ ] Add edge: drag from source handle to target handle
- [ ] Edit edge: click to set label, conditional type, animated
- [ ] Delete edge: select + delete key
- [ ] Move node: drag to reposition within swimlane
- [ ] Undo/redo stack (Ctrl+Z / Ctrl+Shift+Z)
- [ ] Shape assignment based on step type (process=rectangle, decision=diamond, document=doc shape, data=parallelogram)

### 2. Persistence Layer
**Priority: HIGH — Required before versioning or AI**

- [ ] Database setup (Supabase or similar — user auth, workflow storage)
- [ ] Save/load workflow views to database
- [ ] User sessions and authentication
- [ ] Named workflows with metadata (title, description, created date, last modified)
- [ ] Auto-save on edit (debounced)
- [ ] Export to JSON / import from JSON (offline support)

### 3. Version Control
**Priority: HIGH — Non-destructive editing history**

- [ ] Snapshot system: save named versions of a workflow
- [ ] Auto-generated description for each version (AI-powered)
- [ ] Timeline/history view — browse versions chronologically
- [ ] Diff view: highlight what changed between two versions
- [ ] Restore: revert to any previous version (non-destructive — creates new version)
- [ ] Branch: create variant from any version point
- [ ] Version naming and user-editable descriptions

### 4. QA/QC & Validation Step Markers
**Priority: MEDIUM — Small feature, high value**

- [ ] New step type: `validation` (QA/QC checkpoint)
- [ ] Visual indicator: distinct shape/color for human validation steps
- [ ] Mark steps as "requires human review" even in automated/transformed flows
- [ ] Validation step detail: what is being checked, acceptance criteria, who validates
- [ ] Toggle to show/hide validation overlay across views

### 5. Comparison Matrix & Workflow Scoring
**Priority: MEDIUM — Builds on version control**

- [ ] Overall workflow score: aggregate impact scores across all steps
- [ ] Score breakdown: total Consistency, Cost, Control scores
- [ ] Step count, automation percentage, estimated cycle time
- [ ] Comparison matrix: side-by-side table of N workflow versions
- [ ] Matrix columns: name, step count, manual/auto ratio, total impact, cycle time estimate
- [ ] Sortable and filterable matrix
- [ ] Export matrix to CSV/PDF

### 6. AI Chat Interface
**Priority: HIGH (value) / MEDIUM (sequence) — Depends on 1-3**

- [ ] Chat panel (slide-out from right, or bottom panel)
- [ ] Natural language workflow editing ("add a review step after invoice processing")
- [ ] "What if" scenario exploration ("what if we adopted Procore for data storage?")
- [ ] AI generates new workflow version from prompt
- [ ] Auto-named versions with AI-generated descriptions
- [ ] Conversational history per workflow
- [ ] AI explains differences between versions
- [ ] AI suggests improvements based on pain points and impact scores
- [ ] Context-aware: AI understands current workflow structure, actors, step types

### 7. Clean-up Agent
**Priority: LOW — Polish feature, depends on 1 and 6**

- [ ] Auto-assign workflow shapes based on step description and linked data
- [ ] Auto-assign step types (manual/automated/data-driven/hybrid) from context
- [ ] Layout optimization: reflow nodes for clean swimlane alignment after manual edits
- [ ] Suggest edge connections based on logical flow
- [ ] Detect duplicate or redundant steps
- [ ] Normalize naming conventions across steps

---

## Technical Debt & Polish

- [ ] Responsive design improvements for mobile/tablet
- [ ] Keyboard navigation (arrow keys to navigate nodes, Enter to open details)
- [ ] Accessibility audit (ARIA labels, screen reader support)
- [ ] Dark mode support
- [ ] Performance optimization for large workflows (100+ nodes)
- [ ] Error boundaries and loading states
- [ ] Unit tests for data transformation hooks
- [ ] E2E tests for comparison modes
