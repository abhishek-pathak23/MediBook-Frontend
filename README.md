# MediBook - Frontend Application

Welcome to the frontend repository for the **MediBook** platform. This repository contains the modern, responsive Web Client built with Angular 21, designed to connect Patients, Healthcare Providers, and Platform Administrators seamlessly.

## 🚀 Overview

The MediBook Frontend is the user-facing application for the MediBook healthcare platform. It interfaces with our suite of PostgreSQL-backed .NET microservices to deliver a cohesive experience for booking appointments, managing schedules, handling payments, and facilitating seamless healthcare interactions.

## 🏗️ Architecture & Technologies

- **Framework**: Angular 21
- **Styling**: SCSS with a responsive, modern, and highly interactive dynamic design.
- **Real-Time Communications**: SignalR (via `@microsoft/signalr`) for live appointment status updates, notifications, and dynamic UI refreshes.
- **Payment Processing**: Seamless Razorpay integration for fast and secure consultation payments.
- **State Management**: Reactive programming using robust RxJS patterns.
- **Deployment Strategy**: Serverless Edge deployment on **Vercel** (`vercel.json` specifically configured for proper SPA routing and build output).

## 📂 Project Structure

The codebase strictly follows a clean, feature-based module structure, primarily located in `src/app/`:

- **`core/`**: Singleton services, HTTP interceptors (for JWT and error handling), and route guards.
- **`features/`**:
  - `admin/`: Centralized dashboard and platform-wide management functionalities.
  - `auth/`: Login, registration, and comprehensive JWT token lifecycle handling.
  - `patient/`: Medical history viewing, appointment booking workflows, and searching for healthcare providers.
  - `provider/`: Availability and schedule management, appointment dashboard, and patient record access.
  - `shared/`: Highly reusable UI components, forms, pipes, and custom directives.

## ⚙️ Environment Configuration

The application is designed to communicate with a microservices ecosystem (either locally or routed through an API Gateway). Environment files (`environment.ts` for production, `environment.development.ts` for local execution) handle the service URL mappings and third-party keys.

### Local Development Setup

To run this application locally and point it to your locally running microservices:

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd MediBook-Frontend/MediBook-Frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Ensure `src/environments/environment.development.ts` has the correct endpoints mapped to your locally running .NET microservices (e.g., `http://localhost:5002` for Auth, `http://localhost:5003` for Appointments, etc.) as well as your local test `razorpayKey` and your backend SignalR hub.

4. **Run the development server:**
   ```bash
   npm run start
   ```
   Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## ☁️ Deployment (Vercel)

This project is fully configured for continuous deployment on the **Vercel** platform. 

- The custom `vercel.json` configuration file provided in the repository root handles the project's build command (`cd MediBook-Frontend && npm install && npm run build`), sets the proper output directory (`dist/MediBook-Frontend/browser`), and rewrites all route traffic to `index.html` to support Angular's client-side routing logic.
- **Production Connections:** When deploying, verify that the production `environment.ts` maps correctly to the live .NET API Gateway running on Render, and that production Razorpay API keys are active.

---
*Built for modern healthcare delivery.*
