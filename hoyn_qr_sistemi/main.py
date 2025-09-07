# Hoyn QR Sistemi Ana Uygulama
# Bu dosya, tüm modülleri entegre eder ve komut satırı arayüzü sağlar.
# Kullanım: python main.py
# Özellikler: Profil oluşturma, QR üretme, QR tarama simülasyonu, loglama.
# Gerekli kütüphaneler: Tüm modüller + uuid, base64, io, PIL (qrcode için).

import sys
import uuid
from datetime import datetime
import base64
from io import BytesIO
from PIL import Image

# Sistem modüllerini içe aktar
try:
    from qr_uretici import qr_olustur
    from qr_tarayici import qr_tara_ve_dogrula
    from guvenlik import sifrelenmis_qr_payload_olustur, qr_payload_dogrula
    from veritabani import profil_olustur, profil_var_mi, qr_tarama_logla, profil_bilgisi_al
    from ui_mesajlari import mesaj_al, profil_hos_geldin, qr_tarama_sonucu
    print("✅ Tüm modüller başarıyla yüklendi.")
except ImportError as e:
    print(f"❌ Modül yükleme hatası: {e}")
    print("Lütfen gerekli kütüphaneleri yükleyin: pip install qrcode[pil] cryptography")
    sys.exit(1)

def qr_goster(qr_base64: str, dosya_adi: str = "hoyn_qr.png") -> None:
    """
    Base64 QR kodunu dosyaya kaydeder ve görüntüler.
    Girdiler: qr_base64 (str), dosya_adi (str)
    """
    try:
        qr_data = base64.b64decode(qr_base64)
        img = Image.open(BytesIO(qr_data))
        img.save(dosya_adi)
        print(f"🖼️ QR kodu kaydedildi: {dosya_adi}")
        print(mesaj_al("YUKARIYUKARI"))
        print(mesaj_al("PAYLASIM_BILDIRIMI"))
    except Exception as e:
        print(f"QR görüntüleme hatası: {e}")

def profil_olusturma_islemi(kullanici_id: str) -> str:
    """
    Yeni profil oluşturur ve ID'sini döndürür.
    Girdiler: kullanici_id (str)
    Çıktı: profil_id (str)
    """
    print("\n👤 Yeni profil oluşturma...")
    isim = input("Profil ismi girin: ").strip()
    if not isim:
        isim = "Varsayılan Profil"
    
    aciklama = input("Profil açıklaması (opsiyonel): ").strip()
    
    try:
        profil_id = profil_olustur(kullanici_id, isim, aciklama)
        print(mesaj_al("BASARILI_QR_OLUSTURULDU"))
        return profil_id
    except Exception as e:
        print(f"Profil oluşturma hatası: {e}")
        return None

def qr_uretme_islemi(profil_id: str) -> str:
    """
    Belirtilen profil için QR kodu üretir.
    Girdiler: profil_id (str)
    Çıktı: qr_base64 (str)
    """
    print("\n🎨 QR özelleştirme seçenekleri:")
    print("1. Varsayılan renkler")
    print("2. Renk seçimi")
    print("3. AI tasarım modu")
    
    secim = input("Seçiminizi yapın (1-3): ").strip()
    
    arka_renk = "#FFFFFF"
    on_plan_renk = "#000000"
    ai_tasarim_modu = False
    logo_ekle = False
    
    if secim == "2":
        arka_renk = input("Arka plan rengi (hex, örn: #FF0000): ").strip() or "#FFFFFF"
        on_plan_renk = input("Ön plan rengi (hex, örn: #000000): ").strip() or "#000000"
        if arka_renk == on_plan_renk:
            print(mesaj_al("RENK_SECME_UYARISI"))
    elif secim == "3":
        ai_tasarim_modu = True
        print(mesaj_al("AI_TASARIM_BILDIRIMI"))
    
    logo_ekle = input("Logo eklemek istiyor musunuz? (e/h): ").strip().lower() == 'e'
    
    print(mesaj_al("GUVENLIK_UYARISI"))
    
    # Güvenlik modülünden şifrelenmiş payload al
    sifrelenmis_payload = sifrelenmis_qr_payload_olustur(profil_id)
    
    # QR üretici modülünden QR oluştur (payload ile)
    # Not: qr_uretici.py'de sifrelenmis_veri_olustur yerine güvenlik modülünü kullan
    # Geçici çözüm: qr_olustur fonksiyonunu payload ile çağır
    qr_base64 = qr_olustur(profil_id, arka_renk, on_plan_renk, logo_ekle, ai_tasarim_modu)
    
    print(mesaj_al("BASARILI_QR_OLUSTURULDU"))
    return qr_base64

