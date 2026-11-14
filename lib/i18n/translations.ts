export type Language = "en" | "uz" | "ru";

export interface TranslationDict {
  // Brand & Nav
  brandName: string;
  panel: string;
  portal: string;
  dashboard: string;
  documents: string;
  settings: string;
  llcManagement: string;
  logout: string;
  loggingOut: string;
  activeEntity: string;

  // Documents Page Header & Summary
  documentsTitle: string;
  documentsSubtitle: string;
  newDocument: string;
  totalDocuments: string;
  totalDocsSubtitle: string;
  active: string;
  activeSubtitle: string;
  expiringSoon: string;
  expiringSoonSubtitle: string;
  expired: string;
  expiredSubtitle: string;

  // Filters & Search
  all: string;
  searchPlaceholder: string;
  sortBy: string;
  creationDate: string;
  endDate: string;
  documentTitle: string;
  status: string;
  vaultHeading: string;
  record: string;
  records: string;
  noDocumentsFound: string;

  // Document Item
  creation: string;
  expires: string;
  format: string;
  daysRemaining: string;
  expiredDaysAgo: string;
  yearsDuration: string;
  edit: string;
  delete: string;
  download: string;

  // Create & Edit Modal
  createNewDocument: string;
  modifyDocument: string;
  modifySubtitle: string;
  deleteDocument: string;
  deleteConfirmTitle: string;
  deleteConfirmText: string;
  attachFileRequired: string;
  fileHint: string;
  dropFileHere: string;
  clickToUpload: string;
  replaceFile: string;
  keepExistingFile: string;
  newReplacement: string;
  docNameLabel: string;
  docNamePlaceholder: string;
  creationDateLabel: string;
  validityMethodLabel: string;
  durationLabel: string;
  durationDesc: string;
  endDateLabel: string;
  endDateDesc: string;
  durationPeriod: string;
  tenYearsRecommended: string;
  autoCalculatedEndDate: string;
  cancel: string;
  createDocumentBtn: string;
  creatingBtn: string;
  saveChangesBtn: string;
  savingBtn: string;
  confirmDeleteBtn: string;
  deletingBtn: string;

  // Validation
  errTitleRequired: string;
  errFileRequired: string;
  errCreationDateRequired: string;
  errEndDateRequired: string;
  errEndDatePrior: string;
  fileTooLarge: string;

  // Settings Page (LLC can change name, login, and password ONLY)
  settingsTitle: string;
  settingsSubtitle: string;
  settingsRestrictedNotice: string;
  companyNameLabel: string;
  companyNamePlaceholder: string;
  loginLabel: string;
  loginPlaceholder: string;
  newPasswordLabel: string;
  newPasswordPlaceholder: string;
  confirmPasswordLabel: string;
  confirmPasswordPlaceholder: string;
  saveSettingsBtn: string;
  savingSettingsBtn: string;
  settingsSuccessMsg: string;
  errNameRequired: string;
  errLoginRequired: string;
  errPasswordLength: string;
  errPasswordsDontMatch: string;
  entityCredentialsRef: string;
  entityIdLabel: string;
  jurisdictionLabel: string;
  currentLogin: string;
}

