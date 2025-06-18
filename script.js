document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM SCRIPT: DOM fully loaded. Initializing main script...');

    // --- Global Selections (elements always present or needed for overall navigation) ---
    const managementDiagrams = document.querySelectorAll('.management-diagram');
    const pageSections = document.querySelectorAll('.page-section');
    const navPageLinks = document.querySelectorAll('.nav-page-link');
    const pageTransitionOverlay = document.getElementById('page-transition-overlay');
    const overlayTitleElem = document.getElementById('overlay-title');
    // Header elements for mega menu, search, mobile menu
    const mainHeader = document.getElementById('main-header');
    const navMenuLinks = document.querySelectorAll('.nav-link[data-target-menu]');
    const megaMenus = document.querySelectorAll('.mega-menu');
    const searchIconButton = document.getElementById('search-icon-button');
    const searchBar = document.getElementById('search-bar');
    const searchInputHeader = document.getElementById('search-input'); // Assuming this is the header search
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenuContainer = document.getElementById('mobile-menu');
    const mobileSearchButton = document.querySelector('.mobile-search-button');


    // --- State Variables ---
    let crDiagramInitialized = false;
    let ppDiagramInitialized = false;
    let chatInitialized = false; // New flag for chat
    let resizeTimeoutCR, resizeTimeoutPP;
    const RESIZE_DEBOUNCE_TIME = 250;

    // --- Helper Functions (getElementCoordinates, drawDiagramLineHelper) ---
    // (Keep these as they are)
    function getElementCoordinates(element, relativeTo, pointType = 'center', offsetPercentage = 0) {
        // offsetPercentage: 0 for center, 0.5 for edge (approx for circles), adjust for boxes
        if (!element || !relativeTo) {
            // console.warn('getElementCoordinates: Null element or relativeTo provided.', element, relativeTo);
            return null;
        }
        try {
            const elemRect = element.getBoundingClientRect();
            const containerRect = relativeTo.getBoundingClientRect();
    
            // If element is not rendered (e.g., display:none or parent is display:none), width/height will be 0.
            if (elemRect.width === 0 && elemRect.height === 0 && element !== relativeTo) {
                // console.warn(`getElementCoordinates: Element ${element.id || '(no id)'} has zero dimensions.`);
                return null; // Cannot calculate coordinates for an unrendered element
            }
    
            let x, y;
    
            // Calculate base center coordinates relative to the container
            const baseX = (elemRect.left - containerRect.left) + (elemRect.width / 2);
            const baseY = (elemRect.top - containerRect.top) + (elemRect.height / 2);
    
            switch (pointType) {
                case 'center':
                    x = baseX;
                    y = baseY;
                    break;
                case 'top':
                    x = baseX;
                    y = (elemRect.top - containerRect.top);
                    break;
                case 'bottom':
                    x = baseX;
                    y = (elemRect.top - containerRect.top) + elemRect.height;
                    break;
                case 'left':
                    x = (elemRect.left - containerRect.left);
                    y = baseY;
                    break;
                case 'right':
                    x = (elemRect.left - containerRect.left) + elemRect.width;
                    y = baseY;
                    break;
                // For edge connections to circles (simplified)
                // These require knowing the direction from the other point.
                // This simplified version just gets a point on the bounding box.
                // True edge calculation is more complex and needs the angle of the line.
                // For now, we'll keep it simple and connect to box edges or slightly inside.
                default: // center
                    x = baseX;
                    y = baseY;
                    break;
            }
            return { x, y };
        } catch (error) {
            console.error('Error in getElementCoordinates:', error, element, relativeTo);
            return null;
        }
    }
    function drawDiagramLineHelper(p1, p2, svgTarget, baseLineClass = 'diag-line', customClasses = [], lineName = 'unknown-line') {
        if (!p1 || !p2 || !svgTarget) return null;
        try {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', String(p1.x));
            line.setAttribute('y1', String(p1.y));
            line.setAttribute('x2', String(p2.x));
            line.setAttribute('y2', String(p2.y));
            line.classList.add(baseLineClass);
            (Array.isArray(customClasses) ? customClasses : (typeof customClasses === 'string' ? [customClasses] : []))
                .forEach(cls => cls && typeof cls === 'string' && cls.trim() && line.classList.add(cls.trim()));
            if (svgTarget.id === 'diagramLinesSvg' && lineName === 'GST-EMERSON SG') {
                line.classList.add('strong-connection');
            }
            svgTarget.appendChild(line);
            return line;
        } catch (error) { return null; }
    }
function staggerItemsOnVisible(selector, baseDelay = 0.1, increment = 0.08) {
    const items = document.querySelectorAll(selector);
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const visibleItems = Array.from(entry.target.querySelectorAll(selector + ' > *')); // Direct children
                visibleItems.forEach((item, index) => {
                    // Check if already animated to prevent re-triggering if observer fires multiple times
                    if (!item.style.transitionDelay || parseFloat(item.style.transitionDelay) === 0) {
                         item.style.transitionDelay = `${baseDelay + index * increment}s`;
                    }
                    item.classList.add('is-visible'); // Assuming .is-visible triggers the opacity/transform
                });
                // observer.unobserve(entry.target); // Unobserve the parent grid once children are processed
            }
        });
    }, { threshold: 0.1 }); // Observe the grid container

    // Observe each grid container
    document.querySelectorAll('.product-grid, .training-modules-grid, .performance-grid, .brands-grid, .partnerships-grid, .management-grid').forEach(grid => {
        // Pre-hide children if they don't have the global animation class
        // Array.from(grid.children).forEach(child => {
        //    if (!child.classList.contains('is-visible')) { // Or some other initial state class
        //       child.style.opacity = '0';
        //       child.style.transform = 'translateY(20px)';
        //    }
        // });
        observer.observe(grid);
    });
}
// Call it:
// staggerItemsOnVisible('.product-grid'); // This example targets the grid itself.
// If your cards already have individual observer logic, you might need to integrate delay there.

// A simpler way if cards are already observed individually:
// In your existing IntersectionObserver callback for individual cards:
// ...
// if (entry.isIntersecting) {
// entry.target.classList.add('is-visible');
// const cardIndex = Array.from(entry.target.parentNode.children).indexOf(entry.target);
// entry.target.style.transitionDelay = `${cardIndex * 0.08}s`; // Stagger by 80ms
// observer.unobserve(entry.target);
// }
// ...
// Inside your script.js, within DOMContentLoaded, update the drawCRLines function:
function staggerItemsOnVisible(selector, baseDelay = 0.1, increment = 0.08) {
    const items = document.querySelectorAll(selector);
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const visibleItems = Array.from(entry.target.querySelectorAll(selector + ' > *')); // Direct children
                visibleItems.forEach((item, index) => {
                    // Check if already animated to prevent re-triggering if observer fires multiple times
                    if (!item.style.transitionDelay || parseFloat(item.style.transitionDelay) === 0) {
                         item.style.transitionDelay = `${baseDelay + index * increment}s`;
                    }
                    item.classList.add('is-visible'); // Assuming .is-visible triggers the opacity/transform
                });
                // observer.unobserve(entry.target); // Unobserve the parent grid once children are processed
            }
        });
    }, { threshold: 0.1 }); // Observe the grid container

    // Observe each grid container
    document.querySelectorAll('.product-grid, .training-modules-grid, .performance-grid, .brands-grid, .partnerships-grid, .management-grid').forEach(grid => {
        // Pre-hide children if they don't have the global animation class
        // Array.from(grid.children).forEach(child => {
        //    if (!child.classList.contains('is-visible')) { // Or some other initial state class
        //       child.style.opacity = '0';
        //       child.style.transform = 'translateY(20px)';
        //    }
        // });
        observer.observe(grid);
    });
}
// Call it:
// staggerItemsOnVisible('.product-grid'); // This example targets the grid itself.
// If your cards already have individual observer logic, you might need to integrate delay there.

// A simpler way if cards are already observed individually:
// In your existing IntersectionObserver callback for individual cards:
// ...
// if (entry.isIntersecting) {
// entry.target.classList.add('is-visible');
// const cardIndex = Array.from(entry.target.parentNode.children).indexOf(entry.target);
// entry.target.style.transitionDelay = `${cardIndex * 0.08}s`; // Stagger by 80ms
// observer.unobserve(entry.target);
// }
// ...
function drawCRLines() {
    const relationshipModelContainer = document.getElementById('relationshipModelContainer');
    const diagramLinesSvg = document.getElementById('diagramLinesSvg');
    const centerGstCircle = document.getElementById('centerGstCircle');
    
    // --- CORRECTED SATELLITE SELECTION USING IDs ---
    const fikeCircle = document.getElementById('fikeSatelliteCircle');
    const emersonSgCircle = document.getElementById('emersonSgSatelliteCircle');
    const emersonKoreaCircle = document.getElementById('emersonKoreaSatelliteCircle');
    const dangjinCircle = document.getElementById('dangjinSatelliteCircle');
    const yeosuCircle = document.getElementById('yeosuSatelliteCircle');
    const ulsanCircle = document.getElementById('ulsanSatelliteCircle');

    if (!diagramLinesSvg || !relationshipModelContainer || !centerGstCircle || 
        !fikeCircle || !emersonSgCircle || !emersonKoreaCircle || !dangjinCircle || 
        !yeosuCircle || !ulsanCircle) {
        // Log which specific elements are missing to help debug HTML vs JS mismatches
        console.warn("[GST_DIAGRAM_CR_V2] drawCRLines: One or more critical circle elements missing. Check IDs in HTML and JS.");
        if(!diagramLinesSvg) console.warn("Missing: diagramLinesSvg");
        if(!relationshipModelContainer) console.warn("Missing: relationshipModelContainer");
        if(!centerGstCircle) console.warn("Missing: centerGstCircle");
        if(!fikeCircle) console.warn("Missing: fikeSatelliteCircle");
        if(!emersonSgCircle) console.warn("Missing: emersonSgSatelliteCircle");
        if(!emersonKoreaCircle) console.warn("Missing: emersonKoreaSatelliteCircle");
        if(!dangjinCircle) console.warn("Missing: dangjinSatelliteCircle");
        if(!yeosuCircle) console.warn("Missing: yeosuSatelliteCircle");
        if(!ulsanCircle) console.warn("Missing: ulsanSatelliteCircle");
        return;
    }
    diagramLinesSvg.innerHTML = ''; 

    const containerWidth = relationshipModelContainer.offsetWidth;
    const containerHeight = relationshipModelContainer.offsetHeight;

    console.log(`[GST_DIAGRAM_CR_V2] drawCRLines - Container: W=${containerWidth}, H=${containerHeight}`);
    if (containerWidth <= 0 || containerHeight <= 0) {
        console.warn("[GST_DIAGRAM_CR_V2] drawCRLines: relationshipModelContainer has zero/invalid dimensions. Retrying...");
        // Deferring might help if this is a timing issue on first load
        // requestAnimationFrame(() => initializeCustomerRelationshipDiagram()); // Or just drawCRLines if init logic is separate
        return; 
    }
    diagramLinesSvg.setAttribute('viewBox', `0 0 ${containerWidth} ${containerHeight}`);
    
    const centerPoint = getElementCoordinates(centerGstCircle, relationshipModelContainer, 'center');
    if (!centerPoint) {
        console.warn("[GST_DIAGRAM_CR_V2] Could not get centerGstCircle coordinates.");
        return;
    }

    const mainSatelliteData = [
        { el: dangjinCircle, name: 'GST DANGJIN', lineClass: ['cr-main-line'] },
        { el: emersonKoreaCircle, name: 'EMERSON KOREA', lineClass: ['cr-main-line'] },
        { el: fikeCircle, name: 'FIKE', lineClass: ['cr-main-line'] },
        { el: emersonSgCircle, name: 'EMERSON SG', lineClass: ['cr-main-line', 'strong-connection'] }
    ];

    mainSatelliteData.forEach(satellite => {
        if (satellite.el) { // el is now the direct DOM element
            const satellitePoint = getElementCoordinates(satellite.el, relationshipModelContainer, 'center');
            if (satellitePoint) {
                drawDiagramLineHelper(centerPoint, satellitePoint, diagramLinesSvg, 'diag-line', satellite.lineClass, `GST-to-${satellite.name}`);
            } else {
                console.warn(`[GST_DIAGRAM_CR_V2] Could not get coordinates for main satellite: ${satellite.name}`);
            }
        } // No 'else' needed here as the initial check for null elements already happened
    });

    const dangjinPoint = getElementCoordinates(dangjinCircle, relationshipModelContainer, 'center');
    if (dangjinPoint) {
        const subSatelliteData = [
            { el: yeosuCircle, name: 'GST YEOSU' },
            { el: ulsanCircle, name: 'GST ULSAN' }
        ];
        subSatelliteData.forEach(subSatellite => {
            if (subSatellite.el) {
                const subSatellitePoint = getElementCoordinates(subSatellite.el, relationshipModelContainer, 'center');
                if (subSatellitePoint) {
                    drawDiagramLineHelper(dangjinPoint, subSatellitePoint, diagramLinesSvg, 'diag-line', ['sub-connection'], `DANGJIN-to-${subSatellite.name}`);
                } else {
                   console.warn(`[GST_DIAGRAM_CR_V2] Could not get coordinates for sub-satellite: ${subSatellite.name}`);
                }
            }
        });
    } else {
        console.warn("[GST_DIAGRAM_CR_V2] Could not get DANGJIN coordinates for sub-connections.");
    }
    console.log("[GST_DIAGRAM_CR_V2] drawCRLines finished.");
}


