export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-10 px-4 border border-dashed border-border rounded-md">
      <div className="text-sm text-gray-300">{title}</div>
      {description && <div className="text-xs text-gray-500 mt-1">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}