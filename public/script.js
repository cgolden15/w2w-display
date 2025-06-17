// 🔧 You define the grouping here manually
const groupMap = {
  'Captains': {
    positions: [
      '300-SE-Captain',
      '300-SE-Lead',
      '300-SE-Management',
    ],
    color: '#ff0000' // red
  },
  'Orange Team': {
    positions: [
      '300-SE-SBF 500',
      '300-SE-Games',
      '300-SE-Playground',
      '300-SE-Ropes Course',
      '300-SE-Alien Encounter',
      '300-SE-Barn of Horror JR'
    ],
    color: '#f58220' // orange
  },
  'Green Team': {
    positions: [
      '300-SE-Pillow',
      '300-SE-Super Mega Slide!'
    ],
    color: '#009639' // green
  },
  'Front of House': {
    positions: [
      '300-SE-Admission Booth',
      '300-SE-Enter/Exit gate',
      '300-SE-Sanitation',
      '300-SE-Wagon Ride Check In'
    ],
    color: '#0072ce' // blue
  },
  'Retail Team': {
    positions: [
      '800-HG-Gem Mining',
      '300-SE-PYO Tent',
      '75-Cashier-Field Market Tent',
      '800-HG-Glow Cart',
      '75-Cashier-PYO Pumpkin Tent'
    ],
    color: '#A020F0' // purple
  },
  'Other Staff': {
    positions: [
      '300-SE-Flex Staff',
      '300-SE-Security',
      '300-SE-Tractor Drivers',
      '300-SE-Maintenance'
    ],
    color: '#cccccc' // gray
  },
  'Beverage': {
        positions: [
        '252-ST-Borderline',
        '252-ST-Silo',
        '252-ST-Beer and Pretzel',
        '252-ST-Smores',
        '250-ST-Barback / Runner'
        ],
        color: '#FF69B4' // Bubble Gum Pussy Pink
    },
    'Food': {
        positions: [
        '200-FS-Field Pizza',
        '200-FS-Apple Shack',
        '200-FS-Runner'
        ],
        color: '#000000' // Black
    },
};

let currentFilter = 'all'; // 'all', 'before4', 'after4'

function toggleFilter() {
  if (currentFilter === 'all') {
    currentFilter = 'before4';
    document.getElementById('filterToggleBtn').textContent = '🕤 Before 4 PM';
  } else if (currentFilter === 'before4') {
    currentFilter = 'after4';
    document.getElementById('filterToggleBtn').textContent = '🕓 After 4 PM';
  } else {
    currentFilter = 'all';
    document.getElementById('filterToggleBtn').textContent = '🕛 All Shifts';
  }

  loadShifts();
}

