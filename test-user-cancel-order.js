const axios = require('axios');
require('dotenv').config();

async function testUserCancelOrder() {
  try {
    console.log('Testing User Cancel Order Functionality...');
    
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
        await testCancelOrder(token);
      } else {
        throw new Error('User registration failed');
      }
    } else {
      console.log('User login successful');
      const token = loginResponse.data.token;
      await testCancelOrder(token);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function testCancelOrder(token) {
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
    
    // Find a processing order to test cancellation
    const processingOrder = orders.find(order => 
      order.orderStatus === 'processing' && 
      !order.cancellationRequested && 
      !order.cancellationStatus
    );
    
    if (!processingOrder) {
      console.log('No cancellable orders found. Available orders:');
      orders.forEach(order => {
        console.log(`- Order ${order._id}: Status=${order.orderStatus}, CancellationRequested=${order.cancellationRequested}, CancellationStatus=${order.cancellationStatus}`);
      });
      return;
    }
    
    console.log(`Found cancellable order: ${processingOrder._id}`);
    console.log('Order details:', {
      orderStatus: processingOrder.orderStatus,
      paymentMethod: processingOrder.paymentMethod,
      cancellationRequested: processingOrder.cancellationRequested,
      cancellationStatus: processingOrder.cancellationStatus
    });
    
    // Test cancellation
    console.log('\n3. Testing order cancellation...');
    const cancelResponse = await axios.post(`http://localhost:5175/api/orders/${processingOrder._id}/cancel`, {
      reason: 'Test cancellation'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (cancelResponse.data.success) {
      console.log('✅ Order cancellation successful:', cancelResponse.data);
    } else {
      console.log('❌ Order cancellation failed:', cancelResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Cancel order test failed:', error.response?.data || error.message);
  }
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
    await testUserCancelOrder();
  }
}

main();
