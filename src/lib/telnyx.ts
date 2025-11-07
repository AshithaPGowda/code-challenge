/**
 * Telnyx SMS API Integration
 * 
 * Handles SMS messaging through Telnyx Messaging API v2
 * Documentation: https://developers.telnyx.com/docs/api/messaging
 */

interface TelnyxSMSRequest {
  from: string;
  to: string;
  text: string;
}

interface TelnyxSMSResponse {
  data: {
    id: string;
    record_type: string;
    direction: string;
    from: {
      phone_number: string;
      carrier: string;
      line_type: string;
    };
    to: Array<{
      phone_number: string;
      status: string;
      carrier: string;
      line_type: string;
    }>;
    text: string;
    media: any[];
    webhook_url: string;
    webhook_failover_url: string;
    encoding: string;
    parts: number;
    tags: string[];
    cost: {
      amount: string;
      currency: string;
    };
    received_at: string;
    sent_at: string;
    completed_at: string;
    valid_until: string;
    errors: any[];
  };
}

interface TelnyxErrorResponse {
  errors: Array<{
    code: string;
    title: string;
    detail: string;
    source?: {
      pointer: string;
    };
  }>;
}

/**
 * Send SMS message using Telnyx Messaging API
 * @param to - Recipient phone number (E.164 format recommended)
 * @param message - SMS message text (max 1600 chars)
 * @returns Promise<boolean> - Success status
 */
export async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    // Validate environment variables
    const apiKey = process.env.TELNYX_API_KEY;
    const fromNumber = process.env.TELNYX_PHONE_NUMBER;
    
    if (!apiKey || !fromNumber) {
      console.error('[Telnyx SMS] Missing environment variables:');
      if (!apiKey) console.error('  - TELNYX_API_KEY is required');
      if (!fromNumber) console.error('  - TELNYX_PHONE_NUMBER is required');
      return false;
    }
    
    // Validate inputs
    if (!to || !message) {
      console.error('[Telnyx SMS] Invalid parameters: to and message are required');
      return false;
    }
    
    // Validate message length (Telnyx supports up to 1600 characters)
    if (message.length > 1600) {
      console.error(`[Telnyx SMS] Message too long: ${message.length} chars (max 1600)`);
      return false;
    }
    
    // Clean phone number (remove any non-digit characters except +)
    const cleanTo = to.replace(/[^+0-9]/g, '');
    
    console.log(`[Telnyx SMS] Sending SMS to ${cleanTo} (${message.length} chars)`);
    
    const requestBody: TelnyxSMSRequest = {
      from: fromNumber,
      to: cleanTo,
      text: message
    };
    
    const response = await fetch('https://api.telnyx.com/v2/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Telnyx-I9-System/1.0'
      },
      body: JSON.stringify(requestBody)
    });
    
    // Handle response
    if (!response.ok) {
      const errorData: TelnyxErrorResponse = await response.json();
      console.error('[Telnyx SMS] API Error:', {
        status: response.status,
        statusText: response.statusText,
        errors: errorData.errors
      });
      
      // Log specific error details
      errorData.errors?.forEach(error => {
        console.error(`[Telnyx SMS] Error ${error.code}: ${error.title} - ${error.detail}`);
      });
      
      return false;
    }
    
    const responseData: TelnyxSMSResponse = await response.json();
    
    // Check for successful delivery status
    const deliveryStatus = responseData.data.to[0]?.status;
    const messageId = responseData.data.id;
    
    console.log(`[Telnyx SMS] Message sent successfully:`, {
      id: messageId,
      to: cleanTo,
      status: deliveryStatus,
      parts: responseData.data.parts,
      cost: responseData.data.cost
    });
    
    return true;
    
  } catch (error) {
    console.error('[Telnyx SMS] Network or parsing error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      to,
      messageLength: message.length
    });
    return false;
  }
}

