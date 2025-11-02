# Supabase Integration Pro VS Code

## 🚀 Rychlý start

### 1. Propojit projekt s remote Supabase

```powershell
pnpm db:link
```

### 2. Stáhnout existující migrace z remote DB

```powershell
pnpm db:migration:pull
```

### 3. Vytvořit novou migraci

```powershell
pnpm db:migration:new nazev_migrace
```

Toto vytvoří nový soubor v `supabase/migrations/` kde můžeš psát SQL.

### 4. Aplikovat migrace na remote DB

```powershell
pnpm db:migration:up
```

---

## 📋 Dostupné příkazy

| Příkaz                         | Popis                                               |
| ------------------------------ | --------------------------------------------------- |
| `pnpm db:link`                 | Propojí lokální projekt s remote Supabase projektem |
| `pnpm db:migration:new <name>` | Vytvoří nový migrační soubor                        |
| `pnpm db:migration:pull`       | Stáhne aktuální schéma z remote DB jako migraci     |
| `pnpm db:migration:up`         | Aplikuje lokální migrace na remote DB               |
| `pnpm db:migration:diff`       | Zobrazí diff mezi lokálním a remote schématem       |
| `pnpm db:types`                | Vygeneruje TypeScript typy z DB schématu            |
| `pnpm db:start`                | Spustí lokální Supabase (Docker)                    |
| `pnpm db:stop`                 | Zastaví lokální Supabase                            |
| `pnpm db:status`               | Zobrazí status lokálního Supabase                   |
| `pnpm db:reset`                | Resetuje lokální DB a aplikuje všechny migrace      |

---

## 🔧 Typický workflow

### Nová migrace:

```powershell
# 1. Vytvoř migraci
pnpm db:migration:new add_new_table

# 2. Edituj SQL v supabase/migrations/YYYYMMDD_add_new_table.sql

# 3. Aplikuj na remote
pnpm db:migration:up

# 4. Vygeneruj TypeScript typy
pnpm db:types
```

### Stažení změn z production:

```powershell
# Stáhne aktuální schéma jako novou migraci
pnpm db:migration:pull
```

### Kontrola rozdílů:

```powershell
# Zobrazí co se změnilo od poslední migrace
pnpm db:migration:diff -f nazev_migrace
```

---

## 🎨 Doporučené VS Code extensions

1. **Supabase** (`supabase.supabase-vscode`)
   - Syntax highlighting pro Supabase config
   - Snippets pro běžné SQL příkazy
2. **SQLTools** (`mtxr.sqltools`)
   - Připojení k Supabase DB přímo z VS Code
   - IntelliSense pro SQL
3. **PostgreSQL** (`ckolkman.vscode-postgres`)
   - Kompletní PostgreSQL tooling

---

## 📝 Poznámky

- Migrace jsou automaticky seřazeny podle timestampu v názvu
- Supabase CLI používá `supabase/migrations/` složku
- Remote projekt ID: `jeixualvoujzhgxmouxb`
- Před `db:migration:up` je dobré udělat backup!

---

## 🔗 Užitečné odkazy

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Migration Guide](https://supabase.com/docs/guides/cli/managing-environments)
- [Local Development](https://supabase.com/docs/guides/cli/local-development)
