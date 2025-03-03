//Image slider functionality

document.addEventListener('DOMContentLoaded', function() {
    try {
        initializeSlider();
        initializePasswordToggle();
    } catch (error) {
        console.error('An error occurred:', error);
    }
});

function initializeSlider() {
    const images = document.querySelectorAll(".grid-cols-1 img");
    const texts = document.querySelectorAll(".text-group h2");
    const bullets = document.querySelectorAll(".bullets span");
    let currentIndex = 0;
    const intervalTime = 3000;
    let intervalId;

    function moveSlider() {
        if (!images.length || !texts.length || !bullets.length) {
            console.warn('Slider elements not found');
            return;
        }

        images.forEach((img, idx) => {
            img.classList.remove('opacity-100', 'translate-y-0', 'scale-100', 'rotate-0');
            if (idx === 0) {
                img.classList.add('opacity-0', '-translate-y-[50px]');
            } else if (idx === 1) {
                img.classList.add('opacity-0', 'scale-x-[0.4]', 'scale-y-[0.5]');
            } else if (idx === 2) {
                img.classList.add('opacity-0', 'scale-[0.3]', '-rotate-20');
            }
        });

        texts.forEach(text => {
            text.classList.remove('opacity-100');
            text.classList.add('opacity-0');
        });

        bullets.forEach(bullet => {
            bullet.classList.remove('w-4', 'bg-[#151111]');
            bullet.classList.add('w-1', 'bg-gray-400');
        });

        const currentImage = images[currentIndex];
        const currentText = texts[currentIndex];
        const currentBullet = bullets[currentIndex];

        currentImage.classList.remove('opacity-0', '-translate-y-[50px]', 'scale-x-[0.4]', 'scale-y-[0.5]', 'scale-[0.3]', '-rotate-20');
        currentImage.classList.add('opacity-100', 'translate-y-0', 'scale-100', 'rotate-0');

        currentText.classList.remove('opacity-0');
        currentText.classList.add('opacity-100');

        currentBullet.classList.remove('w-1', 'bg-gray-400');
        currentBullet.classList.add('w-4', 'bg-[#151111]');

        currentIndex = (currentIndex + 1) % images.length;
    }
    bullets.forEach((bullet, index) => {
        bullet.addEventListener('click', () => {
            clearInterval(intervalId);
            currentIndex = index;
            moveSlider();
            intervalId = setInterval(moveSlider, intervalTime);
        });
    });

    if (images.length && texts.length && bullets.length) {
        moveSlider();
        intervalId = setInterval(moveSlider, intervalTime);
    }
}

