'use strict'

const cluster = require('cluster')
const os = require('os')

let cpus = os.cpus()

console.log('trabalhando com threads')

if(cluster.isMaster) {
  console.log('thred master')

  cpus.forEach(() => {
    cluster.fork()
  })

  cluster.on('listening', (worker) => {
    console.log('Listening cluster PID: ' + worker.process.pid)
  })

  cluster.on('exit', (worker) => {
    console.log('Cluster % desconectado. Reconectado...', worker.process.pid)
    cluster.fork()
  })

} else {
    console.log('thread slave')
    require('./index')
}
