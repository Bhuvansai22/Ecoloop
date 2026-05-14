/**
 * TransactionCard — for Dashboard and Transactions list
 */
import { formatDistanceToNow } from 'date-fns';
import { Leaf, ChevronRight, Package, User } from 'lucide-react';

const STATUS_CONFIG = {
  pending:   { color: 'bg-amber-500/20 text-amber-400',  label: 'Pending' },
  accepted:  { color: 'bg-blue-500/20 text-blue-400',    label: 'Accepted' },
  rejected:  { color: 'bg-red-500/20 text-red-400',      label: 'Rejected' },
  completed: { color: 'bg-eco-500/20 text-eco-400',      label: 'Completed' },
  cancelled: { color: 'bg-gray-500/20 text-gray-400',    label: 'Cancelled' },
};

const TransactionCard = ({ transaction, onAction, currentUserId }) => {
  const { material, buyer, seller, status, carbonSaved, quantity, createdAt, message } = transaction;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const isSeller = seller?._id === currentUserId || seller === currentUserId;

  return (
    <div className="glass-card p-4 hover:border-eco-500/20 transition-all">
      <div className="flex gap-4">
        {/* Material thumbnail */}
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-dark-300 shrink-0">
          {material?.images?.[0]?.url ? (
            <img src={material.images[0].url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-6 h-6 text-eco-800" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-display font-semibold text-sm line-clamp-1">
              {material?.title || 'Material'}
            </h4>
            <span className={`status-badge shrink-0 ${cfg.color}`}>{cfg.label}</span>
          </div>

          <p className="text-xs text-eco-700 mb-1.5">
            <User className="w-3 h-3 inline mr-1" />
            {isSeller
              ? `Buyer: ${buyer?.companyName || buyer?.name}`
              : `Seller: ${seller?.companyName || seller?.name}`}
          </p>

          <div className="flex items-center gap-3 text-xs text-eco-700">
            <span>{quantity?.value} {quantity?.unit}</span>
            {carbonSaved > 0 && (
              <span className="flex items-center gap-1 text-eco-500">
                <Leaf className="w-3 h-3" /> {carbonSaved} kg CO₂
              </span>
            )}
            <span className="ml-auto text-eco-800">
              {createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : ''}
            </span>
          </div>

          {message && (
            <p className="text-xs text-eco-700 mt-1.5 italic line-clamp-1">"{message}"</p>
          )}
        </div>
      </div>

      {/* Action buttons for seller on pending transactions */}
      {isSeller && status === 'pending' && onAction && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-white/[0.06]">
          <button
            onClick={() => onAction(transaction._id, 'accepted')}
            className="flex-1 btn-primary text-xs py-1.5 px-3"
          >
            Accept
          </button>
          <button
            onClick={() => onAction(transaction._id, 'rejected')}
            className="flex-1 btn-danger text-xs py-1.5 px-3"
          >
            Decline
          </button>
        </div>
      )}
      {isSeller && status === 'accepted' && onAction && (
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <button
            onClick={() => onAction(transaction._id, 'completed')}
            className="w-full btn-primary text-xs py-1.5"
          >
            Mark as Completed
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionCard;
