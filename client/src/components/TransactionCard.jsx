/**
 * TransactionCard — for Dashboard and Transactions list
 */
import { formatDistanceToNow } from 'date-fns';
import { Leaf, Package, User, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../utils/getImageUrl';

const STATUS_CONFIG = {
  pending:   { color: 'bg-amber-500/20 text-amber-400',  label: 'Pending' },
  accepted:  { color: 'bg-blue-500/20 text-blue-400',    label: 'Accepted' },
  rejected:  { color: 'bg-red-500/20 text-red-400',      label: 'Rejected' },
  completed: { color: 'bg-eco-500/20 text-eco-400',      label: 'Completed' },
  cancelled: { color: 'bg-gray-500/20 text-gray-400',    label: 'Cancelled' },
};

const TransactionCard = ({ transaction, onAction, currentUserId }) => {
  const { material, buyer, seller, status, carbonSaved, quantity, createdAt, message, agreedPrice } = transaction;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const isSeller = seller?._id === currentUserId || seller === currentUserId;
  const navigate = useNavigate();

  // The other party to message
  const otherParty = isSeller ? buyer : seller;
  const otherPartyId = otherParty?._id || otherParty;

  return (
    <div className="glass-card p-4 hover:border-eco-500/20 transition-all">
      <div className="flex gap-4">
        {/* Material thumbnail */}
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-dark-300 shrink-0 relative">
          {material?.images?.[0]?.url ? (
            <>
              <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-dark-300 z-0">
                <Package className="w-6 h-6 text-eco-800" />
              </div>
              <img 
                src={getImageUrl(material.images[0].url)} 
                alt="" 
                className="w-full h-full object-cover absolute inset-0 z-10" 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-6 h-6 text-eco-800" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-display font-bold text-sm text-eco-100 line-clamp-1">
              {material?.title || 'Material'}
            </h4>
            <span className={`status-badge shrink-0 ${cfg.color}`}>{cfg.label}</span>
          </div>

          <p className="text-xs text-eco-200 mb-1.5">
            <User className="w-3 h-3 inline mr-1 text-eco-500" />
            {isSeller
              ? `Buyer: ${buyer?.companyName || buyer?.name}`
              : `Seller: ${seller?.companyName || seller?.name}`}
          </p>

          <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-xs text-eco-200">
            <span>{quantity?.value} {quantity?.unit}</span>
            {agreedPrice > 0 && (
              <>
                <span>·</span>
                <span className="font-semibold text-eco-400">Total: ₹{(quantity?.value * agreedPrice).toLocaleString()}</span>
              </>
            )}
            {carbonSaved > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1 text-eco-500 font-semibold">
                  <Leaf className="w-3 h-3" /> {carbonSaved} kg CO₂
                </span>
              </>
            )}
            <span className="text-eco-300 md:ml-auto w-full md:w-auto mt-0.5 md:mt-0 block md:inline text-[10px] sm:text-xs">
              {createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : ''}
            </span>
          </div>

          {message && (
            <p className="text-xs text-eco-300 mt-1.5 italic line-clamp-1">"{message}"</p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-3 pt-3 border-t border-dark-100/30 flex gap-2 flex-wrap">
        {/* Message button — always visible for both parties */}
        {otherPartyId && (
          <button
            onClick={() => navigate(`/messages?user=${otherPartyId}`)}
            className="flex items-center gap-1.5 text-xs bg-dark-400 hover:bg-dark-200 text-eco-500 border border-dark-100 px-3 py-1.5 rounded-lg transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Message {isSeller ? 'Buyer' : 'Seller'}
          </button>
        )}

        {/* Seller-only deal actions */}
        {isSeller && status === 'pending' && onAction && (
          <>
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
          </>
        )}
        {isSeller && status === 'accepted' && onAction && (
          <button
            onClick={() => onAction(transaction._id, 'completed')}
            className="flex-1 btn-primary text-xs py-1.5"
          >
            Mark as Completed
          </button>
        )}
      </div>
    </div>
  );
};

export default TransactionCard;

