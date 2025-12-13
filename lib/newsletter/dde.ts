// lib/newsletter/dde.ts

import fs from "fs";
import path from "path";

/**
 * Types for DDE newsletter metadata + preview domains.
 * These mirror the JSON written by persist_shortlist in the DDE pipeline.
 */

export type DdeIssueMeta = {
  slug: string;          // e.g. "2025-11-26"
  title: string;         // e.g. "DDE Weekly Top Domains — 2025-11-26"
  date: string;          // ISO date string (same as slug for now)
  shortlistSize: number;
  priceMin: number | null;
  priceMax: number | null;
  priceAvg: number | null;
};

export type DdePreviewDomain = {
  domain: string;
  type: string;
  grade: string;
  final_score: number;
  price_suggested: number | null;
  insight: string;
  source_run_id: string;
};

export type DdeIssueWithPreview = {
  meta: DdeIssueMeta;
  preview: DdePreviewDomain[];
};

const DDE_OUT_ROOT =
  process.env.DDE_OUT_ROOT ||
  path.join(
    process.cwd(),
    "data",
    "dde",
  );

const OUT_ROOT = DDE_OUT_ROOT;
const RUNS_ROOT = path.join(OUT_ROOT, "runs");
const LATEST_ROOT = path.join(OUT_ROOT, "latest");

/**
 * Small helper to safely read & parse a JSON file.
 */
function readJsonFile<T>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, { encoding: "utf-8" });
    return JSON.parse(raw) as T;
  } catch (err) {

    console.warn(`[dde] Failed to read JSON file: ${filePath}`, err);
    return null;
  }
}

/**
 * Get the latest issue metadata from /out/latest/issue_meta.json.
 */
export function getLatestDdeIssueMeta(): DdeIssueMeta | null {
  const metaPath = path.join(LATEST_ROOT, "issue_meta.json");
  if (!fs.existsSync(metaPath)) {
    return null;
  }
  return readJsonFile<DdeIssueMeta>(metaPath);
}

/**
 * Get the latest preview Top 5 from /out/latest/preview_top5.json.
 */
export function getLatestDdePreviewTop5(): DdePreviewDomain[] {
  const previewPath = path.join(LATEST_ROOT, "preview_top5.json");
  if (!fs.existsSync(previewPath)) {
    return [];
  }
  const data = readJsonFile<unknown>(previewPath);
  if (!Array.isArray(data)) {
    return [];
  }
  return data as DdePreviewDomain[];
}

/**
 * Get metadata for all issues by scanning /out/runs//issue_meta.json.
 * Sorted descending by date (newest first).
 */
export function getAllDdeIssueMetas(): DdeIssueMeta[] {
  if (!fs.existsSync(RUNS_ROOT)) {
    return [];
  }

  const entries = fs.readdirSync(RUNS_ROOT, { withFileTypes: true });
  const metas: DdeIssueMeta[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const runDir = path.join(RUNS_ROOT, entry.name);
    const metaPath = path.join(runDir, "issue_meta.json");
    if (!fs.existsSync(metaPath)) continue;

    const meta = readJsonFile<DdeIssueMeta>(metaPath);
    if (meta) {
      metas.push(meta);
    }
  }

  // Sort by date (slug) descending: newest first.
  metas.sort((a, b) => {
    if (a.date < b.date) return 1;
    if (a.date > b.date) return -1;
    return 0;
  });

  return metas;
}

/**
 * Look up a specific issue by slug (e.g. "2025-11-26").
 * This scans the runs directory for a matching issue_meta.json,
 * then loads both its meta and preview_top5.json.
 */
export function getDdeIssueBySlug(slug: string): DdeIssueWithPreview | null {
  if (!fs.existsSync(RUNS_ROOT)) {
    return null;
  }

  const entries = fs.readdirSync(RUNS_ROOT, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const runDir = path.join(RUNS_ROOT, entry.name);
    const metaPath = path.join(runDir, "issue_meta.json");
    if (!fs.existsSync(metaPath)) continue;

      const meta = readJsonFile<DdeIssueMeta>(metaPath);
      if (!meta) continue;

      if (meta.slug !== slug) continue;

      // Found a matching issue
      const previewPath = path.join(runDir, "preview_top5.json");
      let preview: DdePreviewDomain[] = [];
      if (fs.existsSync(previewPath)) {
        const data = readJsonFile<unknown>(previewPath);
        if (Array.isArray(data)) {
          preview = data as DdePreviewDomain[];
        }
      }

      return { meta, preview };
  }

  return null;
}
