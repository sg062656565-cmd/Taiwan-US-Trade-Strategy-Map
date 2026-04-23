
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { US_PORTS, US_STATES_MAP, US_STATE_IMPACTS } from '../constants';
import { getLocalImpact } from '../services/geminiService';
import { Icons } from '../constants';

interface LocalImpactMapProps {
  active: boolean;
}

const LocalImpactMap: React.FC<LocalImpactMapProps> = ({ active }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredLocation, setHoveredLocation] = useState<any>(null);
  const [impactInfo, setImpactInfo] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!active || !svgRef.current) return;

    const width = 800;
    const height = 500;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    const projection = d3.geoAlbersUsa()
      .scale(1000)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json').then((us: any) => {
      const states = (window as any).topojson.feature(us, us.objects.states);

      g.append('g')
        .selectAll('path')
        .data(states.features)
        .enter()
        .append('path')
        .attr('d', path as any)
        .attr('fill', (d: any) => {
          const name = d.properties.name;
          const impact = US_STATE_IMPACTS[name];
          if (impact?.risk === '高風險') return '#7f1d1d';
          if (impact?.risk === '中高風險') return '#92400e';
          if (impact?.risk === '低風險') return '#064e3b';
          return '#0f1423';
        })
        .attr('stroke', '#334155')
        .attr('stroke-width', 0.5)
        .attr('class', 'cursor-pointer hover:opacity-80 transition-opacity')
        .on('mouseenter', (event, d: any) => {
          const enName = d.properties.name;
          const zhName = US_STATES_MAP[enName] || enName;
          const impact = US_STATE_IMPACTS[enName];
          setHoveredLocation({ 
            name: `${zhName} (${enName})`, 
            type: '州經濟體', 
            state: enName,
            details: impact
          });
        });

      g.append('g')
        .selectAll('circle')
        .data(US_PORTS)
        .enter()
        .append('circle')
        .attr('cx', (d: any) => projection([d.lng, d.lat])?.[0] || 0)
        .attr('cy', (d: any) => projection([d.lng, d.lat])?.[1] || 0)
        .attr('r', 10)
        .attr('fill', (d: any) => d.type === 'port' ? '#60a5fa' : '#fbbf24')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .attr('class', 'cursor-pointer hover:fill-white transition-colors shadow-lg active:scale-90')
        .on('click', async (event, d) => {
          const enName = d.state;
          const zhName = US_STATES_MAP[enName] || enName;
          const impact = US_STATE_IMPACTS[enName];
          setHoveredLocation({ 
            ...d, 
            displayName: `${d.name}`, 
            stateName: `${zhName} (${enName})`,
            details: impact
          });
          setLoading(true);
          const info = await getLocalImpact(d.name);
          setImpactInfo(info || '暫無資料');
          setLoading(false);
        });
    });

  }, [active]);

  return (
    <div className="w-full relative flex flex-col md:flex-row gap-4 p-4">
      <div className="flex-1 glass-panel rounded-2xl overflow-hidden min-h-[500px] border border-slate-700/30 cursor-move relative">
        <svg ref={svgRef} viewBox="0 0 800 500" className="w-full h-full" />
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-x-6 gap-y-3 text-[14px] max-w-[calc(100%-2rem)] bg-slate-900/60 backdrop-blur-md p-3 rounded-lg border border-white/5">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#7f1d1d]"></div> 高風險</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#92400e]"></div> 中高風險</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#064e3b]"></div> 低風險</div>
          <div className="w-px h-4 bg-slate-700 mx-2 hidden sm:block"></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#60a5fa] border border-white/20"></div> 港口 (Ports)</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#fbbf24] border border-white/20"></div> 製造中心 (Centers)</div>
        </div>
      </div>
      
      <div className="w-full md:w-96 glass-panel rounded-2xl p-6 flex flex-col gap-6 border border-slate-700/30 overflow-y-auto max-h-[600px] custom-scrollbar">
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-blue-400 border-b border-blue-500/20 pb-3">在地經濟衝擊分析</h3>
          
          {hoveredLocation ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <span className="text-[12px] uppercase tracking-wider text-slate-500 font-bold">當前選取區域</span>
                <p className="text-2xl font-bold text-white mt-1">{hoveredLocation.displayName || hoveredLocation.name}</p>
              </div>
              
              {hoveredLocation.details && (
                <div className="bg-blue-600/10 border-l-4 border-blue-500 p-4 rounded-r-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-blue-400">風險等級：{hoveredLocation.details.risk}</span>
                    <span className="text-[11px] bg-blue-500/20 px-3 py-1 rounded-full text-blue-300">依賴度 {hoveredLocation.details.dependency}</span>
                  </div>
                  <p className="text-[14px] text-slate-200 leading-relaxed font-medium">{hoveredLocation.details.reason}</p>
                  <p className="text-[13px] text-amber-500 italic font-semibold">脆弱性核心：{hoveredLocation.details.vulnerability}</p>
                  <p className="text-[12px] text-slate-400 border-t border-white/5 pt-2">能源供應風險：{hoveredLocation.details.energy}</p>
                </div>
              )}

              <div className="border-t border-slate-800 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Icons.Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-[12px] uppercase tracking-wider text-slate-400 font-bold">AI 智慧分析深度報告</span>
                </div>
                {loading ? (
                  <div className="flex flex-col items-center justify-center gap-4 mt-8 text-slate-400 animate-pulse bg-slate-800/20 p-8 rounded-2xl border border-dashed border-white/10">
                    <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">正在解析該區關稅數據與韌性指標...</span>
                  </div>
                ) : (
                  <div className="text-[16px] text-slate-100 mt-4 leading-[1.8] whitespace-pre-wrap bg-slate-900/40 p-5 rounded-xl border border-white/5 shadow-inner">
                    {impactInfo || '💡 請點擊地圖上的節點（港口或製造中心）以生成該專屬區域的經濟系統性報告。'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-slate-500 text-sm italic">
                請在地圖上移動滑鼠查看各州與關鍵節點。
              </div>
              
              <div className="space-y-4 border-t border-slate-800 pt-4">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest">關鍵洞察</h4>
                <div className="space-y-3">
                  <div className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-white font-bold">1. 各州依賴度差異：</span>
                    蒙大拿州進口依賴度 {'>'}90%，而紐澤西州僅約 21%。
                  </div>
                  <div className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-white font-bold">2. 經濟脆弱性：</span>
                    新墨西哥州與蒙大拿州高依賴度且家庭收入中位數低，面臨雙重打擊。
                  </div>
                  <div className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-white font-bold">3. 能源風險：</span>
                    東北部與紐約州高度依賴進口能源，建議關稅降至 10% 以緩解壓力。
                  </div>
                  <div className="text-xs text-slate-400 leading-relaxed italic">
                    "政策不確定性會使企業暫緩投資，拖慢地方經濟成長。" — Der Burke
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocalImpactMap;
