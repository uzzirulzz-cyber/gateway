import React, { useState, useEffect, useRef } from 'react';
import { OPERATORS } from '../lib/registry';
import { SecurityOperator } from '../lib/types';
import { sound } from '../lib/audio';
import { Lock, Unlock, ChevronRight, RefreshCw, KeyRound, AlertTriangle, Zap, Flame, ShieldAlert, Upload, Image as ImageIcon } from 'lucide-react';

interface GatefitGatewayProps {
  onAuthorized: (operator: SecurityOperator) => void;
  onBypass: () => void;
}

export const GatefitGateway: React.FC<GatefitGatewayProps> = ({ onAuthorized, onBypass }) => {
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isRotating, setIsRotating] = useState(true);
  const [selectedOperator, setSelectedOperator] = useState<SecurityOperator | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [authStatus, setAuthStatus] = useState<'idle' | 'checking' | 'granted' | 'denied'>('idle');
  const [isShortCircuit, setIsShortCircuit] = useState(false);
  const [sparkParticles, setSparkParticles] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);
  
  // Custom user image overrides (can be loaded directly from local machine or defaults)
  const [customImages, setCustomImages] = useState<Record<string, string>>({
    'node-1': 'https://www.dropbox.com/scl/fi/rb7o9l95n3p3cuqojk34v/qazi.png?rlkey=r3aof0853xaa5et1iad35v0rl&st=ak5kmzta&raw=1',
    'node-2': 'https://www.dropbox.com/scl/fi/ra2flkqq9mqpr5udu6c2n/creed.png?rlkey=0lqj28r0qkppyvs3ofo7f8xo6&st=h18yyx2g&raw=1',
    'node-3': 'https://www.dropbox.com/scl/fi/1adl3zr6juecfi86qmlap/mahbuba.jpg?rlkey=xemwl12md7jfj5k04bwgbb8q3&st=4svl52gh&raw=1'
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeUploadNodeId, setActiveUploadNodeId] = useState<string | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // 3D continuous rotation loop (counter-rotation keeps images oriented towards viewer)
  useEffect(() => {
    let lastTime = performance.now();
    const rotateSpeed = 0.032;

    const loop = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;

      if (isRotating && !selectedOperator && authStatus !== 'granted') {
        setRotationAngle(prev => (prev + rotateSpeed * dt) % 360);
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRotating, selectedOperator, authStatus]);

  const handleSelectNode = (operator: SecurityOperator, nodeIndex: number) => {
    sound.playSelect();
    setSelectedOperator(operator);
    setPinInput('');
    setAuthStatus('idle');
    setIsShortCircuit(false);
    // Align selected node directly towards the camera
    const targetAngle = -(nodeIndex * 120);
    setRotationAngle(targetAngle);
  };

  const handleDigit = (digit: string) => {
    if (authStatus === 'checking' || authStatus === 'granted') return;
    if (pinInput.length >= 5) return;

    sound.playKey(720 + pinInput.length * 90);
    const newPin = pinInput + digit;
    setPinInput(newPin);

    // Auto-validate upon entering 5th digit
    if (newPin.length === 5) {
      validatePin(newPin);
    }
  };

  const handleBackspace = () => {
    if (authStatus === 'checking' || authStatus === 'granted') return;
    sound.playKey(440);
    setPinInput(prev => prev.slice(0, -1));
    setAuthStatus('idle');
  };

  const handleClear = () => {
    sound.playKey(380);
    setPinInput('');
    setAuthStatus('idle');
    setIsShortCircuit(false);
  };

  const validatePin = (pin: string) => {
    if (!selectedOperator) return;

    setAuthStatus('checking');

    setTimeout(() => {
      if (pin === selectedOperator.pin) {
        setAuthStatus('granted');
        sound.playGranted();
        setTimeout(() => {
          onAuthorized(selectedOperator);
        }, 1100);
      } else {
        // Digital Electric Fire Short-Circuit Overload
        setAuthStatus('denied');
        setIsShortCircuit(true);
        sound.playShortCircuit();

        const newSparks = Array.from({ length: 22 }).map((_, i) => ({
          id: Date.now() + i,
          x: Math.random() * 280 - 140,
          y: Math.random() * 280 - 140,
          size: Math.random() * 4 + 2
        }));
        setSparkParticles(newSparks);

        setTimeout(() => {
          setIsShortCircuit(false);
          setPinInput('');
          setAuthStatus('idle');
          setSparkParticles([]);
        }, 1200);
      }
    }, 380);
  };

  // Direct file loader so user can upload/select their local image file directly
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeUploadNodeId) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setCustomImages(prev => ({
            ...prev,
            [activeUploadNodeId]: dataUrl
          }));
          sound.playGranted();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveUploadNodeId(nodeId);
    fileInputRef.current?.click();
  };

  const carouselRadius = 260; // 3D orbit distance in pixels

  return (
    <div className={`relative min-h-screen w-full bg-[#03060B] text-slate-100 flex flex-col justify-between overflow-hidden select-none transition-colors duration-200 ${
      isShortCircuit ? 'bg-[#180408]' : ''
    }`}>
      {/* Hidden file input for direct image loading */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Short-circuit screen strobe */}
      {isShortCircuit && (
        <div className="absolute inset-0 bg-red-600/25 mix-blend-color-dodge z-50 pointer-events-none animate-spark-strobe" />
      )}

      {/* Atmospheric digital grid */}
      <div className="absolute inset-0 holo-grid opacity-40 pointer-events-none" />
      
      {/* Electric fire blue-amber background aura */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-gradient-to-b from-cyan-500/12 via-blue-600/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[700px] h-[280px] bg-gradient-to-t from-orange-600/15 via-red-500/10 to-transparent blur-[130px] pointer-events-none rounded-full" />

      {/* Top Header - Concealed Identity & PINs */}
      <header className="relative z-30 flex items-center justify-between gap-8 px-8 py-5 border-b border-slate-800/80 bg-[#03060B]/90 backdrop-blur-md">
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-orange-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Zap className="w-5 h-5 text-white fill-current animate-pulse" />
            <div className="absolute -inset-0.5 rounded-xl border border-cyan-400 animate-ping opacity-35 pointer-events-none" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-white block">
              Gatefit Holographic Access
            </span>
            <span className="text-[11px] font-mono text-cyan-400 block flex items-center gap-1.5 font-bold">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>ELECTRIC FIRE BIOMETRIC CHECKPOINT</span>
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs font-mono">
          <span className="text-cyan-400 font-bold">3 ELECTRIC FIRE NODES</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="text-slate-400">SELECT IMAGE NODE & ENTER PIN</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onBypass}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-700/60 rounded-xl hover:bg-cyan-900/60 hover:text-white transition-all whitespace-nowrap shadow-md shadow-cyan-950/40"
          >
            <span>Quick Bypass</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Central 3D Stage */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 py-2">
        {/* Short Circuit Alert Banner */}
        {isShortCircuit && (
          <div className="mb-3 px-6 py-2 rounded-xl bg-red-950/95 border-2 border-red-500 text-red-200 text-xs font-mono font-bold flex items-center gap-2 shadow-[0_0_35px_#FF0055] animate-bounce z-40">
            <ShieldAlert className="w-4 h-4 text-red-400 animate-spin" />
            <span>CRITICAL: ELECTRICAL SHORT-CIRCUIT DETECTED // VOLTAGE SPIKE OVERLOAD</span>
          </div>
        )}

        {/* 3D Stage Container */}
        <div className="relative w-full max-w-3xl h-[420px] flex items-center justify-center perspective-1200">
          {/* Orbital Electric Fire Floor Crater */}
          <div 
            className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{
              transform: 'rotateX(75deg) translateZ(-65px)',
              background: 'radial-gradient(circle, transparent 65%, rgba(0, 240, 255, 0.2) 78%, rgba(255, 100, 0, 0.3) 90%, transparent 100%)',
              boxShadow: '0 0 65px rgba(0, 240, 255, 0.25) inset'
            }}
          />

          {/* Concentric rotating electric plasma ring */}
          <div 
            className="absolute w-[510px] h-[510px] rounded-full border-2 border-cyan-400/35 border-dashed pointer-events-none animate-spin"
            style={{
              transform: 'rotateX(75deg) translateZ(-50px)',
              animationDuration: '20s'
            }}
          />

          {/* 3D Rotating Axis */}
          <div
            className="relative w-0 h-0 preserve-3d transition-transform duration-700 ease-out"
            style={{
              transform: `rotateY(${rotationAngle}deg)`,
            }}
          >
            {OPERATORS.map((operator, index) => {
              const nodeAngle = index * 120;
              const rad = (nodeAngle * Math.PI) / 180;
              const x = Math.sin(rad) * carouselRadius;
              const z = Math.cos(rad) * carouselRadius;
              const isSelected = selectedOperator?.id === operator.id;

              // Image for this node (from custom upload state or default)
              const imageSrc = customImages[operator.id] || operator.imageUrl;

              return (
                <div
                  key={operator.id}
                  className="absolute left-0 top-0 preserve-3d"
                  style={{
                    transform: `translate3d(${x}px, -100px, ${z}px)`,
                  }}
                >
                  {/* Counter-rotation to keep image facing viewer */}
                  <div
                    className="preserve-3d transition-transform duration-300"
                    style={{
                      transform: `rotateY(${-rotationAngle}deg) scale(${isSelected ? 1.15 : 1})`,
                    }}
                  >
                    {/* Electric fire rim reduced by 25%; image size stays unchanged. */}
                    <div
                      onClick={() => handleSelectNode(operator, index)}
                      className={`relative w-52 h-52 rounded-full p-2.5 cursor-pointer transition-all duration-300 flex items-center justify-center group ${
                        isSelected
                          ? 'shadow-[0_0_55px_rgba(0,240,255,0.7)]'
                          : 'hover:shadow-[0_0_40px_rgba(0,240,255,0.5)]'
                      }`}
                    >
                      {/* Outer electric fire glow */}
                      <div 
                        className="absolute -inset-1.5 rounded-full animate-blazing-fire pointer-events-none"
                        style={{
                          background: 'conic-gradient(from 0deg, #00F0FF, #0077FF, #9D00FF, #FF0055, #FF6600, #FFE600, #00F0FF)',
                          filter: 'blur(2.625px)',
                          opacity: isSelected ? 0.7125 : 0.5625
                        }}
                      />

                      {/* ELECTRIC FIRE LAYER 2: Counter-rotating secondary lightning plasma arc */}
                      <div 
                        className="absolute -inset-[3px] rounded-full animate-blazing-fire-reverse pointer-events-none"
                        style={{
                          background: 'conic-gradient(from 180deg, #FF6600, #FFE600, #00F0FF, #7000FF, #FF6600)',
                          filter: 'blur(1.65px)',
                          opacity: 0.6
                        }}
                      />

                      {/* Electric pulse ring */}
                      <div 
                        className="absolute -inset-[7.5px] rounded-full border-[0.75px] border-cyan-400 animate-ping pointer-events-none"
                        style={{
                          animationDuration: '2.8s',
                          opacity: 0.21,
                          boxShadow: '0 0 13.5px #00F0FF'
                        }}
                      />

                      {/* Scanning laser beam on granted authorization */}
                      {isSelected && authStatus === 'granted' && (
                        <div className="absolute inset-0 rounded-full bg-emerald-500/35 overflow-hidden z-30 pointer-events-none">
                          <div className="w-full h-3 bg-emerald-400 shadow-[0_0_25px_#10B981] animate-scanline" />
                        </div>
                      )}

                      {/* Crystal-Clear Inner Pod: 3 User Images are 100% VISIBLE INSIDE with NO obstruction */}
                      <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-950 border-[1.5px] border-cyan-400/80 z-10 flex items-center justify-center shadow-2xl">
                        <img
                          src={imageSrc}
                          alt="Security Node Identity"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // If direct dropbox link is blocked, try without referrers
                            (e.target as HTMLImageElement).referrerPolicy = 'no-referrer';
                          }}
                          className="w-full h-full object-cover object-center rounded-full transition-transform duration-500 group-hover:scale-108"
                        />

                        {/* Subtle Electric Rim Highlight */}
                        <div className="absolute inset-0 rounded-full border border-cyan-400/30 pointer-events-none" />

                        {/* Direct image upload button overlay on hover if user wants to swap local image */}
                        <div 
                          onClick={(e) => triggerUpload(operator.id, e)}
                          title="Click to load direct image file from your device"
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer z-20 backdrop-blur-xs"
                        >
                          <Upload className="w-5 h-5 text-cyan-400 mb-1" />
                          <span className="text-[10px] font-mono text-cyan-200 font-bold uppercase">Change Image</span>
                        </div>

                        {/* Short-circuit distortion overlay */}
                        {isSelected && isShortCircuit && (
                          <div className="absolute inset-0 bg-red-600/40 mix-blend-hard-light animate-spark-strobe pointer-events-none" />
                        )}
                      </div>

                      {/* Electric Fire Spark Nodes around perimeter */}
                      <div className="absolute -inset-1.5 rounded-full pointer-events-none flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-cyan-300 animate-ping absolute -top-1 shadow-[0_0_8px_#00F0FF]" />
                        <div className="w-2 h-2 rounded-full bg-orange-400 animate-ping absolute -bottom-1 shadow-[0_0_8px_#FF8800]" style={{ animationDelay: '0.5s' }} />
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping absolute -left-1 shadow-[0_0_8px_#A855F7]" style={{ animationDelay: '0.9s' }} />
                        <div className="w-2 h-2 rounded-full bg-yellow-300 animate-ping absolute -right-1 shadow-[0_0_8px_#FFE600]" style={{ animationDelay: '1.3s' }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Orbit Controls & Image Loader Bar */}
        <div className="flex items-center gap-3 mt-3 flex-wrap justify-center">
          <button
            onClick={() => {
              setIsRotating(prev => !prev);
              sound.playKey(550);
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900/90 border border-slate-800 rounded-xl hover:border-cyan-500 hover:text-white transition-all shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRotating && !selectedOperator ? 'animate-spin' : ''}`} />
            <span>{isRotating && !selectedOperator ? 'Orbiting' : 'Orbit Paused'}</span>
          </button>

          {/* Quick Upload Button for all 3 nodes */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-slate-400">Load Device Image:</span>
            {OPERATORS.map((op, idx) => (
              <button
                key={op.id}
                onClick={(e) => triggerUpload(op.id, e)}
                className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 rounded transition-colors"
              >
                Node {idx + 1}
              </button>
            ))}
          </div>

          {selectedOperator && (
            <button
              onClick={() => {
                setSelectedOperator(null);
                setPinInput('');
                setIsRotating(true);
                setIsShortCircuit(false);
                sound.playKey(440);
              }}
              className="text-xs text-slate-400 hover:text-white underline underline-offset-4"
            >
              Cancel Selection
            </button>
          )}
        </div>

        {/* Contextual PIN Keypad - Concealed PIN */}
        {selectedOperator && (
          <div className="mt-4 w-full max-w-xs z-40 relative">
            {/* Spark bursts on electrical short-circuit */}
            {isShortCircuit && sparkParticles.map(p => (
              <div
                key={p.id}
                className="absolute rounded-full bg-cyan-400 shadow-[0_0_10px_#00F0FF] pointer-events-none animate-ping"
                style={{
                  left: `calc(50% + ${p.x}px)`,
                  top: `calc(50% + ${p.y}px)`,
                  width: `${p.size}px`,
                  height: `${p.size}px`
                }}
              />
            ))}

            <div 
              className={`p-5 rounded-3xl border backdrop-blur-2xl transition-all duration-300 shadow-2xl relative overflow-hidden ${
                isShortCircuit
                  ? 'animate-short-circuit-glitch border-red-500 bg-red-950/85 shadow-[0_0_60px_rgba(255,0,0,0.7)]'
                  : authStatus === 'granted'
                  ? 'border-emerald-500 bg-emerald-950/75 shadow-[0_0_55px_rgba(16,185,129,0.6)]'
                  : 'border-cyan-500/40 bg-[#070D18]/95 shadow-[0_0_40px_rgba(0,240,255,0.25)]'
              }`}
            >
              {/* Electric fire top border beam */}
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{
                  background: isShortCircuit
                    ? 'linear-gradient(90deg, #FF0055, #FF5500, #FF0055)'
                    : 'linear-gradient(90deg, #00F0FF, #7000FF, #FF5500, #00F0FF)',
                  boxShadow: isShortCircuit ? '0 0 15px #FF0055' : '0 0 15px #00F0FF'
                }}
              />

              {/* Header */}
              <div className="flex items-center justify-between mb-3 text-xs">
                <div className="flex items-center gap-2 text-slate-200 font-extrabold tracking-wide">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Node {selectedOperator.id === 'node-1' ? '1' : selectedOperator.id === 'node-2' ? '2' : '3'} Security Challenge</span>
                </div>
                <span className="font-mono text-slate-500 text-[11px] font-bold">5 DIGITS</span>
              </div>

              {/* Masked PIN Display Dots */}
              <div className="flex items-center justify-center gap-3 mb-4 py-2.5 bg-slate-950/90 rounded-2xl border border-slate-800/90 shadow-inner">
                {[0, 1, 2, 3, 4].map((idx) => {
                  const hasDigit = idx < pinInput.length;
                  return (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                        authStatus === 'granted'
                          ? 'bg-emerald-400 shadow-[0_0_12px_#34D399] scale-110'
                          : isShortCircuit
                          ? 'bg-red-500 shadow-[0_0_12px_#FF0055] scale-110 animate-ping'
                          : hasDigit
                          ? 'bg-cyan-400 shadow-[0_0_10px_#00F0FF] scale-105'
                          : 'bg-slate-800 border border-slate-700'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Numeric Keypad Grid */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handleDigit(digit)}
                    disabled={authStatus === 'checking' || authStatus === 'granted' || isShortCircuit}
                    className="h-11 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-cyan-500/90 hover:bg-slate-800/90 text-base font-mono font-bold text-white transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  onClick={handleClear}
                  disabled={authStatus === 'checking' || authStatus === 'granted' || isShortCircuit}
                  className="h-11 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:bg-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                >
                  CLEAR
                </button>
                <button
                  onClick={() => handleDigit('0')}
                  disabled={authStatus === 'checking' || authStatus === 'granted' || isShortCircuit}
                  className="h-11 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-cyan-500/90 hover:bg-slate-800/90 text-base font-mono font-bold text-white transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                >
                  0
                </button>
                <button
                  onClick={handleBackspace}
                  disabled={authStatus === 'checking' || authStatus === 'granted' || isShortCircuit}
                  className="h-11 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:bg-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                >
                  DEL
                </button>
              </div>

              {/* Feedback footer */}
              <div className="mt-3 text-center text-xs">
                {authStatus === 'checking' && (
                  <span className="text-cyan-400 flex items-center justify-center gap-1.5 font-mono">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying cryptogram...
                  </span>
                )}
                {authStatus === 'granted' && (
                  <span className="text-emerald-400 font-extrabold flex items-center justify-center gap-1.5">
                    <Unlock className="w-3.5 h-3.5" /> High-Voltage Surge: Access Granted!
                  </span>
                )}
                {isShortCircuit && (
                  <span className="text-red-400 font-black flex items-center justify-center gap-1.5 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" /> SHORT-CIRCUIT: ACCESS DENIED
                  </span>
                )}
                {!isShortCircuit && authStatus === 'idle' && (
                  <span className="text-slate-400 text-[11px] font-mono">
                    Enter 5-digit encrypted passcode
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-30 px-8 py-3.5 border-t border-slate-800/80 bg-[#03060B]/90 flex items-center justify-between text-xs text-slate-500 font-mono">
        <div>
          <span>Playbeat Gateway High-Voltage Core</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shadow-[0_0_8px_#00F0FF]" />
          <span className="text-cyan-400 font-bold">3 Electric Fire Nodes Orbiting</span>
        </div>
      </footer>
    </div>
  );
};
