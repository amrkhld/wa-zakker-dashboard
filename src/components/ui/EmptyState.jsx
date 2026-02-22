export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface">
          <Icon size={24} className="text-gray-300" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-500">{title}</h3>
      {description && <p className="mt-1 text-xs text-gray-300">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
