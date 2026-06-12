type Props = { children: React.ReactNode; className?: string };

export default function CurationNote({ children, className = "" }: Props) {
  return (
    <div
      className={`rounded-xl border px-2.5 py-2 text-cap leading-relaxed ${className}`}
      style={{
        borderColor: "color-mix(in oklab, var(--naju-pear) 40%, var(--naju-line))",
        background: "color-mix(in oklab, var(--naju-pear) 10%, var(--card))",
      }}
    >
      {children}
    </div>
  );
}
