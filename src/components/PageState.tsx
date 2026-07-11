import { useAdminI18n } from '../i18n';

type PageStateProps = {
  title: string;
  description?: string;
};

export function LoadingState({ title = 'Loading' }: Partial<PageStateProps>) {
  const { t } = useAdminI18n();
  return <div className="state-panel">{title || t('common.loading')}...</div>;
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
