import Config from 'react-native-config';

export const RAZORPAY_KEY_ID = Config.RAZORPAY_KEY_ID || '';

export const IS_RAZORPAY_KEY_CONFIGURED =
  !!RAZORPAY_KEY_ID && RAZORPAY_KEY_ID !== 'YOUR_RAZORPAY_KEY_ID_HERE';
