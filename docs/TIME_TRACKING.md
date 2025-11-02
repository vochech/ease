# Time Tracking System

## Koncept

Flexibilní sledování času pro týmy, agentury a externisty s RBAC a subscription-based přístupem.

**Hlavní use cases:**

- **Zaměstnanec/Freelancer**: Trackuje svůj čas na projektech a úkolech
- **Manager**: Schvaluje a exportuje timesheet pro fakturaci
- **Owner**: Nastavuje billable rates, generuje invoices

---

## Databázová struktura

### `time_entries`

Hlavní tabulka pro záznamy času.

```sql
CREATE TABLE time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Časové údaje
  started_at timestamptz NOT NULL,
  ended_at timestamptz,                    -- NULL = timer běží
  duration_minutes integer,                -- Počítané nebo manuálně zadané
  
  -- Vazby na práci
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  
  -- Popis
  description text,
  tags text[],                             -- ['development', 'meeting', 'bug-fix']
  
  -- Fakturace
  billable boolean DEFAULT true,
  hourly_rate numeric(10,2),               -- Kč/hodina (pokud jiný než default)
  
  -- Workflow
  status text DEFAULT 'draft',             -- 'draft', 'submitted', 'approved', 'rejected', 'invoiced'
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  rejection_reason text,
  
  -- Metadata
  entry_type text DEFAULT 'timer',         -- 'timer', 'manual'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_duration CHECK (
    (ended_at IS NULL) OR (ended_at > started_at)
  )
);

CREATE INDEX idx_time_entries_user ON time_entries(user_id, started_at DESC);
CREATE INDEX idx_time_entries_org ON time_entries(org_id, started_at DESC);
CREATE INDEX idx_time_entries_project ON time_entries(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_time_entries_task ON time_entries(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_time_entries_status ON time_entries(org_id, status, started_at DESC);
```

### `time_tracking_settings`

Nastavení time trackingu na úrovni organizace.

```sql
CREATE TABLE time_tracking_settings (
  org_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Globální nastavení
  enabled boolean DEFAULT true,
  require_approval boolean DEFAULT false,          -- Musí manager schvalovat?
  require_project_task boolean DEFAULT false,      -- Musí být vazba na projekt/task?
  
  -- Default billable rate
  default_hourly_rate numeric(10,2),               -- Kč/hodina
  currency text DEFAULT 'CZK',
  
  -- Omezení
  min_entry_minutes integer DEFAULT 1,
  max_entry_minutes integer DEFAULT 480,           -- Max 8h na entry
  allow_overlapping_entries boolean DEFAULT false,
  
  -- Workflow
  auto_submit_after_hours integer,                 -- Auto-submit draft entries after X hours
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### `billable_rates`

Individuální sazby pro uživatele nebo role.

```sql
CREATE TABLE billable_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Kdo má tuto sazbu
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text,                                        -- Nebo obecná role ('developer', 'designer')
  
  -- Sazba
  hourly_rate numeric(10,2) NOT NULL,
  currency text DEFAULT 'CZK',
  
  -- Platnost
  valid_from date NOT NULL,
  valid_until date,
  
  -- Metadata
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT rate_target CHECK (
    (user_id IS NOT NULL AND role IS NULL) OR
    (user_id IS NULL AND role IS NOT NULL)
  )
);

