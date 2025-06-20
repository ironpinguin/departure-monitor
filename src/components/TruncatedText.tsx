import React, { useState, useRef, useEffect } from 'react';

interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  style?: React.CSSProperties;
}

const TruncatedText: React.FC<TruncatedTextProps> = ({ 
  text, 
  maxLength = 25, 
  className = '', 
  style = {} 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const textRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const isTruncated = text.length > maxLength;
  const displayText = isTruncated ? `${text.substring(0, maxLength)}...` : text;

  const updateTooltipPosition = () => {
    if (textRef.current && tooltipRef.current) {
      const textRect = textRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let top = textRect.bottom + 8;
      let left = textRect.left + (textRect.width / 2) - (tooltipRect.width / 2);
      
      // Stelle sicher, dass der Tooltip nicht über den Bildschirmrand hinausgeht
      if (left < 8) left = 8;
      if (left + tooltipRect.width > window.innerWidth - 8) {
        left = window.innerWidth - tooltipRect.width - 8;
      }
      
      // Wenn nicht genug Platz unten, zeige oben
      if (top + tooltipRect.height > window.innerHeight - 8) {
        top = textRect.top - tooltipRect.height - 8;
      }
      
      setTooltipPosition({ top, left });
    }
  };

  useEffect(() => {
    if (showTooltip) {
      updateTooltipPosition();
      window.addEventListener('scroll', updateTooltipPosition);
      window.addEventListener('resize', updateTooltipPosition);
      
      return () => {
        window.removeEventListener('scroll', updateTooltipPosition);
        window.removeEventListener('resize', updateTooltipPosition);
      };
    }
  }, [showTooltip]);

  const handleMouseEnter = () => {
    if (isTruncated) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const handleClick = () => {
    if (isTruncated) {
      setShowTooltip(!showTooltip);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
    if (event.key === 'Escape') {
      setShowTooltip(false);
    }
  };

  if (!isTruncated) {
    return (
      <span className={className} style={style}>
        {text}
      </span>
    );
  }

  return (
    <>
      <span
        ref={textRef}
        className={`truncated-text ${className}`}
        style={{
          cursor: 'pointer',
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
          ...style
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Gekürzter Text: ${text}. Drücken Sie Enter um den vollständigen Text anzuzeigen.`}
        aria-expanded={showTooltip}
        aria-describedby={showTooltip ? 'truncated-tooltip' : undefined}
      >
        {displayText}
      </span>
      
      {showTooltip && (
        <div
          ref={tooltipRef}
          id="truncated-tooltip"
          className="truncated-text-tooltip"
          style={{
            position: 'fixed',
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            backgroundColor: '#333',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            maxWidth: '300px',
            wordWrap: 'break-word',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            pointerEvents: 'none'
          }}
          role="tooltip"
          aria-live="polite"
        >
          {text}
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderBottom: '4px solid #333'
            }}
          />
        </div>
      )}
    </>
  );
};

export default TruncatedText;