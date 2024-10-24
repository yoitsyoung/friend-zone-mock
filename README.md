# Getting Started

## Telegram Bot

1. Install dependencies

```sh
yarn
```

2. Enter environment variables

```sh
cp .env.template .env
```

3. Initialize Supabase on dev

```
supabase init
# Copy Postgres URL to .env
cd ./bot/prisma
npx prisma migrate dev --name your_migration_name
```

4. Start redis-server

```sh
redis-server
```


5. Run bot

```sh
yarn dev
```

## Contracts

1. Install dependencies

```sh
yarn
```

2. Build contracts

```sh
yarn build
```

3. Run tests

```sh
yarn test
```

# Current TODOs / Issues

- Selling of shares doesn't work with Jetton token standard
- More e2e tests
  - make sure users cannot sell other users' share
  - make sure owners cannot sell other users' shares

- Daily Personal Allowance and Daily Tipping Allowance Logic
- Sybil defense during user registration
