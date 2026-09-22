const builtIn = [
  'anal', 'anus', 'arse', 'arsehole', 'ass', 'asshole', 'bastard', 'bitch',
  'blowjob', 'bollocks', 'boner', 'boob', 'boobs', 'bukkake', 'bullshit',
  'cock', 'coon', 'cum', 'cunt', 'dick', 'dickhead', 'dildo', 'dyke',
  'ejaculate', 'fag', 'faggot', 'fap', 'fuck', 'fucker', 'fucking', 'gangbang',
  'handjob', 'hentai', 'horny', 'incest', 'jerkoff', 'jizz', 'kike', 'milf',
  'motherfucker', 'nigga', 'nigger', 'nsfw', 'nude', 'nudes', 'paki', 'pedo',
  'pedophile', 'penis', 'porn', 'porno', 'pornhub', 'prick', 'pussy', 'rape',
  'rapist', 'retard', 'retarded', 'rimjob', 'scat', 'semen', 'sex', 'sexo',
  'shit', 'slut', 'spic', 'tits', 'titties', 'tranny', 'twat', 'vagina',
  'wank', 'wanker', 'whore',
]

const leet: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b',
  '@': 'a', '$': 's', '!': 'i', '|': 'i', '+': 't',
}

function flatten(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9@$!|+\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function deLeet(text: string) {
  return text.replace(/[01345678@$!|+]/g, ch => leet[ch] ?? ch)
}

// Matching a+s+s+ rather than the literal word catches "fuuuuck" and "shitttt"
// without collapsing repeats, which would turn "ass" into "as" and start
// flagging ordinary sentences.
function elongated(word: string) {
  return [...word].map(ch => (ch === ' ' ? '\\s+' : `${ch}+`)).join('')
}

export function buildFilter(extra: string[], useBuiltIn: boolean) {
  const words = [...(useBuiltIn ? builtIn : []), ...extra]
    .map(word => deLeet(flatten(word)))
    .filter(word => /^[a-z0-9 ]+$/.test(word))

  if (!words.length) return () => false

  const pattern = new RegExp(`(?:^|\\s)(?:${words.map(elongated).join('|')})(?:$|\\s)`)

  return (text: string) => {
    const flat = flatten(text)
    return pattern.test(flat) || pattern.test(deLeet(flat))
  }
}

export { builtIn }
