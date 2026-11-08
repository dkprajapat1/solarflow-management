import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db.js';
import User from '@/models/User.js';
import { cookies } from 'next/headers';

export const DEMO_CUSTOMER = {
  name: 'Rajesh Sharma',
  email: 'customer@solarflow.demo',
  mobile: '9876543210',
  password: 'Customer@123',
  role: 'customer',
};

export async function ensureDemoCustomer() {
  await connectToDatabase();
  let user = await User.findOne({ email: DEMO_CUSTOMER.email });
  if (!user) {
    const hashedPassword = await bcrypt.hash(DEMO_CUSTOMER.password, 10);
    user = await User.create({
      name: DEMO_CUSTOMER.name,
      email: DEMO_CUSTOMER.email,
      mobile: DEMO_CUSTOMER.mobile,
      password: hashedPassword,
      role: 'customer',
    });
  }
  return user;
}

export async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('sf_customer_user');
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }
    const userData = JSON.parse(decodeURIComponent(sessionCookie.value));
    await connectToDatabase();
    const user = await User.findById(userData.id).select('-password');
    return user;
  } catch (err) {
    return null;
  }
}