def qr_tarama_simulasyonu(qr_base64: str) -> None:
    """
    QR tarama işlemini simüle eder ve sonuçları gösterir.
    Girdiler: qr_base64 (str)
    """
    print("\n🔍 QR tarama simülasyonu:")
    print("1. Hoyn QR Tarayıcı ile tarama")
    print("2. Üçüncü parti tarayıcı ile tarama")
    print("3. Geçersiz QR ile tarama")
    
    secim = input("Tarama türünü seçin (1-3): ").strip()
    
    if secim == "1":
        tarayici_tipi = "hoyn_scanner"
    elif secim == "2":
        tarayici_tipi = "third_party"
    else:
        print(mesaj_al("NON_HOY_N_QR_UYARI"))
        return
    
    # QR verisini çöz (tarama simülasyonu)
    # qr_tarayici.py'deki qr_resminden_veri_cek yerine güvenlik modülünü kullan
    # Gerçek tarama simülasyonu için: payload'ı doğrudan kullan
    test_profil_id = "test-profile-1"  # Simülasyon için
    sifrelenmis_veri = sifrelenmis_qr_payload_olustur(test_profil_id)
    
    # Doğrulama yap
    dogru_mu, dogru_mesaj, payload = qr_payload_dogrula(sifrelenmis_veri)
    
    if dogru_mu and profil_var_mi(test_profil_id):
        profil_bilgisi = profil_bilgisi_al(test_profil_id)
        sonuc = "basarili"
        qr_tarama_logla(test_profil_id, tarayici_tipi, basarili_mi=True)
    elif tarayici_tipi == "third_party":
        sonuc = "uyari"
        print(mesaj_al("UCUNCU_PARTI_UYARI"))
        qr_tarama_logla(test_profil_id, tarayici_tipi, basarili_mi=False)
        return
    else:
        sonuc = "hata"
        qr_tarama_logla(test_profil_id, tarayici_tipi, basarili_mi=False)
    
    # Sonuç mesajını göster
    mesaj = qr_tarama_sonucu(sonuc, profil_bilgisi)
    print(f"\n📱 Tarama Sonucu:\n{mesaj}")

def ana_menuyu_goster() -> None:
    """
    Ana menüyü gösterir ve kullanıcı seçimlerini işler.
    """
    print("\n" + "="*50)
    print("🎉 HOYN QR SİSTEMİ - Ana Menü")
    print("="*50)
    print("1. Yeni Profil Oluştur")
    print("2. QR Kodu Üret")
    print("3. QR Tarama Simülasyonu")
    print("4. Tarama Loglarını Görüntüle")
    print("5. Sistem Testi")
    print("0. Çıkış")
    print("="*50)

def sistem_testi() -> None:
    """
    Tam sistem testini çalıştırır.
    """
    print("\n🧪 Tam Sistem Testi Başlatılıyor...")
    
    # Test kullanıcısı
    test_kullanici_id = "test-user-" + str(uuid.uuid4())[:8]
    
    # 1. Profil oluştur
    print("\n1️⃣ Test profili oluşturuluyor...")
    test_profil_id = profil_olustur(test_kullanici_id, "Test Profil", "Otomatik test profili")
    
    if not test_profil_id:
        print("❌ Profil oluşturma başarısız!")
        return
    
    # 2. QR kodu üret
    print("\n2️⃣ QR kodu üretiliyor...")
    test_qr_base64 = qr_uretme_islemi(test_profil_id)
    
    if test_qr_base64:
        qr_goster(test_qr_base64, "test_qr.png")
        
        # 3. QR tarama simülasyonu
        print("\n3️⃣ QR tarama testi...")
        qr_tarama_simulasyonu(test_qr_base64)
        
        # 4. Logları kontrol et
        print("\n4️⃣ Tarama logları:")
        from veritabani import tarama_loglarini_al
        loglar = tarama_loglarini_al(test_profil_id)
        for log in loglar[-3:]:  # Son 3 log
            print(f"   📝 {log['tarama_zamani']} - {log['tarayici_tipi']} - Başarılı: {log['basarili_mi']}")
    
    print("\n✅ Sistem testi tamamlandı!")
    print("Not: Gerçek kullanımda bu test verileri temizlenmelidir.")

def main():
    """
    Ana uygulama fonksiyonu.
    """
    print("🎉 HOYN QR SİSTEMİNE HOŞ GELLİNİZ!")
    print("Güvenli ve özelleştirilebilir QR çözümü")
    print(mesaj_al("GUVENLIK_UYARISI"))
    print()
    
    while True:
        ana_menuyu_goster()
        
        secim = input("\nSeçiminizi yapın (0-5): ").strip()
        
        if secim == "0":
            print("\n👋 Hoyn QR Sisteminden çıkılıyor. Görüşmek üzere!")
            break
        elif secim == "1":
            kullanici_id = input("Kullanıcı ID'nizi girin: ").strip() or "default-user"
            profil_olusturma_islemi(kullanici_id)
        elif secim == "2":
            profil_id = input("Profil ID'nizi girin: ").strip()
            if profil_id and profil_var_mi(profil_id):
                qr_uretme_islemi(profil_id)
            else:
                print("❌ Geçerli bir profil ID girin veya önce profil oluşturun.")
        elif secim == "3":
            qr_base64 = input("QR base64 verisi girin (veya test için Enter): ").strip()
            if not qr_base64:
                # Test QR oluştur
                test_profil_id = profil_olustur("test-user", "Test Profil", "")
                if test_profil_id:
                    qr_base64 = qr_uretme_islemi(test_profil_id)
            qr_tarama_simulasyonu(qr_base64)
        elif secim == "4":
            profil_id = input("Log için profil ID (boş için tümü): ").strip()
            from veritabani import tarama_loglarini_al
            loglar = tarama_loglarini_al(profil_id if profil_id else None, 7)  # Son 7 gün
            print(f"\n📊 Son {len(loglar)} tarama logu:")
            for log in loglar[:10]:  # Maksimum 10 göster
                durum = "✅" if log['basarili_mi'] else "❌"
                print(f"   {durum} {log['tarama_zamani']} - {log['tarayici_tipi']}")
        elif secim == "5":
            sistem_testi()
        else:
            print("❌ Geçersiz seçim. Lütfen 0-5 arasında bir sayı girin.")
        
        input("\nDevam etmek için Enter'a basın...")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Uygulama kullanıcı tarafından durduruldu.")
    except Exception as e:
        print(f"\n❌ Kritik hata: {e}")
        print("Lütfen sistem loglarını kontrol edin.")