CREATE INDEX idx_billable_rates_user ON billable_rates(user_id, valid_from DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_billable_rates_org ON billable_rates(org_id, valid_from DESC);
```

---

## Visibility Rules (Subscription-Based)

### FREE Tier

✅ **Vlastní time tracking**

- Uživatel vidí pouze svoje time entries
- Může startovat/stopovat timer
- Může přidávat manuální záznamy
- Žádné approval workflow
- Žádný export

```sql
('time_entries_own', 'time_entries', '*', 'member', 'free', true, false, 'Vlastní záznamy času');
```

❌ **Co chybí:**

- Manager nevidí time entries ostatních
- Žádné billable rates
- Žádné reporty

### TEAM Tier (199 Kč/user/měsíc)

✅ **Team time overview**

- Manager vidí agregované hodiny týmu (celkem za období)
- Manager vidí rozpis po projektech/úkolech (bez jmen)
- Export timesheets (CSV)

```sql
('time_tracking_team_aggregated', 'time_entries', 'duration_minutes,billable', 'manager', 'team', false, true, 'Agregované hodiny týmu');
('time_entries_export', 'time_entries', '*', 'manager', 'team', false, false, 'Export timesheets');
```

### BUSINESS Tier (399 Kč/user/měsíc)

✅ **Detailed time tracking + Approval workflow**

- Manager vidí individuální time entries (kdo, kdy, na čem)
- Approval workflow (submit → approve/reject)
- Billable rates per user
- Detailní reporty (kdo kolik odpracoval)
- Export s breakdown (project/task/user)

```sql
('time_entries_team_view', 'time_entries', '*', 'manager', 'business', false, false, 'Detailní time entries týmu');
('time_entries_approve', 'time_entries', 'status', 'manager', 'business', false, false, 'Schvalování času');
('billable_rates_view', 'billable_rates', '*', 'manager', 'business', false, false, 'Sazby za hodinu');
```

### ENTERPRISE Tier (999 Kč/user/měsíc)

✅ **Full billing & invoicing**

- Automatická fakturace na základě schválených time entries
- AI-powered insights (kdo přepracovává, kdo pod-reportuje)
- Integrace s účetními systémy
- Custom billable rates per project/client
- Predikce budgetů a over-budget alerts

```sql
('time_entries_invoicing', 'time_entries', '*', 'owner', 'enterprise', false, false, 'Fakturace z time entries');
('time_tracking_ai_insights', 'time_entries', '*', 'manager', 'enterprise', false, false, 'AI analýza času');
```

---

## API Endpoints

### Timer Management

```typescript
// Start timer
POST /api/[orgSlug]/time/start
{
  project_id?: string,
  task_id?: string,
  description?: string,
  tags?: string[]
}

// Stop timer
POST /api/[orgSlug]/time/stop
{
  entry_id: string
}

// Get active timer (for current user)
GET /api/[orgSlug]/time/active
```

### Time Entries CRUD

```typescript
// Create manual entry
POST /api/[orgSlug]/time/entries
{
  started_at: string,      // ISO timestamp
  ended_at: string,
  project_id?: string,
  task_id?: string,
  description: string,
  billable: boolean,
  tags?: string[]
}

// List entries (filterable)
GET /api/[orgSlug]/time/entries?user_id=X&from=YYYY-MM-DD&to=YYYY-MM-DD&status=draft

// Update entry
PATCH /api/[orgSlug]/time/entries/[entryId]

// Delete entry
DELETE /api/[orgSlug]/time/entries/[entryId]
```

### Approval Workflow (BUSINESS+)

```typescript
// Submit for approval
POST /api/[orgSlug]/time/entries/[entryId]/submit

// Approve
POST /api/[orgSlug]/time/entries/[entryId]/approve

// Reject
POST /api/[orgSlug]/time/entries/[entryId]/reject
{
  reason: string
}

// Bulk approve
POST /api/[orgSlug]/time/entries/bulk-approve
{
  entry_ids: string[]
}
```

### Reports & Export (TEAM+)

```typescript
// Summary report
GET /api/[orgSlug]/time/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns: { total_hours, billable_hours, by_project: [...], by_user: [...] }

// Export timesheet (CSV/PDF)
GET /api/[orgSlug]/time/export?format=csv&from=YYYY-MM-DD&to=YYYY-MM-DD&user_id=X
```

### Settings (Manager+)

```typescript
// Get org settings
GET /api/[orgSlug]/time/settings

// Update org settings (Owner only)
PATCH /api/[orgSlug]/time/settings
{
  require_approval: boolean,
  default_hourly_rate: number,
  ...
}

// Manage billable rates (BUSINESS+)
GET /api/[orgSlug]/time/rates
POST /api/[orgSlug]/time/rates
PATCH /api/[orgSlug]/time/rates/[rateId]
```

---

## Frontend Components

### 1. Timer Widget (Floating)

Malý floating widget v rohu obrazovky (podobně jako FloatingVideoPanel).

```tsx
<TimerWidget />
```

- Zobrazuje aktivní timer (čas běží)
- Quick start/stop
- Možnost přidat projekt/task
- Klik → otevře detail entry

### 2. Timesheet View

Hlavní stránka `app/[orgSlug]/time/page.tsx`

**Layouts:**

- **Calendar view** (týdenní/měsíční grid s entries)
- **List view** (tabulka: datum, projekt, task, popis, trvání, status)

**Filtry:**

- Období (tento týden, minulý měsíc, custom range)
- Projekt
- Task
- Status (draft, submitted, approved)
- Billable/Non-billable

**Actions:**

- Add manual entry
- Edit/Delete (pouze draft)
- Submit for approval
- Export

### 3. Time Entry Form

Modal/drawer pro manuální přidání času:

```tsx
<CreateTimeEntryForm
  orgSlug={orgSlug}
  defaultProject={projectId}
  onSuccess={() => refetch()}
/>
```

Pole:

- Datum + čas od–do (nebo trvání)
- Projekt (select)
- Task (select, filtrovaný podle projektu)
- Popis
- Billable toggle
- Tags

### 4. Approval Interface (Manager, BUSINESS+)

Stránka `app/[orgSlug]/time/approvals/page.tsx`

- Pending entries (čekají na schválení)
- Karta per entry: user, projekt, task, popis, trvání
- Tlačítka: Approve / Reject
- Bulk actions (vyber všechny → approve)

### 5. Time Reports (Manager, TEAM+)

Dashboard s grafy a statistikami:

- Total hours this week/month
- Billable vs. non-billable ratio
- Breakdown by project
- Breakdown by team member (BUSINESS+)
- Over/under allocation alerts

### 6. Settings Page (Owner)

`app/[orgSlug]/time/settings/page.tsx`

- Enable/disable time tracking
- Require approval toggle
- Default hourly rate
- Billable rates management (BUSINESS+)

---

## Workflow Example (BUSINESS Tier)

1. **Freelancer** zapne timer na projektu "Web Redesign"
2. Po 2 hodinách stopne timer → entry status = `draft`
3. Na konci týdne klikne "Submit for approval" → status = `submitted`
4. **Manager** dostane notifikaci
5. Manager otevře Approvals, vidí entry, zkontroluje, klikne "Approve" → status = `approved`
6. Entry je nyní zahrnuto v exportu pro fakturaci

---

## Integration s Projekty a Úkoly

Time entries jsou volitelně navázané na `projects` a `tasks`:

```typescript
// Při vytváření projektu může manager nastavit budget
projects.time_budget_hours = 40;

// Při zobrazení projektu vidíš:
- Tracked time: 32h / 40h (80%)
- Over budget warning pokud > 100%
```

**Task detail:**

```typescript
// Task card zobrazuje tracked time
- Estimated: 4h
- Tracked: 5.5h
- Status: Over estimate
```

---

## Feature Keys (pro FEATURE_REGISTRY)

```typescript
// FREE
time_entries_own: {
  label: "Vlastní time tracking",
  minTier: "free",
  minRole: "member"
},

// TEAM
time_tracking_team_aggregated: {
  label: "Agregované hodiny týmu",
  minTier: "team",
  minRole: "manager"
},
time_entries_export: {
  label: "Export timesheets",
  minTier: "team",
  minRole: "manager"
},

// BUSINESS
time_entries_team_view: {
  label: "Detailní time entries týmu",
  minTier: "business",
  minRole: "manager"
},
time_entries_approve: {
  label: "Schvalování času",
  minTier: "business",
  minRole: "manager"
},
billable_rates_view: {
  label: "Správa billable rates",
  minTier: "business",
  minRole: "manager"
},

// ENTERPRISE
time_entries_invoicing: {
  label: "Automatická fakturace",
  minTier: "enterprise",
  minRole: "owner"
},
time_tracking_ai_insights: {
  label: "AI analýza času",
  minTier: "enterprise",
  minRole: "manager"
},
```

---

## Upgrade Prompts

### FREE → TEAM

> **Chcete vidět, kolik času tým odpracoval?**
>
> Upgrade na Team tier a získejte:
>
> - Agregované hodiny týmu (celkem za období)
> - Export timesheets pro fakturaci
> - 30-denní historie
>
> **199 Kč/user/měsíc**

### TEAM → BUSINESS

> **Potřebujete schvalovat čas a nastavit billable rates?**
>
> Upgrade na Business tier:
>
> - Vidíte individuální time entries každého člena
> - Approval workflow (submit → approve)
> - Billable rates per user
> - Detailní reporty a breakdown
>
> **399 Kč/user/měsíc**

### BUSINESS → ENTERPRISE

> **Automatizujte fakturaci a získejte AI insights**
>
> Enterprise tier vám dá:
>
> - Automatická fakturace z approved time entries
> - AI analýza (kdo přepracovává, kdo pod-reportuje)
> - Integrace s účetními systémy
> - Custom rates per project/client
>
> **999 Kč/user/měsíc**

---

## Migrace (SQL)

```bash
# Spustit migraci
psql -U postgres -d ease -f supabase/migrations/017_time_tracking.sql

# Ověřit
SELECT * FROM time_entries LIMIT 5;
SELECT * FROM time_tracking_settings;
```

---

## Filozofie

**Time tracking by default není invazivní:**

- FREE tier: Každý trackuje svůj čas, nikdo jiný to nevidí (důvěra)
- TEAM: Manager vidí jen agregované hodiny (respekt k soukromí)
- BUSINESS+: Detailní tracking s approval workflow (transparentnost pro fakturaci)

**Flexibilita:**

- Timer i manuální entry
- Volitelná vazba na projekt/task
- Billable vs. non-billable
- Approval workflow jen když org chce

**Integrace:**

- Time entries navázané na projekty → vidíš progress
- AI insights (ENTERPRISE) → predikce over-budget, burnout alerts
