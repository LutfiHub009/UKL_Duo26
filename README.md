# UKL_Duo26

A modern full-stack web application built with **Next.js 16**, **React 19**, and **Tailwind CSS v4**. This project features a multi-role dashboard system, an integrated marketplace, and a responsive, accessible UI powered by **shadcn/ui**.

## Features

- **Authentication System**: Secure login and registration flows.
- **Role-Based Access Control**:
  - `Customer` dashboard and routes.
  - `Moderator` dashboard and routes.
- **Marketplace**: Dedicated marketplace section for browsing and managing items.
- **User Management**: User profiles and account settings.
- **Modern UI/UX**:
  - Built with Tailwind CSS v4.
  - Interactive components using shadcn/ui.
  - Dark/Light mode support via `next-themes`.
  - Notifications via `sonner` and `react-toastify`.
  - Icons from `lucide-react` and `react-icons`.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: Lucide React & React Icons
- **Language**: TypeScript

## Project Structure

```
app/
├── api/          # Next.js API Routes
├── buildss/      # Buildss section
├── customer/     # Customer-facing pages
├── dashboard/    # Main user/admin dashboard
├── login/        # Authentication - Login
├── register/     # Authentication - Register
├── marketplace/  # Marketplace feature
├── moderator/    # Moderator-specific views
├── profile/      # User profile management
└── settings/     # Application/User settings
```
## Update Lokalisasi!

Mengganti bahasa menjadi Bahasa Indonesia untuk lokalisasi.
Patched akses untuk user customer.

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository (if you haven't already):
   ```bash
   git clone https://github.com/LutfiHub009/UKL_Duo26.git
   cd UKL_Duo26
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

### Running the Development Server

Start the development server (configured to run on port 6700):

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:6700](http://localhost:6700) with your browser to see the result.

### Build for Production

To build the project for production, run:

```bash
npm run build
```

Then start the production server:

```bash
npm run start
```

## Available Scripts

- `npm run dev`: Starts the Next.js development server on port 6700.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for linting errors.

## Learn More

To learn more about Next.js, take a look at the following resources:
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

---
*Generated and structured for Next.js App Router projects.*
