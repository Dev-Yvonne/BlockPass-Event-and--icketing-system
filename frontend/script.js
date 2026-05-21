const events = [
  {
    id: 1,
    title: "Summer Beats Festival",
    category: "Music",
    description: "Live DJs, immersive light shows, and a sunset beachside stage.",
    date: "July 18, 2026",
    tickets: 120,
    price: 49,
    image: "https://images.unsplash.com/photo-1518972559570-7cc1309f28f8?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    title: "Startup Pitch Night",
    category: "Business",
    description: "Network with founders, hear pitch decks, and join investor roundtables.",
    date: "June 14, 2026",
    tickets: 80,
    price: 35,
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    title: "City Marathon 5K",
    category: "Sports",
    description: "Run through iconic city streets with cheering crowds and finisher medals.",
    date: "August 3, 2026",
    tickets: 60,
    price: 28,
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    title: "Gourmet Food Expo",
    category: "Food",
    description: "Taste international cuisine, chef demos, and craft drink samplings.",
    date: "September 2, 2026",
    tickets: 140,
    price: 22,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 5,
    title: "Visual Art Showcase",
    category: "Art",
    description: "Discover local creatives, gallery installations, and interactive workshops.",
    date: "June 28, 2026",
    tickets: 75,
    price: 18,
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
  },
];

const cart = new Map();

const eventGrid = document.getElementById("eventGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const cartList = document.getElementById("cartList");
const cartTotal = document.getElementById("cartTotal");
const ticketSummary = document.getElementById("ticketSummary");
const purchaseButton = document.getElementById("purchaseButton");
const soldOutBanner = document.getElementById("soldOutBanner");

function renderEvents() {
  const query = searchInput.value.toLowerCase().trim();
  const category = categoryFilter.value;

  const filtered = events.filter((event) => {
    const matchesCategory = category === "All" || event.category === category;
    const matchesQuery =
      event.title.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query) ||
      event.category.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  eventGrid.innerHTML = filtered
    .map((event) => {
      const soldOut = event.tickets <= 0;
      return `
        <article class="event-card">
          <img src="${event.image}" alt="${event.title}" />
          <div class="event-content">
            <div class="tags"><span class="tag">${event.category}</span></div>
            <h3>${event.title}</h3>
            <p>${event.description}</p>
            <div class="line"><span>${event.date}</span><span class="price">$${event.price}</span></div>
          </div>
          <div class="actions" style="padding: 0 1.25rem 1.25rem;">
            <button data-id="${event.id}" ${soldOut ? "disabled" : ""}>
              ${soldOut ? "Sold out" : "Add ticket"}
            </button>
            <small>${soldOut ? "No tickets remaining" : `${event.tickets} seats left`}</small>
          </div>
        </article>
      `;
    })
    .join("");

  if (filtered.length === 0) {
    eventGrid.innerHTML = "<p style='color: var(--muted);'>No events match your search.</p>";
  }

  document.querySelectorAll("button[data-id]").forEach((button) => {
    button.addEventListener("click", () => addToCart(Number(button.dataset.id)));
  });
}

function renderCart() {
  if (cart.size === 0) {
    cartList.innerHTML = "<p style='color: var(--muted);'>Your cart is empty. Add tickets to get started.</p>";
    purchaseButton.disabled = true;
    ticketSummary.textContent = "Add tickets to see the order summary.";
    cartTotal.textContent = "$0";
    return;
  }

  cartList.innerHTML = Array.from(cart.values())
    .map((item) => {
      return `
        <div class="cart-item">
          <strong>${item.title}</strong>
          <div class="line"><span>Qty:</span><span>${item.quantity}</span></div>
          <div class="line"><span>Price:</span><span>$${item.price} each</span></div>
          <div class="line"><span>Subtotal:</span><span>$${item.quantity * item.price}</span></div>
          <button data-remove="${item.id}" style="width:100%; margin-top:0.5rem; background:rgba(249,115,22,0.18); color:#fb923c;">Remove</button>
        </div>
      `;
    })
    .join("");

  purchaseButton.disabled = false;
  const total = Array.from(cart.values()).reduce((sum, item) => sum + item.quantity * item.price, 0);
  cartTotal.textContent = `$${total}`;
  ticketSummary.textContent = `You have ${cart.size} event${cart.size > 1 ? "s" : ""} in your cart, with ${Array.from(cart.values()).reduce((sum, item) => sum + item.quantity, 0)} ticket${
    Array.from(cart.values()).reduce((sum, item) => sum + item.quantity, 0) === 1 ? "" : "s"
  }.`;

  document.querySelectorAll("button[data-remove]").forEach((button) => {
    button.addEventListener("click", () => removeFromCart(Number(button.dataset.remove)));
  });
}

function addToCart(eventId) {
  const item = events.find((event) => event.id === eventId);
  if (!item || item.tickets <= 0) return;

  const existing = cart.get(eventId);
  if (existing) {
    cart.set(eventId, { ...existing, quantity: existing.quantity + 1 });
  } else {
    cart.set(eventId, { id: item.id, title: item.title, price: item.price, quantity: 1 });
  }

  item.tickets -= 1;
  renderEvents();
  renderCart();
  updateStats();
}

function removeFromCart(eventId) {
  const existing = cart.get(eventId);
  if (!existing) return;

  const event = events.find((evt) => evt.id === eventId);
  if (event) {
    event.tickets += existing.quantity;
  }
  cart.delete(eventId);
  renderEvents();
  renderCart();
  updateStats();
}

function completePurchase() {
  if (cart.size === 0) return;
  const total = Array.from(cart.values()).reduce((sum, item) => sum + item.quantity * item.price, 0);
  const ticketCount = Array.from(cart.values()).reduce((sum, item) => sum + item.quantity, 0);

  alert(`Purchase complete!\n\n${ticketCount} ticket${ticketCount === 1 ? "" : "s"} bought for $${total}.\nThank you for booking.`);
  cart.clear();
  renderCart();
  updateStats();
}

function updateStats() {
  const available = events.reduce((sum, event) => sum + event.tickets, 0);
  const totalEvents = events.length;
  const soldOut = events.filter((event) => event.tickets === 0).length;

  document.getElementById("ticketCount").textContent = ticketSummary.textContent = `You have ${cart.size} event${cart.size === 1 ? "" : "s"} in your cart.`;
  document.getElementById("availableSeats").textContent = `${available} seats remaining`;
  document.getElementById("eventCount").textContent = `${totalEvents} events live`;
  document.getElementById("soldOutCount").textContent = `${soldOut} sold out`;

  soldOutBanner.style.display = soldOut ? "block" : "none";
}

searchInput.addEventListener("input", renderEvents);
categoryFilter.addEventListener("change", renderEvents);
purchaseButton.addEventListener("click", completePurchase);

renderEvents();
renderCart();
updateStats();
