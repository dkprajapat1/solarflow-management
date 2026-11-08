import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db.js';
import User from '@/models/User.js';
import { cookies } from 'next/headers';

export const DEMO_COMPANY_USERS = {
  admin: {
    name: 'Pooja Iyer (Admin)',
    email: 'admin@solarflow.demo',
    mobile: '9876500002',
    password: 'Admin@123',
    role: 'admin',
  },
  sales: {
    name: 'Amit Verma (Sales)',
    email: 'sales@solarflow.demo',
    mobile: '9876500001',
    password: 'Sales@123',
    role: 'sales',
  },
};

export async function ensureDemoCompanyUsers() {
  await connectToDatabase();

  for (const key of Object.keys(DEMO_COMPANY_USERS)) {
    const creds = DEMO_COMPANY_USERS[key];
    const exists = await User.findOne({ email: creds.email });
    if (!exists) {
      const hashed = await bcrypt.hash(creds.password, 10);
      await User.create({
        name: creds.name,
        email: creds.email,
        mobile: creds.mobile,
        password: hashed,
        role: creds.role,
      });
    }
  }
}

export async function getCompanyCurrentUser() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('sf_company_user');
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
