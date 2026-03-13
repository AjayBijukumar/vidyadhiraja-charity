// timeline.js - Modern Timeline Data for Sree Vidyadhiraja Charity

const timelineData = [
  {
    date: "January 2026",
    phase: "Phase 0: Foundation",
    title: "Land Donation Ceremony",
    description: "Two generous sisters, Smt. Kumari Sakuntala Bai and Smt. Satyabhama, donated the land for our elderly home.",
    image: "pics/cons1.jpeg"
  },
  {
    date: "February 2026",
    phase: "Phase 1: Preparation",
    title: "Site Preparation Begins",
    description: "Initial clearing and leveling of the land to prepare for construction.",
    image: "pics/cons1.jpeg"
  },
  {
    date: "March 2026",
    phase: "Phase 1: Preparation",
    title: "Foundation Layout",
    description: "Marking the foundation and planning the layout of the building.",
    image: "pics/cons2.jpeg"
  },
  {
    date: "April 2026",
    phase: "Phase 2: Foundation",
    title: "Foundation Work",
    description: "Digging and pouring the foundation for the main building.",
    image: "pics/cons2.jpeg"
  },
  {
    date: "May 2026",
    phase: "Phase 2: Foundation",
    title: "Groundbreaking Ceremony",
    description: "Official groundbreaking ceremony with foundation members and well-wishers.",
    image: "pics/cons3.jpeg"
  },
  {
    date: "June 2026",
    phase: "Phase 3: Structure",
    title: "Wall Construction Begins",
    description: "Starting the construction of walls for the main hall.",
    image: "pics/cons3.jpeg"
  },
  {
    date: "July 2026",
    phase: "Phase 3: Structure",
    title: "First Room Completed",
    description: "The first resident room structure is completed.",
    image: "pics/logo.png"
  },
  {
    date: "August 2026",
    phase: "Phase 4: Roofing",
    title: "Roof Work",
    description: "Beginning the roof construction for the main building.",
    image: "pics/cons2.jpeg"
  },
  {
    date: "September 2026",
    phase: "Phase 4: Roofing",
    title: "Temple Construction",
    description: "Starting the construction of the small temple on the premises.",
    image: "pics/cons1.jpeg"
  },
  {
    date: "October 2026",
    phase: "Phase 5: Finishing",
    title: "Interior Work",
    description: "Starting interior finishing work for resident rooms.",
    image: "pics/cons3.jpeg"
  }
];

// Function to render the timeline
function renderTimeline(containerId = 'timeline-container') {
  const container = document.getElementById(containerId);
  
  if (!container) return;
  
  if (!timelineData || timelineData.length === 0) {
    container.innerHTML = '<p class="empty-state">Timeline coming soon...</p>';
    return;
  }

  let html = '<div class="timeline-modern">';
  html += '<div class="timeline-line"></div>';
  
  timelineData.forEach((item, index) => {
    const position = index % 2 === 0 ? 'left' : 'right';
    
    html += `
      <div class="timeline-item-modern ${position}">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <div class="timeline-date">${item.date}</div>
          <div class="timeline-phase">${item.phase}</div>
          <h3 class="timeline-title">${item.title}</h3>
          <p class="timeline-description">${item.description}</p>
          ${item.image ? `<img src="${item.image}" alt="${item.title}" class="timeline-image" loading="lazy" onerror="this.style.display='none'">` : ''}
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  renderTimeline('timeline-container');
});

// Make functions globally available
window.timelineData = timelineData;
window.renderTimeline = renderTimeline;