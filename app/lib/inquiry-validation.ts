import {
  INQUIRY_EMAIL_MAX,
  INQUIRY_MESSAGE_MAX,
  INQUIRY_MESSAGE_MIN,
  INQUIRY_NAME_MAX,
  INQUIRY_PHONE_MAX,
  InquiryFormData,
  InquiryFormErrors,
} from "@/app/types/inquiry";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInquiryForm(data: InquiryFormData): InquiryFormErrors {
  const errors: InquiryFormErrors = {};

  const buyerName = data.buyerName.trim();
  const buyerEmail = data.buyerEmail.trim();
  const buyerPhone = data.buyerPhone.trim();
  const message = data.message.trim();

  if (!buyerName) {
    errors.buyerName = "Name is required.";
  } else if (buyerName.length > INQUIRY_NAME_MAX) {
    errors.buyerName = `Name must be ${INQUIRY_NAME_MAX} characters or fewer.`;
  }

  if (!buyerEmail) {
    errors.buyerEmail = "Email is required.";
  } else if (!emailPattern.test(buyerEmail)) {
    errors.buyerEmail = "Enter a valid email address.";
  } else if (buyerEmail.length > INQUIRY_EMAIL_MAX) {
    errors.buyerEmail = `Email must be ${INQUIRY_EMAIL_MAX} characters or fewer.`;
  }

  if (buyerPhone && buyerPhone.length > INQUIRY_PHONE_MAX) {
    errors.buyerPhone = `Phone must be ${INQUIRY_PHONE_MAX} characters or fewer.`;
  }

  if (!message) {
    errors.message = "Message is required.";
  } else if (message.length < INQUIRY_MESSAGE_MIN) {
    errors.message = `Message must be at least ${INQUIRY_MESSAGE_MIN} characters.`;
  } else if (message.length > INQUIRY_MESSAGE_MAX) {
    errors.message = `Message must be ${INQUIRY_MESSAGE_MAX} characters or fewer.`;
  }

  return errors;
}

export function normalizeInquiryForm(data: InquiryFormData): InquiryFormData {
  return {
    buyerName: data.buyerName.trim(),
    buyerEmail: data.buyerEmail.trim(),
    buyerPhone: data.buyerPhone.trim(),
    message: data.message.trim(),
  };
}
