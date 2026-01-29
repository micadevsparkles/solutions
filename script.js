function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Ler produtos
  var sheetSolutions = ss.getSheetByName("solutions");
  var dataSolutions = sheetSolutions.getDataRange().getValues();
  var headersSolutions = dataSolutions.shift();
  var products = dataSolutions.map(function(row) {
    var obj = {};
    headersSolutions.forEach(function(header, i) {
      obj[header] = row[i];
    });
    return obj;
  });

  // Ler anúncios
  var sheetAds = ss.getSheetByName("anuncios");
  var dataAds = sheetAds.getDataRange().getValues();
  var headersAds = dataAds.shift();
  var ads = dataAds.map(function(row) {
    var obj = {};
    headersAds.forEach(function(header, i) {
      obj[header] = row[i];
    });
    return obj;
  });

  var result = {
    products: products,
    ads: ads
  };

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  // Recebe os dados do formulário via JSON
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Salvar na aba Clientes
  var sheetClientes = ss.getSheetByName("clientes");
  // Formatar pedidos para a coluna clientes (separados por virgula)
  // Assumindo que este cliente fez apenas este pedido agora, adicionamos o ID.
  // Em um sistema real complexo, precisaria buscar se o cliente já existe.
  // Aqui faremos a inserção simples conforme solicitado.
  
  // Gera IDs
  var orderId = "PED-" + Math.floor(Math.random() * 1000000);
  
  // Salvar Pedidos (pode ser múltiplos itens)
  var sheetPedidos = ss.getSheetByName("pedidos");
  var orderIds = []; // Para salvar na aba clientes

  data.items.forEach(function(item) {
    var rowData = [
      item.produto,             // produto
      item.codigo,              // codigodoproduto
      orderId,                  // codigodopedido
      data.cliente.nome,        // cliente
      data.cliente.cpf,         // cpf
      data.cliente.endereco,    // endereco
      data.cliente.numero,      // numero
      data.cliente.bairro,      // bairro
      data.cliente.cidade,      // cidade
      data.cliente.cep,         // cep
      data.cliente.whatsapp,    // whatsapp
      data.cliente.email,       // email
      item.precoFinal,          // precofinal
      item.variaveis,           // variaveisescolhidas
      data.observacoes          // observacoes
    ];
    sheetPedidos.appendRow(rowData);
    orderIds.push(orderId);
  });

  // Salvar Cliente
  // cliente; cpf; endereco; numero; bairro; cidade; cep; whatsapp; email; pedidos
  var clientRow = [
    data.cliente.nome,
    data.cliente.cpf,
    data.cliente.endereco,
    data.cliente.numero,
    data.cliente.bairro,
    data.cliente.cidade,
    data.cliente.cep,
    data.cliente.whatsapp,
    data.cliente.email,
    [...new Set(orderIds)].join(", ") // Remove duplicatas de ID de pedido se houver
  ];
  sheetClientes.appendRow(clientRow);

  return ContentService.createTextOutput(JSON.stringify({status: "success", orderId: orderId}))
    .setMimeType(ContentService.MimeType.JSON);
}
