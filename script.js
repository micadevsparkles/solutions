// CONFIGURAÇÃO
// COLOCAR A URL DO WEB APP DO GOOGLE APPS SCRIPT AQUI
const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw9nqX9GyC0pySZrrxWlSujt8l85vBsj4-Hn1c6D0wvOgSUAWwumPJevxEYkLRTUO4Y/exec"; 
const FORM_SUBMIT_EMAIL = "micael.nascimento2050@gmail.com";
const REDIRECT_URL = "https://micadevsparkles.github.io/solutions";

let productsData = [];
let adsData = [];
let cart = [];
let currentProduct = null;
let currentVars = [];

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    fetchData();
    loadCart();
});

// 1. Buscar Dados
async function fetchData() {
    try {
        const response = await fetch(APP_SCRIPT_URL);
        const data = await response.json();
        productsData = data.products;
        adsData = data.ads;
        
        renderProducts();
        initAds();
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        document.getElementById('products-grid').innerHTML = "<p>Erro ao carregar catálogo.</p>";
    }
}

// 2. Renderizar Produtos
// Função para transformar texto em link clicável
function linkify(text) {
    if (!text) return "";
    const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.toString().replace(urlPattern, function(url) {
        return `<a href="${url}" target="_blank" style="color: #000; text-decoration: underline; font-weight: bold;">${url}</a>`;
    });
}

function openProduct(prod) {
    currentProduct = prod;
    currentVars = []; 
    
    const modalBody = document.getElementById('modal-body');
    const modal = document.getElementById('product-modal');
    
    let varsHTML = '';
    for(let i=1; i<=10; i++) {
        const varName = prod[`variavel${i}`];
        const varPrice = prod[`precovariavel${i}`];
        
        if(varName && varName.toString().trim() !== "") {
            // Adicionamos a classe 'var-label' para forçar a fonte no CSS
            varsHTML += `
                <div class="var-item">
                    <label class="var-label">
                        <input type="checkbox" onchange="toggleVar(${i}, ${varPrice})" data-name="${varName}">
                        <span class="var-text">${varName} (+ R$ ${formatMoney(varPrice)})</span>
                    </label>
                </div>
            `;
        }
    }

    modalBody.innerHTML = `
        <img src="${prod.imagem}" class="detail-img">
        <div class="detail-title">${prod.nome}</div>
        <div class="detail-desc">${linkify(prod.descricao)}</div> 
        <div class="var-container">
            <strong class="var-title">Escolha as variações:</strong>
            ${varsHTML}
        </div>
        <div class="price-display">Total: R$ <span id="product-final-price">${formatMoney(prod.precofixo)}</span></div>
        <button class="action-btn" onclick="addToCartCurrent()">Adicionar ao Carrinho</button>
        <button class="action-btn secondary-btn" onclick="directOrder()">Fazer Pedido Agora</button>
    `;
    
    modal.style.display = "block";
}
// 3. Renderizar e Rotacionar Anúncios
function initAds() {
    const mobileContainer = document.getElementById('ads-mobile');
    const desktopContainer = document.getElementById('ads-desktop');
    
    if (adsData.length === 0) return;

    // Função auxiliar para criar HTML do anúncio
    const createAdHTML = (ad, index) => `
        <a href="${ad.link}" target="_blank" class="ad-item ${index === 0 ? 'active' : ''}" data-index="${index}">
            <img src="${ad.imagem}" class="ad-img">
            <div class="ad-desc">${ad.descricao}</div>
        </a>
    `;

    // Popula ambos os containers
    adsData.forEach((ad, index) => {
        mobileContainer.innerHTML += createAdHTML(ad, index);
        desktopContainer.innerHTML += createAdHTML(ad, index);
    });

    // Inicia rotação
    let currentAdIndex = 0;
    setInterval(() => {
        const itemsMobile = mobileContainer.getElementsByClassName('ad-item');
        const itemsDesktop = desktopContainer.getElementsByClassName('ad-item');
        
        // Esconde atual
        if(itemsMobile[currentAdIndex]) itemsMobile[currentAdIndex].classList.remove('active');
        if(itemsDesktop[currentAdIndex]) itemsDesktop[currentAdIndex].classList.remove('active');

        // Avança
        currentAdIndex = (currentAdIndex + 1) % adsData.length;

        // Mostra próximo
        if(itemsMobile[currentAdIndex]) itemsMobile[currentAdIndex].classList.add('active');
        if(itemsDesktop[currentAdIndex]) itemsDesktop[currentAdIndex].classList.add('active');

    }, 5000); // 5 segundos
}