function drawPPLines() {
    // Re-select elements each time in case they were not ready during initial global selection
    const pursuitModelContainer = document.getElementById('pursuitModelContainer');
    const pursuitDiagramLinesSvg = document.getElementById('pursuitDiagramLinesSvg');
    const pursuitGstBox = document.getElementById('pursuitGstBox');
    const pursuitPpBox = document.getElementById('pursuitPpBox');
    const pursuitEpcBox = document.getElementById('pursuitEpcBox');
    const pursuitOemBox = document.getElementById('pursuitOemBox');
    const pursuitMroBox = document.getElementById('pursuitMroBox');
    const pursuitServiceBox = document.getElementById('pursuitServiceBox');

    if (!pursuitDiagramLinesSvg || !pursuitModelContainer || !pursuitGstBox || !pursuitPpBox ||
        !pursuitEpcBox || !pursuitOemBox || !pursuitMroBox || !pursuitServiceBox) {
        console.warn("[GST_DIAGRAM_PP] drawPPLines: One or more critical elements for PP diagram missing. Aborting draw.");
        return;
    }
    pursuitDiagramLinesSvg.innerHTML = ''; // Clear previous lines

    const containerWidthPP = pursuitModelContainer.offsetWidth;
    const containerHeightPP = pursuitModelContainer.offsetHeight;

    console.log(`[GST_DIAGRAM_PP] drawPPLines - Container dimensions: W=${containerWidthPP}, H=${containerHeightPP}`);

    if (containerWidthPP <= 0 || containerHeightPP <= 0) {
        console.warn("[GST_DIAGRAM_PP] drawPPLines: pursuitModelContainer has invalid dimensions. Lines may be incorrect.");
        // Don't return immediately, try to draw with viewBox 0 0 1 1 as a fallback for visibility check
        pursuitDiagramLinesSvg.setAttribute('viewBox', `0 0 100 100`); // Fallback
        // return; // Or, if drawing with 0 dimensions is consistently bad, return here.
    } else {
        pursuitDiagramLinesSvg.setAttribute('viewBox', `0 0 ${containerWidthPP} ${containerHeightPP}`);
    }

    // Get coordinates for the main boxes
    const gstBottom = getElementCoordinates(pursuitGstBox, pursuitModelContainer, 'bottom');
    const ppTop = getElementCoordinates(pursuitPpBox, pursuitModelContainer, 'top');
    const ppCenter = getElementCoordinates(pursuitPpBox, pursuitModelContainer, 'center'); // Used for the X of the vertical line start
    const ppBottom = getElementCoordinates(pursuitPpBox, pursuitModelContainer, 'bottom');

    if (!gstBottom || !ppTop || !ppCenter || !ppBottom) {
        console.warn("[GST_DIAGRAM_PP] drawPPLines: Could not get essential coordinates for GST or Project Pursuit boxes.");
        return;
    }

    // Line 1: GST (bottom center) to Project Pursuit (top center)
    drawDiagramLineHelper(gstBottom, ppTop, pursuitDiagramLinesSvg, 'diag-line', ['pp-line', 'pp-line-vertical'], 'GST-to-PP');

    // Define Y position for the main horizontal distribution line
    const horizontalLineGap = 30; // Gap below "Project Pursuit" box, adjust as needed
    const horizontalLineY = ppBottom.y + horizontalLineGap;

    // Line 2: Vertical line from Project Pursuit (CENTER bottom) down to the Y of the horizontal line
    const verticalLineFromPpStart = { x: ppCenter.x, y: ppBottom.y }; // Start at center-bottom of PP box
    const verticalLineFromPpEnd = { x: ppCenter.x, y: horizontalLineY }; // End at the Y-level of the horizontal line
    drawDiagramLineHelper(verticalLineFromPpStart, verticalLineFromPpEnd, pursuitDiagramLinesSvg, 'diag-line', ['pp-line', 'pp-line-vertical'], 'PP-to-H-Junction');

    const bottomBoxes = [
        { el: pursuitEpcBox, name: 'EPC' },
        { el: pursuitOemBox, name: 'OEM' },
        { el: pursuitMroBox, name: 'MRO' },
        { el: pursuitServiceBox, name: 'SERVICE' }
    ];

    const bottomBoxTopPoints = [];
    bottomBoxes.forEach(box => {
        if (box.el) {
            const point = getElementCoordinates(box.el, pursuitModelContainer, 'top');
            if (point) {
                bottomBoxTopPoints.push({ ...point, name: box.name }); // Store name with point for logging
                console.log(`[GST_DIAGRAM_PP] Bottom Box "${box.name}" (Top Center Coords): x=${point.x}, y=${point.y}`);
            } else {
                console.warn(`[GST_DIAGRAM_PP] Could not get coordinates for bottom box: ${box.name}`);
            }
        } else {
            console.warn(`[GST_DIAGRAM_PP] Bottom box DOM element for ${box.name} not found.`);
        }
    });

    if (bottomBoxTopPoints.length > 0) {
        const allXCoords = bottomBoxTopPoints.map(p => p.x);
        let minX = Math.min(...allXCoords);
        let maxX = Math.max(...allXCoords);

        // If only one box, or all boxes are perfectly aligned vertically, make the horizontal line span a bit
        if (bottomBoxTopPoints.length === 1) {
            const singleBoxWidth = bottomBoxes.find(b => b.name === bottomBoxTopPoints[0].name)?.el.offsetWidth || 60;
            minX = bottomBoxTopPoints[0].x - (singleBoxWidth / 3); // Extend a bit from the single box
            maxX = bottomBoxTopPoints[0].x + (singleBoxWidth / 3);
        } else if (minX === maxX) { // All boxes have the same X center
             minX = minX - 50; // Extend 40px to the left of the common center
             maxX = maxX + 40; // Extend 40px to the right of the common center
        }
        // Else, use the actual min/max of the box centers

        console.log(`[GST_DIAGRAM_PP] Horizontal Line X-Range: minX=${minX}, maxX=${maxX}, Y-Pos: ${horizontalLineY}`);

        const horizontalLineStart = { x: minX, y: horizontalLineY };
        const horizontalLineEnd   = { x: maxX, y: horizontalLineY };
        
        // Line 3: Main Horizontal Distribution Line
        drawDiagramLineHelper(horizontalLineStart, horizontalLineEnd, pursuitDiagramLinesSvg, 'diag-line', ['pp-line', 'pp-line-horizontal', 'pursuit-horizontal-main'], 'H-Main-Distributor');

        // Lines 4+: Vertical lines from the Horizontal Line to each bottom box's TOP CENTER
        bottomBoxTopPoints.forEach((boxTopPoint) => {
            const verticalLineToBoxStart = { x: boxTopPoint.x, y: horizontalLineY }; // Start ON the horizontal line, at the X of the current box
            drawDiagramLineHelper(verticalLineToBoxStart, boxTopPoint, pursuitDiagramLinesSvg, 'diag-line', ['pp-line', 'pp-line-vertical'], `H-Junction-to-${boxTopPoint.name}`);
        });
    } else {
        console.warn("[GST_DIAGRAM_PP] drawPPLines: No valid coordinates found for any bottom boxes. Cannot draw distribution lines.");
    }
    console.log("[GST_DIAGRAM_PP] drawPPLines finished.");
}
// In your script.js

// Ensure these flags are defined globally or in an accessible scope
// --- Helper function to clear SVG content (ensure you have this) ---



// --- Make sure your getElementCoordinates and drawDiagramLineHelper functions are robust ---
// Example signatures (your implementation might vary):
// function getElementCoordinates(element, relativeToContainer, position = 'center') { ... }
// function drawDiagramLineHelper(startPoint, endPoint, svgElement, baseClass, additionalClassesArray, lineId) { ... }


// --- REVISED INITIALIZATION FUNCTION FOR CUSTOMER RELATIONSHIP DIAGRAM ---
// REVISED/SIMPLIFIED Diagram Initialization Functions
// These are called by showPage. The IntersectionObserver provides a more robust trigger.

function initializeCustomerRelationshipDiagram() {
    const diagramModelContainer = document.getElementById('relationshipModelContainer');
    if (!diagramModelContainer) {
        console.error("CR Diagram init: relationshipModelContainer NOT FOUND.");
        return;
    }
    if (crDiagramInitialized) {
        console.log("CR Diagram: Already initialized by observer or previous call, skipping init from showPage.");
        return;
    }

    // Check if the container is actually visible, has dimensions, and its parent animation is stable
    const managementCard = diagramModelContainer.closest('.management-diagram');
    if (managementCard && managementCard.classList.contains('is-visible') &&
        diagramModelContainer.offsetParent !== null && diagramModelContainer.offsetWidth > 0) {
        
        const computedStyle = window.getComputedStyle(managementCard);
        const isStable = parseFloat(computedStyle.opacity) === 1 && 
                         (computedStyle.transform === 'none' || computedStyle.transform === 'matrix(1, 0, 0, 1, 0, 0)');

        if (isStable) {
            console.log('CR Diagram: Initializing from showPage (container is visible and stable).');
            requestAnimationFrame(() => { // Defer to next frame for good measure
                if (!crDiagramInitialized) { // Double-check flag
                    drawCRLines();
                    crDiagramInitialized = true;
                }
            });
        } else {
            console.log('CR Diagram: Init from showPage, but parent .management-diagram is still transitioning. Observer should handle.');
        }
    } else {
        console.log('CR Diagram: Init from showPage, but container/parent not yet fully visible/sized. Observer should handle it.');
    }
}

