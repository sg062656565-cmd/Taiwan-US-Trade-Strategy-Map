import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppStep, Industry } from './types';
import { Icons, INDUSTRIES, TAIWAN_US_TIMELINE, TARIFF_IMPACT_DATA } from './constants';
import { getGeopoliticalUpdate, getSupplyChainInsights, getFuturePrediction } from './services/geminiService';
import GlobeVisualization from './components/GlobeVisualization';
import SupplyChainMap from './components/SupplyChainMap';
import LocalImpactMap from './components/LocalImpactMap';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs)); 
}
  
const script = document.createElement('script');
script.src = "https://unpkg.com/topojson-client@3";
document.head.appendChild(script);

const App: React.FC = () => {
  const [activeStep, setActiveStep] = useState<AppStep>(AppStep.GLOBAL_VIEW);
  const [industry, setIndustry] = useState<Industry>('Semiconductors');
  const [geoUpdate, setGeoUpdate] = useState<any>(null);
  const [supplyChainData, setSupplyChainData] = useState<any>(null);
  const [scenario, setScenario] = useState('');
  const [prediction, setPrediction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString('zh-TW'));
  const [isPolicyExpanded, setIsPolicyExpanded] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showStageInfo, setShowStageInfo] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKeyInput(savedKey);
      setHasApiKey(true);
      setIsSettingsOpen(false);
    } else {
      setHasApiKey(false);
      setIsSettingsOpen(true);
    }
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    
    setIsLoading(true);
    setErrorMessage('');
    try {
      const ai = new (await import("@google/genai")).GoogleGenAI({ apiKey: apiKeyInput });
      await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: 'test' }] }],
      });
      
      localStorage.setItem('gemini_api_key', apiKeyInput);
      setHasApiKey(true);
      setIsSettingsOpen(false);
    } catch (error) {
      setErrorMessage('無效的 API Key，請檢查後重試。');
    } finally {
      setIsLoading(false);
    }
  };

  const TAIWAN_OFFICIAL_INFO = [
    { dimension: 'ART 協定背景', content: '2026/2/12 簽署，旨在應對美方第 122 條款及 IEEPA 違憲後的政策空窗期。' },
    { dimension: '關稅減讓成果', content: '臺灣輸美關稅上限鎖定 15%，不再與其他臨時關稅疊加，平均稅率降至 12.33%。' },
    { dimension: '產品豁免清單', content: '高達 2,072 項產品獲豁免，涵蓋蝴蝶蘭、高階工具機、鋰電池及航空零組件。' },
    { dimension: '臺灣的代價 (市場)', content: '1. 美產車關稅 17.5% -> 0%。2. 豬肉與部分農產品三年內大幅降稅。' },
    { dimension: '臺灣的代價 (資本)', content: '承諾 $2500 億半導體投資，政府提供等額信用保證，協助美方建立本土供應鏈。' },
    { dimension: '戰略採購承諾', content: '五年內採購 $848 億美製商品，包括 LNG、原油、電網設備及波音客機。' },
    { dimension: '政府支持方案', content: '投入 1,390 億元，推動「外銷貸款保證」、「研發補助」及「雙軸轉型」。' },
    { dimension: '潛在風險', content: '本土汽車與農業面臨重整壓力；高階人才與資本外流可能動搖「矽盾」優勢。' },
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleString('zh-TW')), 1000);
    return () => clearInterval(timer);
  }, []);

  const refreshGlobal = async () => {
    setIsLoading(true);
    try {
      const promises: Promise<any>[] = [
        getGeopoliticalUpdate(),
        getSupplyChainInsights(industry)
      ];
      
      if (scenario) {
        promises.push(getFuturePrediction(scenario));
      }

      const results = await Promise.all(promises);
      
      setGeoUpdate(results[0]);
      setSupplyChainData(results[1]);
      if (scenario) {
        setPrediction(results[2]);
      }

      setCurrentTime(new Date().toLocaleString('zh-TW'));
    } catch (err) {
      console.error("Failed to refresh all data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePredict = async () => {
    if (!scenario) return;
    setIsLoading(true);
    const result = await getFuturePrediction(scenario);
    setPrediction(result);
    setIsLoading(false);
  };

  const stepInfo = {
    [AppStep.GLOBAL_VIEW]: {
      title: '全球關稅牆',
      icon: <Icons.Global className="w-5 h-5" />,
      how: '點擊「一鍵獲得美國最新官方資訊」按鈕，AI 將爬取 USTR 與最高法院裁定後的最新政策。',
      focus: '掌握 IEEPA 違憲後的法源轉向（第 122 條款）及全球貿易版圖的劇烈重構。'
    },
    [AppStep.SUPPLY_CHAIN]: {
      title: '供應鏈轉移',
      icon: <Icons.Truck className="w-5 h-5" />,
      how: '觀察地圖上的遷移路徑，分析「中國+1」模式下的洗產地風險與對美直接投資趨勢。',
      focus: '理解臺灣企業如何在 $2500 億投資承諾下，平衡全球佈局與本土「矽盾」安全。'
    },
    [AppStep.LOCAL_IMPACT]: {
      title: '在地衝擊',
      icon: <Icons.Map className="w-5 h-5" />,
      how: '點擊地圖上的區域，分析 10% 附加關稅對美國各州通膨與臺灣產業競爭力的實質影響。',
      focus: '剖析《臺美對等貿易協定》(ART) 簽署後，各產業在關稅減讓與市場開放間的損益。'
    },
    [AppStep.PREDICTIVE_INSIGHT]: {
      title: '預測建議',
      icon: <Icons.Zap className="w-5 h-5" />,
      how: '在輸入框中輸入假設情境，AI 將基於 ART 框架推論未來 5 年的地緣經貿走向。',
      focus: '預判未來 5 年臺美經貿深度綁定後的戰略風險，如資本外流與逆差持續擴大。'
    }
  };

  return (
    <>
      <div className={cn(
        "min-h-screen w-full flex flex-col bg-[#020617] text-slate-100 transition-all duration-700",
        !hasApiKey && "blur-2xl opacity-10 pointer-events-none select-none"
      )}>
        {/* Navigation - Top Header */}
        <header className="fixed top-0 left-0 right-0 h-16 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl z-[60] flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600/20 p-2 rounded-xl ring-1 ring-blue-500/30">
              <Icons.Global className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">臺美貿易戰略圖誌</h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-blue-400/70 font-mono uppercase tracking-widest leading-none">Intelligence Hub</span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-white/5">
              <Icons.Activity className="w-4 h-4 text-slate-500" />
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest leading-none">{currentTime}</span>
            </div>
            
            <button 
              onClick={() => setShowStageInfo(true)}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-amber-400 transition-all"
              title="章節重點"
            >
              <Icons.Help className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-blue-400 transition-all"
              title="API 設定"
            >
              <Icons.Key className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 pt-16 pb-24 relative overflow-hidden flex flex-col">
          <div className="flex-1 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                {activeStep === AppStep.GLOBAL_VIEW && (
                  <div className="w-full flex flex-col p-8 gap-10">
                    <div className="flex flex-col lg:flex-row gap-10">
                      <div className="flex-1 flex flex-col gap-6">
                        <div className="relative h-[650px] glass-card border-none group bg-slate-900/40">
                          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent pointer-events-none" />
                          <GlobeVisualization active={activeStep === AppStep.GLOBAL_VIEW} />
                          <div className="absolute top-8 left-8 max-w-sm space-y-4">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Stage 01</span>
                              <h2 className="text-3xl font-extrabold text-white tracking-tight">全球關稅牆</h2>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">
                              針對美方 2025 年宣布之「Liberation Day」對等關稅，我們透過 AI 即時監控全球貿易版圖的劇烈重構。
                            </p>
                            <button 
                              onClick={refreshGlobal}
                              disabled={isLoading}
                              className="group flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50 shadow-xl shadow-blue-500/20 active:scale-95"
                            >
                              <Icons.Trend className={cn("w-4 h-4 transition-transform group-hover:translate-x-1", isLoading && "animate-spin")} />
                              一鍵獲得最新情報
                            </button>
                          </div>
                        </div>

                        <div className={cn(
                          "glass-card p-6 flex flex-col border-white/5",
                          !isPolicyExpanded && "h-14 py-3"
                        )}>
                          <div 
                            className="flex justify-between items-center cursor-pointer mb-6"
                            onClick={() => setIsPolicyExpanded(!isPolicyExpanded)}
                          >
                            <div className="flex items-center gap-3">
                              <Icons.Shield className="w-4 h-4 text-blue-400" />
                              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">美國官方最新政策</h3>
                            </div>
                            <Icons.ChevronRight className={cn("w-4 h-4 text-slate-500 transition-transform", isPolicyExpanded ? "rotate-90" : "")} />
                          </div>
                          
                          {isPolicyExpanded && (
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-4 max-h-[150px]">
                              {geoUpdate ? (
                                <>
                                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                    {geoUpdate.summary}
                                  </div>
                                  <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                                    {geoUpdate.links.map((link: any, i: number) => (
                                      <a key={i} href={link.uri} target="_blank" rel="noreferrer" className="text-[10px] bg-slate-800/80 px-3 py-1.5 rounded-lg text-blue-400 border border-white/5 hover:border-blue-500/50 transition-all">
                                        Source: {link.title}
                                      </a>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <div className="h-40 flex flex-col items-center justify-center text-slate-600">
                                  <Icons.Dashboard className="w-8 h-8 mb-2 opacity-20" />
                                  <p className="text-xs">等待數據同步...</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="w-full lg:w-[480px] glass-card p-0 border-white/5 flex flex-col h-[850px] shadow-3xl">
                        <div className="p-8 border-b border-white/5 bg-slate-900/20">
                          <h2 className="text-2xl font-bold text-white tracking-tight">談判演進歷程</h2>
                          <p className="text-[10px] text-blue-500 mt-2 uppercase font-bold tracking-[0.2em] opacity-80">Taiwan-US Trade Timeline</p>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10 relative">
                          <div className="absolute left-10 top-0 bottom-0 w-px bg-white/5" />
                          {TAIWAN_US_TIMELINE.map((item, idx) => (
                            <div key={idx} className="relative pl-12 group">
                              <div 
                                className="absolute left-[7px] top-1.5 w-2 h-2 rounded-full z-10 transition-transform group-hover:scale-150" 
                                style={{ 
                                  backgroundColor: item.color,
                                  boxShadow: `0 0 12px ${item.color}80`
                                }} 
                              />
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase">
                                  <span>{item.date}</span>
                                  <span className="font-bold px-2 py-0.5 rounded bg-white/5 border border-white/5" style={{ color: item.color }}>{item.status}</span>
                                </div>
                                <h4 className="text-base font-bold text-white tracking-tight">{item.title}</h4>
                                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="p-6 bg-blue-600/5 mt-auto border-t border-white/5">
                          <h5 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">戰略代價核心</h5>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-3 items-center group">
                              <Icons.Shield className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                              <span className="text-xs text-slate-300">$2500 億對美半導體出口與投資</span>
                            </div>
                            <div className="flex gap-3 items-center group">
                              <Icons.Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                              <span className="text-xs text-slate-300">五年 $848 億戰略採購 (波音、LNG)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === AppStep.SUPPLY_CHAIN && (
                  <div className="w-full h-full flex flex-col p-8 lg:p-10 gap-10">
                    <div className="flex flex-col gap-6">
                      <div className="flex justify-between items-end px-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Supply Chain Shifts</span>
                          <h2 className="text-4xl font-extrabold text-white mt-4 tracking-tight">全球供應鏈轉移</h2>
                        </div>
                      </div>
                      <div className="glass-card border-none min-h-[600px] relative shadow-3xl bg-slate-900/40">
                        <SupplyChainMap industry={industry} active={activeStep === AppStep.SUPPLY_CHAIN} data={supplyChainData?.shifts || []} />
                      </div>
                    </div>
                    
                    <div className="glass-card p-0 border-white/5 flex flex-col bg-slate-900/20">
                      <div className="p-8 border-b border-white/5">
                        <h2 className="text-2xl font-bold text-white tracking-tight">行政院經貿談判官方洞察</h2>
                        <p className="text-xs text-slate-500 mt-2 uppercase font-bold tracking-widest">Government Insights & Strategic Reports</p>
                      </div>

                      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {TAIWAN_OFFICIAL_INFO.map((item, idx) => (
                          <div key={idx} className="p-6 bg-slate-900/60 rounded-2xl border border-white/5 hover:border-emerald-500/20 transition-all group">
                            <div className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-3 opacity-60 group-hover:opacity-100">{item.dimension}</div>
                            <div className="text-xl text-slate-200 font-medium leading-relaxed">{item.content}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === AppStep.LOCAL_IMPACT && (
                  <div className="w-full h-full p-8 lg:p-10 flex flex-col gap-10">
                    <div className="flex flex-col gap-6">
                      <div className="flex justify-between items-end px-2">
                        <div className="space-y-1">
                          <h2 className="text-4xl font-extrabold text-white tracking-tight">關稅協商下美國衝擊</h2>
                          <p className="text-slate-400 text-lg">剖析關稅減讓對各州經濟與在地產業的顯著影響。</p>
                        </div>
                      </div>
                      <div className="glass-card border-none bg-slate-900/20 overflow-hidden shadow-2xl h-[600px]">
                        <LocalImpactMap active={activeStep === AppStep.LOCAL_IMPACT} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="glass-card p-8 border-white/5 bg-slate-900/40">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="p-2 bg-blue-600/10 rounded-xl">
                            <span className="text-xl">🇺🇸</span>
                          </div>
                          <h3 className="text-2xl font-bold text-white tracking-tight">美國市場回報與挑戰</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {TARIFF_IMPACT_DATA.us.map((item, idx) => (
                            <div key={idx} className="p-6 bg-[#020617]/40 rounded-3xl border border-white/5 group hover:border-blue-500/20 transition-all">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="text-3xl">{item.icon}</span>
                                <span className="text-xl font-bold text-slate-100">{item.category}</span>
                              </div>
                              <p className="text-lg text-slate-300 mb-3 leading-relaxed">{item.detail}</p>
                              <p className="text-sm text-slate-500 italic font-medium">{item.note}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="glass-card p-8 border-white/5 bg-emerald-600/5">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="p-2 bg-emerald-600/20 rounded-xl">
                            <span className="text-xl">🇹🇼</span>
                          </div>
                          <h3 className="text-2xl font-bold text-white tracking-tight">台灣產業損益分析</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {TARIFF_IMPACT_DATA.taiwan.map((item, idx) => (
                            <div key={idx} className="p-6 bg-[#020617]/40 rounded-3xl border border-white/5 group hover:border-emerald-500/20 transition-all">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="text-3xl">{item.icon}</span>
                                <span className="text-xl font-bold text-slate-100">{item.category}</span>
                              </div>
                              <p className="text-lg text-slate-300 leading-relaxed mb-3">{item.detail}</p>
                              <p className="text-sm text-slate-500 italic font-medium">{item.note}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === AppStep.PREDICTIVE_INSIGHT && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-10">
                    <div className="max-w-4xl w-full space-y-12">
                      <div className="text-center space-y-6">
                        <div className="inline-flex items-center gap-2 bg-blue-600/10 text-blue-400 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-500/20">
                          <Icons.Zap className="w-4 h-4" />
                          Strategic Forecast Engine
                        </div>
                        <h2 className="text-5xl font-extrabold text-white tracking-tighter">AI 戰略預測引擎</h2>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
                          整合地緣政治模型與貿易數據，模擬不同情境下的經貿風險與發展契機。
                        </p>
                      </div>

                      <div className="glass-card p-2 border-white/10 ring-8 ring-white/5 bg-slate-900/40">
                        <div className="flex relative">
                          <input
                            type="text"
                            value={scenario}
                            onChange={(e) => setScenario(e.target.value)}
                            placeholder="輸入假設情境：例如「若亞利桑那州投資案延宕...」"
                            className="w-full bg-transparent px-8 py-6 text-lg text-white font-medium focus:outline-none placeholder:text-slate-700"
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handlePredict()}
                          />
                          <button 
                            onClick={handlePredict}
                            disabled={isLoading || !scenario}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-10 rounded-xl font-bold transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2 whitespace-nowrap active:scale-95"
                          >
                            {isLoading ? <Icons.Activity className="w-4 h-4 animate-spin" /> : <Icons.Zap className="w-4 h-4" />}
                            生成戰略分析
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {prediction && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card p-10 border-blue-500/20 bg-blue-600/5 shadow-2xl"
                          >
                            <div className="flex items-center gap-3 mb-8">
                              <div className="w-1.5 h-8 bg-blue-500 rounded-full" />
                              <h4 className="text-xl font-bold text-white tracking-tight">AI 戰略洞察總覽</h4>
                            </div>
                            <div className="text-slate-300 leading-relaxed whitespace-pre-wrap text-[15px] space-y-4">
                              {prediction}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Floating Dock Navigation */}
        <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 p-3 bg-slate-900/90 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-3xl z-[100]">
          {Object.entries(stepInfo).map(([step, info]) => (
            <button
              key={step}
              onClick={() => setActiveStep(step as AppStep)}
              className={cn(
                "group flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-500 relative",
                activeStep === step 
                  ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] ring-1 ring-white/20" 
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              {info.icon}
              <span className="hidden md:block whitespace-nowrap">{info.title}</span>
              {activeStep === step && (
                <motion.div 
                  layoutId="activeTab" 
                  className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none rounded-2xl" 
                />
              )}
            </button>
          ))}
        </nav>

        {/* Footer Info */}
        <footer className="fixed bottom-0 left-0 right-0 h-8 bg-[#020617]/50 pointer-events-none flex items-center justify-between px-8 text-[9px] text-slate-700 font-bold uppercase tracking-[0.3em] z-40">
          <span>Official Sources: DOC / USTR / EY MOTP</span>
          <span>&copy; 2024 TradeViz Strategic Dashboard</span>
        </footer>
      </div>

      {/* Pop-up: Stage Context */}
      <AnimatePresence>
        {showStageInfo && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStageInfo(false)}
              className="absolute inset-0 bg-[#020617]/90 backdrop-blur-2xl cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl glass-card p-10 border-white/10 relative shadow-4xl bg-slate-900/90"
            >
              <button 
                onClick={() => setShowStageInfo(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-slate-500 transition-colors"
              >
                <Icons.Maximize className="w-5 h-5 rotate-45" />
              </button>
              
              <div className="space-y-10">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-amber-500/10 rounded-2xl ring-1 ring-amber-500/20">
                    <Icons.Help className="w-8 h-8 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">{stepInfo[activeStep].title} - 操作說明</h2>
                    <p className="text-slate-500 text-[10px] mt-1 uppercase font-bold tracking-[0.3em] leading-none">Guidance & Strategic Focus</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-white/5">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <h4 className="text-[11px] font-bold text-blue-500 uppercase tracking-widest">獲取資訊方式</h4>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                      {stepInfo[activeStep].how}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <h4 className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest">本章節重點</h4>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                      {stepInfo[activeStep].focus}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowStageInfo(false)}
                  className="w-full bg-white text-[#020617] py-4 rounded-2xl font-black text-sm tracking-tight hover:scale-[1.02] transition-all shadow-xl active:scale-95"
                >
                  開始探索此章節
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* API Key Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#020617]/95 backdrop-blur-3xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-card p-10 border-white/10 shadow-2xl bg-slate-900/90"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-600/30">
                  <Icons.Key className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">歡迎使用戰略圖誌</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Secure Access Required</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <p className="text-sm text-slate-400 leading-relaxed">
                  本系統需要 Gemini API 金鑰。請輸入您的金鑰以解鎖即時數據分析功能。
                </p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">API Key Signature</label>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 font-bold hover:underline">獲取金鑰 →</a>
                  </div>
                  <div className="relative group">
                    <input 
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => {
                        setApiKeyInput(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="在此貼上您的金鑰..."
                      className={cn(
                        "w-full bg-[#020617] border rounded-2xl px-6 py-4 text-sm font-medium transition-all focus:outline-none focus:ring-4 focus:ring-blue-600/10 placeholder:text-slate-800",
                        errorMessage ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-blue-500"
                      )}
                    />
                  </div>
                  {errorMessage && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-red-500 font-bold px-1 uppercase tracking-widest">
                      {errorMessage}
                    </motion.p>
                  )}
                </div>

                <div className="flex flex-col gap-3 pt-6">
                  <button 
                    onClick={handleSaveApiKey}
                    disabled={isLoading || !apiKeyInput.trim()}
                    className="w-full bg-white hover:bg-slate-100 text-[#020617] py-4 rounded-2xl font-black text-sm tracking-tight transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isLoading ? <Icons.Activity className="w-4 h-4 animate-spin" /> : <Icons.Zap className="w-4 h-4" />}
                    {hasApiKey ? '更新並儲存金鑰' : '解鎖戰略系統'}
                  </button>
                  {hasApiKey && (
                    <button 
                      onClick={() => setIsSettingsOpen(false)}
                      className="w-full px-4 py-3 rounded-2xl text-[10px] font-bold text-slate-600 hover:text-slate-300 transition-colors uppercase tracking-widest"
                    >
                      暫不更改，返回系統
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default App;
