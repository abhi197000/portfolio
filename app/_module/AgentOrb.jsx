// The module's "agent presence": a gyroscope of rotating rings around a pulsing
// core. `state="thinking"` spins it up while work is running.
export default function AgentOrb({ size = 44, state = "idle" }) {
  return (
    <span className={`cc-orb cc-orb-${state}`} style={{ "--orb": `${size}px` }} aria-hidden="true">
      <span className="cc-orb-ring" />
      <span className="cc-orb-ring cc-orb-ring-2" />
      <span className="cc-orb-ring cc-orb-ring-3" />
      <span className="cc-orb-core" />
    </span>
  );
}