function initializeProjectPursuitDiagram() {
    const diagramModelContainer = document.getElementById('pursuitModelContainer');
    if (!diagramModelContainer) {
        console.error("PP Diagram init: pursuitModelContainer NOT FOUND.");
        return;
    }
    if (ppDiagramInitialized) {
        console.log("PP Diagram: Already initialized by observer or previous call, skipping init from showPage.");
        return;
    }
    
    const managementCard = diagramModelContainer.closest('.management-diagram');
    if (managementCard && managementCard.classList.contains('is-visible') &&
        diagramModelContainer.offsetParent !== null && diagramModelContainer.offsetWidth > 0) {

        const computedStyle = window.getComputedStyle(managementCard);
        const isStable = parseFloat(computedStyle.opacity) === 1 && 
                         (computedStyle.transform === 'none' || computedStyle.transform === 'matrix(1, 0, 0, 1, 0, 0)');
        
        if (isStable) {
            console.log('PP Diagram: Initializing from showPage (container is visible and stable).');
            requestAnimationFrame(() => { // Defer to next frame
                if (!ppDiagramInitialized) { // Double-check flag
                   drawPPLines();
                   ppDiagramInitialized = true;
                }
            });
        } else {
            console.log('PP Diagram: Init from showPage, but parent .management-diagram is still transitioning. Observer should handle.');
        }
    } else {
        console.log('PP Diagram: Init from showPage, but container/parent not yet fully visible/sized. Observer should handle it.');
    }
}
// --- REVISED INITIALIZATION FUNCTION FOR PROJECT PURSUIT DIAGRAM ---
function initializeProjectPursuitDiagram() {
    const diagramModelContainer = document.getElementById('pursuitModelContainer');
    if (!diagramModelContainer) {
        console.error("PP Diagram: pursuitModelContainer NOT FOUND.");
        return;
    }

    const managementDiagramElement = diagramModelContainer.closest('.management-diagram');
    if (!managementDiagramElement) {
        console.error("PP Diagram: Parent .management-diagram element not found.");
        if (diagramModelContainer.offsetParent !== null && diagramModelContainer.offsetWidth > 0) {
            console.warn("PP Diagram: Drawing without transitionend sync due to missing .management-diagram parent.");
            requestAnimationFrame(drawPPLines);
        }
        return;
    }
    
    function performDraw() {
        if (diagramModelContainer.offsetParent !== null && diagramModelContainer.offsetWidth > 0 && diagramModelContainer.offsetHeight > 0) {
            console.log('PP Diagram: Conditions met, calling drawPPLines().');
            drawPPLines(); // Your existing function
            ppDiagramInitialized = true;
        } else {
            console.warn('PP Diagram: Container not visible or has zero dimensions when performDraw was scheduled.');
        }
    }

    const computedStyle = window.getComputedStyle(managementDiagramElement);
    const isTransformStable = computedStyle.transform === 'none' || computedStyle.transform === 'matrix(1, 0, 0, 1, 0, 0)';
    const isFullyVisibleAndStable = 
        managementDiagramElement.classList.contains('is-visible') &&
        parseFloat(computedStyle.opacity) === 1 &&
        isTransformStable;

    if (isFullyVisibleAndStable) {
        console.log('PP Diagram: Already visible and stable. Drawing on next frame.');
        requestAnimationFrame(performDraw);
    } else if (managementDiagramElement.classList.contains('is-visible')) {
        console.log('PP Diagram: .is-visible set, waiting for transitionend...');
        let transitionHandled = false;
        const transitionEndHandler = (event) => {
            if (event.target === managementDiagramElement && (event.propertyName === 'opacity' || event.propertyName === 'transform')) {
                 if (transitionHandled) return;
                transitionHandled = true;
                console.log(`PP Diagram: Transition '${event.propertyName}' ended. Scheduling draw.`);
                requestAnimationFrame(performDraw);
            }
        };
        managementDiagramElement.addEventListener('transitionend', transitionEndHandler, { once: true });
        
        setTimeout(() => {
            if (!ppDiagramInitialized && !transitionHandled) {
                console.warn('PP Diagram: Fallback timeout after .is-visible. Attempting draw.');
                requestAnimationFrame(performDraw);
            }
        }, 800);
    } else {
        console.log('PP Diagram: .is-visible not set. Waiting for IntersectionObserver or subsequent call.');
        if (diagramModelContainer.offsetParent === null) {
             console.log("PP Diagram: Container truly not in layout, retrying init later.");
             setTimeout(() => initializeProjectPursuitDiagram(), 250);
        }
    }
}



    // --- Chat Logic Functions ---
    function addChatMessage(message, sender) {
        const chatMessagesEl = document.getElementById('chat-messages'); // Select just-in-time
        if (!chatMessagesEl) return;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', sender);
        messageDiv.textContent = message;
        chatMessagesEl.appendChild(messageDiv);
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    }

    function handleUserMessage() {
        const chatInputEl = document.getElementById('chat-input'); // Select just-in-time
        if (!chatInputEl) return;
        const messageText = chatInputEl.value.trim();
        if (messageText === '') return;

        addChatMessage(messageText, 'user');
        chatInputEl.value = '';

        setTimeout(() => {
            let aiResponse = "Thank you for your message. A support agent will be with you shortly.";
             if (messageText.toLowerCase().includes("valve selection")) {
                aiResponse = "For valve selection, please tell us about your application, medium, pressure, and temperature requirements.";
            } else if (messageText.toLowerCase().includes("return times") || messageText.toLowerCase().includes("return processing")) {
                aiResponse = "Standard return processing takes 5-7 business days after we receive the item. You will be notified via email.";
            }
            addChatMessage(aiResponse, 'ai');
        }, 1000 + Math.random() * 3000);
    }

    function initializeLiveSupport() {
        if (chatInitialized) return;
        
        const chatInputEl = document.getElementById('chat-input');
        const chatSendButtonEl = document.getElementById('chat-send-button');
        const quickInquiryButtonsNodeList = document.querySelectorAll('.quick-inquiry-btn');

        if (!chatInputEl || !chatSendButtonEl) {
            console.warn("Live Support: Chat input or send button not found on this page. Skipping chat initialization.");
            return;
        }
        console.log('LIVE SUPPORT: Initializing...');

        if (chatSendButtonEl) {
            chatSendButtonEl.addEventListener('click', () => {
                console.log('Chat send button clicked!');
                handleUserMessage();
            });
        }
        if (chatInputEl) {
            chatInputEl.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('Enter key pressed in chat input!');
                    handleUserMessage();
                }
            });
        }
        quickInquiryButtonsNodeList.forEach(button => {
            button.addEventListener('click', () => {
                const message = button.dataset.message;
                console.log('Quick inquiry button clicked:', message);
                if (chatInputEl) {
                    chatInputEl.value = message;
                    chatInputEl.focus();
                }
            });
        });
        chatInitialized = true;
        console.log('LIVE SUPPORT: Initialization complete.');
    }


    // --- Page Navigation & Display ---
    let isTransitioning = false;
    
// Place this definition BEFORE your showPage function definition
function updateActiveLink(currentPageId) {
    console.log('[GST_SCRIPT_V_URGENT_TEST] updateActiveLink for:', currentPageId);
    const actualCurrentPageId = (currentPageId === 'hero' || currentPageId === 'home') ? 'home' : currentPageId;
    if (navPageLinks && navPageLinks.length > 0) { // Add null check for navPageLinks
        navPageLinks.forEach(navLink => {
            navLink.classList.remove('active');
            const linkHref = navLink.getAttribute('href');
            let linkTargetPage = linkHref ? linkHref.substring(1) : null;
            if (linkTargetPage === 'hero') linkTargetPage = 'home';
            
            const isLogoLink = navLink.classList.contains('logo-link');
            const isTopLevelNavLink = navLink.matches('#desktop-nav .nav-link, .mobile-nav-link, .logo-link') && 
                                     !navLink.closest('.dropdown-menu-content') && 
                                     !navLink.closest('.mega-menu-content'); // Check your HTML structure for mega menu content class

            if (isTopLevelNavLink) {
                if ((isLogoLink && actualCurrentPageId === 'home') || (linkTargetPage === actualCurrentPageId)) {
                    navLink.classList.add('active');
                }
            }
        });
    } else {
        console.warn("[GST_SCRIPT_V_URGENT_TEST] navPageLinks not found or empty for updateActiveLink.");
    }
}
// Find your existing showPage function in ./script.js and REPLACE it with this:

