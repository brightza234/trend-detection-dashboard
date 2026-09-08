import fs from "fs";
import path from "path";
import type { TimeseriesData, TrendStatusData } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

export function getTimeseries(): TimeseriesData {
  const raw = fs.readFileSync(path.join(DATA_DIR, "timeseries.json"), "utf-8");
  return JSON.parse(raw) as TimeseriesData;
}

export function getTrendStatus(): TrendStatusData {
  const raw = fs.readFileSync(path.join(DATA_DIR, "trend_status.json"), "utf-8");
  return JSON.parse(raw) as TrendStatusData;
}
