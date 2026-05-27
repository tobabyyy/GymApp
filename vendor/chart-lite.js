(function () {
  'use strict';
  if (window.Chart) return;
  class ChartLite {
    constructor(canvas, config) {
      this.canvas = canvas;
      this.config = config || {};
      this.version = ChartLite.version;
      this.draw();
    }
    destroy() {
      if (!this.canvas) return;
      const ctx = this.canvas.getContext && this.canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, this.canvas.width || 0, this.canvas.height || 0);
    }
    draw() {
      const c = this.canvas;
      const ctx = c && c.getContext && c.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = c.getBoundingClientRect();
      const w = Math.max(280, Math.round((rect.width || 320) * dpr));
      const h = Math.max(150, Math.round((rect.height || 180) * dpr));
      c.width = w; c.height = h;
      const data = (((this.config || {}).data || {}).datasets || [])[0]?.data || [];
      const color = (((this.config || {}).data || {}).datasets || [])[0]?.borderColor || '#ff3b30';
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,.04)';
      ctx.fillRect(0, 0, w, h);
      if (!data.length) return;
      const vals = data.map(v => Number(v) || 0);
      const min = Math.min(...vals, 0);
      const max = Math.max(...vals, 1);
      const pad = 24 * dpr;
      const span = Math.max(1, max - min);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3 * dpr;
      ctx.beginPath();
      vals.forEach((v, i) => {
        const x = pad + (w - pad * 2) * (i / Math.max(vals.length - 1, 1));
        const y = h - pad - ((v - min) / span) * (h - pad * 2);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.fillStyle = color;
      vals.forEach((v, i) => {
        const x = pad + (w - pad * 2) * (i / Math.max(vals.length - 1, 1));
        const y = h - pad - ((v - min) / span) * (h - pad * 2);
        ctx.beginPath(); ctx.arc(x, y, 4 * dpr, 0, Math.PI * 2); ctx.fill();
      });
    }
  }
  ChartLite.version = 'local-lite';
  window.Chart = ChartLite;
}());