function showPage(pageIdToShow, pushState = true, scrollTargetId = null) {
    console.log(`%c[GST_SCRIPT_V_URGENT_TEST] showPage: START - pageIdToShow: "${pageIdToShow}"`, "color: orange; font-weight: bold;");

    if (isTransitioning) {
        console.log("[GST_SCRIPT_V_URGENT_TEST] showPage: Already transitioning, returning.");
        return;
    }
    isTransitioning = true;

    const effectivePageId = (pageIdToShow === 'hero' || pageIdToShow === 'home') ? 'home' : pageIdToShow;
    let targetPage;

    if (effectivePageId === 'home') {
        targetPage = document.getElementById('hero-section');
    } else {
        targetPage = document.getElementById(effectivePageId) || // e.g. product-specifics-page
                     document.getElementById(`${effectivePageId}-page`) || 
                     document.getElementById(`${effectivePageId}-section`);
    }
    
    console.log(`[GST_SCRIPT_V_URGENT_TEST] showPage: effectivePageId is "${effectivePageId}". Target element:`, targetPage);

    if (!targetPage) {
        console.error(`[GST_SCRIPT_V_URGENT_TEST] showPage: Target page element NOT FOUND for "${effectivePageId}". Attempting to default to home.`);
        isTransitioning = false;
        if (pageIdToShow !== 'home') {
            showPage('home', true, null); 
        } else {
            console.error("[GST_SCRIPT_V_URGENT_TEST] CRITICAL: Home page ('hero-section') also not found.");
        }
        return;
    }
    // Inside showPage function...
// After targetPage.classList.add('active-page'); and other UI updates...

// Initialize components specific to the now-visible page
if (targetPage.querySelector('#relationshipModelContainer')) { // Or targetPage.id === 'company-page' etc.
    initializeCustomerRelationshipDiagram();
}
if (targetPage.querySelector('#pursuitModelContainer')) { // Or targetPage.id === 'company-page' etc.
    initializeProjectPursuitDiagram();
}
if (targetPage.querySelector('#live-support')) { 
    initializeLiveSupport();
}
    

    // Manage overlay (assuming pageTransitionOverlay and overlayTitleElem are defined globally)
    const pageTitleText = targetPage.querySelector('.section-title, .hero-title, .subsection-title, h1, h2, h3')?.textContent.trim() || effectivePageId.charAt(0).toUpperCase() + effectivePageId.slice(1);
    if (overlayTitleElem) overlayTitleElem.textContent = pageTitleText;
    if (pageTransitionOverlay) pageTransitionOverlay.classList.add('overlay-visible');

    // Wait for the overlay to be visible (if you have a fade-in transition on it)
    // This timeout is for the switch itself.
    setTimeout(() => {
        // Hide all sections first by removing .active-page
        pageSections.forEach(section => {
            section.classList.remove('active-page');
            // Rely on CSS: .page-section { display: none; }
        });
        
        // Show the target page by adding .active-page
        targetPage.classList.add('active-page');
        // Rely on CSS: .page-section.active-page { display: block; /* or flex */ opacity: 1; }
        console.log(`[GST_SCRIPT_V_URGENT_TEST] Added 'active-page' to #${targetPage.id}.`);
        console.log(`[GST_SCRIPT_V_URGENT_TEST] Computed display of #${targetPage.id}: ${window.getComputedStyle(targetPage).display}`);


        document.body.classList.toggle('is-home', (targetPage.id === 'hero-section'));
        
        // Ensure updateActiveLink is defined and called
        if (typeof updateActiveLink === "function") {
            updateActiveLink(effectivePageId);
        } else {
            console.error("[GST_SCRIPT_V_URGENT_TEST] updateActiveLink function is not defined!");
        }


        if (pushState && window.history && window.history.pushState) {
            const path = scrollTargetId ? `#${scrollTargetId}` : (effectivePageId === 'home' ? (window.location.pathname.split('#')[0] || "/") : `#${effectivePageId}`);
            try {
                window.history.pushState({ page: effectivePageId, scrollTo: scrollTargetId }, pageTitleText, path);
                document.title = `GST - ${pageTitleText}`;
            } catch (e) { console.warn("[GST_SCRIPT_V_URGENT_TEST] History API pushState failed:", e); }
        }
        
        // Component Initializations - Keep these minimal or comment out if suspecting loops
        // For example, if the diagram/chat initializations are complex, they might be an issue.
        // const relationshipModelContainer = document.getElementById('relationshipModelContainer');
        // const pursuitModelContainer = document.getElementById('pursuitModelContainer');
        // const liveSupportContainer = document.getElementById('live-support');
// Inside your showPage function, after targetPage.classList.add('active-page');

// ... (other logic like updateActiveLink, history API, etc.)

// Initialize components AFTER page is deemed active and potentially after transitions start
if (targetPage.contains(relationshipModelContainer)) { // Check if the specific diagram container is within the targetPage
    console.log("[GST_SCRIPT_V9] Management section active, attempting to init CR Diagram.");
    initializeCustomerRelationshipDiagram(); 
} else {
    crDiagramInitialized = false; // Reset if navigating away
}

if (targetPage.contains(pursuitModelContainer)) {
    console.log("[GST_SCRIPT_V9] Management section active, attempting to init PP Diagram.");
    initializeProjectPursuitDiagram();
} else {
    ppDiagramInitialized = false; // Reset if navigating away
}
// ... (rest of showPage, like scroll and overlay hide) ...
            
        if (targetPage.id === 'products-page' && typeof filterProducts === "function" && productGrid && productCards.length > 0) {
            console.log("[GST_SCRIPT_V_URGENT_TEST] Products page is active, calling filterProducts().");
            filterProducts();
        }

        if (scrollTargetId) {
            const elementToScroll = document.getElementById(scrollTargetId);
            if (elementToScroll) {
                elementToScroll.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else { window.scrollTo(0, 0); }
        } else {
            window.scrollTo(0, 0);
        }

        // Hide overlay after a short delay
        setTimeout(() => {
            if (pageTransitionOverlay) pageTransitionOverlay.classList.remove('overlay-visible');
            isTransitioning = false; // Reset transition flag HERE
            console.log(`%c[GST_SCRIPT_V_URGENT_TEST] showPage: Transition for "${effectivePageId}" complete.`, "color: green;");
        }, 250); // Match overlay transition time if any, or just a small delay

    }, 50); // Delay for page switch, can be very short if no overlay CSS transition
}

function debouncedRedraw() {
    const activeCRContainer = document.querySelector('#company-page.active-page #relationshipModelContainer'); // More specific
    if (activeCRContainer && activeCRContainer.offsetParent !== null) {
        clearTimeout(resizeTimeoutCR);
        resizeTimeoutCR = setTimeout(drawCRLines, RESIZE_DEBOUNCE_TIME);
    }
    const activePPContainer = document.querySelector('#company-page.active-page #pursuitModelContainer'); // More specific
    if (activePPContainer && activePPContainer.offsetParent !== null) {
        clearTimeout(resizeTimeoutPP);
        resizeTimeoutPP = setTimeout(drawPPLines, RESIZE_DEBOUNCE_TIME);
    }
}
window.addEventListener('resize', debouncedRedraw);
    navPageLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                let mainPageId = href.substring(1);
                const scrollTarget = link.dataset.scrollTarget || null;

                if (link.classList.contains('product-filter-link')) {
                    const category = link.dataset.filterCategory;
                    showPage('products', true, null); 
                    setTimeout(() => {
                        const productCategoryFilter = document.getElementById('product-category-filter');
                        const productSearchInput = document.getElementById('product-search-input'); // Ensure this is the product page search
                        if (productCategoryFilter) {
                            productCategoryFilter.value = category || "";
                            productCategoryFilter.dispatchEvent(new Event('change'));
                        }
                        if (productSearchInput) productSearchInput.value = "";
                    }, 650); 
                } else {
                    showPage(mainPageId, true, scrollTarget);
                }
            }
            
            
            // Close mobile menu if open
            if (mobileMenuContainer && !mobileMenuContainer.classList.contains('hidden')) {
                mobileMenuContainer.classList.add('hidden');
                if(mobileMenuButton) mobileMenuButton.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
            // Close mega menus
             if (typeof closeAllMenus === "function") closeAllMenus();
        });
    });

    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.page) {
            showPage(event.state.page, false, event.state.scrollTo);
        } else {
            let pageToLoad = 'home';
            let scrollToTarget = null;
            if (window.location.hash) {
                const hash = window.location.hash.substring(1);
                const targetElement = document.getElementById(hash);
                if (targetElement && targetElement.closest('.page-section')) {
                    const parentPageElement = targetElement.closest('.page-section');
                    pageToLoad = parentPageElement.id.replace('-page', '').replace('-section', '');
                    scrollToTarget = hash;
                } else if (document.getElementById(`${hash}-page`) || document.getElementById(`${hash}-section`) || hash === 'home') {
                    pageToLoad = hash;
                }
            }
            showPage(pageToLoad, false, scrollToTarget);
        }
    });

    let initialPageId = 'home';
    let initialScrollTarget = null;
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const targetElementForHash = document.getElementById(hash);
        if (document.getElementById(`${hash}-page`) || document.getElementById(`${hash}-section`)) {
            initialPageId = hash;
        } else if (targetElementForHash && targetElementForHash.closest('.page-section')) {
            const parentPage = targetElementForHash.closest('.page-section');
            if (parentPage && parentPage.id) { // Check if parentPage and its id exist
              initialPageId = parentPage.id.replace('-page', '').replace('-section', '');
              initialScrollTarget = hash;
            }
        }
    }
    if (initialPageId === 'hero') initialPageId = 'home';
    showPage(initialPageId, true, initialScrollTarget);

    // --- Intersection Observer for general animated elements ---
    const animatedElements = document.querySelectorAll('.about-container, .performance-stat, .cert-group, .rr-image-circle, .training-module, .management-diagram, .history-entry');
    const elementObserverCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Diagram initialization is now primarily handled by showPage or specific observer for .management-diagram cards
                observer.unobserve(entry.target);
            }
        });
    };

    if (animatedElements.length > 0 && 'IntersectionObserver' in window) {
        const elementObserverOptions = { root: null, threshold: 0.1, rootMargin: "0px 0px -20px 0px" };
        const elementObserver = new IntersectionObserver(elementObserverCallback, elementObserverOptions);
        animatedElements.forEach(el => elementObserver.observe(el));
    } else {
        animatedElements.forEach(el => el.classList.add('is-visible'));
        // Fallback direct initialization if diagrams are on the initial page and observer fails
        if (document.getElementById('relationshipModelContainer') && document.getElementById('relationshipModelContainer').closest('.active-page')) initializeCustomerRelationshipDiagram();
        if (document.getElementById('pursuitModelContainer') && document.getElementById('pursuitModelContainer').closest('.active-page')) initializeProjectPursuitDiagram();
        if (document.getElementById('live-support') && document.getElementById('live-support').closest('.active-page')) initializeLiveSupport();
    }
    
    // --- Global Resize Handler ---
    function debouncedRedraw() {
        const activeRelationshipModelContainer = document.querySelector('.active-page #relationshipModelContainer');
        if (activeRelationshipModelContainer && activeRelationshipModelContainer.offsetParent !== null) {
            clearTimeout(resizeTimeoutCR);
            resizeTimeoutCR = setTimeout(drawCRLines, RESIZE_DEBOUNCE_TIME);
        }
        const activePursuitModelContainer = document.querySelector('.active-page #pursuitModelContainer');
        if (activePursuitModelContainer && activePursuitModelContainer.offsetParent !== null) {
            clearTimeout(resizeTimeoutPP);
            resizeTimeoutPP = setTimeout(drawPPLines, RESIZE_DEBOUNCE_TIME);
        }
    }
    window.addEventListener('resize', debouncedRedraw);

    // --- Other UI interactions ---
    // (Mega Menu, Search, Mobile Menu - ensure variables like 'mainHeader', 'navMenuLinks' are defined if used here)
    let activeMenu = null; // For mega menus
    let hoverTimeoutNav;  // For mega menus

    function openMenu(menuToOpen) {
        if(!menuToOpen) return;
        if (activeMenu && activeMenu !== menuToOpen) {
            activeMenu.classList.remove('is-visible');
            const activeParentLink = document.querySelector('.nav-link.active-parent-link');
            if (activeParentLink) activeParentLink.classList.remove('active-parent-link');
        }
        menuToOpen.classList.add('is-visible');
        const parentLink = document.querySelector(`.nav-link[data-target-menu="${menuToOpen.id}"]`);
        if (parentLink) parentLink.classList.add('active-parent-link');
        activeMenu = menuToOpen;
    }

    function closeMenu(menuToClose) {
        if (menuToClose) {
            menuToClose.classList.remove('is-visible');
            const parentLink = document.querySelector(`.nav-link[data-target-menu="${menuToClose.id}"]`);
            if (parentLink) parentLink.classList.remove('active-parent-link');
            if (activeMenu === menuToClose) activeMenu = null;
        }
    }
    function closeAllMenus() {
        megaMenus.forEach(menu => closeMenu(menu));
        activeMenu = null;
    }

    if (navMenuLinks) {
        navMenuLinks.forEach(link => {
            const menuId = link.dataset.targetMenu;
            const menu = document.getElementById(menuId);
            if (menu) {
                link.addEventListener('mouseenter', () => { clearTimeout(hoverTimeoutNav); openMenu(menu); });
                link.addEventListener('mouseleave', () => { hoverTimeoutNav = setTimeout(() => { if (!menu.matches(':hover')) closeMenu(menu); }, 100); });
                menu.addEventListener('mouseenter', () => clearTimeout(hoverTimeoutNav));
                menu.addEventListener('mouseleave', () => { hoverTimeoutNav = setTimeout(() => closeMenu(menu), 100); });
                link.addEventListener('focus', () => openMenu(menu));
            }
        });
    }
    if (mainHeader) { // Ensure mainHeader is defined before adding event listener
        document.addEventListener('click', (event) => {
            if (activeMenu && !mainHeader.contains(event.target) && !event.target.closest('.mega-menu')) {
                 closeAllMenus();
            }
        });
    }
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && activeMenu) closeAllMenus(); });

    if (searchIconButton && searchBar) { // Ensure searchIconButton and searchBar are defined
        searchIconButton.addEventListener('click', () => {
            const isExpanded = searchIconButton.getAttribute('aria-expanded') === 'true';
            searchBar.classList.toggle('search-active');
            searchIconButton.setAttribute('aria-expanded', String(!isExpanded));
            if (!isExpanded && searchInputHeader) searchInputHeader.focus();
        });
    }

    if (mobileMenuButton && mobileMenuContainer) { // Ensure mobileMenuButton and mobileMenuContainer are defined
        mobileMenuButton.addEventListener('click', () => {
            const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
            mobileMenuContainer.classList.toggle('hidden');
            mobileMenuButton.setAttribute('aria-expanded', String(!isExpanded));
            document.body.style.overflow = isExpanded ? '' : 'hidden';
        });
        if (mobileSearchButton && searchBar && searchInputHeader) { // Ensure mobileSearchButton, searchBar and searchInputHeader are defined
            mobileSearchButton.addEventListener('click', (e) => {
                e.preventDefault();
                mobileMenuContainer.classList.add('hidden');
                mobileMenuButton.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
                searchBar.classList.add('search-active');
                if (searchIconButton) searchIconButton.setAttribute('aria-expanded', 'true');
                searchInputHeader.focus();
            });
        }
    }
    
    // Timeline Interaction
    const historyEntries = document.querySelectorAll('.history-entry');
    historyEntries.forEach(entry => {
        const point = entry.querySelector('.timeline-point');
        if(point) point.addEventListener('click', () => {
            const isActive = entry.classList.contains('is-active');
            historyEntries.forEach(e => e.classList.remove('is-active'));
            if (!isActive) entry.classList.add('is-active');
        });
    });