// 4. Modal de Produto
function openProduct(prod) {
    currentProduct = prod;
    currentVars = []; // Resetar variáveis selecionadas
    
    const modalBody = document.getElementById('modal-body');
    const modal = document.getElementById('product-modal');
    
    let varsHTML = '';
    // Loop pelas 10 variáveis possíveis
    for(let i=1; i<=10; i++) {
        const varName = prod[`variavel${i}`];
        const varPrice = prod[`precovariavel${i}`];
        
        if(varName && varName.toString().trim() !== "") {
            varsHTML += `
                <div class="var-item">
                    <label>
                        <input type="checkbox" onchange="toggleVar(${i}, ${varPrice})" data-name="${varName}">
                        ${varName} (+ R$ ${formatMoney(varPrice)})
                    </label>
                </div>
            `;
        }
    }

    modalBody.innerHTML = `
        <img src="${prod.imagem}" class="detail-img">
        <div class="detail-title">${prod.nome}</div>
        <div class="detail-desc">${prod.descricao}</div>
        <div class="var-container">
            <strong>Escolha as variações:</strong>
            ${varsHTML}
        </div>
        <div class="price-display">Total: R$ <span id="product-final-price">${formatMoney(prod.precofixo)}</span></div>
        <button class="action-btn" onclick="addToCartCurrent()">Adicionar ao Carrinho</button>
        <button class="action-btn secondary-btn" onclick="directOrder()">Fazer Pedido Agora</button>
    `;
    
    modal.style.display = "block";
}

function toggleVar(index, price) {
    // Atualiza lista de vars e recalcula preço visual
    const checkboxes = document.querySelectorAll('#modal-body input[type="checkbox"]');
    let totalVars = 0;
    currentVars = [];

    checkboxes.forEach(cb => {
        if(cb.checked) {
            // Extrai o preço do argumento do onchange (parse simples via DOM seria complexo)
            // Lógica simplificada: soma o que foi passado
        }
    });

    // Recalculo total
    let finalPrice = parseFloat(currentProduct.precofixo);
    
    // Varre os checkboxes novamente para montar array e somar
    const inputs = document.querySelectorAll('#modal-body input[type="checkbox"]');
    inputs.forEach(input => {
        if(input.checked) {
            // Truque para pegar o preço do atributo onclick ou similar
            // Vamos usar uma abordagem mais limpa: pegar o valor no momento da criação
            // Mas aqui dentro, precisamos saber qual o preço deste input.
            // Solução: O "toggleVar" recebeu o preço. Mas precisamos somar TODOS.
        }
    });
    
    // CORREÇÃO DA LÓGICA DE SOMA:
    // Melhor abordagem: recalcular tudo baseado no estado atual
    let sum = parseFloat(currentProduct.precofixo);
    currentVars = [];
    
    // Itera sobre as 10 vars originais do produto para ver quais estão checadas no DOM
    for(let i=1; i<=10; i++) {
        const check = document.querySelector(`input[onchange*="toggleVar(${i}"]`);
        if(check && check.checked) {
            let p = parseFloat(currentProduct[`precovariavel${i}`]);
            sum += p;
            currentVars.push(currentProduct[`variavel${i}`]);
        }
    }
    
    document.getElementById('product-final-price').innerText = formatMoney(sum);
}

