# Ease Talk: Human-Centric Communication Layer

## Overview

**Ease Talk** is a next-generation communication system that combines Slack's collaboration power with Apple's minimalist design and Ease's psychological depth. Every message lives in context, adapts to personality types, and prioritizes *calm, purpose-driven communication* over reactive chaos.

---

## Core Philosophy

1. **Less noise, more meaning**: No endless scrolling. Every thread has a purpose.
2. **Context-aware**: Messages belong to projects, meetings, topics, or DMs—never floating in isolation.
3. **Personality-driven**: AI adapts tone based on user's personality type, mood, workload, and stress level.
4. **Emotionally intelligent**: Sentiment tracking, reflective questions, and empathetic responses.

---

## Architecture

### Database Schema

#### Spaces (`talk_spaces`)
Container for conversations. Types:
- **project**: Linked to a specific project
- **meeting**: Linked to a meeting
- **topic**: General discussion (e.g., "Engineering", "Design")
- **dm**: Direct message between users

#### Threads (`talk_threads`)
Focused conversations within a space. Each thread has:
- Title (required)
- Context summary (AI-generated)
- Participant count
- Last message timestamp
- Resolved status

#### Messages (`talk_messages`)
Individual messages with rich metadata:
- Content & attachments
- **Sentiment**: positive, neutral, negative, supportive, concerned, excited, stressed
- **Tone analysis**: clarity, empathy, urgency, supportiveness, formality (0-1 scale)
- **Context tags**: `['decision', 'blocker', 'celebration']`
- **AI summary**: Short summary for long messages
- **Suggested actions**: `[{ type: 'task', text: 'Follow up with team' }]`

#### Reactions (`talk_reactions`)
Emotional reactions (Slack-style): 👍, ❤️, 🎉, 🤔, 😔

#### Participants (`talk_participants`)
Track who's actively involved, last read timestamp, muted status.

#### Thread Context (`talk_thread_context`)
Links threads to external entities (tasks, meetings, projects, documents).

---

## Personality Adaptation

### Personality Types

| Type     | MBTI Examples | Writing Style                     | Preferred Tone          |
|----------|---------------|-----------------------------------|-------------------------|
| Analyst  | INTJ, INTP    | Concise, logical, data-driven     | Direct, minimal         |
| Diplomat | INFJ, ENFP    | Empathetic, metaphorical          | Warm, encouraging       |
| Sentinel | ESTJ, ISFJ    | Practical, step-by-step           | Clear, firm             |
| Explorer | ESFP, ENTP    | Spontaneous, creative             | Lively, friendly        |

### Context-Aware Responses

**Stress high → Calm guidance**:
> "Let's take this one step at a time—what's the smallest next move?"

**Workload overwhelmed → Brevity**:
> "Quick summary: [2-3 sentences max]"

**Mood low → Empathy**:
> "It seems like this topic feels heavy. Should we simplify or reschedule?"

**Energy high → Match momentum**:
> "Great energy today! Want to document this as a best practice?"

---

## API Endpoints

### Spaces

**GET `/api/[orgSlug]/talk/spaces`**
- Query: `?space_type=project&space_ref_id=uuid`
- Returns: List of spaces with metadata

**POST `/api/[orgSlug]/talk/spaces`**
- Body: `{ space_type, space_ref_id?, title, description? }`
- Returns: Created space

### Threads

**GET `/api/[orgSlug]/talk/threads`**
- Query: `?space_id=uuid&include_resolved=false`
- Returns: Threads with unread counts per user

**POST `/api/[orgSlug]/talk/threads`**
- Body: `{ space_id, title, context_summary?, context?: [{ type, id, metadata }] }`
- Returns: Created thread with participant

### Messages

**GET `/api/[orgSlug]/talk/messages`**
- Query: `?thread_id=uuid&limit=50&before=ISO_timestamp`
- Returns: Messages with reactions, profiles, tone analysis
- Side effect: Marks thread as read for current user