// Ensure this function is DEFINED BEFORE it's called by product card click listeners
function displayProductSpecifics(productKey) {
    console.log(`%c[GST_SCRIPT_DEBUG_V3] displayProductSpecifics: Called for productKey = "${productKey}"`, "color: purple; font-weight:bold;");

    if (!productSpecificsPage) {
        console.error("[GST_SCRIPT_DEBUG_V3] CRITICAL ERROR: productSpecificsPage element is null. Cannot display product details. Check HTML for #product-specifics-page.");
        return; // Cannot proceed if the main page container is missing
    }

    const productData = productDatabase[productKey];

    if (!productData) {
        console.error(`[GST_SCRIPT_DEBUG_V3] displayProductSpecifics: Product data NOT FOUND in productDatabase for key: "${productKey}"`);
        // Display a "Product Not Found" message on the specifics page
        if (specificsTitleEl) specificsTitleEl.textContent = "Product Not Found";
        if (specificsCategoryEl) specificsCategoryEl.textContent = "N/A";
        if (specificsShortDescEl) specificsShortDescEl.innerHTML = "<p>The requested product details could not be loaded. Please check the product key or contact support.</p>";
        if (specificsFullDescEl) specificsFullDescEl.innerHTML = ""; // Clear other fields
        if (specificsSpecsTableBodyEl) specificsSpecsTableBodyEl.innerHTML = '<tr><td colspan="2">Information unavailable.</td></tr>';
        if (specificsFeaturesListEl) specificsFeaturesListEl.innerHTML = '<li>Information unavailable.</li>';
        if (specificsDownloadsListEl) specificsDownloadsListEl.innerHTML = '<li>Information unavailable.</li>';
        if (specificsThumbnailGalleryEl) specificsThumbnailGalleryEl.innerHTML = '';

        showPage('product-specifics', true); // Still show the page so user sees the error message
        return;
    }

    console.log('[GST_SCRIPT_DEBUG_V3] displayProductSpecifics: Populating data for product -', productData.title);

    // Populate Main Image
    if (specificsMainImageEl) {
        specificsMainImageEl.src = (productData.images && productData.images.length > 0) ? productData.images[0] : 
        specificsMainImageEl.alt = productData.title || "Product Image";
        console.log('[GST_SCRIPT_DEBUG_V3] Main image set:', specificsMainImageEl.src);
    } else {
        console.warn("[GST_SCRIPT_DEBUG_V3] specificsMainImageEl not found.");
    }

    // Populate Thumbnail Gallery
    if (specificsThumbnailGalleryEl) {
        specificsThumbnailGalleryEl.innerHTML = ''; // Clear old thumbnails
        if (productData.images && productData.images.length > 1) {
            productData.images.forEach((imgUrl, index) => {
                const thumb = document.createElement('img');
                thumb.src = imgUrl;
                thumb.alt = `${productData.title || 'Product'} thumbnail ${index + 1}`;
                if (index === 0 && specificsMainImageEl) thumb.classList.add('active-thumb');
                thumb.addEventListener('click', () => {
                    if (specificsMainImageEl) specificsMainImageEl.src = imgUrl;
                    specificsThumbnailGalleryEl.querySelectorAll('img').forEach(t => t.classList.remove('active-thumb'));
                    thumb.classList.add('active-thumb');
                });
                specificsThumbnailGalleryEl.appendChild(thumb);
            });
            console.log('[GST_SCRIPT_DEBUG_V3] Thumbnail gallery populated.');
        } else {
             console.log('[GST_SCRIPT_DEBUG_V3] No additional images for thumbnail gallery.');
        }
    } else {
        console.warn("[GST_SCRIPT_DEBUG_V3] specificsThumbnailGalleryEl not found.");
    }
    function populateProductDetail(product) {
        // ... other elements
        const titleEl = detailView.querySelector('#specifics-product-title'); // Or your v2 ID: #product-detail-title
        // ...
        if (titleEl) titleEl.textContent = product.name || "Product Details"; // Uses the 'name' from the product data
        // ...
    }
    // Populate Text Content
    if (specificsTitleEl) specificsTitleEl.textContent = productData.title || "Product Title Missing";
    else console.warn("[GST_SCRIPT_DEBUG_V3] specificsTitleEl not found.");

    if (specificsCategoryEl) specificsCategoryEl.textContent = productData.category ? `Category: ${productData.category}` : "";
    else console.warn("[GST_SCRIPT_DEBUG_V3] specificsCategoryEl not found.");

    if (specificsShortDescEl) specificsShortDescEl.innerHTML = productData.shortDescription || "<p>Short description not available.</p>";
    else console.warn("[GST_SCRIPT_DEBUG_V3] specificsShortDescEl not found.");
    
    if (specificsFullDescEl) specificsFullDescEl.innerHTML = productData.fullDescription || "<p>Detailed description not available.</p>";
    else console.warn("[GST_SCRIPT_DEBUG_V3] specificsFullDescEl not found.");

    // Populate Specifications Table
    // THIS IS THE AREA WHERE THE ERROR ON LINE 419 LIKELY OCCURS
    if (specificsSpecsTableBodyEl) { // Check if the tbody element itself was found
        specificsSpecsTableBodyEl.innerHTML = ''; // Clear previous specs
        if (productData.specifications && productData.specifications.length > 0) {
            productData.specifications.forEach(spec => {
                const row = specificsSpecsTableBodyEl.insertRow();
                row.insertCell().textContent = spec.feature || "N/A";
                row.insertCell().textContent = spec.detail || "N/A";
            });
            console.log('[GST_SCRIPT_DEBUG_V3] Specifications table populated.');
        } else {
            specificsSpecsTableBodyEl.innerHTML = '<tr><td colspan="2">No specifications available for this product.</td></tr>';
            console.log('[GST_SCRIPT_DEBUG_V3] No specifications data for this product.');
        }
    } else {
        console.error("[GST_SCRIPT_DEBUG_V3] CRITICAL: specificsSpecsTableBodyEl (tbody for specifications) NOT FOUND. This is likely the source of the error on line 419.");
        // You might want to create a tbody if it's missing, or ensure your HTML has it:
        // const specsTable = document.getElementById('specifics-specs-table');
        // if (specsTable && !specsTable.querySelector('tbody')) {
        // console.warn("[GST_SCRIPT_DEBUG_V3] specifics-specs-table exists, but tbody is missing. Attempting to create one.");
        // const newTbody = document.createElement('tbody');
        // specsTable.appendChild(newTbody);
        // specificsSpecsTableBodyEl = newTbody; // Re-assign, then try populating again (this is a bit hacky, better to fix HTML)
        // // Retry populating logic here or abstract it
        // }
    }

    // Populate Key Features List
    if (specificsFeaturesListEl) {
        specificsFeaturesListEl.innerHTML = ''; 
        if (productData.keyFeatures && productData.keyFeatures.length > 0) {
            productData.keyFeatures.forEach(feature => {
                const listItem = document.createElement('li');
                listItem.textContent = feature;
                specificsFeaturesListEl.appendChild(listItem);
            });
            console.log('[GST_SCRIPT_DEBUG_V3] Key features list populated.');
        } else {
            specificsFeaturesListEl.innerHTML = '<li>No key features listed for this product.</li>';
            console.log('[GST_SCRIPT_DEBUG_V3] No key features data for this product.');
        }
    } else {
        console.warn("[GST_SCRIPT_DEBUG_V3] specificsFeaturesListEl not found.");
    }

    // Populate Downloads List
    if (specificsDownloadsListEl) {
        specificsDownloadsListEl.innerHTML = '';
        if (productData.downloads && productData.downloads.length > 0) {
            productData.downloads.forEach(download => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = download.url || "#";
                link.textContent = download.name || "Download Link";
                if (download.url && download.url !== "#") { // Only add download attribute if it's a real file link
                    link.setAttribute('download', download.name || 'file'); 
                }
                link.classList.add('download-link'); 
                listItem.appendChild(link);
                specificsDownloadsListEl.appendChild(listItem);
            });
            console.log('[GST_SCRIPT_DEBUG_V3] Downloads list populated.');
        } else {
            specificsDownloadsListEl.innerHTML = '<li>No downloads currently available for this product.</li>';
            console.log('[GST_SCRIPT_DEBUG_V3] No downloads data for this product.');
        }
    } else {
        console.warn("[GST_SCRIPT_DEBUG_V3] specificsDownloadsListEl not found.");
    }
    
    // Reset tabs to default (Description)
    if (specificsTabLinks && specificsTabContents) {
        specificsTabLinks.forEach((link, index) => link.classList.toggle('active-tab', index === 0));
        specificsTabContents.forEach((content, index) => content.classList.toggle('active-tab-content', index === 0));
        console.log('[GST_SCRIPT_DEBUG_V3] Tabs reset to default.');
    } else {
        console.warn("[GST_SCRIPT_DEBUG_V3] Tab links or tab contents not found for reset.");
    }

    console.log('[GST_SCRIPT_DEBUG_V3] displayProductSpecifics: Content population phase complete. Calling showPage("product-specifics").');
    showPage('product-specifics', true); // This will handle making the #product-specifics-page active
}
    // Performance Stat Counter
    const statNumbers = document.querySelectorAll('.stat-number');
    const animateStat = (el) => {
        const target = +el.dataset.target; if (isNaN(target)) return;
        const duration = 1500; const startTime = performance.now();
        function update(ct) {
            const elapsed = ct - startTime; const progress = Math.min(elapsed / duration, 1);
            el.textContent = Math.floor(progress * target);
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    };
    const statObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => { if (entry.isIntersecting) { animateStat(entry.target); obs.unobserve(entry.target); }});
    }, { threshold: 0.5 });
    statNumbers.forEach(stat => { if(stat.dataset.target) statObserver.observe(stat); });

    // Product Filtering
    const productGrid = document.querySelector('.product-grid');
    const productCards = productGrid ? Array.from(productGrid.querySelectorAll('.product-card')) : [];
    productCards.forEach(card => {
    card.addEventListener('click', function(event) {
        event.preventDefault(); 
        const productName = this.dataset.name; 
        if (productName) {
            displayProductSpecifics(productName);
        } else {
            console.warn("Product card clicked, but data-name attribute is missing or empty.", this);
        }
    });
});
    const productSearchInput = document.getElementById('product-search-input');
    const productCategoryFilter = document.getElementById('product-category-filter');
    const clearProductFiltersButton = document.getElementById('clear-product-filters');

    function filterProducts() {
        if (!productGrid || !productSearchInput || !productCategoryFilter) return; // Add checks
        const searchTerm = productSearchInput.value.toLowerCase();
        const selectedCategory = productCategoryFilter.value;
        productCards.forEach(card => {
            const name = (card.dataset.name || "").toLowerCase();
            const category = card.dataset.category || "";
            const nameMatch = name.includes(searchTerm);
            const categoryMatch = selectedCategory === "" || category === selectedCategory;
            card.classList.toggle('hidden', !(nameMatch && categoryMatch));
            card.classList.toggle('is-visible', nameMatch && categoryMatch);
        });
    }
    if (productSearchInput) productSearchInput.addEventListener('input', filterProducts);
    if (productCategoryFilter) productCategoryFilter.addEventListener('change', filterProducts);
    if (clearProductFiltersButton) {
        clearProductFiltersButton.addEventListener('click', () => {
            if(productSearchInput) productSearchInput.value = '';
            if(productCategoryFilter) productCategoryFilter.value = '';
            filterProducts();
        });
    }
    if (productGrid) filterProducts();

    // Training Modules & Form
{
    const trainingModules = document.querySelectorAll('a.training-module');
    const trainingDetailModalOverlay = document.getElementById('training-detail-modal-overlay');
    const modalContent = trainingDetailModalOverlay ? trainingDetailModalOverlay.querySelector('.training-detail-modal-content') : null;
    const modalCloseButton = document.getElementById('modal-close-button');
    const modalTitleEl = document.getElementById('modal-training-title');
    const modalImageEl = document.getElementById('modal-training-image');
    const modalDescriptionEl = document.getElementById('modal-training-description');
    
    const showFormButtonFromModal = document.getElementById('modal-show-training-request-form-button');
    
    const trainingFormContainer = document.getElementById('training-request-form-container');
    const trainingForm = document.getElementById('training-request-form');
    const trainingTopicInput = document.getElementById('training-topic');
    const trainingConfirmation = document.getElementById('training-confirmation');
    const cancelTrainingRequestButton = document.getElementById('cancel-training-request-button');

    let currentModuleTitleForForm = '';

    if (!trainingDetailModalOverlay || !modalCloseButton || !modalTitleEl || !modalImageEl || !modalDescriptionEl || !showFormButtonFromModal) {
        console.error('Critical Modal Element(s) Missing. Functionality will be impaired. Check IDs: training-detail-modal-overlay, modal-close-button, modal-training-title, modal-training-image, modal-training-description, modal-show-training-request-form-button.');
        // Do not return if some elements are missing, as some parts might still work or be debugged.
    }
    if (!trainingFormContainer || !trainingForm || !trainingTopicInput || !trainingConfirmation || !cancelTrainingRequestButton) {
        console.warn('One or more Training Request Form elements are missing. Form functionality might be impaired.');
    }

    function openTrainingDetailModal(moduleElement) {
        if (!trainingDetailModalOverlay || !modalTitleEl || !modalImageEl || !modalDescriptionEl) {
            console.error("Cannot open modal, essential elements are missing.");
            return;
        }
        currentModuleTitleForForm = moduleElement.dataset.moduleTitle || 'Selected Training';
        const largeImageSrc = moduleElement.dataset.largeImageSrc || 'https://placehold.co/800x500/777/eee?text=Large+Image+Unavailable'; // Fallback image
        const fullDescriptionHtml = moduleElement.dataset.fullDescription || '<p>Detailed information for this module is not available at the moment.</p>';

        modalTitleEl.textContent = currentModuleTitleForForm;
        modalImageEl.src = largeImageSrc;
        modalImageEl.alt = `Enlarged view of ${currentModuleTitleForForm}`;
        modalDescriptionEl.innerHTML = fullDescriptionHtml;

        trainingDetailModalOverlay.style.display = 'flex'; // Use flex to enable centering
        setTimeout(() => { // Allow display to apply before starting opacity transition
            trainingDetailModalOverlay.classList.add('active-modal');
        }, 10); 
        
        document.body.style.overflow = 'hidden'; 
        console.log('Training detail modal opened for:', currentModuleTitleForForm);
    }

    function closeTrainingDetailModal() {
        if (!trainingDetailModalOverlay) return;
        trainingDetailModalOverlay.classList.remove('active-modal');
        document.body.style.overflow = '';
        // Wait for transition to finish before setting display to none
        setTimeout(() => {
            if (!trainingDetailModalOverlay.classList.contains('active-modal')) { // Check if it wasn't re-opened
                 trainingDetailModalOverlay.style.display = 'none';
            }
        }, 300); // Match CSS transition duration
        console.log('Training detail modal closed.');
    }

    trainingModules.forEach(moduleLink => {
        moduleLink.addEventListener('click', function(event) {
            event.preventDefault();
            if (trainingFormContainer) trainingFormContainer.style.display = 'none'; // Hide form if open
            if (trainingFormContainer) trainingFormContainer.classList.remove('active-form');
            openTrainingDetailModal(this);
        });
    });

    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', closeTrainingDetailModal);
    }

    if (trainingDetailModalOverlay) {
        trainingDetailModalOverlay.addEventListener('click', function(event) {
            if (event.target === this) { 
                closeTrainingDetailModal();
            }
        });
    }
    
    if (modalContent) {
        modalContent.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent click inside content from closing modal
        });
    }


    if (showFormButtonFromModal) {
        showFormButtonFromModal.addEventListener('click', () => {
            console.log('Request This Training button clicked from modal for:', currentModuleTitleForForm);
            if (currentModuleTitleForForm && trainingTopicInput) {
                trainingTopicInput.value = currentModuleTitleForForm;
            }
            closeTrainingDetailModal();
            
            if (trainingFormContainer && trainingForm && trainingConfirmation) {
                trainingForm.reset(); 
                trainingConfirmation.classList.add('hidden');
                trainingForm.style.display = 'block'; 
                
                trainingFormContainer.style.display = 'block'; // Make it block first
                setTimeout(() => { // Then trigger animation
                    trainingFormContainer.classList.add('active-form');
                }, 10);

                // Scroll to the form container
                const headerOffset = document.getElementById('main-header') ? document.getElementById('main-header').offsetHeight : 0;
                const elementPosition = trainingFormContainer.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - headerOffset - 20; // 20px buffer

                window.scrollTo({
                     top: offsetPosition,
                     behavior: 'smooth'
                });
                console.log('Training request form displayed.');
            } else {
                console.error('Training request form container or its child elements not found.');
            }
        });
    }

    if (trainingForm) {
        trainingForm.addEventListener('submit', function(event) {
            event.preventDefault();
            console.log('Training request form submitted.');
            this.style.display = 'none'; 
            if (trainingConfirmation) trainingConfirmation.classList.remove('hidden');
        });
    }
    
    if (cancelTrainingRequestButton) {
        cancelTrainingRequestButton.addEventListener('click', () => {
            if (trainingFormContainer) {
                trainingFormContainer.classList.remove('active-form');
                setTimeout(() => {
                     trainingFormContainer.style.display = 'none';
                }, 400); // Match transition duration
            }
            if (trainingForm) trainingForm.reset();
            if (trainingConfirmation) trainingConfirmation.classList.add('hidden');
            console.log('Training request cancelled.');
        });
    }
    console.log('GST Training Script V3.1 Initialized Successfully.');
};
    
    // Contact Form Submission
    const contactForm = document.getElementById('contact-form');
    const contactConfirmation = document.getElementById('contact-confirmation');
    if (contactForm && contactConfirmation) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            this.style.display = 'none';
            contactConfirmation.classList.remove('hidden');
        });
    }
    // Inside your document.addEventListener('DOMContentLoaded', () => { ... });
