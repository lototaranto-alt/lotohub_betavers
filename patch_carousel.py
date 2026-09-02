import re

with open('components/OnboardingCarousel.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("3300); // 3.3 secondi a slide", "3600); // 3.6 secondi a slide")

with open('components/OnboardingCarousel.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Carousel timing updated")
