# Hoyn QR Tarayıcı Modülü
# Bu modül, QR kodlarını tarar, doğrular ve profil sayfasına yönlendirir.
# Doğrulama adımları: sistem kimliği, zaman damgası, hash kontrolü.
# Üçüncü parti tarayıcı koruması: User-Agent kontrolü ile uyarı.
# Gerekli kütüphaneler: qrcode, cryptography, base64, json, time, requests (simülasyon için).
# Kurulum: pip install qrcode cryptography

import base64
import json
import time
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
import qrcode
from io import BytesIO
import os
from urllib.parse import urlparse

# Şifreleme anahtarı (qr_uretici.py ile aynı olmalı)
ENCRYPTION_KEY = b'example_key_32_bytes_long_12345'  # Gerçekte güvenli yönetilmeli
cipher_suite = Fernet(Fernet.generate_key())  # Demo için, aynı anahtar ile senkronize edilmeli
from guvenlik import guvenlik_yoneticisi
cipher_suite = guvenlik_yoneticisi.cipher_suite  # Güvenlik modülünden anahtar al

# Basit veritabanı simülasyonu (gerçekte veritabani.py kullanılacak)
PROFIL_VERITABANI = {
    "test-profile-1": {"isim": "Cumhur", "mesaj": "Hoş Geldiniz! 🎉"},
    "test-profile-2": {"isim": "Kullanıcı", "mesaj": "Profilinize Hoş Geldiniz!"}
}

def qr_veri_coz(sifrelenmis_base64: str) -> dict:
    """
    Şifrelenmiş QR verisini çözer.
    Girdiler: sifrelenmis_base64 (str)
    Çıktı: Çözülmüş payload dict veya None (hata durumunda)
    """
    try:
        sifrelenmis = base64.b64decode(sifrelenmis_base64)
        cozulmus = guvenlik_yoneticisi.veri_coz(sifrelenmis_base64)
        if cozulmus is None:
            return None
        return cozulmus
    except Exception as e:
        print(f"Şifre çözme hatası: {e}")
        return None

def hash_dogrula(payload: dict) -> bool:
    """
    Payload'un hash'ini doğrular.
    Girdiler: payload (dict)
    Çıktı: bool (doğru mu?)
    """
    try:
        # Hash hesapla (profil_id, sistem_kimligi, zaman_damgasi)
        veri = json.dumps({
            "profil_id": payload["profil_id"],
            "sistem_kimligi": payload["sistem_kimligi"],
            "zaman_damgasi": payload["zaman_damgasi"]
        }).encode()
        hash_nesnesi = hashes.Hash(hashes.SHA256())
        hash_nesnesi.update(veri)
        hesaplanan_hash = hash_nesnesi.finalize().hex()
        return hesaplanan_hash == payload["hash"]
    except Exception:
        return False

def zaman_damgasi_gecerli_mi(zaman_damgasi: int) -> bool:
    """
    Zaman damgasının 5 dakika içinde olup olmadığını kontrol eder.
    Girdiler: zaman_damgasi (int)
    Çıktı: bool
    """
    mevcut_zaman = int(time.time())
    return (mevcut_zaman - zaman_damgasi) <= 300  # 5 dakika = 300 saniye

def profil_var_mi(profil_id: str) -> bool:
    """
    Profilin veritabanında var olup olmadığını kontrol eder.
    Girdiler: profil_id (str)
    Çıktı: bool
    """
    return profil_id in PROFIL_VERITABANI

