import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import type { ExoplanetSummary } from '../types/exoplanet';

const METHOD_COLORS: Record<string, string> = {
  Transit: '#b7c4ff',
  'Radial Velocity': '#38debb',
  'Direct Imaging': '#f3bf26',
  Microlensing: '#ff8fa3',
  Astrometry: '#dfe3ff',
  'Transit Timing Variations': '#a0c4ff',
  'Orbital Brightness Modulation': '#c3f5ff',
};

const DEFAULT_COLOR = '#8d90a2';

interface Props {
  data: ExoplanetSummary[];
  activeMethods: Set<string>;
  onHover: (plName: string | null) => void;
}

const MARGIN = { top: 20, right: 20, bottom: 50, left: 60 };

export function ExoplanetChart({ data, activeMethods, onHover }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const quadtreeRef = useRef<d3.Quadtree<ExoplanetSummary> | null>(null);
  const xScaleRef = useRef<d3.ScaleLogarithmic<number, number> | null>(null);
  const yScaleRef = useRef<d3.ScaleLinear<number, number> | null>(null);

  const filtered = data.filter(
    (d) =>
      d.plOrbper != null &&
      d.plOrbper > 0 &&
      d.plRade != null &&
      d.plRade > 0 &&
      (activeMethods.size === 0 || activeMethods.has(d.discoverymethod ?? ''))
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!canvas || !svg || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));

    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = height - MARGIN.top - MARGIN.bottom;

    const xScale = d3
      .scaleLog()
      .domain([0.1, d3.max(filtered, (d) => d.plOrbper!) ?? 1e5])
      .range([0, innerW])
      .clamp(true);

    const yScale = d3
      .scaleLinear()
      .domain([0, (d3.max(filtered, (d) => d.plRade!) ?? 30) * 1.1])
      .range([innerH, 0]);

    xScaleRef.current = xScale;
    yScaleRef.current = yScale;

    quadtreeRef.current = d3
      .quadtree<ExoplanetSummary>()
      .x((d) => xScale(d.plOrbper!) + MARGIN.left)
      .y((d) => yScale(d.plRade!) + MARGIN.top)
      .addAll(filtered);

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, width, height);

    for (const planet of filtered) {
      const cx = xScale(planet.plOrbper!) + MARGIN.left;
      const cy = yScale(planet.plRade!) + MARGIN.top;
      const color = METHOD_COLORS[planet.discoverymethod ?? ''] ?? DEFAULT_COLOR;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = color + 'cc';
      ctx.fill();
    }

    const svgD3 = d3.select(svg);
    svgD3.selectAll('*').remove();
    const g = svgD3.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6, '~s')
          .tickSize(-innerH)
      )
      .call((ax) => {
        ax.select('.domain').remove();
        ax.selectAll('.tick line').attr('stroke', '#434656').attr('stroke-dasharray', '3,3');
        ax.selectAll('.tick text').attr('fill', '#c3c5d9').attr('font-size', 11);
      });

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(6).tickSize(-innerW))
      .call((ax) => {
        ax.select('.domain').remove();
        ax.selectAll('.tick line').attr('stroke', '#434656').attr('stroke-dasharray', '3,3');
        ax.selectAll('.tick text').attr('fill', '#c3c5d9').attr('font-size', 11);
      });

    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 42)
      .attr('fill', '#8d90a2')
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .text('Orbital Period (days)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -46)
      .attr('fill', '#8d90a2')
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .text('Planet Radius (Earth Radii)');
  }, [filtered]);

  useEffect(() => {
    draw();
    const observer = new ResizeObserver(draw);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [draw]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !quadtreeRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const nearest = quadtreeRef.current.find(mx, my, 12);
      onHover(nearest?.plName ?? null);
    },
    [onHover]
  );

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => onHover(null)}
      />
      <svg ref={svgRef} className="absolute inset-0 pointer-events-none" />
    </div>
  );
}
