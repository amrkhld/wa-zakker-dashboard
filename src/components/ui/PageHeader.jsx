export default function PageHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-primary">{title}</h1>
        {description && <p className="text-sm text-gray-400">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
