"use client";
import { useEffect, useState } from "react";
import CommandCenter from "./CommandCenter";
import { listQuestions } from "../../lib/practiceApi";
import { loadAttemptHistory, loadCohortBenchmark, loadProgress } from "../../lib/module/progress";
import { countVersions } from "../../lib/resume/store";

// Data container for the Command Center; every source loads independently so
// one slow or missing piece (e.g. the cohort benchmark) never blanks the page.
export default function DashboardClient({ greetingName }) {
  const [data, setData] = useState({ questions: [], progress: null, history: null, cohort: undefined, versions: 0, error: "" });
  // Locale-formatted on the client only: the server's locale differs from the
  // browser's, which would break hydration.
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    const merge = (patch) => setData((prev) => ({ ...prev, ...patch }));
    setDateLabel(new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" }));
    listQuestions().then((questions) => merge({ questions }));
    loadProgress().then((progress) => merge({ progress })).catch((err) => merge({ error: err.message || String(err) }));
    loadAttemptHistory().then((history) => merge({ history })).catch(() => merge({ history: null }));
    loadCohortBenchmark().then((cohort) => merge({ cohort })).catch(() => merge({ cohort: null }));
    countVersions().then((versions) => merge({ versions })).catch(() => {});
  }, []);

  return <CommandCenter greetingName={greetingName} dateLabel={dateLabel} {...data} />;
}
