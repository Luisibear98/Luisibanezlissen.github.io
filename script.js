AOS.init({ duration: 1000 });

// Toggle sidebar
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('active');
});

// Close sidebar on click outside
document.addEventListener('click', (e) => {
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburger');
  
  if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
	sidebar.classList.remove('active');
  }
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
	e.preventDefault();
	document.querySelector(this.getAttribute('href')).scrollIntoView({
	  behavior: 'smooth'
	});
  });
});