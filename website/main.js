import './style.css';

// Intersection Observer for scroll reveal animations
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
  const revealElements = document.querySelectorAll('.reveal');
  revealElements.forEach(el => observer.observe(el));

  // --- IMMERSIVE INTERACTIVITY ---

  // 1. Custom Glowing Cursor
  const cursor = document.querySelector('.custom-cursor');
  const cursorGlow = document.querySelector('.custom-cursor-glow');
  
  document.addEventListener('mousemove', (e) => {
    cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    // Slight delay on glow for a trail effect
    setTimeout(() => {
      cursorGlow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    }, 50);
  });

  // Grow cursor on interactive elements
  const interactives = document.querySelectorAll('a, button, .neo-card');
  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('active'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
  });

  // 2. Mouse Parallax for Orbs
  const orbs = document.querySelectorAll('.glow-orb');
  document.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    
    orbs[0].style.transform = `translate(${x * 100}px, ${y * 100}px)`;
    orbs[1].style.transform = `translate(${x * -80}px, ${y * -80}px)`;
  });

  // 3. 3D Tilt Effect for Neo Cards
  const cards = document.querySelectorAll('.neo-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
  });

  // 4. Typing Animation for Mockup
  const chatBubble = document.querySelector('.ai-chat-bubble');
  const textToType = "How can I assist you with this code today?";
  chatBubble.textContent = "";
  
  let i = 0;
  function typeWriter() {
    if (i < textToType.length) {
      chatBubble.textContent += textToType.charAt(i);
      i++;
      setTimeout(typeWriter, 50);
    } else {
      chatBubble.classList.add('done-typing');
    }
  }
  
  // Start typing when mockup comes into view
  const mockupObserver = new IntersectionObserver((entries) => {
    if(entries[0].isIntersecting) {
      setTimeout(typeWriter, 800);
      mockupObserver.disconnect();
    }
  });
  mockupObserver.observe(document.querySelector('.mockup-container'));
});
