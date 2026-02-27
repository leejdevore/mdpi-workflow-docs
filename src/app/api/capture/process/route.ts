import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  createWorkflow,
  createScenario,
  createVersion,
  insertSteps,
  insertEdges,
} from '@/lib/supabase/queries';
import type {
  WorkflowStep,
  WorkflowEdge,
  ActorDefinition,
  PhaseDefinition,
} from '@/types/workflow';

export const maxDuration = 120; // 2 minutes for AI processing

// ─── Request / Response types ────────────────────────────

interface ProcessRequest {
  sessionId: string;
  workflowName?: string;
}

interface CaptureEntryRow {
  id: string;
  entry_number: number;
  title: string;
  notes: string;
  screenshot_path: string | null;
  voice_transcript: string | null;
  active_app: string | null;
  captured_at: string;
}

interface AIWorkflowOutput {
  actors: ActorDefinition[];
  phases: PhaseDefinition[];
  steps: Array<{
    tempId: string;
    stepNumber: number;
    title: string;
    description: string;
    actorId: string;
    phaseId: string;
    stepType: 'manual' | 'automated' | 'data-driven' | 'hybrid';
    shape: string;
    column: number;
    documents?: string[];
    painPoints?: string[];
    improvements?: string[];
    toolsUsed?: string[];
  }>;
  edges: Array<{
    sourceTempId: string;
    targetTempId: string;
    label?: string;
    edgeType?: 'default' | 'conditional';
  }>;
}

// ─── System prompt ───────────────────────────────────────

const SYSTEM_PROMPT = `You are a workflow analysis expert. You will receive raw capture data from someone who recorded their work process in real-time — a series of timestamped steps with titles and optional notes.

Your job is to analyze this raw capture data and produce a structured workflow definition with:

1. **Actors** (swimlane lanes): Identify the distinct roles/people/systems involved. Each actor needs:
   - id: lowercase-hyphenated identifier (e.g., "property-manager", "accounting-system")
   - label: Human-readable name (e.g., "Property Manager")
   - shortLabel: 2-4 char abbreviation (e.g., "PM")
   - color: A hex color from this palette: #3b82f6, #10b981, #f59e0b, #ef4444, #8b5cf6, #ec4899, #06b6d4, #84cc16
   - order: Sequential number starting at 0

2. **Phases** (workflow stages/columns): Group steps into logical phases. Each phase needs:
   - id: lowercase-hyphenated identifier (e.g., "intake", "review", "processing")
   - label: Human-readable name (e.g., "Intake & Setup")
   - color: A hex color from the same palette
   - order: Sequential number starting at 0

3. **Steps**: Each captured step becomes one or more workflow steps:
   - tempId: Unique temporary ID (e.g., "step-1", "step-2") for edge references
   - stepNumber: Sequential order
   - title: Concise action title (e.g., "Review application")
   - description: Detailed description incorporating the original notes
   - actorId: Which actor performs this step
   - phaseId: Which phase this belongs to
   - stepType: "manual", "automated", "data-driven", or "hybrid"
   - shape: "process" (default), "decision" (for branching), "document", "data", "start-end", "validation"
   - column: Position within the phase (0-based, increment for each step in same phase)
   - documents: Optional array of document names referenced
   - painPoints: Optional array of identified pain points
   - improvements: Optional array of suggested improvements
   - toolsUsed: Optional array of tools/software mentioned

4. **Edges** (connections): Define the flow between steps:
   - sourceTempId: The step this edge comes from
   - targetTempId: The step this edge goes to
   - label: Optional label (especially for decision branches like "Yes"/"No")
   - edgeType: "default" or "conditional"

Guidelines:
- Infer actors from context (who is doing each step)
- Group consecutive related steps into phases
- Add decision points where the capture shows branching logic
- Include start and end nodes
- Keep titles concise (under 50 characters)
- Every step must connect to at least one other step via edges
- The workflow should flow left-to-right through phases

Return ONLY valid JSON matching the structure above. No markdown, no explanation — just the JSON object with keys: actors, phases, steps, edges.`;

// ─── POST handler ────────────────────────────────────────

