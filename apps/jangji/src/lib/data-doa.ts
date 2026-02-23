export interface DoaItem {
    id: string;
    title: string;
    arabic: string;
    latin: string;
    translation: string;
    category: string;
}

export const DOA_DATA: DoaItem[] = [
    {
        id: '1',
        title: 'Doa Sebelum Makan',
        arabic: 'اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ',
        latin: 'Allahumma baarik lanaa fiimaa razaqtana wa qinaa \'adzaaban naar.',
        translation: 'Ya Allah, berkahilah kami pada apa yang telah Engkau rizkikan kepada kami dan jagalah kami dari siksa api neraka.',
        category: 'Harian'
    },
    {
        id: '2',
        title: 'Doa Sesudah Makan',
        arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ',
        latin: 'Alhamdu lillahil ladzii ath\'amanaa wa saqaanaa wa ja\'alanaa muslimiin.',
        translation: 'Segala puji bagi Allah yang telah memberi makan kami dan memberi minum kami, serta menjadikan kami orang-orang islam.',
        category: 'Harian'
    },
    {
        id: '3',
        title: 'Doa Sebelum Tidur',
        arabic: 'بِاسْمِكَ اللَّهُمَّ أَحْيَا وَأَمُوتُ',
        latin: 'Bismika allahumma ahyaa wa amuutu.',
        translation: 'Dengan nama-Mu ya Allah aku hidup dan aku mati.',
        category: 'Harian'
    },
    {
        id: '4',
        title: 'Doa Bangun Tidur',
        arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
        latin: 'Alhamdu lillahil ladzii ahyaanaa ba\'da maa amaatanaa wa ilaihin nusyuur.',
        translation: 'Segala puji bagi Allah yang telah menghidupkan kami sesudah mematikan kami (tidur) dan hanya kepada-Nya kami kembali.',
        category: 'Harian'
    },
    {
        id: '5',
        title: 'Doa Masuk Kamar Mandi',
        arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ',
        latin: 'Allahumma innii a\'uudzu bika minal khubutsi wal khabaaitsi.',
        translation: 'Ya Allah, sesungguhnya aku berlindung kepada-Mu dari godaan syaitan laki-laki dan syaitan perempuan.',
        category: 'Harian'
    },
    {
        id: '6',
        title: 'Doa Keluar Kamar Mandi',
        arabic: 'غُفْرَانَكَ الْحَمْدُ لِلَّهِ الَّذِي أَذْهَبَ عَنِّي الْأَذَى وَعَافَانِي',
        latin: 'Ghufraanaka. Alhamdu lillahil ladzii adzhaba \'annil adzaa wa \'aafaanii.',
        translation: 'Aku memohon ampunan-Mu. Segala puji bagi Allah yang telah menghilangkan penyakit dari tubuhku dan menyehatkanku.',
        category: 'Harian'
    },
    {
        id: '7',
        title: 'Doa Masuk Masjid',
        arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
        latin: 'Allahummaf-tah lii abwaaba rahmatik.',
        translation: 'Ya Allah, bukakanlah bagiku pintu-pintu rahmat-Mu.',
        category: 'Ibadah'
    },
    {
        id: '8',
        title: 'Doa Keluar Masjid',
        arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
        latin: 'Allahumma innii as\'aluka min fadhlik.',
        translation: 'Ya Allah, sesungguhnya aku memohon keutamaan dari-Mu.',
        category: 'Ibadah'
    },
    {
        id: '9',
        title: 'Doa Untuk Kedua Orang Tua',
        arabic: 'رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا',
        latin: 'Rabbighfir lii waliwaalidayya warhamhumaa kamaa rabbayaanii shaghiiraa.',
        translation: 'Ya Tuhanku, ampunilah aku dan kedua orang tuaku, dan kasihilah mereka keduanya sebagaimana mereka berdua telah mendidik aku di waktu kecil.',
        category: 'Keluarga'
    },
    {
        id: '10',
        title: 'Doa Kebaikan Dunia Akhirat',
        arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
        latin: 'Rabbanaa aatinaa fid-dunyaa hasanatan wa fil-aakhirati hasanatan wa qinaa \'adzaaban naar.',
        translation: 'Ya Tuhan kami, berilah kami kebaikan di dunia dan kebaikan di akhirat dan peliharalah kami dari siksa neraka.',
        category: 'Umum'
    }
];
