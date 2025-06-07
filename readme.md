<a href="https://weekday.so">
  <img alt="Weekday is the modern, open-source alternative to Google Calendar with smart features built in." src="https://github.com/user-attachments/assets/d2a60978-eb45-4a21-8fd1-5d562073bd9b">
</a>

<h3 align="center">Weekday Calendar</h3>

<p align="center">
    The open-source Google Calendar alternative.
    <br />
    <a href="#introduction"><strong>Introduction</strong></a> ·
    <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
    <a href="#getting-started"><strong>Getting Started</strong></a> ·
    <a href="#contributing"><strong>Contributing</strong></a>
</p>

<br/>

## Introduction

Weekday is the modern, open-source Google Calendar alternative powered with AI

## Tech Stack

- [Next.js](https://nextjs.org/) – framework
- [TypeScript](https://www.typescriptlang.org/) – language
- [Tailwind](https://tailwindcss.com/) – CSS
- [Drizzle ORM](https://orm.drizzle.team/) – ORM
- [PostgreSQL](https://www.postgresql.org/) – database
- [Better Auth](https://better-auth.com/) – authentication
- [tRPC](https://trpc.io/) – API layer
- [Turborepo](https://turbo.build/repo) – monorepo
- [Vercel](https://vercel.com/) – deployments

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- PostgreSQL database
- Google Calendar API credentials
- AI API keys (OpenAI, Anthropic, or Google)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ephraimduncan/weekday.git
   cd weekday
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Fill in your database URL, authentication secrets, and API keys.

4. Set up the database:

   ```bash
   bun run db:push
   ```

5. Start the development server:
   ```bash
   bun run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see your calendar application.

## Contributing

Here's how you can contribute:

- [Open an issue](https://github.com/ephraimduncan/weekday/issues) if you believe you've encountered a bug.
- Make a [pull request](https://github.com/ephraimduncan/weekday/pull) to add new features/make quality-of-life improvements/fix bugs.
