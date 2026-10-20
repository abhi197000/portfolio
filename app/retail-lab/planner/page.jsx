import { getSource } from "../../../lib/retail/source";
import { plannerData } from "../../../lib/retail/planner";
import { LAB } from "../content";
import { Shell } from "../_kit/ui";
import PlannerStory from "./PlannerStory";

export const revalidate = 600;

export const metadata = {
  title: "A planner's Monday · Agentic Retail Lab",
  description: "All nine decisions from the LinkedIn series in one story: 56 articles, each tagged with the action it needs and the data behind the tag.",
};

export default async function PlannerPage() {
  const data = await plannerData(await getSource());
  // the client only needs each use case's look and name, not its content functions
  const looks = Object.fromEntries(Object.entries(LAB).map(([id, c]) => [id, { theme: c.theme, video: c.video, n: c.n, title: c.title.join("") }]));
  return (
    <Shell theme="t-hub" source={data.source} asOf={data.as_of} active="planner">
      <PlannerStory data={data} looks={looks} />
    </Shell>
  );
}
