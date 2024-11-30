// TODO: Cursor animations

// ISSUES: State animasyonlari calismiyor

const CONFIG = {
      SCROLL_DURATION: 400,
      EASE: 0.1,
      SCROLL_COOLDOWN: 200,
      MIN_SCROLL_DISTANCE: 50
    };
    
    let state = {
      currentPageIndex: 0,
      isScrolling: false,
      scrollTimeout: null,
      lastScrollTime: 0,
      windowHeight: window.innerHeight,
      hasPassedFirstPage: false,
      theme: localStorage.getItem('theme') || 'light'
    };
    
    const container = document.querySelector('.scroll-container');
    const pages = document.querySelectorAll('.page');
    const progressBar = document.querySelector('.progress');
    const navDots = document.querySelectorAll('.nav-item');
    
    const themeInit = () => {
      // Create and append the theme switcher button
      const switcher = document.createElement('button');
      switcher.className = 'theme-switcher';
      switcher.innerHTML = `
        <svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
        </svg>
        <svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" />
        </svg>
      `;
      document.body.appendChild(switcher);

      // Set initial theme
      document.documentElement.setAttribute('data-theme', state.theme);
      updateThemeIcon(state.theme);

      // Add click event listener
      switcher.addEventListener('click', toggleTheme);
    };

    function toggleTheme() {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', state.theme);
      localStorage.setItem('theme', state.theme);
      updateThemeIcon(state.theme);
    }

    function updateThemeIcon(theme) {
      const sunIcon = document.querySelector('.sun-icon');
      const moonIcon = document.querySelector('.moon-icon');
      
      if (theme === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
      } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
      }
    }
    
    function init() {
      setupHeight();
      bindEvents();
      updateActiveStates(0);
      updateProgressBar(0);
      initProjectPreviews();
      themeInit();
      
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        document.body.style.overflow = '';
      }, 1500);
      
      initTimeline();
    }
    
    function setupHeight() {
      if (window.innerWidth <= 768) {
        state.windowHeight = window.innerHeight;
        document.body.style.height = `${state.windowHeight * pages.length}px`;
        
        const preview = document.querySelector('.project-preview');
        if (preview) {
          preview.style.width = '200px';
          preview.style.height = '133px';
        }
      } else {
        state.windowHeight = window.innerHeight;
        document.body.style.height = `${state.windowHeight * pages.length}px`;
      }
    }
    
    function smoothScrollTo(targetPosition) {
      const start = window.scrollY;
      const distance = targetPosition - start;
      const startTime = performance.now();
    
      function easeOutQuad(t) {
        return t * (2 - t);
      }
    
      function animate(currentTime) {
        if (!state.isScrolling) return;
    
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / CONFIG.SCROLL_DURATION, 1);
        
        const easedProgress = easeOutQuad(progress);
        const currentPosition = start + (distance * easedProgress);
        
        window.scrollTo(0, currentPosition);
        container.style.transform = `translate3d(0, ${-currentPosition}px, 0)`;
        
        const currentPage = currentPosition / state.windowHeight;
        updateProgressBar(currentPage);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          state.isScrolling = false;
        }
      }
    
      requestAnimationFrame(animate);
    }
    
    function handleScroll(event) {
      event.preventDefault();
    
      const preview = document.querySelector('.project-preview');
      if (preview.classList.contains('visible')) {
        preview.classList.remove('visible');
        preview.classList.add('hiding');
        setTimeout(() => {
          preview.classList.remove('hiding');
        }, 300);
      }
    
      const now = performance.now();
      if (now - state.lastScrollTime < CONFIG.SCROLL_COOLDOWN) return;
      state.lastScrollTime = now;
    
      if (state.isScrolling) return;
    
      const scrollDirection = Math.sign(event.deltaY);
      const scrollMagnitude = Math.min(Math.abs(event.deltaY), 100);
      const normalizedDelta = scrollDirection * (scrollMagnitude / 100);
      
      let targetPage = state.currentPageIndex + normalizedDelta;
      
      if (state.currentPageIndex === pages.length - 1 && scrollDirection === 1) {
        targetPage = 0;
        state.hasPassedFirstPage = false;
      } else if (state.currentPageIndex === 0 && scrollDirection === -1) {
        targetPage = 0;
      } else {
        targetPage = Math.max(0, Math.min(Math.round(targetPage), pages.length - 1));
        
        if (state.hasPassedFirstPage && targetPage === 0) {
          targetPage = 1;
        }
      }
      
      if (targetPage !== state.currentPageIndex) {
        scrollToPage(targetPage);
      }
    }
    
    function scrollToPage(pageIndex) {
      state.isScrolling = true;
      state.currentPageIndex = pageIndex;
      
      const targetPosition = state.windowHeight * pageIndex;
      
      if (pageIndex > 0) {
        state.hasPassedFirstPage = true;
      }
      
      smoothScrollTo(targetPosition);
      updateActiveStates(pageIndex);
      updateProgressBar(pageIndex);
    }
    
    function updateActiveStates(pageIndex) {
      navDots.forEach((dot, index) => {
        if (index === pageIndex) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    
      pages.forEach((page, index) => {
        if (index === pageIndex) {
          page.classList.add('active');
          if (index === 2) {
            initTimeline();
          }
        } else {
          page.classList.remove('active');
        }
      });
    
      if (pageIndex === pages.length - 1) {
        document.querySelectorAll('.project').forEach((project, index) => {
          setTimeout(() => {
            project.classList.add('visible');
          }, index * 200);
        });
      }
    }
    
    function updateProgressBar(pageIndex) {
      const totalDistance = (pages.length - 1) * state.windowHeight;
      const currentScroll = pageIndex * state.windowHeight;
      const progress = (currentScroll / totalDistance) * 100;
      
      requestAnimationFrame(() => {
        progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
      });
    }
    
    function handleResize() {
      setupHeight();
      scrollToPage(state.currentPageIndex);
    }
    
    function bindEvents() {
      window.addEventListener('wheel', handleScroll, { passive: false });
      window.addEventListener('resize', handleResize);
      
      navDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
          if (!state.isScrolling) {
            scrollToPage(index);
          }
        });
      });
    
      let touchStartY = 0;
      let touchStartTime = 0;
      
      window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }, { passive: false });
    
      window.addEventListener('touchmove', (e) => {
        if (state.isScrolling) {
          e.preventDefault();
          return;
        }
    
        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY;
        const timeDiff = Date.now() - touchStartTime;
    
        if (Math.abs(deltaY) > CONFIG.MIN_SCROLL_DISTANCE && timeDiff < 300) {
          handleScroll({
            preventDefault: () => {},
            deltaY: deltaY * 1.5
          });
        }
      }, { passive: false });
    }
    
    function initTimeline() {
      const timelineScroll = document.querySelector('.timeline-scroll');
      const timelineEntries = document.querySelectorAll('.timeline-entry');
      let isLastEntry = false;
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            
            if (entry.target === timelineEntries[timelineEntries.length - 1]) {
              isLastEntry = true;
            }
          }
        });
      }, {
        threshold: 0.2
      });

      timelineEntries.forEach(entry => observer.observe(entry));

      timelineScroll.addEventListener('scroll', () => {
        if (isLastEntry && 
            timelineScroll.scrollHeight - timelineScroll.scrollTop <= timelineScroll.clientHeight + 50) {
          setTimeout(() => {
            scrollToPage(state.currentPageIndex + 1);
          }, 300);
        }
      });
    }
    
    function initProjectPreviews() {
      const preview = document.querySelector('.project-preview');
      const previewImages = preview.querySelectorAll('.preview-image');
      const projects = document.querySelectorAll('.project');
      
      const projectImages = {
        'hywave.net': 'https://via.placeholder.com/600x400/1a1a1a/ffffff?text=Hywave',
        'cepfal': 'https://via.placeholder.com/600x400/1a1a1a/ffffff?text=Cepfal'
      };

      let isHovering = false;
      let currentX = 0;
      let currentY = 0;
      let activeImageIndex = 0;
      const lag = 0.15;

      function updatePreviewPosition() {
        if (!isHovering) return;

        const targetX = currentX;
        const targetY = currentY;
        
        const currentLeft = parseFloat(preview.style.left) || targetX;
        const currentTop = parseFloat(preview.style.top) || targetY;
        
        const newLeft = currentLeft + (targetX - currentLeft) * lag;
        const newTop = currentTop + (targetY - currentTop) * lag;
        
        preview.style.left = `${newLeft}px`;
        preview.style.top = `${newTop}px`;

        requestAnimationFrame(updatePreviewPosition);
      }

      function switchImage(newSrc) {
        const nextImageIndex = (activeImageIndex + 1) % 2;
        const currentImage = previewImages[activeImageIndex];
        const nextImage = previewImages[nextImageIndex];

        nextImage.src = newSrc;
        
        currentImage.classList.remove('active');
        nextImage.classList.add('active');
        
        activeImageIndex = nextImageIndex;
      }

      let lastProjectName = '';
      
      projects.forEach(project => {
        const projectName = project.querySelector('span:not(.project-id):not(.arrow)').textContent.trim();
        
        project.addEventListener('mouseenter', () => {
          if (!state.isScrolling) {
            isHovering = true;
            preview.classList.remove('hiding');
            preview.classList.add('visible');
            
            if (lastProjectName !== projectName) {
              switchImage(projectImages[projectName]);
              lastProjectName = projectName;
            }
            
            updatePreviewPosition();
          }
        });

        project.addEventListener('mouseleave', () => {
          isHovering = false;
          preview.classList.remove('visible');
        });

        project.addEventListener('mousemove', (e) => {
          currentX = e.clientX;
          currentY = e.clientY;
        });
      });

      previewImages[activeImageIndex].classList.add('active');
  }
    
init();