// User ID - Simple implementation without complex authentication
let userId = localStorage.getItem('userId');
if (!userId) {
    userId = 'user-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
}

function newBook(book) {
    const div = document.createElement('div');
    div.className = 'column is-4';

    const isOutOfStock = !book.inStock;
    const stockStatus = isOutOfStock
        ? '<span class="out-of-stock-badge">ESGOTADO</span>'
        : `<p class="is-size-6">Disponível em estoque: ${book.quantity}</p>`;

    const buyButton = isOutOfStock ? '' : '<button class="button button-buy is-success is-fullwidth">Comprar</button>';

    const notifyButton = isOutOfStock
        ? `<button class="button notify-me-button" data-book-id="${book.id}" data-book-name="${book.name}">
               Avisar quando disponível
           </button>`
        : '';

    div.innerHTML = `
        <div class="card is-shady ${isOutOfStock ? 'out-of-stock' : ''}">
            <div class="card-image">
                <figure class="image is-4by3">
                    <img
                        src="${book.photo}"
                        alt="${book.name}"
                        class="modal-button"
                    />
                </figure>
            </div>
            <div class="card-content">
                <div class="content book" data-id="${book.id}">
                    <div class="book-meta">
                        <p class="is-size-4">R$${book.price.toFixed(2)}</p>
                        ${stockStatus}
                        <h4 class="is-size-3 title">${book.name}</h4>
                        <p class="subtitle">${book.author}</p>
                    </div>
                    ${
                        !isOutOfStock
                            ? `<div class="field has-addons">
                        <div class="control">
                            <input class="input" type="text" placeholder="Digite o CEP" />
                        </div>
                        <div class="control">
                            <a class="button button-shipping is-info" data-id="${book.id}"> Calcular Frete </a>
                        </div>
                    </div>`
                            : ''
                    }
                    ${buyButton}
                    ${notifyButton}

                    <div class="book-stock-control">
                        <div class="book-stock-label">Atualizar Estoque</div>
                        <div class="book-stock-inputs">
                            <input
                                type="number"
                                class="book-stock-input"
                                id="stock-input-${book.id}"
                                placeholder="Quantidade"
                                min="0"
                                value="${book.quantity}"
                            />
                            <button
                                class="book-stock-button"
                                onclick="updateStock(${book.id})"
                            >
                                Atualizar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    return div;
}

function calculateShipping(id, cep) {
    fetch('http://localhost:3000/shipping/' + cep)
        .then((data) => {
            if (data.ok) {
                return data.json();
            }
            throw data.statusText;
        })
        .then((data) => {
            swal('Frete', `O frete é: R$${data.value.toFixed(2)}`, 'success');
        })
        .catch((err) => {
            swal('Erro', 'Erro ao consultar frete', 'error');
            console.error(err);
        });
}

// Notification Functions
function fetchNotifications() {
    fetch(`http://localhost:3000/notifications/${userId}`)
        .then((response) => response.json())
        .then((notifications) => {
            updateNotificationBadge(notifications);
        })
        .catch((err) => {});
}

function updateNotificationBadge(notifications) {
    const badge = document.getElementById('notificationBadge');
    const unreadCount = notifications.filter((n) => !n.read).length;

    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    const isVisible = dropdown.style.display === 'block';

    if (isVisible) {
        dropdown.style.display = 'none';
    } else {
        dropdown.style.display = 'block';
        loadNotifications();
    }
}

function loadNotifications() {
    fetch(`http://localhost:3000/notifications/${userId}`)
        .then((response) => response.json())
        .then((notifications) => {
            displayNotifications(notifications);
            updateNotificationBadge(notifications);
        })
        .catch((err) => {});
}

