# Lift Log

A mobile-first workout tracker built with React, TypeScript, and Vite.

Lift Log helps you manage exercises, exercise variants, routines, workout history, and JSON backups in a clean dark-mode interface. The app is also configured as a Progressive Web App (PWA), so it can be installed on supported devices and used with basic offline support.

## Features

- Mobile-first responsive UI
- Clean dark-mode design
- Bottom navigation
- Routines management
- Exercises management
- Exercise variants
- Workout logging
- Workout history
- Edit past workout logs
- Weight unit toggle
- Swap variant for today
- Import / export app data as JSON
- Download JSON template
- PWA support
- Installable on supported desktop and mobile devices

## Tech Stack

- React
- TypeScript
- Vite
- React Router
- Zustand
- vite-plugin-pwa
- Vercel

## Getting Started

### 1. Install dependencies

    npm install

### 2. Start the development server

    npm run dev

### 3. Build for production

    npm run build

### 4. Preview the production build

    npm run preview

## Project Structure

    src/
      app/
      components/
      pages/
      store/
      styles/
      utils/
    public/

## Data Storage

At the moment, Lift Log stores data locally in the browser on the current device.

To reduce the risk of losing data, the app includes built-in JSON export and import features so users can create backups and restore them later.

## PWA

Lift Log is configured as a Progressive Web App.

It includes:

- Web app manifest
- Service worker
- Installable experience on supported devices
- Offline-ready app shell

## Available Scripts

- `npm run dev` — start the local development server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint

## Deployment

This project is deployed with Vercel.

## Current Status

The app currently supports local-first usage with import/export as a backup strategy.

Authentication, cloud sync, and database persistence are planned for future development.