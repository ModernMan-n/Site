const express = require('express');
const router = express.Router();
const YooKassa = require('yookassa');
const checkout = new YooKassa({
  shopId: '462780',
  secretKey: '390540012:LIVE:58013'
});

// Страница пополнения
router.get('/topup', (req, res) => {
  res.render('topup', { user: req.user });
});

// POST запрос для пополнения
router.post('/topup', async (req, res) => {
  const { amount, userId } = req.body;
  const idempotenceKey = Date.now().toString();

  // Создаем платеж в YooKassa
  try {
    const payment = await checkout.createPayment({
      amount: {
        value: amount,
        currency: 'RUB'
      },
      confirmation: {
        type: 'redirect',
        return_url: 'http://localhost:3000/payment-success?userId=' + userId + '&amount=' + amount
      },
      capture: true,
      description: 'Пополнение баланса'
    }, idempotenceKey);

    res.redirect(payment.confirmation.confirmation_url);
  } catch (error) {
    console.error('Ошибка при создании платежа:', error);
    res.status(500).send('Ошибка при создании платежа');
  }
});


router.get('/payment-success', async (req, res) => {
  const { userId, amount } = req.query;

  try {
    
    const paymentDetails = await checkout.getPaymentDetails(userId);  

    if (paymentDetails.status === 'succeeded') {
      const user = await User.findById(userId); 
      user.balance += parseFloat(amount);
      await user.save(); 

      
      res.redirect('/profile');
    } else {
      res.status(400).send('Платеж не был успешно завершен');
    }
  } catch (error) {
    console.error('Ошибка при обработке успешного платежа:', error);
    res.status(500).send('Ошибка при обработке платежа');
  }
});

module.exports = router;
