export const environment = {
  production: false,
  apis: {
    auth: 'http://localhost:5002/api/v1/auth',
    provider: 'http://localhost:5117/api/v1/Provider',
    schedule: 'http://localhost:5298/api/v1/Schedule',
    appointment: 'http://localhost:5003/api/v1/appointments',
    payment: 'http://localhost:5004/api/v1/payments',
    review: 'http://localhost:5005/api/v1/reviews',
    notification: 'http://localhost:5006/api/v1/notifications',
    record: 'http://localhost:5007/api/v1/records'
  },
  razorpayKey: 'rzp_test_Sgon32WsnbocWD'
};
