/**
 * MaterialDetailPage — full listing view with transaction request
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { materialService, transactionService } from '../services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  MapPin, Package, DollarSign, Leaf, BadgeCheck, Edit2,
  Trash2, ArrowLeft, Eye, CalendarDays, Tag, Gavel, MessageSquare
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '../context/SocketContext';
import { confirmToast } from '../components/ConfirmToast';

const convertToKg = (value, unit) => {
  const val = Number(value) || 0;
  switch (unit) {
    case 'kg':           return val;
    case 'tonnes':       return val * 1000;
    case 'litres':       return val;
    case 'units':        return val * 10;
    case 'cubic metres': return val * 800;
    default:             return val;
  }
};

const MaterialDetailPage = () => {
  const { id }     = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [material,  setMaterial]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [imgIdx,    setImgIdx]    = useState(0);
  const [txLoading, setTxLoading] = useState(false);
  const [message,   setMessage]   = useState('');
  const [quantity,  setQuantity]  = useState('');
  const [requested, setRequested] = useState(false);
  const [bidPricePerKg, setBidPricePerKg] = useState('');
  const [bidQuantity, setBidQuantity] = useState('');
  const [bids,      setBids]      = useState([]);
  const [bidLoading, setBidLoading] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    setLoading(true);
    materialService.getById(id)
      .then(({ data }) => { 
        setMaterial(data.material); 
        setLoading(false); 
        if (data.material?.isAuction) {
          materialService.getBids(id).then(res => setBids(res.data.bids)).catch(console.error);
        }
        // Record view separately — server deduplicates by IP per hour
        materialService.recordView(id).catch(() => {});
      })
      .catch(() => { toast.error('Material not found'); navigate('/marketplace'); });
  }, [id]);

  useEffect(() => {
    if (socket && material?.isAuction) {
      socket.emit('joinMaterial', id);
      const handleNewBid = (newBid) => {
        setBids(prev => [newBid, ...prev]);
        setMaterial(prev => ({
          ...prev,
          auctionDetails: { ...prev.auctionDetails, currentHighestBid: newBid.amount }
        }));
      };
      socket.on('newBid', handleNewBid);
      return () => {
        socket.emit('leaveMaterial', id);
        socket.off('newBid', handleNewBid);
      };
    }
  }, [socket, material?.isAuction, id]);

  const isOwner = user && material && (user._id === material.seller?._id || user._id === material.seller);
  const canBuy  = user && user.role === 'buyer' && !isOwner;

  const handleRequest = async () => {
    if (!user) { toast.error('Please login to request'); navigate('/login'); return; }
    const reqQty = Number(quantity) || material.quantity.value;
    if (reqQty > material.quantity.value) {
      toast.error(`Requested quantity (${reqQty} ${material.quantity.unit}) cannot exceed listing quantity of ${material.quantity.value} ${material.quantity.unit}`);
      return;
    }
    setTxLoading(true);
    try {
      await transactionService.create({
        materialId: id,
        quantity: quantity || material.quantity.value,
        unit: material.quantity.unit,
        message,
      });
      toast.success('Deal request sent to seller! 🤝');
      setRequested(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setTxLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmToast('Delete this listing permanently?', {
      confirmText: 'Yes, delete',
      icon: '🗑️',
    });
    if (!confirmed) return;
    try {
      await materialService.delete(id);
      toast.success('Listing deleted');
      navigate('/dashboard');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleBid = async () => {
    if (!user) { toast.error('Please login to bid'); navigate('/login'); return; }
    if (!bidQuantity || isNaN(bidQuantity) || Number(bidQuantity) <= 0) {
      toast.error('Please enter a valid bid quantity in kg');
      return;
    }
    if (!bidPricePerKg || isNaN(bidPricePerKg) || Number(bidPricePerKg) <= 0) {
      toast.error('Please enter a valid bid price per kg');
      return;
    }
    if (Number(bidQuantity) > maxKg) {
      toast.error(`Bid quantity cannot exceed listing quantity of ${maxKg} kg (${qty?.value} ${qty?.unit})`);
      return;
    }
    const totalBid = Number(bidQuantity) * Number(bidPricePerKg);
    const minBid = auctionDetails?.currentHighestBid || auctionDetails?.startingPrice || 0;
    if (totalBid <= minBid) {
      toast.error(`Total bid (₹${totalBid.toLocaleString()}) must be higher than ₹${minBid.toLocaleString()}`);
      return;
    }
    setBidLoading(true);
    try {
      await materialService.placeBid(id, totalBid, bidQuantity);
      toast.success('Bid placed successfully!');
      setBidPricePerKg('');
      setBidQuantity('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bid failed');
    } finally {
      setBidLoading(false);
    }
  };

  const handleAcceptBid = async (bidId) => {
    const confirmed = await confirmToast('Accept this bid and close the listing?', {
      confirmText: 'Accept bid',
      icon: '🤝',
    });
    if (!confirmed) return;
    try {
      await materialService.acceptBid(id, bidId);
      toast.success('Bid accepted! Material marked as sold.');
      setMaterial(prev => ({ ...prev, status: 'sold' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept bid');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-eco-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!material) return null;

  const { title, description, category, quantity: qty, price, images,
          seller, location, status, createdAt, views, tags, condition,
          carbonFactor, isAuction, auctionDetails } = material;

  const carbonSaved = Math.round((qty?.value || 0) * (carbonFactor || 200));
  const isAuctionActive = isAuction && new Date() < new Date(auctionDetails?.endTime);
  const maxKg = qty ? convertToKg(qty.value || 0, qty.unit || 'tonnes') : 0;

  return (
    <div className="min-h-screen pt-18 md:pt-20 pb-12 px-3 md:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-eco-700 mb-6">
          <Link to="/marketplace" className="flex items-center gap-1 hover:text-eco-400">
            <ArrowLeft className="w-4 h-4" /> Marketplace
          </Link>
          <span>/</span>
          <span className="text-eco-300 truncate max-w-[200px]">{title}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left — images */}
          <div>
            <div className="rounded-2xl overflow-hidden bg-dark-300 h-56 sm:h-72 md:h-80 mb-3">
              {images?.length > 0 ? (
                <img src={images[imgIdx]?.url} alt={title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 text-eco-800" />
                </div>
              )}
            </div>
            {images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${i === imgIdx ? 'border-eco-500' : 'border-transparent'}`}>
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right — details */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="text-xs bg-eco-500/10 text-eco-400 border border-eco-500/20 px-3 py-1 rounded-full">{category}</span>
                {condition && <span className="text-xs bg-white/5 text-eco-700 border border-white/10 px-3 py-1 rounded-full ml-2 capitalize">{condition}</span>}
              </div>
              <div className="flex items-center gap-2">
                {isOwner && (
                  <>
                    <Link to={`/materials/${id}/edit`} className="p-2 rounded-lg hover:bg-white/5 text-eco-600 hover:text-eco-400 transition-all">
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-red-500/10 text-eco-700 hover:text-red-400 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold mb-3 md:mb-4">{title}</h1>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="glass-card p-3 text-center">
                {isAuction ? (
                  <>
                    <Gavel className="w-4 h-4 text-eco-500 mx-auto mb-1" />
                    <div className="font-display font-bold">₹{auctionDetails?.currentHighestBid?.toLocaleString() || auctionDetails?.startingPrice?.toLocaleString()}</div>
                    <div className="text-xs text-eco-700">Current Bid</div>
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 text-eco-500 mx-auto mb-1" />
                    <div className="font-display font-bold">₹{price?.amount?.toLocaleString()} / {qty?.unit}</div>
                    <div className="text-xs text-eco-700">{price?.negotiable ? 'Negotiable' : 'Fixed'}</div>
                  </>
                )}
              </div>
              <div className="glass-card p-3 text-center">
                <Package className="w-4 h-4 text-eco-500 mx-auto mb-1" />
                <div className="font-display font-bold">{qty?.value}</div>
                <div className="text-xs text-eco-700">{qty?.unit}</div>
              </div>
              <div className="glass-card p-3 text-center">
                <Leaf className="w-4 h-4 text-eco-500 mx-auto mb-1" />
                <div className="font-display font-bold">{carbonSaved.toLocaleString()}</div>
                <div className="text-xs text-eco-700">kg CO₂</div>
              </div>
            </div>

            {/* Description */}
            <p className="text-eco-300 text-sm leading-relaxed mb-5">{description}</p>

            {/* Location */}
            {location?.city && (
              <div className="flex items-center gap-2 text-sm text-eco-700 mb-4">
                <MapPin className="w-4 h-4 text-eco-500" />
                {[location.city, location.state].filter(Boolean).join(', ')}
                {location.address && ` — ${location.address}`}
              </div>
            )}

            {/* Tags */}
            {tags?.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <Tag className="w-4 h-4 text-eco-700 shrink-0" />
                {tags.map((tag) => (
                  <span key={tag} className="text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-eco-700">{tag}</span>
                ))}
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-eco-800 mb-6">
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {views} views</span>
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {createdAt ? formatDistanceToNow(new Date(createdAt), { addSuffix: true }) : ''}
              </span>
            </div>

            {/* Seller info */}
            <div className="glass-card p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-eco-300">Seller</h3>
                {!isOwner && user && (
                  <button onClick={() => navigate(`/messages?user=${seller._id}`)} className="text-xs flex items-center gap-1.5 bg-eco-500/10 text-eco-400 px-3 py-1.5 rounded-full hover:bg-eco-500/20 transition-all">
                    <MessageSquare className="w-3.5 h-3.5" /> Message Seller
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-eco-600/20 flex items-center justify-center font-bold text-eco-400">
                  {seller?.name?.[0] || 'S'}
                </div>
                <div>
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    {seller?.companyName || seller?.name}
                    {seller?.verified && <BadgeCheck className="w-4 h-4 text-eco-400" />}
                  </div>
                  <div className="text-xs text-eco-700">{seller?.industryType}</div>
                </div>
              </div>
            </div>

            {/* Transaction request / Auction or owner buttons */}
            {canBuy && status === 'active' && !isAuction && !requested && (
              <div className="glass-card p-4 space-y-3">
                <h3 className="text-sm font-semibold text-eco-300">Request Deal</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder={`Qty (max ${qty?.value} ${qty?.unit})`}
                    max={qty?.value}
                    value={quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (Number(val) > (qty?.value || 0)) {
                        toast.error(`Quantity cannot exceed listing quantity of ${qty?.value} ${qty?.unit}`);
                        setQuantity(qty?.value?.toString() || '');
                      } else {
                        setQuantity(val);
                      }
                    }}
                    className="input-field py-2 text-sm flex-1"
                  />
                </div>
                {quantity && !isNaN(quantity) && (
                  <div className="text-xs text-eco-400 font-semibold p-2 bg-eco-500/5 border border-eco-500/10 rounded-lg">
                    💰 Total Price: {quantity} {qty?.unit} × ₹{price?.amount} = ₹{(Number(quantity) * (price?.amount || 0)).toLocaleString()}
                  </div>
                )}
                <textarea
                  placeholder="Message to seller (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="input-field py-2 text-sm resize-none"
                  rows={3}
                />
                <button onClick={handleRequest} disabled={txLoading} className="btn-primary w-full">
                  {txLoading
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    : 'Send Deal Request 🤝'
                  }
                </button>
              </div>
            )}

            {/* Auction Section */}
            {isAuction && status === 'active' && (
              <div className="glass-card p-4 space-y-3">
                <h3 className="text-sm font-semibold text-eco-300 flex items-center justify-between">
                  <span>{isOwner ? 'Current Bids' : 'Place a Bid'}</span>
                  {isAuctionActive ? (
                    <span className="text-eco-400 text-xs">Ends {formatDistanceToNow(new Date(auctionDetails.endTime), { addSuffix: true })}</span>
                  ) : (
                    <span className="text-red-400 text-xs">Auction Ended</span>
                  )}
                </h3>
                
                {/* Only Buyers can place bids */}
                {canBuy && isAuctionActive && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder={`Quantity (max ${maxKg} kg)`}
                        max={maxKg}
                        value={bidQuantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (Number(val) > maxKg) {
                            toast.error(`Quantity cannot exceed listing quantity of ${maxKg} kg`);
                            setBidQuantity(maxKg.toString());
                          } else {
                            setBidQuantity(val);
                          }
                        }}
                        className="input-field py-2 text-sm w-full"
                      />
                      <input
                        type="number"
                        placeholder="Bid per kg (₹)"
                        value={bidPricePerKg}
                        onChange={(e) => setBidPricePerKg(e.target.value)}
                        className="input-field py-2 text-sm w-full"
                      />
                    </div>
                    {bidPricePerKg && bidQuantity && Number(bidQuantity) > 0 && (
                      <div className="text-xs text-eco-400 font-semibold p-2 bg-eco-500/5 border border-eco-500/10 rounded-lg space-y-1">
                        <div>💰 Calculated Total Bid: ₹{(Number(bidQuantity) * Number(bidPricePerKg)).toLocaleString()}</div>
                        {auctionDetails && (
                          <div className="text-[10px] text-eco-700 font-normal">
                            Must be higher than current highest bid: ₹{(auctionDetails.currentHighestBid || auctionDetails.startingPrice).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                    <button onClick={handleBid} disabled={bidLoading} className="btn-primary w-full py-2">
                      {bidLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'Place Bid'}
                    </button>
                  </div>
                )}

                {/* Everyone can see the list, but only Owner sees "Accept" */}
                {bids.length > 0 ? (
                  <div className="mt-4 border-t border-white/10 pt-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    <div className="text-xs text-eco-700 mb-2">Recent Bids</div>
                    <div className="space-y-2">
                      {bids.map(b => (
                        <div key={b._id} className="flex justify-between items-center text-sm p-2 bg-white/5 rounded-lg border border-white/5">
                          <div>
                            <span className="text-eco-300 font-medium block">{b.bidder?.name || 'Anonymous'}</span>
                            {b.quantity ? (
                              <span className="text-xs text-eco-700 block">
                                Total: ₹{b.amount.toLocaleString()} for {b.quantity} kg
                              </span>
                            ) : (
                              <span className="text-xs text-eco-700 block">
                                Total: ₹{b.amount.toLocaleString()}
                              </span>
                            )}
                            <span className="text-[10px] text-eco-800">{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ''}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-eco-400">
                              {b.quantity ? `₹${(b.amount / b.quantity).toFixed(2)} / kg` : `₹${b.amount.toLocaleString()}`}
                            </span>
                            {isOwner && (
                              <button 
                                onClick={() => handleAcceptBid(b._id)}
                                className="text-[10px] bg-eco-500/10 text-eco-400 border border-eco-500/30 px-2 py-1 rounded hover:bg-eco-500 hover:text-white transition-all font-bold"
                              >
                                Accept
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-eco-700 text-center mt-2">No bids yet.</div>
                )}
              </div>
            )}

            {requested && !isAuction && (
              <div className="glass-card p-4 text-center text-eco-400 border-eco-500/30">
                ✅ Request sent! Check your dashboard for updates.
              </div>
            )}

            {!user && (
              <Link to="/login" className="btn-primary w-full text-center block">
                Login to Request Deal
              </Link>
            )}

            {status === 'sold' && (
              <div className="glass-card p-4 text-center text-gray-400 border-gray-500/20">
                This material has been sold.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialDetailPage;
