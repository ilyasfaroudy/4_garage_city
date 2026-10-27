// Single source of truth: the map, the list, the detail panel and the booking
// configurator are all rendered from the arrays below.

export const SLOT_TIMES = ['12:00', '13:30', '15:00', '16:30', '18:00', '19:30', '21:00'];

// '1' = slot is open for booking, '0' = slot is already taken by another client.
const pick = (mask) => SLOT_TIMES.filter((_, i) => mask[i] === '1');

export const SPACE_TYPES = [
  { id: 'detail', label: 'DETAIL' },
  { id: 'workshop', label: 'WORKSHOP' },
  { id: 'tuning', label: 'TUNING' },
  { id: 'photo', label: 'PHOTO' },
  { id: 'wash', label: 'WASH' },
  { id: 'diagnostics', label: 'DIAGNOSTICS' },
  { id: 'private', label: 'PRIVATE' },
  { id: 'club', label: 'CLUB' },
];

export const NEEDS = [
  { id: 'clean', label: 'CLEAN', hint: 'Мойка и детейлинг', types: ['wash', 'detail'] },
  { id: 'repair', label: 'REPAIR', hint: 'Подъёмник и диагностика', types: ['workshop', 'diagnostics'] },
  { id: 'modify', label: 'MODIFY', hint: 'Тюнинг и установка', types: ['tuning'] },
  { id: 'shoot', label: 'SHOOT', hint: 'Студии и циклорамы', types: ['photo'] },
  { id: 'store', label: 'STORE', hint: 'Приватное хранение', types: ['private'] },
  { id: 'meet', label: 'MEET', hint: 'Клубные пространства', types: ['club'] },
];

export const SERVICES = [
  {
    id: 'detailing', name: 'DETAILING', priceModifier: 1500, minDuration: 2,
    description: 'Полировка, керамика, химчистка салона. Замер толщины ЛКП включён.',
  },
  {
    id: 'diagnostics', name: 'DIAGNOSTICS', priceModifier: 1200, minDuration: 1,
    description: 'Компьютерная диагностика, чтение ошибок, отчёт по узлам.',
  },
  {
    id: 'workshop', name: 'WORKSHOP RENT', priceModifier: 500, minDuration: 1,
    description: 'Самостоятельная работа: бокс, базовый инструмент, инструктаж.',
  },
  {
    id: 'tuning', name: 'TUNING INSTALLATION', priceModifier: 2500, minDuration: 3,
    description: 'Установка подвески, тормозов и аэродинамики вместе с мастером.',
  },
  {
    id: 'photo', name: 'PHOTO SESSION', priceModifier: 2000, minDuration: 2,
    description: 'Студия, базовая световая схема и ассистент на площадке.',
  },
  {
    id: 'storage', name: 'PRIVATE STORAGE', priceModifier: 800, minDuration: 1,
    description: 'Закрытый бокс с персональным кодом доступа и видеоконтролем.',
  },
  {
    id: 'wash', name: 'WASH', priceModifier: 600, minDuration: 1,
    description: 'Бесконтактная мойка: активная пена, осмос, сушка воздухом.',
  },
  {
    id: 'club', name: 'CLUB SPACE', priceModifier: 1000, minDuration: 2,
    description: 'Лаунж, выставочные места и зона встреч для клубных событий.',
  },
];

export const EXTRAS = [
  { id: 'tools-kit', name: 'TOOLS KIT', price: 700, description: 'Расширенный набор инструмента' },
  { id: 'lift-access', name: 'LIFT ACCESS', price: 1000, description: 'Доступ к подъёмнику на всё время' },
  { id: 'photo-light', name: 'PHOTO LIGHT', price: 900, description: 'Дополнительные источники света' },
  { id: 'storage', name: 'STORAGE', price: 500, description: 'Хранение колёс и вещей до 7 дней' },
  { id: 'detail-products', name: 'DETAIL PRODUCTS', price: 600, description: 'Профессиональная химия и микрофибра' },
  { id: 'tech-assist', name: 'TECH ASSIST', price: 1200, description: 'Консультация мастера, 30 минут' },
];