**POST `/api/[orgSlug]/talk/messages`**
- Body: `{ thread_id, message, attachments?, context_tags? }`
- AI analysis: Sentiment detection + tone analysis (if TEAM+ tier)
- Returns: Created message with enriched metadata

---

## AI Mediator (`lib/ai-mediator.ts`)

### Core Functions

#### `analyzeMessageTone(message: string): Promise<ToneAnalysis>`
Returns:
```typescript
{
  clarity: 0.8,        // 0-1: How clear/understandable
  empathy: 0.6,        // 0-1: Emotional awareness
  urgency: 0.3,        // 0-1: Time sensitivity
  supportiveness: 0.7, // 0-1: Encouraging vs. directive
  formality: 0.4       // 0-1: Casual vs. formal
}
```

#### `detectSentiment(message: string): Promise<MessageSentiment>`
Returns:
```typescript
{
  label: "supportive",  // positive, neutral, negative, supportive, concerned, excited, stressed
  confidence: 0.85      // 0-1
}
```

#### `generateAdaptiveReply(message: string, context: UserContext): Promise<string>`
Generates reply adapted to:
- User's personality type (analyst, diplomat, sentinel, explorer)
- Current mood (high, neutral, low)
- Workload level (light, moderate, high, overwhelmed)
- Stress level (calm, focused, stressed, critical)

#### `summarizeThread(messages: Message[], context: UserContext): Promise<string>`
Returns personality-aware summary:
- Analysts: Data-driven, concise
- Diplomats: Narrative-style, empathetic
- Sentinels: Action-oriented, structured
- Explorers: Creative, conversational

#### `generateReflectiveQuestion(threadContext: string, userContext: UserContext): Promise<string>`
Examples:
- "What's the smallest next step we could take here?"
- "Does this approach feel aligned with our goal?"
- "Should we simplify this before moving forward?"

#### `getAdaptiveGreeting(context: UserContext): string`
Context-aware greetings:
- High stress: "Let's take this one step at a time. What's on your mind?"
- Low mood: "I'm here to help. What would be most useful for you today?"
- High energy: "Great energy today! What are we tackling?"

---

## React Hooks

### `usePersonalityContext()`
Fetches current user's:
- Personality type (from `behavioral_profiles`)
- Mood level (from `context_snapshots`)
- Workload level
- Stress level
- Energy level

Returns:
```typescript
{
  userId: string;
  personality?: PersonalityType;
  mood?: MoodLevel;
  workload?: WorkloadLevel;
  stress?: StressLevel;
  energyLevel?: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
```

### `useAdaptiveReply()`
Generates AI replies adapted to user context.

```typescript
{
  reply: string | null;
  isGenerating: boolean;
  error: string | null;
  generateReply: (message: string, context: UserContext) => Promise<void>;
  getGreeting: (context: UserContext) => string;
}
```

---

## Frontend Components

### `<MessageInput />`
Apple-style composer with:
- Auto-resizing textarea
- Context hint ("Replying to: Meeting Summary")
- Real-time tone analysis
- Communication suggestions
- Tone indicators (Clear ✓, Empathetic ♥, Urgent ⚡)
- Keyboard shortcut: `⌘↩` to send

### `<ThreadView />`
Clean message display:
- Grouped by sender (avatar shown on first message)
- Sentiment badges
- Tone analysis for own messages
- Reactions grouped by emoji
- Auto-scroll to latest message
- Timestamp formatting ("2m ago", "5h ago")

### `<AIInsightPanel />`
Right sidebar with:
- Thread summary
- Mood trend visualization
- Related tasks/meetings
- Reflective questions
- Suggested next actions

### `<SpacesList />`
Left sidebar navigation:
- Spaces grouped by type (Projects, Meetings, Topics, DMs)
- Unread counts
- Quick space creation

---

## UI Design Principles

