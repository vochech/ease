-- Migration: Example using snippets
-- Created at: 2025-10-31
-- Author: vojta
--
-- UKÁZKA: Jak používat snippets v tomto souboru:
-- 1. Začni psát "supa-" a uvidíš všechny dostupné snippets
-- 2. Vyber snippet pomocí šipek a stiskni Tab
-- 3. Vyplň placeholders (např. názvy tabulek) a přeskakuj mezi nimi pomocí Tab
--
-- Příklady snippets:
-- - supa-table: Vytvoří kompletní tabulku s RLS policies
-- - supa-column: Přidá nový sloupec
-- - supa-function: Vytvoří PostgreSQL funkci
-- - supa-trigger: Vytvoří trigger
-- - supa-policy: Přidá RLS policy
--
-- TIP: Po napsání SQL můžeš:
-- - Formátovat: Shift+Alt+F
-- - Spustit v SQLTools: Select text + Ctrl+E Ctrl+E
-- - Aplikovat: pnpm db:migration:up

BEGIN;

-- Zde začni psát "supa-table" a stiskni Tab pro vytvoření tabulky


COMMIT;