export const translations: Record<Language, TranslationDict> = {
  en: {
    brandName: "Doxera",
    panel: "Panel",
    portal: "LLC Portal",
    dashboard: "Dashboard",
    documents: "Documents",
    settings: "Settings",
    llcManagement: "LLC Management",
    logout: "Log out",
    loggingOut: "Logging out...",
    activeEntity: "Active Entity",

    documentsTitle: "Documents",
    documentsSubtitle: "Corporate archive and official filings repository for",
    newDocument: "New Document",
    totalDocuments: "Total Documents",
    totalDocsSubtitle: "Corporate records filed",
    active: "Active",
    activeSubtitle: "Valid beyond 3 months",
    expiringSoon: "Expiring Soon",
    expiringSoonSubtitle: "Due within next 3 months",
    expired: "Expired",
    expiredSubtitle: "Expired corporate documents",

    all: "All",
    searchPlaceholder: "Search documents or files...",
    sortBy: "Sort by",
    creationDate: "Creation Date",
    endDate: "End Date",
    documentTitle: "Document Title",
    status: "Status",
    vaultHeading: "Entity Document Vault",
    record: "Record",
    records: "Records",
    noDocumentsFound: "No corporate documents found matching your filter criteria.",

    creation: "Creation",
    expires: "End Date",
    format: "Format",
    daysRemaining: "days remaining",
    expiredDaysAgo: "Expired",
    yearsDuration: "Years Duration",
    edit: "Edit",
    delete: "Delete",
    download: "Download",

    createNewDocument: "Create New Document",
    modifyDocument: "Modify Document",
    modifySubtitle: "Update document parameters, timeline validity, and integrate replacement files.",
    deleteDocument: "Delete Document",
    deleteConfirmTitle: "Delete Document",
    deleteConfirmText: "Are you sure you want to permanently delete this corporate document? This action cannot be undone.",
    attachFileRequired: "Attach Document File (Required)",
    fileHint: "PDF, DOCX, Images up to 25MB - saved to Cloudflare R2",
    dropFileHere: "Drop file here to upload",
    clickToUpload: "Click to upload or drag & drop required file",
    replaceFile: "Replace File",
    keepExistingFile: "Current attached file",
    newReplacement: "New Replacement",
    docNameLabel: "Document Name",
    docNamePlaceholder: "e.g. Operating Agreement, Annual Certificate...",
    creationDateLabel: "Creation Date",
    validityMethodLabel: "Document Validity / Expiration Method",
    durationLabel: "Duration",
    durationDesc: "Fixed period (e.g. 10 years)",
    endDateLabel: "End Date",
    endDateDesc: "Specific expiration date",
    durationPeriod: "Duration Period",
    tenYearsRecommended: "10 Years (Recommended standard)",
    autoCalculatedEndDate: "Auto-calculated End Date",
    cancel: "Cancel",
    createDocumentBtn: "Create Document",
    creatingBtn: "Creating...",
    saveChangesBtn: "Save Changes",
    savingBtn: "Saving...",
    confirmDeleteBtn: "Delete Document",
    deletingBtn: "Deleting...",

    errTitleRequired: "Please enter a document name.",
    errFileRequired: "Uploading a document file is required. Please attach a file.",
    errCreationDateRequired: "Please select a creation date.",
    errEndDateRequired: "Please select an end date for the document.",
    errEndDatePrior: "End date cannot be prior to creation date.",
    fileTooLarge: "File is too large. Please select a file smaller than 25MB.",

    // Settings Page
    settingsTitle: "Account Settings",
    settingsSubtitle: "Manage your entity credentials: company name, portal login, and password.",
    settingsRestrictedNotice: "Per system policy, LLC members can strictly modify their company name, portal login, and access password.",
    companyNameLabel: "Company Name",
    companyNamePlaceholder: "e.g. Apex Dynamics LLC",
    loginLabel: "Portal Login / Username",
    loginPlaceholder: "e.g. apexdynamics",
    newPasswordLabel: "New Password",
    newPasswordPlaceholder: "Leave blank to keep existing password",
    confirmPasswordLabel: "Confirm New Password",
    confirmPasswordPlaceholder: "Re-enter new password",
    saveSettingsBtn: "Save Settings",
    savingSettingsBtn: "Saving Settings...",
    settingsSuccessMsg: "Your credentials have been updated successfully.",
    errNameRequired: "Company name cannot be empty.",
    errLoginRequired: "Portal login cannot be empty.",
    errPasswordLength: "New password must be at least 6 characters long.",
    errPasswordsDontMatch: "Passwords do not match.",
    entityCredentialsRef: "Entity Credentials Reference",
    entityIdLabel: "Entity ID / Reference",
    jurisdictionLabel: "Jurisdiction",
    currentLogin: "Current Login",
  },

  uz: {
    brandName: "Doxera",
    panel: "Panel",
    portal: "LLC Portali",
    dashboard: "Boshqaruv Paneli",
    documents: "Hujjatlar",
    settings: "Sozlamalar",
    llcManagement: "LLC Boshqaruvi",
    logout: "Chiqish",
    loggingOut: "Chiqilmoqda...",
    activeEntity: "Faol Tashkilot",

    documentsTitle: "Hujjatlar",
    documentsSubtitle: "Kompaniya arxivi va rasmiy topshirilgan hujjatlar ombori:",
    newDocument: "Yangi Hujjat",
    totalDocuments: "Jami Hujjatlar",
    totalDocsSubtitle: "Rasmiylashtirilgan korporativ yozuvlar",
    active: "Faol",
    activeSubtitle: "3 oydan ortiq muddatga amal qiladi",
    expiringSoon: "Muddati Tugamoqda",
    expiringSoonSubtitle: "Yaqin 3 oy ichida muddati tugaydi",
    expired: "Muddati O'tgan",
    expiredSubtitle: "Muddati tugagan korporativ hujjatlar",

    all: "Barchasi",
    searchPlaceholder: "Hujjat yoki fayllarni qidirish...",
    sortBy: "Saralash",
    creationDate: "Yaratilgan Sana",
    endDate: "Tugash Sanasi",
    documentTitle: "Hujjat Nomi",
    status: "Holat",
    vaultHeading: "Korporativ Hujjatlar Ombori",
    record: "Yozuv",
    records: "Yozuvlar",
    noDocumentsFound: "Tanlangan parametrlar bo'yicha hech qanday hujjat topilmadi.",

    creation: "Yaratilgan",
    expires: "Tugash sanasi",
    format: "Format",
    daysRemaining: "kun qoldi",
    expiredDaysAgo: "Muddati o'tgan:",
    yearsDuration: "Yillik Muddat",
    edit: "Tahrirlash",
    delete: "O'chirish",
    download: "Yuklab Olish",

    createNewDocument: "Yangi Hujjat Yaratish",
    modifyDocument: "Hujjatni O'zgartirish",
    modifySubtitle: "Hujjat parametrlari, amal qilish muddati va biriktirilgan faylni yangilang.",
    deleteDocument: "Hujjatni O'chirish",
    deleteConfirmTitle: "Hujjatni O'chirishni Tasdiqlang",
    deleteConfirmText: "Haqiqatan ham ushbu korporativ hujjatni butunlay o'chirib tashlamoqchimisiz? Ushbu amalni bekor qilib bo'lmaydi.",
    attachFileRequired: "Hujjat Faylini Biriktirish (Majburiy)",
    fileHint: "PDF, DOCX, 25MB gacha bo'lgan rasmlar - Cloudflare R2 da saqlanadi",
    dropFileHere: "Yuklash uchun faylni bu yerga tashlang",
    clickToUpload: "Majburiy faylni yuklash uchun bosing yoki faylni bu yerga sudrab tashlang",
    replaceFile: "Faylni Almashtirish",
    keepExistingFile: "Hozirgi biriktirilgan fayl",
    newReplacement: "Yangi Almashtirilgan Fayl",
    docNameLabel: "Hujjat Nomi",
    docNamePlaceholder: "masalan, Ta'sis Shartnomasi, Yillik Sertifikat...",
    creationDateLabel: "Yaratilgan Sana",
    validityMethodLabel: "Hujjat Amal Qilish Muddati Usuli",
    durationLabel: "Davomiylik",
    durationDesc: "Belgilangan muddat (masalan, 10 yil)",
    endDateLabel: "Tugash Sanasi",
    endDateDesc: "Aniq amal qilish tugash sanasi",
    durationPeriod: "Davomiylik Davri",
    tenYearsRecommended: "10 Yil (Standart tavsiya etiladi)",
    autoCalculatedEndDate: "Avtomatik hisoblangan tugash sanasi",
    cancel: "Bekor qilish",
    createDocumentBtn: "Hujjat Yaratish",
    creatingBtn: "Yaratilmoqda...",
    saveChangesBtn: "O'zgarishlarni Saqlash",
    savingBtn: "Saqlanmoqda...",
    confirmDeleteBtn: "Hujjatni O'chirish",
    deletingBtn: "O'chirilmoqda...",

    errTitleRequired: "Iltimos, hujjat nomini kiriting.",
    errFileRequired: "Hujjat faylini yuklash majburiy. Iltimos, fayl biriktiring.",
    errCreationDateRequired: "Iltimos, yaratilgan sanani tanlang.",
    errEndDateRequired: "Iltimos, hujjat tugash sanasini tanlang.",
    errEndDatePrior: "Tugash sanasi yaratilgan sanadan oldin bo'lishi mumkin emas.",
    fileTooLarge: "Fayl juda katta. Iltimos, 25MB dan kichik fayl tanlang.",

    // Settings Page
    settingsTitle: "Profil Sozlamalari",
    settingsSubtitle: "Kompaniya ma'lumotlarini boshqarish: tashkilot nomi, login va parol.",
    settingsRestrictedNotice: "Tizim qoidalariga muvofiq, LLC a'zolari faqat o'z tashkilot nomi, login va kirish parolini o'zgartira oladilar.",
    companyNameLabel: "Tashkilot Nomi",
    companyNamePlaceholder: "masalan, Apex Dynamics LLC",
    loginLabel: "Portal Logini / Foydalanuvchi Nomi",
    loginPlaceholder: "masalan, apexdynamics",
    newPasswordLabel: "Yangi Parol",
    newPasswordPlaceholder: "Eski parolni qoldirish uchun bo'sh qoldiring",
    confirmPasswordLabel: "Yangi Parolni Tasdiqlang",
    confirmPasswordPlaceholder: "Yangi parolni qayta kiriting",
    saveSettingsBtn: "Sozlamalarni Saqlash",
    savingSettingsBtn: "Saqlanmoqda...",
    settingsSuccessMsg: "Ma'lumotlaringiz muvaffaqiyatli yangilandi.",
    errNameRequired: "Tashkilot nomi bo'sh bo'lishi mumkin emas.",
    errLoginRequired: "Portal logini bo'sh bo'lishi mumkin emas.",
    errPasswordLength: "Yangi parol kamida 6 belgidan iborat bo'lishi kerak.",
    errPasswordsDontMatch: "Parollar mos kelmadi.",
    entityCredentialsRef: "Tashkilot Ma'lumotlari Ma'lumotnomasi",
    entityIdLabel: "Tashkilot IDsi / Havola",
    jurisdictionLabel: "Yurisdiksiya",
    currentLogin: "Joriy Login",
  },

  ru: {
    brandName: "Doxera",
    panel: "Панель",
    portal: "Портал LLC",
    dashboard: "Панель Управления",
    documents: "Документы",
    settings: "Настройки",
    llcManagement: "Управление LLC",
    logout: "Выйти",
    loggingOut: "Выход из системы...",
    activeEntity: "Активная Организация",

    documentsTitle: "Документы",
    documentsSubtitle: "Корпоративный архив и официальный репозиторий документов для",
    newDocument: "Новый Документ",
    totalDocuments: "Всего Документов",
    totalDocsSubtitle: "Зарегистрированные корпоративные записи",
    active: "Действующие",
    activeSubtitle: "Срок действия более 3 месяцев",
    expiringSoon: "Истекает Срок",
    expiringSoonSubtitle: "Срок истекает в течение 3 месяцев",
    expired: "Истёк Срок",
    expiredSubtitle: "Документы с истекшим сроком действия",

    all: "Все",
    searchPlaceholder: "Поиск документов или файлов...",
    sortBy: "Сортировка",
    creationDate: "Дата Создания",
    endDate: "Дата Окончания",
    documentTitle: "Название Документа",
    status: "Статус",
    vaultHeading: "Хранилище Корпоративных Документов",
    record: "Запись",
    records: "Записей",
    noDocumentsFound: "Корпоративных документов по заданным критериям не найдено.",

    creation: "Создан",
    expires: "Истекает",
    format: "Формат",
    daysRemaining: "дней осталось",
    expiredDaysAgo: "Истёк",
    yearsDuration: "Лет Действия",
    edit: "Изменить",
    delete: "Удалить",
    download: "Скачать",

    createNewDocument: "Создать Новый Документ",
    modifyDocument: "Изменить Документ",
    modifySubtitle: "Обновите параметры документа, срок действия и прикреплённый файл.",
    deleteDocument: "Удалить Документ",
    deleteConfirmTitle: "Удалить Документ",
    deleteConfirmText: "Вы уверены, что хотите навсегда удалить этот корпоративный документ? Это действие нельзя отменить.",
    attachFileRequired: "Прикрепить Файл Документа (Обязательно)",
    fileHint: "PDF, DOCX, изображения до 25 МБ — сохраняется в Cloudflare R2",
    dropFileHere: "Перетащите файл сюда для загрузки",
    clickToUpload: "Нажмите для загрузки или перетащите обязательный файл",
    replaceFile: "Заменить Файл",
    keepExistingFile: "Текущий прикреплённый файл",
    newReplacement: "Новый Заменяющий Файл",
    docNameLabel: "Название Документа",
    docNamePlaceholder: "напр., Операционное соглашение, Годовой сертификат...",
    creationDateLabel: "Дата Создания",
    validityMethodLabel: "Способ Определения Срока Действия",
    durationLabel: "Период",
    durationDesc: "Фиксированный срок (напр., 10 лет)",
    endDateLabel: "Дата Окончания",
    endDateDesc: "Точная дата окончания срока действия",
    durationPeriod: "Срок Действия",
    tenYearsRecommended: "10 Лет (Рекомендуемый стандарт)",
    autoCalculatedEndDate: "Рассчитанная дата окончания",
    cancel: "Отмена",
    createDocumentBtn: "Создать Документ",
    creatingBtn: "Создание...",
    saveChangesBtn: "Сохранить Изменения",
    savingBtn: "Сохранение...",
    confirmDeleteBtn: "Удалить Документ",
    deletingBtn: "Удаление...",

    errTitleRequired: "Пожалуйста, введите название документа.",
    errFileRequired: "Загрузка файла документа обязательна. Прикрепите файл.",
    errCreationDateRequired: "Пожалуйста, выберите дату создания.",
    errEndDateRequired: "Пожалуйста, выберите дату окончания срока действия.",
    errEndDatePrior: "Дата окончания не может быть раньше даты создания.",
    fileTooLarge: "Файл слишком большой. Выберите файл размером до 25 МБ.",

    // Settings Page
    settingsTitle: "Настройки Профиля",
    settingsSubtitle: "Управление корпоративными данными: название компании, логин и пароль.",
    settingsRestrictedNotice: "Согласно регламенту, представители LLC могут изменять исключительно название компании, логин и пароль доступа.",
    companyNameLabel: "Название Компании",
    companyNamePlaceholder: "напр., Apex Dynamics LLC",
    loginLabel: "Логин на Портале / Имя Пользователя",
    loginPlaceholder: "напр., apexdynamics",
    newPasswordLabel: "Новый Пароль",
    newPasswordPlaceholder: "Оставьте пустым, чтобы сохранить текущий",
    confirmPasswordLabel: "Подтвердите Новый Пароль",
    confirmPasswordPlaceholder: "Повторите новый пароль",
    saveSettingsBtn: "Сохранить Настройки",
    savingSettingsBtn: "Сохранение...",
    settingsSuccessMsg: "Ваши данные успешно обновлены.",
    errNameRequired: "Название компании не может быть пустым.",
    errLoginRequired: "Логин не может быть пустым.",
    errPasswordLength: "Новый пароль должен содержать не менее 6 символов.",
    errPasswordsDontMatch: "Пароли не совпадают.",
    entityCredentialsRef: "Справочные Данные Организации",
    entityIdLabel: "ID Организации / Код",
    jurisdictionLabel: "Юрисдикция",
    currentLogin: "Текущий Логин",
  },
};
