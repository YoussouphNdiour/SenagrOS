import { getTranslations } from 'next-intl/server';
import { NotificationList } from '@/components/notifications/NotificationList';

export default async function NotificationsPage() {
  const t = await getTranslations('notifications');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
      </div>
      <NotificationList />
    </div>
  );
}