// ... (after other form submissions) ...

const customSolutionForm = document.getElementById('custom-solution-form');
const customSolutionConfirmation = document.getElementById('custom-solution-confirmation');

if (customSolutionForm && customSolutionConfirmation) {
    customSolutionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // Here, you would typically gather the form data:
        const formData = new FormData(this);
        const dataObject = {};
        formData.forEach((value, key) => {
            // Handle multiple files if your backend supports it
            if (key === 'attachments[]') {
                if (!dataObject[key]) {
                    dataObject[key] = [];
                }
                // For file inputs, 'value' is just the filename. 
                // 'formData.get(key)' or 'formData.getAll(key)' gets the File object(s).
                // For simplicity in this example, we'll just note the presence of files.
                // Actual file upload requires more complex handling (e.g., AJAX to a server endpoint).
                const files = this.querySelector('#cs-attachments').files;
                for (let i = 0; i < files.length; i++) {
                    dataObject[key].push(files[i].name); // Storing filenames for now
                }
            } else {
                dataObject[key] = value;
            }
        });
        console.log("Custom Solution Inquiry Data:", dataObject);
        // In a real application, you would send 'formData' or 'dataObject' to your server here.
        // e.g., fetch('/api/custom-solution-inquiry', { method: 'POST', body: formData })
        //      .then(response => response.json())
        //      .then(data => { ... });

        this.style.display = 'none'; // Hide the form
        customSolutionConfirmation.classList.remove('hidden'); // Show confirmation
    });
}

    // Training Request Form Submission
    const trainingForm = document.getElementById('training-request-form');
    const trainingConfirmation = document.getElementById('training-confirmation');
    if (trainingForm && trainingConfirmation) {
        trainingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            this.style.display = 'none';
            trainingConfirmation.classList.remove('hidden');
        });
    }
    console.log("Main DOMContentLoaded script finished all initializations.");
    const productsListingPage = document.getElementById('products-page');
    const productSpecificsPage = document.getElementById('product-specifics-page');
    const backToProductsListButton = document.getElementById('back-to-products-list-button');
    const productDatabase = {
    "Pressure Relief / Safety Valve": {
        id: "prv001",
        title: "Pressure Relief / Safety Valve Series 5200",
        category: "Safety Systems",
        shortDescription: "The Anderson Greenwood Series 5200 pilot-operated pressure relief valve ensures reliable overpressure protection for various industrial applications.",
        fullDescription: "The Series 5200 is engineered for excellence, providing superior performance in gas, vapor, and liquid services. Its pilot-operated design offers a tighter seal near set pressure, reducing product loss and enabling higher operating pressures. Suitable for critical applications in oil & gas, chemical processing, and power generation. This valve combines innovative technology with robust construction to deliver safety and efficiency.",
        images: ["./images/5200.png"],
        specifications: [
            { feature: "Sizes Available", detail: "1\" Inlet x 2\" Outlet to 8\" Inlet x 10\" Outlet" },
            { feature: "Set Pressure Range", detail: "15 psig to 6000 psig (1 barg to 413 barg)" },
            { feature: "Temperature Range", detail: "-450°F to +500°F (-268°C to +260°C)" },
            { feature: "Body Materials", detail: "Carbon Steel, Stainless Steel, Duplex SS, Monel, Hastelloy C" },
            { feature: "Pilot Type", detail: "Snap-acting or Modulating options" },
            { feature: "Certifications", detail: "ASME Section VIII, PED (CE), ATEX, CRN, KGS, SIL 3 Capable" }
        ],
        keyFeatures: [
            "Tight shutoff: Achieves leakage rates better than API 527.",
            "Modulating pilot option for reduced product loss and smoother operation.",
            "Non-flowing pilot design minimizes fugitive emissions and product loss.",
            "Field-testable design allows for verification of set pressure without removing the valve.",
            "Suitable for gas, vapor, and liquid services.",
            "High flow capacity for efficient overpressure protection."
        ],
        downloads: [ // Emerson links, OK
            { name: "Anderson Greenwood Series 5200 IOM.pdf", url: "https://www.emerson.com/documents/automation/manua-pilot-operated-srv-series-5200-iom-anderson-greenwood-en-60309.pdf" },
            { name: "Emerson Pressure Relief Valves Overview Brochure.pdf", url: "https://www.emerson.com/documents/automation/product-brochure-pressure-relief-valves-product-overview-brochure-anderson-greenwood-crosby-sempell-en-en-5887196.pdf" }
        ]
    },
    "Cryogenic Regulator": { // This key is likely from data-product-key
        title: "Cryogenic regulator", // <<< THIS WOULD BE THE SOURCE OF THE ISSUE
        category: "Flow Control",
        shortDescription: "Precision control for low-temperature fluid applications.",
        fullDescription: "The Cryogenic Regulator provides precise and stable pressure control for liquefied gases and other cryogenic fluids. Built with specialized materials to withstand extreme low temperatures, this regulator ensures efficient and safe operation in applications such as industrial gas supply, LNG processing, and research laboratories. Its robust design minimizes boil-off and maximizes system efficiency.",
        specifications: [
            { feature: "Media", detail: "LN2, LOX, LAr, LH2, LNG" },
            { feature: "Operating Temperature", detail: "-320°F to 150°F (-196°C to 65°C)" },
            { feature: "Pressure Range", detail: "5 psi to 500 psi" },
            { feature: "Body Material", detail: "Stainless Steel (304L, 316L)" },
            { feature: "Connection Type", detail: "NPT, Flanged, Tube Ends" }
        ],
        keyFeatures: [
            "Excellent cold-temperature performance and reliability.",
            "Minimizes heat leak for reduced product loss.",
            "Stable outlet pressure across varying flow rates.",
            "Compact design for space-constrained applications.",
            "Easy to install and maintain."
        ],
        downloads: [
            { name: "Datasheet: Cryogenic Regulator", url: "./documents/cryogenic_regulator_datasheet.pdf" }
        ],
        images: ["./images/cryo valve.png"]
    },
    "Steam Products": {
        id: "stm001",
        title: "High-Efficiency Steam Trap ST-250",
        category: "Process Control",
        shortDescription: "Durable and efficient components for optimal steam system management and energy savings.",
        fullDescription: "The ST-250 thermodynamic steam trap is designed for high-efficiency condensate removal from steam lines. Its robust construction ensures longevity in harsh industrial environments. Proper steam trapping is crucial for system efficiency, safety, and reduced energy consumption. This model offers excellent performance across a wide range of pressures.",
        images: ["./images/steam trap.png",],
        specifications: [
            { feature: "Type", detail: "Thermodynamic Disc Trap" },
            { feature: "Max Operating Pressure", detail: "42 barg (600 psig)" },
            { feature: "Max Operating Temperature", detail: "400°C (752°F)" },
            { feature: "Connections", detail: "1/2\", 3/4\", 1\" Screwed (BSP/NPT) or Socket Weld" },
            { feature: "Body Material", detail: "Stainless Steel / Carbon Steel" }
        ],
        keyFeatures: [
            "Intermittent discharge with tight shut-off.",
            "Resistant to water hammer.",
            "Built-in strainer to protect working parts.",
            "Easy to install and maintain.",
            "Suitable for superheated steam applications."
        ],
        downloads: [
            { name: "Emerson Yarway 711-721 Series Thermodynamic Steam Trap Datasheet.pdf", url: "https://fergusonprod.a.bigcontent.io/v1/static/498895_11882128_specification" }, // Yarway is an Emerson brand
            { name: "Emerson Steam Trap Sizing and Selection Guide.pdf", url: "https://documentation.emersonprocess.com/intradoc-cgi/idc_cgi_isapi.dll?IdcService=GET_FILE&dID=4160086&dDocName=STEAMTRAP_SIZING&allowInterrupt=1" }
        ]
    },
    "Instrument Valve": {
        id: "inst001",
        title: "Precision Instrument Valve IV-1000",
        category: "Instrumentation",
        shortDescription: "High-integrity valves for process measurement and control lines, ensuring accurate readings and system safety.",
        fullDescription: "The IV-1000 series instrument valves are designed for critical applications in instrumentation lines, offering reliable shut-off and regulation. They are suitable for use with gauges, transmitters, and other measurement devices. Available in various configurations including needle valves, ball valves, and manifold valves.",
        images: ["./images/instrument.png"],
        specifications: [
            { feature: "Pressure Rating", detail: "Up to 10,000 psi (689 bar)" },
            { feature: "Material", detail: "SS316, Monel, Hastelloy" },
            { feature: "End Connections", detail: "NPT, BSPT, Tube Fittings" }
        ],
        keyFeatures: [
            "Leak-tight performance.",
            "Panel mountable options.",
            "Variety of stem types for different applications."
        ],
        downloads: [ // Tescom is an Emerson brand
            { name: "Emerson Tescom HD29 Primary Isolation (Needle) Valve Catalog.pdf", url: "https://www.emerson.com/documents/automation/catalog-hd29-series-primary-isolation-valve-tescom-en-5193264.pdf" }
            // Alternative Emerson instrument valve catalog (manifolds, also mentioned in product desc):
            // { name: "Emerson Tescom Anderson Greenwood Instrumentation Manifolds Catalog.pdf", url: "https://www.emerson.com/documents/automation/catalog-as-series-manifold-tescom-en-11355244.pdf" }
        ]
    },
    "Isolation Valve": {
        category: "Flow Control",
        title: "Vanessa Series 30,000 Triple offset valve.",
        shortDescription: "Dependable shut-off valves for maintenance and safety isolation.",
        fullDescription: "Isolation valves are critical for safely isolating sections of piping systems for maintenance, repair, or process control. Our selection includes ball valves, gate valves, globe valves, and butterfly valves, available in various materials and pressure classes to suit demanding industrial applications. They are designed for reliable shut-off performance, ensuring operator safety and minimizing downtime during system interventions.",
        specifications: [
            { feature: "Types", detail: "Ball Valve, Gate Valve, Globe Valve, Butterfly Valve" },
            { feature: "Sizes", detail: "1/2\" to 48\"" },
            { feature: "Pressure Class", detail: "ASME Class 150 to 2500" },
            { feature: "Materials", detail: "Cast Carbon Steel, Stainless Steel, Duplex, Alloys" },
            { feature: "End Connections", detail: "Flanged, Welded, Threaded" }, // Added comma here
            { 
                feature: "Key Construction Details", // Changed to a more appropriate feature title
                detail: "All-metal construction available in basic, cryogenic and high temperature configurations • Stellite grade 21 seat overlays provide excellent durability • Resilient metal seal ring ensures perfect seating force distribution • The one-piece shaft ensures high pressure containment safety/maximum torque seating integrity • Two-piece packing gland and graphite packing minimize external emission risk • Heavy duty bearings withstand high pressure loads and wear" 
            }
        ],
        keyFeatures: [
            "Tight shut-off capabilities for safe isolation.",
            "Durable construction for long service life.",
            "Low pressure drop for efficient flow.",
            "Wide range of material options for corrosive and abrasive services.",
            "Manual, geared, or actuated operation available."
        ],
        downloads: [
            { name: "Catalog: Industrial Isolation Valves", url: "./documents/isolation_valve_catalog.pdf" }
        ],
        images: ["./images/isovalve.png"]
    },
    "Rupture Disc / Extruder": {
        id: "rd001",
        title: "Precision Rupture Disc & Extruder Burst Plugs RD-Safeguard",
        category: "Safety Systems",
        shortDescription: "Fail-safe pressure relief devices designed for instantaneous overpressure protection in critical systems, including extruder applications.",
        fullDescription: "The RD-Safeguard series includes a comprehensive range of rupture discs (bursting discs) and extruder burst plugs that act as passive safety devices to protect equipment and personnel from overpressure conditions. These devices provide an instantaneous, full-bore opening once the calibrated burst pressure is reached. Ideal for primary or secondary relief in chemical processing, oil & gas, pharmaceuticals, and plastics extrusion machinery.",
        images: [
            "./images/rupture.png",
        ],
        specifications: [
            { feature: "Disc Types", detail: "Forward-acting, Reverse-acting, Scored, Composite" },
            { feature: "Burst Pressure Range", detail: "From a few inches of water column to over 100,000 psig" },
            { feature: "Size Range", detail: "1/4\" to 48\" (DN8 to DN1200)" },
            { feature: "Materials", detail: "Stainless Steel, Nickel Alloys (Inconel, Monel), Hastelloy, Tantalum, Graphite, Fluoropolymer coatings" },
            { feature: "Operating Ratio", detail: "Up to 95% of minimum burst pressure" },
            { feature: "Certifications", detail: "ASME UD, CE (PED), KOSHA, ATEX" }
        ],
        keyFeatures: [
            "Non-reclosing design ensures full pressure relief.",
            "Leak-tight performance before burst.",
            "Available with various burst indicators and sensors.",
            "Suitable for gas, liquid, and two-phase flow applications.",
            "Specific designs for high-viscosity media and extruder protection.",
            "Maintenance-free (until burst)."
        ],
        downloads: [ // Fike links
            { name: "Fike Rupture Discs Product Line Brochure.pdf", url: "https://my.fike.com/_fike_docs/New_Docs_System/Pressure%20Relief/Brochures/28117_fke_PR_Brochure_Trifold_w_images_2212_FA_DIGITAL-1.pdf" },
            { name: "Fike Extruder Rupture Disc (ERD) Datasheet.pdf", url: "https://valwo.eu/pdf/bursting-disc/erd.pdf" }
        ]
    },
    "Regulator Valve": {
        id: "reg001",
        title: "Versatile Pressure Regulator Valve REG-Control Series",
        category: "Specialty Valves",
        shortDescription: "Automatically controls and maintains fluid (liquid or gas) pressure at a desired lower and constant value, ensuring process stability and safety.",
        fullDescription: "The REG-Control Series of pressure regulators (also known as pressure reducing valves - PRVs) are designed for precise and reliable pressure management in a wide array of industrial processes. These self-acting valves maintain a preset downstream pressure regardless of fluctuations in upstream pressure or flow demand. Available in direct-operated and pilot-operated designs to suit various flow rates and accuracy requirements.",
        images: [
            "./images/regulator.png",
        ],
        specifications: [
            { feature: "Regulator Types", detail: "Direct-Operated, Pilot-Operated, Back-Pressure Regulators, Differential Pressure Regulators" },
            { feature: "Controlled Medium", detail: "Gases (Air, Nitrogen, Natural Gas, Steam), Liquids (Water, Oils, Chemicals)" },
            { feature: "Inlet Pressure Range", detail: "Up to 400 barg (5800 psig)" },
            { feature: "Outlet (Controlled) Pressure Range", detail: "From vacuum to 200 barg (2900 psig)" },
            { feature: "Size Range", detail: "1/4\" to 12\" (DN8 to DN300)" },
            { feature: "Body Materials", detail: "Brass, Bronze, Carbon Steel, Stainless Steel, Ductile Iron, Special Alloys" },
            { feature: "Diaphragm/Piston Materials", detail: "Elastomers (NBR, EPDM, FKM), Stainless Steel, PTFE" }
        ],
        keyFeatures: [
            "Accurate and stable pressure control.",
            "Wide range of adjustable outlet pressures.",
            "Fast response to changes in flow or upstream pressure.",
            "Robust construction for durability and long service life.",
            "Options for hazardous area applications (ATEX).",
            "Easy set-point adjustment and maintenance."
        ],
        downloads: [ // Emerson links
            { name: "Emerson Industrial Regulators Quick Selection Guide.pdf", url: "https://www.emerson.com/documents/automation/industrial-regulators-quick-selection-guide-en-10481142.pdf" },
            { name: "Emerson Regulator Best Practices (Sizing & Selection).pdf", url: "https://www.emerson.com/documents/automation/regulator-best-practices-en-8109372.pdf" }
        ]
    }
};

