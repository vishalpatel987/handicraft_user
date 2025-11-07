const axios = require('axios');
require('dotenv').config();

async function testUserOrdersCancel() {
  try {
    console.log('Testing User Orders Cancel Button Logic...');
    
    // First, login as user to get token
    console.log('\n1. Logging in as user...');
    const loginResponse = await axios.post('http://localhost:5175/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (!loginResponse.data.success) {
      console.log('User login failed, trying to register...');
      const registerResponse = await axios.post('http://localhost:5175/api/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890'
      });
      
      if (registerResponse.data.success) {
        console.log('User registered successfully');
        const token = registerResponse.data.token;
        await testOrdersCancelLogic(token);
      } else {
        throw new Error('User registration failed');
      }
    } else {
      console.log('User login successful');
      const token = loginResponse.data.token;
      await testOrdersCancelLogic(token);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function testOrdersCancelLogic(token) {
  try {
    // Get user orders
    console.log('\n2. Fetching user orders...');
    const ordersResponse = await axios.get('http://localhost:5175/api/orders?email=test@example.com', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const orders = ordersResponse.data.orders || [];
    console.log(`Found ${orders.length} orders`);
    
    if (orders.length === 0) {
      console.log('No orders found. Creating a test order...');
      await createTestOrder(token);
      return;
    }
    
    // Test cancel logic for each order
    console.log('\n3. Testing cancel logic for each order...');
    orders.forEach((order, index) => {
      console.log(`\n--- Order ${index + 1}: ${order._id} ---`);
      console.log('Order details:', {
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        cancellationRequested: order.cancellationRequested,
        cancellationStatus: order.cancellationStatus
      });
      
      // Test cancel logic
      const canCancel = canCancelOrder(order);
      console.log(`Can Cancel: ${canCancel}`);
      
      if (canCancel) {
        console.log('✅ This order should show cancel button');
      } else {
        console.log('❌ This order should NOT show cancel button');
        console.log('Reasons:');
        if (!['processing', 'confirmed'].includes(order.orderStatus)) {
          console.log(`- Order status "${order.orderStatus}" is not in allowed statuses`);
        }
        if (order.cancellationRequested) {
          console.log('- Cancellation already requested');
        }
        if (order.cancellationStatus && order.cancellationStatus !== 'none') {
          console.log(`- Cancellation status is "${order.cancellationStatus}"`);
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Orders cancel logic test failed:', error.response?.data || error.message);
  }
}

function canCancelOrder(order) {
  // Same logic as in Account.jsx - Only processing orders can be cancelled
  const allowedStatuses = ['processing'];
  
  // Check if order has cancellation fields, if not, assume they are false/undefined
  const cancellationRequested = order.cancellationRequested || false;
  const cancellationStatus = order.cancellationStatus || 'none';
  
  const canCancel = allowedStatuses.includes(order.orderStatus) && 
         !cancellationRequested &&
         (cancellationStatus === 'none' || !cancellationStatus);
  
  return canCancel;
}

async function createTestOrder(token) {
  try {
    console.log('\nCreating test order...');
    const orderResponse = await axios.post('http://localhost:5175/api/orders', {
      customerName: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      address: {
        street: 'Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        country: 'India'
      },
      items: [
        {
          name: 'Test Item',
          price: 1000,
          quantity: 1
        }
      ],
      totalAmount: 1000,
      paymentMethod: 'cod',
      paymentStatus: 'pending'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (orderResponse.data.success) {
      console.log('✅ Test order created successfully:', orderResponse.data.order._id);
      console.log('Now you can test cancellation functionality');
    } else {
      console.log('❌ Test order creation failed:', orderResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Test order creation failed:', error.response?.data || error.message);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get('http://localhost:5175/health');
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start the backend server first.');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testUserOrdersCancel();
  }
}

main();
