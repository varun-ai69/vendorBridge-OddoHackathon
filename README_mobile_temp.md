# VendorBridge — React Native Mobile App

![Expo SDK ~53](https://img.shields.io/badge/Expo-~53.x-black?logo=expo)
![TypeScript ~5](https://img.shields.io/badge/TypeScript-~5.x-blue?logo=typescript)
![React Navigation v7](https://img.shields.io/badge/React%20Navigation-v7-purple?logo=reactnavigation)
![Zustand v5](https://img.shields.io/badge/Zustand-v5.x-orange)
![TanStack Query v5](https://img.shields.io/badge/TanStack%20Query-v5.x-red?logo=reactquery)

Welcome to the official developer handbook and implementation plan for the **VendorBridge React Native Mobile App**. This application forms the mobile frontend of the VendorBridge Procurement ERP, providing a high-fidelity, role-based workflow tailored for Admins, Procurement Officers, Managers, and Vendors.

---

## 1. Overview & role

The **VendorBridge Mobile App** digitizes and automates the entire procurement lifecycle. The mobile frontend provides a premium, responsive interface that consumes the REST APIs of the Node.js + Express backend. As the mobile developer, your role is to deliver a production-ready client that features smooth animations, offline resilience, secure credential handling, and custom hackathon differentiators.

### The 7-Step Procurement Workflow
1. **Org Setup**: Admin registers the organization and invites internal staff and external vendors to join.
2. **RFQ Creation**: Procurement Officer creates a Request for Quotation (RFQ) specifying line items, quantities, and response deadlines.
3. **Quotation Submission**: Selected approved vendors receive push notifications and submit their bids directly through the app.
4. **Comparison**: Procurement Officer compares bids side-by-side on a color-coded matrix and shortlists the best option.
5. **Approval**: Manager reviews the shortlisted quotation and approves or rejects the request with comments in 1 tap.
6. **PO Generation**: Upon approval, a Purchase Order (PO) is generated as a secure PDF and dispatched to the vendor.
7. **Invoicing & Payment**: Vendor updates delivery states (acknowledged -> in transit -> delivered), uploads the invoice, and the Procurement Officer records the payment.

---

## 2. Key statistics at a glance

Below is a detailed summary of the numerical parameters, configurations, and schedules defined for the VendorBridge React Native Mobile App:

| Metric | Value |
| :--- | :--- |
| Screens to build | 10 |
| User roles | 4 |
| API endpoints consumed | 55+ |
| Hackathon unique add-ons | 8 |
| Checklist items | 74 |
| Navigation stacks | 4 |
| Zustand stores | 3 |
| Multi-step RFQ form steps | 3 |
| Procurement workflow steps | 7 |
| Packages in tech stack | 30 |
| Phased execution phases | 5 |
| Phase 1 timing | 6 |
| Phase 2 timing | 12 |
| Phase 3 timing | 6 |
| Phase 4 timing | 8 |
| Phase 5 timing | 2 |
| Total estimated dev time (hours) | 34 |
| JWT access token lifetime | 24h |
| JWT refresh token lifetime | 7d |
| Notification polling interval (seconds) | 60 |
| victory-native version | v36.x |
| expo SDK version | ~53.x |
| TypeScript version | ~5.x |
| React Navigation version | v7 |
| Zustand version | v5.x |
| TanStack React Query version | v5.x |
| Minimum file upload size limit | 10MB |
| Minimum touch target | 44x44pt |
| Role-specific dashboard layouts | 4 |
| PO status states | 5 |
| Quotation status states | 5 |
| RFQ status states | 5 |
| Invoice status states | 4 |
| Base API URL variable | EXPO_PUBLIC_API_URL |
| src/ subdirectories | 9 |

---

## 3. Architecture

The VendorBridge Mobile App is structured around a decoupled architecture where local state management, network caching, and navigation are separated.

### Navigation Tree

The application implements a strict role-based navigation flow using React Navigation v7:

```
RootNavigator (Stack)
├── AuthStack (Stack)
│   ├── LoginScreen
│   ├── ForgotPasswordScreen
│   └── ResetPasswordScreen (Deep Link: vendorbridge://reset-password)
└── AppNavigator (Switch based on authStore.role)
    ├── AdminNavigator (Drawer)
    │   └── Tabs (BottomTabs)
    │       ├── AdminDashboardScreen
    │       ├── VendorManagementStack (List, Details, Create)
    │       ├── ActivityLogsScreen
    │       └── SettingsStack (SettingsScreen, ChangePasswordScreen)
    ├── ProcurementNavigator (Drawer)
    │   └── Tabs (BottomTabs)
    │       ├── PODashboardScreen
    │       ├── RFQStack (List, Details, CreateWizard)
    │       ├── ComparisonScreen
    │       ├── POInvoiceStack (List, Details, Generator)
    │       └── SettingsStack (SettingsScreen, ChangePasswordScreen)
    ├── ManagerNavigator (Drawer)
    │   └── Tabs (BottomTabs)
    │       ├── ManagerDashboardScreen
    │       ├── ApprovalsStack (List, Details, Actions)
    │       ├── ReportsAnalyticsScreen
    │       └── SettingsStack (SettingsScreen, ChangePasswordScreen)
    └── VendorNavigator (Drawer)
        └── Tabs (BottomTabs)
            ├── VendorDashboardScreen
            ├── VendorRFQStack (List, RFQDetails)
            ├── QuotationStack (List, QuoteSubmit)
            ├── VendorPOInvoiceStack (List, Details, InvoiceGenerator)
            └── SettingsStack (SettingsScreen, ChangePasswordScreen)
```

### State Management Strategy

1. **Zustand (Client/Global State)**
   - `authStore`: Persists authentication tokens, active user profile details, role settings, and biometric configurations inside `expo-secure-store`.
   - `notifStore`: Manages in-app notification data and counts.
   - `themeStore`: Theme toggle state (dark/light) persisting to secure storage.
2. **TanStack React Query (Server State)**
   - Handles network query caching, synchronization, mutations, and optimistic state updates.
   - Retries are globally disabled for `401`, `403`, `404`, and `422` statuses to prevent unnecessary network retries.

### Project Folder Structure

The application code resides inside 9 primary subdirectories:

```
src/
├── assets/         # App icons, splash screens, adaptive icons, and empty state illustrations
├── components/     # Reusable atomic UI (LoadingButton, ConfirmDialog, ErrorBoundary, Skeleton)
├── screens/        # Screen directories containing screens, components, and schema files
├── navigation/     # Tab, stack, drawer setups, and Deep Linking configurations
├── hooks/          # Domain-specific API query/mutation hooks (useAuth, useRFQ, useVendors)
├── services/       # Network client (Axios with intercepts), API endpoints, and Mock Layer
├── store/          # Zustand global stores (auth, notifications, theme)
├── utils/          # Formatting engines, input validators, accessibility, and hitSlops
└── theme/          # HSL colors, font scales, grids, and ThemeContext providers
```

---

## 4. User roles & screen mapping

The application provides unique dashboard interfaces, permissions, and navigation routes depending on the user's role:

| Role | Screens Accessible | Dashboard Type | Tab Count |
| :--- | :--- | :--- | :--- |
| **Admin** | Dashboard, Users, Vendors, Logs, Reports, Settings | Total users, vendors, activity meters | 4 |
| **Procurement Officer** | Dashboard, RFQ, Quotes, Comparison, PO, Invoices, Reports, Settings | Active RFQs, pending approvals, recent orders | 4 |
| **Manager** | Dashboard, Approvals, Reports, Analytics, Logs, Settings | Approvals pipeline, spending trends | 3 |
| **Vendor** | Dashboard, RFQs, Quotations, POs, Invoices, Settings | Active RFQs, bids submitted, monthly revenue | 4 |

### Role-Specific API Scopes
- **Admin**: Invites team members, creates vendors, approves/deactivates accounts, views system logs.
- **Procurement Officer**: Creates RFQs, side-by-side comparison tables, shortlists bids, creates POs, reviews invoices.
- **Manager**: One-tap approve/reject on shortlisted RFQs, views analytical reporting summaries.
- **Vendor**: Bids on open RFQs, triggers PO state changes, submits invoices from delivered orders.

---

## 5. All 10 screens — specifications

### 01 Login / Auth
- **Role Access**: All Roles
- **Purpose**: Email-based entry screen featuring password resets and local biometric authentication.
- **API Endpoints**: `POST /auth/login`, `POST /auth/forgot-password`, `GET /auth/me`
- **What to Build**:
  - Email and password textfields using React Hook Form + Yup validations.
  - Remember me toggle saving user identifier locally.
  - Biometric login icon button using `expo-local-authentication` (Touch ID / Face ID unlock).
  - Role selection chips (Admin, PO, Manager, Vendor) appearing under `EXPO_PUBLIC_DEMO_MODE=true` to fill credentials.
- **Key Components**: `LoadingButton`, `TextInput`, `RoleChip`

### 02 Dashboard / Home
- **Role Access**: All Roles (Role-Specific Layouts)
- **Purpose**: High-level system overview screen displaying active counts, analytics, and action paths.
- **API Endpoints**: `GET /dashboard/admin`, `GET /dashboard/procurement`, `GET /dashboard/manager`, `GET /dashboard/vendor`
- **What to Build**:
  - Admin view: displays users, invited vendors, and active RFQ metrics.
  - Procurement view: tracks open RFQs, pending manager approvals, and quick creation routes.
  - Manager view: displays pending approval queues, spend trends, and acceptance metrics.
  - Vendor view: tracks active RFQ invitations, quote bid tallies, and monthly revenue.
- **Key Components**: `MetricCard`, `DashboardGrid`, `ActivityIndicator`

### 03 Vendor Management
- **Role Access**: Admin, Procurement Officer (View Only)
- **Purpose**: Management registry for editing, approving, and inviting supplier accounts.
- **API Endpoints**: `POST /admin/vendors`, `GET /admin/vendors`, `GET /admin/vendors/:vendorId`, `PATCH /admin/vendors/:vendorId/status`
- **What to Build**:
  - Scrollable FlatList vendor cards with search inputs and category filters.
  - Details screen containing GST numbers, banking configurations, performance metrics, and rating stars.
  - Creator/Invite forms with inputs for contact email, banking keys, and notes (Admin-only).
  - Status toggle buttons for account activation (Admin-only).
- **Key Components**: `FlatList`, `SearchBar`, `ConfirmDialog`, `CategoryPill`

### 04 RFQ Creation
- **Role Access**: Procurement Officer
- **Purpose**: 3-step creation wizard to send quotation requests to active vendors.
- **API Endpoints**: `POST /rfq`, `GET /rfq`, `PATCH /rfq/:rfqId/cancel`
- **What to Build**:
  - Step 1: form fields for title, descriptions, and delivery calendars.
  - Step 2: dynamic table lists allowing addition/removal of product items with quantities.
  - Step 3: multi-select lists filtering approved vendors by supply categories.
  - Attachment upload buttons supporting spec files up to 10MB limit.
- **Key Components**: `WizardSteps`, `DynamicRowList`, `DocumentPicker`, `LoadingButton`

### 05 Quotation Submission
- **Role Access**: Vendor
- **Purpose**: Detail review and bidding form for vendors to submit specifications.
- **API Endpoints**: `GET /vendor/rfqs/:rfqId`, `POST /vendor/rfqs/:rfqId/quotation`, `PUT /vendor/rfqs/:rfqId/quotation/:quotationId`
- **What to Build**:
  - RFQ spec panels displaying product parameters and dead-lines.
  - Bidding inputs (unit prices, tax rates, delivery times, payment terms).
  - Editing switches enabling bid updates prior to PO creation.
  - Status timeline cards (submitted -> shortlisted -> accepted).
- **Key Components**: `TimelineIndicator`, `FormInput`, `LoadingButton`

### 06 Quotation Comparison
- **Role Access**: Procurement Officer, Manager
- **Purpose**: Scrollable comparison sheet matching bids side-by-side.
- **API Endpoints**: `GET /rfq/:rfqId/quotations/compare`, `PATCH /rfq/:rfqId/quotations/:quotationId/select`
- **What to Build**:
  - Horizontal side-by-side comparison tables.
  - Green highlighting indicating columns/cells containing the lowest prices.
  - Side metrics matching delivery dates and vendor rating cards.
  - Confirmation modals allowing officers to select and submit bids for manager review.
- **Key Components**: `ScrollView`, `ComparisonCell`, `ConfirmDialog`

### 07 Approval Workflow
- **Role Access**: Manager, Procurement Officer (View Only)
- **Purpose**: Management sign-off portal containing request workflows.
- **API Endpoints**: `GET /approvals`, `GET /approvals/:approvalId`, `PATCH /approvals/:approvalId/action`
- **What to Build**:
  - Manager queues matching approval items and request values.
  - Detail panels containing full timeline flows and links to bid PDFs.
  - Dual action buttons (Approve / Reject) showing confirmation remarks screens.
  - Red/green status badges matching request outcomes.
- **Key Components**: `ApprovalCard`, `StatusBadge`, `RemarksModal`

### 08 Purchase Order & Invoice
- **Role Access**: Procurement Officer, Vendor
- **Purpose**: Financial invoicing and order generator panel.
- **API Endpoints**: `POST /po`, `GET /po/:poId`, `PATCH /po/:poId/status`, `POST /vendor/po/:poId/invoice`, `PATCH /invoices/:invoiceId/status`
- **What to Build**:
  - PO generator forms automatically pulling accepted quotation data.
  - PDF document viewer using Expo Print + WebView with system sharing triggers.
  - Order state switches for vendors (acknowledged -> in transit -> delivered).
  - Invoice billing sheets calculating taxes, with reference validation keys.
- **Key Components**: `WebView`, `QRGenerator`, `ShareButton`, `StatusTracker`

### 09 Notifications & Logs
- **Role Access**: All Roles
- **Purpose**: Alert center matching activity timelines and security logs.
- **API Endpoints**: `GET /notifications`, `PATCH /notifications/:id/read`, `GET /activity-logs`
- **What to Build**:
  - Swipe-to-read alert feeds containing status updates.
  - Red numerical badges overlays on bottom navigation tabs.
  - Activity log timelines for admin and managers tracking database alterations.
  - Real-time notification banners utilizing Expo Notifications.
- **Key Components**: `SwipeableRow`, `UnreadBadge`, `LogList`

### 10 Reports & Analytics
- **Role Access**: Admin, Manager, Procurement Officer
- **Purpose**: Business analytics charts tracking spending categories and supplier scorecards.
- **API Endpoints**: `GET /reports/procurement-summary`, `GET /reports/spend-trend`, `GET /reports/vendor-performance`
- **What to Build**:
  - Spending trends (Victory Native area charts).
  - Vendor performance radar/bar charts.
  - Category donut charts matching organization budgets.
  - Time range selector parameters filtering database analytics.
- **Key Components**: `VictoryArea`, `VictoryBar`, `VictoryPie`, `DateRangeFilter`

---

## 6. Hackathon add-ons (8 features)

### 01 AI Vendor Recommendation
- **Why it Wins**: Judges love practical AI implementations. Provides an automated analyst that evaluates all quotes side-by-side.
- **Implementation**: Frontend makes a `POST` request to our secure backend endpoint `/api/v1/ai/recommend-vendor` (which proxy-calls the Claude API). The system processes vendor ratings, bids, and delivery times to output a structured recommendation.
- **Package**: Axios client hook with a natural language formatting card in `ComparisonScreen`.
- **Security**: **Anthropic key is strictly kept in the backend env files.** Never put API keys in mobile bundles.

### 02 Push Alerts + 1-Tap Action
- **Why it Wins**: Extremely impressive UX during live demo presentations. Allows approvals directly from notifications.
- **Implementation**: FCM alerts received using `expo-notifications`. Registers actions in the OS notification center enabling managers to click "Approve" directly from the lock screen without opening the app.
- **Package**: `expo-notifications`, Firebase Cloud Messaging hooks.

### 03 Rich Analytics Charts
- **Why it Wins**: Elevates the app from a mock presentation to a professional corporate ERP.
- **Implementation**: Displays responsive SVG charts summarizing historical trends.
- **Package**: `victory-native` at `v36.x` to avoid compilation blocks inside the Expo managed workspace.

### 04 Biometric Authentication
- **Why it Wins**: Fast, high-impact security flow.
- **Implementation**: Detects device support (FaceID/Fingerprint), toggles configurations in settings, and prompts for biometric scan on startup, retrieving secure tokens from storage.
- **Package**: `expo-local-authentication`, `expo-secure-store`.

### 05 QR Codes for POs
- **Why it Wins**: Bridges digital workflows with physical operations (warehouse deliveries).
- **Implementation**: Generates a unique SVG QR code containing the PO UUID. Warehouse staff scan the code to instantly pull up the delivery sheet.
- **Package**: `react-native-qrcode-svg`, `expo-camera`.

### 06 Document Scanner
- **Why it Wins**: Solves the real-world problem of digitizing physical delivery slips.
- **Implementation**: Uses device camera to capture spec files and invoices, crops boundaries, and uploads using `multipart/form-data`.
- **Package**: `expo-camera`, `expo-image-picker`.

### 07 Vendor Star Rating
- **Why it Wins**: Creates a closed-loop feedback system that improves future procurement decisions.
- **Implementation**: Renders rating star components on delivery confirmation screens, saving scorecards to database records.
- **Package**: React Native Paper star icon configurations.

### 08 Dark Mode
- **Why it Wins**: Complete visual polish and modern styling standard.
- **Implementation**: Swaps light and dark styling configurations dynamically using React Navigation and ThemeContext.
- **Package**: `themeStore` Zustand hook.

---

## 7. Complete tech stack

The application utilizes 30 packages to support high-end layouts, animations, and security:

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `expo` | `~53.0.0` | Primary framework |
| `react-native` | `0.78.x` | Base library |
| `@react-navigation/native` | `^7.0.0` | Core navigation shell |
| `@react-navigation/stack` | `^7.0.0` | Native stack navigators |
| `@react-navigation/bottom-tabs` | `^7.0.0` | Tab navigators |
| `@react-navigation/drawer` | `^7.0.0` | Menu drawers |
| `zustand` | `^5.0.0` | Client global store |
| `@tanstack/react-query` | `^5.0.0` | Caching and data query mutations |
| `axios` | `^1.7.0` | HTTP client mapping |
| `react-hook-form` | `^7.51.0` | Form state engines |
| `yup` | `^1.4.0` | Schema verification validations |
| `react-native-paper` | `^5.12.0` | Material UI component framework |
| `react-native-reanimated` | `^3.10.0` | Layout transitions and skeletons |
| `expo-secure-store` | `^13.0.0` | Encrypted keychain credential storage |
| `expo-local-authentication` | `^14.0.0` | FaceID and TouchID authentication |
| `expo-notifications` | `^0.28.0` | Local and remote notifications manager |
| `expo-print` | `^13.0.0` | PDF generating layouts |
| `react-native-webview` | `^13.8.0` | WebView wrapper for PDF display |
| `expo-mail-composer` | `^13.0.0` | In-app system mail composers |
| `expo-image-picker` | `^15.0.0` | Device camera spec upload |
| `expo-camera` | `^16.0.0` | QR scanner and camera layouts |
| `react-native-qrcode-svg` | `^6.3.0` | SVG QR rendering engine |
| `date-fns` | `^3.6.0` | Time format engines |
| `@expo/vector-icons` | `^14.0.0` | Material and community icon packs |
| `expo-haptics` | `^13.0.0` | Haptic feedbacks for inputs |
| `expo-screen-capture` | `^5.0.0` | Screenshot blocking routines |
| `react-native-toast-message` | `^2.2.0` | System status toast engines |
| `expo-image` | `^1.12.0` | Fast memory avatar caching |
| `@react-native-community/netinfo` | `^11.3.0` | Offline state monitors |
| `@tanstack/react-query-devtools` | `^5.0.0` | Debug panels (Development only) |

> [!WARNING]
> Do NOT install or upgrade to `victory-native` v41+ as it requires `@shopify/react-native-skia` compilation, which breaks standard Expo Go workflows. Pin version to `victory-native@36.x` instead.

> [!IMPORTANT]
> Because `expo-local-authentication`, `expo-screen-capture` and `expo-notifications` require Native Module links, you must compile development builds using EAS (`eas build --profile development`) to test them on local simulators or physical devices.

---

## 8. Complete 74-item checklist

### Setup & Architecture
- [ ] Initialize Expo project with TypeScript template inside `MobileApp/`
- [ ] Create 9 subdirectories under `src/` (screens, navigation, components, hooks, services, store, utils, theme, assets)
- [ ] Configure `package.json` and install the 30 required packages
- [ ] Setup `eas.json` with development, preview, and production profiles
- [ ] Create `src/theme/ThemeContext` with dark/light colors and typography tokens
- [ ] Initialize Zustand stores (`authStore`, `notifStore`, `themeStore`)
- [ ] Create Axios instance with base URL and JWT token headers
- [ ] Implement Concurrent Refresh Token queue handling 401 statuses in Axios
- [ ] Configure TanStack QueryClient with globally disabled query retries for 401/403/404/422

### Screen 1 — Auth
- [ ] Create Login screen with email, password, and Yup form validator
- [ ] Build role-based redirect pathways after authentication
- [ ] Build biometric authentication toggle using `expo-local-authentication`
- [ ] Implement session recovery querying GET `/auth/me` on startup
- [ ] Build Demo Mode chips pre-filling credentials for all 4 roles

### Screen 2 — Dashboard
- [ ] Build Admin Dashboard layout (users counts, vendors, spends)
- [ ] Build Procurement Dashboard layout (open RFQs, pending approvals, recent POs)
- [ ] Build Manager Dashboard layout (approvals counts, charts overview)
- [ ] Build Vendor Dashboard layout (quote biddings, PO tracker, revenue)
- [ ] Add role-specific quick action triggers (Create RFQ, Approve, Bid)

### Screen 3 — Vendor Management
- [ ] Build supplier list view with categories filter and search bars
- [ ] Build detailed profile cards displaying GST, rating stats, and banking info
- [ ] Build vendor invitation forms (Admin-only)
- [ ] Build supplier account toggle controllers (Admin-only)
- [ ] Build vendor self-profile update screens

### Screen 4 — RFQ Creation
- [ ] Build 3-step RFQ wizard (title details -> items table -> vendor multi-select)
- [ ] Build auto-saving of RFQ form drafts to AsyncStorage
- [ ] Build dynamic item lists with addition/removal buttons
- [ ] Build vendor select panels filtering by category tags
- [ ] Build spec attachment uploading with 10MB file limit validation
- [ ] Build RFQ cancel forms with reason comment inputs
- [ ] Build vendor RFQ invitation inboxes

### Screen 5 — Quotation Submission
- [ ] Build RFQ specification view for vendors
- [ ] Build quotation form (unit prices, tax rates, delivery schedules)
- [ ] Implement bid editing triggers (before PO is generated)
- [ ] Build bid status timeline components
- [ ] Build quotation PDF layout generators

### Screen 6 — Quotation Comparison
- [ ] Build horizontal side-by-side quote tables
- [ ] Highlight cells/columns containing the lowest price in green
- [ ] Display delivery timelines side-by-side
- [ ] Display vendor ratings cards side-by-side
- [ ] Build selection confirmation dialogs
- [ ] Build shortlist actions triggering manager approvals

### Screen 7 — Approval Workflow
- [ ] Build Manager approval queue views
- [ ] Build detailed request panels showing timelines and quote PDFs
- [ ] Build one-tap Approve/Reject buttons with comments modals
- [ ] Build optimistic updates for instant dashboard refresh on actions
- [ ] Build status badge styling mapping request outcomes

### Screen 8 — PO & Invoice
- [ ] Build PO generator templates (Procurement-only, post-manager approval)
- [ ] Build PO details display with grand totals and tax breakdowns
- [ ] Build WebView PDF renderers with Print and Email sharing actions
- [ ] Build PO delivery status updates for vendors (acknowledged -> transit -> delivered)
- [ ] Build invoice generation sheets with tax details (Vendor-only)
- [ ] Build Mark Paid forms with payment transaction references (Procurement-only)
- [ ] Build PO QR code generation
- [ ] Build PO QR code scanner scanner tool

### Screen 9 — Notifications & Logs
- [ ] Build swipe-to-read notification lists
- [ ] Build numerical unread count badges on tab bars
- [ ] Build system logs feeds for admins and managers
- [ ] Build Expo Notification integrations
- [ ] Build one-tap actions from notification banners

### Screen 10 — Reports & Analytics
- [ ] Build monthly spending charts using Victory Native area charts
- [ ] Build supplier scorecards using Victory Native radar/bar charts
- [ ] Build category budget pies using Victory Native donut charts
- [ ] Build approval analytics widgets (approved vs rejected percentages)
- [ ] Build export reports routes downloading CSV formats
- [ ] Build calendar date filter inputs

### Unique Add-ons
- [ ] Build Claude AI vendor recommendation widget using secure backend proxy
- [ ] Build vendor rating feedback forms (1-5 stars rating) after delivery
- [ ] Build dark mode Toggle persisting configurations locally
- [ ] Build document camera scanner capturing Spec sheets
- [ ] Build lists skeleton loading components
- [ ] Build pull-to-refresh feeds
- [ ] Build empty state illustrations
- [ ] Build haptic feedback alerts on actions and errors

---

### Security Checklist
- [ ] Store API keys/secrets only on the backend (Anthropic key proxy via backend)
- [ ] Save auth tokens exclusively in `expo-secure-store`
- [ ] Build request cancellation on page unmounts
- [ ] Validate maximum upload file size of 10MB and restrict mimeTypes
- [ ] Integrate screen capture blocking on sensitive payment screens

---

## 9. Getting started

### Installation Steps
1. Navigate into the mobile directory:
   ```bash
   cd "Mobile App"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables Config
Create a `.env` file in the root of the mobile directory matching the following configuration:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api/v1
EXPO_PUBLIC_USE_MOCKS=true
EXPO_PUBLIC_DEMO_MODE=true
```
*(Note: Use `10.0.2.2` to target local backend instances inside Android Emulators, or local network IPs for physical devices)*

### Local Development Running
- **Running in Expo Go (Mock Mode)**:
  ```bash
  npx expo start
  ```
- **Running in Development Builds (Required for Push/Biometrics/Scanner)**:
  ```bash
  # Compile local client binary for simulators
  npx expo run:ios
  npx expo run:android
  ```
- **EAS Build commands**:
  ```bash
  # Configure EAS on your account
  eas build:configure
  
  # Build a local development build
  eas build --profile development --platform all
  ```

### 5 Open Questions for the Team
1. **FCM Project Credentials**: Has the team registered a Firebase project to generate the `google-services.json` and `GoogleService-Info.plist` files required for remote push alerts?
2. **Backend AI Proxy URL**: Will the backend team implement `/api/v1/ai/recommend-vendor` to securely wrap the Claude API, or should we define a temporary local mock script?
3. **Local Dev IP**: What local Wi-Fi IP ranges will the backend developers share during the hackathon to configure the dev server URLs?
4. **Offline Sync Model**: Do we require local database syncs (e.g. WatermelonDB) or is the NetInfo network checker and offline submission lock sufficient for the hackathon MVP?
5. **App Store Provisioning**: Are team Apple/Google developer accounts configured in EAS to compile custom IPA/APK test builds before presentation day?

---

*Built for Oddo Hackathon 2026*
