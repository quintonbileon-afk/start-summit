export interface RegistrationData {
  fullName: string;
  company: string;
  role: string;
  physicalAddress: string;
  mobileNumber: string;
  email: string;
  registrationType: 'attendant' | 'exhibitor' | 'partner';
  participantCategory: string;
  businessSector: string;
  ticketOption: 'standard' | 'starter' | '';
  specialRequirements: string;
  declarationAccepted: boolean;
  
  // Exhibitor Specific
  website: string;
  exhibitorCategory: string;
  productsExhibited: string;
  exhibitionRequirements: string[];

  // Partner Specific
  partnershipCategory: string;
  partnershipInterest: string;

  // Ticket Verification and Check-in Info
  ticketId?: string;
  checkedIn?: boolean;
  checkedInAt?: any;
}
