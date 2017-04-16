const fs = require('fs')

module.exports = (app) => {
	app.post('/upload/imagem', (req, res) => {
		console.log('recebendo uma imagem')

		let filename = req.headers.filename

		req
			.pipe(fs.createWriteStream('files/' + filename))
			.on('finish', () => {
				console.log('arquivo gravado')
				res.status(201).send("OK")
			})

	})
}