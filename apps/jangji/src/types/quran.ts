export interface SurahBase {
    nomor: number;
    nama: string;
    namaLatin: string;
    jumlahAyat: number;
    tempatTurun: string;
    arti: string;
    deskripsi: string;
    audioFull: Record<string, string>;
}

export interface Ayah {
    nomorAyat: number;
    teksArab: string;
    teksLatin: string;
    teksIndonesia: string;
    audio: Record<string, string>;
}

export interface SurahDetail extends SurahBase {
    ayat: Ayah[];
    suratSelanjutnya: SurahBase | false;
    suratSebelumnya: SurahBase | false;
}

export interface QuranResponse<T> {
    code: number;
    message: string;
    data: T;
}
