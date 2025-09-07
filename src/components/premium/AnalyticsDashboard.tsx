// src/components/premium/AnalyticsDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';
import { ThemedCard, ThemedButton, ThemedText, ThemedBadge } from '@/components/ui/ThemedComponents';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

// Mock data for analytics
const mockScanData = [
  { date: '1 Haz', scans: 45 },
  { date: '2 Haz', scans: 52 },
  { date: '3 Haz', scans: 48 },
  { date: '4 Haz', scans: 78 },
  { date: '5 Haz', scans: 65 },
  { date: '6 Haz', scans: 90 },
  { date: '7 Haz', scans: 110 },
];

const mockDeviceData = [
  { name: 'iPhone', value: 45 },
  { name: 'Android', value: 65 },
  { name: 'Windows', value: 20 },
  { name: 'Mac', value: 15 },
];

const mockLocationData = [
  { name: 'İstanbul', value: 85 },
  { name: 'Ankara', value: 42 },
  { name: 'İzmir', value: 35 },
  { name: 'Diğer', value: 28 },
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

export default function AnalyticsDashboard() {
  const { hasAnalyticsAccess } = useSubscriptionFeatures();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  if (!hasAnalyticsAccess) {
    return (
      <ThemedCard variant="default" className="p-6 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <ThemedText size="xl" weight="bold" className="mb-2">
          Premium Özellik
        </ThemedText>
        <ThemedText variant="muted" className="mb-4">
          Detaylı analizler için Pro veya Business planına yükseltmeniz gerekiyor.
        </ThemedText>
        <ThemedButton variant="primary" size="md">
          Premium Ol
        </ThemedButton>
      </ThemedCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <ThemedText size="2xl" weight="bold">
          📊 Analiz Panosu
        </ThemedText>
        
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <ThemedButton
              key={range}
              onClick={() => setTimeRange(range)}
              variant={timeRange === range ? 'primary' : 'outline'}
              size="sm"
            >
              {range === '7d' && '7 Gün'}
              {range === '30d' && '30 Gün'}
              {range === '90d' && '90 Gün'}
            </ThemedButton>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ThemedCard variant="primary" className="p-4">
          <ThemedText size="sm" variant="muted" className="mb-1">
            Toplam Tarama
          </ThemedText>
          <ThemedText size="2xl" weight="bold">
            1,248
          </ThemedText>
          <ThemedText size="xs" variant="accent">
            ↑ %12 bu ay
          </ThemedText>
        </ThemedCard>
        
        <ThemedCard variant="secondary" className="p-4">
          <ThemedText size="sm" variant="muted" className="mb-1">
            Benzersiz Ziyaretçi
          </ThemedText>
          <ThemedText size="2xl" weight="bold">
            856
          </ThemedText>
          <ThemedText size="xs" variant="accent">
            ↑ %8 bu ay
          </ThemedText>
        </ThemedCard>
        
        <ThemedCard variant="accent" className="p-4">
          <ThemedText size="sm" variant="muted" className="mb-1">
            Ort. Günlük Tarama
          </ThemedText>
          <ThemedText size="2xl" weight="bold">
            42
          </ThemedText>
          <ThemedText size="xs" variant="muted">
            ↑ %5 bu ay
          </ThemedText>
        </ThemedCard>
        
        <ThemedCard variant="default" className="p-4">
          <ThemedText size="sm" variant="muted" className="mb-1">
            QR Kod Sayısı
          </ThemedText>
          <ThemedText size="2xl" weight="bold">
            12
          </ThemedText>
          <ThemedText size="xs" variant="muted">
            3 aktif
          </ThemedText>
        </ThemedCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scan Trend */}
        <ThemedCard variant="default" className="p-6">
          <ThemedText weight="bold" className="mb-4">
            Tarama Eğilimi
          </ThemedText>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockScanData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  borderColor: '#4B5563', 
                  borderRadius: '0.5rem' 
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="scans" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                dot={{ stroke: '#8B5CF6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#8B5CF6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ThemedCard>

        {/* Device Distribution */}
        <ThemedCard variant="default" className="p-6">
          <ThemedText weight="bold" className="mb-4">
            Cihaz Dağılımı
          </ThemedText>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockDeviceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
              >
                {mockDeviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  borderColor: '#4B5563', 
                  borderRadius: '0.5rem' 
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </ThemedCard>
      </div>

      {/* Location Data */}
      <ThemedCard variant="default" className="p-6">
        <ThemedText weight="bold" className="mb-4">
          Konum Bazlı Taramalar
        </ThemedText>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mockLocationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                borderColor: '#4B5563', 
                borderRadius: '0.5rem' 
              }} 
            />
            <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ThemedCard>

      {/* Recent Activity */}
      <ThemedCard variant="default" className="p-6">
        <ThemedText weight="bold" className="mb-4">
          Son Aktiviteler
        </ThemedText>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-900/30 flex items-center justify-center">
                  📱
                </div>
                <div>
                  <ThemedText weight="medium">
                    iPhone 14 ile tarama
                  </ThemedText>
                  <ThemedText size="sm" variant="muted">
                    İstanbul, Türkiye
                  </ThemedText>
                </div>
              </div>
              <ThemedText size="sm" variant="muted">
                2 saat önce
              </ThemedText>
            </div>
          ))}
        </div>
      </ThemedCard>
    </div>
  );
}