// To use this to generate HTML for downloads:
function displayProductDownloads(productKey) {
    const product = productDatabase[productKey];
    const downloadsContainer = document.getElementById('downloads-for-' + product.id); // Assuming you have a container like <div id="downloads-for-prv001"></div>

    if (downloadsContainer && product && product.downloads && product.downloads.length > 0) {
        downloadsContainer.innerHTML = ''; // Clear previous links
        const h4 = document.createElement('h4');
        h4.textContent = 'Downloads';
        downloadsContainer.appendChild(h4);
        const ul = document.createElement('ul');
        product.downloads.forEach(download => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = download.url;
            a.textContent = download.name;
            // a.setAttribute('download', download.name); // Optional: Suggests filename to browser
            a.setAttribute('target', '_blank'); // Open in new tab
            a.setAttribute('rel', 'noopener noreferrer'); // Security best practice for target="_blank"
            li.appendChild(a);
            ul.appendChild(li);
        });
        downloadsContainer.appendChild(ul);
    } else if (downloadsContainer) {
        downloadsContainer.innerHTML = ''; // Clear if no downloads
    }
}

// Example of how you might call this if you have product pages:
// displayProductDownloads("Cryogenic Regulator"); 
// displayProductDownloads("Steam Products");
// etc.
    function displayProductSpecifics(productKey) {
        const productData = productDatabase[productKey]; 

        if (!productData || !productSpecificsPage) {
            console.error("Product data or specifics page element not found for key:", productKey);
            if(productSpecificsPage) {
                 const titleEl = productSpecificsPage.querySelector('#specifics-product-title');
                 if(titleEl) titleEl.textContent = "Product Not Found";
            }
            return;
        }
        
        const mainImageEl = productSpecificsPage.querySelector('#specifics-main-image');
        const thumbnailGalleryEl = productSpecificsPage.querySelector('#specifics-thumbnail-gallery');
        const titleEl = productSpecificsPage.querySelector('#specifics-product-title');
        const categoryEl = productSpecificsPage.querySelector('#specifics-product-category');
        const shortDescEl = productSpecificsPage.querySelector('#specifics-product-short-description');
        const fullDescEl = productSpecificsPage.querySelector('#specifics-full-description');
        const specsTableBodyEl = productSpecificsPage.querySelector('#specifics-specs-table tbody');
        const featuresListEl = productSpecificsPage.querySelector('#specifics-features-list');
        const downloadsListEl = productSpecificsPage.querySelector('#specifics-downloads-list');

        if(mainImageEl) {
            mainImageEl.src = (productData.images && productData.images.length > 0) ? productData.images[0] : 'https://placehold.co/600x400/eee/ccc?text=Image+Unavailable';
            mainImageEl.alt = productData.title || "Product Image";
        }

        if(thumbnailGalleryEl) {
            thumbnailGalleryEl.innerHTML = ''; 
            if (productData.images && productData.images.length > 1) {
                productData.images.forEach((imgUrl, index) => {
                    const thumb = document.createElement('img');
                    thumb.src = imgUrl;
                    thumb.alt = `${productData.title || 'Product'} thumbnail ${index + 1}`;
                    if(index === 0 && mainImageEl) thumb.classList.add('active-thumb');
                    thumb.addEventListener('click', () => {
                        if(mainImageEl) mainImageEl.src = imgUrl;
                        thumbnailGalleryEl.querySelectorAll('img').forEach(t => t.classList.remove('active-thumb'));
                        thumb.classList.add('active-thumb');
                    });
                    thumbnailGalleryEl.appendChild(thumb);
                });
            }
        }
        
        if(titleEl) titleEl.textContent = productData.title || "Product Title";
        if(categoryEl) categoryEl.textContent = productData.category ? `Category: ${productData.category}` : "Category: N/A";
        if(shortDescEl) shortDescEl.innerHTML = productData.shortDescription || "No short description available.";
        if(fullDescEl) fullDescEl.innerHTML = productData.fullDescription || "No detailed description available.";

        if(specsTableBodyEl) {
            specsTableBodyEl.innerHTML = ''; 
            if (productData.specifications && productData.specifications.length > 0) {
                productData.specifications.forEach(spec => {
                    const row = specsTableBodyEl.insertRow();
                    row.insertCell().textContent = spec.feature;
                    row.insertCell().textContent = spec.detail;
                });
            } else {
                specsTableBodyEl.innerHTML = '<tr><td colspan="2">No specifications available.</td></tr>';
            }
        }

        if(featuresListEl) {
            featuresListEl.innerHTML = ''; 
            if (productData.keyFeatures && productData.keyFeatures.length > 0) {
                productData.keyFeatures.forEach(feature => {
                    const listItem = document.createElement('li');
                    listItem.textContent = feature;
                    featuresListEl.appendChild(listItem);
                });
            } else {
                featuresListEl.innerHTML = '<li>No key features listed.</li>';
            }
        }

        if(downloadsListEl) {
            downloadsListEl.innerHTML = '';
            if (productData.downloads && productData.downloads.length > 0) {
                productData.downloads.forEach(download => {
                    const listItem = document.createElement('li');
                    const link = document.createElement('a');
                    link.href = download.url;
                    link.textContent = download.name;
                    link.setAttribute('download', ''); 
                    link.classList.add('download-link'); 
                    listItem.appendChild(link);
                    downloadsListEl.appendChild(listItem);
                });
            } else {
                downloadsListEl.innerHTML = '<li>No downloads available for this product.</li>';
            }
        }
        
        const tabLinks = productSpecificsPage.querySelectorAll('.tab-link');
        const tabContents = productSpecificsPage.querySelectorAll('.tab-content');
        tabLinks.forEach((link, index) => {
            if (index === 0) {
                link.classList.add('active-tab');
            } else {
                link.classList.remove('active-tab');
            }
        });
        tabContents.forEach((content, index) => {
            if (index === 0) { 
                content.classList.add('active-tab-content');
            } else {
                content.classList.remove('active-tab-content');
            }
        });

        document.querySelectorAll('.page-section.active-page').forEach(s => s.classList.remove('active-page'));
        productSpecificsPage.classList.add('active-page'); // productSpecificsPage is document.getElementById('product-specifics-page')
        window.scrollTo(0, 0);
    }

    productCards.forEach(card => {
        card.addEventListener('click', function(event) {
            event.preventDefault(); 
            const productName = this.dataset.name; 
            if (productName) {
                displayProductSpecifics(productName);
            } else {
                console.warn("Product card clicked, but data-name attribute is missing or empty.", this);
            }
        });
    });

    if (backToProductsListButton) {
        backToProductsListButton.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.page-section.active-page').forEach(s => s.classList.remove('active-page'));
            if (productsListingPage) {
                productsListingPage.classList.add('active-page');
                window.scrollTo(0, 0);
            }
        });
    }
    
    const tabLinks = productSpecificsPage.querySelectorAll('#product-specifics-page .tab-link'); // Scoped selector
    const tabContents = productSpecificsPage.querySelectorAll('#product-specifics-page .tab-content'); // Scoped selector

    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.dataset.tab;

            tabLinks.forEach(l => l.classList.remove('active-tab'));
            this.classList.add('active-tab');

            tabContents.forEach(content => {
                content.classList.remove('active-tab-content');
                if (content.id === tabId) {
                    content.classList.add('active-tab-content');
                }
            });
        });
    });
    
    const specificsInquiryButton = document.getElementById('specifics-inquiry-button');
    if (specificsInquiryButton) {
        specificsInquiryButton.addEventListener('click', function(e) {
            const productName = document.getElementById('specifics-product-title').textContent;
            const contactSubjectInput = document.getElementById('contact-subject');
            if (contactSubjectInput && productName) {
                contactSubjectInput.value = `Inquiry about: ${productName}`;
            }
        });
    }
});// script.js (Add or modify this part in your existing script.js)

