/**
 * Status Badge Component
 * Visual indicator for product expiry status
 */

const config = {
  safe: {
    label: "Safe",
    background: "rgba(16, 185, 129, 0.14)",
    color: "#ffffff",
    borderColor: "rgba(16, 185, 129, 0.3)",
    dotColor: "#34d399",
  },
  expiring_soon: {
    label: "Expiring Soon",
    background: "rgba(245, 158, 11, 0.14)",
    color: "#ffffff",
    borderColor: "rgba(245, 158, 11, 0.3)",
    dotColor: "#fbbf24",
  },
  urgent: {
    label: "Urgent",
    background: "rgba(239, 68, 68, 0.14)",
    color: "#ffffff",
    borderColor: "rgba(239, 68, 68, 0.3)",
    dotColor: "#f87171",
  },
  expired: {
    label: "Expired",
    background: "rgba(239, 68, 68, 0.14)",
    color: "#ffffff",
    borderColor: "rgba(239, 68, 68, 0.3)",
    dotColor: "#f87171",
  },
};

export default function StatusBadge({ status }) {
  const { label, background, color, borderColor, dotColor } = config[status] || config.safe;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1,
        background,
        color,
        border: `1px solid ${borderColor}`,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: dotColor,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}
