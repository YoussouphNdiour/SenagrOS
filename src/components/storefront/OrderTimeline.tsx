import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import { ORDER_FLOW, orderStatusLabels } from '@/lib/validators/order.validator';

interface OrderTimelineProps {
  status: string;
  createdAt: Date | null;
  confirmedAt: Date | null;
  preparingAt?: string;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
}

const fmt = (d: Date | string | null | undefined) =>
  d
    ? new Date(d).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

export function OrderTimeline(props: OrderTimelineProps) {
  if (props.status === 'cancelled' || props.status === 'refunded') {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-700">
        <XCircle className="h-6 w-6" />
        <div>
          <p className="font-semibold">Commande {orderStatusLabels[props.status]?.toLowerCase()}</p>
          <p className="text-sm">{fmt(props.cancelledAt)}</p>
        </div>
      </div>
    );
  }
  const dates: Record<(typeof ORDER_FLOW)[number], string | null> = {
    pending: fmt(props.createdAt),
    confirmed: fmt(props.confirmedAt),
    preparing: fmt(props.preparingAt),
    shipped: fmt(props.shippedAt),
    delivered: fmt(props.deliveredAt),
  };
  const currentIndex = ORDER_FLOW.indexOf(props.status as (typeof ORDER_FLOW)[number]);

  return (
    <ol className="relative space-y-6 border-l-2 border-gray-200 pl-6" data-testid="order-timeline">
      {ORDER_FLOW.map((status, i) => {
        const done = i <= currentIndex;
        return (
          <li key={status} className="relative">
            <span className="absolute -left-[33px] top-0 bg-white">
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <Circle className="h-5 w-5 text-gray-300" />
              )}
            </span>
            <p className={`font-medium ${done ? 'text-gray-800' : 'text-gray-400'}`}>
              {orderStatusLabels[status]}
            </p>
            {done && dates[status] && <p className="text-xs text-gray-500">{dates[status]}</p>}
          </li>
        );
      })}
    </ol>
  );
}
