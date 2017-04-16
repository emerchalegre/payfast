'use strict'

module.exports = (app) => {
	app.post('/correios/calculo-prazo', (req, res) => {
		let dadosEntrega = req.body
		console.log(dadosEntrega)
		let correiosSOAPClient = new app.servicos.correiosSOAPClient()

		correiosSOAPClient.calculaPrazo(dadosEntrega, (erro, resultado) => {
			if(erro) { 
				console.log(erro) 
				return res.status(500).send(erro)
			}

			console.log("prazo calculado")
			res.json(resultado)
		})

	})
}