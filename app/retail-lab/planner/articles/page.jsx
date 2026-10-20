import Link from "next/link";
import { getSource } from "../../../../lib/retail/source";
import { plannerData } from "../../../../lib/retail/planner";
import { Shell } from "../../_kit/ui";
import ArticleBoard from "./ArticleBoard";

export const revalidate = 600;

export const metadata = {
  title: "Every article · Agentic Retail Lab",
  description: "All 56 articles from the planner's Monday, each with the action it needs, the evidence, and the rule that tagged it.",
};

export default async function ArticlesPage() {
  const data = await plannerData(await getSource());
  // the board needs the tags and evidence, not the story's engine context
  const { context, chapters, ...board } = data;
  return (
    <Shell theme="t-hub" source={data.source} asOf={data.as_of} active="planner">
      <section className="lab-hero">
        <p className="lab-kicker">
          <span>★</span>Behind the story
        </p>
        <h1>
          Every article, <em>and why it&apos;s tagged.</em>
        </h1>
        <p className="lab-intro">
          The {data.summary.articles} articles behind <Link href="/retail-lab/planner">the planner&apos;s Monday</Link>, each checked against the same rules as the agents in the Lab. Filter by action, open a row for the evidence.
        </p>
      </section>
      <ArticleBoard data={board} />
    </Shell>
  );
}
