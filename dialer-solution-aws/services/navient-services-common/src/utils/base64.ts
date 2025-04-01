export function decodeBase64(base64: string) {
    const buff = Buffer.from(base64, 'base64')
    return buff.toString('utf-8')
}

export function encodeBase64(str: string) {
    return Buffer.from(str).toString('base64')
}