'use strict'

const memcached = require('memcached')

function createMemcachedClient() {
	this._cliente = new memcached('localhost:11211', {
		retries: 10,
		retry: 10000,
		remove: true
	})
} 

createMemcachedClient.prototype.set = function(chave, args, tempo, callback) {
	this._cliente.set(chave, args, tempo, callback)
}

createMemcachedClient.prototype.get = function(chave, callback) {
	this._cliente.get(chave, callback)
}

/*cliente.set('pagamento-20', {id: 20}, 60000, (err) => {
	console.log('nova chave adicionada ao cache: pagamento-20')
})

cliente.get('pagamento-20', (err, ret) => {
	if(err || !ret)
		return console.log('MISS - chave nao encontrada')
	console.log('HIT - chave: ' + JSON.stringify(ret))
})*/

module.exports = () => {
	return createMemcachedClient
}