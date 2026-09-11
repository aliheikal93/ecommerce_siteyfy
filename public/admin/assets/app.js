(() => {
  const STORAGE_TOKEN = "slyrah_admin_token";
  const STORAGE_USER = "slyrah_admin_user";
  const STORAGE_LANG = "slyrah_admin_lang";
  const STORAGE_NAV_GROUP = "siteyfy_admin_nav_group";

  const icons = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="3" width="7" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="15" width="7" height="6" rx="1.5"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/></svg>',
    collection: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="4" width="7" height="7" rx="1.5"/><rect x="14" y="4" width="7" height="7" rx="1.5"/><rect x="3" y="15" width="7" height="5" rx="1.5"/><rect x="14" y="15" width="7" height="5" rx="1.5"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M20.5 13.5 13.5 20a2 2 0 0 1-2.8 0L3 12.3V3h9.3l8.2 8.2a1.6 1.6 0 0 1 0 2.3Z"/><path d="M7.5 7.5h.01"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m4 16 4.5-4.5L13 16l2-2 5 5"/><circle cx="15.5" cy="8.5" r="1.5"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5"/><path d="M8 13h8M8 17h5"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M6 6h15l-2 8H8L6 3H3"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>',
    "credit-card": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M10 17h4V5H2v12h3"/><path d="M14 8h4l4 4v5h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/></svg>',
    palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 22a10 10 0 1 1 10-10 3 3 0 0 1-3 3h-1.4a2 2 0 0 0-1.5 3.3 2.2 2.2 0 0 1-1.7 3.7H12Z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="14" cy="7.5" r="1"/><circle cx="16.5" cy="10.5" r="1"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1 1.64V21a2 2 0 1 1-4 0v-.09a1.8 1.8 0 0 0-1-1.64 1.8 1.8 0 0 0-2 .36l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.8 1.8 0 0 0 .36-2 1.8 1.8 0 0 0-1.64-1H3a2 2 0 1 1 0-4h.09a1.8 1.8 0 0 0 1.64-1 1.8 1.8 0 0 0-.36-2l-.06-.06A2 2 0 1 1 7.14 3.9l.06.06a1.8 1.8 0 0 0 2 .36h.01a1.8 1.8 0 0 0 1-1.64V3a2 2 0 1 1 4 0v.09a1.8 1.8 0 0 0 1 1.64 1.8 1.8 0 0 0 2-.36l.06-.06A2 2 0 1 1 20.1 7.14l-.06.06a1.8 1.8 0 0 0-.36 2v.01a1.8 1.8 0 0 0 1.64 1H21a2 2 0 1 1 0 4h-.09a1.8 1.8 0 0 0-1.51.79Z"/></svg>',
    sparkles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 3l1.7 4.7L18 9.5l-4.3 1.8L12 16l-1.7-4.7L6 9.5l4.3-1.8L12 3Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/><path d="M5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="m12 20 9-9-4-4-9 9-1 5 5-1Z"/><path d="m15 7 2 2"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/><path d="M10 11v6M14 11v6"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 3v18h-8"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4L19 6"/></svg>',
    "arrow-left": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="m15 18-6-6 6-6"/><path d="M9 12h11"/></svg>',
    "arrow-right": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="m9 18 6-6-6-6"/><path d="M15 12H4"/></svg>',
    "arrow-up": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg>',
    "arrow-down": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>',
    "map-pin-check": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><path d="m9 10 2 2 4-4"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>',
    message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/><path d="M8 9h8M8 13h5"/></svg>',
    "chevron-down": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>'
  };

  const i = (name) => `<span class="icon">${icons[name] || icons.dashboard}</span>`;
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const dict = {
    en: {
      loginTitle: "Admin workspace",
      loginSubtitle: "Manage SITEYFY commerce from one focused dashboard.",
      email: "Email",
      password: "Password",
      signIn: "Sign in",
      signingIn: "Signing in",
      overview: "Overview",
      overviewSub: "Store readiness, empty-data status, and the main areas that need setup.",
      content: "Content",
      storefront: "Storefront",
      brandStudio: "Brand studio",
      market: "Market & shipping",
      currencies: "Currencies",
      integrations: "Integrations",
      integrationCenter: "Integration center",
      shippingOperations: "Shipping operations",
      shippingIntegrations: "Shipping providers",
      shippingShipments: "Shipments",
      shippingClosings: "Closings",
      shippingReport: "Closing report",
      shippingSettlement: "Saved closing",
      shippingLedger: "Shipping ledger",
      shippingAudit: "Fee audit",
      shippingAuditFinding: "Audit finding",
      shippingCarrierBill: "Carrier bill",
      shippingCodBills: "COD bills",
      shippingFeeBills: "Fee bills",
      shippingReconciliation: "Weekly reconciliation",
      storefrontLayout: "Header & footer",
      catalog: "Catalog",
      sales: "Sales",
      paymentGateways: "Payment gateways",
      discounts: "Discounts",
      discountsSub: "Create promo codes, schedule campaigns, and track time remaining at a glance.",
      combinedPromotions: "Combined promotions",
      promoCode: "Promo code",
      discountType: "Discount type",
      discountValue: "Discount value",
      percentage: "Percentage",
      fixedAmount: "Fixed amount",
      freeShipping: "Free shipping",
      startsAt: "Starts at",
      endsAt: "Ends at",
      timeLeft: "Time left",
      usageLimit: "Usage limit",
      usedCount: "Used",
      minimumOrderTotal: "Minimum order",
      appliesTo: "Applies to",
      allProducts: "All products",
      selectedProducts: "Selected products",
      selectedCategories: "Selected categories",
      chooseProducts: "Choose products",
      chooseCategories: "Choose categories",
      allProductsInCategories: "All products in selected categories",
      targetHint: "Pick targets from existing catalog records. Products are optional when categories are selected.",
      testDiscount: "Test discount",
      testDiscountHint: "Select a sample cart to see exactly which products receive the discount.",
      runTest: "Run test",
      selectAll: "Select all",
      eligibleSubtotal: "Eligible subtotal",
      discountTotal: "Discount total",
      eligible: "Eligible",
      notEligible: "Not eligible",
      selectAtLeastOne: "Select at least one product",
      scheduled: "Scheduled",
      expiringSoon: "Expiring soon",
      expired: "Expired",
      disabled: "Disabled",
      usedUp: "Used up",
      customers: "Customers",
      userManagement: "User management",
      system: "System",
      products: "Products",
      bundles: "Bundles",
      bundlesSub: "Create product sets with a custom combined price and optional cover image.",
      collections: "Collections",
      collectionsSub: "Curate product variants into ordered storefront rails.",
      reviewsRecommendations: "Reviews & Recommendations",
      createCollection: "Create collection",
      editCollection: "Edit collection",
      categories: "Categories",
      brands: "Brands",
      colors: "Colors",
      options: "Options",
      labels: "Labels",
      pages: "Pages",
      page: "Page",
      homeContent: "Home content",
      homeSections: "Home sections",
      imageGallery: "Image gallery",
      uploadImages: "Upload images",
      syncGallery: "Sync gallery",
      deleteUnused: "Delete unused",
      usage: "Usage",
      linked: "Linked",
      unused: "Unused",
      fileSize: "File size",
      folder: "Folder",
      replace: "Replace",
      orders: "Orders",
      users: "Users",
      locations: "Locations",
      settings: "Settings",
      aiAssistant: "AI Assistant",
      aiSetup: "Setup",
      aiPricing: "Model Pricing",
      aiProducts: "Product AI",
      aiLogs: "Usage Logs",
      aiSEO: "AI SEO",
      aiProductsSub: "Upload a product image and let AI suggest catalog data, bilingual copy, colors, options, and future image slots.",
      aiLogsSub: "Track AI assistant usage and estimated cost from internal model pricing.",
      aiSEOSub: "Analyze existing products and improve bilingual SEO fields with AI.",
      uploadProductImage: "Upload product image",
      analyzeImage: "Analyze image",
      analyzingImage: "Analyzing image",
      aiResult: "AI result",
      suggestedProductData: "Suggested product data",
      missingSuggestions: "Missing catalog suggestions",
      generatedImageSlots: "Generated image slots",
      generatedImages: "Generated images",
      productVariants: "Product variants",
      sku: "SKU",
      barcode: "Barcode",
      goodsType: "Goods type",
      shippingProfile: "Shipping profile",
      requiresShipping: "Requires shipping",
      weightKg: "Weight (kg)",
      lengthCm: "Length (cm)",
      widthCm: "Width (cm)",
      heightCm: "Height (cm)",
      countryOfOrigin: "Country of origin",
      hsCode: "HS code",
      addColorVariant: "Add color",
      addOptionVariant: "Add option",
      addColorOptionVariant: "Add option + color",
      variantType: "Variant type",
      useAsMainImage: "Use as main image",
      optionValue: "Option value",
      priceAdjustment: "Price adjustment",
      loadDraft: "Load draft",
      applyToForm: "Apply to form",
      approveCreate: "Approve & create",
      generateImage: "Generate image",
      generatingImage: "Generating image",
      applySeo: "Apply SEO",
      analyzeSeo: "Analyze SEO",
      selectProduct: "Select product",
      selectedProduct: "Selected product",
      productCode: "Product code",
      seoIndicators: "SEO indicators",
      applyAll: "Apply all",
      applyField: "Apply field",
      titleQuality: "Title quality",
      descriptionQuality: "Description quality",
      bilingualQuality: "Bilingual quality",
      slugQuality: "Slug quality",
      totalEstimatedCost: "Total estimated cost",
      estimatedCost: "Estimated cost",
      action: "Action",
      tokens: "Tokens",
      aiPricingSub: "Refresh model prices from OpenAI API documentation, then edit temporary internal prices when needed.",
      openaiSetup: "OpenAI setup",
      openaiSetupSub: "Connect the API key, sync available models, and manage internal pricing for future AI features.",
      providerStatus: "Provider status",
      apiKey: "API key",
      apiKeyHint: "Stored on the server and hidden after saving.",
      organization: "Organization",
      project: "Project",
      defaultTextModel: "Default text model",
      defaultImageModel: "Default image model",
      defaultVideoModel: "Default video model",
      syncModels: "Sync models",
      syncingModels: "Syncing models",
      modelPricing: "Model pricing",
      refreshPricing: "Refresh from OpenAI docs",
      refreshingPricing: "Refreshing prices",
      source: "Source",
      tier: "Tier",
      modality: "Modality",
      billingUnit: "Billing unit",
      priceSecond: "Price / second",
      priceMinute: "Price / minute",
      module: "Module",
      inputPer1m: "Input / 1M",
      cachedInputPer1m: "Cached input / 1M",
      outputPer1m: "Output / 1M",
      unitNote: "Unit note",
      lastSync: "Last sync",
      connected: "Connected",
      notConnected: "Not connected",
      lighthouse: "Performance & SEO",
      lighthouseSub: "Run Lighthouse checks against the storefront homepage, listing page, and product pages.",
      runAudit: "Run audit",
      runningAudit: "Running audit",
      auditLoadingSub: "Opening storefront pages and preparing Lighthouse reports.",
      auditTargets: "Audit targets",
      openPage: "Open page",
      auditTargetType: "Target type",
      homepage: "Homepage",
      productsListing: "Products listing",
      productPage: "Product page",
      customUrl: "Custom URL",
      selectProduct: "Select product",
      selectedUrl: "Selected URL",
      customUrlPlaceholder: "https://ecommerce.siteyfy.com/products or /product/46",
      websiteDomain: "Website domain",
      websiteDomainHint: "Used by Performance & SEO tests.",
      robotsTxt: "Robots.txt",
      robotsTxtSub: "Control crawler access for the live storefront. Every save is stored in history.",
      robotsContent: "Robots.txt content",
      robotsHistory: "Robots history",
      editedAt: "Edited at",
      savedVersions: "Saved versions",
      generatedAt: "Generated",
      performance: "Performance",
      seo: "SEO",
      accessibility: "Accessibility",
      bestPractices: "Best practices",
      report: "Report",
      viewReport: "View report",
      noAuditYet: "No audit has been run yet",
      noAuditYetSub: "Run a check to measure the live storefront and product SEO.",
      productPages: "Product pages",
      dashboard: "Dashboard",
      logout: "Logout",
      add: "Add",
      edit: "Edit",
      delete: "Delete",
      cancel: "Cancel",
      save: "Save",
      search: "Search",
      status: "Status",
      image: "Image",
      shortDescription: "Short description",
      shortDescriptionEn: "English short description",
      shortDescriptionAr: "Arabic short description",
      nameEn: "English name",
      nameAr: "Arabic name",
      titleEn: "English title",
      titleAr: "Arabic title",
      descriptionEn: "English description",
      descriptionAr: "Arabic description",
      slug: "Slug",
      price: "Price",
      salePrice: "Sale price",
      compareAtPrice: "Before discount",
      cost: "Cost",
      stock: "Stock",
      unlimitedStock: "Unlimited",
      active: "Active",
      inactive: "Inactive",
      empty: "Empty",
      healthy: "Ready",
      needsSetup: "Needs setup",
      noRows: "No records yet",
      noRowsSub: "This section is intentionally empty. Add records when you are ready to start editing the new store.",
      quickSetup: "Setup path",
      quickSetupSub: "Build the store in this order so the storefront gets meaningful data.",
      stepCategories: "Create categories and brands",
      stepProducts: "Add products after attributes are ready",
      stepContent: "Tune home content and company settings",
      currentWindow: "Current copy",
      emptyDb: "Database is empty by request",
      storeHealth: "Store health",
      records: "Records",
      actions: "Actions",
      companyInfo: "Company information",
      siteNameEn: "English site name",
      siteNameAr: "Arabic site name",
      phone: "Phone",
      whatsapp: "WhatsApp",
      addressEn: "English address",
      addressAr: "Arabic address",
      primaryColor: "Primary color",
      secondaryColor: "Secondary color",
      defaultShipping: "Default shipping",
      shippingSystem: "Shipping system",
      shippingSystemSub: "Shipping costs are ignored on the storefront while this system is inactive.",
      freeShipping: "Free shipping threshold",
      saved: "Saved",
      deleted: "Deleted",
      created: "Created",
      updated: "Updated",
      loginFailed: "Login failed",
      required: "Required",
      language: "العربية",
      menu: "Menu",
      viewSite: "View site",
      orderTotal: "Total",
      customer: "Customer",
      role: "Role",
      governorate: "Governorate",
      area: "Area",
      shipping: "Shipping",
      sectionVisible: "Visible on storefront",
      topViewed: "Top viewed",
      latestArrivals: "Latest arrivals",
      joinOurWorld: "Newsletter block",
      headerCategoryBanners: "Header category banners",
      galleryNote: "Uploaded images will appear here after you start adding products or content.",
      oldDashboard: ""
    },
    ar: {
      loginTitle: "مساحة إدارة المتجر",
      loginSubtitle: "إدارة متجر SITEYFY من لوحة واحدة واضحة ومركزة.",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      signIn: "تسجيل الدخول",
      signingIn: "جاري الدخول",
      overview: "نظرة عامة",
      overviewSub: "جاهزية المتجر، حالة البيانات الفارغة، والأقسام الأساسية المطلوب تجهيزها.",
      content: "المحتوى",
      storefront: "واجهة المتجر",
      brandStudio: "استوديو الهوية",
      market: "السوق والشحن",
      currencies: "العملات",
      integrations: "التكاملات",
      integrationCenter: "مركز التكاملات",
      shippingOperations: "عمليات الشحن",
      shippingIntegrations: "شركات الشحن",
      shippingShipments: "الشحنات",
      shippingClosings: "التقفيلات",
      shippingReport: "تقرير التقفيل",
      shippingSettlement: "تقفيلة محفوظة",
      shippingLedger: "سجل الشحنات",
      shippingAudit: "مراجعة الرسوم",
      shippingAuditFinding: "ملاحظة مراجعة",
      shippingCarrierBill: "فاتورة شركة الشحن",
      shippingCodBills: "فواتير COD",
      shippingFeeBills: "فواتير المصاريف",
      shippingReconciliation: "مراجعة أسبوعية",
      storefrontLayout: "الهيدر والفوتر",
      catalog: "الكتالوج",
      sales: "المبيعات",
      paymentGateways: "بوابات الدفع",
      discounts: "الخصومات",
      discountsSub: "إدارة البروموكودز، جدولة الحملات، ومتابعة الوقت المتبقي بوضوح.",
      combinedPromotions: "دمج العروض",
      promoCode: "كود الخصم",
      discountType: "نوع الخصم",
      discountValue: "قيمة الخصم",
      percentage: "نسبة مئوية",
      fixedAmount: "مبلغ ثابت",
      freeShipping: "شحن مجاني",
      startsAt: "يبدأ في",
      endsAt: "ينتهي في",
      timeLeft: "الوقت المتبقي",
      usageLimit: "حد الاستخدام",
      usedCount: "المستخدم",
      minimumOrderTotal: "أقل طلب",
      appliesTo: "يطبق على",
      allProducts: "كل المنتجات",
      selectedProducts: "منتجات محددة",
      selectedCategories: "تصنيفات محددة",
      chooseProducts: "اختيار المنتجات",
      chooseCategories: "اختيار التصنيفات",
      allProductsInCategories: "كل منتجات التصنيفات المختارة",
      targetHint: "اختار الاستهداف من بيانات الكتالوج الموجودة. المنتجات اختيارية عند تحديد تصنيفات.",
      testDiscount: "اختبار الخصم",
      testDiscountHint: "اختار سلة تجريبية لتعرف بالضبط المنتجات التي سيطبق عليها الخصم.",
      runTest: "تشغيل الاختبار",
      selectAll: "اختيار الكل",
      eligibleSubtotal: "المجموع المؤهل",
      discountTotal: "إجمالي الخصم",
      eligible: "مؤهل",
      notEligible: "غير مؤهل",
      selectAtLeastOne: "اختار منتجًا واحدًا على الأقل",
      scheduled: "مجدول",
      expiringSoon: "ينتهي قريبا",
      expired: "منتهي",
      disabled: "متوقف",
      usedUp: "اكتمل الاستخدام",
      customers: "العملاء",
      userManagement: "إدارة المستخدمين",
      system: "النظام",
      products: "المنتجات",
      bundles: "البندلز",
      bundlesSub: "اجمع منتجين أو أكثر بسعر نهائي مخصص وصورة اختيارية للبندل.",
      collections: "المجموعات",
      collectionsSub: "نسّق اختيارات المنتجات في مجموعات مرتبة للواجهة.",
      reviewsRecommendations: "التقييمات والتوصيات",
      createCollection: "إنشاء مجموعة",
      editCollection: "تعديل المجموعة",
      categories: "التصنيفات",
      brands: "العلامات التجارية",
      colors: "الألوان",
      options: "الخيارات",
      labels: "الملصقات",
      pages: "الصفحات",
      page: "الصفحة",
      homeContent: "محتوى الرئيسية",
      homeSections: "أقسام الرئيسية",
      imageGallery: "معرض الصور",
      uploadImages: "رفع صور",
      syncGallery: "مزامنة المعرض",
      deleteUnused: "حذف غير المستخدم",
      usage: "الاستخدام",
      linked: "مربوطة",
      unused: "غير مستخدمة",
      fileSize: "حجم الملف",
      folder: "المجلد",
      replace: "استبدال",
      orders: "الطلبات",
      users: "المستخدمون",
      locations: "المناطق",
      settings: "الإعدادات",
      aiAssistant: "AI Assistant",
      aiSetup: "Setup",
      aiPricing: "أسعار الموديلز",
      aiProducts: "AI المنتجات",
      aiLogs: "سجل الاستخدام",
      aiSEO: "AI SEO",
      aiProductsSub: "ارفع صورة منتج والـ AI يقترح بيانات الكتالوج، الوصف باللغتين، الألوان، الخيارات، وأماكن الصور المستقبلية.",
      aiLogsSub: "تابع استخدامات AI assistant والتكلفة التقديرية من أسعار الموديلز الداخلية.",
      aiSEOSub: "حلل المنتجات الموجودة وحسن حقول SEO بالعربي والإنجليزي باستخدام AI.",
      uploadProductImage: "رفع صورة المنتج",
      analyzeImage: "تحليل الصورة",
      analyzingImage: "جاري تحليل الصورة",
      aiResult: "نتيجة AI",
      suggestedProductData: "بيانات المنتج المقترحة",
      missingSuggestions: "اقتراحات عناصر غير موجودة",
      generatedImageSlots: "أماكن الصور المولدة",
      generatedImages: "الصور المولدة",
      productVariants: "اختيارات المنتج والأسعار",
      sku: "رمز المنتج SKU",
      barcode: "الباركود",
      goodsType: "نوع البضاعة",
      shippingProfile: "ملف الشحن",
      requiresShipping: "يحتاج إلى شحن",
      weightKg: "الوزن (كجم)",
      lengthCm: "الطول (سم)",
      widthCm: "العرض (سم)",
      heightCm: "الارتفاع (سم)",
      countryOfOrigin: "بلد المنشأ",
      hsCode: "الرمز الجمركي HS",
      addColorVariant: "إضافة لون",
      addOptionVariant: "إضافة اختيار",
      addColorOptionVariant: "إضافة اختيار + لون",
      variantType: "نوع المتغير",
      useAsMainImage: "استخدام كصورة رئيسية",
      optionValue: "قيمة الاختيار",
      priceAdjustment: "فرق السعر",
      loadDraft: "تحميل Draft",
      applyToForm: "تطبيق على الفورم",
      approveCreate: "موافقة وإنشاء",
      generateImage: "توليد صورة",
      generatingImage: "جاري توليد الصورة",
      applySeo: "تطبيق SEO",
      analyzeSeo: "تحليل SEO",
      selectProduct: "اختيار منتج",
      selectedProduct: "المنتج المختار",
      productCode: "كود المنتج",
      seoIndicators: "مؤشرات SEO",
      applyAll: "تطبيق الكل",
      applyField: "تطبيق الحقل",
      titleQuality: "جودة العنوان",
      descriptionQuality: "جودة الوصف",
      bilingualQuality: "جودة اللغتين",
      slugQuality: "جودة الرابط",
      totalEstimatedCost: "إجمالي التكلفة التقديرية",
      estimatedCost: "التكلفة التقديرية",
      action: "الإجراء",
      tokens: "Tokens",
      aiPricingSub: "تحديث أسعار الموديلز من توثيق OpenAI API ثم تعديل الأسعار الداخلية المؤقتة عند الحاجة.",
      openaiSetup: "إعداد OpenAI",
      openaiSetupSub: "اربط مفتاح API، اعمل مزامنة للموديلز المتاحة، واضبط التسعير الداخلي لاستخدامات AI القادمة.",
      providerStatus: "حالة المزود",
      apiKey: "مفتاح API",
      apiKeyHint: "يتم حفظه على السيرفر وإخفاؤه بعد الحفظ.",
      organization: "Organization",
      project: "Project",
      defaultTextModel: "موديل النص الافتراضي",
      defaultImageModel: "موديل الصور الافتراضي",
      defaultVideoModel: "موديل الفيديو الافتراضي",
      syncModels: "مزامنة الموديلز",
      syncingModels: "جاري المزامنة",
      modelPricing: "تسعير الموديلز",
      refreshPricing: "تحديث من OpenAI docs",
      refreshingPricing: "جاري تحديث الأسعار",
      source: "المصدر",
      tier: "Tier",
      modality: "Modality",
      billingUnit: "وحدة الحساب",
      priceSecond: "السعر / ثانية",
      priceMinute: "السعر / دقيقة",
      module: "الموديول",
      inputPer1m: "Input / 1M",
      cachedInputPer1m: "Cached input / 1M",
      outputPer1m: "Output / 1M",
      unitNote: "ملاحظة الوحدة",
      lastSync: "آخر مزامنة",
      connected: "متصل",
      notConnected: "غير متصل",
      lighthouse: "الأداء و SEO",
      lighthouseSub: "قياس Lighthouse لواجهة الموقع: الرئيسية، صفحة المنتجات، وصفحات المنتجات.",
      runAudit: "تشغيل القياس",
      runningAudit: "جاري القياس",
      auditLoadingSub: "يتم فتح صفحات الواجهة وتجهيز تقارير Lighthouse.",
      auditTargets: "الصفحات التي سيتم قياسها",
      openPage: "فتح الصفحة",
      auditTargetType: "نوع الصفحة",
      homepage: "الرئيسية",
      productsListing: "صفحة المنتجات",
      productPage: "صفحة منتج",
      customUrl: "رابط مخصص",
      selectProduct: "اختيار المنتج",
      selectedUrl: "الرابط المختار",
      customUrlPlaceholder: "https://ecommerce.siteyfy.com/products أو /product/46",
      websiteDomain: "دومين الموقع",
      websiteDomainHint: "يستخدم في اختبارات الأداء و SEO.",
      robotsTxt: "Robots.txt",
      robotsTxtSub: "تحكم في وصول محركات البحث لواجهة الموقع. كل حفظ يتم تسجيله في التاريخ.",
      robotsContent: "محتوى Robots.txt",
      robotsHistory: "تاريخ الروبوتات",
      editedAt: "وقت التعديل",
      savedVersions: "النسخ المحفوظة",
      generatedAt: "وقت التقرير",
      performance: "الأداء",
      seo: "SEO",
      accessibility: "سهولة الوصول",
      bestPractices: "أفضل الممارسات",
      report: "التقرير",
      viewReport: "عرض التقرير",
      noAuditYet: "لا يوجد قياس بعد",
      noAuditYetSub: "شغل القياس لفحص واجهة الموقع وSEO صفحات المنتجات.",
      productPages: "صفحات المنتجات",
      dashboard: "لوحة التحكم",
      logout: "تسجيل الخروج",
      add: "إضافة",
      edit: "تعديل",
      delete: "حذف",
      cancel: "إلغاء",
      save: "حفظ",
      search: "بحث",
      status: "الحالة",
      image: "الصورة",
      shortDescription: "وصف مختصر",
      shortDescriptionEn: "الوصف المختصر بالإنجليزية",
      shortDescriptionAr: "الوصف المختصر بالعربية",
      nameEn: "الاسم بالإنجليزية",
      nameAr: "الاسم بالعربية",
      titleEn: "العنوان بالإنجليزية",
      titleAr: "العنوان بالعربية",
      descriptionEn: "الوصف بالإنجليزية",
      descriptionAr: "الوصف بالعربية",
      slug: "الرابط المختصر",
      price: "السعر",
      salePrice: "سعر البيع",
      compareAtPrice: "قبل الخصم",
      cost: "التكلفة",
      stock: "المخزون",
      unlimitedStock: "غير محدود",
      active: "نشط",
      inactive: "غير نشط",
      empty: "فارغ",
      healthy: "جاهز",
      needsSetup: "يحتاج تجهيز",
      noRows: "لا توجد سجلات بعد",
      noRowsSub: "هذا القسم فارغ عن قصد. أضف البيانات عندما تبدأ تجهيز المتجر الجديد.",
      quickSetup: "مسار التجهيز",
      quickSetupSub: "جهز المتجر بهذا الترتيب حتى تظهر البيانات بشكل منطقي في الواجهة.",
      stepCategories: "إنشاء التصنيفات والعلامات التجارية",
      stepProducts: "إضافة المنتجات بعد تجهيز الخصائص",
      stepContent: "ضبط محتوى الرئيسية وبيانات الشركة",
      currentWindow: "النسخة الحالية",
      emptyDb: "قاعدة البيانات فارغة حسب الطلب",
      storeHealth: "حالة المتجر",
      records: "سجلات",
      actions: "الإجراءات",
      companyInfo: "بيانات الشركة",
      siteNameEn: "اسم الموقع بالإنجليزية",
      siteNameAr: "اسم الموقع بالعربية",
      phone: "الهاتف",
      whatsapp: "واتساب",
      addressEn: "العنوان بالإنجليزية",
      addressAr: "العنوان بالعربية",
      primaryColor: "اللون الأساسي",
      secondaryColor: "اللون الثانوي",
      defaultShipping: "الشحن الافتراضي",
      shippingSystem: "نظام الشحن",
      shippingSystemSub: "لا يتم احتساب تكلفة الشحن في الواجهة طالما النظام غير مفعل.",
      freeShipping: "حد الشحن المجاني",
      saved: "تم الحفظ",
      deleted: "تم الحذف",
      created: "تمت الإضافة",
      updated: "تم التحديث",
      loginFailed: "فشل تسجيل الدخول",
      required: "مطلوب",
      language: "English",
      menu: "القائمة",
      viewSite: "عرض الموقع",
      orderTotal: "الإجمالي",
      customer: "العميل",
      role: "الدور",
      governorate: "المحافظة",
      area: "المنطقة",
      shipping: "الشحن",
      sectionVisible: "ظاهر في واجهة المتجر",
      topViewed: "الأكثر مشاهدة",
      latestArrivals: "أحدث المنتجات",
      joinOurWorld: "قسم النشرة البريدية",
      headerCategoryBanners: "بانرات التصنيفات في الهيدر",
      galleryNote: "الصور المرفوعة ستظهر هنا بعد إضافة المنتجات أو المحتوى.",
      oldDashboard: ""
    }
  };

  const resources = {
    products: {
      icon: "box",
      api: "/api/admin/products",
      listKey: "products",
      columns: ["id", "main_photo_url", "name_en", "name_ar", "short_description_en", "price", "cost", "stock", "is_active"],
      fields: [
        ["main_photo_url", "image", "image"],
        ["name_en", "nameEn", "text", true],
        ["name_ar", "nameAr", "text", true],
        ["slug", "slug", "text"],
        ["sku", "sku", "text"],
        ["barcode", "barcode", "text"],
        ["category_slug", "categories", "categorySelect"],
        ["brand_slug", "brands", "brandSelect"],
        ["color", "colors", "colorSelect"],
        ["options", "options", "optionSelect"],
        ["price", "price", "number"],
        ["sale_price", "salePrice", "number"],
        ["cost", "cost", "number"],
        ["stock", "stock", "number"],
        ["goods_type_id", "goodsType", "goodsTypeSelect"],
        ["shipping_profile_id", "shippingProfile", "shippingProfileSelect"],
        ["requires_shipping", "requiresShipping", "checkbox"],
        ["weight", "weightKg", "number"],
        ["length", "lengthCm", "number"],
        ["width", "widthCm", "number"],
        ["height", "heightCm", "number"],
        ["origin_country_code", "countryOfOrigin", "countrySelect"],
        ["hs_code", "hsCode", "text"],
        ["short_description_en", "shortDescriptionEn", "textarea"],
        ["short_description_ar", "shortDescriptionAr", "textarea"],
        ["description_en", "descriptionEn", "textarea"],
        ["description_ar", "descriptionAr", "textarea"],
        ["meta_title_en", "titleEn", "text"],
        ["meta_title_ar", "titleAr", "text"],
        ["meta_description_en", "descriptionEn", "textarea"],
        ["meta_description_ar", "descriptionAr", "textarea"],
        ["is_active", "active", "checkbox"]
      ]
    },
    bundles: {
      icon: "layers",
      api: "/api/admin/bundles",
      listKey: "bundles",
      columns: ["id", "main_photo_url", "name_en", "name_ar", "item_count", "regular_total", "price", "stock", "is_active"]
    },
    categories: {
      icon: "layers",
      api: "/api/admin/categories",
      columns: ["id", "image_url", "name_en", "name_ar", "slug", "is_active"],
      fields: [["image_url", "image", "image"], ["name_en", "nameEn", "text", true], ["name_ar", "nameAr", "text", true], ["slug", "slug", "text"], ["description_en", "descriptionEn", "textarea"], ["description_ar", "descriptionAr", "textarea"], ["is_active", "active", "checkbox"]]
    },
    brands: {
      icon: "tag",
      api: "/api/admin/brands",
      columns: ["id", "logo_url", "name_en", "name_ar", "slug", "is_active"],
      fields: [["logo_url", "image", "image"], ["name_en", "nameEn", "text", true], ["name_ar", "nameAr", "text", true], ["slug", "slug", "text"], ["description_en", "descriptionEn", "textarea"], ["description_ar", "descriptionAr", "textarea"], ["is_active", "active", "checkbox"]]
    },
    colors: {
      icon: "palette",
      api: "/api/admin/colors",
      columns: ["id", "nameEn", "nameAr", "color", "isActive"],
      fields: [["nameEn", "nameEn", "text", true], ["nameAr", "nameAr", "text", true], ["color", "primaryColor", "color"], ["isActive", "active", "checkbox"]]
    },
    options: {
      icon: "settings",
      api: "/api/admin/options",
      columns: ["id", "nameEn", "nameAr", "isActive"],
      fields: [["nameEn", "nameEn", "text", true], ["nameAr", "nameAr", "text", true], ["isActive", "active", "checkbox"]]
    },
    labels: {
      icon: "tag",
      api: "/api/admin/labels",
      columns: ["id", "nameEn", "nameAr", "backgroundColor", "isActive"],
      fields: [["nameEn", "nameEn", "text", true], ["nameAr", "nameAr", "text", true], ["backgroundColor", "secondaryColor", "color"], ["isActive", "active", "checkbox"]]
    },
    pages: {
      icon: "file",
      api: "/api/admin/pages",
      columns: ["id", "title_en", "title_ar", "slug", "is_active"],
      fields: [["title_en", "titleEn", "text", true], ["title_ar", "titleAr", "text", true], ["slug", "slug", "text"], ["content_en", "descriptionEn", "textarea"], ["content_ar", "descriptionAr", "textarea"], ["is_active", "active", "checkbox"]]
    },
    content: {
      icon: "image",
      api: "/api/admin/content",
      columns: ["id", "title_en", "title_ar", "type", "is_active"],
      fields: [["title_en", "titleEn", "text"], ["title_ar", "titleAr", "text"], ["type", "status", "text"], ["description_en", "descriptionEn", "textarea"], ["description_ar", "descriptionAr", "textarea"], ["is_active", "active", "checkbox"]]
    },
    orders: {
      icon: "cart",
      api: "/api/admin/orders",
      listKey: "orders",
      readOnly: true,
      columns: ["id", "customer_name", "total", "status", "created_at"]
    },
    users: {
      icon: "users",
      api: "/api/admin/users",
      listKey: "users",
      readOnly: true,
      columns: ["id", "name", "email", "role", "status"]
    }
  };

  const navGroups = [
    { label: "dashboard", items: [{ id: "overview", icon: "dashboard" }] },
    { label: "storefront", items: [{ id: "brandStudio", icon: "palette" }, { id: "storefrontLayout", icon: "layers" }, { id: "homeSections", icon: "layers" }, { id: "market", icon: "map" }, { id: "currencies", icon: "globe" }] },
    { label: "content", items: [
      { id: "content", icon: "image" },
      { id: "imageGallery", icon: "image" },
      { id: "pages", icon: "file" }
    ] },
    { label: "catalog", items: [
      { id: "products", icon: "box" },
      { id: "categories", icon: "layers" },
      { id: "brands", icon: "tag" },
      { id: "colors", icon: "palette" },
      { id: "options", icon: "settings" },
      { id: "labels", icon: "tag" },
      { id: "collections", icon: "collection" },
      { id: "bundles", icon: "layers" },
      { id: "reviewsRecommendations", icon: "message" }
    ] },
    { label: "sales", items: [{ id: "orders", icon: "cart" }, { id: "discounts", icon: "tag" }, { id: "combinedPromotions", icon: "layers" }] },
    { label: "userManagement", items: [{ id: "users", icon: "users" }, { id: "locations", icon: "map" }] },
    { label: "integrations", items: [{ id: "integrationCenter", icon: "settings" }, { id: "shippingIntegrations", icon: "truck" }, { id: "paymentGateways", icon: "credit-card" }] },
    { label: "shippingOperations", items: [{ id: "shippingShipments", icon: "truck" }, { id: "shippingClosings", icon: "file" }, { id: "shippingAudit", icon: "check" }] },
    { label: "aiAssistant", items: [{ id: "aiSetup", icon: "sparkles" }, { id: "aiProducts", icon: "image" }, { id: "aiSEO", icon: "file" }, { id: "aiPricing", icon: "tag" }, { id: "aiLogs", icon: "file" }] },
    { label: "system", items: [{ id: "lighthouse", icon: "dashboard" }, { id: "settings", icon: "settings" }] }
  ];

  function navItemIsActive(item, view = state?.view) {
    return view === item.id
      || (view === "collectionEditor" && item.id === "collections")
      || (view === "recommendationEditor" && item.id === "reviewsRecommendations")
      || (view === "orderDetail" && item.id === "orders")
      || (view === "shippingAuditFinding" && item.id === "shippingAudit")
      || (["shippingCarrierBill","shippingCodBills","shippingFeeBills","shippingReconciliation"].includes(view) && item.id === "shippingClosings")
      || (["shippingReport","shippingSettlement","shippingLedger"].includes(view) && item.id === "shippingClosings");
  }

  function navGroupForView(view) {
    return navGroups.find(group => group.items.some(item => navItemIsActive(item, view)))?.label || "dashboard";
  }

  function initialNavGroup(view) {
    const saved = localStorage.getItem(STORAGE_NAV_GROUP);
    return navGroups.some(group => group.label === saved) ? saved : navGroupForView(view);
  }

  function adminRoute() {
    const [view = "overview", id = ""] = location.hash.replace("#", "").split("/");
    return { view, id };
  }

  const initialRoute = adminRoute();
  const state = {
    lang: localStorage.getItem(STORAGE_LANG) || "en",
    token: localStorage.getItem(STORAGE_TOKEN) || "",
    user: JSON.parse(localStorage.getItem(STORAGE_USER) || "null"),
    view: initialRoute.view,
    reportId: initialRoute.id,
    openNavGroup: initialNavGroup(initialRoute.view),
    rows: {},
    loading: false
  };

  const t = (key) => dict[state.lang][key] || dict.en[key] || key;
  const ui = (en, ar) => state.lang === "ar" ? ar : en;
  const bundleMoney = value => `${Number(value || 0).toLocaleString(state.lang === "ar" ? "ar-SA" : "en-US")} ${state.lang === "ar" ? "ر.س" : "SAR"}`;
  const app = document.getElementById("app");

  function setLang(lang) {
    state.lang = lang;
    localStorage.setItem(STORAGE_LANG, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }

  function normalizeRows(payload, resource) {
    if (Array.isArray(payload)) return payload;
    if (resource?.listKey && Array.isArray(payload?.[resource.listKey])) return payload[resource.listKey];
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  }

  async function api(endpoint, options = {}) {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
        ...(options.headers || {})
      }
    });
    const json = await response.json().catch(() => null);
    if (response.status === 401) {
      state.token = "";
      state.user = null;
      localStorage.removeItem(STORAGE_TOKEN);
      localStorage.removeItem(STORAGE_USER);
      render();
      throw new Error(ui("Your session expired. Please sign in again.", "انتهت الجلسة، سجل الدخول مرة أخرى."));
    }
    if (!response.ok || json?.success === false) throw new Error(json?.error?.message || "Request failed");
    return json?.data ?? json;
  }

  function toast(message, type = "success") {
    document.querySelector(".toast")?.remove();
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    document.body.append(el);
    setTimeout(() => el.remove(), 2600);
  }

  function formatDateTime(value) {
    if (!value) return "-";
    return new Intl.DateTimeFormat(state.lang === "ar" ? "ar-EG" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  }

  function render() {
    setLang(state.lang);
    if (!state.token) return renderLogin();
    app.innerHTML = `
      <div class="app-shell">
        ${sidebar()}
        <main class="main">
          ${topbar()}
          <section class="page" id="page"></section>
        </main>
      </div>
    `;
    bindShell();
    renderView().catch(error => {
      const page = document.getElementById("page");
      if (!page || !state.token) return;
      page.innerHTML = `<div class="card shipping-load-error"><h2>${ui("This page could not be loaded", "تعذر تحميل الصفحة")}</h2><p>${escapeHtml(error.message)}</p><button class="btn primary" id="retryPage">${ui("Try again", "إعادة المحاولة")}</button></div>`;
      document.getElementById("retryPage").onclick=renderView;
    });
  }

  function renderLogin() {
    app.innerHTML = `
      <section class="login-screen">
        <div class="login-art">
          <div class="brand-lockup"><span class="brand-mark">S</span><span>SITEYFY</span></div>
          <div>
            <h1>${t("loginTitle")}</h1>
            <p>${t("loginSubtitle")}</p>
          </div>
          <p class="small">${t("emptyDb")}</p>
        </div>
        <div class="login-panel">
          <form class="login-card" id="loginForm">
            <div class="brand-lockup" style="margin-bottom: 24px;"><span class="brand-mark">S</span><span>SITEYFY Admin</span></div>
            <h2>${t("signIn")}</h2>
            <p class="muted">${t("loginSubtitle")}</p>
            <div class="field"><label>${t("email")}</label><input name="email" type="email" value="admin@siteyfy.com" required /></div>
            <div class="field" style="margin-top:14px;"><label>${t("password")}</label><input name="password" type="password" value="admin12345" required /></div>
            <button class="btn primary" style="width:100%; justify-content:center; margin-top:20px;" type="submit">${t("signIn")}</button>
            <button class="btn ghost" style="width:100%; justify-content:center; margin-top:10px;" type="button" id="loginLang">${i("globe")}${t("language")}</button>
          </form>
        </div>
      </section>
    `;
    document.getElementById("loginLang").onclick = () => {
      setLang(state.lang === "en" ? "ar" : "en");
      renderLogin();
    };
    document.getElementById("loginForm").onsubmit = login;
  }

  async function login(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const button = event.currentTarget.querySelector("button[type='submit']");
    button.textContent = t("signingIn");
    button.disabled = true;
    try {
      const data = await api("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") })
      });
      state.token = data.token;
      state.user = data.admin || data.user;
      localStorage.setItem(STORAGE_TOKEN, state.token);
      localStorage.setItem(STORAGE_USER, JSON.stringify(state.user));
      render();
    } catch (error) {
      toast(`${t("loginFailed")}: ${error.message}`, "error");
    } finally {
      button.textContent = t("signIn");
      button.disabled = false;
    }
  }

  function sidebar() {
    return `
      <aside class="sidebar">
        <div class="sidebar-head"><div class="brand-lockup"><span class="brand-mark">S</span><span>SITEYFY</span></div></div>
        <nav class="sidebar-nav" aria-label="${ui("Dashboard sections", "أقسام لوحة التحكم")}">
          ${navGroups.map(group => { const open=state.openNavGroup === group.label; const active=group.items.some(item=>navItemIsActive(item)); return `<section class="nav-accordion ${open?"is-open":""} ${active?"has-active":""}" data-nav-accordion="${group.label}"><button class="nav-group-toggle" type="button" data-nav-group-toggle="${group.label}" aria-expanded="${open}"><span>${t(group.label)}</span><small>${group.items.length}</small>${i("chevron-down")}</button><div class="nav-group-panel"><div class="nav-group-panel-inner">${group.items.map(item => `<button class="nav-item ${navItemIsActive(item)?"active":""}" data-view="${item.id}">${i(item.icon)}<span>${t(item.id)}</span></button>`).join("")}</div></div></section>`; }).join("")}
        </nav>
        <div class="sidebar-foot">
          <a class="btn" href="/" target="_blank">${i("globe")}<span>${t("viewSite")}</span></a>
          <button class="btn danger" id="logoutBtn">${i("logout")}<span>${t("logout")}</span></button>
        </div>
      </aside>
    `;
  }

  function topbar() {
    return `
      <header class="topbar">
        <div class="toolbar">
          <button class="btn icon-btn mobile-menu" id="mobileMenu">${i("menu")}</button>
          <div>
            <strong>${state.view === "orderDetail" ? t("orders") : state.view === "collectionEditor" ? t("collections") : state.view === "recommendationEditor" ? t("reviewsRecommendations") : t(state.view)}</strong>
            <div class="muted small">${state.user?.email || ""}</div>
          </div>
        </div>
        <div class="toolbar">
          <button class="btn" id="langBtn">${i("globe")}${t("language")}</button>
        </div>
      </header>
    `;
  }

  function bindShell() {
    document.querySelectorAll("[data-nav-group-toggle]").forEach(button => {
      button.onclick = () => {
        const nextGroup = button.dataset.navGroupToggle;
        state.openNavGroup = state.openNavGroup === nextGroup ? "" : nextGroup;
        localStorage.setItem(STORAGE_NAV_GROUP, state.openNavGroup);
        document.querySelectorAll("[data-nav-accordion]").forEach(section => {
          const open = section.dataset.navAccordion === state.openNavGroup;
          section.classList.toggle("is-open", open);
          section.querySelector("[data-nav-group-toggle]")?.setAttribute("aria-expanded", String(open));
        });
      };
    });
    document.querySelectorAll("[data-view]").forEach(btn => {
      btn.onclick = () => {
        state.view = btn.dataset.view;
        state.reportId = "";
        state.openNavGroup = navGroupForView(state.view);
        localStorage.setItem(STORAGE_NAV_GROUP, state.openNavGroup);
        location.hash = state.view;
        render();
      };
    });
    document.getElementById("logoutBtn").onclick = () => {
      localStorage.removeItem(STORAGE_TOKEN);
      localStorage.removeItem(STORAGE_USER);
      state.token = "";
      state.user = null;
      render();
    };
    document.getElementById("langBtn").onclick = () => {
      setLang(state.lang === "en" ? "ar" : "en");
      render();
    };
    document.getElementById("mobileMenu")?.addEventListener("click", () => {
      const sidebar = document.querySelector(".sidebar");
      const shell = document.querySelector(".app-shell");
      const willOpen = !sidebar?.classList.contains("mobile-open");
      sidebar?.classList.toggle("mobile-open", willOpen);
      shell?.classList.toggle("mobile-nav-open", willOpen);
      document.querySelector(".mobile-nav-backdrop")?.remove();
      if (willOpen) {
        const backdrop = document.createElement("button");
        backdrop.className = "mobile-nav-backdrop";
        backdrop.type = "button";
        backdrop.setAttribute("aria-label", t("close"));
        backdrop.onclick = () => { sidebar?.classList.remove("mobile-open"); shell?.classList.remove("mobile-nav-open"); backdrop.remove(); };
        shell?.append(backdrop);
      }
    });
  }

  async function renderView() {
    const page = document.getElementById("page");
    if (state.view === "overview") return renderOverview(page);
    if (state.view === "settings") return renderSettings(page);
    if (state.view === "brandStudio") return renderBrandStudio(page);
    if (state.view === "market") return renderMarket(page);
    if (state.view === "currencies") return renderCurrencies(page);
    if (state.view === "integrationCenter") return renderIntegrationCenter(page);
    if (state.view === "paymentGateways") return renderPaymentGateways(page);
    if (state.view === "shippingIntegrations") return renderShippingIntegrations(page);
    if (state.view === "shippingShipments") return renderShippingShipments(page);
    if (state.view === "shippingClosings") return renderShippingClosings(page);
    if (state.view === "shippingReport") return renderShippingReport(page, state.reportId);
    if (state.view === "shippingSettlement") return renderShippingReport(page, state.reportId);
    if (state.view === "shippingLedger") return renderShippingReport(page, "live");
    if (state.view === "shippingAudit") return renderShippingAudit(page);
    if (state.view === "shippingAuditFinding") return renderShippingAuditFinding(page, state.reportId);
    if (state.view === "shippingCarrierBill") return renderShippingCarrierBill(page, state.reportId);
    if (state.view === "shippingCodBills") return renderShippingBillList(page,"codBill");
    if (state.view === "shippingFeeBills") return renderShippingBillList(page,"feeBill");
    if (state.view === "shippingReconciliation") return renderShippingReconciliation(page, state.reportId);
    if (state.view === "storefrontLayout") return renderStorefrontLayout(page);
    if (state.view === "homeSections") return renderHomeSections(page);
    if (state.view === "imageGallery") return renderGallery(page);
    if (state.view === "locations") return renderLocations(page);
    if (state.view === "lighthouse") return renderLighthouse(page);
    if (state.view === "aiSetup") return renderAiSetup(page);
    if (state.view === "aiProducts") return renderAiProducts(page);
    if (state.view === "aiSEO") return renderAiSEO(page);
    if (state.view === "aiPricing") return renderAiPricing(page);
    if (state.view === "aiLogs") return renderAiLogs(page);
    if (state.view === "discounts") return renderDiscounts(page);
    if (state.view === "combinedPromotions") return renderCombinedPromotions(page);
    if (state.view === "collections") return renderCollections(page);
    if (state.view === "collectionEditor") return renderCollectionEditor(page, state.reportId);
    if (state.view === "reviewsRecommendations") return renderReviewsRecommendations(page);
    if (state.view === "recommendationEditor") return renderRecommendationEditor(page, state.reportId);
    if (state.view === "bundles") return renderBundles(page);
    if (state.view === "orders") return renderOrders(page);
    if (state.view === "orderDetail") return renderOrderDetail(page, state.reportId);
    if (state.view === "users") return renderUsers(page);
    if (resources[state.view]) return renderResource(page, state.view);
    state.view = "overview";
    renderOverview(page);
  }

  async function loadResource(key) {
    const resource = resources[key];
    const data = await api(resource.api);
    const rows = normalizeRows(data, resource);
    state.rows[key] = rows;
    return rows;
  }

  async function renderOverview(page) {
    page.innerHTML = pageTitle("overview", "overviewSub");
    const keys = ["products", "categories", "brands", "orders", "users"];
    await Promise.all(keys.map(k => loadResource(k).catch(() => [])));
    const products = state.rows.products?.length || 0;
    const categories = state.rows.categories?.length || 0;
    const orders = state.rows.orders?.length || 0;
    const users = state.rows.users?.length || 0;
    page.innerHTML += `
      <div class="grid kpi-grid">
        ${kpi("products", products, products ? "healthy" : "empty", "box")}
        ${kpi("orders", orders, orders ? "healthy" : "empty", "cart")}
        ${kpi("users", users, users ? "healthy" : "empty", "users")}
        ${kpi("categories", categories, categories ? "healthy" : "needsSetup", "layers")}
      </div>
      <div class="grid two-col" style="margin-top:16px;">
        <div class="card card-pad">
          <h2>${t("quickSetup")}</h2>
          <p class="muted">${t("quickSetupSub")}</p>
          ${setupStep(1, "stepCategories", categories > 0)}
          ${setupStep(2, "stepProducts", products > 0)}
          ${setupStep(3, "stepContent", true)}
        </div>
        <div class="card card-pad">
          <h2>${t("storeHealth")}</h2>
          <div class="switch-row"><span>${t("currentWindow")}</span><span class="status-pill good">${t("healthy")}</span></div>
          <div class="switch-row"><span>${t("emptyDb")}</span><span class="status-pill empty">${t("empty")}</span></div>
          <div class="switch-row"><span>Docker</span><span class="status-pill good">Online</span></div>
        </div>
      </div>
    `;
  }

  function pageTitle(titleKey, subKey, action = "") {
    return `
      <div class="page-title">
        <div><h1>${t(titleKey)}</h1>${subKey ? `<p class="muted">${t(subKey)}</p>` : ""}</div>
        <div class="toolbar">${action}</div>
      </div>
    `;
  }

  function kpi(label, value, status, icon) {
    return `
      <article class="card kpi-card">
        <div class="kpi-top"><span class="muted">${t(label)}</span>${i(icon)}</div>
        <div>
          <div class="kpi-value">${value}</div>
          <span class="status-pill ${status === "healthy" ? "good" : status === "needsSetup" ? "warn" : "empty"}">${t(status)}</span>
        </div>
      </article>
    `;
  }

  function setupStep(num, key, done) {
    return `<div class="switch-row"><strong>${num}. ${t(key)}</strong><span class="status-pill ${done ? "good" : "warn"}">${done ? t("healthy") : t("needsSetup")}</span></div>`;
  }

  async function renderResource(page, key) {
    const resource = resources[key];
    page.innerHTML = pageTitle(key, "", resource.readOnly ? "" : `<button class="btn primary" id="addBtn">${i("plus")}${t("add")}</button>`);
    page.innerHTML += `<div class="card table-wrap"><div class="table-header"><h2>${t(key)}</h2><span class="pill" id="countPill">0 ${t("records")}</span></div><div id="tableArea"></div></div>`;
    const rows = await loadResource(key);
    document.getElementById("countPill").textContent = `${rows.length} ${t("records")}`;
    document.getElementById("tableArea").innerHTML = table(resource, rows, key);
    if (!resource.readOnly) document.getElementById("addBtn").onclick = () => openEditor(key);
    document.querySelectorAll("[data-edit]").forEach(btn => btn.onclick = () => openEditor(key, rows.find(row => String(row.id) === btn.dataset.edit)));
    document.querySelectorAll("[data-delete]").forEach(btn => btn.onclick = () => deleteRow(key, btn.dataset.delete));
    document.querySelectorAll("[data-status-toggle]").forEach(btn => btn.onclick = () => toggleRowStatus(key, btn.dataset.statusToggle, btn.dataset.statusField, btn.dataset.statusValue !== "true"));
  }

  function userIsActive(user = {}) {
    return user.is_active !== false && !["inactive", "blocked"].includes(String(user.status || "active").toLowerCase());
  }

  function userStatusLabel(user = {}) {
    const status = String(user.status || (userIsActive(user) ? "active" : "inactive")).toLowerCase();
    const labels = { active:["Active","نشط"], inactive:["Inactive","غير نشط"], blocked:["Blocked","محظور"] };
    const value = labels[status] || [status,status];
    return state.lang === "ar" ? value[1] : value[0];
  }

  const userPermissionOptions = [
    ["place_orders", "Place orders", "إنشاء الطلبات"],
    ["view_order_history", "View order history", "عرض سجل الطلبات"],
    ["manage_profile", "Manage profile", "تعديل الملف الشخصي"],
    ["submit_reviews", "Submit reviews", "إضافة التقييمات"],
    ["use_promo_codes", "Use promo codes", "استخدام أكواد الخصم"],
    ["use_wishlist", "Use wishlist", "استخدام المفضلة"]
  ];

  function openUserEditor(user = {}) {
    const isEdit = Boolean(user.id);
    const permissions = new Set(Array.isArray(user.permissions) ? user.permissions : userPermissionOptions.map(([key]) => key));
    document.body.insertAdjacentHTML("beforeend", `<div class="modal-backdrop user-editor-backdrop"><form class="modal user-editor-modal" id="userEditorForm"><div class="modal-head"><div><span class="section-kicker">ACCOUNT ACCESS</span><h2>${isEdit?ui("Edit user account", "تعديل حساب المستخدم"):ui("Create user account", "إنشاء حساب مستخدم")}</h2><p>${ui("Set login details, account type, and exact storefront permissions.", "حدد بيانات الدخول ونوع الحساب وصلاحياته داخل المتجر.")}</p></div><button class="btn icon-btn" type="button" data-close-user-editor aria-label="${t("close")}">${i("x")}</button></div><div class="modal-body"><div class="user-editor-layout"><section><div class="studio-card-head"><span class="section-kicker">01</span><div><h3>${ui("Account details", "بيانات الحساب")}</h3><p>${ui("These details are used to sign in and identify the customer.", "تُستخدم هذه البيانات لتسجيل الدخول والتعرف على العميل.")}</p></div></div><div class="form-grid"><div class="field"><label>${ui("Full name", "الاسم الكامل")}</label><input name="name" value="${escapeHtml(user.name||user.full_name||"")}" required minlength="2" autocomplete="name" /></div><div class="field"><label>${ui("Email", "البريد الإلكتروني")}</label><input name="email" type="email" value="${escapeHtml(user.email||"")}" required autocomplete="email" /></div><div class="field"><label>${ui("Phone", "رقم الجوال")}</label><input name="phone" type="tel" value="${escapeHtml(user.phone||"")}" autocomplete="tel" /></div><div class="field"><label>${isEdit?ui("New password", "كلمة مرور جديدة"):ui("Password", "كلمة المرور")}</label><input name="password" type="password" minlength="8" ${isEdit?"":"required"} autocomplete="new-password" placeholder="${isEdit?ui("Leave empty to keep current password", "اتركها فارغة للاحتفاظ بالحالية"):ui("At least 8 characters", "8 أحرف على الأقل")}" /></div><div class="field"><label>${ui("Account type", "نوع الحساب")}</label><select name="role">${[["customer",ui("Customer", "عميل")],["member",ui("Member", "مستخدم عادي")],["vip_customer",ui("VIP customer", "عميل VIP")],["wholesale",ui("Wholesale", "عميل جملة")]].map(([value,label])=>`<option value="${value}" ${String(user.role||"customer")===value?"selected":""}>${label}</option>`).join("")}</select></div><div class="field"><label>${ui("Account status", "حالة الحساب")}</label><select name="status"><option value="active" ${userIsActive(user)?"selected":""}>${ui("Active", "نشط")}</option><option value="inactive" ${String(user.status).toLowerCase()==="inactive"?"selected":""}>${ui("Inactive", "غير نشط")}</option><option value="blocked" ${String(user.status).toLowerCase()==="blocked"?"selected":""}>${ui("Blocked", "محظور")}</option></select></div></div><div class="editor-toggle-row user-email-verification"><div><strong>${ui("Email verified", "البريد موثق")}</strong><small>${ui("Mark the email as confirmed by the store team.", "تأكيد أن البريد تمت مراجعته بواسطة فريق المتجر.")}</small></div><input type="hidden" name="email_verified" value="${user.email_verified===true}" />${switchButton({field:"email_verified",value:user.email_verified===true,label:false})}</div></section><section><div class="studio-card-head"><span class="section-kicker">02</span><div><h3>${ui("Storefront permissions", "صلاحيات واجهة المتجر")}</h3><p>${ui("Turn each capability on or off for this account.", "فعّل أو أوقف كل صلاحية لهذا الحساب بشكل مستقل.")}</p></div></div><div class="user-permissions-grid">${userPermissionOptions.map(([key,en,ar])=>`<div class="field editor-toggle-row" data-user-permission="${key}"><div><strong>${ui(en,ar)}</strong><small>${key.replaceAll("_"," ")}</small></div><input type="hidden" name="permission_${key}" value="${permissions.has(key)}" />${switchButton({field:`permission_${key}`,value:permissions.has(key),label:false})}</div>`).join("")}</div></section></div></div><div class="modal-foot"><button class="btn" type="button" data-close-user-editor>${t("cancel")}</button><button class="btn primary" type="submit">${i("check")}${isEdit?ui("Save changes", "حفظ التعديلات"):ui("Create account", "إنشاء الحساب")}</button></div></form></div>`);
    const backdrop = document.querySelector(".user-editor-backdrop");
    const close = () => backdrop?.remove();
    backdrop.querySelectorAll("[data-close-user-editor]").forEach(button => button.onclick = close);
    backdrop.querySelectorAll("[data-form-switch]").forEach(button => button.onclick = () => updateFormSwitch(button));
    backdrop.querySelector("#userEditorForm").onsubmit = async event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget));
      const body = { name:data.name, email:data.email, phone:data.phone, role:data.role, status:data.status, email_verified:data.email_verified === "true", permissions:userPermissionOptions.filter(([key])=>data[`permission_${key}`] === "true").map(([key])=>key) };
      if (data.password) body.password = data.password;
      const button=event.currentTarget.querySelector('[type="submit"]'); button.disabled=true;
      try { await api(isEdit?`/api/admin/users/${user.id}`:"/api/admin/users", { method:isEdit?"PUT":"POST", body:JSON.stringify(body) }); close(); toast(isEdit?ui("User updated", "تم تحديث المستخدم"):ui("Account created", "تم إنشاء الحساب")); renderUsers(document.getElementById("page")); } catch(error) { toast(error.message,"error"); button.disabled=false; }
    };
  }

  async function renderUsers(page) {
    const [payload, statsPayload] = await Promise.all([
      api("/api/admin/users"),
      api("/api/admin/users/stats").catch(() => ({ stats:{} }))
    ]);
    const users = payload.users || [];
    const stats = statsPayload.stats || {};
    state.rows.users = users;
    page.innerHTML = pageTitle("users", "", `<button class="btn" type="button" id="refreshUsers">${i("refresh")}${ui("Refresh", "تحديث")}</button><button class="btn primary" type="button" id="addUser">${i("plus")}${ui("Add user", "إضافة مستخدم")}</button>`);
    page.innerHTML += `<section class="user-overview-grid"><article><span>${ui("All users", "كل المستخدمين")}</span><strong>${Number(stats.totalUsers ?? users.length)}</strong></article><article class="active"><span>${ui("Active", "نشط")}</span><strong>${Number(stats.activeUsers ?? users.filter(userIsActive).length)}</strong></article><article><span>${ui("Inactive", "غير نشط")}</span><strong>${Number(stats.inactiveUsers ?? users.filter(user => !userIsActive(user)).length)}</strong></article><article><span>${ui("Verified", "موثق")}</span><strong>${Number(stats.verifiedUsers || 0)}</strong></article></section>
      <section class="card user-management-card"><div class="user-management-head"><div><span class="section-kicker">CUSTOMER ACCOUNTS</span><h2>${ui("Users and access", "المستخدمون وصلاحية الدخول")}</h2><p>${ui("Search customer accounts and control whether each account can access the store.", "ابحث في حسابات العملاء وتحكم في إمكانية دخول كل حساب إلى المتجر.")}</p></div><span class="pill" id="userMatchCount"></span></div><div class="user-filters"><div class="field"><label>${ui("Search", "بحث")}</label><input id="userSearch" type="search" placeholder="${ui("Name, email, phone or ID", "الاسم أو البريد أو الجوال أو الرقم")}" /></div><div class="field"><label>${ui("Status", "الحالة")}</label><select id="userStatusFilter"><option value="">${ui("All statuses", "كل الحالات")}</option><option value="active">${ui("Active", "نشط")}</option><option value="inactive">${ui("Inactive", "غير نشط")}</option><option value="blocked">${ui("Blocked", "محظور")}</option></select></div></div><div id="usersTableArea"></div></section>`;
    const draw = () => {
      const q = document.getElementById("userSearch").value.trim().toLowerCase();
      const status = document.getElementById("userStatusFilter").value;
      const rows = users.filter(user => {
        const currentStatus = String(user.status || (userIsActive(user) ? "active" : "inactive")).toLowerCase();
        const haystack = [user.id,user.name,user.full_name,user.email,user.phone,user.role].join(" ").toLowerCase();
        return (!q || haystack.includes(q)) && (!status || currentStatus === status);
      });
      document.getElementById("userMatchCount").textContent = `${rows.length} ${ui("users", "مستخدم")}`;
      document.getElementById("usersTableArea").innerHTML = rows.length ? `<div class="table-scroll"><table class="data-table users-table"><thead><tr><th>${ui("User", "المستخدم")}</th><th>${ui("Contact", "التواصل")}</th><th>${ui("Orders", "الطلبات")}</th><th>${ui("Total spent", "إجمالي المشتريات")}</th><th>${ui("Joined", "تاريخ الانضمام")}</th><th>${ui("Status", "الحالة")}</th><th>${ui("Access", "الدخول")}</th><th></th></tr></thead><tbody>${rows.map(user => { const active=userIsActive(user); const name=user.name||user.full_name||user.email||`#${user.id}`; return `<tr><td><div class="user-identity"><span>${escapeHtml(String(name).trim().charAt(0).toUpperCase() || "U")}</span><div><strong>${escapeHtml(name)}</strong><small>#${escapeHtml(user.id)} · ${escapeHtml(user.role || "customer")}</small></div></div></td><td><strong>${escapeHtml(user.email || "-")}</strong><small>${escapeHtml(user.phone || "-")}</small></td><td><strong>${Number(user.order_count || 0)}</strong><small>${Number(user.completed_order_count || 0)} ${ui("completed", "مكتمل")}</small></td><td><strong>${shippingMoney(user.total_spent || 0,"SAR")}</strong><small>${user.last_order_at ? `${ui("Last order", "آخر طلب")}: ${formatDateTime(user.last_order_at)}` : ui("No orders", "لا توجد طلبات")}</small></td><td><strong>${formatDateTime(user.created_at || user.createdAt)}</strong></td><td><span class="status-pill ${active ? "good" : String(user.status).toLowerCase() === "blocked" ? "bad" : "empty"}">${userStatusLabel(user)}</span></td><td><label class="user-access-toggle"><span>${active ? ui("Active", "نشط") : ui("Inactive", "غير نشط")}</span><span data-user-access="${user.id}">${switchButton({field:`user_active_${user.id}`,value:active,label:false})}</span></label></td><td><button class="btn icon-btn" type="button" data-edit-user="${user.id}" title="${t("edit")}">${i("edit")}</button></td></tr>`; }).join("")}</tbody></table></div>` : `<div class="empty-state"><div><h2>${ui("No matching users", "لا يوجد مستخدمون مطابقون")}</h2><p class="muted">${ui("Create the first account manually from the Add user button.", "أنشئ أول حساب يدويًا من زر إضافة مستخدم.")}</p></div></div>`;
      document.querySelectorAll("[data-user-access]").forEach(wrapper => wrapper.querySelector("[data-form-switch]").onclick = async event => { const button=event.currentTarget; const next=button.dataset.switchValue !== "true"; button.disabled=true; try { await api(`/api/admin/users/${wrapper.dataset.userAccess}/status`, { method:"PATCH", body:JSON.stringify({ status:next?"active":"inactive" }) }); toast(next?ui("User activated", "تم تفعيل المستخدم"):ui("User deactivated", "تم إيقاف المستخدم")); renderUsers(document.getElementById("page")); } catch(error) { toast(error.message,"error"); button.disabled=false; } });
      document.querySelectorAll("[data-edit-user]").forEach(button => button.onclick = () => openUserEditor(users.find(user => String(user.id) === button.dataset.editUser) || {}));
    };
    document.getElementById("userSearch").oninput = draw;
    document.getElementById("userStatusFilter").onchange = draw;
    document.getElementById("refreshUsers").onclick = () => renderUsers(page);
    document.getElementById("addUser").onclick = () => openUserEditor();
    draw();
  }

  const orderStatuses = ["pending","confirmed","processing","ready_to_ship","shipped","delivered","cancelled"];
  function orderStatusLabel(status){const labels={pending:["Pending","معلق"],confirmed:["Confirmed","مؤكد"],processing:["Processing","قيد التجهيز"],ready_to_ship:["Ready to ship","جاهز للشحن"],shipped:["Shipped","تم الشحن"],delivered:["Delivered","تم التسليم"],cancelled:["Cancelled","ملغي"]};const value=labels[status]||[status,status];return state.lang==="ar"?value[1]:value[0];}
  function orderStatusClass(status){return status==="delivered"?"good":status==="cancelled"?"bad":["pending","confirmed"].includes(status)?"warn":"info";}
  function orderAddressText(order){const a=order.shipping_address||order.customer||{};return [a.city,a.district,a.street].filter(Boolean).join(" · ")||"-";}
  function orderCustomer(order){return order.shipping_address||order.customer||{};}

  async function renderOrders(page){
    const [stats,migration]=await Promise.all([api("/api/admin/order-management/stats/summary"),api("/api/admin/order-migrations/legacy")]);
    page.innerHTML=pageTitle("orders","",`<button class="btn" type="button" id="refreshOrders">${i("refresh")}${ui("Refresh","تحديث")}</button>`);
    page.innerHTML+=`<div class="order-command-bar"><article><span>${ui("All orders","كل الطلبات")}</span><strong>${stats.totalOrders||0}</strong></article><article><span>${ui("Needs attention","تحتاج إجراء")}</span><strong>${stats.pendingOrders||0}</strong></article><article><span>${ui("In fulfillment","قيد التنفيذ")}</span><strong>${stats.processingOrders||0}</strong></article><article><span>${ui("Delivered","تم التسليم")}</span><strong>${stats.deliveredOrders||0}</strong></article><article class="revenue"><span>${ui("Order value","قيمة الطلبات")}</span><strong>${shippingMoney(stats.totalRevenue,"SAR")}</strong></article></div>
      <section class="legacy-import-strip"><div><span class="status-pill good">${ui("Imported history","سجل مستورد")}</span><strong>${Number(migration.imported_orders||0).toLocaleString()} ${ui("Komrz orders preserved","طلب Komrz محفوظ")}</strong><small>${migration.date_min?`${formatDateTime(migration.date_min)} → ${formatDateTime(migration.date_max)}`:""}</small></div><div class="legacy-import-metrics"><span><b>${migration.linked_shipments||0}</b>${ui("iMile links","ربط iMile")}</span><span class="${migration.unmatched_lines?"warn":""}"><b>${migration.unmatched_lines||0}</b>${ui("unmatched old lines","بند قديم غير مطابق")}</span><span><b>${migration.latest_run?.completed_at?formatDateTime(migration.latest_run.completed_at):"-"}</b>${ui("last import","آخر استيراد")}</span></div></section>
      <section class="card order-workspace">
        <div class="order-filter-head"><div><span class="section-kicker">ORDER DESK</span><h2>${ui("Find and manage an order","البحث وإدارة الطلبات")}</h2></div><span class="pill" id="ordersMatchCount"></span></div>
        <div class="order-filters"><div class="field"><label>${ui("Search","بحث")}</label><input id="orderSearch" placeholder="${ui("Order, customer, phone or city","رقم الطلب أو العميل أو الهاتف أو المدينة")}" /></div><div class="field"><label>${ui("Source","المصدر")}</label><select id="orderSourceFilter"><option value="">${ui("All sources","كل المصادر")}</option><option value="live">${ui("New store","المتجر الجديد")}</option><option value="legacy">${ui("Komrz history","سجل Komrz")}</option></select></div><div class="field"><label>${ui("Status","الحالة")}</label><select id="orderStatusFilter"><option value="">${ui("All statuses","كل الحالات")}</option>${orderStatuses.map(status=>`<option value="${status}">${orderStatusLabel(status)}</option>`).join("")}</select></div><div class="field"><label>${ui("Address","العنوان")}</label><select id="orderAddressFilter"><option value="">${ui("All addresses","كل العناوين")}</option><option value="verified">${ui("SPL verified","موثق من SPL")}</option><option value="manual">${ui("Manual","يدوي")}</option></select></div><div class="field"><label>${ui("Shipment","الشحنة")}</label><select id="orderShipmentFilter"><option value="">${ui("All orders","كل الطلبات")}</option><option value="linked">${ui("Shipment linked","مرتبطة بشحنة")}</option><option value="unlinked">${ui("No shipment","بدون شحنة")}</option></select></div></div>
        <div id="ordersTableArea"></div><div class="order-pager" id="ordersPager"></div>
      </section>`;
    let currentPage=1,searchTimer=null;
    const loadRows=async(targetPage=1)=>{currentPage=targetPage;const params=new URLSearchParams({page:String(currentPage),limit:"50",q:document.getElementById("orderSearch").value.trim(),source:document.getElementById("orderSourceFilter").value,status:document.getElementById("orderStatusFilter").value,address:document.getElementById("orderAddressFilter").value,shipment:document.getElementById("orderShipmentFilter").value});const area=document.getElementById("ordersTableArea");area.innerHTML=`<div class="review-loading">${i("refresh")} ${ui("Loading orders…","جاري تحميل الطلبات…")}</div>`;try{const result=await api(`/api/admin/orders?${params}`);const rows=result.orders||[],pagination=result.pagination||{};currentPage=pagination.page||1;document.getElementById("ordersMatchCount").textContent=`${Number(pagination.total||0).toLocaleString()} ${ui("orders","طلب")}`;area.innerHTML=rows.length?`<div class="table-scroll"><table class="data-table order-table"><thead><tr><th>${ui("Order","الطلب")}</th><th>${ui("Customer","العميل")}</th><th>${ui("Address","العنوان")}</th><th>${ui("Payment","الدفع")}</th><th>${ui("Total","الإجمالي")}</th><th>${ui("Status","الحالة")}</th><th>${ui("Shipment","الشحنة")}</th><th></th></tr></thead><tbody>${rows.map(order=>{const customer=orderCustomer(order);const displayNumber=order.legacy_order_number||order.id;return `<tr><td><strong>#${escapeHtml(displayNumber)}</strong><small>${formatDateTime(order.created_at)} · ${order.is_historical?ui("Komrz","قديم"):"SITEYFY"}</small></td><td><strong>${escapeHtml(customer.full_name||ui("Unavailable","غير متاح"))}</strong><small>${escapeHtml(customer.phone||"-")}</small></td><td><span>${escapeHtml(orderAddressText(order))}</span><small class="address-source ${order.address_status==="verified"?"verified":""}">${order.address_status==="verified"?ui("SPL verified","موثق من SPL"):order.is_historical?ui("Imported address","عنوان مستورد"):ui("Manual address","عنوان يدوي")}</small></td><td><strong>${escapeHtml(order.payment?.provider_title||omsPaymentLabel(order.payment_method)||"-")}</strong><small>${escapeHtml(order.payment_status||"pending")}</small></td><td><strong>${shippingMoney(order.total,order.currency_snapshot?.code||"SAR")}</strong><small>${Number(order.items?.length||0)} ${ui("lines","بنود")}</small></td><td><span class="status-pill ${orderStatusClass(order.status)}">${orderStatusLabel(order.status)}</span></td><td>${order.shipment?`<strong>${escapeHtml(order.shipment.waybill_no||ui("Preparing","تجهيز"))}</strong><small>${escapeHtml(shippingStatusLabel(order.shipment.status_group))}</small>`:`<span class="muted">${order.is_historical?ui("No historical match","لا توجد مطابقة قديمة"):ui("Not created","لم تنشأ")}</span>`}</td><td><button class="btn" type="button" data-open-order="${order.id}">${i("eye")}${ui("Open","فتح")}</button></td></tr>`;}).join("")}</tbody></table></div>`:`<div class="empty-state">${ui("No orders match these filters.","لا توجد طلبات مطابقة للفلاتر.")}</div>`;const pager=document.getElementById("ordersPager");pager.innerHTML=pagination.totalPages>1?`<button class="btn" id="ordersPrev" ${currentPage<=1?"disabled":""}>${i("arrow-left")}${ui("Previous","السابق")}</button><span>${ui("Page","صفحة")} <b>${currentPage}</b> ${ui("of","من")} <b>${pagination.totalPages}</b></span><button class="btn" id="ordersNext" ${currentPage>=pagination.totalPages?"disabled":""}>${ui("Next","التالي")}${i("arrow-right")}</button>`:"";document.querySelectorAll("[data-open-order]").forEach(btn=>btn.onclick=()=>location.hash=`orderDetail/${btn.dataset.openOrder}`);document.getElementById("ordersPrev")?.addEventListener("click",()=>loadRows(currentPage-1));document.getElementById("ordersNext")?.addEventListener("click",()=>loadRows(currentPage+1));}catch(error){area.innerHTML=`<div class="empty-state">${escapeHtml(error.message)}</div>`;}};
    ["orderSourceFilter","orderStatusFilter","orderAddressFilter","orderShipmentFilter"].forEach(id=>document.getElementById(id).addEventListener("change",()=>loadRows(1)));
    document.getElementById("orderSearch").addEventListener("input",()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>loadRows(1),250);});
    document.getElementById("refreshOrders").onclick=()=>loadRows(currentPage);loadRows();
  }

  async function renderOrderDetail(page,orderId){
    if(!orderId){location.hash="orders";return;}
    const result=await api(`/api/admin/order-management/${orderId}`);const order=result.order||{};const customer=orderCustomer(order);const shipment=order.shipment;const currency=order.currency_snapshot?.code||"SAR";const splReady=result.integrations?.spl_address?.is_enabled&&result.integrations?.spl_address?.has_api_key;const imileReady=result.integrations?.active_provider==="imile";
    page.innerHTML=`<div class="order-detail-head"><div><button class="btn back-link" type="button" id="backToOrders">${i("arrow-left")}${ui("Back to orders","العودة للطلبات")}</button><span class="section-kicker">ORDER #${escapeHtml(order.legacy_order_number||order.id)}</span><h1>${escapeHtml(customer.full_name||ui("Customer order","طلب عميل"))}</h1><p>${formatDateTime(order.created_at)} · ${shippingMoney(order.total,currency)}</p></div><div class="order-head-actions"><span class="status-pill ${orderStatusClass(order.status)}">${orderStatusLabel(order.status)}</span><select id="orderStatusSelect">${orderStatuses.map(status=>`<option value="${status}" ${status===order.status?"selected":""}>${orderStatusLabel(status)}</option>`).join("")}</select><button class="btn primary" id="saveOrderStatus">${i("check")}${ui("Update status","تحديث الحالة")}</button></div></div>
      ${order.is_historical?`<div class="order-alert historical">${i("file")}<div><strong>${ui("Imported Komrz order","طلب مستورد من Komrz")}</strong><span>${ui("Preserved for history and analytics. Inventory, coupons, notifications and new shipping dispatch are disabled for this record.","محفوظ للتاريخ والتحليلات، ولا يؤثر على المخزون أو الكوبونات أو الإشعارات ولا يمكن إنشاء شحنة جديدة منه.")}</span></div></div>`:""}
      ${order.shipment_address_out_of_sync?`<div class="order-alert warn">${i("triangle-alert")}${ui("The address changed after the shipping label was created. Review the iMile shipment before dispatch.","تم تغيير العنوان بعد إنشاء بوليصة الشحن. راجع شحنة iMile قبل الإرسال.")}</div>`:""}
      <div class="order-detail-grid">
        <section class="card card-pad order-address-panel"><div class="studio-card-head"><span class="section-kicker">ADDRESS</span><div><h2>${ui("Delivery address","عنوان التوصيل")}</h2><p>${ui("Verify with SPL or carefully save a manual address.","تحقق بواسطة SPL أو احفظ العنوان اليدوي بعناية.")}</p></div><span class="status-pill ${customer.address_verification?.status==="verified"?"good":order.is_historical?"info":"warn"}">${customer.address_verification?.status==="verified"?ui("SPL verified","موثق من SPL"):order.is_historical?ui("Imported","مستورد"):ui("Manual","يدوي")}</span></div><form id="orderAddressForm" class="form-grid">${[["full_name",ui("Full name","الاسم الكامل")],["phone",ui("Phone","الهاتف")],["country_code",ui("Country","الدولة")],["short_address",ui("Short address","الرمز المختصر")],["province",ui("Province","المنطقة")],["city",ui("City","المدينة")],["district",ui("District","الحي")],["street",ui("Street","الشارع")],["building_number",ui("Building number","رقم المبنى")],["postal_code",ui("Postal code","الرمز البريدي")],["additional_number",ui("Additional number","الرقم الإضافي")]].map(([name,label])=>`<div class="field"><label>${label}</label><input name="${name}" value="${escapeHtml(customer[name]??"")}" ${name==="short_address"?'style="direction:ltr;text-transform:uppercase"':""} /></div>`).join("")}<div class="field full"><label>${ui("Address notes","ملاحظات العنوان")}</label><textarea name="address_notes">${escapeHtml(customer.address_notes||"")}</textarea></div><div class="order-address-actions full"><small>${splReady?ui("SPL is ready. Saving a valid Saudi short address verifies and replaces the structured address fields.","SPL جاهز. حفظ رمز سعودي صحيح يتحقق منه ويستبدل حقول العنوان المنظمة."):ui("Add the SPL key in Integrations to enable official verification.","أضف مفتاح SPL في التكاملات لتفعيل التحقق الرسمي.")}</small><button class="btn primary" type="submit">${i("map-pin-check")}${splReady?ui("Save & verify","حفظ وتحقق"):ui("Save address","حفظ العنوان")}</button></div></form></section>
        <aside class="order-side-stack"><section class="card card-pad"><div class="studio-card-head"><span class="section-kicker">FULFILLMENT</span><div><h2>iMile</h2><p>${ui("Shipping label and tracking link.","بوليصة الشحن وربط التتبع.")}</p></div></div>${shipment?`<dl class="order-facts"><div><dt>${ui("Waybill","البوليصة")}</dt><dd>${escapeHtml(shipment.waybill_no||ui("Not assigned","لم تصدر"))}</dd></div><div><dt>${ui("Status","الحالة")}</dt><dd>${escapeHtml(shippingStatusLabel(shipment.status_group))}</dd></div><div><dt>${ui("Sync","المزامنة")}</dt><dd>${escapeHtml(shipment.sync_state||"-")}</dd></div></dl>${shipment.integration_error?`<p class="negative">${escapeHtml(shipment.integration_error)}</p>`:""}`:`<div class="empty-inline">${order.is_historical?ui("No matching historical shipment.","لا توجد شحنة تاريخية مطابقة."):ui("No shipment created yet.","لم يتم إنشاء شحنة بعد.")}</div>`}<button class="btn primary full-button" id="dispatchOrder" ${order.is_historical||!imileReady||shipment?.waybill_no?"disabled":""}>${i("truck")}${shipment?.waybill_no?ui("Shipment linked","الشحنة مرتبطة"):order.is_historical?ui("Historical dispatch disabled","إنشاء الشحنات متوقف للتاريخ"):ui("Create iMile shipment","إنشاء شحنة iMile")}</button>${!order.is_historical&&!imileReady?`<small class="muted">${ui("Activate iMile in Integrations first.","فعّل iMile من التكاملات أولًا.")}</small>`:""}</section><section class="card card-pad"><span class="section-kicker">PAYMENT</span><dl class="order-facts"><div><dt>${ui("Method","الطريقة")}</dt><dd>${escapeHtml(order.payment?.provider_title||omsPaymentLabel(order.payment?.method)||"-")}</dd></div><div><dt>${ui("Status","الحالة")}</dt><dd>${escapeHtml(order.payment?.status||"pending")}</dd></div><div><dt>${ui("COD amount","المبلغ المحصل")}</dt><dd>${shippingMoney(order.payment?.cod_amount,currency)}</dd></div></dl></section></aside>
        <section class="card card-pad order-lines-panel"><div class="studio-card-head"><span class="section-kicker">ITEMS</span><div><h2>${ui("Order items","منتجات الطلب")}</h2><p>${Number(order.items?.length||0)} ${ui("line items","بند")}</p></div></div><div class="order-line-list">${(order.items||[]).map(item=>`<article><img src="${escapeHtml(item.image_url||item.main_photo_url||"")}" alt="" /><div><strong>${escapeHtml(state.lang==="ar"?(item.name_ar||item.name_en):(item.name_en||item.name_ar)||`#${item.product_id}`)}</strong><small>${escapeHtml(item.variant_label||item.sku||"")}</small></div><span>${Number(item.quantity||1)} × ${shippingMoney(item.unit_price||item.price,currency)}</span><strong>${shippingMoney(item.final_subtotal??item.subtotal,currency)}</strong></article>`).join("")}</div><div class="order-total-ledger"><div><span>${ui("Subtotal","المجموع الفرعي")}</span><strong>${shippingMoney(order.subtotal,currency)}</strong></div><div><span>${ui("Discount","الخصم")}</span><strong>-${shippingMoney(order.discount_amount,currency)}</strong></div><div><span>${ui("Shipping","الشحن")}</span><strong>${shippingMoney(order.shipping_amount,currency)}</strong></div><div class="grand"><span>${ui("Total","الإجمالي")}</span><strong>${shippingMoney(order.total,currency)}</strong></div></div></section>
        <section class="card card-pad order-timeline-panel"><div class="studio-card-head"><span class="section-kicker">HISTORY</span><div><h2>${ui("Order activity","سجل الطلب")}</h2><p>${ui("Every operational change is recorded.","يتم تسجيل كل تغيير تشغيلي.")}</p></div></div><div class="order-timeline">${(result.events||[]).length?(result.events||[]).map(event=>`<div><span></span><strong>${escapeHtml(event.type.replaceAll("_"," "))}</strong><small>${formatDateTime(event.occurred_at||event.created_at)} · ${escapeHtml(event.actor||"")}</small></div>`).join(""):`<div><span></span><strong>${ui("Order created","تم إنشاء الطلب")}</strong><small>${formatDateTime(order.created_at)}</small></div>`}</div></section>
      </div>`;
    document.getElementById("backToOrders").onclick=()=>location.hash="orders";
    document.getElementById("saveOrderStatus").onclick=async event=>{event.currentTarget.disabled=true;try{await api(`/api/admin/order-management/${order.id}/status`,{method:"PATCH",body:JSON.stringify({status:document.getElementById("orderStatusSelect").value})});toast(ui("Order status updated","تم تحديث حالة الطلب"));renderOrderDetail(page,order.id);}catch(error){toast(error.message,"error");event.currentTarget.disabled=false;}};
    document.getElementById("orderAddressForm").onsubmit=async event=>{event.preventDefault();const button=event.currentTarget.querySelector('button[type="submit"]');button.disabled=true;try{const values=Object.fromEntries(new FormData(event.currentTarget));await api(`/api/admin/order-management/${order.id}/address`,{method:"PUT",body:JSON.stringify(values)});toast(ui("Address saved","تم حفظ العنوان"));renderOrderDetail(page,order.id);}catch(error){toast(error.message,"error");button.disabled=false;}};
    document.getElementById("dispatchOrder").onclick=async event=>{event.currentTarget.disabled=true;try{await api(`/api/admin/order-management/${order.id}/dispatch`,{method:"POST",body:"{}"});toast(ui("Shipment created","تم إنشاء الشحنة"));renderOrderDetail(page,order.id);}catch(error){toast(error.message,"error");event.currentTarget.disabled=false;}};
  }

  function collectionRows(payload) {
    return normalizeRows(payload, { listKey: "collections" });
  }

  function collectionName(row = {}) {
    return state.lang === "ar" ? (row.name_ar || row.name_en) : (row.name_en || row.name_ar);
  }

  function collectionItems(row = {}) {
    return Array.isArray(row.items) ? row.items : Array.isArray(row.collection_items) ? row.collection_items : [];
  }

  function collectionItemKey(productId, variantId) {
    return `${Number(productId)}::${variantId === null || variantId === undefined || variantId === "" ? "base" : String(variantId)}`;
  }

  function productVariants(product = {}) {
    return (Array.isArray(product.variants) ? product.variants : Array.isArray(product.active_variants) ? product.active_variants : [])
      .filter(variant => variant && variant.is_active !== false && variant.isActive !== false && variant.active !== false && variant.status !== "inactive");
  }

  function collectionProductName(product = {}) {
    return state.lang === "ar" ? (product.name_ar || product.name_en) : (product.name_en || product.name_ar);
  }

  function collectionProductImage(product = {}, variant = null) {
    return variant?.image_url || variant?.image || product.main_photo_url || product.image_url || "/uploads/catalog/gift.png";
  }

  function collectionVariantLabel(variant = null) {
    if (!variant) return ui("Base product", "المنتج الأساسي");
    return [variant.color, variant.option, variant.value].filter(Boolean).join(" · ") || variant.sku || `#${variant.id}`;
  }

  function collectionVariantPrice(product = {}, variant = null) {
    const direct = variant?.price;
    if (direct !== null && direct !== undefined && direct !== "" && Number(direct) > 0) return Number(direct);
    return Number(product.sale_price || product.price || 0) + Number(variant?.price_adjustment || variant?.price_delta || 0);
  }

  function collectionSwatch(product = {}, variant = null) {
    const colorName = variant?.color || product.color || "";
    if (/^#[0-9a-f]{3,8}$/i.test(colorName)) return colorName;
    const match = (state.rows.colors || []).find(color => [color.name_en, color.nameEn, color.name_ar, color.nameAr].some(name => String(name || "").toLowerCase() === String(colorName).toLowerCase()));
    return match?.color || match?.hex || "#d5d8de";
  }

  function resolveCollectionItem(item = {}, products = []) {
    const productId = Number(item.product_id || item.productId || item.product?.id || 0);
    const product = products.find(row => Number(row.id) === productId) || item.product || {};
    const variantId = item.variant_id ?? item.variantId ?? item.variant?.id ?? null;
    const variant = variantId === null || variantId === "" ? null : productVariants(product).find(row => String(row.id) === String(variantId)) || item.variant || null;
    return { product_id: productId, variant_id: variantId === "" ? null : variantId, product, variant, is_available:item.is_available !== false, availability:item.availability || null };
  }

  async function loadCollections() {
    const payload = await api("/api/admin/collections");
    const rows = collectionRows(payload);
    state.rows.collections = rows;
    return rows;
  }

  function collectionAdminCard(row = {}) {
    const items = collectionItems(row);
    const cover = row.cover_image_url || row.image_url || items[0]?.image_url || "";
    return `<article class="collection-card">
      <div class="collection-card-cover">${cover ? `<img src="${escapeHtml(cover)}" alt="" />` : `<span>${i("collection")}</span>`}<span class="collection-count">${Number(row.item_count ?? items.length)} ${ui("variants", "اختيارات")}</span></div>
      <div class="collection-card-body">
        <div class="collection-card-title"><div><small>/${escapeHtml(row.slug || "collection")}</small><h2>${escapeHtml(collectionName(row) || ui("Untitled collection", "مجموعة بلا اسم"))}</h2></div><div data-collection-toggle="${row.id}"><input type="hidden" name="is_active" value="${row.is_active !== false}" />${switchButton({ field:"is_active", value:row.is_active !== false, label:false })}</div></div>
        <div class="collection-card-meta"><span>${i("box")}${Number(row.product_count ?? new Set(items.map(item=>item.product_id)).size)} ${ui("products", "منتجات")}</span><span>${i("collection")}${Number(row.item_count ?? items.length)} ${ui("entries", "عناصر")}</span></div>
        <div class="collection-card-actions"><button class="btn" type="button" data-edit-collection="${row.id}">${i("edit")}${t("edit")}</button><button class="btn icon-btn danger" type="button" data-delete-collection="${row.id}" title="${t("delete")}">${i("trash")}</button></div>
      </div>
    </article>`;
  }

  async function renderCollections(page) {
    const collections = await loadCollections();
    const active = collections.filter(row => row.is_active !== false).length;
    const entries = collections.reduce((sum, row) => sum + Number(row.item_count ?? collectionItems(row).length), 0);
    page.innerHTML = pageTitle("collections", "collectionsSub", `<button class="btn primary" type="button" id="createCollectionBtn">${i("plus")}${t("createCollection")}</button>`);
    page.innerHTML += `<div class="collection-stats"><article><span>${ui("Collections", "المجموعات")}</span><strong>${collections.length}</strong></article><article><span>${ui("Active", "النشطة")}</span><strong>${active}</strong></article><article><span>${ui("Curated entries", "العناصر المنسقة")}</span><strong>${entries}</strong></article></div><div class="collection-grid">${collections.length ? collections.map(collectionAdminCard).join("") : `<div class="card collection-empty"><span>${i("collection")}</span><h2>${ui("Build your first collection", "أنشئ أول مجموعة")}</h2><p>${t("collectionsSub")}</p><button class="btn primary" type="button" data-empty-create>${i("plus")}${t("createCollection")}</button></div>`}</div>`;
    const create = () => location.hash = "collectionEditor/new";
    document.getElementById("createCollectionBtn").onclick = create;
    document.querySelector("[data-empty-create]")?.addEventListener("click", create);
    document.querySelectorAll("[data-edit-collection]").forEach(button => button.onclick = () => location.hash = `collectionEditor/${button.dataset.editCollection}`);
    document.querySelectorAll("[data-delete-collection]").forEach(button => button.onclick = async () => {
      if (!window.confirm(ui("Delete this collection? Products will not be deleted.", "حذف هذه المجموعة؟ لن يتم حذف المنتجات."))) return;
      try { await api(`/api/admin/collections/${button.dataset.deleteCollection}`, { method:"DELETE" }); toast(t("deleted")); renderCollections(page); } catch (error) { toast(error.message, "error"); }
    });
    document.querySelectorAll("[data-collection-toggle]").forEach(wrapper => {
      const button = wrapper.querySelector("[data-form-switch]");
      button.onclick = async () => {
        const row = collections.find(item => String(item.id) === String(wrapper.dataset.collectionToggle));
        const next = row?.is_active === false;
        button.disabled = true;
        try { await api(`/api/admin/collections/${row.id}`, { method:"PATCH", body:JSON.stringify({ is_active:next }) }); toast(t("updated")); renderCollections(page); } catch (error) { toast(error.message, "error"); button.disabled = false; }
      };
    });
  }

  function collectionSelectedRow(entry, index) {
    const { product, variant } = entry;
    const unavailable = entry.is_available === false || !product?.id || (entry.variant_id !== null && entry.variant_id !== undefined && !variant);
    return `<article class="collection-sequence-row ${unavailable ? "is-unavailable" : ""}" data-collection-entry="${escapeHtml(collectionItemKey(entry.product_id, entry.variant_id))}">
      <span class="collection-sequence-number">${String(index + 1).padStart(2, "0")}</span>
      <img src="${escapeHtml(collectionProductImage(product, variant))}" alt="" />
      <span class="collection-variant-swatch" style="--variant-swatch:${escapeHtml(collectionSwatch(product, variant))}"></span>
      <div class="collection-sequence-copy"><strong>${escapeHtml(collectionProductName(product) || `#${entry.product_id}`)}</strong><span>${escapeHtml(collectionVariantLabel(variant))}</span><small>${escapeHtml(variant?.sku || product?.sku || "—")} · ${bundleMoney(collectionVariantPrice(product, variant))}${unavailable ? ` · ${ui("Unavailable", "غير متاح")}` : ""}</small></div>
      <div class="collection-sequence-actions"><button class="btn icon-btn" type="button" data-move-entry="up" ${index === 0 ? "disabled" : ""} title="${ui("Move up", "تحريك لأعلى")}">${i("arrow-up")}</button><button class="btn icon-btn" type="button" data-move-entry="down" title="${ui("Move down", "تحريك لأسفل")}">${i("arrow-down")}</button><button class="btn icon-btn danger" type="button" data-remove-entry title="${t("delete")}">${i("trash")}</button></div>
    </article>`;
  }

  async function renderCollectionEditor(page, collectionId) {
    const isNew = !collectionId || collectionId === "new";
    const [products, colors, payload] = await Promise.all([
      state.rows.products?.length ? Promise.resolve(state.rows.products) : loadResource("products"),
      state.rows.colors?.length ? Promise.resolve(state.rows.colors) : loadResource("colors").catch(() => []),
      isNew ? Promise.resolve(null) : api(`/api/admin/collections/${encodeURIComponent(collectionId)}`)
    ]);
    const row = payload?.collection || payload || {};
    let selected = collectionItems(row).map(item => resolveCollectionItem(item, products)).filter(item => item.product_id);
    page.innerHTML = `<div class="collection-editor-head"><div><button class="btn back-link" type="button" id="backToCollections">${i("arrow-left")}${ui("Back to collections", "العودة للمجموعات")}</button><span class="section-kicker">${isNew ? "NEW COLLECTION" : `COLLECTION #${escapeHtml(row.id || collectionId)}`}</span><h1>${isNew ? t("createCollection") : t("editCollection")}</h1><p>${t("collectionsSub")}</p></div><div class="collection-editor-head-actions"><button class="btn" type="button" id="cancelCollection">${t("cancel")}</button><button class="btn primary" type="submit" form="collectionEditorForm">${i("check")}${t("save")}</button></div></div>
      <form id="collectionEditorForm" class="collection-editor-layout">
        <section class="collection-editor-main">
          <article class="card card-pad collection-identity"><div class="studio-card-head"><span class="section-kicker">01</span><div><h2>${ui("Collection identity", "بيانات المجموعة")}</h2><p>${ui("Bilingual copy and storefront URL.", "النصوص باللغتين ورابط الواجهة.")}</p></div></div><div class="form-grid">${labeledField("name_en", ui("English name", "الاسم بالإنجليزية"), row.name_en || "", "text", { full:false })}${labeledField("name_ar", ui("Arabic name", "الاسم بالعربية"), row.name_ar || "", "text", { full:false })}${labeledField("slug", ui("Slug", "الرابط المختصر"), row.slug || "", "text", { full:true })}<div class="field full"><label>${ui("English description", "الوصف بالإنجليزية")}</label><textarea name="description_en">${escapeHtml(row.description_en || "")}</textarea></div><div class="field full"><label>${ui("Arabic description", "الوصف بالعربية")}</label><textarea name="description_ar">${escapeHtml(row.description_ar || "")}</textarea></div></div></article>
          <article class="card card-pad collection-sequence"><div class="collection-sequence-head"><div><span class="section-kicker">02</span><h2>${ui("Selected sequence", "ترتيب العناصر المختارة")}</h2><p>${ui("Each row is one exact product variant. Reorder it to control the storefront rail.", "كل سطر يمثل اختيارًا محددًا من منتج. رتبه للتحكم في ظهوره بالواجهة.")}</p></div><div><span class="pill" id="collectionEntryCount"></span><button class="btn primary" type="button" id="addCollectionProducts">${i("plus")}${ui("Add products", "إضافة منتجات")}</button></div></div><div id="collectionSequenceList"></div></article>
        </section>
        <aside class="collection-editor-side"><article class="card card-pad"><span class="section-kicker">STATUS</span><div class="collection-publish-row"><div><h2>${ui("Storefront visibility", "الظهور في الواجهة")}</h2><p>${ui("Inactive collections remain saved but are hidden.", "المجموعات غير النشطة تظل محفوظة ومخفية.")}</p></div><div class="field"><input type="hidden" name="is_active" value="${row.is_active !== false}" />${switchButton({ field:"is_active", value:row.is_active !== false, label:true })}</div></div></article><article class="card card-pad collection-cover-card"><span class="section-kicker">COVER</span>${imageUploadField("cover_image_url", ui("Collection cover", "صورة غلاف المجموعة"), row.cover_image_url || row.image_url || "")}</article></aside>
      </form>`;
    const form = document.getElementById("collectionEditorForm");
    const renderSequence = () => {
      const list = document.getElementById("collectionSequenceList");
      document.getElementById("collectionEntryCount").textContent = `${selected.length} ${ui("entries", "عناصر")}`;
      list.innerHTML = selected.length ? `<div class="collection-sequence-list">${selected.map(collectionSelectedRow).join("")}</div>` : `<div class="collection-sequence-empty"><span>${i("collection")}</span><strong>${ui("No variants selected", "لم يتم اختيار عناصر")}</strong><p>${ui("Add products, then choose the exact colors or options for this collection.", "أضف المنتجات ثم اختر الألوان أو الخيارات المحددة لهذه المجموعة.")}</p></div>`;
      list.querySelectorAll("[data-remove-entry]").forEach(button => button.onclick = () => { const key = button.closest("[data-collection-entry]").dataset.collectionEntry; selected = selected.filter(item => collectionItemKey(item.product_id, item.variant_id) !== key); renderSequence(); });
      list.querySelectorAll("[data-move-entry]").forEach(button => button.onclick = () => { const key = button.closest("[data-collection-entry]").dataset.collectionEntry; const index = selected.findIndex(item => collectionItemKey(item.product_id, item.variant_id) === key); const next = button.dataset.moveEntry === "up" ? index - 1 : index + 1; if (index < 0 || next < 0 || next >= selected.length) return; [selected[index], selected[next]] = [selected[next], selected[index]]; renderSequence(); });
    };
    document.getElementById("backToCollections").onclick = document.getElementById("cancelCollection").onclick = () => location.hash = "collections";
    form.querySelector("[data-form-switch]").onclick = event => updateFormSwitch(event.currentTarget);
    bindImageUploadFields();
    document.getElementById("addCollectionProducts").onclick = () => openCollectionProductPicker(products, selected, additions => { const existing = new Set(selected.map(item => collectionItemKey(item.product_id, item.variant_id))); additions.forEach(item => { const key = collectionItemKey(item.product_id, item.variant_id); if (!existing.has(key)) { selected.push(item); existing.add(key); } }); renderSequence(); });
    form.querySelector('[name="name_en"]').addEventListener("input", event => { const slug = form.querySelector('[name="slug"]'); if (!slug.dataset.edited) slug.value = slugFromText(event.target.value); });
    form.querySelector('[name="slug"]').addEventListener("input", event => event.target.dataset.edited = "true");
    form.onsubmit = async event => {
      event.preventDefault();
      const button = document.querySelector('[type="submit"][form="collectionEditorForm"]');
      const values = namedValues(form);
      if (!values.name_en.trim() && !values.name_ar.trim()) return toast(ui("Enter at least one collection name.", "أدخل اسمًا واحدًا للمجموعة على الأقل."), "error");
      if (!selected.length) return toast(ui("Add at least one product variant.", "أضف اختيار منتج واحدًا على الأقل."), "error");
      const payload = { ...values, slug:values.slug || slugFromText(values.name_en || values.name_ar), is_active:values.is_active === "true", items:selected.map((item, index) => ({ product_id:Number(item.product_id), variant_id:item.variant_id === null || item.variant_id === undefined || item.variant_id === "" ? null : item.variant_id, sort_order:index })) };
      button.disabled = true;
      try { const saved = await api(isNew ? "/api/admin/collections" : `/api/admin/collections/${row.id || collectionId}`, { method:isNew ? "POST" : "PUT", body:JSON.stringify(payload) }); toast(isNew ? t("created") : t("updated")); state.rows.collections = null; location.hash = "collections"; return saved; } catch (error) { toast(error.message, "error"); button.disabled = false; }
    };
    renderSequence();
  }

  function openCollectionProductPicker(products, currentItems, onAdd) {
    let focusedId = Number(products.find(product => productVariants(product).length || product.is_active !== false)?.id || products[0]?.id || 0);
    const pending = new Map();
    const existing = new Set(currentItems.map(item => collectionItemKey(item.product_id, item.variant_id)));
    document.body.insertAdjacentHTML("beforeend", `<div class="modal-backdrop collection-picker-backdrop" id="collectionProductPicker"><div class="modal collection-picker-modal" role="dialog" aria-modal="true" aria-labelledby="collectionPickerTitle"><div class="modal-head"><div><h2 id="collectionPickerTitle">${ui("Add product variants", "إضافة اختيارات المنتجات")}</h2><p class="muted">${ui("Choose a product, then select one or more active variants.", "اختر منتجًا ثم حدد اختيارًا نشطًا أو أكثر.")}</p></div><button class="btn icon-btn" type="button" data-close-collection-picker aria-label="${t("close")}">×</button></div><div class="modal-body collection-picker-body"><div class="collection-picker-filters"><div class="field"><label>${ui("Search catalog", "بحث في الكتالوج")}</label><input id="collectionProductSearch" type="search" placeholder="${ui("Name or SKU", "الاسم أو SKU")}" /></div><div class="field"><label>${ui("Category", "التصنيف")}</label><select id="collectionCategoryFilter"><option value="">${ui("All categories", "كل التصنيفات")}</option>${[...new Set(products.map(product => product.category_slug).filter(Boolean))].sort().map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}</select></div></div><div class="collection-picker-columns"><section><div class="collection-picker-section-title"><strong>${ui("Products", "المنتجات")}</strong><span id="collectionProductResultCount"></span></div><div class="collection-product-grid" id="collectionProductGrid"></div></section><section class="collection-variant-panel"><div id="collectionVariantPanel"></div></section></div></div><div class="modal-foot"><span class="collection-picker-selection" id="collectionPendingCount"></span><button class="btn" type="button" data-close-collection-picker>${t("cancel")}</button><button class="btn primary" type="button" id="addCollectionSelection">${i("plus")}${ui("Add selected", "إضافة المحدد")}</button></div></div></div>`);
    const modal = document.getElementById("collectionProductPicker");
    const close = () => modal.remove();
    modal.querySelectorAll("[data-close-collection-picker]").forEach(button => button.onclick = close);
    const updatePending = () => { const count = modal.querySelector("#collectionPendingCount"); count.textContent = pending.size ? `${pending.size} ${ui("selected", "محدد")}` : ui("Nothing selected", "لا يوجد تحديد"); modal.querySelector("#addCollectionSelection").disabled = !pending.size; };
    const eligibleChoices = product => { const variants = productVariants(product); return variants.length ? variants.map(variant => ({ product_id:Number(product.id), variant_id:variant.id, product, variant })) : [{ product_id:Number(product.id), variant_id:null, product, variant:null }]; };
    const renderVariants = () => {
      const product = products.find(item => Number(item.id) === focusedId);
      const target = modal.querySelector("#collectionVariantPanel");
      if (!product) { target.innerHTML = `<div class="collection-picker-placeholder">${ui("Choose a product", "اختر منتجًا")}</div>`; return; }
      const choices = eligibleChoices(product);
      target.innerHTML = `<div class="collection-focused-product"><img src="${escapeHtml(collectionProductImage(product))}" alt="" /><div><small>#${product.id}</small><h3>${escapeHtml(collectionProductName(product))}</h3><span>${escapeHtml(product.sku || "—")}</span></div></div><div class="collection-variant-list">${choices.map(choice => { const key = collectionItemKey(choice.product_id, choice.variant_id); const unavailable = existing.has(key); const checked = pending.has(key); return `<button class="collection-variant-choice ${checked ? "is-selected" : ""}" type="button" data-pick-collection-variant="${escapeHtml(key)}" ${unavailable ? "disabled" : ""}><img src="${escapeHtml(collectionProductImage(product, choice.variant))}" alt="" /><span class="collection-variant-swatch" style="--variant-swatch:${escapeHtml(collectionSwatch(product, choice.variant))}"></span><span class="collection-variant-copy"><strong>${escapeHtml(collectionVariantLabel(choice.variant))}</strong><small>${escapeHtml(choice.variant?.sku || product.sku || "—")} · ${ui("Active", "نشط")}</small></span><strong>${bundleMoney(collectionVariantPrice(product, choice.variant))}</strong><span class="collection-check">${unavailable ? ui("Added", "مضاف") : checked ? i("check") : ""}</span></button>`; }).join("")}</div>`;
      target.querySelectorAll("[data-pick-collection-variant]").forEach(button => button.onclick = () => { const key = button.dataset.pickCollectionVariant; const choice = choices.find(item => collectionItemKey(item.product_id, item.variant_id) === key); pending.has(key) ? pending.delete(key) : pending.set(key, choice); renderVariants(); updatePending(); });
    };
    const renderProducts = () => {
      const search = modal.querySelector("#collectionProductSearch").value.trim().toLowerCase();
      const category = modal.querySelector("#collectionCategoryFilter").value;
      const filtered = products.filter(product => product.is_active !== false && product.isActive !== false).filter(product => !category || product.category_slug === category).filter(product => !search || [collectionProductName(product), product.name_en, product.name_ar, product.sku, product.id].join(" ").toLowerCase().includes(search));
      modal.querySelector("#collectionProductResultCount").textContent = `${filtered.length}`;
      modal.querySelector("#collectionProductGrid").innerHTML = filtered.length ? filtered.map(product => `<button class="collection-product-card ${Number(product.id) === focusedId ? "is-focused" : ""}" type="button" data-focus-collection-product="${product.id}"><img src="${escapeHtml(collectionProductImage(product))}" alt="" /><div><strong>${escapeHtml(collectionProductName(product))}</strong><span>${escapeHtml(product.sku || `#${product.id}`)}</span><small>${escapeHtml(product.category_slug || ui("Uncategorized", "بدون تصنيف"))} · ${productVariants(product).length || 1} ${ui("choices", "اختيارات")}</small></div></button>`).join("") : `<div class="collection-picker-placeholder">${ui("No products match this filter.", "لا توجد منتجات مطابقة.")}</div>`;
      modal.querySelectorAll("[data-focus-collection-product]").forEach(button => button.onclick = () => { focusedId = Number(button.dataset.focusCollectionProduct); renderProducts(); renderVariants(); });
    };
    modal.querySelector("#collectionProductSearch").addEventListener("input", renderProducts);
    modal.querySelector("#collectionCategoryFilter").addEventListener("change", renderProducts);
    modal.querySelector("#addCollectionSelection").onclick = () => { onAdd([...pending.values()]); close(); };
    renderProducts(); renderVariants(); updatePending();
    modal.querySelector("#collectionProductSearch").focus();
  }

  function reviewRows(payload) {
    return Array.isArray(payload) ? payload : payload?.reviews || payload?.items || payload?.data || [];
  }

  function recommendationRows(payload) {
    return Array.isArray(payload) ? payload : payload?.recommendations || payload?.items || payload?.data || [];
  }

  function reviewProduct(row = {}, products = []) {
    const id = Number(row.product_id || row.productId || row.product?.id || 0);
    return row.product || products.find(product => Number(product.id) === id) || { id };
  }

  function reviewCustomerName(row = {}) {
    return row.display_name || row.customer_name || row.reviewer_name || row.name || row.customer?.name || row.customer?.full_name || ui("Anonymous customer", "عميل بدون اسم");
  }

  function reviewStars(value, compact = false) {
    const rating = Math.max(0, Math.min(5, Number(value || 0)));
    return `<span class="review-stars ${compact ? "compact" : ""}" aria-label="${rating} ${ui("out of 5 stars", "من 5 نجوم")}">${[1,2,3,4,5].map(star => `<span class="${star <= rating ? "filled" : ""}">★</span>`).join("")}</span>`;
  }

  function reviewStatusLabel(status = "pending") {
    const labels = { pending:["Pending","قيد المراجعة"], published:["Published","منشور"], hidden:["Hidden","مخفي"], rejected:["Rejected","مرفوض"] };
    const value = labels[status] || [status,status];
    return state.lang === "ar" ? value[1] : value[0];
  }

  function reviewStatusClass(status = "pending") {
    return status === "published" ? "good" : status === "rejected" ? "bad" : status === "hidden" ? "empty" : "warn";
  }

  async function loadReviewProducts() {
    return state.rows.products?.length ? state.rows.products : loadResource("products").catch(() => []);
  }

  async function renderReviewsRecommendations(page) {
    const activeTab = state.reviewWorkspaceTab || "reviews";
    state.reviewWorkspaceTab = activeTab;
    const [reviewsPayload, recommendationsPayload, products] = await Promise.all([
      api("/api/admin/reviews?source=customer&limit=500").catch(() => ({ reviews: [] })),
      api("/api/admin/recommendations").catch(() => ({ recommendations: [] })),
      loadReviewProducts()
    ]);
    const reviews = reviewRows(reviewsPayload);
    const recommendations = recommendationRows(recommendationsPayload);
    const pending = reviews.filter(row => !row.status || row.status === "pending").length;
    const average = reviews.length ? reviews.reduce((sum,row) => sum + Number(row.rating || 0), 0) / reviews.length : 0;
    page.innerHTML = pageTitle("reviewsRecommendations", "", `<button class="btn primary" type="button" id="newRecommendation">${i("plus")}${ui("New store recommendation", "توصية متجر جديدة")}</button>`);
    page.innerHTML += `<section class="review-overview card"><div class="review-overview-copy"><span class="section-kicker">TRUST DESK</span><h2>${ui("Moderate feedback with product context", "راجع آراء العملاء مع سياق المنتج")}</h2><p>${ui("Customer reviews stay separate from transparent recommendations written by your store team.", "تظل تقييمات العملاء منفصلة بوضوح عن التوصيات التي يكتبها فريق المتجر.")}</p></div><div class="review-overview-metrics"><article><strong>${reviews.length}</strong><span>${ui("Customer reviews", "تقييم عميل")}</span></article><article class="attention"><strong>${pending}</strong><span>${ui("Awaiting review", "تنتظر المراجعة")}</span></article><article><strong>${average.toFixed(1)}</strong><span>${ui("Average rating", "متوسط التقييم")}</span></article><article><strong>${recommendations.filter(row => row.is_active !== false).length}</strong><span>${ui("Active store picks", "توصيات متجر نشطة")}</span></article></div></section>
      <div class="review-tabs" role="tablist"><button class="${activeTab === "reviews" ? "active" : ""}" data-review-tab="reviews" role="tab">${ui("Customer Reviews", "تقييمات العملاء")} <span>${reviews.length}</span></button><button class="${activeTab === "recommendations" ? "active" : ""}" data-review-tab="recommendations" role="tab">${ui("Store Recommendations", "توصيات المتجر")} <span>${recommendations.length}</span></button><button class="${activeTab === "social" ? "active" : ""}" data-review-tab="social" role="tab">${ui("Social Proof", "Social Proof")}</button></div>
      <div id="reviewWorkspace"></div>`;
    const workspace = document.getElementById("reviewWorkspace");
    document.querySelectorAll("[data-review-tab]").forEach(button => button.onclick = () => { state.reviewWorkspaceTab = button.dataset.reviewTab; renderReviewsRecommendations(page); });
    document.getElementById("newRecommendation").onclick = () => { location.hash = "recommendationEditor/new"; };
    if (activeTab === "recommendations") renderRecommendationsWorkspace(workspace, recommendations, products);
    else if (activeTab === "social") renderSocialProofWorkspace(workspace, products);
    else renderCustomerReviewsWorkspace(workspace, reviews, products);
  }

  function renderCustomerReviewsWorkspace(target, reviews, products) {
    let selectedProductId = "";
    const statusCount = status => reviews.filter(row => (row.status || "pending") === status).length;
    target.innerHTML = `<section class="card review-workspace-card"><div class="review-filter-head"><div><h2>${ui("Moderation queue", "قائمة المراجعة")}</h2><p>${ui("Choose a product, review every status, then publish, hide, or reject feedback.", "اختر منتجًا واعرض كل حالاته، ثم انشر التقييم أو أخفه أو ارفضه.")}</p></div><span class="pill" id="reviewMatchCount"></span></div><div class="review-filters"><div class="field"><label>${ui("Search", "بحث")}</label><input id="reviewSearch" type="search" placeholder="${ui("Customer, product or comment", "العميل أو المنتج أو التعليق")}" /></div><div class="field"><label>${ui("Status", "الحالة")}</label><select id="reviewStatusFilter"><option value="">${ui("All statuses", "كل الحالات")} (${reviews.length})</option>${["pending","published","hidden","rejected"].map(status => `<option value="${status}">${reviewStatusLabel(status)} (${statusCount(status)})</option>`).join("")}</select></div><div class="field"><label>${ui("Rating", "التقييم")}</label><select id="reviewRatingFilter"><option value="">${ui("All ratings", "كل التقييمات")}</option>${[5,4,3,2,1].map(rating => `<option value="${rating}">${rating} ★</option>`).join("")}</select></div><div class="field review-product-filter-field"><label>${ui("Product", "المنتج")}</label><div id="reviewSelectedProductFilter" class="review-selected-product-filter"></div></div></div><div id="reviewQueue"></div></section>`;
    const drawProductFilter = () => {
      const selected = products.find(product => Number(product.id) === Number(selectedProductId));
      document.getElementById("reviewSelectedProductFilter").innerHTML = selected ? `<button class="review-product-filter-button selected" type="button" id="chooseReviewProduct"><img src="${escapeHtml(collectionProductImage(selected))}" alt="" /><span><strong>${escapeHtml(collectionProductName(selected))}</strong><small>${escapeHtml(selected.sku || `#${selected.id}`)}</small></span>${i("chevron-down")}</button><button class="btn icon-btn review-product-filter-clear" type="button" id="clearReviewProduct" title="${ui("Show all products", "عرض كل المنتجات")}">${i("x")}</button>` : `<button class="review-product-filter-button" type="button" id="chooseReviewProduct">${i("box")}<span><strong>${ui("All products", "كل المنتجات")}</strong><small>${ui("Choose from catalog", "اختر من كتالوج المنتجات")}</small></span>${i("chevron-down")}</button>`;
      document.getElementById("chooseReviewProduct").onclick = () => openReviewProductPicker(products, selectedProductId, product => { selectedProductId = String(product.id); drawProductFilter(); draw(); });
      document.getElementById("clearReviewProduct")?.addEventListener("click", () => { selectedProductId = ""; drawProductFilter(); draw(); });
    };
    const draw = () => {
      const q = document.getElementById("reviewSearch").value.trim().toLowerCase();
      const status = document.getElementById("reviewStatusFilter").value;
      const rating = document.getElementById("reviewRatingFilter").value;
      const productId = selectedProductId;
      const rows = reviews.filter(row => { const product = reviewProduct(row, products); const haystack = [reviewCustomerName(row), collectionProductName(product), row.comment, row.body, row.title].join(" ").toLowerCase(); return (!q || haystack.includes(q)) && (!status || (row.status || "pending") === status) && (!rating || Number(row.rating) === Number(rating)) && (!productId || Number(product.id) === Number(productId)); });
      document.getElementById("reviewMatchCount").textContent = `${rows.length} ${ui("results", "نتيجة")}`;
      document.getElementById("reviewQueue").innerHTML = rows.length ? `<div class="review-queue">${rows.map(row => { const product = reviewProduct(row, products); const comment = row.comment || row.body || row.content || ""; const visible=row.status === "published"; return `<article class="review-row"><div class="review-product-context"><img src="${escapeHtml(collectionProductImage(product))}" alt="" /><div><strong>${escapeHtml(collectionProductName(product) || ui("Unknown product", "منتج غير معروف"))}</strong><span>${escapeHtml(product.sku || `#${product.id || row.product_id}`)}</span></div></div><div class="review-message"><div class="review-message-head"><strong>${escapeHtml(reviewCustomerName(row))}</strong>${row.verified_purchase || row.is_verified_purchase ? `<span class="verified-review">${i("check")}${ui("Verified purchase", "شراء موثق")}</span>` : ""}<span class="status-pill ${reviewStatusClass(row.status)}">${reviewStatusLabel(row.status)}</span></div>${reviewStars(row.rating)}<p>${escapeHtml(comment || ui("No written comment", "بدون تعليق مكتوب"))}</p><small>${formatDateTime(row.created_at || row.createdAt)}</small></div><div class="review-actions">${!visible ? `<button class="btn primary review-publish-button" data-review-status="published" data-review-id="${row.id}">${i("check")}${ui("Approve & publish", "موافقة ونشر")}</button>` : ""}<label class="review-visibility-label"><span>${visible?ui("Visible", "ظاهر"):ui("Not published", "غير منشور")}</span><span data-review-visibility="${row.id}" data-visible="${visible}">${switchButton({field:`review_visible_${row.id}`,value:visible,label:false})}</span></label>${row.status !== "rejected" ? `<button class="btn" data-review-status="rejected" data-review-id="${row.id}">${ui("Reject", "رفض")}</button>` : ""}<button class="btn icon-btn danger" data-delete-review="${row.id}" title="${t("delete")}">${i("trash")}</button></div></article>`; }).join("")}</div>` : `<div class="review-empty">${i("message")}<h3>${ui("No reviews match these filters", "لا توجد تقييمات مطابقة")}</h3><p>${ui("Try another product, status, or search term.", "جرّب منتجًا أو حالة أو عبارة بحث أخرى.")}</p></div>`;
      document.querySelectorAll("[data-review-visibility]").forEach(wrapper => wrapper.querySelector("[data-form-switch]").onclick = async event => { const button=event.currentTarget; const next=button.dataset.switchValue !== "true"; button.disabled=true; try { await api(`/api/admin/reviews/${wrapper.dataset.reviewVisibility}`, { method:"PATCH", body:JSON.stringify({ status:next?"published":"hidden" }) }); toast(next?ui("Review is now visible", "أصبح التقييم ظاهرًا"):ui("Review is now hidden", "تم إخفاء التقييم")); renderReviewsRecommendations(document.getElementById("page")); } catch(error) { toast(error.message,"error"); button.disabled=false; } });
      document.querySelectorAll("[data-review-status]").forEach(button => button.onclick = async () => { button.disabled = true; try { await api(`/api/admin/reviews/${button.dataset.reviewId}`, { method:"PATCH", body:JSON.stringify({ status:button.dataset.reviewStatus }) }); toast(ui("Review status updated", "تم تحديث حالة التقييم")); renderReviewsRecommendations(document.getElementById("page")); } catch (error) { toast(error.message,"error"); button.disabled = false; } });
      document.querySelectorAll("[data-delete-review]").forEach(button => button.onclick = async () => { if (!confirm(ui("Delete this customer review?", "حذف تقييم العميل؟"))) return; try { await api(`/api/admin/reviews/${button.dataset.deleteReview}`, { method:"DELETE" }); toast(t("deleted")); renderReviewsRecommendations(document.getElementById("page")); } catch (error) { toast(error.message,"error"); } });
    };
    ["reviewSearch","reviewStatusFilter","reviewRatingFilter"].forEach(id => document.getElementById(id).addEventListener(id === "reviewSearch" ? "input" : "change", draw));
    drawProductFilter();
    draw();
  }

  function renderRecommendationsWorkspace(target, recommendations, products) {
    target.innerHTML = `<section class="card review-workspace-card"><div class="review-filter-head"><div><h2>${ui("Store team recommendations", "توصيات فريق المتجر")}</h2><p>${ui("Editorial recommendations are labeled as store-authored everywhere customers see them.", "تظهر هذه التوصيات للعملاء بوضوح على أنها مكتوبة بواسطة فريق المتجر.")}</p></div><button class="btn primary" id="addStoreRecommendation">${i("plus")}${ui("Add recommendation", "إضافة توصية")}</button></div><div class="recommendation-grid">${recommendations.length ? recommendations.map(row => { const product = reviewProduct(row, products); const author = state.lang === "ar" ? row.author_name_ar : row.author_name_en; return `<article class="recommendation-card"><div class="store-authored-label">${i("star")}${ui("STORE TEAM RECOMMENDATION", "توصية فريق المتجر")}</div><div class="recommendation-product"><img src="${escapeHtml(collectionProductImage(product))}" alt="" /><div><strong>${escapeHtml(collectionProductName(product))}</strong><span>${escapeHtml(product.sku || `#${product.id || row.product_id}`)}</span></div></div>${reviewStars(row.rating)}<p>${escapeHtml((state.lang === "ar" ? row.body_ar : row.body_en) || row.body_ar || row.body_en || "")}</p><div class="recommendation-author"><span>${escapeHtml(author || row.author_name_ar || row.author_name_en || ui("Store Team", "فريق المتجر"))}</span>${row.is_featured ? `<span class="status-pill info">${ui("Featured", "مميزة")}</span>` : ""}</div><div class="recommendation-card-actions"><div data-recommendation-toggle="${row.id}"><input type="hidden" name="recommendation_active" value="${row.is_active !== false}" />${switchButton({ field:"recommendation_active", value:row.is_active !== false, label:false })}</div><button class="btn" data-edit-recommendation="${row.id}">${i("edit")}${t("edit")}</button><button class="btn icon-btn danger" data-delete-recommendation="${row.id}" title="${t("delete")}">${i("trash")}</button></div></article>`; }).join("") : `<div class="review-empty full">${i("star")}<h3>${ui("No store recommendations yet", "لا توجد توصيات متجر بعد")}</h3><p>${ui("Author transparent editorial picks for products your team wants to highlight.", "أضف توصيات تحريرية واضحة للمنتجات التي يريد فريقك إبرازها.")}</p></div>`}</div></section>`;
    document.getElementById("addStoreRecommendation").onclick = () => { location.hash = "recommendationEditor/new"; };
    document.querySelectorAll("[data-edit-recommendation]").forEach(button => button.onclick = () => { location.hash = `recommendationEditor/${button.dataset.editRecommendation}`; });
    document.querySelectorAll("[data-recommendation-toggle]").forEach(wrapper => wrapper.querySelector("[data-form-switch]").onclick = async event => { const button = event.currentTarget; const next = button.dataset.switchValue !== "true"; try { await api(`/api/admin/recommendations/${wrapper.dataset.recommendationToggle}`, { method:"PUT", body:JSON.stringify({ is_active:next }) }); updateFormSwitch(button); toast(t("updated")); } catch (error) { toast(error.message,"error"); } });
    document.querySelectorAll("[data-delete-recommendation]").forEach(button => button.onclick = async () => { if (!confirm(ui("Delete this store recommendation?", "حذف توصية المتجر؟"))) return; try { await api(`/api/admin/recommendations/${button.dataset.deleteRecommendation}`, { method:"DELETE" }); toast(t("deleted")); renderReviewsRecommendations(document.getElementById("page")); } catch (error) { toast(error.message,"error"); } });
  }

  function openReviewProductPicker(products, selectedId, onSelect) {
    document.body.insertAdjacentHTML("beforeend", `<div class="modal-backdrop review-product-picker-backdrop"><div class="modal review-product-picker" role="dialog" aria-modal="true" aria-labelledby="reviewProductPickerTitle"><div class="modal-head"><div><h2 id="reviewProductPickerTitle">${ui("Choose a product", "اختر منتجًا")}</h2><p>${ui("Search by product name or code.", "ابحث باسم المنتج أو الكود.")}</p></div><button class="btn icon-btn" type="button" data-close-review-picker aria-label="${t("close")}">×</button></div><div class="modal-body"><div class="field sticky-picker-search"><label>${ui("Search catalog", "بحث في الكتالوج")}</label><input id="reviewProductPickerSearch" type="search" placeholder="${ui("Product name or SKU", "اسم المنتج أو SKU")}" /></div><div class="review-product-picker-grid" id="reviewProductPickerGrid"></div></div><div class="modal-foot"><button class="btn" type="button" data-close-review-picker>${t("cancel")}</button></div></div></div>`);
    const backdrop = document.querySelector(".review-product-picker-backdrop");
    const close = () => backdrop.remove();
    backdrop.querySelectorAll("[data-close-review-picker]").forEach(button => button.onclick = close);
    const draw = () => { const q = backdrop.querySelector("#reviewProductPickerSearch").value.trim().toLowerCase(); const rows = products.filter(product => !q || [collectionProductName(product),product.name_en,product.name_ar,product.sku,product.id].join(" ").toLowerCase().includes(q)); backdrop.querySelector("#reviewProductPickerGrid").innerHTML = rows.length ? rows.map(product => `<button class="review-picker-product ${Number(product.id) === Number(selectedId) ? "selected" : ""}" type="button" data-pick-review-product="${product.id}"><img src="${escapeHtml(collectionProductImage(product))}" alt="" /><div><strong>${escapeHtml(collectionProductName(product))}</strong><span>${escapeHtml(product.sku || `#${product.id}`)}</span><small>${escapeHtml(product.category_slug || ui("Uncategorized", "بدون تصنيف"))}</small></div>${Number(product.id) === Number(selectedId) ? i("check") : ""}</button>`).join("") : `<div class="review-empty full">${ui("No matching products", "لا توجد منتجات مطابقة")}</div>`; backdrop.querySelectorAll("[data-pick-review-product]").forEach(button => button.onclick = () => { const product = products.find(row => Number(row.id) === Number(button.dataset.pickReviewProduct)); onSelect(product); close(); }); };
    backdrop.querySelector("#reviewProductPickerSearch").oninput = draw;
    draw(); backdrop.querySelector("#reviewProductPickerSearch").focus();
  }

  async function renderRecommendationEditor(page, recommendationId) {
    const [payload, products] = await Promise.all([api("/api/admin/recommendations").catch(() => []), loadReviewProducts()]);
    const isNew = !recommendationId || recommendationId === "new";
    const row = isNew ? {} : recommendationRows(payload).find(item => String(item.id) === String(recommendationId)) || {};
    let selectedProduct = reviewProduct(row, products);
    if (!selectedProduct?.id) selectedProduct = null;
    const redrawProduct = () => { const target = document.getElementById("recommendationSelectedProduct"); target.innerHTML = selectedProduct?.id ? `<img src="${escapeHtml(collectionProductImage(selectedProduct))}" alt="" /><div><strong>${escapeHtml(collectionProductName(selectedProduct))}</strong><span>${escapeHtml(selectedProduct.sku || `#${selectedProduct.id}`)}</span></div><button class="btn" type="button" id="changeRecommendationProduct">${ui("Change", "تغيير")}</button>` : `<div class="recommendation-product-empty">${i("box")}<div><strong>${ui("No product selected", "لم يتم اختيار منتج")}</strong><span>${ui("Choose the product this editorial recommendation belongs to.", "اختر المنتج الذي تنتمي إليه توصية المتجر.")}</span></div></div><button class="btn primary" type="button" id="changeRecommendationProduct">${ui("Choose product", "اختيار منتج")}</button>`; document.getElementById("changeRecommendationProduct").onclick = () => openReviewProductPicker(products, selectedProduct?.id, product => { selectedProduct = product; redrawProduct(); }); };
    page.innerHTML = `<div class="recommendation-editor-head"><div><button class="btn back-link" type="button" id="backToReviews">${i("arrow-left")}${ui("Back to reviews", "العودة للتقييمات")}</button><span class="section-kicker">EDITORIAL</span><h1>${isNew ? ui("New store recommendation", "توصية متجر جديدة") : ui("Edit store recommendation", "تعديل توصية المتجر")}</h1><p>${ui("This content will be explicitly labeled as a Store Team Recommendation.", "سيظهر هذا المحتوى بوضوح على أنه توصية من فريق المتجر.")}</p></div><button class="btn primary" type="submit" form="recommendationForm">${i("check")}${t("save")}</button></div><form id="recommendationForm" class="recommendation-editor-layout"><main><section class="card card-pad"><div class="store-authored-notice">${i("star")}<div><strong>${ui("Store-authored content", "محتوى مكتوب بواسطة المتجر")}</strong><p>${ui("It is never presented as a customer review or verified purchase.", "لا يتم عرضه أبدًا كتقييم عميل أو عملية شراء موثقة.")}</p></div></div><div id="recommendationSelectedProduct" class="recommendation-selected-product"></div></section><section class="card card-pad"><div class="studio-card-head"><span class="section-kicker">COPY</span><div><h2>${ui("Recommendation content", "محتوى التوصية")}</h2><p>${ui("Write useful product guidance in both storefront languages.", "اكتب إرشادًا مفيدًا للمنتج بلغتي المتجر.")}</p></div></div><div class="form-grid"><div class="field"><label>${ui("Author name", "اسم الكاتب")}</label><input name="author_name" value="${escapeHtml((state.lang === "ar" ? row.author_name_ar : row.author_name_en) || row.author_name_ar || row.author_name_en || "")}" placeholder="${ui("Store Team (default)", "فريق المتجر (افتراضي)")}" /><small>${ui("Leave empty to display Store Team.", "اتركه فارغًا ليظهر فريق المتجر.")}</small></div><div class="field"><label>${ui("Rating", "التقييم")}</label><select name="rating">${[5,4,3,2,1].map(value => `<option value="${value}" ${Number(row.rating || 5) === value ? "selected" : ""}>${value} / 5</option>`).join("")}</select></div><div class="field full"><label>${ui("English recommendation", "التوصية بالإنجليزية")}</label><textarea name="body_en">${escapeHtml(row.body_en || "")}</textarea></div><div class="field full"><label>${ui("Arabic recommendation", "التوصية بالعربية")}</label><textarea name="body_ar" dir="rtl">${escapeHtml(row.body_ar || "")}</textarea></div></div></section></main><aside><section class="card card-pad"><span class="section-kicker">DISPLAY</span><div class="editor-toggle-row"><div><strong>${ui("Active", "نشطة")}</strong><small>${ui("Visible on the product page", "ظاهرة في صفحة المنتج")}</small></div><input type="hidden" name="is_active" value="${row.is_active !== false}" />${switchButton({ field:"is_active", value:row.is_active !== false, label:false })}</div><div class="editor-toggle-row"><div><strong>${ui("Featured", "مميزة")}</strong><small>${ui("Place before regular store picks", "تظهر قبل التوصيات العادية")}</small></div><input type="hidden" name="is_featured" value="${row.is_featured === true}" />${switchButton({ field:"is_featured", value:row.is_featured === true, label:false })}</div><div class="field"><label>${ui("Display order", "ترتيب العرض")}</label><input name="sort_order" type="number" min="0" value="${Number(row.sort_order || 0)}" /></div></section></aside></form>`;
    redrawProduct();
    document.getElementById("backToReviews").onclick = () => { state.reviewWorkspaceTab = "recommendations"; location.hash = "reviewsRecommendations"; };
    document.querySelectorAll("#recommendationForm [data-form-switch]").forEach(button => button.onclick = () => updateFormSwitch(button));
    document.getElementById("recommendationForm").onsubmit = async event => { event.preventDefault(); if (!selectedProduct?.id) return toast(ui("Choose a product first", "اختر منتجًا أولًا"), "error"); const data = Object.fromEntries(new FormData(event.currentTarget)); const body = { product_id:Number(selectedProduct.id), author_name:data.author_name.trim(), rating:Number(data.rating), body_en:data.body_en, body_ar:data.body_ar, is_active:data.is_active === "true", is_featured:data.is_featured === "true", sort_order:Number(data.sort_order || 0) }; const button = document.querySelector('[type="submit"][form="recommendationForm"]'); button.disabled = true; try { await api(isNew ? "/api/admin/recommendations" : `/api/admin/recommendations/${row.id}`, { method:isNew ? "POST" : "PUT", body:JSON.stringify(body) }); toast(isNew ? t("created") : t("updated")); state.reviewWorkspaceTab = "recommendations"; location.hash = "reviewsRecommendations"; } catch (error) { toast(error.message,"error"); button.disabled = false; } };
  }

  async function renderSocialProofWorkspace(target, products) {
    let selectedProduct = products.find(product => Number(product.id) === Number(state.socialProofProductId)) || null;
    target.innerHTML = `<section class="social-proof-layout"><aside class="card social-proof-product-panel"><div class="review-filter-head"><div><h2>${ui("Product", "المنتج")}</h2><p>${ui("Choose one product to inspect its live proof settings.", "اختر منتجًا لمراجعة إعدادات الثقة الخاصة به.")}</p></div></div><button class="social-proof-product-select" id="selectSocialProofProduct" type="button"></button></aside><main class="card card-pad" id="socialProofSettings"></main></section>`;
    const drawSelected = () => { const button = document.getElementById("selectSocialProofProduct"); button.innerHTML = selectedProduct ? `<img src="${escapeHtml(collectionProductImage(selectedProduct))}" alt="" /><div><strong>${escapeHtml(collectionProductName(selectedProduct))}</strong><span>${escapeHtml(selectedProduct.sku || `#${selectedProduct.id}`)}</span><small>${ui("Change product", "تغيير المنتج")}</small></div>${i("edit")}` : `${i("box")}<div><strong>${ui("Choose a product", "اختر منتجًا")}</strong><span>${ui("Search the catalog by name or code", "ابحث في الكتالوج بالاسم أو الكود")}</span></div>${i("plus")}`; button.onclick = () => openReviewProductPicker(products, selectedProduct?.id, product => { selectedProduct = product; state.socialProofProductId = product.id; drawSelected(); loadSettings(); }); };
    const loadSettings = async () => { const panel = document.getElementById("socialProofSettings"); if (!selectedProduct) { panel.innerHTML = `<div class="review-empty">${i("star")}<h3>${ui("Select a product to continue", "اختر منتجًا للمتابعة")}</h3><p>${ui("Settings and verified sales totals will appear here.", "ستظهر هنا الإعدادات وإجماليات المبيعات الموثقة.")}</p></div>`; return; } panel.innerHTML = `<div class="review-loading">${i("refresh")} ${ui("Loading product settings…", "جاري تحميل إعدادات المنتج…")}</div>`; try { const response = await api(`/api/admin/products/${selectedProduct.id}/social-proof`); const settings = response.settings || response.social_proof || response; const sales = response.sales || settings.sales || {}; panel.innerHTML = `<div class="studio-card-head"><span class="section-kicker">SOCIAL PROOF</span><div><h2>${escapeHtml(collectionProductName(selectedProduct))}</h2><p>${ui("Control review visibility and verified sales messaging.", "تحكم في ظهور التقييمات ورسائل المبيعات الموثقة.")}</p></div></div><form id="socialProofForm"><div class="social-proof-switches">${[["reviews_enabled",ui("Reviews enabled", "التقييمات مفعلة"),ui("Show existing approved reviews", "عرض التقييمات المقبولة")],["accepting_reviews",ui("Accept new reviews", "قبول تقييمات جديدة"),ui("Allow customers to submit feedback", "السماح للعملاء بإرسال تقييم")],["show_rating_summary",ui("Show rating summary", "عرض ملخص التقييم"),ui("Average stars and review count", "متوسط النجوم وعدد التقييمات")],["show_sales",ui("Show sales proof", "عرض دليل المبيعات"),ui("Uses actual plus verified imported history", "يستخدم الفعلي مع السجل المستورد الموثق")]].map(([name,label,hint]) => `<div class="editor-toggle-row"><div><strong>${label}</strong><small>${hint}</small></div><input type="hidden" name="${name}" value="${settings[name] !== false}" />${switchButton({ field:name, value:settings[name] !== false, label:false })}</div>`).join("")}</div><div class="social-proof-sales-head"><div><h3>${ui("Sales display", "عرض المبيعات")}</h3><p>${ui("Only completed real orders and documented historical sales belong here.", "يُسمح هنا فقط بالطلبات الحقيقية المكتملة والمبيعات التاريخية الموثقة.")}</p></div></div><div class="sales-breakdown"><article><span>${ui("Actual sales", "المبيعات الفعلية")}</span><strong>${Number(sales.actual_units_sold ?? 0)}</strong><small>${ui("Calculated by API", "محسوبة من النظام")}</small></article><span>+</span><article><span>${ui("Verified iMile history", "سجل iMile الموثق")}</span><strong>${Number(sales.verified_legacy_units_sold ?? 0)}</strong><small>${ui("Delivered SKU matches", "مطابقة SKU المسلمة")}</small></article><span>+</span><article><span>${ui("Manual history", "السجل اليدوي")}</span><strong>${Number(sales.imported_historical_sales ?? settings.imported_historical_sales ?? 0)}</strong><small>${ui("Documented entry", "إدخال موثق")}</small></article><span>=</span><article class="displayed"><span>${ui("Displayed total", "الإجمالي المعروض")}</span><strong>${Number(sales.displayed_units_sold ?? 0)}</strong><small>${ui("Customer-facing", "يظهر للعميل")}</small></article></div><div class="form-grid"><div class="field"><label>${ui("Sales display mode", "طريقة عرض المبيعات")}</label><select name="sales_display_mode"><option value="exact" ${settings.sales_display_mode === "exact" ? "selected" : ""}>${ui("Exact number", "رقم دقيق")}</option><option value="threshold" ${settings.sales_display_mode === "threshold" ? "selected" : ""}>${ui("More than threshold", "أكثر من الحد")}</option><option value="hidden" ${settings.sales_display_mode === "hidden" ? "selected" : ""}>${ui("Hidden", "مخفي")}</option></select></div><div class="field"><label>${ui("Display threshold", "حد الظهور")}</label><input name="sales_threshold" type="number" min="1" value="${Number(settings.sales_threshold || 10)}" /></div><div class="field"><label>${ui("Imported historical sales", "مبيعات تاريخية مستوردة")}</label><input name="imported_historical_sales" type="number" min="0" value="${Number(settings.imported_historical_sales ?? sales.imported_historical_sales ?? 0)}" /></div><div class="field"><label>${ui("Historical source", "مصدر السجل")}</label><input name="imported_source" value="${escapeHtml(settings.imported_source || "")}" placeholder="${ui("Legacy store export, invoice archive…", "تصدير المتجر القديم، أرشيف الفواتير…")}" /></div><div class="field full"><label>${ui("Internal note", "ملاحظة داخلية")}</label><textarea name="imported_note">${escapeHtml(settings.imported_note || "")}</textarea></div></div><div class="historical-sales-warning">${i("file")}<div><strong>${ui("Real historical sales only", "مبيعات تاريخية حقيقية فقط")}</strong><p>${ui("Enter a value only when it can be supported by an old store export, invoice record, or another verifiable source.", "أدخل رقمًا فقط عندما يكون مدعومًا بتصدير متجر قديم أو سجل فواتير أو مصدر قابل للتحقق.")}</p></div></div><div class="social-proof-actions"><button class="btn primary" type="submit">${i("check")}${ui("Save social proof", "حفظ Social Proof")}</button></div></form>`; panel.querySelectorAll("[data-form-switch]").forEach(button => button.onclick = () => updateFormSwitch(button)); panel.querySelector("#socialProofForm").onsubmit = async event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); const body = { reviews_enabled:data.reviews_enabled === "true", accepting_reviews:data.accepting_reviews === "true", show_rating_summary:data.show_rating_summary === "true", show_sales:data.show_sales === "true", sales_display_mode:data.sales_display_mode, sales_threshold:Number(data.sales_threshold || 10), imported_historical_sales:Number(data.imported_historical_sales || 0), imported_source:data.imported_source, imported_note:data.imported_note }; const button = event.currentTarget.querySelector('[type="submit"]'); button.disabled = true; try { await api(`/api/admin/products/${selectedProduct.id}/social-proof`, { method:"PUT", body:JSON.stringify(body) }); toast(t("updated")); loadSettings(); } catch (error) { toast(error.message,"error"); button.disabled = false; } }; } catch (error) { panel.innerHTML = `<div class="review-empty"><h3>${ui("Could not load these settings", "تعذر تحميل الإعدادات")}</h3><p>${escapeHtml(error.message)}</p><button class="btn" id="retrySocialProof">${ui("Try again", "إعادة المحاولة")}</button></div>`; document.getElementById("retrySocialProof").onclick = loadSettings; } };
    drawSelected(); loadSettings();
  }

  async function renderBundles(page) {
    const [bundles] = await Promise.all([loadResource("bundles"), state.rows.products?.length ? Promise.resolve(state.rows.products) : loadResource("products")]);
    const activeCount = bundles.filter(bundle => bundle.is_active !== false).length;
    page.innerHTML = pageTitle("bundles", "bundlesSub", `<button class="btn primary" id="addBundleBtn">${i("plus")}${ui("Create bundle", "إنشاء بندل")}</button>`);
    page.innerHTML += `<div class="bundle-stats"><div><span>${ui("Total bundles", "إجمالي البندلز")}</span><strong>${bundles.length}</strong></div><div><span>${ui("Active", "نشط")}</span><strong>${activeCount}</strong></div><div><span>${ui("Products included", "المنتجات المضافة")}</span><strong>${bundles.reduce((sum,bundle)=>sum+Number(bundle.item_count||0),0)}</strong></div></div><div class="bundle-admin-grid">${bundles.length?bundles.map(bundleAdminCard).join(""):`<div class="card card-pad empty-discount"><div class="empty-illustration">${i("layers")}</div><h2>${ui("No bundles yet", "لا توجد بندلز بعد")}</h2><p class="muted">${t("bundlesSub")}</p></div>`}</div>`;
    document.getElementById("addBundleBtn").onclick=()=>openBundleEditor();
    document.querySelectorAll("[data-edit-bundle]").forEach(btn=>btn.onclick=()=>openBundleEditor(bundles.find(bundle=>String(bundle.id)===btn.dataset.editBundle)));
    document.querySelectorAll("[data-delete-bundle]").forEach(btn=>btn.onclick=()=>deleteRow("bundles",btn.dataset.deleteBundle));
    document.querySelectorAll("[data-toggle-bundle]").forEach(btn=>btn.onclick=()=>toggleRowStatus("bundles",btn.dataset.toggleBundle,"is_active",btn.dataset.statusValue!=="true"));
  }

  function bundleAdminCard(bundle = {}) {
    const items = Array.isArray(bundle.items) ? bundle.items : [];
    const saving = Math.max(0, Number(bundle.regular_total||0)-Number(bundle.price||0));
    const visual = bundle.main_photo_url ? `<img src="${escapeHtml(bundle.main_photo_url)}" alt="" />` : `<div class="bundle-auto-cover">${items.slice(0,3).map((item,index)=>`${index?`<b>+</b>`:""}<img src="${escapeHtml(item.image_url||"")}" alt="" />`).join("")}</div>`;
    return `<article class="bundle-admin-card"><div class="bundle-admin-cover">${visual}<span class="bundle-count-pill">${Number(bundle.item_count||items.length)} ${ui("items", "قطع")}</span></div><div class="bundle-admin-body"><div class="bundle-admin-title"><div><span>#${bundle.id}</span><h2>${escapeHtml(state.lang==="ar"?(bundle.name_ar||bundle.name_en):(bundle.name_en||bundle.name_ar))}</h2></div><div data-toggle-bundle="${bundle.id}" data-status-value="${bundle.is_active!==false}">${switchButton({field:"bundle_active",value:bundle.is_active!==false,id:"",label:false})}</div></div><div class="bundle-admin-products">${items.slice(0,4).map(item=>`<span><img src="${escapeHtml(item.image_url||"")}" alt="" />${escapeHtml(state.lang==="ar"?item.name_ar:item.name_en)}</span>`).join("")}</div><div class="bundle-price-row"><div><small>${ui("Products total", "مجموع المنتجات")}</small><del>${bundleMoney(bundle.regular_total||0)}</del></div><div><small>${ui("Bundle price", "سعر البندل")}</small><strong>${bundleMoney(bundle.price||0)}</strong></div>${saving?`<span>${ui("Save", "توفير")} ${bundleMoney(saving)}</span>`:""}</div><div class="bundle-card-actions"><button class="btn" type="button" data-edit-bundle="${bundle.id}">${i("edit")}${t("edit")}</button><button class="btn icon-btn danger" type="button" data-delete-bundle="${bundle.id}" title="${t("delete")}">${i("trash")}</button></div></div></article>`;
  }

  async function openBundleEditor(row = {}) {
    const products = state.rows.products?.length ? state.rows.products : await loadResource("products");
    const selected = new Map((Array.isArray(row.items)?row.items:[]).map(item=>[Number(item.product_id||item.id),Math.max(1,Number(item.quantity||1))]));
    document.body.insertAdjacentHTML("beforeend",`<div class="modal-backdrop" id="bundleModal"><form class="modal bundle-editor-modal" id="bundleForm"><div class="modal-head"><div><h2>${row.id?ui("Edit bundle", "تعديل البندل"):ui("Create bundle", "إنشاء بندل جديد")}</h2><p class="muted">${t("bundlesSub")}</p></div><button class="btn icon-btn" type="button" data-close-bundle>×</button></div><div class="modal-body bundle-editor-body"><section class="bundle-editor-form"><div class="section-kicker">01</div><h3>${ui("Bundle identity", "بيانات البندل")}</h3><div class="form-grid">${labeledField("name_en",ui("English name", "الاسم بالإنجليزية"),row.name_en||"", "text")}${labeledField("name_ar",ui("Arabic name", "الاسم بالعربية"),row.name_ar||"", "text")}${labeledField("slug",ui("Slug", "الرابط المختصر"),row.slug||"")}<div class="field"><label>${t("active")}</label><input type="hidden" name="is_active" value="${row.is_active!==false}" />${switchButton({field:"is_active",value:row.is_active!==false})}</div></div>${imageUploadField("main_photo_url",ui("Optional bundle cover", "صورة البندل الاختيارية"),row.main_photo_url||"")}<div class="form-grid"><div class="field full"><label>${ui("English description", "الوصف بالإنجليزية")}</label><textarea name="description_en">${escapeHtml(row.description_en||"")}</textarea></div><div class="field full"><label>${ui("Arabic description", "الوصف بالعربية")}</label><textarea name="description_ar">${escapeHtml(row.description_ar||"")}</textarea></div></div></section><section class="bundle-editor-form"><div class="section-kicker">02</div><div class="bundle-section-head"><div><h3>${ui("Choose products", "اختيار المنتجات")}</h3><p>${ui("Select at least two products and set the quantity of each.", "اختر منتجين على الأقل وحدد كمية كل منتج.")}</p></div><span id="bundleSelectedCount">0</span></div><div class="bundle-product-picker">${products.map(product=>bundlePickerCard(product,selected)).join("")}</div></section><section class="bundle-editor-form"><div class="section-kicker">03</div><h3>${ui("Price and inventory", "السعر والمخزون")}</h3><div class="form-grid">${labeledField("price",ui("Final bundle price", "السعر النهائي للبندل"),row.price||0,"number")}${labeledField("compare_at_price",ui("Before discount", "السعر قبل الخصم"),row.compare_at_price||row.regular_total||0,"number")}${labeledField("cost",ui("Bundle cost", "تكلفة البندل"),row.cost||0,"number")}<div class="field full bundle-stock-mode"><label>${ui("Independent bundle inventory", "مخزون مستقل للبندل")}</label><input type="hidden" name="use_own_stock" value="${row.use_own_stock===true}" />${switchButton({field:"use_own_stock",value:row.use_own_stock===true})}<small>${ui("Off: availability is calculated from the selected products.", "غير مفعل: المتاح يُحسب تلقائيًا من مخزون المنتجات المختارة.")}</small></div><div class="field" data-own-bundle-stock><label>${ui("Bundle stock", "مخزون البندل")}</label><input name="stock" type="number" min="0" value="${row.stock??""}" /></div></div><div class="bundle-live-summary" id="bundleLiveSummary"></div></section></div><div class="modal-foot"><button class="btn" type="button" data-close-bundle>${t("cancel")}</button><button class="btn primary" type="submit">${t("save")}</button></div></form></div>`);
    const modal=document.getElementById("bundleModal");
    const form=document.getElementById("bundleForm");
    const close=()=>modal?.remove();
    document.querySelectorAll("[data-close-bundle]").forEach(btn=>btn.onclick=close);
    document.querySelectorAll("[data-form-switch]").forEach(btn=>btn.onclick=()=>{updateFormSwitch(btn);refresh();});
    bindImageUploadFields();
    const refresh=()=>{
      modal.querySelectorAll("[data-bundle-product]").forEach(card=>{const id=Number(card.dataset.bundleProduct);const qty=card.querySelector("[data-bundle-quantity]");card.classList.toggle("selected",selected.has(id));qty.hidden=!selected.has(id);if(selected.has(id))qty.value=selected.get(id);});
      const regular=[...selected].reduce((sum,[id,qty])=>{const product=products.find(item=>Number(item.id)===id);return sum+Number(product?.sale_price||product?.price||0)*qty;},0);
      const price=Number(form.elements.price.value||0);const saving=Math.max(0,regular-price);
      const finiteStocks=[...selected].map(([id,qty])=>{const product=products.find(item=>Number(item.id)===id);const stock=product?.stock;return stock===null||stock===undefined||Number(stock||0)===0?null:Math.floor(Number(stock)/qty);}).filter(value=>value!==null);
      const inheritedStock=finiteStocks.length?Math.min(...finiteStocks):null;
      const ownStock=form.elements.use_own_stock.value==="true";
      modal.querySelector("[data-own-bundle-stock]").hidden=!ownStock;
      const available=ownStock?Number(form.elements.stock.value||0):inheritedStock;
      document.getElementById("bundleSelectedCount").textContent=`${selected.size} ${ui("selected", "مختار")}`;
      document.getElementById("bundleLiveSummary").innerHTML=`<div><span>${ui("Products total", "مجموع المنتجات")}</span><strong>${bundleMoney(regular)}</strong></div><div><span>${ui("Bundle price", "سعر البندل")}</span><strong>${bundleMoney(price)}</strong></div><div class="saving"><span>${ui("Customer saves", "توفير العميل")}</span><strong>${bundleMoney(saving)}</strong></div><div><span>${ownStock?ui("Own inventory", "مخزون مستقل"):ui("From products", "من المنتجات")}</span><strong>${available===null?ui("Unlimited", "لا نهائي"):available}</strong></div>`;
      if(!form.elements.compare_at_price.dataset.touched)form.elements.compare_at_price.value=regular||0;
    };
    modal.querySelectorAll("[data-bundle-product]").forEach(card=>{card.onclick=event=>{if(event.target.closest("[data-bundle-quantity]"))return;const id=Number(card.dataset.bundleProduct);selected.has(id)?selected.delete(id):selected.set(id,1);refresh();};card.querySelector("[data-bundle-quantity]").oninput=event=>{selected.set(Number(card.dataset.bundleProduct),Math.max(1,Number(event.target.value||1)));refresh();};});
    form.elements.price.addEventListener("input",refresh);form.elements.stock.addEventListener("input",refresh);form.elements.compare_at_price.addEventListener("input",()=>{form.elements.compare_at_price.dataset.touched="true";});
    refresh();
    form.onsubmit=async event=>{event.preventDefault();if(selected.size<2){toast(ui("Choose at least two products", "اختر منتجين على الأقل"),"error");return;}const values=Object.fromEntries(new FormData(form));const ownStock=values.use_own_stock==="true";const payload={...values,price:Number(values.price||0),compare_at_price:Number(values.compare_at_price||0),cost:Number(values.cost||0),use_own_stock:ownStock,stock:ownStock?Number(values.stock||0):null,is_active:values.is_active==="true",items:[...selected].map(([product_id,quantity])=>({product_id,quantity}))};try{await api(row.id?`/api/admin/bundles/${row.id}`:"/api/admin/bundles",{method:row.id?"PUT":"POST",body:JSON.stringify(payload)});close();toast(row.id?t("updated"):t("created"));renderBundles(document.getElementById("page"));}catch(error){toast(error.message,"error");}};
  }

  function bundlePickerCard(product, selected) {
    const id=Number(product.id);const active=selected.has(id);
    return `<div class="bundle-picker-card ${active?"selected":""}" data-bundle-product="${id}" role="button" tabindex="0"><img src="${escapeHtml(product.main_photo_url||product.image_url||"")}" alt="" /><span>#${id}</span><strong>${escapeHtml(state.lang==="ar"?(product.name_ar||product.name_en):(product.name_en||product.name_ar))}</strong><small>${bundleMoney(product.sale_price||product.price||0)}</small><input data-bundle-quantity type="number" min="1" value="${selected.get(id)||1}" ${active?"":"hidden"} aria-label="${ui("Quantity", "الكمية")}" /></div>`;
  }

  function table(resource, rows, key) {
    if (!rows.length) return `<div class="empty-state"><div><div class="empty-illustration">${i(resource.icon || "file")}</div><h2>${t("noRows")}</h2><p class="muted">${t("noRowsSub")}</p></div></div>`;
    return `
      <div class="table-scroll"><table class="data-table">
        <thead><tr>${resource.columns.map(col => `<th>${label(col)}</th>`).join("")}<th style="text-align:end">${t("actions")}</th></tr></thead>
        <tbody>${rows.map(row => `
          <tr>
            ${resource.columns.map(col => `<td>${formatCell(row[col], col, row, key)}</td>`).join("")}
            <td><div class="row-actions">
              ${resource.readOnly ? "" : `<button class="btn icon-btn" data-edit="${row.id}" title="${t("edit")}">${i("edit")}</button><button class="btn icon-btn danger" data-delete="${row.id}" title="${t("delete")}">${i("trash")}</button>`}
            </div></td>
          </tr>
        `).join("")}</tbody>
      </table></div>
    `;
  }

  function label(key) {
    const map = { id: "ID", main_photo_url: t("image"), image_url: t("image"), logo_url: t("image"), short_description_en: t("shortDescription"), name_en: t("nameEn"), name_ar: t("nameAr"), title_en: t("titleEn"), title_ar: t("titleAr"), price: t("price"), sale_price: t("salePrice"), cost: t("cost"), stock: t("stock"), is_active: t("status"), isActive: t("status"), created_at: "Date", total: t("orderTotal"), customer_name: t("customer"), role: t("role") };
    return map[key] || key.replaceAll("_", " ");
  }

  function isStatusKey(key) {
    return key === "is_active" || key === "isActive" || key === "active";
  }

  function switchButton({ id = "", field, value, label = true, disabled = false }) {
    const on = value !== false;
    const dataAttrs = id
      ? `data-status-toggle="${id}" data-status-field="${field}" data-status-value="${on}"`
      : `data-form-switch="${field}" data-switch-value="${on}"`;
    return `
      <button
        class="toggle-control ${on ? "is-on" : "is-off"}"
        type="button"
        role="switch"
        aria-checked="${on}"
        ${disabled ? "disabled" : ""}
        ${dataAttrs}
      >
        <span class="toggle ${on ? "on" : ""}"><span></span></span>
        ${label ? `<span class="toggle-label">${on ? t("active") : t("inactive")}</span>` : ""}
      </button>
    `;
  }

  function formatCell(value, key, row, resourceKey) {
    if (isStatusKey(key)) {
      const resource = resources[resourceKey];
      return switchButton({ id: row?.id, field: key, value, disabled: resource?.readOnly });
    }
    if (resourceKey === "products" && key === "stock" && (!Number(value || 0))) return `<span class="status-pill good">${t("unlimitedStock")}</span>`;
    if (isImageKey(key) && value) return `<img class="table-thumb" src="${value}" alt="" loading="lazy" />`;
    if (key?.toLowerCase().includes("color") && String(value || "").startsWith("#")) return `<span style="display:inline-flex;align-items:center;gap:8px;"><span style="width:18px;height:18px;border-radius:50%;background:${value};border:1px solid var(--line-strong);"></span>${value}</span>`;
    if (value === undefined || value === null || value === "") return `<span class="muted">-</span>`;
    return `<span class="${String(value).length > 80 ? "cell-clamp" : ""}">${String(value)}</span>`;
  }

  function isImageKey(key) {
    return ["main_photo_url", "image_url", "logo_url", "thumbnail_url", "banner_url"].includes(key);
  }

  async function openEditor(key, row = {}) {
    const resource = resources[key];
    const isEdit = Boolean(row.id);
    if (key === "products") return renderProductEditorPage(row);
    if (key === "bundles") return openBundleEditor(row);
    const formGroups = groupedFields(key, resource.fields, row);
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal-backdrop" id="modal">
        <form class="modal catalog-editor-modal" id="editorForm">
          <div class="modal-head catalog-editor-head">
            <div>
              <h2>${isEdit ? t("edit") : t("add")} ${t(key)}</h2>
              <p class="muted">${key === "products" ? t("aiProductsSub") : t("galleryNote")}</p>
            </div>
            <button class="btn icon-btn" type="button" data-close>×</button>
          </div>
          <div class="modal-body">
            ${key === "products" ? productAiPanel(row) : ""}
            <div class="catalog-form-layout">
              ${formGroups.map(group => `
                <section class="catalog-form-section ${group.accent ? "accent" : ""}">
                  <div class="section-kicker">${group.kicker}</div>
                  <h3>${group.title}</h3>
                  <div class="form-grid ${group.single ? "single" : ""}">
                    ${group.fields.map(([name, labelKey, type, required]) => field(name, labelKey, type, row[name], required, key)).join("")}
                  </div>
                </section>
              `).join("")}
            </div>
          </div>
          <div class="modal-foot"><button class="btn" type="button" data-close>${t("cancel")}</button><button class="btn primary" type="submit">${t("save")}</button></div>
        </form>
      </div>
    `);
    document.querySelectorAll("[data-close]").forEach(btn => btn.onclick = closeModal);
    document.querySelectorAll("[data-form-switch]").forEach(btn => btn.onclick = () => updateFormSwitch(btn));
    bindImageUploadFields();
    bindColorChoiceFields();
    if (key === "products") bindProductAiPanel(row);
    document.getElementById("editorForm").onsubmit = (event) => saveRow(event, key, row.id);
  }

  async function renderProductEditorPage(row = {}) {
    await loadCatalogChoices();
    const page = document.getElementById("page");
    const isEdit = Boolean(row.id);
    const resource = resources.products;
    const formGroups = groupedFields("products", resource.fields, row);
    page.innerHTML = pageTitle(isEdit ? "edit" : "add", "", `
      <button class="btn" type="button" id="backToProducts">${t("cancel")}</button>
      <button class="btn primary" type="submit" form="editorForm">${t("save")}</button>
    `);
    page.innerHTML += `
      <form class="product-editor-page" id="editorForm">
        ${productAiPanel(row)}
        <div class="catalog-form-layout">
          ${formGroups.map(group => `
            <section class="catalog-form-section ${group.accent ? "accent" : ""}">
              <div class="section-kicker">${group.kicker}</div>
              <h3>${group.title}</h3>
              <div class="form-grid ${group.single ? "single" : ""}">
                ${group.fields.map(([name, labelKey, type, required]) => field(name, labelKey, type, row[name], required, "products")).join("")}
              </div>
              ${group.extra || ""}
            </section>
          `).join("")}
        </div>
        ${row.id ? `<section class="catalog-form-section product-social-proof-link"><div><span class="section-kicker">REVIEWS</span><h3>${ui("Reviews & Social Proof", "التقييمات وSocial Proof")}</h3><p>${ui("Moderate customer feedback, add transparent store recommendations, and manage verified sales messaging for this product.", "راجع تقييمات العملاء وأضف توصيات متجر واضحة وتحكم في عرض المبيعات الموثقة لهذا المنتج.")}</p></div><button class="btn" type="button" id="openProductSocialProof">${i("star")}${ui("Open settings", "فتح الإعدادات")}</button></section>` : ""}
      </form>
    `;
    document.getElementById("backToProducts").onclick = () => renderResource(page, "products");
    document.querySelectorAll("[data-form-switch]").forEach(btn => btn.onclick = () => updateFormSwitch(btn));
    bindImageUploadFields();
    bindColorChoiceFields();
    bindVariantBuilder();
    bindGeneratedImageButtons();
    bindProductAiPanel(row);
    if (row.id) document.getElementById("openProductSocialProof").onclick = () => { state.reviewWorkspaceTab = "social"; state.socialProofProductId = row.id; location.hash = "reviewsRecommendations"; };
    document.getElementById("editorForm").onsubmit = (event) => saveRow(event, "products", row.id);
  }

  async function loadCatalogChoices() {
    await Promise.all([
      ...["categories", "brands", "colors", "options"].map(key => state.rows[key]?.length ? Promise.resolve(state.rows[key]) : loadResource(key).catch(() => [])),
      loadProductShippingChoices()
    ]);
  }

  async function loadProductShippingChoices() {
    if (state.marketCatalog) return state.marketCatalog;
    state.marketCatalog = await api("/api/admin/market");
    return state.marketCatalog;
  }

  function groupedFields(key, fields, row = {}) {
    const fieldMap = Object.fromEntries(fields.map(field => [field[0], field]));
    const pick = names => names.map(name => fieldMap[name]).filter(Boolean);
    if (key === "products") {
      return [
        { kicker: "01", title: t("image"), accent: true, single: true, fields: pick(["main_photo_url"]) },
        { kicker: "02", title: t("suggestedProductData"), fields: pick(["name_en", "name_ar", "slug", "sku", "barcode", "price", "sale_price", "cost", "stock", "is_active"]) },
        { kicker: "03", title: t("catalog"), fields: pick(["category_slug", "brand_slug", "color", "options"]) },
        { kicker: "04", title: ui("Shipping & fulfillment", "الشحن والتجهيز"), fields: pick(["goods_type_id", "shipping_profile_id", "requires_shipping", "weight", "length", "width", "height", "origin_country_code", "hs_code"]) },
        { kicker: "05", title: t("productVariants"), single: true, fields: [], extra: variantsField(row) },
        { kicker: "06", title: t("shortDescription"), single: true, fields: pick(["short_description_en", "short_description_ar", "description_en", "description_ar"]) },
        { kicker: "07", title: "SEO", single: true, fields: pick(["meta_title_en", "meta_title_ar", "meta_description_en", "meta_description_ar"]) }
      ];
    }
    if (key === "categories" || key === "brands") {
      return [
        { kicker: "01", title: t("image"), accent: true, single: true, fields: pick([key === "brands" ? "logo_url" : "image_url"]) },
        { kicker: "02", title: t(key), fields: pick(["name_en", "name_ar", "slug", "is_active"]) },
        { kicker: "03", title: t("descriptionEn"), single: true, fields: pick(["description_en", "description_ar"]) }
      ];
    }
    return [{ kicker: "01", title: t(key), fields }];
  }

  function productAiPanel(row = {}) {
    const context = row.id ? `product-${row.id}` : "product-new";
    const generated = parseJsonArray(row.generated_images);
    return `
      <div class="card card-pad ai-inline-panel" data-ai-context="${context}" style="margin-bottom:16px;">
        <div class="table-header" style="padding:0;border:0;">
          <div><h2>${t("aiProducts")}</h2><p class="muted">${t("aiProductsSub")}</p></div>
          <div class="toolbar">
            <button class="btn" type="button" id="loadProductAiDraft">${t("loadDraft")}</button>
            <button class="btn primary" type="button" id="analyzeProductInEditor">${i("sparkles")}${t("analyzeImage")}</button>
          </div>
        </div>
        <div class="form-grid single" style="margin-top:12px;">
          <div class="field"><label>${t("uploadProductImage")}</label><input type="file" id="productAiImage" accept="image/*" /></div>
        </div>
        <input type="hidden" name="generated_images" value="${escapeHtml(JSON.stringify(generated))}" data-generated-images-value />
        <div class="generated-image-grid" id="generatedImagesGrid">
          ${generated.map(url => generatedImageCard(url)).join("")}
        </div>
        <div id="productAiInlineResult"></div>
      </div>
    `;
  }

  function bindProductAiPanel(row = {}) {
    document.getElementById("loadProductAiDraft").onclick = () => loadProductAiDraft(row);
    document.getElementById("analyzeProductInEditor").onclick = () => analyzeProductInEditor(row);
  }

  function field(name, labelKey, type, value, required, resourceKey = "") {
    if (type === "image") return imageUploadField(name, labelKey, value, required);
    if (type === "categorySelect") return choiceSelectField(name, labelKey, value, state.rows.categories || [], "category");
    if (type === "brandSelect") return choiceSelectField(name, labelKey, value, state.rows.brands || [], "brand");
    if (type === "optionSelect") return choiceSelectField(name, labelKey, value, state.rows.options || [], "option");
    if (type === "colorSelect") return colorChoiceField(name, labelKey, value, state.rows.colors || []);
    if (type === "goodsTypeSelect") return marketChoiceField(name, labelKey, value, state.marketCatalog?.goods_types || [], "id");
    if (type === "shippingProfileSelect") return marketChoiceField(name, labelKey, value, state.marketCatalog?.shipping_profiles || [], "id");
    if (type === "countrySelect") return marketChoiceField(name, labelKey, value, state.marketCatalog?.countries || [], "code", true);
    if (type === "textarea") return `<div class="field full"><label>${t(labelKey)}${required ? " *" : ""}</label><textarea name="${name}" ${required ? "required" : ""}>${value || ""}</textarea></div>`;
    if (type === "checkbox") return `<div class="field"><label>${t(labelKey)}</label><input type="hidden" name="${name}" value="${value === false ? "false" : "true"}" />${switchButton({ field: name, value, id: "", label: true })}</div>`;
    return `<div class="field"><label>${t(labelKey)}${required ? " *" : ""}</label><input name="${name}" type="${type}" value="${value || ""}" ${required ? "required" : ""} /></div>`;
  }

  function marketChoiceField(name, labelKey, value = "", rows = [], valueKey = "id", showFlag = false) {
    const current = String(value || "");
    return `<div class="field"><label>${t(labelKey)}</label><select name="${name}"><option value="">${ui("Use store default", "استخدم إعداد المتجر")}</option>${rows.filter(row=>row.is_active!==false).map(row=>{const optionValue=String(row[valueKey]||"");const title=state.lang==="ar"?(row.name_ar||row.name_en):(row.name_en||row.name_ar);return `<option value="${escapeHtml(optionValue)}" ${optionValue===current?"selected":""}>${showFlag?`${countryFlag(row.code)} `:""}${escapeHtml(title||optionValue)}</option>`;}).join("")}</select></div>`;
  }

  function imageUploadField(name, labelKey, value = "", required) {
    return `
      <div class="field full image-upload-field" data-image-field="${name}">
        <label>${t(labelKey)}${required ? " *" : ""}</label>
        <input type="hidden" name="${name}" value="${escapeHtml(value || "")}" ${required ? "required" : ""} />
        <div class="image-upload-box">
          <div class="image-upload-preview">
            ${value ? `<img src="${escapeHtml(value)}" alt="" />` : `<span>${i("image")}</span>`}
          </div>
          <div class="image-upload-copy">
            <strong>${t("uploadImages")}</strong>
            <span class="muted small">${value ? escapeHtml(value) : t("galleryNote")}</span>
            <input type="file" accept="image/*" data-upload-image="${name}" />
          </div>
        </div>
      </div>
    `;
  }

  function choiceSelectField(name, labelKey, value = "", rows = [], kind = "") {
    const choices = rows.filter(row => row.is_active !== false && row.isActive !== false);
    const current = String(value || "");
    return `
      <div class="field">
        <label>${t(labelKey)}</label>
        <select name="${name}" data-choice-kind="${kind}">
          <option value="">-</option>
          ${choices.map(row => {
            const slug = row.slug || slugFromText(row.name_en || row.nameEn || row.name_ar || row.nameAr);
            const label = [row.name_en || row.nameEn, row.name_ar || row.nameAr].filter(Boolean).join(" / ");
            return `<option value="${escapeHtml(slug)}" ${String(slug) === current ? "selected" : ""}>${escapeHtml(label || slug)}</option>`;
          }).join("")}
        </select>
      </div>
    `;
  }

  function colorChoiceField(name, labelKey, value = "", rows = []) {
    const current = String(value || "").toLowerCase();
    const choices = rows.filter(row => row.is_active !== false && row.isActive !== false);
    return `
      <div class="field full">
        <label>${t(labelKey)}</label>
        <input type="hidden" name="${name}" value="${escapeHtml(value || "")}" data-color-value />
        <div class="color-choice-grid">
          ${choices.map(row => {
            const hex = row.color || row.hex || "#d7dae0";
            const label = row.name_en || row.nameEn || row.name_ar || row.nameAr || hex;
            const selected = current && [String(hex).toLowerCase(), String(label).toLowerCase()].includes(current);
            return `
              <button class="color-choice ${selected ? "selected" : ""}" type="button" data-color-choice="${escapeHtml(label)}">
                <span style="background:${escapeHtml(hex)}"></span>
                <strong>${escapeHtml(label)}</strong>
              </button>
            `;
          }).join("") || `<span class="muted small">${t("noRows")}</span>`}
        </div>
      </div>
    `;
  }

  function parseJsonArray(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function variantsField(row = {}) {
    const variants = parseJsonArray(row.variants);
    return `
      <input type="hidden" name="variants" value="${escapeHtml(JSON.stringify(variants))}" data-variants-value />
      <div class="variant-builder">
        <div class="variant-list" id="variantList">
          ${(variants.length ? variants : [{ type: "color_option", color: row.color || "", option: row.options || "", value: "", price_adjustment: 0, stock: "", is_active: true }]).map(variantRow).join("")}
        </div>
        <div class="toolbar">
          <button class="btn" type="button" data-add-variant-type="color">${t("addColorVariant")}</button>
          <button class="btn" type="button" data-add-variant-type="option">${t("addOptionVariant")}</button>
          <button class="btn primary" type="button" data-add-variant-type="color_option">${t("addColorOptionVariant")}</button>
        </div>
      </div>
    `;
  }

  function variantRow(variant = {}) {
    const colors = state.rows.colors || [];
    const options = state.rows.options || [];
    const type = variant.type || (variant.color && variant.option ? "color_option" : variant.color ? "color" : "option");
    const active = variant.is_active !== false && variant.isActive !== false && variant.active !== false;
    return `
      <div class="variant-row">
        <input type="hidden" data-variant-field="type" value="${escapeHtml(type)}" />
        <input type="hidden" data-variant-field="is_active" value="${active ? "true" : "false"}" />
        <input type="hidden" data-variant-field="image_url" value="${escapeHtml(variant.image_url || "")}" />
        <div class="variant-kind">
          <span>${t("variantType")}</span>
          <strong>${type === "color" ? t("colors") : type === "option" ? t("options") : `${t("colors")} + ${t("options")}`}</strong>
        </div>
        <div class="variant-image-upload">
          <span>${t("image")}</span>
          <div class="variant-image-box">
            <div class="variant-image-preview">${variant.image_url ? `<img src="${escapeHtml(variant.image_url)}" alt="" />` : i("image")}</div>
            <input type="file" accept="image/*" data-variant-image-upload />
          </div>
        </div>
        <label><span>${t("colors")}</span><select data-variant-field="color" ${type === "option" ? "disabled" : ""}>
          <option value="">-</option>
          ${colors.map(row => {
            const label = row.name_en || row.nameEn || row.name_ar || row.nameAr || row.color;
            return `<option value="${escapeHtml(label)}" ${String(variant.color || "") === String(label) ? "selected" : ""}>${escapeHtml(label)}</option>`;
          }).join("")}
        </select></label>
        <label><span>${t("options")}</span><select data-variant-field="option" ${type === "color" ? "disabled" : ""}>
          <option value="">-</option>
          ${options.map(row => {
            const label = row.name_en || row.nameEn || row.name_ar || row.nameAr;
            return `<option value="${escapeHtml(label)}" ${String(variant.option || "") === String(label) ? "selected" : ""}>${escapeHtml(label)}</option>`;
          }).join("")}
        </select></label>
        <label><span>${t("optionValue")}</span><input data-variant-field="value" value="${escapeHtml(variant.value || "")}" ${type === "color" ? "disabled" : ""} /></label>
        <label><span>${t("sku")}</span><input data-variant-field="sku" value="${escapeHtml(variant.sku || "")}" /></label>
        <label><span>${t("barcode")}</span><input data-variant-field="barcode" value="${escapeHtml(variant.barcode || "")}" /></label>
        <label><span>${t("price")}</span><input data-variant-field="price" type="number" step="0.01" value="${variant.price ?? ""}" /></label>
        <label><span>${t("compareAtPrice")}</span><input data-variant-field="compare_at_price" type="number" step="0.01" value="${variant.compare_at_price ?? ""}" /></label>
        <label><span>${t("cost")}</span><input data-variant-field="cost" type="number" step="0.01" value="${variant.cost ?? ""}" /></label>
        <label><span>${t("priceAdjustment")}</span><input data-variant-field="price_adjustment" type="number" step="0.01" value="${Number(variant.price_adjustment || 0)}" /></label>
        <label><span>${t("weightKg")}</span><input data-variant-field="weight" type="number" min="0" step="0.01" value="${variant.weight ?? ""}" /></label>
        <label><span>${t("stock")}</span><input data-variant-field="stock" type="number" value="${variant.stock ?? ""}" /></label>
        <div class="variant-switch">
          ${switchButton({ field: "variant_is_active", value: active, id: "", label: true })}
        </div>
        <button class="btn icon-btn danger" type="button" data-remove-variant>${i("trash")}</button>
      </div>
    `;
  }

  function bindVariantBuilder() {
    const list = document.getElementById("variantList");
    if (!list) return;
    const sync = () => {
      const rows = [...list.querySelectorAll(".variant-row")].map(row => {
        const item = {};
        row.querySelectorAll("[data-variant-field]").forEach(input => {
          const key = input.dataset.variantField;
          if (key === "is_active") item[key] = input.value !== "false";
          else if (input.type === "number" && input.value === "") item[key] = "";
          else item[key] = input.type === "number" ? Number(input.value || 0) : input.value;
        });
        return item;
      }).filter(item => item.color || item.option || item.value || item.sku || item.barcode || item.image_url || item.price || item.compare_at_price || item.cost || item.price_adjustment || item.weight || item.stock);
      const hidden = document.querySelector("[data-variants-value]");
      if (hidden) hidden.value = JSON.stringify(rows);
    };
    const rebind = () => {
      list.querySelectorAll("[data-variant-field]").forEach(input => input.oninput = sync);
      list.querySelectorAll("[data-form-switch='variant_is_active']").forEach(btn => {
        btn.onclick = () => {
          updateFormSwitch(btn);
          const hidden = btn.closest(".variant-row")?.querySelector("[data-variant-field='is_active']");
          if (hidden) hidden.value = btn.dataset.switchValue;
          sync();
        };
      });
      list.querySelectorAll("[data-remove-variant]").forEach(btn => {
        btn.onclick = () => {
          btn.closest(".variant-row")?.remove();
          sync();
        };
      });
      list.querySelectorAll("[data-variant-image-upload]").forEach(input => {
        input.onchange = async () => {
          if (!input.files?.[0]) return;
          const row = input.closest(".variant-row");
          const hidden = row?.querySelector("[data-variant-field='image_url']");
          const preview = row?.querySelector(".variant-image-preview");
          const form = new FormData();
          form.append("file", input.files[0]);
          input.disabled = true;
          try {
            const data = await api("/api/admin/upload/single", { method: "POST", body: form });
            const url = data.url || data.fileUrl || data.path;
            if (hidden) hidden.value = url;
            if (preview) preview.innerHTML = `<img src="${escapeHtml(url)}" alt="" />`;
            sync();
            toast(t("uploadImages"));
          } catch (error) {
            toast(error.message, "error");
          } finally {
            input.disabled = false;
          }
        };
      });
    };
    document.querySelectorAll("[data-add-variant-type]").forEach(btn => {
      btn.onclick = () => {
        list.insertAdjacentHTML("beforeend", variantRow({ type: btn.dataset.addVariantType, is_active: true }));
        rebind();
        sync();
      };
    });
    rebind();
    sync();
  }

  function generatedImageCard(url) {
    return `
      <div class="generated-image-card" data-generated-url="${escapeHtml(url)}">
        <img src="${escapeHtml(url)}" alt="" />
        <button class="btn" type="button" data-use-generated-image="${escapeHtml(url)}">${t("useAsMainImage")}</button>
      </div>
    `;
  }

  function addGeneratedImage(url) {
    const grid = document.getElementById("generatedImagesGrid");
    const hidden = document.querySelector("[data-generated-images-value]");
    if (!grid || !hidden || !url) return;
    const images = parseJsonArray(hidden.value);
    if (!images.includes(url)) images.unshift(url);
    hidden.value = JSON.stringify(images);
    grid.innerHTML = images.map(generatedImageCard).join("");
    bindGeneratedImageButtons();
  }

  function bindGeneratedImageButtons() {
    document.querySelectorAll("[data-use-generated-image]").forEach(btn => {
      btn.onclick = () => {
        const url = btn.dataset.useGeneratedImage;
        const hidden = document.querySelector('[data-image-field="main_photo_url"] input[name="main_photo_url"]');
        const preview = document.querySelector('[data-image-field="main_photo_url"] .image-upload-preview');
        const copy = document.querySelector('[data-image-field="main_photo_url"] .image-upload-copy .small');
        if (hidden) hidden.value = url;
        if (preview) preview.innerHTML = `<img src="${escapeHtml(url)}" alt="" />`;
        if (copy) copy.textContent = url;
        toast(t("updated"));
      };
    });
  }

  function bindImageUploadFields() {
    document.querySelectorAll("[data-upload-image]").forEach(input => {
      input.onchange = async () => {
        if (!input.files?.[0]) return;
        const fieldName = input.dataset.uploadImage;
        const wrap = input.closest("[data-image-field]");
        const hidden = wrap?.querySelector(`input[name="${fieldName}"]`);
        const preview = wrap?.querySelector(".image-upload-preview");
        const copy = wrap?.querySelector(".image-upload-copy .small");
        const form = new FormData();
        form.append("file", input.files[0]);
        input.disabled = true;
        try {
          const data = await api("/api/admin/upload/single", { method: "POST", body: form });
          const url = data.url || data.fileUrl || data.path;
          if (hidden) hidden.value = url;
          if (preview) preview.innerHTML = `<img src="${escapeHtml(url)}" alt="" />`;
          if (copy) copy.textContent = url;
          hidden?.dispatchEvent(new Event("input", { bubbles: true }));
          document.dispatchEvent(new CustomEvent("slyrah:image-uploaded", { detail: { fieldName, url } }));
          toast(t("uploadImages"));
        } catch (error) {
          toast(error.message, "error");
        } finally {
          input.disabled = false;
        }
      };
    });
  }

  function bindColorChoiceFields() {
    document.querySelectorAll("[data-color-choice]").forEach(btn => {
      btn.onclick = () => {
        const field = btn.closest(".field");
        field?.querySelectorAll(".color-choice").forEach(item => item.classList.remove("selected"));
        btn.classList.add("selected");
        const hidden = field?.querySelector("[data-color-value]");
        if (hidden) hidden.value = btn.dataset.colorChoice || "";
      };
    });
  }

  async function analyzeProductInEditor(row = {}) {
    const input = document.getElementById("productAiImage");
    if (!input.files?.[0]) return toast(t("required"), "error");
    const context = row.id ? `product-${row.id}` : "product-new";
    const form = new FormData();
    form.append("image", input.files[0]);
    form.append("context", context);
    if (row.id) form.append("product_id", row.id);
    const btn = document.getElementById("analyzeProductInEditor");
    btn.disabled = true;
    btn.innerHTML = `${i("sparkles")}${t("analyzingImage")}`;
    try {
      const data = await api("/api/admin/ai/products/analyze", { method: "POST", body: form });
      localStorage.setItem(`slyrah_ai_product_draft_${context}`, JSON.stringify(data.result));
      renderInlineAiProductResult(data.result);
      applyAiResultToProductForm(data.result);
      toast(t("updated"));
    } catch (error) {
      toast(error.message, "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = `${i("sparkles")}${t("analyzeImage")}`;
    }
  }

  async function loadProductAiDraft(row = {}) {
    const context = row.id ? `product-${row.id}` : "product-new";
    const local = localStorage.getItem(`slyrah_ai_product_draft_${context}`);
    let result = local ? JSON.parse(local) : null;
    if (!result) {
      const data = await api(`/api/admin/ai/products/drafts/latest?context=${encodeURIComponent(context)}`);
      result = data.draft?.result;
    }
    if (!result) return toast(t("noRows"), "error");
    renderInlineAiProductResult(result);
    applyAiResultToProductForm(result);
  }

  function setProductField(name, value) {
    const el = document.querySelector(`#editorForm [name="${name}"]`);
    if (el && value !== undefined && value !== null && value !== "") el.value = value;
  }

  function applyAiResultToProductForm(result = {}) {
    const p = result.product || {};
    setProductField("main_photo_url", result.image_url);
    setProductField("name_en", p.name_en);
    setProductField("name_ar", p.name_ar);
    setProductField("slug", p.slug || slugFromText(p.name_en));
    setProductField("short_description_en", p.short_description_en);
    setProductField("short_description_ar", p.short_description_ar);
    setProductField("description_en", p.description_en);
    setProductField("description_ar", p.description_ar);
    setProductField("category_slug", p.category_slug || slugFromText(p.category_name_en));
    setProductField("brand_slug", p.brand_slug || slugFromText(p.brand_name_en || "others"));
    setProductField("color", (p.colors || []).map(c => c.name_en || c.name_ar || c.hex).filter(Boolean).join(", "));
    setProductField("options", (p.options || []).map(o => [o.name_en || o.name_ar, o.value_en || o.value_ar].filter(Boolean).join(": ")).filter(Boolean).join(", "));
    setProductField("meta_title_en", p.name_en);
    setProductField("meta_title_ar", p.name_ar);
    setProductField("meta_description_en", p.short_description_en);
    setProductField("meta_description_ar", p.short_description_ar);
  }

  function slugFromText(value) {
    return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function renderInlineAiProductResult(result = {}) {
    const el = document.getElementById("productAiInlineResult");
    if (!el) return;
    el.innerHTML = `
      <div class="toolbar" style="margin-top:14px;justify-content:flex-end;"><button class="btn" type="button" id="applyAiToForm">${t("applyToForm")}</button></div>
      ${aiProductResultHtml(result)}
    `;
    document.getElementById("applyAiToForm").onclick = () => applyAiResultToProductForm(result);
    bindAiResultActions(el, result);
  }

  function bindAiResultActions(root, result = {}) {
    root.querySelectorAll("[data-create-suggestion]").forEach(btn => {
      btn.onclick = async () => {
        const payload = JSON.parse(decodeURIComponent(btn.dataset.payload));
        await api("/api/admin/ai/products/suggestions", { method: "POST", body: JSON.stringify({ type: btn.dataset.createSuggestion, payload }) });
        toast(t("created"));
      };
    });
    root.querySelectorAll("[data-generate-slot]").forEach(btn => {
      btn.onclick = async () => {
        btn.disabled = true;
        btn.textContent = t("generatingImage");
        try {
          const payload = JSON.parse(decodeURIComponent(btn.dataset.slotPayload));
          const generated = await api("/api/admin/ai/products/generate-image", { method: "POST", body: JSON.stringify({ image_url: result.image_url, prompt: payload.prompt, type: payload.type }) });
          toast(t("created"));
          addGeneratedImage(generated.url);
          btn.outerHTML = `<a class="btn" href="${generated.url}" target="_blank">${t("openPage")}</a>`;
        } catch (error) {
          toast(error.message, "error");
          btn.disabled = false;
          btn.textContent = t("generateImage");
        }
      };
    });
  }

  async function saveRow(event, key, id) {
    event.preventDefault();
    const resource = resources[key];
    const payload = {};
    new FormData(event.currentTarget).forEach((value, name) => {
      if (value === "true") payload[name] = true;
      else if (value === "false") payload[name] = false;
      else if (["variants", "generated_images"].includes(name)) payload[name] = parseJsonArray(value);
      else if (event.currentTarget.elements[name]?.type === "number") payload[name] = Number(value || 0);
      else payload[name] = value;
    });
    try {
      await api(id ? `${resource.api}/${id}` : resource.api, { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
      closeModal();
      toast(id ? t("updated") : t("created"));
      key === "bundles" ? renderBundles(document.getElementById("page")) : renderResource(document.getElementById("page"), key);
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function toggleRowStatus(key, id, field, nextValue) {
    try {
      await api(`${resources[key].api}/${id}`, { method: "PUT", body: JSON.stringify({ [field]: nextValue }) });
      toast(t("updated"));
      key === "bundles" ? renderBundles(document.getElementById("page")) : renderResource(document.getElementById("page"), key);
    } catch (error) {
      toast(error.message, "error");
    }
  }

  function updateFormSwitch(btn) {
    const nextValue = btn.dataset.switchValue !== "true";
    const fieldName = btn.dataset.formSwitch;
    const hiddenInput = (btn.closest(".field") || btn.closest(".editor-toggle-row") || btn.closest(".policy-toggle") || btn.closest("td") || btn.closest("tr"))?.querySelector(`input[name="${fieldName}"]`);
    btn.dataset.switchValue = String(nextValue);
    btn.setAttribute("aria-checked", String(nextValue));
    btn.classList.toggle("is-on", nextValue);
    btn.classList.toggle("is-off", !nextValue);
    btn.querySelector(".toggle")?.classList.toggle("on", nextValue);
    const labelEl = btn.querySelector(".toggle-label");
    if (labelEl) labelEl.textContent = nextValue ? t("active") : t("inactive");
    if (hiddenInput) hiddenInput.value = String(nextValue);
  }

  async function deleteRow(key, id) {
    try {
      await api(`${resources[key].api}/${id}`, { method: "DELETE" });
      toast(t("deleted"));
      key === "bundles" ? renderBundles(document.getElementById("page")) : renderResource(document.getElementById("page"), key);
    } catch (error) {
      toast(error.message, "error");
    }
  }

  function closeModal() {
    document.getElementById("modal")?.remove();
  }

  function closeTopDialog() {
    const dialogs = [...document.querySelectorAll(".modal-backdrop")];
    dialogs.at(-1)?.remove();
  }

  function promotionReasonLabel(reason = "") {
    const labels = {
      PROMO_ALREADY_USED: ui("Already used by this customer", "استُخدم من هذا العميل من قبل"),
      PROMO_CURRENTLY_RESERVED: ui("Reserved by another checkout", "محجوز حاليًا لطلب آخر"),
      PROMO_FIRST_ORDER_ONLY: ui("Customer has a previous order", "العميل لديه طلب سابق"),
      PROMO_GUESTS_NOT_ALLOWED: ui("Guests are not allowed", "غير متاح للضيوف"),
      PROMO_MANUAL_LIMIT: ui("Manual code limit reached", "تم الوصول لحد الأكواد اليدوية"),
      PROMO_EXCLUSIVE_CONFLICT: ui("Conflicts with an exclusive offer", "يتعارض مع عرض حصري"),
      PROMO_SAME_GROUP_CONFLICT: ui("Another offer from this group won", "تم اختيار عرض آخر من نفس المجموعة"),
      PROMO_NOT_COMPATIBLE: ui("These offers are not compatible", "العروض غير متوافقة"),
      PROMO_BUNDLE_NOT_ALLOWED: ui("Not available for bundles", "غير متاح للبندلز")
    };
    return labels[reason] || reason;
  }

  async function renderCombinedPromotions(page) {
    page.innerHTML = pageTitle("combinedPromotions", "discountsSub");
    const [policy, discountData, redemptionData] = await Promise.all([
      api("/api/admin/promotion-policy"),
      api("/api/admin/discounts"),
      api("/api/admin/promotion-redemptions")
    ]);
    await loadResource("products").catch(() => []);
    const discounts = discountData.discounts || [];
    const redemptions = redemptionData.redemptions || [];
    const activeReservations = redemptions.filter(row => row.status === "reserved").length;
    const used = redemptions.filter(row => row.status === "used").length;
    page.innerHTML += `
      <div class="promotion-command">
        <div><span class="promotion-eyebrow">${ui("PROMOTION CONTROL", "مركز التحكم بالعروض")}</span><h2>${ui("Decide what can run together", "حدد العروض التي يمكن تشغيلها معًا")}</h2><p>${ui("One calculation engine protects every cart, guest, bundle, and shipping benefit.", "محرك حساب واحد يحمي كل سلة وضيف وبندل وميزة شحن.")}</p></div>
        <div class="promotion-command-stats"><div><strong>${discounts.length}</strong><span>${ui("Offers", "عرض")}</span></div><div><strong>${activeReservations}</strong><span>${ui("Reserved", "محجوز")}</span></div><div><strong>${used}</strong><span>${ui("Used", "مستخدم")}</span></div></div>
      </div>
      <form class="promotion-policy card" id="promotionPolicyForm">
        <div class="promotion-section-head"><div><span>01</span><h2>${ui("Global guardrails", "قواعد الحماية العامة")}</h2><p>${ui("These limits apply after offer eligibility and before checkout total is saved.", "تطبق هذه الحدود بعد التحقق من أهلية العروض وقبل حفظ إجمالي الطلب.")}</p></div><button class="btn primary" type="submit">${i("save")}${t("save")}</button></div>
        <div class="promotion-policy-grid">
          <label><span>${ui("Manual codes per cart", "الأكواد اليدوية لكل سلة")}</span><input name="max_manual_codes" type="number" min="1" max="20" value="${Number(policy.max_manual_codes || 1)}" /></label>
          <label><span>${ui("Automatic offers", "العروض التلقائية")}</span><input name="max_automatic_promotions" type="number" min="0" max="20" value="${Number(policy.max_automatic_promotions || 0)}" /></label>
          <label><span>${ui("Maximum financial discount", "أقصى نسبة خصم مالي")}</span><div class="input-suffix"><input name="max_financial_discount_percent" type="number" min="0" max="100" value="${Number(policy.max_financial_discount_percent || 0)}" /><b>%</b></div></label>
          <label><span>${ui("Maximum discount amount", "أقصى مبلغ خصم")}</span><input name="max_financial_discount_amount" type="number" min="0" value="${policy.max_financial_discount_amount ?? ""}" placeholder="${ui("No amount cap", "بدون حد مبلغ")}" /></label>
          <label><span>${ui("Guest reservation", "مدة حجز الضيف")}</span><div class="input-suffix"><input name="reservation_minutes" type="number" min="5" value="${Number(policy.reservation_minutes || 30)}" /><b>${ui("min", "د")}</b></div></label>
          <div class="policy-toggle"><div><strong>${ui("Shipping benefit", "ميزة الشحن")}</strong><small>${ui("Allow one shipping benefit beside financial offers", "السماح بميزة شحن بجانب الخصومات المالية")}</small></div><input type="hidden" name="allow_shipping_benefit" value="${policy.allow_shipping_benefit !== false}" />${switchButton({field:"allow_shipping_benefit",value:policy.allow_shipping_benefit !== false,label:false})}</div>
          <div class="policy-toggle"><div><strong>${ui("Bundle discounts", "خصومات البندلز")}</strong><small>${ui("Allow extra product discounts over bundle pricing", "السماح بخصم منتجات إضافي فوق سعر البندل")}</small></div><input type="hidden" name="bundle_extra_discounts" value="${policy.bundle_extra_discounts === true}" />${switchButton({field:"bundle_extra_discounts",value:policy.bundle_extra_discounts === true,label:false})}</div>
          <div class="policy-toggle"><div><strong>${ui("Never below cost", "عدم النزول عن التكلفة")}</strong><small>${ui("Prepared guardrail for catalog cost protection", "قاعدة جاهزة لحماية تكلفة الكتالوج")}</small></div><input type="hidden" name="never_below_cost" value="${policy.never_below_cost === true}" />${switchButton({field:"never_below_cost",value:policy.never_below_cost === true,label:false})}</div>
        </div>
      </form>
      <section class="promotion-workbench">
        <div class="card promotion-matrix"><div class="promotion-section-head"><div><span>02</span><h2>${ui("Compatibility matrix", "مصفوفة التوافق")}</h2><p>${ui("Click a cell to allow or block a pair explicitly.", "اضغط على الخلية للسماح أو منع جمع عرضين بوضوح.")}</p></div></div>${promotionMatrix(discounts)}</div>
        <div class="card promotion-simulator"><div class="promotion-section-head"><div><span>03</span><h2>${ui("Cart simulator", "محاكي السلة")}</h2><p>${ui("Choose offers and products, then inspect the exact decision.", "اختر العروض والمنتجات وشاهد قرار المحرك بالتفصيل.")}</p></div></div>
          <div class="simulator-block"><strong>${ui("Promo codes", "أكواد الخصم")}</strong><div class="simulator-code-list">${discounts.filter(row=>row.code).map(row=>`<label><input type="checkbox" value="${escapeHtml(row.code)}" data-sim-code /><span>${escapeHtml(row.code)}</span><small>${escapeHtml(state.lang==="ar"?row.name_ar||row.name_en:row.name_en||row.name_ar)}</small></label>`).join("")||`<p class="muted">${t("noRows")}</p>`}</div></div>
          <div class="simulator-block"><strong>${ui("Sample cart", "سلة الاختبار")}</strong><div class="simulator-product-list">${(state.rows.products||[]).slice(0,30).map(product=>`<label><input type="checkbox" value="${product.id}" data-sim-product /><img src="${escapeHtml(product.main_photo_url||product.image_url||"")}" alt="" /><span>${escapeHtml(state.lang==="ar"?product.name_ar||product.name_en:product.name_en||product.name_ar)}</span></label>`).join("")}</div></div>
          <button class="btn primary" id="runPromotionSimulator" type="button">${i("play")}${ui("Run decision", "تشغيل القرار")}</button><div id="promotionSimulationResult"></div>
        </div>
      </section>
      <section class="card promotion-history"><div class="promotion-section-head"><div><span>04</span><h2>${ui("Guest usage history", "سجل استخدام الضيوف")}</h2><p>${ui("Identity values stay hashed; only the matching signals are shown.", "بيانات الهوية محفوظة بشكل مشفر، وتظهر فقط إشارات المطابقة.")}</p></div></div>${promotionHistory(redemptions)}</section>
    `;
    document.querySelectorAll("[data-form-switch]").forEach(btn => btn.onclick = () => updateFormSwitch(btn));
    document.getElementById("promotionPolicyForm").onsubmit = async event => {
      event.preventDefault(); const values=Object.fromEntries(new FormData(event.currentTarget));
      ["max_manual_codes","max_automatic_promotions","max_financial_discount_percent","reservation_minutes"].forEach(key=>values[key]=Number(values[key]||0));
      values.max_financial_discount_amount=values.max_financial_discount_amount===""?null:Number(values.max_financial_discount_amount||0);
      ["allow_shipping_benefit","bundle_extra_discounts","never_below_cost"].forEach(key=>values[key]=values[key]==="true");
      await api("/api/admin/promotion-policy",{method:"PUT",body:JSON.stringify(values)});toast(t("saved"));renderCombinedPromotions(page);
    };
    document.querySelectorAll("[data-compatibility]").forEach(btn=>btn.onclick=()=>togglePromotionCompatibility(btn,discounts,page));
    document.getElementById("runPromotionSimulator").onclick=()=>runPromotionSimulator(discounts);
  }

  function promotionMatrix(discounts=[]) {
    if(!discounts.length)return `<div class="empty-state compact"><div><h2>${t("noRows")}</h2></div></div>`;
    return `<div class="matrix-scroll"><table class="compatibility-table"><thead><tr><th>${ui("Offer", "العرض")}</th>${discounts.map(row=>`<th title="${escapeHtml(row.code)}">${escapeHtml(row.code)}</th>`).join("")}</tr></thead><tbody>${discounts.map(row=>`<tr><th><strong>${escapeHtml(row.code)}</strong><small>${escapeHtml(row.combination_group||"order")}</small></th>${discounts.map(other=>{const same=Number(row.id)===Number(other.id);const allowed=(row.compatible_discount_ids||[]).map(Number).includes(Number(other.id));return `<td>${same?`<span class="matrix-self">-</span>`:`<button type="button" class="matrix-cell ${allowed?"allowed":"blocked"}" data-compatibility="${row.id}:${other.id}" aria-label="${allowed?"Allowed":"Blocked"}">${i(allowed?"check":"x")}</button>`}</td>`;}).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  async function togglePromotionCompatibility(btn,discounts,page){const [a,b]=btn.dataset.compatibility.split(":").map(Number);const first=discounts.find(row=>Number(row.id)===a);const second=discounts.find(row=>Number(row.id)===b);if(!first||!second)return;const allowed=(first.compatible_discount_ids||[]).map(Number).includes(b);for(const [row,other] of [[first,b],[second,a]]){const current=(row.compatible_discount_ids||[]).map(Number);const next=allowed?current.filter(id=>id!==other):[...new Set([...current,other])];await api(`/api/admin/discounts/${row.id}`,{method:"PATCH",body:JSON.stringify({compatible_discount_ids:next})});}renderCombinedPromotions(page);}

  async function runPromotionSimulator(){const products=(state.rows.products||[]).filter(row=>document.querySelector(`[data-sim-product][value="${row.id}"]`)?.checked);const codes=[...document.querySelectorAll("[data-sim-code]:checked")].map(input=>input.value);const target=document.getElementById("promotionSimulationResult");if(!products.length){target.innerHTML=`<div class="notice error">${t("selectAtLeastOne")}</div>`;return;}target.innerHTML=`<div class="promotion-loading">${i("loader")}${ui("Calculating every rule...", "جاري حساب كل القواعد...")}</div>`;try{const data=await api("/api/admin/promotions/simulate",{method:"POST",body:JSON.stringify({codes,items:products.map(product=>({key:`${product.id}:sim`,product_id:product.id,price:Number(product.sale_price||product.price||0),quantity:1,category_slug:product.category_slug})),order_total:products.reduce((sum,p)=>sum+Number(p.sale_price||p.price||0),0)})});target.innerHTML=`<div class="simulation-summary"><div><span>${ui("Subtotal", "المجموع")}</span><strong>${bundleMoney(data.cart_subtotal)}</strong></div><div><span>${ui("Discount", "الخصم")}</span><strong>-${bundleMoney(data.discount_amount)}</strong></div><div><span>${ui("Final", "النهائي")}</span><strong>${bundleMoney(data.final_subtotal)}</strong></div></div><div class="decision-list">${(data.applied_promotions||[]).map(row=>`<div class="decision accepted">${i("check-circle")}<strong>${escapeHtml(row.code)}</strong><span>${ui("Applied", "تم التطبيق")} · ${bundleMoney(row.discount_amount)}</span></div>`).join("")}${(data.rejected_promotions||[]).map(row=>`<div class="decision rejected">${i("x-circle")}<strong>${escapeHtml(row.code)}</strong><span>${escapeHtml(promotionReasonLabel(row.reason))}</span></div>`).join("")}</div>`;}catch(error){target.innerHTML=`<div class="notice error">${escapeHtml(promotionReasonLabel(error.message))}</div>`;}}

  function promotionHistory(rows=[]){return `<div class="promotion-history-list">${rows.length?rows.map(row=>`<div class="history-row"><span class="status-pill ${row.status==="used"?"good":row.status==="reserved"?"warn":"empty"}">${escapeHtml(row.status)}</span><strong>${escapeHtml(row.discount_code)}</strong><div class="identity-signals">${row.has_guest?`<span>${i("monitor")}Guest</span>`:""}${row.has_phone?`<span>${i("phone")}Phone</span>`:""}${row.has_email?`<span>${i("mail")}Email</span>`:""}${row.has_payment?`<span>${i("credit-card")}Payment</span>`:""}</div><span>${row.order_id?`#${row.order_id}`:"-"}</span><time>${formatDateTime(row.updated_at)}</time></div>`).join(""):`<div class="empty-state compact"><div><h2>${t("noRows")}</h2></div></div>`}</div>`;}

  async function renderDiscounts(page) {
    const data = await api("/api/admin/discounts");
    const discounts = data.discounts || [];
    const active = discounts.filter(item => ["active", "expiring_soon"].includes(item.status)).length;
    const scheduled = discounts.filter(item => item.status === "scheduled").length;
    const expired = discounts.filter(item => item.status === "expired").length;
    const used = discounts.reduce((sum, item) => sum + Number(item.used_count || 0), 0);
    page.innerHTML = pageTitle("discounts", "discountsSub", `<button class="btn primary" id="addDiscountBtn">${i("plus")}${t("add")}</button>`);
    page.innerHTML += `
      <div class="grid kpi-grid">
        ${kpi("active", active, active ? "healthy" : "empty", "tag")}
        ${kpi("scheduled", scheduled, scheduled ? "needsSetup" : "empty", "file")}
        ${kpi("expired", expired, expired ? "needsSetup" : "empty", "settings")}
        ${kpi("usedCount", used, used ? "healthy" : "empty", "cart")}
      </div>
      <div class="discount-grid" id="discountGrid">
        ${discounts.length ? discounts.map(discountCard).join("") : `<div class="card card-pad empty-discount"><div class="empty-illustration">${i("tag")}</div><h2>${t("noRows")}</h2><p class="muted">${t("discountsSub")}</p></div>`}
      </div>
    `;
    document.getElementById("addDiscountBtn").onclick = () => openDiscountEditor();
    document.querySelectorAll("[data-edit-discount]").forEach(btn => btn.onclick = () => openDiscountEditor(discounts.find(item => String(item.id) === btn.dataset.editDiscount)));
    document.querySelectorAll("[data-test-discount]").forEach(btn => btn.onclick = () => openDiscountTester(discounts.find(item => String(item.id) === btn.dataset.testDiscount)));
    document.querySelectorAll("[data-delete-discount]").forEach(btn => btn.onclick = () => deleteDiscount(btn.dataset.deleteDiscount));
    document.querySelectorAll("[data-toggle-discount]").forEach(btn => btn.onclick = () => toggleDiscount(discounts.find(item => String(item.id) === btn.dataset.toggleDiscount)));
    startDiscountTimers();
  }

  function discountCard(discount = {}) {
    const status = discount.status || discountStatus(discount);
    const usageLimit = discount.usage_limit ? Number(discount.usage_limit) : 0;
    const used = Number(discount.used_count || 0);
    const usagePercent = usageLimit ? Math.min(100, Math.round((used / usageLimit) * 100)) : 0;
    return `
      <article class="discount-card ${status}">
        <div class="discount-card-head">
          <div>
            <span class="discount-code">${escapeHtml(discount.code || "-")}</span>
            <h2>${escapeHtml(state.lang === "ar" ? discount.name_ar || discount.name_en : discount.name_en || discount.name_ar || discount.code)}</h2>
            <small class="promotion-group-label">${escapeHtml(discount.combination_group || "order")} · ${escapeHtml(discount.stacking_policy || "same_group_blocked")}</small>
          </div>
          <span class="status-pill ${discountStatusTone(status)}">${discountStatusLabel(status)}</span>
        </div>
        <div class="discount-value">
          <strong>${discountValueLabel(discount)}</strong>
          <span>${t(discount.applies_to === "products" ? "selectedProducts" : discount.applies_to === "categories" ? "selectedCategories" : "allProducts")}</span>
        </div>
        <div class="discount-timeline">
          <div><span>${t("startsAt")}</span><strong>${formatDateTime(discount.starts_at)}</strong></div>
          <div><span>${t("endsAt")}</span><strong>${formatDateTime(discount.ends_at)}</strong></div>
        </div>
        <div class="discount-countdown">
          <span>${t("timeLeft")}</span>
          <strong data-discount-countdown="${escapeHtml(discount.ends_at || "")}">${formatCountdown(discount.ends_at)}</strong>
        </div>
        <div class="discount-usage">
          <div class="switch-row"><span>${t("usedCount")}</span><strong>${used}${usageLimit ? ` / ${usageLimit}` : ""}</strong></div>
          <div class="discount-progress"><span style="width:${usageLimit ? usagePercent : 0}%"></span></div>
        </div>
        <div class="discount-actions">
          <button class="btn" type="button" data-test-discount="${discount.id}">${i("tag")}${t("testDiscount")}</button>
          <button class="btn" type="button" data-edit-discount="${discount.id}">${i("edit")}${t("edit")}</button>
          <div data-toggle-discount="${discount.id}">${switchButton({ field: "discount_is_active", value: discount.is_active !== false, id: "", label: true })}</div>
          <button class="btn icon-btn danger" type="button" data-delete-discount="${discount.id}" title="${t("delete")}">${i("trash")}</button>
        </div>
      </article>
    `;
  }

  function discountValueLabel(discount = {}) {
    if (discount.type === "free_shipping") return t("freeShipping");
    if (discount.type === "fixed") return `${Number(discount.value || 0).toLocaleString(state.lang === "ar" ? "ar-EG" : "en-US")} EGP`;
    return `${Number(discount.value || 0)}%`;
  }

  function openDiscountTester(discount = {}) {
    const products = state.rows.products || [];
    const money = value => `${Number(value || 0).toLocaleString(state.lang === "ar" ? "ar-EG" : "en-US")} EGP`;
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal-backdrop" id="discountTestModal">
        <div class="modal product-picker-modal discount-test-modal">
          <div class="modal-head"><div><h2>${t("testDiscount")}: ${escapeHtml(discount.code || "")}</h2><p class="muted">${t("testDiscountHint")}</p></div><button class="btn icon-btn" type="button" data-close-discount-test>×</button></div>
          <div class="modal-body">
            <div class="discount-test-toolbar"><button class="btn" type="button" id="selectAllDiscountTest">${t("selectAll")}</button><span class="muted small" id="discountTestCount">0 / ${products.length}</span></div>
            <div class="product-picker-grid discount-test-products">
              ${products.map(product => `
                <button class="product-picker-card" type="button" data-test-product="${product.id}">
                  <img src="${escapeHtml(product.main_photo_url || product.image_url || "/uploads/catalog/gift.png")}" alt="" />
                  <span class="pill">${t("productCode")}: ${product.id}</span>
                  <strong>${escapeHtml(state.lang === "ar" ? product.name_ar || product.name_en : product.name_en || product.name_ar)}</strong>
                  <small>${escapeHtml(product.category_slug || "")}</small>
                </button>
              `).join("")}
            </div>
            <div class="discount-test-result" id="discountTestResult"></div>
          </div>
          <div class="modal-foot"><button class="btn" type="button" data-close-discount-test>${t("cancel")}</button><button class="btn primary" type="button" id="runDiscountTest">${t("runTest")}</button></div>
        </div>
      </div>
    `);
    const selected = new Set();
    const sync = () => {
      document.querySelectorAll("[data-test-product]").forEach(card => card.classList.toggle("selected", selected.has(Number(card.dataset.testProduct))));
      const count = document.getElementById("discountTestCount");
      if (count) count.textContent = `${selected.size} / ${products.length}`;
    };
    document.querySelectorAll("[data-close-discount-test]").forEach(btn => btn.onclick = () => document.getElementById("discountTestModal")?.remove());
    document.querySelectorAll("[data-test-product]").forEach(card => card.onclick = () => { const id = Number(card.dataset.testProduct); selected.has(id) ? selected.delete(id) : selected.add(id); sync(); });
    document.getElementById("selectAllDiscountTest").onclick = () => { selected.size === products.length ? selected.clear() : products.forEach(product => selected.add(Number(product.id))); sync(); };
    document.getElementById("runDiscountTest").onclick = async () => {
      const result = document.getElementById("discountTestResult");
      if (!selected.size) { result.innerHTML = `<div class="notice error">${t("selectAtLeastOne")}</div>`; return; }
      const chosen = products.filter(product => selected.has(Number(product.id)));
      try {
        const data = await api("/api/store/discounts/validate", { method:"POST", body:JSON.stringify({ code:discount.code, order_total:chosen.reduce((sum, product) => sum + Number(product.sale_price || product.price || 0), 0), product_ids:chosen.map(product => product.id), category_slugs:[...new Set(chosen.map(product => product.category_slug).filter(Boolean))], items:chosen.map(product => ({ key:`${product.id}:::test`, product_id:product.id, category_slug:product.category_slug, price:Number(product.sale_price || product.price || 0), quantity:1, name_ar:product.name_ar, name_en:product.name_en })) }) });
        result.innerHTML = `<div class="discount-test-summary"><div><span>${t("eligibleSubtotal")}</span><strong>${money(data.eligible_subtotal || 0)}</strong></div><div><span>${t("discountTotal")}</span><strong>${money(data.discount_amount || 0)}</strong></div></div><div class="discount-test-lines">${(data.line_discounts || []).map(line => { const product = products.find(item => Number(item.id) === Number(line.product_id)); return `<div class="discount-test-line"><span class="status-pill ${line.eligible ? "success" : "neutral"}">${t(line.eligible ? "eligible" : "notEligible")}</span><strong>${escapeHtml(state.lang === "ar" ? product?.name_ar || product?.name_en : product?.name_en || product?.name_ar || `#${line.product_id}`)}</strong><span>${line.eligible ? `-${money(line.discount_amount || 0)}` : "-"}</span></div>`; }).join("")}</div>`;
      } catch (error) {
        result.innerHTML = `<div class="notice error">${escapeHtml(error.message)}</div>`;
      }
    };
  }

  function discountStatus(discount = {}) {
    if (discount.is_active === false || discount.isActive === false || discount.active === false) return "disabled";
    const now = Date.now();
    const starts = discount.starts_at ? new Date(discount.starts_at).getTime() : null;
    const ends = discount.ends_at ? new Date(discount.ends_at).getTime() : null;
    const usageLimit = discount.usage_limit ? Number(discount.usage_limit) : 0;
    if (usageLimit && Number(discount.used_count || 0) >= usageLimit) return "used_up";
    if (starts && now < starts) return "scheduled";
    if (ends && now > ends) return "expired";
    if (ends && ends - now <= 24 * 60 * 60 * 1000) return "expiring_soon";
    return "active";
  }

  function discountStatusLabel(status) {
    const map = { active: "active", expiring_soon: "expiringSoon", scheduled: "scheduled", expired: "expired", disabled: "disabled", used_up: "usedUp" };
    return t(map[status] || status);
  }

  function discountStatusTone(status) {
    if (status === "active") return "good";
    if (status === "expiring_soon" || status === "scheduled") return "warn";
    return "empty";
  }

  function formatCountdown(value) {
    if (!value) return "-";
    const diff = new Date(value).getTime() - Date.now();
    if (diff <= 0) return t("expired");
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (days) return `${days}d ${hours}h`;
    if (hours) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  function startDiscountTimers() {
    clearInterval(state.discountTimer);
    state.discountTimer = setInterval(() => {
      document.querySelectorAll("[data-discount-countdown]").forEach(el => {
        el.textContent = formatCountdown(el.dataset.discountCountdown);
      });
    }, 60000);
  }

  function toLocalDateInput(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  function fromLocalDateInput(value) {
    return value ? new Date(value).toISOString() : null;
  }

  async function openDiscountEditor(row = {}) {
    await Promise.all(["products", "categories"].map(key => state.rows[key]?.length ? Promise.resolve(state.rows[key]) : loadResource(key).catch(() => [])));
    const isEdit = Boolean(row.id);
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal-backdrop" id="modal">
        <form class="modal discount-editor-modal" id="discountForm">
          <div class="modal-head">
            <div><h2>${isEdit ? t("edit") : t("add")} ${t("discounts")}</h2><p class="muted">${t("discountsSub")}</p></div>
            <button class="btn icon-btn" type="button" data-close>×</button>
          </div>
          <div class="modal-body">
            <div class="catalog-form-layout">
              <section class="catalog-form-section accent">
                <div class="section-kicker">01</div>
                <h3>${t("promoCode")}</h3>
                <div class="form-grid">
                  ${field("code", "promoCode", "text", row.code, true)}
                  ${field("name_en", "nameEn", "text", row.name_en, true)}
                  ${field("name_ar", "nameAr", "text", row.name_ar, true)}
                  ${field("is_active", "active", "checkbox", row.is_active)}
                </div>
              </section>
              <section class="catalog-form-section">
                <div class="section-kicker">02</div>
                <h3>${t("discountType")}</h3>
                <div class="form-grid">
                  ${discountSelect("type", "discountType", row.type || "percentage", [["percentage", t("percentage")], ["fixed", t("fixedAmount")], ["free_shipping", t("freeShipping")]])}
                  ${field("value", "discountValue", "number", row.value || 0)}
                  ${field("minimum_order_total", "minimumOrderTotal", "number", row.minimum_order_total || 0)}
                  ${field("usage_limit", "usageLimit", "number", row.usage_limit || "")}
                  ${field("used_count", "usedCount", "number", row.used_count || 0)}
                </div>
              </section>
              <section class="catalog-form-section">
                <div class="section-kicker">03</div>
                <h3>${t("timeLeft")}</h3>
                <div class="form-grid">
                  ${field("starts_at", "startsAt", "datetime-local", toLocalDateInput(row.starts_at))}
                  ${field("ends_at", "endsAt", "datetime-local", toLocalDateInput(row.ends_at))}
                </div>
              </section>
              <section class="catalog-form-section">
                <div class="section-kicker">04</div>
                <h3>${t("appliesTo")}</h3>
                <div class="form-grid single">
                  ${discountSelect("applies_to", "appliesTo", row.applies_to || "all_products", [["all_products", t("allProducts")], ["products", t("selectedProducts")], ["categories", t("selectedCategories")]])}
                  ${discountTargetControls(row)}
                </div>
              </section>
              <section class="catalog-form-section promotion-offer-settings">
                <div class="section-kicker">05</div>
                <h3>${ui("Combination & guest rules", "قواعد الدمج واستخدام الضيف")}</h3>
                <div class="form-grid">
                  ${promotionSelect("trigger_mode",ui("Activation mode", "طريقة التفعيل"), row.trigger_mode || "code", [["code",ui("Manual promo code", "كود يدوي")],["automatic",ui("Automatic offer", "عرض تلقائي")]])}
                  ${promotionSelect("combination_group",ui("Combination group", "مجموعة الدمج"), row.combination_group || (row.type==="free_shipping"?"shipping":"order"), [["product",ui("Product discount", "خصم منتج")],["order",ui("Order discount", "خصم طلب")],["bundle",ui("Bundle", "بندل")],["shipping",ui("Shipping", "شحن")],["gift",ui("Gift", "هدية")]])}
                  ${promotionSelect("stacking_policy",ui("Stacking policy", "سياسة الدمج"), row.stacking_policy || "same_group_blocked", [["exclusive",ui("Exclusive", "حصري")],["same_group_blocked",ui("Block same group", "منع نفس المجموعة")],["selected_only",ui("Selected offers only", "عروض محددة فقط")],["stackable",ui("Fully stackable", "قابل للجمع")],["best_offer",ui("Best offer wins", "أفضل عرض يفوز")]])}
                  <div class="field"><label>${ui("Priority", "الأولوية")}</label><input name="priority" type="number" value="${Number(row.priority||100)}" /></div>
                  <div class="field"><label>${ui("Uses per customer", "عدد الاستخدامات لكل عميل")}</label><input name="per_customer_limit" type="number" min="0" value="${Number(row.per_customer_limit??1)}" /><small>${ui("Zero means unlimited", "صفر يعني غير محدود")}</small></div>
                </div>
                <div class="offer-switch-grid">
                  <div class="policy-toggle"><div><strong>${ui("Allow guests", "السماح للضيف")}</strong><small>${ui("Identify the browser with a signed guest token", "تعريف المتصفح بهوية ضيف موقعة")}</small></div><input type="hidden" name="allow_guests" value="${row.allow_guests!==false}" />${switchButton({field:"allow_guests",value:row.allow_guests!==false,label:false})}</div>
                  <div class="policy-toggle"><div><strong>${ui("First order only", "أول طلب فقط")}</strong><small>${ui("Check guest, phone, email, and account history", "فحص سجل الضيف والهاتف والبريد والحساب")}</small></div><input type="hidden" name="first_order_only" value="${row.first_order_only===true}" />${switchButton({field:"first_order_only",value:row.first_order_only===true,label:false})}</div>
                  <div class="policy-toggle"><div><strong>${ui("Apply to bundles", "يطبق على البندلز")}</strong><small>${ui("Allow this offer to affect bundle lines", "السماح للعرض بالتأثير على سطور البندل")}</small></div><input type="hidden" name="applies_to_bundles" value="${row.applies_to_bundles!==false}" />${switchButton({field:"applies_to_bundles",value:row.applies_to_bundles!==false,label:false})}</div>
                </div>
                <div class="identity-methods"><strong>${ui("Customer matching signals", "وسائل مطابقة العميل")}</strong>${[["guest",ui("Guest device", "جهاز الضيف")],["user",ui("Account", "الحساب")],["phone",ui("Phone", "الهاتف")],["email",ui("Email", "البريد")],["payment",ui("Payment identity", "هوية الدفع")]].map(([value,label])=>`<label><input type="checkbox" name="usage_identity" value="${value}" ${(row.usage_identity||["guest","user","phone","email"]).includes(value)?"checked":""}/><span>${label}</span></label>`).join("")}</div>
              </section>
            </div>
          </div>
          <div class="modal-foot"><button class="btn" type="button" data-close>${t("cancel")}</button><button class="btn primary" type="submit">${t("save")}</button></div>
        </form>
      </div>
    `);
    document.querySelectorAll("[data-close]").forEach(btn => btn.onclick = closeModal);
    document.querySelectorAll("[data-form-switch]").forEach(btn => btn.onclick = () => updateFormSwitch(btn));
    bindDiscountTargetControls();
    document.getElementById("discountForm").onsubmit = (event) => saveDiscount(event, row.id);
  }

  function discountSelect(name, labelKey, value, options) {
    return `<div class="field"><label>${t(labelKey)}</label><select name="${name}">${options.map(([optionValue, optionLabel]) => `<option value="${optionValue}" ${optionValue === value ? "selected" : ""}>${optionLabel}</option>`).join("")}</select></div>`;
  }

  function promotionSelect(name, label, value, options) {
    return `<div class="field"><label>${label}</label><select name="${name}">${options.map(([optionValue, optionLabel]) => `<option value="${optionValue}" ${optionValue === value ? "selected" : ""}>${optionLabel}</option>`).join("")}</select></div>`;
  }

  function discountTargetControls(row = {}) {
    const productIds = Array.isArray(row.product_ids) ? row.product_ids.map(Number).filter(Boolean) : [];
    const categorySlugs = Array.isArray(row.category_slugs) ? row.category_slugs.map(String).filter(Boolean) : [];
    return `
      <div class="discount-target-shell">
        <p class="muted small">${t("targetHint")}</p>
        <input type="hidden" name="product_ids" value="${escapeHtml(JSON.stringify(productIds))}" data-discount-target-value="products" />
        <input type="hidden" name="category_slugs" value="${escapeHtml(JSON.stringify(categorySlugs))}" data-discount-target-value="categories" />
        <div class="discount-target-panel" data-discount-target="categories">
          <div class="discount-target-head">
            <div><strong>${t("selectedCategories")}</strong><span class="muted small">${t("selectedCategories")}</span></div>
            <button class="btn" type="button" id="chooseDiscountCategories">${t("chooseCategories")}</button>
          </div>
          <div class="discount-chip-list" data-chip-list="categories">${categorySlugs.map(categoryChip).join("") || emptyTargetText()}</div>
        </div>
        <div class="discount-target-panel" data-discount-target="products">
          <div class="discount-target-head">
            <div><strong>${t("selectedProducts")}</strong><span class="muted small">${t("selectedProducts")}</span></div>
            <div class="toolbar">
              <button class="btn" type="button" id="allCategoryProducts">${t("allProductsInCategories")}</button>
              <button class="btn" type="button" id="chooseDiscountProducts">${t("chooseProducts")}</button>
            </div>
          </div>
          <div class="discount-chip-list" data-chip-list="products">${productIds.map(productChip).join("") || emptyTargetText()}</div>
        </div>
      </div>
    `;
  }

  function emptyTargetText() {
    return `<span class="muted small">${t("noRows")}</span>`;
  }

  function productLabelById(id) {
    const product = (state.rows.products || []).find(item => Number(item.id) === Number(id));
    return product ? `${product.id} · ${product.name_en || product.name_ar || `Product ${product.id}`}` : `#${id}`;
  }

  function categoryLabelBySlug(slug) {
    const category = (state.rows.categories || []).find(item => String(item.slug || slugFromText(item.name_en || item.name_ar)) === String(slug));
    return category ? `${category.name_en || category.name_ar || slug}` : slug;
  }

  function productChip(id) {
    return `<button class="discount-chip" type="button" data-remove-target="products" data-target-value="${Number(id)}"><span>${escapeHtml(productLabelById(id))}</span><strong>×</strong></button>`;
  }

  function categoryChip(slug) {
    return `<button class="discount-chip" type="button" data-remove-target="categories" data-target-value="${escapeHtml(slug)}"><span>${escapeHtml(categoryLabelBySlug(slug))}</span><strong>×</strong></button>`;
  }

  function readDiscountTarget(kind) {
    return parseJsonArray(document.querySelector(`[data-discount-target-value="${kind}"]`)?.value);
  }

  function writeDiscountTarget(kind, values) {
    const clean = kind === "products" ? values.map(Number).filter(Boolean) : values.map(String).filter(Boolean);
    const hidden = document.querySelector(`[data-discount-target-value="${kind}"]`);
    if (hidden) hidden.value = JSON.stringify([...new Set(clean)]);
    renderDiscountTargetChips(kind);
  }

  function renderDiscountTargetChips(kind) {
    const values = readDiscountTarget(kind);
    const list = document.querySelector(`[data-chip-list="${kind}"]`);
    if (!list) return;
    const mode = document.querySelector('[name="applies_to"]')?.value || "all_products";
    if (kind === "products" && mode === "categories" && !values.length) {
      list.innerHTML = `<span class="discount-chip static"><span>${t("allProductsInCategories")}</span></span>`;
    } else {
      list.innerHTML = values.length ? values.map(kind === "products" ? productChip : categoryChip).join("") : emptyTargetText();
    }
    bindDiscountChipRemove();
  }

  function bindDiscountChipRemove() {
    document.querySelectorAll("[data-remove-target]").forEach(btn => {
      btn.onclick = () => {
        const kind = btn.dataset.removeTarget;
        const value = btn.dataset.targetValue;
        const values = readDiscountTarget(kind).filter(item => String(item) !== String(value));
        writeDiscountTarget(kind, values);
        if (kind === "categories") filterDiscountProductsToCategories();
      };
    });
  }

  function bindDiscountTargetControls() {
    const applies = document.querySelector('[name="applies_to"]');
    const syncVisibility = () => {
      const mode = applies?.value || "all_products";
      document.querySelectorAll("[data-discount-target]").forEach(panel => {
        panel.hidden = mode === "all_products" || (mode === "products" && panel.dataset.discountTarget === "categories");
      });
      const allCategoryProductsBtn = document.getElementById("allCategoryProducts");
      if (allCategoryProductsBtn) allCategoryProductsBtn.hidden = mode !== "categories";
      if (mode === "all_products") {
        writeDiscountTarget("products", []);
        writeDiscountTarget("categories", []);
      }
      if (mode === "products") writeDiscountTarget("categories", []);
      if (mode === "categories") filterDiscountProductsToCategories();
    };
    applies.onchange = syncVisibility;
    document.getElementById("chooseDiscountProducts").onclick = () => openDiscountProductPicker();
    document.getElementById("chooseDiscountCategories").onclick = () => openDiscountCategoryPicker();
    document.getElementById("allCategoryProducts").onclick = () => {
      writeDiscountTarget("products", []);
      renderDiscountTargetChips("products");
    };
    bindDiscountChipRemove();
    syncVisibility();
  }

  function filterDiscountProductsToCategories() {
    const mode = document.querySelector('[name="applies_to"]')?.value;
    if (mode !== "categories") return;
    const selectedCategories = readDiscountTarget("categories");
    if (!selectedCategories.length) return writeDiscountTarget("products", []);
    const allowed = new Set((state.rows.products || []).filter(product => selectedCategories.includes(product.category_slug)).map(product => Number(product.id)));
    writeDiscountTarget("products", readDiscountTarget("products").filter(id => allowed.has(Number(id))));
  }

  function openDiscountProductPicker() {
    const mode = document.querySelector('[name="applies_to"]')?.value || "all_products";
    const selectedCategories = readDiscountTarget("categories");
    const selectedProducts = readDiscountTarget("products").map(Number);
    const products = (state.rows.products || []).filter(product => mode !== "categories" || selectedCategories.includes(product.category_slug));
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal-backdrop" id="discountPickerModal">
        <div class="modal product-picker-modal">
          <div class="modal-head"><h2>${t("chooseProducts")}</h2><button class="btn icon-btn" type="button" data-close-discount-picker>×</button></div>
          <div class="modal-body">
            <div class="product-picker-grid">
              ${products.map(product => `
                <button class="product-picker-card ${selectedProducts.includes(Number(product.id)) ? "selected" : ""}" type="button" data-discount-pick-product="${product.id}">
                  <img src="${escapeHtml(product.main_photo_url || product.image_url || "/uploads/catalog/gift.png")}" alt="" />
                  <span class="pill">${t("productCode")}: ${product.id}</span>
                  <strong>${escapeHtml(product.name_en || product.name_ar || `Product ${product.id}`)}</strong>
                  <small>${escapeHtml(product.category_slug || "")}</small>
                </button>
              `).join("") || `<div class="empty-state compact"><div><h2>${t("noRows")}</h2><p class="muted">${t("targetHint")}</p></div></div>`}
            </div>
          </div>
        </div>
      </div>
    `);
    document.querySelectorAll("[data-close-discount-picker]").forEach(btn => btn.onclick = () => document.getElementById("discountPickerModal")?.remove());
    document.querySelectorAll("[data-discount-pick-product]").forEach(btn => {
      btn.onclick = () => {
        const id = Number(btn.dataset.discountPickProduct);
        const current = readDiscountTarget("products").map(Number);
        const next = current.includes(id) ? current.filter(item => item !== id) : [...current, id];
        btn.classList.toggle("selected", !current.includes(id));
        writeDiscountTarget("products", next);
      };
    });
  }

  function openDiscountCategoryPicker() {
    const selectedCategories = readDiscountTarget("categories");
    const categories = state.rows.categories || [];
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal-backdrop" id="discountPickerModal">
        <div class="modal product-picker-modal">
          <div class="modal-head"><h2>${t("chooseCategories")}</h2><button class="btn icon-btn" type="button" data-close-discount-picker>×</button></div>
          <div class="modal-body">
            <div class="product-picker-grid">
              ${categories.map(category => {
                const slug = category.slug || slugFromText(category.name_en || category.name_ar);
                return `
                  <button class="product-picker-card ${selectedCategories.includes(slug) ? "selected" : ""}" type="button" data-discount-pick-category="${escapeHtml(slug)}">
                    <img src="${escapeHtml(category.image_url || "/uploads/catalog/gift.png")}" alt="" />
                    <span class="pill">${escapeHtml(slug)}</span>
                    <strong>${escapeHtml(category.name_en || category.name_ar || slug)}</strong>
                    <small>${escapeHtml(category.name_ar || "")}</small>
                  </button>
                `;
              }).join("") || `<div class="empty-state compact"><div><h2>${t("noRows")}</h2><p class="muted">${t("targetHint")}</p></div></div>`}
            </div>
          </div>
        </div>
      </div>
    `);
    document.querySelectorAll("[data-close-discount-picker]").forEach(btn => btn.onclick = () => document.getElementById("discountPickerModal")?.remove());
    document.querySelectorAll("[data-discount-pick-category]").forEach(btn => {
      btn.onclick = () => {
        const slug = btn.dataset.discountPickCategory;
        const current = readDiscountTarget("categories").map(String);
        const next = current.includes(slug) ? current.filter(item => item !== slug) : [...current, slug];
        btn.classList.toggle("selected", !current.includes(slug));
        writeDiscountTarget("categories", next);
        filterDiscountProductsToCategories();
      };
    });
  }

  async function saveDiscount(event, id) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form);
    payload.value = Number(payload.value || 0);
    payload.minimum_order_total = Number(payload.minimum_order_total || 0);
    payload.usage_limit = payload.usage_limit === "" ? null : Number(payload.usage_limit || 0);
    payload.used_count = Number(payload.used_count || 0);
    payload.is_active = payload.is_active !== "false";
    payload.starts_at = fromLocalDateInput(payload.starts_at);
    payload.ends_at = fromLocalDateInput(payload.ends_at);
    payload.product_ids = parseJsonArray(payload.product_ids).map(Number).filter(Boolean);
    payload.category_slugs = parseJsonArray(payload.category_slugs).map(String).filter(Boolean);
    payload.priority = Number(payload.priority || 100);
    payload.per_customer_limit = Number(payload.per_customer_limit || 0);
    payload.allow_guests = payload.allow_guests !== "false";
    payload.first_order_only = payload.first_order_only === "true";
    payload.applies_to_bundles = payload.applies_to_bundles !== "false";
    payload.usage_identity = [...event.currentTarget.querySelectorAll('[name="usage_identity"]:checked')].map(input => input.value);
    if (payload.applies_to === "all_products") {
      payload.product_ids = [];
      payload.category_slugs = [];
    }
    if (payload.applies_to === "products") payload.category_slugs = [];
    try {
      await api(id ? `/api/admin/discounts/${id}` : "/api/admin/discounts", { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
      closeModal();
      toast(id ? t("updated") : t("created"));
      renderDiscounts(document.getElementById("page"));
    } catch (error) {
      toast(error.message, "error");
    }
  }

  async function toggleDiscount(row = {}) {
    await api(`/api/admin/discounts/${row.id}`, { method: "PATCH", body: JSON.stringify({ is_active: row.is_active === false }) });
    toast(t("updated"));
    renderDiscounts(document.getElementById("page"));
  }

  async function deleteDiscount(id) {
    await api(`/api/admin/discounts/${id}`, { method: "DELETE" });
    toast(t("deleted"));
    renderDiscounts(document.getElementById("page"));
  }

  function brandColorField(name, label, value) {
    const color = value || "#000000";
    return `<div class="field brand-color-field"><label>${label}</label><div class="brand-color-control"><input type="color" name="${name}" value="${escapeHtml(color)}" data-color-picker="${name}" /><span class="brand-color-swatch" style="--swatch:${escapeHtml(color)}"></span><input type="text" value="${escapeHtml(color)}" data-color-text="${name}" maxlength="7" /></div></div>`;
  }

  function brandPreviewHtml(values = {}) {
    const logo = values.logo_url || "/logo-premiumbrand.png";
    const logoLight = values.logo_light_url || logo;
    const storeName = state.lang === "ar" ? (values.site_name_ar || values.site_name_en || "اسم المتجر") : (values.site_name_en || values.site_name_ar || "Store name");
    const tagline = state.lang === "ar" ? (values.tagline_ar || "أناقة تعبّر عن هويتك") : (values.tagline_en || "Elegance shaped around you");
    const currency = values.preview_currency_symbol || (state.lang === "ar" ? "ر.س" : "SAR");
    return `
      <div class="store-preview" style="--preview-primary:${escapeHtml(values.primary_color || "#583A80")};--preview-primary-dark:${escapeHtml(values.primary_dark_color || "#3B215D")};--preview-sale:${escapeHtml(values.sale_color || "#C62828")};--preview-footer:${escapeHtml(values.footer_color || "#23190E")};--preview-surface:${escapeHtml(values.surface_color || "#FFFFFF")};--preview-header:${escapeHtml(values.header_color || "#FCFCFC")};--preview-text:${escapeHtml(values.text_color || "#222222")};--preview-muted:${escapeHtml(values.muted_color || "#777777")};--preview-font-ar:${escapeHtml(values.font_ar || "Noto Kufi Arabic, sans-serif")};--preview-font-en:${escapeHtml(values.font_en || "Inter, sans-serif")};--preview-card-radius:${Number(values.card_radius || 20)}px;--preview-button-radius:${Number(values.button_radius || 100)}px;--preview-input-radius:${Number(values.input_radius || 8)}px;">
        <div class="preview-browser-bar"><span></span><span></span><span></span><strong>${escapeHtml(storeName)}</strong></div>
        <div class="preview-announcement">${ui("Free shipping when you buy two items or more", "شحن مجاني عند شراء قطعتين أو أكثر")}</div>
        <header class="preview-header"><img src="${escapeHtml(logo)}" alt="" /><nav><span>${ui("Home", "الرئيسية")}</span><span>${ui("Shop", "المتجر")}</span><span>${ui("Contact", "تواصل معنا")}</span></nav><div class="preview-header-icons">⌕ ♡ ◯</div></header>
        <section class="preview-hero"><div><span>${ui("New collection", "مجموعة جديدة")}</span><h2>${escapeHtml(tagline)}</h2><p>${ui("A live storefront sample using your current identity settings.", "نموذج حي من المتجر باستخدام إعدادات الهوية الحالية.")}</p><button>${ui("Shop now", "تسوق الآن")}</button></div><div class="preview-hero-mark"><img src="${escapeHtml(logo)}" alt="" /></div></section>
        <div class="preview-section-title"><div><span>${ui("Featured", "مختاراتنا")}</span><h3>${ui("Storefront components", "عناصر واجهة المتجر")}</h3></div><a>${ui("View all", "مشاهدة الكل")}</a></div>
        <div class="preview-products">
          ${[
            { name:ui("Premium prayer set", "طقم صلاة فاخر"), color:"#7C2034", sale:"129", old:"179" },
            { name:ui("Soft patterned isdal", "إسدال مشجر ناعم"), color:"#274C77", sale:"149", old:"199" }
          ].map((product, index) => `<article class="preview-product"><div class="preview-product-image"><span class="preview-sale">${ui("SALE", "خصم")}</span><div class="preview-product-shape shape-${index + 1}" style="--product-color:${product.color}"></div><button class="preview-wish">♡</button></div><div class="preview-swatches"><span style="background:${product.color}"></span><span style="background:#E7D7C9"></span><span style="background:#111827"></span></div><small>${ui("Prayer collection", "مجموعة الصلاة")}</small><strong>${product.name}</strong><div class="preview-price"><del>${product.old} ${currency}</del><b>${product.sale} ${currency}</b></div></article>`).join("")}
        </div>
        <div class="preview-controls"><input placeholder="${ui("Email address", "البريد الإلكتروني")}" /><button>${ui("Subscribe", "اشتراك")}</button><span class="preview-chip">${ui("Active", "نشط")}</span><span class="preview-chip muted">${ui("Default", "افتراضي")}</span></div>
        <footer class="preview-footer"><div><img src="${escapeHtml(logoLight)}" alt="" /><p>${escapeHtml(state.lang === "ar" ? (values.description_ar || "وصف مختصر يعكس هوية المتجر.") : (values.description_en || "A short description of the store identity."))}</p></div><div><strong>${ui("Contact", "تواصل معنا")}</strong><span>${escapeHtml(values.phone || "+966 00 000 0000")}</span><span>${escapeHtml(state.lang === "ar" ? (values.address_ar || "العنوان") : (values.address_en || "Address"))}</span></div><div><strong>${ui("Information", "معلومات")}</strong><span>${ui("About us", "من نحن")}</span><span>${ui("Store policy", "سياسة المتجر")}</span></div></footer>
      </div>
    `;
  }

  function brandStudioValues(form) {
    const data = Object.fromEntries(new FormData(form));
    form.querySelectorAll("[data-color-text]").forEach(input => { data[input.dataset.colorText] = input.value; });
    return data;
  }

  async function renderBrandStudio(page) {
    const [company, brand, currencies] = await Promise.all([api("/api/admin/company-info"), api("/api/admin/brand-identity"), api("/api/admin/currencies")]);
    const base = currencies.currencies?.find(currency => currency.code === currencies.base_currency) || currencies.currencies?.[0] || {};
    const initial = { ...company, ...brand, preview_currency_symbol:state.lang === "ar" ? base.symbol_ar : base.symbol_en };
    page.innerHTML = pageTitle("brandStudio", "", `<button class="btn" type="button" id="applyReferencePreset">${i("palette")}${ui("Reference preset", "ألوان التصميم المرجعي")}</button><button class="btn primary" type="submit" form="brandStudioForm">${t("save")}</button>`);
    page.innerHTML += `
      <form id="brandStudioForm" class="brand-studio-grid">
        <div class="brand-editor">
          <section class="studio-card"><div class="studio-card-head"><span class="section-kicker">01</span><div><h2>${ui("Brand assets", "ملفات الهوية")}</h2><p>${ui("Upload the primary logo, footer logo and favicon.", "ارفع الشعار الأساسي وشعار الفوتر والأيقونة.")}</p></div></div><div class="brand-assets-grid">${imageUploadField("logo_url", "logo", company.logo_url)}${imageUploadField("logo_light_url", "logo", company.logo_light_url)}${imageUploadField("favicon_url", "favicon", company.favicon_url)}</div></section>
          <section class="studio-card"><div class="studio-card-head"><span class="section-kicker">02</span><div><h2>${ui("Store identity", "بيانات المتجر")}</h2><p>${ui("The public identity shown across header, footer and metadata.", "البيانات العامة التي تظهر في الهيدر والفوتر والصفحات.")}</p></div></div><div class="form-grid">${field("site_name_en", "siteNameEn", "text", company.site_name_en)}${field("site_name_ar", "siteNameAr", "text", company.site_name_ar)}${field("tagline_en", "descriptionEn", "text", company.tagline_en)}${field("tagline_ar", "descriptionAr", "text", company.tagline_ar)}${field("description_en", "descriptionEn", "textarea", company.description_en)}${field("description_ar", "descriptionAr", "textarea", company.description_ar)}</div></section>
          <section class="studio-card"><div class="studio-card-head"><span class="section-kicker">03</span><div><h2>${ui("Color system", "نظام الألوان")}</h2><p>${ui("Every storefront color is a reusable semantic token.", "كل لون مرتبط بوظيفة ثابتة داخل واجهة المتجر.")}</p></div></div><div class="brand-color-grid">${brandColorField("primary_color", ui("Primary", "الأساسي"), brand.primary_color)}${brandColorField("primary_dark_color", ui("Primary dark", "الأساسي الداكن"), brand.primary_dark_color)}${brandColorField("sale_color", ui("Sale", "التخفيض"), brand.sale_color)}${brandColorField("footer_color", ui("Footer", "الفوتر"), brand.footer_color)}${brandColorField("surface_color", ui("Surface", "السطح"), brand.surface_color)}${brandColorField("header_color", ui("Header", "الهيدر"), brand.header_color)}${brandColorField("text_color", ui("Text", "النص"), brand.text_color)}${brandColorField("muted_color", ui("Muted text", "النص الثانوي"), brand.muted_color)}</div></section>
          <section class="studio-card"><div class="studio-card-head"><span class="section-kicker">04</span><div><h2>${ui("Typography & shape", "الخطوط والشكل")}</h2><p>${ui("Choose the storefront voice and component geometry.", "اختار شخصية الخطوط واستدارة عناصر المتجر.")}</p></div></div><div class="form-grid"><div class="field"><label>${ui("Arabic font stack", "الخط العربي")}</label><select name="font_ar">${["Jannah LT, Noto Kufi Arabic, sans-serif","Noto Kufi Arabic, sans-serif","Cairo, sans-serif","Tajawal, sans-serif","IBM Plex Sans Arabic, sans-serif"].map(value=>`<option value="${escapeHtml(value)}" ${brand.font_ar===value?"selected":""}>${escapeHtml(value.split(",")[0])}</option>`).join("")}</select></div><div class="field"><label>${ui("English font stack", "الخط الإنجليزي")}</label><select name="font_en">${["Inter, sans-serif","Manrope, sans-serif","Space Grotesk, sans-serif","Plus Jakarta Sans, sans-serif"].map(value=>`<option value="${escapeHtml(value)}" ${brand.font_en===value?"selected":""}>${escapeHtml(value.split(",")[0])}</option>`).join("")}</select></div>${labeledField("heading_weight",ui("Heading weight", "سُمك العناوين"),brand.heading_weight,"number",{min:400,max:900,step:100})}${labeledField("body_weight",ui("Body weight", "سُمك النص"),brand.body_weight,"number",{min:300,max:700,step:100})}${labeledField("card_radius",ui("Card radius", "استدارة الكروت"),brand.card_radius,"number",{min:0,max:40})}${labeledField("button_radius",ui("Button radius", "استدارة الأزرار"),brand.button_radius,"number",{min:0,max:100})}${labeledField("input_radius",ui("Input radius", "استدارة الحقول"),brand.input_radius,"number",{min:0,max:24})}<div class="field"><label>${ui("Product image ratio", "نسبة صورة المنتج")}</label><select name="product_image_ratio"><option value="1 / 1" ${brand.product_image_ratio==="1 / 1"?"selected":""}>1:1</option><option value="4 / 5" ${brand.product_image_ratio==="4 / 5"?"selected":""}>4:5</option><option value="3 / 4" ${brand.product_image_ratio==="3 / 4"?"selected":""}>3:4</option></select></div><div class="field"><label>${ui("Shadow style", "أسلوب الظلال")}</label><select name="shadow_style"><option value="none" ${brand.shadow_style==="none"?"selected":""}>${ui("None", "بدون")}</option><option value="soft" ${brand.shadow_style==="soft"?"selected":""}>${ui("Soft", "ناعم")}</option><option value="defined" ${brand.shadow_style==="defined"?"selected":""}>${ui("Defined", "واضح")}</option></select></div></div></section>
          <section class="studio-card"><div class="studio-card-head"><span class="section-kicker">05</span><div><h2>${ui("Contact & trust", "التواصل والثقة")}</h2><p>${ui("Business details used by the footer and contact page.", "بيانات الشركة المستخدمة في الفوتر وصفحة التواصل.")}</p></div></div><div class="form-grid">${field("email", "email", "email", company.email)}${field("phone", "phone", "text", company.phone)}${field("whatsapp", "whatsapp", "text", company.whatsapp)}${labeledField("working_hours",ui("Working hours", "ساعات العمل"),company.working_hours)}${field("address_en", "addressEn", "textarea", company.address_en)}${field("address_ar", "addressAr", "textarea", company.address_ar)}${labeledField("commercial_registration",ui("Commercial registration", "السجل التجاري"),company.commercial_registration)}${labeledField("business_document",ui("Business document", "وثيقة العمل"),company.business_document)}${labeledField("facebook_url","Facebook",company.facebook_url,"url")}${labeledField("instagram_url","Instagram",company.instagram_url,"url")}${labeledField("tiktok_url","TikTok",company.tiktok_url,"url")}</div></section>
        </div>
        <aside class="brand-preview-shell"><div class="brand-preview-head"><div><span>${ui("LIVE PREVIEW", "معاينة حية")}</span><strong>${ui("Storefront specimen", "نموذج واجهة المتجر")}</strong></div><span class="live-dot">${ui("Live", "مباشر")}</span></div><div id="brandLivePreview">${brandPreviewHtml(initial)}</div></aside>
      </form>
    `;
    bindImageUploadFields();
    const form = document.getElementById("brandStudioForm");
    const refresh = () => { document.getElementById("brandLivePreview").innerHTML = brandPreviewHtml({ ...brandStudioValues(form), preview_currency_symbol:initial.preview_currency_symbol }); };
    form.querySelectorAll("input,select,textarea").forEach(input => input.addEventListener("input", refresh));
    form.querySelectorAll("[data-color-picker]").forEach(picker => picker.oninput = () => { const text=form.querySelector(`[data-color-text="${picker.dataset.colorPicker}"]`); const swatch=picker.closest(".brand-color-control")?.querySelector(".brand-color-swatch"); if(text) text.value=picker.value.toUpperCase(); if(swatch) swatch.style.setProperty("--swatch",picker.value); refresh(); });
    form.querySelectorAll(".brand-color-swatch").forEach(swatch => swatch.onclick = () => swatch.closest(".brand-color-control").querySelector("input[type='color']")?.click());
    form.querySelectorAll("[data-color-text]").forEach(text => text.oninput = () => { if(/^#[0-9a-f]{6}$/i.test(text.value)){ const picker=form.querySelector(`[data-color-picker="${text.dataset.colorText}"]`); const swatch=text.closest(".brand-color-control")?.querySelector(".brand-color-swatch"); if(picker) picker.value=text.value; if(swatch) swatch.style.setProperty("--swatch",text.value); } refresh(); });
    document.addEventListener("slyrah:image-uploaded", refresh, { once:false });
    document.getElementById("applyReferencePreset").onclick = () => { const preset={primary_color:"#583A80",primary_dark_color:"#3B215D",sale_color:"#C62828",footer_color:"#23190E",surface_color:"#FFFFFF",header_color:"#FCFCFC",text_color:"#222222",muted_color:"#777777",card_radius:20,button_radius:100,input_radius:8,font_ar:"Jannah LT, Noto Kufi Arabic, sans-serif"}; Object.entries(preset).forEach(([name,value])=>{const input=form.querySelector(`[name="${name}"]`);if(input)input.value=value;const text=form.querySelector(`[data-color-text="${name}"]`);if(text)text.value=value;}); refresh(); };
    form.onsubmit = async event => { event.preventDefault(); const data=brandStudioValues(form); const companyKeys=["logo_url","logo_light_url","favicon_url","site_name_en","site_name_ar","tagline_en","tagline_ar","description_en","description_ar","email","phone","whatsapp","working_hours","address_en","address_ar","commercial_registration","business_document","facebook_url","instagram_url","tiktok_url"]; const companyPayload=Object.fromEntries(companyKeys.map(key=>[key,data[key]||""])); const brandPayload={...data}; companyKeys.forEach(key=>delete brandPayload[key]); await Promise.all([api("/api/admin/company-info",{method:"PUT",body:JSON.stringify(companyPayload)}),api("/api/admin/brand-identity",{method:"PUT",body:JSON.stringify(brandPayload)})]); toast(t("saved")); };
  }

  function labeledField(name, labelText, value = "", type = "text", options = {}) {
    const attrs = [options.min !== undefined ? `min="${options.min}"` : "", options.max !== undefined ? `max="${options.max}"` : "", options.step !== undefined ? `step="${options.step}"` : ""].filter(Boolean).join(" ");
    return `<div class="field ${options.full ? "full" : ""}"><label>${labelText}</label><input name="${name}" type="${type}" value="${escapeHtml(value ?? "")}" ${attrs} /></div>`;
  }

  function namedValues(container) {
    return Object.fromEntries([...container.querySelectorAll("[name]")].map(input => [input.name, input.value]));
  }

  function countryFlag(code = "") {
    const letters = String(code).toUpperCase().slice(0, 2);
    if (letters.length !== 2) return "";
    return String.fromCodePoint(...[...letters].map(letter => 127397 + letter.charCodeAt(0)));
  }

  function goodsTypeEditorRow(row = {}, index = 0) {
    return `<article class="market-editor-row" data-goods-type-row>
      <input type="hidden" name="id" value="${escapeHtml(row.id || `goods-${index + 1}`)}" />
      <div class="market-row-title"><label class="default-radio"><input type="radio" name="goods_default" value="${escapeHtml(row.id || `goods-${index + 1}`)}" ${row.is_default ? "checked" : ""} /><span></span></label><div><strong>${escapeHtml(state.lang === "ar" ? (row.name_ar || row.name_en) : (row.name_en || row.name_ar))}</strong><small>${escapeHtml(row.code || "NORMAL")}</small></div></div>
      <div class="field"><label>${ui("Code", "الكود")}</label><input name="code" value="${escapeHtml(row.code || "NORMAL")}" /></div>
      <div class="field"><label>${ui("English name", "الاسم بالإنجليزية")}</label><input name="name_en" value="${escapeHtml(row.name_en || "")}" /></div>
      <div class="field"><label>${ui("Arabic name", "الاسم بالعربية")}</label><input name="name_ar" value="${escapeHtml(row.name_ar || "")}" /></div>
      <div class="field"><label>iMile</label><input name="imile_mapping" value="${escapeHtml(row.provider_mapping?.imile || "Normal")}" /></div>
      <div class="field market-switch-field"><input type="hidden" name="is_active" value="${row.is_active !== false}" />${switchButton({ field:"is_active", value:row.is_active !== false, label:false })}</div>
      <button class="btn icon-btn danger" type="button" data-remove-market-row title="${t("delete")}">${i("trash")}</button>
    </article>`;
  }

  function shippingProfileEditorRow(row = {}, goodsTypes = [], countries = [], index = 0) {
    const id = row.id || `profile-${Date.now()}-${index}`;
    return `<article class="market-editor-row shipping-profile-row" data-shipping-profile-row>
      <input type="hidden" name="id" value="${escapeHtml(id)}" />
      <div class="market-row-title"><label class="default-radio"><input type="radio" name="profile_default" value="${escapeHtml(id)}" ${row.is_default ? "checked" : ""} /><span></span></label><div><strong>${escapeHtml(state.lang === "ar" ? (row.name_ar || row.name_en || ui("New profile", "ملف جديد")) : (row.name_en || row.name_ar || "New profile"))}</strong><small>${escapeHtml(id)}</small></div></div>
      <div class="shipping-profile-names"><div class="field"><label>${ui("English name", "الاسم بالإنجليزية")}</label><input name="name_en" value="${escapeHtml(row.name_en || "")}" /></div><div class="field"><label>${ui("Arabic name", "الاسم بالعربية")}</label><input name="name_ar" value="${escapeHtml(row.name_ar || "")}" /></div><div class="field"><label>${t("goodsType")}</label><select name="goods_type_id">${goodsTypes.filter(item=>item.is_active!==false).map(item=>`<option value="${escapeHtml(item.id)}" ${item.id===(row.goods_type_id||"normal")?"selected":""}>${escapeHtml(state.lang==="ar"?item.name_ar:item.name_en)}</option>`).join("")}</select></div></div>
      <div class="shipping-profile-measures">${[["weight",t("weightKg")],["length",t("lengthCm")],["width",t("widthCm")],["height",t("heightCm")]].map(([name,label])=>`<div class="field compact-number"><label>${label}</label><input name="${name}" type="number" min="0" step="0.01" value="${row[name] ?? ""}" /></div>`).join("")}</div>
      <div class="field"><label>${t("countryOfOrigin")}</label><select name="origin_country_code">${countries.map(country=>`<option value="${country.code}" ${country.code===(row.origin_country_code||"SA")?"selected":""}>${countryFlag(country.code)} ${escapeHtml(state.lang==="ar"?country.name_ar:country.name_en)}</option>`).join("")}</select></div>
      <div class="field market-switch-field"><input type="hidden" name="is_active" value="${row.is_active !== false}" />${switchButton({ field:"is_active", value:row.is_active !== false, label:false })}</div>
      <button class="btn icon-btn danger" type="button" data-remove-market-row title="${t("delete")}">${i("trash")}</button>
    </article>`;
  }

  async function renderMarket(page) {
    const data = await api("/api/admin/market");
    const settings = data.settings || {};
    page.innerHTML = pageTitle("market", "", `<button class="btn primary" type="submit" form="marketForm">${t("save")}</button>`);
    page.innerHTML += `<form id="marketForm" class="market-settings-page">
      <section class="market-hero card"><div><span class="section-kicker">MARKET</span><h2>${ui("Where this store operates", "السوق الذي يعمل فيه المتجر")}</h2><p>${ui("Country drives addresses, shipping availability and future payment methods. Currency stays independently configurable.", "البلد يحدد العناوين والشحن ووسائل الدفع المتاحة مستقبلًا، بينما تظل العملة قابلة للتحكم بشكل مستقل.")}</p></div><div class="market-hero-flag"><span>${countryFlag(settings.default_country_code)}</span><div><strong>${escapeHtml((data.countries.find(row=>row.code===settings.default_country_code)||{} )[state.lang==="ar"?"name_ar":"name_en"] || "Saudi Arabia")}</strong><small>${settings.default_country_code} · ${data.currencies.base_currency}</small></div></div></section>
      <section class="market-section"><div class="market-section-head"><div><span class="section-kicker">01</span><h2>${ui("Countries", "البلدان")}</h2><p>${ui("Choose the main market and enable only countries you can fulfill.", "حدد السوق الأساسي وفعّل فقط البلدان التي يمكنك خدمتها.")}</p></div></div><div class="country-grid">${data.countries.map(country=>`<article class="country-card ${country.code===settings.default_country_code?"is-default":""}" data-country-card="${country.code}"><div class="country-flag">${countryFlag(country.code)}</div><div class="country-copy"><strong>${escapeHtml(state.lang==="ar"?country.name_ar:country.name_en)}</strong><span>${country.calling_code} · ${country.currency_code}</span></div><label class="default-country"><input type="radio" name="default_country_code" value="${country.code}" ${country.code===settings.default_country_code?"checked":""} /><span>${ui("Primary", "أساسي")}</span></label><div class="field country-active"><input type="hidden" name="is_active" value="${settings.enabled_country_codes.includes(country.code)}" />${switchButton({field:"is_active",value:settings.enabled_country_codes.includes(country.code),label:false,disabled:country.code===settings.default_country_code})}</div></article>`).join("")}</div></section>
      <section class="market-section"><div class="market-section-head"><div><span class="section-kicker">02</span><h2>${ui("Store defaults", "إعدادات المتجر الافتراضية")}</h2></div></div><div class="card card-pad form-grid"><div class="field"><label>${ui("Timezone", "المنطقة الزمنية")}</label><input name="timezone" value="${escapeHtml(settings.timezone)}" /></div><div class="field"><label>${ui("Mixed goods handling", "التعامل مع أنواع بضائع مختلفة")}</label><select name="mixed_goods_policy"><option value="review" ${settings.mixed_goods_policy==="review"?"selected":""}>${ui("Hold for review", "مراجعة قبل الشحن")}</option><option value="strictest" ${settings.mixed_goods_policy==="strictest"?"selected":""}>${ui("Use strictest type", "استخدم النوع الأكثر تقييدًا")}</option><option value="split" ${settings.mixed_goods_policy==="split"?"selected":""}>${ui("Split shipments", "قسّم الشحنات")}</option></select></div><div class="field"><label>${ui("Weight unit", "وحدة الوزن")}</label><select name="weight_unit"><option value="kg" ${settings.weight_unit==="kg"?"selected":""}>kg</option><option value="g" ${settings.weight_unit==="g"?"selected":""}>g</option></select></div><div class="field"><label>${ui("Dimension unit", "وحدة الأبعاد")}</label><select name="dimension_unit"><option value="cm" ${settings.dimension_unit==="cm"?"selected":""}>cm</option><option value="mm" ${settings.dimension_unit==="mm"?"selected":""}>mm</option></select></div></div></section>
      <section class="market-section"><div class="market-section-head"><div><span class="section-kicker">03</span><h2>${ui("Goods types", "أنواع البضائع")}</h2><p>${ui("Operational shipment classes, not storefront categories. Clothing uses Normal goods.", "تصنيف تشغيلي للشحنة وليس تصنيفًا في المتجر. الملابس تستخدم بضائع عادية.")}</p></div><button class="btn" id="addGoodsType" type="button">${i("plus")}${ui("Add type", "إضافة نوع")}</button></div><div class="market-editor-list" id="goodsTypesList">${data.goods_types.map(goodsTypeEditorRow).join("")}</div></section>
      <section class="market-section"><div class="market-section-head"><div><span class="section-kicker">04</span><h2>${ui("Shipping profiles", "ملفات الشحن")}</h2><p>${ui("Reusable package defaults. Product-level values can override them.", "قيم افتراضية قابلة لإعادة الاستخدام، ويمكن للمنتج استبدالها بقيم خاصة.")}</p></div><button class="btn" id="addShippingProfile" type="button">${i("plus")}${ui("Add profile", "إضافة ملف")}</button></div><div class="market-editor-list" id="shippingProfilesList">${data.shipping_profiles.map((row,index)=>shippingProfileEditorRow(row,data.goods_types,data.countries,index)).join("")}</div></section>
    </form>`;

    const marketForm = page.querySelector("#marketForm");
    if (!marketForm) return;
    const bindMarketRows = () => {
      marketForm.querySelectorAll("[data-form-switch]").forEach(btn => btn.onclick = () => updateFormSwitch(btn));
      marketForm.querySelectorAll("[data-remove-market-row]").forEach(btn => btn.onclick = () => btn.closest(".market-editor-row")?.remove());
    };
    bindMarketRows();
    marketForm.querySelectorAll('[name="default_country_code"]').forEach(input=>input.onchange=()=>{marketForm.querySelectorAll("[data-country-card]").forEach(card=>card.classList.toggle("is-default",card.dataset.countryCard===input.value));});
    const addGoodsType = marketForm.querySelector("#addGoodsType");
    const addShippingProfile = marketForm.querySelector("#addShippingProfile");
    if (addGoodsType) addGoodsType.onclick=()=>{const id=`goods-${Date.now()}`;marketForm.querySelector("#goodsTypesList")?.insertAdjacentHTML("beforeend",goodsTypeEditorRow({id,code:"NORMAL",name_en:"New goods type",name_ar:"نوع بضاعة جديد",provider_mapping:{imile:"Normal"},is_active:true},99));bindMarketRows();};
    if (addShippingProfile) addShippingProfile.onclick=()=>{marketForm.querySelector("#shippingProfilesList")?.insertAdjacentHTML("beforeend",shippingProfileEditorRow({},data.goods_types,data.countries,99));bindMarketRows();};
    marketForm.onsubmit=async event=>{
      event.preventDefault();
      const form=event.currentTarget;
      const defaultCountry=form.querySelector('[name="default_country_code"]:checked')?.value||"SA";
      const countries=data.countries.map(country=>{const card=form.querySelector(`[data-country-card="${country.code}"]`);return {...country,is_active:country.code===defaultCountry||card?.querySelector('[name="is_active"]')?.value==="true"};});
      const goodsDefault=form.querySelector('[name="goods_default"]:checked')?.value;
      const goodsTypes=[...form.querySelectorAll("[data-goods-type-row]")].map(row=>{const values=namedValues(row);return {id:values.id,code:values.code,name_en:values.name_en,name_ar:values.name_ar,provider_mapping:{imile:values.imile_mapping},is_active:values.is_active==="true",is_default:values.id===goodsDefault};});
      const profileDefault=form.querySelector('[name="profile_default"]:checked')?.value;
      const profiles=[...form.querySelectorAll("[data-shipping-profile-row]")].map(row=>{const values=namedValues(row);return {...values,weight:Number(values.weight||0),length:Number(values.length||0),width:Number(values.width||0),height:Number(values.height||0),requires_shipping:true,is_active:values.is_active==="true",is_default:values.id===profileDefault};});
      const top=namedValues(form.querySelector(".market-section .card"));
      try{await api("/api/admin/goods-types",{method:"PUT",body:JSON.stringify({goods_types:goodsTypes})});await api("/api/admin/shipping-profiles",{method:"PUT",body:JSON.stringify({shipping_profiles:profiles})});await api("/api/admin/market",{method:"PUT",body:JSON.stringify({countries,settings:{...top,default_country_code:defaultCountry,enabled_country_codes:countries.filter(row=>row.is_active).map(row=>row.code),default_goods_type_id:goodsDefault,default_shipping_profile_id:profileDefault},sync_currency:true})});state.marketCatalog=null;toast(t("saved"));renderMarket(page);}catch(error){toast(error.message,"error");}
    };
  }

  function currencyPriceSample(currency, baseAmount = 349) {
    const value = baseAmount * Number(currency.exchange_rate || 1);
    const digits = Number(currency.decimal_digits ?? 2);
    const amount = new Intl.NumberFormat(currency.locale || "en", { minimumFractionDigits:digits, maximumFractionDigits:digits }).format(value);
    const symbol = state.lang === "ar" ? (currency.symbol_ar || currency.code) : (currency.symbol_en || currency.code);
    return currency.symbol_position === "before" ? `${symbol} ${amount}` : `${amount} ${symbol}`;
  }

  function currencyCard(currency, baseCode) {
    return `
      <article class="currency-card ${currency.code === baseCode ? "is-base" : ""}" data-currency-card="${escapeHtml(currency.code)}">
        <div class="currency-card-head"><div class="currency-code"><span>${escapeHtml(currency.code)}</span><div><strong>${escapeHtml(state.lang === "ar" ? currency.name_ar : currency.name_en)}</strong><small>${currency.code === baseCode ? ui("Base currency", "العملة الأساسية") : ui("Store currency", "عملة المتجر")}</small></div></div><div class="field currency-switch"><input type="hidden" name="is_active" value="${currency.is_active !== false}" />${switchButton({ field:"is_active", value:currency.is_active !== false, label:false, disabled:currency.code === baseCode })}</div></div>
        <div class="currency-sample"><span>${ui("Price preview", "معاينة السعر")}</span><strong data-currency-preview>${escapeHtml(currencyPriceSample(currency))}</strong></div>
        <div class="form-grid compact">
          ${labeledField("name_en", ui("English name", "الاسم بالإنجليزية"), currency.name_en)}
          ${labeledField("name_ar", ui("Arabic name", "الاسم بالعربية"), currency.name_ar)}
          ${labeledField("symbol_en", ui("English symbol", "الرمز الإنجليزي"), currency.symbol_en)}
          ${labeledField("symbol_ar", ui("Arabic symbol", "الرمز العربي"), currency.symbol_ar)}
          ${labeledField("locale", ui("Number locale", "تنسيق الأرقام"), currency.locale)}
          ${labeledField("decimal_digits", ui("Decimal digits", "الكسور العشرية"), currency.decimal_digits, "number", { min:0, max:3 })}
          ${labeledField("exchange_rate", ui("Rate from base", "السعر مقابل العملة الأساسية"), currency.exchange_rate, "number", { min:0.000001, step:"0.000001" })}
          <div class="field"><label>${ui("Symbol position", "موضع الرمز")}</label><select name="symbol_position"><option value="after" ${currency.symbol_position !== "before" ? "selected" : ""}>${ui("After amount", "بعد السعر")}</option><option value="before" ${currency.symbol_position === "before" ? "selected" : ""}>${ui("Before amount", "قبل السعر")}</option></select></div>
        </div>
      </article>`;
  }

  async function renderCurrencies(page) {
    const data = await api("/api/admin/currencies");
    page.innerHTML = pageTitle("currencies", "", `<button class="btn primary" type="submit" form="currenciesForm">${t("save")}</button>`);
    page.innerHTML += `
      <form id="currenciesForm">
        <section class="currency-command card">
          <div class="currency-command-copy"><span class="section-kicker">${ui("MONEY", "العملات")}</span><h2>${ui("Store currency system", "نظام عملات المتجر")}</h2><p>${ui("Set the checkout currency now and keep Gulf currencies ready for the storefront rollout.", "حدد عملة الدفع الآن وجهّز عملات الخليج لاستخدامها عند تنفيذ الواجهة.")}</p></div>
          <div class="currency-command-fields">
            <div class="field"><label>${ui("Base currency", "العملة الأساسية")}</label><select name="base_currency" id="baseCurrency">${data.currencies.map(row=>`<option value="${row.code}" ${row.code===data.base_currency?"selected":""}>${row.code} · ${escapeHtml(state.lang === "ar" ? row.name_ar : row.name_en)}</option>`).join("")}</select></div>
            <div class="field"><label>${ui("Display mode", "طريقة العرض")}</label><select name="display_mode"><option value="fixed" ${data.display_mode!=="multi"?"selected":""}>${ui("One store currency", "عملة متجر واحدة")}</option><option value="multi" ${data.display_mode==="multi"?"selected":""}>${ui("Customer can switch", "العميل يختار العملة")}</option></select></div>
            <div class="field"><label>${ui("Price rounding", "تقريب الأسعار")}</label><select name="rounding_mode"><option value="none" ${data.rounding_mode==="none"?"selected":""}>${ui("No rounding", "بدون تقريب")}</option><option value="nearest_1" ${data.rounding_mode==="nearest_1"?"selected":""}>${ui("Nearest whole number", "لأقرب رقم صحيح")}</option><option value="nearest_5" ${data.rounding_mode==="nearest_5"?"selected":""}>${ui("Nearest 5", "لأقرب 5")}</option><option value="psychological" ${data.rounding_mode==="psychological"?"selected":""}>${ui("Psychological .99", "سعر نفسي .99")}</option></select></div>
            <div class="field currency-auto"><label>${ui("Automatic rates", "تحديث أسعار الصرف")}</label><input type="hidden" name="auto_exchange" value="${data.auto_exchange === true}" />${switchButton({ field:"auto_exchange", value:data.auto_exchange === true })}</div>
          </div>
        </section>
        <div class="currency-grid" id="currencyGrid">${data.currencies.map(row=>currencyCard(row, data.base_currency)).join("")}</div>
      </form>`;
    document.querySelectorAll("[data-form-switch]").forEach(btn => btn.onclick = () => updateFormSwitch(btn));
    const refreshCurrencyCards = () => {
      const baseCode = document.getElementById("baseCurrency").value;
      document.querySelectorAll("[data-currency-card]").forEach(card => {
        card.classList.toggle("is-base", card.dataset.currencyCard === baseCode);
        const previewData = namedValues(card);
        card.querySelector("[data-currency-preview]").textContent = currencyPriceSample(previewData);
      });
    };
    document.getElementById("baseCurrency").addEventListener("change", refreshCurrencyCards);
    document.getElementById("currencyGrid").addEventListener("input", refreshCurrencyCards);
    document.getElementById("currenciesForm").onsubmit = async event => {
      event.preventDefault();
      const root = event.currentTarget;
      const top = namedValues(root.querySelector(".currency-command"));
      const currencies = [...root.querySelectorAll("[data-currency-card]")].map(card => {
        const row = namedValues(card);
        return { ...row, code:card.dataset.currencyCard, decimal_digits:Number(row.decimal_digits || 0), exchange_rate:Number(row.exchange_rate || 1), is_active:row.is_active === "true" };
      });
      await api("/api/admin/currencies", { method:"PUT", body:JSON.stringify({ ...top, auto_exchange:top.auto_exchange === "true", currencies }) });
      toast(t("saved"));
      renderCurrencies(page);
    };
  }

  function layoutPreview(values) {
    const message = values.messages.find(item=>item.is_active !== false) || {};
    return `<div class="layout-preview"><div class="layout-preview-announcement ${values.announcement_active ? "" : "is-hidden"}">${escapeHtml(state.lang === "ar" ? (message.text_ar || "شريط الإعلان") : (message.text_en || "Announcement bar"))}</div><div class="layout-preview-header"><strong>SITEYFY</strong><nav><span>${ui("Home", "الرئيسية")}</span><span>${ui("Shop", "المتجر")}</span></nav><div>${values.show_search ? "⌕" : ""} ${values.show_account ? "◯" : ""} ${values.show_wishlist ? "♡" : ""} ${values.show_cart ? "▢" : ""}</div></div>${values.show_category_strip ? `<div class="layout-category-strip"><span>${ui("New", "جديد")}</span><span>${ui("Offers", "العروض")}</span><span>${ui("Collections", "المجموعات")}</span></div>` : ""}<div class="layout-preview-body"><span></span><span></span><span></span></div><div class="layout-preview-footer"><strong>SITEYFY</strong>${values.show_description ? `<p>${ui("Store description appears here.", "يظهر وصف المتجر هنا.")}</p>` : ""}<div>${[values.show_business_info&&ui("Business info", "بيانات المنشأة"),values.show_contact&&ui("Contact", "التواصل"),values.show_social&&ui("Social", "التواصل الاجتماعي"),values.show_policies&&ui("Policies", "السياسات")].filter(Boolean).map(x=>`<span>${x}</span>`).join("")}</div></div></div>`;
  }

  function announcementCard(message = {}, index = 0) {
    const icons = [["gift",ui("Gift", "هدية")],["truck",ui("Shipping", "شحن")],["tag",ui("Offer", "عرض")],["sparkles",ui("Highlight", "مميز")]];
    return `<article class="announcement-card" data-announcement-row data-id="${escapeHtml(message.id || `message-${Date.now()}-${index}`)}"><div class="builder-card-head"><span class="drag-handle">${String(index + 1).padStart(2,"0")}</span><strong>${ui("Announcement message", "رسالة إعلان")}</strong><div class="field compact-switch"><input type="hidden" name="is_active" value="${message.is_active !== false}" />${switchButton({ field:"is_active", value:message.is_active !== false, label:false })}</div><button class="btn icon-btn danger" type="button" data-remove-announcement title="${t("delete")}">${i("trash")}</button></div><div class="form-grid">${labeledField("text_en", ui("English message", "النص بالإنجليزية"), message.text_en, "text", {full:true})}${labeledField("text_ar", ui("Arabic message", "النص بالعربية"), message.text_ar, "text", {full:true})}<div class="field"><label>${ui("Icon", "الأيقونة")}</label><select name="icon">${icons.map(([value,label])=>`<option value="${value}" ${value===(message.icon||"gift")?"selected":""}>${label}</option>`).join("")}</select></div>${labeledField("link_label_ar", ui("Arabic link label", "عنوان الرابط بالعربية"), message.link_label_ar)}${labeledField("link_label_en", ui("English link label", "عنوان الرابط بالإنجليزية"), message.link_label_en)}${labeledField("link_url", ui("Link", "الرابط"), message.link_url, "text", {full:true})}</div></article>`;
  }

  async function renderStorefrontLayout(page) {
    const data = await api("/api/admin/storefront-layout");
    page.innerHTML = pageTitle("storefrontLayout", "", `<button class="btn primary" type="submit" form="storefrontLayoutForm">${t("save")}</button>`);
    page.innerHTML += `<form id="storefrontLayoutForm" class="layout-workspace"><div class="layout-editor">
      <section class="studio-card"><div class="studio-card-head"><span class="section-kicker">01</span><div><h2>${ui("Announcement bar", "شريط الإعلانات")}</h2><p>${ui("Create rotating bilingual notices above the header.", "أنشئ رسائل ثنائية اللغة تظهر بالتتابع أعلى الهيدر.")}</p></div><div class="field compact-switch"><input type="hidden" name="announcement_active" value="${data.announcement.is_active !== false}" />${switchButton({ field:"announcement_active", value:data.announcement.is_active !== false })}</div></div><div class="announcement-controls"><div class="field"><label>${ui("Change every", "التبديل كل")}</label><div class="input-suffix"><input name="rotation_interval_seconds" type="number" min="2" max="60" value="${Number(data.announcement.rotation_interval_seconds||5)}" /><span>${ui("sec", "ثانية")}</span></div></div><div class="field"><label>${ui("Transition", "حركة الانتقال")}</label><select name="transition"><option value="fade" ${data.announcement.transition!=="slide"?"selected":""}>${ui("Fade", "تلاشي")}</option><option value="slide" ${data.announcement.transition==="slide"?"selected":""}>${ui("Slide", "انزلاق")}</option></select></div><div class="setting-toggle"><div><strong>${ui("Pause on hover", "إيقاف عند المرور")}</strong><small>${ui("Keeps the current message readable", "يبقي الرسالة الحالية للقراءة")}</small></div><div class="field"><input type="hidden" name="pause_on_hover" value="${data.announcement.pause_on_hover!==false}" />${switchButton({field:"pause_on_hover",value:data.announcement.pause_on_hover!==false,label:false})}</div></div></div><div id="announcementList" class="builder-list">${data.announcement.messages.map(announcementCard).join("")}</div><button class="btn" type="button" id="addAnnouncement">${i("plus")}${ui("Add message", "إضافة رسالة")}</button></section>
      <section class="studio-card"><div class="studio-card-head"><span class="section-kicker">02</span><div><h2>${ui("Header behavior", "خصائص الهيدر")}</h2><p>${ui("Choose the tools customers can access from every page.", "حدد الأدوات المتاحة للعميل في جميع الصفحات.")}</p></div></div><div class="setting-toggle-grid">${[["sticky",ui("Sticky header", "هيدر ثابت")],["show_search",ui("Search", "البحث")],["show_account",ui("Account", "الحساب")],["show_wishlist",ui("Wishlist", "المفضلة")],["show_cart",ui("Cart", "السلة")],["show_category_strip",ui("Category strip", "شريط التصنيفات")]].map(([key,label])=>`<div class="setting-toggle"><div><strong>${label}</strong><small>${ui("Visible on the storefront", "ظاهر في واجهة المتجر")}</small></div><div class="field"><input type="hidden" name="${key}" value="${data.header[key] !== false}" />${switchButton({field:key,value:data.header[key] !== false,label:false})}</div></div>`).join("")}</div></section>
      <section class="studio-card"><div class="studio-card-head"><span class="section-kicker">03</span><div><h2>${ui("Footer content", "محتوى الفوتر")}</h2><p>${ui("Control content groups without rebuilding the footer.", "تحكم في مجموعات المحتوى بدون إعادة بناء الفوتر.")}</p></div></div><div class="setting-toggle-grid">${[["show_description",ui("Store description", "وصف المتجر")],["show_business_info",ui("Business information", "بيانات المنشأة")],["show_contact",ui("Contact details", "بيانات التواصل")],["show_social",ui("Social links", "روابط التواصل")],["show_policies",ui("Policy links", "روابط السياسات")]].map(([key,label])=>`<div class="setting-toggle"><div><strong>${label}</strong><small>${ui("Footer content group", "مجموعة محتوى في الفوتر")}</small></div><div class="field"><input type="hidden" name="${key}" value="${data.footer[key] !== false}" />${switchButton({field:key,value:data.footer[key] !== false,label:false})}</div></div>`).join("")}</div><div class="form-grid" style="margin-top:16px">${labeledField("copyright_en",ui("English copyright", "حقوق النشر بالإنجليزية"),data.footer.copyright_en)}${labeledField("copyright_ar",ui("Arabic copyright", "حقوق النشر بالعربية"),data.footer.copyright_ar)}${labeledField("store_policy_url",ui("Store policy URL", "رابط سياسة المتجر"),data.footer.store_policy_url)}${labeledField("shipping_policy_url",ui("Shipping policy URL", "رابط سياسة الشحن"),data.footer.shipping_policy_url)}${labeledField("privacy_policy_url",ui("Privacy policy URL", "رابط سياسة الخصوصية"),data.footer.privacy_policy_url)}<p class="muted small full">${ui("Policy links appear only when a destination is provided. Use a full URL or a local page path.", "تظهر روابط السياسات عند تحديد رابط فعلي فقط. استخدم رابطًا كاملًا أو مسار صفحة داخل المتجر.")}</p></div></section>
    </div><aside class="layout-preview-shell"><div class="brand-preview-head"><div><span>${ui("LIVE STRUCTURE", "معاينة مباشرة")}</span><strong>${ui("Header & footer", "الهيدر والفوتر")}</strong></div><span class="live-dot">${ui("Live", "مباشر")}</span></div><div id="layoutLivePreview"></div></aside></form>`;
    const form = document.getElementById("storefrontLayoutForm");
    const values = () => { const all=Object.fromEntries(new FormData(form)); return {...all,announcement_active:all.announcement_active==="true",pause_on_hover:all.pause_on_hover==="true",rotation_interval_seconds:Number(all.rotation_interval_seconds||5),messages:[...form.querySelectorAll("[data-announcement-row]")].map(row=>{const item=namedValues(row);return {...item,id:row.dataset.id,is_active:item.is_active==="true"};}),...Object.fromEntries(Object.entries(all).filter(([key])=>key.startsWith("show_")||key==="sticky").map(([key,value])=>[key,value==="true"]))}; };
    const refresh = () => { document.getElementById("layoutLivePreview").innerHTML=layoutPreview(values()); };
    const bind = () => { form.querySelectorAll("[data-form-switch]").forEach(btn=>btn.onclick=()=>{updateFormSwitch(btn);refresh();});form.querySelectorAll("input,select").forEach(input=>input.addEventListener("input",refresh));form.querySelectorAll("[data-remove-announcement]").forEach(btn=>btn.onclick=()=>{btn.closest("[data-announcement-row]").remove();refresh();}); };
    document.getElementById("addAnnouncement").onclick=()=>{document.getElementById("announcementList").insertAdjacentHTML("beforeend",announcementCard({},document.querySelectorAll("[data-announcement-row]").length));bind();refresh();};
    bind();refresh();
    form.onsubmit=async event=>{event.preventDefault();const all=values();const header={sticky:all.sticky,show_search:all.show_search,show_account:all.show_account,show_wishlist:all.show_wishlist,show_cart:all.show_cart,show_category_strip:all.show_category_strip};const footer={show_description:all.show_description,show_business_info:all.show_business_info,show_contact:all.show_contact,show_social:all.show_social,show_policies:all.show_policies,copyright_en:all.copyright_en,copyright_ar:all.copyright_ar,store_policy_url:all.store_policy_url,shipping_policy_url:all.shipping_policy_url,privacy_policy_url:all.privacy_policy_url};await api("/api/admin/storefront-layout",{method:"PUT",body:JSON.stringify({announcement:{is_active:all.announcement_active,rotation_interval_seconds:all.rotation_interval_seconds,transition:all.transition,pause_on_hover:all.pause_on_hover,messages:all.messages},header,footer})});toast(t("saved"));};
  }

  function shippingRuleCard(rule = {}, index = 0) {
    const id = rule.id || `shipping-rule-${Date.now()}-${index}`;
    const productIds = Array.isArray(rule.product_ids) ? rule.product_ids.map(Number).filter(Boolean) : [];
    const categorySlugs = Array.isArray(rule.category_slugs) ? rule.category_slugs.map(String).filter(Boolean) : [];
    const conditions = [["any_quantity",ui("Any products quantity", "عدد من أي منتجات")],["selected_products_quantity",ui("Selected products quantity", "عدد من منتجات محددة")],["product_bundle",ui("Specific product bundle", "مجموعة منتجات معًا")],["selected_categories_quantity",ui("Quantity from categories", "عدد من تصنيفات محددة")],["order_subtotal",ui("Order subtotal", "قيمة الطلب")]];
    const actions = [["free_shipping",ui("Free shipping", "شحن مجاني")],["fixed_shipping",ui("Set a fixed shipping price", "تثبيت سعر الشحن")],["shipping_discount_percentage",ui("Discount shipping by percentage", "خصم نسبة من الشحن")],["shipping_discount_fixed",ui("Discount a fixed amount", "خصم مبلغ من الشحن")]];
    const actionType = rule.action_type || "free_shipping";
    return `<article class="shipping-rule-card" data-shipping-rule data-id="${escapeHtml(id)}"><div class="shipping-rule-head"><span class="shipping-rule-number">${String(index+1).padStart(2,"0")}</span><div><strong>${escapeHtml(state.lang==="ar"?(rule.name_ar||"قاعدة شحن"):(rule.name_en||"Shipping rule"))}</strong><small>${ui("Set the condition, then choose exactly what happens.", "حدد الشرط ثم اختر النتيجة التي ستُطبق.")}</small></div><div class="field compact-switch"><input type="hidden" name="is_active" value="${rule.is_active!==false}" />${switchButton({field:"is_active",value:rule.is_active!==false,label:false})}</div><button class="btn icon-btn danger" type="button" data-remove-shipping-rule title="${t("delete")}">${i("trash")}</button></div><div class="form-grid compact">${labeledField("name_en",ui("English name", "الاسم بالإنجليزية"),rule.name_en||"Shipping rule")}${labeledField("name_ar",ui("Arabic name", "الاسم بالعربية"),rule.name_ar||"قاعدة شحن")}<div class="field full"><label>${ui("Rule condition", "شرط القاعدة")}</label><select name="condition_type" data-shipping-condition>${conditions.map(([value,label])=>`<option value="${value}" ${value===(rule.condition_type||"any_quantity")?"selected":""}>${label}</option>`).join("")}</select></div><div class="field" data-rule-field="quantity"><label>${ui("Required quantity", "الكمية المطلوبة")}</label><input type="number" name="minimum_quantity" min="1" value="${Math.max(1,Number(rule.minimum_quantity||2))}" /></div><div class="field" data-rule-field="subtotal"><label>${ui("Minimum subtotal", "الحد الأدنى للطلب")}</label><input type="number" name="minimum_subtotal" min="0" step="0.01" value="${Number(rule.minimum_subtotal||0)}" /></div></div><div class="shipping-outcome"><span class="shipping-outcome-icon">${i("sparkles")}</span><div class="field"><label>${ui("When the rule matches", "عند تحقق القاعدة")}</label><select name="action_type" data-shipping-action>${actions.map(([value,label])=>`<option value="${value}" ${value===actionType?"selected":""}>${label}</option>`).join("")}</select></div><div class="field" data-action-field="value"><label>${ui("Value", "القيمة")}</label><input type="number" name="action_value" min="0" step="0.01" value="${Number(rule.action_value||0)}" /></div></div><input type="hidden" name="product_ids" value="${escapeHtml(JSON.stringify(productIds))}" data-shipping-target="products" /><input type="hidden" name="category_slugs" value="${escapeHtml(JSON.stringify(categorySlugs))}" data-shipping-target="categories" /><div class="shipping-target-panel" data-rule-field="products"><div class="shipping-target-head"><div><strong>${ui("Selected products", "المنتجات المحددة")}</strong><small>${ui("Choose from the current catalog", "اختر من كتالوج المتجر")}</small></div><button class="btn" type="button" data-choose-shipping-target="products">${i("box")}${t("chooseProducts")}</button></div><div class="discount-chip-list" data-shipping-chips="products">${shippingTargetChips("products",productIds)}</div></div><div class="shipping-target-panel" data-rule-field="categories"><div class="shipping-target-head"><div><strong>${ui("Selected categories", "التصنيفات المحددة")}</strong><small>${ui("Products in these categories count toward the rule", "تُحتسب منتجات هذه التصنيفات في القاعدة")}</small></div><button class="btn" type="button" data-choose-shipping-target="categories">${i("layers")}${t("chooseCategories")}</button></div><div class="discount-chip-list" data-shipping-chips="categories">${shippingTargetChips("categories",categorySlugs)}</div></div></article>`;
  }

  function shippingTargetChips(type, values) {
    if (!values.length) return `<span class="muted small" data-empty-shipping-target>${ui("Nothing selected yet", "لم يتم الاختيار بعد")}</span>`;
    return values.map(value => {
      const label = type === "products" ? productLabelById(value) : ((state.rows.categories||[]).find(row=>(row.slug||slugFromText(row.name_en||row.name_ar))===String(value))?.[state.lang==="ar"?"name_ar":"name_en"] || value);
      return `<button class="discount-chip" type="button" data-remove-shipping-target="${type}" data-target-value="${escapeHtml(value)}"><span>${escapeHtml(label)}</span><strong>×</strong></button>`;
    }).join("");
  }

  function readShippingTarget(row, type) {
    try { return JSON.parse(row.querySelector(`[data-shipping-target="${type}"]`)?.value || "[]"); } catch { return []; }
  }

  function writeShippingTarget(row, type, values) {
    const normalized = type === "products" ? values.map(Number).filter(Boolean) : values.map(String).filter(Boolean);
    row.querySelector(`[data-shipping-target="${type}"]`).value = JSON.stringify([...new Set(normalized)]);
    row.querySelector(`[data-shipping-chips="${type}"]`).innerHTML = shippingTargetChips(type, normalized);
    bindShippingChipRemovers(row);
  }

  function bindShippingChipRemovers(row) {
    row.querySelectorAll("[data-remove-shipping-target]").forEach(btn=>btn.onclick=()=>writeShippingTarget(row,btn.dataset.removeShippingTarget,readShippingTarget(row,btn.dataset.removeShippingTarget).filter(value=>String(value)!==String(btn.dataset.targetValue))));
  }

  function openShippingTargetPicker(row, type) {
    const products = state.rows.products || [];
    const categories = state.rows.categories || [];
    const rows = type === "products" ? products : categories;
    const selected = new Set(readShippingTarget(row,type).map(String));
    document.body.insertAdjacentHTML("beforeend",`<div class="modal-backdrop" id="shippingTargetModal"><div class="modal product-picker-modal"><div class="modal-head"><div><h2>${type==="products"?t("chooseProducts"):t("chooseCategories")}</h2><p class="muted">${ui("Select one or more catalog records for this rule.", "اختر عنصرًا أو أكثر لتطبيق هذه القاعدة.")}</p></div><button class="btn icon-btn" type="button" data-close-shipping-picker>×</button></div><div class="modal-body"><div class="product-picker-grid">${rows.map(item=>{const value=type==="products"?item.id:(item.slug||slugFromText(item.name_en||item.name_ar));const name=state.lang==="ar"?(item.name_ar||item.name_en):(item.name_en||item.name_ar);return `<button class="product-picker-card ${selected.has(String(value))?"selected":""}" type="button" data-shipping-pick="${escapeHtml(value)}"><img src="${escapeHtml(item.main_photo_url||item.image_url||"/uploads/catalog/gift.png")}" alt="" /><span class="pill">${type==="products"?`#${item.id}`:escapeHtml(value)}</span><strong>${escapeHtml(name||value)}</strong></button>`;}).join("")}</div></div><div class="modal-foot"><button class="btn" type="button" data-close-shipping-picker>${t("cancel")}</button><button class="btn primary" type="button" id="saveShippingTargets">${t("save")}</button></div></div></div>`);
    document.querySelectorAll("[data-close-shipping-picker]").forEach(btn=>btn.onclick=()=>document.getElementById("shippingTargetModal")?.remove());
    document.querySelectorAll("[data-shipping-pick]").forEach(btn=>btn.onclick=()=>{const value=String(btn.dataset.shippingPick);selected.has(value)?selected.delete(value):selected.add(value);btn.classList.toggle("selected",selected.has(value));});
    document.getElementById("saveShippingTargets").onclick=()=>{writeShippingTarget(row,type,[...selected]);document.getElementById("shippingTargetModal")?.remove();};
  }

  function syncShippingRuleVisibility(row) {
    const type = row.querySelector("[data-shipping-condition]")?.value || "any_quantity";
    row.querySelectorAll("[data-rule-field]").forEach(field=>field.hidden=true);
    if(type==="order_subtotal") row.querySelector('[data-rule-field="subtotal"]').hidden=false;
    else if(type!=="product_bundle") row.querySelector('[data-rule-field="quantity"]').hidden=false;
    if(["selected_products_quantity","product_bundle"].includes(type)) row.querySelector('[data-rule-field="products"]').hidden=false;
    if(type==="selected_categories_quantity") row.querySelector('[data-rule-field="categories"]').hidden=false;
    const action = row.querySelector("[data-shipping-action]")?.value || "free_shipping";
    row.querySelector('[data-action-field="value"]').hidden = action === "free_shipping";
  }

  function bindShippingRule(row) {
    row.querySelectorAll("[data-form-switch]").forEach(btn=>btn.onclick=()=>updateFormSwitch(btn));
    row.querySelector("[data-shipping-condition]").onchange=()=>syncShippingRuleVisibility(row);
    row.querySelector("[data-shipping-action]").onchange=()=>syncShippingRuleVisibility(row);
    row.querySelector("[data-remove-shipping-rule]").onclick=()=>row.remove();
    row.querySelectorAll("[data-choose-shipping-target]").forEach(btn=>btn.onclick=()=>openShippingTargetPicker(row,btn.dataset.chooseShippingTarget));
    bindShippingChipRemovers(row);
    syncShippingRuleVisibility(row);
  }

  function shippingMoney(value, currency = "SAR") {
    if (value === null || value === undefined || value === "") return "-";
    return `${Number(value || 0).toLocaleString(state.lang === "ar" ? "ar-SA" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  }

  function omsFeeLabel(name) {
    const labels = {
      "COD服务费": ["COD service fee", "رسوم الدفع عند الاستلام"],
      "配送费": ["Delivery fee", "رسوم التوصيل"],
      "POS服务费": ["POS service fee", "رسوم نقاط البيع"],
      "VAT": ["VAT", "ضريبة القيمة المضافة"]
    };
    const label = labels[String(name || "")];
    return label ? (state.lang === "ar" ? label[1] : label[0]) : String(name || ui("Fee", "رسوم"));
  }

  function omsStatusLabel(status) {
    const labels = {
      "配送成功": ["Delivered", "تم التسليم"],
      "配送成功完结": ["Delivered and completed", "تم التسليم والإغلاق"],
      "配送失败": ["Delivery failed", "فشل التسليم"],
      "配送失败完结": ["Delivery failed and closed", "فشل التسليم وتم الإغلاق"],
      "包裹处理": ["Package processing", "معالجة الشحنة"],
      "已上传": ["Uploaded", "تم الرفع"],
      "待配送": ["Awaiting delivery", "بانتظار التسليم"],
      "Successful delivery": ["Delivered", "تم التسليم"],
      "Delivery Failed": ["Delivery failed", "فشل التسليم"],
      "运输中": ["In transit", "قيد النقل"],
      "配送中": ["Out for delivery", "خرجت للتسليم"]
    };
    const label = labels[String(status || "")];
    if (label) return state.lang === "ar" ? label[1] : label[0];
    const value = String(status || "");
    if (value.includes("成功")) return ui("Delivered", "تم التسليم");
    if (value.includes("失败")) return ui("Delivery failed", "فشل التسليم");
    if (value.includes("运输")) return ui("In transit", "قيد النقل");
    if (value.includes("配送")) return ui("Out for delivery", "خرجت للتسليم");
    if (/[\u3400-\u9fff]/.test(value)) return ui("Carrier status", "حالة شركة الشحن");
    return value || "-";
  }

  function omsStatusKind(status) {
    const value = String(status || "").toLowerCase();
    if (value.includes("失败") || value.includes("failed")) return "failed";
    if (value.includes("成功") || value.includes("successful") || value === "delivered") return "success";
    return "other";
  }

  function omsOrderTypeLabel(value) {
    const labels = {
      "配送订单": ["Delivery order", "طلب توصيل"],
      "逆向提货(退货退款)": ["Return pickup", "استلام مرتجع"],
      "Dropship Order": ["Delivery order", "طلب توصيل"],
      "Reverse Pickup (Return Refund)": ["Return pickup", "استلام مرتجع"]
    };
    const label = labels[String(value || "")];
    return label ? (state.lang === "ar" ? label[1] : label[0]) : String(value || ui("Delivery order", "طلب توصيل"));
  }

  function omsInternalStatusLabel(value, fallback = "") {
    const labels = {
      "配送成功完结": ["Delivered and completed", "تم التسليم والإغلاق"],
      "包裹处理": ["Package processing", "معالجة الشحنة"],
      "配送失败完结": ["Delivery failed and closed", "فشل التسليم وتم الإغلاق"]
    };
    const label = labels[String(value || "")];
    if (label) return state.lang === "ar" ? label[1] : label[0];
    const groups = { delivered: ui("Delivered", "تم التسليم"), exception: ui("Exception", "مشكلة في التسليم"), in_transit: ui("In transit", "قيد النقل"), out_for_delivery:ui("Out for delivery","خرجت للتسليم"), picked_up:ui("Picked up","تم الاستلام"), pending: ui("Pending", "معلقة"), return: ui("Returned", "مرتجعة"), cancelled:ui("Cancelled","ملغاة") };
    if (groups[fallback]) return groups[fallback];
    const raw = String(value || fallback || "-");
    return /[\u3400-\u9fff]/.test(raw) ? ui("Carrier status", "حالة شركة الشحن") : raw;
  }

  function shippingStatusLabel(group) {
    return omsInternalStatusLabel("", group || "pending");
  }

  function omsSourceLabel(value) {
    return String(value || "") === "oms_history" ? ui("Imported from OMS history", "مستوردة من سجل OMS") : String(value || "-");
  }

  function omsPaymentLabel(value) {
    const labels = { "200": ui("Cash on delivery", "الدفع عند الاستلام"), "100": ui("Prepaid", "مدفوع مسبقًا"), "300":ui("Card at delivery (POS)","بطاقة عند الاستلام POS"), "700":ui("Card at delivery (POS)","بطاقة عند الاستلام POS"), cod:ui("Cash on delivery","كاش عند الاستلام"),cod_cash:ui("Cash on delivery","كاش عند الاستلام"),cod_pos:ui("Card on delivery","بطاقة عند الاستلام"),prepaid:ui("Prepaid","مدفوع مسبقًا") };
    return labels[String(value || "")] || String(value || "-");
  }

  function downloadOmsReportCsv(report) {
    const columns = ["waybill_no","client_order_no","order_no","provider","customer_name","customer_phone","destination_city","destination_country","internal_status","shipment_source","order_status","billable_weight","declared_value","collected_amount","actual_cost","currency","fee_breakdown","bill_numbers","order_created_at","order_finished_at","fee_updated_at","matched_shipment_id"];
    const quote = value => `"${String(value ?? "").replaceAll('"','""')}"`;
    const lines = [columns.join(","), ...(report.items||[]).map(item => columns.map(key => {
      if (key === "fee_breakdown") return quote((item.fee_breakdown||[]).map(fee=>`${omsFeeLabel(fee.name)}: ${fee.amount} ${fee.currency}`).join(" | "));
      if (key === "bill_numbers") return quote((item.bill_numbers||[]).join(" | "));
      if (key === "client_order_no") return quote(item.shipment?.client_order_no||item.client_no);
      if (["customer_name","customer_phone","destination_city","destination_country"].includes(key)) return quote(item.shipment?.[key]);
      if (key === "internal_status") return quote(omsInternalStatusLabel(item.shipment?.status_label,item.shipment?.status_group));
      if (key === "shipment_source") return quote(item.shipment?.source);
      return quote(item[key]);
    }).join(","))];
    const url = URL.createObjectURL(new Blob(["\ufeff",lines.join("\n")],{type:"text/csv;charset=utf-8"}));
    const link = document.createElement("a");
    link.href=url;
    link.download=`imile-oms-report-${report.report_date||report.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function openOmsReport(reportId) {
    location.hash = `shippingReport/${reportId}`;
  }

  async function openOmsReportModalLegacy(reportId) {
    const result = await api(`/api/admin/shipping/reports/${reportId}`);
    const report = result.report || result;
    document.getElementById("omsReportModal")?.remove();
    document.body.insertAdjacentHTML("beforeend",`<div class="modal-backdrop" id="omsReportModal"><div class="modal oms-report-modal"><div class="modal-head"><div><span class="section-kicker">iMile OMS</span><h2>${ui("Closing report details", "تفاصيل تقرير التقفيل")}</h2><p class="muted">${escapeHtml(report.report_date||"")} · ${(report.items||[]).length} ${ui("shipments", "شحنة")} · ${shippingMoney(report.actual_cost_total,report.currency||"SAR")}</p></div><button class="btn icon-btn" type="button" data-close-oms-report aria-label="${ui("Close", "إغلاق")}">×</button></div><div class="modal-body oms-report-modal-body"><div class="oms-report-table-tools"><div class="field"><label>${ui("Search report", "البحث في التقرير")}</label><input id="omsReportSearch" placeholder="${ui("Waybill, customer, order, city, bill or status", "البوليصة أو العميل أو الطلب أو المدينة أو الفاتورة أو الحالة")}" /></div><div class="oms-table-summary"><span>${ui("Matched", "مطابقة")}<strong>${report.matched_count||0}</strong></span><span>${ui("Missing cost", "تكلفة ناقصة")}<strong>${report.missing_cost_count||0}</strong></span><span>${ui("COD collected", "المبلغ المحصل")}<strong>${shippingMoney(report.collected_total,report.currency||"SAR")}</strong></span></div></div><div class="table-wrap oms-detail-table"><div class="table-scroll"><table class="data-table"><thead><tr><th>${ui("Waybill / order", "البوليصة / الطلب")}</th><th>${ui("Customer / destination", "العميل / الوجهة")}</th><th>${ui("Carrier", "شركة الشحن")}</th><th>${ui("Status", "الحالة")}</th><th>${ui("Weight", "الوزن")}</th><th>${ui("Declared value", "القيمة المصرح بها")}</th><th>${ui("COD collected", "المحصل")}</th><th>${ui("Actual cost", "التكلفة الفعلية")}</th><th>${ui("Fee breakdown", "تفاصيل الرسوم")}</th><th>${ui("Bills", "الفواتير")}</th><th>${ui("Timeline", "التواريخ")}</th><th>${ui("Store record", "بيانات المتجر")}</th></tr></thead><tbody id="omsReportRows"></tbody></table></div></div></div><div class="modal-foot"><button class="btn" type="button" data-close-oms-report>${ui("Close", "إغلاق")}</button><button class="btn primary" type="button" id="exportOmsReport">${i("download")}${ui("Export CSV", "تصدير CSV")}</button></div></div></div>`);
    const renderRows = (query = "") => {
      const normalized = String(query||"").trim().toLowerCase();
      const rows = (report.items||[]).filter(item => !normalized || [item.waybill_no,item.order_no,item.client_no,item.order_status,item.shipment?.client_order_no,item.shipment?.customer_name,item.shipment?.customer_phone,item.shipment?.destination_city,item.shipment?.destination_country,item.shipment?.status_label,...(item.bill_numbers||[])].some(value=>String(value||"").toLowerCase().includes(normalized)));
      document.getElementById("omsReportRows").innerHTML = rows.length ? rows.map(item=>`<tr><td><strong>${escapeHtml(item.waybill_no||"-")}</strong><small>#${escapeHtml(item.order_no||"-")}</small></td><td><div class="shipment-customer"><strong>${escapeHtml(item.shipment?.customer_name||ui("Customer unavailable","بيانات العميل غير متاحة"))}</strong><small>${escapeHtml(item.shipment?.customer_phone||"")}</small><span>${escapeHtml([item.shipment?.destination_city,item.shipment?.destination_country].filter(Boolean).join(" · ")||"-")}</span></div></td><td><span class="provider-mini">${escapeHtml(item.shipment?.provider||item.provider||"iMile")}</span><small>${escapeHtml(item.order_type||ui("Delivery order","طلب توصيل"))}</small></td><td><span class="shipment-status ${String(item.order_status||"").includes("成功")?"status-delivered":String(item.order_status||"").includes("失败")?"status-exception":""}">${escapeHtml(omsStatusLabel(item.order_status))}</span></td><td><strong>${Number(item.billable_weight||0).toLocaleString()} kg</strong><small>${ui("Billable", "وزن محاسبي")}</small></td><td>${Number(item.declared_value||0).toLocaleString()} USD</td><td>${shippingMoney(item.collected_amount,item.currency||"SAR")}</td><td>${item.actual_cost===null||item.actual_cost===undefined?`<span class="status-pill warn">${ui("Pending", "معلّقة")}</span>`:`<strong>${shippingMoney(item.actual_cost,item.currency||"SAR")}</strong>`}</td><td><div class="fee-detail-stack">${(item.fee_breakdown||[]).length?(item.fee_breakdown||[]).map(fee=>`<span><b>${escapeHtml(omsFeeLabel(fee.name))}</b>${shippingMoney(fee.amount,fee.currency||"SAR")}</span>`).join(""):`<small>-</small>`}</div></td><td><div class="bill-code-stack">${(item.bill_numbers||[]).length?(item.bill_numbers||[]).map(bill=>`<code>${escapeHtml(bill)}</code>`).join(""):`<small>-</small>`}</div></td><td><div class="report-timeline"><span>${ui("Created", "إنشاء")}<b>${item.order_created_at?formatDateTime(item.order_created_at):"-"}</b></span><span>${ui("Finished", "إنهاء")}<b>${item.order_finished_at?formatDateTime(item.order_finished_at):"-"}</b></span><span>${ui("Fee update", "تحديث الرسوم")}<b>${escapeHtml(item.fee_updated_at||"-")}</b></span></div></td><td>${item.matched_shipment_id?`<div class="store-record"><span class="status-pill good">${ui("Matched", "مطابقة")} #${item.matched_shipment_id}</span><strong>${ui("Order", "طلب")} #${escapeHtml(item.shipment?.client_order_no||item.client_no||"-")}</strong><small>${escapeHtml(item.shipment?.status_label||item.shipment?.status_code||"")} · ${escapeHtml(item.shipment?.source||"-")}</small></div>`:`<span class="status-pill warn">${ui("Not matched", "غير مطابقة")}</span>`}</td></tr>`).join(""):`<tr><td colspan="12"><div class="empty-state">${ui("No matching shipments", "لا توجد شحنات مطابقة للبحث")}</div></td></tr>`;
    };
    renderRows();
    document.getElementById("omsReportSearch").oninput=event=>renderRows(event.target.value);
    document.querySelectorAll("[data-close-oms-report]").forEach(button=>button.onclick=()=>document.getElementById("omsReportModal")?.remove());
    document.getElementById("exportOmsReport").onclick=()=>downloadOmsReportCsv(report);
  }

  async function renderShippingReport(page, reportId) {
    if (!reportId) {
      location.hash = "shippingClosings";
      return;
    }
    page.classList.add("oms-report-page");
    page.innerHTML = `<div class="card shipping-loading"><span class="loading-spinner"></span><strong>${ui("Loading complete report...", "جاري تحميل التقرير الكامل...")}</strong></div>`;
    const isSettlement = state.view === "shippingSettlement";
    const isLedger = state.view === "shippingLedger";
    const ledgerFilters = isLedger ? JSON.parse(localStorage.getItem("siteyfy_shipping_ledger_filters") || "{}") : {};
    const endpoint = isSettlement ? `/api/admin/shipping/settlements/${reportId}/report` : isLedger ? `/api/admin/shipping/ledger/report?${new URLSearchParams(ledgerFilters)}` : `/api/admin/shipping/reports/${reportId}`;
    const result = await api(endpoint);
    const report = result.report || result;
    const coverage = report.shipment_count ? Math.round(Number(report.cost_rows || 0) / Number(report.shipment_count) * 100) : 0;
    page.innerHTML = `
      <div class="oms-full-page-head">
        <div><button class="btn back-link" type="button" id="backToClosings">${i("file")}${ui("Back to closings", "العودة إلى التقفيلات")}</button><span class="section-kicker">${isLedger ? ui("LIVE SHIPPING LEDGER", "سجل الشحنات الحي") : isSettlement ? ui("SAVED SNAPSHOT", "نسخة محفوظة") : "iMile OMS"} · ${escapeHtml(report.report_date || "")}</span><h1>${isLedger ? ui("Filtered shipment ledger", "سجل الشحنات المفلتر") : ui("Complete closing report", "تقرير التقفيل الكامل")}</h1><p>${isLedger ? ui("Live data matching the selected period and filters.", "بيانات حية مطابقة للفترة والفلاتر المختارة.") : ui("All carrier and store shipment data in one page.", "كل بيانات شركة الشحن وسجل شحنة المتجر في صفحة واحدة.")}</p></div>
        <button class="btn primary" type="button" id="exportFullOmsReport">${i("download")}${ui("Export CSV", "تصدير CSV")}</button>
      </div>
      <div class="oms-full-kpis">
        <article><span>${ui("Shipments", "الشحنات")}</span><strong>${report.shipment_count || 0}</strong><small>${report.matched_count || 0} ${ui("matched to store", "مطابقة مع المتجر")}</small></article>
        <article><span>${ui("Actual carrier cost", "تكلفة الشحن الفعلية")}</span><strong>${shippingMoney(report.actual_cost_total, report.currency || "SAR")}</strong><small>${report.cost_rows || 0} ${ui("priced shipments", "شحنة مسعرة")}</small></article>
        <article><span>${ui("COD collected", "المبالغ المحصلة")}</span><strong>${shippingMoney(report.collected_total, report.currency || "SAR")}</strong><small>${(report.bill_numbers || []).length} ${ui("carrier bills", "فاتورة شحن")}</small></article>
        <article><span>${ui("Data coverage", "اكتمال بيانات التكلفة")}</span><strong>${coverage}%</strong><small>${report.missing_cost_count || 0} ${ui("costs pending", "تكلفة معلقة")}</small></article>
      </div>
      <div class="oms-report-context">
        <section class="oms-context-block"><div class="oms-context-title"><div><span class="section-kicker">${ui("REPORT", "التقرير")}</span><h2>${ui("Report information", "بيانات التقرير")}</h2></div></div><dl class="oms-report-definition"><div><dt>${ui("Report date", "تاريخ التقرير")}</dt><dd>${escapeHtml(report.report_date || "-")}</dd></div><div><dt>${ui("Covered range", "الفترة المغطاة")}</dt><dd>${escapeHtml(report.range_start || "-")} → ${escapeHtml(report.range_end || "-")}</dd></div><div><dt>${ui("Date basis", "أساس التاريخ")}</dt><dd>${escapeHtml(report.date_basis || ui("Fee update", "تحديث الرسوم"))}</dd></div><div><dt>${ui("Last fetched", "آخر تحميل")}</dt><dd>${formatDateTime(report.fetched_at)}</dd></div></dl></section>
        <section class="oms-context-block"><div class="oms-context-title"><div><span class="section-kicker">${ui("FEES", "الرسوم")}</span><h2>${ui("Fee totals", "إجمالي الرسوم")}</h2></div></div><div class="oms-full-fees">${(report.fee_totals || []).map(fee => `<div><span>${escapeHtml(omsFeeLabel(fee.name))}</span><strong>${shippingMoney(fee.amount, fee.currency || report.currency || "SAR")}</strong></div>`).join("") || `<span class="muted">-</span>`}</div></section>
        <section class="oms-context-block full"><div class="oms-context-title"><div><span class="section-kicker">${ui("BILLS", "الفواتير")}</span><h2>${ui("Carrier bill numbers", "أرقام فواتير شركة الشحن")}</h2></div></div><div class="oms-full-bills">${(report.bill_numbers || []).map(bill => `<code>${escapeHtml(bill)}</code>`).join("") || `<span class="muted">${ui("No bills attached", "لا توجد فواتير مرفقة")}</span>`}</div></section>
      </div>
      <div class="oms-report-commandbar">
        <div class="field"><label>${ui("Search shipments", "البحث في الشحنات")}</label><input id="fullOmsSearch" placeholder="${ui("Waybill, customer, phone, order, city, bill or status", "البوليصة أو العميل أو الهاتف أو الطلب أو المدينة أو الفاتورة أو الحالة")}" /></div>
        <div class="field"><label>${ui("Delivery status", "حالة التسليم")}</label><select id="fullOmsStatus"><option value="">${ui("All statuses", "كل الحالات")}</option><option value="success">${ui("Delivered", "تم التسليم")}</option><option value="failed">${ui("Delivery failed", "فشل التسليم")}</option></select></div>
        <div class="field"><label>${ui("Cost status", "حالة التكلفة")}</label><select id="fullOmsCost"><option value="">${ui("All costs", "كل التكاليف")}</option><option value="recorded">${ui("Recorded", "مسجلة")}</option><option value="missing">${ui("Pending", "معلقة")}</option></select></div>
        <button class="btn" type="button" id="toggleAllOmsDetails">${ui("Show all details", "عرض كل التفاصيل")}</button>
      </div>
      <section class="card oms-full-table"><div class="table-scroll"><table class="data-table"><thead><tr><th>${ui("Waybill / order", "البوليصة / الطلب")}</th><th>${ui("Customer", "العميل")}</th><th>${ui("Carrier / type", "الشركة / النوع")}</th><th>${ui("Status", "الحالة")}</th><th>${ui("Destination", "الوجهة")}</th><th>${ui("Weight", "الوزن")}</th><th>${ui("COD", "المحصل")}</th><th>${ui("Actual cost", "التكلفة الفعلية")}</th><th>${ui("Fees", "الرسوم")}</th><th>${ui("Details", "التفاصيل")}</th></tr></thead><tbody id="fullOmsRows"></tbody></table></div></section>`;

    let allExpanded = false;
    const renderRows = () => {
      const query = String(document.getElementById("fullOmsSearch").value || "").trim().toLowerCase();
      const status = document.getElementById("fullOmsStatus").value;
      const cost = document.getElementById("fullOmsCost").value;
      const rows = (report.items || []).filter(item => {
        const searchValues = [item.waybill_no, item.order_no, item.client_no, item.order_status, item.shipment?.client_order_no, item.shipment?.customer_name, item.shipment?.customer_phone, item.shipment?.destination_city, item.shipment?.destination_country, item.shipment?.status_label, ...(item.bill_numbers || [])];
        const searchMatch = !query || searchValues.some(value => String(value || "").toLowerCase().includes(query));
        const statusMatch = !status || omsStatusKind(item.order_status) === status;
        const costMatch = !cost || (cost === "recorded" ? item.actual_cost !== null && item.actual_cost !== undefined : item.actual_cost === null || item.actual_cost === undefined);
        return searchMatch && statusMatch && costMatch;
      });
      const tbody = document.getElementById("fullOmsRows");
      tbody.innerHTML = rows.length ? rows.map(item => {
        const shipment = item.shipment || {};
        const rowId = String(item.waybill_no || item.order_no || Math.random()).replace(/[^a-zA-Z0-9_-]/g, "");
        const fees = (item.fee_breakdown || []);
        const details = [
          [ui("Identifiers", "المعرفات"), [[ui("Waybill", "البوليصة"), item.waybill_no], [ui("OMS order", "طلب OMS"), item.order_no], [ui("Store order", "طلب المتجر"), shipment.client_order_no || item.client_no], [ui("Shipment record", "سجل الشحنة"), shipment.id ? `#${shipment.id}` : "-"]]],
          [ui("Customer and destination", "العميل والوجهة"), [[ui("Customer", "العميل"), shipment.customer_name], [ui("Phone", "الهاتف"), shipment.customer_phone], [ui("City", "المدينة"), shipment.destination_city], [ui("Country", "الدولة"), shipment.destination_country]]],
          [ui("Execution", "التنفيذ"), [[ui("Provider", "الشركة"), shipment.provider || item.provider || "iMile"], [ui("Order type", "نوع الطلب"), omsOrderTypeLabel(item.order_type)], [ui("OMS status", "حالة OMS"), omsStatusLabel(item.order_status)], [ui("Store status", "حالة المتجر"), omsInternalStatusLabel(shipment.status_label, shipment.status_group)], [ui("Source", "المصدر"), omsSourceLabel(shipment.source)], [ui("Sync state", "حالة المزامنة"), shipment.sync_state || "-"]]],
          [ui("Financial data", "البيانات المالية"), [[ui("Declared value", "القيمة المصرح بها"), `${Number(item.declared_value || 0).toLocaleString()} USD`], [ui("COD collected", "المبلغ المحصل"), shippingMoney(item.collected_amount, item.currency || "SAR")], [ui("Customer shipping charge", "الشحن المحمل على العميل"), shippingMoney(shipment.customer_shipping_charge, item.currency || "SAR")], [ui("Carrier estimate", "تقدير شركة الشحن"), shippingMoney(shipment.carrier_estimated_cost, item.currency || "SAR")], [ui("Actual carrier cost", "التكلفة الفعلية"), shippingMoney(item.actual_cost, item.currency || "SAR")], [ui("Cost source", "مصدر التكلفة"), shipment.cost_source || "-"]]],
          [ui("Dates", "التواريخ"), [[ui("Order created", "إنشاء الطلب"), item.order_created_at ? formatDateTime(item.order_created_at) : "-"], [ui("Order finished", "إنهاء الطلب"), item.order_finished_at ? formatDateTime(item.order_finished_at) : "-"], [ui("Delivered", "التسليم"), shipment.delivered_at ? formatDateTime(shipment.delivered_at) : "-"], [ui("Fee created", "إنشاء الرسوم"), item.fee_created_at || "-"], [ui("Fee updated", "تحديث الرسوم"), item.fee_updated_at || "-"], [ui("Latest carrier event", "آخر تحديث للشحنة"), shipment.latest_status_time ? formatDateTime(shipment.latest_status_time) : "-"]]],
          [ui("Payment and package", "الدفع والطرد"), [[ui("Requested payment", "الدفع المطلوب"), omsPaymentLabel(shipment.payment_method)], [ui("Actual payment code", "كود الدفع الفعلي"), shipment.metadata?.actual_payment_method || "-"], [ui("Payment changed", "تغيرت طريقة الدفع"), shipment.payment_method && shipment.metadata?.actual_payment_method ? (String(shipment.payment_method) !== String(shipment.metadata.actual_payment_method) ? ui("Yes", "نعم") : ui("No", "لا")) : "-"], [ui("POS fee", "رسوم POS"), shippingMoney((item.fee_breakdown || []).filter(fee => String(fee.name || "").includes("POS")).reduce((sum,fee)=>sum+Number(fee.amount||0),0), item.currency || "SAR")], [ui("Billable weight", "الوزن المحاسبي"), `${Number(item.billable_weight || 0).toLocaleString()} kg`], [ui("SKU from OMS", "SKU من OMS"), shipment.metadata?.sku || "-"], [ui("Delivery attempts", "محاولات التسليم"), shipment.metadata?.delivery_count ?? "-"], [ui("Tracking events", "أحداث التتبع"), (shipment.tracking_events || []).length]]]
        ];
        return `<tr class="oms-main-row"><td><strong>${escapeHtml(item.waybill_no || "-")}</strong><small>#${escapeHtml(shipment.client_order_no || item.client_no || "-")}</small></td><td><strong>${escapeHtml(shipment.customer_name || ui("Unavailable", "غير متاح"))}</strong><small>${escapeHtml(shipment.customer_phone || "-")}</small></td><td><span class="provider-mini">${escapeHtml(shipment.provider || item.provider || "iMile")}</span><small>${escapeHtml(omsOrderTypeLabel(item.order_type))}</small></td><td><span class="shipment-status ${omsStatusKind(item.order_status) === "success" ? "status-delivered" : omsStatusKind(item.order_status) === "failed" ? "status-exception" : ""}">${escapeHtml(omsStatusLabel(item.order_status))}</span><small>${escapeHtml(omsInternalStatusLabel(shipment.status_label, shipment.status_group))}</small></td><td><strong>${escapeHtml(shipment.destination_city || "-")}</strong><small>${escapeHtml(shipment.destination_country || "-")}</small></td><td><strong>${Number(item.billable_weight || 0).toLocaleString()} kg</strong><small>${ui("Billable", "محاسبي")}</small></td><td>${shippingMoney(item.collected_amount, item.currency || "SAR")}</td><td>${item.actual_cost === null || item.actual_cost === undefined ? `<span class="status-pill warn">${ui("Pending", "معلقة")}</span>` : `<strong>${shippingMoney(item.actual_cost, item.currency || "SAR")}</strong>`}</td><td><strong>${fees.length}</strong><small>${fees.map(fee => escapeHtml(omsFeeLabel(fee.name))).join(" · ") || "-"}</small></td><td><button class="btn" type="button" data-expand-oms="${rowId}" aria-expanded="${allExpanded}">${ui("Full details", "كل التفاصيل")}</button></td></tr><tr class="oms-expanded-row" data-oms-detail="${rowId}" ${allExpanded ? "" : "hidden"}><td colspan="10"><div class="oms-expanded-content">${details.map(([title, values]) => `<section><h3>${escapeHtml(title)}</h3><dl>${values.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value ?? "-")}</dd></div>`).join("")}</dl></section>`).join("")}<section class="wide"><h3>${ui("Fee breakdown", "تفاصيل الرسوم")}</h3><div class="oms-expanded-fees">${fees.map(fee => `<div><span>${escapeHtml(omsFeeLabel(fee.name))}</span><strong>${shippingMoney(fee.amount, fee.currency || item.currency || "SAR")}</strong><code>${escapeHtml(fee.bill_code || "-")}</code></div>`).join("") || `<span class="muted">-</span>`}</div></section><section class="wide"><h3>${ui("Bill numbers", "أرقام الفواتير")}</h3><div class="oms-full-bills">${(item.bill_numbers || []).map(bill => `<code>${escapeHtml(bill)}</code>`).join("") || `<span class="muted">-</span>`}</div></section></div></td></tr>`;
      }).join("") : `<tr><td colspan="10"><div class="empty-state">${ui("No shipments match these filters", "لا توجد شحنات مطابقة للفلاتر")}</div></td></tr>`;
      tbody.querySelectorAll("[data-expand-oms]").forEach(button => button.onclick = () => {
        const detail = tbody.querySelector(`[data-oms-detail="${button.dataset.expandOms}"]`);
        const opening = detail.hasAttribute("hidden");
        detail.toggleAttribute("hidden", !opening);
        button.setAttribute("aria-expanded", String(opening));
        button.textContent = opening ? ui("Hide details", "إخفاء التفاصيل") : ui("Full details", "كل التفاصيل");
      });
    };
    renderRows();
    document.getElementById("backToClosings").onclick = () => { location.hash = "shippingClosings"; };
    document.getElementById("exportFullOmsReport").onclick = () => downloadOmsReportCsv(report);
    ["fullOmsSearch", "fullOmsStatus", "fullOmsCost"].forEach(id => document.getElementById(id).addEventListener(id === "fullOmsSearch" ? "input" : "change", renderRows));
    document.getElementById("toggleAllOmsDetails").onclick = event => { allExpanded = !allExpanded; event.currentTarget.textContent = allExpanded ? ui("Hide all details", "إخفاء كل التفاصيل") : ui("Show all details", "عرض كل التفاصيل"); renderRows(); };
  }

  async function renderIntegrationCenter(page) {
    const [shippingResult, paymentResult] = await Promise.all([api("/api/admin/shipping/integrations"), api("/api/admin/payment-gateways")]);
    const shipping = shippingResult.settings || shippingResult;
    const payments = paymentResult.settings || paymentResult;
    const integrations = [
      { id:"oto", type:"shipping", name:"OTO", description:ui("Multi-carrier rates, shipment creation and automatic status webhooks.","أسعار عدة شركات، إنشاء الشحنات وتحديث حالتها تلقائيًا."), icon:"truck", enabled:shipping.oto?.is_enabled, visible:shipping.oto?.show_at_checkout, ready:shipping.oto?.has_refresh_token, preferred:shipping.default_provider==="oto", target:"shippingIntegrations" },
      { id:"imile", type:"shipping", name:"iMile", description:ui("Direct shipping account, tracking and OMS financial reconciliation.","حساب الشحن المباشر والتتبع ومراجعة تقفيلات OMS."), icon:"truck", enabled:shipping.imile?.is_enabled, visible:shipping.imile?.show_at_checkout, ready:shipping.imile?.has_secret_key, preferred:shipping.default_provider==="imile", target:"shippingIntegrations" },
      { id:"tamara", type:"payment", name:"Tamara · تمارا", description:ui("Buy now pay later with live eligibility and payment webhooks.","اشتر الآن وادفع لاحقًا مع التحقق وإشعارات الدفع."), icon:"credit-card", enabled:payments.providers?.tamara?.is_enabled, visible:payments.providers?.tamara?.show_at_checkout, ready:payments.providers?.tamara?.is_configured, preferred:payments.active_provider==="tamara", target:"paymentGateways" },
      { id:"tabby", type:"payment", name:"Tabby · تابي", description:ui("Pay in 4 with dynamic return URLs and webhook updates.","الدفع على 4 دفعات مع روابط ديناميكية وتحديثات Webhook."), icon:"credit-card", enabled:payments.providers?.tabby?.is_enabled, visible:payments.providers?.tabby?.show_at_checkout, ready:payments.providers?.tabby?.is_configured, preferred:payments.active_provider==="tabby", target:"paymentGateways" },
      { id:"edfapay", type:"payment", name:"EdfaPay · ادفع باي", description:ui("Hosted card checkout with encrypted merchant credentials.","دفع بطاقات مستضاف مع بيانات تاجر مشفرة."), icon:"credit-card", enabled:payments.providers?.edfapay?.is_enabled, visible:payments.providers?.edfapay?.show_at_checkout, ready:payments.providers?.edfapay?.is_configured, preferred:payments.active_provider==="edfapay", target:"paymentGateways" },
      { id:"cod", type:"payment", name:ui("Cash on delivery","الدفع عند الاستلام"), description:ui("Allow customers to pay when the order is delivered.","السماح للعميل بالدفع عند استلام الطلب."), icon:"cart", enabled:payments.cash_on_delivery?.is_enabled!==false, visible:payments.cash_on_delivery?.is_enabled!==false, ready:true, preferred:false, target:"paymentGateways" }
    ];
    const enabledCount=integrations.filter(item=>item.enabled).length;
    page.innerHTML=pageTitle("integrationCenter",ui("Control shipping providers and payment gateways from one place.","تحكم في شركات الشحن وبوابات الدفع من مكان واحد."),`<button class="btn" type="button" data-open-integration="shippingIntegrations">${i("truck")}${ui("Shipping settings","إعدادات الشحن")}</button><button class="btn primary" type="button" data-open-integration="paymentGateways">${i("credit-card")}${ui("Payment settings","إعدادات الدفع")}</button>`);
    page.innerHTML+=`<section class="integration-overview-strip"><div><span class="section-kicker">INTEGRATION CENTER</span><h2>${ui("Connected services","الخدمات المرتبطة")}</h2><p>${ui("The main switch controls the service. Storefront visibility controls whether customers can select it.","المفتاح الرئيسي يشغّل الخدمة، ومفتاح الظهور يحدد هل يستطيع العميل اختيارها.")}</p></div><div class="integration-overview-stats"><span><strong>${enabledCount}</strong>${ui("enabled","مفعلة")}</span><span><strong>${integrations.filter(item=>item.ready).length}</strong>${ui("configured","مجهزة")}</span></div></section>
      <div class="integration-card-grid">${integrations.map(item=>`<article class="integration-service-card ${item.enabled?"is-enabled":""}" data-integration-card="${item.type}:${item.id}"><div class="integration-card-head"><span class="integration-card-icon">${i(item.icon)}</span><div><span class="integration-type">${item.type==="shipping"?ui("Shipping provider","شركة شحن"):ui("Payment method","وسيلة دفع")}</span><h2>${escapeHtml(item.name)}</h2></div><span class="status-pill ${item.ready?"good":"warn"}">${item.ready?ui("Configured","مجهزة"):ui("Setup required","تحتاج إعداد")}</span></div><p>${item.description}</p><div class="integration-card-controls"><div><strong>${ui("Enabled","التفعيل")}</strong><small>${item.enabled?ui("Service is running","الخدمة تعمل"):ui("Service is off","الخدمة متوقفة")}</small><input type="hidden" name="center_${item.type}_${item.id}_enabled" value="${item.enabled?"true":"false"}" />${switchButton({field:`center_${item.type}_${item.id}_enabled`,value:item.enabled,label:false})}</div>${item.id!=="cod"?`<div><strong>${ui("Show at checkout","الظهور عند الدفع")}</strong><small>${item.visible?ui("Visible to customers","ظاهرة للعملاء"):ui("Hidden from customers","مخفية عن العملاء")}</small><input type="hidden" name="center_${item.type}_${item.id}_visible" value="${item.visible?"true":"false"}" />${switchButton({field:`center_${item.type}_${item.id}_visible`,value:item.visible,label:false})}</div>`:""}</div><div class="integration-card-foot"><span>${item.preferred?`${i("check")}${ui("Default provider","المزود الافتراضي")}`:""}</span><button class="btn" type="button" data-open-integration="${item.target}">${i("settings")}${ui("Open settings","فتح الإعدادات")}</button></div></article>`).join("")}</div>`;
    document.querySelectorAll("[data-open-integration]").forEach(button=>button.onclick=()=>location.hash=button.dataset.openIntegration);
    document.querySelectorAll("[data-integration-card]").forEach(card=>{
      const [type,id]=card.dataset.integrationCard.split(":");
      const enabledButton=card.querySelector(`[data-form-switch="center_${type}_${id}_enabled"]`);
      const visibleButton=card.querySelector(`[data-form-switch="center_${type}_${id}_visible"]`);
      const saveState=async()=>{const is_enabled=enabledButton?.dataset.switchValue==="true",show_at_checkout=visibleButton?visibleButton.dataset.switchValue==="true":is_enabled;await api(type==="shipping"?`/api/admin/shipping/integrations/${id}/state`:`/api/admin/payment-gateways/${id}/state`,{method:"PATCH",body:JSON.stringify({is_enabled,show_at_checkout})});toast(ui("Integration state saved","تم حفظ حالة التكامل"));renderIntegrationCenter(page);};
      if(enabledButton)enabledButton.onclick=async()=>{updateFormSwitch(enabledButton);enabledButton.disabled=true;try{await saveState();}catch(error){toast(error.message,"error");renderIntegrationCenter(page);}};
      if(visibleButton)visibleButton.onclick=async()=>{updateFormSwitch(visibleButton);visibleButton.disabled=true;try{await saveState();}catch(error){toast(error.message,"error");renderIntegrationCenter(page);}};
    });
  }

  async function renderPaymentGateways(page) {
    const result = await api("/api/admin/payment-gateways");
    const settings = result.settings || {};
    const tamara = settings.providers?.tamara || {};
    const edfapay = settings.providers?.edfapay || {};
    const tabby = settings.providers?.tabby || {};
    const cod = settings.cash_on_delivery || {};
    const redirectPolicy = settings.redirect_policy || {};
    const transactions = result.transactions || [];
    const configured = Boolean(tamara.is_configured);
    const edfapayConfigured = Boolean(edfapay.is_configured);
    const tabbyConfigured = Boolean(tabby.is_configured);
    const active = tamara.show_at_checkout !== false && tamara.is_enabled;
    const tamaraWidgetActive = tamara.show_product_widget !== false && tamara.is_enabled;
    const edfapayActive = edfapay.show_at_checkout !== false && edfapay.is_enabled;
    const tabbyActive = tabby.show_at_checkout !== false && tabby.is_enabled;
    const testGood = tamara.last_test_status === "connected";
    const edfapayTestGood = edfapay.last_test_status === "connected";
    const webhookReady = Boolean(tamara.webhook_id && tamara.webhook_registered_at);
    const countryOptions = [["SA","Saudi Arabia","السعودية"],["AE","United Arab Emirates","الإمارات"],["BH","Bahrain","البحرين"],["KW","Kuwait","الكويت"],["OM","Oman","عُمان"]];
    const currencyOptions = ["SAR","AED","BHD","KWD","OMR"];
    const secretField = (name, labelEn, labelAr, hasValue) => `<div class="field"><label>${ui(labelEn,labelAr)}</label><div class="secret-input-wrap"><input name="${name}" type="password" value="" placeholder="${hasValue ? "••••••••••••" : ui("Enter credential","أدخل المفتاح")}" autocomplete="new-password" /><button class="btn icon-btn" type="button" data-toggle-payment-secret="${name}" title="${ui("Show typed value","إظهار القيمة المكتوبة")}">${i("eye")}</button></div><small>${hasValue ? ui("Saved encrypted. Leave empty to keep it.","محفوظ ومشفّر. اتركه فارغًا للاحتفاظ به.") : ui("Required before activation.","مطلوب قبل التفعيل.")}</small></div>`;
    const transactionLabel = type => ({checkout_created:ui("Checkout created","تم إنشاء جلسة"),checkout_failed:ui("Checkout failed","فشل إنشاء الجلسة"),webhook:ui("Webhook event","إشعار Tamara"),status_sync:ui("Status sync","مزامنة الحالة"),webhook_registered:ui("Webhook registered","تم تسجيل Webhook"),unmatched_webhook:ui("Unmatched webhook","إشعار غير مربوط")}[type] || type || "-");
    page.innerHTML = pageTitle("paymentGateways", ui("Connect and operate online payment providers without exposing credentials.","اربط وشغّل مزودي الدفع الإلكتروني بدون إظهار المفاتيح."), `<button class="btn" id="testTabby">${i("check")}${ui("Test Tabby","اختبار تابي")}</button><button class="btn" id="registerTabbyWebhook">${i("refresh")}${ui("Update Tabby webhook","تحديث Webhook تابي")}</button><button class="btn" id="testEdfaPay">${i("check")}${ui("Validate EdfaPay","فحص EdfaPay")}</button><button class="btn" id="testTamara">${i("check")}${ui("Test Tamara","اختبار Tamara")}</button><button class="btn" id="registerTamaraWebhook">${i("refresh")}${webhookReady?ui("Update webhook","تحديث Webhook"):ui("Register webhook","تسجيل Webhook")}</button><button class="btn primary" type="submit" form="paymentGatewayForm">${i("check")}${t("save")}</button>`);
    page.insertAdjacentHTML("beforeend", `
      <section class="payment-connection-hero ${active?"is-live":""}">
        <div class="tamara-mark" aria-label="Tamara"><span>tamara</span><b>تمارا</b></div>
        <div class="payment-connection-copy"><span class="section-kicker">PAYMENT ORCHESTRATION</span><h2>${active?ui("Tamara is available at checkout","تمارا متاحة في إتمام الطلب"):ui("Tamara is connected but not active","تمارا مضافة وتنتظر التفعيل")}</h2><p>${ui("Checkout sessions, payment state, redirects and webhook events are linked to the store order.","جلسات الدفع والحالة والتحويلات وإشعارات Tamara مرتبطة بطلب المتجر.")}</p></div>
        <div class="payment-health-grid"><div><span>${ui("Credentials","المفاتيح")}</span><strong class="${configured?"positive":""}">${configured?ui("Ready","جاهزة"):ui("Missing","ناقصة")}</strong></div><div><span>${ui("API test","اختبار API")}</span><strong class="${testGood?"positive":""}">${testGood?ui("Connected","متصل"):ui("Not tested","غير مختبر")}</strong></div><div><span>${ui("Webhook","الإشعارات")}</span><strong class="${webhookReady?"positive":""}">${webhookReady?ui("Registered","مسجّل"):ui("Pending","معلّق")}</strong></div><div><span>${ui("Environment","البيئة")}</span><strong>${tamara.environment==="sandbox"?"Sandbox":"Live"}</strong></div></div>
      </section>
      <form id="paymentGatewayForm" class="payment-settings-layout">
        <section class="card card-pad payment-provider-control">
          <div class="studio-card-head"><span class="section-kicker">PROVIDERS</span><div><h2>${ui("Checkout methods","طرق الدفع في المتجر")}</h2><p>${ui("Enable methods independently and choose the active online provider.","فعّل كل طريقة بشكل مستقل واختر مزود الدفع الإلكتروني النشط.")}</p></div></div>
          <div class="payment-method-row"><span class="payment-method-icon">${i("credit-card")}</span><div><strong>Tamara · تمارا</strong><small>${ui("Buy now, pay later","اشترِ الآن وادفع لاحقًا")}</small></div><div class="payment-method-switch"><span>${ui("Provider enabled","المزود مفعّل")}</span><input type="hidden" name="tamara_enabled" value="${tamara.is_enabled?"true":"false"}" />${switchButton({field:"tamara_enabled",value:tamara.is_enabled,label:false})}</div></div>
          <div class="payment-method-row"><span class="payment-method-icon neutral">${i("check")}</span><div><strong>${ui("Show Tamara at checkout","إظهار تمارا عند الدفع")}</strong><small>${ui("Controls storefront visibility independently.","يتحكم في ظهورها بالمتجر بشكل مستقل.")}</small></div><div class="payment-method-switch"><span>${active?ui("Active","نشطة"):ui("Inactive","غير نشطة")}</span><input type="hidden" name="tamara_active" value="${active?"true":"false"}" />${switchButton({field:"tamara_active",value:active,label:false})}</div></div>
          <div class="payment-method-row"><span class="payment-method-icon neutral">${i("badge-dollar-sign")}</span><div><strong>${ui("Show Tamara product widget","إظهار Widget تمارا في صفحة المنتج")}</strong><small>${ui("Displays Tamara instalment messaging below the live product price.","يعرض رسالة دفعات تمارا أسفل السعر الفعلي للمنتج.")}</small></div><div class="payment-method-switch"><span>${tamaraWidgetActive?ui("Active","نشط"):ui("Inactive","غير نشط")}</span><input type="hidden" name="tamara_product_widget" value="${tamaraWidgetActive?"true":"false"}" />${switchButton({field:"tamara_product_widget",value:tamaraWidgetActive,label:false})}</div></div>
          <div class="payment-method-row"><span class="payment-method-icon">${i("credit-card")}</span><div><strong>EdfaPay · ادفع باي</strong><small>${ui("Hosted card checkout","الدفع الآمن بالبطاقة")}</small></div><div class="payment-method-switch"><span>${ui("Provider enabled","المزود مفعّل")}</span><input type="hidden" name="edfapay_enabled" value="${edfapay.is_enabled?"true":"false"}" />${switchButton({field:"edfapay_enabled",value:edfapay.is_enabled,label:false})}</div></div>
          <div class="payment-method-row"><span class="payment-method-icon neutral">${i("check")}</span><div><strong>${ui("Show EdfaPay at checkout","إظهار ادفع باي عند الدفع")}</strong><small>${ui("Can operate beside Tamara and cash on delivery.","يمكن أن تعمل بجانب تمارا والدفع عند الاستلام.")}</small></div><div class="payment-method-switch"><span>${edfapayActive?ui("Active","نشطة"):ui("Inactive","غير نشطة")}</span><input type="hidden" name="edfapay_active" value="${edfapayActive?"true":"false"}" />${switchButton({field:"edfapay_active",value:edfapayActive,label:false})}</div></div>
          <div class="payment-method-row"><span class="payment-method-icon">${i("credit-card")}</span><div><strong>Tabby · تابي</strong><small>${ui("Pay in 4","الدفع على 4 دفعات")}</small></div><div class="payment-method-switch"><span>${ui("Provider enabled","المزود مفعّل")}</span><input type="hidden" name="tabby_enabled" value="${tabby.is_enabled?"true":"false"}" />${switchButton({field:"tabby_enabled",value:tabby.is_enabled,label:false})}</div></div>
          <div class="payment-method-row"><span class="payment-method-icon neutral">${i("check")}</span><div><strong>${ui("Show Tabby at checkout","إظهار تابي عند الدفع")}</strong><small>${ui("Uses the same redirect loop protection.","تستخدم نفس الحماية من تكرار التحويل.")}</small></div><div class="payment-method-switch"><span>${tabbyActive?ui("Active","نشطة"):ui("Inactive","غير نشطة")}</span><input type="hidden" name="tabby_active" value="${tabbyActive?"true":"false"}" />${switchButton({field:"tabby_active",value:tabbyActive,label:false})}</div></div>
          <div class="payment-method-row"><span class="payment-method-icon neutral">${i("cart")}</span><div><strong>${ui("Cash on delivery","الدفع عند الاستلام")}</strong><small>${ui("Can operate alongside Tamara.","يمكن أن يعمل بجانب تمارا.")}</small></div><div class="payment-method-switch"><span>${cod.is_enabled!==false?ui("Active","نشط"):ui("Inactive","غير نشط")}</span><input type="hidden" name="cod_enabled" value="${cod.is_enabled!==false?"true":"false"}" />${switchButton({field:"cod_enabled",value:cod.is_enabled!==false,label:false})}</div></div>
          <div class="field full"><label>${ui("Preferred online provider","مزود الدفع الإلكتروني المفضل")}</label><select name="preferred_provider"><option value="tamara" ${settings.active_provider==="tamara"?"selected":""}>Tamara</option><option value="tabby" ${settings.active_provider==="tabby"?"selected":""}>Tabby</option><option value="edfapay" ${settings.active_provider==="edfapay"?"selected":""}>EdfaPay</option><option value="none" ${settings.active_provider==="none"?"selected":""}>${ui("None","بدون")}</option></select></div>
        </section>
        <section class="card card-pad">
          <div class="studio-card-head"><span class="section-kicker">ENVIRONMENT</span><div><h2>${ui("Tamara endpoint","بيئة Tamara")}</h2><p>${ui("Live and sandbox URLs stay editable for future credentials.","روابط التشغيل والاختبار قابلة للتعديل عند تغيير المفاتيح.")}</p></div></div>
          <div class="form-grid"><div class="field full"><label>${ui("Current environment","البيئة الحالية")}</label><select name="environment"><option value="production" ${tamara.environment!=="sandbox"?"selected":""}>${ui("Live / production","الوضع المباشر")}</option><option value="sandbox" ${tamara.environment==="sandbox"?"selected":""}>Sandbox</option></select></div><div class="field full"><label>${ui("Live API URL","رابط API المباشر")}</label><input name="live_base_url" dir="ltr" value="${escapeHtml(tamara.live_base_url||"https://api.tamara.co")}" /></div><div class="field full"><label>${ui("Sandbox API URL","رابط API الاختباري")}</label><input name="sandbox_base_url" dir="ltr" value="${escapeHtml(tamara.sandbox_base_url||"https://api-sandbox.tamara.co")}" /></div></div>
        </section>
        <section class="card card-pad full-span payment-credentials-card">
          <div class="studio-card-head"><span class="section-kicker">SERVER VAULT</span><div><h2>${ui("Encrypted credentials","المفاتيح المشفّرة")}</h2><p>${ui("Values are encrypted before storage and are never returned to this page.","يتم تشفير القيم قبل الحفظ ولا تعود مرة أخرى لهذه الصفحة.")}</p></div><span class="status-pill ${configured?"good":"warn"}">${configured?ui("3 of 3 saved","3 من 3 محفوظة"):ui("Setup required","يحتاج إعداد")}</span></div>
          <div class="form-grid payment-secret-grid">${secretField("api_token",ui("API token","رمز API"),ui("رمز API","رمز API"),tamara.has_api_token)}${secretField("notification_token","Notification token","مفتاح الإشعارات",tamara.has_notification_token)}${secretField("public_key","Public key","المفتاح العام",tamara.has_public_key)}</div>
        </section>
        <section class="card card-pad">
          <div class="studio-card-head"><span class="section-kicker">CHECKOUT RULES</span><div><h2>${ui("Payment plan","خطة الدفع")}</h2><p>${ui("Controls what is sent when creating a Tamara checkout session.","تتحكم فيما يرسل عند إنشاء جلسة دفع Tamara.")}</p></div></div>
          <div class="form-grid"><div class="field"><label>${ui("Payment type","نوع الدفع")}</label><select name="payment_type"><option value="PAY_BY_INSTALMENTS" ${tamara.payment_type!=="PAY_NOW"?"selected":""}>PAY_BY_INSTALMENTS</option><option value="PAY_NOW" ${tamara.payment_type==="PAY_NOW"?"selected":""}>PAY_NOW</option></select></div><div class="field"><label>${ui("Instalments","عدد الدفعات")}</label><input name="instalments" type="number" min="2" max="12" value="${Number(tamara.instalments||3)}" /></div><div class="field"><label>${ui("Minimum order","أقل طلب")}</label><input name="minimum_amount" type="number" min="0" step="0.01" value="${Number(tamara.minimum_amount||0)}" /></div><div class="field"><label>${ui("Maximum order","أقصى طلب")}</label><input name="maximum_amount" type="number" min="0" step="0.01" value="${tamara.maximum_amount??""}" placeholder="${ui("No limit","بدون حد")}" /></div></div>
          <div class="payment-rule-toggle"><div><strong>${ui("Authorise approved orders automatically","اعتماد الطلب الموافق عليه تلقائيًا")}</strong><small>${ui("Calls Tamara authorisation after the approved event.","يستدعي اعتماد Tamara بعد وصول إشعار الموافقة.")}</small></div><input type="hidden" name="auto_authorise" value="${tamara.auto_authorise!==false?"true":"false"}" />${switchButton({field:"auto_authorise",value:tamara.auto_authorise!==false,label:false})}</div>
        </section>
        <section class="card card-pad">
          <div class="studio-card-head"><span class="section-kicker">AVAILABILITY</span><div><h2>${ui("Countries and currencies","الدول والعملات")}</h2><p>${ui("Tamara only appears when both the checkout country and currency match.","لا تظهر تمارا إلا عند تطابق دولة وعملة الطلب.")}</p></div></div>
          <div class="payment-choice-group"><label>${ui("Countries","الدول")}</label><div>${countryOptions.map(([code,en,ar])=>`<label class="payment-choice-chip"><input type="checkbox" name="supported_countries" value="${code}" ${tamara.supported_countries?.includes(code)?"checked":""}/><span>${code}</span><b>${ui(en,ar)}</b></label>`).join("")}</div></div>
          <div class="payment-choice-group"><label>${ui("Currencies","العملات")}</label><div>${currencyOptions.map(code=>`<label class="payment-choice-chip compact"><input type="checkbox" name="supported_currencies" value="${code}" ${tamara.supported_currencies?.includes(code)?"checked":""}/><b>${code}</b></label>`).join("")}</div></div>
        </section>
        <section class="card card-pad full-span payment-webhook-panel">
          <div><span class="section-kicker">WEBHOOK</span><h2>${ui("Server notification endpoint","رابط إشعارات السيرفر")}</h2><p>${ui("Payment updates continue to reach the store even when the customer does not return from Tamara.","تصل تحديثات الدفع للمتجر حتى لو لم يرجع العميل من صفحة Tamara.")}</p></div><code dir="ltr">${escapeHtml(result.webhook_endpoint||"")}</code><span class="status-pill ${webhookReady?"good":"warn"}">${webhookReady?`${ui("Registered","مسجّل")} · ${formatDateTime(tamara.webhook_registered_at)}`:ui("Registration pending","بانتظار التسجيل")}</span>
        </section>
        <section class="card card-pad full-span payment-credentials-card">
          <div class="studio-card-head"><span class="section-kicker">EDFAPAY</span><div><h2>${ui("EdfaPay hosted checkout","إعداد ادفع باي")}</h2><p>${ui("Merchant credentials are encrypted and used only by the server.","بيانات التاجر مشفّرة ولا يستخدمها إلا السيرفر.")}</p></div><span class="status-pill ${edfapayConfigured?"good":"warn"}">${edfapayConfigured?ui("Ready","جاهزة"):ui("Setup required","تحتاج إعداد")}</span></div>
          <div class="form-grid"><div class="field"><label>${ui("Environment","البيئة")}</label><select name="edfapay_environment"><option value="production" ${edfapay.environment!=="sandbox"?"selected":""}>${ui("Live / production","الوضع المباشر")}</option><option value="sandbox" ${edfapay.environment==="sandbox"?"selected":""}>Sandbox</option></select></div><div class="field"><label>${ui("Minimum order","أقل طلب")}</label><input name="edfapay_minimum_amount" type="number" min="0" step="0.01" value="${Number(edfapay.minimum_amount||0)}" /></div><div class="field full"><label>${ui("Live API URL","رابط API المباشر")}</label><input name="edfapay_live_base_url" dir="ltr" value="${escapeHtml(edfapay.live_base_url||"https://api.edfapay.com")}" /></div><div class="field full"><label>${ui("Sandbox API URL","رابط API الاختباري")}</label><input name="edfapay_sandbox_base_url" dir="ltr" value="${escapeHtml(edfapay.sandbox_base_url||"https://sandbox.edfapay.com")}" /></div></div>
          <div class="form-grid payment-secret-grid">${secretField("edfapay_merchant_id","Merchant ID","معرّف التاجر",edfapay.has_merchant_id)}${secretField("edfapay_merchant_password","Merchant password","كلمة مرور التاجر",edfapay.has_merchant_password)}${secretField("edfapay_webhook_secret","Webhook secret (optional)","مفتاح Webhook اختياري",edfapay.has_webhook_secret)}</div>
          <div class="payment-choice-group"><label>${ui("Countries","الدول")}</label><div>${countryOptions.map(([code,en,ar])=>`<label class="payment-choice-chip"><input type="checkbox" name="edfapay_supported_countries" value="${code}" ${edfapay.supported_countries?.includes(code)?"checked":""}/><span>${code}</span><b>${ui(en,ar)}</b></label>`).join("")}</div></div>
          <div class="payment-choice-group"><label>${ui("Currencies","العملات")}</label><div>${currencyOptions.map(code=>`<label class="payment-choice-chip compact"><input type="checkbox" name="edfapay_supported_currencies" value="${code}" ${edfapay.supported_currencies?.includes(code)?"checked":""}/><b>${code}</b></label>`).join("")}</div></div>
          <div class="payment-webhook-panel"><div><span class="section-kicker">RETURN URL</span><h3>${ui("Customer return","عودة العميل")}</h3><p>${ui("Generated from the current store domain.","يُولد من دومين المتجر الحالي.")}</p></div><code dir="ltr">${escapeHtml(edfapay.customer_return_url||"")}</code><button class="btn icon-btn" type="button" data-copy-payment-url="${escapeHtml(edfapay.customer_return_url||"")}" title="${ui("Copy","نسخ")}">${i("copy")}</button></div>
          <div class="payment-webhook-panel"><div><span class="section-kicker">CALLBACK URL</span><h3>${ui("Server callback","إشعار السيرفر")}</h3><p>${ui("Copy this URL into EdfaPay. Update it there whenever the store domain changes.","انسخ الرابط إلى EdfaPay وحدّثه هناك عند تغيير دومين المتجر.")}</p></div><code dir="ltr">${escapeHtml(edfapay.callback_url||"")}</code><button class="btn icon-btn" type="button" data-copy-payment-url="${escapeHtml(edfapay.callback_url||"")}" title="${ui("Copy","نسخ")}">${i("copy")}</button></div>
          <div class="payment-rule-toggle"><div><strong>${ui("Connection check","فحص الاتصال")}</strong><small>${escapeHtml(edfapay.last_test_message||ui("Not tested yet. Credentials are authenticated on the first checkout.","لم يتم الفحص بعد. يتم التحقق من بيانات الدخول في أول عملية دفع."))}</small></div><span class="status-pill ${edfapayTestGood?"good":"warn"}">${edfapayTestGood?ui("Endpoint reachable","النقطة متاحة"):ui("Not tested","غير مختبر")}</span></div>
        </section>
        <section class="card card-pad full-span payment-credentials-card">
          <div class="studio-card-head"><span class="section-kicker">TABBY</span><div><h2>${ui("Tabby Pay in 4","إعداد تابي")}</h2><p>${ui("KSA sessions use the regional API and dynamic store return URLs.","جلسات السعودية تستخدم API الإقليمي وروابط عودة مشتقة من دومين المتجر.")}</p></div><span class="status-pill ${tabbyConfigured?"good":"warn"}">${tabbyConfigured?ui("Ready","جاهزة"):ui("Setup required","تحتاج إعداد")}</span></div>
          <div class="form-grid"><div class="field"><label>${ui("Merchant code","كود التاجر")}</label><input name="tabby_merchant_code" dir="ltr" value="${escapeHtml(tabby.merchant_code||"SA")}" /></div><div class="field"><label>${ui("API base URL","رابط API")}</label><input name="tabby_base_url" dir="ltr" value="${escapeHtml(tabby.base_url||"https://api.tabby.sa")}" /></div><div class="field"><label>${ui("Minimum order","أقل طلب")}</label><input name="tabby_minimum_amount" type="number" min="0" step="0.01" value="${Number(tabby.minimum_amount||0)}" /></div><div class="field"><label>${ui("Maximum order","أقصى طلب")}</label><input name="tabby_maximum_amount" type="number" min="0" step="0.01" value="${tabby.maximum_amount??""}" /></div></div>
          <div class="form-grid payment-secret-grid">${secretField("tabby_public_key","Public API key","مفتاح API العام",tabby.has_public_key)}${secretField("tabby_secret_key","Secret API key","مفتاح API السري",tabby.has_secret_key)}</div>
          <div class="payment-rule-toggle"><div><strong>${ui("Capture authorized payments automatically","تحصيل المدفوعات المعتمدة تلقائيًا")}</strong><small>${ui("Creates one idempotent full capture after Tabby authorization.","ينشئ تحصيلًا كاملًا واحدًا بعد اعتماد تابي.")}</small></div><input type="hidden" name="tabby_auto_capture" value="${tabby.auto_capture!==false?"true":"false"}" />${switchButton({field:"tabby_auto_capture",value:tabby.auto_capture!==false,label:false})}</div>
          <div class="payment-webhook-panel"><div><span class="section-kicker">WEBHOOK</span><h3>${ui("Tabby payment updates","تحديثات دفع تابي")}</h3><p>${ui("Use Update Tabby webhook after any domain change.","استخدم تحديث Webhook تابي بعد تغيير الدومين.")}</p></div><code dir="ltr">${escapeHtml(tabby.callback_url||"")}</code><span class="status-pill ${tabby.webhook_registered_at&&tabby.webhook_url===tabby.callback_url?"good":"warn"}">${tabby.webhook_registered_at&&tabby.webhook_url===tabby.callback_url?ui("Current","محدث"):ui("Update required","يحتاج تحديث")}</span></div>
        </section>
        <section class="card card-pad full-span">
          <div class="studio-card-head"><span class="section-kicker">REDIRECT SAFETY</span><div><h2>${ui("Redirect loop protection","الحماية من تكرار التحويل")}</h2><p>${ui("Applies to every hosted payment gateway: one idempotent attempt, HTTPS validation and a limited automatic redirect count.","تُطبق على كل بوابات الدفع الخارجية: محاولة موحدة، تحقق HTTPS، وحد أقصى للتحويل التلقائي.")}</p></div><span class="status-pill good">${ui("Protected","مفعّلة")}</span></div>
          <div class="form-grid"><div class="field"><label>${ui("Maximum automatic redirects","أقصى عدد للتحويل التلقائي")}</label><input name="max_automatic_redirects" type="number" min="0" max="2" value="${Number(redirectPolicy.max_automatic_redirects??1)}" /><small>${ui("After this limit, the customer gets a manual Continue payment button.","بعد هذا الحد يظهر للعميل زر متابعة الدفع يدويًا.")}</small></div><div class="field"><label>${ui("Payment attempt lifetime","مدة صلاحية محاولة الدفع")}</label><div class="input-suffix"><input name="attempt_ttl_minutes" type="number" min="5" max="120" value="${Number(redirectPolicy.attempt_ttl_minutes||30)}" /><span>${ui("min","دقيقة")}</span></div><small>${ui("The same request reuses its existing provider session during this period.","يُعاد استخدام جلسة المزود نفسها خلال هذه المدة.")}</small></div></div>
        </section>
      </form>
      <section class="card payment-activity-card"><div class="payment-activity-head"><div><span class="section-kicker">PAYMENT LEDGER</span><h2>${ui("Recent gateway activity","آخر نشاط لبوابات الدفع")}</h2><p>${ui("Every checkout, provider update and webhook event is tied to its store order.","كل جلسة وتحديث وإشعار مربوط بطلب المتجر.")}</p></div><span>${transactions.length} ${ui("events","حدث")}</span></div><div class="table-scroll"><table class="data-table payment-activity-table"><thead><tr><th>${ui("Event","الحدث")}</th><th>${ui("Order","الطلب")}</th><th>${ui("Provider reference","مرجع المزود")}</th><th>${ui("Amount","المبلغ")}</th><th>${ui("Status","الحالة")}</th><th>${ui("Time","الوقت")}</th></tr></thead><tbody>${transactions.length?transactions.map(row=>`<tr><td><strong>${escapeHtml(transactionLabel(row.type))}</strong><small>${escapeHtml(row.provider||"")}</small></td><td>${row.order_id?`<button class="text-action" type="button" data-payment-order="${row.order_id}">#${row.order_id}</button>`:"-"}</td><td><code dir="ltr">${escapeHtml(row.provider_order_id||row.checkout_id||"-")}</code></td><td>${row.amount===null||row.amount===undefined?"-":bundleMoney(row.amount)}</td><td><span class="status-pill ${["authorised","captured","completed"].includes(row.status)?"good":["failed","cancelled","expired"].includes(row.status)?"bad":"warn"}">${escapeHtml(row.status||"pending")}</span></td><td>${formatDateTime(row.occurred_at||row.created_at)}</td></tr>`).join(""):`<tr><td colspan="6"><div class="empty-state">${ui("No payment activity yet.","لا توجد عمليات دفع حتى الآن.")}</div></td></tr>`}</tbody></table></div></section>`);
    document.querySelectorAll("[data-form-switch]").forEach(button=>button.onclick=()=>updateFormSwitch(button));
    document.querySelectorAll("[data-toggle-payment-secret]").forEach(button=>button.onclick=()=>{const input=document.querySelector(`[name="${button.dataset.togglePaymentSecret}"]`);if(input)input.type=input.type==="password"?"text":"password";});
    document.querySelectorAll("[data-payment-order]").forEach(button=>button.onclick=()=>location.hash=`orderDetail/${button.dataset.paymentOrder}`);
    const collect=()=>{const form=document.getElementById("paymentGatewayForm"),data=new FormData(form),countries=data.getAll("supported_countries"),currencies=data.getAll("supported_currencies"),edfapayCountries=data.getAll("edfapay_supported_countries"),edfapayCurrencies=data.getAll("edfapay_supported_currencies");return {active_provider:data.get("preferred_provider")||"none",redirect_policy:{max_automatic_redirects:Number(data.get("max_automatic_redirects")??1),attempt_ttl_minutes:Number(data.get("attempt_ttl_minutes")||30),require_https:true},cash_on_delivery:{is_enabled:data.get("cod_enabled")==="true"},providers:{tamara:{is_enabled:data.get("tamara_enabled")==="true",show_at_checkout:data.get("tamara_active")==="true",show_product_widget:data.get("tamara_product_widget")==="true",environment:data.get("environment"),live_base_url:data.get("live_base_url"),sandbox_base_url:data.get("sandbox_base_url"),api_token:data.get("api_token"),notification_token:data.get("notification_token"),public_key:data.get("public_key"),payment_type:data.get("payment_type"),instalments:Number(data.get("instalments")||3),minimum_amount:Number(data.get("minimum_amount")||0),maximum_amount:data.get("maximum_amount")===""?null:Number(data.get("maximum_amount")),auto_authorise:data.get("auto_authorise")==="true",supported_countries:countries,supported_currencies:currencies},edfapay:{is_enabled:data.get("edfapay_enabled")==="true",show_at_checkout:data.get("edfapay_active")==="true",environment:data.get("edfapay_environment"),live_base_url:data.get("edfapay_live_base_url"),sandbox_base_url:data.get("edfapay_sandbox_base_url"),merchant_id:data.get("edfapay_merchant_id"),merchant_password:data.get("edfapay_merchant_password"),webhook_secret:data.get("edfapay_webhook_secret"),minimum_amount:Number(data.get("edfapay_minimum_amount")||0),supported_countries:edfapayCountries,supported_currencies:edfapayCurrencies},tabby:{is_enabled:data.get("tabby_enabled")==="true",show_at_checkout:data.get("tabby_active")==="true",environment:"production",base_url:data.get("tabby_base_url"),public_key:data.get("tabby_public_key"),secret_key:data.get("tabby_secret_key"),merchant_code:data.get("tabby_merchant_code"),minimum_amount:Number(data.get("tabby_minimum_amount")||0),maximum_amount:data.get("tabby_maximum_amount")===""?null:Number(data.get("tabby_maximum_amount")),auto_capture:data.get("tabby_auto_capture")==="true",supported_countries:["SA"],supported_currencies:["SAR"]}}};};
    const save=async()=>api("/api/admin/payment-gateways",{method:"PUT",body:JSON.stringify(collect())});
    ["tamara_enabled","tamara_active","tamara_product_widget","edfapay_enabled","edfapay_active","tabby_enabled","tabby_active","cod_enabled"].forEach(field=>{const button=document.querySelector(`[data-form-switch="${field}"]`);if(!button)return;button.onclick=async()=>{updateFormSwitch(button);button.disabled=true;try{await save();toast(ui("Payment method updated","تم تحديث وسيلة الدفع"));renderPaymentGateways(page);}catch(error){toast(error.message,"error");renderPaymentGateways(page);}};});
    document.querySelector('[name="preferred_provider"]')?.addEventListener("change",async()=>{try{await save();toast(ui("Preferred gateway updated","تم تحديث بوابة الدفع المفضلة"));renderPaymentGateways(page);}catch(error){toast(error.message,"error");}});
    document.getElementById("paymentGatewayForm").onsubmit=async event=>{event.preventDefault();await save();toast(t("saved"));renderPaymentGateways(page);};
    document.getElementById("testTamara").onclick=async event=>{event.currentTarget.disabled=true;event.currentTarget.innerHTML=`<span class="loading-spinner"></span>${ui("Testing…","جاري الاختبار…")}`;try{await save();await api("/api/admin/payment-gateways/tamara/test",{method:"POST",body:"{}"});toast(ui("Tamara connection is working","اتصال Tamara يعمل بنجاح"));renderPaymentGateways(page);}catch(error){toast(error.message,"error");renderPaymentGateways(page);}};
    document.getElementById("testEdfaPay").onclick=async event=>{event.currentTarget.disabled=true;event.currentTarget.innerHTML=`<span class="loading-spinner"></span>${ui("Checking…","جاري الفحص…")}`;try{await save();await api("/api/admin/payment-gateways/edfapay/test",{method:"POST",body:"{}"});toast(ui("EdfaPay endpoint is reachable","نقطة اتصال EdfaPay متاحة"));renderPaymentGateways(page);}catch(error){toast(error.message,"error");renderPaymentGateways(page);}};
    document.getElementById("testTabby").onclick=async event=>{event.currentTarget.disabled=true;try{await save();await api("/api/admin/payment-gateways/tabby/test",{method:"POST",body:"{}"});toast(ui("Tabby connection is working","اتصال تابي يعمل بنجاح"));renderPaymentGateways(page);}catch(error){toast(error.message,"error");renderPaymentGateways(page);}};
    document.getElementById("registerTabbyWebhook").onclick=async event=>{event.currentTarget.disabled=true;try{await save();await api("/api/admin/payment-gateways/tabby/register-webhook",{method:"POST",body:"{}"});toast(ui("Tabby webhook updated","تم تحديث Webhook تابي"));renderPaymentGateways(page);}catch(error){toast(error.message,"error");event.currentTarget.disabled=false;}};
    document.querySelectorAll("[data-copy-payment-url]").forEach(button=>button.onclick=async()=>{try{await navigator.clipboard.writeText(button.dataset.copyPaymentUrl||"");toast(ui("URL copied","تم نسخ الرابط"));}catch{toast(ui("Could not copy URL","تعذر نسخ الرابط"),"error");}});
    document.getElementById("registerTamaraWebhook").onclick=async event=>{event.currentTarget.disabled=true;try{await save();await api("/api/admin/payment-gateways/tamara/register-webhook",{method:"POST",body:"{}"});toast(ui("Tamara webhook registered","تم تسجيل Webhook الخاص بـTamara"));renderPaymentGateways(page);}catch(error){toast(error.message,"error");event.currentTarget.disabled=false;}};
  }

  async function renderShippingIntegrations(page) {
    const [result, marketData] = await Promise.all([api("/api/admin/shipping/integrations"), api("/api/admin/market")]);
    const settings = result.settings || result;
    const imile = settings.imile || {};
    const oto = settings.oto || {};
    const oms = settings.oms_connector || {};
    const spl = settings.spl_address || {};
    const pricing = settings.customer_pricing || {};
    const sender = imile.sender || {};
    const estimateProfiles = pricing.estimate_profiles?.length ? pricing.estimate_profiles : [{id:"sa-sar-default",country_code:"SA",currency:"SAR",base_delivery_fee:18,cod_fixed_fee:2,pos_percent:2,vat_percent:15,pos_basis:"collectable_amount",tax_mode:"add",minimum_estimate:0,maximum_estimate:null,is_active:true}];
    const countries = marketData.countries || [];
    const currencies = marketData.currencies?.currencies || [];
    const estimateProfileRow = (profile = {}, index = 0) => `<article class="estimate-profile-row" data-estimate-profile data-id="${escapeHtml(profile.id || `estimate-${Date.now()}-${index}`)}"><div class="estimate-profile-head"><span>${String(index+1).padStart(2,"0")}</span><div><strong>${ui("Country pricing profile", "ملف تسعير البلد")}</strong><small>${ui("Carrier estimate only; the actual iMile fee remains separate.", "تقدير للشركة فقط، وتظل تكلفة iMile الفعلية منفصلة.")}</small></div><div class="field compact-switch"><input type="hidden" name="estimate_is_active" value="${profile.is_active !== false}" />${switchButton({field:"estimate_is_active",value:profile.is_active !== false,label:false})}</div><button class="btn icon-btn danger" type="button" data-remove-estimate-profile title="${t("delete")}">${i("trash")}</button></div><div class="estimate-profile-grid"><div class="field"><label>${ui("Country", "البلد")}</label><select name="estimate_country_code">${countries.map(country=>`<option value="${country.code}" ${country.code===(profile.country_code||"SA")?"selected":""}>${escapeHtml(state.lang==="ar"?country.name_ar:country.name_en)} · ${country.flag||""}</option>`).join("")}</select></div><div class="field"><label>${ui("Currency", "العملة")}</label><select name="estimate_currency">${currencies.map(currency=>`<option value="${currency.code}" ${currency.code===(profile.currency||"SAR")?"selected":""}>${currency.code} · ${escapeHtml(state.lang==="ar"?currency.name_ar:currency.name_en)}</option>`).join("")}</select></div><div class="field"><label>${ui("Base delivery", "التوصيل الأساسي")}</label><input name="estimate_base_delivery_fee" type="number" min="0" step="0.001" value="${Number(profile.base_delivery_fee||0)}" /></div><div class="field"><label>${ui("COD fixed fee", "رسوم COD الثابتة")}</label><input name="estimate_cod_fixed_fee" type="number" min="0" step="0.001" value="${Number(profile.cod_fixed_fee||0)}" /></div><div class="field"><label>${ui("POS percentage", "نسبة POS")}</label><div class="input-suffix"><input name="estimate_pos_percent" type="number" min="0" max="100" step="0.001" value="${Number(profile.pos_percent||0)}" /><span>%</span></div></div><div class="field"><label>${ui("VAT", "الضريبة")}</label><div class="input-suffix"><input name="estimate_vat_percent" type="number" min="0" max="100" step="0.001" value="${Number(profile.vat_percent||0)}" /><span>%</span></div></div><div class="field"><label>${ui("POS basis", "أساس نسبة POS")}</label><select name="estimate_pos_basis"><option value="collectable_amount" ${profile.pos_basis!=="order_subtotal"?"selected":""}>${ui("Collectable amount", "المبلغ المحصل")}</option><option value="order_subtotal" ${profile.pos_basis==="order_subtotal"?"selected":""}>${ui("Products subtotal", "مجموع المنتجات")}</option></select></div><div class="field"><label>${ui("Tax mode", "طريقة الضريبة")}</label><select name="estimate_tax_mode"><option value="add" ${profile.tax_mode==="add"?"selected":""}>${ui("Add to fees", "تضاف على الرسوم")}</option><option value="included" ${profile.tax_mode==="included"?"selected":""}>${ui("Included", "مشمولة")}</option><option value="none" ${profile.tax_mode==="none"?"selected":""}>${ui("No tax", "بدون ضريبة")}</option></select></div><div class="field"><label>${ui("Minimum estimate", "أقل تقدير")}</label><input name="estimate_minimum" type="number" min="0" step="0.01" value="${Number(profile.minimum_estimate||0)}" /></div><div class="field"><label>${ui("Maximum estimate", "أقصى تقدير")}</label><input name="estimate_maximum" type="number" min="0" step="0.01" value="${profile.maximum_estimate??""}" /></div></div><div class="estimate-example"><span>${ui("Example for 100", "مثال على طلب 100")} ${profile.currency||"SAR"}</span><strong>${shippingMoney((Number(profile.base_delivery_fee||0)+Number(profile.cod_fixed_fee||0)+Number(profile.pos_percent||0))*(1+Number(profile.vat_percent||0)/100),profile.currency||"SAR")}</strong><small>${ui("Card on delivery using the current values", "بطاقة عند الاستلام بالقيم الحالية")}</small></div></article>`;
    page.innerHTML = pageTitle("shippingIntegrations", "", `<button class="btn" id="testImile">${i("truck")}iMile</button><button class="btn" id="testOto">${i("truck")}OTO</button>`);
    page.innerHTML += `
      <div class="shipping-provider-banner ${settings.active_provider === "imile" ? "is-live" : ""}">
        <div class="provider-logo">iMile</div>
        <div><span class="section-kicker">${ui("SHIPPING PROVIDER", "مزود الشحن")}</span><h2>iMile</h2><p>${ui("Quote delivery, keep tracking events, and reconcile customer charges against carrier costs.", "تسعير الشحن وتتبع حالاته ومقارنة ما دفعه العميل بتكلفة شركة الشحن.")}</p></div>
        <span class="status-pill ${settings.active_provider === "imile" ? "good" : "empty"}">${settings.active_provider === "imile" ? ui("Active provider", "المزود النشط") : ui("Not active", "غير نشط")}</span>
      </div>
      <form id="shippingIntegrationForm" class="shipping-settings-layout">
        <section class="card card-pad full-span address-integration-card">
          <div class="studio-card-head"><span class="section-kicker">SPL ADDRESS</span><div><h2>${ui("Saudi National Address", "العنوان الوطني السعودي")}</h2><p>${ui("Resolve the 8-character short address, verify it, and fill checkout and shipping fields.", "تحويل الرمز المختصر المكون من 8 خانات إلى عنوان موثق وملء بيانات الطلب والشحن.")}</p></div><span class="status-pill ${spl.is_enabled&&spl.has_api_key?"good":"empty"}">${spl.is_enabled&&spl.has_api_key?ui("Ready","جاهز"):ui("Setup required","يحتاج إعداد")}</span></div>
          <div class="setting-toggle"><div><strong>${ui("Enable SPL verification", "تفعيل تحقق SPL")}</strong><small>${ui("Only Saudi checkout addresses use this integration.", "يستخدم هذا التكامل لعناوين الطلبات السعودية فقط.")}</small></div><input type="hidden" name="spl_enabled" value="${spl.is_enabled?"true":"false"}" />${switchButton({field:"spl_enabled",value:spl.is_enabled,label:false})}</div>
          <div class="form-grid" style="margin-top:16px">
            <div class="field"><label>${ui("Subscription key", "مفتاح الاشتراك")}</label><input name="spl_api_key" type="password" value="" placeholder="${spl.has_api_key?ui("Saved - leave blank to keep","محفوظ - اتركه فارغًا للاحتفاظ به"):ui("Enter SPL subscription key","أدخل مفتاح اشتراك SPL")}" autocomplete="new-password" /></div>
            <div class="field"><label>${ui("Response language", "لغة بيانات العنوان")}</label><select name="spl_language"><option value="A" ${spl.language!=="E"?"selected":""}>العربية</option><option value="E" ${spl.language==="E"?"selected":""}>English</option></select></div>
            <div class="field"><label>${ui("Cache period", "مدة حفظ التحقق")}</label><select name="spl_cache_days">${[7,30,90,180].map(days=>`<option value="${days}" ${Number(spl.cache_days||30)===days?"selected":""}>${days} ${ui("days","يوم")}</option>`).join("")}</select></div>
            <div class="field"><label>${ui("Test short address", "رمز مختصر للاختبار")}</label><div class="secret-input-wrap"><input name="spl_test_short_address" maxlength="9" placeholder="AAAA 0000" style="direction:ltr;text-transform:uppercase" /><button class="btn" type="button" id="testSplAddress">${i("map")}${ui("Test","اختبار")}</button></div></div>
          </div>
          <div class="setting-toggle-grid" style="margin-top:16px">
            <div class="setting-toggle"><div><strong>${ui("Require verified short addresses", "طلب التحقق من الرمز المختصر")}</strong><small>${ui("A supplied short address must be confirmed by SPL before placing the order.", "إذا أدخل العميل رمزًا مختصرًا يجب تأكيده من SPL قبل تنفيذ الطلب.")}</small></div><input type="hidden" name="spl_require_verified" value="${spl.require_verified_checkout!==false?"true":"false"}" />${switchButton({field:"spl_require_verified",value:spl.require_verified_checkout!==false,label:false})}</div>
            <div class="setting-toggle"><div><strong>${ui("Manual fallback on outage", "السماح بالإدخال اليدوي عند التعطل")}</strong><small>${ui("Keeps checkout available only when SPL itself is unavailable.", "يبقي إتمام الطلب متاحًا فقط عند تعطل خدمة SPL نفسها.")}</small></div><input type="hidden" name="spl_manual_fallback" value="${spl.allow_manual_fallback!==false?"true":"false"}" />${switchButton({field:"spl_manual_fallback",value:spl.allow_manual_fallback!==false,label:false})}</div>
          </div>
          <div id="splTestResult" class="integration-inline-result" hidden></div>
        </section>
        <section class="card card-pad">
          <div class="studio-card-head"><span class="section-kicker">${ui("CONNECTION", "الاتصال")}</span><div><h2>${ui("iMile API", "واجهة iMile")}</h2><p>${ui("Secrets stay encrypted on the server and are never returned to this page.", "المفاتيح تحفظ مشفرة على السيرفر ولا تعاد إلى هذه الصفحة.")}</p></div></div>
          <div class="setting-toggle"><div><strong>${ui("Enable iMile", "تفعيل iMile")}</strong><small>${ui("Makes iMile available as a shipping provider.", "يجعل iMile متاحًا كمزود شحن.")}</small></div><input type="hidden" name="imile_enabled" value="${imile.is_enabled ? "true" : "false"}" />${switchButton({ field: "imile_enabled", value: imile.is_enabled, label: false })}</div>
          <div class="setting-toggle" style="margin-top:10px"><div><strong>${ui("Show iMile at checkout", "إظهار iMile عند الدفع")}</strong><small>${ui("Customers can select direct iMile delivery.", "يستطيع العميل اختيار توصيل iMile المباشر.")}</small></div><input type="hidden" name="imile_show_checkout" value="${imile.show_at_checkout!==false?"true":"false"}" />${switchButton({field:"imile_show_checkout",value:imile.show_at_checkout!==false,label:false})}</div>
          <div class="form-grid" style="margin-top:16px">
            <div class="field"><label>${ui("Default provider", "شركة الشحن الافتراضية")}</label><select name="active_provider"><option value="internal" ${settings.default_provider === "internal" ? "selected" : ""}>${ui("Internal shipping", "الشحن الداخلي")}</option><option value="imile" ${settings.default_provider === "imile" ? "selected" : ""}>iMile</option><option value="oto" ${settings.default_provider === "oto" ? "selected" : ""}>OTO</option></select></div>
            <div class="field"><label>${ui("Environment", "البيئة")}</label><select name="environment"><option value="production" ${imile.environment !== "sandbox" ? "selected" : ""}>Production</option><option value="sandbox" ${imile.environment === "sandbox" ? "selected" : ""}>Sandbox</option></select></div>
            <div class="field"><label>${ui("Customer ID", "رقم العميل")}</label><input name="customer_id" value="${escapeHtml(imile.customer_id || "")}" autocomplete="off" /></div>
            <div class="field"><label>${ui("Secret key", "المفتاح السري")}</label><input name="secret_key" type="password" value="" placeholder="${imile.has_secret_key ? ui("Saved - leave blank to keep", "محفوظ - اتركه فارغًا للاحتفاظ به") : ui("Enter secret key", "أدخل المفتاح السري")}" autocomplete="new-password" /></div>
            <div class="field full"><label>${ui("Logistics product code", "كود منتج الشحن")}</label><input name="logistics_product_code" value="${escapeHtml(imile.logistics_product_code || "")}" placeholder="LP..." /><small class="muted">${ui("Required by iMile before automatic shipment creation can be enabled.", "حقل إلزامي من iMile قبل تفعيل إنشاء الشحنات تلقائيًا.")}</small></div>
            <div class="field"><label>${ui("Signing method", "طريقة التوقيع")}</label><select name="sign_method"><option value="SHA256" ${imile.sign_method !== "MD5" ? "selected" : ""}>SHA256</option><option value="MD5" ${imile.sign_method === "MD5" ? "selected" : ""}>MD5</option></select></div>
            <div class="field"><label>${ui("Sync interval (minutes)", "دورية التحديث بالدقائق")}</label><input name="sync_interval_minutes" type="number" min="15" value="${Number(imile.sync_interval_minutes || 60)}" /></div>
          </div>
          <div class="setting-toggle-grid" style="margin-top:16px">
            <div class="setting-toggle"><div><strong>${ui("Tracking sync", "مزامنة التتبع")}</strong><small>${ui("Refresh status from iMile.", "تحديث حالة الشحنات من iMile.")}</small></div><input type="hidden" name="auto_sync_tracking" value="${imile.auto_sync_tracking ? "true" : "false"}" />${switchButton({ field: "auto_sync_tracking", value: imile.auto_sync_tracking, label: false })}</div>
            <div class="setting-toggle"><div><strong>${ui("Create shipments automatically", "إنشاء الشحنات تلقائيًا")}</strong><small>${ui("Keep off until live order mapping is approved.", "اتركه مغلقًا حتى اعتماد حقول الطلب النهائي.")}</small></div><input type="hidden" name="auto_create_orders" value="${imile.auto_create_orders ? "true" : "false"}" />${switchButton({ field: "auto_create_orders", value: imile.auto_create_orders, label: false })}</div>
          </div>
        </section>
        <section class="card card-pad">
          <div class="studio-card-head"><span class="section-kicker">MULTI-CARRIER</span><div><h2>OTO</h2><p>${ui("Offer OTO carrier rates beside direct iMile and route the selected option with the order.", "اعرض شركات OTO بجانب iMile واربط اختيار العميل بالطلب.")}</p></div><span class="status-pill ${oto.is_enabled&&oto.has_refresh_token?"good":"empty"}">${oto.is_enabled&&oto.has_refresh_token?ui("Ready","جاهز"):ui("Setup required","يحتاج إعداد")}</span></div>
          <div class="setting-toggle-grid">
            <div class="setting-toggle"><div><strong>${ui("Enable OTO", "تفعيل OTO")}</strong><small>${ui("Makes OTO rates available at checkout.", "يجعل أسعار OTO متاحة عند الدفع.")}</small></div><input type="hidden" name="oto_enabled" value="${oto.is_enabled?"true":"false"}" />${switchButton({field:"oto_enabled",value:oto.is_enabled,label:false})}</div>
            <div class="setting-toggle"><div><strong>${ui("Show to customers", "إظهارها للعملاء")}</strong><small>${ui("Customers can compare and select this provider.", "يستطيع العميل المقارنة والاختيار.")}</small></div><input type="hidden" name="oto_show_checkout" value="${oto.show_at_checkout!==false?"true":"false"}" />${switchButton({field:"oto_show_checkout",value:oto.show_at_checkout!==false,label:false})}</div>
            <div class="setting-toggle"><div><strong>${ui("Exclude duplicate iMile", "منع تكرار iMile")}</strong><small>${ui("Hides OTO's iMile option while direct iMile is enabled.", "يخفي iMile التابعة لـ OTO عند تفعيل الربط المباشر.")}</small></div><input type="hidden" name="oto_exclude_imile" value="${oto.exclude_imile_when_direct!==false?"true":"false"}" />${switchButton({field:"oto_exclude_imile",value:oto.exclude_imile_when_direct!==false,label:false})}</div>
            <div class="setting-toggle"><div><strong>${ui("Create OTO orders automatically", "إنشاء طلبات OTO تلقائيًا")}</strong><small>${ui("Off keeps checkout safe while setup is being tested.", "إيقافه يحمي الطلبات أثناء اختبار الإعداد.")}</small></div><input type="hidden" name="oto_auto_create_orders" value="${oto.auto_create_orders?"true":"false"}" />${switchButton({field:"oto_auto_create_orders",value:oto.auto_create_orders,label:false})}</div>
          </div>
          <div class="form-grid" style="margin-top:16px">
            <div class="field"><label>${ui("Environment", "البيئة")}</label><select name="oto_environment"><option value="production" ${oto.environment!=="sandbox"?"selected":""}>Production</option><option value="sandbox" ${oto.environment==="sandbox"?"selected":""}>Sandbox</option></select></div>
            <div class="field"><label>${ui("Rate source", "مصدر الأسعار")}</label><select name="oto_quote_mode"><option value="oto_rates" ${oto.quote_mode==="oto_rates"?"selected":""}>${ui("OTO contracts", "عقود OTO")}</option><option value="own_contracts" ${oto.quote_mode==="own_contracts"?"selected":""}>${ui("My carrier contracts", "عقودي مع الشركات")}</option><option value="both" ${oto.quote_mode==="both"?"selected":""}>${ui("Both", "الاثنان")}</option></select></div>
            <div class="field full"><label>Refresh token</label><input name="oto_refresh_token" type="password" value="" placeholder="${oto.has_refresh_token?ui("Saved - leave blank to keep","محفوظ - اتركه فارغًا للاحتفاظ به"):ui("Paste OTO refresh token","أدخل Refresh Token من OTO")}" autocomplete="new-password" /></div>
            <div class="field"><label>${ui("Pickup location code", "كود موقع الاستلام")}</label><input name="oto_pickup_location_code" value="${escapeHtml(oto.pickup_location_code||"")}" /></div>
            <div class="field"><label>${ui("Order prefix", "بادئة الطلب")}</label><input name="oto_order_prefix" value="${escapeHtml(oto.order_prefix||"SFY-")}" style="direction:ltr" /></div>
            <div class="field"><label>${ui("Fixed markup", "زيادة ثابتة")}</label><input name="oto_markup_fixed" type="number" min="0" step="0.01" value="${Number(oto.markup_fixed||0)}" /></div>
            <div class="field"><label>${ui("Markup %", "نسبة الزيادة")}</label><input name="oto_markup_percent" type="number" min="0" step="0.01" value="${Number(oto.markup_percent||0)}" /></div>
            <div class="field"><label>${ui("Fallback amount", "السعر الاحتياطي")}</label><input name="oto_fallback_amount" type="number" min="0" step="0.01" value="${Number(oto.fallback_amount||0)}" /></div>
            <div class="field"><label>${ui("Checkout options", "عدد اختيارات الدفع")}</label><input name="oto_max_checkout_options" type="number" min="1" max="10" value="${Number(oto.max_checkout_options||4)}" /></div>
          </div>
          <div class="oms-connector-foot" style="margin-top:16px"><div><span>Webhook</span><strong>${oto.webhook_registered_at?ui("Status updates connected","تحديثات الحالة متصلة"):ui("Not registered yet","لم يتم تسجيله بعد")}</strong><small>${escapeHtml(oto.webhook_url||"")}</small></div><button class="btn" type="button" id="registerOtoWebhook">${i("refresh")}${ui("Register status webhook","ربط تحديثات الحالة")}</button></div>
        </section>
        <section class="card card-pad">
          <div class="studio-card-head"><span class="section-kicker">${ui("CUSTOMER PRICING", "تسعير العميل")}</span><div><h2>${ui("Checkout shipping charge", "تكلفة الشحن في الطلب")}</h2><p>${ui("Choose what the customer pays. Carrier estimates remain visible internally.", "حدد ما يدفعه العميل، مع إبقاء تقدير شركة الشحن ظاهرًا داخليًا.")}</p></div></div>
          <div class="form-grid">
            <div class="field full"><label>${ui("Pricing strategy", "طريقة الحساب")}</label><select name="pricing_strategy">
              <option value="internal_rules" ${pricing.strategy === "internal_rules" ? "selected" : ""}>${ui("Existing store rules", "قواعد المتجر الحالية")}</option>
              <option value="free" ${pricing.strategy === "free" ? "selected" : ""}>${ui("Always free", "مجاني دائمًا")}</option>
              <option value="fixed" ${pricing.strategy === "fixed" ? "selected" : ""}>${ui("Fixed charge", "مبلغ ثابت")}</option>
              <option value="carrier_estimate" ${pricing.strategy === "carrier_estimate" ? "selected" : ""}>${ui("iMile estimate", "تقدير iMile")}</option>
              <option value="estimate_plus_fixed" ${pricing.strategy === "estimate_plus_fixed" ? "selected" : ""}>${ui("Estimate + fixed markup", "التقدير + زيادة ثابتة")}</option>
              <option value="estimate_plus_percent" ${pricing.strategy === "estimate_plus_percent" ? "selected" : ""}>${ui("Estimate + percentage", "التقدير + نسبة")}</option>
              <option value="subsidized_fixed" ${pricing.strategy === "subsidized_fixed" ? "selected" : ""}>${ui("Estimate minus subsidy", "التقدير ناقص دعم المتجر")}</option>
            </select></div>
            <div class="field"><label>${ui("Fixed charge", "المبلغ الثابت")}</label><input name="fixed_amount" type="number" min="0" step="0.01" value="${Number(pricing.fixed_amount || 0)}" /></div>
            <div class="field"><label>${ui("Fixed markup", "الزيادة الثابتة")}</label><input name="markup_fixed" type="number" min="0" step="0.01" value="${Number(pricing.markup_fixed || 0)}" /></div>
            <div class="field"><label>${ui("Markup %", "نسبة الزيادة")}</label><input name="markup_percent" type="number" min="0" step="0.01" value="${Number(pricing.markup_percent || 0)}" /></div>
            <div class="field"><label>${ui("Store subsidy", "دعم المتجر")}</label><input name="subsidy_fixed" type="number" min="0" step="0.01" value="${Number(pricing.subsidy_fixed || 0)}" /></div>
            <div class="field"><label>${ui("Minimum charge", "الحد الأدنى")}</label><input name="minimum_charge" type="number" min="0" step="0.01" value="${Number(pricing.minimum_charge || 0)}" /></div>
            <div class="field"><label>${ui("Maximum charge", "الحد الأقصى")}</label><input name="maximum_charge" type="number" min="0" step="0.01" value="${pricing.maximum_charge ?? ""}" /></div>
            <div class="field"><label>${ui("Fallback charge", "المبلغ الاحتياطي")}</label><input name="fallback_amount" type="number" min="0" step="0.01" value="${Number(pricing.fallback_amount || 0)}" /></div>
          </div>
        </section>
        <section class="card card-pad full-span estimate-profiles-card">
          <div class="studio-card-head"><span class="section-kicker">ESTIMATES</span><div><h2>${ui("Country estimation profiles", "ملفات التكلفة التقديرية")}</h2><p>${ui("Estimate delivery, COD, POS and tax before iMile sends the actual closing fee.", "احسب التوصيل وCOD وPOS والضريبة تقديريًا قبل وصول التكلفة الفعلية من iMile.")}</p></div><button class="btn" type="button" id="addEstimateProfile">${i("plus")}${ui("Add profile", "إضافة ملف")}</button></div><div id="estimateProfilesList" class="estimate-profiles-list">${estimateProfiles.map(estimateProfileRow).join("")}</div>
        </section>
        <section class="card card-pad full-span oms-connector-card">
          <div class="studio-card-head">
            <span class="section-kicker">OMS REPORTS</span>
            <div><h2>${ui("OMS closing reports", "تقارير تقفيلات OMS")}</h2><p>${ui("Reads fee reports from the iMile dashboard and matches actual carrier costs to store shipments.", "يقرأ تقارير الرسوم من لوحة iMile ويربط التكلفة الفعلية بشحنات المتجر.")}</p></div>
            <span class="status-pill ${oms.is_enabled && oms.has_password ? "good" : "empty"}">${oms.is_enabled && oms.has_password ? ui("Ready", "جاهز") : ui("Setup required", "يحتاج إعداد")}</span>
          </div>
          <div class="oms-connector-grid">
            <div class="setting-toggle oms-toggle"><div><strong>${ui("Enable OMS connector", "تفعيل موصل OMS")}</strong><small>${ui("Allows read-only fee report synchronization.", "يسمح بمزامنة تقارير الرسوم للقراءة فقط.")}</small></div><input type="hidden" name="oms_enabled" value="${oms.is_enabled ? "true" : "false"}" />${switchButton({ field: "oms_enabled", value: oms.is_enabled, label: false })}</div>
            <div class="setting-toggle oms-toggle"><div><strong>${ui("Scheduled incremental sync", "المزامنة التزايدية المجدولة")}</strong><small>${ui("The server checks for changes in the background; opening Closings never starts a new download.", "يفحص السيرفر التغييرات في الخلفية، وفتح التقفيلات لا يبدأ تنزيلًا جديدًا.")}</small></div><input type="hidden" name="oms_auto_sync" value="${oms.auto_sync_on_open !== false ? "true" : "false"}" />${switchButton({ field: "oms_auto_sync", value: oms.auto_sync_on_open !== false, label: false })}</div>
          </div>
          <div class="oms-credentials-panel">
            <div class="oms-credentials-head"><div><span class="section-kicker">${ui("LOGIN ACCOUNT", "حساب الدخول")}</span><h3>${ui("OMS dashboard credentials", "بيانات دخول لوحة OMS")}</h3><p>${ui("Used only by the secure server connector. The saved password is never returned to the browser.", "تستخدم فقط بواسطة الموصل الآمن على السيرفر، ولا تتم إعادة كلمة المرور المحفوظة إلى المتصفح.")}</p></div><span class="status-pill ${oms.has_password ? "good" : "warn"}">${oms.has_password ? ui("Password saved securely", "كلمة المرور محفوظة ومشفرة") : ui("Password required", "كلمة المرور مطلوبة")}</span></div>
            <div class="form-grid">
              <div class="field"><label>${ui("OMS username / login account", "اسم مستخدم OMS / حساب الدخول")}</label><input name="oms_username" value="${escapeHtml(oms.username || "")}" autocomplete="username" /></div>
              <div class="field"><label>${oms.has_password ? ui("Replace saved password", "استبدال كلمة المرور المحفوظة") : ui("OMS account password", "كلمة مرور حساب OMS")}</label><div class="secret-input-wrap"><input name="oms_password" id="omsPasswordInput" type="password" value="" placeholder="${oms.has_password ? "••••••••••••" : ui("Enter OMS password", "أدخل كلمة مرور OMS")}" autocomplete="new-password" /><button class="btn icon-btn" type="button" id="toggleOmsPassword" title="${ui("Show typed password", "إظهار كلمة المرور المكتوبة")}">${i("eye")}</button></div><small>${oms.has_password ? ui("Leave empty to keep the encrypted password already saved.", "اترك الحقل فارغًا للاحتفاظ بكلمة المرور المشفرة المحفوظة حاليًا.") : ui("Enter the password used on the iMile OMS login page.", "أدخل كلمة المرور المستخدمة في صفحة دخول iMile OMS.")}</small></div>
              <div class="field"><label>${ui("OMS environment", "بيئة OMS")}</label><select name="oms_environment"><option value="production" ${oms.environment !== "sandbox" ? "selected" : ""}>Production</option><option value="sandbox" ${oms.environment === "sandbox" ? "selected" : ""}>Sandbox</option></select></div>
              <div class="field"><label>${ui("Report lookback", "مدة البحث عن التقارير")}</label><select name="oms_lookback_days">${[7,14,30,60,90].map(days=>`<option value="${days}" ${Number(oms.lookback_days||30)===days?"selected":""}>${days} ${ui("days", "يوم")}</option>`).join("")}</select></div>
              <div class="field"><label>${ui("Late-update overlap", "تداخل التحديثات المتأخرة")}</label><select name="oms_sync_overlap_days">${[1,2,3,5,7].map(days=>`<option value="${days}" ${Number(oms.sync_overlap_days||2)===days?"selected":""}>${days} ${ui("days", "يوم")}</option>`).join("")}</select><small>${ui("Rechecks this short window and updates existing rows without duplicating them.", "يعيد فحص هذه المدة القصيرة ويحدث السجلات الموجودة بدون تكرارها.")}</small></div>
              <div class="field"><label>${ui("Scheduled frequency", "دورية المزامنة")}</label><select name="oms_sync_interval_minutes">${[15,30,60,180,360,720,1440].map(minutes=>`<option value="${minutes}" ${Number(oms.sync_interval_minutes||15)===minutes?"selected":""}>${minutes < 60 ? `${minutes} ${ui("minutes","دقيقة")}` : `${minutes/60} ${ui("hours","ساعة")}`}</option>`).join("")}</select></div>
            </div>
          </div>
          <div class="oms-connector-foot">
            <div><span>${ui("Last successful sync", "آخر مزامنة ناجحة")}</span><strong>${oms.last_success_at ? formatDateTime(oms.last_success_at) : ui("Not synced yet", "لم تتم المزامنة بعد")}</strong>${oms.last_error ? `<small class="negative">${escapeHtml(oms.last_error)}</small>` : ""}</div>
            <button class="btn" type="button" id="testOmsConnector">${i("check")}${ui("Test OMS login", "اختبار دخول OMS")}</button>
          </div>
        </section>
        <section class="card card-pad full-span">
          <div class="studio-card-head"><span class="section-kicker">${ui("ORIGIN", "عنوان الإرسال")}</span><div><h2>${ui("Sender details", "بيانات المرسل")}</h2><p>${ui("Used for quotes and future shipment creation.", "تستخدم في التسعير وإنشاء الشحنة لاحقًا.")}</p></div></div>
          <div class="form-grid">
            ${[["sender_contacts",ui("Contact name","اسم جهة الاتصال"),sender.contacts],["sender_phone",ui("Phone","الهاتف"),sender.phone],["sender_province",ui("Province","المنطقة"),sender.province],["sender_city",ui("City","المدينة"),sender.city],["sender_area",ui("Area","الحي"),sender.area],["sender_zip_code",ui("Postal code","الرمز البريدي"),sender.zip_code],["sender_address",ui("Address","العنوان"),sender.address]].map(([name,label,value])=>`<div class="field ${name === "sender_address" ? "full" : ""}"><label>${label}</label><input name="${name}" value="${escapeHtml(value || "")}" /></div>`).join("")}
          </div>
          <div class="toolbar" style="justify-content:flex-end;margin-top:18px"><button class="btn primary">${ui("Save integration", "حفظ التكامل")}</button></div>
        </section>
      </form>`;
    document.querySelectorAll("[data-form-switch]").forEach(btn => btn.onclick = () => updateFormSwitch(btn));
    const refreshEstimateExamples = () => document.querySelectorAll("[data-estimate-profile]").forEach(row => {
      const number = name => Math.max(0, Number(row.querySelector(`[name="${name}"]`)?.value || 0));
      const base = number("estimate_base_delivery_fee");
      const cod = number("estimate_cod_fixed_fee");
      const posRate = number("estimate_pos_percent") / 100;
      const vatRate = number("estimate_vat_percent") / 100;
      const taxMode = row.querySelector('[name="estimate_tax_mode"]')?.value || "add";
      const posBasis = row.querySelector('[name="estimate_pos_basis"]')?.value || "collectable_amount";
      const taxFactor = taxMode === "add" ? 1 + vatRate : 1;
      let estimate = posBasis === "collectable_amount"
        ? taxFactor * (base + cod + (posRate * 100)) / Math.max(0.0001, 1 - (taxFactor * posRate))
        : taxFactor * (base + cod + (posRate * 100));
      estimate = Math.max(number("estimate_minimum"), estimate);
      const maximum = number("estimate_maximum");
      if (maximum > 0) estimate = Math.min(maximum, estimate);
      const currency = row.querySelector('[name="estimate_currency"]')?.value || "SAR";
      const label = row.querySelector(".estimate-example span");
      if (label) label.textContent = `${ui("Example for 100", "مثال على طلب 100")} ${currency}`;
      const value = row.querySelector(".estimate-example strong");
      if (value) value.textContent = shippingMoney(estimate, currency);
    });
    const bindEstimateProfiles = () => {
      document.querySelectorAll("[data-estimate-profile] [data-form-switch]").forEach(btn=>btn.onclick=()=>updateFormSwitch(btn));
      document.querySelectorAll("[data-remove-estimate-profile]").forEach(btn=>btn.onclick=()=>btn.closest("[data-estimate-profile]").remove());
      document.querySelectorAll("[data-estimate-profile] input, [data-estimate-profile] select").forEach(input => {
        input.addEventListener("input", refreshEstimateExamples);
        input.addEventListener("change", refreshEstimateExamples);
      });
      refreshEstimateExamples();
    };
    document.getElementById("addEstimateProfile").onclick=()=>{const list=document.getElementById("estimateProfilesList");list.insertAdjacentHTML("beforeend",estimateProfileRow({},list.children.length));bindEstimateProfiles();};
    bindEstimateProfiles();
    document.getElementById("toggleOmsPassword").onclick = () => { const input=document.getElementById("omsPasswordInput"); input.type=input.type === "password" ? "text" : "password"; };
    const collectIntegrationPayload = () => {
      const data = Object.fromEntries(new FormData(document.getElementById("shippingIntegrationForm")));
      const estimate_profiles=[...document.querySelectorAll("[data-estimate-profile]")].map(row=>{const get=name=>row.querySelector(`[name="${name}"]`)?.value||"";return {id:row.dataset.id,country_code:get("estimate_country_code"),currency:get("estimate_currency"),base_delivery_fee:Number(get("estimate_base_delivery_fee")||0),cod_fixed_fee:Number(get("estimate_cod_fixed_fee")||0),pos_percent:Number(get("estimate_pos_percent")||0),vat_percent:Number(get("estimate_vat_percent")||0),pos_basis:get("estimate_pos_basis"),tax_mode:get("estimate_tax_mode"),minimum_estimate:Number(get("estimate_minimum")||0),maximum_estimate:get("estimate_maximum")===""?null:Number(get("estimate_maximum")),is_active:get("estimate_is_active")==="true"};});
      return {
        active_provider: data.active_provider,
        spl_address: { is_enabled: data.spl_enabled === "true", api_key: data.spl_api_key, language: data.spl_language, require_verified_checkout: data.spl_require_verified === "true", allow_manual_fallback: data.spl_manual_fallback === "true", cache_days: Number(data.spl_cache_days || 30) },
        imile: { is_enabled: data.imile_enabled === "true", show_at_checkout:data.imile_show_checkout === "true", environment: data.environment, customer_id: data.customer_id, secret_key: data.secret_key, logistics_product_code: data.logistics_product_code, sign_method: data.sign_method, sync_interval_minutes: Number(data.sync_interval_minutes || 60), auto_sync_tracking: data.auto_sync_tracking === "true", auto_create_orders: data.auto_create_orders === "true", sender: { country: "KSA", contacts: data.sender_contacts, phone: data.sender_phone, province: data.sender_province, city: data.sender_city, area: data.sender_area, zip_code: data.sender_zip_code, address: data.sender_address } },
        oto: { is_enabled:data.oto_enabled === "true", show_at_checkout:data.oto_show_checkout === "true", environment:data.oto_environment, refresh_token:data.oto_refresh_token, quote_mode:data.oto_quote_mode, max_checkout_options:Number(data.oto_max_checkout_options||4), auto_create_orders:data.oto_auto_create_orders === "true", auto_create_shipments:false, pickup_location_code:data.oto_pickup_location_code, order_prefix:data.oto_order_prefix, exclude_imile_when_direct:data.oto_exclude_imile === "true", markup_fixed:Number(data.oto_markup_fixed||0), markup_percent:Number(data.oto_markup_percent||0), fallback_amount:Number(data.oto_fallback_amount||0) },
        oms_connector: { is_enabled: data.oms_enabled === "true", environment: data.oms_environment, username: data.oms_username, password: data.oms_password, auto_sync_on_open: data.oms_auto_sync === "true", lookback_days: Number(data.oms_lookback_days || 30), sync_overlap_days: Number(data.oms_sync_overlap_days || 2), sync_interval_minutes: Number(data.oms_sync_interval_minutes || 15) },
        customer_pricing: { strategy: data.pricing_strategy, fixed_amount: Number(data.fixed_amount || 0), markup_fixed: Number(data.markup_fixed || 0), markup_percent: Number(data.markup_percent || 0), subsidy_fixed: Number(data.subsidy_fixed || 0), minimum_charge: Number(data.minimum_charge || 0), maximum_charge: data.maximum_charge === "" ? null : Number(data.maximum_charge), fallback_amount: Number(data.fallback_amount || 0), estimate_profiles }
      };
    };
    ["imile_enabled","imile_show_checkout","oto_enabled","oto_show_checkout"].forEach(field=>{const button=document.querySelector(`[data-form-switch="${field}"]`);if(!button)return;button.onclick=async()=>{updateFormSwitch(button);button.disabled=true;try{await api("/api/admin/shipping/integrations",{method:"PUT",body:JSON.stringify(collectIntegrationPayload())});toast(ui("Shipping provider updated","تم تحديث شركة الشحن"));renderShippingIntegrations(page);}catch(error){toast(error.message,"error");renderShippingIntegrations(page);}};});
    document.querySelector('[name="active_provider"]')?.addEventListener("change",async()=>{try{await api("/api/admin/shipping/integrations",{method:"PUT",body:JSON.stringify(collectIntegrationPayload())});toast(ui("Default provider updated","تم تحديث الشركة الافتراضية"));renderShippingIntegrations(page);}catch(error){toast(error.message,"error");}});
    document.getElementById("testImile").onclick = async event => { event.currentTarget.disabled = true; try { await api("/api/admin/shipping/integrations/imile/test", { method: "POST", body: "{}" }); toast(ui("Connection successful", "تم الاتصال بنجاح")); } catch (error) { toast(error.message, "error"); } finally { event.currentTarget.disabled = false; } };
    document.getElementById("testOto").onclick = async event => { event.currentTarget.disabled = true; try { await api("/api/admin/shipping/integrations", { method: "PUT", body:JSON.stringify(collectIntegrationPayload()) }); await api("/api/admin/shipping/integrations/oto/test", { method: "POST", body: "{}" }); toast(ui("OTO connection successful", "تم الاتصال بـ OTO بنجاح")); renderShippingIntegrations(page); } catch (error) { toast(error.message, "error"); } finally { event.currentTarget.disabled = false; } };
    document.getElementById("registerOtoWebhook").onclick = async event => { event.currentTarget.disabled = true; try { await api("/api/admin/shipping/integrations", { method: "PUT", body:JSON.stringify(collectIntegrationPayload()) }); await api("/api/admin/shipping/integrations/oto/webhook", { method: "POST", body: "{}" }); toast(ui("OTO status webhook connected", "تم ربط تحديثات حالة OTO")); renderShippingIntegrations(page); } catch (error) { toast(error.message, "error"); } finally { event.currentTarget.disabled = false; } };
    document.getElementById("testSplAddress").onclick = async event => { const code=document.querySelector('[name="spl_test_short_address"]').value.toUpperCase().replace(/[^A-Z0-9]/g,"");const resultBox=document.getElementById("splTestResult");event.currentTarget.disabled=true;try{await api("/api/admin/shipping/integrations",{method:"PUT",body:JSON.stringify(collectIntegrationPayload())});const result=await api("/api/admin/shipping/integrations/spl/test",{method:"POST",body:JSON.stringify({short_address:code})});resultBox.hidden=false;resultBox.className="integration-inline-result success";resultBox.innerHTML=`<strong>${ui("Verified address","عنوان موثق")}</strong><span>${escapeHtml([result.address?.province,result.address?.city,result.address?.district,result.address?.street].filter(Boolean).join(" · "))}</span>`;}catch(error){resultBox.hidden=false;resultBox.className="integration-inline-result error";resultBox.textContent=error.message;}finally{event.currentTarget.disabled=false;}};
    document.getElementById("testOmsConnector").onclick = async event => { event.currentTarget.disabled = true; try { await api("/api/admin/shipping/integrations", { method: "PUT", body:JSON.stringify(collectIntegrationPayload()) }); await api("/api/admin/shipping/integrations/oms/test", { method: "POST", body: "{}" }); toast(ui("OMS login successful", "تم تسجيل الدخول إلى OMS بنجاح")); renderShippingIntegrations(page); } catch (error) { toast(error.message, "error"); } finally { event.currentTarget.disabled = false; } };
    document.getElementById("shippingIntegrationForm").onsubmit = async event => {
      event.preventDefault();
      await api("/api/admin/shipping/integrations", { method: "PUT", body: JSON.stringify(collectIntegrationPayload()) });
      toast(t("saved"));
      renderShippingIntegrations(page);
    };
  }

  async function renderShippingShipments(page) {
    const [overview, seed] = await Promise.all([api("/api/admin/shipping/overview"),api("/api/admin/shipping/ledger?limit=10")]);
    const facets=seed.facets||{};const counts=overview.status_counts||{};const summary=overview.summary||{};
    const statusCards=[
      ["",ui("All shipments","كل الشحنات"),summary.total||0,"truck"],
      ["pending_all",ui("Active & pending","النشطة والمعلقة"),summary.pending||0,"file"],
      ["in_transit",ui("In transit","قيد النقل"),counts.in_transit||0,"truck"],
      ["out_for_delivery",ui("Out for delivery","خرجت للتسليم"),counts.out_for_delivery||0,"map"],
      ["delivered",ui("Delivered","تم التسليم"),counts.delivered||0,"box"],
      ["problem_all",ui("Issues & returns","المشكلات والمرتجعات"),summary.exceptions||0,"settings"]
    ];
    page.innerHTML=pageTitle("shippingShipments","",`<button class="btn" id="syncShipments">${i("refresh")}${ui("Sync now", "مزامنة الآن")}</button>`);
    page.innerHTML+=`<section class="shipping-automation-strip"><div><span class="live-dot">${ui("Automatic","تلقائي")}</span><strong>${ui("iMile shipment ledger","سجل شحنات iMile")}</strong><small>${ui("Tracking", "التتبع")}: ${overview.automation?.tracking_sync_enabled?`${ui("every","كل")} ${overview.automation.tracking_sync_interval_minutes} ${ui("min","دقيقة")}`:ui("off","متوقف")} · ${ui("Closings", "التقفيلات")}: ${overview.automation?.fee_sync_enabled?`${ui("every","كل")} ${overview.automation.fee_sync_interval_minutes} ${ui("min","دقيقة")}`:ui("off","متوقف")}</small></div><div><span>${ui("Last tracking update","آخر تحديث للتتبع")}</span><strong>${overview.latest_tracking_sync?.completed_at?formatDateTime(overview.latest_tracking_sync.completed_at):ui("Waiting for first run","بانتظار أول تشغيل")}</strong></div><div><span>${ui("Last closing update","آخر تحديث للتقفيلات")}</span><strong>${overview.latest_fee_sync?.completed_at?formatDateTime(overview.latest_fee_sync.completed_at):ui("Waiting for first run","بانتظار أول تشغيل")}</strong></div></section>
      <div class="shipping-status-grid">${statusCards.map(([value,label,count,icon])=>`<button class="shipping-status-card" type="button" data-shipment-scope="${value}"><span>${i(icon)}</span><div><small>${label}</small><strong>${count}</strong></div>${i("eye")}</button>`).join("")}<button class="shipping-status-card" type="button" data-settlement-scope="unbilled"><span>${i("file")}</span><div><small>${ui("Not billed yet","غير مقفلة ماليًا")}</small><strong>${summary.unbilled_shipments||0}</strong></div>${i("eye")}</button></div>
      <section class="card shipment-query-panel"><div class="closing-workbench-head"><div><span class="section-kicker">LIVE LEDGER</span><h2>${ui("Filter cumulative shipments","فلترة كل الشحنات التراكمية")}</h2><p>${ui("Every result opens with the same complete columns and expandable details as a weekly closing.","كل نتيجة تفتح بنفس أعمدة وتفاصيل التقفيلة الأسبوعية الكاملة.")}</p></div><span class="status-pill good" id="shipmentResultCount">${summary.total||0} ${ui("shipments","شحنة")}</span></div><div class="closing-filter-grid">
      <div class="field filter-wide"><label>${ui("Search","بحث")}</label><input id="shipmentQuery" placeholder="${ui("Waybill, customer, phone, order or bill","البوليصة أو العميل أو الهاتف أو الطلب أو الفاتورة")}" /></div><div class="field"><label>${ui("Date basis","أساس التاريخ")}</label><select id="shipmentDateBasis"><option value="latest_status">${ui("Latest status","آخر تحديث للحالة")}</option><option value="created">${ui("Order creation","إنشاء الطلب")}</option><option value="delivered">${ui("Delivery date","تاريخ التسليم")}</option><option value="fee_updated">${ui("Fee update","تحديث الرسوم")}</option></select></div><div class="field"><label>${ui("Status","الحالة")}</label><select id="shipmentStatus"><option value="">${ui("All statuses","كل الحالات")}</option>${[["pending_all",ui("Active & pending","النشطة والمعلقة")],["pending",ui("Pending","معلقة")],["picked_up",ui("Picked up","تم الاستلام")],["in_transit",ui("In transit","قيد النقل")],["out_for_delivery",ui("Out for delivery","خرجت للتسليم")],["delivered",ui("Delivered","تم التسليم")],["problem_all",ui("Issues & returns","المشكلات والمرتجعات")],["exception",ui("Delivery issue","مشكلة في التسليم")],["return",ui("Returned","مرتجعة")],["cancelled",ui("Cancelled","ملغاة")]].map(([v,l])=>`<option value="${v}">${l}</option>`).join("")}</select></div><div class="field"><label>${ui("From","من")}</label><input id="shipmentFrom" type="date" /></div><div class="field"><label>${ui("To","إلى")}</label><input id="shipmentTo" type="date" /></div><div class="field"><label>${ui("City","المدينة")}</label><select id="shipmentCity"><option value="">${ui("All cities","كل المدن")}</option>${(facets.cities||[]).map(city=>`<option value="${escapeHtml(city)}">${escapeHtml(city)}</option>`).join("")}</select></div><div class="field"><label>${ui("Requested payment","الدفع المطلوب")}</label><select id="shipmentRequestedPayment"><option value="">${ui("All methods","كل الطرق")}</option>${(facets.requested_payments||[]).map(code=>`<option value="${escapeHtml(code)}">${escapeHtml(omsPaymentLabel(code))}</option>`).join("")}</select></div><div class="field"><label>${ui("Actual payment code","كود الدفع الفعلي")}</label><select id="shipmentActualPayment"><option value="">${ui("All codes","كل الأكواد")}</option>${(facets.actual_payments||[]).map(code=>`<option value="${escapeHtml(code)}">${ui("Code","كود")} ${escapeHtml(code)}</option>`).join("")}</select></div><div class="field"><label>${ui("Payment changed","تغير الدفع")}</label><select id="shipmentPaymentChanged"><option value="">${ui("All","الكل")}</option><option value="true">${ui("Changed","تغير")}</option><option value="false">${ui("Unchanged","لم يتغير")}</option></select></div><div class="field"><label>${ui("POS fee","رسوم POS")}</label><select id="shipmentPosFee"><option value="">${ui("All","الكل")}</option><option value="true">${ui("Charged","موجودة")}</option><option value="false">${ui("Not charged","غير موجودة")}</option></select></div><div class="field"><label>${ui("COD fee","رسوم COD")}</label><select id="shipmentCodFee"><option value="">${ui("All","الكل")}</option><option value="true">${ui("Charged","موجودة")}</option><option value="false">${ui("Not charged","غير موجودة")}</option></select></div><div class="field"><label>${ui("Actual cost","التكلفة الفعلية")}</label><select id="shipmentCost"><option value="">${ui("All","الكل")}</option><option value="recorded">${ui("Recorded","مسجلة")}</option><option value="missing">${ui("Pending","معلقة")}</option></select></div><div class="field"><label>${ui("Closing state","حالة التقفيل")}</label><select id="shipmentSettlement"><option value="">${ui("All","الكل")}</option><option value="billed">${ui("Billed","مقفلة")}</option><option value="unbilled">${ui("Not billed yet","غير مقفلة")}</option></select></div></div><div id="shipmentPreview" class="closing-preview"></div><div class="closing-workbench-actions"><button class="btn" type="button" id="resetShipmentFilters">${ui("Reset","مسح الفلاتر")}</button><button class="btn primary" type="button" id="viewShipmentDetails">${i("file")}${ui("Open full details","فتح كل التفاصيل")}</button></div></section><div id="shipmentsArea"></div>`;
    const readFilters=()=>Object.fromEntries(Object.entries({q:document.getElementById("shipmentQuery").value.trim(),date_basis:document.getElementById("shipmentDateBasis").value,date_from:document.getElementById("shipmentFrom").value,date_to:document.getElementById("shipmentTo").value,status_group:document.getElementById("shipmentStatus").value,city:document.getElementById("shipmentCity").value,requested_payment:document.getElementById("shipmentRequestedPayment").value,actual_payment:document.getElementById("shipmentActualPayment").value,payment_changed:document.getElementById("shipmentPaymentChanged").value,pos_fee:document.getElementById("shipmentPosFee").value,cod_fee:document.getElementById("shipmentCodFee").value,cost_state:document.getElementById("shipmentCost").value,settlement_state:document.getElementById("shipmentSettlement").value}).filter(([,value])=>value!==""));
    const load=async()=>{const filters=readFilters();const result=await api(`/api/admin/shipping/ledger?${new URLSearchParams({...filters,limit:"10"})}`);const s=result.summary||{};document.getElementById("shipmentResultCount").textContent=`${result.pagination?.total||0} ${ui("shipments","شحنة")}`;document.getElementById("shipmentPreview").innerHTML=`<div class="closing-preview-stats"><span>${ui("Results","النتائج")}<strong>${result.pagination?.total||0}</strong></span><span>${ui("Estimated","التقديري")}<strong>${shippingMoney(s.estimated_cost_total,"SAR")}</strong></span><span>${ui("Actual","الفعلي")}<strong>${shippingMoney(s.actual_cost_total,"SAR")}</strong></span><span>${ui("Unbilled","غير مقفلة")}<strong>${s.unbilled_shipments||0}</strong></span><span>${ui("POS charged","عليها POS")}<strong>${s.pos_fee_shipments||0}</strong></span><span>${ui("Missing cost","تكلفة ناقصة")}<strong>${s.missing_cost_count||0}</strong></span></div>`;document.getElementById("shipmentsArea").innerHTML=shippingShipmentsTable(result.shipments||[]);document.querySelectorAll("[data-open-shipment-row]").forEach(btn=>btn.onclick=()=>{localStorage.setItem("siteyfy_shipping_ledger_filters",JSON.stringify({...filters,q:btn.dataset.openShipmentRow}));location.hash="shippingLedger";});};
    document.querySelectorAll("[data-shipment-scope]").forEach(btn=>btn.onclick=()=>{localStorage.setItem("siteyfy_shipping_ledger_filters",JSON.stringify({date_basis:"latest_status",...(btn.dataset.shipmentScope?{status_group:btn.dataset.shipmentScope}:{})}));location.hash="shippingLedger";});
    document.querySelectorAll("[data-settlement-scope]").forEach(btn=>btn.onclick=()=>{localStorage.setItem("siteyfy_shipping_ledger_filters",JSON.stringify({date_basis:"latest_status",settlement_state:btn.dataset.settlementScope}));location.hash="shippingLedger";});
    ["shipmentDateBasis","shipmentFrom","shipmentTo","shipmentStatus","shipmentCity","shipmentRequestedPayment","shipmentActualPayment","shipmentPaymentChanged","shipmentPosFee","shipmentCodFee","shipmentCost","shipmentSettlement"].forEach(id=>document.getElementById(id).addEventListener("change",load));
    document.getElementById("shipmentQuery").addEventListener("input",()=>{clearTimeout(state.shipmentFilterTimer);state.shipmentFilterTimer=setTimeout(load,250);});
    document.getElementById("viewShipmentDetails").onclick=()=>{localStorage.setItem("siteyfy_shipping_ledger_filters",JSON.stringify(readFilters()));location.hash="shippingLedger";};
    document.getElementById("resetShipmentFilters").onclick=()=>{["shipmentQuery","shipmentFrom","shipmentTo"].forEach(id=>document.getElementById(id).value="");["shipmentStatus","shipmentCity","shipmentRequestedPayment","shipmentActualPayment","shipmentPaymentChanged","shipmentPosFee","shipmentCodFee","shipmentCost","shipmentSettlement"].forEach(id=>document.getElementById(id).value="");document.getElementById("shipmentDateBasis").value="latest_status";load();};
    document.getElementById("syncShipments").onclick=async event=>{event.currentTarget.disabled=true;try{const result=await api("/api/admin/shipping/shipments/sync",{method:"POST",body:"{}"});toast(`${ui("Tracking synchronized","تم تحديث التتبع")}: ${result.updated||0}`);await load();}catch(error){toast(error.message,"error");}finally{event.currentTarget.disabled=false;}};
    await load();
  }

  function shippingShipmentsTable(rows) {
    if (!rows.length) return `<div class="card empty-state"><div><div class="empty-illustration">${i("truck")}</div><h2>${ui("No shipments yet", "لا توجد شحنات بعد")}</h2><p class="muted">${ui("New iMile-linked orders and imported history will appear here.", "ستظهر هنا الطلبات المرتبطة بـ iMile والسجل المستورد.")}</p></div></div>`;
    return `<div class="card table-wrap shipping-table"><div class="table-scroll"><table class="data-table"><thead><tr><th>${ui("Waybill / order", "الشحنة / الطلب")}</th><th>${ui("Customer", "العميل")}</th><th>${ui("Status", "الحالة")}</th><th>${ui("Destination", "الوجهة")}</th><th>${ui("Payment", "الدفع")}</th><th>${ui("Estimated", "تقديري")}</th><th>${ui("Actual", "فعلي")}</th><th>${ui("Closing", "التقفيل")}</th><th>${ui("Details", "التفاصيل")}</th></tr></thead><tbody>${rows.map(row=>`<tr><td><strong>${escapeHtml(row.waybill_no||`#${row.store_order_id||row.id}`)}</strong><small>${escapeHtml(row.external_order_no||row.client_order_no||"")}</small></td><td><strong>${escapeHtml(row.customer_name||"-")}</strong><small>${escapeHtml(row.customer_phone||"")}</small></td><td><span class="shipment-status status-${escapeHtml(row.status_group||"pending")}">${escapeHtml(shippingStatusLabel(row.status_group))}</span><small>${formatDateTime(row.latest_status_time||row.updated_at)}</small></td><td><strong>${escapeHtml(row.destination_city||"-")}</strong><small>${escapeHtml(row.destination_country||row.destination_province||"")}</small></td><td><strong>${escapeHtml(omsPaymentLabel(row.payment_method))}</strong><small>${row.metadata?.actual_payment_method?`${ui("Actual code","الكود الفعلي")}: ${escapeHtml(row.metadata.actual_payment_method)}`:"-"}</small></td><td>${shippingMoney(row.carrier_estimated_cost,row.currency)}</td><td>${shippingMoney(row.carrier_actual_cost,row.currency)}</td><td>${(row.carrier_bill_numbers||[]).length?`<span class="status-pill good">${ui("Billed","مقفلة")}</span>`:`<span class="status-pill warn">${ui("Not billed","غير مقفلة")}</span>`}</td><td><button class="btn" type="button" data-open-shipment-row="${escapeHtml(row.waybill_no||row.client_order_no||row.id)}">${ui("Full details","كل التفاصيل")}</button></td></tr>`).join("")}</tbody></table></div></div>`;
  }

  async function renderShippingClosings(page) {
    const month = new Date().toISOString().slice(0,7);
    const start = `${month}-01`;
    const end = new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).toISOString().slice(0,10);
    const seedLedger = await api(`/api/admin/shipping/ledger?date_from=${start}&date_to=${end}&date_basis=delivered&limit=10`);
    const facets = seedLedger.facets || {};
    page.innerHTML = pageTitle("shippingClosings", "", `<button class="btn" id="openCodBills">${i("file")}${ui("COD bills", "فواتير COD")}</button><button class="btn" id="openFeeBills">${i("file")}${ui("Fee bills", "فواتير المصاريف")}</button><button class="btn" id="syncOmsReports">${i("refresh")}${ui("Run incremental sync", "تشغيل المزامنة التزايدية")}</button>`);
    page.innerHTML += `
      <section id="latestOmsReport" class="card oms-report-shell"><div class="shipping-loading"><span class="loading-spinner"></span><strong>${ui("Checking the latest iMile closing report...", "جاري فحص أحدث تقرير تقفيل من iMile...")}</strong></div></section>
      <section id="weeklyReconciliationArea" class="card weekly-reconciliation-shell"><div class="shipping-loading"><span class="loading-spinner"></span><strong>${ui("Loading COD and fee bills...", "جاري تحميل فواتير التحصيل والمصاريف...")}</strong></div></section>
      <section id="shippingIntelligenceArea" class="card shipping-intelligence-shell"><div class="shipping-loading"><span class="loading-spinner"></span><strong>${ui("Analyzing weights and historical sales...", "جاري تحليل الأوزان والمبيعات التاريخية...")}</strong></div></section>
      <section class="card closing-workbench"><div class="closing-workbench-head"><div><span class="section-kicker">${ui("LEDGER QUERY", "استعلام سجل الشحنات")}</span><h2>${ui("Explore automatically stored closings", "استعراض التقفيلات المحفوظة تلقائيًا")}</h2><p>${ui("Filter any period and open its full shipment details. New iMile closings are added by scheduled sync without creating them manually.", "فلتر أي فترة وافتح تفاصيل شحناتها كاملة. التقفيلات الجديدة من iMile تضاف بالمزامنة المجدولة بدون إنشائها يدويًا.")}</p></div><span class="status-pill good">${seedLedger.pagination?.total || 0} ${ui("this month", "هذا الشهر")}</span></div>
        <div class="closing-filter-grid">
          <div class="field"><label>${ui("Date basis", "أساس التاريخ")}</label><select id="settlementDateBasis"><option value="delivered">${ui("Delivery date", "تاريخ التسليم")}</option><option value="created">${ui("Order creation", "إنشاء الطلب")}</option><option value="fee_updated">${ui("Fee update", "تحديث الرسوم")}</option><option value="latest_status">${ui("Latest status", "آخر تحديث للحالة")}</option></select></div>
          <div class="field"><label>${ui("From", "من")}</label><input id="settlementStart" type="date" value="${start}"/></div><div class="field"><label>${ui("To", "إلى")}</label><input id="settlementEnd" type="date" value="${end}"/></div>
          <div class="field filter-wide"><label>${ui("Search", "بحث")}</label><input id="settlementQuery" placeholder="${ui("Waybill, customer, phone, order or bill", "البوليصة أو العميل أو الهاتف أو الطلب أو الفاتورة")}" /></div>
          <div class="field"><label>${ui("Shipment status", "حالة الشحنة")}</label><select id="settlementStatus"><option value="">${ui("All statuses", "كل الحالات")}</option>${[["delivered",ui("Delivered","تم التسليم")],["cancelled",ui("Cancelled","ملغاة")],["exception",ui("Exception","مشكلة")],["pending",ui("Pending","معلقة")],["in_transit",ui("In transit","قيد النقل")],["out_for_delivery",ui("Out for delivery","خرجت للتسليم")]].map(([value,label])=>`<option value="${value}">${label}</option>`).join("")}</select></div>
          <div class="field"><label>${ui("City", "المدينة")}</label><select id="settlementCity"><option value="">${ui("All cities", "كل المدن")}</option>${(facets.cities||[]).map(city=>`<option value="${escapeHtml(city)}">${escapeHtml(city)}</option>`).join("")}</select></div>
          <div class="field"><label>${ui("Requested payment", "الدفع المطلوب")}</label><select id="settlementRequestedPayment"><option value="">${ui("All methods", "كل الطرق")}</option>${(facets.requested_payments||[]).map(code=>`<option value="${escapeHtml(code)}">${escapeHtml(omsPaymentLabel(code))} · ${escapeHtml(code)}</option>`).join("")}</select></div>
          <div class="field"><label>${ui("Actual payment code", "كود الدفع الفعلي")}</label><select id="settlementActualPayment"><option value="">${ui("All codes", "كل الأكواد")}</option>${(facets.actual_payments||[]).map(code=>`<option value="${escapeHtml(code)}">${ui("Code", "كود")} ${escapeHtml(code)}</option>`).join("")}</select></div>
          <div class="field"><label>${ui("Payment changed", "تغيرت طريقة الدفع")}</label><select id="settlementPaymentChanged"><option value="">${ui("All", "الكل")}</option><option value="true">${ui("Changed", "تغيرت")}</option><option value="false">${ui("Unchanged", "لم تتغير")}</option></select></div>
          <div class="field"><label>${ui("POS fee", "رسوم POS")}</label><select id="settlementPosFee"><option value="">${ui("All", "الكل")}</option><option value="true">${ui("Charged", "موجودة")}</option><option value="false">${ui("Not charged", "غير موجودة")}</option></select></div>
          <div class="field"><label>${ui("COD fee", "رسوم COD")}</label><select id="settlementCodFee"><option value="">${ui("All", "الكل")}</option><option value="true">${ui("Charged", "موجودة")}</option><option value="false">${ui("Not charged", "غير موجودة")}</option></select></div>
          <div class="field"><label>${ui("Actual cost", "التكلفة الفعلية")}</label><select id="settlementCost"><option value="">${ui("All", "الكل")}</option><option value="recorded">${ui("Recorded", "مسجلة")}</option><option value="missing">${ui("Pending", "معلقة")}</option></select></div>
        </div>
        <div id="settlementPreview" class="closing-preview"><span>${ui("Preview the automatically stored ledger.", "عاين سجل الشحنات المحفوظ تلقائيًا.")}</span></div>
        <div class="closing-workbench-actions"><button class="btn" type="button" id="previewSettlement">${i("dashboard")}${ui("Preview totals", "معاينة الإجماليات")}</button><button class="btn primary" type="button" id="viewSettlementShipments">${i("file")}${ui("Open full details", "فتح التفاصيل الكاملة")}</button></div>
      </section>
      <div class="settlement-section-head"><div><span class="section-kicker">${ui("SYNC RUNS", "تشغيلات المزامنة")}</span><h2>${ui("Incremental bot history", "سجل بوت المزامنة التزايدية")}</h2></div><span class="muted small">${ui("Old shipments remain stored; each run only inserts or updates changes.", "الشحنات القديمة تظل محفوظة، وكل تشغيل يضيف أو يحدث التغييرات فقط.")}</span></div><div id="syncRunsArea"></div>
      <div class="settlement-section-head"><div><span class="section-kicker">${ui("HISTORY", "السجل")}</span><h2>${ui("Closing history", "سجل التقفيلات")}</h2></div></div>
      <div id="settlementsArea"></div>`;

    const renderReport = (latestResult, syncError = "") => {
      const area = document.getElementById("latestOmsReport");
      const connector = latestResult.connector || {};
      const report = latestResult.latest_report;
      if (!connector.is_enabled || !connector.has_password) {
        area.innerHTML = `<div class="oms-report-empty"><div class="oms-report-icon">${i("settings")}</div><div><span class="section-kicker">OMS CONNECTOR</span><h2>${ui("Connect the iMile dashboard", "اربط لوحة iMile")}</h2><p>${ui("Add the OMS username and password in Integrations to load weekly fee reports automatically.", "أضف اسم المستخدم وكلمة مرور OMS في التكاملات لتحميل تقارير الرسوم الأسبوعية تلقائيًا.")}</p></div><button class="btn primary" data-go-oms-settings>${ui("Open integrations", "فتح التكاملات")}</button></div>`;
        area.querySelector("[data-go-oms-settings]").onclick=()=>{location.hash="#shippingIntegrations";};
        return;
      }
      if (!report) {
        area.innerHTML = `<div class="oms-report-empty"><div class="oms-report-icon">${i("file")}</div><div><span class="section-kicker">OMS REPORT</span><h2>${ui("No fee report found", "لم يتم العثور على تقرير رسوم")}</h2><p>${escapeHtml(syncError || connector.last_error || ui("The configured lookback period contains no reports.", "لا توجد تقارير خلال فترة البحث المحددة."))}</p></div></div>`;
        return;
      }
      const coverage = report.shipment_count ? Math.round(Number(report.cost_rows||0)/Number(report.shipment_count)*100) : 0;
      const reportError = syncError || connector.last_error || "";
      area.innerHTML = `<div class="oms-report-head"><div><span class="section-kicker">${ui("LATEST OMS REPORT", "أحدث تقرير OMS")}</span><h2>${ui("Closing updated", "تحديث التقفيل")} ${escapeHtml(report.report_date||"")}</h2><p>${ui("Fetched", "تم السحب")} ${formatDateTime(report.fetched_at)} · ${ui("Range", "الفترة")} ${escapeHtml(report.range_start||"")} → ${escapeHtml(report.range_end||"")}</p></div><div class="oms-report-state"><span class="status-pill ${reportError?"warn":"good"}">${reportError?ui("Using saved report", "عرض التقرير المحفوظ"):ui("Synchronized", "تمت المزامنة")}</span><small>${ui("Last successful sync", "آخر مزامنة ناجحة")}: ${connector.last_success_at?formatDateTime(connector.last_success_at):"-"}</small><button class="btn" type="button" data-view-oms-report="${report.id}">${i("file")}${ui("View full report", "عرض التقرير كاملًا")}</button></div></div>
        ${reportError?`<div class="oms-report-warning">${escapeHtml(reportError)}</div>`:""}
        <div class="oms-report-kpis"><div><span>${ui("Shipments", "الشحنات")}</span><strong>${report.shipment_count||0}</strong><small>${report.matched_count||0} ${ui("matched", "مطابقة")}</small></div><div><span>${ui("Actual carrier cost", "تكلفة الشحن الفعلية")}</span><strong>${shippingMoney(report.actual_cost_total,report.currency||"SAR")}</strong><small>${report.cost_rows||0} ${ui("priced shipments", "شحنة مسعرة")}</small></div><div><span>${ui("COD collected", "المبالغ المحصلة")}</span><strong>${shippingMoney(report.collected_total,report.currency||"SAR")}</strong><small>${(report.bill_numbers||[]).length} ${ui("bills", "فواتير")}</small></div><div><span>${ui("Data coverage", "اكتمال البيانات")}</span><strong>${coverage}%</strong><small>${report.missing_cost_count||0} ${ui("missing costs", "تكلفة ناقصة")}</small></div></div>
        <div class="oms-report-details"><div><div class="oms-detail-title"><strong>${ui("Fee breakdown", "تفاصيل الرسوم")}</strong><span>${ui("From the latest report", "من أحدث تقرير")}</span></div><div class="oms-fee-list">${(report.fee_totals||[]).length?(report.fee_totals||[]).map(fee=>`<div><span>${escapeHtml(omsFeeLabel(fee.name))}</span><strong>${shippingMoney(fee.amount,fee.currency||report.currency||"SAR")}</strong></div>`).join(""):`<p class="muted">${ui("No fee breakdown", "لا توجد تفاصيل رسوم")}</p>`}</div></div><div><div class="oms-detail-title"><strong>${ui("Report health", "حالة التقرير")}</strong><span>${coverage}%</span></div><div class="oms-coverage-track"><span style="width:${Math.min(100,Math.max(0,coverage))}%"></span></div><div class="oms-health-list"><span>${ui("Matched shipments", "الشحنات المطابقة")}<strong>${report.matched_count||0}</strong></span><span>${ui("Unmatched shipments", "غير المطابقة")}<strong>${report.unmatched_count||0}</strong></span><span>${ui("Missing carrier cost", "تكلفة ناقصة")}<strong>${report.missing_cost_count||0}</strong></span></div></div></div>`;
      area.querySelector("[data-view-oms-report]").onclick=()=>openOmsReport(report.id);
    };

    const renderSettlements = (rows) => {
      document.getElementById("settlementsArea").innerHTML=rows.length?`<div class="settlement-grid">${rows.map(row=>`<article class="card settlement-card ${row.source==="imile_oms_fee_report"?"oms-settlement":""}"><div class="settlement-head"><div><span class="section-kicker">${row.source==="imile_oms_fee_report"?"iMile OMS":escapeHtml(row.period_type)}</span><h3>${escapeHtml(row.period_start)} → ${escapeHtml(row.period_end)}</h3>${row.source_data_date?`<small>${ui("Report date", "تاريخ التقرير")}: ${escapeHtml(row.source_data_date)}</small>`:""}</div><span class="status-pill ${row.status==="closed"?"good":row.status==="reviewed"?"warn":"empty"}">${escapeHtml(row.status)}</span></div><div class="settlement-metrics"><div><span>${ui("Shipments","الشحنات")}</span><strong>${row.total||row.shipment_count||0}</strong></div><div><span>${ui("Customer charges","تحميل العميل")}</span><strong>${shippingMoney(row.customer_shipping_total,row.currency||"SAR")}</strong></div><div><span>${ui("Actual cost","التكلفة الفعلية")}</span><strong>${shippingMoney(row.actual_cost_total,row.currency||"SAR")}</strong></div><div><span>${ui("Missing","ناقص")}</span><strong>${row.missing_cost_count||0}</strong></div></div><div class="settlement-foot"><span>${ui("Actual coverage","اكتمال الفعلي")}: <strong>${row.actual_cost_coverage||0}%</strong></span><div class="settlement-actions"><button class="btn" type="button" data-view-settlement="${row.id}">${i("file")}${ui("Full details", "التفاصيل الكاملة")}</button><select data-settlement-status="${row.id}"><option value="draft" ${row.status==="draft"?"selected":""}>Draft</option><option value="reviewed" ${row.status==="reviewed"?"selected":""}>Reviewed</option><option value="closed" ${row.status==="closed"?"selected":""}>Closed</option></select></div></div></article>`).join("")}</div>`:`<div class="card empty-state"><div><h2>${ui("No closings yet", "لا توجد تقفيلات بعد")}</h2><p class="muted">${ui("Choose a period and generate the first reconciliation.", "اختر فترة وأنشئ أول تقفيلة.")}</p></div></div>`;
      document.querySelectorAll("[data-settlement-status]").forEach(select=>select.onchange=async()=>{await api(`/api/admin/shipping/settlements/${select.dataset.settlementStatus}`,{method:"PATCH",body:JSON.stringify({status:select.value})});toast(t("saved"));await load(false);});
      document.querySelectorAll("#settlementsArea [data-view-settlement]").forEach(button=>button.onclick=()=>{location.hash=`shippingSettlement/${button.dataset.viewSettlement}`;});
    };

    const weeklyIssueLabel = issue => ({missing_cod_bill:ui("COD bill missing","فاتورة التحصيل ناقصة"),missing_fee_bill:ui("Fee bill missing","فاتورة المصاريف ناقصة"),cod_not_completed:ui("COD pending","التحصيل غير مكتمل"),fee_not_completed:ui("Fee pending","المصاريف غير مكتملة"),fees_exceed_collections:ui("Fees exceed collections","المصاريف أكبر من التحصيل"),fee_detail_mismatch:ui("Fee details mismatch","فرق في تفاصيل المصاريف")}[issue] || issue);
    const renderWeeklyReconciliations = data => {
      const area = document.getElementById("weeklyReconciliationArea");
      const rows = data.reconciliations || [];
      const summary = data.summary || {};
      if (!rows.length) {
        area.innerHTML = `<div class="oms-report-empty"><div class="oms-report-icon">${i("file")}</div><div><span class="section-kicker">MY BILL</span><h2>${ui("No weekly bills stored yet", "لا توجد فواتير أسبوعية محفوظة بعد")}</h2><p>${ui("Run the sync once to import COD and fee bills from iMile.", "شغّل المزامنة مرة واحدة لاستيراد فواتير التحصيل والمصاريف من iMile.")}</p></div></div>`;
        return;
      }
      area.innerHTML = `<div class="weekly-reconciliation-head"><div><span class="section-kicker">iMile · MY BILL</span><h2>${ui("Weekly transfer reconciliation", "مراجعة التحويل الأسبوعي")}</h2><p>${ui("Each Wednesday bill pairs the previous Wednesday-to-Tuesday COD collections with carrier fees.", "كل فاتورة صادرة يوم الأربعاء تربط تحصيلات ومصاريف دورة الأربعاء إلى الثلاثاء السابقة.")}</p></div><div><span class="status-pill ${summary.open_weeks?"warn":"good"}">${summary.open_weeks||0} ${ui("open", "مفتوح")}</span><small>${ui("Last invoice", "آخر فاتورة")}: ${escapeHtml(summary.latest_bill_date||"-")}</small></div></div>
        <div class="weekly-reconciliation-kpis"><div><span>${ui("COD collections", "التحصيلات")}</span><strong>${shippingMoney(summary.cod_total,summary.currency)}</strong></div><div><span>${ui("Carrier fees", "مصاريف الشحن")}</span><strong>${shippingMoney(summary.fee_total,summary.currency)}</strong></div><div class="net"><span>${ui("Expected transfers", "التحويلات المتوقعة")}</span><strong>${shippingMoney(summary.expected_transfer_total,summary.currency)}</strong></div><div><span>${ui("Weeks needing review", "أسابيع تحتاج مراجعة")}</span><strong>${summary.issue_weeks||0}</strong></div></div>
        <div class="table-scroll weekly-bills-table"><table class="data-table"><thead><tr><th>${ui("Cycle", "الدورة")}</th><th>${ui("Bill date", "تاريخ الإصدار")}</th><th>${ui("COD bill", "فاتورة التحصيل")}</th><th>${ui("Fee bill", "فاتورة المصاريف")}</th><th>${ui("Expected transfer", "التحويل المتوقع")}</th><th>${ui("Linked shipments", "الشحنات المرتبطة")}</th><th>${ui("Review", "المراجعة")}</th><th></th></tr></thead><tbody>${rows.map(row=>`<tr><td><button class="weekly-cycle-link" type="button" data-open-week="${row.id}">${escapeHtml(row.cycle_start)} → ${escapeHtml(row.cycle_end)}</button></td><td>${escapeHtml(row.bill_date||"-")}</td><td><strong>${shippingMoney(row.cod_amount,row.currency)}</strong>${row.cod_bill_id?`<button class="weekly-bill-link" type="button" data-open-carrier-bill="${row.cod_bill_id}">${escapeHtml(row.cod_bill_code||"")}</button>`:`<small>${ui("Missing", "غير موجودة")}</small>`}<small><span class="${row.cod_status==="Completed"?"positive":"negative"}">${escapeHtml(row.cod_status||"-")}</span></small></td><td><strong>${shippingMoney(row.fee_amount,row.currency)}</strong>${row.fee_bill_id?`<button class="weekly-bill-link" type="button" data-open-carrier-bill="${row.fee_bill_id}">${escapeHtml(row.fee_bill_code||"")}</button>`:`<small>${ui("Missing", "غير موجودة")}</small>`}<small><span class="${row.fee_status==="Completed"?"positive":"negative"}">${escapeHtml(row.fee_status||"-")}</span></small></td><td><strong class="${Number(row.expected_transfer)<0?"negative":"positive"}">${shippingMoney(row.expected_transfer,row.currency)}</strong></td><td><strong>${row.linked_shipment_count||0}</strong><small>${ui("Detail sum", "مجموع التفاصيل")}: ${shippingMoney(row.linked_fee_total,row.currency)}</small></td><td>${(row.issues||[]).length?`<div class="weekly-issues">${row.issues.map(issue=>`<span>${escapeHtml(weeklyIssueLabel(issue))}</span>`).join("")}</div>`:`<span class="status-pill good">${ui("Matched", "متطابق")}</span>`}</td><td><button class="btn icon-only" type="button" title="${ui("Open reconciliation", "فتح التقفيل")}" data-open-week="${row.id}">${i("eye")}</button></td></tr>`).join("")}</tbody></table></div>`;
      area.querySelectorAll("[data-open-week]").forEach(button=>button.onclick=()=>location.hash=`shippingReconciliation/${button.dataset.openWeek}`);
      area.querySelectorAll("[data-open-carrier-bill]").forEach(button=>button.onclick=()=>location.hash=`shippingCarrierBill/${button.dataset.openCarrierBill}`);
    };

    const renderShippingIntelligence = data => {
      const area = document.getElementById("shippingIntelligenceArea");
      const pricing = data.weight_pricing || {};
      const legacy = data.legacy_sales || {};
      const operations = data.operations || {};
      const topProducts = (legacy.products || []).slice(0, 8);
      area.innerHTML = `<div class="shipping-intelligence-head"><div><span class="section-kicker">${ui("AUDIT MODEL", "نموذج المراجعة")}</span><h2>${ui("Shipping cost and legacy sales intelligence", "تحليل تكلفة الشحن والمبيعات القديمة")}</h2><p>${ui("Inferred only from stored iMile fee details and delivered shipment SKUs; no estimated order is counted as a sale.", "مستنتج فقط من تفاصيل رسوم iMile المحفوظة وSKU للشحنات المسلّمة، ولا تُحتسب أي شحنة تقديرية كمبيعة.")}</p></div><span class="status-pill ${pricing.anomalies?.length?"warn":"good"}">${pricing.anomalies?.length||0} ${ui("cost anomalies", "فرق تكلفة")}</span></div>
        <div class="shipping-intelligence-kpis"><article><span>${ui("Base delivery fee", "سعر الشحن الأساسي")}</span><strong>${shippingMoney(pricing.base_fee,"SAR")}</strong><small>${ui("Includes", "يشمل")} ${pricing.included_weight_kg||"-"} kg</small></article><article><span>${ui("Extra started kg", "الكيلو الإضافي")}</span><strong>${shippingMoney(pricing.extra_kg_fee,"SAR")}</strong><small>${pricing.sample_count||0} ${ui("priced samples", "عينة مسعرة")}</small></article><article><span>${ui("Verified legacy sales", "مبيعات قديمة موثقة")}</span><strong>${legacy.delivered_evidence_count||0}</strong><small>${legacy.evidence_count||0} ${ui("matched shipment records", "سجل شحنة مطابق")}</small></article><article><span>${ui("Delayed shipments", "شحنات متأخرة")}</span><strong class="${operations.delayed_shipments?"negative":"positive"}">${operations.delayed_shipments||0}</strong><small>${ui(`Open for more than ${operations.delayed_after_days||7} days`, `مفتوحة أكثر من ${operations.delayed_after_days||7} أيام`)}</small></article></div>
        <div class="shipping-intelligence-body"><div><div class="oms-detail-title"><strong>${ui("Documented product history", "سجل المنتجات الموثق")}</strong><span>${ui("Minimum delivered units", "الحد الأدنى للوحدات المسلمة")}</span></div><div class="legacy-product-list">${topProducts.length?topProducts.map(product=>`<div><span>${escapeHtml(product.product_name_ar||product.product_name_en||`#${product.product_id}`)}</span><strong>${product.minimum_units_sold}</strong></div>`).join(""):`<p class="muted">${ui("No SKU matches yet", "لا توجد مطابقة SKU بعد")}</p>`}</div></div><div><div class="oms-detail-title"><strong>${ui("Largest fee differences", "أكبر فروق المصاريف")}</strong><span>${ui("Expected vs charged delivery fee", "المتوقع مقابل المحمل")}</span></div><div class="fee-anomaly-list">${(pricing.anomalies||[]).slice(0,8).map(row=>`<button type="button" data-open-anomaly="${escapeHtml(row.waybill_no||row.legacy_order_no||row.shipment_id)}"><span><b>${escapeHtml(row.waybill_no||row.legacy_order_no||"-")}</b><small>${Number(row.weight).toFixed(2)} kg</small></span><strong class="${row.difference>0?"negative":"positive"}">${row.difference>0?"+":""}${shippingMoney(row.difference,"SAR")}</strong></button>`).join("")||`<p class="muted">${ui("No pricing anomalies", "لا توجد فروق سعرية")}</p>`}</div></div></div>`;
      area.querySelectorAll("[data-open-anomaly]").forEach(button=>button.onclick=()=>{localStorage.setItem("siteyfy_shipping_ledger_filters",JSON.stringify({q:button.dataset.openAnomaly}));location.hash="shippingLedger";});
    };

    const renderSyncRuns = (runs = []) => {
      const area = document.getElementById("syncRunsArea");
      area.innerHTML = runs.length ? `<div class="sync-run-list">${runs.slice(0,8).map(run=>`<article class="sync-run-row"><span class="sync-run-state ${escapeHtml(run.status||"")}"></span><div><strong>${run.source==="tracking"?ui("Tracking status sync","مزامنة حالات التتبع"):run.trigger==="scheduler"?ui("Scheduled closing sync","مزامنة تقفيل مجدولة"):run.mode==="backfill"?ui("Historical backfill","تحميل تاريخي"):ui("Incremental closing sync","مزامنة تقفيل تزايدية")}</strong><small>${run.source==="tracking"?formatDateTime(run.started_at):`${escapeHtml(run.range_start||"-")} → ${escapeHtml(run.range_end||"-")} · ${formatDateTime(run.started_at)}`}</small></div><div class="sync-run-counts"><span>${ui("New","جديد")}<b>${run.new_shipments||0}</b></span><span>${ui("Updated","محدث")}<b>${run.updated_shipments||0}</b></span><span>${ui("Unchanged","بدون تغيير")}<b>${run.unchanged_shipments||0}</b></span><span>${ui("Fetched","تم فحصه")}<b>${run.fetched_rows||0}</b></span></div><span class="status-pill ${run.status==="completed"?"good":run.status==="failed"?"bad":run.status==="running"?"warn":"empty"}">${escapeHtml(run.status||"-")}</span></article>`).join("")}</div>` : `<div class="card empty-state compact"><div><h2>${ui("No sync runs yet", "لا توجد تشغيلات مزامنة بعد")}</h2></div></div>`;
    };

    const readSettlementFilters = () => {
      const values = {
        date_from: document.getElementById("settlementStart").value,
        date_to: document.getElementById("settlementEnd").value,
        date_basis: document.getElementById("settlementDateBasis").value,
        q: document.getElementById("settlementQuery").value.trim(),
        status_group: document.getElementById("settlementStatus").value,
        city: document.getElementById("settlementCity").value,
        requested_payment: document.getElementById("settlementRequestedPayment").value,
        actual_payment: document.getElementById("settlementActualPayment").value,
        payment_changed: document.getElementById("settlementPaymentChanged").value,
        pos_fee: document.getElementById("settlementPosFee").value,
        cod_fee: document.getElementById("settlementCodFee").value,
        cost_state: document.getElementById("settlementCost").value
      };
      return Object.fromEntries(Object.entries(values).filter(([,value])=>value!==""));
    };

    const previewSettlement = async () => {
      const filters = readSettlementFilters();
      const preview = document.getElementById("settlementPreview");
      preview.innerHTML = `<span class="loading-spinner"></span><strong>${ui("Filtering stored shipments...", "جاري فلترة الشحنات المحفوظة...")}</strong>`;
      const data = await api(`/api/admin/shipping/ledger?${new URLSearchParams({...filters,limit:"10"})}`);
      const summary = data.summary || {};
      preview.innerHTML = `<div class="closing-preview-stats"><span>${ui("Matching shipments","الشحنات المطابقة")}<strong>${data.pagination?.total||0}</strong></span><span>${ui("Actual cost","التكلفة الفعلية")}<strong>${shippingMoney(summary.actual_cost_total,"SAR")}</strong></span><span>${ui("COD collected","المحصل")}<strong>${shippingMoney(summary.cod_collected_total,"SAR")}</strong></span><span>${ui("POS charged","عليها POS")}<strong>${summary.pos_fee_shipments||0}</strong></span><span>${ui("Payment changed","تغير الدفع")}<strong>${summary.payment_changed||0}</strong></span><span>${ui("Missing cost","تكلفة ناقصة")}<strong>${Math.max(0,(data.pagination?.total||0)-Math.round((summary.actual_cost_coverage||0)*(data.pagination?.total||0)/100))}</strong></span></div>`;
      return data;
    };

    const load = async () => {
      let latestResult = await api("/api/admin/shipping/reports/latest");
      const [settlements, syncRuns, weekly, intelligence] = await Promise.all([api("/api/admin/shipping/settlements"),api("/api/admin/shipping/sync-runs?limit=20"),api("/api/admin/shipping/weekly-reconciliations"),api("/api/admin/shipping/intelligence")]);
      renderReport(latestResult, "");
      renderWeeklyReconciliations(weekly);
      renderShippingIntelligence(intelligence);
      renderSettlements(settlements.settlements||[]);
      renderSyncRuns(syncRuns.runs||[]);
    };
    document.getElementById("syncOmsReports").onclick=async event=>{event.currentTarget.disabled=true;try{const result=await api("/api/admin/shipping/reports/sync",{method:"POST",body:JSON.stringify({force:true,trigger:"manual"})});await load();toast(`${ui("Incremental sync complete", "اكتملت المزامنة التزايدية")}: +${result.new_shipments||0} / Δ${result.updated_shipments||0}`);}catch(error){toast(error.message,"error");}finally{event.currentTarget.disabled=false;}};
    document.getElementById("openCodBills").onclick=()=>location.hash="shippingCodBills";
    document.getElementById("openFeeBills").onclick=()=>location.hash="shippingFeeBills";
    document.getElementById("previewSettlement").onclick=previewSettlement;
    document.getElementById("viewSettlementShipments").onclick=()=>{localStorage.setItem("siteyfy_shipping_ledger_filters",JSON.stringify(readSettlementFilters()));location.hash="shippingLedger";};
    ["settlementStart","settlementEnd","settlementDateBasis","settlementStatus","settlementCity","settlementRequestedPayment","settlementActualPayment","settlementPaymentChanged","settlementPosFee","settlementCodFee","settlementCost"].forEach(id=>document.getElementById(id).addEventListener("change",previewSettlement));
    await load();
    await previewSettlement();
  }

  const shippingAuditRuleLabels = {
    weight_variance:["Weight variance","فرق الوزن"], missing_expected_weight:["Missing expected weight","وزن متوقع ناقص"],
    cancelled_before_pickup_fee:["Cancelled before pickup","إلغاء قبل الاستلام"], cancelled_after_pickup_fee_review:["Cancelled after pickup","إلغاء بعد الاستلام"], cancelled_timeline_incomplete:["Incomplete cancellation timeline","تسلسل إلغاء ناقص"],
    duplicate_fee:["Duplicate fee","رسم مكرر"], unexpected_pos_fee:["POS fee notice","تنبيه رسوم POS"], unexpected_cod_fee:["Unexpected COD fee","رسم تحصيل غير متوقع"],
    payment_method_changed:["Payment change notice","تنبيه تغير طريقة الدفع"], delivery_fee_variance:["Pricing variance","فرق التسعير"], settlement_overdue:["Closing overdue","التقفيل متأخر"]
  };
  function shippingAuditRuleLabel(code){const label=shippingAuditRuleLabels[code]||[String(code||"").replaceAll("_"," "),String(code||"").replaceAll("_"," ")];return state.lang==="ar"?label[1]:label[0];}
  function shippingAuditSeverityLabel(value){const labels={critical:["Critical","حرج"],high:["High","مرتفع"],medium:["Medium","متوسط"],low:["Low","منخفض"],review:["Review","مراجعة"],info:["Information","معلومة"]};const label=labels[value]||[value,value];return state.lang==="ar"?label[1]:label[0];}
  function shippingAuditStatusLabel(value){const labels={open:["Open","مفتوحة"],notice:["Notice only","تنبيه فقط"],reviewing:["Reviewing","قيد المراجعة"],disputed:["Disputed","تم الاعتراض"],resolved:["Resolved","محلولة"],ignored:["Ignored","مستبعدة"],resolved_automatically:["Auto resolved","حلت تلقائيًا"],draft:["Draft","مسودة"],submitted:["Submitted","مرسلة"],carrier_review:["Carrier review","مراجعة الشركة"],accepted:["Accepted","مقبولة"],rejected:["Rejected","مرفوضة"],closed:["Closed","مغلقة"]};const label=labels[value]||[value,value];return state.lang==="ar"?label[1]:label[0];}
  function shippingAuditStatusClass(value){return ["resolved","resolved_automatically","accepted","closed"].includes(value)?"good":["critical","rejected"].includes(value)?"bad":["disputed","submitted","carrier_review","reviewing"].includes(value)?"warn":"empty";}

  function shippingAuditExplanationMarkup(finding,shipment){
    const c=finding.calculation||{},currency=finding.currency||shipment.currency||"SAR",bill=(finding.source?.bills||[]).find(row=>row.bill_type==="feeBill")||finding.source?.bills?.[0];
    const metric=(label,value,caption="")=>`<div><span>${label}</span><strong>${value}</strong>${caption?`<small>${caption}</small>`:""}</div>`;
    const formulaStep=(label,value,source="",tone="")=>`<div class="formula-step ${tone}"><span>${label}</span><b dir="ltr">${value}</b>${source?`<small>${source}</small>`:""}</div>`;
    const formulaOperator=value=>`<span class="formula-operator" aria-hidden="true">${value}</span>`;
    let title=ui("What happened?","ماذا حدث؟"),summary=state.lang==="ar"?finding.reason_ar:finding.reason_en,metrics="",formula="",note="";
    if(finding.rule_code==="duplicate_fee"){
      title=ui("How the duplicate was counted","كيف تم احتساب التكرار");
      metrics=[metric(ui("Single fee row","قيمة السطر الواحد"),shippingMoney(c.unit_amount??finding.expected_amount,currency)),metric(ui("Rows found","عدد مرات الظهور"),`${c.row_count||finding.duplicate_count||0}`),metric(ui("Expected once","المتوقع مرة واحدة"),shippingMoney(c.expected_total??finding.expected_amount,currency)),metric(ui("Total of repeated rows","إجمالي الصفوف المكررة"),shippingMoney(c.charged_total??finding.actual_amount,currency))].join("");
      formula=`<div class="audit-formula-lane">${formulaStep(ui("Single fee row","قيمة بند الرسم"),shippingMoney(c.unit_amount??finding.expected_amount,currency),ui("From the Fee Bill row","من صف Fee Bill"))}${formulaOperator("×")}${formulaStep(ui("Identical rows","عدد الصفوف المتطابقة"),String(c.row_count||finding.duplicate_count||0),escapeHtml(c.bill_code||bill?.bill_code||"-"))}${formulaOperator("=")}${formulaStep(ui("Repeated rows total","إجمالي الصفوف"),shippingMoney(c.charged_total??finding.actual_amount,currency),ui("Same Fee Bill","نفس فاتورة المصاريف"),"result")}</div><div class="audit-formula-result"><span>${ui("Expected one row","المتوقع صف واحد")}</span><b dir="ltr">${shippingMoney(c.expected_total??finding.expected_amount,currency)}</b><span>${ui("Extra counted","الزيادة المحتسبة")}</span><strong dir="ltr">${shippingMoney(c.duplicate_difference??finding.exposure_amount,currency)}</strong></div>`;
      note=ui(`The identical rows came from fee bill ${c.bill_code||bill?.bill_code||"-"} dated ${c.bill_date||bill?.bill_date||"-"}. Open the fee bill or see the exact rows below.`,`الصفوف المتطابقة جاءت من فاتورة المصاريف ${c.bill_code||bill?.bill_code||"-"} بتاريخ ${c.bill_date||bill?.bill_date||"-"}. افتح الفاتورة أو راجع الصفوف نفسها بالأسفل.`);
    }else if(finding.rule_code==="delivery_fee_variance"){
      title=ui("Configured price versus iMile calculation","التسعير المحدد مقابل احتساب iMile");
      metrics=[metric(ui("Base delivery price","سعر التوصيل الأساسي"),shippingMoney(c.base_fee,currency),`${ui("includes","يشمل")} ${c.included_weight_kg??"-"} kg`),metric(ui("Billed weight","الوزن المحتسب"),`${c.billed_weight??finding.billed_weight??"-"} kg`,`${c.extra_started_kg||0} ${ui("extra started kg","كجم إضافي محتسب")}`),metric(ui("Expected total with VAT","الإجمالي المتوقع بالضريبة"),shippingMoney(c.expected_total??finding.expected_amount,currency),`${c.vat_percent??"-"}% VAT`),metric(ui("iMile fee rows total","مجموع بنود iMile"),shippingMoney(c.carrier_total??finding.actual_amount,currency),`${c.delivery_row_count??"-"} ${ui("delivery rows","بنود توصيل")} + ${c.vat_row_count??"-"} VAT`)].join("");
      formula=`<div class="audit-formula-group"><label>${ui("Configured pricing rule","قاعدة التسعير المحددة")}</label><div class="audit-formula-lane">${formulaStep(ui("Base delivery","التوصيل الأساسي"),shippingMoney(c.base_fee,currency),`${ui("Includes","يشمل")} ${c.included_weight_kg??"-"} kg`)}${formulaOperator("+")}${formulaStep(ui("Extra weight","الوزن الإضافي"),shippingMoney(c.extra_weight_charge,currency),`${c.extra_started_kg||0} × ${shippingMoney(c.extra_started_kg_fee,currency)}`)}${formulaOperator("+")}${formulaStep(ui("VAT","الضريبة"),shippingMoney(c.expected_vat,currency),`${c.vat_percent??"-"}%`)}${formulaOperator("=")}${formulaStep(ui("Expected total","الإجمالي المتوقع"),shippingMoney(c.expected_total??finding.expected_amount,currency),ui("From audit settings","من إعدادات المراجعة"),"result")}</div></div><div class="audit-formula-group"><label>${ui("iMile Fee Bill rows","بنود Fee Bill من iMile")}</label><div class="audit-formula-lane">${formulaStep(ui("Delivery rows","بنود التوصيل"),shippingMoney(c.carrier_delivery_total,currency),`${c.delivery_row_count??"-"} ${ui("rows","صفوف")}`)}${formulaOperator("+")}${formulaStep(ui("VAT rows","بنود الضريبة"),shippingMoney(c.carrier_vat_total,currency),`${c.vat_row_count??"-"} ${ui("rows","صفوف")}`)}${formulaOperator("=")}${formulaStep(ui("Carrier total","إجمالي الشركة"),shippingMoney(c.carrier_total??finding.actual_amount,currency),escapeHtml(bill?.bill_code||"Fee Bill"),"result")}</div></div><div class="audit-formula-result"><span>${ui("Expected","المتوقع")}</span><b dir="ltr">${shippingMoney(c.expected_total??finding.expected_amount,currency)}</b><span>${ui("Carrier","الشركة")}</span><b dir="ltr">${shippingMoney(c.carrier_total??finding.actual_amount,currency)}</b><span>${ui("Difference","الفرق")}</span><strong dir="ltr">${shippingMoney(c.difference??finding.variance_amount,currency)}</strong></div>`;
      note=c.possible_duplicate_dependency?ui("The iMile total contains more than one delivery or VAT row. This pricing variance may be caused by the duplicate-fee finding on the same shipment; review the duplicate rows first.","إجمالي iMile يحتوي أكثر من بند توصيل أو ضريبة. قد يكون فرق التسعير نتيجة مباشرة لملاحظة الرسوم المكررة لنفس الشحنة؛ راجع التكرار أولًا."):ui(`The comparison uses the pricing rule saved in the audit settings and fee bill ${bill?.bill_code||"-"}.`,`المقارنة تستخدم قاعدة التسعير المحفوظة في إعدادات المراجعة وفاتورة المصاريف ${bill?.bill_code||"-"}.`);
    }else if(finding.rule_code==="weight_variance"){
      title=ui("Expected weight versus carrier weight","الوزن المتوقع مقابل وزن الشركة");
      metrics=[metric(ui("Order weight","وزن الطلب"),`${c.expected_weight??finding.expected_weight??"-"} kg`),metric(ui("iMile billed weight","وزن iMile"),`${c.billed_weight??finding.billed_weight??"-"} kg`),metric(ui("Allowed difference","فرق السماح"),`${c.allowed_difference_kg??"-"} kg`,`${c.tolerance_percent??"-"}% / ${c.tolerance_kg??"-"} kg`),metric(ui("Actual difference","الفرق الفعلي"),`${c.difference_kg??finding.variance_amount??"-"} kg`)].join("");
      formula=`<div class="audit-formula-lane">${formulaStep(ui("iMile billed weight","وزن iMile"),`${c.billed_weight??finding.billed_weight??"-"} kg`,ui("Fee report","تقرير الرسوم"))}${formulaOperator("−")}${formulaStep(ui("Order expected weight","وزن الطلب المتوقع"),`${c.expected_weight??finding.expected_weight??"-"} kg`,ui("Product shipping profiles","ملفات شحن المنتجات"))}${formulaOperator("=")}${formulaStep(ui("Actual difference","الفرق الفعلي"),`${c.difference_kg??finding.variance_amount??"-"} kg`,`${ui("Allowed","المسموح")} ${c.allowed_difference_kg??"-"} kg`,"result")}</div>`;
      note=ui("The product-by-product weight composition is shown below, including each selected option and quantity.","تفصيل الوزن منتجًا بمنتج ظاهر بالأسفل، مع الاختيار والكمية لكل بند.");
    }else if(finding.rule_code==="settlement_overdue"){
      title=ui("Why the closing is overdue","لماذا اعتُبرت التقفيلة متأخرة");
      metrics=[metric(ui("Latest shipment stage","آخر مرحلة للشحنة"),shippingStatusLabel(finding.shipment_status||shipment.status_group)),metric(ui("Latest status date","تاريخ آخر حالة"),formatDateTime(c.latest_status_time||shipment.latest_status_time)),metric(ui("Elapsed","المدة المنقضية"),`${c.elapsed_days??finding.overdue_days??"-"} ${ui("days","يوم")}`),metric(ui("Allowed without closing","المهلة المسموحة"),`${c.allowed_days??finding.configured_overdue_days??"-"} ${ui("days","يوم")}`)].join("");
      formula=`<div class="audit-formula-lane">${formulaStep(ui("Elapsed since latest status","منذ آخر حالة"),`${c.elapsed_days??finding.overdue_days??"-"} ${ui("days","يوم")}`,formatDateTime(c.latest_status_time||shipment.latest_status_time))}${formulaOperator("−")}${formulaStep(ui("Allowed closing period","مهلة التقفيل"),`${c.allowed_days??finding.configured_overdue_days??"-"} ${ui("days","يوم")}`,ui("Audit setting","إعداد المراجعة"))}${formulaOperator("=")}${formulaStep(ui("Overdue","التأخير"),`${Math.max(0,Number(c.elapsed_days??finding.overdue_days??0)-Number(c.allowed_days??finding.configured_overdue_days??0))} ${ui("days","يوم")}`,c.fee_bill_state||finding.settlement_state||"unbilled","result")}</div>`;
      note=ui(`Fee bill state: ${c.fee_bill_state||finding.settlement_state||"unbilled"}. The linked bill and weekly closing, when available, are shown in the source section.`,`حالة فاتورة المصاريف: ${c.fee_bill_state||finding.settlement_state||"unbilled"}. الفاتورة والتقفيلة الأسبوعية المرتبطتان تظهران في قسم المصدر عند توفرهما.`);
    }else{
      metrics=[metric(ui("Expected","المتوقع"),finding.expected_amount==null?"-":shippingMoney(finding.expected_amount,currency)),metric(ui("Recorded by carrier","المسجل من الشركة"),finding.actual_amount==null?"-":shippingMoney(finding.actual_amount,currency)),metric(ui("Difference","الفرق"),shippingMoney(finding.variance_amount??finding.exposure_amount,currency)),metric(ui("Source","المصدر"),escapeHtml(bill?.bill_code||finding.source?.state||"-"))].join("");
      formula=`<p class="audit-formula-copy">${escapeHtml((state.lang==="ar"?finding.detection_steps?.[1]?.ar:finding.detection_steps?.[1]?.en)||"")}</p>`;
      note=ui("Use the source links and timeline below to open the exact bill, OMS report and weekly closing.","استخدم روابط المصدر والتسلسل بالأسفل لفتح الفاتورة وتقرير OMS والتقفيلة الأسبوعية نفسها.");
    }
    return `<section class="card card-pad audit-explanation"><div class="audit-section-head compact"><div><span class="section-kicker">EXPLAINED</span><h2>${title}</h2><p>${escapeHtml(summary||"")}</p></div>${bill?`<span class="status-pill good">${ui("Fee bill","فاتورة المصاريف")} · ${escapeHtml(bill.bill_date||"")}</span>`:""}</div><div class="audit-explanation-metrics">${metrics}</div><div class="audit-formula"><span>${ui("Calculation","طريقة الحساب")}</span>${formula}</div><div class="audit-explanation-note">${i(c.possible_duplicate_dependency?"alert-triangle":"info")}<p>${escapeHtml(note)}</p></div></section>`;
  }

  function shippingAuditFeeBreakdownMarkup(fees,currency="SAR"){
    if(!fees.length) return `<h3>${ui("Fee rows","بنود الرسوم")}</h3><p class="muted">${ui("No fee rows are stored for this shipment.","لا توجد بنود رسوم محفوظة لهذه الشحنة.")}</p>`;
    const byBill=new Map();
    fees.forEach((fee,index)=>{const code=String(fee.bill_code||ui("Without bill code","بدون كود فاتورة"));const group=byBill.get(code)||{code,date:fee.bill_date||"",rows:[]};group.rows.push({...fee,row_number:index+1});byBill.set(code,group);});
    const overall=fees.reduce((sum,row)=>sum+Number(row.amount||0),0);
    return `<div class="fee-breakdown-head"><div><span class="section-kicker">FEE ROW BREAKDOWN</span><h3>${ui("How the carrier fee total was formed","كيف تكوّن إجمالي رسوم الشركة")}</h3><p>${ui("Rows are grouped by the exact Fee Bill code. COD Bills are not counted as fee rows.","تم تجميع الصفوف حسب كود فاتورة المصاريف نفسه. فاتورة COD لا تدخل ضمن بنود المصاريف.")}</p></div><div><span>${ui("All stored fee rows","إجمالي كل البنود المحفوظة")}</span><strong>${shippingMoney(overall,currency)}</strong><small>${fees.length} ${ui("raw rows","صف خام")}</small></div></div>${[...byBill.values()].map(group=>{const billTotal=group.rows.reduce((sum,row)=>sum+Number(row.amount||0),0),byName=new Map();group.rows.forEach(row=>{const key=String(row.name||"-");byName.set(key,[...(byName.get(key)||[]),row]);});return `<article class="fee-bill-group"><header><div><span>${ui("Fee Bill","فاتورة المصاريف")}</span><code>${escapeHtml(group.code)}</code><small>${escapeHtml(group.date||ui("No bill date","بدون تاريخ فاتورة"))}</small></div><div><span>${ui("Shipment total in this bill","إجمالي الشحنة في هذه الفاتورة")}</span><strong>${shippingMoney(billTotal,currency)}</strong><small>${group.rows.length} ${ui("rows","بنود")}</small></div></header><div class="fee-kind-list">${[...byName.entries()].map(([name,rows])=>{const total=rows.reduce((sum,row)=>sum+Number(row.amount||0),0),same=rows.every(row=>Number(row.amount||0)===Number(rows[0].amount||0));return `<div class="fee-kind-row"><div><strong>${escapeHtml(omsFeeLabel(name))}</strong><small>${same?`${shippingMoney(rows[0].amount,rows[0].currency||currency)} × ${rows.length}`:rows.map(row=>shippingMoney(row.amount,row.currency||currency)).join(" + ")}</small></div><div class="fee-raw-rows">${rows.map((row,index)=>`<span>#${index+1} · ${shippingMoney(row.amount,row.currency||currency)}</span>`).join("")}</div><b>${shippingMoney(total,rows[0].currency||currency)}</b></div>`;}).join("")}</div><footer><span>${ui("Bill-row equation","معادلة بنود الفاتورة")}</span><strong>${[...byName.entries()].map(([name,rows])=>`${escapeHtml(omsFeeLabel(name))} ${shippingMoney(rows.reduce((sum,row)=>sum+Number(row.amount||0),0),rows[0]?.currency||currency)}`).join(" + ")} = ${shippingMoney(billTotal,currency)}</strong></footer></article>`;}).join("")}`;
  }

  function shippingAuditSourceTraceMarkup(finding){
    const bills=finding.source?.bills||[],reports=finding.source?.reports||[],weeks=finding.source?.reconciliations||[];
    if(!bills.length&&!reports.length&&!weeks.length) return "";
    return `<section class="card card-pad audit-source-trace"><div class="audit-section-head compact"><div><span class="section-kicker">DATA LINEAGE</span><h2>${ui("Where every number came from","من أين جاء كل رقم؟")}</h2><p>${ui("The shipment is linked by its waybill to the OMS report, carrier bills and weekly reconciliation below.","تم ربط الشحنة برقم البوليصة مع تقرير OMS وفواتير الشركة والتقفيلة الأسبوعية الموضحة أدناه.")}</p></div><code>${escapeHtml(finding.waybill_no||"")}</code></div><div class="audit-source-trace-list">${reports.map(report=>`<button type="button" data-detail-source-report="${report.id}"><span class="source-step">1</span><div><strong>${ui("OMS fee report","تقرير رسوم OMS")} #${report.id}</strong><p>${ui("Imported source","المصدر المستورد")}: ${escapeHtml(report.source||"oms_fee_report")} · ${escapeHtml(report.report_type||"-")}</p><small>${ui("Report range","نطاق التقرير")}: ${escapeHtml(report.range_start||"-")} → ${escapeHtml(report.range_end||"-")} · ${ui("fetched","تم تحميله")}: ${formatDateTime(report.fetched_at||report.report_date)}</small></div>${i("eye")}</button>`).join("")}${bills.map(bill=>`<button type="button" data-detail-source-bill="${bill.id}"><span class="source-step">${bill.bill_type==="feeBill"?2:"C"}</span><div><strong>${bill.bill_type==="feeBill"?ui("Fee Bill: source of fee rows","Fee Bill: مصدر بنود المصاريف"):ui("COD Bill: collection output only","COD Bill: مخرج التحصيل فقط")}</strong><p>${escapeHtml(bill.bill_code||"")}</p><small>${escapeHtml(bill.bill_date||"")} · ${escapeHtml(bill.settlement_status||"")} · ${shippingMoney(bill.amount,bill.currency)}</small></div>${i("eye")}</button>`).join("")}${weeks.map(week=>`<button type="button" data-detail-source-week="${week.id}"><span class="source-step">3</span><div><strong>${ui("Weekly reconciliation","التقفيلة الأسبوعية")} #${week.id}</strong><p>${escapeHtml(week.cycle_start||"")} → ${escapeHtml(week.cycle_end||"")}</p><small>${ui("Connects the COD and Fee outputs for the same cycle.","تربط فاتورة التحصيل وفاتورة المصاريف لنفس الدورة.")}</small></div>${i("eye")}</button>`).join("")}</div><div class="audit-source-clarifier">${i("info")}<p>${ui("Repeated fee rows are checked inside the same Fee Bill code. They are not counted once from the COD Bill and again from the Fee Bill.","يتم فحص تكرار بنود الرسوم داخل كود Fee Bill نفسه. لا يتم احتساب البند مرة من COD Bill ومرة أخرى من Fee Bill.")}</p></div></section>`;
  }

  async function renderShippingAudit(page) {
    const [overview,settingsPayload,initialFindings,disputesPayload]=await Promise.all([
      api("/api/admin/shipping/audit/overview"),api("/api/admin/shipping/audit/settings"),api("/api/admin/shipping/audit/findings?status=active&limit=50"),api("/api/admin/shipping/audit/disputes")
    ]);
    const summary=overview.summary||{},settings=settingsPayload.settings||{},disputes=disputesPayload.disputes||[];
    page.innerHTML=pageTitle("shippingAudit","",`<button class="btn" type="button" id="refreshShippingAudit">${i("refresh")}${ui("Refresh","تحديث")}</button><button class="btn primary" type="button" id="runShippingAudit">${i("check")}${ui("Run audit","تشغيل المراجعة")}</button>`);
    page.innerHTML+=`<section class="audit-hero"><div><span class="section-kicker">iMile · CONTROL DESK</span><h2>${ui("Carrier fee control","مراجعة رسوم شركة الشحن")}</h2><p>${ui("Every finding keeps the shipment, bill and rule evidence used to detect it.","كل ملاحظة تحتفظ بالشحنة والفاتورة والقاعدة والدليل المستخدم في اكتشافها.")}</p></div><div class="audit-hero-state"><span>${ui("Potential exposure","قيمة الفروقات المحتملة")}</span><strong>${shippingMoney(summary.exposure_amount,summary.currency||"SAR")}</strong><small>${summary.affected_shipments||0} ${ui("affected shipments","شحنة متأثرة")}</small></div></section>
      <section class="audit-kpis"><article class="danger"><span>${ui("Critical","حرجة")}</span><strong>${summary.critical||0}</strong><small>${ui("Immediate review","تحتاج إجراء سريع")}</small></article><article><span>${ui("Open findings","ملاحظات مفتوحة")}</span><strong>${summary.open_findings||0}</strong><small>${summary.high||0} ${ui("high priority","أولوية مرتفعة")}</small></article><article><span>${ui("Disputed amount","قيمة الاعتراضات")}</span><strong>${shippingMoney(summary.disputed_amount,summary.currency||"SAR")}</strong><small>${overview.disputes?.open||0} ${ui("open cases","حالة مفتوحة")}</small></article><article><span>${ui("Last automatic check","آخر فحص تلقائي")}</span><strong>${overview.latest_run?.completed_at?formatDateTime(overview.latest_run.completed_at):"-"}</strong><small>${overview.latest_run?.shipment_count||0} ${ui("shipments checked","شحنة تم فحصها")}</small></article></section>
      <nav class="audit-tabs" aria-label="${ui("Audit sections","أقسام المراجعة")}"><button class="active" data-audit-tab="findings">${ui("Findings","الملاحظات")}</button><button data-audit-tab="rules">${ui("Rules","القواعد")}</button><button data-audit-tab="disputes">${ui("Disputes","الاعتراضات")}</button></nav>
      <section data-audit-panel="findings"><div class="card audit-workspace"><div class="audit-filterbar"><div class="field audit-search"><label>${ui("Search","بحث")}</label><input id="auditSearch" type="search" placeholder="${ui("Waybill, order, bill or reason","البوليصة أو الطلب أو الفاتورة أو السبب")}" /></div><div class="field"><label>${ui("Status","الحالة")}</label><select id="auditStatus"><option value="active">${ui("Active findings","الملاحظات النشطة")}</option><option value="open">${ui("Open","مفتوحة")}</option><option value="reviewing">${ui("Reviewing","قيد المراجعة")}</option><option value="disputed">${ui("Disputed","تم الاعتراض")}</option><option value="resolved">${ui("Resolved","محلولة")}</option><option value="ignored">${ui("Ignored","مستبعدة")}</option><option value="">${ui("All statuses","كل الحالات")}</option></select></div><div class="field"><label>${ui("Priority","الأولوية")}</label><select id="auditSeverity"><option value="">${ui("All priorities","كل الأولويات")}</option>${["critical","high","medium","review"].map(v=>`<option value="${v}">${shippingAuditSeverityLabel(v)}</option>`).join("")}</select></div><div class="field"><label>${ui("Issue type","نوع المشكلة")}</label><select id="auditRule"><option value="">${ui("All issue types","كل الأنواع")}</option>${(initialFindings.facets?.rules||[]).map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(shippingAuditRuleLabel(v))}</option>`).join("")}</select></div><div class="field"><label>${ui("Closing source","مصدر التقفيل")}</label><select id="auditSettlementState"><option value="">${ui("All sources","كل المصادر")}</option><option value="completed_bill">${ui("Completed bills only","فواتير مقفلة فقط")}</option><option value="unclosed_bill">${ui("Bill not completed","فاتورة غير مقفلة")}</option><option value="unbilled">${ui("No bill","بدون فاتورة")}</option></select></div><div class="field"><label>${ui("From","من")}</label><input id="auditFrom" type="date" /></div><div class="field"><label>${ui("To","إلى")}</label><input id="auditTo" type="date" /></div></div><div class="audit-table-summary" id="auditTableSummary"></div><div id="auditFindingsArea"></div><div class="shipping-pagination" id="auditPagination"></div></div></section>
      <section data-audit-panel="rules" hidden><form class="card audit-rules" id="auditRulesForm"><div class="audit-section-head"><div><span class="section-kicker">RULE ENGINE · V${settings.version||1}</span><h2>${ui("Detection rules","قواعد اكتشاف الفروقات")}</h2><p>${ui("Changes apply to the next audit and are saved as a versioned snapshot.","التغييرات تطبق في الفحص التالي وتحفظ كلقطة مؤرخة للقواعد.")}</p></div>${switchButton({field:"audit_enabled",value:settings.enabled,label:false})}</div><div class="audit-rule-grid">
        <article><div class="audit-rule-title"><div><strong>${ui("Weight variance","فرق الوزن")}</strong><small>${ui("Compare order package weight with carrier billable weight.","قارن وزن طرد الطلب بالوزن المحتسب من الشركة.")}</small></div>${switchButton({field:"weight_enabled",value:settings.weight?.enabled,label:false})}</div><div class="form-grid"><div class="field"><label>${ui("Tolerance (kg)","السماح بالكجم")}</label><input name="weight_tolerance_kg" type="number" min="0" step="0.1" value="${settings.weight?.tolerance_kg??0.5}" /></div><div class="field"><label>${ui("Tolerance (%)","السماح بالنسبة")}</label><input name="weight_tolerance_percent" type="number" min="0" step="1" value="${settings.weight?.tolerance_percent??20}" /></div></div></article>
        <article><div class="audit-rule-title"><div><strong>${ui("Cancellation before pickup","الإلغاء قبل الاستلام")}</strong><small>${ui("Flag charges only when pickup evidence is absent.","اكتشف الرسوم عندما لا يوجد دليل استلام.")}</small></div>${switchButton({field:"cancellation_enabled",value:settings.cancellation?.enabled,label:false})}</div><div class="field"><label>${ui("Allowed cancellation fee","رسم الإلغاء المسموح")}</label><input name="cancellation_allowed_fee" type="number" min="0" step="0.01" value="${settings.cancellation?.allowed_fee??0}" /></div></article>
        <article><div class="audit-rule-title"><div><strong>${ui("Duplicate fees","الرسوم المكررة")}</strong><small>${ui("Detect identical fee rows on the same bill and shipment.","اكتشف الرسوم المتطابقة على نفس الفاتورة والشحنة.")}</small></div>${switchButton({field:"duplicates_enabled",value:settings.duplicates?.enabled,label:false})}</div><div class="field"><label>${ui("Amount tolerance","سماح المبلغ")}</label><input name="duplicate_tolerance" type="number" min="0" step="0.01" value="${settings.duplicates?.amount_tolerance??0.01}" /></div></article>
        <article><div class="audit-rule-title"><div><strong>${ui("Payment fees","رسوم طرق الدفع")}</strong><small>${ui("Match POS and COD charges to requested and actual payment codes.","طابق رسوم POS والتحصيل مع أكواد الدفع المطلوبة والفعلية.")}</small></div>${switchButton({field:"payment_enabled",value:settings.payment?.enabled,label:false})}</div><div class="form-grid"><div class="field"><label>${ui("Actual POS codes","أكواد POS الفعلية")}</label><input name="actual_pos_codes" value="${escapeHtml((settings.payment?.actual_pos_codes||[]).join(", "))}" /></div><div class="field"><label>${ui("Prepaid request codes","أكواد الدفع المقدم")}</label><input name="requested_prepaid_codes" value="${escapeHtml((settings.payment?.requested_prepaid_codes||[]).join(", "))}" /></div></div></article>
        <article><div class="audit-rule-title"><div><strong>${ui("Closing delay","تأخر التقفيل")}</strong><small>${ui("Alert when a billable shipment has no completed bill after the allowed period.","نبه عندما تمر المهلة على شحنة قابلة للتقفيل بدون فاتورة مقفلة.")}</small></div>${switchButton({field:"settlement_enabled",value:settings.settlement?.enabled,label:false})}</div><div class="field"><label>${ui("Allowed days without closing","الأيام المسموحة بدون تقفيل")}</label><input name="settlement_overdue_days" type="number" min="1" max="365" step="1" value="${settings.settlement?.overdue_days??7}" /></div></article>
        <article class="wide"><div class="audit-rule-title"><div><strong>${ui("Configured carrier pricing","تسعير شركة الشحن المحدد")}</strong><small>${ui("Used as an internal expectation, not as a replacement for the signed carrier contract.","يستخدم كتوقع داخلي ولا يستبدل عقد شركة الشحن المعتمد.")}</small></div>${switchButton({field:"pricing_enabled",value:settings.pricing?.enabled,label:false})}</div><div class="audit-pricing-grid"><div class="field"><label>${ui("Base fee","السعر الأساسي")}</label><input name="pricing_base_fee" type="number" min="0" step="0.01" value="${settings.pricing?.base_fee??18}" /></div><div class="field"><label>${ui("Included kg","الوزن المشمول")}</label><input name="pricing_included_weight" type="number" min="0" step="1" value="${settings.pricing?.included_weight_kg??5}" /></div><div class="field"><label>${ui("Extra started kg","الكيلو الإضافي")}</label><input name="pricing_extra_kg" type="number" min="0" step="0.01" value="${settings.pricing?.extra_started_kg_fee??1}" /></div><div class="field"><label>${ui("VAT (%)","الضريبة %")}</label><input name="pricing_vat" type="number" min="0" step="0.1" value="${settings.pricing?.vat_percent??15}" /></div><div class="field"><label>${ui("Amount tolerance","سماح المبلغ")}</label><input name="pricing_tolerance" type="number" min="0" step="0.01" value="${settings.pricing?.tolerance_amount??0.5}" /></div></div></article></div><div class="audit-rule-footer"><label><span>${ui("Run automatically after OMS and tracking sync","تشغيل تلقائي بعد مزامنة OMS والتتبع")}</span>${switchButton({field:"auto_run_after_sync",value:settings.auto_run_after_sync,label:false})}</label><button class="btn primary" type="submit">${i("check")}${ui("Save rules","حفظ القواعد")}</button></div></form></section>
      <section data-audit-panel="disputes" hidden><div class="card audit-workspace"><div class="audit-section-head compact"><div><span class="section-kicker">CASE WORKFLOW</span><h2>${ui("Carrier disputes","اعتراضات شركة الشحن")}</h2><p>${ui("Draft, submit and close cases without losing their original evidence.","أنشئ وأرسل وأغلق الاعتراضات مع الاحتفاظ بالدليل الأصلي.")}</p></div></div><div id="auditDisputesArea"></div></div></section>`;

    document.getElementById("auditSeverity")?.insertAdjacentHTML("beforeend",`<option value="info">${shippingAuditSeverityLabel("info")}</option>`);
    document.getElementById("auditStatus")?.insertAdjacentHTML("beforeend",`<option value="notice">${shippingAuditStatusLabel("notice")}</option>`);
    if(summary.notices) document.querySelector(".audit-kpis")?.insertAdjacentHTML("afterend",`<div class="audit-notice-summary">${i("info")}<span><b>${summary.notices}</b> ${ui("payment and POS notices are stored for reference only. They are excluded from problems and financial exposure.","تنبيهًا متعلقًا بالدفع وPOS محفوظة للرجوع فقط، ولا تدخل ضمن المشاكل أو الفروقات المالية.")}</span></div>`);
    const showTab=tab=>{document.querySelectorAll("[data-audit-tab]").forEach(btn=>btn.classList.toggle("active",btn.dataset.auditTab===tab));document.querySelectorAll("[data-audit-panel]").forEach(panel=>panel.hidden=panel.dataset.auditPanel!==tab);};
    document.querySelectorAll("[data-audit-tab]").forEach(btn=>btn.onclick=()=>showTab(btn.dataset.auditTab));
    document.querySelectorAll("#auditRulesForm [data-form-switch]").forEach(btn=>btn.onclick=()=>updateFormSwitch(btn));
    let findingsPage=1,searchTimer=null;
    const findingParams=()=>new URLSearchParams({page:String(findingsPage),limit:"50",q:document.getElementById("auditSearch").value.trim(),status:document.getElementById("auditStatus").value,severity:document.getElementById("auditSeverity").value,rule_code:document.getElementById("auditRule").value,settlement_state:document.getElementById("auditSettlementState").value,date_from:document.getElementById("auditFrom").value,date_to:document.getElementById("auditTo").value});
    const drawFindings=async(targetPage=1,payload=null)=>{findingsPage=targetPage;const result=payload&&targetPage===1?payload:await api(`/api/admin/shipping/audit/findings?${findingParams()}`);const rows=result.findings||[],s=result.summary||{},pagination=result.pagination||{};findingsPage=pagination.page||1;document.getElementById("auditTableSummary").innerHTML=`<span><b>${pagination.total||0}</b>${ui("findings","ملاحظة")}</span><span><b>${s.financially_confirmed||0}</b>${ui("from completed bills","من فواتير مقفلة")}</span><span><b>${s.settlement_overdue||0}</b>${ui("overdue closings","تقفيل متأخر")}</span><span><b>${shippingMoney(s.exposure_amount,s.currency||"SAR")}</b>${ui("confirmed bill exposure","فروقات فواتير مقفلة")}</span>`;document.getElementById("auditFindingsArea").innerHTML=rows.length?`<div class="table-scroll"><table class="data-table audit-findings-table"><thead><tr><th>${ui("Finding","الملاحظة")}</th><th>${ui("Shipment / order","الشحنة / الطلب")}</th><th>${ui("Source and method","المصدر وطريقة الاكتشاف")}</th><th>${ui("Exposure","الفرق")}</th><th>${ui("Status","الحالة")}</th><th>${ui("Detected","تاريخ الاكتشاف")}</th><th></th></tr></thead><tbody>${rows.map(row=>{const bill=row.source?.bills?.find(item=>item.settlement_status==="Completed")||row.source?.bills?.[0];const step=row.detection_steps?.[1];return `<tr><td><div class="audit-finding-name"><span class="audit-severity ${escapeHtml(row.severity)}"></span><div><strong>${escapeHtml(state.lang==="ar"?row.title_ar:row.title_en)}</strong><small>${escapeHtml(shippingAuditRuleLabel(row.rule_code))}</small></div></div></td><td><strong>${escapeHtml(row.waybill_no||"-")}</strong><small>${row.client_order_no?`#${escapeHtml(row.client_order_no)}`:ui("No linked order","لا يوجد طلب مرتبط")}</small></td><td><div class="audit-source-cell"><span class="status-pill ${row.financially_confirmed?"good":"warn"}">${row.financially_confirmed?ui("Completed bill","فاتورة مقفلة"):ui(`No closing after ${row.configured_overdue_days||"-"} days`,`بدون تقفيل بعد ${row.configured_overdue_days||"-"} أيام`)}</span>${bill?`<button type="button" data-open-source-bill="${bill.id}">${escapeHtml(bill.bill_code||bill.bill_type)}</button>`:""}<small>${escapeHtml(state.lang==="ar"?step?.ar:step?.en)}</small></div></td><td><strong class="${Number(row.exposure_amount)>0?"negative":""}">${shippingMoney(row.exposure_amount,row.currency)}</strong><small>${row.actual_amount!=null?`${ui("Charged","المحتسب")}: ${shippingMoney(row.actual_amount,row.currency)}`:""}</small></td><td><span class="status-pill ${shippingAuditStatusClass(row.status)}">${escapeHtml(shippingAuditStatusLabel(row.status))}</span></td><td>${formatDateTime(row.last_detected_at||row.detected_at)}</td><td><button class="btn icon-btn" type="button" data-open-audit-finding="${row.id}" title="${ui("Open details","فتح التفاصيل")}">${i("eye")}</button></td></tr>`}).join("")}</tbody></table></div>`:`<div class="empty-state"><div><h2>${ui("No findings match these filters","لا توجد ملاحظات مطابقة")}</h2><p class="muted">${ui("The current filter set has no carrier fee exceptions.","الفلاتر الحالية لا تحتوي فروقات في رسوم الشحن.")}</p></div></div>`;document.querySelectorAll("[data-open-audit-finding]").forEach(btn=>btn.onclick=()=>location.hash=`shippingAuditFinding/${btn.dataset.openAuditFinding}`);document.querySelectorAll("[data-open-source-bill]").forEach(btn=>btn.onclick=event=>{event.stopPropagation();location.hash=`shippingCarrierBill/${btn.dataset.openSourceBill}`;});document.getElementById("auditPagination").innerHTML=pagination.total_pages>1?`<div><button class="btn" id="auditPrev" ${findingsPage<=1?"disabled":""}>${i("arrow-left")}${ui("Previous","السابق")}</button><button class="btn" id="auditNext" ${findingsPage>=pagination.total_pages?"disabled":""}>${ui("Next","التالي")}${i("arrow-right")}</button></div><span>${ui("Page","صفحة")} ${findingsPage} ${ui("of","من")} ${pagination.total_pages}</span>`:"";document.getElementById("auditPrev")?.addEventListener("click",()=>drawFindings(findingsPage-1));document.getElementById("auditNext")?.addEventListener("click",()=>drawFindings(findingsPage+1));};
    ["auditStatus","auditSeverity","auditRule","auditSettlementState","auditFrom","auditTo"].forEach(id=>document.getElementById(id).onchange=()=>drawFindings(1));document.getElementById("auditSearch").oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>drawFindings(1),250);};
    const drawDisputes=()=>{document.getElementById("auditDisputesArea").innerHTML=disputes.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>${ui("Case","الحالة")}</th><th>${ui("Waybill","البوليصة")}</th><th>${ui("Subject","الموضوع")}</th><th>${ui("Amount","المبلغ")}</th><th>${ui("Status","الحالة")}</th><th>${ui("Created","الإنشاء")}</th><th></th></tr></thead><tbody>${disputes.map(row=>`<tr><td><strong>#${row.id}</strong></td><td>${escapeHtml(row.waybill_no||"-")}</td><td>${escapeHtml(row.subject||"-")}</td><td>${shippingMoney(row.amount,row.currency)}</td><td><select data-dispute-status="${row.id}">${["draft","submitted","carrier_review","accepted","rejected","closed"].map(v=>`<option value="${v}" ${v===row.status?"selected":""}>${shippingAuditStatusLabel(v)}</option>`).join("")}</select></td><td>${formatDateTime(row.created_at)}</td><td><button class="btn icon-btn" data-dispute-finding="${row.finding_id}">${i("eye")}</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty-state"><div><h2>${ui("No disputes yet","لا توجد اعتراضات بعد")}</h2><p class="muted">${ui("Open a finding and create a case when its evidence is ready.","افتح الملاحظة وأنشئ اعتراضًا عندما يكتمل دليلها.")}</p></div></div>`;document.querySelectorAll("[data-dispute-finding]").forEach(btn=>btn.onclick=()=>location.hash=`shippingAuditFinding/${btn.dataset.disputeFinding}`);document.querySelectorAll("[data-dispute-status]").forEach(select=>select.onchange=async()=>{await api(`/api/admin/shipping/audit/disputes/${select.dataset.disputeStatus}`,{method:"PATCH",body:JSON.stringify({status:select.value})});toast(ui("Case updated","تم تحديث الاعتراض"));});};
    document.getElementById("auditRulesForm").onsubmit=async event=>{event.preventDefault();const form=new FormData(event.currentTarget),on=name=>event.currentTarget.querySelector(`[data-form-switch="${name}"]`)?.dataset.switchValue==="true",list=name=>String(form.get(name)||"").split(",").map(v=>v.trim()).filter(Boolean);const payload={enabled:on("audit_enabled"),auto_run_after_sync:on("auto_run_after_sync"),weight:{...settings.weight,enabled:on("weight_enabled"),tolerance_kg:Number(form.get("weight_tolerance_kg")),tolerance_percent:Number(form.get("weight_tolerance_percent"))},cancellation:{...settings.cancellation,enabled:on("cancellation_enabled"),allowed_fee:Number(form.get("cancellation_allowed_fee"))},duplicates:{...settings.duplicates,enabled:on("duplicates_enabled"),amount_tolerance:Number(form.get("duplicate_tolerance"))},payment:{...settings.payment,enabled:on("payment_enabled"),actual_pos_codes:list("actual_pos_codes"),requested_prepaid_codes:list("requested_prepaid_codes")},settlement:{...settings.settlement,enabled:on("settlement_enabled"),overdue_days:Number(form.get("settlement_overdue_days")),require_completed_bill_for_financial_findings:true},pricing:{...settings.pricing,enabled:on("pricing_enabled"),base_fee:Number(form.get("pricing_base_fee")),included_weight_kg:Number(form.get("pricing_included_weight")),extra_started_kg_fee:Number(form.get("pricing_extra_kg")),vat_percent:Number(form.get("pricing_vat")),tolerance_amount:Number(form.get("pricing_tolerance"))}};await api("/api/admin/shipping/audit/settings",{method:"PUT",body:JSON.stringify(payload)});toast(ui("Audit rules saved","تم حفظ قواعد المراجعة"));renderShippingAudit(page);};
    document.getElementById("runShippingAudit").onclick=async event=>{event.currentTarget.disabled=true;event.currentTarget.innerHTML=`<span class="loading-spinner"></span>${ui("Checking shipments…","جاري فحص الشحنات…")}`;try{await api("/api/admin/shipping/audit/run",{method:"POST",body:JSON.stringify({trigger:"manual"})});toast(ui("Audit completed","اكتملت المراجعة"));renderShippingAudit(page);}catch(error){toast(error.message,"error");event.currentTarget.disabled=false;}};
    document.getElementById("refreshShippingAudit").onclick=()=>renderShippingAudit(page);drawDisputes();await drawFindings(1,initialFindings);
  }

  async function renderShippingAuditFinding(page,findingId){
    if(!findingId){location.hash="shippingAudit";return;}
    const result=await api(`/api/admin/shipping/audit/findings/${findingId}`),finding=result.finding||{},shipment=result.shipment||{},order=result.order||{},contents=result.order_contents||{},fees=shipment.carrier_fee_breakdown||[],events=result.unified_timeline||[],timelineEvidence=result.timeline_evidence||{},isNotice=finding.finding_kind==="informational"||finding.severity==="info"||finding.status==="notice";
    const timelineTitle=event=>event.type==="tracking"?omsStatusLabel(state.lang==="ar"?event.title_ar:event.title_en):event.type==="latest_status"?`${ui("Latest status","آخر حالة")}: ${shippingStatusLabel(event.detail?.status_group||shipment.status_group)}`:(state.lang==="ar"?event.title_ar:event.title_en);
    page.innerHTML=`<div class="audit-detail-head"><div><button class="btn back-link" id="backToShippingAudit">${i("arrow-left")}${ui("Back to fee audit","العودة لمراجعة الرسوم")}</button><span class="section-kicker">AUDIT FINDING #${finding.id}</span><h1>${escapeHtml(state.lang==="ar"?finding.title_ar:finding.title_en)}</h1><p>${escapeHtml(state.lang==="ar"?finding.reason_ar:finding.reason_en)}</p></div><div><span class="audit-priority ${escapeHtml(finding.severity)}">${shippingAuditSeverityLabel(finding.severity)}</span><strong>${shippingMoney(finding.exposure_amount,finding.currency)}</strong><small>${ui("potential exposure","فرق محتمل")}</small></div></div>
      <div class="audit-detail-grid"><section class="card card-pad"><div class="audit-section-head compact"><div><span class="section-kicker">EVIDENCE</span><h2>${ui("Shipment and bill evidence","دليل الشحنة والفاتورة")}</h2></div></div><dl class="audit-evidence"><div><dt>${ui("Waybill","البوليصة")}</dt><dd>${escapeHtml(finding.waybill_no||"-")}</dd></div><div><dt>${ui("Order","الطلب")}</dt><dd>${escapeHtml(finding.client_order_no||order.legacy_order_number||order.id||"-")}</dd></div><div><dt>${ui("Carrier status","حالة الشركة")}</dt><dd>${escapeHtml(omsStatusLabel(shipment.status_label||shipment.status_code||shipment.status_group))}</dd></div><div><dt>${ui("Requested payment","الدفع المطلوب")}</dt><dd>${escapeHtml(omsPaymentLabel(shipment.payment_method)||"-")}</dd></div><div><dt>${ui("Actual payment","الدفع الفعلي")}</dt><dd>${escapeHtml(omsPaymentLabel(shipment.metadata?.actual_payment_method)||"-")}</dd></div><div><dt>${ui("Expected / billed weight","الوزن المتوقع / المحتسب")}</dt><dd>${finding.expected_weight??order.shipping_package?.gross_weight??"-"} / ${finding.billed_weight??shipment.carrier_billable_weight??"-"} kg</dd></div><div><dt>${ui("Expected amount","المبلغ المتوقع")}</dt><dd>${shippingMoney(finding.expected_amount,finding.currency)}</dd></div><div><dt>${ui("Charged amount","المبلغ المحتسب")}</dt><dd>${shippingMoney(finding.actual_amount??shipment.carrier_actual_cost,finding.currency)}</dd></div></dl><div class="audit-fee-list"><h3>${ui("Fee rows","بنود الرسوم")}</h3>${fees.length?fees.map(fee=>`<div><span>${escapeHtml(omsFeeLabel(fee.name))}<small>${escapeHtml(fee.bill_code||"")}</small></span><strong>${shippingMoney(fee.amount,fee.currency||finding.currency)}</strong></div>`).join(""):`<p class="muted">${ui("No fee rows stored","لا توجد بنود رسوم محفوظة")}</p>`}</div><div class="audit-provenance"><div class="audit-section-head compact"><div><span class="section-kicker">HOW IT WAS FOUND</span><h2>${ui("Source and detection method","المصدر وطريقة اكتشاف المشكلة")}</h2></div><span class="status-pill ${finding.financially_confirmed?"good":"warn"}">${finding.financially_confirmed?ui("Confirmed closed bill","فاتورة مقفلة مؤكدة"):ui("Operational alert","تنبيه تشغيلي")}</span></div><ol>${(finding.detection_steps||[]).map(step=>`<li>${escapeHtml(state.lang==="ar"?step.ar:step.en)}</li>`).join("")}</ol><div class="audit-source-links">${(finding.source?.bills||[]).map(bill=>`<button class="btn" type="button" data-detail-source-bill="${bill.id}">${i("file")}<span>${bill.bill_type==="codBill"?"COD Bill":"Fee Bill"}<small>${escapeHtml(bill.bill_code||"")}</small></span></button>`).join("")}${(finding.source?.reports||[]).map(report=>`<button class="btn" type="button" data-detail-source-report="${report.id}">${i("file")}<span>OMS Report<small>${escapeHtml(report.report_date||"")}</small></span></button>`).join("")}${(finding.source?.reconciliations||[]).map(row=>`<button class="btn" type="button" data-detail-source-week="${row.id}">${i("layers")}<span>${ui("Weekly closing","التقفيل الأسبوعي")}<small>${escapeHtml(row.cycle_start)} → ${escapeHtml(row.cycle_end)}</small></span></button>`).join("")||(!finding.source?.bills?.length&&!finding.source?.reports?.length?`<span class="muted small">${ui("No closing source is linked yet.","لا يوجد مصدر تقفيل مرتبط حتى الآن.")}</span>`:"")}</div></div></section>
      <aside class="card card-pad audit-case-panel"><span class="section-kicker">WORKFLOW</span><h2>${ui("Review decision","قرار المراجعة")}</h2><div class="field"><label>${ui("Finding status","حالة الملاحظة")}</label><select id="findingStatus">${["open","reviewing","disputed","resolved","ignored"].map(v=>`<option value="${v}" ${v===finding.status?"selected":""}>${shippingAuditStatusLabel(v)}</option>`).join("")}</select></div><div class="field"><label>${ui("Internal notes","ملاحظات داخلية")}</label><textarea id="findingNotes" placeholder="${ui("Record what was checked and why.","سجل ما تمت مراجعته والسبب.")}">${escapeHtml(finding.notes||"")}</textarea></div><button class="btn primary full-button" id="saveFinding">${i("check")}${ui("Save decision","حفظ القرار")}</button><button class="btn full-button" id="createDispute" ${finding.dispute_id?"disabled":""}>${i("file")}${finding.dispute_id?ui("Dispute created","تم إنشاء اعتراض"):ui("Create dispute case","إنشاء حالة اعتراض")}</button><small>${ui("Creating a case copies this evidence into an independent carrier dispute record.","إنشاء الحالة ينسخ هذا الدليل إلى سجل اعتراض مستقل على شركة الشحن.")}</small></aside>
      <section class="card card-pad audit-order-contents"><div class="audit-section-head compact"><div><span class="section-kicker">STORE ORDER #${escapeHtml(order.legacy_order_number||order.id||"-")}</span><h2>${ui("What was inside the order","محتويات الطلب وحساب الوزن")}</h2><p>${ui("The expected weight is reconstructed from product and variant shipping profiles.","يتم توضيح الوزن المتوقع من بيانات شحن كل منتج ومتغير.")}</p></div><div class="weight-equation"><span>${ui("Expected","المتوقع")}</span><strong>${contents.expected_weight??"-"} kg</strong><small>${escapeHtml(contents.weight_source||"")}</small></div></div>${(contents.items||[]).length?`<div class="audit-order-item-list">${contents.items.map(item=>`<article><img src="${escapeHtml(item.image_url||"")}" alt="" /><div><strong>${escapeHtml(state.lang==="ar"?(item.name_ar||item.name_en):(item.name_en||item.name_ar))}</strong><small>${escapeHtml(item.variant_label||item.sku||"")}</small><small>${ui("Source","المصدر")}: ${escapeHtml(item.weight_source||"-")} ${item.shipping_profile_id?`· ${escapeHtml(item.shipping_profile_id)}`:""}</small></div><span>${item.quantity} × ${item.unit_weight??"?"} kg</span><b>${item.total_weight??"?"} kg</b></article>`).join("")}</div><div class="weight-comparison"><span>${ui("Items calculation","مجموع أوزان المنتجات")}<b>${contents.calculated_weight??"-"} kg</b></span><span>${ui("Order package snapshot","وزن الطرد في الطلب")}<b>${contents.expected_weight??"-"} kg</b></span><span>${ui("iMile billed weight","وزن iMile المحتسب")}<b>${finding.billed_weight??shipment.carrier_billable_weight??"-"} kg</b></span></div>`:`<div class="audit-evidence-gap">${i("box")}<div><strong>${ui("Order contents are unavailable","محتويات الطلب غير متاحة")}</strong><p>${ui("The shipment is not linked to a store order, so no expected item weight was assumed.","الشحنة غير مرتبطة بطلب في الموقع، لذلك لم يتم افتراض وزن للمنتجات.")}</p></div></div>`}${finding.rule_code==="duplicate_fee"?`<div class="duplicate-proof"><h3>${ui("Rows counted as duplicates","البنود التي احتسبت كمكررة")}</h3>${(finding.matched_fee_rows||[]).map((fee,index)=>`<div><b>#${index+1}</b><span>${escapeHtml(omsFeeLabel(fee.name))}<small>${escapeHtml(fee.bill_code||"")} · ${escapeHtml(fee.bill_date||"")}</small></span><strong>${shippingMoney(fee.amount,fee.currency)}</strong></div>`).join("")}</div>`:""}</section>
      <section class="card card-pad audit-timeline"><div class="audit-section-head compact"><div><span class="section-kicker">FULL SHIPMENT HISTORY</span><h2>${ui("Tracking, OMS reports and closings","التتبع وتقارير OMS والتقفيلات")}</h2><p>${ui("One chronological path from shipment creation to each report and completed bill.","مسار زمني واحد من إنشاء الشحنة حتى كل تقرير وفاتورة مقفلة.")}</p></div></div>${events.length?events.map(event=>`<div class="timeline-${escapeHtml(event.type)}"><span></span><div><strong>${escapeHtml(state.lang==="ar"?event.title_ar:event.title_en)}</strong>${event.type==="carrier_bill"?`<button type="button" data-timeline-bill="${event.detail?.id}">${escapeHtml(event.detail?.bill_code||"")}</button>`:event.type==="oms_report"?`<button type="button" data-timeline-report="${event.detail?.id}">${ui("Open report","فتح التقرير")}</button>`:event.type==="reconciliation"?`<button type="button" data-timeline-week="${event.detail?.id}">${ui("Open weekly closing","فتح التقفيل الأسبوعي")}</button>`:""}</div><small>${formatDateTime(event.time)}</small></div>`).join(""):`<div class="audit-evidence-gap">${i("file")}<div><strong>${ui("No timeline evidence is available","لا يوجد دليل زمني متاح")}</strong></div></div>`}</section></div>`;
    document.querySelector(".audit-fee-list").innerHTML=shippingAuditFeeBreakdownMarkup(fees,finding.currency||shipment.currency||"SAR");
    document.querySelector(".audit-order-contents")?.insertAdjacentHTML("beforebegin",shippingAuditExplanationMarkup(finding,shipment));
    document.querySelector(".audit-explanation")?.insertAdjacentHTML("afterend",shippingAuditSourceTraceMarkup(finding));
    document.querySelectorAll(".audit-timeline>div:not(.audit-section-head):not(.audit-evidence-gap)").forEach((row,index)=>{
      const title=row.querySelector("strong");
      if(title&&events[index]) title.textContent=timelineTitle(events[index]);
    });
    if(!timelineEvidence.tracking_event_count) document.querySelector(".audit-timeline .audit-section-head")?.insertAdjacentHTML("afterend",`<div class="audit-evidence-gap compact-gap">${i("info")}<div><strong>${ui("Detailed tracking events were not stored for this historical shipment","أحداث التتبع التفصيلية غير محفوظة لهذه الشحنة التاريخية")}</strong><p>${ui("The timeline below uses the stored latest status, OMS report, carrier bills and weekly closing only.","يعتمد التسلسل أدناه على آخر حالة محفوظة وتقرير OMS وفواتير الشركة والتقفيلة الأسبوعية فقط.")}</p></div></div>`);
    if(order.id) document.querySelector(".audit-source-links")?.insertAdjacentHTML("beforeend",`<button class="btn" type="button" data-detail-store-order="${order.id}">${i("shopping-bag")}<span>${ui("Store order","طلب المتجر")}<small>#${escapeHtml(order.legacy_order_number||order.id)}</small></span></button>`);
    if(isNotice){
      document.querySelector(".audit-detail-head>div:last-child").innerHTML=`<span class="audit-priority info">${shippingAuditSeverityLabel("info")}</span><strong>${ui("Notice only","تنبيه فقط")}</strong><small>${ui("No financial exposure or review required","لا توجد فروق مالية ولا يحتاج إلى مراجعة")}</small>`;
      document.querySelector(".audit-case-panel").innerHTML=`<span class="section-kicker">INFORMATION</span><h2>${ui("No action required","لا يلزم اتخاذ إجراء")}</h2><div class="audit-evidence-gap compact-gap">${i("info")}<div><strong>${ui("Stored for reference only","محفوظ للرجوع فقط")}</strong><p>${ui("Payment can change from cash to card when the courier arrives. This notice is excluded from problems, exposure and disputes.","قد يغيّر العميل الدفع من الكاش إلى البطاقة عند وصول المندوب. هذا التنبيه مستبعد من المشاكل والفروقات والاعتراضات.")}</p></div></div>`;
    }
    document.getElementById("backToShippingAudit").onclick=()=>location.hash="shippingAudit";
    document.querySelectorAll("[data-detail-source-bill]").forEach(btn=>btn.onclick=()=>location.hash=`shippingCarrierBill/${btn.dataset.detailSourceBill}`);
    document.querySelectorAll("[data-detail-store-order]").forEach(btn=>btn.onclick=()=>location.hash=`orderDetail/${btn.dataset.detailStoreOrder}`);
    document.querySelectorAll("[data-detail-source-report]").forEach(btn=>btn.onclick=()=>location.hash=`shippingReport/${btn.dataset.detailSourceReport}`);
    document.querySelectorAll("[data-detail-source-week]").forEach(btn=>btn.onclick=()=>location.hash=`shippingReconciliation/${btn.dataset.detailSourceWeek}`);
    document.querySelectorAll("[data-timeline-bill]").forEach(btn=>btn.onclick=()=>location.hash=`shippingCarrierBill/${btn.dataset.timelineBill}`);
    document.querySelectorAll("[data-timeline-report]").forEach(btn=>btn.onclick=()=>location.hash=`shippingReport/${btn.dataset.timelineReport}`);
    document.querySelectorAll("[data-timeline-week]").forEach(btn=>btn.onclick=()=>location.hash=`shippingReconciliation/${btn.dataset.timelineWeek}`);
    if(!isNotice){
      document.getElementById("saveFinding").onclick=async()=>{await api(`/api/admin/shipping/audit/findings/${finding.id}`,{method:"PATCH",body:JSON.stringify({status:document.getElementById("findingStatus").value,notes:document.getElementById("findingNotes").value})});toast(ui("Finding updated","تم تحديث الملاحظة"));renderShippingAuditFinding(page,finding.id);};
      document.getElementById("createDispute").onclick=async event=>{event.currentTarget.disabled=true;try{await api(`/api/admin/shipping/audit/findings/${finding.id}/dispute`,{method:"POST",body:JSON.stringify({})});toast(ui("Dispute case created","تم إنشاء حالة الاعتراض"));renderShippingAuditFinding(page,finding.id);}catch(error){toast(error.message,"error");event.currentTarget.disabled=false;}};
    }
  }

  async function renderShippingBillList(page,billType){
    const isCod=billType==="codBill",viewName=isCod?"shippingCodBills":"shippingFeeBills";
    let currentPage=1,searchTimer=null;
    page.innerHTML=`<div class="oms-full-page-head"><div><button class="btn back-link" id="backFromBillList">${i("arrow-left")}${ui("Back to closings","العودة للتقفيلات")}</button><span class="section-kicker">iMile · MY BILL</span><h1>${isCod?ui("COD collection bills","فواتير تحصيل COD"):ui("Carrier fee bills","فواتير مصاريف الشحن")}</h1><p>${isCod?ui("Collection outputs received from customers. These do not supply individual fee rows.","مخرجات المبالغ المحصلة من العملاء، ولا تعتبر مصدرًا لبنود مصاريف الشحن."):ui("The exact source of delivery, COD, POS and VAT fee rows charged by iMile.","المصدر المباشر لبنود التوصيل والتحصيل وPOS والضريبة المحتسبة من iMile.")}</p></div><div class="bill-list-switch"><button type="button" data-bill-list-view="shippingCodBills" class="${isCod?"active":""}">${ui("COD bills","فواتير COD")}</button><button type="button" data-bill-list-view="shippingFeeBills" class="${!isCod?"active":""}">${ui("Fee bills","فواتير المصاريف")}</button></div></div>
      <section class="audit-kpis bill-list-kpis"><article><span>${ui("Bills","الفواتير")}</span><strong id="billListTotal">-</strong><small>${isCod?ui("collection outputs","فواتير تحصيل"):ui("fee outputs","فواتير مصاريف")}</small></article><article><span>${ui("Total amount","إجمالي القيمة")}</span><strong id="billListAmount">-</strong><small>${ui("for current filters","حسب الفلاتر الحالية")}</small></article><article><span>${ui("Completed","مقفلة")}</span><strong id="billListCompleted">-</strong><small>${ui("completed by iMile","مكتملة من iMile")}</small></article><article><span>${ui("Pending","معلقة")}</span><strong id="billListPending">-</strong><small>${ui("needs closing follow-up","تحتاج متابعة التقفيل")}</small></article></section>
      <section class="card bill-list-workspace"><div class="bill-list-filters"><div class="field filter-wide"><label>${ui("Search","بحث")}</label><input id="billListSearch" type="search" placeholder="${ui("Bill code, invoice or client","كود الفاتورة أو رقمها أو العميل")}" /></div><div class="field"><label>${ui("Status","الحالة")}</label><select id="billListStatus"><option value="">${ui("All statuses","كل الحالات")}</option><option value="Completed">${ui("Completed","مقفلة")}</option><option value="Incomplete">${ui("Incomplete","غير مكتملة")}</option></select></div><div class="field"><label>${ui("From","من")}</label><input id="billListFrom" type="date" /></div><div class="field"><label>${ui("To","إلى")}</label><input id="billListTo" type="date" /></div></div><div id="billListArea"><div class="shipping-loading"><span class="loading-spinner"></span></div></div><div class="shipping-pagination" id="billListPagination"></div></section>`;
    const params=()=>new URLSearchParams({type:billType,page:String(currentPage),limit:"15",q:document.getElementById("billListSearch").value.trim(),status:document.getElementById("billListStatus").value,date_from:document.getElementById("billListFrom").value,date_to:document.getElementById("billListTo").value});
    const load=async(pageNumber=1)=>{currentPage=pageNumber;const data=await api(`/api/admin/shipping/carrier-bills?${params()}`),rows=data.bills||[],summary=data.summary||{},pagination=data.pagination||{};currentPage=pagination.page||1;document.getElementById("billListTotal").textContent=Number(summary.total||0).toLocaleString();document.getElementById("billListAmount").textContent=shippingMoney(summary.amount,summary.currency);document.getElementById("billListCompleted").textContent=Number(summary.completed||0).toLocaleString();document.getElementById("billListPending").textContent=Number(summary.pending||0).toLocaleString();document.getElementById("billListArea").innerHTML=rows.length?`<div class="table-scroll"><table class="data-table carrier-bill-list-table"><thead><tr><th>${ui("Bill identity","بيانات الفاتورة")}</th><th>${ui("Cycle","الدورة")}</th><th>${ui("Issue date","تاريخ الإصدار")}</th><th>${ui("Amount","القيمة")}</th><th>${ui("Status","الحالة")}</th><th>${ui("Role","دورها")}</th><th></th></tr></thead><tbody>${rows.map(bill=>`<tr><td><strong>${escapeHtml(bill.bill_code||"-")}</strong><small>${escapeHtml(bill.invoice_number||bill.client_name||bill.client_code||"")}</small></td><td><strong>${escapeHtml(bill.cycle_start||"-")} → ${escapeHtml(bill.cycle_end||"-")}</strong><small>${ui("Wednesday to Tuesday cycle","دورة الأربعاء إلى الثلاثاء")}</small></td><td>${escapeHtml(bill.bill_date||"-")}</td><td><strong>${shippingMoney(bill.amount,bill.currency)}</strong><small>${escapeHtml(bill.currency||"SAR")}</small></td><td><span class="status-pill ${bill.settlement_status==="Completed"?"good":"warn"}">${bill.settlement_status==="Completed"?ui("Completed","مقفلة"):escapeHtml(bill.settlement_status||ui("Pending","معلقة"))}</span></td><td><strong>${isCod?ui("Customer collections","تحصيلات العملاء"):ui("Carrier fee rows","بنود مصاريف الشركة")}</strong><small>${isCod?ui("Not used in fee calculations","لا تدخل في حساب بنود المصاريف"):ui("Used by fee audit","تستخدم في مراجعة الرسوم")}</small></td><td><button class="btn" type="button" data-open-carrier-bill="${bill.id}">${i("eye")}${ui("Open","فتح")}</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty-state"><div><h2>${ui("No bills match these filters","لا توجد فواتير مطابقة")}</h2></div></div>`;document.querySelectorAll("[data-open-carrier-bill]").forEach(button=>button.onclick=()=>location.hash=`shippingCarrierBill/${button.dataset.openCarrierBill}`);document.getElementById("billListPagination").innerHTML=pagination.total_pages>1?`<div><button class="btn" id="billListPrev" ${currentPage<=1?"disabled":""}>${i("arrow-left")}${ui("Previous","السابق")}</button><button class="btn" id="billListNext" ${currentPage>=pagination.total_pages?"disabled":""}>${ui("Next","التالي")}${i("arrow-right")}</button></div><span>${ui("Page","صفحة")} ${currentPage} ${ui("of","من")} ${pagination.total_pages}</span>`:"";document.getElementById("billListPrev")?.addEventListener("click",()=>load(currentPage-1));document.getElementById("billListNext")?.addEventListener("click",()=>load(currentPage+1));};
    document.getElementById("backFromBillList").onclick=()=>location.hash="shippingClosings";
    document.querySelectorAll("[data-bill-list-view]").forEach(button=>button.onclick=()=>location.hash=button.dataset.billListView);
    ["billListStatus","billListFrom","billListTo"].forEach(id=>document.getElementById(id).onchange=()=>load(1));
    document.getElementById("billListSearch").oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>load(1),250);};
    await load();
  }

  async function renderShippingCarrierBill(page,billId){
    if(!billId){location.hash="shippingClosings";return;}
    const data=await api(`/api/admin/shipping/carrier-bills/${billId}`),bill=data.bill||{},shipments=data.shipments||[],findings=data.findings||[],summary=data.summary||{};
    const typeLabel=bill.bill_type==="codBill"?ui("COD collection bill","فاتورة التحصيل COD"):ui("Carrier fee bill","فاتورة مصاريف الشحن");
    page.innerHTML=`<div class="oms-full-page-head"><div><button class="btn back-link" id="backFromCarrierBill">${i("arrow-left")}${ui("Back to closings","العودة للتقفيلات")}</button><span class="section-kicker">iMile · ${escapeHtml(bill.bill_type||"BILL")}</span><h1>${typeLabel}</h1><p>${escapeHtml(bill.bill_code||"")} · ${escapeHtml(bill.cycle_start||"")} → ${escapeHtml(bill.cycle_end||"")}</p></div><span class="status-pill ${bill.settlement_status==="Completed"?"good":"warn"}">${bill.settlement_status==="Completed"?ui("Completed closing","تقفيل مكتمل"):escapeHtml(bill.settlement_status||ui("Not completed","غير مكتمل"))}</span></div>
      <section class="audit-kpis"><article><span>${ui("Bill amount","قيمة الفاتورة")}</span><strong>${shippingMoney(bill.amount,bill.currency)}</strong><small>${escapeHtml(bill.invoice_number||bill.bill_code||"")}</small></article><article><span>${ui("Cycle shipments","شحنات الدورة")}</span><strong>${shipments.length}</strong><small>${summary.billed_shipments||0} ${ui("with fee details","بتفاصيل رسوم")}</small></article><article class="${findings.length?"danger":""}"><span>${ui("Audit findings","ملاحظات المراجعة")}</span><strong>${findings.length}</strong><small>${shippingMoney(findings.reduce((sum,row)=>sum+Number(row.exposure_amount||0),0),bill.currency)}</small></article><article><span>${ui("Fetched from OMS","آخر تحميل من OMS")}</span><strong>${formatDateTime(bill.fetched_at)}</strong><small>${ui("Read-only carrier source","مصدر شركة الشحن للقراءة")}</small></article></section>
      <section class="card card-pad carrier-bill-origin"><div class="audit-section-head compact"><div><span class="section-kicker">SOURCE IDENTITY</span><h2>${ui("Original bill details","تفاصيل الفاتورة الأصلية")}</h2><p>${ui("These fields are stored exactly from iMile My Bill synchronization.","هذه الحقول محفوظة مباشرة من مزامنة My Bill في iMile.")}</p></div></div><dl class="audit-evidence"><div><dt>${ui("Bill code","كود الفاتورة")}</dt><dd>${escapeHtml(bill.bill_code||"-")}</dd></div><div><dt>${ui("Invoice number","رقم الفاتورة")}</dt><dd>${escapeHtml(bill.invoice_number||"-")}</dd></div><div><dt>${ui("Bill date","تاريخ الإصدار")}</dt><dd>${escapeHtml(bill.bill_date||"-")}</dd></div><div><dt>${ui("Cycle","الدورة")}</dt><dd>${escapeHtml(bill.cycle_start||"-")} → ${escapeHtml(bill.cycle_end||"-")}</dd></div><div><dt>${ui("Client","العميل")}</dt><dd>${escapeHtml(bill.client_name||bill.client_code||"-")}</dd></div><div><dt>${ui("Country / currency","الدولة / العملة")}</dt><dd>${escapeHtml(bill.business_country||"-")} · ${escapeHtml(bill.currency||"SAR")}</dd></div></dl><div class="audit-source-links">${(data.reconciliations||[]).map(row=>`<button class="btn" data-bill-week="${row.id}">${i("layers")}<span>${ui("Open weekly reconciliation","فتح التقفيل الأسبوعي")}<small>${escapeHtml(row.cycle_start)} → ${escapeHtml(row.cycle_end)}</small></span></button>`).join("")}${(data.reports||[]).map(report=>`<button class="btn" data-bill-report="${report.id}">${i("file")}<span>${ui("Open OMS report","فتح تقرير OMS")}<small>${escapeHtml(report.report_date||"")}</small></span></button>`).join("")}</div></section>
      ${findings.length?`<section class="card card-pad carrier-bill-findings"><div class="audit-section-head compact"><div><span class="section-kicker">WHY FLAGGED</span><h2>${ui("Problems traced to this bill","المشاكل المرتبطة بهذه الفاتورة")}</h2></div></div><div class="carrier-bill-finding-list">${findings.map(row=>`<button type="button" data-bill-finding="${row.id}"><span class="audit-severity ${escapeHtml(row.severity)}"></span><div><strong>${escapeHtml(state.lang==="ar"?row.title_ar:row.title_en)}</strong><small>${escapeHtml(row.waybill_no)} · ${escapeHtml(state.lang==="ar"?row.detection_steps?.[1]?.ar:row.detection_steps?.[1]?.en)}</small></div><b>${shippingMoney(row.exposure_amount,row.currency)}</b>${i("eye")}</button>`).join("")}</div></section>`:""}
      <section class="card oms-full-table"><div class="audit-section-head"><div><span class="section-kicker">${bill.bill_type==="codBill"?"CYCLE SHIPMENTS":"BILLED SHIPMENTS"}</span><h2>${ui("Shipments connected to this output","الشحنات المرتبطة بهذا المخرج")}</h2><p>${bill.bill_type==="codBill"?ui("COD bills are connected through the same weekly reconciliation cycle.","فاتورة COD مرتبطة بالشحنات من خلال نفس دورة التقفيل الأسبوعية."):ui("Matched by the exact bill code stored on each fee row.","تمت المطابقة بكود الفاتورة المحفوظ على كل بند رسوم.")}</p></div><span class="pill">${shipments.length}</span></div>${shippingShipmentsTable(shipments)}</section>`;
    document.getElementById("backFromCarrierBill").onclick=()=>location.hash="shippingClosings";
    document.querySelectorAll("[data-bill-week]").forEach(btn=>btn.onclick=()=>location.hash=`shippingReconciliation/${btn.dataset.billWeek}`);
    document.querySelectorAll("[data-bill-report]").forEach(btn=>btn.onclick=()=>location.hash=`shippingReport/${btn.dataset.billReport}`);
    document.querySelectorAll("[data-bill-finding]").forEach(btn=>btn.onclick=()=>location.hash=`shippingAuditFinding/${btn.dataset.billFinding}`);
  }

  async function renderShippingReconciliation(page,reconciliationId){
    if(!reconciliationId){location.hash="shippingClosings";return;}
    const data=await api(`/api/admin/shipping/weekly-reconciliations/${reconciliationId}`),row=data.reconciliation||{},bills=data.bills||[],findings=data.findings||[],shipments=data.shipments||[];
    const cod=bills.find(b=>b.bill_type==="codBill"),fee=bills.find(b=>b.bill_type==="feeBill");
    const issueText=issue=>({missing_cod_bill:ui("COD bill was not issued for this cycle.","لم تصدر فاتورة COD لهذه الدورة."),missing_fee_bill:ui("Fee bill was not issued for this cycle.","لم تصدر فاتورة المصاريف لهذه الدورة."),cod_not_completed:ui("COD bill exists but is not completed.","فاتورة COD موجودة لكنها غير مقفلة."),fee_not_completed:ui("Fee bill exists but is not completed.","فاتورة المصاريف موجودة لكنها غير مقفلة."),fees_exceed_collections:ui("Carrier fees are greater than collected COD.","مصاريف الشحن أكبر من مبالغ COD المحصلة."),fee_detail_mismatch:ui("Fee bill total differs from the sum of linked shipment fee details.","إجمالي فاتورة المصاريف يختلف عن مجموع تفاصيل رسوم الشحنات المرتبطة.")}[issue]||issue);
    page.innerHTML=`<div class="oms-full-page-head"><div><button class="btn back-link" id="backFromReconciliation">${i("arrow-left")}${ui("Back to closings","العودة للتقفيلات")}</button><span class="section-kicker">iMile · WEEKLY RECONCILIATION</span><h1>${escapeHtml(row.cycle_start||"")} → ${escapeHtml(row.cycle_end||"")}</h1><p>${ui("COD collections minus carrier fees equals the expected weekly transfer.","تحصيلات COD ناقص مصاريف الشحن تساوي التحويل الأسبوعي المتوقع.")}</p></div><span class="status-pill ${row.status==="completed"?"good":"warn"}">${row.status==="completed"?ui("Completed","مكتملة"):ui("Needs review","تحتاج مراجعة")}</span></div>
      <section class="weekly-reconciliation-kpis"><div><span>${ui("COD collections","التحصيلات")}</span><strong>${shippingMoney(row.cod_amount,row.currency)}</strong></div><div><span>${ui("Carrier fees","مصاريف الشحن")}</span><strong>${shippingMoney(row.fee_amount,row.currency)}</strong></div><div class="net"><span>${ui("Expected transfer","التحويل المتوقع")}</span><strong>${shippingMoney(row.expected_transfer,row.currency)}</strong></div><div><span>${ui("Linked fee detail","مجموع التفاصيل")}</span><strong>${shippingMoney(row.linked_fee_total,row.currency)}</strong></div></section>
      <div class="bill-output-grid">${[[cod,"COD BILL",ui("Customer collections","تحصيلات العملاء")],[fee,"FEE BILL",ui("Shipping expenses","مصاريف الشحن")]].map(([bill,kicker,label])=>bill?`<article class="card bill-output-card"><span class="section-kicker">${kicker}</span><h2>${label}</h2><strong>${shippingMoney(bill.amount,bill.currency)}</strong><code>${escapeHtml(bill.bill_code||"")}</code><div><span class="status-pill ${bill.settlement_status==="Completed"?"good":"warn"}">${escapeHtml(bill.settlement_status||"-")}</span><button class="btn" data-week-bill="${bill.id}">${i("eye")}${ui("Open bill","فتح الفاتورة")}</button></div></article>`:`<article class="card bill-output-card missing"><span class="section-kicker">${kicker}</span><h2>${label}</h2><p>${ui("This output is missing for the cycle.","هذا المخرج غير موجود لهذه الدورة.")}</p></article>`).join("")}</div>
      <section class="card card-pad reconciliation-explanation"><div class="audit-section-head compact"><div><span class="section-kicker">RECONCILIATION LOGIC</span><h2>${ui("What is wrong and how it was calculated","ما المشكلة وكيف تم حسابها")}</h2></div></div>${(row.issues||[]).length?`<div class="reconciliation-issue-list">${row.issues.map(issue=>`<div>${i("file")}<div><strong>${escapeHtml(shippingAuditRuleLabel(issue))}</strong><p>${escapeHtml(issueText(issue))}</p></div></div>`).join("")}</div>`:`<div class="audit-evidence-gap">${i("check")}<div><strong>${ui("The weekly outputs reconcile","مخرجات الأسبوع متطابقة")}</strong><p>${ui("Both bills are completed and the linked fee detail matches the fee bill total.","الفاتورتان مقفلتان ومجموع تفاصيل الرسوم مطابق لفاتورة المصاريف.")}</p></div></div>`}</section>
      ${findings.length?`<section class="card card-pad carrier-bill-findings"><div class="audit-section-head compact"><div><span class="section-kicker">SHIPMENT FINDINGS</span><h2>${ui("Shipment-level problems in this cycle","مشاكل الشحنات داخل هذه الدورة")}</h2></div></div><div class="carrier-bill-finding-list">${findings.map(f=>`<button data-week-finding="${f.id}"><span class="audit-severity ${escapeHtml(f.severity)}"></span><div><strong>${escapeHtml(state.lang==="ar"?f.title_ar:f.title_en)}</strong><small>${escapeHtml(f.waybill_no)} · ${escapeHtml(state.lang==="ar"?f.detection_steps?.[1]?.ar:f.detection_steps?.[1]?.en)}</small></div><b>${shippingMoney(f.exposure_amount,f.currency)}</b>${i("eye")}</button>`).join("")}</div></section>`:""}
      <section class="card oms-full-table"><div class="audit-section-head"><div><span class="section-kicker">WEEK SHIPMENTS</span><h2>${ui("All linked shipments","كل الشحنات المرتبطة")}</h2></div><span class="pill">${shipments.length}</span></div>${shippingShipmentsTable(shipments)}</section>`;
    document.getElementById("backFromReconciliation").onclick=()=>location.hash="shippingClosings";
    document.querySelectorAll("[data-week-bill]").forEach(btn=>btn.onclick=()=>location.hash=`shippingCarrierBill/${btn.dataset.weekBill}`);
    document.querySelectorAll("[data-week-finding]").forEach(btn=>btn.onclick=()=>location.hash=`shippingAuditFinding/${btn.dataset.weekFinding}`);
  }

  async function renderSettings(page) {
    const [settings, robots] = await Promise.all([api("/api/admin/settings"),api("/api/admin/robots"),loadResource("products").catch(()=>[]),loadResource("categories").catch(()=>[])]);
    const shippingRules = settings.free_shipping_rules?.length ? settings.free_shipping_rules : [{id:"shipping-two-items",name_ar:"شحن مجاني عند شراء قطعتين",name_en:"Free shipping for two items",condition_type:"any_quantity",minimum_quantity:2,action_type:"free_shipping",action_value:0,product_ids:[],category_slugs:[],is_active:true}];
    page.innerHTML = pageTitle("settings", "", `<button class="btn" type="button" data-open-brand-studio>${i("palette")}${ui("Open Brand Studio", "فتح استوديو الهوية")}</button>`);
    page.innerHTML += `
      <form class="card card-pad" id="settingsForm">
        <div class="studio-card-head"><span class="section-kicker">${ui("SYSTEM", "النظام")}</span><div><h2>${ui("Store operation", "تشغيل المتجر")}</h2><p>${ui("Domain and operational services live here. Brand details are managed in Brand Studio.", "الدومين وخدمات التشغيل موجودة هنا، وبيانات الهوية تُدار من استوديو الهوية.")}</p></div></div>
        <div class="form-grid">${field("website_domain", "websiteDomain", "text", settings.website_domain || "ecommerce.siteyfy.com")}</div>
        <div class="card soft-panel" style="margin-top:18px;">
          <div class="switch-row">
            <div>
              <strong>${t("shippingSystem")}</strong>
              <p class="muted small">${t("shippingSystemSub")}</p>
            </div>
            <input type="hidden" name="shipping_active" value="${settings.shipping_active === true ? "true" : "false"}" />
            ${switchButton({ field: "shipping_active", value: settings.shipping_active === true, id: "", label: true })}
          </div>
          <div class="form-grid" style="margin-top:14px;">
            ${field("default_shipping_cost", "defaultShipping", "number", settings.default_shipping_cost)}
            ${field("free_shipping_threshold", "freeShipping", "number", settings.free_shipping_threshold)}
          </div>
          <div class="shipping-rules-head"><div><span class="section-kicker">${ui("RULES", "القواعد")}</span><h3>${ui("Shipping rules", "قواعد الشحن")}</h3><p>${ui("Combine a condition with an outcome. The first matching active rule wins.", "اربط كل شرط بنتيجة واضحة. أول قاعدة نشطة متحققة تُطبق.")}</p></div><button class="btn" type="button" id="addShippingRule">${i("plus")}${ui("Add rule", "إضافة قاعدة")}</button></div>
          <div class="shipping-rules-list" id="shippingRulesList">${shippingRules.map(shippingRuleCard).join("")}</div>
        </div>
        <div class="toolbar" style="justify-content:flex-end;margin-top:18px;"><button class="btn primary">${t("save")}</button></div>
      </form>
      <div class="grid two-col" style="margin-top:16px;align-items:start;">
        <form class="card card-pad" id="robotsForm">
          <h2>${t("robotsTxt")}</h2>
          <p class="muted">${t("robotsTxtSub")}</p>
          <div class="field full" style="margin-top:14px;">
            <label>${t("robotsContent")}</label>
            <textarea name="content" class="code-textarea" required>${escapeHtml(robots.content || "")}</textarea>
          </div>
          <div class="toolbar" style="justify-content:space-between;margin-top:18px;">
            <span class="muted small">${t("updated")}: ${formatDateTime(robots.updated_at)}</span>
            <button class="btn primary">${t("save")}</button>
          </div>
        </form>
        <div class="card table-wrap">
          <div class="table-header">
            <h2>${t("robotsHistory")}</h2>
            <span class="pill">${(robots.history || []).length} ${t("savedVersions")}</span>
          </div>
          ${robotsHistoryTable(robots.history || [])}
        </div>
      </div>
    `;
    document.querySelectorAll("[data-form-switch]").forEach(btn => btn.onclick = () => updateFormSwitch(btn));
    document.querySelectorAll("[data-shipping-rule]").forEach(bindShippingRule);
    document.getElementById("addShippingRule").onclick=()=>{const list=document.getElementById("shippingRulesList");list.insertAdjacentHTML("beforeend",shippingRuleCard({},list.children.length));bindShippingRule(list.lastElementChild);};
    document.getElementById("settingsForm").onsubmit = async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget));
      const { website_domain, shipping_active, default_shipping_cost, free_shipping_threshold } = data;
      const free_shipping_rules=[...event.currentTarget.querySelectorAll("[data-shipping-rule]")].map(row=>{const values=namedValues(row);return {id:row.dataset.id,name_en:values.name_en,name_ar:values.name_ar,condition_type:values.condition_type,minimum_quantity:Number(values.minimum_quantity||2),minimum_subtotal:Number(values.minimum_subtotal||0),action_type:values.action_type||"free_shipping",action_value:Number(values.action_value||0),product_ids:readShippingTarget(row,"products"),category_slugs:readShippingTarget(row,"categories"),is_active:values.is_active==="true"};});
      await api("/api/admin/settings", { method: "PUT", body: JSON.stringify({
        website_domain,
        shipping_active: shipping_active === "true",
        default_shipping_cost: Number(default_shipping_cost || 0),
        free_shipping_threshold: Number(free_shipping_threshold || 0),
        free_shipping_rules
      }) });
      toast(t("saved"));
    };
    document.querySelector("[data-open-brand-studio]").onclick = () => { state.view="brandStudio";location.hash="brandStudio";render(); };
    document.getElementById("robotsForm").onsubmit = async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget));
      await api("/api/admin/robots", { method: "PUT", body: JSON.stringify({ content: data.content }) });
      toast(t("saved"));
      renderSettings(page);
    };
  }

  function robotsHistoryTable(history) {
    if (!history.length) {
      return `<div class="empty-state compact"><div><h2>${t("noRows")}</h2><p class="muted">${t("noRowsSub")}</p></div></div>`;
    }
    return `
      <div class="table-scroll"><table class="data-table">
        <thead><tr><th>${t("editedAt")}</th><th>${t("robotsContent")}</th></tr></thead>
        <tbody>
          ${history.map(item => `
            <tr>
              <td><strong>${formatDateTime(item.edited_at || item.created_at)}</strong></td>
              <td><pre class="robots-preview">${escapeHtml(item.content || "")}</pre></td>
            </tr>
          `).join("")}
        </tbody>
      </table></div>
    `;
  }

  function homeSlideCard(slide = {}, index = 0) {
    const id = slide.id || `slide-${Date.now()}-${index}`;
    return `<article class="builder-card" data-home-slide data-id="${escapeHtml(id)}"><div class="builder-card-head"><span class="drag-handle">${String(index + 1).padStart(2,"0")}</span><div><strong>${ui("Hero slide", "شريحة رئيسية")}</strong><small>${ui("Desktop and mobile artwork", "صور منفصلة للكمبيوتر والموبايل")}</small></div><div class="field compact-switch"><input type="hidden" name="is_active" value="${slide.is_active !== false}" />${switchButton({field:"is_active",value:slide.is_active !== false,label:false})}</div><button class="btn icon-btn danger" type="button" data-remove-slide title="${t("delete")}">${i("trash")}</button></div><div class="form-grid">${labeledField("title_en",ui("English title", "العنوان بالإنجليزية"),slide.title_en)}${labeledField("title_ar",ui("Arabic title", "العنوان بالعربية"),slide.title_ar)}${labeledField("subtitle_en",ui("English subtitle", "الوصف بالإنجليزية"),slide.subtitle_en)}${labeledField("subtitle_ar",ui("Arabic subtitle", "الوصف بالعربية"),slide.subtitle_ar)}${labeledField("cta_en",ui("English button", "الزر بالإنجليزية"),slide.cta_en)}${labeledField("cta_ar",ui("Arabic button", "الزر بالعربية"),slide.cta_ar)}${labeledField("link_url",ui("Destination", "الرابط"),slide.link_url,"text",{full:true})}</div><div class="builder-image-grid"><div><h4>${ui("Desktop artwork", "صورة الكمبيوتر")}</h4><p class="muted small">${ui("Wide artwork · shown in full", "صورة عريضة · تظهر كاملة دون قص")}</p>${imageUploadField("desktop_image_url","image",slide.desktop_image_url)}</div><div><h4>${ui("Mobile artwork", "صورة الموبايل")}</h4><p class="muted small">${ui("Independent mobile artwork · desktop fallback if empty", "صورة مستقلة للموبايل · صورة الكمبيوتر بديل عند تركها فارغة")}</p>${imageUploadField("mobile_image_url","image",slide.mobile_image_url)}</div></div></article>`;
  }

  function homeSectionCard(section = {}, index = 0) {
    const id=section.id || `section-${Date.now()}-${index}`;
    const collections = state.rows.collections || [];
    const collectionSource = section.source === "collection" || section.type === "collection";
    return `<article class="builder-card compact" data-home-section data-id="${escapeHtml(id)}"><div class="builder-card-head"><span class="drag-handle">${String(index + 1).padStart(2,"0")}</span><div><strong>${ui("Homepage section", "قسم في الرئيسية")}</strong><small>${ui("Ordered content block", "بلوك محتوى مرتب")}</small></div><div class="field compact-switch"><input type="hidden" name="is_active" value="${section.is_active !== false}" />${switchButton({field:"is_active",value:section.is_active !== false,label:false})}</div><button class="btn icon-btn danger" type="button" data-remove-section title="${t("delete")}">${i("trash")}</button></div><div class="form-grid"><div class="field"><label>${ui("Section type", "نوع القسم")}</label><select name="type" data-home-section-type><option value="products" ${section.type==="products"?"selected":""}>${ui("Products", "منتجات")}</option><option value="collection" ${section.type==="collection"?"selected":""}>${ui("Collection rail", "قسم مجموعة")}</option><option value="categories" ${section.type==="categories"?"selected":""}>${ui("Categories", "تصنيفات")}</option><option value="banner" ${section.type==="banner"?"selected":""}>${ui("Promotional banner", "بانر ترويجي")}</option><option value="newsletter" ${section.type==="newsletter"?"selected":""}>${ui("Newsletter", "النشرة البريدية")}</option></select></div><div class="field"><label>${ui("Content source", "مصدر المحتوى")}</label><select name="source" data-home-section-source><option value="latest" ${section.source==="latest"?"selected":""}>${ui("Latest products", "أحدث المنتجات")}</option><option value="sale" ${section.source==="sale"?"selected":""}>${ui("Sale products", "منتجات عليها خصم")}</option><option value="categories" ${section.source==="categories"?"selected":""}>${ui("Categories", "التصنيفات")}</option><option value="collection" ${collectionSource?"selected":""}>${ui("Collection", "مجموعة")}</option><option value="manual" ${section.source==="manual"?"selected":""}>${ui("Manual", "يدوي")}</option></select></div>${labeledField("title_en",ui("English title", "العنوان بالإنجليزية"),section.title_en)}${labeledField("title_ar",ui("Arabic title", "العنوان بالعربية"),section.title_ar)}${labeledField("order",ui("Display order", "ترتيب العرض"),section.order || index+1,"number",{min:1})}<div class="home-collection-settings full" data-home-collection-settings ${collectionSource?"":"hidden"}><div class="field"><label>${ui("Collection", "المجموعة")}</label><select name="collection_id"><option value="">${ui("Choose collection", "اختر مجموعة")}</option>${collections.map(collection=>`<option value="${escapeHtml(collection.id)}" ${String(section.collection_id||section.collectionId||"")===String(collection.id)?"selected":""}>${escapeHtml(collectionName(collection))}</option>`).join("")}</select></div><div class="field"><label>${ui("Display style", "شكل العرض")}</label><select name="display_style"><option value="slider" ${(section.display_style||"slider")==="slider"?"selected":""}>${ui("Slider rail", "سلايدر أفقي")}</option><option value="grid" ${section.display_style==="grid"?"selected":""}>${ui("Product grid", "شبكة منتجات")}</option></select></div><div class="field"><label>${ui("Item limit", "عدد العناصر")}</label><input name="limit" type="number" min="1" max="48" value="${Math.max(1,Number(section.limit||8))}" /></div><div class="field home-view-all-field"><label>${ui("View all link", "رابط مشاهدة الكل")}</label><input type="hidden" name="show_view_all" value="${section.show_view_all!==false}" />${switchButton({field:"show_view_all",value:section.show_view_all!==false,label:true})}</div></div><div class="full" data-home-banner-settings ${section.type==="banner"?"":"hidden"}>${labeledField("link_url",ui("Banner destination", "رابط البانر"),section.link_url)}<div class="builder-image-grid"><div><h4>${ui("Desktop artwork", "صورة الكمبيوتر")}</h4>${imageUploadField("desktop_image_url","image",section.desktop_image_url)}</div><div><h4>${ui("Mobile artwork", "صورة الموبايل")}</h4>${imageUploadField("mobile_image_url","image",section.mobile_image_url)}</div></div></div></div></article>`;
  }

  async function renderHomeSections(page) {
    const [data] = await Promise.all([api("/api/admin/home-builder"), loadCollections().catch(() => [])]);
    page.innerHTML = pageTitle("homeSections", "", `<button class="btn primary" type="submit" form="homeBuilderForm">${t("save")}</button>`);
    page.innerHTML += `<form id="homeBuilderForm" class="home-builder-workspace"><section class="builder-zone"><div class="builder-zone-head"><div><span class="section-kicker">01</span><h2>${ui("Hero slider", "السلايدر الرئيسي")}</h2><p>${ui("Build responsive campaign slides with independent mobile artwork.", "أنشئ شرائح متجاوبة بصورة مستقلة للموبايل.")}</p></div><button class="btn" type="button" id="addHomeSlide">${i("plus")}${ui("Add slide", "إضافة شريحة")}</button></div><div class="builder-list" id="homeSlides">${data.slides.length?data.slides.map(homeSlideCard).join(""):`<div class="builder-empty" data-slides-empty>${i("image")}<strong>${ui("No slides yet", "لا توجد شرائح بعد")}</strong><span>${ui("Add the first hero slide when its artwork is ready.", "أضف أول شريحة عندما تكون صورها جاهزة.")}</span></div>`}</div></section><section class="builder-zone"><div class="builder-zone-head"><div><span class="section-kicker">02</span><h2>${ui("Content sections", "أقسام المحتوى")}</h2><p>${ui("Define the sequence and source of every homepage block.", "حدد ترتيب ومصدر كل قسم في الصفحة الرئيسية.")}</p></div><button class="btn" type="button" id="addHomeSection">${i("plus")}${ui("Add section", "إضافة قسم")}</button></div><div class="builder-list two-up" id="homeSectionsList">${data.sections.map(homeSectionCard).join("")}</div></section></form>`;
    const form=document.getElementById("homeBuilderForm");
    const renumber=()=>{form.querySelectorAll("[data-home-slide] .drag-handle").forEach((el,index)=>el.textContent=String(index+1).padStart(2,"0"));form.querySelectorAll("[data-home-section] .drag-handle").forEach((el,index)=>el.textContent=String(index+1).padStart(2,"0"));};
    const syncCollectionSettings = card => { const source=card.querySelector("[data-home-section-source]"); const type=card.querySelector("[data-home-section-type]"); const enabled=source?.value==="collection"||type?.value==="collection"; card.querySelector("[data-home-collection-settings]").hidden=!enabled; card.querySelector("[data-home-banner-settings]").hidden=type?.value!=="banner"; if(type&&type.value==="collection"&&source)source.value="collection"; };
    const bind=()=>{bindImageUploadFields();form.querySelectorAll("[data-form-switch]").forEach(btn=>btn.onclick=()=>updateFormSwitch(btn));form.querySelectorAll("[data-remove-slide]").forEach(btn=>btn.onclick=()=>{btn.closest("[data-home-slide]").remove();renumber();});form.querySelectorAll("[data-remove-section]").forEach(btn=>btn.onclick=()=>{btn.closest("[data-home-section]").remove();renumber();});form.querySelectorAll("[data-home-section]").forEach(card=>{card.querySelectorAll("[data-home-section-source],[data-home-section-type]").forEach(select=>select.onchange=()=>syncCollectionSettings(card));syncCollectionSettings(card);});};
    document.getElementById("addHomeSlide").onclick=()=>{document.querySelector("[data-slides-empty]")?.remove();document.getElementById("homeSlides").insertAdjacentHTML("beforeend",homeSlideCard({},document.querySelectorAll("[data-home-slide]").length));bind();renumber();};
    document.getElementById("addHomeSection").onclick=()=>{document.getElementById("homeSectionsList").insertAdjacentHTML("beforeend",homeSectionCard({},document.querySelectorAll("[data-home-section]").length));bind();renumber();};
    bind();
    form.onsubmit=async event=>{event.preventDefault();const slides=[...form.querySelectorAll("[data-home-slide]")].map(row=>{const item=namedValues(row);return {...item,id:row.dataset.id,is_active:item.is_active==="true"};});const sections=[...form.querySelectorAll("[data-home-section]")].map((row,index)=>{const item=namedValues(row);return {...item,id:row.dataset.id,order:Number(item.order||index+1),limit:Number(item.limit||8),is_active:item.is_active==="true",show_view_all:item.show_view_all!=="false"};});await api("/api/admin/home-builder",{method:"PUT",body:JSON.stringify({slides,sections})});toast(t("saved"));renderHomeSections(page);};
  }

  async function renderGallery(page) {
    const data = await api("/api/admin/image-gallery");
    const images = data.images || [];
    page.innerHTML = pageTitle("imageGallery", "");
    page.innerHTML += `
      <form class="card card-pad" id="galleryUploadForm">
        <div class="table-header" style="padding:0;border:0;">
          <div>
            <h2>${t("uploadImages")}</h2>
            <p class="muted">${t("galleryNote")}</p>
          </div>
          <div class="toolbar">
            <button class="btn" type="button" id="syncGallery">${i("image")}${t("syncGallery")}</button>
            <button class="btn danger" type="button" id="deleteUnused">${i("trash")}${t("deleteUnused")}</button>
            <button class="btn primary" type="submit">${i("plus")}${t("uploadImages")}</button>
          </div>
        </div>
        <div class="field" style="margin-top:14px;">
          <label>${t("uploadImages")}</label>
          <input type="file" name="files" accept="image/*" multiple />
        </div>
      </form>
      <div class="card table-wrap" style="margin-top:16px;">
        <div class="table-header"><h2>${t("imageGallery")}</h2><span class="pill">${images.length} ${t("records")}</span></div>
        ${galleryTable(images)}
      </div>
    `;
    document.getElementById("galleryUploadForm").onsubmit = async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      await api("/api/admin/image-gallery/upload", { method: "POST", body: new FormData(form) });
      toast(t("created"));
      renderGallery(page);
    };
    document.getElementById("syncGallery").onclick = async () => {
      await api("/api/admin/image-gallery/sync", { method: "POST", body: JSON.stringify({}) });
      toast(t("updated"));
      renderGallery(page);
    };
    document.getElementById("deleteUnused").onclick = async () => {
      await api("/api/admin/image-gallery/unused", { method: "DELETE" });
      toast(t("deleted"));
      renderGallery(page);
    };
    document.querySelectorAll("[data-gallery-delete]").forEach(btn => {
      btn.onclick = async () => {
        try {
          await api(`/api/admin/image-gallery/${btn.dataset.galleryDelete}`, { method: "DELETE" });
          toast(t("deleted"));
          renderGallery(page);
        } catch (error) {
          toast(error.message, "error");
        }
      };
    });
    document.querySelectorAll("[data-gallery-copy]").forEach(btn => {
      btn.onclick = async () => {
        await navigator.clipboard.writeText(btn.dataset.galleryCopy);
        toast(t("saved"));
      };
    });
  }

  function galleryTable(images) {
    if (!images.length) return `<div class="empty-state compact"><div><div class="empty-illustration">${i("image")}</div><h2>${t("noRows")}</h2><p class="muted">${t("galleryNote")}</p></div></div>`;
    return `
      <div class="table-scroll"><table class="data-table">
        <thead><tr>
          <th>${t("image")}</th>
          <th>${t("folder")}</th>
          <th>${t("fileSize")}</th>
          <th>${t("usage")}</th>
          <th>${t("status")}</th>
          <th style="text-align:end">${t("actions")}</th>
        </tr></thead>
        <tbody>${images.map(image => `
          <tr>
            <td><img class="table-thumb" src="${escapeHtml(image.url)}" alt="" loading="lazy" /><div class="muted small">${escapeHtml(image.filename)}</div></td>
            <td>${escapeHtml(image.folder || "/")}</td>
            <td>${formatBytes(image.size)}</td>
            <td>${galleryUsageHtml(image.usage || [])}</td>
            <td><span class="status-pill ${image.is_orphan || image.is_linked_to_deleted ? "empty" : "good"}">${image.is_orphan ? t("unused") : image.is_linked_to_deleted ? t("deleted") : t("linked")}</span></td>
            <td style="text-align:end"><div class="row-actions">
              <button class="btn icon-btn" type="button" data-gallery-copy="${escapeHtml(image.url)}" title="${t("save")}">${i("file")}</button>
              <button class="btn icon-btn danger" type="button" data-gallery-delete="${escapeHtml(image.id)}" title="${t("delete")}">${i("trash")}</button>
            </div></td>
          </tr>
        `).join("")}</tbody>
      </table></div>
    `;
  }

  function galleryUsageHtml(usage) {
    if (!usage.length) return `<span class="muted">${t("unused")}</span>`;
    return usage.map(item => `<div class="pill" style="margin:2px;">${escapeHtml(item.entity)} #${escapeHtml(item.id)} - ${escapeHtml(item.label || "")}${item.is_deleted ? ` (${t("deleted")})` : ""}</div>`).join("");
  }

  function formatBytes(bytes) {
    const value = Number(bytes || 0);
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
  }

  async function renderLocations(page) {
    page.innerHTML = pageTitle("locations", "");
    page.innerHTML += `
      <div class="grid two-col">
        <div class="card table-wrap"><div class="table-header"><h2>${t("governorate")}</h2><span class="pill">0 ${t("records")}</span></div><div class="empty-state"><div><div class="empty-illustration">${i("map")}</div><h2>${t("noRows")}</h2><p class="muted">${t("noRowsSub")}</p></div></div></div>
        <div class="card table-wrap"><div class="table-header"><h2>${t("area")}</h2><span class="pill">0 ${t("records")}</span></div><div class="empty-state"><div><div class="empty-illustration">${i("map")}</div><h2>${t("noRows")}</h2><p class="muted">${t("noRowsSub")}</p></div></div></div>
      </div>
    `;
  }

  async function renderAiSetup(page) {
    const setup = await api("/api/admin/ai/setup");
    const openai = setup.providers.openai;
    const models = setup.models || [];
    page.innerHTML = pageTitle("aiSetup", "openaiSetupSub");
    page.innerHTML += `
      <form class="card card-pad" id="aiSetupForm">
        <div class="table-header" style="padding:0;border:0;margin-bottom:14px;">
          <div>
            <h2>${t("openaiSetup")}</h2>
            <p class="muted">${t("apiKeyHint")}</p>
          </div>
          <span class="status-pill ${openai.has_api_key ? "good" : "empty"}">${openai.has_api_key ? t("connected") : t("notConnected")}</span>
        </div>
        <div class="form-grid">
          ${field("api_key", "apiKey", "password", openai.api_key || "")}
          ${field("organization", "organization", "text", openai.organization || "")}
          ${field("project", "project", "text", openai.project || "")}
          <div class="field">
            <label>${t("providerStatus")}</label>
            <button type="button" class="toggle-control ${openai.enabled ? "is-on" : "is-off"}" data-form-switch="enabled" data-switch-value="${openai.enabled}" aria-checked="${openai.enabled}">
              <span class="toggle ${openai.enabled ? "on" : ""}"><span></span></span>
              <span class="toggle-label">${openai.enabled ? t("active") : t("inactive")}</span>
            </button>
            <input type="hidden" name="enabled" value="${openai.enabled}" />
          </div>
          ${selectField("default_text_model", "defaultTextModel", modelOptions(models, "text", openai.default_text_model))}
          ${selectField("default_image_model", "defaultImageModel", modelOptions(models, "image", openai.default_image_model))}
          ${selectField("default_video_model", "defaultVideoModel", modelOptions(models, "video", openai.default_video_model))}
        </div>
        <div class="toolbar" style="justify-content:space-between;margin-top:18px;">
          <span class="muted small">${t("lastSync")}: ${formatDateTime(openai.synced_at)}</span>
          <div class="toolbar">
            <button class="btn" type="button" id="syncOpenAi">${i("sparkles")}${t("syncModels")}</button>
            <button class="btn primary" type="submit">${t("save")}</button>
          </div>
        </div>
      </form>
    `;
    document.querySelectorAll("[data-form-switch]").forEach(btn => {
      btn.onclick = () => updateFormSwitch(btn);
    });
    document.getElementById("aiSetupForm").onsubmit = async (event) => {
      event.preventDefault();
      await saveAiSetup(setup, event.currentTarget);
      toast(t("saved"));
      renderAiSetup(page);
    };
    document.getElementById("syncOpenAi").onclick = async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      button.innerHTML = `${i("sparkles")}${t("syncingModels")}`;
      try {
        await saveAiSetup(setup, document.getElementById("aiSetupForm"));
        await api("/api/admin/ai/setup/openai/sync", { method: "POST", body: JSON.stringify({}) });
        toast(t("updated"));
        renderAiSetup(page);
      } catch (error) {
        toast(error.message, "error");
      } finally {
        button.disabled = false;
      }
    };
  }

  async function renderAiPricing(page) {
    const data = await api("/api/admin/ai/pricing");
    const pricing = data.pricing || [];
    page.innerHTML = pageTitle("aiPricing", "aiPricingSub", `<button class="btn primary" id="refreshOpenAiPricing">${i("sparkles")}${t("refreshPricing")}</button>`);
    page.innerHTML += `
      <form class="card table-wrap" id="aiPricingForm">
        <div class="table-header">
          <div>
            <h2>${t("modelPricing")}</h2>
            <p class="muted">${t("source")}: <a href="https://developers.openai.com/api/docs/pricing" target="_blank">OpenAI API pricing documentation</a></p>
          </div>
          <span class="pill">${pricing.length} ${t("records")}</span>
        </div>
        ${officialPricingTable(pricing)}
        <div class="toolbar" style="justify-content:flex-end;padding:14px 18px;"><button class="btn primary">${t("save")}</button></div>
      </form>
    `;
    document.querySelectorAll("[data-form-switch]").forEach(btn => {
      btn.onclick = () => updateFormSwitch(btn);
    });
    document.getElementById("aiPricingForm").onsubmit = async (event) => {
      event.preventDefault();
      await api("/api/admin/ai/pricing", { method: "PUT", body: JSON.stringify({ pricing: collectOfficialPricingRows() }) });
      toast(t("saved"));
      renderAiPricing(page);
    };
    document.getElementById("refreshOpenAiPricing").onclick = async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      button.innerHTML = `${i("sparkles")}${t("refreshingPricing")}`;
      try {
        await api("/api/admin/ai/pricing/refresh-openai", { method: "POST", body: JSON.stringify({}) });
        toast(t("updated"));
        renderAiPricing(page);
      } catch (error) {
        toast(error.message, "error");
      } finally {
        button.disabled = false;
      }
    };
  }

  async function renderAiSEO(page) {
    const data = await api("/api/admin/products");
    const products = normalizeRows(data, resources.products);
    page.innerHTML = pageTitle("aiSEO", "aiSEOSub");
    page.innerHTML += `
      <div class="grid two-col" style="align-items:start;">
        <form class="card card-pad" id="aiSeoForm">
          <h2>${t("aiSEO")}</h2>
          <div class="selected-product-box" id="selectedSeoProduct">
            <div class="muted">${t("selectedProduct")}</div>
            <strong>${t("noRows")}</strong>
            <input type="hidden" name="productId" required />
          </div>
          <div class="toolbar" style="justify-content:flex-end;margin-top:18px;">
            <button class="btn" type="button" id="openSeoProductPicker">${i("box")}${t("selectProduct")}</button>
            <button class="btn primary" type="submit">${i("sparkles")}${t("analyzeSeo")}</button>
          </div>
        </form>
        <div class="card card-pad" id="aiSeoSummary"><h2>${t("aiResult")}</h2><p class="muted">${t("aiSEOSub")}</p></div>
      </div>
      <div id="aiSeoResult" style="margin-top:16px;"></div>
    `;
    document.getElementById("openSeoProductPicker").onclick = () => openSeoProductPicker(products);
    document.getElementById("aiSeoForm").onsubmit = async (event) => {
      event.preventDefault();
      const productId = new FormData(event.currentTarget).get("productId");
      if (!productId) return toast(t("selectProduct"), "error");
      const btn = event.currentTarget.querySelector("button[type='submit']");
      btn.disabled = true;
      try {
        const data = await api("/api/admin/ai/seo/analyze", { method: "POST", body: JSON.stringify({ productId }) });
        document.getElementById("aiSeoSummary").innerHTML = `
          <h2>${t("aiResult")}</h2>
          <div class="seo-summary-score"><span>${Number(data.result.score || 0)}%</span><small>SEO score</small></div>
          <div class="switch-row"><span>${t("estimatedCost")}</span><strong>${Number(data.usage?.estimated_cost || 0).toFixed(6)} ${data.usage?.currency || "USD"}</strong></div>
        `;
        document.getElementById("aiSeoResult").innerHTML = aiSeoResultHtml(productId, data.result);
        bindAiSeoApplyActions(productId, data.result);
      } catch (error) {
        toast(error.message, "error");
      } finally {
        btn.disabled = false;
      }
    };
  }

  function openSeoProductPicker(products) {
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal-backdrop" id="productPickerModal">
        <div class="modal product-picker-modal">
          <div class="modal-head"><h2>${t("selectProduct")}</h2><button class="btn icon-btn" type="button" data-close-product-picker>×</button></div>
          <div class="modal-body">
            <div class="product-picker-grid">
              ${products.map(product => `
                <button class="product-picker-card" type="button" data-pick-product="${product.id}">
                  <img src="${escapeHtml(product.main_photo_url || product.image_url || "/uploads/catalog/gift.png")}" alt="" />
                  <span class="pill">${t("productCode")}: ${product.id}</span>
                  <strong>${escapeHtml(product.name_en || product.name_ar || `Product ${product.id}`)}</strong>
                  <small>${escapeHtml(product.name_ar || "")}</small>
                </button>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
    `);
    document.querySelectorAll("[data-close-product-picker]").forEach(btn => btn.onclick = () => document.getElementById("productPickerModal")?.remove());
    document.querySelectorAll("[data-pick-product]").forEach(btn => {
      btn.onclick = () => {
        const product = products.find(item => String(item.id) === btn.dataset.pickProduct);
        const box = document.getElementById("selectedSeoProduct");
        box.innerHTML = `
          <div class="muted">${t("selectedProduct")}</div>
          <div class="selected-product-row">
            <img src="${escapeHtml(product.main_photo_url || product.image_url || "/uploads/catalog/gift.png")}" alt="" />
            <div><strong>${escapeHtml(product.name_en || product.name_ar || `Product ${product.id}`)}</strong><div class="muted small">${t("productCode")}: ${product.id}</div></div>
          </div>
          <input type="hidden" name="productId" value="${product.id}" required />
        `;
        document.getElementById("productPickerModal")?.remove();
      };
    });
  }

  function aiSeoResultHtml(productId, result = {}) {
    const improved = result.improved || {};
    const indicators = seoIndicators(result, improved);
    const fields = [
      ["name_en", "nameEn", improved.name_en],
      ["name_ar", "nameAr", improved.name_ar],
      ["slug", "slug", improved.slug],
      ["short_description_en", "shortDescriptionEn", improved.short_description_en],
      ["short_description_ar", "shortDescriptionAr", improved.short_description_ar],
      ["description_en", "descriptionEn", improved.description_en],
      ["description_ar", "descriptionAr", improved.description_ar],
      ["meta_title_en", "titleEn", improved.meta_title_en],
      ["meta_title_ar", "titleAr", improved.meta_title_ar],
      ["meta_description_en", "descriptionEn", improved.meta_description_en],
      ["meta_description_ar", "descriptionAr", improved.meta_description_ar]
    ].filter(([, , value]) => value);
    return `
      <div class="card card-pad seo-review-panel" style="margin-bottom:16px;">
        <div class="table-header" style="padding:0;border:0;margin-bottom:14px;">
          <div><h2>${t("seoIndicators")}</h2><p class="muted">${t("aiSEOSub")}</p></div>
          <button class="btn primary" id="applySeoAll">${t("applyAll")}</button>
        </div>
        <div class="seo-chart-grid">
          ${indicators.map(item => `
            <div class="seo-meter">
              <div class="seo-meter-head"><strong>${t(item.label)}</strong><span>${item.value}%</span></div>
              <div class="seo-meter-track"><span style="width:${item.value}%"></span></div>
            </div>
          `).join("")}
        </div>
      </div>
      <div class="ai-seo-workspace">
        <div class="card card-pad seo-chat-panel">
          <h2>${t("missingSuggestions")}</h2>
          <div class="seo-chat-list">
            ${(result.issues || []).map(item => `<div class="seo-chat-item issue"><span>Issue</span><p>${escapeHtml(item)}</p></div>`).join("") || `<div class="seo-chat-item good"><span>${t("healthy")}</span><p>${t("healthy")}</p></div>`}
            ${(result.recommendations || []).map(item => `<div class="seo-chat-item recommendation"><span>Recommendation</span><p>${escapeHtml(item)}</p></div>`).join("")}
          </div>
        </div>
        <div class="card table-wrap seo-fields-panel">
          <div class="table-header"><h2>${t("suggestedProductData")}</h2><span class="pill">${fields.length} ${t("records")}</span></div>
          <div class="seo-field-list">
            ${fields.map(([field, labelKey, value]) => `
              <div class="seo-field-row">
                <div class="seo-field-label"><span>${t(labelKey)}</span><code>${field}</code></div>
                <div class="seo-field-value">${escapeHtml(value)}</div>
                <button class="btn" type="button" data-apply-seo-field="${field}">${t("applyField")}</button>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  function seoIndicators(result, improved) {
    const score = Math.max(0, Math.min(100, Number(result.score || 0)));
    const title = Math.min(100, Math.round(((improved.meta_title_en || improved.name_en || "").length ? 50 : 0) + ((improved.meta_title_ar || improved.name_ar || "").length ? 50 : 0)));
    const desc = Math.min(100, Math.round(((improved.meta_description_en || improved.short_description_en || "").length ? 50 : 0) + ((improved.meta_description_ar || improved.short_description_ar || "").length ? 50 : 0)));
    const bilingual = Math.min(100, Math.round((improved.name_en ? 25 : 0) + (improved.name_ar ? 25 : 0) + (improved.description_en ? 25 : 0) + (improved.description_ar ? 25 : 0)));
    const slug = improved.slug ? 100 : 35;
    return [
      { label: "seo", value: score },
      { label: "titleQuality", value: title },
      { label: "descriptionQuality", value: desc },
      { label: "bilingualQuality", value: bilingual },
      { label: "slugQuality", value: slug }
    ];
  }

  function bindAiSeoApplyActions(productId, result) {
    const improved = result.improved || {};
    document.getElementById("applySeoAll").onclick = async () => {
      await api("/api/admin/ai/seo/apply", { method: "POST", body: JSON.stringify({ productId, improved }) });
      toast(t("updated"));
    };
    document.querySelectorAll("[data-apply-seo-field]").forEach(btn => {
      btn.onclick = async () => {
        const field = btn.dataset.applySeoField;
        await api("/api/admin/ai/seo/apply", { method: "POST", body: JSON.stringify({ productId, improved: { [field]: improved[field] } }) });
        toast(t("updated"));
      };
    });
  }

  async function renderAiProducts(page) {
    const setup = await api("/api/admin/ai/setup");
    const textModels = (setup.models || []).filter(model => model.module === "text" && model.is_enabled !== false);
    page.innerHTML = pageTitle("aiProducts", "aiProductsSub");
    page.innerHTML += `
      <div class="grid two-col" style="align-items:start;">
        <form class="card card-pad" id="aiProductForm">
          <h2>${t("uploadProductImage")}</h2>
          <p class="muted">${t("aiProductsSub")}</p>
          <div class="form-grid single" style="margin-top:14px;">
            <div class="field">
              <label>${t("uploadProductImage")}</label>
              <input name="image" type="file" accept="image/*" required />
            </div>
            ${selectField("model", "defaultTextModel", modelOptions(textModels, "text", setup.providers.openai.default_text_model))}
          </div>
          <div class="toolbar" style="justify-content:flex-end;margin-top:18px;">
            <button class="btn primary" type="submit">${i("sparkles")}${t("analyzeImage")}</button>
          </div>
        </form>
        <div class="card card-pad" id="aiProductSummary">
          <h2>${t("aiResult")}</h2>
          <p class="muted">${t("noAuditYetSub")}</p>
        </div>
      </div>
      <div id="aiProductResult" style="margin-top:16px;"></div>
    `;
    document.getElementById("aiProductForm").onsubmit = async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = form.querySelector("button[type='submit']");
      button.disabled = true;
      button.innerHTML = `${i("sparkles")}${t("analyzingImage")}`;
      try {
        const result = await api("/api/admin/ai/products/analyze", { method: "POST", body: new FormData(form) });
        document.getElementById("aiProductSummary").innerHTML = `
          <h2>${t("aiResult")}</h2>
          <div class="switch-row"><span>${t("estimatedCost")}</span><strong>${Number(result.usage?.estimated_cost || 0).toFixed(6)} ${result.usage?.currency || "USD"}</strong></div>
          <div class="switch-row"><span>Model</span><strong>${escapeHtml(result.usage?.model || form.model.value)}</strong></div>
        `;
        document.getElementById("aiProductResult").innerHTML = aiProductResultHtml(result.result);
        bindAiResultActions(document.getElementById("aiProductResult"), result.result);
        toast(t("updated"));
      } catch (error) {
        toast(error.message, "error");
      } finally {
        button.disabled = false;
        button.innerHTML = `${i("sparkles")}${t("analyzeImage")}`;
      }
    };
  }

  function aiProductResultHtml(result = {}) {
    const product = result.product || {};
    const suggestions = result.suggestions || {};
    return `
      <div class="grid two-col" style="align-items:start;">
        <div class="card card-pad">
          <h2>${t("suggestedProductData")}</h2>
          ${result.image_url ? `<img class="ai-preview-image" src="${escapeHtml(result.image_url)}" alt="" />` : ""}
          <div class="form-grid">
            ${readonlyAiField("nameEn", product.name_en)}
            ${readonlyAiField("nameAr", product.name_ar)}
            ${readonlyAiField("shortDescriptionEn", product.short_description_en)}
            ${readonlyAiField("shortDescriptionAr", product.short_description_ar)}
            ${readonlyAiField("categories", `${product.category_name_en || ""} / ${product.category_name_ar || ""}`)}
            ${readonlyAiField("brands", `${product.brand_name_en || ""} / ${product.brand_name_ar || ""}`)}
            ${readonlyAiField("colors", (product.colors || []).map(color => color.name_en || color.name_ar || color.hex).join(", "))}
            ${readonlyAiField("options", (product.options || []).map(option => `${option.name_en || option.name_ar}: ${option.value_en || option.value_ar || ""}`).join(", "))}
          </div>
        </div>
        <div class="card card-pad">
          <h2>${t("missingSuggestions")}</h2>
          ${suggestionBlock("categories", suggestions.create_categories)}
          ${suggestionBlock("brands", suggestions.create_brands)}
          ${suggestionBlock("colors", suggestions.create_colors)}
          ${suggestionBlock("options", suggestions.create_options)}
          <h2 style="margin-top:18px;">${t("generatedImageSlots")}</h2>
          ${(result.generated_image_slots || []).map(slot => {
            const encoded = encodeURIComponent(JSON.stringify(slot));
            return `<div class="switch-row"><div><strong>${escapeHtml(slot.type)}</strong><div class="muted small">${escapeHtml(slot.prompt || "")}</div></div><button class="btn" type="button" data-generate-slot data-slot-payload="${encoded}">${t("generateImage")}</button></div>`;
          }).join("") || `<p class="muted">${t("noRows")}</p>`}
        </div>
      </div>
    `;
  }

  function readonlyAiField(labelKey, value) {
    return `<div class="field"><label>${t(labelKey)}</label><input value="${escapeHtml(value || "-")}" readonly /></div>`;
  }

  function suggestionBlock(labelKey, rows = []) {
    if (!rows?.length) return `<div class="switch-row"><span>${t(labelKey)}</span><span class="status-pill good">${t("healthy")}</span></div>`;
    return `
      <div class="switch-row" style="align-items:flex-start;">
        <strong>${t(labelKey)}</strong>
        <div>${rows.map(row => {
          const type = labelKey.replace(/s$/, "");
          const encoded = encodeURIComponent(JSON.stringify(row));
          return `<button class="btn" style="margin:2px;" type="button" data-create-suggestion="${escapeHtml(type)}" data-payload="${encoded}">${escapeHtml(row.name_en || row.name_ar || row.hex || row.slug || "")} - ${t("approveCreate")}</button>`;
        }).join("")}</div>
      </div>
    `;
  }

  async function renderAiLogs(page) {
    const data = await api("/api/admin/ai/usage");
    const logs = data.logs || [];
    page.innerHTML = pageTitle("aiLogs", "aiLogsSub");
    page.innerHTML += `
      <div class="grid kpi-grid">
        ${kpi("records", logs.length, "healthy", "file")}
        ${kpi("totalEstimatedCost", `${Number(data.total_estimated_cost || 0).toFixed(6)} ${data.currency || "USD"}`, "healthy", "tag")}
      </div>
      <div class="card table-wrap" style="margin-top:16px;">
        <div class="table-header"><h2>${t("aiLogs")}</h2><span class="pill">${logs.length} ${t("records")}</span></div>
        ${aiLogsTable(logs)}
      </div>
    `;
  }

  function aiLogsTable(logs) {
    if (!logs.length) return `<div class="empty-state compact"><div><h2>${t("noRows")}</h2><p class="muted">${t("aiLogsSub")}</p></div></div>`;
    return `
      <div class="table-scroll"><table class="data-table">
        <thead><tr><th>${t("created")}</th><th>${t("action")}</th><th>Model</th><th>${t("status")}</th><th>${t("tokens")}</th><th>${t("estimatedCost")}</th></tr></thead>
        <tbody>${logs.map(log => `
          <tr>
            <td>${formatDateTime(log.created_at)}</td>
            <td><strong>${escapeHtml(log.action || "")}</strong></td>
            <td>${escapeHtml(log.model || "-")}</td>
            <td><span class="status-pill ${log.status === "completed" ? "good" : "empty"}">${escapeHtml(log.status || "-")}</span></td>
            <td>${Number(log.input_tokens || 0)} / ${Number(log.output_tokens || 0)}</td>
            <td>${Number(log.estimated_cost || 0).toFixed(6)} ${log.currency || "USD"}</td>
          </tr>
        `).join("")}</tbody>
      </table></div>
    `;
  }

  function modelOptions(models, module, selected) {
    const filtered = models.filter(model => model.module === module);
    const ids = Array.from(new Set([selected, ...filtered.map(model => model.id)].filter(Boolean)));
    return ids.map(id => `<option value="${escapeHtml(id)}" ${id === selected ? "selected" : ""}>${escapeHtml(id)}</option>`).join("");
  }

  function selectField(name, labelKey, options) {
    return `<div class="field"><label>${t(labelKey)}</label><select name="${name}">${options}</select></div>`;
  }

  function officialPricingTable(pricing) {
    if (!pricing.length) return `<div class="empty-state compact"><div><h2>${t("noRows")}</h2><p class="muted">${t("aiPricingSub")}</p></div></div>`;
    return `
      <div class="table-scroll"><table class="data-table ai-pricing-table">
        <thead><tr>
          <th>Model</th>
          <th>${t("module")}</th>
          <th>${t("tier")}</th>
          <th>${t("modality")}</th>
          <th>${t("billingUnit")}</th>
          <th>${t("inputPer1m")}</th>
          <th>${t("cachedInputPer1m")}</th>
          <th>Cache write / 1M</th>
          <th>${t("outputPer1m")}</th>
          <th>${t("priceSecond")}</th>
          <th>${t("priceMinute")}</th>
          <th>${t("unitNote")}</th>
          <th>${t("status")}</th>
        </tr></thead>
        <tbody>
          ${pricing.map((row, index) => `
            <tr data-model-row="${index}">
              <td><strong>${escapeHtml(row.model)}</strong><input type="hidden" name="pricing_key" value="${escapeHtml(row.pricing_key || "")}" /><input type="hidden" name="model" value="${escapeHtml(row.model)}" /><input type="hidden" name="provider" value="${escapeHtml(row.provider || "openai")}" /><input type="hidden" name="section" value="${escapeHtml(row.section || "")}" /><input type="hidden" name="source_url" value="${escapeHtml(row.source_url || "")}" /><input type="hidden" name="fetched_at" value="${escapeHtml(row.fetched_at || "")}" /></td>
              <td><select name="module">${["text", "image", "video", "audio", "embeddings", "moderation", "search", "finetuning"].map(module => `<option value="${module}" ${row.module === module ? "selected" : ""}>${module}</option>`).join("")}</select></td>
              <td><input type="text" name="tier" value="${escapeHtml(row.tier || "")}" /></td>
              <td><input type="text" name="modality" value="${escapeHtml(row.modality || "")}" /></td>
              <td><input type="text" name="billing_unit" value="${escapeHtml(row.billing_unit || "1M tokens")}" /></td>
              <td><input type="number" min="0" step="0.0001" name="input_per_1m" value="${Number(row.input_per_1m || 0)}" /></td>
              <td><input type="number" min="0" step="0.0001" name="cached_input_per_1m" value="${Number(row.cached_input_per_1m || 0)}" /></td>
              <td><input type="number" min="0" step="0.0001" name="cache_write_per_1m" value="${Number(row.cache_write_per_1m || 0)}" /></td>
              <td><input type="number" min="0" step="0.0001" name="output_per_1m" value="${Number(row.output_per_1m || 0)}" /></td>
              <td><input type="number" min="0" step="0.0001" name="price_per_second" value="${Number(row.price_per_second || 0)}" /></td>
              <td><input type="number" min="0" step="0.0001" name="price_per_minute" value="${Number(row.price_per_minute || 0)}" /></td>
              <td><input type="text" name="unit_note" value="${escapeHtml(row.unit_note || "")}" /></td>
              <td>
                <button type="button" class="toggle-control ${row.is_enabled ? "is-on" : "is-off"}" data-form-switch="is_enabled" data-switch-value="${row.is_enabled}" aria-checked="${row.is_enabled}">
                  <span class="toggle ${row.is_enabled ? "on" : ""}"><span></span></span>
                  <span class="toggle-label">${row.is_enabled ? t("active") : t("inactive")}</span>
                </button>
                <input type="hidden" name="is_enabled" value="${row.is_enabled}" />
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table></div>
    `;
  }

  function collectOfficialPricingRows() {
    return Array.from(document.querySelectorAll("[data-model-row]")).map(row => {
      const get = (name) => row.querySelector(`[name="${name}"]`)?.value || "";
      return {
        provider: get("provider") || "openai",
        pricing_key: get("pricing_key"),
        model: get("model"),
        module: get("module"),
        section: get("section"),
        tier: get("tier"),
        modality: get("modality"),
        billing_unit: get("billing_unit"),
        source_url: get("source_url"),
        fetched_at: get("fetched_at"),
        input_per_1m: Number(get("input_per_1m") || 0),
        cached_input_per_1m: Number(get("cached_input_per_1m") || 0),
        cache_write_per_1m: Number(get("cache_write_per_1m") || 0),
        output_per_1m: Number(get("output_per_1m") || 0),
        price_per_second: Number(get("price_per_second") || 0),
        price_per_minute: Number(get("price_per_minute") || 0),
        unit_note: get("unit_note"),
        is_enabled: get("is_enabled") === "true"
      };
    });
  }

  async function saveAiSetup(currentSetup, setupForm, pricingRows = null) {
    const data = Object.fromEntries(new FormData(setupForm));
    const currentOpenai = currentSetup.providers.openai;
    const models = pricingRows || currentSetup.models || [];
    return api("/api/admin/ai/setup", {
      method: "PUT",
      body: JSON.stringify({
        providers: {
          openai: {
            enabled: data.enabled === "true",
            api_key: data.api_key,
            organization: data.organization,
            project: data.project,
            default_text_model: data.default_text_model || currentOpenai.default_text_model,
            default_image_model: data.default_image_model || currentOpenai.default_image_model,
            default_video_model: data.default_video_model || currentOpenai.default_video_model
          }
        },
        models
      })
    });
  }

  async function renderLighthouse(page) {
    page.innerHTML = pageTitle("lighthouse", "lighthouseSub", `<button class="btn primary" id="runAuditBtn">${i("dashboard")}${t("runAudit")}</button>`);
    page.innerHTML += `
      <div class="grid two-col">
        <div class="card card-pad">
          <h2>${t("auditTargets")}</h2>
          <p class="muted">${t("lighthouseSub")}</p>
          <div id="auditPicker" class="audit-picker"></div>
        </div>
        <div class="card card-pad">
          <h2>${t("storeHealth")}</h2>
          <div class="audit-score-strip">
            ${auditScore("performance", null)}
            ${auditScore("seo", null)}
            ${auditScore("accessibility", null)}
            ${auditScore("bestPractices", null)}
          </div>
        </div>
      </div>
      <div class="card table-wrap" style="margin-top:16px;">
        <div class="table-header"><h2>${t("lighthouse")}</h2><span class="pill" id="auditTime">${t("noAuditYet")}</span></div>
        <div id="auditResults"><div class="empty-state"><div><div class="empty-illustration">${i("dashboard")}</div><h2>${t("noAuditYet")}</h2><p class="muted">${t("noAuditYetSub")}</p></div></div></div>
      </div>
    `;
    try {
      const data = await api("/api/admin/lighthouse/targets?productLimit=3");
      const targetMap = Object.fromEntries(data.targets.map(target => [target.mode, target.url]));
      const firstProduct = data.products[0] || null;
      document.getElementById("auditPicker").innerHTML = `
        <div class="form-grid single">
          <label>
            <span>${t("auditTargetType")}</span>
            <select id="auditMode">
              <option value="homepage">${t("homepage")}</option>
              <option value="products">${t("productsListing")}</option>
              <option value="product">${t("productPage")}</option>
              <option value="custom">${t("customUrl")}</option>
            </select>
          </label>
          <label id="productSelectWrap" hidden>
            <span>${t("selectProduct")}</span>
            <select id="auditProduct">
              ${data.products.map(product => `<option value="${product.id}" data-url="${escapeHtml(product.url)}">${escapeHtml(state.lang === "ar" ? product.label_ar : product.label)}</option>`).join("")}
            </select>
          </label>
          <label id="customUrlWrap" hidden>
            <span>${t("customUrl")}</span>
            <input id="auditCustomUrl" type="text" placeholder="${t("customUrlPlaceholder")}" />
          </label>
        </div>
        <div class="audit-target selected">
          <div>
            <strong>${t("selectedUrl")}</strong>
            <span id="selectedAuditUrl">${targetMap.homepage || ""}</span>
          </div>
          <a class="icon-btn" id="openSelectedAuditUrl" href="${targetMap.homepage || "#"}" target="_blank" title="${t("openPage")}">${i("file")}</a>
        </div>
      `;
      const modeEl = document.getElementById("auditMode");
      const productEl = document.getElementById("auditProduct");
      const customEl = document.getElementById("auditCustomUrl");
      const productWrap = document.getElementById("productSelectWrap");
      const customWrap = document.getElementById("customUrlWrap");
      const selectedEl = document.getElementById("selectedAuditUrl");
      const openEl = document.getElementById("openSelectedAuditUrl");
      const updateSelected = () => {
        const mode = modeEl.value;
        productWrap.hidden = mode !== "product";
        customWrap.hidden = mode !== "custom";
        const selectedProduct = data.products.find(product => String(product.id) === String(productEl?.value)) || firstProduct;
        const url = mode === "product"
          ? selectedProduct?.url || ""
          : mode === "custom"
            ? customEl.value.trim()
            : targetMap[mode] || "";
        selectedEl.textContent = url || "-";
        openEl.href = url || "#";
      };
      modeEl.onchange = updateSelected;
      if (productEl) productEl.onchange = updateSelected;
      customEl.oninput = updateSelected;
      updateSelected();
      document.getElementById("runAuditBtn").onclick = () => runLighthouseAudit({
        mode: modeEl.value,
        productId: productEl?.value,
        url: customEl.value.trim()
      });
    } catch (error) {
      document.getElementById("auditPicker").innerHTML = `<p class="muted">${error.message}</p>`;
    }
  }

  function auditScore(labelKey, score) {
    const display = score === null || score === undefined ? "-" : score;
    const scoreClass = score === null || score === undefined ? "unknown" : score >= 90 ? "good" : score >= 50 ? "warn" : "bad";
    return `<div class="audit-score ${scoreClass}"><strong>${display}</strong><span>${t(labelKey)}</span></div>`;
  }

  async function runLighthouseAudit(targetConfig = { mode: "homepage" }) {
    const btn = document.getElementById("runAuditBtn");
    const resultsEl = document.getElementById("auditResults");
    const previous = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span>${t("runningAudit")}...`;
    btn.disabled = true;
    resultsEl.innerHTML = `
      <div class="audit-loading">
        <span class="spinner large"></span>
        <h2>${t("runningAudit")}...</h2>
        <p class="muted">${t("auditLoadingSub")}</p>
      </div>
    `;
    try {
      const data = await api("/api/admin/lighthouse/run", {
        method: "POST",
        body: JSON.stringify(targetConfig)
      });
      document.getElementById("auditTime").textContent = `${t("generatedAt")}: ${new Date(data.generated_at).toLocaleString()}`;
      const averages = ["performance", "seo", "accessibility", "best_practices"].reduce((acc, key) => {
        const values = data.results.map(result => result.scores[key]).filter(value => typeof value === "number");
        acc[key] = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
        return acc;
      }, {});
      document.querySelector(".audit-score-strip").innerHTML = `
        ${auditScore("performance", averages.performance)}
        ${auditScore("seo", averages.seo)}
        ${auditScore("accessibility", averages.accessibility)}
        ${auditScore("bestPractices", averages.best_practices)}
      `;
      resultsEl.innerHTML = lighthouseTable(data.results);
      toast(t("saved"));
    } catch (error) {
      resultsEl.innerHTML = `<div class="empty-state"><div><div class="empty-illustration">${i("file")}</div><h2>${error.message}</h2></div></div>`;
      toast(error.message, "error");
    } finally {
      btn.innerHTML = previous;
      btn.disabled = false;
    }
  }

  function lighthouseTable(results) {
    return `
      <div class="table-scroll"><table class="data-table">
        <thead><tr>
          <th>${t("page")}</th>
          <th>${t("performance")}</th>
          <th>${t("seo")}</th>
          <th>${t("accessibility")}</th>
          <th>${t("bestPractices")}</th>
          <th>FCP</th>
          <th>LCP</th>
          <th>CLS</th>
          <th style="text-align:end">${t("report")}</th>
        </tr></thead>
        <tbody>
          ${results.map(result => `
            <tr>
              <td><strong>${state.lang === "ar" ? result.label_ar : result.label}</strong><div class="muted small">${result.url}</div></td>
              <td>${scorePill(result.scores.performance)}</td>
              <td>${scorePill(result.scores.seo)}</td>
              <td>${scorePill(result.scores.accessibility)}</td>
              <td>${scorePill(result.scores.best_practices)}</td>
              <td>${result.metrics.first_contentful_paint || "-"}</td>
              <td>${result.metrics.largest_contentful_paint || "-"}</td>
              <td>${result.metrics.cumulative_layout_shift || "-"}</td>
              <td style="text-align:end"><a class="btn" href="${result.report_url}" target="_blank">${i("file")}${t("viewReport")}</a></td>
            </tr>
          `).join("")}
        </tbody>
      </table></div>
    `;
  }

  function scorePill(score) {
    const cls = score >= 90 ? "good" : score >= 50 ? "warn" : "bad";
    return `<span class="score-pill ${cls}">${score ?? "-"}</span>`;
  }

  window.addEventListener("hashchange", () => {
    const route = adminRoute();
    state.view = route.view;
    state.reportId = route.id;
    state.openNavGroup = navGroupForView(route.view);
    localStorage.setItem(STORAGE_NAV_GROUP, state.openNavGroup);
    render();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeTopDialog();
  });

  render();
})();