### Typography
- **Base size**: 15-16px
- **Font**: Inter or SF Pro
- **Line height**: 1.5
- **Hierarchy**: Subtle size differences, bold for emphasis

### Spacing
- Large breathing room (like Apple Notes)
- 24-32px between sections
- 12-16px between elements

### Colors
- **Base**: White background, gray-900 text
- **Accents**: Minimal use—blue for links, green for positive sentiment, orange for warnings
- **Sentiment colors**:
  - Positive/Supportive: Green
  - Negative/Stressed: Red
  - Concerned: Orange
  - Neutral: Gray

### Animations
- Smooth transitions (200-300ms)
- Fade in/out for panels
- Slide up for new messages
- No aggressive motion—calm and intentional

---

## Subscription Tiers

| Feature                     | FREE | TEAM | BUSINESS | ENTERPRISE |
|-----------------------------|------|------|----------|------------|
| Basic messaging             | ✅   | ✅   | ✅       | ✅         |
| Create threads              | ✅   | ✅   | ✅       | ✅         |
| AI summaries & tone analysis| ❌   | ✅   | ✅       | ✅         |
| Sentiment tracking          | ❌   | ❌   | ✅       | ✅         |
| Personality adaptation      | ❌   | ❌   | ✅       | ✅         |
| Advanced analytics          | ❌   | ❌   | ❌       | ✅         |

---

## Integration with Meetings

After a meeting ends:
1. Auto-create Talk thread in meeting space
2. Insert AI-generated summary as first message
3. Tag relevant participants
4. Link to meeting recording & transcript

```typescript
// Post-meeting hook
async function onMeetingEnd(meetingId: string) {
  const summary = await generateMeetingSummary(meetingId);
  
  await createTalkThread({
    space_type: 'meeting',
    space_ref_id: meetingId,
    title: `Meeting Summary: ${meeting.title}`,
    first_message: summary,
    context: [
      { type: 'meeting', id: meetingId },
      { type: 'recording', id: recordingId },
    ],
  });
}
```

---

## Security & RLS

- **RLS policies**: Users can only access spaces in their org
- **Feature gating**: AI features locked behind TEAM+ tiers
- **Privacy**: Sentiment/tone data never shared—only visible to sender
- **Encryption**: Messages encrypted at rest (Supabase default)

---

## Usage Examples

### Creating a Space
```typescript
const res = await fetch(`/api/${orgSlug}/talk/spaces`, {
  method: "POST",
  body: JSON.stringify({
    space_type: "project",
    space_ref_id: projectId,
    title: "Website Redesign Discussion",
    description: "Design decisions and feedback",
  }),
});
```

### Sending a Message with Tone Analysis
```typescript
const res = await fetch(`/api/${orgSlug}/talk/messages`, {
  method: "POST",
  body: JSON.stringify({
    thread_id: "uuid",
    message: "I think we should simplify the navigation. Thoughts?",
    context_tags: ["decision", "design"],
  }),
});
// Returns message with tone_analysis and sentiment
```

### Getting Adaptive Reply
```typescript
const context = usePersonalityContext();
const { generateReply, reply } = useAdaptiveReply();

await generateReply("Can we discuss the timeline?", context);
// Reply adapts to user's personality and current state
```

---

## Future Enhancements

1. **Voice messages** with sentiment analysis
2. **Thread templates** (standup, retrospective, brainstorm)
3. **Smart notifications** (only urgent + contextual)
4. **Auto-tagging** of decisions, action items, blockers
5. **Mood-based Do Not Disturb** (auto-mute when stressed)
6. **Team communication health dashboard** (ENTERPRISE tier)

---

## END GOAL

Ease Talk should feel like:
- 🧠 **Slack's collaboration power** — organized, threaded, searchable
- 🪶 **Apple's clarity** — minimal UI, intentional interactions, beautiful typography
- 💬 **Human empathy from Ease** — context-aware, personality-driven, emotionally intelligent

**Less noise. More meaning. Always in context.**
