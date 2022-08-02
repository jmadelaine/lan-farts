import os from 'os'

export const scheme = 'http'
export const host = os.networkInterfaces().en0.find(ni => ni.address.includes('192.168.')).address
export const port = 6969
export const url = `${scheme}://${host}:${port}`
