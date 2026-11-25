/*
 * Labels.
 *
 * cure-plus-fe reads its labels from the database through LabelsProvider. The
 * ticketing app has no labels table yet, so the dictionary lives here with the
 * same `useLabels()` shape: when the table is added, only this file changes.
 * 1 = English, 2 = Arabic (EXSYS08 ids), same as `planguageid` on every service.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMakeSelectCurrentLanguageId } from "../store";
import { getRequest } from "../api";

const LABELS: { [key: string]: [string, string] } = {
  appName: ["EXSYS Ticketing System", "نظام تيكتات اكسس"],
  // login
  userName: ["User name", "اسم المستخدم"],
  password: ["Password", "كلمة المرور"],
  login: ["Sign in", "دخول"],
  logout: ["Sign out", "خروج"],
  oldPassword: ["Current password", "كلمة المرور الحالية"],
  newPassword: ["New password", "كلمة المرور الجديدة"],
  confirmPassword: ["Confirm new password", "تأكيد كلمة المرور الجديدة"],
  changePassword: ["Change password", "تغيير كلمة المرور"],
  mustChangePassword: [
    "You must change your password before using the system.",
    "يجب تغيير كلمة المرور قبل استخدام النظام.",
  ],
  passwordsDoNotMatch: ["The two passwords differ.", "كلمتا المرور غير متطابقتين."],
  passwordTooShort: [
    "The password must be at least 8 characters.",
    "كلمة المرور 8 حروف على الأقل.",
  ],
  // login page and app shell (23-11-2026, new Cure+ look)
  welcomeBack: ["Welcome back", "مرحباً بعودتك"],
  signInToContinue: ["Please sign in to continue.", "سجّل الدخول للمتابعة."],
  heroTitle1: ["EXSYS Support", "دعم اكسس"],
  heroTitle2: ["Ticketing System", "نظام التيكتات"],
  heroText: [
    "One place for client requests, internal tasks and follow-up, with clear response times for every ticket.",
    "مكان واحد لطلبات العملاء والمهام الداخلية ومتابعتها، بمواعيد استجابة واضحة لكل تيكت.",
  ],
  featSupport: ["Client support", "دعم العملاء"],
  featSla: ["SLA follow-up", "متابعة الـ SLA"],
  featAi: ["AI assistant", "مساعد ذكي"],
  featSecure: ["Secure access", "دخول آمن"],
  rightsReserved: [
    "All rights reserved © Exsys Solutions",
    "جميع الحقوق محفوظة © Exsys Solutions",
  ],
  managementRole: ["Management", "الإدارة"],
  // 23-11-2026 (script ETKT_12): company board, internal task, codes shown as words
  companyScope: ["Company", "الشركة"],
  allTeams: ["All teams", "كل الفرق"],
  topClients: ["Clients with the most tickets", "العملاء الأكثر تيكتات"],
  newTask: ["New internal task", "تاسك داخلي جديد"],
  taskCreated: ["The task was created.", "تم إنشاء التاسك."],
  dueDate: ["Due date", "تاريخ الاستحقاق"],
  date: ["Date", "التاريخ"],
  clientReply: ["Reply", "رد"],
  actAccept: ["Accepted", "تم الاستلام"],
  actStatus: ["Status changed", "تغيير الحالة"],
  actTransfer: ["Transferred", "تحويل"],
  actAssign: ["Assigned", "توزيع"],
  actMerge: ["Merged", "دمج"],
  actPriority: ["Priority changed", "تغيير الأولوية"],
  actEscalate: ["Escalated", "تصعيد"],
  actCost: ["Cost changed", "تغيير التكلفة"],
  actProblem: ["Linked to a problem", "ربط بمشكلة"],
  autoEscalation: ["Automatic escalation", "تصعيد تلقائي"],
  systemActor: ["System", "النظام"],
  ntNew: ["New ticket", "تيكت جديد"],
  ntEscalate: ["Escalation", "تصعيد"],
  ntAssign: ["Assigned to you", "مسند إليك"],
  ntTransfer: ["Transfer", "تحويل"],
  ntReply: ["Reply", "رد"],
  ntReject: ["Solution refused", "رفض الحل"],
  ntContract: ["Contract", "العقد"],
  ntContractWarn: ["Contract ending", "العقد قارب على الانتهاء"],
  ntContractStop: ["Support stopped", "وقف الدعم"],
  ntUserRequest: ["User request", "طلب مستخدم"],
  ntUserRequestOk: ["Request approved", "تمت الموافقة على الطلب"],
  ntUserRequestNo: ["Request refused", "تم رفض الطلب"],
  inputText: ["Text", "نص"],
  inputList: ["List", "قائمة"],
  hintTransitions: ["A status with no way out would leave its tickets stuck, so its last move cannot be removed.", "الحالة التي ليس لها مخرج ستُعلّق تيكتاتها، لذلك لا يمكن حذف آخر انتقال منها."],
  hintSettings: ["The packages read these values while they run; each value is checked before it is saved.", "تقرأ الباكدجات هذه القيم أثناء التشغيل، وتُراجَع كل قيمة قبل الحفظ."],
  hintModules: ["The module id is the same as in the EXSYS menu (EX_PAGE_MASTER).", "رقم الموديول هو نفسه الموجود في قائمة اكسس (EX_PAGE_MASTER)."],
  hintBranchTypes: ["The weight divides the number of tickets in every comparison between clients.", "يُقسَم عدد التيكتات على الوزن في كل مقارنة بين العملاء."],
  hintAiModels: ["Each purpose has one default model only.", "لكل غرض موديل افتراضي واحد فقط."],
  internalSla: ["Internal SLA", "الـ SLA الداخلي"],
  escMode: ["Escalation mode", "طريقة التصعيد"],
  escModeFixed: ["Fixed minutes", "دقائق ثابتة"],
  escModePct: ["Share of the SLA", "نسبة من الـ SLA"],
  // navigation
  home: ["Home", "الرئيسية"],
  tickets: ["Tickets", "التيكتات"],
  escalation: ["Escalation", "التصعيد"],
  notifications: ["Notifications", "التنبيهات"],
  clients: ["Clients", "العملاء"],
  newTicket: ["New ticket", "تيكت جديد"],
  myTickets: ["My tickets", "تيكتاتي"],
  // ticket fields
  ticketNo: ["Ticket", "رقم التيكت"],
  title: ["Title", "العنوان"],
  description: ["Description", "الوصف"],
  expectedResult: ["Expected result", "النتيجة المتوقعة"],
  actualResult: ["Actual result", "النتيجة الفعلية"],
  type: ["Type", "النوع"],
  module: ["Module", "الموديول"],
  client: ["Client", "العميل"],
  branch: ["Branch", "الفرع"],
  priority: ["Priority", "الأولوية"],
  clientPriority: ["Client priority", "أولوية العميل"],
  companyPriority: ["Company priority", "أولوية الشركة"],
  status: ["Status", "الحالة"],
  team: ["Team", "الفريق"],
  assignee: ["Assignee", "الموظف"],
  createdBy: ["Opened by", "فتحه"],
  submittedDate: ["Opened", "تاريخ الفتح"],
  acceptDue: ["Accept due", "موعد الاستلام"],
  resolveDue: ["Resolve due", "موعد الحل"],
  rootCause: ["Root cause", "السبب الجذري"],
  resolutionNote: ["Resolution", "وصف الحل"],
  blockReason: ["Blocking reason", "سبب التوقف"],
  cancelReason: ["Cancel reason", "سبب الإلغاء"],
  rating: ["Rating", "التقييم"],
  clientComment: ["Your comment", "تعليقك"],
  exsysContext: ["EXSYS context", "سياق اكسس"],
  page: ["Screen", "الشاشة"],
  exsysUser: ["EXSYS user", "مستخدم اكسس"],
  errorMessage: ["Error message", "رسالة الخطأ"],
  // actions
  accept: ["Accept", "استلام"],
  changeStatus: ["Change status", "تغيير الحالة"],
  transfer: ["Transfer", "تحويل"],
  assign: ["Assign", "توزيع"],
  merge: ["Merge", "دمج"],
  setPriority: ["Company priority", "أولوية الشركة"],
  reply: ["Reply to client", "رد للعميل"],
  internalNote: ["Internal note", "ملاحظة داخلية"],
  send: ["Send", "إرسال"],
  save: ["Save", "حفظ"],
  cancel: ["Cancel", "إلغاء"],
  search: ["Search", "بحث"],
  refresh: ["Refresh", "تحديث"],
  cannedReply: ["Canned reply", "رد جاهز"],
  mergeInto: ["Merge into ticket", "دمج في تيكت رقم"],
  notes: ["Notes", "ملاحظات"],
  conversation: ["Conversation", "المحادثة"],
  history: ["History", "السجل"],
  attachments: ["Attachments", "المرفقات"],
  properties: ["Properties", "الخصائص"],
  // views
  viewAll: ["All", "الكل"],
  viewOpen: ["Open", "المفتوحة"],
  viewClosed: ["Closed", "المغلقة"],
  viewMine: ["Mine", "تيكتاتي"],
  viewUnaccepted: ["Not accepted", "لم تُستلم"],
  viewBreach: ["SLA breached", "تجاوزت الـ SLA"],
  viewAngry: ["Angry clients", "عملاء غاضبون"],
  viewNeedAssign: ["Needs assigning", "تنتظر التوزيع"],
  // misc
  minutesLeft: ["Minutes left", "الدقائق الباقية"],
  escLevel: ["Escalation level", "مستوى التصعيد"],
  oncall: ["On call", "المناوب"],
  markAllRead: ["Mark all as read", "تعليم الكل كمقروء"],
  unread: ["Unread", "غير مقروء"],
  noData: ["Nothing to show", "لا توجد بيانات"],
  saved: ["Saved", "تم الحفظ"],
  loading: ["Loading...", "جاري التحميل..."],
  sessionExpired: ["Your session has ended. Sign in again.", "انتهت الجلسة. سجّل الدخول من جديد."],
  contractExpired: ["Support contract expired", "عقد الدعم منتهي"],
  sla: ["SLA", "الـ SLA"],
  slaLate: ["Late", "متأخر"],
  slaNear: ["Due soon", "قرب الموعد"],
  slaOk: ["On time", "في الموعد"],
  language: ["العربية", "English"],
  theme: ["Theme", "المظهر"],
  total: ["Total", "الإجمالي"],
  // setup
  setup: ["Setup", "الإعدادات"],
  setupClients: ["Clients setup", "إعداد العملاء"],
  setupUsers: ["Users", "المستخدمون"],
  setupTeams: ["Teams and functions", "الفرق والوظائف"],
  teams: ["Teams", "الفرق"],
  trend: ["Opened and resolved per day", "المفتوح والمحلول كل يوم"],
  opened: ["Opened", "المفتوحة"],
  resolvedLabel: ["Resolved", "المحلولة"],
  avgResolve: ["Average resolve", "متوسط الحل"],
  hoursShort: ["h", "س"],
  daysShort: ["days", "يوم"],
  setupSla: ["SLA and escalation", "الـ SLA والتصعيد"],
  setupWorkflow: ["Workflow", "سير العمل"],
  setupGeneral: ["General settings", "الإعدادات العامة"],
  priorities: ["Priorities", "الأولويات"],
  contractLevels: ["Contract levels", "مستويات العقود"],
  escalationLadder: ["Escalation ladder", "سلسلة التصعيد"],
  workingHours: ["Working hours", "ساعات العمل"],
  holidays: ["Holidays", "الإجازات"],
  acceptMinutes: ["Pickup (minutes)", "الاستلام (دقائق)"],
  resolveMinutes: ["Resolve (minutes)", "الحل (دقائق)"],
  roundClock: ["Round the clock", "على مدار الساعة"],
  escalates: ["Escalates", "يتصعّد"],
  slaFactor: ["SLA factor %", "نسبة الـ SLA %"],
  levelNo: ["Step", "الخطوة"],
  target: ["Goes to", "يروح لمين"],
  fixedWait: ["Fixed wait (min)", "انتظار ثابت (د)"],
  waitPct: ["Share of SLA %", "نسبة من الـ SLA %"],
  workDay: ["Day", "اليوم"],
  isWorkDay: ["Working day", "يوم عمل"],
  fromTime: ["From", "من"],
  toTime: ["To", "إلى"],
  holidayDate: ["Date", "التاريخ"],
  statuses: ["Statuses", "الحالات"],
  transitions: ["Allowed moves", "الانتقالات المسموحة"],
  mandatoryFields: ["Mandatory fields", "الحقول الإلزامية"],
  ticketTypes: ["Ticket types", "أنواع التيكت"],
  rootCauses: ["Root causes", "الأسباب الجذرية"],
  cannedReplies: ["Canned replies", "الردود الجاهزة"],
  openFlag: ["Open", "مفتوحة"],
  terminalFlag: ["Final", "نهائية"],
  slaPause: ["Stops the SLA clock", "يوقف ساعة الـ SLA"],
  fromStatus: ["From", "من حالة"],
  toStatus: ["To", "إلى حالة"],
  actor: ["Who may do it", "مين ينفذها"],
  clientTicketOnly: ["Client tickets only", "تيكتات العملاء فقط"],
  fieldCode: ["Field", "الحقل"],
  label: ["Label", "العنوان"],
  inputType: ["Input", "الإدخال"],
  clientVisible: ["Client sees it", "العميل يشوفه"],
  internalOnly: ["Internal only", "داخلي فقط"],
  clientAllowed: ["Client may open", "العميل يفتحه"],
  aiAllowed: ["AI may answer", "الـ AI يرد عليه"],
  body: ["Body", "النص"],
  settings: ["Settings", "الإعدادات"],
  settingKey: ["Key", "المفتاح"],
  settingValue: ["Value", "القيمة"],
  moduleGroup: ["Group", "المجموعة"],
  salable: ["Sold", "يتباع"],
  defaultTeam: ["Default team", "الفريق الافتراضي"],
  operatingSystems: ["Operating systems", "أنظمة التشغيل"],
  branchTypes: ["Branch types", "أنواع الفروع"],
  aiModels: ["AI models", "موديلات الـ AI"],
  purpose: ["Purpose", "الغرض"],
  provider: ["Provider", "المزوّد"],
  modelName: ["Model", "الموديل"],
  baseUrl: ["Base URL", "الرابط"],
  apiKeyRef: ["Key reference", "مرجع المفتاح"],
  isDefault: ["Default", "الافتراضي"],
  screens: ["Screens", "الشاشات"],
  usedBy: ["Used by", "مستخدم في"],
  lockedField: [
    "Not editable: the packages read it to know what closed means.",
    "غير قابل للتعديل: الباكدجات تقرؤه لتعرف معنى «مغلق».",
  ],
  add: ["Add", "إضافة"],
  edit: ["Edit", "تعديل"],
  active: ["Active", "نشط"],
  inactive: ["Inactive", "غير نشط"],
  sitePrefix: ["Site prefix", "بادئة العميل"],
  licenseNo: ["License no", "رقم الرخصة"],
  nameEn: ["Name (English)", "الاسم بالإنجليزي"],
  nameAr: ["Name (Arabic)", "الاسم بالعربي"],
  area: ["Area", "المنطقة"],
  environment: ["Environment", "البيئة"],
  supportTeam: ["Support team", "فريق الدعم"],
  exsysUrl: ["EXSYS URL", "رابط اكسس"],
  branches: ["Branches", "الفروع"],
  branchType: ["Branch type", "نوع الفرع"],
  organizationNo: ["Organization no", "رقم المنشأة"],
  city: ["City", "المدينة"],
  weight: ["Weight", "الوزن"],
  modules: ["Modules", "الموديولات"],
  contracts: ["Contracts", "العقود"],
  contractCode: ["Contract code", "كود العقد"],
  contractYear: ["Year", "السنة"],
  contractLevel: ["Level", "المستوى"],
  startDate: ["Start", "البداية"],
  endDate: ["End", "النهاية"],
  expired: ["Expired", "منتهي"],
  fullName: ["Full name", "الاسم"],
  email: ["E-mail", "البريد"],
  mobile: ["Mobile", "الموبايل"],
  userKind: ["Kind", "النوع"],
  staffUser: ["Staff", "موظف"],
  clientUser: ["Client user", "مستخدم عميل"],
  role: ["Role", "الدور"],
  seniority: ["Seniority", "الأقدمية"],
  managementFlag: ["Management", "إدارة"],
  kbApproverFlag: ["Approves articles", "يعتمد المقالات"],
  exsysUserName: ["EXSYS user name", "مستخدم اكسس"],
  staffId: ["Staff id", "رقم الموظف"],
  initialPassword: ["Initial password", "كلمة المرور المبدئية"],
  resetPassword: ["Reset password", "تصفير كلمة المرور"],
  unlock: ["Unlock", "فك القفل"],
  activate: ["Activate", "تفعيل"],
  deactivate: ["Deactivate", "إيقاف"],
  locked: ["Locked", "مقفل"],
  lastLogin: ["Last login", "آخر دخول"],
  mustChange: ["Must change password", "لازم يغيّر كلمة المرور"],
  passwordWillBeOneTime: [
    "The user must change this password on the next login.",
    "المستخدم لازم يغيّر كلمة المرور دي أول دخول.",
  ],
  functions: ["Functions", "الوظائف"],
  functionName: ["Function", "الوظيفة"],
  supervisor: ["Supervisor", "السوبرفايزر"],
  teamCode: ["Team code", "كود الفريق"],
  backupTeam: ["Backup team", "الفريق البديل"],
  members: ["Members", "الأعضاء"],
  oncallRoster: ["On-call roster", "جدول المناوبة"],
  oncallPerson: ["On call", "المناوب"],
  backupPerson: ["Backup", "البديل"],
  from: ["From", "من"],
  to: ["To", "إلى"],
  current: ["Now", "الحالي"],
  supportFlag: ["Support function", "وظيفة دعم"],
  displayOrder: ["Order", "الترتيب"],
  deleteRow: ["Delete", "حذف"],
  confirmDelete: ["Delete this row?", "تحذف السطر ده؟"],
  // client user requests (script ETKT_09)
  userRequests: ["User requests", "طلبات المستخدمين"],
  newUserRequest: ["Request a new user", "طلب مستخدم جديد"],
  clientManagers: ["Client managers", "مديرو العملاء"],
  clientManager: ["Client manager", "مدير العميل"],
  clientManagerHint: [
    "Only the client manager can send a request for a new user.",
    "مدير العميل فقط هو من يرسل طلب مستخدم جديد.",
  ],
  userRequestHint: [
    "The request goes to the company management. You will be notified when it is approved or refused.",
    "الطلب يذهب إلى إدارة الشركة، وسيصلك تنبيه عند الموافقة أو الرفض.",
  ],
  suggestedUserName: ["Suggested user name (optional)", "اسم المستخدم المقترح (اختياري)"],
  jobTitle: ["Job title", "المسمى الوظيفي"],
  allBranches: ["All branches", "كل الفروع"],
  requestedBy: ["Requested by", "صاحب الطلب"],
  requestDate: ["Request date", "تاريخ الطلب"],
  decidedBy: ["Decided by", "صاحب القرار"],
  decisionDate: ["Decision date", "تاريخ القرار"],
  rejectReason: ["Refusal reason", "سبب الرفض"],
  approve: ["Approve", "موافقة"],
  reject: ["Refuse", "رفض"],
  approveRequest: ["Approve and create the user", "موافقة وإنشاء المستخدم"],
  rejectRequest: ["Refuse the request", "رفض الطلب"],
  cancelRequest: ["Cancel the request", "إلغاء الطلب"],
  confirmCancelRequest: ["Cancel this request?", "تلغي الطلب ده؟"],
  createdUser: ["Created user", "المستخدم المنشأ"],
  reqWaiting: ["Waiting", "في الانتظار"],
  reqApproved: ["Approved", "تمت الموافقة"],
  reqRefused: ["Refused", "مرفوض"],
  reqCancelled: ["Cancelled", "ملغي"],
  reqAll: ["All", "الكل"],
  managementOnly: [
    "Setup screens are for management only.",
    "شاشات الإعدادات للإدارة فقط.",
  ],
  // 23-11-2026 (script ETKT_13): guide, repeated problems, FAQ
  guide: ["Guide", "الدليل"],
  problems: ["Repeated problems", "المشاكل المكررة"],
  faq: ["FAQ", "الأسئلة الشائعة"],
  newArticle: ["New article", "مقال جديد"],
  article: ["Article", "مقال"],
  articleBody: ["Article text", "نص المقال"],
  articleLanguage: ["Article language", "لغة المقال"],
  keywords: ["Keywords", "كلمات البحث"],
  keywordsHint: ["Words the client may search with, separated by commas", "كلمات ممكن العميل يبحث بيها، بينها فاصلة"],
  aiDraft: ["AI draft", "مسودة من الذكاء الاصطناعي"],
  all: ["All", "الكل"],
  drafts: ["Drafts", "مسودات"],
  published: ["Published", "منشور"],
  rejected: ["Rejected", "مرفوض"],
  archived: ["Archived", "مؤرشف"],
  author: ["Author", "الكاتب"],
  views: ["Views", "المشاهدات"],
  helpful: ["Helpful (yes / no)", "مفيد (نعم / لا)"],
  lastUpdate: ["Last update", "آخر تعديل"],
  saveDraft: ["Save draft", "حفظ المسودة"],
  approvePublish: ["Approve and publish", "اعتماد ونشر"],
  approvePublishConfirm: ["Publish this article to the clients of its module?", "تنشر المقال لعملاء الموديول بتاعه؟"],
  backToDraft: ["Back to draft", "رجوع لمسودة"],
  archive: ["Archive", "أرشفة"],
  archiveConfirm: ["Archive this article? It leaves the FAQ.", "تأرشف المقال؟ هيختفي من الأسئلة الشائعة."],
  approvedBy: ["Approved by", "اعتمده"],
  sourceTicket: ["From ticket", "من التيكت"],
  publishedReadOnly: ["A published article cannot be edited. Return it to draft to change it.", "المقال المنشور مايتعدلش. رجّعه مسودة علشان تعدله."],
  rejectReasonRequired: ["Write the reject reason.", "اكتب سبب الرفض."],
  close: ["Close", "إغلاق"],
  delete: ["Delete", "حذف"],
  deleteConfirm: ["Delete it?", "تحذفه؟"],
  problem: ["Problem", "المشكلة"],
  newProblem: ["New problem", "مشكلة جديدة"],
  openProblems: ["Open", "مفتوحة"],
  fixedProblems: ["Fixed", "تم إصلاحها"],
  openProblem: ["Open", "مفتوحة"],
  fixedProblem: ["Fixed at the root", "اتصلحت من الأساس"],
  fixedRelease: ["Fixed in release", "اتصلحت في إصدار"],
  openNow: ["Open now", "مفتوح الآن"],
  clientsCount: ["Clients", "العملاء"],
  guideArticle: ["Guide article", "مقال الدليل"],
  lastTicket: ["Last ticket", "آخر تيكت"],
  linkedTickets: ["Linked tickets", "التيكتات المربوطة"],
  linkTicket: ["Link ticket", "ربط تيكت"],
  unlink: ["Unlink", "فك الربط"],
  unlinkConfirm: ["Unlink this ticket from the problem?", "تفك ربط التيكت ده من المشكلة؟"],
  linkToProblem: ["Link to a repeated problem", "اربطه بمشكلة مكررة"],
  faqSearch: ["Search the questions", "ابحث في الأسئلة"],
  wasHelpful: ["Was this helpful?", "هل كان مفيد؟"],
  thanksFeedback: ["Thank you for your answer", "شكراً على رأيك"],
  yes: ["Yes", "نعم"],
  no: ["No", "لا"],
  previous: ["Previous", "السابق"],
  next: ["Next", "التالي"],
  // 23-11-2026 (script ETKT_14): client home, client statistics, company analysis
  statistics: ["Statistics", "الإحصائيات"],
  helloUser: ["Hello", "أهلاً"],
  howCanWeHelp: [", how can we help?", "، كيف نقدر نساعدك؟"],
  guideSearchHint: ["Search the guide, e.g. NPHIES, barcode, dispensing", "ابحث في الدليل، مثال: نفيس، الباركود، الصرف"],
  orgStats: ["Your organisation's statistics", "إحصائيات منشأتك"],
  followMyTickets: ["Follow my tickets", "متابعة تيكتاتي"],
  openWord: ["open", "مفتوح"],
  browseGuideByModule: ["Browse the guide by module", "تصفح الدليل حسب الموديول"],
  articlesWord: ["articles", "مقال"],
  latestTickets: ["Your latest tickets", "أحدث تيكتاتك"],
  usefulArticles: ["Useful articles", "مقالات مفيدة"],
  waitingYou: ["Waiting for your reply or confirmation", "تنتظر ردكم أو تأكيدكم"],
  clientStatsTitle: ["Statistics of", "إحصائيات"],
  scopeOrg: ["Whole organisation", "كل المنشأة"],
  scopeMine: ["My tickets only", "تيكتاتي أنا"],
  periodWeek: ["Week", "أسبوع"],
  periodMonth: ["Month", "شهر"],
  period3Months: ["3 months", "3 شهور"],
  periodYear: ["Year", "سنة"],
  periodCustom: ["From - to", "من - إلى"],
  sentSolvedTrend: ["Sent and solved during the period", "المرسل والمحلول خلال الفترة"],
  byStatus: ["By status", "حسب الحالة"],
  byModule: ["By module", "حسب الموديول"],
  byType: ["By type", "حسب النوع"],
  byBranch: ["By branch", "حسب الفرع"],
  bySender: ["By sender", "حسب المرسل"],
  stuckLate: ["Blocked or late", "معطلة أو متأخرة"],
  clientStatsNote: ["\"Agreed time\" = the external SLA of the ticket priority. \"Blocked or late\" = stopped or past the solve time.", "\"الموعد المتفق عليه\" = الـ SLA الخارجي حسب أولوية التيكت. \"معطلة أو متأخرة\" = متوقفة أو تجاوزت موعد الحل."],
  kpi_sent: ["Tickets you sent", "تيكتات أرسلتموها"],
  kpi_solved: ["Solved", "تم حلها"],
  kpi_open: ["Still open", "ما زالت مفتوحة"],
  kpi_stuck: ["Blocked or late", "معطلة أو متأخرة عن الموعد"],
  kpi_waiting_you: ["Waiting for you", "تنتظر ردكم أو تأكيدكم"],
  kpi_ai_solved: ["Solved at once by the assistant", "حلّها المساعد الآلي فوراً"],
  kpi_avg_resolve_hours: ["Average time to solve", "متوسط وقت الحل"],
  kpi_on_time_pct: ["Solved within the agreed time", "اتحلت في الموعد المتفق عليه"],
  kpi_avg_rating: ["Average rating (of 5)", "متوسط التقييم من 5"],
  kpi_ai_pct: ["Solved by the AI", "حلّها الـ AI"],
  kpi_angry_open: ["Angry clients now", "عملاء غاضبون الآن"],
  kpi_breach_int_open: ["Past the internal SLA now", "عدّت الـ SLA الداخلي الآن"],
  kpi_contracts_due: ["Contracts ended or ending in 30 days", "عقود منتهية أو تنتهي خلال 30 يوم"],
  companyAnalysis: ["Company analysis", "تحليل الشركة"],
  allClients: ["All clients", "كل العملاء"],
  clientsByWeight: ["Clients compared by weight", "مقارنة العملاء (بالوزن النسبي)"],
  clientPosition: ["Position of", "موقف"],
  branchesWord: ["Branches", "الفروع"],
  afterWeight: ["After weight", "بعد الوزن"],
  vsAverage: ["Against the average", "مقارنة بالمتوسط"],
  vsBranchAverage: ["Against the average branch", "مقارنة بمتوسط الفروع"],
  critical: ["Critical", "حرجة"],
  aiSolvedShort: ["Solved by AI", "حلّها الـ AI"],
  onTimeShort: ["On time", "حل في الموعد"],
  rejectedSolution: ["Solution rejected", "رُفض الحل"],
  idxHigh: ["Higher than expected", "أعلى من المتوقع"],
  idxNormal: ["Normal", "طبيعي"],
  idxLow: ["Lower than expected", "أقل من المتوقع"],
  loadHigh: ["Overloaded", "محمّل زيادة"],
  loadNormal: ["Balanced", "متوازن"],
  loadLow: ["Less", "أقل"],
  weightNote: ["Client weight = sum of its branch weights. \"After weight\" = tickets ÷ weight. 1.0× = the average client. Click a client to see its branches.", "وزن العميل = مجموع أوزان فروعه. \"بعد الوزن\" = التيكتات ÷ الوزن. 1.0× = متوسط العملاء. اضغط على عميل لعرض فروعه."],
  branchWeightNote: ["Each branch is compared, after its weight, with the average branch of all clients, so a medical complex is not judged like a hospital.", "كل فرع بيتقارن بمتوسط كل فروع العملاء بعد الوزن، فالمجمع ما يتظلمش قدام المستشفى."],
  byRootCause: ["By root cause", "حسب السبب الجذري"],
  topProblems: ["Most repeated problems", "أكثر المشاكل تكراراً"],
  teamLoadTitle: ["Teams: actual load against expected", "الفرق: الحمل الفعلي مقابل المتوقع"],
  periodTickets: ["Period tickets", "تيكتات الفترة"],
  expectedLoad: ["Expected by client weights", "المتوقع حسب أوزان عملائه"],
  actualVsExpected: ["Actual ÷ expected", "الفعلي ÷ المتوقع"],
  acceptOnTime: ["Picked up on time", "استلام في الوقت"],
  escalationsOnTeam: ["Escalations on it", "تصعيدات عليه"],
  teamLoadNote: ["Expected for a support team = client tickets × (weights of its clients ÷ weights of all clients), so a team with hospitals is not judged like a team with pharmacies.", "المتوقع لفريق الدعم = تيكتات العملاء × (مجموع أوزان عملائه ÷ مجموع أوزان كل العملاء). كده الفريق اللي عليه مستشفيات ما يتظلمش قدام فريق عليه صيدليات."],
  branchTypeWeights: ["Branch type weights", "أوزان أنواع الفروع"],
  branchesCount: ["Branches", "عدد الفروع"],
  currentWeight: ["Current weight", "الوزن الحالي"],
  suggestedWeight: ["Suggested from the last year", "المقترح من بيانات آخر سنة"],
  useSuggested: ["Use the suggested", "استخدم المقترح"],
  useSuggestedConfirm: ["Set this weight for every branch of this type? Every comparison changes.", "تعتمد الوزن ده لكل فروع النوع ده؟ كل المقارنات هتتغير."],
  suggestedWeightNote: ["The base type (weight 1) is the reference. Suggested = average tickets of one branch of the type in the last year ÷ average of one base branch. Review the weights every 3 months.", "النوع الأساسي (وزن 1) هو المرجع. المقترح = متوسط تيكتات الفرع من النوع ده في آخر سنة ÷ متوسط فرع النوع الأساسي. راجعوا الأوزان كل 3 شهور."],
  // 24-11-2026 (script ETKT_15): reports and Excel export (other languages come from ETK_LABEL)
  reports: ["Reports", "التقارير"],
  rpt_tickets: ["Tickets report", "تقرير التيكتات"],
  rpt_sla: ["SLA performance report", "تقرير أداء الـ SLA"],
  rpt_staff: ["Staff productivity report", "تقرير إنتاجية الموظفين"],
  rpt_client: ["Client periodic report", "تقرير العميل الدوري"],
  rptTicketsDesc: ["Every ticket with its status, team and SLA, filtered as you choose.", "كل تيكت بحالته وفريقه والـ SLA، بالفلاتر اللي تختارها."],
  rptSlaDesc: ["Pickup and solve on time per client, team or priority.", "الاستلام والحل في الموعد لكل عميل أو فريق أو أولوية."],
  rptStaffDesc: ["The work of each staff member in the period.", "شغل كل موظف خلال الفترة."],
  rptClientDesc: ["A period summary of one client: numbers, breakdowns and the ticket list.", "ملخص فترة لعميل واحد: الأرقام والتقسيمات وقائمة التيكتات."],
  rptOpenPrint: ["Open to print", "عرض للطباعة"],
  exportExcel: ["Export to Excel", "تصدير إكسل"],
  rptChooseClient: ["Choose a client first.", "اختار العميل الأول."],
  rptAllDatesHint: ["No dates = all dates", "بدون تاريخ = كل التواريخ"],
  rptExportHint: ["The file has every row of the current filter, not only this page.", "الملف فيه كل صفوف الفلتر الحالي، مش الصفحة دي بس."],
};

type LabelKey = keyof typeof LABELS;

/*
 * 23-11-2026 - many languages (script ETKT_11)
 *   OLD    : two languages only, from the dictionary above.
 *   NEW    : the active languages come from ETK_LANGUAGE (languages_data) and the
 *            texts of the chosen language from ETK_LABEL (labels_data). The
 *            dictionary above stays as the fallback (English / Arabic) while the
 *            texts load or if the service cannot be reached.
 *   REASON : Khaled - EXSYS works in many languages; the screens must too.
 *   BENEFIT: a new language or a corrected word is a row in ETK_LABEL, no new build.
 */
