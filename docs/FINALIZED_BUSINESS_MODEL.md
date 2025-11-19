# 🎯 Medibook: Finalized Business Model

**Document Status**: FINAL ✅  
**Effective Date**: 2025-01-XX  
**Review Cycle**: Quarterly

---

## Executive Summary

**Business Model**: B2B SaaS - Doctors Pay Per Booking

**Revenue Model**: Commission-based (doctor pays per appointment)

**Target Market**: Healthcare providers (doctors) and patients

**Key Differentiator**: AI voice assistant (VAPI) for 24/7 appointment booking

**Payment Model**: 
- Patients pay doctor's price only (no platform fee)
- Doctors pay commission to platform per booking
- Commission shown upfront when doctor sets up appointment packages

---

## 💰 Revenue Model

### Primary Revenue Stream: Doctor Commission Per Booking

**How It Works:**
- Patient pays doctor's price only (no platform fee visible to patient)
- Doctor pays commission to platform when appointment is CONFIRMED
- Commission structure shown to doctor when setting up appointment packages

**Pricing Structure:**
```
Platform Commission: $3 per appointment
OR
3-5% of appointment value (whichever is higher)
Minimum: $2
Maximum: $10
```

**Examples:**
- Doctor sets $50 appointment → Doctor pays $3 commission → Patient pays $50
- Doctor sets $100 appointment → Doctor pays $3 commission → Patient pays $100
- Doctor sets $200 appointment → Doctor pays $6 commission (3%) → Patient pays $200
- Doctor sets $500 appointment → Doctor pays $10 commission (max) → Patient pays $500

**Key Point**: Patient never sees or pays platform fee. Doctor pays commission from their revenue.

### Secondary Revenue Stream: VAPI Usage (Future)

**Phase 1 (Launch)**: Included in commission
- 1 free VAPI call per appointment (5 min max)
- Additional calls: $0.10/minute

**Phase 2 (After 6 months)**: Optional premium
- Unlimited VAPI calls: $9.99/month for patients
- Or included in doctor subscription tiers

---

## 💳 Payment Flow

### Package Setup Flow (Doctor)

```
1. Doctor creates appointment type/package
   └─> Sets: Name, Duration, Price (e.g., $100)

2. System calculates commission
   └─> Shows: "You'll pay $3 commission per booking"
   └─> Displays: "Patient pays: $100 | Your revenue: $97"

3. Doctor confirms package setup
   └─> Package is active and visible to patients
```

### Booking Flow (Patient)

```
1. Patient selects doctor & appointment type
   └─> Sees: Doctor's price only (e.g., $100)
   └─> No platform fee visible

2. Patient enters payment information
   └─> Stripe processes: $100 (doctor's price)

3. Payment confirmed
   └─> Patient pays: $100 to doctor
   └─> Appointment status: PENDING

4. Doctor confirms appointment
   └─> Status: CONFIRMED
   └─> Doctor charged: $3 commission (via saved payment method)
   └─> Email sent to patient & doctor
```

### Commission Collection Flow

```
1. Appointment status changes to CONFIRMED
   └─> Trigger: Commission charge

2. System charges doctor's payment method
   └─> Amount: $3 (or calculated commission)
   └─> Via Stripe (doctor's saved card)

3. Commission recorded
   └─> Added to doctor's monthly invoice
   └─> Visible in doctor dashboard

4. Monthly billing
   └─> All commissions for the month
   └─> Charged at end of billing cycle
   └─> Or charged immediately (per booking)
```

### Cancellation & Refund Policy

**Patient Refund (Doctor Handles):**
- Doctor manages patient refunds (their payment, their policy)
- Platform doesn't handle patient refunds

**Commission Refund Policy:**

| Time Before Appointment | Commission Status |
|------------------------|-------------------|
| **24+ hours** | Full refund to doctor ($3) |
| **1-24 hours** | 50% refund to doctor ($1.50) |
| **<1 hour** | No refund (commission kept) |
| **No-show** | No refund (commission kept) |

