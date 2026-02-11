import React, { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import { Search, X } from 'lucide-react';
import type { SearchResult } from 'leaflet-geosearch/dist/providers/provider.js';
import type { RawResult } from 'leaflet-geosearch/dist/providers/openStreetMapProvider.js';

interface SearchControlProps {
  onLocationSelected?: (lat: number, lng: number, label: string) => void;
}

// Container styles for search control positioning
const SEARCH_CONTAINER_CLASSES = 
  'absolute bottom-6 left-6 z-[1000] w-80 max-w-[400px] min-w-[320px] ' +
  'md:w-80 max-md:left-3 max-md:right-3 max-md:bottom-20 max-md:w-auto';

// Search input wrapper styles
const SEARCH_INPUT_WRAPPER_CLASSES = 
  'flex items-center bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] p-3';

const SearchControl: React.FC<SearchControlProps> = ({ onLocationSelected }) => {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult<RawResult>[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const provider = useRef(new OpenStreetMapProvider());
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const searchResults = await provider.current.search({ query: query.trim() });
        setResults(searchResults);
        setShowResults(true);
      } catch (error) {
        console.error('Error searching location:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const handleResultClick = (result: SearchResult<RawResult>) => {
    const { x: lng, y: lat } = result;
    
    // Center map on the location
    map.setView([lat, lng], 16);
    
    // Notify parent component
    if (onLocationSelected) {
      onLocationSelected(lat, lng, result.label);
    }

    // Clear search
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div 
      ref={containerRef}
      className={SEARCH_CONTAINER_CLASSES}
    >
      {/* Search Input */}
      <div className="relative">
        <div className={SEARCH_INPUT_WRAPPER_CLASSES}>
          <Search className="absolute left-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar dirección..."
            className="w-full py-2 pl-10 pr-10 text-sm border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
          />
          {query && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Loading indicator */}
        {isSearching && (
          <div className="absolute bottom-full mb-2 w-full bg-white rounded-lg shadow-lg p-3 text-center text-sm text-gray-600">
            Buscando...
          </div>
        )}

        {/* Results dropdown - now opens upward */}
        {showResults && results.length > 0 && !isSearching && (
          <div className="absolute bottom-full mb-2 w-full bg-white rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {results.map((result) => (
              <button
                key={result.raw.place_id}
                onClick={() => handleResultClick(result)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 text-sm"
              >
                <div className="font-medium text-gray-900">{result.label}</div>
                {result.raw?.address && (
                  <div className="text-xs text-gray-500 mt-1">
                    {result.raw.display_name}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* No results message - now opens upward */}
        {showResults && results.length === 0 && !isSearching && query.trim().length >= 3 && (
          <div className="absolute bottom-full mb-2 w-full bg-white rounded-lg shadow-lg p-3 text-center text-sm text-gray-600">
            No se encontraron resultados
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchControl;
