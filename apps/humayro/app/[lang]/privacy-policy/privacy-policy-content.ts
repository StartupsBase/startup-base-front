// Transcribed from Humayro_Maxfiylik_Siyosati_UZ.docx (version 1.0).
// Preserve the source wording, numbering gaps, and pending operator details.
export type PolicyDetail = {
  label: string
  value: string
  href?: string
}

export type PolicyBlock =
  | { type: "paragraph" | "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; rows: PolicyDetail[] }

type PolicyDocument = {
  brand: string
  title: string
  subtitle: string
  metadata: PolicyDetail[]
  introduction: string[]
  sections: {
    id: string
    number: string
    title: string
    blocks: PolicyBlock[]
  }[]
}

export const privacyPolicy: PolicyDocument = {
  brand: "HUMAYRO",
  title: "Maxfiylik siyosati",
  subtitle:
    "Ko‘p tashkilotli savdo, filiallar va biznes boshqaruvi platformasi",
  metadata: [
    {
      label: "Versiya",
      value: "1.0",
    },
    {
      label: "Oxirgi yangilanish",
      value: "31 avgust 2026",
    },
    {
      label: "Platforma",
      value: "Humayro / humayro.uz",
    },
    {
      label: "Operator",
      value: "Humayro platformasi operatori",
    },
  ],
  introduction: [
    "Humayro xizmatlaridan foydalanganingiz uchun tashakkur.",
    "Ushbu Maxfiylik siyosati Humayro orqali qayta ishlanadigan shaxsiy ma’lumotlar, ularning ishlatilish maqsadlari, ma’lumotlarni himoyalash choralari va foydalanuvchilarning huquqlarini tushuntiradi.",
  ],
  sections: [
    {
      id: "section-2",
      number: "2",
      title: "Biz qanday ma’lumotlarni yig‘amiz",
      blocks: [
        {
          type: "heading",
          text: "2.1. Hisob va aloqa ma’lumotlari",
        },
        {
          type: "list",
          items: [
            "ism, familiya va ko‘rsatiladigan profil nomi;",
            "telefon raqami va elektron pochta manzili;",
            "foydalanuvchi nomi, ichki ID va akkaunt identifikatorlari;",
            "profil rasmi yoki avatar, agar foydalanuvchi uni yuklasa;",
            "autentifikatsiya ma’lumotlari, tasdiqlash holati, sessiya identifikatorlari va xavfsizlik bilan bog‘liq texnik ma’lumotlar;",
            "til, interfeys va aloqa bo‘yicha foydalanuvchi tanlovlari.",
          ],
        },
        {
          type: "heading",
          text: "2.2. Tashkilot, filial va xodimlarga oid ma’lumotlar",
        },
        {
          type: "paragraph",
          text: "Agar foydalanuvchi Humayro’dan tashkilot nomidan foydalansa, biz uning tashkilot va filial bilan bog‘liqligi haqidagi ma’lumotlarni ham qayta ishlashimiz mumkin.",
        },
        {
          type: "list",
          items: [
            "tashkilot nomi, filial yoki savdo nuqtasi;",
            "foydalanuvchining lavozimi, roli va ruxsat darajasi;",
            "owner, administrator, manager, cashier, operator, analyst yoki boshqa tizim roli;",
            "foydalanuvchi bajargan muhim amallar, tizimga kirish va audit yozuvlari;",
            "tashkilot tomonidan xodim yoki vakil haqida kiritilgan aloqa ma’lumotlari.",
          ],
        },
        {
          type: "heading",
          text: "2.3. Buyurtma va savdo ma’lumotlari",
        },
        {
          type: "list",
          items: [
            "tanlangan mahsulotlar va ularning miqdori;",
            "narx, chegirma, buyurtmaning umumiy summasi va valyuta;",
            "buyurtma raqami, sanasi, holati, bekor qilish, qaytarish yoki refund ma’lumotlari, agar qo‘llab-quvvatlansa;",
            "tanlangan tashkilot va buyurtmani bajaruvchi filial;",
            "yetkazib berish yoki olib ketish uchun zarur aloqa ma’lumotlari;",
            "to‘lov holati, tranzaksiya identifikatori va to‘lov provayderidan olingan texnik javob ma’lumotlari.",
          ],
        },
        {
          type: "heading",
          text: "2.4. Manzil va lokatsiya ma’lumotlari",
        },
        {
          type: "list",
          items: [
            "viloyat, tuman, shahar va foydalanuvchi kiritgan yetkazib berish manzili;",
            "filialning manzili, latitude va longitude koordinatalari;",
            "agar tegishli funksiya yoqilgan bo‘lsa va foydalanuvchi ruxsat bersa — qurilmaning joylashuv ma’lumoti.",
          ],
        },
        {
          type: "paragraph",
          text: "Humayro foydalanuvchining aniq geolokatsiyasini yashirin tarzda olishni maqsad qilmaydi. Qurilmaning aniq joylashuvi kerak bo‘lgan funksiyalarda brauzer yoki operatsion tizim ruxsati so‘ralishi mumkin.",
        },
        {
          type: "heading",
          text: "2.5. Reytinglar, sharhlar va foydalanuvchi yaratgan kontent",
        },
        {
          type: "list",
          items: [
            "mahsulot yoki tashkilotga berilgan reyting;",
            "yozma sharh, izoh yoki fikr;",
            "foydalanuvchi yuklagan rasm yoki fayl, agar bunday imkoniyat mavjud bo‘lsa;",
            "kontent yuborilgan sana va unga bog‘langan akkaunt ma’lumoti;",
            "shikoyat, moderatsiya yoki support bilan bog‘liq yozuvlar.",
          ],
        },
        {
          type: "heading",
          text: "2.6. Texnik va avtomatik yig‘iladigan ma’lumotlar",
        },
        {
          type: "list",
          items: [
            "IP manzil;",
            "brauzer turi va versiyasi;",
            "qurilma turi, operatsion tizim va til;",
            "sahifalar va ekranlarga tashrif, bosishlar va funksiyalardan foydalanish hodisalari;",
            "login va xavfsizlik hodisalari;",
            "cookie, localStorage, sessionStorage va boshqa texnik identifikatorlar;",
            "xatolik loglari, API so‘rov metama’lumotlari, ishlash tezligi va diagnostika ma’lumotlari.",
          ],
        },
        {
          type: "heading",
          text: "2.7. Qo‘llab-quvvatlash va aloqa ma’lumotlari",
        },
        {
          type: "list",
          items: [
            "support so‘rovlari va yozishmalar;",
            "xatolik, shikoyat yoki takliflar;",
            "muammoni aniqlash va hal qilish uchun yuborilgan qo‘shimcha ma’lumotlar va fayllar.",
          ],
        },
      ],
    },
    {
      id: "section-3",
      number: "3",
      title: "Biz ma’lumotlarni qanday olamiz",
      blocks: [
        {
          type: "paragraph",
          text: "Humayro ma’lumotlarni quyidagi manbalardan olishi mumkin:",
        },
        {
          type: "list",
          items: [
            "foydalanuvchining o‘zidan — ro‘yxatdan o‘tish, buyurtma berish, sharh qoldirish, support’ga murojaat qilish yoki boshqa funksiyalardan foydalanish vaqtida;",
            "tashkilotdan — masalan, tashkilot o‘z xodimi uchun akkaunt yaratganda yoki ish jarayoniga zarur ma’lumotlarni platformaga kiritganda;",
            "qurilma va brauzerdan — cookie, log, texnik identifikator va xavfsizlik mexanizmlari orqali;",
            "to‘lov, yetkazib berish, SMS, autentifikatsiya, xarita yoki boshqa integratsiya provayderlaridan — faqat tegishli xizmatni taqdim etish uchun zarur bo‘lgan darajada;",
            "qonun bilan ruxsat etilgan boshqa manbalardan.",
          ],
        },
      ],
    },
    {
      id: "section-4",
      number: "4",
      title: "Ma’lumotlaringizdan qanday foydalanamiz",
      blocks: [
        {
          type: "paragraph",
          text: "Biz yig‘ilgan ma’lumotlardan quyidagi maqsadlarda foydalanishimiz mumkin:",
        },
        {
          type: "list",
          items: [
            "akkaunt yaratish, autentifikatsiya qilish va akkaunt xavfsizligini ta’minlash;",
            "Humayro marketplace va do‘kon interfeyslarini ishlatish;",
            "tashkilotlarga filiallar, mahsulotlar, ombor/qoldiq, buyurtmalar, xodimlar va rollarni boshqarish imkonini berish;",
            "buyurtmalarni qabul qilish, tegishli filialga yo‘naltirish, qayta ishlash va holatini yangilash;",
            "yetkazib berish yoki pickup jarayonlarini tashkil etish;",
            "filiallararo mahsulot ko‘chirish va inventar harakatlarini qayd etish;",
            "to‘lovlarni uchinchi tomon to‘lov provayderlari orqali amalga oshirish va tasdiqlash;",
            "reytinglar, sharhlar va feedback funksiyalarini taqdim etish;",
            "tashkilotlarga savdo, buyurtma, qoldiq, filial, mijoz va mahsulot bo‘yicha tahliliy ko‘rsatkichlarni taqdim etish;",
            "til, filial, katalog va interfeys sozlamalarini saqlash;",
            "xavfsizlik ogohlantirishlari, buyurtma holati, tizim yangilanishlari va support javoblarini yuborish;",
            "firibgarlik, spam, buzib kirish, noqonuniy foydalanish va boshqa xavfsizlik tahdidlarini aniqlash va oldini olish;",
            "xatoliklarni aniqlash, tizim ishlashini kuzatish va platformani yaxshilash;",
            "agregatsiyalangan, statistik yoki identifikatsiyalash imkonini bermaydigan tahlillarni yaratish;",
            "qonuniy majburiyatlarni bajarish, nizolarni ko‘rib chiqish va huquqiy da’volarni himoya qilish.",
          ],
        },
      ],
    },
    {
      id: "section-5",
      number: "5",
      title: "Tashkilotlar, filiallar va ma’lumotlarga kirish",
      blocks: [
        {
          type: "paragraph",
          text: "Humayro ko‘p tashkilotli (multi-tenant) platforma sifatida ishlab chiqiladi. Har bir tashkilot o‘z tashkilotiga tegishli foydalanuvchilar, filiallar, mahsulotlar, buyurtmalar, qoldiqlar va boshqa biznes ma’lumotlarini boshqaradi.",
        },
        {
          type: "paragraph",
          text: "Tashkilot ichidagi ma’lumotlarga kirish foydalanuvchiga berilgan rol va ruxsatlarga bog‘liq bo‘lishi mumkin. Masalan, tashkilot egasi barcha filiallarni ko‘rishi mumkin, filial xodimi esa faqat o‘z filialiga tegishli ma’lumotlarni ko‘rishi mumkin.",
        },
        {
          type: "paragraph",
          text: "Humayro bir tashkilotning yopiq operatsion ma’lumotlarini boshqa mustaqil tashkilotga odatda oshkor qilmaydi. Bunday ma’lumotlar faqat xizmatni taqdim etish, foydalanuvchining yoki tashkilotning aniq ko‘rsatmasi, integratsiya zarurati yoki qonuniy talab mavjud bo‘lganda qayta ishlanishi mumkin.",
        },
        {
          type: "paragraph",
          text: "Tashkilot administratorlari o‘z xodimlariga to‘g‘ri rol va ruxsat berish, ishdan ketgan yoki vakolati tugagan foydalanuvchilarning kirishini o‘z vaqtida bekor qilish hamda o‘z tashkiloti doirasidagi shaxsiy ma’lumotlardan qonuniy foydalanish uchun javobgardir.",
        },
      ],
    },
    {
      id: "section-6",
      number: "6",
      title: "Buyurtmalar, yetkazib berish va olib ketish",
      blocks: [
        {
          type: "paragraph",
          text: "Foydalanuvchi buyurtma berganda, buyurtmani bajarish uchun zarur bo‘lgan ma’lumotlar tegishli tashkilot va filialga taqdim etilishi mumkin. Bunga ism, telefon raqami, buyurtma tarkibi, miqdor, yetkazib berish manzili, izoh, to‘lov holati va buyurtmani bajarishga zarur boshqa ma’lumotlar kirishi mumkin.",
        },
        {
          type: "paragraph",
          text: "Agar Humayro uchinchi tomon yetkazib berish xizmatlari bilan integratsiya qilinsa, yetkazib berishni amalga oshirish uchun zarur minimal ma’lumotlar, masalan, qabul qiluvchi ismi, telefon raqami, manzil, buyurtma raqami va yetkazib berish bo‘yicha ko‘rsatmalar tegishli provayderga yuborilishi mumkin.",
        },
      ],
    },
    {
      id: "section-7",
      number: "7",
      title: "Filiallararo mahsulot ko‘chirish",
      blocks: [
        {
          type: "paragraph",
          text: "Humayro tashkilotga mahsulot yoki tovarlarni bir filialdan boshqa filialga ko‘chirish imkoniyatini taqdim etishi mumkin. Bunday operatsiyalar doirasida manba filial, qabul qiluvchi filial, mahsulot, miqdor, status, sana-vaqt, mas’ul foydalanuvchilar, izoh va audit yozuvlari qayta ishlanishi mumkin.",
        },
        {
          type: "paragraph",
          text: "Agar filiallararo harakat yozuvlari aniq xodim yoki foydalanuvchi bilan bog‘langan bo‘lsa, bu ma’lumotlar hisobdorlik, qoldiqni solishtirish, nizolarni hal qilish, firibgarlikning oldini olish va audit maqsadlarida saqlanishi mumkin.",
        },
      ],
    },
    {
      id: "section-8",
      number: "8",
      title: "To‘lov ma’lumotlari",
      blocks: [
        {
          type: "paragraph",
          text: "Humayro O‘zbekistonda ishlaydigan to‘lov tizimlari, bank yoki boshqa elektron to‘lov provayderlari bilan integratsiya qilishi mumkin. Muayyan provayderlar platforma rivojlanishiga qarab o‘zgarishi mumkin.",
        },
        {
          type: "paragraph",
          text: "To‘liq bank karta ma’lumotlari Humayro tomonidan bevosita saqlanishi shart emas va amaliyotda bunday ma’lumotlar tegishli to‘lov provayderining xavfsiz sahifasi yoki API’si orqali qayta ishlanishi mumkin. Humayro tranzaksiya ID, to‘lov holati, summa, vaqt, provayder javob kodi va zarur bo‘lsa maskalangan karta ma’lumotlarini olishi mumkin.",
        },
        {
          type: "paragraph",
          text: "To‘lov provayderlari foydalanuvchi ma’lumotlarini o‘z shartlari va maxfiylik siyosati asosida mustaqil ravishda qayta ishlashi mumkin.",
        },
      ],
    },
    {
      id: "section-9",
      number: "9",
      title: "Reytinglar va sharhlar",
      blocks: [
        {
          type: "paragraph",
          text: "Humayro foydalanuvchilarga mahsulot yoki tashkilot haqida reyting va sharh qoldirish imkonini berishi mumkin. Platforma dizayniga qarab sharh bilan birga foydalanuvchi nomi yoki nickname, avatar, sana va reyting ko‘rsatilishi mumkin.",
        },
        {
          type: "paragraph",
          text: "Foydalanuvchilar sharhlarda o‘zining yoki boshqa shaxslarning ortiqcha shaxsiy, maxfiy yoki sezgir ma’lumotlarini joylashtirmasligi kerak. Humayro yoki tegishli tashkilot qonunga, platforma qoidalariga yoki uchinchi shaxs huquqlariga zid kontentni moderatsiya qilishi, yashirishi yoki o‘chirishi mumkin.",
        },
      ],
    },
    {
      id: "section-10",
      number: "10",
      title: "Cookie va shunga o‘xshash texnologiyalar",
      blocks: [
        {
          type: "paragraph",
          text: "Humayro quyidagi maqsadlarda cookie, localStorage, sessionStorage va boshqa texnik mexanizmlardan foydalanishi mumkin:",
        },
        {
          type: "list",
          items: [
            "foydalanuvchini tizimga kirgan holatda saqlash;",
            "sessiya va autentifikatsiyani boshqarish;",
            "til, filial yoki boshqa sozlamalarni eslab qolish;",
            "xavfsizlik va anti-abuse mexanizmlarini ishlatish;",
            "tizim ishlash tezligini va funksiyalardan foydalanishni o‘lchash;",
            "xatoliklarni aniqlash va product analytics yuritish.",
          ],
        },
        {
          type: "paragraph",
          text: "Brauzer sozlamalari orqali cookie’larni boshqarish mumkin. Ammo zarur cookie yoki browser storage’ni bloklash Humayro’ning ayrim funksiyalari to‘g‘ri ishlamasligiga olib kelishi mumkin.",
        },
      ],
    },
    {
      id: "section-11",
      number: "11",
      title: "Analitika va platformani rivojlantirish",
      blocks: [
        {
          type: "paragraph",
          text: "Humayro foydalanuvchilar va tashkilotlarga yaxshiroq xizmat ko‘rsatish uchun platformadan foydalanish haqidagi ma’lumotlarni tahlil qilishi mumkin. Bunday tahlillar xatolarni aniqlash, UX’ni yaxshilash, yangi funksiyalarni rejalashtirish, xavfsizlikni kuchaytirish va tizim samaradorligini oshirish uchun ishlatiladi.",
        },
        {
          type: "paragraph",
          text: "Tashkilotlar uchun analytics buyurtmalar soni, savdo hajmi, mahsulotlar ko‘rsatkichi, filial samaradorligi, qoldiq va inventar harakati, mijoz faolligi, reytinglar va boshqa biznes ko‘rsatkichlarini o‘z ichiga olishi mumkin. Tashkilot ichidagi analytics’ga kirish rol va ruxsatlar bilan cheklanadi.",
        },
      ],
    },
    {
      id: "section-12",
      number: "12",
      title: "Ma’lumotlarni kim bilan ulashishimiz mumkin",
      blocks: [
        {
          type: "paragraph",
          text: "Biz shaxsiy ma’lumotlarni sotmaymiz yoki ijaraga bermaymiz. Ma’lumotlar quyidagi holatlarda ulashilishi mumkin:",
        },
        {
          type: "list",
          items: [
            "buyurtmani bajaruvchi tashkilot va filial bilan;",
            "to‘lov, yetkazib berish, SMS/e-mail, hosting, xarita, monitoring, autentifikatsiya va boshqa zarur xizmat provayderlari bilan;",
            "foydalanuvchining yoki tashkilotning aniq topshirig‘i bo‘yicha;",
            "qonuniy talab, sud qarori yoki vakolatli davlat organining qonuniy so‘rovi bo‘yicha;",
            "Humayro biznesining sotilishi, qo‘shilishi, restrukturizatsiyasi yoki aktivlarning o‘tkazilishi kabi korporativ holatlarda, qonun bilan ruxsat etilgan doirada.",
          ],
        },
        {
          type: "paragraph",
          text: "Uchinchi tomon xizmat ko‘rsatuvchilarga faqat ular bajaradigan vazifa uchun zarur bo‘lgan hajmdagi ma’lumot berishga intilamiz.",
        },
      ],
    },
    {
      id: "section-13",
      number: "13",
      title: "Uchinchi tomon servis va integratsiyalari",
      blocks: [
        {
          type: "paragraph",
          text: "Humayro kelajakda to‘lov tizimlari, xaritalar, SMS, e-mail, cloud hosting, analytics, error monitoring, autentifikatsiya, delivery va boshqa servislar bilan integratsiya qilishi mumkin. Ushbu uchinchi tomonlar o‘z xizmatlari doirasida shaxsiy ma’lumotlarni o‘z maxfiylik siyosati va shartlari asosida qayta ishlashi mumkin.",
        },
        {
          type: "paragraph",
          text: "Humayro mustaqil uchinchi tomonlarning o‘z platformasida olib boradigan ma’lumot qayta ishlash faoliyati uchun, agar ular Humayro nomidan processor sifatida ishlamasa, to‘liq javobgar bo‘lmasligi mumkin.",
        },
      ],
    },
    {
      id: "section-14",
      number: "14",
      title: "Ma’lumotlarni himoyalash choralarimiz",
      blocks: [
        {
          type: "paragraph",
          text: "Biz shaxsiy va biznes ma’lumotlarini ruxsatsiz kirish, o‘zgartirish, oshkor qilish, yo‘qotish yoki noqonuniy qayta ishlashdan himoya qilish uchun texnik va tashkiliy choralarni qo‘llashga intilamiz.",
        },
        {
          type: "list",
          items: [
            "HTTPS/TLS orqali ma’lumotlarni uzatishda shifrlash;",
            "parollarni ochiq matn shaklida saqlamaslik va xavfsiz hashing mexanizmlaridan foydalanish;",
            "role-based access control va least-privilege yondashuvi;",
            "sessiya, token va autentifikatsiya xavfsizligi;",
            "audit log, monitoring va xavfsizlik hodisalarini qayd etish;",
            "backup va tiklash jarayonlari;",
            "dependency, server va ilova zaifliklarini nazorat qilish;",
            "maxfiy konfiguratsiyalar va API kalitlariga kirishni cheklash;",
            "xodimlar va administratorlar kirishini ehtiyojga ko‘ra cheklash;",
            "xavfsizlik hodisalari yuz berganda ularni aniqlash, tekshirish va bartaraf etish jarayonlari.",
          ],
        },
        {
          type: "paragraph",
          text: "Shunga qaramay, internet orqali ishlaydigan hech bir tizim mutlaq xavfsizlikni kafolatlay olmaydi. Foydalanuvchilar ham o‘z login ma’lumotlari, qurilmalari, parollari va kirish tokenlarini himoya qilishi kerak.",
        },
      ],
    },
    {
      id: "section-15",
      number: "15",
      title: "Ma’lumotlarni saqlash muddati",
      blocks: [
        {
          type: "paragraph",
          text: "Humayro shaxsiy ma’lumotlarni ularni yig‘ish maqsadi, amaldagi qonunchilik, shartnoma, buxgalteriya, xavfsizlik, nizolarni hal qilish va qonuniy manfaatlarni himoya qilish uchun zarur bo‘lgan muddat davomida saqlashi mumkin.",
        },
        {
          type: "paragraph",
          text: "Akkaunt o‘chirilgandan keyin ham buyurtma, to‘lov, audit yoki xavfsizlik yozuvlarining ayrim qismlari qonuniy yoki operatsion majburiyatlar sababli ma’lum muddat davomida saqlanishi mumkin. Zarurat qolmaganda ma’lumotlar o‘chirilishi, anonimlashtirilishi yoki identifikatsiya imkoniyati cheklanishi mumkin.",
        },
      ],
    },
    {
      id: "section-16",
      number: "16",
      title: "Ma’lumotlarning joylashuvi va xalqaro uzatishlar",
      blocks: [
        {
          type: "paragraph",
          text: "Humayro O‘zbekiston Respublikasining shaxsiy ma’lumotlarni saqlash va qayta ishlashga oid talablariga rioya qilishga intiladi. Texnik infratuzilma, backup, monitoring yoki ayrim integratsiyalar sababli ma’lumotlarni qayta ishlashda mahalliy va xorijiy xizmat provayderlari ishtirok etishi mumkin.",
        },
        {
          type: "paragraph",
          text: "Agar ma’lumotlar boshqa davlatga uzatilishi yoki xorijda qayta ishlanishi zarur bo‘lsa, Humayro bunday jarayonni amaldagi qonunchilik, zarur himoya choralari va tegishli huquqiy asoslar doirasida tashkil etishga intiladi.",
        },
      ],
    },
    {
      id: "section-17",
      number: "17",
      title: "Foydalanuvchi nazorati va huquqlari",
      blocks: [
        {
          type: "paragraph",
          text: "Amaldagi qonunchilik doirasida foydalanuvchi quyidagi huquqlarga ega bo‘lishi mumkin:",
        },
        {
          type: "list",
          items: [
            "o‘z shaxsiy ma’lumotlari qanday qayta ishlanayotgani haqida ma’lumot olish;",
            "o‘z akkaunti va profil ma’lumotlarini ko‘rish va tahrirlash;",
            "noto‘g‘ri yoki to‘liq bo‘lmagan ma’lumotlarni tuzatishni so‘rash;",
            "tegishli holatlarda ma’lumotlarni o‘chirish, bloklash yoki qayta ishlashni to‘xtatishni so‘rash;",
            "qayta ishlash rozilikka asoslangan bo‘lsa, rozilikni qaytarib olish;",
            "qonun bilan nazarda tutilgan tartibda vakolatli organga shikoyat qilish yoki o‘z huquqlarini himoya qilish.",
          ],
        },
        {
          type: "paragraph",
          text: "Ayrim ma’lumotlar Humayro’dan foydalanuvchi tashkilot tomonidan yig‘ilgan va boshqarilgan bo‘lishi mumkin. Bunday holatda so‘rov tegishli tashkilot tomonidan ko‘rib chiqilishi mumkin, Humayro esa texnik jihatdan yordam berishi mumkin.",
        },
      ],
    },
    {
      id: "section-18",
      number: "18",
      title: "Akkauntni o‘chirish va ma’lumotlarni olib tashlash",
      blocks: [
        {
          type: "paragraph",
          text: "Foydalanuvchi akkauntni o‘chirish funksiyasi mavjud bo‘lsa, ilova yoki sayt sozlamalari orqali akkauntni o‘chirishni so‘rashi, yoki Humayro support xizmatiga murojaat qilishi mumkin.",
        },
        {
          type: "paragraph",
          text: "Akkauntni o‘chirish barcha tarixiy yozuvlarning shu zahoti o‘chirilishini anglatmasligi mumkin. Humayro yoki tegishli tashkilot buxgalteriya, tranzaksiya tarixi, nizolar, firibgarlikning oldini olish, audit, xavfsizlik yoki boshqa qonuniy majburiyatlar uchun zarur ma’lumotlarni saqlashi mumkin.",
        },
      ],
    },
    {
      id: "section-19",
      number: "19",
      title: "Xabarnomalar va marketing",
      blocks: [
        {
          type: "paragraph",
          text: "Humayro login tasdiqlash kodi, buyurtma holati, xavfsizlik ogohlantirishi, xizmatdagi muhim o‘zgarishlar va support javoblari kabi xizmat ko‘rsatish uchun zarur xabarlarni yuborishi mumkin.",
        },
        {
          type: "paragraph",
          text: "Reklama yoki marketing xabarlari qonun bilan ruxsat etilgan holatda va zarur bo‘lsa foydalanuvchi roziligi asosida yuboriladi. Foydalanuvchi ixtiyoriy marketing xabarlaridan voz kechishi mumkin; bu zarur servis xabarlariga ta’sir qilmaydi.",
        },
      ],
    },
    {
      id: "section-20",
      number: "20",
      title: "Voyaga yetmagan foydalanuvchilar",
      blocks: [
        {
          type: "paragraph",
          text: "Humayro asosan mustaqil ravishda xizmatlardan foydalanish va tegishli tijorat munosabatlariga kirish huquqiga ega shaxslar uchun mo‘ljallangan. Agar qonun bo‘yicha voyaga yetmagan shaxs uchun ota-ona yoki qonuniy vakil roziligi talab qilinsa, Humayro bunday ma’lumotlarni tegishli ruxsatsiz ataylab yig‘ishni maqsad qilmaydi.",
        },
      ],
    },
    {
      id: "section-22",
      number: "22",
      title: "Avtomatlashtirilgan tahlil va tavsiyalar",
      blocks: [
        {
          type: "paragraph",
          text: "Humayro qidiruv, filter, ranking, analytics, qoldiq bo‘yicha ogohlantirish, mahsulot tavsiyasi, fraud signal yoki biznes dashboard kabi avtomatlashtirilgan funksiyalardan foydalanishi mumkin. Bunday funksiyalar platforma va tashkilot foydalanuvchilariga qaror qabul qilishni yengillashtirish uchun mo‘ljallangan.",
        },
        {
          type: "paragraph",
          text: "Agar kelajakda Humayro shaxsga sezilarli huquqiy yoki moliyaviy ta’sir ko‘rsatadigan AI yoki avtomatlashtirilgan qaror qabul qilish funksiyalarini joriy etsa, ushbu Siyosat va tegishli foydalanuvchi xabarnomalari yangilanadi.",
        },
      ],
    },
    {
      id: "section-23",
      number: "23",
      title: "Xavfsizlik hodisalari",
      blocks: [
        {
          type: "paragraph",
          text: "Agar Humayro shaxsiy ma’lumotlarga ruxsatsiz kirish, oshkor qilish, o‘zgartirish, yo‘qotish yoki boshqa xavfsizlik hodisasi haqida xabar topsa, hodisani tekshiradi va imkon qadar tezroq cheklash hamda bartaraf etish choralarini ko‘radi.",
        },
        {
          type: "paragraph",
          text: "Agar amaldagi qonunchilik foydalanuvchi, tashkilot yoki vakolatli organni xabardor qilishni talab qilsa, Humayro tegishli tartib va muddatlarda zarur xabarnomalarni berishga intiladi.",
        },
      ],
    },
    {
      id: "section-24",
      number: "24",
      title: "Tashkilotlarning majburiyatlari",
      blocks: [
        {
          type: "paragraph",
          text: "Humayro’dan foydalanuvchi har bir tashkilot o‘z faoliyati doirasida quyidagilar uchun javobgardir:",
        },
        {
          type: "list",
          items: [
            "shaxsiy ma’lumotlarni qonuniy asosda yig‘ish va zarur ogohlantirishlarni berish;",
            "zarur bo‘lsa tegishli rozilikni olish;",
            "faqat ish uchun kerak bo‘lgan ma’lumotlarni yig‘ish;",
            "mijoz va xodim ma’lumotlarini to‘g‘ri va yangilangan holatda saqlash;",
            "foydalanuvchilarga to‘g‘ri rol va ruxsatlarni berish;",
            "vakolati tugagan xodimlarning kirishini bekor qilish;",
            "o‘z mijozlari yoki xodimlaridan kelgan maxfiylik so‘rovlarini qonuniy tartibda ko‘rib chiqish;",
            "Humayro akkaunti buzilgan yoki noqonuniy foydalanish aniqlangan taqdirda Humayro’ga imkon qadar tez xabar berish.",
          ],
        },
      ],
    },
    {
      id: "section-26",
      number: "26",
      title: "O‘zbekiston Respublikasi qonunchiligiga rioya",
      blocks: [
        {
          type: "paragraph",
          text: "Humayro shaxsiy ma’lumotlarni O‘zbekiston Respublikasining amaldagi qonunchiligiga, shu jumladan 2019-yil 2-iyuldagi O‘RQ-547-son “Shaxsga doir ma’lumotlar to‘g‘risida”gi Qonun va unga kiritilgan o‘zgartirishlar doirasida qayta ishlashga intiladi.",
        },
        {
          type: "paragraph",
          text: "Agar ushbu Siyosatning ayrim qoidalari amaldagi majburiy qonunchilik talablariga zid bo‘lsa, qonunchilik talablari ustuvor qo‘llanadi.",
        },
      ],
    },
    {
      id: "section-27",
      number: "27",
      title: "Biz bilan bog‘lanish",
      blocks: [
        {
          type: "paragraph",
          text: "Ushbu Maxfiylik siyosati, shaxsiy ma’lumotlaringiz yoki Humayro’dagi maxfiylik bilan bog‘liq so‘rovlaringiz bo‘lsa, quyidagi kanallar orqali biz bilan bog‘lanishingiz mumkin:",
        },
        {
          type: "table",
          rows: [
            {
              label: "Platforma",
              value: "Humayro",
            },
            {
              label: "Veb-sayt",
              value: "https://humayro.uz",
              href: "https://humayro.uz",
            },
            {
              label: "E-mail",
              value: "support@humayro.uz",
              href: "mailto:support@humayro.uz",
            },
            {
              label: "Yuridik ma’lumotlar",
              value:
                "Platforma operatorining rasmiy rekvizitlari ishga tushirishdan oldin ushbu bo‘limga kiritiladi.",
            },
          ],
        },
      ],
    },
  ],
}
