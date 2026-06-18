export function cartKey(user) {
  if (!user) return 'cart_guest';
  return `cart_${user._id || user.id || user.email}`;
}

export function loadCart(user) {
  try {
    return JSON.parse(localStorage.getItem(cartKey(user)) || '[]');
  } catch (e) { return []; }
}

export function saveCart(user, cart) {
  try { localStorage.setItem(cartKey(user), JSON.stringify(cart)); } catch (e) { /* ignore */ }
}

export function findItemIndex(cart, product) {
  return cart.findIndex(i => (i._id || i.id) === (product._id || product.id));
}
