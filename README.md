# f
production-ready fastify boilerplate, fully type-safe from database modeling until API response 🤘

## Features
- **Authentication**: JWT using [fast-jwt](https://npm.im/fast-jwt)
- **Database ORM**: [Prisma](https://www.prisma.io/), supports **PostgreSQL** (configured), **MySQL**, **SQL Server**, **SQLite** and **MongoDB**
- **Validation**: request-response validation using [Ajv](https://ajv.js.org/)
- **Testing**: using [Mocha](https://mochajs.org/), assertion from [Chai](https://www.chaijs.com/), and [Sinon](https://sinonjs.org/) for mocks
- **Environment variables**: using [env-schema](https://npm.im/env-schema), a [dotenv](https://npm.im/dotenv) with [Ajv](https://ajv.js.org/) validation
- **Git hooks**: with [husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged)
- **Linting**: with [ESLint](https://eslint.org) and [Prettier](https://prettier.io)

