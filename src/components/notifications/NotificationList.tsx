'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Bell, Package, Calendar, ClipboardList, CheckCheck } from 'lucide-react';
import { trpc } from '@/lib/trpc';

const ENTITY_PATHS: Record<string, string> = {
  asset: '/assets',
  log: '/logs',
  plan: '/plans',
  parcel_calendar: '/calendrier',
};

function getTypeIcon(type: string) {
  switch (type) {
    case 'stock_low':
      return <Package className="h-5 w-5 text-orange-500" />;
    case 'stage_delayed':
      return <Calendar className="h-5 w-5 text-yellow-500" />;
    case 'task_assigned':
      return <ClipboardList className="h-5 w-5 text-blue-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-400" />;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'stock_low':
      return 'bg-orange-50';
    case 'stage_delayed':
      return 'bg-yellow-50';
    case 'task_assigned':
      return 'bg-blue-50';
    default:
      return 'bg-gray-50';
  }
}

function formatTimeAgo(date: Date, t: ReturnType<typeof useTranslations<'notifications'>>) {
  const now = new Date();
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

  if (diff < 60) return t('timeJustNow');
  if (diff < 3600) return t('timeMinutes', { count: Math.floor(diff / 60) });
  if (diff < 86400) return t('timeHours', { count: Math.floor(diff / 3600) });
  if (diff < 604800) return t('timeDays', { count: Math.floor(diff / 86400) });
  return new Date(date).toLocaleDateString('fr-FR');
}

const PAGE_SIZE = 20;

export function NotificationList() {
  const t = useTranslations('notifications');
  const router = useRouter();
  const utils = trpc.useUtils();
  const [offset, setOffset] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data, isLoading } = trpc.notification.list.useQuery({
    limit: PAGE_SIZE,
    offset,
    unreadOnly,
  });

  const { mutate: markRead } = trpc.notification.markRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
  });

  const { mutate: markAllRead, isPending: isMarkingAll } =
    trpc.notification.markAllRead.useMutation({
      onSuccess: () => {
        utils.notification.list.invalidate();
        utils.notification.unreadCount.invalidate();
      },
    });

  function handleNotificationClick(notification: {
    id: string;
    read: boolean;
    entityType: string | null;
    entityId: string | null;
  }) {
    if (!notification.read) {
      markRead({ id: notification.id });
    }
    if (notification.entityType && notification.entityId) {
      const basePath = ENTITY_PATHS[notification.entityType];
      if (basePath) {
        router.push(`${basePath}/${notification.entityId}`);
      }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => {
              setUnreadOnly(e.target.checked);
              setOffset(0);
            }}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          {t('filterUnread')}
        </label>

        <button
          type="button"
          onClick={() => markAllRead()}
          disabled={isMarkingAll || items.length === 0}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          <CheckCheck className="h-4 w-4" />
          {t('markAllRead')}
        </button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <Bell className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">{t('empty')}</p>
          <p className="mt-1 text-xs text-gray-400">{t('emptySubtitle')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleNotificationClick(notification)}
              className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors hover:bg-gray-50 ${
                notification.read ? 'border-gray-100 bg-white' : 'border-green-100 bg-green-50/30'
              }`}
            >
              {/* Icon */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getTypeColor(notification.type)}`}
              >
                {getTypeIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`text-sm font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}
                  >
                    {notification.title}
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(notification.createdAt, t)}
                    </span>
                    {!notification.read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                    )}
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">{notification.message}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            disabled={offset === 0}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
          >
            {t('previous')}
          </button>
          <span className="text-sm text-gray-500">
            {t('page', { current: Math.floor(offset / PAGE_SIZE) + 1, total: Math.ceil(total / PAGE_SIZE) })}
          </span>
          <button
            type="button"
            onClick={() => setOffset(offset + PAGE_SIZE)}
            disabled={offset + PAGE_SIZE >= total}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
          >
            {t('next')}
          </button>
        </div>
      )}
    </div>
  );
}