async function loadShifts() {
  const response = await fetch('/shifts');
  let shifts = await response.json();

  shifts = shifts.filter(shift => {
    if (!shift.startTime || !shift.endTime) return true;

    const parseTime = (timeStr) => {
      const match = timeStr.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/);
      if (!match) return null;

      let [_, hourStr, minuteStr, meridiem] = match;
      let hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr || '0', 10);

      if (meridiem === 'pm' && hour !== 12) hour += 12;
      if (meridiem === 'am' && hour === 12) hour = 0;

      return hour + minute / 60;
    };

    const start = parseTime(shift.startTime);
    const end = parseTime(shift.endTime);

    if (start === null || end === null) return true;

    if (currentFilter === 'before4') return start < 16;
    if (currentFilter === 'after4') return start >= 16 || end >= 16;
    return true; // 'all'
  });





  const board = document.getElementById('shiftBoard');
  
  // Clear existing content
  board.innerHTML = '';

  // Go through each manual group
  Object.entries(groupMap).forEach(([groupName, config]) => {
    const { positions, color } = config;

    const column = document.createElement('div');
    column.className = 'column';

    const header = document.createElement('h3');
    header.style.backgroundColor = color;
    header.textContent = groupName;
    column.appendChild(header);

    // Select all shifts that belong to this group either by:
    // - Matching a positionName, or
    // - Having a DESCRIPTION that matches the group name
    // Still a WIP
    const groupShifts = shifts.filter(shift => {
      const normalizedDescription = (shift.DESCRIPTION || '').toLowerCase();
      const normalizedGroup = groupName.toLowerCase();

      const isCaptainMatch = normalizedDescription.includes(normalizedGroup);
      const isPositionMatch = positions.includes(shift.positionName);

      return isCaptainMatch || isPositionMatch;
    });

    // Group by position name
    const positionGroups = {};
    groupShifts.forEach(shift => {
      const pos = shift.positionName;
      if (!positionGroups[pos]) {
        positionGroups[pos] = [];
      }
      positionGroups[pos].push(shift);
    });

    // Sort and display
    Object.entries(positionGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([positionName, shiftList]) => {
        const subHeader = document.createElement('h4');
        subHeader.textContent = positionName.replace(/^300-/, '');
        column.appendChild(subHeader);

        // Create position section container for drag/drop
        const positionSection = document.createElement('div');
        positionSection.className = 'position-section';
        positionSection.dataset.positionName = positionName;
        
        // Add drop event listeners
        positionSection.addEventListener('dragover', handleDragOver);
        positionSection.addEventListener('drop', handleDrop);
        positionSection.addEventListener('dragenter', handleDragEnter);
        positionSection.addEventListener('dragleave', handleDragLeave);

        shiftList.forEach(shift => {
          const div = document.createElement('div');
          div.className = 'shift';
          div.draggable = true;
          div.dataset.shiftId = `${shift.firstName}-${shift.lastName}-${shift.startTime}`;
          
          // Store original shift data for tooltip
          div.dataset.shiftData = JSON.stringify({
            firstName: shift.firstName,
            lastName: shift.lastName,
            originalPosition: shift.positionName,
            categoryName: shift.categoryName,
            startTime: shift.startTime,
            endTime: shift.endTime,
            shiftDisc: shift.shiftDisc
          });
          
          if (shift.categoryName === 'Called OFF' || shift.categoryName === 'Called Out' || shift.categoryName === 'Excused Absence' || shift.categoryName === 'No Call No Show"') {
            div.classList.add('called-off');
          }

          div.innerHTML = `
            <div class="shift-name">${shift.firstName} ${shift.lastName}</div>
            <div class="shift-time">${shift.shiftDisc}</div>
            <div class="shift-time">${shift.startTime} - ${shift.endTime}</div>
          `;
          
          // Add drag event listeners
          div.addEventListener('dragstart', handleDragStart);
          div.addEventListener('dragend', handleDragEnd);
          
          // Add tooltip event listeners
          div.addEventListener('mouseenter', showTooltip);
          div.addEventListener('mouseleave', hideTooltip);
          div.addEventListener('mousemove', moveTooltip);
          
          positionSection.appendChild(div);
        });
        
        column.appendChild(positionSection);
      });

    board.appendChild(column);
  });
}

async function refreshShifts() {
  const refreshBtn = document.getElementById('refreshBtn');
  const loadingIndicator = document.getElementById('loadingIndicator');
  
  // Disable button and show loading
  refreshBtn.disabled = true;
  refreshBtn.textContent = 'Refreshing...';
  loadingIndicator.style.display = 'block';
  
  try {
    await loadShifts();
  } catch (error) {
    console.error('Error refreshing shifts:', error);
    alert('Failed to refresh shifts. Please try again.');
  } finally {
    // Re-enable button and hide loading
    refreshBtn.disabled = false;
    refreshBtn.textContent = '🔄 Refresh';
    loadingIndicator.style.display = 'none';
  }
}

// Drag and Drop functionality
let draggedElement = null;

function handleDragStart(e) {
  draggedElement = e.target;
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', e.target.outerHTML);
  
  // Hide tooltip during drag
  hideTooltip();
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  draggedElement = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
  e.preventDefault();
  const positionSection = e.target.closest('.position-section');
  if (positionSection) {
    positionSection.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  const positionSection = e.target.closest('.position-section');
  if (positionSection) {
    // Only remove drag-over if we're actually leaving the position section
    const rect = positionSection.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      positionSection.classList.remove('drag-over');
    }
  }
}

