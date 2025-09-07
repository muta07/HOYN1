# Hoyn QR Güvenlik Modülü
# Bu modül, AES-256 şifreleme, HMAC-SHA256 hash doğrulama ve zaman damgası kontrollerini sağlar.
# Tüm güvenlik işlemleri burada merkezileştirilmiştir.
# Gerekli kütüphaneler: cryptography, hashlib, hmac, time, os.
# Kurulum: pip install cryptography

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hmac as crypto_hmac
import hashlib
import hmac
import base64
import json
import time
import os
from typing import Tuple, Optional

class HoynGuvenlikYoneticisi:
    """
    Hoyn QR sistemi için güvenlik yöneticisi sınıfı.
    Şifreleme anahtarlarını yönetir, veri şifreler/çözer ve doğrular.
    """
    
    def __init__(self, anahtar_dosyasi: str = "hoyn_guvenlik_anahtari.key"):
        """
        Güvenlik yöneticisini başlatır.
        Girdiler: anahtar_dosyasi (str) - Anahtar dosya yolu
        """
        self.anahtar_dosyasi = anahtar_dosyasi
        self.cipher_suite = None
        self.anahtar_olustur_ve_yukle()
    
    def anahtar_olustur_ve_yukle(self) -> None:
        """
        Güvenli anahtar oluşturur veya mevcut dosyadan yükler.
        Üretimde anahtarları ortam değişkenlerinden almalı.
        """
        if os.path.exists(self.anahtar_dosyasi):
            # Mevcut anahtarı yükle
            with open(self.anahtar_dosyasi, "rb") as f:
                anahtar = f.read()
                self.cipher_suite = Fernet(anahtar)
        else:
            # Yeni anahtar oluştur
            anahtar = Fernet.generate_key()
            self.cipher_suite = Fernet(anahtar)
            # Anahtarı dosyaya kaydet (güvenli lokasyonda)
            with open(self.anahtar_dosyasi, "wb") as f:
                f.write(anahtar)
            # Güvenlik uyarısı: Anahtar dosyasını korumalı
            print(f"⚠️ Yeni güvenlik anahtarı oluşturuldu: {self.anahtar_dosyasi}")
            print("Üretimde bu dosyayı güvenli bir yerde saklayın!")
    
    def veri_sifrele(self, veri: dict) -> str:
        """
        JSON veriyi AES-256 ile şifreler ve base64 encode eder.
        Girdiler: veri (dict) - Şifrelenecek payload
        Çıktı: Şifrelenmiş base64 string
        """
        try:
            json_veri = json.dumps(veri).encode('utf-8')
            sifrelenmis = self.cipher_suite.encrypt(json_veri)
            return base64.b64encode(sifrelenmis).decode('utf-8')
        except Exception as e:
            raise Exception(f"Şifreleme hatası: {e}")
    
    def veri_coz(self, sifrelenmis_base64: str) -> Optional[dict]:
        """
        Şifrelenmiş base64 veriyi çözer ve JSON'a dönüştürür.
        Girdiler: sifrelenmis_base64 (str)
        Çıktı: Çözülmüş dict veya None (hata durumunda)
        """
        try:
            sifrelenmis = base64.b64decode(sifrelenmis_base64)
            cozulmus = self.cipher_suite.decrypt(sifrelenmis).decode('utf-8')
            return json.loads(cozulmus)
        except Exception as e:
            print(f"Şifre çözme hatası: {e}")
            return None
    
    def hmac_hash_olustur(self, veri: dict, gizli_anahtar: bytes = b'hoyn_secret_key') -> str:
        """
        HMAC-SHA256 ile veri hash'i oluşturur.
        Girdiler: veri (dict), gizli_anahtar (bytes)
        Çıktı: HMAC hash string
        """
        json_veri = json.dumps(veri, sort_keys=True).encode('utf-8')
        hmac_nesnesi = hmac.new(gizli_anahtar, json_veri, hashlib.sha256)
        return hmac_nesnesi.hexdigest()
    
    def hmac_hash_dogrula(self, veri: dict, beklenen_hash: str, gizli_anahtar: bytes = b'hoyn_secret_key') -> bool:
        """
        HMAC hash'ini doğrular.
        Girdiler: veri (dict), beklenen_hash (str), gizli_anahtar (bytes)
        Çıktı: bool (doğru mu?)
        """
        hesaplanan_hash = self.hmac_hash_olustur(veri, gizli_anahtar)
        return hmac.compare_digest(hesaplanan_hash, beklenen_hash)
    
    def zaman_damgasi_ekle_ve_hashle(self, payload: dict, gizli_anahtar: bytes = b'hoyn_secret_key') -> dict:
        """
        Payload'a zaman damgası ekler ve HMAC hash hesaplar.
        Girdiler: payload (dict), gizli_anahtar (bytes)
        Çıktı: Hash'li payload dict
        """
        # Zaman damgası ekle (5 dakika geçerlilik)
        payload["zaman_damgasi"] = int(time.time())
        
        # Hash hesapla (profil_id, sistem_kimligi, zaman_damgasi)
        hash_verisi = {
            "profil_id": payload["profil_id"],
            "sistem_kimligi": payload["sistem_kimligi"],
            "zaman_damgasi": payload["zaman_damgasi"]
        }
        payload["hash"] = self.hmac_hash_olustur(hash_verisi, gizli_anahtar)
        
        return payload
    
    def zaman_damgasi_gecerli_mi(self, zaman_damgasi: int, maks_sure: int = 300) -> bool:
        """
        Zaman damgasının geçerli olup olmadığını kontrol eder.
        Girdiler: zaman_damgasi (int), maks_sure (int) - saniye cinsinden
        Çıktı: bool
        """
        mevcut_zaman = int(time.time())
        return (mevcut_zaman - zaman_damgasi) <= maks_sure
    
    def tam_dogrulama_yap(self, payload: dict, gizli_anahtar: bytes = b'hoyn_secret_key') -> Tuple[bool, str]:
        """
        Payload'un tam doğrulamasını yapar: hash, zaman damgası.
        Girdiler: payload (dict), gizli_anahtar (bytes)
        Çıktı: (bool, str) - (başarılı mı?, hata mesajı)
        """
        # Sistem kimliği kontrolü
        if payload.get("sistem_kimligi") != "HOYN_QR_V1":
            return False, "Sistem kimliği uyumsuz: HOYN_QR_V1 bekleniyor."
        
        # Hash doğrulama
        if not self.hmac_hash_dogrula({
            "profil_id": payload["profil_id"],
            "sistem_kimligi": payload["sistem_kimligi"],
            "zaman_damgasi": payload["zaman_damgasi"]
        }, payload["hash"], gizli_anahtar):
            return False, "Hash doğrulama başarısız: Veri manipüle edilmiş olabilir."
        
        # Zaman damgası kontrolü
        if not self.zaman_damgasi_gecerli_mi(payload["zaman_damgasi"]):
            return False, "Zaman damgası süresi dolmuş: QR kodu geçersiz."
        
        return True, "Doğrulama başarılı."

