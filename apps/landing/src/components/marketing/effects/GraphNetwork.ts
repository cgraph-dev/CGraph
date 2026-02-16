/**
 * GraphNetwork - Neural Network Particle Engine
 *
 * High-performance Canvas2D particle system for the Hero background.
 * Features:
 * - Mouse-reactive node repulsion physics
 * - Emerald-purple gradient connections
 * - 60fps animation with RAF
 * - Infinite scalability (resolution-independent)
 *
 * @since Phase 3 - Landing Page Enhancement
 */

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  color: string; // Assigned color
}

interface Connection {
  from: Node;
  to: Node;
  distance: number;
}

export interface GraphNetworkOptions {
  nodeCount?: number;
  connectionDistance?: number;
  mouseRepulsionRadius?: number;
  mouseRepulsionStrength?: number;
  nodeColor?: string;
  nodeColors?: string[]; // New: support for multiple node colors
  connectionColorStart?: string;
  connectionColorEnd?: string;
  nodeSize?: number;
  animationSpeed?: number;
}

export class GraphNetwork {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private nodes: Node[] = [];
  private connections: Connection[] = [];
  private mouse = { x: 0, y: 0, active: false };
  private animationId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // Configuration
  private nodeCount: number;
  private connectionDistance: number;
  private mouseRepulsionRadius: number;
  private mouseRepulsionStrength: number;
  private nodeColor: string;
  private nodeColors: string[];
  private connectionColorStart: string;
  private connectionColorEnd: string;
  private nodeSize: number;
  private animationSpeed: number;

  constructor(canvas: HTMLCanvasElement, options: GraphNetworkOptions = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;

    // Apply options with defaults
    this.nodeCount = options.nodeCount ?? 80;
    this.connectionDistance = options.connectionDistance ?? 150;
    this.mouseRepulsionRadius = options.mouseRepulsionRadius ?? 180;
    this.mouseRepulsionStrength = options.mouseRepulsionStrength ?? 0.5;
    this.nodeColor = options.nodeColor ?? '#10b981';
    this.nodeColors = options.nodeColors ?? [this.nodeColor];
    this.connectionColorStart = options.connectionColorStart ?? '#10b981';
    this.connectionColorEnd = options.connectionColorEnd ?? '#8b5cf6';
    this.nodeSize = options.nodeSize ?? 2.5;
    this.animationSpeed = options.animationSpeed ?? 1;

    this.init();
  }

  private init() {
    this.setupCanvas();
    this.createNodes();
    this.setupEventListeners();
    this.start();
  }

  private setupCanvas() {
    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = this.canvas.getBoundingClientRect();

      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;

      this.ctx.scale(dpr, dpr);
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;
    };

    updateSize();

