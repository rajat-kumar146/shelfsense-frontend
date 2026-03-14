/**
 * Stats Card for Dashboard
 */

export default function StatsCard({ title, value, icon: Icon, color, subtitle }) {
  const colors = {
    amber: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    red: "text-red-400 bg-red-400/10 border-red-400/20",
    orange: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  };

  return (
    <div className="card p-5 hover:border-surface-500 transition-all duration-200 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
            {title}
          </p>
          <p className="text-3xl font-display font-bold text-white mt-1">
            {value ?? "—"}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg border ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}