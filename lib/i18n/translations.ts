export type Language = "en" | "es" | "fr";

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

  // Theme
  themeLight: string;
  themeDark: string;
  themeToggle: string;

  // Language
  language: string;
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

    themeLight: "Light Mode",
    themeDark: "Dark Mode",
    themeToggle: "Toggle theme",

    language: "Language",
  },

  es: {
    brandName: "Doxera",
    panel: "Panel",
    portal: "Portal LLC",
    dashboard: "Panel Principal",
    documents: "Documentos",
    settings: "Configuración",
    llcManagement: "Gestión de LLC",
    logout: "Cerrar sesión",
    loggingOut: "Cerrando sesión...",
    activeEntity: "Entidad Activa",

    documentsTitle: "Documentos",
    documentsSubtitle: "Archivo corporativo y repositorio oficial de documentos para",
    newDocument: "Nuevo Documento",
    totalDocuments: "Total Documentos",
    totalDocsSubtitle: "Registros corporativos archivados",
    active: "Activo",
    activeSubtitle: "Válido por más de 3 meses",
    expiringSoon: "Por Expirar",
    expiringSoonSubtitle: "Vence en los próximos 3 meses",
    expired: "Expirado",
    expiredSubtitle: "Documentos corporativos vencidos",

    all: "Todos",
    searchPlaceholder: "Buscar documentos o archivos...",
    sortBy: "Ordenar por",
    creationDate: "Fecha de Creación",
    endDate: "Fecha de Vencimiento",
    documentTitle: "Título del Documento",
    status: "Estado",
    vaultHeading: "Bóveda de Documentos Corporativos",
    record: "Registro",
    records: "Registros",
    noDocumentsFound: "No se encontraron documentos que coincidan con sus criterios de búsqueda.",

    creation: "Creación",
    expires: "Vencimiento",
    format: "Formato",
    daysRemaining: "días restantes",
    expiredDaysAgo: "Expiró hace",
    yearsDuration: "Años de Duración",
    edit: "Editar",
    delete: "Eliminar",
    download: "Descargar",

    createNewDocument: "Crear Nuevo Documento",
    modifyDocument: "Modificar Documento",
    modifySubtitle: "Actualice los parámetros del documento, período de vigencia y archivo adjunto.",
    deleteDocument: "Eliminar Documento",
    deleteConfirmTitle: "Eliminar Documento",
    deleteConfirmText: "¿Está seguro de que desea eliminar permanentemente este documento corporativo? Esta acción no se puede deshacer.",
    attachFileRequired: "Adjuntar Archivo del Documento (Obligatorio)",
    fileHint: "PDF, DOCX, imágenes hasta 25MB - guardado en Cloudflare R2",
    dropFileHere: "Suelte el archivo aquí para subirlo",
    clickToUpload: "Haga clic para subir o arrastre el archivo obligatorio",
    replaceFile: "Reemplazar Archivo",
    keepExistingFile: "Archivo adjunto actual",
    newReplacement: "Nuevo Reemplazo",
    docNameLabel: "Nombre del Documento",
    docNamePlaceholder: "ej. Acuerdo Operativo, Certificado Anual...",
    creationDateLabel: "Fecha de Creación",
    validityMethodLabel: "Método de Vigencia / Vencimiento",
    durationLabel: "Duración",
    durationDesc: "Período fijo (ej. 10 años)",
    endDateLabel: "Fecha Final",
    endDateDesc: "Fecha de vencimiento específica",
    durationPeriod: "Período de Duración",
    tenYearsRecommended: "10 Años (Estándar recomendado)",
    autoCalculatedEndDate: "Fecha Final Calculada",
    cancel: "Cancelar",
    createDocumentBtn: "Crear Documento",
    creatingBtn: "Creando...",
    saveChangesBtn: "Guardar Cambios",
    savingBtn: "Guardando...",
    confirmDeleteBtn: "Eliminar Documento",
    deletingBtn: "Eliminando...",

    errTitleRequired: "Por favor, ingrese el nombre del documento.",
    errFileRequired: "Subir un archivo de documento es obligatorio. Adjunte un archivo.",
    errCreationDateRequired: "Por favor, seleccione una fecha de creación.",
    errEndDateRequired: "Por favor, seleccione una fecha final para el documento.",
    errEndDatePrior: "La fecha final no puede ser anterior a la fecha de creación.",
    fileTooLarge: "El archivo es demasiado grande. Seleccione un archivo menor a 25MB.",

    themeLight: "Modo Claro",
    themeDark: "Modo Oscuro",
    themeToggle: "Cambiar tema",

    language: "Idioma",
  },

  fr: {
    brandName: "Doxera",
    panel: "Panneau",
    portal: "Portail LLC",
    dashboard: "Tableau de Bord",
    documents: "Documents",
    settings: "Paramètres",
    llcManagement: "Gestion des LLC",
    logout: "Déconnexion",
    loggingOut: "Déconnexion en cours...",
    activeEntity: "Entité Active",

    documentsTitle: "Documents",
    documentsSubtitle: "Archives d'entreprise et référentiel de dépôts officiels pour",
    newDocument: "Nouveau Document",
    totalDocuments: "Total Documents",
    totalDocsSubtitle: "Dossiers d'entreprise enregistrés",
    active: "Actif",
    activeSubtitle: "Valide au-delà de 3 mois",
    expiringSoon: "Expire Bientôt",
    expiringSoonSubtitle: "Échéance dans les 3 prochains mois",
    expired: "Expiré",
    expiredSubtitle: "Documents d'entreprise expirés",

    all: "Tous",
    searchPlaceholder: "Rechercher des documents ou fichiers...",
    sortBy: "Trier par",
    creationDate: "Date de Création",
    endDate: "Date d'Expiration",
    documentTitle: "Titre du Document",
    status: "Statut",
    vaultHeading: "Coffre-fort des Documents de l'Entité",
    record: "Dossier",
    records: "Dossiers",
    noDocumentsFound: "Aucun document d'entreprise ne correspond à vos critères de recherche.",

    creation: "Création",
    expires: "Expiration",
    format: "Format",
    daysRemaining: "jours restants",
    expiredDaysAgo: "Expiré il y a",
    yearsDuration: "Ans de Durée",
    edit: "Modifier",
    delete: "Supprimer",
    download: "Télécharger",

    createNewDocument: "Créer un Nouveau Document",
    modifyDocument: "Modifier le Document",
    modifySubtitle: "Mettez à jour les paramètres, la durée de validité et le fichier joint.",
    deleteDocument: "Supprimer le Document",
    deleteConfirmTitle: "Supprimer le Document",
    deleteConfirmText: "Êtes-vous sûr de vouloir supprimer définitivement ce document d'entreprise ? Cette action est irréversible.",
    attachFileRequired: "Joindre le Fichier du Document (Obligatoire)",
    fileHint: "PDF, DOCX, images jusqu'à 25 Mo - sauvegardé sur Cloudflare R2",
    dropFileHere: "Déposez le fichier ici pour le téléverser",
    clickToUpload: "Cliquez pour téléverser ou glissez-déposez le fichier obligatoire",
    replaceFile: "Remplacer le Fichier",
    keepExistingFile: "Fichier actuellement joint",
    newReplacement: "Nouveau Remplacement",
    docNameLabel: "Nom du Document",
    docNamePlaceholder: "ex. Accord d'Exploitation, Certificat Annuel...",
    creationDateLabel: "Date de Création",
    validityMethodLabel: "Méthode de Validité / d'Expiration",
    durationLabel: "Durée",
    durationDesc: "Période fixe (ex. 10 ans)",
    endDateLabel: "Date de Fin",
    endDateDesc: "Date d'expiration spécifique",
    durationPeriod: "Période de Durée",
    tenYearsRecommended: "10 Ans (Standard recommandé)",
    autoCalculatedEndDate: "Date de Fin Calculée",
    cancel: "Annuler",
    createDocumentBtn: "Créer le Document",
    creatingBtn: "Création en cours...",
    saveChangesBtn: "Enregistrer",
    savingBtn: "Enregistrement...",
    confirmDeleteBtn: "Supprimer le Document",
    deletingBtn: "Suppression...",

    errTitleRequired: "Veuillez saisir un nom de document.",
    errFileRequired: "Le téléversement d'un fichier de document est obligatoire.",
    errCreationDateRequired: "Veuillez sélectionner une date de création.",
    errEndDateRequired: "Veuillez sélectionner une date de fin pour le document.",
    errEndDatePrior: "La date de fin ne peut pas être antérieure à la date de création.",
    fileTooLarge: "Fichier trop volumineux. Veuillez choisir un fichier inférieur à 25 Mo.",

    themeLight: "Mode Clair",
    themeDark: "Mode Sombre",
    themeToggle: "Changer de thème",

    language: "Langue",
  },
};
