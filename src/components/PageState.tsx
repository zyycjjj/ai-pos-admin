type PageStateProps = {
  title: string;
  description?: string;
};

export function LoadingState({ title = 'Loading' }: Partial<PageStateProps>) {
  return <div className="state-panel">{title}...</div>;
}

export function ErrorState({ description, title }: PageStateProps) {
  return (
    <div className="state-panel danger">
      <strong>{title}</strong>
      {description ? <span>{description}</span> : null}
    </div>
  );
}

export function EmptyState({ description, title }: PageStateProps) {
  return (
    <div className="state-panel">
      <strong>{title}</strong>
      {description ? <span>{description}</span> : null}
    </div>
  );
}
