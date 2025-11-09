const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const subscriptionsData = require('./subscriptions.json');
const notificationsData = require('./notifications.json');

const packageDefinition = protoLoader.loadSync('proto/notifications.proto', {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true,
});

const notificationsProto = grpc.loadPackageDefinition(packageDefinition);

const server = new grpc.Server();

// Armazenamento em memória
let subscriptions = [...subscriptionsData];
let notifications = [...notificationsData];
let subscriptionIdCounter = 1;
let notificationIdCounter = 1;

// Implementa os métodos do NotificationService
server.addService(notificationsProto.NotificationService.service, {
    /**
     * Inscreve um usuário para ser notificado quando um livro voltar ao estoque
     */
    SubscribeToBook: (call, callback) => {
        const { userId, bookId, bookName } = call.request;

        // Verifica se já existe uma inscrição ativa
        const existingSubscription = subscriptions.find((sub) => sub.userId === userId && sub.bookId === bookId);

        if (existingSubscription) {
            callback(null, {
                success: false,
                message: 'Você já está inscrito para notificações deste livro',
            });
            return;
        }

        // Cria nova inscrição
        const subscription = {
            id: subscriptionIdCounter++,
            userId,
            bookId,
            bookName,
            subscribedAt: new Date().toISOString(),
        };

        subscriptions.push(subscription);

        callback(null, {
            success: true,
            message: 'Inscrição realizada com sucesso! Você será notificado quando o livro voltar ao estoque.',
        });
    },

    /**
     * Retorna todas as notificações de um usuário
     */
    GetUserNotifications: (call, callback) => {
        const { userId } = call.request;

        const userNotifications = notifications
            .filter((notif) => notif.userId === userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        callback(null, {
            notifications: userNotifications,
        });
    },

    /**
     * Marca uma notificação como lida
     */
    MarkNotificationAsRead: (call, callback) => {
        const { notificationId, userId } = call.request;

        const notification = notifications.find((notif) => notif.id === notificationId && notif.userId === userId);

        if (notification) {
            notification.read = true;
            callback(null, { success: true });
        } else {
            callback(null, { success: false });
        }
    },

    /**
     * Deleta uma notificação
     */
    DeleteNotification: (call, callback) => {
        const { notificationId, userId } = call.request;

        const index = notifications.findIndex((notif) => notif.id === notificationId && notif.userId === userId);

        if (index !== -1) {
            notifications.splice(index, 1);
            callback(null, { success: true });
        } else {
            callback(null, { success: false });
        }
    },

    /**
     * Retorna o número de notificações não lidas
     */
    GetUnreadCount: (call, callback) => {
        const { userId } = call.request;

        const unreadCount = notifications.filter((notif) => notif.userId === userId && !notif.read).length;

        callback(null, { count: unreadCount });
    },

    /**
     * Chamado pelo serviço de Inventory quando o estoque é atualizado
     */
    NotifyStockUpdate: (call, callback) => {
        const { bookId, bookName, newQuantity } = call.request;

        // Encontra todos os usuários inscritos para este livro
        const interestedSubscriptions = subscriptions.filter((sub) => sub.bookId === bookId);

        let notifiedUsers = 0;

        // Cria notificações para cada usuário inscrito
        interestedSubscriptions.forEach((sub) => {
            const notification = {
                id: notificationIdCounter++,
                userId: sub.userId,
                bookId: bookId,
                bookName: bookName,
                message: `O livro "${bookName}" voltou ao estoque!`,
                createdAt: new Date().toISOString(),
                read: false,
            };

            notifications.push(notification);
            notifiedUsers++;
        });

        // Remove as inscrições após notificar (auto-cancelar inscrição)
        subscriptions = subscriptions.filter((sub) => sub.bookId !== bookId);

        callback(null, { notifiedUsers });
    },
});

server.bindAsync('0.0.0.0:3003', grpc.ServerCredentials.createInsecure(), () => {
    console.log('Notification Service running at http://127.0.0.1:3003');
    server.start();
});
