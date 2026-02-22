export default function Card({ children, className = "" }) {
  return (
    <div className={`rounded-pill bg-surface p-6 ${className}`}>
      {children}
    </div>
  );
}
