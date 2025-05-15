document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo particles.js
    particlesJS('particles-js', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: "#00f0ff" },
            shape: { type: "circle" },
            opacity: { value: 0.5, random: true },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: "#00f0ff", opacity: 0.2, width: 1 },
            move: { enable: true, speed: 1, direction: "none", random: true, straight: false }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: { enable: true, mode: "grab" },
                onclick: { enable: true, mode: "push" },
                resize: true
            }
        }
    });

    // Hiệu ứng hover cho card
    const cards = document.querySelectorAll('.neon-card');
    
    cards.forEach(card => {
        // Hiệu ứng parallax
        card.addEventListener('mousemove', function(e) {
            const xAxis = (window.innerWidth / 2 - e.pageX) / 20;
            const yAxis = (window.innerHeight / 2 - e.pageY) / 20;
            this.style.transform = `translateY(-10px) rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) rotateY(0) rotateX(0)';
        });
    });
});