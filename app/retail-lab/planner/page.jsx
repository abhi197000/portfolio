import { getSource } from "../../../lib/retail/source";
import { plannerData } from "../../../lib/retail/planner";
import { buildStory } from "../../../lib/retail/story";
import { LAB } from "../content";
import { Shell } from "../_kit/ui";
import StoryPlayer from "./StoryPlayer";

export const revalidate = 600;

export const metadata = {
  title: "The story: a planner's Monday · Agentic Retail Lab",
  description: "A planner and allocator's Monday morning, played end to end in VR: what's happening with the articles, why the agent recommends each action, and four decisions you can make along the way.",
};

export default async function StoryPage() {
  const story = buildStory(await plannerData(await getSource()));
  // the client only needs each use case's name and number, not its content functions
  const looks = Object.fromEntries(Object.entries(LAB).map(([id, c]) => [id, { video: c.video, n: c.n }]));
  return (
    <Shell theme="t-vr" source={story.source} asOf={story.as_of} active="planner">
      <StoryPlayer story={story} looks={looks} />
    </Shell>
  );
}