def qr_tara_ve_dogrula(qr_veri: str, user_agent: str = None, tarayici_tipi: str = "hoyn_scanner") -> dict:
    """
    QR kodunu tarar ve doğrular. Tarayıcı tipine göre işlem yapar.
    Girdiler: qr_veri (base64 QR string veya raw data), user_agent (str), tarayici_tipi (str)
    Çıktı: dict (sonuç: 'basarili', 'uyari', 'hata'; mesaj: str; profil_bilgisi: dict)
    """
    # Önce veriyi çöz
    payload = qr_veri_coz(qr_veri)
    if not payload:
        return {
            "sonuc": "hata",
            "mesaj": "⚠️ Bu bir Hoyn QR kodu değildir. Yine de bu bağlantıyı ziyaret etmek istiyor musunuz?",
            "profil_bilgisi": None
        }
    
    # Sistem kimliği kontrolü
    if payload.get("sistem_kimligi") != "HOYN_QR_V1":
        return {
            "sonuc": "uyari",
            "mesaj": "⚠️ Bu bir Hoyn QR kodu değildir. Yine de devam etmek ister misiniz? [Evet] [Hayır]",
            "profil_bilgisi": None
        }
    
    # Hash doğrulama
    if not hash_dogrula(payload):
        return {
            "sonuc": "hata",
            "mesaj": "🔐 QR kodu doğrulanamadı. Lütfen yeni bir QR oluşturun.",
            "profil_bilgisi": None
        }
    
    # Zaman damgası kontrolü
    if not zaman_damgasi_gecerli_mi(payload["zaman_damgasi"]):
        return {
            "sonuc": "hata",
            "mesaj": "⏰ QR kodu süresi dolmuş. Lütfen yeni bir tane oluşturun.",
            "profil_bilgisi": None
        }
    
    # Profil kontrolü
    profil_id = payload["profil_id"]
    if not profil_var_mi(profil_id):
        return {
            "sonuc": "hata",
            "mesaj": "👤 Profil bulunamadı.",
            "profil_bilgisi": None
        }
    
    # Tarayıcı tipi kontrolü (üçüncü parti koruma)
    if tarayici_tipi != "hoyn_scanner":
        return {
            "sonuc": "uyari",
            "mesaj": "🔐 Bu QR kodu yalnızca Hoyn QR Tarayıcı ile okunabilir. Lütfen uygulamamızı indirin: [indir.hoyn.app]",
            "profil_bilgisi": None
        }
    
    # Başarılı: Profil bilgisini döndür
    profil_bilgisi = PROFIL_VERITABANI[profil_id]
    return {
        "sonuc": "basarili",
        "mesaj": f"{profil_bilgisi['isim']} Profiline Hoş Geldiniz! 🎉",
        "profil_bilgisi": profil_bilgisi
    }

# QR görüntüsünden veri çıkarma (simülasyon)
def qr_resminden_veri_cek(qr_base64: str) -> str:
    """
    Base64 QR resminden veriyi çeker (gerçekte kamera tarama simülasyonu).
    Girdiler: qr_base64 (str)
    Çıktı: Çözülmüş veri string
    """
    try:
        qr_img_data = base64.b64decode(qr_base64)
        img = BytesIO(qr_img_data)
        qr = qrcode.QRCode()
        # Gerçek tarama için external library (pyzbar) kullanılabilir
        # Burada simülasyon: Base64'ten doğrudan veri al (test için)
        # Gerçek implementasyonda: qr.decode(img)
        return "simüle_edilmiş_veri"  # TODO: Gerçek decoding
    except Exception:
        return None

# Test fonksiyonu
if __name__ == "__main__":
    # Test QR verisi (qr_uretici.py'den)
    from qr_uretici import sifrelenmis_veri_olustur
    test_profil_id = "test-profile-1"
    test_veri = sifrelenmis_veri_olustur(test_profil_id)
    
    # Hoyn scanner ile test
    sonuc = qr_tara_ve_dogrula(test_veri, tarayici_tipi="hoyn_scanner")
    print("Hoyn Scanner Sonuç:", sonuc)
    
    # Üçüncü parti ile test
    sonuc2 = qr_tara_ve_dogrula(test_veri, tarayici_tipi="third_party")
    print("Üçüncü Parti Sonuç:", sonuc2)
