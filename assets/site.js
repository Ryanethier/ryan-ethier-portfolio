/* Ryan Ethier portfolio — motion, scroll reveal, and generative background.
   All effects degrade gracefully and honour prefers-reduced-motion. */
(function () {
  "use strict";

  var reduce = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  /* -------------------------------------------------- typed hero command */
  var typed = document.getElementById("typed");
  if (typed) {
    var text = typed.getAttribute("data-text") || "whoami --full";
    if (reduce) {
      typed.textContent = text;
    } else {
      typed.textContent = "";
      var ti = 0;
      (function step() {
        typed.textContent = text.slice(0, ti++);
        if (ti <= text.length) setTimeout(step, 65);
      })();
    }
  }

  /* -------------------------------------------------- scroll reveal */
  var writeup = document.querySelector("article.writeup");
  if (writeup) {
    var kids = writeup.querySelectorAll("h2, p, pre, ul, ol");
    for (var k = 0; k < kids.length; k++) {
      if (kids[k].parentNode === writeup) kids[k].classList.add("reveal");
    }
  }

  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      for (var r = 0; r < revealEls.length; r++) revealEls[r].classList.add("in");
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.classList.add("in");
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      for (var o = 0; o < revealEls.length; o++) io.observe(revealEls[o]);
    }
  }

  /* -------------------------------------------------- constellation canvas */
  var canvas = document.getElementById("constellation");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var nodes = [];
  var mouse = { x: -9999, y: -9999 };
  var W = 0, H = 0, raf = null;

  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function build() {
    var count = Math.round((W * H) / 18000);
    count = Math.max(36, Math.min(110, count));
    nodes = [];
    for (var i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < -20) a.x = W + 20;
      else if (a.x > W + 20) a.x = -20;
      if (a.y < -20) a.y = H + 20;
      else if (a.y > H + 20) a.y = -20;

      var mdx = mouse.x - a.x;
      var mdy = mouse.y - a.y;
      var md = Math.sqrt(mdx * mdx + mdy * mdy);
      if (md < 150 && md > 0.01) {
        a.x += (mdx / md) * 0.35;
        a.y += (mdy / md) * 0.35;
      }

      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 128) {
          ctx.strokeStyle =
            "rgba(77,163,255," + (0.13 * (1 - d / 128)).toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      ctx.fillStyle = "rgba(150,190,235,0.5)";
      ctx.beginPath();
      ctx.arc(a.x, a.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop() {
    draw();
    raf = requestAnimationFrame(loop);
  }

  size();
  build();
  if (reduce) {
    draw();
  } else {
    loop();
  }

  window.addEventListener("resize", function () {
    size();
    build();
    if (reduce) draw();
  });
  window.addEventListener(
    "mousemove",
    function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    },
    { passive: true }
  );
  window.addEventListener("mouseout", function () {
    mouse.x = -9999;
    mouse.y = -9999;
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    } else if (!reduce && !raf) {
      loop();
    }
  });
})();
