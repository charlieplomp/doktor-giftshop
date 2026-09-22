// Dr. Gift Shop — winkelwagen, navigatie en checkout
const CART_KEY = "drgiftshop_cart";
const BTW_RATE = 0.21;

function formatPrice(amount) {
  return "€ " + amount.toFixed(2).replace(".", ",");
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

function getMinQty(cartItemId) {
  const baseId = cartItemId.split("::")[0];
  const product = PRODUCTS.find(p => p.id === baseId);
  return (product && product.minQty) || 1;
}

function addToCart(cartItemId, qty) {
  const minQty = getMinQty(cartItemId);
  qty = qty || minQty;
  const cart = getCart();
  const existing = cart.find(item => item.id === cartItemId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: cartItemId, qty: Math.max(minQty, qty) });
  }
  saveCart(cart);
}

function removeFromCart(cartItemId) {
  const cart = getCart().filter(item => item.id !== cartItemId);
  saveCart(cart);
}

function setQty(cartItemId, qty) {
  const cart = getCart();
  const item = cart.find(item => item.id === cartItemId);
  if (!item) return;
  if (qty <= 0) {
    removeFromCart(cartItemId);
    return;
  }
  item.qty = Math.max(getMinQty(cartItemId), qty);
  saveCart(cart);
}

function getCartItems() {
  return getCart()
    .map(item => {
      const [baseId, size] = item.id.split("::");
      const product = PRODUCTS.find(p => p.id === baseId);
      if (!product) return null;
      return {
        ...product,
        cartId: item.id,
        size: size || null,
        qty: item.qty,
        lineTotal: product.price * item.qty
      };
    })
    .filter(Boolean);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

// Prijzen in products.js zijn exclusief btw.
function getCartSubtotal() {
  return getCartItems().reduce((sum, item) => sum + item.lineTotal, 0);
}

function getCartBtw() {
  return getCartSubtotal() * BTW_RATE;
}

function getCartTotal() {
  return getCartSubtotal() + getCartBtw();
}

function updateCartBadge() {
  const count = getCartCount();
  const total = getCartTotal();
  document.querySelectorAll("[data-cart-count]").forEach(el => {
    el.textContent = count;
  });
  document.querySelectorAll("[data-cart-total]").forEach(el => {
    el.textContent = formatPrice(total);
  });
}

function generateOrderNumber() {
  return "DGS-" + Date.now().toString(36).toUpperCase();
}

async function submitOrderForPayment(customer, button) {
  const items = getCartItems();
  if (items.length === 0) return;

  const originalLabel = button ? button.textContent : null;
  if (button) {
    button.disabled = true;
    button.textContent = "Bezig met afrekenen…";
  }

  try {
    const response = await fetch("/api/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map(item => ({
          id: item.id,
          name: item.size ? `${item.name} (maat ${item.size})` : item.name,
          qty: item.qty,
          price: item.price
        })),
        subtotal: getCartSubtotal(),
        btw: getCartBtw(),
        total: getCartTotal(),
        customer
      })
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }

    if (!response.ok || !data || !data.checkoutUrl) {
      throw new Error((data && data.error) || "Er is iets misgegaan bij het starten van de betaling. Probeer het opnieuw.");
    }

    window.location.href = data.checkoutUrl;
  } catch (error) {
    alert(error.message || "Er is iets misgegaan bij het starten van de betaling. Probeer het opnieuw.");
    if (button) {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }
}

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
    });
  }

  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const currentCat = new URLSearchParams(window.location.search).get("cat");
  document.querySelectorAll(".main-nav a").forEach(link => {
    const hrefRaw = link.getAttribute("href") || "";
    const [hrefPath, hrefQuery] = hrefRaw.split("?");
    const hrefCat = hrefQuery ? new URLSearchParams(hrefQuery).get("cat") : null;
    if (hrefPath === currentPath && hrefCat === currentCat) {
      link.classList.add("active");
    }
  });

  const searchInput = document.querySelector(".search-bar input[name='search']");
  if (searchInput) {
    const currentSearch = new URLSearchParams(window.location.search).get("search");
    if (currentSearch) searchInput.value = currentSearch;
  }

  updateCartBadge();
}

document.addEventListener("DOMContentLoaded", initNav);
