const fs = require('fs')

fs.createReadStream('imagem.jpg')
	.pipe(fs.createWriteStream('imagem3.jpg'))
	.on('finish', () => {
		console.log('terminado')
	})