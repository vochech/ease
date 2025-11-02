# 🔧 VS Code Extensions Setup - Supabase Development

## ✅ Doporučené extensions (přidány do `.vscode/extensions.json`):

### 🗄️ Database & Supabase

1. **Supabase** (`supabase.vscode-supabase-extension`)
   - Oficiální Supabase extension
   - Syntax highlighting pro config
2. **SQLTools** (`mtxr.sqltools`)
   - Univerzální databázový klient
   - Spouštění SQL přímo z editoru
3. **SQLTools PostgreSQL Driver** (`mtxr.sqltools-driver-pg`)
   - PostgreSQL driver pro SQLTools
4. **PostgreSQL** (`ckolkman.vscode-postgres`)
   - Pokročilý PostgreSQL management
5. **Prettier SQL** (`inferrinizzard.prettier-sql-vscode`)
   - Formátování SQL souborů

### 💡 Productivity

6. **IntelliCode** (`visualstudioexptteam.vscodeintellicode`)
   - AI-assisted autocomplete

---

## 🚀 Jak nainstalovat

VS Code ti automaticky navrhne instalaci těchto extensions při otevření projektu.

Nebo spusť:
\`\`\`powershell
code --install-extension supabase.vscode-supabase-extension
code --install-extension mtxr.sqltools
code --install-extension mtxr.sqltools-driver-pg
code --install-extension ckolkman.vscode-postgres
code --install-extension inferrinizzard.prettier-sql-vscode
code --install-extension visualstudioexptteam.vscodeintellicode
\`\`\`

---

## 📊 Připojení k databázi

### SQLTools Connection (už nakonfigurováno)

V `.vscode/sqltools_connections.json` jsou dva presets:

1. **Supabase Production**
   - Server: `aws-1-eu-west-1.pooler.supabase.com`
   - Database: `postgres`
   - Username: `postgres.jeixualvoujzhgxmouxb`
   - Heslo: Najdeš v Supabase Dashboard → Settings → Database

2. **Supabase Local** (když běží `pnpm db:start`)
   - Server: `127.0.0.1:54322`
   - Username/Password: `postgres`/`postgres`

### Jak se připojit:

1. Klikni na SQLTools ikonu v levém panelu
2. Vyber "Supabase Production"
3. Zadej heslo z Supabase dashboardu

---

## 📝 SQL Snippets (už vytvořené)

V `.vscode/sql.code-snippets` máš ready-made snippets:

| Snippet          | Popis                      |
| ---------------- | -------------------------- |
| `supa-table`     | Vytvoří tabulku s RLS      |
| `supa-column`    | Přidá sloupec              |
| `supa-policy`    | Vytvoří RLS policy         |
| `supa-function`  | Vytvoří PostgreSQL funkci  |
| `supa-trigger`   | Vytvoří trigger            |
| `supa-index`     | Vytvoří index              |
| `supa-fk`        | Přidá foreign key          |
| `supa-realtime`  | Zapne realtime pro tabulku |
| `supa-migration` | Header pro novou migraci   |
| `supa-rollback`  | Rollback template          |

### Jak použít:

1. Otevři `.sql` soubor
2. Začni psát např. `supa-table`
3. Stiskni Tab a vyplň placeholders

---

## 🎯 Praktický workflow

### 1. Vytvoř novou migraci:

\`\`\`powershell
pnpm db:migration:new add_users_table
\`\`\`

### 2. Otevři soubor v `supabase/migrations/`

### 3. Použij snippet:

- Začni psát `supa-migration` → Tab
- Pak `supa-table` → Tab
- Vyplň názvy tabulky a sloupců

### 4. Testuj SQL v SQLTools:

- Připoj se k "Supabase Local" (pokud běží)
- Nebo "Supabase Production" (opatrně!)
- Select SQL a stiskni `Ctrl+E Ctrl+E`

### 5. Aplikuj migraci:

\`\`\`powershell
pnpm db:migration:up
\`\`\`

### 6. Vygeneruj typy:

\`\`\`powershell
pnpm db:types
\`\`\`

---

## 🔑 Database Password (Production)

Najdeš v Supabase Dashboard:

1. https://supabase.com/dashboard/project/jeixualvoujzhgxmouxb
2. Settings → Database
3. Sekce "Connection string" → zobraz heslo

---

## 💡 Tipy

- **SQL formátování**: Otevři `.sql` soubor → `Shift+Alt+F`
- **Spuštění SQL**: Select text → `Ctrl+E Ctrl+E` (SQLTools)
- **IntelliSense**: Začni psát název tabulky/sloupce v SQL
- **Quick SQL test**: Klikni pravým na tabulku v SQLTools → "Show Table Records"

---

## 🆘 Troubleshooting

### SQLTools se nepřipojí k Production:

- Zkontroluj heslo v Supabase Dashboard
- Zkus restartovat VS Code
- Verifikuj connection timeout (nastaveno na 30s)

### Snippets nefungují:

- Zkontroluj že editujuješ `.sql` soubor
- VS Code si může vyžádat reload

### SQL se neformátuje:

- Zkontroluj že je nainstalován `inferrinizzard.prettier-sql-vscode`
- Default formatter pro SQL je nastaven v settings

---

## 📚 Odkazy

- [SQLTools Docs](https://vscode-sqltools.mteixeira.dev/)
- [PostgreSQL Extension](https://marketplace.visualstudio.com/items?itemName=ckolkman.vscode-postgres)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
