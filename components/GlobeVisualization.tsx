
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface GlobeProps {
  active: boolean;
}

const GlobeVisualization: React.FC<GlobeProps> = ({ active }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const rotationRef = useRef(0);
  const [tooltip, setTooltip] = useState<{ x: number, y: number, data: any } | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 600;
    const height = 600;
    const projection = d3.geoOrthographic()
      .scale(250)
      .translate([width / 2, height / 2])
      .rotate([0, -10]);

    const path = d3.geoPath().projection(projection);
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.append('circle')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', 250)
      .attr('fill', '#020617');

    const g = svg.append('g');

    const countryDataMap: Record<string, any> = {
      'Taiwan': { tariff: '15%', industries: ['半導體', '伺服器', '網通'], desc: '2026/2/12 簽署 ART 協定，上限 15%' },
      'China': { tariff: '35% - 45%', industries: ['電動車', '鋼鐵', '電子'], desc: '301 條款調查中，產能過剩制裁' },
      'Vietnam': { tariff: '20%', industries: ['電子代工', '家具'], desc: '面臨「洗產地」溯源調查風險' },
      'Mexico': { tariff: '10%', industries: ['汽車', '電子'], desc: '適用第 122 條款 10% 附加關稅' },
      'India': { tariff: '20%', industries: ['軟體', '製藥'], desc: '10% 附加關稅 + 基礎對等關稅' },
      'South Korea': { tariff: '15%', industries: ['記憶體', '汽車'], desc: '受惠於國安豁免，維持較低稅率' },
      'Japan': { tariff: '15%', industries: ['精密機械', '汽車'], desc: '受惠於國安豁免，維持較低稅率' },
      'United Kingdom': { tariff: '10%', industries: ['金融', '航太'], desc: '適用第 122 條款基準稅率' },
      'United States of America': { tariff: 'N/A', industries: ['設計', '軟體'], desc: '核心發起國' },
    };

    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((data: any) => {
      const countries = (window as any).topojson.feature(data, data.objects.countries);

      const countryPaths = g.selectAll('path.country')
        .data(countries.features)
        .enter()
        .append('path')
        .attr('class', 'country')
        .attr('fill', (d: any) => {
          const name = d.properties.name;
          if (name === 'United States of America') return '#3b82f6';
          const info = countryDataMap[name];
          if (info) {
            const tariffStr = info.tariff;
            if (tariffStr === 'N/A') return '#3b82f6';
            const rate = parseFloat(tariffStr);
            if (rate >= 35) return '#ef4444';
            if (rate >= 20) return '#f59e0b';
            if (rate >= 10) return '#22c55e';
          }
          return '#1e293b';
        })
        .attr('stroke', '#334155')
        .attr('stroke-width', 0.5)
        .on('mousemove', (event, d: any) => {
          const name = d.properties.name;
          const info = countryDataMap[name] || { tariff: '10%-25%', industries: ['各類消費品'], desc: '一般關稅區' };
          setTooltip({
            x: event.clientX,
            y: event.clientY,
            data: { name, ...info }
          });
        })
        .on('mouseleave', () => setTooltip(null));

      countryPaths.attr('d', path as any);

      // Add drag behavior
      const drag = d3.drag<SVGSVGElement, unknown>()
        .on('start', () => svg.style('cursor', 'grabbing'))
        .on('drag', (event) => {
          const rotate = projection.rotate();
          const k = 75 / projection.scale();
          projection.rotate([
            rotate[0] + event.dx * k,
            rotate[1] - event.dy * k
          ]);
          countryPaths.attr('d', path as any);
        })
        .on('end', () => svg.style('cursor', 'grab'));

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([100, 1000])
        .on('zoom', (event) => {
          projection.scale(event.transform.k);
          countryPaths.attr('d', path as any);
        });

      svg.style('cursor', 'grab')
        .call(drag as any)
        .call(zoom as any)
        .call(zoom.transform, d3.zoomIdentity.scale(250));
    });

  }, [active]);

  return (
    <div className="flex justify-center items-center w-full h-full relative overflow-hidden">
      <svg
        ref={svgRef}
        viewBox="0 0 600 600"
        className="w-[80%] h-auto max-w-[600px] transition-opacity duration-1000"
        style={{ opacity: active ? 1 : 0 }}
      />
      {tooltip && (
        <div 
          className="fixed pointer-events-none glass-panel p-3 rounded-xl border border-blue-500/30 z-[100] text-xs shadow-2xl max-w-[200px]"
          style={{ left: tooltip.x + 15, top: tooltip.y + 15 }}
        >
          <div className="font-bold text-blue-400 mb-1">{tooltip.data.name}</div>
          <div className="flex flex-col gap-1">
            <div className="text-slate-300">關稅稅率: <span className="text-white font-mono">{tooltip.data.tariff}</span></div>
            <div className="text-slate-300">受影響產業: <span className="text-white">{tooltip.data.industries.join(', ')}</span></div>
            <div className="text-slate-500 text-[10px] mt-1 italic border-t border-slate-800 pt-1">{tooltip.data.desc}</div>
          </div>
        </div>
      )}
      <div className="absolute bottom-10 right-10 glass-panel p-4 rounded-lg text-xs space-y-2 border border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
          <span>美國 (核心市場)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
          <span>臺灣 (戰略合作夥伴)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
          <span>高關稅風險區</span>
        </div>
      </div>
    </div>
  );
};

export default GlobeVisualization;
