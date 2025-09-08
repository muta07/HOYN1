'use client';

import { useState } from 'react';
import QRCodeLib from 'qrcode';
import { Profile } from '@/lib/firebase';
import { updateProfile, uploadProfileImage, incrementProfileStats } from '@/lib/firebase';
import { generateProfileQRUrl } from '@/lib/qr-utils'; // Import the function
import NeonButton from '@/components/ui/NeonButton';
import { useRouter } from 'next/navigation';

interface ProfileCardProps {
  profile: Profile;
  onDelete: (profileId: string) => void;
  onEdit: () => void;
  onView: () => void;
}

export default function ProfileCard({ profile, onDelete, onEdit, onView }: ProfileCardProps) {
  const router = useRouter();
  const [generatingQR, setGeneratingQR] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const generateQRCode = async () => {
    if (!profile.id) return;

    setGeneratingQR(true);
    try {
      // Generate QR code with profile URL using profile ID
      const qrUrl = generateProfileQRUrl(profile.id); // Use the correct function
      const qrDataUrl = await QRCodeLib.toDataURL(qrUrl, {
        width: 256,
        margin: 1,
        color: {
          dark: '#ffffff',
          light: '#000000'
        }
      });

      // Update profile with QR code URL
      const success = await updateProfile(profile.id, { 
        qrCodeUrl: qrDataUrl
      });
      if (success) {
        setQrCodeUrl(qrDataUrl);
        setShowQR(true);
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      alert('QR kodu oluşturulamadı');
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile.id) return;

    setUploadingImage(true);
    try {
      const imageUrl = await uploadProfileImage(profile.id, file);
      if (imageUrl) {
        await updateProfile(profile.id, { imageUrl });
        // Update local profile state
        onEdit(); // Trigger re-render
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Resim yüklenemedi');
    } finally {
      setUploadingImage(false);
    }
  };

  const getProfileIcon = (type: string) => {
    switch (type) {
      case 'personal': return '👤';
      case 'business': return '🏢';
      case 'car': return '🚗';
      case 'tshirt': return '👕';
      case 'pet': return '🐶';
      default: return '👤';
    }
  };

  const handleDelete = () => {
    if (confirm('Bu profili silmek istediğinizden emin misiniz?')) {
      onDelete(profile.id);
    }
  };

  return (
    <div className="group relative bg-gray-900 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all duration-200 overflow-hidden">
      {/* Profile Image */}
      <div className="mb-4">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-2 relative overflow-hidden">
          {profile.imageUrl ? (
            <img 
              src={profile.imageUrl} 
              alt={profile.displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-2xl">{getProfileIcon(profile.type)}</span>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Profile Info */}
      <div className="mb-4 text-center">
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
          {profile.displayName}
        </h3>
        <p className="text-sm text-gray-400 mb-2">@{profile.slug}</p>
        <p className="text-xs text-gray-500">{profile.bio || 'Henüz açıklama eklenmedi'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className="text-center bg-gray-800 rounded p-1">
          <div className="font-bold text-white">{profile.stats.views}</div>
          <div className="text-gray-400">Görüntüleme</div>
        </div>
        <div className="text-center bg-gray-800 rounded p-1">
          <div className="font-bold text-white">{profile.stats.scans}</div>
          <div className="text-gray-400">Tarama</div>
        </div>
        <div className="text-center bg-gray-800 rounded p-1">
          <div className="font-bold text-white">{profile.stats.messages}</div>
          <div className="text-gray-400">Mesaj</div>
        </div>
        <div className="text-center bg-gray-800 rounded p-1">
          <div className="font-bold text-white">{profile.stats.followers}</div>
          <div className="text-gray-400">Takipçi</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 mb-4">
        <NeonButton
          onClick={onView}
          variant="outline"
          size="sm"
          className="w-full"
          disabled={generatingQR}
        >
          👁️ Görüntüle
        </NeonButton>
        <NeonButton
          onClick={onEdit}
          variant="secondary"
          size="sm"
          className="w-full"
        >
          ✏️ Düzenle
        </NeonButton>
        <NeonButton
          onClick={handleDelete}
          variant="outline"
          size="sm"
          className="w-full"
        >
          🗑️ Sil
        </NeonButton>
      </div>

      {/* QR Code Generation */}
      <div className="space-y-2">
        <NeonButton
          onClick={generateQRCode}
          variant={showQR ? "outline" : "primary"}
          size="sm"
          className="w-full"
          disabled={generatingQR}
        >
          {generatingQR ? 'Oluşturuluyor...' : (showQR ? 'QR Görüntüle' : 'QR Oluştur')}
        </NeonButton>
        
        {showQR && (
          <div className="bg-white p-4 rounded-lg text-center">
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="mx-auto mb-2"
              style={{ width: '128px', height: '128px' }}
            />
            <p className="text-sm text-gray-700">Tarama için hazır!</p>
            <a
              href={qrCodeUrl}
              download={`hoyn-profile-${profile.id}.png`}
              className="text-xs text-blue-500 hover:underline block mt-1"
            >
              📥 İndir
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
