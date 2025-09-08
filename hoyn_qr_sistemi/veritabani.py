# Hoyn QR Veritabanı Modülü
# Bu modül, profil ve QR tarama kayıtlarını SQLite veritabanında yönetir.
# Şifrelenmiş profil verileri ve tarama logları saklar.
# Gerekli kütüphaneler: sqlite3, datetime, uuid, json.
# Kurulum: Python standart kütüphanesi (sqlite3 dahili)

import sqlite3
import json
from datetime import datetime
import uuid
import os
from typing import Dict, List, Optional, Tuple

# Veritabanı dosya yolu
VERITABANI_DOSYASI = "hoyn_qr_veritabani.db"

class HoynVeritabaniYoneticisi:
    """
    Hoyn QR sistemi için SQLite veritabanı yöneticisi sınıfı.
    Profilleri ve QR tarama loglarını yönetir.
    """
    
    def __init__(self, db_dosyasi: str = VERITABANI_DOSYASI):
        """
        Veritabanı yöneticisini başlatır ve tabloları oluşturur.
        Girdiler: db_dosyasi (str) - Veritabanı dosya yolu
        """
        self.db_dosyasi = db_dosyasi
        self.baglanti_olustur()
        self.tablolari_olustur()
    
    def baglanti_olustur(self) -> sqlite3.Connection:
        """
        SQLite veritabanı bağlantısını oluşturur.
        Çıktı: sqlite3.Connection nesnesi
        """
        try:
            conn = sqlite3.connect(self.db_dosyasi)
            conn.execute("PRAGMA foreign_keys = ON")  # Yabancı anahtar kısıtlamalarını etkinleştir
            return conn
        except Exception as e:
            raise Exception(f"Veritabanı bağlantı hatası: {e}")
    
    def tablolari_olustur(self) -> None:
        """
        Gerekli tabloları oluşturur: profiller, qr_tarama_loglari.
        """
        conn = self.baglanti_olustur()
        try:
            cursor = conn.cursor()
            
            # Profiller tablosu
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS profiller (
                    profil_id TEXT PRIMARY KEY,
                    kullanici_id TEXT NOT NULL,
                    isim TEXT NOT NULL,
                    aciklama TEXT,
                    olusturma_zamani TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    guncelleme_zamani TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    aktif_mi BOOLEAN DEFAULT 1
                )
            """)
            
            # QR Tarama Logları tablosu
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS qr_tarama_loglari (
                    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    profil_id TEXT NOT NULL,
                    tarayici_tipi TEXT NOT NULL,
                    user_agent TEXT,
                    ip_adresi TEXT,
                    coğrafi_konum TEXT,
                    tarama_zamani TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    basarili_mi BOOLEAN DEFAULT 0,
                    FOREIGN KEY (profil_id) REFERENCES profiller (profil_id)
                )
            """)
            
            conn.commit()
            print("✅ Veritabanı tabloları başarıyla oluşturuldu.")
            
        except Exception as e:
            print(f"Tablo oluşturma hatası: {e}")
            conn.rollback()
        finally:
            conn.close()
    
    def profil_olustur(self, kullanici_id: str, isim: str, aciklama: str = "") -> str:
        """
        Yeni profil oluşturur ve profil_id döndürür.
        Girdiler: kullanici_id (str), isim (str), aciklama (str)
        Çıktı: Oluşturulan profil_id (str)
        """
        conn = self.baglanti_olustur()
        try:
            cursor = conn.cursor()
            profil_id = str(uuid.uuid4())
            
            cursor.execute("""
                INSERT INTO profiller (profil_id, kullanici_id, isim, aciklama)
                VALUES (?, ?, ?, ?)
            """, (profil_id, kullanici_id, isim, aciklama))
            
            conn.commit()
            print(f"✅ Yeni profil oluşturuldu: {isim} (ID: {profil_id})")
            return profil_id
            
        except Exception as e:
            print(f"Profil oluşturma hatası: {e}")
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def profil_bilgisi_al(self, profil_id: str) -> Optional[Dict]:
        """
        Profil bilgilerini veritabanından alır.
        Girdiler: profil_id (str)
        Çıktı: Profil bilgileri dict veya None
        """
        conn = self.baglanti_olustur()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT profil_id, kullanici_id, isim, aciklama, olusturma_zamani, aktif_mi
                FROM profiller 
                WHERE profil_id = ? AND aktif_mi = 1
            """, (profil_id,))
            
            satir = cursor.fetchone()
            if satir:
                return {
                    "profil_id": satir[0],
                    "kullanici_id": satir[1],
                    "isim": satir[2],
                    "aciklama": satir[3],
                    "olusturma_zamani": satir[4],
                    "aktif_mi": satir[5]
                }
            return None
            
        except Exception as e:
            print(f"Profil bilgisi alma hatası: {e}")
            return None
        finally:
            conn.close()
    
    def profil_var_mi(self, profil_id: str) -> bool:
        """
        Profilin var olup olmadığını kontrol eder.
        Girdiler: profil_id (str)
        Çıktı: bool
        """
        profil = self.profil_bilgisi_al(profil_id)
        return profil is not None
    
    def profil_guncelle(self, profil_id: str, isim: str = None, aciklama: str = None) -> bool:
        """
        Profil bilgilerini günceller.
        Girdiler: profil_id (str), isim (str), aciklama (str)
        Çıktı: bool (başarılı mı?)
        """
        conn = self.baglanti_olustur()
        try:
            cursor = conn.cursor()
            guncel_say = 0
            
            if isim is not None and aciklama is not None:
                cursor.execute("""
                    UPDATE profiller 
                    SET isim = ?, aciklama = ?, guncelleme_zamani = CURRENT_TIMESTAMP
                    WHERE profil_id = ?
                """, (isim, aciklama, profil_id))
                guncel_say = cursor.rowcount
            elif isim is not None:
                cursor.execute("""
                    UPDATE profiller 
                    SET isim = ?, guncelleme_zamani = CURRENT_TIMESTAMP
                    WHERE profil_id = ?
                """, (isim, profil_id))
                guncel_say = cursor.rowcount
            elif aciklama is not None:
                cursor.execute("""
                    UPDATE profiller 
                    SET aciklama = ?, guncelleme_zamani = CURRENT_TIMESTAMP
                    WHERE profil_id = ?
                """, (aciklama, profil_id))
                guncel_say = cursor.rowcount
            
            conn.commit()
            return guncel_say > 0
            
        except Exception as e:
            print(f"Profil güncelleme hatası: {e}")
            conn.rollback()
            return False
        finally:
            conn.close()
    
    def qr_tarama_logla(self, profil_id: str, tarayici_tipi: str, user_agent: str = None, 
                        ip_adresi: str = None, cografik_konum: str = None, basarili_mi: bool = False) -> bool:
        """
        QR tarama işlemini loglar.
        Girdiler: profil_id (str), tarayici_tipi (str), user_agent (str), ip_adresi (str), 
                  cografl_konum (str), basarili_mi (bool)
        Çıktı: bool (log başarılı mı?)
        """
        conn = self.baglanti_olustur()
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO qr_tarama_loglari 
                (profil_id, tarayici_tipi, user_agent, ip_adresi, coğrafi_konum, basarili_mi)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (profil_id, tarayici_tipi, user_agent, ip_adresi, cografik_konum, basarili_mi))
            
            conn.commit()
            print(f"📝 QR tarama loglandı: {tarayici_tipi} - Başarılı: {basarili_mi}")
            return True
            
        except Exception as e:
            print(f"QR tarama loglama hatası: {e}")
            conn.rollback()
            return False
        finally:
            conn.close()
    
    def tarama_loglarini_al(self, profil_id: str = None, son_gun_sayisi: int = 30) -> List[Dict]:
        """
        Tarama loglarını alır (opsiyonel filtreleme ile).
        Girdiler: profil_id (str), son_gun_sayisi (int)
        Çıktı: Log listesi (dict listesi)
        """
        conn = self.baglanti_olustur()
        try:
            cursor = conn.cursor()
            
            sorgu = """
                SELECT log_id, profil_id, tarayici_tipi, user_agent, ip_adresi, 
                       coğrafi_konum, tarama_zamani, basarili_mi
                FROM qr_tarama_loglari 
                WHERE tarama_zamani >= datetime('now', '-{} days')
            """.format(son_gun_sayisi)
            
            parametreler = []
            if profil_id:
                sorgu += " AND profil_id = ?"
                parametreler.append(profil_id)
            
            sorgu += " ORDER BY tarama_zamani DESC"
            cursor.execute(sorgu, parametreler)
            
            satirlar = cursor.fetchall()
            loglar = []
            
            for satir in satirlar:
                loglar.append({
                    "log_id": satir[0],
                    "profil_id": satir[1],
                    "tarayici_tipi": satir[2],
                    "user_agent": satir[3],
                    "ip_adresi": satir[4],
                    "cografik_konum": satir[5],
                    "tarama_zamani": satir[6],
                    "basarili_mi": bool(satir[7])
                })
            
            return loglar
            
        except Exception as e:
            print(f"Tarama logları alma hatası: {e}")
            return []
        finally:
            conn.close()
    
    def profil_sayisi_al(self, kullanici_id: str = None) -> int:
        """
        Kullanıcının profil sayısını alır.
        Girdiler: kullanici_id (str) - Opsiyonel filtre
        Çıktı: Profil sayısı (int)
        """
        conn = self.baglanti_olustur()
        try:
            cursor = conn.cursor()
            
            sorgu = "SELECT COUNT(*) FROM profiller WHERE aktif_mi = 1"
            parametreler = []
            
            if kullanici_id:
                sorgu += " AND kullanici_id = ?"
                parametreler.append(kullanici_id)
            
            cursor.execute(sorgu, parametreler)
            sonuc = cursor.fetchone()
            return sonuc[0] if sonuc else 0
            
        except Exception as e:
            print(f"Profil sayısı alma hatası: {e}")
            return 0
        finally:
            conn.close()

# Global veritabanı yöneticisi örneği
veritabani_yoneticisi = HoynVeritabaniYoneticisi()

# Yardımcı fonksiyonlar (modüler kullanım için)
def profil_olustur(kullanici_id: str, isim: str, aciklama: str = "") -> str:
    """
    Profil oluşturur (veritabanı yöneticisini kullanır).
    """
    return veritabani_yoneticisi.profil_olustur(kullanici_id, isim, aciklama)

def profil_var_mi(profil_id: str) -> bool:
    """
    Profil var mı kontrolü yapar.
    """
    return veritabani_yoneticisi.profil_var_mi(profil_id)

def profil_bilgisi_al(profil_id: str):
    """
    Profil bilgilerini alır.
    """
    return veritabani_yoneticisi.profil_bilgisi_al(profil_id)

def qr_tarama_logla(profil_id: str, tarayici_tipi: str, basarili_mi: bool = False) -> bool:
    """
    QR tarama loglar (basit versiyon).
    """
    return veritabani_yoneticisi.qr_tarama_logla(profil_id, tarayici_tipi, basarili_mi=basarili_mi)

def tarama_loglarini_al(profil_id: str = None, son_gun_sayisi: int = 30):
    """
    Tarama loglarını alır.
    """
    return veritabani_yoneticisi.tarama_loglarini_al(profil_id, son_gun_sayisi)

# Test fonksiyonları
if __name__ == "__main__":
    # Test veritabanı işlemleri
    print("🧪 Veritabanı testleri başlıyor...")
    
    # Test profil oluştur
    test_kullanici_id = "test-user-123"
    test_profil_id = profil_olustur(test_kullanici_id, "Test Profil", "Bu bir test profilidir.")
    print(f"Test profil ID: {test_profil_id}")
    
    # Profil bilgisi al
    profil_bilgisi = veritabani_yoneticisi.profil_bilgisi_al(test_profil_id)
    if profil_bilgisi:
        print(f"Profil bilgileri: {profil_bilgisi}")
    
    # QR tarama logla
    qr_tarama_logla(test_profil_id, "hoyn_scanner", basarili_mi=True)
    qr_tarama_logla(test_profil_id, "third_party", basarili_mi=False)
    
    # Logları al
    loglar = veritabani_yoneticisi.tarama_loglarini_al(test_profil_id)
    print(f"Tarama logları: {len(loglar)} adet")
    
    # Temizlik (test için)
    # conn = veritabani_yoneticisi.baglanti_olustur()
    # conn.execute("DELETE FROM qr_tarama_loglari")
    # conn.execute("DELETE FROM profiller")
    # conn.commit()
    # conn.close()
    
    print("✅ Veritabanı testleri tamamlandı.")
