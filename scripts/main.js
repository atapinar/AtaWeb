// TODO: Cursor animations

// ISSUES: State animasyonlari calismiyor

const CONFIG = {
      SCROLL_DURATION: 1000,
      EASE: 0.1,
      SCROLL_COOLDOWN: 500,
      MIN_SCROLL_DISTANCE: 50
    };
    
    let state = {
      currentPageIndex: 0,
      isScrolling: false,
      scrollTimeout: null,
      lastScrollTime: 0,
      windowHeight: window.innerHeight,
      hasPassedFirstPage: false
    };
    
    const container = document.querySelector('.scroll-container');
    const pages = document.querySelectorAll('.page');
    const progressBar = document.querySelector('.progress');
    const navDots = document.querySelectorAll('.nav-item');
    
    function init() {
      setupHeight();
      bindEvents();
      updateActiveStates(0);
      updateProgressBar(0);
      initProjectPreviews();
      
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        document.body.style.overflow = '';
      }, 1500);
      
      initTimeline();
    }
    
    function setupHeight() {
      state.windowHeight = window.innerHeight;
      document.body.style.height = `${state.windowHeight * pages.length}px`;
    }
    
    function smoothScrollTo(targetPosition) {
      const start = window.scrollY;
      const distance = targetPosition - start;
      const startTime = performance.now();
    
      function easeInOutCubic(t) {
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      }
    
      function animate(currentTime) {
        if (!state.isScrolling) return;
    
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / CONFIG.SCROLL_DURATION, 1);
        
        const easedProgress = easeInOutCubic(progress);
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
    
      const scrollDirection = event.deltaY > 0 ? 1 : -1;
      
      let targetPage = state.currentPageIndex + scrollDirection;
      
      if (state.currentPageIndex === pages.length - 1 && scrollDirection === 1) {
        targetPage = 0;
        state.hasPassedFirstPage = false; // yanlış bir çözüm ama çalışıyor
      } else {
        targetPage = Math.max(0, Math.min(targetPage, pages.length - 1));
        
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
      
      window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
      }, { passive: false });
    
      window.addEventListener('touchmove', (e) => {
        if (state.isScrolling) {
          e.preventDefault();
          return;
        }
    
        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY;
    
        if (Math.abs(deltaY) > CONFIG.MIN_SCROLL_DISTANCE) {
          handleScroll({
            preventDefault: () => {},
            deltaY: deltaY
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