const minute = 60
const hour = minute * 60
const day = hour * 24

export function relative(date: Date, now = new Date()) {
  const seconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000))

  if (seconds < minute) return 'just now'
  if (seconds < hour) return `${Math.floor(seconds / minute)}m ago`
  if (seconds < day) return `${Math.floor(seconds / hour)}h ago`
  if (seconds < day * 7) return `${Math.floor(seconds / day)}d ago`
  if (seconds < day * 30) return `${Math.floor(seconds / (day * 7))}w ago`
  if (seconds < day * 365) return `${Math.floor(seconds / (day * 30))}mo ago`
  return `${Math.floor(seconds / (day * 365))}y ago`
}

export function absolute(date: Date) {
  return date.toISOString().slice(0, 10)
}