export interface LanguageType {
  language_id: number;
  language_code: string;
  language_name: string;
  native_name: string;
  direction: "rtl" | "ltr";
}

/* used until languages_data answers (same ids as EXSYS.EXSYS01) */
const FALLBACK_LANGUAGES: LanguageType[] = [
  { language_id: 1, language_code: "en", language_name: "English", native_name: "English", direction: "ltr" },
  { language_id: 2, language_code: "ar", language_name: "Arabic", native_name: "العربية", direction: "rtl" },
];
/* right-to-left EXSYS languages: Arabic, Urdu, Kurdish */
const RTL_IDS = [2, 4, 13];

interface LabelsContextProps {
  translate: (key: LabelKey) => string;
  languages: LanguageType[];
  current?: LanguageType;
  isRtl: boolean;
}

const LabelsContext = createContext<LabelsContextProps>({
  translate: (key) => String(key),
  languages: FALLBACK_LANGUAGES,
  isRtl: false,
});

export const LabelsProvider = ({ children }: { children: React.ReactNode }) => {
  const languageId = useMakeSelectCurrentLanguageId();
  const [languages, setLanguages] = useState<LanguageType[]>(FALLBACK_LANGUAGES);
  const [texts, setTexts] = useState<{ [key: string]: string }>({});

  // the language list: once
  useEffect(() => {
    let alive = true;
    getRequest("languages", { planguageid: languageId }).then(({ data, error }) => {
      const rows = (!error && data && data.data) || [];
      if (alive && rows.length) {
        setLanguages(
          rows.map((row: any) => ({
            ...row,
            language_id: Number(row.language_id),
          })),
        );
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // the texts: every time the language changes
  useEffect(() => {
    let alive = true;
    setTexts({});
    getRequest("labels", { planguageid: languageId }).then(({ data, error }) => {
      const rows = (!error && data && data.data) || [];
      if (!alive) {
        return;
      }
      const next: { [key: string]: string } = {};
      rows.forEach((row: any) => {
        if (row.key && row.text) {
          next[row.key] = row.text;
        }
      });
      setTexts(next);
    });
    return () => {
      alive = false;
    };
  }, [languageId]);

  const value = useMemo(() => {
    const index = languageId === 2 ? 1 : 0;
    const current = languages.find((item) => item.language_id === languageId);
    const isRtl = current
      ? current.direction === "rtl"
      : RTL_IDS.indexOf(languageId) >= 0;
    return {
      translate: (key: LabelKey) => {
        const fromDb = texts[key as string];
        if (fromDb) {
          return fromDb;
        }
        const entry = LABELS[key as string];
        return entry ? entry[index] : String(key);
      },
      languages,
      current,
      isRtl,
    };
  }, [languageId, languages, texts]);

  return (
    <LabelsContext.Provider value={value}>{children}</LabelsContext.Provider>
  );
};

export const useLabels = () => useContext(LabelsContext).translate;
export const useLanguages = () => {
  const { languages, current, isRtl } = useContext(LabelsContext);
  return { languages, current, isRtl };
};
export const useIsArabic = () => useMakeSelectCurrentLanguageId() === 2;