**Rationale:**
- 24+ hours: Fair cancellation, refund commission to doctor
- 1-24 hours: Partial refund (platform keeps $1.50, refunds $1.50)
- <1 hour: No refund (prevents last-minute cancellations)
- No-show: No refund (doctor got booking, patient didn't show)

---

## 🏥 Doctor Onboarding

### Free to Join
- No setup fees
- No monthly subscription required
- Simple verification process

### Doctor Requirements
1. Medical license verification
2. Professional credentials
3. Profile setup (bio, speciality, availability)
4. **Payment method on file** (for commission charges)
5. Appointment package setup (with commission preview)

### Doctor Benefits
- ✅ Free to list
- ✅ Pay only when they get bookings (commission model)
- ✅ Transparent pricing (see commission when setting up packages)
- ✅ No monthly fees
- ✅ Access to patient booking platform
- ✅ VAPI voice assistant for patients
- ✅ Patients pay doctor's price only (no platform fee visible)

### Package Setup Experience

When doctor creates appointment type:
```
┌─────────────────────────────────────┐
│ Create Appointment Package           │
├─────────────────────────────────────┤
│ Name: Regular Checkup               │
│ Duration: 60 minutes                │
│ Price: $100                          │
│                                      │
│ 💰 Commission Preview:              │
│ • Platform fee: $3 per booking       │
│ • Patient pays: $100                 │
│ • Your revenue: $97 per booking      │
│                                      │
│ [Save Package]                       │
└─────────────────────────────────────┘
```

---

## 👥 Patient Experience

### Free to Use Platform
- No subscription fees
- No membership required
- No platform fees visible
- Pay only doctor's price when booking

### Patient Benefits
- ✅ Easy appointment booking
- ✅ 24/7 AI voice assistant (VAPI)
- ✅ Transparent pricing (doctor's price only)
- ✅ Secure payment processing
- ✅ Appointment reminders
- ✅ No hidden platform fees
- ✅ Direct payment to doctor

---

## 📊 Financial Projections

### Revenue Per Appointment
```
Platform Commission: $3.00
Stripe Processing:   -$0.30 (2.9% + $0.30)
Net Revenue:        $2.70 per appointment
```

**Note**: Commission charged to doctor, not patient. Patient pays doctor's price directly.

### Monthly Revenue Scenarios

**Conservative (Year 1)**
- 1,000 appointments/month
- Revenue: $2,700/month
- Annual: $32,400

**Moderate (Year 1-2)**
- 5,000 appointments/month
- Revenue: $13,500/month
- Annual: $162,000

**Optimistic (Year 2-3)**
- 10,000 appointments/month
- Revenue: $27,000/month
- Annual: $324,000

### Growth Trajectory

| Month | Doctors | Appointments/Month | MRR | Annual Run Rate |
|-------|---------|-------------------|-----|-----------------|
| 1-3   | 20-50   | 500-1,500         | $1,350-4,050 | $16K-49K |
| 4-6   | 50-100  | 2,000-5,000       | $5,400-13,500 | $65K-162K |
| 7-12  | 100-200 | 5,000-10,000      | $13,500-27,000 | $162K-324K |

---

## 🛡️ Risk Mitigation

### Fraud Prevention
✅ **Charge at CONFIRMED** - Doctor pays when confirming appointment (can't avoid)
✅ **Stripe secure processing** - PCI compliant
✅ **Payment method required** - Doctor must have card on file
✅ **Automatic charging** - No manual invoicing needed

### No-Show Management
✅ **Commission kept on no-shows** - Platform still earns
✅ **Doctor handles patient refunds** - Their payment, their policy
✅ **Clear cancellation policy** - Commission refund based on timing

### VAPI Cost Control
✅ **1 free call per appointment** - Included in commission
✅ **Rate limiting** - Prevents abuse
✅ **Usage tracking** - Monitor and alert
✅ **Future premium option** - Additional revenue stream

---

## 🚀 Implementation Phases

### Phase 1: MVP Launch (Months 1-3)
**Goal**: Prove the model works

- [ ] Stripe setup for doctor payment methods
- [ ] Commission calculation in package setup
- [ ] Charge-at-CONFIRMED logic
- [ ] Commission refund handling
- [ ] Doctor onboarding (10-20 doctors)
- [ ] Beta testing

**Success Metrics:**
- 100+ appointments booked
- $300+ MRR (from commissions)
- <5% cancellation rate
- 90%+ commission collection rate

### Phase 2: Scale (Months 4-6)
**Goal**: Grow to sustainable revenue

- [ ] Optimize payment flow
- [ ] Automated payout system
- [ ] VAPI integration with limits
- [ ] Doctor dashboard improvements
- [ ] Marketing & growth (50-100 doctors)

**Success Metrics:**
- 1,000+ appointments/month
- $2,700+ MRR
- 100+ active doctors
- <10% churn rate

### Phase 3: Optimize (Months 7-12)
**Goal**: Maximize efficiency and revenue

- [ ] Advanced analytics
- [ ] Premium VAPI features
- [ ] Subscription option for high-volume doctors
- [ ] Mobile app (optional)
- [ ] Expand to more specialties

**Success Metrics:**
- 5,000+ appointments/month
- $13,500+ MRR
- 200+ active doctors
- <5% churn rate

---

## 📋 Key Operational Policies

### Commission Structure
- **Standard**: $3 per appointment (or 3-5% if higher)
- **Minimum**: $2 per appointment
- **Maximum**: $10 per appointment
- **Charged**: When appointment status = CONFIRMED
- **Shown**: Upfront when doctor sets up packages
- **Review**: Quarterly pricing review

### Commission Collection
- **Timing**: Immediately when appointment CONFIRMED
- **Method**: Stripe charge to doctor's saved payment method
- **Frequency**: Per booking (real-time)
- **Billing**: Can batch monthly or charge immediately
- **Refund**: Based on cancellation timing (see refund policy)

### Refund Policy
- **24+ hours**: Full refund (platform absorbs fee)
- **1-24 hours**: 50% refund (platform keeps fee)
- **<1 hour**: No refund
- **No-show**: No refund (doctor gets paid)

### VAPI Usage
- **Included**: 1 call per appointment (5 min max)
- **Additional**: $0.10/minute
- **Rate limits**: 10 calls/day per patient
- **Abuse prevention**: IP-based throttling

---

## 🎯 Success Metrics (KPIs)

### Revenue Metrics
- **MRR**: Monthly Recurring Revenue (from appointments)
- **ARPU**: Average Revenue Per User (per doctor)
- **Take Rate**: Platform fee / Total transaction value
- **Target**: $2.70 net per appointment

### Growth Metrics
- **New Doctors**: Doctors onboarded per month
- **New Patients**: Patient signups per month
- **Appointments**: Total bookings per month
- **Activation Rate**: % of doctors with 1+ booking

### Operational Metrics
- **Payment Success Rate**: >95%
- **Payout Success Rate**: >99%
- **Cancellation Rate**: <15%
- **No-Show Rate**: <10%
- **Dispute Rate**: <1%

### Quality Metrics
- **Doctor Satisfaction**: NPS >50
- **Patient Satisfaction**: NPS >60
- **Platform Uptime**: >99.5%
- **Support Response Time**: <24 hours

---

## 🔄 Future Enhancements

### Phase 2 Features (6-12 months)
1. **Subscription Option**: For high-volume doctors
   - $49/month = 50 appointments included
   - $99/month = 150 appointments included
   - Overage: $2 per appointment

2. **Premium VAPI**: Patient subscription
   - $9.99/month for unlimited VAPI calls
   - Or included in doctor subscription

3. **Advanced Analytics**: For doctors
   - Revenue tracking
   - Patient insights
   - Booking trends

4. **Multi-Location**: Support clinics
   - Multiple doctors per account
   - Centralized billing
   - Location management

### Phase 3 Features (12+ months)
1. **Insurance Integration**: Accept insurance
2. **Telemedicine**: Virtual appointments
3. **Mobile Apps**: iOS & Android
4. **API Access**: For integrations
5. **White-Label**: For large practices

---

## 📝 Legal & Compliance

### Required
- ✅ **Stripe Terms**: Accept Stripe's terms of service
- ✅ **Privacy Policy**: HIPAA-compliant data handling
- ✅ **Terms of Service**: Clear user agreements
- ✅ **Refund Policy**: Clearly stated and accessible

### Recommended
- ✅ **Business License**: Local business registration
- ✅ **Tax ID**: EIN for business
- ✅ **Insurance**: General liability insurance
- ✅ **Data Security**: HIPAA compliance measures

### Future Considerations
- **Money Transmitter License**: If holding funds >30 days
- **State Licenses**: If expanding to multiple states
- **International**: If expanding globally

---

## 🎬 Next Steps (Action Items)

### Immediate (Week 1)
1. ✅ **Finalize Business Model**: This document
2. ✅ **Set Up Stripe Account**: Get API keys
3. ✅ **Design Database Schema**: Payment models
4. ✅ **Plan Implementation**: Timeline & resources

### Short-term (Month 1)
1. **Stripe Connect Setup**: For doctor payouts
2. **Payment Integration**: Add to booking flow
3. **Payout System**: Auto-pay after appointments
4. **Refund Logic**: Time-based cancellation

### Medium-term (Months 2-3)
1. **VAPI Integration**: With usage limits
2. **Doctor Dashboard**: Payment tracking
3. **Patient Dashboard**: Booking history
4. **Beta Testing**: With 10-20 doctors

### Long-term (Months 4-6)
1. **Scale Operations**: 50-100 doctors
2. **Optimize Systems**: Based on data
3. **Marketing**: Growth campaigns
4. **Feature Additions**: Based on feedback

---

## 📊 Competitive Analysis

### How We Compare

| Feature | Medibook | Zocdoc | SimplePractice |
|---------|----------|--------|----------------|
| **Pricing Model** | Per-appointment ($3) | Monthly ($299) | Monthly ($39-159) |
| **Patient Cost** | Pay per booking | Free | Free |
| **Doctor Cost** | Commission only | High monthly | Monthly subscription |
| **VAPI/AI** | ✅ Included | ❌ No | ❌ No |
| **Barrier to Entry** | Very Low | High | Medium |
| **Payment Collection** | Patient pays upfront | Doctor handles | Doctor handles |

### Competitive Advantages
1. ✅ **Lower barrier** - Free for doctors, pay-per-use
2. ✅ **AI voice assistant** - Unique feature
3. ✅ **Patient pays** - Better cash flow
4. ✅ **No monthly fees** - Attractive to new doctors
5. ✅ **Transparent pricing** - Clear commission model

---

## 🏁 Final Business Model Summary

### Revenue Model
**Primary**: $3 commission per appointment (doctor pays when confirming)
**Secondary**: VAPI usage fees (future)

### Payment Flow
1. Doctor sets up package → Sees commission preview
2. Patient books → Pays doctor's price only ($100)
3. Doctor confirms → Platform charges $3 commission
4. Doctor receives: $97 net revenue

### Key Differentiators
- ✅ AI voice assistant (VAPI)
- ✅ Doctor pays commission (not patient)
- ✅ No monthly fees for doctors
- ✅ Transparent commission shown upfront
- ✅ Patients pay doctor's price only (no platform fee visible)

### Success Targets (Year 1)
- 100+ active doctors
- 5,000+ appointments/month
- $13,500+ MRR
- <10% churn rate

---

**Document Owner**: Medibook Team  
**Last Updated**: 2025-01-XX  
**Next Review**: Quarterly  
**Status**: ✅ FINALIZED - Ready for Implementation

---

## 📞 Questions & Support

For questions about this business model:
- Review this document
- Check implementation guides
- Contact: [Your contact info]

**Remember**: This model is designed to be:
- ✅ Simple to understand
- ✅ Easy to implement
- ✅ Fair for all parties
- ✅ Scalable for growth
- ✅ Proven in marketplace models

**Let's build this! 🚀**

