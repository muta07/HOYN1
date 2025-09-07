# Hoyn QR Sistemi Unit Testleri
# Bu dosya, tüm modüller için kapsamlı testler içerir.
# Çalıştırma: pip install pytest && pytest test_hoyn_qr_sistemi.py -v
# Test kapsamı: QR üretimi, tarama, güvenlik, veritabanı, UI mesajları.
# Gerekli kütüphaneler: pytest, uuid, base64, json, time.

import pytest
import base64
import json
import time
import os
import tempfile
import sqlite3
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
from unittest.mock import Mock
from veritabani import VERITABANI_DOSYASI

# Test edilen modülleri içe aktar
from qr_uretici import qr_olustur, sifrelenmis_veri_olustur
from qr_tarayici import qr_tara_ve_dogrula, qr_veri_coz, hash_dogrula, zaman_damgasi_gecerli_mi, profil_var_mi
from guvenlik import HoynGuvenlikYoneticisi, sifrelenmis_qr_payload_olustur, qr_payload_dogrula
from veritabani import HoynVeritabaniYoneticisi, profil_olustur, profil_var_mi as db_profil_var_mi, qr_tarama_logla
from ui_mesajlari import mesaj_al, profil_hos_geldin, qr_tarama_sonucu

# Test veritabanı dosyasını temizle
@pytest.fixture(autouse=True)
def temizlik():
    """Her test öncesi veritabanını temizler."""
    # Test dosyalarını kullan
    test_db = "test_hoyn_db.db"
    test_key = "test_hoyn_key.key"
    
    if os.path.exists(test_db):
        try:
            os.remove(test_db)
        except PermissionError:
            pass  # Dosya kullanımda olabilir, görmezden gel
    if os.path.exists(test_key):
        try:
            os.remove(test_key)
        except PermissionError:
            pass
    
    # Global instance'ları test versiyonları ile değiştir
    original_db_file = VERITABANI_DOSYASI
    VERITABANI_DOSYASI = test_db
    
    yield
    
    # Temizlik
    if os.path.exists(test_db):
        try:
            os.remove(test_db)
        except PermissionError:
            pass
    if os.path.exists(test_key):
        try:
            os.remove(test_key)
        except PermissionError:
            pass
    
    # Orijinal değerleri geri yükle
    VERITABANI_DOSYASI = original_db_file

class TestQRUretici:
    """QR Üretici modülü testleri."""
    
    def test_sifrelenmis_veri_olustur(self):
        """Şifrelenmiş veri oluşturma test."""
        profil_id = "test-profil-123"
        veri = sifrelenmis_veri_olustur(profil_id)
        
        assert isinstance(veri, str)
        assert len(veri) > 100  # Base64 encoded olmalı
        assert "HOYN_QR_V1" in json.loads(json.loads(base64.b64decode(veri))["profil_id"]) == False  # Şifreli olduğu için profil_id görünmemeli
    
    def test_qr_olustur_temel(self):
        """Temel QR oluşturma test."""
        profil_id = "test-profil-123"
        qr_base64 = qr_olustur(profil_id)
        
        assert isinstance(qr_base64, str)
        assert len(qr_base64) > 1000  # QR görüntüsü base64 olmalı
        assert qr_base64.startswith('/') or qr_base64.startswith('iVBOR')  # Base64 image signature
    
    def test_qr_olustur_ozellestirme(self):
        """Özelleştirme seçenekleri test."""
        profil_id = "test-profil-123"
        
        # AI tasarım modu
        qr_ai = qr_olustur(profil_id, ai_tasarim_modu=True)
        assert isinstance(qr_ai, str)
        
        # Renk özelleştirme
        qr_renk = qr_olustur(profil_id, arka_renk="#FF0000", on_plan_renk="#00FF00")
        assert isinstance(qr_renk, str)

