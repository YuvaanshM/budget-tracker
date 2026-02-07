# UI Design Document: Budget Tracker (Multi-Page Blueprint)

## 1. Visual Strategy & Branding
* **Theme:** "Sleto" Glassmorphic Dark.
* **Core Principle:** Information Density vs. Visual White Space. Large currency values, small muted labels.
* **Global Elements:** 1px borders (`border-white/10`), `backdrop-blur-md`, and 16px (1rem) border-radius.

---

## 2. Page-Specific Blueprints

### 2.1 Dashboard (Home)
**Purpose:** At-a-glance financial health.
* **Top Row:** Three small cards: `Total Income`, `Total Expenses`, `Remaining Budget`.
* **Middle Row (Main Content):** * **Left (60%):** Area Chart showing spending trends over 30 days.
    * **Right (40%):** Donut Chart for "Spending by Category."
* **Bottom Row:** * **Left (50%):** "Upcoming Bills" or "Budget Alerts" list.
    * **Right (50%):** Mini-table of the 5 most recent transactions.

### 2.2 Expense History Page
**Purpose:** Search, filter, and audit data.
* **Header:** Search bar (Search by description) + Filter Pills (Daily, Weekly, Monthly, Yearly).
* **Table View:** A clean, spacious list. 
    * *Columns:* Date, Category (with icon), Description, Amount (Red text for expense, Green for income).
* **Interaction:** Clicking a row opens a "Slide-over" panel (Drawer) to edit or delete the transaction.

### 2.3 Budgets & Alerts Page
**Purpose:** Limit management.
* **Grid Layout:** A series of "Progress Cards."
    * *Card Design:* Category name (Top Left), $ Remaining (Top Right).
    * *Progress Bar:* Thick bar that changes color (Green < 50%, Yellow 50-80%, Red > 80%).
* **Action:** "Create New Budget" button opens a modal to link a category to a monthly limit.

### 2.4 Shared Budgets (Collaboration)
**Purpose:** Multiplayer finance.
* **Budget Selector:** A tabs-style navigation to switch between "Personal" and "Shared" views.
* **Collaborator Bar:** A row of user avatars at the top of the page.
* **Activity Feed:** A small sidebar or list showing *"Sarah added $40 for Groceries"* to provide social context for spending.

### 2.5 Settings & Profile
**Purpose:** Customization.
* **Sections:** * *Profile:* Avatar upload, Email update.
    * *Preferences:* Default currency, Toggle for "AI Auto-Categorization."
    * *Data:* "Export to CSV" and "Wipe All Data" (Danger Zone).

---

## 3. Global UI Components

### 3.1 The "Universal Add" FAB (Floating Action Button)
* **Position:** Bottom-right corner (Mobile) or Top-right Header (Desktop).
* **UI:** Large `+` icon with a purple-to-blue gradient.
* **Logic:** Opens a centered modal with an immediate focus on the "Amount" input.

### 3.2 Navigation System
* **Desktop:** Fixed left sidebar. Icons only on smaller desktops, Icons + Labels on large screens.
* **Mobile:** Bottom Tab Bar (Home, History, Budgets, Settings).

---

## 4. Interaction Design (Framer Motion)
* **Page Transitions:** Soft "Fade and Slide" (`initial: {opacity: 0, y: 10}`).
* **Hover States:** Cards should lift slightly (`scale: 1.02`) and border-color should brighten.
* **Budget Alerts:** If a budget is exceeded, the progress bar should have a subtle "pulse" animation.

---

## 5. Responsive Strategy
| Feature | Desktop | Mobile |
| :--- | :--- | :--- |
| **Charts** | Side-by-side | Stacked vertically |
| **Table** | Multi-column table | Card-based list |
| **Sidebar** | Visible | Hidden (Burger menu or Bottom bar) |
| **Modals** | Centered Overlay | Bottom Sheet (Slide up from bottom) |
