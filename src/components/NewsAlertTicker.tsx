import React, { useState, useEffect } from 'react';
import { Radio, AlertCircle, ChevronRight, X, ExternalLink, ShieldAlert, Sparkles, Volume2 } from 'lucide-react';
import { NewsBulletin } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface NewsAlertTickerProps {
  bulletins: NewsBulletin[];
  onSelectBulletin: (bulletin: NewsBulletin) => void;
}

export const NewsAlertTicker: React.FC<NewsAlertTickerProps> = ({ bulletins, onSelectBulletin }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedBulletin, setSelectedBulletin] = useState<NewsBulletin | null>(null);

  // Auto-cycle through incoming bulletins
  useEffect(() => {
    if (bulletins.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bulletins.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [bulletins]);

  const activeBulletin = bulletins[currentIndex] || bulletins[0];
  if (!activeBulletin) return null;

  const handleOpenDetail = (b: NewsBulletin) => {
    setSelectedBulletin(b);
    onSelectBulletin(b);
    audioEngine.playNote(76, 0.65);
  };

  return (
    <>
      {/* Ticker Bar (Pinned under TopHud) */}
      <div className="absolute top-14 left-3 right-3 pointer-events-none z-20 flex justify-center">
        <div className="pointer-events-auto bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-xl flex items-center gap-2.5 max-w-2xl w-full text-xs overflow-hidden">
          {/* Badge */}
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded flex-shrink-0 bg-red-950/80 text-red-300 border border-red-700/60">
            <Radio className="w-3 h-3 text-red-400" />
            <span>AWATCH NEWS</span>
          </div>

          {/* Scrolling headline */}
          <div
            onClick={() => handleOpenDetail(activeBulletin)}
            className="flex-1 truncate cursor-pointer hover:text-cyan-300 transition-colors flex items-center gap-2"
          >
            <span className="font-semibold text-white truncate">{activeBulletin.headline}</span>
            <span className="text-[10px] text-cyan-400 font-mono flex-shrink-0">[{activeBulletin.geoTag}]</span>
          </div>

          {/* Time & Expand */}
          <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[10px] text-slate-400">
            <span>{activeBulletin.timestamp}</span>
            <button
              onClick={() => handleOpenDetail(activeBulletin)}
              className="text-cyan-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors"
              title="Inspect Full Bulletin"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulletin Detail Modal */}
      {selectedBulletin && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-4 shadow-2xl text-slate-200 text-xs space-y-3">
            <div className="flex items-start justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span className="font-bold text-sm text-white uppercase">{selectedBulletin.category} BULLETIN</span>
              </div>
              <button
                onClick={() => setSelectedBulletin(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-white mb-1">{selectedBulletin.headline}</h3>
              <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] mb-2">
                <span>Source: {selectedBulletin.source}</span>
                <span>•</span>
                <span>Time: {selectedBulletin.timestamp}</span>
                <span>•</span>
                <span className="text-cyan-400">Region: {selectedBulletin.geoTag}</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px] bg-slate-950 p-3 rounded-xl border border-slate-800">
                {selectedBulletin.content}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-slate-800">
              <button
                onClick={() => setSelectedBulletin(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-white rounded-lg transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
