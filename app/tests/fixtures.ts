import { PrismaClientKnownRequestError } from '@prisma/client/runtime/index.js'

// https://www.prisma.io/docs/reference/api-reference/error-reference#prisma-client-query-engine
export const prismaErrors = {
  P2000: "The provided value for the column is too long for the column's type.",
  P2001:
    'The record searched for in the where condition ({model_name}.{argument_name} = {argument_value}) does not exist',
  P2002: 'Unique constraint failed on the {constraint}',
  P2003: 'Foreign key constraint failed on the field: {field_name}',
  P2004: 'A constraint failed on the database: {database_error}',
  P2005:
    "The value {field_value} stored in the database for the field {field_name} is invalid for the field's type",
  P2006:
    'The provided value {field_value} for {model_name} field {field_name} is not valid',
  P2007: 'Data validation error {database_error}',
  P2008: 'Failed to parse the query {query_parsing_error} at {query_position}',
  P2009:
    'Failed to validate the query: {query_validation_error} at {query_position}',
  P2010: 'Raw query failed. Code: {code}. Message: {message}',
  P2011: 'Null constraint violation on the {constraint}',
  P2012: 'Missing a required value at {path}',
  P2013:
    'Missing the required argument {argument_name} for field {field_name} on {object_name}.',
  P2014:
    "The change you are trying to make would violate the required relation '{relation_name}' between the {model_a_name} and {model_b_name} models.",
  P2015: 'A related record could not be found. {details}',
  P2016: 'Query interpretation error. {details}',
  P2017:
    'The records for relation {relation_name} between the {parent_name} and {child_name} models are not connected.',
  P2018: 'The required connected records were not found. {details}',
  P2019: 'Input error. {details}',
  P2020: 'Value out of range for the type. {details}',
  P2021: 'The table {table} does not exist in the current database.',
  P2022: 'The column {column} does not exist in the current database.',
  P2023: 'Inconsistent column data: {message}',
  P2024:
    'Timed out fetching a new connection from the connection pool. (More info: http://pris.ly/d/connection-pool, Current connection limit: {connection_limit})',
  P2025:
    'An operation failed because it depends on one or more records that were required but not found. {cause}',
  P2026:
    "The current database provider doesn't support a feature that the query used: {feature}",
  P2027:
    'Multiple errors occurred on the database during query execution: {errors}',
  P2030:
    'Cannot find a fulltext index to use for the search, try adding a @@fulltext([Fields...]) to your schema'
}

export const prismaError = (code: keyof typeof prismaErrors) =>
  new PrismaClientKnownRequestError(prismaErrors[code], code, 'TEST')

export const userAgents = {
  linux:
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1',
  android:
    'Mozilla/5.0 (Linux; Android 8.0.0; SM-G960F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.84 Mobile Safari/537.36',
  chromeos:
    'Mozilla/5.0 (X11; CrOS x86_64 8172.45.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.64 Safari/537.36',
  iphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1',
  macos:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9',
  windows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246'
}
