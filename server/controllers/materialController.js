/**
 * Material Controller
 * CRUD for waste material listings + intelligent matching
 */

const Material    = require('../models/Material');
const Bid         = require('../models/Bid');
const Transaction = require('../models/Transaction');
const User        = require('../models/User');
const { cloudinary } = require('../middleware/upload');
const { getCarbonFactor } = require('../utils/carbonCalc');
const { buildGeoNearQuery } = require('../utils/geoUtils');
const OpenAI = require('openai');

// In-memory dedup cache: "materialId:ip" -> timestamp
// Prevents the same visitor counting more than once per hour
const viewCache = new Map();
const VIEW_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * POST /api/materials
 * Create a new material listing (Seller only)
 */
const createMaterial = async (req, res) => {
  try {
    const {
      title, description, category, quantity, unit,
      price, negotiable, currency,
      lat, lng, address, city, state,
      tags, condition, availableFrom,
    } = req.body;

    // Process uploaded images
    const images = (req.files || []).map((file) => {
      let url = file.path;
      if (!process.env.CLOUDINARY_CLOUD_NAME && file.filename) {
        const host = req.get('host');
        url = `${req.protocol}://${host}/uploads/${file.filename}`;
      }
      return {
        url,
        publicId: file.filename,
      };
    });

    const material = await Material.create({
      title,
      description,
      category,
      quantity: { value: Number(quantity), unit: unit || 'tonnes' },
      price:    { amount: Number(price), negotiable: negotiable !== 'false', currency: currency || 'INR' },
      images,
      seller: req.user._id,
      location: {
        type: 'Point',
        coordinates: [Number(lng) || 0, Number(lat) || 0],
        address, city, state,
      },
      tags:         tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(t => t !== '')) : [],
      carbonFactor: getCarbonFactor(category),
      condition,
      availableFrom,
      isAuction: req.body.isAuction === 'true' || req.body.isAuction === true,
      auctionDetails: req.body.isAuction ? {
        startingPrice: Number(req.body.startingPrice) || 0,
        currentHighestBid: Number(req.body.startingPrice) || 0,
        endTime: new Date(Date.now() + (Number(req.body.auctionDurationDays) || 7) * 24 * 60 * 60 * 1000),
      } : undefined,
    });

    await material.populate('seller', 'name companyName verified');

    // Award points & log activity for listing material
    const sellerUser = await User.findById(req.user._id);
    if (sellerUser) {
      sellerUser.ecoPoints += 15;
      sellerUser.sustainabilityScore = Math.min(100, sellerUser.sustainabilityScore + 3);
      sellerUser.activities.push({
        type: 'Listed Material',
        description: `Listed new reusable material: ${material.title}`,
        points: 15,
      });

      // Badge promotions
      const currentBadges = sellerUser.badges || [];
      if (sellerUser.ecoPoints >= 500 && !currentBadges.includes('Sustainability Champion')) {
        sellerUser.badges.push('Sustainability Champion');
      }
      if (sellerUser.ecoPoints >= 200 && !currentBadges.includes('Green Advocate')) {
        sellerUser.badges.push('Green Advocate');
      }
      await sellerUser.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('materialCreated', material);
    }

    res.status(201).json({ message: 'Material listed successfully', material });
  } catch (err) {
    console.error('Create material error:', err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
    }
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/materials
 * List all active materials with filtering, search, and pagination
 */
const getMaterials = async (req, res) => {
  try {
    const {
      page = 1, limit = 12, search, category, minPrice, maxPrice,
      minQty, maxQty, lat, lng, radius = 100, sort = '-createdAt',
      status,
    } = req.query;

    // Default: show both active and sold; allow explicit filter via ?status=
    const query = {
      status: status ? status : { $in: ['active', 'sold'] },
    };

    // Text search
    if (search) {
      query.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags:        { $regex: search, $options: 'i' } },
      ];
    }

    // Category filter
    if (category && category !== 'All') query.category = category;

    // Price range
    if (minPrice || maxPrice) {
      query['price.amount'] = {};
      if (minPrice) query['price.amount'].$gte = Number(minPrice);
      if (maxPrice) query['price.amount'].$lte = Number(maxPrice);
    }

    // Quantity range
    if (minQty || maxQty) {
      query['quantity.value'] = {};
      if (minQty) query['quantity.value'].$gte = Number(minQty);
      if (maxQty) query['quantity.value'].$lte = Number(maxQty);
    }

    // Geospatial filter
    if (lat && lng) {
      query.location = buildGeoNearQuery(Number(lat), Number(lng), Number(radius));
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Material.countDocuments(query);

    const materials = await Material.find(query)
      .populate('seller', 'name companyName verified location')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      materials,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/materials/:id
 * Get a single material by ID — does NOT increment views (use POST /:id/view)
 */
const getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id)
      .populate('seller', 'name companyName industryType verified location avatar bio phone');

    if (!material) return res.status(404).json({ message: 'Material not found' });

    res.json({ material });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/materials/:id/view
 * Increment view count — deduplicated per IP per hour so double-renders don't double-count
 */
const recordView = async (req, res) => {
  try {
    const ip  = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const key = `${req.params.id}:${ip}`;
    const now = Date.now();

    const lastSeen = viewCache.get(key);
    if (lastSeen && now - lastSeen < VIEW_TTL_MS) {
      // Already counted this visitor recently — return silently
      return res.json({ counted: false });
    }

    // Check ownership — don't count seller's own views
    const material = await Material.findById(req.params.id).select('seller views');
    if (!material) return res.status(404).json({ message: 'Material not found' });

    const isOwner = req.user && material.seller.toString() === req.user._id.toString();
    if (!isOwner) {
      await Material.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
      viewCache.set(key, now);
    }

    res.json({ counted: !isOwner });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PUT /api/materials/:id
 * Update a material listing (owner only)
 */
const updateMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: 'Material not found' });

    // Ensure ownership
    if (material.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }

    const allowedFields = [
      'title', 'description', 'category', 'status', 'condition',
      'tags', 'availableFrom',
    ];

    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) {
        if (f === 'tags') {
          const tagsVal = req.body.tags;
          material.tags = Array.isArray(tagsVal) ? tagsVal : tagsVal.split(',').map((t) => t.trim()).filter((t) => t !== '');
        } else {
          material[f] = req.body[f];
        }
      }
    });

    if (req.body.quantity) {
      material.quantity.value = Number(req.body.quantity) || material.quantity.value;
      if (req.body.unit) material.quantity.unit = req.body.unit;
    }
    if (req.body.price) {
      material.price.amount = Number(req.body.price) || material.price.amount;
      if (req.body.negotiable !== undefined) material.price.negotiable = req.body.negotiable !== 'false';
    }
    if (req.body.lat && req.body.lng) {
      material.location.coordinates = [Number(req.body.lng), Number(req.body.lat)];
      if (req.body.address) material.location.address = req.body.address;
    }
    if (req.body.category) {
      material.carbonFactor = getCarbonFactor(req.body.category);
    }

    // Add new images if any
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => {
        let url = file.path;
        if (!process.env.CLOUDINARY_CLOUD_NAME && file.filename) {
          const host = req.get('host');
          url = `${req.protocol}://${host}/uploads/${file.filename}`;
        }
        return {
          url,
          publicId: file.filename,
        };
      });
      material.images.push(...newImages);
    }

    await material.save();
    await material.populate('seller', 'name companyName verified');

    res.json({ message: 'Material updated', material });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE /api/materials/:id
 * Delete a material listing (owner or admin)
 */
