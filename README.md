# f

production-ready fastify boilerplate, fully type-safe from database modeling to API response 🤘

[![Run in Insomnia}](https://insomnia.rest/images/run.svg)](https://insomnia.rest/run/?label=f&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fbwyx%2Ff%2Fmain%2Finsomnia.json)

## Features

- **Authentication**: JWT, internally using [fast-jwt](https://npm.im/fast-jwt)
- **Database ORM**: [Prisma](https://www.prisma.io/), supports **PostgreSQL** (configured), **MySQL**, **SQL Server**, **SQLite** and **MongoDB**
- **Validation**: request-response validation using [Ajv](https://ajv.js.org/)
- **Testing**: using [Mocha](https://mochajs.org/), assertion from [Chai](https://www.chaijs.com/), and [Sinon](https://sinonjs.org/) for mocks
- **Environment variables**: using [env-schema](https://npm.im/env-schema), a [dotenv](https://npm.im/dotenv) with [Ajv](https://ajv.js.org/) validation
- **Git hooks**: with [husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged)
- **Linting**: with [ESLint](https://eslint.org) and [Prettier](https://prettier.io)

### API Endpoints

List of available routes:

**Auth Token**:\
`POST /auth/register` - register\
`POST /auth/login` - login\
`POST /auth/logout` - logout, to invalidate refresh token\
`GET /auth/sessions` - get all active session\
`POST /auth/refresh-tokens` - refresh auth tokens\
`POST /auth/send-verification-email` - send verification token to user's email\
`POST /auth/verify-email` - verify user email

**User routes**:\
`POST /users` - create a user\
`GET /users` - get all users\
`DELETE /users/:userId` - delete user
