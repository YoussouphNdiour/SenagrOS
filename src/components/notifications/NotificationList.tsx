'use client';

import { Bell, Package, Calendar, CheckSquare, CheckCheck } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';

const typeIcon: Record<string, React.ElementType> = {
  stock_low: Package,
  stage_delayed: Calendar,
  task_assigned: CheckSquare,
};

const typeLabel: Record<string, string> = {
  stock_low: 'Stock bas',
  stage_delayed: 'Stade en retard',
  task_assigned: 'Tâche assignée',
};

export function NotificationList() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.notification.list.useQuery({ limit: 50, offset: 0 });

  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
  });
  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-200 border-t-green-600" />
      </div>
    );
  }

  const items = data?.items ?? [];
  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="space-y-4">
      {unread > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
          <Bell className="h-12 w-12 opacity-30" />
          <p className="text-sm">Aucune notification</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {items.map((n) => {
            const Icon = typeIcon[n.type] ?? Bell;
            return (
              <li
                key={n.id}
                className={`flex items-start gap-3 p-4 transition hover:bg-gray-50 ${!n.read ? 'bg-green-50/40' : ''}`}
                onClick={() => {
                  if (!n.read) markRead.mutate({ id: n.id });
                }}
                style={{ cursor: n.read ? 'default' : 'pointer' }}
              >
                <div
                  className={`mt-0.5 rounded-lg p-2 ${
                    n.type === 'stock_low'
                      ? 'bg-orange-100 text-orange-600'
                      : n.type === 'stage_delayed'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-green-100 text-green-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium ${!n.read ? 'text-gray-900' : 'text-gray-600'}`}>
                      {n.title}
                    </p>
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{n.message}</p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {new Date(n.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' · '}
                    {typeLabel[n.type] ?? n.type}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