// 5. Carrinho
function addToCartCurrent() {
    // Calcula preço final atual
    let finalPrice = parseFloat(currentProduct.precofixo);
    currentVars.forEach(vName => {
        // Encontra preço da var pelo nome (ou refaz loop, mas já temos o nome)
        for(let i=1; i<=10; i++) {
            if(currentProduct[`variavel${i}`] === vName) {
                finalPrice += parseFloat(currentProduct[`precovariavel${i}`]);
            }
        }
    });

    const item = {
        id: Date.now(), // ID único para o item no carrinho
        produto: currentProduct.nome,
        codigo: currentProduct.codigo,
        imagem: currentProduct.imagem,
        descricao: currentProduct.descricao,
        variaveis: currentVars.join(", "),
        precoFinal: finalPrice,
        selected: true // Marcado por padrão
    };

    cart.push(item);
    updateCartCount();
    saveCart();
    closeModal('product-modal');
    alert("Produto adicionado ao carrinho!");
}

function openCart() {
    const modal = document.getElementById('cart-modal');
    const container = document.getElementById('cart-items-container');
    container.innerHTML = "";
    
    if(cart.length === 0) {
        container.innerHTML = "<p>Carrinho vazio.</p>";
    } else {
        cart.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <input type="checkbox" class="cart-checkbox" ${item.selected ? 'checked' : ''} onchange="toggleCartItem(${idx})">
                <img src="${item.imagem}" class="cart-item-img">
                <div class="cart-details">
                    <strong>${item.produto}</strong><br>
                    <small>${item.variaveis}</small><br>
                    <strong>R$ ${formatMoney(item.precoFinal)}</strong><br>
                    <button class="cart-remove-btn" onclick="removeCartItem(${idx})">Remover</button>
                </div>
            `;
            container.appendChild(div);
        });
    }
    updateCartTotal();
    modal.style.display = "block";
}

function toggleCartItem(index) {
    cart[index].selected = !cart[index].selected;
    saveCart();
    updateCartTotal();
}

function removeCartItem(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartCount();
    openCart(); // Re-renderiza
}

function updateCartTotal() {
    let total = 0;
    cart.forEach(item => {
        if(item.selected) total += item.precoFinal;
    });
    document.getElementById('cart-total-display').innerText = formatMoney(total);
}

// 6. Checkout e Finalização
let checkoutSource = ''; // 'cart' ou 'direct'
let directItem = null;

function directOrder() {
    // Prepara item temporário para compra direta
    let finalPrice = parseFloat(currentProduct.precofixo);
    // Recalcula vars (copiado da logica toggleVar)
    let varsList = [];
    for(let i=1; i<=10; i++) {
        const check = document.querySelector(`input[onchange*="toggleVar(${i}"]`);
        if(check && check.checked) {
            finalPrice += parseFloat(currentProduct[`precovariavel${i}`]);
            varsList.push(currentProduct[`variavel${i}`]);
        }
    }

    directItem = {
        produto: currentProduct.nome,
        codigo: currentProduct.codigo,
        precoFinal: finalPrice,
        variaveis: varsList.join(", ")
    };
    
    closeModal('product-modal');
    openCheckoutForm('direct');
}

function openCheckoutForm(source) {
    // Verifica se há itens selecionados se for carrinho
    if (source === 'cart') {
        const hasSelection = cart.some(i => i.selected);
        if(!hasSelection) {
            alert("Selecione pelo menos um item para finalizar.");
            return;
        }
    }
    checkoutSource = source;
    document.getElementById('checkout-modal').style.display = 'block';
    // Fecha modal de carrinho se estiver aberto
    document.getElementById('cart-modal').style.display = 'none';
}

function handleFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const clientData = Object.fromEntries(formData.entries());
    
    // Prepara itens do pedido
    let itemsToOrder = [];
    if(checkoutSource === 'direct') {
        itemsToOrder = [directItem];
    } else {
        itemsToOrder = cart.filter(i => i.selected);
    }

    const payload = {
        cliente: clientData,
        items: itemsToOrder,
        observacoes: clientData.observacoes
    };

    const submitBtn = e.target.querySelector('button');
    submitBtn.innerText = "Processando...";
    submitBtn.disabled = true;

    // 1. Enviar para Google Apps Script (Sheets)
    fetch(APP_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Necessário para Apps Script simples
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(() => {
        // 2. Enviar notificação FormSubmit (AJAX)
        // Criamos os campos dinamicamente para o FormSubmit
        const formSubmitData = new FormData();
        formSubmitData.append("name", clientData.nome);
        formSubmitData.append("email", clientData.email);
        formSubmitData.append("message", `Novo pedido de ${clientData.nome}. Valor Total: R$ ${calculateTotal(itemsToOrder)}`);
        formSubmitData.append("_subject", "Novo Pedido Site MicaDev");
        formSubmitData.append("_template", "table");
        
        return fetch(`https://formsubmit.co/${FORM_SUBMIT_EMAIL}`, {
            method: 'POST',
            body: formSubmitData
        });
    }).then(() => {
        // 3. Redirecionar para InfinitePay
        const infiniteLink = generateInfinitePayLink(itemsToOrder);
        
        // Limpar carrinho se foi compra via carrinho
        if(checkoutSource === 'cart') {
            cart = cart.filter(i => !i.selected);
            saveCart();
            updateCartCount();
        }

        window.location.href = infiniteLink;

    }).catch(err => {
        console.error(err);
        alert("Erro ao processar pedido. Tente novamente.");
        submitBtn.innerText = "Ir para Pagamento";
        submitBtn.disabled = false;
    });
}