export const SPACES = [
  {
    id: 'sp-01', code: '01', name: 'DETAIL BAY', district: 'PETROGRADSKAYA',
    address: 'наб. реки Карповки, 19, бокс 3', type: 'detail',
    shortDescription: 'Светлый бокс для полировки и керамики с калиброванным светом.',
    fullDescription: 'Изолированный бокс 6 × 4,5 м со световым тоннелем 5600 K и стабильной температурой 21 °C. Подходит для многоэтапной полировки, нанесения керамики и защитной плёнки. Можно работать самостоятельно или пригласить мастера сети.',
    pricePerHour: 2400, capacity: 1, rating: 4.9,
    coordinates: { x: 790, y: 322 }, status: 'open',
    availableSlots: { 0: pick('1011101'), 1: pick('1111011'), 2: pick('0111111') },
    services: ['detailing', 'wash'],
    equipment: ['Световой тоннель 5600 K', 'Толщиномер ЛКП', 'Роторные и эксцентриковые машинки', 'Осмос-вода', 'Компрессор 50 л'],
    extras: ['detail-products', 'photo-light', 'tech-assist'],
    image: './assets/images/detail.svg',
  },
  {
    id: 'sp-02', code: '02', name: 'WORKSHOP LIFT', district: 'VYBORGSKAYA',
    address: 'Лесной пр., 37, корп. 2', type: 'workshop',
    shortDescription: 'Рабочий бокс с двухстоечным подъёмником на 4 тонны.',
    fullDescription: 'Классический рабочий пост для самостоятельного обслуживания: замена масла, колодок, работы с подвеской. Пневмоинструмент и маслосборник на месте, мастер смены поможет с подъёмником и технику безопасности.',
    pricePerHour: 1800, capacity: 1, rating: 4.7,
    coordinates: { x: 1180, y: 300 }, status: 'open',
    availableSlots: { 0: pick('1101011'), 1: pick('1011111'), 2: pick('1111101') },
    services: ['workshop', 'diagnostics'],
    equipment: ['Подъёмник 4 т', 'Пневмоинструмент', 'Набор головок 1/2" и 1/4"', 'Маслосборник', 'Динамометрические ключи'],
    extras: ['tools-kit', 'lift-access', 'tech-assist'],
    image: './assets/images/workshop.svg',
  },
  {
    id: 'sp-03', code: '03', name: 'PHOTO BOX', district: 'VASILEOSTROVSKAYA',
    address: '14-я линия В.О., 39', type: 'photo',
    shortDescription: 'Циклорама 8 × 5 м и импульсный свет для съёмки автомобиля.',
    fullDescription: 'Белая циклорама с бесшовным полом, поворотный круг и импульсный свет. Площадка рассчитана на предметную и рекламную съёмку автомобиля, а также короткие видео для соцсетей.',
    pricePerHour: 3200, capacity: 1, rating: 4.8,
    coordinates: { x: 600, y: 478 }, status: 'open',
    availableSlots: { 0: pick('0110110'), 1: pick('1101111'), 2: pick('1111111') },
    services: ['photo'],
    equipment: ['Циклорама 8 × 5 м', 'Импульсный свет 4 × 1200 Дж', 'Октобоксы 150 см', 'Поворотный круг', 'Подвесы и штативы'],
    extras: ['photo-light', 'detail-products'],
    image: './assets/images/photo.svg',
  },
  {
    id: 'sp-04', code: '04', name: 'TUNING LAB', district: 'MOSKOVSKAYA',
    address: 'Московский пр., 171, лит. Б', type: 'tuning',
    shortDescription: 'Лаборатория для установки подвески, тормозов и аэродинамики.',
    fullDescription: 'Пост с подъёмником, стендом развала и зоной сборки. Здесь устанавливают койловеры, тормозные системы и обвесы. Работы ведёт мастер сети, владелец может присутствовать и участвовать.',
    pricePerHour: 4500, capacity: 1, rating: 4.9,
    coordinates: { x: 960, y: 905 }, status: 'open',
    availableSlots: { 0: pick('1100111'), 1: pick('0111110'), 2: pick('1111011') },
    services: ['tuning', 'diagnostics', 'workshop'],
    equipment: ['Подъёмник 4 т', 'Стенд развала 3D', 'Пресс 20 т', 'Сварочный пост TIG', 'Набор специнструмента'],
    extras: ['lift-access', 'tools-kit', 'tech-assist', 'storage'],
    image: './assets/images/tuning.svg',
  },
  {
    id: 'sp-05', code: '05', name: 'WASH BOX', district: 'PRIMORSKY',
    address: 'Богатырский пр., 2, стр. 1', type: 'wash',
    shortDescription: 'Бесконтактная мойка с осмосом и сушкой воздухом.',
    fullDescription: 'Отапливаемый моечный бокс с портальной аркой, активной пеной и финальным ополаскиванием осмосом. Подходит для подготовки автомобиля к детейлингу или фотосъёмке.',
    pricePerHour: 1200, capacity: 1, rating: 4.6,
    coordinates: { x: 560, y: 92 }, status: 'open',
    availableSlots: { 0: pick('1111011'), 1: pick('1111111'), 2: pick('1011111') },
    services: ['wash', 'detailing'],
    equipment: ['Аппарат высокого давления 120 бар', 'Пенокомплект', 'Осмос-вода', 'Турбосушка', 'Пылесос'],
    extras: ['detail-products'],
    image: './assets/images/wash.svg',
  },
  {
    id: 'sp-06', code: '06', name: 'DIAGNOSTIC BAY', district: 'OBVODNY',
    address: 'наб. Обводного канала, 118', type: 'diagnostics',
    shortDescription: 'Диагностический пост: сканер, осциллограф, стенд развала.',
    fullDescription: 'Пост для компьютерной диагностики и проверки геометрии подвески. Отчёт по ошибкам и параметрам выдаётся сразу после сессии. Сегодня все слоты заняты — ближайшее окно завтра.',
    pricePerHour: 1500, capacity: 1, rating: 4.7,
    coordinates: { x: 1070, y: 808 }, status: 'open',
    availableSlots: { 0: pick('0000000'), 1: pick('1110111'), 2: pick('1111111') },
    services: ['diagnostics', 'workshop'],
    equipment: ['Мультимарочный сканер', 'Осциллограф 4 канала', 'Стенд развала 3D', 'Тестер АКБ', 'Эндоскоп'],
    extras: ['tech-assist', 'lift-access'],
    image: './assets/images/diagnostic.svg',
  },
  {
    id: 'sp-07', code: '07', name: 'PRIVATE GARAGE', district: 'KRESTOVSKY',
    address: 'Морской пр., 29, паркинг −1', type: 'private',
    shortDescription: 'Закрытый бокс с кодом доступа 24/7 и стеллажами.',
    fullDescription: 'Персональный бокс 6,2 × 5,4 м на подземном уровне: роллетные ворота, PIN-доступ, видеонаблюдение и розетка 220 В. Удобен для хранения, сезонной смены колёс и спокойной работы без посторонних.',
    pricePerHour: 900, capacity: 1, rating: 4.8,
    coordinates: { x: 450, y: 238 }, status: 'open',
    availableSlots: { 0: pick('1111111'), 1: pick('1111111'), 2: pick('1101111') },
    services: ['storage', 'workshop'],
    equipment: ['Роллетные ворота', 'PIN-доступ 24/7', 'Стеллажи 6 × 400 кг', 'Розетка 220 В', 'Видеоконтроль'],
    extras: ['storage', 'tools-kit'],
    image: './assets/images/private.svg',
  },
  {
    id: 'sp-08', code: '08', name: 'WORKSHOP BAY', district: 'NARVSKAYA',
    address: 'ул. Калинина, 13', type: 'workshop',
    shortDescription: 'Рабочий пост с подъёмником и смотровой зоной.',
    fullDescription: 'Просторный пост для самостоятельного ремонта. Сейчас на плановом обслуживании подъёмника — бронирование временно закрыто до 28.10.',
    statusNote: 'Плановое обслуживание подъёмника до 28.10',
    pricePerHour: 1400, capacity: 1, rating: 4.5,
    coordinates: { x: 640, y: 862 }, status: 'locked',
    availableSlots: { 0: [], 1: [], 2: [] },
    services: ['workshop'],
    equipment: ['Подъёмник 3,5 т', 'Верстак с тисками', 'Компрессор', 'Набор инструмента'],
    extras: ['tools-kit', 'lift-access'],
    image: './assets/images/workshop.svg',
  },
  {
    id: 'sp-09', code: '09', name: 'DETAIL LAB', district: 'LIGOVSKY',
    address: 'Лиговский пр., 50, корп. 7', type: 'detail',
    shortDescription: 'Лаборатория детейлинга с зоной химчистки и съёмки.',
    fullDescription: 'Два поста детейлинга и небольшая зона для фотофиксации результата. Здесь удобно делать полный цикл: мойка, коррекция ЛКП, керамика и съёмка готового автомобиля.',
    pricePerHour: 2800, capacity: 2, rating: 4.8,
    coordinates: { x: 1210, y: 646 }, status: 'open',
    availableSlots: { 0: pick('1010111'), 1: pick('1111111'), 2: pick('1110111') },
    services: ['detailing', 'wash', 'photo'],
    equipment: ['Световой тоннель', 'Экстрактор для химчистки', 'ИК-сушка', 'Толщиномер ЛКП', 'Фоновая стена'],
    extras: ['detail-products', 'photo-light', 'storage'],
    image: './assets/images/detail.svg',
  },
  {
    id: 'sp-10', code: '10', name: 'PHOTO STUDIO', district: 'SEVKABEL',
    address: 'Кожевенная линия, 40, цех 4', type: 'photo',
    shortDescription: 'Индустриальная студия в бывшем цеху у залива.',
    fullDescription: 'Цех с высотой потолков 9 м, циклорамой и естественным светом с залива. Площадка подходит для рекламных съёмок, клипов и небольших закрытых презентаций автомобиля.',
    pricePerHour: 4200, capacity: 3, rating: 5.0,
    coordinates: { x: 322, y: 562 }, status: 'open',
    availableSlots: { 0: pick('1001101'), 1: pick('1110111'), 2: pick('1111110') },
    services: ['photo', 'club'],
    equipment: ['Циклорама 12 × 7 м', 'Подвесная ферма', 'Импульсный свет 6 × 1500 Дж', 'Дым-машина', 'Гримёрная'],
    extras: ['photo-light', 'detail-products', 'storage'],
    image: './assets/images/photo.svg',
  },
  {
    id: 'sp-11', code: '11', name: 'CLUB GARAGE', district: 'CENTER',
    address: 'Кирочная ул., 8, двор', type: 'club',
    shortDescription: 'Клубное пространство с лаунжем и выставочными местами.',
    fullDescription: 'Зал на четыре машиноместа с лаунжем, баром и подиумом. Используется для встреч клубов, закрытых показов и спокойной работы над проектом среди своих.',
    pricePerHour: 2000, capacity: 4, rating: 4.9,
    coordinates: { x: 962, y: 556 }, status: 'open',
    availableSlots: { 0: pick('0101011'), 1: pick('1101101'), 2: pick('1111111') },
    services: ['club', 'storage', 'photo'],
    equipment: ['4 машиноместа', 'Лаунж на 16 гостей', 'Проектор и звук', 'Подиум с подсветкой', 'Кофейная станция'],
    extras: ['photo-light', 'storage', 'detail-products'],
    image: './assets/images/club.svg',
  },
  {
    id: 'sp-12', code: '12', name: 'SERVICE BOX', district: 'PETROGRADSKY',
    address: 'Большой пр. П.С., 88, бокс 1', type: 'workshop',
    shortDescription: 'Сервисный бокс со смотровой ямой и станцией жидкостей.',
    fullDescription: 'Компактный бокс со смотровой ямой для быстрого ТО: замена масла и фильтров, осмотр ходовой, мелкий ремонт. Рядом — станция технических жидкостей.',
    pricePerHour: 1600, capacity: 1, rating: 4.6,
    coordinates: { x: 652, y: 340 }, status: 'open',
    availableSlots: { 0: pick('1110110'), 1: pick('0111111'), 2: pick('1111111') },
    services: ['workshop', 'diagnostics', 'wash'],
    equipment: ['Смотровая яма 1,6 м', 'Маслосборник', 'Станция жидкостей', 'Переносной свет', 'Домкрат 3 т'],
    extras: ['tools-kit', 'tech-assist'],
    image: './assets/images/service.svg',
  },
];

export const getSpace = (id) => SPACES.find((space) => space.id === id) || null;
export const getService = (id) => SERVICES.find((service) => service.id === id) || null;
export const getExtra = (id) => EXTRAS.find((extra) => extra.id === id) || null;
export const getType = (id) => SPACE_TYPES.find((type) => type.id === id) || null;
export const DISTRICTS = [...new Set(SPACES.map((space) => space.district))].sort();
