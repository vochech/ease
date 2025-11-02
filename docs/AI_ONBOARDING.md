# 2-Step AI Onboarding

## Koncept

**Manager/lead předvyplní** → **Nový člen potvrdí s AI** → **Ready to work**

Místo aby nový člen vyplňoval dlouhý formulář nebo odpovídal na 20 AI otázek:

1. **Manager** předvyplní profil (ví víc než AI chat)
2. **AI** rychle potvrdí údaje + zjistí náladu (2-3 zprávy)
3. **Done** - člověk může začít pracovat

## Jak to funguje

### Získaná data:

- ✅ **Aktuální nálada & stres** (1-10) → `subjective_checkins`
- ✅ **Jméno** (celé + přezdívka) → `user_profiles.full_name`, `display_name`
- ✅ **Role & seniorita** (junior/mid/senior/lead) → `user_profiles.role_level`
- ✅ **Pozice** (Frontend Dev, Designer) → `user_profiles.position_title`
- ✅ **Dovednosti** (React, Figma, TypeScript) → `user_profiles.skills[]`
- ✅ **Praxe** (roky) → `user_profiles.years_of_experience`
- ✅ **Pracovní styl** (samostatný/týmový) → `user_profiles.preferred_work_style`
- ✅ **Hodiny týdně** → `user_profiles.working_hours_per_week`
- ✅ **Kapacita** (0-100%) → `user_profiles.current_capacity_percentage`
- ✅ **Dostupnost pro úkoly** → `user_profiles.is_available_for_tasks`

## Flow

### KROK 1: Manager Pre-fill (volitelné, ale doporučené)

1. Manager jde na `/{orgSlug}/settings/team-onboarding`
2. Vidí seznam nových členů bez onboardingu
3. Klikne "Předvyplnit" a vyplní:
   - Jméno, pozice, seniorita
   - Dovednosti (React, TypeScript...)
   - Roky praxe
   - Kapacita, hodiny týdně
4. Uloží → `onboarding_prefilled_at` se nastaví

### KROK 2: User AI Confirmation

1. **První přihlášení člena** → redirect na `/{orgSlug}/onboarding`
2. **AI chat** detekuje prefill:
   - **JE prefill**: "Manažer ti připravil profil: Frontend Dev, React, TypeScript... Je to správně? Jak se dnes cítíš?" (2-3 zprávy)
   - **NENÍ prefill**: Projde celý onboarding (jméno, role, skills...) (5-8 zpráv)
3. **Extrakce** pomocí GPT-4 JSON mode
4. **Uložení** do `user_profiles` + mood/stress do `subjective_checkins`
5. **Redirect** `/dashboard` → ready to work

## Soubory

### Manager Pre-fill UI

- `app/[orgSlug]/settings/team-onboarding/page.tsx` - Manager dashboard
- `components/team-onboarding-list.tsx` - Seznam členů + prefill modal
- `app/api/[orgSlug]/settings/prefill-onboarding/route.ts` - API pro prefill

### User AI Onboarding

- `app/[orgSlug]/onboarding/page.tsx` - Onboarding stránka
- `components/onboarding-chat.tsx` - Chat UI komponenta
- `app/api/[orgSlug]/onboarding/chat/route.ts` - AI endpoint
  - Detekuje prefill status
  - Používá GPT-4 s JSON mode
  - Kratší flow pro prefilled profily
  - Upsertuje `user_profiles`
  - Insertuje mood/stress check-iny

### Database

- `supabase/migrations/014_onboarding_timestamp.sql`
  - `onboarding_completed_at` - kdy user dokončil
  - `onboarding_prefilled_by` - kdo předvyplnil (manager_id)
  - `onboarding_prefilled_at` - kdy bylo předvyplněno

### Middleware

- `app/[orgSlug]/dashboard/page.tsx` - Check, jestli je onboarding hotový

## AI Prompt strategie

AI agent:

- Je přátelský a neformální (tykání)
- Ptá se postupně (ne všechno naráz)
- Používá emoji pro lepší atmosféru
- Potvrzuje získané informace
- Když má dost dat → `completed: true`

## Výhody 2-step onboardingu

✅ **Manager ví víc** - lead zná člověka líp než AI chat  
✅ **Rychlejší pro nového člena** - jen potvrdí místo vyplňování  
✅ **Vyšší kvalita dat** - manager vyplní přesněji než self-report  
✅ **Flexibilní** - funguje i bez prefillu (AI zvládne celý onboarding)  
✅ **Mood tracking hned** - AI vždy zjistí aktuální náladu  
✅ **Team building** - manager projeví zájem předvyplněním profilu  
✅ **Konverzační UX** - příjemnější než formulář

## Spuštění

1. Spusť migraci `014_onboarding_timestamp.sql`
2. Nastav `OPENAI_API_KEY` v `.env.local`
3. První login → automatický redirect na onboarding
4. Po dokončení → redirect na dashboard

## TODO (volitelné rozšíření)

- [ ] Persist conversation v DB pro analytics
- [ ] Ukázat progress bar (kolik otázek zbývá)
- [ ] A/B test: AI chat vs. klasický formulář
- [ ] Multi-language support
- [ ] Voice input (Web Speech API)
