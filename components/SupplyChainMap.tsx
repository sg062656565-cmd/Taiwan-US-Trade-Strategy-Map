
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Industry } from '../types';
import { SUPPLY_CHAIN_SHIFTS } from '../constants';

interface SupplyChainMapProps {
  industry: Industry;
  active: boolean;
  data: any[];
}

const SupplyChainMap: React.FC<SupplyChainMapProps> = ({ industry, active, data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredShift, setHoveredShift] = useState<any>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!active || !svgRef.current) return;

    const width = 800;
    const height = 600;
    // Fixed projection to show Asia to Americas
    const projection = d3.geoMercator()
      .center([10, 20])
      .scale(140)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json').then((worldData: any) => {
      const countries = (window as any).topojson.feature(worldData, worldData.objects.countries);
      
      // const g = svg.append('g'); // Moved up

      // Map background
      g.selectAll('path')
        .data(countries.features)
        .enter()
        .append('path')
        .attr('d', path as any)
        .attr('fill', (d: any) => {
          const name = d.properties.name;
          if (name === 'China') return '#7f1d1d';
          if (['Vietnam', 'Mexico', 'India', 'Thailand', 'Indonesia'].includes(name)) return '#064e3b';
          if (name === 'Taiwan') return '#10b981';
          if (name === 'United States of America') return '#1e40af';
          return '#0f1423';
        })
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 0.5);

      const defs = svg.append('defs');
      defs.append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#4ade80');

      const migrationGroup = g.append('g');

      migrationGroup.selectAll('.migration')
        .data(SUPPLY_CHAIN_SHIFTS)
        .enter()
        .append('path')
        .attr('class', 'migration')
        .attr('d', (d: any) => {
          const p1 = projection(d.latLngFrom as any);
          const p2 = projection(d.latLngTo as any);
          if (!p1 || !p2) return '';
          
          // Handle wrapping for long distance lines if necessary, 
          // but for Mercator Asia to US is usually fine if centered correctly.
          const dx = p2[0] - p1[0];
          const dy = p2[1] - p1[1];
          const dr = Math.sqrt(dx * dx + dy * dy);
          return `M${p1[0]},${p1[1]}A${dr},${dr} 0 0,1 ${p2[0]},${p2[1]}`;
        })
        .attr('fill', 'none')
        .attr('stroke', '#4ade80')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.6)
        .attr('stroke-dasharray', '1000')
        .attr('stroke-dashoffset', '1000')
        .attr('marker-end', 'url(#arrow)')
        .on('mouseenter', (event, d) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr('stroke-width', 5)
            .attr('stroke-opacity', 1);
          setHoveredShift(d);
        })
        .on('mousemove', (event) => {
          setMousePos({ x: event.clientX, y: event.clientY });
        })
        .on('mouseleave', (event) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.6);
          setHoveredShift(null);
        })
        .transition()
        .duration(2000)
        .attr('stroke-dashoffset', '0');
    });

  }, [active, industry]);

  return (
    <div className="w-full h-full relative cursor-move">
      <svg ref={svgRef} viewBox="0 0 800 600" className="w-full h-full" />
      
      {/* Floating Popup */}
      {hoveredShift && (
        <div 
          className="fixed pointer-events-none z-[100] glass-panel p-4 rounded-2xl border border-green-500/30 shadow-2xl max-w-sm animate-in fade-in zoom-in duration-200"
          style={{ left: mousePos.x + 20, top: mousePos.y + 20 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h4 className="text-lg font-bold text-white">{hoveredShift.company}</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1">
              <span>{hoveredShift.from}</span>
              <span className="text-green-500">→</span>
              <span>{hoveredShift.to}</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">{hoveredShift.move}</p>
            <div className="bg-green-500/10 p-3 rounded-xl border border-green-500/20">
              <div className="text-[10px] font-bold text-green-400 uppercase mb-1">戰略情報 (2026 報告)</div>
              <p className="text-xs text-green-100 leading-relaxed italic">{hoveredShift.report}</p>
            </div>
            <div className="text-[10px] text-slate-500 font-bold">核心重點：{hoveredShift.focus}</div>
          </div>
        </div>
      )}

      {/* Remove the absolute title box as requested to clear space */}
    </div>
  );
};

export default SupplyChainMap;
