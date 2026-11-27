<div align="center">

# Picko

**Arabic-first order management for fast-moving counters: live order board, QR order tracking, printing and customer ratings.**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TanStack Start](https://img.shields.io/badge/TanStack_Start-000000?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)

</div>

---

## Overview

Picko gives a cashier one screen to receive orders, move them through their stages and hand the customer a tracking code. Customers follow their own order from a QR code, with no app and no account.

## Features

- **Cashier board**: live view of incoming orders and their status.
- **Orders and archive**: full order list plus a searchable archive of finished orders.
- **QR tracking**: every order gets a token and a public tracking page (`/track/:token`).
- **Printing**: order slips and QR codes ready to print.
- **Ratings**: customers rate their order, and the owner reviews ratings in one place.
- **Settings**: configure the shop from inside the app.
- **Arabic-first interface**: right-to-left layout and Arabic copy throughout.

## Tech stack

| Layer | Tools |
|---|---|
| App framework | TanStack Start, TanStack Router |
| UI | React, TypeScript, Tailwind CSS |
| Data | Supabase, Drizzle migrations |

## Getting started

```bash
git clone https://github.com/M12803/Picko_V01.git
cd Picko_V01
npm install
npm run dev
```

Open the local URL printed in the terminal. Copy the environment variables your Supabase project needs into a local `.env` file before running against real data.

## Project structure

```text
src/
  routes/        File-based routes: board, orders, archive, qr, ratings, settings, track
  features/picko/  Views and logic for the order workflow
drizzle/         Database migrations
supabase/        Supabase configuration
public/          Static assets
```

## Author

Built by [Mohamed Adel Fouda](https://github.com/M12803), founder of PyramedX.
