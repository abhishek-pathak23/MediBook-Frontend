export const environment = {
  production: true,
  gatewayUrl: 'https://api-gateway-vdad.onrender.com',
  apis: {
    auth: 'https://api-gateway-vdad.onrender.com/api/v1/auth',
    provider: 'https://api-gateway-vdad.onrender.com/api/v1/Provider',
    schedule: 'https://api-gateway-vdad.onrender.com/api/v1/Schedule',
    appointment: 'https://api-gateway-vdad.onrender.com/api/v1/appointments',
    payment: 'https://api-gateway-vdad.onrender.com/api/v1/payments',
    review: 'https://api-gateway-vdad.onrender.com/api/v1/reviews',
    notification: 'https://api-gateway-vdad.onrender.com/api/v1/notifications',
    record: 'https://api-gateway-vdad.onrender.com/api/v1/records'
  },
  signalrHub: 'https://notification-service-o9q0.onrender.com/notifHub',
  razorpayKey: 'rzp_test_Sgon32WsnbocWD'
};
