export const environment = {
  production: true,
  gatewayUrl: 'http://localhost:5000',
  apis: {
    auth: 'http://localhost:5000/api/v1/auth',
    provider: 'http://localhost:5000/api/v1/Provider',
    schedule: 'http://localhost:5000/api/v1/Schedule',
    appointment: 'http://localhost:5000/api/v1/appointments',
    payment: 'http://localhost:5000/api/v1/payments',
    review: 'http://localhost:5000/api/v1/reviews',
    notification: 'http://localhost:5000/api/v1/notifications',
    record: 'http://localhost:5000/api/v1/records'
  },
  signalrHub: 'http://localhost:5006/notifHub',
  razorpayKey: 'rzp_test_Sgon32WsnbocWD'
};
