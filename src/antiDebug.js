// Anti-debugging and DevTools detection
/* eslint-disable */
(function() {

  // Detect DevTools by checking window size difference
  const devtoolsDetector = {
    isOpen: false,
    orientation: undefined,
  };

  const threshold = 160;

  const emitEvent = (isOpen, orientation) => {
    if (devtoolsDetector.isOpen !== isOpen || devtoolsDetector.orientation !== orientation) {
      devtoolsDetector.isOpen = isOpen;
      devtoolsDetector.orientation = orientation;
      
      if (isOpen) {
        // Clear the page content when DevTools is detected
        document.body.innerHTML = '<h1 style="text-align:center;margin-top:50px;">Zugriff verweigert / Access Denied</h1>';
        
        // Redirect to blank page
        setTimeout(() => {
          window.location.href = 'about:blank';
        }, 1000);
      }
    }
  };

  const checkDevTools = () => {
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    const orientation = widthThreshold ? 'vertical' : 'horizontal';

    if (!(heightThreshold && widthThreshold) && ((window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) || widthThreshold || heightThreshold)) {
      emitEvent(true, orientation);
    } else {
      emitEvent(false, undefined);
    }
  };

  // Check periodically
  setInterval(checkDevTools, 500);

  // Detect debugger
  setInterval(() => {
    const startTime = performance.now();
    debugger;
    const endTime = performance.now();
    if (endTime - startTime > 100) {
      document.body.innerHTML = '<h1 style="text-align:center;margin-top:50px;">Debug-Modus erkannt / Debug Mode Detected</h1>';
      window.location.href = 'about:blank';
    }
  }, 1000);

  // Disable console
  if (typeof console !== 'undefined') {
    const noop = function() {};
    ['log', 'debug', 'info', 'warn', 'error', 'dir', 'trace', 'assert', 'clear'].forEach(method => {
      if (console[method]) {
        console[method] = noop;
      }
    });
  }

  // Prevent viewing source
  document.addEventListener('keydown', (e) => {
    // Ctrl+U, Ctrl+S (save), Ctrl+P (print)
    if ((e.ctrlKey && (e.keyCode === 85 || e.keyCode === 83 || e.keyCode === 80)) ||
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
        e.keyCode === 123 ||
        (e.ctrlKey && e.shiftKey && [67, 73, 74].includes(e.keyCode))) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // Override toString to detect DevTools panel inspection
  const detectToString = () => {
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: function() {
        devtoolsDetector.isOpen = true;
        emitEvent(true, null);
        throw new Error('DevTools detected');
      }
    });
    console.log(element);
  };

  // Prevent text selection and copying
  document.addEventListener('selectstart', (e) => {
    e.preventDefault();
    return false;
  });

  document.addEventListener('copy', (e) => {
    e.preventDefault();
    return false;
  });

  // Disable drag and drop
  document.addEventListener('dragstart', (e) => {
    e.preventDefault();
    return false;
  });

  // Check for DevTools using console logging
  setInterval(detectToString, 2000);

  // Clear site data if DevTools detected
  if (devtoolsDetector.isOpen) {
    localStorage.clear();
    sessionStorage.clear();
  }
})();

const antiDebug = {};
export default antiDebug;