class TestQRTarayici:
    """QR Tarayıcı modülü testleri."""
    
    @patch('qr_tarayici.PROFIL_VERITABANI')
    def test_qr_tara_ve_dogrula_basari(self, mock_db):
        """Başarılı QR tarama test."""
        mock_db.__contains__.return_value = True
        mock_db.__getitem__.return_value = {"isim": "Test Kullanıcı", "mesaj": "Hoş Geldiniz!"}
        
        test_veri = sifrelenmis_veri_olustur("test-profile-1")
        sonuc = qr_tara_ve_dogrula(test_veri, tarayici_tipi="hoyn_scanner")
        
        assert sonuc["sonuc"] == "basarili"
        assert "Hoş Geldiniz" in sonuc["mesaj"]
    
    def test_qr_tara_ve_dogrula_ucuncu_parti(self):
        """Üçüncü parti tarayıcı test."""
        test_veri = sifrelenmis_veri_olustur("test-profile-1")
        sonuc = qr_tara_ve_dogrula(test_veri, tarayici_tipi="third_party")
        
        assert sonuc["sonuc"] == "uyari"
        assert "Hoyn QR Tarayıcı" in sonuc["mesaj"]
    
    def test_hash_dogrulama(self):
        """Hash doğrulama test."""
        payload = {
            "profil_id": "test-123",
            "sistem_kimligi": "HOYN_QR_V1",
            "zaman_damgasi": int(time.time()),
            "hash": ""
        }
        
        # Hash hesapla
        veri = json.dumps({
            "profil_id": payload["profil_id"],
            "sistem_kimligi": payload["sistem_kimligi"],
            "zaman_damgasi": payload["zaman_damgasi"]
        }).encode()
        from cryptography.hazmat.primitives import hashes
        hash_nesnesi = hashes.Hash(hashes.SHA256())
        hash_nesnesi.update(veri)
        payload["hash"] = hash_nesnesi.finalize().hex()
        
        assert hash_dogrula(payload) == True
    
    def test_zaman_damgasi_gecerli(self):
        """Geçerli zaman damgası test."""
        mevcut_zaman = int(time.time())
        assert zaman_damgasi_gecerli_mi(mevcut_zaman) == True
        assert zaman_damgasi_gecerli_mi(mevcut_zaman - 100) == True
        assert zaman_damgasi_gecerli_mi(mevcut_zaman - 400) == False  # 6.6 dakika eski

class TestGuvenlik:
    """Güvenlik modülü testleri."""
    
    def test_guvenlik_yoneticisi_anahtar_olusturma(self):
        """Güvenlik yöneticisi anahtar oluşturma test."""
        guvenlik = HoynGuvenlikYoneticisi("test_key.key")
        
        assert guvenlik.cipher_suite is not None
        assert os.path.exists("test_key.key") == True
    
    def test_sifrelenmis_payload_olusturma(self):
        """Şifrelenmiş payload oluşturma test."""
        profil_id = "test-security-123"
        sifrelenmis = sifrelenmis_qr_payload_olustur(profil_id)
        
        assert isinstance(sifrelenmis, str)
        assert len(sifrelenmis) > 100
        
        # Çöz ve doğrula
        dogru_mu, _, payload = qr_payload_dogrula(sifrelenmis)
        assert dogru_mu == True
        assert payload["profil_id"] == profil_id
        assert payload["sistem_kimligi"] == "HOYN_QR_V1"
    
    def test_hmac_hash_dogrulama(self):
        """HMAC hash doğrulama test."""
        guvenlik = HoynGuvenlikYoneticisi()
        test_veri = {"profil_id": "test", "sistem": "HOYN_QR_V1", "timestamp": 123456}
        hash_degeri = guvenlik.hmac_hash_olustur(test_veri)
        
        assert guvenlik.hmac_hash_dogrula(test_veri, hash_degeri) == True
        
        # Yanlış hash ile test
        assert guvenlik.hmac_hash_dogrula(test_veri, "yanlis_hash") == False
    
    def test_zaman_damgasi_suresi(self):
        """Zaman damgası süresi test."""
        guvenlik = HoynGuvenlikYoneticisi()
        assert guvenlik.zaman_damgasi_gecerli_mi(int(time.time())) == True
        assert guvenlik.zaman_damgasi_gecerli_mi(int(time.time()) - 400) == False

