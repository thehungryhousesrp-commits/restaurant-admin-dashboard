# **App Name**: Hungry House Hub

## Core Features:

- Admin Authentication: Secure space prepared for admin login using username. To be implemented using Firebase Authentication (Email/Password login) and role-based claims → role: 'admin'.
- Menu Management: Admin interface for adding, editing, and deleting menu items with real-time updates to Firestore database. Includes bulk upload option (CSV/Excel import), availability toggle (in-stock/out-of-stock), category management (add/edit/remove categories), and image compression + preview before saving.
- Real-Time Menu Sync: Utilizes Firestore's onSnapshot listener to update the staff's menu in real-time based on admin changes, such as price updates or item availability changes. Implemented using React Context. Includes loading/error state handling while fetching menu and caching/offline mode using Firestore’s offline persistence.
- Order Entry: Staff interface to view menu items, create new orders by selecting items, and manage customer information. Filters display categories (e.g., 'Pizza,' 'Pasta') when those menu categories are defined. Role-based login (role: staff) restricts access to Menu Management. Includes search + filter by category, order status tracking (Pending → Preparing → Completed), and auto-generation of unique order IDs (timestamp + random string).
- Menu Item Display: Displays menu items with image, name, description, and price fetched from shared MenuContext. Shows availability status (greyed out if out-of-stock) and optional tags like “Veg 🌱”, “Spicy 🌶️”, “Chef’s Special ⭐”. Responsive design (card/grid view for tablets & PCs).
- Form Validation: Uses React Hook Form with Zod to validate forms in admin page. Includes validation for Price ≥ 0, required Image, and existing Category. Shows inline error messages (red text below input).
- Invoice Preview: Generates preview of invoice before sending to customer via email or WhatsApp. Includes restaurant branding/logo in invoice header, QR code for UPI/Pay link, multiple sharing options (Download PDF, Email, WhatsApp Share), and storing invoice copy in Firestore for admin reports.

## Style Guidelines:

- Primary color: Saturated blue (#3B82F6) to evoke trust and reliability.
- Background color: Light gray (#F9FAFB) for a clean and modern look.
- Accent color: Green (#10B981) to indicate success, such as successful updates or order placements.
- Body font: 'Inter', a grotesque-style sans-serif, will provide a modern, machined, objective, neutral look.
- Headline font: 'Space Grotesk', a sans-serif font suitable for short bursts of text.
- Lucide-react icons for a consistent and modern aesthetic.
- Two-column layout for order entry page: menu on left, order summary and customer info on right.
- Subtle fade-in animations for menu items loading and updates.