const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: 'Material not found' });

    const isOwner = material.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

    // Delete images from Cloudinary (only if configured)
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      for (const img of material.images) {
        if (img.publicId) {
          await cloudinary.uploader.destroy(img.publicId).catch(() => {});
        }
      }
    }

    await material.deleteOne();
    res.json({ message: 'Material deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/materials/matches
 * Intelligent matching: finds materials matching user's industry + location
 * For buyers: suggests materials in categories relevant to their industry
 */
const getMatches = async (req, res) => {
  try {
    const user = req.user;
    const { lat, lng, radius = 200 } = req.query;

    const query = { status: 'active' };

    // Geo filter
    if (lat && lng) {
      query.location = buildGeoNearQuery(Number(lat), Number(lng), Number(radius));
    }

    // Industry-based category relevance mapping
    const industryToCategoryMap = {
      'Manufacturing':   ['Metal Scrap', 'Plastics', 'Chemical Waste', 'Electronic Waste'],
      'Construction':    ['Concrete & Construction', 'Metal Scrap', 'Wood & Timber'],
      'Agriculture':     ['Organic Waste', 'Paper & Cardboard', 'Chemical Waste'],
      'Chemical':        ['Chemical Waste', 'Plastics', 'Glass'],
      'Textile':         ['Textiles', 'Chemical Waste', 'Organic Waste'],
      'Food & Beverage': ['Organic Waste', 'Paper & Cardboard', 'Glass', 'Plastics'],
      'Automotive':      ['Metal Scrap', 'Rubber', 'Electronic Waste'],
      'Electronics':     ['Electronic Waste', 'Metal Scrap', 'Plastics'],
      'Paper & Pulp':    ['Paper & Cardboard', 'Wood & Timber', 'Organic Waste'],
      'Mining':          ['Metal Scrap', 'Chemical Waste', 'Rubber'],
    };

    const relevantCategories = user.industryType
      ? (industryToCategoryMap[user.industryType] || [])
      : [];

    if (relevantCategories.length > 0) {
      query.category = { $in: relevantCategories };
    }

    const matches = await Material.find(query)
      .populate('seller', 'name companyName verified location')
      .sort('-createdAt')
      .limit(20);

    res.json({ matches, count: matches.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/materials/my — Seller's own listings
 */
const getMyMaterials = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { seller: req.user._id };
    if (status) query.status = status;

    const materials = await Material.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Material.countDocuments(query);
    res.json({ materials, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/materials/:id/bid
 * Place a bid on an auction material
 */
const placeBid = async (req, res) => {
  try {
    const { amount } = req.body;
    const material = await Material.findById(req.params.id);

    if (!material) return res.status(404).json({ message: 'Material not found' });
    if (!material.isAuction) return res.status(400).json({ message: 'This material is not an auction' });
    if (new Date() > new Date(material.auctionDetails.endTime)) {
      return res.status(400).json({ message: 'Auction has ended' });
    }
    if (material.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot bid on your own listing' });
    }

    const bidAmount = Number(amount);
    if (bidAmount <= material.auctionDetails.currentHighestBid) {
      return res.status(400).json({ message: `Bid must be higher than ₹${material.auctionDetails.currentHighestBid}` });
    }

    // Create bid
    const bid = await Bid.create({
      material: material._id,
      bidder: req.user._id,
      amount: bidAmount,
    });

    // Update material
    material.auctionDetails.currentHighestBid = bidAmount;
    await material.save();

    await bid.populate('bidder', 'name companyName');
    
    // In a real app, emit a socket.io event here
    const io = req.app.get('io');
    if (io) {
      io.to(material._id.toString()).emit('newBid', bid);
    }

    res.status(201).json({ message: 'Bid placed successfully', bid });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/materials/:id/bids
 * Get all bids for a material
 */
const getBids = async (req, res) => {
  try {
    const bids = await Bid.find({ material: req.params.id })
      .populate('bidder', 'name companyName')
      .sort('-amount');
    res.json({ bids });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/materials/:id/accept-bid
 * Seller accepts a specific bid
 */
const acceptBid = async (req, res) => {
  try {
    const { bidId } = req.body;
    const material = await Material.findById(req.params.id);

    if (!material) return res.status(404).json({ message: 'Material not found' });

    // Verify ownership
    if (material.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept bids for this listing' });
    }

    const bid = await Bid.findById(bidId).populate('bidder', 'name companyName');
    if (!bid) return res.status(404).json({ message: 'Bid not found' });

    if (bid.material.toString() !== material._id.toString()) {
      return res.status(400).json({ message: 'Bid does not belong to this material' });
    }

    // Calculate CO2 saved
    const carbonSaved = Math.round(
      (material.quantity?.value || 0) * (material.carbonFactor || 200)
    );

    // Create a completed Transaction for the winning bidder
    const winningTransaction = await Transaction.create({
      buyer:       bid.bidder._id,
      seller:      req.user._id,
      material:    material._id,
      status:      'completed',
      completedAt: new Date(),
      quantity:    { value: material.quantity?.value || 0, unit: material.quantity?.unit || 'tonnes' },
      agreedPrice: bid.amount,
      carbonSaved,
      sellerNote:  'Deal closed via auction bid acceptance.',
    });

    // Create rejected transactions for ALL other unique bidders
    const allBids = await Bid.find({ material: material._id, _id: { $ne: bid._id } });
    const rejectedBidders = new Set();
    for (const otherBid of allBids) {
      const bidderId = otherBid.bidder.toString();
      if (!rejectedBidders.has(bidderId)) {
        rejectedBidders.add(bidderId);
        await Transaction.create({
          buyer:      otherBid.bidder,
          seller:     req.user._id,
          material:   material._id,
          status:     'rejected',
          quantity:   { value: material.quantity?.value || 0, unit: material.quantity?.unit || 'tonnes' },
          agreedPrice: otherBid.amount,
          carbonSaved: 0,
          sellerNote: 'Another bid was accepted for this auction listing.',
        });
      }
    }

    // Update seller profile
    const sellerUser = await User.findById(req.user._id);
    if (sellerUser) {
      sellerUser.carbonStats.totalSaved += carbonSaved;
      sellerUser.carbonStats.totalTransactions += 1;
      sellerUser.ecoPoints += 100;
      sellerUser.materialsReused += 1;
      sellerUser.sustainabilityScore = Math.min(100, sellerUser.sustainabilityScore + 15);
      sellerUser.activities.push({
        type: 'Exchanged Material',
        description: `Auction completed for ${material.title}`,
        points: 100,
      });
      const currentBadges = sellerUser.badges || [];
      if (sellerUser.ecoPoints >= 500 && !currentBadges.includes('Sustainability Champion')) {
        sellerUser.badges.push('Sustainability Champion');
      }
      if (sellerUser.ecoPoints >= 200 && !currentBadges.includes('Green Advocate')) {
        sellerUser.badges.push('Green Advocate');
      }
      await sellerUser.save();
    }

    // Update winning buyer profile
    const buyerUser = await User.findById(bid.bidder._id);
    if (buyerUser) {
      buyerUser.carbonStats.totalSaved += carbonSaved;
      buyerUser.carbonStats.totalTransactions += 1;
      buyerUser.ecoPoints += 100;
      buyerUser.materialsReused += 1;
      buyerUser.sustainabilityScore = Math.min(100, buyerUser.sustainabilityScore + 15);
      buyerUser.activities.push({
        type: 'Exchanged Material',
        description: `Won auction and acquired ${material.title}`,
        points: 100,
      });
      const currentBadges = buyerUser.badges || [];
      if (buyerUser.ecoPoints >= 500 && !currentBadges.includes('Sustainability Champion')) {
        buyerUser.badges.push('Sustainability Champion');
      }
      if (buyerUser.ecoPoints >= 200 && !currentBadges.includes('Green Advocate')) {
        buyerUser.badges.push('Green Advocate');
      }
      await buyerUser.save();
    }

    // Mark material as sold and record winning bid
    material.status = 'sold';
    if (material.isAuction) {
      material.auctionDetails.winningBid = bid._id;
    }
    await material.save();

    // Emit socket event to notify the winning bidder
    const io = req.app.get('io');
    if (io) {
      io.to(bid.bidder._id.toString()).emit('bidAccepted', {
        materialId: material._id,
        bidId:      bid._id,
        amount:     bid.amount,
        title:      material.title,
      });
    }

    res.json({ message: 'Bid accepted successfully', material });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/materials/analyze-image
 * Analyze uploaded image using OpenAI Vision
 */
const analyzeImage = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: 'No image provided' });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://models.inference.ai.azure.com',
    });

    const prompt = `You are an expert waste material classifier. Analyze this image of waste/scrap material and provide a JSON response with the following fields: 
- 'title' (a short, descriptive title)
- 'description' (a brief description)
- 'category' (choose EXACTLY one from: Metal Scrap, Plastics, Paper & Cardboard, Glass, Organic Waste, Textiles, Chemical Waste, Electronic Waste, Wood & Timber, Rubber, Concrete & Construction, Other)
- 'condition' (choose EXACTLY one from: New, Used, Needs Repair, Scrap)
- 'tags' (a comma-separated string of 3-5 relevant keywords)
- 'unit' (choose EXACTLY one from: kg, tonnes, litres, units, cubic metres)
- 'price' (estimated market price in INR (₹) per unit of the material based on typical Indian scrap/recycling rates. Return ONLY the number/integer)
- 'priceExplanation' (a brief 1-sentence explanation of the estimated price, e.g. "Copper scrap typically trades at ₹600-750 per kg based on purity.").
Output ONLY valid JSON.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: image } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);
    
    // Normalize condition to match database enum ('new', 'good', 'fair', 'poor')
    if (parsed.condition) {
      const cond = parsed.condition.toLowerCase();
      if (cond.includes('new')) {
        parsed.condition = 'new';
      } else if (cond.includes('repair') || cond.includes('fair')) {
        parsed.condition = 'fair';
      } else if (cond.includes('scrap') || cond.includes('poor')) {
        parsed.condition = 'poor';
      } else {
        parsed.condition = 'good'; // fallback for 'used' / 'good'
      }
    }
    
    res.json(parsed);
  } catch (err) {
    console.error('AI Analysis Error:', err);
    res.status(500).json({ message: 'Failed to analyze image' });
  }
};

module.exports = {
  createMaterial, getMaterials, getMaterialById, recordView,
  updateMaterial, deleteMaterial, getMatches, getMyMaterials,
  placeBid, getBids, acceptBid, analyzeImage,
};
