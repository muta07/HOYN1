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

from guvenlik import guvenlik_yoneticisi

# Basit veritabanı simülasyonu (gerçekte veritabani.py kullanılacak)
# Bu fonksiyon artık kullanılmıyor, veritabani.py'deki fonksiyon kullanılacak
PROFIL_VERITABANI = {
    "test-profile-1": {"isim": "Cumhur", "mesaj": "Hoş Geldiniz! 🎉"},
    "test-profile-2": {"isim": "Kullanıcı", "mesaj": "Profilinize Hoş Geldiniz!"}
}

def profil_var_mi(profil_id: str) -> bool:
    """
    Profilin veritabanında var olup olmadığını kontrol eder.
    Girdiler: profil_id (str)
    Çıktı: bool
    """
    # Gerçek uygulamada veritabani.py'deki fonksiyon kullanılacak
    # Bu sadece test için burada bırakılmıştır
    from veritabani import profil_var_mi as db_profil_var_mi
    return db_profil_var_mi(profil_id)

def qr_veri_coz(sifrelenmis_base64: str) -> dict:
    """
    Şifrelenmiş QR verisini çözer.
    Girdiler: sifrelenmis_base64 (str)
    Çıktı: Çözülmüş payload dict veya None (hata durumunda)
    """
    try:
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
        hash_verisi = {
            "profil_id": payload["profil_id"],
            "sistem_kimligi": payload["sistem_kimligi"],
            "zaman_damgasi": payload["zaman_damgasi"]
        }
        hesaplanan_hash = guvenlik_yoneticisi.hmac_hash_olustur(hash_verisi)
        return guvenlik_yoneticisi.hmac_hash_dogrula(hash_verisi, payload["hash"])
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

def qr_tara_ve_dogrula(qr_veri: str, user_agent: str = None, tarayici_tipi: str = "hoyn_scanner") -> dict:
    """
    QR kodunu tarar ve doğrular. Tarayıcı tipine göre işlem yapar.
    Girdiler: qr_veri (base64 QR string veya raw data), user_agent (str), tarayici_tipi (str)
    Çıktı: dict (sonuc: 'basarili', 'uyari', 'hata'; mesaj: str; profil_bilgisi: dict)
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
    
    # Tam doğrulama (hash + zaman damgası)
    dogru_mu, dogru_mesaj = guvenlik_yoneticisi.tam_dogrulama_yap(payload)
    if not dogru_mu:
        return {
            "sonuc": "hata",
            "mesaj": dogru_mesaj,
            "profil_bilgisi": None
        }
    
    # Profil kontrolü (veritabanından)
    from veritabani import profil_var_mi, profil_bilgisi_al
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
    profil_bilgisi = profil_bilgisi_al(profil_id)
    from ui_mesajlari import qr_tarama_sonucu
    mesaj = qr_tarama_sonucu("basarili", profil_bilgisi)
    return {
        "sonuc": "basarili",
        "mesaj": mesaj,
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
    from guvenlik import sifrelenmis_qr_payload_olustur
    from veritabani import profil_olustur
    # Test profili oluştur
    test_profil_id = profil_olustur("test-user", "Test Profil", "Test profili")
    
    # Test QR verisi oluştur
    test_veri = sifrelenmis_qr_payload_olustur(test_profil_id)
    
    # Hoyn scanner ile test
    sonuc = qr_tara_ve_dogrula(test_veri, tarayici_tipi="hoyn_scanner")
    print("Hoyn Scanner Sonuç:", sonuc)
    
    # Üçüncü parti ile test
    sonuc2 = qr_tara_ve_dogrula(test_veri, tarayici_tipi="third_party")
    print("Üçüncü Parti Sonuç:", sonuc2)
