import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

function HoverModal({ text, children }) {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({
        top: 0,
        left: 0,
        vertical: 'below',
        horizontal: 'center',
        width: 0,
    });
    const ref = useRef(null);
    // Use function to calculate responsive dimensions to avoid window access during SSR
    const getTooltipDimensions = () => {
        const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
        return {
            width: windowWidth < 640 ? Math.min(300, windowWidth - 32) : 350,
            maxHeight: windowWidth < 640 ? 400 : 500 // Increased max height, no fixed height
        };
    };
    const { width: TOOLTIP_WIDTH, maxHeight: TOOLTIP_MAX_HEIGHT } = getTooltipDimensions();

    // Enhanced collision detection and smart positioning
    const findBestPosition = (triggerRect, tooltipWidth, tooltipHeight, scrollX, scrollY, viewportWidth, viewportHeight) => {
        const MARGIN = 16; // Minimum margin from viewport edges
        const GAP = 10; // Gap between trigger and tooltip
        
        // Define all possible positions to try (in order of preference)
        const positions = [
            // Below center (preferred)
            {
                name: 'below-center',
                top: triggerRect.bottom + scrollY + GAP,
                left: triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipWidth / 2),
                vertical: 'below',
                horizontal: 'center'
            },
            // Above center
            {
                name: 'above-center',
                top: triggerRect.top + scrollY - tooltipHeight - GAP,
                left: triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipWidth / 2),
                vertical: 'above',
                horizontal: 'center'
            },
            // Right center
            {
                name: 'right-center',
                top: triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipHeight / 2),
                left: triggerRect.right + scrollX + GAP,
                vertical: 'side',
                horizontal: 'right'
            },
            // Left center
            {
                name: 'left-center',
                top: triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipHeight / 2),
                left: triggerRect.left + scrollX - tooltipWidth - GAP,
                vertical: 'side',
                horizontal: 'left'
            },
            // Below left
            {
                name: 'below-left',
                top: triggerRect.bottom + scrollY + GAP,
                left: triggerRect.left + scrollX,
                vertical: 'below',
                horizontal: 'left'
            },
            // Below right
            {
                name: 'below-right',
                top: triggerRect.bottom + scrollY + GAP,
                left: triggerRect.right + scrollX - tooltipWidth,
                vertical: 'below',
                horizontal: 'right'
            },
            // Above left
            {
                name: 'above-left',
                top: triggerRect.top + scrollY - tooltipHeight - GAP,
                left: triggerRect.left + scrollX,
                vertical: 'above',
                horizontal: 'left'
            },
            // Above right
            {
                name: 'above-right',
                top: triggerRect.top + scrollY - tooltipHeight - GAP,
                left: triggerRect.right + scrollX - tooltipWidth,
                vertical: 'above',
                horizontal: 'right'
            }
        ];

        // Check if a position fits within viewport bounds
        const isPositionValid = (pos) => {
            return (
                pos.left >= scrollX + MARGIN &&
                pos.left + tooltipWidth <= scrollX + viewportWidth - MARGIN &&
                pos.top >= scrollY + MARGIN &&
                pos.top + tooltipHeight <= scrollY + viewportHeight - MARGIN
            );
        };

        // Try positions in order and return the first valid one
        for (const position of positions) {
            if (isPositionValid(position)) {
                return position;
            }
        }

        // Fallback: force the tooltip to fit in viewport (prefer below-center but constrain to bounds)
        const fallbackPosition = positions[0]; // below-center
        return {
            ...fallbackPosition,
            top: Math.max(scrollY + MARGIN, Math.min(fallbackPosition.top, scrollY + viewportHeight - tooltipHeight - MARGIN)),
            left: Math.max(scrollX + MARGIN, Math.min(fallbackPosition.left, scrollX + viewportWidth - tooltipWidth - MARGIN))
        };
    };

    // Calculate arrow position based on tooltip position relative to trigger
    const calculateArrowPosition = (triggerRect, tooltipPosition, tooltipWidth, scrollX, scrollY) => {
        const triggerCenterX = triggerRect.left + scrollX + (triggerRect.width / 2);
        const triggerCenterY = triggerRect.top + scrollY + (triggerRect.height / 2);
        const tooltipLeft = tooltipPosition.left;
        const tooltipTop = tooltipPosition.top;

        if (tooltipPosition.vertical === 'below' || tooltipPosition.vertical === 'above') {
            // Horizontal arrow positioning
            const arrowLeft = Math.max(12, Math.min(tooltipWidth - 12, triggerCenterX - tooltipLeft - 6));
            return { arrowLeft, arrowTop: null };
        } else {
            // Vertical arrow positioning (for side tooltips)
            const arrowTop = Math.max(12, Math.min(200, triggerCenterY - tooltipTop - 6)); // Assuming max tooltip height for calculation
            return { arrowLeft: null, arrowTop };
        }
    };

    const showVisibility = () => {
        setIsVisible(true);
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const scrollY = window.scrollY || window.pageYOffset;
            const scrollX = window.scrollX || window.pageXOffset;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

            // Create a temporary element to measure content height
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.visibility = 'hidden';
            tempDiv.style.width = `${TOOLTIP_WIDTH}px`;
            tempDiv.style.fontSize = window.innerWidth < 640 ? '12px' : '14px';
            tempDiv.style.lineHeight = '1.4';
            tempDiv.style.padding = window.innerWidth < 640 ? '12px 16px' : '16px';
            tempDiv.style.pointerEvents = 'none';
            tempDiv.style.top = '-9999px';
            tempDiv.className = 'text-xs sm:text-sm leading-snug p-3 sm:p-4 text-left font-sans';
            
            // Handle React elements by creating a temporary render
            let tooltipHeight;
            if (React.isValidElement(text)) {
                // For React elements, use a conservative height estimate
                const estimatedHeight = 200; // Base height for tables and complex content
                document.body.appendChild(tempDiv);
                tempDiv.innerHTML = '<div>Loading...</div>'; // Placeholder
                const baseHeight = tempDiv.offsetHeight;
                document.body.removeChild(tempDiv);
                tooltipHeight = Math.max(estimatedHeight, baseHeight);
            } else {
                // For simple text content
                tempDiv.innerHTML = typeof text === 'string' ? text : 'Loading...';
                document.body.appendChild(tempDiv);
                const contentHeight = tempDiv.offsetHeight;
                document.body.removeChild(tempDiv);
                tooltipHeight = Math.min(contentHeight + 20, TOOLTIP_MAX_HEIGHT);
            }

            // Use enhanced positioning logic
            const bestPosition = findBestPosition(
                rect,
                TOOLTIP_WIDTH,
                tooltipHeight,
                scrollX,
                scrollY,
                viewportWidth,
                viewportHeight
            );

            // Calculate arrow position
            const { arrowLeft, arrowTop } = calculateArrowPosition(
                rect,
                bestPosition,
                TOOLTIP_WIDTH,
                scrollX,
                scrollY
            );

            setCoords({
                top: bestPosition.top,
                left: bestPosition.left,
                vertical: bestPosition.vertical,
                horizontal: bestPosition.horizontal,
                width: rect.width,
                tooltipWidth: TOOLTIP_WIDTH,
                tooltipHeight,
                arrowLeft,
                arrowTop,
            });
        }
    };

    const hideVisibility = () => {
        setIsVisible(false);
    };

    return (
        <span
            ref={ref}
            className="inline-block"
            onMouseEnter={showVisibility}
            onMouseLeave={hideVisibility}
        >
            {children}
            {isVisible && createPortal(
                <div
                    className="fixed pointer-events-none"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        zIndex: 2147483647, // Maximum z-index value to ensure tooltip is always on top
                    }}
                >
                    <div
                        className={`
                            bg-white border border-gray-300 shadow-2xl rounded-xl
                            text-xs sm:text-sm leading-snug p-3 sm:p-4 text-left font-sans
                            animate-fadein
                            relative
                            transition-opacity duration-150
                            pointer-events-auto
                            max-w-[90vw]
                        `}
                        style={{
                            width: coords.tooltipWidth || TOOLTIP_WIDTH,
                            minHeight: 'auto',
                            maxHeight: TOOLTIP_MAX_HEIGHT,
                            boxShadow: '0 8px 32px 0 rgba(60,60,90,0.18), 0 1.5px 6px 0 rgba(60,60,90,0.10)',
                            opacity: isVisible ? 1 : 0,
                            overflowY: 'visible',
                            overflowX: 'hidden',
                        }}
                    >
                        {/* Arrow border for better contrast */}
                        <div
                            style={{
                                position: 'absolute',
                                ...(coords.vertical === 'below'
                                    ? {
                                        top: -14,
                                        left: coords.arrowLeft || (TOOLTIP_WIDTH / 2 - 6),
                                        borderLeft: `7px solid transparent`,
                                        borderRight: `7px solid transparent`,
                                        borderBottom: `2px solid #d1d5db`,
                                    }
                                    : coords.vertical === 'above'
                                    ? {
                                        bottom: -14,
                                        left: coords.arrowLeft || (TOOLTIP_WIDTH / 2 - 6),
                                        borderLeft: `7px solid transparent`,
                                        borderRight: `7px solid transparent`,
                                        borderTop: `2px solid #d1d5db`,
                                    }
                                    : coords.horizontal === 'right'
                                    ? {
                                        left: -14,
                                        top: coords.arrowTop || '50%',
                                        transform: coords.arrowTop ? 'translateY(-50%)' : 'translateY(-50%)',
                                        borderTop: `7px solid transparent`,
                                        borderBottom: `7px solid transparent`,
                                        borderRight: `2px solid #d1d5db`,
                                    }
                                    : coords.horizontal === 'left'
                                    ? {
                                        right: -14,
                                        top: coords.arrowTop || '50%',
                                        transform: coords.arrowTop ? 'translateY(-50%)' : 'translateY(-50%)',
                                        borderTop: `7px solid transparent`,
                                        borderBottom: `7px solid transparent`,
                                        borderLeft: `2px solid #d1d5db`,
                                    }
                                    : {}
                                ),
                                width: 0,
                                height: 0,
                                zIndex: 2147483647,
                            }}
                        />
                        {/* Arrow */}
                        <div
                            style={{
                                position: 'absolute',
                                ...(coords.vertical === 'below'
                                    ? {
                                        top: -12,
                                        left: coords.arrowLeft || (TOOLTIP_WIDTH / 2 - 6),
                                        borderLeft: `6px solid transparent`,
                                        borderRight: `6px solid transparent`,
                                        borderBottom: `12px solid #fff`,
                                        filter: 'drop-shadow(0 -1px 1px rgba(180,180,200,0.13))',
                                    }
                                    : coords.vertical === 'above'
                                    ? {
                                        bottom: -12,
                                        left: coords.arrowLeft || (TOOLTIP_WIDTH / 2 - 6),
                                        borderLeft: `6px solid transparent`,
                                        borderRight: `6px solid transparent`,
                                        borderTop: `12px solid #fff`,
                                        filter: 'drop-shadow(0 1px 1px rgba(180,180,200,0.13))',
                                    }
                                    : coords.horizontal === 'right'
                                    ? {
                                        left: -12,
                                        top: coords.arrowTop || '50%',
                                        transform: coords.arrowTop ? 'translateY(-50%)' : 'translateY(-50%)',
                                        borderTop: `6px solid transparent`,
                                        borderBottom: `6px solid transparent`,
                                        borderRight: `12px solid #fff`,
                                        filter: 'drop-shadow(-1px 0 1px rgba(180,180,200,0.13))',
                                    }
                                    : coords.horizontal === 'left'
                                    ? {
                                        right: -12,
                                        top: coords.arrowTop || '50%',
                                        transform: coords.arrowTop ? 'translateY(-50%)' : 'translateY(-50%)',
                                        borderTop: `6px solid transparent`,
                                        borderBottom: `6px solid transparent`,
                                        borderLeft: `12px solid #fff`,
                                        filter: 'drop-shadow(1px 0 1px rgba(180,180,200,0.13))',
                                    }
                                    : {}
                                ),
                                width: 0,
                                height: 0,
                                zIndex: 2147483648, // One higher than tooltip background
                            }}
                        />
                        {text}
                    </div>
                    <style>
                        {`
                        @keyframes fadein {
                            from { opacity: 0; transform: translateY(8px);}
                            to { opacity: 1; transform: translateY(0);}
                        }
                        .animate-fadein {
                            animation: fadein 0.18s cubic-bezier(.4,0,.2,1);
                        }
                        `}
                    </style>
                </div>,
                document.body
            )}
        </span>
    );
}

export default HoverModal;