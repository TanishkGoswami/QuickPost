// ============================================================================
// SupermailBox CPaaS Client SDK (src/lib/emailClient.ts alias)
// Drop this file into any of your 4-5 projects to manage all outbound emails.
// ============================================================================
export interface SupermailboxUser {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  attributes?: Record<string, any>;
}
export interface SendEmailRequest {
  to: string;
  templateKey: string;
  idempotencyKey?: string;
  variables?: Record<string, any>;
}
export interface SendBroadcastRequest {
  campaignName: string;
  templateKey: string;
  recipients: Array<{ email: string; full_name?: string; attributes?: Record<string, any> }>;
  notifyEmail?: string;
  webhookUrl?: string;
  scheduledAt?: string;
}
export class SupermailboxClient {
  private baseUrl: string;
  private apiKey: string;
  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || process.env.SUPERMAILBOX_API_KEY || '';
    this.baseUrl = baseUrl || process.env.SUPERMAILBOX_BASE_URL || 'http://localhost:5050';
  }
  /**
   * 1. Synchronize user profile with SupermailBox central contact repository.
   * Call this on User Signup or Profile Update.
   */
  async syncUser(user: SupermailboxUser): Promise<{ success: boolean; contactId?: string }> {
    if (process.env.MAIL_ON !== 'true') return { success: true };
    try {
      const response = await fetch(`${this.baseUrl}/v1/contacts/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify({
          productUserId: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          attributes: user.attributes
        })
      });
      return await response.json();
    } catch (error) {
      console.error('[SupermailBox SDK] Contact sync failed:', error);
      return { success: false };
    }
  }
  /**
   * 2. Dispatch a high-priority transactional email (Payment receipt, OTP, Welcome).
   */
  async sendEmail(request: SendEmailRequest): Promise<{ success: boolean; jobId?: string }> {
    if (process.env.MAIL_ON !== 'true') return { success: true };
    try {
      const response = await fetch(`${this.baseUrl}/v1/send/transactional`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify({
          to: request.to,
          templateKey: request.templateKey,
          idempotencyKey: request.idempotencyKey || `tx_${Date.now()}_${Math.random()}`,
          variables: request.variables || {}
        })
      });
      return await response.json();
    } catch (error) {
      console.error('[SupermailBox SDK] Send email failed:', error);
      return { success: false };
    }
  }
  /**
   * 3. Launch a bulk/marketing email broadcast with explicit confirmation support.
   */
  async sendBroadcast(request: SendBroadcastRequest): Promise<{ success: boolean; campaignId?: string; queuedCount?: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify(request)
      });
      return await response.json();
    } catch (error) {
      console.error('[SupermailBox SDK] Send broadcast failed:', error);
      return { success: false };
    }
  }
}
// Singleton export initialized with environment secrets
export const supermailbox = new SupermailboxClient();
export const emailClient = supermailbox;
