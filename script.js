// CONFIGURAÇÃO
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

// Função para transformar texto em link clicável
function linkify(text) {
    if (!text) return "";
    const urlPattern = /(\b(https?||ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.toString().replace(urlPattern, function(url) {
        return `<a href="${url}" target="_blank" style="color: #000; text-decoration: underline; font-weight: bold;">${url}</a>`;
    });
}

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
        document.getElementById('products-grid').innerHTML = "<p>Erro ao carregar catálogo. Verifique a URL do script.</p>";
    }
}

// 2. Renderizar Produtos
function renderProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = "";
    productsData.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => openProduct(prod);
        card.innerHTML = `
            <img src="${prod.imagem}" alt="${prod.nome}" class="card-img">
            <div class="card-title">${prod.nome}</div>
        `;
        grid.appendChild(card);
    });
}

// 3. Modal de Produto (COM LINKIFY E SPAN PARA FONTE)
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
            varsHTML += `
                <div class="var-item">
                    <label class="var-label">
                        <input type="checkbox" onchange="toggleVar(${i})" data-name="${varName}">
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

// 4. Lógica de Preço e Variáveis
function toggleVar(index) {
    let sum = parseFloat(currentProduct.precofixo);
    currentVars = [];
    const checks = document.querySelectorAll('.var-item input[type="checkbox"]');
    
    // Mapear quais estão ativos
    let activeIndices = [];
    checks.forEach((check, idx) => {
        if(check.checked) activeIndices.push(idx + 1);
    });

    // Recalcular soma com base nos inputs da planilha
    for(let i=1; i<=10; i++) {
        const check = document.querySelector(`input[onchange="toggleVar(${i})"]`);
        if(check && check.checked) {
            sum += parseFloat(currentProduct[`precovariavel${i}`] || 0);
            currentVars.push(currentProduct[`variavel${i}`]);
        }
    }
    document.getElementById('product-final-price').innerText = formatMoney(sum);
}

// 5. Carrinho e Outras Funções (Mantidas)
function addToCartCurrent() {
    let finalPrice = parseFloat(document.getElementById('product-final-price').innerText.replace('.','').replace(',','.'));
    const item = {
        id: Date.now(),
        produto: currentProduct.nome,
        codigo: currentProduct.codigo,
        imagem: currentProduct.imagem,
        variaveis: currentVars.join(", "),
        precoFinal: finalPrice,
        selected: true
    };
    cart.push(item);
    updateCartCount();
    saveCart();
    closeModal('product-modal');
}

function openCart() {
    const modal = document.getElementById('cart-modal');
    const container = document.getElementById('cart-items-container');
    container.innerHTML = cart.length === 0 ? "<p>Carrinho vazio.</p>" : "";
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
    updateCartTotal();
    modal.style.display = "block";
}

function toggleCartItem(index) { cart[index].selected = !cart[index].selected; saveCart(); updateCartTotal(); }
function removeCartItem(index) { cart.splice(index, 1); saveCart(); updateCartCount(); openCart(); }
function updateCartTotal() {
    let total = cart.reduce((acc, i) => i.selected ? acc + i.precoFinal : acc, 0);
    document.getElementById('cart-total-display').innerText = formatMoney(total);
}
function updateCartCount() {
    const el = document.getElementById('cart-count');
    el.innerText = cart.length;
    el.style.display = cart.length > 0 ? 'flex' : 'none';
}
function formatMoney(val) { return parseFloat(val || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}); }
function closeModal(id) { document.getElementById(id).style.display = "none"; }
function saveCart() { localStorage.setItem('micadev_cart', JSON.stringify(cart)); }
function loadCart() { const saved = localStorage.getItem('micadev_cart'); if(saved) { cart = JSON.parse(saved); updateCartCount(); } }

// Rotação de Anúncios e Checkout (Simplificados para evitar erros)
function initAds() {
    const containers = [document.getElementById('ads-mobile'), document.getElementById('ads-desktop')];
    if (adsData.length === 0) return;
    containers.forEach(c => {
        adsData.forEach((ad, i) => {
            c.innerHTML += `<a href="${ad.link}" target="_blank" class="ad-item ${i===0?'active':''}">
                <img src="${ad.imagem}" class="ad-img"><div class="ad-desc">${ad.descricao}</div></a>`;
        });
    });
    let current = 0;
    setInterval(() => {
        document.querySelectorAll('.ad-item.active').forEach(el => el.classList.remove('active'));
        current = (current + 1) % adsData.length;
        document.querySelectorAll(`.ad-item`).forEach((el, i) => { if(i % adsData.length === current) el.classList.add('active'); });
    }, 10000);
}

function directOrder() {
    let finalPrice = parseFloat(document.getElementById('product-final-price').innerText.replace('.','').replace(',','.'));
    directItem = { produto: currentProduct.nome, codigo: currentProduct.codigo, precoFinal: finalPrice, variaveis: currentVars.join(", ") };
    closeModal('product-modal');
    openCheckoutForm('direct');
}

function openCheckoutForm(source) { 
    checkoutSource = source; 
    document.getElementById('cart-modal').style.display = 'none';
    document.getElementById('checkout-modal').style.display = 'block'; 
}

function handleFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const clientData = Object.fromEntries(formData.entries());
    let itemsToOrder = checkoutSource === 'direct' ? [directItem] : cart.filter(i => i.selected);
    
    // Gerar Link InfinitePay
    let itemsStr = itemsToOrder.map(item => `{"name":"${item.produto}","price":${Math.round(item.precoFinal*100)},"quantity":1}`).join(',');
    const infiniteLink = `https://checkout.infinitepay.io/audaces?items=[${itemsStr}]&redirect_url=${REDIRECT_URL}`;
    
    // Enviar para Planilha (Simulado via POST)
    fetch(APP_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({cliente: clientData, items: itemsToOrder}) })
    .then(() => { window.location.href = infiniteLink; });
}
