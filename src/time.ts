const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatDate(date: Date) {
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]}, ${date.getUTCFullYear()}`
}

export function fullDate(date: Date) {
  return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`
}
