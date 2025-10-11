# Hungry House Hub - AI-Powered Restaurant Management Dashboard

A modern, AI-enabled restaurant administration dashboard built with Next.js, Firebase, and Google Gemini to streamline menu management and order processing.

## Detailed Project Overview

Hungry House Hub is a comprehensive web application designed to help restaurant owners and staff efficiently manage their day-to-day operations. This is not just a standard CRUD application; it integrates advanced AI capabilities with Google's Gemini AI, implemented via the Genkit framework, to specifically automate and accelerate the menu creation process.

The project utilizes a Next.js-based frontend built with ShadCN UI and Tailwind CSS, providing a clean, responsive, and user-friendly interface. All backend operations, including data storage (Firestore) and user authentication (Firebase Auth), are managed by Google Firebase.

Its standout feature is the AI-powered bulk menu uploader. Users can paste a menu in a plain text format, and the system automatically extracts the dish name, price, and category, generates compelling descriptions using AI, and even finds relevant images from the web, reducing the time to add new items by up to 90%.

## Complete Features List

- **Admin Authentication**: Secure admin login and logout using email and password.
- **Dashboard**: A comprehensive overview of all recent orders, including their status (Pending, Completed).
- **Menu Management**:
    - Add, view, update, and delete menu items.
    - Includes fields for name, price, description, category, and vegetarian/non-vegetarian status.
    - Dynamically manage categories (create/delete).
- **AI-Powered Bulk Upload**:
    - **Raw Text Parsing**: Intelligently parses menu items from plain text, distinguishing between categories and items.
    - **AI-Generated Descriptions**: Automatically generates unique and appealing descriptions for each menu item using Google Gemini.
    - **AI-Image Discovery**: Automatically finds relevant, high-quality stock image URLs for each dish by searching the web.
    - **Review Interface**: A user-friendly interface to review and edit the AI-generated data before final submission to the database.
- **Order Management**:
    - Enter new customer orders through an intuitive interface.
    - Update the status of orders from 'Pending' to 'Completed'.
    - Delete or view individual orders.
- **Invoice Generation**:
    - Automatically generates a detailed invoice upon order placement.
    - Calculates subtotal, CGST, SGST, and total amount.
    - Print-friendly view of the invoice for easy record-keeping.

## Correct Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 14+ (React 18)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Backend & Database**: [Firebase](https://firebase.google.com/) (Firestore, Firebase Authentication)
- **AI Integration**: [Google Gemini](https://deepmind.google.com/technologies/gemini/) (via [Genkit](https://firebase.google.com/docs/genkit))
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [ShadCN UI](https://ui.shadcn.com/)
- **State Management**: React Context API (`AppContext.tsx`)
- **Schema Validation**: [Zod](https://zod.dev/) (for data integrity in Genkit flows)

## Architecture Explanation

The architecture of this application follows a clear separation between the frontend, backend, and AI services.

1.  **Frontend**: The Next.js app resides in the `src/` directory. It handles the user interface, client-side navigation, and user interactions. `AppContext.tsx` acts as the central state management, encapsulating all Firebase operations.
2.  **Backend (Firebase)**: Firebase serves as the backend.
    - **Firestore**: Used to store all application data in collections like `menu-items`, `categories`, and `orders`.
    - **Firebase Auth**: Securely manages admin user accounts.
3.  **AI Workflow (Genkit)**: The AI-powered bulk upload feature is implemented using Genkit.
    - **Trigger**: When a user pastes text into the `BulkUploader.tsx` component and clicks "Generate & Review", it triggers a Genkit flow.
    - **Processing**: A central Genkit flow named `generateBulkItems` orchestrates other flows in parallel:
        - `generateDescription`: Creates a description for each item.
        - `findImageUrl`: Finds an image URL for each item.
    - **Data Validation**: Zod is used to ensure that the responses from the AI model adhere to the expected format, increasing the system's robustness.
    - **Result**: The processed data is sent back to the frontend for review and then saved to Firestore upon confirmation.

## Who is it for?

- **Restaurant Admins/Staff**: The primary users who will manage the menu, take orders, and oversee daily operations.
- **Developers**: Who want to maintain, extend, or contribute to this project.
- **Stakeholders**: Restaurant owners or managers who want to implement a modern, efficient solution for their establishment.

## Installation and Setup

To run this project locally, follow these steps:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/prurshottam1st/restaurant-admin-dashboard.git
    cd restaurant-admin-dashboard
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up Firebase**:
    - Create a new Firebase project in the [Firebase Console](https://console.firebase.google.com/).
    - Add a web app (`</>`) and copy your Firebase configuration keys.
    - Create a file named `.env.local` in the root directory of the project.
    - Add your Firebase keys in this format:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
    NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
    ```
    - Enable Firestore and Firebase Authentication.

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

5.  Open the application at [http://localhost:3000](http://localhost:3000).

## Usage and Example flows

- **Login**: Go to `/login` and use your admin credentials (you will need to create the user in the Firebase console first).
- **Adding an Item**: Go to `/menu`, click "Add New Item", fill out the form, and submit.
- **Placing an Order**: On the home page (`/`), select a category, add items with quantities, and click "Place Order".
- **AI Bulk Upload**: Go to `/menu`, select "Bulk Upload", paste your raw menu text, and let the AI do its magic.

## Contributing Guidelines

Contributions are welcome! Please follow these steps:

1.  Fork this repository.
2.  Create a new feature branch (`git checkout -b feature/AmazingFeature`).
3.  Make your changes and commit them (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a pull request.

## Credits

- **Lead Developer**: [Prurshottam](https://github.com/prurshottam1st)
- **Core Technologies**: [Next.js](https://nextjs.org/), [Firebase](https://firebase.google.com/), [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **AI Model**: [Google Gemini](https://deepmind.google.com/technologies/gemini/)

## License, Support and Contact

- **License**: This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
- **Support**: For any issues or questions, please open a ticket on GitHub Issues.
- **Contact**: prurshottam1st@example.com