class TestVeritabani:
    """Veritabanı modülü testleri."""
    
    def test_veritabani_tablolari_olusturma(self):
        """Tabloların oluşturulma test."""
        db = HoynVeritabaniYoneticisi()
        
        # Bağlantı ile tabloları kontrol et
        conn = sqlite3.connect(VERITABANI_DOSYASI)
        cursor = conn.cursor()
        
        # Profiller tablosu
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='profiller'")
        assert cursor.fetchone() is not None
        
        # QR logları tablosu
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='qr_tarama_loglari'")
        assert cursor.fetchone() is not None
        
        conn.close()
    
    def test_profil_olusturma(self):
        """Profil oluşturma test."""
        test_kullanici_id = "test-user-db"
        profil_id = profil_olustur(test_kullanici_id, "Test Profil DB", "Test açıklaması")
        
        assert isinstance(profil_id, str)
        assert len(profil_id) > 10  # UUID formatı
        
        # Veritabanında var mı kontrol et
        assert db_profil_var_mi(profil_id) == True
        
        # Profil bilgilerini al
        from veritabani import profil_bilgisi_al
        profil = profil_bilgisi_al(profil_id)
        assert profil["isim"] == "Test Profil DB"
        assert profil["aciklama"] == "Test açıklaması"
    
    def test_qr_tarama_loglama(self):
        """QR tarama loglama test."""
        # Test profil oluştur
        test_profil_id = profil_olustur("log-test-user", "Log Test Profil", "")
        
        # Log ekle
        basari = qr_tarama_logla(test_profil_id, "hoyn_scanner", basarili_mi=True)
        assert basari == True
        
        basari_olumsuz = qr_tarama_logla(test_profil_id, "third_party", basarili_mi=False)
        assert basari_olumsuz == True
        
        # Logları al
        from veritabani import tarama_loglarini_al
        loglar = tarama_loglarini_al(test_profil_id)
        assert len(loglar) >= 2
        assert loglar[0]["basarili_mi"] == True
        assert loglar[1]["basarili_mi"] == False
    
    def test_profil_var_mi(self):
        """Profil var mı kontrolü test."""
        # Mevcut profil
        mevcut_profil_id = profil_olustur("var-mi-test", "Mevcut Profil", "")
        assert db_profil_var_mi(mevcut_profil_id) == True
        
        # Mevcut olmayan profil
        assert db_profil_var_mi("olmayan-profil-123") == False

class TestUIMesajlari:
    """UI Mesajları modülü testleri."""
    
    def test_mesaj_al(self):
        """Temel mesaj alma test."""
        mesaj = mesaj_al("QR_OLUSTUR")
        assert mesaj == "QR Oluştur"
    
    def test_formatli_mesaj(self):
        """Formatlı mesaj test."""
        mesaj = mesaj_al("PROFİL_HOS_GELDIN_GENEL", isim="Ahmet")
        assert "Ahmet Profiline Hoş Geldiniz!" in mesaj
    
    def test_profil_hos_geldin_ozel(self):
        """Özel Cumhur mesajı test."""
        cumhur_mesaj = profil_hos_geldin("cumhur")
        assert "Cumhur Profiline Hoş Geldiniz!" in cumhur_mesaj
        
        genel_mesaj = profil_hos_geldin("Mehmet")
        assert "Mehmet Profiline Hoş Geldiniz!" in genel_mesaj
    
    def test_qr_tarama_sonucu(self):
        """QR tarama sonucu mesajları test."""
        test_profil = {"isim": "Test Kullanıcı"}
        
        # Başarılı tarama
        basari_mesaj = qr_tarama_sonucu("basarili", test_profil)
        assert "Test Kullanıcı Profiline Hoş Geldiniz!" in basari_mesaj
        
        # Uyarı mesajı
        uyari_mesaj = qr_tarama_sonucu("uyari")
        assert "Bu bir Hoyn QR kodu değildir" in uyari_mesaj
        
        # Hata mesajı
        hata_mesaj = qr_tarama_sonucu("hata")
        assert "QR kodu doğrulanamadı" in hata_mesaj
    
    def test_hata_mesaji_olusturma(self):
        """Hata mesajı oluşturma test."""
        from ui_mesajlari import hata_mesaji
        hata = hata_mesaji("HASH_DOGRULAMA_BASARISIZ", "Test detayı")
        assert "QR kodu doğrulanamadı" in hata
        assert "Test detayı" in hata
    
    def test_bilinmeyen_mesaj(self):
        """Bilinmeyen mesaj ID test."""
        from ui_mesajlari import mesaj_al
        bilinmeyen = mesaj_al("BILINMEYEN_ID")
        assert "Bilinmeyen bir hata oluştu" in bilinmeyen

