# Hoyn QR UI Mesajları Modülü
# Bu modül, tüm kullanıcı arayüzü mesajlarını Türkçe olarak merkezileştirir.
# Başarı mesajları, uyarılar, hata bildirimleri ve profil hoş geldin mesajları.
# Mesajlar dinamik parametrelerle formatlanabilir.
# Gerekli kütüphaneler: string (formatlama için).

import string
from typing import Dict, Callable, Any

class HoynUIMesajlari:
    """
    Hoyn QR sistemi için Türkçe UI mesajları yöneticisi.
    Tüm kullanıcı mesajlarını tek yerden yönetir.
    """
    
    def __init__(self):
        """
        UI mesaj yöneticisini başlatır ve mesaj sözlüğünü yükler.
        """
        self.mesaj_sozlugu = self._mesajlari_tanimla()
    
    def _mesajlari_tanimla(self) -> Dict[str, str]:
        """
        Tüm Türkçe mesajları tanımlar.
        Çıktı: Mesaj ID'leri ve içerikleri sözlüğü
        """
        return {
            # Başarı mesajları
            "BASARILI_QR_OLUSTURULDU": "✅ QR kodunuz başarıyla oluşturuldu! Profilinize erişim için paylaşabilirsiniz.",
            
            # Profil hoş geldin mesajları
            "PROFİL_HOS_GELDIN_CUMHUR": "Cumhur Profiline Hoş Geldiniz! 🎉",
            "PROFİL_HOS_GELDIN_GENEL": "{isim} Profiline Hoş Geldiniz! 🎉",
            
            # QR Tarama Sonuçları
            "QR_TARAMA_BASARILI": "✅ QR kodu başarıyla tarandı ve doğrulandı.",
            "QR_TARAMA_BASARISIZ": "❌ QR kodu doğrulanamadı. Lütfen geçerli bir Hoyn QR kodu kullanın.",
            
            # Uyarı mesajları (Hoyn Scanner ile non-Hoyn QR)
            "NON_HOY_N_QR_UYARI": "⚠️ Bu bir Hoyn QR kodu değildir. Yine de bu bağlantıyı ziyaret etmek istiyor musunuz?\n\n[Evet] [Hayır]",
            
            # Üçüncü parti tarayıcı uyarıları
            "UCUNCU_PARTI_UYARI": "🔐 Bu QR kodu yalnızca Hoyn QR Tarayıcı ile okunabilir.\n\nLütfen uygulamamızı indirin: indir.hoyn.app",
            "HOYN_SCANNER_GEREKLI": "📱 Bu QR'ı okumak için Hoyn QR Tarayıcı uygulamasını kullanın.\n\n[İndir]",
            
            # Zaman damgası hataları
            "QR_SURE_DOLMU": "⏰ QR kodu süresi dolmuş. Lütfen yeni bir tane oluşturun.",
            "ZAMAN_DAMGASI_GEÇERSIZ": "⏰ QR kodu zaman damgası geçersiz. Güvenlik nedeniyle erişim engellendi.",
            
            # Profil hataları
            "PROFIL_BULUNAMADI": "👤 Profil bulunamadı veya silinmiş.",
            "PROFIL_INAKTIF": "🔒 Profil şu anda aktif değil.",
            
            # Şifreleme ve hash hataları
            "SIFRE_COZME_HATASI": "🔐 QR kodu şifresi çözülemedi. Veri bozulmuş olabilir.",
            "HASH_DOGRULAMA_BASARISIZ": "🔐 QR kodu doğrulanamadı. Veri manipüle edilmiş olabilir.",
            "SISTEM_KIMLIGI_UYUMSUZ": "⚠️ Bu bir Hoyn QR kodu değil. Sistem kimliği uyumsuz.",
            
            # Genel hata mesajları
            "BILINMEYEN_HATA": "❌ Bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.",
            "BAGLANTI_HATASI": "🌐 İnternet bağlantısı hatası. Lütfen bağlantınızı kontrol edin.",
            
            # QR Oluşturma uyarıları
            "RENK_SECME_UYARISI": "🎨 Seçtiğiniz renk kombinasyonu okunabilirliği etkileyebilir.",
            "AI_TASARIM_BILDIRIMI": "🤖 AI tasarımı uygulanıyor... Bu işlem birkaç saniye sürebilir.",
            
            # Log ve analiz mesajları
            "TARAMA_LOG_BASARILI": "📝 Tarama işlemi başarıyla kaydedildi.",
            "TARAMA_LOG_HATASI": "📝 Tarama kaydı kaydedilemedi.",
            
            # Kullanıcı arayüzü buton ve etiketler
            "EVET": "Evet",
            "HAYIR": "Hayır",
            "INDIR": "İndir",
            "QR_OLUSTUR": "QR Oluştur",
            "QR_TARA": "QR Tara",
            "PROFİL_DÜZENLE": "Profil Düzenle",
            "RENK_AYARLA": "Renk Ayarla",
            "AI_TASARIM": "AI Tasarım",
            "LOGO_EKLE": "Logo Ekle",
            
            # Yardımcı mesajlar
            "YUKARIYUKARI": "Yukarıdaki QR kodunu telefonunuzla tarayın.",
            "PAYLASIM_BILDIRIMI": "QR kodunuz hazır! İstediğiniz şekilde paylaşabilirsiniz.",
            "GUVENLIK_UYARISI": "🔒 Tüm Hoyn QR kodları şifreli ve zaman sınırlıdır."
        }
    
    def mesaj_al(self, mesaj_id: str, **format_params) -> str:
        """
        Belirtilen ID'ye sahip mesajı alır ve formatlar.
        Girdiler: mesaj_id (str), **format_params (değişkenler)
        Çıktı: Formatlanmış Türkçe mesaj (str)
        """
        if mesaj_id not in self.mesaj_sozlugu:
            return self.mesaj_sozlugu.get("BILINMEYEN_HATA", "Bilinmeyen hata.")
        
        mesaj = self.mesaj_sozlugu[mesaj_id]
        
        # Dinamik parametreleri formatla
        try:
            return mesaj.format(**format_params)
        except KeyError:
            # Format hatası varsa ham mesajı döndür
            return mesaj
    
    def profil_hos_geldin_mesaji(self, isim: str) -> str:
        """
        Profilin hoş geldin mesajını oluşturur.
        Girdiler: isim (str)
        Çıktı: Kişiselleştirilmiş hoş geldin mesajı
        """
        if isim.lower() == "cumhur":
            return self.mesaj_sozlugu["PROFİL_HOS_GELDIN_CUMHUR"]
        else:
            return self.mesaj_al("PROFİL_HOS_GELDIN_GENEL", isim=isim)
    
    def qr_tarama_sonuc_mesaji(self, sonuc: str, profil_bilgisi: Dict = None) -> str:
        """
        QR tarama sonucuna göre uygun mesaj döndürür.
        Girdiler: sonuc (str: 'basarili', 'uyari', 'hata'), profil_bilgisi (Dict)
        Çıktı: Uygun Türkçe mesaj
        """
        if sonuc == "basarili" and profil_bilgisi:
            return self.profil_hos_geldin_mesaji(profil_bilgisi.get("isim", "Kullanıcı"))
        elif sonuc == "uyari":
            return self.mesaj_sozlugu["NON_HOY_N_QR_UYARI"]
        elif sonuc == "hata":
            return self.mesaj_sozlugu["QR_TARAMA_BASARISIZ"]
        else:
            return self.mesaj_sozlugu["BILINMEYEN_HATA"]
    
    def ucuncu_parti_tarama_mesaji(self, tarayici_adi: str = "bu tarayıcı") -> str:
        """
        Üçüncü parti tarayıcı için uyarı mesajı oluşturur.
        Girdiler: tarayici_adi (str)
        Çıktı: Uyarı mesajı
        """
        return self.mesaj_al("UCUNCU_PARTI_UYARI", tarayici_adi=tarayici_adi)
    
    def hata_mesaji_olustur(self, hata_tipi: str, ek_bilgi: str = "") -> str:
        """
        Hata tipine göre standart hata mesajı oluşturur.
        Girdiler: hata_tipi (str), ek_bilgi (str)
        Çıktı: Detaylı hata mesajı
        """
        temel_mesaj = self.mesaj_sozlugu.get(f"{hata_tipi.upper()}", self.mesaj_sozlugu["BILINMEYEN_HATA"])
        
        if ek_bilgi:
            return f"{temel_mesaj}\n\nDetay: {ek_bilgi}"
        return temel_mesaj