    // Watch for size changes
    this.resizeObserver = new ResizeObserver(updateSize);
    this.resizeObserver.observe(this.canvas);
  }

  private createNodes() {
    this.nodes = [];
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    for (let i = 0; i < this.nodeCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;

      this.nodes.push({
        x,
        y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.2 * this.animationSpeed,
        vy: (Math.random() - 0.5) * 0.2 * this.animationSpeed,
        color:
          this.nodeColors[Math.floor(Math.random() * this.nodeColors.length)] || this.nodeColor,
      });
    }
  }

  private setupEventListeners() {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.active = true;
    };

    const handleMouseLeave = () => {
      this.mouse.active = false;
    };

    this.canvas.addEventListener('mousemove', handleMouseMove);
    this.canvas.addEventListener('mouseleave', handleMouseLeave);
  }

  private updateNodes() {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    for (const node of this.nodes) {
      // Apply gentle drift
      node.x += node.vx;
      node.y += node.vy;

      // Bounce off edges
      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;

      // Return to base position (prevents drifting too far)
      const dx = node.baseX - node.x;
      const dy = node.baseY - node.y;
      node.x += dx * 0.002;
      node.y += dy * 0.002;

      // Mouse repulsion
      if (this.mouse.active) {
        const mdx = node.x - this.mouse.x;
        const mdy = node.y - this.mouse.y;
        const distance = Math.sqrt(mdx * mdx + mdy * mdy);

        if (distance < this.mouseRepulsionRadius) {
          const force = (1 - distance / this.mouseRepulsionRadius) * this.mouseRepulsionStrength;
          node.x += (mdx / distance) * force * 5;
          node.y += (mdy / distance) * force * 5;
        }
      }
    }
  }

  private findConnections() {
    this.connections = [];

    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeI = this.nodes[i];
        const nodeJ = this.nodes[j];

        if (!nodeI || !nodeJ) continue; // Safety check

        const dx = nodeI.x - nodeJ.x;
        const dy = nodeI.y - nodeJ.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.connectionDistance) {
          this.connections.push({
            from: nodeI,
            to: nodeJ,
            distance,
          });
        }
      }
    }
  }

  private render() {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Draw connections
    for (const conn of this.connections) {
      const opacity = 1 - conn.distance / this.connectionDistance;

      // Create gradient for each connection
      const gradient = this.ctx.createLinearGradient(
        conn.from.x,
        conn.from.y,
        conn.to.x,
        conn.to.y
      );
      gradient.addColorStop(
        0,
        this.connectionColorStart +
          Math.floor(opacity * 100)
            .toString(16)
            .padStart(2, '0')
      );
      gradient.addColorStop(
        1,
        this.connectionColorEnd +
          Math.floor(opacity * 100)
            .toString(16)
            .padStart(2, '0')
      );

      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = 0.5;
      this.ctx.beginPath();
      this.ctx.moveTo(conn.from.x, conn.from.y);
      this.ctx.lineTo(conn.to.x, conn.to.y);
      this.ctx.stroke();
    }

    // Draw nodes
    for (const node of this.nodes) {
      this.ctx.fillStyle = node.color;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, this.nodeSize, 0, Math.PI * 2);
      this.ctx.fill();

      // Glow effect
      this.ctx.fillStyle = node.color + '40';
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, this.nodeSize * 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private animate = () => {
    this.updateNodes();
    this.findConnections();
    this.render();
    this.animationId = requestAnimationFrame(this.animate);
  };

  public start() {
    if (!this.animationId) {
      this.animate();
    }
  }

  public stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public destroy() {
    this.stop();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  public updateOptions(options: Partial<GraphNetworkOptions>) {
    if (options.nodeCount !== undefined) {
      this.nodeCount = options.nodeCount;
      this.createNodes();
    }
    if (options.connectionDistance !== undefined)
      this.connectionDistance = options.connectionDistance;
    if (options.mouseRepulsionRadius !== undefined)
      this.mouseRepulsionRadius = options.mouseRepulsionRadius;
    if (options.mouseRepulsionStrength !== undefined)
      this.mouseRepulsionStrength = options.mouseRepulsionStrength;
    if (options.nodeColor !== undefined) {
      this.nodeColor = options.nodeColor;
      this.nodeColors = [this.nodeColor];
    }
    if (options.nodeColors !== undefined) this.nodeColors = options.nodeColors;
    if (options.connectionColorStart !== undefined)
      this.connectionColorStart = options.connectionColorStart;
    if (options.connectionColorEnd !== undefined)
      this.connectionColorEnd = options.connectionColorEnd;
    if (options.nodeSize !== undefined) this.nodeSize = options.nodeSize;
    if (options.animationSpeed !== undefined) this.animationSpeed = options.animationSpeed;

    // Recreate nodes if colors changed significantly or if forced (simplified for performance, usually creates new engine)
    // For now, let's just update colors if count didn't change?
    // Actually, easier to just accept the new options for next createNodes call or if nodeCount changes.
    // If user wants immediate color change they should trigger createNodes.
    if (options.nodeColors !== undefined || options.nodeColor !== undefined) {
      this.createNodes();
    }
  }
}