function generateInfinitePayLink(items) {
    // Lógica: somar tudo em um único item "Pedido Site" ou listar itens?
    // O pedido pedia: items=[{"name":"NOMEDOPRODUTOAQUI","price":PRECOSEMVIRGULA,"quantity":1}]
    // Se houver múltiplos itens, o InfinitePay aceita array? O prompt sugere que sim.
    // Mas se o link final precisa ser um valor único, talvez devamos somar tudo.
    // O prompt diz: "Valor fixo para o link... items=[...]"
    // Vamos construir o array de objetos JSON stringify manualmente para evitar encodeURI agressivo onde não deve.

    let itemsStrParts = [];
    
    items.forEach(item => {
        // Preço sem virgula: 15.50 -> 1550.
        // O prompt diz "sem a virgula... zeros ficam".
        let priceInt = Math.round(item.precoFinal * 100); 
        let nameClean = item.produto.replace(/"/g, ''); // Remove aspas para não quebrar JSON
        
        itemsStrParts.push(`{"name":"${nameClean}","price":${priceInt},"quantity":1}`);
    });

    const itemsJson = `[${itemsStrParts.join(',')}]`;
    
    // Construção manual da URL para manter caracteres literais `[` e `{`
    // Aviso: Navegadores modernos podem forçar encode, mas faremos a string crua.
    const baseUrl = "https://checkout.infinitepay.io/audaces";
    const redirect = `&redirect_url=${REDIRECT_URL}`;
    
    // O usuário pediu especificamente para NÃO ter %20 em `[{`.
    // Passamos a string montada.
    return `${baseUrl}?items=${itemsJson}${redirect}`;
}

// Utilitários
function calculateTotal(items) {
    return items.reduce((acc, i) => acc + i.precoFinal, 0).toFixed(2);
}

function formatMoney(val) {
    if(!val) return "0,00";
    return parseFloat(val).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

function updateCartCount() {
    const el = document.getElementById('cart-count');
    el.innerText = cart.length;
    el.style.display = cart.length > 0 ? 'flex' : 'none';
}

function saveCart() {
    localStorage.setItem('micadev_cart', JSON.stringify(cart));
}

function loadCart() {
    const saved = localStorage.getItem('micadev_cart');
    if(saved) {
        cart = JSON.parse(saved);
        updateCartCount();
    }
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}