class TestEntegrasyon:
    """Entegrasyon testleri (modüller arası)."""
    
    def test_tam_qr_dongusu(self):
        """Tam QR oluşturma-tarama döngüsü test."""
        # 1. Profil oluştur
        test_kullanici_id = "ent-test-user"
        profil_id = profil_olustur(test_kullanici_id, "Entegrasyon Test", "Test profili")
        assert profil_id is not None
        
        # 2. QR kodu oluştur
        qr_base64 = qr_olustur(profil_id, ai_tasarim_modu=False)
        assert isinstance(qr_base64, str)
        assert len(qr_base64) > 1000
        
        # 3. Güvenlik payload oluştur (gerçek tarama verisi)
        sifrelenmis_payload = sifrelenmis_qr_payload_olustur(profil_id)
        
        # 4. Doğrulama yap
        dogru_mu, _, payload = qr_payload_dogrula(sifrelenmis_payload)
        assert dogru_mu == True
        assert payload["profil_id"] == profil_id
        
        # 5. Tarama simülasyonu
        mock_db = {"test-profile-1": {"isim": "Entegrasyon Test", "mesaj": "Hoş Geldiniz!"}}
        with patch('qr_tarayici.PROFIL_VERITABANI', mock_db):
            sonuc = qr_tara_ve_dogrula(sifrelenmis_payload, tarayici_tipi="hoyn_scanner")
            assert sonuc["sonuc"] == "basarili"
            assert "Entegrasyon Test Profiline Hoş Geldiniz!" in sonuc["mesaj"]
        
        # 6. Loglama
        log_basari = qr_tarama_logla(profil_id, "hoyn_scanner", basarili_mi=True)
        assert log_basari == True
    
    def test_guvenlik_zaman_suresi(self):
        """Güvenlik zaman süresi test."""
        profil_id = "timeout-test"
        guvenlik = HoynGuvenlikYoneticisi()
        
        # Taze QR oluştur
        sifrelenmis = sifrelenmis_qr_payload_olustur(profil_id)
        dogru_mu, _, _ = qr_payload_dogrula(sifrelenmis)
        assert dogru_mu == True
        
        # Eski QR simüle et (6 dakika eski)
        original_time = time.time
        try:
            time.time = Mock(return_value=original_time() - 400)
            dogru_mu, mesaj, _ = qr_payload_dogrula(sifrelenmis)
            assert dogru_mu == False
            assert "süresi dolmuş" in mesaj
        finally:
            time.time = original_time

class TestMainEntegrasyonu:
    """Main.py entegrasyon testleri."""
    
    @patch('builtins.input', side_effect=['1', 'test-main-user', 'Main Test Profil', '', '0'])
    def test_profil_olusturma_main(self, mock_input):
        """Main menü profil oluşturma test."""
        from main import profil_olusturma_islemi
        with patch('main.profil_olustur') as mock_profil_olustur:
            mock_profil_olustur.return_value = "test-profil-id"
            profil_id = profil_olusturma_islemi("test-main-user")
            assert profil_id == "test-profil-id"
    
    @patch('builtins.input', side_effect=['2', 'valid-profile-id', '1', 'n', '0'])
    def test_qr_uretme_main(self, mock_input):
        """Main menü QR üretme test."""
        from main import qr_uretme_islemi
        with patch('main.profil_var_mi', return_value=True):
            with patch('main.qr_olustur') as mock_qr_olustur:
                mock_qr_olustur.return_value = "test_qr_base64_data"
                qr_base64 = qr_uretme_islemi("valid-profile-id")
                assert qr_base64 == "test_qr_base64_data"

# Ana test runner
if __name__ == "__main__":
    pytest.main([__file__, '-v'])