# Global UI mesajları yöneticisi örneği
ui_mesajlari = HoynUIMesajlari()

# Hızlı erişim fonksiyonları (modüler kullanım için)
def mesaj_al(mesaj_id: str, **format_params) -> str:
    """
    UI mesajını alır (kısa kullanım).
    """
    return ui_mesajlari.mesaj_al(mesaj_id, **format_params)

def profil_hos_geldin(isim: str) -> str:
    """
    Profil hoş geldin mesajı (kısa kullanım).
    """
    return ui_mesajlari.profil_hos_geldin_mesaji(isim)

def qr_tarama_sonucu(sonuc: str, profil_bilgisi: Dict = None) -> str:
    """
    QR tarama sonucu mesajı (kısa kullanım).
    """
    return ui_mesajlari.qr_tarama_sonuc_mesaji(sonuc, profil_bilgisi)

def hata_mesaji(hata_tipi: str, ek_bilgi: str = "") -> str:
    """
    Hata mesajı oluşturur (kısa kullanım).
    """
    return ui_mesajlari.hata_mesaji_olustur(hata_tipi, ek_bilgi)

# Test fonksiyonları
if __name__ == "__main__":
    print("🧪 UI Mesajları testleri başlıyor...")
    
    # Temel mesaj test
    print("Temel mesaj:", mesaj_al("QR_OLUSTUR"))
    
    # Formatlı mesaj test
    print("Profil hoş geldin:", profil_hos_geldin("Ahmet"))
    print("Özel Cumhur mesajı:", profil_hos_geldin("cumhur"))
    
    # QR tarama sonucu test
    test_profil = {"isim": "Ayşe"}
    print("Başarılı tarama:", qr_tarama_sonucu("basarili", test_profil))
    print("Uyarı mesajı:", qr_tarama_sonucu("uyari"))
    
    # Hata mesajı test
    print("Hash hatası:", hata_mesaji("HASH_DOGRULAMA_BASARISIZ", "Hash değeri uyuşmuyor"))
    
    # Üçüncü parti uyarı test
    print("Üçüncü parti:", ui_mesajlari.ucuncu_parti_tarama_mesaji("Google Lens"))
    
    print("✅ UI Mesajları testleri tamamlandı.")
    
    # Tüm mesajları listele (debug için)
    print("\n📋 Tüm mevcut mesajlar:")
    for mesaj_id, mesaj_icerik in ui_mesajlari.mesaj_sozlugu.items():
        print(f"{mesaj_id}: {mesaj_icerik}")
