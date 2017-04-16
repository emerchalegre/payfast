'use sctrict'

const PAGAMENTO_CRIADO = "CRIADO";
const PAGAMENTO_CONFIRMADO = "CONFIRMADO";
const PAGAMENTO_CANCELADO = "CANCELADO";

module.exports = (app) => {
  app.get('/pagamentos', (req, res) => {
    res.send('OK')
  })

  app.get('/pagamentos/pagamento/:id', (req, res) => {

    let id = req.params.id

    console.log("consultando o pagamento " + id)

    let memcachedClient = new app.servicos.memcachedClient()

    memcachedClient.get('pagamento-' + id, (err, ret) => {
      if (err || !ret) {
        console.log('MISS - chave nao encontrada')

        let connection = app.persistencia.connectionFactory()
        let pagamentoDao = new app.persistencia.PagamentoDao(
          connection)

        pagamentoDao.buscaPorId(id, (erro, resultado) => {
          if (erro) {
            console.log("erro ao consultar ao banco: " + erro)
            res.status(500).send(erro)
            return
          } else {
            console.log('pagamentos encontrados: ' + JSON.stringify(
              resultado))
          }
          memcachedClient.set('pagamento-' + id, resultado, 60000, (
            err) => {
            if (err) {
              return console.log(
                'Erro ao inserir a chave no cache: ' + err)
            }
            console.log(
              'Chave inserida com sucesso no cache: pagamento-' +
              id)
          })
          return res.json(resultado)
        })
      } else {
        console.log('HIT - chave: ' + JSON.stringify(ret))
        res.json(ret)
      }
    })
  })

  app.delete('/pagamentos/pagamento/:id', (req, res) => {
    let pagamento = {}
    let id = req.params.id

    pagamento.id = id
    pagamento.status = PAGAMENTO_CANCELADO

    let connection = app.persistencia.connectionFactory()
    let pagamentoDao = new app.persistencia.PagamentoDao(connection)

    pagamentoDao.atualiza(pagamento, (erro, resultado) => {
      if (erro) {
        ogger.error('Erro ao atualizar: ' + erro)
        res.status(500).send(erro)
        return
      }
      console.log('pagamento cancelado')

      res.send(pagamento)
    })
  })

  app.put('/pagamentos/pagamento/:id', (req, res) => {
    let pagamento = {}
    let id = req.params.id

    pagamento.id = id
    pagamento.status = PAGAMENTO_CONFIRMADO

    let connection = app.persistencia.connectionFactory()
    let pagamentoDao = new app.persistencia.PagamentoDao(connection)

    pagamentoDao.atualiza(pagamento, function(erro, resultado) {
      if (erro) {
        res.status(500).send(erro)
        return
      } else {
        console.log('pagamento confirmado')
        res.status(204).send(pagamento)
      }
    })
  })

  app.post('/pagamentos/pagamento', (req, res) => {
    req.assert("pagamento.forma_de_pagamento",
      "Forma de pagamento eh obrigatorio").notEmpty()

    req.assert("pagamento.valor",
        "Valor eh obrigatorio e deve ser um decimal")
      .notEmpty().isFloat()

    let erros = req.validationErrors()

    if (erros) return res.status(400).send(erros)

    var pagamento = req.body["pagamento"]

    pagamento.status = PAGAMENTO_CRIADO
    pagamento.data = new Date

    let connection = app.persistencia.connectionFactory()
    let pagamentoDao = new app.persistencia.PagamentoDao(connection)

    pagamentoDao.salva(pagamento, (erro, resultado) => {
      if (erro) {
        console.log('Erro ao inserir no banco:' + erro)
        return res.status(500).send(erro)
      }

      pagamento.id = resultado.insertId

      console.log('pagamento criado')

      let memcachedClient = new app.servicos.memcachedClient()

      memcachedClient.set('pagamento-' + pagamento.id, pagamento,
        60000, (err) => {
          if (err) {
            return console.log('Erro ao inserir a chave no cache: ' +
              err)
          }
          console.log(
            'Chave inserida com sucesso no cache: pagamento-' +
            pagamento.id)
        })

      if (pagamento.forma_de_pagamento == "cartao") {
        let cartao = req.body["cartao"]

        console.log(cartao)

        let clienteCartoes = new app.servicos.clienteCartoes()

        clienteCartoes.autoriza(cartao, (exception, request, response,
          retorno) => {
          if (exception) {
            console.log(exception)
            return res.status(400).send(exception)
          }

          console.log(retorno)

          res.location('/pagamentos/pagamento/' + resultado.insertId)

          let headers = [{
            dados_do_pagamento: pagamento,
            cartao: retorno,
            links: [{
              method: 'PUT',
              href: 'http:localhost:3000/pagamentos/pagamento/' +
                resultado.insertId,
              rel: 'confirmar'
            }, {
              method: 'DELETE',
              href: 'http:localhost:3000/pagamentos/pagamento/' +
                resultado.insertId,
              rel: 'cancelar'
            }]
          }]

          res.status(201).json(headers)

        })
      } else {

        res.location('/pagamentos/pagamento/' + resultado.insertId)

        let response = [{
          dados_do_pagamento: pagamento,
          links: [{
            method: 'PUT',
            href: 'http:localhost:3000/pagamentos/pagamento/' +
              resultado.insertId,
            rel: 'confirmar'
          }, {
            method: 'DELETE',
            href: 'http:localhost:3000/pagamentos/pagamento/' +
              resultado.insertId,
            rel: 'cancelar'
          }]
        }]

        res.status(201).json(response)
      }
    })
  })
}
