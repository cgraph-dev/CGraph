# CGraph Archive

> **Created:** 2026-03-11 **Purpose:** Preserve deprecated, completed, and superseded files with
> full path recovery

This directory mirrors the project structure of the CGraph monorepo. Every archived file retains its
original relative path so it can be restored instantly if needed.

## Why Files Were Archived

| Category              | Reason                                                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Gamification**      | Deprecated in v2.0 pivot. Tables dropped by migration `20260723120000`. Achievement/cosmetics schemas remain active under new namespace. |
| **Open-Source Era**   | CGraph transitioned to closed-source. CLA, contributing guides, funding configs no longer apply.                                         |
| **Stale Docs**        | Completed plans (V1 Action Plan), superseded audits, version-specific API refs.                                                          |
| **Completed Scripts** | One-time codemods that have already been applied across the codebase.                                                                    |
| **Duplicate GSD**     | Backend had a separate `.gsd/` (292 files) that duplicated the root-level `.gsd/codebase/`.                                              |
| **Build Artifacts**   | `.pyc` files, `nohup.out`, `.bak` backups that were accidentally committed.                                                              |

## How to Recover a File

```bash
# Find an archived file
find .archived/ -name "filename"

# Restore to original location
cp .archived/path/to/file path/to/file

# Restore entire directory
cp -r .archived/apps/backend/.gsd/ apps/backend/.gsd/
```

## Structure

```
.archived/
├── README.md              ← this file
├── root/                  ← files from project root (CLA.md, CONTRIBUTING.md, etc.)
├── apps/
│   ├── backend/           ← mirrors apps/backend/ structure
│   ├── mobile/            ← mirrors apps/mobile/ structure
│   └── web/               ← mirrors apps/web/ structure
├── docs/                  ← mirrors docs/ structure
├── scripts/               ← completed one-time codemods
└── .github/               ← duplicate templates, funding, pycache
```

## Do NOT Restore Without Review

These files were archived because they reference **dropped database tables**, **removed API
endpoints**, or **deprecated systems**. Restoring them without updating their code will cause
runtime crashes.