function handleDrop(e) {
  e.preventDefault();
  
  // Find the closest position section (works for the section itself or any child element)
  const positionSection = e.target.closest('.position-section');
  
  if (positionSection && draggedElement) {
    positionSection.classList.remove('drag-over');
    
    // Don't move if dropping in the same position section
    if (draggedElement.parentElement === positionSection) {
      return;
    }
    
    // Get original position data
    const shiftData = JSON.parse(draggedElement.dataset.shiftData);
    const newPosition = positionSection.dataset.positionName;
    
    // Check if this is a move to a different position or back to original
    if (shiftData.originalPosition !== newPosition) {
      // Add the moved-shift class to highlight it in blue
      draggedElement.classList.add('moved-shift');
    } else {
      // Remove the moved-shift class if returned to original position
      draggedElement.classList.remove('moved-shift');
    }
    
    // Move the element to the new position section
    positionSection.appendChild(draggedElement);
    
    // Show success feedback
    showMoveNotification(draggedElement, newPosition, shiftData.originalPosition);
  }
}

function showMoveNotification(element, newPosition, originalPosition) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4caf50;
    color: white;
    padding: 10px 15px;
    border-radius: 4px;
    z-index: 1001;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  `;
  
  const shiftName = element.querySelector('.shift-name').textContent;
  const cleanPosition = newPosition.replace(/^300-/, '');
  
  // Different message if returning to original position
  if (newPosition === originalPosition) {
    notification.textContent = `Returned ${shiftName} to original position: ${cleanPosition}`;
    notification.style.background = '#2196f3'; // Blue for "returned"
  } else {
    notification.textContent = `Moved ${shiftName} to ${cleanPosition}`;
  }
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Tooltip functionality
let tooltip = null;

function createTooltip() {
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    document.body.appendChild(tooltip);
  }
  return tooltip;
}

function showTooltip(e) {
  // Don't show tooltip if we're currently dragging
  if (draggedElement) return;
  
  const shiftElement = e.target.closest('.shift');
  if (!shiftElement) return;
  
  const shiftData = JSON.parse(shiftElement.dataset.shiftData);
  const tooltip = createTooltip();
  
  // Get current position (may be different from original if moved)
  const currentPositionSection = shiftElement.closest('.position-section');
  const currentPosition = currentPositionSection ? currentPositionSection.dataset.positionName : shiftData.originalPosition;
  
  // Determine if position was changed
  const positionChanged = currentPosition !== shiftData.originalPosition;
  const positionDisplay = positionChanged ? 
    `${currentPosition.replace(/^300-/, '')} (moved from ${shiftData.originalPosition.replace(/^300-/, '')})` : 
    currentPosition.replace(/^300-/, '');
  
  tooltip.innerHTML = `
    <div class="tooltip-header">${shiftData.firstName} ${shiftData.lastName}</div>
    <div class="tooltip-row">
      <span class="tooltip-label">Position:</span>
      <span class="tooltip-value">${positionDisplay}</span>
    </div>
    <div class="tooltip-row">
      <span class="tooltip-label">Time:</span>
      <span class="tooltip-value">${shiftData.startTime} - ${shiftData.endTime}</span>
    </div>
    <div class="tooltip-row">
      <span class="tooltip-label">Description:</span>
      <span class="tooltip-value">${shiftData.shiftDisc}</span>
    </div>
    <div class="tooltip-row">
      <span class="tooltip-label">Status:</span>
      <span class="tooltip-value">${shiftData.categoryName}</span>
    </div>
    ${shiftData.originalPosition !== currentPosition ? 
      `<div class="tooltip-row">
        <span class="tooltip-label">Original Position:</span>
        <span class="tooltip-value">${shiftData.originalPosition.replace(/^300-/, '')}</span>
      </div>` : ''
    }
  `;
  
  // Position tooltip near mouse
  moveTooltip(e);
  
  // Show tooltip with animation
  setTimeout(() => tooltip.classList.add('show'), 10);
}

function hideTooltip() {
  if (tooltip) {
    tooltip.classList.remove('show');
  }
}

function moveTooltip(e) {
  if (!tooltip) return;
  
  const tooltipRect = tooltip.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let x = e.clientX + 15;
  let y = e.clientY - 10;
  
  // Adjust if tooltip would go off screen
  if (x + tooltipRect.width > viewportWidth) {
    x = e.clientX - tooltipRect.width - 15;
  }
  
  if (y + tooltipRect.height > viewportHeight) {
    y = e.clientY - tooltipRect.height - 10;
  }
  
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
}

// Initial load
loadShifts();
