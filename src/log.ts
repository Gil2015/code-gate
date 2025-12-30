export function info(msg: string) {
  process.stdout.write(msg + '\n')
}

export function warn(msg: string) {
  process.stderr.write(msg + '\n')
}

export function error(msg: string) {
  process.stderr.write(msg + '\n')
}
