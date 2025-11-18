declare module 'razorpay' {
  export interface RazorpayOptions {
    key_id: string;
    key_secret: string;
  }

  export interface RazorpayPaymentLinkCreateParams {
    amount: number;
    currency: string;
    customer?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    notes?: Record<string, string>;
    reminder_enable?: boolean;
  }

  export interface RazorpayPaymentLink {
    id: string;
    status?: string;
  }

  export interface RazorpayPaymentLinkApi {
    create(params: RazorpayPaymentLinkCreateParams): Promise<RazorpayPaymentLink>;
  }

  export default class Razorpay {
    constructor(options: RazorpayOptions);
    paymentLink: RazorpayPaymentLinkApi;
  }
}