function displayNotifications(notifications) {
    const listElement = document.getElementById('notificationList');

    if (notifications.length === 0) {
        listElement.innerHTML = '<p class="no-notifications">Nenhuma notificação</p>';
        return;
    }

    listElement.innerHTML = '';
    notifications.forEach((notification) => {
        const item = document.createElement('div');
        item.className = `notification-item ${notification.read ? '' : 'unread'}`;
        item.innerHTML = `
            <div class="notification-item-content">
                <div class="notification-item-title">${notification.bookName}</div>
                <div class="notification-item-message">${notification.message}</div>
                <div class="notification-item-time">${formatDate(notification.createdAt)}</div>
            </div>
            <button class="notification-delete-btn" data-notification-id="${notification.id}">×</button>
        `;

        // Mark as read when clicking content
        const content = item.querySelector('.notification-item-content');
        content.addEventListener('click', () => {
            markNotificationAsRead(notification.id);
        });

        // Delete notification when clicking X
        const deleteBtn = item.querySelector('.notification-delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteNotification(notification.id);
        });

        listElement.appendChild(item);
    });
}

function markNotificationAsRead(notificationId) {
    fetch(`http://localhost:3000/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
    })
        .then(() => {
            loadNotifications();
        })
        .catch((err) => {});
}

function deleteNotification(notificationId) {
    fetch(`http://localhost:3000/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                loadNotifications();
            }
        })
        .catch((err) => {});
}

function subscribeToBook(bookId, bookName) {
    fetch('http://localhost:3000/notifications/subscribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId,
            bookId,
            bookName,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                swal('Sucesso!', data.message, 'success');
            } else {
                swal('Atenção', data.message, 'warning');
            }
        })
        .catch((err) => {
            swal('Erro', 'Erro ao se inscrever para notificações', 'error');
        });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;

    return date.toLocaleDateString('pt-BR');
}

// Admin Function
function updateStock(bookId) {
    const input = document.getElementById(`stock-input-${bookId}`);
    const newQuantity = parseInt(input.value);

    if (isNaN(newQuantity) || newQuantity < 0) {
        swal('Erro', 'Por favor, insira uma quantidade válida', 'error');
        return;
    }

    fetch(`http://localhost:3000/products/${bookId}/stock`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newQuantity }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                swal('Sucesso!', 'Estoque atualizado com sucesso', 'success').then(() => {
                    window.location.reload();
                });
            } else {
                swal('Erro', data.message || 'Erro ao atualizar estoque', 'error');
            }
        })
        .catch((err) => {
            swal('Erro', 'Erro ao atualizar estoque', 'error');
        });
}

// Close dropdown when clicking outside
document.addEventListener('click', function (event) {
    const dropdown = document.getElementById('notificationDropdown');
    const bell = document.getElementById('notificationBell');

    if (dropdown && bell && !bell.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const books = document.querySelector('.books');

    // Initialize notification bell
    const notificationBell = document.getElementById('notificationBell');
    if (notificationBell) {
        notificationBell.addEventListener('click', toggleNotificationDropdown);
    }

    // Fetch initial notifications
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    setInterval(fetchNotifications, 30000);

    fetch('http://localhost:3000/products')
        .then((data) => {
            if (data.ok) {
                return data.json();
            }
            throw data.statusText;
        })
        .then((data) => {
            if (data) {
                // Create book cards
                data.forEach((book) => {
                    books.appendChild(newBook(book));
                });

                // Add shipping button listeners
                document.querySelectorAll('.button-shipping').forEach((btn) => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.getAttribute('data-id');
                        const cep = document.querySelector(`.book[data-id="${id}"] input`).value;
                        calculateShipping(id, cep);
                    });
                });

                // Add buy button listeners
                document.querySelectorAll('.button-buy').forEach((btn) => {
                    btn.addEventListener('click', (e) => {
                        swal('Compra de livro', 'Sua compra foi realizada com sucesso', 'success');
                    });
                });

                // Add notify me button listeners
                document.querySelectorAll('.notify-me-button').forEach((btn) => {
                    btn.addEventListener('click', (e) => {
                        const bookId = parseInt(e.target.getAttribute('data-book-id'));
                        const bookName = e.target.getAttribute('data-book-name');
                        subscribeToBook(bookId, bookName);
                    });
                });
            }
        })
        .catch((err) => {
            swal('Erro', 'Erro ao listar os produtos', 'error');
            console.error(err);
        });
});
