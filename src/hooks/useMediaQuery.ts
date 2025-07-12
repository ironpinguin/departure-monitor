import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design using CSS media queries
 * @param query - CSS media query string (e.g., '(max-width: 768px)')
 * @returns boolean - true if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQueryList.matches);
    
    // Define the handler function
    const handleMediaQueryChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Add event listener
    mediaQueryList.addEventListener('change', handleMediaQueryChange);
    
    // Cleanup function
    return () => {
      mediaQueryList.removeEventListener('change', handleMediaQueryChange);
    };
  }, [query]);

  return matches;
}

/**
 * Predefined breakpoint hooks for common responsive design needs
 */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsSmallMobile = () => useMediaQuery('(max-width: 480px)');
export const useIsLargeMobile = () => useMediaQuery('(min-width: 481px) and (max-width: 767px)');