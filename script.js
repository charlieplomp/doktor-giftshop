// Dr. Gift Shop — winkelwagen, navigatie en checkout
const CART_KEY = "drgiftshop_cart";

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

function addToCart(productId, qty) {
  qty = qty || 1;
  const cart = getCart();
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: productId, qty: qty });
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  const cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);
}

function setQty(productId, qty) {
  const cart = getCart();
  const item = cart.find(item => item.id === productId);
  if (!item) return;
  if (qty <= 0) {
    removeFromCart(productId);
    return;
  }
  item.qty = qty;
  saveCart(cart);
}

function getCartItems() {
  return getCart()
    .map(item => {
      const product = PRODUCTS.find(p => p.id === item.id);
      if (!product) return null;
      return {
        ...product,
        qty: item.qty,
        lineTotal: product.price * item.qty
      };
    })
    .filter(Boolean);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function getCartTotal() {
  return getCartItems().reduce((sum, item) => sum + item.lineTotal, 0);
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

async function startCheckout() {
  const items = getCartItems();
  if (items.length === 0) return;

  const checkoutBtn = document.getElementById("checkout-btn");
  const originalLabel = checkoutBtn ? checkoutBtn.textContent : null;
  if (checkoutBtn) {
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "Bezig met afrekenen…";
  }

  try {
    const response = await fetch("/api/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          qty: item.qty,
          price: item.price
        })),
        total: getCartTotal()
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
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = originalLabel;
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

  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav a").forEach(link => {
    const href = (link.getAttribute("href") || "").split("?")[0];
    if (href === path) {
      link.classList.add("active");
    }
  });

  updateCartBadge();
}

document.addEventListener("DOMContentLoaded", initNav);
