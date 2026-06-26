/**
 * MarketplacePage — listings grid with filter sidebar
 */
import { useState, useEffect, useCallback } from 'react';
import FilterSidebar from '../components/FilterSidebar';
import { materialService } from '../services';
import MaterialCard from '../components/MaterialCard';
import { Search, Loader2, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import debounce from '../utils/debounce';
import { useSocket } from '../context/SocketContext';

const DEFAULT_FILTERS = {
  category: '', sort: '-createdAt', minPrice: '', maxPrice: '',
  minQty: '', maxQty: '', radius: 100,
};

const MarketplacePage = () => {
  const [materials, setMaterials]  = useState([]);
  const [total,     setTotal]      = useState(0);
  const [page,      setPage]       = useState(1);
  const [pages,     setPages]      = useState(1);
  const [loading,   setLoading]    = useState(true);
  const [search,    setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filters,   setFilters]    = useState(DEFAULT_FILTERS);
  const socket = useSocket();

  const debouncedSetSearch = useCallback(
    debounce((q) => {
      setSearch(q);
      setPage(1);
    }, 500),
    []
  );

  const fetchMaterials = useCallback(async (q, f, p, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = { page: p, limit: 12, ...f };
      if (q) params.search = q;
      const { data } = await materialService.getAll(params);
      setMaterials(data.materials);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      setMaterials([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials(search, filters, page);
  }, [search, filters, page, fetchMaterials]);

  // Handle live material listings
  useEffect(() => {
    if (socket) {
      const handleNewMaterial = () => {
        fetchMaterials(search, filters, page);
      };
      socket.on('materialCreated', handleNewMaterial);
      return () => {
        socket.off('materialCreated', handleNewMaterial);
      };
    }
  }, [socket, fetchMaterials, search, filters, page]);



  const handleFilterChange = (newF) => {
    setFilters((prev) => ({ ...prev, ...newF }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearch('');
    setPage(1);
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-1 md:mb-2">Material Marketplace</h1>
          <p className="text-eco-700">
            {total.toLocaleString()} material{total !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-eco-700" />
          <input
            type="text"
            placeholder="Search materials, categories, tags..."
            value={searchInput}
            onChange={(e) => { 
              setSearchInput(e.target.value); 
              debouncedSetSearch(e.target.value); 
            }}
            className="input-field pl-12 text-base py-4"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-eco-600 animate-spin" />
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Filter sidebar */}
          <FilterSidebar filters={filters} onChange={handleFilterChange} onReset={handleResetFilters} />

          {/* Main grid */}
          <div className="flex-1 min-w-0">
            {loading && materials.length === 0 ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="glass-card h-72 animate-pulse" />
                ))}
              </div>
            ) : materials.length === 0 ? (
              <div className="glass-card p-16 text-center">
                <Package className="w-12 h-12 mx-auto text-eco-800 mb-3" />
                <p className="text-eco-700">No materials found. Try adjusting your filters.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                  {materials.map((m) => (
                    <MaterialCard key={m._id} material={m} />
                  ))}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-8">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn-ghost py-2 px-3 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-eco-700">
                      Page {page} of {pages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(pages, p + 1))}
                      disabled={page === pages}
                      className="btn-ghost py-2 px-3 disabled:opacity-30"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;
