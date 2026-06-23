/**
 * FilterSidebar — for Marketplace page
 */
import { useState } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';

const CATEGORIES = [
  'All', 'Metal Scrap', 'Plastics', 'Paper & Cardboard', 'Glass',
  'Organic Waste', 'Textiles', 'Chemical Waste', 'Electronic Waste',
  'Wood & Timber', 'Rubber', 'Concrete & Construction', 'Other',
];

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt',  label: 'Oldest First' },
  { value: 'price.amount', label: 'Price: Low to High' },
  { value: '-price.amount', label: 'Price: High to Low' },
  { value: '-views',    label: 'Most Viewed' },
];

const FilterSidebar = ({ filters, onChange, onReset }) => {
  const [open, setOpen] = useState(false);

  const panel = (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-widest text-eco-600 mb-3">Category</h4>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onChange({ category: cat === 'All' ? '' : cat })}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                (filters.category === cat || (!filters.category && cat === 'All'))
                  ? 'bg-eco-500/20 border-eco-500/50 text-eco-400'
                  : 'border-white/10 text-eco-700 hover:border-eco-500/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-widest text-eco-600 mb-3">Sort By</h4>
        <select
          value={filters.sort || '-createdAt'}
          onChange={(e) => onChange({ sort: e.target.value })}
          className="input-field text-sm py-2"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-widest text-eco-600 mb-3">Price Range (₹)</h4>
        <div className="flex gap-2">
          <input
            type="number" placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => onChange({ minPrice: e.target.value })}
            className="input-field text-sm py-2"
          />
          <input
            type="number" placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
            className="input-field text-sm py-2"
          />
        </div>
      </div>

      {/* Quantity Range */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-widest text-eco-600 mb-3">Quantity (tonnes)</h4>
        <div className="flex gap-2">
          <input
            type="number" placeholder="Min"
            value={filters.minQty || ''}
            onChange={(e) => onChange({ minQty: e.target.value })}
            className="input-field text-sm py-2"
          />
          <input
            type="number" placeholder="Max"
            value={filters.maxQty || ''}
            onChange={(e) => onChange({ maxQty: e.target.value })}
            className="input-field text-sm py-2"
          />
        </div>
      </div>

      {/* Location radius */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-widest text-eco-600 mb-3">
          Radius: {filters.radius || 100} km
        </h4>
        <input
          type="range" min="10" max="500" step="10"
          value={filters.radius || 100}
          onChange={(e) => onChange({ radius: e.target.value })}
          className="w-full accent-eco-500"
        />
      </div>

      <button onClick={onReset} className="btn-ghost w-full text-sm py-2 hidden md:block">
        Reset Filters
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden flex items-center gap-2 btn-ghost text-sm py-2 mb-4"
        onClick={() => setOpen(!open)}
      >
        <SlidersHorizontal className="w-4 h-4" /> Filters
      </button>
      {/* Mobile overlay */}
      {open && (
        <>
          <div className="bottom-sheet-backdrop md:hidden" onClick={() => setOpen(false)} />
          <div className="bottom-sheet md:hidden p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-semibold text-lg">Filters</h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-dark-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="pb-4">
              {panel}
            </div>
            <div className="mt-4 pt-4 border-t border-dark-100 flex gap-3">
              <button
                onClick={() => { onReset(); setOpen(false); }}
                className="btn-ghost flex-1 text-sm py-2.5"
              >
                Reset All
              </button>
              <button
                onClick={() => setOpen(false)}
                className="btn-primary flex-1 text-sm py-2.5"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-72 shrink-0">
        <div className="glass-card p-5 sticky top-20">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-semibold text-sm flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-eco-500" /> Filters
            </h3>
          </div>
          {panel}
        </div>
      </aside>
    </>
  );
};

export default FilterSidebar;
