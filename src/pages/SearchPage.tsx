import React, { useState, useEffect } from 'react';
import {
  Filter,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Star,
  Check,
} from 'lucide-react';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { api } from '../services/api';

interface SearchPageProps {
  initialQuery?: string;
  initialCategory?: string;
  categories: Category[];
  onNavigate: (page: string, param?: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  initialQuery = '',
  initialCategory = 'all',
  categories,
  onNavigate,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sort, setSort] = useState('featured');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sync props when user performs top search
  useEffect(() => {
    setQuery(initialQuery);
    setSelectedCategory(initialCategory);
    setPage(1);
  }, [initialQuery, initialCategory]);

  // Fetch products matching filters
  useEffect(() => {
    async function fetchCatalog() {
      try {
        setLoading(true);
        const params: Record<string, any> = {
          page,
          limit: 12,
          sort,
        };

        if (query) params.q = query;
        if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;
        if (ratingFilter) params.rating = ratingFilter;
        if (inStockOnly) params.inStock = 'true';
        if (selectedBrand) params.brand = selectedBrand;

        const res = await api.products.list(params);
        if (res.success) {
          setProducts(res.products || []);
          setTotal(res.pagination.total);
          setTotalPages(res.pagination.totalPages);

          // Extract brands for filter list
          const brands = Array.from(
            new Set((res.products || []).map((p) => p.brand).filter(Boolean))
          );
          if (brands.length > 0) {
            setAvailableBrands((prev) => Array.from(new Set([...prev, ...brands])));
          }
        }
      } catch (err) {
        console.error('Error fetching search results:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCatalog();
  }, [query, selectedCategory, sort, minPrice, maxPrice, ratingFilter, inStockOnly, selectedBrand, page]);

  const handleResetFilters = () => {
    setQuery('');
    setSelectedCategory('all');
    setSort('featured');
    setMinPrice('');
    setMaxPrice('');
    setRatingFilter(null);
    setInStockOnly(false);
    setSelectedBrand(null);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#eaeded] py-6">
      <div className="max-w-[1500px] mx-auto px-4">
        {/* Top Header / Results summary bar */}
        <div className="bg-white px-4 py-3 rounded-lg shadow-sm border border-slate-200 mb-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-semibold text-slate-800">
                {total === 0 ? 0 : (page - 1) * 12 + 1}-{Math.min(page * 12, total)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{total}</span> results{' '}
              {query && (
                <>
                  for "<span className="text-amber-700 font-bold">{query}</span>"
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 text-xs font-semibold text-slate-700 bg-slate-50"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Sort by:</span>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                  className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 pr-7 text-xs font-medium text-slate-800 appearance-none focus:outline-none cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Avg. Customer Review</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid: Left Filters Sidebar + Right Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left Sidebar Filter Column */}
          <aside
            className={`lg:block bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-6 ${
              showMobileFilters ? 'block mb-4' : 'hidden'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Filter className="w-4 h-4 text-amber-600" />
                <span>Filters</span>
              </div>
              <button
                onClick={handleResetFilters}
                className="text-xs text-sky-700 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            </div>

            {/* Category Filter */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                Department
              </h3>
              <div className="space-y-1.5 text-xs">
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setPage(1);
                  }}
                  className={`w-full text-left py-1 px-1.5 rounded transition-colors ${
                    selectedCategory === 'all'
                      ? 'font-bold text-amber-700 bg-amber-50'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Departments
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCategory(c.slug);
                      setPage(1);
                    }}
                    className={`w-full text-left py-1 px-1.5 rounded transition-colors ${
                      selectedCategory === c.slug
                        ? 'font-bold text-amber-700 bg-amber-50'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Rating Filter */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                Customer Reviews
              </h3>
              <div className="space-y-1.5 text-xs">
                {[4, 3, 2].map((stars) => {
                  const isSelected = ratingFilter === stars;
                  return (
                    <button
                      key={stars}
                      onClick={() => {
                        setRatingFilter(isSelected ? null : stars);
                        setPage(1);
                      }}
                      className={`w-full flex items-center gap-1.5 py-1 px-1.5 rounded text-left transition-colors ${
                        isSelected ? 'bg-amber-50 font-bold text-amber-900' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex text-amber-500">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i <= stars
                                ? 'fill-amber-500 text-amber-500'
                                : 'fill-slate-200 text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-slate-600 text-[11px]">& Up</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                Price (₹)
              </h3>
              <div className="flex items-center gap-2 text-xs mb-3">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-2 py-1.5 border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-2 py-1.5 border rounded border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                <button
                  onClick={() => {
                    setMinPrice('0');
                    setMaxPrice('5000');
                    setPage(1);
                  }}
                  className="block hover:text-amber-700 py-0.5"
                >
                  Under ₹5,000
                </button>
                <button
                  onClick={() => {
                    setMinPrice('5000');
                    setMaxPrice('20000');
                    setPage(1);
                  }}
                  className="block hover:text-amber-700 py-0.5"
                >
                  ₹5,000 to ₹20,000
                </button>
                <button
                  onClick={() => {
                    setMinPrice('20000');
                    setMaxPrice('60000');
                    setPage(1);
                  }}
                  className="block hover:text-amber-700 py-0.5"
                >
                  ₹20,000 to ₹60,000
                </button>
                <button
                  onClick={() => {
                    setMinPrice('60000');
                    setMaxPrice('');
                    setPage(1);
                  }}
                  className="block hover:text-amber-700 py-0.5"
                >
                  Over ₹60,000
                </button>
              </div>
            </div>

            {/* In-stock Availability Toggle */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                Availability
              </h3>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setInStockOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                />
                <span>Include In-Stock Only</span>
              </label>
            </div>
          </aside>

          {/* Right Product Grid Area */}
          <div className="lg:col-span-3 space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-80 bg-white rounded-lg p-4 animate-pulse space-y-3">
                    <div className="aspect-square bg-slate-100 rounded" />
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white p-12 rounded-lg border border-slate-200 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Filter className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No products found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  We couldn't find any items matching your active search and filter settings. Try clearing some filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-5 py-2.5 rounded-full text-xs transition-colors shadow-xs"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded text-xs font-semibold transition-colors ${
                        page === p
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
