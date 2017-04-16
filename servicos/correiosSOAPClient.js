'use strict'

const soap = require('soap')

function CorreiosSOAPClient() {
	this._url = 'http://ws.correios.com.br/calculador/CalcPrecoPrazo.asmx?wsdl'
}

CorreiosSOAPClient.prototype.calculaPrazo = function(args, callback) {

	soap.createClient(this._url, (erro, cliente) => {

		console.log('cliente soap criado')

		cliente.CalcPrazo(args, callback)

	})
}

module.exports = () => {
	return CorreiosSOAPClient
}