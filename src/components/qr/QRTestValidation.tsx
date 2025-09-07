// src/components/qr/QRTestValidation.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQR } from '@/hooks/useQR';
import QRCodeWrapper from './QRCodeWrapper';
import NeonButton from '@/components/ui/NeonButton';
import AnimatedCard from '@/components/ui/AnimatedCard';

interface PerformanceMetrics {
  authLoadTime: number | null;
  qrGenerationTime: number | null;
  downloadTime: number | null;
  renderTime: number | null;
}

export default function QRTestValidation() {
  const { user, profile, loading: authLoading } = useAuth();
  const qr = useQR(user, profile);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    authLoadTime: null,
    qrGenerationTime: null,
    downloadTime: null,
    renderTime: null
  });
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const authStartTime = useRef<number>(Date.now());
  const qrStartTime = useRef<number | null>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  // Track auth load time
  useEffect(() => {
    if (!authLoading && user) {
      const authTime = Date.now() - authStartTime.current;
      setMetrics(prev => ({ ...prev, authLoadTime: authTime }));
      addTestResult(`✅ Auth loaded in ${authTime}ms`);
    }
  }, [authLoading, user]);

  // Track QR generation time
  useEffect(() => {
    if (user && !qr.qrState.isGenerating && qr.isReady) {
      if (qrStartTime.current) {
        const qrTime = Date.now() - qrStartTime.current;
        setMetrics(prev => ({ ...prev, qrGenerationTime: qrTime }));
        addTestResult(`✅ QR generated in ${qrTime}ms`);
        qrStartTime.current = null;
        
        // Test render time
        testRenderTime();
      }
    }
  }, [user, qr.qrState.isGenerating, qr.isReady]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [result, ...prev.slice(0, 9)]);
  };

  const testRenderTime = () => {
    const renderStart = Date.now();
    
    // Use requestAnimationFrame to measure actual render completion
    requestAnimationFrame(() => {
      const renderTime = Date.now() - renderStart;
      setMetrics(prev => ({ ...prev, renderTime }));
      addTestResult(`✅ QR rendered in ${renderTime}ms`);
    });
  };

  const testDownloadSpeed = async () => {
    if (!downloadRef.current || !user) return;
    
    try {
      const downloadStart = Date.now();
      
      // Test download functionality
      await qr.downloadQR('test-qr-container', 'test-qr-download');
      
      const downloadTime = Date.now() - downloadStart;
      setMetrics(prev => ({ ...prev, downloadTime }));
      addTestResult(`✅ Download completed in ${downloadTime}ms`);
      
    } catch (error) {
      addTestResult(`❌ Download failed: ${(error as Error).message}`);
    }
  };

  const runCompleteTest = async () => {
    setIsRunningTest(true);
    setTestResults([]);
    setMetrics({
      authLoadTime: null,
      qrGenerationTime: null,
      downloadTime: null,
      renderTime: null
    });

    try {
      addTestResult('🚀 Starting comprehensive QR test...');
      
      // Test 1: QR Generation Speed
      qrStartTime.current = Date.now();
      await qr.generateQR();
      
      // Wait a bit for render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Test 2: Download Functionality
      await testDownloadSpeed();
      
      // Test 3: Type Switching Speed
      const typeStart = Date.now();
      qr.setQRType('anonymous');
      await new Promise(resolve => setTimeout(resolve, 50));
      qr.setQRType('profile');
      const typeTime = Date.now() - typeStart;
      addTestResult(`✅ Type switching in ${typeTime}ms`);
      
      // Test 4: Settings Update Speed
      const settingsStart = Date.now();
      qr.updateSettings({ size: 300 });
      await new Promise(resolve => setTimeout(resolve, 50));
      qr.updateSettings({ size: 256 });
      const settingsTime = Date.now() - settingsStart;
      addTestResult(`✅ Settings update in ${settingsTime}ms`);
      
      addTestResult('🎉 All tests completed successfully!');
      
    } catch (error) {
      addTestResult(`❌ Test failed: ${(error as Error).message}`);
    } finally {
      setIsRunningTest(false);
    }
  };

  // Check acceptance criteria
  const checkAcceptanceCriteria = () => {
    const criteria = [
      {
        name: 'QR Generation < 1 second',
        status: metrics.qrGenerationTime !== null ? metrics.qrGenerationTime < 1000 : null,
        value: metrics.qrGenerationTime
      },
      {
        name: 'Auth Load < 2 seconds',
        status: metrics.authLoadTime !== null ? metrics.authLoadTime < 2000 : null,
        value: metrics.authLoadTime
      },
      {
        name: 'Download Always Works',
        status: metrics.downloadTime !== null ? metrics.downloadTime > 0 : null,
        value: metrics.downloadTime
      },
      {
        name: 'Render Time < 100ms',
        status: metrics.renderTime !== null ? metrics.renderTime < 100 : null,
        value: metrics.renderTime
      }
    ];

    return criteria;
  };

  if (authLoading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🧪</div>
          <p className="text-gray-400">Test environment loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-gray-400">Login required for testing</p>
        </div>
      </div>
    );
  }

  const criteria = checkAcceptanceCriteria();
  const allCriteriaMet = criteria.every(c => c.status === true);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Test QR Display */}
      <AnimatedCard className="flex flex-col items-center space-y-6">
        <h2 className="text-3xl font-bold text-white glow-text">🧪 QR Performance Test</h2>
        
        <div 
          id="test-qr-container" 
          ref={downloadRef}
          className="p-6 bg-white rounded-xl"
        >
          {qr.isReady ? (
            <QRCodeWrapper 
              value={qr.qrValue} 
              size={qr.qrState.settings.size} 
              bgColor={qr.qrState.settings.bgColor} 
              fgColor={qr.qrState.settings.fgColor}
              className=""
              onReady={() => {
                if (qrStartTime.current) {
                  const qrTime = Date.now() - qrStartTime.current;
                  setMetrics(prev => ({ ...prev, qrGenerationTime: qrTime }));
                  addTestResult(`✅ QR ready in ${qrTime}ms`);
                }
              }}
            />
          ) : (
            <div 
              className="flex items-center justify-center bg-gray-100 rounded"
              style={{ width: 256, height: 256 }}
            >
              <div className="text-center">
                <div className="text-6xl mb-2 opacity-50">⏱️</div>
                <p className="text-gray-400 text-sm">Generating QR...</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <NeonButton
            onClick={runCompleteTest}
            variant="primary"
            size="lg"
            glow
            disabled={isRunningTest}
          >
            {isRunningTest ? '🧪 Testing...' : '🚀 Run Full Test'}
          </NeonButton>
          
          <NeonButton
            onClick={testDownloadSpeed}
            variant="outline"
            size="lg"
            disabled={!qr.isReady || isRunningTest}
          >
            📥 Test Download
          </NeonButton>
        </div>
      </AnimatedCard>

      {/* Acceptance Criteria */}
      <AnimatedCard className="glass-effect p-6 rounded-xl cyber-border">
        <h3 className="text-2xl font-bold text-white mb-6 glow-text">📊 Acceptance Criteria</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {criteria.map((criterion, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border-2 transition-all ${
                criterion.status === true 
                  ? 'border-green-500 bg-green-900/20' 
                  : criterion.status === false 
                    ? 'border-red-500 bg-red-900/20'
                    : 'border-gray-600 bg-gray-800/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{criterion.name}</span>
                <span className="text-2xl">
                  {criterion.status === true ? '✅' : criterion.status === false ? '❌' : '⏳'}
                </span>
              </div>
              {criterion.value !== null && (
                <p className="text-sm text-gray-400 mt-1">
                  Current: {criterion.value}ms
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <div className={`text-2xl font-bold ${allCriteriaMet ? 'text-green-400' : 'text-gray-400'}`}>
            {allCriteriaMet ? '🎉 All Criteria Met!' : '⏳ Testing in Progress...'}
          </div>
        </div>
      </AnimatedCard>

      {/* Test Results */}
      <AnimatedCard className="glass-effect p-6 rounded-xl cyber-border">
        <h3 className="text-2xl font-bold text-white mb-6 glow-text">📝 Test Results</h3>
        
        {testResults.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {testResults.map((result, index) => (
              <div 
                key={index}
                className="p-3 bg-gray-800/30 rounded-lg border border-gray-600 font-mono text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{result}</span>
                  <span className="text-xs text-gray-500">
                    {new Date().toLocaleTimeString('tr-TR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4 opacity-50">📊</div>
            <p className="text-gray-400">No test results yet</p>
            <p className="text-sm text-gray-500 mt-1">Run tests to see performance metrics</p>
          </div>
        )}
      </AnimatedCard>

      {/* Performance Metrics Summary */}
      <AnimatedCard className="glass-effect p-6 rounded-xl cyber-border">
        <h3 className="text-2xl font-bold text-white mb-6 glow-text">⚡ Performance Summary</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">
              {metrics.authLoadTime || '-'}
            </div>
            <div className="text-sm text-gray-400">Auth Load (ms)</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">
              {metrics.qrGenerationTime || '-'}
            </div>
            <div className="text-sm text-gray-400">QR Generation (ms)</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">
              {metrics.renderTime || '-'}
            </div>
            <div className="text-sm text-gray-400">Render Time (ms)</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">
              {metrics.downloadTime || '-'}
            </div>
            <div className="text-sm text-gray-400">Download (ms)</div>
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
}