/**
 * Send SMS notification when I-9 form is submitted for HR review
 * @param phone - Employee phone number
 * @returns Promise<boolean> - Success status
 */
export async function sendI9SubmittedSMS(phone: string): Promise<boolean> {
  const message = `✅ Your I-9 Employment Eligibility Verification form has been submitted successfully! Our HR team will review your information within 24 hours and notify you of the status. Thank you for your prompt submission! - Telnyx`;
  
  console.log(`[I-9 SMS] Sending submission confirmation to ${phone}`);
  return await sendSMS(phone, message);
}

/**
 * Send SMS notification when I-9 form is approved with PDF link
 * @param phone - Employee phone number  
 * @param pdfUrl - URL to the approved PDF document
 * @returns Promise<boolean> - Success status
 */
export async function sendI9ApprovedSMS(phone: string, pdfUrl: string): Promise<boolean> {
  const message = `🎉 Excellent news! Your I-9 form has been approved by our HR team. Your completed and signed PDF document is now ready for download: ${pdfUrl} Please save this document for your records. Welcome aboard! - Telnyx`;
  
  console.log(`[I-9 SMS] Sending approval notification to ${phone}`);
  return await sendSMS(phone, message);
}

/**
 * Send SMS notification when I-9 form needs corrections
 * @param phone - Employee phone number
 * @param reason - Specific corrections needed from HR
 * @returns Promise<boolean> - Success status  
 */
export async function sendI9RejectedSMS(phone: string, reason: string): Promise<boolean> {
  const message = `📝 Your I-9 form requires some updates before approval. HR feedback: "${reason}" Please review and resubmit your form with the requested changes. Contact our HR team at hr@telnyx.com if you have any questions. Thank you! - Telnyx`;
  
  console.log(`[I-9 SMS] Sending correction request to ${phone}`);
  return await sendSMS(phone, message);
}

/**
 * Validate phone number format for SMS
 * @param phone - Phone number to validate
 * @returns boolean - True if valid format
 */
export function isValidSMSNumber(phone: string): boolean {
  // Basic E.164 format validation: +[country code][number]
  // Supports US/Canada (+1) and international formats
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  const cleanPhone = phone.replace(/[^+0-9]/g, '');
  
  return e164Regex.test(cleanPhone);
}

/**
 * Format phone number to E.164 standard
 * @param phone - Phone number in various formats
 * @returns string - E.164 formatted number or original if invalid
 */
export function formatPhoneForSMS(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^+0-9]/g, '');
  
  // If no country code and looks like US number, add +1
  if (!cleaned.startsWith('+') && cleaned.length === 10) {
    cleaned = '+1' + cleaned;
  }
  
  // If starts with 1 but no +, add +
  if (!cleaned.startsWith('+') && cleaned.startsWith('1') && cleaned.length === 11) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

/**
 * Get SMS sending statistics and cost estimation
 * @param messageLength - Length of message in characters
 * @returns object - SMS parts and estimated cost info
 */
export function getSMSInfo(messageLength: number): {
  parts: number;
  estimatedCostUSD: string;
  encoding: string;
} {
  // SMS encoding rules
  const isGSM7 = /^[A-Za-z0-9 !"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~€\n\r\f]*$/.test(''); // Simplified
  const encoding = isGSM7 ? 'GSM-7' : 'UCS-2';
  const maxLength = encoding === 'GSM-7' ? 160 : 70;
  const concatenatedLength = encoding === 'GSM-7' ? 153 : 67;
  
  // Calculate parts
  let parts = 1;
  if (messageLength > maxLength) {
    parts = Math.ceil(messageLength / concatenatedLength);
  }
  
  // Estimated cost (Telnyx pricing varies by destination)
  const costPerPart = 0.004; // Approximate US SMS cost
  const estimatedCost = (parts * costPerPart).toFixed(4);
  
  return {
    parts,
    estimatedCostUSD: estimatedCost,
    encoding
  };
}