document.addEventListener('DOMContentLoaded', () => {
    // ... existing DOMContentLoaded code ...

    const searchInput = document.getElementById('search-input');
    const searchForm = document.getElementById('search-form');
    const searchResultsContainer = document.createElement('div'); // Create a div for search results
    searchResultsContainer.id = 'search-results';
    searchResultsContainer.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background-color: var(--color-background-dark, #1e1e1e);
        border: 1px solid var(--color-border, #333);
        border-top: none;
        max-height: 300px;
        overflow-y: auto;
        z-index: 1000;
        padding: 10px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        display: none; /* Hidden by default */
        color: var(--color-text-light, #f0f0f0);
    `;
    searchForm.parentElement.appendChild(searchResultsContainer); // Append to the container of the search form

    // Function to collect all searchable content
    function collectSearchableContent(product) {
        const content = [];

        // 1. Navigation Links (top level)
        document.querySelectorAll('#desktop-nav .nav-item span.nav-link').forEach(link => {
            const text = link.textContent.trim();
            const targetMenuId = link.dataset.targetMenu;
            if (text && targetMenuId) {
                // Link to the main page section that the menu points to
                let targetSectionId = '';
                if (text === 'PRODUCTS') targetSectionId = 'products-page';
                else if (text === 'SERVICES & SUPPORT') targetSectionId = 'services-page';
                else if (text === 'BRANDS') targetSectionId = 'brands-page';
                else if (text === 'COMPANY') targetSectionId = 'company-page';

                content.push({
                    title: text,
                    category: 'Navigation',
                    keywords: text.toLowerCase().split(' ').concat(targetMenuId.replace('-', ' ').toLowerCase().split(' ')),
                    link: `#${targetSectionId || ''}` // Link to the main section if available
                });
            }
        });

        // 2. Mega Menu Links
        document.querySelectorAll('.mega-menu a.nav-page-link, .mega-menu a[target="_blank"]').forEach(link => {
            const title = link.textContent.trim();
            let category = '';
            let sectionId = link.getAttribute('href'); // e.g., #products, #services, #company
            const scrollTarget = link.dataset.scrollTarget; // e.g., "repair", "about"

            // Determine category based on parent mega-menu ID
            const parentMenu = link.closest('.mega-menu');
            if (parentMenu) {
                if (parentMenu.id === 'products-menu') category = 'Products Category';
                else if (parentMenu.id === 'services-menu') category = 'Services & Support';
                else if (parentMenu.id === 'brands-menu') category = 'Brands & Partners';
                else if (parentMenu.id === 'company-menu') category = 'Company Information';
            }

            let fullLink = sectionId;
            if (scrollTarget) {
                fullLink = `#${scrollTarget}`; // Direct link to subsection ID
            } else if (sectionId.startsWith('#') && sectionId.length > 1) {
                // Ensure it's a valid ID and not just '#'
                fullLink = sectionId;
            } else if (link.getAttribute('target') === '_blank') {
                category = 'External Brand Link';
                fullLink = link.href; // Keep external link as is
            } else {
                 // Fallback for general links, might need refinement
                fullLink = link.href;
            }
            
            // Adjust keywords for repair, history, etc.
            let keywords = [title.toLowerCase()];
            if (category) keywords.push(category.toLowerCase());
            if (scrollTarget) keywords.push(scrollTarget.toLowerCase());
            if (sectionId && sectionId.startsWith('#')) keywords.push(sectionId.substring(1).toLowerCase());

            content.push({
                title: title,
                category: category || 'Link',
                keywords: Array.from(new Set(keywords)), // Remove duplicates
                link: fullLink
            });
        });

        // 3. Main Section Titles and Subtitles
        document.querySelectorAll('.page-section .section-title, .page-section .section-intro, .sub-section .subsection-title').forEach(el => {
            const title = el.textContent.trim();
            const parentSection = el.closest('.page-section');
            let category = 'Content';
            let link = '#';

            if (parentSection) {
                const sectionId = parentSection.id;
                link = `#${sectionId}`;
                if (sectionId === 'company-page') category = 'Company Information';
                else if (sectionId === 'products-page') category = 'Products Overview';
                else if (sectionId === 'services-page') category = 'Services Overview';
                else if (sectionId === 'brands-page') category = 'Brands Overview';
                else if (sectionId === 'history-page') category = 'Company History';
                else if (sectionId === 'custom-solution-page') category = 'Custom Solutions Inquiry';
                else if (sectionId === 'hero-section') category = 'Homepage'; // For the hero section content
            }

            // For subsections, refine link and category
            const parentSubSection = el.closest('.sub-section');
            if (parentSubSection && parentSubSection.id) {
                link = `#${parentSubSection.id}`;
                if (parentSubSection.id === 'about') category = 'About Us';
                else if (parentSubSection.id === 'management') category = 'Management';
                else if (parentSubSection.id === 'performance') category = 'Performance';
                else if (parentSubSection.id === 'certification') category = 'Certifications';
                else if (parentSubSection.id === 'contact') category = 'Contact Us';
                else if (parentSubSection.id === 'repair') category = 'Repair Services';
                else if (parentSubSection.id === 'training-request') category = 'Training Request';
                else if (parentSubSection.id === 'live-support') category = 'Live Support';
                else if (parentSubSection.id === 'history-section') category = 'Company History';
            }

            content.push({
                title: title,
                category: category,
                keywords: title.toLowerCase().split(' '),
                link: link
            });
        });

        // 4. Product Cards
        document.querySelectorAll('.product-card:not(.is-placeholder-card)').forEach(card => {
            const title = card.querySelector('.product-title').textContent.trim();
            const category = card.querySelector('.product-category').textContent.trim();
            const description = card.querySelector('.product-description').textContent.trim();
            const productLinkElement = card.querySelector('.product-link');
            const productKey = productLinkElement ? productLinkElement.dataset.productKey : title;
            const link = productLinkElement ? productLinkElement.href : `#products`; // Fallback to #products

            content.push({
                title: title,
                category: `Product: ${category}`,
                keywords: (title + ' ' + category + ' ' + description + ' ' + productKey).toLowerCase().split(' '),
                link: link // Link to product-specifics page, handled by JS
            });
        });

        // 5. Product Specifics Page content (if loaded dynamically, you'd need to re-index or handle)
        // For now, let's assume these details are present on the page, even if hidden
        // This part would be more complex if you load these dynamically via AJAX/fetch
        const specificsPage = document.getElementById('product-specifics-page');
        if (specificsPage) {
            const titleEl = document.getElementById('specifics-product-title');
            const categoryEl = document.getElementById('specifics-product-category');
            const shortDescEl = document.getElementById('specifics-product-short-description');
            const fullDescEl = document.getElementById('specifics-full-description');
            const specsTable = document.getElementById('specifics-specs-table');
            const featuresList = document.getElementById('specifics-features-list');

            if (titleEl && categoryEl && shortDescEl) {
                let allText = titleEl.textContent.trim() + ' ' +
                              categoryEl.textContent.trim() + ' ' +
                              shortDescEl.textContent.trim();

                if (fullDescEl) allText += ' ' + fullDescEl.textContent.trim();

                if (specsTable) {
                    Array.from(specsTable.querySelectorAll('th, td')).forEach(cell => {
                        allText += ' ' + cell.textContent.trim();
                    });
                }
                if (featuresList) {
                    Array.from(featuresList.querySelectorAll('li')).forEach(li => {
                        allText += ' ' + li.textContent.trim();
                    });
                }

                content.push({
                    title: titleEl.textContent.trim(),
                    category: `Product Details: ${categoryEl.textContent.trim()}`,
                    keywords: allText.toLowerCase().split(' '),
                    link: `#product-specifics` // Generic link, will require JS to open correct tab
                });
            }
        }
        
        // 6. Certifications & Downloads
        document.querySelectorAll('#certification .download-link').forEach(link => {
            const title = link.textContent.trim().replace(/\s*\(.*\)/, ''); // Remove (Shanghai) etc.
            const certGroup = link.closest('.cert-group');
            const brand = certGroup ? certGroup.querySelector('h3.cert-title').textContent.trim() : 'General';
            
            content.push({
                title: `Download: ${title}`,
                category: `Certification - ${brand}`,
                keywords: (title + ' ' + brand + ' certificate download').toLowerCase().split(' '),
                link: link.href // Actual download link
            });
        });

        // 7. History Timeline entries
        document.querySelectorAll('.history-entry').forEach(entry => {
            const year = entry.dataset.year;
            const title = entry.querySelector('.timeline-title').textContent.trim();
            const description = entry.querySelector('.timeline-description').textContent.trim();
            
            content.push({
                title: `History: ${year} - ${title}`,
                category: 'Company History',
                keywords: (`history ${year} ${title} ${description}`).toLowerCase().split(' '),
                link: `#history` // Link to the history section
            });
        });

        // 8. Contact Information
        document.querySelectorAll('#contact .location').forEach(loc => {
            const title = loc.querySelector('h4').textContent.trim();
            const address = loc.querySelector('p:nth-of-type(1)') ? loc.querySelector('p:nth-of-type(1)').textContent.trim() : '';
            const phone = loc.querySelector('a[href^="tel:"]') ? loc.querySelector('a[href^="tel:"]').textContent.trim() : '';
            const email = loc.querySelector('a[href^="mailto:"]') ? loc.querySelector('a[href^="mailto:"]').textContent.trim() : '';
            
            content.push({
                title: title,
                category: 'Contact Information',
                keywords: (`${title} ${address} ${phone} ${email} contact location office`).toLowerCase().split(' '),
                link: `#contact`
            });
        });

        // 9. Training Modules
        document.querySelectorAll('.training-module h3, .training-module p').forEach(el => {
            const title = el.textContent.trim();
            const moduleLink = el.closest('.training-module');
            if (moduleLink) {
                const target = moduleLink.dataset.scrollTarget;
                content.push({
                    title: `Training: ${title}`,
                    category: 'Services & Support - Training',
                    keywords: (`training ${title} ${target}`).toLowerCase().split(' '),
                    link: `#${target}` // Link to the specific training detail
                });
            }
        });

        // 10. Live Support Common Inquiries
        document.querySelectorAll('.quick-inquiry-btn').forEach(button => {
            const message = button.dataset.message;
            const text = button.textContent.trim();
            content.push({
                title: `Live Support Inquiry: ${text}`,
                category: 'Services & Support - Live Support',
                keywords: (`live support ${text} ${message}`).toLowerCase().split(' '),
                link: `#live-support`
            });
        });
        
        return content;
    }

    const searchableItems = collectSearchableContent();
    console.log("Searchable Items:", searchableItems); // For debugging: see what's indexed

    function displaySearchResults(results) {
        searchResultsContainer.innerHTML = ''; // Clear previous results
        if (results.length === 0) {
            searchResultsContainer.style.display = 'none';
            return;
        }

        const ul = document.createElement('ul');
        ul.style.cssText = `
            list-style: none;
            padding: 0;
            margin: 0;
        `;

        results.slice(0, 10).forEach(item => { // Show top 10 results
            const li = document.createElement('li');
            li.style.cssText = `
                padding: 8px 12px;
                border-bottom: 1px solid var(--color-border, #444);
            `;
            li.innerHTML = `
                <a href="${item.link}" class="search-result-link nav-page-link" 
                   data-product-key="${item.category.startsWith('Product:') ? item.title : ''}"
                   ${item.link.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}
                   style="color: var(--color-primary, #007bff); text-decoration: none; display: block;">
                    <strong>${item.title}</strong>
                    <span style="display: block; font-size: 0.85em; color: var(--color-text-secondary, #bbb);">${item.category}</span>
                </a>
            `;
            ul.appendChild(li);
        });
        searchResultsContainer.appendChild(ul);
        searchResultsContainer.style.display = 'block';
    }

    function performSearch() {
        const query = searchInput.value.toLowerCase().trim();
        if (query.length < 2) { // Require at least 2 characters for search
            searchResultsContainer.style.display = 'none';
            return;
        }

        const filteredResults = searchableItems.filter(item => {
            return item.keywords.some(keyword => keyword.includes(query)) ||
                   item.title.toLowerCase().includes(query) ||
                   item.category.toLowerCase().includes(query);
        });

        displaySearchResults(filteredResults);
    }

    // Event listeners for search input
    searchInput.addEventListener('input', performSearch);

    // Hide search results when clicking outside
    document.addEventListener('click', (event) => {
        if (!searchForm.contains(event.target) && !searchResultsContainer.contains(event.target)) {
            searchResultsContainer.style.display = 'none';
        }
    });

    // Make the search icon toggle the search bar visibility
    const searchIconButton = document.getElementById('search-icon-button');
    const searchBar = document.getElementById('search-bar');

    searchIconButton.addEventListener('click', () => {
        const isExpanded = searchIconButton.getAttribute('aria-expanded') === 'true';
        searchBar.classList.toggle('active', !isExpanded);
        searchIconButton.setAttribute('aria-expanded', !isExpanded);
        if (!isExpanded) {
            searchInput.focus(); // Focus on the input when search bar opens
        } else {
            searchResultsContainer.style.display = 'none'; // Hide results if closing
        }
    });

    // Handle clicks on search results (delegation for .nav-page-link)
    searchResultsContainer.addEventListener('click', (event) => {
        const link = event.target.closest('.search-result-link');
        if (link) {
            event.preventDefault(); // Prevent default navigation for now to handle it smoothly
            const href = link.getAttribute('href');
            const productKey = link.dataset.productKey;

            // Handle product specifics page separately
            if (href === '#product-specifics' && productKey) {
                // Assuming you have a function to load product details by key
                // You might need to adjust this based on how your product-specifics-page is dynamically populated
                showPage('product-specifics-page'); // Show the product specifics page
                // Trigger the function that loads the specific product data
                // This assumes `loadProductDetails` is defined elsewhere in your script.js
                if (typeof loadProductDetails === 'function') {
                    loadProductDetails(productKey);
                }
            } else {
                // For other internal links, use your existing smooth scroll/page transition logic
                // This assumes you have a `MapsToPage` or similar function
                if (typeof navigateToPage === 'function') {
                    navigateToPage(href, link.textContent.trim().split(':')[0]); // Pass target and title for transition
                } else {
                    window.location.href = href; // Fallback to direct navigation
                }
            }
            searchResultsContainer.style.display = 'none'; // Hide results after clicking
            searchBar.classList.remove('active'); // Close the search bar
            searchIconButton.setAttribute('aria-expanded', 'false');
            searchInput.value = ''; // Clear search input
        }
    });
    
    // Ensure smooth page transitions also hide search results and close search bar
    document.querySelectorAll('.nav-page-link').forEach(link => {
        link.addEventListener('click', () => {
            searchResultsContainer.style.display = 'none';
            searchBar.classList.remove('active');
            searchIconButton.setAttribute('aria-expanded', 'false');
            searchInput.value = '';
        });
    });

    // ... rest of your existing script.js code ...

});
