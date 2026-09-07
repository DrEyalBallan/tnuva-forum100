/**
 * Event & Whitelabel Configuration
 * 
 * Edit this file to easily customize application branding, titles, logo, colors,
 * participant groups, and active state for any client / event.
 */

export interface EventConfig {
  /**
   * Set to false to freeze the event:
   * - Stops polling intervals and background consumption
   * - Disables public uploads on "/" with a friendly "אירוע הסתיים" notice
   * - Rejects any upload API calls to guarantee 0 token/bandwidth spend
   */
  isActive: boolean;

  /** Company / Client Name */
  companyName: string;

  /** Main Event Title displayed on all headers & slideshows */
  eventTitle: string;

  /** Subtitle / Tagline */
  eventSubtitle: string;

  /**
   * Logo image URL (located in public directory or hosted URL).
   * Leave empty string "" to hide logo.
   */
  logoUrl: string;

  /** Alt text for the logo */
  logoAlt: string;

  /** Number of participant groups (e.g. 20) */
  groupsCount: number;

  /** Labels and form texts */
  labels: {
    groupSelectTitle: string;
    groupOptionPrefix: string;
    sloganTitle: string;
    sloganPlaceholder: string;
    sloganMaxLength: number;
    commitmentTitle: string;
    commitmentPlaceholder: string;
    commitmentMaxLength: number;
    uploadButton: string;
    uploadingText: string;
    successTitle: string;
    successSubtitle: string;
    inactiveNoticeTitle: string;
    inactiveNoticeMessage: string;
  };

  /** Theme colors */
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    bgColor: string;
  };

  /** Navigation Links */
  navLinks: {
    showNavigation: boolean;
    uploadPageLabel: string;
    slideshowLabel: string;
    streamLabel: string;
    commitmentsLabel: string;
    rapperLabel: string;
    adminLabel: string;
  };
}

export const EVENT_CONFIG: EventConfig = {
  // SET THIS TO false TO FREEZE THE APP & PREVENT ALL TOKEN / BANDWIDTH SPENDING
  // SET THIS TO true WHEN LAUNCHING A LIVE EVENT
  isActive: false,

  companyName: 'אירוע חברה',
  eventTitle: 'כנס מנהיגות וחדשנות',
  eventSubtitle: 'שיתוף רגעים, סלוגנים והתחייבויות לפעולה',

  // Logo URL: Set your client's logo (e.g. '/my-logo.png' or '/logo-wd.png').
  // If empty string "", no logo image is displayed.
  logoUrl: '',
  logoAlt: 'לוגו האירוע',

  // Number of groups / teams in the event
  groupsCount: 20,

  labels: {
    groupSelectTitle: '1. הקבוצה שלכם',
    groupOptionPrefix: 'קבוצה',
    sloganTitle: '2. סלוגן (עד 80 תווים)',
    sloganPlaceholder: 'הקלידו כאן סלוגן...',
    sloganMaxLength: 80,
    commitmentTitle: '3. התחייבות לפעולה',
    commitmentPlaceholder: 'הקלידו כאן את ההתחייבות לפעולה...',
    commitmentMaxLength: 160,
    uploadButton: '🚀 4. העלאת תמונה',
    uploadingText: 'מעלה...',
    successTitle: 'התוכן הועלה בהצלחה!',
    successSubtitle: 'התמונה והמסרים שלכם ישולבו במצגת ובמסכי האירוע',
    inactiveNoticeTitle: 'האירוע הסתיים / שיתוף הקבצים מושבת',
    inactiveNoticeMessage: 'העלאת קבצים סגורה כעת. האפליקציה במצב צפייה/ארכיון (ללא צריכת טוקנים).',
  },

  theme: {
    primaryColor: '#0052cc',
    secondaryColor: '#e31837',
    accentColor: '#0284c7',
    bgColor: '#f8fafc',
  },

  navLinks: {
    showNavigation: true,
    uploadPageLabel: '📱 עמוד משתמש להעלאה',
    slideshowLabel: '📽️ מצגת שקופיות רצה',
    streamLabel: '📺 מסך הקרנה',
    commitmentsLabel: '📜 לוח התחייבויות',
    rapperLabel: '🎤 סלוגנים לראפר',
    adminLabel: '⚙️ פאנל ניהול',
  },
};
