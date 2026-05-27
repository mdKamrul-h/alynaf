# AlyNaf — UK to Bangladesh Shopping & Shipping

Website for [AlyNaf](https://www.facebook.com/alynaf2019) — order products from UK retailers and get them delivered to your doorstep in Bangladesh.

## Features

- **Landing page** — brand story, how it works, supported UK retailers
- **Place Order** — submit product URLs with size/color, delivery details, and payment preference
- **Track Order** — check order status with order number + phone
- **Admin Dashboard** — manage orders and update status (`/admin`)
- **WhatsApp integration** — direct chat link for inquiries

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Pages

| Route    | Description              |
| -------- | ------------------------ |
| `/`      | Home page                |
| `/order` | Place a new order        |
| `/track` | Track existing order     |
| `/admin` | Admin order dashboard    |

## Admin Access

Default admin key: `alynaf-admin`

Set a secure key in production:

```bash
cp .env.example .env.local
# Edit ADMIN_KEY in .env.local
```

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- SQLite (better-sqlite3) for order storage

## Contact (AlyNaf)

- Email: alynaf2019@gmail.com
- Phone: 01991-198339
- WhatsApp: +880 1991-198339
