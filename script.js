// ===== Navbar scroll effect =====
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
});

// ===== Mobile menu toggle =====
const mobileToggle = document.querySelector('.mobile-menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');

mobileToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    mobileToggle.classList.toggle('active');
});

// Close mobile menu on link click
document.querySelectorAll('.mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        mobileToggle.classList.remove('active');
    });
});

// ===== Scroll animations =====
function addScrollAnimations() {
    // Add animation classes to elements
    document.querySelectorAll('.feature-text').forEach(el => {
        el.classList.add('fade-in');
    });

    document.querySelectorAll('.feature-phone').forEach(el => {
        el.classList.add('fade-in');
    });

    document.querySelectorAll('.sprout-phone').forEach(el => {
        el.classList.add('fade-in-left');
    });

    document.querySelectorAll('.sprout-text').forEach(el => {
        el.classList.add('fade-in-right');
    });

    document.querySelectorAll('.testimonial-card').forEach((el, i) => {
        el.classList.add('fade-in');
        el.style.transitionDelay = `${i * 0.1}s`;
    });

    document.querySelectorAll('.testimonials-header').forEach(el => {
        el.classList.add('fade-in');
    });

    document.querySelectorAll('.cta-content').forEach(el => {
        el.classList.add('fade-in');
    });

    // Intersection Observer
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        },
        {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        }
    );

    document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach(el => {
        observer.observe(el);
    });
}

// ===== Smooth scroll for anchor links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== Contact Form Handling =====
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('submit-btn');
        const formStatus = document.getElementById('form-status');
        const originalText = submitBtn.textContent;

        // Loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        submitBtn.style.opacity = '0.7';
        formStatus.style.display = 'none';

        const formData = {
            name: contactForm.querySelector('#name').value.trim(),
            email: contactForm.querySelector('#email').value.trim(),
            subject: contactForm.querySelector('#subject').value.trim(),
            message: contactForm.querySelector('#message').value.trim(),
        };

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                formStatus.style.display = 'block';
                formStatus.className = 'form-status success';
                formStatus.innerHTML = `
                    <div class="status-icon">\u2713</div>
                    <h3>Message sent!</h3>
                    <p>Thanks for reaching out. We'll get back to you within 24 hours.</p>
                `;
                contactForm.style.display = 'none';
            } else {
                throw new Error(data.error || 'Something went wrong');
            }
        } catch (err) {
            formStatus.style.display = 'block';
            formStatus.className = 'form-status error';
            formStatus.innerHTML = `
                <div class="status-icon">!</div>
                <h3>Oops, something went wrong</h3>
                <p>${err.message}. Please try again or email us directly.</p>
            `;
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            submitBtn.style.opacity = '1';
        }
    });
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    addScrollAnimations();
});
