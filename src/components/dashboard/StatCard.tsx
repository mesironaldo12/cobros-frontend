type Props = {
  label: string;
  value: string;
  icon: string;
};

export default function StatCard({ label, value, icon }: Props) {
  return (
    <article className="stat">
      <div className="stat-icon">{icon}</div>
      <div>
        <p>{label}</p>
        <h2>{value}</h2>
      </div>
    </article>
  );
}