export async function POST(request: Request) {
  // Validate API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'Anthropic API key not configured' },
      { status: 500 },
    );
  }

  // Parse request
  let body: ProcessRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { sessionId, workflowName } = body;
  if (!sessionId) {
    return Response.json(
      { error: 'sessionId is required' },
      { status: 400 },
    );
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Load session
    const { data: session, error: sessionError } = await supabase
      .from('capture_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return Response.json(
        { error: `Session not found: ${sessionError?.message}` },
        { status: 404 },
      );
    }

    // Load entries
    const { data: entries, error: entriesError } = await supabase
      .from('capture_entries')
      .select('*')
      .eq('session_id', sessionId)
      .order('entry_number', { ascending: true });

    if (entriesError) {
      return Response.json(
        { error: `Failed to load entries: ${entriesError.message}` },
        { status: 500 },
      );
    }

    if (!entries || entries.length === 0) {
      return Response.json(
        { error: 'No entries found in this session' },
        { status: 400 },
      );
    }

    // Mark session as processing
    await supabase
      .from('capture_sessions')
      .update({ status: 'processing' })
      .eq('id', sessionId);

    // Build the capture data prompt
    const captureData = (entries as CaptureEntryRow[])
      .map((e) => {
        let line = `Step ${e.entry_number}: ${e.title}`;
        if (e.notes) line += `\n  Notes: ${e.notes}`;
        if (e.active_app) line += `\n  App: ${e.active_app}`;
        if (e.voice_transcript) line += `\n  Voice: ${e.voice_transcript}`;
        line += `\n  Time: ${new Date(e.captured_at).toLocaleTimeString()}`;
        return line;
      })
      .join('\n\n');

    const userMessage = `Here is the raw capture data from a workflow recording session titled "${session.title}":\n\n${captureData}\n\nAnalyze this and generate a structured workflow definition as JSON.`;

    // Call Claude
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    // Extract JSON from response
    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    let aiOutput: AIWorkflowOutput;
    try {
      // Try parsing directly
      aiOutput = JSON.parse(responseText);
    } catch {
      // Try extracting JSON from markdown code block
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        aiOutput = JSON.parse(jsonMatch[1].trim());
      } else {
        await supabase
          .from('capture_sessions')
          .update({ status: 'completed' })
          .eq('id', sessionId);

        return Response.json(
          { error: 'Failed to parse AI response as JSON', raw: responseText },
          { status: 500 },
        );
      }
    }

    // Create the workflow in the database
    const name =
      workflowName || session.title || 'Captured Workflow';

    const workflow = await createWorkflow(
      name,
      `Auto-generated from capture session on ${new Date(session.started_at).toLocaleDateString()}`,
      aiOutput.actors,
      aiOutput.phases,
    );

    // Create a scenario (type: existing — this is the current/as-is process)
    const scenario = await createScenario(
      workflow.id,
      'Current State',
      'existing',
      0,
      'Captured from real-time workflow observation',
    );

    // Create version 1
    const version = await createVersion(
      scenario.id,
      1,
      'ai-generated',
      'From capture session',
    );

    // Build steps with real IDs, mapping tempId → real UUID
    const tempIdToRealId: Record<string, string> = {};
    const stepsToInsert: WorkflowStep[] = aiOutput.steps.map((s) => {
      const realId = crypto.randomUUID();
      tempIdToRealId[s.tempId] = realId;

      return {
        id: realId,
        versionId: version.id,
        stepNumber: s.stepNumber,
        title: s.title,
        description: s.description,
        actorId: s.actorId,
        phaseId: s.phaseId,
        stepType: s.stepType,
        shape: s.shape as WorkflowStep['shape'],
        column: s.column,
        documents: s.documents,
        painPoints: s.painPoints,
        improvements: s.improvements,
        toolsUsed: s.toolsUsed,
      };
    });

    await insertSteps(stepsToInsert);

    // Build edges using the ID mapping
    const edgesToInsert: WorkflowEdge[] = aiOutput.edges
      .filter(
        (e) =>
          tempIdToRealId[e.sourceTempId] && tempIdToRealId[e.targetTempId],
      )
      .map((e) => ({
        id: crypto.randomUUID(),
        versionId: version.id,
        sourceStepId: tempIdToRealId[e.sourceTempId],
        targetStepId: tempIdToRealId[e.targetTempId],
        label: e.label,
        edgeType: e.edgeType || 'default',
      }));

    await insertEdges(edgesToInsert);

    // Update session: mark as processed, link to workflow
    await supabase
      .from('capture_sessions')
      .update({
        status: 'processed',
        workflow_id: workflow.id,
      })
      .eq('id', sessionId);

    return Response.json({
      success: true,
      workflowId: workflow.id,
      scenarioId: scenario.id,
      versionId: version.id,
      stepsCreated: stepsToInsert.length,
      edgesCreated: edgesToInsert.length,
      actorsCreated: aiOutput.actors.length,
      phasesCreated: aiOutput.phases.length,
    });
  } catch (err) {
    console.error('Capture processing error:', err);
    return Response.json(
      { error: `Processing failed: ${String(err)}` },
      { status: 500 },
    );
  }
}
