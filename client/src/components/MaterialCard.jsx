/**
 * MaterialCard — used in Marketplace and Dashboard
 */
import { Link } from 'react-router-dom';
import { MapPin, Package, DollarSign, Leaf, BadgeCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const STATUS_COLORS = {
  active:  'bg-eco-500/20 text-eco-400',
  sold:    'bg-gray-500/20 text-gray-400',
  paused:  'bg-amber-500/20 text-amber-400',
};

const MaterialCard = ({ material, compact = false }) => {
  const {
    _id, title, category, quantity, price, images, location,
    seller, status, createdAt, carbonFactor,
  } = material;

  const img = images?.[0]?.url;
  const carbonSaved = Math.round(((quantity?.value || 0) * (carbonFactor || 200))).toLocaleString();

  return (
    <Link
      to={`/materials/${_id}`}
      className="glass-card block group overflow-hidden hover:border-eco-500/30 hover:shadow-[0_0_30px_rgba(34,197,94,0.1)] transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image */}
      <div className={`relative overflow-hidden ${compact ? 'h-36' : 'h-48'} bg-dark-300`}>
        {img ? (
          <img
            src={img}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-eco-800">
            <Package className="w-12 h-12" />
          </div>
        )}
        {/* Category tag */}
        <span className="absolute top-2 left-2 text-xs bg-dark-400/80 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-full">
          {category}
        </span>
        {/* Status */}
        {status !== 'active' && (
          <span className={`absolute top-2 right-2 text-xs px-2.5 py-1 rounded-full status-badge ${STATUS_COLORS[status] || ''}`}>
            {status}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-display font-semibold text-eco-100 mb-1 line-clamp-1 group-hover:text-eco-400 transition-colors">
          {title}
        </h3>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-eco-700 mb-3">
          <span className="flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            {quantity?.value} {quantity?.unit}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" />
            ₹{price?.amount?.toLocaleString()}{price?.negotiable ? ' (neg.)' : ''}
          </span>
        </div>

        {/* Location */}
        {location?.city && (
          <div className="flex items-center gap-1 text-xs text-eco-700 mb-3">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{location.city}{location.state ? `, ${location.state}` : ''}</span>
          </div>
        )}

        {/* Carbon badge */}
        <div className="flex items-center gap-1.5 text-xs text-eco-500 bg-eco-500/10 rounded-lg px-2.5 py-1.5 mb-3">
          <Leaf className="w-3.5 h-3.5" />
          ~{carbonSaved} kg CO₂ saving potential
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 text-xs text-eco-700">
            {seller?.verified && <BadgeCheck className="w-3.5 h-3.5 text-eco-500" />}
            <span className="truncate max-w-[120px]">{seller?.companyName || seller?.name}</span>
          </div>
          <span className="text-xs text-eco-800">
            {createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : ''}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default MaterialCard;
