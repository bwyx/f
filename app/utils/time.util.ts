import { parse } from '@lukeed/ms'

export const parseTime = (timeString: string) => {
  const parsedTime = parse(timeString)

  if (!parsedTime || typeof parsedTime !== 'number') {
    throw new Error(`Invalid time format: ${timeString}`)
  }

  return parsedTime
}

export default { parseTime }
