# Hoyn QR Üretici Modülü
# Bu modül, profil bazlı şifrelenmiş QR kodları üretir.
# Özelleştirme seçenekleri: renkler, AI tasarımı (basit renk tabanlı simülasyon).
# Gerekli kütüphaneler: qrcode, cryptography, base64, json, uuid, hashlib, time.
# Kurulum: pip install qrcode[pil] cryptography

import qrcode
import json
import base64
import uuid
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import os
import time

from guvenlik import guvenlik_yoneticisi

def sifrelenmis_veri_olustur(profil_id: str, username: str = "", qr_type: str = "profile", mode: str = "profile") -> str:
    """
    Frontend uyumlu HOYN QR payload oluşturur.
    Girdiler: profil_id (str), username (str), qr_type (str), mode (str)
    Çıktı: Şifrelenmiş base64 string
    """
    from guvenlik import sifrelenmis_qr_payload_olustur
    
    # Güvenlik modülünden temel payload oluştur
    base_payload = sifrelenmis_qr_payload_olustur(profil_id)
    
    # Frontend uyumlu formatı oluştur
    hoyn_payload = {
        "hoyn": True,
        "type": qr_type,
        "username": username,
        "profil_id": profil_id,
        "mode": mode,
        "url": f"https://hoyn.app/u/{username}" if username else f"https://hoyn.app/p/{profil_id}",
        "createdAt": int(time.time() * 1000),
        "version": "1.1",
        "sistem_kimligi": "HOYN_QR_V1"
    }
    
    # Güvenlik modülünden şifrele
    return guvenlik_yoneticisi.veri_sifrele(hoyn_payload)

def qr_olustur(profil_id: str, arka_renk: str = "#FFFFFF", on_plan_renk: str = "#000000", logo_ekle: bool = False, ai_tasarim_modu: bool = False, username: str = "") -> str:
    """
    Frontend uyumlu HOYN QR kodu üretir.
    AI tasarımı: Basit renk varyasyonu simülasyonu (gerçek AI için external API çağrısı eklenebilir).
    Girdiler: profil_id (str), arka_renk (str), on_plan_renk (str), logo_ekle (bool), ai_tasarim_modu (bool), username (str)
    Çıktı: base64 formatında QR resmi
    """
    # Güvenlik payload oluştur (main.py uyumlu)
    from guvenlik import sifrelenmis_qr_payload_olustur
    sifrelenmis_veri = sifrelenmis_qr_payload_olustur(profil_id)
    
    # Frontend uyumlu şifrelenmiş veri oluştur
    frontend_veri = sifrelenmis_veri_olustur(profil_id, username)
    
    # QR için frontend verisini kullan
    qr_data = frontend_veri
    
    # QR nesnesi oluştur
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    # AI modu aktifse renkleri karıştır (basit simülasyon)
    if ai_tasarim_modu:
        # Basit AI simülasyonu: Renkleri karıştır
        import random
        arka_renk = f"#{random.randint(0,255):02x}{random.randint(0,255):02x}{random.randint(0,255):02x}"
        on_plan_renk = f"#{random.randint(0,255):02x}{random.randint(0,255):02x}{random.randint(0,255):02x}"
    
    # Stil ekle (standart PIL image factory kullan)
    img = qr.make_image(
        fill_color=on_plan_renk,
        back_color=arka_renk
    )
    
    # Logo ekle (basit, eğer logo varsa)
    if logo_ekle:
        # Logo ekleme kodu (örnek, gerçek logo yolu eklenebilir)
        pass  # TODO: Logo overlay
    
    # Base64'e çevir
    from io import BytesIO
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return img_str

# Test fonksiyonu
if __name__ == "__main__":
    test_profil_id = str(uuid.uuid4())
    test_username = "testuser123"
    qr_base64 = qr_olustur(test_profil_id, ai_tasarim_modu=True, username=test_username)
    print("QR Base64:", qr_base64[:100] + "...")  # Kısa göster
