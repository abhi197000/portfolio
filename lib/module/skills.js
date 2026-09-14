// Six skill axes derived from question topic tags — the player-card view
// (like FIFA's ATT/TEC/SPD). A question can train several skills. "pandas" is a
// language, not a skill, so it maps to no axis.
export const SKILL_AXES = [
  { id: "agg", code: "AGG", label: "Aggregation", tags: ["aggregation", "group by", "groupby", "having", "cte", "conditional aggregation", "distinct count", "nunique"] },
  { id: "join", code: "JOIN", label: "Joins", tags: ["left join", "self join", "merge", "coalesce"] },
  { id: "win", code: "WIN", label: "Window functions", tags: ["window functions", "rank", "partition by", "running total", "cumsum", "moving average"] },
  { id: "time", code: "TIME", label: "Time series", tags: ["rolling", "resample", "shift", "date math", "timedelta", "gaps", "recursive cte"] },
  { id: "seq", code: "SEQ", label: "Sequences", tags: ["gaps and islands", "cumcount"] },
  { id: "anl", code: "ANL", label: "Analytics", tags: ["pivot", "pivot_table", "funnel analysis", "anomaly detection", "what-if analysis"] },
];

export function axesForQuestion(question) {
  const tags = new Set((question.topic_tags || []).map((t) => String(t).toLowerCase()));
  return SKILL_AXES.filter((axis) => axis.tags.some((t) => tags.has(t))).map((axis) => axis.id);
}

// Mastery per axis = share of that axis's cases solved, 0-100.
// `solvedShare(slug)` is 1/0 for one user, or the cohort's solve rate (0..1);
// averaging per-question rates equals the average user's mastery.
export function masteryByAxis(questions, solvedShare) {
  return SKILL_AXES.map((axis) => {
    const inAxis = questions.filter((q) => axesForQuestion(q).includes(axis.id));
    const share = inAxis.length ? inAxis.reduce((sum, q) => sum + solvedShare(q.slug), 0) / inAxis.length : 0;
    return { ...axis, total: inAxis.length, value: Math.round(share * 100) };
  });
}

export function bestSkill(mastery) {
  const top = [...mastery].sort((a, b) => b.value - a.value)[0];
  return top && top.value > 0 ? top : null;
}
