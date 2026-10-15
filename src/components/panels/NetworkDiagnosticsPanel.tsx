import React, { useState } from 'react';
import {
  Network,
  Activity,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Filter,
  ShieldCheck,
  Flame,
  Radio,
  FileText,
  Sliders,
  Bell,
  Clock,
  Download,
} from 'lucide-react';
import { NetworkTelemetry, NetworkPacket, HeatmapAlertRule, AutomatedRemedyLog } from '../../types';
import { audioEngine } from '../../utils/audioEngine';

interface NetworkDiagnosticsPanelProps {
  nodes: NetworkTelemetry[];
  packets: NetworkPacket[];
  alertRules: HeatmapAlertRule[];
  remedyLogs: AutomatedRemedyLog[];
  onTriggerRemedy: (nodeId: string, remedy: string) => void;
  onUpdateAlertRule: (ruleId: string, enabled: boolean, threshold: number) => void;
  onSimulateNewPacket?: () => void;
  rfScanActive: boolean;
  onToggleRfScan: () => void;
}

export const NetworkDiagnosticsPanel: React.FC<NetworkDiagnosticsPanelProps> = ({
  nodes,
  packets,
  alertRules,
  remedyLogs,
  onTriggerRemedy,
  onUpdateAlertRule,
  rfScanActive,
  onToggleRfScan,
}) => {
  const [subTab, setSubTab] = useState<'heatmap' | 'packets' | 'hardware' | 'remedies'>('heatmap');
  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodes[0]?.nodeId || 'mesh-node-01');
  const [selectedProtocol, setSelectedProtocol] = useState<string>('ALL');
  const [selectedPacket, setSelectedPacket] = useState<NetworkPacket | null>(packets[0] || null);
  const [isApplyingRemedy, setIsApplyingRemedy] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const selectedNode = nodes.find((n) => n.nodeId === selectedNodeId) || nodes[0];

  // Protocol filter
  const filteredPackets = packets.filter((p) => {
    if (selectedProtocol === 'ALL') return true;
    return p.protocol === selectedProtocol;
  });

  const handleApplyRemedy = (remedyName: string) => {
    setIsApplyingRemedy(true);
    audioEngine.playNote(65, 0.6);
    setTimeout(() => {
      onTriggerRemedy(selectedNode.nodeId, remedyName);
      setIsApplyingRemedy(false);
      audioEngine.playNote(72, 0.85);
    }, 750);
  };

  const handleDownloadArchivalReport = () => {
    const reportData = {
      archiveReportId: 'archive-net-diag-' + Date.now().toString(36),
      generatedAtIso: new Date().toISOString(),
      generatorEngine: 'TerraSphere Decentralized Network Inspector',
      telemetryNodes: nodes.map((n) => ({
        nodeId: n.nodeId,
        region: n.region,
        geographicCoordinates: { lat: n.lat, lng: n.lng },
        linkMetrics: {
          latencyMs: n.latencyMs,
          jitterMs: n.jitterMs,
          packetLossPct: n.packetLossPct,
          throughputMbps: n.throughputMbps,
          rssiDb: n.rssiDb,
          hardwareTempC: n.hardwareTempC,
          status: n.status,
          activeRemedy: n.activeRemedy,
        },
        hardwareDiagnostics: n.hardware,
      })),
      remedyExecutionHistory: remedyLogs,
      activeAlertThresholdRules: alertRules,
      capturedPacketFramesSample: packets.slice(0, 50),
      dataIntegrityHash: 'SHA256:LOCAL_' + Math.random().toString(16).substring(2, 10).toUpperCase(),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terrasphere-network-remedy-sensor-archive-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    audioEngine.playNote(79, 0.8);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="flex flex-col gap-3 text-slate-200 text-xs">
      {/* Sub-navigation pill row */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSubTab('heatmap')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              subTab === 'heatmap' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Regional Heatmap &amp; Alerts</span>
          </button>

          <button
            onClick={() => setSubTab('packets')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              subTab === 'packets' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Packet Inspector ({filteredPackets.length})</span>
          </button>

          <button
            onClick={() => setSubTab('hardware')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              subTab === 'hardware' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Sensor Hardware Oversight</span>
          </button>

          <button
            onClick={() => setSubTab('remedies')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              subTab === 'remedies' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Auto Remedies ({remedyLogs.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onToggleRfScan();
              audioEngine.playNote(76, 0.6);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors shadow-sm ${
              rfScanActive
                ? 'bg-cyan-600 text-white border-cyan-400 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/30'
            }`}
            title="Toggle FM/AM/HAM Radio Frequency Scan waterfall plot overlay in 3D Globe"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>{rfScanActive ? 'RF Scan: ON' : 'Enable RF Waterfall Scan'}</span>
          </button>

          <button
            onClick={handleDownloadArchivalReport}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white px-2.5 py-1 rounded-lg border border-cyan-500/30 text-[11px] font-medium transition-colors shadow-sm"
            title="Generate and download local JSON report of remedy logs and sensor diagnostics"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>{downloadSuccess ? 'Downloaded!' : 'Export Diagnostics Archive (.json)'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Local Sovereign</span>
          </div>
        </div>
      </div>

      {/* 1. HEATMAP & AUTOMATED ALERT TRIGGERS */}
      {subTab === 'heatmap' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Node Selector & Heatmap Spectrum */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-cyan-400">Mesh Telemetry Nodes</span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {nodes.map((node) => (
                <div
                  key={node.nodeId}
                  onClick={() => setSelectedNodeId(node.nodeId)}
                  className={`p-2 rounded-xl cursor-pointer border transition-colors ${
                    selectedNode.nodeId === node.nodeId
                      ? 'bg-cyan-950/70 border-cyan-400 text-white'
                      : 'bg-slate-800/70 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{node.region}</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                        node.status === 'healthy'
                          ? 'bg-emerald-600/80 text-white'
                          : node.status === 'degraded'
                          ? 'bg-amber-600/80 text-white'
                          : 'bg-red-600/80 text-white'
                      }`}
                    >
                      {node.status}
                    </span>
                  </div>

                  {/* Heatmap Bar */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full ${
                          node.latencyMs < 30 ? 'bg-emerald-400' : node.latencyMs < 60 ? 'bg-amber-400' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, (node.latencyMs / 100) * 100)}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-cyan-300">{node.latencyMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Heatmap Statistics */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-white block mb-2">Selected Node: {selectedNode.region}</span>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between p-1.5 bg-slate-900/80 rounded border border-slate-700">
                  <span className="text-slate-400">Round-Trip Latency:</span>
                  <span className={selectedNode.latencyMs > 50 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {selectedNode.latencyMs} ms
                  </span>
                </div>
                <div className="flex justify-between p-1.5 bg-slate-900/80 rounded border border-slate-700">
                  <span className="text-slate-400">Jitter Variance:</span>
                  <span className="text-white">{selectedNode.jitterMs} ms</span>
                </div>
                <div className="flex justify-between p-1.5 bg-slate-900/80 rounded border border-slate-700">
                  <span className="text-slate-400">Packet Loss Rate:</span>
                  <span className={selectedNode.packetLossPct > 1 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {selectedNode.packetLossPct}%
                  </span>
                </div>
                <div className="flex justify-between p-1.5 bg-slate-900/80 rounded border border-slate-700">
                  <span className="text-slate-400">Active Throughput:</span>
                  <span className="text-cyan-400 font-bold">{selectedNode.throughputMbps} Mbps</span>
                </div>
              </div>
            </div>

            {selectedNode.activeRemedy ? (
              <div className="p-2 bg-emerald-950/60 rounded border border-emerald-500/40 text-[10px] text-emerald-300 flex items-center gap-1.5 mt-2">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">Active: {selectedNode.activeRemedy}</span>
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 mt-2">Nominal link stability confirmed.</div>
            )}
          </div>

          {/* Automated Alert Rules & Triggers */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-1 mb-2">
                <span className="font-semibold text-cyan-400 flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5" />
                  Automated Degradation Rules
                </span>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {alertRules.map((rule) => (
                  <div key={rule.id} className="p-2 bg-slate-900/80 rounded-lg border border-slate-700 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{rule.name}</span>
                      <input
                        type="checkbox"
                        checked={rule.autoRemedyEnabled}
                        onChange={(e) => onUpdateAlertRule(rule.id, e.target.checked, rule.threshold)}
                        className="rounded accent-cyan-500"
                        title="Toggle Auto Remedy"
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Threshold: &gt; {rule.threshold}</span>
                      <span className="text-cyan-300 truncate max-w-[150px]">{rule.remedyAction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[10px] text-slate-400 mt-2">
              Automated rules trigger local self-healing remedy actions without external telemetry.
            </div>
          </div>
        </div>
      )}

      {/* 2. PACKET INSPECTOR */}
      {subTab === 'packets' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Packet Table Stream with Protocol Filter */}
          <div className="md:col-span-2 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-cyan-400">Decentralized Frame Capture</span>
              <div className="flex items-center gap-1">
                {(['ALL', 'MQTT', 'CoAP', 'TCP', 'DNS', 'ICMP'] as const).map((proto) => (
                  <button
                    key={proto}
                    onClick={() => setSelectedProtocol(proto)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                      selectedProtocol === proto ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {proto}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {filteredPackets.map((pkt) => (
                <div
                  key={pkt.id}
                  onClick={() => setSelectedPacket(pkt)}
                  className={`p-2 rounded-xl cursor-pointer border font-mono text-[11px] transition-colors ${
                    selectedPacket?.id === pkt.id
                      ? 'bg-cyan-950/70 border-cyan-400 text-white'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold">[{pkt.protocol}] {pkt.sourceNode} -&gt; {pkt.destNode}</span>
                    <span
                      className={`text-[9px] px-1 rounded font-bold ${
                        pkt.flag === 'NORMAL'
                          ? 'bg-emerald-800 text-emerald-200'
                          : pkt.flag === 'RETRY'
                          ? 'bg-amber-800 text-amber-200'
                          : 'bg-red-800 text-red-200'
                      }`}
                    >
                      {pkt.flag}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 truncate">
                    <span>{pkt.timestamp} | {pkt.lengthBytes}B | {pkt.latencyMs}ms</span>
                    <span className="truncate max-w-[180px]">{pkt.payloadSnippet}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Packet Deep Inspection Card */}
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            {selectedPacket ? (
              <div>
                <span className="font-semibold text-white block mb-2 border-b border-slate-700/60 pb-1">
                  Inspection: {selectedPacket.id}
                </span>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between">
                    <span className="text-slate-400">Timestamp:</span>
                    <span className="text-white">{selectedPacket.timestamp}</span>
                  </div>
                  <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between">
                    <span className="text-slate-400">Protocol:</span>
                    <span className="text-cyan-400 font-bold">{selectedPacket.protocol}</span>
                  </div>
                  <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between">
                    <span className="text-slate-400">Frame Checksum:</span>
                    <span className={selectedPacket.checksumValid ? 'text-emerald-400' : 'text-red-400 font-bold'}>
                      {selectedPacket.checksumValid ? 'CRC32 OK' : 'CRC32 MISMATCH'}
                    </span>
                  </div>
                  <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between">
                    <span className="text-slate-400">Wire Length:</span>
                    <span className="text-white">{selectedPacket.lengthBytes} Octets</span>
                  </div>

                  <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700">
                    <span className="text-slate-400 block mb-0.5">Payload Hex/ASCII Dump:</span>
                    <div className="text-[10px] text-cyan-300 break-all bg-slate-950 p-1.5 rounded">
                      {selectedPacket.payloadSnippet}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-center my-auto">Select a packet from the trace stream.</div>
            )}

            <div className="text-[10px] text-slate-400 mt-2">
              Deep packet inspection operates on-device in browser memory with zero cloud egress.
            </div>
          </div>
        </div>
      )}

      {/* 3. SENSOR HARDWARE OVERSIGHT */}
      {subTab === 'hardware' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
            <span className="font-semibold text-cyan-400 block mb-2">RF Front-End Diagnostics</span>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between">
                <span className="text-slate-400">Antenna VSWR:</span>
                <span className={selectedNode.hardware.vswr < 1.5 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {selectedNode.hardware.vswr} : 1 ({selectedNode.hardware.vswr < 1.5 ? 'Optimal' : 'Reflected Power High'})
                </span>
              </div>
              <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between">
                <span className="text-slate-400">TX Power:</span>
                <span className="text-white">{selectedNode.hardware.txPowerDbm} dBm (500mW)</span>
              </div>
              <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between">
                <span className="text-slate-400">Frequency Drift:</span>
                <span className="text-white">±{selectedNode.hardware.freqDriftPpm} PPM</span>
              </div>
              <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between">
                <span className="text-slate-400">Ambient Noise Floor:</span>
                <span className="text-slate-300">{selectedNode.hardware.ambientNoiseFloorDbm} dBm</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
            <span className="font-semibold text-cyan-400 block mb-2">Power Subsystem & Thermal</span>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between">
                <span className="text-slate-400">Power Rail:</span>
                <span className="text-emerald-400 font-bold">{selectedNode.hardware.voltageV} V DC</span>
              </div>
              <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between">
                <span className="text-slate-400">Battery Health:</span>
                <span className="text-white font-bold">{selectedNode.hardware.batteryHealthPct}%</span>
              </div>
              <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between">
                <span className="text-slate-400">PA Thermal Core:</span>
                <span className={selectedNode.hardwareTempC > 40 ? 'text-amber-400 font-bold' : 'text-white'}>
                  {selectedNode.hardwareTempC}°C
                </span>
              </div>
              <div className="p-1.5 bg-slate-900/80 rounded border border-slate-700 flex justify-between">
                <span className="text-slate-400">Continuous Uptime:</span>
                <span className="text-slate-300">{selectedNode.hardware.uptimeHours} Hours</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-cyan-400 block mb-2">Hardware Remediation Actions</span>
              <div className="space-y-1.5">
                <button
                  disabled={isApplyingRemedy}
                  onClick={() => handleApplyRemedy('Calibrate Voltage Standing Wave Ratio (VSWR)')}
                  className="w-full text-left p-1.5 bg-slate-900 hover:bg-slate-750 border border-slate-700 rounded text-[11px] text-white flex items-center justify-between"
                >
                  <span>Auto-Tune Antenna Matching</span>
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isApplyingRemedy ? 'animate-spin' : ''}`} />
                </button>
                <button
                  disabled={isApplyingRemedy}
                  onClick={() => handleApplyRemedy('Throttle Output TX Power & Fan Subsystem Boost')}
                  className="w-full text-left p-1.5 bg-slate-900 hover:bg-slate-750 border border-slate-700 rounded text-[11px] text-white flex items-center justify-between"
                >
                  <span>Engage Thermal Fan Cooling</span>
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isApplyingRemedy ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 mt-2">
              Continuous hardware polling frequency: 100ms internal interrupt clock.
            </div>
          </div>
        </div>
      )}

      {/* 4. AUTOMATED REMEDY LOGS */}
      {subTab === 'remedies' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
            <span className="font-semibold text-cyan-400 block mb-2">Autonomous Recovery Incident Log</span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {remedyLogs.map((log) => (
                <div key={log.id} className="p-2 bg-slate-900/80 rounded-lg border border-slate-700 text-[11px]">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-white font-bold">{log.nodeId}</span>
                    <span className="text-slate-400">{log.timestamp}</span>
                  </div>
                  <div className="mt-1 text-amber-300 font-mono text-[10px]">Trigger: {log.triggerCondition}</div>
                  <div className="mt-1 text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Action: {log.actionTaken}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-white block mb-2">Remedy Execution Engine</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                When signal attenuation, packet corruption, or hardware overheating is detected, self-healing remedy protocols execute locally without external control traffic.
              </p>
            </div>

            <div className="p-2 bg-emerald-950/60 rounded border border-emerald-500/40 text-[10px] text-emerald-300 flex items-center gap-1.5 mt-2">
              <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Offline Autonomy: 100% Self-Healing</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
