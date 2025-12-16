import React, { useState, useRef, useEffect } from 'react';
import SnowGlobe, { SnowGlobeHandle } from './components/SnowGlobe';
import { SceneType, CustomSceneConfig } from './types';
import { SCENE_LIST } from './sceneConfig';

const App: React.FC = () => {
  // Default to the first scene in the config
  const [scene, setScene] = useState<SceneType>(SCENE_LIST[0]?.id || 'WINTER');
  const [customText, setCustomText] = useState<string>("Magic World");
  const [isRecording, setIsRecording] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar toggle state
  const snowGlobeRef = useRef<SnowGlobeHandle>(null);

  // DIY State
  const [customConfig, setCustomConfig] = useState<CustomSceneConfig>({
    // Atmosphere
    snow: false,
    rain: false,
    sakura: false,
    // Objects
    people: false,
    forest: false,
    christmasTree: false,
    cat: false,
    // Colors
    backgroundColor: '#0f172a', // Slate 900
    baseColor: '#78350f', // Wood
    textColor: '#fbbf24', // Gold
  });

  // Update default text based on scene for fun
  useEffect(() => {
    if (scene === 'CHRISTMAS') setCustomText("Merry Christmas");
    else if (scene === 'BIRTHDAY') setCustomText("Happy Birthday");
    else if (scene === 'SHANGHAI') setCustomText("I Love Shanghai");
    else if (scene === 'WEDDING') setCustomText("Forever Love");
    else if (scene === 'EGYPT') setCustomText("Ancient Sands");
    else if (scene === 'CITY_NIGHT') setCustomText("City of Stars");
    else if (scene === 'CAROUSEL') setCustomText("Dreamland");
    else if (scene === 'FISHERMAN') setCustomText("Inner Peace");
    else if (scene === 'BAMBOO') setCustomText("Zen Garden");
    else if (scene === 'JELLYFISH') setCustomText("Deep Ocean");
    else if (scene === 'CUSTOM') setCustomText("My World");
    else setCustomText("Magic World");
  }, [scene]);

  const handleDownload = async () => {
    if (snowGlobeRef.current && !isRecording) {
      setIsRecording(true);
      try {
        await snowGlobeRef.current.captureVideo();
      } catch (e) {
        console.error("Recording failed", e);
      } finally {
        setIsRecording(false);
      }
    }
  };

  const toggleCustom = (key: keyof CustomSceneConfig) => {
    setCustomConfig(prev => ({ ...prev, [key]: !prev[key as keyof CustomSceneConfig] }));
  };

  const changeColor = (key: 'backgroundColor' | 'baseColor' | 'textColor', value: string) => {
    setCustomConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white overflow-hidden relative">
      
      <div className="z-10 text-center mb-2 pointer-events-none absolute top-4 w-full">
        <h1 className="text-3xl font-serif tracking-widest text-slate-200 drop-shadow-lg opacity-80">
          MAGIC MICROCOSM
        </h1>
        <p className="text-sm text-slate-400 mt-1 font-light">
          Choose a world, write a wish, and keep the memory.
        </p>
      </div>

      <div className="relative z-0 shadow-2xl rounded-full mt-4 group">
        <SnowGlobe 
          ref={snowGlobeRef} 
          currentScene={scene} 
          message={customText} 
          customConfig={scene === 'CUSTOM' ? customConfig : undefined}
        />
      </div>

      {/* DIY Controls Sidebar (Right Side) */}
      {scene === 'CUSTOM' && (
        <>
          {/* Toggle Button */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute right-6 top-6 z-50 w-10 h-10 flex items-center justify-center bg-slate-800/80 backdrop-blur-md rounded-full border border-slate-600 text-slate-300 hover:text-white shadow-lg transition-all hover:scale-110"
            title="Toggle DIY Panel"
          >
            {isSidebarOpen ? '✖' : '⚙️'}
          </button>

          {/* Sidebar Panel */}
          <div className={`absolute right-6 top-1/2 -translate-y-1/2 z-40 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 p-5 rounded-2xl shadow-2xl w-72 transition-all duration-300 origin-right ${isSidebarOpen ? 'scale-100 opacity-100 translate-x-0' : 'scale-90 opacity-0 translate-x-8 pointer-events-none'}`}>
            <h3 className="text-lg font-serif text-amber-400 mb-4 border-b border-slate-700 pb-2 text-center tracking-wide">Creator Studio</h3>
            
            {/* Atmosphere Section */}
            <div className="mb-4">
              <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Atmosphere</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'snow', label: 'Snow', icon: '❄️' },
                  { key: 'rain', label: 'Rain', icon: '🌧️' },
                  { key: 'sakura', label: 'Sakura', icon: '🌸' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => toggleCustom(item.key as keyof CustomSceneConfig)}
                    className={`flex-1 min-w-[80px] px-2 py-2 rounded-lg text-xs font-bold transition-all border flex flex-col items-center gap-1 ${
                      customConfig[item.key as keyof CustomSceneConfig]
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_8px_rgba(79,70,229,0.4)]'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span> {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Objects Section */}
            <div className="mb-4">
              <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Objects</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'forest', label: 'Forest', icon: '🌲' },
                  { key: 'christmasTree', label: 'Tree', icon: '🎄' },
                  { key: 'people', label: 'People', icon: '🧍' },
                  // Removed Cat from selection as requested
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => toggleCustom(item.key as keyof CustomSceneConfig)}
                    className={`px-2 py-2 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                      customConfig[item.key as keyof CustomSceneConfig]
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_8px_rgba(79,70,229,0.4)]'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <span>{item.icon}</span> {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors Section */}
            <div>
              <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Palette</h4>
              <div className="space-y-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-300">Background</span>
                  <input 
                    type="color" 
                    value={customConfig.backgroundColor}
                    onChange={(e) => changeColor('backgroundColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-none p-0"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-300">Base Color</span>
                  <input 
                    type="color" 
                    value={customConfig.baseColor}
                    onChange={(e) => changeColor('baseColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-none p-0"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-300">Text Color</span>
                  <input 
                    type="color" 
                    value={customConfig.textColor}
                    onChange={(e) => changeColor('textColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-none p-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom Controls (Input, Save, Scene Selector) */}
      <div className="absolute bottom-6 z-20 w-full max-w-4xl px-4 flex flex-col gap-4 items-center">
        
        {/* Base Text Editor & Download */}
        <div className="flex gap-2 items-center bg-slate-900/60 backdrop-blur-md p-2 rounded-xl border border-slate-700/50 shadow-lg">
          <input 
            type="text" 
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            maxLength={20}
            className="bg-transparent border-b border-slate-500 text-center text-amber-400 font-serif placeholder-slate-600 focus:outline-none focus:border-amber-400 px-2 py-1 w-48"
            placeholder="Engrave text..."
          />
          <button 
            onClick={handleDownload}
            disabled={isRecording}
            className={`px-4 py-1.5 rounded-lg font-medium text-xs uppercase tracking-wide transition-all ${
              isRecording 
                ? 'bg-red-500/20 text-red-400 cursor-wait animate-pulse' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
            }`}
          >
            {isRecording ? 'Creating GIF...' : 'Save GIF'}
          </button>
        </div>

        {/* Scene Selector */}
        <div className="flex gap-3 overflow-x-auto pb-2 pt-2 justify-center w-full scrollbar-hide">
          {SCENE_LIST.map((s) => (
            <button
              key={s.id}
              onClick={() => setScene(s.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition-all duration-300 border backdrop-blur-md ${
                scene === s.id
                  ? 'bg-slate-700/80 border-slate-500 text-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                  : 'bg-slate-900/40 border-slate-700/30 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="text-2xl filter drop-shadow-md">{s.icon}</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="absolute bottom-1 text-slate-600 text-[10px] font-mono pointer-events-none">
        Generated by Gemini
      </div>
    </div>
  );
};

export default App;