# Global güvenlik yöneticisi örneği
guvenlik_yoneticisi = HoynGuvenlikYoneticisi()

# Yardımcı fonksiyonlar (modüler kullanım için)
def sifrelenmis_qr_payload_olustur(profil_id: str, sistem_kimligi: str = "HOYN_QR_V1") -> str:
    """
    Şifrelenmiş QR payload oluşturur (guvenlik modülünü kullanır).
    """
    payload = {
        "profil_id": profil_id,
        "sistem_kimligi": sistem_kimligi
    }
    # Zaman damgası ve hash ekle
    payload = guvenlik_yoneticisi.zaman_damgasi_ekle_ve_hashle(payload)
    # Şifrele
    return guvenlik_yoneticisi.veri_sifrele(payload)

def qr_payload_dogrula(sifrelenmis_base64: str) -> Tuple[bool, str, Optional[dict]]:
    """
    Şifrelenmiş payload'ı çözer ve doğrular.
    """
    payload = guvenlik_yoneticisi.veri_coz(sifrelenmis_base64)
    if not payload:
        return False, "Şifre çözme başarısız.", None
    
    dogru_mu, mesaj = guvenlik_yoneticisi.tam_dogrulama_yap(payload)
    return dogru_mu, mesaj, payload

# Test fonksiyonları
if __name__ == "__main__":
    # Test payload oluştur
    test_profil_id = "test-profile-123"
    sifrelenmis = sifrelenmis_qr_payload_olustur(test_profil_id)
    print(f"Şifrelenmiş payload: {sifrelenmis[:50]}...")
    
    # Doğrulama test
    dogru_mu, mesaj, payload = qr_payload_dogrula(sifrelenmis)
    print(f"Doğrulama: {dogru_mu}, Mesaj: {mesaj}")
    
    if payload:
        print(f"Çözülmüş payload: {payload}")
    
    # Geçersiz zaman damgası testi (manuel)
    eski_payload = payload.copy()
    eski_payload["zaman_damgasi"] -= 400  # 6.6 dakika eski
    dogru_mu, mesaj, _ = guvenlik_yoneticisi.tam_dogrulama_yap(eski_payload)
    print(f"Geçersiz zaman testi: {dogru_mu}, {mesaj}")
