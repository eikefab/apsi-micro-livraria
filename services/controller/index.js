const express = require('express');
const shipping = require('./shipping');
const inventory = require('./inventory');
const notifications = require('./notifications');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Retorna a lista de produtos da loja via InventoryService
 */
app.get('/products', (req, res, next) => {
    inventory.SearchAllProducts(null, (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send({ error: 'something failed :(' });
        } else {
            res.json(data.products);
        }
    });
});

/**
 * Consulta o frete de envio no ShippingService
 */
app.get('/shipping/:cep', (req, res, next) => {
    shipping.GetShippingRate(
        {
            cep: req.params.cep,
        },
        (err, data) => {
            if (err) {
                console.error(err);
                res.status(500).send({ error: 'something failed :(' });
            } else {
                res.json({
                    cep: req.params.cep,
                    value: data.value,
                });
            }
        }
    );
});

/**
 * Inscreve um usuário para ser notificado quando um livro voltar ao estoque
 */
app.post('/notifications/subscribe', (req, res, next) => {
    const { userId, bookId, bookName } = req.body;

    notifications.SubscribeToBook({ userId, bookId, bookName }, (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send({ error: 'something failed :(' });
        } else {
            res.json(data);
        }
    });
});

/**
 * Retorna todas as notificações de um usuário
 */
app.get('/notifications/:userId', (req, res, next) => {
    notifications.GetUserNotifications({ userId: req.params.userId }, (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send({ error: 'something failed :(' });
        } else {
            res.json(data.notifications);
        }
    });
});

/**
 * Marca uma notificação como lida
 */
app.post('/notifications/:notificationId/read', (req, res, next) => {
    const { userId } = req.body;

    notifications.MarkNotificationAsRead(
        {
            notificationId: parseInt(req.params.notificationId),
            userId: userId,
        },
        (err, data) => {
            if (err) {
                console.error(err);
                res.status(500).send({ error: 'something failed :(' });
            } else {
                res.json(data);
            }
        }
    );
});

/**
 * Deleta uma notificação
 */
app.delete('/notifications/:notificationId', (req, res, next) => {
    const { userId } = req.body;

    notifications.DeleteNotification(
        {
            notificationId: parseInt(req.params.notificationId),
            userId: userId,
        },
        (err, data) => {
            if (err) {
                console.error(err);
                res.status(500).send({ error: 'something failed :(' });
            } else {
                res.json(data);
            }
        }
    );
});

/**
 * Retorna o número de notificações não lidas
 */
app.get('/notifications/:userId/unread-count', (req, res, next) => {
    notifications.GetUnreadCount({ userId: req.params.userId }, (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send({ error: 'something failed :(' });
        } else {
            res.json({ count: data.count });
        }
    });
});

/**
 * Atualiza o estoque de um produto (endpoint de administração)
 */
app.post('/products/:bookId/stock', (req, res, next) => {
    const { newQuantity } = req.body;

    inventory.UpdateStock(
        {
            bookId: parseInt(req.params.bookId),
            newQuantity: parseInt(newQuantity),
        },
        (err, data) => {
            if (err) {
                console.error(err);
                res.status(500).send({ error: 'something failed :(' });
            } else {
                res.json(data);
            }
        }
    );
});

/**
 * Inicia o router
 */
app.listen(3000, () => {
    console.log('Controller Service running on http://127.0.0.1:3000');
});
