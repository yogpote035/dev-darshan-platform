import API from './api';

export const fetchProducts = async (params = {}) => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.append(key, value);
        }
    });

    const response = await API.get(`/products${query.toString() ? `?${query.toString()}` : ''}`);
    return response.data;
};

export const fetchProductCategories = async () => {
    const response = await API.get('/product-categories');
    return response.data;
};

export const fetchProductById = async (id) => {
    const response = await API.get(`/products/${id}`);
    return response.data;
};

export const addToCart = async (productId, quantity = 1) => {
    const response = await API.post('/cart', { productId, quantity });
    return response.data;
};

export const fetchCart = async () => {
    const response = await API.get('/cart');
    return response.data;
};

export const fetchOrderById = async (id) => {
    const response = await API.get(`/orders/${id}`);
    return response.data;
};

export const updateCartItem = async (itemId, quantity) => {
    const response = await API.put(`/cart/${itemId}`, { quantity });
    return response.data;
};

export const removeCartItem = async (itemId) => {
    const response = await API.delete(`/cart/${itemId}`);
    return response.data;
};

export const clearCart = async () => {
    const response = await API.delete('/cart');
    return response.data;
};

export const previewOrder = async () => {
    const response = await API.post('/orders/preview');
    return response.data;
};

export const createOrder = async (payload) => {
    const response = await API.post('/orders/create', payload);
    return response.data;
};

export const verifyOrderPayment = async (payload) => {
    const response = await API.post('/orders/payment/verify', payload);
    return response.data;
};

export const setupProductSubscription = async (orderId) => {
    const response = await API.post(`/orders/${orderId}/subscription/setup`);
    return response.data;
};

export const verifyProductSubscription = async (payload) => {
    const response = await API.post('/product-subscriptions/verify', payload);
    return response.data;
};

export const fetchProductSubscriptions = async () => {
    const response = await API.get('/product-subscriptions');
    return response.data;
};

export const cancelProductSubscription = async (id, reason = '') => {
    const response = await API.post(`/product-subscriptions/${id}/cancel`, { reason });
    return response.data;
};
